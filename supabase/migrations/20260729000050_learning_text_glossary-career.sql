-- migration: 20260729000050_learning_text_glossary-career.sql
-- purpose: Big-release rewrite — glossary-career (explainer, wealth).
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
    'glossary-career', 'explainer', 'wealth', $topic$glossary-career$topic$, 6,
    $title_pt$Emprego, carreira ou chamado$title_pt$,
    $title_en$Job, Career, or Calling$title_en$,
    $summary_pt$Não é o cargo nem o salário que decide se o seu trabalho tem sentido — é a lente com que você o enxerga, e ela dá pra construir.$summary_pt$,
    $summary_en$It isn't the title or the paycheck that decides whether your work means something — it's the lens you see it through, and that lens can be built.$summary_en$,
    $body_pt$Pergunta rápida: se te dessem um aumento de 30% amanhã, seu trabalho ficaria melhor? A maioria responde que sim na hora. Quando os pesquisadores foram medir, a resposta foi outra.

Em 1997, quatro psicólogos entrevistaram 196 pessoas — de faxineiros a médicos — sobre a relação de cada uma com o próprio trabalho. As respostas se dividiram limpo em três grupos. Um terço via o trabalho como *emprego*: um jeito de pagar as contas, e nada além disso. Um terço via como *carreira*: um caminho de subida, cargos, status. E um terço via como *chamado*: algo que faria de qualquer forma, porque dá sentido à vida.

O detalhe que muda tudo: essa divisão quase não dependia da profissão. Num grupo de 24 secretárias com o mesmo cargo, o mesmo salário e a mesma sala, as três lentes apareceram em partes quase iguais. Não é o trabalho que decide como você se sente nele. É a lente com que você o enxerga.

## 1. Emprego, carreira ou chamado

Os três grupos não são tipos de pessoa nem tipos de profissão. São *orientações* — a lente que você usa pra olhar o que faz. E dá pra descobrir a sua com uma frase.

Complete: "eu trabalho principalmente pra...". Se a resposta é "pagar o resto da minha vida — o trabalho em si eu largaria se pudesse", sua lente é emprego. Se é "chegar no próximo nível, no próximo cargo, ganhar mais espaço", é carreira. Se é "fazer isto — eu faria uma versão disto mesmo sem precisar do dinheiro", é chamado.

Nenhuma das três é errada. Quem trata o trabalho como emprego muitas vezes tem uma vida cheia fora dele, e essa é uma escolha legítima. O ponto do estudo é outro: entre duas pessoas no mesmo cargo, ganhando igual, quem vê o trabalho como chamado relata mais satisfação com o trabalho e com a vida. A lente pesa mais que o contracheque.

Duas ressalvas honestas. A lente não é destino — ela muda com a fase da vida e com o próprio trabalho. E o estudo é correlacional: ele mostra que enxergar o trabalho como chamado anda junto com mais satisfação, não que uma coisa causa a outra sozinha.

## 2. O que realmente faz o trabalho ter sentido

Se a lente importa tanto, dá pra construir uma melhor? Meio século de pesquisa aponta pra três ingredientes — e nenhum é salário ou cargo.

O primeiro é **autonomia**: ter controle sobre como e quando você faz o trabalho, em vez de cumprir ordem por ordem. O segundo é **competência**, às vezes chamada de maestria: a sensação de estar ficando visivelmente melhor em algo difícil. O terceiro é **pertencimento**: perceber que o que você faz conecta você a outras pessoas e importa pra alguém. Esses três são a base da Teoria da Autodeterminação, um dos programas mais testados da psicologia — a ideia de que satisfazer essas necessidades prevê motivação e bem-estar em qualquer cultura (Ryan e Deci, 2000).

Como Ryan e Deci resumem, no auge as pessoas são movidas por dentro:

> No seu melhor, as pessoas são curiosas e inspiradas — querem aprender, se superar, dominar habilidades novas e usar seus talentos com responsabilidade.

