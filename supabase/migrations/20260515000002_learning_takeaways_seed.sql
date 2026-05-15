-- ============================================================================
-- Seed: 3 takeaways per glossary material (PT + EN).
-- One UPDATE per row, keyed by slug.
-- ============================================================================

begin;

-- ─── 1. SLEEP ─────────────────────────────────────────────────────────────
update public.learning_material set
  takeaways_pt = array[
    'Sono não é tempo perdido — é onde memória, hormônio e cérebro se reorganizam.',
    'Os três pilares são quantidade (7–9h), regularidade e qualidade. Faltar em um quebra os outros.',
    'Se o sono cai, quase todo o resto do app vai cair junto em poucas semanas.'
  ],
  takeaways_en = array[
    $$Sleep isn't lost time — it's where memory, hormones, and the brain reorganize.$$,
    'Three pillars: quantity (7–9h), regularity, quality. Missing one breaks the others.',
    'When sleep drops, almost every other sub drops with it within a few weeks.'
  ]
where slug = 'glossary-sleep';

-- ─── 2. NUTRITION ─────────────────────────────────────────────────────────
update public.learning_material set
  takeaways_pt = array[
    'Comida = combustível + sinal. O que você come fala com o corpo o dia inteiro.',
    'Energia constante vem de proteína + fibra + gordura boa, não de contar caloria.',
    'Hidratação afeta foco antes de afetar sede. Quando dá sede, já tá atrasado.'
  ],
  takeaways_en = array[
    $$Food = fuel + signal. What you eat is what you're telling your body all day.$$,
    $$Steady energy comes from protein + fiber + good fat — not from counting calories.$$,
    $$Hydration hits focus before it hits thirst. By the time you're thirsty, you're late.$$
  ]
where slug = 'glossary-nutrition';

-- ─── 3. STRENGTH ──────────────────────────────────────────────────────────
update public.learning_material set
  takeaways_pt = array[
    'Força não é estética — é a estrutura que te mantém autônomo aos 60.',
    'Cardio prediz mortalidade melhor que quase qualquer outro indicador isolado.',
    'Treinar tem retorno desproporcional: toca sono, humor, postura, foco.'
  ],
  takeaways_en = array[
    $$Strength isn't aesthetics — it's the scaffolding that keeps you autonomous at 60.$$,
    'Cardio predicts mortality better than almost any single indicator.',
    'Training compounds across pillars — sleep, mood, posture, focus.'
  ]
where slug = 'glossary-strength';

-- ─── 4. DEXTERITY ─────────────────────────────────────────────────────────
update public.learning_material set
  takeaways_pt = array[
    'Mobilidade é o oposto silencioso da força — e quase toda lesão adulta começa aí.',
    '10 min por dia rendem mais que 1h por mês. Frequência ganha de volume.',
    'Quadril, ombro e tornozelo travados são culpados invisíveis. Trabalhe os três.'
  ],
  takeaways_en = array[
    'Mobility is the silent opposite of strength — and almost every adult injury starts here.',
    '10 min daily beats 1h per month. Frequency beats volume.',
    'Locked hips, shoulders, and ankles are invisible culprits. Work all three.'
  ]
where slug = 'glossary-dexterity';

-- ─── 5. LEARN ─────────────────────────────────────────────────────────────
update public.learning_material set
  takeaways_pt = array[
    'Aprender adulto não é prova — é não congelar. Continuar capaz de mudar de ideia.',
    'Conta leitura ativa, curso, projeto, conversa profunda. Scroll passivo não conta.',
    'Sem prática ativa, a plasticidade cai. O envelhecimento intelectual é o pior.'
  ],
  takeaways_en = array[
    $$Adult learning isn't testing — it's not freezing. Staying able to change your mind.$$,
    $$Active reading, courses, projects, deep conversation count. Passive scrolling doesn't.$$,
    'Without active practice, plasticity drops. Intellectual aging is the worst kind.'
  ]
where slug = 'glossary-learn';

-- ─── 6. CONTEMPLATE ───────────────────────────────────────────────────────
update public.learning_material set
  takeaways_pt = array[
    'Aprender enche a mente; contemplar arruma. Sem o segundo, o primeiro vira ansiedade.',
    'Práticas contemplativas reduzem reatividade emocional e melhoram decisão sob pressão.',
    'Esse sub não premia esforço bruto — premia regularidade. Pequeno e constante.'
  ],
  takeaways_en = array[
    'Learning fills the mind; contemplating sorts it. Without the second, the first becomes anxiety.',
    'Contemplative practice reduces emotional reactivity and improves decision-making under pressure.',
    $$This sub doesn't reward brute effort — it rewards regularity. Small and constant.$$
  ]
