-- migration: 20261008000002_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-10-08, rodada das 09h (.claude/agents/learning-notebook-runner.md):
--          vídeo "Resumo em Vídeo" Curta de 27 ideias (fonte restrita ao documento da ideia,
--          18 retomados das duas rodadas de 2026-10-07 (draft PR #526: as migrations
--          20261007000001/000002 nunca foram aplicadas por causa do drift de 20261006000004 e
--          ficaram abaixo da cabeça da cloud) + 9 desta rodada;
--          cartão final cortado por tools/content-media/video.mjs).
--          Portão de fidelidade (§6b): grade lida às cegas (learning-card-tester) + faixa de
--          legendas comparadas com o verso e o corpo da ideia. Todo lado leva fidelity_score;
--          abaixo de 90 leva também needs_review = true e fidelity_note (sobe mesmo assim,
--          decisão de 2026-10-05; revisão = tier 7, menor nota primeiro).
--          jsonb_set cirúrgico no lado do vídeo de uma ideia, por id, com guarda pós-update.
--          (summary-why-we-sleep · ortossonia · pt NÃO sobe: o corte do cartão final falhou; summary-deep-work · doze-por-cento · en falhou duas vezes no Notebook em 2026-10-07 e segue na fila.)
--
--          vídeos (slug · ideia · lado · título no Estúdio · duração s · score):
--            explainer-career-capital · interesse-construido · en · "Why Finding Your Passion Makes You Quit" · 69 · 75
--            summary-atomic-habits · ambiente-vence-vontade · en · "How Context Beats Willpower" · 71 · 65
--            non-instrumental-play · espaco-sem-placar · en · "Why Your Paid Hobby Exhausts You" · 83 · 75
--            summary-antifragile · via-negativa · en · "Why Removing Beats Adding Every Time" · 72 · 75
--            does-money-buy-happiness · renda-logaritmica · en · "Why Buying Happiness Gets Exponentially Harder" · 77 · 70
--            attachment-styles-love · alarme-e-botao-de-mudo · en · "How the Attachment Alarm Drives Relationship Fights" · 79 · 80
--            summary-outlive · risco-treinavel · en · "How to Structure Workouts for Longevity" · 76 · 70
--            summary-why-we-sleep · sete-ou-mais · en · "Why 8 Hours of Sleep Is a Myth" · 70 · 80
--            glossary-sleep · fome-da-noite-curta · en · "Why Sleep Deprivation Causes Carb Cravings" · 76 · 80
--            glossary-strength · piso-semanal-oms · en · "The Weekly Floor of Strength Training" · 72 · 80
--            friendship-hours · mudanca-derruba-o-circulo · pt · "Por Que Suas Amizades Estão Acabando" · 61 · 80
--            protein-distribution-30g-myth · buraco-do-cafe-da-manha · pt · "Como Dividir Sua Proteína Para Ganhar Músculo" · 72 · 65
--            cbt-i-vs-sleep-hygiene · levante-em-20-minutos · pt · "Por que sair da cama cura a insônia" · 67 · 75
--            play-deprivation-adults · final-em-aberto · pt · "Como Voltar a Brincar na Vida Adulta" · 55 · 85
--            summary-psychology-of-money · educacao-financeira-funciona · pt · "Por que a educação financeira tem validade" · 70 · 70
--            summary-good-life · fitness-social · pt · "Por que suas amizades precisam de treino" · 73 · 85
--            glossary-romance · manutencao-e-comportamento · pt · "Por Que Amor É Comportamento, Não Sentimento" · 61 · 80
--            glossary-play · pior-semana-hobby · pt · "Por Que Semanas Pesadas Exigem Novos Hobbies" · 56 · 65
--            glossary-nutrition · tres-numeros-da-comida · pt · "Como a fibra funciona no seu corpo" · 68 · 80
--            glossary-dexterity · equilibrio-corta-quedas · pt · "Como a Mobilidade Ativa Previne Quedas" · 63 · 80
--            glossary-contemplate · portas-da-contemplacao · pt · "Como usar a escrita para treinar o foco" · 64 · 85
--            glossary-career · chamado-armadilha · pt · "Como amar o emprego vira uma armadilha" · 64 · 80
--            summary-atomic-habits · voto-na-identidade · pt · "Como a Identidade Cria Hábitos" · 80 · 55
--            summary-antifragile · barbell · pt · "Como a Estratégia Barbell Blinda Seu Dinheiro" · 70 · 60
--            summary-deep-work · bloco-ritmico · pt · "Como Ter Foco Com a Filosofia Rítmica" · 64 · 75
--            summary-outlive · decatlo-centenario · pt · "A Matemática do Decatlo Centenário para o Futuro" · 64 · 80
--            glossary-sleep · dirigir-com-sono · pt · "O limite de 17 horas sem dormir" · 57 · 85