Se "autonomia, maestria, propósito" soa familiar, é porque virou bordão de palestra depois do livro *Drive*, de Daniel Pink. Pink resumiu bem, mas não descobriu nada: reempacotou essa teoria e um segundo bloco de pesquisa, o Modelo de Características do Trabalho (Hackman e Oldham, 1976). Esse modelo lista cinco traços de desenho que tornam qualquer função mais motivante — variedade de habilidades, ver o resultado inteiro do que você entrega, sentir que aquilo tem impacto, autonomia e feedback.

De todos, um se destaca. Uma meta-análise de quase 200 estudos encontrou que a **autonomia** tem a relação mais forte com satisfação, acima de qualquer outro traço (Fried e Ferris, 1987). É a alavanca com mais retorno. Duas pessoas no mesmo cargo, mesmo salário: quem escolhe como faz o trabalho relata bem mais satisfação do que quem recebe cada passo mastigado.

E o efeito não é pequeno. Uma meta-análise de 44 estudos, somando 23 mil pessoas, encontrou que trabalho com sentido caminha muito junto com engajamento, comprometimento e satisfação, e um pouco mais de longe com saúde e satisfação com a vida (Allan et al., 2019). Só lembre do freio: é correlação. Ninguém provou que injetar autonomia num cargo, sozinho, causa mais bem-estar em cada pessoa — mas os estudos de intervenção empurram nessa direção.

## 3. Você pode mudar a lente sem trocar de emprego

Aqui está a parte que quase ninguém sabe: você não precisa de um cargo novo pra mudar como o trabalho te afeta. Pesquisadores chamam isso de *job crafting* — moldar o próprio trabalho por dentro (Wrzesniewski e Dutton, 2001). São três alavancas.

Você pode mudar **o que faz**: assumir uma tarefa que te dá energia, largar ou automatizar uma que te drena. Pode mudar **com quem faz**: procurar as pessoas do trabalho que te ensinam algo, reduzir o contato com as que só sugam. E pode mudar **como enxerga**: reconhecer o efeito real do que você entrega. No estudo clássico, faxineiros de hospital que se viam como parte da recuperação dos pacientes — e não como quem só limpa o chão — descreviam um trabalho completamente diferente, com a mesma descrição de cargo.

Antes da receita, um aviso. "Siga seu chamado" tem um lado escuro. Num estudo com tratadores de zoológico, quem tinha um chamado forte tolerava mais salário baixo, hora extra não paga e condição ruim — porque enquadrava o sacrifício como o preço de fazer o que ama (Bunderson e Thompson, 2009). Chamado que só serve pra te fazer aceitar menos não é sentido: é armadilha.

E a régua do tempo mudou. Nos EUA, a mediana de permanência num mesmo emprego é de 3,9 anos — e cai pra 2,7 anos entre quem tem menos de 35 (dados de 2024). Carreira hoje é uma sequência de trabalhos, não uma escada num prédio só. Menos "subir até o topo", mais "re-encaixar" a cada troca.

:::list-icon
search | Descubra sua lente: complete "eu trabalho pra..." e veja se cai em emprego, carreira ou chamado.
options | Adicione uma dose de autonomia: escolha uma coisa nesta semana que você passa a fazer do seu jeito.
construct | Molde uma fronteira: assuma uma tarefa que te dá energia ou aproxime-se de quem te ensina.
trending-up | Nomeie no que você está ficando melhor — competência só motiva quando você percebe o progresso.
shield | Proteja-se do chamado-armadilha: se o amor pelo trabalho só justifica aceitar menos, é hora de renegociar.
:::

O trabalho ocupa perto de um terço da sua vida acordada. A pesquisa é clara num ponto: o que decide se esse terço soma ou drena não é o cargo na porta nem o número no contracheque — é quanta autonomia, quanto progresso e quanto sentido você consegue enxergar e construir ali dentro. Isso não é sorte de profissão. É desenho. E boa parte dele está na sua mão.

