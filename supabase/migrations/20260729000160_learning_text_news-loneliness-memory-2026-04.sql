-- migration: 20260729000160_learning_text_news-loneliness-memory-2026-04.sql
-- purpose: Big-release expand — news-loneliness-memory-2026-04 (news, bonds).
-- affected: learning_material (upsert by slug) + learning_material_sub.
--           snapshot_material_revision trigger snapshots prior state + bumps version.
-- released_at: kept (unchanged).
begin;
set local app.edited_by = 'big-release-20260729';
set local app.edit_summary = 'expand for big-release-20260729';

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
    'news-loneliness-memory-2026-04', 'news', 'bonds', $topic$news-loneliness-memory-2026-04$topic$, 4,
    $title_pt$Solidão piora memória — mas não acelera a queda$title_pt$,
    $title_en$Loneliness hurts memory — but doesn't speed up its decline$title_en$,
    $summary_pt$Estudo europeu de seis anos com 10 mil idosos calibra a narrativa alarmista de 2023 sobre solidão e demência.$summary_pt$,
    $summary_en$A six-year European study of 10k older adults calibrates the alarmist 2023 loneliness-and-dementia narrative.$summary_en$,
    $body_pt$Desde 2023, virou quase senso comum: solidão faz tão mal quanto fumar 15 cigarros por dia e empurra você pra demência. Foi assim que o Surgeon General dos Estados Unidos enquadrou o tema numa recomendação que correu o mundo. A frase pegou porque assusta — e porque parecia ciência fechada.

Um estudo europeu publicado em abril de 2026 pega uma parte dessa história e corrige com cuidado. Pessoas solitárias realmente têm memória pior. Mas a memória delas não desmorona mais rápido com o tempo. Elas começam alguns degraus abaixo — e descem a escada no mesmo ritmo de todo mundo.

## O que o estudo achou — e o que não achou

O trabalho analisou a coorte SHARE, um levantamento que acompanha a saúde de europeus com mais de 50 anos ao longo de décadas. (Coorte é só o nome de um grupo grande de pessoas seguidas pelo mesmo estudo com o passar do tempo.) Foram 10.217 adultos mais velhos, medidos em três momentos ao longo de seis anos.

A cada medição, os pesquisadores testaram a memória e cruzaram o resultado com o quanto cada pessoa se dizia solitária. Dois números importam aqui, e eles contam histórias diferentes.

O primeiro é o nível: onde a memória de alguém está hoje. Nesse, os solitários saem atrás — lembram um pouco menos de uma lista de palavras logo depois de ouvi-la, e um pouco menos ainda depois de uma pausa. A diferença é modesta, mas real.

O segundo é a taxa de declínio: a velocidade com que a memória cai ano após ano. E aqui está a manchete: essa velocidade foi praticamente igual nos dois grupos. Nas palavras dos autores, a solidão "está associada a um desempenho inicial de memória mais baixo em idosos, mas não acelera o declínio da memória ao longo do tempo".

Volte pra escada rolante. A solidão parece te colocar alguns degraus mais abaixo. O que ela não faz, segundo este estudo, é fazer você descer mais rápido.

## Por que muda o motivo, não a ação

A narrativa de 2023 vendia vínculo como apólice de seguro contra o futuro: cuide das amizades hoje pra escapar do Alzheimer daqui a vinte anos. Este estudo enfraquece exatamente esse argumento — o de que a solidão íngreme a sua curva de memória lá na frente.

Mas repare no que sobra quando você tira o medo do futuro da conta: um motivo melhor. Se a solidão mexe com a memória agora, então convivência te devolve algo agora — atenção mais afiada, encoding melhor (encoding é a capacidade do cérebro de gravar uma memória nova) e o nome de quem você acabou de conhecer ainda disponível na semana que vem. "Conviver faz bem pro seu cérebro hoje" é palpável. "Conviver talvez reduza seu risco de demência em 2046" é abstrato e fácil de empurrar com a barriga.

Agora, o que este estudo não derruba — e isso pesa tanto quanto o que ele derruba. Solidão crônica continua ligada a depressão, doença cardiovascular e morte mais cedo. A Organização Mundial da Saúde estimou, em 2025, que a fraca conexão social contribui pra cerca de 870 mil mortes por ano no mundo. Esse número não se mexe. O estudo corrige uma afirmação específica — a velocidade do declínio de memória — e deixa o resto da preocupação de saúde pública de pé.

