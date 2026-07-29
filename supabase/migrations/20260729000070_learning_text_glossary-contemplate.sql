-- migration: 20260729000070_learning_text_glossary-contemplate.sql
-- purpose: Big-release rewrite — glossary-contemplate (explainer, mind).
-- affected: learning_material (upsert by slug) + learning_material_sub.
--           snapshot_material_revision trigger snapshots prior state + bumps version.
-- released_at: now() (re-dated for the release).
begin;
set local app.edited_by = 'big-release-20260729';
set local app.edit_summary = 'rewrite for big-release-20260729';

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
    'glossary-contemplate', 'explainer', 'mind', $topic$glossary-contemplate$topic$, 6,
    $title_pt$Contemplar: a mente que foge e volta$title_pt$,
    $title_en$Contemplation: the mind that wanders and returns$title_en$,
    $summary_pt$Metade da sua vida acordada acontece com a cabeça em outro lugar; contemplar é o treino de perceber isso e voltar — modesto, real e nada mágico.$summary_pt$,
    $summary_en$Half your waking life happens with your head somewhere else; contemplation is the training to notice that and come back — modest, real, and nothing magical.$summary_en$,
    $body_pt$Você está lendo esta frase, mas uma parte de você já foi embora. Uma mensagem que ficou sem resposta. Algo que alguém falou ontem e continua entalado. O jantar. A mente faz isso sozinha, o dia inteiro, sem pedir licença.

Contemplar é o nome antigo pra uma habilidade específica: perceber que você saiu do presente e voltar de propósito. Não é esvaziar a cabeça nem virar monge. É treinar a atenção — o mesmo músculo que a vida moderna passa o dia inteiro puxando pra todo lado.

A pergunta honesta é se isso funciona e, se funciona, quanto. Entre o marketing de app de meditação e o desprezo de quem acha tudo firula, existe uma resposta científica — modesta, real, e mais interessante que os dois extremos.

## 1. Metade do tempo, você não está aqui

Em 2010, dois pesquisadores de Harvard criaram um app que tocava no celular de 2.250 adultos em horas aleatórias e perguntava três coisas: o que você está fazendo, no que está pensando e quão feliz está. Juntaram mais de 250 mil respostas colhidas no dia real das pessoas.

O resultado incomodou. A mente das pessoas estava longe do que elas faziam em quase toda atividade — no trabalho, no ônibus, até no sexo. E o detalhe que virou o senso comum de cabeça pra baixo: a divagação vinha antes da queda de humor, não depois. Não é que você escapa pra dentro da cabeça porque está mal. Você fica mal porque escapou.

:::stat[46,9%]
Da vida acordada a mente passa pensando em outra coisa que não o presente — e a divagação vem *antes* da infelicidade, não depois. Killingsworth & Gilbert, *Science*, 2010.
:::

> A mente humana é uma mente que vagueia, e uma mente que vagueia é uma mente infeliz.

Divagar não é defeito. É a marca da mente humana — você consegue ensaiar o futuro e remoer o passado, uma façanha que nenhum outro animal faz igual. O custo é emocional: quem vive no que não está aqui perde o que está. (A leitura causal é a melhor inferência dos autores, não uma prova fechada — mas o padrão apareceu forte.)

E o ambiente moderno puxa a corda ao contrário. A pesquisadora Gloria Mark cronometrou, por anos, quanto tempo trabalhadores de escritório ficam numa tela antes de trocar de tarefa: caiu de cerca de 2,5 minutos em 2004 pra menos de um minuto por volta de 2016. Trate o número com folga — vem do registro de um só laboratório, não de um consenso independente; a direção é mais confiável que a casa decimal.

Contemplar é a resposta antiga a esse problema. "A vida não examinada não vale a pena ser vivida", disse Sócrates. Examinar é voltar a atenção pra dentro de propósito — e o primeiro passo é simplesmente perceber que você tinha saído.

## 2. O que a contemplação faz — e o que não faz

Primeiro, o que "meditação" significa nesses estudos, porque não é uma coisa só. A versão mais estudada é a atenção plena, o mindfulness. Jon Kabat-Zinn, que levou a prática pra dentro dos hospitais nos anos 1970, define assim: prestar atenção de um jeito específico — de propósito, no momento presente, e sem julgar o que aparece. Não é esvaziar a mente. É notar pra onde ela foi e trazer de volta, de novo e de novo, sem se xingar por ter saído.

