-- migration: 20261015000002_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-10-15, rodada das 09h45 (.claude/agents/learning-notebook-runner.md):
--          10 vídeos "Resumo em Vídeo" Curta, tier 6 (o vídeo anterior carregava text_revised_at;
--          refeitos a partir do texto revisado da ideia 1 PT, em caminho .v2 — o objeto novo não
--          carrega text_revised_at, o que marca o vídeo como atual), fonte restrita ao documento
--          da ideia, foco genérico; cartão final cortado por tools/content-media/video.mjs.
--          Portão de fidelidade (§6b): grade de quadros + faixa de legendas lidas às cegas
--          (learning-card-tester) e comparadas com o verso e o corpo da ideia. Todo lado leva
--          fidelity_score; abaixo de 90 leva também needs_review = true e fidelity_note (sobe mesmo
--          assim, decisão de 2026-10-05; revisão = tier 7, menor nota primeiro).
--          Vídeo: jsonb_set cirúrgico no lado do vídeo de uma ideia, por id, com guarda pós-update.
--
--          vídeos (slug · ideia · lado · título no Estúdio · duração s · score):
--            glossary-nutrition · ultraprocessado-come-mais · pt · "O Truque Físico da Comida Ultraprocessada" · 68 · 55
--            glossary-money · compre-o-palheiro · pt · "Por Que o Fundo de Índice Vence o Gestor" · 70 · 85
--            glossary-learn · dificuldades-desejaveis · pt · "Como o Esforço Fixa a Memória" · 67 · 80
--            glossary-dexterity · sentar-e-levantar · pt · "O Que o Teste de Sentar e Levantar Revela" · 73 · 85
--            glossary-contemplate · mente-vaga-metade · pt · "Por Que Divagar Piora o Seu Humor" · 54 · 65
--            glossary-circle · risco-que-ninguem-mede · pt · "Por Que Ver Pouca Gente Encurta a Vida" · 68 · 80
--            glossary-career · tres-lentes · pt · "As Três Lentes do Trabalho" · 57 · 55
--            glossary-build · apego-e-prova · pt · "Por que construir uma cadeira torta funciona" · 75 · 90
--            explainer-career-capital · capital-de-carreira · pt · "Como o Capital de Carreira Compra Autonomia" · 61 · 65
--            summary-atomic-habits · 66-dias-nao-21 · pt · "A Verdade Sobre a Formação de Hábitos" · 62 · 90

begin;

-- glossary-nutrition · ultraprocessado-come-mais · video.pt (fidelity 55)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'ultraprocessado-come-mais' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-nutrition/idea.1.pt.v2.mp4',
               'duration_seconds', 68,
               'poster', 'glossary-nutrition/idea.1.pt.v2.poster.webp',
               'fidelity_score', 55,
               'needs_review', true,
               'fidelity_note', 'Sem o estudo de Hall (20 adultos, NIH, 508 kcal) nem a ressalva de estudo pequeno e curto; diz que o produto é fabricado para burlar a saciedade.')),
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
      and i->'video'->'pt'->>'path' = 'glossary-nutrition/idea.1.pt.v2.mp4'
      and i->'video'->'pt'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: glossary-nutrition/ultraprocessado-come-mais video.pt was not updated';
  end if;
end
$guard$;

-- glossary-money · compre-o-palheiro · video.pt (fidelity 85)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'compre-o-palheiro' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-money/idea.1.pt.v2.mp4',
               'duration_seconds', 70,
               'poster', 'glossary-money/idea.1.pt.v2.poster.webp',
               'fidelity_score', 85,
               'needs_review', true,
               'fidelity_note', 'Fala em ''derrotas certas'' para o gestor ativo e omite os 92% do SPIVA; taxa de 0,64% e mecanismo da soma certos.')),
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
      and i->>'id' = 'compre-o-palheiro'
      and i->'video'->'pt'->>'path' = 'glossary-money/idea.1.pt.v2.mp4'
      and i->'video'->'pt'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: glossary-money/compre-o-palheiro video.pt was not updated';
  end if;
end
$guard$;

-- glossary-learn · dificuldades-desejaveis · video.pt (fidelity 80)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'dificuldades-desejaveis' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-learn/idea.1.pt.v2.mp4',
               'duration_seconds', 67,
               'poster', 'glossary-learn/idea.1.pt.v2.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', 'Promete que o esforço grava ''para sempre'' e ''garante'' a fixação; 40% certo, mas omite os 61% de quem se testou.')),
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
      and i->>'id' = 'dificuldades-desejaveis'
      and i->'video'->'pt'->>'path' = 'glossary-learn/idea.1.pt.v2.mp4'
      and i->'video'->'pt'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: glossary-learn/dificuldades-desejaveis video.pt was not updated';
  end if;
end
$guard$;

