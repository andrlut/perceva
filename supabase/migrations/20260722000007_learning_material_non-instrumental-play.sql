-- migration: 20260722000007_learning_material_non-instrumental-play.sql
-- Learning material: non-instrumental-play (explainer) — craft / play sub-gap fill.
-- Autonomous Learning publisher run (commit-direct mode).
-- Planner: craft/play coverage gap (only glossary-play existed). Researcher: 9 peer-
--   reviewed facts (recovery-experience literature). Reviewer: PASSED with 2 warnings
--   (both non-blocking; FAIL from pass 1 — unsourced headline stat — fixed and re-passed).
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
  $slug$non-instrumental-play$slug$,
  $t$explainer$t$,
  $t$craft$t$,
  $t$non-instrumental play$t$,
  6,
  $t$O hobby mais inútil é o que mais descansa$t$,
  $t$The Most Useless Hobby Rests You Best$t$,
  $t$Por que o hobby que você monetizou parou de descansar sua cabeça — e o que a ciência da recuperação diz sobre o lazer sem meta, métrica ou plateia.$t$,
  $t$Why the hobby you monetized stopped resting your mind — and what recovery science says about leisure with no goal, no metric, no audience.$t$,
  $body_pt$Repare no que aconteceu com os seus hobbies. O violão que você tocava por tocar virou "será que eu daria aula?". A corrida de domingo agora tem pace, mapa e print pro story. O bolo de fim de semana virou "eu devia montar uma confeitaria". Em algum momento, o lazer virou projeto.

A cultura do "transforme sua paixão em renda" vendeu uma ideia sedutora: um hobby só vale a pena se produzir alguma coisa — dinheiro, seguidores, um recorde pessoal. Mas a psicologia da recuperação aponta pro lado oposto. É justamente a atividade inútil, sem meta e sem plateia, que recarrega a sua cabeça depois do trabalho.

A maior meta-análise já feita sobre o tema reuniu centenas de estudos e quase 100 mil trabalhadores (Headrick et al., 2023). A conclusão é direta: relaxar e se absorver em algo fora do trabalho é o que mais prevê bem-estar.

:::stat{value="99.329 pessoas" label="Em 316 estudos sobre recuperação, relaxar e se absorver numa atividade fora do trabalho prevê bem-estar. Só 'desligar' reduz o esgotamento — mas não melhora o seu desempenho."}

## 1. Lazer inútil não é lazer preguiçoso

O primeiro engano é achar que descansar é só desligar e não fazer nada. Não é. O Questionário de Experiências de Recuperação (Sonnentag e Fritz, 2007) separou quatro formas diferentes de recarregar depois do trabalho: desligar mentalmente, relaxar, ter controle sobre o próprio tempo e — a mais contraintuitiva — o domínio.

Domínio é se absorver num desafio novo fora do trabalho: aprender um acorde difícil, escalar uma via, cozinhar um prato que nunca deu certo. É esforço, não é sofá. E recarrega tanto quanto relaxar, com uma condição: precisa estar desconectado das metas do seu trabalho.

O nome técnico pra isso é atividade autotélica — do grego auto (em si) e telos (fim). Uma atividade feita pelo próprio prazer de fazer, cujo objetivo é ela mesma. Csikszentmihalyi, o psicólogo que cunhou o conceito de flow, descreveu assim:

> o estado em que a pessoa está tão envolvida numa atividade que nada mais parece importar; a experiência é tão prazerosa que ela continua fazendo mesmo a um custo alto, pelo simples prazer de fazer. — Csikszentmihalyi, 1990

Repare na expressão "pelo simples prazer de fazer". Assim que você cola um prêmio externo — dinheiro, curtidas, um número pra bater — a estrutura psicológica da atividade muda. Ela deixa de ser um fim em si e vira um meio pra outra coisa.

## 2. Por que a meta mata o efeito

