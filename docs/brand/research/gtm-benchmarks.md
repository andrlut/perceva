# GTM benchmarks — como apps pequenos de hábitos/bem-estar chegaram aos primeiros 10 mil–1 milhão de downloads (2022–2026)

Frente: go-to-market. Painel do playbook de marca Perceva, 2026-09-12.
Método: buscas em EN e PT, fontes primárias abertas quando possível (páginas oficiais da Apple/Google/Anthropic, API do Hacker News, Product Hunt, TechCrunch, relatórios de indústria). Cada alegação recebe força **forte / moderada / fraca / contestada**. Onde não encontrei fonte, está escrito "não encontrei" — a alegação fica como fraca ou sai.

Limite desta pesquisa: o orçamento de busca da sessão acabou antes de cobrir UGC no Brasil, benchmarks de waitlist e as regras exatas de alguns subreddits. Essas lacunas estão marcadas no texto.

---

## 0. Resumo executivo

1. **Nenhum dos casos cresceu "por lançar bem"**. Cada um tem um canal dominante identificável que casou com a natureza do produto: Finch = criativos no estilo UGC pagos em Meta/TikTok em cima de um artefato que os usuários já postavam por conta própria (o pássaro); Cal AI = rede de 250 criadores em retainer; Cíngulo = credencial médica + prêmio Google Play 2019 + boca a boca; Habitica = imprensa (Lifehacker) antes de existir produto acabado + Kickstarter + comunidade open-source; Structured e Stoic = editorial da Apple + iteração com usuários; Opal = cobrou desde o dia 1, iOS-only, 121 testes A/B; Rosebud = Product Hunt modesto (55 e 76 upvotes) e depois capital de risco.
2. **Para um fundador solo com tempo > dinheiro**, o que a evidência sustenta em 2026: ASO (a própria Apple diz que ~65% dos downloads acontecem logo depois de uma busca), conteúdo curto founder-led tratado como loteria barata (posta muito, custa quase nada, quase tudo dá zero), **Show HN com o ângulo técnico do MCP** (30 posts "Show HN … MCP server" têm mediana de 23 pontos e 7 passaram de 50; "Show HN … habit tracker" tem mediana ~5 e nenhum passou de 100), e **nomeação gratuita para featuring** nas duas lojas — com um prazo que importa: o formulário do Google para app novo só vale até 4 meses depois do lançamento em produção.
3. **Pagar por instalação não fecha a conta hoje**. CPI de referência: Android em LATAM US$ 0,50–2,00; iOS nos EUA para meditação/bem-estar mental US$ 4–10. Com conversão mediana de instalação→pagante em LATAM de 1,5% (RevenueCat 2026) e preço de R$ 99,90/ano, o CAC por pagante em anúncio ficaria entre R$ 180 e R$ 730 — várias vezes o que um pagante rende no ano. Anúncio, se houver, é para aprender criativo (teste mínimo viável R$ 3–5 mil em 30 dias), não para escalar.
4. **90 dias, com premissas explícitas**: conservador 300–1.500 downloads; realista 1.500–6.000; otimista 10.000–30.000+ se um clipe estourar ou o Google Play Brasil destacar. A mediana de app de assinatura um ano depois do lançamento é US$ 72/mês; 57,7% nunca chegam a US$ 1.000 acumulados. O cenário conservador é o normal, não o fracasso.
5. **Armadilhas com evidência**: botão "Em breve" no site é vazamento puro (o Show HN rejeita landing pages; o tráfego de Product Hunt converte 1–3% mesmo com produto no ar); Android-only fecha a via editorial da Apple e ignora a plataforma onde estão 64% do gasto global em apps e 77% dos lançamentos de apps de assinatura; vídeo de prévia é **contestado** — no caso publicado pela própria Apple (Simply Piano), a página sem vídeo venceu.

---

## 1. Casos — o que é verificável

### 1.1 Tabela-resumo

