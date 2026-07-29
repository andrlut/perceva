-- migration: 20260729000161_learning_media_news-loneliness-memory-2026-04.sql
-- purpose: big-release media — attach cover + infographic(s) to news-loneliness-memory-2026-04.
-- affected: learning_material.hero_image_url, learning_material_media.
-- idempotent: hero update is a plain set; media rows on conflict do nothing.
begin;

insert into public.learning_material_media (material_id, kind, locale, path, source, meta)
select id, 'infographic', 'pt', 'news-loneliness-memory-2026-04/infographic.pt.webp', 'manual',
       '{"width":1080,"height":1920}'::jsonb
from public.learning_material where slug = 'news-loneliness-memory-2026-04'
on conflict (material_id, kind, locale) do nothing;

insert into public.learning_material_media (material_id, kind, locale, path, source, meta)
select id, 'infographic', 'en', 'news-loneliness-memory-2026-04/infographic.en.webp', 'manual',
       '{"width":1080,"height":1920}'::jsonb
from public.learning_material where slug = 'news-loneliness-memory-2026-04'
on conflict (material_id, kind, locale) do nothing;

commit;