begin;

-- explainer-career-capital · interesse-construido · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'interesse-construido' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'explainer-career-capital/idea.2.en.mp4',
               'duration_seconds', 69,
               'poster', 'explainer-career-capital/idea.2.en.poster.webp',
               'fidelity_score', 75,
               'needs_review', true,
               'fidelity_note', 'O gráfico do mindset de crescimento mostra motivação estável; o texto diz que ela cai menos. Prancheta de "Psychological Well-Being Survey" e "Stanford" não estão na fonte.')),
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
      and i->>'id' = 'interesse-construido'
      and i->'video'->'en'->>'path' = 'explainer-career-capital/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: explainer-career-capital/interesse-construido video.en was not updated';
  end if;
end
$guard$;

-- summary-atomic-habits · ambiente-vence-vontade · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'ambiente-vence-vontade' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'summary-atomic-habits/idea.2.en.mp4',
               'duration_seconds', 71,
               'poster', 'summary-atomic-habits/idea.2.en.poster.webp',
               'fidelity_score', 65,
               'needs_review', true,
               'fidelity_note', 'A prática bate (encaixar no café, 1 página, 2 minutos), mas o estudo de Wendy Wood (43%) e a ressalva de que o loop não é descoberta do Clear (ratos) não aparecem.')),
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
      and i->'video'->'en'->>'path' = 'summary-atomic-habits/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: summary-atomic-habits/ambiente-vence-vontade video.en was not updated';
  end if;
end
$guard$;

-- non-instrumental-play · espaco-sem-placar · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'espaco-sem-placar' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'non-instrumental-play/idea.2.en.mp4',
               'duration_seconds', 83,
               'poster', 'non-instrumental-play/idea.2.en.poster.webp',
               'fidelity_score', 75,
               'needs_review', true,
               'fidelity_note', 'Fotógrafo, cortisol e ausência de demanda batem, mas a meta-análise de Deci (1999) some e o vídeo enquadra como "armadilha biológica" com cortisol subindo "instantaneamente".')),
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
      and i->>'id' = 'espaco-sem-placar'
      and i->'video'->'en'->>'path' = 'non-instrumental-play/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: non-instrumental-play/espaco-sem-placar video.en was not updated';
  end if;
end
$guard$;

-- summary-antifragile · via-negativa · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'via-negativa' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'summary-antifragile/idea.2.en.mp4',
               'duration_seconds', 72,
               'poster', 'summary-antifragile/idea.2.en.poster.webp',
               'fidelity_score', 75,
               'needs_review', true,
               'fidelity_note', 'Via negativa, iatrogenia e cortar ultraprocessado/assinatura batem, mas o vídeo diz que a via negativa "prova quase sempre" e que o sistema "se estabiliza naturalmente"; somem Illich e os exemplos (cigarro, gordura trans, talidomida).')),
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
      and i->>'id' = 'via-negativa'
      and i->'video'->'en'->>'path' = 'summary-antifragile/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: summary-antifragile/via-negativa video.en was not updated';
  end if;
