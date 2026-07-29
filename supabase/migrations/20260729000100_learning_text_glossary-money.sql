-- migration: 20260729000100_learning_text_glossary-money.sql
-- purpose: Big-release rewrite — glossary-money (explainer, wealth).
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
    'glossary-money', 'explainer', 'wealth', $topic$glossary-money$topic$, 6,
    $title_pt$A parte chata de ficar rico$title_pt$,
    $title_en$The Boring Part of Getting Rich$title_en$,
    $summary_pt$Construir patrimônio é mecânico e um pouco chato: compre o mercado inteiro, pague pouco, não mexa — e deixe os juros compostos fazerem o trabalho.$summary_pt$,
    $summary_en$Building wealth is mechanical and a little boring: own the whole market, pay almost nothing, don't touch it, and let compounding do the work.$summary_en$,
    $body_pt$Existe uma indústria inteira montada pra te convencer de que enriquecer é complicado. Que você precisa de um gestor esperto, de uma dica quente, de saber a hora certa de entrar e sair. É um ótimo negócio — pra essa indústria. Pra você, é o contrário.

A verdade desconfortável é que construir patrimônio é mecânico e um pouco chato. As ações americanas renderam cerca de 6,7% ao ano acima da inflação ao longo de dois séculos. Não é sorte nem talento — é o mercado inteiro crescendo junto, e esse retorno fica ali disponível pra qualquer um que simplesmente permaneça dentro dele.

O problema é que quase ninguém permanece. Em janelas de 20 anos, cerca de 92% dos fundos profissionais que tentam escolher as melhores ações perdem pra um fundo burro, que não pensa em nada e só compra o mercado todo. Este texto é sobre por que isso acontece — e o que fazer com essa informação.

## 1. Você não vence o mercado — então compre ele inteiro

Comece por uma definição. Um fundo de índice é um fundo que compra todas as empresas de um mercado de uma vez, na proporção do tamanho de cada uma. O exemplo clássico segue o S&P 500: numa única aplicação você vira dono de um pedacinho das 500 maiores empresas dos EUA. Ninguém escolhe nada. O fundo só copia o mercado.

Do outro lado está o fundo ativo: um gestor bem pago que estuda, aposta e tenta escolher as ações que vão subir mais que a média. Parece óbvio que o especialista ganha do fundo burro. Os dados dizem o contrário. Em 2025, 79% dos fundos ativos de grandes empresas americanas perderam pro S&P 500 — o quarto pior ano em 25 anos de placar. Estica pra 20 anos e cerca de 92% ficam pra trás.

Isso não é azar nem incompetência. É aritmética. Em 1991, o Nobel William Sharpe provou uma coisa simples: o mercado é a soma de todos os investidores. O dólar médio investido, por definição, rende o retorno do mercado. Pra um gestor ganhar acima da média, outro precisa perder exatamente o mesmo tanto — é um jogo de soma zero antes dos custos. Some a isso que o gestor ativo cobra caro pra jogar, e o grupo dos ativos, como um todo, está matematicamente condenado a render menos que o grupo dos passivos. Não depende de opinião:

> Não procure a agulha no palheiro. Compre o palheiro inteiro.

A frase é de John Bogle, que criou o primeiro fundo de índice pra pessoa comum em 1976. Warren Buffett — o maior escolhedor de ações vivo — manda todo mundo que não é ele fazer o mesmo: em carta de 1996, recomendou que a maioria dos investidores ponha o dinheiro num fundo de índice de taxa baixa, porque isso "com certeza vai bater o resultado líquido da grande maioria dos profissionais".

Um detalhe honesto: isso vale pro grupo, não pra todo gestor. Uma minoria realmente supera o mercado de forma consistente — o problema é que dá pra identificar quem são só olhando pra trás. O próprio placar da S&P mostra que os fundos que ganham num período quase nunca repetem no seguinte.

## 2. As duas goteiras silenciosas: a taxa e a mão nervosa

Se o mercado te entrega 6,7% ao ano de graça, por que tanta gente sai com muito menos? Por dois vazamentos que quase ninguém enxerga, porque cada um parece pequeno demais pra importar.

