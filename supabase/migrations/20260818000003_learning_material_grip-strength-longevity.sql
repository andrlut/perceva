-- migration: 20260818000003_learning_material_grip-strength-longevity.sql
-- Learning material: grip-strength-longevity (explainer) — body / 'strength' sub-gap fill.
-- Autonomous Learning publisher run (commit-direct mode, 2026-08-18).
--
-- Planner: 'strength' was the stalest sub in the catalog — nothing published since 2026-05-17
--   (13 weeks, well past the 4-week recency bar). Its 3 existing materials are a glossary, a
--   general longevity book summary (summary-outlive) and an unrelated drug-news piece; none is
--   an actual resistance-training explainer. material_topic_seed is empty (pending=0), so this
--   used the documented fallback 'fill the biggest/oldest sub gap' mode.
-- Researcher: 8 verified facts. Anchor is Leong et al., The Lancet 386(9990):266-273, 2015
--   (PURE cohort, n=142,861 enrolled / 139,691 with known vital status, 17 countries, ages
--   35-70, median 4.0y follow-up, 3,379 deaths, adjusted HR 1.16 per 5kg of lost grip).
--   Two figures were flagged UNVERIFIED and deliberately EXCLUDED from the body: the granular
--   per-decade NHANES grip-decline percentages (journal/authors unconfirmable) — softened to
--   the well-supported directional claim 'peaks in the early thirties, ~10 percent per decade
--   after 50' — and the 'roughly half of adults over 80 have sarcopenia' figure, which traced
--   to a consumer-health secondary source rather than a peer-reviewed prevalence study, and
--   was dropped entirely.
--
-- CENTRAL EDITORIAL RISK (the reason this piece is written the way it is): grip strength is a
--   MARKER, not a lever. PURE is observational; no RCT shows that raising grip strength by
--   itself extends life. The obvious misread — 'squeeze a hand gripper, live longer' — would
--   make the material actively harmful advice, so the marker-vs-lever distinction is the spine
--   of the piece rather than a footnote: it is stated three separate times (the thermometer/
--   fever image in section 2, the explicit no-RCT paragraph, and the third myth-bust), and the
--   entire prescription in section 3 is whole-body compound resistance training, never grip
--   work. The :::list-icon even tells the reader to skip gloves and lifting straps, i.e. not to
--   outsource the very thing being measured.
--
-- Four further caveats carried into the body verbatim from the dossier:
--   (a) PURE compared grip against SYSTOLIC BLOOD PRESSURE ALONE, not a full CV risk model —
--       and BP is modifiable by medication in weeks in a way grip-as-a-target is not.
--   (b) The cohort was 35-70, so the piece explicitly disclaims ages outside that band.
--   (c) EWGSOP2's 27kg/16kg cutoffs derive from a British reference cohort; the body flags this
--       and prints PURE's South American medians alongside (Leong et al., J Cachexia Sarcopenia
--       Muscle 2016) so a pt-BR reader isn't handed a Eurocentric threshold as universal.
--   (d) The Momma et al. (BJSM 2022) J-curve rests on only 4 studies with usable dose-response
--       data — flagged in-body as 'pista, nao lei' / 'strong hint, not law'.
--
-- Reviewer: round 1 PASSED (0 FAIL / 3 WARN). All 3 warns were FIXED, not accepted: inline
--   attribution added for Androulakis-Korakakis et al., 2020 (the minimum-effective-dose
--   protocol) and for EWGSOP2, 2019 (the 27/16kg cutoff), in both languages, plus the 40-word
--   outlier sentence in section 3 split in two. Deliberate template deviations, all upheld by
--   the reviewer: myth_busts written as prose instead of :::list-icon (card budget), the :::stat
--   block carries the training dose (10-20 percent) rather than repeating the hook's 16 percent
--   (avoids stat_redundancy), and the Sayer/Kirkwood quote uses a markdown blockquote rather
--   than a :::quote directive.
-- learning-lint: 0 FAIL, 0 WARN. All 5 :::list-icon glyphs verified against the Ionicons glyphmap.
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
  $slug$grip-strength-longevity$slug$,
  $t$explainer$t$,
  $t$body$t$,
  $t$grip-strength-longevity$t$,
  6,
  $t$Seu aperto de mão sabe demais$t$,
  $t$Your handshake knows too much$t$,
  $t$Um aperto de mão prevê morte melhor que a pressão arterial — e a lição não é treinar a mão.$t$,
  $t$A handshake predicts death better than blood pressure — and the lesson isn't to train your hand.$t$,
  $b$Existe um aparelho barato que quase nenhum consultório usa: o dinamômetro de mão, um cabo de metal que você aperta com toda a força enquanto um mostrador registra quantos quilos você fez. Três apertos por mão, anota o melhor, um minuto.

