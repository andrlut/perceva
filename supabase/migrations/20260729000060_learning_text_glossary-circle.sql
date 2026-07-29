-- migration: 20260729000060_learning_text_glossary-circle.sql
-- purpose: Big-release rewrite — glossary-circle (explainer, bonds).
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
    'glossary-circle', 'explainer', 'bonds', $topic$glossary-circle$topic$, 6,
    $title_pt$Quem você vê muda quanto você vive$title_pt$,
    $title_en$Who You See Changes How Long You Live$title_en$,
    $summary_pt$Conexão social é um fator de risco de saúde do tamanho do cigarro — e a chave é variedade de vínculos, não número de amigos.$summary_pt$,
    $summary_en$Social connection is a health risk factor on the scale of smoking — and the lever is variety of ties, not a friend count.$summary_en$,
    $body_pt$Você provavelmente sabe quantas horas dormiu ontem. Talvez saiba seus passos, sua pressão, seu peso. Mas quantas pessoas você conversou de verdade essa semana? Não o "oi, tudo bem" no corredor — conversa mesmo, daquelas em que alguém te escuta. Quase ninguém acompanha esse número. E ele senta na mesma prateleira de risco que todos os outros.

Em 2023, o Surgeon General dos Estados Unidos — o médico-chefe do país — publicou um alerta oficial: estar desconectado socialmente pesa na mortalidade tanto quanto fumar quinze cigarros por dia. É uma analogia de magnitude, não uma troca biológica literal — ela compara o tamanho do efeito entre fatores de risco. Mas o tamanho é esse mesmo.

A pergunta que este texto responde: como conversar com gente pode ser uma variável de saúde do mesmo tipo que colesterol ou cigarro? E o que fazer com isso.

## 1. O fator de risco que ninguém mede

:::stat[+50%]
mais chance de sobreviver ao período de acompanhamento entre quem tem laços sociais fortes. Meta-análise de 148 estudos e 308 mil pessoas (Holt-Lunstad, 2010).
:::

Esse número em destaque vem de uma meta-análise — um estudo que junta dezenas de pesquisas pra achar o sinal comum. Quem tinha vínculos sociais fortes vivia mais, e o efeito tinha o mesmo tamanho de fatores de risco que todo mundo respeita: pressão alta, obesidade, sedentarismo.

Isso não é novidade dos anos 2020. Em 1979, um estudo acompanhou quase 7 mil adultos por nove anos. Os mais isolados tiveram de duas a três vezes mais risco de morrer no período. E o que mais pesa: o efeito continuou de pé depois que os pesquisadores descontaram cigarro, bebida, peso, exercício e a saúde de base de cada um. Não era só gente já doente se afastando.

Os órgãos de saúde já traduziram isso em doença. O CDC americano associa a baixa conexão social a mais 29% de risco de doença cardíaca e mais 32% de AVC. A OMS estima que a desconexão contribua pra cerca de 871 mil mortes por ano no mundo, e que uma em cada seis pessoas viva nesse estado. São estimativas de modelo, construídas sobre a mesma literatura — não uma prova causal isolada.

Agora, a ressalva honesta: quase tudo isso é observacional. Gente mais doente ou deprimida pode se afastar primeiro, e aí causa e efeito se invertem. É justamente por isso que os estudos que descontam a saúde de base — como o de 1979 — valem mais. Ainda sobra incerteza. Mas o peso da evidência aponta numa direção só.

Como saber se isso é sobre você? Conte quantas pessoas te procuraram essa semana sem ser por obrigação ou trabalho. Se a conta deu zero ou um, você está no grupo de risco — não importa quantos seguidores tenha.

## 2. Solidão e isolamento não são a mesma coisa

Aqui está a confusão que atrapalha quase todo mundo. "Solidão" e "isolamento" viram sinônimos na boca das pessoas. E não são.

**Isolamento** é estrutural: quantas pessoas você vê, com que frequência, quantos círculos diferentes você frequenta. É contável de fora. **Solidão** é subjetiva: a angústia de se sentir sozinho, que pode aparecer até no meio de uma festa cheia. Uma é sobre a sua agenda; a outra, sobre o que você sente.

A crença popular diz que "a solidão é que mata". A ciência complica isso. Em 2013, um estudo acompanhou 6.500 ingleses com mais de 52 anos. Quando os pesquisadores separaram as duas coisas, foi o isolamento — o dado estrutural, com quem você convive — que previu a mortalidade de forma mais firme. O efeito da solidão sentida quase sumiu depois de descontar isolamento e depressão. Ou seja: sentir-se sozinho dói e importa, mas quem prevê o desfecho físico é a estrutura da sua vida social, não só o humor.

