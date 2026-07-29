-- migration: 20260729000221_learning_media_summary-good-life.sql
-- purpose: big-release media — attach cover + infographic(s) to summary-good-life.
-- affected: learning_material.hero_image_url, learning_material_media.
-- idempotent: hero update is a plain set; media rows on conflict do nothing.
begin;

update public.learning_material
set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/good-life/cover.webp', -- reuses pre-existing cover object
    updated_at = now()
where slug = 'summary-good-life';

insert into public.learning_material_media (material_id, kind, locale, path, source, meta)
select id, 'infographic', 'pt', 'summary-good-life/infographic.pt.webp', 'manual',
       '{"width":1080,"height":1920}'::jsonb
from public.learning_material where slug = 'summary-good-life'
on conflict (material_id, kind, locale) do nothing;

insert into public.learning_material_media (material_id, kind, locale, path, source, meta)
select id, 'infographic', 'en', 'summary-good-life/infographic.en.webp', 'manual',
       '{"width":1080,"height":1920}'::jsonb
from public.learning_material where slug = 'summary-good-life'
on conflict (material_id, kind, locale) do nothing;

commit;
