-- ============================================================================
-- Backfill English translations for avaliacao_v2 items.
--
-- The avaliacao_v2 instrument was seeded PT-only (96 items × custom options).
-- Big-five / Schwartz / ECR-R all shipped bilingual from day one via the
-- `scale_labels` jsonb on `psych_instrument` (uniform Likert), but
-- avaliacao_v2 uses per-item custom options that vary in wording — so the
-- bilingual labels have to live on each `psych_item.options_jsonb`.
--
-- Schema is unchanged. Each option in `options_jsonb` now carries an
-- additional `label_en` key alongside the existing `label` (PT). The client
-- picks `label_en` when locale === 'en' and falls back to `label` otherwise,
-- mirroring how `text_pt`/`text_en` are resolved on the item itself.
--
-- 96 UPDATEs follow, grouped by sub (sleep → nutrition → strength → dexterity
-- → learn → contemplate → money → career → circle → romance → play → build).
-- Each sub has 8 items (4 facets × 2 alternates).
-- ============================================================================

begin;

-- ─── SLEEP ──────────────────────────────────────────────────────────────────
update public.psych_item set
  text_en = 'In a typical week, how many nights do you sleep 7+ hours?',
  options_jsonb = '[
    {"value":1,"label":"Nenhuma ou quase nenhuma","label_en":"None or almost none"},
    {"value":2,"label":"1-2 noites","label_en":"1-2 nights"},
    {"value":3,"label":"3-4 noites","label_en":"3-4 nights"},
    {"value":4,"label":"5-6 noites","label_en":"5-6 nights"},
    {"value":5,"label":"Quase toda noite","label_en":"Almost every night"}
  ]'::jsonb
where id = 'v2:sleep:behavior:a';

update public.psych_item set
  text_en = 'In a typical week, on how many days do you sleep and wake at consistent times (variation <30 min)?',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"1-2 dias","label_en":"1-2 days"},
    {"value":3,"label":"3-4 dias","label_en":"3-4 days"},
    {"value":4,"label":"5-6 dias","label_en":"5-6 days"},
    {"value":5,"label":"Quase todo dia","label_en":"Almost every day"}
  ]'::jsonb
where id = 'v2:sleep:behavior:b';

update public.psych_item set
  text_en = 'Your sleep is continuous — you don''t wake up several times in the middle of the night.',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"Raramente","label_en":"Rarely"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Frequentemente","label_en":"Often"},
    {"value":5,"label":"Quase sempre","label_en":"Almost always"}
  ]'::jsonb
where id = 'v2:sleep:quality:a';

update public.psych_item set
  text_en = 'You fall asleep within 20 minutes of lying down, without tossing around.',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"Raramente","label_en":"Rarely"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Frequentemente","label_en":"Often"},
    {"value":5,"label":"Quase sempre","label_en":"Almost always"}
  ]'::jsonb
where id = 'v2:sleep:quality:b';

update public.psych_item set
  text_en = 'I wake up rested and sustain my energy through the day, without needing caffeine to function.',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"Raramente","label_en":"Rarely"},
    {"value":3,"label":"Mais ou menos","label_en":"Somewhat"},
    {"value":4,"label":"Maioria dos dias","label_en":"Most days"},
    {"value":5,"label":"Quase todo dia","label_en":"Almost every day"}
  ]'::jsonb
where id = 'v2:sleep:result:a';

update public.psych_item set
  text_en = 'I keep focus and mood through the afternoon — I don''t hit a wall with sleepiness or irritation.',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"Raramente","label_en":"Rarely"},
    {"value":3,"label":"Mais ou menos","label_en":"Somewhat"},
    {"value":4,"label":"Maioria dos dias","label_en":"Most days"},
    {"value":5,"label":"Quase todo dia","label_en":"Almost every day"}
  ]'::jsonb
where id = 'v2:sleep:result:b';

update public.psych_item set
  text_en = 'How often do insomnia, nighttime anxiety, or rumination disrupt your sleep?',
  options_jsonb = '[
    {"value":1,"label":"Quase todo dia","label_en":"Almost every day"},
    {"value":2,"label":"Frequentemente","label_en":"Often"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Raramente","label_en":"Rarely"},
    {"value":5,"label":"Quase nunca","label_en":"Almost never"}
  ]'::jsonb
where id = 'v2:sleep:friction:a';

update public.psych_item set
  text_en = 'How often do screens, work, or a chaotic routine push you to bed too late?',
  options_jsonb = '[
    {"value":1,"label":"Quase todo dia","label_en":"Almost every day"},
    {"value":2,"label":"Frequentemente","label_en":"Often"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Raramente","label_en":"Rarely"},
    {"value":5,"label":"Quase nunca","label_en":"Almost never"}
  ]'::jsonb
where id = 'v2:sleep:friction:b';

-- ─── NUTRITION ──────────────────────────────────────────────────────────────
update public.psych_item set
  text_en = 'In a typical week, on how many days do you eat real meals (no fast food, no skipped meals)?',
  options_jsonb = '[
    {"value":1,"label":"0-1 dias","label_en":"0-1 days"},
    {"value":2,"label":"2 dias","label_en":"2 days"},
    {"value":3,"label":"3-4 dias","label_en":"3-4 days"},
    {"value":4,"label":"5-6 dias","label_en":"5-6 days"},
    {"value":5,"label":"Praticamente todos","label_en":"Practically every"}
  ]'::jsonb
where id = 'v2:nutrition:behavior:a';

update public.psych_item set
  text_en = 'In a typical week, on how many days do you prepare or choose your food with attention (not on autopilot)?',
  options_jsonb = '[
    {"value":1,"label":"0-1 dias","label_en":"0-1 days"},
    {"value":2,"label":"2 dias","label_en":"2 days"},
    {"value":3,"label":"3-4 dias","label_en":"3-4 days"},
    {"value":4,"label":"5-6 dias","label_en":"5-6 days"},
    {"value":5,"label":"Praticamente todos","label_en":"Practically every"}
  ]'::jsonb
where id = 'v2:nutrition:behavior:b';

