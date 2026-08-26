-- Media for learning material: attention-residue
-- Cover: Gemini 2.5 Flash Image (2:3, textless). Infographics: code-rendered
-- from brand tokens by tools/content-media (deterministic, no API cost).
-- All three files were uploaded to the public `learning-media` bucket and
-- verified reachable (HTTP 200, image/webp) BEFORE this migration ran.

update public.learning_material
set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/attention-residue/cover.webp',
    updated_at = now()
where slug = 'attention-residue';

insert into public.learning_material_media (material_id, kind, locale, path, source, meta)
select m.id, 'infographic', v.locale, v.path, 'manual',
       jsonb_build_object('width', 1080, 'height', 1920)
from public.learning_material m
cross join (values
  ('pt', 'attention-residue/infographic.pt.webp'),
  ('en', 'attention-residue/infographic.en.webp')
) as v(locale, path)
where m.slug = 'attention-residue'
on conflict (material_id, kind, locale) do update set
  path   = excluded.path,
  source = excluded.source,
  meta   = excluded.meta;
