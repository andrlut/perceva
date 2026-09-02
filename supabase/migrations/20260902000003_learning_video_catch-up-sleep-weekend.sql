-- migration: 20260902000003_learning_video_catch-up-sleep-weekend.sql
-- purpose: register the PT + EN short vertical videos (Gemini Notebook
--          "Resumo em Vídeo" → format "Curta") for catch-up-sleep-weekend
--
-- affected tables: learning_material_media (2 upserts, kind='video')
-- new rpcs:        none
-- breaking?       no — additive catalog rows
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   first videos in the catalog. Source format is 9:16 (720x1280 H.264 30fps),
--   uploaded as-is — no re-encode, since 6.8/9.1 MB is far under the bucket's
--   150 MB video cap. meta.width/height are load-bearing: MaterialMediaScreen
--   derives the player aspect ratio from them and falls back to 16/9 without.
--   Both files verified reachable (HTTP 200, video/mp4) BEFORE this ran.

begin;

insert into public.learning_material_media
  (material_id, kind, locale, path, duration_seconds, source, meta)
select m.id, 'video', v.locale, v.path, v.duration_seconds, 'notebooklm',
       jsonb_build_object('title', v.title, 'width', 720, 'height', 1280)
from (values
  ('pt', 'catch-up-sleep-weekend/video.pt.mp4', 67, 'Por que dormir até tarde não paga a dívida de sono'),
  ('en', 'catch-up-sleep-weekend/video.en.mp4', 72, 'Why Weekend Sleep Catch-Ups Fail')
) as v(locale, path, duration_seconds, title)
join public.learning_material m on m.slug = 'catch-up-sleep-weekend'
on conflict (material_id, kind, locale) do update set
  path             = excluded.path,
  duration_seconds = excluded.duration_seconds,
  source           = excluded.source,
  meta             = excluded.meta;

commit;
