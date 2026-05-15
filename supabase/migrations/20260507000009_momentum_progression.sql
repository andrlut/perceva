-- ============================================================================
-- Progression redesign v1: Momentum by subattribute.
--
-- Momentum is a short-term progress signal calculated from recent completed
-- task subs. It does not affect rewards in this version.
-- ============================================================================

begin;

alter table public.task_completion
  add column if not exists completed_local_date date;

update public.task_completion
set completed_local_date = (completed_at at time zone 'UTC')::date
where completed_local_date is null;

alter table public.task_completion
  alter column completed_local_date set not null;

create index if not exists task_completion_character_local_date_idx
  on public.task_completion (character_id, completed_local_date);

create or replace function public.base_xp_for_stars(p_stars integer)
returns integer
language sql
immutable
as $$
  select case p_stars
    when 1 then 5
    when 2 then 15
    when 3 then 40
    when 4 then 100
    when 5 then 250
    else null
  end;
$$;

grant execute on function public.base_xp_for_stars(integer) to authenticated;

create or replace function public.momentum_by_subattribute(
  p_character_id uuid,
  p_anchor_date date default null
)
returns table(sub_id text, momentum integer)
language sql
stable
security definer
set search_path = public
as $$
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
    coalesce(round(sum(recent.base_xp * power(0.9::numeric, params.anchor_date - recent.completed_local_date))), 0)::integer as momentum
  from all_subs
  cross join params
  left join recent on recent.sub_id = all_subs.sub_id
  group by all_subs.sub_id
  order by all_subs.sub_id;
$$;

grant execute on function public.momentum_by_subattribute(uuid, date) to authenticated;

create or replace function public.momentum_by_attribute(
  p_character_id uuid,
  p_anchor_date date default null
)
returns table(dimension_id text, momentum integer)
language sql
stable
security definer
set search_path = public
as $$
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
$$;

grant execute on function public.momentum_by_attribute(uuid, date) to authenticated;

drop function if exists public.complete_task(uuid, timestamptz, jsonb);

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
    auth.uid(),
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
      where character_id = auth.uid() and dimension_id = v_dim_id;
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
  where id = auth.uid();

  return json_build_object(
    'completion_id', v_completion_id,
    'xp_granted', v_total_xp,
    'coins_granted', v_total_coins,
    'total_stars', v_total_stars
  );
end $$;

grant execute on function public.complete_task(uuid, timestamptz, date, jsonb) to authenticated;

commit;
