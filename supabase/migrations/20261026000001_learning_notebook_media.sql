-- migration: 20261026000001_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-10-26 (.claude/agents/learning-notebook-runner.md):
--          material novo retrieval-practice-beats-rereading (1 ideia) recebe a mídia inteira.
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
--            retrieval-practice-beats-rereading · lembrar-vence-reler · pt · "Prática de Recuperação: Por que lembrar supera reler" · 68 · 50
--            retrieval-practice-beats-rereading · lembrar-vence-reler · en · "Why Rereading Fools Your Brain" · 61 · 65
--          deep dives (slug · lado · título no Estúdio · duração s):
--            retrieval-practice-beats-rereading · pt · "Por que a releitura engana seu cérebro" · 882
--            retrieval-practice-beats-rereading · en · "Why Testing Yourself Beats Rereading" · 1426

begin;

-- retrieval-practice-beats-rereading · lembrar-vence-reler · video.pt (fidelity 50)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'lembrar-vence-reler' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'retrieval-practice-beats-rereading/idea.1.pt.mp4',
               'duration_seconds', 68,
               'poster', 'retrieval-practice-beats-rereading/idea.1.pt.poster.webp',
               'fidelity_score', 50,
               'needs_review', true,
               'fidelity_note', 'Fecha dizendo que quem se testou reteve quase todo o texto e quem só releu deu branco na prova; o texto diz 61% contra 40% uma semana depois, e o vídeo omite o estudo (Roediger e Karpicke, 180 alunos).')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'retrieval-practice-beats-rereading';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'retrieval-practice-beats-rereading'
      and i->>'id' = 'lembrar-vence-reler'
      and i->'video'->'pt'->>'path' = 'retrieval-practice-beats-rereading/idea.1.pt.mp4'
  ) then
    raise exception 'learning_notebook: retrieval-practice-beats-rereading/lembrar-vence-reler video.pt was not updated';
  end if;
end
$guard$;

-- retrieval-practice-beats-rereading · lembrar-vence-reler · video.en (fidelity 65)
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'lembrar-vence-reler' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('en', jsonb_build_object(
               'path', 'retrieval-practice-beats-rereading/idea.1.en.mp4',
               'duration_seconds', 61,
               'poster', 'retrieval-practice-beats-rereading/idea.1.en.poster.webp',
               'fidelity_score', 65,
               'needs_review', true,
               'fidelity_note', 'O gráfico de 1 semana mostra uma barra só, no meio, rotulada 40% e depois com 61% em cima, e deixa Passive Rereading e Active Recall vazias; a narração dos números está certa.')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'retrieval-practice-beats-rereading';

do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'retrieval-practice-beats-rereading'
      and i->>'id' = 'lembrar-vence-reler'
      and i->'video'->'en'->>'path' = 'retrieval-practice-beats-rereading/idea.1.en.mp4'
  ) then
    raise exception 'learning_notebook: retrieval-practice-beats-rereading/lembrar-vence-reler video.en was not updated';
  end if;
end
$guard$;

-- deep dives
insert into public.learning_material_media
  (material_id, kind, locale, path, duration_seconds, source, meta)
select m.id, 'audio', v.locale, v.path, v.duration_seconds, 'notebooklm',
       jsonb_build_object('title', v.title)
from (values
  ('retrieval-practice-beats-rereading', 'pt', 'retrieval-practice-beats-rereading/audio.pt.m4a', 882, 'Por que a releitura engana seu cérebro'),
  ('retrieval-practice-beats-rereading', 'en', 'retrieval-practice-beats-rereading/audio.en.m4a', 1426, 'Why Testing Yourself Beats Rereading')
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
    where m.slug = 'retrieval-practice-beats-rereading' and mm.kind = 'audio'
  ) <> 2 then
    raise exception 'learning_notebook: retrieval-practice-beats-rereading deep dives were not inserted';
  end if;
end
$guard$;

commit;
