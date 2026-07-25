-- Rename the "dexterity" sub's DISPLAY strings: Destreza → Mobilidade (pt), Dexterity → Mobility (en).
--
-- Scope: display columns ONLY. The id 'dexterity' is load-bearing — it is a PK/FK/union
-- member everywhere (dimension_sub.id, task_template ids dexterity_*, psych facet/item ids,
-- quest_template.category + requirements jsonb sub_id, learning_material.slug/topic,
-- learning_material_sub.sub_id, skill.sub_id, and the client SubId union) — and MUST NOT
-- change here or anywhere else. The client renders sub names from i18n (subs.dexterity.label,
-- renamed in the same PR); these DB rows cover catalog surfaces that read *_pt/*_en columns
-- (quest_template, learning_material) plus dormant name columns (dimension_sub, psych_facet)
-- so no future surface resurrects "Destreza".
--
-- All statements are plain UPDATEs with explicit SETs or replace() — idempotent by nature.

-- 1) dimension_sub catalog row (display columns are not rendered today, kept in sync anyway)
update public.dimension_sub
set display_name = 'Mobility',
    display_name_pt = 'Mobilidade'
where id = 'dexterity';

-- 2) psych facets bridging to the sub (facet names are never rendered; kept in sync)
update public.psych_facet
set name = 'Mobilidade'
where id in ('avaliacao_v1:sub:dexterity', 'avaliacao_v2:sub:dexterity');

-- 3) Quest template "Acumular 8★ em Destreza" — titles rendered via title_pt/title_en.
--    Descriptions are generic in the seed (no Destreza/Dexterity), replace() is a safe no-op guard.
update public.quest_template
set title_pt = 'Acumular 8★ em Mobilidade em 30 dias',
    title_en = 'Stack 8★ in Mobility over 30 days',
    description_pt = replace(replace(description_pt, 'Destreza', 'Mobilidade'), 'destreza', 'mobilidade'),
    description_en = replace(replace(description_en, 'Dexterity', 'Mobility'), 'dexterity', 'mobility')
where id = 'sub_stars_dexterity';

-- 4) Learning glossary entry (slug stays 'glossary-dexterity').
--    Titles set explicitly — the pt title already contains 'mobilidade', so replace() would
--    produce a degenerate 'Mobilidade — mobilidade e precisão'; the new titles re-anchor the
--    subtitle on coordination/precision instead.
update public.learning_material
set title_pt = 'Mobilidade — coordenação e precisão',
    title_en = 'Mobility — coordination and precision',
    summary_pt = replace(replace(summary_pt, 'Destreza', 'Mobilidade'), 'destreza', 'mobilidade'),
    summary_en = replace(replace(summary_en, 'Dexterity', 'Mobility'), 'dexterity', 'mobility'),
    body_pt = replace(replace(body_pt, 'Destreza', 'Mobilidade'), 'destreza', 'mobilidade'),
    body_en = replace(replace(body_en, 'Dexterity', 'Mobility'), 'dexterity', 'mobility'),
    tracking_pt = replace(replace(tracking_pt, 'Destreza', 'Mobilidade'), 'destreza', 'mobilidade'),
    tracking_en = replace(replace(tracking_en, 'Dexterity', 'Mobility'), 'dexterity', 'mobility')
where slug = 'glossary-dexterity';
