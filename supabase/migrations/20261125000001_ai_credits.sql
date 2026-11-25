-- migration: 20261125000001_ai_credits.sql
-- purpose: créditos de IA (decisão do André, 25/11). A IA do app deixa de ser
--          uma allowlist com "60 grátis por mês" e vira um benefício do
--          Premium contado em CRÉDITOS: o Premium ganha 40 por mês, cada
--          envio do "Conte seu dia" gasta 1, e o que a IA não aproveitou
--          (falhou, não entendeu, texto longo demais) volta sozinho.
--
--   1. app_config `ai`, por merge (o que já está lá fica):
--        credits_per_month  40      — os créditos do mês. Renovam no dia 1º
--                                     (America/Sao_Paulo) e NÃO acumulam.
--        credit_cost        {"day_voice": 1, "week": 0}
--                                     — quanto cada feature gasta. Feature
--                                     sem preço na tabela gasta 1 (o padrão
--                                     seguro pra uma feature nova).
--        premium_open       false   — O FLAG DE ABERTURA. Desligado, só a
--                                     allowlist entra (igual a hoje). Ligado,
--                                     todo Premium entra. Quem liga é a
--                                     sessão coordenadora, depois da chave
--                                     de módulo `contedia` estar no ar.
--      Saem `free_per_month` (virou credits_per_month) e `open_to_all`
--      (abria pro free, que não tem a feature: módulos são Premium).
--      Ficam: `enabled` (kill-switch), `allow_user_ids` (override de teste,
--      ganha os créditos mesmo sem Premium), per_minute, per_day,
--      daily_usd_cap, max_chars, model, consent_version.
--
--   2. ai_credit_ledger continua o razão (só inserção, só números). O
--      vocabulário que já existia cobre os créditos:
--        kind 'monthly'  +40  bucket 'free'  ref '<uid>:<AAAA-MM>'
--                              os créditos do mês, gravados no 1º gasto do
--                              mês (uma linha por pessoa e mês, pelo
--                              unique (kind, ref)).
--        kind 'purchase' +N   bucket 'paid'  ref = id da transação da loja
--                              (FUTURO: pacote comprado; nada escreve isso
--                              ainda — o webhook do RevenueCat não muda).
--        kind 'usage'    −c   bucket do saldo que pagou  ref = request id
--        kind 'refund'   +c   o mesmo bucket do usage     ref = request id
--        kind 'adjust'   ±N   'free' (só o mês) ou 'paid' (sem validade)
--      Saldo do mês = soma do bucket 'free' no mês (com o grant que ainda
--      não foi gravado contando como os 40 da config). Saldo pago = soma do
--      bucket 'paid', sem validade. O gasto sai primeiro do mês, depois do
--      pago.
--
--   3. Portão novo (helper _ai_entitled): enabled E (allowlist OU
--      (premium_open E profile.subscription_tier = 'premium')).
--
--   4. ai_begin (mesma assinatura): o portão novo, o aceite, os tetos de
--      sempre (6/min, 30/dia, teto global em US$) e o saldo de créditos;
--      sem crédito a recusa segue `rate_month` (o app já tem a tela pra ela).
--      ai_settle (mesma assinatura): o estorno devolve o que o usage tirou,
--      no mesmo bucket, com a data do gasto (cai no mesmo dia e mês).
--      ai_access (mesmo retorno jsonb, campos novos aditivos): o saldo.
--
-- affected tables: app_config (linha ai), ai_credit_ledger (comentário)
-- new rpcs:        none — ai_begin, ai_settle e ai_access trocam de corpo;
--                  helpers internos _ai_month_key, _ai_entitled, _ai_credits;
--                  sai _ai_used_month
-- breaking?        no — mesmas assinaturas e tipos de retorno. used_month e
--                  per_month continuam no jsonb (agora em créditos), então o
--                  app que está na loja mostra "Restam N de 40" sem update.
--                  Com premium_open=false ninguém novo entra: pra quem não
--                  está na allowlist nada muda até o flag ser ligado.
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   mês = America/Sao_Paulo (_ai_month_start), a régua de sempre.
--   o Resumo da semana custa 0 crédito de propósito: o app gera sozinho na
--     segunda, é no máximo 1 por semana (cache em week_insight) e custa
--     ~US$ 0,0005. Cobrar faria o crédito sumir sem a pessoa pedir. Ele
--     continua passando pelo ai_begin (aceite, kill-switch, tetos). Mudar o
--     preço = um update em credit_cost, sem migration.
--   custo medido no razão (25/11): Conte seu dia US$ 0,0011 por envio, pior
--     caso ~US$ 0,002 (2048 tokens de saída). 19 Premium × 40 créditos ×
--     US$ 0,002 = US$ 1,52/mês no pior caso.
--   gasto maior que 1 (feature futura): sai inteiro de um saldo só (o do
--     mês, senão o pago); não divide entre os dois.

