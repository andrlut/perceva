-- ============================================================================
-- Tasks v3 — multi-sub model with per-sub stars (cap 5 total per task).
--
-- Replaces the single-sub + global-difficulty model with a granular one:
--   - Each task can touch N subs.
--   - Each sub has its own star count (1..5).
--   - Sum of stars across all subs of a task is capped at 5 (anything
--     beyond that should be a quest, per product direction).
--   - XP is computed per sub via the existing exponential curve
--     (5/15/40/100/250) and credited to the sub's parent dim. Total task
--     XP = sum across subs (Modelo A — per-sub independent, exponentially
--     scaled). Effort honesty: 4★+1★ tennis (105 XP) rewards differently
--     from 1★+1★+1★ morning routine (15 XP).
--
-- Per-completion runtime override: long-press the complete button to
-- bump/drop stars per sub before logging. The chosen breakdown is
-- snapshotted in task_completion_sub so undo refunds exactly what was
-- granted (independent of later edits to the task's defaults).
--
-- This migration is idempotent end-to-end. The cloud was already
-- partially migrated by an out-of-band script; the IF EXISTS / IF NOT
-- EXISTS guards let this file double as the canonical record + the
-- fresh-install spec.
-- ============================================================================

begin;

-- ─── 1. New tables ──────────────────────────────────────────────────────

create table if not exists public.task_sub (
  task_id uuid not null references public.task(id) on delete cascade,
  sub_id text not null references public.dimension_sub(id) on delete restrict,
  stars smallint not null check (stars between 1 and 5),
  primary key (task_id, sub_id)
);

create index if not exists task_sub_sub_idx on public.task_sub (sub_id);

alter table public.task_sub enable row level security;

drop policy if exists "task_sub_self_all" on public.task_sub;
create policy "task_sub_self_all" on public.task_sub
  for all to authenticated
  using (
    exists (
      select 1 from public.task t
      where t.id = task_sub.task_id and t.character_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.task t
      where t.id = task_sub.task_id and t.character_id = auth.uid()
    )
  );

create table if not exists public.task_template_sub (
  template_id text not null references public.task_template(id) on delete cascade,
  sub_id text not null references public.dimension_sub(id) on delete restrict,
  stars smallint not null check (stars between 1 and 5),
  primary key (template_id, sub_id)
);

create index if not exists task_template_sub_sub_idx on public.task_template_sub (sub_id);

alter table public.task_template_sub enable row level security;

drop policy if exists "task_template_sub_read_authenticated" on public.task_template_sub;
create policy "task_template_sub_read_authenticated"
  on public.task_template_sub for select
  to authenticated using (true);

create table if not exists public.task_completion_sub (
  completion_id uuid not null references public.task_completion(id) on delete cascade,
  sub_id text not null references public.dimension_sub(id) on delete restrict,
  stars smallint not null check (stars between 1 and 5),
  xp_granted integer not null check (xp_granted >= 0),
  coins_granted integer not null check (coins_granted >= 0),
  primary key (completion_id, sub_id)
);

create index if not exists task_completion_sub_sub_idx on public.task_completion_sub (sub_id);

alter table public.task_completion_sub enable row level security;

drop policy if exists "task_completion_sub_self_select" on public.task_completion_sub;
create policy "task_completion_sub_self_select" on public.task_completion_sub
  for select to authenticated
  using (
    exists (
      select 1 from public.task_completion tc
      where tc.id = task_completion_sub.completion_id
        and tc.character_id = auth.uid()
    )
  );

-- ─── 2. Backfill from legacy single-sub columns (only on fresh installs) ─
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='task' and column_name='sub_id'
  ) then
    insert into public.task_sub (task_id, sub_id, stars)
    select id, sub_id, coalesce(difficulty, 1)
    from public.task
    where sub_id is not null
    on conflict do nothing;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='task_template' and column_name='sub_id'
  ) then
    insert into public.task_template_sub (template_id, sub_id, stars)
    select id, sub_id, coalesce(difficulty, 1)
    from public.task_template
    where sub_id is not null
    on conflict do nothing;
  end if;
end $$;

-- ─── 3. Drop legacy columns ─────────────────────────────────────────────

alter table public.task
  drop column if exists sub_id,
  drop column if exists difficulty,
  drop column if exists metric_type,
  drop column if exists metric_label,
  drop column if exists base_value,
  drop column if exists increment_per_star;

