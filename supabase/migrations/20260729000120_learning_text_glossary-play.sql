-- migration: 20260729000120_learning_text_glossary-play.sql
-- purpose: Big-release rewrite — glossary-play (explainer, craft).
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
    'glossary-play', 'explainer', 'craft', $topic$glossary-play$topic$, 6,
    $title_pt$Descanso é uma habilidade, não um prêmio$title_pt$,
    $title_en$Rest Is a Skill, Not a Prize$title_en$,
    $summary_pt$Por que uma tarde bem descansada vale mais que férias que somem antes de você desfazer a mala.$summary_pt$,
    $summary_en$Why one well-rested afternoon beats a vacation that fades before you unpack.$summary_en$,
    $body_pt$Você passa o domingo inteiro no sofá, rola o feed, assiste três episódios — e na segunda acorda tão cansado quanto estava. Se descansar fosse só parar, isso não deveria acontecer.

A ciência do descanso tem um achado incômodo: a gente sente mais "flow" — aquele estado de imersão total em que o tempo some — trabalhando do que no tempo livre. Mesmo assim, o tempo todo a gente prefere estar em outro lugar. O problema não é falta de tempo livre. É que a maioria de nós não sabe o que fazer com ele.

O que separa um descanso que recupera de um que não recupera não é a duração. É o que aquele tempo entrega pra sua cabeça. E quando os pesquisadores foram medir isso, encontraram quatro ingredientes — nenhum deles é "não fazer nada".

## Descanso não é uma coisa só

Em 2007, duas pesquisadoras criaram um questionário pra medir o que o tempo livre precisa entregar pra de fato te recuperar (Sonnentag & Fritz, 2007). Chegaram a quatro ingredientes. O primeiro é o desligamento — parar de pensar no trabalho, não só sair da mesa, mas tirar o trabalho da cabeça. É o mais pesado dos quatro. O segundo é o relaxamento — baixar a rotação, corpo e mente em marcha lenta, sem cobrança. O terceiro é a maestria — se jogar num desafio que você escolheu: aprender violão, cozinhar algo difícil, escalar. Exige esforço, e é justamente por isso que recupera. O quarto é o controle — você decidindo o que fazer com o tempo, em vez de cumprir a agenda de outra pessoa.

:::stat[26.592]
pessoas, somadas em 54 estudos, confirmaram: os quatro ingredientes preveem menos estresse e mais bem-estar — e desligar do trabalho é o que mais pesa (Bennett, Bakker & Field, 2018).
:::

Repare no terceiro ingrediente. Ele quebra a intuição de que descanso é ausência de esforço. Um hobby exigente — que te obriga a pensar, suar, prestar atenção — pode te recuperar mais do que uma tarde deitado. O sofá entrega relaxamento e nada mais. Aprender a fazer pão entrega desligamento, maestria e controle de uma vez só.

## A viagem que some antes de você desfazer a mala

A solução que todo mundo imagina pro cansaço é a mesma: umas boas férias. A ciência tem más notícias. Uma meta-análise de 2023, juntando 13 estudos, mediu as pessoas antes e depois de viagens que duravam, em média, 11 dias (Speth, Wendsche & Wegge, 2023). Sim, elas voltavam com mais ânimo, menos estresse, menos exaustão. Mas o efeito era modesto. E a satisfação com a vida — aquela avaliação geral de "minha vida está boa" — praticamente não se mexia.

Pior: o ganho evapora quase tão rápido quanto aparece. Um estudo acompanhou 54 trabalhadores numa viagem de três semanas (de Bloom et al., 2010). O bem-estar subiu, chegou ao pico por volta do oitavo dia — e voltou ao patamar de sempre em menos de uma semana depois da volta ao trabalho. A mala ainda estava no canto do quarto e o efeito já tinha ido embora.

Um estudo mais longo acompanhou 131 professores, medidos uma vez antes e três vezes depois da pausa (Kühnel & Sonnentag, 2011). O alívio do esgotamento sumia em cerca de um mês. Mas o ritmo dependia do que vinha depois. Voltar pra uma pilha de trabalho acelerava o sumiço. Continuar relaxando de vez em quando, na rotina normal, segurava o ganho por mais tempo. O que você faz na primeira semana de volta importa tanto quanto a viagem.

