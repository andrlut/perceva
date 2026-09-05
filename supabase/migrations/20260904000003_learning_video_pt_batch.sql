-- migration: 20260904000003_learning_video_pt_batch.sql
-- purpose: register the PT short vertical videos (Gemini Notebook "Resumo em
--          Vídeo" → formato "Curta") for the 8 materials that already had audio
--
-- affected tables: learning_material_media (8 inserts, kind='video', locale='pt')
-- new rpcs:        none
-- breaking?       no — additive catalog rows
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   9:16 vertical (720x1280 H.264), uploaded as-is — no re-encode needed under
--   the bucket's 150 MB video cap. The 3s full-screen "Gemini Notebook" end
--   card was cut from every file (detected by frame brightness); the small
--   in-video watermark is deliberately kept as attribution.
--   meta.width/height are load-bearing: MaterialMediaScreen derives the player
--   aspect ratio from them and falls back to 16/9 without them.
--   Focus prompt for each video was the material's own summary_pt, so the video
--   covers the article's thesis instead of one sub-topic.
--   All 8 verified reachable (HTTP 200, video/mp4) BEFORE this migration ran.
--   EN videos are NOT included — only catch-up-sleep-weekend has one so far.

begin;

insert into public.learning_material_media
  (material_id, kind, locale, path, duration_seconds, source, meta)
select m.id, 'video', 'pt', v.path, v.duration_seconds, 'notebooklm',
       jsonb_build_object('title', v.title, 'width', 720, 'height', 1280)
from (values
  ('ikea-effect',                 'ikea-effect/video.pt.mp4',                 64, 'Como o Efeito IKEA cega o seu julgamento'),
  ('attention-residue',           'attention-residue/video.pt.mp4',           69, 'Como o Resíduo de Atenção Sabota Seu Foco'),
  ('play-deprivation-adults',     'play-deprivation-adults/video.pt.mp4',     87, 'Como a Falta de Brincadeira Engessa o Cérebro'),
  ('grip-strength-longevity',     'grip-strength-longevity/video.pt.mp4',     82, 'Por que a força da sua mão prevê a morte'),
  ('ten-second-balance-test',     'ten-second-balance-test/video.pt.mp4',     73, 'Por Que Atletas Falham no Teste de 10 Segundos'),
  ('weak-ties-job-search',        'weak-ties-job-search/video.pt.mp4',        70, 'Por que seu amigo não vai te arrumar emprego'),
  ('summary-psychology-of-money', 'summary-psychology-of-money/video.pt.mp4', 74, 'Como o Gap Comportamental Quebra Pessoas Brilhantes'),
  ('summary-good-life',           'summary-good-life/video.pt.mp4',           76, 'Por Que Seus Relacionamentos São Como Músculos')
) as v(slug, path, duration_seconds, title)
join public.learning_material m on m.slug = v.slug
on conflict (material_id, kind, locale) do update set
  path             = excluded.path,
  duration_seconds = excluded.duration_seconds,
  source           = excluded.source,
  meta             = excluded.meta;

commit;
