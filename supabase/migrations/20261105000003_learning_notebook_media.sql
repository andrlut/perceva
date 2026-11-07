-- migration: 20261105000003_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-11-05 (.claude/agents/learning-notebook-runner.md).
--          - training-close-to-failure (1 ideia): 2 vídeos "Resumo em Vídeo" Curta (tiers 1 e 2), fonte restrita
--            ao documento da ideia, foco genérico; cartão final cortado por tools/content-media/video.mjs.
--          - 4 deep dives "Resumo em Áudio" Análise detalhada / Padrão (tier 3), fonte restrita ao texto do
--            idioma; re-encode AAC 64k mono +faststart: training-close-to-failure pt/en e
--            paker-health-energia-pele-forca pt/en (os vídeos da Paker são Remotion e não são tocados).
--          Portão de fidelidade (§6b): grade lida às cegas (learning-card-tester) + faixa de legendas,
--          comparadas com o verso e o corpo da ideia. Abaixo de 90 leva needs_review = true e fidelity_note
--          (sobe mesmo assim, decisão de 2026-10-05; revisão = tier 7).
--
--          vídeos (slug · ideia · lado · título no Estúdio · duração s · score):
--            training-close-to-failure · perto-da-falha · pt · "Por Que Você Não Deve Treinar Até a Falha" · 63 · 65
--            training-close-to-failure · perto-da-falha · en · "Why You Should Stop Before Muscular Failure" · 79 · 60
--          deep dives (slug · lado · título no Estúdio · duração s):
--            paker-health-energia-pele-forca · pt · "O tempo certo para cada suplemento" · 1838
--            paker-health-energia-pele-forca · en · "How Pre-Workout Collagen and Creatine Work" · 1230
--            training-close-to-failure · pt · "Precisa mesmo treinar até a falha?" · 1838
--            training-close-to-failure · en · "Why You Shouldn't Lift to Failure" · 1226

begin;

-- training-close-to-failure · perto-da-falha · video.pt (fidelity 65)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'perto-da-falha' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'training-close-to-failure/idea.1.pt.mp4',
               'duration_seconds', 63,
               'poster', 'training-close-to-failure/idea.1.pt.poster.webp',
               'fidelity_score', 65,
               'needs_review', true,
               'fidelity_note', 'Tela diz "Recuperação > 48h" e "Estímulo Máximo (1-2 RIR)" (texto: 24 a 48 h; pare com 2 ou 3 sobrando) e o fecho diz que a série curta construiu o mesmo e deixa 100% recuperado amanhã.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'training-close-to-failure';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'training-close-to-failure'
      and i->>'id' = 'perto-da-falha'
      and i->'video'->'pt'->>'path' = 'training-close-to-failure/idea.1.pt.mp4'
  ) then
    raise exception 'learning_notebook: training-close-to-failure/perto-da-falha video.pt was not updated';
  end if;
end
$guard$;

-- training-close-to-failure · perto-da-falha · video.en (fidelity 60)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'perto-da-falha' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'training-close-to-failure/idea.1.en.mp4',
               'duration_seconds', 79,
               'poster', 'training-close-to-failure/idea.1.en.poster.webp',
               'fidelity_score', 60,
               'needs_review', true,
               'fidelity_note', 'Gráfico inventa números que o texto não tem ("Trivial Margin +~5%", "~92% Stimulus", "15% fatigue", "100% Retained") e fala em preservar o SNC; 2-3 RIR e 24-48 h batem.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'training-close-to-failure';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'training-close-to-failure'
      and i->>'id' = 'perto-da-falha'
      and i->'video'->'en'->>'path' = 'training-close-to-failure/idea.1.en.mp4'
  ) then
    raise exception 'learning_notebook: training-close-to-failure/perto-da-falha video.en was not updated';
  end if;
end
$guard$;

-- deep dives (Resumo em Áudio · Análise detalhada · Padrão)
insert into public.learning_material_media
  (material_id, kind, locale, path, duration_seconds, source, meta)
select m.id, 'audio', v.locale, v.path, v.duration_seconds, 'notebooklm',
       jsonb_build_object('title', v.title)
from (values
  ('paker-health-energia-pele-forca', 'pt', 'paker-health-energia-pele-forca/audio.pt.m4a', 1838, 'O tempo certo para cada suplemento'),
  ('paker-health-energia-pele-forca', 'en', 'paker-health-energia-pele-forca/audio.en.m4a', 1230, 'How Pre-Workout Collagen and Creatine Work'),
  ('training-close-to-failure', 'pt', 'training-close-to-failure/audio.pt.m4a', 1838, 'Precisa mesmo treinar até a falha?'),
  ('training-close-to-failure', 'en', 'training-close-to-failure/audio.en.m4a', 1226, 'Why You Shouldn''t Lift to Failure')
) as v(slug, locale, path, duration_seconds, title)
join public.learning_material m on m.slug = v.slug
on conflict (material_id, kind, locale) do update set
  path             = excluded.path,
  duration_seconds = excluded.duration_seconds,
  source           = excluded.source,
  meta             = excluded.meta;

do $guard$
begin
  if (select count(*) from public.learning_material_media mm
      join public.learning_material m on m.id = mm.material_id
      where mm.kind = 'audio' and mm.path in ('paker-health-energia-pele-forca/audio.pt.m4a', 'paker-health-energia-pele-forca/audio.en.m4a', 'training-close-to-failure/audio.pt.m4a', 'training-close-to-failure/audio.en.m4a')) <> 4 then
    raise exception 'learning_notebook: deep dive rows were not all written';
  end if;
end
$guard$;

commit;