:::source[Wrzesniewski, McCauley, Rozin & Schwartz, 1997 · Journal of Research in Personality · n=196](https://doi.org/10.1006/jrpe.1997.2162)$body_pt$,
    $body_en$Quick question: if someone handed you a 30% raise tomorrow, would your work get better? Most people say yes without hesitating. When researchers actually measured it, the answer came back different.

In 1997, four psychologists interviewed 196 people — from clerical staff to physicians — about how each one related to their own work. The answers sorted cleanly into three groups. A third saw work as a *job*: a way to pay the bills, and nothing more. A third saw it as a *career*: a track of advancement, titles, status. And a third saw it as a *calling*: something they'd do anyway, because it gives life meaning.

The detail that changes everything: that split barely depended on the occupation. In a group of 24 administrative assistants with the same title, the same pay, and the same office, all three lenses showed up in roughly equal parts. It isn't the work that decides how you feel about it. It's the lens you see it through.

## 1. Job, career, or calling

The three groups aren't types of people, and they aren't types of job. They're *orientations* — the lens you use to look at what you do. And you can find yours with a single sentence.

Finish this: "I mostly work to...". If the answer is "pay for the rest of my life — the work itself I'd drop if I could," your lens is job. If it's "reach the next level, the next title, more room to move," it's career. If it's "do this — I'd do a version of this even without needing the money," it's calling.

None of the three is wrong. People who treat work as a job often have a full life outside it, and that's a legitimate choice. The study's point is elsewhere: between two people in the same role, earning the same, the one who sees the work as a calling reports more satisfaction with work and with life. The lens outweighs the paycheck.

Two honest caveats. The lens isn't destiny — it shifts with your stage of life and with the work itself. And the study is correlational: it shows that seeing work as a calling travels alongside more satisfaction, not that one causes the other on its own.

## 2. What actually makes work feel meaningful

If the lens matters that much, can you build a better one? Half a century of research points to three ingredients — and none of them is salary or title.

The first is **autonomy**: having control over how and when you do the work, instead of following one order at a time. The second is **competence**, sometimes called mastery: the felt sense of getting visibly better at something hard. The third is **relatedness**: sensing that what you do connects you to other people and matters to someone. These three anchor Self-Determination Theory, one of the most heavily tested programs in psychology — the claim that meeting these needs predicts motivation and well-being across cultures (Ryan and Deci, 2000).

As Ryan and Deci put it, at their best people are driven from within:

> The fullest representations of humanity show people to be curious, vital, and self-motivated — striving to learn, extend themselves, master new skills, and apply their talents responsibly.

If "autonomy, mastery, purpose" rings a bell, that's because it became a conference-stage slogan after Daniel Pink's book *Drive*. Pink summarized it well, but he discovered nothing new: he repackaged that theory plus a second body of work, the Job Characteristics Model (Hackman and Oldham, 1976). That model lists five design traits that make any role more motivating — skill variety, seeing the whole result of what you produce, feeling it has impact, autonomy, and feedback.

One of them stands out. A meta-analysis of nearly 200 studies found that **autonomy** has the strongest relationship with satisfaction, above every other trait (Fried and Ferris, 1987). It's the lever with the highest return. Two people in the same role, same pay: the one who chooses how the work gets done reports far more satisfaction than the one handed every step pre-chewed.

And the effect isn't small. A meta-analysis of 44 studies, pooling 23,000 people, found that meaningful work moves closely with engagement, commitment, and satisfaction, and a bit more loosely with health and life satisfaction (Allan et al., 2019). Just hold the brake in mind: this is correlation. Nobody has proven that injecting autonomy into a role, by itself, causes more well-being in every person — though intervention studies push in that direction.

## 3. You can change the lens without changing jobs

Here's the part almost nobody knows: you don't need a new title to change how work affects you. Researchers call it *job crafting* — reshaping your own work from the inside (Wrzesniewski and Dutton, 2001). There are three levers.

You can change **what you do**: take on a task that gives you energy, drop or automate one that drains you. You can change **who you do it with**: seek out the people at work who teach you something, cut contact with the ones who only sap you. And you can change **how you see it**: recognize the real effect of what you deliver. In the classic study, hospital cleaners who saw themselves as part of patients' recovery — not just as floor-moppers — described a completely different job, with the same job description.

One warning before the recipe. "Follow your calling" has a dark side. In a study of zookeepers, those with a strong calling tolerated more low pay, unpaid overtime, and poor conditions — because they framed the sacrifice as the price of doing what they love (Bunderson and Thompson, 2009). A calling that only gets you to accept less isn't meaning: it's a trap.

And the time scale has shifted. In the US, the median stay in a single job is 3.9 years — and it drops to 2.7 years for workers under 35 (2024 data). A career today is a sequence of jobs, not a ladder inside one building. Less "climb to the top," more "re-fit at every move."

:::list-icon
search | Find your lens: finish "I work to..." and see if it lands on job, career, or calling.
options | Add a dose of autonomy: pick one thing this week you start doing your own way.
construct | Craft one boundary: take on a task that energizes you, or move closer to someone who teaches you.
trending-up | Name what you're getting better at — competence only motivates when you notice the progress.
shield | Guard against the calling-trap: if "loving the work" only justifies accepting less, it's time to renegotiate.
:::

Work fills about a third of your waking life. The research is clear on one thing: what decides whether that third adds up or drains you isn't the title on the door or the number on the paycheck — it's how much autonomy, progress, and meaning you can see and build inside it. That isn't luck of the draw by profession. It's design. And most of it is in your hands.

:::source[Wrzesniewski, McCauley, Rozin & Schwartz, 1997 · Journal of Research in Personality · n=196](https://doi.org/10.1006/jrpe.1997.2162)$body_en$,
    array[$tkpt0$As pessoas se dividem em três lentes — emprego, carreira e chamado — e a divisão quase não depende da profissão. A lente pesa mais que o salário.$tkpt0$, $tkpt1$Sentido no trabalho vem de três ingredientes: autonomia (fazer do seu jeito), competência (ficar melhor) e pertencimento (importar pra alguém). Autonomia é a alavanca mais forte.$tkpt1$, $tkpt2$Dá pra moldar o trabalho por dentro — mudar o que faz, com quem faz e como enxerga — sem trocar de cargo. Mas cuidado com o 'chamado' que só justifica aceitar menos.$tkpt2$]::text[],
    array[$tken0$People split into three lenses — job, career, and calling — and the split barely depends on the occupation. The lens outweighs the salary.$tken0$, $tken1$Three ingredients build meaning: autonomy (doing it your way), competence (getting better), and relatedness (mattering to someone). Autonomy is the strongest lever.$tken1$, $tken2$You can reshape work from the inside — change what you do, who with, and how you frame it — without changing jobs. But beware a 'calling' that only justifies accepting less.$tken2$]::text[],
    $trk_pt$No Perceva, a sub Carreira é onde essa lente vira ação. Cada tarefa que você marca ali treina uma das três alavancas — assumir uma tarefa nova (competência), escolher como fazê-la (autonomia) ou conectar seu trabalho a alguém (pertencimento). Use a autoavaliação da sub pra flagrar qual das três está baixa e mire suas próximas tarefas nela.$trk_pt$,
    $trk_en$In Perceva, the Career sub is where this lens turns into action. Every task you check there trains one of the three levers — taking on a new task (competence), choosing how you do it (autonomy), or connecting your work to someone (relatedness). Use the sub's self-assessment to spot which of the three is running low, then aim your next tasks at it.$trk_en$,
    $src_url$https://doi.org/10.1006/jrpe.1997.2162$src_url$,
    $src_pt$Wrzesniewski, McCauley, Rozin & Schwartz, 1997 · Journal of Research in Personality · n=196$src_pt$,
    $src_en$Wrzesniewski, McCauley, Rozin & Schwartz, 1997 · Journal of Research in Personality · n=196$src_en$,
    $rlog${"template_type":"explainer","template_version":2,"voice_principles_applied":["Exactly 3 main ideas (three lenses / three ingredients / job crafting). No sub-topic sprawl.","Prose-led. Body has 2 visual cards total: one list-icon recipe + closing source. Headline stat (the even three-way split) woven into hook prose, no top stat card.","One iconic markdown blockquote (Ryan & Deci) in idea 2 — lighter than a :::quote card.","Jargon defined on first mention: emprego/carreira/chamado, autonomia, competência/maestria, pertencimento, Teoria da Autodeterminação, Modelo de Características do Trabalho, job crafting.","Honest caveats flagged: 'autonomy/mastery/purpose' is Pink's repackaging not a discovery; the literature is correlational; the calling-orientation double edge (Bunderson & Thompson).","Concrete anchors instead of abstract noun lists: the self-test sentence, the same-role/same-pay autonomy contrast, the hospital-cleaner reframe, the 2 grocery-bag-style at-home check replaced by a 'finish this sentence' check.","Native PT written first, then EN written fresh with its own cadence — no translation calques. Filler ('vale lembrar/notar', 'no fim das contas') cut. Consistent 'você'/'you'.","No academic outline labels (Claim/Evidência) in body — findings folded into prose with named attribution."],"steps":[{"id":"hook","answer_pt":"Abre com uma pergunta concreta — 'um aumento de 30% deixaria seu trabalho melhor?' — e derruba a intuição com o estudo de 1997: as pessoas se dividem em emprego/carreira/chamado independente da profissão (até 24 secretárias com o mesmo cargo se dividiram nas três lentes).","answer_en":"Opens with a concrete question — 'would a 30% raise make your work better?' — then upends the intuition with the 1997 study: people split into job/career/calling regardless of occupation (even 24 administrative assistants in the same role split across all three lenses)."},{"id":"thesis","answer_pt":"Não é o cargo nem o salário que decide se o trabalho tem sentido — é a lente com que você o enxerga, e ela pode ser construída.","answer_en":"It isn't the title or the paycheck that decides whether work has meaning — it's the lens you see it through, and it can be built."},{"id":"real_definition","answer_pt":"Contra a ideia de que 'melhor trabalho = mais dinheiro/cargo', a definição vencedora é: trabalho com sentido nasce de autonomia, competência e pertencimento (Teoria da Autodeterminação + Modelo de Características do Trabalho), não de prestígio. Optei por prosa em vez de :::compare pra manter o orçamento de 2 cards.","answer_en":"Against 'better work = more money/title', the winning definition is: meaningful work comes from autonomy, competence, and relatedness (Self-Determination Theory + Job Characteristics Model), not prestige. Kept it as prose instead of a :::compare to hold the 2-card budget."},{"id":"stakes","answer_pt":"Trabalho com sentido tem correlação acima de 0,70 com engajamento, comprometimento e satisfação (meta-análise de 44 estudos, 23 mil pessoas; Allan et al., 2019). Freio explícito: é correlação, não prova de causa.","answer_en":"Meaningful work correlates above .70 with engagement, commitment, and satisfaction (meta-analysis of 44 studies, 23,000 people; Allan et al., 2019). Explicit brake: correlation, not proof of cause."},{"id":"mechanism","answer_pt":"Autonomia é a alavanca mais forte de todas (meta-análise de ~200 estudos; Fried e Ferris, 1987). Exemplo concreto: duas pessoas, mesmo cargo e salário — quem escolhe como faz o trabalho relata bem mais satisfação que quem recebe cada passo mastigado.","answer_en":"Autonomy is the single strongest lever (meta-analysis of ~200 studies; Fried and Ferris, 1987). Concrete example: two people, same role and pay — the one who chooses how the work gets done reports far more satisfaction than the one handed every step pre-chewed."},{"id":"myth_busts","answer_pt":"Integrados como prosa (não list-icon): 1) 'Aumento melhora o trabalho' — a lente pesa mais que o contracheque. 2) 'Autonomia, maestria, propósito' é modelo novo — é reempacotamento de SDT + Hackman/Oldham (Pink popularizou, não descobriu). 3) 'Siga seu chamado' é sempre bom — pode virar auto-exploração (tratadores de zoológico; Bunderson e Thompson, 2009).","answer_en":"Integrated as prose (not a list-icon): 1) 'A raise improves work' — the lens outweighs the paycheck. 2) 'Autonomy, mastery, purpose' is a new model — it repackages SDT + Hackman/Oldham (Pink popularized, didn't discover). 3) 'Follow your calling' is always good — it can become self-exploitation (zookeepers; Bunderson and Thompson, 2009)."},{"id":"recipe","answer_pt":"list-icon com 5 ações: descubra sua lente; adicione uma dose de autonomia esta semana; molde uma fronteira (job crafting); nomeie no que está melhorando; proteja-se do chamado-armadilha.","answer_en":"list-icon with 5 actions: find your lens; add a dose of autonomy this week; craft one boundary (job crafting); name what you're getting better at; guard against the calling-trap."}],"main_points":[{"id":"1_three_lenses","what_pt":"As pessoas se dividem em três lentes — emprego, carreira e chamado — e a divisão quase não depende da profissão.","what_en":"People split into three lenses — job, career, calling — and the split barely depends on the occupation.","why_pt":"A lente prevê satisfação com o trabalho e com a vida melhor que salário ou prestígio (Wrzesniewski et al., 1997).","why_en":"The lens predicts satisfaction with work and life better than pay or prestige (Wrzesniewski et al., 1997).","how_to_know_pt":"Complete 'eu trabalho principalmente pra...' e veja em qual das três lentes você cai."},{"id":"2_three_ingredients","what_pt":"Sentido no trabalho vem de três ingredientes — autonomia, competência e pertencimento — e não de cargo ou pagamento.","what_en":"Meaning at work comes from three ingredients — autonomy, competence, relatedness — not from title or pay.","why_pt":"Autonomia é a alavanca mais forte (Fried e Ferris, 1987); 'autonomia, maestria, propósito' é reempacotamento da ciência (SDT + Hackman/Oldham), não descoberta nova.","why_en":"Autonomy is the strongest lever (Fried and Ferris, 1987); 'autonomy, mastery, purpose' repackages the science (SDT + Hackman/Oldham), it isn't a new finding.","how_to_know_pt":"Nas suas tarefas, quanto você escolhe o como? Quanto você percebe estar melhorando? Pra quem aquilo importa?"},{"id":"3_job_crafting","what_pt":"Dá pra moldar o trabalho por dentro (job crafting) sem trocar de cargo — mudando o que faz, com quem faz e como enxerga.","what_en":"You can reshape work from the inside (job crafting) without changing jobs — the what, the who, and how you see it.","why_pt":"Muda o sentido sem redesenho do empregador (Wrzesniewski e Dutton, 2001); mas 'chamado' forte pode virar armadilha de auto-exploração (Bunderson e Thompson, 2009).","why_en":"It changes meaning without employer redesign (Wrzesniewski and Dutton, 2001); but a strong 'calling' can become a self-exploitation trap (Bunderson and Thompson, 2009).","how_to_know_pt":"Escolha uma fronteira esta semana — uma tarefa, uma relação ou um enquadramento — e mude-a de propósito."}]}$rlog$::jsonb, now()
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
  select id, 'career' from up on conflict (material_id, sub_id) do nothing;

commit;
