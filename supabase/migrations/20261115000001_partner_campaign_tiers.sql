-- partner_campaign_tiers — a recompensa da campanha vira UM cupom do parceiro
-- com DUAS opções de resgate (decisão Artur/André, 2026-11-15):
--
--   free     → cupom básico (Paker: PERCEVAFREE, 10%), pra qualquer pessoa
--              que fechou a sequência. Ao resgatar, o app oferece o Premium
--              uma última vez ("tem certeza? é a última chance de trocar de
--              ideia e pegar um bônus maior").
--   premium  → cupom maior (Paker: PERCEVAPREMIUM, 17%), só pra quem é
--              Premium. Free que tenta pegar recebe o convite pro Premium.
--
-- Uma escolha por campanha: resgatar o free encerra o premium (e vice-versa).
-- O desconto do Perceva Premium (perceva_code) sai da campanha: o incentivo
-- ao Premium passa a ser o tier maior do cupom.
--
-- Pra escolha poder acontecer depois (a pessoa pensa, vê o Premium, volta),
-- o desbloqueio é GARANTIDO sem escolher: secure_partner_unlock grava
-- partner_campaign_member.unlocked_at assim que a sequência fecha (o app
-- chama sozinho, no lugar do claim automático de antes), e o claim com tier
-- aceita unlocked_at OU a sequência viva.
--
-- new columns:   partner_campaign.reward_free_pct / reward_premium_pct,
--                partner_campaign_secret.coupon_code_free / coupon_code_premium,
--                partner_campaign_member.unlocked_at,
--                partner_coupon_claim.tier
-- new rpc:       secure_partner_unlock(text, date)
-- changed rpcs:  partner_campaign_status(text, date) — +is_premium, +secured,
--                +tier, +reward_free_pct, +reward_premium_pct,
--                +free_code_ready, +premium_code_ready; coupon_code = o do
--                tier escolhido; perceva_* sempre false/null (compat)
--                claim_partner_coupon(text, date, text) — p_tier; a versão
--                (text, date) continua existindo e resgata 'free' (o app em
--                produção ainda a chama até o próximo promote)
-- data:          paker-health com 10% / 17%, códigos PERCEVAFREE /
--                PERCEVAPREMIUM, sem desconto do Perceva; claims antigos
--                viram tier 'free'
--
-- ORDEM: aplicar ANTES do promote do app que lê os campos novos (PostgREST
-- responde 400 a coluna desconhecida no select da campanha).

begin;

-- ─── 1. Colunas ─────────────────────────────────────────────────────────────

alter table public.partner_campaign
  add column if not exists reward_free_pct    smallint check (reward_free_pct between 1 and 99),
  add column if not exists reward_premium_pct smallint check (reward_premium_pct between 1 and 99);

comment on column public.partner_campaign.reward_free_pct is
  'Desconto (%) do cupom básico, pra qualquer pessoa que fechou a sequência. NULL = a campanha não tem tier básico.';
comment on column public.partner_campaign.reward_premium_pct is
  'Desconto (%) do cupom maior, só pra assinantes Premium. NULL = sem tier Premium.';

alter table public.partner_campaign_secret
  add column if not exists coupon_code_free    text,
  add column if not exists coupon_code_premium text;

comment on column public.partner_campaign_secret.coupon_code_free is
  'Código do cupom básico (tier free). Só volta pra quem resgatou esse tier.';
comment on column public.partner_campaign_secret.coupon_code_premium is
  'Código do cupom maior (tier premium). Só volta pra quem resgatou esse tier — e o claim só aceita o tier de quem é Premium.';

alter table public.partner_campaign_member
  add column if not exists unlocked_at timestamptz;

comment on column public.partner_campaign_member.unlocked_at is
  'Quando a sequência fechou e o desbloqueio foi garantido (secure_partner_unlock). A partir daí a pessoa escolhe o tier com calma: quebrar a sequência depois não tira o cupom.';

alter table public.partner_coupon_claim
  add column if not exists tier text not null default 'free'
    check (tier in ('free', 'premium'));

comment on column public.partner_coupon_claim.tier is
  'Qual opção foi resgatada: free (cupom básico) ou premium (cupom maior, só assinantes). Uma por campanha.';

-- ─── 2. Dados da Paker ──────────────────────────────────────────────────────

update public.partner_campaign
set reward_free_pct    = 10,
    reward_premium_pct = 17,
    perceva_reward_pt  = null,
    perceva_reward_en  = null,
    pitch_pt = 'Tome o seu suplemento todo dia e libere um cupom de desconto na Paker Health. Assinantes Premium ganham um cupom maior.',
    pitch_en = 'Take your supplement every day and unlock a Paker Health discount coupon. Premium subscribers get a bigger one.',
    reward_pt = 'Cupom de desconto no site da Paker Health',
    reward_en = 'Discount coupon on the Paker Health website'
where id = 'paker-health';

update public.partner_campaign_secret
set coupon_code_free    = coalesce(nullif(btrim(coupon_code_free), ''), 'PERCEVAFREE'),
    coupon_code_premium = coalesce(nullif(btrim(coupon_code_premium), ''), 'PERCEVAPREMIUM')
where campaign_id = 'paker-health';

-- ─── 3. status ──────────────────────────────────────────────────────────────

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
  v_uid          uuid := auth.uid();
  v_campaign     public.partner_campaign%rowtype;
  v_joined_at    timestamptz;
  v_unlocked_at  timestamptz;
  v_task_id      uuid;
  v_streak       integer;
  v_skips        integer;
  v_done_today   boolean;
  v_claimed_at   timestamptz;
  v_tier         text;
  v_code_free    text;
  v_code_premium text;
  v_is_premium   boolean := false;
  v_unlocked     boolean;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_today is null or p_today < current_date - 1 or p_today > current_date + 1 then
    raise exception 'invalid_local_date' using detail = coalesce(p_today::text, 'null');
  end if;

  select cl.claimed_at, cl.tier into v_claimed_at, v_tier
  from public.partner_coupon_claim cl
  where cl.campaign_id = p_campaign_id and cl.character_id = v_uid;

  -- quem já resgatou lê a campanha fora da janela (os códigos chegam
  -- depois, e só por aqui); pra todo o resto, só a janela ativa
  select * into v_campaign
  from public.partner_campaign c
  where c.id = p_campaign_id
    and (
      v_claimed_at is not null
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

  -- a prática da campanha mesmo depois de editada (origem, não o vínculo)
  select t.id into v_task_id
  from public.task t
  where t.character_id = v_uid
    and coalesce(t.origin_template_id, t.template_id) = v_campaign.template_id
    and t.is_archived = false
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

  v_unlocked := v_claimed_at is not null
                or v_unlocked_at is not null
                or coalesce(v_streak, 0) >= v_campaign.streak_goal;

  return jsonb_build_object(
    'campaign_id',        v_campaign.id,
    'member',             v_joined_at is not null,
    'joined_at',          v_joined_at,
    'adopted',            v_task_id is not null,
    'task_id',            v_task_id,
    'done_today',         coalesce(v_done_today, false),
    'streak_days',        coalesce(v_streak, 0),
    'skips_used',         coalesce(v_skips, 0),
    'max_skips',          v_campaign.max_skips,
    'goal',               v_campaign.streak_goal,
    'unlocked',           v_unlocked,
    'secured',            v_unlocked_at is not null,
    'claimed',            v_claimed_at is not null,
    'claimed_at',         v_claimed_at,
    'tier',               v_tier,
    'is_premium',         coalesce(v_is_premium, false),
    'reward_free_pct',    v_campaign.reward_free_pct,
    'reward_premium_pct', v_campaign.reward_premium_pct,
    'free_code_ready',    v_code_free is not null,
    'premium_code_ready', v_code_premium is not null,
    -- o código do tier escolhido, só depois do claim
    'coupon_ready',       case when v_tier = 'premium' then v_code_premium is not null
                               else v_code_free is not null end,
    'coupon_code',        case when v_claimed_at is null then null
                               when v_tier = 'premium' then v_code_premium
                               else v_code_free end,
    -- compat: o desconto do Perceva saiu da campanha
    'perceva_code_ready', false,
    'perceva_code',       null
  );
end
$fn$;

comment on function public.partner_campaign_status(text, date) is
  'Campanha de parceiro: estado da pessoa (entrou, adotou a prática, sequência, pulos, desbloqueio garantido, tier resgatado). p_today = dia local (current_date ± 1). coupon_code = código do tier escolhido, só depois do claim; free_code_ready / premium_code_ready dizem se cada código já foi preenchido; is_premium = o tier da própria pessoa (decide se o cupom maior está ao alcance).';

-- ─── 4. secure_partner_unlock ───────────────────────────────────────────────

-- Garante o desbloqueio sem escolher o tier: a sequência fechou → unlocked_at.
-- Idempotente. O app chama sozinho ao ver unlocked && !secured && !claimed.
create or replace function public.secure_partner_unlock(
  p_campaign_id text,
  p_today       date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_uid      uuid := auth.uid();
  v_campaign public.partner_campaign%rowtype;
  v_streak   integer;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_today is null or p_today < current_date - 1 or p_today > current_date + 1 then
    raise exception 'invalid_local_date' using detail = coalesce(p_today::text, 'null');
  end if;

  select * into v_campaign
  from public.partner_campaign c
  where c.id = p_campaign_id
    and c.is_active
    and c.starts_at <= now()
    and (c.ends_at is null or c.ends_at > now());
  if not found then
    raise exception 'campaign_not_found' using detail = coalesce(p_campaign_id, 'null');
  end if;

  if not exists (
    select 1 from public.partner_campaign_member m
    where m.campaign_id = v_campaign.id and m.character_id = v_uid
  ) then
    raise exception 'not_a_member';
  end if;

  if not exists (
    select 1 from public.partner_campaign_member m
    where m.campaign_id = v_campaign.id and m.character_id = v_uid and m.unlocked_at is not null
  ) then
    select s.streak_days into v_streak
    from public._partner_streak(v_campaign.id, v_uid, p_today) s;
    if coalesce(v_streak, 0) < v_campaign.streak_goal then
      raise exception 'streak_not_reached'
        using detail = format('%s/%s', coalesce(v_streak, 0), v_campaign.streak_goal);
    end if;
    update public.partner_campaign_member
    set unlocked_at = now()
    where campaign_id = v_campaign.id and character_id = v_uid and unlocked_at is null;
  end if;

  return public.partner_campaign_status(v_campaign.id, p_today);
end
$fn$;

revoke execute on function public.secure_partner_unlock(text, date) from public, anon;
grant execute on function public.secure_partner_unlock(text, date) to authenticated;

comment on function public.secure_partner_unlock(text, date) is
  'Campanha de parceiro: garante o desbloqueio (unlocked_at) quando a sequência chega no alvo, sem escolher o tier. Idempotente; devolve partner_campaign_status.';

-- ─── 5. claim com tier ──────────────────────────────────────────────────────

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
  v_uid         uuid := auth.uid();
  v_campaign    public.partner_campaign%rowtype;
  v_unlocked_at timestamptz;
  v_streak      integer;
  v_is_premium  boolean := false;
  v_tier        text;
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

  select m.unlocked_at into v_unlocked_at
  from public.partner_campaign_member m
  where m.campaign_id = v_campaign.id and m.character_id = v_uid;
  if not found then
    raise exception 'not_a_member';
  end if;

  if v_tier = 'premium' and v_campaign.reward_premium_pct is null then
    raise exception 'tier_not_offered';
  end if;
  if v_tier = 'free' and v_campaign.reward_free_pct is null then
    raise exception 'tier_not_offered';
  end if;

  if not exists (
    select 1 from public.partner_coupon_claim cl
    where cl.campaign_id = v_campaign.id and cl.character_id = v_uid
  ) then
    select s.streak_days into v_streak
    from public._partner_streak(v_campaign.id, v_uid, p_today) s;

    if v_unlocked_at is null and coalesce(v_streak, 0) < v_campaign.streak_goal then
      raise exception 'streak_not_reached'
        using detail = format('%s/%s', coalesce(v_streak, 0), v_campaign.streak_goal);
    end if;

    if v_tier = 'premium' then
      select (p.subscription_tier = 'premium') into v_is_premium
      from public.profile p where p.id = v_uid;
      if not coalesce(v_is_premium, false) then
        raise exception 'premium_required';
      end if;
    end if;

    insert into public.partner_coupon_claim (campaign_id, character_id, streak_at_claim, tier)
    values (v_campaign.id, v_uid, coalesce(v_streak, v_campaign.streak_goal), v_tier)
    on conflict (campaign_id, character_id) do nothing;

    update public.partner_campaign_member
    set unlocked_at = coalesce(unlocked_at, now())
    where campaign_id = v_campaign.id and character_id = v_uid;
  end if;

  return public.partner_campaign_status(v_campaign.id, p_today);
end
$fn$;

revoke execute on function public.claim_partner_coupon(text, date, text) from public, anon;
grant execute on function public.claim_partner_coupon(text, date, text) to authenticated;

comment on function public.claim_partner_coupon(text, date, text) is
  'Campanha de parceiro: resgata o cupom no tier escolhido (free | premium). Exige ter entrado e desbloqueio garantido (unlocked_at) ou a sequência viva no alvo; premium exige profile.subscription_tier = premium (premium_required). Uma escolha por campanha: a primeira fica. Devolve partner_campaign_status.';

-- compat: o app em produção chama (text, date) até o próximo promote — vira
-- o tier básico.
create or replace function public.claim_partner_coupon(
  p_campaign_id text,
  p_today       date
)
returns jsonb
language sql
security definer
set search_path = public
as $fn$
  select public.claim_partner_coupon(p_campaign_id, p_today, 'free');
$fn$;

revoke execute on function public.claim_partner_coupon(text, date) from public, anon;
grant execute on function public.claim_partner_coupon(text, date) to authenticated;

comment on function public.claim_partner_coupon(text, date) is
  'Compat (app anterior a 2026-11-15): resgata o tier básico. Preferir a versão com p_tier.';

-- ─── guarda ─────────────────────────────────────────────────────────────────

do $guard$
declare
  v_missing text[] := '{}';
begin
  if not exists (
    select 1 from public.partner_campaign
    where id = 'paker-health' and reward_free_pct = 10 and reward_premium_pct = 17
      and perceva_reward_pt is null
  ) then
    v_missing := array_append(v_missing, 'partner_campaign paker-health com 10% / 17% e sem desconto do Perceva');
  end if;
  if not exists (
    select 1 from public.partner_campaign_secret
    where campaign_id = 'paker-health'
      and coupon_code_free = 'PERCEVAFREE' and coupon_code_premium = 'PERCEVAPREMIUM'
  ) then
    v_missing := array_append(v_missing, 'partner_campaign_secret paker-health com os dois códigos');
  end if;
  if has_table_privilege('authenticated', 'public.partner_campaign_secret', 'select')
     or has_table_privilege('anon', 'public.partner_campaign_secret', 'select') then
    v_missing := array_append(v_missing, 'revoke de partner_campaign_secret (cliente ainda lê)');
  end if;
  if position('premium_required' in
       pg_get_functiondef('public.claim_partner_coupon(text, date, text)'::regprocedure)) = 0 then
    v_missing := array_append(v_missing, 'claim_partner_coupon(text, date, text) com premium_required');
  end if;
  if position('secured' in
       pg_get_functiondef('public.partner_campaign_status(text, date)'::regprocedure)) = 0 then
    v_missing := array_append(v_missing, 'partner_campaign_status com secured');
  end if;
  if has_function_privilege('anon', 'public.secure_partner_unlock(text, date)', 'execute') then
    v_missing := array_append(v_missing, 'revoke de secure_partner_unlock pra anon');
  end if;
  if array_length(v_missing, 1) > 0 then
    raise exception 'partner_campaign_tiers: faltou %', array_to_string(v_missing, '; ');
  end if;
  raise notice 'partner_campaign_tiers: paker-health com PERCEVAFREE (10%%) e PERCEVAPREMIUM (17%%, só Premium)';
end
$guard$;

commit;
