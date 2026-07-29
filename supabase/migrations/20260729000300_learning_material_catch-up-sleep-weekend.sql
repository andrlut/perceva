-- migration: 20260729000300_learning_material_catch-up-sleep-weekend.sql
-- NOTE: timestamp 20260729000290 was already taken on remote by an out-of-band
--   migration (learning_covers_bigrelease), so this file uses ...000300.
-- Learning material: catch-up-sleep-weekend (explainer) — health / sleep sub-gap fill.
-- Autonomous Learning publisher run (commit-direct mode, 2026-07-29).
-- Planner: 'sleep' was a coverage gap — only glossary-sleep + summary-why-we-sleep existed,
--   both untouched by the #329 rewrite. Topic is distinct from each and genuinely contested.
-- Researcher: 10 facts, all peer-reviewed except the ESC 2024 congress abstract (flagged as
--   such in the body, since the conflict between it and Chaput 2024 IS the story).
-- Reviewer: round 1 FAIL (translate_jargon — 'sensibilidade a insulina' undefined in the
--   opening :::stat); fixed inline + 4 warn fixes; round 2 PASSED with 5 accepted warnings.
-- Idempotent upsert by slug (INSERT ... ON CONFLICT DO UPDATE); sub links reset per material.
-- migrations are write-once; never edit after applying.

