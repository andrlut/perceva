-- migration: 20260910000005_learning_notebook_media.sql
-- purpose: primeira execução autônoma do runner do Notebook
--          (.claude/agents/learning-notebook-runner.md) — 8 gerações no Gemini
--          Notebook, uma fila recalculada do banco, um notebook por material.
--          Vídeos "Resumo em Vídeo" Curta com a fonte restrita ao documento
--          daquela ideia + foco "Cubra apenas o que está nesta fonte"; deep
--          dives "Análise detalhada" Padrão com a fonte restrita ao texto
--          inteiro no idioma certo. Cartão final cortado e pôster extraído por
--          tools/content-media/video.mjs; áudio re-encodado AAC 64k mono.
--          Cada vídeo foi conferido quadro a quadro (1 a cada 8 s) e fica
--          dentro da própria ideia — nenhum vazou pras ideias vizinhas.
--
--          vídeos (ideia · idioma · título no Estúdio · duração · corte):
--            friendship-hours   · 1 relogio-da-amizade · PT
--              "Quantas Horas Leva Uma Amizade" 1:07, corte 64,17 s → 64 s
--            friendship-hours   · 1 relogio-da-amizade · EN
--              "The Math Behind Making New Friends" 1:03, corte 60,43 s → 60 s
--            glossary-play      · 1 sofa-um-pedaco · PT
--              "Por Que o Sofá Não Te Descansa" 1:33, corte 90,73 s → 91 s
--            glossary-play      · 1 sofa-um-pedaco · EN
--              "Why Demanding Hobbies Deliver Better Rest" 1:10, corte 67,87 s → 68 s
--            summary-antifragile · 1 terceiro-estado · PT
--              "Como a Antifragilidade Fortalece o Corpo" 1:18, corte 75,3 s → 75 s
--            friendship-hours   · 2 hora-de-trabalho-nao-conta · PT
--              "Por Que Colegas de Trabalho Não Viram Amigos" 1:24, corte 81,17 s → 81 s
--          deep dives (Padrão):
--            friendship-hours · PT "A matemática por trás do bora marcar" 31:19
--            friendship-hours · EN "Why Friendships Cost 200 Hours" 21:33
--
-- affected tables: learning_material (ideas -> video.<lang> de 5 ideias),
--                  learning_material_media (2 linhas kind='audio')
-- new rpcs:        none
-- breaking?        no
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   o merge de `video` usa coalesce(nullif(...)) || jsonb_build_object(...):
--   preserva o outro idioma (summary-antifragile ideia 1 já tem video.en) e
--   sobrevive a um `video` ausente ou JSON null
--   objetos no bucket learning-media (subidos antes, cache imutável, 200 OK):
--     friendship-hours/idea.1.pt.mp4 + .poster.webp
--     friendship-hours/idea.1.en.mp4 + .poster.webp
--     friendship-hours/idea.2.pt.mp4 + .poster.webp
--     friendship-hours/audio.pt.m4a, friendship-hours/audio.en.m4a
--     glossary-play/idea.1.pt.mp4 + .poster.webp
--     glossary-play/idea.1.en.mp4 + .poster.webp
--     summary-antifragile/idea.1.pt.mp4 + .poster.webp

begin;

-- friendship-hours · relogio-da-amizade (ideia 1) · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'relogio-da-amizade' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'friendship-hours/idea.1.pt.mp4',
               'duration_seconds', 64,
               'poster', 'friendship-hours/idea.1.pt.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'friendship-hours';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'friendship-hours'
      and i->>'id' = 'relogio-da-amizade'
      and i->'video'->'pt'->>'path' = 'friendship-hours/idea.1.pt.mp4'
  ) then
    raise exception 'learning_notebook: friendship-hours/relogio-da-amizade video.pt was not updated';
  end if;
end
$guard$;

-- friendship-hours · relogio-da-amizade (ideia 1) · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'relogio-da-amizade' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'friendship-hours/idea.1.en.mp4',
               'duration_seconds', 60,
               'poster', 'friendship-hours/idea.1.en.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'friendship-hours';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'friendship-hours'
      and i->>'id' = 'relogio-da-amizade'
      and i->'video'->'en'->>'path' = 'friendship-hours/idea.1.en.mp4'
      and i->'video'->'pt'->>'path' = 'friendship-hours/idea.1.pt.mp4'
  ) then
    raise exception 'learning_notebook: friendship-hours/relogio-da-amizade video.en was not updated';
  end if;
