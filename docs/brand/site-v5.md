# perceva.app v5 — especificação e copy final (pt-BR + en-US)

Redação-chefe de site do painel de 2026-09-12. Deriva de `playbook/00-espinha.md` (decisões fechadas), `research/fidelidade-produto.md` (§1–3), `research/vocabulario.md` (§4.1), `research/mercado-posicionamento.md` (§E), das cópias do v4 (`site-pt-copy.txt`, `site-en-copy.txt`), das ideias reais do Recanto (`learning-drops/ideas-specs/`) e do `README.md` do repo `perceva-site` (§1). Sem web: tudo que não está nesses arquivos aparece como **[a confirmar: motivo]**.

**Objetivo do site v5:** download no Android agora; e-mail de quem tem iPhone.
**Regras herdadas:** single-file HTML, paleta fixa (`--bg #0F0F1E · --surface #1B1B33 · --violet #7C5CFC · --gold #E8B04B · --sand #ECEAF6 · --dim #9A98B4 · --line #282844`), Fraunces + Inter via Google Fonts como única dependência, sem framework, sem CDN, `/en/` canônico com `hreflang` pareado, **mudou numa língua, muda na outra na mesma PR**.
**Regras editoriais:** lista negra da espinha §7 integral; nunca "teste psicológico" / "avaliação psicológica"; instrumentos sempre como "inspirado no modelo Big Five (120 itens)", "baseado na teoria de valores de Schwartz", "escala baseada no ECR-R"; DISC/Tipos, Social e Momentum não aparecem; nenhuma data de iOS; nenhum "assine agora"; números só os dos dossiês, com autor e ano quando científicos.

---

## 1. Diagnóstico do v4 (o que fica, o que sai, o que falta)

1. **Manter:** hero "Perceba quem você está se tornando."; a abertura d'O espelho ("Todo app ou te diz quem você é, ou conta o que você fez"); "Sem punição, sem culpa, no seu ritmo" (a alegação mais fiel do site); o bloco de privacidade; o fecho "Cada dia treina alguém em você"; a arquitetura single-file bilíngue.
2. **Infidelidade 1 — Momentum:** 4 menções por idioma (retrato ii, card Constância, plano Gratuito, `featureList`). Dormente desde 2026-08-28. Sai; entra "Dia fechado · nada zera".
3. **Infidelidade 2 — Missões e Habilidades como padrão:** são módulos default OFF. Saem do núcleo (retratos ii/iii, legenda "Hábitos e missões", "3 missões ativas"); viram uma linha de módulos opcionais.
4. **Infidelidade 3 — "testes psicológicos de verdade" / "instrumentos psicológicos":** termo de uso restrito a psicólogos no Brasil. Vira "testes de personalidade, valores e vínculo" / "instrumentos de autoconhecimento", sempre com nome.
5. **Infidelidade 4 — "Leituras curtas":** subvende o Recanto (ideias com imagem, fontes, card que vira, áudio e vídeo em parte do catálogo). Sai.
6. **Infidelidade 5 — "lado a lado na aba Eu":** o espelho é o contorno da percepção **sobreposto** ao hexágono do que você pratica. Corrigir texto e captura.
7. **Infidelidade 6 — screenshots de 2026-07-13, em inglês, nas duas línguas:** trocar por dois conjuntos (pt e en) da build atual.
8. **Falta 1 — Conector:** a peça única da proposta não está no site.
9. **Falta 2 — Recanto em ideias:** título-gancho, afirmação, fonte, card que vira, Explorar que acaba.
10. **Falta 3 — medir:** humor em um toque, calendário com frentes, Padrões em 90 dias. O site não tem nenhuma tela de medição.
11. **Falta 4 — "há quantos dias":** a metade do Cofre que ninguém conta.
12. **Falta 5 — CTA real:** "Em breve" nas duas lojas é vazamento; vira Android disponível + iPhone "avise-me".

---

## 2. Mapa de seções (na ordem)

| # | id | Seção | Objetivo em uma linha |
|---|---|---|---|
| 0 | `nav` | Barra | Levar ao download em um toque de qualquer ponto da página. |
| 1 | `hero` | Hero | Dizer a tese em uma frase, mostrar o hexágono com contorno, oferecer os dois CTAs (Android / iPhone avise-me). |
| 2 | `tres-coisas` | Faixa de completude | Dizer "tudo" sem dizer "tudo": três coisas que sempre viveram separadas. |
| 3 | `espelho` | O espelho | Explicar a diferença entre o que você acha e o que você faz — sobrepostos no mesmo hexágono. |
| 4 | `retratos` | Três retratos | Dar o método público (Perceber · Praticar · Tornar-se) e o ritual (medir → praticar → re-olhar). |
| 5 | `meca` | Meça | Provar que a sensação mente e mostrar as três telas de medição (calendário, humor, Padrões). |
| 6 | `conector` | Conector | Apresentar o assistente que te conhece, com três perguntas reais e a linha de privacidade. |
| 7 | `recanto` | Recanto | Mostrar a unidade "ideia" com três ideias reais e o card que vira. |
| 8 | `ferramentas` | Caixa de ferramentas | Listar o que é padrão; módulos opcionais em uma linha. |
| 9 | `cofre` | Cofre | Recompensa que você define — e "há quantos dias". |
| 10 | `privacidade` | Privacidade | Manter o bloco e acrescentar a frase do Conector. |
| 11 | `planos` | Planos | Gratuito lidera; Premium nomeado, "Em breve". |
| 12 | `baixar` / `iphone` | Lojas | Dois estados: Android disponível; iPhone com formulário de e-mail. |
| 13 | `faq` | Perguntas frequentes | Tirar as seis objeções que travam o download. |
| 14 | `footer` | Rodapé | Links legais + disclaimer sem termo restrito. |

Os ids são os mesmos nas duas línguas (simplifica `_redirects`, links de vídeo e QA de paridade).

---

## 3. Copy final, seção a seção

Convenções: **H** = headline, **S** = sub/lead, **B** = corpo, **•** = bullet, **µ** = microcopy, **CTA** = botão, **alt** = texto alternativo da imagem, **fig** = tela de referência (numeração da §5). O EN é nativo, não tradução; o que importa é dizer a mesma coisa com o mesmo peso.

### 3.0 Nav

| Elemento | pt-BR | en-US |
|---|---|---|
| Logo | Perceva (marca, link para `#hero`) | Perceva |
| Links | Como funciona (`#espelho`) · Meça (`#meca`) · Conector (`#conector`) · Recanto (`#recanto`) · Planos (`#planos`) · Suporte (`/suporte`) | How it works · Measure · Connector · Learn · Plans · Support (`/support`) |
| Troca de idioma | EN → `/en/` | PT → `/` |
| CTA | **Baixar no Android** → ficha da Play | **Get it on Android** |

### 3.1 Hero (`#hero`)

