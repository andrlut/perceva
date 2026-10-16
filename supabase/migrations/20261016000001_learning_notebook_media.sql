-- migration: 20261016000001_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-10-16, rodada das 09h (.claude/agents/learning-notebook-runner.md):
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
--            cbt-i-vs-sleep-hygiene · lista-nao-e-tratamento · en · "Why Chronic Insomnia Needs CBT-I" · 72 · 80
--            ikea-effect · apego-no-montador · en · "Why You Overvalue Your Own Work" · 62 · 70
--            attention-residue · residuo-cobra-da-proxima · en · "Why Your 2PM Wrecks Your 3PM" · 79 · 60
--            grip-strength-longevity · aperto-bate-a-pressao · en · "Why Your Grip Strength Predicts Your Lifespan" · 62 · 65
--            play-deprivation-adults · instinto-nao-passatempo · en · "Why Your Brain Wires Play Like Hunger" · 63 · 65
--            ten-second-balance-test · capacidade-que-some · en · "Why the One-Leg Stand Exposes Aging" · 75 · 80
--            catch-up-sleep-weekend · acorda-descansado · en · "Catch-Up Sleep: The Six-Hour Threshold Explained" · 69 · 55
--            summary-psychology-of-money · comportamento-vence-diploma · en · "Why Your Decade Decides Your Wealth" · 82 · 75
--            summary-good-life · relacao-preve-saude · en · "Why Relationships Predict Your Health" · 83 · 80
--            glossary-nutrition · ultraprocessado-come-mais · en · "Why Ultra-Processed Food Fools Your Appetite" · 69 · 80

begin;

-- cbt-i-vs-sleep-hygiene · lista-nao-e-tratamento · video.en (fidelity 80)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'lista-nao-e-tratamento' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'cbt-i-vs-sleep-hygiene/idea.1.en.v2.mp4',
               'duration_seconds', 72,
               'poster', 'cbt-i-vs-sleep-hygiene/idea.1.en.v2.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', 'Promete que a TCC-I ''reconstrói por completo'' o sono com ''descanso consistente e confiável'' e acrescenta o ''impulso homeostático do sono'', que o texto não traz; omite ACP 2016 e AASM.')),
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
      and i->>'id' = 'lista-nao-e-tratamento'
      and i->'video'->'en'->>'path' = 'cbt-i-vs-sleep-hygiene/idea.1.en.v2.mp4'
      and i->'video'->'en'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: cbt-i-vs-sleep-hygiene/lista-nao-e-tratamento video.en was not updated';
  end if;
end
$guard$;

-- ikea-effect · apego-no-montador · video.en (fidelity 70)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'apego-no-montador' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'ikea-effect/idea.1.en.v2.mp4',
               'duration_seconds', 62,
               'poster', 'ikea-effect/idea.1.en.v2.poster.webp',
               'fidelity_score', 70,
               'needs_review', true,
               'fidelity_note', 'Vende "terminar" como condição estrita e fixa do efeito; omite a réplica com kits que achou apego até em obra inacabada e a meta-análise (55 estudos) que dá efeito moderado.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'ikea-effect';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'ikea-effect'
      and i->>'id' = 'apego-no-montador'
      and i->'video'->'en'->>'path' = 'ikea-effect/idea.1.en.v2.mp4'
      and i->'video'->'en'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: ikea-effect/apego-no-montador video.en was not updated';
  end if;
end
$guard$;

-- attention-residue · residuo-cobra-da-proxima · video.en (fidelity 60)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'residuo-cobra-da-proxima' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'attention-residue/idea.1.en.v2.mp4',
               'duration_seconds', 79,
               'poster', 'attention-residue/idea.1.en.v2.poster.webp',
               'fidelity_score', 60,
               'needs_review', true,
               'fidelity_note', 'Inventa tempos de reação na tela (0,85 s vs 0,23 s) que o texto não traz, crava "o foco é uma ilusão" e omite a ressalva: estudo de laboratório, amostra universitária, sem réplica independente.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'attention-residue';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'attention-residue'
      and i->>'id' = 'residuo-cobra-da-proxima'
      and i->'video'->'en'->>'path' = 'attention-residue/idea.1.en.v2.mp4'
      and i->'video'->'en'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: attention-residue/residuo-cobra-da-proxima video.en was not updated';
  end if;
end
$guard$;

-- grip-strength-longevity · aperto-bate-a-pressao · video.en (fidelity 65)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'aperto-bate-a-pressao' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'grip-strength-longevity/idea.1.en.v2.mp4',
               'duration_seconds', 62,
               'poster', 'grip-strength-longevity/idea.1.en.v2.poster.webp',
               'fidelity_score', 65,
               'needs_review', true,
               'fidelity_note', 'Repete a manchete que o texto desmonta: aperto "muito mais preciso" que o manguito, sem dizer que a comparação foi só com a pressão sistólica nem que a coorte ia de 35 a 70 anos; números (142.861, 5 kg/16%, 27/16 kg) certos.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'grip-strength-longevity';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'grip-strength-longevity'
      and i->>'id' = 'aperto-bate-a-pressao'
      and i->'video'->'en'->>'path' = 'grip-strength-longevity/idea.1.en.v2.mp4'
      and i->'video'->'en'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: grip-strength-longevity/aperto-bate-a-pressao video.en was not updated';
  end if;
end
$guard$;

