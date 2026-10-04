-- migration: 20261004000004_learning_notebook_media.sql
-- purpose: segunda rodada do runner do Notebook de 2026-10-04 (tarefa agendada
--          learning-notebook-runner-cron, .claude/agents/learning-notebook-runner.md). 10 vídeos
--          Curta gerados: 3 segundas tomadas com foco dirigido de hobbies-depression-older-adults
--          (§6b item 5) + 7 primeiras tomadas da ideia 2. Passaram no portão de fidelidade (grade
--          1/8 fps lida às cegas pelo learning-card-tester + faixa de legendas a 1 fps × verso e
--          corpo da ideia) e entram aqui só os listados abaixo; os demais ficaram em needs_review
--          e não sobem. jsonb_set cirúrgico no lado do vídeo de uma ideia, por id, com guarda.
--
--          vídeos (slug · ideia · lado · título no Estúdio · duração s):
--            hobbies-depression-older-adults · hobby-menos-depressao · en · "Why Hobbies Matter After 65" · 67
--            non-instrumental-play · espaco-sem-placar · pt · "Por que seu hobby pago não serve como descanso" · 59
--            does-money-buy-happiness · renda-logaritmica · pt · "Como a Renda Logarítmica Dita a Sua Felicidade" · 65
--            attachment-styles-love · alarme-e-botao-de-mudo · pt · "O Alarme do Apego: Cobrar e Se Fechar" · 73
--            summary-deep-work · doze-por-cento · pt · "O Limite Real da Prática Deliberada" · 74
--            summary-outlive · risco-treinavel · pt · "Como Estruturar o Treino Para Longevidade" · 56

begin;

-- hobbies-depression-older-adults · hobby-menos-depressao · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'hobby-menos-depressao' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'hobbies-depression-older-adults/idea.1.en.mp4',
               'duration_seconds', 67,
               'poster', 'hobbies-depression-older-adults/idea.1.en.poster.webp')),
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
      and i->'video'->'en'->>'path' = 'hobbies-depression-older-adults/idea.1.en.mp4'
  ) then
    raise exception 'learning_notebook: hobbies-depression-older-adults/hobby-menos-depressao video.en was not updated';
  end if;
end
$guard$;

-- non-instrumental-play · espaco-sem-placar · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'espaco-sem-placar' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'non-instrumental-play/idea.2.pt.mp4',
               'duration_seconds', 59,
               'poster', 'non-instrumental-play/idea.2.pt.poster.webp')),
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
      and i->'video'->'pt'->>'path' = 'non-instrumental-play/idea.2.pt.mp4'
  ) then
    raise exception 'learning_notebook: non-instrumental-play/espaco-sem-placar video.pt was not updated';
  end if;
end
$guard$;

-- does-money-buy-happiness · renda-logaritmica · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'renda-logaritmica' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'does-money-buy-happiness/idea.2.pt.mp4',
               'duration_seconds', 65,
               'poster', 'does-money-buy-happiness/idea.2.pt.poster.webp')),
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
      and i->'video'->'pt'->>'path' = 'does-money-buy-happiness/idea.2.pt.mp4'
  ) then
    raise exception 'learning_notebook: does-money-buy-happiness/renda-logaritmica video.pt was not updated';
  end if;
end
$guard$;

-- attachment-styles-love · alarme-e-botao-de-mudo · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'alarme-e-botao-de-mudo' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'attachment-styles-love/idea.2.pt.mp4',
               'duration_seconds', 73,
               'poster', 'attachment-styles-love/idea.2.pt.poster.webp')),
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
      and i->'video'->'pt'->>'path' = 'attachment-styles-love/idea.2.pt.mp4'
  ) then
    raise exception 'learning_notebook: attachment-styles-love/alarme-e-botao-de-mudo video.pt was not updated';
  end if;
end
$guard$;

-- summary-deep-work · doze-por-cento · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'doze-por-cento' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'summary-deep-work/idea.2.pt.mp4',
               'duration_seconds', 74,
               'poster', 'summary-deep-work/idea.2.pt.poster.webp')),
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
      and i->>'id' = 'doze-por-cento'
      and i->'video'->'pt'->>'path' = 'summary-deep-work/idea.2.pt.mp4'
  ) then
    raise exception 'learning_notebook: summary-deep-work/doze-por-cento video.pt was not updated';
  end if;
end
$guard$;

-- summary-outlive · risco-treinavel · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'risco-treinavel' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'summary-outlive/idea.2.pt.mp4',
               'duration_seconds', 56,
               'poster', 'summary-outlive/idea.2.pt.poster.webp')),
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
      and i->'video'->'pt'->>'path' = 'summary-outlive/idea.2.pt.mp4'
  ) then
    raise exception 'learning_notebook: summary-outlive/risco-treinavel video.pt was not updated';
  end if;
end
$guard$;

commit;