end
$guard$;

-- does-money-buy-happiness · renda-logaritmica · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'renda-logaritmica' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'does-money-buy-happiness/idea.2.en.mp4',
               'duration_seconds', 77,
               'poster', 'does-money-buy-happiness/idea.2.en.poster.webp',
               'fidelity_score', 70,
               'needs_review', true,
               'fidelity_note', 'Renda em log, dobrar de 30 mil e de 300 mil e o trajeto curto batem, mas o vídeo diz que +30 mil não muda "nada" a alegria de quem ganha 300 mil e some a ressalva (estudos americanos, correlacionais, medidos até ~500 mil).')),
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
      and i->>'id' = 'renda-logaritmica'
      and i->'video'->'en'->>'path' = 'does-money-buy-happiness/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: does-money-buy-happiness/renda-logaritmica video.en was not updated';
  end if;
end
$guard$;

-- attachment-styles-love · alarme-e-botao-de-mudo · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'alarme-e-botao-de-mudo' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'attachment-styles-love/idea.2.en.mp4',
               'duration_seconds', 79,
               'poster', 'attachment-styles-love/idea.2.en.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', 'Alarme, volume alto x mudo, silêncio que mascara o mesmo alarme, dança de perseguir e recuar e "estou me sentindo inseguro" batem; o estudo com 539 casais recém-casados (Peters et al., 2025) não aparece.')),
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
      and i->>'id' = 'alarme-e-botao-de-mudo'
      and i->'video'->'en'->>'path' = 'attachment-styles-love/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: attachment-styles-love/alarme-e-botao-de-mudo video.en was not updated';
  end if;
end
$guard$;

-- summary-outlive · risco-treinavel · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'risco-treinavel' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'summary-outlive/idea.2.en.mp4',
               'duration_seconds', 76,
               'poster', 'summary-outlive/idea.2.en.poster.webp',
               'fidelity_score', 70,
               'needs_review', true,
               'fidelity_note', 'Risco 5 vezes, 80/20 Zona 2 + VO2 máx batem, mas o vídeo põe na tela "3 horas/semana" (não está na fonte) e não mostra a ressalva de que o 80/20 vem de atletas de elite com evidência fraca.')),
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
      and i->>'id' = 'risco-treinavel'
      and i->'video'->'en'->>'path' = 'summary-outlive/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: summary-outlive/risco-treinavel video.en was not updated';
  end if;
end
$guard$;

-- summary-why-we-sleep · sete-ou-mais · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'sete-ou-mais' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'summary-why-we-sleep/idea.2.en.mp4',
               'duration_seconds', 70,
               'poster', 'summary-why-we-sleep/idea.2.en.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', '1,1 milhão de adultos, menor mortalidade perto de 7 h, risco abaixo de 6 h e acima de 8 h, curva em U batem; o vídeo chama de "estudo clínico" e não diz que é observacional (correlação, não causa).')),
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
      and i->>'id' = 'sete-ou-mais'
      and i->'video'->'en'->>'path' = 'summary-why-we-sleep/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: summary-why-we-sleep/sete-ou-mais video.en was not updated';
  end if;
end
$guard$;

-- glossary-sleep · fome-da-noite-curta · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'fome-da-noite-curta' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-sleep/idea.2.en.mp4',
               'duration_seconds', 76,
               'poster', 'glossary-sleep/idea.2.en.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', 'Duas noites curtas, grelina +28%, leptina -18% e decidir o almoço de manhã batem, mas o vídeo diz que dá pra comer muito e "continuar faminto" e reduz a faixa 33-45% a 45%.')),
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
      and i->>'id' = 'fome-da-noite-curta'
      and i->'video'->'en'->>'path' = 'glossary-sleep/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: glossary-sleep/fome-da-noite-curta video.en was not updated';
  end if;
end
$guard$;

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

