-- migration: 20261006000002_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-10-06 (.claude/agents/learning-notebook-runner.md, nova
--          tentativa da rodada agendada que parou em CHROME_BLOCKED de manhã): vídeo
--          "Resumo em Vídeo" Curta da ideia 2 em inglês de 10 materiais, fonte restrita ao
--          documento da ideia, cartão final cortado por tools/content-media/video.mjs.
--          Portão de fidelidade (§6b): grade lida às cegas (learning-card-tester) + faixa de
--          legendas comparadas com o verso e o corpo da ideia. Todo lado leva fidelity_score;
--          abaixo de 90 leva também needs_review = true e fidelity_note (sobe mesmo assim,
--          decisão de 2026-10-05; revisão = tier 7, menor nota primeiro).
--          jsonb_set cirúrgico no lado do vídeo de uma ideia, por id, com guarda pós-update.
--
--          vídeos (slug · ideia · lado · título no Estúdio · duração s · score):
--            cbt-i-vs-sleep-hygiene · menos-tempo-na-cama · en · "How Sleep Restriction Cures Insomnia" · 75 · 65
--            ikea-effect · preco-em-vez-de-opiniao · en · "How Prices Reveal Your Work's True Value" · 79 · 75
--            attention-residue · terminar-nao-e-fechar · en · "How the Ready-to-Resume Plan Frees Your Attention" · 73 · 85
--            play-deprivation-adults · freio-pre-frontal · en · "How Play Deprivation Kills Cognitive Flexibility" · 77 · 85
--            grip-strength-longevity · dose-minima-de-forca · en · "Why Hand Grippers Won't Extend Your Life" · 74 · 90
--            ten-second-balance-test · diferenca-entre-as-pernas · en · "How True Balance Training Actually Works" · 78 · 90
--            weak-ties-job-search · laco-adormecido · en · "How Idle Contacts Unlock Hidden Jobs" · 81 · 75
--            catch-up-sleep-weekend · tres-fusos · en · "How Weekend Sleep Causes Social Jetlag" · 67 · 85
--            summary-psychology-of-money · gap-comportamental · en · "How the Behavior Gap Costs You" · 60 · 80
--            summary-good-life · calor-nao-contagem · en · "How Marriage Alters Physical Pain" · 65 · 90

begin;

-- cbt-i-vs-sleep-hygiene · menos-tempo-na-cama · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'menos-tempo-na-cama' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'cbt-i-vs-sleep-hygiene/idea.2.en.mp4',
               'duration_seconds', 75,
               'poster', 'cbt-i-vs-sleep-hygiene/idea.2.en.poster.webp',
               'fidelity_score', 65,
               'needs_review', true,
               'fidelity_note', 'Mecanismo e números (8,5 h na cama, 5,5 h, +15 min, despertar fixo) certos, mas promete chegar a "oito horas de descanso"/100% de eficiência, que o texto não diz, e omite o custo das 1-2 semanas, a meta-análise (26 min) e o aviso de apneia.')),
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
      and i->>'id' = 'menos-tempo-na-cama'
      and i->'video'->'en'->>'path' = 'cbt-i-vs-sleep-hygiene/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: cbt-i-vs-sleep-hygiene/menos-tempo-na-cama video.en was not updated';
  end if;
end
$guard$;

-- ikea-effect · preco-em-vez-de-opiniao · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'preco-em-vez-de-opiniao' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'ikea-effect/idea.2.en.mp4',
               'duration_seconds', 79,
               'poster', 'ikea-effect/idea.2.en.poster.webp',
               'fidelity_score', 75,
               'needs_review', true,
               'fidelity_note', 'Ideia certa (pergunte o preço, não a opinião), mas inventa preços ilustrativos (US$ 50 x US$ 0,10) que o texto não traz e omite o estudo do origami e a pergunta do custo afundado.')),
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
      and i->>'id' = 'preco-em-vez-de-opiniao'
      and i->'video'->'en'->>'path' = 'ikea-effect/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: ikea-effect/preco-em-vez-de-opiniao video.en was not updated';
  end if;
end
$guard$;

-- attention-residue · terminar-nao-e-fechar · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'terminar-nao-e-fechar' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'attention-residue/idea.2.en.mp4',
               'duration_seconds', 73,
               'poster', 'attention-residue/idea.2.en.poster.webp',
               'fidelity_score', 85,
               'needs_review', true,
               'fidelity_note', 'Plano de três linhas e "um minuto" certos; diz que as três linhas "resolvem" a distração (o texto: menos resíduo) e omite o estudo de campo com 202 profissionais e o achado da pressão de tempo.')),
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
      and i->>'id' = 'terminar-nao-e-fechar'
      and i->'video'->'en'->>'path' = 'attention-residue/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: attention-residue/terminar-nao-e-fechar video.en was not updated';
  end if;
