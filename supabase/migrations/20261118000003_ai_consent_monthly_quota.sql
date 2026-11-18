-- migration: 20261118000003_ai_consent_monthly_quota.sql
-- purpose: o que falta pra abrir o "Conte seu dia" pra todo mundo (decisão do
--          André, 18/11): consentimento LGPD gravado no servidor e a cota de
--          60 pedidos grátis por mês, contada no razão que já existe.
--
--   1. ai_consent: o aceite da pessoa. Uma linha por aceite; revogar carimba
--      revoked_at (a linha fica — é a prova do consentimento, LGPD art. 8º
--      §2º). Vale a única linha sem revoked_at (índice parcial único). Quem
--      escreve são as RPCs abaixo; o app só lê a própria linha.
--   2. app_config `ai` ganha `free_per_month` (60) e `consent_version` (1).
--      O merge preserva o que já está lá: open_to_all, allowlist e tetos NÃO
--      mudam aqui — abrir é decisão do André, depois de testar.
--   3. ai_begin (mesma assinatura) passa a recusar sem aceite vigente
--      (`no_consent`) e com a cota do mês gasta (`rate_month`), além de tudo
--      que já fazia. Vale pra TODA feature que passa por aqui.
--   4. ai_access (mesmo retorno jsonb) passa a contar o mês e dizer se há
--      aceite — o app desenha a tela de consentimento e o "restam N de 60".
--   5. ai_consent_grant(int) / ai_consent_revoke(): RPCs do app.
--
-- affected tables: ai_consent (nova), app_config (linha ai: 2 chaves novas)
-- new rpcs:        ai_consent_grant(integer), ai_consent_revoke() —
--                  authenticated; ai_begin e ai_access trocam de corpo
-- breaking?        no — mesma assinatura e mesmo tipo de retorno; os campos
--                  novos do jsonb são aditivos. O app antigo (sem tela de
--                  consentimento) recebe `no_consent`, que cai no texto
--                  genérico de falha — só a allowlist (o André) tem acesso.
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   mês = America/Sao_Paulo, a mesma régua do dia (_ai_day_start).
--   a cota mensal conta só o bucket 'free' (usage −1, refund +1): quando os
--     pacotes pagos chegarem, o bucket 'paid' não come o grátis.
--   trocar o texto da tela de consentimento de forma material = subir
--     `consent_version` no app_config (junto com o texto novo no app): quem
--     aceitou a versão anterior volta a ver a tela.

begin;

-- 1. ai_consent -----------------------------------------------------------------

create table if not exists public.ai_consent (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  version     smallint not null check (version >= 1),
  granted_at  timestamptz not null default now(),
  revoked_at  timestamptz,
  constraint ai_consent_revoked_after check (revoked_at is null or revoked_at >= granted_at)
);

create unique index if not exists ai_consent_one_active
  on public.ai_consent (user_id) where revoked_at is null;
create index if not exists ai_consent_user_time
  on public.ai_consent (user_id, granted_at desc);

comment on table public.ai_consent is
  'Aceite da IA do app (Conte seu dia). Uma linha por aceite; revogar carimba '
  'revoked_at e a linha fica como prova. Escrita só pelas RPCs ai_consent_*.';

alter table public.ai_consent enable row level security;

drop policy if exists "ai_consent_self_read" on public.ai_consent;
create policy "ai_consent_self_read" on public.ai_consent
  for select to authenticated using (user_id = auth.uid());

-- O grant padrão do Supabase dá ALL em tabela nova. O app só lê a própria.
revoke all on public.ai_consent from public, anon, authenticated;
grant select on public.ai_consent to authenticated;

-- 2. app_config: as chaves novas, sem sobrescrever nada ------------------------

update public.app_config
   set value = jsonb_build_object('free_per_month', 60, 'consent_version', 1) || value
 where key = 'ai';

-- 3. Helpers internos ------------------------------------------------------------
-- SECURITY INVOKER de propósito: só são chamados de dentro das funções
-- definer abaixo (que já rodam como dono), e ninguém de fora os executa.

