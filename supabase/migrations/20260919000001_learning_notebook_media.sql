-- migration: 20260919000001_learning_notebook_media.sql
-- purpose: rodada manual do runner do Notebook (.claude/agents/learning-notebook-runner.md)
--          SÓ ÁUDIO, a pedido do André: 10 deep dives ("Resumo em Áudio" →
--          Análise detalhada, duração Padrão) = os 2 idiomas dos 5 materiais
--          mais novos sem áudio (ordem released_at desc, slug, locale desc).
--          Fonte restrita ao texto inteiro do material no idioma certo
--          (conferido em "Ver comando e fontes" de cada card); áudio
--          re-encodado AAC 64k mono +faststart por tools/content-media/video.mjs.
--          Conferência de conteúdo: só título/idioma/duração — a narração
--          NÃO foi transcrita.
--
--          deep dives (idioma · título no Estúdio · duração):
--            bids-for-connection           · PT "A ciência dos pedidos de atenção" 26:24
--            bids-for-connection           · EN "Small Bids and the 90 Percent Myth" 21:33
--            news-pink-noise-sleep-2026-09 · PT "O som que faz a faxina cerebral" 18:59
--            news-pink-noise-sleep-2026-09 · EN "Power washing your brain with pink noise" 20:40
--            protein-distribution-30g-myth · PT "O mito dos 30 gramas de proteína" 22:48
--            protein-distribution-30g-myth · EN "The Thirty Gram Protein Myth" 23:51
--            cbt-i-vs-sleep-hygiene        · PT "Por que a higiene do sono falha" 23:20
--            cbt-i-vs-sleep-hygiene        · EN "Why sleep hygiene won't fix chronic insomnia" 22:20
--            glossary-romance              · PT "Pequenos gestos que salvam seu relacionamento" 23:02
--            glossary-romance              · EN "How Small Bids Save Your Relationship" 22:47
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
  ('bids-for-connection',           'pt', 'bids-for-connection/audio.pt.m4a',           1584, 'A ciência dos pedidos de atenção'),
  ('bids-for-connection',           'en', 'bids-for-connection/audio.en.m4a',           1293, 'Small Bids and the 90 Percent Myth'),
  ('news-pink-noise-sleep-2026-09', 'pt', 'news-pink-noise-sleep-2026-09/audio.pt.m4a', 1139, 'O som que faz a faxina cerebral'),
  ('news-pink-noise-sleep-2026-09', 'en', 'news-pink-noise-sleep-2026-09/audio.en.m4a', 1240, 'Power washing your brain with pink noise'),
  ('protein-distribution-30g-myth', 'pt', 'protein-distribution-30g-myth/audio.pt.m4a', 1368, 'O mito dos 30 gramas de proteína'),
  ('protein-distribution-30g-myth', 'en', 'protein-distribution-30g-myth/audio.en.m4a', 1431, 'The Thirty Gram Protein Myth'),
  ('cbt-i-vs-sleep-hygiene',        'pt', 'cbt-i-vs-sleep-hygiene/audio.pt.m4a',        1400, 'Por que a higiene do sono falha'),
  ('cbt-i-vs-sleep-hygiene',        'en', 'cbt-i-vs-sleep-hygiene/audio.en.m4a',        1340, 'Why sleep hygiene won''t fix chronic insomnia'),
  ('glossary-romance',              'pt', 'glossary-romance/audio.pt.m4a',              1382, 'Pequenos gestos que salvam seu relacionamento'),
  ('glossary-romance',              'en', 'glossary-romance/audio.en.m4a',              1367, 'How Small Bids Save Your Relationship')
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
        ('bids-for-connection',           'pt', 'bids-for-connection/audio.pt.m4a'),
        ('bids-for-connection',           'en', 'bids-for-connection/audio.en.m4a'),
        ('news-pink-noise-sleep-2026-09', 'pt', 'news-pink-noise-sleep-2026-09/audio.pt.m4a'),
        ('news-pink-noise-sleep-2026-09', 'en', 'news-pink-noise-sleep-2026-09/audio.en.m4a'),
        ('protein-distribution-30g-myth', 'pt', 'protein-distribution-30g-myth/audio.pt.m4a'),
        ('protein-distribution-30g-myth', 'en', 'protein-distribution-30g-myth/audio.en.m4a'),
        ('cbt-i-vs-sleep-hygiene',        'pt', 'cbt-i-vs-sleep-hygiene/audio.pt.m4a'),
        ('cbt-i-vs-sleep-hygiene',        'en', 'cbt-i-vs-sleep-hygiene/audio.en.m4a'),
        ('glossary-romance',              'pt', 'glossary-romance/audio.pt.m4a'),
        ('glossary-romance',              'en', 'glossary-romance/audio.en.m4a')
      )
  ) <> 10 then
    raise exception 'learning_notebook: the 10 deep dives of 2026-09-19 were not all registered';
  end if;
end
$guard$;

commit;
