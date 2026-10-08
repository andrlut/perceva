-- migration: 20261008000004_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-10-08, rodada das 17h (.claude/agents/learning-notebook-runner.md):
--          vídeo "Resumo em Vídeo" Curta da ideia 3 EN de 10 materiais (fonte restrita ao
--          documento da ideia, foco genérico; cartão final cortado por tools/content-media/video.mjs).
--          Portão de fidelidade (§6b): grade + faixa de legendas lidas às cegas (learning-card-tester)
--          e comparadas com o verso e o corpo da ideia. Todo lado leva fidelity_score; abaixo de 90
--          leva também needs_review = true e fidelity_note (sobe mesmo assim, decisão de 2026-10-05;
--          revisão = tier 7, menor nota primeiro).
--          jsonb_set cirúrgico no lado do vídeo de uma ideia, por id, com guarda pós-update.
--
--          vídeos (slug · ideia · lado · título no Estúdio · duração s · score):
--            friendship-hours · mudanca-derruba-o-circulo · en · "How to Stop Friendships from Fading" · 72 · 80
--            protein-distribution-30g-myth · buraco-do-cafe-da-manha · en · "How to Time Your Protein" · 78 · 75
--            cbt-i-vs-sleep-hygiene · levante-em-20-minutos · en · "How Stimulus Control Cures Insomnia" · 75 · 85
--            play-deprivation-adults · final-em-aberto · en · "How to Actually Play as an Adult" · 72 · 80
--            summary-psychology-of-money · educacao-financeira-funciona · en · "Why Your Money Habits Expire" · 70 · 80
--            summary-good-life · fitness-social · en · "How to Build Social Fitness" · 56 · 85
--            glossary-romance · manutencao-e-comportamento · en · "Why Long-Term Love Is A Behavior" · 75 · 65
--            glossary-play · pior-semana-hobby · en · "Why Your Busiest Week Needs a Hobby" · 67 · 70
--            glossary-nutrition · tres-numeros-da-comida · en · "Why Your Body Needs Indigestible Food" · 73 · 75
--            glossary-dexterity · equilibrio-corta-quedas · en · "How Mobility Actually Prevents Falls" · 61 · 85

begin;

-- friendship-hours · mudanca-derruba-o-circulo · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'mudanca-derruba-o-circulo' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'friendship-hours/idea.3.en.mp4',
               'duration_seconds', 72,
               'poster', 'friendship-hours/idea.3.en.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', 'O diagrama marca ''Month 14'' (o estudo acompanhou 18 meses) e troca a passagem escola→universidade por formandos em empregos novos; some a divisão por gênero (conversar x fazer junto).')),
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
      and i->>'id' = 'mudanca-derruba-o-circulo'
      and i->'video'->'en'->>'path' = 'friendship-hours/idea.3.en.mp4'
  ) then
    raise exception 'learning_notebook: friendship-hours/mudanca-derruba-o-circulo video.en was not updated';
  end if;
end
$guard$;

-- protein-distribution-30g-myth · buraco-do-cafe-da-manha · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'buraco-do-cafe-da-manha' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'protein-distribution-30g-myth/idea.3.en.mp4',
               'duration_seconds', 78,
               'poster', 'protein-distribution-30g-myth/idea.3.en.poster.webp',
               'fidelity_score', 75,
               'needs_review', true,
               'fidelity_note', 'Diz ''o jantar sabota'' e ''25% mais músculo''; o texto fala em 25% mais síntese proteica em 8 adultos, sem sabotagem. Some o alerta de doença renal.')),
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
      and i->>'id' = 'buraco-do-cafe-da-manha'
      and i->'video'->'en'->>'path' = 'protein-distribution-30g-myth/idea.3.en.mp4'
  ) then
    raise exception 'learning_notebook: protein-distribution-30g-myth/buraco-do-cafe-da-manha video.en was not updated';
  end if;
end
$guard$;

-- cbt-i-vs-sleep-hygiene · levante-em-20-minutos · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'levante-em-20-minutos' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'cbt-i-vs-sleep-hygiene/idea.3.en.mp4',
               'duration_seconds', 75,
               'poster', 'cbt-i-vs-sleep-hygiene/idea.3.en.poster.webp',
               'fidelity_score', 85,
               'needs_review', true,
               'fidelity_note', 'Apresenta o controle de estímulo como a técnica que resolve a insônia crônica; o texto diz que é uma das peças da TCC-I. Bootzin/1972 somem.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'cbt-i-vs-sleep-hygiene';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'cbt-i-vs-sleep-hygiene'
      and i->>'id' = 'levante-em-20-minutos'
      and i->'video'->'en'->>'path' = 'cbt-i-vs-sleep-hygiene/idea.3.en.mp4'
  ) then
    raise exception 'learning_notebook: cbt-i-vs-sleep-hygiene/levante-em-20-minutos video.en was not updated';
  end if;
end
$guard$;

-- play-deprivation-adults · final-em-aberto · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'final-em-aberto' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'play-deprivation-adults/idea.3.en.mp4',
               'duration_seconds', 72,
               'poster', 'play-deprivation-adults/idea.3.en.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', 'Mostra ''PLAY DETECTED: 0%'' como medição e omite a ressalva do texto (não é diagnóstico, não existe escala de privação de brincar); troca a ação por ''corte um bloco de descanso''.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'play-deprivation-adults';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'play-deprivation-adults'
      and i->>'id' = 'final-em-aberto'
      and i->'video'->'en'->>'path' = 'play-deprivation-adults/idea.3.en.mp4'
  ) then
    raise exception 'learning_notebook: play-deprivation-adults/final-em-aberto video.en was not updated';
  end if;
