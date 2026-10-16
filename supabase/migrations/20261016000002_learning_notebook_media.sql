-- migration: 20261016000002_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-10-16, rodada das 17h (.claude/agents/learning-notebook-runner.md):
--          10 vídeos "Resumo em Vídeo" Curta, tier 6 (o vídeo anterior carregava text_revised_at;
--          refeitos a partir do texto revisado da ideia 1 — 10 EN — em caminho .v2; o objeto novo
--          não carrega text_revised_at, o que marca o vídeo como atual), fonte restrita ao documento
--          da ideia, foco genérico; cartão final cortado por tools/content-media/video.mjs.
--          Portão de fidelidade (§6b): grade de quadros + faixa de legendas lidas às cegas
--          (learning-card-tester) e comparadas com o verso e o corpo da ideia. Todo lado leva
--          fidelity_score; abaixo de 90 leva também needs_review = true e fidelity_note (sobe mesmo
--          assim, decisão de 2026-10-05; revisão = tier 7, menor nota primeiro).
--          Vídeo: jsonb_set cirúrgico no lado do vídeo de uma ideia, por id, com guarda pós-update.
--
--          vídeos (slug · ideia · lado · título no Estúdio · duração s · score):
--            glossary-money · compre-o-palheiro · en · "Why Dumb Funds Beat Smart Managers" · 81 · 90
--            glossary-learn · dificuldades-desejaveis · en · "Why Rereading Isn't Learning" · 74 · 60
--            glossary-dexterity · sentar-e-levantar · en · "How the Sitting Rising Test Predicts Longevity" · 70 · 85
--            glossary-contemplate · mente-vaga-metade · en · "How to Catch a Wandering Mind" · 78 · 80
--            glossary-circle · risco-que-ninguem-mede · en · "Why Seeing Few People Is a Health Risk" · 78 · 70
--            glossary-career · tres-lentes · en · "The Three Ways to See Your Career" · 84 · 65
--            glossary-build · apego-e-prova · en · "How Mastery Experience Builds True Confidence" · 81 · 80
--            explainer-career-capital · capital-de-carreira · en · "How Career Capital Creates Passion" · 63 · 80
--            summary-atomic-habits · 66-dias-nao-21 · en · "How Long a New Habit Actually Takes" · 79 · 90
--            summary-antifragile · terceiro-estado · en · "How Stress Makes You Antifragile" · 73 · 65

begin;

-- glossary-money · compre-o-palheiro · video.en (fidelity 90)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'compre-o-palheiro' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-money/idea.1.en.v2.mp4',
               'duration_seconds', 81,
               'poster', 'glossary-money/idea.1.en.v2.poster.webp',
               'fidelity_score', 90)),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'glossary-money';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'glossary-money'
      and i->>'id' = 'compre-o-palheiro'
      and i->'video'->'en'->>'path' = 'glossary-money/idea.1.en.v2.mp4'
      and i->'video'->'en'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: glossary-money/compre-o-palheiro video.en was not updated';
  end if;
end
$guard$;

-- glossary-learn · dificuldades-desejaveis · video.en (fidelity 60)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'dificuldades-desejaveis' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-learn/idea.1.en.v2.mp4',
               'duration_seconds', 74,
               'poster', 'glossary-learn/idea.1.en.v2.poster.webp',
               'fidelity_score', 60,
               'needs_review', true,
               'fidelity_note', 'Omite a evidência da ideia (61% x 40% em uma semana, Roediger & Karpicke; espaçamento e intercalação) e chama a memória de ''permanent''.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'glossary-learn';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'glossary-learn'
      and i->>'id' = 'dificuldades-desejaveis'
      and i->'video'->'en'->>'path' = 'glossary-learn/idea.1.en.v2.mp4'
      and i->'video'->'en'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: glossary-learn/dificuldades-desejaveis video.en was not updated';
  end if;
end
$guard$;

-- glossary-dexterity · sentar-e-levantar · video.en (fidelity 85)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'sentar-e-levantar' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-dexterity/idea.1.en.v2.mp4',
               'duration_seconds', 70,
               'poster', 'glossary-dexterity/idea.1.en.v2.poster.webp',
               'fidelity_score', 85,
               'needs_review', true,
               'fidelity_note', 'Números certos (3-4 apoios, 5-6x risco), mas fecha vendendo ''independência física'' e não diz que treinar o movimento não acrescenta anos.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'glossary-dexterity';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'glossary-dexterity'
      and i->>'id' = 'sentar-e-levantar'
      and i->'video'->'en'->>'path' = 'glossary-dexterity/idea.1.en.v2.mp4'
      and i->'video'->'en'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: glossary-dexterity/sentar-e-levantar video.en was not updated';
  end if;
end
$guard$;

-- glossary-contemplate · mente-vaga-metade · video.en (fidelity 80)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'mente-vaga-metade' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-contemplate/idea.1.en.v2.mp4',
               'duration_seconds', 78,
               'poster', 'glossary-contemplate/idea.1.en.v2.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', 'Certo no essencial (quase metade do tempo, humor cai depois de divagar, treino é encurtar a saída), mas afirma a causa como fato sem a ressalva de que é a melhor inferência dos autores, e omite o estudo (2.250 adultos, 46,9%).')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'glossary-contemplate';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'glossary-contemplate'
      and i->>'id' = 'mente-vaga-metade'
      and i->'video'->'en'->>'path' = 'glossary-contemplate/idea.1.en.v2.mp4'
      and i->'video'->'en'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: glossary-contemplate/mente-vaga-metade video.en was not updated';
  end if;
