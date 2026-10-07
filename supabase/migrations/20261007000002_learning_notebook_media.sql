-- migration: 20261007000002_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-10-07, rodada das 17h (.claude/agents/learning-notebook-runner.md):
--          vídeo "Resumo em Vídeo" Curta de 9 ideias (fonte restrita ao documento da ideia,
--          cartão final cortado por tools/content-media/video.mjs).
--          Portão de fidelidade (§6b): grade lida às cegas (learning-card-tester) + faixa de
--          legendas comparadas com o verso e o corpo da ideia. Todo lado leva fidelity_score;
--          abaixo de 90 leva também needs_review = true e fidelity_note (sobe mesmo assim,
--          decisão de 2026-10-05; revisão = tier 7, menor nota primeiro).
--          jsonb_set cirúrgico no lado do vídeo de uma ideia, por id, com guarda pós-update.
--          (summary-deep-work · doze-por-cento · en falhou de novo no Notebook e fica na fila.)
--
--          vídeos (slug · ideia · lado · título no Estúdio · duração s · score):
--            glossary-strength · piso-semanal-oms · en · "The Weekly Floor of Strength Training" · 72 · 80
--            friendship-hours · mudanca-derruba-o-circulo · pt · "Por Que Suas Amizades Estão Acabando" · 61 · 80
--            protein-distribution-30g-myth · buraco-do-cafe-da-manha · pt · "Como Dividir Sua Proteína Para Ganhar Músculo" · 72 · 65
--            cbt-i-vs-sleep-hygiene · levante-em-20-minutos · pt · "Por que sair da cama cura a insônia" · 67 · 75
--            play-deprivation-adults · final-em-aberto · pt · "Como Voltar a Brincar na Vida Adulta" · 55 · 85
--            summary-psychology-of-money · educacao-financeira-funciona · pt · "Por que a educação financeira tem validade" · 70 · 70
--            summary-good-life · fitness-social · pt · "Por que suas amizades precisam de treino" · 73 · 85
--            glossary-romance · manutencao-e-comportamento · pt · "Por Que Amor É Comportamento, Não Sentimento" · 61 · 80
--            glossary-play · pior-semana-hobby · pt · "Por Que Semanas Pesadas Exigem Novos Hobbies" · 56 · 65

begin;

-- glossary-strength · piso-semanal-oms · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'piso-semanal-oms' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-strength/idea.2.en.mp4',
               'duration_seconds', 72,
               'poster', 'glossary-strength/idea.2.en.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', 'OMS 2-3 sessões e 10 séries por grupo, 35/50/65 anos e dor não é medida batem, mas o gráfico mostra a curva de quem treina reta até os 65 com um "limiar de independência" que a fonte não traz; somem "perto da falha" e os 10 min de mobilidade.')),
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
      and i->>'id' = 'piso-semanal-oms'
      and i->'video'->'en'->>'path' = 'glossary-strength/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: glossary-strength/piso-semanal-oms video.en was not updated';
  end if;
end
$guard$;

-- friendship-hours · mudanca-derruba-o-circulo · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'mudanca-derruba-o-circulo' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'friendship-hours/idea.3.pt.mp4',
               'duration_seconds', 61,
               'poster', 'friendship-hours/idea.3.pt.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', '18 meses, amigos encolhem e família fica, "duas pessoas, não dez" e horário fixo no mesmo lugar batem, mas somem Roberts & Dunbar, os 48,6% x 70,3%, o painel alemão e a diferença por gênero; o vídeo põe a culpa na "espontaneidade".')),
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
      and i->'video'->'pt'->>'path' = 'friendship-hours/idea.3.pt.mp4'
  ) then
    raise exception 'learning_notebook: friendship-hours/mudanca-derruba-o-circulo video.pt was not updated';
  end if;
end
$guard$;

-- protein-distribution-30g-myth · buraco-do-cafe-da-manha · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'buraco-do-cafe-da-manha' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'protein-distribution-30g-myth/idea.3.pt.mp4',
               'duration_seconds', 72,
               'poster', 'protein-distribution-30g-myth/idea.3.pt.poster.webp',
               'fidelity_score', 65,
               'needs_review', true,
               'fidelity_note', 'Café 7 g, almoço 20 g, jantar 50+ e quatro doses de 20 g batem, mas o gráfico marca o que passa de ~20 g como "Excesso / Oxidado" e fala em "limite de absorção" (a fonte não diz isso e o material contesta esse limite); somem 0,4 g/kg, Mamerow/Areta e o aviso de doença renal.')),
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
      and i->'video'->'pt'->>'path' = 'protein-distribution-30g-myth/idea.3.pt.mp4'
  ) then
    raise exception 'learning_notebook: protein-distribution-30g-myth/buraco-do-cafe-da-manha video.pt was not updated';
  end if;
end
$guard$;