-- glossary-nutrition · tres-numeros-da-comida · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'tres-numeros-da-comida' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-nutrition/idea.3.pt.mp4',
               'duration_seconds', 68,
               'poster', 'glossary-nutrition/idea.3.pt.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', 'Fibra não digerida, saciedade, bactérias, 25-30 g, mortalidade até 30% e quase ninguém chega lá batem, mas some a ressalva de que o dado é populacional (aposta, não lei) e a revisão da Lancet; o vídeo diz "nenhuma caloria" e que a fibra "te protege".')),
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
      and i->'video'->'pt'->>'path' = 'glossary-nutrition/idea.3.pt.mp4'
  ) then
    raise exception 'learning_notebook: glossary-nutrition/tres-numeros-da-comida video.pt was not updated';
  end if;
end
$guard$;

-- glossary-dexterity · equilibrio-corta-quedas · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'equilibrio-corta-quedas' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-dexterity/idea.3.pt.mp4',
               'duration_seconds', 63,
               'poster', 'glossary-dexterity/idea.3.pt.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', 'Alongar não evita queda, treinar equilíbrio de propósito, Tai Chi como treino disfarçado e flexibilidade x mobilidade ativa batem, mas somem todos os números (Cochrane 108 estudos/23 mil, 256 idosos e 55%, três vezes por semana, OMS) e o vídeo dramatiza um mecanismo (o cérebro perde o controle sob pressão) que a fonte não traz.')),
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
      and i->'video'->'pt'->>'path' = 'glossary-dexterity/idea.3.pt.mp4'
  ) then
    raise exception 'learning_notebook: glossary-dexterity/equilibrio-corta-quedas video.pt was not updated';
  end if;
end
$guard$;

-- glossary-contemplate · portas-da-contemplacao · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'portas-da-contemplacao' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-contemplate/idea.3.pt.mp4',
               'duration_seconds', 64,
               'poster', 'glossary-contemplate/idea.3.pt.poster.webp',
               'fidelity_score', 85,
               'needs_review', true,
               'fidelity_note', 'Escrever à mão 15 minutos, não é lista de tarefas nem diário de gratidão, gramática não importa, ganho maior sob muito estresse e voltar ao papel quando a cabeça foge batem; somem a meta-análise de 146 estudos (Frattaroli) e que o benefício é pequeno, e o vídeo vende a escrita como "treino de foco".')),
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
      and i->'video'->'pt'->>'path' = 'glossary-contemplate/idea.3.pt.mp4'
  ) then
    raise exception 'learning_notebook: glossary-contemplate/portas-da-contemplacao video.pt was not updated';
  end if;
end
$guard$;

-- glossary-career · chamado-armadilha · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'chamado-armadilha' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-career/idea.3.pt.mp4',
               'duration_seconds', 64,
               'poster', 'glossary-career/idea.3.pt.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', 'Tratadores de zoológico, salário baixo e hora extra aceitos por amor e o sacrifício reembalado como preço do privilégio batem, mas somem o estudo de 1997 (um terço dos 196, mais satisfeitos) que sustenta o lado bom do chamado, os autores (Wrzesniewski; Bunderson e Thompson) e o teste de levar uma condição pra mesa.')),
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
      and i->'video'->'pt'->>'path' = 'glossary-career/idea.3.pt.mp4'
  ) then
    raise exception 'learning_notebook: glossary-career/chamado-armadilha video.pt was not updated';
  end if;
end
$guard$;

-- summary-atomic-habits · voto-na-identidade · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'voto-na-identidade' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'summary-atomic-habits/idea.3.pt.mp4',
               'duration_seconds', 80,
               'poster', 'summary-atomic-habits/idea.3.pt.poster.webp',
               'fidelity_score', 55,
               'needs_review', true,
               'fidelity_note', '"Estou tentando" x "eu não sou fumante", cada ação como voto e a frase no presente batem, mas o vídeo vende a autoeficácia como "o segredo" e "crença comprovada", invertendo a ressalva central: a fonte diz que é o pilar com menos prova (Bandura é teoria geral, não estudo da identidade) e pede usar como bússola, não lei.')),
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
      and i->'video'->'pt'->>'path' = 'summary-atomic-habits/idea.3.pt.mp4'
  ) then
    raise exception 'learning_notebook: summary-atomic-habits/voto-na-identidade video.pt was not updated';
  end if;