end
$guard$;

-- friendship-hours · hora-de-trabalho-nao-conta (ideia 2) · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'hora-de-trabalho-nao-conta' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'friendship-hours/idea.2.pt.mp4',
               'duration_seconds', 81,
               'poster', 'friendship-hours/idea.2.pt.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'friendship-hours';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'friendship-hours'
      and i->>'id' = 'hora-de-trabalho-nao-conta'
      and i->'video'->'pt'->>'path' = 'friendship-hours/idea.2.pt.mp4'
  ) then
    raise exception 'learning_notebook: friendship-hours/hora-de-trabalho-nao-conta video.pt was not updated';
  end if;
end
$guard$;

-- glossary-play · sofa-um-pedaco (ideia 1) · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'sofa-um-pedaco' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-play/idea.1.pt.mp4',
               'duration_seconds', 91,
               'poster', 'glossary-play/idea.1.pt.poster.webp')),
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
      and i->'video'->'pt'->>'path' = 'glossary-play/idea.1.pt.mp4'
  ) then
    raise exception 'learning_notebook: glossary-play/sofa-um-pedaco video.pt was not updated';
  end if;
end
$guard$;

-- glossary-play · sofa-um-pedaco (ideia 1) · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'sofa-um-pedaco' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-play/idea.1.en.mp4',
               'duration_seconds', 68,
               'poster', 'glossary-play/idea.1.en.poster.webp')),
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
      and i->'video'->'en'->>'path' = 'glossary-play/idea.1.en.mp4'
      and i->'video'->'pt'->>'path' = 'glossary-play/idea.1.pt.mp4'
  ) then
    raise exception 'learning_notebook: glossary-play/sofa-um-pedaco video.en was not updated';
  end if;
end
$guard$;

-- summary-antifragile · terceiro-estado (ideia 1) · video.pt
-- (video.en já existe e precisa sobreviver ao merge)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'terceiro-estado' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'summary-antifragile/idea.1.pt.mp4',
               'duration_seconds', 75,
               'poster', 'summary-antifragile/idea.1.pt.poster.webp')),
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
      and i->>'id' = 'terceiro-estado'
      and i->'video'->'pt'->>'path' = 'summary-antifragile/idea.1.pt.mp4'
      and i->'video'->'en'->>'path' = 'antifragil/video.en.v2.mp4'
  ) then
    raise exception 'learning_notebook: summary-antifragile/terceiro-estado video.pt was not updated (or video.en was lost)';
  end if;
end
$guard$;

-- deep dives (Análise detalhada, duração Padrão)
insert into public.learning_material_media
  (material_id, kind, locale, path, duration_seconds, source, meta)
select m.id, 'audio', v.locale, v.path, v.duration_seconds, 'notebooklm',
       jsonb_build_object('title', v.title)
from (values
  ('friendship-hours', 'pt', 'friendship-hours/audio.pt.m4a', 1879, 'A matemática por trás do bora marcar'),
  ('friendship-hours', 'en', 'friendship-hours/audio.en.m4a', 1294, 'Why Friendships Cost 200 Hours')
) as v(slug, locale, path, duration_seconds, title)
join public.learning_material m on m.slug = v.slug
on conflict (material_id, kind, locale) do update set
  path             = excluded.path,
  duration_seconds = excluded.duration_seconds,
  source           = excluded.source,
  meta             = excluded.meta;

do $guard$
begin
  if (
    select count(*)
    from public.learning_material_media mm
    join public.learning_material m on m.id = mm.material_id
    where m.slug = 'friendship-hours'
      and mm.kind = 'audio'
      and mm.path in ('friendship-hours/audio.pt.m4a', 'friendship-hours/audio.en.m4a')
  ) <> 2 then
    raise exception 'learning_notebook: friendship-hours deep dives (pt/en) were not registered';
  end if;
end
$guard$;

commit;