| Elemento | pt-BR | en-US |
|---|---|---|
| Kicker | App de hábitos e autoconhecimento | Habits & self-knowledge app |
| **H1** | **Perceba quem você está se tornando.** | **See who you're becoming.** |
| S | Cada dia treina alguém em você. O Perceva mostra isso em números — seis áreas da vida com nota, testes de personalidade, valores e vínculo com nome (Big Five, Schwartz, ECR-R) e a diferença entre o que você acha e o que você faz. Sem punição, sem culpa, no seu ritmo. | Every day trains someone in you. Perceva shows it in numbers — six life areas, each with a score; named tests of personality, values and attachment (Big Five, Schwartz, ECR-R); and the gap between what you think you do and what you do. No punishment, no guilt, at your own pace. |
| CTA primário | **Baixar no Android** → `https://play.google.com/store/apps/details?id=perceva.app` **[a confirmar: listagem pública da Play ativa; até lá ver estado B em 3.12]** | **Get it on Android** |
| CTA secundário | Tenho iPhone — me avise → `#iphone` | I'm on iPhone — notify me → `#iphone` |
| µ (sob os botões) | Grátis pra começar. Sem anúncios. Entra com e-mail e código. | Free to start. No ads. Sign in with email and a code. |
| Chips das seis áreas | Saúde · Corpo · Mente · Prosperidade · Vínculos · Ofício (lazer e construir) | Health · Body · Mind · Wealth · Bonds · Craft (play and build) |
| fig | **1** — Eu › Praticada: hexágono da Dedicação com o contorno da percepção (pt) | **1** (en) |
| alt | Aba Eu do Perceva: hexágono das seis áreas preenchido pelo que você pratica, com o contorno de como você se vê por cima | Perceva's Me tab: a six-area hexagon filled by what you practice, with the outline of how you see yourself on top |

### 3.2 Faixa de completude (`#tres-coisas`)

Uma faixa de largura total, fundo `--surface`, uma frase em Fraunces e três âncoras discretas embaixo.

| Elemento | pt-BR | en-US |
|---|---|---|
| Frase | **Um app que junta três coisas que sempre viveram separadas: o teste que te conhece, o hábito que você mede e a ideia que você lembra.** | **One app for the three things that never lived together: the test that knows you, the habit you measure, the idea you keep.** |
| Âncora 1 | o teste que te conhece → `#retratos` | the test that knows you → `#retratos` |
| Âncora 2 | o hábito que você mede → `#meca` | the habit you measure → `#meca` |
| Âncora 3 | a ideia que você lembra → `#recanto` | the idea you keep → `#recanto` |

### 3.3 O espelho (`#espelho`)

| Elemento | pt-BR | en-US |
|---|---|---|
| Kicker | O espelho | The mirror |
| **H2** | Todo app ou te diz quem você é, ou conta o que você fez. | Every app either tells you who you are, or counts what you did. |
| S | O Perceva cruza os dois — e é na **diferença** que você se percebe. | Perceva crosses the two — and the **difference** is where you see yourself. |
| B1 | De um lado, **como você se vê**: uma autoavaliação nas seis áreas da vida e testes de personalidade, valores e vínculo — com nome, não com selo. | On one side, **how you see yourself**: a self-assessment across six life areas and tests of personality, values and attachment — named, not badged. |
| B2 | Do outro, **o que você pratica**: cada prática concluída pontua as áreas que fortalece. É um registro honesto de onde a sua energia está indo de verdade. | On the other, **what you practice**: every practice you complete scores the areas it strengthens. An honest record of where your energy actually goes. |
| B3 | Os dois retratos ficam **sobrepostos no mesmo hexágono**, na aba Eu: o contorno de como você se vê, sobre o preenchimento do que você pratica. Quando batem, você está no caminho. Quando divergem, a distância aparece — antes de doer. | The two portraits sit **overlaid on the same hexagon**, in the Me tab: the outline of how you see yourself, over the fill of what you practice. When they match, you're on track. When they drift, the gap shows — before it hurts. |
| B4 | E o espelho não é o fim: o Perceva te dá as ferramentas pra mudar o reflexo. | And the mirror isn't the end: Perceva hands you the tools to change the reflection. |
| Legenda do hexágono | contorno = como você se vê · preenchimento = o que você pratica | outline = how you see yourself · fill = what you practice |
| Callout 1 (área Vínculos) | Vínculos — você se vê bem aqui, mas quase não pratica. Percebeu? | Bonds — you rate yourself high here, but barely practice it. Noticed? |
| Callout 2 (área Corpo) | Corpo — melhor do que você acha. Dê o crédito a si. | Body — better than you think. Give yourself credit. |
| fig | **1** em tamanho grande, ou o mesmo hexágono redesenhado em SVG inline com os dois callouts | idem |
| µ | Eu › Praticada, capturado no app. | Me › Practiced, captured in the app. |

### 3.4 Três retratos (`#retratos`)

| Elemento | pt-BR | en-US |
|---|---|---|
| Kicker | Como funciona | How it works |
| **H2** | Três retratos, uma jornada. | Three portraits, one journey. |
| S | A identidade não se descobre de uma vez. Ela se forma. | Identity isn't discovered all at once. It forms. |
| Intro | O Perceva parte de uma ideia simples: cada prática é um voto para a pessoa que você está se tornando. O caminho passa por três retratos — e volta ao começo toda semana: **medir, praticar, re-olhar.** | Perceva starts from a simple idea: every practice is a vote for the person you're becoming. The path runs through three portraits — and loops back every week: **measure, practice, look again.** |
| i · rótulo | Identidade Percebida | Perceived Identity |
| i · verbo | Perceber | See |
| i · B | Comece por onde você está. Autoavaliação nas seis áreas e um questionário de bem-estar, de graça. Quando quiser ir fundo, testes com nome: um inspirado no modelo Big Five (120 itens), um baseado na teoria de valores de Schwartz, uma escala baseada no ECR-R para vínculo. Sem julgamento, só clareza. | Start from where you are. A self-assessment across the six areas and a wellbeing questionnaire, free. When you want depth, named tests: one inspired by the Big Five model (120 items), one based on Schwartz's theory of values, a scale based on the ECR-R for attachment. No judgment, just clarity. |
| i · fig | **3** — Eu › Percebida | **3** |
| ii · rótulo | Identidade Praticada | Practiced Identity |
| ii · verbo | Praticar | Practice |
| ii · B | Transforme intenção em rotina. Práticas pontuam as áreas que fortalecem e a Dedicação só sobe. Se um dia não der, nada zera: pular também é decidir. Cada dia praticado é um voto que fica. | Turn intention into routine. Practices score the areas they strengthen, and Dedication only ever goes up. If a day slips, nothing resets: skipping is a decision too. Every day practiced is a vote that stays. |
| ii · fig | **2** — Hoje (saudação, práticas, faixa de humor, dia parcialmente fechado) | **2** |
| iii · rótulo | Identidade Desejada | Desired Identity |
| iii · verbo | Tornar-se | Become |
| iii · B | Trace o seu Norte: onde quer chegar em cada área, desenhado sobre o contorno de onde você está. Recompensas que você define e ideias com fonte pra chegar lá. Ferramentas para a pessoa que você decidiu construir. | Draw your North: where you want to get in each area, laid over the outline of where you are. Rewards you define and sourced ideas to get there. Tools for the person you've decided to build. **[a confirmar: string EN do app para "Norte"]** |
| iii · fig | **13** — Eu › Desejada com o Norte traçado (opcional; se não houver, a seção fecha com o diagrama) | **13** |
| Figura de fecho | Diagrama do ciclo (descrito na §5.2), legenda: "medir → praticar → re-olhar. Uma vez por semana basta." | "measure → practice → look again. Once a week is enough." |

