-- migration: 20261015000003_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-10-15, rodada das 17h (.claude/agents/learning-notebook-runner.md):
--          10 vídeos "Resumo em Vídeo" Curta, tier 6 (o vídeo anterior carregava text_revised_at;
--          refeitos a partir do texto revisado da ideia 1 — 7 PT e 3 EN — em caminho .v2; o objeto novo
--          não carrega text_revised_at, o que marca o vídeo como atual), fonte restrita ao documento
--          da ideia, foco genérico; cartão final cortado por tools/content-media/video.mjs.
--          Portão de fidelidade (§6b): grade de quadros + faixa de legendas lidas às cegas
--          (learning-card-tester) e comparadas com o verso e o corpo da ideia. Todo lado leva
--          fidelity_score; abaixo de 90 leva também needs_review = true e fidelity_note (sobe mesmo
--          assim, decisão de 2026-10-05; revisão = tier 7, menor nota primeiro).
--          Vídeo: jsonb_set cirúrgico no lado do vídeo de uma ideia, por id, com guarda pós-update.
--
--          vídeos (slug · ideia · lado · título no Estúdio · duração s · score):
--            summary-antifragile · terceiro-estado · pt · "Como a Antifragilidade Fortalece seu Corpo" · 80 · 85
--            does-money-buy-happiness · teto-dos-75-mil · pt · "Platô da Felicidade: Por que o teto salarial é um mito" · 62 · 75
--            attachment-styles-love · dois-numeros-nao-rotulo · pt · "Por que seu estilo de apego não é fixo" · 65 · 90
--            news-loneliness-memory-2026-04 · nivel-nao-velocidade · pt · "A Solidão Acelera a Perda de Memória?" · 64 · 70
--            news-oral-glp1-2026-05 · rampa-de-saida-da-agulha · pt · "Como a pílula de GLP-1 segura o peso" · 60 · 70
--            summary-outlive · quatro-cavaleiros · pt · "A Raiz das Quatro Doenças Que Mais Matam" · 72 · 50
--            glossary-sleep · tres-pecas-do-sono · pt · "Por Que Contar Horas de Sono é Uma Armadilha" · 73 · 65
--            news-pink-noise-sleep-2026-09 · som-cronometrado-cerebro · en · "How Sound Boosts Brain Cleanup" · 58 · 55
--            friendship-hours · relogio-da-amizade · en · "How Many Hours Make a Friend" · 53 · 65
--            protein-distribution-30g-myth · nao-existe-teto-de-absorcao · en · "Why the 30-Gram Protein Rule Is Wrong" · 71 · 70

begin;

-- summary-antifragile · terceiro-estado · video.pt (fidelity 85)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'terceiro-estado' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'summary-antifragile/idea.1.pt.v2.mp4',
               'duration_seconds', 80,
               'poster', 'summary-antifragile/idea.1.pt.v2.poster.webp',
               'fidelity_score', 85,
               'needs_review', true,
               'fidelity_note', 'Acrescenta mecanismo que o texto não traz (microlesões → supercompensação, fibra ''muito mais espessa''); omite Calabrese & Baldwin.')),
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
      and i->'video'->'pt'->>'path' = 'summary-antifragile/idea.1.pt.v2.mp4'
      and i->'video'->'pt'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: summary-antifragile/terceiro-estado video.pt was not updated';
  end if;
end
$guard$;

-- does-money-buy-happiness · teto-dos-75-mil · video.pt (fidelity 75)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'teto-dos-75-mil' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'does-money-buy-happiness/idea.1.pt.v2.mp4',
               'duration_seconds', 62,
               'poster', 'does-money-buy-happiness/idea.1.pt.v2.poster.webp',
               'fidelity_score', 75,
               'needs_review', true,
               'fidelity_note', 'Mostra ''humor inalterado'' no grupo infeliz e omite que a felicidade dele sobe até ~US$ 100 mil antes do platô; sem Kahneman/Killingsworth.')),
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
      and i->'video'->'pt'->>'path' = 'does-money-buy-happiness/idea.1.pt.v2.mp4'
      and i->'video'->'pt'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: does-money-buy-happiness/teto-dos-75-mil video.pt was not updated';
  end if;
end
$guard$;

-- attachment-styles-love · dois-numeros-nao-rotulo · video.pt (fidelity 90)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'dois-numeros-nao-rotulo' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'attachment-styles-love/idea.1.pt.v2.mp4',
               'duration_seconds', 65,
               'poster', 'attachment-styles-love/idea.1.pt.v2.poster.webp',
               'fidelity_score', 90)),
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
      and i->'video'->'pt'->>'path' = 'attachment-styles-love/idea.1.pt.v2.mp4'
      and i->'video'->'pt'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: attachment-styles-love/dois-numeros-nao-rotulo video.pt was not updated';
  end if;
end
$guard$;

-- news-loneliness-memory-2026-04 · nivel-nao-velocidade · video.pt (fidelity 70)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'nivel-nao-velocidade' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'news-loneliness-memory-2026-04/idea.1.pt.v2.mp4',
               'duration_seconds', 64,
               'poster', 'news-loneliness-memory-2026-04/idea.1.pt.v2.poster.webp',
               'fidelity_score', 70,
               'needs_review', true,
               'fidelity_note', 'O gráfico inventa médias de 8 vs 5,5 palavras no início; o texto diz só que os solitários lembraram ''um pouco menos''.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'news-loneliness-memory-2026-04';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'news-loneliness-memory-2026-04'
      and i->>'id' = 'nivel-nao-velocidade'
      and i->'video'->'pt'->>'path' = 'news-loneliness-memory-2026-04/idea.1.pt.v2.mp4'
      and i->'video'->'pt'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: news-loneliness-memory-2026-04/nivel-nao-velocidade video.pt was not updated';
  end if;
