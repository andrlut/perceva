-- migration: 20260729000030_learning_text_explainer-career-capital.sql
-- purpose: Big-release text fix — reformat the :::list-icon recipe from "- bullet"
--          into the renderer's required "icon | text" form so it stops rendering
--          as an empty box (LearningBody.tsx drops non-matching list-icon lines).
-- affected: learning_material (body_pt, body_en). Revision trigger bumps version.
-- released_at: unchanged (kept).
begin;
set local app.edited_by = 'big-release-20260729';
set local app.edit_summary = 'fix list-icon directive format (bullets -> icon|text)';

update public.learning_material set
  body_pt = $body_pt$Numa terça qualquer, você abre o LinkedIn e alguém anunciou que largou o corporativo pra "seguir a paixão". Parece coragem. E você, meio entediado na sua cadeira, pensa: talvez seja isso que falta em mim.

A paixão virou a régua principal da carreira. Quase metade dos trabalhadores com diploma nos EUA diz que interesse é o que mais importa num emprego, bem na frente de salário (Cech, 2021). "Faça o que você ama" soa óbvio, quase sagrado.

Só que ele erra numa coisa simples: a ordem. E é essa inversão que faz tanta gente trocar de área três vezes e continuar insatisfeita.

## A paixão não vem antes. Vem depois.

Por trás de "siga sua paixão" existe uma crença que Cal Newport batizou de hipótese da paixão. A ideia: existe, em algum lugar dentro de você, uma paixão pré-formada esperando ser descoberta. O trabalho certo seria aquele que combina com ela.

Newport propõe o contrário. Aquilo que torna um trabalho ótimo — autonomia (escolher no que trabalhar), impacto, criatividade — é raro e valioso. Pela lei da oferta e procura, você só recebe essas coisas em troca de algo igualmente raro: uma habilidade que pouca gente tem. Ele chama isso de capital de carreira.

Capital de carreira é o conjunto de habilidades raras e difíceis de substituir que você acumula ao longo dos anos. É a moeda que você troca, mais tarde, por autonomia e propósito.

> "Se seu objetivo é amar o que faz, você primeiro precisa construir capital de carreira dominando habilidades raras e valiosas — e só então trocar esse capital pelos traços que definem um ótimo trabalho." — Cal Newport

Um aviso honesto: o livro de Newport é síntese jornalística, não ciência revisada por pares. Serve pro vocabulário, não como prova. E críticos apontam que as pessoas dos casos que ele estuda já tinham alguma inclinação pela área antes de ficarem boas. Então leia assim: não espere a paixão chegar pronta antes de construir competência. Não é que paixão nunca venha primeiro — é que apostar tudo nela como pré-requisito costuma dar errado.

## Interesse é construído, não descoberto

Aqui a psicologia entra com evidência de verdade. Em 2018, os pesquisadores O'Keefe, Dweck e Walton testaram duas formas de encarar o interesse, em cinco estudos com cerca de 470 pessoas (Psychological Science).

Numa delas — a teoria fixa do interesse — as paixões são fixas: você as descobre prontas. Na outra — a teoria de crescimento — os interesses se desenvolvem conforme você se envolve com algo.

O grupo de mentalidade fixa mostrou menos curiosidade por qualquer coisa fora do seu foco atual. E o achado decisivo: quando um interesse novo ficava difícil, a vontade dessas pessoas caía muito mais do que a do grupo de crescimento. O efeito era causal — empurrar alguém pra visão fixa já produzia a queda.

Essa é a armadilha. Quem espera que a paixão seja fácil lê a primeira parede de dificuldade como um sinal: isso não é pra mim. Por isso "não é minha paixão" quase sempre quer dizer, na prática, "ficou difícil".

Pense em qualquer pessoa que largou o violão, a programação ou um idioma exatamente quando o brilho de iniciante passou e o platô começou. A habilidade não sumiu — o conforto sumiu.

## O que fazer no lugar de trocar de área

Antes de reescrever o currículo pra outra área, aprofunde uma competência que você já tem. O roteiro é chato de propósito:

:::list-icon
search | **Escolha uma habilidade** — pegue algo que o mercado paga e que você já faz razoavelmente bem. Aprofunde essa, não recomece do zero.
flag | **Defina "excelente" por fora** — ache um padrão externo (um profissional referência, um portfólio, uma métrica), não a sua sensação do dia.
barbell | **Pratique deliberadamente** — treine o ponto específico que você ainda faz mal, com feedback e correção, não a repetição confortável do que já domina.
hourglass | **Dê meses antes de julgar** — o tédio e a dificuldade das primeiras semanas não são veredito. São o preço de entrada.
swap-horizontal | **Troque o capital** — quando a habilidade ficar rara, use-a pra negociar autonomia, projetos melhores e mais impacto.
:::

Mas cuidado com três leituras erradas disso. A primeira: "então é só juntar horas de prática que a satisfação vem".

:::stat[<1%]
da variação de desempenho em profissões vem da prática deliberada — contra 26% em jogos e 21% em música (Macnamara et al., 2014)
:::

Não. A prática deliberada pesa muito menos no trabalho do que em jogos ou música — necessária, mas longe de garantir sucesso (Macnamara, Hambrick e Oswald, 2014). Sucesso profissional é mais barulhento e depende de oportunidade e timing.