### 3.5 Meça (`#meca`)

| Elemento | pt-BR | en-US |
|---|---|---|
| Kicker | Meça | Measure |
| **H2** | A sensação mente. O registro, não. | The feeling lies. The record doesn't. |
| S | Você acha que vai à academia três vezes por semana. Conta. | You think you hit the gym three times a week. Count. |
| Dado (pull-quote) | **62%** das pessoas dizem cumprir a meta de atividade física. No acelerômetro, **9,6%** cumprem. — Tucker et al., 2011 | **62%** of people say they meet the physical-activity guideline. On the accelerometer, **9.6%** do. — Tucker et al., 2011 |
| Card 1 · título | Calendário com frentes | A calendar with fronts |
| Card 1 · B | Um mês, três frentes: Rotina, Humor e Cofre. O filtro escolhe os dias; a frente escolhe o que ver deles. "O que resgatei nos meus dias ótimos?" é uma pergunta que o calendário responde. Toque num dia e veja o que aconteceu ali, sem sair do mês. | One month, three fronts: Routine, Mood and Vault. The filter picks the days; the front picks what to show about them. "What did I redeem on my great days?" is a question the calendar answers. Tap a day and see what happened there, without leaving the month. |
| Card 2 · título | Humor em um toque | Mood in one tap |
| Card 2 · B | Uma nota de 1 a 5. Tags e uma linha, se quiser. Sem pontos, sem cobrança. À noite, um lembrete opcional pergunta como foi o dia — e você desliga quando quiser. | A 1-to-5 rating. Tags and a line if you want. No points, no nagging. At night, an optional reminder asks how the day went — and you can switch it off anytime. |
| Card 3 · título | Padrões em 90 dias | Insights over 90 days |
| Card 3 · B | Depois de algumas semanas, o app mostra o que costuma vir junto com os seus dias bons — quais práticas, quais tags. E avisa, na mesma tela: **junto não é causa.** | After a few weeks, the app shows what tends to show up alongside your good days — which practices, which tags. And it says so on the same screen: **together isn't cause.** |
| µ | Registrar leva segundos. Olhar, uma vez por semana, é o que muda. | Logging takes seconds. Looking, once a week, is what changes things. |
| fig | **9** — Calendário, frente Humor com filtro aplicado e espiada do dia aberta; **10** — Padrões com o aviso de co-ocorrência | **9**, **10** |
| alt (9) | Calendário do Perceva na frente Humor: dias filtrados em destaque, os outros atenuados, e o painel do dia aberto embaixo do mês | Perceva's calendar on the Mood front: filtered days highlighted, the rest dimmed, and the day panel open under the month |
| alt (10) | Tela Padrões: o que costuma aparecer junto com os dias bons, com o aviso de que co-ocorrência não é causa | Insights screen: what tends to co-occur with good days, with the note that co-occurrence isn't cause |

### 3.6 Conector (`#conector`)

| Elemento | pt-BR | en-US |
|---|---|---|
| Kicker | Conector | Connector |
| **H2** | O assistente que te conhece. | The assistant that knows you. |
| S | Conecte o Perceva ao seu assistente de IA **(hoje, Claude)** e ele para de adivinhar: passa a ler o que você praticou, como esteve e há quantos dias. | Connect Perceva to your AI assistant **(today, Claude)** and it stops guessing: it reads what you practiced, how you've been, and how many days it's been. |
| Balão 1 (pergunta) | "Como foi meu mês?" | "How was my month?" |
| Balão 2 (pergunta) | "Meu humor tem a ver com o meu sono?" | "Does my mood track my sleep?" |
| Balão 3 (pergunta) | "Há quantos dias não resgato aquela recompensa?" | "How many days since I last redeemed that reward?" |
| Balão 4 (ditado, com ícone de microfone) | "Registra meu dia: acordei tarde, treinei, jantei com amigos." | "Log my day: woke up late, worked out, dinner with friends." |
| B | Ele responde com os **seus** dados, não com generalidades. E escreve uma coisa só: o humor do dia, ditado por você. Concluir prática, gastar moeda, mexer no que você criou — isso fica no app, de propósito. | It answers with **your** data, not generalities. And it writes exactly one thing: the day's mood, dictated by you. Completing a practice, spending coins, changing what you built — that stays in the app, on purpose. |
| Linha de privacidade | Se você conectar, os dados vão só pro seu assistente, só quando você pergunta — e você desconecta quando quiser. | If you connect, your data goes only to your assistant, only when you ask — and you can disconnect anytime. |
| µ | Funciona hoje com o Claude (claude.ai), em planos que aceitam conectores personalizados. Passo a passo em Ajustes → Conector. É IA: não substitui um profissional. **[a confirmar: quais planos do Claude aceitam conectores personalizados no dia da publicação]** | Works today with Claude (claude.ai), on plans that accept custom connectors. Step-by-step in Settings → Connector. It's an AI: not a substitute for a professional. |
| fig | **12** — tela do Conector em Ajustes (URL e exemplos de pergunta) | **12** |
| alt | Tela Conector do Perceva em Ajustes, com o endereço para colar no assistente e exemplos de perguntas | Perceva's Connector screen in Settings, with the address to paste into the assistant and example questions |

### 3.7 Recanto (`#recanto`)

| Elemento | pt-BR | en-US |
|---|---|---|
| Kicker | Recanto | Learn |
| **H2** | Cinco minutos que rendem — e você vai lembrar. | Five minutes that pay off — and stick. |
| S | Cada assunto vira de uma a cinco ideias: uma imagem, um texto de dois minutos, fontes clicáveis. No fim, um card. Vire, e a ideia é sua. | Each topic becomes one to five ideas: an image, a two-minute read, clickable sources. At the end, a card. Flip it, and the idea is yours. |

**Três ideias reais** (cards 4:5 com a imagem da ideia; kicker = título do material; título-gancho; afirmação; fonte). Texto exatamente como no catálogo:

