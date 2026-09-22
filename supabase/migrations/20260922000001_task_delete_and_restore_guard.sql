-- migration: 20260922000001_task_delete_and_restore_guard.sql
-- purpose: complete the practice CRUD on the Manage screen — a guarded hard
--          delete for archived practices, the free-tier cap re-checked on
--          restore, and the table-level DELETE closed to clients so the
--          guard cannot be bypassed.
--
-- affected tables: task (new trigger enforce_free_limit_restore; DELETE
--                  privilege revoked from authenticated)
-- new rpcs:        delete_task(uuid)
-- breaking?        no — no client code deletes from `task` directly (checked
--                  app/ and supabase/functions/); archive/restore are UPDATEs
--                  and keep working through the existing self policy.
--
-- notes:
--   migrations are write-once; never edit after applying
--   * delete_task mirrors delete_reward (20260524000005): owner check, then
--     refuse when the practice has completion history. Those completions
--     carry XP the character already earned; a cascade delete would erase
--     the evidence while keeping the reward — the same class of hole #426
--     closed on `character`. Archive is the only exit for practices with
--     history. task_sub / task_skip cascade; quest_requirement.task_id is
--     set null by its FK.
--   * The free-tier cap (enforce_free_creation_limit, 20260707000001) only
--     fired BEFORE INSERT, so archive 10 → create 10 → restore 10 gave a
--     free user 20 active practices. The same function now also runs on the
--     archived → active transition; it counts current active rows, which
--     excludes the (still archived) row being restored.
--   * Revoking DELETE at the table level (not per column — a column revoke
--     never bites a table grant) makes the RPC the only delete path. The
--     RPC is SECURITY DEFINER, so it is unaffected; FK cascades run with the
--     owner's rights and are unaffected too.

begin;

-- ─── RPC: delete_task(p_task_id) ───────────────────────────────────────────
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

  select character_id
    into v_owner
    from public.task
    where id = p_task_id;

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

  delete from public.task where id = p_task_id;
end;
$$;

revoke all on function public.delete_task(uuid) from public;
grant execute on function public.delete_task(uuid) to authenticated;

-- ─── Free cap on restore ───────────────────────────────────────────────────
drop trigger if exists enforce_free_limit_restore on public.task;
create trigger enforce_free_limit_restore
  before update of is_archived on public.task
  for each row
  when (old.is_archived = true and new.is_archived = false)
  execute function public.enforce_free_creation_limit();

-- ─── Delete only through the RPC ───────────────────────────────────────────
revoke delete on table public.task from authenticated;

commit;
