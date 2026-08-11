-- migration: 20260811000001_learning_material_weak-ties-job-search.sql
-- Learning material: weak-ties-job-search (explainer) — wealth / 'career' sub-gap fill.
-- Autonomous Learning publisher run (commit-direct mode, 2026-08-11).
--
-- Planner: first pick (10-second one-legged balance test, sub 'dexterity') was REJECTED by the
--   orchestrator — glossary-dexterity already covers that exact study and stat verbatim
--   ("84% mais risco... uma em cada cinco pessoas falhou"), plus the sitting-rising test, gait
--   speed, dynapenia and the Tai Chi/Cochrane recipe. Re-planned. 'career' was tied for lowest
--   coverage (n=2) and its two materials (glossary-career: job/career/calling + job crafting +
--   SDT; explainer-career-capital: passion hypothesis + career capital) never touch networking
--   or job-search mechanics. Verified by grepping body_pt/body_en for Granovetter / laços fracos
--   / weak tie / LinkedIn / indicação — only incidental hits, no overlap.
-- Researcher: 10 facts. Anchor is Rajkumar et al., Science 2022 (causal randomized experiments
--   inside LinkedIn's People You May Know, ~20M users, 5 years). Three items were explicitly
--   flagged as not-fully-verified and are marked second-hand in the body: Granovetter's 1974
--   contact-frequency percentages (out-of-print book, primary table unavailable), HR-vendor
--   referral-rate stats (dropped rather than cited as science), and the ethics controversy
--   (secondary-sourced via aggregators).
-- Reviewer: round 1 PASSED, 0 FAIL / 3 WARN (stat_redundancy, unsourced_stat, honest_caveats).
--   All 3 were fixed rather than accepted; lint clean (0 FAIL, 0 WARN) before and after.
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
  $slug$weak-ties-job-search$slug$,
  $t$explainer$t$,
  $t$wealth$t$,
  $t$laços fracos$t$,
  6,
  $t$O emprego vem do conhecido, não do amigo$t$,
  $t$Your Next Job Comes From an Acquaintance$t$,
  $t$Um experimento com 20 milhões de pessoas mostrou que quem mais leva você ao próximo emprego não é o amigo próximo nem o estranho, e sim o conhecido distante.$t$,
  $t$A 20-million-person experiment showed that the person most likely to land you a job is neither a close friend nor a stranger, but the acquaintance you barely see.$t$,
  $body_pt$Você está atrás de um emprego novo. A lista mental de quem pode ajudar trava sempre nos mesmos cinco nomes: o melhor amigo, o irmão, dois colegas do time atual, o ex-chefe com quem você ainda toma cerveja. Você manda mensagem pros cinco. Todos respondem, todos querem ajudar de verdade. E não aparece nada.

A boa vontade nunca foi o problema. Esses cinco já te contaram tudo que sabem: convivem com você, leem as mesmas coisas, conhecem as mesmas pessoas. Quando uma vaga entra no radar deles, entra no seu na mesma tarde.

Quem abre porta está em outro lugar. Durante cinco anos, um experimento rodou dentro do LinkedIn pra descobrir exatamente em qual.

:::stat[20 milhões]
Usuários do LinkedIn cujas sugestões de contato foram sorteadas ao acaso, em cinco anos de experimentos que terminaram em 600 mil empregos aceitos. Os laços moderadamente fracos geraram mais mudanças de emprego do que os amigos próximos. Rajkumar et al., Science 2022.
:::

## 1. O amigo próximo já te contou tudo que sabe

Em 1973, o sociólogo Mark Granovetter escreveu a definição que virou padrão.

> A força de um laço é uma combinação (provavelmente linear) da quantidade de tempo, da intensidade emocional, da intimidade e das trocas recíprocas que a caracterizam. — Mark Granovetter, American Journal of Sociology, 1973

Em português de gente: laço forte é o amigo de dez anos, e laço fraco é o conhecido — o ex-colega de dois empregos atrás, a pessoa que você vê uma vez por ano num evento e reconhece na hora.

O argumento dele era desconfortável. Seus amigos próximos formam um grupo fechado, e eles se conhecem entre si. Uma notícia que entra ali dá a volta em todo mundo em horas, inclusive em você. Pedir vaga a esse grupo é revirar um armário que você já revirou.

O conhecido distante vive em outro grupo, com outras conversas e outras vagas. Quase vinte anos depois de Granovetter, o sociólogo Ronald Burt deu nome ao que realmente pesa: buraco estrutural, a lacuna entre dois grupos que não se falam. Não é a fraqueza do laço que ajuda, é a posição dele. Um conhecido que trabalha no mesmo prédio dos seus amigos não serve de nada; um que trabalha num setor onde você não conhece ninguém vale por dez.

Granovetter também foi atrás dos números, num subúrbio de Boston em 1974. Entre quem conseguiu a vaga por um contato pessoal, cerca de 83% viam esse contato só de vez em quando ou raramente. O dado circula em todo lugar, mas sai de um livro esgotado que quase ninguém conferiu na fonte: 282 respostas, só de homens, num único subúrbio americano. É a fundação da teoria, não uma medida do seu mercado hoje.

## 2. Fraco demais também não funciona

A teoria passou cinquenta anos sem prova de causa. Perguntar como as pessoas conseguiram emprego mostra quem indicou quem, mas não separa o laço de quem o tem: quem acumula conhecidos distantes costuma ter mais estudo e mais mobilidade. Isolar o laço exigiria mexer na rede das pessoas de propósito — foi o que o LinkedIn fez.

Entre 2015 e 2019, a empresa rodou experimentos no "Pessoas que você talvez conheça", a lista de sugestões do site. O algoritmo passou a variar ao acaso quantos laços fortes e quantos fracos cada grupo via — sorteio de verdade, do tipo que autoriza falar em causa. Saíram dali 2 bilhões de conexões novas, 70 milhões de candidaturas e 600 mil empregos aceitos.

> Não tínhamos nenhuma evidência causal para nenhuma dessas teorias — até agora. — Sinan Aral, MIT Sloan, coautor do estudo

O resultado não foi "quanto mais fraco, melhor". Foi uma curva em U invertido: conforme o laço enfraquece, a chance de ele te render um emprego sobe, chega num pico e desce. O pico fica em torno de 10 conhecidos em comum — as pessoas que aparecem na sua lista de contatos e na dele. Abaixo disso, o laço é próximo demais e a informação é repetida. Muito acima, você é um estranho, e estranho não mexe um dedo por você.

Duas ressalvas. O estudo mediu força de laço de duas maneiras que não desenharam a mesma curva: por conhecidos em comum, o U invertido; por intensidade de conversa, quase uma reta em que menos contato é melhor. "Moderadamente fraco" é a leitura honesta das duas.

A outra é o achado mais útil e menos repetido: o efeito inverte de sinal conforme o setor. Em indústrias mais digitais, os laços fracos aumentaram a mobilidade. Em setores menos digitais, quem aumentou foram os laços fortes. Conselho de carreira que manda cultivar laços fracos sem perguntar onde você trabalha está esticando o dado.

Falta uma nota. Vinte milhões de pessoas tiveram a rede profissional e a chance real de emprego manipuladas sem consentimento específico. LinkedIn e Science alegam, segundo as reportagens do caso, que os termos de uso autorizavam isso, e a crítica de que não autorizavam é legítima.

## 3. A rede que você já tem, só que parada

A conclusão prática não é sair conhecendo gente. Você já tem os laços moderadamente fracos de que precisa. Eles só estão parados.

Num estudo da Rutgers (Levin, Walter e Murnighan, 2011), executivos de MBA pediram conselho sobre um projeto real a contatos com quem não falavam havia anos. O conselho desses laços adormecidos saiu mais novo e mais útil do que o dos contatos ativos: informação de outro lugar, com a confiança antiga intacta. Amostra pequena e específica — pista de mecanismo, não lei.

Três travas aparecem aqui. A primeira é achar que reativar contato é interesse disfarçado; a alternativa não é a pureza, é o silêncio — o conhecido que você não procurou também não soube que você estava disponível. A segunda é supor que o contato certo é o mais próximo, e a curva diz o contrário. A terceira é tratar indicação como porta de serviço: relatórios de RH colocam as indicações entre 10% e 45% das contratações, número solto demais pra virar ciência e grande demais pra ignorar.

:::list-icon
list | **Liste vinte nomes, não cinco.** Anote quem trabalhou perto de você e sumiu do seu dia a dia há mais de um ano. É a faixa que o estudo aponta.
people | **Olhe os conhecidos em comum.** O LinkedIn mostra esse número em cada perfil. Perto de dez é o alvo; dois é o seu grupo, cem é estranho.
briefcase | **Cheque o seu setor antes.** Se o seu mercado roda pouco no digital, o dado aponta pro contrário: os laços fortes são a aposta melhor.
mail | **Peça informação, não emprego.** "Como está montado o time de dados de vocês hoje?" é fácil de responder e abre conversa. "Tem vaga aí?" fecha.
calendar | **Uma pessoa por semana, não vinte num domingo.** Vinte mensagens iguais numa tarde parecem o que são.
:::

Rede não é o tamanho da sua lista. É a variedade de lugares de onde chega notícia. A distância que parecia falta de intimidade é o que torna aquele conhecido útil: ele vive num canto onde acontecem coisas que você não vê. Você não precisa de mais gente — precisa parar de perguntar só pros cinco que já te contaram tudo.

:::source[Rajkumar et al., 2022 · Science 377(6612) · experimentos randomizados no LinkedIn, n=20 milhões](https://doi.org/10.1126/science.abl4476)
:::source[Granovetter, 1973 · American Journal of Sociology 78(6) · artigo teórico fundador](https://www.jstor.org/stable/2776392)
:::source[Levin, Walter e Murnighan, 2011 · Organization Science 22(4) · reconexão de laços adormecidos](https://www.jstor.org/stable/20868904)$body_pt$,
  $body_en$You need a new job. The mental list of people who might help stalls on the same five names every time: your best friend, your brother, two teammates, the old boss you still get a beer with. You message all five. All five answer, and all five mean it. Nothing comes back.

Goodwill was never the problem. Those five already told you everything they know. They live in your week, read what you read, know who you know. A job that lands on their radar lands on yours by the same afternoon.

The people who open doors sit somewhere else. For five years, an experiment ran quietly inside LinkedIn to find out exactly where.

:::stat[20 million]
LinkedIn users whose suggested connections were randomly assigned, across five years of experiments that ended in 600,000 accepted jobs. Moderately weak ties produced more job moves than close friends did. Rajkumar et al., Science 2022.
:::

## 1. Your inner circle has nothing left to tell you

In 1973 the sociologist Mark Granovetter wrote down the definition everyone still uses.

> The strength of a tie is a (probably linear) combination of the amount of time, the emotional intensity, the intimacy (mutual confiding), and the reciprocal services which characterize the tie. — Mark Granovetter, American Journal of Sociology, 1973

In plain terms: a strong tie is the friend of ten years, and a weak tie is the acquaintance — the coworker from two jobs ago, the person you see once a year at a conference and recognize on sight.

His argument was an uncomfortable one. Your close friends form a closed loop, because they all know each other. News that lands inside it reaches everyone within hours, you included. Asking that group for leads is searching a drawer you emptied last week.

The distant acquaintance sits in a different loop, with different conversations and different openings. Nearly twenty years after Granovetter, Ronald Burt named the thing that actually carries the weight: the structural hole, the gap between two groups who never talk to each other. Weakness is not what helps. Position is. An acquaintance working in the same building as your friends is worth nothing; one working in an industry where you know nobody is worth ten.

Granovetter chased the numbers too, in a Boston suburb in 1974. Among people who landed the job through a personal contact, roughly 83% saw that contact only occasionally or rarely. The figure travels everywhere, but it comes from an out-of-print book almost nobody checks at source: 282 responses, men only, one American suburb. Foundational, not a measurement of your market.

## 2. Too weak fails just as badly

The theory went fifty years without causal proof. Asking people how they found work shows who introduced whom, but it cannot separate the tie from the person holding it: people who collect distant contacts tend to have more schooling and more mobility already. Isolating the tie would mean reshaping real networks on purpose — which is what LinkedIn did.

Between 2015 and 2019 the company ran experiments inside "People You May Know," the connection-suggestion feed. The algorithm began varying at random how many strong and how many weak ties each group of users saw there — a genuine coin flip, the kind that licenses the word cause. Out of it came 2 billion new connections, 70 million job applications and 600,000 accepted jobs.

> We don't have any causal evidence for any of these theories — until now. — Sinan Aral, MIT Sloan, co-author

The answer was not "weaker is better." It was an inverted U: as a tie weakens, its odds of producing a job climb, peak, then fall away again. The peak sits near 10 mutual connections — the people who appear in your contact list and theirs at the same time. Below that, the tie is too close and the news is a rerun. Far above it, you are a stranger, and strangers do not go out of their way.

Two caveats. The study measured tie strength two different ways that did not draw the same curve: by mutual connections, the inverted U; by messaging intensity, closer to a straight line where less contact is better. "Moderately weak" is the honest reading of both.

The other is the finding almost nobody repeats, and the one you need most. The effect flips sign by industry. In more digital industries, weak ties raised job mobility. In less digital ones, strong ties did. Career advice that tells you to cultivate weak ties without asking what you do for a living is stretching the data.

One more note. Twenty million people had their professional networks, and their real odds of being hired, altered without specific consent. LinkedIn and Science hold, according to the reporting on the case, that the terms of service allowed it, and the objection that they did not is a fair one.

## 3. The network you already have, sitting still

The practical conclusion is not "go meet more people." You almost certainly already hold the moderately weak ties you need. They are just idle.

In a Rutgers study (Levin, Walter and Murnighan, 2011), executive MBA students asked people they had not spoken to in years for advice on a live work problem. Advice from those dormant ties came back more novel and more useful than advice from current contacts: new information, with the old trust still intact. Small sample, unusual group — a clue about mechanism, not law.

Three things stall people here. The first is the fear that reaching out now looks self-serving; the alternative is not purity, it is silence — the acquaintance you never messaged also never learned you were available. The second is assuming the best contact is the closest one, which is exactly what the curve denies. The third is treating a referral as a side door: HR industry reports put referrals anywhere from 10% to 45% of hires, a number too loose to pass as science and too large to ignore.

:::list-icon
list | **Write down twenty names, not five.** People you worked near who dropped out of your week more than a year ago. That band is where the study points.
people | **Read the mutual-connections count.** LinkedIn prints it on every profile. Around ten is the target; two means they are already inside your circle, a hundred means you are a stranger.
briefcase | **Check your industry first.** If your field runs mostly offline, the data points the other way and your strong ties are the better bet.
mail | **Ask for information, not a job.** "How is your data team set up these days?" is easy to answer and starts something. "Any openings?" ends it.
calendar | **One person a week, not twenty on a Sunday.** Twenty identical messages in one afternoon read as exactly what they are.
:::

A network is not the length of your contact list. It is the number of different places your news can arrive from. The distance that felt like a lack of closeness is the very thing that makes that acquaintance useful: they live somewhere things happen that you cannot see. You do not need more people — you need to stop asking only the five who already told you everything.

:::source[Rajkumar et al., 2022 · Science 377(6612) · randomized experiments inside LinkedIn, n=20 million](https://doi.org/10.1126/science.abl4476)
:::source[Granovetter, 1973 · American Journal of Sociology 78(6) · founding theory paper](https://www.jstor.org/stable/2776392)
:::source[Levin, Walter and Murnighan, 2011 · Organization Science 22(4) · reconnecting dormant ties](https://www.jstor.org/stable/20868904)$body_en$,
  array[$tkpt0$Os seus cinco contatos mais próximos sabem das mesmas vagas que você; a informação nova mora nos conhecidos distantes, que circulam em outro grupo.$tkpt0$, $tkpt1$Nem forte nem fraco demais: a chance de um contato te render emprego é maior nos laços moderados, perto de 10 conhecidos em comum, e cai nas duas pontas.$tkpt1$, $tkpt2$O efeito depende do seu setor: laço fraco rende mais em mercados digitais, laço forte rende mais fora deles — e reativar um contato adormecido costuma valer mais do que conhecer alguém novo.$tkpt2$]::text[],
  array[$tken0$Your five closest contacts already know about the same openings you do; the new information sits with distant acquaintances, who move in a different circle.$tken0$, $tken1$Neither too strong nor too weak: a contact is most likely to produce a job in the moderate band, near 10 mutual connections, and the odds fall at both ends.$tken1$, $tken2$The effect depends on your industry — weak ties pay off in digital fields, strong ties pay off outside them — and reactivating a dormant contact usually beats meeting someone new.$tken2$]::text[],
  array[$sgpt0$A sua lista de quem poderia ajudar numa busca por emprego tem cinco nomes, e são os mesmos cinco há anos.$sgpt0$, $sgpt1$Você tem centenas de contatos no LinkedIn e falou com três deles nos últimos doze meses.$sgpt1$, $sgpt2$Você viu um ex-colega trabalhando na empresa que te interessa e não escreveu, porque depois de três anos parece que você só quer alguma coisa.$sgpt2$]::text[],
  array[$sgen0$Your list of people who could help with a job search has five names on it, and it has been the same five for years.$sgen0$, $sgen1$You have hundreds of LinkedIn connections and have spoken to three of them in the past twelve months.$sgen1$, $sgen2$You spotted an old coworker at a company you want to join and said nothing, because after three years it would look like you only want something.$sgen2$]::text[],
  $trpt$No Perceva, Carreira é uma sub de Riqueza. Transforme isso numa tarefa semanal, não num mutirão: "reativar um contato", toda terça, um nome por vez. É exatamente o formato em que o Momentum joga a seu favor, porque ele mede repetição ao longo de 30 dias, e não o volume de um domingo em que você disparou vinte mensagens iguais. Se quiser um alvo maior, abra uma Missão de oito semanas com meta de oito conversas. E olhe o histórico depois: as portas que apareceram quase nunca vêm de quem você já conhecia bem.$trpt$,
  $tren$In Perceva, Career is a sub of Wealth. Turn this into a weekly task rather than a one-off push: "reconnect with one contact," every Tuesday, one name at a time. It is exactly the shape Momentum rewards, since it tracks repetition across 30 days rather than the volume of one Sunday spent firing off twenty identical messages. If you want a bigger target, open an eight-week Missão with a goal of eight conversations. Then read your history: the doors that opened almost never came from the people you already knew well.$tren$,
  $t$https://doi.org/10.1126/science.abl4476$t$,
  $t$Rajkumar et al., 2022 · Science 377(6612) · experimentos randomizados no LinkedIn, n=20 milhões$t$,
  $t$Rajkumar et al., 2022 · Science 377(6612) · randomized experiments inside LinkedIn, n=20 million$t$,
  $rlog${"template_type":"explainer","template_version":2,"voice_principles_applied":["Três ideias, não sete: (1) por que o amigo próximo não te serve — definição de laço + buracos estruturais de Burt; (2) o experimento causal do LinkedIn e a curva em U invertido, incluindo as duas ressalvas honestas; (3) a rede adormecida que você já tem, com a receita.","Prose-led: exatamente 2 cards no corpo (1 :::stat exigido pelo template + 1 :::list-icon com a receita) mais três linhas :::source. Os myth-busts foram escritos como prosa, não como list-icon, e as duas citações usam blockquote markdown em vez de :::quote.","PT escrito primeiro e EN reescrito do zero, não traduzido: imagens diferentes (PT 'revirar um armário que você já revirou' / 'porta de serviço'; EN 'a drawer you emptied last week' / 'side door'), e cadências diferentes no hook.","Jargão definido na primeira menção: laço forte e laço fraco (com a definição operacional original de Granovetter), buraco estrutural, conhecidos em comum, curva em U invertido, laço adormecido, e 'sorteio de verdade' como tradução de randomização.","Abstração ancorada em exemplo concreto: o conhecido no mesmo prédio dos seus amigos contra o conhecido de outro setor; o número de conhecidos em comum que o LinkedIn imprime em cada perfil; a pergunta pronta ('como está montado o time de dados de vocês hoje?') contra 'tem vaga aí?'.","Caveats honestos dentro do corpo, não em rodapé: os números de 1974 são de segunda mão e vêm de amostra masculina de um único subúrbio; as duas medidas de força de laço não desenham a mesma curva; o efeito inverte por setor; os percentuais de indicação são relatórios de RH; o estudo do LinkedIn tem um problema ético em aberto.","Anti-overlap: nenhuma menção a orientação job/career/calling, job crafting, autodeterminação ou capital de carreira — os dois materiais de carreira já publicados. O material fica inteiro em mecânica de rede e busca de emprego."],"steps":[{"id":"hook","answer_pt":"Abrir na cena de sempre: você precisa de emprego, a lista mental trava nos mesmos cinco nomes, todos respondem, todos querem ajudar, e não acontece nada. A lacuna de curiosidade é o motivo — esses cinco já te contaram tudo que sabem — e a promessa é o experimento de cinco anos que rodou dentro do LinkedIn com 20 milhões de pessoas.","answer_en":"Open on the familiar scene: you need work, the mental list stalls on the same five names, everyone answers, everyone means it, and nothing comes back. The curiosity gap is the reason — those five already told you everything they know — and the promise is the five-year experiment that ran inside LinkedIn across 20 million people."},{"id":"thesis","answer_pt":"Quem te leva ao próximo emprego não é o amigo próximo nem o estranho: é o conhecido moderadamente distante, porque ele é o único que tem informação que não circula no seu grupo. Vira o bloco :::stat com os 20 milhões de usuários sorteados e os 600 mil empregos aceitos.","answer_en":"The person who moves you into your next job is neither the close friend nor the stranger: it is the moderately distant acquaintance, because they are the only one holding information that does not circulate in your own group. Becomes the :::stat block with the 20 million randomized users and the 600,000 accepted jobs."},{"id":"real_definition","answer_pt":"O que as pessoas acham: laço fraco é um contato de baixa qualidade, e o contato bom é o mais íntimo. O que ele realmente é: uma posição na rede. A definição de Granovetter (tempo, intensidade emocional, intimidade, favores trocados) entra como blockquote, e o buraco estrutural de Burt explica por que a posição pesa mais que a intimidade. Escrevi o contraste como prosa em vez de :::compare para não estourar o orçamento de 2 cards.","answer_en":"What people assume: a weak tie is a low-quality contact, and the good contact is the most intimate one. What it actually is: a position in the network. Granovetter's definition (time, emotional intensity, intimacy, reciprocal services) comes in as a blockquote, and Burt's structural hole explains why position outweighs intimacy. The contrast is written as prose instead of a :::compare so the 2-card budget holds."},{"id":"stakes","answer_pt":"Stat com peso: Rajkumar, Saint-Jacques, Bojinov, Brynjolfsson e Aral, Science 2022 — experimentos randomizados no algoritmo de sugestão do LinkedIn, 20 milhões de usuários entre 2015 e 2019, cerca de 2 bilhões de conexões novas, 70 milhões de candidaturas e 600 mil empregos aceitos. É a primeira evidência causal de uma teoria de 1973.","answer_en":"The load-bearing stat: Rajkumar, Saint-Jacques, Bojinov, Brynjolfsson and Aral, Science 2022 — randomized experiments in LinkedIn's suggestion algorithm, 20 million users between 2015 and 2019, roughly 2 billion new connections, 70 million applications and 600,000 accepted jobs. First causal evidence for a 1973 theory."},{"id":"mechanism","answer_pt":"Redundância de informação. O grupo próximo é fechado e todo mundo ali já sabe o que você sabe, então pedir vaga a ele é revirar um armário já revirado. O conhecido distante vive em outro grupo e ocupa um buraco estrutural. Mas o efeito não é monotônico: medido por conhecidos em comum, ele sobe, chega a um pico perto de 10 e cai, porque acima disso não existe relação suficiente pra alguém se mexer por você. Exemplo concreto: o conhecido que trabalha no mesmo prédio dos seus amigos não vale nada; o que trabalha num setor onde você não conhece ninguém vale por dez.","answer_en":"Information redundancy. The close group is a closed loop and everyone in it already knows what you know, so asking them for leads is searching a drawer you emptied last week. The distant acquaintance sits in another loop, over a structural hole. But the effect is not monotonic: measured by mutual connections it climbs, peaks near 10, then falls, because past that there is not enough relationship left for anyone to act on your behalf. Concrete anchor: an acquaintance in the same building as your friends is worth nothing; one in an industry where you know nobody is worth ten."},{"id":"myth_busts","answer_pt":"Três, escritos como prosa no fim da seção 3 em vez de :::list-icon, para respeitar o teto de 2 cards. (1) 'Reativar contato é interesse disfarçado' — a alternativa não é a pureza, é o silêncio, e quem você não procurou também não soube que você estava disponível. (2) 'O contato certo é o mais próximo' — a curva em U invertido diz o contrário, e o pico fica perto de 10 conhecidos em comum. (3) 'Indicação é porta de serviço' — relatórios de RH colocam as indicações entre 10% e 45% das contratações, número solto demais pra virar ciência e grande demais pra ignorar.","answer_en":"Three, written as prose at the end of section 3 rather than as a :::list-icon, to respect the 2-card ceiling. (1) 'Reaching out now looks self-serving' — the alternative is not purity, it is silence, and the person you never messaged never learned you were available. (2) 'The best contact is the closest one' — the inverted U says otherwise, peaking near 10 mutual connections. (3) 'A referral is a side door' — HR industry reports put referrals at 10% to 45% of hires, too loose to pass as science and too large to ignore."},{"id":"recipe","answer_pt":"Cinco ações em :::list-icon: listar vinte nomes de quem sumiu do seu dia a dia há mais de um ano; usar o número de conhecidos em comum que o LinkedIn mostra em cada perfil como filtro, mirando perto de dez; checar o seu setor antes, porque em mercados pouco digitais o dado aponta pros laços fortes; pedir informação específica em vez de emprego; e fazer uma reativação por semana, não vinte num domingo.","answer_en":"Five actions in a :::list-icon: write down twenty names of people who dropped out of your week over a year ago; use the mutual-connections count LinkedIn prints on every profile as the filter, aiming near ten; check your industry first, because in less digital fields the data points to strong ties; ask a specific question instead of asking for a job; and reconnect with one person a week, not twenty on a Sunday."}],"main_points":[{"id":"1_o_amigo_proximo_ja_contou","what_pt":"Laço forte e laço fraco são posições na rede, não graus de qualidade: o grupo próximo é fechado e recicla a mesma informação, enquanto o conhecido distante ocupa um buraco estrutural entre dois grupos que não se falam.","why_pt":"Porque explica por que os cinco amigos de sempre respondem rápido e não produzem nada: eles não têm informação que você já não tenha.","how_to_know_pt":"Se as vagas que os seus contatos mandam são as mesmas que você já tinha visto, o problema é redundância, não esforço.","what_en":"Strong and weak ties are positions in a network, not grades of quality: the close group is a closed loop recycling the same information, while the distant acquaintance stands over a structural hole between two groups that never talk.","why_en":"It explains why the same five friends answer fast and produce nothing: they hold no information you do not already have.","how_to_know_en":"If the openings your contacts send are ones you had already seen, the problem is redundancy, not effort."},{"id":"2_a_curva_em_u_invertido","what_pt":"O experimento randomizado do LinkedIn (n=20 milhões, 2015-2019) mostrou que a chance de um contato te render emprego sobe conforme o laço enfraquece, chega a um pico perto de 10 conhecidos em comum e cai de novo — e que o efeito inverte de sinal em setores pouco digitais.","why_pt":"É a primeira evidência causal de uma teoria de cinquenta anos, e corrige tanto o conselho de 'peça pro seu melhor amigo' quanto o de 'colecione contatos aleatórios'.","how_to_know_pt":"Abra o perfil de um contato e veja o número de conhecidos em comum: dois é o seu próprio grupo, cem é um estranho, e perto de dez é a faixa que o estudo aponta.","what_en":"LinkedIn's randomized experiment (n=20 million, 2015-2019) showed the odds of a contact producing a job rise as the tie weakens, peak near 10 mutual connections, then fall — and that the effect flips sign in less digital industries.","why_en":"It is the first causal evidence for a fifty-year-old theory, and it corrects both 'ask your best friend' and 'collect random contacts.'","how_to_know_en":"Open a contact's profile and read the mutual-connections count: two means your own circle, a hundred means a stranger, and around ten is the band the study points to."},{"id":"3_a_rede_adormecida","what_pt":"Você já tem os laços moderadamente fracos de que precisa; eles estão parados. Reconectar contatos adormecidos entrega novidade de laço fraco com a confiança que já existia (Levin, Walter e Murnighan, 2011).","why_pt":"Porque tira a tarefa do campo impossível de 'conhecer gente nova' e coloca numa rotina semanal de um nome por vez.","how_to_know_pt":"Se a sua lista de contatos tem centenas de nomes e você falou com menos de cinco no último ano, a rede não é pequena — está adormecida.","what_en":"You already hold the moderately weak ties you need; they are idle. Reconnecting dormant contacts delivers weak-tie novelty with trust that already existed (Levin, Walter and Murnighan, 2011).","why_en":"It moves the task out of the impossible 'meet new people' bucket and into a weekly routine of one name at a time.","how_to_know_en":"If your contact list runs to hundreds of names and you have spoken to fewer than five in the past year, the network is not small — it is asleep."}],"honest_caveats_flagged":["Os percentuais de Granovetter (cerca de 83% dos contatos que renderam emprego eram vistos só ocasionalmente ou raramente) são reportados de segunda mão: o dossiê registra que a tabela primária do livro Getting a Job (1974) não pôde ser conferida. O corpo diz isso explicitamente — 'sai de um livro esgotado que quase ninguém conferiu na fonte'.","A amostra de 1974 é de 282 respostas, só de homens, num único subúrbio americano, há mais de cinquenta anos. Marcada no corpo como fundação da teoria, não medida do mercado atual; o peso de evidência fica com o estudo do LinkedIn.","As duas operacionalizações de força de laço no mesmo artigo não desenham a mesma curva (conhecidos em comum = U invertido; intensidade de mensagens = quase linear). Declarado como a primeira das 'duas ressalvas' na seção 2, e 'moderadamente fraco' é apresentado como leitura das duas juntas, não como lei.","A heterogeneidade por setor (laços fracos ajudam em indústrias mais digitais, laços fortes em menos digitais) está no corpo e também na receita, como o item que manda checar o setor antes de agir. Nenhum conselho genérico de 'cultive laços fracos' é dado sem essa condição.","Os percentuais de contratação por indicação (10% a 45%) são relatórios de vendors de RH, não literatura revisada por pares. Marcados no corpo como 'número solto demais pra virar ciência'; a taxa de conversão de 30% contra 7% foi omitida de propósito.","O estudo de laços adormecidos (Levin, Walter e Murnighan, 2011) é amostra única e pequena, de executivos de MBA. Marcado no corpo como 'pista de mecanismo, não lei'.","A crítica ética ao experimento do LinkedIn (20 milhões de pessoas com a rede e a chance real de emprego manipuladas sem consentimento específico) recebe uma frase honesta na seção 2, com a defesa do LinkedIn e da Science registrada ao lado. O dossiê marca a cobertura como secundária, então o corpo não atribui a nenhum veículo.","source_url aponta para o DOI do Rajkumar 2022, que sustenta o número do :::stat; Granovetter 1973 e Levin 2011 têm blocos :::source próprios. Burt aparece nomeado no texto com o conceito, sem bloco próprio."],"editorial_deviations":["O template recomenda :::list-icon para os myth-busts e :::compare para a definição real, mas o teto prose-led é de 2 cards no corpo. Optei por gastar os dois cards no :::stat obrigatório e no :::list-icon da receita, e escrever myth-busts e contraste como prosa.","subs ficou só ['career']. O material toca manutenção de relações e serviria a 'circle', mas o enquadramento inteiro é mobilidade de emprego, a evidência é de contratação e o tracking é de Carreira — colocar em circle venderia errado."],"lint":{"tool":"tools/learning-lint/lint.mjs --draft","result":"0 FAIL, 0 WARN (pós-review)"},"review":{"round":1,"verdict":"PASS","fails":0,"warns":3,"warns_detail":[{"id":"stat_redundancy","finding_pt":"O número \"20 milhões\" aparecia na prosa do hook uma frase antes do card :::stat[20 milhões], que repetia a mesma cifra.","finding_en":"The figure \"20 million\" appeared in the hook prose one sentence before the :::stat[20 million] card restated it.","resolution":"fixed","action_pt":"A cifra saiu da frase do hook nos dois idiomas (\"um experimento rodou dentro do LinkedIn pra descobrir exatamente em qual\"). O card :::stat passa a ser o único lugar onde o número aterrissa.","action_en":"The figure was dropped from the hook sentence in both locales (\"an experiment ran quietly inside LinkedIn to find out exactly where\"). The :::stat card is now the single place the number lands."},{"id":"unsourced_stat","finding_pt":"A afirmação sobre laços adormecidos na seção 3 nomeava só a instituição (Rutgers); a citação completa só existia no :::source do rodapé.","finding_en":"The dormant-ties claim in section 3 named only the institution (Rutgers); the full citation lived only in the trailing :::source.","resolution":"fixed","action_pt":"Autores inseridos inline junto da afirmação: \"Num estudo da Rutgers (Levin, Walter e Murnighan, 2011)\".","action_en":"Authors added inline with the claim: \"In a Rutgers study (Levin, Walter and Murnighan, 2011)\"."},{"id":"honest_caveats","finding_pt":"O parágrafo sobre a ética do experimento do LinkedIn não sinalizava que a própria cobertura é de segunda mão (NYT via agregadores, primária não conferida), ao contrário do que foi feito com o dado de Granovetter 1974.","finding_en":"The LinkedIn-ethics paragraph did not flag that the ethics coverage is itself secondary-sourced (NYT via aggregators, primary not verified), unlike the Granovetter-1974 stat.","resolution":"fixed","action_pt":"Cláusula curta acrescentada: \"LinkedIn e Science alegam, segundo as reportagens que cobriram o caso, que os termos de uso autorizavam isso\".","action_en":"Short clause added: \"LinkedIn and Science hold, according to the reporting that covered the case, that the terms of service allowed it\"."}],"accepted_warns":[],"note_pt":"Os três warns foram corrigidos, nenhum foi aceito. As três ideias-herói e o orçamento de 2 cards no corpo (:::stat + :::list-icon) seguem intactos. As correções somavam +7 palavras em PT e +9 em EN, o que estourava a faixa de 950-1250 do lint; a mesma quantidade de palavras de enchimento foi cortada nas redondezas (\"de pessoas\", \"e elas\", \"bem\"), sem mexer em nenhum argumento.","note_en":"All three warns were fixed; none were accepted as-is. The three hero ideas and the 2-card body budget (:::stat + :::list-icon) are untouched. The fixes added +7 words in PT and +9 in EN, which pushed both bodies past the linter's 950-1250 band; the same number of filler words was trimmed nearby (\"of people\", \"and they\", \"a law\"), with no argument altered."}}$rlog$::jsonb
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
  signs_pt        = excluded.signs_pt,
  signs_en        = excluded.signs_en,
  tracking_pt     = excluded.tracking_pt,
  tracking_en     = excluded.tracking_en,
  source_url      = excluded.source_url,
  source_label_pt = excluded.source_label_pt,
  source_label_en = excluded.source_label_en,
  reasoning_log   = excluded.reasoning_log;

-- sub links: reset then re-insert, so the set is exactly what this migration declares.
delete from public.learning_material_sub
where material_id = (select id from public.learning_material where slug = $slug$weak-ties-job-search$slug$);

insert into public.learning_material_sub (material_id, sub_id)
select m.id, s.sub_id
from public.learning_material m
cross join (values ($sub0$career$sub0$)) as s(sub_id)
where m.slug = $slug$weak-ties-job-search$slug$
on conflict (material_id, sub_id) do nothing;
