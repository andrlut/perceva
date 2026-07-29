-- migration: 20260729000140_learning_text_glossary-sleep.sql
-- purpose: Big-release expand — glossary-sleep (explainer, health).
-- affected: learning_material (upsert by slug) + learning_material_sub.
--           snapshot_material_revision trigger snapshots prior state + bumps version.
-- released_at: kept (unchanged).
begin;
set local app.edited_by = 'big-release-20260729';
set local app.edit_summary = 'expand for big-release-20260729';

with up as (
  insert into public.learning_material
    (slug, type, dimension_id, topic, reading_minutes,
     title_pt, title_en, summary_pt, summary_en,
     body_pt, body_en,
     takeaways_pt, takeaways_en,
     tracking_pt, tracking_en,
     source_url, source_label_pt, source_label_en,
     reasoning_log, released_at)
  values (
    'glossary-sleep', 'explainer', 'health', $topic$glossary-sleep$topic$, 6,
    $title_pt$Sono — a base de tudo$title_pt$,
    $title_en$Sleep — the foundation under everything$title_en$,
    $summary_pt$A única atividade do dia em que não fazer nada é fazer tudo.$summary_pt$,
    $summary_en$The one activity where doing nothing is doing everything.$summary_en$,
    $body_pt$Existe uma diferença entre dormir mal e dormir pouco — e a segunda é a que você não sente acontecer. Perder uma hora de sono numa noite não te derruba na quarta-feira. Mas duas semanas dormindo só 6 horas por noite derrubam sua cabeça pro mesmo nível de quem passou a noite inteira em claro. E o pior: você jura que está bem.

Isso saiu de um experimento clássico de 2003. Van Dongen trancou adultos saudáveis num laboratório e restringiu o sono a 6 horas por 14 noites seguidas. No fim, o desempenho em atenção e memória de trabalho tinha caído tanto quanto o de quem ficou uma ou duas noites sem dormir nada. Só que a sensação de sono estabilizou cedo — os voluntários se achavam adaptados enquanto a medida objetiva despencava.

Essa é a armadilha do sono: o déficit é invisível por dentro. Então o passo útil é entender o que o sono realmente é, o que ele te cobra e o mínimo que resolve.

## 1. Sono não é uma coisa só

A maioria pensa em sono como um número de horas. Mas três coisas pesam ao mesmo tempo, e furar numa derruba as outras duas.

A primeira é a **quantidade**. O intervalo recomendado é de 7 a 9 horas, e o 7 é um chão firme — não é palpite popular. Em 2015, um painel de 15 especialistas da Academia Americana de Medicina do Sono cravou por consenso: adultos devem dormir 7 horas ou mais, de forma regular, pra ter saúde ideal. Abaixo disso, o risco metabólico, cardiovascular e imune sobe.

A segunda é a **regularidade** — e é o pedaço mais subestimado. Não basta somar horas; importa deitar e acordar perto do mesmo horário todo dia, fim de semana incluído. Um estudo de 2024 acompanhou quase 61 mil adultos do UK Biobank com sensores no pulso e achou algo que surpreende: quem tinha os horários mais regulares morreu de 20% a 48% menos no período — um efeito maior do que a duração sozinha entregou na mesma amostra. Em português claro: 6,5 horas sempre no mesmo horário tende a ganhar de 8 horas jogadas a esmo.

A terceira é a **qualidade**, e aqui entra o que acontece por dentro. Uma noite não é um bloco só — ela roda em ciclos de cerca de 90 minutos, repetidos de 4 a 6 vezes. Cada ciclo passa pelo sono NREM (as fases leves e o sono profundo, quando o corpo repara tecido) e desemboca no sono REM (quando você sonha e a memória se consolida). Sono fragmentado por barulho, tela, álcool ou apneia quebra esses ciclos: o tempo na cama existe, mas o trabalho biológico não acontece direito.

O erro comum é acertar uma das três e ignorar as outras. Oito horas bagunçadas ou rasas não cobrem o piso. Sete horas regulares e profundas cobrem.

## 2. O que duas noites já cobram

A parte que mais assusta não é o cansaço — é a velocidade com que o corpo reage. Bastam duas noites de 4 horas pra bagunçar os hormônios que controlam a fome. Num experimento com homens jovens saudáveis, a grelina (o hormônio que dá fome) subiu 28% e a leptina (o que dá saciedade) caiu 18%. O resultado prático: você sente fome mesmo tendo comido o suficiente, e a vontade especificamente de comida rica em carboidrato salta de 33% a 45%. Você sente isso no dia seguinte a uma noite ruim: a fome chega estranha, fora de hora, puxando pão e doce. Não é falta de disciplina — é química desregulada.

Em paralelo, algo acontece dentro do crânio. Durante o sono, o cérebro ativa o sistema glinfático — uma espécie de drenagem que ajuda a lavar resíduos das células, incluindo a β-amilóide, a proteína ligada ao Alzheimer. Em camundongos, o espaço entre os neurônios se abre mais de 60% durante o sono, e a limpeza acelera. Um freio honesto: a evidência forte é em ratos, a extrapolação pra humanos é indireta, e um estudo de 2024 — também em camundongos, com outro método — encontrou o oposto, limpeza reduzida no sono. Trate como hipótese provável, não como fato fechado.

O que está totalmente fechado é o custo agudo de ficar acordado. Dawson e Reid mostraram, na Nature em 1997, que 17 horas sem dormir produzem a mesma queda de reflexo e julgamento que 0,05% de álcool no sangue. Com 24 horas em claro, chega a 0,10% — acima do limite pra dirigir na maioria dos países. Dirigir com sono não é parecido com dirigir bêbado; em desempenho, é a mesma coisa.

## 3. A receita mínima

Você não precisa otimizar tudo. Quatro ajustes carregam quase todo o resultado:

:::list-icon
alarm | Deite e acorde no mesmo horário todo dia. A regularidade rende mais que 30 minutos extras na cama.
snow | Deixe o quarto entre 16 e 19°C e escuro. O sono começa com uma queda de ~1°C na temperatura do corpo; quarto quente trava isso. Blackout vale ouro.
cafe | Corte a cafeína 8 horas antes de deitar. A meia-vida é de 5 a 6 horas — 400mg às 16h ainda cortam mais de uma hora do seu sono.
wine | Nada de álcool nas 3 horas antes de dormir. Ele te faz apagar rápido e depois destrói o REM da segunda metade da noite.
:::

Sobre os wearables — anel, relógio, app de celular: eles acertam muito bem se você está dormindo ou acordado, com sensibilidade acima de 90%. Mas erram nas fases. Mesmo o melhor aparelho de consumo já testado, o Oura Gen3, concorda com o exame de laboratório só cerca de 79% das vezes na divisão entre leve, profundo e REM. Use as horas totais como dado real; trate a barrinha de "8% de sono profundo" como estimativa grosseira, não diagnóstico.

E se você só tem energia pra mudar uma coisa, mude o horário. Não custa dinheiro nem tempo extra na cama — custa uma decisão. E, entre tudo que dá pra ajustar, é o que move mais o ponteiro.

:::source[Windred et al., 2024 · Sleep · n=60.977 (UK Biobank)](https://academic.oup.com/sleep/article/47/1/zsad253/7280269)$body_pt$,
    $body_en$There's a difference between sleeping badly and sleeping too little — and the second is the one you can't feel happening. Losing an hour one night won't wreck your Wednesday. But two weeks at six hours a night drop your head to the level of someone who pulled an all-nighter. The catch: you'll swear you're fine.

That came out of a 2003 lab study. Van Dongen kept healthy adults in a controlled setting and capped their sleep at six hours for 14 straight nights. By the end, their attention and working memory had fallen as far as people who'd gone one or two full nights with no sleep at all. But their sense of sleepiness leveled off early — the volunteers felt adapted while the objective numbers kept sliding.

That's the trap with sleep: the deficit is invisible from the inside. So start by knowing what sleep actually is, what it charges you, and the minimum that fixes it.

## 1. Sleep isn't one thing

Most people picture sleep as a number of hours. But three things matter at once, and falling short on one drags the other two down.

The first is **quantity**. The recommended range is 7 to 9 hours, and 7 is a firm floor — not folklore. In 2015, a 15-expert panel from the American Academy of Sleep Medicine settled it by consensus: adults should sleep 7 or more hours per night, on a regular basis, for optimal health. Below that, metabolic, cardiovascular, and immune risk climbs.

The second is **regularity**, and it's the most underrated piece. Total hours aren't the whole game; going to bed and waking near the same time every day — weekends included — is. A 2024 study tracked nearly 61,000 UK Biobank adults with wrist sensors and found something striking: the most regular sleepers died 20 to 48% less over the follow-up — a bigger effect than duration alone produced in the same group. In plain terms, 6.5 hours on a steady clock tends to beat 8 hours scattered all over the place.

The third is **quality**, and this is where the inside story lives. A night isn't one block — it runs in cycles of about 90 minutes, repeating 4 to 6 times. Each cycle moves through NREM sleep (the light stages and deep sleep, when the body repairs tissue) and ends in REM sleep (when you dream and memory gets consolidated). Sleep broken up by noise, screens, alcohol, or apnea shatters those cycles: the time in bed is real, but the biological work doesn't land.

The common mistake is nailing one of the three and ignoring the rest. Eight scattered or shallow hours don't cover the floor. Seven regular, deep ones do.

## 2. What two nights already cost

The scary part isn't the tiredness — it's how fast the body reacts. Just two nights at four hours are enough to scramble the hormones that run hunger. In an experiment with healthy young men, ghrelin (the hormone that makes you hungry) rose 28% and leptin (the one that signals fullness) dropped 18%. The practical result: you feel hungry even after eating enough, and the craving specifically for high-carb food jumps 33 to 45%. You feel it the day after a bad night — hunger shows up odd and off-schedule, pulling you toward bread and sweets. It's not weak willpower; it's biochemistry knocked out of tune.

In parallel, something happens inside the skull. During sleep, the brain switches on the glymphatic system — a kind of drainage that helps rinse waste out of the tissue, including β-amyloid, the protein tied to Alzheimer's. In mice, the space between neurons opens by more than 60% during sleep, and clearance speeds up. Here's the honest brake: the strong evidence is in mice, the jump to humans is indirect, and a 2024 study — also in mice, with a different method — found the opposite, reduced clearance during sleep. Treat it as a likely hypothesis, not a closed fact.

What is closed is the acute cost of staying awake. Dawson and Reid showed, in Nature in 1997, that 17 hours without sleep produce the same drop in reflex and judgment as 0.05% blood alcohol. At 24 hours awake, it hits 0.10% — over the legal driving limit in most countries. Drowsy driving isn't like drunk driving; in performance, it is drunk driving.

## 3. The minimum recipe

You don't have to optimize everything. Four adjustments carry almost all the payoff:

:::list-icon
alarm | Go to bed and wake up at the same time every day. Regularity buys more than 30 extra minutes in bed.
snow | Keep the bedroom at 16-19°C and dark. Sleep starts with a ~1°C drop in body temperature; a warm room blocks it. Blackout is worth gold.
cafe | Cut caffeine 8 hours before bed. Its half-life is 5 to 6 hours — 400mg at 4pm still shaves over an hour off your sleep.
wine | No alcohol in the 3 hours before bed. It knocks you out fast, then destroys REM in the second half of the night.
:::

About wearables — ring, watch, phone app: they're very good at telling asleep from awake, with sensitivity above 90%. But they miss on stages. Even the best consumer device tested, the Oura Gen3, agrees with a lab sleep study only about 79% of the time on the split between light, deep, and REM. Use total hours as real data; treat the "8% deep sleep" bar as a rough estimate, not a diagnosis.

If you've only got the energy to change one thing, change your schedule. It costs no money and no extra time in bed — it costs one decision. And of everything you can adjust, it moves the needle the most.

:::source[Windred et al., 2024 · Sleep · n=60,977 (UK Biobank)](https://academic.oup.com/sleep/article/47/1/zsad253/7280269)$body_en$,
    array[$tkpt0$14 noites de 6h de sono derrubam sua cabeça como uma noite em claro — e você jura que está bem.$tkpt0$, $tkpt1$A regularidade do horário prediz mortalidade melhor que a duração total (Windred, 2024, n=61 mil).$tkpt1$, $tkpt2$Se for mexer em uma coisa só, comece pelo horário fixo: custo zero, maior efeito.$tkpt2$]::text[],
    array[$tken0$14 nights of 6h sleep wreck your head like a full all-nighter — and you swear you're fine.$tken0$, $tken1$Sleep-timing regularity predicts mortality better than total duration (Windred, 2024, n=61k).$tken1$, $tken2$If you change one thing, start with a fixed schedule: zero cost, biggest effect.$tken2$]::text[],
    $trk_pt$Sono é uma sub de Saúde. Suas tarefas de "dormir no mesmo horário", "sem tela depois das X" ou "cafeína só de manhã" alimentam essa sub. Quando ela cai, o resto tende a cair junto em poucas semanas — dá pra ver no seu hex de Dedicação.$trk_pt$,
    $trk_en$Sleep is a sub of Health. Your tasks for "same bedtime", "no screens after X", or "caffeine mornings only" feed this sub. When it drops, the rest tends to drop with it within weeks — you can watch it on your Dedication hex.$trk_en$,
    $src_url$https://academic.oup.com/sleep/article/47/1/zsad253/7280269$src_url$,
    $src_pt$Windred et al., 2024 · Sleep 47(1):zsad253 · n=60.977 (UK Biobank)$src_pt$,
    $src_en$Windred et al., 2024 · Sleep 47(1):zsad253 · n=60,977 (UK Biobank)$src_en$,
    $rlog${"template_type":"explainer","main_points":[{"id":"1_three_dimensions","what_pt":"Sono são três coisas ao mesmo tempo: quantidade (7-9h), regularidade (mesmo horário) e qualidade (ciclos NREM/REM de ~90min intactos).","what_en":"Sleep is three things at once: quantity (7-9h), regularity (same schedule), and quality (intact ~90-min NREM/REM cycles).","why_pt":"Windred 2024 (n=61 mil, UK Biobank) mostra que a regularidade prediz mortalidade melhor que a duração — o pedaço mais ignorado é o que mais pesa.","why_en":"Windred 2024 (n=61k, UK Biobank) shows regularity predicts mortality better than duration — the most ignored piece is the one that weighs most.","how_to_know_pt":"Você deita e acorda no mesmo horário todo dia, fim de semana incluído? Se não, é aí que está o furo."},{"id":"2_two_nights_cost","what_pt":"Duas noites de 4h já sobem a grelina 28% e derrubam a leptina 18%; 17h acordado equivale a 0,05% de álcool no sangue.","what_en":"Two nights of 4h already raise ghrelin 28% and drop leptin 18%; 17h awake equals 0.05% blood alcohol.","why_pt":"O custo do sono curto é imediato e mensurável, não um risco distante — e o glinfático/Alzheimer segue em disputa (só camundongos, com resultado 2024 oposto).","why_en":"The cost of short sleep is immediate and measurable, not a distant risk — and the glymphatic/Alzheimer link stays disputed (mice only, with an opposite 2024 result).","how_to_know_pt":"Fome estranha e fora de hora no dia seguinte a uma noite ruim, puxando pão e doce."},{"id":"3_minimum_recipe","what_pt":"Quatro ajustes: horário fixo, quarto 16-19°C e escuro, cafeína cortada 8h antes, álcool nada 3h antes.","what_en":"Four adjustments: fixed schedule, room 16-19°C and dark, caffeine cut 8h before, no alcohol 3h before.","why_pt":"Esses quatro carregam quase todo o resultado; wearables medem bem horas totais, mal as fases (Oura Gen3 ~79%).","why_en":"These four carry almost all the payoff; wearables track total hours well but stages poorly (Oura Gen3 ~79%).","how_to_know_pt":"Checklist semanal: quantos dos quatro você bateu esta semana?"}]}$rlog$::jsonb, now()
  )
  on conflict (slug) do update set
    type = excluded.type,
    dimension_id = excluded.dimension_id,
    topic = excluded.topic,
    reading_minutes = excluded.reading_minutes,
    title_pt = excluded.title_pt, title_en = excluded.title_en,
    summary_pt = excluded.summary_pt, summary_en = excluded.summary_en,
    body_pt = excluded.body_pt, body_en = excluded.body_en,
    takeaways_pt = excluded.takeaways_pt, takeaways_en = excluded.takeaways_en,
    tracking_pt = excluded.tracking_pt, tracking_en = excluded.tracking_en,
    source_url = excluded.source_url,
    source_label_pt = excluded.source_label_pt, source_label_en = excluded.source_label_en,
    reasoning_log = excluded.reasoning_log,
    released_at = learning_material.released_at
  returning id
)
  insert into public.learning_material_sub (material_id, sub_id)
  select id, 'sleep' from up on conflict (material_id, sub_id) do nothing;

commit;
