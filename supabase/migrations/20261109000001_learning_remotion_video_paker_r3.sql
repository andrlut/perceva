-- migration: 20261109000001_learning_remotion_video_paker_r3.sql
-- purpose: troca os vídeos PT e EN das 3 ideias de paker-health-energia-pele-forca
--          (material patrocinado da Paker Health) pela r3 do molde em Remotion: a fase 3
--          (tools/video/MOLDE.md "## Fase 3"), em que a tela DEMONSTRA o que a voz diz:
--          ela anda, corre, salta, mexe e bebe; lugares variados (academia, cozinha,
--          banheiro, parque); corpo de vidro, lupa na pele e o tanque de creatina que enche
--          a tela; palavras escritas na imagem; uma protagonista por ideia. MESMO texto
--          falado e mesma voz da r1/r2 (alegações de parceiro já aprovadas).
--          Aprovado pelo André em 09/11 depois de ver r2 × r3 lado a lado.
--          Roteiro: learning-drops/video-specs/paker-health-energia-pele-forca.json.
--
-- affected tables: learning_material (ideas — só o campo video de cada ideia)
-- new rpcs:        none
-- breaking?        no
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   texto, sponsor e capa do material ficam intocados (jsonb_set só em {video})
--   bucket (subido antes, cache imutável, conferido com curl: video/mp4 e image/webp):
--     paker-health-energia-pele-forca/idea.1.pt.r3.mp4 (+ .poster.webp)   47 s, 3,1 MB
--     paker-health-energia-pele-forca/idea.1.en.r3.mp4 (+ .poster.webp)   48 s, 3,1 MB
--     paker-health-energia-pele-forca/idea.2.pt.r3.mp4 (+ .poster.webp)   44 s, 2,9 MB
--     paker-health-energia-pele-forca/idea.2.en.r3.mp4 (+ .poster.webp)   43 s, 2,8 MB
--     paker-health-energia-pele-forca/idea.3.pt.r3.mp4 (+ .poster.webp)   46 s, 4,0 MB
--     paker-health-energia-pele-forca/idea.3.en.r3.mp4 (+ .poster.webp)   44 s, 3,8 MB
--   a r1 e a r2 (20261105000002, 20261108000001) ficam no bucket, sem referência.

begin;

with v(id, video) as (
  values
    ('pre-treino-energia', jsonb_build_object(
      'pt', jsonb_build_object('path', 'paker-health-energia-pele-forca/idea.1.pt.r3.mp4', 'duration_seconds', 47,
                               'poster', 'paker-health-energia-pele-forca/idea.1.pt.r3.poster.webp', 'producer', 'remotion'),
      'en', jsonb_build_object('path', 'paker-health-energia-pele-forca/idea.1.en.r3.mp4', 'duration_seconds', 48,
                               'poster', 'paker-health-energia-pele-forca/idea.1.en.r3.poster.webp', 'producer', 'remotion'))),
    ('colageno-constancia', jsonb_build_object(
      'pt', jsonb_build_object('path', 'paker-health-energia-pele-forca/idea.2.pt.r3.mp4', 'duration_seconds', 44,
                               'poster', 'paker-health-energia-pele-forca/idea.2.pt.r3.poster.webp', 'producer', 'remotion'),
      'en', jsonb_build_object('path', 'paker-health-energia-pele-forca/idea.2.en.r3.mp4', 'duration_seconds', 43,
                               'poster', 'paker-health-energia-pele-forca/idea.2.en.r3.poster.webp', 'producer', 'remotion'))),
    ('creatina-alem-da-musculacao', jsonb_build_object(
      'pt', jsonb_build_object('path', 'paker-health-energia-pele-forca/idea.3.pt.r3.mp4', 'duration_seconds', 46,
                               'poster', 'paker-health-energia-pele-forca/idea.3.pt.r3.poster.webp', 'producer', 'remotion'),
      'en', jsonb_build_object('path', 'paker-health-energia-pele-forca/idea.3.en.r3.mp4', 'duration_seconds', 44,
                               'poster', 'paker-health-energia-pele-forca/idea.3.en.r3.poster.webp', 'producer', 'remotion')))
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
  select count(*) filter (where i->'video'->'pt'->>'path' like 'paker-health-energia-pele-forca/idea._.pt.r3.mp4'
                            and i->'video'->'en'->>'path' like 'paker-health-energia-pele-forca/idea._.en.r3.mp4'),
         count(*)
    into n, total
  from public.learning_material m, jsonb_array_elements(m.ideas) i
  where m.slug = 'paker-health-energia-pele-forca';
  if n <> 3 or total <> 3 then raise exception 'remotion video paker r3: guarda falhou (% de % ideias na r3)', n, total; end if;
end $g$;

commit;
