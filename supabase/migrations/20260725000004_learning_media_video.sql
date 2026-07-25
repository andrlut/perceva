-- migration: 20260725000004_learning_media_video.sql
-- purpose: short complementary videos as learning media — allow video/mp4 in
--          the learning-media bucket (raising the size cap to 150 MB) and
--          accept kind='video' in learning_material_media
--
-- affected tables: storage.buckets (row 'learning-media'),
--                  learning_material_media (kind CHECK recreated)
-- new rpcs:        none
-- breaking?       no — additive; existing rows/clients unaffected
--
-- notes:
--   migrations are write-once; never edit after applying
--   uploads stay CLI/service-only (the bucket has no client write policies);
--   video follows the same pattern as the other kinds: bucket-relative path,
--   per-row locale ('pt'/'en') with cross-language fallback + badge in the
--   app, duration_seconds filled at ingestion.
--   150 MB covers ~5 min of 1080p H.264 at ~4 Mbps — the target is SHORT
--   complementary videos, not full lectures.

begin;

-- 1) bucket: accept mp4 and raise the per-object cap 30 MB -> 150 MB
update storage.buckets
set
  file_size_limit = 157286400, -- 150 MB
  allowed_mime_types = array[
    'audio/mp4','audio/mpeg','image/webp','image/png','image/jpeg','video/mp4'
  ]
where id = 'learning-media';

-- 2) kind: recreate the CHECK with 'video' (the original inline check got the
--    default Postgres name <table>_<column>_check)
alter table public.learning_material_media
  drop constraint if exists learning_material_media_kind_check;
alter table public.learning_material_media
  add constraint learning_material_media_kind_check
  check (kind in ('audio','infographic','deck','video'));

commit;