Aqui está a prova de que não é a viagem que cura, e sim o desligar. Um estudo comparou 81 homens convocados pra servir na reserva militar — nada de praia, nada de descanso — com 81 colegas que ficaram no trabalho (Etzion, Eden & Lapidot, 1998). Quem serviu voltou com menos estresse e menos esgotamento. Quem ficou não mudou nada. E o tamanho do alívio dependia de quanto cada um tinha, de fato, desligado a cabeça do trabalho. São estudos pequenos e, alguns, antigos — mas apontam todos na mesma direção.

A lição não é "não viaje". É que uma viagem por ano não conserta um ano inteiro de tempo livre mal usado. O que sustenta você é o descanso pequeno, frequente e de qualidade — e proteger a cabeça da enxurrada de trabalho e de ruminação assim que você volta.

## O lazer que recupera se constrói

Se a atividade em si não é o que importa, o que é? Uma revisão de 363 estudos deu o nome mais completo (Newman, Tay & Diener, 2014): cinco necessidades que o lazer precisa satisfazer pra te fazer bem. Os pesquisadores chamam de DRAMMA — desligamento, autonomia (você no comando), maestria (progredir em algo), significado (sentir que aquilo importa pra você) e afiliação (estar com gente de quem você gosta). Duas pessoas fazendo a mesma caminhada saem com recuperação diferente, dependendo de quantas dessas necessidades a caminhada tocou.

A parte boa: dá pra construir isso de propósito. Os pesquisadores chamam de "lazer ativo" ou "moldar o próprio lazer" (leisure crafting) — buscar de forma deliberada atividades com meta, aprendizado e conexão, em vez de deixar o tempo livre virar rolagem infinita. Acompanhando trabalhadores semana a semana, os pesquisadores viram que, nas semanas em que a pessoa moldava mais o lazer, ela relatava mais sentido e mais engajamento (Petrou, Bakker & van den Heuvel, 2016). E, curiosamente, é justamente nas semanas de trabalho mais pesado que as pessoas moldam mais o próprio lazer (Petrou & Bakker, 2015) — quando mais precisam.

:::list-icon
moon | Desligue de verdade: uma janela por dia sem nenhuma notificação de trabalho, não só nas férias.
barbell | Escolha um hobby que exige algo de você: aprender, praticar, progredir. O esforço é o que recupera.
people | Marque tempo pra estar com quem você gosta, sem uma segunda agenda por trás.
sparkles | Nas semanas pesadas, agende o lazer de propósito, em vez de esperar sobrar energia.
:::

Uma ressalva honesta: nem todo mundo concorda que lazer precisa de meta. Outra linha de pesquisa mostra que o tédio e o tempo ocioso, sem objetivo nenhum, alimentam a criatividade. As duas coisas podem conviver — o descanso que recupera do trabalho tende a ter direção; o vazio que gera ideia nova tende a não ter. O erro é achar que existe uma regra só.

Descansar bem é uma habilidade, não um prêmio que você ganha quando o trabalho acaba. Ninguém te ensina a fazer — mas os dados são claros sobre o formato: pequeno, frequente, com desligamento de verdade, algum desafio e gente por perto. Uma tarde assim vale mais que uma viagem que some antes de você desfazer a mala.

