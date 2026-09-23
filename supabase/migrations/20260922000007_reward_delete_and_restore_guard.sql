-- migration: 20260922000007_reward_delete_and_restore_guard.sql
-- purpose: complete the reward CRUD on the Manage screen — the free-tier cap
--          re-checked on restore, and the table-level DELETE closed to
--          clients so delete_reward's history guard cannot be bypassed.
--          Mirror of 20260922000001 (task).
--
-- affected tables: reward (new trigger enforce_free_limit_restore; DELETE
--                  privilege revoked from authenticated)
-- new rpcs:        none — delete_reward (20260524000005) is the only delete
--                  path
-- breaking?        no — no client code deletes from `reward` directly (checked
--                  app/ and supabase/functions/); archive/restore are UPDATEs
--                  and keep working through the existing self policy.
--
-- notes:
--   migrations are write-once; never edit after applying
--   * The free-tier cap (enforce_free_creation_limit, 20260707000001) only
--     fired BEFORE INSERT on reward, so archive 5 → create 5 → restore 5 gave
--     a free user 10 active rewards. The same function now also runs on the
--     archived → active transition; it counts current active rows, which
--     excludes the (still archived) row being restored.
--   * Revoking DELETE at the table level (not per column — a column revoke
--     never bites a table grant) makes the RPC the only delete path. The RPC
--     is SECURITY DEFINER, so it is unaffected; FK cascades from
--     reward_redemption / reward_tracking run with the owner's rights and are
--     unaffected too.

begin;

-- ─── Free cap on restore ───────────────────────────────────────────────────
drop trigger if exists enforce_free_limit_restore on public.reward;
create trigger enforce_free_limit_restore
  before update of is_archived on public.reward
  for each row
  when (old.is_archived = true and new.is_archived = false)
  execute function public.enforce_free_creation_limit();

-- ─── Delete only through the RPC ───────────────────────────────────────────
revoke delete on table public.reward from authenticated;

commit;
