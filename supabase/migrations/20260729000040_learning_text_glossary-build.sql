-- migration: 20260729000040_learning_text_glossary-build.sql
-- purpose: Big-release rewrite — glossary-build (explainer, craft).
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
    'glossary-build', 'explainer', 'craft', $topic$glossary-build$topic$, 6,
    $title_pt$Construir muda quem você é$title_pt$,
    $title_en$Building Changes Who You Are$title_en$,
    $summary_pt$A coisa que você termina com as próprias mãos muda você mais do que mil horas de tela — mas só se for escolhida, terminada e mostrada.$summary_pt$,
    $summary_en$The thing you finish with your own hands changes you more than a thousand hours of screen — but only if it's chosen, finished, and shown.$summary_en$,
    $body_pt$Ontem à noite, você provavelmente passou algumas horas assistindo outras pessoas fazerem coisas. Cozinhar, construir, competir, viajar, vencer. É o que quase todo mundo faz com o tempo livre — e não tem nada de errado nisso.

Mas repare no tamanho. Na média, o adulto americano tem 5,2 horas de lazer por dia. Dessas, 2,67 horas — metade — vão pra televisão. É a maior fatia de lazer que existe, na frente de hobbies, jogos e qualquer atividade criativa (Pesquisa de Uso do Tempo dos EUA, 2023).

Metade da sua vida livre é passada olhando. E aqui está a pergunta que este texto responde: o que muda nas horas em que você faz uma coisa — termina um objeto, escreve, conserta, constrói — em vez de consumir a coisa dos outros? A resposta é mais forte do que "é um hobby legal" e mais honesta do que o que a autoajuda promete.

## 1. Fazer muda como você se vê

Tem um experimento clássico. Pesquisadores pediram que pessoas montassem uma caixa de armazenamento simples da IKEA, dobrassem um origami ou montassem um Lego. Depois, perguntaram quanto cada uma pagaria pelo próprio objeto. Quem montou aceitava pagar cerca de 63% a mais pela própria caixa do que outra pessoa pagaria por uma caixa idêntica, já pronta. Batizaram de "efeito IKEA": o trabalho vira afeto (Norton, Mochon e Ariely, 2012).

Mas cuidado com o que esse número diz e o que ele não diz. Montar a caixa não te deixou mais habilidoso. Te deixou mais apegado. É afeto, não competência. Não confunda.

A competência vem de outro lugar. O psicólogo Albert Bandura passou a carreira rastreando de onde vem a crença "eu sou capaz". Ele achou quatro fontes, e uma vence as outras com folga: a experiência de maestria — de fato fazer uma coisa e conseguir. Elogio quase não mexe nisso. Ver outra pessoa conseguir mexe um pouco. Mas terminar algo com as próprias mãos é prova direta de que você consegue — e é prova direta que muda a crença (Bandura, 1977).

Junte os dois. Um objeto terminado te dá apego (efeito IKEA) e evidência (maestria). Consumir não te dá nenhum dos dois. Você pode assistir mil vídeos de marcenaria e não sair nem com uma cadeira que você ama, nem com a prova de que sabe fazer uma.

## 2. Tem três condições — e quase ninguém cumpre

Se fazer fosse mágico por si só, qualquer atividade manual mudaria você. Não é assim. O efeito só aparece sob condições específicas — e é aqui que quase todo mundo tropeça.

**A primeira condição é terminar.** No mesmo estudo do efeito IKEA, quando o objeto era destruído antes de ficar pronto, ou o montador parava no meio, o apego sumia. O trabalho só vira afeto quando produz uma coisa terminada. Um projeto largado na garagem não conta — pra sua cabeça, é quase como não ter começado.

**A segunda é ser escolha sua.** A Teoria da Autodeterminação — um dos modelos mais testados da psicologia da motivação — diz que três necessidades sustentam a vontade que vem de dentro: autonomia (você escolheu), competência (você consegue) e vínculo (importa pra alguém). O ponto crucial: competência sozinha não motiva. Sentir que é bom em algo só vira combustível quando você também sente que a atividade foi escolha sua, não tarefa imposta (Ryan e Deci, 2000). Por isso montar um kit obrigatório cansa, e um projeto seu prende.