| App | País / ano | Canal dominante (verificado) | Números verificáveis | Força | O que transfere para o Perceva |
|---|---|---|---|---|---|
| **Finch** | EUA, lançado 12/05/2021 | Meta + TikTok Ads com criativos estilo UGC (600+ criativos ativos em Meta, 58→660 de jan/2025 a jan/2026); comunidade no Facebook desde jun/2021; usuários postam o pássaro organicamente | Bootstrapped; estimativas de terceiros: ~600 mil downloads/mês e ~US$ 1 mi/mês (Adapty, set/2024); ~400 mil iOS + ~300 mil Android downloads/mês (Sensor Tower, snippet); 4,9★ com 315 mil avaliações (set/2024) → 550 mil+ (2026); #2 Top Free Health & Fitness iPhone (set/2024) | moderada | O produto em si é o criativo: o "estágio do pássaro" é um artefato que dá vontade de postar. O equivalente do Perceva é o Espelho (como me vejo × o que pratico × o que o teste diz) e o radar das 6 áreas. Pago veio depois de provar retenção. |
| **Fabulous** | França/EUA, 2013 | Autoridade acadêmica (incubado no Center for Advanced Hindsight, Duke, com Dan Ariely) + prêmios de loja | "37 milhões de pessoas ajudadas" (autodeclarado); finalista Best App Google Play 2017; Material Design Award; "Best Self-Care App 2018" na App Store | moderada (prêmios) / fraca (UA paga: não encontrei fonte quantificando) | A credencial "nascido num laboratório de economia comportamental" sustentou a marca por uma década — e é exatamente o "baseado em ciência" vago que o anti-posicionamento do Perceva proíbe. A alternativa do Perceva é nomear instrumento (Big Five 120, Schwartz, ECR-R), não pessoa nem laboratório. |
| **Habitica** (ex-HabitRPG) | EUA, 2012–2013 | Imprensa (Lifehacker, 2012: de um punhado para 20 mil usuários da noite para o dia) → Kickstarter (jan–fev/2013, meta US$ 25 mil batida em 11/02/2013; total "acima de US$ 40 mil") → comunidade open-source (arte, traduções, código) | Fundada 30/01/2013 (Renelle, Leslie, Hsu); renomeada 31/07/2015; espaços sociais (Tavern, guildas) removidos em ago/2023. Contagem "4 milhões de usuários": **não verificada** | moderada (origem) / fraca (usuários) | Um post certo na imprensa certa antes do produto estar pronto. O componente aberto do Perceva que pode repetir isso é o servidor MCP, não o app. Atenção: Habitica é o dono de "gamifique sua vida" — território que o Perceva rejeita. |
| **Cíngulo** (BR) | Porto Alegre, acelerado WOW 2016 | Credencial médica dos fundadores (psiquiatras, PhD; Diogo Lara: 160+ artigos, 130 mil livros) + **Google Play Melhor App 2019 (Brasil)** + "Destaque da Apple" + Exame "melhor app do mês" + boca a boca e avaliações; matérias-tutorial no TechTudo desde 2019 | ~2,3 mi downloads (abr/2021, Instituto Caldeira; só R$ 150 mil investidos até então, 14 pessoas); 3 mi downloads e 200 mil acessos/mês (Assespro-RS/Gazz Conecta, resumo de busca); "4 mi+" (resumo de busca, página não aberta); premium R$ 99,99/semestre (TechTudo) | moderada | No Brasil a espinha foi credencial + prêmio de loja + boca a boca, não mídia paga. O Perceva não pode (nem deve) reivindicar autoridade clínica; a alavanca comparável é a honestidade metodológica (instrumentos nomeados, percentis, "não é laudo"). Cíngulo é dono de "terapia guiada/ansiedade" — o guardrail manda ficar longe. |
| **Ofensiva** (BR) | Softprox, lançado jul/2026 | SEO em português ("app de hábitos grátis em português", comparativos com 6 apps), PWA sem loja | Free R$ 0; Pro R$ 29,90 e Elite R$ 59,90 marcados "em breve"; sem números de usuários; nenhuma evidência de TikTok, influenciadores ou imprensa encontrada | fraca | Concorrente de 2 meses atacando a busca em pt-BR pela palavra "hábitos". Mostra a armadilha do "em breve" em tempo real. O Perceva deve ocupar "app de hábitos e autoconhecimento" em PT antes que esse nicho de busca tenha dono. |
| **Rosebud** | EUA, web jul/2023 | Founder-led (ex-YC, ex-Secret) + Product Hunt + capital de risco | PH 26/07/2023: 55 upvotes / 299 comentários; PH 06/08/2024: #4 do dia, 76 upvotes / 574 comentários; 500 mi palavras escritas, 30 mi+ minutos; seed US$ 6 mi (jun/2025, Bessemer, Tim Ferriss); US$ 12,99/mês | forte (fatos) | Product Hunt foi modesto até para um time com rede e VC: PH não é motor. E "mentor no bolso" é o que o Perceva **não** promete. |
| **Stoic** | Polônia/EUA, YC S19 | Boca a boca entre fundadores/traders + **editorial da Apple** ("Starting Your Day Just Right", Deep Dive) + fundador que faz "algumas ligações com usuários toda semana" | Free + US$ 27,99/ano (2019). Sem números públicos de downloads | moderada (fatos) / fraca (números) | O formulário de nomeação da Apple pede a história do desenvolvedor; a Apple escreveu a história do Maciej. A história do André (irmão como testador, sem streak punitivo, dados do usuário como fronteira) é material de nomeação. |
| **Structured** | Berlim, side project de estudante | Design + acessibilidade (comunidade neurodivergente) → **App Store Award finalist**, "Apps We Love", **finalista Apple Design Awards 2026 (Inclusividade)**, citado no keynote da WWDC26 | 15 mi+ downloads, 400 mil+ avaliações 5★, 500 mil+ assinantes Pro (autodeclarado no site); time ~11 | moderada (números) / forte (reconhecimento Apple) | Toda essa via passa pelo iOS. Sem iOS, não existe. |
| **Opal** | EUA, Speedinvest desde 2020 | Cobrou desde o dia 1 ("assinatura como motor de descoberta"), iOS-only e US-only no início, 121 testes A/B, releases semanais; primeiro app na Screen Time API (out/2022) | PH jan/2021: 41 upvotes; PH "The New Opal" set/2022: 61 upvotes; US$ 5 mi ARR com 6–7 pessoas → US$ 10 mi com 11; freemium derrubou conversão de 20% para 9% e levou a 1 mi DAU (2/3 estudantes); Android só em ago/2025 | forte | "Se as pessoas pagam, é sinal forte" — liga a compra (RevenueCat) **antes** de gastar em aquisição, senão você compra usuários sem saber quem paga. |
| **Cal AI** | EUA, mai/2024 | Rede de 250+ criadores de fitness/nutrição em retainer postando conteúdo nativo em TikTok/IG → depois mídia paga | Mês 1 US$ 28 mil; mês 2 US$ 115 mil; US$ 1 mi acumulado em set/2024; criadores levaram a US$ 2 mi/mês; jan/2026: US$ 1 mi+/mês em anúncios contra US$ 5,7 mi de receita; 15 mi+ downloads; comprado pela MyFitnessPal (dez/2025) | moderada (agregadores citando TechCrunch/CNBC) | Retainer de criador escala, mas exige caixa e um produto com demo de 5 segundos (foto → calorias). O Perceva precisa achar o seu demo de 5 segundos antes de pagar qualquer criador. |
| **Puff Count** (Steven Cravotta) | EUA | TikTok orgânico: ao menos 1 post/dia no começo, áudio em alta, séries, respostas a comentários | ~300 mil downloads "principalmente por orgânico no TikTok"; sem prazo nem receita | fraca | É o caso mais próximo de "tempo > dinheiro". Sem prazo declarado, vale como direção, não como meta. |
| **Indie build in public** (Francisco Sainz, Medium) | — | Postar quase todo dia no X durante 5 meses | 1.000 usuários beta (200 ativos), 10–50 downloads/dia | fraca | Ordem de grandeza honesta do build in public sem audiência prévia: dezenas por dia, não milhares. |

### 1.2 Leitura transversal dos casos

- **O artefato compartilhável precede o canal.** Finch (pássaro), Cal AI (foto → calorias), Structured (timeline do dia), Opal (horas salvas). Cada um tem uma imagem que a pessoa quer mostrar. O Perceva tem candidatos — o radar das 6 áreas, o Espelho (percepção × prática × teste), "há N dias" do Cofre — mas nenhum foi desenhado para ser postado. Isso é trabalho de produto antes de ser trabalho de marketing.
- **Credencial substitui orçamento no Brasil.** Cíngulo chegou a milhões com R$ 150 mil investidos porque tinha prêmio de loja e dois psiquiatras. O Perceva não tem clínica; tem instrumentos nomeados e um discurso que recusa laudo. A credencial possível é "o único app em português que aplica Big Five 120, Schwartz e ECR-R e transforma o resultado em prática" — desde que cada palavra dessa frase seja verdadeira na tela.
- **A via editorial das lojas é real e barata, mas é iOS-first.** Structured, Stoic, Fabulous e Cíngulo têm reconhecimento da Apple no currículo. O Google também destaca (Cíngulo 2019), mas a janela para app novo é curta (ver 2.9).
- **Product Hunt é rodapé, não manchete.** Rosebud 55/76 upvotes; Opal 41/61. Nenhum deles cresceu por lá.

---

## 2. Canais — o que rende em 2026, com custo e expectativa

### 2.1 TikTok / Reels orgânico, founder-led

- Evidência: Puff Count (~300 mil downloads, orgânico), o vídeo orgânico mais visto do Finch (63,4 mi views, segundo Sparrow Apps), e o consenso dos playbooks de 2026 de que "um clipe bom traz milhares de usuários" mas "a maioria dos clipes dá quase nada" — tratar como loteria barata (ScreenFast). Força: **moderada**.
- Cadência recomendada pelos operadores: ao menos 1 post/dia no início (Tabcut) até 3/dia por 30 dias (Stormy). Formatos que aparecem repetidamente: carrossel/slideshow com texto narrativo; talking head com o app em green screen atrás; "app flash" (o app aparece 1–2 s dentro de um conteúdo maior); resposta em vídeo a comentários. Força: **fraca** (prática de operadores, não estudo).
- Para o Perceva: gravar em PT e EN separadamente (nunca legenda traduzida), com o artefato na tela nos 3 primeiros segundos. Medir por semana: views, salvamentos, cliques na bio, instalações via link de loja com UTM.

### 2.2 UGC pago (criador produz, você distribui)

- EUA (2026): US$ 150–300 por vídeo, mediana ~US$ 175; iniciantes ~US$ 75–300; profissionais US$ 500+; direitos de uso/whitelisting +30–50% da base; Spark Ads +30%/mês; pacotes de 5+ vídeos com 15–25% de desconto (Influee; DesignRevision). Força: **moderada** (fornecedores de mercado, sem metodologia aberta).
- Efeito: UGC "eleva a taxa impressão→instalação em média 152%" (Liftoff 2025 Creative Index, via The Social Outline). Força: **moderada**.
- **Brasil: não encontrei tabela específica de UGC.** Proxy razoável: nano-influenciadores cobram R$ 300–2.000 por Reels/TikTok (Estado de Minas, jun/2026); UGC sem distribuição no perfil do criador tende a custar menos que isso. Força: **fraca**.

