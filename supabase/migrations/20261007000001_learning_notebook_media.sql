-- migration: 20261007000001_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-10-07, rodada das 09h (.claude/agents/learning-notebook-runner.md):
--          vídeo "Resumo em Vídeo" Curta da ideia 2 em inglês de 9 materiais, fonte restrita ao
--          documento da ideia, cartão final cortado por tools/content-media/video.mjs.
--          Portão de fidelidade (§6b): grade lida às cegas (learning-card-tester) + faixa de
--          legendas comparadas com o verso e o corpo da ideia. Todo lado leva fidelity_score;
--          abaixo de 90 leva também needs_review = true e fidelity_note (sobe mesmo assim,
--          decisão de 2026-10-05; revisão = tier 7, menor nota primeiro).
--          jsonb_set cirúrgico no lado do vídeo de uma ideia, por id, com guarda pós-update.
--          (summary-deep-work · doze-por-cento · en falhou no Notebook e fica na fila.)
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

commit;
