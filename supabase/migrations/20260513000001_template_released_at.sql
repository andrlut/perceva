-- ============================================================================
-- Template release timestamps — enables periodic content drops ("New this
-- week"), retention nudges, and time-based filtering of the catalog.
--
-- Adds `released_at` to all three template tables (task / reward / quest).
-- Existing rows are backfilled to 2026-05-01, which is before any planned
-- live drop, so the "released in the last N days" filter starts empty and
-- only lights up when new content actually ships.
--
-- New inserts default to NOW(), so any future seed migration (or content
-- drop migration) gets the timestamp for free.
--
-- Skill catalog rows share the `skill` table with user-owned skills, so
-- adding the column there has ambiguous semantics ("released to who?").
-- Deferred until/unless we ship a skill-catalog drop UI.
-- ============================================================================

begin;

-- ─── 1. task_template ───────────────────────────────────────────────────
alter table public.task_template
  add column released_at timestamptz not null default '2026-05-01 00:00:00+00';

alter table public.task_template
  alter column released_at set default now();

-- ─── 2. reward_template ────────────────────────────────────────────────
alter table public.reward_template
  add column released_at timestamptz not null default '2026-05-01 00:00:00+00';

alter table public.reward_template
  alter column released_at set default now();

-- ─── 3. quest_template ─────────────────────────────────────────────────
alter table public.quest_template
  add column released_at timestamptz not null default '2026-05-01 00:00:00+00';

alter table public.quest_template
  alter column released_at set default now();

commit;