Entre 2003 e 2009, pesquisadores fizeram isso com 142.861 adultos de 35 a 70 anos, em 17 países ricos, médios e pobres. Depois acompanharam quatro anos: 3.379 mortes. Quando abriram os números, o aperto previa morte por qualquer causa melhor do que a pressão sistólica — o número de cima do aparelho que todo posto de saúde tem.

Cada 5 quilos a menos de aperto vinham com 16% mais risco de morrer. E é aqui que quase todo mundo tira a conclusão errada.

## 1. Um aperto de mão contra o aparelho de pressão

O estudo é o PURE, saiu na Lancet em 2015, e o achado central é uma razão de risco de 1,16 a cada 5 quilos a menos de preensão. Razão de risco compara o ritmo em que as mortes acontecem em dois grupos: quem tinha o aperto mais fraco morria num ritmo 16% maior durante o acompanhamento. Para morte cardiovascular, 17%. Para infarto, 7%. Para AVC, 9%.

A frase que viajou o mundo — "o aperto prevê morte melhor que a pressão arterial" — está no artigo, mas perdeu o contorno no caminho. Os autores compararam a preensão com a pressão sistólica sozinha, não com um cálculo completo de risco: pressão, colesterol, idade, cigarro e diabetes. E tem a diferença que decide tudo: pressão alta cai com remédio em semanas; o aperto não obedece a nada disso. Um número pode prever melhor e ser muito pior como alvo.

O segundo contorno é a idade: o PURE recrutou gente de 35 a 70 anos. Ele não diz nada sobre você aos 27, nem sobre a sua avó de 84 — fora dessa faixa, você extrapola.

## 2. A mão não é o músculo que importa

Repare na ordem daqueles números: o aperto pesa mais sobre morrer de qualquer coisa do que sobre infartar. É a pista de por que ele funciona, e ela não está na mão.

Doenças que atacam só o músculo são raras. Então, quando a preensão cai, quase nunca é um problema da mão: é o corpo inteiro descendo junto — massa muscular, condução dos nervos, alimentação, capacidade de se levantar depois de uma pneumonia. Avan Sayer e Tom Kirkwood, no comentário publicado ao lado do PURE na Lancet, colocaram assim:

> A perda de força de preensão dificilmente está numa via final única dos efeitos do envelhecimento, mas pode ser um marcador especialmente bom dos processos por baixo — talvez justamente porque doenças exclusivas do músculo são raras.
> — Sayer e Kirkwood, The Lancet, 2015

A preensão chega no topo por volta dos 30 e poucos anos e cai em curva a partir dali; depois dos 50, cerca de 10% por década. Quando essa queda passa de certo ponto e vem com perda de massa muscular, ganha nome: sarcopenia, a perda progressiva de músculo e força que acompanha a idade.

Os europeus fixaram um corte de rastreio (EWGSOP2, 2019): abaixo de 27 quilos em homens e 16 em mulheres levanta suspeita — só suspeita, porque o diagnóstico pede também massa muscular e velocidade de caminhada. Esse corte saiu de uma população britânica. O próprio PURE publicou medianas por região: na América do Sul, aos 35-40 anos, um homem faz 45 quilos e uma mulher, 29; aos 61-70, caem para 37 e 23. Os autores avisam: não existe corte único que sirva para o mundo inteiro. É régua, não diagnóstico.

E agora a parte que desmonta o artigo se você ler rápido: nenhum ensaio clínico mostrou que aumentar a preensão, sozinha, faz alguém viver mais. O PURE observou pessoas, não sorteou tratamentos — as duas coisas andam juntas, mas ninguém mostrou que uma puxa a outra. A preensão é o termômetro, não a febre. Treinar antebraço com um aperta-mão de borracha empurra o ponteiro sem tocar no que o ponteiro media: é decorar as respostas de uma prova que existia para descobrir se você tinha estudado.

