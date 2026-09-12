-- migration: 20260912000002_learning_notebook_media.sql
-- purpose: rodada do runner do Notebook de 2026-09-12 (rodada 2 de 3):
--          8 vídeos "Resumo em Vídeo" Curta, um por ideia, fonte restrita ao
--          documento daquela ideia + foco "Cubra apenas o que está nesta fonte;
--          não acrescente outros temas.". Todos conferidos quadro a quadro
--          (1 a cada 8 s) antes de subir: nenhum vaza pra outra ideia.
--            · glossary-money · ideia 1 (compre-o-palheiro) · PT
--              gerado na rodada 1, retomado aqui: o cartão final veio ESCURO
--              ("Gemini Notebook", YAVG ~45 contra conteúdo ~195), que o
--              detector de cartão claro de video.mjs não enxerga (cutAt null).
--              Cortado em 77,37 s pela própria lib (trimOutro com cutAt dado
--              pelo chamador) → 77,2 s. video.mjs NÃO foi alterado.
--            · glossary-dexterity · ideia 1 (sentar-e-levantar) · PT
--              "Por que levantar do chão revela sua saúde" (1:17) → 74,9 s → 74,8 s
--            · glossary-contemplate · ideia 1 (mente-vaga-metade) · PT
--              "Como a Sua Mente Rouba o Seu Humor" (1:15) → 72,5 s → 72,3 s
--            · glossary-circle · ideia 1 (risco-que-ninguem-mede) · PT
--              "O Risco Oculto do Isolamento Social" (1:17) → 74,1 s → 73,9 s
--            · glossary-career · ideia 1 (tres-lentes) · PT
--              "Como as Três Lentes do Trabalho Mudam Sua Satisfação" (1:25)
--              → 82,5 s → 82,4 s
--            · glossary-build · ideia 1 (apego-e-prova) · PT
--              "O Segredo Psicológico do Efeito IKEA" (1:27) → 84,7 s → 84,6 s
--            · explainer-career-capital · ideia 1 (capital-de-carreira) · PT
--              "O Que É Capital de Carreira" (1:02) → 60,0 s → 59,9 s
--            · summary-atomic-habits · ideia 1 (66-dias-nao-21) · PT
--              "A Verdadeira Curva Para Criar Hábitos" (1:06) → 63,8 s → 63,7 s
--
-- affected tables: learning_material (ideas -> <idea>.video.pt)
-- new rpcs:        none
-- breaking?        no
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   bucket (subidos antes, cache imutável, GET 200 conferido):
--     glossary-money/idea.1.pt.mp4            + idea.1.pt.poster.webp
--     glossary-dexterity/idea.1.pt.mp4        + idea.1.pt.poster.webp
--     glossary-contemplate/idea.1.pt.mp4      + idea.1.pt.poster.webp
--     glossary-circle/idea.1.pt.mp4           + idea.1.pt.poster.webp
--     glossary-career/idea.1.pt.mp4           + idea.1.pt.poster.webp
--     glossary-build/idea.1.pt.mp4            + idea.1.pt.poster.webp
--     explainer-career-capital/idea.1.pt.mp4  + idea.1.pt.poster.webp
--     summary-atomic-habits/idea.1.pt.mp4     + idea.1.pt.poster.webp
--   só PT nesta rodada: um UPDATE ... FROM casa no máximo uma linha de v por
--   linha alvo, então pt e en do mesmo slug nunca viajam no mesmo comando.

begin;

-- PT: um vídeo por material, todos na ideia 1
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case
      when i->>'id' = v.idea_id then
        jsonb_set(
          i,
          '{video}',
          coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
            || jsonb_build_object('pt', jsonb_build_object(
                 'path', v.path,
                 'duration_seconds', v.duration_seconds,
                 'poster', v.poster)),
          true)
      else i
    end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