update public.psych_item set
  text_en = 'Your meals include quality protein and vegetables — not just carbs and ultra-processed stuff.',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"Raramente","label_en":"Rarely"},
    {"value":3,"label":"Mais ou menos","label_en":"Somewhat"},
    {"value":4,"label":"Maioria das refeições","label_en":"Most meals"},
    {"value":5,"label":"Quase sempre","label_en":"Almost always"}
  ]'::jsonb
where id = 'v2:nutrition:quality:a';

update public.psych_item set
  text_en = 'You drink enough water to keep your urine clear throughout the day.',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"Raramente","label_en":"Rarely"},
    {"value":3,"label":"Mais ou menos","label_en":"Somewhat"},
    {"value":4,"label":"Maioria dos dias","label_en":"Most days"},
    {"value":5,"label":"Quase sempre","label_en":"Almost always"}
  ]'::jsonb
where id = 'v2:nutrition:quality:b';

update public.psych_item set
  text_en = 'My relationship with food is calm — no guilt, no obsession, no compulsion.',
  options_jsonb = '[
    {"value":1,"label":"Discordo totalmente","label_en":"Strongly disagree"},
    {"value":2,"label":"Discordo","label_en":"Disagree"},
    {"value":3,"label":"Mais ou menos","label_en":"Somewhat"},
    {"value":4,"label":"Concordo","label_en":"Agree"},
    {"value":5,"label":"Concordo totalmente","label_en":"Strongly agree"}
  ]'::jsonb
where id = 'v2:nutrition:result:a';

update public.psych_item set
  text_en = 'Food gives me stable energy — it doesn''t leave me heavy, sleepy, or anxious afterward.',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"Raramente","label_en":"Rarely"},
    {"value":3,"label":"Mais ou menos","label_en":"Somewhat"},
    {"value":4,"label":"Maioria das refeições","label_en":"Most meals"},
    {"value":5,"label":"Quase sempre","label_en":"Almost always"}
  ]'::jsonb
where id = 'v2:nutrition:result:b';

update public.psych_item set
  text_en = 'How often do you eat on autopilot or compulsively, even without hunger?',
  options_jsonb = '[
    {"value":1,"label":"Quase todo dia","label_en":"Almost every day"},
    {"value":2,"label":"Frequentemente","label_en":"Often"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Raramente","label_en":"Rarely"},
    {"value":5,"label":"Quase nunca","label_en":"Almost never"}
  ]'::jsonb
where id = 'v2:nutrition:friction:a';

update public.psych_item set
  text_en = 'How often do extreme restriction, aggressive dieting, or rigid rules dominate your relationship with food?',
  options_jsonb = '[
    {"value":1,"label":"Quase todo dia","label_en":"Almost every day"},
    {"value":2,"label":"Frequentemente","label_en":"Often"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Raramente","label_en":"Rarely"},
    {"value":5,"label":"Quase nunca","label_en":"Almost never"}
  ]'::jsonb
where id = 'v2:nutrition:friction:b';

-- ─── STRENGTH ───────────────────────────────────────────────────────────────
update public.psych_item set
  text_en = 'In a typical week, on how many days do you do physical activity that gets you out of sedentary mode (training, cardio, sport) for 20+ minutes?',
  options_jsonb = '[
    {"value":1,"label":"Nunca ou quase nunca","label_en":"Never or almost never"},
    {"value":2,"label":"1 dia","label_en":"1 day"},
    {"value":3,"label":"2 dias","label_en":"2 days"},
    {"value":4,"label":"3-4 dias","label_en":"3-4 days"},
    {"value":5,"label":"5+ dias","label_en":"5+ days"}
  ]'::jsonb
where id = 'v2:strength:behavior:a';

update public.psych_item set
  text_en = 'In a typical week, on how many days do you specifically do strength training (weights, calisthenics, kettlebell)?',
  options_jsonb = '[
    {"value":1,"label":"Nenhum","label_en":"None"},
    {"value":2,"label":"1 dia","label_en":"1 day"},
    {"value":3,"label":"2 dias","label_en":"2 days"},
    {"value":4,"label":"3 dias","label_en":"3 days"},
    {"value":5,"label":"4+ dias","label_en":"4+ days"}
  ]'::jsonb
where id = 'v2:strength:behavior:b';

update public.psych_item set
  text_en = 'When you train, you really challenge yourself — you leave your comfort zone, not just kill time.',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"Raramente","label_en":"Rarely"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Frequentemente","label_en":"Often"},
    {"value":5,"label":"Quase sempre","label_en":"Almost always"}
  ]'::jsonb
where id = 'v2:strength:quality:a';

update public.psych_item set
  text_en = 'You perform exercises with good form — no compensating, no getting hurt from sloppy technique.',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"Raramente","label_en":"Rarely"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Frequentemente","label_en":"Often"},
    {"value":5,"label":"Quase sempre","label_en":"Almost always"}
  ]'::jsonb
where id = 'v2:strength:quality:b';

update public.psych_item set
  text_en = 'My body feels strong and capable day-to-day — I take stairs, carry weight, play a sport without faltering.',
  options_jsonb = '[
    {"value":1,"label":"Nem um pouco","label_en":"Not at all"},
    {"value":2,"label":"Pouco","label_en":"A little"},
    {"value":3,"label":"Mais ou menos","label_en":"Somewhat"},
    {"value":4,"label":"Bastante","label_en":"A lot"},
    {"value":5,"label":"Totalmente","label_en":"Completely"}
  ]'::jsonb
where id = 'v2:strength:result:a';

update public.psych_item set
  text_en = 'I''m stronger today than I was 6 months ago — in weight, reps, or volume on some exercise.',
  options_jsonb = '[
    {"value":1,"label":"Discordo totalmente","label_en":"Strongly disagree"},
    {"value":2,"label":"Discordo","label_en":"Disagree"},
    {"value":3,"label":"Neutro","label_en":"Neutral"},
    {"value":4,"label":"Concordo","label_en":"Agree"},
    {"value":5,"label":"Concordo totalmente","label_en":"Strongly agree"}
  ]'::jsonb
where id = 'v2:strength:result:b';

update public.psych_item set
  text_en = 'How often do pain, injury, or fatigue stop you from training the way you''d like?',
  options_jsonb = '[
    {"value":1,"label":"Quase todo dia","label_en":"Almost every day"},
    {"value":2,"label":"Frequentemente","label_en":"Often"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Raramente","label_en":"Rarely"},
    {"value":5,"label":"Quase nunca","label_en":"Almost never"}
  ]'::jsonb
