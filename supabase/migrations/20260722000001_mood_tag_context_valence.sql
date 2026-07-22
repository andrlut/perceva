-- migration: 20260722000001_mood_tag_context_valence.sql
-- purpose: journal v2 vocabulary — Apple State-of-Mind-style split between
--          "how it felt" (emotion) and "what influenced it" (context), plus a
--          valence hint so the client can adaptively order emotion words
--          around the selected 1..5 mood.
--
-- affected tables: mood_tag (new column `valence`, +12 emotion rows,
--                  +16 context rows)
-- new rpcs:        none (log_mood already validates any catalog slug)
-- breaking?       no — additive; shipped clients ignore the new rows/column
--
-- notes:
--   migrations are write-once; never edit after applying
--   valence is an ORDERING hint only (-2 worst .. +2 best), never a filter:
--   every emotion stays selectable at every mood ("felt good overall but
--   overwhelmed" is a first-class entry). Context tags are valence-null by
--   definition — work/family/sleep are not inherently good or bad.

begin;

-- ─── 1. valence hint on the catalog ─────────────────────────────────────────
alter table public.mood_tag
  add column if not exists valence smallint
  check (valence between -2 and 2);

-- Existing 12 emotion tags get their valence.
update public.mood_tag set valence = v.valence
from (values
  ('energetic',    1),
  ('tired',       -1),
  ('calm',         1),
  ('anxious',     -2),
  ('excited',      2),
  ('irritated',   -1),
  ('in_pain',     -2),
  ('sad',         -2),
  ('grateful',     2),
  ('focused',      1),
  ('overwhelmed', -1),
  ('scattered',   -1)
) as v(slug, valence)
where mood_tag.slug = v.slug;

-- ─── 2. Wider emotion vocabulary (sort_order continues after 120) ───────────
insert into public.mood_tag (slug, label_pt, label_en, emoji, tag_group, sort_order, valence) values
  ('proud',       'Orgulhoso',   'Proud',       '🏅', 'emotion', 130,  2),
  ('loved',       'Amado',       'Loved',       '🥰', 'emotion', 140,  2),
  ('motivated',   'Motivado',    'Motivated',   '🔥', 'emotion', 150,  1),
  ('confident',   'Confiante',   'Confident',   '😎', 'emotion', 160,  1),
  ('content',     'Satisfeito',  'Content',     '😊', 'emotion', 170,  1),
  ('hopeful',     'Esperançoso', 'Hopeful',     '🌱', 'emotion', 180,  1),
  ('bored',       'Entediado',   'Bored',       '😑', 'emotion', 190, -1),
  ('worried',     'Preocupado',  'Worried',     '😟', 'emotion', 200, -1),
  ('frustrated',  'Frustrado',   'Frustrated',  '😖', 'emotion', 210, -1),
  ('stressed',    'Estressado',  'Stressed',    '🤯', 'emotion', 220, -1),
  ('lonely',      'Sozinho',     'Lonely',      '🫥', 'emotion', 230, -1),
  ('discouraged', 'Desanimado',  'Discouraged', '😞', 'emotion', 240, -2)
on conflict (slug) do nothing;

-- ─── 3. Context tags — "what influenced your day" (valence null) ────────────
insert into public.mood_tag (slug, label_pt, label_en, emoji, tag_group, sort_order) values
  ('work',         'Trabalho',      'Work',         '💼', 'context',  10),
  ('studies',      'Estudos',       'Studies',      '📚', 'context',  20),
  ('family',       'Família',       'Family',       '👨‍👩‍👧', 'context',  30),
  ('friends',      'Amigos',        'Friends',      '🫂', 'context',  40),
  ('romance',      'Amor',          'Love',         '❤️', 'context',  50),
  ('health',       'Saúde',         'Health',       '🩺', 'context',  60),
  ('sleep',        'Sono',          'Sleep',        '😴', 'context',  70),
  ('food',         'Alimentação',   'Food',         '🍽️', 'context',  80),
  ('fitness',      'Treino',        'Exercise',     '💪', 'context',  90),
  ('money',        'Dinheiro',      'Money',        '💰', 'context', 100),
  ('home',         'Casa',          'Home',         '🏠', 'context', 110),
  ('leisure',      'Lazer',         'Leisure',      '🎮', 'context', 120),
  ('travel',       'Viagem',        'Travel',       '✈️', 'context', 130),
  ('weather',      'Clima',         'Weather',      '🌦️', 'context', 140),
  ('news',         'Notícias',      'News',         '📰', 'context', 150),
  ('social_media', 'Redes sociais', 'Social media', '📱', 'context', 160)
on conflict (slug) do nothing;

commit;
