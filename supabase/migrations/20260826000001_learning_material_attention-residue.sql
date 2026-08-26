-- Learning material: attention-residue (explainer)
-- Topic: attention residue | dimension: mind | subs: contemplate, learn
-- Pipeline: planner -> researcher -> drafter -> reviewer (PASSED, 4 warns, 0 fails)
-- Primary source: https://doi.org/10.1016/j.obhdp.2009.04.002

insert into public.learning_material (
  slug, type, dimension_id, topic, reading_minutes,
  title_pt, title_en, summary_pt, summary_en,
  body_pt, body_en,
  takeaways_pt, takeaways_en,
  tracking_pt, tracking_en,
  source_url, source_label_pt, source_label_en,
  reasoning_log
) values (
  'attention-residue', 'explainer', 'mind', 'attention residue', 6,
  'Você fechou a reunião. Sua atenção não.', 'You closed the meeting. Your attention didn''t.',
  'Parte do seu foco fica presa na tarefa anterior e cobra o preço na próxima — e o que solta ela não é terminar, é fechar.', 'Part of your focus stays stuck on the last task and bills the next one — and what frees it isn''t finishing, it''s closing.',
  $bpt$A reunião das 14h termina às 14h58. Às 15h em ponto você já está em outra, câmera ligada, olhando pra um slide novo. Seu corpo chegou. Metade da sua cabeça ficou lá atrás, remoendo a frase que você não disse.

Você provavelmente chama isso de cansaço. Sophie Leroy, pesquisadora da Universidade de Washington, deu outro nome em 2009: **resíduo de atenção**. Não é metáfora de coach. É uma coisa que ela mediu em laboratório, e o efeito não aparece na tarefa que você largou — aparece na próxima, aquela em que você jura que está inteiro.

E o que solta a atenção presa não é terminar a tarefa anterior. É fechá-la. São coisas diferentes, e a diferença é o artigo inteiro.

## 1. A tarefa que você fechou continua aberta

Leroy montou dois experimentos parecidos. Todo mundo começava resolvendo anagramas — embaralhar letras até virar palavra. Uma parte conseguia terminar. A outra era interrompida no meio e mandada pra uma tarefa sem nenhuma relação: ler currículos e decidir quem contratar.

Entre uma coisa e outra, ela encaixou um teste que parece bobo. A tela pisca sequências de letras, e você aperta um botão dizendo se aquilo é palavra de verdade ou não. Isso se chama tarefa de decisão lexical, e serve pra flagrar o que ainda está ligado na sua cabeça: se as palavras do anagrama continuam ativas, você reconhece elas mais rápido que palavras neutras. A velocidade da sua mão entrega onde a sua atenção está.

Foi exatamente o que apareceu. Quem saiu do anagrama pela metade tinha mais resíduo — as palavras da tarefa anterior seguiam quentes. E essas mesmas pessoas leram os currículos pior.

> As pessoas precisam parar de pensar numa tarefa pra transferir a atenção por completo e ir bem em outra.
> — Sophie Leroy, *Organizational Behavior and Human Decision Processes*, 2009

Repare no que isso não é. Não é sobre fazer duas coisas ao mesmo tempo. Na hora dos currículos, os participantes estavam fazendo uma coisa só, sem distração nenhuma, e mesmo assim decidiram pior. O resíduo é o que sobra depois da troca. Ele não cobra da tarefa que ficou pra trás — cobra da que você acabou de abrir.

Traduzindo pro seu dia: a reunião ruim das 14h não estraga as 14h. Estraga as 15h. E como você já está em outro assunto, a culpa cai em qualquer outra coisa — noite mal dormida, semana pesada, café fraco.

## 2. Terminar não é fechar

A leitura fácil desse estudo é "termine o que começou". Foi assim que a ideia viajou pela internet, e é aqui que ela se perde. Porque entre as pessoas que terminaram o anagrama, o desempenho não foi igual.

Um grupo terminou sob pressão de tempo, com o relógio no pescoço. Outro, sem pressa nenhuma. Quem terminou sob pressão soltou melhor a tarefa e foi melhor nos currículos. Terminar era a mesma coisa nos dois casos. O que mudou foi a sensação de assunto encerrado, sem pontas soltas.

Aqui está o ponto: o que prende sua atenção não é a tarefa inacabada. É o loop aberto — a pergunta sem resposta, o "depois eu resolvo isso". Terminar é uma das formas de fechar o loop, e é a mais cara. Existem formas baratas.

A mais barata Leroy testou com Theresa Glomb em 2018 e batizou de plano de retomada. Antes de trocar de tarefa, você para e escreve três linhas: onde parou, o que ficou pendente, qual é o próximo passo. Não resolve nada do problema — só registra o estado dele, pra sua cabeça poder soltar.

> Um minuto de trabalho já resolve — anotar onde você parou, onde retomar, que desafios ficaram e o que você precisa adiar pra retomar depois.
> — Sophie Leroy, sobre o plano de retomada

:::stat[202 profissionais]
testaram o plano de retomada no trabalho real, no mais forte dos quatro estudos de Leroy e Glomb. Quem escreveu as três linhas antes de trocar chegou na tarefa seguinte com menos resíduo, decidiu melhor e lembrou mais informação (*Organization Science*, 2018).
:::

E o tamanho do estrago depende de como a tarefa está enquadrada na sua cabeça. Num estudo de 2016, Leroy e Anna Schmidt viram o resíduo piorar quando a tarefa interrompida estava no modo evitar perda — "não posso errar esse relatório", "se der ruim sobra pra mim". Com a mesma tarefa no modo buscar ganho — "esse relatório pode abrir uma porta" —, o resíduo era menor. Não é uma constante. Depende de qual medo está montado em cima da tarefa.

Uma ressalva honesta. Os estudos de 2009 e 2016 são de laboratório, com amostras universitárias, e quase todas as extensões saíram do próprio grupo da Leroy — não existe, até aqui, replicação independente. O lastro fora da bancada é o estudo de campo com os 202 profissionais, justamente o que sustenta a parte acionável.

## 3. Desfaça três confusões, faça uma coisa

A primeira: resíduo de atenção não é custo de troca. Custo de troca é o que Rubinstein, Meyer e Evans mediram em 2001 — o tempo que o cérebro gasta recarregando as regras quando você alterna entre duas tarefas. É coisa de milissegundos a segundos, e cresce com a complexidade da tarefa. Resíduo é outro bicho: é conteúdo de pensamento que continua rodando e estraga minutos inteiros da tarefa seguinte. Aquele "trocar de tarefa derruba 40% da produtividade" que circula por aí é uma frase de divulgação da APA sobre o estudo de 2001, não um número do artigo.

A segunda: os famosos "23 minutos e 15 segundos pra recuperar o foco". Atribuem o número à pesquisadora Gloria Mark, mas ninguém acha ele num artigo revisado por pares. Quem foi atrás vasculhou os trabalhos publicados dela e não achou o número em nenhum: ele nasceu em entrevistas e virou fato por repetição. Regra prática: dado com precisão de segundos merece desconfiança.

A terceira: o efeito Zeigarnik, de 1927, a ideia de que a gente lembra o dobro das tarefas inacabadas. Uma revisão sistemática com meta-análise publicada em 2025 na Humanities and Social Sciences Communications não achou vantagem confiável de memória pra tarefas interrompidas. Ficou de pé um primo mais fraco, o efeito Ovsiankina: a interrupção cria vontade de voltar pra tarefa, não lembrança melhor dela. Que é, curiosamente, o mesmo desenho do resíduo — puxão, não memória.

Desfeitas as três, sobra pouca coisa pra fazer:

:::list-icon
pencil | **Três linhas antes de trocar.** Onde parei, o que ficou pendente, qual é o próximo passo. Melhor evidência de campo do artigo, e custa um minuto.
alarm | **Marque a hora de encerrar, não só a de começar.** Quem terminou sob pressão soltou melhor. Reunião de 50 minutos com 10 de folga rende mais que uma de 60 colada na próxima.
calendar | **Dê endereço ao "depois".** O loop que não fecha hoje, agende: dia e hora. "Depois" não fecha nada; quinta às 9h fecha.
shuffle | **Reenquadre o que você está largando.** Se a tarefa saiu no modo "não posso errar", gaste trinta segundos escrevendo o que abre se der certo.
:::

Nada disso é sobre disciplina, e essa é a parte boa. Você não troca de tarefa rápido demais porque é fraco. Você troca sem fechar, e a conta chega na tarefa seguinte disfarçada de "hoje eu não rendi". O minuto que você gasta anotando onde parou não é tempo perdido — é o pedágio pra chegar inteiro na próxima coisa.

:::source[Leroy, 2009 · Organizational Behavior and Human Decision Processes 109(2):168–181 · dois experimentos de laboratório](https://doi.org/10.1016/j.obhdp.2009.04.002)
$bpt$,
  $ben$The two o'clock meeting ends at 2:58. At three sharp you are in another one, camera on, staring at a fresh slide. Your body made it. Half your head is still back there, chewing on the thing you didn't say.

You probably file that under tiredness, or bad focus. Sophie Leroy, a researcher at the University of Washington, gave it a different name in 2009: **attention residue**. Not a motivational metaphor — something she measured in a lab. And the damage doesn't land on the task you walked away from. It lands on the next one, the one where you swear you're fully present.

What frees the stuck part of your attention isn't finishing the previous task. It's closing it. Those are two different things, and the gap between them is this whole article.

## 1. The task you closed is still open

Leroy ran two similar experiments. Everyone started on anagrams — scrambled letters you rearrange into a word. Some were allowed to finish. The rest were cut off mid-puzzle and pushed into something unrelated: reading résumés and deciding who to hire.

Between the two, she slipped in a test that looks trivial. The screen flashes strings of letters and you press a button saying whether each one is a real word. It's called a lexical decision task, and it catches what's still switched on in your head: if the anagram words are still active, you recognize them faster than neutral words. The speed of your hand gives away where your attention is.

That's exactly what showed up. The people yanked out mid-puzzle carried more residue — the earlier words were still warm. And those same people read the résumés worse.

> People need to stop thinking about one task in order to fully transition their attention and perform well on another.
> — Sophie Leroy, *Organizational Behavior and Human Decision Processes*, 2009

Notice what this isn't. It isn't doing two things at once. During the résumés, participants were doing one thing, undistracted, and still decided worse. Residue is what's left over after the switch. It doesn't bill the task you dropped — it bills the one you just opened.

Translate that into your day: the bad two o'clock meeting doesn't wreck two o'clock. It wrecks three. And since you're already on another subject by then, you blame something else — short night, heavy week, weak coffee.

## 2. Finishing is not closing

The easy reading of that study is "finish what you start." That's the version that traveled the internet, and it's where the finding gets lost. Because among the people who did finish the anagram, performance was not the same.

One group finished under time pressure, clock on their neck. Another finished at leisure. The ones under pressure let go of the task better and did better on the résumés. Finishing was identical in both cases. What differed was the sense that the matter was settled, no loose ends.

Here's the point: what holds your attention hostage isn't the unfinished task. It's the open loop — the unanswered question, the "I'll deal with that later." Finishing is one way to close a loop, and it's the most expensive one. There are cheap ways.

The cheapest one Leroy tested with Theresa Glomb in 2018 and named the ready-to-resume plan. Before switching, you stop and write three lines: where you left off, what's unresolved, what the next step is. It solves nothing about the problem — it just records its state, so your head can let go.

> Even a minute's work will do — to note where you left off, and where to resume, what challenges are left, and/or what actions you must postpone but resume later.
> — Sophie Leroy, on the ready-to-resume plan

:::stat[202 professionals]
tested the ready-to-resume plan in a real workplace, the strongest of Leroy and Glomb's four studies. The ones who wrote the three lines before switching arrived at the next task with less residue, decided better and recalled more information (*Organization Science*, 2018).
:::

How big the damage gets depends on how the task is framed in your head. In a 2016 study, Leroy and Anna Schmidt found residue got worse when the interrupted task sat in avoid-a-loss mode — "I can't get this report wrong," "if this blows up it's on me." With the same task in chase-a-gain mode — "this report could open a door" — residue was smaller. It isn't a constant. It depends on which fear is bolted onto the task.

One honest caveat. The 2009 and 2016 studies are lab work with university-adjacent samples, and nearly every extension came out of Leroy's own research program — there is, so far, no independent replication. What gives it legs outside the lab is the field study with those 202 professionals — precisely the one holding up the actionable part.

## 3. Clear three confusions, then do one thing

The first: attention residue is not switch cost. Switch cost is what Rubinstein, Meyer and Evans measured in 2001 — the time your brain spends reloading the rules when you alternate between two tasks. Milliseconds to seconds, growing as the task gets more complex. Residue is a different animal: thought content that keeps running and degrades whole minutes of the next task. And the "task-switching cuts productivity up to 40%" line comes from APA's press coverage of that 2001 paper, not from the article.

The second: the famous "23 minutes and 15 seconds to refocus." People pin it on researcher Gloria Mark, but nobody can find it in a peer-reviewed paper. People who went looking combed through her published work and found the figure in none of it: it was born in interviews and became a fact by repetition. Rule of thumb: a statistic precise to the second deserves suspicion.

The third: the Zeigarnik effect, from 1927, the idea that we remember unfinished tasks about twice as well. A 2025 systematic review with meta-analysis in Humanities and Social Sciences Communications found no reliable memory advantage for interrupted tasks. What survived is a weaker cousin, the Ovsiankina effect: interruption creates a pull to return to the task, not a better memory of it. Which is, oddly enough, the same shape as residue — a tug, not a recording.

With those three out of the way, there isn't much left to do:

:::list-icon
pencil | **Three lines before you switch.** Where I stopped, what's unresolved, what's next. Best field evidence in this whole article, and it costs a minute.
alarm | **Set the time you'll stop, not just the time you'll start.** The people under time pressure let go better. A 50-minute meeting with 10 to spare does more than a 60 stacked against the next one.
calendar | **Give "later" an address.** The loop you can't close today, book it: day and hour. "Later" closes nothing; Thursday at 9 closes it.
shuffle | **Reframe what you're putting down.** If the task is leaving you in "I can't get this wrong" mode, spend thirty seconds writing what it opens if it goes right.
:::

None of this is about discipline, and that's the good part. You don't switch tasks too fast because you're weak. You switch without closing, and the bill arrives on the next task disguised as "I just wasn't sharp today." The minute you spend noting where you stopped isn't lost time — it's the toll for showing up whole to the next thing.

:::source[Leroy, 2009 · Organizational Behavior and Human Decision Processes 109(2):168–181 · two laboratory experiments](https://doi.org/10.1016/j.obhdp.2009.04.002)
$ben$,
  array[
    $tk$Resíduo de atenção é a parte do foco que continua na tarefa anterior depois que você já trocou. Sophie Leroy mediu isso em 2009: quem foi interrompido no meio de um quebra-cabeça carregou mais resíduo e decidiu pior na tarefa seguinte, que não tinha nada a ver com a primeira. A conta chega na próxima tarefa, não na que você largou.$tk$,
    $tk$Terminar não é o que resolve — fechar é. No mesmo experimento, quem terminou sob pressão de tempo soltou a tarefa melhor do que quem terminou sem pressa. O gesto mais barato tem um minuto: antes de trocar, escreva onde parou, o que ficou pendente e qual é o próximo passo. Num estudo de campo com 202 profissionais (Leroy e Glomb, 2018), quem escreveu chegou na tarefa seguinte com menos resíduo e decidiu melhor.$tk$,
    $tk$Três coisas parecidas que não são a mesma: custo de troca (Rubinstein, 2001) é recarregar regras em milissegundos, não resíduo; os "23 minutos e 15 segundos pra recuperar o foco" não têm artigo revisado por pares por trás; e o efeito Zeigarnik não replicou em meta-análise de 2025 — o que sobrou foi o efeito Ovsiankina, a vontade de voltar pra tarefa, não a lembrança melhor dela.$tk$
  ],
  array[
    $tk$Attention residue is the slice of your focus still working the previous task after you've moved on. Sophie Leroy measured it in 2009: people cut off mid-puzzle carried more residue and decided worse on the next task, which had nothing to do with the first. The bill lands on the task you just opened, not the one you dropped.$tk$,
    $tk$Finishing isn't the fix — closing is. In the same experiment, the people who finished under time pressure let go better than those who finished at leisure. The cheapest move takes a minute: before switching, write where you stopped, what's unresolved, and what's next. In a field study with 202 working professionals (Leroy and Glomb, 2018), the ones who wrote it arrived at the next task with less residue and decided better.$tk$,
    $tk$Three lookalikes that aren't the same thing: switch cost (Rubinstein, 2001) is reloading rules in milliseconds, not residue; the "23 minutes and 15 seconds to refocus" figure has no peer-reviewed paper behind it; and the Zeigarnik effect failed to replicate in a 2025 meta-analysis — what survived is the Ovsiankina effect, a pull to resume the task, not a sharper memory of it.$tk$
  ],
  $trp$No Perceva isso vive no sub Contemplar, dentro de Mente. Crie uma tarefa diária com a regra no próprio nome: "três linhas antes de trocar". Ponha as estrelas em Contemplar e use a descrição pra guardar o formato — onde parei, o que ficou pendente, próximo passo. Se a sua agenda tem reuniões coladas, o Minha Semana resolve melhor que a tarefa: reserve os 10 minutos de folga entre blocos como um item da semana, não como boa intenção. Em três meses, reabra a autoavaliação e mexa só no slider de Contemplar. Aí você tem duas leituras conversando: a tarefa mostra o que aconteceu nas semanas, o slider mostra o que mudou na sua percepção de foco. Uma ressalva que vem do próprio tema: não deixe o plano de retomada virar mais um loop aberto. Se a anotação crescer pra meia página, ela parou de fechar e começou a abrir.$trp$,
  $tre$In Perceva this lives in the Contemplate sub, under Mind. Create a daily task with the rule in its name: "three lines before switching." Put the stars on Contemplate and use the description to hold the format — where I stopped, what's unresolved, what's next. If your calendar runs back-to-back, My Week does more than the task does: book the 10-minute gap between blocks as an item of the week, not as good intentions. Three months in, reopen the self-assessment and move only the Contemplate slider. Then you have two readings talking to each other: the task shows what happened week to week, the slider shows what shifted in how you read your own focus. One caveat straight out of the topic: don't let the ready-to-resume note become another open loop. If it grows to half a page, it stopped closing and started opening.$tre$,
  'https://doi.org/10.1016/j.obhdp.2009.04.002', 'Leroy, 2009 · Organizational Behavior and Human Decision Processes 109(2):168–181 · dois experimentos de laboratório', 'Leroy, 2009 · Organizational Behavior and Human Decision Processes 109(2):168–181 · two laboratory experiments',
  $rlog${"template_type": "explainer", "template_version": 2, "voice_principles_applied": ["3 ideias-herói (nada de 7 sub-tópicos): declínio invisível do foco / terminar vs fechar / três confusões + receita", "prose-led: só 2 cards no corpo (:::stat + :::list-icon) + :::source final; mitos escritos como parágrafos, não como lista", "PT e EN escritos nativos e paralelos — PT primeiro, EN redigido do zero com cadência própria (não tradução)", "jargão definido na primeira menção: resíduo de atenção, tarefa de decisão lexical, custo de troca, plano de retomada, efeito Ovsiankina", "abstração ancorada em exemplo concreto: a reunião das 14h que estraga as 15h; as três linhas do plano de retomada", "read-aloud: média de 15 palavras por frase em PT e EN, sem rótulos acadêmicos no corpo", "caveats honestos dentro do corpo (amostras de laboratório, ausência de replicação independente), não em rodapé"], "steps": [{"id": "hook", "answer_pt": "Abrir com a cena que todo mundo reconhece: reunião que termina 14h58, próxima às 15h em ponto. O corpo chegou, metade da cabeça ficou. A lacuna de curiosidade é o deslocamento do prejuízo — o problema não está onde você acha que está: a reunião ruim não estraga a reunião ruim, estraga a próxima.", "answer_en": "Open on the scene everyone recognizes: the two o'clock meeting ends at 2:58 and at three sharp you're in another. Body arrived, half the head didn't. The curiosity gap is where the damage lands — the bad meeting doesn't wreck itself, it wrecks the next hour."}, {"id": "thesis", "answer_pt": "O que solta a atenção presa não é terminar a tarefa anterior, é fechá-la — e o fechamento mais barato custa um minuto de escrita (plano de retomada), testado com 202 profissionais em ambiente real de trabalho.", "answer_en": "What frees stuck attention isn't finishing the previous task, it's closing it — and the cheapest closure costs one minute of writing (the ready-to-resume plan), tested on 202 working professionals in the field."}, {"id": "real_definition", "answer_pt": "O que as pessoas acham: falta de foco, cansaço, ou 'multitarefa'. O que é de fato: parte da atenção continua alocada na tarefa A enquanto você executa a tarefa B — mesmo fazendo uma coisa só, sem distração. Optei por escrever o contraste em prosa, não em :::compare, porque o orçamento de cards é 2 e a comparação cabe em duas frases ('Repare no que isso não é').", "answer_en": "What people assume: bad focus, tiredness, multitasking. What it actually is: part of your attention stays allocated to task A while you run task B — even when you're doing one thing, undistracted. Contrast written as prose, not a :::compare card, because the card budget is 2 and the contrast fits in two sentences."}, {"id": "stakes", "answer_pt": "Estatística de lastro: 202 profissionais em estudo de campo (Leroy e Glomb, Organization Science, 2018) — quem escreveu o plano de retomada chegou na tarefa seguinte com menos resíduo, decidiu melhor e lembrou mais informação. Escolhi esse número, e não o 'n' de 2009, porque o dossiê veta inventar tamanho de amostra dos experimentos de 2009 e porque é o dado com validade de campo.", "answer_en": "The load-bearing stat: 202 working professionals in a field study (Leroy and Glomb, Organization Science, 2018) — those who wrote the ready-to-resume plan arrived at the next task with less residue, decided better, recalled more. Chosen over the 2009 experiments because per-cell samples there could not be verified, and because this one carries field validity."}, {"id": "mechanism", "answer_pt": "Como Leroy mediu: dois experimentos de laboratório. Tarefa A = anagramas (parte termina, parte é interrompida no meio); tarefa B sem relação = ler currículos e decidir contratações. Entre as duas, uma tarefa de decisão lexical — letras piscam na tela e você diz se é palavra — que flagra o que continua ativo: palavras da tarefa A ainda quentes são reconhecidas mais rápido. Quem saiu pela metade teve mais resíduo e leu os currículos pior. O exemplo concreto que fecha o mecanismo é a tradução pro dia do leitor (14h estraga as 15h), em prosa, sem :::ex.", "answer_en": "How Leroy measured it: two lab experiments. Task A = anagrams (some finish, some cut off mid-puzzle); unrelated task B = reading résumés and making hiring calls. In between, a lexical decision task — letter strings flash, you say whether each is a real word — which catches what's still active: warm task-A words get recognized faster. Those cut off carried more residue and read the résumés worse. The concrete close is the reader's own day (2 o'clock wrecks 3), in prose, no :::ex card."}, {"id": "myth_busts", "answer_pt": "Três mitos, escritos como parágrafos de prosa e não como :::list-icon com close-circle (regra prose-led vence o template). (1) 'É só terminar' — o próprio experimento contradiz: quem terminou sob pressão de tempo soltou melhor do que quem terminou sem pressa; o que solta é o loop resolvido, não o trabalho concluído. (2) 'Resíduo é o mesmo que custo de troca' — Rubinstein, Meyer e Evans (2001) mediram recarga de regras em milissegundos; e o '40% de produtividade' é frase de divulgação da APA, não número do artigo. (3) 'Zeigarnik: a gente lembra o dobro das tarefas inacabadas' — não replicou em revisão sistemática com meta-análise de 2025; sobrou o efeito Ovsiankina (vontade de voltar, não memória melhor). Bônus no mesmo bloco: os '23 minutos e 15 segundos' não têm artigo revisado por pares por trás.", "answer_en": "Three myths, written as prose paragraphs rather than a close-circle :::list-icon (prose-led rule beats the template). (1) 'Just finish it' — the experiment itself contradicts this: people who finished under time pressure disengaged better than those who finished at leisure; what releases you is a resolved loop, not completed work. (2) 'Residue equals switch cost' — Rubinstein, Meyer and Evans (2001) measured rule reloading in milliseconds, and the '40% productivity' line is APA press framing, not a number from the paper. (3) 'Zeigarnik: unfinished tasks are remembered twice as well' — failed to replicate in a 2025 systematic review and meta-analysis; what survived is the Ovsiankina effect (a pull to resume, not better recall). Bonus in the same block: the '23 minutes 15 seconds' figure has no peer-reviewed source."}, {"id": "recipe", "answer_pt": "Quatro ações no único :::list-icon do corpo, todas ancoradas em achado citado: (a) três linhas antes de trocar — plano de retomada, o gesto com evidência de campo; (b) marcar a hora de encerrar, não só a de começar — deriva do achado de pressão de tempo (reunião de 50 com 10 de folga); (c) dar endereço ao 'depois' com dia e hora — vem da própria instrução de Leroy sobre o que adiar e retomar; (d) reenquadrar de 'não posso errar' para 'o que isso abre' — deriva de Leroy e Schmidt (2016), foco regulatório. Cortei uma quinta ação ('empilhe tarefas parecidas') por ser extrapolação sem achado que a sustente.", "answer_en": "Four actions in the body's only :::list-icon, each anchored in a cited finding: (a) three lines before switching — the ready-to-resume plan, the field-tested move; (b) set the stop time, not just the start time — from the time-pressure result (50-minute meeting with 10 to spare); (c) give 'later' an address, day and hour — straight out of Leroy's own instruction about what to postpone and resume; (d) reframe from 'I can't get this wrong' to 'what this opens' — from Leroy and Schmidt (2016) on regulatory focus. A fifth action ('batch similar tasks') was cut as unsupported extrapolation."}], "main_points": [{"id": "1_residuo_cobra_da_proxima", "what_pt": "Resíduo de atenção é a parte do foco que continua rodando na tarefa anterior depois que você já trocou — medido por Leroy (2009) com uma tarefa de decisão lexical entre duas tarefas sem relação.", "why_pt": "Porque o prejuízo aparece deslocado: não na tarefa que você largou, mas na seguinte, onde você acredita estar inteiro e por isso culpa sono, semana ou café.", "how_to_know_pt": "Se a tarefa das 15h rende mal e você não consegue nomear a causa, olhe o que aconteceu às 14h — especialmente se ficou pergunta em aberto."}, {"id": "2_terminar_nao_e_fechar", "what_pt": "Terminar e fechar são coisas diferentes: no mesmo experimento, quem terminou sob pressão de tempo soltou a tarefa melhor do que quem terminou sem pressa. O lever é o loop resolvido, e o fechamento mais barato é o plano de retomada de um minuto (Leroy e Glomb, 2018, estudo de campo com 202 profissionais).", "why_pt": "Porque a versão popular ('termine antes de trocar') é impossível na maioria dos dias e ainda por cima não é o que o estudo mostra — enquanto escrever três linhas cabe em qualquer agenda.", "how_to_know_pt": "Se você troca de tarefa e a anterior continua voltando na cabeça, o loop está aberto — mesmo que o trabalho esteja tecnicamente entregue."}, {"id": "3_tres_confusoes_e_a_receita", "what_pt": "Três literaturas parecidas e distintas: custo de troca (Rubinstein, 2001, milissegundos), resíduo de atenção (Leroy, minutos de pensamento residual) e Zeigarnik (memória, que não replicou — sobrou Ovsiankina). Desfeitas, resta uma receita de quatro gestos.", "why_pt": "Porque os números que circulam ('40% de produtividade', '23 minutos e 15 segundos') vêm de divulgação e de entrevistas, e acreditar neles leva a soluções erradas — bloquear notificação não fecha loop.", "how_to_know_pt": "Se a solução que te ofereceram é sobre eliminar interrupção, ela está mirando custo de troca. Resíduo se trata no momento da saída, não da entrada."}]}$rlog$::jsonb
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
  tracking_pt     = excluded.tracking_pt,
  tracking_en     = excluded.tracking_en,
  source_url      = excluded.source_url,
  source_label_pt = excluded.source_label_pt,
  source_label_en = excluded.source_label_en,
  reasoning_log   = excluded.reasoning_log,
  updated_at      = now();

insert into public.learning_material_sub (material_id, sub_id)
select m.id, s.sub_id
from public.learning_material m
cross join (values ('contemplate'), ('learn')) as s(sub_id)
where m.slug = 'attention-residue'
on conflict do nothing;
