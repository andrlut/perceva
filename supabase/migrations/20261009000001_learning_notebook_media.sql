-- migration: 20261009000001_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-10-09, rodada das 17h (.claude/agents/learning-notebook-runner.md):
--          10 vídeos "Resumo em Vídeo" Curta (ideia 3 EN e ideia 4 PT; fonte restrita ao
--          documento da ideia, foco genérico; cartão final cortado por tools/content-media/video.mjs).
--          Portão de fidelidade (§6b): grade + faixa de legendas lidas às cegas (learning-card-tester)
--          e comparadas com o verso e o corpo da ideia. Todo lado leva fidelity_score; abaixo de 90
--          leva também needs_review = true e fidelity_note (sobe mesmo assim, decisão de 2026-10-05;
--          revisão = tier 7, menor nota primeiro).
--          jsonb_set cirúrgico no lado do vídeo de uma ideia, por id, com guarda pós-update.
--
--          vídeos (slug · ideia · lado · título no Estúdio · duração s · score):
--            glossary-contemplate · portas-da-contemplacao · en · "How Writing Acts as Meditation" · 74 · 85
--            glossary-career · chamado-armadilha · en · "Why Your Career Calling Is a Trap" · 78 · 75
--            summary-atomic-habits · voto-na-identidade · en · "How Identity-Based Habits Actually Work" · 70 · 85
--            summary-antifragile · barbell · en · "How the Barbell Strategy Caps Risk" · 66 · 70
--            summary-deep-work · bloco-ritmico · en · "How Rhythmic Scheduling Beats Distraction" · 66 · 85
--            summary-outlive · decatlo-centenario · en · "The Math Behind Your 80-Year-Old Body" · 57 · 85
--            summary-why-we-sleep · ortossonia · en · "Orthosomnia: How Sleep Tracking Ruins Sleep" · 68 · 80
--            glossary-sleep · dirigir-com-sono · en · "Why Driving Tired Is Driving Drunk" · 67 · 90
--            summary-deep-work · abracar-o-tedio · pt · "Por Que o Celular na Fila Destrói Seu Foco" · 67 · 65
--            summary-outlive · aposta-cara · pt · "O que realmente funciona na medicina da longevidade" · 69 · 85

begin;

-- glossary-contemplate · portas-da-contemplacao · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'portas-da-contemplacao' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-contemplate/idea.3.en.mp4',
               'duration_seconds', 74,
               'poster', 'glossary-contemplate/idea.3.en.poster.webp',
               'fidelity_score', 85,
               'needs_review', true,
               'fidelity_note', 'Mantém 146 estudos, 15 minutos e o voltar ao papel, mas some o "pequeno" do efeito e o nome Frattaroli; acrescenta rótulos ("Metacognitive Detection") e uma barra de estresse que o texto não tem.')),
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
      and i->>'id' = 'portas-da-contemplacao'
      and i->'video'->'en'->>'path' = 'glossary-contemplate/idea.3.en.mp4'
  ) then
    raise exception 'learning_notebook: glossary-contemplate/portas-da-contemplacao video.en was not updated';
  end if;
end
$guard$;

-- glossary-career · chamado-armadilha · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'chamado-armadilha' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-career/idea.3.en.mp4',
               'duration_seconds', 78,
               'poster', 'glossary-career/idea.3.en.poster.webp',
               'fidelity_score', 75,
               'needs_review', true,
               'fidelity_note', 'Tratadores de zoológico, hora extra não paga e renegociar batem; o vídeo inventa "três horas fora do expediente" e "a maior quantidade de hora extra", acrescenta um gráfico de poder de barganha e some o terço dos 196 entrevistados mais satisfeitos.')),
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
      and i->>'id' = 'chamado-armadilha'
      and i->'video'->'en'->>'path' = 'glossary-career/idea.3.en.mp4'
  ) then
    raise exception 'learning_notebook: glossary-career/chamado-armadilha video.en was not updated';
  end if;
end
$guard$;

-- summary-atomic-habits · voto-na-identidade · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'voto-na-identidade' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'summary-atomic-habits/idea.3.en.mp4',
               'duration_seconds', 70,
               'poster', 'summary-atomic-habits/idea.3.en.poster.webp',
               'fidelity_score', 85,
               'needs_review', true,
               'fidelity_note', 'Troca de frase, voto por ação, Bandura 1977, "pilar menos provado" (barra de confiança empírica baixa) e medir se o hábito aconteceu batem; o fecho absolutiza ("non-smokers never even have to use willpower", "lasting change").')),
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
      and i->>'id' = 'voto-na-identidade'
      and i->'video'->'en'->>'path' = 'summary-atomic-habits/idea.3.en.mp4'
  ) then
    raise exception 'learning_notebook: summary-atomic-habits/voto-na-identidade video.en was not updated';
  end if;
end
$guard$;

