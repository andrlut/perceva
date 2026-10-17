-- migration: 20261017000001_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-10-17 (.claude/agents/learning-notebook-runner.md):
--          4 vídeos "Resumo em Vídeo" Curta, fonte restrita ao documento da ideia, foco genérico;
--          cartão final cortado por tools/content-media/video.mjs.
--          - 2 tier 4 (lado ainda sem vídeo): summary-deep-work ideia 2 EN (o Notebook tinha falhado
--            duas vezes em 2026-10-07; desta vez gerou) e summary-why-we-sleep ideia 3 PT (a tomada
--            de 2026-10-08 teve corte falho e não subiu; esta cortou limpo no cartão escuro).
--          - 2 tier 6 (o vídeo anterior carregava text_revised_at): refeitos do texto revisado em
--            caminho .v2; o objeto novo não carrega text_revised_at, o que marca o vídeo como atual.
--          Portão de fidelidade (§6b): grade de quadros + faixa de legendas lidas às cegas
--          (learning-card-tester) e comparadas com o verso e o corpo da ideia. Todo lado leva
--          fidelity_score; abaixo de 90 leva também needs_review = true e fidelity_note (sobe mesmo
--          assim, decisão de 2026-10-05; revisão = tier 7, menor nota primeiro).
--          Vídeo: jsonb_set cirúrgico no lado do vídeo de uma ideia, por id, com guarda pós-update.
--
--          vídeos (slug · ideia · lado · título no Estúdio · duração s · score):
--            summary-deep-work · doze-por-cento · en · "The Limit of Deliberate Practice" · 76 · 90
--            summary-why-we-sleep · ortossonia · pt · "Como Medir Seu Sono Causa Insônia" · 54 · 80
--            does-money-buy-happiness · teto-dos-75-mil · en · "Why the Happiness Plateau Is an Emotional Ceiling" · 78 · 85
--            friendship-hours · hora-de-trabalho-nao-conta · pt · "Por que colegas não viram amigos" · 55 · 75

begin;

-- summary-deep-work · doze-por-cento · video.en (fidelity 90)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'doze-por-cento' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'summary-deep-work/idea.2.en.mp4',
               'duration_seconds', 76,
               'poster', 'summary-deep-work/idea.2.en.poster.webp',
               'fidelity_score', 90)),
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
      and i->>'id' = 'doze-por-cento'
      and i->'video'->'en'->>'path' = 'summary-deep-work/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: summary-deep-work/doze-por-cento video.en was not updated';
  end if;
end
$guard$;

-- summary-why-we-sleep · ortossonia · video.pt (fidelity 80)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'ortossonia' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'summary-why-we-sleep/idea.3.pt.mp4',
               'duration_seconds', 54,
               'poster', 'summary-why-we-sleep/idea.3.pt.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', 'Acrescenta mecanismo que a fonte não traz (diagrama ''Estado de Alerta · Ativação simpática'') e não mostra os clínicos do sono nem o livro como origem do padrão.')),
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
      and i->>'id' = 'ortossonia'
      and i->'video'->'pt'->>'path' = 'summary-why-we-sleep/idea.3.pt.mp4'
  ) then
    raise exception 'learning_notebook: summary-why-we-sleep/ortossonia video.pt was not updated';
  end if;
end
$guard$;

-- does-money-buy-happiness · teto-dos-75-mil · video.en (fidelity 85)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'teto-dos-75-mil' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'does-money-buy-happiness/idea.1.en.v2.mp4',
               'duration_seconds', 78,
               'poster', 'does-money-buy-happiness/idea.1.en.v2.poster.webp',
               'fidelity_score', 85,
               'needs_review', true,
               'fidelity_note', 'Números certos (80%, 15-20%, US$ 100 mil), mas o gráfico rotula o grupo infeliz abaixo de US$ 100 mil como ''Financial Scarcity'', leitura que a fonte não faz.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'does-money-buy-happiness';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'does-money-buy-happiness'
      and i->>'id' = 'teto-dos-75-mil'
      and i->'video'->'en'->>'path' = 'does-money-buy-happiness/idea.1.en.v2.mp4'
      and i->'video'->'en'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: does-money-buy-happiness/teto-dos-75-mil video.en was not updated';
  end if;
end
$guard$;

-- friendship-hours · hora-de-trabalho-nao-conta · video.pt (fidelity 75)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'hora-de-trabalho-nao-conta' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'friendship-hours/idea.2.pt.v2.mp4',
               'duration_seconds', 55,
               'poster', 'friendship-hours/idea.2.pt.v2.poster.webp',
               'fidelity_score', 75,
               'needs_review', true,
               'fidelity_note', 'Atribui ao cérebro (''o cérebro registra tempo obrigatório''), mecanismo que a fonte não traz; não mostra os dois estudos de Hall nem a ressalva sobre espaçamento.')),
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
      and i->'video'->'pt'->>'path' = 'friendship-hours/idea.2.pt.v2.mp4'
      and i->'video'->'pt'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: friendship-hours/hora-de-trabalho-nao-conta video.pt was not updated';
  end if;
end
$guard$;

commit;
