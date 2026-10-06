-- migration: 20261005000002_learning_notebook_media_low_fidelity.sql
-- purpose: sobe os 15 vídeos do Notebook que o portão de fidelidade (§6b do runner) tinha
--          segurado em needs_review, a pedido do André (2026-10-05): a prioridade é ter TODOS os
--          vídeos no ar; a revisão vem depois, começando pelos de fidelidade mais baixa.
--          Cada lado de vídeo ganha três chaves novas, ignoradas pelo app (o tipo
--          LearningIdeaVideo só lê path/duration_seconds/poster):
--            needs_review   true — o vídeo contradiz ou extrapola o texto da ideia
--            fidelity_score 0–100 — quão fiel ao verso e ao corpo da ideia (100 = sem desvio)
--            fidelity_note  o desvio principal, em uma linha
--          Ausência das chaves = passou no portão. Vídeos já no ar não mudam.
--          Escolhida a melhor tomada de cada ideia (a de menor desvio entre as needs_review dos
--          manifests em learning-drops/notebook-runs/). jsonb_set cirúrgico por id, com guarda.
--
--          vídeos (slug · ideia · lado · score):
--            bids-for-connection · bid-pedido-de-atencao · en · 55
--            protein-distribution-30g-myth · gatilho-da-leucina · pt · 70
--            play-deprivation-adults · freio-pre-frontal · pt · 70
--            summary-psychology-of-money · gap-comportamental · pt · 75
--            summary-good-life · calor-nao-contagem · pt · 75
--            glossary-career · autonomia-alavanca · pt · 80
--            hobbies-depression-older-adults · hobby-menos-depressao · pt · 80
--            glossary-sleep · fome-da-noite-curta · pt · 70
--            glossary-strength · piso-semanal-oms · pt · 70
--            hobbies-depression-older-adults · hobby-uma-vez-por-semana · en · 55
--            stretching-ten-minutes-week · tolerancia-ao-alongamento · en · 65
--            job-crafting-additive · faca-o-mapa-voce-mesmo · en · 45
--            bids-for-connection · numero-do-divorcio-sem-fonte · en · 35
--            friendship-hours · hora-de-trabalho-nao-conta · en · 55
--            protein-distribution-30g-myth · gatilho-da-leucina · en · 60

begin;

-- bids-for-connection · bid-pedido-de-atencao · video.en · fidelidade 55
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'bid-pedido-de-atencao' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'bids-for-connection/idea.1.en.mp4',
               'duration_seconds', 66,
               'poster', 'bids-for-connection/idea.1.en.poster.webp',
               'needs_review', true,
               'fidelity_score', 55,
               'fidelity_note', 'Trata a correlação como proteção causal; o texto diz que é inferência cautelosa.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'bids-for-connection';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'bids-for-connection'
      and i->>'id' = 'bid-pedido-de-atencao'
      and i->'video'->'en'->>'path' = 'bids-for-connection/idea.1.en.mp4'
      and (i->'video'->'en'->>'fidelity_score')::int = 55
  ) then
    raise exception 'learning_notebook: bids-for-connection/bid-pedido-de-atencao video.en was not updated';
  end if;
end
$guard$;

-- protein-distribution-30g-myth · gatilho-da-leucina · video.pt · fidelidade 70
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'gatilho-da-leucina' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'protein-distribution-30g-myth/idea.2.pt.mp4',
               'duration_seconds', 68,
               'poster', 'protein-distribution-30g-myth/idea.2.pt.poster.webp',
               'needs_review', true,
               'fidelity_score', 70,
               'fidelity_note', 'Gráfico inventa 30g animal vs 45g vegetal; rótulo ''Resistência Anabólica'' fora do texto.')),
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
      and i->>'id' = 'gatilho-da-leucina'
      and i->'video'->'pt'->>'path' = 'protein-distribution-30g-myth/idea.2.pt.mp4'
      and (i->'video'->'pt'->>'fidelity_score')::int = 70
  ) then
    raise exception 'learning_notebook: protein-distribution-30g-myth/gatilho-da-leucina video.pt was not updated';
  end if;
