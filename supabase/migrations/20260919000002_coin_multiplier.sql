-- migration: 20260919000002_coin_multiplier.sql
-- purpose: moedas separadas do XP nas práticas — multiplicador por prática e por registro
--
-- affected tables: task (+coin_multiplier), task_completion (+coin_multiplier)
-- rpcs:            complete_task, complete_template — ganham p_coin_multiplier (opcional)
-- breaking?        no — sem o parâmetro vale o padrão da prática, que nasce 1 (moedas
--                  iguais ao XP, o comportamento de sempre); o app antigo chama com os
--                  4 parâmetros de antes e cai no mesmo resultado
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--
-- A REGRA
--   XP continua sendo as estrelas (base_xp_for_stars): mede o esforço.
--   Moedas = round(xp × multiplicador), por sub, com multiplicador em {0, 0.5, 1, 2}
--   (Nada / Metade / Igual / Dobro). O padrão mora na prática (task.coin_multiplier);
--   cada registro guarda o que valeu (task_completion.coin_multiplier), então o "+1"
--   repete a mesma escolha e o histórico continua explicável. Registros antigos
--   ficam com 1, que é exatamente o que pagaram (moedas == xp).
--
-- ARREDONDAMENTO
--   round(numeric) leva .5 pra longe do zero (17.5 → 18), igual ao Math.round do app
--   pra positivos: a prévia na tela bate com o que o servidor credita.
--
-- SEGURANÇA
--   As duas funções são SECURITY DEFINER e o multiplicador vem do cliente, então o
--   conjunto fechado e o teto (2×) valem em dois lugares: no CHECK das colunas e na
--   validação da RPC, que roda antes de qualquer escrita. Dono e autenticação seguem
--   como antes. A assinatura cresce um parâmetro: as versões de 4 args saem, pra o
--   PostgREST ter um único candidato por nome, e EXECUTE fica só pra authenticated.

begin;

alter table public.task
  add column if not exists coin_multiplier numeric(2,1) not null default 1;
alter table public.task
  add constraint task_coin_multiplier_check
  check (coin_multiplier in (0, 0.5, 1, 2));

alter table public.task_completion
  add column if not exists coin_multiplier numeric(2,1) not null default 1;
alter table public.task_completion
  add constraint task_completion_coin_multiplier_check
  check (coin_multiplier in (0, 0.5, 1, 2));

drop function if exists public.complete_task(uuid, timestamptz, date, jsonb);
drop function if exists public.complete_template(text, timestamptz, date, jsonb);

create function public.complete_task(
  p_task_id uuid,
  p_completed_at timestamptz default null,
  p_local_date date default null,
  p_sub_overrides jsonb default null,
  p_coin_multiplier numeric default null
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
end $$;

revoke execute on function public.complete_task(uuid, timestamptz, date, jsonb, numeric) from public, anon;
grant execute on function public.complete_task(uuid, timestamptz, date, jsonb, numeric) to authenticated;

create function public.complete_template(
  p_template_id text,
  p_completed_at timestamptz default null,
  p_local_date date default null,
  p_sub_overrides jsonb default null,
  p_coin_multiplier numeric default null
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

  select * into v_template from public.task_template where id = p_template_id;
  if not found then
    raise exception 'Unknown template: %', p_template_id;
  end if;

  -- A catalog template has no default of its own: equal to the XP unless the
  -- completion chose otherwise. Validated before any write (client value).
  v_mult := coalesce(p_coin_multiplier, 1);
  if v_mult not in (0, 0.5, 1, 2) then
    raise exception 'Invalid coin multiplier % (allowed: 0, 0.5, 1, 2)', v_mult;
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
    xp_granted, coins_granted, total_stars, coin_multiplier
  ) values (
    null, p_template_id, v_uid, v_completed_at, v_local_date, 0, 0, 1, v_mult
  )
  returning id into v_completion_id;

  for v_elem in select * from jsonb_array_elements(v_subs) loop
    v_sub_id := v_elem->>'sub_id';
    v_stars := (v_elem->>'stars')::int;
    if v_stars < 1 or v_stars > 5 then
      raise exception 'Invalid stars value % for sub %', v_stars, v_sub_id;
    end if;

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
    'coin_multiplier', v_mult,
    'source', 'template',
    'template_id', p_template_id
  );
end $$;

revoke execute on function public.complete_template(text, timestamptz, date, jsonb, numeric) from public, anon;
grant execute on function public.complete_template(text, timestamptz, date, jsonb, numeric) to authenticated;

commit;
