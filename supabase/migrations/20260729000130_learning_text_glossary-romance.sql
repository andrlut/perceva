-- migration: 20260729000130_learning_text_glossary-romance.sql
-- purpose: Big-release rewrite — glossary-romance (explainer, bonds).
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
    'glossary-romance', 'explainer', 'bonds', $topic$glossary-romance$topic$, 6,
    $title_pt$O que realmente mantém o amor vivo$title_pt$,
    $title_en$What Actually Keeps Love Alive$title_en$,
    $summary_pt$O amor de longo prazo se decide em micro-momentos — bids atendidos, vitórias comemoradas, coisas novas feitas juntos — não em grandes gestos.$summary_pt$,
    $summary_en$Lasting love is decided in micro-moments — bids answered, wins celebrated, new things done together — not in grand gestures.$summary_en$,
    $body_pt$Seu parceiro levanta os olhos do celular e diz: "olha esse passarinho na janela". Você tem meio segundo pra decidir. Pode olhar e comentar, pode dar um "hã" sem tirar os olhos da tela, ou pode responder seco: "tô ocupado". Parece nada. É quase tudo.

Casais não se constroem nem se desfazem nas grandes cenas — no pedido de casamento, na viagem dos sonhos, na briga épica. Eles se constroem nesses micro-momentos, centenas por dia, que quase ninguém percebe enquanto acontecem.

E dá pra medir. Num laboratório em Seattle, o psicólogo John Gottman filmou casais discutindo por 15 minutos e contou cada gesto positivo e negativo. Os que continuaram juntos e felizes mantinham cerca de **5 gestos positivos pra cada 1 negativo** durante o conflito. Os que se separariam anos depois ficavam perto de 1 pra 1. Não era a ausência de briga que separava os dois grupos. Era a proporção.

## O amor se decide nos micro-momentos, não nas grandes cenas

Gottman deu um nome pra esses micro-momentos: **bids de conexão**. Um bid é qualquer tentativa pequena de puxar a atenção do outro — um comentário, um olhar, mostrar um vídeo, pedir uma opinião boba. Cada bid é uma pergunta silenciosa: "você está aqui comigo?".

Você tem três respostas possíveis. Pode **virar-se para** o outro: olhar, responder, perguntar mais. Pode **virar-se para longe**: ignorar, seguir no celular. Ou pode **virar-se contra**: responder com irritação, "agora não". Num estudo que filmou recém-casados na rotina de casa, os que continuaram casados atendiam à grande maioria dos bids do parceiro. Os que se separaram atendiam a uma fração. Os percentuais exatos que circulam — 86%, 33% — vêm de amostras pequenas e servem mais pra mostrar a direção do que como número fechado.

Aqui está o detalhe que muda tudo: não é o tamanho do gesto que conta, é a frequência da resposta. Um jantar caro no aniversário não compensa 300 "hã" distraídos ao longo do mês. Quem se sente atendido nas coisas pequenas constrói uma conta de reserva emocional. É dessa conta que o casal saca quando vem o conflito de verdade.

O mesmo laboratório acompanhou os casais por 14 anos e achou algo curioso: comportamentos diferentes previam separações em momentos diferentes. Raiva e defesa na hora da briga previam divórcios mais cedo, perto dos 5 anos. Já a frieza, o afastamento silencioso, a falta de afeto previam divórcios tardios, perto dos 16 anos, muitas vezes depois que os filhos cresciam. O casal não explode. Ele esfria.

Uma ressalva honesta. Você já deve ter ouvido que Gottman "prevê divórcio com 94% de acerto". Esse número é frágil. Ele foi calculado no mesmo grupo de casais usado pra montar o modelo, ou seja, o modelo "acertou" pessoas cujo destino já era conhecido. Não é o mesmo que prever, de fora, o futuro de um casal novo. O próprio instituto de Gottman admite: dá pra dizer que um casal "se comporta como" os que se separaram no estudo original. A direção é sólida. A precisão de vidente, não.

## Comemorar junto pesa mais do que consolar na queda

Todo mundo sabe que um bom parceiro te apoia quando as coisas dão errado. O que quase ninguém sabe é que o momento mais revelador não é a queda. É a vitória.

