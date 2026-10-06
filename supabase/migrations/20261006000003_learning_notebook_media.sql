-- migration: 20261006000003_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-10-06, rodada das 17h (.claude/agents/learning-notebook-runner.md;
--          a das 14h é a 20261006000002): vídeo
--          "Resumo em Vídeo" Curta da ideia 2 em inglês de 10 materiais glossary-*, fonte restrita ao
--          documento da ideia, cartão final cortado por tools/content-media/video.mjs.
--          Portão de fidelidade (§6b): grade lida às cegas (learning-card-tester) + faixa de
--          legendas a 1 fps comparadas com o verso e o corpo da ideia. Todo lado leva fidelity_score;
--          abaixo de 90 leva também needs_review = true e fidelity_note (sobe mesmo assim,
--          decisão de 2026-10-05; revisão = tier 7, menor nota primeiro).
--          jsonb_set cirúrgico no lado do vídeo de uma ideia, por id, com guarda pós-update.
--
--          vídeos (slug · ideia · lado · título no Estúdio · duração s · score):
--            glossary-romance · coisa-nova-junto · en · "How Novelty Saves Your Relationship" · 73 · 55
--            glossary-play · ferias-somem · en · "Why Vacations Fail to Cure Burnout" · 61 · 70
--            glossary-nutrition · guerra-das-dietas · en · "Why Weight Loss Plateaus Are Physics" · 71 · 45
--            glossary-money · vinte-e-cinco-vezes · en · "How the 4% Rule Calculates Financial Independence" · 66 · 80
--            glossary-learn · cerebro-cresce-e-desfaz · en · "How Learning Physically Rebuilds Your Brain" · 79 · 65
--            glossary-dexterity · dinapenia · en · "Why Your Strength Fails When You Stumble" · 67 · 60
--            glossary-contemplate · meditacao-efeito-modesto · en · "What Science Actually Says About Meditation" · 68 · 85
--            glossary-circle · variedade-nao-volume · en · "Why Different Friend Groups Prevent Colds" · 76 · 65
--            glossary-career · autonomia-alavanca · en · "What Actually Makes Work Meaningful" · 62 · 50
--            glossary-build · tres-condicoes · en · "How Autonomy Fuels Motivation" · 69 · 90

begin;

-- glossary-romance · coisa-nova-junto · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'coisa-nova-junto' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-romance/idea.2.en.mp4',
               'duration_seconds', 73,
               'poster', 'glossary-romance/idea.2.en.poster.webp',
               'fidelity_score', 55,
               'needs_review', true,
               'fidelity_note', 'Omite o estudo randomizado de Aron (a evidência da ideia) e promete que o novo ''reinicia imediatamente'' a autoexpansão e não deixa ''nenhum espaço'' pro tédio.')),
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
      and i->>'id' = 'coisa-nova-junto'
      and i->'video'->'en'->>'path' = 'glossary-romance/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: glossary-romance/coisa-nova-junto video.en was not updated';
  end if;
end
$guard$;

-- glossary-play · ferias-somem · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'ferias-somem' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-play/idea.2.en.mp4',
               'duration_seconds', 61,
               'poster', 'glossary-play/idea.2.en.poster.webp',
               'fidelity_score', 70,
               'needs_review', true,
               'fidelity_note', 'Fecha prometendo que o trabalhador ''mantém a energia o ano todo'' guardando uma hora por dia (o texto não dá esse resultado); diz que a recuperação ''só'' acontece desligando e omite a meta-análise de efeito modesto.')),
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
      and i->>'id' = 'ferias-somem'
      and i->'video'->'en'->>'path' = 'glossary-play/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: glossary-play/ferias-somem video.en was not updated';
  end if;
end
$guard$;

-- glossary-nutrition · guerra-das-dietas · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'guerra-das-dietas' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-nutrition/idea.2.en.mp4',
               'duration_seconds', 71,
               'poster', 'glossary-nutrition/idea.2.en.poster.webp',
               'fidelity_score', 45,
               'needs_review', true,
               'fidelity_note', 'Fala só do platô; a evidência da ideia (DIETFITS, 609 pessoas, diferença zero em 12 meses; 59 estudos de dietas de marca) e a ação (escolher a dieta que dá pra manter) ficam de fora; inventa um exemplo numérico (déficit de 500 kcal, 171 a 160 lb em 6 meses).')),
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
      and i->>'id' = 'guerra-das-dietas'
      and i->'video'->'en'->>'path' = 'glossary-nutrition/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: glossary-nutrition/guerra-das-dietas video.en was not updated';
  end if;
end
$guard$;