A segunda: "então eu nunca devo trocar de área". Também não. Às vezes o campo é mesmo errado pra você (Chen, Ellsworth e Schwarz, 2015). O ponto não é nunca sair — é não tratar o atrito inicial como prova antes de ter construído competência de verdade. Troque se o problema sobreviver à habilidade real.

A terceira é a mais desconfortável: perseguir paixão é, em parte, um privilégio. Quem tem rede de segurança pode esperar a vaga apaixonante mal paga. Quem não tem paga mais caro — trabalhadores de origem operária que seguem o princípio da paixão acabam com mais frequência em empregos instáveis e mal remunerados (Cech, 2021).

Então, antes de mudar tudo, faça uma pergunta mais dura: você já ficou bom em alguma coisa? A paixão não é o fósforo que acende o fogo. É o calor que aparece depois que você já vem construindo há um tempo.

:::source[O'Keefe, Dweck & Walton, 2018 · Psychological Science](https://doi.org/10.1177/0956797618780643)$body_pt$,
  body_en = $body_en$On any given Tuesday, you open LinkedIn and someone just quit their corporate job to "follow their passion." It looks like courage. Bored at your own desk, you wonder if that's the thing you're missing.

Passion has become the main yardstick for a career. Nearly half of degree-holding US workers say interest matters more than anything else in a job, well ahead of pay (Cech, 2021). "Do what you love" sounds obvious, almost sacred.

It just gets one thing wrong: the order. And that reversal is why so many people switch fields three times and stay unhappy.

## Passion doesn't come first. It comes after.

Behind "follow your passion" sits a belief the computer scientist Cal Newport named the passion hypothesis. The idea: somewhere inside you a pre-formed passion is waiting to be found, and the right job is the one that matches it.

Newport argues the reverse. The things that make work great — autonomy (choosing what you work on), impact, creativity — are rare and valuable. By simple supply and demand, you only get them in exchange for something equally rare: a skill few people have. He calls that career capital.

Career capital is the stock of rare, hard-to-replace skills you build over years. It's the currency you later trade for autonomy and meaning.

> "If your goal is to love what you do, you must first build up 'career capital' by mastering rare and valuable skills, and then cash in this capital for the traits that define great work." — Cal Newport

An honest caveat: Newport's book is popular synthesis, not peer-reviewed science. Use it for the vocabulary, not as proof. And critics point out that the people in his case studies already leaned toward their field before they got good. So read it narrowly: don't wait for passion to arrive fully formed before you build skill. It's not that passion never comes first — it's that betting everything on it as a prerequisite usually fails.

## Interest is built, not discovered

Here the psychology brings real evidence. In 2018, O'Keefe, Dweck and Walton tested two ways of seeing interest, across five studies with around 470 people (Psychological Science).

In one — a fixed theory of interest — passions are set: you discover them, ready-made. In the other — a growth theory — interests develop as you engage with something.

The fixed group showed less curiosity about anything outside their current focus. And the decisive finding: when a new interest got hard, their interest dropped far more than the growth group's. The effect was causal — nudging people toward the fixed view produced the drop.

That's the trap. People who expect passion to feel effortless read the first wall of difficulty as a signal: this isn't for me. So "it's not my passion" almost always means, in practice, "it got hard."

Think of anyone who quit guitar, or coding, or a language, right when the beginner glow wore off and the plateau began. The skill didn't disappear — the comfort did.

## What to do instead of switching fields

Before you rewrite your resume for a new field, go deeper on a skill you already have. The routine is boring on purpose:

:::list-icon
search | **Pick one skill** — something the market pays for that you already do decently. Deepen that one, don't restart from zero.
flag | **Define "excellent" from outside** — find an external standard (a reference professional, a portfolio, a metric), not how you feel that day.
barbell | **Practice deliberately** — train the specific thing you still do badly, with feedback, not comfortable repetition of what you've mastered.
hourglass | **Give it months before judging** — the boredom and difficulty of the first weeks aren't a verdict. They're the entry price.
swap-horizontal | **Cash the capital** — once the skill is rare, use it to negotiate autonomy, better projects, more impact.
:::

But watch out for three wrong readings of this. First: "so I just log practice hours and satisfaction follows."

:::stat[<1%]
of job-performance variance comes from deliberate practice — versus 26% in games and 21% in music (Macnamara et al., 2014)
:::

No. Deliberate practice weighs far less in a job than in games or music — necessary, but far from a guarantee (Macnamara, Hambrick and Oswald, 2014). Professional success is noisier and depends on opportunity and timing.

Second: "so I should never switch fields." Also no. Sometimes a field really is wrong for you (Chen, Ellsworth and Schwarz, 2015). The point isn't to never leave — it's to not treat early friction as proof before you've built real competence. Switch if the problem survives genuine skill.

Third, and most uncomfortable: chasing passion is partly a privilege. Someone with a safety net can wait out a low-paying dream role. Someone without one pays more — working-class and first-generation workers who follow the passion principle land more often in unstable, low-paid jobs (Cech, 2021).

So before you change everything, ask a harder question: have you actually gotten good at anything yet? Passion isn't the match that lights the fire. It's the heat that shows up once you've been building for a while.

:::source[O'Keefe, Dweck & Walton, 2018 · Psychological Science](https://doi.org/10.1177/0956797618780643)$body_en$
where slug = 'explainer-career-capital';

commit;
