-- migration: 20260901000001_mood_log_self_delete.sql
-- purpose: let a user delete their own mood_log row. The table shipped with
--          select/insert/update policies only (20260713000001 deferred delete
--          to "a later phase"), which means a row written for the WRONG DAY
--          can never be removed — only overwritten, leaving a phantom entry
--          that pollutes the month average and the calendar heatmap forever.
--          The MCP write tool (log_mood, dictated by voice) makes that gap
--          worth closing now: it is the recovery path for any mis-dated
--          entry, and it unblocks a plain "apagar o registro do dia" button
--          in the day view.
--
-- affected tables: mood_log (new RLS policy only)
-- new rpcs:        none
-- breaking?       no — purely additive. Nothing calls delete today; this only
--                 makes it POSSIBLE for the row's owner.
--
-- notes:
--   migrations are write-once; never edit after applying
--   deliberately NOT exposed as an MCP tool: an LLM that can delete a day of
--   someone's journal is a bad trade for a capability nobody asked for.
--   Correcting a day already works through log_mood mode:"replace".
--   Deleting is also the concrete mechanism behind the LGPD right to
--   erasure for this table (see docs/retro-lgpd-consentimento.md).

begin;

create policy "mood_log_self_delete" on public.mood_log
  for delete to authenticated using (character_id = auth.uid());

commit;
