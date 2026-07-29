-- migration: 20260729000290_learning_covers_bigrelease.sql
-- purpose: big-release fast-follow — attach Gemini cover art (hero_image_url) to the
--          20 materials that shipped text+infographic without a cover.
-- affected: learning_material.hero_image_url (20 rows). Idempotent plain updates.
-- assets: learning-media/<slug>/cover.webp (768x1152, 2:3, textless, flat-vector house style),
--         generated via tools/content-media (Gemini 2.5 Flash Image), uploaded + verified HTTP 200.
begin;

update public.learning_material set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/does-money-buy-happiness/cover.webp', updated_at = now() where slug = 'does-money-buy-happiness';
update public.learning_material set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/explainer-career-capital/cover.webp', updated_at = now() where slug = 'explainer-career-capital';
update public.learning_material set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/glossary-build/cover.webp', updated_at = now() where slug = 'glossary-build';
update public.learning_material set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/glossary-career/cover.webp', updated_at = now() where slug = 'glossary-career';
update public.learning_material set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/glossary-circle/cover.webp', updated_at = now() where slug = 'glossary-circle';
update public.learning_material set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/glossary-contemplate/cover.webp', updated_at = now() where slug = 'glossary-contemplate';
update public.learning_material set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/glossary-dexterity/cover.webp', updated_at = now() where slug = 'glossary-dexterity';
update public.learning_material set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/glossary-learn/cover.webp', updated_at = now() where slug = 'glossary-learn';
update public.learning_material set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/glossary-money/cover.webp', updated_at = now() where slug = 'glossary-money';
update public.learning_material set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/glossary-nutrition/cover.webp', updated_at = now() where slug = 'glossary-nutrition';
update public.learning_material set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/glossary-play/cover.webp', updated_at = now() where slug = 'glossary-play';
update public.learning_material set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/glossary-romance/cover.webp', updated_at = now() where slug = 'glossary-romance';
update public.learning_material set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/glossary-sleep/cover.webp', updated_at = now() where slug = 'glossary-sleep';
update public.learning_material set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/glossary-strength/cover.webp', updated_at = now() where slug = 'glossary-strength';
update public.learning_material set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/news-loneliness-memory-2026-04/cover.webp', updated_at = now() where slug = 'news-loneliness-memory-2026-04';
update public.learning_material set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/news-oral-glp1-2026-05/cover.webp', updated_at = now() where slug = 'news-oral-glp1-2026-05';
update public.learning_material set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/non-instrumental-play/cover.webp', updated_at = now() where slug = 'non-instrumental-play';
update public.learning_material set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/summary-outlive/cover.webp', updated_at = now() where slug = 'summary-outlive';
update public.learning_material set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/summary-psychology-of-money/cover.webp', updated_at = now() where slug = 'summary-psychology-of-money';
update public.learning_material set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/summary-why-we-sleep/cover.webp', updated_at = now() where slug = 'summary-why-we-sleep';

commit;
