-- migration: 20261012000002_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-10-12, rodada das 17h (.claude/agents/learning-notebook-runner.md):
--          3 vídeos "Resumo em Vídeo" Curta, tier 6 (o vídeo anterior carregava text_revised_at;
--          refeitos a partir do texto revisado da ideia, em caminho .v2 — o objeto novo não
--          carrega text_revised_at, o que marca o vídeo como atual), fonte restrita ao documento
--          da ideia, foco genérico; cartão final cortado por tools/content-media/video.mjs; e 6 deep
--          dives "Resumo em Áudio" Análise detalhada / Padrão / EN (fonte restrita ao texto EN do
--          material, reencodados AAC 64k mono +faststart).
--          Portão de fidelidade (§6b) nos vídeos: grade de quadros + faixa de legendas lidas às cegas
--          (learning-card-tester) e comparadas com o verso e o corpo da ideia. Todo lado leva
--          fidelity_score; abaixo de 90 leva também needs_review = true e fidelity_note (sobe mesmo
--          assim, decisão de 2026-10-05; revisão = tier 7, menor nota primeiro).
--          Vídeo: jsonb_set cirúrgico no lado do vídeo de uma ideia, por id, com guarda pós-update.
--          Deep dive: upsert em learning_material_media (unique material_id, kind, locale).
--
--          vídeos (slug · ideia · lado · título no Estúdio · duração s · score):
--            news-pink-noise-sleep-2026-09 · som-cronometrado-cerebro · pt · "Como Um Som Turbina a Limpeza do Cérebro" · 65 · 70
--            friendship-hours · relogio-da-amizade · pt · "A matemática para fazer novos amigos" · 60 · 80
--            protein-distribution-30g-myth · nao-existe-teto-de-absorcao · pt · "Como o corpo absorve altas doses de proteína" · 66 · 90
--          deep dives (slug · lado · título no Estúdio · duração s):
--            news-loneliness-memory-2026-04 · en · "Loneliness Does Not Accelerate Memory Loss" · 1037
--            news-oral-glp1-2026-05 · en · "Daily Pill Prevents GLP-1 Weight Regain" · 1114
--            summary-outlive · en · "What Works in Peter Attia Outlive" · 1502
--            summary-why-we-sleep · en · "The Flawed Science of Why We Sleep" · 1342
--            glossary-sleep · en · "Why Your Brain Lies About Sleep" · 1649
--            glossary-strength · en · "Reversing Silent Physical Decline" · 1106

begin;

-- news-pink-noise-sleep-2026-09 · som-cronometrado-cerebro · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'som-cronometrado-cerebro' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'news-pink-noise-sleep-2026-09/idea.1.pt.v2.mp4',
               'duration_seconds', 65,
               'poster', 'news-pink-noise-sleep-2026-09/idea.1.pt.v2.poster.webp',
               'fidelity_score', 70,
               'needs_review', true,
               'fidelity_note', 'Atribui ao MIT a constatação de que sons contínuos falham e mostra uma onda de limpeza gigante; o texto só diz que nada indica que ruído contínuo funcione e não dá porcentagem, e a cautela (um cochilo, 14 pessoas, sem desfecho de saúde) não aparece.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'news-pink-noise-sleep-2026-09';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'news-pink-noise-sleep-2026-09'
      and i->>'id' = 'som-cronometrado-cerebro'
      and i->'video'->'pt'->>'path' = 'news-pink-noise-sleep-2026-09/idea.1.pt.v2.mp4'
  ) then
    raise exception 'learning_notebook: news-pink-noise-sleep-2026-09/som-cronometrado-cerebro video.pt was not updated';
  end if;
end
$guard$;

-- friendship-hours · relogio-da-amizade · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'relogio-da-amizade' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'friendship-hours/idea.1.pt.v2.mp4',
               'duration_seconds', 60,
               'poster', 'friendship-hours/idea.1.pt.v2.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', 'Diz que pesquisadores validaram a marca de 50 horas e que as horas são o fator decisivo; o texto avisa que as horas foram lembradas de memória e ninguém de fora replicou os limiares. Números 50/90/200 e a ressalva de ordem de grandeza certos.')),
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
      and i->'video'->'pt'->>'path' = 'friendship-hours/idea.1.pt.v2.mp4'
  ) then
    raise exception 'learning_notebook: friendship-hours/relogio-da-amizade video.pt was not updated';
  end if;
end
$guard$;

-- protein-distribution-30g-myth · nao-existe-teto-de-absorcao · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'nao-existe-teto-de-absorcao' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'protein-distribution-30g-myth/idea.1.pt.v2.mp4',
               'duration_seconds', 66,
               'poster', 'protein-distribution-30g-myth/idea.1.pt.v2.poster.webp',
               'fidelity_score', 90)),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'protein-distribution-30g-myth';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'protein-distribution-30g-myth'
      and i->>'id' = 'nao-existe-teto-de-absorcao'
      and i->'video'->'pt'->>'path' = 'protein-distribution-30g-myth/idea.1.pt.v2.mp4'
  ) then
    raise exception 'learning_notebook: protein-distribution-30g-myth/nao-existe-teto-de-absorcao video.pt was not updated';
  end if;
end
$guard$;

-- deep dives
insert into public.learning_material_media
  (material_id, kind, locale, path, duration_seconds, source, meta)
select m.id, 'audio', v.locale, v.path, v.duration_seconds, 'notebooklm',
       jsonb_build_object('title', v.title)
from (values
  ('news-loneliness-memory-2026-04', 'en', 'news-loneliness-memory-2026-04/audio.en.m4a', 1037, 'Loneliness Does Not Accelerate Memory Loss'),
  ('news-oral-glp1-2026-05', 'en', 'news-oral-glp1-2026-05/audio.en.m4a', 1114, 'Daily Pill Prevents GLP-1 Weight Regain'),
  ('summary-outlive', 'en', 'summary-outlive/audio.en.m4a', 1502, 'What Works in Peter Attia Outlive'),
  ('summary-why-we-sleep', 'en', 'summary-why-we-sleep/audio.en.m4a', 1342, 'The Flawed Science of Why We Sleep'),
  ('glossary-sleep', 'en', 'glossary-sleep/audio.en.m4a', 1649, 'Why Your Brain Lies About Sleep'),
  ('glossary-strength', 'en', 'glossary-strength/audio.en.m4a', 1106, 'Reversing Silent Physical Decline')
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
    ('news-loneliness-memory-2026-04', 'en', 'news-loneliness-memory-2026-04/audio.en.m4a'),
    ('news-oral-glp1-2026-05', 'en', 'news-oral-glp1-2026-05/audio.en.m4a'),
    ('summary-outlive', 'en', 'summary-outlive/audio.en.m4a'),
    ('summary-why-we-sleep', 'en', 'summary-why-we-sleep/audio.en.m4a'),
    ('glossary-sleep', 'en', 'glossary-sleep/audio.en.m4a'),
    ('glossary-strength', 'en', 'glossary-strength/audio.en.m4a')
  );
  if n <> 6 then
    raise exception 'learning_notebook: expected 6 deep dive rows, found %', n;
  end if;
end
$guard$;

commit;