| Card | pt-BR | en-US |
|---|---|---|
| A · kicker | O sábado paga a dívida de sono? | Does Saturday Repay Your Sleep Debt? |
| A · título | **Você acorda descansado. Seu corpo, não.** | **You wake up rested. Your body does not.** |
| A · afirmação | Dois dias de sono livre devolvem cansaço, humor e atenção — mas não devolveram a sensibilidade à insulina perdida em cinco noites curtas. | Two free nights give you back your mood, focus and energy — but they did not restore the insulin sensitivity lost over five short nights. |
| A · fonte | Depner et al., 2019 · Current Biology | Depner et al., 2019 · Current Biology |
| B · kicker | Antifrágil — o que melhora com o caos | Antifragile — what gains from disorder |
| B · título | **O contrário de frágil não é resistente.** | **The opposite of fragile isn't resilient.** |
| B · afirmação | Resistir só empata com o choque. O antifrágil melhora por causa dele — e o seu corpo já funciona assim, na dose certa. | Resisting only draws even with the shock. The antifragile gets better from it — and your body already works that way, in the right dose. |
| B · fonte | Taleb, 2012 · Calabrese & Baldwin, Nature, 2003 | Taleb, 2012 · Calabrese & Baldwin, Nature, 2003 |
| C · kicker | A amizade cobra em horas | Friendship Charges You in Hours |
| C · título | **Ninguém vira seu amigo em três cafés.** | **Nobody becomes a friend over three coffees.** |
| C · afirmação | Nos dados de Hall, amigo casual sai por ~50 horas juntos; amigo, ~90; amigo próximo, 200 ou mais. | In Hall's data, a casual friend runs about 50 hours together; a friend, ~90; a close friend, 200+. |
| C · fonte | Hall, 2019 · Journal of Social and Personal Relationships | Hall, 2019 · Journal of Social and Personal Relationships |

**O card que vira** (demo: o card A, com a frente e o verso; no site pode ser CSS puro com `:hover`/toque, sem lib):

| Elemento | pt-BR | en-US |
|---|---|---|
| Frente | imagem 4:5 da ideia + "Você acorda descansado. Seu corpo, não." + µ "toque pra virar" | image + "You wake up rested. Your body does not." + "tap to flip" |
| Verso | a afirmação + selo "Absorvida · foi para Minhas ideias" | the claim + "Absorbed · saved to My ideas" |

| Elemento | pt-BR | en-US |
|---|---|---|
| • 1 | O Explorar acaba. Cinco cards e a série termina — de propósito. | Explore ends. Five cards and the set is over — on purpose. |
| • 2 | Pra ler, ouvir ou ver: mergulho em áudio de vinte e poucos minutos e vídeo de um minuto em parte do catálogo, crescendo toda semana. | Read it, hear it or watch it: a twenty-odd-minute audio deep dive and one-minute videos on part of the catalog, growing every week. |
| • 3 | Minhas ideias: o que você absorveu volta pra você decidir — favorita ou solta. | My ideas: what you absorbed comes back for you to decide — favorite or let go. |
| • 4 | Escrito em português e em inglês. Não traduzido. | Written in English and in Portuguese. Not translated. |
| µ | Mais de cem ideias em 35 assuntos, ligadas às seis áreas da sua vida. Novas ideias toda semana. **[atualizar os números no dia da publicação — hoje 107 ideias / 35 materiais]** | A hundred-plus ideas across 35 topics, tied to the six areas of your life. New ideas every week. |
| fig | **6** — Recanto (capas, entrada do Explorar, lâmpada com contador); **7** — uma ideia com o card virado | **6**, **7** |

### 3.8 Caixa de ferramentas (`#ferramentas`)

| Elemento | pt-BR | en-US |
|---|---|---|
| Kicker | A caixa de ferramentas | The toolbox |
| **H2** | Ferramentas, não fórmulas. | Tools, not formulas. |
| S | O Perceva não te diz o que fazer da sua vida. Ele te equipa — **você escolhe o que usar.** | Perceva won't tell you what to do with your life. It equips you — **you choose what to use.** |
| Card 1 · rótulo / nome | Clareza · Testes com nome | Clarity · Named tests |
| Card 1 · B | Um inspirado no modelo Big Five (120 itens), um baseado na teoria de valores de Schwartz, uma escala baseada no ECR-R para vínculo e um inventário de forças de caráter. Instrumento de autoconhecimento — não quiz de revista. | One inspired by the Big Five model (120 items), one based on Schwartz's theory of values, a scale based on the ECR-R for attachment, and a character-strengths inventory. Self-knowledge instruments — not a magazine quiz. |
| Card 2 · rótulo / nome | Constância · Dia fechado | Consistency · Day closed **[a confirmar: string EN do app para "Dia fechado"]** |
| Card 2 · B | Fez o que o dia pedia — ou decidiu pular — e o dia fecha. Nada zera, nada cobra. Dá pra fechar ontem hoje. | You did what the day asked — or chose to skip — and the day closes. Nothing resets, nothing nags. You can close yesterday today. |
| Card 3 · rótulo / nome | Humor · Check-in do dia | Mood · Daily check-in |
| Card 3 · B | Um toque por dia, com nota e tags. Depois, o calendário mostra o humor no mesmo mês em que você praticou. | One tap a day, with a rating and tags. Then the calendar shows your mood in the same month you practiced. |
| Card 4 · rótulo / nome | Motivação · Recompensas suas | Motivation · Your own rewards |
| Card 4 · B | Você define a recompensa e o preço, e paga com as moedas das suas práticas. Guardar pra depois ou usar agora — você decide. | You set the reward and the price, and pay with the coins from your practices. Bank it or use it now — your call. |
| Card 5 · rótulo / nome | Conhecimento · Ideias com fonte | Knowledge · Ideas with sources |
| Card 5 · B | No Recanto, cada assunto vira de 1 a 5 ideias — imagem, texto de dois minutos, fontes clicáveis — e um mergulho em áudio em parte do catálogo. | In Learn, each topic becomes 1–5 ideas — an image, a two-minute read, clickable sources — plus an audio deep dive on part of the catalog. |
| Card 6 · rótulo / nome | Conversa · Conector | Conversation · Connector |
| Card 6 · B | Seu assistente de IA (hoje, Claude) lendo o seu mês — não um conselho de revista. | Your AI assistant (today, Claude) reading your month — not magazine advice. |
| Linha dos módulos | Quer mais estrutura? **Missões** (desafios com prazo e prêmio), **Metas** (objetivos sem prática atrelada), **Habilidades** (recordes com faixas) e **Minha Semana** (três coisas grandes por semana) são módulos opcionais: ligam em Ajustes → Módulos e, até lá, ficam invisíveis. | Want more structure? **Quests** (deadline challenges with a prize), **Goals** (targets not tied to a practice), **Skills** (personal bests with tiers) and **My Week** (three big things a week) are optional modules: switch them on in Settings → Modules; until then, they stay out of sight. |
| fig | **5** — Resultado do Big Five (resultado por traço), como imagem do card Clareza | **5** |

### 3.9 Cofre (`#cofre`)

