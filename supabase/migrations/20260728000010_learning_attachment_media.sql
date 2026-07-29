-- migration: 20260728000010_learning_attachment_media.sql
-- purpose: attach cover (two-trees illustration) + bilingual infographic to the
--          attachment-styles-love material (new content-media standard).
--
-- affected tables: learning_material (hero_image_url),
--                  learning_material_media (2 infographic rows)
-- breaking?        no — idempotent
--
-- assets uploaded to learning-media/attachment-styles-love/ and verified via
-- curl (cover.webp 768x1374, infographic.<pt|en>.webp 1080x1920).

begin;

update public.learning_material
set hero_image_url =
      'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/attachment-styles-love/cover.webp',
    updated_at = now()
where slug = 'attachment-styles-love';

insert into public.learning_material_media (material_id, kind, locale, path, source, meta)
select id, 'infographic', 'pt', 'attachment-styles-love/infographic.pt.webp', 'manual',
       '{"width": 1080, "height": 1920}'::jsonb
from public.learning_material where slug = 'attachment-styles-love'
on conflict (material_id, kind, locale) do nothing;

insert into public.learning_material_media (material_id, kind, locale, path, source, meta)
select id, 'infographic', 'en', 'attachment-styles-love/infographic.en.webp', 'manual',
       '{"width": 1080, "height": 1920}'::jsonb
from public.learning_material where slug = 'attachment-styles-love'
on conflict (material_id, kind, locale) do nothing;

commit;