O primeiro é a taxa. Todo fundo cobra uma taxa anual de administração — a fatia do seu dinheiro que fica com o fundo todo ano, você ganhando ou perdendo. Nos EUA, o fundo ativo médio de ações cobrou 0,64% em 2024. O fundo de índice médio cobrou 0,05%. Parece nada: meio ponto percentual. Mas não é um pedágio único, é um vazamento que compõe ano após ano. Em cima de R$ 100 mil crescendo por 30 anos, a diferença entre render 7% e 6,4% ao ano vira dezenas de milhares de reais — dinheiro que saiu do seu bolso pra pagar um gestor que, como vimos, provavelmente perdeu pro índice de qualquer forma.

E tem uma reviravolta: a taxa é o melhor previsor que existe do desempenho futuro de um fundo. Melhor que o histórico de retorno, melhor que as estrelinhas de avaliação. Russel Kinnel, da Morningstar, separou os fundos por custo e viu que os 25% mais baratos entregavam o dobro ou o triplo da taxa de sucesso dos 25% mais caros. Faz sentido: a taxa é a única coisa do futuro que você conhece com certeza hoje. Retorno é promessa; custo é fato.

A segunda goteira é você. Aqui está o número mais desconfortável do texto inteiro: o investidor médio rende de 1,1 a 1,7 ponto percentual por ano a menos que os próprios fundos em que ele investe. Leu certo — menos que o fundo que ele mesmo tem na carteira. Como? Timing. Ele compra depois que já subiu (empolgação) e vende depois que caiu (medo). A Morningstar chama isso de "gap", e ao longo de uma década esse buraco come de 15% a 22% do retorno total do fundo. O mecanismo funciona; é a mão nervosa que estraga.

> Tempo é seu amigo; impulso é seu inimigo.

Bogle de novo. Pega o impulso mais comum: você recebe um dinheiro e fica na dúvida entre investir tudo de uma vez ou aos poucos, com medo de entrar bem antes de uma queda. Entrar aos poucos — o tal "custo médio", investir uma quantia fixa em intervalos regulares — parece mais seguro. Mas a Vanguard mostrou que investir tudo de uma vez ganhou em cerca de dois terços das vezes, porque o mercado sobe mais do que cai, e dinheiro parado esperando a hora certa perde o retorno desse tempo. O custo médio é uma ferramenta contra o arrependimento, não contra a matemática.

## 3. A linha de chegada tem um número — e depende mais de você do que do mercado

Quanto é "o suficiente"? Existe uma resposta numérica. Em 1994, o planejador William Bengen testou décadas de história do mercado americano e achou uma regra: se você tira 4% da sua carteira no primeiro ano de aposentadoria e depois ajusta pela inflação, o dinheiro dura pelo menos 30 anos em todos os períodos históricos que ele testou (o próprio Bengen depois revisou o número pra 4,7%, mas 4% ficou como referência). O Estudo Trinity confirmou em 1998: uma carteira 75% ações e 25% títulos sacando 4% ao ano sobreviveu em 98% das janelas de 30 anos.

Vire a regra do avesso e ela vira uma meta: 4% é um vinte e cinco avos. Ou seja, quando você junta 25 vezes o seu gasto anual, atingiu independência financeira. Gasta R$ 60 mil por ano? A meta é R$ 1,5 milhão investido. É a primeira vez que "o suficiente" vira um número que você pode mirar.

Mas o que decide se você chega lá não é a ação que você escolheu. É quanto da sua renda você guarda. Poupar 10% leva umas cinco décadas até a independência; poupar 25% derruba pra cerca de 32 anos; poupar 50% chega em 17. (Essa tabela é aritmética pura, assumindo retorno real constante — a realidade oscila mais que isso, então trate como bússola, não como GPS.) E é justo aqui que a maioria tropeça: em 2025 o americano médio poupou 4,7% da renda, contra uma média histórica de 8,4%. Metade do que o próprio passado dizia pra guardar.

Por trás de tudo isso está um único conceito, e metade das pessoas acima de 50 anos erra uma pergunta básica sobre ele: juros compostos. Não é só o seu dinheiro rendendo — é o rendimento rendendo em cima de si mesmo, ano após ano. Por isso começar cedo importa tanto: os primeiros anos parecem não fazer diferença, e são exatamente os que mais fazem.

:::list-icon
wallet | Ponha o dinheiro num fundo de índice amplo e de taxa baixa — o palheiro inteiro, não a agulha.
cash | Persiga o menor custo. A taxa é o único número do futuro que você já conhece hoje.
trending-up | Automatize o aporte e não mexa. A mão parada rende mais que a mão nervosa.
timer | Mire 25x o seu gasto anual — mas o que te leva lá é a sua taxa de poupança, não o timing.
sparkles | Comece agora, com pouco. Juros compostos pagam quem chega cedo.
:::

