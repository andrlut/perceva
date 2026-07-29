-- migration: 20260729000250_learning_text_summary-why-we-sleep.sql
-- purpose: Big-release expand — summary-why-we-sleep (summary, health).
-- affected: learning_material (upsert by slug) + learning_material_sub.
--           snapshot_material_revision trigger snapshots prior state + bumps version.
-- released_at: kept (unchanged).
begin;
set local app.edited_by = 'big-release-20260729';
set local app.edit_summary = 'expand for big-release-20260729';

insert into public.learning_material
  (slug, type, dimension_id, topic, reading_minutes,
   title_pt, title_en, summary_pt, summary_en,
   body_pt, body_en,
   takeaways_pt, takeaways_en,
   tracking_pt, tracking_en,
   source_url, source_label_pt, source_label_en,
   reasoning_log, released_at)
values (
  'summary-why-we-sleep', 'summary', 'health', $topic$summary-why-we-sleep$topic$, 7,
  $title_pt$Why We Sleep — com lápis cético na mão$title_pt$,
  $title_en$Why We Sleep — read with a skeptic's pencil$title_en$,
  $summary_pt$O livro mais influente sobre sono — e o mais auditado da última década.$summary_pt$,
  $summary_en$The most influential sleep book — and the most audited of the past decade.$summary_en$,
  $body_pt$Em 2017, um neurocientista de Berkeley chamado Matthew Walker publicou um livro que mudou como o mundo fala de sono. *Why We Sleep* vendeu milhões, virou leitura obrigatória em podcast de saúde e entrou até em debate de política pública. A tese era simples e assustadora: a sociedade moderna vive uma epidemia silenciosa de privação de sono, e a conta chega em forma de doença e morte precoce.

A frase que abre o livro virou meme científico:

:::quote{author="Matthew Walker", source="Why We Sleep, 2017"}
Quanto mais curto o seu sono, mais curta a sua vida.
:::

Funcionou até demais. E aí veio a fatura. Nos anos seguintes, o livro atraiu a auditoria mais implacável que um best-seller de ciência popular já sofreu. Entender as duas metades — o que resiste e o que desmorona — te dá algo mais útil que o próprio livro: um filtro pra tudo que você vai ler sobre sono daqui pra frente.

## 1. O que Walker afirma

Walker começa com uma pergunta boa. Por que sono existe? Você passa um terço da vida deitado — sem comer, sem se reproduzir, sem se defender — e mesmo assim a evolução manteve o sono em toda espécie animal já estudada. A resposta dele: sono é manutenção biológica não-negociável, cara demais pra evolução ter largado.

Ele divide o sono em duas máquinas que trabalham em dupla. NREM — o sono profundo, sem movimento rápido dos olhos — é quando o cérebro arquiva a memória do dia e liga o sistema glinfático, uma espécie de faxina noturna que alarga os espaços entre os neurônios e escoa o lixo metabólico acumulado. REM — a fase dos sonhos, com movimento rápido dos olhos — processa emoção, fixa aprendizado motor e alimenta a criatividade. Falta uma, estraga a outra.

Em cima dessa fundação sólida, Walker dá saltos grandes. Dormir menos de 7 horas dobraria o risco de câncer. Seria causa primária de Alzheimer, por falha em limpar a β-amilóide — a proteína pegajosa que se acumula no cérebro de quem tem a doença; só que o estudo da "faxina" que embasa isso foi feito em camundongos, e ninguém mostrou o mesmo em humanos. A tal epidemia teria sido reconhecida pela Organização Mundial da Saúde. E adultos precisariam de 8 horas cravadas, não 7.

A direção geral está certa. Sono importa muito. As pessoas dormem menos do que deveriam. O problema mora nos números específicos — e é neles que o livro racha.

## 2. A auditoria que não sai de cima

Em 2019, um pesquisador independente chamado Alexey Guzey publicou uma auditoria linha a linha do livro, com citações. O ensaio se chama, sem rodeio, "Why We Sleep está cheio de erros científicos e factuais". A crítica pegou porque era específica e verificável. Os golpes mais duros:

A epidemia de sono "declarada pela OMS" não existe. Guzey rastreou a nota de rodapé do Walker até um documentário da *National Geographic* — que nem cita a OMS. A origem provável é uma página do CDC americano que a própria agência já tinha suavizado de "epidemia" pra "problema" dois anos antes do livro sair.

O câncer não dobra. Uma meta-análise de 2018 — estudo que junta e reprocessa dezenas de pesquisas anteriores — reuniu mais de 1,5 milhão de pessoas e não achou associação significativa entre duração do sono e câncer. A frase de choque do livro simplesmente não para em pé.

A mortalidade não é uma ladeira reta pra baixo. O estudo de Kripke, de 2002, acompanhou 1,1 milhão de adultos e encontrou a menor mortalidade em torno de 7 horas — com risco maior tanto abaixo de 6h quanto acima de 8h. É uma curva em U, não a rampa descendente que o livro desenha. (E, como quase toda pesquisa de sono, é observacional: mostra correlação, não prova que sono curto causa a morte.)

Um gráfico foi editado. No capítulo 6, Walker reproduz um gráfico de lesões versus sono e apaga a barra de 5 horas — justamente a que contradiz a narrativa dele. O estatístico Andrew Gelman, da Columbia, dedicou vários posts a esse gráfico, num deles perguntando se aquilo era "uma prova cabal" de manipulação de dados.

Um paper foi retratado. Em 2019, um artigo de Walker na revista *Neuron* foi retirado "a pedido do autor" por se sobrepor demais a um artigo dele na *Lancet*. As duas versões repetiam que residentes em plantões de 16 horas cometem "400 a 600% menos erros de diagnóstico" — uma redução matematicamente impossível: você não corta nada em mais de 100%.

A UC Berkeley recebeu uma queixa formal, mandou revisar e fechou o caso sem apontar má conduta — um revisor externo concluiu que a barra apagada "não alterou os achados de forma apreciável". Walker prometeu corrigir os erros numa edição futura. Uma errata abrangente nunca saiu.

## 3. O que sobrevive — e como ler o resto

Aqui está a boa notícia: o esqueleto do que Walker diz é mainstream e bem sustentado. Sono é manutenção biológica de verdade. O que muda é o exagero em volta.

Comece pelo número. O consenso clínico não é "8 horas cravadas". A declaração conjunta da Academia Americana de Medicina do Sono e da Sleep Research Society, de 2015, recomenda 7 horas ou mais por noite pra adultos de 18 a 60 anos — e dormir menos que isso de forma crônica aparece ligado a ganho de peso, diabetes, hipertensão e depressão no conjunto dos estudos. Sete-ou-mais, não oito-ou-fracasso. Parece um detalhe, mas muda tudo pra quem funciona bem com 7h e passava noites ansioso achando que estava falhando.

E cuidado com um efeito colateral do próprio livro. Clínicos do sono relatam pacientes que desenvolveram insônia depois de ler *Why We Sleep* com medo. Tem até nome: ortossonia — a obsessão em dormir "perfeitamente", muitas vezes alimentada por dado de wearable, que acaba estragando justo o sono que tenta proteger. Ironia amarga: ler o livro apavorado pode te fazer dormir pior.

Então, o que fazer com a parte que resiste? Isto — que é consenso entre sociedades médicas, não invenção do Walker:

:::list-icon
bed | Mire 7 horas ou mais, sempre no mesmo horário — regularidade pesa mais que a meta redonda.
moon | Deixe o quarto escuro e fresco, e corte telas na última hora antes de deitar.
cafe | Corte a cafeína depois do meio-dia: ela fica no corpo por mais de 6 horas.
wine | Evite álcool perto de dormir — ele te apaga, mas fragmenta o REM.
happy | Se ler sobre sono te deixar ansioso, pare. Obsessão nunca melhorou noite nenhuma.
:::

Ler ou não? Sim, com o lápis cético na mão. *Why We Sleep* segue sendo a porta de entrada mais acessível pra levar sono a sério, e a direção que ele aponta é a certa. Só trate cada estatística dramática como "provavelmente certa no rumo, suspeita no número". O valor de estudar esse livro não está em decorar os dados dele — está em aprender a diferença entre uma tese sólida e os números de choque que a vestem. Depois disso, nenhuma manchete sobre sono te pega desprevenido de novo.

:::source[Walker, Why We Sleep · Scribner 2017 · Auditoria: Guzey 2019](https://guzey.com/books/why-we-sleep/)$body_pt$,
  $body_en$In 2017, a Berkeley neuroscientist named Matthew Walker published a book that changed how the world talks about sleep. *Why We Sleep* sold millions, became required listening on every health podcast, and worked its way into public-policy debates. The thesis was simple and frightening: modern society is living through a silent epidemic of sleep deprivation, and the bill comes due as disease and early death.

The line that opens the book became a scientific meme:

:::quote{author="Matthew Walker", source="Why We Sleep, 2017"}
The shorter your sleep, the shorter your life.
:::

It worked almost too well. Then came the reckoning. Over the next few years the book drew the most relentless audit any popular-science bestseller has faced. Understanding both halves — what holds up and what collapses — hands you something more useful than the book itself: a filter for everything you'll ever read about sleep.

## 1. What Walker claims

Walker opens with a good question. Why does sleep exist? You spend a third of your life lying down — not eating, not reproducing, not defending yourself — and yet evolution kept sleep in every animal species ever studied. His answer: sleep is non-negotiable biological maintenance, too expensive for evolution to have dropped.

He splits sleep into two machines that work as a pair. NREM — deep, non-rapid-eye-movement sleep — is when the brain files away the day's memories and switches on the glymphatic system, a kind of overnight cleaning crew that widens the gaps between neurons and flushes out accumulated metabolic waste. REM — the dreaming stage, with rapid eye movement — processes emotion, locks in motor learning, and feeds creativity. Lose one and you damage the other.

On top of that solid foundation, Walker takes big leaps. Sleeping under 7 hours supposedly doubles your cancer risk. It's a primary cause of Alzheimer's, he argues, through a failure to clear β-amyloid — the sticky protein that builds up in the brains of people with the disease; except the "cleaning" study behind that claim was done in mice, and no one has shown the same in humans. The epidemic was supposedly recognized by the World Health Organization. And adults supposedly need a hard 8 hours, not 7.

The general direction is right. Sleep matters enormously. People sleep less than they should. The trouble starts with the specific numbers — and that's where the book cracks.

## 2. The audit that won't let go

In 2019 an independent researcher named Alexey Guzey published a line-by-line audit of the book, fully cited. The essay is bluntly titled "Why We Sleep Is Riddled with Scientific and Factual Errors." It landed because it was specific and checkable. The hardest hits:

The "WHO-declared" sleep epidemic doesn't exist. Guzey traced Walker's footnote to a *National Geographic* documentary — which never mentions the WHO. The likely real source is a US CDC web page that the agency itself had already softened from "epidemic" to "problem" two years before the book came out.

Cancer doesn't double. A 2018 meta-analysis — a study that pools and reprocesses dozens of earlier ones — gathered over 1.5 million people and found no significant link between sleep duration and cancer. The book's shock line simply doesn't stand.

Mortality isn't a straight slope down. Kripke's 2002 study followed 1.1 million adults and found the lowest mortality around 7 hours — with higher risk both below 6h and above 8h. It's a U-shaped curve, not the downhill ramp the book draws. (And, like almost all sleep research, it's observational: it shows correlation, not proof that short sleep causes the deaths.)

A graph was edited. In chapter 6, Walker reproduces an injuries-versus-sleep chart and deletes the 5-hour bar — the very one that contradicts his story. Columbia statistician Andrew Gelman devoted several posts to that chart, one of them asking whether it was "a smoking gun" for data manipulation.

A paper was retracted. In 2019 a Walker article in *Neuron* was pulled "at the author's request" for overlapping too heavily with a paper of his in *The Lancet*. Both versions repeated that residents on 16-hour shifts make "400 to 600 percent fewer diagnostic errors" — a reduction that's mathematically impossible: you can't cut anything by more than 100%.

UC Berkeley got a formal complaint, ordered a review, and closed it with no finding of misconduct — an outside reviewer concluded the deleted bar "did not alter the findings in an appreciable way." Walker said he'd fix the errors in a future edition. A comprehensive erratum never appeared.

## 3. What survives — and how to read the rest

Here's the good news: the skeleton of what Walker says is mainstream and well-supported. Sleep is real biological maintenance. What changes is the hype wrapped around it.

Start with the number. The clinical consensus is not "a hard 8 hours." The 2015 joint statement from the American Academy of Sleep Medicine and the Sleep Research Society recommends 7 or more hours a night for adults aged 18 to 60 — and chronically sleeping less than that shows up linked to weight gain, diabetes, hypertension and depression across the literature. Seven-or-more, not eight-or-fail. It sounds like a detail, but it changes everything for anyone who feels fine on 7 hours and spent nights anxious about falling short.

And watch out for a side effect of the book itself. Sleep clinicians report patients who developed insomnia after reading *Why We Sleep* scared. There's even a name for it: orthosomnia — an obsession with sleeping "perfectly," often fueled by wearable data, that ends up wrecking the very sleep it's trying to protect. Bitter irony: reading the book in fear can make you sleep worse.

So what do you do with the part that holds up? This — genuinely consensus among medical societies, not a Walker invention:

:::list-icon
bed | Aim for 7 hours or more, at the same time each night — regularity beats the round target.
moon | Keep the room dark and cool, and cut screens in the last hour before bed.
cafe | Stop caffeine after midday: it lingers in your body for more than 6 hours.
wine | Skip alcohol near bedtime — it knocks you out but shreds your REM.
happy | If reading about sleep makes you anxious, stop. Obsession never improved a single night.
:::

So, read it or not? Yes — with a skeptic's pencil in hand. *Why We Sleep* is still the most accessible on-ramp to taking sleep seriously, and the direction it points is the right one. Just treat every dramatic statistic as "probably right in direction, suspect in number." The value of studying this book isn't memorizing its data — it's learning the difference between a solid thesis and the shock figures dressed up around it. After that, no sleep headline catches you off guard again.

:::source[Walker, Why We Sleep · Scribner 2017 · Audit: Guzey 2019](https://guzey.com/books/why-we-sleep/)$body_en$,
  array[$tkpt0$Walker acertou na direção — sono importa — e tropeçou nos números: as estatísticas de câncer e Alzheimer não sobrevivem à auditoria.$tkpt0$, $tkpt1$A "epidemia de sono da OMS" que o livro cita nunca existiu — a nota de rodapé levava a um documentário, não a um documento oficial.$tkpt1$, $tkpt2$O conselho prático resiste: 7 horas ou mais, horário regular, cafeína só até o meio-dia, sem álcool antes de dormir. As estatísticas de choque, não.$tkpt2$]::text[],
  array[$tken0$Walker got the direction right — sleep matters — and tripped on the numbers: the cancer and Alzheimer's stats don't survive the audit.$tken0$, $tken1$The "WHO sleep epidemic" the book cites never existed — the footnote led to a documentary, not an official document.$tken1$, $tken2$The practical advice holds: 7 hours or more, a regular schedule, caffeine only until midday, no alcohol before bed. The shock statistics don't.$tken2$]::text[],
  $trk_pt$Esse resumo fica em Aprender, sob Sono (Saúde). Ler ele calibra o que aproveitar dos próximos materiais sobre sono — nem tudo que soa como autoridade resiste à auditoria. Se você acompanha sua sub de Sono na Avaliação, use a régua daqui: mira 7h+ com regularidade, sem transformar a meta numa fonte de ansiedade. Walker segue sendo referência, com asteriscos.$trk_pt$,
  $trk_en$This summary lives in Learn, under Sleep (Health). Reading it calibrates what to take from future sleep materials — not everything that sounds authoritative survives an audit. If you track your Sleep sub in your self-assessment, use the ruler here: aim for 7h+ with regularity, without turning the target into a source of anxiety. Walker remains a reference, with asterisks.$trk_en$,
  $src_url$https://guzey.com/books/why-we-sleep/$src_url$,
  $src_pt$Walker, Why We Sleep · Scribner 2017 · ISBN 978-1501144318 · Auditoria: Guzey 2019$src_pt$,
  $src_en$Walker, Why We Sleep · Scribner 2017 · ISBN 978-1501144318 · Audit: Guzey 2019$src_en$,
  $rlog${"template_type":"summary","template_version":2,"voice_principles_applied":["Exactly 3 hero ideas (What Walker claims / The audit / What survives) — no 4th heading; verdict folded into idea 3 as prose","Prose-led: only 2 body cards (:::quote for Walker's iconic line + :::list-icon recipe in idea 3) plus the closing :::source — within budget","Native PT and native EN written fresh with distinct cadence, not translated (e.g. 'não sai de cima' / 'won't let go')","Jargon defined on first mention: NREM, REM, sistema glinfático/glymphatic, β-amilóide/β-amyloid, meta-análise/meta-analysis, curva em U/U-curve, ortossonia/orthosomnia","Honest caveats (honest_caveats + critics_honestly): flagged Xie 2013 as mouse data and Kripke 2002 as observational; softened Gelman to his verified 'smoking gun' post instead of the unverified 'research misconduct territory' quote; dropped the unverifiable Bill Gates reference entirely","Every claim attributed (attribute_clearly): Walker via :::quote and by name, critiques attributed to Guzey, Gelman, Kripke, the AASM/SRS consensus and Berkeley's outside reviewer — no 'some say'","Removed renderer-breaking '---' rules and banned fillers ('vale ler/vale lembrar'); corrected publisher Norton→Scribner and added ISBN"],"steps":[{"id":"author_question","answer_pt":"Walker parte de uma pergunta evolutiva: por que o sono existe, se ocupa um terço da vida sem comer, reproduzir ou defender? A resposta que ele persegue é que sono é manutenção biológica que a evolução nunca abandonou em nenhuma espécie estudada.","answer_en":"Walker starts from an evolutionary question: why does sleep exist, if it eats a third of life without feeding, reproducing or defending? The answer he chases is that sleep is biological maintenance evolution never dropped in any species studied."},{"id":"author_thesis","answer_pt":"Em uma frase, nas palavras dele (usada como :::quote no corpo): 'Quanto mais curto o seu sono, mais curta a sua vida'. A sociedade moderna viveria uma epidemia silenciosa de privação de sono, com custo em doença e morte precoce.","answer_en":"In one line, in his own words (used as the body :::quote): 'The shorter your sleep, the shorter your life.' Modern society is supposedly living a silent sleep-deprivation epidemic, paid for in disease and early death."},{"id":"core_ideas","answer_pt":"1) O que Walker afirma — manutenção biológica, NREM/REM, e os saltos de câncer/Alzheimer/OMS/8h. 2) A auditoria de Guzey (2019) e o desfecho em Berkeley. 3) O que sobrevive — 7h+ (consenso AASM 2015) e hábitos — e como ler o resto sem cair na ortossonia. Cada seção segue o triplo o-que/por-que/como-aplicar.","answer_en":"1) What Walker claims — biological maintenance, NREM/REM, and the cancer/Alzheimer/WHO/8h leaps. 2) Guzey's 2019 audit and the Berkeley outcome. 3) What survives — 7h+ (2015 AASM consensus) and habits — and how to read the rest without falling into orthosomnia. Each section follows the what/why/how-to-apply triple."},{"id":"evidence","answer_pt":"A favor de Walker: NREM/REM e o valor do sono são mainstream; o consenso AASM/SRS de 2015 recomenda 7h+. Contra: meta-análise de 2018 (n=1,5M) sem ligação com câncer; Kripke 2002 (n=1,1M) mostra curva em U, não linha descendente; Xie 2013 (glinfático/β-amilóide) é dado em camundongo; artigo na Neuron retratado 'a pedido do autor' com a estatística impossível de 400-600%; Berkeley fechou sem apontar má conduta. Caveats sinalizados no corpo (mouse-to-human, correlação vs. causa).","answer_en":"For Walker: NREM/REM and sleep's value are mainstream; the 2015 AASM/SRS consensus recommends 7h+. Against: 2018 meta-analysis (n=1.5M) finds no cancer link; Kripke 2002 (n=1.1M) shows a U-curve, not a descending line; Xie 2013 (glymphatic/β-amyloid) is mouse data; a Neuron paper retracted 'at the author's request' carried the impossible 400-600% stat; Berkeley closed with no misconduct finding. Caveats flagged in the body (mouse-to-human, correlation vs. cause)."},{"id":"actionable","answer_pt":"Uma lista :::list-icon com 5 ações de consenso, não exclusivas do Walker: 7h+ em horário regular; quarto escuro e fresco sem telas na última hora; cafeína só até o meio-dia; sem álcool perto de dormir; e parar de ler se a ansiedade subir.","answer_en":"A :::list-icon with 5 consensus actions, none Walker-exclusive: 7h+ on a regular schedule; a dark, cool, screen-free room in the last hour; caffeine only until midday; no alcohol near bedtime; and stopping the reading if anxiety rises."},{"id":"verdict","answer_pt":"Vale a leitura com lápis cético: é a porta de entrada mais acessível pro tema e a direção está certa, mas trate cada estatística dramática como 'certa no rumo, suspeita no número'. O ganho real é aprender a separar a tese sólida dos números de choque que a vestem.","answer_en":"Worth reading with a skeptic's pencil: it's the most accessible on-ramp to the topic and the direction is right, but treat every dramatic statistic as 'right in direction, suspect in number.' The real payoff is learning to separate the solid thesis from the shock numbers dressed around it."}],"main_points":[{"id":"1_what_walker_claims","what_pt":"Walker enquadra o sono como manutenção biológica não-negociável, com NREM (memória + faxina glinfática) e REM (emoção + criatividade) como duas máquinas complementares.","why_pt":"É o frame que vendeu milhões e dominou a conversa sobre sono desde 2017.","how_to_know_pt":"Você reconhece NREM/REM, o sistema glinfático e a 'regra das 8 horas' como ideias do livro.","what_en":"Walker frames sleep as non-negotiable biological maintenance, with NREM (memory + glymphatic wash) and REM (emotion + creativity) as two complementary machines.","why_en":"It's the frame that sold millions and has dominated the sleep conversation since 2017."},{"id":"2_the_audit","what_pt":"A auditoria de Guzey (2019) documentou erros graves: a 'epidemia da OMS' inexistente, o câncer que não dobra, a mortalidade em curva de U, um gráfico editado e um paper retratado.","why_pt":"Mostra exatamente onde os números de choque do livro não param em pé — e Berkeley fechou o caso sem apontar má conduta.","how_to_know_pt":"Se alguém citar 'a OMS declarou epidemia de sono' ou 'dormir pouco dobra o câncer', você sabe corrigir.","what_en":"Guzey's 2019 audit documented serious errors: the nonexistent 'WHO epidemic,' the cancer risk that doesn't double, the U-shaped mortality, an edited graph and a retracted paper.","why_en":"It shows exactly where the book's shock numbers fail to stand — and Berkeley closed the case with no finding of misconduct."},{"id":"3_what_survives","what_pt":"O esqueleto resiste: 7 horas ou mais (consenso AASM 2015, não '8h cravadas'), quarto escuro e fresco, cafeína cedo, sem álcool. As estatísticas dramáticas, não.","why_pt":"Define como usar o livro — bom guia de direção, números suspeitos — e alerta pro risco real de ortossonia.","how_to_know_pt":"Você aplica os hábitos sem desenvolver ansiedade obsessiva com o 'sono perfeito'.","what_en":"The skeleton holds: 7 hours or more (2015 AASM consensus, not a hard '8h'), a dark cool room, early caffeine, no alcohol. The dramatic statistics don't.","why_en":"It sets how to use the book — good directional guide, suspect numbers — and flags the real risk of orthosomnia."}]}$rlog$::jsonb, now()
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
  released_at = learning_material.released_at;

insert into public.learning_material_sub (material_id, sub_id)
select m.id, v.sub_id
from public.learning_material m
cross join (values ('sleep')) as v(sub_id)
where m.slug = 'summary-why-we-sleep'
on conflict (material_id, sub_id) do nothing;

commit;