Agora, o que a ciência de fato encontrou. A revisão mais cuidadosa juntou 47 ensaios clínicos randomizados, com 3.515 pessoas, publicada no *JAMA Internal Medicine* em 2014. Programas estruturados de meditação melhoraram ansiedade, depressão e dor. O tamanho do efeito — a régua que pesquisadores usam pra medir "quanto" — ficou entre pequeno e moderado. Real, mensurável, mas longe da transformação de antes-e-depois que os apps vendem.

E aqui está a parte que quase ninguém conta: nesses mesmos dados, não houve evidência clara de que meditar seja melhor do que outros tratamentos ativos — remédio, exercício, terapia. Meditação ganha de não fazer nada. Não ganha de sair pra caminhar. É uma afirmação bem mais humilde que "meditação cura ansiedade".

Onde a evidência é mais forte: recaída de depressão. A terapia cognitiva baseada em mindfulness — MBCT, um curso estruturado de oito semanas pra quem já teve depressão — corta o risco de recair em cerca de um terço, comparada ao cuidado habitual (Kuyken, *JAMA Psychiatry*, 2016, com 1.258 pacientes). Aqui a prática chega perto do efeito de um antidepressivo. É o caso mais sólido a favor.

E o cérebro? Você já viu a manchete: "oito semanas de meditação mudam a estrutura do seu cérebro". Ela vem de um estudo real (Hölzel, 2011) que viu aumento da densidade de massa cinzenta em regiões ligadas a memória e regulação emocional. Só que o estudo tinha 31 pessoas. É sugestivo, não é lei. A fama da frase corre mais rápido que o tamanho da amostra.

Por fim, o que os folhetos não dizem: meditar nem sempre é inofensivo. Uma revisão de 83 estudos encontrou que cerca de 1 em cada 12 praticantes relata algum efeito adverso — ansiedade, angústia, uma sensação de desconexão. Em pesquisas de campo, sem instrutor, chega a 1 em 3. A prática guiada e supervisionada dos ensaios clínicos não é a mesma coisa que um app usado sozinho às duas da manhã. Mais nem sempre é melhor.

## 3. Contemplar é mais que sentar de pernas cruzadas

Boa notícia: sentar em silêncio é só uma porta. Contemplar — voltar a atenção pra dentro de propósito — tem várias formas, e algumas têm evidência tão boa quanto a meditação, com menos barreira de entrada.

Escrever é uma delas. Uma meta-análise de 146 estudos mostrou que colocar no papel o que te incomoda traz um benefício pequeno mas real pra saúde física e mental — maior justamente pra quem está sob muito estresse ou tende ao pessimismo (Frattaroli, 2006). Sessões acima de 15 minutos funcionam melhor que rabiscos rápidos.

Outra é falar consigo de fora. Num conjunto de estudos, trocar o "eu" pelo próprio nome no meio do estresse — "por que o André está nervoso?" em vez de "por que eu estou nervoso?" — reduziu a reação emocional em cerca de um segundo, sem exigir mais esforço mental que o normal (Kross, 2014). É o truque mais barato desta lista.

E tem a bondade amorosa: poucos minutos desejando bem, de propósito, a você e a outras pessoas. Num ensaio com 139 adultos, ela aumentou as emoções positivas do dia a dia, que por sua vez previram mais satisfação com a vida e menos sintomas de depressão (Fredrickson, 2008).

A receita mínima pra começar amanhã:

:::list-icon
leaf | 5 a 10 minutos de atenção guiada, de preferência num programa estruturado com instrutor (os cursos de 8 semanas), não só num app solto.
book | 15 minutos escrevendo à mão sobre o que está pesando — sem se preocupar com a gramática.
chatbubbles | No auge do estresse, fale de si na terceira pessoa: troque o "eu" pelo seu nome.
heart | 2 a 3 vezes por semana, alguns minutos desejando bem a você e a quem você conhece.
shield | Se surgir ansiedade forte ou uma sensação de desconexão, pare e procure orientação.
:::

