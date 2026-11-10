-- migration: 20261110000001_ai_day_voice.sql
-- purpose: Base da IA nativa — "Conte seu dia por voz". A pessoa dita o dia,
--          a Edge Function perceva-ai pede ao Claude Haiku 5.5 um RASCUNHO
--          (humor, tags, nota, práticas feitas/puladas) e o app grava só
--          depois do toque em Registrar, com as RPCs de sempre.
--
--   1. app_config ganha a linha `ai` (liga/desliga, allowlist, modelo, teto
--      diário em US$, limites por pessoa). A linha é só do servidor: a
--      policy de leitura pública passa a excluir a chave `ai` (a allowlist
--      são ids de conta, não são pra todo mundo ler).
--   2. ai_credit_ledger: o razão só de inserção do desenho do artifact
--      (kind = monthly | purchase | usage | refund | adjust | outcome).
--      Nesta fase não há carteira: o "crédito" é a cota do dia. Cada pedido
--      reserva -1 (usage, pending); se a IA falhar ou não entender, o
--      acerto grava o uso real e devolve +1 (refund). NUNCA guarda texto:
--      só tokens, custo em micros de US$, modelo, latência e as métricas de
--      assertividade (linhas propostas, desmarcadas, editadas, confirmou
--      sem mexer).
--   3. RPCs só do service_role (a Edge Function): ai_begin (trava por
--      pessoa, confere liga/allowlist/ritmo/cota/teto global e reserva) e
--      ai_settle (grava o uso real; devolve o crédito em empty/failed).
--   4. RPCs do app (authenticated, auth.uid()): ai_access (a caixa aparece?
--      quanto resta hoje) e ai_record_outcome (as métricas do cartão, uma
--      vez por pedido, só de pedido próprio que deu certo).
--
-- affected tables: app_config (+linha ai, policy de leitura trocada),
--                  ai_credit_ledger (nova)
-- new rpcs:        ai_begin(uuid, text, text), ai_settle(text, text, int,
--                  int, int, int, int, int) — service_role;
--                  ai_access(), ai_record_outcome(text, int, int, int,
--                  boolean) — authenticated
-- breaking?        no — o app só lê a linha android_release do app_config,
--                  que continua pública
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   a allowlist nasce VAZIA: a conta do André entra por uma migration
--     seguinte (ou pelo Studio). Abrir pra todos (open_to_all) só depois da
--     tela de consentimento LGPD.
--   dia = America/Sao_Paulo, a mesma constante do perceva-mcp: o
--     current_date do Postgres é UTC e erraria a cota das 21h à meia-noite.
--   a carteira (ai_credit_wallet) e os pacotes pagos ficam pra fase dos
--     pacotes; o webhook do RevenueCat NÃO foi tocado.

begin;

-- 1. app_config: a linha `ai` é do servidor ----------------------------------

drop policy if exists "app_config_public_read" on public.app_config;
create policy "app_config_public_read" on public.app_config
  for select to authenticated using (key <> 'ai');

insert into public.app_config (key, value) values (
  'ai',
  jsonb_build_object(
    'enabled', true,
    'open_to_all', false,
    'allow_user_ids', '[]'::jsonb,
    'model', 'claude-haiku-5-5',
    'daily_usd_cap', 2,
    'per_minute', 6,
    'per_day', 30,
    'max_chars', 1500
  )
)
on conflict (key) do nothing;

-- 2. ai_credit_ledger ----------------------------------------------------------

create table if not exists public.ai_credit_ledger (
  id                  bigint generated always as identity primary key,
  user_id             uuid not null references auth.users (id) on delete cascade,
  kind                text not null
                        check (kind in ('monthly', 'purchase', 'usage', 'refund', 'adjust', 'outcome')),
  -- request_id (usage/refund/outcome) ou transaction_id (purchase).
  ref                 text not null,
  delta               integer not null default 0,
  bucket              text check (bucket in ('free', 'paid')),
  feature             text,
  status              text check (status in ('pending', 'ok', 'empty', 'failed')),
  model               text,
  tokens_in           integer,
  tokens_out          integer,
  cache_read_tokens   integer,
  cache_write_tokens  integer,
  cost_usd_micros     integer,
  latency_ms          integer,
  lines_proposed      smallint,
  lines_unchecked     smallint,
  lines_edited        smallint,
  confirmed_untouched boolean,
  created_at          timestamptz not null default now(),
  settled_at          timestamptz,
  unique (kind, ref)
);

create index if not exists ai_credit_ledger_user_time
  on public.ai_credit_ledger (user_id, created_at desc);
create index if not exists ai_credit_ledger_usage_time
  on public.ai_credit_ledger (created_at) where kind = 'usage';

