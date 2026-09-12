# Perceva — GTM de 90 dias, plano operacional (v1, 2026-09-12)

Detalha a §8 da espinha (`00-espinha.md`): três fases, north-star e metas já decididas. Este documento não reabre nada — ele diz **quem faz o quê, em que semana, com que número e como sabemos se funcionou**.

**Fontes (sem web; tudo vem daqui):** ESP = `playbook/00-espinha.md` · GTM = `research/gtm-benchmarks.md` · PD = `research/publico-demanda.md` · FP = `research/fidelidade-produto.md` · MP = `research/mercado-posicionamento.md` · ESC = `docs/scale-and-cost-playbook.md` §5 · PUB = `docs/publish/00-playbook.md`. O que nenhum deles sustenta está marcado **[a confirmar]**.

**Premissas herdadas da espinha (§8):** beachhead Marina, pt-BR, Android · produção pública na Play até a S2 · iOS não chega em 90 dias e **nunca ganha data** · 10–15 h/semana do fundador · orçamento R$ 0 a R$ 5 mil · compra premium confirmada até o dia 30 ou CTA "em breve" · zero gasto em EN antes do iOS · Social não existe e não aparece em nenhuma peça · Conector sempre "(hoje, Claude)".

**Donos:** **André** = fundador (rosto, contas, consoles, decisões de dinheiro) · **Artur** = testador e colaborador (aparelho real, recrutamento de testadores, revisão de copy pt) · **Claude** = código, copy, migrations, ficha, pitches, planilha, leituras de banco.

**Calendário:** S1 começa segunda 14/09/2026; S13 termina 13/12/2026. Fase 0 = S1–S2 · Fase 1 = S3–S8 · Fase 2 = S9–S13.

---

## 1. Pré-requisitos de lançamento (checklist com dono e prazo)

Regra: nada de aquisição (clipe com link, pitch, nano, Show HN) antes dos itens 1–4 e 8 fechados. O resto pode correr em paralelo.

