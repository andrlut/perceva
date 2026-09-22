-- migration: 20260922000004_remove_one_shot.sql
-- purpose: retire the one_shot recurrence type. A practice is now daily or
--          periodic (weekly with/without days, monthly with/without day).
--          Existing one_shot rows are rewritten, the two task_type CHECKs
--          tightened, and start_task_from_template stops accepting it.
--
-- affected tables: task (3 rows rewritten; CHECK task_task_type_check),
--                  task_template (3 catalog rows rewritten; CHECK
--                  task_template_task_type_check)
-- new rpcs:        start_task_from_template(text, text, jsonb, int) [REPLACED
--                  — same signature, allowlist without one_shot];
--                  start_task_from_template(text) [DROPPED — legacy 1-arg
--                  overload, no caller]
-- breaking?        yes, narrowly: a pre-OTA client that still creates a
--                  practice as 'one_shot' gets a check_violation on insert.
--                  Ship with the OTA that removes the option (same PR).
--
-- notes:
--   migrations are write-once; never edit after applying
--   * User rows: none of the 3 read as a finished one-off (two never
--     completed, one completed 4×), so they become flex weekly 1× — "do it
--     once, whenever" never sat on Hoje, and flex weekly is the shape that
--     keeps them off Hoje (weekly without days is not scheduled on any
--     day). The client's parseRecurrence maps a stray one_shot the same way.
--   * Catalog: build_ship_one_thing ("ship one thing") reads as weekly;
--     money_review_budget ("Revisar orçamento mensal") and money_invest_10pct
--     ("Investir 10% da renda") are monthly by nature. A monthly template
--     carries task_type = 'daily' — the legacy column has no 'monthly' value
--     (legacyTaskTypeFor maps monthly → 'daily'; 7 user rows already do).
--   * Row updates run BEFORE the CHECKs are tightened, or ADD CONSTRAINT
--     fails on the very rows being retired.
--   * start_task_from_template body is the 20260602000002 one byte for byte
--     except the allowlist: ('daily', 'weekly'). 'monthly' was never a legal
--     task_type either (the CHECK would have rejected it). The 1-arg
--     overload from 20260505000002 was still live and copied
--     template.task_type verbatim; nothing calls it (the app always sends
--     the four named params; the MCP never adopts) — dropped.

begin;

-- ─── 1. User rows ──────────────────────────────────────────────────────────
update public.task
   set task_type    = 'weekly',
       recurrence   = '{"type":"weekly"}'::jsonb,
       target_count = 1
 where task_type = 'one_shot'
    or recurrence->>'type' = 'one_shot';

-- ─── 2. Catalog rows ──────────────────────────────────────────────────────
update public.task_template
   set task_type    = 'weekly',
       recurrence   = '{"type":"weekly"}'::jsonb,
       target_count = 1
 where id = 'build_ship_one_thing';

update public.task_template
   set task_type    = 'daily',
       recurrence   = '{"type":"monthly"}'::jsonb,
       target_count = 1
 where id in ('money_review_budget', 'money_invest_10pct');

-- Belt and braces for any catalog row this migration did not name.
update public.task_template
   set task_type    = 'weekly',
       recurrence   = '{"type":"weekly"}'::jsonb,
       target_count = 1
 where task_type = 'one_shot'
    or recurrence->>'type' = 'one_shot';

-- ─── 3. CHECKs ────────────────────────────────────────────────────────────
alter table public.task
  drop constraint if exists task_task_type_check;
alter table public.task
  add constraint task_task_type_check
  check (task_type in ('daily', 'weekly'));

alter table public.task_template
  drop constraint if exists task_template_task_type_check;
alter table public.task_template
  add constraint task_template_task_type_check
  check (task_type in ('daily', 'weekly'));

-- ─── 4. RPC allowlist ─────────────────────────────────────────────────────
create or replace function public.start_task_from_template(
  p_template_id          text,
  p_task_type_override   text default null,
  p_recurrence_override  jsonb default null,
  p_target_count_override int default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_template   public.task_template%rowtype;
  v_new_id     uuid;
  v_task_type  text;
  v_recurrence jsonb;
  v_target     int;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_template
  from public.task_template
  where id = p_template_id;
  if not found then
    raise exception 'Unknown template: %', p_template_id;
  end if;

  -- Resolve task_type: explicit override > template default.
  v_task_type := coalesce(p_task_type_override, v_template.task_type);
  if v_task_type not in ('daily', 'weekly') then
    raise exception 'Invalid task_type override: %', v_task_type;
  end if;

  -- Recurrence: explicit override > derived-from-type-override > template default.
  if p_recurrence_override is not null then
    v_recurrence := p_recurrence_override;
  elsif p_task_type_override is not null then
    v_recurrence := jsonb_build_object('type', p_task_type_override);
  else
    v_recurrence := v_template.recurrence;
  end if;

  -- Target count: explicit override > template default. Floor at 1.
  v_target := coalesce(p_target_count_override, v_template.target_count);
  if v_target < 1 then v_target := 1; end if;

  insert into public.task (
    character_id, title, description, task_type,
    recurrence, target_count, template_id, icon
  ) values (
    auth.uid(), v_template.title, v_template.description, v_task_type,
    v_recurrence, v_target, v_template.id, v_template.icon
  )
  returning id into v_new_id;

  -- Copy multi-sub allocations from task_template_sub. Each row carries
  -- a (sub_id, stars) pair — preserves the template's star distribution.
  insert into public.task_sub (task_id, sub_id, stars)
  select v_new_id, sub_id, stars
  from public.task_template_sub
  where template_id = p_template_id;

  return v_new_id;
end $$
;

-- ─── 5. Legacy 1-arg overload ─────────────────────────────────────────────
drop function if exists public.start_task_from_template(text);

commit;
