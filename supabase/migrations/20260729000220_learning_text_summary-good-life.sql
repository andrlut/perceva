-- migration: 20260729000220_learning_text_summary-good-life.sql
-- purpose: Big-release new — summary-good-life (summary, bonds).
-- affected: learning_material (upsert by slug) + learning_material_sub.
--           snapshot_material_revision trigger snapshots prior state + bumps version.
-- released_at: now() (new material).
begin;
set local app.edited_by = 'big-release-20260729';
set local app.edit_summary = 'new for big-release-20260729';

insert into public.learning_material
  (slug, type, dimension_id, topic, reading_minutes,
   title_pt, title_en, summary_pt, summary_en,
   body_pt, body_en,
   takeaways_pt, takeaways_en,
   tracking_pt, tracking_en,
   source_url, source_label_pt, source_label_en,
   reasoning_log, released_at)
values (
  'summary-good-life', 'summary', 'bonds', $topic$summary-good-life$topic$, 7,
  $title_pt$A Vida Boa: o que 85 anos revelam$title_pt$,
  $title_en$The Good Life: what 85 years reveal$title_en$,
  $summary_pt$O estudo mais longo já feito sobre felicidade tem uma resposta teimosa — e ela não é dinheiro nem colesterol: são as suas relações.$summary_pt$,
  $summary_en$The longest study ever run on happiness has one stubborn answer — and it isn't money or cholesterol: it's your relationships.$summary_en$,
  $body_pt$Em 1938, um grupo de pesquisadores de Harvard começou a acompanhar 724 rapazes com uma pergunta simples e teimosa: o que faz uma vida dar certo? Não perguntaram uma vez. Perguntaram a cada dois anos, pela vida inteira — exames de sangue, entrevistas na sala de casa, conversas com as esposas, escaneamento de cérebro décadas depois. Oitenta e cinco anos e três gerações mais tarde, o estudo ainda está rodando. É a pesquisa mais longa já feita sobre a felicidade adulta.

E a resposta que saiu de tanta paciência não foi dinheiro, fama, colesterol nem genética. Foi a única coisa que quase ninguém coloca no topo de uma lista de saúde: a qualidade das suas relações. Robert Waldinger e Marc Schulz, os dois psicólogos que dirigem o estudo hoje, transformaram essas oito décadas de dados num livro — *The Good Life* (2023). A tese cabe numa frase.

:::quote{author="Robert Waldinger e Marc Schulz", source="The Good Life (2023)"}
Boas relações nos mantêm mais felizes e mais saudáveis. Ponto.
:::

Parece óbvio até você ver o quanto isso pesa nos números — e o quanto quase ninguém trata uma relação como algo que precisa de treino.

## 1. A descoberta que ninguém esperava: relação prevê saúde décadas depois

A descoberta que deu manchete é esta: entre os homens do estudo, quem estava mais satisfeito com suas relações aos 50 anos era quem estava mais saudável aos 80. E o nível dessa satisfação previu a saúde física na velhice melhor do que o colesterol previu. Waldinger repete isso em toda entrevista — é o número-assinatura do estudo.

Vale um cuidado honesto: essa comparação com o colesterol vem das falas dele, não de uma tabela publicada pondo os dois lado a lado. Trate como direção, não como placar exato.

O outro lado da mesma moeda é a solidão, e aqui Waldinger não usa meias-palavras:

> A solidão mata. É tão poderosa quanto fumar ou o alcoolismo.

É uma frase de efeito — ele mesmo não coloca um número ao lado. Mas a direção tem lastro fora de Harvard. Em 2010, a pesquisadora Julianne Holt-Lunstad juntou 148 estudos separados num só cálculo — uma meta-análise, que é exatamente isso: empilhar muitas pesquisas pra enxergar o padrão que nenhuma sozinha mostra. Somaram **308.849 pessoas**. Resultado: quem tinha relações sociais mais fortes teve cerca de **50% mais chance** de continuar vivo ao longo do acompanhamento. Quando a medida de integração social era mais completa, a diferença chegava a 91%.

É aqui que os números de Harvard ganham musculatura: essa meta-análise não é do grupo de Harvard, é gente independente, com uma amostra centenas de vezes maior. É a evidência mais forte de todo o material — justamente por isso.

Uma ressalva que muda tudo: nada disso é experimento. O estudo observa vidas acontecerem — ninguém sorteou quem teria casamento feliz e quem teria solidão. Então o que existe é uma associação forte e repetida ao longo de décadas: relação prevê saúde. "Prevê", não "causa". É uma diferença que muda o que você pode concluir.

## 2. Não é quantas pessoas — é o calor delas

Se relação faz tudo isso, a pergunta seguinte é: qual relação? E aqui o estudo é específico de um jeito que surpreende. Não é o tamanho da sua lista de contatos. Uma pessoa pode viver cercada de gente e se sentir sozinha; outra pode ter dois ou três laços profundos e prosperar. O que protege é o calor da relação, não a contagem.

A evidência mais bonita nesse ponto veio de um sub-estudo dos próprios Waldinger e Schulz, com 47 casais na casa dos 80 anos. Eles pediram que cada pessoa anotasse, dia após dia, quanta dor física sentia e quão feliz estava. O padrão: nos dias de mais dor, o humor despencava — mas só para quem estava num casamento insatisfeito. Entre os casais mais satisfeitos, a dor e o humor simplesmente se descolaram. A dor continuava lá; o dia bom, também. Uma relação boa não tira a dor do corpo. Ela tira o poder que a dor tem sobre o resto do seu dia.

Um detalhe honesto do mesmo estudo: o vínculo direto entre "passar tempo com os outros" e estar feliz naquele dia foi apenas marginal — bem no limite da significância estatística. Ou seja, não é a presença de gente que faz o efeito. É a qualidade do vínculo. Tempo com quem te esgota não conta.

E aqui mora a crítica mais justa ao livro. A revista *Psychology Today* apontou que Waldinger e Schulz nunca definem com precisão o que é uma "boa relação". É calor? Confiança? Sentir-se visto? O livro fica na intuição. Você reconhece uma boa relação quando está numa — mas a ciência gostaria de uma régua, e essa régua o livro não entrega.

## 3. Fitness social: relação é treino, não sorte

A ideia mais útil do livro é uma virada de chave. A gente trata o corpo como algo que precisa de manutenção — você malha, corre, cuida da comida. Mas trata as relações como se fossem permanentes por natureza: os amigos vão estar lá, a família vai estar lá. Waldinger e Schulz chamam isso de erro e propõem o oposto: fitness social.

Fitness social é encarar seus relacionamentos como músculos. Se você não usa, atrofiam. O amigo que você "sempre quis ligar" e nunca liga vai sumindo — não por briga, mas por falta de uso. A prática é ativa: manter um vínculo é uma escolha repetida, não um estado garantido. Os autores embrulham isso num modelo com sigla, o W.I.S.E.R. — uma ferramenta de comunicação, boa pra lembrar dos passos, mas é bom saber que é um invento didático dos autores, não um método testado em laboratório com efeito medido.

O que isso vira na prática amanhã:

:::list-icon
people | Faça um inventário rápido: quem te dá energia, quem te drena. Invista mais nos primeiros.
chatbubbles | Mande a mensagem que você vem adiando. O vínculo enfraquece por falta de uso, não por briga.
heart | Priorize profundidade, não número: dois ou três laços de verdade valem mais que cem contatos.
timer | Reserve tempo recorrente pra quem importa — do mesmo jeito que você marca um treino.
:::

Nenhuma dessas ações é grande. É esse o ponto de um estudo de 85 anos: o que segura uma vida em pé não são os gestos enormes, são os pequenos, repetidos por décadas.

Uma última honestidade, porque ela importa. Os 724 originais eram todos homens, quase todos brancos, metade deles alunos de Harvard nos anos 1930. Mulheres e diversidade racial só entraram com os filhos, gerações depois. O próprio Waldinger admite: "Todo estudo é limitado, toda amostra é enviesada, nenhuma é totalmente representativa." Ou seja: "boas relações fazem bem" é uma direção sólida, repetida em outras populações — mas a receita fina de "o que é uma vida boa" saiu de um grupo estreito de homens do século passado. Leve o mapa, desconfie das coordenadas exatas. E, mesmo assim, se 85 anos de dados apontam para um único lugar, é para este: cuide de quem você ama como se fosse treino. Porque é.

:::source[Waldinger & Schulz · The Good Life (Simon & Schuster, 2023) · ISBN 978-1-9821-6669-4](https://the-good-life-book.com/)$body_pt$,
  $body_en$In 1938, a team of Harvard researchers started following 724 young men with one stubborn question: what makes a life go well? They didn't ask once. They asked every two years, for the rest of those lives — blood work, interviews in the living room, conversations with the wives, brain scans decades later. Eighty-five years and three generations on, the study is still running. It's the longest study of adult happiness ever conducted.

And the answer that fell out of all that patience wasn't money, fame, cholesterol, or genes. It was the one thing almost nobody puts at the top of a health checklist: the quality of your relationships. Robert Waldinger and Marc Schulz, the two psychologists who run the study today, turned those eight decades of data into a book — *The Good Life* (2023). The thesis fits in one line.

:::quote{author="Robert Waldinger and Marc Schulz", source="The Good Life (2023)"}
Good relationships keep us happier and healthier. Period.
:::

Obvious — until you see how hard it lands in the numbers, and how few of us treat a relationship as something that needs training.

## 1. The finding nobody saw coming: relationships predict your health decades out

Here's the headline finding: among the men in the study, the ones most satisfied with their relationships at 50 were the healthiest at 80. And how satisfied they were with those relationships predicted their physical health in old age better than their cholesterol did. Waldinger repeats it in every interview — it's the study's signature line.

One honest flag: that cholesterol comparison comes from Waldinger's interviews, not from a published table setting the two side by side. Take it as a direction, not a precise scoreboard.

The flip side of the same coin is loneliness, and here Waldinger doesn't hedge:

> Loneliness kills. It's as powerful as smoking or alcoholism.

It's a soundbite — he doesn't attach a number to it himself. But the direction holds up well outside Harvard. In 2010, researcher Julianne Holt-Lunstad pooled 148 separate studies into a single calculation — a meta-analysis, which is exactly that: stacking many studies to see the pattern no single one can show. Together they covered **308,849 people**. The result: people with stronger social relationships had roughly a **50% higher chance** of still being alive across the follow-up. Where the measure of social integration was richer, the gap reached 91%.

This is where the Harvard numbers grow muscle: that meta-analysis isn't from the Harvard team — it's independent researchers with a sample hundreds of times larger. That's precisely why it's the strongest evidence in the whole file.

And a caveat that changes everything: none of this is an experiment. The study watches lives unfold — nobody assigned who'd get a happy marriage and who'd get isolation. So what exists is a strong, repeated association across decades: relationships predict health. Predict, not cause. That difference changes what you're allowed to conclude.

## 2. It's not how many people — it's how warm they are

If relationships do all that, the next question is: which relationships? Here the study is specific in a surprising way. It's not the size of your contact list. A person can live surrounded by people and feel alone; another can have two or three deep bonds and thrive. What protects you is the warmth of the relationship, not the headcount.

The most beautiful evidence on this came from a Waldinger-and-Schulz sub-study of 47 couples in their 80s. They asked each person to log, day after day, how much physical pain they felt and how happy they were. The pattern: on higher-pain days, mood dropped — but only for people in an unhappy marriage. Among the most satisfied couples, pain and mood simply came apart. The pain was still there; so was the good day. A good relationship doesn't take the pain out of your body. It takes away the power that pain has over the rest of your day.

One honest detail from the same study: the direct link between "time spent with others" and being happy that day was only marginal — right at the edge of statistical significance. Presence of people isn't what does it. Quality of the bond is. Time with someone who drains you doesn't count.

And this is the book's fairest criticism. Psychology Today pointed out that Waldinger and Schulz never precisely define what a "good relationship" is. Warmth? Trust? Feeling seen? The book stays at the level of intuition. You know a good relationship when you're in one — but science would like a ruler, and that ruler the book doesn't hand over.

## 3. Social fitness: a relationship is training, not luck

The book's most useful idea is a reframe. We treat the body as something that needs upkeep — you lift, you run, you watch what you eat. But we treat relationships as if they were permanent by nature: the friends will be there, the family will be there. Waldinger and Schulz call that a mistake, and propose the opposite: social fitness.

Social fitness means treating your relationships like muscles. Don't use them, and they atrophy. The friend you "always meant to call" and never do fades — not from a fight, but from disuse. The practice is active: keeping a bond alive is a repeated choice, not a guaranteed state. The authors wrap this in an acronym, the W.I.S.E.R. model — a communication tool, handy for remembering the steps, but worth knowing it's the authors' teaching device, not a lab-tested method with a measured effect.

What that turns into tomorrow:

:::list-icon
people | Take a quick inventory: who gives you energy, who drains it. Invest more in the first group.
chatbubbles | Send the message you keep putting off. Bonds weaken from disuse, not from conflict.
heart | Prioritize depth over count: two or three real bonds beat a hundred contacts.
timer | Block recurring time for the people who matter — the way you'd book a workout.
:::

None of these actions is big. That's the whole point of an 85-year study: what holds a life up isn't the grand gestures, it's the small ones, repeated for decades.

One last piece of honesty, because it matters. The original 724 were all men, nearly all white, half of them Harvard undergraduates in the 1930s. Women and racial diversity only entered through the children, generations later. Waldinger admits it himself: "Every study is limited, every sample is skewed, no sample is completely representative." So "good relationships are good for you" is a solid direction, echoed in other populations — but the fine-grained recipe for "what makes a good life" came from a narrow group of last-century men. Take the map; distrust the exact coordinates. And even so, if 85 years of data point at one place, it's this: tend to the people you love as if it were training. Because it is.

:::source[Waldinger & Schulz · The Good Life (Simon & Schuster, 2023) · ISBN 978-1-9821-6669-4](https://the-good-life-book.com/)$body_en$,
  array[$tkpt0$A pesquisa mais longa sobre felicidade (85 anos, Harvard) aponta um fator acima de dinheiro, fama e até colesterol: a qualidade das suas relações.$tkpt0$, $tkpt1$Não é quantidade, é calor: dois ou três laços profundos protegem mais que uma agenda cheia — e uma relação boa até amortece o efeito da dor física no seu humor.$tkpt1$, $tkpt2$Trate relação como fitness social: vínculo é músculo e atrofia sem uso. Mande a mensagem que você adia — a manutenção é ativa, não garantida.$tkpt2$]::text[],
  array[$tken0$The longest study of adult happiness (85 years, Harvard) points to one factor above money, fame, even cholesterol: the quality of your relationships.$tken0$, $tken1$It's not headcount, it's warmth: two or three deep bonds protect more than a full calendar — and a good relationship even blunts how physical pain hits your mood.$tken1$, $tken2$Treat relationships as social fitness: a bond is a muscle that atrophies unused. Send the message you keep postponing — maintenance is active, not guaranteed.$tken2$]::text[],
  $trk_pt$No Perceva, isso vive na dimensão Vínculos — nos subs Círculo e Romance. Toda vez que você registra uma tarefa como "mandar mensagem para um amigo", marcar um encontro ou proteger um tempo de qualidade com quem ama, você está treinando fitness social de verdade. E o Momentum recompensa justamente a repetição — que é o que 85 anos de dados dizem que mais importa. Se seus laços andam no automático, criar uma tarefa recorrente em Círculo ou Romance é o primeiro passo concreto.$trk_pt$,
  $trk_en$In Perceva, this lives in the Bonds dimension — the Circle and Romance subs. Every time you log a task like "message a friend", schedule a date, or protect quality time with someone you love, you're training real social fitness. And Momentum rewards exactly the repetition that 85 years of data say matters most. If your bonds are running on autopilot, a recurring task in Circle or Romance is the concrete first step.$trk_en$,
  $src_url$https://the-good-life-book.com/$src_url$,
  $src_pt$Waldinger & Schulz · The Good Life (Simon & Schuster, 2023) · ISBN 978-1-9821-6669-4$src_pt$,
  $src_en$Waldinger & Schulz · The Good Life (Simon & Schuster, 2023) · ISBN 978-1-9821-6669-4$src_en$,
  $rlog${"template_type":"summary","template_version":1,"voice_principles_applied":["Three ideas, not seven (finding+stakes / quality-over-quantity / social-fitness recipe)","Prose-led: exactly 2 body cards (:::quote required directive + :::list-icon recipe) plus one light markdown blockquote and the closing :::source","Native PT and native EN written fresh, not translated","Jargon defined on first mention: meta-analysis, observational vs causal, 'marginal significance', social fitness, W.I.S.E.R. as a framing device","Concrete examples over abstract lists: the 47-couples pain/mood decoupling; the friend you 'always meant to call'","Honest caveats flagged and attributed (Psychology Today, Waldinger's own admission, observational-not-causal, marginal p-value)"],"steps":[{"id":"author_question","answer_pt":"Waldinger e Schulz herdaram uma pergunta que Harvard vinha perseguindo desde 1938: o que, ao longo de uma vida inteira, faz alguém terminar mais feliz e mais saudável? O livro é a destilação de 85 anos de dados dessa busca.","answer_en":"Waldinger and Schulz inherited a question Harvard had been chasing since 1938: across an entire lifetime, what makes someone end up happier and healthier? The book is the distillation of 85 years of data aimed at that question."},{"id":"author_thesis","answer_pt":"A tese, nas palavras dos autores: 'Boas relações nos mantêm mais felizes e mais saudáveis. Ponto.' Entrou como :::quote card no fim do hook. O número-headline — satisfação com relações aos 50 prevendo saúde aos 80 melhor que o colesterol — foi tecido na prosa em vez de virar um :::stat, para evitar o anti-padrão 'stat no topo + número repetido'.","answer_en":"The thesis, in the authors' words: 'Good relationships keep us happier and healthier. Period.' Placed as the :::quote card at the end of the hook. The headline number — relationship satisfaction at 50 predicting health at 80 better than cholesterol — is woven into prose rather than made a :::stat, to avoid the 'top stat + repeated number' anti-pattern."},{"id":"core_ideas","answer_pt":"Três ideias load-bearing, cada uma uma seção: (1) relação prevê saúde décadas depois, sustentada pela meta-análise independente de 308.849 pessoas; (2) o que protege é o calor, não a contagem, ancorado no sub-estudo dos 47 casais octogenários; (3) fitness social — relação como músculo que atrofia sem uso, com a receita acionável em :::list-icon.","answer_en":"Three load-bearing ideas, one section each: (1) relationships predict health decades out, backed by the independent 308,849-person meta-analysis; (2) what protects is warmth, not headcount, anchored in the 47-octogenarian-couples sub-study; (3) social fitness — a relationship as a muscle that atrophies unused, with the actionable recipe in :::list-icon."},{"id":"evidence","answer_pt":"Evidência apresentada: os achados do Harvard Study + a meta-análise Holt-Lunstad (2010) + o estudo dos casais (Psychology and Aging, 2010). Críticas atribuídas: Psychology Today (o livro nunca define 'boa relação'); o próprio Waldinger sobre a amostra enviesada; e três flags honestos na prosa — dado observacional não prova causa, a comparação com colesterol vem de entrevista, e o vínculo direto tempo-com-gente→felicidade foi só marginal (p=.07). Optei por caveats em prosa em vez de :::callout para respeitar o teto de 2 cards.","answer_en":"Evidence marshalled: the Harvard Study findings + the Holt-Lunstad (2010) meta-analysis + the couples study (Psychology and Aging, 2010). Critics attributed: Psychology Today (the book never defines 'good relationship'); Waldinger himself on the skewed sample; and three honest flags in prose — observational data doesn't prove cause, the cholesterol comparison is from an interview, and the direct time-with-others→happiness link was only marginal (p=.07). I chose prose caveats over a :::callout to respect the 2-card ceiling."},{"id":"actionable","answer_pt":"Quatro ações concretas em :::list-icon (inventário de energia, mandar a mensagem adiada, priorizar profundidade, reservar tempo recorrente). Todas pequenas de propósito — o fecho amarra que o que segura uma vida são gestos pequenos repetidos por décadas.","answer_en":"Four concrete actions in :::list-icon (energy inventory, send the postponed message, prioritize depth, block recurring time). All deliberately small — the close lands the point that what holds a life up is small gestures repeated for decades."},{"id":"verdict","answer_pt":"Veredito honesto no parágrafo de fecho: a direção 'boas relações fazem bem' é sólida e replicada fora de Harvard, mas a receita fina saiu de um grupo estreito de homens brancos do século passado. Vale pelo mapa (o hábito de tratar relação como treino), não pelas coordenadas exatas.","answer_en":"Honest verdict in the closing paragraph: the direction 'good relationships are good for you' is solid and replicated outside Harvard, but the fine-grained recipe came from a narrow group of last-century white men. Worth it for the map (the habit of treating relationships as training), not for the exact coordinates."}],"main_points":[{"id":"1_relacao-preve-saude","what_pt":"A satisfação com as relações aos 50 previu a saúde física aos 80 melhor que o colesterol; e uma meta-análise independente de 308.849 pessoas achou ~50% mais chance de sobrevivência com laços fortes.","why_pt":"É o número que sustenta a tese: relação não é 'coisa boa de ter', é fator de saúde do tamanho dos fatores de risco clássicos.","how_to_know_pt":"Se você mantém 'saúde' (dieta, exercício, exames) e 'vida social' como duas listas separadas, este é o ponto que te obriga a juntá-las.","what_en":"Relationship satisfaction at 50 predicted physical health at 80 better than cholesterol did; and an independent meta-analysis of 308,849 people found ~50% higher survival odds with stronger bonds.","why_en":"It's the number that holds up the thesis: relationships aren't a 'nice to have', they're a health factor on the scale of classic risk factors."},{"id":"2_qualidade-nao-quantidade","what_pt":"O que protege é o calor do vínculo, não o número de contatos; no sub-estudo de 47 casais octogenários, um casamento satisfeito descolou a dor física do humor do dia.","why_pt":"Muda o alvo: não é socializar mais, é aprofundar os laços certos — tempo com quem te drena não conta (o vínculo direto tempo-com-gente→felicidade foi só marginal).","how_to_know_pt":"Se sua agenda social é cheia mas você se sente sozinho, o problema não é quantidade — é profundidade.","what_en":"What protects you is the warmth of the bond, not the number of contacts; in the 47-octogenarian-couples sub-study, a satisfied marriage decoupled physical pain from daily mood.","why_en":"It shifts the target: not socialize more, but deepen the right bonds — time with people who drain you doesn't count (the direct time-with-others→happiness link was only marginal)."},{"id":"3_fitness-social","what_pt":"Fitness social: encarar relações como músculo que atrofia sem uso; manter um vínculo é escolha ativa e repetida, não estado garantido.","why_pt":"Transforma a tese num hábito treinável — pequenas ações repetidas por décadas, não gestos grandes e raros.","how_to_know_pt":"Se existe um amigo que você 'sempre quis ligar' e nunca liga, você já está deixando um músculo atrofiar.","what_en":"Social fitness: treating relationships as a muscle that atrophies unused; keeping a bond alive is an active, repeated choice, not a guaranteed state.","why_en":"It turns the thesis into a trainable habit — small actions repeated for decades, not rare grand gestures."}]}$rlog$::jsonb, now()
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
  released_at = now();

insert into public.learning_material_sub (material_id, sub_id)
select m.id, v.sub_id
from public.learning_material m
cross join (values ('circle'), ('romance')) as v(sub_id)
where m.slug = 'summary-good-life'
on conflict (material_id, sub_id) do nothing;

commit;
