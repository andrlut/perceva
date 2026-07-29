-- migration: 20260729000090_learning_text_glossary-learn.sql
-- purpose: Big-release rewrite — glossary-learn (explainer, mind).
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
    'glossary-learn', 'explainer', 'mind', $topic$glossary-learn$topic$, 7,
    $title_pt$A sensação de aprender mente$title_pt$,
    $title_en$The feeling of learning lies$title_en$,
    $summary_pt$O jeito de estudar que parece mais eficiente é quase sempre o pior — e os métodos que funcionam parecem difíceis de propósito.$summary_pt$,
    $summary_en$The way of studying that feels most efficient is almost always the worst — and the methods that work feel hard on purpose.$summary_en$,
    $body_pt$Você releu o capítulo três vezes, marca-texto na mão, e no fim tudo parecia familiar. Fechou o livro confiante. Aí veio a prova, e o que parecia sólido evaporou.

O problema não foi falta de esforço. Foi o tipo de esforço. A sensação de que você está aprendendo — aquela fluência gostosa de quando o texto já parece conhecido — é um dos piores termômetros que existem pra saber se você vai lembrar de algo daqui a uma semana.

Num experimento clássico, estudantes leram um texto e depois se dividiram em dois grupos. Um releu o texto quatro vezes. O outro leu uma vez e passou o resto do tempo tentando lembrar do conteúdo, sem olhar. Cinco minutos depois, os que releram se saíram melhor e se sentiam mais confiantes. Uma semana depois, a coisa virou: quem se testou lembrava de 61% do material; quem releu, 40%. O grupo que fez a coisa que parecia menos eficiente ganhou disparado.

## 1. A sensação de aprender mente

O psicólogo Robert Bjork deu nome a esse paradoxo: **dificuldades desejáveis**. São condições que deixam o estudo mais lento e mais trabalhoso na hora — e justamente por isso gravam mais fundo. Quando algo custa esforço pra ser lembrado, o cérebro trata como importante e reforça a memória. Quando vem fácil, ele não vê motivo pra guardar.

Três dessas dificuldades já foram medidas à exaustão. A primeira é espaçar. Uma meta-análise de 2006 juntou 317 experimentos e chegou num resultado que não deixa dúvida: distribuir o estudo ao longo do tempo bate estudar tudo de uma vez, quase sempre dobrando a retenção (Cepeda et al., 2006, Psychological Bulletin). E tem uma regra prática dentro disso — quanto mais longe a prova, maior deve ser o intervalo. Vai ser testado em uma semana? Revise no dia seguinte. Precisa lembrar daqui a um ano? Espace por meses.

A segunda é se testar em vez de reler — foi o que abriu este texto. Tentar puxar da memória, mesmo errando, ensina mais do que reencontrar a resposta pronta na página.

A terceira é misturar. Se você tem quatro tipos de problema de matemática pra praticar, o instinto manda fazer um tipo de cada vez, em bloco, até dominar. Num estudo controlado, quem praticou os tipos embaralhados foi pior durante a prática — e tirou cerca do dobro da nota num teste feito de um dia a uma semana depois (Rohrer & Taylor, 2007, Instructional Science). Embaralhar força o cérebro a escolher qual método usar, que é exatamente o que a prova (e a vida real) vai cobrar.

## 2. Seu cérebro se reconstrói — e desfaz se você parar

Tem uma imagem que ajuda a entender por que o esforço vale a pena: o cérebro adulto muda de forma física quando você aprende. Não é metáfora.

No começo dos anos 2000, pesquisadores em Londres escanearam o cérebro de taxistas. Pra tirar a licença na cidade, um taxista londrino passa anos decorando o labirinto de ruas — um exame chamado literalmente "The Knowledge". Resultado: eles tinham o hipocampo posterior visivelmente maior que o de pessoas comuns (Maguire et al., 2000, PNAS). O hipocampo é a estrutura no fundo do cérebro que forma memórias novas e organiza a navegação no espaço. E quanto mais anos de táxi, maior a região. O trabalho de decorar a cidade tinha reconstruído fisicamente aquela parte do cérebro.

