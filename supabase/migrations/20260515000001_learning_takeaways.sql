-- ============================================================================
-- Learning takeaways — 3 short bullet "what you learned" per material.
--
-- Surfaces above the article body so a quick reader still walks away with
-- the gist. Bilingual; client picks the array column matching app locale.
-- ============================================================================

begin;

alter table public.learning_material
  add column takeaways_pt text[] not null default array[]::text[],
  add column takeaways_en text[] not null default array[]::text[];

-- Soft cap at 5 bullets, enforced at the data layer (per-row) so the UI
-- doesn't have to defend against a 20-bullet wall of text.
alter table public.learning_material
  add constraint learning_material_takeaways_pt_len
    check (array_length(takeaways_pt, 1) is null or array_length(takeaways_pt, 1) <= 5),
  add constraint learning_material_takeaways_en_len
    check (array_length(takeaways_en, 1) is null or array_length(takeaways_en, 1) <= 5);

commit;