### 2.3 Micro-influenciadores no Brasil (faixas 2026)

| Faixa | Feed (IG) | 3 Stories | Reels/TikTok | Fonte |
|---|---|---|---|---|
| Nano (até ~10 mil) | R$ 200–2.500 | R$ 150–1.500 | R$ 300–2.000 | Estado de Minas, 17/06/2026 |
| Micro (10–100 mil) | a partir de R$ 1.500 | R$ 1.000–4.000 | R$ 2.000–8.000 | Estado de Minas, 17/06/2026 |
| Micro (10–100 mil) | R$ 500–2.500 por post | — | — | Buzzcreators, jun/2026 |
| Macro (100 mil–1 mi) | R$ 5.000–20.000 por publicação | | | Estado de Minas |

- Reajuste de ~20% em jul/2026 em Stories, feed e Reels (JM Online). Força do bloco: **moderada** (jornalismo de mercado; a própria matéria do EM declara ranges, não pesquisa).
- Para um fundador solo: a faixa nano em **permuta** (premium vitalício + créditos) é a única que cabe; micro pago só depois de saber a taxa de conversão do perfil de loja.

### 2.4 Reddit

- Regra geral que vale em toda parte: 90/10 (90% participação genuína, 10% menção ao produto), e comunidades que operam 99/1. Recomendação dos guias: 2–4 semanas de participação antes de qualquer link. Caminho mais rápido para banimento: "postar o link em cinco subreddits no mesmo dia sem histórico em nenhum" (Redship). Força: **moderada**.
- **r/productivity (~4 mi)**: proíbe "advertising, soliciting, surveying, referral codes and self-promotion in any form", inclusive quando alguém pede recomendação e inclusive por DM (RedditGrowthDB; OneUp). Força: **forte** para esse sub.
- **r/SideProject**: autopromoção aceita, mas "bare landing-page drops" são removidos (Redship). Força: **moderada**.
- **r/getdisciplined, r/selfimprovement, r/habits, r/DecidingToBeBetter, r/androidapps, r/brasil, r/brdev**: **não consegui verificar as regras nesta sessão** (páginas bloqueadas para bots). Ler as regras de cada um antes de qualquer post.
- Dado de rendimento (anedótico): "um thread com 50 upvotes no sub certo traz 20–30 cadastros qualificados" e "Reddit + Indie Hackers deram 3–8× mais cadastros que Product Hunt" (Luka, 2026). Força: **fraca**.

### 2.5 Product Hunt — o que sobrou em 2026

- Só ~10% dos lançamentos ganham "Featured" (era 60–98% em 2020–2023); a curadoria editorial responde por ~70% do resultado; produtos featured recebem 1.000–5.000 visitantes e 10–150 cadastros no dia; não-featured, 100–500 visitantes e 1–15 cadastros; conversão típica 1–3% (Shno, compilando Awesome Directories/Waitlister). Força: **moderada**.
- Melhor janela: terça ou quarta, 00:01 Pacific; ranking premia velocidade na primeira hora e taxa de resposta a comentários (LaunchList). Força: **moderada**.
- Valor residual real: backlink de DR 91 e um dia de atenção. Não conte downloads por PH. Referências do próprio segmento: Rosebud 55 e 76 upvotes; Opal 41 e 61.

### 2.6 Show HN — o ângulo técnico (MCP) é o que abre a porta

