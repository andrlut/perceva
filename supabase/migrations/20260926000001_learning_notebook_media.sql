-- migration: 20260926000001_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-09-26 (.claude/agents/learning-notebook-runner.md,
--          tarefa agendada learning-notebook-runner-cron). Vídeo "Resumo em Vídeo" Curta
--          por ideia, fonte restrita ao documento da ideia (texto atual, colado nesta
--          rodada; conferido em "Ver comando e fontes"), foco "Cubra apenas o que está
--          nesta fonte". Cartão final cortado por tools/content-media/video.mjs.
--          Portão de fidelidade (§6b): grade de quadros + legendas lidas e comparadas
--          com o verso e o corpo da ideia; só entram os que passaram (5 de 10;
--          os outros 5 ficaram needs_review no manifesto local).
--          Caminhos .v2 onde o caminho base já existia no bucket (bucket nunca
--          sobrescreve). jsonb_set cirúrgico no lado do vídeo de uma ideia, por id,
--          com guarda pós-update.
--
--          vídeos (slug · ideia · lado · título no Estúdio · duração s):
--            weak-ties-job-search · curva-u-invertido · en · "Why Acquaintances Get You Hired" · 74
--            glossary-romance · comemorar-a-vitoria · en · "How Active-Constructive Responses Build Intimacy" · 62
--            attachment-styles-love · dois-numeros-nao-rotulo · en · "Why Your Attachment Style Isn't Fixed" · 70
--            summary-why-we-sleep · epidemia-inexistente · en · "The Fake WHO Sleep Epidemic" · 61
--            glossary-sleep · tres-pecas-do-sono · en · "Why Sleep Regularity Beats Extra Hours" · 68

begin;

-- weak-ties-job-search · curva-u-invertido · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'curva-u-invertido' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'weak-ties-job-search/idea.1.en.v2.mp4',
               'duration_seconds', 74,
               'poster', 'weak-ties-job-search/idea.1.en.v2.poster.webp')),
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
      and i->'video'->'en'->>'path' = 'weak-ties-job-search/idea.1.en.v2.mp4'
  ) then
    raise exception 'learning_notebook: weak-ties-job-search/curva-u-invertido video.en was not updated';
  end if;
end
$guard$;

-- glossary-romance · comemorar-a-vitoria · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'comemorar-a-vitoria' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-romance/idea.1.en.v2.mp4',
               'duration_seconds', 62,
               'poster', 'glossary-romance/idea.1.en.v2.poster.webp')),
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
      and i->'video'->'en'->>'path' = 'glossary-romance/idea.1.en.v2.mp4'
  ) then
    raise exception 'learning_notebook: glossary-romance/comemorar-a-vitoria video.en was not updated';
  end if;
end
$guard$;

-- attachment-styles-love · dois-numeros-nao-rotulo · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'dois-numeros-nao-rotulo' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'attachment-styles-love/idea.1.en.mp4',
               'duration_seconds', 70,
               'poster', 'attachment-styles-love/idea.1.en.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'attachment-styles-love';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'attachment-styles-love'
      and i->>'id' = 'dois-numeros-nao-rotulo'
      and i->'video'->'en'->>'path' = 'attachment-styles-love/idea.1.en.mp4'
  ) then
    raise exception 'learning_notebook: attachment-styles-love/dois-numeros-nao-rotulo video.en was not updated';
  end if;
end
$guard$;

-- summary-why-we-sleep · epidemia-inexistente · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'epidemia-inexistente' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'summary-why-we-sleep/idea.1.en.mp4',
               'duration_seconds', 61,
               'poster', 'summary-why-we-sleep/idea.1.en.poster.webp')),
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
      and i->'video'->'en'->>'path' = 'summary-why-we-sleep/idea.1.en.mp4'
  ) then
    raise exception 'learning_notebook: summary-why-we-sleep/epidemia-inexistente video.en was not updated';
  end if;
end
$guard$;

-- glossary-sleep · tres-pecas-do-sono · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'tres-pecas-do-sono' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-sleep/idea.1.en.mp4',
               'duration_seconds', 68,
               'poster', 'glossary-sleep/idea.1.en.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'glossary-sleep';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'glossary-sleep'
      and i->>'id' = 'tres-pecas-do-sono'
      and i->'video'->'en'->>'path' = 'glossary-sleep/idea.1.en.mp4'
  ) then
    raise exception 'learning_notebook: glossary-sleep/tres-pecas-do-sono video.en was not updated';
  end if;
end
$guard$;

commit;
