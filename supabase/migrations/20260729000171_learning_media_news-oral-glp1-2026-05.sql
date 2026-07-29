-- migration: 20260729000171_learning_media_news-oral-glp1-2026-05.sql
-- purpose: big-release media — attach cover + infographic(s) to news-oral-glp1-2026-05.
-- affected: learning_material.hero_image_url, learning_material_media.
-- idempotent: hero update is a plain set; media rows on conflict do nothing.
begin;

insert into public.learning_material_media (material_id, kind, locale, path, source, meta)
select id, 'infographic', 'pt', 'news-oral-glp1-2026-05/infographic.pt.webp', 'manual',
       '{"width":1080,"height":1920}'::jsonb
from public.learning_material where slug = 'news-oral-glp1-2026-05'
on conflict (material_id, kind, locale) do nothing;

insert into public.learning_material_media (material_id, kind, locale, path, source, meta)
select id, 'infographic', 'en', 'news-oral-glp1-2026-05/infographic.en.webp', 'manual',
       '{"width":1080,"height":1920}'::jsonb
from public.learning_material where slug = 'news-oral-glp1-2026-05'
on conflict (material_id, kind, locale) do nothing;

commit;
