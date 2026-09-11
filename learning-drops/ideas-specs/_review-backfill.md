# Backfill — ideias dos 31 materiais legados, pra aprovar antes das imagens

Formato: `n · título — afirmação` (PT), com o título EN na linha de baixo. O texto completo (100–180 palavras, PT e EN, fontes, brief da imagem) está em `learning-drops/ideas-specs/<slug>.json`. Notas do cortador abaixo de cada material.

Total: 94 ideias em 31 materiais (explainer 69, news 2, summary 23). Custo das imagens: ~US$ 4.70.

O que conferir: a afirmação vale sozinha no verso do card? O título vale fora do material? Ids são definitivos depois da migration — se algum nome incomoda, é agora.

---

## glossary-strength · explicação · corpo · 3 ideia(s)

**Força — o corpo como capacidade**

**1 · Seu aperto de mão sabe algo que você não sabe.** — Cada 5 quilos a menos no aperto de mão aumentam em 16% o risco de morrer — sinal mais forte que a pressão arterial.
> id: `aperto-de-mao` · afirmação 115/98 chars · EN: Your handshake knows something you don't.

**2 · Zone 2: o ritmo leve faz o que o HIIT não faz.** — Só o ritmo leve do Zone 2 aumenta suas mitocôndrias, as usinas de energia das células. O HIIT não substitui.
> id: `zona-2-mitocondria` · afirmação 108/99 chars · EN: Zone 2: the easy pace does what HIIT can't.

**3 · Treino de força: existe um piso semanal.** — O piso da OMS é 2 a 3 treinos de força por semana e 10 minutos de mobilidade por dia. Dor no dia seguinte não conta.
> id: `piso-semanal-oms` · afirmação 116/113 chars · EN: Strength training: there's a weekly floor.

Notas do cortador:
- Pool de fontes é de UMA URL só: o `:::source` do corpo repete o `source_url` (Mandsager et al., 2018 · JAMA Network Open · n=122.007). As três ideias citam essa mesma fonte; Leong et al. (Lancet, 2015), OMS 2020 e Attia (Outlive, 2023) ficaram citados no texto do corpo, sem URL, porque o artigo os nomeia mas não linka.
- Três ideias = as três seções/main_points do artigo. Nada foi cortado; o que evitei foi duplicar: os 150-300 min de aeróbico da receita da OMS já são o Zone 2 da ideia 2, então a afirmação da ideia 3 se apoia em força + mobilidade + o mito da dor, e os minutos aparecem só como uma das quatro linhas no corpo.
- Títulos 1 e 2 reaproveitam headlines aprovadas do reels-spec (o 2 ganhou o prefixo "Zone 2:" pra sobreviver fora do material). A headline 3 ("Existe um piso semanal. Abaixo dele, você perde.") tem 48 chars e nenhuma palavra em comum com o título do material — reescrita como "Treino de força: existe um piso semanal."
- Seção fraca em número próprio: a receita da OMS não tem n nem estudo nomeado além do ano (2020), e as 3 h/semana de Zone 2 o artigo assume como "piso em que a literatura converge" — mantive a ressalva em vez de inventar um estudo. Grafia corrigida: o corpo publicado traz "eccêntrico"; a ideia usa "excêntrico".

---

## glossary-sleep · explicação · saúde · 3 ideia(s)

**Sono — a base de tudo**

**1 · Suas 8 horas podem estar perdendo de 6,5.** — O sono tem três peças: quantidade, regularidade e qualidade. Horário fixo prediz mortalidade melhor que horas somadas.
> id: `tres-pecas-do-sono` · afirmação 118/117 chars · EN: Your 8 hours might be losing to 6.5.

**2 · Noite curta: a fome do dia seguinte não é gula.** — Duas noites de 4 horas sobem a grelina 28% e derrubam a leptina 18%. A fome que vem depois é química, não fraqueza.
> id: `fome-da-noite-curta` · afirmação 115/115 chars · EN: Short sleep: next-day hunger isn't willpower.

**3 · Sono: o ajuste que mais rende é de graça.** — Quatro ajustes carregam o resultado: horário fixo, quarto escuro a 16-19°C, cafeína 8h antes, álcool 3h antes.
> id: `receita-minima-do-sono` · afirmação 110/111 chars · EN: Sleep: the upgrade that pays most is free.

Notas do cortador:
- Pool de fontes = 1 URL só: o source_url é idêntico à única linha :::source (Windred et al., 2024 · Sleep). As três ideias citam ela; Van Dongen 2003, o painel da AASM 2015, Dawson & Reid (Nature, 1997) e o Oura Gen3 ficam nomeados no corpo, porque o artigo não linka nenhum deles.
- Cortei o bloco glinfático/β-amilóide: é só camundongo e o próprio artigo o freia com um estudo de 2024 que achou o oposto — sem número humano e sem ação, não sustentava card. O 'déficit invisível' do Van Dongen (takeaway 1) virou a abertura da ideia 1 em vez de uma 4ª ideia (teto de explainer = 3).
- Atenção a sobreposição entre materiais: a ideia 1 ancora no mesmo 20%-48% de Windred 2024 que a ideia 'tres-fusos' de catch-up-sleep-weekend já publicada. O enquadramento difere (modelo de três peças vs. jet lag social), mas os dois cards convivem em Minhas ideias.
- Títulos 1 e 3 reaproveitam headlines aprovadas do reels-spec; a do reel 2 ('A fome esquisita do dia seguinte não é gula.') ganhou o prefixo 'Noite curta:' porque sozinha não dizia que o assunto era sono. O material_title PT ('Sono — a base de tudo') não tem palavra de 5+ letras, então a forma 'tema: afirmação' é a única que passa em idea_title_no_context nas ideias 2 e 3.

---

## news-oral-glp1-2026-05 · notícia · saúde · 1 ideia(s)

**Pílula oral segura a perda de peso pós-Ozempic**

**1 · Parar o Ozempic cobrava um preço. Até agora?** — Trocar a injeção semanal por um comprimido diário de orforglipron segurou 75-80% do peso perdido; no placebo, 38-49%.
> id: `rampa-de-saida-da-agulha` · afirmação 117/106 chars · EN: Stopping Ozempic used to cost you. Until now?

Notas do cortador:
- Budget news = 1: cortei as seções 2 ("não é Ozempic em pílula", potência ~12% vs 15%/21%) e 3 (força/proteína/sono, sem aprovação FDA) como ideias próprias e dobrei o essencial delas no 3º parágrafo do corpo — sem elas a ideia viraria manchete otimista sem ressalva.
- Pool de fontes é de UMA url só: source_url e a única linha :::source apontam pro mesmo artigo da Nature Medicine. ATTAIN-1 (~12%) é citado no artigo sem link, então ficou dentro do texto, sem virar fonte.
- Título reusa o gancho aprovado do reel 1, trocando "a injeção" por "o Ozempic": o card é lido fora do material (Minhas ideias/Explorar) e "injeção" sozinha não nomeia o assunto; "Ozempic" está no corpo e no título do material.
- Mantive os hedges do artigo: financiamento Eli Lilly, sem aprovação da FDA, e a moldura "segura um platô, não leva você até ele". Deixei de fora efeitos colaterais (náusea ~1/3) e o alerta de tireoide de roedores por falta de espaço — se o mantenedor quiser, entram no lugar da frase do resgate.

---

## news-loneliness-memory-2026-04 · notícia · vínculos · 1 ideia(s)

**Solidão piora memória — mas não acelera a queda**

**1 · Solidão e memória: a manchete errou o verbo.** — Quem é solitário lembra menos agora — mas a memória cai no mesmo ritmo (SHARE, 10.217 idosos).
> id: `nivel-nao-velocidade` · afirmação 94/97 chars · EN: The loneliness headline got one verb wrong.

Notas do cortador:
- Tipo news = teto de 1 ideia. Cortei duas candidatas fortes do corpo: 'troque o motivo, não a ação' (virou o fecho da mesma ideia, com o que fazer) e 'o que continua de pé' (OMS ~870 mil mortes/ano) — sozinhas restariam vagas sem o achado nível-vs-velocidade que as sustenta.
- Pool de fontes é de UMA URL só: source_url e a única linha :::source apontam pro mesmo DOI (Venegas-Sanabria et al., 2026, Aging & Mental Health). O estudo é nomeado no corpo junto do número, como manda a regra.
- Título reaproveita a headline 1 já aprovada no reels-spec ('Solidão e memória: a manchete errou o verbo.', 44 chars) — nomeia o assunto e passa em idea_title_no_context sem ajuste.
- O número da OMS (870 mil mortes/ano) e o enquadramento do Surgeon General ficaram de fora do card: são contexto do que NÃO mudou, e puxá-los pra dentro da única ideia diluiria o achado. Se um dia o material virar explainer, viram a ideia 2.

---

## summary-outlive · resumo · saúde · 4 ideia(s)

**Outlive: o que sobra depois do ceticismo**

**1 · Quatro doenças. E talvez uma raiz comum.** — Quatro famílias de doença dominam a morte adulta. A resistência à insulina liga as quatro — como suspeita, não consenso.
> id: `quatro-cavaleiros` · afirmação 120/113 chars · EN: Four diseases. And maybe one common root.

