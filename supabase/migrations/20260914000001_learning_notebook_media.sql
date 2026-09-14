-- migration: 20260914000001_learning_notebook_media.sql
-- purpose: runner do Notebook 2026-09-14 — 10 videos de ideia (5 PT + 5 EN) em learning_material.ideas[*].video.<lang>
--
-- affected tables: public.learning_material (coluna ideas)
-- new rpcs:        none (funcao auxiliar em pg_temp, some ao fim da sessao)
-- breaking?       no
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   escrita cirurgica por id da ideia (jsonb_set + guarda pos-update); nenhum outro campo da ideia muda
--   objetos ja no bucket learning-media com cache imutavel, conferidos (206 + content-type) antes deste arquivo
--
--   summary-outlive               quatro-cavaleiros          video.pt
--   news-pink-noise-sleep-2026-09 som-cronometrado-cerebro   video.pt + video.en
--   summary-why-we-sleep          duas-maquinas              video.pt
--   glossary-sleep                tres-pecas-do-sono         video.pt
--   glossary-strength             aperto-de-mao              video.pt
--   cbt-i-vs-sleep-hygiene        lista-nao-e-tratamento     video.en
--   ikea-effect                   apego-no-montador          video.en
--   attention-residue             residuo-cobra-da-proxima   video.en
--   play-deprivation-adults       instinto-nao-passatempo    video.en

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

select pg_temp.set_idea_video('summary-outlive', 'quatro-cavaleiros', 'pt',
  'summary-outlive/idea.1.pt.mp4', 58, 'summary-outlive/idea.1.pt.poster.webp');

select pg_temp.set_idea_video('news-pink-noise-sleep-2026-09', 'som-cronometrado-cerebro', 'pt',
  'news-pink-noise-sleep-2026-09/idea.1.pt.mp4', 67, 'news-pink-noise-sleep-2026-09/idea.1.pt.poster.webp');

select pg_temp.set_idea_video('news-pink-noise-sleep-2026-09', 'som-cronometrado-cerebro', 'en',
  'news-pink-noise-sleep-2026-09/idea.1.en.mp4', 69, 'news-pink-noise-sleep-2026-09/idea.1.en.poster.webp');

select pg_temp.set_idea_video('summary-why-we-sleep', 'duas-maquinas', 'pt',
  'summary-why-we-sleep/idea.1.pt.mp4', 70, 'summary-why-we-sleep/idea.1.pt.poster.webp');

select pg_temp.set_idea_video('glossary-sleep', 'tres-pecas-do-sono', 'pt',
  'glossary-sleep/idea.1.pt.mp4', 60, 'glossary-sleep/idea.1.pt.poster.webp');

select pg_temp.set_idea_video('glossary-strength', 'aperto-de-mao', 'pt',
  'glossary-strength/idea.1.pt.mp4', 62, 'glossary-strength/idea.1.pt.poster.webp');

select pg_temp.set_idea_video('cbt-i-vs-sleep-hygiene', 'lista-nao-e-tratamento', 'en',
  'cbt-i-vs-sleep-hygiene/idea.1.en.mp4', 68, 'cbt-i-vs-sleep-hygiene/idea.1.en.poster.webp');

select pg_temp.set_idea_video('ikea-effect', 'apego-no-montador', 'en',
  'ikea-effect/idea.1.en.mp4', 62, 'ikea-effect/idea.1.en.poster.webp');

select pg_temp.set_idea_video('attention-residue', 'residuo-cobra-da-proxima', 'en',
  'attention-residue/idea.1.en.mp4', 64, 'attention-residue/idea.1.en.poster.webp');

select pg_temp.set_idea_video('play-deprivation-adults', 'instinto-nao-passatempo', 'en',
  'play-deprivation-adults/idea.1.en.mp4', 61, 'play-deprivation-adults/idea.1.en.poster.webp');

commit;
