-- migration: 20261002000001_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-10-02 (.claude/agents/learning-notebook-runner.md,
--          execução manual pedida pelo André): nova tentativa dos 9 itens needs_review de
--          2026-10-01 com FOCO DIRIGIDO (§6b item 5) — a frase genérica "Cubra apenas o que
--          está nesta fonte" mais uma ou duas frases que nomeiam o erro da tomada anterior e
--          dizem o que a fonte diz no lugar. Vídeo "Resumo em Vídeo" Curta por ideia, fonte
--          restrita ao documento da ideia; cartão final (claro ou escuro) cortado por
--          tools/content-media/video.mjs. Portão de fidelidade: faixa de legendas a 1 fps
--          comparada com o verso e o corpo da ideia; só entra o que passou (6 de 9; os
--          outros 3 ficaram needs_review no manifesto local). jsonb_set cirúrgico no lado do
--          vídeo de uma ideia, por id, com guarda pós-update.
--
--          vídeos (slug · ideia · lado · título no Estúdio · duração s):
--            awe-walk-vastness-novelty · caminhada-da-admiracao · en · "How Walking Trains Your Sense of Awe" · 73
--            awe-walk-vastness-novelty · caminhada-da-admiracao · pt · "Como Treinar a Admiração Caminhando" · 71
--            glossary-nutrition · guerra-das-dietas · pt · "Como o Platô de Emagrecimento Funciona" · 70
--            glossary-money · vinte-e-cinco-vezes · pt · "Como a Regra dos 4% Calcula Sua Independência" · 74
--            glossary-contemplate · meditacao-efeito-modesto · pt · "O Que a Ciência Diz Sobre Meditar" · 73
--            explainer-career-capital · interesse-construido · pt · "Como a Ideia de Paixão Destrói Seus Hobbies" · 74

begin;

-- awe-walk-vastness-novelty · caminhada-da-admiracao · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'caminhada-da-admiracao' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'awe-walk-vastness-novelty/idea.1.en.mp4',
               'duration_seconds', 73,
               'poster', 'awe-walk-vastness-novelty/idea.1.en.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'awe-walk-vastness-novelty';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'awe-walk-vastness-novelty'
      and i->>'id' = 'caminhada-da-admiracao'
      and i->'video'->'en'->>'path' = 'awe-walk-vastness-novelty/idea.1.en.mp4'
  ) then
    raise exception 'learning_notebook: awe-walk-vastness-novelty/caminhada-da-admiracao video.en was not updated';
  end if;
end
$guard$;

-- awe-walk-vastness-novelty · caminhada-da-admiracao · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'caminhada-da-admiracao' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'awe-walk-vastness-novelty/idea.1.pt.mp4',
               'duration_seconds', 71,
               'poster', 'awe-walk-vastness-novelty/idea.1.pt.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'awe-walk-vastness-novelty';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'awe-walk-vastness-novelty'
      and i->>'id' = 'caminhada-da-admiracao'
      and i->'video'->'pt'->>'path' = 'awe-walk-vastness-novelty/idea.1.pt.mp4'
  ) then
    raise exception 'learning_notebook: awe-walk-vastness-novelty/caminhada-da-admiracao video.pt was not updated';
  end if;
end
$guard$;

-- glossary-nutrition · guerra-das-dietas · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'guerra-das-dietas' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-nutrition/idea.2.pt.mp4',
               'duration_seconds', 70,
               'poster', 'glossary-nutrition/idea.2.pt.poster.webp')),
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
      and i->'video'->'pt'->>'path' = 'glossary-nutrition/idea.2.pt.mp4'
  ) then
    raise exception 'learning_notebook: glossary-nutrition/guerra-das-dietas video.pt was not updated';
  end if;
end
$guard$;

-- glossary-money · vinte-e-cinco-vezes · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'vinte-e-cinco-vezes' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-money/idea.2.pt.mp4',
               'duration_seconds', 74,
               'poster', 'glossary-money/idea.2.pt.poster.webp')),
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
      and i->'video'->'pt'->>'path' = 'glossary-money/idea.2.pt.mp4'
  ) then
    raise exception 'learning_notebook: glossary-money/vinte-e-cinco-vezes video.pt was not updated';
  end if;
end
$guard$;

-- glossary-contemplate · meditacao-efeito-modesto · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'meditacao-efeito-modesto' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-contemplate/idea.2.pt.mp4',
               'duration_seconds', 73,
               'poster', 'glossary-contemplate/idea.2.pt.poster.webp')),
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
      and i->'video'->'pt'->>'path' = 'glossary-contemplate/idea.2.pt.mp4'
  ) then
    raise exception 'learning_notebook: glossary-contemplate/meditacao-efeito-modesto video.pt was not updated';
  end if;
end
$guard$;

-- explainer-career-capital · interesse-construido · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'interesse-construido' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'explainer-career-capital/idea.2.pt.mp4',
               'duration_seconds', 74,
               'poster', 'explainer-career-capital/idea.2.pt.poster.webp')),
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
      and i->'video'->'pt'->>'path' = 'explainer-career-capital/idea.2.pt.mp4'
  ) then
    raise exception 'learning_notebook: explainer-career-capital/interesse-construido video.pt was not updated';
  end if;
end
$guard$;

commit;
