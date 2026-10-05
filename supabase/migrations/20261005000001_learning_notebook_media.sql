-- migration: 20261005000001_learning_notebook_media.sql
-- purpose: rodada do runner do Notebook de 2026-10-05 (tarefa agendada
--          learning-notebook-runner-cron, .claude/agents/learning-notebook-runner.md). 10 vídeos
--          Curta gerados: 3 segundas tomadas com foco dirigido (§6b item 5) + 7 primeiras tomadas
--          da ideia 2; mais 1 retomada da rodada anterior (hobbies 2 PT, aprovada e não migrada).
--          Passaram no portão de fidelidade (grade 1/8 fps lida às cegas pelo learning-card-tester
--          + faixa de legendas a 1 fps × verso e corpo da ideia) e entram aqui só os listados
--          abaixo; os demais ficaram em needs_review e não sobem. jsonb_set cirúrgico no lado do
--          vídeo de uma ideia, por id, com guarda.
--
--          vídeos (slug · ideia · lado · título no Estúdio · duração s):
--            hobbies-depression-older-adults · hobby-uma-vez-por-semana · pt · "O Poder do Hobby Semanal" · 72
--            summary-antifragile · via-negativa · pt · "Como Melhorar Pela Via Negativa" · 61
--            summary-why-we-sleep · sete-ou-mais · pt · "O Mito das 8 Horas de Sono" · 72

begin;

-- hobbies-depression-older-adults · hobby-uma-vez-por-semana · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'hobby-uma-vez-por-semana' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'hobbies-depression-older-adults/idea.2.pt.mp4',
               'duration_seconds', 72,
               'poster', 'hobbies-depression-older-adults/idea.2.pt.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'hobbies-depression-older-adults';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'hobbies-depression-older-adults'
      and i->>'id' = 'hobby-uma-vez-por-semana'
      and i->'video'->'pt'->>'path' = 'hobbies-depression-older-adults/idea.2.pt.mp4'
  ) then
    raise exception 'learning_notebook: hobbies-depression-older-adults/hobby-uma-vez-por-semana video.pt was not updated';
  end if;
end
$guard$;

-- summary-antifragile · via-negativa · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'via-negativa' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'summary-antifragile/idea.2.pt.mp4',
               'duration_seconds', 61,
               'poster', 'summary-antifragile/idea.2.pt.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'summary-antifragile';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'summary-antifragile'
      and i->>'id' = 'via-negativa'
      and i->'video'->'pt'->>'path' = 'summary-antifragile/idea.2.pt.mp4'
  ) then
    raise exception 'learning_notebook: summary-antifragile/via-negativa video.pt was not updated';
  end if;
end
$guard$;

-- summary-why-we-sleep · sete-ou-mais · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'sete-ou-mais' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'summary-why-we-sleep/idea.2.pt.mp4',
               'duration_seconds', 72,
               'poster', 'summary-why-we-sleep/idea.2.pt.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'summary-why-we-sleep';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'summary-why-we-sleep'
      and i->>'id' = 'sete-ou-mais'
      and i->'video'->'pt'->>'path' = 'summary-why-we-sleep/idea.2.pt.mp4'
  ) then
    raise exception 'learning_notebook: summary-why-we-sleep/sete-ou-mais video.pt was not updated';
  end if;
end
$guard$;

commit;
