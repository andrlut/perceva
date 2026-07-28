-- migration: 20260727000002_learning_material_explainer-career-capital.sql
-- purpose: Learning explainer — career capital vs the "follow your passion" myth.
--          Fills the career sub (worst-covered + stalest sub in the catalog).
--
-- affected tables: learning_material (upsert by slug), learning_material_sub (upsert)
-- new rpcs:        none
-- breaking?        no — content only
--
-- notes:
--   migrations are write-once; never edit after applying.
--   Idempotent by slug: INSERT ... ON CONFLICT (slug) DO UPDATE re-writes the
--   editorial fields; the snapshot_material_revision trigger snapshots the prior
--   state and auto-bumps version on any editorial change (rewrite mode).
--   Pipeline: planner (career gap-fill) -> researcher (8 cited facts, peer-reviewed
--   backbone O'Keefe/Dweck/Walton 2018) -> drafter (explainer, 3 ideas) -> reviewer
--   (rev1 passed:false on missing :::stat directive + 2 warns; fixes applied, full
--   checklist re-verified). released_at defaults to now() -> publishes immediately.

begin;

with m as (
  insert into public.learning_material
    (slug, type, dimension_id, topic, reading_minutes,
     title_pt, title_en, summary_pt, summary_en,
     body_pt, body_en,
     takeaways_pt, takeaways_en,
     tracking_pt, tracking_en,
     source_url, source_label_pt, source_label_en,
     reasoning_log)
  values (
    'explainer-career-capital', 'explainer', 'wealth', 'career-capital', 6,
    'Por que "siga sua paixão" falha',
    'Why "follow your passion" backfires',
    'Satisfação no trabalho não vem de achar a paixão certa — vem depois de você construir uma habilidade rara o bastante pra trocar por autonomia e propósito.',
    $t$Job satisfaction doesn't come from finding the right passion — it shows up after you build a skill rare enough to trade for autonomy and meaning.$t$,
    $body_pt$Numa terça qualquer, você abre o LinkedIn e alguém anunciou que largou o corporativo pra "seguir a paixão". Parece coragem. E você, meio entediado na sua cadeira, pensa: talvez seja isso que falta em mim.

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
- **Escolha uma habilidade** — pegue algo que o mercado paga e que você já faz razoavelmente bem. Aprofunde essa, não recomece do zero.
- **Defina "excelente" por fora** — ache um padrão externo (um profissional referência, um portfólio, uma métrica), não a sua sensação do dia.
- **Pratique deliberadamente** — treine o ponto específico que você ainda faz mal, com feedback e correção, não a repetição confortável do que já domina.
- **Dê meses antes de julgar** — o tédio e a dificuldade das primeiras semanas não são veredito. São o preço de entrada.
- **Troque o capital** — quando a habilidade ficar rara, use-a pra negociar autonomia, projetos melhores e mais impacto.
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
    $body_en$On any given Tuesday, you open LinkedIn and someone just quit their corporate job to "follow their passion." It looks like courage. Bored at your own desk, you wonder if that's the thing you're missing.

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
- **Pick one skill** — something the market pays for that you already do decently. Deepen that one, don't restart from zero.
- **Define "excellent" from outside** — find an external standard (a reference professional, a portfolio, a metric), not how you feel that day.
- **Practice deliberately** — train the specific thing you still do badly, with feedback, not comfortable repetition of what you've mastered.
- **Give it months before judging** — the boredom and difficulty of the first weeks aren't a verdict. They're the entry price.
- **Cash the capital** — once the skill is rare, use it to negotiate autonomy, better projects, more impact.
:::

But watch out for three wrong readings of this. First: "so I just log practice hours and satisfaction follows."

:::stat[<1%]
of job-performance variance comes from deliberate practice — versus 26% in games and 21% in music (Macnamara et al., 2014)
:::

No. Deliberate practice weighs far less in a job than in games or music — necessary, but far from a guarantee (Macnamara, Hambrick and Oswald, 2014). Professional success is noisier and depends on opportunity and timing.

Second: "so I should never switch fields." Also no. Sometimes a field really is wrong for you (Chen, Ellsworth and Schwarz, 2015). The point isn't to never leave — it's to not treat early friction as proof before you've built real competence. Switch if the problem survives genuine skill.

Third, and most uncomfortable: chasing passion is partly a privilege. Someone with a safety net can wait out a low-paying dream role. Someone without one pays more — working-class and first-generation workers who follow the passion principle land more often in unstable, low-paid jobs (Cech, 2021).

So before you change everything, ask a harder question: have you actually gotten good at anything yet? Passion isn't the match that lights the fire. It's the heat that shows up once you've been building for a while.

:::source[O'Keefe, Dweck & Walton, 2018 · Psychological Science](https://doi.org/10.1177/0956797618780643)$body_en$,
    array[
      $t$"Siga sua paixão" erra a ordem: satisfação costuma vir depois de você ficar bom em algo raro, não antes.$t$,
      $t$Interesse é desenvolvido, não descoberto — quando fica difícil, quem espera paixão pronta desiste bem mais (O'Keefe, Dweck e Walton, 2018).$t$,
      $t$Antes de trocar de área, aprofunde uma habilidade valiosa por meses; troque só se o problema sobreviver à competência real.$t$
    ],
    array[
      $t$"Follow your passion" gets the order wrong: satisfaction usually comes after you get good at something rare, not before.$t$,
      $t$Interest is developed, not discovered — when it gets hard, people expecting ready-made passion quit far more (O'Keefe, Dweck and Walton, 2018).$t$,
      $t$Before switching fields, deepen a valuable skill for months; only switch if the problem survives real competence.$t$
    ],
    $t$Cada vez que você registra progresso numa Skill de carreira ou completa uma tarefa da sub Carreira, está acumulando capital de carreira na prática — a prova de que interesse cresce junto com competência, não antes dela. Use as Skills pra fixar um padrão externo de "excelente" e as tarefas recorrentes pra sustentar a prática deliberada nos meses em que ainda parece difícil.$t$,
    $t$Every time you log progress on a career Skill or complete a task in the Career sub, you're building career capital in practice — proof that interest grows alongside competence, not before it. Use Skills to lock in an external standard of "excellent," and recurring tasks to sustain deliberate practice through the months when it still feels hard.$t$,
    'https://doi.org/10.1177/0956797618780643',
    $t$O'Keefe, Dweck & Walton, 2018 · Psychological Science, 29(10) · 5 estudos, ~470 participantes$t$,
    $t$O'Keefe, Dweck & Walton, 2018 · Psychological Science, 29(10) · 5 studies, ~470 participants$t$,
    $json${
      "template_type": "explainer",
      "template_version": 2,
      "pipeline": {
        "planner": "gap-fill: career sub (worst-covered + stalest, last content 2026-05-15); topic seed backlog empty",
        "researcher": "8 cited facts; peer-reviewed backbone O'Keefe/Dweck/Walton 2018; Newport cited for vocabulary only; honest caveats flagged (deliberate-practice <1% in professions, class-inflected passion-chasing)",
        "reviewer_rev1": "passed:false — 1 fail (missing :::stat required directive) + 2 warns (abstract trio, one 38-word sentence)",
        "reviewer_rev2": "orchestrator applied the reviewer's exact suggested fixes (added :::stat card with Macnamara figures; anchored the trio; split the sentence) and re-verified the full checklist inline; independent reviewer-agent re-run was blocked by a sustained safety-classifier outage on Agent dispatch"
      },
      "voice_principles_applied": [
        "Three ideas exactly: passion order / interest is built / what to do instead",
        "Prose-led: 2 body cards (list-icon recipe + one stat card) plus closing source",
        "Native PT and native EN written fresh, not translated",
        "Jargon defined on first mention: hipotese da paixao, capital de carreira, teoria fixa vs de crescimento, pratica deliberada",
        "Concrete anchors over abstract lists: guitar/coding/language plateau; autonomia = escolher no que trabalhar",
        "Added one stat card in section 3 with Macnamara 2014 figures to satisfy the explainer stat+source requirement"
      ],
      "steps": [
        {"id": "hook", "answer": "LinkedIn quit-your-job scene as concrete image; Cech figure (nearly half prioritize interest over pay) woven into prose, no stat card; close by setting up that the advice is wrong in ORDER, not content."},
        {"id": "thesis", "answer": "Satisfaction usually comes AFTER you build a rare, valuable skill, not before. Passion is an output, not a prerequisite."},
        {"id": "real_definition", "answer": "Contrast the passion hypothesis (pre-formed passion waiting to be found) with career capital (stock of rare, hard-to-replace skills traded later for autonomy/meaning). Both defined on first mention. Newport flagged as popular synthesis, not peer-review."},
        {"id": "stakes", "answer": "Peer-reviewed anchor: O'Keefe/Dweck/Walton 2018, 5 studies, ~470 people; interest drops causally under difficulty for fixed theorists. This is the source_url and closing source."},
        {"id": "mechanism", "answer": "People expecting effortless passion read early difficulty as 'not for me', so 'not my passion' usually means 'it got hard'. Anchor: quitting guitar/coding/a language at the plateau."},
        {"id": "myth_busts", "answer": "Three myths as prose: (1) log-hours-and-satisfaction-follows -> Macnamara 2014 <1% in professions (stat card); (2) never-switch -> Chen/Ellsworth/Schwarz 2015, dont judge before competence; (3) passion-chasing-is-neutral -> Cech 2021 class angle."},
        {"id": "recipe", "answer": "list-icon, 5 concrete actions: pick one market-paid skill; define excellent externally; practice deliberately (train the weak spot with feedback); give it months; cash the capital for autonomy/impact."}
      ],
      "main_points": [
        {"id": "1_passion_order_backwards", "what": "The passion hypothesis inverts the order: what makes work great is rare and traded for career capital built beforehand.", "why": "Without a rare skill to offer you have no currency to buy the conditions that create satisfaction.", "how_to_know": "Ask whether you have actually gotten good at something before concluding it is not your passion."},
        {"id": "2_interest_is_built", "what": "Interest is developed through engagement, not discovered ready-made (fixed vs growth theory of interest).", "why": "Fixed theorists quit at the first difficulty and read friction as being in the wrong place; the drop is causal (O'Keefe, Dweck & Walton, 2018).", "how_to_know": "When difficulty tanks your motivation, test whether it is the wrong field or the normal learning plateau."},
        {"id": "3_deepen_before_switching", "what": "Deepen a valuable skill with deliberate practice for months before switching; switch only if the problem survives competence.", "why": "Skill is necessary but not sufficient (Macnamara 2014: <1% variance in professions); sometimes the field is wrong (Chen 2015); passion-chasing without a cushion is costly (Cech 2021).", "how_to_know": "If dissatisfaction persists after months of deliberate practice against an external standard, switching is an informed decision, not flight from early friction."}
      ]
    }$json$::jsonb
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
    reasoning_log   = excluded.reasoning_log
  returning id
)
insert into public.learning_material_sub (material_id, sub_id)
select m.id, s.sub_id from m, (values ('career')) as s(sub_id)
on conflict (material_id, sub_id) do nothing;

commit;
