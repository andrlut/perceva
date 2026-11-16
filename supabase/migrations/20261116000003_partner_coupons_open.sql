-- partner_coupons_open — os cupons da campanha ficam ABERTOS e o desafio vira
-- um extra (decisão Artur/André, 2026-11-16, primeira parceria):
--
--   * Qualquer pessoa resgata o cupom básico (10%) na hora, sem sequência.
--   * O cupom Premium (17%) exige ser Premium, também sem sequência.
--   * Quem é Premium pode resgatar OS DOIS (um resgate por tier por pessoa):
--     a chave de partner_coupon_claim passa a (campaign_id, character_id,
--     tier). Free que tenta o Premium continua recebendo premium_required
--     (o app mostra o convite).
--   * O desafio (entrar, escolher a prática, 4 dias seguidos) continua
--     existindo como participação extra, sem destravar nada: unlocked_at e
--     secure_partner_unlock seguem marcando quem fechou.
--
-- changed table: partner_coupon_claim — pk (campaign_id, character_id, tier)
-- changed rpcs:  claim_partner_coupon(text, date, text) — sem exigir
--                sequência nem entrada prévia (entra na hora); um por tier
--                partner_campaign_status(text, date) — +claimed_free,
--                +claimed_premium, +code_free, +code_premium; `unlocked`
--                passa a significar só "fechou o desafio" (não mais o claim);
--                `claimed`/`tier`/`coupon_code` = o resgate mais recente
--                (compat com o app anterior a esta mudança)
-- data:          paker-health com pitch/reward reescritos
--
-- ORDEM: aplicar ANTES do promote. O app em produção (modelo anterior)
-- continua funcionando: só vê a trava do desafio na tela até receber o OTA,
-- e um toque no resgate já sai sem a trava.

begin;

-- ─── 1. Um resgate por tier ─────────────────────────────────────────────────

alter table public.partner_coupon_claim
  drop constraint if exists partner_coupon_claim_pkey;

alter table public.partner_coupon_claim
  add primary key (campaign_id, character_id, tier);

comment on table public.partner_coupon_claim is
  'Quem pegou qual cupom (um resgate por tier por pessoa; o claimed_at fica). Escrita só por claim_partner_coupon. Desde 2026-11-16 não depende da sequência.';

-- ─── 2. Textos da campanha ──────────────────────────────────────────────────

update public.partner_campaign
set pitch_pt = 'Seus cupons da Paker Health já estão na aba Recompensas: 10% pra todo mundo, 17% pra assinantes Premium. Quer um extra? Escolha uma prática e marque todo dia.',
    pitch_en = 'Your Paker Health coupons are already in the Rewards tab: 10% for everyone, 17% for Premium subscribers. Want an extra? Pick a practice and check it off every day.',
    reward_pt = 'Cupons de desconto na Paker Health',
    reward_en = 'Paker Health discount coupons'
where id = 'paker-health';

-- ─── 3. claim_partner_coupon: aberto, um por tier ───────────────────────────

