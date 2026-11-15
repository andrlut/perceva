-- partner_campaign_tracks — a campanha ganha DUAS trilhas de prática e a
-- sequência cai de 7 para 4 dias (decisão Artur, 2026-11-15):
--
--   A pessoa escolhe UMA prática diária entre as trilhas da campanha e
--   qualquer uma delas conta o dia. Na Paker Health:
--     1. "Tomar o suplemento do dia"               (quem já tem o produto)
--     2. "Treino de força ou refeição com proteína" (quem ainda não tem)
--   A segunda trilha é a porta pra quem nunca comprou na Paker: o desafio
--   deixa de exigir o produto e passa a vender pra gente nova.
--
-- partner_campaign.template_id continua sendo a trilha principal (o app em
-- produção lê e adota por ela). As trilhas todas ficam em
-- partner_campaign_track, inclusive a principal, com sort_order. O app novo
-- lê a tabela (embed pelo FK campaign_id) e mostra uma opção por linha; o
-- app antigo não a conhece e continua funcionando — por isso NÃO existe um
-- segundo FK de partner_campaign pra task_template (o embed
-- `practice:task_template` do select antigo ficaria ambíguo no PostgREST).
--
-- _partner_streak passa a contar conclusões (e pulos) de qualquer prática
-- nascida de qualquer trilha da campanha: dia d feito em uma delas = dia
-- feito (datas distintas, então duas práticas no mesmo dia valem um dia).
-- partner_campaign_status: adopted/task_id olham todas as trilhas e o objeto
-- ganha track_template_id (a trilha da prática mais recente). O resto
-- (claim, secure_partner_unlock) só passa pela _partner_streak e não muda.
--
-- new table:     partner_campaign_track (campaign_id, template_id, sort_order)
-- new template:  body_strength_or_protein (subs: strength + nutrition)
-- changed rpcs:  _partner_streak(text, uuid, date) (interno) — conta o
--                conjunto das trilhas;
--                partner_campaign_status(text, date) — +track_template_id;
--                adopted/task_id sobre o conjunto
-- data:          paker-health com streak_goal 4 (max_skips segue 1), pitch
--                reescrito; duas trilhas
--
-- ORDEM: aplicar ANTES do promote do app que embeda partner_campaign_track
-- (PostgREST responde 400 a relação desconhecida no select da campanha).

begin;

-- ─── 1. A prática da segunda trilha ────────────────────────────────────────

insert into public.task_template
  (id, title, description, task_type, recurrence, target_count, sort_order, icon)
values
  ('body_strength_or_protein',
   'Treino de força ou refeição com proteína',
   'Fazer um treino de força OU uma refeição caprichada na proteína. Um dos dois conta o dia.',
   'daily', '{"type": "daily"}'::jsonb, 1, 36, 'mdi:dumbbell')
on conflict (id) do nothing;

insert into public.task_template_sub (template_id, sub_id, stars)
values ('body_strength_or_protein', 'strength', 1),
       ('body_strength_or_protein', 'nutrition', 1)
on conflict do nothing;

-- ─── 2. As trilhas ──────────────────────────────────────────────────────────

create table if not exists public.partner_campaign_track (
  campaign_id text not null references public.partner_campaign(id) on delete cascade,
  template_id text not null references public.task_template(id),
  sort_order  smallint not null default 0,
  primary key (campaign_id, template_id)
);

comment on table public.partner_campaign_track is
  'As práticas que valem pra sequência de uma campanha de parceiro (uma por linha, sort_order = ordem na tela). Inclui a principal (partner_campaign.template_id). Qualquer uma conta o dia. Escrita só pelo Studio.';

alter table public.partner_campaign_track enable row level security;

-- visível junto com a campanha: a subquery roda como o usuário, então a
-- policy de partner_campaign (janela ativa ou claim feito) vale aqui também
drop policy if exists partner_campaign_track_read on public.partner_campaign_track;
create policy partner_campaign_track_read on public.partner_campaign_track
  for select to authenticated
  using (exists (select 1 from public.partner_campaign c where c.id = campaign_id));

revoke all on public.partner_campaign_track from public, anon, authenticated;
grant select on public.partner_campaign_track to authenticated;

insert into public.partner_campaign_track (campaign_id, template_id, sort_order)
values ('paker-health', 'nutrition_daily_supplement', 1),
       ('paker-health', 'body_strength_or_protein', 2)
on conflict (campaign_id, template_id) do update set sort_order = excluded.sort_order;

-- ─── 3. A campanha: 4 dias, pitch com as duas trilhas ───────────────────────

update public.partner_campaign
set streak_goal = 4,
    pitch_pt = 'Escolha uma prática: tomar o seu suplemento, ou um treino de força ou refeição com proteína. Marque todo dia e libere um cupom de desconto na Paker Health. Assinantes Premium ganham um cupom maior.',
    pitch_en = 'Pick one practice: take your supplement, or a strength workout or a protein-rich meal. Check it off every day and unlock a Paker Health discount coupon. Premium subscribers get a bigger one.'
where id = 'paker-health';

comment on column public.partner_campaign.template_id is
  'Trilha principal da campanha (compat com o app anterior a 2026-11-15). As trilhas todas, esta incluída, ficam em partner_campaign_track.';

-- ─── 4. _partner_streak: qualquer trilha conta o dia ────────────────────────

create or replace function public._partner_streak(
  p_campaign_id text,
  p_character   uuid,
  p_today       date,
  out streak_days integer,
  out skips_used  integer,
  out done_today  boolean
)
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_goal      integer;
  v_max_skips integer;
  v_templates text[];
  v_from      date;
  v_done      date[];
  v_skipped   date[];
  v_day       date;
  v_pending   integer := 0;