-- Início do mês local (America/Sao_Paulo) como timestamptz.
create or replace function public._ai_month_start()
returns timestamptz
language sql
stable
set search_path = public
as $$
  select (date_trunc('month', now() at time zone 'America/Sao_Paulo'))
         at time zone 'America/Sao_Paulo';
$$;

revoke execute on function public._ai_month_start() from public, anon, authenticated;

-- Versão do aceite vigente da pessoa (null = sem aceite).
create or replace function public._ai_consent_version(p_user uuid)
returns integer
language sql
stable
set search_path = public
as $$
  select c.version::integer
    from public.ai_consent c
   where c.user_id = p_user and c.revoked_at is null
   limit 1;
$$;

revoke execute on function public._ai_consent_version(uuid) from public, anon, authenticated;

-- Pedidos grátis gastos no mês (reservados e não devolvidos).
create or replace function public._ai_used_month(p_user uuid)
returns integer
language sql
stable
set search_path = public
as $$
  select greatest(coalesce(-sum(l.delta), 0), 0)::integer
    from public.ai_credit_ledger l
   where l.user_id = p_user
     and l.kind in ('usage', 'refund')
     and l.bucket = 'free'
     and l.created_at >= public._ai_month_start();
$$;

revoke execute on function public._ai_used_month(uuid) from public, anon, authenticated;

-- 4. ai_begin — agora com aceite e cota do mês (service_role) -------------------

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
  v_cfg         jsonb;
  v_per_minute  integer;
  v_per_day     integer;
  v_per_month   integer;
  v_consent_req integer;
  v_consent     integer;
  v_cap_micros  bigint;
  v_day_start   timestamptz := public._ai_day_start();
  v_minute      integer;
  v_used        integer;
  v_used_month  integer;
  v_attempts    integer;
  v_cost        bigint;
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

  v_per_minute  := coalesce((v_cfg ->> 'per_minute')::integer, 6);
  v_per_day     := coalesce((v_cfg ->> 'per_day')::integer, 30);
  v_per_month   := coalesce((v_cfg ->> 'free_per_month')::integer, 60);
  v_consent_req := coalesce((v_cfg ->> 'consent_version')::integer, 1);
  v_cap_micros  := round(coalesce((v_cfg ->> 'daily_usd_cap')::numeric, 2) * 1000000);

  -- Pedidos simultâneos da mesma pessoa entram em fila aqui: sem isso, dois
  -- toques no mesmo segundo liam a mesma contagem e furavam a cota.
  perform pg_advisory_xact_lock(hashtextextended('ai:' || p_user::text, 0));

  -- Sem aceite vigente (ou aceite de uma versão anterior do texto), nada sai
  -- daqui pro modelo: o que a pessoa conta do dia é dado de saúde.
  v_consent := public._ai_consent_version(p_user);
  if v_consent is null or v_consent < v_consent_req then
    return jsonb_build_object('ok', false, 'reason', 'no_consent',
                              'consent_version', v_consent_req);
  end if;

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

  -- Cota do mês: os grátis da pessoa, mesma conta (devolvido não conta).
  v_used_month := public._ai_used_month(p_user);
  if v_used_month >= v_per_month then
    return jsonb_build_object('ok', false, 'reason', 'rate_month',
                              'used_month', v_used_month, 'per_month', v_per_month);
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
    'per_day', v_per_day,
    'used_month', v_used_month + 1,
    'per_month', v_per_month
  );
end $$;

revoke execute on function public.ai_begin(uuid, text, text) from public, anon, authenticated;
grant execute on function public.ai_begin(uuid, text, text) to service_role;

-- 5. ai_access — a caixa aparece? há aceite? quanto resta no mês? (app) ---------

create or replace function public.ai_access()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid         uuid := auth.uid();
  v_cfg         jsonb;
  v_allowed     boolean;
  v_per_day     integer;
  v_per_month   integer;
  v_consent_req integer;
  v_consent     integer;
  v_used        integer;
