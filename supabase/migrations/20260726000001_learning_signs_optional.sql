-- migration: 20260726000001_learning_signs_optional.sql
-- purpose: signs (the "Está bem quando / On track when" checklist) is no longer
--          surfaced in the material detail UI. Make signs_pt/signs_en optional so
--          the publisher pipeline can stop producing them without breaking inserts.
--
-- affected tables: learning_material (signs_pt, signs_en → nullable)
-- new rpcs:        none
-- breaking?       no — existing 22 rows keep their signs; the columns just stop
--                 being required. The existing length CHECK already allows NULL.
--
-- notes:
--   migrations are write-once; never edit after applying
--   we deliberately keep the columns (not a DROP) — the historical signs data is
--   harmless and could inform a future surface; only the NOT NULL is lifted.

begin;

alter table public.learning_material alter column signs_pt drop not null;
alter table public.learning_material alter column signs_en drop not null;

commit;