where id = 'v2:strength:friction:a';

update public.psych_item set
  text_en = 'How often do lack of time, motivation, or logistics (gym, equipment) keep you out of training?',
  options_jsonb = '[
    {"value":1,"label":"Quase todo dia","label_en":"Almost every day"},
    {"value":2,"label":"Frequentemente","label_en":"Often"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Raramente","label_en":"Rarely"},
    {"value":5,"label":"Quase nunca","label_en":"Almost never"}
  ]'::jsonb
where id = 'v2:strength:friction:b';

-- ─── DEXTERITY ──────────────────────────────────────────────────────────────
update public.psych_item set
  text_en = 'In a typical week, on how many days do you dedicate 10+ minutes to mobility, stretching, or conscious posture?',
  options_jsonb = '[
    {"value":1,"label":"Nunca","label_en":"Never"},
    {"value":2,"label":"1 dia","label_en":"1 day"},
    {"value":3,"label":"2 dias","label_en":"2 days"},
    {"value":4,"label":"3-4 dias","label_en":"3-4 days"},
    {"value":5,"label":"5+ dias","label_en":"5+ days"}
  ]'::jsonb
where id = 'v2:dexterity:behavior:a';

update public.psych_item set
  text_en = 'In a typical week, on how many days do you practice something that demands balance or fine coordination (yoga, dance, racquet sport, climbing)?',
  options_jsonb = '[
    {"value":1,"label":"Nenhum","label_en":"None"},
    {"value":2,"label":"1 dia","label_en":"1 day"},
    {"value":3,"label":"2 dias","label_en":"2 days"},
    {"value":4,"label":"3 dias","label_en":"3 days"},
    {"value":5,"label":"4+ dias","label_en":"4+ days"}
  ]'::jsonb
where id = 'v2:dexterity:behavior:b';

update public.psych_item set
  text_en = 'When you stretch or do mobility work, you pay attention to your breath and where you''re stuck — you don''t skip over it.',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"Raramente","label_en":"Rarely"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Frequentemente","label_en":"Often"},
    {"value":5,"label":"Quase sempre","label_en":"Almost always"}
  ]'::jsonb
where id = 'v2:dexterity:quality:a';

update public.psych_item set
  text_en = 'Your range of motion is greater today than it was 6 months ago.',
  options_jsonb = '[
    {"value":1,"label":"Discordo totalmente","label_en":"Strongly disagree"},
    {"value":2,"label":"Discordo","label_en":"Disagree"},
    {"value":3,"label":"Neutro","label_en":"Neutral"},
    {"value":4,"label":"Concordo","label_en":"Agree"},
    {"value":5,"label":"Concordo totalmente","label_en":"Strongly agree"}
  ]'::jsonb
where id = 'v2:dexterity:quality:b';

update public.psych_item set
  text_en = 'I move pain-free, with good range and coordination — no creaks, no locks, no compensating.',
  options_jsonb = '[
    {"value":1,"label":"Nem um pouco","label_en":"Not at all"},
    {"value":2,"label":"Pouco","label_en":"A little"},
    {"value":3,"label":"Mais ou menos","label_en":"Somewhat"},
    {"value":4,"label":"Bastante","label_en":"A lot"},
    {"value":5,"label":"Totalmente","label_en":"Completely"}
  ]'::jsonb
where id = 'v2:dexterity:result:a';

update public.psych_item set
  text_en = 'I have balance and readiness to react well to a stumble, a sport, or an unexpected movement.',
  options_jsonb = '[
    {"value":1,"label":"Nem um pouco","label_en":"Not at all"},
    {"value":2,"label":"Pouco","label_en":"A little"},
    {"value":3,"label":"Mais ou menos","label_en":"Somewhat"},
    {"value":4,"label":"Bastante","label_en":"A lot"},
    {"value":5,"label":"Totalmente","label_en":"Completely"}
  ]'::jsonb
where id = 'v2:dexterity:result:b';

update public.psych_item set
  text_en = 'How often do you feel chronic pain, bad posture, or stiffness in some joint?',
  options_jsonb = '[
    {"value":1,"label":"Quase todo dia","label_en":"Almost every day"},
    {"value":2,"label":"Frequentemente","label_en":"Often"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Raramente","label_en":"Rarely"},
    {"value":5,"label":"Quase nunca","label_en":"Almost never"}
  ]'::jsonb
where id = 'v2:dexterity:friction:a';

update public.psych_item set
  text_en = 'How often do you avoid movements or sports out of fear of getting hurt?',
  options_jsonb = '[
    {"value":1,"label":"Quase sempre","label_en":"Almost always"},
    {"value":2,"label":"Frequentemente","label_en":"Often"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Raramente","label_en":"Rarely"},
    {"value":5,"label":"Quase nunca","label_en":"Almost never"}
  ]'::jsonb
where id = 'v2:dexterity:friction:b';

-- ─── LEARN ──────────────────────────────────────────────────────────────────
update public.psych_item set
  text_en = 'In a typical week, on how many days do you dedicate 20+ minutes to intentional reading or study?',
  options_jsonb = '[
    {"value":1,"label":"Nunca","label_en":"Never"},
    {"value":2,"label":"1 dia","label_en":"1 day"},
    {"value":3,"label":"2-3 dias","label_en":"2-3 days"},
    {"value":4,"label":"4-5 dias","label_en":"4-5 days"},
    {"value":5,"label":"Quase todo dia","label_en":"Almost every day"}
  ]'::jsonb
where id = 'v2:learn:behavior:a';

update public.psych_item set
  text_en = 'In a typical month, how many books, courses, or papers do you actually finish?',
  options_jsonb = '[
    {"value":1,"label":"Nenhum","label_en":"None"},
    {"value":2,"label":"1","label_en":"1"},
    {"value":3,"label":"2","label_en":"2"},
    {"value":4,"label":"3","label_en":"3"},
    {"value":5,"label":"4 ou mais","label_en":"4 or more"}
  ]'::jsonb
where id = 'v2:learn:behavior:b';