| Elemento | pt-BR | en-US |
|---|---|---|
| Kicker | Cofre | Vault |
| **H2** | A recompensa, você define. O preço também. | You set the reward. And the price. |
| B1 | Crie a recompensa, coloque o preço em moedas, pague com as suas práticas. Guarde pra depois ou use agora — e, se mudar de ideia, venda de volta. | Create the reward, price it in coins, pay with your practices. Bank it for later or use it now — and if you change your mind, sell it back. |
| B2 | E se a recompensa for um deslize — um cigarro, uma bebida —, o app não faz sermão nem confete. Responde a única pergunta que importa: **há quantos dias.** | And if the reward is a slip — a cigarette, a drink — the app doesn't lecture or throw confetti. It answers the only question that matters: **how many days.** |
| µ | Sem baú, sem sorteio, sem prêmio surpresa. O que você ganha é o que você decidiu. | No loot box, no spin, no surprise prize. What you get is what you decided. |
| fig | **11** — Recompensas (Cofre com itens e carteira); recorte de **4** — card "Sem resgatar · N d · maior intervalo anterior" | **11**, crop of **4** |
| alt (4) | Card "Sem resgatar" do Perceva: dias desde o último resgate e o maior intervalo anterior | Perceva's "Not redeemed" card: days since the last redemption and the previous longest gap **[a confirmar: string EN do app]** |

### 3.10 Privacidade (`#privacidade`)

| Elemento | pt-BR | en-US |
|---|---|---|
| **H2** | Seus dados mais íntimos são seus. Ponto. | Your most intimate data is yours. Period. |
| S | O Perceva lida com respostas de autoavaliação e de instrumentos de autoconhecimento — informação sensível. Tratamos isso com a seriedade que merece. | Perceva handles self-assessment answers and self-knowledge instruments — sensitive information. We treat that with the seriousness it deserves. |
| • 1 | Suas respostas servem apenas para mostrar os resultados a você, dentro do app. | Your answers exist only to show your results to you, inside the app. |
| • 2 | Nada é vendido, usado para publicidade ou para treinar modelos. | Nothing is sold, used for advertising, or used to train models. |
| • 3 | Sem anúncios, sem rastreamento de comportamento, sem coleta de localização. Nenhum SDK de anúncio ou de analytics no app. | No ads, no behavioral tracking, no location collection. No ad or analytics SDK in the app. |
| • 4 | Se você conectar o app ao seu assistente de IA, os dados vão só pra ele, só quando você pergunta — e você desconecta quando quiser. | If you connect the app to your AI assistant, your data goes only to it, only when you ask — and you can disconnect anytime. |
| • 5 | Você pode acessar, corrigir ou apagar seus dados quando quiser. Excluir a conta é um botão em Ajustes. | You can access, correct or delete your data whenever you want. Deleting your account is a button in Settings. |
| Link | Política de privacidade → `/privacy` | Privacy policy → `/en/privacy` |

### 3.11 Planos (`#planos`)

| Elemento | pt-BR | en-US |
|---|---|---|
| Kicker | Planos | Plans |
| **H2** | Comece de graça. Aprofunde quando quiser. | Start free. Go deeper when you want. |
| **Gratuito** (card principal, à esquerda) · preço | Gratuito · **R$ 0** | Free · **$0** |
| • | Até 10 práticas ativas | Up to 10 active practices |
| • | Até 5 recompensas suas | Up to 5 rewards of your own |
| • | Autoavaliação e questionário de bem-estar nas seis áreas | Self-assessment and wellbeing questionnaire across the six areas |
| • | Humor, calendário e Padrões | Mood, calendar and Insights |
| • | O Recanto inteiro | All of Learn |
| • | O Conector **[a confirmar: hoje nada gateia o Conector por plano; confirmar se é a intenção antes de imprimir]** | The Connector |
| CTA | Baixar no Android | Get it on Android |
| **Premium** · selo | Perceva Premium · **Em breve** | Perceva Premium · **Coming soon** |
| Preço | R$ 14,90/mês · ou R$ 99,90/ano | $2.99/month · or $19.99/year **[a confirmar: preço em USD que a Play vai exibir]** |
| • | Tudo do Gratuito | Everything in Free |
| • | Os quatro testes profundos: inspirado no modelo Big Five (120 itens), baseado na teoria de valores de Schwartz, escala baseada no ECR-R, forças de caráter | The four deep tests: inspired by the Big Five model (120 items), based on Schwartz's theory of values, a scale based on the ECR-R, character strengths |
| • | Limites ampliados de práticas e recompensas | Higher limits on practices and rewards |
| µ | Assinatura dentro do app, quando abrir. O site não cobra nada. **[a confirmar: após uma compra de teste real, trocar "Em breve" por "Assine dentro do app"]** | Subscription inside the app, once it opens. Nothing is charged on this site. |

Regras deste bloco: o Gratuito lidera visualmente (é o CTA de download); DISC e Tipos não são listados; nenhuma linha de Missões/Habilidades (limites de módulo, não de vitrine); nada de "assine agora" nem "cinco meses grátis" enquanto a compra não estiver confirmada.

### 3.12 Lojas — dois estados (`#baixar` e `#iphone`)

| Elemento | pt-BR | en-US |
|---|---|---|
| **H2** | Cada dia treina **alguém** em você. | Every day trains **someone** in you. |
| S | Escolha quem. | Choose who. |

**Estado A — Android disponível (padrão do v5)**

| Elemento | pt-BR | en-US |
|---|---|---|
| Selo | Disponível no Android | Available on Android |
| CTA (badge oficial da Google Play) | Baixar na Google Play → ficha pública | Get it on Google Play |
| µ | Grátis. Sem anúncios. Android. | Free. No ads. Android. |

**Estado B — enquanto a listagem ainda for teste fechado** [a confirmar: data de abertura pública; a espinha §11 recomenda esta semana]

| Elemento | pt-BR | en-US |
|---|---|---|
| Selo | Android em teste fechado | Android in closed testing |
| CTA | Quero testar no Android → mesmo formulário do iPhone, com `platform=android` | I want to test on Android |
| µ | A gente manda o link de teste por e-mail. | We'll email you the test link. |

**iPhone — "avise-me"** (`#iphone`)

| Elemento | pt-BR | en-US |
|---|---|---|
| H3 | No iPhone, ainda não. Me avise quando chegar. | Not on iPhone yet. Let me know when it lands. |
| Campo | `type=email`, placeholder "seu@email.com", `required`, `autocomplete=email` | placeholder "you@email.com" |
| Campos ocultos | `lang=pt`, `platform=ios`, `source=site-v5`, honeypot `website` (vazio) | `lang=en` |
| CTA | Me avise | Notify me |
| µ (consentimento) | Um único e-mail quando sair no iPhone. Sem lista, sem novidades, sem data prometida. Você pode pedir pra apagar quando quiser. | One email when it lands on iPhone. No list, no newsletter, no promised date. You can ask us to delete it anytime. |
| Sucesso | Anotado. Quando sair no iPhone, você é a primeira pessoa a saber. | Noted. When it lands on iPhone, you'll be the first to know. |
| Erro | Não deu certo. Tente de novo ou fale com a gente pela página de suporte. | That didn't work. Try again or reach us through the support page. |

**Formulário sem backend — especificação técnica**

