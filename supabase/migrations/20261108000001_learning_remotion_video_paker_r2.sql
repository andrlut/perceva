-- migration: 20261108000001_learning_remotion_video_paker_r2.sql
-- purpose: troca os vídeos PT e EN das 3 ideias de paker-health-energia-pele-forca
--          (material patrocinado da Paker Health) pela r2 do molde em Remotion: o padrão
--          novo da #562 (rosto Hexa Limpo, requinte fases 1–2, lugares, câmera, passagens),
--          com o MESMO texto falado e a mesma voz da r1 (alegações de parceiro já aprovadas).
--          Passou pelo revisor de quadros PT/EN (cidade de manhã, um só momento feliz por
--          vídeo, verso sem palavra sozinha na linha).
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
--     paker-health-energia-pele-forca/idea.1.pt.r2.mp4 (+ .poster.webp)   46 s, 2,2 MB
--     paker-health-energia-pele-forca/idea.1.en.r2.mp4 (+ .poster.webp)   47 s, 2,2 MB
--     paker-health-energia-pele-forca/idea.2.pt.r2.mp4 (+ .poster.webp)   44 s, 2,1 MB
--     paker-health-energia-pele-forca/idea.2.en.r2.mp4 (+ .poster.webp)   42 s, 2,0 MB
--     paker-health-energia-pele-forca/idea.3.pt.r2.mp4 (+ .poster.webp)   45 s, 2,1 MB
--     paker-health-energia-pele-forca/idea.3.en.r2.mp4 (+ .poster.webp)   44 s, 1,9 MB
--   a r1 (20261105000002) fica no bucket, sem referência.

begin;

with v(id, video) as (
  values
    ('pre-treino-energia', jsonb_build_object(
      'pt', jsonb_build_object('path', 'paker-health-energia-pele-forca/idea.1.pt.r2.mp4', 'duration_seconds', 46,
                               'poster', 'paker-health-energia-pele-forca/idea.1.pt.r2.poster.webp', 'producer', 'remotion'),
      'en', jsonb_build_object('path', 'paker-health-energia-pele-forca/idea.1.en.r2.mp4', 'duration_seconds', 47,
                               'poster', 'paker-health-energia-pele-forca/idea.1.en.r2.poster.webp', 'producer', 'remotion'))),
    ('colageno-constancia', jsonb_build_object(
      'pt', jsonb_build_object('path', 'paker-health-energia-pele-forca/idea.2.pt.r2.mp4', 'duration_seconds', 44,
                               'poster', 'paker-health-energia-pele-forca/idea.2.pt.r2.poster.webp', 'producer', 'remotion'),
      'en', jsonb_build_object('path', 'paker-health-energia-pele-forca/idea.2.en.r2.mp4', 'duration_seconds', 42,
                               'poster', 'paker-health-energia-pele-forca/idea.2.en.r2.poster.webp', 'producer', 'remotion'))),
    ('creatina-alem-da-musculacao', jsonb_build_object(
      'pt', jsonb_build_object('path', 'paker-health-energia-pele-forca/idea.3.pt.r2.mp4', 'duration_seconds', 45,
                               'poster', 'paker-health-energia-pele-forca/idea.3.pt.r2.poster.webp', 'producer', 'remotion'),
      'en', jsonb_build_object('path', 'paker-health-energia-pele-forca/idea.3.en.r2.mp4', 'duration_seconds', 44,
                               'poster', 'paker-health-energia-pele-forca/idea.3.en.r2.poster.webp', 'producer', 'remotion')))
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
  select count(*) filter (where i->'video'->'pt'->>'path' like 'paker-health-energia-pele-forca/idea._.pt.r2.mp4'
                            and i->'video'->'en'->>'path' like 'paker-health-energia-pele-forca/idea._.en.r2.mp4'),
         count(*)
    into n, total
  from public.learning_material m, jsonb_array_elements(m.ideas) i
  where m.slug = 'paker-health-energia-pele-forca';
  if n <> 3 or total <> 3 then raise exception 'remotion video paker r2: guarda falhou (% de % ideias na r2)', n, total; end if;
end $g$;

commit;
