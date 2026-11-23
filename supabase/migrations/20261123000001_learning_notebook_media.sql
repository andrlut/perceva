-- migration: 20261123000001_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-11-23 (.claude/agents/learning-notebook-runner.md).
--          - creative-activity-next-day (1 ideia): 2 vídeos "Resumo em Vídeo" Curta (tiers 1 e 2), fonte
--            restrita ao documento da ideia, foco genérico; cartão final cortado por tools/content-media/video.mjs.
--          - 1 deep dive "Resumo em Áudio" Análise detalhada / Padrão, EN, fonte restrita ao texto EN;
--            re-encode AAC 64k mono +faststart. O deep dive PT ficou gerando quando a extensão do Chrome
--            caiu e entra numa próxima execução.
--          Portão de fidelidade (§6b): grade lida às cegas (learning-card-tester) + faixa de legendas,
--          comparadas com o verso e o corpo da ideia. Abaixo de 90 leva needs_review = true e fidelity_note
--          (sobe mesmo assim, decisão de 2026-10-05; revisão = tier 7).
--
--          vídeos (slug · ideia · lado · título no Estúdio · duração s · score):
--            creative-activity-next-day · criar-hoje-anima-amanha · pt · Por Que Criar Algo Aumenta Sua Energia · 62 · 45
--            creative-activity-next-day · criar-hoje-anima-amanha · en · Why Making Things Boosts Tomorrow's Mood · 72 · 50
--
-- affected tables: public.learning_material (ideas, só o slot video de uma ideia),
--                  public.learning_material_media (1 linha de áudio)
-- new rpcs:        none
-- breaking?        no
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   objetos no bucket learning-media com cache imutável, conferidos antes desta migration

begin;

-- creative-activity-next-day · criar-hoje-anima-amanha · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'criar-hoje-anima-amanha' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'creative-activity-next-day/idea.1.pt.mp4',
               'duration_seconds', 62,
               'poster', 'creative-activity-next-day/idea.1.pt.poster.webp',
               'fidelity_score', 45,
               'needs_review', true,
               'fidelity_note', 'Inverte a ressalva central: diz que a gaveta consertada vai garantir energia e propósito no dia seguinte; o texto diz que tende a vir e que o diário não prova causa. Acrescenta quinze minutos, dose que o texto não traz.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'creative-activity-next-day';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'creative-activity-next-day'
      and i->>'id' = 'criar-hoje-anima-amanha'
      and i->'video'->'pt'->>'path' = 'creative-activity-next-day/idea.1.pt.mp4'
  ) then
    raise exception 'learning_notebook: creative-activity-next-day/criar-hoje-anima-amanha video.pt was not updated';
  end if;
end
$guard$;

-- creative-activity-next-day · criar-hoje-anima-amanha · video.en
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'criar-hoje-anima-amanha' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'creative-activity-next-day/idea.1.en.mp4',
               'duration_seconds', 72,
               'poster', 'creative-activity-next-day/idea.1.en.poster.webp',
               'fidelity_score', 50,
               'needs_review', true,
               'fidelity_note', 'Inverte a ressalva central: diz que cozinhar hoje garante (structurally guarantees) o pico de entusiasmo amanhã; o texto diz que tende a vir e que o diário não prova causa.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'creative-activity-next-day';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'creative-activity-next-day'
      and i->>'id' = 'criar-hoje-anima-amanha'
      and i->'video'->'en'->>'path' = 'creative-activity-next-day/idea.1.en.mp4'
      and i->'video'->'pt'->>'path' = 'creative-activity-next-day/idea.1.pt.mp4'
  ) then
    raise exception 'learning_notebook: creative-activity-next-day/criar-hoje-anima-amanha video.en was not updated';
  end if;
end
$guard$;

-- deep dive EN
insert into public.learning_material_media
  (material_id, kind, locale, path, duration_seconds, source, meta)
select m.id, 'audio', v.locale, v.path, v.duration_seconds, 'notebooklm',
       jsonb_build_object('title', v.title)
from (values
  ('creative-activity-next-day', 'en', 'creative-activity-next-day/audio.en.m4a', 1257, 'Making Things Today Fuels Tomorrow''s Energy')
) as v(slug, locale, path, duration_seconds, title)
join public.learning_material m on m.slug = v.slug
on conflict (material_id, kind, locale) do update set
  path             = excluded.path,
  duration_seconds = excluded.duration_seconds,
  source           = excluded.source,
  meta             = excluded.meta;

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material_media mm
    join public.learning_material m on m.id = mm.material_id
    where m.slug = 'creative-activity-next-day'
      and mm.kind = 'audio' and mm.locale = 'en'
      and mm.path = 'creative-activity-next-day/audio.en.m4a'
  ) then
    raise exception 'learning_notebook: creative-activity-next-day audio.en was not registered';
  end if;
end
$guard$;

commit;