-- summary-antifragile · barbell · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'barbell' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'summary-antifragile/idea.3.en.mp4',
               'duration_seconds', 66,
               'poster', 'summary-antifragile/idea.3.en.poster.webp',
               'fidelity_score', 70,
               'needs_review', true,
               'fidelity_note', '90/10, nada no meio, perda travada e emprego + projeto paralelo batem, mas some toda a ressalva (histórico do próprio Taleb, Kirkus, analogia não testada) e o vídeo vende como "Mathematical Asymmetry" que equilibra risco com segurança.')),
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
      and i->>'id' = 'barbell'
      and i->'video'->'en'->>'path' = 'summary-antifragile/idea.3.en.mp4'
  ) then
    raise exception 'learning_notebook: summary-antifragile/barbell video.en was not updated';
  end if;
end
$guard$;

-- summary-deep-work · bloco-ritmico · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'bloco-ritmico' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'summary-deep-work/idea.3.en.mp4',
               'duration_seconds', 66,
               'poster', 'summary-deep-work/idea.3.en.poster.webp',
               'fidelity_score', 85,
               'needs_review', true,
               'fidelity_note', 'Bloco de 90 min antes do e-mail, "focus more" vazio, estrutura em vez de heroísmo e a ressalva de quem não controla a agenda batem; some as outras três filosofias e Newport, e a filosofia rítmica vira "unbreakable focus".')),
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
      and i->>'id' = 'bloco-ritmico'
      and i->'video'->'en'->>'path' = 'summary-deep-work/idea.3.en.mp4'
  ) then
    raise exception 'learning_notebook: summary-deep-work/bloco-ritmico video.en was not updated';
  end if;
end
$guard$;

-- summary-outlive · decatlo-centenario · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'decatlo-centenario' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'summary-outlive/idea.3.en.mp4',
               'duration_seconds', 57,
               'poster', 'summary-outlive/idea.3.en.poster.webp',
               'fidelity_score', 85,
               'needs_review', true,
               'fidelity_note', 'Decatlo Centenário, mala de 30 lb, chegar aos 50 com o dobro e listar cinco tarefas batem; o gráfico crava "-15% per decade" onde o texto diz 10 a 15%, e some Attia e a Década Marginal.')),
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
      and i->>'id' = 'decatlo-centenario'
      and i->'video'->'en'->>'path' = 'summary-outlive/idea.3.en.mp4'
  ) then
    raise exception 'learning_notebook: summary-outlive/decatlo-centenario video.en was not updated';
  end if;
end
$guard$;

-- summary-why-we-sleep · ortossonia · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'ortossonia' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'summary-why-we-sleep/idea.3.en.mp4',
               'duration_seconds', 68,
               'poster', 'summary-why-we-sleep/idea.3.en.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', 'Ortossonia, meta de 8 h e consenso médico batem; o vídeo acrescenta um mecanismo (laço de hiperexcitação, "contradição biológica") e troca "pare de checar por algumas semanas" por "tire o relógio, deixe em outro cômodo"; somem os leitores do livro e o "pare de ler".')),
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
      and i->'video'->'en'->>'path' = 'summary-why-we-sleep/idea.3.en.mp4'
  ) then
    raise exception 'learning_notebook: summary-why-we-sleep/ortossonia video.en was not updated';
  end if;
end
$guard$;

-- glossary-sleep · dirigir-com-sono · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'dirigir-com-sono' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-sleep/idea.3.en.mp4',
               'duration_seconds', 67,
               'poster', 'glossary-sleep/idea.3.en.poster.webp',
               'fidelity_score', 90)),
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
      and i->>'id' = 'dirigir-com-sono'
      and i->'video'->'en'->>'path' = 'glossary-sleep/idea.3.en.mp4'
  ) then
    raise exception 'learning_notebook: glossary-sleep/dirigir-com-sono video.en was not updated';
  end if;
end
$guard$;

-- summary-deep-work · abracar-o-tedio · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'abracar-o-tedio' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'summary-deep-work/idea.4.pt.mp4',
               'duration_seconds', 67,
               'poster', 'summary-deep-work/idea.4.pt.poster.webp',
               'fidelity_score', 65,
               'needs_review', true,
               'fidelity_note', 'Fila, celular e a conta na tarefa difícil batem, mas o vídeo afirma como fato ("destrói o seu foco") e acrescenta mecanismo (cérebro associa desconforto a alívio, hábito que engrossa) onde o texto avisa que é tese do autor, não resultado medido.')),
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
      and i->'video'->'pt'->>'path' = 'summary-deep-work/idea.4.pt.mp4'
  ) then
    raise exception 'learning_notebook: summary-deep-work/abracar-o-tedio video.pt was not updated';
  end if;
end
$guard$;

-- summary-outlive · aposta-cara · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'aposta-cara' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'summary-outlive/idea.4.pt.mp4',
               'duration_seconds', 69,
               'poster', 'summary-outlive/idea.4.pt.poster.webp',
               'fidelity_score', 85,
               'needs_review', true,
               'fidelity_note', 'apoB e Lp(a) uma vez, ressonância com biópsias à toa e rapamicina batem; endurece "quase não muda com dieta" para "estável para sempre" e "largamente nulo" para "a droga falhou"; Attia, Topol e o sinal em camundongos somem.')),
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
      and i->'video'->'pt'->>'path' = 'summary-outlive/idea.4.pt.mp4'
  ) then
    raise exception 'learning_notebook: summary-outlive/aposta-cara video.pt was not updated';
  end if;
end
$guard$;

commit;
