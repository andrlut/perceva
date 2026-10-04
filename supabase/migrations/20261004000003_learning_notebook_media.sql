-- migration: 20261004000003_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-10-04 (tarefa agendada learning-notebook-runner-cron,
--          .claude/agents/learning-notebook-runner.md). 10 vídeos Curta: 3 de
--          hobbies-depression-older-adults (material novo, foco genérico) + 7 terceiras tomadas
--          com foco dirigido (§6b item 5). Passaram no portão de fidelidade (grade 1/8 fps lida às
--          cegas pelo learning-card-tester + faixa de legendas a 1 fps × verso e corpo da ideia)
--          e entram aqui só os listados abaixo; os demais ficaram em needs_review e não sobem.
--          jsonb_set cirúrgico no lado do vídeo de uma ideia, por id, com guarda pós-update.
--
--          vídeos (slug · ideia · lado · título no Estúdio · duração s):
--            cbt-i-vs-sleep-hygiene · menos-tempo-na-cama · pt · "Como Ficar Menos Tempo na Cama Reduz a Insônia" · 66
--            attention-residue · terminar-nao-e-fechar · pt · "Como o Plano de Retomada Libera Sua Atenção" · 71
--            weak-ties-job-search · laco-adormecido · pt · "Como Reativar Seus Contatos Profissionais" · 77
--            catch-up-sleep-weekend · tres-fusos · pt · "Como o jet lag social atrasa seu relógio" · 70 (.v2: o caminho sem sufixo é o teste de 2026-09-10)

begin;

-- cbt-i-vs-sleep-hygiene · menos-tempo-na-cama · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'menos-tempo-na-cama' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'cbt-i-vs-sleep-hygiene/idea.2.pt.mp4',
               'duration_seconds', 66,
               'poster', 'cbt-i-vs-sleep-hygiene/idea.2.pt.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'cbt-i-vs-sleep-hygiene';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'cbt-i-vs-sleep-hygiene'
      and i->>'id' = 'menos-tempo-na-cama'
      and i->'video'->'pt'->>'path' = 'cbt-i-vs-sleep-hygiene/idea.2.pt.mp4'
  ) then
    raise exception 'learning_notebook: cbt-i-vs-sleep-hygiene/menos-tempo-na-cama video.pt was not updated';
  end if;
end
$guard$;

-- attention-residue · terminar-nao-e-fechar · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'terminar-nao-e-fechar' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'attention-residue/idea.2.pt.mp4',
               'duration_seconds', 71,
               'poster', 'attention-residue/idea.2.pt.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'attention-residue';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'attention-residue'
      and i->>'id' = 'terminar-nao-e-fechar'
      and i->'video'->'pt'->>'path' = 'attention-residue/idea.2.pt.mp4'
  ) then
    raise exception 'learning_notebook: attention-residue/terminar-nao-e-fechar video.pt was not updated';
  end if;
end
$guard$;

-- weak-ties-job-search · laco-adormecido · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'laco-adormecido' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'weak-ties-job-search/idea.2.pt.mp4',
               'duration_seconds', 77,
               'poster', 'weak-ties-job-search/idea.2.pt.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'weak-ties-job-search';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'weak-ties-job-search'
      and i->>'id' = 'laco-adormecido'
      and i->'video'->'pt'->>'path' = 'weak-ties-job-search/idea.2.pt.mp4'
  ) then
    raise exception 'learning_notebook: weak-ties-job-search/laco-adormecido video.pt was not updated';
  end if;
end
$guard$;

-- catch-up-sleep-weekend · tres-fusos · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'tres-fusos' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'catch-up-sleep-weekend/idea.2.pt.v2.mp4',
               'duration_seconds', 70,
               'poster', 'catch-up-sleep-weekend/idea.2.pt.v2.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'catch-up-sleep-weekend';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'catch-up-sleep-weekend'
      and i->>'id' = 'tres-fusos'
      and i->'video'->'pt'->>'path' = 'catch-up-sleep-weekend/idea.2.pt.v2.mp4'
  ) then
    raise exception 'learning_notebook: catch-up-sleep-weekend/tres-fusos video.pt was not updated';
  end if;
end
$guard$;

commit;