Três mitos pra soltar no caminho. Você não precisa de um app pago — a evidência mais forte vem de cursos com instrutor, não de assinatura. A prática não "dá certo" ficando com a mente em branco; o objetivo é notar pra onde ela foi, não impedir que ela vá. E mais tempo nem sempre é melhor: se surgir ansiedade forte ou uma sensação de desconexão, isso é sinal pra parar e buscar orientação, não pra insistir.

Contemplar não promete transcendência. Promete algo mais útil: a capacidade de perceber que você sumiu e voltar. Metade da sua vida acordada acontece com a cabeça em outro lugar. Cada retorno treinado é um pedaço dessa metade de volta — de graça, a qualquer hora, sem precisar acreditar em nada.

:::source[Goyal M, et al., 2014 · JAMA Internal Medicine · n=3.515 (47 ensaios)](https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/1809754)$body_pt$,
    $body_en$You're reading this sentence, but part of you already left. A message you never answered. Something someone said yesterday that's still lodged in there. Dinner. The mind does this on its own, all day, without asking permission.

Contemplation is the old name for a specific skill: noticing you've drifted out of the present and coming back on purpose. It isn't emptying your head or becoming a monk. It's training attention — the same muscle modern life spends all day yanking in every direction.

The honest question is whether it works and, if so, how much. Between meditation-app marketing and the eye-roll of people who think it's all nonsense, there's a scientific answer — modest, real, and more interesting than either extreme.

## 1. Half the time, you're not here

In 2010, two Harvard researchers built an app that pinged 2,250 adults at random moments and asked three things: what are you doing, what are you thinking about, and how happy are you. They gathered more than 250,000 responses from people's real days.

The result stung. People's minds were somewhere other than their task during almost every activity — at work, on the bus, even during sex. And the detail that flipped common sense on its head: the wandering came before the mood dropped, not after. It's not that you escape into your head because you feel bad. You feel bad because you escaped.

:::stat[46.9%]
Of waking life the mind spends thinking about something other than the present — and the wandering comes *before* the unhappiness, not after. Killingsworth & Gilbert, *Science*, 2010.
:::

> A human mind is a wandering mind, and a wandering mind is an unhappy mind.

Wandering isn't a defect. It's the signature of the human mind — you can rehearse the future and chew on the past, a feat no other animal pulls off the same way. The cost is emotional: live in what isn't here and you miss what is. (The causal reading is the authors' best inference, not airtight proof — but the pattern showed up strong.)

The modern environment pulls the rope the wrong way. Researcher Gloria Mark spent years timing how long office workers stay on one screen before switching tasks: it fell from about 2.5 minutes in 2004 to under a minute by 2016. Hold that number loosely — it comes from one lab's own logging, not an independent consensus; the direction is sturdier than the decimal.

Contemplation is the old answer to this problem. "The unexamined life is not worth living," said Socrates. To examine is to turn attention inward on purpose — and the first step is simply noticing you had left.

## 2. What contemplation does — and doesn't — do

First, what "meditation" even means in these studies, because it isn't one thing. The most-studied version is mindfulness. Jon Kabat-Zinn, who brought the practice into hospitals in the 1970s, defines it as paying attention in a particular way: on purpose, in the present moment, and without judging what shows up. Not emptying the mind. Noticing where it went and bringing it back, again and again, without scolding yourself for leaving.

Now, what the science actually found. The most careful review pooled 47 randomized controlled trials, 3,515 people, published in *JAMA Internal Medicine* in 2014. Structured meditation programs improved anxiety, depression, and pain. The effect size — the ruler researchers use to measure "how much" — landed between small and moderate. Real, measurable, but far from the before-and-after transformation apps sell.

And here's the part almost nobody mentions: in that same data, there was no clear evidence that meditating beats other active treatments — medication, exercise, therapy. Meditation beats doing nothing. It doesn't beat going for a walk. That's a much humbler claim than "meditation cures anxiety."

Where the evidence is strongest: depression relapse. Mindfulness-based cognitive therapy — MBCT, a structured eight-week course for people who've already had depression — cuts the risk of relapsing by about a third versus usual care (Kuyken, *JAMA Psychiatry*, 2016, 1,258 patients). Here the practice edges close to an antidepressant's effect. It's the sturdiest case in its favor.

