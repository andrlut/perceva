-- migration: 20261013000002_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-10-13, rodada das 20h (.claude/agents/learning-notebook-runner.md):
--          10 vídeos "Resumo em Vídeo" Curta, tier 6 (o vídeo anterior carregava text_revised_at;
--          refeitos a partir do texto revisado da ideia 1 PT, em caminho .v2/.v3 — o objeto novo não
--          carrega text_revised_at, o que marca o vídeo como atual), fonte restrita ao documento
--          da ideia, foco genérico; cartão final cortado por tools/content-media/video.mjs.
--          Portão de fidelidade (§6b): grade de quadros + faixa de legendas lidas às cegas
--          (learning-card-tester) e comparadas com o verso e o corpo da ideia. Todo lado leva
--          fidelity_score; abaixo de 90 leva também needs_review = true e fidelity_note (sobe mesmo
--          assim, decisão de 2026-10-05; revisão = tier 7, menor nota primeiro).
--          Vídeo: jsonb_set cirúrgico no lado do vídeo de uma ideia, por id, com guarda pós-update.
--
--          vídeos (slug · ideia · lado · título no Estúdio · duração s · score):
--            ikea-effect · apego-no-montador · pt · "Como o Efeito IKEA Engana a Mente" · 51 · 75
--            attention-residue · residuo-cobra-da-proxima · pt · "Como o Resíduo de Atenção Sabota o Foco" · 76 · 75
--            play-deprivation-adults · instinto-nao-passatempo · pt · "Vontade de Brincar: Por Que Age Como Fome" · 65 · 60
--            grip-strength-longevity · aperto-bate-a-pressao · pt · "Como o Aperto de Mão Prevê a Mortalidade" · 77 · 65
--            ten-second-balance-test · capacidade-que-some · pt · "Por que a musculação não salva seu equilíbrio" · 75 · 80
--            catch-up-sleep-weekend · acorda-descansado · pt · "Por que dormir até tarde no sábado não funciona" · 65 · 75
--            summary-psychology-of-money · comportamento-vence-diploma · pt · "Como o Seu Apetite ao Risco é Moldado" · 57 · 80
--            summary-good-life · relacao-preve-saude · pt · "Como Suas Relações Preveem Sua Longevidade" · 76 · 50
--            glossary-play · sofa-um-pedaco · pt · "Por Que o Sofá Não Te Descansa" · 66 · 60
--            cbt-i-vs-sleep-hygiene · lista-nao-e-tratamento · pt · "Por Que a Higiene do Sono Falha" · 64 · 80

begin;

-- ikea-effect · apego-no-montador · video.pt (fidelity 75)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'apego-no-montador' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'ikea-effect/idea.1.pt.v2.mp4',
               'duration_seconds', 51,
               'poster', 'ikea-effect/idea.1.pt.v2.poster.webp',
               'fidelity_score', 75,
               'needs_review', true,
               'fidelity_note', 'Chama o viés de duradouro e diz que interromper a montagem apaga o valor extra na hora; o texto diz efeito moderado e que uma replicação achou apego mesmo em trabalho não terminado. Omite os 55 estudos e o cinco vezes mais.')),
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
      and i->'video'->'pt'->>'path' = 'ikea-effect/idea.1.pt.v2.mp4'
      and i->'video'->'pt'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: ikea-effect/apego-no-montador video.pt was not updated';
  end if;
end
$guard$;

-- attention-residue · residuo-cobra-da-proxima · video.pt (fidelity 75)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'residuo-cobra-da-proxima' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'attention-residue/idea.1.pt.v2.mp4',
               'duration_seconds', 76,
               'poster', 'attention-residue/idea.1.pt.v2.poster.webp',
               'fidelity_score', 75,
               'needs_review', true,
               'fidelity_note', 'Mecanismo e exemplo 14h/15h certos, mas some o experimento de Leroy (anagramas, currículos) e a ressalva de laboratório sem replicação; acrescenta um déficit cognitivo invisível que o texto não afirma.')),
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
      and i->'video'->'pt'->>'path' = 'attention-residue/idea.1.pt.v2.mp4'
      and i->'video'->'pt'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: attention-residue/residuo-cobra-da-proxima video.pt was not updated';
  end if;
end
$guard$;

-- play-deprivation-adults · instinto-nao-passatempo · video.pt (fidelity 60)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'instinto-nao-passatempo' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'play-deprivation-adults/idea.1.pt.v2.mp4',
               'duration_seconds', 65,
               'poster', 'play-deprivation-adults/idea.1.pt.v2.poster.webp',
               'fidelity_score', 60,
               'needs_review', true,
               'fidelity_note', 'Ratos, 50 kHz e circuito subcortical na prateleira do medo certos, mas vende como fato a pressão que se acumula e a dívida biológica com juros; o texto diz que isso é especulação do Panksepp, tirada de rato. Não nomeia Panksepp.')),
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
      and i->'video'->'pt'->>'path' = 'play-deprivation-adults/idea.1.pt.v2.mp4'
      and i->'video'->'pt'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: play-deprivation-adults/instinto-nao-passatempo video.pt was not updated';
  end if;
end
$guard$;

-- grip-strength-longevity · aperto-bate-a-pressao · video.pt (fidelity 65)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'aperto-bate-a-pressao' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'grip-strength-longevity/idea.1.pt.v2.mp4',
               'duration_seconds', 77,
               'poster', 'grip-strength-longevity/idea.1.pt.v2.poster.webp',
               'fidelity_score', 65,
               'needs_review', true,
               'fidelity_note', '27/16 kg, 16% por 5 kg e comparação com a sistólica certos, mas mostra a força cruzando idade, colesterol e diabetes num diagnóstico completo; o texto avisa que a comparação foi só com a pressão sistólica, não com um cálculo completo de risco. Some o PURE (142.861 adultos, 17 países) e a mediana sul-americana.')),
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
      and i->'video'->'pt'->>'path' = 'grip-strength-longevity/idea.1.pt.v2.mp4'
      and i->'video'->'pt'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: grip-strength-longevity/aperto-bate-a-pressao video.pt was not updated';
  end if;
