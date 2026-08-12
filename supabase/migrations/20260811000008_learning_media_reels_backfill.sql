-- migration: 20260811000008_learning_media_reels_backfill.sql
-- purpose: backfill dos teaser cards ("Explorar") — kind='reel', 3 cards por
--          material por locale, gerados por tools/content-media/reels.mjs a
--          partir de learning-drops/reels-specs/ (specs versionados no repo).
-- breaking? no — additive; idempotente via upsert na UNIQUE (material,kind,locale)
begin;

with data (slug, locale, path, page_paths) as (
 values
  ('attachment-styles-love', 'pt', 'attachment-styles-love/reel.pt.1.webp', array['attachment-styles-love/reel.pt.1.webp','attachment-styles-love/reel.pt.2.webp','attachment-styles-love/reel.pt.3.webp']),
  ('attachment-styles-love', 'en', 'attachment-styles-love/reel.en.1.webp', array['attachment-styles-love/reel.en.1.webp','attachment-styles-love/reel.en.2.webp','attachment-styles-love/reel.en.3.webp']),
  ('catch-up-sleep-weekend', 'pt', 'catch-up-sleep-weekend/reel.pt.1.webp', array['catch-up-sleep-weekend/reel.pt.1.webp','catch-up-sleep-weekend/reel.pt.2.webp','catch-up-sleep-weekend/reel.pt.3.webp']),
  ('catch-up-sleep-weekend', 'en', 'catch-up-sleep-weekend/reel.en.1.webp', array['catch-up-sleep-weekend/reel.en.1.webp','catch-up-sleep-weekend/reel.en.2.webp','catch-up-sleep-weekend/reel.en.3.webp']),
  ('does-money-buy-happiness', 'pt', 'does-money-buy-happiness/reel.pt.1.webp', array['does-money-buy-happiness/reel.pt.1.webp','does-money-buy-happiness/reel.pt.2.webp','does-money-buy-happiness/reel.pt.3.webp']),
  ('does-money-buy-happiness', 'en', 'does-money-buy-happiness/reel.en.1.webp', array['does-money-buy-happiness/reel.en.1.webp','does-money-buy-happiness/reel.en.2.webp','does-money-buy-happiness/reel.en.3.webp']),
  ('explainer-career-capital', 'pt', 'explainer-career-capital/reel.pt.1.webp', array['explainer-career-capital/reel.pt.1.webp','explainer-career-capital/reel.pt.2.webp','explainer-career-capital/reel.pt.3.webp']),
  ('explainer-career-capital', 'en', 'explainer-career-capital/reel.en.1.webp', array['explainer-career-capital/reel.en.1.webp','explainer-career-capital/reel.en.2.webp','explainer-career-capital/reel.en.3.webp']),
  ('glossary-build', 'pt', 'glossary-build/reel.pt.1.webp', array['glossary-build/reel.pt.1.webp','glossary-build/reel.pt.2.webp','glossary-build/reel.pt.3.webp']),
  ('glossary-build', 'en', 'glossary-build/reel.en.1.webp', array['glossary-build/reel.en.1.webp','glossary-build/reel.en.2.webp','glossary-build/reel.en.3.webp']),
  ('glossary-career', 'pt', 'glossary-career/reel.pt.1.webp', array['glossary-career/reel.pt.1.webp','glossary-career/reel.pt.2.webp','glossary-career/reel.pt.3.webp']),
  ('glossary-career', 'en', 'glossary-career/reel.en.1.webp', array['glossary-career/reel.en.1.webp','glossary-career/reel.en.2.webp','glossary-career/reel.en.3.webp']),
  ('glossary-circle', 'pt', 'glossary-circle/reel.pt.1.webp', array['glossary-circle/reel.pt.1.webp','glossary-circle/reel.pt.2.webp','glossary-circle/reel.pt.3.webp']),
  ('glossary-circle', 'en', 'glossary-circle/reel.en.1.webp', array['glossary-circle/reel.en.1.webp','glossary-circle/reel.en.2.webp','glossary-circle/reel.en.3.webp']),
  ('glossary-contemplate', 'pt', 'glossary-contemplate/reel.pt.1.webp', array['glossary-contemplate/reel.pt.1.webp','glossary-contemplate/reel.pt.2.webp','glossary-contemplate/reel.pt.3.webp']),
  ('glossary-contemplate', 'en', 'glossary-contemplate/reel.en.1.webp', array['glossary-contemplate/reel.en.1.webp','glossary-contemplate/reel.en.2.webp','glossary-contemplate/reel.en.3.webp']),
  ('glossary-dexterity', 'pt', 'glossary-dexterity/reel.pt.1.webp', array['glossary-dexterity/reel.pt.1.webp','glossary-dexterity/reel.pt.2.webp','glossary-dexterity/reel.pt.3.webp']),
  ('glossary-dexterity', 'en', 'glossary-dexterity/reel.en.1.webp', array['glossary-dexterity/reel.en.1.webp','glossary-dexterity/reel.en.2.webp','glossary-dexterity/reel.en.3.webp']),
  ('glossary-learn', 'pt', 'glossary-learn/reel.pt.1.webp', array['glossary-learn/reel.pt.1.webp','glossary-learn/reel.pt.2.v2.webp','glossary-learn/reel.pt.3.webp']),
  ('glossary-learn', 'en', 'glossary-learn/reel.en.1.webp', array['glossary-learn/reel.en.1.webp','glossary-learn/reel.en.2.v2.webp','glossary-learn/reel.en.3.webp']),
  ('glossary-money', 'pt', 'glossary-money/reel.pt.1.webp', array['glossary-money/reel.pt.1.webp','glossary-money/reel.pt.2.webp','glossary-money/reel.pt.3.webp']),
  ('glossary-money', 'en', 'glossary-money/reel.en.1.webp', array['glossary-money/reel.en.1.webp','glossary-money/reel.en.2.webp','glossary-money/reel.en.3.webp']),
  ('glossary-nutrition', 'pt', 'glossary-nutrition/reel.pt.1.webp', array['glossary-nutrition/reel.pt.1.webp','glossary-nutrition/reel.pt.2.webp','glossary-nutrition/reel.pt.3.webp']),
  ('glossary-nutrition', 'en', 'glossary-nutrition/reel.en.1.webp', array['glossary-nutrition/reel.en.1.webp','glossary-nutrition/reel.en.2.webp','glossary-nutrition/reel.en.3.webp']),
  ('glossary-play', 'pt', 'glossary-play/reel.pt.1.webp', array['glossary-play/reel.pt.1.webp','glossary-play/reel.pt.2.webp','glossary-play/reel.pt.3.webp']),
  ('glossary-play', 'en', 'glossary-play/reel.en.1.webp', array['glossary-play/reel.en.1.webp','glossary-play/reel.en.2.webp','glossary-play/reel.en.3.webp']),
  ('glossary-romance', 'pt', 'glossary-romance/reel.pt.1.webp', array['glossary-romance/reel.pt.1.webp','glossary-romance/reel.pt.2.webp','glossary-romance/reel.pt.3.webp']),
  ('glossary-romance', 'en', 'glossary-romance/reel.en.1.webp', array['glossary-romance/reel.en.1.webp','glossary-romance/reel.en.2.webp','glossary-romance/reel.en.3.webp']),
  ('glossary-sleep', 'pt', 'glossary-sleep/reel.pt.1.webp', array['glossary-sleep/reel.pt.1.webp','glossary-sleep/reel.pt.2.webp','glossary-sleep/reel.pt.3.webp']),
  ('glossary-sleep', 'en', 'glossary-sleep/reel.en.1.webp', array['glossary-sleep/reel.en.1.webp','glossary-sleep/reel.en.2.webp','glossary-sleep/reel.en.3.webp']),
  ('glossary-strength', 'pt', 'glossary-strength/reel.pt.1.webp', array['glossary-strength/reel.pt.1.webp','glossary-strength/reel.pt.2.webp','glossary-strength/reel.pt.3.webp']),
  ('glossary-strength', 'en', 'glossary-strength/reel.en.1.webp', array['glossary-strength/reel.en.1.webp','glossary-strength/reel.en.2.webp','glossary-strength/reel.en.3.webp']),
  ('news-loneliness-memory-2026-04', 'pt', 'news-loneliness-memory-2026-04/reel.pt.1.v2.webp', array['news-loneliness-memory-2026-04/reel.pt.1.v2.webp','news-loneliness-memory-2026-04/reel.pt.2.webp','news-loneliness-memory-2026-04/reel.pt.3.webp']),
  ('news-loneliness-memory-2026-04', 'en', 'news-loneliness-memory-2026-04/reel.en.1.v2.webp', array['news-loneliness-memory-2026-04/reel.en.1.v2.webp','news-loneliness-memory-2026-04/reel.en.2.webp','news-loneliness-memory-2026-04/reel.en.3.webp']),
  ('news-oral-glp1-2026-05', 'pt', 'news-oral-glp1-2026-05/reel.pt.1.webp', array['news-oral-glp1-2026-05/reel.pt.1.webp','news-oral-glp1-2026-05/reel.pt.2.webp','news-oral-glp1-2026-05/reel.pt.3.webp']),
  ('news-oral-glp1-2026-05', 'en', 'news-oral-glp1-2026-05/reel.en.1.webp', array['news-oral-glp1-2026-05/reel.en.1.webp','news-oral-glp1-2026-05/reel.en.2.webp','news-oral-glp1-2026-05/reel.en.3.webp']),
  ('non-instrumental-play', 'pt', 'non-instrumental-play/reel.pt.1.webp', array['non-instrumental-play/reel.pt.1.webp','non-instrumental-play/reel.pt.2.webp','non-instrumental-play/reel.pt.3.webp']),
  ('non-instrumental-play', 'en', 'non-instrumental-play/reel.en.1.webp', array['non-instrumental-play/reel.en.1.webp','non-instrumental-play/reel.en.2.webp','non-instrumental-play/reel.en.3.webp']),
  ('summary-antifragile', 'pt', 'summary-antifragile/reel.pt.1.webp', array['summary-antifragile/reel.pt.1.webp','summary-antifragile/reel.pt.2.webp','summary-antifragile/reel.pt.3.webp']),
  ('summary-antifragile', 'en', 'summary-antifragile/reel.en.1.webp', array['summary-antifragile/reel.en.1.webp','summary-antifragile/reel.en.2.webp','summary-antifragile/reel.en.3.webp']),
  ('summary-atomic-habits', 'pt', 'summary-atomic-habits/reel.pt.1.webp', array['summary-atomic-habits/reel.pt.1.webp','summary-atomic-habits/reel.pt.2.v2.webp','summary-atomic-habits/reel.pt.3.webp']),
  ('summary-atomic-habits', 'en', 'summary-atomic-habits/reel.en.1.webp', array['summary-atomic-habits/reel.en.1.webp','summary-atomic-habits/reel.en.2.v2.webp','summary-atomic-habits/reel.en.3.webp']),
  ('summary-deep-work', 'pt', 'summary-deep-work/reel.pt.1.webp', array['summary-deep-work/reel.pt.1.webp','summary-deep-work/reel.pt.2.webp','summary-deep-work/reel.pt.3.webp']),
  ('summary-deep-work', 'en', 'summary-deep-work/reel.en.1.webp', array['summary-deep-work/reel.en.1.webp','summary-deep-work/reel.en.2.webp','summary-deep-work/reel.en.3.webp']),
  ('summary-good-life', 'pt', 'summary-good-life/reel.pt.1.webp', array['summary-good-life/reel.pt.1.webp','summary-good-life/reel.pt.2.webp','summary-good-life/reel.pt.3.webp']),
  ('summary-good-life', 'en', 'summary-good-life/reel.en.1.webp', array['summary-good-life/reel.en.1.webp','summary-good-life/reel.en.2.webp','summary-good-life/reel.en.3.webp']),
  ('summary-outlive', 'pt', 'summary-outlive/reel.pt.1.webp', array['summary-outlive/reel.pt.1.webp','summary-outlive/reel.pt.2.webp','summary-outlive/reel.pt.3.webp']),
  ('summary-outlive', 'en', 'summary-outlive/reel.en.1.webp', array['summary-outlive/reel.en.1.webp','summary-outlive/reel.en.2.webp','summary-outlive/reel.en.3.webp']),
  ('summary-psychology-of-money', 'pt', 'summary-psychology-of-money/reel.pt.1.webp', array['summary-psychology-of-money/reel.pt.1.webp','summary-psychology-of-money/reel.pt.2.webp','summary-psychology-of-money/reel.pt.3.webp']),
  ('summary-psychology-of-money', 'en', 'summary-psychology-of-money/reel.en.1.webp', array['summary-psychology-of-money/reel.en.1.webp','summary-psychology-of-money/reel.en.2.webp','summary-psychology-of-money/reel.en.3.webp']),
  ('summary-why-we-sleep', 'pt', 'summary-why-we-sleep/reel.pt.1.webp', array['summary-why-we-sleep/reel.pt.1.webp','summary-why-we-sleep/reel.pt.2.webp','summary-why-we-sleep/reel.pt.3.webp']),
  ('summary-why-we-sleep', 'en', 'summary-why-we-sleep/reel.en.1.webp', array['summary-why-we-sleep/reel.en.1.webp','summary-why-we-sleep/reel.en.2.webp','summary-why-we-sleep/reel.en.3.webp']),
  ('ten-second-balance-test', 'pt', 'ten-second-balance-test/reel.pt.1.webp', array['ten-second-balance-test/reel.pt.1.webp','ten-second-balance-test/reel.pt.2.webp','ten-second-balance-test/reel.pt.3.webp']),
  ('ten-second-balance-test', 'en', 'ten-second-balance-test/reel.en.1.webp', array['ten-second-balance-test/reel.en.1.webp','ten-second-balance-test/reel.en.2.webp','ten-second-balance-test/reel.en.3.webp']),
  ('weak-ties-job-search', 'pt', 'weak-ties-job-search/reel.pt.1.webp', array['weak-ties-job-search/reel.pt.1.webp','weak-ties-job-search/reel.pt.2.webp','weak-ties-job-search/reel.pt.3.webp']),
  ('weak-ties-job-search', 'en', 'weak-ties-job-search/reel.en.1.webp', array['weak-ties-job-search/reel.en.1.webp','weak-ties-job-search/reel.en.2.webp','weak-ties-job-search/reel.en.3.webp'])
)
insert into public.learning_material_media
  (material_id, kind, locale, path, page_paths, source, meta)
select m.id, 'reel', d.locale, d.path, d.page_paths, 'manual',
       jsonb_build_object('width', 1080, 'height', 1920)
from data d
join public.learning_material m on m.slug = d.slug
on conflict (material_id, kind, locale) do update
  set path = excluded.path,
      page_paths = excluded.page_paths,
      meta = excluded.meta,
      source = excluded.source;

commit;