## 3. O que move o ponteiro de verdade

Se a preensão resume o sistema muscular inteiro, é o sistema inteiro que você treina — força no corpo todo, não na mão.

:::stat[10–20%]
Redução de risco de morte associada a treino de força, concentrada entre meia hora e uma hora por semana (Momma et al., BJSM, 2022)
:::

A revisão por trás desse número juntou 16 estudos: quem fazia algum treino de força morria menos e tinha menos doença cardiovascular, câncer e diabetes. A curva de dose tem forma de J — desce, chega no fundo e volta a subir de leve. Só que isso vem de apenas quatro estudos com dados suficientes. É pista, não lei.

Meia hora por semana soa baixo demais para ser verdade. Uma revisão na Sports Medicine foi procurar o piso do que funciona e achou pouco (Androulakis-Korakakis et al., 2020). Basta uma série de 6 a 12 repetições, com carga entre 70% e 85% do seu máximo, levada perto da falha, duas ou três vezes por semana. Isso já produz ganho de força mensurável em quem nunca treinou. "Perto da falha" é parar quando a próxima repetição não sairia com técnica. "Máximo" é o 1RM: o peso mais pesado que você levanta uma vez só.

Frequência importa menos do que a internet insiste: com o mesmo volume semanal, treinar uma, duas ou três vezes dá quase no mesmo. Duas vezes por semana não é o plano B de quem não tem tempo. É o protocolo.

:::list-icon
barbell | Escolha de 4 a 6 exercícios compostos — os que movem várias articulações de uma vez: agachamento, terra, remada, supino, puxada, desenvolvimento.
repeat | De 1 a 3 séries de 6 a 12 repetições, duas vezes por semana. Pare com 1 ou 2 repetições boas sobrando.
trending-up | Anote carga e repetições. Se o mesmo peso sai mais leve que na semana passada, suba: a progressão é o treino, o resto é frequentar academia.
hand-left | Deixe luva e alça de pegada de fora nos primeiros meses: elas terceirizam a parte que este artigo mede.
speedometer | Peça o dinamômetro na avaliação física a cada seis meses. Sem aparelho, pendure-se numa barra fixa e cronometre — não é o teste, mas se você não chega a dez segundos, já tem a resposta.
:::

Três leituras estragam tudo. A primeira é a de sempre: treino de força é estética. Academia vende espelho, e é fácil confundir o meio com o motivo — só que o desfecho medido aqui não é foto, é morte, infarto, câncer, diabetes. A segunda é o erro oposto: achar que precisa de cinco sessões por semana. A faixa com evidência mais firme é constrangedora de tão pequena. A terceira é a mais cara: medir o aperto e treinar o aperto. O número na mão resume tudo que existe acima do punho, e ninguém melhora um resumo editando o resumo.

A balança te diz quanto você pesa; o aparelho de pressão, como anda a bomba. Nenhum dos dois te diz quanto corpo funcional ainda sobrou — e é essa a conta que a década seguinte cobra. Descobrir leva um minuto. Mudar o número dura o resto da vida e cabe em meia hora de terça e quinta.