end
$guard$;

-- glossary-circle · risco-que-ninguem-mede · video.en (fidelity 70)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'risco-que-ninguem-mede' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-circle/idea.1.en.v2.mp4',
               'duration_seconds', 78,
               'poster', 'glossary-circle/idea.1.en.v2.poster.webp',
               'fidelity_score', 70,
               'needs_review', true,
               'fidelity_note', 'Números certos (+50%, 300 mil, isolamento > solidão), mas vende causa ("adicionar laços aumenta a sobrevida em 50%") e fala em "impacto biológico" comparável a "curar" obesidade, o que o texto nega.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'glossary-circle';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'glossary-circle'
      and i->>'id' = 'risco-que-ninguem-mede'
      and i->'video'->'en'->>'path' = 'glossary-circle/idea.1.en.v2.mp4'
      and i->'video'->'en'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: glossary-circle/risco-que-ninguem-mede video.en was not updated';
  end if;
end
$guard$;

-- glossary-career · tres-lentes · video.en (fidelity 65)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'tres-lentes' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-career/idea.1.en.v2.mp4',
               'duration_seconds', 84,
               'poster', 'glossary-career/idea.1.en.v2.poster.webp',
               'fidelity_score', 65,
               'needs_review', true,
               'fidelity_note', 'Vende causa (satisfação "comes down to which lens you use", "because this mindset...") sem a ressalva de que o estudo é correlacional; põe um salário de US$ 50 mil que o texto não tem.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'glossary-career';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'glossary-career'
      and i->>'id' = 'tres-lentes'
      and i->'video'->'en'->>'path' = 'glossary-career/idea.1.en.v2.mp4'
      and i->'video'->'en'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: glossary-career/tres-lentes video.en was not updated';
  end if;
end
$guard$;

-- glossary-build · apego-e-prova · video.en (fidelity 80)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'apego-e-prova' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-build/idea.1.en.v2.mp4',
               'duration_seconds', 81,
               'poster', 'glossary-build/idea.1.en.v2.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', 'Estrutura certa (efeito IKEA dá apego, não habilidade; experiência de domínio de Bandura), mas exagera ("capability surges to maximum") e omite os números de lazer/TV.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'glossary-build';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'glossary-build'
      and i->>'id' = 'apego-e-prova'
      and i->'video'->'en'->>'path' = 'glossary-build/idea.1.en.v2.mp4'
      and i->'video'->'en'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: glossary-build/apego-e-prova video.en was not updated';
  end if;
end
$guard$;

-- explainer-career-capital · capital-de-carreira · video.en (fidelity 80)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'capital-de-carreira' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'explainer-career-capital/idea.1.en.v2.mp4',
               'duration_seconds', 63,
               'poster', 'explainer-career-capital/idea.1.en.v2.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', 'Modelo certo (habilidade rara compra autonomia), mas fecha com "paixão emerge" que o texto não diz, achata a ressalva de Cech (classe social) e omite que o livro não é ciência revisada.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'explainer-career-capital';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'explainer-career-capital'
      and i->>'id' = 'capital-de-carreira'
      and i->'video'->'en'->>'path' = 'explainer-career-capital/idea.1.en.v2.mp4'
      and i->'video'->'en'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: explainer-career-capital/capital-de-carreira video.en was not updated';
  end if;
end
$guard$;

-- summary-atomic-habits · 66-dias-nao-21 · video.en (fidelity 90)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = '66-dias-nao-21' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'summary-atomic-habits/idea.1.en.v2.mp4',
               'duration_seconds', 79,
               'poster', 'summary-atomic-habits/idea.1.en.v2.poster.webp',
               'fidelity_score', 90)),
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
      and i->>'id' = '66-dias-nao-21'
      and i->'video'->'en'->>'path' = 'summary-atomic-habits/idea.1.en.v2.mp4'
      and i->'video'->'en'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: summary-atomic-habits/66-dias-nao-21 video.en was not updated';
  end if;
end
$guard$;

-- summary-antifragile · terceiro-estado · video.en (fidelity 65)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'terceiro-estado' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'summary-antifragile/idea.1.en.v2.mp4',
               'duration_seconds', 73,
               'poster', 'summary-antifragile/idea.1.en.v2.poster.webp',
               'fidelity_score', 65,
               'needs_review', true,
               'fidelity_note', 'Vira uma aula de microlesão muscular: inventa o reparo que impede a mesma carga de rasgar de novo e vende a dor dois dias depois como sinal de fortalecimento; some a ressalva de que dose grande destrói e a recomendação semanal.')),
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
      and i->'video'->'en'->>'path' = 'summary-antifragile/idea.1.en.v2.mp4'
      and i->'video'->'en'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: summary-antifragile/terceiro-estado video.en was not updated';
  end if;
end
$guard$;

commit;
