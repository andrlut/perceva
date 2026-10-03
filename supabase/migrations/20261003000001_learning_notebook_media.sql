-- migration: 20261003000001_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-10-03 (tarefa agendada learning-notebook-runner-cron,
--          .claude/agents/learning-notebook-runner.md). 10 vídeos Curta com foco dirigido
--          (§6b item 5) + 1 deep dive Padrão; o limite flexível de uso do Notebook (novo, renova
--          a cada 5 h) acabou depois disso. 7 vídeos passaram no portão de fidelidade (grade
--          1/8 fps lida às cegas pelo learning-card-tester + faixa de legendas a 1 fps × verso e
--          corpo da ideia) e entram aqui; 3 ficaram em needs_review (glossary-career 2 PT,
--          summary-psychology-of-money 2 PT, bids-for-connection 1 EN) e não sobem.
--          jsonb_set cirúrgico no lado do vídeo de uma ideia, por id, com guarda pós-update;
--          deep dive por upsert em learning_material_media.
--
--          vídeos (slug · ideia · lado · título no Estúdio · duração s):
--            summary-atomic-habits · ambiente-vence-vontade · pt · "Por Que o Ambiente Vence a Vontade" · 74
--            job-crafting-additive · somar-em-vez-de-cortar · en · "Why Job Crafting Means Doing Harder Work" · 68
--            bids-for-connection · bid-pedido-de-atencao · pt · "O verdadeiro significado do "olha isso"" · 67
--            non-instrumental-play · premio-mata-o-prazer · en · "How the Overjustification Effect Ruins Hobbies" · 69
--            news-oral-glp1-2026-05 · rampa-de-saida-da-agulha · en · "How the Daily Weight-Loss Pill Holds Your Plateau" · 69
--            summary-outlive · quatro-cavaleiros · en · "Why Insulin Resistance Links the Four Horsemen" · 67
--            glossary-strength · zona-2-mitocondria · en · "How Zone 2 Cardio Builds Better Cells" · 66
--          deep dive:
--            awe-walk-vastness-novelty · pt · "Como a admiração transforma sua caminhada" · 1538

begin;

-- summary-atomic-habits · ambiente-vence-vontade · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'ambiente-vence-vontade' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'summary-atomic-habits/idea.2.pt.mp4',
               'duration_seconds', 74,
               'poster', 'summary-atomic-habits/idea.2.pt.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'summary-atomic-habits';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'summary-atomic-habits'
      and i->>'id' = 'ambiente-vence-vontade'
      and i->'video'->'pt'->>'path' = 'summary-atomic-habits/idea.2.pt.mp4'
  ) then
    raise exception 'learning_notebook: summary-atomic-habits/ambiente-vence-vontade video.pt was not updated';
  end if;
end
$guard$;

-- job-crafting-additive · somar-em-vez-de-cortar · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'somar-em-vez-de-cortar' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'job-crafting-additive/idea.1.en.mp4',
               'duration_seconds', 68,
               'poster', 'job-crafting-additive/idea.1.en.poster.webp')),
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
      and i->'video'->'en'->>'path' = 'job-crafting-additive/idea.1.en.mp4'
  ) then
    raise exception 'learning_notebook: job-crafting-additive/somar-em-vez-de-cortar video.en was not updated';
  end if;
end
$guard$;

-- bids-for-connection · bid-pedido-de-atencao · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'bid-pedido-de-atencao' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'bids-for-connection/idea.1.pt.mp4',
               'duration_seconds', 67,
               'poster', 'bids-for-connection/idea.1.pt.poster.webp')),
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
      and i->>'id' = 'bid-pedido-de-atencao'
      and i->'video'->'pt'->>'path' = 'bids-for-connection/idea.1.pt.mp4'
  ) then
    raise exception 'learning_notebook: bids-for-connection/bid-pedido-de-atencao video.pt was not updated';
  end if;
end
$guard$;

-- non-instrumental-play · premio-mata-o-prazer · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'premio-mata-o-prazer' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'non-instrumental-play/idea.1.en.v2.mp4',
               'duration_seconds', 69,
               'poster', 'non-instrumental-play/idea.1.en.v2.poster.webp')),
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
      and i->'video'->'en'->>'path' = 'non-instrumental-play/idea.1.en.v2.mp4'
  ) then
    raise exception 'learning_notebook: non-instrumental-play/premio-mata-o-prazer video.en was not updated';
  end if;
end
$guard$;

-- news-oral-glp1-2026-05 · rampa-de-saida-da-agulha · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'rampa-de-saida-da-agulha' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'news-oral-glp1-2026-05/idea.1.en.mp4',
               'duration_seconds', 69,
               'poster', 'news-oral-glp1-2026-05/idea.1.en.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'news-oral-glp1-2026-05';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'news-oral-glp1-2026-05'
      and i->>'id' = 'rampa-de-saida-da-agulha'
      and i->'video'->'en'->>'path' = 'news-oral-glp1-2026-05/idea.1.en.mp4'
  ) then
    raise exception 'learning_notebook: news-oral-glp1-2026-05/rampa-de-saida-da-agulha video.en was not updated';
  end if;
end
$guard$;

-- summary-outlive · quatro-cavaleiros · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'quatro-cavaleiros' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'summary-outlive/idea.1.en.mp4',
               'duration_seconds', 67,
               'poster', 'summary-outlive/idea.1.en.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'summary-outlive';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'summary-outlive'
      and i->>'id' = 'quatro-cavaleiros'
      and i->'video'->'en'->>'path' = 'summary-outlive/idea.1.en.mp4'
  ) then
    raise exception 'learning_notebook: summary-outlive/quatro-cavaleiros video.en was not updated';
  end if;
end
$guard$;

-- glossary-strength · zona-2-mitocondria · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'zona-2-mitocondria' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-strength/idea.1.en.mp4',
               'duration_seconds', 66,
               'poster', 'glossary-strength/idea.1.en.poster.webp')),
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
      and i->'video'->'en'->>'path' = 'glossary-strength/idea.1.en.mp4'
  ) then
    raise exception 'learning_notebook: glossary-strength/zona-2-mitocondria video.en was not updated';
  end if;
end
$guard$;

-- awe-walk-vastness-novelty · deep dive pt
insert into public.learning_material_media
  (material_id, kind, locale, path, duration_seconds, source, meta)
select m.id, 'audio', v.locale, v.path, v.duration_seconds, 'notebooklm',
       jsonb_build_object('title', v.title)
from (values
  ('awe-walk-vastness-novelty', 'pt', 'awe-walk-vastness-novelty/audio.pt.m4a', 1538, 'Como a admiração transforma sua caminhada')
) as v(slug, locale, path, duration_seconds, title)
join public.learning_material m on m.slug = v.slug
on conflict (material_id, kind, locale) do update set
  path             = excluded.path,
  duration_seconds = excluded.duration_seconds,
  source           = excluded.source,
  meta             = excluded.meta;

do $guard$
begin
  if not exists (
    select 1 from public.learning_material_media mm
    join public.learning_material m on m.id = mm.material_id
    where m.slug = 'awe-walk-vastness-novelty' and mm.kind = 'audio' and mm.locale = 'pt'
      and mm.path = 'awe-walk-vastness-novelty/audio.pt.m4a'
  ) then
    raise exception 'learning_notebook: awe-walk-vastness-novelty audio.pt was not upserted';
  end if;
end
$guard$;

commit;