end
$guard$;

-- ten-second-balance-test · capacidade-que-some · video.pt (fidelity 80)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'capacidade-que-some' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'ten-second-balance-test/idea.1.pt.v2.mp4',
               'duration_seconds', 75,
               'poster', 'ten-second-balance-test/idea.1.pt.v2.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', 'Teste e mecanismo das microcorreções certos e diz que não é prognóstico definitivo, mas troca o estudo brasileiro (4,6% vs 17,5%, 1.702 adultos) e a meta-análise por um vago segundo pesquisas; omite as instruções do teste (descalço, até três tentativas).')),
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
      and i->'video'->'pt'->>'path' = 'ten-second-balance-test/idea.1.pt.v2.mp4'
      and i->'video'->'pt'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: ten-second-balance-test/capacidade-que-some video.pt was not updated';
  end if;
end
$guard$;

-- catch-up-sleep-weekend · acorda-descansado · video.pt (fidelity 75)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'acorda-descansado' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'catch-up-sleep-weekend/idea.1.pt.v2.mp4',
               'duration_seconds', 65,
               'poster', 'catch-up-sleep-weekend/idea.1.pt.v2.poster.webp',
               'fidelity_score', 75,
               'needs_review', true,
               'fidelity_note', 'Corte de 6h, 7h sem benefício e 40-60 minutos certos, mas fecha com minutos extras protegem, quando os dados são de associação; some o estudo de Depner (9% a 27%), o ELSA-Brasil e o resultado nulo do banco britânico.')),
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
      and i->'video'->'pt'->>'path' = 'catch-up-sleep-weekend/idea.1.pt.v2.mp4'
      and i->'video'->'pt'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: catch-up-sleep-weekend/acorda-descansado video.pt was not updated';
  end if;
end
$guard$;

-- summary-psychology-of-money · comportamento-vence-diploma · video.pt (fidelity 80)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'comportamento-vence-diploma' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'summary-psychology-of-money/idea.1.pt.v2.mp4',
               'duration_seconds', 57,
               'poster', 'summary-psychology-of-money/idea.1.pt.v2.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', 'A ideia da cicatriz da década de formação está certa, mas some o par Grace Groner × Fuscone e o estudo de Malmendier e Nagel; diz que a cicatriz força decisões ultraconservadoras, quando o texto diz que o apetite a risco é em parte um acidente da época.')),
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
      and i->'video'->'pt'->>'path' = 'summary-psychology-of-money/idea.1.pt.v2.mp4'
      and i->'video'->'pt'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: summary-psychology-of-money/comportamento-vence-diploma video.pt was not updated';
  end if;
end
$guard$;

-- summary-good-life · relacao-preve-saude · video.pt (fidelity 50)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'relacao-preve-saude' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'summary-good-life/idea.1.pt.v2.mp4',
               'duration_seconds', 76,
               'poster', 'summary-good-life/idea.1.pt.v2.poster.webp',
               'fidelity_score', 50,
               'needs_review', true,
               'fidelity_note', 'Números certos (1938, 724, 85 anos, 308.849, ~50%), mas vende os laços como escudo biológico que protege o corpo; o texto diz que nada disso é experimento e que causa não está provada.')),
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
      and i->'video'->'pt'->>'path' = 'summary-good-life/idea.1.pt.v2.mp4'
      and i->'video'->'pt'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: summary-good-life/relacao-preve-saude video.pt was not updated';
  end if;
end
$guard$;

-- glossary-play · sofa-um-pedaco · video.pt (fidelity 60)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'sofa-um-pedaco' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-play/idea.1.pt.v3.mp4',
               'duration_seconds', 66,
               'poster', 'glossary-play/idea.1.pt.v3.poster.webp',
               'fidelity_score', 60,
               'needs_review', true,
               'fidelity_note', 'Repete o erro do take anterior: no quadro do hobby as 4 barras acendem (relaxamento continua verde), mas o texto diz 3 dos 4 e que relaxamento fica de fora; chama os ingredientes de 4 níveis de energia mental e não cita Sonnentag nem a meta-análise. Retake precisa de foco dirigido.')),
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
      and i->>'id' = 'sofa-um-pedaco'
      and i->'video'->'pt'->>'path' = 'glossary-play/idea.1.pt.v3.mp4'
      and i->'video'->'pt'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: glossary-play/sofa-um-pedaco video.pt was not updated';
  end if;
end
$guard$;

-- cbt-i-vs-sleep-hygiene · lista-nao-e-tratamento · video.pt (fidelity 80)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'lista-nao-e-tratamento' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'cbt-i-vs-sleep-hygiene/idea.1.pt.v2.mp4',
               'duration_seconds', 64,
               'poster', 'cbt-i-vs-sleep-hygiene/idea.1.pt.v2.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', 'Definição de insônia crônica, 4 a 8 semanas e higiene como ingrediente, não cura, certos; diz que a TCC-I trata a causa e mostra restrição de sono e controle de estímulos, que esta ideia não traz; some o ACP 2016 e a AASM.')),
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
      and i->'video'->'pt'->>'path' = 'cbt-i-vs-sleep-hygiene/idea.1.pt.v2.mp4'
      and i->'video'->'pt'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: cbt-i-vs-sleep-hygiene/lista-nao-e-tratamento video.pt was not updated';
  end if;
end
$guard$;

commit;