Em 1973, três psicólogos deram canetas a crianças que adoravam desenhar. A um grupo, prometeram um certificado premiado antes de começar. Semanas depois, justamente esse grupo desenhava menos no tempo livre. As outras crianças, que desenhavam sem esperar prêmio, continuaram iguais.

Isso é o efeito de sobrejustificação (Lepper, Greene e Nisbett, 1973): quando você ganha uma recompensa externa por algo que já fazia por prazer, o cérebro reescreve o motivo. De "eu faço isso porque gosto" pra "eu faço isso pela recompensa". Tira a recompensa, e a vontade vai junto.

O mesmo acontece com métrica. Uma pesquisa de 2016 (Etkin) mostrou que, quando as pessoas passam a medir uma atividade de lazer — contar passos, páginas, quilômetros —, elas fazem mais, mas gostam menos. A atenção ao número transforma a brincadeira em trabalho. Monetizar ou fazer "pra postar" funciona parecido: adiciona uma plateia e uma cobrança onde antes não havia nenhuma.

Por baixo do capô, o mecanismo é esforço e recuperação. O trabalho liga sistemas de esforço no seu corpo — atenção, cortisol, pressão. A recuperação só termina quando esses sistemas voltam ao repouso, e isso exige a ausência de demanda com objetivo, não só a ausência do escritório. Um hobby com meta, placar ou plateia mantém esses sistemas ligados. Você trocou de cadeira, mas o corpo continua em modo trabalho.

É por isso que gente esgotada não descansa "produzindo" no fim de semana. A teoria da Conservação de Recursos (Hobfoll, 1989) descreve o estresse como perda líquida de recursos mentais. Gastar sem repor, semana após semana, é a receita do burnout. E um hobby monetizado não repõe — ele gasta de novo. Pense no fotógrafo amador que virou fotógrafo de casamento: a mesma câmera que antes esvaziava a cabeça agora vem com cliente, prazo e crítica. A atividade não mudou. A estrutura mudou tudo.

## 3. A saída não é tudo ou nada

Banir todo hobby remunerado é irreal e um pouco elitista — nem todo mundo pode escolher gastar tempo sem retorno. A meta não é pureza. É garantir que exista pelo menos um espaço na sua semana sem meta, sem métrica e sem plateia.

Antes da receita, três mal-entendidos que atrapalham.

"Então monetizar sempre estraga o hobby?" Não. O efeito de sobrejustificação é condicional — uma meta-análise de 1999 (Deci, Koestner e Ryan) mostrou que ele é forte pra recompensas tangíveis e esperadas, mas elogio e recompensas inesperadas se comportam diferente. Sociólogos chamam de "trabalho de devoto" o hobby sério que vira remunerado: ele não morre, muda de categoria. Virar profissional nem sempre mata o prazer — só deixa de ser recuperação.

"Descansar é relaxar sem fazer nada." Também não. Como você viu, domínio recupera — e domínio é esforçado. Um hobby difícil só restaura se estiver psicologicamente separado do trabalho. Não é o esforço que atrapalha, é a cobrança.

"É só ter disciplina pra separar um tempo." Aqui mora a injustiça. Sonnentag (2018) chama de paradoxo da recuperação: quem tem as maiores demandas no trabalho é quem mais precisa recarregar e, ao mesmo tempo, quem tem menos espaço pra isso. Nem sempre é força de vontade — muitas vezes é agenda e condição de vida.

E a receita pra amanhã:

:::list-icon
sparkles | **Escolha uma atividade sem placar** — uma em que não dá pra "ganhar" nem otimizar um número. Cozinhar, rabiscar, tocar por tocar.
eye-off | **Tire a plateia** — deixe o celular em outro cômodo. Não fotografe, não poste, não conte o resultado pra ninguém por enquanto.
time | **Reserve um horário fixo** — recuperação precisa de espaço protegido, não das sobras do dia. Trate como compromisso.
refresh | **Crie um ritual de virada** — um gesto que separa trabalho de lazer, como fechar o notebook, trocar de roupa ou dar uma caminhada curta. Sinaliza pro corpo que a demanda acabou.
:::

