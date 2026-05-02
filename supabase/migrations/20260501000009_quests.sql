-- ============================================================================
-- Quests — time-bound objectives with progress tracking and reward payout.
--
-- Three tables:
--   - quest_template: public catalog of suggested quests (clone-into-yours)
--   - quest: a user's active or historical objective
--   - quest_requirement: the things that must be true for a quest to complete
--
-- Plus four RPCs:
--   - start_quest_from_template(p_template_id) → uuid
--   - start_custom_quest(p_payload jsonb) → uuid
--   - complete_quest(p_quest_id uuid) → json (credits the reward)
--   - expire_overdue_quests() → integer (called from client on read)
--
-- Progress (current_count) is computed on read in the client by joining
-- task_completion / skill_log against requirements — no trigger here, so
-- retroactive completions and edits don't need extra plumbing.
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────
-- 1. quest_template (public catalog) — created first so quest can FK it
-- ──────────────────────────────────────────────────────────────────────────

create table public.quest_template (
  id text primary key,
  title text not null,
  description text,
  category text not null,        -- 'fitness' | 'mind' | 'wealth' | 'social' | 'discipline' | 'health'
  suggested_duration_days integer not null check (suggested_duration_days >= 1),
  reward_xp integer not null default 0 check (reward_xp >= 0),
  reward_coins integer not null default 0 check (reward_coins >= 0),
  allow_partial boolean not null default false,
  /**
   * Array of requirement specs. Each item is a JSON object matching one of:
   *   {"kind":"complete_task_n_times","task_title":"go to gym","target_count":3}
   *      → resolves to a TASK lookup by exact title at start time
   *   {"kind":"complete_any_in_dim","dimension_id":"strength","target_count":3}
   *   {"kind":"reach_skill_value","skill_id":"pushups","min_value":50}
   *
   * task_title is matched case-insensitively against the user's existing
   * tasks; if not found, the requirement is created with task_id=null and
   * the user can wire it manually.
   */
  requirements jsonb not null,
  sort_order integer not null default 0
);

alter table public.quest_template enable row level security;

create policy "quest_template_read_authenticated"
  on public.quest_template for select
  to authenticated using (true);

-- ──────────────────────────────────────────────────────────────────────────
-- 2. quest (instance owned by a user)
-- ──────────────────────────────────────────────────────────────────────────

