-- migration: 20260729000240_learning_text_summary-psychology-of-money.sql
-- purpose: Big-release new — summary-psychology-of-money (summary, wealth).
-- affected: learning_material (upsert by slug) + learning_material_sub.
--           snapshot_material_revision trigger snapshots prior state + bumps version.
-- released_at: now() (new material).
begin;
set local app.edited_by = 'big-release-20260729';
set local app.edit_summary = 'new for big-release-20260729';

insert into public.learning_material
  (slug, type, dimension_id, topic, reading_minutes,
   title_pt, title_en, summary_pt, summary_en,
   body_pt, body_en,
   takeaways_pt, takeaways_en,
   tracking_pt, tracking_en,
   source_url, source_label_pt, source_label_en,
   reasoning_log, released_at)
values (
  'summary-psychology-of-money', 'summary', 'wealth', $topic$summary-psychology-of-money$topic$, 7,
  $title_pt$Dinheiro é comportamento, não planilha$title_pt$,
  $title_en$Money Is Behavior, Not Math$title_en$,
  $summary_pt$Por que gente brilhante quebra e gente comum enriquece no silêncio — e onde a tese do Housel tem prova real e onde é só aforismo elegante.$summary_pt$,
  $summary_en$Why brilliant people go broke and ordinary people quietly get rich — and where Housel's thesis has real evidence versus elegant aphorism.$summary_en$,
  $body_pt$No mesmo ano, 2010, duas histórias de dinheiro americanas chegaram ao fim de formas opostas.

Grace Groner era secretária aposentada. Nunca se casou, nunca teve carro, morava num apartamento de um cômodo. Nos anos 1930 comprou algumas ações modestas e simplesmente esqueceu delas por mais de sessenta anos. Quando morreu, aos 100, deixou cerca de 7 milhões de dólares para caridade. No mesmo ano, Richard Fuscone declarou falência pessoal. Formado em Harvard e Chicago, ex-vice-presidente da Merrill Lynch na América Latina, ele lutava contra a execução de uma mansão de quase dois mil metros quadrados — com uma hipoteca de 66 mil dólares por mês.

A secretária nunca ganhou muito. O executivo ganhou fortunas. O que separou os dois não foi inteligência nem diploma: foi comportamento. É com esse par que Morgan Housel abre o ensaio que virou "The Psychology of Money" (2020), livro que já passou de 10 milhões de cópias. A pergunta dele é simples e desconfortável: por que gente brilhante quebra e gente comum enriquece no silêncio?

:::quote{author="Morgan Housel" source="The Psychology of Money, 2020"}
Se dar bem com dinheiro não depende tanto do que você sabe. Depende de como você se comporta.
:::

## 1. Comportamento vence credencial

A tese de Housel é que dinheiro é uma habilidade branda, não técnica. Duas pessoas com o mesmo conhecimento — as mesmas planilhas, as mesmas taxas de juros na cabeça — podem terminar em pontos opostos por causa de temperamento. Groner e Fuscone são o retrato disso: uma sabia menos e ficou rica; o outro sabia tudo e quebrou.

> As pessoas não tomam decisões financeiras numa planilha. Tomam decisões financeiras na mesa de jantar.
> — Morgan Housel

A parte mais forte dessa tese nem está no livro, mas dá sustentação a ele. Em "Depression Babies" (2011), os economistas Ulrike Malmendier e Stefan Nagel cruzaram décadas de dados domésticos americanos, de 1964 a 2004. Descobriram algo teimoso: quem viveu anos de bolsa ruim passa o resto da vida arriscando menos — investe menos, guarda mais em dinheiro parado — mesmo depois de a economia se recuperar. O seu apetite a risco (o quanto de perda você tolera para perseguir ganho) é em parte um acidente da década em que você cresceu.

Aqui está o ponto: quem começou a investir em 2008, no auge do pânico, carrega um medo diferente de quem começou em 2013, na subida. Nenhum dos dois está fazendo conta. Os dois estão fazendo biografia. E biografia não aparece em nenhuma planilha de rentabilidade.

## 2. Seu pior inimigo é você no pior momento

Housel separa duas habilidades que quase todo mundo confunde: ficar rico e continuar rico. Ficar rico premia otimismo e apostas — colocar dinheiro onde os outros ainda não viram. Continuar rico premia o oposto: humildade, frugalidade, um medo saudável de que a aposta possa virar.

Jesse Livermore é o aviso ambulante. Trader lendário, ganhou o equivalente a cerca de 3 bilhões de dólares num único dia, na quebra de 1929. Mas continuou apostando cada vez mais alto, com dinheiro emprestado, perdeu tudo mais de uma vez e morreu em 1933. Ficar rico uma vez não provou nada sobre saber segurar.

A versão cotidiana disso não tem drama — tem nome: o gap comportamental. É a diferença entre o que um fundo rendeu e o que o investidor daquele fundo de fato levou pra casa, porque as pessoas põem dinheiro depois da alta e tiram depois da queda. A Morningstar mediu isso no relatório "Mind the Gap 2024": nos dez anos até dezembro de 2023, o fundo médio rendeu 7,3% ao ano, mas o investidor médio naquele mesmo fundo ganhou só 6,3%. Aquele 1,1 ponto, todo ano, é o pedágio de comprar animado e vender assustado. Não é erro de arredondamento — é a sua própria mão, na hora errada. O estudo cobriu mais de 20 mil fundos.

Como saber se isso é com você? Olhe seus três últimos movimentos grandes de dinheiro. Você reforçou depois de um ano bom e recuou depois de um ano ruim? Então o gap está se formando em tempo real. O antídoto de Housel é o que ele chama de margem de erro: dinheiro que você não encosta, para que o pânico nunca seja obrigado a decidir por você.

## 3. Onde a tese trinca — e o que fazer com isso

Aqui é onde a leitura precisa ser honesta. O livro sugere, nas entrelinhas, que comportamento importa mais que conhecimento. Isso é meia verdade. Em 2020, os pesquisadores Tim Kaiser, Annamaria Lusardi e colegas juntaram 76 experimentos controlados — estudos em que as pessoas são sorteadas para receber ou não uma formação, o padrão-ouro para provar causa — somando mais de 160 mil participantes. O resultado contraria o mantra do livro: educação financeira muda comportamento de verdade, com efeito pelo menos três vezes maior do que se achava antes. A síntese justa não é "comportamento no lugar de conhecimento". É "os dois importam".

Também é preciso separar o que é ciência do que é sabedoria. As frases mais amadas do livro — ter um "suficiente", "riqueza é o que você não vê" — são aforismos, não afirmações testáveis. São ótimas como filosofia; nenhuma meta-análise consegue confirmar ou negar. A resenha da Shortform aponta esse ponto fraco: às vezes Housel apoia a ideia em pesquisa, às vezes só na própria experiência.

E tem o contexto. O livro assume um mercado acionário americano — profundo, líquido, com horizonte de décadas. Conselhos do tipo "compre um fundo de índice e espere" (um fundo que só acompanha o mercado inteiro, em vez de escolher ações uma a uma) pressupõem esse acesso. Um estudo acadêmico de 2025, aplicando a lente do livro à Indonésia, concluiu que ela "não trata da desigualdade estrutural" fora dos EUA. Para o leitor brasileiro, o caminho é guardar o princípio e trocar o instrumento.

:::list-icon
shield | Monte uma margem de erro: uma reserva que você não encosta, pra que o medo nunca seja quem decide vender.
timer | Antes de comprar ou vender no impulso, espere 72 horas. O gap comportamental é feito de pressa.
book | Trate educação financeira como treino, não como enfeite: um livro ou curso por ano muda comportamento (Kaiser, 76 estudos).
happy | Escreva o seu "suficiente". Sem um número de chegada, todo ganho vira só o novo ponto de partida.
:::

Vale ler o original? Vale — pelo temperamento, não pelas táticas. Se você quer mecânica (juros compostos, taxas, como montar carteira), procure em outro lugar; este livro é sobre a pessoa que segura o dinheiro, não sobre o dinheiro. Leia como espelho, não como manual. E, no Brasil, fique com a psicologia — a margem de erro, o "suficiente", a paciência — e adapte cada instrumento ao mercado que você realmente tem à frente.

:::source[Morgan Housel · The Psychology of Money · Harriman House, 2020 · ISBN 978-0-85719-768-9](https://harriman-house.com/authors/morgan-housel/the-psychology-of-money/9780857197689)$body_pt$,
  $body_en$In 2010, two American money stories ended in opposite ways.

Grace Groner was a retired secretary. She never married, never owned a car, lived in a one-room apartment. In the 1930s she bought a few modest shares of stock and simply forgot about them for more than sixty years. When she died at 100, she left roughly $7 million to charity. That same year, Richard Fuscone filed for personal bankruptcy. Harvard- and Chicago-educated, a former vice-chairman of Merrill Lynch Latin America, he was fighting foreclosure on a 20,000-square-foot home — with a $66,000-a-month mortgage.

The secretary never earned much. The executive earned fortunes. What separated them wasn't intelligence or a diploma: it was behavior. That pairing opens the essay that became Morgan Housel's "The Psychology of Money" (2020), a book that has since sold more than 10 million copies. His question is simple and uncomfortable: why do brilliant people go broke while ordinary people quietly get rich?

:::quote{author="Morgan Housel" source="The Psychology of Money, 2020"}
Doing well with money isn't necessarily about what you know. It's about how you behave.
:::

## 1. Behavior beats credentials

Housel's thesis is that money is a soft skill, not a technical one. Two people with the same knowledge — the same spreadsheets, the same interest rates in their heads — can land in opposite places because of temperament. Groner and Fuscone are the portrait of it: one knew less and grew rich; the other knew everything and went bust.

> People don't make financial decisions on a spreadsheet. They make financial decisions at the dinner table.
> — Morgan Housel

The strongest support for this idea isn't even in the book, but it props the book up. In "Depression Babies" (2011), economists Ulrike Malmendier and Stefan Nagel combed through decades of US household data, from 1964 to 2004. They found something stubborn: people who lived through years of a bad stock market spend the rest of their lives taking less risk — investing less, holding more in cash — even after the economy recovers. Your appetite for risk (how much loss you'll stomach to chase a gain) is partly an accident of the decade you grew up in.

Here's the point: someone who started investing in 2008, at the peak of the panic, carries a different fear than someone who started in 2013, on the way up. Neither is doing math. Both are doing biography. And biography never shows up on a returns spreadsheet.

## 2. Your worst enemy is you at the wrong moment

Housel separates two skills almost everyone blurs together: getting rich and staying rich. Getting rich rewards optimism and bets — putting money where others haven't looked yet. Staying rich rewards the opposite: humility, frugality, a healthy fear that the bet could turn.

Jesse Livermore is the walking warning. A legendary trader, he made the equivalent of about $3 billion in a single day during the 1929 crash. But he kept betting bigger, with borrowed money, lost it all more than once, and died in 1933. Getting rich once proved nothing about knowing how to hold it.

The everyday version has no drama — it has a name: the behavior gap. It's the difference between what a fund returned and what the investor in that fund actually took home, because people put money in after the rise and pull it out after the fall. Morningstar measured it in its "Mind the Gap 2024" report: over the ten years to December 2023, the average fund returned 7.3% a year, but the average investor in those same funds earned just 6.3%. That 1.1 point, every year, is the toll for buying excited and selling scared. It's not a rounding error — it's your own hand, at the wrong moment. The study covered more than 20,000 funds.

How do you know if this is you? Look at your last three big money moves. Did you add after a good year and retreat after a bad one? Then the gap is forming in real time. Housel's antidote is what he calls room for error: money you don't touch, so panic is never forced to decide for you.

## 3. Where the thesis cracks — and what to do about it

This is where the reading has to stay honest. The book implies, between the lines, that behavior matters more than knowledge. That's a half-truth. In 2020, researchers Tim Kaiser, Annamaria Lusardi and colleagues pooled 76 randomized controlled trials — studies where people are randomly assigned to receive training or not, the gold standard for proving cause — covering more than 160,000 participants. The result cuts against the book's mantra: financial education really does change behavior, with an effect at least three times larger than earlier work suggested. The fair synthesis isn't "behavior instead of knowledge." It's "both matter."

Separate the science from the wisdom, too. The book's most beloved lines — having "enough," "wealth is what you don't see" — are aphorisms, not testable claims. They're great as philosophy; no meta-analysis can confirm or deny them. Shortform's review flags this weak spot: sometimes Housel backs an idea with research, other times with only his own experience.

Then there's context. The book assumes an American stock market — deep, liquid, with a decades-long horizon. Advice like "buy an index fund and wait" (a fund that simply tracks the whole market instead of picking stocks one by one) presumes that access. A 2025 academic paper applying the book's lens to Indonesia concluded it "inadequately addresses structural inequality" outside the US. Wherever your market isn't the American one, the move is to keep the principle and swap the instrument.

:::list-icon
shield | Build a room for error: a reserve you never touch, so fear is never the one deciding to sell.
timer | Before buying or selling on impulse, wait 72 hours. The behavior gap is made of hurry.
book | Treat financial education as training, not decoration: one book or course a year changes behavior (Kaiser, 76 trials).
happy | Write down your "enough." Without a finish line, every gain just becomes the new starting line.
:::

Worth reading the original? Yes — for the temperament, not the tactics. If you want mechanics (compound interest, fees, how to build a portfolio), look elsewhere; this book is about the person holding the money, not the money. Read it as a mirror, not a manual. And wherever your market isn't the US one, keep the psychology — the room for error, the "enough," the patience — and fit each instrument to the market actually in front of you.

:::source[Morgan Housel · The Psychology of Money · Harriman House, 2020 · ISBN 978-0-85719-768-9](https://harriman-house.com/authors/morgan-housel/the-psychology-of-money/9780857197689)$body_en$,
  array[$tkpt0$Comportamento importa mais que QI ou diploma — mas não substitui conhecimento: educação financeira também muda comportamento (76 estudos, 160 mil pessoas).$tkpt0$, $tkpt1$O "gap comportamental" custa cerca de 1,1 ponto ao ano: o investidor médio ganha menos que o próprio fundo por comprar na alta e vender na baixa (Morningstar).$tkpt1$, $tkpt2$Os conselhos do livro assumem o mercado americano; no Brasil, guarde o princípio (margem de erro, "suficiente") e adapte o instrumento.$tkpt2$]::text[],
  array[$tken0$Behavior beats IQ or a diploma — but it doesn't replace knowledge: financial education also changes behavior (76 trials, 160,000 people).$tken0$, $tken1$The behavior gap costs about 1.1 points a year: the average investor earns less than their own fund by buying high and selling low (Morningstar).$tken1$, $tken2$The book's advice assumes the US stock market; outside it, keep the principle (room for error, "enough") and swap the instrument.$tken2$]::text[],
  $trk_pt$No Perceva, cada tarefa da dimensão Riqueza que você marca é comportamento sendo treinado — exatamente o que Housel diz que decide o jogo. Registrar aportes regulares constrói a paciência que fecha o gap comportamental; criar uma tarefa de "não mexer na reserva" transforma a margem de erro em hábito visível. Use a sua avaliação de dinheiro para checar se o que você pratica bate com o "suficiente" que você diz querer.$trk_pt$,
  $trk_en$In Perceva, every Wealth task you check off is behavior being trained — exactly what Housel says decides the game. Logging steady contributions builds the patience that closes the behavior gap; a "don't touch the reserve" task turns room for error into a visible habit. Use your money self-assessment to check whether what you practice matches the "enough" you say you want.$trk_en$,
  $src_url$https://harriman-house.com/authors/morgan-housel/the-psychology-of-money/9780857197689$src_url$,
  $src_pt$Morgan Housel · The Psychology of Money · Harriman House, 2020 · ISBN 978-0-85719-768-9$src_pt$,
  $src_en$Morgan Housel · The Psychology of Money · Harriman House, 2020 · ISBN 978-0-85719-768-9$src_en$,
  $rlog${"template_type":"summary","template_version":2,"voice_principles_applied":["Three ideas, not seven: exactly 3 ## sections (behavior beats credentials, the behavior gap, where the thesis cracks); evidence + critics + verdict folded into prose rather than new sections","Prose-led, cards are spice: only 2 body cards (:::quote thesis + :::list-icon recipe) plus one light markdown blockquote and the closing :::source","Native PT and native EN written fresh, not translated — different cadence each side","Define jargon on first mention: 'apetite a risco', 'gap comportamental', 'experimentos controlados/RCT', 'fundo de índice' all anchored on first use","Concrete examples beat abstract noun lists: Groner vs Fuscone, Livermore, the 72h check, 'look at your last three money moves'","Honest caveats flagged: Kaiser meta-analysis counterpoint, aphorism-vs-science distinction, US-market bias attributed to Shortform + the 2025 Indonesia paper"],"steps":[{"id":"author_question","answer_pt":"Por que gente brilhante quebra e gente comum enriquece no silêncio? Housel abre com 2010: a secretária Grace Groner (7 milhões doados) contra o executivo da Merrill Lynch, Richard Fuscone (falência) — para mostrar que sucesso financeiro é comportamento, não inteligência nem diploma.","answer_en":"Why do brilliant people go broke while ordinary people quietly get rich? Housel opens on 2010: secretary Grace Groner ($7M donated) against Merrill Lynch executive Richard Fuscone (bankruptcy) — to argue financial success is behavior, not intelligence or a diploma."},{"id":"author_thesis","answer_pt":"Em uma frase, nas palavras do autor (usada como :::quote): 'Se dar bem com dinheiro não depende tanto do que você sabe. Depende de como você se comporta.' Sem stat block para respeitar o teto de 2 cards; os números headline (7 milhões, gap de 1,1 p.p.) entram na prosa.","answer_en":"In one sentence, in the author's words (used as :::quote): 'Doing well with money isn't necessarily about what you know. It's about how you behave.' No stat block, to respect the 2-card ceiling; the headline numbers ($7M, the 1.1pp gap) live in prose."},{"id":"core_ideas","answer_pt":"Três seções: (1) Comportamento vence credencial — dinheiro é habilidade branda, apoiada por Malmendier & Nagel (quem viveu bolsa ruim arrisca menos por décadas). (2) Seu pior inimigo é você no pior momento — ficar rico vs continuar rico (Livermore) e o gap comportamental quantificado pela Morningstar. (3) Onde a tese trinca — o contraponto de Kaiser, aforismo vs ciência, viés de mercado americano + receita acionável.","answer_en":"Three sections: (1) Behavior beats credentials — money as a soft skill, backed by Malmendier & Nagel (bad-market survivors take less risk for decades). (2) Your worst enemy is you at the wrong moment — getting vs staying rich (Livermore) and Morningstar's quantified behavior gap. (3) Where the thesis cracks — the Kaiser counterpoint, aphorism vs science, US-market bias + the actionable recipe."},{"id":"evidence","answer_pt":"A favor: Malmendier & Nagel (QJE 2011, dados EUA 1964–2004) e Morningstar 'Mind the Gap 2024' (7,3% do fundo vs 6,3% do investidor, >20 mil fundos). Contra o mantra: Kaiser, Lusardi et al. (76 RCTs, n>160 mil) provam efeito causal da educação financeira. Críticos atribuídos: Shortform (evidência desigual, viés EUA) e paper ICAP-H 2025 (desigualdade estrutural fora dos EUA). Amostras Morningstar e Malmendier são só EUA — flaggeado.","answer_en":"For: Malmendier & Nagel (QJE 2011, US data 1964–2004) and Morningstar 'Mind the Gap 2024' (7.3% fund vs 6.3% investor, >20k funds). Against the mantra: Kaiser, Lusardi et al. (76 RCTs, n>160k) prove financial education has a causal effect. Named critics: Shortform (uneven evidence, US bias) and the ICAP-H 2025 paper (structural inequality outside the US). Both Morningstar and Malmendier samples are US-only — flagged."},{"id":"actionable","answer_pt":":::list-icon com 4 ações: montar uma margem de erro (reserva intocável), esperar 72h antes de mexer no impulso, tratar educação financeira como treino (um livro/curso por ano), e escrever o próprio 'suficiente'.","answer_en":":::list-icon with 4 actions: build a room for error (untouchable reserve), wait 72h before impulsive moves, treat financial education as training (one book/course a year), and write down your own 'enough'."},{"id":"verdict","answer_pt":"Vale ler — pelo temperamento, não pelas táticas. Não é livro de mecânica (juros, taxas, carteira); é sobre a pessoa que segura o dinheiro. Leia como espelho, não manual. Leitor brasileiro: fique com a psicologia e adapte o instrumento ao mercado que tem à frente.","answer_en":"Worth reading — for the temperament, not the tactics. It's not a mechanics book (interest, fees, portfolio); it's about the person holding the money. Read it as a mirror, not a manual. Outside the US market: keep the psychology and fit the instrument to the market you actually have."}],"main_points":[{"id":"1_behavior-beats-credentials","what_pt":"Dinheiro é habilidade branda: comportamento decide mais que QI ou diploma (a secretária de 7 milhões vs o executivo falido).","what_en":"Money is a soft skill: behavior decides more than IQ or a diploma (the $7M secretary vs the bankrupt executive).","why_pt":"Porque decisões financeiras nascem da emoção e da biografia — quem viveu bolsa ruim arrisca menos por décadas (Malmendier & Nagel).","why_en":"Because financial decisions come from emotion and biography — people who lived through bad markets take less risk for decades (Malmendier & Nagel).","how_to_know_pt":"Pense em quando você começou a lidar com dinheiro. Se um susto antigo ainda dita seu medo hoje, é biografia decidindo, não conta."},{"id":"2_the-behavior-gap","what_pt":"Ficar rico e continuar rico são habilidades opostas; o 'gap comportamental' custa cerca de 1,1 ponto ao ano.","what_en":"Getting rich and staying rich are opposite skills; the behavior gap costs about 1.1 points a year.","why_pt":"Porque comprar na alta e vender na baixa faz o investidor médio ganhar menos que o próprio fundo (7,3% vs 6,3%, Morningstar).","why_en":"Because buying high and selling low makes the average investor earn less than their own fund (7.3% vs 6.3%, Morningstar).","how_to_know_pt":"Olhe seus três últimos movimentos grandes de dinheiro. Reforçou depois de um ano bom e recuou depois de um ano ruim? O gap está se formando."},{"id":"3_where-the-thesis-cracks","what_pt":"A tese 'comportamento acima de conhecimento' é meia verdade; educação financeira também muda comportamento, e o livro tem viés de mercado americano.","what_en":"The 'behavior over knowledge' thesis is a half-truth; financial education also changes behavior, and the book carries a US-market bias.","why_pt":"Porque 76 experimentos com 160 mil pessoas provam efeito causal da educação (Kaiser), e conselhos como 'compre um índice' assumem o mercado dos EUA.","why_en":"Because 76 trials with 160,000 people prove education has a causal effect (Kaiser), and advice like 'buy an index' assumes the US market.","how_to_know_pt":"Se o conselho pressupõe uma bolsa líquida de décadas, teste se ele cabe no seu mercado antes de aplicar: guarde o princípio, troque o instrumento."}]}$rlog$::jsonb, now()
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
  released_at = now();

insert into public.learning_material_sub (material_id, sub_id)
select m.id, v.sub_id
from public.learning_material m
cross join (values ('money')) as v(sub_id)
where m.slug = 'summary-psychology-of-money'
on conflict (material_id, sub_id) do nothing;

commit;
