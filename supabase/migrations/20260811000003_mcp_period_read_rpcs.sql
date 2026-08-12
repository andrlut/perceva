-- migration: 20260811000003_mcp_period_read_rpcs.sql
-- purpose: read-only period-analysis RPCs (mcp_*) — the shared read layer for
--          the Perceva MCP server (Edge Function `perceva-mcp`) and, later,
--          for the period-report routine (Retrô). Every function aggregates a
--          single user's window of mood / practice / quest / skill data into
--          one jsonb payload so an external LLM client can answer questions
--          like "how was my mood on days tagged work?" in a single call.
--
-- affected tables: none (read-only functions)
-- new rpcs:        mcp_get_profile_summary()
--                  mcp_get_mood_entries(date, date, text[], text, int, int, boolean, int)
--                  mcp_get_mood_stats(date, date, text, boolean)
--                  mcp_get_task_completions(date, date, text, text, boolean, int)
--                  mcp_get_quests(date, date, text)
--                  mcp_get_skill_logs(date, date, uuid)
--                  mcp_get_period_digest(date, date, text)
-- breaking?       no — additive only
--
-- notes:
--   migrations are write-once; never edit after applying
--   ALL functions are SECURITY INVOKER (the default) + STABLE: they run as the
--   calling role, so the existing self-only RLS policies are the hard boundary.
--   A bug in the MCP server can never read another user's rows through these.
--   auth.uid() doubles as character_id (1:1 with auth.users across the schema).
--   Windows are capped at 731 days to bound work; mood entries at 400 rows.
--   `character.locale` does NOT exist (see 20260518000005) — locale is a
--   client-side concept; these functions return raw data, no locale logic.

begin;

-- ─── 1. mcp_get_profile_summary ──────────────────────────────────────────────
-- Context anchor in one call: who the user is, lifetime XP per dimension,
-- current sub scores per source, entity counts, and the useful data range so
-- the client knows which windows are worth querying.
create or replace function public.mcp_get_profile_summary()
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_result jsonb;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select jsonb_build_object(
    'display_name', p.display_name,
    'member_since', p.created_at::date,
    'total_xp', c.total_xp,
    'coins', c.coins,
    'dimensions', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'dimension_id', cd.dimension_id,
        'xp', cd.xp
      ) order by d.sort_order), '[]'::jsonb)
      from public.character_dimension cd
      join public.dimension d on d.id = cd.dimension_id
      where cd.character_id = v_uid
    ),
    'sub_scores', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'sub_id', s.sub_id,
        'source', s.source,
        'score', coalesce(s.score_decimal, s.score)
      ) order by s.sub_id, s.source), '[]'::jsonb)
      from public.character_sub_score s
      where s.character_id = v_uid
    ),
    'counts', jsonb_build_object(
      'active_tasks',
        (select count(*) from public.task t
          where t.character_id = v_uid and not t.is_archived),
      'active_quests',
        (select count(*) from public.quest q
          where q.character_id = v_uid and q.status = 'active'),
      'custom_skills',
        (select count(*) from public.skill sk
          where sk.character_id = v_uid),
      'mood_days_total',
        (select count(*) from public.mood_log m
          where m.character_id = v_uid)
    ),
    'data_range', jsonb_build_object(
      'first_completion',
        (select min(tc.completed_local_date) from public.task_completion tc
          where tc.character_id = v_uid),
      'last_completion',
        (select max(tc.completed_local_date) from public.task_completion tc
          where tc.character_id = v_uid),
      'first_mood',
        (select min(m.logged_for) from public.mood_log m
          where m.character_id = v_uid),
      'last_mood',
        (select max(m.logged_for) from public.mood_log m
          where m.character_id = v_uid)
    )
  )
  into v_result
  from public.profile p
  join public.character c on c.id = p.id
  where p.id = v_uid;

  return coalesce(v_result, '{}'::jsonb);
end $$;