update public.psych_item set
  text_en = 'When you study, you go deep — take notes, question, connect — you don''t just consume passively.',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"Raramente","label_en":"Rarely"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Frequentemente","label_en":"Often"},
    {"value":5,"label":"Quase sempre","label_en":"Almost always"}
  ]'::jsonb
where id = 'v2:learn:quality:a';

update public.psych_item set
  text_en = 'You choose what to study with judgment — challenging your blind spots, not just rehearsing what you already know.',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"Raramente","label_en":"Rarely"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Frequentemente","label_en":"Often"},
    {"value":5,"label":"Quase sempre","label_en":"Almost always"}
  ]'::jsonb
where id = 'v2:learn:quality:b';

update public.psych_item set
  text_en = 'What I learn finds use — I apply it, teach it, or connect it with something I do.',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"Raramente","label_en":"Rarely"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Frequentemente","label_en":"Often"},
    {"value":5,"label":"Quase sempre","label_en":"Almost always"}
  ]'::jsonb
where id = 'v2:learn:result:a';

update public.psych_item set
  text_en = 'I know more about something hard today than I did 6 months ago — something concrete and measurable.',
  options_jsonb = '[
    {"value":1,"label":"Discordo totalmente","label_en":"Strongly disagree"},
    {"value":2,"label":"Discordo","label_en":"Disagree"},
    {"value":3,"label":"Neutro","label_en":"Neutral"},
    {"value":4,"label":"Concordo","label_en":"Agree"},
    {"value":5,"label":"Concordo totalmente","label_en":"Strongly agree"}
  ]'::jsonb
where id = 'v2:learn:result:b';

update public.psych_item set
  text_en = 'How often do you abandon a book or course halfway without finishing?',
  options_jsonb = '[
    {"value":1,"label":"Quase sempre","label_en":"Almost always"},
    {"value":2,"label":"Frequentemente","label_en":"Often"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Raramente","label_en":"Rarely"},
    {"value":5,"label":"Quase nunca","label_en":"Almost never"}
  ]'::jsonb
where id = 'v2:learn:friction:a';

update public.psych_item set
  text_en = 'How often does distraction (social media, TV, doomscroll) eat the time you meant for studying?',
  options_jsonb = '[
    {"value":1,"label":"Quase todo dia","label_en":"Almost every day"},
    {"value":2,"label":"Frequentemente","label_en":"Often"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Raramente","label_en":"Rarely"},
    {"value":5,"label":"Quase nunca","label_en":"Almost never"}
  ]'::jsonb
where id = 'v2:learn:friction:b';

-- ─── CONTEMPLATE ────────────────────────────────────────────────────────────
update public.psych_item set
  text_en = 'In a typical week, on how many days do you take a conscious pause, meditate, or journal for 5+ minutes?',
  options_jsonb = '[
    {"value":1,"label":"Nunca","label_en":"Never"},
    {"value":2,"label":"1 dia","label_en":"1 day"},
    {"value":3,"label":"2-3 dias","label_en":"2-3 days"},
    {"value":4,"label":"4-5 dias","label_en":"4-5 days"},
    {"value":5,"label":"Quase todo dia","label_en":"Almost every day"}
  ]'::jsonb
where id = 'v2:contemplate:behavior:a';

update public.psych_item set
  text_en = 'In a typical week, on how many days do you go without earphones, screens, or podcasts — just with your thoughts — for at least 10 minutes?',
  options_jsonb = '[
    {"value":1,"label":"Nunca","label_en":"Never"},
    {"value":2,"label":"1 dia","label_en":"1 day"},
    {"value":3,"label":"2-3 dias","label_en":"2-3 days"},
    {"value":4,"label":"4-5 dias","label_en":"4-5 days"},
    {"value":5,"label":"Quase todo dia","label_en":"Almost every day"}
  ]'::jsonb
where id = 'v2:contemplate:behavior:b';

update public.psych_item set
  text_en = 'When you meditate or pause, you can sit with what arises — you don''t run or compulsively distract yourself.',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"Raramente","label_en":"Rarely"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Frequentemente","label_en":"Often"},
    {"value":5,"label":"Quase sempre","label_en":"Almost always"}
  ]'::jsonb
where id = 'v2:contemplate:quality:a';

update public.psych_item set
  text_en = 'Your contemplative practice has a depth today it didn''t have 6 months ago.',
  options_jsonb = '[
    {"value":1,"label":"Discordo totalmente","label_en":"Strongly disagree"},
    {"value":2,"label":"Discordo","label_en":"Disagree"},
    {"value":3,"label":"Neutro","label_en":"Neutral"},
    {"value":4,"label":"Concordo","label_en":"Agree"},
    {"value":5,"label":"Concordo totalmente","label_en":"Strongly agree"}
  ]'::jsonb
where id = 'v2:contemplate:quality:b';

update public.psych_item set
  text_en = 'In moments of stress, I can anchor myself — I don''t lose my center easily.',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"Raramente","label_en":"Rarely"},
    {"value":3,"label":"Mais ou menos","label_en":"Somewhat"},
    {"value":4,"label":"Maioria das vezes","label_en":"Most of the time"},
    {"value":5,"label":"Quase sempre","label_en":"Almost always"}
  ]'::jsonb
where id = 'v2:contemplate:result:a';

update public.psych_item set
  text_en = 'I have clarity about what I feel and what matters to me, even when life is moving fast.',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"Raramente","label_en":"Rarely"},
    {"value":3,"label":"Mais ou menos","label_en":"Somewhat"},
    {"value":4,"label":"Maioria das vezes","label_en":"Most of the time"},
    {"value":5,"label":"Quase sempre","label_en":"Almost always"}
  ]'::jsonb
where id = 'v2:contemplate:result:b';

update public.psych_item set
  text_en = 'How often do anxiety or rumination grip you for long stretches without you being able to break out?',
  options_jsonb = '[
    {"value":1,"label":"Quase todo dia","label_en":"Almost every day"},
    {"value":2,"label":"Frequentemente","label_en":"Often"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Raramente","label_en":"Rarely"},
    {"value":5,"label":"Quase nunca","label_en":"Almost never"}
  ]'::jsonb
where id = 'v2:contemplate:friction:a';

