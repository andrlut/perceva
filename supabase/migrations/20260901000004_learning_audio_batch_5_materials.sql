-- migration: 20260901000004_learning_audio_batch_5_materials.sql
-- purpose: register PT + EN Gemini Notebook deep-dive audio for 5 learning
--          materials (ikea-effect, play-deprivation-adults,
--          grip-strength-longevity, ten-second-balance-test,
--          weak-ties-job-search)
--
-- affected tables: learning_material_media (10 upserts)
-- new rpcs:        none
-- breaking?       no — additive catalog rows
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   every file was encoded AAC 64k mono faststart (10.4–15.5 MB, under the
--   bucket's 30 MB cap), uploaded to the public `learning-media` bucket and
--   verified reachable (HTTP 200, audio/mp4) BEFORE this migration ran.
--   duration_seconds comes from ffprobe on the encoded file.

begin;

insert into public.learning_material_media
  (material_id, kind, locale, path, duration_seconds, source, meta)
select m.id, 'audio', v.locale, v.path, v.duration_seconds, 'notebooklm',
       jsonb_build_object('title', v.title)
from (values
  ('ikea-effect',             'pt', 'ikea-effect/audio.pt.m4a',             1316, 'Por que sua estante torta vale mais'),
  ('ikea-effect',             'en', 'ikea-effect/audio.en.m4a',             1333, 'Why we overvalue the things we build'),
  ('play-deprivation-adults', 'pt', 'play-deprivation-adults/audio.pt.m4a', 1611, 'Brincar é um instinto de sobrevivência'),
  ('play-deprivation-adults', 'en', 'play-deprivation-adults/audio.en.m4a', 1301, 'Play is a biological survival system'),
  ('grip-strength-longevity', 'pt', 'grip-strength-longevity/audio.pt.m4a', 1725, 'Aperto de mão supera a pressão arterial'),
  ('grip-strength-longevity', 'en', 'grip-strength-longevity/audio.en.m4a', 1367, 'Grip Strength Beats Blood Pressure for Longevity'),
  ('ten-second-balance-test', 'pt', 'ten-second-balance-test/audio.pt.m4a', 1936, 'Ficar num pé só revela longevidade'),
  ('ten-second-balance-test', 'en', 'ten-second-balance-test/audio.en.m4a', 1348, 'The 10-second balance test for longevity'),
  ('weak-ties-job-search',    'pt', 'weak-ties-job-search/audio.pt.m4a',    1943, 'Conhecidos indicam melhor que amigos'),
  ('weak-ties-job-search',    'en', 'weak-ties-job-search/audio.en.m4a',    1399, 'Why Your Friends Can''t Get You Hired')
) as v(slug, locale, path, duration_seconds, title)
join public.learning_material m on m.slug = v.slug
on conflict (material_id, kind, locale) do update set
  path             = excluded.path,
  duration_seconds = excluded.duration_seconds,
  source           = excluded.source,
  meta             = excluded.meta;

commit;