-- cbt-i-vs-sleep-hygiene · levante-em-20-minutos · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'levante-em-20-minutos' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'cbt-i-vs-sleep-hygiene/idea.3.pt.mp4',
               'duration_seconds', 67,
               'poster', 'cbt-i-vs-sleep-hygiene/idea.3.pt.poster.webp',
               'fidelity_score', 75,
               'needs_review', true,
               'fidelity_note', 'Cama virou gatilho de alerta, sair do quarto, luz fraca e voltar só com sono batem, mas o título promete que isso "cura a insônia" e o fim diz que o cérebro reaprende "de forma definitiva"; somem os 20 minutos, Bootzin e a TCC-I.')),
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
      and i->'video'->'pt'->>'path' = 'cbt-i-vs-sleep-hygiene/idea.3.pt.mp4'
  ) then
    raise exception 'learning_notebook: cbt-i-vs-sleep-hygiene/levante-em-20-minutos video.pt was not updated';
  end if;
end
$guard$;

-- play-deprivation-adults · final-em-aberto · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'final-em-aberto' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'play-deprivation-adults/idea.3.pt.mp4',
               'duration_seconds', 55,
               'poster', 'play-deprivation-adults/idea.3.pt.poster.webp',
               'fidelity_score', 85,
               'needs_review', true,
               'fidelity_note', 'Teste do último domingo, final em aberto, nada pra mostrar depois, elemento social e mudar o caminho batem; some a ressalva de que não é diagnóstico (sem escala de privação nem DSM; o questionário de Proyer mede o quanto você é brincalhão).')),
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
      and i->'video'->'pt'->>'path' = 'play-deprivation-adults/idea.3.pt.mp4'
  ) then
    raise exception 'learning_notebook: play-deprivation-adults/final-em-aberto video.pt was not updated';
  end if;
end
$guard$;

-- summary-psychology-of-money · educacao-financeira-funciona · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'educacao-financeira-funciona' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'summary-psychology-of-money/idea.3.pt.mp4',
               'duration_seconds', 70,
               'poster', 'summary-psychology-of-money/idea.3.pt.poster.webp',
               'fidelity_score', 70,
               'needs_review', true,
               'fidelity_note', '160 mil participantes, efeito 3 vezes maior e um livro/curso por ano como consulta batem, mas o vídeo desenha uma curva de adesão que despenca em 12 meses e promete a conta "definitivamente no azul" (dados e promessa que a fonte não traz); somem Kaiser/Lusardi, os 76 experimentos e a ressalva de que as frases do livro são aforismos.')),
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
      and i->'video'->'pt'->>'path' = 'summary-psychology-of-money/idea.3.pt.mp4'
  ) then
    raise exception 'learning_notebook: summary-psychology-of-money/educacao-financeira-funciona video.pt was not updated';
  end if;
end
$guard$;

-- summary-good-life · fitness-social · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'fitness-social' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'summary-good-life/idea.3.pt.mp4',
               'duration_seconds', 73,
               'poster', 'summary-good-life/idea.3.pt.poster.webp',
               'fidelity_score', 85,
               'needs_review', true,
               'fidelity_note', 'Fitness social, laço que atrofia como músculo, tempo recorrente e a mensagem adiada batem; o vídeo diz que o estudo de 85 anos de Harvard "provou" isso, quando a fonte apresenta como proposta dos autores (Waldinger e Schulz).')),
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
      and i->'video'->'pt'->>'path' = 'summary-good-life/idea.3.pt.mp4'
  ) then
    raise exception 'learning_notebook: summary-good-life/fitness-social video.pt was not updated';
  end if;
end
$guard$;

-- glossary-romance · manutencao-e-comportamento · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'manutencao-e-comportamento' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-romance/idea.3.pt.mp4',
               'duration_seconds', 61,
               'poster', 'glossary-romance/idea.3.pt.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', '165 estudos, 165 mil pessoas, o vale dos 10 anos e as cinco atitudes (ser leve, futuro, puxar a sua parte, amigos em comum) batem, mas o gráfico faz a curva voltar a subir "com ação" (a fonte só diz que ela sobe pra muitos casais); Stafford e Canary não aparecem.')),
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
      and i->'video'->'pt'->>'path' = 'glossary-romance/idea.3.pt.mp4'
  ) then
    raise exception 'learning_notebook: glossary-romance/manutencao-e-comportamento video.pt was not updated';
  end if;
end
$guard$;

-- glossary-play · pior-semana-hobby · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'pior-semana-hobby' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-play/idea.3.pt.mp4',
               'duration_seconds', 56,
               'poster', 'glossary-play/idea.3.pt.poster.webp',
               'fidelity_score', 65,
               'needs_review', true,
               'fidelity_note', 'Propósito + conexão, lazer com meta e aprendizado e marcar o hobby como compromisso batem, mas o vídeo diz que o descanso passivo não restaura e a bateria "continua vazando" (a fonte ressalva que o tédio sem meta também ajuda) e promete "energia vital restaurada"; somem os 363 estudos e Petrou & Bakker.')),
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
      and i->'video'->'pt'->>'path' = 'glossary-play/idea.3.pt.mp4'
  ) then
    raise exception 'learning_notebook: glossary-play/pior-semana-hobby video.pt was not updated';
  end if;
end
$guard$;

commit;