-- ─── 2. mcp_get_mood_entries ─────────────────────────────────────────────────
-- Raw mood rows in a window, with server-side tag/mood filters. The central
-- tool for "days tagged X". p_include_notes=false enables quantitative
-- analysis without exposing the free-text journal.
create or replace function public.mcp_get_mood_entries(
  p_from date,
  p_to date,
  p_tags text[] default null,
  p_tags_mode text default 'any',
  p_mood_min int default null,
  p_mood_max int default null,
  p_include_notes boolean default true,
  p_limit int default 400
) returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_limit int := least(greatest(coalesce(p_limit, 400), 1), 400);
  v_entries jsonb;
  v_days_logged int;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if p_from is null or p_to is null or p_to < p_from then
    raise exception 'Invalid window: from=% to=%', p_from, p_to;
  end if;
  if (p_to - p_from) > 731 then
    raise exception 'Window too large (max 731 days)';
  end if;
  if p_tags_mode not in ('any', 'all') then
    raise exception 'tags_mode must be any|all, got %', p_tags_mode;
  end if;

  select count(*) into v_days_logged
  from public.mood_log m
  where m.character_id = v_uid and m.logged_for between p_from and p_to;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'date', e.logged_for,
      'mood', e.mood,
      'tags', coalesce(to_jsonb(e.tags), '[]'::jsonb)
    ) || case when p_include_notes
         then jsonb_build_object('note', e.note)
         else '{}'::jsonb end
    order by e.logged_for
  ), '[]'::jsonb)
  into v_entries
  from (
    select m.logged_for, m.mood, m.tags, m.note
    from public.mood_log m
    where m.character_id = v_uid
      and m.logged_for between p_from and p_to
      and (p_mood_min is null or m.mood >= p_mood_min)
      and (p_mood_max is null or m.mood <= p_mood_max)
      and (p_tags is null
           or (p_tags_mode = 'any' and m.tags && p_tags)
           or (p_tags_mode = 'all' and m.tags @> p_tags))
    order by m.logged_for
    limit v_limit
  ) e;

  return jsonb_build_object(
    'window', jsonb_build_object('from', p_from, 'to', p_to),
    'days_in_window', (p_to - p_from + 1),
    'days_logged_in_window', v_days_logged,
    'matched', jsonb_array_length(v_entries),
    'entries', v_entries
  );
end $$;