O ponto não é largar a ambição nem fingir que dinheiro não importa. É perceber que nem tudo na sua vida precisa render. Você já tem horas de sobra de esforço com objetivo no trabalho. O que a sua cabeça pede de volta é o oposto: algum tempo gasto à toa, sem nada pra mostrar no fim. O hobby mais valioso pra sua recuperação é, ironicamente, o mais inútil.

:::source[Sonnentag & Fritz, 2007 · Journal of Occupational Health Psychology 12(3) · n=930](https://doi.org/10.1037/1076-8998.12.3.204)
:::source[Headrick et al., 2023 · Journal of Business and Psychology · meta-análise, k=316, n=99.329](https://doi.org/10.1007/s10869-022-09821-3)$body_pt$,
  $body_en$Look at what happened to your hobbies. The guitar you used to play just to play became "maybe I could teach lessons." Your Sunday run now has a pace, a map, and a story post. The weekend baking turned into "I should open a little bakery." At some point, leisure became a project.

The "turn your passion into income" gospel sold a seductive idea: a hobby is only worth it if it produces something — money, followers, a personal record. Recovery psychology says the opposite. It's the useless activity — no goal, no metric, no audience — that actually recharges your mind after work.

The largest meta-analysis ever done on the topic pooled hundreds of studies and nearly 100,000 workers (Headrick et al., 2023). The verdict is blunt: relaxing and getting absorbed in something outside of work is what best predicts well-being.

:::stat{value="99,329 people" label="Across 316 recovery studies, relaxing and getting absorbed in a non-work activity predicts well-being. Merely 'switching off' cuts exhaustion — but doesn't improve your performance."}

## 1. Useless play isn't lazy play

The first mistake is thinking rest means doing nothing. It doesn't. The Recovery Experience Questionnaire (Sonnentag and Fritz, 2007) pulled apart four different ways to recharge after work: mentally switching off, relaxing, having control over your own time, and — the least obvious — mastery.

Mastery is getting absorbed in a fresh challenge outside work: nailing a hard chord, climbing a route, cooking a dish that never comes out right. It's effort, not the couch. And it restores you as much as relaxing does, on one condition: it has to be disconnected from your work goals.

The technical word for this is an autotelic activity — from the Greek auto (self) and telos (end). Something done for the sheer pleasure of doing it, where the goal is the activity itself. Csikszentmihalyi, the psychologist who coined the idea of flow, put it this way:

> the state in which people are so involved in an activity that nothing else seems to matter; the experience is so enjoyable that people will continue to do it even at great cost, for the sheer sake of doing it. — Csikszentmihalyi, 1990

Notice "for the sheer sake of doing it." The moment you bolt on an external prize — money, likes, a number to hit — the psychological structure of the activity changes. It stops being an end in itself and becomes a means to something else.

## 2. Why the goal kills the effect

In 1973, three psychologists handed markers to kids who loved to draw. One group was promised a fancy certificate before they started. Weeks later, that exact group drew less in their free time. The other kids, who drew with no reward in mind, kept going as before.

This is the overjustification effect (Lepper, Greene & Nisbett, 1973): when you get an external reward for something you already did for fun, your brain rewrites the reason. From "I do this because I enjoy it" to "I do this for the reward." Remove the reward, and the desire leaves with it.

The same thing happens with metrics. A 2016 study (Etkin) found that once people start measuring a leisure activity — counting steps, pages, miles — they do more of it but enjoy it less. Attention to the number turns play into work. Monetizing or doing it "for the post" works the same way: it adds an audience and a demand where there was none.

Under the hood, the mechanism is effort and recovery. Work switches on effort systems in your body — attention, cortisol, blood pressure. Recovery only finishes when those systems return to rest, and that requires the absence of goal-directed demand, not just the absence of the office. A hobby with a target, a scoreboard, or an audience keeps those systems running. You changed chairs, but your body is still in work mode.

That's why burned-out people don't recover by "being productive" on weekends. Conservation of Resources theory (Hobfoll, 1989) frames stress as a net loss of mental resources. Spending without refilling, week after week, is the recipe for burnout. A monetized hobby doesn't refill — it spends again. Picture the amateur photographer who became a wedding photographer: the same camera that used to empty his head now comes with a client, a deadline, and a review. The activity didn't change. The structure changed everything.

## 3. The way out isn't all-or-nothing

Banning every paid hobby is unrealistic and a little elitist — not everyone can choose to spend time with no return. The goal isn't purity. It's making sure at least one space in your week has no goal, no metric, and no audience.

Before the recipe, three misunderstandings worth clearing.

"So monetizing always ruins a hobby?" No. The overjustification effect is conditional — a 1999 meta-analysis (Deci, Koestner and Ryan) showed it's strong for tangible, expected rewards, while praise and unexpected rewards behave differently. Sociologists call a serious hobby that turns paid "devotee work": it doesn't die, it changes category. Going pro doesn't always kill the joy — it just stops being recovery.

"Rest means relaxing and doing nothing." Also no. As you saw, mastery restores you — and mastery is effortful. A demanding hobby only heals if it's psychologically separate from work. It isn't the effort that hurts, it's the pressure.

"You just need the discipline to carve out time." Here's the unfair part. Sonnentag (2018) calls it the recovery paradox: the people with the heaviest work demands need to recharge most and have the least room to do it. It isn't always willpower — often it's schedule and circumstance.

And the recipe for tomorrow:

:::list-icon
sparkles | **Pick an activity with no scoreboard** — one you can't "win" or optimize a number in. Cooking, doodling, playing for the sake of playing.
eye-off | **Remove the audience** — leave the phone in another room. Don't photograph it, don't post it, don't report the result to anyone for now.
time | **Block a fixed time** — recovery needs protected space, not the day's leftovers. Treat it like an appointment.
refresh | **Build a transition ritual** — a gesture that separates work from play, like closing the laptop, changing clothes or taking a short walk. It tells your body the demand is over.
:::

The point isn't to drop your ambition or pretend money doesn't matter. It's to notice that not everything in your life has to pay off. You already get plenty of goal-directed effort at work. What your mind asks for in return is the opposite: some time spent on nothing, with nothing to show at the end. The most valuable hobby for your recovery is, ironically, the most useless one.

:::source[Sonnentag & Fritz, 2007 · Journal of Occupational Health Psychology 12(3) · n=930](https://doi.org/10.1037/1076-8998.12.3.204)
:::source[Headrick et al., 2023 · Journal of Business and Psychology · meta-analysis, k=316, n=99,329](https://doi.org/10.1007/s10869-022-09821-3)$body_en$,
  array[
      $t$O lazer recarrega a cabeça quando não tem meta, métrica nem plateia — a utilidade é justamente o que estraga.$t$,
      $t$Monetizar o hobby ou fazê-lo "pra postar" pode religar o modo trabalho e roubar o efeito restaurador que você buscava.$t$,
      $t$Domínio — se absorver num hobby difícil — recupera tanto quanto relaxar, desde que desacoplado das metas do trabalho.$t$
    ],
  array[
      $t$Leisure recharges your mind when it has no goal, no metric, and no audience — usefulness is exactly what breaks it.$t$,
      $t$Turning a hobby into income or content can switch work mode back on and steal the recovery you were after.$t$,
      $t$Mastery — getting absorbed in a hard hobby — restores you as much as relaxing, as long as it's decoupled from work goals.$t$
    ],
  array[
      $t$Você abre o app de corrida antes de amarrar o tênis — o pace importa mais que a corrida.$t$,
      $t$Seu hobby novo já tem plano de monetização antes de você ficar bom nele.$t$,
      $t$No fim de semana você "descansa" respondendo e-mail, e volta na segunda tão cansado quanto saiu na sexta.$t$
    ],
  array[
      $t$You open the running app before you tie your shoes — the pace matters more than the run.$t$,
      $t$Your new hobby already has a monetization plan before you're even any good at it.$t$,
      $t$You "rest" on the weekend by clearing email, and Monday feels as tired as Friday did.$t$
    ],
  $t$No Perceva, Diversão é uma sub de Ofício. Diferente das outras subs, aqui o objetivo não é performar: crie tarefas de lazer sem número — "tocar violão 20 min", "desenhar sem postar" — e resista a colar uma métrica nelas. O Momentum registra só que você manteve a regularidade, sem transformar o hobby num placar. Use a sub Diversão pra proteger o tempo que recarrega, não pra virar mais um prazer em projeto.$t$,
  $t$In Perceva, Play is a sub of Craft. Unlike the other subs, the goal here isn't to perform: create leisure tasks with no number attached — "20 min of guitar," "draw without posting" — and resist bolting a metric onto them. Momentum simply notes that you kept showing up, without turning the hobby into a scoreboard. Use the Play sub to protect the time that recharges you, not to turn one more pleasure into a project.$t$,
  $t$https://doi.org/10.1037/1076-8998.12.3.204$t$,
  $t$Sonnentag & Fritz, 2007 · Journal of Occupational Health Psychology 12(3) · n=930$t$,
  $t$Sonnentag & Fritz, 2007 · Journal of Occupational Health Psychology 12(3) · n=930$t$,
  $rlog${"template_type": "explainer", "template_version": 2, "voice_principles_applied": ["Three ideas not seven: (1) useless play isn't lazy play — the four RECQ recovery experiences and mastery/autotelic, (2) why an outside goal kills the effect — overjustification + quantification + effort-recovery + COR, (3) the way out isn't all-or-nothing — three myth-busts folded into prose plus a 4-item recipe", "Prose-led: exactly 2 body cards (one :::stat thesis, one :::list-icon recipe) plus a closing :::source pair; one plain-'>' markdown blockquote for the Csikszentmihalyi flow quote", "Native parallel PT and EN, written fresh in each language, not translated", "Jargon defined on first mention in plain words: Recovery Experience Questionnaire / Questionário de Experiências de Recuperação, autotelic/autotélica (auto+telos), overjustification/sobrejustificação, Conservation of Resources/Conservação de Recursos, effort-recovery, recovery paradox, devotee work", "Concrete anchors over abstract lists: guitar-to-lessons, Sunday run with a pace, weekend baking to bakery; the 1973 drawing-kids experiment; the amateur-turned-wedding photographer", "Honest caveats flagged: overjustification is conditional (Deci, Koestner & Ryan 1999); mastery is effortful, not automatically restful; Etkin 2016 is quantification-analogous not identical to monetization; the recovery paradox (Sonnentag 2018) is structural, not willpower"], "steps": [{"id": "hook", "answer_en": "Open by showing the reader's own hobbies quietly turning into projects (guitar, run, baking) to open the curiosity gap: why does making a pleasure pay off drain it?"}, {"id": "thesis", "answer_en": "Leisure restores the mind only while it stays useless — no goal, no metric, no audience. Becomes the stat block anchored on Headrick et al. 2023's 316-study / 99,329-person meta-analysis."}, {"id": "real_definition", "answer_en": "What people think: rest = doing nothing. What it really is: one of the RECQ's four recovery experiences is mastery — absorbing, autotelic effort that recharges as long as it's decoupled from work. Contrast written as prose instead of :::compare to respect the 2-card body budget."}, {"id": "stakes", "answer_en": "Ironclad stat: Headrick et al. (2023), largest recovery meta-analysis (k=316, N=99,329) — relaxation and mastery predict well-being; detachment alone cuts exhaustion but doesn't improve performance (avoids the productivity overclaim)."}, {"id": "mechanism", "answer_en": "Overjustification (Lepper, Greene & Nisbett 1973) + quantification (Etkin 2016) + effort-recovery model (Meijman & Mulder) + Conservation of Resources (Hobfoll 1989). A goal/audience/money reintroduces goal-directed demand, keeping effort systems switched on. Concrete example: the amateur photographer who becomes a wedding photographer."}, {"id": "myth_busts", "answer_en": "Three, as prose: (1) monetizing doesn't always destroy — it's conditional (Deci, Koestner & Ryan 1999) and 'devotee work' (Stebbins) just changes category; (2) rest isn't only relaxing — mastery restores and is effortful; (3) it isn't only discipline — the recovery paradox (Sonnentag 2018) is structural."}, {"id": "recipe", "answer_en": "Four actions in :::list-icon: pick an activity with no scoreboard, remove the audience (phone away, don't post), block a fixed protected time, build a transition ritual to signal the demand is over."}], "main_points": [{"id": "1_useless_play", "what_en": "Restorative leisure is an autotelic activity — done for its own sake; it can even be demanding (mastery), it needn't be the couch.", "why_en": "One of the four RECQ recovery experiences is mastery, which recharges as much as relaxing when decoupled from work.", "how_to_know_en": "If you'd do the activity even with no one watching and nothing to gain, it's autotelic; if you only do it for the result, it isn't."}, {"id": "2_goal_kills_effect", "what_en": "Adding a goal, metric, money or audience rewrites motivation (overjustification) and keeps the effort systems switched on, blocking recovery.", "why_en": "Recovery only finishes when goal-directed demand ceases (effort-recovery); Conservation of Resources explains why spending without refilling becomes burnout.", "how_to_know_en": "If after the hobby you feel like you worked instead of rested, work mode never switched off."}, {"id": "3_ratio_not_purity", "what_en": "Protect the restorative effect by choosing activities with no scoreboard, no audience, a fixed time and a transition ritual — not by banning paid hobbies.", "why_en": "Monetization/quantification don't always destroy value (the effect is conditional), but for recovery the hobby must stay demand-free and separated from work.", "how_to_know_en": "If you feel the urge to report or post the result before you've even enjoyed the process, the audience has already crept in — time to remove it."}], "review": {"outcome": "PASSED (2 warnings)", "passes": 2, "fail_fixed_pass_1": "unsourced_stat — the 99,329-people / 316-studies headline stat (Headrick et al. 2023) was unattributed in-text and the source block cited only Sonnentag & Fritz 2007 (n=930). Fix: added '(Headrick et al., 2023)' inline in PT and EN, softened prose to 'hundreds of studies' so the exact figures live only in the stat card, and added a second :::source block for the Headrick meta-analysis (DOI 10.1007/s10869-022-09821-3).", "warns_fixed_pass_1": ["Named Etkin (2016) inline for the quantification finding.", "De-duplicated the 316/99,329 figures between prose and the stat card.", "Reformatted all list-icon items to the '**bold** — text' em-dash pattern."], "warns_fixed_pass_2": ["Named Lepper, Greene & Nisbett (1973) inline at the overjustification effect."], "warns_accepted": ["source_url metadata points to the Sonnentag & Fritz RECQ paper (the primary on-thesis framework source); the Headrick meta-analysis backing the lead figure is cited via its own in-body :::source block. One-primary-source metadata mirrors the antifragile/money materials."], "orchestrator_note": "Removed a contaminated off-topic blockquote about ultra-processed food that bled into the adopted draft from a sibling drafter agent's context, before the first review pass."}}$rlog$::jsonb
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
  signs_pt = excluded.signs_pt,
  signs_en = excluded.signs_en,
  tracking_pt = excluded.tracking_pt,
  tracking_en = excluded.tracking_en,
  source_url = excluded.source_url,
  source_label_pt = excluded.source_label_pt,
  source_label_en = excluded.source_label_en,
  reasoning_log = excluded.reasoning_log;

-- Sub associations (idempotent)
delete from public.learning_material_sub
where material_id = (select id from public.learning_material where slug = $slug$non-instrumental-play$slug$);

insert into public.learning_material_sub (material_id, sub_id) values
  ((select id from public.learning_material where slug = $slug$non-instrumental-play$slug$), $t$play$t$);
