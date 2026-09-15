-- migration: 20260915000001_learning_notebook_media.sql
-- purpose: runner do Notebook 2026-09-15 — 9 videos de ideia (EN) em learning_material.ideas[*].video.en
--
-- affected tables: public.learning_material (coluna ideas)
-- new rpcs:        none (funcao auxiliar em pg_temp, some ao fim da sessao)
-- breaking?       no
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   escrita cirurgica por id da ideia (jsonb_set + guarda pos-update); nenhum outro campo da ideia muda
--   objetos ja no bucket learning-media com cache imutavel, conferidos (206 + content-type + tamanho) antes deste arquivo
--   attachment-styles-love (video.en) ficou de fora: cutAt null, needs_review
--
--   glossary-contemplate          mente-vaga-metade            video.en
--   glossary-circle               risco-que-ninguem-mede       video.en
--   glossary-career               tres-lentes                  video.en
--   glossary-build                apego-e-prova                video.en
--   explainer-career-capital      capital-de-carreira          video.en
--   summary-atomic-habits         66-dias-nao-21               video.en
--   non-instrumental-play         dominio-recarrega            video.en
--   does-money-buy-happiness      teto-dos-75-mil              video.en
--   summary-deep-work             residuo-de-atencao           video.en

begin;

create or replace function pg_temp.set_idea_video(
  p_slug text, p_idea_id text, p_lang text, p_path text, p_duration int, p_poster text
) returns void language plpgsql as $fn$
begin
  update public.learning_material m
  set ideas = (
    select jsonb_agg(
      case when i->>'id' = p_idea_id then
        jsonb_set(
          i, '{video}',
          coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
            || jsonb_build_object(p_lang, jsonb_build_object(
                 'path', p_path,
                 'duration_seconds', p_duration,
                 'poster', p_poster)),
          true)
      else i end
      order by (i->>'ordinal')::int)
    from jsonb_array_elements(m.ideas) i
  ),
  updated_at = now()
  where m.slug = p_slug;

  -- Guarda: slug errado atualiza 0 linhas e id errado deixa o array intacto.
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = p_slug
      and i->>'id' = p_idea_id
      and i->'video'->p_lang->>'path' = p_path
  ) then
    raise exception 'learning_notebook: %/% video.% was not updated', p_slug, p_idea_id, p_lang;
  end if;
end
$fn$;

select pg_temp.set_idea_video('glossary-contemplate', 'mente-vaga-metade', 'en',
  'glossary-contemplate/idea.1.en.mp4', 76, 'glossary-contemplate/idea.1.en.poster.webp');

select pg_temp.set_idea_video('glossary-circle', 'risco-que-ninguem-mede', 'en',
  'glossary-circle/idea.1.en.mp4', 68, 'glossary-circle/idea.1.en.poster.webp');

select pg_temp.set_idea_video('glossary-career', 'tres-lentes', 'en',
  'glossary-career/idea.1.en.mp4', 74, 'glossary-career/idea.1.en.poster.webp');

select pg_temp.set_idea_video('glossary-build', 'apego-e-prova', 'en',
  'glossary-build/idea.1.en.mp4', 57, 'glossary-build/idea.1.en.poster.webp');

select pg_temp.set_idea_video('explainer-career-capital', 'capital-de-carreira', 'en',
  'explainer-career-capital/idea.1.en.mp4', 74, 'explainer-career-capital/idea.1.en.poster.webp');

select pg_temp.set_idea_video('summary-atomic-habits', '66-dias-nao-21', 'en',
  'summary-atomic-habits/idea.1.en.mp4', 66, 'summary-atomic-habits/idea.1.en.poster.webp');

select pg_temp.set_idea_video('non-instrumental-play', 'dominio-recarrega', 'en',
  'non-instrumental-play/idea.1.en.mp4', 85, 'non-instrumental-play/idea.1.en.poster.webp');

select pg_temp.set_idea_video('does-money-buy-happiness', 'teto-dos-75-mil', 'en',
  'does-money-buy-happiness/idea.1.en.mp4', 62, 'does-money-buy-happiness/idea.1.en.poster.webp');

select pg_temp.set_idea_video('summary-deep-work', 'residuo-de-atencao', 'en',
  'summary-deep-work/idea.1.en.mp4', 69, 'summary-deep-work/idea.1.en.poster.webp');

commit;