-- ─── 3. mcp_get_mood_stats ───────────────────────────────────────────────────
-- Aggregates computed in Postgres — zero notes ever leave this function.
-- group_by 'tag' answers "does work drag my mood down?" directly: avg mood on
-- days WITH each tag vs days WITHOUT it (computed algebraically from sums).
create or replace function public.mcp_get_mood_stats(
  p_from date,
  p_to date,
  p_group_by text default 'tag',
  p_compare_previous boolean default false
) returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_overall jsonb;
  v_groups jsonb;
  v_prev jsonb := null;
  v_prev_from date;
  v_prev_to date;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if p_from is null or p_to is null or p_to < p_from then
    raise exception 'Invalid window: from=% to=%', p_from, p_to;
  end if;
  if (p_to - p_from) > 731 then
    raise exception 'Window too large (max 731 days)';
  end if;
  if p_group_by not in ('tag', 'weekday', 'iso_week', 'month') then
    raise exception 'group_by must be tag|weekday|iso_week|month, got %', p_group_by;
  end if;

  select jsonb_build_object(
    'days_in_window', (p_to - p_from + 1),
    'days_logged', count(*),
    'avg_mood', round(avg(m.mood)::numeric, 2),
    'distribution', coalesce((
      select jsonb_object_agg(d.mood::text, d.n)
      from (
        select m2.mood, count(*) as n
        from public.mood_log m2
        where m2.character_id = v_uid and m2.logged_for between p_from and p_to
        group by m2.mood
      ) d
    ), '{}'::jsonb)
  )
  into v_overall
  from public.mood_log m
  where m.character_id = v_uid and m.logged_for between p_from and p_to;

  if p_group_by = 'tag' then
    with w as (
      select m.mood, m.tags
      from public.mood_log m
      where m.character_id = v_uid and m.logged_for between p_from and p_to
    ),
    overall as (
      select count(*)::numeric as n, coalesce(sum(mood), 0)::numeric as total
      from w
    ),
    tagged as (
      select u.tag, count(*)::numeric as n_with,
             sum(w.mood)::numeric as sum_with
      from w, lateral unnest(coalesce(w.tags, '{}'::text[])) as u(tag)
      group by u.tag
    )
    select coalesce(jsonb_agg(jsonb_build_object(
      'tag', t.tag,
      'label_pt', mt.label_pt,
      'tag_group', mt.tag_group,
      'valence', mt.valence,
      'days_with', t.n_with,
      'avg_with', round(t.sum_with / t.n_with, 2),
      'days_without', (o.n - t.n_with),
      'avg_without', case when (o.n - t.n_with) > 0
        then round((o.total - t.sum_with) / (o.n - t.n_with), 2)
        else null end,
      'delta', case when (o.n - t.n_with) > 0
        then round((t.sum_with / t.n_with)
                 - ((o.total - t.sum_with) / (o.n - t.n_with)), 2)
        else null end
    ) order by t.n_with desc, t.tag), '[]'::jsonb)
    into v_groups
    from tagged t
    cross join overall o
    left join public.mood_tag mt on mt.slug = t.tag;

  elsif p_group_by = 'weekday' then
    select coalesce(jsonb_agg(jsonb_build_object(
      'isodow', g.dow,
      'weekday', g.dname,
      'days_logged', g.n,
      'avg_mood', g.avg_mood
    ) order by g.dow), '[]'::jsonb)
    into v_groups
    from (
      select extract(isodow from m.logged_for)::int as dow,
             min(trim(to_char(m.logged_for, 'Dy'))) as dname,
             count(*) as n,
             round(avg(m.mood)::numeric, 2) as avg_mood
      from public.mood_log m
      where m.character_id = v_uid and m.logged_for between p_from and p_to
      group by 1
    ) g;

  else
    select coalesce(jsonb_agg(jsonb_build_object(
      'bucket', g.bucket,
      'days_logged', g.n,
      'avg_mood', g.avg_mood
    ) order by g.bucket), '[]'::jsonb)
    into v_groups
    from (
      select case when p_group_by = 'iso_week'
               then to_char(m.logged_for, 'IYYY-"W"IW')
               else to_char(m.logged_for, 'YYYY-MM') end as bucket,
             count(*) as n,
             round(avg(m.mood)::numeric, 2) as avg_mood
      from public.mood_log m
      where m.character_id = v_uid and m.logged_for between p_from and p_to
      group by 1
    ) g;
  end if;

  if p_compare_previous then
    v_prev_to := p_from - 1;
    v_prev_from := p_from - (p_to - p_from + 1);
    select jsonb_build_object(
      'from', v_prev_from,
      'to', v_prev_to,
      'days_logged', count(*),
      'avg_mood', round(avg(m.mood)::numeric, 2)
    )
    into v_prev
    from public.mood_log m
    where m.character_id = v_uid and m.logged_for between v_prev_from and v_prev_to;
  end if;

  return jsonb_build_object(
    'window', jsonb_build_object('from', p_from, 'to', p_to),
    'overall', v_overall,
    'group_by', p_group_by,
    'groups', v_groups,
    'previous_window', v_prev
  );
end $$;

