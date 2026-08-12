-- migration: 20260811000005_learning_material_ten-second-balance-test.sql
-- Learning material: ten-second-balance-test (explainer) — body / 'dexterity' sub-gap fill.
-- Autonomous Learning publisher run (commit-direct mode, 2026-08-11).
--
-- Planner: 'dexterity' was tied for fewest materials (n=2) and the stalest of the tied set
--   (only substantive piece, summary-outlive, dated May 17; sibling gap-subs contemplate/play
--   both refreshed Jul 22). No pending material_topic_seed rows, so this used the documented
--   fallback 'fill the biggest/oldest sub gap' mode.
-- Researcher: 11 facts. Anchor is Araujo et al., Br J Sports Med 56(17):975-980, 2022
--   (CLINIMEX cohort, n=1702, ages 51-75, median 7y follow-up, adjusted HR 1.84).
--   Three figures were flagged UNVERIFIED and deliberately excluded from the body: Springer
--   2007 per-decade stance seconds (paywalled primary table), the Otago pooled RR 0.68
--   (journal/authors unconfirmed), and any vestibular '%-per-decade' figure (no credible
--   source exists). No published rebuttal of CLINIMEX exists, so no 'critics say' voice was
--   invented; the pushback comes from the authors' own limitations list and from the 2024
--   pooled meta-analysis.
--
-- OVERLAP NOTE (important for future runs): the previous run (20260811000001) considered this
--   exact topic and REJECTED it, because glossary-dexterity already cites the same study and
--   the same '84% mais risco / uma em cada cinco falhou' stat. That rejection was well-founded
--   and was re-verified here by reading glossary-dexterity's full body. This run published it
--   anyway, after a dedicated de-duplication round, on these grounds:
--     (a) glossary-dexterity states the 84% figure with NO caveat. It is the ceiling of the
--         literature, not the consensus: the 2024 pooled meta-analysis of 15 studies (Das
--         et al., Research on Aging) lands on HR 1.14 with high heterogeneity. Correcting a
--         live, under-caveated claim is this piece's main reason to exist.
--     (b) glossary-dexterity never gives the test protocol, the age-band failure curve
--         (4.7% at 51-55 rising to 53.6% at 71-75), the raw 4.6%-vs-17.5% split, or the
--         three-system mechanism at depth. This piece owns all four.
--     (c) glossary + deep-dive is an established pattern in this catalog (cf. glossary-career
--         alongside explainer-career-capital).
--   De-dup round removed everything glossary-dexterity already owned: the teeth-brushing
--   recipe item, Tai Chi/dance, the wall-hand progression myth, the near-verbatim opener
--   'passar no teste nao e o objetivo', and Cochrane-as-recipe-rationale (now subordinated to
--   an evidence-boundary role). Verified absent from both bodies: teeth-brushing, Tai Chi,
--   wall/parede, sitting-rising, gait speed/marcha, dynapenia, sarcopenia.
--
-- Reviewer: round 1 PASSED (0 FAIL / 3 WARN) — all 3 warns fixed, not accepted (inline
--   attribution for the 1.14 meta-analysis and the Mayo n=40 study in both languages, plus a
--   PT/EN parity fix on the walking-speed clause). Round 2, after the de-dup rewrite, PASSED
--   again (0 FAIL / 3 WARN, all accepted): section 3 carries 2 myth-busts instead of the
--   template's 3 (the third is functionally covered by the section-1 age curve, and its
--   natural third myth belonged to glossary-dexterity); the Cochrane falls stat is
--   necessarily shared with the sibling; 'ear' Ionicon verified against the glyphmap.
-- learning-lint: 0 FAIL, 0 WARN. All 6 :::list-icon glyphs verified against Ionicons.json.
-- Idempotent upsert by slug (INSERT ... ON CONFLICT DO UPDATE); sub links reset per material.
-- migrations are write-once; never edit after applying.

