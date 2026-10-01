-- migration: 20260930000004_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-09-30 (.claude/agents/learning-notebook-runner.md,
--          tarefa agendada learning-notebook-runner-cron). Vídeo "Resumo em Vídeo" Curta
--          por ideia (ideia 2, PT), fonte restrita ao documento da ideia, foco "Cubra apenas
--          o que está nesta fonte". Cartão final cortado por tools/content-media/video.mjs.
--          Portão de fidelidade (§6b): grade de quadros + faixa de legendas comparadas com o
--          verso e o corpo da ideia; só entram os que passaram (2 de 10; os outros
--          ficaram needs_review no manifesto local). jsonb_set cirúrgico no lado do vídeo de
--          uma ideia, por id, com guarda pós-update.
--
--          vídeos (slug · ideia · lado · título no Estúdio · duração s):
--            glossary-learn · cerebro-cresce-e-desfaz · pt · "Por Que o Cérebro Encolhe Sem Prática" · 58
--            glossary-dexterity · dinapenia · pt · "Por que a força não evita quedas na velhice" · 64

begin;

-- glossary-learn · cerebro-cresce-e-desfaz · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'cerebro-cresce-e-desfaz' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-learn/idea.2.pt.mp4',
               'duration_seconds', 58,
               'poster', 'glossary-learn/idea.2.pt.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'glossary-learn';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'glossary-learn'
      and i->>'id' = 'cerebro-cresce-e-desfaz'
      and i->'video'->'pt'->>'path' = 'glossary-learn/idea.2.pt.mp4'
  ) then
    raise exception 'learning_notebook: glossary-learn/cerebro-cresce-e-desfaz video.pt was not updated';
  end if;
end
$guard$;

-- glossary-dexterity · dinapenia · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'dinapenia' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-dexterity/idea.2.pt.mp4',
               'duration_seconds', 64,
               'poster', 'glossary-dexterity/idea.2.pt.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'glossary-dexterity';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'glossary-dexterity'
      and i->>'id' = 'dinapenia'
      and i->'video'->'pt'->>'path' = 'glossary-dexterity/idea.2.pt.mp4'
  ) then
    raise exception 'learning_notebook: glossary-dexterity/dinapenia video.pt was not updated';
  end if;
end
$guard$;

commit;
