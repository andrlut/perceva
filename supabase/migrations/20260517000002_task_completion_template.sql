-- ============================================================================
-- task_completion: allow completions sourced directly from a template,
-- without requiring a personal task row.
--
-- Use case: the "Geral" tab lets users complete a template task they don't
-- have adopted (e.g. "read 20 min" — done today but not part of my daily
-- routine). XP/coins/Momentum still accrue; no clutter added to the user's
-- task list.
--
-- Model: task_id becomes nullable, new template_id column added; check
-- constraint enforces that exactly one of the two is set per row.
--
-- New RPC: complete_template — mirrors complete_task but writes against
-- a template directly. Same Momentum bonus rules, same history shape.
-- ============================================================================

begin;

-- ─── 1. Schema change ─────────────────────────────────────────────────
alter table public.task_completion
  alter column task_id drop not null;

alter table public.task_completion
  add column if not exists template_id text
    references public.task_template(id) on delete set null;

-- Exactly one of task_id / template_id must be set.
alter table public.task_completion
  drop constraint if exists task_completion_one_source_chk;
alter table public.task_completion
  add constraint task_completion_one_source_chk check (
    (task_id is not null and template_id is null)
    or
    (task_id is null and template_id is not null)
  );

create index if not exists task_completion_template_id_idx
  on public.task_completion (character_id, template_id)
  where template_id is not null;

-- ─── 2. complete_template RPC ─────────────────────────────────────────
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
  MOMENTUM_CAP_VALUE constant integer := 300;
  MOMENTUM_BONUS_CAP constant numeric := 0.25;
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

  select * into v_template from public.task_template where id = p_template_id;
  if not found then
    raise exception 'Unknown template: %', p_template_id;
  end if;

  -- Resolve subs: explicit override, or default allocations from
  -- task_template_sub. Multi-sub templates supported via the same shape.
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

  -- Momentum snapshot BEFORE this completion contributes (same pattern as
  -- complete_task — current tap can't inflate its own bonus).
  select coalesce(jsonb_object_agg(t.sub_id, t.momentum), '{}'::jsonb)
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

    v_base_xp := public.base_xp_for_stars(v_stars);
    v_momentum := coalesce(((v_momentum_map ->> v_sub_id))::integer, 0);

    v_bonus := least(
      MOMENTUM_BONUS_CAP,
      (v_momentum::numeric / MOMENTUM_CAP_VALUE::numeric) * MOMENTUM_BONUS_CAP
    );
    if v_bonus < 0 then
      v_bonus := 0;
    end if;

    v_xp := round(v_base_xp * (1 + v_bonus))::integer;
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
