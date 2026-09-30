-- migration: 20260930000003_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-09-29 (.claude/agents/learning-notebook-runner.md,
--          tarefa agendada learning-notebook-runner-cron). Vídeo "Resumo em Vídeo" Curta
--          por ideia (ideia 2, PT), fonte restrita ao documento da ideia, foco "Cubra apenas
--          o que está nesta fonte". Cartão final cortado por tools/content-media/video.mjs.
--          Portão de fidelidade (§6b): grade de quadros + faixa de legendas comparadas com o
--          verso e o corpo da ideia; só entram os que passaram (2 de 10; os outros
--          ficaram needs_review no manifesto local). jsonb_set cirúrgico no lado do vídeo de
--          uma ideia, por id, com guarda pós-update.
--
--          vídeos (slug · ideia · lado · título no Estúdio · duração s):
--            glossary-romance · coisa-nova-junto · pt · "Como a Autoexpansão Protege o Relacionamento" · 69
--            glossary-play · ferias-somem · pt · "Por que o alívio das férias some tão rápido" · 61

begin;

-- glossary-romance · coisa-nova-junto · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'coisa-nova-junto' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-romance/idea.2.pt.mp4',
               'duration_seconds', 69,
               'poster', 'glossary-romance/idea.2.pt.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'glossary-romance';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'glossary-romance'
      and i->>'id' = 'coisa-nova-junto'
      and i->'video'->'pt'->>'path' = 'glossary-romance/idea.2.pt.mp4'
  ) then
    raise exception 'learning_notebook: glossary-romance/coisa-nova-junto video.pt was not updated';
  end if;
end
$guard$;

-- glossary-play · ferias-somem · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'ferias-somem' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-play/idea.2.pt.mp4',
               'duration_seconds', 61,
               'poster', 'glossary-play/idea.2.pt.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'glossary-play';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'glossary-play'
      and i->>'id' = 'ferias-somem'
      and i->'video'->'pt'->>'path' = 'glossary-play/idea.2.pt.mp4'
  ) then
    raise exception 'learning_notebook: glossary-play/ferias-somem video.pt was not updated';
  end if;
end
$guard$;

commit;
