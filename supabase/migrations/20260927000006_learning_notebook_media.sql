-- migration: 20260927000006_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-09-27 (.claude/agents/learning-notebook-runner.md,
--          tarefa agendada learning-notebook-runner-cron). Vídeo "Resumo em Vídeo" Curta
--          por ideia, fonte restrita ao documento da ideia (conferido em "Ver comando e
--          fontes"), foco "Cubra apenas o que está nesta fonte". Cartão final cortado por
--          tools/content-media/video.mjs. Portão de fidelidade (§6b): grade de quadros +
--          legendas comparadas com o verso e o corpo da ideia; só entram os que passaram
--          (5 de 10; os outros 5 ficaram needs_review no manifesto local).
--          Caminho .v2 onde o caminho base já existia no bucket (bucket nunca
--          sobrescreve). jsonb_set cirúrgico no lado do vídeo de uma ideia, por id,
--          com guarda pós-update.
--
--          vídeos (slug · ideia · lado · título no Estúdio · duração s):
--            glossary-play · sofa-um-pedaco · en · "Why Your Couch Doesn't Actually Rest You" · 56
--            news-loneliness-memory-2026-04 · nivel-nao-velocidade · en · "How Loneliness Actually Affects Memory" · 72
--            job-crafting-additive · faca-o-mapa-voce-mesmo · pt · "Como Redesenhar Seu Trabalho na Prática" · 69
--            stretching-ten-minutes-week · dez-minutos-por-semana · pt · "O Limite Invisível da Sua Flexibilidade" · 61
--            stretching-ten-minutes-week · dez-minutos-por-semana · en · "How Much Stretching Actually Works" · 55

begin;

-- glossary-play · sofa-um-pedaco · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'sofa-um-pedaco' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-play/idea.1.en.v2.mp4',
               'duration_seconds', 56,
               'poster', 'glossary-play/idea.1.en.v2.poster.webp')),
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
      and i->'video'->'en'->>'path' = 'glossary-play/idea.1.en.v2.mp4'
  ) then
    raise exception 'learning_notebook: glossary-play/sofa-um-pedaco video.en was not updated';
  end if;
end
$guard$;

-- news-loneliness-memory-2026-04 · nivel-nao-velocidade · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'nivel-nao-velocidade' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'news-loneliness-memory-2026-04/idea.1.en.mp4',
               'duration_seconds', 72,
               'poster', 'news-loneliness-memory-2026-04/idea.1.en.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'news-loneliness-memory-2026-04';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'news-loneliness-memory-2026-04'
      and i->>'id' = 'nivel-nao-velocidade'
      and i->'video'->'en'->>'path' = 'news-loneliness-memory-2026-04/idea.1.en.mp4'
  ) then
    raise exception 'learning_notebook: news-loneliness-memory-2026-04/nivel-nao-velocidade video.en was not updated';
  end if;
end
$guard$;

-- job-crafting-additive · faca-o-mapa-voce-mesmo · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'faca-o-mapa-voce-mesmo' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'job-crafting-additive/idea.2.pt.mp4',
               'duration_seconds', 69,
               'poster', 'job-crafting-additive/idea.2.pt.poster.webp')),
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
      and i->>'id' = 'faca-o-mapa-voce-mesmo'
      and i->'video'->'pt'->>'path' = 'job-crafting-additive/idea.2.pt.mp4'
  ) then
    raise exception 'learning_notebook: job-crafting-additive/faca-o-mapa-voce-mesmo video.pt was not updated';
  end if;
end
$guard$;

-- stretching-ten-minutes-week · dez-minutos-por-semana · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'dez-minutos-por-semana' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'stretching-ten-minutes-week/idea.1.pt.mp4',
               'duration_seconds', 61,
               'poster', 'stretching-ten-minutes-week/idea.1.pt.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'stretching-ten-minutes-week';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'stretching-ten-minutes-week'
      and i->>'id' = 'dez-minutos-por-semana'
      and i->'video'->'pt'->>'path' = 'stretching-ten-minutes-week/idea.1.pt.mp4'
  ) then
    raise exception 'learning_notebook: stretching-ten-minutes-week/dez-minutos-por-semana video.pt was not updated';
  end if;
end
$guard$;

-- stretching-ten-minutes-week · dez-minutos-por-semana · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'dez-minutos-por-semana' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'stretching-ten-minutes-week/idea.1.en.mp4',
               'duration_seconds', 55,
               'poster', 'stretching-ten-minutes-week/idea.1.en.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'stretching-ten-minutes-week';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'stretching-ten-minutes-week'
      and i->>'id' = 'dez-minutos-por-semana'
      and i->'video'->'en'->>'path' = 'stretching-ten-minutes-week/idea.1.en.mp4'
      and i->'video'->'pt'->>'path' = 'stretching-ten-minutes-week/idea.1.pt.mp4'
  ) then
    raise exception 'learning_notebook: stretching-ten-minutes-week/dez-minutos-por-semana video.en was not updated';
  end if;
end
$guard$;

commit;
