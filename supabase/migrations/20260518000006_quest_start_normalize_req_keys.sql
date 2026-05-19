-- ============================================================================
-- Migration: accept both `target_value` and legacy `target_count`/`min_value`
-- in quest_template.requirements JSON
--
-- Background: 20260518000005 unblocked starting v3-era quests by fixing the
-- title resolution, but the requirement INSERT still fails on:
--   new row for relation "quest_requirement" violates check constraint
--   "quest_requirement_check"  (SQLSTATE 23514)
--
-- Root cause: the original RPC (000009) reads `target_count` and `min_value`
-- from each requirement spec. The v3 seeds in 000004 (all-subs catalog)
-- use the unified key `target_value` instead — example:
--   {"kind":"reach_skill_value","skill_id":"sleep_8h_streak","target_value":14}
-- → v_min stays NULL → table check requires `min_value is not null` for
-- skill kinds → INSERT explodes.
--
-- The split (target_count int for task/dim, min_value numeric for skill) is
-- the on-disk column shape. The seeds chose to use a single `target_value`
-- key in the JSON spec. This migration teaches the RPC to read either.
-- ============================================================================

create or replace function public.start_quest_from_template(p_template_id text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_template       public.quest_template;
  v_quest_id       uuid;
  v_req            jsonb;
  v_kind           text;
  v_task_id        uuid;
  v_task_title     text;
  v_dim_id         text;
  v_skill_id       text;
  v_target         int;
  v_min            numeric;
  v_title          text;
  v_description    text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_template from public.quest_template where id = p_template_id;
  if not found then
    raise exception 'Quest template % not found', p_template_id;
  end if;

  -- pt-first cascade. Pre-v3 rows have `title` populated; v3 rows have
  -- title_pt/title_en (legacy `title` is null on those).
  v_title       := coalesce(v_template.title_pt,       v_template.title_en, v_template.title);
  v_description := coalesce(v_template.description_pt, v_template.description_en, v_template.description);

  if v_title is null then
    raise exception 'Quest template % has no title in any locale', p_template_id;
  end if;

  insert into public.quest (
    character_id, template_id, title, description,
    deadline, reward_xp, reward_coins, allow_partial,
    quest_type, challenge_target_value, challenge_unit_pt, challenge_unit_en
  )
  values (
    auth.uid(), v_template.id, v_title, v_description,
    now() + (v_template.suggested_duration_days || ' days')::interval,
    v_template.reward_xp, v_template.reward_coins, v_template.allow_partial,
    v_template.quest_type,
    v_template.challenge_target_value,
    v_template.challenge_unit_pt,
    v_template.challenge_unit_en
  )
  returning id into v_quest_id;

  for v_req in select jsonb_array_elements(v_template.requirements) loop
    v_kind := v_req->>'kind';
    v_task_id := null;
    v_task_title := v_req->>'task_title';
    v_dim_id := v_req->>'dimension_id';
    v_skill_id := v_req->>'skill_id';

    -- Normalize numeric key: legacy seeds use `target_count` (int) for
    -- task/dim kinds and `min_value` (numeric) for skill kinds. The v3
    -- all-subs seeds unify on `target_value`. Read either, route into the
    -- appropriate typed column based on `kind`.
    if v_kind = 'reach_skill_value' then
      v_target := null;
      v_min := nullif(coalesce(v_req->>'min_value', v_req->>'target_value'), '')::numeric;
    else
      v_target := nullif(coalesce(v_req->>'target_count', v_req->>'target_value'), '')::int;
      v_min := null;
    end if;

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