A psicóloga Shelly Gable estudou o que acontece quando você chega em casa com uma **boa** notícia: passou numa prova, fechou um cliente, recebeu um elogio. A resposta do parceiro tem quatro formas, e só uma constrói o vínculo. A **resposta ativa-construtiva** é quando o outro larga o que está fazendo, faz perguntas, se anima junto de verdade: "sério? conta tudo, como foi?". As outras três corroem: a passiva-construtiva ("que bom, amor", sem levantar a cabeça), a ativa-destrutiva ("será que você dá conta dessa responsabilidade?") e a passiva-destrutiva, que muda de assunto.

Em quatro estudos com casais, comemorar junto as boas notícias previu mais intimidade e satisfação do que o apoio nos momentos ruins. Faz sentido: qualquer pessoa decente aparece na tragédia. Aparecer na alegria, sem competir, sem estragar, sem inveja disfarçada, é raro. E o parceiro sente a diferença.

Tem uma segunda mecânica, que trabalha contra o tédio. O psicólogo Arthur Aron testou o que acontece quando um casal faz junto algo **novo e um pouco excitante** — não confortável, novo. Em experimentos, casais sorteados pra uma tarefa nova e estimulante saíam avaliando a relação como melhor do que os que fizeram uma tarefa morna. O mecanismo se chama **autoexpansão**: a gente entra numa relação em parte pra crescer, pra virar uma versão maior de si mesmo através do outro. Quando o casal para de viver coisas novas juntos, essa expansão trava, e o que a pesquisa mostra tomando o lugar dela é o tédio, que come a satisfação por dentro.

Não precisa ser paraquedismo. Precisa ser algo que os dois não fazem sempre: uma aula juntos, um bairro novo, um jogo, uma receita difícil. O ingrediente ativo é o friozinho de "não sei como isso vai sair", não o preço nem o esforço.

## Manutenção é comportamento, não sentimento

Aqui está a virada mais útil da pesquisa toda: manter uma relação não é um sentimento que você tem ou não tem. É um conjunto de comportamentos que você faz ou deixa de fazer. As pesquisadoras Laura Stafford e Daniel Canary perguntaram a centenas de pessoas o que elas de fato fazem pra sustentar a relação, e cinco estratégias apareceram de novo e de novo:

:::list-icon
happy | **Positividade** — ser leve e agradável no dia a dia, não só nos momentos especiais.
chatbubbles | **Abertura** — falar da relação, dizer o que sente, perguntar como o outro está de verdade.
shield | **Garantias** — deixar claro que você está comprometido e que há um futuro: "a gente resolve isso junto".
people | **Tarefas divididas** — puxar a sua parte da casa e da vida prática sem precisar ser cobrado.
star | **Rede em comum** — cultivar amigos e família que são de vocês dois, não só de cada um.
:::

Repare que nenhuma dessas é um traço de personalidade. São ações. Você pode fazer qualquer uma delas amanhã, cansado, sem estar "inspirado".

Por que isso precisa ser tão deliberado hoje? O psicólogo Eli Finkel tem uma resposta desconfortável. Antigamente esperávamos do casamento comida na mesa e segurança. Hoje esperamos que o parceiro seja também melhor amigo, terapeuta, fonte de crescimento, alguém que nos "conheça de verdade". As expectativas subiram. O tempo que investimos no outro, não. Finkel chama isso de "sufocamento do casamento": escalar uma montanha mais alta com a mesma quantidade de oxigênio. O título do próprio artigo já diz:

> Escalando o Monte Maslow sem oxigênio suficiente.

E se você está numa fase morna, um dado pra tirar o peso da culpa: satisfação de casal não é ladeira abaixo. Juntando 165 estudos e 165 mil pessoas, a satisfação cai por volta dos 10 anos de relação, chega no fundo, e volta a subir depois — pra muitos casais. O vale dos 10 anos é comum, não é sentença. O que decide se você sobe de novo não é sorte: são os bids atendidos, a boa notícia comemorada, a coisa nova feita junto, as cinco manutenções repetidas mais vezes do que você quebra.

Nenhuma dessas mecânicas é sobre amar mais. É sobre transformar o amor que você já sente em comportamento que o outro consegue ver. O sentimento é invisível; o parceiro só tem acesso aos gestos. Olhar quando ele aponta o passarinho é pequeno demais pra parecer importante — e é exatamente por isso que é o que mais importa.

