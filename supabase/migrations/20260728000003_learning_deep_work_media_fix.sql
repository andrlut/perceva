-- migration: 20260728000003_learning_deep_work_media_fix.sql
-- purpose: corrective re-apply of the deep-work media standard. 20260728000002
--          registered in the migration history but its data effects were not
--          present on the row (hero_image_url still pointed at the old cover,
--          infographic rows missing). This re-runs the same idempotent SQL so
--          the cloud row actually reflects the new cover + infographic.
--
-- affected tables: learning_material (hero_image_url),
--                  learning_material_media (2 infographic rows)
-- breaking?        no — idempotent

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
