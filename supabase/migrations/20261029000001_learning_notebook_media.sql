-- migration: 20261029000001_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-10-29 (.claude/agents/learning-notebook-runner.md):
--          material novo shared-novelty-couples (1 ideia) recebe a mídia inteira.
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
--            shared-novelty-couples · novidade-a-dois · pt · "Como a Auto-expansão Renova Relacionamentos" · 62 · 80
--            shared-novelty-couples · novidade-a-dois · en · "How Self-Expansion Rekindles Relationships" · 61 · 50
--          deep dives (slug · lado · título no Estúdio · duração s):
--            shared-novelty-couples · pt · "Como a novidade reacende o casamento" · 1076
--            shared-novelty-couples · en · "Why Dinner Dates Do Not Spark Romance" · 1154

begin;

-- shared-novelty-couples · novidade-a-dois · video.pt (fidelity 80)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'novidade-a-dois' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'shared-novelty-couples/idea.1.pt.mp4',
               'duration_seconds', 62,
               'poster', 'shared-novelty-couples/idea.1.pt.poster.webp',
               'fidelity_score', 80,
               'needs_review', true,
               'fidelity_note', 'Diz que a ciência achou a "dose ideal" de 90 minutos e que o cérebro conecta a recompensa à pessoa; o texto só diz que os ensaios usaram 90 min e que você passa a ligar a sensação à pessoa, e o vídeo omite os estudos.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'shared-novelty-couples';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'shared-novelty-couples'
      and i->>'id' = 'novidade-a-dois'
      and i->'video'->'pt'->>'path' = 'shared-novelty-couples/idea.1.pt.mp4'
  ) then
    raise exception 'learning_notebook: shared-novelty-couples/novidade-a-dois video.pt was not updated';
  end if;
end
$guard$;

-- shared-novelty-couples · novidade-a-dois · video.en (fidelity 50)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'novidade-a-dois' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'shared-novelty-couples/idea.1.en.mp4',
               'duration_seconds', 61,
               'poster', 'shared-novelty-couples/idea.1.en.poster.webp',
               'fidelity_score', 50,
               'needs_review', true,
               'fidelity_note', 'Abre com "to cure a stale relationship" e fecha com "permanently wires the two of you together"; o texto diz aposta, não cura, ganho modesto e amostras pequenas, e o vídeo não traz ressalva nem estudo.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'shared-novelty-couples';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'shared-novelty-couples'
      and i->>'id' = 'novidade-a-dois'
      and i->'video'->'en'->>'path' = 'shared-novelty-couples/idea.1.en.mp4'
  ) then
    raise exception 'learning_notebook: shared-novelty-couples/novidade-a-dois video.en was not updated';
  end if;
end
$guard$;

-- deep dives
insert into public.learning_material_media
  (material_id, kind, locale, path, duration_seconds, source, meta)
select m.id, 'audio', v.locale, v.path, v.duration_seconds, 'notebooklm',
       jsonb_build_object('title', v.title)
from (values
  ('shared-novelty-couples', 'pt', 'shared-novelty-couples/audio.pt.m4a', 1076, 'Como a novidade reacende o casamento'),
  ('shared-novelty-couples', 'en', 'shared-novelty-couples/audio.en.m4a', 1154, 'Why Dinner Dates Do Not Spark Romance')
) as v(slug, locale, path, duration_seconds, title)
join public.learning_material m on m.slug = v.slug
on conflict (material_id, kind, locale) do update set
  path             = excluded.path,
  duration_seconds = excluded.duration_seconds,
  source           = excluded.source,
  meta             = excluded.meta;

do $guard$
begin
  if (select count(*) from public.learning_material_media mm
      join public.learning_material m on m.id = mm.material_id
      where m.slug = 'shared-novelty-couples' and mm.kind = 'audio'
        and mm.path in ('shared-novelty-couples/audio.pt.m4a', 'shared-novelty-couples/audio.en.m4a')) <> 2 then
    raise exception 'learning_notebook: shared-novelty-couples deep dives were not upserted';
  end if;
end
$guard$;

commit;