| # | Item | O que "pronto" significa | Dono | Prazo | Base |
|---|---|---|---|---|---|
| 1 | **Produção pública na Play** | Status do teste fechado **[a confirmar]**: contas pessoais precisam de 12 testadores opt-in por 14 dias corridos; Google responde em ~7 dias após "Apply for production". Se os 14 dias já fecharam → aplicar na S1. Se não → Artur recruta 14–16 (folga) e o relógio corre; enquanto isso, **pré-registro** (máx. 90 dias/país, push + auto-instalação) é melhor do que "Em breve". | André (console) · Artur (testadores) | Aplicar S1 · no ar S2 | PUB B2 · GTM 2.9, 5.3 |
| 2 | **Ficha nova (pt-BR + en-US)** | Título `Perceva: hábitos e identidade` [29/30]. Sai: Momentum (8 menções na loja), "Jornadas", "Comece no Nível 1", keyword `rpg`, "quatro inventários". Entra: instrumentos nomeados (Big Five 120, Valores de Schwartz, Apego ECR-R, Forças; DISC e Tipos como "pra começar"), Recanto ("ideias pra ler, ouvir ou ver"), check-in de humor, "três lembretes opcionais", "pular também é decidir", Conector "(hoje, Claude)". Premium: "em breve" até o item 7. | Claude (rascunho) → André (aprova e cola) | S1 | ESP §7 · FP §1 (itens 1, 3, 9, 16, 28) |
| 3 | **8 screenshots pt-BR + feature graphic** | PNG sem alpha 1080×2400, **build da Play, não Expo Go**, tema escuro, conta populada (60+ dias em ~15 práticas, humor em ≥ 30 dias, 3+ instrumentos com Big Five, ≥ 8 ideias absorvidas, resgates espaçados, Norte traçado, nome real). Ordem e legenda: (1) Eu › Praticada com o contorno — "Quem os seus hábitos estão treinando você a ser"; (2) Hoje — "Práticas em um toque. Pular também é decidir."; (3) /perfil — "Big Five, Valores de Schwartz, Apego ECR-R: testes com nome"; (4) Resultado do Big Five — "O resultado não para na tela: vira prática"; (5) Calendário › Humor com filtro e espiada — "O filtro escolhe os dias; a frente, o que ver deles"; (6) Recanto — "Ideias com fonte. O Explorar acaba em cinco."; (7) Uma ideia com o card virado — "Vira o card e a ideia é sua"; (8) Recompensas + "Sem resgatar" — "Você define a recompensa e o preço. E o app responde há quantos dias." Feature graphic 1024×500 (24-bit, sem alpha): Iris + "Perceba quem você está se tornando." Conjunto en-US com as mesmas telas, mesma conta. | André (captura) · Artur (popula conta paralela se precisar) · Claude (legendas, molduras, export) | S1–S2 | FP §3 · PUB B4 · `02-assets-spec.md` |
| 4 | **Site v5** | Botão Android → ficha real (teste aberto/pré-registro/produção, o que existir); botão iPhone → "avise-me quando sair no iPhone" com captura de e-mail (finalidade explícita, LGPD) — **sem data**. Remover Momentum (4 menções por idioma + JSON-LD), missões do núcleo, "lado a lado" → "sobrepostos no mesmo hexágono", "Leituras curtas" → Recanto, "testes psicológicos de verdade" → "testes de personalidade, valores e vínculo". Grade de 4 → 6 figuras (+ Meça = calendário, + Converse = Conector). Regenerar `og.png` se embutir captura antiga. | Claude (código + copy) · André (deploy, aprova) | Botão S1 · v5 completa S2 | FP §1, §3 · ESP §7 · GTM 5.2 |
| 5 | **Formulário de featuring do Google** | Enviar **na primeira semana de produção**: app novo pede 8 semanas de antecedência e precisa lançar em até 4 meses da data de destaque; nota ≥ 3,0; pede plano de marketing, modelo de monetização e métricas de retenção/ARPDAU (usar este documento + planilha da §5). "Atender aos requisitos não garante promoção." | Claude (texto) · André (submete) | S1 de produção (S2 no máximo) | GTM 2.9 |
| 6 | **Registro do Conector** | MCP Registry oficial (namespace `app.perceva` verificado por DNS/HTTP, `mcp-publisher`; sem fila humana) · Smithery (`smithery mcp publish <url>`) · Glama (reivindicar a entrada = "dono verificado") · PulseMCP · mcp.so · PR no `punkpeye/awesome-mcp-servers`. Diretório de conectores do Claude: submissão comunitária aparentemente exige organização Team/Enterprise **[a confirmar na documentação da Anthropic]** — não contar com ele. Descrição em todos: "hands your own habit, mood and reward log to your AI assistant (today, Claude); reads 12 tools, writes only today's mood". | Claude (manifests, PRs) · André (TXT no DNS, contas) | S1–S2 | GTM 2.7 |
| 7 | **Compra de teste no RevenueCat — ou "em breve"** | `PURCHASES_ENABLED = true` desde 28/08 e webhook gravando `subscription_tier`, mas **não verificável pelo repo**: assinatura aprovada no Play Console, offering no RevenueCat, compra de teste feita num binário ≥ 1.3.0 **[a confirmar]**. Até a compra real: site, loja e vídeos dizem "Premium em breve"; nunca "assine"/"compre agora". Quando confirmar: preço + "assine dentro do app". | André | Até o dia 30 (S4) | FP §1 item 20 · ESP §7 |
| 8 | **Google Sign-In confirmado no app da Play** | Ligado no código e nos envs (#298/#301/#303), mas consent screen publicado e SHA-1 da build da Play **[a confirmar]**. Teste: abrir o app **da Play** num Android, ver "Continuar com Google", logar, sair, logar de novo. É o botão principal em qualquer pico (o OTP por e-mail é o primeiro gargalo). Higiene, não manchete: "Entre com Google ou com e-mail e código." | Artur (testa) · André (Cloud Console) | S1 | FP §1 item 18 · ESC 5.1 |
| 9 | **Política de privacidade + disclaimer** | `perceva.app/privacy` existe (site tem `privacy.html`, `terms.html`, `delete-account.html`, `support.html`). Falta: parágrafo do Conector ("se você conectar ao seu assistente de IA, os dados vão só pra ele, só quando você pergunta, e você desconecta quando quiser") — hoje zero menções a Claude/conector na página. Disclaimer na tela do Conector e no site: "reflexão, não diagnóstico", "IA, não substitui profissional", CVV 188 **[a confirmar se já existe no app]**. | Claude (texto) · André (aprova) | S2 | FP §1 item 25 · ESP §12.7 |
| 10 | **Auditoria de fidelidade zerada no app** (OTA, canal `production`) | Onboarding slide 3 "quests" → "Escolha 3 práticas pra começar"; paywall sem "Estudos exclusivos" e sem linhas de módulos desligados; login "Perceba o caminho…" → "Perceba quem você está se tornando."; "Riqueza"/"Criação" → Prosperidade/Ofício (2 chaves + 1 migration). | Claude | S2 | FP §1 itens 7, 8, 15 · ESP §7, §12.9 |
| 11 | **Conta Apple aberta** | Apple Developer Program (US$ 99/ano, individual, 2FA); Bundle ID; app no App Store Connect. **Sem prometer data em nenhuma superfície.** Atenção: com Google Sign-In ligado, Sign in with Apple passa a ser obrigatório (Guideline 4.8 — o runbook dizia "não obrigatório" porque não havia login social) **[a confirmar no runbook]**. | André | Até S9 | PUB A1, cabeçalho · ESP §8 fase 2 |
| 12 | **Kit pré-campanha (mínimo)** | Antes do Show HN (S3): Supabase Pro + Spend Cap OFF + limites de Auth por IP elevados (`rate_limit_verify`/`otp` 30 → subir; `token_refresh` 150) + Google como botão principal. Antes de qualquer impulsionamento (S9): compute Small (US$ 15), provedor de e-mail transacional + limite acima de 100/h (exige DNS — **não dá pra fazer durante o pico**), EAS Update fora do Free (~US$ 99/mês **[a confirmar em expo.dev/pricing]**), mídia no R2 **[status a confirmar]**, teste de carga k6 (30 min, 5 consultas quentes). ~US$ 160/mês parado. | André (billing) · Claude (Management API, k6) | Mínimo S2 · completo S8 | ESC §5 |
| 13 | **Links, UTMs e planilha** | `perceva.app/go/<canal>` via `_redirects` → link da Play com `referrer`; planilha com as abas da §5; consulta SQL do north-star pronta. | Claude | S1 | §5 deste doc |
| 14 | **Biblioteca de alegações + lista negra impressa** | `base-cientifica.md` como única fonte de número em vídeo; lista negra da ESP §7 colada no roteiro-modelo. Cada peça passa por ela antes de subir. | Claude | S1 | ESP §7, §9 |

---

## 2. Semana a semana (S1–S13)

Cadência-alvo a partir da S3 (ESP §9): **3 reels** (um "A sensação mente", um "Do teste à prática", um "Bastidor honesto") + **2 carrosséis "Uma ideia com fonte"** (reaproveitam as 107 ideias do Recanto: o pipeline já entrega imagem 4:5, título-gancho, afirmação e fontes) + stories diários de tela + **1 post no X/LinkedIn** com números reais. Cada reel sai primeiro como trial reel com 3 ganchos testados. Ritual fixo: **20 min toda segunda** — analytics + Creator Search Insights + escolher os 3 ganchos da semana + preencher a linha da planilha.

| Sem. | Datas | Tema | Ações concretas (quantidade) | Canal | Entregável | Métrica-alvo | Horas |
|---|---|---|---|---|---|---|---|
| **S1** | 14–20/09 | **Porta aberta** | (1) Status do teste fechado; aplicar para produção ou recrutar 14–16 testadores. (2) Ficha nova pt/en colada. (3) 8 screenshots + feature graphic capturados. (4) Botão Android do site → ficha real; iPhone → "avise-me". (5) Google Sign-In testado no app da Play. (6) Links `/go/*`, planilha, SQL do north-star. (7) TXT do DNS para `app.perceva`. (8) Gravar **3 clipes-piloto** (não publicar): testar setup de rosto pequeno + tela grande + legenda queimada. | Play Console · site · aparelho | Ficha submetida; site com botão real; planilha viva | Listagem enviada; baseline de conversão de ficha do teste fechado **[a confirmar]** | 15 |
| **S2** | 21–27/09 | **Fidelidade zero** | (1) Site v5 completo (6 figuras, privacidade com Conector, disclaimer). (2) OTA com a auditoria zerada (item 10). (3) **Formulário de featuring do Google** enviado (se produção no ar). (4) Conector em 5 diretórios + PR no awesome-mcp-servers. (5) Vídeo de 15–30 s com tela real (para social e imprensa; **não** para a ficha). (6) Reddit: contas aquecidas, ler regras dos subs, **5 comentários genuínos** sem link (r/getdisciplined, r/ClaudeAI, r/brasil). (7) Kit mínimo (Pro, Spend Cap OFF, limites de Auth). (8) Decidir artefato do Show HN: **código aberto do servidor MCP** (recomendado; passar por `/security-review`) ou conta demo só-leitura. (9) Publicar **2 clipes** (trial) + **1 carrossel**. | Site · OTA · diretórios MCP · Reddit · Reels/TikTok | Listagem pública no ar; auditoria FP §1 zerada; repositório do MCP pronto | Conversão de ficha ≥ 12% (primeira leitura); zero infidelidade em site/loja | 15 |
| **S3** | 28/09–04/10 | **Show HN do Conector** | (1) Postar "Show HN: an MCP server that hands your own habit, mood and reward log to Claude — with voice mood logging" apontando para o repositório; dia útil, início da manhã no horário da costa leste dos EUA **[prática, não verificada no dossiê]**. (2) Responder **100% dos comentários** nas primeiras 24 h. (3) Thread no X com o vídeo de 60 s "how was my week?" com dados reais do fundador. (4) Pitches escritos (Manual do Usuário, Canaltech, TechTudo, Hipsters) — enviar S4. (5) **3 clipes + 2 carrosséis** + stories + 1 post X/LinkedIn. | Hacker News · X · Reels/TikTok | Show HN no ar; 4 pitches prontos | ≥ 23 pontos (mediana de "Show HN … MCP server", GTM 2.6); conexões do Conector contadas; D1 primeira leitura ≥ 25% | 15 |
| **S4** | 05–11/10 | **Compra ligada + imprensa** | (1) **Compra de teste real** no RevenueCat → site e loja trocam "em breve" por preço; se não, segue "em breve" e o CTA de campanha continua "baixe grátis". (2) Enviar 4 pitches (§3.4). (3) Reddit: 5 comentários. (4) **3 clipes + 2 carrosséis** + post com números reais (downloads, D1, pontos do HN). | E-mail · Reels/TikTok · Reddit | Trial→pago passa a ser medido; 4 pitches enviados | D7 primeira leitura ≥ 11%; conversão de ficha ≥ 12% | 13 |
| **S5** | 12–18/10 | **Nanos, leva 1** | (1) Brief de 1 página (o que é, o que nunca dizer, #publi, premium vitalício). (2) Lista de 30 nanos (≤ 10 mil) em psicologia/hábitos/produtividade consciente em pt-BR; **15 DMs**; alvo **10 aceites**. (3) Primeiro post **com link** no Reddit (r/getdisciplined ou r/brasil, se as regras permitirem, após 3 semanas de participação). (4) **3 clipes** (3 ganchos testados cada) **+ 2 carrosséis**. | Instagram/TikTok DMs · Reddit · Reels | 10 nanos confirmados com link próprio (`/go/nano-<nome>`) | Instalações por nano; ≥ 1 clipe com conclusão > 40% **[meta interna]** | 14 |
| **S6** | 19–25/10 | **Primeiro corte de dados** | (1) Ler D7 por coorte e por canal; primeira leitura de D30 (coorte S2 fecha em 27/10 — completar na S7). (2) Pitch Naruhodo! (a ciência — Stieger 2021, Big Five, valores, apego — nunca o app). (3) Follow-up dos 4 pitches. (4) **3 clipes + 2 carrosséis**; o "Bastidor honesto" desta semana = números dos primeiros 30 dias. | Banco · e-mail · Reels | Relatório de 1 página (funil por canal) | D7 ≥ 11%; conversão ≥ 12% | 12 |
| **S7** | 26/10–01/11 | **Experimento de listagem** | (1) A/B de screenshots na Play (variante A: Praticada primeiro; B: Hoje primeiro; ou legenda "teste" vs "hábito"); rodar ≥ 7 dias. (2) Nanos da leva 1 publicam; recolher links. (3) D30 da coorte S2. (4) **3 clipes + 2 carrosséis**. | Play Console · Reels | Experimento rodando; D30 lido | D30 ≥ 8% (coorte S2); instalações por nano ≥ 10 cada **[meta interna]** | 12 |
| **S8** | 02–08/11 | **Gate da fase 2** | (1) Checar o gate: **conversão de ficha ≥ 12% E D7 ≥ 11%**? Sim → montar teste pago (4–6 criativos = os clipes com melhor conclusão). Não → **parar aquisição** (pausar nanos e qualquer gasto), manter conteúdo, consertar onboarding (§5 gatilhos). (2) Nanos, leva 2 (10 mais). (3) Aplicar vencedor do experimento. (4) **3 clipes + 2 carrosséis**. | Banco · Play Console · Reels | Decisão documentada na planilha | 1.500 downloads acumulados (piso do realista) | 13 |
| **S9** | 09–15/11 | **Pagar para aprender (se gate)** | (1) Campanha TikTok/Meta, Android/BR, objetivo instalação, R$ 1.500 (ou R$ 3–5 mil se houver), 4–6 criativos, um link por criativo. (2) **Kit pré-campanha completo** (item 12). (3) Abrir conta Apple (sem anúncio público). (4) **3 clipes + 2 carrosséis**. | Ads · Supabase · Apple | Campanha no ar; kit fechado | CPI ≤ R$ 11 (US$ 2,00, teto BR Android, GTM 3.1); conversão de ficha do pago ≥ a do orgânico | 15 |
| **S10** | 16–22/11 | **Criativo externo** | (1) UGC (Noovid/Bloomer): brief de 5 vídeos com variações de gancho **[preço a confirmar; sem tabela BR no dossiê]**. (2) Abordar 3 criadores micro (10–100 mil) de psicologia baseada em evidências — permuta primeiro; pago só com direitos de uso de 6–12 meses. (3) Cortar criativos abaixo da conversão orgânica. (4) **3 clipes + 2 carrosséis**. Primeira contagem do north-star (coorte S2 completa 8 semanas em 16/11). | UGC · DMs · Ads · banco | 5 UGCs entregues; north-star contado | CPI por criativo; north-star ≥ 10 pessoas **[meta interna]** | 13 |
| **S11** | 23–29/11 | **Segundo experimento** | (1) Só com o primeiro concluído: testar **vídeo de prévia vs sem vídeo** na ficha (a Apple publicou caso em que sem vídeo venceu +3%, GTM 2.8). (2) Segunda leva de imprensa (Olhar Digital, StartSe). (3) Nada de "promoção de Black Friday" — o preço é o preço. (4) **3 clipes + 2 carrosséis**. | Play Console · e-mail · Reels | Experimento 2 rodando | D30 da coorte S7; trial→pago vs 37,7% | 12 |
| **S12** | 30/11–06/12 | **TestFlight e nomeação Apple preparada** | (1) Se a conta Apple estiver ativa: build iOS via EAS, TestFlight interno (Artur). (2) Escrever a nomeação de featuring da Apple (história do desenvolvedor: irmão como testador, sem punição, dados do usuário como fronteira; acessibilidade; localização) — 3 semanas de antecedência quando houver data. (3) **3 clipes EN em estoque** (não publicar em paid). (4) **3 clipes + 2 carrosséis** pt. | EAS · App Store Connect · Reels | Build no TestFlight **[se conta ativa]**; texto da nomeação | North-star (coortes S2–S4) | 13 |
| **S13** | 07–13/12 | **Retro dos 90 dias** | (1) Relatório: funil por canal, cenário atingido (§7), north-star, CPI, trial→pago. (2) Decisão do próximo trimestre: escalar o canal que converteu / instrumento sério grátis na web (ESP §12.8) / iOS. (3) Post build-in-public com os 90 dias. (4) **3 clipes + 2 carrosséis**. | Banco · X/LinkedIn · Reels | Relatório + decisão | Cenário declarado; north-star ≥ 25 (conservador) / ≥ 100 (realista) **[metas internas]** | 10 |

Totais: ~36 clipes, ~24 carrosséis, 1 Show HN, 4+2 pitches, 20 nanos, 2 experimentos de listagem, 1 teste pago (condicional); **~172 h** (média 13 h/semana, dentro das 10–15 h da premissa).

**Mínimo viável se a semana desabar (< 8 h):** 2 clipes + 1 carrossel + ritual de segunda. Nunca pular o ritual: é ele que dispara os gatilhos da §5.

---

## 3. Canais em ordem de prioridade

| # | Canal | Por quê (uma linha) | h/sem | Regras |
|---|---|---|---|---|
| 1 | **Ficha da Play / ASO (pt-BR)** | ~65% dos downloads acontecem logo depois de uma busca (Apple Ads, GTM 2.8); conversão média do Play nos EUA 16,15% (AppTweak). | 10 h uma vez · 2 h/sem | "Hábitos" fica no título para ser achado; `rpg`, "Nível 1", Momentum, "Jornadas" saem; ordem "teste primeiro, hábito depois" nos screenshots (PD §5.7); vídeo só depois de experimento; ASO leva 4–8 semanas para mexer (GTM 2.8, fraca). |
| 2 | **Vídeo curto founder-led pt-BR** (Reels, TikTok, Shorts) | Loteria barata: quase tudo dá zero, um clipe > 300 mil views rende +1–3 mil instalações em 48 h (GTM 2.1, 4.3); Puff Count ~300 mil downloads só com orgânico (fraca). | 6–8 | 4 séries da ESP §9; gancho no quadro 1 e na primeira frase; rosto pequeno + tela grande; legenda queimada em Manrope; trial reel primeiro; 3–5 hashtags estáveis; números só de `base-cientifica.md`; dados de tela só do fundador/testadores com consentimento; nunca depoimento sintético; #publi visível em parceria; PT e EN gravados separados, nunca legenda traduzida. |
| 3 | **Show HN + diretórios MCP** | Mediana de 23 pontos para "Show HN … MCP server" contra ~5 para "habit tracker"; custo quase zero; gera prova social em inglês que alimenta a Marina (GTM 2.6, 2.7; ESP §4.2). | 6 h uma vez · 2 h de resposta | **Só com algo experimentável**: código aberto do servidor MCP ou conta demo só-leitura com dados fictícios; landing page e página de cadastro são off-topic por regra; postar pronto para teste; não pedir upvote; responder tudo; diretórios rendem ~zero download — o valor é credibilidade e ser achável em "autoconhecimento + IA". |
| 4 | **Imprensa BR** | Cíngulo chegou a milhões com prêmio de loja, tutorial no TechTudo e boca a boca, não mídia paga (GTM 1.1). | 3 h (S3–S4) · 1 h depois | Um ângulo por veículo (tabela 3.4); nunca "coach", "terapia", "saúde mental"; sempre "hoje, Claude"; material: vídeo de 30 s, 3 capturas, ficha no ar. |
| 5 | **Nano-influenciadores em permuta** | Única faixa que cabe no orçamento: nano cobra R$ 300–2.000 por Reels (Estado de Minas, jun/2026); em permuta (premium vitalício) custa zero (GTM 2.3). | 3 (S5–S8) | Brief de 1 página; sem roteiro imposto; #publi; perfis de psicologia/hábitos/produtividade consciente (não skincare, não pet); link próprio por nano; micro pago só depois de saber a conversão de ficha. |
| 6 | **Reddit** | Anedótico: "thread com 50 upvotes no sub certo traz 20–30 cadastros" e "3–8× mais que Product Hunt" (GTM 2.4, fraca). | 1–2 | **90/10**; 2–4 semanas de participação antes de qualquer link; **nunca link em 5 subs no mesmo dia** (banimento); **r/productivity proíbe qualquer autopromoção, inclusive por DM — não postar**; r/SideProject aceita, mas remove "landing-page drop"; r/getdisciplined, r/selfimprovement, r/habits, r/DecidingToBeBetter, r/androidapps, r/brasil, r/ClaudeAI: **regras a ler antes [a confirmar]**. |
| 7 | **X / LinkedIn (build in public)** | Dezenas por dia, não milhares; é credibilidade e material para imprensa (GTM 1.1, Sainz). | 1 | 1 post/semana com números reais (downloads, D7, pontos do HN, horas); sem projeções. |
| 8 | **Mídia paga** (fase 2, só com gate) | CPI BR Android US$ 0,50–2,00; a conta **não fecha** com 1,5% de conversão — pagar é para aprender criativo (GTM 3.2). | 2 quando ativa | Só se conversão ≥ 12% **e** D7 ≥ 11%; objetivo único (instalação); 4–6 criativos vencedores do orgânico; um link por criativo; cortar o que fica abaixo da conversão orgânica; nunca escalar no pico. |
| 9 | **Product Hunt** | Rodapé: Rosebud 55 e 76 upvotes, Opal 41 e 61; ~10% ganham featured; converte 1–3% (GTM 2.5). | 4 h uma vez, **depois do iOS** | Terça ou quarta, 00:01 Pacific; responder comentários na primeira hora; valor real = backlink DR 91. |
| — | **Fora**: gasto em EN antes do iOS; Social em qualquer peça; "Em breve" como CTA principal; PH como lançamento; atacar Habitica/16Personalities. | | | ESP §10 |

### 3.1 Reddit — regra operacional
Semanas S2–S4: 5 comentários genuínos/semana, zero link, em 3 subs (r/getdisciplined, r/ClaudeAI, r/brasil). S5: primeiro post com link em **um** sub; S7: r/ClaudeAI com o Conector (código aberto); S9: r/SideProject com o produto (não landing page). Nunca dois subs no mesmo dia. r/productivity: nunca.

### 3.2 Show HN — condições
Artefato: repositório público do servidor `perceva-mcp` (README com as 12 tools de leitura + 1 de escrita, a lista negativa do que o MCP não faz, instrução anti-sicofantia, licença) **ou** conta demo só-leitura. Vídeo de 60 s "how was my week?" com dados reais. Texto do post: o que é, por que só o humor é escrita, o que aprendeu construindo. Se < 10 pontos em 6 h: não repostar por 30 dias; mudar o artefato, não o título.

### 3.3 Product Hunt — rodapé
Só depois do iOS, como "também estamos aqui". Não desloca nenhuma hora das semanas S1–S13.

### 3.4 Imprensa BR — contatos e ângulos

| Veículo | Como entrar | Ângulo (um só) | Quando |
|---|---|---|---|
| **Manual do Usuário** (Rodrigo Ghedin) | ghedin@manualdousuario.net; publica às sextas | Privacidade verificável (nenhum SDK de anúncio ou analytics no app), "pular também é decidir, nada zera", dados do usuário como fronteira; "seu assistente de IA lê seus dados só quando você pergunta, e você desconecta quando quiser" | S4 |
| **Canaltech** | redacao@canaltech.com.br ou formulário "Sugestões de pautas"; 24 mi únicos/mês | App brasileiro de um desenvolvedor solo conecta hábitos e humor ao Claude via MCP | S4 |
| **TechTudo** | Matéria-tutorial ("como usar"); Cíngulo tem página de tópico desde 2019; contato **[a confirmar]** | "Como fazer o Big Five (120 itens) em português e transformar o resultado em prática" / "como conectar o app ao Claude" | S4 |
| **Hipsters Ponto Tech** (Alura) | Instagram @hipsterspontotech; entrevista fundadores toda semana | RN/Expo + Supabase + servidor MCP + pipeline de conteúdo com IA, fundador solo | S4 |
| **Naruhodo!** (B9) | Contato geral do B9; quadro "Naruhodo Entrevista" | A ciência, nunca o app: repetir comportamentos muda traços (Stieger 2021, PNAS), Big Five, valores de Schwartz, apego | S6 |
| **Olhar Digital** | E-mail de "Sugestão de pautas" na página Fale Conosco (ofuscado; copiar do site) | Segunda leva: o mesmo do Canaltech | S11 |
| **StartSe** | imprensa@startse.com | IA aplicada, fundador solo | S11 |
| **Tecnoblog** | Contato atrás de anti-bot **[a confirmar]** | — | Se sobrar tempo |
| **Autoconsciente** (B9) | Dormente desde fev/2022 | Não gastar tempo | — |

Regra de pitch: 5 linhas, um ângulo, link da ficha, vídeo de 30 s, 3 capturas, "disponível para entrevista". Sem "revolucionário", sem "baseado em ciência" solto.

---

## 4. Lançamentos-evento

### (a) Play pública (S1–S2)
**Exige:** produção aprovada (ou pré-registro enquanto os 14 dias correm); ficha nova pt/en; 8 screenshots + feature graphic; Privacy Policy URL e link web de deleção no ar; Data Safety coerente (coletado, não compartilhado, criptografado, deletável; Ads = No); Google Sign-In confirmado; site com botão real e iPhone "avise-me"; links `/go/*`; formulário de featuring enviado na primeira semana.
**Nunca prometer:** data de iOS; "assine"/"compre agora" antes da compra de teste; Momentum; Social; coach/mentor/"IA do Perceva"; "teste psicológico"; "vire outra pessoa em 30 dias". A tese pública é "registre em 10 segundos, olhe uma vez por semana, e veja quem está aparecendo" (ESP §2.5).

### (b) Conector no HN e nos diretórios (S2–S3)
**Exige:** artefato experimentável (código aberto do servidor ou demo só-leitura); README honesto (12 leituras + 1 escrita = humor do dia; lista negativa; anti-sicofantia); página de consentimento OAuth no ar (gh-pages); namespace `app.perceva` verificado; disclaimer "IA, não substitui profissional"; conta no HN com algum histórico; vídeo de 60 s com dados reais do fundador.
**Nunca prometer:** que funciona com ChatGPT (não funciona); que funciona no Claude mobile **[a confirmar no Android do dono]** — dizer "web e desktop"; que escreve além do humor; que "analisa", "orienta" ou "propõe" (alegação verificável é **contexto**: "ele lê seus dados reais em vez de adivinhar"); mentor, coach, terapeuta. Frase-padrão: **"conecte o Perceva ao seu assistente de IA (hoje, Claude)"**. Conectores personalizados existem no Free (1 conector), Pro, Max e Team (PD §0.6).

### (c) iOS depois (fora dos 90 dias; preparação S9–S12)
**Exige:** conta Apple ativa; Bundle ID; App Store Connect; Nutrition Labels (Email, User Content, User ID, Usage Data → Linked, **não** tracking); demo account + Review Notes; screenshots iPhone 6,9" (1260×2736) e — se `supportsTablet` continuar `true` — iPad 13" (recomendação do runbook: `false`); TestFlight; Sign in with Apple se o Google Sign-In estiver ligado (Guideline 4.8) **[a confirmar]**; nomeação de featuring com ≥ 3 semanas de antecedência e a história do desenvolvedor; e-mails da lista "avise-me" avisados **primeiro**.
**Nunca prometer:** data, mês ou trimestre; "em breve" dentro do app (Guideline 2.1 derruba builds com "coming soon"); featuring; Product Hunt como evento.

---

## 5. Medição

### 5.1 North-star
**Pessoas com ≥ 1 registro por semana durante 8 semanas consecutivas.** Retenção é a tese: a categoria retém 3,3% em 30 dias (Baumel 2019, PD §0.2). Definição operacional proposta: "registro" = prática concluída, pulo, check-in de humor ou ideia absorvida (`task_completion`, `task_skip`, `mood_log`, `learning_idea_collect`), agrupado por semana ISO; Claude roda a consulta (só leitura) toda segunda. Primeira contagem possível: S10 (coorte S2). Metas internas (sem benchmark externo): S13 ≥ 25 no conservador, ≥ 100 no realista.

### 5.2 Funil, fonte e alvo

| Etapa | Como medir | Alvo | Base |
|---|---|---|---|
| Visualização | Views de clipe/carrossel (analytics TikTok/IG/YT); impressões da ficha (Play Console) | Conclusão > 40% no clipe **[interna]** | ESP §9 |
| Perfil | Visitantes da ficha (Play Console) | — | — |
| Clique | Cliques em `perceva.app/go/<canal>` | — | — |
| Instalação | Play Console, por `utm_source`/`utm_campaign` do `referrer` **[nome do relatório a confirmar no console atual]** | **Conversão de ficha ≥ 12–16%** | ESP §8; GTM 2.8 |
| Cadastro | `auth.users` (Supabase) | Sem benchmark no dossiê; fixar meta interna após 2 semanas | — |
| 1ª prática | Primeiro `task_completion` (ou humor) por conta | Idem | — |
| D1 | Ativo (qualquer registro) no dia 1 | **25–32%** | GTM 3.1 (Admiral) |
| D7 | Ativo no dia 7 (janela ±2 dias enquanto n < 100) | **11–16%** | idem |
| D30 | Ativo no dia 30 (janela ±3) | **≥ 8%** (o dobro da categoria) | ESP §8; GTM 3.1 (5–9%) |
| Trial→pago | RevenueCat | vs **37,7%** (mediana H&F) | RevenueCat 2026 |
| Instalação→pagante D35 | RevenueCat ÷ instalações | vs **1,5%** (mediana LATAM) | RevenueCat 2026 |
| Conector | Sessões OAuth ativas (banco) | Contar, sem meta | — |

### 5.3 UTMs e links por canal
Padrão: `https://play.google.com/store/apps/details?id=perceva.app&referrer=utm_source%3D<fonte>%26utm_medium%3D<meio>%26utm_campaign%3D<serie-semana>`. O app não tem SDK de referrer — a leitura é no Play Console. Para não expor UTM em bio, cada canal ganha um atalho no site via `_redirects`:

| Atalho | Fonte / meio / campanha | Onde vive |
|---|---|---|
| `/go/tt` | tiktok / bio / `<serie>-s<N>` | Bio do TikTok |
| `/go/ig` | instagram / bio / idem | Bio do Instagram |
| `/go/yt` | youtube / shorts / idem | Descrição dos Shorts |
| `/go/hn` | hackernews / post / conector | README + post |
| `/go/mcp` | mcp-directories / listing / conector | Registry, Smithery, Glama, PulseMCP |
| `/go/rd-<sub>` | reddit / post / `<sub>` | Um por sub |
| `/go/press-<veiculo>` | press / article / `<veiculo>` | Um por matéria |
| `/go/nano-<nome>` | creator / permuta / `<nome>` | Um por nano |
| `/go/ads-<criativo>` | tiktok-ads ou meta-ads / paid / `<criativo>` | Um por criativo |
| `/go/site` | site / hero / v5 | Botão do site |

Contagem de cliques: analytics do Cloudflare no Worker do site **[disponibilidade a confirmar]**; fallback = só a leitura do Play Console por campanha.

### 5.4 Ferramentas (todas gratuitas)
Play Console (aquisição por fonte, conversão de ficha, retenção, experimentos de listagem, avaliações, pré-registro) · links de loja com `referrer` + atalhos do site · Supabase SQL só leitura (cadastro, 1ª prática, D1/D7/D30, north-star, sessões do Conector) · RevenueCat (trial→pago) · analytics nativos de TikTok/Instagram/YouTube + Creator Search Insights · API do HN (Algolia) para pontos · formulário "avise-me" do iPhone (contagem) · **uma planilha** (Google Sheets).

### 5.5 A planilha semanal — coluna a coluna
Aba **Semanas** (uma linha por semana, preenchida no ritual de segunda):

| Col. | Campo | Fonte |
|---|---|---|
| A | Semana (S1…S13) e datas | — |
| B | Tema da semana | §2 |
| C | Peças publicadas (clipes / carrosséis / posts / stories) | Contagem |
| D | Views totais da semana | Analytics |
| E | Conclusão média (%) | Analytics |
| F | Envios ÷ alcance | Analytics |
| G | Cliques por atalho (`/go/*`) | Cloudflare / — |
| H | Visitantes da ficha | Play Console |
| I | Instalações (total e por fonte) | Play Console |
| J | Conversão de ficha (I ÷ H, %) | Cálculo |
| K | Cadastros | Supabase |
| L | 1ª prática (% de K) | Supabase |
| M | D1 (%) da coorte da semana anterior | Supabase |
| N | D7 (%) da coorte de 1 semana atrás | Supabase |
| O | D30 (%) da coorte de 4–5 semanas atrás | Supabase |
| P | North-star (pessoas com 8 semanas seguidas) | Supabase |
| Q | Conexões do Conector ativas | Supabase |
| R | Trials iniciados | RevenueCat |
| S | Pagantes / trial→pago (%) | RevenueCat |
| T | Gasto (R$) | Extratos |
| U | CPI (T ÷ instalações pagas) | Cálculo |
| V | Horas do fundador | Registro |
| W | Melhor gancho da semana (texto) | Analytics |
| X | Gatilho disparado / decisão tomada | §5.6 |

Aba **Peças** (uma linha por peça): data · série · gancho (texto do quadro 1) · canal · views 48 h · conclusão · envios · cliques no atalho · instalações atribuídas · nota livre. Aba **Contatos** (imprensa e nanos): nome · canal · data do contato · status · link `/go/*` · resultado.

### 5.6 Gatilhos de decisão (executados no ritual de segunda)

| Se… | Então… |
|---|---|
| **D7 < 11%** por 2 semanas seguidas (n ≥ 100 instalações) | **Parar aquisição** (pausar nanos, ads, pitches); manter conteúdo; consertar onboarding: valor antes do cadastro, "3 práticas pra começar", humor no primeiro dia, lembretes com dado concreto (PD §5.3; ESP §12.6). |
| **Conversão de ficha < 12%** após 2 semanas | Trocar screenshots (ordem e legendas), depois descrição curta, por último título — via experimento de listagem, um fator por vez (GTM 2.8: +28% só reordenando, moderada). |
| Conversão ≥ 12% **e** D7 ≥ 11% (S8) | Abrir a fase 2: teste pago, kit pré-campanha completo. |
| **D30 < 5%** | Congelar tudo que não é retenção; revisar Daily Brief/Checkpoint; reconhecimento de retorno (ESP §12.3). |
| CPI > R$ 11 num criativo após R$ 300 gastos | Cortar o criativo. Em todos os criativos → parar a campanha; o problema é a mensagem, não o lance. |
| Show HN < 10 pontos em 6 h | Não repostar por 30 dias; mudar o artefato (abrir código / demo), não o título. |
| Clipe > 100 mil views em 48 h | Em 24 h: 2 variações do mesmo gancho; comentário fixado com o atalho; stories com a tela. |
| Clipe > 300 mil views | Conferir limites de Auth e OTP **hoje**; esperar +1–3 mil instalações em 48 h; não anunciar nada novo (nem iOS). |
| Trial→pago < 20% com n ≥ 30 trials | Revisar paywall (sem "Estudos exclusivos", sem linhas de módulos desligados, anual em destaque). |
| Pico > 3 mil instalações/dia | Kit pré-campanha: Auth por IP, compute, Spend Cap; responder avaliações em 24 h; queda de 70–90% depois é o padrão, não alarme. |
| Nota na Play < 4,0 | Responder todas as avaliações; hotfix por OTA (canal `production`); 95% dos apps destacados têm ≥ 4,0 (GTM 2.9). |
| Fundador < 8 h/semana por 2 semanas | Mínimo viável (2 clipes + 1 carrossel + ritual); carrosséis vêm prontos do pipeline do Recanto. |

---

## 6. Orçamento

Câmbio implícito no dossiê: US$ 1 ≈ R$ 5,4 (GTM 3.2 converte US$ 0,50–2,00 em R$ 2,70–11).

### 6.1 Cenário R$ 0 (marketing)
Tudo orgânico: ASO, clipes, Show HN, diretórios, imprensa, nanos em permuta, Reddit, build in public. Infra não é marketing, mas o mínimo do kit (Supabase Pro US$ 25/mês ≈ R$ 135 + Spend Cap OFF + limites de Auth) entra antes do Show HN — o resto do kit só quando um gatilho de pico disparar (e o provedor de e-mail transacional precisa de DNS, portanto **antes**, não durante). O que se perde sem dinheiro: variações de gancho produzidas por terceiros e volume para medir CPI. O que não se perde: nada que decide os 90 dias — retenção e conversão de ficha se medem com orgânico.

### 6.2 Cenário R$ 1.500/mês (R$ 4.500 em 90 dias)

| Mês | Onde | Quanto | Para quê |
|---|---|---|---|
| 1 (S1–S4) | Agendador de posts (para publicar nos 3 canais de uma vez) **[preço a confirmar]** · Supabase Pro | ~R$ 250 | Tempo do fundador; kit mínimo |
| 1 (S1–S4) | Reserva | ~R$ 1.250 | Vai para o mês 3 se o gate abrir |
| 2 (S5–S8) | **UGC** (Noovid/Bloomer): 5 vídeos com variações de gancho, sem distribuição no perfil do criador **[preço a confirmar — sem tabela BR no dossiê; referência: nano cobra R$ 300–2.000 por Reels com distribuição, GTM 2.3]** · agendador | ~R$ 1.500 | Aprender qual gancho segura o quadro 1 sem depender do rosto do fundador |
| 3 (S9–S13) | **Impulsionar o melhor clipe** (Spark Ads / Meta), Android/BR, objetivo instalação, 4–6 criativos, **só se o gate da S8 abrir** · compute Small (US$ 15) · agendador | ~R$ 2.750 | Medir CPI próprio e conversão de ficha do tráfego pago |

Referências de custo (GTM 3.1): CPI Android LATAM US$ 0,50–2,00 (≈ R$ 2,70–11); TikTok Ads BR CPM R$ 8–25 e CPC R$ 0,80–2,50; Meta Reels CPM R$ 8–20 (ambos fracos); UGC nos EUA US$ 150–300/vídeo (mediana ~US$ 175; sem tabela BR). O total de R$ 4.500 cabe no "teste mínimo viável" de R$ 3–5 mil em 30 dias (Expert Digital, fraca) — desde que concentrado no mês 3, não diluído.

### 6.3 A conta CAC × LTV (por que pagar é para aprender)
- Preço anual R$ 99,90 ≈ **R$ 85 líquidos** depois da loja (GTM 3.2).
- Instalação→pagante: **1,5%** (mediana LATAM em D35, RevenueCat 2026) — o Perceva ainda não tem o próprio número.
- CAC por pagante = CPI ÷ 1,5% = R$ 2,70 ÷ 0,015 a R$ 11 ÷ 0,015 = **R$ 180 a R$ 730**.
- R$ 180–730 para receber R$ 85 no primeiro ano: **não paga**. Passa a fechar só com conversão ≥ 5–8% ou CPI ≤ R$ 1,30 (improvável fora de criativo excepcional).
- O que R$ 1.500 compram a CPI R$ 5 (meio da faixa): ~300 instalações → ~33 pessoas em D7 (11%) → ~4–5 pagantes (1,5%) → ~R$ 380 de receita no ano. **Compra-se informação** (qual gancho converte na ficha; D1/D7/D30 com volume), não crescimento.
- Escalar só com conversão própria medida **e** compra ligada (lição Opal, GTM 1.1): senão compram-se usuários sem saber quem paga.

---

## 7. Cenários de 90 dias (calibração, não promessa)

Força: **fraca** — triangulação do painel (GTM 4.3), não dado de apps comparáveis em pt-BR. Base de realidade: mediana de app de assinatura um ano depois do lançamento = US$ 72/mês; 57,7% nunca chegam a US$ 1.000 acumulados (RevenueCat 2026). **O conservador é o normal, não o fracasso.**

| Cenário | Downloads em 90 dias | Premissas explícitas | Sinais que confirmam | O que dispara mudar de rota |
|---|---|---|---|---|
| **Conservador** | **300–1.500** | ASO feito uma vez; 2 posts/semana; Show HN ~20 pontos; listagens MCP; 0–1 matéria pequena | 20–60 ativos/dia; 0–15 pagantes | **D7 < 11%** → o problema é retenção: parar aquisição, consertar onboarding, correções da ESP §12 antes de qualquer gasto. **D7 ≥ 11% com poucos downloads** → o problema é topo de funil: subir para 3–5 clipes, nanos, e priorizar o instrumento sério gratuito na web (ESP §12.8; "teste de personalidade" é a maior demanda orgânica adjacente do mundo, PD §0.4). |
| **Realista** | **1.500–6.000** | ASO iterado com 1 experimento; 3–5 clipes/semana; Show HN 30–80 pontos; featuring enviado na S1–S2 de produção; 2–3 matérias BR; 10–20 nanos; teste pago R$ 3–5 mil (ou R$ 4.500 concentrados) | Um clipe > 300–500 mil views rende +1–3 mil instalações em 48 h; conversão de ficha ≥ 12%; 30–100 pagantes | Gate da S8 aberto → fase 2 (pagar para aprender, collabs micro, iOS em preparação). Conversão ≥ 12% mas D30 < 5% → congelar aquisição e resolver o retorno na janela de 60–100 dias (PD §5.1). |
| **Otimista** | **10.000–30.000+** | Destaque do Google Play Brasil, **ou** clipe > 2 mi views, **ou** matéria grande + Show HN > 150 pontos | Picos de 3–8 mil/dia por 2–4 dias, depois queda de 70–90% (padrão de todo pico não sustentado); o que fica é o que a retenção segura | Kit pré-campanha completo **antes** (o e-mail transacional não se resolve no dia); **não escalar gasto no pico**; responder avaliações em 24 h; não anunciar nada novo (nem iOS, nem Social); medir a coorte do pico separada das outras — ela decide se o produto segura volume. |

---

## 8. Riscos operacionais e kit pré-campanha

| Risco | Sinal | Ação | Quem |
|---|---|---|---|
| **E-mail OTP a 100/h** (Zoho; teto diário próprio na casa das centenas) | Cadastros travando; erros de envio; > 80 cadastros/h | Google como botão principal já; provedor transacional (Resend / SES / ZeptoMail, ~US$ 20/mês) + subir limite via Management API (`PATCH /v1/projects/{ref}/config/auth`) — exige DNS: **antes** do pico | André (DNS, billing) · Claude (config) |
| **Limites de Auth por IP** (`verify` 30, `otp` 30, `token_refresh` 150 por 5 min; CGNAT das operadoras) | 429 em login vindo de rede móvel | Subir no painel/API (1 min); fazer na S2 | Claude |
| **Compute Micro** | Latência; CPU alta; orçamento de IO estourado | Small (US$ 15) ou Medium (US$ 60), ~2 min de reinício, antes da campanha | André |
| **Spend Cap ligado** | Serviço restrito ao estourar cota | Desligar antes de qualquer campanha | André |
| **EAS Update no Free** (MAU de OTA ~1.000 **[a confirmar]**) | Hotfix não chega aos usuários | Plano pago (~US$ 99/mês) antes da primeira publi | André |
| **Mídia no Storage do Supabase** | Egress subindo com volume | R2 com domínio próprio **[status a confirmar]** | Claude |
| **RevenueCat acima de US$ 2,5 mil/mês rastreados** | Cobrança de ~1% | Aceitar; é sinal bom | André |
| **Índice faltando** | Consulta quente lenta sob carga | Teste de carga k6 (30 min) nas 5 consultas mais quentes antes da S9 | Claude |
| **Nota < 4,0 por bug no pico** | Avaliações negativas em série | Responder em 24 h; OTA no canal `production` (nunca só `preview`); pedir avaliação só depois da primeira semana | André · Claude |
| **Promessa infiel escapa** (Momentum, Jornadas, coach, "teste psicológico", "compre agora") | Comentário ou jornalista aponta | Lista negra (ESP §7) em toda peça antes de subir; auditoria FP §1 zerada na S2 | Claude (revisão) · André |
| **Linguagem clínica** (ansiedade, terapia, saúde mental, diagnóstico) | Aparece num roteiro ou pitch | Glossário: "autoconhecimento com instrumento nomeado, nunca sintoma"; uso restrito a psicólogos (Res. CFP) | Claude · André |
| **Show HN sem artefato experimentável** | Post marcado como off-topic / morre | Só postar com código aberto ou demo só-leitura; landing page é off-topic por regra | André · Claude |
| **Banimento no Reddit** | Post removido; shadowban | 90/10; regras lidas por sub; nunca 5 subs no mesmo dia; r/productivity nunca | André |
| **Janela de featuring do Google perdida** | Formulário não enviado até a S2 de produção | Enviar na primeira semana; app novo precisa de 8 semanas e lançar em até 4 meses da data desejada | André |
| **Conector no Claude mobile** | Usuário diz que "não funciona no celular" | Testar no Android do dono; até lá dizer "web e desktop" | Artur (testa) · Claude (copy) |
| **Sicofantia do Conector em demo pública** | Assistente concorda com autoelogio/autoculpa sem olhar o registro | Instrução anti-sicofantia no servidor; demos só com dados reais do fundador | Claude |
| **Dados de terceiros em vídeo** (LGPD) | Tela de testador aparece num clipe | Só dados do fundador ou de testador com consentimento por escrito; Espelho, testes e humor são dados sensíveis (art. 5º II e 11) | André |
| **Lista "avise-me" do iPhone** | E-mails coletados sem finalidade clara | Finalidade explícita no formulário; um único e-mail quando houver build; nunca data | Claude |
| **Fundador sem tempo** | 2 semanas sem 3 clipes | Mínimo viável (2 clipes + 1 carrossel + ritual); carrosséis do pipeline do Recanto; nanos e imprensa esperam | André · Claude |
| **Pico sem retenção** | Queda de 70–90% em 2–4 dias | É o padrão; não escalar gasto; ativar reconhecimento de retorno (ESP §12.3); medir a coorte do pico separada | André |

**Kit pré-campanha, resumido (ESC §5; ~US$ 160/mês parado, tudo decidível antes, nada no dia):** Pro + compute Small + Spend Cap OFF + limites de Auth elevados · provedor de e-mail transacional + limite de envio subido · Google como botão principal · mídia no R2 com domínio próprio · plano pago do EAS · teste de carga. **Mínimo até a S2** (Pro, Spend Cap, limites, Google); **completo até a S8**, uma semana antes de qualquer impulsionamento.

---

*Deriva da ESP §8 (fases, north-star, metas) e §9 (sistema de conteúdo); números de canal, custo e cenário vêm do GTM (com a força de cada alegação lá registrada); público e retenção do PD; correções de produto e screenshots do FP; concorrência do MP §D; infra do ESC §5; loja do PUB. Onde este plano fixa uma meta que nenhum dossiê sustenta, está escrito "[meta interna]".*