create or replace function public.claim_partner_coupon(
  p_campaign_id text,
  p_today       date,
  p_tier        text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_uid        uuid := auth.uid();
  v_campaign   public.partner_campaign%rowtype;
  v_streak     integer;
  v_is_premium boolean := false;
  v_tier       text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_today is null or p_today < current_date - 1 or p_today > current_date + 1 then
    raise exception 'invalid_local_date' using detail = coalesce(p_today::text, 'null');
  end if;
  v_tier := case when p_tier = 'premium' then 'premium' else 'free' end;

  select * into v_campaign
  from public.partner_campaign c
  where c.id = p_campaign_id
    and c.is_active
    and c.starts_at <= now()
    and (c.ends_at is null or c.ends_at > now());
  if not found then
    raise exception 'campaign_not_found' using detail = coalesce(p_campaign_id, 'null');
  end if;

  if v_tier = 'premium' and v_campaign.reward_premium_pct is null then
    raise exception 'tier_not_offered';
  end if;
  if v_tier = 'free' and v_campaign.reward_free_pct is null then
    raise exception 'tier_not_offered';
  end if;

  if v_tier = 'premium' then
    select (p.subscription_tier = 'premium') into v_is_premium
    from public.profile p where p.id = v_uid;
    if not coalesce(v_is_premium, false) then
      raise exception 'premium_required';
    end if;
  end if;

  -- resgatar já entra no programa (o primeiro joined_at fica)
  insert into public.partner_campaign_member (campaign_id, character_id, source)
  values (v_campaign.id, v_uid, 'app')
  on conflict (campaign_id, character_id) do nothing;

  -- a sequência vai no registro só como contexto (quantos dias a pessoa
  -- tinha quando pegou); não decide nada
  select s.streak_days into v_streak
  from public._partner_streak(v_campaign.id, v_uid, p_today) s;

  insert into public.partner_coupon_claim (campaign_id, character_id, streak_at_claim, tier)
  values (v_campaign.id, v_uid, coalesce(v_streak, 0), v_tier)
  on conflict (campaign_id, character_id, tier) do nothing;

  return public.partner_campaign_status(v_campaign.id, p_today);
end
$fn$;

revoke execute on function public.claim_partner_coupon(text, date, text) from public, anon;
grant execute on function public.claim_partner_coupon(text, date, text) to authenticated;

comment on function public.claim_partner_coupon(text, date, text) is
  'Campanha de parceiro: resgata o cupom do tier (free | premium) na hora, sem sequência; entra no programa se ainda não entrou; premium exige profile.subscription_tier = premium (premium_required). Um resgate por tier por pessoa. Devolve partner_campaign_status.';

-- ─── 4. partner_campaign_status: um estado por tier ────────────────────────

create or replace function public.partner_campaign_status(
  p_campaign_id text,
  p_today       date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_uid             uuid := auth.uid();
  v_campaign        public.partner_campaign%rowtype;
  v_joined_at       timestamptz;
  v_unlocked_at     timestamptz;
  v_task_id         uuid;
  v_track           text;
  v_streak          integer;
  v_skips           integer;
  v_done_today      boolean;
  v_claimed_free    timestamptz;
  v_claimed_premium timestamptz;
  v_last_at         timestamptz;
  v_last_tier       text;
  v_code_free       text;
  v_code_premium    text;
  v_is_premium      boolean := false;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_today is null or p_today < current_date - 1 or p_today > current_date + 1 then
    raise exception 'invalid_local_date' using detail = coalesce(p_today::text, 'null');
  end if;

  select max(cl.claimed_at) filter (where cl.tier = 'free'),
         max(cl.claimed_at) filter (where cl.tier = 'premium')
    into v_claimed_free, v_claimed_premium
  from public.partner_coupon_claim cl
  where cl.campaign_id = p_campaign_id and cl.character_id = v_uid;

  -- quem já resgatou lê a campanha fora da janela (os códigos chegam
  -- depois, e só por aqui); pra todo o resto, só a janela ativa
  select * into v_campaign
  from public.partner_campaign c
  where c.id = p_campaign_id
    and (
      v_claimed_free is not null or v_claimed_premium is not null
      or (c.is_active
          and c.starts_at <= now()
          and (c.ends_at is null or c.ends_at > now()))
    );
  if not found then
    raise exception 'campaign_not_found' using detail = coalesce(p_campaign_id, 'null');
  end if;

  select m.joined_at, m.unlocked_at into v_joined_at, v_unlocked_at
  from public.partner_campaign_member m
  where m.campaign_id = v_campaign.id and m.character_id = v_uid;

  select t.id, coalesce(t.origin_template_id, t.template_id)
    into v_task_id, v_track
  from public.task t
  where t.character_id = v_uid
    and t.is_archived = false
    and coalesce(t.origin_template_id, t.template_id) in (
      select v_campaign.template_id
      union
      select k.template_id from public.partner_campaign_track k
      where k.campaign_id = v_campaign.id
    )
  order by t.created_at desc
  limit 1;

  select s.streak_days, s.skips_used, s.done_today
    into v_streak, v_skips, v_done_today
  from public._partner_streak(v_campaign.id, v_uid, p_today) s;

  select nullif(btrim(sec.coupon_code_free), ''),
         nullif(btrim(sec.coupon_code_premium), '')
    into v_code_free, v_code_premium
  from public.partner_campaign_secret sec
  where sec.campaign_id = v_campaign.id;

  select (p.subscription_tier = 'premium') into v_is_premium
  from public.profile p
  where p.id = v_uid;

  -- compat: o resgate mais recente é "o" claim pro app anterior
  if v_claimed_premium is not null and (v_claimed_free is null or v_claimed_premium >= v_claimed_free) then
    v_last_at := v_claimed_premium; v_last_tier := 'premium';
  elsif v_claimed_free is not null then
    v_last_at := v_claimed_free; v_last_tier := 'free';
  end if;

  return jsonb_build_object(
    'campaign_id',        v_campaign.id,
    'member',             v_joined_at is not null,
    'joined_at',          v_joined_at,
    'adopted',            v_task_id is not null,
    'task_id',            v_task_id,
    'track_template_id',  v_track,
    'done_today',         coalesce(v_done_today, false),
    'streak_days',        coalesce(v_streak, 0),
    'skips_used',         coalesce(v_skips, 0),
    'max_skips',          v_campaign.max_skips,
    'goal',               v_campaign.streak_goal,
    -- o desafio (extra): fechou os dias, agora ou um dia
    'unlocked',           v_unlocked_at is not null
                            or coalesce(v_streak, 0) >= v_campaign.streak_goal,
    'secured',            v_unlocked_at is not null,
    'is_premium',         coalesce(v_is_premium, false),
    'reward_free_pct',    v_campaign.reward_free_pct,
    'reward_premium_pct', v_campaign.reward_premium_pct,
    'free_code_ready',    v_code_free is not null,
    'premium_code_ready', v_code_premium is not null,
    -- um estado por tier
    'claimed_free',       v_claimed_free is not null,
    'claimed_premium',    v_claimed_premium is not null,
    'code_free',          case when v_claimed_free is not null then v_code_free end,
    'code_premium',       case when v_claimed_premium is not null then v_code_premium end,
    -- compat (app anterior a 2026-11-16): o resgate mais recente
    'claimed',            v_last_at is not null,
    'claimed_at',         v_last_at,
    'tier',               v_last_tier,
    'coupon_ready',       case when v_last_tier = 'premium' then v_code_premium is not null
                               else v_code_free is not null end,
    'coupon_code',        case when v_last_at is null then null
                               when v_last_tier = 'premium' then v_code_premium
                               else v_code_free end,
    'perceva_code_ready', false,
    'perceva_code',       null
  );
end
$fn$;

comment on function public.partner_campaign_status(text, date) is
  'Campanha de parceiro: estado da pessoa. Cupons abertos desde 2026-11-16: claimed_free / claimed_premium e code_free / code_premium (código só depois do resgate daquele tier). unlocked = fechou o desafio (extra). claimed / tier / coupon_code = o resgate mais recente (compat).';

-- ─── 5. Guarda ──────────────────────────────────────────────────────────────

do $guard$
declare
  v_missing text[] := '{}';
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.partner_coupon_claim'::regclass and contype = 'p'
      and array_length(conkey, 1) = 3
  ) then
    v_missing := array_append(v_missing, 'partner_coupon_claim com pk de 3 colunas');
  end if;
  if position('streak_not_reached' in
       pg_get_functiondef('public.claim_partner_coupon(text, date, text)'::regprocedure)) > 0 then
    v_missing := array_append(v_missing, 'claim_partner_coupon ainda exige a sequência');
  end if;
  if position('claimed_premium' in
       pg_get_functiondef('public.partner_campaign_status(text, date)'::regprocedure)) = 0 then
    v_missing := array_append(v_missing, 'partner_campaign_status com claimed_premium');
  end if;
  if array_length(v_missing, 1) > 0 then
    raise exception 'partner_coupons_open: faltou %', array_to_string(v_missing, '; ');
  end if;
  raise notice 'partner_coupons_open: cupons abertos (um por tier), desafio como extra';
end
$guard$;

commit;
