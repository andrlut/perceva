-- migration: 20261010000001_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-10-10, rodada das 23h (.claude/agents/learning-notebook-runner.md):
--          2 vídeos "Resumo em Vídeo" Curta (ideia 4 EN; fonte restrita ao documento da ideia,
--          foco genérico; cartão final cortado por tools/content-media/video.mjs) e 8 deep dives
--          "Resumo em Áudio" Análise detalhada / Padrão / PT (fonte restrita ao texto PT do material,
--          reencodados AAC 64k mono +faststart).
--          Portão de fidelidade (§6b) nos vídeos: grade + faixa de legendas lidas às cegas
--          (learning-card-tester) e comparadas com o verso e o corpo da ideia. Todo lado leva
--          fidelity_score; abaixo de 90 leva também needs_review = true e fidelity_note (sobe mesmo
--          assim, decisão de 2026-10-05; revisão = tier 7, menor nota primeiro).
--          Vídeo: jsonb_set cirúrgico no lado do vídeo de uma ideia, por id, com guarda pós-update.
--          Deep dive: upsert em learning_material_media (unique material_id, kind, locale).
--
--          vídeos (slug · ideia · lado · título no Estúdio · duração s · score):
--            summary-deep-work · abracar-o-tedio · en · "Why Your Phone Ruins Deep Work" · 69 · 60
--            summary-outlive · aposta-cara · en · "The Controversial Longevity Protocols of Peter Attia" · 79 · 80
--          deep dives (slug · lado · título no Estúdio · duração s):
--            hobbies-depression-older-adults · pt · "Hobbies como escudo contra a depressão" · 1863
--            stretching-ten-minutes-week · pt · "O cérebro mente sobre o alongamento" · 1386
--            job-crafting-additive · pt · "Redesenhe seu trabalho sem pedir permissão" · 736
--            glossary-contemplate · pt · "O custo real da divagação mental" · 1394
--            glossary-circle · pt · "Isolamento mata tanto quanto o cigarro" · 725
--            glossary-career · pt · "Dinheiro não garante satisfação no trabalho" · 1360
--            glossary-build · pt · "Criar com as mãos muda o cérebro" · 1146
--            explainer-career-capital · pt · "A paixão é resultado da maestria" · 1575

begin;

-- summary-deep-work · abracar-o-tedio · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'abracar-o-tedio' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'summary-deep-work/idea.4.en.mp4',
               'duration_seconds', 69,
               'poster', 'summary-deep-work/idea.4.en.poster.webp',
               'fidelity_score', 60,
               'needs_review', true,
               'fidelity_note', 'A tese do autor vira fato com mecanismo ("rewires us to flee hard tasks", "literally becomes your daily training ground"); some a ressalva "argumento do autor, não resultado medido"')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'summary-deep-work';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'summary-deep-work'
      and i->>'id' = 'abracar-o-tedio'
      and i->'video'->'en'->>'path' = 'summary-deep-work/idea.4.en.mp4'
  ) then
    raise exception 'learning_notebook: summary-deep-work/abracar-o-tedio video.en was not updated';
  end if;
end
$guard$;

-- summary-outlive · aposta-cara · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'aposta-cara' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'summary-outlive/idea.4.en.mp4',
               'duration_seconds', 79,
               'poster', 'summary-outlive/idea.4.en.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', 'PEARL vira "zero benefício funcional" (texto: "em grande parte nulo"); Lp(a) "inteiramente genético" e o fecho "marcadores mais confiáveis de longevidade" vão além do texto')),
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
      and i->>'id' = 'aposta-cara'
      and i->'video'->'en'->>'path' = 'summary-outlive/idea.4.en.mp4'
  ) then
    raise exception 'learning_notebook: summary-outlive/aposta-cara video.en was not updated';
  end if;
end
$guard$;

-- deep dives
insert into public.learning_material_media
  (material_id, kind, locale, path, duration_seconds, source, meta)
select m.id, 'audio', v.locale, v.path, v.duration_seconds, 'notebooklm',
       jsonb_build_object('title', v.title)
from (values
  ('hobbies-depression-older-adults', 'pt', 'hobbies-depression-older-adults/audio.pt.m4a', 1863, 'Hobbies como escudo contra a depressão'),
  ('stretching-ten-minutes-week', 'pt', 'stretching-ten-minutes-week/audio.pt.m4a', 1386, 'O cérebro mente sobre o alongamento'),
  ('job-crafting-additive', 'pt', 'job-crafting-additive/audio.pt.m4a', 736, 'Redesenhe seu trabalho sem pedir permissão'),
  ('glossary-contemplate', 'pt', 'glossary-contemplate/audio.pt.m4a', 1394, 'O custo real da divagação mental'),
  ('glossary-circle', 'pt', 'glossary-circle/audio.pt.m4a', 725, 'Isolamento mata tanto quanto o cigarro'),
  ('glossary-career', 'pt', 'glossary-career/audio.pt.m4a', 1360, 'Dinheiro não garante satisfação no trabalho'),
  ('glossary-build', 'pt', 'glossary-build/audio.pt.m4a', 1146, 'Criar com as mãos muda o cérebro'),
  ('explainer-career-capital', 'pt', 'explainer-career-capital/audio.pt.m4a', 1575, 'A paixão é resultado da maestria')
) as v(slug, locale, path, duration_seconds, title)
join public.learning_material m on m.slug = v.slug
on conflict (material_id, kind, locale) do update set
  path             = excluded.path,
  duration_seconds = excluded.duration_seconds,
  source           = excluded.source,
  meta             = excluded.meta;

do $guard$
declare n int;
begin
  select count(*) into n
  from public.learning_material_media mm
  join public.learning_material m on m.id = mm.material_id
  where mm.kind = 'audio' and (m.slug, mm.locale, mm.path) in (
    ('hobbies-depression-older-adults', 'pt', 'hobbies-depression-older-adults/audio.pt.m4a'),
    ('stretching-ten-minutes-week', 'pt', 'stretching-ten-minutes-week/audio.pt.m4a'),
    ('job-crafting-additive', 'pt', 'job-crafting-additive/audio.pt.m4a'),
    ('glossary-contemplate', 'pt', 'glossary-contemplate/audio.pt.m4a'),
    ('glossary-circle', 'pt', 'glossary-circle/audio.pt.m4a'),
    ('glossary-career', 'pt', 'glossary-career/audio.pt.m4a'),
    ('glossary-build', 'pt', 'glossary-build/audio.pt.m4a'),
    ('explainer-career-capital', 'pt', 'explainer-career-capital/audio.pt.m4a')
  );
  if n <> 8 then
    raise exception 'learning_notebook: expected 8 deep dive rows, found %', n;
  end if;
end
$guard$;

commit;