from (values
  ('glossary-money',           'compre-o-palheiro',      'glossary-money/idea.1.pt.mp4',           77, 'glossary-money/idea.1.pt.poster.webp'),
  ('glossary-dexterity',       'sentar-e-levantar',      'glossary-dexterity/idea.1.pt.mp4',       75, 'glossary-dexterity/idea.1.pt.poster.webp'),
  ('glossary-contemplate',     'mente-vaga-metade',      'glossary-contemplate/idea.1.pt.mp4',     72, 'glossary-contemplate/idea.1.pt.poster.webp'),
  ('glossary-circle',          'risco-que-ninguem-mede', 'glossary-circle/idea.1.pt.mp4',          74, 'glossary-circle/idea.1.pt.poster.webp'),
  ('glossary-career',          'tres-lentes',            'glossary-career/idea.1.pt.mp4',          82, 'glossary-career/idea.1.pt.poster.webp'),
  ('glossary-build',           'apego-e-prova',          'glossary-build/idea.1.pt.mp4',           85, 'glossary-build/idea.1.pt.poster.webp'),
  ('explainer-career-capital', 'capital-de-carreira',    'explainer-career-capital/idea.1.pt.mp4', 60, 'explainer-career-capital/idea.1.pt.poster.webp'),
  ('summary-atomic-habits',    '66-dias-nao-21',         'summary-atomic-habits/idea.1.pt.mp4',    64, 'summary-atomic-habits/idea.1.pt.poster.webp')
) as v(slug, idea_id, path, duration_seconds, poster)
where m.slug = v.slug;

-- Guarda (padrão de 20260907000004): slug errado atualiza 0 linhas e id de
-- ideia errado deixa o array intacto — os dois passariam em silêncio.
do $guard$
declare
  r record;
begin
  for r in
    select *
    from (values
      ('glossary-money',           'compre-o-palheiro',      'pt', 'glossary-money/idea.1.pt.mp4',           'glossary-money/idea.1.pt.poster.webp',           77),
      ('glossary-dexterity',       'sentar-e-levantar',      'pt', 'glossary-dexterity/idea.1.pt.mp4',       'glossary-dexterity/idea.1.pt.poster.webp',       75),
      ('glossary-contemplate',     'mente-vaga-metade',      'pt', 'glossary-contemplate/idea.1.pt.mp4',     'glossary-contemplate/idea.1.pt.poster.webp',     72),
      ('glossary-circle',          'risco-que-ninguem-mede', 'pt', 'glossary-circle/idea.1.pt.mp4',          'glossary-circle/idea.1.pt.poster.webp',          74),
      ('glossary-career',          'tres-lentes',            'pt', 'glossary-career/idea.1.pt.mp4',          'glossary-career/idea.1.pt.poster.webp',          82),
      ('glossary-build',           'apego-e-prova',          'pt', 'glossary-build/idea.1.pt.mp4',           'glossary-build/idea.1.pt.poster.webp',           85),
      ('explainer-career-capital', 'capital-de-carreira',    'pt', 'explainer-career-capital/idea.1.pt.mp4', 'explainer-career-capital/idea.1.pt.poster.webp', 60),
      ('summary-atomic-habits',    '66-dias-nao-21',         'pt', 'summary-atomic-habits/idea.1.pt.mp4',    'summary-atomic-habits/idea.1.pt.poster.webp',    64)
    ) as v(slug, idea_id, locale, path, poster, duration_seconds)
  loop
    if not exists (
      select 1
      from public.learning_material m, jsonb_array_elements(m.ideas) i
      where m.slug = r.slug
        and i->>'id' = r.idea_id
        and i->'video'->r.locale->>'path' = r.path
        and i->'video'->r.locale->>'poster' = r.poster
        and (i->'video'->r.locale->>'duration_seconds')::int = r.duration_seconds
    ) then
      raise exception 'learning_notebook: % / % video.% nao foi atualizado', r.slug, r.idea_id, r.locale;
    end if;
  end loop;
end
$guard$;

commit;