What about the brain? You've seen the headline: "eight weeks of meditation change your brain's structure." It comes from a real study (Hölzel, 2011) that found more gray-matter density in regions tied to memory and emotion regulation. But the study had 31 people. Suggestive, not settled. The fame of the claim outruns the size of the sample.

Finally, what the brochures skip: meditation isn't always harmless. A review of 83 studies found that roughly 1 in 12 practitioners reports an adverse effect — anxiety, distress, a sense of disconnection. In field surveys, unsupervised, it reaches 1 in 3. The guided, supervised practice in clinical trials isn't the same as an app used alone at 2 a.m. More isn't always better.

## 3. Contemplation is broader than sitting cross-legged

Good news: sitting in silence is only one door. Contemplation — turning attention inward on purpose — comes in several forms, and some carry evidence as good as meditation with a lower barrier to entry.

Writing is one. A meta-analysis of 146 studies found that putting what troubles you on paper brings a small but real benefit to physical and mental health — bigger precisely for people under heavy stress or prone to pessimism (Frattaroli, 2006). Sessions over 15 minutes beat quick scribbles.

Another is talking to yourself from the outside. Across a set of studies, swapping "I" for your own name mid-stress — "why is Alex nervous?" instead of "why am I nervous?" — cut the emotional reaction within about a second, with no more mental effort than usual (Kross, 2014). It's the cheapest trick on this list.

Then there's loving-kindness: a few minutes of deliberately wishing yourself and other people well. In a trial of 139 adults, it raised everyday positive emotions, which in turn predicted more life satisfaction and fewer depressive symptoms (Fredrickson, 2008).

The minimum recipe to start tomorrow:

:::list-icon
leaf | 5 to 10 minutes of guided attention, ideally in a structured program with a trained instructor (the 8-week courses), not just a loose app.
book | 15 minutes writing by hand about what's weighing on you — never mind the grammar.
chatbubbles | At peak stress, talk about yourself in the third person: swap "I" for your name.
heart | 2 to 3 times a week, a few minutes wishing yourself and people you know well.
shield | If strong anxiety or a sense of disconnection shows up, stop and seek guidance.
:::

Three myths to drop on the way. You don't need a paid app — the strongest evidence comes from instructor-led courses, not a subscription. The practice doesn't "work" by going blank; the goal is to notice where the mind went, not to stop it from going. And more isn't always better: if strong anxiety or a sense of disconnection shows up, that's a signal to stop and seek guidance, not to push through.

Contemplation doesn't promise transcendence. It promises something more useful: the ability to notice you've vanished and come back. Half your waking life happens with your head elsewhere. Every trained return is a piece of that half reclaimed — free, any time, no belief required.