:::source[Leong et al., 2015 · The Lancet 386(9990):266–273 · n=139.691, 17 países](https://pubmed.ncbi.nlm.nih.gov/25982160/)
$b$,
  $b$There's a cheap device almost no doctor's office bothers to own: a hand dynamometer, a metal grip you squeeze as hard as you can while a dial records the kilos. Three squeezes per hand, keep the best, one minute.

Between 2003 and 2009, researchers ran exactly that drill on 142,861 adults aged 35 to 70, across 17 rich, middle-income and poor countries. Then they spent four years recording who died: 3,379 deaths. When the numbers came out, grip strength predicted death from any cause better than systolic blood pressure — the top number on the cuff every clinic owns.

Every 5 kg of missing grip came with a 16% higher risk of dying. And this is where almost everyone draws the wrong conclusion.

## 1. A handshake against the blood pressure cuff

The study is PURE, published in The Lancet in 2015. Its core finding: a hazard ratio of 1.16 per 5 kg of lost grip. A hazard ratio compares the rate at which deaths pile up in two groups: the weaker-gripped group was dying at a 16% higher rate at any point in the follow-up. Cardiovascular death, 17%. Heart attack, 7%. Stroke, 9%.

The line that traveled the world — "your handshake predicts death better than your blood pressure" — is in the paper, but it lost its edges on the way out. The authors matched grip against systolic pressure alone, not against a full risk calculation that stacks pressure, cholesterol, age, smoking and diabetes. And there's the difference that settles it: high pressure comes down with medication and less salt, within weeks. Grip obeys none of that. A number can predict better and still make a far worse target.

The second edge is age: PURE enrolled people from 35 to 70. It says nothing about you at 27, or about your 84-year-old grandmother. Outside that band you're extrapolating, not reading the study.

## 2. The hand isn't the muscle that matters

Look at the order of those numbers: grip weighs more on dying of anything than on having a heart attack. That's the clue to why it works — and the clue isn't in the hand.

Diseases that hit muscle and nothing else are rare. So when grip drops, it's hardly ever a hand problem: it's the whole body sliding at once — muscle mass, nerve conduction, nutrition, the ability to get back up after pneumonia. Avan Sayer and Tom Kirkwood, in the comment that ran beside PURE in The Lancet, put it this way:

> Loss of grip strength is unlikely to lie on a single final common pathway for the adverse effects of ageing, but it might be a particularly good marker of underlying ageing processes, perhaps because of the rarity of muscle-specific diseases contributing to change in muscle function.
> — Sayer and Kirkwood, The Lancet, 2015

Grip peaks in your early thirties and curves down from there; after 50, it sheds roughly 10% a decade. When that loss passes a threshold and arrives together with lost muscle mass, it gets a name: sarcopenia, the progressive loss of muscle and strength that comes with age.

European researchers set a screening cutoff (EWGSOP2, 2019): under 27 kg for men and 16 kg for women raises the flag — only the flag, since a diagnosis also needs muscle mass and walking speed. That cutoff came out of a British reference group. PURE published its own medians by region: in South America, at 35 to 40 a man squeezes 45 kg and a woman 29; by 61 to 70 they fall to 37 and 23. The authors say it plainly — no single worldwide cutoff works. Use it as a ruler, not a diagnosis.

And here's the part that dismantles the article if you read fast: no trial has shown that raising grip on its own makes anyone live longer. PURE watched people, it didn't assign them treatments — the two move together, but nobody has shown that one pulls the other. Grip is the thermometer, not the fever. Drilling your forearms nightly with a rubber gripper moves the needle without touching anything the needle was reading. It's memorizing the answers to an exam that existed to find out whether you'd studied.

## 3. What actually moves the needle

If grip summarizes the whole muscular system, the whole system is what you train — strength everywhere, not in the hand.

:::stat[10–20%]
Lower risk of death linked to strength training, concentrated between thirty and sixty minutes a week (Momma et al., BJSM, 2022)
:::

The review behind that number pooled 16 cohort studies: people who did any muscle-strengthening activity died less, and had less cardiovascular disease, cancer and diabetes. The dose curve is J-shaped — it drops, bottoms out, then ticks back up. But that half rests on only four studies with usable data. Strong hint, not law.

Half an hour a week sounds too small to be true. A Sports Medicine review hunted for the floor of what works and found it (Androulakis-Korakakis et al., 2020). One set of 6 to 12 reps, at roughly 70 to 85% of your max, taken close to failure, two or three times a week. That alone produces measurable strength gains in people who have never trained. "Close to failure" means stopping when the next rep wouldn't come out clean. "Max" is the 1RM: the heaviest weight you can lift exactly once.

Frequency matters less than the internet insists: when weekly volume is held equal, training once, twice or three times lands in the same place. Twice a week isn't the fallback for busy people. It's the protocol.

:::list-icon
barbell | Pick 4 to 6 compound lifts — the ones that move several joints at once: squat, deadlift, row, bench, pulldown, overhead press.
repeat | 1 to 3 sets of 6 to 12 reps, twice a week. Stop with 1 or 2 good reps left in you.
trending-up | Log the load and the reps. If the same weight feels lighter than last week, add to it. Progression is the training; the rest is attending a gym.
hand-left | Leave gloves and straps out for the first few months: they outsource the exact thing this article measures.
speedometer | Ask for the dynamometer at your gym assessment twice a year. No device? Hang from a bar and time it — not the test, but if you can't clear ten seconds, you have your answer.
:::

Three readings ruin all of it. The first is the old one: strength training is about looks. Gyms sell mirrors, and the medium is easy to mistake for the point — but the outcomes measured in these studies aren't photographs, they're death, heart attacks, cancer, diabetes. The second is the opposite error: assuming you need five sessions a week. The band where the evidence is firmest is embarrassingly small. The third is the expensive one: measuring grip and then training grip. The number in your hand summarizes everything above the wrist, and nobody improves a summary by editing the summary.

Your scale tells you what you weigh. Your cuff tells you how the pump is doing. Neither tells you how much working body you have left — and that's the bill the next decade sends. Finding out takes a minute. Changing the number is the long job: it lasts the rest of your life and fits into half an hour on Tuesday and Thursday.

:::source[Leong et al., 2015 · The Lancet 386(9990):266–273 · n=139,691, 17 countries](https://pubmed.ncbi.nlm.nih.gov/25982160/)
$b$,
  array[$t$Meça: três apertos por mão num dinamômetro, anote o melhor. Em 142.861 adultos de 35 a 70 anos, cada 5 quilos a menos de preensão vieram com 16% mais risco de morte por qualquer causa (PURE, Lancet 2015).$t$,
    $t$O aperto ganhou da pressão sistólica como preditor isolado, não de um cálculo completo de risco. E pressão alta cai com remédio em semanas; preensão não obedece a isso. Prever melhor não é ser um alvo melhor.$t$,
    $t$Nenhum ensaio clínico mostrou que aumentar só a preensão faz viver mais. A alavanca é treino de força no corpo todo: 4 a 6 exercícios compostos, 6 a 12 repetições, duas vezes por semana — a evidência mais firme mora entre 30 e 60 minutos semanais.$t$,
    $t$Os cortes europeus (27 kg para homens, 16 kg para mulheres) saíram de uma população britânica. Na América do Sul, a mediana de um homem de 35 a 40 anos é 45 kg e a de uma mulher, 29 kg. Régua, não diagnóstico.$t$]::text[],
  array[$t$Measure it: three squeezes per hand on a dynamometer, keep the best. Across 142,861 adults aged 35 to 70, every 5 kg of missing grip came with a 16% higher risk of death from any cause (PURE, Lancet 2015).$t$,
    $t$Grip beat systolic pressure as a single predictor, not as a full risk model. And high pressure comes down with medication in weeks; grip doesn't. Predicting better doesn't make it a better target.$t$,
    $t$No trial has shown that raising grip alone extends life. The lever is whole-body strength training: 4 to 6 compound lifts, 6 to 12 reps, twice a week — the firmest evidence sits between 30 and 60 minutes a week.$t$,
    $t$The European cutoffs (27 kg for men, 16 kg for women) came out of a British reference group. In South America the median man aged 35 to 40 pulls 45 kg and the median woman 29 kg. A ruler, not a diagnosis.$t$]::text[],
  $t$No Perceva isso vira duas coisas dentro da sub Força. Primeiro, uma skill em quilos de preensão: registre a mão direita e a esquerda separadas, a cada seis meses, e em dois anos você tem uma curva em vez de uma lembrança. Segundo, a tarefa que de fato entorta essa curva — treino de força com recorrência semanal e alvo 2. Guarde carga e repetições na descrição da tarefa: quando o mesmo peso sair mais leve, é hora de subir. A skill mostra o resultado; a tarefa é o que produz o resultado.$t$,
  $t$In Perceva this turns into two things under the Strength sub. First, a skill measured in kilos of grip: log the right and left hand separately, every six months, and in two years you have a curve instead of a memory. Second, the task that actually bends that curve — strength training on a weekly recurrence with a target of 2. Keep load and reps in the task description: when the same weight feels lighter, add to it. The skill shows the result; the task is what produces it.$t$,
  $t$https://pubmed.ncbi.nlm.nih.gov/25982160/$t$,
  $t$Leong et al., 2015 · The Lancet 386(9990):266–273 · n=139.691, 17 países, seguimento mediano de 4 anos$t$,
  $t$Leong et al., 2015 · The Lancet 386(9990):266–273 · n=139,691, 17 countries, median 4-year follow-up$t$,
  $rl${"template_type":"explainer","template_version":2,"voice_principles_applied":["1 — Três ideias, não sete: PURE e seus limites / por que a mão fala pelo corpo inteiro / o que realmente move o ponteiro. Sarcopenia, curva de declínio e cortes populacionais foram fundidos dentro da ideia 2 em vez de virarem seções próprias.","2 — Prosa em primeiro lugar: apenas 2 cards no corpo (um :::stat com a dose de treino e um :::list-icon com a receita), mais o :::source final. Os mitos viraram prosa; a citação de Sayer e Kirkwood usa blockquote markdown, não o directive :::quote.","3 — PT nativo e EN nativo: o PT foi escrito primeiro e travado; o EN foi reescrito do zero, com cadência própria (o fecho em inglês fala de 'the bill the next decade sends'; o português fala de 'a conta que a década seguinte cobra' com outro ritmo de frase). Zero ocorrências das expressões banidas.","4 — Jargão definido na primeira menção: dinamômetro, razão de risco, sarcopenia, exercício composto, perto da falha, 1RM, e a diferença entre observar pessoas e sortear tratamentos.","5 — Exemplos concretos no lugar de listas de substantivos abstratos: as medianas sul-americanas em quilos, os seis exercícios nomeados um a um, e o teste caseiro da barra fixa com dez segundos.","6 — Leitura em voz alta: frases curtas, média perto de 16 palavras, você/you consistente do início ao fim, sem alternar com sujeito abstrato.","Caveats honestos exigidos pelo dossiê: comparação contra pressão sistólica sozinha, coorte de 35 a 70 anos, cortes europeus eurocêntricos ao lado das medianas do PURE, curva em J baseada em apenas 4 estudos, e a ausência de qualquer ensaio mostrando que aumentar a preensão por si só estende a vida."],"steps":[{"id":"hook","answer_pt":"Abrir pelo aparelho, não pela estatística: o dinamômetro de mão custa pouco, leva um minuto e quase nenhum consultório usa. Só depois entra o número grande (142.861 adultos, 17 países, o aperto batendo a pressão sistólica) e, no fim do gancho, a armadilha declarada: é exatamente aqui que quase todo mundo tira a conclusão errada. A curiosidade que sustenta o texto é qual é a conclusão errada.","answer_en":"Open on the device, not the statistic: a hand dynamometer is cheap, takes a minute, and almost no clinic uses it. Only then does the big number land (142,861 adults, 17 countries, grip beating systolic pressure), and the hook closes by naming the trap: this is exactly where almost everyone draws the wrong conclusion. The curiosity that carries the piece is which conclusion that is."},{"id":"thesis","answer_pt":"A força de preensão é o melhor marcador barato de envelhecimento que existe, e é um alvo péssimo: você mede na mão e treina no corpo inteiro. O bloco :::stat não repete o 16% do gancho — ele carrega a dose de treino (10 a 20% de redução de risco, concentrada entre 30 e 60 minutos por semana), que é a parte acionável e aparece uma vez só.","answer_en":"Grip strength is the best cheap marker of ageing we have, and a terrible target: you measure it in the hand and train it in the whole body. The :::stat block deliberately does not repeat the hook's 16% — it carries the training dose instead (10 to 20% lower risk, concentrated between 30 and 60 minutes a week), the actionable half, stated exactly once."},{"id":"real_definition","answer_pt":"O que as pessoas acham: preensão é força de antebraço, coisa de escalador e de quem abre pote. O que é de fato: um resumo do sistema neuromuscular inteiro, que funciona justamente porque doenças exclusivas do músculo são raras — se a mão caiu, o corpo caiu. Optei por prosa em vez de :::compare porque o contraste é uma frase (termômetro versus febre) e um card gastaria orçamento visual que o list-icon da receita precisa mais.","answer_en":"What people assume: grip is forearm strength, a climber's trait, the jar-opening muscle. What it actually is: a summary of the entire neuromuscular system, and it works precisely because muscle-only diseases are rare — if the hand dropped, the body dropped. I wrote the contrast as prose instead of :::compare because it fits in one line (thermometer versus fever), and a card would spend visual budget the recipe list-icon needs more."},{"id":"stakes","answer_pt":"Uma estatística de ferro: razão de risco de 1,16 para morte por qualquer causa a cada 5 kg a menos de preensão (IC 95% 1,13-1,20), em 139.691 pessoas com desfecho conhecido, PURE, The Lancet 2015. Vem com três limites explícitos no corpo: a comparação foi contra a pressão sistólica sozinha e não contra um escore completo de risco; pressão é modificável por remédio e preensão não; e a coorte tinha 35 a 70 anos, então nada do texto vale para os 27 nem para os 84.","answer_en":"One ironclad statistic: a hazard ratio of 1.16 for all-cause mortality per 5 kg of lost grip (95% CI 1.13-1.20), across 139,691 people with known vital status, PURE, The Lancet 2015. It ships with three limits stated in the body: the comparison was against systolic pressure alone, not a full risk score; pressure is modifiable by medication and grip is not; and the cohort was 35 to 70, so nothing here speaks for a 27-year-old or an 84-year-old."},{"id":"mechanism","answer_pt":"Duas passagens. A primeira é a assimetria dos próprios números do PURE: o aperto pesa mais sobre morte por qualquer causa (16%) do que sobre infarto (7%) ou AVC (9%) — se fosse um mecanismo cardíaco, seria o contrário. A segunda é a explicação de Sayer e Kirkwood, citada em blockquote: doenças exclusivas do músculo são raras, então a força da mão lê o envelhecimento de fundo. Fecha em exemplo concreto e verificável: pico por volta dos 30 e poucos, cerca de 10% por década depois dos 50, e as medianas sul-americanas do PURE (homem de 35-40 anos, 45 kg; mulher, 29 kg) contra o corte europeu de 27/16 kg.","answer_en":"Two moves. First, the asymmetry inside PURE's own numbers: grip weighs more on all-cause death (16%) than on heart attack (7%) or stroke (9%) — a cardiac mechanism would show the opposite. Second, Sayer and Kirkwood's explanation, quoted as a blockquote: muscle-only diseases are rare, so hand strength reads background ageing. It lands on a concrete, checkable example: peak in the early thirties, roughly 10% a decade after 50, and PURE's South American medians (man aged 35-40, 45 kg; woman, 29 kg) set against the European 27/16 kg cutoff."},{"id":"myth_busts","answer_pt":"Três mitos, escritos como um parágrafo de prosa e não como list-icon (a não-negociável 10 vence a sugestão do template). Mito 1 — treino de força é estética; steelman: academia realmente vende espelho e transformação visual; correção: o desfecho medido nesses estudos é morte, infarto, câncer, diabetes. Mito 2 — precisa de cinco sessões por semana; steelman: mais parece sempre melhor; correção: a faixa com evidência mais firme é de 30 a 60 minutos semanais. Mito 3, o mais caro — medir o aperto e treinar o aperto; steelman: parece coerente atacar exatamente o que você mede; correção: o número da mão é um resumo do que existe acima do punho, e ninguém melhora um resumo editando o resumo.","answer_en":"Three myths, written as one prose paragraph rather than a list-icon (non-negotiable 10 overrides the template's suggestion). Myth 1 — strength training is about looks; steelman: gyms genuinely sell mirrors and visual transformation; correction: the outcomes measured in these studies are death, heart attacks, cancer, diabetes. Myth 2 — you need five sessions a week; steelman: more always looks better; correction: the firmest evidence sits between 30 and 60 minutes a week. Myth 3, the expensive one — measuring grip and then training grip; steelman: attacking exactly what you measure sounds coherent; correction: the number in your hand summarizes everything above the wrist, and nobody improves a summary by editing the summary."},{"id":"recipe","answer_pt":"Cinco ações no único :::list-icon do corpo, todas executáveis amanhã: 4 a 6 exercícios compostos nomeados um a um; 1 a 3 séries de 6 a 12 repetições duas vezes por semana, parando com 1 ou 2 repetições boas sobrando; anotar carga e repetições para governar a progressão; nada de luva e alça de pegada nos primeiros meses; e remedir com dinamômetro a cada seis meses, com a barra fixa e o cronômetro como plano B honestamente rotulado como não sendo o teste.","answer_en":"Five actions inside the body's single :::list-icon, all doable tomorrow: 4 to 6 compound lifts, each one named; 1 to 3 sets of 6 to 12 reps twice a week, stopping with 1 or 2 good reps left; logging load and reps so progression has something to govern it; no gloves or straps for the first months; and re-measuring on a dynamometer every six months, with the bar hang and a stopwatch as a fallback openly labelled as not being the test."}],"main_points":[{"id":"1_pure_contra_pressao","what_pt":"O PURE (Lancet 2015, 142.861 adultos de 35 a 70 anos em 17 países) achou razão de risco de 1,16 para morte por qualquer causa a cada 5 kg a menos de preensão, e o aperto previu melhor que a pressão sistólica.","why_pt":"Porque desloca o treino de força do território da estética para o de sinal vital mensurável: o desfecho aqui é morte, não foto.","how_to_know_pt":"Vale se você tem entre 35 e 70 anos. E vale como leitura, não como alvo: pressão alta cai com remédio em semanas, preensão não obedece a nada disso.","what_en":"PURE (Lancet 2015, 142,861 adults aged 35 to 70 across 17 countries) found a hazard ratio of 1.16 for all-cause death per 5 kg of lost grip, and grip predicted better than systolic pressure.","why_en":"Because it moves strength training out of the aesthetics bucket and into measurable vital sign: the outcome here is death, not a photograph.","how_to_know_en":"It applies if you're between 35 and 70. And it applies as a reading, not as a target: high blood pressure comes down with medication in weeks, grip obeys none of that."},{"id":"2_marcador_nao_alavanca","what_pt":"A mão funciona como marcador porque doenças exclusivas do músculo são raras: quando a preensão cai, o que caiu foi o sistema neuromuscular inteiro (Sayer e Kirkwood, Lancet 2015).","why_pt":"Porque é o ponto onde quase todo leitor erra: a preensão é termômetro, não febre, e nenhum ensaio clínico mostrou que aumentá-la sozinha estende a vida.","how_to_know_pt":"Compare seu número com régua, não com diagnóstico: corte europeu de 27 kg (homens) e 16 kg (mulheres) contra as medianas sul-americanas do PURE (45 kg e 29 kg aos 35-40 anos). Nenhum corte único serve para o mundo inteiro.","what_en":"The hand works as a marker because muscle-only diseases are rare: when grip drops, what dropped was the whole neuromuscular system (Sayer and Kirkwood, Lancet 2015).","why_en":"Because this is where almost every reader goes wrong: grip is the thermometer, not the fever, and no trial has shown that raising it alone extends life.","how_to_know_en":"Read your number as a ruler, not a diagnosis: the European cutoff of 27 kg (men) and 16 kg (women) against PURE's South American medians (45 kg and 29 kg at ages 35-40). No single cutoff travels worldwide."},{"id":"3_receita_minima","what_pt":"A alavanca é treino de força no corpo todo: 4 a 6 exercícios compostos, 1 a 3 séries de 6 a 12 repetições a 70-85% do 1RM, perto da falha, duas vezes por semana.","why_pt":"Porque a revisão de 16 coortes (Momma et al., BJSM 2022) associa treino de força a 10-20% menos risco de morte e doença, e o piso que funciona para iniciantes é absurdamente baixo (Androulakis-Korakakis et al., Sports Medicine 2020).","how_to_know_pt":"Se você passa o dia sentado e nunca pegou em peso, este é o ponto de entrada. Sinal de que está funcionando: a mesma carga saindo mais leve que na semana passada. Cuidado com a curva em J, que vem de apenas 4 estudos com dados suficientes.","what_en":"The lever is whole-body strength training: 4 to 6 compound lifts, 1 to 3 sets of 6 to 12 reps at 70-85% of 1RM, close to failure, twice a week.","why_en":"Because the 16-cohort review (Momma et al., BJSM 2022) links strength training to 10-20% lower risk of death and disease, and the floor that works for beginners is absurdly low (Androulakis-Korakakis et al., Sports Medicine 2020).","how_to_know_en":"If you sit all day and have never lifted, this is the entry point. The sign it's working: the same load feeling lighter than last week. Handle the J-curve with care — it rests on only 4 studies with usable data."}]}$rl$::jsonb
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
where material_id = (select id from public.learning_material where slug = $slug$grip-strength-longevity$slug$);

insert into public.learning_material_sub (material_id, sub_id)
select m.id, s.sub_id
from public.learning_material m
cross join (values ($t$strength$t$)) as s(sub_id)
where m.slug = $slug$grip-strength-longevity$slug$
on conflict do nothing;