-- glossary-money · vinte-e-cinco-vezes · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'vinte-e-cinco-vezes' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-money/idea.2.en.mp4',
               'duration_seconds', 66,
               'poster', 'glossary-money/idea.2.en.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', 'Números certos (4%, 1/25, US$ 60 mil x 25 = US$ 1,5 mi), mas vende o alvo como ''preciso'' e ''matematicamente independente'' (o texto diz ''bússola, não GPS'') e omite a taxa de poupança (10/25/50%), o Trinity (98%) e a revisão para 4,7%.')),
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
      and i->>'id' = 'vinte-e-cinco-vezes'
      and i->'video'->'en'->>'path' = 'glossary-money/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: glossary-money/vinte-e-cinco-vezes video.en was not updated';
  end if;
end
$guard$;

-- glossary-learn · cerebro-cresce-e-desfaz · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'cerebro-cresce-e-desfaz' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-learn/idea.2.en.mp4',
               'duration_seconds', 79,
               'poster', 'glossary-learn/idea.2.en.poster.webp',
               'fidelity_score', 65,
               'needs_review', true,
               'fidelity_note', 'Diz que a reconstrução acontece ''quase inteiramente'' no sono (texto: ''boa parte'') e que usar é ''o único sinal'' pro cérebro não desmontar; omite os taxistas de Londres e a ressalva de estudos pequenos e antigos.')),
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
      and i->>'id' = 'cerebro-cresce-e-desfaz'
      and i->'video'->'en'->>'path' = 'glossary-learn/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: glossary-learn/cerebro-cresce-e-desfaz video.en was not updated';
  end if;
end
$guard$;

-- glossary-dexterity · dinapenia · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'dinapenia' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-dexterity/idea.2.en.mp4',
               'duration_seconds', 67,
               'poster', 'glossary-dexterity/idea.2.en.poster.webp',
               'fidelity_score', 60,
               'needs_review', true,
               'fidelity_note', 'Mostra ''103 ms'' na tela (número que o texto não tem), promete que 5 min/dia ''preservam a velocidade'' e que o tornozelo ''te segura na hora antes de cair''; mistura mobilidade com alongamento estático.')),
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
      and i->>'id' = 'dinapenia'
      and i->'video'->'en'->>'path' = 'glossary-dexterity/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: glossary-dexterity/dinapenia video.en was not updated';
  end if;
end
$guard$;

-- glossary-contemplate · meditacao-efeito-modesto · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'meditacao-efeito-modesto' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-contemplate/idea.2.en.mp4',
               'duration_seconds', 68,
               'poster', 'glossary-contemplate/idea.2.en.poster.webp',
               'fidelity_score', 85,
               'needs_review', true,
               'fidelity_note', 'Quase fiel; sobe ''ansiedade, angústia'' pra ''estresse severo'', liga o 1 em 3 a quem medita ''sozinho com um app'' (o texto fala em pesquisas de campo sem instrutor) e omite ''pare se vier angústia forte''.')),
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
      and i->>'id' = 'meditacao-efeito-modesto'
      and i->'video'->'en'->>'path' = 'glossary-contemplate/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: glossary-contemplate/meditacao-efeito-modesto video.en was not updated';
  end if;
end
$guard$;

-- glossary-circle · variedade-nao-volume · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'variedade-nao-volume' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-circle/idea.2.en.mp4',
               'duration_seconds', 76,
               'poster', 'glossary-circle/idea.2.en.poster.webp',
               'fidelity_score', 65,
               'needs_review', true,
               'fidelity_note', 'Fecha dizendo que o voluntário do coral ficou ''completamente saudável'' por causa da rede variada e fala em ''construir imunidade''; o texto diz que nem todo mundo adoeceu em nenhum grupo, a diferença é de risco. Dunbar omitido.')),
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
      and i->>'id' = 'variedade-nao-volume'
      and i->'video'->'en'->>'path' = 'glossary-circle/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: glossary-circle/variedade-nao-volume video.en was not updated';
  end if;
end
$guard$;

-- glossary-career · autonomia-alavanca · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'autonomia-alavanca' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-career/idea.2.en.mp4',
               'duration_seconds', 62,
               'poster', 'glossary-career/idea.2.en.poster.webp',
               'fidelity_score', 50,
               'needs_review', true,
               'fidelity_note', 'Vende causa: controlar um processo ''vai somar mais à sua felicidade'' que uma promoção; some a ressalva central do texto (correlacional, ''um teste, não uma garantia'') e a meta-análise de ~200 estudos.')),
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
      and i->'video'->'en'->>'path' = 'glossary-career/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: glossary-career/autonomia-alavanca video.en was not updated';
  end if;
end
$guard$;

-- glossary-build · tres-condicoes · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'tres-condicoes' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'glossary-build/idea.2.en.mp4',
               'duration_seconds', 69,
               'poster', 'glossary-build/idea.2.en.poster.webp',
               'fidelity_score', 90)),
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
      and i->>'id' = 'tres-condicoes'
      and i->'video'->'en'->>'path' = 'glossary-build/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: glossary-build/tres-condicoes video.en was not updated';
  end if;
end
$guard$;

commit;
