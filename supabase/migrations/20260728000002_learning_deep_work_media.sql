-- migration: 20260728000002_learning_deep_work_media.sql
-- purpose: bring 'summary-deep-work' to the new media standard — repoint the
--          cover to the illustrated (flat-vector) art and attach the bilingual
--          infographic. Supersedes the realistic cover set in
--          20260728000001 (that file is now orphaned in storage; the CLI's
--          storage rm is unreliable, so the row just points at the new path).
--
-- affected tables: learning_material (hero_image_url),
--                  learning_material_media (2 infographic rows)
-- breaking?        no — idempotent (UPDATE + INSERT ... on conflict do nothing)
--
-- assets uploaded to learning-media/deep-work/ before this ran:
--   cover.webp (768x1152), infographic.pt.webp / infographic.en.webp (1080x1920)

begin;

update public.learning_material
set hero_image_url =
      'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/deep-work/cover.webp',
    updated_at = now()
where slug = 'summary-deep-work';

insert into public.learning_material_media (material_id, kind, locale, path, source, meta)
select id, 'infographic', 'pt', 'deep-work/infographic.pt.webp', 'manual',
       '{"width": 1080, "height": 1920}'::jsonb
from public.learning_material where slug = 'summary-deep-work'
on conflict (material_id, kind, locale) do nothing;

insert into public.learning_material_media (material_id, kind, locale, path, source, meta)
select id, 'infographic', 'en', 'deep-work/infographic.en.webp', 'manual',
       '{"width": 1080, "height": 1920}'::jsonb
from public.learning_material where slug = 'summary-deep-work'
on conflict (material_id, kind, locale) do nothing;

commit;
