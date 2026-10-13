-- migration: 20261013000001_coins_only_practice.sql
-- purpose: prática SEM área — rende só moedas, zero XP
--
-- affected tables: task (+coin_stars)
-- rpcs:            set_task_subs (aceita lista vazia numa prática só-moedas),
--                  complete_task (ganha p_coin_stars; drop + create, mesma
--                  ordem dos parâmetros antigos)
-- breaking?        no — os 5 parâmetros antigos seguem iguais e com default;
--                  um client antigo chama a função nova sem saber de p_coin_stars
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   decisão do dono (2026-10-13, opção A): a prática sem área continua com
--   estrelas de 1 a 5 — a mesma régua de tudo — mas elas viram só moedas:
--   moedas = round(base_xp_for_stars(estrelas) × coin_multiplier), XP = 0,
--   nenhuma área do hex muda (nenhuma linha em task_completion_sub).
--   task.coin_stars guarda as estrelas da prática só-moedas; numa prática com
--   área ele é ignorado. p_coin_stars troca as estrelas SÓ deste registro
--   (folha de concluir), como p_sub_overrides faz com as áreas.
--   desfazer (delete_task_completion) já estorna coins_granted e percorre
--   task_completion_sub — sem linhas, não mexe em área nenhuma. Nada a mudar.
--   espelho no client: rewardForTaskSubs(subs, mult, coinStars) em app/lib/xp.ts.

begin;

alter table public.task
  add column if not exists coin_stars smallint
  check (coin_stars between 1 and 5);

comment on column public.task.coin_stars is
  'Estrelas (1..5) de uma prática SEM área: rende base_xp_for_stars(coin_stars) × coin_multiplier em moedas e zero XP. Ignorado quando a prática tem task_sub.';

-- ─── set_task_subs: lista vazia vale numa prática só-moedas ─────────────────
create or replace function public.set_task_subs(p_task_id uuid, p_subs jsonb)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_total integer;
  v_owner uuid;
  v_coin_stars smallint;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select character_id, coin_stars into v_owner, v_coin_stars
  from public.task where id = p_task_id;
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
    -- Sem área: só vale se a prática já tem as estrelas de moeda.
    if v_coin_stars is null then
      raise exception 'At least one sub is required (or set coin_stars for a coins-only practice)';
    end if;
    delete from public.task_sub where task_id = p_task_id;
    return;
  end if;

  select sum((elem->>'stars')::int) into v_total
  from jsonb_array_elements(p_subs) elem;

  if v_total is null or v_total < 1 then
    raise exception 'Stars must be ≥ 1';
  end if;

  -- Per-sub stars must be 1..5 (the single hard cap that remains).
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
end $function$;

-- ─── complete_task: ramo só-moedas ──────────────────────────────────────────
drop function if exists public.complete_task(uuid, timestamptz, date, jsonb, numeric);

create function public.complete_task(
  p_task_id uuid,
  p_completed_at timestamptz default null,
  p_local_date date default null,
  p_sub_overrides jsonb default null,
  p_coin_multiplier numeric default null,
  p_coin_stars smallint default null
)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_task record;
  v_completion_id uuid;
  v_completed_at timestamptz := coalesce(p_completed_at, now());
  v_local_date date := coalesce(p_local_date, (coalesce(p_completed_at, now()) at time zone 'UTC')::date);
  v_mult numeric;
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

  -- The choice made at completion time wins; otherwise the practice default.
  -- Validated here, before any write, because the value comes from the client.
  v_mult := coalesce(p_coin_multiplier, v_task.coin_multiplier, 1);
  if v_mult not in (0, 0.5, 1, 2) then
    raise exception 'Invalid coin multiplier % (allowed: 0, 0.5, 1, 2)', v_mult;
  end if;

  if p_sub_overrides is not null and jsonb_array_length(p_sub_overrides) > 0 then
    v_subs := p_sub_overrides;
  else
    select coalesce(jsonb_agg(jsonb_build_object('sub_id', sub_id, 'stars', stars)), '[]'::jsonb)
    into v_subs
    from public.task_sub
    where task_id = p_task_id;
  end if;

  -- Coins-only practice: no area, the stars become coins and XP stays 0.
  if jsonb_array_length(v_subs) = 0 then
    v_stars := coalesce(p_coin_stars, v_task.coin_stars);
    if v_stars is null then
      raise exception 'Task has no subs configured';
    end if;
    if v_stars < 1 or v_stars > 5 then
      raise exception 'Invalid coin stars value % (1..5)', v_stars;
    end if;
    v_total_coins := round(public.base_xp_for_stars(v_stars) * v_mult)::integer;

    insert into public.task_completion (
      task_id, character_id, completed_at, completed_local_date,
      xp_granted, coins_granted, total_stars, coin_multiplier
    ) values (
      p_task_id, v_uid, v_completed_at, v_local_date,
      0, v_total_coins, v_stars, v_mult
    )
    returning id into v_completion_id;

    update public.character
    set coins = coins + v_total_coins
    where id = v_uid;

    return json_build_object(
      'completion_id', v_completion_id,
      'xp_granted', 0,
      'coins_granted', v_total_coins,
      'total_stars', v_stars,
      'coin_multiplier', v_mult
    );
  end if;

  insert into public.task_completion (
    task_id,
    character_id,
    completed_at,
    completed_local_date,
    xp_granted,
    coins_granted,
    total_stars,
    coin_multiplier
  ) values (
    p_task_id,
    v_uid,
    v_completed_at,
    v_local_date,
    0,
    0,
    1,
    v_mult
  )
  returning id into v_completion_id;

  for v_elem in select * from jsonb_array_elements(v_subs) loop
    v_sub_id := v_elem->>'sub_id';
    v_stars := (v_elem->>'stars')::int;
    if v_stars < 1 or v_stars > 5 then
      raise exception 'Invalid stars value % for sub % (per-sub cap is 1..5)', v_stars, v_sub_id;
    end if;

    -- XP measures the effort (stars); coins are what the practice is worth.
    v_xp := public.base_xp_for_stars(v_stars);
    v_coins := round(v_xp * v_mult)::integer;

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
    'coin_multiplier', v_mult
  );
end $function$;

revoke execute on function public.complete_task(uuid, timestamptz, date, jsonb, numeric, smallint) from public, anon;
grant execute on function public.complete_task(uuid, timestamptz, date, jsonb, numeric, smallint) to authenticated;

commit;