end
$guard$;

-- play-deprivation-adults · freio-pre-frontal · video.pt · fidelidade 70
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'freio-pre-frontal' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'play-deprivation-adults/idea.2.pt.mp4',
               'duration_seconds', 70,
               'poster', 'play-deprivation-adults/idea.2.pt.poster.webp',
               'needs_review', true,
               'fidelity_score', 70,
               'fidelity_note', 'Ressalva aparece, mas diz ''para a vida toda'' e ''INCAPAZ DE CONTER O IMPULSO'' (texto: freio mais fraco).')),
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
      and i->>'id' = 'freio-pre-frontal'
      and i->'video'->'pt'->>'path' = 'play-deprivation-adults/idea.2.pt.mp4'
      and (i->'video'->'pt'->>'fidelity_score')::int = 70
  ) then
    raise exception 'learning_notebook: play-deprivation-adults/freio-pre-frontal video.pt was not updated';
  end if;
end
$guard$;

-- summary-psychology-of-money · gap-comportamental · video.pt · fidelidade 75
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'gap-comportamental' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'summary-psychology-of-money/idea.2.pt.mp4',
               'duration_seconds', 73,
               'poster', 'summary-psychology-of-money/idea.2.pt.poster.webp',
               'needs_review', true,
               'fidelity_score', 75,
               'fidelity_note', 'Fecha prometendo que o 1,1 ponto para de escorrer; o texto não promete fechar o gap.')),
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
      and i->>'id' = 'gap-comportamental'
      and i->'video'->'pt'->>'path' = 'summary-psychology-of-money/idea.2.pt.mp4'
      and (i->'video'->'pt'->>'fidelity_score')::int = 75
  ) then
    raise exception 'learning_notebook: summary-psychology-of-money/gap-comportamental video.pt was not updated';
  end if;
end
$guard$;

-- summary-good-life · calor-nao-contagem · video.pt · fidelidade 75
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'calor-nao-contagem' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'summary-good-life/idea.2.pt.mp4',
               'duration_seconds', 66,
               'poster', 'summary-good-life/idea.2.pt.poster.webp',
               'needs_review', true,
               'fidelity_score', 75,
               'fidelity_note', 'Diz que os autores deixaram a pergunta em aberto de propósito; o texto diz que o livro não define.')),
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
      and i->>'id' = 'calor-nao-contagem'
      and i->'video'->'pt'->>'path' = 'summary-good-life/idea.2.pt.mp4'
      and (i->'video'->'pt'->>'fidelity_score')::int = 75
  ) then
    raise exception 'learning_notebook: summary-good-life/calor-nao-contagem video.pt was not updated';
  end if;
end
$guard$;

-- glossary-career · autonomia-alavanca · video.pt · fidelidade 80
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'autonomia-alavanca' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-career/idea.2.pt.mp4',
               'duration_seconds', 67,
               'poster', 'glossary-career/idea.2.pt.poster.webp',
               'needs_review', true,
               'fidelity_score', 80,
               'fidelity_note', 'Diz que a meta-análise ''comprovou'' o impacto; o texto diz associação (a ressalva correlacional aparece).')),
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
      and i->>'id' = 'autonomia-alavanca'
      and i->'video'->'pt'->>'path' = 'glossary-career/idea.2.pt.mp4'
      and (i->'video'->'pt'->>'fidelity_score')::int = 80
  ) then
    raise exception 'learning_notebook: glossary-career/autonomia-alavanca video.pt was not updated';
  end if;
end
$guard$;