begin;

-- 1. app_config: as chaves novas, sem sobrescrever o resto ---------------------

update public.app_config
   set value = (
         jsonb_build_object(
           'credits_per_month', 40,
           'credit_cost', jsonb_build_object('day_voice', 1, 'week', 0),
           'premium_open', false
         ) || value
       ) - 'free_per_month' - 'open_to_all'
 where key = 'ai';

comment on table public.ai_credit_ledger is
  'Razão dos créditos de IA (só inserção, só números — nunca texto). '
  'monthly +N free (os créditos do mês, ref <uid>:<AAAA-MM>); purchase +N paid '
  '(pacote, futuro); usage −c no bucket que pagou; refund +c no mesmo bucket; '
  'adjust ±N; outcome = métricas do cartão (delta 0). Escrita só pelas RPCs ai_*.';

-- 2. Helpers internos ------------------------------------------------------------
-- SECURITY INVOKER de propósito: só são chamados de dentro das funções
-- definer abaixo (que rodam como dono), e ninguém de fora os executa.

-- O mês local (America/Sao_Paulo) como 'AAAA-MM' — a chave do grant do mês.
create or replace function public._ai_month_key()
returns text
language sql
stable
set search_path = public
as $$
  select to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM');
$$;

revoke execute on function public._ai_month_key() from public, anon, authenticated;

-- Esta conta tem a IA? enabled E (allowlist OU (premium_open E Premium)).
create or replace function public._ai_entitled(p_user uuid, p_cfg jsonb)
returns boolean
language sql
stable
set search_path = public
as $$
  select p_cfg is not null
     and coalesce((p_cfg ->> 'enabled')::boolean, false)
     and (
       coalesce(p_cfg -> 'allow_user_ids', '[]'::jsonb) ? p_user::text
       or (
         coalesce((p_cfg ->> 'premium_open')::boolean, false)
         and exists (
           select 1 from public.profile p
            where p.id = p_user and p.subscription_tier = 'premium'
         )
       )
     );
$$;

revoke execute on function public._ai_entitled(uuid, jsonb) from public, anon, authenticated;

-- O saldo da pessoa. p_default = os créditos do mês pela config, usados
-- enquanto o grant deste mês ainda não foi gravado (antes do 1º gasto).
--   month_total  os créditos do mês (o grant gravado, senão p_default)
--   month_left   o que resta deles (bucket 'free' no mês, nunca < 0)
--   paid_left    o saldo de pacotes (bucket 'paid', sem validade, nunca < 0)
create or replace function public._ai_credits(p_user uuid, p_default integer)
returns table (month_total integer, month_left integer, paid_left integer)
language sql
stable
set search_path = public
as $$
  with g as (
    select l.delta
      from public.ai_credit_ledger l
     where l.kind = 'monthly'
       and l.ref = p_user::text || ':' || public._ai_month_key()
  ),
  f as (
    select coalesce(sum(l.delta), 0)::integer as s
      from public.ai_credit_ledger l
     where l.user_id = p_user
       and l.bucket = 'free'
       and l.kind in ('monthly', 'usage', 'refund', 'adjust')
       and l.created_at >= public._ai_month_start()
  ),
  p as (
    select coalesce(sum(l.delta), 0)::integer as s
      from public.ai_credit_ledger l
     where l.user_id = p_user
       and l.bucket = 'paid'
       and l.kind in ('purchase', 'usage', 'refund', 'adjust')
  )
  select
    coalesce((select g.delta from g), p_default),
    greatest(
      (select f.s from f)
        + case when exists (select 1 from g) then 0 else p_default end,
      0
    ),
    greatest((select p.s from p), 0);
$$;

revoke execute on function public._ai_credits(uuid, integer) from public, anon, authenticated;

