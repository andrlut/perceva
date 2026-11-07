-- migration: 20261104000009_partner_campaign.sql
-- purpose: Programa Paker Health — o primeiro "evento" patrocinado do app.
--          A pessoa entra no programa, adota a prática de catálogo "Tomar o
--          suplemento do dia" e, com 28 dias seguidos, desbloqueia um cupom
--          de desconto da Paker Health. O material do Recanto da campanha
--          (paker-health-energia-pele-forca, migrations 07/08 de hoje) passa a
--          carregar o patrocinador, e o selo "Patrocinado · Paker Health"
--          aparece onde ele aparecer.
--
--   1. learning_material.sponsor (jsonb) + learning_idea_public ganha
--      sponsor_name e sponsor_campaign_id NO FIM (create or replace só aceita
--      coluna nova no fim).
--   2. Prática de catálogo nutrition_daily_supplement (1★ em Alimentação) e
--      task.origin_template_id: o template de onde a prática nasceu,
--      carimbado na adoção e imutável pro cliente. A campanha conta por ele
--      e não por template_id, que o task-form corta quando a pessoa edita a
--      prática (renomear no dia 20 não pode zerar a sequência).
--   3. Tabelas da campanha: partner_campaign (catálogo, leitura pela janela
--      ativa), partner_campaign_secret (o código do cupom; sem acesso do
--      cliente), partner_campaign_member (quem entrou — a base de
--      rastreamento/repasse do parceiro) e partner_coupon_claim (quem pegou).
--   4. Anti-backfill: a sequência libera um cupom, então registro retroativo
--      não pode contar. task_completion ganha created_at (hora do servidor) e
--      perde o INSERT direto do cliente; task_skip passa a ter created_at
--      carimbado pelo servidor.
--   5. RPCs: partner_campaign_status, join_partner_campaign,
--      claim_partner_coupon; a caminhada da sequência mora num helper interno
--      (_partner_streak) que status e claim usam igual.
--
-- affected tables: learning_material (+sponsor), learning_idea_public (view,
--                  +sponsor_name +sponsor_campaign_id no fim), task_template,
--                  task_template_sub (+1 linha cada), task
--                  (+origin_template_id, +gatilho), partner_campaign (nova),
--                  partner_campaign_secret (nova), partner_campaign_member
--                  (nova), partner_coupon_claim (nova), task_completion
--                  (+created_at, -policy de insert), task_skip (+trigger)
-- new rpcs:        partner_campaign_status(text, date),
--                  join_partner_campaign(text, text),
--                  claim_partner_coupon(text, date);
--                  internos: _partner_streak(text, uuid, date),
--                  task_skip_stamp_created_at() e
--                  task_stamp_origin_template() (gatilhos)
-- breaking?        no — conferido em app/ e supabase/functions/: nenhuma
--                  escrita direta em task_completion (toda conclusão passa por
--                  complete_task / complete_template, ambas SECURITY DEFINER
--                  na definição mais recente: 20261013000001 e
--                  20260919000002); o app não manda created_at no task_skip
--                  nem origin_template_id no task; a view só ganha colunas no
--                  fim.
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   ORDEM DE SUBIDA: esta migration vai pra cloud (e é conferida) ANTES do
--     merge/OTA do app e ANTES do deploy do perceva-mcp. O feed do Recanto
--     tolera a coluna sponsor ausente (refaz o select sem ela), mas o MCP
--     pede sponsor_name na view e responde 400 sem ela
--   escrita pelo editor (nunca heredoc): PT com acento em comentários
--   depende da 20261104000007 (a linha do material): o seed da campanha tem
--     FK pro slug, então sem a 07 esta migration falha alto
--   o código do cupom entra depois, pelo Studio, quando a Paker mandar:
--     update public.partner_campaign_secret
--        set coupon_code = '<código>' where campaign_id = 'paker-health';
--   o dia é LOCAL e vem do cliente (p_today), como em train_idea: a faixa
--     aceita é current_date ± 1 (UTC no servidor), o que cobre qualquer fuso
--   a régua de "feito no dia d": uma conclusão com completed_local_date = d
--     inserida (created_at, data UTC) entre d-1 e d+1 — registrar tarde da
--     noite ou na manhã seguinte conta; marcar semanas depois não. O mesmo
--     vale pro pulo (skipped_for = d). Limite conhecido: dentro dessa faixa
--     dá pra marcar o dia de amanhã hoje (o servidor não sabe o fuso).
--   a sequência PARA no alvo (streak_days nunca passa de streak_goal): o que
--     vem depois do alvo não muda nada e a caminhada fica limitada a
--     goal + max_skips + 1 dias

