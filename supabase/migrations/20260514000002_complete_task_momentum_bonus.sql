-- ============================================================================
-- complete_task: apply Momentum bonus per sub.
--
-- Follow-up to 20260507000009 (which introduced Momentum but did not apply
-- it to XP/coins). After the Artur+André spec round closed, the decision is:
--
--   - Momentum bonus DOES affect XP and coins (testing phase, observe behavior)
--   - Cap: +25% bonus over base
--   - Linear ramp: momentum 0   →  0% bonus
--                  momentum 300 → 25% bonus
--                  momentum 600 → 25% bonus (saturated; surplus is "stock")
--   - Calculated PER SUB. A multi-sub task applies each sub's own bonus to
--     the XP/coins granted for that sub.
--   - Bonus uses momentum *before* the current completion contributes — the
--     current task can't inflate its own bonus.
--
-- Also hardens momentum_by_subattribute and momentum_by_attribute:
-- they're security definer, so they need to refuse cross-user queries.
-- ============================================================================

begin;

-- ─── 1. Auth-hardened momentum RPCs ────────────────────────────────────
-- Same query, wrapped in an authorization check so an authenticated user
-- can only read their own momentum.

create or replace function public.momentum_by_subattribute(
  p_character_id uuid,
  p_anchor_date date default null
)
returns table(sub_id text, momentum integer)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() <> p_character_id then
    raise exception 'Not authorized';
  end if;
  return query
    with params as (
      select coalesce(p_anchor_date, (now() at time zone 'UTC')::date) as anchor_date
    ),
    all_subs as (
      select id as sub_id from public.dimension_sub
    ),
    recent as (
      select
        tcs.sub_id,
        tc.completed_local_date,
        sum(public.base_xp_for_stars(tcs.stars))::numeric as base_xp
      from public.task_completion tc
      join public.task_completion_sub tcs on tcs.completion_id = tc.id
      join params on true
      where tc.character_id = p_character_id
        and tc.completed_local_date between params.anchor_date - 29 and params.anchor_date
      group by tcs.sub_id, tc.completed_local_date
    )
    select
      all_subs.sub_id,
      coalesce(round(sum(recent.base_xp * power(0.9::numeric, params.anchor_date - recent.completed_local_date))), 0)::integer
        as momentum
    from all_subs
    cross join params
    left join recent on recent.sub_id = all_subs.sub_id
    group by all_subs.sub_id
    order by all_subs.sub_id;
end;
$$;

create or replace function public.momentum_by_attribute(
  p_character_id uuid,
  p_anchor_date date default null
)
returns table(dimension_id text, momentum integer)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() <> p_character_id then
    raise exception 'Not authorized';
  end if;
  return query
    with sub_momentum as (
      select * from public.momentum_by_subattribute(p_character_id, p_anchor_date)
    )
    select
      ds.dimension_id,
      round(avg(coalesce(sm.momentum, 0)))::integer as momentum
    from public.dimension_sub ds
    left join sub_momentum sm on sm.sub_id = ds.id
    group by ds.dimension_id
    order by ds.dimension_id;
end;
$$;

-- ─── 2. complete_task with Momentum bonus ──────────────────────────────
-- Constants: easy to tweak after observation.
--   MOMENTUM_CAP_VALUE = 300
--   MOMENTUM_BONUS_CAP = 0.25