update public.psych_item set
  text_en = 'How often do you put off stopping and looking inward because there are "more important things"?',
  options_jsonb = '[
    {"value":1,"label":"Quase sempre","label_en":"Almost always"},
    {"value":2,"label":"Frequentemente","label_en":"Often"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Raramente","label_en":"Rarely"},
    {"value":5,"label":"Quase nunca","label_en":"Almost never"}
  ]'::jsonb
where id = 'v2:contemplate:friction:b';

-- ─── MONEY ──────────────────────────────────────────────────────────────────
update public.psych_item set
  text_en = 'In the last 12 months, in how many months did money left over for saving or investing?',
  options_jsonb = '[
    {"value":1,"label":"Nenhum","label_en":"None"},
    {"value":2,"label":"1-3 meses","label_en":"1-3 months"},
    {"value":3,"label":"4-6 meses","label_en":"4-6 months"},
    {"value":4,"label":"7-9 meses","label_en":"7-9 months"},
    {"value":5,"label":"10+ meses","label_en":"10+ months"}
  ]'::jsonb
where id = 'v2:money:behavior:a';

update public.psych_item set
  text_en = 'In a typical month, how often do you open your financial tracker to look at spending and balances?',
  options_jsonb = '[
    {"value":1,"label":"Nunca","label_en":"Never"},
    {"value":2,"label":"1x","label_en":"Once"},
    {"value":3,"label":"2-3x","label_en":"2-3 times"},
    {"value":4,"label":"4-7x","label_en":"4-7 times"},
    {"value":5,"label":"Mais que isso","label_en":"More than that"}
  ]'::jsonb
where id = 'v2:money:behavior:b';

update public.psych_item set
  text_en = 'You know where each slice of your money goes — nothing "disappears" by month-end.',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"Raramente","label_en":"Rarely"},
    {"value":3,"label":"Mais ou menos","label_en":"Somewhat"},
    {"value":4,"label":"Maioria das vezes","label_en":"Most of the time"},
    {"value":5,"label":"Quase sempre","label_en":"Almost always"}
  ]'::jsonb
where id = 'v2:money:quality:a';

update public.psych_item set
  text_en = 'Your spending decisions are intentional — you compare options, you don''t buy on impulse.',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"Raramente","label_en":"Rarely"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Frequentemente","label_en":"Often"},
    {"value":5,"label":"Quase sempre","label_en":"Almost always"}
  ]'::jsonb
where id = 'v2:money:quality:b';

update public.psych_item set
  text_en = 'Money isn''t a constant source of anxiety — I have a cushion and breathe with ease.',
  options_jsonb = '[
    {"value":1,"label":"Discordo totalmente","label_en":"Strongly disagree"},
    {"value":2,"label":"Discordo","label_en":"Disagree"},
    {"value":3,"label":"Neutro","label_en":"Neutral"},
    {"value":4,"label":"Concordo","label_en":"Agree"},
    {"value":5,"label":"Concordo totalmente","label_en":"Strongly agree"}
  ]'::jsonb
where id = 'v2:money:result:a';

update public.psych_item set
  text_en = 'I have more liquid assets today (reserves, funds, investments) than I did 12 months ago.',
  options_jsonb = '[
    {"value":1,"label":"Discordo totalmente","label_en":"Strongly disagree"},
    {"value":2,"label":"Discordo","label_en":"Disagree"},
    {"value":3,"label":"Neutro","label_en":"Neutral"},
    {"value":4,"label":"Concordo","label_en":"Agree"},
    {"value":5,"label":"Concordo totalmente","label_en":"Strongly agree"}
  ]'::jsonb
where id = 'v2:money:result:b';

update public.psych_item set
  text_en = 'How often does expensive debt (credit card, overdraft) or installments weigh on your mind?',
  options_jsonb = '[
    {"value":1,"label":"Quase todo dia","label_en":"Almost every day"},
    {"value":2,"label":"Frequentemente","label_en":"Often"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Raramente","label_en":"Rarely"},
    {"value":5,"label":"Quase nunca","label_en":"Almost never"}
  ]'::jsonb
where id = 'v2:money:friction:a';

update public.psych_item set
  text_en = 'How often do you put off financial decisions (taxes, opening an investment account, renegotiating debt) out of aversion to the topic?',
  options_jsonb = '[
    {"value":1,"label":"Quase sempre","label_en":"Almost always"},
    {"value":2,"label":"Frequentemente","label_en":"Often"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Raramente","label_en":"Rarely"},
    {"value":5,"label":"Quase nunca","label_en":"Almost never"}
  ]'::jsonb
where id = 'v2:money:friction:b';

-- ─── CAREER ─────────────────────────────────────────────────────────────────
update public.psych_item set
  text_en = 'In a typical week, on how many days do you get 60+ minute blocks of deep work on something that matters for your career?',
  options_jsonb = '[
    {"value":1,"label":"Nenhum","label_en":"None"},
    {"value":2,"label":"1 dia","label_en":"1 day"},
    {"value":3,"label":"2 dias","label_en":"2 days"},
    {"value":4,"label":"3-4 dias","label_en":"3-4 days"},
    {"value":5,"label":"5+ dias","label_en":"5+ days"}
  ]'::jsonb
where id = 'v2:career:behavior:a';

update public.psych_item set
  text_en = 'In a typical week, on how many days do you produce something concrete (delivery, decision, code, pitch) that moves your career forward?',
  options_jsonb = '[
    {"value":1,"label":"Nenhum","label_en":"None"},
    {"value":2,"label":"1 dia","label_en":"1 day"},
    {"value":3,"label":"2 dias","label_en":"2 days"},
    {"value":4,"label":"3-4 dias","label_en":"3-4 days"},
    {"value":5,"label":"5+ dias","label_en":"5+ days"}
  ]'::jsonb
where id = 'v2:career:behavior:b';

update public.psych_item set
  text_en = 'When you work, you''re really engaged — not on autopilot, not just filling the hours.',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"Raramente","label_en":"Rarely"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Frequentemente","label_en":"Often"},
    {"value":5,"label":"Quase sempre","label_en":"Almost always"}
  ]'::jsonb
where id = 'v2:career:quality:a';

update public.psych_item set
  text_en = 'You make hard work decisions with clarity — you don''t avoid, you don''t procrastinate.',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"Raramente","label_en":"Rarely"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Frequentemente","label_en":"Often"},
    {"value":5,"label":"Quase sempre","label_en":"Almost always"}
  ]'::jsonb
