-- ============================================================================
-- Incremental star difficulty.
--
-- Tasks gain optional metric scaling: a base value at 1 star, and an
-- increment per additional star. The user picks the difficulty per
-- completion (e.g. swipe right on the card to go from 2★ to 3★) and the
-- target value scales accordingly:
--
--     target = base_value + increment_per_star * (selected_difficulty - 1)
--
--   2★ Read at base=20, +20/★  → 40 minutes
--   4★ Read at base=20, +20/★  → 80 minutes
--
-- Reward (xp/coins) scales with the *selected* difficulty using the same
-- curve as before (rewardForDifficulty in xp.ts):
--   1★ → 5,  2★ → 15,  3★ → 40,  4★ → 100,  5★ → 250
-- (multiplied by streak multiplier from migration 0501000012).
--
-- Backward compatibility:
--   - All new task columns are nullable. Tasks without metric_type behave
--     exactly as before — no scaling, no preview, no swipe.
--   - task.difficulty stays as the *default* difficulty for new completions.
--   - task_completion.selected_difficulty is the value actually used. We
--     backfill historical rows from task.difficulty so undo refunds the
--     right amount even retroactively.
--   - complete_task gains an optional p_selected_difficulty arg. When
--     null, it falls back to task.difficulty — old clients keep working.
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────
-- TASK: scaling fields (all optional)
-- ──────────────────────────────────────────────────────────────────────────

alter table public.task
  add column metric_type text check (
    metric_type in ('reps', 'minutes', 'pages', 'km', 'ml', 'custom')
  ),
  add column metric_label text,
  add column base_value numeric check (base_value > 0),
  add column increment_per_star numeric check (increment_per_star >= 0);

-- Either ALL of (metric_type, base_value, increment_per_star) are set, or
-- none of them. metric_label is optional (defaults to a UI fallback).
alter table public.task add constraint task_scaling_all_or_none check (
  (metric_type is null and base_value is null and increment_per_star is null)
  or
  (metric_type is not null and base_value is not null and increment_per_star is not null)
);

-- ──────────────────────────────────────────────────────────────────────────
-- TASK_COMPLETION: which star level was completed at
-- ──────────────────────────────────────────────────────────────────────────

alter table public.task_completion
  add column selected_difficulty smallint check (selected_difficulty between 1 and 5);

-- Backfill historical rows so undo math doesn't go negative on legacy data.
update public.task_completion tc
set selected_difficulty = t.difficulty
from public.task t
where tc.task_id = t.id
  and tc.selected_difficulty is null;

-- After backfill, enforce NOT NULL on new completions.
alter table public.task_completion
  alter column selected_difficulty set not null;

-- ──────────────────────────────────────────────────────────────────────────
-- complete_task: accept optional selected_difficulty
-- Replaces 0502000001's version. Same semantics for streak multiplier and
-- retroactive completion; adds a third optional arg.
-- ──────────────────────────────────────────────────────────────────────────

create or replace function public.complete_task(
  p_task_id uuid,
  p_completed_at timestamptz default null,
  p_selected_difficulty smallint default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task record;
  v_difficulty smallint;
  v_base_xp integer;
  v_xp integer;
  v_coins integer;
  v_dim_ids text[];
  v_completed_at timestamptz := coalesce(p_completed_at, now());
  v_streak_days integer;
  v_multiplier numeric;
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

  -- Resolve effective difficulty: client-provided wins, fallback to task default.
  v_difficulty := coalesce(p_selected_difficulty, v_task.difficulty);
  if v_difficulty < 1 or v_difficulty > 5 then
    raise exception 'selected_difficulty must be between 1 and 5';
  end if;

  v_base_xp := case v_difficulty
    when 1 then 5
    when 2 then 15
    when 3 then 40
    when 4 then 100
    when 5 then 250
  end;

  -- Streak multiplier (anchored at completion date — see 0502000001).
  v_streak_days := public.compute_streak_days(
    auth.uid(),
    (v_completed_at at time zone 'UTC')::date
  );
  v_multiplier := public.streak_multiplier(v_streak_days);

  v_xp := round(v_base_xp::numeric * v_multiplier)::integer;
  v_coins := v_xp;

  insert into public.task_completion (
    task_id, character_id, completed_at, xp_granted, coins_granted, selected_difficulty
  ) values (
    p_task_id, auth.uid(), v_completed_at, v_xp, v_coins, v_difficulty
  );

  update public.character
  set total_xp = total_xp + v_xp,
      coins = coins + v_coins
  where id = auth.uid();

  select array_agg(dimension_id) into v_dim_ids
  from public.task_dimension
  where task_id = p_task_id;

  if v_dim_ids is not null and array_length(v_dim_ids, 1) > 0 then
    update public.character_dimension
    set xp = xp + v_xp
    where character_id = auth.uid() and dimension_id = any(v_dim_ids);
  end if;

  return json_build_object(
    'xp_granted', v_xp,
    'coins_granted', v_coins,
    'base_xp', v_base_xp,
    'selected_difficulty', v_difficulty,
    'streak_days', v_streak_days,
    'multiplier', v_multiplier
  );
end $$;

grant execute on function public.complete_task(uuid, timestamptz, smallint) to authenticated;