begin
  streak_days := 0;
  skips_used  := 0;
  done_today  := false;

  -- A caminhada nunca precisa de mais que hoje (neutro) + goal dias feitos
  -- + max_skips pulos: goal + max_skips + 1 dias, cortados em starts_at.
  select c.streak_goal, c.max_skips,
         greatest(p_today - (c.streak_goal + c.max_skips)::integer,
                  (c.starts_at at time zone 'UTC')::date)
    into v_goal, v_max_skips, v_from
  from public.partner_campaign c
  where c.id = p_campaign_id;
  if not found or p_character is null or p_today is null or v_from > p_today then
    return;
  end if;

  -- as trilhas da campanha; a principal entra mesmo sem linha na tabela
  select array_agg(distinct x.template_id) into v_templates
  from (
    select c.template_id from public.partner_campaign c where c.id = p_campaign_id
    union
    select k.template_id from public.partner_campaign_track k where k.campaign_id = p_campaign_id
  ) x;

  -- feito no dia d = inserido em d ou d+1 em São Paulo: tarde da noite e a
  -- manhã seguinte contam; amanhã marcado hoje e semanas depois, não
  select coalesce(array_agg(distinct tc.completed_local_date), '{}'::date[])
    into v_done
  from public.task_completion tc
  join public.task t on t.id = tc.task_id
  where tc.character_id = p_character
    and t.character_id = p_character
    and coalesce(t.origin_template_id, t.template_id) = any (v_templates)
    and tc.completed_local_date between v_from and p_today
    and (tc.created_at at time zone 'America/Sao_Paulo')::date
        between tc.completed_local_date and tc.completed_local_date + 1;

  select coalesce(array_agg(distinct s.skipped_for), '{}'::date[])
    into v_skipped
  from public.task_skip s
  join public.task t on t.id = s.task_id
  where s.character_id = p_character
    and t.character_id = p_character
    and coalesce(t.origin_template_id, t.template_id) = any (v_templates)
    and s.skipped_for between v_from and p_today
    and (s.created_at at time zone 'America/Sao_Paulo')::date
        between s.skipped_for and s.skipped_for + 1;

  done_today := p_today = any (v_done);

  v_day := p_today;
  while v_day >= v_from loop
    if v_day = any (v_done) then
      streak_days := streak_days + 1;
      skips_used := skips_used + v_pending;
      v_pending := 0;
      exit when streak_days >= v_goal;
    elsif v_day = p_today then
      null;  -- hoje ainda sem conclusão: neutro
    elsif v_day = any (v_skipped) and skips_used + v_pending < v_max_skips then
      v_pending := v_pending + 1;
    else
      exit;
    end if;
    v_day := v_day - 1;
  end loop;
end
$fn$;

revoke execute on function public._partner_streak(text, uuid, date) from public, anon, authenticated;

comment on function public._partner_streak(text, uuid, date) is
  'Interno (sem EXECUTE pro cliente): sequência de dias da campanha pra uma pessoa, terminando em p_today, contando qualquer trilha (partner_campaign_track + template_id). Usado por partner_campaign_status, secure_partner_unlock e claim_partner_coupon.';

-- ─── 5. partner_campaign_status: adoção em qualquer trilha ─────────────────

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
  v_track        text;
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

  -- a prática mais recente nascida de qualquer trilha, mesmo depois de
  -- editada (origem, não o vínculo)
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

  v_unlocked := v_claimed_at is not null
                or v_unlocked_at is not null
                or coalesce(v_streak, 0) >= v_campaign.streak_goal;

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
  'Campanha de parceiro: estado da pessoa (entrou, adotou uma das trilhas — track_template_id —, sequência, pulos, desbloqueio garantido, tier resgatado). p_today = dia local (current_date ± 1). coupon_code = código do tier escolhido, só depois do claim.';

-- ─── 6. Guarda ──────────────────────────────────────────────────────────────

do $guard$
declare
  v_missing text[] := '{}';
begin
  if not exists (
    select 1 from public.partner_campaign where id = 'paker-health' and streak_goal = 4
  ) then
    v_missing := array_append(v_missing, 'partner_campaign paker-health com 4 dias');
  end if;
  if (select count(*) from public.partner_campaign_track where campaign_id = 'paker-health') <> 2 then
    v_missing := array_append(v_missing, 'partner_campaign_track paker-health com 2 trilhas');
  end if;
  if not exists (select 1 from public.task_template where id = 'body_strength_or_protein') then
    v_missing := array_append(v_missing, 'task_template body_strength_or_protein');
  end if;
  if has_table_privilege('anon', 'public.partner_campaign_track', 'select')
     or has_table_privilege('authenticated', 'public.partner_campaign_track', 'insert') then
    v_missing := array_append(v_missing, 'grants de partner_campaign_track (só select pra authenticated)');
  end if;
  if position('track_template_id' in
       pg_get_functiondef('public.partner_campaign_status(text, date)'::regprocedure)) = 0 then
    v_missing := array_append(v_missing, 'partner_campaign_status com track_template_id');
  end if;
  if position('partner_campaign_track' in
       pg_get_functiondef('public._partner_streak(text, uuid, date)'::regprocedure)) = 0 then
    v_missing := array_append(v_missing, '_partner_streak lendo as trilhas');
  end if;
  if array_length(v_missing, 1) > 0 then
    raise exception 'partner_campaign_tracks: faltou %', array_to_string(v_missing, '; ');
  end if;
  raise notice 'partner_campaign_tracks: paker-health com 4 dias e 2 trilhas (suplemento | treino de força ou refeição com proteína)';
end
$guard$;

commit;