-- play-deprivation-adults · instinto-nao-passatempo · video.en (fidelity 65)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'instinto-nao-passatempo' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'play-deprivation-adults/idea.1.en.v2.mp4',
               'duration_seconds', 63,
               'poster', 'play-deprivation-adults/idea.1.en.v2.poster.webp',
               'fidelity_score', 65,
               'needs_review', true,
               'fidelity_note', 'Afirma como fato que a vontade de brincar "se acumula" quando não gasta e a chama de "instinto de sobrevivência"; o texto diz que o acúmulo é especulação de Panksepp, tirada de ratos. Omite os 50 kHz e a fonte (Panksepp & Burgdorf 2000).')),
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
      and i->>'id' = 'instinto-nao-passatempo'
      and i->'video'->'en'->>'path' = 'play-deprivation-adults/idea.1.en.v2.mp4'
      and i->'video'->'en'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: play-deprivation-adults/instinto-nao-passatempo video.en was not updated';
  end if;
end
$guard$;

-- ten-second-balance-test · capacidade-que-some · video.en (fidelity 80)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'capacidade-que-some' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'ten-second-balance-test/idea.1.en.v2.mp4',
               'duration_seconds', 75,
               'poster', 'ten-second-balance-test/idea.1.en.v2.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', 'Fica na ideia (base do tamanho de um pé, correções de milímetros, cai mais rápido com a idade que a força), mas acrescenta "latência" como mecanismo e deixa de fora o estudo brasileiro (4,6% vs 17,5%), a ressalva da meta-análise e o protocolo completo.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'ten-second-balance-test';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'ten-second-balance-test'
      and i->>'id' = 'capacidade-que-some'
      and i->'video'->'en'->>'path' = 'ten-second-balance-test/idea.1.en.v2.mp4'
      and i->'video'->'en'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: ten-second-balance-test/capacidade-que-some video.en was not updated';
  end if;
end
$guard$;

-- catch-up-sleep-weekend · acorda-descansado · video.en (fidelity 55)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'acorda-descansado' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'catch-up-sleep-weekend/idea.1.en.v2.mp4',
               'duration_seconds', 69,
               'poster', 'catch-up-sleep-weekend/idea.1.en.v2.poster.webp',
               'fidelity_score', 55,
               'needs_review', true,
               'fidelity_note', 'Vende a associação do ELSA-Brasil como proteção e reparo ("Arteries Protected", "Repair Triggered") e some com o Depner: no laboratório o metabolismo não se recupera mesmo dormindo até tarde. Também omite o 19% sem revisão e o Biobank sem benefício.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'catch-up-sleep-weekend';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'catch-up-sleep-weekend'
      and i->>'id' = 'acorda-descansado'
      and i->'video'->'en'->>'path' = 'catch-up-sleep-weekend/idea.1.en.v2.mp4'
      and i->'video'->'en'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: catch-up-sleep-weekend/acorda-descansado video.en was not updated';
  end if;
end
$guard$;

-- summary-psychology-of-money · comportamento-vence-diploma · video.en (fidelity 75)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'comportamento-vence-diploma' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'summary-psychology-of-money/idea.1.en.v2.mp4',
               'duration_seconds', 82,
               'poster', 'summary-psychology-of-money/idea.1.en.v2.poster.webp',
               'fidelity_score', 75,
               'needs_review', true,
               'fidelity_note', 'Troca o "em parte" do texto por determinismo (o mercado da juventude "crava" o apetite a risco) e desenha uma "década formativa" de 10 a 20 anos que o texto não traz; Grace Groner, US$ 7 mi e o executivo falido batem.')),
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
      and i->>'id' = 'comportamento-vence-diploma'
      and i->'video'->'en'->>'path' = 'summary-psychology-of-money/idea.1.en.v2.mp4'
      and i->'video'->'en'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: summary-psychology-of-money/comportamento-vence-diploma video.en was not updated';
  end if;
end
$guard$;

-- summary-good-life · relacao-preve-saude · video.en (fidelity 80)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'relacao-preve-saude' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'summary-good-life/idea.1.en.v2.mp4',
               'duration_seconds', 83,
               'poster', 'summary-good-life/idea.1.en.v2.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', 'Chama a associação da meta-análise de "impulso de 50% na sobrevivência" e põe colesterol, genes e riqueza como "resultado misto" sem dizer que a comparação com o colesterol vem das entrevistas do Waldinger, não de tabela publicada; a ressalva de que causa não foi provada aparece.')),
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
      and i->>'id' = 'relacao-preve-saude'
      and i->'video'->'en'->>'path' = 'summary-good-life/idea.1.en.v2.mp4'
      and i->'video'->'en'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: summary-good-life/relacao-preve-saude video.en was not updated';
  end if;
end
$guard$;

-- glossary-nutrition · ultraprocessado-come-mais · video.en (fidelity 80)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'ultraprocessado-come-mais' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-nutrition/idea.1.en.v2.mp4',
               'duration_seconds', 69,
               'poster', 'glossary-nutrition/idea.1.en.v2.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', 'Números e mecanismo batem (NIH, ~500 kcal, macio e denso, saciedade atrasada), mas diz que o ultraprocessado é "projetado" para driblar a saciedade e não mostra a ressalva: estudo pequeno e curto, prova que se come mais, não que se adoece.')),
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
      and i->>'id' = 'ultraprocessado-come-mais'
      and i->'video'->'en'->>'path' = 'glossary-nutrition/idea.1.en.v2.mp4'
      and i->'video'->'en'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: glossary-nutrition/ultraprocessado-come-mais video.en was not updated';
  end if;
end
$guard$;

commit;