Por que estar entre pessoas mexe no corpo? Um estudo de 1997 fez algo que quase nenhum outro pôde: testou de propósito. 276 voluntários saudáveis receberam gotas no nariz com vírus vivo do resfriado. Quem tinha só um a três tipos de vínculo — digamos, cônjuge e um colega — teve 4,2 vezes mais chance de ficar resfriado do que quem tinha seis tipos ou mais. Quanto mais variada a rede, mais forte a resposta imune. E como o vírus foi dado em condições controladas, esse estudo escapa do problema da causa invertida que assombra o resto.

O neurocientista John Cacioppo, que passou a carreira estudando isso, resumiu o lado sentido:

> Quando estamos sozinhos, não só reagimos com mais intensidade aos negativos; também sentimos menos o alívio que vem dos positivos.

Guarde a distinção: isolamento é quem você vê; solidão é como você se sente. Os dois pedem soluções diferentes. E o primeiro, por mais chato que seja admitir, é o que mais mexe no relógio.

## 3. A receita é variedade, não volume

A boa notícia escondida no estudo do resfriado: o que protegeu não foi ter muitos amigos, foi ter tipos diferentes de vínculo. Cônjuge, amigo, colega, vizinho, gente do coral, do time, da igreja. **Variedade, não volume.**

Isso desmonta a corrida pelo número. Você já deve ter ouvido o "número de Dunbar": a ideia de que o ser humano só sustenta cerca de 150 relações estáveis. O próprio autor, em 1992, deu a esse número uma margem enorme — entre 100 e 230 — e o tirou de uma conta comparando cérebros de primatas, não humanos observados. É um chute educado, não um teto exato. Perseguir 150 amigos é perseguir um erro de arredondamento.

E dá pra medir que a coisa encolheu. Entre 1990 e 2021, a fatia de homens americanos com seis ou mais amigos próximos caiu de 55% pra 27%. Os que dizem não ter nenhum amigo próximo quintuplicaram. Como as duas pesquisas usaram instrumentos diferentes, trate a direção como confiável, não o número na vírgula.

O que fazer amanhã:

:::list-icon
people | Cultive tipos diferentes de vínculo, não só mais gente do mesmo grupo.
repeat | Marque um contato recorrente — mesma pessoa, mesmo dia da semana. Regularidade vence intensidade.
chatbubbles | Tenha uma conversa de verdade por dia. Cinco minutos que não sejam trabalho já contam.
call | Seja você a procurar primeiro. Quase ninguém se ofende por ser lembrado.
calendar | Entre num grupo com encontro fixo — coral, time, curso, voluntariado. O calendário faz o trabalho por você.
:::

Dois mitos pra largar no caminho. Você não precisa ser extrovertido: variedade e regularidade não exigem carisma, exigem aparecer. E não se trata só de "sentir menos solidão" — mesmo que você se sinta bem sozinho, a estrutura da sua rede continua mexendo na sua saúde.

Conexão é infraestrutura. Como músculo, você constrói antes de precisar — e ela some devagar, sem avisar, até o dia em que a conta chega. Quem tem gente por perto aos 70 quase sempre começou a cuidar disso aos 40, uma conversa de cada vez. O melhor momento pra mandar aquela mensagem que você vem adiando é agora, antes de fechar este texto.

:::source[Holt-Lunstad, Smith & Layton, 2010 · PLOS Medicine · n=308.849 (148 estudos)](https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1000316)$body_pt$,
    $body_en$You probably know how many hours you slept last night. Maybe your steps, your blood pressure, your weight. But how many people did you actually talk to this week? Not the "hey, how's it going" in the hallway — a real conversation, the kind where someone actually listens. Almost nobody tracks that number. And it sits on the same shelf of risk as all the others.

In 2023, the US Surgeon General — the country's top doctor — issued an official advisory: being socially disconnected carries a mortality weight comparable to smoking fifteen cigarettes a day. That's a magnitude analogy, not a literal biological trade — it compares the size of the effect across risk factors. But the size is real.

The question this piece answers: how can talking to people be a health variable of the same kind as cholesterol or smoking? And what to do about it.

## 1. The risk factor nobody measures

:::stat[+50%]
higher odds of surviving the follow-up period among people with strong social ties. Meta-analysis of 148 studies and 308,000 people (Holt-Lunstad, 2010).
:::

That headline number comes from a meta-analysis — a study that pools dozens of others to find the shared signal. People with strong social bonds lived longer, and the effect matched the size of risk factors everyone already respects: high blood pressure, obesity, physical inactivity.

