-- migration: 20260901000005_learning_audio_batch_3_curto.sql
-- purpose: register PT + EN Gemini Notebook audio for 3 learning materials
--          (catch-up-sleep-weekend, summary-psychology-of-money,
--          summary-good-life)
--
-- affected tables: learning_material_media (6 upserts)
-- new rpcs:        none
-- breaking?       no — additive catalog rows
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   generated with the "Curto" duration setting instead of "Padrão": these run
--   5:30–6:40 (vs 22–32 min for the Padrão batch in 20260901000004) and weigh
--   2.6–3.2 MB after encoding, roughly a quarter of the earlier files.
--   Same encode recipe (AAC 64k mono faststart); every file was uploaded to the
--   public `learning-media` bucket and verified reachable (HTTP 200, audio/mp4)
--   BEFORE this migration ran. duration_seconds comes from ffprobe.

begin;

insert into public.learning_material_media
  (material_id, kind, locale, path, duration_seconds, source, meta)
select m.id, 'audio', v.locale, v.path, v.duration_seconds, 'notebooklm',
       jsonb_build_object('title', v.title)
from (values
  ('catch-up-sleep-weekend',      'pt', 'catch-up-sleep-weekend/audio.pt.m4a',      362, 'Dormir até tarde sabota seu metabolismo'),
  ('catch-up-sleep-weekend',      'en', 'catch-up-sleep-weekend/audio.en.m4a',      352, 'Why sleeping in won''t fix sleep debt'),
  ('summary-psychology-of-money', 'pt', 'summary-psychology-of-money/audio.pt.m4a', 399, 'Por que a secretária venceu o executivo'),
  ('summary-psychology-of-money', 'en', 'summary-psychology-of-money/audio.en.m4a', 330, 'Why Brilliant People Go Broke'),
  ('summary-good-life',           'pt', 'summary-good-life/audio.pt.m4a',           365, 'Bons vínculos protegem mais que colesterol'),
  ('summary-good-life',           'en', 'summary-good-life/audio.en.m4a',           341, 'Strong Relationships Increase Your Survival Rate')
) as v(slug, locale, path, duration_seconds, title)
join public.learning_material m on m.slug = v.slug
on conflict (material_id, kind, locale) do update set
  path             = excluded.path,
  duration_seconds = excluded.duration_seconds,
  source           = excluded.source,
  meta             = excluded.meta;

commit;