Alguém pode dizer: talvez quem já nasce com hipocampo grande vire taxista. Aí entra o segundo estudo, mais esperto. Pesquisadores pegaram voluntários que nunca tinham feito malabarismo e pediram pra aprender a manter três bolas no ar por três meses. No fim, a substância cinzenta — a camada do cérebro onde ficam os corpos das células que processam informação — tinha crescido nas áreas ligadas ao movimento. Aí veio a parte reveladora: quando pararam de treinar, o crescimento encolheu de volta em poucos meses. A mudança não era um talento fixo. Era treino, e sumia quando o treino sumia.

Uma ressalva honesta: esses estudos são antigos e pequenos, com 16 a 24 pessoas. A direção do efeito — cérebro adulto muda com prática sustentada — está bem estabelecida e replicada. Os números exatos são ilustrativos, não lei.

E tem um detalhe que quase todo mundo ignora: boa parte dessa reconstrução acontece enquanto você dorme. O sono não é tempo morto — é quando o cérebro consolida o que você aprendeu, ou seja, transfere a memória fresca e frágil pra um armazenamento mais estável. Uma revisão de referência mostrou que o sono profundo cuida principalmente das memórias de fatos, e o sono REM — a fase dos sonhos, com movimento ocular rápido —, das habilidades motoras. Estudar a noite toda sem dormir é serrar o galho em que você está sentado: você corta justamente a fase em que o aprendizado gruda.

## 3. A receita — e três mitos pra jogar fora

Se dá pra resumir tudo numa frase: aprender é um verbo ativo. A maior meta-análise da área juntou 225 estudos comparando aulas expositivas com métodos ativos, em que o aluno resolve, discute e erra em vez de só ouvir. Nas turmas ativas, as notas subiram quase meio desvio-padrão e a reprovação caiu de 34% pra 22% (Freeman et al., 2014, PNAS). Quem só assistia à aula tinha 1,5 vez mais chance de rodar. Ouvir e reler são consumo. Aprender é produção.

Na prática, a receita cabe em cinco linhas:

:::list-icon
timer | Espace: várias sessões curtas ao longo dos dias batem uma maratona única.
bulb | Se teste sem olhar a resposta. Puxar da memória grava; reconhecer no papel, não.
shuffle | Misture os temas em vez de esgotar um antes de passar pro próximo.
bed | Durma depois de estudar — é no sono que o aprendizado se fixa.
trending-up | Pratique com feedback, mirando o que você ainda não domina.
:::

Essa última linha desmonta o mito mais famoso. Você já ouviu que dez mil horas te tornam expert em qualquer coisa. A pesquisa original nunca disse isso. Ela falava de **prática deliberada** — treino estruturado, com feedback constante, focado justamente nos pontos fracos — e não de horas soltas. Ericsson, o pesquisador por trás do estudo, resumiu assim:

> As diferenças individuais, mesmo entre os melhores, estão intimamente ligadas à quantidade de prática deliberada que cada um acumulou.

E mesmo isso tem limite: uma meta-análise depois mostrou que prática deliberada explica muito do desempenho em xadrez e música, mas quase nada em profissões. Horas ajudam; a qualidade delas ajuda mais; e nenhum número mágico garante nada.

Dois outros mitos merecem sumir. O primeiro é o dos "estilos de aprendizagem" — a ideia de que você é "visual", "auditivo" ou "cinestésico" e aprende melhor no seu canal. As pessoas têm preferências, sim, mas nenhum estudo sério jamais mostrou que casar a aula com o "estilo" melhora o resultado. É um dos mitos mais teimosos da educação. O segundo é o "growth mindset", a crença de que só de acreditar que você pode melhorar seu desempenho já melhora. O efeito existe, mas é bem menor do que a fama sugere — uma meta-análise com mais de 360 mil pessoas achou uma relação fraca com nota (Sisk et al., 2018, Psychological Science). Uma ressalva: os autores da ideia contestam essa leitura, e um grande estudo de campo achou efeito real, porém concentrado em alunos em dificuldade (Yeager et al., 2019, Nature). Não é mágica; é, no máximo, um empurrão pra quem está travado.

A mensagem embaixo de tudo isso é libertadora. Você não precisa de um dom, de um estilo especial ou de dez mil horas. Precisa de métodos que parecem mais difíceis porque são — espaçar, se testar, misturar, dormir — e da paciência de confiar neles mesmo quando a sensação diz que não estão funcionando. A sensação vai mentir. Os resultados, uma semana depois, não.