-- glossary-dexterity · sentar-e-levantar · video.pt (fidelity 85)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'sentar-e-levantar' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-dexterity/idea.1.pt.v2.mp4',
               'duration_seconds', 73,
               'poster', 'glossary-dexterity/idea.1.pt.v2.poster.webp',
               'fidelity_score', 85,
               'needs_review', true,
               'fidelity_note', 'Chama a dificuldade de subir de ''sintoma de doença'' e o gancho promete revelar ''a sua verdadeira saúde''; ressalva de que treinar não prolonga a vida está lá.')),
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
      and i->>'id' = 'sentar-e-levantar'
      and i->'video'->'pt'->>'path' = 'glossary-dexterity/idea.1.pt.v2.mp4'
      and i->'video'->'pt'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: glossary-dexterity/sentar-e-levantar video.pt was not updated';
  end if;
end
$guard$;

-- glossary-contemplate · mente-vaga-metade · video.pt (fidelity 65)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'mente-vaga-metade' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-contemplate/idea.1.pt.v2.mp4',
               'duration_seconds', 54,
               'poster', 'glossary-contemplate/idea.1.pt.v2.poster.webp',
               'fidelity_score', 65,
               'needs_review', true,
               'fidelity_note', 'Afirma como fato que você fica mal porque a mente escapou e promete que voltar o foco salva o humor; o texto diz que a leitura causal é inferência dos autores.')),
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
      and i->>'id' = 'mente-vaga-metade'
      and i->'video'->'pt'->>'path' = 'glossary-contemplate/idea.1.pt.v2.mp4'
      and i->'video'->'pt'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: glossary-contemplate/mente-vaga-metade video.pt was not updated';
  end if;
end
$guard$;

-- glossary-circle · risco-que-ninguem-mede · video.pt (fidelity 80)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'risco-que-ninguem-mede' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-circle/idea.1.pt.v2.mp4',
               'duration_seconds', 68,
               'poster', 'glossary-circle/idea.1.pt.v2.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', 'Diz que isolamento ''equivale'' a fumar 15 cigarros por dia; o texto frisa que é comparação de tamanho de risco, não troca biológica literal.')),
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
      and i->>'id' = 'risco-que-ninguem-mede'
      and i->'video'->'pt'->>'path' = 'glossary-circle/idea.1.pt.v2.mp4'
      and i->'video'->'pt'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: glossary-circle/risco-que-ninguem-mede video.pt was not updated';
  end if;
end
$guard$;

-- glossary-career · tres-lentes · video.pt (fidelity 55)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'tres-lentes' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-career/idea.1.pt.v2.mp4',
               'duration_seconds', 57,
               'poster', 'glossary-career/idea.1.pt.v2.poster.webp',
               'fidelity_score', 55,
               'needs_review', true,
               'fidelity_note', 'Vende como causa que a satisfação depende da lente; o texto diz que o estudo é correlacional e não prova a causa.')),
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
      and i->>'id' = 'tres-lentes'
      and i->'video'->'pt'->>'path' = 'glossary-career/idea.1.pt.v2.mp4'
      and i->'video'->'pt'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: glossary-career/tres-lentes video.pt was not updated';
  end if;
end
$guard$;

-- glossary-build · apego-e-prova · video.pt (fidelity 90)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'apego-e-prova' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'glossary-build/idea.1.pt.v2.mp4',
               'duration_seconds', 75,
               'poster', 'glossary-build/idea.1.pt.v2.poster.webp',
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
      and i->>'id' = 'apego-e-prova'
      and i->'video'->'pt'->>'path' = 'glossary-build/idea.1.pt.v2.mp4'
      and i->'video'->'pt'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: glossary-build/apego-e-prova video.pt was not updated';
  end if;
end
$guard$;

-- explainer-career-capital · capital-de-carreira · video.pt (fidelity 65)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'capital-de-carreira' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'explainer-career-capital/idea.1.pt.v2.mp4',
               'duration_seconds', 61,
               'poster', 'explainer-career-capital/idea.1.pt.v2.poster.webp',
               'fidelity_score', 65,
               'needs_review', true,
               'fidelity_note', 'Vende o capital de carreira como ''o verdadeiro segredo'' com ''independência total'' e generaliza a ressalva de privilégio; omite que o livro é síntese jornalística.')),
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
      and i->>'id' = 'capital-de-carreira'
      and i->'video'->'pt'->>'path' = 'explainer-career-capital/idea.1.pt.v2.mp4'
      and i->'video'->'pt'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: explainer-career-capital/capital-de-carreira video.pt was not updated';
  end if;
end
$guard$;

-- summary-atomic-habits · 66-dias-nao-21 · video.pt (fidelity 90)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = '66-dias-nao-21' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'summary-atomic-habits/idea.1.pt.v2.mp4',
               'duration_seconds', 62,
               'poster', 'summary-atomic-habits/idea.1.pt.v2.poster.webp',
               'fidelity_score', 90)),
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
      and i->>'id' = '66-dias-nao-21'
      and i->'video'->'pt'->>'path' = 'summary-atomic-habits/idea.1.pt.v2.mp4'
      and i->'video'->'pt'->>'text_revised_at' is null
  ) then
    raise exception 'learning_notebook: summary-atomic-habits/66-dias-nao-21 video.pt was not updated';
  end if;
end
$guard$;

commit;