**A terceira: ser público ajuda muito.** Seymour Papert, que criou o conceito de "construcionismo", defendia que a gente aprende melhor construindo um artefato que dá pra mostrar — um programa, um objeto, um texto — do que segurando uma abstração só na cabeça. Construcionismo, aqui, é a ideia de que conhecimento gruda melhor quando vira uma coisa pública e compartilhável (Papert e Harel, 1991).

Junte as três e você entende por que fazer prende de um jeito que consumir não prende. Não é à toa que a ciência do "flow" — aquele estado de imersão total em que você perde a noção do tempo — nasceu observando artistas. Nos anos 1970, o psicólogo Mihaly Csikszentmihalyi reparou que pintores trabalhavam horas sem sentir fome nem cansaço, e perdiam o interesse assim que a obra ficava pronta. Ele chamou isso de atividade "autotélica": recompensadora em si mesma, sem precisar de prêmio no fim.

> Os melhores momentos costumam acontecer quando o corpo ou a mente de uma pessoa são levados ao limite num esforço voluntário para realizar algo difícil e que vale a pena.

Fazer uma coisa escolhida, difícil na medida certa e levada até o fim é quase a receita literal desse estado. Não é misticismo. É o que sobra quando você para de olhar a tela e começa a mexer as mãos.

## 3. A versão honesta (e o mínimo que funciona)

Agora a parte que a autoajuda esconde. Fazer coisas é poderoso, mas três promessas comuns são exageradas — e saber onde elas quebram te protege da frustração.

A "regra das 10 mil horas" não é bem o que dizem. O estudo original, com violinistas de uma academia de Berlim, mostrou que os melhores tinham acumulado mais horas de prática solitária que os bons — mas nunca prometeu que horas garantem excelência. Pior: uma meta-análise posterior mediu quanto a prática realmente explica da distância entre expert e novato. Deu 26% em jogos, 21% em música, 18% em esportes, 4% em educação e menos de 1% em profissões (Macnamara et al., 2014). Traduzindo: talento inicial, idade em que você começou e qualidade do treino ainda explicam a maior parte. Praticar muito ajuda; não é passe de mágica.

O "criar vence consumir" dos posts de bem-estar também é mais frágil do que soa. A meta-análise mais rigorosa sobre uso ativo (postar, criar) contra passivo (rolar o feed) juntou 141 estudos e achou efeitos, na maioria, minúsculos — e uso ativo veio com um pouco mais de bem-estar e um pouco mais de ansiedade ao mesmo tempo (Valkenburg et al., 2024). Fazer não é remédio automático.

E o "propósito faz viver mais"? Um acompanhamento de cerca de 6 mil adultos por 14 anos ligou senso de propósito a menor mortalidade (Hill e Turiano, 2014). É correlação, não causa — e construir é só uma das rotas pro propósito. Cuidar de alguém, ensinar, servir a comunidade levam ao mesmo lugar.

Então o que fazer amanhã, sem ilusão? O mínimo cabe em cinco linhas:

:::list-icon
bulb | Escolha você o projeto. Autonomia é o que transforma esforço em vontade.
timer | Comece pequeno. Uma sessão curta vale mais que um plano grandioso.
checkmark-circle | Leve até o fim. Só o objeto terminado gera apego e prova.
people | Mostre pra alguém. O que é público gruda mais que o que fica na gaveta.
trending-up | Repita num ritmo. Um pouco toda semana vence um surto por ano.
:::

Nenhum estudo prova que construir é a única forma de virar quem você quer ser. Mas os números apontam todos na mesma direção: a coisa terminada muda seu apego, sua crença de que é capaz e, um pouco, seu senso de propósito. Metade do seu tempo livre já vai pra tela. A aposta barata é passar uma fatia disso pras suas mãos — e deixar de assistir a vida dos outros o suficiente pra terminar uma que é sua.

