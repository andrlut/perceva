-- migration: 20261102000001_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-11-02 (.claude/agents/learning-notebook-runner.md):
--          material novo buying-time-chores (1 ideia, publicado em 2026-11-01) recebe a mídia inteira.
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
--            buying-time-chores · comprar-tempo · pt · "Por que comprar tempo traz felicidade" · 57 · 65
--            buying-time-chores · comprar-tempo · en · "Why Buying Time Beats Buying Things" · 76 · 55
--          deep dives (slug · lado · título no Estúdio · duração s):
--            buying-time-chores · pt · "Comprar tempo traz mais felicidade que objetos" · 1536
--            buying-time-chores · en · "Why Buying Time Makes You Happier" · 566

begin;

-- buying-time-chores · comprar-tempo · video.pt (fidelity 65)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'comprar-tempo' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'buying-time-chores/idea.1.pt.mp4',
               'duration_seconds', 57,
               'poster', 'buying-time-chores/idea.1.pt.poster.webp',
               'fidelity_score', 65,
               'needs_review', true,
               'fidelity_note', 'Vídeo diz que comprar tempo "comprovadamente gera mais satisfação"; o texto avisa que o efeito é pequeno e quase tudo é correlação, e essa ressalva sumiu.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'buying-time-chores';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'buying-time-chores'
      and i->>'id' = 'comprar-tempo'
      and i->'video'->'pt'->>'path' = 'buying-time-chores/idea.1.pt.mp4'
  ) then
    raise exception 'learning_notebook: buying-time-chores/comprar-tempo video.pt was not updated';
  end if;
end
$guard$;

-- buying-time-chores · comprar-tempo · video.en (fidelity 55)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'comprar-tempo' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'buying-time-chores/idea.1.en.mp4',
               'duration_seconds', 76,
               'poster', 'buying-time-chores/idea.1.en.poster.webp',
               'fidelity_score', 55,
               'needs_review', true,
               'fidelity_note', 'Vídeo vende como receita ("if you want to buy happiness"), inventa mecanismo ("chronic stress response", "anticipatory dread completely removed") e omite que o efeito é pequeno e correlacional.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'buying-time-chores';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'buying-time-chores'
      and i->>'id' = 'comprar-tempo'
      and i->'video'->'en'->>'path' = 'buying-time-chores/idea.1.en.mp4'
  ) then
    raise exception 'learning_notebook: buying-time-chores/comprar-tempo video.en was not updated';
  end if;
end
$guard$;

-- deep dives
insert into public.learning_material_media
  (material_id, kind, locale, path, duration_seconds, source, meta)
select m.id, 'audio', v.locale, v.path, v.duration_seconds, 'notebooklm',
       jsonb_build_object('title', v.title)
from (values
  ('buying-time-chores', 'pt', 'buying-time-chores/audio.pt.m4a', 1536, 'Comprar tempo traz mais felicidade que objetos'),
  ('buying-time-chores', 'en', 'buying-time-chores/audio.en.m4a', 566, 'Why Buying Time Makes You Happier')
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
      where m.slug = 'buying-time-chores' and mm.kind = 'audio'
        and mm.path in ('buying-time-chores/audio.pt.m4a', 'buying-time-chores/audio.en.m4a')) <> 2 then
    raise exception 'learning_notebook: buying-time-chores deep dives were not upserted';
  end if;
end
$guard$;

commit;
