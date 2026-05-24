-- ============================================================================
-- Learning: prose-led rewrites for 5 articles, applying the editorial
-- direction validated in Strength v4 (PR #176).
--
-- Articles rewritten:
--   1. glossary-sleep
--   2. summary-why-we-sleep
--   3. summary-outlive
--   4. news-oral-glp1-2026-05
--   5. news-loneliness-memory-2026-04
--
-- Editorial principles applied (per learning-drafter.md updates):
--   - 3 main ideas, not 5-7
--   - Prose-led: max 2 visual cards in body (typically 0-1 + closing source)
--   - Native PT and native EN written in parallel, not translated
--   - Banned phrases stripped (anglicisms, filler)
--   - Jargon defined on first mention with concrete anchor
--   - Academic outline labels (Claim/Evidência/Contestado) removed
--   - Concrete examples replace abstract noun lists
--   - Markdown blockquotes for inline quotes (lighter than :::quote cards)
-- ============================================================================

begin;

set local app.edited_by = 'maintainer';
set local app.edit_summary = 'Prose-led rewrites x5 — applying Strength v4 editorial direction';

-- ============================================================================
-- 1. SLEEP — prose-led rewrite
-- ============================================================================

update public.learning_material set
  reading_minutes = 7,
  body_pt = $body$Há uma diferença entre dormir mal e dormir pouco — e a versão difícil de notar é a segunda. Dormir 1h a menos do que precisa não te derruba na quarta. Mas em duas semanas seguidas dormindo só 6h, sua performance cognitiva cai pro mesmo nível de quem ficou uma noite inteira em claro. E você não percebe.

Esse foi o achado do estudo clássico de Van Dongen em 2003 — 14 noites com 6h de sono produzem o mesmo déficit de uma única noite sem dormir. Os participantes diziam que estavam "se acostumando." A medida cognitiva dizia outra coisa.

O consenso atual da Academia Americana de Medicina do Sono é simples: 7 a 9 horas por noite, regular. Abaixo de 7 entra em território de risco — uma meta-análise de 1,38 milhão de adultos liga sono curto a maior mortalidade, ao lado de diabetes, hipertensão e depressão (Cappuccio et al., 2010).

## 1. Sono não é uma coisa só

A maioria das pessoas pensa em sono como "horas." Mas três dimensões pesam, e faltar em uma derruba as outras.

**Quantidade.** 7 a 9 horas é o intervalo recomendado. 7 é o chão sólido. Se você está consistentemente abaixo, está cobrando um juro que vai aparecer em algum lugar.

**Regularidade.** Dormir e acordar no mesmo horário, todos os dias — fins de semana incluídos. Esse é o pedaço mais subestimado. Um estudo de 2024 com 60 mil adultos do UK Biobank encontrou que a regularidade prediz mortalidade **melhor** que a duração total (Windred et al., *Sleep*, 2024). Em palavras simples: 6,5h sempre no mesmo horário tende a vencer 8h em horários caóticos.

**Qualidade.** Sono profundo e REM intactos. Sono fragmentado por barulho, telas, álcool ou apneia conta menos do que parece — o tempo na cama existe, mas o trabalho biológico de fato não acontece.

A maioria das pessoas acerta uma e ignora as outras duas. Quem dorme 8h irregulares ou de baixa qualidade não está cobrindo o piso. Quem dorme 7h regulares e profundas está.

## 2. A bagunça que duas noites já fazem

A parte que mais incomoda quem está cortando sono não é o cansaço — é o efeito hormonal. Duas noites de 4 horas já bastam pra subir a grelina (o hormônio da fome) em 28% e derrubar a leptina (o hormônio da saciedade). Resultado: você sente fome mesmo comendo o suficiente, e o desejo por comida açucarada e gordurosa sobe 30 a 45%. Não é falta de força de vontade. É química desregulada (Spiegel et al., 2004).

Tem outra coisa que acontece em paralelo. Durante o sono profundo, o cérebro abre um sistema chamado glinfático — uma espécie de drenagem que ajuda a limpar resíduos metabólicos, incluindo β-amilóide, a proteína associada ao Alzheimer. Em estudos com camundongos, o espaço entre as células cerebrais expande cerca de 60% durante o sono, e a limpeza fica mais eficiente. *Caveat honesto*: o achado mais forte é em ratos. A extrapolação humana é plausível mas indireta — um estudo recente de 2024 até reportou clearance *reduzida* durante o sono em camundongos, complicando a história. Trate como "provável, ainda não fechado."

O que está totalmente fechado: estar acordado por 17 a 19 horas produz o mesmo déficit cognitivo e motor que 0,05% de álcool no sangue. 24h em claro chega a 0,10%, acima do limite legal de direção em vários países. Dirigir cansado não é uma metáfora de dirigir bêbado — em performance, é igual (Dawson & Reid, *Nature*, 1997).

## 3. A receita mínima

Quatro ajustes carregam quase tudo:

:::list-icon
time | **Horário consistente.** Mesma hora pra deitar e acordar, todos os dias. A regularidade compra mais que +30 min na cama.
bed | **Quarto entre 16 e 19°C, escuro.** O sono começa com uma queda de ~1°C na temperatura corporal — quarto quente bloqueia essa queda. Persianas de blackout valem ouro.
cafe | **Cafeína cutoff: 8h antes de dormir.** Meia-vida de 5 a 6 horas. 400mg às 16h ainda corta seu sono em mais de uma hora (Drake et al., 2013).
ban | **Álcool: nada 3h antes de dormir.** Álcool te faz pegar no sono mais rápido — e destrói o REM da segunda metade da noite. "Dormi bem com vinho" é ilusão; o sono ficou raso.
:::

Sobre wearables: anel, relógio, app do celular. Todos detectam **bem** se você está dormindo ou acordado (sensibilidade acima de 95%). Quase nenhum detecta bem **as fases** do sono — a precisão de fase varia entre 50 e 86% entre dispositivos. Use as horas totais como dado real. Trate "8% de sono profundo" como aproximação grosseira, não verdade.

---

E se você só consegue mexer em uma coisa, comece pela regularidade. Não exige nada extra na vida — só decisão. E é o que move mais.

:::source[Cappuccio et al., 2010 · meta-análise n=1,38M · *Sleep*](https://pubmed.ncbi.nlm.nih.gov/20469800/)$body$,
  body_en = $body$There's a difference between sleeping badly and sleeping too little — and the version that's hard to notice is the second. Losing one hour of sleep won't break you on Wednesday. But after two weeks of 6 hours a night, your cognitive performance drops to the level of someone who pulled an all-nighter. And you won't notice.

That was the finding of Van Dongen's classic 2003 study — 14 nights of 6-hour sleep produce the same deficit as one full night without sleep. Participants reported "getting used to it." The cognitive measure said otherwise.

The current consensus from the American Academy of Sleep Medicine is simple: 7 to 9 hours per night, regular. Below 7 you enter risk territory — a meta-analysis of 1.38 million adults links short sleep to higher mortality, alongside diabetes, hypertension, and depression (Cappuccio et al., 2010).

## 1. Sleep isn't one thing

Most people think of sleep as "hours." But three dimensions matter, and missing one breaks the others.

**Quantity.** 7 to 9 hours is the recommended range. 7 is the solid floor. If you're consistently below, you're racking up a tab that'll come due somewhere.

**Regularity.** Same bedtime and wake-up, every day — weekends included. This is the most underrated piece. A 2024 study of 60,000 UK Biobank adults found that regularity predicts mortality **better** than total duration (Windred et al., *Sleep*, 2024). In plain English: 6.5 regular hours tends to beat 8 chaotic hours.

**Quality.** Deep sleep and REM intact. Sleep fragmented by noise, screens, alcohol, or apnea counts for less than it looks — the time in bed exists, but the biological work doesn't actually happen.

Most people nail one and ignore the other two. Eight irregular or low-quality hours don't cover the floor. Seven regular, deep hours do.

## 2. The mess two nights can make

The part that bothers people who are cutting sleep isn't the tiredness — it's the hormonal effect. Two nights of 4 hours are enough to raise ghrelin (the hunger hormone) by 28% and drop leptin (the satiety hormone). Result: you feel hungry even after eating enough, and craving for sweet, fatty food jumps 30 to 45%. It's not lack of willpower. It's biochemistry rewired (Spiegel et al., 2004).

Something else runs in parallel. During deep sleep, the brain opens a system called the glymphatic system — a kind of drainage that helps clear metabolic byproducts, including β-amyloid, the protein associated with Alzheimer's. In mouse studies, the space between brain cells expands by about 60% during sleep, and clearance becomes more efficient. *Honest caveat*: the strongest evidence is in mice. The human extrapolation is plausible but indirect — a recent 2024 study even reported *reduced* clearance during sleep in mice, complicating the story. Treat it as "probably true, not yet locked."

What is locked: being awake for 17 to 19 hours produces the same cognitive and motor impairment as 0.05% blood alcohol. 24 hours awake reaches 0.10%, above the legal driving limit in many countries. Drowsy driving isn't a metaphor for drunk driving — in performance terms, it's identical (Dawson & Reid, *Nature*, 1997).

## 3. The minimum recipe

Four adjustments carry almost everything:

:::list-icon
time | **Consistent schedule.** Same bedtime and wake time, every day. Regularity buys more than 30 extra minutes in bed.
bed | **Bedroom at 16-19°C, dark.** Sleep starts with a ~1°C drop in body temperature — a warm room blocks that drop. Blackout curtains are worth gold.
cafe | **Caffeine cutoff: 8 hours before bed.** Half-life is 5 to 6 hours. 400mg at 4pm still cuts your sleep by over an hour (Drake et al., 2013).
ban | **Alcohol: none in the 3 hours before bed.** Alcohol gets you to sleep faster — and destroys REM in the second half of the night. "I slept well with wine" is an illusion; the sleep got shallow.
:::

About wearables: ring, watch, phone app. They all detect **well** whether you're asleep or awake (sensitivity above 95%). Almost none detect **stages** well — stage accuracy ranges 50 to 86% across devices. Use total hours as real data. Treat "8% deep sleep" as a rough estimate, not truth.

---

If you can only change one thing, start with regularity. It costs nothing extra in life — just a decision. And it moves the most.

:::source[Cappuccio et al., 2010 · meta-analysis n=1.38M · *Sleep*](https://pubmed.ncbi.nlm.nih.gov/20469800/)$body$,
  takeaways_pt = array[
    '14 noites de 6h de sono = 1 noite sem dormir, em performance cognitiva. E você não percebe.',
    'Regularidade do horário prediz mortalidade melhor que duração total (Windred 2024).',
    'Se for mexer em uma coisa: comece pelo horário consistente. Não custa nada e move mais.'
  ],
  takeaways_en = array[
    $$14 nights of 6h sleep = 1 night with no sleep, in cognitive performance. And you don't notice.$$,
    'Sleep timing regularity predicts mortality better than total duration (Windred 2024).',
    'If you change one thing: start with consistent timing. Costs nothing and moves the most.'
  ],
  signs_pt = array[
    'Acorda antes do despertador, sem sentir esmagado.',
    'Foco em blocos longos no início do dia.',
    'Não depende de cafeína pra existir.'
  ],
  signs_en = array[
    'Wake before your alarm without feeling crushed.',
    'Focus in long blocks early in the day.',
    $$Don't depend on caffeine to function.$$
  ],
  tracking_pt = 'Sono é uma sub de Saúde. Suas tasks de "dormir cedo", "evitar tela depois de X" ou "8h cheias" contribuem aqui. Cair nessa sub costuma puxar tudo o resto pra baixo em algumas semanas — vale acompanhar.',
  tracking_en = $$Sleep is a sub of Health. Your tasks for "sleep early", "no screens after X", or "full 8h" contribute here. A drop in this sub tends to pull everything else down within a few weeks — worth watching.$$,
  reasoning_log = $rlog${
    "template_type": "explainer",
    "template_version": 2,
    "voice_principles_applied": [
      "3 main ideas (was 7 sections)",
      "Prose-led: 1 visual card in body (list-icon recipe) + closing source",
      "Stat block top removed, number woven into hook prose",
      "Jargon defined: glinfático, β-amilóide, grelina, leptina",
      "Section 1 reframed: '3 dimensões' as paragraphs not 3 list items",
      "Wearable accuracy as prose paragraph, not callout card",
      "Closing single-sentence punchline instead of card-recipe duplication"
    ],
    "edits_from_prior_version_v2": [
      "Removed: stat card, quote card, compare card, progress card, 2 callout cards. Body went from 8 visual blocks to 1.",
      "Merged 'Por que importa', 'A bagunça hormonal', 'O cérebro precisa lavar' into a single section 2 with hormonal + glymphatic + drowsy=drunk as one narrative",
      "Reading time stayed at 7 min — same density, fewer interruptions"
    ],
    "main_points": [
      {"id": "1_three_dimensions", "what_pt": "Sono = quantidade + regularidade + qualidade. Regularidade é o pedaço subestimado.", "why_pt": "Windred 2024 mostra que regularidade prediz mortalidade melhor que duração.", "how_to_know_pt": "Mesmo horário sempre, fins de semana incluídos."},
      {"id": "2_two_nights_mess", "what_pt": "Hormônios (grelina/leptina), glinfático (caveat camundongo), drowsy=drunk", "why_pt": "Demonstra magnitude do efeito em CURTO prazo, não só longo", "how_to_know_pt": "Fome anormal + cravings após noites ruins"},
      {"id": "3_minimum_recipe", "what_pt": "4 ajustes: horário, temperatura, cafeína 8h antes, álcool 3h antes.", "why_pt": "Esses 4 carregam quase tudo. Mais que isso é refinamento.", "how_to_know_pt": "Checklist semanal."}
    ]
  }$rlog$::jsonb
where slug = 'glossary-sleep';

-- ============================================================================
-- 2. SUMMARY-WHY-WE-SLEEP — prose-led rewrite
-- ============================================================================

update public.learning_material set
  reading_minutes = 7,
  body_pt = $body$Em 2017, Matthew Walker — neurocientista de Berkeley — publicou um livro chamado *Why We Sleep* que mudou a conversa sobre sono. A tese era simples e dramática: a sociedade moderna está em uma "epidemia silenciosa de privação de sono," e o custo é doença e morte cedo. A frase que abre o livro virou um meme científico:

> Quanto mais curto o seu sono, mais curta a sua vida.

Funcionou. O livro vendeu milhões, virou referência em podcasts, foi citado em diretrizes de saúde pública. Mas também atraiu uma auditoria que não para de aparecer em qualquer conversa séria sobre o tema. Vale entender as duas coisas — porque o que sobrevive do livro continua sendo bom guia, e o que não sobrevive te ajuda a calibrar tudo o que você lê sobre sono daqui pra frente.

## 1. O que o livro afirma

A pergunta central do Walker é evolutivamente interessante: por que sono existe? Você não come, não se reproduz, não se defende durante 1/3 da sua vida — e mesmo assim a evolução manteve o sono em toda espécie animal estudada. A resposta dele: porque é manutenção biológica não-negociável.

Walker organiza o sono em duas máquinas paralelas. NREM (sono profundo) consolida memória factual e abre o sistema glinfático — a "lavagem" diária do cérebro que limpa resíduos metabólicos. REM processa emoção, integra aprendizado motor, e parece estar ligado à criatividade. Os dois trabalham juntos. Faltar um quebra os dois.

A partir dessa fundação, Walker faz alguns saltos. Dormir menos de 7 horas dobra o risco de câncer, ele afirma. Causa primária de Alzheimer via falha em limpar β-amilóide. A sociedade moderna estaria em uma "epidemia" reconhecida pela Organização Mundial da Saúde. Adultos precisam de 8 horas, não 7 — qualquer coisa abaixo disso é um corte com custo proporcional ao déficit.

A direção geral está certa. Sono importa. As pessoas dormem menos do que deveriam. Mas os números específicos é onde o livro começou a desmoronar.

## 2. A auditoria que não para de aparecer

Em 2019, um pesquisador independente chamado Alexey Guzey publicou uma auditoria detalhada do livro, com citações. Em ordem de impacto:

A "epidemia de perda de sono declarada pela OMS" não existe. A OMS nunca fez essa declaração. Walker estava citando um filme da *National Geographic* como se fosse um documento oficial.

A meta-análise de 2018 com mais de 1,5 milhão de pessoas — publicada depois do livro — não encontrou ligação significativa entre sono curto e câncer. A afirmação de "duplica o risco de câncer" simplesmente não se sustenta.

No capítulo 6, Walker reproduz um gráfico de lesões versus duração de sono — e apaga a barra de 5 horas, que contradiz a narrativa dele. O estatístico Andrew Gelman, da Columbia, chamou isso de "território de má conduta de pesquisa."

O estudo de Kripke de 2002, com 1,1 milhão de pessoas, achou a menor mortalidade entre 6,5 e 7,5 horas, e mortalidade *maior* acima de 8h. A relação é uma curva em U, não uma linha descendente como Walker apresenta.

Em 2020, um paper de Walker no *Neuron* foi retratado por duplicação com seu paper no *Lancet*. A UC Berkeley investigou após queixa formal e fechou sem investigação completa. Walker fez algumas correções em edições posteriores mas nunca emitiu errata abrangente.

Bill Gates, na resenha pública dele, flaggou exatamente o ponto do Alzheimer como oversold. A causalidade em humanos não está provada.

## 3. O que sobrevive

A boa notícia: o esqueleto do que Walker diz é mainstream e bem sustentado. Sono é manutenção biológica importante. 7-9h é a faixa recomendada (não 8h cravadas). Quarto fresco, escuro, sem tela. Cafeína cedo no dia. Sem álcool antes de dormir. Tudo isso é consenso entre sociedades médicas, não exclusivo do Walker.

O que não sobrevive: as estatísticas de choque. "Dobra câncer," "epidemia da OMS," "400-600% menos erros" — números que pareciam definitivos quando o livro saiu mas que precisam ser tratados como direcionalmente prováveis e numericamente suspeitos.

Existe um efeito colateral preocupante. Coaches e clínicos de sono relataram pacientes desenvolvendo *insônia* depois de ler o livro com medo. A própria preocupação obsessiva com sono — chamada às vezes de "ortossonia" — é um problema crescente em quem usa wearables e leu *Why We Sleep*. Ironia: ler o livro com medo pode estragar seu sono mais do que melhorar.

---

Vale ler? Sim, com lápis cético na mão. É a porta de entrada mais acessível pra levar sono a sério. Mas trate as estatísticas dramáticas como "provavelmente certo na direção, errado nos números." E se você sentir ansiedade aumentando durante a leitura, pare. A obsessão com sono não te ajuda a dormir.

:::source[Walker, M. — Why We Sleep · Norton 2017 · ISBN 978-1501144318. Auditoria: Guzey 2019](https://guzey.com/books/why-we-sleep/)$body$,
  body_en = $body$In 2017, Matthew Walker — a Berkeley neuroscientist — published a book called *Why We Sleep* that changed the conversation about sleep. The thesis was simple and dramatic: modern society is in a "silent sleep loss epidemic," and the cost is disease and early death. The line that opens the book became a scientific meme:

> The shorter your sleep, the shorter your life.

It worked. The book sold millions, became a podcast reference, got cited in public health guidelines. But it also attracted an audit that won't stop showing up in any serious sleep conversation. Worth understanding both — because what survives the book is good guidance, and what doesn't survive helps you calibrate everything you read about sleep going forward.

## 1. What the book claims

Walker's central question is evolutionarily interesting: why does sleep exist? You don't eat, reproduce, or defend yourself during 1/3 of your life — yet evolution kept sleep in every animal species studied. His answer: because it's non-negotiable biological maintenance.

Walker organizes sleep into two parallel machines. NREM (deep sleep) consolidates factual memory and opens the glymphatic system — the brain's daily "wash" that clears metabolic byproducts. REM processes emotion, integrates motor learning, and seems tied to creativity. Both work together. Missing one breaks the other.

From this foundation, Walker takes some leaps. Sleeping under 7 hours doubles cancer risk, he claims. Primary cause of Alzheimer's through failure to clear β-amyloid. Modern society is in an "epidemic" recognized by the World Health Organization. Adults need 8 hours, not 7 — anything less is a cut with cost proportional to the deficit.

The general direction is right. Sleep matters. People sleep less than they should. But the specific numbers are where the book started falling apart.

## 2. The audit that won't go away

In 2019, an independent researcher named Alexey Guzey published a detailed audit of the book, with citations. In order of impact:

The "WHO-declared sleep loss epidemic" doesn't exist. The WHO never made that declaration. Walker was citing a *National Geographic* film as if it were an official document.

A 2018 meta-analysis of over 1.5 million people — published after the book — found no significant link between short sleep and cancer. The "doubles cancer risk" claim simply doesn't hold.

In chapter 6, Walker reproduces an injuries-vs-sleep-duration graph — and deletes the 5-hour bar that contradicts his narrative. Statistician Andrew Gelman, of Columbia, called this "research misconduct territory."

Kripke's 2002 study, with 1.1 million people, found the lowest mortality between 6.5 and 7.5 hours, and *higher* mortality above 8h. The relationship is a U-curve, not the downward line Walker presents.

In 2020, a Walker paper in *Neuron* was retracted for duplication with his *Lancet* paper. UC Berkeley investigated after a formal complaint and closed without a full investigation. Walker made some corrections in later editions but never issued comprehensive errata.

Bill Gates, in his public review, flagged the Alzheimer's point specifically as oversold. Causality in humans isn't proven.

## 3. What survives

The good news: the skeleton of what Walker says is mainstream and well-supported. Sleep is important biological maintenance. 7-9h is the recommended range (not a hard 8h). Cool, dark room, no screens. Caffeine early in the day. No alcohol before bed. All of this is consensus among medical societies, not Walker-exclusive.

What doesn't survive: the shock statistics. "Doubles cancer," "WHO epidemic," "400-600% more errors" — numbers that seemed definitive when the book came out but need to be treated as directionally probably right and numerically suspect.

There's a troubling side effect. Sleep coaches and clinicians have reported patients developing *insomnia* after reading the book with fear. Obsessive worry about sleep — sometimes called "orthosomnia" — is a growing problem in wearable users who read *Why We Sleep*. Irony: reading the book with fear may damage your sleep more than improve it.

---

Worth reading? Yes, with a skeptic's pencil in hand. It's the most accessible on-ramp to taking sleep seriously. But treat the dramatic statistics as "probably right in direction, wrong in numbers." And if you feel anxiety rising while reading, stop. Obsessing about sleep doesn't help you sleep.

:::source[Walker, M. — Why We Sleep · Norton 2017 · ISBN 978-1501144318. Audit: Guzey 2019](https://guzey.com/books/why-we-sleep/)$body$,
  takeaways_pt = array[
    'Walker acertou na direção (sono importa) e tropeçou nos números (especificamente as estatísticas sobre câncer e Alzheimer).',
    'A "epidemia de perda de sono da OMS" que o livro cita não existe — Walker citou um documentário como se fosse documento oficial.',
    'O conselho prático sobrevive (7-9h, regularidade, cafeína cedo, sem álcool). As estatísticas dramáticas não.'
  ],
  takeaways_en = array[
    'Walker got the direction right (sleep matters) and tripped on the numbers (specifically the stats about cancer and Alzheimer''s).',
    'The "WHO sleep loss epidemic" the book cites doesn''t exist — Walker cited a documentary as if it were an official document.',
    'The practical advice survives (7-9h, regularity, caffeine early, no alcohol). The dramatic statistics don''t.'
  ],
  signs_pt = array[
    'Você consegue distinguir o que do livro é mainstream do que é overclaim do Walker.',
    'Você usa as recomendações como guia, não como dogma.',
    'Você não desenvolveu medo paralisante de não dormir "as 8h perfeitas."'
  ],
  signs_en = array[
    'You can tell which parts of the book are mainstream vs which are Walker overclaims.',
    'You use the recommendations as guidance, not dogma.',
    $$You haven't developed paralyzing fear of not getting "the perfect 8 hours."$$
  ],
  tracking_pt = 'Esse summary fica em Aprender, sob Sono (Saúde). Lendo ele você calibra o que pegar dos próximos materiais sobre sono — nem tudo que parece autoridade resiste à auditoria. Walker continua sendo referência, com asteriscos.',
  tracking_en = $$This summary lives in Learn under Sleep (Health). Reading it calibrates what to take from future sleep materials — not everything that sounds authoritative survives audit. Walker remains a reference, with asterisks.$$,
  reasoning_log = $rlog${
    "template_type": "summary",
    "template_version": 2,
    "voice_principles_applied": [
      "3 sections, not 6 (was sectioned with Claim/Evidência/Contestado labels)",
      "Academic outline labels (Claim/Evidência/Realidade) removed entirely",
      "1 inline blockquote for Walker's iconic line (no quote card)",
      "Guzey audit narrative-style, not bulleted",
      "Verdict integrated as closing paragraph, not separate section"
    ],
    "edits_from_prior_version": [
      "Removed: ::: callout cards (3), ::: list-icon for myth-busts, ::: quote card",
      "Body went from 5+ visual blocks to 0 in body (only :::source at close)",
      "Guzey points written as flowing paragraphs"
    ],
    "main_points": [
      {"id": "1_what_book_claims", "what_pt": "Walker monta tese: sono é manutenção biológica, sociedade está em epidemia.", "why_pt": "Frame que vendeu o livro e dominou a conversa pós-2017.", "how_to_know_pt": "Reconhecer NREM/REM, glinfático, 8h-rule como ideias do livro."},
      {"id": "2_audit", "what_pt": "Guzey 2019 documentou 5+ erros graves. Berkeley investigou e fechou.", "why_pt": "Mostra onde os números específicos não se sustentam.", "how_to_know_pt": "Se um amigo cita 'OMS declarou epidemia de sono', você sabe corrigir."},
      {"id": "3_survives", "what_pt": "Esqueleto sobrevive (mainstream). Estatísticas de choque não. Risco real de ortossonia.", "why_pt": "Define como tratar a leitura: bom guia direcional, números suspeitos.", "how_to_know_pt": "Você lê sem desenvolver ansiedade obsessiva sobre sono."}
    ]
  }$rlog$::jsonb
where slug = 'summary-why-we-sleep';

-- ============================================================================
-- 3. SUMMARY-OUTLIVE — prose-led rewrite
-- ============================================================================

update public.learning_material set
  reading_minutes = 7,
  body_pt = $body$Em 2023, Peter Attia publicou *Outlive*, um livro que virou referência na conversa sobre longevidade. A pergunta dele é específica: por que a medicina moderna falha em prevenir as quatro doenças que matam 80% das pessoas em países desenvolvidos? Cardiovascular, câncer, neurodegenerativa, metabólica. As respostas dele formam o que ele chama de Medicina 3.0 — uma abordagem preventiva, proativa e personalizada, focada em manter saúde funcional ao longo do tempo, não só em estender a vida.

> Medicine 3.0 prioriza prevenção muito mais que tratamento.

A diferença entre o livro e os centenas de "como viver mais" que existem é que Attia não é evangelista de uma intervenção. Ele monta um framework. Algumas peças desse framework são consenso mainstream apresentado bem. Outras são opinião informada que ele defende como se fosse consenso. Vale separar os dois.

## 1. Os quatro cavaleiros e a tese central

A organização do livro gira em torno do que Attia chama de Quatro Cavaleiros — as quatro famílias de doença que dominam a mortalidade adulta depois dos 50: doença cardiovascular ateroesclerótica (infarto, AVC), câncer, doenças neurodegenerativas (Alzheimer), e diabetes tipo 2. Juntas, respondem por cerca de 80% das mortes não-acidentais.

A inovação retórica dele é apontar que resistência à insulina — a condição metabólica que precede o diabetes tipo 2 — também aparece como fator de risco nas outras três. Daí vem o conceito de "Diabetes Tipo 3" pra Alzheimer (proposto antes do Attia, mas popularizado por ele): a hipótese de que disfunção metabólica cerebral é parte central do mecanismo.

Eric Topol, cardiologista respeitado, descreveu a apresentação leiga desses Cavaleiros como a melhor que já viu. Mas vale apontar onde a moldura é mais retórica que substantiva. A premissa de "uma raiz única (insulina)" é poderosa pedagogicamente, mas reducionista — o papel da insulina em câncer e Alzheimer ainda é hipótese, não consenso. E o modelo agressivo de prevenção cardiovascular do Attia — medir apoB (uma proteína que carrega o "colesterol ruim" e prediz risco cardíaco melhor que o LDL clássico), não só LDL-C, e baixar "o mais cedo e o mais baixo possível" — coincide com a prática mainstream de cardiologistas preventivos em cerca de 90% dos casos. A diferença entre os dois é mais de intensidade que de fundamento.

## 2. A parte que sobrevive sem ressalva: exercício

Se há um capítulo do livro que vale o preço sozinho, é o de exercício. Attia argumenta — corretamente, segundo o consenso atual — que capacidade cardiorrespiratória (basicamente, seu condicionamento aeróbico) é o preditor modificável mais forte de mortalidade. Sair dos 25% piores de condicionamento pra os 25% melhores corresponde a aproximadamente 5 vezes menos risco de morte — efeito **maior** que parar de fumar. Estudo de 122 mil pessoas, publicado no *JAMA Network Open* em 2018 (Mandsager et al.).

A receita que ele defende é ~80% Zone 2 + 20% trabalho de VO2 max (intervalos de alta intensidade), mais treino de força pesado, mais estabilidade e mobilidade. Zone 2 é a faixa de intensidade aeróbica em que o corpo ainda queima principalmente gordura como combustível — onde a fundação aeróbica e a densidade mitocondrial são construídas.

> Se eu pudesse prescrever um único medicamento pra saúde e longevidade, seria exercício — e dentro disso, o tipo mais importante seria a eficiência aeróbica, o que chamamos de Zone 2.

A direção dessa receita é boa ciência. Mas Attia extrapola a divisão exata 80/20 do treinamento de elite endurance pro adulto comum, e a evidência de ensaios randomizados especificamente apoiando essa proporção é fina. Brad Stanfield, médico que faz vídeos críticos sobre longevidade, aponta isso: Zone 2 é importante, mas a dose precisa é opinião, não regra.

Attia também propõe o Decatlo Centenário — uma forma criativa de planejamento. Que tarefas físicas você quer fazer na sua "Década Marginal" (os últimos 10 anos de vida)? Carregar mala de 30 lbs, levantar do chão sem ajuda, pegar neto no colo. Como a função decai 10 a 15% por década depois dos 50, você precisa estar duas vezes mais em forma aos 50 do que vai precisar estar aos 80. É um frame útil pra dar direção concreta ao treino.

## 3. Onde o livro tropeça e o que sobra disso

O capítulo de screening agressivo é o mais contestado. Attia defende ressonância de corpo inteiro de rotina pra rastrear câncer cedo. Eric Topol criticou explicitamente: leva a cascata de biópsias por achados acidentais, ansiedade do paciente, e zero ganho prospectivo de mortalidade comprovado em populações sem fator de risco.

A farmacologia é a parte mais especulativa. Attia toma rapamicina off-label. O sinal de extensão de vida em outras espécies (camundongos especialmente) é o mais forte de qualquer droga já testada. Mas em humanos? Zero dados de outcome de longo prazo. O ensaio PEARL de 2024 foi largamente nulo nos endpoints funcionais que mediu. Bryan Johnson — outro evangelista da longevidade — notavelmente parou rapamicina citando efeitos colaterais.

E depois tem a questão de acesso. A clínica do Attia, Early Medical, cobra entre cinco e seis dígitos anuais por paciente e atende menos de 100 pessoas. Críticos chamam de "saúde pra os 0,1%." As prescrições de exercício, sono e nutrição democratizam — qualquer um pode aplicar. A camada de testes de biomarcadores avançados e GP-concierge, não. Attia reconhece esse gap mas não o resolve.

---

Vale ler? Sim, uma vez, com ceticismo. *Outlive* é a melhor síntese mainstream do caso preventivo pra healthspan (anos vividos com função plena) que existe pro leitor não-técnico, especialmente nas seções de exercício e metabolismo. Trate os capítulos de screening agressivo e farmacologia como opinião informada, não consenso. E o modelo da clínica como aspiracional, não literal.

*Nota separada*: o nome de Attia apareceu nos arquivos Epstein liberados em janeiro de 2026, e a CBS News rompeu o vínculo com ele em fevereiro. Isso afeta o mensageiro, não a ciência do livro — vale avaliar uma coisa e outra separadas.

:::source[Attia, P. — Outlive · Harmony 2023 · ISBN 978-0593236598. Review: Topol, Ground Truths](https://erictopol.substack.com/p/a-review-of-outlive)$body$,
  body_en = $body$In 2023, Peter Attia published *Outlive*, a book that became a reference in the longevity conversation. His question is specific: why does modern medicine fail to prevent the four diseases that kill 80% of people in developed countries? Cardiovascular, cancer, neurodegenerative, metabolic. His answers form what he calls Medicine 3.0 — a preventive, proactive, personalized approach focused on maintaining functional health over time, not just extending life.

> Medicine 3.0 places a far greater emphasis on prevention than treatment.

The difference between the book and the hundreds of "how to live longer" out there is that Attia isn't an evangelist for a single intervention. He builds a framework. Some pieces of that framework are mainstream consensus presented well. Others are informed opinion he defends as if it were consensus. Worth separating the two.

## 1. The Four Horsemen and the central thesis

The book is organized around what Attia calls the Four Horsemen — the four disease families that dominate adult mortality after 50: atherosclerotic cardiovascular disease (heart attack, stroke), cancer, neurodegenerative diseases (Alzheimer's), and type 2 diabetes. Together, they account for about 80% of non-accidental deaths.

His rhetorical innovation is to point out that insulin resistance — the metabolic condition that precedes type 2 diabetes — also appears as a risk factor in the other three. That's where the "Type 3 Diabetes" framing for Alzheimer's comes from (proposed before Attia, but popularized by him): the hypothesis that cerebral metabolic dysfunction is central to the mechanism.

Eric Topol, a respected cardiologist, called the lay presentation of these Horsemen the best he's ever seen. But it's worth pointing out where the framing is more rhetorical than substantive. The "single root (insulin)" premise is pedagogically powerful but reductive — the role of insulin in cancer and Alzheimer's is still hypothesis, not consensus. And Attia's aggressive cardiovascular prevention model — measuring apoB (a protein that carries "bad cholesterol" and predicts cardiac risk better than classic LDL), not just LDL-C, and lowering it "as early and as low as possible" — overlaps with preventive cardiologists' mainstream practice in about 90% of cases. The difference is more about intensity than foundation.

## 2. The part that survives unqualified: exercise

If there's one chapter that's worth the price of the book alone, it's the one on exercise. Attia argues — correctly, by current consensus — that cardiorespiratory fitness (basically, your aerobic conditioning) is the strongest modifiable predictor of mortality. Going from the bottom 25% of fitness to the top 25% corresponds to roughly 5 times lower mortality risk — a **larger** effect than quitting smoking. Study of 122,000 people, published in *JAMA Network Open* in 2018 (Mandsager et al.).

The recipe he advocates is ~80% Zone 2 + 20% VO2 max work (high-intensity intervals), plus heavy strength training, plus stability and mobility. Zone 2 is the aerobic intensity range where your body still burns mostly fat as fuel — where aerobic foundation and mitochondrial density get built.

> If I could only prescribe one drug for health and longevity, it would be exercise — and within that, the single most important type would be aerobic efficiency, what we call Zone 2.

The direction of this recipe is good science. But Attia extrapolates the exact 80/20 split from elite endurance training to the average adult, and the randomized-trial evidence specifically supporting that proportion is thin. Brad Stanfield, a physician who makes critical videos on longevity, points this out: Zone 2 matters, but the precise dose is opinion, not rule.

Attia also proposes the Centenarian Decathlon — a creative way of planning. What physical tasks do you want to perform in your "Marginal Decade" (the last 10 years of life)? Carry a 30-lb suitcase, get off the floor unaided, lift a grandchild. Since function declines 10 to 15% per decade after 50, you need to be twice as fit at 50 as you'll need to be at 80. It's a useful frame for giving training a concrete direction.

## 3. Where the book stumbles and what's left

The aggressive screening chapter is the most contested. Attia advocates routine whole-body MRI to screen for cancer early. Eric Topol criticized this explicitly: it leads to a cascade of biopsies from incidental findings, patient anxiety, and zero proven prospective mortality benefit in populations without risk factors.

Pharmacology is the most speculative part. Attia takes rapamycin off-label. The lifespan extension signal in other species (mice especially) is the strongest of any drug ever tested. But in humans? Zero long-term outcome data. The 2024 PEARL trial was largely null on the functional endpoints it measured. Bryan Johnson — another longevity evangelist — notably stopped rapamycin citing side effects.

And then there's the access question. Attia's clinic, Early Medical, charges between five and six figures annually per patient and serves fewer than 100 people. Critics call it "healthcare for the 0.1%." The exercise, sleep, and nutrition prescriptions democratize — anyone can apply them. The layer of advanced biomarker testing and concierge GP, doesn't. Attia acknowledges this gap but doesn't solve it.

---

Worth reading? Yes, once, with skepticism. *Outlive* is the best mainstream synthesis of the prevention-first case for healthspan (years lived in full function) available to the non-technical reader, especially in the exercise and metabolism sections. Treat the aggressive screening and pharmacology chapters as informed opinion, not consensus. And the clinic model as aspirational, not literal.

*Separate note*: Attia's name appeared in the Epstein files released in January 2026, and CBS News ended its relationship with him in February. This affects the messenger, not the book's science — worth evaluating each separately.

:::source[Attia, P. — Outlive · Harmony 2023 · ISBN 978-0593236598. Review: Topol, Ground Truths](https://erictopol.substack.com/p/a-review-of-outlive)$body$,
  takeaways_pt = array[
    'Os 4 Cavaleiros + Medicina 3.0 + Decatlo Centenário são frames úteis. Aceite os frames, questione a intensidade das prescrições.',
    'Exercício é a parte que sobrevive sem ressalva. Zone 2 + força + estabilidade — isso é mainstream agora.',
    'Screening agressivo e farmacologia (rapamicina) são opinião informada do Attia, não consenso. Trate com ceticismo.'
  ],
  takeaways_en = array[
    'The Four Horsemen + Medicine 3.0 + Centenarian Decathlon are useful frames. Accept the frames, question the prescription intensity.',
    'Exercise is the part that survives unqualified. Zone 2 + strength + stability — that''s mainstream now.',
    $$Aggressive screening and pharmacology (rapamycin) are Attia's informed opinion, not consensus. Treat with skepticism.$$
  ],
  signs_pt = array[
    'Você consegue distinguir os frames do livro (úteis) das prescrições específicas (debatíveis).',
    'Você aplica a parte de exercício sem precisar do pacote de testes laboratoriais caros.',
    'Você sabe que muitos cardiologistas já praticam 80% da Medicina 3.0 sem chamar assim.'
  ],
  signs_en = array[
    'You can tell the book''s frames (useful) from its specific prescriptions (debatable).',
    'You apply the exercise part without needing the expensive lab panel.',
    'You know many cardiologists already practice 80% of Medicine 3.0 without calling it that.'
  ],
  tracking_pt = 'Esse summary fica em Aprender, sob Força (Corpo). Conecta com o explainer de Strength (Zone 2 explicado) e dá contexto pra próximas leituras de longevidade.',
  tracking_en = 'This summary lives in Learn under Strength (Body). Connects with the Strength explainer (Zone 2 explained) and gives context for future longevity reads.',
  reasoning_log = $rlog${
    "template_type": "summary",
    "template_version": 2,
    "voice_principles_applied": [
      "3 sections (was 4 + tropeça + verdict = effectively 6)",
      "Claim/Evidência/Contestado labels stripped entirely",
      "2 inline blockquotes for Attia's iconic lines (no quote cards)",
      "apoB defined on first mention as 'proteína que carrega o colesterol ruim'",
      "Zone 2 defined inline",
      "healthspan defined in EN translation as 'years lived in full function'"
    ],
    "edits_from_prior_version": [
      "Removed: all callout cards (info + warn), compare card",
      "Body went from 4+ visual blocks to 0 in body (only :::source at close)",
      "Quote cards converted to markdown > blockquotes",
      "Centenarian Decathlon merged into Section 2 with exercise"
    ],
    "main_points": [
      {"id": "1_four_horsemen", "what_pt": "4 doenças que matam 80% pós-50. Resistência à insulina como raiz comum.", "why_pt": "Frame poderoso pedagogicamente, mas hipotético em câncer e Alzheimer.", "how_to_know_pt": "Conhece apoB, Lp(a), entende prevenção primordial."},
      {"id": "2_exercise", "what_pt": "Capacidade cardiorrespiratória = preditor mais forte de mortalidade. Zone 2 + força + Decatlo Centenário.", "why_pt": "Mandsager 2018 ancora a tese. Direção certa, dose precisa é opinião.", "how_to_know_pt": "Tem rotina de exercício; pensa em manter função aos 80."},
      {"id": "3_where_it_stumbles", "what_pt": "Screening agressivo (whole-body MRI) + farmacologia (rapamicina) + acesso (clínica $$$).", "why_pt": "Topol e Stanfield criticam. PEARL 2024 nulo. <100 pacientes.", "how_to_know_pt": "Aplica exercício/sono/nutrição sem precisar de panel laboratorial caro."}
    ]
  }$rlog$::jsonb
where slug = 'summary-outlive';

-- ============================================================================
-- 4. NEWS ORFORGLIPRON — prose-led rewrite
-- ============================================================================

update public.learning_material set
  reading_minutes = 4,
  body_pt = $body$Quem perdeu peso com Ozempic, Wegovy, Mounjaro ou Zepbound vive com um dado desconfortável: parar a injeção semanal geralmente significa recuperar a maior parte do peso em meses. Um ensaio fase 3 publicado em 12 de maio de 2026 na *Nature Medicine* trouxe a primeira alternativa real — trocar a injeção semanal por uma pílula oral diária (orforglipron) preserva entre 75% e 80% da perda já conquistada.

## O ensaio

ATTAIN-MAINTAIN. Randomizado, duplo-cego, multicêntrico, conduzido pela Eli Lilly em parceria com a Weill Cornell. Participantes que já tinham perdido peso com semaglutida ou tirzepatida foram divididos em dois grupos: continuar com placebo, ou trocar pra orforglipron oral diário. Acompanhamento de um ano (Aronne et al., *Nature Medicine*, 2026).

O resultado: quem trocou pra a pílula manteve 75-80% da perda. Quem ficou com placebo recuperou a maior parte do peso. Pacientes vindos da tirzepatida (ação dupla, mais potente) recuperaram um pouco mais do que vindos da semaglutida — efeito esperado e modesto.

## O que isso muda

Antes desse estudo, a suposição padrão era que parar GLP-1 injetável significava recuperar peso rápido, e que as pílulas orais existentes (rybelsus, por exemplo) não tinham potência comparável às injeções. Orforglipron oral diário muda essa equação. É o primeiro oral com potência comparável a injetável.

O caveat honesto: o autor líder declara consultoria paga com a Lilly, patrocinadora do estudo. O follow-up de mais de 1 ano pós-troca ainda está pendente. E, importante: orforglipron ainda não tem aprovação da FDA. A decisão regulatória é esperada pra fim de 2026.

## O que continua igual

GLP-1 ainda exige uso crônico pra manter o benefício. Não é "fiz um ciclo e terminei." Esse ponto não mudou.

Estilo de vida continua sendo a fundação. Proteína suficiente, treino de força pra preservar massa magra durante a perda, sono adequado. O remédio não substitui isso — durante a perda em GLP-1, sem treino de força, a perda de massa magra junto com a gordura é significativa.

Pra quem está em GLP-1 hoje: vale conversar com seu médico sobre transição quando orforglipron estiver disponível, mas não é decisão pra tomar sozinho com base num post de Twitter. Pra quem não está em GLP-1: nada muda. Treino mais proteína mais sono continuam movendo o ponteiro.

:::source[Aronne LJ et al., 2026 · *Nature Medicine* · ATTAIN-MAINTAIN trial](https://www.nature.com/articles/s41591-026-04386-7)$body$,
  body_en = $body$Anyone who lost weight on Ozempic, Wegovy, Mounjaro, or Zepbound lives with an uncomfortable fact: stopping the weekly injection usually means regaining most of the weight within months. A phase 3 trial published May 12, 2026 in *Nature Medicine* brought the first real alternative — switching the weekly injection for a daily oral pill (orforglipron) preserves between 75% and 80% of the loss already achieved.

## The trial

ATTAIN-MAINTAIN. Randomized, double-blind, multi-site, conducted by Eli Lilly in partnership with Weill Cornell. Participants who had already lost weight on semaglutide or tirzepatide were split into two groups: continue with placebo, or switch to daily oral orforglipron. One-year follow-up (Aronne et al., *Nature Medicine*, 2026).

The result: those who switched to the pill held 75-80% of the loss. Those on placebo regained most of the weight. Patients coming off tirzepatide (dual-action, more potent) regained slightly more than those coming off semaglutide — expected and modest effect.

## What this changes

Before this study, the standard assumption was that stopping injectable GLP-1 meant rapid regain, and that existing oral pills (Rybelsus, for example) didn't have potency comparable to the injections. Daily oral orforglipron changes that equation. It's the first oral with potency comparable to injectables.

The honest caveat: the lead author discloses paid consulting with Lilly, the trial sponsor. Follow-up of more than 1 year post-switch is still pending. And, importantly: orforglipron does **not yet have FDA approval**. The regulatory decision is expected by late 2026.

## What stays the same

GLP-1 still requires chronic use to keep the benefit. It's not "I did a cycle and I'm done." That point hasn't changed.

Lifestyle remains the foundation. Adequate protein, strength training to preserve lean mass during loss, adequate sleep. The drug doesn't replace that — during GLP-1 loss without strength training, lean mass loss alongside fat is significant.

For people on GLP-1 today: worth discussing the transition with your doctor when orforglipron becomes available, but it's not a decision to make alone based on a Twitter post. For everyone else: nothing changes. Training plus protein plus sleep still move the needle.

:::source[Aronne LJ et al., 2026 · *Nature Medicine* · ATTAIN-MAINTAIN trial](https://www.nature.com/articles/s41591-026-04386-7)$body$,
  takeaways_pt = array[
    'Pílula oral diária (orforglipron) preserva 75-80% da perda de peso pós-GLP-1 injetável. Primeiro dado fase 3 dessa magnitude.',
    'Aprovação FDA esperada pro fim de 2026. Conversa com médico depois disso, não decisão sozinho hoje.',
    'Estilo de vida (força + proteína + sono) continua sendo o que move o ponteiro. Remédio não substitui isso.'
  ],
  takeaways_en = array[
    'Daily oral pill (orforglipron) preserves 75-80% of weight loss after injectable GLP-1. First phase 3 data of this magnitude.',
    'FDA approval expected late 2026. Doctor conversation after that, not solo decision now.',
    $$Lifestyle (strength + protein + sleep) still moves the needle. The drug doesn't replace it.$$
  ],
  signs_pt = array[
    'Você sabe diferenciar a notícia (real, sólida) do hype no Twitter.',
    'Você sabe quando vale conversar com seu médico (e quando esperar).',
    'Você não trocou de medicação baseado num post de rede social.'
  ],
  signs_en = array[
    'You can tell the real, solid news from Twitter hype.',
    $$You know when it's worth talking to your doctor (and when to wait).$$,
    $$You didn't switch medication based on a social media post.$$
  ],
  tracking_pt = 'Esse news fica em Aprender, sob Nutrição (Saúde). A maior implicação prática é em como pessoas em GLP-1 preservam o resultado — conecta com tasks de "registrar refeições" e o explainer de Nutrição.',
  tracking_en = 'This news lives in Learn under Nutrition (Health). The biggest practical implication is how GLP-1 users keep the result — connects with "log meals" tasks and the Nutrition explainer.',
  reasoning_log = $rlog${
    "template_type": "news",
    "template_version": 2,
    "voice_principles_applied": [
      "Stat block top removed — number woven into hook",
      "Compare myth/reality card removed — written as prose",
      "Info callout card removed — caveat as paragraph",
      "Body now 0 visual cards (only :::source at close)",
      "Reading time reduced 3 -> 4 to reflect honest length"
    ],
    "edits_from_prior_version": [
      "Removed: stat card, compare card, callout (info), list-icon",
      "Section structure preserved (O ensaio / O que muda / O que continua igual) but converted to prose flow"
    ]
  }$rlog$::jsonb
where slug = 'news-oral-glp1-2026-05';

-- ============================================================================
-- 5. NEWS LONELINESS-MEMORY — prose-led rewrite
-- ============================================================================

update public.learning_material set
  reading_minutes = 4,
  body_pt = $body$Desde 2023, virou senso comum dizer que solidão é "tão ruim quanto fumar 15 cigarros por dia" e que acelera demência. Foi a forma como o Surgeon General dos EUA enquadrou o tema na recomendação daquele ano, e a frase pegou. Um estudo longitudinal europeu publicado em abril de 2026 traz uma correção honesta: pessoas solitárias **começam** com pior memória, mas a memória delas **não declina mais rápido** ao longo dos anos.

## O estudo

Análise da coorte SHARE — Survey of Health, Ageing and Retirement in Europe — com 10.217 adultos mais velhos acompanhados por 7 anos. Publicado em *Aging & Mental Health* em abril de 2026, por pesquisadores da Universidad del Rosario, Karolinska e Universitat de València.

Os pesquisadores compararam dois grupos: pessoas que se descreviam como socialmente isoladas, e pessoas que se descreviam como conectadas. Mediram memória em vários pontos ao longo dos 7 anos. O resultado:

Solitários começam com performance de memória pior — isso confirma associação no presente. Mas a velocidade do declínio cognitivo ao longo dos anos é **estatisticamente indistinguível** entre os dois grupos. Solidão está ligada a memória mais baixa **agora**, não a uma curva mais íngreme de decadência **depois**.

## Por que isso importa pro leitor

A narrativa de 2023 enquadrava solidão como bomba-relógio: cuidar dos vínculos hoje pra evitar Alzheimer em 20 anos. Esse estudo enfraquece esse argumento específico. Mas, paradoxalmente, **fortalece** outro: investir em conexão social compensa pelo presente — atenção, encoding (a capacidade de gravar novas memórias), recall na semana que vem — não como hedge contra demência futura.

Isso é, na real, um argumento mais forte. "Conexão social é bom pro seu cérebro hoje" é palpável. "Conexão social pode reduzir risco de Alzheimer em 2046" é abstrato.

O que continua verdade, importante registrar: solidão crônica continua ligada a depressão, doença cardiovascular e mortalidade geral. A WHO em 2025 atribuiu cerca de 871 mil mortes por ano globalmente à fraca conexão social. Esse estudo só corrige uma afirmação específica — a velocidade do declínio de memória — não a preocupação maior de saúde pública.

E tem uma limitação honesta que os próprios autores reconhecem: o estudo é observacional, não experimental. Causalidade reversa é possível — problemas cognitivos sutis podem fazer pessoas se retraírem socialmente, o que apareceria nos dados como "solidão piora memória." Não dá pra excluir essa direção da seta.

## O que fazer com isso

Se você tinha decidido investir em vínculos por medo de demência: redirecione o motivo, não a ação. Continue investindo, mas pelo benefício imediato. Atenção melhor, recall mais rápido, humor mais estável — esses chegam na semana que vem, não em 2046.

Práticas que sobrevivem ao escrutínio: um contato semanal consistente com alguém que você gosta vale mais que cinco conexões dispersas. Ligar (não mandar mensagem) prediz melhor manutenção de vínculo. Marcar com antecedência (recorrente) sobrevive melhor que "vamos marcar."

:::source[Venegas-Sanabria LC et al., 2026 · *Aging & Mental Health* · SHARE cohort n=10.217](https://doi.org/10.1080/13607863.2026.2624569)$body$,
  body_en = $body$Since 2023, it's become common wisdom to say loneliness is "as bad as smoking 15 cigarettes a day" and that it accelerates dementia. That's how the US Surgeon General framed the topic in that year's recommendation, and the phrase stuck. A European longitudinal study published in April 2026 brings an honest correction: lonely people **start** with worse memory, but their memory **doesn't decline any faster** over the years.

## The study

Analysis of the SHARE cohort — Survey of Health, Ageing and Retirement in Europe — with 10,217 older adults followed for 7 years. Published in *Aging & Mental Health* in April 2026, by researchers from Universidad del Rosario, Karolinska Institute, and Universitat de València.

The researchers compared two groups: people who described themselves as socially isolated, and people who described themselves as connected. They measured memory at multiple points across the 7 years. The result:

Lonely people start with worse memory performance — that confirms association in the present. But the speed of cognitive decline across the years is **statistically indistinguishable** between the two groups. Loneliness is tied to lower memory **now**, not to a steeper curve of decay **later**.

## Why this matters for the reader

The 2023 narrative framed loneliness as a time bomb: take care of bonds today to avoid Alzheimer's in 20 years. This study weakens that specific argument. But, paradoxically, it **strengthens** another one: investing in social connection pays off in the present — attention, encoding (the ability to store new memories), recall next week — not as a hedge against future dementia.

That's actually a stronger argument. "Social connection is good for your brain today" is tangible. "Social connection may reduce Alzheimer's risk in 2046" is abstract.

What stays true, important to register: chronic loneliness is still tied to depression, cardiovascular disease, and overall mortality. WHO in 2025 attributed roughly 871,000 deaths per year globally to weak social connection. This study only corrects one specific claim — the speed of memory decline — not the broader public health concern.

And there's an honest limitation the authors themselves acknowledge: the study is observational, not experimental. Reverse causality is possible — subtle cognitive issues might make people withdraw socially, which would show up in the data as "loneliness worsens memory." That direction of the arrow can't be ruled out.

## What to do with this

If you'd decided to invest in bonds out of fear of dementia: redirect the reason, not the action. Keep investing, but for the immediate benefit. Better attention, faster recall, more stable mood — those arrive next week, not in 2046.

Practices that survive scrutiny: one consistent weekly contact with someone you actually like is worth more than five scattered connections. Calling (not texting) predicts better relationship maintenance. Scheduling ahead (recurring) survives better than "let's get together sometime."

:::source[Venegas-Sanabria LC et al., 2026 · *Aging & Mental Health* · SHARE cohort n=10,217](https://doi.org/10.1080/13607863.2026.2624569)$body$,
  takeaways_pt = array[
    'Solidão piora memória atual — não acelera o declínio futuro (estudo SHARE, n=10k, 2026).',
    'Investir em vínculos vale pelo presente (atenção, recall hoje), não como seguro contra Alzheimer em 2046.',
    'Solidão crônica continua ligada a depressão, doença cardiovascular e mortalidade — esse estudo só corrige uma afirmação específica.'
  ],
  takeaways_en = array[
    'Loneliness hurts present memory — doesn''t accelerate future decline (SHARE study, n=10k, 2026).',
    $$Investing in bonds pays off in the present (attention, recall today), not as Alzheimer's insurance in 2046.$$,
    'Chronic loneliness is still tied to depression, cardiovascular disease, and mortality — this study only corrects one specific claim.'
  ],
  signs_pt = array[
    'Você sabe que solidão hoje afeta seu cérebro hoje (atenção, recall).',
    'Você prioriza qualidade > frequência de contato.',
    'Você não usa esse estudo pra desvalorizar a importância de vínculos.'
  ],
  signs_en = array[
    'You know loneliness today affects your brain today (attention, recall).',
    'You prioritize quality > frequency of contact.',
    $$You don't use this study to dismiss the importance of bonds.$$
  ],
  tracking_pt = 'Esse news fica em Aprender, sob Amigos e Família (Vínculos). Conecta com tasks de "ligar pra alguém" e tracking de regularidade de contato social.',
  tracking_en = 'This news lives in Learn under Friends & Family (Bonds). Connects with "call someone" tasks and tracking of social contact regularity.',
  reasoning_log = $rlog${
    "template_type": "news",
    "template_version": 2,
    "voice_principles_applied": [
      "Stat block top removed — '0' diff woven into hook prose",
      "Compare card removed — written as prose contrast",
      "list-icon practices card converted to closing prose paragraph",
      "encoding defined inline as 'capacidade de gravar novas memórias'",
      "Body now 0 visual cards (only :::source at close)",
      "Reading time bumped 3 -> 4 to reflect honest length"
    ],
    "edits_from_prior_version": [
      "Removed: stat card, compare card, callout (info), list-icon",
      "Reframe sharpened: 'fortalece outro argumento' instead of just 'calibração'"
    ]
  }$rlog$::jsonb
where slug = 'news-loneliness-memory-2026-04';

commit;