- Regras (primárias): Show HN é para coisas que as pessoas podem **experimentar**; blog posts, páginas de cadastro, newsletters, landing pages e captação são off-topic; remova barreiras (evite exigir cadastro/e-mail); poste quando estiver pronto para teste, não antes. Força: **forte**.
- Dados originais (API do HN, 30 histórias cada, set/2026):
  - "Show HN … **MCP server**": mediana **23 pontos**; 7 acima de 50; 5 acima de 100 (Ghidra MCP 298, Anna's Archive 256, WhatsApp MCP 229, Blender MCP 151, MCP SDK em Bash 144).
  - "Show HN … **habit tracker**": mediana **~5 pontos**; 2 acima de 50; 0 acima de 100 (melhor: Patterns, 73, em 2023).
  - Leitura: o HN não quer mais um app de hábitos; quer um servidor MCP com uma ideia. Força: **forte** (dado) / **moderada** (interpretação).
- Atrito a resolver antes de postar: o MCP do Perceva exige conta no app + Claude em plano pago com connectors. Isso viola "remova barreiras". Opções: abrir o código do servidor MCP (o HN experimenta o código), oferecer uma conta demo somente leitura com dados fictícios, ou postar como "Show HN: um servidor MCP que entrega o seu próprio diário de humor e hábitos ao Claude — com log por voz" apontando para o repositório.
- Anedota de rendimento: ~300 downloads num dia para um app indie (Ask HN citado pela ScreenFast). Força: **fraca**.

### 2.7 Diretórios de conectores MCP / Claude

- **Registro oficial** (registry.modelcontextprotocol.io): em preview desde set/2025, API congelada em v0.1 (out/2025); publica-se com `mcp-publisher`; namespace verificado por GitHub (`io.github.<user>`) ou por DNS/HTTP para domínio próprio (`app.perceva`); sem fila de revisão humana. Força: **forte**.
- **Diretórios de descoberta**: Smithery (`smithery mcp publish <url>`), Glama (~37 mil servidores em meados de 2026; reivindicar a entrada muda de "crawl anônimo" para "dono verificado"), PulseMCP, mcp.so, PR no `punkpeye/awesome-mcp-servers` (Tallyfy; RoxyAPI). Força: **moderada**.
- **Diretório de conectores do Claude**: lançado em 14/07/2025; conectores remotos são só para planos pagos; a submissão comunitária passa pelo portal admin de uma organização Claude e, segundo o Manufact, exige organização Team/Enterprise (verificar direto na documentação da Anthropic antes de contar com isso). Força: **moderada**.
- Expectativa honesta: downloads perto de zero por essa via. O valor é credibilidade, SEO e ser encontrável pelo nicho "autoconhecimento + IA", que hoje não tem dono em português.

### 2.8 ASO — participação da busca, screenshots e vídeo

- **Busca**: "70% dos visitantes da App Store usam a busca para descobrir apps" e "quase 65% dos downloads acontecem diretamente depois de uma busca" (página oficial da Apple Ads). Força: **forte** (fonte primária, ainda que interessada). Estimativa independente citada por terceiros: ~59% (Sensor Tower). Força: **moderada**.
- **Conversão média nos EUA (2025)**: 8,56% na App Store e 16,15% no Google Play (AppTweak). Força: **moderada**.
- **Brasil é o 3º país em downloads**: 9,0 bilhões em 2025 (7,7 bi Google Play, 1,4 bi App Store); iOS cresceu 18% no ano enquanto o Play caiu 11% (AppTweak). Força: **moderada**.
- **Screenshots**: 35% dos top apps rodaram 2+ testes de screenshot no último ano; ~90% nunca testaram ícone nem vídeo (AppTweak 2026). Ganhos declarados por fornecedores de ASO: +18–35% com galeria otimizada; até +28% só reordenando (Phiture/AppTweak/SplitMetrics/StoreMaven, via compilações). Força: **moderada**.
- **Vídeo de prévia — contestado**: fornecedores dizem +16% (SplitMetrics), +20–35% (StoreMaven), +20–40% (SplitMetrics 2024–25). A **Apple publica o contrário no caso Simply Piano**: teste de 12 dias, a página **sem** vídeo venceu por +3% com 100% de confiança. Guias independentes registram que vídeo fraco derruba 10–15% (ScreenFast). Força: **contestada**. Conclusão prática: grave o vídeo (você vai precisar dele para social e imprensa), mas só o coloque na ficha depois de um experimento de listagem.
- Ritmo: ASO leva 4–8 semanas para mostrar movimento (ScreenFast). Força: **fraca**.

### 2.9 Featuring — como pedir (as duas lojas têm formulário)

**Apple** (fonte primária):
- App Store Connect → app → Featuring → Nominations → "+". Tipos: App Launch, App Enhancements, New Content. Antecedência mínima recomendada: **3 semanas**. Campos: descrição detalhada, data de publicação, países, localizações, até 5 URLs de material de apoio (TestFlight incluso), "detalhes úteis" sobre acessibilidade, inclusividade e o que é único no app/time. Papéis: Account Holder, Admin, App Manager ou Marketing. Recurso anunciado na WWDC de jun/2024, ativo desde set/2024 (TechCrunch).
- Critérios que aparecem nas leituras do formulário: UX, UI, inovação, singularidade, acessibilidade, localização, qualidade da página do produto (AppScreenshotStudio — força moderada). 95% dos apps destacados têm nota ≥ 4,0 (AppTweak).

**Google** (fonte primária):
- Existe formulário ("Featuring nomination"): antecedência mínima **3 semanas**; para app **novo, 8 semanas**, e o app precisa lançar em até **4 meses** da data desejada de destaque; nota mínima 3,0; APK/AAB no console; pede plano de marketing, modelo de monetização e métricas de retenção/ARPDAU. "Atender aos requisitos não garante promoção."
- Consequência para o Perceva: o relógio dos 4 meses começa no lançamento em produção no Play. Nomear na primeira semana de produção, não no terceiro mês.

**Efeito**: Train Station 2 teve +470% de instalações orgânicas e +540% de receita orgânica como Game of the Day nos EUA (AppTweak). Um multiplicador sobre uma base pequena ainda é um número pequeno — mas é o único multiplicador gratuito desse tamanho. Força: **moderada**.

### 2.10 Imprensa tech BR, newsletters e podcasts

| Veículo | Como entrar | Observação | Força |
|---|---|---|---|
| **Canaltech** | redacao@canaltech.com.br; formulário com assunto "Sugestões de pautas" | Declara 24 mi visitantes únicos/mês e 3 mi inscritos no YouTube | forte (página oficial) |
| **Olhar Digital** | e-mail de "Sugestão de pautas" na página Fale Conosco (endereço ofuscado contra bots; copiar do site) | Sem diretrizes públicas de pauta | moderada |
| **Tecnoblog** | Página de contato atrás de verificação anti-bot; consultar manualmente | Fundado em 2005 por Thiago Mobilon | fraca (não consegui abrir) |
| **TechTudo** | Matérias-tutorial ("como usar X") — Cíngulo tem página de tópico desde 2019 | Tutorial é a porta de entrada para app novo | moderada |
| **StartSe** | imprensa@startse.com | Hoje é escola de negócios com seção editorial; foco em IA e liderança | moderada |
| **Manual do Usuário** (Rodrigo Ghedin) | ghedin@manualdousuario.net (preferido) | "Slow web", bem-estar digital, privacidade, FOSS; publica às sextas. Encaixe direto com "sem tracking, dados do usuário como fronteira, sem streak punitivo" | forte (página oficial) |
| **the news** (Waffle) | Não consegui abrir media kit | Existe; audiência não verificada | fraca |
| **Naruhodo!** (B9) | Contato geral do B9; tem quadro "Naruhodo Entrevista" | Semanal, ciência e psicologia. Pitch: a ciência (Big Five, Schwartz, apego), nunca o app | moderada |
| **Hipsters Ponto Tech** (Alura) | Instagram @hipsterspontotech; entrevista devs e fundadores toda semana (ep. #532 em set/2026) | Pitch: RN/Expo + Supabase + servidor MCP + fundador solo | moderada |
| **Braincast** (B9) | — | Painel, não entrevista; baixa prioridade | moderada |
| **Autoconsciente** (B9) | — | Último episódio em fev/2022: dormente; não perder tempo | forte |

Ângulos que a imprensa BR historicamente compra para apps nacionais (inferência dos casos, não dado): "app brasileiro feito por um desenvolvedor", "sem streak punitivo", "seus dados conversam com o seu assistente de IA", "teste de personalidade sério que vira prática". Força: **fraca**.

---

## 3. CPI e CAC de referência (2025–2026)

### 3.1 Tabela

| Recorte | Valor | Fonte / período | Força |
|---|---|---|---|
| Health & Fitness, iOS, Tier 1 (EUA) | US$ 2–10; meditação/bem-estar mental US$ 4–10 | Admiral Media, abr/2026 (€500 mi+ geridos) | moderada |
| Health & Fitness, Android, Tier 1 | US$ 1–5; meditação/bem-estar mental US$ 2–5 | Admiral Media, 2026 | moderada |
| LATAM/Brasil vs Tier 1 | 50–70% mais barato | Admiral Media, 2026 | moderada |
| Health & Wellness, Tier 3 (LATAM, SEA) | £0,30–2 | The Social Outline, 2026 | moderada |
| América Latina, geral | US$ 0,50–2,00 (América do Norte: US$ 2,50–5,00) | Business of Apps (AppsFlyer/Adjust/Sensor Tower/Singular) | moderada |
| TikTok vs Meta | 10–30% abaixo da Meta quando público 18–34 casa; 20–50% acima quando não casa | Admiral Media, 2026 | moderada |
| Apple Search Ads, termos de marca | US$ 0,80–3,00 | Admiral Media | moderada |
| Meta Ads Brasil, CPM 2026 | Feed R$ 15–35; Stories/Reels R$ 8–20; +12,15% desde 01/01/2026 (repasse PIS/Cofins + ISS) | Vini Ensina, 2026 | fraca |
| TikTok Ads Brasil, 2026 | CPM R$ 8–25; CPC R$ 0,80–2,50; teste mínimo viável R$ 3–5 mil em 30 dias | Expert Digital (2.847 campanhas, set/2025–mai/2026) | fraca |
| Retenção H&F alvo | D1 25–32% · D7 11–16% · D30 5–9% | Admiral Media, 2026 | moderada |
| Trial→pago H&F | mediana 37,7% (top quartil > 51,4%) | RevenueCat 2026 (115 mil apps) | forte |
| LTV por pagante H&F, ano 1 | US$ 35,64 (mediana) | RevenueCat 2026 | forte |
| Instalação→pagante em D35, América Latina | 1,5% (mediana) | RevenueCat 2026 | forte |
| Início de trial por instalação, H&F | 18–28% | Business of Apps (resumo; página bloqueada) | fraca |

### 3.2 A conta que decide se vale pagar

Premissas: preço BR R$ 99,90/ano (≈ R$ 85 líquidos após a loja) e US$ 19,99/ano nos EUA; conversão instalação→pagante = 1,5% (mediana LATAM, RevenueCat) — o Perceva ainda não tem o próprio número.

- **Brasil, Android, Meta/TikTok**: CPI US$ 0,50–2,00 ≈ R$ 2,70–11 → CAC por pagante = R$ 180–730. Contra R$ 85 líquidos no primeiro ano: **não paga**. Passa a fechar com conversão ≥ 5–8% ou CPI ≤ R$ 1,30 (improvável fora de criativo excepcional).
- **EUA, iOS, meditação/bem-estar**: CPI US$ 4–10 → CAC por pagante US$ 270–670 contra US$ 19,99/ano: **não paga** em nenhuma hipótese razoável de conversão.
- **Conclusão**: mídia paga nos primeiros 90 dias serve para (a) descobrir qual criativo/mensagem converte na ficha da loja e (b) medir D1/D7/D30 com volume mínimo. Orçamento de aprendizado: R$ 3–5 mil em 30 dias, Android/BR, um único objetivo (instalação) e 4–6 criativos, cortando o que não atinge a conversão de ficha do orgânico. Escalar só depois de ter conversão própria medida e compra ligada (lição Opal).

---

## 4. O que esperar em 90 dias — fundador solo, tempo > dinheiro

### 4.1 Premissas comuns

- Android em produção pública no Google Play (hoje: teste fechado; a regra de 12 testadores por 14 dias contínuos vale para contas pessoais criadas depois de 13/11/2023 e o Google responde em ~7 dias após "Apply for production").
- iOS **não** disponível nos 90 dias (conta Apple pendente). Todo o esforço em inglês fica reduzido a preparar ativos; a aquisição EN espera o iOS.
- Site com botão de loja **real** (Play), não "Em breve".
- 10–15 h/semana do fundador para GTM; orçamento de R$ 0 a R$ 5 mil.
- Compra premium ligada (RevenueCat) até o dia 30 — sem isso não há como medir conversão nem há motivo para pagar mídia.

### 4.2 Base de realidade

- Mediana de app de assinatura 12 meses após o lançamento: US$ 72/mês; 17,3% chegam a US$ 1 mil MRR em 2 anos; 57,7% nunca chegam a US$ 1 mil acumulados; top 10% acima de US$ 2.574/mês (RevenueCat 2026). Força: **forte**.
- Product Hunt sem featured: 100–500 visitantes; featured: 1–5 mil; conversão 1–3%. Show HN de app: mediana ~5 pontos; de servidor MCP: mediana 23. Build in public sem audiência: 10–50 downloads/dia. Conversão de ficha: 8–16%.

### 4.3 Cenários (downloads acumulados em 90 dias)

| Cenário | O que acontece | Downloads | Sinais que confirmam |
|---|---|---|---|
| **Conservador** | ASO em PT feito uma vez; 2 posts/semana; 1 Show HN do MCP (~20 pontos); listagens MCP; 1 matéria pequena ou nenhuma | **300–1.500** | 20–60 usuários ativos/dia; 0–15 pagantes; D7 abaixo de 11% pede correção de onboarding antes de qualquer gasto |
| **Realista** | ASO iterado com 1 experimento de listagem; 3–5 clipes/semana founder-led em PT (+ EN em estoque); Show HN do MCP com 30–80 pontos; formulário de featuring do Google enviado na semana 1 de produção; 2–3 matérias BR (Canaltech, Manual do Usuário, tutorial no TechTudo); 10–20 nano-influenciadores em permuta; teste de R$ 3–5 mil em ads | **1.500–6.000** | um clipe passando de 300–500 mil views rende +1–3 mil instalações em 48 h; conversão de ficha ≥ 12% no Play; 30–100 pagantes |
| **Otimista** | Destaque do Google Play Brasil, ou clipe > 2 mi views, ou matéria grande + Show HN > 150 pontos | **10.000–30.000+** | picos de 3–8 mil/dia por 2–4 dias, depois queda de 70–90% (padrão de todo pico não sustentado); o que fica é o que a retenção segura |

Força dos cenários: **fraca** — triangulação do painel a partir dos benchmarks acima, não dado observado de apps comparáveis em pt-BR. O objetivo deles é calibrar expectativa, não prometer.

### 4.4 O que medir para saber em qual cenário se está (semana a semana)

1. Conversão da ficha (Play Console): alvo ≥ 12–16%.
2. D1/D7/D30 contra 25–32 / 11–16 / 5–9%.
3. Trial→pago contra 37,7%.
4. Instalação→pagante em D35 contra 1,5% (LATAM).
5. Por canal (UTM/links de loja): instalações por clipe, por matéria, por post.

---

## 5. Armadilhas específicas

### 5.1 Lançar sem iOS

- iOS tem 28,7% dos aparelhos no mundo e **64,2% do gasto em apps** (App Store US$ 94 bi vs Google Play US$ 55 bi em 2025; usuário iOS gasta US$ 63/ano vs US$ 13 no Android — Sensor Tower, via DigitalApplied). **77% dos novos apps de assinatura** lançam em iOS (RevenueCat, jan/2026). Força: **moderada/forte**.
- No Brasil: Android 75,45% vs iOS 24,54% (StatCounter, ago/2026; outra fonte traz 84/16 — a diferença é metodológica, ambas apontam Android dominante). Mas downloads iOS cresceram 18% em 2025 enquanto o Play caiu 11% (AppTweak). Força: **forte** (StatCounter) / **moderada** (AppTweak).
- Toda a via editorial da Apple (Structured, Stoic, Fabulous, Cíngulo "Destaque da Apple") e o público de imprensa/TikTok dos EUA (que usa iPhone) ficam fechados.
- Decisão coerente: Android-first no Brasil por 90 dias é defensável; **gastar em EN antes do iOS não é**.

### 5.2 Botões "Em breve"

- O Show HN rejeita landing pages e páginas de cadastro por regra. O tráfego de Product Hunt converte 1–3% **com** produto no ar; sem produto, converte em nada. Ofensiva (concorrente BR) exibe "em breve" nos planos pagos — o mesmo sinal de imaturidade que o Perceva exibe hoje no botão de loja.
- Dentro do app, a Guideline 2.1 da Apple derruba builds com "coming soon" (já registrado no playbook de publicação do repositório).
- Ação: o botão Android do site deve apontar para a ficha real do Play (teste aberto ou produção) esta semana; o botão iOS vira "avise-me quando sair no iPhone" — o único lugar legítimo para uma lista de espera.

### 5.3 Lista de espera vs download direto

- **Não encontrei benchmark confiável de conversão de waitlist para usuário ativo.** O que existe: o pré-registro do Google Play (máximo 90 dias por país, push + auto-instalação no lançamento, métrica "instalou em até 14 dias") foi desenhado para jogos com data marcada. O Perceva já tem build de produção. Lista de espera aqui adiciona um passo e adia o único dado que importa nos primeiros 90 dias: retenção. Força: **fraca** (raciocínio, sem dado).
- Exceção: se o teste fechado de 14 dias ainda estiver rodando, o pré-registro é melhor do que "Em breve".

### 5.4 Falta de vídeo de prévia

- Contestado (2.8): a Apple publicou um caso em que a página sem vídeo venceu; fornecedores publicam ganhos de 16–40%. O vídeo é obrigatório para social, imprensa e nomeação de featuring; na ficha, só com experimento. Não ter vídeo nenhum é o erro; colocar vídeo ruim na ficha é o segundo.

### 5.5 Outras armadilhas que a evidência aponta

- Linguagem "baseado em ciência" sem instrumento (Fabulous) — guardrail do playbook.
- Postar link em vários subreddits no mesmo dia — banimento (2.4).
- Product Hunt sem audiência prévia — 100–500 visitantes e nenhum efeito (2.5).
- Perder a janela de 4 meses do formulário de featuring do Google (2.9).
- Chamar o MCP de "coach" ou "mentor" — Rosebud pode; o Perceva não (guardrail 2).
- Comprar instalações antes de ligar a compra e medir retenção — a lição de Opal ao contrário.

---

## 6. Calendário de 90 dias (derivado da evidência; usar como rascunho)

| Semana | Entrega | Base |
|---|---|---|
| 1 | Botão do site → ficha real do Play; ficha PT com screenshots novos; formulário de featuring do Google enviado (app novo: 8 semanas de antecedência, janela de 4 meses) | 2.8, 2.9, 5.2 |
| 1–2 | Registrar o MCP no registro oficial (namespace `app.perceva` via DNS), Smithery, Glama, PulseMCP; PR no awesome-mcp-servers | 2.7 |
| 2 | Vídeo de 15–30 s com tela real (para social/imprensa; ficha só após experimento) | 2.8, 5.4 |
| 2–3 | Pitch para Manual do Usuário e Canaltech; tutorial para TechTudo; e-mail para Hipsters Ponto Tech (ângulo técnico) | 2.10 |
| 3 | Show HN do servidor MCP (código aberto ou conta demo somente leitura) | 2.6 |
| 3–12 | 3–5 clipes/semana em PT; artefato na tela nos 3 primeiros segundos; 1 post/semana no X/LinkedIn contando números reais | 2.1 |
| 4 | Compra premium ligada; começar a medir trial→pago e D35 | 3.2, 4.4 |
| 5–8 | 10–20 nano-influenciadores em permuta (premium vitalício); experimento de listagem A/B (screenshots, depois vídeo) | 2.3, 2.8 |
| 6–10 | Se conversão de ficha ≥ 12% e D7 ≥ 11%: teste de R$ 3–5 mil em Meta/TikTok Android BR | 3.2 |
| 9–12 | Nomeação de featuring Apple preparada (história do desenvolvedor, acessibilidade, localização) para o dia em que houver build iOS | 2.9 |

---

## 7. Tabela de alegações

| # | Alegação | Força | Fontes |
|---|---|---|---|
| 1 | Finch foi lançado em 12/05/2021, é bootstrapped, e em set/2024 era estimado em ~600 mil downloads/mês e ~US$ 1 mi/mês, #2 Top Free Health & Fitness iPhone | moderada | S40, S41, S42, S43 |
| 2 | O motor de crescimento do Finch é mídia paga em Meta/TikTok com criativos estilo UGC (600+ criativos ativos em Meta, 58→660 de jan/2025 a jan/2026), apoiado por conteúdo orgânico de usuários; não há programa de embaixadores | moderada | S41 |
| 3 | Nos primeiros meses, os fundadores do Finch atribuem a tração a retenção D2 inesperada e a co-desenvolvimento com a comunidade no Facebook (desde jun/2021), com o núcleo gratuito | moderada | S40 |
| 4 | Fabulous foi cofundado em 2013 e incubado no Center for Advanced Hindsight (Duke) com Dan Ariely; declara 37 mi de pessoas ajudadas; foi finalista Best App Google Play 2017, Material Design Award e "Best Self-Care App 2018" na App Store | moderada (prêmios) / fraca (37 mi, autodeclarado) | S44, S45 |
| 5 | Não encontrei fonte quantificando a aquisição paga do Fabulous | fraca | — |
| 6 | Habitica: matéria do Lifehacker em 2012 levou de um punhado para 20 mil usuários; Kickstarter jan–fev/2013 bateu a meta de US$ 25 mil em 11/02/2013 e fechou acima de US$ 40 mil; fundado 30/01/2013; espaços sociais removidos em ago/2023 | moderada | S46, S47, S48 |
| 7 | Habitica ter "4 milhões de usuários" não foi verificado | fraca | — |
| 8 | Cíngulo: ~2,3 mi downloads em abr/2021 com R$ 150 mil investidos e 14 pessoas; Google Play Melhor App 2019 (Brasil); "Destaque da Apple"; fundadores psiquiatras PhD; premium R$ 99,99/semestre | moderada | S49, S50, S51, S52 |
| 9 | Cíngulo chegou a 3–4 mi downloads e 200 mil acessos/mês com pouco marketing, por boca a boca e avaliações | fraca (resumo de busca; páginas não abertas) | S50, S81 |
| 10 | Ofensiva é um PWA lançado em jul/2026 (Softprox), "o Duolingo da vida real", com planos pagos "em breve" e estratégia de SEO em pt-BR; sem números de usuários públicos | forte (fatos do site) / fraca (crescimento) | S53, S54 |
| 11 | Rosebud: PH 26/07/2023 com 55 upvotes e 06/08/2024 com 76 upvotes (#4 do dia); 500 mi palavras; seed US$ 6 mi em jun/2025; US$ 12,99/mês | forte | S55, S56 |
| 12 | Stoic (YC S19) cresceu por boca a boca entre fundadores/traders, foi tema de editorial da Apple e o fundador faz ligações semanais com usuários; sem números públicos | moderada | S57, S58 |
| 13 | Structured declara 15 mi+ downloads, 400 mil+ avaliações 5★ e 500 mil+ Pro; é App Store Award finalist, "Apps We Love" e finalista do Apple Design Award 2026 (Inclusividade) | moderada (autodeclarado) / forte (Apple) | S59, S60, S61 |
| 14 | Opal cobrou desde o dia 1, lançou iOS/US-only, rodou 121 testes A/B, chegou a US$ 5 mi ARR com 6–7 pessoas e US$ 10 mi com 11; a virada para freemium derrubou conversão de 20% para 9% e levou a 1 mi DAU; PH 41 (2021) e 61 (2022) upvotes; Android só em ago/2025 | forte | S62, S63, S64, S65 |
| 15 | Cal AI (mai/2024) cresceu com 250+ criadores em retainer até US$ 2 mi/mês, depois mídia paga (US$ 1 mi+/mês em jan/2026 contra US$ 5,7 mi de receita); 15 mi+ downloads; comprado pela MyFitnessPal | moderada | S66 |
| 16 | Puff Count chegou a ~300 mil downloads principalmente por TikTok orgânico, postando ao menos 1×/dia no início | fraca | S67 |
| 17 | Build in public sem audiência prévia rende dezenas de downloads/dia (10–50), não milhares | fraca | S69 |
| 18 | ~65% dos downloads da App Store acontecem logo após uma busca e 70% dos visitantes usam busca | forte (Apple) | S1 |
| 19 | Conversão média de ficha nos EUA em 2025: 8,56% App Store, 16,15% Google Play | moderada | S11 |
| 20 | Brasil é o 3º país em downloads (9,0 bi em 2025; 7,7 bi Play, 1,4 bi iOS; iOS +18%, Play −11%) | moderada | S10 |
| 21 | Vídeo de prévia na ficha aumenta conversão | contestada | S4 (Apple: sem vídeo venceu +3%), S13, S14 |
| 22 | 35% dos top apps testaram screenshots 2+ vezes; ~90% nunca testaram ícone ou vídeo | moderada | S12 |
| 23 | A Apple aceita nomeações de featuring no App Store Connect desde set/2024, com 3 semanas de antecedência mínima e 3 tipos (Launch, Enhancements, New Content) | forte | S2, S3 |
| 24 | O Google tem formulário de featuring: 3 semanas de antecedência (8 para app novo), app novo deve lançar em até 4 meses da data de destaque, nota ≥ 3,0, pede plano de marketing e métricas | forte | S5, S6 |
| 25 | Featuring como Game of the Day rendeu +470% de instalações orgânicas (Train Station 2); 95% dos apps destacados têm nota ≥ 4,0 | moderada | S9 |
| 26 | Contas pessoais do Play criadas após 13/11/2023 precisam de 12 testadores por 14 dias contínuos antes de produção; revisão em ~7 dias | forte | S7 |
| 27 | Pré-registro no Play dura no máximo 90 dias por país, dispara push e pode auto-instalar no lançamento | forte | S8 |
| 28 | Product Hunt: ~10% dos lançamentos ganham featured; featured = 1–5 mil visitantes e 10–150 cadastros; não-featured = 100–500 e 1–15; conversão 1–3%; melhor terça/quarta 00:01 PT | moderada | S26, S27 |
| 29 | Show HN exige algo que se possa experimentar e rejeita landing pages/páginas de cadastro | forte | S29 |
| 30 | "Show HN … MCP server": mediana 23 pontos, 7/30 acima de 50, 5/30 acima de 100; "Show HN … habit tracker": mediana ~5, 2/30 acima de 50, 0 acima de 100 | forte (dado primário via API) | S30, S31 |
| 31 | r/productivity (~4 mi) proíbe autopromoção em qualquer forma; regra geral 90/10; 2–4 semanas de participação antes; link em 5 subs no mesmo dia = banimento | forte (r/productivity) / moderada (geral) | S32, S33 |
| 32 | Regras de r/getdisciplined, r/selfimprovement, r/habits, r/DecidingToBeBetter, r/androidapps, r/brasil não foram verificadas nesta sessão | fraca | — |
| 33 | Registro oficial MCP em preview (API v0.1 congelada out/2025), publicação via mcp-publisher com namespace verificado por GitHub ou DNS; Glama ~37 mil servidores | forte (registro) / moderada (diretórios) | S36, S37 |
| 34 | Diretório de conectores do Claude lançado em 14/07/2025; conectores remotos só em planos pagos; submissão comunitária via portal admin, aparentemente exigindo organização Team/Enterprise | moderada | S34, S35 |
| 35 | CPI Health & Fitness 2026: iOS Tier 1 US$ 2–10 (meditação/bem-estar US$ 4–10), Android US$ 1–5; LATAM 50–70% mais barato; TikTok 10–30% abaixo da Meta quando o público casa | moderada | S15, S16, S17 |
| 36 | Meta Ads BR 2026: CPM feed R$ 15–35, Reels R$ 8–20, +12,15% por repasse tributário; TikTok Ads BR: CPM R$ 8–25, CPC R$ 0,80–2,50, teste mínimo R$ 3–5 mil/30 dias | fraca | S19, S20 |
| 37 | RevenueCat 2026: mediana US$ 72/mês após 1 ano; 17,3% chegam a US$ 1 mil MRR em 2 anos; 57,7% nunca chegam a US$ 1 mil acumulados; H&F trial→pago 37,7%, LTV/pagante US$ 35,64; LATAM D35 1,5%; 77% dos lançamentos em iOS | forte | S18 |
| 38 | Micro-influenciadores BR (10–100 mil): Reels R$ 2.000–8.000, Stories R$ 1.000–4.000, feed a partir de R$ 1.500 (EM); R$ 500–2.500/post (Buzzcreators); nano: Reels R$ 300–2.000; reajuste ~20% em jul/2026 | moderada | S21, S22, S23 |
| 39 | UGC nos EUA: US$ 150–300/vídeo (mediana ~US$ 175), direitos +30–50%, Spark Ads +30%/mês, pacotes 5+ com 15–25% de desconto; UGC eleva impressão→instalação em ~152% (Liftoff) | moderada | S24, S25, S16 |
| 40 | Não encontrei tabela de preços de UGC no Brasil | fraca | — |
| 41 | iOS = 64,2% do gasto global em apps (US$ 94 bi vs US$ 55 bi em 2025); Brasil: Android 75,45% / iOS 24,54% (ago/2026) | moderada (Sensor Tower via terceiro) / forte (StatCounter) | S39, S38 |
| 42 | Não encontrei benchmark de conversão de lista de espera para usuário ativo | fraca | — |
| 43 | Canaltech recebe pauta em redacao@canaltech.com.br e declara 24 mi visitantes únicos/mês; Manual do Usuário recebe em ghedin@manualdousuario.net; StartSe em imprensa@startse.com; Naruhodo! e Hipsters Ponto Tech são semanais e fazem entrevistas; Autoconsciente está dormente desde fev/2022 | forte | S70, S71, S72, S73, S74, S75, S76, S77 |
| 44 | Retenção alvo H&F: D1 25–32%, D7 11–16%, D30 5–9%; início de trial 18–28% das instalações | moderada / fraca | S15, S79 |
| 45 | Cenários de 90 dias (300–1.500 / 1.500–6.000 / 10.000–30.000+) | fraca (triangulação do painel) | S18, S26, S30, S31, S69 |

---

## 8. Fontes

- S1 Apple Ads — App Store search: https://ads.apple.com/app-store/
- S2 Apple — Nominate your app for featuring: https://developer.apple.com/help/app-store-connect/manage-featuring-nominations/nominate-your-app-for-featuring/
- S3 TechCrunch (2024-06-13) — Apple featuring nominations: https://techcrunch.com/2024/06/13/apple-gives-developers-a-way-to-nominate-their-apps-for-editorial-consideration-on-the-app-store
- S4 Apple — Product Page Optimization (caso Simply Piano): https://developer.apple.com/app-store/product-page-optimization/
- S5 Google Play Console — Getting featured: https://play.google.com/console/about/guides/featuring/
- S6 Google Play — Featuring nomination form: https://support.google.com/googleplay/contact/featuring_review?hl=en
- S7 Google Play — Closed testing requirements (personal accounts): https://support.google.com/googleplay/android-developer/answer/14151465
- S8 Google Play — Pre-registration: https://support.google.com/googleplay/android-developer/answer/9859047
- S9 AppTweak — How to get featured (Train Station 2): https://www.apptweak.com/en/aso-blog/how-to-get-your-app-featured-on-the-app-store
- S10 AppTweak — App downloads by country 2025: https://www.apptweak.com/en/reports/app-downloads-by-country
- S11 AppTweak — Average conversion rate per category 2025: https://www.apptweak.com/en/aso-blog/average-app-conversion-rate-per-category
- S12 AppTweak — ASO & Apple Ads benchmarks report 2026: https://www.apptweak.com/en/aso-blog/aso-app-store-trends-benchmarks-report
- S13 SplitMetrics — App preview video guide: https://splitmetrics.com/blog/create-app-preview-video-app-store-ios/
- S14 ScreenFast — Indie iOS app marketing strategy 2026: https://screenfast.app/blog/indie-ios-app-marketing-strategy-2026
- S15 Admiral Media — Mobile app marketing benchmarks 2026: https://admiral.media/mobile-app-marketing-benchmarks-2026/
- S16 The Social Outline — Mobile app CPI benchmarks 2026: https://thesocialoutline.com/blog/mobile-app-cpi-benchmarks-2026
- S17 Business of Apps — Cost per install: https://www.businessofapps.com/ads/cpi/research/cost-per-install/
- S18 RevenueCat — State of Subscription Apps 2026: https://www.revenuecat.com/state-of-subscription-apps
- S19 Vini Ensina — Estatísticas Meta Ads Brasil 2026: https://viniensina.com.br/estatisticas-meta-ads-brasil-2026/
- S20 Expert Digital — ROI TikTok Ads 2026 Brasil: https://expertdigitaloficial.com.br/blog/roi-tiktok-ads-2026-custos-retorno-real-brasil
- S21 Estado de Minas (2026-06-17) — Quanto custa contratar um influencer: https://www.em.com.br/trends/2026/06/7442820-quanto-custa-contratar-um-influencer-no-brasil-veja-a-tabela-de-precos.html
- S22 Buzzcreators — Quanto custa contratar influenciador: https://blog.buzzcreators.com.br/blog/quanto-custa-contratar-influenciador
- S23 JM Online — Quanto custa contratar um influenciador em 2026: https://jmonline.com.br/geral/quanto-custa-contratar-um-influenciador-no-brasil-em-2026-veja-os-precos-1.636030
- S24 Influee — UGC rates 2026: https://influee.co/blog/ugc-price
- S25 DesignRevision — UGC creator pricing 2026: https://designrevision.com/blog/ugc-creator-pricing
- S26 Shno — Product Hunt launch statistics 2026: https://www.shno.co/marketing-statistics/product-hunt-launch-statistics
- S27 LaunchList — How to launch on Product Hunt 2026: https://getlaunchlist.com/blog/how-to-launch-on-product-hunt-2026
- S28 Luka — Product Hunt is dead for indie hackers (2026): https://luka.to/blog/product-hunt-dead-indie-hackers-first-users-2026
- S29 Hacker News — Show HN rules: https://news.ycombinator.com/showhn.html
- S30 HN Algolia API — "Show HN" MCP server: https://hn.algolia.com/api/v1/search?query=%22Show%20HN%22%20MCP%20server&tags=story&hitsPerPage=30
- S31 HN Algolia API — "Show HN" habit tracker: https://hn.algolia.com/api/v1/search?query=%22Show%20HN%22%20habit%20tracker&tags=story&hitsPerPage=30
- S32 Redship — Reddit self-promotion rules 2026: https://redship.io/blog/reddit-self-promotion-rules
- S33 RedditGrowthDB — r/productivity: https://www.redditgrowthdb.com/database/subreddits/productivity
- S34 Claude blog — Connectors directory (2025-07-14): https://claude.com/blog/connectors-directory
- S35 Manufact — Submit MCP server to Anthropic directory: https://manufact.com/blog/submit-mcp-server-to-anthropic-directory
- S36 GitHub — modelcontextprotocol/registry: https://github.com/modelcontextprotocol/registry
- S37 Tallyfy — How to list your MCP server: https://tallyfy.com/how-to-list-mcp-server-registry-smithery-glama-pulsemcp/
- S38 StatCounter — Mobile OS market share Brazil: https://gs.statcounter.com/os-market-share/mobile/brazil
- S39 DigitalApplied — Mobile OS market share 2026 (cita Sensor Tower): https://www.digitalapplied.com/blog/mobile-os-market-share-2026-ios-vs-android
- S40 Finch (Medium oficial) — A look back on Finch's first year: https://medium.com/finchcare/a-look-back-on-finchs-first-year-599ba68d06f2
- S41 Sparrow Apps — Finch: how a self-care app hit $30M ARR: https://blog.sparrowapps.io/p/finch-how-a-self-care-app-hit-30m-arr-without-vc-money
- S42 Adapty — Finch paywall library: https://adapty.io/paywall-library/finch/
- S43 Sensor Tower — Finch overview (login; usado o snippet): https://app.sensortower.com/overview/1528595748?country=US
- S44 App Store story — Fabulous "Build Habits Through Science": https://apps.apple.com/us/story/id1324941860
- S45 The Fabulous: https://www.thefabulous.co/
- S46 Wikipedia — Habitica: https://en.wikipedia.org/wiki/Habitica
- S47 GitHub HabitRPG/habitica issue #369 — Kickstarter hits $25,000: https://github.com/HabitRPG/habitica/issues/369
- S48 Habitica Wiki — Community (via snippet; página bloqueada): https://habitica.fandom.com/wiki/Community
- S49 Instituto Caldeira (2021-04-08) — Cíngulo: https://institutocaldeira.org.br/blog/cingulo-quer-ajudar-a-cuidar-da-saude-mental-dos-brasileiros/
- S50 Assespro-RS — Cíngulo (snippet; página não abriu): https://www.assespro-rs.org.br/com-tecnologia-e-inteligencia-artificial-cingulo-quer-democratizar-acesso-a-tratamento-de-doencas-mentais/
- S51 Cíngulo — site: http://www.cingulo.com/
- S52 TechTudo — Cíngulo (página de tópico): https://www.techtudo.com.br/tudo-sobre/cingulo-autoconhecimento/
- S53 Ofensiva — site: https://ofensiva.app/
- S54 Ofensiva — blog (2026-08-12): https://ofensiva.app/blog/app-de-habitos-gratis-em-portugues
- S55 Product Hunt — Rosebud: https://www.producthunt.com/products/rosebud
- S56 TechCrunch (2025-06-04) — Rosebud lands $6M: https://techcrunch.com/2025/06/04/rosebud-lands-6m-to-scale-its-interactive-ai-journaling-app
- S57 TechCrunch (2019-08-20) — YC-backed Stoic: https://techcrunch.com/2019/08/20/y-combinator-stoic/
- S58 App Store story — Stoic "Starting Your Day Just Right": https://apps.apple.com/us/iphone/story/id1613760099
- S59 Structured — site: https://structured.app/
- S60 App Store story — Structured: https://apps.apple.com/us/iphone/story/id1596158592
- S61 Apple Design Awards 2026: https://developer.apple.com/design/awards/
- S62 Speedinvest — How Opal built a $10M ARR business: https://www.speedinvest.com/knowledge/scaling-smart-how-opal-built-a-10m-arr-business-in-just-2-years
- S63 RevenueCat — Opal freemium to 1M DAU (2026): https://www.revenuecat.com/blog/growth/kenneth-schlenker-sub-club-podcast-2026
- S64 RevenueCat — Opal on Sub Club (121 A/B tests): https://www.revenuecat.com/blog/growth/kenneth-schlenker-opal-sub-club-podcast
- S65 Product Hunt — Opal: https://www.producthunt.com/products/opal?launch=the-new-opal
- S66 Superframeworks — Cal AI case study: https://superframeworks.com/case-study/cal-ai
- S67 Tabcut — Puff Count TikTok organic: https://www.tabcut.com/blog/post/the-tiktok-organic-strategy-that-led-to-320k-app-downloads
- S68 Stormy — TikTok organic for apps: https://stormy.ai/blog/tiktok-organic-strategy-viral-app-growth
- S69 Francisco Sainz (Medium) — indie iOS development (snippet; página bloqueada): https://medium.com/@pacosw/my-experience-getting-into-indie-ios-development-fea725f3e6ba
- S70 Canaltech — Sobre: https://canaltech.com.br/sobre/
- S71 Olhar Digital — Fale conosco: https://olhardigital.com.br/fale-conosco/
- S72 StartSe: https://www.startse.com/
- S73 Manual do Usuário — Sobre: https://manualdousuario.net/sobre/
- S74 B9 — Naruhodo!: https://www.b9.com.br/shows/naruhodo/
- S75 Hipsters Ponto Tech: https://www.hipsters.tech/
- S76 B9 — Braincast: https://www.b9.com.br/shows/braincast/
- S77 B9 — Autoconsciente: https://www.b9.com.br/shows/autoconsciente/
- S78 AppScreenshotStudio — Apple's 7 scoring criteria (secundário): https://appscreenshotstudio.com/blog/get-featured-on-the-app-store-2026-nominations-guide
- S79 Business of Apps — Health & Fitness app benchmarks (snippet; página bloqueada): https://www.businessofapps.com/data/health-fitness-app-benchmarks/
- S80 Datatonics — State of Mobile 2025 (Sensor Tower): https://datatonics.substack.com/p/270-state-of-mobile-2025-sensor-tower
- S81 Gazz Conecta — 5 aplicativos para fazer terapia (snippet): https://gazzconecta.com.br/gazz-conecta/5-aplicativos-para-fazer-terapia-e-encontrar-apoio-psicologico-online/
