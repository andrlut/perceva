-- migration: 20260729000031_learning_media_explainer-career-capital.sql
-- purpose: big-release media — attach cover + infographic(s) to explainer-career-capital.
-- affected: learning_material.hero_image_url, learning_material_media.
-- idempotent: hero update is a plain set; media rows on conflict do nothing.
begin;

insert into public.learning_material_media (material_id, kind, locale, path, source, meta)
select id, 'infographic', 'pt', 'explainer-career-capital/infographic.pt.webp', 'manual',
       '{"width":1080,"height":1920}'::jsonb
from public.learning_material where slug = 'explainer-career-capital'
on conflict (material_id, kind, locale) do nothing;

insert into public.learning_material_media (material_id, kind, locale, path, source, meta)
select id, 'infographic', 'en', 'explainer-career-capital/infographic.en.webp', 'manual',
       '{"width":1080,"height":1920}'::jsonb
from public.learning_material where slug = 'explainer-career-capital'
on conflict (material_id, kind, locale) do nothing;

commit;