begin;

-- ─── 1. Patrocinador no material ────────────────────────────────────────────

alter table public.learning_material
  add column if not exists sponsor jsonb;

alter table public.learning_material
  drop constraint if exists learning_material_sponsor_shape;
alter table public.learning_material
  add constraint learning_material_sponsor_shape
  check (
    sponsor is null
    or (jsonb_typeof(sponsor) = 'object' and coalesce(sponsor->>'name', '') <> '')
  );

comment on column public.learning_material.sponsor is
  'Conteúdo patrocinado: {"name", "campaign_id"?, "url"?}. NULL = material comum. Material patrocinado leva o selo "Patrocinado · {name}", nunca fica trancado pela janela do free. O vídeo das ideias é o do Remotion; o deep dive em áudio do Notebook entra normalmente.';

-- view das ideias: mesmas colunas, mesma ordem, + patrocinador no fim

create or replace view public.learning_idea_public
with (security_invoker = true) as
select
  m.id                                   as material_id,
  m.slug,
  m.type,
  m.dimension_id,
  m.released_at,
  i->>'id'                               as idea_id,
  (i->>'ordinal')::smallint              as ordinal,
  i->'title'->>'pt'                      as title_pt,
  i->'title'->>'en'                      as title_en,
  i->'claim'->>'pt'                      as claim_pt,
  i->'claim'->>'en'                      as claim_en,
  i->'image'->>'path'                    as image_path,
  i->'video'->'pt'->>'path'              as video_pt_path,
  i->'video'->'en'->>'path'              as video_en_path,
  m.category,
  m.sponsor->>'name'                     as sponsor_name,
  m.sponsor->>'campaign_id'              as sponsor_campaign_id
from public.learning_material m
cross join lateral jsonb_array_elements(m.ideas) as i
where m.is_archived = false
  and m.released_at <= now();

grant select on public.learning_idea_public to authenticated;

update public.learning_material
set sponsor = '{"name": "Paker Health", "campaign_id": "paker-health", "url": "https://pakerhealth.com.br"}'::jsonb
where slug = 'paker-health-energia-pele-forca';

-- ─── 2. Prática de catálogo da campanha ─────────────────────────────────────

insert into public.task_template
  (id, title, description, task_type, recurrence, target_count, sort_order, icon)
values
  ('nutrition_daily_supplement',
   'Tomar o suplemento do dia',
   'Tomar a dose do seu suplemento no mesmo horário, todo dia.',
   'daily', '{"type": "daily"}'::jsonb, 1, 35, 'mdi:pill')
on conflict (id) do nothing;

insert into public.task_template_sub (template_id, sub_id, stars)
values ('nutrition_daily_supplement', 'nutrition', 1)
on conflict do nothing;

