-- migration: 20261011000002_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-10-11, rodada das 17h (.claude/agents/learning-notebook-runner.md):
--          0 vídeos "Resumo em Vídeo" Curta (fonte restrita ao documento da ideia,
--          foco genérico; cartão final cortado por tools/content-media/video.mjs) e 8 deep dives
--          "Resumo em Áudio" Análise detalhada / Padrão / PT e EN (fonte restrita ao texto do material no idioma,
--          reencodados AAC 64k mono +faststart).
--          Portão de fidelidade (§6b) nos vídeos: grade + faixa de legendas lidas às cegas
--          (learning-card-tester) e comparadas com o verso e o corpo da ideia. Todo lado leva
--          fidelity_score; abaixo de 90 leva também needs_review = true e fidelity_note (sobe mesmo
--          assim, decisão de 2026-10-05; revisão = tier 7, menor nota primeiro).
--          Vídeo: jsonb_set cirúrgico no lado do vídeo de uma ideia, por id, com guarda pós-update.
--          Deep dive: upsert em learning_material_media (unique material_id, kind, locale).
--
--          vídeos (slug · ideia · lado · título no Estúdio · duração s · score):

--          deep dives (slug · lado · título no Estúdio · duração s):
--            summary-why-we-sleep · pt · "Erros do livro Por Que Nós Dormimos" · 1114
--            glossary-sleep · pt · "Os riscos invisíveis de dormir pouco" · 1327
--            glossary-strength · pt · "Como evitar o declínio físico silencioso" · 1713
--            hobbies-depression-older-adults · en · "How Weekly Hobbies Cut Depression Risk" · 1234
--            awe-walk-vastness-novelty · en · "How Awe Walks Boost Mental Health" · 1191
--            stretching-ten-minutes-week · en · "You Only Need Ten Minutes of Stretching" · 1414
--            job-crafting-additive · en · "How Job Crafting Fixes Job Drift" · 1308
--            glossary-contemplate · en · "Why Mind Wandering Makes You Unhappy" · 631

begin;

-- deep dives
insert into public.learning_material_media
  (material_id, kind, locale, path, duration_seconds, source, meta)
select m.id, 'audio', v.locale, v.path, v.duration_seconds, 'notebooklm',
       jsonb_build_object('title', v.title)
from (values
  ('summary-why-we-sleep', 'pt', 'summary-why-we-sleep/audio.pt.m4a', 1114, 'Erros do livro Por Que Nós Dormimos'),
  ('glossary-sleep', 'pt', 'glossary-sleep/audio.pt.m4a', 1327, 'Os riscos invisíveis de dormir pouco'),
  ('glossary-strength', 'pt', 'glossary-strength/audio.pt.m4a', 1713, 'Como evitar o declínio físico silencioso'),
  ('hobbies-depression-older-adults', 'en', 'hobbies-depression-older-adults/audio.en.m4a', 1234, 'How Weekly Hobbies Cut Depression Risk'),
  ('awe-walk-vastness-novelty', 'en', 'awe-walk-vastness-novelty/audio.en.m4a', 1191, 'How Awe Walks Boost Mental Health'),
  ('stretching-ten-minutes-week', 'en', 'stretching-ten-minutes-week/audio.en.m4a', 1414, 'You Only Need Ten Minutes of Stretching'),
  ('job-crafting-additive', 'en', 'job-crafting-additive/audio.en.m4a', 1308, 'How Job Crafting Fixes Job Drift'),
  ('glossary-contemplate', 'en', 'glossary-contemplate/audio.en.m4a', 631, 'Why Mind Wandering Makes You Unhappy')
) as v(slug, locale, path, duration_seconds, title)
join public.learning_material m on m.slug = v.slug
on conflict (material_id, kind, locale) do update set
  path             = excluded.path,
  duration_seconds = excluded.duration_seconds,
  source           = excluded.source,
  meta             = excluded.meta;

do $guard$
declare n int;
begin
  select count(*) into n
  from public.learning_material_media mm
  join public.learning_material m on m.id = mm.material_id
  where mm.kind = 'audio' and (m.slug, mm.locale, mm.path) in (
    ('summary-why-we-sleep', 'pt', 'summary-why-we-sleep/audio.pt.m4a'),
    ('glossary-sleep', 'pt', 'glossary-sleep/audio.pt.m4a'),
    ('glossary-strength', 'pt', 'glossary-strength/audio.pt.m4a'),
    ('hobbies-depression-older-adults', 'en', 'hobbies-depression-older-adults/audio.en.m4a'),
    ('awe-walk-vastness-novelty', 'en', 'awe-walk-vastness-novelty/audio.en.m4a'),
    ('stretching-ten-minutes-week', 'en', 'stretching-ten-minutes-week/audio.en.m4a'),
    ('job-crafting-additive', 'en', 'job-crafting-additive/audio.en.m4a'),
    ('glossary-contemplate', 'en', 'glossary-contemplate/audio.en.m4a')
  );
  if n <> 8 then
    raise exception 'learning_notebook: expected 8 deep dive rows, found %', n;
  end if;
end
$guard$;

commit;