-- 3. ai_begin — portão Premium + créditos (service_role) -------------------------

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
  v_cost        integer;
  v_consent_req integer;
  v_consent     integer;
  v_cap_micros  bigint;
  v_day_start   timestamptz := public._ai_day_start();
  v_minute      integer;
  v_used        integer;
  v_attempts    integer;
  v_usd         bigint;
  v_total       integer;
  v_month_left  integer;
  v_paid_left   integer;
  v_bucket      text;
begin
  if p_user is null or coalesce(btrim(p_ref), '') = '' then
    raise exception 'ai_begin: user and ref are required';
  end if;

  select value into v_cfg from public.app_config where key = 'ai';
  if v_cfg is null or not coalesce((v_cfg ->> 'enabled')::boolean, false) then
    return jsonb_build_object('ok', false, 'reason', 'disabled');
  end if;

  if not public._ai_entitled(p_user, v_cfg) then
    return jsonb_build_object('ok', false, 'reason', 'not_allowed');
  end if;

  v_per_minute  := coalesce((v_cfg ->> 'per_minute')::integer, 6);
  v_per_day     := coalesce((v_cfg ->> 'per_day')::integer, 30);
  v_per_month   := greatest(coalesce((v_cfg ->> 'credits_per_month')::integer, 40), 0);
  v_cost        := greatest(coalesce((v_cfg -> 'credit_cost' ->> p_feature)::integer, 1), 0);
  v_consent_req := coalesce((v_cfg ->> 'consent_version')::integer, 1);
  v_cap_micros  := round(coalesce((v_cfg ->> 'daily_usd_cap')::numeric, 2) * 1000000);

  -- Pedidos simultâneos da mesma pessoa entram em fila aqui: sem isso, dois
  -- toques no mesmo segundo liam o mesmo saldo e gastavam o mesmo crédito.
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

  -- Teto do dia = créditos gastos e não devolvidos hoje (usage −c, refund +c).
  select coalesce(-sum(delta), 0), count(*) filter (where kind = 'usage')
    into v_used, v_attempts
    from public.ai_credit_ledger
   where user_id = p_user and kind in ('usage', 'refund')
     and created_at >= v_day_start;
  if v_used >= v_per_day then
    return jsonb_build_object('ok', false, 'reason', 'rate_day',
                              'used_today', v_used, 'per_day', v_per_day);
  end if;
  -- Falha não gasta crédito, mas custa: tentativas têm teto próprio.
  if v_attempts >= v_per_day * 3 then
    return jsonb_build_object('ok', false, 'reason', 'rate_day',
                              'used_today', v_used, 'per_day', v_per_day);
  end if;

  -- O saldo. O grant do mês só é gravado quando há gasto de verdade.
  if v_cost > 0 then
    insert into public.ai_credit_ledger (user_id, kind, ref, delta, bucket)
    values (p_user, 'monthly', p_user::text || ':' || public._ai_month_key(), v_per_month, 'free')
    on conflict (kind, ref) do nothing;
  end if;

  select c.month_total, c.month_left, c.paid_left
    into v_total, v_month_left, v_paid_left
    from public._ai_credits(p_user, v_per_month) c;

  if v_cost > 0 then
    if v_month_left >= v_cost then
      v_bucket := 'free';
    elsif v_paid_left >= v_cost then
      v_bucket := 'paid';
    else
      -- Sem crédito. `rate_month` é a recusa que o app já sabe mostrar.
      return jsonb_build_object('ok', false, 'reason', 'rate_month',
                                'used_month', greatest(v_total - v_month_left, 0),
                                'per_month', v_total,
                                'credits_left', v_month_left + v_paid_left,
                                'credits_month', v_total,
                                'cost', v_cost);
    end if;
  end if;

  -- Teto global do dia, somado no razão (todas as pessoas).
  select coalesce(sum(cost_usd_micros), 0) into v_usd
    from public.ai_credit_ledger
   where kind = 'usage' and created_at >= v_day_start;
  if v_usd >= v_cap_micros then
    return jsonb_build_object('ok', false, 'reason', 'budget');
  end if;

  insert into public.ai_credit_ledger
    (user_id, kind, ref, delta, bucket, feature, status, model)
  values
    (p_user, 'usage', p_ref, -v_cost, v_bucket, p_feature, 'pending', v_cfg ->> 'model');

  if v_bucket = 'free' then
    v_month_left := v_month_left - v_cost;
  elsif v_bucket = 'paid' then
    v_paid_left := v_paid_left - v_cost;
  end if;

  return jsonb_build_object(
    'ok', true,
    'model', coalesce(v_cfg ->> 'model', 'claude-haiku-5-5'),
    'max_chars', coalesce((v_cfg ->> 'max_chars')::integer, 1500),
    'cost', v_cost,
    'used_today', v_used + v_cost,
    'per_day', v_per_day,
    'used_month', greatest(v_total - v_month_left, 0),
    'per_month', v_total,
    'credits_left', v_month_left + v_paid_left,
    'credits_month', v_total
  );