:::source[Goyal M, et al., 2014 · JAMA Internal Medicine · n=3,515 (47 trials)](https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/1809754)$body_en$,
    array[$tkpt0$A mente vaga cerca de metade do tempo acordado, e essa divagação tende a vir antes da infelicidade, não depois.$tkpt0$, $tkpt1$Meditação estruturada tem efeito pequeno-a-moderado em ansiedade e depressão e corta recaída depressiva em ~1/3 — mas não vence caminhada ou remédio, e ~1 em 12 relata efeito adverso.$tkpt1$, $tkpt2$Contemplar é mais que meditar: escrever 15 minutos, falar de si na terceira pessoa e desejar bem a outros têm evidência própria e menos barreira.$tkpt2$]::text[],
    array[$tken0$The mind wanders about half of waking time, and that wandering tends to come before unhappiness, not after.$tken0$, $tken1$Structured meditation has a small-to-moderate effect on anxiety and depression and cuts depressive relapse by ~1/3 — but doesn't beat a walk or medication, and ~1 in 12 reports an adverse effect.$tken1$, $tken2$Contemplation is more than meditation: 15 minutes of writing, third-person self-talk, and wishing others well each have their own evidence and a lower barrier.$tken2$]::text[],
    $trk_pt$No app, cada tarefa da subdimensão Contemplar — meditar, escrever, refletir — é um retorno treinado da atenção. Registrar 5 minutos hoje rende mais que planejar 30 pra semana que vem: a Dedicação e o Momentum premiam a regularidade, que é exatamente o que a evidência pede. Se você tende ao estresse, o benefício da escrita costuma ser maior — comece por aí.$trk_pt$,
    $trk_en$In the app, every task under the Contemplate sub — meditate, write, reflect — is one trained return of attention. Logging 5 minutes today does more than planning 30 for next week: Dedication and Momentum reward regularity, which is exactly what the evidence asks for. If you run stressed, the writing benefit tends to be larger — start there.$trk_en$,
    $src_url$https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/1809754$src_url$,
    $src_pt$Goyal M, et al., 2014 · JAMA Internal Medicine · n=3.515 (47 ensaios)$src_pt$,
    $src_en$Goyal M, et al., 2014 · JAMA Internal Medicine · n=3,515 (47 trials)$src_en$,
    $rlog${"template_type":"explainer","template_version":1,"voice_principles_applied":["3 main ideas exactly — stakes (wandering mind), honest evidence, broader recipe. No 7-point sprawl.","Prose-led. Body carries 2 fenced cards total: one :::stat (thesis/stakes) + one :::list-icon (recipe) + closing :::source. One light markdown blockquote for the Killingsworth line.","Native PT and native EN written separately, not translated — different idioms (firula / eye-roll), separate cadence.","Jargon defined on first mention: contemplar, mindfulness (Kabat-Zinn definition), MBCT, tamanho de efeito / effect size, bondade amorosa / loving-kindness, divagação / mind-wandering.","Honest caveats flagged inline: Killingsworth causal direction is authors' inference; Gloria Mark numbers are one lab's logging; Hölzel n=31 suggestive not settled; adverse events real (1 in 12 to 1 in 3); meditation beats inactivity, not active treatments.","Concrete anchors instead of abstract noun lists: the ping-app study, 'por que o André está nervoso', 15-minute handwriting, the shield/stop action.","Stat card owns the precise 46.9% figure; prose uses the human 'metade' framing only as a closing callback — no verbatim redundancy.","Consistent second-person 'você' / 'you' throughout; no '---' rule (renderer would print it literally)."],"steps":[{"id":"hook","answer_pt":"Você está lendo, mas parte da sua mente já saiu — mensagem, algo de ontem, o jantar. Contemplar é perceber a fuga e voltar de propósito. Funciona? E quanto? A ciência responde algo modesto e real, entre o hype de app e o desprezo de quem acha firula.","answer_en":"You're reading, but part of your mind already left — a message, something from yesterday, dinner. Contemplation is noticing the drift and coming back on purpose. Does it work, and how much? Science gives a modest, real answer between app hype and the skeptic's eye-roll."},{"id":"thesis","answer_pt":"A mente humana passa quase metade da vida acordada divagando, e a divagação vem antes da infelicidade — contemplar é a habilidade treinável de perceber e voltar. Vira o stat block (46,9%, Killingsworth & Gilbert, Science 2010).","answer_en":"The human mind spends nearly half of waking life wandering, and the wandering comes before unhappiness — contemplation is the trainable skill of noticing and returning. Becomes the stat block (46.9%, Killingsworth & Gilbert, Science 2010)."},{"id":"real_definition","answer_pt":"Contemplar não é esvaziar a mente nem virar monge. É a definição de Kabat-Zinn para atenção plena: prestar atenção de propósito, no presente, sem julgar. E é mais amplo que meditar — inclui escrita, fala em terceira pessoa e bondade amorosa.","answer_en":"Contemplation isn't emptying the mind or becoming a monk. It's Kabat-Zinn's definition of mindfulness: paying attention on purpose, in the present, without judging. And it's broader than meditation — it includes writing, third-person self-talk, and loving-kindness."},{"id":"stakes","answer_pt":"Número duro: a mente diverge do presente 46,9% das horas acordadas (n=2.250, ~250 mil pontos), e a divagação precede a queda de humor — não segue. Fonte peer-reviewed forte (Science, 2010).","answer_en":"Hard number: the mind diverges from the present 46.9% of waking hours (n=2,250, ~250k data points), and wandering precedes the mood drop — it doesn't follow. Strong peer-reviewed source (Science, 2010)."},{"id":"mechanism","answer_pt":"A evidência real: revisão de 47 RCTs (n=3.515) mostra efeito pequeno-a-moderado em ansiedade/depressão/dor, mas sem vencer tratamentos ativos. MBCT corta recaída depressiva em ~1/3 (Kuyken). Cérebro (Hölzel n=31) é sugestivo. Efeitos adversos são reais. Exemplo concreto: falar de si na terceira pessoa corta a reação em ~1 segundo (Kross).","answer_en":"The real evidence: a review of 47 RCTs (n=3,515) shows a small-to-moderate effect on anxiety/depression/pain but no win over active treatments. MBCT cuts depressive relapse by ~1/3 (Kuyken). Brain change (Hölzel n=31) is suggestive. Adverse effects are real. Concrete example: third-person self-talk cuts the reaction within ~1 second (Kross)."},{"id":"myth_busts","answer_pt":"Três mitos em prosa: (1) não precisa de app pago — a evidência forte é de cursos com instrutor; (2) não 'dá certo' com a mente em branco — o objetivo é notar pra onde ela foi; (3) mais nem sempre é melhor — ansiedade forte ou desconexão é sinal pra parar.","answer_en":"Three myths in prose: (1) no paid app needed — strong evidence is from instructor-led courses; (2) it doesn't 'work' by going blank — the goal is noticing where the mind went; (3) more isn't always better — strong anxiety or disconnection is a signal to stop."},{"id":"recipe","answer_pt":":::list-icon com 5 ações: atenção guiada 5-10 min (programa com instrutor), escrita à mão 15 min, fala em terceira pessoa no estresse, bondade amorosa 2-3x/semana, e parar se surgir angústia forte.","answer_en":":::list-icon with 5 actions: 5-10 min guided attention (instructor-led program), 15 min handwriting, third-person self-talk under stress, loving-kindness 2-3x/week, and stop if strong distress appears."}],"main_points":[{"id":"1_wandering_mind","what_pt":"A mente vaga cerca de metade da vida acordada, e a divagação tende a vir antes da infelicidade, não depois.","what_en":"The mind wanders roughly half of waking life, and the wandering tends to come before unhappiness, not after.","why_pt":"É a razão de existir a contemplação: sem treino, você perde metade do presente e paga em humor.","why_en":"It's the reason contemplation exists: untrained, you lose half the present and pay for it in mood.","how_to_know_pt":"Repare quantas vezes, só ao ler esta frase, sua cabeça já foi pra outra coisa — esse é o padrão a treinar."},{"id":"2_honest_evidence","what_pt":"Meditação estruturada tem efeito pequeno-a-moderado em ansiedade e depressão e corta recaída depressiva em ~1/3, mas não vence exercício ou remédio — e ~1 em 12 relata efeito adverso.","what_en":"Structured meditation has a small-to-moderate effect on anxiety and depression and cuts depressive relapse by ~1/3, but doesn't beat exercise or medication — and ~1 in 12 reports an adverse effect.","why_pt":"Corrige tanto o exagero do marketing quanto o desprezo dos céticos: o benefício é real e modesto, não mágico nem inofensivo.","why_en":"It corrects both the marketing hype and the skeptics' scorn: the benefit is real and modest, neither magic nor harmless.","how_to_know_pt":"Se alguém promete cura ou transformação em 8 semanas, ou jura que é 100% seguro, está passando do que os ensaios mostram."},{"id":"3_broader_recipe","what_pt":"Contemplar é mais que meditar: escrever 15 minutos, falar de si na terceira pessoa e desejar bem a outros têm evidência própria e menos barreira.","what_en":"Contemplation is more than meditation: 15-min writing, third-person self-talk, and wishing others well each have their own evidence and lower barriers.","why_pt":"Amplia as portas de entrada — quem não gosta de sentar em silêncio ainda tem caminhos comprovados.","why_en":"It widens the entry points — people who dislike sitting in silence still have proven paths.","how_to_know_pt":"Escolha uma prática que caiba amanhã (5 minutos), de preferência guiada no começo, e repita — a regularidade importa mais que a duração."}]}$rlog$::jsonb, now()
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
    released_at = now()
  returning id
)
  insert into public.learning_material_sub (material_id, sub_id)
  select id, 'contemplate' from up on conflict (material_id, sub_id) do nothing;

commit;