-- ─── 4. mcp_get_task_completions ─────────────────────────────────────────────
-- Practice in a window: totals, per-dimension and per-sub XP, top tasks, daily
-- series, optional skips. p_dimension / p_sub narrow to completions that touch
-- that dimension/sub (totals then cover the matching completions; the
-- sub-level xp of the matching subs is reported as xp_in_filter).
create or replace function public.mcp_get_task_completions(
  p_from date,
  p_to date,
  p_dimension text default null,
  p_sub text default null,
  p_include_skips boolean default false,
  p_top_tasks int default 20
) returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_top int := least(greatest(coalesce(p_top_tasks, 20), 1), 50);
  v_result jsonb;
  v_skips jsonb := null;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if p_from is null or p_to is null or p_to < p_from then
    raise exception 'Invalid window: from=% to=%', p_from, p_to;
  end if;
  if (p_to - p_from) > 731 then
    raise exception 'Window too large (max 731 days)';
  end if;
  if p_dimension is not null
     and not exists (select 1 from public.dimension d where d.id = p_dimension) then
    raise exception 'Unknown dimension: %', p_dimension;
  end if;
  if p_sub is not null
     and not exists (select 1 from public.dimension_sub s where s.id = p_sub) then
    raise exception 'Unknown sub: %', p_sub;
  end if;

  -- STABLE function → no temp tables; everything derives from one CTE in a
  -- single statement. `match` = completions in window, narrowed by sub/dim.
  with match as (
    select tc.id as completion_id, tc.completed_local_date, tc.task_id,
           tc.xp_granted, tc.coins_granted, tc.total_stars
    from public.task_completion tc
    where tc.character_id = v_uid
      and tc.completed_local_date between p_from and p_to
      and (
        (p_dimension is null and p_sub is null)
        or exists (
          select 1
          from public.task_completion_sub tcs
          join public.dimension_sub ds on ds.id = tcs.sub_id
          where tcs.completion_id = tc.id
            and (p_sub is null or tcs.sub_id = p_sub)
            and (p_dimension is null or ds.dimension_id = p_dimension)
        )
      )
  )
  select jsonb_build_object(
    'totals', (
      select jsonb_build_object(
        'completions', count(*),
        'xp', coalesce(sum(m.xp_granted), 0),
        'coins', coalesce(sum(m.coins_granted), 0),
        'stars', coalesce(sum(m.total_stars), 0),
        'active_days', count(distinct m.completed_local_date)
      ) from match m
    ),
    -- Sub-level xp restricted to the filter ("honest XP of strength this week").
    'xp_in_filter', case when p_dimension is null and p_sub is null then null
      else (
        select coalesce(sum(tcs.xp_granted), 0)
        from match m
        join public.task_completion_sub tcs on tcs.completion_id = m.completion_id
        join public.dimension_sub ds on ds.id = tcs.sub_id
        where (p_sub is null or tcs.sub_id = p_sub)
          and (p_dimension is null or ds.dimension_id = p_dimension)
      ) end,
    'by_dimension', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'dimension_id', g.dimension_id,
        'xp', g.xp,
        'stars', g.stars,
        'completions', g.n
      ) order by g.xp desc), '[]'::jsonb)
      from (
        select ds.dimension_id,
               sum(tcs.xp_granted) as xp,
               sum(tcs.stars) as stars,
               count(distinct m.completion_id) as n
        from match m
        join public.task_completion_sub tcs on tcs.completion_id = m.completion_id
        join public.dimension_sub ds on ds.id = tcs.sub_id
        group by ds.dimension_id
      ) g
    ),
    'by_sub', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'sub_id', g.sub_id,
        'dimension_id', g.dimension_id,
        'xp', g.xp,
        'stars', g.stars,
        'completions', g.n
      ) order by g.xp desc), '[]'::jsonb)
      from (
        select tcs.sub_id, ds.dimension_id,
               sum(tcs.xp_granted) as xp,
               sum(tcs.stars) as stars,
               count(distinct m.completion_id) as n
        from match m
        join public.task_completion_sub tcs on tcs.completion_id = m.completion_id
        join public.dimension_sub ds on ds.id = tcs.sub_id
        group by tcs.sub_id, ds.dimension_id
      ) g
    ),
    'top_tasks', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'task_id', g.task_id,
        'title', g.title,
        'completions', g.n,
        'xp', g.xp
      ) order by g.n desc, g.xp desc), '[]'::jsonb)
      from (
        select m.task_id,
               coalesce(min(t.title), '(deleted task)') as title,
               count(*) as n,
               sum(m.xp_granted) as xp
        from match m
        left join public.task t on t.id = m.task_id
        group by m.task_id
        order by count(*) desc, sum(m.xp_granted) desc
        limit v_top
      ) g
    ),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'date', g.d,
        'completions', g.n,
        'xp', g.xp
      ) order by g.d), '[]'::jsonb)
      from (
        select m.completed_local_date as d, count(*) as n, sum(m.xp_granted) as xp
        from match m
        group by m.completed_local_date
      ) g
    )
  )
  into v_result;

  if p_include_skips then
    select coalesce(jsonb_agg(jsonb_build_object(
      'date', s.skipped_for,
      'task_id', s.task_id,
      'title', coalesce(t.title, '(deleted task)'),
      'reason', s.reason
    ) order by s.skipped_for), '[]'::jsonb)
    into v_skips
    from public.task_skip s
    left join public.task t on t.id = s.task_id
    where s.character_id = v_uid
      and s.skipped_for between p_from and p_to;
  end if;

  return jsonb_build_object(
    'window', jsonb_build_object('from', p_from, 'to', p_to),
    'filter', jsonb_build_object('dimension', p_dimension, 'sub', p_sub)
  ) || v_result || jsonb_build_object('skips', v_skips);