:::source[Gottman & Levenson, 1992 · J. Personality and Social Psychology · n=73 casais](https://www.johngottman.net/wp-content/uploads/2011/05/Marital-processes-predictive-of-later-dissolution-behavior-physiology-and-health.pdf)$body_pt$,
    $body_en$Your partner glances up from their phone and says, "look at that bird on the windowsill." You've got half a second to decide. You can look and say something back, you can grunt without lifting your eyes, or you can snap, "I'm busy." It feels like nothing. It's almost everything.

Couples aren't built or broken in the big scenes — the proposal, the dream trip, the epic fight. They're built in these micro-moments, hundreds a day, that nobody notices while they happen.

And you can measure it. In a Seattle lab, psychologist John Gottman filmed couples arguing for 15 minutes and counted every positive and negative move. The ones who stayed together and happy kept roughly **5 positive moves for every 1 negative** during conflict. The ones who would split years later hovered near 1 to 1. What separated the two groups wasn't the absence of fighting. It was the ratio.

## Love is decided in the micro-moments, not the big scenes

Gottman gave these micro-moments a name: **bids for connection**. A bid is any small attempt to pull the other person's attention — a comment, a glance, showing them a video, asking a throwaway question. Every bid is a silent question: "are you here with me?"

You have three ways to answer. You can **turn toward**: look, reply, ask more. You can **turn away**: ignore, stay on your phone. Or you can **turn against**: snap back, "not now." In a study that filmed newlyweds going about their day at home, couples who stayed married answered the vast majority of each other's bids. Couples who divorced answered a fraction. The exact figures that get quoted — 86%, 33% — come from small samples and show the direction more than a hard number.

Here's the detail that changes everything: it's not the size of the gesture that counts, it's how often you answer. An expensive anniversary dinner doesn't cancel out 300 distracted grunts over the month. The partner who feels answered on the small stuff builds an emotional reserve. That's the account the couple draws on when real conflict hits.

The same lab followed the couples for 14 years and found something odd: different behaviors predicted divorce at different times. Anger and defensiveness during fights predicted earlier splits, around year 5. Coldness, quiet withdrawal, and a lack of warmth predicted later splits, around year 16, often after the kids grew up. The couple doesn't explode. It goes cold.

One honest caveat. You've probably heard Gottman "predicts divorce with 94% accuracy." That number is shaky. It was calculated on the same couples used to build the model, so the model "called" people whose outcome was already known. That's not the same as predicting a fresh couple's future from the outside. Gottman's own institute admits the real claim is that a couple "behaves like" the ones who divorced in the original study. The direction is solid. The fortune-teller precision isn't.

## Celebrating a win matters more than cushioning a fall

Everyone knows a good partner has your back when things go wrong. What almost nobody knows is that the most revealing moment isn't the fall. It's the win.

Psychologist Shelly Gable studied what happens when you come home with **good** news: you passed the exam, landed the client, got the praise. Your partner's response takes one of four shapes, and only one builds the bond. The **active-constructive response** is when they drop what they're doing, ask questions, light up with you for real: "seriously? tell me everything, how did it go?" The other three erode it: passive-constructive ("nice, honey," without looking up), active-destructive ("are you sure you can handle that responsibility?"), and passive-destructive, which changes the subject.

Across four studies of couples, celebrating good news together predicted more intimacy and satisfaction than support during the bad times did. It makes sense: any decent person shows up for the tragedy. Showing up for the joy — no competing, no deflating, no disguised envy — is rare. And your partner feels the difference.

There's a second mechanic, and it works against boredom. Psychologist Arthur Aron tested what happens when a couple does something **new and a little exciting** together — not comfortable, new. In his experiments, couples randomly assigned to a novel, stimulating task rated their relationship better afterward than couples given a dull one. The mechanism is called **self-expansion**: we enter relationships partly to grow, to become a bigger version of ourselves through the other person. When a couple stops doing new things together, that expansion stalls, and what the research shows moving into the gap is boredom, which eats satisfaction from the inside.

It doesn't have to be skydiving. It just has to be something you don't do all the time: a class together, a new neighborhood, a game, a hard recipe. The active ingredient is the small thrill of "I don't know how this will turn out," not the price or the effort.

## Maintenance is a behavior, not a feeling

Here's the most useful turn in all the research: keeping a relationship alive isn't a feeling you either have or don't. It's a set of behaviors you either do or skip. Researchers Laura Stafford and Daniel Canary asked hundreds of people what they actually do to sustain their relationship, and five strategies kept coming up:

:::list-icon
happy | **Positivity** — be light and pleasant day to day, not just on special occasions.
chatbubbles | **Openness** — talk about the relationship, say what you feel, ask how they really are.
shield | **Assurances** — make it clear you're committed and there's a future: "we'll figure this out together."
people | **Shared tasks** — carry your share of the house and the practical stuff without being asked.
star | **Shared network** — build friends and family that belong to the two of you, not just each of you.
:::

Notice none of these is a personality trait. They're actions. You can do any of them tomorrow, tired, uninspired, whatever.

Why does this have to be so deliberate now? Psychologist Eli Finkel has an uncomfortable answer. We used to want a marriage to put food on the table and keep us safe. Now we want a partner to also be our best friend, therapist, source of growth, someone who "truly knows us." Expectations climbed. The time we invest in each other didn't. Finkel calls it the "suffocation of marriage": trying to climb a taller mountain on the same amount of oxygen. The paper's own title says it:

> Climbing Mount Maslow without enough oxygen.

And if you're in a flat stretch, one finding to lift the guilt: couple satisfaction isn't a straight downhill. Pooling 165 studies and 165,000 people, satisfaction dips around 10 years in, bottoms out, then climbs again for many couples. The 10-year valley is common, not a verdict. What decides whether you climb back out isn't luck: it's bids answered, wins celebrated, new things done together, the five maintenance behaviors repeated more often than you break them.

None of these mechanics is about loving more. It's about turning the love you already feel into behavior your partner can actually see. The feeling is invisible; your partner only has access to the gestures. Looking up when they point at the bird is too small to feel important — and that's exactly why it matters most.

:::source[Gottman & Levenson, 1992 · J. Personality and Social Psychology · n=73 couples](https://www.johngottman.net/wp-content/uploads/2011/05/Marital-processes-predictive-of-later-dissolution-behavior-physiology-and-health.pdf)$body_en$,
    array[$tkpt0$Atenda os bids: quando o parceiro puxa sua atenção com algo pequeno, largue a tela e responda. É o gesto que mais separa casais que ficam juntos dos que se separam.$tkpt0$, $tkpt1$Comemore as vitórias do outro com entusiasmo real — isso constrói mais vínculo do que consolar nas quedas.$tkpt1$, $tkpt2$Manutenção é comportamento, não sentimento: positividade, abertura, garantias, tarefas divididas e amigos em comum, repetidos mais vezes do que você quebra.$tkpt2$]::text[],
    array[$tken0$Answer the bids: when your partner pulls your attention with something small, drop the screen and respond. It's the gesture that most separates couples who stay from couples who split.$tken0$, $tken1$Celebrate your partner's wins with real enthusiasm — it builds more of a bond than comforting them through the lows.$tken1$, $tken2$Maintenance is a behavior, not a feeling: positivity, openness, assurances, shared tasks, and shared friends, repeated more often than you break them.$tken2$]::text[],
    $trk_pt$No Perceva, o sub Romance vira comportamento observável em vez de intenção vaga. Crie tarefas pequenas e recorrentes — "largar a tela quando ela me chama", "comemorar uma vitória dela", "planejar algo novo no fim de semana" — em vez de esperar o humor certo. O Momentum recompensa a repetição, que é exatamente o que a pesquisa aponta como decisivo: frequência de gestos pequenos, não intensidade dos grandes. Se sua nota em Romance está travada, olhe para quantos bids você atende por dia antes de olhar para o quanto você ama.$trk_pt$,
    $trk_en$In Perceva, the Romance sub becomes observable behavior instead of vague intent. Create small, recurring tasks — "drop the screen when they call me," "celebrate one of their wins," "plan something new this weekend" — instead of waiting for the right mood. Momentum rewards repetition, which is exactly what the research flags as decisive: frequency of small gestures, not the intensity of big ones. If your Romance score is stuck, look at how many bids you answer per day before you look at how much you love.$trk_en$,
    $src_url$https://www.johngottman.net/wp-content/uploads/2011/05/Marital-processes-predictive-of-later-dissolution-behavior-physiology-and-health.pdf$src_url$,
    $src_pt$Gottman & Levenson, 1992 · J. Personality and Social Psychology · n=73 casais$src_pt$,
    $src_en$Gottman & Levenson, 1992 · J. Personality and Social Psychology · n=73 couples$src_en$,
    $rlog${"template_type":"explainer","template_version":2,"voice_principles_applied":["Exactly 3 main ideas (micro-moments/bids, celebrate the win + novelty, maintenance-as-behavior). Merged 9 dossier facts into these three.","Prose-led. Body has 1 visual card (list-icon of the five maintenance behaviors) + 1 markdown blockquote + closing source. No stat card at top; the 5:1 number is woven into the hook prose.","Native PT written first (conversational voce, sentence-avg ~16 words, no anglicisms/fillers), then EN written fresh with its own cadence — not a translation.","Jargon defined on first mention with a concrete anchor: bid de conexao, virar-se para/longe/contra, resposta ativa-construtiva, autoexpansao, sufocamento do casamento.","Concrete examples replace abstract noun lists (the bird on the windowsill; 300 distracted grunts vs one expensive dinner; the four good-news responses acted out).","Honest caveats folded into prose: the 94% accuracy claim is in-sample not prospective; exact turning-toward percentages are illustrative; the suffocation model is framed as Finkel's argument; the U-shaped trajectory is hedged ('for many couples', 'common, not a verdict').","Attachment styles deliberately NOT re-explained — this piece is scoped to maintenance mechanics, complementary to the sibling attachment material."],"steps":[{"id":"hook","answer_pt":"Abre com a cena do 'olha esse passarinho': meio segundo pra virar-se para o parceiro ou seguir no celular. O gap de curiosidade: casais nao se decidem nas grandes cenas, e sim nesses micro-momentos que ninguem percebe — e da pra medir (proporcao 5:1 no laboratorio de Gottman).","answer_en":"Opens on the 'look at that bird' scene: half a second to turn toward your partner or stay on your phone. The curiosity gap: couples aren't decided in the big scenes but in these unnoticed micro-moments — and it can be measured (Gottman's 5:1 lab ratio)."},{"id":"thesis","answer_pt":"O amor de longo prazo se decide na frequencia de gestos pequenos — bids atendidos, vitorias comemoradas, coisas novas juntos — nao na intensidade de grandes gestos.","answer_en":"Lasting love is decided by the frequency of small gestures — bids answered, wins celebrated, new things done together — not the intensity of grand ones."},{"id":"real_definition","answer_pt":"O que amor de longo prazo REALMENTE e: um conjunto de comportamentos de manutencao (bid, virar-se para, resposta a boa noticia, novidade, as cinco estrategias), nao um sentimento passivo que voce tem ou nao tem. A crenca comum foca em quimica e grandes gestos; a realidade e a conta de reserva construida no dia a dia.","answer_en":"What lasting love REALLY is: a set of maintenance behaviors (bid, turning toward, response to good news, novelty, the five strategies), not a passive feeling you either have or don't. The common belief centers on chemistry and grand gestures; the reality is the reserve account built day to day."},{"id":"stakes","answer_pt":"Numero duro peer-reviewed: casais estaveis mantem ~5 gestos positivos pra cada 1 negativo durante o conflito; os que se separam ficam perto de 1:1 (Gottman & Levenson, 1992, JPSP, n=73). Reforcado pelo timing: raiva prevê divorcio cedo (~5 anos), frieza prevê divorcio tardio (~16 anos).","answer_en":"Peer-reviewed hard number: stable couples keep ~5 positive moves per 1 negative during conflict; splitting couples sit near 1:1 (Gottman & Levenson, 1992, JPSP, n=73). Reinforced by timing: anger predicts early divorce (~5 yrs), coldness predicts late divorce (~16 yrs)."},{"id":"mechanism","answer_pt":"Por baixo funcionam tres mecanismos: (1) responder a bids — virar-se para/longe/contra constroi ou drena a reserva emocional; (2) resposta ativa-construtiva a boa noticia (Gable) constroi mais vinculo que consolo na queda; (3) autoexpansao (Aron) — novidade compartilhada aumenta a satisfacao por combater o tedio. Exemplo concreto: os quatro jeitos de reagir a uma vitoria do parceiro, dramatizados.","answer_en":"Three mechanisms under the hood: (1) responding to bids — turning toward/away/against builds or drains the emotional reserve; (2) active-constructive response to good news (Gable) builds more bond than comfort in the fall; (3) self-expansion (Aron) — shared novelty raises satisfaction by fighting boredom. Concrete example: the four ways to react to a partner's win, acted out."},{"id":"myth_busts","answer_pt":"Tres crencas erradas corrigidas em prosa: (1) 'grandes gestos e que contam' — nao, e a frequencia das respostas pequenas; (2) 'Gottman preve divorcio com 94% de acerto' — numero in-sample, nao validado de fora; (3) 'satisfacao so cai com o tempo' — na verdade e curva em U, com vale por volta dos 10 anos e recuperacao depois (Buhler, n=165 mil).","answer_en":"Three wrong beliefs corrected in prose: (1) 'grand gestures are what count' — no, it's the frequency of small responses; (2) 'Gottman predicts divorce with 94% accuracy' — an in-sample number, not validated out-of-sample; (3) 'satisfaction only declines' — it's actually U-shaped, with a valley around 10 years and recovery after (Buhler, n=165k)."},{"id":"recipe","answer_pt":"As cinco manutencoes de Stafford & Canary em list-icon como acoes de amanha: positividade, abertura, garantias, tarefas divididas, rede em comum. Cada uma e comportamento que da pra fazer cansado, sem depender de 'estar inspirado'.","answer_en":"Stafford & Canary's five maintenance behaviors as a tomorrow-actions list-icon: positivity, openness, assurances, shared tasks, shared network. Each is a behavior you can do while tired, without waiting to 'feel inspired'."}],"main_points":[{"id":"1_micro_moments","what_pt":"O amor se decide em micro-momentos: bids de conexao atendidos com um 'virar-se para', nao com grandes gestos.","why_pt":"Responder aos bids pequenos foi o diferenciador comportamental mais forte entre casais que ficaram juntos e os que se separaram; a frieza acumulada (bids ignorados) prevê o divorcio tardio.","how_to_know_pt":"Conte, num dia normal, quantas vezes o parceiro puxa sua atencao com algo pequeno e voce larga a tela pra responder. Essa proporcao e o placar real.","what_en":"Love is decided in micro-moments: bids for connection answered with a 'turn toward', not with grand gestures.","why_en":"Answering small bids was the strongest observed behavioral differentiator between couples who stayed and couples who split; accumulated coldness (ignored bids) predicts late divorce."},{"id":"2_celebrate_and_novelty","what_pt":"Comemorar as vitorias do parceiro com entusiasmo real (resposta ativa-construtiva) e fazer coisas novas juntos (autoexpansao) sustentam a relacao.","why_pt":"A resposta a boa noticia previu mais intimidade e satisfacao que o apoio na ma noticia (Gable); atividades novas e excitantes aumentam a satisfacao ao combater o tedio (Aron).","how_to_know_pt":"Lembre da ultima vez que o parceiro te contou uma vitoria: voce largou tudo e se animou junto, ou respondeu 'que bom' sem levantar a cabeca?","what_en":"Celebrating your partner's wins with real enthusiasm (active-constructive response) and doing new things together (self-expansion) sustain the relationship.","why_en":"Response to good news predicted more intimacy and satisfaction than support during bad news (Gable); novel, exciting activities raise satisfaction by fighting boredom (Aron)."},{"id":"3_maintenance_behavior","what_pt":"Manutencao e comportamento, nao sentimento: positividade, abertura, garantias, tarefas divididas e rede em comum (as cinco estrategias de Stafford & Canary).","why_pt":"Sao acoes, nao tracos — da pra fazer cansado; e sao a resposta pratica ao 'sufocamento do casamento' de Finkel (esperamos mais do parceiro e investimos menos tempo).","how_to_know_pt":"Escolha uma das cinco manutencoes e faca amanha, cansado ou nao. Se depende de 'estar inspirado', voce esta confundindo sentimento com comportamento.","what_en":"Maintenance is a behavior, not a feeling: positivity, openness, assurances, shared tasks, and shared network (Stafford & Canary's five strategies).","why_en":"They're actions, not traits — you can do them tired; and they're the practical answer to Finkel's 'suffocation of marriage' (we expect more of a partner and invest less time)."}]}$rlog$::jsonb, now()
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
  select id, 'romance' from up on conflict (material_id, sub_id) do nothing;

commit;