where id = 'v2:career:quality:b';

update public.psych_item set
  text_en = 'I have energy left for life outside work — I don''t come home drained.',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"Raramente","label_en":"Rarely"},
    {"value":3,"label":"Mais ou menos","label_en":"Somewhat"},
    {"value":4,"label":"Maioria dos dias","label_en":"Most days"},
    {"value":5,"label":"Quase todo dia","label_en":"Almost every day"}
  ]'::jsonb
where id = 'v2:career:result:a';

update public.psych_item set
  text_en = 'I''m on a trajectory that makes sense — my work is going somewhere, I''m not just spinning in place.',
  options_jsonb = '[
    {"value":1,"label":"Discordo totalmente","label_en":"Strongly disagree"},
    {"value":2,"label":"Discordo","label_en":"Disagree"},
    {"value":3,"label":"Neutro","label_en":"Neutral"},
    {"value":4,"label":"Concordo","label_en":"Agree"},
    {"value":5,"label":"Concordo totalmente","label_en":"Strongly agree"}
  ]'::jsonb
where id = 'v2:career:result:b';

update public.psych_item set
  text_en = 'How often do useless meetings, messages, and interruptions eat the whole day?',
  options_jsonb = '[
    {"value":1,"label":"Quase todo dia","label_en":"Almost every day"},
    {"value":2,"label":"Frequentemente","label_en":"Often"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Raramente","label_en":"Rarely"},
    {"value":5,"label":"Quase nunca","label_en":"Almost never"}
  ]'::jsonb
where id = 'v2:career:friction:a';

update public.psych_item set
  text_en = 'How often do you put off a needed confrontation (with boss, client, peer) because it''s uncomfortable?',
  options_jsonb = '[
    {"value":1,"label":"Quase sempre","label_en":"Almost always"},
    {"value":2,"label":"Frequentemente","label_en":"Often"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Raramente","label_en":"Rarely"},
    {"value":5,"label":"Quase nunca","label_en":"Almost never"}
  ]'::jsonb
where id = 'v2:career:friction:b';

-- ─── CIRCLE ─────────────────────────────────────────────────────────────────
update public.psych_item set
  text_en = 'In a typical week, how many meaningful conversations (not just logistics) do you have with family or friends?',
  options_jsonb = '[
    {"value":1,"label":"Nenhuma","label_en":"None"},
    {"value":2,"label":"1 vez","label_en":"Once"},
    {"value":3,"label":"2-3 vezes","label_en":"2-3 times"},
    {"value":4,"label":"4-5 vezes","label_en":"4-5 times"},
    {"value":5,"label":"Praticamente todo dia","label_en":"Practically every day"}
  ]'::jsonb
where id = 'v2:circle:behavior:a';

update public.psych_item set
  text_en = 'In a typical month, how often do you take initiative to schedule or reach out to someone you care about (without waiting for an invitation)?',
  options_jsonb = '[
    {"value":1,"label":"Nenhuma","label_en":"None"},
    {"value":2,"label":"1-2 vezes","label_en":"1-2 times"},
    {"value":3,"label":"3-4 vezes","label_en":"3-4 times"},
    {"value":4,"label":"5-7 vezes","label_en":"5-7 times"},
    {"value":5,"label":"Mais que isso","label_en":"More than that"}
  ]'::jsonb
where id = 'v2:circle:behavior:b';

update public.psych_item set
  text_en = 'You listen to the people close to you with real presence — no phone, no rehearsing answers, no distraction.',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"Raramente","label_en":"Rarely"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Frequentemente","label_en":"Often"},
    {"value":5,"label":"Quase sempre","label_en":"Almost always"}
  ]'::jsonb
where id = 'v2:circle:quality:a';

update public.psych_item set
  text_en = 'You share what you''re actually going through with at least one person in your circle — you don''t keep filtering.',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"Raramente","label_en":"Rarely"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Frequentemente","label_en":"Often"},
    {"value":5,"label":"Quase sempre","label_en":"Almost always"}
  ]'::jsonb
where id = 'v2:circle:quality:b';

update public.psych_item set
  text_en = 'I feel genuinely close to the people who matter to me — someone truly knows me.',
  options_jsonb = '[
    {"value":1,"label":"Discordo totalmente","label_en":"Strongly disagree"},
    {"value":2,"label":"Discordo","label_en":"Disagree"},
    {"value":3,"label":"Mais ou menos","label_en":"Somewhat"},
    {"value":4,"label":"Concordo","label_en":"Agree"},
    {"value":5,"label":"Concordo totalmente","label_en":"Strongly agree"}
  ]'::jsonb
where id = 'v2:circle:result:a';

update public.psych_item set
  text_en = 'I have people who would call if I disappeared, and people I''d call if they did — it''s not an abstract social.',
  options_jsonb = '[
    {"value":1,"label":"Discordo totalmente","label_en":"Strongly disagree"},
    {"value":2,"label":"Discordo","label_en":"Disagree"},
    {"value":3,"label":"Neutro","label_en":"Neutral"},
    {"value":4,"label":"Concordo","label_en":"Agree"},
    {"value":5,"label":"Concordo totalmente","label_en":"Strongly agree"}
  ]'::jsonb
where id = 'v2:circle:result:b';

update public.psych_item set
  text_en = 'How often do you feel alone even when surrounded by people?',
  options_jsonb = '[
    {"value":1,"label":"Quase todo dia","label_en":"Almost every day"},
    {"value":2,"label":"Frequentemente","label_en":"Often"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Raramente","label_en":"Rarely"},
    {"value":5,"label":"Quase nunca","label_en":"Almost never"}
  ]'::jsonb
where id = 'v2:circle:friction:a';

update public.psych_item set
  text_en = 'How often does an unresolved conflict with someone you care about cost you mental energy?',
  options_jsonb = '[
    {"value":1,"label":"Quase todo dia","label_en":"Almost every day"},
    {"value":2,"label":"Frequentemente","label_en":"Often"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Raramente","label_en":"Rarely"},
    {"value":5,"label":"Quase nunca","label_en":"Almost never"}
  ]'::jsonb
where id = 'v2:circle:friction:b';

