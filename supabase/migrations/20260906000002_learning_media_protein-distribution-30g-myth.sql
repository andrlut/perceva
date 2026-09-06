-- Learning media: protein-distribution-30g-myth (cover + bilingual infographic)
-- Fase A pipeline: learning-art-director -> tools/content-media/generate.mjs
-- Assets uploaded to the public bucket `learning-media` BEFORE this migration
-- and verified 200 image/webp:
--   learning-media/protein-distribution-30g-myth/cover.webp           (768x1152,  gemini-api)
--   learning-media/protein-distribution-30g-myth/infographic.pt.webp  (1080x1920, code-rendered)
--   learning-media/protein-distribution-30g-myth/infographic.en.webp  (1080x1920, code-rendered)
-- `path` is BUCKET-RELATIVE — the client builds the URL via learningMediaUrl().

update public.learning_material
set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/protein-distribution-30g-myth/cover.webp',
    updated_at     = now()
where slug = 'protein-distribution-30g-myth';

insert into public.learning_material_media
  (material_id, kind, locale, path, source, meta)
select m.id, 'infographic', v.locale, v.path, 'manual', v.meta
from public.learning_material m
cross join (values
  ('pt', 'protein-distribution-30g-myth/infographic.pt.webp', '{"width": 1080, "height": 1920}'::jsonb),
  ('en', 'protein-distribution-30g-myth/infographic.en.webp', '{"width": 1080, "height": 1920}'::jsonb)
) as v(locale, path, meta)
where m.slug = 'protein-distribution-30g-myth'
on conflict (material_id, kind, locale) do nothing;
