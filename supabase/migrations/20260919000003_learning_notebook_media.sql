-- migration: 20260919000003_learning_notebook_media.sql
-- purpose: rodada 2 (manual) do runner do Notebook de 2026-09-19
--          (.claude/agents/learning-notebook-runner.md), SÓ ÁUDIO a pedido do
--          André: 10 deep dives ("Resumo em Áudio" → Análise detalhada, duração
--          Padrão) = os 2 idiomas dos 5 materiais seguintes da fila de áudio
--          (ordem released_at desc, slug, locale desc).
--          Fonte restrita ao texto inteiro do material no idioma certo
--          (conferido em "Ver comando e fontes" de cada card); áudio
--          re-encodado AAC 64k mono +faststart por tools/content-media/video.mjs.
--          Conferência de conteúdo: só título/idioma/duração — a narração
--          NÃO foi ouvida nem transcrita.
--
--          deep dives (idioma · título no Estúdio · duração):
--            glossary-play       · PT "Por que o sofá não te descansa" 27:17
--            glossary-play       · EN "Why doing nothing won't recharge your brain" 19:22
--            glossary-nutrition  · PT "Por que ultraprocessados sabotam a saciedade" 20:27
--            glossary-nutrition  · EN "How ultra processed food overrides willpower" 22:47
--            glossary-money      · PT "Por que fazer menos rende mais dinheiro" 17:55
--            glossary-money      · EN "Why boring math beats Wall Street" 21:40
--            glossary-learn      · PT "A ciência para aprender sem esquecer" 25:42
--            glossary-learn      · EN "How to Stop Forgetting What You Study" 22:09
--            glossary-dexterity  · PT "Levantar do chão sem apoio prevê longevidade" 22:19
--            glossary-dexterity  · EN "Why Balance Predicts Your Lifespan" 20:55
--
-- affected tables: learning_material_media (10 linhas kind='audio')
-- new rpcs:        none
-- breaking?        no
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   objetos no bucket learning-media (subidos antes, cache imutável, 200 OK
--   com content-type audio/mp4 e tamanho igual ao arquivo local):
--     <slug>/audio.pt.m4a e <slug>/audio.en.m4a dos 5 slugs acima
--   on conflict (material_id, kind, locale) do update: nenhum dos 10 existia
--   (a fila do banco listava os 10), então tudo aqui é insert

begin;

insert into public.learning_material_media
  (material_id, kind, locale, path, duration_seconds, source, meta)
select m.id, 'audio', v.locale, v.path, v.duration_seconds, 'notebooklm',
       jsonb_build_object('title', v.title)
from (values
  ('glossary-play',      'pt', 'glossary-play/audio.pt.m4a',      1637, 'Por que o sofá não te descansa'),
  ('glossary-play',      'en', 'glossary-play/audio.en.m4a',      1162, 'Why doing nothing won''t recharge your brain'),
  ('glossary-nutrition', 'pt', 'glossary-nutrition/audio.pt.m4a', 1227, 'Por que ultraprocessados sabotam a saciedade'),
  ('glossary-nutrition', 'en', 'glossary-nutrition/audio.en.m4a', 1367, 'How ultra processed food overrides willpower'),
  ('glossary-money',     'pt', 'glossary-money/audio.pt.m4a',     1075, 'Por que fazer menos rende mais dinheiro'),
  ('glossary-money',     'en', 'glossary-money/audio.en.m4a',     1300, 'Why boring math beats Wall Street'),
  ('glossary-learn',     'pt', 'glossary-learn/audio.pt.m4a',     1542, 'A ciência para aprender sem esquecer'),
  ('glossary-learn',     'en', 'glossary-learn/audio.en.m4a',     1329, 'How to Stop Forgetting What You Study'),
  ('glossary-dexterity', 'pt', 'glossary-dexterity/audio.pt.m4a', 1339, 'Levantar do chão sem apoio prevê longevidade'),
  ('glossary-dexterity', 'en', 'glossary-dexterity/audio.en.m4a', 1255, 'Why Balance Predicts Your Lifespan')
) as v(slug, locale, path, duration_seconds, title)
join public.learning_material m on m.slug = v.slug
on conflict (material_id, kind, locale) do update set
  path             = excluded.path,
  duration_seconds = excluded.duration_seconds,
  source           = excluded.source,
  meta             = excluded.meta;

-- Guard (padrão de 20260907000004): um slug errado some no join em silêncio.
do $guard$
begin
  if (
    select count(*)
    from public.learning_material_media mm
    join public.learning_material m on m.id = mm.material_id
    where mm.kind = 'audio'
      and (m.slug, mm.locale, mm.path) in (
        ('glossary-play',      'pt', 'glossary-play/audio.pt.m4a'),
        ('glossary-play',      'en', 'glossary-play/audio.en.m4a'),
        ('glossary-nutrition', 'pt', 'glossary-nutrition/audio.pt.m4a'),
        ('glossary-nutrition', 'en', 'glossary-nutrition/audio.en.m4a'),
        ('glossary-money',     'pt', 'glossary-money/audio.pt.m4a'),
        ('glossary-money',     'en', 'glossary-money/audio.en.m4a'),
        ('glossary-learn',     'pt', 'glossary-learn/audio.pt.m4a'),
        ('glossary-learn',     'en', 'glossary-learn/audio.en.m4a'),
        ('glossary-dexterity', 'pt', 'glossary-dexterity/audio.pt.m4a'),
        ('glossary-dexterity', 'en', 'glossary-dexterity/audio.en.m4a')
      )
  ) <> 10 then
    raise exception 'learning_notebook: the 10 deep dives of 2026-09-19 (round 2) were not all registered';
  end if;
end
$guard$;

commit;