-- ─── ROMANCE ────────────────────────────────────────────────────────────────
update public.psych_item set
  text_en = 'In a typical month, how often do you have real moments of romantic connection (partnership, dates, intimacy, presence)?',
  options_jsonb = '[
    {"value":1,"label":"Nenhuma vez","label_en":"None"},
    {"value":2,"label":"1 vez","label_en":"Once"},
    {"value":3,"label":"2-3 vezes","label_en":"2-3 times"},
    {"value":4,"label":"4-7 vezes","label_en":"4-7 times"},
    {"value":5,"label":"Mais que isso","label_en":"More than that"}
  ]'::jsonb
where id = 'v2:romance:behavior:a';

update public.psych_item set
  text_en = 'In a typical month, how often do you take initiative to cultivate the romantic side (with a partner, or to meet someone new)?',
  options_jsonb = '[
    {"value":1,"label":"Nenhuma","label_en":"None"},
    {"value":2,"label":"1 vez","label_en":"Once"},
    {"value":3,"label":"2-3 vezes","label_en":"2-3 times"},
    {"value":4,"label":"4-7 vezes","label_en":"4-7 times"},
    {"value":5,"label":"Mais que isso","label_en":"More than that"}
  ]'::jsonb
where id = 'v2:romance:behavior:b';

update public.psych_item set
  text_en = 'When you''re with your partner or on a date, you''re present — no phone, no mental checklist.',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"Raramente","label_en":"Rarely"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Frequentemente","label_en":"Often"},
    {"value":5,"label":"Quase sempre","label_en":"Almost always"}
  ]'::jsonb
where id = 'v2:romance:quality:a';

update public.psych_item set
  text_en = 'You express what you feel and want in the romance — you don''t wait for the other person to guess.',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"Raramente","label_en":"Rarely"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Frequentemente","label_en":"Often"},
    {"value":5,"label":"Quase sempre","label_en":"Almost always"}
  ]'::jsonb
where id = 'v2:romance:quality:b';

update public.psych_item set
  text_en = 'My romantic life is in a good place — I feel satisfied with how it is today.',
  options_jsonb = '[
    {"value":1,"label":"Discordo totalmente","label_en":"Strongly disagree"},
    {"value":2,"label":"Discordo","label_en":"Disagree"},
    {"value":3,"label":"Neutro","label_en":"Neutral"},
    {"value":4,"label":"Concordo","label_en":"Agree"},
    {"value":5,"label":"Concordo totalmente","label_en":"Strongly agree"}
  ]'::jsonb
where id = 'v2:romance:result:a';

update public.psych_item set
  text_en = 'I feel affection, desire, and safety — not just logistics or memory of what once was.',
  options_jsonb = '[
    {"value":1,"label":"Discordo totalmente","label_en":"Strongly disagree"},
    {"value":2,"label":"Discordo","label_en":"Disagree"},
    {"value":3,"label":"Neutro","label_en":"Neutral"},
    {"value":4,"label":"Concordo","label_en":"Agree"},
    {"value":5,"label":"Concordo totalmente","label_en":"Strongly agree"}
  ]'::jsonb
where id = 'v2:romance:result:b';

update public.psych_item set
  text_en = 'How often does unresolved romantic conflict occupy you for days?',
  options_jsonb = '[
    {"value":1,"label":"Quase todo dia","label_en":"Almost every day"},
    {"value":2,"label":"Frequentemente","label_en":"Often"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Raramente","label_en":"Rarely"},
    {"value":5,"label":"Quase nunca","label_en":"Almost never"}
  ]'::jsonb
where id = 'v2:romance:friction:a';

update public.psych_item set
  text_en = 'How often do you silence yourself to avoid a fight or to please?',
  options_jsonb = '[
    {"value":1,"label":"Quase sempre","label_en":"Almost always"},
    {"value":2,"label":"Frequentemente","label_en":"Often"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Raramente","label_en":"Rarely"},
    {"value":5,"label":"Quase nunca","label_en":"Almost never"}
  ]'::jsonb
where id = 'v2:romance:friction:b';

-- ─── PLAY ───────────────────────────────────────────────────────────────────
update public.psych_item set
  text_en = 'In a typical week, how often do you have moments just to enjoy a hobby/game/creative thing, with no goal, producing nothing?',
  options_jsonb = '[
    {"value":1,"label":"Nenhuma","label_en":"None"},
    {"value":2,"label":"1 vez","label_en":"Once"},
    {"value":3,"label":"2-3 vezes","label_en":"2-3 times"},
    {"value":4,"label":"4-5 vezes","label_en":"4-5 times"},
    {"value":5,"label":"Quase todo dia","label_en":"Almost every day"}
  ]'::jsonb
where id = 'v2:play:behavior:a';

update public.psych_item set
  text_en = 'In a typical month, how often do you try a new activity (without performing, just to play)?',
  options_jsonb = '[
    {"value":1,"label":"Nenhuma","label_en":"None"},
    {"value":2,"label":"1 vez","label_en":"Once"},
    {"value":3,"label":"2 vezes","label_en":"2 times"},
    {"value":4,"label":"3-4 vezes","label_en":"3-4 times"},
    {"value":5,"label":"Mais que isso","label_en":"More than that"}
  ]'::jsonb
where id = 'v2:play:behavior:b';

update public.psych_item set
  text_en = 'When you play or game, you''re really present — no checking social media, no working in the background.',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"Raramente","label_en":"Rarely"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Frequentemente","label_en":"Often"},
    {"value":5,"label":"Quase sempre","label_en":"Almost always"}
  ]'::jsonb
where id = 'v2:play:quality:a';

update public.psych_item set
  text_en = 'You let yourself be bad at something just for the fun of trying — it doesn''t need to be productive.',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"Raramente","label_en":"Rarely"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Frequentemente","label_en":"Often"},
    {"value":5,"label":"Quase sempre","label_en":"Almost always"}
  ]'::jsonb
where id = 'v2:play:quality:b';

update public.psych_item set
  text_en = 'Enjoying a hobby or playing really recharges me — I finish lighter, not more tired.',
  options_jsonb = '[
    {"value":1,"label":"Discordo totalmente","label_en":"Strongly disagree"},
    {"value":2,"label":"Discordo","label_en":"Disagree"},
    {"value":3,"label":"Neutro","label_en":"Neutral"},
    {"value":4,"label":"Concordo","label_en":"Agree"},
    {"value":5,"label":"Concordo totalmente","label_en":"Strongly agree"}
  ]'::jsonb
