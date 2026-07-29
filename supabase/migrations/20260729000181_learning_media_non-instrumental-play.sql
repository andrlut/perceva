-- migration: 20260729000181_learning_media_non-instrumental-play.sql
-- purpose: big-release media — attach cover + infographic(s) to non-instrumental-play.
-- affected: learning_material.hero_image_url, learning_material_media.
-- idempotent: hero update is a plain set; media rows on conflict do nothing.
begin;

insert into public.learning_material_media (material_id, kind, locale, path, source, meta)
select id, 'infographic', 'pt', 'non-instrumental-play/infographic.pt.webp', 'manual',
       '{"width":1080,"height":1920}'::jsonb
from public.learning_material where slug = 'non-instrumental-play'
on conflict (material_id, kind, locale) do nothing;

insert into public.learning_material_media (material_id, kind, locale, path, source, meta)
select id, 'infographic', 'en', 'non-instrumental-play/infographic.en.webp', 'manual',
       '{"width":1080,"height":1920}'::jsonb
from public.learning_material where slug = 'non-instrumental-play'
on conflict (material_id, kind, locale) do nothing;

commit;
