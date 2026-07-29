-- migration: 20260729000201_learning_media_summary-atomic-habits.sql
-- purpose: big-release media — attach cover + infographic(s) to summary-atomic-habits.
-- affected: learning_material.hero_image_url, learning_material_media.
-- idempotent: hero update is a plain set; media rows on conflict do nothing.
begin;

insert into public.learning_material_media (material_id, kind, locale, path, source, meta)
select id, 'infographic', 'pt', 'summary-atomic-habits/infographic.pt.webp', 'manual',
       '{"width":1080,"height":1920}'::jsonb
from public.learning_material where slug = 'summary-atomic-habits'
on conflict (material_id, kind, locale) do nothing;

commit;