create or replace function public.complete_task(
  p_task_id uuid,
  p_completed_at timestamptz default null,
  p_local_date date default null,
  p_sub_overrides jsonb default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  MOMENTUM_CAP_VALUE constant integer := 300;
  MOMENTUM_BONUS_CAP constant numeric := 0.25;
  v_task record;
  v_completion_id uuid;
  v_completed_at timestamptz := coalesce(p_completed_at, now());
  v_local_date date := coalesce(p_local_date, (coalesce(p_completed_at, now()) at time zone 'UTC')::date);
  v_total_xp integer := 0;
  v_total_coins integer := 0;
  v_total_stars integer := 0;
  v_subs jsonb;
  v_elem jsonb;
  v_sub_id text;
  v_stars int;
  v_dim_id text;
  v_base_xp integer;
  v_momentum integer;
  v_bonus numeric;
  v_xp integer;
  v_coins integer;
  v_momentum_map jsonb := '{}'::jsonb;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_task
  from public.task
  where id = p_task_id and character_id = v_uid and is_archived = false;
  if not found then
    raise exception 'Task not found or not owned by current user';
  end if;

  if p_sub_overrides is not null and jsonb_array_length(p_sub_overrides) > 0 then
    v_subs := p_sub_overrides;
  else
    select coalesce(jsonb_agg(jsonb_build_object('sub_id', sub_id, 'stars', stars)), '[]'::jsonb)
    into v_subs
    from public.task_sub
    where task_id = p_task_id;
    if v_subs is null or jsonb_array_length(v_subs) = 0 then
      raise exception 'Task has no subs configured';
    end if;
  end if;

  -- Snapshot Momentum BEFORE this completion contributes. The current task's
  -- XP feeds into Momentum for *future* completions; the current bonus is
  -- always derived from the state of the world right before this tap.
  -- Inline copy of momentum_by_subattribute's body (cheaper than calling the
  -- function, and bypasses the auth check we just added — we already verified
  -- auth.uid() above).
  select coalesce(
    jsonb_object_agg(t.sub_id, t.momentum),
    '{}'::jsonb
  )
  into v_momentum_map
  from (
    with params as (
      select v_local_date as anchor_date
    ),
    all_subs as (
      select id as sub_id from public.dimension_sub
    ),
    recent as (
      select
        tcs.sub_id,
        tc.completed_local_date,
        sum(public.base_xp_for_stars(tcs.stars))::numeric as base_xp
      from public.task_completion tc
      join public.task_completion_sub tcs on tcs.completion_id = tc.id
      join params on true
      where tc.character_id = v_uid
        and tc.completed_local_date between params.anchor_date - 29 and params.anchor_date
      group by tcs.sub_id, tc.completed_local_date
    )
    select
      all_subs.sub_id,
      coalesce(round(sum(recent.base_xp * power(0.9::numeric, params.anchor_date - recent.completed_local_date))), 0)::integer
        as momentum
    from all_subs
    cross join params
    left join recent on recent.sub_id = all_subs.sub_id
    group by all_subs.sub_id
  ) as t;

  insert into public.task_completion (
    task_id,
    character_id,
    completed_at,
    completed_local_date,
    xp_granted,
    coins_granted,
    total_stars
  ) values (
    p_task_id,
    v_uid,
    v_completed_at,
    v_local_date,
    0,
    0,
    1
  )
  returning id into v_completion_id;

  for v_elem in select * from jsonb_array_elements(v_subs) loop
    v_sub_id := v_elem->>'sub_id';
    v_stars := (v_elem->>'stars')::int;
    if v_stars < 1 or v_stars > 5 then
      raise exception 'Invalid stars value % for sub % (per-sub cap is 1..5)', v_stars, v_sub_id;
    end if;

    v_base_xp := public.base_xp_for_stars(v_stars);

    -- Look up this sub's pre-completion Momentum (defaults to 0 if the sub
    -- never appears in the map — new user, brand-new sub, etc).
    v_momentum := coalesce(((v_momentum_map ->> v_sub_id))::integer, 0);

    -- Linear ramp, capped at MOMENTUM_BONUS_CAP.
    -- bonus = min(BONUS_CAP, (momentum / CAP_VALUE) * BONUS_CAP)
    v_bonus := least(
      MOMENTUM_BONUS_CAP,
      (v_momentum::numeric / MOMENTUM_CAP_VALUE::numeric) * MOMENTUM_BONUS_CAP
    );
    if v_bonus < 0 then
      v_bonus := 0;
    end if;

    v_xp := round(v_base_xp * (1 + v_bonus))::integer;
    v_coins := v_xp;  -- coins == xp by current convention

    insert into public.task_completion_sub (
      completion_id, sub_id, stars, xp_granted, coins_granted
    ) values (
      v_completion_id, v_sub_id, v_stars, v_xp, v_coins
    );

    select dimension_id into v_dim_id from public.dimension_sub where id = v_sub_id;
    if v_dim_id is not null then
      update public.character_dimension
      set xp = xp + v_xp
      where character_id = v_uid and dimension_id = v_dim_id;
    end if;

    v_total_xp := v_total_xp + v_xp;
    v_total_coins := v_total_coins + v_coins;
    v_total_stars := v_total_stars + v_stars;
  end loop;

  update public.task_completion
  set xp_granted = v_total_xp,
      coins_granted = v_total_coins,
      total_stars = v_total_stars
  where id = v_completion_id;

  update public.character
  set total_xp = total_xp + v_total_xp,
      coins = coins + v_total_coins
  where id = v_uid;

  return json_build_object(
    'completion_id', v_completion_id,
    'xp_granted', v_total_xp,
    'coins_granted', v_total_coins,
    'total_stars', v_total_stars
  );
end $$;

grant execute on function public.complete_task(uuid, timestamptz, date, jsonb) to authenticated;

commit;
