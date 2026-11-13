-- migration: 20261113000001_learning_remotion_video_paker_r4.sql
-- purpose: troca os vídeos PT e EN das 3 ideias de paker-health-energia-pele-forca
--          (material patrocinado da Paker Health) pela r4 do molde em Remotion: o MODELO
--          DE 60 s que o André aprovou nos pilotos r5 (10–11/11) e mandou subir em 13/11 —
--          a fase 3 (a tela demonstra o que a voz diz) + o boneco v5 "Animação de série"
--          (esqueleto articulado, roupa pela cena) + fundo nítido e vivo + SEM o card no fim
--          (o vídeo termina no verso demonstrado; o card é coletado na tela do app) + a
--          ideia inteira contada em 9–10 falas, sem estudo, número de pesquisa nem marca.
--          Vozes do elenco (tools/video/vozes.json), alternadas entre os três:
--            pré-treino PT Lendário · EN Kore    colágeno PT Roberta · EN Liam
--            creatina   PT Dani     · EN Liam
--          Roteiro: learning-drops/video-specs/paker-health-energia-pele-forca.json (r4).
--
-- affected tables: learning_material (ideas — só o campo video de cada ideia)
-- new rpcs:        none
-- breaking?        no
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   texto, sponsor e capa do material ficam intocados (jsonb_set só em {video})
--   bucket (subido antes, cache imutável, conferido com curl: video/mp4 e image/webp):
--     paker-health-energia-pele-forca/idea.1.pt.r4.mp4 (+ .poster.webp)   60 s, 4,4 MB
--     paker-health-energia-pele-forca/idea.1.en.r4.mp4 (+ .poster.webp)   60 s, 4,4 MB
--     paker-health-energia-pele-forca/idea.2.pt.r4.mp4 (+ .poster.webp)   62 s, 4,6 MB
--     paker-health-energia-pele-forca/idea.2.en.r4.mp4 (+ .poster.webp)   53 s, 4,2 MB
--     paker-health-energia-pele-forca/idea.3.pt.r4.mp4 (+ .poster.webp)   65 s, 6,5 MB
--     paker-health-energia-pele-forca/idea.3.en.r4.mp4 (+ .poster.webp)   58 s, 5,8 MB
--   a r1, a r2 e a r3 (20261105000002, 20261108000001, 20261109000001) ficam no bucket, sem referência.

begin;

with v(id, video) as (
  values
    ('pre-treino-energia', jsonb_build_object(
      'pt', jsonb_build_object('path', 'paker-health-energia-pele-forca/idea.1.pt.r4.mp4', 'duration_seconds', 60,
                               'poster', 'paker-health-energia-pele-forca/idea.1.pt.r4.poster.webp', 'producer', 'remotion'),
      'en', jsonb_build_object('path', 'paker-health-energia-pele-forca/idea.1.en.r4.mp4', 'duration_seconds', 60,
                               'poster', 'paker-health-energia-pele-forca/idea.1.en.r4.poster.webp', 'producer', 'remotion'))),
    ('colageno-constancia', jsonb_build_object(
      'pt', jsonb_build_object('path', 'paker-health-energia-pele-forca/idea.2.pt.r4.mp4', 'duration_seconds', 62,
                               'poster', 'paker-health-energia-pele-forca/idea.2.pt.r4.poster.webp', 'producer', 'remotion'),
      'en', jsonb_build_object('path', 'paker-health-energia-pele-forca/idea.2.en.r4.mp4', 'duration_seconds', 53,
                               'poster', 'paker-health-energia-pele-forca/idea.2.en.r4.poster.webp', 'producer', 'remotion'))),
    ('creatina-alem-da-musculacao', jsonb_build_object(
      'pt', jsonb_build_object('path', 'paker-health-energia-pele-forca/idea.3.pt.r4.mp4', 'duration_seconds', 65,
                               'poster', 'paker-health-energia-pele-forca/idea.3.pt.r4.poster.webp', 'producer', 'remotion'),
      'en', jsonb_build_object('path', 'paker-health-energia-pele-forca/idea.3.en.r4.mp4', 'duration_seconds', 58,
                               'poster', 'paker-health-energia-pele-forca/idea.3.en.r4.poster.webp', 'producer', 'remotion')))
)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when v.id is not null then jsonb_set(i, '{video}', v.video, true) else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
  left join v on v.id = i->>'id')
where m.slug = 'paker-health-energia-pele-forca';

do $g$ declare n int; total int; begin
  select count(*) filter (where i->'video'->'pt'->>'path' like 'paker-health-energia-pele-forca/idea._.pt.r4.mp4'
                            and i->'video'->'en'->>'path' like 'paker-health-energia-pele-forca/idea._.en.r4.mp4'),
         count(*)
    into n, total
  from public.learning_material m, jsonb_array_elements(m.ideas) i
  where m.slug = 'paker-health-energia-pele-forca';
  if n <> 3 or total <> 3 then raise exception 'remotion video paker r4: guarda falhou (% de % ideias na r4)', n, total; end if;
end $g$;

commit;