- Compatível com a regra de ouro (single-file, sem build, sem framework): `<form method="POST" action="{ENDPOINT}">` puro. Sucesso e erro podem ser mostrados com um `fetch` inline de 15 linhas (o site já roda um `IntersectionObserver` inline; não introduz dependência) ou, sem JS, por redirect para `/?ok=ios#iphone`.
- **Nunca** enviar o e-mail por GET nem em querystring; o redirect de sucesso não carrega o endereço.
- Honeypot (`website`) + `autocomplete=email`; sem CAPTCHA.
- Provedor **[a confirmar: escolha do dono]** — opções compatíveis, em ordem de recomendação: (1) endpoint de formulário hospedado que aceite POST de HTML estático (um único formulário, zero código no repo; verificar DPA/LGPD e onde o e-mail fica guardado); (2) Cloudflare Pages Function em `functions/notify.js` gravando num KV da própria conta (o e-mail nunca sai da conta do Perceva; é um arquivo a mais, sem build); (3) formulário embutido de ferramenta de e-mail (só se já houver uma; é mais do que precisamos). Critério de escolha: quem guarda o e-mail e como a pessoa pede exclusão.
- A **política de privacidade** (`/privacy` e `/en/privacy`) precisa ganhar um parágrafo sobre o formulário: finalidade única (aviso de iOS), base legal (consentimento), retenção (até o aviso ou pedido de exclusão), canal de exclusão **[a confirmar: texto jurídico]**.

### 3.13 FAQ (`#faq`)

| # | pt-BR | en-US |
|---|---|---|
| **H2** | Perguntas frequentes | Frequently asked questions |
| 1 · P | Isso substitui terapia? | Is this a substitute for therapy? |
| 1 · R | Não. O Perceva é uma ferramenta de autoconhecimento e prática: os testes são instrumentos de reflexão, não de diagnóstico, e nenhuma tela do app avalia, trata ou prescreve. Se você está passando por um momento difícil, procure um profissional. No Brasil, o CVV atende de graça no 188, 24 horas. | No. Perceva is a self-knowledge and practice tool: the tests are instruments for reflection, not diagnosis, and no screen in the app assesses, treats or prescribes anything. If you're going through a hard time, please reach out to a professional or a local helpline. |
| 2 · P | Funciona com o ChatGPT? | Does it work with ChatGPT? |
| 2 · R | Hoje, o Conector funciona só com o Claude (claude.ai), em planos que aceitam conectores personalizados. Sem o Conector, o app funciona inteiro do mesmo jeito — ele é um extra, não um pré-requisito. | Today the Connector works with Claude only (claude.ai), on plans that accept custom connectors. Without the Connector, the whole app works exactly the same — it's an extra, not a requirement. |
| 3 · P | E no iPhone? | What about iPhone? |
| 3 · R | Ainda não. A versão Android está na Google Play; a do iPhone está no mapa, sem data. Deixe o e-mail acima e a gente avisa — um único e-mail. | Not yet. The Android version is on Google Play; iPhone is on the roadmap, no date. Leave your email above and we'll let you know — one email, that's all. |
| 4 · P | Meus dados vão pra IA? | Does my data go to an AI? |
| 4 · R | Só se você conectar o app ao seu assistente, e só quando você pergunta. Sem o Conector, nada sai do app. O Perceva não usa suas respostas pra treinar modelo nenhum; o que o seu assistente faz com o que lê segue as regras do seu plano com ele. Desconectar é um toque. | Only if you connect the app to your assistant, and only when you ask. Without the Connector, nothing leaves the app. Perceva doesn't use your answers to train any model; what your assistant does with what it reads follows the terms of your plan with it. Disconnecting is one tap. |
| 5 · P | O que é grátis? | What's free? |
| 5 · R | Até 10 práticas e 5 recompensas suas, a autoavaliação e o questionário de bem-estar nas seis áreas, humor, calendário e Padrões, e o Recanto inteiro. O limite é garantido no servidor — não muda no meio do caminho. O Premium acrescenta os quatro testes profundos e amplia os limites. | Up to 10 practices and 5 rewards of your own, the self-assessment and wellbeing questionnaire across the six areas, mood, calendar and Insights, and all of Learn. The limits are enforced server-side — they don't move halfway through. Premium adds the four deep tests and raises the limits. |
| 6 · P | Tem streak? | Are there streaks? |
| 6 · R | Não, e nunca teve. Pular é decisão, não falha; nada zera; a Dedicação só sobe; e dá pra fechar ontem hoje. Perder um dia não atrapalha o hábito (Lally et al., 2010). O único "há quantos dias" do app é o do Cofre — e esse é você quem pergunta. | No, and there never were. Skipping is a decision, not a failure; nothing resets; Dedication only goes up; and you can close yesterday today. Missing a day doesn't derail a habit (Lally et al., 2010). The only "how many days" in the app is the Vault's — and that one, you ask. |

Marcação: `<details>/<summary>` nativo (sem JS), com JSON-LD `FAQPage` espelhando as seis perguntas em cada idioma.

### 3.14 Rodapé

| Elemento | pt-BR | en-US |
|---|---|---|
| Links | Privacidade (`/privacy`) · Termos (`/terms`) · Excluir conta (`/delete-account`) · Suporte (`/suporte`) · Contato (`/suporte`) | Privacy (`/en/privacy`) · Terms (`/en/terms`) · Delete account (`/en/delete-account`) · Support (`/support`) · Contact (`/support`) |
| Disclaimer | O Perceva é uma ferramenta de autoconhecimento e desenvolvimento pessoal. Seus testes de personalidade, valores e vínculo são instrumentos de reflexão, não de diagnóstico: o app não realiza avaliação clínica nem substitui acompanhamento profissional de saúde. | Perceva is a self-knowledge and personal-development tool. Its tests of personality, values and attachment are instruments for reflection, not diagnosis: the app performs no clinical assessment and is not a substitute for professional health care. |
| © | © 2026 Perceva. Todos os direitos reservados. | © 2026 Perceva. All rights reserved. |

---

## 4. SEO

