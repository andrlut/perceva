-- migration: 20260729000200_learning_text_summary-atomic-habits.sql
-- purpose: Big-release expand — summary-atomic-habits (summary, craft).
-- affected: learning_material (upsert by slug) + learning_material_sub.
--           snapshot_material_revision trigger snapshots prior state + bumps version.
-- released_at: kept (unchanged).
begin;
set local app.edited_by = 'big-release-20260729';
set local app.edit_summary = 'expand for big-release-20260729';

insert into public.learning_material
  (slug, type, dimension_id, topic, reading_minutes,
   title_pt, title_en, summary_pt, summary_en,
   body_pt, body_en,
   takeaways_pt, takeaways_en,
   tracking_pt, tracking_en,
   source_url, source_label_pt, source_label_en,
   reasoning_log, released_at)
values (
  'summary-atomic-habits', 'summary', 'craft', $topic$summary-atomic-habits$topic$, 6,
  $title_pt$Hábitos Atômicos — 66 dias, não 21$title_pt$,
  $title_en$Atomic Habits — 66 days, not 21$title_en$,
  $summary_pt$O que a ciência sustenta no método de James Clear — e onde a matemática é marketing.$summary_pt$,
  $summary_en$What science actually supports in James Clear's method — and where the math is marketing.$summary_en$,
  $body_pt$Em 1960, o cirurgião plástico Maxwell Maltz reparou que seus pacientes levavam "no mínimo uns 21 dias" pra se acostumar com o rosto novo. A observação de corredor virou lei de autoajuda: 21 dias pra fixar qualquer hábito. Meio século depois, alguém finalmente cronometrou de verdade.

Em 2010, Phillippa Lally (University College London) acompanhou 96 voluntários repetindo um comportamento novo no mesmo contexto por 12 semanas. A automaticidade média chegou aos 66 dias — mas o intervalo real foi de 18 a 254, dependendo da pessoa e da tarefa. Beber um copo d'água vira automático rápido; 50 abdominais, não. E o mais útil: perder um dia isolado não derrubou a curva de ninguém. "Nunca falhe duas vezes seguidas" é dos raros conselhos de hábito com respaldo experimental direto.

É essa ciência que *Hábitos Atômicos* (Avery, 2018) empacotou pro grande público — mais de 20 milhões de cópias depois. A melhor forma de ler o livro é em três camadas: o que tem evidência sólida, o que é bússola útil e o que é aritmética de marketing.

## 1. Sistemas vencem metas — e o 1% é meia-verdade

A tese que dá nome à reputação do livro é enxuta e, no geral, correta:

:::quote{author="James Clear", source="Atomic Habits (2018)"}
Você não sobe ao nível das suas metas; você cai ao nível dos seus sistemas.
:::

A meta é o resultado que você quer; o sistema é o conjunto de pequenas ações repetidas que te leva (ou não) até lá. Clear ilustra com o ciclismo britânico. Em 2003, a equipe tinha um único ouro olímpico em quase um século e zero vitórias no Tour de France. O novo diretor, Dave Brailsford, não perseguiu o pódio direto — atacou dezenas de variáveis minúsculas, melhorando cada uma cerca de 1%: o modelo do selim, a técnica de lavar as mãos pra não pegar gripe, até o travesseiro que cada atleta levava pra viagem. Ele chamou isso de "agregação de ganhos marginais". Entre 2007 e 2017 vieram 178 títulos mundiais, 66 ouros olímpicos e paralímpicos e cinco Tours em seis anos.

O problema é o slogan que Clear extrai daí: "1% melhor por dia = 37 vezes melhor em um ano". A conta está certa (1,01 elevado a 365 dá 37,8), mas ela descreve juros compostos — e comportamento humano não compõe assim. Você não fica 1% mais forte a cada treino pra sempre; existe platô, retorno decrescente, recaída. O 1% é uma boa metáfora de consistência, não a matemática do seu progresso. Fique com a ideia dos sistemas — cuide das variáveis pequenas e repetíveis — e ignore o número mágico.

## 2. As Quatro Leis — reembalagem bem-feita (e de onde ela vem)

O motor prático do livro são as Quatro Leis da Mudança de Comportamento, montadas sobre um loop de quatro tempos: deixa → desejo → resposta → recompensa. A deixa é o gatilho que sua atenção capta (o tênis de corrida na porta) e o desejo é a vontade que ele acende. A resposta é o hábito em si; a recompensa fecha o ciclo e ensina o cérebro a repetir. Pra criar um bom hábito, Clear manda tornar a deixa óbvia, o desejo atraente, a resposta fácil e a recompensa satisfatória — e inverter as quatro pra quebrar um ruim.

Aqui entra a honestidade: esse loop não é descoberta do Clear. É o ciclo deixa-rotina-recompensa que Charles Duhigg popularizou em 2012, quebrado em quatro etapas. E a neurociência embaixo vem dos gânglios da base — a região do cérebro ligada a hábitos automáticos — medidos em ratos correndo num labirinto (laboratório de Ann Graybiel, no MIT), não em imagem de gente formando hábito no dia a dia. Ir de "os neurônios do estriado de um rato disparam num padrão" até "deixe o tênis à vista" é uma analogia confiante, não uma cadeia causal testada em humanos.

O que tem base empírica firme é o outro pilar. Wendy Wood mostrou que hábito é uma associação contexto → resposta gravada pela repetição. E que cerca de 43% do comportamento diário se repete no mesmo cenário (Wood, 2019), quase sempre enquanto você pensa em outra coisa. Por isso ambiente vence força de vontade. Cada técnica famosa do livro, aliás, tem um pai acadêmico próprio. O "empilhamento de hábitos" — encaixar o hábito novo logo depois de um que você já faz — descende da ancoragem de BJ Fogg (Clear cita ele pelo nome). Já o "agrupamento de tentações" — só se permitir um prazer enquanto faz a tarefa que você adia — vem do Princípio de Premack e de um experimento de campo de Katy Milkman. A contribuição real do Clear é a síntese — feita com competência, mas num tom mais seguro do que os efeitos modestos dos artigos originais sustentam.

## 3. Identidade — a camada mais profunda (e a menos provada)

A ideia predileta do Clear é a que mais conversa com o Perceva: mudança que dura começa por quem você quer ser, não pelo que você quer alcançar. O teste dele é simples — "estou tentando parar de fumar" preserva a identidade de fumante; "eu não sou fumante" troca ela. Cada ação vira um voto na pessoa que você está se tornando. É uma heurística poderosa.

Mas é também o pilar com menos prova. Clear apoia a identidade na teoria de autoeficácia de Albert Bandura, de 1977 — uma teoria geral e respeitada sobre a crença na própria capacidade, não um estudo que isole "mudança de identidade" como a causa da durabilidade de um hábito. É a ideia mais citada do livro em conversa de bar e a menos testada em laboratório. Use como bússola, não como lei.

Os críticos batem justamente aí. Steven Phillips-Horst, no *The Guardian* (2022), acusa o gênero de autoajuda de apoiar "grandes teorias pseudocientíficas" em "lógica circular". No atacado ele tem razão: vender 20 milhões de cópias não valida nada cientificamente. No varejo, porém, *Hábitos Atômicos* converge com a ciência mais do que o crítico admite — ele só exagera no prazo e na magnitude. Se você quer sair da teoria hoje, comece por aqui:

:::list-icon
layers | Empilhe: "depois de [hábito que já tenho], faço [hábito novo]" — a deixa já existe.
timer | Regra dos 2 minutos: encolha o hábito até caber em 2 minutos ("ler uma página", não "ler 30").
gift | Agrupe tentações: só ouça aquele podcast viciante enquanto faz o que você adia.
flash | Plano se-então: "se acontecer X, faço Y" — a técnica com a evidência mais forte da área.
shield | Nunca falhe duas vezes: um dia perdido é ruído; dois seguidos viram tendência.
:::

No saldo, leia *Hábitos Atômicos* como um manual de arquitetura de contexto e de identidade — não como a física do comportamento. Ele erra a mão no relógio (66 dias, não 21) e no tamanho do efeito (as tais 37 vezes), mas os movimentos centrais — desenhar o sistema, redesenhar a deixa, votar na identidade — são os de verdade.

:::source[Hábitos Atômicos — James Clear (Avery, 2018) · ISBN 978-0-7352-1129-2](https://jamesclear.com/atomic-habits)$body_pt$,
  $body_en$In 1960, plastic surgeon Maxwell Maltz noticed his patients needed "a minimum of about 21 days" to get used to their new face. A hallway observation hardened into self-help law: 21 days to lock in any habit. Half a century later, someone finally put a stopwatch on it.

In 2010, Phillippa Lally (University College London) tracked 96 volunteers repeating a new behavior in the same context for 12 weeks. Automaticity landed at 66 days on average — but the real range ran from 18 to 254, depending on the person and the task. A glass of water goes automatic fast; 50 sit-ups, not so much. And the most useful part: missing a single day dented nobody's curve. "Never miss twice" is one of the rare habit tips with direct experimental backing.

This is the science *Atomic Habits* (Avery, 2018) packaged for a mass audience — more than 20 million copies later. The best way to read the book is in three layers: what has solid evidence, what is a useful compass, and what is marketing arithmetic.

## 1. Systems beat goals — and the 1% is a half-truth

The thesis behind the book's reputation is lean and, broadly, right:

:::quote{author="James Clear", source="Atomic Habits (2018)"}
You do not rise to the level of your goals. You fall to the level of your systems.
:::

The goal is the outcome you want; the system is the set of small, repeated actions that carries you there — or doesn't. Clear's showcase is British Cycling. In 2003 the team had a single Olympic gold in nearly a century and zero Tour de France wins. New director Dave Brailsford didn't chase the podium head-on — he attacked dozens of tiny variables, improving each by roughly 1%: the shape of the bike seat, the hand-washing technique that cut colds, even the pillow each rider took on the road. He called it "the aggregation of marginal gains". Between 2007 and 2017 came 178 world titles, 66 Olympic and Paralympic golds, and five Tours in six years.

The trouble is the slogan Clear pulls from it: "1% better every day = 37 times better in a year". The arithmetic is right (1.01 to the 365th power is 37.8), but it describes compound interest — and human behavior doesn't compound that way. You don't get 1% stronger every session forever; there are plateaus, diminishing returns, relapses. The 1% is a fine metaphor for consistency, not the math of your progress. Keep the systems idea — tend the small, repeatable variables — and drop the magic number.

## 2. The Four Laws — a good repackaging (and where it comes from)

The book's working engine is the Four Laws of Behavior Change, built on a four-beat loop: cue → craving → response → reward. The cue is the trigger your attention catches (running shoes by the door), and the craving is the wanting it lights up. The response is the habit itself; the reward closes the loop and teaches the brain to repeat. To build a good habit, Clear says make the cue obvious, the craving attractive, the response easy, and the reward satisfying — and invert all four to break a bad one.

Here's the honest part: the loop isn't Clear's discovery. It's the cue-routine-reward cycle Charles Duhigg popularized in 2012, split into four steps. And the neuroscience underneath comes from the basal ganglia — the brain region tied to automatic habits — measured in rats running a maze (Ann Graybiel's lab at MIT), not imaging of people forming habits day to day. Going from "a rat's striatal neurons fire in a pattern" to "leave your shoes in sight" is a confident analogy, not a causal chain tested in humans.

What does have firm empirical ground is the other pillar. Wendy Wood showed a habit is a context → response association carved by repetition. And that about 43% of daily behavior repeats in the same setting (Wood, 2019), usually while you're thinking about something else. That's why environment beats willpower. Each of the book's famous techniques, in fact, has its own academic parent. "Habit stacking" — bolting the new habit onto one you already do — descends from BJ Fogg's anchoring (Clear credits him by name). "Temptation bundling" — only letting yourself enjoy something while doing the task you avoid — comes from Premack's Principle and a field experiment by Katy Milkman. Clear's real contribution is the synthesis — done well, but in a more confident tone than the modest effect sizes in the original papers support.

## 3. Identity — the deepest layer (and the least proven)

Clear's favorite idea is the one that speaks most to Perceva: change that lasts starts with who you want to be, not what you want to achieve. His test is simple — "I'm trying to quit smoking" keeps the smoker's identity; "I'm not a smoker" swaps it. Every action becomes a vote for the person you're becoming. It's a powerful heuristic.

It's also the pillar with the least proof. Clear rests identity on Albert Bandura's 1977 self-efficacy theory — a respected, general theory about belief in your own capability, not a study isolating "identity change" as the cause of a habit's durability. It's the most-quoted idea from the book in casual talk and the least tested in a lab. Use it as a compass, not a law.

Critics aim right there. Steven Phillips-Horst, in *The Guardian* (2022), charges the self-help genre with propping up "pseudoscientific grand theories" on "circular logic". Wholesale, he has a point: selling 20 million copies validates nothing scientifically. Retail, though, *Atomic Habits* lines up with the science more than the critic admits — it just overreaches on timing and magnitude. If you want to leave theory behind today, start here:

:::list-icon
layers | Stack it: "after [a habit I already do], I do [the new one]" — the cue is already there.
timer | Two-minute rule: shrink the habit until it fits in two minutes ("read one page", not "read 30").
gift | Bundle temptations: only let yourself hear that addictive podcast while doing the thing you avoid.
flash | If-then plan: "if X happens, I do Y" — the technique with the strongest evidence in the field.
shield | Never miss twice: one missed day is noise; two in a row is a trend.
:::

On balance, read *Atomic Habits* as a manual of context architecture and identity framing — not the physics of behavior. It gets the clock wrong (66 days, not 21) and the effect size wrong (those 37 times), but the core moves — design the system, redesign the cue, vote for the identity — are the real, durable ones.

:::source[Atomic Habits — James Clear (Avery, 2018) · ISBN 978-0-7352-1129-2](https://jamesclear.com/atomic-habits)$body_en$,
  array[$tkpt0$Hábito novo leva em média 66 dias (variando de 18 a 254) e cresce em curva — perder um dia não zera nada; falhar duas vezes seguidas é o alerta real.$tkpt0$, $tkpt1$Cerca de 43% do seu dia roda no piloto automático disparado pelo contexto — redesenhar o ambiente rende mais que apertar a força de vontade.$tkpt1$, $tkpt2$Identidade ("cada ação é um voto") é bússola valiosa, mas o "1% ao dia = 37x" é aritmética de marketing, não lei do comportamento.$tkpt2$]::text[],
  array[$tken0$A new habit takes 66 days on average (ranging 18-254) and grows along a curve — one missed day resets nothing; missing twice in a row is the real alarm.$tken0$, $tken1$About 43% of your day runs on context-triggered autopilot — redesigning your environment beats squeezing willpower.$tken1$, $tken2$Identity ("every action is a vote") is a valuable compass, but "1% a day = 37x" is marketing arithmetic, not a law of behavior.$tken2$]::text[],
  $trk_pt$Esse resumo fica em Aprender, ligado aos subs Construir e Aprender. A ponte com o app é direta: o Momentum é a curva de automaticidade em ação — cada prática diária concluída é um voto, a barra mostra o hábito consolidando e tolera um dia perdido, igual à ciência. Escolhe um hábito minúsculo, cria a prática diária e assiste à curva subir.$trk_pt$,
  $trk_en$This summary lives in Learn, linked to the Build and Learn subs. The bridge to the app is direct: Momentum is the automaticity curve in action — every completed daily practice is a vote, the bar shows the habit consolidating, and it tolerates a missed day, just like the science. Pick one tiny habit, create the daily practice, and watch the curve climb.$trk_en$,
  $src_url$https://jamesclear.com/atomic-habits$src_url$,
  $src_pt$Hábitos Atômicos — James Clear (Avery, 2018)$src_pt$,
  $src_en$Atomic Habits — James Clear (Avery, 2018)$src_en$,
  $rlog${"template_type":"summary","voice_principles_applied":["Define jargon on first mention (basal ganglia, habit stacking, temptation bundling now glossed inline)","Sentence-average ~16 words (split the cue-craving-response-reward run-on and two ~44-word sentences)","Concrete examples over abstract lists","Native PT and native EN in parallel","All cited stats carry a year (added Wood, 2019)"],"main_points":[{"id":"1_sistemas-vencem-metas","what_pt":"Sistemas (as pequenas ações repetidas) importam mais que metas, mas o slogan '1% ao dia = 37x' descreve juros compostos, não comportamento humano.","what_en":"Systems (the small, repeated actions) matter more than goals, but the '1% a day = 37x' slogan describes compound interest, not human behavior.","why_pt":"A tese dos sistemas é sólida e útil; o número mágico é aritmética de marketing que ignora platô, retorno decrescente e recaída.","why_en":"The systems thesis is solid and useful; the magic number is marketing arithmetic that ignores plateaus, diminishing returns, and relapse.","how_to_know_pt":"Clear cita o ciclismo britânico e a agregação de ganhos marginais; a conta 1,01^365=37,8 confere, mas comportamento não compõe assim."},{"id":"2_quatro-leis","what_pt":"As Quatro Leis são uma reembalagem competente do loop de Duhigg e da ciência de Wendy Wood, BJ Fogg e Premack — não uma descoberta original.","what_en":"The Four Laws are a competent repackaging of Duhigg's loop and the science of Wendy Wood, BJ Fogg, and Premack — not an original discovery.","why_pt":"O pilar firme é o contexto: ~43% do dia roda no automático (Wood, 2019), então ambiente vence força de vontade; a neurociência de ratos é analogia, não prova em humanos.","why_en":"The firm pillar is context: ~43% of the day runs on autopilot (Wood, 2019), so environment beats willpower; the rat neuroscience is analogy, not human proof.","how_to_know_pt":"Cada técnica tem pai acadêmico: empilhamento de hábitos vem de Fogg, agrupamento de tentações de Premack/Milkman; a síntese é boa, mas o tom exagera os efeitos modestos."},{"id":"3_identidade","what_pt":"Identidade ('cada ação é um voto') é a camada mais profunda e a menos provada — use como bússola, não como lei.","what_en":"Identity ('every action is a vote') is the deepest layer and the least proven — use it as a compass, not a law.","why_pt":"Clear apoia identidade na autoeficácia de Bandura (1977), teoria geral que não isola mudança de identidade como causa da durabilidade do hábito.","why_en":"Clear rests identity on Bandura's 1977 self-efficacy theory, a general theory that doesn't isolate identity change as the cause of habit durability.","how_to_know_pt":"Os críticos (Phillips-Horst, Guardian 2022) acusam lógica circular; no varejo o livro converge com a ciência, só erra no prazo e na magnitude."}]}$rlog$::jsonb, now()
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
  released_at = learning_material.released_at;

insert into public.learning_material_sub (material_id, sub_id)
select m.id, v.sub_id
from public.learning_material m
cross join (values ('build'), ('learn')) as v(sub_id)
where m.slug = 'summary-atomic-habits'
on conflict (material_id, sub_id) do nothing;

commit;