Nenhuma dessas ações é sofisticada. É essa a questão. O mercado te entrega o retorno de graça; a taxa e o pânico são o que você paga por cima. Fazer menos — escolher menos, mexer menos, pagar menos — é literalmente a estratégia vencedora. A parte difícil não é entender. É ter paciência de não fazer quase nada por trinta anos.

:::source[S&P Dow Jones Indices · SPIVA U.S. Scorecard · Fim de 2025](https://www.spglobal.com/spdji/en/research-insights/spiva/)$body_pt$,
    $body_en$There's an entire industry built to convince you that getting rich is complicated. That you need a clever manager, a hot tip, a feel for when to get in and out. It's a great business — for that industry. For you, it's the opposite.

The uncomfortable truth is that building wealth is mechanical and a little boring. U.S. stocks have returned about 6.7% a year above inflation over two centuries. That's not luck or talent — it's the whole market growing together, and that return sits there for anyone who simply stays inside it.

The catch is that almost nobody stays put. Over 20-year windows, roughly 92% of the professional funds that try to pick the best stocks lose to a dumb fund that thinks about nothing and just buys the entire market. This is about why that happens — and what to do with it.

## 1. You don't beat the market — so buy all of it

Start with a definition. An index fund buys every company in a market at once, weighted by each one's size. The classic example tracks the S&P 500: with a single purchase you own a sliver of the 500 largest U.S. companies. Nobody picks anything. The fund just copies the market.

On the other side sits the active fund: a well-paid manager who studies, bets, and tries to choose the stocks that will beat the average. It seems obvious the expert should crush the dumb fund. The data say otherwise. In 2025, 79% of active U.S. large-cap funds lost to the S&P 500 — the fourth-worst year in a 25-year scorecard. Stretch it to 20 years and about 92% fall behind.

This isn't bad luck or incompetence. It's arithmetic. In 1991, Nobel laureate William Sharpe proved something simple: the market is the sum of every investor. The average invested dollar earns the market's return by definition. For one manager to beat the average, another has to lose by exactly the same amount — a zero-sum game before costs. Add that active managers charge a lot to play, and active investors as a group are mathematically doomed to trail passive investors as a group. It doesn't hinge on opinion:

> Don't look for the needle in the haystack. Just buy the haystack.

That's John Bogle, who launched the first index fund for ordinary people in 1976. Warren Buffett — the greatest living stock-picker — tells everyone who isn't him to do the same: in his 1996 shareholder letter he said most investors should put their money in a low-fee index fund, because it is "sure to beat the net results delivered by the great majority of investment professionals."

One honest caveat: this holds for the group, not for every manager. A small minority really does beat the market consistently — the trouble is you can only spot them looking backward. S&P's own scorecard shows the funds that win in one stretch almost never repeat in the next.

## 2. The two silent leaks: the fee and the nervous hand

If the market hands you 6.7% a year for free, why do so many people walk away with far less? Two leaks almost nobody sees, because each one looks too small to matter.

The first is the fee. Every fund charges an annual expense ratio — the slice of your money the fund keeps each year, win or lose. In the U.S., the average active equity fund charged 0.64% in 2024. The average index fund charged 0.05%. Sounds like nothing: half a percentage point. But it isn't a one-time toll, it's a leak that compounds year after year. On $100k growing for 30 years, the gap between earning 7% and 6.4% turns into tens of thousands of dollars — money that left your pocket to pay a manager who, as we saw, probably lost to the index anyway.

Here's the twist: that fee is the single best predictor of a fund's future performance. Better than its past returns, better than its star rating. Morningstar's Russel Kinnel sorted funds by cost and found the cheapest 25% delivered double or triple the success rate of the priciest 25%. It makes sense: the fee is the only thing about the future you know for certain today. Return is a promise; cost is a fact.

The second leak is you. Here's the most uncomfortable number in this whole piece: the average investor earns 1.1 to 1.7 percentage points a year less than the very funds they own. Read that again — less than the fund sitting in their own account. How? Timing. They buy after it's already gone up (excitement) and sell after it drops (fear). Morningstar calls this the "gap," and over a decade it eats 15% to 22% of the fund's total return. The mechanics work; the nervous hand ruins them.

> Time is your friend, impulse is your enemy.

Bogle again. Take the most common impulse: you come into some money and can't decide whether to invest it all at once or drip it in, afraid of buying right before a crash. Drip-feeding — "dollar-cost averaging," putting in a fixed amount at regular intervals — feels safer. But Vanguard showed that investing the lump sum immediately won about two-thirds of the time, because markets rise more often than they fall, and cash waiting on the sidelines forfeits the return of that waiting time. Averaging in is a tool against regret, not against math.

## 3. The finish line has a number — and it's mostly on you

How much is "enough"? There's a numerical answer. In 1994, planner William Bengen tested decades of U.S. market history and found a rule: withdraw 4% of your portfolio in your first year of retirement, then adjust for inflation, and the money lasts at least 30 years across every historical period he tried (Bengen himself later revised it up to 4.7%, but 4% stuck as the reference). The Trinity Study confirmed it in 1998: a 75%-stock, 25%-bond portfolio pulling 4% a year survived in 98% of 30-year windows.

Flip the rule over and it becomes a target: 4% is one twenty-fifth. So once you've saved 25 times your annual spending, you've hit financial independence. Spend $60k a year? The target is $1.5 million invested. It's the first time "enough" becomes a number you can aim at.

But what decides whether you get there isn't the stock you picked. It's how much of your income you keep. Saving 10% takes roughly five decades to independence; saving 25% drops it to about 32 years; saving 50% gets there in 17. (That table is pure arithmetic assuming a constant real return — reality swings more than that, so treat it as a compass, not a GPS.) And this is exactly where most people stumble: in 2025 the average American saved 4.7% of income, against a historical average of 8.4%. Half of what the past said to keep.

Underneath all of it sits one concept, and half of people over 50 miss a basic question about it: compound interest. It isn't just your money earning a return — it's the return earning a return on itself, year after year. That's why starting early matters so much: the first years look like they make no difference, and they're precisely the ones that make the most.

:::list-icon
wallet | Put your money in a broad, low-fee index fund — the whole haystack, not the needle.
cash | Chase the lowest cost. The fee is the only future number you already know today.
trending-up | Automate the contribution and don't touch it. The still hand beats the nervous one.
timer | Aim for 25x your annual spending — but what gets you there is your savings rate, not timing.
sparkles | Start now, with a little. Compounding pays whoever shows up early.
:::

None of these moves is sophisticated. That's the whole point. The market hands you the return for free; the fee and the panic are what you pay on top. Doing less — picking less, trading less, paying less — is literally the winning strategy. The hard part isn't understanding it. It's having the patience to do almost nothing for thirty years.

:::source[S&P Dow Jones Indices · SPIVA U.S. Scorecard · Year-End 2025](https://www.spglobal.com/spdji/en/research-insights/spiva/)$body_en$,
    array[$tkpt0$Não tente escolher ações vencedoras — em 20 anos, cerca de 92% dos fundos profissionais perdem pra um fundo de índice barato que só copia o mercado.$tkpt0$, $tkpt1$Suas duas maiores perdas são invisíveis: a taxa do fundo (que compõe todo ano) e o seu próprio timing (comprar na alta, vender na baixa).$tkpt1$, $tkpt2$A meta é 25x o seu gasto anual, e quem te leva lá é a sua taxa de poupança — não o mercado, não o timing.$tkpt2$]::text[],
    array[$tken0$Don't try to pick winning stocks — over 20 years, about 92% of professional funds lose to a cheap index fund that just copies the market.$tken0$, $tken1$Your two biggest losses are invisible: the fund's fee (which compounds every year) and your own timing (buying high, selling low).$tken1$, $tken2$The finish line is 25x your annual spending, and what gets you there is your savings rate — not the market, not timing.$tken2$]::text[],
    $trk_pt$No Perceva, a dimensão Riqueza acompanha o sub Dinheiro. As tarefas que você marca aqui — automatizar um aporte, revisar a taxa de um fundo, subir a sua poupança em um ponto percentual — são exatamente as ações mecânicas que este texto defende. O ponto não é fazer muito; é fazer pouco, de forma regular, e deixar o tempo compor. Cada aporte registrado é um voto na estratégia que a aritmética já provou vencer.$trk_pt$,
    $trk_en$In Perceva, the Wealth dimension tracks the Money sub. The tasks you check off here — automating a contribution, reviewing a fund's fee, nudging your savings rate up a point — are exactly the mechanical actions this piece argues for. The goal isn't to do a lot; it's to do a little, regularly, and let time compound. Every logged contribution is a vote for the strategy the arithmetic already proved wins.$trk_en$,
    $src_url$https://www.spglobal.com/spdji/en/research-insights/spiva/$src_url$,
    $src_pt$S&P Dow Jones Indices · SPIVA U.S. Scorecard · Fim de 2025$src_pt$,
    $src_en$S&P Dow Jones Indices · SPIVA U.S. Scorecard · Year-End 2025$src_en$,
    $rlog${"template_type":"explainer","template_version":2,"voice_principles_applied":["Exatamente 3 ideias-herói (indexar o mercado · as duas goteiras · a linha de chegada). Nada de 7 sub-tópicos.","Prosa-led: 1 card no corpo (list-icon da receita) + :::source final. Stat headline (92%/79%) e retorno real (6,7%) dobrados na prosa, sem stat card — seguindo o padrão Strength v4.","2 blockquotes markdown pra as citações icônicas (Bogle 'palheiro' e 'tempo x impulso'), mais leves que :::quote.","PT nativo e EN nativo escritos separados, não traduzidos — cadências e idiomas diferentes.","Jargão definido na primeira menção: fundo de índice (âncora S&P 500), fundo ativo vs passivo, taxa de administração, custo médio (dollar-cost averaging), retorno real, juros compostos, regra dos 4% / 25x.","Caveats honestos flaggeados: indexar vale pro grupo não pra todo gestor; tabela de poupança é aritmética (bússola, não GPS); 4% é histórico/EUA e Bengen revisou pra 4,7%; lump-sum é média histórica.","Exemplo concreto ancorando cada abstração: teste em casa da meta 25x (R$ 1,5 mi pra R$ 60 mil/ano), diferença de dezenas de milhares em 30 anos, mão nervosa vs mão parada.","Mitos desmontados como prosa, não como card de list-icon.","Voz 'você' consistente dos dois lados; frases curtas (~16 palavras); filler cortado."],"steps":[{"id":"hook","answer_pt":"Abre com o mal-entendido: a indústria financeira vende que enriquecer é complicado (gestor esperto, dica quente, timing). A verdade é o oposto — mecânico e chato. Curiosity gap: 92% dos profissionais perdem pra um fundo que não pensa em nada.","answer_en":"Opens on the misconception: the finance industry sells you that getting rich is complicated (clever manager, hot tip, timing). The truth is the opposite — mechanical and boring. Curiosity gap: 92% of pros lose to a fund that thinks about nothing."},{"id":"thesis","answer_pt":"Construir patrimônio é mecânico: compre o mercado inteiro, pague pouco, não mexa, deixe os juros compostos trabalharem. Número-âncora: ~92% dos fundos ativos perdem pro índice em 20 anos — dobrado na prosa, sem stat card (padrão Strength v4).","answer_en":"Building wealth is mechanical: own the whole market, pay almost nothing, don't touch it, let compounding work. Anchor number: ~92% of active funds lose to the index over 20 years — folded into prose, no stat card (Strength v4 pattern)."},{"id":"real_definition","answer_pt":"Definição que vence a comum: investir não é escolher vencedores (o que as pessoas acham) — é comprar o mercado inteiro via fundo de índice e ficar parado. Contraste ativo vs passivo escrito em prosa, não em :::compare.","answer_en":"Definition that beats the common one: investing isn't picking winners (what people assume) — it's buying the whole market via an index fund and sitting still. Active-vs-passive contrast written as prose, not a :::compare card."},{"id":"stakes","answer_pt":"Número duro: 79% dos fundos ativos perderam pro S&P 500 em 2025 (4º pior ano em 25); 92% em 20 anos (SPIVA). E o investidor médio perde 1,1-1,7 p.p./ano pro próprio fundo por timing (Morningstar, Mind the Gap).","answer_en":"Hard number: 79% of active funds lost to the S&P 500 in 2025 (4th-worst in 25 yrs); 92% over 20 years (SPIVA). And the average investor loses 1.1-1.7 pp/yr to their own fund via timing (Morningstar, Mind the Gap)."},{"id":"mechanism","answer_pt":"Mecanismo: aritmética de Sharpe (1991) — o dólar médio rende o mercado; ativos como grupo têm que perder após custos. Segunda camada: taxa que compõe + gap comportamental. Exemplo concreto: R$ 100 mil a 7% vs 6,4% por 30 anos = dezenas de milhares de diferença.","answer_en":"Mechanism: Sharpe's (1991) arithmetic — the average dollar earns the market; active as a group must trail after costs. Second layer: compounding fees + behavior gap. Concrete example: $100k at 7% vs 6.4% over 30 years = tens of thousands apart."},{"id":"myth_busts","answer_pt":"Mitos desmontados em prosa (não em card): (1) 'o especialista ganha do fundo burro' — falso, aritmética; (2) 'investir aos poucos é mais seguro' — lump sum ganha 2/3 das vezes; (3) 'histórico/estrelas preveem retorno' — a taxa prevê melhor. Caveat honesto: vale pro grupo, não pra todo gestor.","answer_en":"Myths dismantled as prose (not a card): (1) 'the expert beats the dumb fund' — false, arithmetic; (2) 'drip-feeding is safer' — lump sum wins 2/3 of the time; (3) 'past returns/stars predict returns' — the fee predicts better. Honest caveat: true for the group, not every manager."},{"id":"recipe","answer_pt":"Receita em :::list-icon (5 ações): fundo de índice amplo e barato; perseguir o menor custo; automatizar e não mexer; mirar 25x o gasto anual via taxa de poupança; começar cedo. Meta numérica: regra dos 4% / 25x. Tabela de poupança flaggeada como aritmética (bússola, não GPS).","answer_en":"Recipe in :::list-icon (5 actions): broad low-fee index fund; chase lowest cost; automate and don't touch; aim for 25x annual spending via savings rate; start early. Numeric target: 4% rule / 25x. Savings table flagged as arithmetic (compass, not GPS)."}],"main_points":[{"id":"1_buy_the_market","what_pt":"Você não vence o mercado — em 20 anos, ~92% dos fundos ativos perdem pro índice. Compre o mercado inteiro via fundo de índice barato.","why_pt":"Não é azar: é aritmética (Sharpe, 1991). O grupo dos ativos, líquido de custos, tem que render menos que o dos passivos.","how_to_know_pt":"Cheque se o seu dinheiro está num fundo de índice amplo e de taxa baixa (ex.: que segue o S&P 500) ou num fundo ativo caro.","what_en":"You don't beat the market — over 20 years, ~92% of active funds lose to the index. Own the whole market via a cheap index fund.","why_en":"It's not luck, it's arithmetic (Sharpe, 1991). As a group, active dollars must trail passive dollars once costs are netted out."},{"id":"2_two_silent_leaks","what_pt":"Duas goteiras invisíveis drenam o retorno: a taxa do fundo (compõe todo ano) e o seu timing (o investidor médio rende 1,1-1,7 p.p./ano menos que os próprios fundos).","why_pt":"A taxa é o melhor previsor de desempenho futuro; o gap comportamental come 15-22% do retorno numa década. O mercado funciona; a mão nervosa estraga.","how_to_know_pt":"Some a taxa anual do seu fundo e conte quantas vezes você comprou ou vendeu por medo ou empolgação no último ano.","what_en":"Two invisible leaks drain returns: the fund's fee (compounds yearly) and your timing (the average investor trails their own funds by 1.1-1.7 pp/yr).","why_en":"Fees are the best predictor of future performance; the behavior gap eats 15-22% of a decade's return. The mechanics work; nervous hands ruin them."},{"id":"3_number_and_savings_rate","what_pt":"A meta é 25x o seu gasto anual (regra dos 4%); quem te leva lá é a sua taxa de poupança, não o mercado.","why_pt":"Poupar 10% leva ~50 anos; 25% leva ~32; 50% leva ~17. E metade das pessoas 50+ erra uma pergunta básica de juros compostos — começar cedo é o que mais pesa.","how_to_know_pt":"Multiplique o seu gasto anual por 25 = a sua meta. Divida o que você poupa pela sua renda = a sua taxa de poupança hoje.","what_en":"The target is 25x your annual spending (the 4% rule); what gets you there is your savings rate, not the market.","why_en":"Saving 10% takes ~50 years; 25% takes ~32; 50% takes ~17. Half of people over 50 miss a basic compound-interest question — starting early matters most."}]}$rlog$::jsonb, now()
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
  select id, 'money' from up on conflict (material_id, sub_id) do nothing;

commit;
