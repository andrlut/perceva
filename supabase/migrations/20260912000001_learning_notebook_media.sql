-- migration: 20260912000001_learning_notebook_media.sql
-- purpose: rodada do runner do Notebook de 2026-09-12 (rodada 1 de 3):
--          6 vídeos "Resumo em Vídeo" Curta, um por ideia, fonte restrita ao
--          documento daquela ideia + foco "Cubra apenas o que está nesta fonte"
--          ("Cover only what is in this source" no EN). Todos conferidos quadro
--          a quadro (1 a cada 8 s) antes de subir: nenhum vaza pra outra ideia.
--            · protein-distribution-30g-myth · ideia 1 (nao-existe-teto-de-absorcao) · PT
--              "O Mito dos 30g de Proteína" (1:17) → corte em 74,3 s → 74,2 s
--            · protein-distribution-30g-myth · ideia 1 · EN
--              "How Your Body Uses 100 Grams of Protein" (1:04) → 61,2 s → 61,1 s
--            · cbt-i-vs-sleep-hygiene · ideia 1 (lista-nao-e-tratamento) · PT
--              "Por Que a Higiene do Sono Falha" (1:13) → 70,8 s → 70,7 s
--            · glossary-romance · ideia 1 (bids-de-conexao) · PT
--              "Por Que Meio Segundo Salva um Relacionamento" (1:10) → 67,1 s → 67,0 s
--            · glossary-nutrition · ideia 1 (ultraprocessado-come-mais) · PT
--              "Como a Textura Sabota Sua Saciedade" (1:08) → 65,2 s → 65,1 s
--            · glossary-learn · ideia 1 (dificuldades-desejaveis) · PT
--              "Dificuldades Desejáveis: Por Que Reler Sabota Sua Memória" (1:30)
--              → 87,3 s → 87,2 s
--
-- affected tables: learning_material (ideas -> <idea>.video.<locale>)
-- new rpcs:        none
-- breaking?        no
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   bucket (subidos antes, cache imutável, GET 200 conferido):
--     protein-distribution-30g-myth/idea.1.pt.mp4  + idea.1.pt.poster.webp
--     protein-distribution-30g-myth/idea.1.en.mp4  + idea.1.en.poster.webp
--     cbt-i-vs-sleep-hygiene/idea.1.pt.mp4         + idea.1.pt.poster.webp
--     glossary-romance/idea.1.pt.mp4               + idea.1.pt.poster.webp
--     glossary-nutrition/idea.1.pt.mp4             + idea.1.pt.poster.webp
--     glossary-learn/idea.1.pt.mp4                 + idea.1.pt.poster.webp
--   glossary-money ficou de fora (needs_review): o cartão final do Notebook veio
--   ESCURO e video.mjs, que procura cartão claro, devolveu cutAt null.
--   duas instruções separadas (PT e EN) de propósito: um UPDATE ... FROM casa
--   no máximo uma linha de v por linha alvo, então pt e en do mesmo slug não
--   podem viajar juntos.

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
  ('protein-distribution-30g-myth', 'nao-existe-teto-de-absorcao', 'protein-distribution-30g-myth/idea.1.pt.mp4', 74, 'protein-distribution-30g-myth/idea.1.pt.poster.webp'),
  ('cbt-i-vs-sleep-hygiene',        'lista-nao-e-tratamento',      'cbt-i-vs-sleep-hygiene/idea.1.pt.mp4',        71, 'cbt-i-vs-sleep-hygiene/idea.1.pt.poster.webp'),
  ('glossary-romance',              'bids-de-conexao',             'glossary-romance/idea.1.pt.mp4',              67, 'glossary-romance/idea.1.pt.poster.webp'),
  ('glossary-nutrition',            'ultraprocessado-come-mais',   'glossary-nutrition/idea.1.pt.mp4',            65, 'glossary-nutrition/idea.1.pt.poster.webp'),
  ('glossary-learn',                'dificuldades-desejaveis',     'glossary-learn/idea.1.pt.mp4',                87, 'glossary-learn/idea.1.pt.poster.webp')
) as v(slug, idea_id, path, duration_seconds, poster)
where m.slug = v.slug;

-- EN: só protein-distribution-30g-myth nesta rodada
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case
      when i->>'id' = v.idea_id then
        jsonb_set(
          i,
          '{video}',
          coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
            || jsonb_build_object('en', jsonb_build_object(
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
  ('protein-distribution-30g-myth', 'nao-existe-teto-de-absorcao', 'protein-distribution-30g-myth/idea.1.en.mp4', 61, 'protein-distribution-30g-myth/idea.1.en.poster.webp')
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
      ('protein-distribution-30g-myth', 'nao-existe-teto-de-absorcao', 'pt', 'protein-distribution-30g-myth/idea.1.pt.mp4', 'protein-distribution-30g-myth/idea.1.pt.poster.webp', 74),
      ('protein-distribution-30g-myth', 'nao-existe-teto-de-absorcao', 'en', 'protein-distribution-30g-myth/idea.1.en.mp4', 'protein-distribution-30g-myth/idea.1.en.poster.webp', 61),
      ('cbt-i-vs-sleep-hygiene',        'lista-nao-e-tratamento',      'pt', 'cbt-i-vs-sleep-hygiene/idea.1.pt.mp4',        'cbt-i-vs-sleep-hygiene/idea.1.pt.poster.webp',        71),
      ('glossary-romance',              'bids-de-conexao',             'pt', 'glossary-romance/idea.1.pt.mp4',              'glossary-romance/idea.1.pt.poster.webp',              67),
      ('glossary-nutrition',            'ultraprocessado-come-mais',   'pt', 'glossary-nutrition/idea.1.pt.mp4',            'glossary-nutrition/idea.1.pt.poster.webp',            65),
      ('glossary-learn',                'dificuldades-desejaveis',     'pt', 'glossary-learn/idea.1.pt.mp4',                'glossary-learn/idea.1.pt.poster.webp',                87)
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
