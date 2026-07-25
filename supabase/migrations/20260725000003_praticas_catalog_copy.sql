-- migration: 20260725000003_praticas_catalog_copy.sql
-- purpose: finish the Tarefas→Práticas / Tasks→Practices rename inside DB
--          catalog DISPLAY copy. The app-side i18n rename shipped in the
--          same PR (feat/feedback-r2-hoje); these rows are the catalog
--          surfaces that still say "task(s)"/"tarefa(s)" in the entity
--          sense (the app object), read via *_pt/*_en columns.
--
-- scope (verified row by row against the seed migrations):
--   1. quest_template  — the 12 'sub_stars_*' templates seeded in
--      20260527000002: description_pt/'Toda task que toca este sub…' and
--      description_en/'Every task that touches this sub…'.
--   2. learning_material glossary-* (12 rows, seeded 20260514000011, bodies
--      partially rewritten in 20260524000001, tracking re-set in
--      20260515000003): body_pt/body_en/tracking_pt/tracking_en paragraphs
--      of the shape 'Tasks de "…" contribuem aqui' / 'Tasks for "…" land
--      here', plus 'Suas tasks de'/'Your tasks for' (sleep, strength) and
--      'tasks com peso alto'/'tasks de alto peso'/'high-weight tasks'
--      (career, build).
--   3. learning_material tracking columns of 5 non-glossary materials where
--      'tarefa'/'task' means the app entity: summary-deep-work
--      (20260608000001), does-money-buy-happiness (20260722000003),
--      summary-antifragile (20260722000006), non-instrumental-play
--      (20260722000007), summary-atomic-habits (20260722000008).
--
-- deliberately NOT touched:
--   - ids/slugs/category columns and requirements jsonb — 'task' there is
--     load-bearing (task_template ids, requirement kinds, cta_action).
--   - reward_template + quest seeds 20260517000003/20260517000004 — audited,
--     display copy is clean of entity-sense 'task'.
--   - psych item text ('Encaro tarefas difíceis…', Big Five/strengths/types
--     seeds) — 'tarefas' there is the chores/life-tasks sense, not the app
--     entity.
--   - learning_material body prose where 'tarefa' is the generic work-task
--     sense (deep-work attention-residue passages, 'tarefas físicas' in the
--     longevity materials).
--   - reasoning_log jsonb — internal production metadata, never rendered.
--
-- All statements are replace() chains scoped by WHERE guards — idempotent
-- by nature (second run finds nothing to match and no rows to touch).

-- ── 1. quest_template: the 12 accumulate_sub_stars templates ─────────────
update public.quest_template
set description_pt = replace(
      description_pt,
      'Toda task que toca este sub',
      'Toda prática que toca este sub'
    ),
    description_en = replace(
      description_en,
      'Every task that touches this sub',
      'Every practice that touches this sub'
    )
where id like 'sub\_stars\_%'
  and (
    description_pt like '%Toda task que toca este sub%'
    or description_en like '%Every task that touches this sub%'
  );

-- ── 2. learning_material: the 12 sub glossary entries ────────────────────
-- The same phrases appear at the end of body_pt/body_en (20260514000011)
-- and in tracking_pt/tracking_en (20260515000003 / 20260524000001), so all
-- four columns get the same chains. Order matters only for readability —
-- the phrases are mutually exclusive ('Suas tasks de' is lowercase-t, so
-- the capitalized 'Tasks de' chain never double-hits it).
update public.learning_material
set body_pt = replace(replace(replace(replace(body_pt,
      'Suas tasks de', 'Suas práticas de'),
      'Tasks de', 'Práticas de'),
      'tasks com peso alto', 'práticas com peso alto'),
      'tasks de alto peso', 'práticas de alto peso'),
    body_en = replace(replace(replace(body_en,
      'Your tasks for', 'Your practices for'),
      'Tasks for', 'Practices for'),
      'high-weight tasks', 'high-weight practices'),
    tracking_pt = replace(replace(replace(replace(tracking_pt,
      'Suas tasks de', 'Suas práticas de'),
      'Tasks de', 'Práticas de'),
      'tasks com peso alto', 'práticas com peso alto'),
      'tasks de alto peso', 'práticas de alto peso'),
    tracking_en = replace(replace(replace(tracking_en,
      'Your tasks for', 'Your practices for'),
      'Tasks for', 'Practices for'),
      'high-weight tasks', 'high-weight practices')
where slug like 'glossary-%'
  and (
    body_pt ilike '%tasks%'
    or body_en ilike '%tasks%'
    or tracking_pt ilike '%tasks%'
    or tracking_en ilike '%tasks%'
  );

-- ── 3. learning_material: entity-sense 'tarefa/task' in tracking copy ────

-- 3a. summary-deep-work (20260608000001) — "create a daily task" bridge.
update public.learning_material
set tracking_pt = replace(
      tracking_pt,
      'criar uma tarefa diária',
      'criar uma prática diária'
    ),
    tracking_en = replace(
      tracking_en,
      'create a daily task',
      'create a daily practice'
    )
where slug = 'summary-deep-work'
  and (
    tracking_pt like '%criar uma tarefa diária%'
    or tracking_en like '%create a daily task%'
  );

-- 3b. does-money-buy-happiness (20260722000003) — "use as tarefas dessa sub".
update public.learning_material
set tracking_pt = replace(
      tracking_pt,
      'Use as tarefas dessa sub',
      'Use as práticas dessa sub'
    ),
    tracking_en = replace(
      tracking_en,
      'Use that sub''s tasks',
      'Use that sub''s practices'
    )
where slug = 'does-money-buy-happiness'
  and (
    tracking_pt like '%Use as tarefas dessa sub%'
    or tracking_en like '%Use that sub''s tasks%'
  );

-- 3c. summary-antifragile (20260722000006) — weekly/monthly task bridges.
update public.learning_material
set tracking_pt = replace(replace(tracking_pt,
      'crie uma tarefa semanal', 'crie uma prática semanal'),
      'uma tarefa mensal de revisar', 'uma prática mensal de revisar'),
    tracking_en = replace(replace(tracking_en,
      'voluntary-discomfort task', 'voluntary-discomfort practice'),
      'a monthly task reviewing', 'a monthly practice reviewing')
where slug = 'summary-antifragile'
  and (
    tracking_pt like '%tarefa%'
    or tracking_en like '%task%'
  );

-- 3d. non-instrumental-play (20260722000007) — "crie tarefas de lazer".
update public.learning_material
set tracking_pt = replace(
      tracking_pt,
      'crie tarefas de lazer',
      'crie práticas de lazer'
    ),
    tracking_en = replace(
      tracking_en,
      'create leisure tasks',
      'create leisure practices'
    )
where slug = 'non-instrumental-play'
  and (
    tracking_pt like '%crie tarefas de lazer%'
    or tracking_en like '%create leisure tasks%'
  );

-- 3e. summary-atomic-habits (20260722000008) — daily-task-as-vote bridge.
update public.learning_material
set tracking_pt = replace(replace(tracking_pt,
      'cada tarefa diária concluída', 'cada prática diária concluída'),
      'cria a tarefa diária e assiste', 'cria a prática diária e assiste'),
    tracking_en = replace(replace(tracking_en,
      'every completed daily task', 'every completed daily practice'),
      'create the daily task', 'create the daily practice')
where slug = 'summary-atomic-habits'
  and (
    tracking_pt like '%tarefa diária%'
    or tracking_en like '%daily task%'
  );
