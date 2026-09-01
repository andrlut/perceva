-- Learning media: ikea-effect (cover + bilingual infographic)
-- Fase A pipeline: learning-art-director -> tools/content-media/generate.mjs
-- Assets uploaded to the public bucket `learning-media` BEFORE this migration
-- and verified 200 image/webp:
--   learning-media/ikea-effect/cover.webp           (768x1152,  gemini-api)
--   learning-media/ikea-effect/infographic.pt.webp  (1080x1920, code-rendered)
--   learning-media/ikea-effect/infographic.en.webp  (1080x1920, code-rendered)
-- `path` is BUCKET-RELATIVE — the client builds the URL via learningMediaUrl().

update public.learning_material
set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/ikea-effect/cover.webp',
    updated_at     = now()
where slug = 'ikea-effect';

insert into public.learning_material_media
  (material_id, kind, locale, path, source, meta)
select m.id, 'infographic', v.locale, v.path, 'manual', v.meta
from public.learning_material m
cross join (values
  ('pt', 'ikea-effect/infographic.pt.webp', '{"width": 1080, "height": 1920}'::jsonb),
  ('en', 'ikea-effect/infographic.en.webp', '{"width": 1080, "height": 1920}'::jsonb)
) as v(locale, path, meta)
where m.slug = 'ikea-effect'
on conflict (material_id, kind, locale) do nothing;