end $$;

-- ─── 5. mcp_get_quests ───────────────────────────────────────────────────────
-- Quests/Metas overlapping the window (or all when no window), with
-- requirement progress computed against each quest's own started_at..deadline
-- span. Progress mirrors the client's read-side computation closely enough
-- for analysis; the app remains the source of truth for quest state.
create or replace function public.mcp_get_quests(
  p_from date default null,
  p_to date default null,
  p_status text default 'all'
) returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_quests jsonb;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if (p_from is null) <> (p_to is null) then
    raise exception 'Provide both from and to, or neither';
  end if;
  if p_from is not null and p_to < p_from then
    raise exception 'Invalid window: from=% to=%', p_from, p_to;
  end if;
  if p_status not in ('all', 'active', 'completed', 'failed', 'expired', 'abandoned') then
    raise exception 'Invalid status filter: %', p_status;
  end if;

  select coalesce(jsonb_agg(q_obj order by q_started desc), '[]'::jsonb)
  into v_quests
  from (
    select q.started_at as q_started,
      jsonb_build_object(
        'quest_id', q.id,
        'title', q.title,
        'quest_type', q.quest_type,
        'status', q.status,
        'started_at', q.started_at::date,
        'deadline', q.deadline::date,
        'completed_at', q.completed_at::date,
        'reward_xp', q.reward_xp,
        'reward_coins', q.reward_coins,
        'is_meta', not exists (
          select 1 from public.quest_requirement r0
          where r0.quest_id = q.id and r0.kind = 'accumulate_sub_stars'
        ),
        'challenge', case when q.quest_type = 'challenge' then jsonb_build_object(
          'target', q.challenge_target_value,
          'unit_pt', q.challenge_unit_pt,
          'current', (
            select max(l.value) from public.quest_challenge_log l
            where l.quest_id = q.id
          )
        ) else null end,
        'requirements', (
          select coalesce(jsonb_agg(jsonb_build_object(
            'kind', r.kind,
            'task_id', r.task_id,
            'task_title', (select t.title from public.task t where t.id = r.task_id),
            'dimension_id', r.dimension_id,
            'sub_id', r.sub_id,
            'skill_id', r.skill_id,
            'target', coalesce(r.target_count, r.min_value::int),
            'current', case r.kind
              when 'complete_task_n_times' then (
                select count(*) from public.task_completion tc
                where tc.character_id = v_uid
                  and tc.task_id = r.task_id
                  and tc.completed_at >= q.started_at
                  and tc.completed_at <= q.deadline
              )
              when 'complete_any_in_dim' then (
                select count(distinct tc.id)
                from public.task_completion tc
                join public.task_completion_sub tcs on tcs.completion_id = tc.id
                join public.dimension_sub ds on ds.id = tcs.sub_id
                where tc.character_id = v_uid
                  and ds.dimension_id = r.dimension_id
                  and tc.completed_at >= q.started_at
                  and tc.completed_at <= q.deadline
              )
              when 'accumulate_sub_stars' then (
                select coalesce(sum(tcs.stars), 0)
                from public.task_completion tc
                join public.task_completion_sub tcs on tcs.completion_id = tc.id
                where tc.character_id = v_uid
                  and tcs.sub_id = r.sub_id
                  and tc.completed_at >= q.started_at
                  and tc.completed_at <= q.deadline
              )
              when 'reach_skill_value' then (
                select coalesce(max(sl.value), 0)::bigint
                from public.skill_log sl
                where sl.character_id = v_uid
                  and sl.skill_id = r.skill_id
              )
              else null end
          ) order by r.sort_order), '[]'::jsonb)
          from public.quest_requirement r
          where r.quest_id = q.id
        )
      ) as q_obj
    from public.quest q
    where q.character_id = v_uid
      and (p_status = 'all' or q.status = p_status)
      and (p_from is null or (
        q.started_at::date <= p_to
        and greatest(coalesce(q.completed_at, q.deadline), q.deadline)::date >= p_from
      ))
  ) sub;

  return jsonb_build_object(
    'window', case when p_from is null then null
      else jsonb_build_object('from', p_from, 'to', p_to) end,
    'status_filter', p_status,
    'quests', v_quests
  );