-- task.origin_template_id: de qual template a prática nasceu. template_id é
-- o vínculo VIVO com o catálogo, e o task-form o corta quando a pessoa edita
-- título, descrição ou estrelas de uma prática adotada (o "virou uma prática
-- sua", que re-roda o teto do free em enforce_free_limit_unlink). A campanha
-- não pode depender dele: renomear "Tomar o suplemento do dia" pra
-- "Creatina 5 g" no dia 20 zeraria a sequência. Manter o vínculo vivo pra
-- prática da campanha reabriria o furo que a 20260925000001 fechou (adotar
-- de novo e editar = prática própria sem teto), então a campanha conta pela
-- ORIGEM: carimbada no INSERT a partir de template_id (que só
-- start_task_from_template consegue setar, guard_task_template_link) e
-- imutável pro cliente depois.
-- Sem backfill de propósito: o task_touch_updated_at reescreveria updated_at
-- de toda prática adotada. Quem lê usa coalesce(origin_template_id,
-- template_id), que nas linhas antigas dá o próprio template_id.
alter table public.task
  add column if not exists origin_template_id text;

comment on column public.task.origin_template_id is
  'Template de onde a prática nasceu (start_task_from_template), carimbado no INSERT e imutável pro cliente. Diferente de template_id, sobrevive à edição que corta o vínculo com o catálogo. NULL = prática própria ou anterior a 20261104000009 (ler com coalesce(origin_template_id, template_id)).';

create or replace function public.task_stamp_origin_template()
returns trigger
language plpgsql
security invoker
set search_path = public
as $fn$
begin
  if TG_OP = 'INSERT' then
    -- o que vale é template_id, que o cliente não consegue setar; o que o
    -- cliente mandar em origin_template_id é descartado
    new.origin_template_id := new.template_id;
  elsif current_user = 'authenticated' then
    new.origin_template_id := old.origin_template_id;
  end if;
  return new;
end
$fn$;

drop trigger if exists task_stamp_origin_template on public.task;
create trigger task_stamp_origin_template
  before insert or update of origin_template_id on public.task
  for each row execute function public.task_stamp_origin_template();

revoke execute on function public.task_stamp_origin_template() from public, anon, authenticated;

-- ─── 3. Tabelas da campanha ─────────────────────────────────────────────────

create table if not exists public.partner_campaign (
  id            text primary key check (id ~ '^[a-z0-9-]{3,40}$'),
  partner_name  text not null,
  partner_url   text,
  title_pt      text not null,
  title_en      text not null,
  pitch_pt      text not null,
  pitch_en      text not null,
  reward_pt     text not null,
  reward_en     text not null,
  material_slug text references public.learning_material(slug)
                  on update cascade on delete set null,
  template_id   text not null references public.task_template(id),
  streak_goal   smallint not null default 28 check (streak_goal between 1 and 120),
  max_skips     smallint not null default 4 check (max_skips between 0 and 30),
  starts_at     timestamptz not null default now(),
  ends_at       timestamptz,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  constraint partner_campaign_window_check check (ends_at is null or ends_at > starts_at)
);

comment on table public.partner_campaign is
  'Campanha de parceiro (evento patrocinado): entrar, adotar a prática template_id e manter streak_goal dias seguidos (max_skips pulos ligam a sequência sem contar) libera a recompensa. O cliente só vê as campanhas dentro da janela ativa. Escrita só pelo Studio.';

alter table public.partner_campaign enable row level security;

drop policy if exists partner_campaign_read_active on public.partner_campaign;
create policy partner_campaign_read_active on public.partner_campaign
  for select to authenticated
  using (is_active and starts_at <= now() and (ends_at is null or ends_at > now()));

-- o grant padrão do Supabase dá ALL pra anon/authenticated em tabela nova
-- (RLS-10 da auditoria): aqui só a leitura sobra
revoke all on public.partner_campaign from public, anon, authenticated;
grant select on public.partner_campaign to authenticated;

create table if not exists public.partner_campaign_secret (
  campaign_id text primary key references public.partner_campaign(id) on delete cascade,
  coupon_code text,
  updated_at  timestamptz not null default now()
);

comment on table public.partner_campaign_secret is
  'O código do cupom da campanha. Sem policy e sem grant pro cliente: só as funções SECURITY DEFINER leem, e o código só volta pra quem já pegou o cupom (partner_campaign_status). Preenchido pelo Studio quando o parceiro libera.';

alter table public.partner_campaign_secret enable row level security;
-- sem policy de propósito
revoke all on public.partner_campaign_secret from public, anon, authenticated;

drop trigger if exists partner_campaign_secret_touch_updated_at on public.partner_campaign_secret;
create trigger partner_campaign_secret_touch_updated_at
  before update on public.partner_campaign_secret
  for each row execute function public.touch_updated_at();

create table if not exists public.partner_campaign_member (
  campaign_id  text not null references public.partner_campaign(id) on delete cascade,
  character_id uuid not null references public.character(id) on delete cascade,
  joined_at    timestamptz not null default now(),
  source       text not null default 'app'
                 check (source in ('banner', 'material', 'campaign', 'deeplink', 'app')),
  primary key (campaign_id, character_id)
);

comment on table public.partner_campaign_member is
  'Quem entrou na campanha e de onde veio. Base de rastreamento do parceiro (membros que depois viram Premium). Escrita só por join_partner_campaign.';

alter table public.partner_campaign_member enable row level security;

drop policy if exists partner_campaign_member_self_select on public.partner_campaign_member;
create policy partner_campaign_member_self_select on public.partner_campaign_member
  for select to authenticated
  using (character_id = auth.uid());

revoke all on public.partner_campaign_member from public, anon, authenticated;
grant select on public.partner_campaign_member to authenticated;

create table if not exists public.partner_coupon_claim (
  campaign_id     text not null references public.partner_campaign(id) on delete cascade,
  character_id    uuid not null references public.character(id) on delete cascade,
  claimed_at      timestamptz not null default now(),
  streak_at_claim smallint not null,
  primary key (campaign_id, character_id)
);

comment on table public.partner_coupon_claim is
  'Quem pegou o cupom (uma vez por campanha; o primeiro claimed_at fica). Escrita só por claim_partner_coupon, que confere a sequência no servidor.';

alter table public.partner_coupon_claim enable row level security;

drop policy if exists partner_coupon_claim_self_select on public.partner_coupon_claim;
create policy partner_coupon_claim_self_select on public.partner_coupon_claim
  for select to authenticated
  using (character_id = auth.uid());

revoke all on public.partner_coupon_claim from public, anon, authenticated;
grant select on public.partner_coupon_claim to authenticated;

-- seed: a campanha da Paker Health (o código do cupom ainda não existe)

insert into public.partner_campaign (
  id, partner_name, partner_url,
  title_pt, title_en, pitch_pt, pitch_en, reward_pt, reward_en,
  material_slug, template_id, streak_goal, max_skips
) values (
  'paker-health', 'Paker Health', 'https://pakerhealth.com.br',
  'Programa Paker Health', 'Paker Health Program',
  -- sem o número: o alvo é streak_goal, e a UI já o mostra (barra, trava)
  'Tome o seu suplemento todo dia e libere um cupom de desconto na Paker Health.',
  'Take your supplement every day and unlock a Paker Health discount coupon.',
  'Cupom de desconto na Paker Health', 'Discount coupon from Paker Health',
  'paker-health-energia-pele-forca', 'nutrition_daily_supplement', 28, 4
)
on conflict (id) do nothing;

insert into public.partner_campaign_secret (campaign_id, coupon_code)
values ('paker-health', null)
on conflict do nothing;

-- ─── 4. Anti-backfill ───────────────────────────────────────────────────────

-- task_completion.created_at: a hora do servidor em que a linha entrou.
-- completed_at / completed_local_date vêm do cliente (registro retroativo é
-- recurso do app); created_at é o que separa "marquei no dia" de "marquei
-- semanas depois". Linhas antigas herdam completed_at (nunca no futuro).
alter table public.task_completion
  add column if not exists created_at timestamptz;

update public.task_completion
set created_at = least(completed_at, now())
where created_at is null;

alter table public.task_completion
  alter column created_at set default now();
alter table public.task_completion
  alter column created_at set not null;

comment on column public.task_completion.created_at is
  'Hora do servidor em que a conclusão foi inserida (now(), nunca o cliente). completed_at/completed_local_date são do cliente; a sequência das campanhas só conta conclusões inseridas perto do dia local (d-1..d+1).';

-- Conclusão só pelas funções (complete_task / complete_template, SECURITY
-- DEFINER). O INSERT direto deixava o cliente escolher created_at e pular a
-- economia; nada no app nem no conector usa (conferido em 2026-11-04).
drop policy if exists "task_completion_self_insert" on public.task_completion;
revoke insert, update, delete, truncate on public.task_completion from anon, authenticated;

-- task_skip.created_at: o cliente insere o pulo direto (upsert do app) e
-- podia mandar qualquer created_at. O servidor carimba. RLS confere o WITH
-- CHECK depois dos BEFORE triggers, e o EXCLUDED de um upsert já vê o carimbo.
create or replace function public.task_skip_stamp_created_at()
returns trigger
language plpgsql
set search_path = public
as $fn$
begin
  new.created_at := now();
  return new;
end
$fn$;

drop trigger if exists task_skip_stamp_created_at on public.task_skip;
create trigger task_skip_stamp_created_at
  before insert on public.task_skip
  for each row execute function public.task_skip_stamp_created_at();

revoke execute on function public.task_skip_stamp_created_at() from public, anon, authenticated;

-- ─── 5. RPCs ────────────────────────────────────────────────────────────────

-- _partner_streak: a caminhada da sequência, igual pra status e claim.
-- Conta só as práticas da pessoa que nasceram do template da campanha
-- (coalesce(origin_template_id, template_id): editadas e arquivadas
-- inclusive). Dia d FEITO = conclusão com completed_local_date = d inserida
-- entre d-1 e d+1 (data UTC de created_at); dia d PULADO = task_skip com
-- skipped_for = d na mesma faixa. Anda pra trás a partir de p_today:
--   hoje sem conclusão     → neutro (nem conta nem quebra; pulo de hoje também)
--   dia feito              → +1 (para no alvo)
--   dia pulado             → liga a sequência sem contar, até max_skips
--   qualquer outra coisa   → fim
-- Nunca olha antes de starts_at (data UTC). skips_used conta só os pulos que
-- de fato ligam dias feitos: pulo na ponta da sequência, sem dia feito
-- depois dele, não gasta nada. Interno: sem EXECUTE pro cliente (p_character
-- é qualquer pessoa); só status e claim chamam, com auth.uid().
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
  v_template  text;
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
  select c.streak_goal, c.max_skips, c.template_id,
         greatest(p_today - (c.streak_goal + c.max_skips)::integer,
                  (c.starts_at at time zone 'UTC')::date)
    into v_goal, v_max_skips, v_template, v_from
  from public.partner_campaign c
  where c.id = p_campaign_id;
  if not found or p_character is null or p_today is null or v_from > p_today then
    return;
  end if;

  select coalesce(array_agg(distinct tc.completed_local_date), '{}'::date[])
    into v_done
  from public.task_completion tc
  join public.task t on t.id = tc.task_id
  where tc.character_id = p_character
    and t.character_id = p_character
    and coalesce(t.origin_template_id, t.template_id) = v_template
    and tc.completed_local_date between v_from and p_today
    and (tc.created_at at time zone 'UTC')::date
        between tc.completed_local_date - 1 and tc.completed_local_date + 1;

  select coalesce(array_agg(distinct s.skipped_for), '{}'::date[])
    into v_skipped
  from public.task_skip s
  join public.task t on t.id = s.task_id
  where s.character_id = p_character
    and t.character_id = p_character
    and coalesce(t.origin_template_id, t.template_id) = v_template
    and s.skipped_for between v_from and p_today
    and (s.created_at at time zone 'UTC')::date
        between s.skipped_for - 1 and s.skipped_for + 1;

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
  'Interno (sem EXECUTE pro cliente): sequência de dias da campanha pra uma pessoa, terminando em p_today. Usado por partner_campaign_status e claim_partner_coupon.';

-- partner_campaign_status: tudo o que a tela da campanha e o cartão da Home
-- precisam, numa chamada. Vale pra quem ainda não entrou (member=false): a
-- tela mostra o progresso de uma prática já adotada. O código do cupom só
-- volta pra quem já pegou o cupom e quando o parceiro já liberou.
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
  v_uid        uuid := auth.uid();
  v_campaign   public.partner_campaign%rowtype;
  v_joined_at  timestamptz;
  v_task_id    uuid;
  v_streak     integer;
  v_skips      integer;
  v_done_today boolean;
  v_claimed_at timestamptz;
  v_code       text;
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

  select m.joined_at into v_joined_at
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

  select cl.claimed_at into v_claimed_at
  from public.partner_coupon_claim cl
  where cl.campaign_id = v_campaign.id and cl.character_id = v_uid;

  select nullif(btrim(sec.coupon_code), '') into v_code
  from public.partner_campaign_secret sec
  where sec.campaign_id = v_campaign.id;

  return jsonb_build_object(
    'campaign_id',  v_campaign.id,
    'member',       v_joined_at is not null,
    'joined_at',    v_joined_at,
    'adopted',      v_task_id is not null,
    'task_id',      v_task_id,
    'done_today',   coalesce(v_done_today, false),
    'streak_days',  coalesce(v_streak, 0),
    'skips_used',   coalesce(v_skips, 0),
    'max_skips',    v_campaign.max_skips,
    'goal',         v_campaign.streak_goal,
    'unlocked',     v_claimed_at is not null or coalesce(v_streak, 0) >= v_campaign.streak_goal,
    'claimed',      v_claimed_at is not null,
    'claimed_at',   v_claimed_at,
    'coupon_ready', v_code is not null,
    'coupon_code',  case when v_claimed_at is not null then v_code end
  );
end
$fn$;

revoke execute on function public.partner_campaign_status(text, date) from public, anon;
grant execute on function public.partner_campaign_status(text, date) to authenticated;

comment on function public.partner_campaign_status(text, date) is
  'Campanha de parceiro: estado da pessoa (entrou, adotou a prática, sequência, pulos, cupom). p_today = dia local (current_date ± 1). coupon_code só depois do claim.';

-- join_partner_campaign: entrar é idempotente (o primeiro joined_at fica).
-- source fora da lista vira 'app' em vez de falhar.
create or replace function public.join_partner_campaign(
  p_campaign_id text,
  p_source      text default 'app'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_uid       uuid := auth.uid();
  v_source    text;
  v_joined_at timestamptz;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  if not exists (
    select 1 from public.partner_campaign c
    where c.id = p_campaign_id
      and c.is_active
      and c.starts_at <= now()
      and (c.ends_at is null or c.ends_at > now())
  ) then
    raise exception 'campaign_not_found' using detail = coalesce(p_campaign_id, 'null');
  end if;

  v_source := case
    when p_source in ('banner', 'material', 'campaign', 'deeplink', 'app') then p_source
    else 'app'
  end;

  insert into public.partner_campaign_member (campaign_id, character_id, source)
  values (p_campaign_id, v_uid, v_source)
  on conflict (campaign_id, character_id) do nothing;

  select m.joined_at into v_joined_at
  from public.partner_campaign_member m
  where m.campaign_id = p_campaign_id and m.character_id = v_uid;

  return jsonb_build_object('campaign_id', p_campaign_id, 'joined_at', v_joined_at);
end
$fn$;

revoke execute on function public.join_partner_campaign(text, text) from public, anon;
grant execute on function public.join_partner_campaign(text, text) to authenticated;

comment on function public.join_partner_campaign(text, text) is
  'Campanha de parceiro: entra no programa (idempotente). p_source in banner|material|campaign|deeplink|app; outro valor vira app.';

-- claim_partner_coupon: pega o cupom. Exige ter entrado e recalcula a
-- sequência no servidor (o mesmo _partner_streak do status). Quem já pegou
-- não é conferido de novo: quebrar a sequência depois não tira o cupom.
-- Devolve o mesmo objeto de partner_campaign_status (agora claimed=true).
create or replace function public.claim_partner_coupon(
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
    select 1 from public.partner_coupon_claim cl
    where cl.campaign_id = v_campaign.id and cl.character_id = v_uid
  ) then
    select s.streak_days into v_streak
    from public._partner_streak(v_campaign.id, v_uid, p_today) s;

    if coalesce(v_streak, 0) < v_campaign.streak_goal then
      raise exception 'streak_not_reached'
        using detail = format('%s/%s', coalesce(v_streak, 0), v_campaign.streak_goal);
    end if;

    insert into public.partner_coupon_claim (campaign_id, character_id, streak_at_claim)
    values (v_campaign.id, v_uid, v_streak)
    on conflict (campaign_id, character_id) do nothing;
  end if;

  return public.partner_campaign_status(v_campaign.id, p_today);
end
$fn$;

revoke execute on function public.claim_partner_coupon(text, date) from public, anon;
grant execute on function public.claim_partner_coupon(text, date) to authenticated;

comment on function public.claim_partner_coupon(text, date) is
  'Campanha de parceiro: pega o cupom quando a sequência chega no alvo (conferida no servidor). Idempotente; devolve o mesmo objeto de partner_campaign_status.';

-- ─── guarda ─────────────────────────────────────────────────────────────────

do $guard$
declare
  v_missing text[] := '{}';
begin
  if not exists (select 1 from public.partner_campaign where id = 'paker-health') then
    v_missing := array_append(v_missing, 'partner_campaign paker-health');
  end if;
  if not exists (select 1 from public.partner_campaign_secret where campaign_id = 'paker-health') then
    v_missing := array_append(v_missing, 'partner_campaign_secret paker-health');
  end if;
  if not exists (
    select 1 from public.task_template_sub
    where template_id = 'nutrition_daily_supplement' and sub_id = 'nutrition'
  ) then
    v_missing := array_append(v_missing, 'task_template nutrition_daily_supplement');
  end if;
  if not exists (
    select 1 from public.learning_material
    where slug = 'paker-health-energia-pele-forca'
      and sponsor->>'campaign_id' = 'paker-health'
  ) then
    v_missing := array_append(v_missing, 'learning_material.sponsor de paker-health-energia-pele-forca');
  end if;
  if (
    select count(*) from information_schema.columns
    where table_schema = 'public'
      and table_name = 'learning_idea_public'
      and column_name in ('sponsor_name', 'sponsor_campaign_id')
  ) <> 2 then
    v_missing := array_append(v_missing, 'learning_idea_public.sponsor_name/sponsor_campaign_id');
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'task'
      and column_name = 'origin_template_id'
  ) or not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.task'::regclass
      and tgname = 'task_stamp_origin_template'
      and not tgisinternal
  ) then
    v_missing := array_append(v_missing, 'task.origin_template_id + gatilho');
  end if;
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'task_completion'
      and policyname = 'task_completion_self_insert'
  ) then
    v_missing := array_append(v_missing, 'drop da policy task_completion_self_insert');
  end if;

  if array_length(v_missing, 1) > 0 then
    raise exception 'partner_campaign: faltou %', array_to_string(v_missing, '; ');
  end if;
  raise notice 'partner_campaign: campanha paker-health pronta (cupom ainda sem código)';
end
$guard$;

commit;