where slug = 'glossary-contemplate';

-- ─── 7. MONEY ─────────────────────────────────────────────────────────────
update public.learning_material set
  takeaways_pt = array[
    'Clareza vem antes de quantidade. A maior dor financeira adulta é não saber onde você está.',
    'Dinheiro mal resolvido sangra atenção em silêncio, mesmo quando você não está pensando nele.',
    '20 min por semana de atenção bem dirigida muda mais que 2h trimestrais de pânico.'
  ],
  takeaways_en = array[
    'Clarity before quantity. The biggest adult money pain is not knowing where you stand.',
    $$Unresolved money bleeds attention silently, even when you're not consciously thinking about it.$$,
    '20 min/week of focused attention changes more than 2h/quarter of panic.'
  ]
where slug = 'glossary-money';

-- ─── 8. CAREER ────────────────────────────────────────────────────────────
update public.learning_material set
  takeaways_pt = array[
    'Cargo é snapshot. Carreira é vetor — pra onde você está se tornando profissionalmente.',
    'Hora apagando incêndio não conta. Deep work, construção e conversa real contam.',
    '10 anos no vetor certo = capacidade rara. No errado = bom no que não queria ser.'
  ],
  takeaways_en = array[
    $$Title is a snapshot. Career is a vector — who you're becoming professionally.$$,
    $$Firefighting hours don't count. Deep work, building, and real conversation count.$$,
    $$10 years on the right vector = rare capability. On the wrong one = good at what you didn't want.$$
  ]
where slug = 'glossary-career';

-- ─── 9. CIRCLE ────────────────────────────────────────────────────────────
update public.learning_material set
  takeaways_pt = array[
    'Vínculos próximos são a infraestrutura silenciosa de quase tudo dar certo.',
    'Solidão crônica tem efeito de saúde comparável a fumar 15 cigarros por dia.',
    'Amizade não cobra. Você que tem que ir — capital social negligenciado some rápido.'
  ],
  takeaways_en = array[
    'Close bonds are the silent infrastructure under almost everything that works.',
    'Chronic loneliness has a health effect comparable to smoking 15 cigarettes a day.',
    $$Friendship doesn't bill you. You have to show up — neglected social capital fades fast.$$
  ]
where slug = 'glossary-circle';

-- ─── 10. ROMANCE ──────────────────────────────────────────────────────────
update public.learning_material set
  takeaways_pt = array[
    'Romance estável é atenção sustentada, não paixão. Dois adultos olhando de verdade.',
    'Casais bem-sucedidos não brigam menos — eles se reconectam mais. A razão 5:1 importa.',
    'Esse sub é sensível a regularidade: semanal funciona, mensal já não.'
  ],
  takeaways_en = array[
    $$Stable romance is sustained attention, not passion. Two adults really looking at each other.$$,
    $$Successful couples don't fight less — they reconnect more. The 5:1 ratio matters.$$,
    $$This sub is sensitive to regularity: weekly works, monthly doesn't.$$
  ]
where slug = 'glossary-romance';

-- ─── 11. PLAY ─────────────────────────────────────────────────────────────
update public.learning_material set
  takeaways_pt = array[
    'Lazer é o que você faz porque sim — sem virar side hustle, sem virar métrica.',
    'Cérebro produtivo vicia em propósito. Lazer puro é o antídoto, não decoração.',
    'Adultos com hobby ativo têm menos burnout — só quando o hobby não vira segunda jornada.'
  ],
  takeaways_en = array[
    'Play is what you do for no reason — not side hustle, not metric.',
    'The productive brain gets addicted to purpose. Pure play is the antidote, not decoration.',
    $$Adults with active hobbies burn out less — only when the hobby doesn't become a second job.$$
  ]
where slug = 'glossary-play';

-- ─── 12. BUILD ────────────────────────────────────────────────────────────
update public.learning_material set
  takeaways_pt = array[
    'Vida adulta sem construção vira manutenção. Tudo ótimo, e tudo zero.',
    'Construir = produzir algo que não existiria sem você. Não importa se rende.',
    'Esse sub exige tempo concentrado — 4–5 estrelas, não 15 min entre reuniões.'
  ],
  takeaways_en = array[
    'Adult life without building becomes maintenance. All great, all zero.',
    $$Building = making something that wouldn't exist without you. Doesn't matter if it pays.$$,
    'This sub needs concentrated time — 4–5 stars, not 15 min between meetings.'
  ]
where slug = 'glossary-build';

commit;