end
$guard$;

-- summary-psychology-of-money · educacao-financeira-funciona · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'educacao-financeira-funciona' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'summary-psychology-of-money/idea.3.en.mp4',
               'duration_seconds', 70,
               'poster', 'summary-psychology-of-money/idea.3.en.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', 'Acrescenta uma curva de decaimento (o efeito some em meses, o orçamento falha no ano 1-2) que o corpo do texto não traz; omite os 76 ensaios e o efeito 3x maior.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'summary-psychology-of-money';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'summary-psychology-of-money'
      and i->>'id' = 'educacao-financeira-funciona'
      and i->'video'->'en'->>'path' = 'summary-psychology-of-money/idea.3.en.mp4'
  ) then
    raise exception 'learning_notebook: summary-psychology-of-money/educacao-financeira-funciona video.en was not updated';
  end if;
end
$guard$;

-- summary-good-life · fitness-social · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'fitness-social' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'summary-good-life/idea.3.en.mp4',
               'duration_seconds', 56,
               'poster', 'summary-good-life/idea.3.en.poster.webp',
               'fidelity_score', 85,
               'needs_review', true,
               'fidelity_note', 'Atribui a um ''estudo'' que vínculos não são estados permanentes; no texto é a proposta dos autores (aptidão social); Harvard e os 85 anos somem.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'summary-good-life';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'summary-good-life'
      and i->>'id' = 'fitness-social'
      and i->'video'->'en'->>'path' = 'summary-good-life/idea.3.en.mp4'
  ) then
    raise exception 'learning_notebook: summary-good-life/fitness-social video.en was not updated';
  end if;
end
$guard$;

-- glossary-romance · manutencao-e-comportamento · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'manutencao-e-comportamento' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-romance/idea.3.en.mp4',
               'duration_seconds', 75,
               'poster', 'glossary-romance/idea.3.en.poster.webp',
               'fidelity_score', 65,
               'needs_review', true,
               'fidelity_note', 'Rótulo ''165,000 Couples'' (texto: 165 mil pessoas); reduz as cinco estratégias a tarefas domésticas e sugere que o casal fica preso no vale sem agir, quando o texto diz que a satisfação volta a subir para muitos casais.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'glossary-romance';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'glossary-romance'
      and i->>'id' = 'manutencao-e-comportamento'
      and i->'video'->'en'->>'path' = 'glossary-romance/idea.3.en.mp4'
  ) then
    raise exception 'learning_notebook: glossary-romance/manutencao-e-comportamento video.en was not updated';
  end if;
end
$guard$;

-- glossary-play · pior-semana-hobby · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'pior-semana-hobby' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-play/idea.3.en.mp4',
               'duration_seconds', 67,
               'poster', 'glossary-play/idea.3.en.poster.webp',
               'fidelity_score', 70,
               'needs_review', true,
               'fidelity_note', 'Diz que o descanso passivo ignora sentido e conexão e não recarrega nada, e que ''crafting'' é a melhor forma de recuperar; o texto avisa que nem todo lazer precisa de meta (o tédio sem rumo alimenta a criatividade).')),
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
      and i->>'id' = 'pior-semana-hobby'
      and i->'video'->'en'->>'path' = 'glossary-play/idea.3.en.mp4'
  ) then
    raise exception 'learning_notebook: glossary-play/pior-semana-hobby video.en was not updated';
  end if;
end
$guard$;

-- glossary-nutrition · tres-numeros-da-comida · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'tres-numeros-da-comida' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-nutrition/idea.3.en.mp4',
               'duration_seconds', 73,
               'poster', 'glossary-nutrition/idea.3.en.poster.webp',
               'fidelity_score', 75,
               'needs_review', true,
               'fidelity_note', 'Diz que a fibra entra com zero calorias, sem somar uma única caloria ao dia (o texto diz que sacia com menos calorias); some a ressalva de que a evidência é populacional, uma aposta e não uma lei.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'glossary-nutrition';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'glossary-nutrition'
      and i->>'id' = 'tres-numeros-da-comida'
      and i->'video'->'en'->>'path' = 'glossary-nutrition/idea.3.en.mp4'
  ) then
    raise exception 'learning_notebook: glossary-nutrition/tres-numeros-da-comida video.en was not updated';
  end if;
end
$guard$;

-- glossary-dexterity · equilibrio-corta-quedas · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'equilibrio-corta-quedas' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-dexterity/idea.3.en.mp4',
               'duration_seconds', 61,
               'poster', 'glossary-dexterity/idea.3.en.poster.webp',
               'fidelity_score', 85,
               'needs_review', true,
               'fidelity_note', 'Narra um mecanismo (o músculo treinado segura o tornozelo no tropeço) que o texto não descreve; omite a dose de 3 sessões por semana, a revisão Cochrane e os 55% do Tai Chi.')),
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
      and i->>'id' = 'equilibrio-corta-quedas'
      and i->'video'->'en'->>'path' = 'glossary-dexterity/idea.3.en.mp4'
  ) then
    raise exception 'learning_notebook: glossary-dexterity/equilibrio-corta-quedas video.en was not updated';
  end if;
end
$guard$;

commit;
