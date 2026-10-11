-- migration: 20261011000001_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-10-11, rodada das 13h (.claude/agents/learning-notebook-runner.md):
--          9 deep dives "Resumo em Áudio" Análise detalhada / Padrão / PT (fonte restrita ao
--          texto PT do material, reencodados AAC 64k mono +faststart). Nenhum vídeo nesta rodada
--          (fila sem vídeos tier 1–2; os 2 de tier 4 seguem pulados: falha dupla / corte falho).
--          Deep dive: upsert em learning_material_media (unique material_id, kind, locale),
--          com guarda que conta as 9 linhas pelo path.
--
--          deep dives (slug · lado · título no Estúdio · duração s):
--            summary-atomic-habits · pt · "Como o cérebro realmente forma hábitos" · 1221
--            non-instrumental-play · pt · "Monetizar seu hobby destrói o descanso" · 1502
--            summary-antifragile · pt · "Como a antifragilidade nos fortalece no caos" · 1327
--            does-money-buy-happiness · pt · "Dinheiro realmente compra felicidade" · 1206
--            attachment-styles-love · pt · "Por que o vácuo amoroso assusta" · 917
--            summary-deep-work · pt · "Trabalho focado na era da distração" · 1921
--            news-loneliness-memory-2026-04 · pt · "Solidão não acelera a perda de memória" · 1234
--            news-oral-glp1-2026-05 · pt · "Pílula diária impede o reganho de peso" · 1410
--            summary-outlive · pt · "A ciência real da longevidade" · 1188

begin;

-- deep dives
insert into public.learning_material_media
  (material_id, kind, locale, path, duration_seconds, source, meta)
select m.id, 'audio', v.locale, v.path, v.duration_seconds, 'notebooklm',
       jsonb_build_object('title', v.title)
from (values
  ('summary-atomic-habits', 'pt', 'summary-atomic-habits/audio.pt.m4a', 1221, 'Como o cérebro realmente forma hábitos'),
  ('non-instrumental-play', 'pt', 'non-instrumental-play/audio.pt.m4a', 1502, 'Monetizar seu hobby destrói o descanso'),
  ('summary-antifragile', 'pt', 'summary-antifragile/audio.pt.m4a', 1327, 'Como a antifragilidade nos fortalece no caos'),
  ('does-money-buy-happiness', 'pt', 'does-money-buy-happiness/audio.pt.m4a', 1206, 'Dinheiro realmente compra felicidade'),
  ('attachment-styles-love', 'pt', 'attachment-styles-love/audio.pt.m4a', 917, 'Por que o vácuo amoroso assusta'),
  ('summary-deep-work', 'pt', 'summary-deep-work/audio.pt.m4a', 1921, 'Trabalho focado na era da distração'),
  ('news-loneliness-memory-2026-04', 'pt', 'news-loneliness-memory-2026-04/audio.pt.m4a', 1234, 'Solidão não acelera a perda de memória'),
  ('news-oral-glp1-2026-05', 'pt', 'news-oral-glp1-2026-05/audio.pt.m4a', 1410, 'Pílula diária impede o reganho de peso'),
  ('summary-outlive', 'pt', 'summary-outlive/audio.pt.m4a', 1188, 'A ciência real da longevidade')
) as v(slug, locale, path, duration_seconds, title)
join public.learning_material m on m.slug = v.slug
on conflict (material_id, kind, locale) do update set
  path             = excluded.path,
  duration_seconds = excluded.duration_seconds,
  source           = excluded.source,
  meta             = excluded.meta;

do $guard$
declare n int;
begin
  select count(*) into n
  from public.learning_material_media mm
  join public.learning_material m on m.id = mm.material_id
  where mm.kind = 'audio' and (m.slug, mm.locale, mm.path) in (
    ('summary-atomic-habits', 'pt', 'summary-atomic-habits/audio.pt.m4a'),
    ('non-instrumental-play', 'pt', 'non-instrumental-play/audio.pt.m4a'),
    ('summary-antifragile', 'pt', 'summary-antifragile/audio.pt.m4a'),
    ('does-money-buy-happiness', 'pt', 'does-money-buy-happiness/audio.pt.m4a'),
    ('attachment-styles-love', 'pt', 'attachment-styles-love/audio.pt.m4a'),
    ('summary-deep-work', 'pt', 'summary-deep-work/audio.pt.m4a'),
    ('news-loneliness-memory-2026-04', 'pt', 'news-loneliness-memory-2026-04/audio.pt.m4a'),
    ('news-oral-glp1-2026-05', 'pt', 'news-oral-glp1-2026-05/audio.pt.m4a'),
    ('summary-outlive', 'pt', 'summary-outlive/audio.pt.m4a')
  );
  if n <> 9 then
    raise exception 'learning_notebook: expected 9 deep dive rows, found %', n;
  end if;
end
$guard$;

commit;
