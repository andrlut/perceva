-- migration: 20261018000005_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-10-18, segunda rodada (.claude/agents/learning-notebook-runner.md):
--          material novo ultra-processed-eat-more (1 ideia, publicado hoje) recebe a mídia inteira.
--          - 2 vídeos "Resumo em Vídeo" Curta (tiers 1 e 2), fonte restrita ao documento da ideia,
--            foco genérico; cartão final cortado por tools/content-media/video.mjs.
--          - 2 deep dives "Resumo em Áudio" Análise detalhada / Padrão (tier 3), fonte restrita ao
--            texto do idioma; re-encode AAC 64k mono +faststart.
--          Portão de fidelidade (§6b): grade de quadros lida às cegas (learning-card-tester) + faixa
--          de legendas, comparadas com o verso e o corpo da ideia. Todo lado leva fidelity_score;
--          abaixo de 90 leva também needs_review = true e fidelity_note (sobe mesmo assim, decisão
--          de 2026-10-05; revisão = tier 7, menor nota primeiro).
--          Vídeo: jsonb_set cirúrgico no lado do vídeo de uma ideia, por id, com guarda pós-update.
--
--          vídeos (slug · ideia · lado · título no Estúdio · duração s · score):
--            ultra-processed-eat-more · ultraprocessado-come-mais · pt · "Por Que Ultraprocessados Fazem Você Comer Mais" · 71 · 60
--            ultra-processed-eat-more · ultraprocessado-come-mais · en · "Why Ultra-Processed Food Makes You Overeat" · 70 · 65
--          deep dives (slug · lado · título no Estúdio · duração s):
--            ultra-processed-eat-more · pt · "Como ultraprocessados hackeiam a sua fome" · 976
--            ultra-processed-eat-more · en · "How Ultra Processed Food Bypasses Fullness" · 1029

begin;

-- ultra-processed-eat-more · ultraprocessado-come-mais · video.pt (fidelity 60)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'ultraprocessado-come-mais' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'ultra-processed-eat-more/idea.1.pt.mp4',
               'duration_seconds', 71,
               'poster', 'ultra-processed-eat-more/idea.1.pt.poster.webp',
               'fidelity_score', 60,
               'needs_review', true,
               'fidelity_note', 'Apresenta o porquê como certo (distensão gástrica, saciedade atrasada) e manda trocar pela versão in natura; o texto diz que o porquê está em aberto e que a troca não foi testada; não mostra o limite de 20 pessoas e duas semanas.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'ultra-processed-eat-more';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'ultra-processed-eat-more'
      and i->>'id' = 'ultraprocessado-come-mais'
      and i->'video'->'pt'->>'path' = 'ultra-processed-eat-more/idea.1.pt.mp4'
  ) then
    raise exception 'learning_notebook: ultra-processed-eat-more/ultraprocessado-come-mais video.pt was not updated';
  end if;
end
$guard$;

-- ultra-processed-eat-more · ultraprocessado-come-mais · video.en (fidelity 65)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'ultraprocessado-come-mais' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'ultra-processed-eat-more/idea.1.en.mp4',
               'duration_seconds', 70,
               'poster', 'ultra-processed-eat-more/idea.1.en.poster.webp',
               'fidelity_score', 65,
               'needs_review', true,
               'fidelity_note', 'Apresenta o porquê como duas armadilhas certas (densidade calórica e hormônios), diz que comeram 500 kcal a mais sem perceber e chama a troca de defesa; o texto diz que o porquê está em aberto e que a troca não foi testada.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'ultra-processed-eat-more';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'ultra-processed-eat-more'
      and i->>'id' = 'ultraprocessado-come-mais'
      and i->'video'->'en'->>'path' = 'ultra-processed-eat-more/idea.1.en.mp4'
      and i->'video'->'pt'->>'path' = 'ultra-processed-eat-more/idea.1.pt.mp4'
  ) then
    raise exception 'learning_notebook: ultra-processed-eat-more/ultraprocessado-come-mais video.en was not updated';
  end if;
end
$guard$;

-- deep dives
insert into public.learning_material_media
  (material_id, kind, locale, path, duration_seconds, source, meta)
select m.id, 'audio', v.locale, v.path, v.duration_seconds, 'notebooklm',
       jsonb_build_object('title', v.title)
from (values
  ('ultra-processed-eat-more', 'pt', 'ultra-processed-eat-more/audio.pt.m4a', 976, 'Como ultraprocessados hackeiam a sua fome'),
  ('ultra-processed-eat-more', 'en', 'ultra-processed-eat-more/audio.en.m4a', 1029, 'How Ultra Processed Food Bypasses Fullness')
) as v(slug, locale, path, duration_seconds, title)
join public.learning_material m on m.slug = v.slug
on conflict (material_id, kind, locale) do update set
  path             = excluded.path,
  duration_seconds = excluded.duration_seconds,
  source           = excluded.source,
  meta             = excluded.meta;

do $guard$
begin
  if (
    select count(*)
    from public.learning_material_media mm
    join public.learning_material m on m.id = mm.material_id
    where m.slug = 'ultra-processed-eat-more'
      and mm.kind = 'audio'
      and mm.path in ('ultra-processed-eat-more/audio.pt.m4a', 'ultra-processed-eat-more/audio.en.m4a')
  ) <> 2 then
    raise exception 'learning_notebook: ultra-processed-eat-more deep dives were not inserted';
  end if;
end
$guard$;

commit;
