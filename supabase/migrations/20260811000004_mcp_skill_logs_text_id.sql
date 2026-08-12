-- migration: 20260811000004_mcp_skill_logs_text_id.sql
-- purpose: fix mcp_get_skill_logs — skill.id (and skill_log.skill_id) is TEXT
--          (slug, e.g. 'pushups'), not uuid. 20260811000003 declared the
--          p_skill_id parameter as uuid, which makes the filter comparison
--          fail at runtime with "operator does not exist: text = uuid"
--          (caught by the post-push smoke test; the function was never
--          callable, so this is not a breaking change for any client).
--
-- affected tables: none (function replacement)
-- new rpcs:        mcp_get_skill_logs(date, date, text) — replaces the
--                  (date, date, uuid) signature
-- breaking?       no — the old signature never worked and nothing ships
--                  against it yet
--
-- notes:
--   migrations are write-once; never edit after applying — hence this fixup
--   body is identical to 20260811000003 apart from the parameter type

begin;

drop function if exists public.mcp_get_skill_logs(date, date, uuid);

create or replace function public.mcp_get_skill_logs(
  p_from date,
  p_to date,
  p_skill_id text default null
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

revoke all on function public.mcp_get_skill_logs(date, date, text) from public, anon;
grant execute on function public.mcp_get_skill_logs(date, date, text) to authenticated;

commit;