:::source[Roediger & Karpicke, 2006 · Psychological Science · n≈120](https://doi.org/10.1111/j.1467-9280.2006.01693.x)$body_pt$,
    $body_en$You reread the chapter three times, highlighter in hand, and by the end it all felt familiar. You closed the book confident. Then the exam came, and what felt solid had evaporated.

The problem wasn't a lack of effort. It was the kind of effort. That feeling that you're learning — the pleasant fluency of a text that already looks familiar — is one of the worst thermometers there is for whether you'll remember something a week from now.

In a classic experiment, students read a passage and then split into two groups. One group reread it four times. The other read it once and spent the rest of the time trying to recall the content, no peeking. Five minutes later, the rereaders did better and felt more confident. A week later, it flipped: the group that tested itself remembered 61% of the material; the rereaders, 40%. The group that did the thing that felt less efficient won, and it wasn't close.

## 1. The feeling of learning lies

Psychologist Robert Bjork gave this paradox a name: **desirable difficulties**. These are conditions that make studying slower and more effortful in the moment — and they lodge the material deeper precisely because of that. When something takes effort to retrieve, the brain treats it as important and reinforces the memory. When it comes easy, it sees no reason to store it.

Three of these difficulties have been measured to exhaustion. The first is spacing. A 2006 meta-analysis pooled 317 experiments and reached a verdict with no wiggle room: spreading study across time beats doing it all at once, often doubling retention (Cepeda et al., 2006, Psychological Bulletin). And there's a rule of thumb inside it — the further off the test, the wider the gap should be. Tested in a week? Review the next day. Need it a year from now? Space it by months.

The second is testing yourself instead of rereading — the very thing that opened this piece. Trying to pull an answer from memory, even getting it wrong, teaches more than finding it ready-made on the page.

The third is mixing. If you have four types of math problem to practice, instinct says do one type at a time, in a block, until you own it. In a controlled study, students who practiced the types shuffled did worse during practice — and scored about twice as high on a test given a day to a week later (Rohrer & Taylor, 2007, Instructional Science). Shuffling forces the brain to choose which method fits, which is exactly what the exam (and real life) will demand.

## 2. Your brain rebuilds itself — and undoes it if you stop

Here's an image that explains why the effort pays off: the adult brain physically changes when you learn. Not a metaphor.

In the early 2000s, researchers in London scanned the brains of taxi drivers. To earn a license in that city, a London cabbie spends years memorizing its maze of streets — an exam literally called "The Knowledge." The finding: they had a visibly larger posterior hippocampus than ordinary people (Maguire et al., 2000, PNAS). The hippocampus is the structure deep in the brain that forms new memories and handles spatial navigation. And the more years behind the wheel, the bigger the region. The work of memorizing the city had physically rebuilt that part of the brain.

You could object: maybe people born with a big hippocampus become cabbies. That's where a cleverer second study comes in. Researchers took volunteers who had never juggled and asked them to learn a three-ball cascade over three months. By the end, their grey matter — the brain's outer layer where the cell bodies that process information sit — had grown in the regions tied to motion. Then came the revealing part: when they stopped practicing, the growth shrank back within a few months. The change wasn't a fixed talent. It was training, and it faded when the training did.

An honest caveat: these studies are old and small, with 16 to 24 people. The direction of the effect — adult brains change with sustained practice — is well established and replicated. The exact numbers are illustrative, not law.

And one detail almost everyone ignores: much of this rebuilding happens while you sleep. Sleep isn't dead time — it's when the brain consolidates what you learned, meaning it transfers the fresh, fragile memory into more stable storage. A landmark review showed that deep sleep mostly handles memories of facts, while REM sleep — the dream stage, marked by rapid eye movement — handles motor skills. Pulling an all-nighter is sawing off the branch you're sitting on: you cut out the very phase where learning sticks.

## 3. The recipe — and three myths to toss

If it all boils down to one line: learning is an active verb. The largest meta-analysis in the field pooled 225 studies comparing lectures with active methods, where the student solves, argues, and errs instead of just listening. In the active sections, scores rose nearly half a standard deviation and failure rates fell from 34% to 22% (Freeman et al., 2014, PNAS). Students who only listened were 1.5 times more likely to fail. Listening and rereading are consumption. Learning is production.

In practice, the recipe fits in five lines:

:::list-icon
timer | Space it: several short sessions across days beat one marathon.
bulb | Test yourself without peeking. Retrieval engraves; recognition doesn't.
shuffle | Mix topics instead of exhausting one before the next.
bed | Sleep after studying — it's in sleep that learning locks in.
trending-up | Practice with feedback, aiming at what you haven't mastered yet.
:::

That last line dismantles the most famous myth. You've heard that ten thousand hours make you an expert at anything. The original research never said that. It was about **deliberate practice** — structured training, with constant feedback, aimed squarely at your weak points — not loose hours. Ericsson, the researcher behind the study, put it this way:

> Individual differences, even among elite performers, are closely related to assessed amounts of deliberate practice.

And even that has a ceiling: a later meta-analysis showed deliberate practice explains a lot of performance in chess and music, but almost nothing in professions. Hours help; their quality helps more; and no magic number guarantees anything.

Two other myths deserve to go. The first is "learning styles" — the idea that you're a "visual," "auditory," or "kinesthetic" learner and do best in your own channel. People do have preferences, but no serious study has ever shown that matching a lesson to a "style" improves the outcome. It's one of education's most stubborn myths. The second is "growth mindset," the belief that simply believing you can improve already improves your performance. The effect is real, but far smaller than its reputation — a meta-analysis of over 360,000 people found only a weak link with grades (Sisk et al., 2018, Psychological Science). One caveat: the idea's authors dispute that reading, and a large field trial found a real effect, though concentrated among struggling students (Yeager et al., 2019, Nature). It's not magic; at most, it's a nudge for someone who's stuck.

The message underneath all of this is freeing. You don't need a gift, a special style, or ten thousand hours. You need methods that feel harder because they are — spacing, self-testing, mixing, sleeping — and the patience to trust them even when the feeling says they aren't working. The feeling will lie. The results, a week later, won't.

:::source[Roediger & Karpicke, 2006 · Psychological Science · n≈120](https://doi.org/10.1111/j.1467-9280.2006.01693.x)$body_en$,
    array[$tkpt0$Se teste em vez de reler: puxar da memória grava mais fundo, mesmo quando você erra — foi 61% contra 40% de retenção uma semana depois.$tkpt0$, $tkpt1$Espace e misture: sessões curtas espalhadas pelos dias e temas embaralhados batem a maratona de um bloco só, mesmo parecendo mais difícil na hora.$tkpt1$, $tkpt2$Durma depois de estudar — é no sono profundo e REM que a memória se fixa; virar a noite corta justamente a fase em que o aprendizado gruda.$tkpt2$]::text[],
    array[$tken0$Test yourself instead of rereading: pulling from memory engraves deeper, even when you get it wrong — 61% vs. 40% retention a week later.$tken0$, $tken1$Space it and mix it: short sessions spread across days and shuffled topics beat one long block, even when it feels harder in the moment.$tken1$, $tken2$Sleep after studying — deep and REM sleep lock the memory in; an all-nighter cuts out the very phase where learning sticks.$tken2$]::text[],
    $trk_pt$Este material puxa a sub Aprender. Cada sessão curta que você registra — em vez de uma maratona única — alimenta o Momentum, o bônus que cresce quando você volta ao mesmo tema com regularidade ao longo dos dias. Na prática, o app está te recompensando exatamente pelo espaçamento que a ciência aqui defende: menos tudo de uma vez, mais um pouco por dia.$trk_pt$,
    $trk_en$This piece feeds the Learn sub. Every short session you log — instead of one marathon — builds Momentum, the bonus that grows when you return to the same topic regularly across days. In practice, the app is rewarding you for exactly the spacing the science here defends: less all-at-once, more a little each day.$trk_en$,
    $src_url$https://doi.org/10.1111/j.1467-9280.2006.01693.x$src_url$,
    $src_pt$Roediger & Karpicke, 2006 · Psychological Science · n≈120$src_pt$,
    $src_en$Roediger & Karpicke, 2006 · Psychological Science · n≈120$src_en$,
    $rlog${"template_type":"explainer","template_version":2,"voice_principles_applied":["Define jargon on first mention (added REM gloss to match hipocampo, substância cinzenta, prática deliberada, dificuldades desejáveis)","Concrete examples beat abstract noun lists","Prose-led, 2 body cards max (one list-icon recipe + closing source)","Named-study attribution for every hard stat"],"steps":[{"id":"hook","answer_pt":"Abre com a cena universal de reler com marca-texto e mesmo assim esquecer na prova — ancorando o número-manchete (61% vs 40%) na prosa, sem card de stat no topo.","answer_en":"Opens with the universal scene of rereading with a highlighter and still blanking on the exam — weaving the headline stat (61% vs 40%) into prose, no top stat card."},{"id":"jargon_fix","answer_pt":"REM estava na lista de jargão especial e recebia só uma atribuição funcional (cuida das habilidades motoras). Adicionei aposto inline 'a fase dos sonhos, com movimento ocular rápido' no primeiro uso, igualando a house style dos outros termos técnicos do texto.","answer_en":"REM was on the special jargon list and got only a functional attribution (handles motor skills). Added an inline appositive 'the dream stage, marked by rapid eye movement' at first mention, matching the house style of every other technical term in the piece."},{"id":"source_attribution","answer_pt":"Cinco estatísticas duras ganharam citação inline confirmada: Cepeda et al. 2006 (espaçamento, 317 experimentos), Rohrer & Taylor 2007 (interleaving), Maguire et al. 2000 (hipocampo dos taxistas), Freeman et al. 2014 (aprendizagem ativa, 225 estudos), Sisk et al. 2018 e Yeager et al. 2019 (growth mindset).","answer_en":"Five hard stats got confirmed inline citations: Cepeda et al. 2006 (spacing, 317 experiments), Rohrer & Taylor 2007 (interleaving), Maguire et al. 2000 (taxi hippocampus), Freeman et al. 2014 (active learning, 225 studies), Sisk et al. 2018 and Yeager et al. 2019 (growth mindset)."},{"id":"bilingual_fields","answer_pt":"Confirmei/gerei takeaways_en e tracking_en paralelos aos PT — três bullets answer-first e um parágrafo nomeando a sub Aprender e o Momentum.","answer_en":"Confirmed/generated takeaways_en and tracking_en parallel to the PT — three answer-first bullets and one paragraph naming the Learn sub and Momentum."}],"main_points":[{"id":"1_desirable_difficulties","what_pt":"A fluência de estudo engana; as três dificuldades desejáveis (espaçar, se testar, misturar) parecem piores e ensinam mais.","what_en":"Study fluency deceives; the three desirable difficulties (spacing, self-testing, mixing) feel worse and teach more.","why_pt":"O cérebro só reforça o que custa esforço pra lembrar; quando vem fácil, não guarda.","why_en":"The brain only reinforces what takes effort to retrieve; when it comes easy, it doesn't store it.","how_to_know_pt":"Roediger & Karpicke 2006 (61% vs 40%), Cepeda et al. 2006 (317 experimentos), Rohrer & Taylor 2007 (dobro da nota)."},{"id":"2_brain_rebuilds","what_pt":"O cérebro adulto muda de forma física com a prática — e desfaz a mudança se você para; o sono é onde ela se fixa.","what_en":"The adult brain physically changes with practice — and undoes it if you stop; sleep is where it locks in.","why_pt":"Prática sustentada é o que reconstrói; sem sono (profundo e REM), a memória fresca não consolida.","why_en":"Sustained practice is what rebuilds; without sleep (deep and REM), fresh memory doesn't consolidate.","how_to_know_pt":"Maguire et al. 2000 (hipocampo dos taxistas), estudo de malabarismo (substância cinzenta que cresce e encolhe), revisão de consolidação no sono."},{"id":"3_recipe_and_myths","what_pt":"A receita ativa (espaçar, se testar, misturar, dormir, praticar com feedback) mais o descarte de três mitos: 10 mil horas, estilos de aprendizagem, growth mindset.","what_en":"The active recipe (space, self-test, mix, sleep, practice with feedback) plus tossing three myths: 10,000 hours, learning styles, growth mindset.","why_pt":"Aprender é produção, não consumo; os mitos populares ou nunca disseram o que viraram, ou têm efeito bem menor que a fama.","why_en":"Learning is production, not consumption; the popular myths either never said what they became, or have a far smaller effect than their reputation.","how_to_know_pt":"Freeman et al. 2014 (225 estudos, reprovação 34%→22%), Ericsson (prática deliberada), Sisk et al. 2018 e Yeager et al. 2019 (growth mindset)."}]}$rlog$::jsonb, now()
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
  select id, 'learn' from up on conflict (material_id, sub_id) do nothing;

commit;
