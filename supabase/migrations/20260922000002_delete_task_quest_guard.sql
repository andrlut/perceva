-- migration: 20260922000002_delete_task_quest_guard.sql
-- purpose: delete_task v2 — refuse a practice that a quest requirement still
--          points at, and lock the task row for the duration of the call.
--
-- affected tables: none (function body only)
-- new rpcs:        delete_task(uuid) [REPLACED — same signature]
-- breaking?        no — one more gate; the client already maps the error text.
--
-- notes:
--   migrations are write-once; never edit after applying
--   * 20260922000001's header said quest_requirement.task_id "is set null by
--     its FK". The FK is indeed ON DELETE SET NULL (20260501000009:97), but
--     the table CHECK quest_requirement_kind_payload (20260527000001:47-52)
--     requires task_id NOT NULL for kind = 'complete_task_n_times' — the only
--     kind that sets task_id. So the RI action produced a row that violated
--     the CHECK and the whole delete aborted with a raw check_violation
--     (SQLSTATE 23514) for every practice ever used by a quest, active or
--     finished. Now it is a named gate, like the completion one.
--   * The owner lookup takes FOR UPDATE: complete_task's insert into
--     task_completion holds FOR KEY SHARE on the task row through the RI
--     check, which conflicts with FOR UPDATE, so a completion that lands
--     between the count and the delete can no longer be cascaded away.

begin;

create or replace function public.delete_task(p_task_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_completion_count int;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  -- Row lock: serializes against complete_task (FOR KEY SHARE via RI).
  select character_id
    into v_owner
    from public.task
    where id = p_task_id
    for update;

  if not found then
    raise exception 'task not found';
  end if;
  if v_owner <> v_uid then
    raise exception 'not authorized';
  end if;

  select count(*) into v_completion_count
    from public.task_completion
    where task_id = p_task_id;

  if v_completion_count > 0 then
    raise exception 'cannot hard-delete task with completion history; archive instead';
  end if;

  if exists (
    select 1 from public.quest_requirement where task_id = p_task_id
  ) then
    raise exception 'cannot hard-delete task referenced by a quest; archive instead';
  end if;

  delete from public.task where id = p_task_id;
end;
$$;

commit;