begin
  if v_uid is null then
    return jsonb_build_object('enabled', false);
  end if;

  select value into v_cfg from public.app_config where key = 'ai';
  v_consent_req := coalesce((v_cfg ->> 'consent_version')::integer, 1);
  v_consent := public._ai_consent_version(v_uid);

  v_allowed := v_cfg is not null
    and coalesce((v_cfg ->> 'enabled')::boolean, false)
    and (
      coalesce((v_cfg ->> 'open_to_all')::boolean, false)
      or coalesce(v_cfg -> 'allow_user_ids', '[]'::jsonb) ? v_uid::text
    );
  if not v_allowed then
    -- O aceite segue visível: revogar em Ajustes não pode depender da IA
    -- estar ligada pra esta conta.
    return jsonb_build_object('enabled', false, 'consent', v_consent is not null);
  end if;

  v_per_day   := coalesce((v_cfg ->> 'per_day')::integer, 30);
  v_per_month := coalesce((v_cfg ->> 'free_per_month')::integer, 60);
  select coalesce(-sum(delta), 0) into v_used
    from public.ai_credit_ledger
   where user_id = v_uid and kind in ('usage', 'refund')
     and created_at >= public._ai_day_start();

  return jsonb_build_object(
    'enabled', true,
    'consent', v_consent is not null and v_consent >= v_consent_req,
    'consent_version', v_consent_req,
    'used_today', greatest(v_used, 0),
    'per_day', v_per_day,
    'used_month', public._ai_used_month(v_uid),
    'per_month', v_per_month,
    'max_chars', coalesce((v_cfg ->> 'max_chars')::integer, 1500)
  );
end $$;

revoke execute on function public.ai_access() from public, anon;
grant execute on function public.ai_access() to authenticated;

-- 6. ai_consent_grant — a pessoa aceita a versão que leu (app) ------------------

create or replace function public.ai_consent_grant(p_version integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_req     integer;
  v_current integer;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select coalesce((value ->> 'consent_version')::integer, 1) into v_req
    from public.app_config where key = 'ai';
  v_req := coalesce(v_req, 1);

  -- O app aceita o texto que mostrou. Texto mais velho que o exigido não vale
  -- (o app desatualizado pede pra atualizar); o teto só segura lixo.
  if p_version is null or p_version < v_req or p_version > 1000 then
    return jsonb_build_object('ok', false, 'reason', 'outdated', 'consent_version', v_req);
  end if;

  perform pg_advisory_xact_lock(hashtextextended('ai_consent:' || v_uid::text, 0));

  v_current := public._ai_consent_version(v_uid);
  if v_current is not null and v_current >= p_version then
    return jsonb_build_object('ok', true, 'version', v_current);
  end if;

  -- Liga-desliga sem fim enche a tabela de prova: teto de 20 aceites em 24 h.
  if (
    select count(*) from public.ai_consent
     where user_id = v_uid and granted_at > now() - interval '24 hours'
  ) >= 20 then
    raise exception 'too many consent changes' using errcode = '54000';
  end if;

  -- Aceite de versão nova encerra o anterior.
  update public.ai_consent
     set revoked_at = now()
   where user_id = v_uid and revoked_at is null;

  insert into public.ai_consent (user_id, version)
  values (v_uid, p_version::smallint);

  return jsonb_build_object('ok', true, 'version', p_version);
end $$;

revoke execute on function public.ai_consent_grant(integer) from public, anon;
grant execute on function public.ai_consent_grant(integer) to authenticated;

-- 7. ai_consent_revoke — desligar em Ajustes (app) ------------------------------

create or replace function public.ai_consent_revoke()
returns boolean
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

  update public.ai_consent
     set revoked_at = now()
   where user_id = v_uid and revoked_at is null;

  return found;
end $$;

revoke execute on function public.ai_consent_revoke() from public, anon;
grant execute on function public.ai_consent_revoke() to authenticated;

commit;