end $$;

-- ─── 6. mcp_get_skill_logs ───────────────────────────────────────────────────
-- Skill entries in a window plus a per-skill summary (window max/last vs
-- all-time PR) — "did I set a record this month?".
create or replace function public.mcp_get_skill_logs(
  p_from date,
  p_to date,
  p_skill_id uuid default null
) returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_entries jsonb;
  v_summary jsonb;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if p_from is null or p_to is null or p_to < p_from then
    raise exception 'Invalid window: from=% to=%', p_from, p_to;
  end if;
  if (p_to - p_from) > 731 then
    raise exception 'Window too large (max 731 days)';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'logged_at', sl.logged_at,
    'skill_id', sl.skill_id,
    'skill', coalesce(sk.display_name_pt, sk.display_name),
    'unit', coalesce(sk.unit_pt, sk.unit),
    'value', sl.value
  ) order by sl.logged_at), '[]'::jsonb)
  into v_entries
  from public.skill_log sl
  join public.skill sk on sk.id = sl.skill_id
  where sl.character_id = v_uid
    and sl.logged_at >= p_from::timestamptz
    and sl.logged_at < (p_to + 1)::timestamptz
    and (p_skill_id is null or sl.skill_id = p_skill_id);

  select coalesce(jsonb_agg(jsonb_build_object(
    'skill_id', g.skill_id,
    'skill', g.skill,
    'unit', g.unit,
    'logs_in_window', g.n,
    'max_in_window', g.max_w,
    'last_in_window', g.last_w,
    'all_time_pr', g.pr,
    'new_pr_in_window', (g.max_w >= g.pr)
  ) order by g.n desc), '[]'::jsonb)
  into v_summary
  from (
    select sl.skill_id,
           coalesce(min(sk.display_name_pt), min(sk.display_name)) as skill,
           coalesce(min(sk.unit_pt), min(sk.unit)) as unit,
           count(*) as n,
           max(sl.value) as max_w,
           (array_agg(sl.value order by sl.logged_at desc))[1] as last_w,
           (select max(sl2.value) from public.skill_log sl2
             where sl2.character_id = v_uid and sl2.skill_id = sl.skill_id) as pr
    from public.skill_log sl
    join public.skill sk on sk.id = sl.skill_id
    where sl.character_id = v_uid
      and sl.logged_at >= p_from::timestamptz
      and sl.logged_at < (p_to + 1)::timestamptz
      and (p_skill_id is null or sl.skill_id = p_skill_id)
    group by sl.skill_id
  ) g;

  return jsonb_build_object(
    'window', jsonb_build_object('from', p_from, 'to', p_to),
    'entries', v_entries,
    'by_skill', v_summary
  );
