-- migration: 20260729000320_learning_goodlife_cover.sql
-- purpose: give summary-good-life its own cover (intertwined hands on a warm-lit table)
--          instead of the reused two-trees orphan, which duplicated attachment-styles-love's
--          tree art. The tree stays with attachment-styles-love (the user's own reference art).
-- affected: learning_material.hero_image_url (1 row). Idempotent.
-- asset: learning-media/summary-good-life/cover.webp (768x1152, textless, uploaded + HTTP 200).
--        old orphan good-life/cover.webp is left in the bucket untouched (never deleted).
begin;

update public.learning_material
set hero_image_url = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/summary-good-life/cover.webp',
    updated_at = now()
where slug = 'summary-good-life';

commit;