create table public.quest (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.character(id) on delete cascade,
  template_id text references public.quest_template(id) on delete set null,
  title text not null,
  description text,
  started_at timestamptz not null default now(),
  deadline timestamptz not null,
  reward_xp integer not null default 0 check (reward_xp >= 0),
  reward_coins integer not null default 0 check (reward_coins >= 0),
  allow_partial boolean not null default false,
  status text not null default 'active'
    check (status in ('active', 'completed', 'failed', 'expired', 'abandoned')),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index quest_character_idx
  on public.quest (character_id, status, deadline);

alter table public.quest enable row level security;

create policy "quest_self_all" on public.quest
  for all to authenticated
  using (character_id = auth.uid())
  with check (character_id = auth.uid());

-- ──────────────────────────────────────────────────────────────────────────
-- 3. quest_requirement
-- ──────────────────────────────────────────────────────────────────────────

create table public.quest_requirement (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.quest(id) on delete cascade,
  kind text not null check (kind in (
    'complete_task_n_times',     -- a specific task done N times within the window
    'complete_any_in_dim',       -- any task in a given dimension N times
    'reach_skill_value'          -- a skill PR ≥ min_value at any point in window
  )),
  task_id uuid references public.task(id) on delete set null,
  dimension_id text references public.dimension(id) on delete restrict,
  skill_id text references public.skill(id) on delete restrict,
  target_count integer check (target_count is null or target_count >= 1),
  min_value numeric,
  sort_order integer not null default 0,
  -- per-kind sanity: at least one of (task_id, dimension_id, skill_id) must be set
  check (
    (kind = 'complete_task_n_times' and task_id is not null and target_count is not null)
    or
    (kind = 'complete_any_in_dim' and dimension_id is not null and target_count is not null)
    or
    (kind = 'reach_skill_value' and skill_id is not null and min_value is not null)
  )
);

create index quest_requirement_quest_idx
  on public.quest_requirement (quest_id);

alter table public.quest_requirement enable row level security;

create policy "quest_req_self_all" on public.quest_requirement
  for all to authenticated
  using (
    exists (select 1 from public.quest q
            where q.id = quest_requirement.quest_id
              and q.character_id = auth.uid())
  )
  with check (
    exists (select 1 from public.quest q
            where q.id = quest_requirement.quest_id
              and q.character_id = auth.uid())
  );

-- ──────────────────────────────────────────────────────────────────────────
-- 4. RPC: start_quest_from_template
-- ──────────────────────────────────────────────────────────────────────────

create or replace function public.start_quest_from_template(p_template_id text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_template public.quest_template;
  v_quest_id uuid;
  v_req jsonb;
  v_kind text;
  v_task_id uuid;
  v_task_title text;
  v_dim_id text;
  v_skill_id text;
  v_target int;
  v_min numeric;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_template from public.quest_template where id = p_template_id;
  if not found then
    raise exception 'Quest template % not found', p_template_id;
  end if;

  insert into public.quest (
    character_id, template_id, title, description,
    deadline, reward_xp, reward_coins, allow_partial
  )
  values (
    auth.uid(), v_template.id, v_template.title, v_template.description,
    now() + (v_template.suggested_duration_days || ' days')::interval,
    v_template.reward_xp, v_template.reward_coins, v_template.allow_partial
  )
  returning id into v_quest_id;

  for v_req in select jsonb_array_elements(v_template.requirements) loop
    v_kind := v_req->>'kind';
    v_task_id := null;
    v_task_title := v_req->>'task_title';
    v_dim_id := v_req->>'dimension_id';
    v_skill_id := v_req->>'skill_id';
    v_target := nullif(v_req->>'target_count', '')::int;
    v_min := nullif(v_req->>'min_value', '')::numeric;

    if v_kind = 'complete_task_n_times' and v_task_title is not null then
      select id into v_task_id
      from public.task
      where character_id = auth.uid()
        and lower(title) = lower(v_task_title)
        and is_archived = false
      limit 1;
    end if;

    insert into public.quest_requirement (
      quest_id, kind, task_id, dimension_id, skill_id, target_count, min_value
    ) values (
      v_quest_id, v_kind, v_task_id, v_dim_id, v_skill_id, v_target, v_min
    );
  end loop;

  return v_quest_id;
end $$;

grant execute on function public.start_quest_from_template(text) to authenticated;

-- ──────────────────────────────────────────────────────────────────────────
-- 5. RPC: start_custom_quest
-- ──────────────────────────────────────────────────────────────────────────

create or replace function public.start_custom_quest(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quest_id uuid;
  v_req jsonb;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  insert into public.quest (
    character_id, title, description, deadline,
    reward_xp, reward_coins, allow_partial
  ) values (
    auth.uid(),
    p_payload->>'title',
    p_payload->>'description',
    (p_payload->>'deadline')::timestamptz,
    coalesce((p_payload->>'reward_xp')::int, 0),
    coalesce((p_payload->>'reward_coins')::int, 0),
    coalesce((p_payload->>'allow_partial')::boolean, false)
  )
  returning id into v_quest_id;

  for v_req in select jsonb_array_elements(p_payload->'requirements') loop
    insert into public.quest_requirement (
      quest_id, kind, task_id, dimension_id, skill_id, target_count, min_value
    ) values (
      v_quest_id,
      v_req->>'kind',
      nullif(v_req->>'task_id', '')::uuid,
      nullif(v_req->>'dimension_id', ''),
      nullif(v_req->>'skill_id', ''),
      nullif(v_req->>'target_count', '')::int,
      nullif(v_req->>'min_value', '')::numeric
    );
  end loop;

  return v_quest_id;
end $$;

grant execute on function public.start_custom_quest(jsonb) to authenticated;

-- ──────────────────────────────────────────────────────────────────────────
-- 6. RPC: complete_quest
-- ──────────────────────────────────────────────────────────────────────────

create or replace function public.complete_quest(p_quest_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quest public.quest;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  select * into v_quest
  from public.quest
  where id = p_quest_id and character_id = auth.uid();
  if not found then raise exception 'Quest not found'; end if;
  if v_quest.status <> 'active' then
    raise exception 'Quest is %, not active', v_quest.status;
  end if;

  update public.quest
  set status = 'completed',
      completed_at = now()
  where id = p_quest_id;

  update public.character
  set total_xp = total_xp + v_quest.reward_xp,
      coins = coins + v_quest.reward_coins
  where id = auth.uid();

  return json_build_object(
    'reward_xp', v_quest.reward_xp,
    'reward_coins', v_quest.reward_coins
  );
end $$;

grant execute on function public.complete_quest(uuid) to authenticated;

-- ──────────────────────────────────────────────────────────────────────────
-- 7. RPC: expire_overdue_quests
-- ──────────────────────────────────────────────────────────────────────────

create or replace function public.expire_overdue_quests()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;

  with expired as (
    update public.quest
    set status = 'expired'
    where character_id = auth.uid()
      and status = 'active'
      and deadline < now()
    returning id
  )
  select count(*) into v_count from expired;

  return v_count;
end $$;

grant execute on function public.expire_overdue_quests() to authenticated;

-- ──────────────────────────────────────────────────────────────────────────
-- 8. Seed quest_template catalog (~10 entries spread across themes).
--   These use task_title soft-matching so they latch onto seed_sample_tasks
--   when present (and degrade to "manually wire it up" if not).
-- ──────────────────────────────────────────────────────────────────────────

insert into public.quest_template
  (id, title, description, category, suggested_duration_days,
   reward_xp, reward_coins, allow_partial, requirements, sort_order)
values
  ('hydration_week',
   'Hydration King',
   'Hit 2L of water every day for a week.',
   'health', 7, 300, 200, false,
   jsonb_build_array(
     jsonb_build_object('kind','complete_task_n_times','task_title','Drink 2L of water','target_count',7)
   ), 1),

  ('reader_streak',
   'Reader''s Streak',
   'Read for 20 minutes, 14 days in a row.',
   'mind', 14, 600, 400, true,
   jsonb_build_array(
     jsonb_build_object('kind','complete_task_n_times','task_title','Read for 20 minutes','target_count',14)
   ), 2),

  ('strength_sprint',
   'Strength Sprint',
   'Crush 13 strength-tagged tasks in 30 days.',
   'fitness', 30, 800, 500, true,
   jsonb_build_array(
     jsonb_build_object('kind','complete_any_in_dim','dimension_id','strength','target_count',13)
   ), 3),

  ('mind_marathon',
   'Mind Marathon',
   'Complete any Mind-tagged task 30 times in 60 days.',
   'mind', 60, 1500, 1000, true,
   jsonb_build_array(
     jsonb_build_object('kind','complete_any_in_dim','dimension_id','mind','target_count',30)
   ), 4),

  ('pushup_silver',
   'Push-up Silver',
   'Hit 25 push-ups in a single set within a month.',
   'fitness', 30, 500, 300, false,
   jsonb_build_array(
     jsonb_build_object('kind','reach_skill_value','skill_id','pushups','min_value',25)
   ), 5),

  ('meditate_streak',
   'Mindful Month',
   'Meditate 10 minutes a day, every day for 30 days.',
   'mind', 30, 1200, 800, true,
   jsonb_build_array(
     jsonb_build_object('kind','complete_task_n_times','task_title','Meditate 10 minutes','target_count',30)
   ), 6),

  ('money_log_month',
   'Money Discipline',
   'Log expenses every day for 30 days.',
   'wealth', 30, 700, 500, true,
   jsonb_build_array(
     jsonb_build_object('kind','complete_task_n_times','task_title','Log today''s expenses','target_count',30)
   ), 7),

  ('social_reach_month',
   'Stay Connected',
   'Reach out to a friend 4 times in a month.',
   'social', 30, 400, 300, true,
   jsonb_build_array(
     jsonb_build_object('kind','complete_task_n_times','task_title','Reach out to a friend','target_count',4)
   ), 8),

  ('discipline_combo',
   'Iron Routine',
   'Earn 25 discipline-tagged completions in 60 days.',
   'discipline', 60, 1500, 1200, true,
   jsonb_build_array(
     jsonb_build_object('kind','complete_any_in_dim','dimension_id','discipline','target_count',25)
   ), 9),

  ('all_around_athlete',
   'All-Around Hero',
   'Complete a Strength task AND a Mind task AND a Health task — each at least 5x in 14 days.',
   'fitness', 14, 1000, 700, true,
   jsonb_build_array(
     jsonb_build_object('kind','complete_any_in_dim','dimension_id','strength','target_count',5),
     jsonb_build_object('kind','complete_any_in_dim','dimension_id','mind','target_count',5),
     jsonb_build_object('kind','complete_any_in_dim','dimension_id','health','target_count',5)
   ), 10);