end $$;

-- ─── 7. mcp_get_period_digest ────────────────────────────────────────────────
-- The one-call "how was my month" package, composed from the functions above.
-- p_include_notes: 'none' | 'flagged' (default — only extreme days, mood <=2
-- or =5) | 'all'. Flagged keeps the intimate journal out of casual queries
-- while surfacing the days where the text matters most.
create or replace function public.mcp_get_period_digest(
  p_from date,
  p_to date,
  p_include_notes text default 'flagged'
) returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_notes jsonb;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if p_from is null or p_to is null or p_to < p_from then
    raise exception 'Invalid window: from=% to=%', p_from, p_to;
  end if;
  if (p_to - p_from) > 731 then
    raise exception 'Window too large (max 731 days)';
  end if;
  if p_include_notes not in ('none', 'flagged', 'all') then
    raise exception 'include_notes must be none|flagged|all, got %', p_include_notes;
  end if;

  if p_include_notes = 'none' then
    v_notes := '[]'::jsonb;
  else
    select coalesce(jsonb_agg(jsonb_build_object(
      'date', m.logged_for,
      'mood', m.mood,
      'tags', coalesce(to_jsonb(m.tags), '[]'::jsonb),
      'note', m.note
    ) order by m.logged_for), '[]'::jsonb)
    into v_notes
    from public.mood_log m
    where m.character_id = v_uid
      and m.logged_for between p_from and p_to
      and m.note is not null
      and (p_include_notes = 'all' or m.mood <= 2 or m.mood = 5);
  end if;

  return jsonb_build_object(
    'window', jsonb_build_object('from', p_from, 'to', p_to),
    'mood', public.mcp_get_mood_stats(p_from, p_to, 'tag', true),
    'practice', public.mcp_get_task_completions(p_from, p_to, null, null, true, 10),
    'quests', public.mcp_get_quests(p_from, p_to, 'all'),
    'skills', public.mcp_get_skill_logs(p_from, p_to, null),
    'notes_mode', p_include_notes,
    'notes', v_notes
  );
end $$;

-- ─── Grants: authenticated only ──────────────────────────────────────────────
-- Functions default to EXECUTE for PUBLIC; tighten so only authenticated users
-- (each seeing only their own rows via RLS) can call them.
revoke all on function public.mcp_get_profile_summary() from public, anon;
revoke all on function public.mcp_get_mood_entries(date, date, text[], text, int, int, boolean, int) from public, anon;
revoke all on function public.mcp_get_mood_stats(date, date, text, boolean) from public, anon;
revoke all on function public.mcp_get_task_completions(date, date, text, text, boolean, int) from public, anon;
revoke all on function public.mcp_get_quests(date, date, text) from public, anon;
revoke all on function public.mcp_get_skill_logs(date, date, uuid) from public, anon;
revoke all on function public.mcp_get_period_digest(date, date, text) from public, anon;

grant execute on function public.mcp_get_profile_summary() to authenticated;
grant execute on function public.mcp_get_mood_entries(date, date, text[], text, int, int, boolean, int) to authenticated;
grant execute on function public.mcp_get_mood_stats(date, date, text, boolean) to authenticated;
grant execute on function public.mcp_get_task_completions(date, date, text, text, boolean, int) to authenticated;
grant execute on function public.mcp_get_quests(date, date, text) to authenticated;
grant execute on function public.mcp_get_skill_logs(date, date, uuid) to authenticated;
grant execute on function public.mcp_get_period_digest(date, date, text) to authenticated;

commit;