alter table public.ai_credit_ledger enable row level security;

drop policy if exists "ai_credit_ledger_self_read" on public.ai_credit_ledger;
create policy "ai_credit_ledger_self_read" on public.ai_credit_ledger
  for select to authenticated using (user_id = auth.uid());

-- O app só lê. Quem escreve são as funções abaixo (security definer).
revoke insert, update, delete, truncate on public.ai_credit_ledger from anon, authenticated;
revoke all on public.ai_credit_ledger from anon;

-- Início do dia local (America/Sao_Paulo) como timestamptz.
create or replace function public._ai_day_start()
returns timestamptz
language sql
stable
set search_path = public
as $$
  select (date_trunc('day', now() at time zone 'America/Sao_Paulo'))
         at time zone 'America/Sao_Paulo';
$$;

revoke execute on function public._ai_day_start() from public, anon, authenticated;

-- 3. ai_begin — reserva um pedido (service_role) -------------------------------

create or replace function public.ai_begin(
  p_user    uuid,
  p_ref     text,
  p_feature text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cfg        jsonb;
  v_per_minute integer;
  v_per_day    integer;
  v_cap_micros bigint;
  v_day_start  timestamptz := public._ai_day_start();
  v_minute     integer;
  v_used       integer;
  v_attempts   integer;
  v_cost       bigint;
begin
  if p_user is null or coalesce(btrim(p_ref), '') = '' then
    raise exception 'ai_begin: user and ref are required';
  end if;

  select value into v_cfg from public.app_config where key = 'ai';
  if v_cfg is null or not coalesce((v_cfg ->> 'enabled')::boolean, false) then
    return jsonb_build_object('ok', false, 'reason', 'disabled');
  end if;

  if not (
    coalesce((v_cfg ->> 'open_to_all')::boolean, false)
    or coalesce(v_cfg -> 'allow_user_ids', '[]'::jsonb) ? p_user::text
  ) then
    return jsonb_build_object('ok', false, 'reason', 'not_allowed');
  end if;

  v_per_minute := coalesce((v_cfg ->> 'per_minute')::integer, 6);
  v_per_day    := coalesce((v_cfg ->> 'per_day')::integer, 30);
  v_cap_micros := round(coalesce((v_cfg ->> 'daily_usd_cap')::numeric, 2) * 1000000);

  -- Pedidos simultâneos da mesma pessoa entram em fila aqui: sem isso, dois
  -- toques no mesmo segundo liam a mesma contagem e furavam a cota.
  perform pg_advisory_xact_lock(hashtextextended('ai:' || p_user::text, 0));

  select count(*) into v_minute
    from public.ai_credit_ledger
   where user_id = p_user and kind = 'usage'
     and created_at > now() - interval '1 minute';
  if v_minute >= v_per_minute then
    return jsonb_build_object('ok', false, 'reason', 'rate_minute');
  end if;

  -- Cota do dia = o que foi reservado e não devolvido (usage -1, refund +1).
  select coalesce(-sum(delta), 0), count(*) filter (where kind = 'usage')
    into v_used, v_attempts
    from public.ai_credit_ledger
   where user_id = p_user and kind in ('usage', 'refund')
     and created_at >= v_day_start;
  if v_used >= v_per_day then
    return jsonb_build_object('ok', false, 'reason', 'rate_day',
                              'used_today', v_used, 'per_day', v_per_day);
  end if;
  -- Falha não conta na cota, mas custa: tentativas têm teto próprio.
  if v_attempts >= v_per_day * 3 then
    return jsonb_build_object('ok', false, 'reason', 'rate_day',
                              'used_today', v_used, 'per_day', v_per_day);
  end if;

  -- Teto global do dia, somado no razão (todas as pessoas).
  select coalesce(sum(cost_usd_micros), 0) into v_cost
    from public.ai_credit_ledger
   where kind = 'usage' and created_at >= v_day_start;
  if v_cost >= v_cap_micros then
    return jsonb_build_object('ok', false, 'reason', 'budget');
  end if;

  insert into public.ai_credit_ledger
    (user_id, kind, ref, delta, bucket, feature, status, model)
  values
    (p_user, 'usage', p_ref, -1, 'free', p_feature, 'pending', v_cfg ->> 'model');

  return jsonb_build_object(
    'ok', true,
    'model', coalesce(v_cfg ->> 'model', 'claude-haiku-5-5'),
    'max_chars', coalesce((v_cfg ->> 'max_chars')::integer, 1500),
    'used_today', v_used + 1,
    'per_day', v_per_day
  );
end $$;

revoke execute on function public.ai_begin(uuid, text, text) from public, anon, authenticated;
grant execute on function public.ai_begin(uuid, text, text) to service_role;

-- 4. ai_settle — grava o uso real e devolve em falha (service_role) -----------

create or replace function public.ai_settle(
  p_ref         text,
  p_status      text,
  p_tokens_in   integer,
  p_tokens_out  integer,
  p_cache_read  integer,
  p_cache_write integer,
  p_cost_micros integer,
  p_latency_ms  integer
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
begin
  if p_status not in ('ok', 'empty', 'failed') then
    raise exception 'ai_settle: invalid status %', p_status;
  end if;

  update public.ai_credit_ledger
     set status             = p_status,
         tokens_in          = greatest(coalesce(p_tokens_in, 0), 0),
         tokens_out         = greatest(coalesce(p_tokens_out, 0), 0),
         cache_read_tokens  = greatest(coalesce(p_cache_read, 0), 0),
         cache_write_tokens = greatest(coalesce(p_cache_write, 0), 0),
         cost_usd_micros    = greatest(coalesce(p_cost_micros, 0), 0),
         latency_ms         = greatest(coalesce(p_latency_ms, 0), 0),
         settled_at         = now()
   where kind = 'usage' and ref = p_ref and status = 'pending'
  returning user_id into v_user;

  if v_user is null then
    raise exception 'ai_settle: no pending request %', p_ref;
  end if;

  -- O crédito volta quando a IA falhou ou não entendeu.
  if p_status in ('empty', 'failed') then
    insert into public.ai_credit_ledger (user_id, kind, ref, delta, bucket)
    values (v_user, 'refund', p_ref, 1, 'free')
    on conflict (kind, ref) do nothing;
  end if;
end $$;

revoke execute on function public.ai_settle(text, text, integer, integer, integer, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.ai_settle(text, text, integer, integer, integer, integer, integer, integer)
  to service_role;

-- 5. ai_access — a caixa aparece pra esta conta? (app) -------------------------

create or replace function public.ai_access()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_cfg     jsonb;
  v_allowed boolean;
  v_per_day integer;
  v_used    integer;
begin
  if v_uid is null then
    return jsonb_build_object('enabled', false);
  end if;

  select value into v_cfg from public.app_config where key = 'ai';
  v_allowed := v_cfg is not null
    and coalesce((v_cfg ->> 'enabled')::boolean, false)
    and (
      coalesce((v_cfg ->> 'open_to_all')::boolean, false)
      or coalesce(v_cfg -> 'allow_user_ids', '[]'::jsonb) ? v_uid::text
    );
  if not v_allowed then
    return jsonb_build_object('enabled', false);
  end if;

  v_per_day := coalesce((v_cfg ->> 'per_day')::integer, 30);
  select coalesce(-sum(delta), 0) into v_used
    from public.ai_credit_ledger
   where user_id = v_uid and kind in ('usage', 'refund')
     and created_at >= public._ai_day_start();

  return jsonb_build_object(
    'enabled', true,
    'used_today', v_used,
    'per_day', v_per_day,
    'max_chars', coalesce((v_cfg ->> 'max_chars')::integer, 1500)
  );
end $$;

revoke execute on function public.ai_access() from public, anon;
grant execute on function public.ai_access() to authenticated;

-- 6. ai_record_outcome — métricas de assertividade do cartão (app) ------------

create or replace function public.ai_record_outcome(
  p_ref         text,
  p_proposed    integer,
  p_unchecked   integer,
  p_edited      integer,
  p_untouched   boolean
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Só pedido próprio, que deu certo, e uma vez.
  if not exists (
    select 1 from public.ai_credit_ledger
     where kind = 'usage' and ref = p_ref and user_id = v_uid and status = 'ok'
  ) then
    return false;
  end if;

  insert into public.ai_credit_ledger
    (user_id, kind, ref, delta, feature, lines_proposed, lines_unchecked,
     lines_edited, confirmed_untouched)
  select v_uid, 'outcome', p_ref, 0, l.feature,
         least(greatest(coalesce(p_proposed, 0), 0), 100),
         least(greatest(coalesce(p_unchecked, 0), 0), 100),
         least(greatest(coalesce(p_edited, 0), 0), 100),
         coalesce(p_untouched, false)
    from public.ai_credit_ledger l
   where l.kind = 'usage' and l.ref = p_ref
  on conflict (kind, ref) do nothing;

  return found;
end $$;

revoke execute on function public.ai_record_outcome(text, integer, integer, integer, boolean)
  from public, anon;
grant execute on function public.ai_record_outcome(text, integer, integer, integer, boolean)
  to authenticated;

commit;
