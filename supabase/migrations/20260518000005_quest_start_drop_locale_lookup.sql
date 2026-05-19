-- ============================================================================
-- Migration: drop the character.locale lookup from start_quest_from_template
--
-- Background: 20260518000004 introduced a locale-aware version that read
-- `character.locale`. That column has never been added to the schema —
-- CLAUDE.md documented it as if it existed, but no migration ever created
-- it. The previous fix landed and the function now fails with
--   column c.locale does not exist (SQLSTATE 42703)
--
-- Quick fix: drop the locale lookup entirely and resolve title/description
-- with a deterministic pt-first cascade. pt-BR is the V2 default per
-- product spec, so this is the right fallback when no per-user preference
-- is available. en-only users see pt titles on v3-seeded quests; that is
-- a follow-up UX item, not a blocker — the alternative (adding a locale
-- column + client write path + backfill) is bigger than this fix warrants.
--
-- Long-term: add `character.locale text default 'pt'` (or pass locale as an
-- RPC parameter) so adoption snapshots the user's chosen language.
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
