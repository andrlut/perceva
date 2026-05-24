-- ============================================================================
-- Learning: Strength rewrite — gold standard for the new editorial direction.
--
-- User feedback after reading the v3 version (PR #166):
--   - Content is hard to read, too card-heavy ("muitos cards", "limbo entre
--     livro e infográfico")
--   - PT feels translated from EN (anglicisms slip through)
--   - Vocabulary too academic ("preditor", "quartil", "cardiorespiratory")
--   - Too many sub-topics (7), each one shallow
--   - "Claim/Evidência/Contestado" labels read as academic outline
--
-- This rewrite, agreed with the user as the new template:
--   - 3 main ideas, not 7. Each gets unhurried space.
--   - Prose-led. Only 2 visual cards in the body (list-icon recipe + source).
--     Stat and quote integrated as inline prose / blockquote.
--   - Native PT writing — no anglicisms, conversational "você", short
--     sentences (avg ~16 words), filler words cut.
--   - Jargon defined on first mention. No name-dropping.
--   - Concrete examples replace abstract noun lists.
--   - Native EN written separately, not translated from PT.
--
-- Revision trigger auto-snapshots the prior body to learning_material_revision.
-- ============================================================================

begin;

set local app.edited_by = 'maintainer';
set local app.edit_summary = 'Strength v4: prose-led rewrite, 3 main ideas, native PT/EN, vocab simplified';

update public.learning_material set
  reading_minutes = 7,
  body_pt = $body$Há um tipo específico de declínio que só vira óbvio quando já é tarde. Você fica um pouco menos forte a cada ano, mas não nota — porque cada ano não muda quase nada. Aos 35 você ainda sobe escada sem pensar. Aos 50, começa a pensar. Aos 65, evita.

Esse é o problema da força e do preparo cardiovascular: o custo de não treinar agora não aparece em 3 meses nem em 3 anos. Aparece em 30. E quando aparece, reverter custa muito mais caro do que ter mantido.

Pra você entender a magnitude: adultos com baixo preparo cardiovascular têm **5 vezes** mais risco de morrer por qualquer causa, comparado com quem está em ótima forma. Efeito maior que fumar, ter diabetes ou ter pressão alta. Estudo de 122 mil pessoas, publicado no *JAMA* em 2018.

## 1. O sinal silencioso que prediz quanto você vai viver

Tem um estudo de 17 países, com 139 mil adultos, que mediu uma coisa simples: a força do aperto de mão. Acompanhou todo mundo por anos. O resultado: cada 5 quilos de força perdida no aperto aumenta o risco de morte em 16%. Sinal mais forte do que pressão arterial sistólica (Leong et al., *Lancet*, 2015).

Por que o aperto de mão? Porque ele revela o corpo todo. Quem tem aperto fraco geralmente tem músculo fraco em geral, e isso indica que outras coisas — função imune, equilíbrio, capacidade de recuperar de doença — estão indo no mesmo caminho. Aperto é o termômetro mais barato e direto que existe.

Você consegue testar em casa, sem aparelho: carregue duas sacolas de 5 quilos de mercado por 2 minutos. Se não conseguir, é hora de começar.

E não é só sobre não morrer cedo. É sobre o que acontece com sua massa muscular ao longo do tempo. A partir dos 30, quem não treina perde entre 3% e 8% de músculo por década. Aos 60, a perda acelera. Aos 70 sem nunca ter treinado, sobra pouco.

A boa notícia: treinar reverte a curva — em qualquer idade. A má notícia: começar agora custa menos esforço do que começar daqui a 20 anos.

## 2. Zone 2 é a parte que ninguém entende direito

Se você já ouviu falar de Zone 2 e ficou sem saber se é coisa séria ou marketing de Peter Attia, vai com calma. Vale entender.

Quando você se exercita, seu corpo usa dois combustíveis principais: gordura e açúcar. Em ritmo leve, prefere gordura. Quando você acelera, troca pra açúcar — e o subproduto disso é o lactato, uma substância que o corpo precisa limpar. Zone 2 é a faixa de intensidade em que o corpo ainda queima principalmente gordura, sem produzir mais lactato do que consegue limpar. Tecnicamente, lactato sanguíneo abaixo de 2 mmol/L.

Mas o que isso te dá? **Densidade mitocondrial**. Mitocôndrias são as estruturas dentro das células que produzem energia. Quanto mais e melhores mitocôndrias você tem, melhor seu corpo funciona em quase tudo — recuperação após esforço, queima de gordura, controle de inflamação. E aqui está o ponto: **Zone 2 é o único estímulo que constrói isso**. HIIT (treino intervalado de alta intensidade) não substitui. HIIT treina outras coisas — potência, tolerância a esforço alto — mas a fundação aeróbica vem do Zone 2.

Como saber se você está em Zone 2? Sem aparelho, existe o teste da conversa. Você ainda consegue formar frases inteiras, mas preferiria não estar conversando. Se só consegue monossílabos, já passou. Se conversa fluido, ainda não chegou. Em batimentos: cerca de 60-70% da sua frequência cardíaca máxima. Uma estimativa popular: 180 menos sua idade.

Quanto fazer? Três horas por semana é o piso que a literatura converge. Pode ser caminhada rápida, pedalada leve, natação confortável. Não precisa de academia. Não precisa nem de roupa esportiva. Precisa ser regular.

Peter Attia resume isso em *Outlive* (2023):

> Se eu pudesse prescrever um único medicamento pra saúde e longevidade, seria exercício — e dentro disso, o tipo mais importante seria a eficiência aeróbica, o que chamamos de Zone 2.

## 3. A receita mínima que cobre tudo

A Organização Mundial da Saúde publicou em 2020 o piso que adultos precisam manter. Não é o ideal — é o mínimo abaixo do qual você está perdendo. Mais é melhor, com teto bem distante.

:::list-icon
barbell | **Força 2-3 vezes por semana**, treino próximo da falha. Cerca de 10 séries por grupo muscular na semana.
walk | **150 a 300 minutos por semana** de aeróbico moderado (Zone 2).
heart | **75 a 150 minutos por semana** de aeróbico vigoroso, se você consegue, além do Zone 2.
body | **10 minutos por dia** de mobilidade. Rende mais que 1 hora por mês.
:::

Alguns mitos que estão no caminho:

Treino de força não deixa mulher musculosa — hormônios femininos colocam um teto natural. O que se ganha é definição e força, não volume excessivo.

Cardio não mata os ganhos de hipertrofia, exceto pra quem corre 5 ou mais vezes por semana em distâncias longas. Duas ou três sessões de Zone 2 não interferem em quase nada.

Dez mil passos por dia? Marketing de pedômetro japonês dos anos 60. Dados recentes mostram que o benefício de mortalidade estabiliza entre 6 e 8 mil passos pra quem tem 60+ anos, e entre 8 e 10 mil pra mais novos. Nada de mágico em 10k.

E dor muscular depois do treino não é sinal de que o treino foi bom. É sinal de que você fez algo novo ou eccêntrico (descer escada, frear corrida). Quem treina em progressão muitas vezes não fica dolorido.

---

A curva de declínio do preparo cardiovascular é rasa agora — você perde de 3% a 6% por década até os 70. Depois disso, despenca: 20% ou mais por década. O que você constrói nessa década, dos 20 aos 40, é o que segura a curva quando o tempo cobra. Treinar agora é o seguro mais barato que existe pra autonomia nos seus 60 e 70.

:::source[Mandsager et al., 2018 · *JAMA Network Open* · n=122.007](https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2707428)$body$,

  body_en = $body$There's a kind of decline that only becomes obvious once it's too late. You lose a little strength each year, but you don't notice — because each year barely changes anything. At 35 you still climb stairs without thinking. At 50, you start thinking. At 65, you avoid them.

That's the catch with strength and cardiovascular fitness: the cost of not training now doesn't show up in 3 months or 3 years. It shows up in 30. And once it shows up, reversing costs much more than maintaining would have.

To grasp the magnitude: adults with low cardiovascular fitness have **5× higher** all-cause mortality risk compared to people in elite shape. A larger effect than smoking, having diabetes, or having high blood pressure. Study of 122,000 people, published in *JAMA*, 2018.

## 1. The silent signal that predicts how long you'll live

There's a 17-country study, with 139,000 adults, that measured something simple: hand grip strength. They followed everyone for years. The result: every 5 kg drop in grip strength raises mortality risk by 16%. A stronger signal than systolic blood pressure (Leong et al., *Lancet*, 2015).

Why a handshake? Because it reveals the whole body. People with weak grip usually have weak muscle overall, and that points at other things — immune function, balance, ability to recover from illness — going the same way. Grip is the cheapest, most direct thermometer there is.

You can test yourself at home, no equipment: carry two 5 kg grocery bags for 2 minutes. If you can't, it's time to start.

And it's not just about not dying early. It's about what happens to your muscle mass over time. Past age 30, untrained people lose 3% to 8% of muscle per decade. After 60, the loss accelerates. By 70 with no training history, there's little left.

The good news: training reverses the curve — at any age. The bad news: starting now costs less effort than starting 20 years from now.

## 2. Zone 2 is the part nobody understands properly

If you've heard about Zone 2 and weren't sure if it's serious or Peter Attia marketing, stay with me. It's worth understanding.

When you exercise, your body uses two main fuels: fat and sugar. At light pace, it prefers fat. When you push harder, it shifts to sugar — and the byproduct is lactate, a substance your body has to clear. Zone 2 is the intensity range where your body still burns mostly fat, without producing more lactate than it can clear. Technically: blood lactate below 2 mmol/L.

But what does that give you? **Mitochondrial density**. Mitochondria are the structures inside your cells that produce energy. The more and better mitochondria you have, the better your body works at almost everything — recovery, fat-burning, inflammation control. And here's the key: **Zone 2 is the only stimulus that builds this**. HIIT (high-intensity interval training) doesn't replace it. HIIT trains other things — power, lactate tolerance — but the aerobic foundation comes from Zone 2.

How do you know if you're in Zone 2? Without a meter, there's the talk test. You can still form full sentences, but you'd rather not be talking. If you can only get monosyllables out, you've passed it. If you're chatting comfortably, you haven't reached it. In heart rate: about 60-70% of your max. A popular rule of thumb: 180 minus your age.

How much? Three hours a week is the floor literature converges on. It can be brisk walking, easy cycling, comfortable swimming. No gym required. No athletic gear required. It just needs to be regular.

Peter Attia puts it this way in *Outlive* (2023):

> If I could only prescribe one drug for health and longevity, it would be exercise — and within that, the single most important type would be aerobic efficiency, what we call Zone 2.

## 3. The minimum recipe that covers everything

The World Health Organization published the floor adults need to hold in 2020. Not the ideal — the minimum below which you're losing ground. More is better, with the ceiling far away.

:::list-icon
barbell | **Strength training 2-3× per week**, close to failure. About 10 sets per muscle group per week.
walk | **150-300 minutes per week** of moderate aerobic (Zone 2).
heart | **75-150 minutes per week** of vigorous aerobic on top of that, if you can.
body | **10 minutes per day** of mobility. Beats 1 hour per month.
:::

Some myths worth dropping while you think about this:

Strength training doesn't make women bulky — female hormones cap that naturally. What you gain is definition and strength, not excessive volume.

Cardio doesn't kill hypertrophy, except for people running 5+ long sessions per week. Two or three Zone 2 sessions don't interfere with anything.

10,000 steps per day? Marketing from a 1960s Japanese pedometer. Recent data shows mortality benefit plateaus between 6,000 and 8,000 steps for adults 60+, and between 8,000 and 10,000 for younger people. Nothing magical about 10k.

And muscle soreness after training isn't a sign the workout was good. It's a sign you did something new or eccentric (walking downstairs, sudden braking). Lifters making steady progress are often not sore.

---

The cardiovascular fitness decline curve is shallow now — you lose 3% to 6% per decade until age 70. After that, it drops fast: 20% or more per decade. What you build in this decade, from your 20s to your 40s, is what holds the curve when time comes calling. Training now is the cheapest insurance you can buy for autonomy in your 60s and 70s.

:::source[Mandsager et al., 2018 · *JAMA Network Open* · n=122,007](https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2707428)$body$,

  takeaways_pt = array[
    'Treinar nos 20-30 é o seguro mais barato que existe pra ter autonomia nos seus 60-70.',
    'Aperto de mão prediz quanto você vai viver — não pela mão, mas pelo que ela revela do corpo todo.',
    'Zone 2 é o único estímulo que constrói densidade mitocondrial. HIIT não substitui.'
  ],
  takeaways_en = array[
    $$Training in your 20s-30s is the cheapest insurance you can buy for autonomy in your 60s-70s.$$,
    $$Grip strength predicts how long you'll live — not because of the hand, but because of what it reveals about the whole body.$$,
    $$Zone 2 is the only stimulus that builds mitochondrial density. HIIT doesn't replace it.$$
  ],
  signs_pt = array[
    'Você sobe escada sem pensar nela.',
    'Aguenta 30 minutos ou mais de esforço contínuo confortavelmente.',
    'Acorda no dia seguinte sem dor anormal.'
  ],
  signs_en = array[
    'You climb stairs without thinking about them.',
    'You hold 30+ minutes of continuous effort comfortably.',
    'You wake up the next day without abnormal pain.'
  ],
  tracking_pt = 'Força é uma sub de Corpo. Suas tasks de "X push-ups", "X min de cardio" ou "treino na academia" caem aqui. Skills do catálogo (push-ups, corrida) usam percentis populacionais — você vê não só "quanto melhorou" mas "onde está em relação aos adultos no geral".',
  tracking_en = $$Strength is a sub of Body. Your tasks for "X push-ups", "X min cardio", or "gym session" land here. Catalog skills (push-ups, running) use population percentiles — you see not just "how much you improved" but "where you stand against adults overall".$$,
  reasoning_log = $rlog${
    "template_type": "explainer",
    "template_version": 2,
    "voice_principles_applied": [
      "3 main ideas (was 7). Each gets unhurried space.",
      "Prose-led. Body has 2 visual cards total: list-icon recipe + closing source. Stat and quote folded into prose / blockquote.",
      "Native PT (no anglicisms, conversational você, sentence-avg ~16 words, filler words cut).",
      "Jargon defined on first mention: Zone 2, lactate, mitochondrial density, HIIT.",
      "Concrete examples replace abstract noun lists.",
      "Myths integrated as paragraph commentary, not list-icon card.",
      "Native EN written separately, not translated from PT."
    ],
    "edits_from_prior_version_v3": [
      "Removed: stat card (top), 1 quote card, 1 progress bar, 2 callout cards (info + warn + tip), 1 compare card, 1 myth-bust list-icon. Total visual blocks went from 10 to 2 in body.",
      "Merged stakes sections (mortality + sarcopenia + grip strength) into one narrative arc in section 1.",
      "Zone 2 explanation rewritten with fuel analogy (fat vs sugar → lactate). Mitochondrial density now defined as 'usinas de energia das células'.",
      "Removed academic outline labels (Claim/Evidência/Contestado).",
      "Reading time stayed at 7 min. Same density, fewer interruptions."
    ],
    "main_points": [
      {"id": "1_silent_decline", "what_pt": "Declínio em força/cardio é silencioso e cobra em 30 anos.", "why_pt": "Stakes (mortalidade + sarcopenia + aperto de mão) em uma narrativa única.", "how_to_know_pt": "Self-test: 2 sacolas de 5 kg por 2 minutos."},
      {"id": "2_zone_2_real", "what_pt": "Zone 2 = intensidade aeróbica abaixo de 2 mmol/L lactato. Constrói densidade mitocondrial.", "why_pt": "Único estímulo que faz isso. HIIT não substitui.", "how_to_know_pt": "Teste da conversa: frases inteiras mas preferiria não. 180-idade aproximado."},
      {"id": "3_minimum_recipe", "what_pt": "OMS 2020: 2-3x força, 150-300min Zone 2, 75-150min vigoroso, 10min/dia mobilidade.", "why_pt": "É o piso, não o teto. Mitos comuns desmascarados em prosa.", "how_to_know_pt": "Schedule check semanal."}
    ]
  }$rlog$::jsonb
where slug = 'glossary-strength';

commit;