-- hobbies-depression-older-adults · hobby-menos-depressao · video.pt · fidelidade 80
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'hobby-menos-depressao' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'hobbies-depression-older-adults/idea.1.pt.mp4',
               'duration_seconds', 71,
               'poster', 'hobbies-depression-older-adults/idea.1.pt.poster.webp',
               'needs_review', true,
               'fidelity_score', 80,
               'fidelity_note', 'Abre com ''ajuda no humor'' (causal) e diz ''sempre veio antes''; o resto bate, inclusive a ressalva.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'hobbies-depression-older-adults';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'hobbies-depression-older-adults'
      and i->>'id' = 'hobby-menos-depressao'
      and i->'video'->'pt'->>'path' = 'hobbies-depression-older-adults/idea.1.pt.mp4'
      and (i->'video'->'pt'->>'fidelity_score')::int = 80
  ) then
    raise exception 'learning_notebook: hobbies-depression-older-adults/hobby-menos-depressao video.pt was not updated';
  end if;
end
$guard$;

-- glossary-sleep · fome-da-noite-curta · video.pt · fidelidade 70
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'fome-da-noite-curta' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-sleep/idea.2.pt.mp4',
               'duration_seconds', 59,
               'poster', 'glossary-sleep/idea.2.pt.poster.webp',
               'needs_review', true,
               'fidelity_score', 70,
               'fidelity_note', 'Diz que o jovem do experimento ''vence a grelina'' com almoço cedo (nunca testado) e ''fome incontrolável''.')),
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
      and i->'video'->'pt'->>'path' = 'glossary-sleep/idea.2.pt.mp4'
      and (i->'video'->'pt'->>'fidelity_score')::int = 70
  ) then
    raise exception 'learning_notebook: glossary-sleep/fome-da-noite-curta video.pt was not updated';
  end if;
end
$guard$;

-- glossary-strength · piso-semanal-oms · video.pt · fidelidade 70
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'piso-semanal-oms' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-strength/idea.2.pt.mp4',
               'duration_seconds', 55,
               'poster', 'glossary-strength/idea.2.pt.poster.webp',
               'needs_review', true,
               'fidelity_score', 70,
               'fidelity_note', 'Diz que bater a cota ''garante'' força aos 65; o texto trata como piso mínimo. Omite a mobilidade.')),
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
      and i->'video'->'pt'->>'path' = 'glossary-strength/idea.2.pt.mp4'
      and (i->'video'->'pt'->>'fidelity_score')::int = 70
  ) then
    raise exception 'learning_notebook: glossary-strength/piso-semanal-oms video.pt was not updated';
  end if;
end
$guard$;

-- hobbies-depression-older-adults · hobby-uma-vez-por-semana · video.en · fidelidade 55
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'hobby-uma-vez-por-semana' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'hobbies-depression-older-adults/idea.2.en.mp4',
               'duration_seconds', 71,
               'poster', 'hobbies-depression-older-adults/idea.2.en.poster.webp',
               'needs_review', true,
               'fidelity_score', 55,
               'fidelity_note', 'Fala em ''proteger o cérebro'' e queda ''massiva'' de 19%; o texto diz dado observacional.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'hobbies-depression-older-adults';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'hobbies-depression-older-adults'
      and i->>'id' = 'hobby-uma-vez-por-semana'
      and i->'video'->'en'->>'path' = 'hobbies-depression-older-adults/idea.2.en.mp4'
      and (i->'video'->'en'->>'fidelity_score')::int = 55
  ) then
    raise exception 'learning_notebook: hobbies-depression-older-adults/hobby-uma-vez-por-semana video.en was not updated';
  end if;
end
$guard$;

-- stretching-ten-minutes-week · tolerancia-ao-alongamento · video.en · fidelidade 65
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'tolerancia-ao-alongamento' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'stretching-ten-minutes-week/idea.2.en.mp4',
               'duration_seconds', 75,
               'poster', 'stretching-ten-minutes-week/idea.2.en.poster.webp',
               'needs_review', true,
               'fidelity_score', 65,
               'fidelity_note', 'Diz que forçar a dor é contraproducente e descreve o alarme antes do limite; omite Ingram 2025.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'stretching-ten-minutes-week';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'stretching-ten-minutes-week'
      and i->>'id' = 'tolerancia-ao-alongamento'
      and i->'video'->'en'->>'path' = 'stretching-ten-minutes-week/idea.2.en.mp4'
      and (i->'video'->'en'->>'fidelity_score')::int = 65
  ) then
    raise exception 'learning_notebook: stretching-ten-minutes-week/tolerancia-ao-alongamento video.en was not updated';
  end if;
