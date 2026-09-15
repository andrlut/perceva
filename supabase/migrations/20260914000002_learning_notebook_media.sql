-- migration: 20260914000002_learning_notebook_media.sql
-- purpose: runner do Notebook 2026-09-14 (rodada 2) — 10 videos de ideia (EN) em learning_material.ideas[*].video.en
--
-- affected tables: public.learning_material (coluna ideas)
-- new rpcs:        none (funcao auxiliar em pg_temp, some ao fim da sessao)
-- breaking?       no
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   escrita cirurgica por id da ideia (jsonb_set + guarda pos-update); nenhum outro campo da ideia muda
--   objetos ja no bucket learning-media com cache imutavel, conferidos (206 + content-type + tamanho) antes deste arquivo
--
--   grip-strength-longevity       aperto-bate-a-pressao        video.en
--   ten-second-balance-test       capacidade-que-some          video.en
--   weak-ties-job-search          circulo-fechado              video.en
--   summary-psychology-of-money   comportamento-vence-diploma  video.en
--   summary-good-life             relacao-preve-saude          video.en
--   glossary-romance              bids-de-conexao              video.en
--   glossary-nutrition            ultraprocessado-come-mais    video.en
--   glossary-money                compre-o-palheiro            video.en
--   glossary-learn                dificuldades-desejaveis      video.en
--   glossary-dexterity            sentar-e-levantar            video.en

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

select pg_temp.set_idea_video('grip-strength-longevity', 'aperto-bate-a-pressao', 'en',
  'grip-strength-longevity/idea.1.en.mp4', 70, 'grip-strength-longevity/idea.1.en.poster.webp');

select pg_temp.set_idea_video('ten-second-balance-test', 'capacidade-que-some', 'en',
  'ten-second-balance-test/idea.1.en.mp4', 72, 'ten-second-balance-test/idea.1.en.poster.webp');

select pg_temp.set_idea_video('weak-ties-job-search', 'circulo-fechado', 'en',
  'weak-ties-job-search/idea.1.en.mp4', 82, 'weak-ties-job-search/idea.1.en.poster.webp');

select pg_temp.set_idea_video('summary-psychology-of-money', 'comportamento-vence-diploma', 'en',
  'summary-psychology-of-money/idea.1.en.mp4', 66, 'summary-psychology-of-money/idea.1.en.poster.webp');

select pg_temp.set_idea_video('summary-good-life', 'relacao-preve-saude', 'en',
  'summary-good-life/idea.1.en.mp4', 77, 'summary-good-life/idea.1.en.poster.webp');

select pg_temp.set_idea_video('glossary-romance', 'bids-de-conexao', 'en',
  'glossary-romance/idea.1.en.mp4', 76, 'glossary-romance/idea.1.en.poster.webp');

select pg_temp.set_idea_video('glossary-nutrition', 'ultraprocessado-come-mais', 'en',
  'glossary-nutrition/idea.1.en.mp4', 79, 'glossary-nutrition/idea.1.en.poster.webp');

select pg_temp.set_idea_video('glossary-money', 'compre-o-palheiro', 'en',
  'glossary-money/idea.1.en.mp4', 77, 'glossary-money/idea.1.en.poster.webp');

select pg_temp.set_idea_video('glossary-learn', 'dificuldades-desejaveis', 'en',
  'glossary-learn/idea.1.en.mp4', 82, 'glossary-learn/idea.1.en.poster.webp');

select pg_temp.set_idea_video('glossary-dexterity', 'sentar-e-levantar', 'en',
  'glossary-dexterity/idea.1.en.mp4', 66, 'glossary-dexterity/idea.1.en.poster.webp');

commit;
