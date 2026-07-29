-- migration: 20260729000041_learning_media_glossary-build.sql
-- purpose: big-release media — attach cover + infographic(s) to glossary-build.
-- affected: learning_material.hero_image_url, learning_material_media.
-- idempotent: hero update is a plain set; media rows on conflict do nothing.
begin;

insert into public.learning_material_media (material_id, kind, locale, path, source, meta)
select id, 'infographic', 'pt', 'glossary-build/infographic.pt.webp', 'manual',
       '{"width":1080,"height":1920}'::jsonb
from public.learning_material where slug = 'glossary-build'
on conflict (material_id, kind, locale) do nothing;

insert into public.learning_material_media (material_id, kind, locale, path, source, meta)
select id, 'infographic', 'en', 'glossary-build/infographic.en.webp', 'manual',
       '{"width":1080,"height":1920}'::jsonb
from public.learning_material where slug = 'glossary-build'
on conflict (material_id, kind, locale) do nothing;

commit;