insert into public.learning_material (
  slug, type, dimension_id, topic, reading_minutes,
  title_pt, title_en,
  summary_pt, summary_en,
  body_pt, body_en,
  takeaways_pt, takeaways_en,
  signs_pt, signs_en,
  tracking_pt, tracking_en,
  source_url, source_label_pt, source_label_en,
  reasoning_log
) values (
  $slug$catch-up-sleep-weekend$slug$,
  $t$explainer$t$,
  $t$health$t$,
  $t$catch-up sleep$t$,
  7,
  $t$O sábado paga a dívida de sono?$t$,
  $t$Does Saturday Repay Your Sleep Debt?$t$,
  $t$A ciência está genuinamente dividida sobre dormir até tarde no fim de semana — e o fator decisivo parece ser o horário, não as horas extras.$t$,
  $t$The science is genuinely split on weekend catch-up sleep — and the decisive factor looks like timing, not the extra hours.$t$,
  $body_pt$Sexta à noite você faz a conta de cabeça. Segunda dormiu 5h30, terça 6h, quarta e quinta 5h. Faltam umas oito horas no caixa. Sábado você acorda às 11h, domingo às 10h30, e a conta parece paga.

A sensação é real. A dúvida é se o seu corpo assina embaixo. Depois de vinte anos de pesquisa, ninguém fechou essa resposta. Dois times de cientistas pegaram a mesma base britânica, com quase 90 mil pessoas, e chegaram a conclusões opostas. Um viu 19% menos doença cardíaca em quem mais compensava. O outro não viu benefício nenhum.

Essa briga é o assunto aqui — porque existe um detalhe que aparece dos dois lados dela e quase ninguém olha: o horário.

:::stat[9% a 27%]
Queda na sensibilidade à insulina — o quanto o corpo consegue tirar açúcar do sangue — após cinco noites curtas — que dois dias de sono livre no fim de semana não recuperaram. Depner et al., Current Biology 2019, n=36.
:::

## 1. O único experimento de verdade não animou ninguém

Quase tudo que se sabe sobre sono compensatório vem de observar gente vivendo a vida, e observação mostra associação, não causa. Existe uma exceção. Em 2019, Christopher Depner e Kenneth Wright trancaram 36 adultos jovens e saudáveis num laboratório do Colorado por duas semanas e controlaram cada hora de sono.

Um grupo dormiu 9 horas por noite. Outro ficou restrito a 5 horas, sem folga. O terceiro dormiu 5 horas por cinco noites, ganhou dois dias livres e voltou pra rotina curta — o seu fim de semana, replicado em laboratório.

O terceiro grupo dormiu mesmo: mais de uma hora extra por noite de recuperação. E aí veio a parte ruim. A sensibilidade à insulina — o quanto o corpo responde bem ao hormônio que tira açúcar do sangue e guarda — caiu entre 9% e 27% neles. No grupo que nunca recuperou, caiu cerca de 13%. O fim de semana não protegeu. No músculo e no fígado a resistência ficou pior, e os dois grupos restritos comeram mais à noite e ganharam peso.

Segure a ressalva: são 36 pessoas jovens e saudáveis, por duas semanas. É o desenho mais forte pra provar causa e o mais fraco pra dizer o que acontece com você, aos 45, ao longo de uma década.

E tem o que o estudo não mede. Dormir mais no sábado recupera, sim, justamente aquilo que você mais sente: humor, cansaço, atenção. Uma revisão sistemática de 2025 (Zhou e Xue) chama isso de recuperação parcial de curto prazo, e conclui que compensar "não deve ser considerado uma estratégia sustentável pra quitar dívida de sono". Você acorda melhor. O metabolismo não acorda junto.

## 2. Por que os estudos brigam entre si

Em 2024, Jean-Philippe Chaput e colegas foram atrás da resposta em escala. Pegaram 73.513 adultos do UK Biobank com sensor no pulso, sono medido por aparelho e não por memória, e acompanharam por oito anos. Quem dormia pelo menos 2 horas a mais no fim de semana não morreu menos nem teve menos doença cardiovascular. O risco de morte apareceu 17% maior, com margem de erro larga o bastante pra incluir "nenhum efeito", o que em estatística quer dizer que nada pode ser afirmado.

Meses antes, no congresso europeu de cardiologia, um grupo do Hospital Fuwai, em Pequim, apresentou o oposto. Mesma coorte — o mesmo grupo acompanhado ao longo dos anos —, 90.903 pessoas, 14 anos de acompanhamento: os 25% que mais compensavam tiveram 19% menos doença cardíaca.

> Quem tem mais sono compensatório no fim de semana tem taxas significativamente menores de doença cardíaca do que quem tem menos. — Zechen Liu, Hospital Fuwai, Congresso ESC 2024

Foi essa a manchete que rodou o mundo. Continua sendo um resumo de congresso, sem revisão por pares. Pista, não conclusão.

Mesma base, resultados opostos. Uma pista sobre o que os separa veio do Brasil. O ELSA-Brasil (Peixoto de Miranda et al., 2025) acompanha 1.832 adultos, idade média de 49 anos, com sensor no pulso e tomografia do coração. Quem compensava mais de 90 minutos teve 38% menos chance de desenvolver cálcio novo nas artérias coronárias — o depósito que marca o começo de uma placa. Só que o efeito existia apenas em quem realmente dormia pouco na semana. Entre quem já dormia o suficiente, sumia.

Num estudo japonês de 2023 (Yoshiike et al.), o efeito chega a inverter de sinal: uma hora de compensação em quem já dormia 6 horas veio com metade do risco de morte; a mesma hora, em quem dormia menos de 5h30, veio com quase o dobro. A dose também não é livre. Uma análise americana de 2025 (dados do NHANES, na BMC Medicine) achou uma curva em U, com o menor risco de resistência à insulina por volta de 40 a 60 minutos extras.

E nada disso resolve um problema de fundo. Dormir pouco na semana não é escolha aleatória: é marcador de turno noturno, de dois empregos, de filho pequeno, de apneia do sono não tratada — a condição em que a respiração para dezenas de vezes por noite. Quem mais precisa do sábado já chega mais doente.

Um editorial de 2024 na revista Sleep dá o fecho honesto: eles brigam porque medem coisas diferentes. Compensar ajuda no curto prazo, em atenção e desempenho; a irregularidade de horário cobra no longo prazo, em saúde mental e mortalidade.

## 3. O ponto em que os dois lados concordam

Em 2006, o cronobiólogo Till Roenneberg batizou o fenômeno de jet lag social: a diferença entre o meio do seu sono nos dias de trabalho e o meio nos dias livres. Parece abstrato até você calcular o seu. Se na semana você dorme da meia-noite às 6h, o meio é 3h da manhã. Se no sábado você dorme das 2h às 11h, o meio vira 6h30. São três horas e meia — como atravessar três fusos horários toda sexta e voltar toda segunda, sem sair de casa. Estimativas de segunda mão sugerem que cerca de 69% dos adultos em países industrializados carregam pelo menos uma hora disso.

Em 2024, um grupo liderado por Daniel Windred processou mais de 10 milhões de horas de dados de sensor, de 60.977 adultos britânicos. Dali saiu um índice de regularidade do sono: o quanto os seus horários de deitar e levantar se repetem de um dia pro outro. Os mais regulares morreram de 20% a 48% menos que os mais irregulares, ajustando idade, sexo, etnia e estilo de vida. A regularidade previu melhor que a duração total.

> A consistência dos horários de sono do dia a dia prevê melhor os desfechos de saúde do que a quantidade total de sono. — Larson & Gehrman, Sleep, 2024

É por isso que dormir até as 11h no sábado faz duas coisas ao mesmo tempo, e elas brigam entre si. Você repõe horas, e isso alivia. E empurra o seu relógio biológico pra frente, o que faz a noite de domingo render menos e a segunda começar pior.

Três mal-entendidos antes da receita:

:::list-icon
close-circle | **"Durmo até tarde no sábado e zero a dívida."** Você zera o cansaço, e isso é real. A conta metabólica e o relógio não zeram.
close-circle | **"Quanto mais eu dormir, melhor."** A curva é em U. O menor risco fica perto de uma hora extra; três horas a mais empurram o seu relógio e você chega pior na segunda.
close-circle | **"Compensar corta 20% do risco cardíaco."** Isso saiu de um resumo de congresso ainda não publicado. Outra análise da mesma coorte, com sono medido por sensor, não achou benefício algum.
:::

O que fazer com isso já neste fim de semana:

:::list-icon
alarm | **Ancore o horário de acordar.** Deixe a diferença entre semana e fim de semana em no máximo uma hora — é ela que segura o relógio no lugar.
moon | **Se for compensar, compense pelo começo da noite.** Uma hora extra ao deitar mais cedo não desloca o seu relógio. A mesma hora no fim da manhã desloca.
sunny | **Pegue sol nos primeiros 30 minutos depois de acordar** — inclusive no domingo. Luz de manhã é o sinal mais forte pra reancorar o relógio.
analytics | **Use o sábado como diagnóstico.** Se você dorme três horas a mais quando ninguém te acorda, o problema não está no fim de semana. Está na semana.
medkit | **Se compensar nunca resolve, investigue.** Ronco alto, pausas na respiração e cansaço mesmo com 8 horas na cama apontam pra apneia do sono.
:::

A metáfora da dívida é o que engana. Dívida sugere um saldo que você quita com um depósito no fim do mês. O sono é um relógio, não um caixa — e relógio não se acerta com volume, se acerta com repetição. Dormir até tarde no sábado é um curativo: alivia o que você sente sem devolver o que você perdeu. O que devolve é chegar na sexta sem precisar dele.

:::source[Depner et al., 2019 · Current Biology 29(6) · ensaio randomizado em laboratório, n=36](https://doi.org/10.1016/j.cub.2019.01.069)
:::source[Chaput et al., 2024 · Sleep 47(11) · UK Biobank, acelerômetro, n=73.513](https://doi.org/10.1093/sleep/zsae135)
:::source[Windred et al., 2024 · Sleep 47(1) · índice de regularidade do sono, n=60.977](https://doi.org/10.1093/sleep/zsad253)$body_pt$,
  $body_en$By Friday night you have already run the numbers. Five and a half hours Monday, six Tuesday, five Wednesday and Thursday. You are down about eight hours. Saturday you get up at eleven, Sunday at half past ten, and the ledger looks square.

The feeling is real. The question is whether your body agrees. After twenty years of research, nobody has closed the case. Two teams of scientists took the same British dataset of nearly 90,000 people and reached opposite conclusions. One found 19% less heart disease among the biggest catch-up sleepers. The other found no benefit at all.

That fight is the story here — because one detail keeps showing up on both sides of it, and almost nobody watches it: timing.

:::stat[9% to 27%]
Drop in insulin sensitivity — how well the body clears sugar from the blood — after five short nights — which two full nights of unrestricted weekend sleep failed to repair. Depner et al., Current Biology 2019, n=36.
:::

## 1. The one real experiment was not encouraging

Almost everything known about catch-up sleep comes from watching people live their lives, and watching shows association, not cause. There is one exception. In 2019, Christopher Depner and Kenneth Wright locked 36 young, healthy adults in a Colorado lab for two weeks and controlled every hour of their sleep.

One group slept nine hours a night. A second was held to five, straight through. The third slept five hours for five nights, then got two free days to sleep as much as it wanted before going back to the short schedule. That is your weekend, rebuilt under a microscope.

That third group really did sleep in: over an extra hour per recovery night. Then came the bad part. Their insulin sensitivity — how well the body responds to the hormone that pulls sugar out of the blood and stores it — fell by 9% to 27%. In the group that never recovered, it fell about 13%. The weekend protected nobody. In muscle and liver, resistance was worse, and both restricted groups ate more after dinner and gained weight.

Hold the caveat: 36 young, healthy people, over two weeks. It is the strongest design for proving cause and the weakest for telling you what happens to you at 45, across a decade.

And there is what the study does not measure. Sleeping in on Saturday genuinely restores the part you feel most: mood, fatigue, attention. A 2025 systematic review (Zhou and Xue) calls that partial short-term recovery, and concludes that catching up "should not be considered a sustainable strategy for sleep debt repayment." You wake up better. Your metabolism does not wake up with you.

## 2. Why the studies contradict each other

In 2024, Jean-Philippe Chaput and colleagues went after the answer at scale: 73,513 UK Biobank adults wearing wrist sensors — sleep measured by device, not recalled — followed for eight years. People sleeping at least two extra hours on weekends did not die less often or develop less cardiovascular disease. Death risk came out 17% higher, with a margin of error wide enough to include "no effect," which in statistics means nothing can be claimed.

Months earlier, at the European cardiology congress, a team from Fuwai Hospital in Beijing presented the opposite. Same cohort — the same group of people tracked over years — 90,903 people, 14 years of follow-up: the top 25% of catch-up sleepers had 19% less heart disease.

> Those who have the most catch-up sleep at weekends have significantly lower rates of heart disease than those with the least. — Zechen Liu, Fuwai Hospital, ESC Congress 2024

That is the headline that travelled the world. It remains a congress abstract with no peer review behind it. A lead, not a verdict.

Same database, opposite answers. What separates them? A clue came out of Brazil. The ELSA-Brasil cohort (Peixoto de Miranda et al., 2025) follows 1,832 adults, average age 49, with wrist sensors and a CT scan of the heart. Those catching up more than 90 minutes had 38% lower odds of developing new calcium in their coronary arteries — the deposit that marks an early plaque. But the effect only existed in people genuinely short on sleep during the week. Among those already sleeping enough, it vanished.

In a 2023 Japanese study (Yoshiike et al.), the effect even flips sign: one hour of catch-up in people already getting six hours came with half the risk of dying, while that same hour, in people under five and a half, came with nearly double. The dose is not free either. A 2025 American analysis (NHANES data, in BMC Medicine) found a U-shaped curve, with the lowest risk of insulin resistance around 40 to 60 extra minutes.

And none of this touches a deeper problem. Sleeping little during the week is not a random choice: it marks night shifts, two jobs, a small child, untreated sleep apnea — the condition where breathing stops dozens of times a night. The people who most need Saturday arrive sicker already.

A 2024 editorial in the journal Sleep gives the honest close: they clash because they measure different things. Catching up helps in the short term, with alertness and performance; irregular timing charges you in the long term, in mental health and mortality.

## 3. The one thing both sides agree on

In 2006, chronobiologist Till Roenneberg named the phenomenon social jetlag: the gap between the midpoint of your sleep on workdays and the midpoint on free days. It sounds abstract until you work out your own. Sleep midnight to 6am on weekdays and your midpoint is 3am. Sleep 2am to 11am on Saturday and it moves to 6:30am. That is three and a half hours — like crossing three time zones every Friday and flying back every Monday, without leaving your bedroom. Second-hand estimates put roughly 69% of adults in industrialized countries at an hour or more of it.

In 2024, a team led by Daniel Windred processed more than 10 million hours of sensor data from 60,977 British adults. Out of it came a sleep regularity index: how closely your bed and wake times repeat from one day to the next. The most regular sleepers died 20% to 48% less often than the least regular, adjusting for age, sex, ethnicity and lifestyle. Regularity predicted outcomes better than total duration.

> Consistency of one's day-to-day sleep timing is actually a better predictor of health outcomes than how much sleep one gets overall. — Larson & Gehrman, Sleep, 2024

This is why sleeping until eleven on Saturday does two things that work against each other. You put hours back, which relieves the pressure. You also push your body clock later, which makes Sunday night shallower and Monday morning harder.

Three misunderstandings before the recipe:

:::list-icon
close-circle | **"I sleep in Saturday and the debt is cleared."** The tiredness clears, and that part is real. The metabolic bill and the body clock do not.
close-circle | **"The more I sleep in, the better."** The curve is U-shaped. Lowest risk sits near one extra hour; three extra hours shift your clock and you land on Monday worse off.
close-circle | **"Catch-up sleep cuts heart risk by 20%."** That came from an unpublished congress abstract. Another analysis of the same cohort, with sleep measured by device, found no benefit at all.
:::

And what to do with it this weekend:

:::list-icon
alarm | **Anchor your wake time.** Keep the weekday-to-weekend gap under an hour. The hour you get up is what holds the clock in place.
moon | **If you must catch up, do it at the front of the night.** An extra hour from an earlier bedtime does not shift your clock. The same hour tacked onto the morning does.
sunny | **Get outside within 30 minutes of waking** — Sunday included. Morning light is the strongest signal there is for re-anchoring the body clock.
analytics | **Use Saturday as a diagnostic.** If you sleep three extra hours when no alarm is set, the problem is not the weekend. It is the week.
medkit | **If catching up never helps, look deeper.** Loud snoring, breathing pauses and exhaustion after eight hours in bed point to sleep apnea.
:::

The debt metaphor is what misleads. Debt implies a balance you settle with one big deposit at month's end. Sleep is a clock, not a bank account — and clocks are not set by volume, they are set by repetition. Sleeping in on Saturday is a bandage: it eases what you feel without returning what you lost. What returns it is reaching Friday without needing one.

:::source[Depner et al., 2019 · Current Biology 29(6) · randomized in-laboratory trial, n=36](https://doi.org/10.1016/j.cub.2019.01.069)
:::source[Chaput et al., 2024 · Sleep 47(11) · UK Biobank, accelerometer, n=73,513](https://doi.org/10.1093/sleep/zsae135)
:::source[Windred et al., 2024 · Sleep 47(1) · sleep regularity index, n=60,977](https://doi.org/10.1093/sleep/zsad253)$body_en$,
  array[$tkpt0$No único experimento controlado do tema, dois dias inteiros de sono livre no fim de semana não devolveram a sensibilidade à insulina perdida em cinco noites curtas.$tkpt0$, $tkpt1$A evidência populacional está em aberto: duas análises da mesma coorte britânica chegaram a conclusões opostas, e compensar só mostra benefício em quem realmente dorme pouco na semana.$tkpt1$, $tkpt2$Regularidade de horário prevê saúde melhor do que a quantidade total — a diferença entre acordar de semana e de fim de semana deveria caber em uma hora.$tkpt2$]::text[],
  array[$tken0$In the only controlled experiment on the topic, two full nights of unrestricted weekend sleep failed to restore the insulin sensitivity lost over five short nights.$tken0$, $tken1$The population evidence is unresolved: two analyses of the same British cohort reached opposite conclusions, and catch-up sleep only shows benefit in people who are genuinely short during the week.$tken1$, $tken2$Regular timing predicts health better than total hours — the gap between your weekday and weekend wake times should fit inside an hour.$tken2$]::text[],
  array[$sgpt0$Você acorda três horas mais tarde no sábado do que na segunda, e mesmo assim chega no domingo à noite sem sono.$sgpt0$, $sgpt1$Segunda-feira é sempre o pior dia da semana, e acordar dói mais do que doía na sexta.$sgpt1$, $sgpt2$Você compensa no fim de semana há anos e a sensação de estar devendo sono nunca passa.$sgpt2$]::text[],
  array[$sgen0$You wake three hours later on Saturday than on Monday, and still lie awake on Sunday night.$sgen0$, $sgen1$Monday is always the worst day of the week, and getting up hurts more than it did on Friday.$sgen1$, $sgen2$You have been catching up on weekends for years and the feeling of owing sleep never goes away.$sgen2$]::text[],
  $trpt$No Perceva, Sono é uma sub de Saúde. Em vez de criar uma tarefa de dormir 8 horas, crie uma de horário: acordar às 7h, ou estar na cama às 23h30 — marcada como diária, sábado e domingo incluídos. É o tipo de tarefa em que o Momentum joga a seu favor, porque ele mede a repetição ao longo de 30 dias, não o volume de uma noite. E o seu histórico vira medida: se a tarefa aparece cumprida de segunda a sexta e furada no fim de semana, você acabou de enxergar o seu jet lag social num gráfico.$trpt$,
  $tren$In Perceva, Sleep is a sub of Health. Instead of a task that says sleep 8 hours, create one built on timing: up at 7am, or in bed by 11:30pm — set as daily, weekends included. This is exactly the kind of task Momentum rewards, since it tracks repetition across 30 days rather than the volume of any single night. And your history becomes the measurement: if the task shows done Monday to Friday and skipped on weekends, you are looking at your own social jetlag on a chart.$tren$,
  $t$https://doi.org/10.1016/j.cub.2019.01.069$t$,
  $t$Depner et al., 2019 · Current Biology 29(6) · ensaio randomizado em laboratório, n=36$t$,
  $t$Depner et al., 2019 · Current Biology 29(6) · randomized in-laboratory trial, n=36$t$,
  $rlog${"template_type":"explainer","template_version":2,"voice_principles_applied":["Três ideias, não sete: (1) o único experimento controlado (Depner 2019) e o que ele não recuperou, (2) por que a evidência populacional briga consigo mesma, (3) o eixo em que os dois lados concordam — regularidade de horário.","Prose-led: apenas 3 cards no corpo (1 :::stat + 2 :::list-icon exigidos pelo template) mais o bloco de fontes; as duas citações usam blockquote markdown simples em vez do diretivo :::quote.","PT e EN escritos nativamente em paralelo (PT primeiro, EN reescrito do zero — imagens diferentes: ledger/bank account em EN, caixa/curativo em PT).","Jargão definido na primeira menção: sensibilidade à insulina, cálcio coronariano, apneia do sono, jet lag social, índice de regularidade do sono; hazard ratio e intervalo de confiança traduzidos como risco X% maior com margem de erro que inclui nenhum efeito; acelerômetro como sensor no pulso.","Abstração ancorada em exemplo concreto: o cálculo do jet lag social com horários reais (meia-noite às 6h contra 2h às 11h) e o sábado usado como termômetro da dívida da semana.","Caveats honestos no corpo, não em rodapé: n=36 e generalização fraca, resumo de congresso sem revisão por pares, confusão por turno noturno e apneia, curva em U da dose, e os 69% marcados como número de segunda mão."],"steps":[{"id":"hook","answer_pt":"Abrir com a contabilidade mental que todo mundo faz na sexta à noite (dormi 5h30, 6h, 5h... acordo tarde no sábado e zero) e revelar que a ciência não fechou a conta: duas equipes analisaram a MESMA base britânica de quase 90 mil pessoas e chegaram a resultados opostos.","answer_en":"Open on the Friday-night mental ledger everyone runs (five and a half hours, six, five... sleep in Saturday and it is square) then reveal the science has not settled it: two teams analysed the SAME British dataset of nearly 90,000 people and got opposite answers."},{"id":"thesis","answer_pt":"Dormir até tarde no fim de semana devolve o que você sente (cansaço, humor, atenção) e não devolve o que você não sente (metabolismo e relógio biológico). O que sobrevive aos dois lados da controvérsia é a regularidade do horário. Vira o bloco :::stat com a queda de 9 a 27% na sensibilidade à insulina do Depner 2019.","answer_en":"Sleeping in on the weekend restores what you feel (fatigue, mood, attention) and not what you do not feel (metabolism and body clock). What survives both sides of the controversy is regularity of timing. Becomes the :::stat block with Depner 2019's 9-27% insulin sensitivity drop."},{"id":"real_definition","answer_pt":"O que as pessoas acham: sono compensatório é um depósito que quita um saldo devedor. O que ele realmente é: um deslocamento do relógio circadiano que compra alívio subjetivo. Escrevi o contraste como prosa (caixa contra relógio, fechando o artigo) em vez de :::compare, para não estourar o orçamento visual já ocupado pelos dois :::list-icon obrigatórios.","answer_en":"What people assume: catch-up sleep is a deposit that settles a balance. What it actually is: a shift of the circadian clock that buys subjective relief. I wrote the contrast as prose (bank account against clock, landing the closing paragraph) instead of a :::compare, to avoid blowing the visual budget already spent on the two required :::list-icon blocks."},{"id":"stakes","answer_pt":"Stat irrefutável: Depner, Melanson, Wright et al., Current Biology 2019 (n=36, randomizado, em laboratório) — 5h por 5 noites derrubou a sensibilidade à insulina de 9 a 27%, e dois dias de sono livre no fim de semana não recuperaram (grupo sem recuperação: cerca de 13%); a resistência muscular e hepática ficou pior no grupo que compensou, com ganho de peso nos dois grupos restritos.","answer_en":"Ironclad stat: Depner, Melanson, Wright et al., Current Biology 2019 (n=36, randomized, in-lab) — five hours for five nights cut whole-body insulin sensitivity by 9-27%, and two nights of unrestricted weekend sleep did not repair it (no-recovery group: about 13%); muscle- and liver-specific resistance was worse in the recovery group, and both restricted groups gained weight."},{"id":"mechanism","answer_pt":"Dois efeitos simultâneos que brigam entre si: repor horas alivia a pressão de sono acumulada, e acordar tarde atrasa o relógio circadiano (jet lag social, Roenneberg 2006 = diferença entre o meio do sono em dias de trabalho e em dias livres). Por isso o efeito depende da linha de base da semana (ELSA-Brasil: some em quem já dorme o suficiente; Yoshiike 2023: inverte de sinal) e da dose (curva em U, BMC Medicine 2025). Exemplo concreto: meia-noite às 6h na semana (meio às 3h) contra 2h às 11h no sábado (meio às 6h30) = 3h30 de deslocamento, três fusos horários toda sexta.","answer_en":"Two simultaneous effects pulling against each other: putting hours back relieves accumulated sleep pressure, while waking late delays the circadian clock (social jetlag, Roenneberg 2006 = the gap between sleep midpoints on work and free days). That is why the effect depends on your weekday baseline (ELSA-Brasil: vanishes in people already sleeping enough; Yoshiike 2023: flips sign) and on dose (U-shaped, BMC Medicine 2025). Concrete anchor: midnight to 6am on weekdays (midpoint 3am) versus 2am to 11am on Saturday (midpoint 6:30am) = 3.5 hours of drift, three time zones every Friday."},{"id":"myth_busts","answer_pt":"Três, em :::list-icon com close-circle, cada um com o steelman antes da correção: (1) durmo até tarde e zero a dívida — o cansaço zera mesmo, a conta metabólica não (Depner 2019); (2) quanto mais melhor — curva em U com mínimo perto de 1h extra (NHANES 2025); (3) compensar corta 20% do risco cardíaco — resumo do congresso ESC 2024 sem revisão por pares, contra uma análise nula da mesma coorte com sono medido por sensor (Chaput 2024).","answer_en":"Three, in a :::list-icon with close-circle, each steelmanned before correction: (1) sleeping in clears the debt — the tiredness does clear, the metabolic bill does not (Depner 2019); (2) more is better — U-shaped curve with its minimum near one extra hour (NHANES 2025); (3) catch-up cuts heart risk by 20% — an unreviewed ESC 2024 congress abstract, against a null device-measured analysis of the same cohort (Chaput 2024)."},{"id":"recipe","answer_pt":"Cinco ações em :::list-icon: ancorar o horário de acordar (diferença máxima de 1h entre semana e fim de semana); compensar pelo começo da noite, não pelo fim da manhã; luz do sol nos primeiros 30 minutos após acordar, domingo incluído; usar o quanto você dorme a mais no sábado como medida da dívida da semana; e investigar apneia do sono se compensar nunca resolve.","answer_en":"Five actions in a :::list-icon: anchor your wake time (keep the weekday-weekend gap under an hour); catch up at the front of the night, not the back of the morning; get outdoor light within 30 minutes of waking, Sunday included; use how much extra you sleep on Saturday as the measure of your weekday debt; and investigate sleep apnea if catching up never helps."}],"main_points":[{"id":"1_o_experimento_controlado","what_pt":"O único ensaio randomizado em laboratório (Depner 2019, n=36) mostrou que dois dias de sono livre no fim de semana não recuperaram a sensibilidade à insulina perdida em cinco noites de 5 horas.","why_pt":"É a única evidência capaz de provar causa; todo o resto é observacional. E contradiz de frente a intuição de que o sábado quita a semana.","how_to_know_pt":"Aplica-se a você se compensar no fim de semana virou rotina fixa — não a um evento isolado depois de uma noite ruim.","what_en":"The only randomized in-lab trial (Depner 2019, n=36) showed that two nights of unrestricted weekend sleep did not restore the insulin sensitivity lost across five 5-hour nights.","why_en":"It is the only evidence capable of proving cause; everything else is observational. And it contradicts the intuition that Saturday settles the week.","how_to_know_en":"This applies to you if weekend catch-up is a fixed part of your routine, not a one-off after a bad night."},{"id":"2_a_briga_dos_estudos","what_pt":"A evidência populacional é genuinamente dividida: mesma coorte britânica, resultados opostos; e o benefício só aparece em quem realmente dorme pouco na semana, em dose limitada (curva em U).","why_pt":"Porque a manchete de 20% menos risco cardíaco circulou como fato quando ainda é resumo de congresso, e porque quem dorme pouco na semana já carrega turno noturno, estresse e apneia não tratada.","how_to_know_pt":"Se você dorme 7 horas nos dias úteis, a evidência de benefício não fala de você; se dorme menos de 6, é o subgrupo em que o efeito aparece — e também o subgrupo em que ele pode inverter.","what_en":"The population evidence is genuinely split: same British cohort, opposite results; and the benefit only shows up in people who are truly short during the week, at a limited dose (U-shaped).","why_en":"Because the 20%-lower-heart-risk headline travelled as fact while still being a congress abstract, and because short weekday sleep already carries night shifts, stress and untreated apnea with it.","how_to_know_en":"If you sleep 7 hours on weekdays, the benefit evidence is not about you; if you sleep under 6, you are in the subgroup where the effect appears — and where it can also reverse."},{"id":"3_o_horario_decide","what_pt":"A regularidade de horário (índice de regularidade do sono, Windred 2024, n=60.977) prevê mortalidade melhor do que a duração total, e dormir até tarde no sábado é justamente o que produz jet lag social.","why_pt":"É o único ponto em que os dois lados da controvérsia convergem, e é acionável sem depender de quem vencer a discussão.","how_to_know_pt":"Calcule o meio do seu sono na semana e no fim de semana. Diferença acima de uma hora é jet lag social — e é o número que dá pra reduzir já neste sábado.","what_en":"Timing regularity (Sleep Regularity Index, Windred 2024, n=60,977) predicts mortality better than total duration, and sleeping in on Saturday is precisely what manufactures social jetlag.","why_en":"It is the one place both sides of the controversy converge, and it is actionable regardless of who wins the argument.","how_to_know_en":"Work out your sleep midpoint on weekdays and on weekends. A gap over an hour is social jetlag — and it is the number you can shrink this weekend."}],"honest_caveats_flagged":["Duas análises da MESMA coorte UK Biobank em conflito direto (Chaput 2024, nula, sono medido por acelerômetro; ESC 2024, 19-20% de benefício) — declarado no hook, na seção 2 e no myth-bust 3.","Depner 2019 é o desenho causal mais forte e o mais fraco em generalização (n=36, jovens saudáveis, 2 semanas) — declarado logo após o resultado.","Confusão residual: sono curto na semana marca turno noturno, dois empregos, cuidado de filhos e apneia não tratada — parágrafo dedicado na seção 2.","Dose não linear (curva em U, BMC Medicine 2025) contra o conselho de dormir o máximo possível — no corpo e no myth-bust 2.","A prevalência de cerca de 69% de jet lag social é estimativa de fonte secundária — marcada no texto como número de segunda mão.","Windred 2024 já aparece em glossary-sleep; aqui é reenquadrado como o eixo que resolve a controvérsia do sono compensatório, e não repetido como fato solto.","source_url de metadados aponta para Depner 2019, a fonte que sustenta o número do :::stat; Chaput 2024 e Windred 2024 têm blocos :::source próprios no corpo; ELSA-Brasil, NHANES 2025, Yoshiike 2023, Roenneberg 2006 e o editorial Larson e Gehrman são nomeados em texto com ano e revista."],"lint":{"tool":"tools/learning-lint/lint.mjs --draft","result":"0 FAIL, 4 WARN (2 per locale)","warns_accepted":["3 visual cards instead of the preferred 2 — the explainer template requires a :::stat, a :::list-icon of myth-busts and a :::list-icon recipe. Everything else stays prose: both quotes use plain markdown blockquotes rather than :::quote, and no :::compare, :::callout or :::progress was used.","Word count 1497 PT / 1444 EN, above the preferred 950-1250 but inside the typical 800-1500 band. The subject is a live evidence dispute: six studies plus five mandatory caveats (conflicting UK Biobank analyses, n=36 generalization limit, unreviewed congress abstract, confounding by shift work and apnea, U-shaped dose) cannot be carried honestly in 1200 words. Two full trimming passes already removed ~240 words per locale."],"bug_caught_pre_ship":"The first draft used :::stat{value=\"...\" label=\"...\"}, copied from the pre-fix style reference (20260722000007). The renderer only accepts :::stat[value] + content lines + a closing :::, so the malformed form swallowed the entire body — the exact bug fixed for non-instrumental-play in migration 20260729000270. Both locales now use the bracket form."},"review":{"round_1":{"passed":false,"fail":["translate_jargon: insulin sensitivity undefined in the opening :::stat"],"warns":["card_overload","unsourced_stat","translate_jargon(coorte)","main_point_triple"]},"fixes_applied":["Plain-language gloss for insulin sensitivity added inside the :::stat supporting line (PT+EN) — the FAIL.","Gloss for coorte/cohort at first use (PT+EN).","Author surnames added to the four supporting citations: Zhou & Xue 2025, Peixoto de Miranda et al. 2025, Yoshiike et al. 2023, NHANES/BMC Medicine 2025.","reading_minutes 6 -> 7 per reviewer verdict on the honest word count."],"judgement_calls":{"reading_minutes":"bumped to 7 (reviewer verdict: round up, do not trim the caveats)","source_url":"kept on Depner 2019 — it backs the lead :::stat; Chaput and Windred carry their own in-body :::source blocks (reviewer: acceptable, not a fail)"},"warns_accepted":["card_overload (3 cards, justified)","main_point_triple (sections 1-2 surface how-to-know less directly than section 3)"]}}$rlog$::jsonb
)
on conflict (slug) do update set
  type            = excluded.type,
  dimension_id    = excluded.dimension_id,
  topic           = excluded.topic,
  reading_minutes = excluded.reading_minutes,
  title_pt        = excluded.title_pt,
  title_en        = excluded.title_en,
  summary_pt      = excluded.summary_pt,
  summary_en      = excluded.summary_en,
  body_pt         = excluded.body_pt,
  body_en         = excluded.body_en,
  takeaways_pt    = excluded.takeaways_pt,
  takeaways_en    = excluded.takeaways_en,
  signs_pt        = excluded.signs_pt,
  signs_en        = excluded.signs_en,
  tracking_pt     = excluded.tracking_pt,
  tracking_en     = excluded.tracking_en,
  source_url      = excluded.source_url,
  source_label_pt = excluded.source_label_pt,
  source_label_en = excluded.source_label_en,
  reasoning_log   = excluded.reasoning_log;

-- sub links: reset then re-insert, so the set is exactly what this migration declares.
delete from public.learning_material_sub
where material_id = (select id from public.learning_material where slug = $slug$catch-up-sleep-weekend$slug$);

insert into public.learning_material_sub (material_id, sub_id)
select m.id, s.sub_id
from public.learning_material m
cross join (values ($t$sleep$t$)) as s(sub_id)
where m.slug = $slug$catch-up-sleep-weekend$slug$
on conflict (material_id, sub_id) do nothing;