alter table public.task_template
  drop constraint if exists task_template_scaling_all_or_none;

alter table public.task_template
  drop column if exists sub_id,
  drop column if exists difficulty,
  drop column if exists metric_type,
  drop column if exists metric_label,
  drop column if exists base_value,
  drop column if exists increment_per_star;

alter table public.task_completion
  drop column if exists selected_difficulty;

alter table public.task_completion
  add column if not exists total_stars smallint not null default 1
    check (total_stars between 1 and 5);

-- ─── 4. RPC: set_task_subs ──────────────────────────────────────────────
-- Atomic replace of all task_sub rows for a task. Validates owner +
-- cap-5 (sum of stars across subs).
--
-- Payload: '[{"sub_id":"sleep","stars":2}, {"sub_id":"contemplate","stars":1}]'

create or replace function public.set_task_subs(
  p_task_id uuid,
  p_subs jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
  v_owner uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select character_id into v_owner from public.task where id = p_task_id;
  if v_owner is null then
    raise exception 'Task not found';
  end if;
  if v_owner <> auth.uid() then
    raise exception 'Task not owned by current user';
  end if;

  if jsonb_typeof(p_subs) <> 'array' then
    raise exception 'p_subs must be a JSON array';
  end if;
  if jsonb_array_length(p_subs) = 0 then
    raise exception 'At least one sub is required';
  end if;

  select sum((elem->>'stars')::int) into v_total
  from jsonb_array_elements(p_subs) elem;

  if v_total is null or v_total < 1 then
    raise exception 'Stars must be ≥ 1';
  end if;
  if v_total > 5 then
    raise exception 'Total stars across subs cannot exceed 5 (got %)', v_total;
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_subs) elem
    where (elem->>'stars')::int < 1 or (elem->>'stars')::int > 5
  ) then
    raise exception 'Each sub must have 1..5 stars';
  end if;

  delete from public.task_sub where task_id = p_task_id;

  insert into public.task_sub (task_id, sub_id, stars)
  select
    p_task_id,
    elem->>'sub_id',
    (elem->>'stars')::int
  from jsonb_array_elements(p_subs) elem;
end $$;

grant execute on function public.set_task_subs(uuid, jsonb) to authenticated;

-- ─── 5. Rewrite complete_task ──────────────────────────────────────────
-- Per-sub fanout: snapshots into task_completion_sub, bumps per-dim XP,
-- patches the parent task_completion row's totals.
-- p_sub_overrides shape: '[{"sub_id":"strength","stars":3}, ...]'