**2 · Fora de forma: risco maior que o cigarro.** — Sair dos 25% piores de condicionamento para os 25% melhores corta o risco de morte em ~5x — mais que parar de fumar.
> id: `risco-treinavel` · afirmação 116/107 chars · EN: Out of shape: a bigger risk than smoking.

**3 · Treino: chegue aos 50 com o dobro da forma.** — A função cai 10 a 15% por década depois dos 50: chegue aos 50 com o dobro da forma que vai precisar aos 80.
> id: `decatlo-centenario` · afirmação 107/95 chars · EN: Training: reach 50 twice as fit as you need.

**4 · Longevidade: o caro é a parte mais frágil.** — A camada cara — ressonância de corpo inteiro e rapamicina — é a menos sustentada. O que funciona custa quase nada.
> id: `aposta-cara` · afirmação 114/109 chars · EN: Longevity: the priciest part is the shakiest.

Notas do cortador:
- Pool de fontes é UM link só: source_url e a única linha :::source apontam para a mesma resenha do Topol. As 4 ideias citam ela; Mandsager et al. 2018 (JAMA Network Open, 122 mil) e o ensaio PEARL 2024 ficam nomeados no corpo, sem URL — o artigo não linka nenhum dos dois.
- Reels: reaproveitei a headline 1 inteira (ideia 1). As headlines 2 e 3 perdiam contexto fora do material (nenhuma palavra em comum com o título, sem dois-pontos), então viraram 'tema: afirmação' — 'Fora de forma: risco maior que o cigarro' e 'Longevidade: o caro é a parte mais frágil'.
- Cortei três candidatas: Medicina 3.0 (moldura, sem número nem ação), o veredito 'vale ler uma vez com ceticismo' (meta) e a nota Epstein/CBS (é sobre o mensageiro, não muda o que o leitor sabe de saúde). Dividi a seção 2 do artigo em duas ideias — o 5x do condicionamento e o Decatlo Centenário são mecanismos e ações diferentes.
- Divisão de ação para não sobrepor ideia 1 e 4: apoB fica na 1 (marcador da prevenção que é consenso), Lp(a) + recusar ressonância/rapamicina ficam na 4. Todos os números duros mantiveram o hedge do artigo ('pelos números de mortalidade que ele cita', 'segundo relatos').

---

## summary-why-we-sleep · resumo · saúde · 4 ideia(s)

**Why We Sleep — com lápis cético na mão**

**1 · Você passa um terço da vida fora do ar.** — Sono não é pausa: é manutenção. NREM arquiva a memória e escoa o lixo do cérebro; REM processa emoção.
> id: `duas-maquinas` · afirmação 102/104 chars · EN: You spend a third of your life offline.

**2 · Why We Sleep: auditado linha por linha.** — A epidemia de sono da OMS não existe — a nota de rodapé levava a um documentário. E o câncer não dobra.
> id: `epidemia-inexistente` · afirmação 103/105 chars · EN: Why We Sleep: audited line by line.

**3 · Sono: a meta de 8 horas não é consenso.** — O consenso clínico é 7 horas ou mais, não 8 cravadas: a menor mortalidade fica perto de 7h, com risco acima de 8h.
> id: `sete-ou-mais` · afirmação 114/111 chars · EN: Sleep: the 8-hour target isn't consensus.

**4 · Ortossonia: ler sobre sono fez dormir pior.** — Clínicos relatam insônia em quem leu o livro com medo: a obsessão pelo sono perfeito estraga o sono.
> id: `ortossonia` · afirmação 100/106 chars · EN: Orthosomnia: reading about sleep made it worse.

Notas do cortador:
- Pool de fontes é de UMA URL só: source_url == o único :::source do corpo (guzey.com/books/why-we-sleep). As 4 ideias citam ela; meta-análise de 2018, Kripke 2002 e o consenso AASM/SRS 2015 aparecem nomeados no texto do corpo, porque o artigo não linka nenhum deles.
- Cortei uma 5ª ideia candidata (gráfico com a barra apagada + Gelman + desfecho em Berkeley): mesma âncora (auditoria Guzey) e mesma ação da ideia 2, então virou parágrafo dentro dela.
- Dividi a seção 3 do artigo em duas ideias — '7 ou mais, não 8' (número + hábito) e ortossonia (mecanismo e ação opostos: parar de medir). São as duas únicas partes do material com 'o que fazer' distinto.
- Alzheimer/β-amilóide ficou de fora: o corpo diz que o estudo da faxina é em camundongos e não dá número humano (o reasoning_log cita Xie 2013, mas o artigo não — não inventei a fonte). Ideia 1 reusa a manchete de reel aprovada tal e qual; ela não nomeia 'sono', o que só é permitido no ordinal 1 — as ideias 2-4 usam a forma 'tema: afirmação'.

---

## summary-deep-work · resumo · ofício · 4 ideia(s)

**Deep Work — o foco como vantagem**

**1 · Foco não soma. Multiplica.** — Qualidade é tempo vezes intensidade. Cada troca de tarefa deixa resíduo e derruba a intensidade do que vem depois.
> id: `residuo-de-atencao` · afirmação 114/102 chars · EN: Focus doesn't add. It multiplies.

**2 · Prática deliberada: a alavanca é menor.** — Treinar no limite explica só ~12% da variação em performance (Macnamara, 2014): é necessário, não é suficiente.
> id: `doze-por-cento` · afirmação 111/110 chars · EN: Deliberate practice: a smaller lever.

**3 · Deep Work: o problema não é sua vontade.** — Escolha uma filosofia de agenda: com emprego, a rítmica — 90 minutos de bloco fixo toda manhã, antes do e-mail.
> id: `bloco-ritmico` · afirmação 111/112 chars · EN: Deep Work: your focus problem isn't willpower.

**4 · Tédio: o celular na fila cobra no trabalho.** — Sacar o celular a cada segundo de marasmo treina o cérebro a fugir do desconforto que o foco profundo exige.
> id: `abracar-o-tedio` · afirmação 108/104 chars · EN: Boredom: the phone in line costs you at work.

Notas do cortador:
- Pool de fontes pobre: o artigo só tem UMA URL (a página do livro na Hachette, igual ao source_url), então as 4 ideias citam a mesma fonte. Leroy (2009), Ericsson (1993), Macnamara et al. (2014) e Berman/Jonides/Kaplan (2008) aparecem nomeados no corpo, sem URL — o artigo nunca os linkou.
- Fiquei em 4, não 5: a seção 3 virou duas ideias (agendar a profundidade / treinar a tolerância ao tédio), e a 'produtividade de horário fixo' foi dobrada dentro do bloco rítmico em vez de virar ideia própria — mesma família (estrutura no lugar de força de vontade), ação vizinha.
- Cortei a ideia do veredito ('tese de um botão só' / exagero dos ~12%): ela só repete as ideias 2 e 3. A ressalva de autonomia de agenda (todos os exemplos do livro controlam o próprio calendário) mora no corpo da ideia 3.
- Reels reaproveitados: a manchete 1 virou o título da ideia 1 inteira; as manchetes 2 e 3 foram prefixadas ('Prática deliberada:', 'Deep Work:') pra nomear o assunto fora do material. O scratchpad é compartilhado com os outros cutters em paralelo — meu q.json/material.json foram sobrescritos uma vez; usei subpasta própria (dw-cutter).

---

## attachment-styles-love · explicação · vínculos · 3 ideia(s)

**Apego no amor: dois números, não um rótulo**

**1 · Ninguém é 'ansioso'. Nem 'evitativo'.** — O ECR-R devolve dois números contínuos, ansiedade e evitação. Os rótulos são quadrantes desenhados depois.
> id: `dois-numeros-nao-rotulo` · afirmação 106/109 chars · EN: Nobody is 'anxious'. Or 'avoidant'.

**2 · Apego: um persegue, o outro foge.** — Cobrar e se fechar são o mesmo alarme: um no volume máximo, o outro no mudo. Num casal, o estrago multiplica.
> id: `alarme-e-botao-de-mudo` · afirmação 109/110 chars · EN: Attachment: one chases, the other flees.

**3 · Apego: você não precisa virar seguro.** — Segurança conquistada existe, mas foi exagerada. O que muda a relação é o gesto na hora, não o rótulo.
> id: `mudar-o-gesto-nao-o-rotulo` · afirmação 102/107 chars · EN: Attachment: you don't have to become secure.

