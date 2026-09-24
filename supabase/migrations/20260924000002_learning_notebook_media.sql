-- migration: 20260924000002_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-09-24 (.claude/agents/learning-notebook-runner.md,
--          tarefa agendada learning-notebook-runner-cron). Vídeo "Resumo em Vídeo" Curta
--          por ideia, fonte restrita ao documento da ideia (texto v2, colado nesta
--          rodada; conferido em "Ver comando e fontes"), foco "Cubra apenas o que está
--          nesta fonte". Cartão final cortado por tools/content-media/video.mjs.
--          Portão de fidelidade (§6b): grade de quadros + legendas lidas e comparadas
--          com o verso e o corpo da ideia; só entram os que passaram.
--          Caminhos .v2 onde o caminho base já existia no bucket (bucket nunca
--          sobrescreve). jsonb_set cirúrgico no lado do vídeo de uma ideia, por id,
--          com guarda pós-update.
--
--          vídeos (slug · ideia · lado · título no Estúdio · duração s):
--            glossary-play · sofa-um-pedaco · pt · "Por Que Ficar no Sofá Não Te Descansa" · 84
--            weak-ties-job-search · curva-u-invertido · pt · "Como Conhecidos Distantes Garantem Seu Próximo Emprego" · 89
--            glossary-romance · comemorar-a-vitoria · pt · "Como a resposta ativa-construtiva fortalece casais" · 78
--            non-instrumental-play · premio-mata-o-prazer · pt · "Como as Métricas Matam o Seu Hobby" · 69
--            summary-why-we-sleep · epidemia-inexistente · pt · "Os erros do best-seller Por Que Nós Dormimos" · 70
--            glossary-strength · zona-2-mitocondria · pt · "Como o Treino em Zona 2 Muda Suas Células" · 79
--            job-crafting-additive · somar-em-vez-de-cortar · pt · "Por que cortar tarefas chatas piora o trabalho" · 55

begin;

-- glossary-play · sofa-um-pedaco · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'sofa-um-pedaco' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-play/idea.1.pt.v2.mp4',
               'duration_seconds', 84,
               'poster', 'glossary-play/idea.1.pt.v2.poster.webp')),
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
      and i->>'id' = 'sofa-um-pedaco'
      and i->'video'->'pt'->>'path' = 'glossary-play/idea.1.pt.v2.mp4'
  ) then
    raise exception 'learning_notebook: glossary-play/sofa-um-pedaco video.pt was not updated';
  end if;
end
$guard$;

-- weak-ties-job-search · curva-u-invertido · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'curva-u-invertido' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'weak-ties-job-search/idea.1.pt.mp4',
               'duration_seconds', 89,
               'poster', 'weak-ties-job-search/idea.1.pt.v2.poster.webp')),
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
      and i->>'id' = 'curva-u-invertido'
      and i->'video'->'pt'->>'path' = 'weak-ties-job-search/idea.1.pt.mp4'
  ) then
    raise exception 'learning_notebook: weak-ties-job-search/curva-u-invertido video.pt was not updated';
  end if;
end
$guard$;

-- glossary-romance · comemorar-a-vitoria · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'comemorar-a-vitoria' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-romance/idea.1.pt.v2.mp4',
               'duration_seconds', 78,
               'poster', 'glossary-romance/idea.1.pt.v2.poster.webp')),
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
      and i->>'id' = 'comemorar-a-vitoria'
      and i->'video'->'pt'->>'path' = 'glossary-romance/idea.1.pt.v2.mp4'
  ) then
    raise exception 'learning_notebook: glossary-romance/comemorar-a-vitoria video.pt was not updated';
  end if;
end
$guard$;

-- non-instrumental-play · premio-mata-o-prazer · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'premio-mata-o-prazer' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'non-instrumental-play/idea.1.pt.v2.mp4',
               'duration_seconds', 69,
               'poster', 'non-instrumental-play/idea.1.pt.v2.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'non-instrumental-play';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'non-instrumental-play'
      and i->>'id' = 'premio-mata-o-prazer'
      and i->'video'->'pt'->>'path' = 'non-instrumental-play/idea.1.pt.v2.mp4'
  ) then
    raise exception 'learning_notebook: non-instrumental-play/premio-mata-o-prazer video.pt was not updated';
  end if;
end
$guard$;

-- summary-why-we-sleep · epidemia-inexistente · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'epidemia-inexistente' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'summary-why-we-sleep/idea.1.pt.v2.mp4',
               'duration_seconds', 70,
               'poster', 'summary-why-we-sleep/idea.1.pt.v2.poster.webp')),
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
      and i->>'id' = 'epidemia-inexistente'
      and i->'video'->'pt'->>'path' = 'summary-why-we-sleep/idea.1.pt.v2.mp4'
  ) then
    raise exception 'learning_notebook: summary-why-we-sleep/epidemia-inexistente video.pt was not updated';
  end if;
end
$guard$;

-- glossary-strength · zona-2-mitocondria · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'zona-2-mitocondria' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-strength/idea.1.pt.v2.mp4',
               'duration_seconds', 79,
               'poster', 'glossary-strength/idea.1.pt.v2.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'glossary-strength';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'glossary-strength'
      and i->>'id' = 'zona-2-mitocondria'
      and i->'video'->'pt'->>'path' = 'glossary-strength/idea.1.pt.v2.mp4'
  ) then
    raise exception 'learning_notebook: glossary-strength/zona-2-mitocondria video.pt was not updated';
  end if;
end
$guard$;

-- job-crafting-additive · somar-em-vez-de-cortar · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'somar-em-vez-de-cortar' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'job-crafting-additive/idea.1.pt.mp4',
               'duration_seconds', 55,
               'poster', 'job-crafting-additive/idea.1.pt.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'job-crafting-additive';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'job-crafting-additive'
      and i->>'id' = 'somar-em-vez-de-cortar'
      and i->'video'->'pt'->>'path' = 'job-crafting-additive/idea.1.pt.mp4'
  ) then
    raise exception 'learning_notebook: job-crafting-additive/somar-em-vez-de-cortar video.pt was not updated';
  end if;
end
$guard$;

commit;