create or replace function public.complete_task(
  p_task_id uuid,
  p_completed_at timestamptz default null,
  p_sub_overrides jsonb default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task record;
  v_completion_id uuid;
  v_completed_at timestamptz := coalesce(p_completed_at, now());
  v_streak_days integer;
  v_multiplier numeric;
  v_total_xp integer := 0;
  v_total_coins integer := 0;
  v_total_stars integer := 0;
  v_subs jsonb;
  v_elem jsonb;
  v_sub_id text;
  v_stars int;
  v_dim_id text;
  v_base_xp integer;
  v_xp integer;
  v_coins integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_task
  from public.task
  where id = p_task_id and character_id = auth.uid() and is_archived = false;
  if not found then
    raise exception 'Task not found or not owned by current user';
  end if;

  if p_sub_overrides is not null and jsonb_array_length(p_sub_overrides) > 0 then
    v_subs := p_sub_overrides;
    select sum((elem->>'stars')::int) into v_total_stars
    from jsonb_array_elements(v_subs) elem;
    if v_total_stars > 5 then
      raise exception 'Override stars total cannot exceed 5 (got %)', v_total_stars;
    end if;
    v_total_stars := 0;
  else
    select coalesce(jsonb_agg(jsonb_build_object('sub_id', sub_id, 'stars', stars)), '[]'::jsonb)
    into v_subs
    from public.task_sub
    where task_id = p_task_id;
    if v_subs is null or jsonb_array_length(v_subs) = 0 then
      raise exception 'Task has no subs configured';
    end if;
  end if;

  v_streak_days := public.compute_streak_days(
    auth.uid(),
    (v_completed_at at time zone 'UTC')::date
  );
  v_multiplier := public.streak_multiplier(v_streak_days);

  insert into public.task_completion (
    task_id, character_id, completed_at, xp_granted, coins_granted, total_stars
  ) values (
    p_task_id, auth.uid(), v_completed_at, 0, 0, 1
  )
  returning id into v_completion_id;

  for v_elem in select * from jsonb_array_elements(v_subs) loop
    v_sub_id := v_elem->>'sub_id';
    v_stars := (v_elem->>'stars')::int;
    if v_stars < 1 or v_stars > 5 then
      raise exception 'Invalid stars value % for sub %', v_stars, v_sub_id;
    end if;

    v_base_xp := case v_stars
      when 1 then 5
      when 2 then 15
      when 3 then 40
      when 4 then 100
      when 5 then 250
    end;
    v_xp := round(v_base_xp::numeric * v_multiplier)::integer;
    v_coins := v_xp;

    insert into public.task_completion_sub (
      completion_id, sub_id, stars, xp_granted, coins_granted
    ) values (
      v_completion_id, v_sub_id, v_stars, v_xp, v_coins
    );

    select dimension_id into v_dim_id from public.dimension_sub where id = v_sub_id;
    if v_dim_id is not null then
      update public.character_dimension
      set xp = xp + v_xp
      where character_id = auth.uid() and dimension_id = v_dim_id;
    end if;

    v_total_xp := v_total_xp + v_xp;
    v_total_coins := v_total_coins + v_coins;
    v_total_stars := v_total_stars + v_stars;
  end loop;

  v_total_stars := least(v_total_stars, 5);

  update public.task_completion
  set xp_granted = v_total_xp,
      coins_granted = v_total_coins,
      total_stars = v_total_stars
  where id = v_completion_id;

  update public.character
  set total_xp = total_xp + v_total_xp,
      coins = coins + v_total_coins
  where id = auth.uid();

  return json_build_object(
    'completion_id', v_completion_id,
    'xp_granted', v_total_xp,
    'coins_granted', v_total_coins,
    'total_stars', v_total_stars,
    'streak_days', v_streak_days,
    'multiplier', v_multiplier
  );
end $$;

grant execute on function public.complete_task(uuid, timestamptz, jsonb) to authenticated;

-- Drop the v1 signature (smallint third arg) so callers don't end up
-- dispatching to the wrong overload.
drop function if exists public.complete_task(uuid, timestamptz, smallint);

-- ─── 6. Rewrite delete_task_completion ─────────────────────────────────
-- Refund per the per-sub snapshot.

create or replace function public.delete_task_completion(p_completion_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comp record;
  v_elem record;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_comp
  from public.task_completion
  where id = p_completion_id and character_id = auth.uid();
  if not found then
    raise exception 'Completion not found or not owned by current user';
  end if;

  update public.character
  set total_xp = greatest(0, total_xp - v_comp.xp_granted),
      coins = greatest(0, coins - v_comp.coins_granted)
  where id = auth.uid();

  for v_elem in
    select tcs.sub_id, tcs.xp_granted, ds.dimension_id
    from public.task_completion_sub tcs
    join public.dimension_sub ds on ds.id = tcs.sub_id
    where tcs.completion_id = p_completion_id
  loop
    update public.character_dimension
    set xp = greatest(0, xp - v_elem.xp_granted)
    where character_id = auth.uid() and dimension_id = v_elem.dimension_id;
  end loop;

  delete from public.task_completion where id = p_completion_id;

  return json_build_object(
    'xp_returned', v_comp.xp_granted,
    'coins_returned', v_comp.coins_granted
  );
end $$;

grant execute on function public.delete_task_completion(uuid) to authenticated;

-- ─── 7. Rewrite start_task_from_template ──────────────────────────────
create or replace function public.start_task_from_template(
  p_template_id text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_template public.task_template%rowtype;
  v_new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_template from public.task_template where id = p_template_id;
  if not found then
    raise exception 'Unknown template: %', p_template_id;
  end if;

  insert into public.task (
    character_id, title, description, task_type,
    recurrence, target_count, template_id
  ) values (
    auth.uid(), v_template.title, v_template.description,
    v_template.task_type, v_template.recurrence, v_template.target_count,
    v_template.id
  )
  returning id into v_new_id;

  insert into public.task_sub (task_id, sub_id, stars)
  select v_new_id, sub_id, stars
  from public.task_template_sub
  where template_id = p_template_id;

  return v_new_id;
end $$;

grant execute on function public.start_task_from_template(text) to authenticated;

commit;