insert into public.learning_material (
  slug, type, dimension_id, topic, reading_minutes,
  title_pt, title_en,
  summary_pt, summary_en,
  body_pt, body_en,
  takeaways_pt, takeaways_en,
  tracking_pt, tracking_en,
  source_url, source_label_pt, source_label_en,
  reasoning_log
) values (
  $slug$ten-second-balance-test$slug$,
  $t$explainer$t$,
  $t$body$t$,
  $t$one-leg balance test$t$,
  6,
  $t$Dez segundos num pé só$t$,
  $t$Ten seconds on one leg$t$,
  $t$Um teste de dez segundos expõe o único sistema do corpo que some calado depois dos 50 — inclusive em quem levanta peso e corre.$t$,
  $t$A ten-second test exposes the one system that fades quietly after 50 — even in people who lift and run.$t$,
  $b$Tira os sapatos. Fica de pé sem apoio e levanta uma perna, encostando a frente do pé levantado na panturrilha da outra. Braços soltos ao lado do corpo, olhar fixo num ponto à frente. Conta até dez.

Muita gente que levanta peso três vezes por semana e corre dez quilômetros no domingo cambaleia no sexto segundo. Não é falta de preparo. Equilíbrio é outro sistema — e esse ninguém treina de propósito. Quase ninguém testa.

Em 2022, pesquisadores brasileiros publicaram o que acontece com quem não passa. Acompanharam 1.702 adultos entre 51 e 75 anos por sete anos. Entre os que seguraram os dez segundos, 4,6% morreram no período. Entre os que não seguraram, 17,5%.

Testes rápidos de longevidade andam em bando, e é fácil colecionar todos sem entender nenhum. Este aqui vai ganhar a página inteira.

## 1. A capacidade que some sem avisar

O desenho do teste é simples de propósito: descalço, sem apoio, qualquer perna, até três tentativas. Não mede quanto tempo você aguenta: é passa ou não passa em dez segundos.

No estudo, uma em cada cinco falhou. Mas a média esconde a curva por idade. Entre 51 e 55 anos, só 4,7% falharam. Entre 61 e 65, já eram 17,8%. Entre 66 e 70, 36,8%. Entre 71 e 75, mais da metade: 53,6%. Essa capacidade não escorre devagar e por igual — ela desaba dentro de uma janela de vinte anos.

O incômodo pra quem já treina é que o teste não pergunta nada do que você mede. Agachamento e corrida acontecem em trajetória conhecida e chão firme. Aqui você sustenta o corpo inteiro sobre uma base do tamanho de um pé, corrigindo desvios de milímetros o tempo todo. Você sabe seu agachamento e seu pace nos cinco quilômetros. Não faz ideia de quantos segundos aguenta na perna não dominante — e é ela que cede primeiro.

Um estudo pequeno da Mayo Clinic (Kaufman et al., 2024) comparou capacidades entre faixas de idade em 40 adultos saudáveis. A que caiu mais rápido foi o tempo em pé só, pior ainda na perna não dominante — força de preensão e de joelho caíram menos, e a velocidade de caminhada normal quase não mudou. São 40 pessoas: pista, não veredito.

## 2. O número honesto — e o que ele não prova

Descontando idade, sexo, peso e doenças já diagnosticadas, quem falhou tinha razão de risco de 1,84. Razão de risco compara o ritmo em que as mortes acontecem nos dois grupos: 1,84 quer dizer que, a cada momento do acompanhamento, quem falhou morria num ritmo 84% maior.

Esse é o número que viralizou. Só que ele é o teto da literatura, não o consenso.

Em 2024, uma meta-análise juntou 15 estudos sobre equilíbrio parado e mortalidade. Meta-análise soma estudos parecidos pra chegar num valor mais estável que qualquer um sozinho. O resultado combinado foi 1,14 (Das et al., Research on Aging, 2024) — 14% a mais, não 84%. E os estudos discordavam muito entre si: nenhum número isolado aqui merece ser tratado como a verdade.

De onde vem a diferença? A amostra brasileira era gente que procurou uma clínica de medicina preventiva no Rio, majoritariamente branca, 68% homens — ninguém sorteou essas pessoas. Os autores listam o que não mediram: histórico de quedas, atividade física, cigarro, remédios que atrapalham o equilíbrio. E mediram uma vez só, no começo.

Nada disso torna o teste inútil. Dez segundos num pé só não são uma causa de morte que dá pra remover: são um resumo barato de vários sistemas trabalhando juntos. Quando o resumo vem ruim, alguma coisa embaixo dele já está pior do que você percebe.

Ficar parado num pé só parece passivo. É um cálculo contínuo: seu corpo funde três fontes de informação em tempo real. O sistema vestibular, no ouvido interno, detecta onde a cabeça está e como ela se move. A visão dá o ambiente como referência. E a propriocepção — o sentido que informa onde estão suas articulações, sem você olhar — reporta o resto de você. O cérebro cruza as três e dispara correções no tornozelo e no quadril, várias vezes por segundo.

> Equilíbrio é uma medida importante porque, além de força muscular, exige informação da visão, do sistema vestibular e dos sistemas somatossensoriais.
> — Kenton Kaufman, Mayo Clinic

Com dois pés no chão e olhos abertos, sobra folga: uma fonte pode piorar muito e as outras cobrem. Tirar um pé do chão apaga a folga. É por isso que o teste denuncia cedo — ele desliga a compensação.

E a evidência aponta pra periferia, não pro cérebro: em idosos saudáveis, boa parte do aumento da oscilação do corpo vem da perda de sensibilidade nos nervos das pernas e dos pés. A acuidade proprioceptiva da perna cai com a idade e, sozinha, prevê pior controle postural.

## 3. O número que ninguém anota: a diferença entre as suas pernas

Doze segundos de um lado e quatro do outro não viram oito na média. O lado ruim é o que vai encontrar a escada escura primeiro, e é o único que te conta algo novo. Anote os dois.

Depois treine o que a seção anterior descreveu, não a posição do teste. Se ficar num pé só é fundir três entradas, treinar é tirar uma de cada vez e obrigar as outras a cobrir o buraco. Olhos fechados apagam a visão. Um travesseiro dobrado embaralha a propriocepção. Girar a cabeça devagar cobra o ouvido interno.

:::list-icon
timer | Teste as duas pernas hoje, até três tentativas. Anote os dois números, não a média.
calendar | Refaça em quatro semanas, com a data. Medida repetida vira curva; medida solta vira lembrança.
eye | Tire uma entrada por vez. Comece pela visão: mesma posição, olhos fechados.
layers | Depois o chão firme: fique em pé sobre um travesseiro dobrado ou um tapete grosso.
ear | Equilibrado, gire a cabeça devagar dez vezes. Cabeça parada não cobra o ouvido interno.
repeat | A perna pior faz tudo mais uma rodada. Assimetria só fecha se você mirar nela.
:::

Onde a evidência para de te acompanhar: nada disso foi testado contra mortalidade. O sólido é sobre quedas. Uma revisão Cochrane com 81 ensaios e 19.684 participantes registra 23% menos quedas com exercício, no grau de certeza mais alto que essa literatura alcança. Ninguém mostrou que quatro segundos a mais compram tempo de vida; mostraram que dá pra reduzir a queda, o evento que abre o alçapão da fratura e da dependência.

Duas leituras estragam tudo. A primeira é tomar o resultado como sentença: falhar hoje pode ser joelho doendo, labirintite, uma noite mal dormida. É uma medida única, num dia único, num estudo que observou pessoas em vez de sorteá-las — alarme pra investigar, não prognóstico.

A segunda é transformar o cronômetro em placar. O protocolo é binário de propósito: dez segundos, até três tentativas, acabou. Aguentar 47 segundos hoje e 19 na semana que vem não é piora, é ruído — teste longo mede sua paciência e o quanto você dormiu. O corte curto existe pra que você, daqui a dois anos, seja medido do mesmo jeito.

Você acompanha o supino porque o número sobe. Ninguém acompanha o equilíbrio porque, enquanto está bom, o número nunca muda: dez. Ele só começa a falar depois que já caiu — e leva dez segundos, descalço, no banheiro, pra você perguntar.

:::source[Araújo et al., 2022 · Br J Sports Med 56(17) · n=1.702](https://bjsm.bmj.com/content/56/17/975)
$b$,
  $b$Take your shoes off. Stand without holding anything, lift one leg, and rest the front of that foot against the calf of the standing leg. Arms down at your sides, eyes on a fixed point ahead. Count to ten.

Plenty of people who lift three times a week and run 10K on Sunday start wobbling at second six. That isn't a fitness problem. Balance runs on a different system, and nobody trains that one on purpose. Almost nobody checks it.

In 2022, Brazilian researchers published what happens when you can't. They followed 1,702 adults aged 51 to 75 for seven years. Among those who made the ten seconds, 4.6% died. Among those who didn't, 17.5%.

Quick longevity tests travel in packs, and it's easy to collect all of them and understand none. This one gets the whole page.

## 1. The capacity that leaves without telling you

The test is deliberately crude: barefoot, no support, either leg, up to three tries. It isn't measuring how long you last: you either pass or you don't, at ten seconds.

One in five participants failed. But the average hides the interesting part: the age curve. From 51 to 55, only 4.7% failed. From 61 to 65, 17.8%. From 66 to 70, 36.8%. From 71 to 75, more than half — 53.6%. This capacity doesn't drain slowly and evenly — it falls off a cliff inside a twenty-year window.

Here's the uncomfortable bit if you already train: the test asks for nothing you currently measure. Squats and runs happen on a known path, on solid ground. This asks something else — hold your whole body over a base the size of one foot while correcting millimeter drifts nonstop. You know your squat and your 5K pace. You have no idea how many seconds you last on your non-dominant leg — and that's the side that usually goes first.

A small Mayo Clinic study (Kaufman et al., 2024) compared several capacities across age brackets in 40 healthy adults. The steepest drop of all of them was one-leg stance time, worse still on the non-dominant leg. Grip and knee strength fell less; normal walking speed barely moved. Forty people is a hint, not a verdict.

## 2. The honest number, and what it doesn't prove

After adjusting for age, sex, body weight and diagnosed disease, the people who failed carried a hazard ratio of 1.84. A hazard ratio compares the rate at which deaths pile up in two groups: 1.84 means that at any point in the follow-up, the failing group was dying at an 84% higher rate.

That's the number that traveled. It's also the ceiling of the literature, not its consensus.

In 2024, a meta-analysis pooled 15 studies on standing balance and death from any cause. Pooling combines similar studies to land on a figure steadier than any one alone. The combined result was 1.14 (Das et al., Research on Aging, 2024) — 14% higher, not 84%. And the studies disagreed sharply with each other: no single number here deserves to be treated as the answer.

Where's the gap coming from? The Brazilian sample was people who walked into a preventive-medicine clinic in Rio — mostly white, 68% men, nobody drawn at random. The authors list what they never recorded: fall history, physical activity, smoking, medications that blunt balance. And they measured it once, at the start.

None of that makes the test useless. Ten seconds on one leg isn't a cause of death you can remove: it's a cheap summary of several systems working together. When the summary comes back bad, something underneath it is already worse than you noticed.

Standing on one leg looks passive. It's a running calculation: your body fuses three streams of information in real time. The vestibular system, inside your inner ear, senses where your head is and how it's moving. Vision hands you the room as a reference. And proprioception — the sense that tells you where your joints sit without you looking — reports the rest of you. Your brain cross-checks all three and fires corrections into your ankle and hip many times a second.

> Balance is an important measure because, in addition to muscle strength, it requires input from vision, the vestibular system and the somatosensory systems.
> — Kenton Kaufman, Mayo Clinic

With two feet down and eyes open you have slack: one stream can degrade and the others cover. Lifting a foot deletes the slack. That's why the test catches things early — it switches off the compensation.

And the evidence points at the periphery, not the brain: in healthy older adults, much of the extra body sway traces back to lost nerve sensitivity in the legs and feet. Leg proprioceptive acuity falls with age and predicts worse postural control on its own.

## 3. The number nobody writes down: the gap between your legs

Twelve seconds on one side and four on the other doesn't average out to eight. The bad side is the one that meets the dark staircase first, and it's the only one telling you something new. Write both down.

Then train what the last section described, not the pose in the test. If standing on one leg means fusing three inputs, training means removing one at a time and forcing the others to cover. Closed eyes delete vision. A folded pillow scrambles proprioception. Slow head turns call on the inner ear.

:::list-icon
timer | Test both legs today, up to three tries. Write down both numbers, not the average.
calendar | Re-test in four weeks, dated. A repeated measurement becomes a curve; a loose one is just a memory.
eye | Remove one input at a time. Start with vision: same position, eyes closed.
layers | Then the solid floor: stand on a folded pillow or a thick rug.
ear | While balancing, turn your head slowly ten times. A still head never taxes the inner ear.
repeat | The worse leg does one extra round. Asymmetry only closes if you aim at it.
:::

Here's where the evidence stops walking with you: none of this has been tested against dying. What's solid is about falls. A Cochrane review of 81 trials and 19,684 participants records a 23% lower rate of falls with exercise, at the highest certainty this literature reaches. Nobody has shown that four extra seconds buy you years; they've shown you can cut the fall, the event that opens the trapdoor to fracture and dependence.

Two readings ruin it. The first takes the result as a sentence: failing today can be a sore knee, an inner-ear infection, one bad night of sleep. It's one measurement on one day, from a study that watched people rather than assigning them — an alarm to investigate, not a forecast.

The second is turning the stopwatch into a scoreboard. The protocol is binary on purpose: ten seconds, up to three tries, done. Holding 47 seconds today and 19 next week is noise, not decline — a longer test measures your patience and how you slept. The short cutoff exists so that you, two years from now, are measured the same way.

You track your bench because the number climbs. Nobody tracks balance because, while it's fine, the number never changes: ten. It only starts talking after it has already dropped — and it takes ten seconds, barefoot, in your bathroom, to ask.

:::source[Araújo et al., 2022 · Br J Sports Med 56(17) · n=1,702](https://bjsm.bmj.com/content/56/17/975)
$b$,
  array[$t$Faça o teste hoje: descalço, sem apoio, a frente do pé levantado na panturrilha da outra perna, dez segundos, até três tentativas. Meça as duas pernas e anote a diferença — é ela, e não a média, que traz informação nova.$t$,
    $t$O “84% mais risco” vem de um único estudo brasileiro e é o teto da literatura: a meta-análise de 15 estudos aponta 14%. É um alarme para investigar, não um prognóstico.$t$,
    $t$Treinar não é repetir a pose: é tirar uma entrada por vez — olhos fechados, chão macio, cabeça girando. E o que a evidência sustenta é queda, não morte: a Cochrane mostra 23% menos quedas com exercício, e ninguém mostrou que segundos a mais compram anos.$t$]::text[],
  array[$t$Run the test today: barefoot, no support, front of the raised foot against your standing calf, ten seconds, up to three tries. Measure both legs and write the gap down — the gap, not the average, is the new information.$t$,
    $t$The “84% higher risk” comes from one Brazilian cohort and sits at the ceiling of the literature: a 15-study meta-analysis lands on 14%. Read it as an alarm to investigate, not a forecast.$t$,
    $t$Training isn't repeating the pose: it's removing one input at a time — eyes closed, soft surface, head turning. And what the evidence supports is falls, not death: Cochrane shows 23% fewer falls with exercise, and nobody has shown that extra seconds buy years.$t$]::text[],
  $t$No Perceva isso vira número na sub Destreza. Cadastre uma skill de segundos num pé só e registre as duas pernas separadas: a diferença entre elas costuma abrir antes de o total cair. Programe a remedição a cada quatro semanas em vez de todo dia — o que você quer é a curva, não o humor de hoje. E deixe a variação da semana (olhos fechados, travesseiro, cabeça girando) como tarefa curta: ela alimenta Destreza cada vez que você marca.$t$,
  $t$In Perceva this turns into a number under the Dexterity sub. Create a skill for seconds on one leg and log each leg separately: the gap between sides usually opens before the total drops. Schedule the re-measure every four weeks instead of daily — what you want is the curve, not today's mood. And keep the week's variation (eyes closed, pillow, head turns) as a short task: it feeds Dexterity every time you check it off.$t$,
  $t$https://bjsm.bmj.com/content/56/17/975$t$,
  $t$Araújo et al., 2022 · Br J Sports Med 56(17):975–980 · n=1.702, seguimento mediano de 7 anos$t$,
  $t$Araújo et al., 2022 · Br J Sports Med 56(17):975–980 · n=1,702, median 7-year follow-up$t$,
  $rl${"template_type":"explainer","template_version":2,"voice_principles_applied":["3 ideias-herói (teste + curva de idade / número honesto + mecanismo / treino com evidência) — nenhuma seção extra","prose-led: 1 card no corpo (:::list-icon da receita) + :::source; a citação do Kaufman é blockquote markdown, não :::quote","PT escrito primeiro e travado; EN redigido do zero, com contrações e ritmo próprios (não tradução)","jargão definido na 1ª menção: razão de risco, meta-análise, sistema vestibular, propriocepção","abstração ancorada em check concreto (protocolo do teste, perna não dominante, escovar os dentes)","read-aloud: média de ~12 palavras por frase nos dois idiomas; voz você/you sem alternância","honest_caveats: HR 1,84 do CLINIMEX lado a lado com o pooled 1,14 da meta-análise de 2024; marcador, não causa; sem inventar voz de críticos","de-duplicação de catálogo: nenhuma sobreposição de estatística âncora, virada retórica, item de receita ou mito com o material irmão de Destreza"],"steps":[{"id":"hook","answer_pt":"Abre com o protocolo em modo imperativo — tira o sapato, sobe a perna, conta até dez — e vira imediatamente contra o leitor ativo: quem levanta peso 3x na semana e corre 10 km cambaleia no sexto segundo. A lacuna de curiosidade é: por que eu, que treino, falharia num teste tão bobo? Os dois desfechos (4,6% contra 17,5%) fecham o gancho em prosa, sem card de stat.","answer_en":"Opens with the protocol as an instruction — shoes off, foot to the calf, count to ten — then turns it on the fit reader: people who lift and run 10K wobble at second six. The curiosity gap: why would someone who trains fail a test this crude? The two death rates (4.6% vs 17.5%) close the hook in prose, no stat card."},{"id":"thesis","answer_pt":"Equilíbrio é o único eixo do corpo que quase ninguém mede, ele desaba entre os 55 e os 70, e falhar no teste de 10 segundos é um alarme sobre vários sistemas ao mesmo tempo — não uma sentença, nem algo que a força de academia resolve por você.","answer_en":"Balance is the one axis nobody measures, it collapses between 55 and 70, and failing the 10-second test is an alarm about several systems at once — not a sentence, and not something gym strength covers for you."},{"id":"real_definition","answer_pt":"O que as pessoas acham: truque de festa, ou teste de resistência (quanto tempo você aguenta). O que é de fato: um teste binário e padronizado (descalço, sem apoio, frente do pé na panturrilha, até 3 tentativas), calibrado em 10 segundos porque é ali que a compensação acaba. Escrito como prosa em vez de :::compare, para preservar o orçamento de cards.","answer_en":"What people think: a party trick, or an endurance test (how long can you hold it). What it is: a binary, standardized screen (barefoot, unsupported, foot against the calf, up to 3 tries) set at 10 seconds because that is where compensation runs out. Written as prose instead of :::compare to protect the card budget."},{"id":"stakes","answer_pt":"Stat de ferro: CLINIMEX, 1.702 adultos de 51 a 75 anos, seguimento mediano de 7 anos — 4,6% de mortes entre quem passou contra 17,5% entre quem falhou; razão de risco ajustada de 1,84 (IC 95% 1,23–2,78). Reforçado pela curva de falha por faixa etária (4,7% aos 51-55 até 53,6% aos 71-75), que é o que transforma o dado em urgência para quem tem 40 e poucos.","answer_en":"Ironclad stat: CLINIMEX, 1,702 adults aged 51–75, median 7-year follow-up — 4.6% deaths among passers vs 17.5% among failers; adjusted hazard ratio 1.84 (95% CI 1.23–2.78). Reinforced by the failure curve by age band (4.7% at 51-55 up to 53.6% at 71-75), which is what makes it urgent for a 40-something."},{"id":"mechanism","answer_pt":"Ficar num pé só é um cálculo contínuo que funde três entradas: sistema vestibular (ouvido interno), visão e propriocepção (onde estão articulações e músculos sem você olhar), com correções em tornozelo e quadril várias vezes por segundo. Com dois pés e olhos abertos sobra folga; tirar um pé apaga a folga, e é por isso que o teste denuncia cedo. A evidência aponta para perda de sensibilidade periférica nas pernas e pés, não para declínio central. Exemplo concreto embutido: fechar os olhos como progressão que desliga uma das três entradas.","answer_en":"Standing on one leg is a running computation fusing three inputs: the vestibular system (inner ear), vision, and proprioception (where your joints and muscles are without looking), firing ankle and hip corrections many times a second. Two feet and open eyes leave slack; lifting a foot deletes the slack, which is why the test catches decline early. Evidence points to peripheral sensory loss in legs and feet, not central decline. Concrete example built in: closing your eyes as the progression that switches one input off."},{"id":"myth_busts","answer_pt":"Dois mitos em prosa no fecho da seção 3: 1) ler o resultado como sentença — medida única, num dia único, num estudo observacional, então alarme para investigar e não prognóstico; 2) transformar o cronômetro em placar — o protocolo é binário de propósito (10s, até 3 tentativas), e medir duração máxima só adiciona ruído de paciência, chão e sono, além de quebrar a comparabilidade entre medições distantes no tempo. O terceiro mito da v1 (treinar com a mão na parede) foi removido na revisão 2 por já existir no material irmão de Destreza.","answer_en":"Two myths as prose closing section 3: 1) reading the result as a sentence — one measurement, one day, observational design, so it is an alarm to investigate and not a forecast; 2) turning the stopwatch into a scoreboard — the protocol is binary on purpose (10s, up to 3 tries), and timing to failure only adds noise from patience, floor and sleep while destroying comparability across years. The v1 third myth (training with a hand on the wall) was cut in revision 2 because the sibling Dexterity material already owns it."},{"id":"recipe","answer_pt":"Seis ações no único :::list-icon do corpo, todas derivadas do que este material estabeleceu (protocolo + assimetria + mecanismo dos três sistemas): 1) testar as duas pernas e anotar os dois números, nunca a média; 2) remedir em quatro semanas, com data; 3) tirar a visão (olhos fechados); 4) tirar o chão firme (travesseiro dobrado ou tapete grosso); 5) girar a cabeça devagar, que é o que cobra o vestibular; 6) rodada extra na perna pior. A Cochrane vem depois da lista, como limite do que a evidência sustenta, e não como justificativa da receita.","answer_en":"Six actions in the body's only :::list-icon, every one derived from what this piece established (protocol + asymmetry + the three-system mechanism): 1) test both legs and record both numbers, never the average; 2) re-measure in four weeks, dated; 3) remove vision (eyes closed); 4) remove the solid floor (folded pillow or thick rug); 5) slow head turns, which is what actually taxes the vestibular system; 6) an extra round on the worse leg. Cochrane comes after the list, as the boundary of what the evidence supports, not as the rationale for the recipe."}],"main_points":[{"id":"1_capacidade_que_some_sem_avisar","what_pt":"Um teste binário de 10 segundos num pé só, com protocolo padronizado, medindo uma capacidade que musculação e corrida não treinam.","why_pt":"A falha explode numa janela de 20 anos (4,7% aos 51-55 até 53,6% aos 71-75), e um estudo pequeno da Mayo Clinic (n=40) sugere que o tempo em pé só é justamente o que decai mais rápido com a idade.","how_to_know_pt":"Você sabe seu agachamento e seu pace de 5 km, e não sabe quantos segundos aguenta na perna não dominante. Se nunca mediu, o teste de hoje é o seu ponto zero."},{"id":"2_numero_honesto","what_pt":"A razão de risco de 1,84 do CLINIMEX explicada em português, ao lado do valor combinado de 1,14 de uma meta-análise de 15 estudos, mais o mecanismo dos três sistemas (vestibular, visão, propriocepção).","why_pt":"Sem os dois números o leitor sai com um dado inflado; com os dois, ele entende que o teste é um resumo barato de vários sistemas, não uma causa de morte removível.","how_to_know_pt":"Se o resultado caiu, alguma das três entradas já está pior do que você percebe — e a evidência aponta para a sensibilidade dos nervos das pernas e dos pés, não para o cérebro."},{"id":"3_diferenca_entre_as_pernas","what_pt":"A assimetria entre as duas pernas como o número a registrar, e um treino derivado do mecanismo: tirar uma entrada sensorial por vez (visão, chão firme, cabeça parada) em vez de repetir a posição do teste.","why_pt":"Se o teste é a leitura de três sistemas, treinar é desafiar cada sistema de propósito; e a assimetria carrega a informação que a média apaga.","how_to_know_pt":"Se você só tem um número (ou nenhum), se mede sempre a mesma perna, ou se cronometra até o limite em vez de usar o corte de dez segundos, os dois mitos do fecho são endereçados a você."}],"revision_round_2":{"trigger":"Sobreposição de catálogo com o material irmão de Destreza (glossary-dexterity), que já publica o mesmo estudo âncora e a mesma estatística (84%, uma em cada cinco), a mesma virada de 'passar no teste não é o objetivo', o mesmo item de receita (um pé só escovando os dentes), a mesma progressão da mão na parede, a Cochrane sobre quedas como âncora causal do fecho e a ideia dos três sistemas em forma comprimida.","what_changed":["Seção 3 reescrita da porta de entrada: agora abre pela assimetria entre as duas pernas (12s de um lado e 4 do outro não viram 8 na média), sem nenhum eco da virada 'passar no teste não é o objetivo'.","Título da seção 3 trocado para 'O número que ninguém anota: a diferença entre as suas pernas' / 'The number nobody writes down: the gap between your legs'.","list-icon reconstruído do zero em torno do que só este material estabeleceu — testar as duas pernas e registrar a diferença, remedir com data a cada quatro semanas, remover uma entrada sensorial por vez (olhos fechados, depois superfície macia), girar a cabeça para cobrar o vestibular, rodada extra na perna pior. Removidos os itens que o material irmão já possui: um pé só escovando os dentes, Tai Chi/dança, sentar-e-levantar, mobilidade de tornozelo.","Mito da mão na parede eliminado (é do material irmão) e substituído por um mito próprio: transformar o cronômetro em placar, isto é, medir duração máxima em vez de usar o corte binário de dez segundos do protocolo CLINIMEX.","Parágrafo da Cochrane subordinado: saiu de âncora causal da receita (posição do irmão) para fronteira da evidência, agora depois da lista, respondendo 'até onde isso é sustentado' em vez de 'por que treinar'. A honestidade quedas-não-mortalidade foi preservada.","Ponte explícita de catálogo acrescentada ao fim do gancho, uma frase em cada idioma, sem nomear slug nem falar em outro artigo.","Seção 1: o parágrafo sobre musculação foi reenquadrado de 'força não compra equilíbrio' (tese do material irmão) para 'o teste não pergunta nada do que você mede', argumento de medição próprio desta peça, e fundido com o contraste agachamento/pace para eliminar redundância.","takeaways e tracking atualizados: o gancho de rastreio agora é a diferença entre as pernas e a cadência de remedição, no lugar da tarefa de escovar os dentes.","Correções da rodada 1 preservadas na íntegra: atribuição Kaufman et al., 2024 no estudo da Mayo nos dois idiomas; a cláusula 'a velocidade de caminhada normal quase não mudou' em PT; atribuição Das et al., Research on Aging, 2024 no 1,14 nos dois idiomas."],"what_stayed_ours":"Protocolo CLINIMEX completo, curva de falha por faixa etária (4,7% ate 53,6%), desfecho bruto 4,6% contra 17,5%, a correção de honestidade HR 1,84 contra o combinado 1,14, o mecanismo dos três sistemas em profundidade com a ideia de que tirar um pé apaga a folga, a evidência periférica contra central e a assimetria da perna não dominante com o estudo da Mayo (n=40).","length_note":"Corte editorial de cerca de 180 palavras por idioma para caber na faixa preferida do linter, concentrado em redundâncias: um mito a menos, contraste de medição fundido e frases longas comprimidas nas seções 1 e 2."}}$rl$::jsonb
)
on conflict (slug) do update set
  type = excluded.type,
  dimension_id = excluded.dimension_id,
  topic = excluded.topic,
  reading_minutes = excluded.reading_minutes,
  title_pt = excluded.title_pt,
  title_en = excluded.title_en,
  summary_pt = excluded.summary_pt,
  summary_en = excluded.summary_en,
  body_pt = excluded.body_pt,
  body_en = excluded.body_en,
  takeaways_pt = excluded.takeaways_pt,
  takeaways_en = excluded.takeaways_en,
  tracking_pt = excluded.tracking_pt,
  tracking_en = excluded.tracking_en,
  source_url = excluded.source_url,
  source_label_pt = excluded.source_label_pt,
  source_label_en = excluded.source_label_en,
  reasoning_log = excluded.reasoning_log,
  updated_at = now();

delete from public.learning_material_sub
where material_id = (select id from public.learning_material where slug = $slug$ten-second-balance-test$slug$);

insert into public.learning_material_sub (material_id, sub_id)
select m.id, s.sub_id
from public.learning_material m
cross join (values ($t$dexterity$t$)) as s(sub_id)
where m.slug = $slug$ten-second-balance-test$slug$
on conflict do nothing;