end $$;

revoke execute on function public.ai_begin(uuid, text, text) from public, anon, authenticated;
grant execute on function public.ai_begin(uuid, text, text) to service_role;

-- 4. ai_settle — o estorno devolve o que o gasto tirou (service_role) -----------

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
  v_user    uuid;
  v_delta   integer;
  v_bucket  text;
  v_feature text;
  v_at      timestamptz;
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
  returning user_id, delta, bucket, feature, created_at
       into v_user, v_delta, v_bucket, v_feature, v_at;

  if v_user is null then
    raise exception 'ai_settle: no pending request %', p_ref;
  end if;

  -- O crédito volta quando a IA falhou ou não entendeu: o mesmo valor, no
  -- mesmo bucket, com a data do gasto — um gasto às 23h59 do dia 30 não
  -- vira crédito extra no mês seguinte. Gasto 0 (o Resumo da semana) não
  -- tem o que devolver.
  if p_status in ('empty', 'failed') and v_delta < 0 then
    insert into public.ai_credit_ledger (user_id, kind, ref, delta, bucket, feature, created_at)
    values (v_user, 'refund', p_ref, -v_delta, v_bucket, v_feature, v_at)
    on conflict (kind, ref) do nothing;
  end if;
end $$;

revoke execute on function public.ai_settle(text, text, integer, integer, integer, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.ai_settle(text, text, integer, integer, integer, integer, integer, integer)
  to service_role;

-- 5. ai_access — a caixa aparece? há aceite? quantos créditos? (app) -----------

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
  v_per_day     integer;
  v_per_month   integer;
  v_consent_req integer;
  v_consent     integer;
  v_used        integer;
  v_total       integer;
  v_month_left  integer;
  v_paid_left   integer;
begin
  if v_uid is null then
    return jsonb_build_object('enabled', false);
  end if;

  select value into v_cfg from public.app_config where key = 'ai';
  v_consent_req := coalesce((v_cfg ->> 'consent_version')::integer, 1);
  v_consent := public._ai_consent_version(v_uid);

  if not public._ai_entitled(v_uid, v_cfg) then
    -- O aceite segue visível: revogar em Ajustes não pode depender da IA
    -- estar ligada pra esta conta (nem de ela ainda ser Premium).
    return jsonb_build_object('enabled', false, 'consent', v_consent is not null);
  end if;

  v_per_day   := coalesce((v_cfg ->> 'per_day')::integer, 30);
  v_per_month := greatest(coalesce((v_cfg ->> 'credits_per_month')::integer, 40), 0);
  select coalesce(-sum(delta), 0) into v_used
    from public.ai_credit_ledger
   where user_id = v_uid and kind in ('usage', 'refund')
     and created_at >= public._ai_day_start();

  select c.month_total, c.month_left, c.paid_left
    into v_total, v_month_left, v_paid_left
    from public._ai_credits(v_uid, v_per_month) c;

  return jsonb_build_object(
    'enabled', true,
    'consent', v_consent is not null and v_consent >= v_consent_req,
    'consent_version', v_consent_req,
    'used_today', greatest(v_used, 0),
    'per_day', v_per_day,
    -- Em créditos desde 20261125000001 (o app da loja lê estes dois).
    'used_month', greatest(v_total - v_month_left, 0),
    'per_month', v_total,
    'credits_left', v_month_left + v_paid_left,
    'credits_month', v_total,
    'credits_month_left', v_month_left,
    'credits_paid', v_paid_left,
    'credit_cost', coalesce(v_cfg -> 'credit_cost', '{}'::jsonb),
    'renews_on', ((date_trunc('month', now() at time zone 'America/Sao_Paulo')
                   + interval '1 month')::date),
    'max_chars', coalesce((v_cfg ->> 'max_chars')::integer, 1500)
  );
end $$;

revoke execute on function public.ai_access() from public, anon;
grant execute on function public.ai_access() to authenticated;

-- 6. O helper antigo sai (só ai_begin e ai_access o chamavam) ------------------

drop function if exists public._ai_used_month(uuid);

commit;
