-- migration: 20261012000001_learning_notebook_media.sql
-- purpose: runner do Notebook de 2026-10-12, rodada das 09h (.claude/agents/learning-notebook-runner.md):
--          0 vídeos "Resumo em Vídeo" e 8 deep dives "Resumo em Áudio" Análise detalhada / Padrão / EN
--          (fonte restrita ao texto EN do material, reencodados AAC 64k mono +faststart).
--          Deep dive: upsert em learning_material_media (unique material_id, kind, locale).
--
--          deep dives (slug · lado · título no Estúdio · duração s):
--            glossary-circle · en · "Why Isolation Is as Deadly as Smoking" · 1322
--            glossary-career · en · "Turning Your Job Into A Calling" · 1510
--            glossary-build · en · "How Making Things Rewires Your Brain" · 1442
--            explainer-career-capital · en · "Passion Is Built Not Found" · 1185
--            non-instrumental-play · en · "Why Useless Hobbies Cure Burnout" · 964
--            does-money-buy-happiness · en · "Does Money Buy Happiness Past 75k" · 1301
--            attachment-styles-love · en · "How Attachment Styles Actually Work" · 1264
--            summary-deep-work · en · "Why Constant Responsiveness Destroys Focus" · 841

begin;

-- deep dives
insert into public.learning_material_media
  (material_id, kind, locale, path, duration_seconds, source, meta)
select m.id, 'audio', v.locale, v.path, v.duration_seconds, 'notebooklm',
       jsonb_build_object('title', v.title)
from (values
  ('glossary-circle', 'en', 'glossary-circle/audio.en.m4a', 1322, 'Why Isolation Is as Deadly as Smoking'),
  ('glossary-career', 'en', 'glossary-career/audio.en.m4a', 1510, 'Turning Your Job Into A Calling'),
  ('glossary-build', 'en', 'glossary-build/audio.en.m4a', 1442, 'How Making Things Rewires Your Brain'),
  ('explainer-career-capital', 'en', 'explainer-career-capital/audio.en.m4a', 1185, 'Passion Is Built Not Found'),
  ('non-instrumental-play', 'en', 'non-instrumental-play/audio.en.m4a', 964, 'Why Useless Hobbies Cure Burnout'),
  ('does-money-buy-happiness', 'en', 'does-money-buy-happiness/audio.en.m4a', 1301, 'Does Money Buy Happiness Past 75k'),
  ('attachment-styles-love', 'en', 'attachment-styles-love/audio.en.m4a', 1264, 'How Attachment Styles Actually Work'),
  ('summary-deep-work', 'en', 'summary-deep-work/audio.en.m4a', 841, 'Why Constant Responsiveness Destroys Focus')
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
    ('glossary-circle', 'en', 'glossary-circle/audio.en.m4a'),
    ('glossary-career', 'en', 'glossary-career/audio.en.m4a'),
    ('glossary-build', 'en', 'glossary-build/audio.en.m4a'),
    ('explainer-career-capital', 'en', 'explainer-career-capital/audio.en.m4a'),
    ('non-instrumental-play', 'en', 'non-instrumental-play/audio.en.m4a'),
    ('does-money-buy-happiness', 'en', 'does-money-buy-happiness/audio.en.m4a'),
    ('attachment-styles-love', 'en', 'attachment-styles-love/audio.en.m4a'),
    ('summary-deep-work', 'en', 'summary-deep-work/audio.en.m4a')
  );
  if n <> 8 then
    raise exception 'learning_notebook: expected 8 deep dive rows, found %', n;
  end if;
end
$guard$;

commit;