Notas do cortador:
- Pool de fontes é UMA só: source_url e a única linha :::source apontam pro mesmo Candel & Turliuc 2019 (ScienceDirect). As três ideias citam ela; Fraley/Waller/Brennan 2000, Mikulincer & Shaver 2007, Peters/Meltzer/McNulty 2025, Roisman 2002, Fraley 2002 e a meta-análise de EFT ficaram como citação inline no corpo, porque o artigo os nomeia sem linkar.
- Espinha = as 3 seções do artigo, 3 ideias (teto do explainer). As 3 headlines aprovadas do reels-spec foram reaproveitadas; as das ideias 2 e 3 ganharam o prefixo 'Apego:' porque sozinhas ('Um persegue, o outro foge', 'Você não precisa virar seguro') não nomeavam o assunto fora do material.
- Cortei dois candidatos por serem contexto, não mudança de conhecimento: o efeito ator x efeito parceiro (é qualificador da meta-análise da ideia 1) e o mito ciúme/Métellus 2025 (só nega uma associação, sem mecanismo nem ação própria). O achado de Li & Chan 2012 (evitação pesa mais que ansiedade) também ficou de fora — não sustentava ideia sozinho e alongaria o corpo da ideia 2.
- Ideias 1 e 3 são vizinhas (rótulo não é identidade x não precisa trocar de rótulo). Separei por evidência e por ação: a 1 termina em 'refaça o ECR-R como termômetro', a 3 em 'mude o gesto + repare depois da briga'. Se o mantenedor achar redundante, a fusão natural é 1+3, ficando 2 ideias.

---

## does-money-buy-happiness · explicação · riqueza · 3 ideia(s)

**Dinheiro compra felicidade? O acordo de 2023**

**1 · O teto dos 75 mil nunca foi sobre a sua vida.** — O platô de 2010 era só do humor do dia a dia; a satisfação com a vida seguiu subindo com a renda.
> id: `teto-dos-75-mil` · afirmação 97/101 chars · EN: The $75k ceiling was never about your life.

**2 · Felicidade: dois estudos opostos, ambos certos.** — Com mais renda, a felicidade de ~80% das pessoas não tem teto; só a minoria menos feliz empaca nos 100 mil dólares.
> id: `os-dois-estavam-certos` · afirmação 115/108 chars · EN: Happiness: two opposite studies, both right.

**3 · A felicidade não conta em reais.** — A felicidade conta em múltiplos: dobrar de 3 pra 6 mil por mês dá o mesmo salto que dobrar de 30 pra 60 mil.
> id: `renda-logaritmica` · afirmação 108/109 chars · EN: Happiness doesn't count in dollars.

Notas do cortador:
- Pool de fontes = 1 URL só (PNAS 2023, o :::source do corpo é o próprio source_url), então as 3 ideias citam a mesma fonte; Kahneman & Deaton 2010 (n~450 mil) e o app de Killingsworth (1,7 mi de flagras) ficam citados no texto, como o artigo faz, sem inventar link.
- Cortei uma 4ª candidata: 'entre os 30% mais felizes o ganho acelera até 500 mil' — repete o 'sem teto' da ideia 2 com outra fatia; virou o limite dos dados dentro da ideia 3.
- Títulos 1 e 3 são as headlines aprovadas do reels-spec, verbatim; a 2 ganhou o prefixo 'Felicidade:' pra valer sozinha fora do material (idea_title_no_context).
- Lint: o regex NO_TEXT_PT_RE barra o advérbio 'logo' ('para logo abaixo') como se fosse logotipo — vale evitar a palavra nos briefs dos outros backfills. E o scratchpad compartilhado foi sobrescrito por agentes paralelos (q.json/material.json vieram com outro slug); busquei em subpasta própria.

---

## non-instrumental-play · explicação · ofício · 3 ideia(s)

**O hobby mais inútil é o que mais descansa**

**1 · Descansar não é o contrário de esforço.** — Um desafio difícil fora do trabalho recarrega tanto quanto o sofá — se não carregar meta de trabalho.
> id: `dominio-recarrega` · afirmação 101/95 chars · EN: Rest isn't the opposite of effort.

**2 · Prêmio no hobby: a vontade de desenhar sumiu.** — Prêmio ou métrica em cima do que você fazia por prazer reescreve o motivo: você passa a fazer pela recompensa.
> id: `premio-mata-o-prazer` · afirmação 110/99 chars · EN: Reward on a hobby: the urge to draw vanished.

**3 · Lazer: nem tudo na sua vida precisa render.** — Não precisa largar o hobby pago: garanta um espaço por semana sem meta, sem métrica e sem plateia.
> id: `espaco-sem-placar` · afirmação 98/101 chars · EN: Leisure: not everything has to pay off.

Notas do cortador:
- Pool de fontes tem só 2 URLs (Sonnentag & Fritz 2007 + Headrick et al. 2023). Lepper/Greene/Nisbett 1973, Etkin 2016, Deci/Koestner/Ryan 1999, Hobfoll 1989, Sonnentag 2018 e Csikszentmihalyi são nomeados no artigo sem link — ficaram citados no texto do corpo, nunca como URL. A ideia 2 cita só Sonnentag & Fritz por isso.
- 3 ideias = os 3 main_points do drafter, um por seção. Considerei e cortei uma 4ª sobre 'devotee work' / Conservação de Recursos (Hobfoll): sem número próprio e repetia o mecanismo da ideia 2; virou uma frase dentro da ideia 3.
- Títulos: reusei o reel 1 inteiro na ideia 1; os reels 2 e 3 ganharam prefixo de tema ('Prêmio no hobby:' / 'Lazer:') porque sozinhos em Minhas ideias não diziam do que falavam — os dois passam idea_title_no_context.
- GOTCHA do pipeline: o scratchpad é COMPARTILHADO entre os cutters rodando em paralelo — meu q.json foi sobrescrito por um agente irmão e a API devolveu does-money-buy-happiness como se fosse minha query. Refiz em subpasta própria e conferi o slug da linha. Vale checar se os outros backfills desta leva cortaram o material certo.

---

## summary-atomic-habits · resumo · ofício · 4 ideia(s)

**Hábitos Atômicos — 66 dias, não 21**

**1 · Os 21 dias vieram de um cirurgião plástico.** — Nos 96 voluntários de Lally, o hábito novo só virou automático aos 66 dias em média — e o intervalo foi de 18 a 254.
> id: `66-dias-nao-21` · afirmação 116/110 chars · EN: The 21-day rule came from a plastic surgeon.

**2 · Hábitos: 1% por dia. A conta fecha. Você, não.** — 1% melhor por dia realmente dá 37 vezes em um ano — mas isso é juros compostos, e comportamento tem platô e recaída.
> id: `sistemas-vencem-metas` · afirmação 116/109 chars · EN: Habits: 1% daily. The math holds. You won't.

**3 · Hábitos: quase metade do dia acontece sem você.** — Wood (2019): 43% do seu comportamento diário se repete no mesmo cenário. Por isso ambiente vence força de vontade.
> id: `ambiente-vence-vontade` · afirmação 114/110 chars · EN: Habits: nearly half your day runs without you.

**4 · Identidade: a mais citada é a menos testada.** — Cada ação é um voto em quem você se torna. Bússola poderosa — mas Clear a apoia em teoria de 1977, não em teste.
> id: `voto-na-identidade` · afirmação 112/110 chars · EN: Identity: the most quoted, the least tested.

Notas do cortador:
- Pool de fontes é UMA URL só: source_url e a única linha :::source são ambas jamesclear.com/atomic-habits. As 4 ideias citam o livro; Lally (2010, UCL), Wood (2019), Duhigg (2012) e Bandura (1977) ficam nomeados no corpo, como manda a regra 9 — o artigo não linka nenhum deles.
- Cortei uma 5ª ideia: a proveniência das Quatro Leis (loop do Duhigg, ancoragem do Fogg, Premack/Milkman, ratos do laboratório de Graybiel). Virou um parágrafo dentro da ideia 3 — como card próprio seria a terceira ideia 'o livro exagera' seguida, e o saldo do artigo é que ele converge com a ciência.
- As 3 manchetes aprovadas do reels-spec viraram títulos das ideias 2, 3 e 4, com prefixo de tema ('Hábitos:' / 'Identidade:') pra passarem em idea_title_no_context fora do material. A ideia 1 ganhou título novo: o reels não tinha gancho pro estudo da Lally, e '66 dias, não 21' é o próprio título do material.
- Os 66 ouros olímpicos do ciclismo britânico ficaram de fora da ideia 2 de propósito — colidem com os '66 dias' da ideia 1 e confundiriam quem vê os dois cards em Minhas ideias. Mantive 178 títulos mundiais e cinco Tours.

---

## explainer-career-capital · explicação · riqueza · 3 ideia(s)

**Por que "siga sua paixão" falha**

**1 · 'Siga sua paixão' erra numa coisa: a ordem.** — Autonomia e propósito são raros — você só compra com uma habilidade rara. A paixão vem depois dela, não antes.
> id: `capital-de-carreira` · afirmação 110/102 chars · EN: 'Follow your passion' has the order wrong.

**2 · 'Não é minha paixão' esconde outra frase.** — 'Não é minha paixão' quase sempre quer dizer 'ficou difícil' — e quem vê paixão como algo pronto desiste bem antes.
> id: `interesse-construido` · afirmação 115/111 chars · EN: 'Not my passion' usually hides another phrase.

**3 · Carreira: antes de trocar, a pergunta dura.** — Aprofunde uma habilidade por meses antes de trocar de área. Troque só se a insatisfação sobreviver à competência.
> id: `aprofundar-antes-de-trocar` · afirmação 113/109 chars · EN: Career: before you switch, one harder question.