end
$guard$;

-- job-crafting-additive · faca-o-mapa-voce-mesmo · video.en · fidelidade 45
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'faca-o-mapa-voce-mesmo' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'job-crafting-additive/idea.2.en.mp4',
               'duration_seconds', 67,
               'poster', 'job-crafting-additive/idea.2.en.poster.webp',
               'needs_review', true,
               'fidelity_score', 45,
               'fidelity_note', 'Diz que o método ''funciona'' e vira rotina; omite os dois estudos e os números (pista, não prova).')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'job-crafting-additive';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'job-crafting-additive'
      and i->>'id' = 'faca-o-mapa-voce-mesmo'
      and i->'video'->'en'->>'path' = 'job-crafting-additive/idea.2.en.mp4'
      and (i->'video'->'en'->>'fidelity_score')::int = 45
  ) then
    raise exception 'learning_notebook: job-crafting-additive/faca-o-mapa-voce-mesmo video.en was not updated';
  end if;
end
$guard$;

-- bids-for-connection · numero-do-divorcio-sem-fonte · video.en · fidelidade 35
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'numero-do-divorcio-sem-fonte' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'bids-for-connection/idea.2.en.mp4',
               'duration_seconds', 62,
               'poster', 'bids-for-connection/idea.2.en.poster.webp',
               'needs_review', true,
               'fidelity_score', 35,
               'fidelity_note', 'Inventa como os 90% foram calculados; omite 86%/33%, o livro de autoajuda e a fonte do 93,6%.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'bids-for-connection';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'bids-for-connection'
      and i->>'id' = 'numero-do-divorcio-sem-fonte'
      and i->'video'->'en'->>'path' = 'bids-for-connection/idea.2.en.mp4'
      and (i->'video'->'en'->>'fidelity_score')::int = 35
  ) then
    raise exception 'learning_notebook: bids-for-connection/numero-do-divorcio-sem-fonte video.en was not updated';
  end if;
end
$guard$;

-- friendship-hours · hora-de-trabalho-nao-conta · video.en · fidelidade 55
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'hora-de-trabalho-nao-conta' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'friendship-hours/idea.2.en.mp4',
               'duration_seconds', 67,
               'poster', 'friendship-hours/idea.2.en.poster.webp',
               'needs_review', true,
               'fidelity_score', 55,
               'fidelity_note', 'Diz que hora de trabalho rende ''zero amizade'' (na tela ''Friendship: 0''); Hall diz que conta menos.')),
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
      and i->'video'->'en'->>'path' = 'friendship-hours/idea.2.en.mp4'
      and (i->'video'->'en'->>'fidelity_score')::int = 55
  ) then
    raise exception 'learning_notebook: friendship-hours/hora-de-trabalho-nao-conta video.en was not updated';
  end if;
end
$guard$;

-- protein-distribution-30g-myth · gatilho-da-leucina · video.en · fidelidade 60
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'gatilho-da-leucina' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'protein-distribution-30g-myth/idea.2.en.mp4',
               'duration_seconds', 71,
               'poster', 'protein-distribution-30g-myth/idea.2.en.poster.webp',
               'needs_review', true,
               'fidelity_score', 60,
               'fidelity_note', 'Diz ''exatamente 3 g'' com 30 g de whey e ''suga instantaneamente''; texto: 2,5–3 g, 30 g é média. Omite Moore.')),
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
      and i->>'id' = 'gatilho-da-leucina'
      and i->'video'->'en'->>'path' = 'protein-distribution-30g-myth/idea.2.en.mp4'
      and (i->'video'->'en'->>'fidelity_score')::int = 60
  ) then
    raise exception 'learning_notebook: protein-distribution-30g-myth/gatilho-da-leucina video.en was not updated';
  end if;
end
$guard$;

commit;
