-- migration: 20260902000004_learning_video_trim_outro.sql
-- purpose: point catch-up-sleep-weekend's videos at the trimmed cuts, without
--          the 3s full-screen "Gemini Notebook" end card
--
-- affected tables: learning_material_media (2 updates, kind='video')
-- new rpcs:        none
-- breaking?       no — same rows, new path + duration
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   the outro is a near-white card the generator appends after the narration
--   ends; it is detected by frame brightness (YAVG jumps ~207 -> ~229) and cut
--   there, so nothing of the content is lost. The small in-video watermark is
--   deliberately kept — it is the attribution.
--   NEW PATHS (.v2) instead of overwriting: supabase CLI 2.95.4 cannot replace
--   an existing object (409 Duplicate) and its `storage rm` silently no-ops, so
--   the pre-trim files still sit in the bucket as orphans. Delete them from the
--   dashboard, or with a newer CLI, when convenient.
--   Both .v2 files verified reachable (HTTP 200, video/mp4) BEFORE this ran.

begin;

update public.learning_material_media mm
set path             = v.path,
    duration_seconds = v.duration_seconds
from (values
  ('pt', 'catch-up-sleep-weekend/video.pt.v2.mp4', 64),
  ('en', 'catch-up-sleep-weekend/video.en.v2.mp4', 69)
) as v(locale, path, duration_seconds)
where mm.locale = v.locale
  and mm.kind = 'video'
  and mm.material_id = (
    select id from public.learning_material where slug = 'catch-up-sleep-weekend'
  );

commit;