end
$guard$;

-- summary-antifragile · barbell · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'barbell' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'summary-antifragile/idea.3.pt.mp4',
               'duration_seconds', 70,
               'poster', 'summary-antifragile/idea.3.pt.poster.webp',
               'fidelity_score', 60,
               'needs_review', true,
               'fidelity_note', '90% em segurança extrema e 10% em apostas ousadas, nada no meio, perda travada e emprego estável + projeto paralelo batem, mas o vídeo promete que o barbell "blinda" o dinheiro e deixa você "perfeitamente protegido", e some a ressalva de que a prova é o histórico do próprio Taleb (conflito de interesse) e que o salto pra mercados é analogia.')),
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
      and i->'video'->'pt'->>'path' = 'summary-antifragile/idea.3.pt.mp4'
  ) then
    raise exception 'learning_notebook: summary-antifragile/barbell video.pt was not updated';
  end if;
end
$guard$;

-- summary-deep-work · bloco-ritmico · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'bloco-ritmico' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'summary-deep-work/idea.3.pt.mp4',
               'duration_seconds', 64,
               'poster', 'summary-deep-work/idea.3.pt.poster.webp',
               'fidelity_score', 75,
               'needs_review', true,
               'fidelity_note', 'Bloco fixo de 90 minutos de manhã, antes de e-mail e reunião, virado hábito, batem; o vídeo acrescenta que o método "funciona", "elimina a fadiga de decisão" e preserva energia, e somem as quatro filosofias de Newport e o aviso de que os exemplos do livro controlam a própria agenda.')),
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
      and i->'video'->'pt'->>'path' = 'summary-deep-work/idea.3.pt.mp4'
  ) then
    raise exception 'learning_notebook: summary-deep-work/bloco-ritmico video.pt was not updated';
  end if;
end
$guard$;

-- summary-outlive · decatlo-centenario · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'decatlo-centenario' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'summary-outlive/idea.3.pt.mp4',
               'duration_seconds', 64,
               'poster', 'summary-outlive/idea.3.pt.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', 'Decatlo Centenário, queda de 10 a 15% por década depois dos 50 e chegar aos 50 com o dobro batem, mas o vídeo põe na tela uma lista própria de 5 tarefas e chama a conta de "matemática exata" que "garante" a força; somem a Década Marginal e que o número é o que Attia cita (não um estudo).')),
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
      and i->'video'->'pt'->>'path' = 'summary-outlive/idea.3.pt.mp4'
  ) then
    raise exception 'learning_notebook: summary-outlive/decatlo-centenario video.pt was not updated';
  end if;
end
$guard$;

-- glossary-sleep · dirigir-com-sono · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'dirigir-com-sono' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-sleep/idea.3.pt.mp4',
               'duration_seconds', 57,
               'poster', 'glossary-sleep/idea.3.pt.poster.webp',
               'fidelity_score', 85,
               'needs_review', true,
               'fidelity_note', '17 horas acordado = 0,05% no bafômetro, o cérebro esconde o cansaço e usar o relógio (somar as horas, sem descontar café) batem; somem as 24 horas = 0,10%, Dawson e Reid (Nature, 1997) e o estudo de Van Dongen (6 horas por 14 noites).')),
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
      and i->'video'->'pt'->>'path' = 'glossary-sleep/idea.3.pt.mp4'
  ) then
    raise exception 'learning_notebook: glossary-sleep/dirigir-com-sono video.pt was not updated';
  end if;
end
$guard$;

commit;