end
$guard$;

-- play-deprivation-adults · freio-pre-frontal · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'freio-pre-frontal' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'play-deprivation-adults/idea.2.en.mp4',
               'duration_seconds', 77,
               'poster', 'play-deprivation-adults/idea.2.en.poster.webp',
               'fidelity_score', 85,
               'needs_review', true,
               'fidelity_note', 'Ressalva central preservada (ratos, analogia, ninguém testou em gente); o gancho afirma que a flexibilidade "exige" brincadeira na infância, além do texto, e omite o piloto dos 26 condenados.')),
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
      and i->'video'->'en'->>'path' = 'play-deprivation-adults/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: play-deprivation-adults/freio-pre-frontal video.en was not updated';
  end if;
end
$guard$;

-- grip-strength-longevity · dose-minima-de-forca · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'dose-minima-de-forca' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'grip-strength-longevity/idea.2.en.mp4',
               'duration_seconds', 74,
               'poster', 'grip-strength-longevity/idea.2.en.poster.webp',
               'fidelity_score', 90)),
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
      and i->>'id' = 'dose-minima-de-forca'
      and i->'video'->'en'->>'path' = 'grip-strength-longevity/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: grip-strength-longevity/dose-minima-de-forca video.en was not updated';
  end if;
end
$guard$;

-- ten-second-balance-test · diferenca-entre-as-pernas · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'diferenca-entre-as-pernas' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'ten-second-balance-test/idea.2.en.mp4',
               'duration_seconds', 78,
               'poster', 'ten-second-balance-test/idea.2.en.poster.webp',
               'fidelity_score', 90)),
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
      and i->>'id' = 'diferenca-entre-as-pernas'
      and i->'video'->'en'->>'path' = 'ten-second-balance-test/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: ten-second-balance-test/diferenca-entre-as-pernas video.en was not updated';
  end if;
end
$guard$;

-- weak-ties-job-search · laco-adormecido · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'laco-adormecido' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'weak-ties-job-search/idea.2.en.mp4',
               'duration_seconds', 81,
               'poster', 'weak-ties-job-search/idea.2.en.poster.webp',
               'fidelity_score', 75,
               'needs_review', true,
               'fidelity_note', 'Ação certa (contato parado há mais de um ano, pergunte como o time está montado, não por vaga); omite o estudo de Rutgers e a ressalva de amostra pequena (pista, não lei) e fecha prometendo destravar uma vaga.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'weak-ties-job-search';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'weak-ties-job-search'
      and i->>'id' = 'laco-adormecido'
      and i->'video'->'en'->>'path' = 'weak-ties-job-search/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: weak-ties-job-search/laco-adormecido video.en was not updated';
  end if;
end
$guard$;

-- catch-up-sleep-weekend · tres-fusos · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'tres-fusos' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'catch-up-sleep-weekend/idea.2.en.mp4',
               'duration_seconds', 67,
               'poster', 'catch-up-sleep-weekend/idea.2.en.poster.webp',
               'fidelity_score', 85,
               'needs_review', true,
               'fidelity_note', 'Núcleo certo (meio do sono 3h x 6h30 = 3,5 h, luz cedo, dormir mais cedo em vez de acordar tarde); diz que a regularidade é "muito melhor" que o total e omite a regra de no máximo uma hora, os 60.977 adultos e o 20-48% de Windred.')),
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
      and i->>'id' = 'tres-fusos'
      and i->'video'->'en'->>'path' = 'catch-up-sleep-weekend/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: catch-up-sleep-weekend/tres-fusos video.en was not updated';
  end if;
end
$guard$;

-- summary-psychology-of-money · gap-comportamental · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'gap-comportamental' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'summary-psychology-of-money/idea.2.en.mp4',
               'duration_seconds', 60,
               'poster', 'summary-psychology-of-money/idea.2.en.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', 'Núcleo certo (fundo 7,3%, gap comportamental, espera e reserva); mostra "14,2%" de alta do mercado e um saldo ilustrativo que o texto não traz, e fala em "um ponto" onde o texto diz 1,1 ponto.')),
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
      and i->'video'->'en'->>'path' = 'summary-psychology-of-money/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: summary-psychology-of-money/gap-comportamental video.en was not updated';
  end if;
end
$guard$;

-- summary-good-life · calor-nao-contagem · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'calor-nao-contagem' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'summary-good-life/idea.2.en.mp4',
               'duration_seconds', 65,
               'poster', 'summary-good-life/idea.2.en.poster.webp',
               'fidelity_score', 90)),
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
      and i->'video'->'en'->>'path' = 'summary-good-life/idea.2.en.mp4'
  ) then
    raise exception 'learning_notebook: summary-good-life/calor-nao-contagem video.en was not updated';
  end if;
end
$guard$;

commit;