| Campo | pt-BR (`/`) | en-US (`/en/`) |
|---|---|---|
| `<title>` | Perceva — app de hábitos e autoconhecimento | Perceva — habits & self-knowledge app |
| `meta description` (≤ 155) | Seis áreas da vida com nota, testes com nome (Big Five, Schwartz, ECR-R) e a diferença entre o que você acha e o que faz. Grátis no Android. | Six life areas, each with a score, named tests (Big Five, Schwartz, ECR-R) and the gap between what you think you do and what you do. Free on Android. |
| H1 | Perceba quem você está se tornando. | See who you're becoming. |
| H2 (ordem) | Todo app ou te diz quem você é, ou conta o que você fez. · Três retratos, uma jornada. · A sensação mente. O registro, não. · O assistente que te conhece. · Cinco minutos que rendem — e você vai lembrar. · Ferramentas, não fórmulas. · A recompensa, você define. O preço também. · Seus dados mais íntimos são seus. Ponto. · Comece de graça. Aprofunde quando quiser. · Cada dia treina alguém em você. · Perguntas frequentes | Every app either tells you who you are, or counts what you did. · Three portraits, one journey. · The feeling lies. The record doesn't. · The assistant that knows you. · Five minutes that pay off — and stick. · Tools, not formulas. · You set the reward. And the price. · Your most intimate data is yours. Period. · Start free. Go deeper when you want. · Every day trains someone in you. · Frequently asked questions |
| Palavras-chave (no texto, nunca em `meta keywords`) | app de hábitos · autoconhecimento · teste de personalidade · Big Five 120 itens · valores de Schwartz · apego ECR-R · check-in de humor · calendário de hábitos · app de hábitos sem streak · Conector Claude · MCP | habit tracker · self-knowledge app · personality test · Big Five 120 · Schwartz values · attachment style ECR-R · mood check-in · habit calendar · habit app without streaks · Claude connector · MCP |
| Não usar (busca errada ou proibido) | autocuidado · self-care · RPG · gamificação · terapia · saúde mental · teste psicológico | self-care · all-in-one · gamify your life · therapy · mental health |
| `og:title` / `twitter:title` | Perceva — perceba quem você está se tornando | Perceva — see who you're becoming |
| `og:description` / `twitter:description` | Um app de hábitos com uma diferença: ele não conta só o que você faz — mostra quem os seus hábitos estão treinando você a ser. | A habit app with one difference: it doesn't just count what you do — it shows who your habits are training you to become. |
| `og:image` | `/assets/og.png` (regenerado, §5.3) | `/assets/og-en.png` **[a confirmar: hoje `/en/` aponta para o mesmo `og.png` em pt]** |
| `og:image:alt` | Perceva — app de hábitos e autoconhecimento | Perceva — habits & self-knowledge app |
| `canonical` / `hreflang` | canonical `https://perceva.app/`; `pt-BR` → `/`, `en-US` → `/en/`, `x-default` → `/en/` | canonical `https://perceva.app/en/`; mesmos três `hreflang` |
| JSON-LD `SoftwareApplication` | `featureList` reescrita: autoavaliação nas seis áreas; testes com nome (Big Five 120 itens, Valores de Schwartz, Apego ECR-R, Forças); práticas com Dedicação por área; check-in de humor; calendário com frentes Rotina/Humor/Cofre; Padrões em 90 dias; Cofre de recompensas com "há quantos dias"; Recanto de ideias com fonte; Conector para assistente de IA (Claude). **Remover** Momentum, Missões, Habilidades. `screenshot` aponta para as novas capturas pt. `offers`: só o plano gratuito (price 0) até a compra confirmada. | idem em EN; `screenshot` → capturas en |
| JSON-LD `FAQPage` | as 6 perguntas de 3.13 | the 6 questions |

---

## 5. Assets a produzir

### 5.1 Capturas (dois conjuntos: pt-BR para `/`, en-US para `/en/`)

Fonte: build atual da Play ou APK `preview` — **não Expo Go**. Tema escuro. Aparelho 1080×2400. Conta populada antes de capturar: 60+ dias de histórico em ~15 práticas; humor em ≥ 30 dias com tags e notas; 3+ instrumentos concluídos (um deles o Big Five); ≥ 8 ideias absorvidas e 3 favoritas; recompensas com resgates espaçados (para o card "Sem resgatar"); Norte traçado; nome de exibição real. Exportar JPEG q≈85, ≤ 120 KB, 1080 de largura para o site (PNG 1080×2400 para a Play sai da mesma sessão). Nomear pelo conteúdo, não pela aba antiga.

| # | Tela | Onde entra no v5 | Arquivo sugerido |
|---|---|---|---|
| 1 | Eu › **Praticada** — hex da Dedicação com o **contorno da percepção** | Hero (`.phone`) e O espelho | `shot-eu-praticada.jpg` |
| 2 | **Hoje** — saudação, práticas, faixa "Humor de hoje", selo de dia parcialmente fechado; chips de Missões/Metas **escondidos** | Três retratos (ii) | `shot-hoje.jpg` |
| 3 | Eu › **Percebida** — hex com notas por área | Três retratos (i) | `shot-eu-percebida.jpg` |
| 4 | **Perfil** — ficha com os testes (2 feitos, 4 com chip Premium) + card "Sem resgatar" | Planos (Premium) e Cofre (recorte do card) | `shot-perfil.jpg` |
| 5 | **Resultado do Big Five** — nível por traço | Caixa de ferramentas (Clareza) | `shot-bigfive.jpg` |
| 6 | **Recanto** — capas, card de entrada do Explorar, lâmpada com contador | Recanto | `shot-recanto.jpg` |
| 7 | **Uma ideia** — imagem 4:5 + texto + **card virado** com a afirmação | Recanto (demo do card) | `shot-ideia-card.jpg` |
| 8 | **Minhas ideias** — pilha de revisão no meio de um swipe | Opcional no site; reservar para reels | `shot-minhas-ideias.jpg` |
| 9 | **Calendário** — frente Humor com filtro aplicado e espiada do dia aberta | Meça | `shot-calendario-humor.jpg` |
| 10 | **Padrões** — "Nos seus N dias ótimos…" com o aviso de co-ocorrência | Meça | `shot-padroes.jpg` |
| 11 | **Recompensas** — Cofre com itens e carteira | Cofre | `shot-cofre.jpg` |
| 12 | **Conector** — tela de Ajustes com URL e exemplos de pergunta | Conector | `shot-conector.jpg` |
| 13 (extra) | Eu › **Desejada** — Norte traçado sobre o contorno | Três retratos (iii), se couber | `shot-eu-desejada.jpg` |

Depois de trocar: apagar `shot-me.jpg`, `shot-tasks.jpg`, `shot-rewards.jpg`, `shot-learn.jpg` de `public/assets/` e de todas as referências (`index.html`, `en/index.html`, JSON-LD). Nenhuma tela em inglês pode sobrar em `/`, nem em português em `/en/`.

### 5.2 Diagrama do ciclo (SVG inline, sem imagem externa)

- **O que mostra:** um anel em três estações, no sentido horário, com a Iris do Perceva (anéis concêntricos + agulha dourada inclinada) no centro. Estação 1 **Medir** (ícone: hexágono com nota), estação 2 **Praticar** (ícone: marca de prática concluída), estação 3 **Re-olhar** (ícone: o mesmo hexágono com o contorno sobreposto). Setas curvas entre elas; a seta de "Re-olhar" volta a "Medir".
- **Como se lê:** cada estação leva o retrato correspondente em `--dim`, menor: Medir → *Percebida*, Praticar → *Praticada*, Re-olhar → *Desejada*. A legenda abaixo: "medir → praticar → re-olhar. Uma vez por semana basta." / "measure → practice → look again. Once a week is enough."
- **Cores:** traço `--violet`, agulha e destaque de estação ativa `--gold`, texto `--sand`, fundo transparente sobre `--bg`. Sem gradiente, sem sombra. Largura fluida (`max-width: 520px`).
- **Acessibilidade:** `<title>` e `<desc>` no SVG em cada idioma; texto em `<text>` real (não em path) para poder trocar de língua copiando o bloco.
- **Não desenhar:** os três motores (recompensas, acompanhamento, social) — social não aparece em público; o diagrama é do ritual, não da arquitetura interna.

### 5.3 `og.png` (e `og-en.png`)

