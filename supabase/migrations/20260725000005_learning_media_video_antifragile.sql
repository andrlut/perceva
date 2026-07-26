-- migration: 20260725000005_learning_media_video_antifragile.sql
-- purpose: attach the first learning video — NotebookLM Video Overview
--          "How to Make Your Body Antifragile" (EN, 87s, 720x1280) — to the
--          summary-antifragile material
--
-- affected tables: learning_material_media (1 insert)
-- new rpcs:        none
-- breaking?       no — catalog data only
--
-- notes:
--   migrations are write-once; never edit after applying
--   the file was uploaded and verified in the bucket BEFORE this migration
--   (antifragil/video.en.mp4, video/mp4, 9 MB) — the feed never sees a 404.
--   path is bucket-relative; the client builds the URL via learningMediaUrl().

begin;

insert into public.learning_material_media
  (material_id, kind, locale, path, duration_seconds, source, meta)
select id, 'video', 'en', 'antifragil/video.en.mp4', 87, 'notebooklm',
       '{"title": "How to make your body antifragile", "width": 720, "height": 1280}'::jsonb
from public.learning_material
where slug = 'summary-antifragile'
on conflict (material_id, kind, locale) do nothing;

commit;