:::source[Newman, Tay & Diener, 2014 · Journal of Happiness Studies · revisão de 363 estudos](https://link.springer.com/article/10.1007/s10902-013-9435-x)$body_pt$,
    $body_en$You spend the whole Sunday on the couch, thumb on the feed, three episodes deep — and Monday you wake up just as tired as before. If rest were only about stopping, that shouldn't happen.

The science of rest has an uncomfortable finding: people report more "flow" — that state of total absorption where time disappears — at work than in their free time. And yet, moment to moment, they'd rather be somewhere else. The problem isn't a shortage of free time. It's that most of us don't know what to do with it.

What separates rest that restores from rest that doesn't isn't how long it lasts. It's what the time delivers to your head. When researchers went to measure that, they found four ingredients — and "doing nothing" isn't one of them.

## Rest isn't one thing

In 2007, two researchers built a questionnaire to measure what off-time has to deliver to actually recover you (Sonnentag & Fritz, 2007). They landed on four ingredients. The first is detachment — mentally letting go of work, not just leaving your desk but getting work out of your head. It's the heavyweight of the four. The second is relaxation — dropping your activation, body and mind in low gear, nothing demanded of you. The third is mastery — throwing yourself at a challenge you chose: learning guitar, cooking something hard, climbing. It takes effort, and that's exactly why it restores. The fourth is control — you deciding what to do with the time, instead of running someone else's schedule.

:::stat[26,592]
people across 54 studies confirmed it: all four ingredients predict less strain and more well-being — and detaching from work carries the most weight (Bennett, Bakker & Field, 2018).
:::

Look again at the third ingredient. It breaks the intuition that rest means the absence of effort. A demanding hobby — one that makes you think, sweat, pay attention — can restore you more than an afternoon lying down. The couch delivers relaxation and nothing else. Learning to bake bread delivers detachment, mastery, and control at once.

## The vacation that fades before you unpack

The fix everyone reaches for is the same: a good long vacation. The science has bad news. A 2023 meta-analysis pooling 13 studies measured people before and after trips that lasted, on average, 11 days (Speth, Wendsche & Wegge, 2023). Yes, they came back with more energy, less stress, less exhaustion. But the effect was modest. And life satisfaction — that overall sense that your life is going well — barely moved.

It gets worse: the gain evaporates almost as fast as it arrives. One study tracked 54 workers across a three-week trip (de Bloom et al., 2010). Well-being climbed, peaked around day eight — and was back to baseline less than a week after they returned to work. The suitcase was still in the corner of the room and the effect had already gone.

A longer study followed 131 teachers, measured once before and three times after their break (Kühnel & Sonnentag, 2011). The burnout relief faded within about a month. But the pace depended on what came next. Returning to a pile of work sped up the fade. Keeping up some relaxation in the ordinary week slowed it down. What you do in your first week back matters as much as the trip.

Here's the proof that it isn't the trip that heals, but the detaching. One study compared 81 men called up for mandatory reserve duty — no beach, no rest — with 81 colleagues who stayed at work (Etzion, Eden & Lapidot, 1998). The ones who served came back with less stress and less burnout. The ones who stayed didn't change at all. And the size of the relief tracked how far each man had actually switched his head off from work. These are small studies, some of them old — but they all point the same way.

The lesson isn't "don't travel." It's that one trip a year won't fix a whole year of badly spent free time. What holds you up is small, frequent, high-quality rest — and guarding your head from the flood of work and rumination the moment you get back.

## Restoring leisure is built on purpose

If the activity itself isn't what matters, what is? A review of 363 studies gave it the fullest name (Newman, Tay & Diener, 2014): five needs your leisure has to satisfy to do you good. The researchers call it DRAMMA — detachment, autonomy (you in charge), mastery (getting better at something), meaning (feeling it matters to you), and affiliation (being with people you like). Two people taking the same walk come away with different recovery, depending on how many of those needs the walk touched.

The good part: you can build this on purpose. Researchers call it "leisure crafting" — deliberately going after activities with a goal, learning, and connection, instead of letting free time collapse into endless scrolling. Tracking workers week by week, researchers found that in the weeks people crafted their leisure more, they reported more meaning and more engagement (Petrou, Bakker & van den Heuvel, 2016). And, tellingly, people craft their leisure most in the weeks when work is heaviest (Petrou & Bakker, 2015) — exactly when they need it.

:::list-icon
moon | Detach for real: one window a day with zero work notifications, not just on vacation.
barbell | Pick a hobby that asks something of you: learning, practice, progress. Effort is what restores.
people | Book time with people you like, with no second agenda behind it.
sparkles | On the heaviest weeks, schedule leisure on purpose instead of waiting for spare energy.
:::

One honest caveat: not everyone agrees leisure needs a goal. Another line of research shows that boredom and aimless idle time feed creativity. Both can be true — the rest that recovers you from work tends to have direction; the emptiness that sparks a new idea tends not to. The mistake is thinking there's a single rule.

Resting well is a skill, not a prize you collect when the work runs out. Nobody teaches it — but the data is clear on the shape: small, frequent, with real detachment, some challenge, and people nearby. An afternoon like that is worth more than a trip that fades before you unpack.

:::source[Newman, Tay & Diener, 2014 · Journal of Happiness Studies · review of 363 studies](https://link.springer.com/article/10.1007/s10902-013-9435-x)$body_en$,
    array[$tkpt0$Descanso que recupera tem quatro ingredientes: desligar do trabalho, relaxar, se desafiar em algo que você escolheu e controlar o próprio tempo — 'não fazer nada' não é um deles.$tkpt0$, $tkpt1$Férias ajudam pouco e por pouco tempo: o ganho é modesto e some em cerca de um mês; o que sustenta é descanso pequeno, frequente e com desligamento de verdade.$tkpt1$, $tkpt2$Bom lazer se constrói de propósito — e vale mais justamente nas semanas de trabalho pesado, quando você acha que não tem energia pra ele.$tkpt2$]::text[],
    array[$tken0$Restorative rest has four ingredients: detaching from work, relaxing, challenging yourself at something you chose, and controlling your own time — 'doing nothing' isn't one of them.$tken0$, $tken1$Vacations help little and briefly: the gain is modest and fades within about a month; what sustains you is small, frequent rest with real detachment.$tken1$, $tken2$Good leisure is built on purpose — and it pays off most in the heaviest work weeks, exactly when you think you have no energy for it.$tken2$]::text[],
    $trk_pt$No Perceva, o sub Play (dimensão Craft) é onde esse descanso ativo vira ação: registre um hobby que te exige algo, uma janela por dia sem notificação de trabalho ou um tempo com quem você gosta. Fazer isso de forma pequena e frequente é exatamente o que o Momentum recompensa — o bônus cresce quando você repete o descanso de qualidade, não quando você espera as próximas férias.$trk_pt$,
    $trk_en$In Perceva, the Play sub (Craft dimension) is where this active rest becomes an action: log a hobby that asks something of you, a daily window with no work notifications, or time with people you like. Doing it small and often is exactly what Momentum rewards — the bonus grows when you repeat quality rest, not when you wait for the next vacation.$trk_en$,
    $src_url$https://link.springer.com/article/10.1007/s10902-013-9435-x$src_url$,
    $src_pt$Newman, Tay & Diener, 2014 · Journal of Happiness Studies · revisão de 363 estudos$src_pt$,
    $src_en$Newman, Tay & Diener, 2014 · Journal of Happiness Studies · review of 363 studies$src_en$,
    $rlog${"template_type":"explainer","template_version":2,"voice_principles_applied":["Three ideas, not seven (four recovery ingredients / vacations fade / built leisure)","Prose-led — only 2 body cards (stat + list-icon) plus closing source","Native PT and native EN, parallel not translated","Define jargon on first mention (flow, DRAMMA, leisure crafting)","Concrete examples over abstract noun lists (bake bread; reserve duty)","Read-aloud test / ~16-word sentences (split the reserve-duty outlier)"],"steps":[{"id":"hook","answer_pt":"Abre com a cena do domingo perdido no sofá que não recupera, e ancora o paradoxo do 'flow' no trabalho. Monta a pergunta: o que separa descanso que recupera do que não recupera não é duração, é o que entrega pra cabeça.","answer_en":"Opens on the wasted Sunday couch that doesn't restore, anchors the 'flow at work' paradox, and sets the question: what separates restorative rest from empty rest isn't duration, it's what the time delivers to your head."},{"id":"idea_1_ingredientes","answer_pt":"Descanso não é uma coisa só — Sonnentag & Fritz (2007) acharam quatro ingredientes (desligar, relaxar, maestria, controle). A meta-análise de 54 estudos (Bennett, Bakker & Field, 2018) confirma o efeito. O ponto que quebra a intuição: esforço (maestria) recupera.","answer_en":"Rest isn't one thing — Sonnentag & Fritz (2007) found four ingredients (detach, relax, mastery, control), confirmed by the 54-study meta-analysis (Bennett, Bakker & Field, 2018). The counterintuitive point: effort (mastery) restores."},{"id":"idea_2_ferias","answer_pt":"Férias somem antes de desfazer a mala: efeito modesto, satisfação com a vida não se move (Speth, Wendsche & Wegge, 2023), pico no dia 8 e volta ao normal em uma semana (de Bloom et al., 2010; Kühnel & Sonnentag, 2011). A prova de que cura o desligar, não a viagem: reserva militar (Etzion, Eden & Lapidot, 1998).","answer_en":"Vacations fade before you unpack: modest effect, life satisfaction unmoved (Speth, Wendsche & Wegge, 2023), peak at day 8, back to baseline within a week (de Bloom et al., 2010; Kühnel & Sonnentag, 2011). The proof it's detaching not the trip: reserve duty (Etzion, Eden & Lapidot, 1998)."},{"id":"idea_3_lazer_ativo","answer_pt":"O lazer que recupera se constrói: DRAMMA (Newman, Tay & Diener, 2014) nomeia cinco necessidades; leisure crafting (Petrou, Bakker & van den Heuvel, 2016) mostra mais sentido nas semanas de mais crafting, e as pessoas moldam mais o lazer justamente sob carga (Petrou & Bakker, 2015). Fecha com a receita em list-icon e a ressalva honesta sobre o tédio criativo.","answer_en":"Restoring leisure is built: DRAMMA (Newman, Tay & Diener, 2014) names five needs; leisure crafting (Petrou, Bakker & van den Heuvel, 2016) shows more meaning in higher-crafting weeks, and people craft most under load (Petrou & Bakker, 2015). Closes with the list-icon recipe and the honest caveat about creative boredom."},{"id":"sources","answer_pt":"Fonte primária: Newman, Tay & Diener (2014), revisão DRAMMA de 363 estudos. Cada estudo distinto do corpo ganhou citação inline (Sonnentag & Fritz 2007; Bennett et al. 2018; Speth et al. 2023; de Bloom et al. 2010; Kühnel & Sonnentag 2011; Etzion et al. 1998; Petrou & Bakker 2015/2016), confirmados via Crossref.","answer_en":"Primary source: Newman, Tay & Diener (2014), the 363-study DRAMMA review. Every distinct study now carries an inline citation (Sonnentag & Fritz 2007; Bennett et al. 2018; Speth et al. 2023; de Bloom et al. 2010; Kühnel & Sonnentag 2011; Etzion et al. 1998; Petrou & Bakker 2015/2016), all Crossref-confirmed."}],"main_points":[{"id":"1_quatro_ingredientes","what_pt":"Descanso que recupera tem quatro ingredientes — desligar, relaxar, maestria e controle — e 'não fazer nada' não está na lista.","what_en":"Restorative rest has four ingredients — detachment, relaxation, mastery, control — and 'doing nothing' isn't on the list.","why_pt":"Porque o que recupera não é a ausência de esforço; um hobby exigente entrega desligamento, maestria e controle de uma vez.","why_en":"Because what restores isn't the absence of effort; a demanding hobby delivers detachment, mastery, and control at once.","how_to_know_pt":"Sonnentag & Fritz (2007) construíram o questionário; a meta-análise de 54 estudos e 26.592 pessoas (Bennett, Bakker & Field, 2018) confirma que os quatro preveem menos estresse."},{"id":"2_ferias_somem","what_pt":"Férias ajudam pouco e o ganho evapora rápido — em torno de um mês, mais rápido ainda se você volta pra uma pilha de trabalho.","what_en":"Vacations help little and the gain evaporates fast — within about a month, faster still if you return to a pile of work.","why_pt":"Porque não é a viagem que cura, é o desligar; quem só troca de cenário sem desligar a cabeça volta igual.","why_en":"Because it's not the trip that heals, it's the detaching; changing scenery without switching your head off changes nothing.","how_to_know_pt":"Speth et al. (2023): satisfação com a vida quase não se move. de Bloom et al. (2010) e Kühnel & Sonnentag (2011): pico e fade-out. Etzion et al. (1998): reserva militar reduz estresse sem nenhum descanso."},{"id":"3_lazer_construido","what_pt":"O lazer que recupera se constrói de propósito, com meta, aprendizado e conexão — e importa mais nas semanas de trabalho pesado.","what_en":"Restorative leisure is built on purpose, with goal, learning, and connection — and it matters most in the heaviest work weeks.","why_pt":"Porque deixar o tempo livre virar rolagem infinita não satisfaz as cinco necessidades do DRAMMA; moldar o lazer sim.","why_en":"Because letting free time collapse into endless scrolling doesn't satisfy the five DRAMMA needs; crafting your leisure does.","how_to_know_pt":"Newman, Tay & Diener (2014) nomeiam o DRAMMA em 363 estudos; Petrou, Bakker & van den Heuvel (2016) e Petrou & Bakker (2015) mostram mais sentido no crafting e mais crafting sob carga."}]}$rlog$::jsonb, now()
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
  select id, 'play' from up on conflict (material_id, sub_id) do nothing;

commit;