Notas do cortador:
- Pool de fontes = 1 URL só: source_url e a única linha :::source são o mesmo DOI (O'Keefe, Dweck & Walton, 2018). As três ideias citam ele; Cech 2021, Macnamara 2014 e Chen 2015 são nomeados no corpo (o artigo não os linka) e Newport entra como síntese jornalística, com a ressalva preservada.
- 3 ideias = a espinha exata dos main_points (ordem invertida / interesse é construído / aprofunde antes de trocar). Nada foi fundido; nada sobrou pra uma quarta.
- Cortei o ângulo de classe (Cech 2021: trabalhadores de origem operária que seguem o princípio da paixão caem mais em empregos instáveis) — é forte, mas vira uma quarta ideia sem ação própria e estourava o teto de explainer. Vale considerar se o material virar summary.
- Títulos 1 e 2 reaproveitam headlines já aprovadas do reels-spec; a 3ª ('Antes de trocar de área, uma pergunta mais dura.') falharia idea_title_no_context, então virou 'Carreira: antes de trocar, a pergunta dura.' (43 chars, com tema na frente).

---

## glossary-build · explicação · ofício · 3 ideia(s)

**Construir muda quem você é**

**1 · Mil vídeos não valem uma cadeira torta.** — Terminar um objeto seu te dá duas coisas que mil horas de tela não dão: apego (+63%) e prova de que você é capaz.
> id: `apego-e-prova` · afirmação 113/120 chars · EN: A thousand videos can't beat one wobbly chair.

**2 · Construir só muda você sob três condições.** — O efeito só aparece se você escolheu o projeto, levou até o fim e pode mostrar. Faltando uma, ele enfraquece.
> id: `tres-condicoes` · afirmação 109/102 chars · EN: Building only changes you on three conditions.

**3 · Prática: as 10 mil horas nunca foram promessa.** — Praticar explica de menos de 1% a 26% da distância entre expert e novato. Ajuda muito; não é passe de mágica.
> id: `dez-mil-horas-honestas` · afirmação 109/100 chars · EN: Practice: 10,000 hours were never a promise.

Notas do cortador:
- Pool de fontes é de UMA URL só: o :::source do corpo é idêntico ao source_url (Norton, Mochon & Ariely, 2012). As três ideias citam ela; Bandura 1977, Ryan e Deci 2000, Papert e Harel 1991, Macnamara 2014 e Valkenburg 2024 ficam citados no texto do corpo, sem URL. Na ideia 3 a fonte listada é a primária do material, não o estudo-âncora dela (Macnamara) — se o maintainer quiser, vale adicionar o DOI da meta-análise ao material antes de publicar.
- Cortei o trecho de flow / Csikszentmihalyi: é mecanismo de apoio da ideia 2 (sem número próprio e sem ação distinta), viraria uma 4ª ideia vaga e o teto de explainer é 3.
- Tirei Hill e Turiano (propósito → menor mortalidade) do corpo da ideia 3 por orçamento de palavras — é o mais fraco dos três desmentidos (correlação, várias rotas). O gancho dos 2,67h de TV também ficou de fora: é contexto de abertura, não muda o que o leitor sabe.
- Títulos: a ideia 1 reusa a headline 1 do reels-spec sem mexer; as ideias 2 e 3 adaptam as headlines 2 e 3 ('Fazer' → 'Construir'; prefixo 'Prática:') pra passarem em idea_title_no_context lidas fora do material.

---

## glossary-career · explicação · riqueza · 3 ideia(s)

**Emprego, carreira ou chamado**

**1 · 24 secretárias, o mesmo cargo, três trabalhos.** — Emprego, carreira ou chamado: a lente quase não depende da profissão — e pesa mais que o contracheque.
> id: `tres-lentes` · afirmação 102/99 chars · EN: 24 assistants, one title, three different jobs.

**2 · Carreira: o que te move não é o contracheque.** — Trabalho com sentido vem de autonomia, competência e pertencimento — e autonomia é a alavanca mais forte.
> id: `autonomia-alavanca` · afirmação 105/99 chars · EN: Career: what moves you isn't the paycheck.

**3 · Dá pra trocar de trabalho sem trocar de emprego.** — Job crafting: mude o que faz, com quem faz e como enxerga — o trabalho muda sem você trocar de cargo.
> id: `job-crafting` · afirmação 101/99 chars · EN: Career: change your job without quitting it.

Notas do cortador:
- Pool de fontes tem UM único item: o artigo só traz `source_url` = Wrzesniewski et al., 1997 (DOI), que também é a única linha :::source. As três ideias citam esse mesmo link; Ryan & Deci 2000, Fried & Ferris 1987, Allan et al. 2019, Hackman & Oldham 1976, Wrzesniewski & Dutton 2001 e Bunderson & Thompson 2009 são nomeados no corpo (o artigo não linka nenhum deles). Se o mantenedor quiser fontes próprias por ideia, precisa adicionar :::source no material primeiro.
- Ideia 3 é a única sem número: a seção de job crafting não tem n nem efeito. Deixei mecanismo + ação + o aviso do chamado-armadilha (tratadores de zoológico) no lugar. A mediana de 3,9 anos / 2,7 anos abaixo de 35 ("dados de 2024", sem estudo nomeado no artigo) ficou de fora de propósito — não cabia sem cortar o aviso, que vale mais.
- Considerei uma 4ª ideia só com o 'chamado-armadilha' (Bunderson & Thompson) e uma 5ª com o desmascaramento do 'autonomia, maestria, propósito' do Pink. Cortei as duas: o teto de explainer é 3, o Pink é contexto (reempacotamento de SDT + Hackman/Oldham, sem mudar o que o leitor faz) e o aviso do chamado vive melhor como freio dentro da ideia 3.
- Títulos 2 e 3 usam a forma 'tema: afirmação' / carregam 'emprego' para passar no idea_title_no_context — o headline aprovado do reel 3 em EN ('You can change your job without quitting it.') perderia contexto fora do material, então o EN virou 'Career: change your job without quitting it.' e o PT manteve o headline aprovado literal (48 chars, no limite).

---

## glossary-circle · explicação · vínculos · 3 ideia(s)

**Quem você vê muda quanto você vive**

**1 · O fator de risco que ninguém mede.** — Laços sociais fortes se associam a 50% mais chance de sobreviver — efeito do tamanho da pressão alta.
> id: `risco-que-ninguem-mede` · afirmação 101/106 chars · EN: The risk factor nobody measures.

**2 · Solidão e isolamento: só um mexe no relógio.** — Isolamento é quem você vê; solidão é como você se sente. Em 6.500 ingleses, quem previu a morte foi o isolamento.
> id: `isolamento-nao-e-solidao` · afirmação 113/105 chars · EN: Loneliness and isolation: one moves the clock.

**3 · Amigos: não é sobre quantos você tem.** — O que protege é a variedade de tipos de vínculo: com 1 a 3 tipos, 4,2x mais resfriados que com 6 ou mais.
> id: `variedade-nao-volume` · afirmação 105/98 chars · EN: Friends: it’s not how many you have.

Notas do cortador:
- Pool de fontes = 1 URL só: o source_url é o mesmo do único :::source do corpo (Holt-Lunstad 2010, PLOS Medicine). As três ideias citam ele; Steptoe 2013, Cohen 1997, o coorte de 1979 e Dunbar 1992 entram nomeados no texto do corpo, porque o artigo os cita sem link.
- O estudo do resfriado (Cohen 1997) aparecia nos main_points 2 e 3. Dei ele exclusivamente à ideia 3 (variedade) e ancorei a ideia 2 no Steptoe 2013 (6.500 ingleses), pra nenhuma ideia repetir número-âncora.
- Cortei a queda 1990–2021 (homens com 6+ amigos próximos: 55% → 27%) — o próprio artigo avisa que as duas pesquisas usaram instrumentos diferentes, e era contexto, não mudança no que o leitor sabe. Cortei também a citação do Cacioppo (sabor, sem mecanismo).
- Os sobrenomes Steptoe e Cohen vêm do reasoning_log.main_points; o body_pt publicado diz só 'um estudo de 2013 / de 1997'. Se o mantenedor quiser paridade literal com o artigo, é só trocar por 'um estudo de 2013' e 'um estudo de 1997'. Títulos 2 e 3 usam a forma 'tema: afirmação' porque o título do material só oferece 'quanto' / 'changes' como palavra ≥5 letras.

---

## glossary-contemplate · explicação · mente · 3 ideia(s)

**Contemplar: a mente que foge e volta**

**1 · Metade da sua vida acontece sem você.** — A mente está em outro lugar 46,9% da vida acordada — e a divagação vem antes do humor cair, não depois.
> id: `mente-vaga-metade` · afirmação 103/103 chars · EN: Half your life happens without you.

**2 · Meditar: funciona menos do que te venderam.** — Em 47 ensaios com 3.515 pessoas, meditar ganha de não fazer nada — mas não ganha de caminhar, remédio ou terapia.
> id: `meditacao-efeito-modesto` · afirmação 113/106 chars · EN: Meditation: it works less than advertised.

**3 · Contemplar: sentar em silêncio é só uma porta.** — Escrever 15 minutos, falar de si na terceira pessoa e desejar bem a outros têm evidência própria e menos barreira.
> id: `portas-da-contemplacao` · afirmação 114/104 chars · EN: Contemplation: silence is just one door.

Notas do cortador:
- Pool de fontes é de UMA URL só: o artigo tem um único :::source (Goyal 2014, JAMA Internal Medicine) e o source_url é o mesmo. As três ideias citam ele; Killingsworth & Gilbert (Science 2010), Kuyken (2016), Frattaroli (2006), Kross (2014) e Fredrickson (2008) ficam nomeados NO TEXTO, sem URL inventada — mesmo padrão do glossary-play. Se o mantenedor quiser, vale voltar ao material e adicionar :::source pro Science 2010 e pro Kuyken.
- As 3 ideias seguem os 3 main_points do reasoning_log (teto do explainer). Considerei e CORTEI uma quarta: 'meditar nem sempre é inofensivo' (1 em 12 / 1 em 3 sem instrutor) — ela repetiria o mesmo estudo-âncora e a mesma ação da ideia 2, então virou o terceiro parágrafo dela, com o 'pare se surgir angústia forte'. Também cortei Gloria Mark (2,5 min → menos de 1 min): o próprio artigo diz que é registro de um laboratório só, e a ideia 1 já tem número melhor.
- Os 3 headlines aprovados do reels-spec foram reusados, com prefixo de tema nas ideias 2 e 3 pra passarem em idea_title_no_context fora do material: 'Meditar funciona. Menos do que te venderam.' → 'Meditar: funciona menos do que te venderam.'; 'Sentar em silêncio é só uma das portas.' → 'Contemplar: sentar em silêncio é só uma porta.'. A ideia 1 ficou com o headline intacto.
- Gotcha do lint que custou uma rodada: o advérbio português 'logo' ('na trilha logo ao lado') dispara o NO_TEXT_PT_RE de logotipo. Evitem 'logo' em image_brief. Pequeno aviso de ambiente: o scratchpad é compartilhado com os agentes irmãos — o material.json do caminho padrão foi sobrescrito por outro slug no meio do caminho; usei subpasta por slug.

---

## glossary-dexterity · explicação · corpo · 3 ideia(s)

**Levantar do chão prediz quanto você vive**

**1 · Um 'truque de festa' prevê quanto você vive.** — Levantar do chão precisando de três ou quatro apoios veio com 5 a 6 vezes mais risco de morrer.
> id: `sentar-e-levantar` · afirmação 95/102 chars · EN: A 'party trick' predicts how long you live.

**2 · Tropeço: sua força chega tarde demais.** — O que some primeiro é a velocidade da força, não a força — e segurar um tropeço leva milissegundos.
> id: `dinapenia` · afirmação 99/102 chars · EN: A stumble: your strength arrives too late.

**3 · Equilíbrio: alongar não é o que te segura.** — Alongar não previne queda. Seis meses de Tai Chi cortaram 55% do risco de cair várias vezes.
> id: `equilibrio-corta-quedas` · afirmação 92/98 chars · EN: Balance: stretching isn't what holds you up.

Notas do cortador:
- Pool de fontes = 1 URL só: o material tem um único :::source, igual ao source_url (Brito et al., 2014 · Eur J Prev Cardiol). As 3 ideias citam essa mesma fonte — nas ideias 2 e 3 (dinapenia, Cochrane/Tai Chi) ela é a âncora do material, não do número. Os demais estudos são nomeados no corpo como o artigo os nomeia ('um estudo com 1.702 adultos', 'revisão Cochrane de 108 estudos', '256 adultos entre 70 e 92 anos') — o corpo publicado não traz autor/journal deles, e o reasoning_log traz ('Br J Sports Med 2022'), mas isso está fora do body, então não usei.
- Título da ideia 1 é o headline aprovado do reel 1, verbatim. Os reels 2 e 3 ('Ser forte não te impede de ir ao chão.' / 'Alongar não é o que te segura em pé.') caíam na regra idea_title_no_context — reescritos na forma 'tema: afirmação' ('Tropeço: …' e 'Equilíbrio: …'), mantendo o gancho original.
- Cortado da ideia 1 por espaço: velocidade de marcha (9 estudos, 34 mil idosos, 12% por 0,1 m/s, 'sexto sinal vital'). É o terceiro teste do mesmo argumento — viraria ideia repetida, não ideia nova. Também ficou de fora a ressalva de 2026 sobre propriocepção ('pequena, depende do teste') e a citação de Claudio Gil Araújo.
- Só 3 ideias (teto do explainer). Uma quarta candidata (flexibilidade × mobilidade + dorsiflexão) foi dividida: a dorsiflexão do estudo com 372 mulheres ficou na ideia 2 (mecanismo do tropeço) e a distinção flexibilidade/mobilidade na ideia 3 (junto do mito do alongamento) — sozinha ela não mudava o que o leitor sabe.

---

## glossary-learn · explicação · mente · 3 ideia(s)

**A sensação de aprender mente**

**1 · Quem estudou 'errado' venceu por 21 pontos.** — Se testar, espaçar e misturar parecem piores na hora e ganham depois: 61% de retenção contra 40% em uma semana.
> id: `dificuldades-desejaveis` · afirmação 111/112 chars · EN: The 'wrong' way to study won by 21 points.

**2 · Aprender: o cérebro cresce e depois encolhe.** — Prática sustentada muda o cérebro de forma física — e a mudança encolhe de volta poucos meses depois que você para.
> id: `cerebro-cresce-e-desfaz` · afirmação 115/106 chars · EN: Learning: the brain grows, then shrinks back.

**3 · Aprender: 10 mil horas nunca foram sobre horas.** — Nem horas acumuladas, nem 'estilo de aprendizagem', nem acreditar: o que move a nota é prática ativa com feedback.
> id: `dez-mil-horas-mito` · afirmação 114/107 chars · EN: Learning: 10,000 hours were never about hours.

Notas do cortador:
- Pool de fontes é UMA só: source_url == a única linha :::source (Roediger & Karpicke, 2006 · DOI). As 3 ideias citam ela; todos os outros estudos (Cepeda, Rohrer & Taylor, Maguire, Freeman, Sisk, Yeager) ficam nomeados inline no corpo, sem URL inventada.
- Cortei uma 4ª ideia candidata (aprendizagem ativa / Freeman 225 estudos como ideia própria): o teto de explainer é 3 e ela virou a abertura da ideia 3, que precisava de um número duro para sustentar os três mitos.
- As três dificuldades desejáveis (se testar, espaçar, misturar) foram MERGIDAS numa ideia só — mesmo mecanismo (esforço grava) e mesma ação; separar geraria duas ideias que se repetem.
- Reaproveitei as 3 headlines aprovadas dos reels; as de ordinal 2 e 3 ganharam o prefixo 'Aprender:' para passar no idea_title_no_context (o material_title só tem 'sensação' e 'aprender' com ≥5 letras).

---

## glossary-money · explicação · riqueza · 3 ideia(s)

**A parte chata de ficar rico**

**1 · O fundo 'burro' ganha do gestor bem pago.** — Em 20 anos, cerca de 92% dos fundos ativos perdem pro índice. Não é falta de talento: é aritmética.
> id: `compre-o-palheiro` · afirmação 99/101 chars · EN: The 'dumb' fund beats the well-paid manager.

**2 · Investimento: você perde pro seu próprio fundo.** — Duas goteiras drenam o retorno: a taxa, que compõe todo ano, e o seu timing — 1,1 a 1,7 ponto por ano.
> id: `duas-goteiras` · afirmação 102/108 chars · EN: Investing: you lose to your own fund.

**3 · Independência financeira: existe um número.** — Junte 25 vezes o seu gasto anual e chegou lá. Quem te leva é a sua taxa de poupança, não o mercado.
> id: `vinte-e-cinco-vezes` · afirmação 99/97 chars · EN: Financial independence: there's a number.

Notas do cortador:
- Pool de fontes = 1 URL só (SPIVA, que é o source_url e também a única linha :::source). As três ideias citam ela; Sharpe 1991, Kinnel/Morningstar, Bengen 1994, Estudo Trinity 1998 aparecem nomeados no corpo, sem link, porque o artigo não linka nenhum deles.
- Mantive taxa + mão nervosa numa ideia só ('as duas goteiras', como o artigo faz): separar daria 4 ideias e estoura o teto 3 do explainer.
- Cortei o trecho lump-sum vs custo médio (Vanguard, ganha 2/3 das vezes) — repete o 'não tente acertar o timing' da ideia 2 — e a estatística 'metade das pessoas 50+ erra pergunta de juros compostos', que vem sem estudo nomeado.
- Headline 1 do reels-spec entrou literal; as headlines 2 e 3 ganharam prefixo de tema ('Investimento:', 'Independência financeira:') pra passar em idea_title_no_context fora do material.

---

## glossary-nutrition · explicação · saúde · 3 ideia(s)

**Comida não é só caloria**

**1 · Mesmas calorias. Fomes diferentes.** — Com calorias e macros igualados, o ultraprocessado fez 20 adultos comerem 508 calorias a mais por dia — sem perceber.
> id: `ultraprocessado-come-mais` · afirmação 117/119 chars · EN: Same calories, different appetites.

**2 · A guerra das dietas: um placar incômodo.** — Stanford sorteou 609 pessoas entre low carb e low fat: empate em um ano. O que decide é quanto tempo você mantém.
> id: `guerra-das-dietas` · afirmação 113/112 chars · EN: The diet wars: an awkward scoreboard.

**3 · Comida: esqueça a dieta, guarde três números.** — Três números bastam: 25-30 g de fibra por dia, 1,6 g de proteína por quilo se você treina, açúcar livre abaixo de 10%.
> id: `tres-numeros-da-comida` · afirmação 118/111 chars · EN: Food: forget the diet, keep three numbers.

Notas do cortador:
- Pool de fontes tem UMA URL só: source_url e a única linha :::source são o mesmo Hall et al., 2019 (Cell Metabolism). As três ideias citam ela; DIETFITS (JAMA 2018), Johnston (JAMA 2014), Morton (BJSM 2018) e a revisão de 185 estudos na The Lancet ficam nomeados dentro do corpo, sem URL inventada.
- Considerei uma 4ª ideia só sobre a régua dos 3.500 kcal e a adaptação metabólica — dobrei dentro da ideia 2 (mesma âncora e mesma ação: escolher o que você sustenta), e o teto de explainer é 3 de qualquer jeito.
- Headline 1 do reels-spec reaproveitada literal no título 1; as headlines 2 e 3 ganharam dois-pontos pra nomear o assunto fora do material ("A guerra das dietas: …", "Comida: …") e passarem em idea_title_no_context.
- Cortei da ideia 1 o dado Steele/NHANES (58% das calorias, 90% do açúcar): é contexto, não mecanismo nem ação. Mantive a ressalva honesta de que o n=20 prova "come mais", não doença em 20 anos.

---

## glossary-romance · explicação · vínculos · 3 ideia(s)

**O que realmente mantém o amor vivo**

**1 · No casal, meio segundo vale mais que o jantar.** — Vale a frequência das respostas pequenas, não o tamanho do gesto: casais estáveis ficam em 5 positivos pra 1 negativo.
> id: `bids-de-conexao` · afirmação 118/104 chars · EN: In a couple, half a second beats a big dinner.

**2 · Casal: o verdadeiro teste não é a queda.** — Nos estudos de Gable, comemorar junto a boa notícia previu mais intimidade que o apoio na hora ruim.
> id: `comemorar-a-vitoria` · afirmação 100/105 chars · EN: Couples: the real test isn't the fall.

**3 · Amor: o sentimento é invisível pro parceiro.** — Sustentar uma relação é um conjunto de cinco comportamentos, não um sentimento — e todos dão pra fazer cansado.
> id: `manutencao-e-comportamento` · afirmação 111/104 chars · EN: Love: your partner can't see what you feel.

Notas do cortador:
- Pool de fontes mínimo: o artigo tem UMA url (source_url = :::source, Gottman & Levenson 1992). As 3 ideias citam a mesma — Gable, Aron, Stafford & Canary e a síntese de 165 estudos são nomeados no corpo, sem url inventada (mesmo padrão dos outros glossários já aprovados).
- Aron/autoexpansão foi FUNDIDA na ideia 2 (não cortada): explainer tem teto 3 e os main_points do drafter já a juntavam com Gable sob o fio 'o vínculo se constrói nos momentos bons'. A afirmação carrega só Gable; a novidade vive no corpo com a ação ('marque algo que vocês não fazem sempre').
- Cortados por orçamento: (a) a ressalva dos '94% de acerto' de Gottman — nenhuma ideia faz afirmação de previsão, então o hedge ficou sem função; (b) o 'sufocamento do casamento' de Finkel — explica o porquê, mas não entrega mecanismo, número nem ação próprios.
- Não usei número para os bids: os percentuais 86%/33% vêm hedgeados no artigo ('amostras pequenas, direção mais que número fechado'), então a ideia 1 ancora no 5:1 peer-reviewed. Os títulos 2 e 3 usam a forma 'tema: afirmação' porque as manchetes dos reels ('O verdadeiro teste do casal não é a queda', 'O sentimento é invisível') não sobreviviam fora do material.

---

## summary-good-life · resumo · vínculos · 3 ideia(s)

**A Vida Boa: o que 85 anos revelam**

**1 · Aos 50, já dá pra ver quem chega bem aos 80.** — Quem estava mais satisfeito com as relações aos 50 foi quem chegou mais saudável aos 80. Previu — não causou.
> id: `relacao-preve-saude` · afirmação 109/104 chars · EN: At 50, you can already tell who thrives at 80.

**2 · Relações: não é quantas você tem. Nunca foi.** — Protege o calor do laço, não a contagem: nos casais de 80 anos, a dor só derrubava o humor nos casamentos ruins.
> id: `calor-nao-contagem` · afirmação 112/106 chars · EN: Relationships: it was never about how many.

**3 · Vínculos: você treina o corpo. E quem você ama?** — Vínculo é músculo: atrofia sem uso e some sem briga nenhuma. Mande hoje a mensagem que você vem adiando.
> id: `fitness-social` · afirmação 104/102 chars · EN: Bonds: you train your body. And your people?

Notas do cortador:
- Pool de fontes é de UM link só: source_url == a única linha :::source (the-good-life-book.com). As três ideias citam o livro; Holt-Lunstad (2010), o sub-estudo dos 47 casais e a Psychology Today aparecem nomeados no corpo do texto, porque o artigo não linka nenhum deles.
- Cortei uma 4ª ideia candidata (o viés da amostra: 724 homens brancos, Harvard dos anos 1930, 'leve o mapa, desconfie das coordenadas'). Ela repetia a ressalva 'prevê, não causa' da ideia 1 — virou prosa dentro dela em vez de card próprio.
- Mantive os dois hedges do artigo: a comparação com o colesterol sai das entrevistas de Waldinger, não de uma tabela publicada; e o W.I.S.E.R. é invento didático dos autores, sem efeito medido em laboratório.
- Ponto fino: o corpo PT/EN da ideia 2 está em 179 palavras, encostado no teto de 180 — qualquer acréscimo de revisão precisa vir com um corte junto.

---

## summary-psychology-of-money · resumo · riqueza · 4 ideia(s)

**Dinheiro é comportamento, não planilha**

**1 · O diploma era dele. Os milhões, dela.** — O que separa quem enriquece não é diploma nem QI: é comportamento — e ele vem da sua biografia, não da planilha.
> id: `comportamento-vence-diploma` · afirmação 112/110 chars · EN: He had the diploma. She had the millions.

**2 · Riqueza: ficar rico não ensina a manter.** — Ficar rico premia otimismo e aposta. Continuar rico premia o oposto: humildade, frugalidade e medo da virada.
> id: `continuar-rico` · afirmação 109/111 chars · EN: Wealth: getting rich won't keep you rich.

**3 · Investir: seu fundo rendeu mais que você.** — Comprar na alta e vender na baixa cobra 1,1 ponto ao ano: o fundo médio rendeu 7,3%; o investidor, 6,3% (Morningstar).
> id: `gap-comportamental` · afirmação 118/117 chars · EN: Investing: your fund earned more than you.

**4 · Comportamento vence conhecimento? Meia verdade.** — Os dois importam: 76 experimentos com 160 mil pessoas mostram que educação financeira muda comportamento mesmo.
> id: `educacao-financeira-funciona` · afirmação 111/107 chars · EN: Behavior beats knowledge? Half true.

Notas do cortador:
- Pool de fontes tem UMA url só: `source_url` e a única linha `:::source` são o mesmo link da Harriman House. As 4 ideias citam esse link e os estudos nomeados (Malmendier & Nagel 2011, Morningstar 'Mind the Gap 2024', Kaiser/Lusardi 76 RCTs, resenha da Shortform) ficam no corpo, como manda a regra 9.
- Cortei uma 5ª ideia (viés de mercado americano: 'compre um índice' pressupõe bolsa profunda; paper de 2025 sobre a Indonésia; 'guarde o princípio, troque o instrumento') — é o takeaway 3 do material, mas o card ficaria sobre o LIVRO, não sobre o leitor, e perde sentido fora do material. Se o mantenedor quiser 5, esse é o candidato pronto.
- Dividi a seção 2 do artigo em duas ideias (ficar rico × continuar rico, com Livermore e o 'suficiente'; e o gap comportamental, com o número da Morningstar) — movimentos distintos, ações distintas. As seções 1 e 3 viraram uma ideia cada.
- Reusei 2 das 3 headlines aprovadas do reels-spec: a #1 inteira na ideia 1 e a #2 com prefixo de tema ('Investir: seu fundo rendeu mais que você.') pra passar no idea_title_no_context. A #3 ('10 milhões de cópias — e uma meia verdade') virou 'Comportamento vence conhecimento? Meia verdade.' — a original não nomeia o assunto fora do material.

---

## weak-ties-job-search · explicação · riqueza · 3 ideia(s)

**O emprego vem do conhecido, não do amigo**

**1 · Quem mais quer te ajudar é quem menos consegue.** — Seu círculo próximo é fechado e recicla a mesma informação: a vaga que chega neles já tinha chegado em você.
> id: `circulo-fechado` · afirmação 108/110 chars · EN: The ones most eager to help you help the least.

**2 · Emprego: nem o amigo próximo nem o estranho.** — No sorteio do LinkedIn com 20 milhões de perfis, a chance de emprego foi maior perto de 10 conhecidos em comum.
> id: `curva-u-invertido` · afirmação 111/97 chars · EN: Job leads: neither the friend nor the stranger.

**3 · Rede: você não precisa conhecer mais ninguém.** — Contatos com quem você não fala há anos deram conselho mais novo e mais útil que os ativos — com a confiança intacta.
> id: `laco-adormecido` · afirmação 117/114 chars · EN: Network: you do not need to meet anyone new.

Notas do cortador:
- Pool de fontes tem só 3 links (Rajkumar DOI = source_url, Granovetter JSTOR, Levin JSTOR) — uma fonte por ideia. Burt e o "buraco estrutural" não têm link no material, ficaram citados apenas no corpo da ideia 1, como o artigo faz.
- Cortados por não sustentarem ideia própria: a nota ética do experimento (20 mi sem consentimento específico) e a faixa 10%-45% de contratações por indicação (relatórios de RH, número solto). Ambos estouravam o corpo sem mudar o que o leitor faz.
- O dado de 1974 (≈83% viam o contato só de vez em quando ou raramente) entrou na ideia 1 já com o hedge do artigo — 282 respostas, só de homens, fundação da teoria e não medida do mercado atual.
- Manchetes do reels-spec reusadas nas ideias 1 e 3; na 2 a aprovada ("Existe um número certo de conexões em comum") foi descartada porque, fora do material, sugere número total de contatos e não conhecidos em comum. Ideias 2 e 3 ganharam prefixo de tema ("Emprego:", "Rede:"/"Network:") pra passar em idea_title_no_context.

---

## ten-second-balance-test · explicação · corpo · 3 ideia(s)

**Dez segundos num pé só**

**1 · Equilíbrio: o sistema que a academia não treina.** — Aos 51-55 anos, 4,7% não seguram dez segundos num pé só. Aos 71-75, 53,6% — e musculação não cobre isso.
> id: `capacidade-que-some` · afirmação 104/103 chars · EN: Balance: the system your gym never trains.

**2 · Teste dos dez segundos: alarme, não sentença.** — O ritmo de morte 84% maior vem de um estudo só; a meta-análise de 15 estudos dá 14%. É alarme, não sentença.
> id: `numero-honesto` · afirmação 108/107 chars · EN: The ten-second test: an alarm, not a sentence.

**3 · Perna pior: o número que a média apaga.** — Doze segundos de um lado e quatro do outro não viram oito: o lado pior é o que cede primeiro. Anote os dois.
> id: `diferenca-entre-as-pernas` · afirmação 108/109 chars · EN: Weaker leg: the number the average erases.

Notas do cortador:
- Pool de fontes raquítico: source_url e a única linha :::source são o MESMO link (Araújo et al., 2022 · BJSM). As três ideias citam ele. Mayo/Kaufman 2024 (n=40), a meta-análise de Das et al. (Research on Aging, 2024) e a revisão Cochrane (81 ensaios, 19.684) ficam citadas no corpo, como o artigo faz — nenhuma tem URL no material.
- 3 ideias = os 3 main_points. Considerei quebrar a seção 2 em duas (número honesto | mecanismo dos três sistemas), mas o teto de explainer é 3 e o mecanismo rende mais onde vira ação: ficou na ideia 3, explicando por que treinar é tirar uma entrada por vez.
- Os 3 headlines aprovados dos reels foram reusados com prefixo de assunto pra sobreviverem fora do material: 'O sistema que a academia não treina' → 'Equilíbrio: …'; 'Um alarme não é uma sentença' → 'Teste dos dez segundos: alarme, não sentença'; 'O seu lado pior sabe algo que a média apaga' → 'Perna pior: o número que a média apaga'.
- Risco de catálogo (registrado no reasoning_log da revisão 2): glossary-dexterity já publica o MESMO estudo âncora e o mesmo 84%. Aqui o 84% só aparece na ideia 2 e sempre em par com o 1,14 da meta-análise (é a correção de honestidade, não o dado de venda) — vale conferir o ideas-spec de Destreza pra não repetir a estatística solta.

---

## grip-strength-longevity · explicação · corpo · 3 ideia(s)

**Seu aperto de mão sabe demais**

**1 · Sua mão prevê melhor que o aparelho de pressão.** — Em 142.861 adultos, cada 5 quilos a menos de aperto vieram com 16% mais risco de morrer.
> id: `aperto-bate-a-pressao` · afirmação 88/87 chars · EN: Your hand predicts better than the cuff.

**2 · Preensão: a mão não é o músculo que importa.** — Quando o aperto cai, quase nunca é a mão: é o corpo inteiro descendo junto.
> id: `mao-nao-e-o-musculo` · afirmação 75/72 chars · EN: Grip: the hand isn't the muscle that matters.

**3 · Musculação: o mínimo que funciona é ridículo.** — Treino de força aparece com 10 a 20% menos risco de morte, concentrado em 30 a 60 minutos por semana.
> id: `dose-minima-de-forca` · afirmação 101/103 chars · EN: Lifting: the minimum that works is embarrassing.

Notas do cortador:
- Pool de fontes = 1 URL só: o source_url e o único :::source do corpo são o mesmo Leong et al. 2015 (PubMed). As três ideias citam ele; Momma (BJSM 2022), Androulakis-Korakakis (2020), Sayer & Kirkwood e o corte EWGSOP2 ficam citados no texto, sem URL — a ideia 3 é a que mais sente isso (os números dela não têm link próprio no artigo).
- Cortei uma 4ª ideia sobre sarcopenia + cortes populacionais (27/16 kg europeus vs. medianas sul-americanas 45/29 kg): sem mecanismo nem ação próprios, virou o fecho 'régua, não diagnóstico' da ideia 2.
- Das headlines aprovadas, só a do reel 3 sobreviveu, com prefixo de tema ('Musculação:' / 'Lifting:'). As dos reels 1 e 2 ('O aparelho certo não é o de pressão', 'Melhorar o número não melhora você') perdem o assunto fora do material — troquei por ganchos que nomeiam mão/preensão.
- Os image_briefs evitam de propósito o mostrador do dinamômetro (números viram texto na renderização): a ideia 1 mostra o cabo de metal apertado contra o manguito desinflado ao fundo.

---

## play-deprivation-adults · explicação · ofício · 3 ideia(s)

**Brincar não é sobra de tempo**

**1 · Brincar fica na mesma prateleira do medo.** — Brincar não é escolha de lazer: é um dos sete sistemas emocionais primários, na mesma lista que medo e luto.
> id: `instinto-nao-passatempo` · afirmação 108/108 chars · EN: Play sits on the same shelf as fear.

**2 · Ratos sem brincar: o freio do cérebro afrouxa.** — Ratos criados sem brincar viraram adultos menos flexíveis, com freio pré-frontal mais fraco. Em gente, só correlação.
> id: `freio-pre-frontal` · afirmação 117/113 chars · EN: Play-starved rats: the brain's brakes weaken.

**3 · Brincar: dez minutos, sem saber como termina.** — Brincadeira se define pelo final em aberto, não pelo tamanho do bloco: dez minutos com outra pessoa já contam.
> id: `final-em-aberto` · afirmação 110/103 chars · EN: Play: ten minutes, no idea how it ends.

Notas do cortador:
- Pool de fontes pobríssimo: o material tem UM link só (source_url = :::source = Bijlsma et al., J. Neurosci. 42(46):8716–8728). As três ideias citam esse mesmo URL, com rótulos diferenciados; Panksepp & Burgdorf 2000, Panksepp et al. 2003, Proyer 2017 e Current Psychology 2022 ficam citados inline no corpo, como manda a regra 9.
- Cortei uma 4ª ideia candidata ("a prova mais forte não é sobre você": qualidade de evidência + piloto dos 26 assassinos do Stuart Brown). Explainer tem teto 3, então a desmontagem do mito da violência entrou como último parágrafo da ideia 2, junto do caveat filhote→adulto.
- O estudo de coping (Current Psychology, 2022) ficou de fora: é transversal, autorrelatado e sem autores no artigo — não sustentava afirmação de card sozinho. A ponte humana aparece via Proyer (1.796 adultos) na ideia 3, com a ressalva de que mede traço, não privação.
- Dos três headlines aprovados no reels-spec, nenhum entrou verbatim: os dois primeiros dependem de pronome ("isso", "a prova") e o terceiro não nomeia o assunto — reescrevi no formato "tema: afirmação" pra sobreviver em Minhas ideias/Explorar. Sem sobreposição com as ideias já publicadas de non-instrumental-play e glossary-play (aquelas são sobre descanso/overjustification; estas, sobre o circuito instintivo).

---

## attention-residue · explicação · mente · 3 ideia(s)

**Você fechou a reunião. Sua atenção não.**

**1 · A reunião ruim não estraga a reunião.** — Parte do foco continua na tarefa anterior e você decide pior na seguinte — mesmo fazendo uma coisa só.
> id: `residuo-cobra-da-proxima` · afirmação 102/108 chars · EN: The bad meeting doesn't wreck the meeting.

**2 · Foco: terminar não solta a sua cabeça.** — Quem terminou sob pressão soltou melhor a tarefa: o que libera a atenção é o loop fechado, não o trabalho pronto.
> id: `terminar-nao-e-fechar` · afirmação 113/111 chars · EN: Focus: finishing doesn't free your head.

**3 · Foco: 23 minutos pra voltar? Sem fonte.** — Ninguém acha os 23 minutos num artigo revisado por pares: o número nasceu em entrevistas e virou fato por repetição.
> id: `numeros-sem-artigo` · afirmação 116/118 chars · EN: Focus: 23 minutes to refocus? No paper.

Notas do cortador:
- Pool de fontes é de UMA URL só: o artigo tem um único :::source (Leroy 2009, DOI obhdp) e source_url é o mesmo DOI. As três ideias citam ele. Leroy & Glomb 2018 (Organization Science, 202 profissionais), Rubinstein/Meyer/Evans 2001, Leroy & Schmidt 2016 e a meta-análise de 2025 estão nomeados NO TEXTO, sem URL — o artigo nunca linkou nenhum. Se o mantenedor quiser, vale enriquecer o pool no material antes do próximo corte.
- As 3 ideias = os 3 main_points do drafter, sem forçar: cada uma tem mecanismo próprio (decisão lexical / pressão de tempo / procedência dos números) e ação própria. Cortei uma 4ª candidata sobre Leroy & Schmidt 2016 (foco regulatório: resíduo pior no modo 'não posso errar') — é modulador do mesmo achado da ideia 2 e o artigo não dá número nenhum pra ela; ficaria vaga e repetiria a ideia 2. Explainer com 3 já está no teto do orçamento.
- Títulos reaproveitam os 3 headlines aprovados do reels-spec. Os de ordinal 2 e 3 ganharam o prefixo 'Foco:' pra sobreviver fora do material (idea_title_no_context) — o headline original 'Terminar não solta a sua cabeça.' e '23 minutos pra voltar ao foco? Sem fonte.' não compartilham palavra ≥5 letras com o título do material.
- A ideia 1 é a única sem número — o artigo deliberadamente não publica o n dos experimentos de 2009 (o próprio reasoning_log diz que o dossiê veta inventar). Ela carrega mecanismo + ressalva (laboratório, amostra universitária, sem replicação independente) em vez de estatística; o único número de lastro do material (202 profissionais) está na ideia 2, com o estudo nomeado na mesma frase.

---

## ikea-effect · explicação · ofício · 3 ideia(s)

**A estante torta que você não joga fora**

**1 · O apego não está na estante.** — O apego gruda em você, não no objeto: quem dobrou o próprio origami torto cobrou cinco vezes mais por ele.
> id: `apego-no-montador` · afirmação 106/113 chars · EN: The attachment isn't in the shelf.

**2 · Efeito IKEA: 63% a mais? O número encolheu.** — Somando 55 estudos e 5.454 pessoas, o efeito é moderado: em 2 de 3 vezes quem montou valoriza mais que um estranho.
> id: `tamanho-real` · afirmação 115/113 chars · EN: IKEA effect: 63% more? The number shrank.

**3 · Seu projeto: o elogio mente, o preço não.** — Você não é juiz confiável do que fez: peça um preço, não uma opinião — elogio é de graça, número não.
> id: `preco-em-vez-de-opiniao` · afirmação 101/117 chars · EN: Your project: compliments lie, prices don't.

Notas do cortador:
- Pool de fontes é de UM link só: o `source_url` é idêntico ao único `:::source` do corpo (DOI de Norton, Mochon & Ariely 2012). As três ideias citam essa mesma URL, com rótulo diferenciado por ideia. A meta-análise de Pelled (Psychology & Marketing, 2026, d = 0,57) e as canecas de Kahneman/Knetsch/Thaler (1990) são nomeadas no artigo sem link — ficaram citadas no TEXTO do corpo, não inventei URL.
- Cortei o contraste com o efeito de posse (canecas de café) e o achado de competência ameaçada (Mochon, Norton & Ariely, 2012): são contexto e não mudam o que o leitor sabe depois das 3 ideias — viravam ideia 4 num explainer com teto 3.
- Ideia 1 funde os dois movimentos da seção 1 (o erro de preço do origami + o valor extra só pousar na coisa pronta, estudos 3 e 4) e mantém a ressalva do artigo sobre a replicação com kits de artesanato, que achou apego mesmo em trabalho não terminado.
- Títulos 2 e 3 são as headlines aprovadas dos reels com prefixo de assunto ('Efeito IKEA:' e 'Seu projeto:') pra passar em idea_title_no_context fora do material; a headline 1 entrou intacta (já carrega 'estante').

---

## cbt-i-vs-sleep-hygiene · explicação · saúde · 3 ideia(s)

**Quarto escuro não cura insônia**

**1 · Você cumpriu a lista do sono. E segue acordado.** — A lista de higiene do sono não trata insônia crônica. Desde 2016 a primeira linha é a terapia cognitivo-comportamental.
> id: `lista-nao-e-tratamento` · afirmação 119/116 chars · EN: You kept the sleep checklist. Still awake.

**2 · Insônia: menos tempo na cama, não mais.** — Encolher o tempo na cama até o sono que você realmente tem cortou 26 minutos de vigília no meio da noite.
> id: `menos-tempo-na-cama` · afirmação 105/116 chars · EN: Insomnia: less time in bed, not more.

**3 · Antes de encurtar o sono: um filtro médico.** — Ronco alto ou cansaço depois de oito horas na cama pedem médico antes: restringir sono não trata apneia.
> id: `filtro-da-apneia` · afirmação 104/116 chars · EN: Before you shorten sleep: a medical filter.

Notas do cortador:
- Pool de fontes magro: só 2 URLs (Qaseem/ACP 2016 e Edinger/AASM 2021). Trauer 2015, Castro 2013, Irish 2015, Bootzin 1972, Spielman 1987 e a entrevista da Colleen Carney são nomeados no corpo das ideias, sem URL, porque o artigo não os linka.
- Cortei uma 4ª ideia sobre controle de estímulo (Bootzin, 1972 — a cama vira sinal de vigília): o teto do explainer é 3 e ela perdeu para o filtro clínico da apneia, que é o conteúdo que evita dano. O que se perdeu foi a ação 'cama só pra dormir e pra sexo / levante após 20 min'; se preferir, ela troca de lugar com a ideia 2.
- Títulos reaproveitam os três ganchos já aprovados no reels-spec: o 1 ganhou 'do sono', o 2 e o 3 ganharam prefixo de tema/dois-pontos para valer sozinhos em Minhas ideias e no Explorar.
- Os image_briefs fogem de propósito do quarto com cortina e criado-mudo: a capa DESTE material é uma das três style-refs, e um brief de quarto faria o modelo copiar a referência.

---

## protein-distribution-30g-myth · explicação · saúde · 3 ideia(s)

**O teto de 30g de proteína não existe**

**1 · O estudo dos 30g nunca olhou o intestino.** — Você absorve tudo. O que satura é o sinal de construção do músculo — e com 100 gramas de uma vez, nem ele mostrou teto.
> id: `nao-existe-teto-de-absorcao` · afirmação 119/111 chars · EN: The 30g study never looked at your gut.

**2 · Proteína: 30 gramas nunca foi o seu número.** — O gatilho não é o total do prato: são 2,5 a 3 gramas de leucina por refeição, e ele sobe com a idade.
> id: `gatilho-da-leucina` · afirmação 101/98 chars · EN: Protein: 30 grams was never your number.

**3 · Proteína: o prato a consertar não é o jantar.** — A mesma proteína do dia, dividida igual entre as refeições, rendeu 25% mais construção muscular em 24 horas.
> id: `buraco-do-cafe-da-manha` · afirmação 108/100 chars · EN: Protein: the plate to fix isn't dinner.

Notas do cortador:
- Pool de fontes tem só 2 URLs (Trommelen 2023 DOI + Mamerow 2014 PubMed). Moore 2009/2015, Areta 2013 e Schoenfeld/Aragon/Krieger 2013 o artigo cita sem link, então foram citados DENTRO do corpo; a ideia 2 (cujas âncoras não são linkáveis) leva as duas fontes do pool.
- 3 ideias = as 3 main_points do drafter, sem esticar. Cortei um 4º candidato (o desmentido da janela anabólica de meia hora): é correção sem número próprio nem ação, e repetiria o freio 'total primeiro' da ideia 3.
- Títulos: reel 1 reaproveitado verbatim; reel 3 com prefixo 'Proteína:' pra sobreviver fora do material; reel 2 ('Existe um interruptor. Você liga uma vez.') descartado porque o gancho 'uma vez por dia' é a afirmação da ideia 3, não da 2.
- Ficou de fora por espaço: a réplica de 2024 no IJSNEM (mulheres treinadas quase não aparecem nas amostras). Se o revisor quiser esse caveat, o lugar natural é a ideia 3, que já carrega o freio do total diário.

