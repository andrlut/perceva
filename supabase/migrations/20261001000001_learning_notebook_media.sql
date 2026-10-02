-- migration: 20261001000001_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-10-01 (.claude/agents/learning-notebook-runner.md,
--          execução manual). Vídeo "Resumo em Vídeo" Curta por ideia, fonte restrita ao
--          documento da ideia, foco "Cubra apenas o que está nesta fonte". Cartão final
--          cortado por tools/content-media/video.mjs. Portão de fidelidade (§6b): grade de
--          quadros + faixa de legendas a 1 fps comparadas com o verso e o corpo da ideia;
--          só entra o que passou (1 de 10; os outros ficaram needs_review no manifesto
--          local). jsonb_set cirúrgico no lado do vídeo de uma ideia, por id, com guarda
--          pós-update.
--
--          vídeos (slug · ideia · lado · título no Estúdio · duração s):
--            glossary-build · tres-condicoes · pt · "Por Que a Autonomia Gera Motivação" · 64

begin;

-- glossary-build · tres-condicoes · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'tres-condicoes' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-build/idea.2.pt.mp4',
               'duration_seconds', 64,
               'poster', 'glossary-build/idea.2.pt.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'glossary-build';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'glossary-build'
      and i->>'id' = 'tres-condicoes'
      and i->'video'->'pt'->>'path' = 'glossary-build/idea.2.pt.mp4'
  ) then
    raise exception 'learning_notebook: glossary-build/tres-condicoes video.pt was not updated';
  end if;
end
$guard$;

commit;