where id = 'v2:play:result:a';

update public.psych_item set
  text_en = 'I have a routine where joy, lightness, and curiosity show up regularly.',
  options_jsonb = '[
    {"value":1,"label":"Discordo totalmente","label_en":"Strongly disagree"},
    {"value":2,"label":"Discordo","label_en":"Disagree"},
    {"value":3,"label":"Neutro","label_en":"Neutral"},
    {"value":4,"label":"Concordo","label_en":"Agree"},
    {"value":5,"label":"Concordo totalmente","label_en":"Strongly agree"}
  ]'::jsonb
where id = 'v2:play:result:b';

update public.psych_item set
  text_en = 'How often do you feel guilty for resting/playing when "there''s stuff to do"?',
  options_jsonb = '[
    {"value":1,"label":"Quase sempre","label_en":"Almost always"},
    {"value":2,"label":"Frequentemente","label_en":"Often"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Raramente","label_en":"Rarely"},
    {"value":5,"label":"Quase nunca","label_en":"Almost never"}
  ]'::jsonb
where id = 'v2:play:friction:a';

update public.psych_item set
  text_en = 'How often has your leisure turned into passive consumption (scrolling feeds, series) that no longer recharges you?',
  options_jsonb = '[
    {"value":1,"label":"Quase todo dia","label_en":"Almost every day"},
    {"value":2,"label":"Frequentemente","label_en":"Often"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Raramente","label_en":"Rarely"},
    {"value":5,"label":"Quase nunca","label_en":"Almost never"}
  ]'::jsonb
where id = 'v2:play:friction:b';

-- ─── BUILD ──────────────────────────────────────────────────────────────────
update public.psych_item set
  text_en = 'In a typical week, on how many days do you dedicate 30+ minutes to a personal project (creative, technical, manual)?',
  options_jsonb = '[
    {"value":1,"label":"Nenhum","label_en":"None"},
    {"value":2,"label":"1 dia","label_en":"1 day"},
    {"value":3,"label":"2 dias","label_en":"2 days"},
    {"value":4,"label":"3-4 dias","label_en":"3-4 days"},
    {"value":5,"label":"5+ dias","label_en":"5+ days"}
  ]'::jsonb
where id = 'v2:build:behavior:a';

update public.psych_item set
  text_en = 'In a typical month, how often do you publish/share something you made (post, repo, product, piece)?',
  options_jsonb = '[
    {"value":1,"label":"Nenhuma","label_en":"None"},
    {"value":2,"label":"1 vez","label_en":"Once"},
    {"value":3,"label":"2 vezes","label_en":"2 times"},
    {"value":4,"label":"3-4 vezes","label_en":"3-4 times"},
    {"value":5,"label":"5+ vezes","label_en":"5+ times"}
  ]'::jsonb
where id = 'v2:build:behavior:b';

update public.psych_item set
  text_en = 'When you work on a project, you go deep — flow, focus, no checking feeds every 5 minutes.',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"Raramente","label_en":"Rarely"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Frequentemente","label_en":"Often"},
    {"value":5,"label":"Quase sempre","label_en":"Almost always"}
  ]'::jsonb
where id = 'v2:build:quality:a';

update public.psych_item set
  text_en = 'You iterate and improve what you make — you listen to feedback instead of just defending what you already did.',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"Raramente","label_en":"Rarely"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Frequentemente","label_en":"Often"},
    {"value":5,"label":"Quase sempre","label_en":"Almost always"}
  ]'::jsonb
where id = 'v2:build:quality:b';

update public.psych_item set
  text_en = 'I finish and share things I start — I don''t just accumulate abandoned projects.',
  options_jsonb = '[
    {"value":1,"label":"Quase nunca","label_en":"Almost never"},
    {"value":2,"label":"Raramente","label_en":"Rarely"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Frequentemente","label_en":"Often"},
    {"value":5,"label":"Quase sempre","label_en":"Almost always"}
  ]'::jsonb
where id = 'v2:build:result:a';

update public.psych_item set
  text_en = 'I have concrete things that exist because of me — I''ll be able to show them 5 years from now.',
  options_jsonb = '[
    {"value":1,"label":"Discordo totalmente","label_en":"Strongly disagree"},
    {"value":2,"label":"Discordo","label_en":"Disagree"},
    {"value":3,"label":"Neutro","label_en":"Neutral"},
    {"value":4,"label":"Concordo","label_en":"Agree"},
    {"value":5,"label":"Concordo totalmente","label_en":"Strongly agree"}
  ]'::jsonb
where id = 'v2:build:result:b';

update public.psych_item set
  text_en = 'How often do you abandon a project before the end out of perfectionism or fear of showing it?',
  options_jsonb = '[
    {"value":1,"label":"Quase sempre","label_en":"Almost always"},
    {"value":2,"label":"Frequentemente","label_en":"Often"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Raramente","label_en":"Rarely"},
    {"value":5,"label":"Quase nunca","label_en":"Almost never"}
  ]'::jsonb
where id = 'v2:build:friction:a';

update public.psych_item set
  text_en = 'How often do distraction, indecision, or jumping to the next idea pull you off what you were working on?',
  options_jsonb = '[
    {"value":1,"label":"Quase todo dia","label_en":"Almost every day"},
    {"value":2,"label":"Frequentemente","label_en":"Often"},
    {"value":3,"label":"Às vezes","label_en":"Sometimes"},
    {"value":4,"label":"Raramente","label_en":"Rarely"},
    {"value":5,"label":"Quase nunca","label_en":"Almost never"}
  ]'::jsonb
where id = 'v2:build:friction:b';

-- ─── Sanity check ───────────────────────────────────────────────────────────
-- Verify every avaliacao_v2 item now has text_en. Raises if any row is still
-- NULL after the updates above.
do $$
declare
  missing_count int;
begin
  select count(*) into missing_count
  from public.psych_item
  where instrument_id = 'avaliacao_v2' and text_en is null;
  if missing_count > 0 then
    raise exception 'avaliacao_v2 still has % items without text_en', missing_count;
  end if;
end $$;

commit;
