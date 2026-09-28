-- migration: 20260928000001_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-09-28 (.claude/agents/learning-notebook-runner.md,
--          tarefa agendada learning-notebook-runner-cron). Vídeo "Resumo em Vídeo" Curta
--          por ideia (ideia 2, PT), fonte restrita ao documento da ideia, foco "Cubra apenas
--          o que está nesta fonte". Cartão final cortado por tools/content-media/video.mjs.
--          Portão de fidelidade (§6b): grade de quadros + faixa de legendas comparadas com o
--          verso e o corpo da ideia; só entram os que passaram (5 de 10; os outros
--          ficaram needs_review no manifesto local). jsonb_set cirúrgico no lado do vídeo de
--          uma ideia, por id, com guarda pós-update.
--
--          vídeos (slug · ideia · lado · título no Estúdio · duração s):
--            stretching-ten-minutes-week · tolerancia-ao-alongamento · pt · "Por Que o Alongamento Funciona" · 61
--            bids-for-connection · numero-do-divorcio-sem-fonte · pt · "Por Que Ignorar o Parceiro Não Prevê Divórcio" · 71
--            ikea-effect · preco-em-vez-de-opiniao · pt · "Por Que Você Não Deve Pedir Opiniões" · 62
--            grip-strength-longevity · dose-minima-de-forca · pt · "Por que o Aperto de Mão Mede a Sua Saúde" · 72
--            ten-second-balance-test · diferenca-entre-as-pernas · pt · "Por Que Ficar Num Pé Só Não Treina o Equilíbrio" · 67

begin;

-- stretching-ten-minutes-week · tolerancia-ao-alongamento · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'tolerancia-ao-alongamento' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'stretching-ten-minutes-week/idea.2.pt.mp4',
               'duration_seconds', 61,
               'poster', 'stretching-ten-minutes-week/idea.2.pt.poster.webp')),
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
      and i->>'id' = 'tolerancia-ao-alongamento'
      and i->'video'->'pt'->>'path' = 'stretching-ten-minutes-week/idea.2.pt.mp4'
  ) then
    raise exception 'learning_notebook: stretching-ten-minutes-week/tolerancia-ao-alongamento video.pt was not updated';
  end if;
end
$guard$;

-- bids-for-connection · numero-do-divorcio-sem-fonte · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'numero-do-divorcio-sem-fonte' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'bids-for-connection/idea.2.pt.mp4',
               'duration_seconds', 71,
               'poster', 'bids-for-connection/idea.2.pt.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'bids-for-connection';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'bids-for-connection'
      and i->>'id' = 'numero-do-divorcio-sem-fonte'
      and i->'video'->'pt'->>'path' = 'bids-for-connection/idea.2.pt.mp4'
  ) then
    raise exception 'learning_notebook: bids-for-connection/numero-do-divorcio-sem-fonte video.pt was not updated';
  end if;
end
$guard$;

-- ikea-effect · preco-em-vez-de-opiniao · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'preco-em-vez-de-opiniao' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'ikea-effect/idea.2.pt.mp4',
               'duration_seconds', 62,
               'poster', 'ikea-effect/idea.2.pt.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'ikea-effect';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'ikea-effect'
      and i->>'id' = 'preco-em-vez-de-opiniao'
      and i->'video'->'pt'->>'path' = 'ikea-effect/idea.2.pt.mp4'
  ) then
    raise exception 'learning_notebook: ikea-effect/preco-em-vez-de-opiniao video.pt was not updated';
  end if;
end
$guard$;

-- grip-strength-longevity · dose-minima-de-forca · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'dose-minima-de-forca' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'grip-strength-longevity/idea.2.pt.mp4',
               'duration_seconds', 72,
               'poster', 'grip-strength-longevity/idea.2.pt.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'grip-strength-longevity';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'grip-strength-longevity'
      and i->>'id' = 'dose-minima-de-forca'
      and i->'video'->'pt'->>'path' = 'grip-strength-longevity/idea.2.pt.mp4'
  ) then
    raise exception 'learning_notebook: grip-strength-longevity/dose-minima-de-forca video.pt was not updated';
  end if;
end
$guard$;

-- ten-second-balance-test · diferenca-entre-as-pernas · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'diferenca-entre-as-pernas' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'ten-second-balance-test/idea.2.pt.mp4',
               'duration_seconds', 67,
               'poster', 'ten-second-balance-test/idea.2.pt.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'ten-second-balance-test';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'ten-second-balance-test'
      and i->>'id' = 'diferenca-entre-as-pernas'
      and i->'video'->'pt'->>'path' = 'ten-second-balance-test/idea.2.pt.mp4'
  ) then
    raise exception 'learning_notebook: ten-second-balance-test/diferenca-entre-as-pernas video.pt was not updated';
  end if;
end
$guard$;

commit;
