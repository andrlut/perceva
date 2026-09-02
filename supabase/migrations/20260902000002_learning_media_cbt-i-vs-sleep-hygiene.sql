-- Learning media: cbt-i-vs-sleep-hygiene
-- Cover (Gemini 2.5 Flash Image, 2:3, textless) + infographic PT/EN (code-rendered from brand tokens).
-- Assets uploaded to the public learning-media bucket BEFORE this migration and verified 200:
--   learning-media/cbt-i-vs-sleep-hygiene/cover.webp
--   learning-media/cbt-i-vs-sleep-hygiene/infographic.pt.webp
--   learning-media/cbt-i-vs-sleep-hygiene/infographic.en.webp
-- learning_material_media.path is BUCKET-RELATIVE (client builds the URL via learningMediaUrl()).

update public.learning_material
set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/cbt-i-vs-sleep-hygiene/cover.webp',
    updated_at     = now()
where slug = 'cbt-i-vs-sleep-hygiene';

insert into public.learning_material_media
  (material_id, kind, locale, path, source, meta)
select m.id, 'infographic', v.locale, v.path, 'manual', v.meta::jsonb
from public.learning_material m
cross join (values
  ('pt', 'cbt-i-vs-sleep-hygiene/infographic.pt.webp', '{"width": 1080, "height": 1920}'),
  ('en', 'cbt-i-vs-sleep-hygiene/infographic.en.webp', '{"width": 1080, "height": 1920}')
) as v(locale, path, meta)
where m.slug = 'cbt-i-vs-sleep-hygiene'
on conflict (material_id, kind, locale) do nothing;
