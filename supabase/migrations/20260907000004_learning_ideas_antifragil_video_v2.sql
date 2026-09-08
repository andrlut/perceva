-- migration: 20260907000004_learning_ideas_antifragil_video_v2.sql
-- purpose: o vídeo EN da ideia 1 do Antifrágil (antifragil/video.en.mp4, 87 s,
--          registrado em 20260725000005 antes da prática de corte) ainda termina
--          no cartão branco do NotebookLM (2,1 s). Cortado com
--          tools/content-media/video.mjs (corte em 84,83 s por luma) e subido
--          como antifragil/video.en.v2.mp4 (84,7 s). O bucket não sobrescreve
--          (409), daí o .v2. Só o JSON de `ideas` muda; a row legada de
--          learning_material_media segue apontando pro arquivo antigo (a tela
--          legada não é mais usada por este material).
--
-- affected tables: learning_material (ideas -> terceiro-estado.video.en)
-- new rpcs:        none
-- breaking?        no
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar

begin;

update public.learning_material m
set ideas = (
  select jsonb_agg(
    case
      when i->>'id' = 'terceiro-estado' then
        jsonb_set(
          i,
          '{video,en}',
          jsonb_build_object(
            'path', 'antifragil/video.en.v2.mp4',
            'duration_seconds', 85,
            'poster', 'summary-antifragile/idea.1.en.poster.webp'
          ),
          true
        )
      else i
    end
    order by (i->>'ordinal')::int
  )
  from jsonb_array_elements(m.ideas) i
)
where m.slug = 'summary-antifragile';

-- Guarda: falha alto se o update não pegou a ideia certa (0 linhas passariam em silêncio).
do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'summary-antifragile'
      and i->>'id' = 'terceiro-estado'
      and i->'video'->'en'->>'path' = 'antifragil/video.en.v2.mp4'
  ) then
    raise exception 'summary-antifragile/terceiro-estado video.en não foi atualizado';
  end if;
end
$guard$;

commit;