Leia o resultado com a régua certa. É um estudo observacional: ele fotografa associações, não prova causa. A seta pode apontar ao contrário — um começo sutil de declínio cognitivo pode fazer a pessoa se retrair e se sentir mais só, e isso apareceria nos dados como "solidão piora memória". E "a velocidade foi igual" é um resultado nulo: seis anos podem ser pouco tempo pra flagrar uma diferença pequena. Não é o mesmo que provar que ela não existe.

## O que fazer com isso amanhã

Se você tinha decidido investir em vínculos por medo de demência, não largue a decisão — troque o motivo. Continue investindo, mas cobre o retorno no presente: humor mais estável, cabeça mais clara, memória mais solta nesta semana, não em 2046.

E existe um jeito de fazer isso que sobrevive ao escrutínio. Não é sobre ter muita gente por perto; é sobre regularidade e presença de verdade.

:::list-icon
people | Priorize um contato semanal fixo com alguém de quem você gosta — vale mais que cinco conversas espalhadas.
call | Ligue em vez de mandar mensagem: a voz mantém o vínculo melhor que o texto.
calendar | Marque com antecedência e no recorrente — "a gente se vê qualquer dia" quase nunca vira encontro.
happy | Cobre o retorno hoje: a atenção, o humor e a memória desta semana, não os de daqui a vinte anos.
:::

A correção aqui não deixa a solidão menos séria. Ela só aproxima o motivo: a razão pra ligar pra alguém amanhã não está a vinte anos de distância — está na semana que vem.

:::source[Venegas-Sanabria LC et al., 2026 · Aging & Mental Health · coorte SHARE n=10.217](https://doi.org/10.1080/13607863.2026.2624569)$body_pt$,
    $body_en$Since 2023 it's become almost common sense: loneliness is as bad for you as smoking 15 cigarettes a day, and it nudges you toward dementia. That's how the US Surgeon General framed it in an advisory that traveled the world. The line stuck because it's frightening — and because it sounded like settled science.

A European study published in April 2026 takes one piece of that story and corrects it, carefully. Lonely people really do have worse memory. But their memory doesn't collapse any faster over time. They start a few steps lower — and walk down the staircase at everyone else's pace.

## What the study found — and what it didn't

The work analyzed the SHARE cohort, a survey that has tracked the health of Europeans over 50 for decades. (A cohort is just a large group of people followed by the same study over time.) It covered 10,217 older adults, measured at three points across six years.

At each check, the researchers tested memory and matched it against how lonely each person said they felt. Two numbers matter here, and they tell different stories.

The first is level: where someone's memory sits today. On that, lonely people trail — they recall a bit less of a word list right after hearing it, and a bit less again after a pause. The gap is modest, but real.

The second is rate of decline: how fast memory drops year over year. And here's the headline: that speed was essentially the same in both groups. In the authors' words, loneliness "is associated with lower initial memory performance in older adults but does not accelerate the decline in memory function over time".

Back to the staircase. Loneliness seems to start you a few steps lower. What it doesn't do, per this study, is make you descend any faster.

## It changes the reason, not the action

The 2023 narrative sold connection as insurance against the future: tend your friendships now to dodge Alzheimer's in twenty years. This study weakens exactly that argument — the one where loneliness steepens your memory curve down the line.

But notice what's left when you take fear of the future out of the equation: a better reason. If loneliness touches memory now, then being around people hands something back now — sharper attention, better encoding (encoding is the brain's ability to lay down a new memory), the name of the person you just met still there next week. "Company is good for your brain today" is tangible. "Company might cut your dementia risk in 2046" is abstract and easy to keep putting off.

Now, what this study doesn't knock down — and that weighs as much as what it does. Chronic loneliness is still tied to depression, cardiovascular disease, and earlier death. In 2025 the World Health Organization estimated that weak social connection contributes to roughly 870,000 deaths a year worldwide. That number doesn't budge. The study corrects one specific claim — the speed of memory decline — and leaves the rest of the public-health case standing.

Read the result with the right ruler. It's observational: it photographs associations, it doesn't prove cause. The arrow could point the other way — a subtle early slide in cognition could make someone withdraw and feel lonelier, which would show up in the data as "loneliness worsens memory". And "the speed was the same" is a null result: six years may be too short to catch a small difference. That's not the same as proving there isn't one.

## What to do with it tomorrow

If you'd decided to invest in bonds out of fear of dementia, don't drop the decision — swap the reason. Keep investing, but collect the return in the present: steadier mood, a clearer head, memory that flows better this week, not in 2046.

And there's a way of doing it that survives scrutiny. It's not about having lots of people around; it's about regularity and real presence.