:::source[Norton, Mochon & Ariely, 2012 · Journal of Consumer Psychology · 4 estudos](https://doi.org/10.1016/j.jcps.2011.08.002)$body_pt$,
    $body_en$Last night, you probably spent a couple of hours watching other people make things. Cooking, building, competing, traveling, winning. It's what nearly everyone does with their free time — and there's nothing wrong with that.

But look at the scale. The average American adult gets 5.2 hours of leisure a day. Of those, 2.67 hours — half — go to television. It's the single largest slice of leisure there is, ahead of hobbies, games, or any creative pursuit (American Time Use Survey, 2023).

Half of your free life is spent watching. So here's the question this piece answers: what changes in the hours when you make something — finish an object, write, fix, build — instead of consuming someone else's thing? The answer is stronger than "it's a nice hobby," and more honest than what self-help sells.

## 1. Making changes how you see yourself

There's a classic experiment. Researchers had people assemble a plain IKEA storage box, fold origami, or build with Lego. Then they asked how much each person would pay for their own object. The builders would pay about 63% more for their own box than someone else would pay for an identical, ready-made one. They called it the "IKEA effect": labor turns into love (Norton, Mochon & Ariely, 2012).

But be careful about what that number says and doesn't. Assembling the box didn't make you more skilled. It made you more attached. That's affection, not competence. Don't confuse them.

Competence comes from somewhere else. The psychologist Albert Bandura spent his career tracing where the belief "I'm capable" comes from. He found four sources, and one beats the rest by a wide margin: mastery experience — actually doing a thing and succeeding. Praise barely moves it. Watching someone else succeed moves it a little. But finishing something with your own hands is direct proof that you can — and it's direct proof that shifts the belief (Bandura, 1977).

Put the two together. A finished object gives you attachment (the IKEA effect) and evidence (mastery). Consuming gives you neither. You can watch a thousand woodworking videos and walk away with neither a chair you love nor proof you can build one.

## 2. There are three conditions — and almost no one meets them

If making were magic on its own, any hands-on activity would change you. It doesn't work that way. The effect only shows up under specific conditions — and this is where almost everyone trips.

**The first condition is finishing.** In the same IKEA-effect study, when the object was destroyed before completion, or the builder stopped halfway, the attachment vanished. Labor only turns into love when it produces a finished thing. A project abandoned in the garage doesn't count — to your mind, it's almost as if you never started.

**The second is that it has to be yours to choose.** Self-Determination Theory — one of the most tested models in the psychology of motivation — holds that three needs feed the drive that comes from within: autonomy (you chose it), competence (you can do it), and relatedness (it matters to someone). The crucial part: competence alone doesn't motivate. Feeling good at something only becomes fuel when you also feel the activity was your choice, not an assigned chore (Ryan & Deci, 2000). That's why an obligatory kit drains you and a project of your own holds you.

**The third: being public helps a lot.** Seymour Papert, who coined "constructionism," argued that we learn better by building an artifact we can show — a program, an object, a piece of writing — than by holding an abstraction only in our heads. Constructionism, here, is the idea that knowledge sticks better when it becomes a public, shareable thing (Papert & Harel, 1991).

Put all three together and you see why making holds you in a way consuming can't. It's no accident that the science of "flow" — that state of total immersion where you lose track of time — was born watching artists. In the 1970s, the psychologist Mihaly Csikszentmihalyi noticed that painters worked for hours without feeling hunger or fatigue, then lost interest the moment a piece was done. He called it "autotelic" activity: rewarding in itself, needing no prize at the end.

> The best moments usually occur when a person's body or mind is stretched to its limits in a voluntary effort to accomplish something difficult and worthwhile.

Making something chosen, difficult in just the right measure, and carried to the end is almost the literal recipe for that state. It's not mysticism. It's what's left when you stop looking at the screen and start moving your hands.

## 3. The honest version (and the minimum that works)

Now the part self-help leaves out. Making things is powerful, but three common promises are oversold — and knowing where they break protects you from disappointment.

The "10,000-hour rule" isn't quite what people say. The original study, of violinists at a Berlin academy, showed the best players had logged more solitary practice than the good ones — but it never promised that hours guarantee excellence. Worse: a later meta-analysis measured how much practice actually explains the gap between expert and novice. It came to 26% in games, 21% in music, 18% in sports, 4% in education, and under 1% in professions (Macnamara et al., 2014). Translation: starting talent, the age you began, and coaching quality still explain most of it. Heavy practice helps; it's no magic wand.

The "creating beats consuming" line from wellness posts is shakier than it sounds, too. The most rigorous meta-analysis on active use (posting, creating) versus passive (scrolling the feed) pooled 141 studies and found mostly tiny effects — with active use tied to slightly more well-being and slightly more anxiety at the same time (Valkenburg et al., 2024). Making isn't automatic medicine.

And "purpose makes you live longer"? A follow-up of roughly 6,000 adults over 14 years linked a sense of purpose to lower mortality (Hill & Turiano, 2014). That's correlation, not cause — and building is only one route to purpose. Caring for someone, teaching, serving a community lead to the same place.

So what do you do tomorrow, without the illusions? The minimum fits in five lines:

:::list-icon
bulb | Choose the project yourself. Autonomy is what turns effort into wanting.
timer | Start small. One short session beats a grand plan.
checkmark-circle | Carry it to the end. Only the finished object gives attachment and proof.
people | Show it to someone. What's public sticks more than what stays in a drawer.
trending-up | Repeat on a rhythm. A little every week beats one burst a year.
:::

No study proves building is the only way to become who you want to be. But the numbers all point the same direction: the finished thing changes your attachment, your belief that you're capable, and — a little — your sense of purpose. Half your free time already goes to a screen. The cheap bet is to move a slice of it into your hands — and stop watching other people's lives long enough to finish one that's yours.

:::source[Norton, Mochon & Ariely, 2012 · Journal of Consumer Psychology · 4 studies](https://doi.org/10.1016/j.jcps.2011.08.002)$body_en$,
    array[$tkpt0$Terminar um objeto seu te dá apego (efeito IKEA, +63%) e prova de que é capaz (maestria, a fonte nº 1 de autoconfiança). Consumir não dá nenhum dos dois.$tkpt0$, $tkpt1$O efeito só vale sob três condições: você escolheu, você terminou, e dá pra mostrar. Projeto largado na gaveta não conta.$tkpt1$, $tkpt2$A ciência é mais modesta que a autoajuda: prática explica de menos de 1% a 26% da diferença entre expert e novato. Construir muda você, mas não é passe de mágica.$tkpt2$]::text[],
    array[$tken0$Finishing something of your own gives you attachment (the IKEA effect, +63%) and proof you're capable (mastery, the #1 source of self-confidence). Consuming gives neither.$tken0$, $tken1$The effect only holds under three conditions: you chose it, you finished it, and you can show it. A project abandoned in a drawer doesn't count.$tken1$, $tken2$The science is humbler than self-help: practice explains from under 1% to 26% of the expert-novice gap. Building changes you, but it's no magic wand.$tken2$]::text[],
    $trk_pt$No app, cada tarefa de Craft que você leva até o fim é o "objeto terminado" deste texto — e é isso que gera apego e prova, não a tarefa começada e largada. Escolha suas próprias skills e projetos (autonomia), use as missões pra ter um prazo que force o terminar, e olhe o histórico de XP como evidência acumulando: não um surto, mas um pouco toda semana. O placar não é o ponto. O ponto é que cada coisa concluída é prova direta de que você é capaz de mais.$trk_pt$,
    $trk_en$In the app, every Craft task you carry to the end is the "finished object" this piece is about — that's what creates attachment and proof, not the task started and abandoned. Choose your own skills and projects (autonomy), use missions to set a deadline that forces the finish, and read your XP history as evidence piling up: not a burst, but a little every week. The score isn't the point. The point is that each finished thing is direct proof you're capable of more.$trk_en$,
    $src_url$https://doi.org/10.1016/j.jcps.2011.08.002$src_url$,
    $src_pt$Norton, Mochon & Ariely, 2012 · Journal of Consumer Psychology · 4 estudos$src_pt$,
    $src_en$Norton, Mochon & Ariely, 2012 · Journal of Consumer Psychology · 4 studies$src_en$,
    $rlog${"template_type":"explainer","template_version":2,"voice_principles_applied":["Exactly 3 hero ideas (self-image / three conditions / honest limits), each ~300-400 words — merged the dossier's 11 facts down instead of one section per fact.","Prose-led: body carries 2 fenced cards total (one :::list-icon recipe + closing :::source) plus one light markdown blockquote; deliberately no top stat card, headline number (2.67h of 5.2h) woven into the hook prose.","Native PT and native EN written as separate drafts, not translation — different idioms ('vence as outras com folga' vs 'beats the rest by a wide margin', 'não é passe de mágica' vs 'no magic wand').","Jargon defined on first mention: efeito IKEA, experiência de maestria, Teoria da Autodeterminação (autonomia/competência/vínculo), construcionismo, flow, autotélico.","Honest caveats flagged per editorial rule: 10k-hour rule as a popularization Ericsson never claimed; active-vs-passive effects mostly tiny and paired with anxiety; purpose-longevity correlational with other routes; IKEA effect is valuation not competence.","Concrete anchors instead of abstract noun lists: the IKEA box, a chair vs a thousand woodworking videos, the finish/choose/show conditions, the five-line recipe.","Consistent second-person 'você'/'you'; sentence average near 16 words; filler cut (no 'vale lembrar', 'no fim das contas', 'It's worth noting')."],"steps":[{"id":"hook","answer_pt":"Metade do tempo livre do adulto americano (2,67h de 5,2h) vai pra televisão — a maior fatia de lazer que existe. A pergunta que abre: o que muda quando você faz uma coisa em vez de consumir a coisa dos outros?","answer_en":"Half of the average American's leisure (2.67h of 5.2h) goes to television — the single largest leisure slice. The opening question: what changes when you make something instead of consuming someone else's thing?"},{"id":"thesis","answer_pt":"Terminar uma coisa que é sua muda seu apego, sua crença de que é capaz e um pouco do seu propósito — mas só sob três condições que quase ninguém cumpre.","answer_en":"Finishing something of your own changes your attachment, your belief you're capable, and a little of your purpose — but only under three conditions almost no one meets."},{"id":"real_definition","answer_pt":"Fazer não é só um hobby: o efeito IKEA (apego, +63%) e a experiência de maestria (competência) são coisas diferentes, e consumir não entrega nenhuma das duas.","answer_en":"Making isn't just a hobby: the IKEA effect (attachment, +63%) and mastery experience (competence) are different things, and consuming delivers neither."},{"id":"stakes","answer_pt":"Efeito IKEA: montadores pagariam ~63% a mais pelo próprio objeto do que outros pagariam por um idêntico pronto (Norton et al., 2012). Em paralelo, maestria é a fonte nº 1 de autoeficácia porque é prova direta, não elogio (Bandura, 1977).","answer_en":"IKEA effect: builders would pay ~63% more for their own object than others would pay for an identical ready-made one (Norton et al., 2012). Separately, mastery is the #1 source of self-efficacy because it's direct proof, not praise (Bandura, 1977)."},{"id":"mechanism","answer_pt":"Três condições fazem o efeito aparecer — terminar (o apego some se o objeto não é concluído), escolher (Autodeterminação: competência sozinha não motiva sem autonomia) e mostrar (construcionismo: o público gruda mais). O flow, estudado por Csikszentmihalyi observando pintores, é o que sobra quando as três se juntam.","answer_en":"Three conditions make the effect appear — finishing (attachment vanishes if unfinished), choosing (Self-Determination: competence alone doesn't motivate without autonomy), and showing (constructionism: public sticks more). Flow, which Csikszentmihalyi studied by watching painters, is what's left when all three combine."},{"id":"myth_busts","answer_pt":"As 10 mil horas são popularização — a prática explica de <1% a 26% da diferença expert-novato (Macnamara et al., 2014). 'Criar vence consumir' tem efeito minúsculo e traz um pouco mais de ansiedade junto (Valkenburg et al., 2024). E propósito-longevidade é correlação, com outras rotas além de construir (Hill e Turiano, 2014).","answer_en":"The 10,000 hours are a popularization — practice explains <1% to 26% of the expert-novice gap (Macnamara et al., 2014). 'Create beats consume' has tiny effects and comes with slightly more anxiety too (Valkenburg et al., 2024). And purpose-longevity is correlation, with routes beyond building (Hill & Turiano, 2014)."},{"id":"recipe","answer_pt":"Escolha você o projeto; comece pequeno; leve até o fim; mostre pra alguém; repita num ritmo. Cinco ações em :::list-icon.","answer_en":"Choose the project yourself; start small; carry it to the end; show it to someone; repeat on a rhythm. Five actions in a :::list-icon."}],"main_points":[{"id":"1_making_changes_self","what_pt":"Terminar um objeto seu muda como você se vê: te dá apego (efeito IKEA, +63%) e prova de competência (experiência de maestria).","why_pt":"Maestria é a fonte nº 1 de autoconfiança (Bandura) porque é prova direta, não elogio. Consumir não gera nem apego nem prova.","how_to_know_pt":"Pergunta-teste no fim da noite: você tem uma coisa terminada que é sua, ou só assistiu à coisa dos outros?","what_en":"Finishing your own object changes how you see yourself: it gives attachment (the IKEA effect, +63%) and proof of competence (mastery experience).","why_en":"Mastery is the #1 source of self-confidence (Bandura) because it's direct proof, not praise. Consuming gives neither attachment nor proof."},{"id":"2_three_conditions","what_pt":"O efeito só aparece sob três condições: você escolheu (autonomia), você terminou (objeto pronto) e dá pra mostrar (público).","why_pt":"Autodeterminação: competência sozinha não motiva sem autonomia. O efeito IKEA some se o objeto não é concluído. Construcionismo: o que é público gruda mais.","how_to_know_pt":"Cheque o projeto: foi escolha sua? Chegou ao fim? Alguém viu? Se falta uma, o efeito enfraquece.","what_en":"The effect only appears under three conditions: you chose it (autonomy), you finished it (a done object), and you can show it (public).","why_en":"Self-Determination: competence alone doesn't motivate without autonomy. The IKEA effect vanishes if unfinished. Constructionism: what's public sticks more."},{"id":"3_honest_limits","what_pt":"A ciência é mais modesta que a autoajuda: prática explica de <1% a 26% da diferença expert-novato; 'criar vence consumir' tem efeitos minúsculos; propósito é correlação.","why_pt":"A regra das 10 mil horas é popularização (Ericsson nunca prometeu). Talento, idade de início e treino explicam a maior parte. Construir é uma rota pro propósito, não a única.","how_to_know_pt":"Se você espera virar expert só acumulando horas, recalibre: pratique com propósito, mas conte também com talento e sorte de contexto.","what_en":"The science is humbler than self-help: practice explains from <1% to 26% of the expert-novice gap; 'create beats consume' has tiny effects; purpose is correlational.","why_en":"The 10,000-hour rule is a popularization (Ericsson never promised it). Talent, starting age, and coaching explain most of the gap. Building is one route to purpose, not the only one."}]}$rlog$::jsonb, now()
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
  select id, 'build' from up on conflict (material_id, sub_id) do nothing;

commit;
