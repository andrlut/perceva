-- ============================================================================
-- Migration: replace start_quest_from_template to be locale-aware + v3-aware
--
-- Why: the original RPC (from 20260501000009_quests.sql) reads
--      v_template.title / v_template.description directly. After PR #148
--      (`20260517000003_quest_v3_challenge.sql`) the legacy `title` column on
--      quest_template was made nullable, and every quest template seeded by
--      the v3 + all-subs migrations was written with title_pt/title_en ONLY,
--      leaving `title` NULL. Starting a quest from any v3 template then
--      blew up on the `quest.title NOT NULL` constraint — surfaced in the
--      UI as a generic "Could not start quest / Unknown error".
--
-- Fix: snapshot a localized title/description at adoption time, using the
--      character's `locale` column (pt-BR vs en-US) with safe fallbacks.
--      Also copy the v3 challenge columns (quest_type, challenge_target_value,
--      challenge_unit_pt/en) so challenge-type quests carry their target.
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
  v_locale         text;
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

  -- Resolve the user's locale. character.locale is 'pt' or 'en' in this
  -- schema; default to 'pt' if missing (pt-BR is the V2 default).
  select coalesce(c.locale, 'pt') into v_locale
  from public.character c
  where c.id = auth.uid();

  -- Locale-aware title/description with cascade fallback. The legacy
  -- `title` column is the original mono-locale value (still populated on
  -- pre-v3 rows); v3 rows only have title_pt/title_en.
  if v_locale = 'pt' then
    v_title       := coalesce(v_template.title_pt,       v_template.title_en, v_template.title);
    v_description := coalesce(v_template.description_pt, v_template.description_en, v_template.description);
  else
    v_title       := coalesce(v_template.title_en,       v_template.title_pt, v_template.title);
    v_description := coalesce(v_template.description_en, v_template.description_pt, v_template.description);
  end if;

  -- Defensive: if ALL title columns are null, the catalog row is broken.
  -- Raise with a clear message instead of letting the downstream NOT NULL
  -- constraint surface as an opaque error.
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