:::list-icon
people | Lock in one steady weekly contact with someone you actually like — worth more than five scattered chats.
call | Call instead of texting: the voice holds a bond better than the text.
calendar | Schedule ahead and make it recurring — "let's get together sometime" almost never happens.
happy | Collect the payoff today: this week's attention, mood, and memory, not the ones twenty years out.
:::

The correction here doesn't make loneliness less serious. It just moves the reason closer: the case for calling someone tomorrow isn't twenty years away — it's next week.

:::source[Venegas-Sanabria LC et al., 2026 · Aging & Mental Health · SHARE cohort n=10,217](https://doi.org/10.1080/13607863.2026.2624569)$body_en$,
    array[$tkpt0$Solidão está ligada a memória pior agora — mas não acelera o declínio ao longo dos anos (coorte SHARE, n=10.217, 2026).$tkpt0$, $tkpt1$Investir em vínculos compensa pelo presente (atenção e memória desta semana), não como seguro contra Alzheimer em 2046.$tkpt1$, $tkpt2$O que não mudou: solidão crônica segue ligada a depressão, doença cardiovascular e mortalidade (OMS: ~870 mil mortes/ano).$tkpt2$]::text[],
    array[$tken0$Loneliness is tied to worse memory now — but doesn't accelerate decline over the years (SHARE cohort, n=10,217, 2026).$tken0$, $tken1$Investing in bonds pays off in the present (this week's attention and memory), not as Alzheimer's insurance in 2046.$tken1$, $tken2$What didn't change: chronic loneliness is still tied to depression, cardiovascular disease, and mortality (WHO: ~870k deaths/year).$tken2$]::text[],
    $trk_pt$Esse news vive em Aprender, sob Amigos e Família (Vínculos). Conecta com tasks de "ligar pra alguém" e com o acompanhamento de regularidade de contato social — o benefício que o estudo diz chegar já nesta semana.$trk_pt$,
    $trk_en$This news lives in Learn under Friends & Family (Bonds). It connects with "call someone" tasks and with tracking of social-contact regularity — the benefit the study says arrives this very week.$trk_en$,
    $src_url$https://doi.org/10.1080/13607863.2026.2624569$src_url$,
    $src_pt$Venegas-Sanabria et al., 2026 · *Aging & Mental Health* · coorte SHARE n=10.217$src_pt$,
    $src_en$Venegas-Sanabria et al., 2026 · *Aging & Mental Health* · SHARE cohort n=10,217$src_en$,
    $rlog${"template_type":"news","template_version":2,"voice_principles_applied":["Exactly 3 idea-herói sections: (1) level-vs-rate, (2) reason-not-action, (3) what-stays-true + recipe","Prose-led: only 1 body card (list-icon recipe) plus the closing :::source; no stat/compare/callout clutter","Jargon defined on first mention: coorte/cohort, encoding, observacional/observational, resultado nulo/null result","Concrete anchor: the escada rolante / staircase metaphor makes the level-vs-slope distinction tangible; recipe is testable actions, not abstractions","Corrected the prior draft's '7 years' to 'six years' per the confirmed abstract (three SHARE waves over six years)","Honest caveats flagged: reverse causality, underpowered null (not proof of equivalence), observational design","Native PT and native EN written fresh — different idioms ('empurrar com a barriga' vs 'keep putting off'), not literal translation","Consistent second-person 'você/you' voice throughout","Effect sizes kept qualitative ('modesta/modest') per dossier flag not to state a specific word count"],"steps":[{"id":"fact","answer_pt":"Um estudo longitudinal europeu (coorte SHARE, 10.217 idosos de 65 a 94 anos, três ondas ao longo de seis anos), publicado em Aging & Mental Health em abril de 2026, achou que a solidão está associada a pior memória inicial, mas não a um declínio mais rápido.","answer_en":"A European longitudinal study (SHARE cohort, 10,217 older adults aged 65-94, three waves over six years), published in Aging & Mental Health in April 2026, found loneliness is associated with worse initial memory but not with faster decline."},{"id":"novelty","answer_pt":"Recalibra a narrativa de 2023 (recomendação do Surgeon General dos EUA) de que a solidão acelera a demência. Antes: solidão íngreme a curva de memória. Depois: solidão baixa o nível inicial, mas a velocidade da queda é indistinguível da dos demais.","answer_en":"It recalibrates the 2023 US Surgeon General framing that loneliness accelerates dementia. Before: loneliness steepens the memory curve. After: loneliness lowers the starting level, but the rate of decline is indistinguishable from everyone else's."},{"id":"evidence_status","answer_pt":"Paper peer-reviewed original em revista de gerontologia (Taylor & Francis / Informa), indexado no PubMed (PMID 41975563) — não é preprint nem press release. Caveats: observacional (causalidade reversa possível), medida de solidão autorrelatada, e 'sem diferença na velocidade' é resultado nulo, possivelmente subdimensionado em seis anos.","answer_en":"Peer-reviewed original paper in a gerontology journal (Taylor & Francis / Informa), PubMed-indexed (PMID 41975563) — not a preprint or press release. Caveats: observational (reverse causality possible), self-reported loneliness, and 'no difference in rate' is a null result, possibly underpowered over six years."},{"id":"implication","answer_pt":"Troque o motivo, não a ação: invista em vínculos pelo benefício imediato (atenção, humor, memória desta semana), não como hedge contra Alzheimer futuro. O argumento do presente é mais palpável e mais difícil de adiar.","answer_en":"Swap the reason, not the action: invest in bonds for the immediate benefit (attention, mood, memory this week), not as a hedge against future Alzheimer's. The present-tense case is more tangible and harder to postpone."},{"id":"what_stays_true","answer_pt":"Solidão crônica continua ligada a depressão, doença cardiovascular e mortalidade geral (OMS 2025: ~870 mil mortes/ano no mundo). O estudo mexe só na velocidade do declínio de memória, não no caso maior de saúde pública nem na literatura de mortalidade (Holt-Lunstad 2015).","answer_en":"Chronic loneliness stays tied to depression, cardiovascular disease, and overall mortality (WHO 2025: ~870,000 deaths/year worldwide). The study touches only the speed of memory decline, not the broader public-health case nor the mortality literature (Holt-Lunstad 2015)."},{"id":"action_or_not","answer_pt":"Agir, mas ajustando o enquadramento, não abandonando o hábito. A ação (cultivar vínculos regulares — um contato semanal fixo, ligar em vez de textar, marcar recorrente) continua valendo; o que muda é a razão: presente, não futuro distante.","answer_en":"Act, but adjust the framing, not the habit. The action (cultivating regular bonds — one steady weekly contact, calling instead of texting, scheduling recurring) still holds; what changes is the reason: present, not distant future."}],"main_points":[{"id":"1_level_not_slope","what_pt":"A solidão está ligada a uma memória pior agora (o nível), não a uma queda mais rápida depois (a taxa de declínio).","what_en":"Loneliness is tied to worse memory now (the level), not a faster fall later (the rate of decline).","why_pt":"Isso separa duas coisas que a manchete de 2023 misturava: começar atrás não é o mesmo que despencar mais rápido.","why_en":"It separates two things the 2023 headline blurred: starting behind is not the same as falling faster.","how_to_know_pt":"No SHARE (10.217 idosos, três ondas em seis anos), o nível difere entre os grupos; a velocidade do declínio, não — foi estatisticamente indistinguível."},{"id":"2_reason_not_action","what_pt":"A correção muda o motivo pra cuidar dos vínculos, não a ação: o retorno é no presente, não um seguro contra Alzheimer futuro.","what_en":"The correction changes the reason to tend your bonds, not the action: the payoff is now, not insurance against future Alzheimer's.","why_pt":"'Conviver faz bem pro seu cérebro esta semana' é palpável e difícil de adiar; 'reduz risco de demência em 2046' é abstrato.","why_en":"'Connection is good for your brain this week' is tangible and hard to postpone; 'cuts dementia risk in 2046' is abstract.","how_to_know_pt":"Se a solidão mexe com atenção e encoding agora, conexão devolve isso agora — não é preciso apostar em vinte anos pra colher o benefício."},{"id":"3_what_stays_true","what_pt":"O estudo corrige uma afirmação específica; a solidão crônica segue ligada a depressão, doença cardiovascular e morte mais cedo.","what_en":"The study corrects one specific claim; chronic loneliness stays tied to depression, cardiovascular disease, and earlier death.","why_pt":"É um estudo observacional com resultado nulo — não prova causa nem equivalência, e não derruba o caso maior de saúde pública.","why_en":"It's an observational study with a null result — it proves neither cause nor equivalence, and doesn't topple the broader public-health case.","how_to_know_pt":"A OMS estimou ~870 mil mortes por ano ligadas à fraca conexão social em 2025 — esse número não muda com este paper."}]}$rlog$::jsonb, now()
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
    released_at = learning_material.released_at
  returning id
)
  insert into public.learning_material_sub (material_id, sub_id)
  select id, 'circle' from up on conflict (material_id, sub_id) do nothing;

commit;