This isn't a 2020s discovery. Back in 1979, a study followed nearly 7,000 adults for nine years. The most isolated had two to three times the risk of dying over that stretch. And here's what weighs most: the effect held after researchers subtracted smoking, drinking, weight, exercise, and each person's baseline health. It wasn't just already-sick people pulling away.

Health agencies have since translated this into disease. The US CDC links poor social connection to 29% more heart disease and 32% more stroke. The WHO estimates disconnection contributes to about 871,000 deaths a year worldwide, and that one in six people live in that state. These are modeled estimates, built on the same body of research — not a single standalone causal proof.

Now the honest caveat: almost all of this is observational. Sicker or more depressed people may withdraw first, flipping cause and effect. That's exactly why the studies that subtract baseline health — like the 1979 one — carry more weight. Some uncertainty remains. But the evidence leans hard in one direction.

How do you know this is about you? Count how many people reached out to you this week for no obligation and no work reason. If the answer is zero or one, you're in the risk group — no matter how many followers you have.

## 2. Loneliness and isolation aren't the same thing

Here's the mix-up that trips almost everyone. People use "loneliness" and "isolation" as synonyms. They're not.

**Isolation** is structural: how many people you see, how often, how many different circles you move through. It's countable from the outside. **Loneliness** is subjective: the ache of feeling alone, which can hit you in the middle of a crowded party. One is about your calendar; the other, about what you feel.

The popular belief says "it's loneliness that kills you." The science complicates that. In 2013, a study tracked 6,500 English adults over age 52. When researchers pulled the two apart, it was isolation — the structural fact of who you live among — that predicted mortality more firmly. The effect of felt loneliness nearly vanished once isolation and depression were subtracted. So: feeling alone hurts and matters, but what predicts the physical outcome is the structure of your social life, not just your mood.

Why does being around people move the body? A 1997 study did something almost no other could: it tested on purpose. 276 healthy volunteers got nasal drops carrying live cold virus. Those with only one to three types of tie — say, a spouse and one coworker — were 4.2 times more likely to catch a cold than those with six types or more. The more varied the network, the stronger the immune response. And because the virus was given under controlled conditions, this study escapes the reverse-cause problem that haunts the rest.

Neuroscientist John Cacioppo, who spent his career on this, captured the felt side:

> When we are lonely we not only react more intensely to the negatives; we also experience less of a soothing uplift from the positives.

Hold onto the distinction: isolation is who you see; loneliness is how you feel. The two need different fixes. And the first — however uncomfortable to admit — is the one that moves the clock most.

## 3. The recipe is variety, not volume

The good news hiding inside the cold study: what protected people wasn't having many friends, it was having different kinds of tie. Spouse, friend, coworker, neighbor, someone from the choir, the team, the church. **Variety, not volume.**

That dismantles the race for a number. You've probably heard of "Dunbar's number" — the idea that a human can sustain only about 150 stable relationships. The author himself, back in 1992, gave that figure a huge margin — somewhere between 100 and 230 — and drew it from a calculation comparing primate brains, not observed humans. It's an educated guess, not a hard ceiling. Chasing 150 friends is chasing a rounding error.

And you can measure that things shrank. Between 1990 and 2021, the share of American men with six or more close friends fell from 55% to 27%. Those reporting no close friends at all rose fivefold. Because the two surveys used different instruments, trust the direction, not the number after the decimal.

What to do tomorrow:

:::list-icon
people | Grow different types of tie, not just more people from the same group.
repeat | Set one recurring contact — same person, same day of the week. Regularity beats intensity.
chatbubbles | Have one real conversation a day. Five non-work minutes already count.
call | Be the one who reaches out first. Almost nobody minds being remembered.
calendar | Join a group with a standing meeting — choir, team, class, volunteering. The calendar does the work for you.
:::

Two myths to drop on the way. You don't need to be an extrovert: variety and regularity don't take charisma, they take showing up. And it isn't only about "feeling less lonely" — even if you're fine on your own, the structure of your network still moves your health.

Connection is infrastructure. Like muscle, you build it before you need it — and it fades slowly, without warning, until the day the bill arrives. People who have others around them at 70 almost always started tending it at 40, one conversation at a time. The best moment to send that message you keep putting off is now, before you close this piece.

