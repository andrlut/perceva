-- 20261104000010_learning_remotion_video_job_crafting.sql
-- purpose: troca os vídeos PT e EN de job-crafting-additive · faca-o-mapa-voce-mesmo
--          ("Pra mudar seu trabalho, comece anotando seu dia") pelos do molde genérico em
--          Remotion (tools/video/MOLDE.md). Primeiro vídeo que passou pelos portões do
--          publisher v3: lint do roteiro, revisor de roteiro (3 rodadas), QA da voz por
--          transcrição, revisor de quadros. Roteiro: learning-drops/video-specs/job-crafting-additive.json.
-- affected tables: learning_material (ideas)
-- breaking?        no
-- bucket (subido antes, cache imutável):
--   job-crafting-additive/idea.2.pt.r1.mp4 (+ .poster.webp)   720x1280, 47 s, 1,9 MB
--   job-crafting-additive/idea.2.en.r1.mp4 (+ .poster.webp)   720x1280, 46 s, 1,9 MB
-- os vídeos antigos do Notebook ficam no bucket, sem referência.

begin;

update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'faca-o-mapa-voce-mesmo' then
      jsonb_set(i, '{video}',
        jsonb_build_object(
          'pt', jsonb_build_object(
            'path', 'job-crafting-additive/idea.2.pt.r1.mp4',
            'duration_seconds', 47,
            'poster', 'job-crafting-additive/idea.2.pt.r1.poster.webp',
            'producer', 'remotion'),
          'en', jsonb_build_object(
            'path', 'job-crafting-additive/idea.2.en.r1.mp4',
            'duration_seconds', 46,
            'poster', 'job-crafting-additive/idea.2.en.r1.poster.webp',
            'producer', 'remotion')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i)
where m.slug = 'job-crafting-additive';

do $g$ declare n int; begin
  select count(*) into n from public.learning_material m, jsonb_array_elements(m.ideas) i
  where m.slug = 'job-crafting-additive' and i->>'id' = 'faca-o-mapa-voce-mesmo'
    and i->'video'->'pt'->>'path' = 'job-crafting-additive/idea.2.pt.r1.mp4'
    and i->'video'->'en'->>'path' = 'job-crafting-additive/idea.2.en.r1.mp4';
  if n <> 1 then raise exception 'remotion video job-crafting: guarda falhou (%)', n; end if;
end $g$;

commit;
