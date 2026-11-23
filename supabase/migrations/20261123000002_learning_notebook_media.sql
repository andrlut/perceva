-- migration: 20261123000002_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-11-23, segunda parte: deep dive PT de creative-activity-next-day
--          ("Resumo em Áudio" Análise detalhada / Padrão, fonte restrita ao texto PT; re-encode AAC 64k
--          mono +faststart). Arquivo separado porque 20261123000001 já tinha sido aplicada quando a
--          extensão do Chrome reconectou e este áudio terminou.
--
-- affected tables: public.learning_material_media (1 linha de áudio)
-- new rpcs:        none
-- breaking?        no
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   objeto no bucket learning-media com cache imutável, conferido antes desta migration

begin;

insert into public.learning_material_media
  (material_id, kind, locale, path, duration_seconds, source, meta)
select m.id, 'audio', v.locale, v.path, v.duration_seconds, 'notebooklm',
       jsonb_build_object('title', v.title)
from (values
  ('creative-activity-next-day', 'pt', 'creative-activity-next-day/audio.pt.m4a', 1468, 'Criar algo hoje gera energia amanhã')
) as v(slug, locale, path, duration_seconds, title)
join public.learning_material m on m.slug = v.slug
on conflict (material_id, kind, locale) do update set
  path             = excluded.path,
  duration_seconds = excluded.duration_seconds,
  source           = excluded.source,
  meta             = excluded.meta;

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material_media mm
    join public.learning_material m on m.id = mm.material_id
    where m.slug = 'creative-activity-next-day'
      and mm.kind = 'audio' and mm.locale = 'pt'
      and mm.path = 'creative-activity-next-day/audio.pt.m4a'
  ) then
    raise exception 'learning_notebook: creative-activity-next-day audio.pt was not registered';
  end if;
end
$guard$;

commit;