:::source[Holt-Lunstad, Smith & Layton, 2010 · PLOS Medicine · n=308,849 (148 studies)](https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1000316)$body_en$,
    array[$tkpt0$Laços sociais fortes se associam a 50% mais chance de sobrevivência — efeito comparável a parar de fumar.$tkpt0$, $tkpt1$Isolamento (quem você vê) prevê mortalidade melhor que solidão (como você se sente); os dois pedem soluções diferentes.$tkpt1$, $tkpt2$O que protege é variedade de vínculos e contato regular, não ter 150 amigos. Marque um contato recorrente e apareça.$tkpt2$]::text[],
    array[$tken0$Strong social ties are linked to 50% higher odds of survival — an effect on par with quitting smoking.$tken0$, $tken1$Isolation (who you see) predicts mortality better than loneliness (how you feel); each needs a different fix.$tken1$, $tken2$What protects you is variety of ties and regular contact, not 150 friends. Set one recurring contact and show up.$tken2$]::text[],
    $trk_pt$No app, a sub Círculo (dimensão Vínculos) é onde isso vira prática. Toda tarefa que você marca como contato recorrente — ligar pra alguém, um encontro fixo, entrar num grupo — alimenta essa pontuação e mostra, semana após semana, se a variedade e a regularidade da sua rede estão subindo ou encolhendo. Use o Momentum a seu favor: contato social rende mais quando é constante, não quando é intenso e raro.$trk_pt$,
    $trk_en$In the app, the Circle sub (Bonds dimension) is where this becomes practice. Every task you log as recurring contact — calling someone, a standing meetup, joining a group — feeds that score and shows, week over week, whether the variety and regularity of your network are climbing or shrinking. Let Momentum work for you: social contact pays off more when it's steady, not intense and rare.$trk_en$,
    $src_url$https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1000316$src_url$,
    $src_pt$Holt-Lunstad, Smith & Layton, 2010 · PLOS Medicine · n=308.849 (148 estudos)$src_pt$,
    $src_en$Holt-Lunstad, Smith & Layton, 2010 · PLOS Medicine · n=308,849 (148 studies)$src_en$,
    $rlog${"template_type":"explainer","template_version":2,"voice_principles_applied":["Exactly 3 hero ideas (invisible risk factor / isolation vs loneliness / variety not volume) — no sub-topic sprawl.","Prose-led: 2 body cards total (one :::stat for the thesis number, one :::list-icon recipe) plus the closing :::source, and a single markdown blockquote for Cacioppo.","Jargon defined on first mention: meta-análise, isolamento vs solidão, número de Dunbar, and the '15 cigarettes' flagged as a magnitude analogy not a literal equivalence.","Native PT written first, EN written fresh (not translated) — different cadence each side.","Consistent second-person voice (você / you); no alternating with abstract subjects.","Concrete self-checks anchor abstractions: 'count who reached out this week with no obligation' and the carry-two-bags-style test replaced by a countable social check.","Honest caveats flagged inline (observational data, reverse causation, cross-survey friendship trend, modeled WHO estimate) instead of hidden.","Avoided the stat-card-plus-repeated-number redundancy: the +50% lives only in the :::stat block, never restated in prose."],"steps":[{"id":"hook","answer_pt":"Você mede sono, passos, pressão — mas ninguém mede quantas pessoas conversa de verdade. E esse número senta na mesma prateleira de risco. O Surgeon General (2023) diz: desconexão pesa como fumar 15 cigarros por dia (analogia de magnitude, não literal).","answer_en":"You track sleep, steps, blood pressure — but nobody tracks how many people they really talk to. That number sits on the same shelf of risk. The 2023 Surgeon General advisory: disconnection weighs like smoking 15 cigarettes a day (a magnitude analogy, not literal)."},{"id":"thesis","answer_pt":"Conexão social é uma variável de saúde física do tamanho do cigarro: laços fortes trazem 50% mais chance de sobrevivência (Holt-Lunstad, 2010, 148 estudos, 308 mil pessoas). Vira o stat block.","answer_en":"Social connection is a physical health variable the size of smoking: strong ties bring 50% higher survival odds (Holt-Lunstad, 2010, 148 studies, 308k people). Becomes the stat block."},{"id":"real_definition","answer_pt":"O que 'círculo' realmente é: não é número de amigos nem sentir-se menos só. São duas coisas distintas — isolamento (estrutural: quem você vê, com que frequência) e solidão (subjetiva: como você se sente). A definição vence a comum ('solidão é que mata').","answer_en":"What 'circle' really is: not a friend count nor feeling less lonely. Two distinct things — isolation (structural: who you see, how often) and loneliness (subjective: how you feel). This beats the common 'loneliness is what kills you'."},{"id":"stakes","answer_pt":"Número duro: 50% mais sobrevivência com laços fortes (Holt-Lunstad, 2010). Reforçado por Alameda 1979 (2–3x risco, descontando hábitos) e traduções do CDC/OMS (+29% cardíaco, +32% AVC, ~871 mil mortes/ano).","answer_en":"Hard number: 50% higher survival with strong ties (Holt-Lunstad, 2010). Backed by Alameda 1979 (2–3x risk, habits subtracted) and CDC/WHO translations (+29% heart disease, +32% stroke, ~871k deaths/year)."},{"id":"mechanism","answer_pt":"Mecanismo com exemplo controlado: no estudo do resfriado (Cohen 1997), 276 voluntários receberam vírus vivo no nariz; quem tinha 1–3 tipos de vínculo teve 4,2x mais resfriado que quem tinha 6+. Variedade da rede fortalece a resposta imune — e o desenho controlado escapa da causa invertida.","answer_en":"Mechanism with a controlled example: in the cold study (Cohen 1997), 276 volunteers got live virus in the nose; those with 1–3 tie types were 4.2x more likely to catch a cold than those with 6+. Network variety strengthens immune response — and the controlled design escapes reverse causation."},{"id":"myth_busts","answer_pt":"Mitos: (1) 'preciso de 150 amigos' — Dunbar tem margem 100–230 e é chute educado, não teto; (2) 'preciso ser extrovertido' — variedade e regularidade exigem aparecer, não carisma; (3) 'é só sentir menos solidão' — a estrutura da rede mexe na saúde mesmo quem se sente bem sozinho.","answer_en":"Myths: (1) 'I need 150 friends' — Dunbar carries a 100–230 margin, an educated guess not a ceiling; (2) 'I must be an extrovert' — variety and regularity take showing up, not charisma; (3) 'it's only about feeling less lonely' — network structure moves health even for those fine on their own."},{"id":"recipe","answer_pt":":::list-icon com 5 ações: cultivar tipos diferentes de vínculo; marcar um contato recorrente (mesmo dia da semana); uma conversa de verdade por dia; ser você a procurar primeiro; entrar num grupo com encontro fixo. Regularidade vence intensidade.","answer_en":":::list-icon with 5 actions: grow different tie types; set one recurring contact (same weekday); one real conversation a day; be the one who reaches out first; join a group with a standing meeting. Regularity beats intensity."}],"main_points":[{"id":"1_invisible_risk","what_pt":"Conexão social é um fator de risco físico do tamanho do cigarro: laços fortes trazem 50% mais chance de sobrevivência.","what_en":"Social connection is a physical risk factor the size of smoking: strong ties bring 50% higher survival odds.","why_pt":"Junta tese e apostas num só arco — meta-análise de 308 mil (Holt-Lunstad 2010), estudo de 1979 que descontou hábitos, e traduções do CDC/OMS em doença.","why_en":"Merges thesis and stakes into one arc — a 308k meta-analysis (Holt-Lunstad 2010), the 1979 study that subtracted habits, and CDC/WHO translations into disease.","how_to_know_pt":"Conte quantas pessoas te procuraram essa semana sem obrigação nem trabalho; zero ou um coloca você no grupo de risco."},{"id":"2_isolation_vs_loneliness","what_pt":"Isolamento (estrutural: quem você vê) e solidão (subjetiva: como se sente) são coisas diferentes — e o isolamento prevê mortalidade melhor.","what_en":"Isolation (structural: who you see) and loneliness (subjective: how you feel) are different things — and isolation predicts mortality better.","why_pt":"Steptoe 2013 mostra que a solidão perde força ao descontar isolamento; o estudo do resfriado de Cohen 1997 dá o mecanismo controlado (rede variada, imunidade mais forte).","why_en":"Steptoe 2013 shows loneliness loses power once isolation is subtracted; Cohen's 1997 cold study gives the controlled mechanism (varied network, stronger immunity).","how_to_know_pt":"Pergunte-se: minha agenda social é fina, ou eu me sinto mal apesar de ver gente? Cada caso pede uma solução diferente."},{"id":"3_variety_not_volume","what_pt":"O que protege é variedade de tipos de vínculo e contato regular, não o número de amigos.","what_en":"What protects you is variety of tie types and regular contact, not the number of friends.","why_pt":"O estudo do resfriado protegeu por variedade; o número de Dunbar (150) tem margem 100–230 e não é teto; a queda 1990–2021 mostra o encolhimento real das amizades.","why_en":"The cold study protected via variety; Dunbar's number (150) carries a 100–230 margin and isn't a ceiling; the 1990–2021 drop shows friendships really shrank.","how_to_know_pt":"Marque um contato recorrente e apareça — regularidade vence intensidade, e você não precisa ser extrovertido pra isso."}]}$rlog$::jsonb, now()
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
  select id, 'circle' from up on conflict (material_id, sub_id) do nothing;

commit;
