-- migration: 20261107000001_learning_remotion_video_job_crafting_r2.sql
-- purpose: troca os vídeos PT e EN de job-crafting-additive · faca-o-mapa-voce-mesmo pela r2 do
--          molde em Remotion: o piloto "demonstrar a ideia" que o André aprovou em 2026-11-07
--          (o caderno escreve o dia com o nome de cada tarefa, o tempo e a energia; o mapa
--          redesenha o mesmo dia; fase 2 do requinte: texto por máscara, verso que acende com a
--          voz, fecho com a marca, luz da janela; rosto Hexa Limpo). Passou por duas rodadas do
--          revisor de roteiro e de quadros do pipeline e pelo portão de quadros PT/EN da r2.
--          Roteiro: learning-drops/video-specs/job-crafting-additive.json.
--
-- affected tables: learning_material (ideas)
-- new rpcs:        none
-- breaking?        no
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   bucket (subido antes, cache imutável):
--     job-crafting-additive/idea.2.pt.r2.mp4 (+ .poster.webp)   720x1280, 53 s, 3,0 MB
--     job-crafting-additive/idea.2.en.r2.mp4 (+ .poster.webp)   720x1280, 54 s, 3,1 MB
--   a r1 (20261104000010) fica no bucket, sem referência.

begin;

update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'faca-o-mapa-voce-mesmo' then
      jsonb_set(i, '{video}',
        jsonb_build_object(
          'pt', jsonb_build_object(
            'path', 'job-crafting-additive/idea.2.pt.r2.mp4',
            'duration_seconds', 53,
            'poster', 'job-crafting-additive/idea.2.pt.r2.poster.webp',
            'producer', 'remotion'),
          'en', jsonb_build_object(
            'path', 'job-crafting-additive/idea.2.en.r2.mp4',
            'duration_seconds', 54,
            'poster', 'job-crafting-additive/idea.2.en.r2.poster.webp',
            'producer', 'remotion')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i)
where m.slug = 'job-crafting-additive';

do $g$ declare n int; begin
  select count(*) into n from public.learning_material m, jsonb_array_elements(m.ideas) i
  where m.slug = 'job-crafting-additive' and i->>'id' = 'faca-o-mapa-voce-mesmo'
    and i->'video'->'pt'->>'path' = 'job-crafting-additive/idea.2.pt.r2.mp4'
    and i->'video'->'en'->>'path' = 'job-crafting-additive/idea.2.en.r2.mp4';
  if n <> 1 then raise exception 'remotion video job-crafting r2: guarda falhou (%)', n; end if;
end $g$;

commit;