end
$guard$;

-- news-oral-glp1-2026-05 · rampa-de-saida-da-agulha · video.pt (fidelity 70)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'rampa-de-saida-da-agulha' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'news-oral-glp1-2026-05/idea.1.pt.v2.mp4',
               'duration_seconds', 60,
               'poster', 'news-oral-glp1-2026-05/idea.1.pt.v2.poster.webp',
               'fidelity_score', 70,
               'needs_review', true,
               'fidelity_note', 'Omite as duas ressalvas do texto (estudo bancado pela Eli Lilly, sem aprovação da FDA) e a comparação com o placebo (49%/38%); só mostra 79%.')),
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
      and i->'video'->'pt'->>'path' = 'news-oral-glp1-2026-05/idea.1.pt.v2.mp4'
      and i->'video'->'pt'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: news-oral-glp1-2026-05/rampa-de-saida-da-agulha video.pt was not updated';
  end if;
end
$guard$;

-- summary-outlive · quatro-cavaleiros · video.pt (fidelity 50)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'quatro-cavaleiros' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'summary-outlive/idea.1.pt.v2.mp4',
               'duration_seconds', 72,
               'poster', 'summary-outlive/idea.1.pt.v2.poster.webp',
               'fidelity_score', 50,
               'needs_review', true,
               'fidelity_note', 'Inverte a ressalva central: vende a resistência à insulina como gatilho das outras três e ''consenso clínico absoluto'', com ''desarmar os quatro de uma só vez''; o texto diz que a raiz única é hipótese, não consenso.')),
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
      and i->'video'->'pt'->>'path' = 'summary-outlive/idea.1.pt.v2.mp4'
      and i->'video'->'pt'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: summary-outlive/quatro-cavaleiros video.pt was not updated';
  end if;
end
$guard$;

-- glossary-sleep · tres-pecas-do-sono · video.pt (fidelity 65)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'tres-pecas-do-sono' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-sleep/idea.1.pt.v2.mp4',
               'duration_seconds', 73,
               'poster', 'glossary-sleep/idea.1.pt.v2.poster.webp',
               'fidelity_score', 65,
               'needs_review', true,
               'fidelity_note', 'Diz que 7 horas é o mínimo pra rodar SEIS ciclos de 90 min (seriam 9 h); o texto fala de 4 a 6 ciclos e 7 h como chão; também resume o risco a ''quase X%'' em vez de 20% a 48%.')),
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
      and i->'video'->'pt'->>'path' = 'glossary-sleep/idea.1.pt.v2.mp4'
      and i->'video'->'pt'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: glossary-sleep/tres-pecas-do-sono video.pt was not updated';
  end if;
end
$guard$;

-- news-pink-noise-sleep-2026-09 · som-cronometrado-cerebro · video.en (fidelity 55)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'som-cronometrado-cerebro' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'news-pink-noise-sleep-2026-09/idea.1.en.v2.mp4',
               'duration_seconds', 58,
               'poster', 'news-pink-noise-sleep-2026-09/idea.1.en.v2.poster.webp',
               'fidelity_score', 55,
               'needs_review', true,
               'fidelity_note', 'Vende o efeito como limpeza completa (''Extracellular Space Fully Cleared'', ''massive tidal wash'') e some com a ressalva central: evidência inicial, uma soneca, 14 voluntários, nenhum desfecho de saúde, autores com empresa.')),
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
      and i->'video'->'en'->>'path' = 'news-pink-noise-sleep-2026-09/idea.1.en.v2.mp4'
      and i->'video'->'en'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: news-pink-noise-sleep-2026-09/som-cronometrado-cerebro video.en was not updated';
  end if;
end
$guard$;

-- friendship-hours · relogio-da-amizade · video.en (fidelity 65)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'relogio-da-amizade' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'friendship-hours/idea.1.en.v2.mp4',
               'duration_seconds', 53,
               'poster', 'friendship-hours/idea.1.en.v2.poster.webp',
               'fidelity_score', 65,
               'needs_review', true,
               'fidelity_note', 'Trata os limiares como cronômetro (''46 Hour Deficit'', ''short by exactly''), o que o texto manda não fazer; some a ressalva (horas lembradas, um laboratório só, sem replicação) e o estudo de Hall.')),
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
      and i->'video'->'en'->>'path' = 'friendship-hours/idea.1.en.v2.mp4'
      and i->'video'->'en'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: friendship-hours/relogio-da-amizade video.en was not updated';
  end if;
end
$guard$;

-- protein-distribution-30g-myth · nao-existe-teto-de-absorcao · video.en (fidelity 70)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'nao-existe-teto-de-absorcao' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'protein-distribution-30g-myth/idea.1.en.v2.mp4',
               'duration_seconds', 71,
               'poster', 'protein-distribution-30g-myth/idea.1.en.v2.poster.webp',
               'fidelity_score', 70,
               'needs_review', true,
               'fidelity_note', 'Afirma ''100% absorbed over 12 hours'' / ''every last gram'', que o texto não diz; rotula o 40% como ''Nutrients''; sem Moore 2009 nem Trommelen 2023.')),
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
      and i->'video'->'en'->>'path' = 'protein-distribution-30g-myth/idea.1.en.v2.mp4'
      and i->'video'->'en'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: protein-distribution-30g-myth/nao-existe-teto-de-absorcao video.en was not updated';
  end if;
end
$guard$;

commit;
