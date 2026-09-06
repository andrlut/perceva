-- Fix: the Trommelen 2023 source URL contained parentheses, which the client
-- cannot parse. `app/components/LearningBody.tsx` matches source rows with
--   /^:::source\[([^\]]*)\](?:\(([^)]*)\))?\s*$/
-- and the `(23)` inside .../S2666-3791(23)00540-2 makes the whole line fail to
-- match, so the attribution row rendered broken. tools/learning-lint also
-- flagged it as a FAIL ("malformed :::source").
--
-- Swapped for the canonical DOI, which resolves to the same paper and carries
-- no parentheses. Applied to body_pt, body_en and the source_url column.
-- 20260906000001 is already applied to the cloud, so this is a follow-up
-- migration rather than an edit to a write-once file.

update public.learning_material
set body_pt    = replace(body_pt,
                   'https://www.cell.com/cell-reports-medicine/fulltext/S2666-3791(23)00540-2',
                   'https://doi.org/10.1016/j.xcrm.2023.101324'),
    body_en    = replace(body_en,
                   'https://www.cell.com/cell-reports-medicine/fulltext/S2666-3791(23)00540-2',
                   'https://doi.org/10.1016/j.xcrm.2023.101324'),
    source_url = 'https://doi.org/10.1016/j.xcrm.2023.101324',
    updated_at = now()
where slug = 'protein-distribution-30g-myth';
