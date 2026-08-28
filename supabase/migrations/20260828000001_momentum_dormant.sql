-- migration: 20260828000001_momentum_dormant.sql
-- purpose: put the Momentum bonus to sleep — complete_task and
--          complete_template stop applying the per-sub decayed bonus;
--          XP/coins go back to pure base_xp_for_stars.
--
-- affected tables: none (function redefinitions only)
-- new rpcs:        none
-- breaking?       no — same signatures, same return shapes. Payouts for NEW
--                 completions simply lose the up-to-+25% bonus; historical
--                 rows keep the xp_granted/coins_granted they were paid.
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   DORMANT, not deleted (owner decision 2026-08-28): the mechanic is
--   confusing to explain and unused in practice, but stays recoverable —
--   momentum_by_subattribute / momentum_by_attribute keep existing and
--   the full bonus math lives in 20260514000002. Re-enabling is a new
--   migration restoring that version of these two functions.
--   Client-side mirrors (lib/xp.ts preview, Momentum UI) were removed in
--   the same PR — the optimistic preview now matches the server exactly.

begin;

-- ─── complete_task, without the Momentum snapshot/bonus ────────────────
-- Body identical to 20260514000002 minus the momentum map + ramp:
-- v_xp is base_xp_for_stars(stars), coins == xp.

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
  v_xp integer;
  v_coins integer;
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

    -- Momentum dormant: pure star payout, no bonus.
    v_xp := public.base_xp_for_stars(v_stars);
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

-- ─── complete_template, without the Momentum snapshot/bonus ────────────
-- Body identical to 20260517000002 minus the momentum map + ramp.

create or replace function public.complete_template(
  p_template_id text,
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
  v_template record;
  v_completion_id uuid;
  v_completed_at timestamptz := coalesce(p_completed_at, now());
  v_local_date date := coalesce(
    p_local_date,
    (coalesce(p_completed_at, now()) at time zone 'UTC')::date
  );
  v_total_xp integer := 0;
  v_total_coins integer := 0;
  v_total_stars integer := 0;
  v_subs jsonb;
  v_elem jsonb;
  v_sub_id text;
  v_stars int;
  v_dim_id text;
  v_xp integer;
  v_coins integer;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_template from public.task_template where id = p_template_id;
  if not found then
    raise exception 'Unknown template: %', p_template_id;
  end if;

  if p_sub_overrides is not null and jsonb_array_length(p_sub_overrides) > 0 then
    v_subs := p_sub_overrides;
  else
    select coalesce(
      jsonb_agg(jsonb_build_object('sub_id', sub_id, 'stars', stars)),
      '[]'::jsonb
    )
    into v_subs
    from public.task_template_sub
    where template_id = p_template_id;

    if v_subs is null or jsonb_array_length(v_subs) = 0 then
      raise exception 'Template % has no subs configured', p_template_id;
    end if;
  end if;

  insert into public.task_completion (
    task_id, template_id, character_id, completed_at, completed_local_date,
    xp_granted, coins_granted, total_stars
  ) values (
    null, p_template_id, v_uid, v_completed_at, v_local_date, 0, 0, 1
  )
  returning id into v_completion_id;

  for v_elem in select * from jsonb_array_elements(v_subs) loop
    v_sub_id := v_elem->>'sub_id';
    v_stars := (v_elem->>'stars')::int;
    if v_stars < 1 or v_stars > 5 then
      raise exception 'Invalid stars value % for sub %', v_stars, v_sub_id;
    end if;

    -- Momentum dormant: pure star payout, no bonus.
    v_xp := public.base_xp_for_stars(v_stars);
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
    'total_stars', v_total_stars,
    'source', 'template',
    'template_id', p_template_id
  );
end $$;

grant execute on function public.complete_template(text, timestamptz, date, jsonb) to authenticated;

commit;