- 1200×630, fundo `--bg`. Esquerda: kicker "App de hábitos e autoconhecimento" em Inter `--dim`; abaixo, "Perceba quem você está se tornando." em Fraunces `--sand`, duas linhas; marca Perceva no canto inferior esquerdo. Direita: o hexágono das seis áreas **desenhado em vetor** (preenchimento em violeta translúcido, contorno em dourado, seis pontas nas cores das áreas) — não uma captura, para não envelhecer.
- Versão EN idêntica com "Habits & self-knowledge app" / "See who you're becoming." em `/assets/og-en.png`; `/en/index.html` passa a apontar para ela.
- Gerar com `tools/make-og.mjs` **[a confirmar: o script aceita idioma e não embute a captura antiga; se embute, ajustar antes]**. Conferir em um validador de OG que a imagem nova é a servida (o cache de 30 dias em `/assets/*` pode segurar a antiga — mudar o nome do arquivo se preciso).

---

## 6. Checklist de publicação

Ordem: fidelidade → paridade → técnico → deploy → pós-deploy. Tudo na mesma PR do repo `perceva-site`.

**Fidelidade (zero ocorrências nos dois HTML, exceto onde indicado)**
- [ ] `grep -i` em `public/index.html` e `public/en/index.html` para: `Momentum`, `psicológic`, `psychological`, `Leituras curtas`, `Short reads`, `Jornadas`, `quest` (fora da linha de módulos), `Missions`, `Evoluir`, `Evolve`, `Perceive`, `lado a lado`, `side by side`, `all-in-one`, `tudo em um`, `ecossistema`, `autocuidado`, `self-care`, `mentor`, `coach`, `streak` (fora da FAQ 6), `Nível`, `Level`, `RPG`, `DISC`, `Tipos`, `Social`, `assine agora`, `subscribe now`, `validado`, `validated`. Resultado esperado: vazio.
- [ ] Toda menção a instrumento usa a forma canônica ("inspirado no modelo Big Five (120 itens)", "baseado na teoria de valores de Schwartz", "escala baseada no ECR-R").
- [ ] Toda menção ao Conector traz "(hoje, Claude)" e nenhuma promete mentor, coach ou "IA do Perceva".
- [ ] Nenhuma data para iOS em lugar nenhum (texto, alt, JSON-LD, formulário).
- [ ] Números conferidos no dia: ideias/materiais do Recanto; preços; limites do grátis. Científicos com autor e ano (Tucker 2011; Lally 2010).

**Paridade pt ↔ en (mudou numa língua, mudou na outra)**
- [ ] Mesmos ids de seção, mesma quantidade de cards, bullets, balões e perguntas da FAQ nas duas páginas.
- [ ] Toda imagem tem `alt` na língua da página; nenhuma captura pt em `/en/` nem en em `/`.
- [ ] `<style>` copiado idêntico para as duas páginas (regra do single-file).
- [ ] JSON-LD (`SoftwareApplication` + `FAQPage`) espelhado nas duas línguas.

**Técnico**
- [ ] `hreflang` pareado nas duas páginas: `pt-BR` → `/`, `en-US` → `/en/`, `x-default` → `/en/`; `canonical` próprio de cada página; `og:locale` e `og:locale:alternate` corretos; `og:image` de cada língua.
- [ ] `sitemap.xml`: atualizar `lastmod` de `/` e `/en/`; **não** listar destinos de redirect; nenhuma URL nova que não esteja no ar.
- [ ] `_redirects`: manter as cinco regras 301 existentes. Sugestão **[a confirmar]**: `/android` → ficha da Play (302, para poder trocar) e `/ios` → `/#iphone` (302), úteis em bio e vídeo.
- [ ] Botão da Play: abrir a URL num navegador anônimo e confirmar que é a ficha pública (não "item não encontrado"). Se não for, publicar com o **Estado B**.
- [ ] Formulário: enviar um e-mail de teste em pt e em en; conferir sucesso, erro, honeypot; confirmar que o endereço não aparece em nenhuma URL; confirmar onde o dado ficou e como se apaga. Parágrafo novo na política de privacidade (pt e en) publicado na mesma PR.
- [ ] Sem framework, sem CDN, paleta intacta, Fraunces + Inter como únicas fontes externas; `_headers` sem CSP nova.
- [ ] Imagens: 1080 px de largura, ≤ 120 KB, `loading="lazy"` fora do hero; capturas antigas apagadas do repo.
- [ ] Sem scroll horizontal no celular; FAQ funciona sem JS (`<details>`); card que vira funciona com toque.

**Deploy e pós-deploy**
- [ ] Merge na `main` → deploy automático. Depois, o smoke test do README (tudo `200`): `/ /privacy /terms /delete-account /suporte /support /sitemap.xml /robots.txt` **mais** `/en/ /en/privacy /en/terms /en/delete-account`; e os `301` de `/privacidade /termos /excluir-conta /contato`.
- [ ] Conferir OG novo num validador; se o cache de `/assets/*` segurar o antigo, renomear o arquivo.
- [ ] Reenviar o `sitemap.xml` no Search Console **depois** do deploy (passo do dono da conta).
- [ ] Sincronizar a ficha da loja com o mesmo vocabulário (`docs/publish/01-store-metadata.md`, Fase 0 da espinha) — site e loja não podem discordar.
- [ ] Anotar em `README.md` do site: v5 publicada, data, o que mudou, provedor do formulário e onde os e-mails ficam.

---

## Apêndice — pendências [a confirmar], consolidadas

| # | O quê | Por que depende do dono | Onde afeta |
|---|---|---|---|
| 1 | Listagem pública da Play ativa e URL da ficha (`id=perceva.app`) | Só o Play Console mostra; a espinha §11 recomenda abrir esta semana | Hero, Planos, Lojas (Estado A/B), `_redirects` |
| 2 | Conector no plano Gratuito | Nada no código gateia por plano; falta a decisão explícita | Planos, FAQ 5 |
| 3 | Preço em USD que a Play exibirá | Não verificável pelo repo | Planos EN |
| 4 | Compra de teste real do Premium | Até lá, "Em breve" | Planos, JSON-LD `offers` |
| 5 | Planos do Claude que aceitam conectores personalizados no dia da publicação | Informação de terceiro, muda | Conector (µ), FAQ 2 |
| 6 | Provedor do formulário e texto jurídico do parágrafo de privacidade | Escolha de conta e responsabilidade LGPD | Lojas (iPhone), `/privacy`, `/en/privacy` |
| 7 | Strings EN do app para "Dia fechado", "Norte", "Sem resgatar" | O EN do site deve casar com o EN do app | Caixa de ferramentas, Três retratos (iii), Cofre |
| 8 | `tools/make-og.mjs` aceita idioma e não embute captura antiga | Precisa abrir o script | og.png / og-en.png |
| 9 | Redirects curtos `/android` e `/ios` | Conveniência, não requisito | `_redirects` |
| 10 | Números do Recanto no dia da publicação (hoje 107 ideias / 35 materiais) | O pipeline publica toda semana | Recanto (µ) |
