# Fidelidade produto × discurso — auditoria de 2026-09-12

Frente de leitura de repositório (sem web). Compara o que o site (`perceva.app`, pt + `/en/`), o rascunho de loja (`docs/publish/01-store-metadata.md`, 2026-08-18) e o onboarding/tour do app dizem, contra o que o código entrega hoje (`main` em 2026-09-12, app 1.4.0, MCP 0.4.1). Cada status abaixo aponta o arquivo ou commit que o sustenta. Onde o repositório não basta para afirmar (estado de console do Google, produtos no Play), está dito.

Legenda de status: **padrão** = existe e vem ligado para todo usuário · **módulo OFF** = existe, mas atrás de chave default OFF em Ajustes → Módulos · **premium** = existe, atrás do paywall · **dormente** = código/dados existem, efeito desligado no servidor · **forma diferente** = existe, mas não como o texto descreve · **não existe**.

Três correções ao próprio contexto do painel, achadas no caminho: (a) a barra inferior tem **5 abas** (Práticas · Recompensas · Eu · Aprender · Ajustes); "Histórico" é o botão-calendário flutuante da Home, não aba (`BottomNavBar.tsx`, `TasksFabStack.tsx`). (b) São **7 instrumentos**, não 5: DISC e Tipos existem e são grátis desde 2026-07-26 (#308). (c) **Google Sign-In está ligado no código e nos envs de build/OTA** desde 2026-07-25 (#298/#301/#303), não "pronto mas desligado". (d) O MCP tem **12 tools de leitura + 1 de escrita** (13), não 14 + 1.

---

## 1. Alegação → onde aparece → status real → correção

### A. Constância

| # | Alegação | Onde | Status real | Correção sugerida |
|---|---|---|---|---|
| 1 | "Momentum converte constância em bônus… decai devagar em vez de zerar" / "Momentum e Dedicação" no plano grátis | Site pt+en: pilar ii, card Constância, plano Gratuito, `featureList` do JSON-LD (4 menções por idioma). Loja: descrição PRATICADA, What's New, release notes, nos 4 conjuntos (App Store/Play × pt/en) | **Dormente** desde 2026-08-28 (migration `20260828000001`): `complete_task` paga XP = `base_xp_for_stars`, sem bônus. UI e API do cliente removidas; zero ocorrências em `pt.ts`/`en.ts`. Religar é nova migration, não copy. | Remover as ~16 menções. O card "Constância" do site vira **"Dia fechado"** (DaySeal, `home.daySeal`): "Fez o que o dia pedia — ou decidiu pular — e o dia fecha. Nada zera, nada cobra." O que substitui a promessa de bônus é a promessa de não-punição, que é verdadeira. |

### B. Módulos opcionais (todos default OFF — `app/lib/modules.ts`, `MODULE_REGISTRY`)

| # | Alegação | Onde | Status real | Correção sugerida |
|---|---|---|---|---|
| 2 | "Práticas e missões pontuam as áreas" · card Foco "Missões: metas com prazo e recompensa em bloco" · legenda "Hábitos e missões" · plano grátis "3 missões ativas" · `featureList` "Missões com prazo" | Site pt+en | **Módulo OFF** (`missoes`). Tour M3 auto-pula quando desligado. Só aparece depois de Ajustes → Módulos. | Tirar "missões" do núcleo. Uma linha, no fim da caixa de ferramentas: "Quer prazo e prêmio? Ligue Missões em Ajustes." Plano grátis passa a liderar com "10 práticas e 5 recompensas"; módulos têm limites próprios. |
| 3 | "Aceite Jornadas (quests) com prazo" · What's New "Jornadas com prazo" · "Treine — conclua hábitos e Jornadas" | Loja pt (App Store + Play) | **Módulo OFF + vocabulário inexistente.** O app chama de **Missões** (`quests.title`) e **Metas** (`goals.board.title`). "Jornada(s)" só aparece como substantivo comum no tour e no onboarding. | Substituir "Jornadas" por "Missões" e marcar como opcional — ou omitir da descrição longa e citar só em "módulos opcionais". Canonizar: Missões / Metas / Habilidades / Minha Semana. |
| 4 | "Habilidades com faixas de progressão, do iniciante ao mestre, marcos que não se perdem" | Site pt+en (pilar iii, card Prova, `featureList`); Loja (DESEJADA, What's New, release notes) | **Módulo OFF** (`skills`); limite free 3. Com a chave desligada, o app filtra até templates de Metas que dependem de skill. | Rebaixar a opcional. O que é **padrão** na Identidade Desejada é o **Norte** (`norte.*`: meta por área traçada sobre o contorno de hoje) — é isso que o pilar iii deve descrever. |
| 5 | Metas (board `/goals`) | Não aparece em site nem loja | **Módulo OFF** (`metas`) | Não promover como núcleo. Se citar, junto de Missões, como módulo. |
| 6 | Minha Semana (planner) | Não aparece em lugar nenhum | **Módulo OFF** (`semana`); zero XP por desenho | Opcional; candidata à lista §2, não ao discurso principal. |
| 7 | Onboarding slide 3: "Escolha algumas quests iniciais. A gente cuida da subida de nível." | App, pré-login (`onboarding.slide3`, pt e en) | **Infidelidade interna**: o passo seguinte do tour (M0.5) pede **3 práticas**, e quests estão OFF. | Trocar para "Escolha 3 práticas pra começar. A gente cuida do resto." Cai "quests" do vocabulário de entrada. |
| 8 | Paywall: comparativo lista "Habilidades 3" e "Missões 3 ativas" para todo usuário | App (`premium.compare`) | Aparece mesmo com os módulos OFF (módulo ⊥ premium por regra do código) | Esconder linhas de módulos desligados no comparativo, ou rotular "(módulo opcional)". Detalhe de produto, não de marketing — registrado por completude. |

### C. Instrumentos (catálogo `psych_instrument`, seeds em `supabase/migrations/20260507*`, `20260701*`)

| # | Alegação | Onde | Status real | Correção sugerida |
|---|---|---|---|---|
| 9 | "quatro inventários de autorreflexão: cinco grandes traços, valores, vínculo afetivo e bem-estar" | Loja (descrição, What's New, release notes, pt/en) | **Desatualizado.** São 7: **Avaliação** (bem-estar, 48 itens, grátis), **DISC** (44, grátis), **Tipos** (64, grátis), **Big Five 120** (premium), **Valores de Schwartz** (57, premium), **Apego ECR-R** (36, premium), **Forças** (72, premium). Gate: `PREMIUM_INSTRUMENT_IDS` + trigger `enforce_premium_instrument`. Vivem em `/perfil`. | "Avaliação de bem-estar nas seis áreas + seis instrumentos de autoconhecimento (Big Five, Valores de Schwartz, Apego ECR-R, Forças, DISC e Tipos)". Dizer quais são Premium. |
| 10 | "testes sérios de personalidade, valores e vínculo afetivo" · card Clareza "Big Five em 120 itens, valores, estilo de vínculo" · Premium "Instrumentos psicológicos completos" | Site pt+en | **Existem e são premium** (Big Five, Schwartz, ECR-R). Forças (premium) e DISC/Tipos (grátis) não citados. | Site pode seguir nomeando só Big Five / Schwartz / ECR-R — é o pilar "ciência nomeada". **Não subir DISC e Tipos ao discurso de "instrumento de verdade"**: são portas de entrada do funil (decisão de 2026-07-26), não têm o mesmo lastro. Registrar como decisão editorial. |
| 11 | "Autoavaliação completa nas seis áreas" (grátis) | Site (plano) | **Padrão**: sliders nos 12 subs + Avaliação de 48 itens, grátis. | OK. |
| 12 | "Os dois retratos ficam lado a lado na aba Eu" · `featureList` "Espelho: como você se vê lado a lado com o que você pratica" | Site pt+en | **Forma diferente.** Desde 2026-08-28 Eu = um painel por pilar. O espelho é o **contorno** da percepção sobreposto ao hexágono da Dedicação (`DedicacaoPanel.tsx`, "the mirror outline"); em Avaliação, self × questionário também se sobrepõem (`AvaliacaoPanel.tsx`); há ainda a tela Espelho (`/profile-mirror`). | "Sobrepostos no mesmo hexágono" em vez de "lado a lado". A captura do site tem de mostrar o contorno — é a imagem da frase matadora. |

### D. Aprendizado (Recanto)

| # | Alegação | Onde | Status real | Correção sugerida |
|---|---|---|---|---|
| 13 | "Leituras curtas" · "biblioteca de leituras curtas e visuais" · "Short reads" | Site (card Conhecimento, legenda Aprenda, pilar iii, `featureList`); Loja (APRENDA NO SEU RITMO, What's New) | **Subvende.** Hoje é o **Recanto**: 35 materiais, **107 ideias** (imagem 4:5 sem texto + 100–180 palavras + 1–3 fontes + **card que vira = absorver**), **deep dive em áudio em 12 materiais** (10 em PT+EN, 2 só EN — migrations `learning_audio_*`, `learning_notebook_media`), **vídeo ~1 min em 10 ideias**, Explorar em séries de 5 que **acabam** (`REEL_SET_SIZE = 5`), **Minhas ideias** = pilha de revisão por swipe, publicação 2×/semana. O próprio app diz "Pra ler, ouvir ou ver" (`learning.subtitle`, tour M6). | "Recanto: ideias pra ler, ouvir ou ver — nunca mais de cinco por material." Não prometer áudio/vídeo em tudo: "áudio e vídeo em parte do catálogo, crescendo toda semana". Vídeo é âncora da ideia, não a unidade (decisão de 2026-09-07). |
| 14 | "Conteúdo ligado ao que você está cultivando **agora**. A teoria chega **na hora** da prática." | Site pt+en | **Forma diferente.** No app a ligação é por dimensão/sub e filtro; a recomendação a partir dos dados só existe **via MCP** (`get_learning_ideas` cruzado com `get_day_plan`). | "Ligado às seis áreas da sua vida" (verdade) em vez de "chega na hora" (recomendação que o app não faz sozinho). |
| 15 | Paywall: "Estudos exclusivos — conteúdo extra no Aprender, toda semana" / comparativo "Estudos: Base / + exclusivos" | App (`premium.benefit.learn*`, `premium.compare.articles*`) | **Não existe.** `PREMIUM_LEARN_ENABLED = false`; `learning_material` não tem coluna premium. | Tirar do paywall até existir. É a única promessa falsa **dentro** do app hoje. |

### E. Notificações (`app/lib/notifications/`)

| # | Alegação | Onde | Status real | Correção sugerida |
|---|---|---|---|---|
| 16 | "Notificações locais opcionais: um resumo de manhã e um checkpoint no meio do dia. Você escolhe os horários" | Loja pt/en | **São três, e só duas têm horário do usuário**: Daily Brief (hora do usuário, default 08:00), Checkpoint **12:30 fixo** e só se o app não foi aberto, e **check-in noturno de humor** (hora do usuário, abre `/mood-checkin`). Cada uma tem toggle próprio. Módulo nativo presente nos binários desde 1.2.0. | "Três lembretes opcionais: resumo de manhã e check-in de humor à noite, nos horários que você escolher; e um toque ao meio-dia só se você não abriu o app. Cada um desliga separado." |
| 17 | Site não fala de notificações | — | **Padrão** (opt-in) | Opcional, em "Feito para o dia a dia": "Sem spam: no máximo três lembretes por dia, e você desliga cada um." |

### F. Login, compras, conta

| # | Alegação | Onde | Status real | Correção sugerida |
|---|---|---|---|---|
| 18 | Google Sign-In (não é citado em site nem loja) | — | **Ligado no código e nos envs.** Pacote nativo desde runtime 1.2.0 (#298, 2026-07-25); Web Client ID real em `eas.json` preview e production (#301) e nos envs de OTA de `ci.yml`/`promote-production.yml` (#303). Botão "Continuar com Google" renderiza só em Android com Play Services (`isGoogleSignInAvailable`). **Não verificável pelo repo**: consent screen do Google Cloud publicado e SHA-1 da build da Play registrado. `docs/google-signin-setup.md` está desatualizado ("ships empty on purpose"). | Antes de anunciar: abrir o app da Play num Android e confirmar o botão e um login. Se funcionar: "Entre com Google ou com e-mail e código." Nunca manchete — é higiene, não diferencial. |
| 19 | "Autenticação segura" | Loja | **Padrão**: e-mail + código OTP (8 dígitos), sem links. | OK. |
| 20 | "Perceva Premium — Em breve" · "Assinatura disponível no lançamento" | Site pt+en (Planos) | **Cliente pronto, venda não confirmada.** `PURCHASES_ENABLED = true` desde 2026-08-28 (#365); RevenueCat com chaves Google e Apple em `eas.json` e CI; Edge Function `revenuecat-webhook` grava `subscription_tier`. Paywall só vende em binário ≥ 1.3.0 com o módulo nativo (`app_config.android_release` = 1.3.0 desde 2026-08-25; `app.json` já em 1.4.0). **Não verificável pelo repo**: assinatura aprovada no Play Console, offering no RevenueCat, compra de teste feita. iOS não vende (sem build). O contexto do painel diz "em integração"; o código diz "ligado, aguardando confirmação de loja". | Manter "Em breve" no site até o dono confirmar **uma compra de teste real**. Quando confirmar: preço + "assine dentro do app". Nada de "compre agora" em campanha antes disso. |
| 21 | Preços R$ 14,90/mês · R$ 99,90/ano ("cinco meses grátis") | Site, app (`premium.plan`) | **Consistentes.** EN do site: US$ 2,99 / 19,99. | Conferir o preço que a Play vai exibir em USD antes de fixar no site EN. |
| 22 | Limites free: site "até 10 hábitos e 3 missões ativas / até 5 recompensas"; app "10 práticas, 5 recompensas, 3 habilidades, 3 missões" | Site, app | **Padrão e enforced no servidor** (triggers `free_limit_reached`, migration `20260707000001`). | Site lidera com 10 práticas + 5 recompensas. Missões/habilidades são limites de módulo — não colocar na vitrine do grátis. |
| 23 | "excluir sua conta e todos os seus dados a qualquer momento, direto no app" · site "acessar, corrigir ou apagar" | Loja, site | **Padrão**: Ajustes → Excluir conta → Edge Function `delete-account` (#274, 2026-07-15). | OK. |
| 24 | "Português e inglês, com troca instantânea" | Loja | **Padrão**: Ajustes → Idioma; catálogos `_pt`/`_en`; Recanto escrito nativamente nas duas línguas. | OK — merece subir de rodapé a diferencial (ver §2). |

### G. Privacidade

| # | Alegação | Onde | Status real | Correção sugerida |
|---|---|---|---|---|
| 25 | "Nada é vendido, usado para publicidade ou para treinar modelos. Sem anúncios, sem rastreamento de comportamento, sem coleta de localização." | Site pt+en | **Verdadeiro hoje**: nenhum SDK de analytics/ads em `app/package.json`; Data Safety coerente. **Ressalva**: o Conector envia dados ao Claude **quando o usuário conecta e pergunta** (o app já avisa em Personalizar → "Isto vai para o Claude quando você usa o conector — e para mais nada"). | Ao divulgar o Conector, acrescentar uma frase: "Se você conectar o app ao seu assistente de IA, os dados vão só pra ele, só quando você pergunta, e você desconecta quando quiser." |

### H. Tom e mecânica

| # | Alegação | Onde | Status real | Correção sugerida |
|---|---|---|---|---|
| 26 | "Sem punição, sem culpa, no seu ritmo" · "se um dia não der, nada zera" | Site (hero, pilar ii) | **Padrão e a alegação mais fiel do site**: nunca houve streak punitivo; pular é decisão (`task_skip`); XP nunca cai; humor "sem XP · sem streak · sem cobrança"; DaySeal fecha o dia até só com pulos; dá pra fechar dias passados. | Ancorar em gestos: "pular", "dia fechado", "desfazer". Sem Momentum, esta frase fica **mais** verdadeira, não menos. |
| 27 | "Recompensas suas: você define o que merece comemorar e compra com o próprio progresso" | Site; loja ("você decide o que merece comemorar") | **Padrão** (Vault: criar, precificar, comprar, guardar, usar, vender de volta). Falta a metade descoberta pelo dono: **"há quantos dias"** — `VaultGapsCard` em `/perfil` ("Sem resgatar · N d · maior intervalo anterior") e `get_rewards` no MCP (`days_since_last`, `is_longest_streak_ever`). | Não usar "comemorar" como único verbo. Segunda frase: "E se a recompensa for um deslize, o app responde a única pergunta que importa: há quantos dias." |
| 28 | "Comece no Nível 1. O resto a gente cuida." · "Sua jornada começa no Nível 1." · keyword ASO `rpg` | Loja, onboarding | **Padrão**: nível existe (curva linear `(n−1)×100`, "LV" no cabeçalho), XP e moedas idem. | Verdadeiro, mas é o vocabulário que o anti-posicionamento manda não liderar ("RPG da vida real", "suba de nível na vida"). Decisão aberta do brief de agosto: assumir ou esconder. Até decidir, não abrir a descrição com Nível 1. |
| 29 | "Seis áreas da vida com nota" · "o radar de quem você está virando" | Site | **Padrão**: hexágono de Avaliação (0–5 por sub) e de Dedicação (XP por janela). | OK. |
| 30 | Botões "Baixar / Em breve" (Google Play e App Store) | Site | Play em **teste fechado**; iOS **não submetido**. | Manter "Em breve" até a listagem pública. Se a campanha começar antes, trocar o CTA por captura de e-mail/lista de teste. |

### I. O que não existe (e hoje ninguém promete — manter assim)

| # | Item | Estado | Guardrail |
|---|---|---|---|
| 31 | Social (círculos, missões em dupla, perfil compartilhado) | **Não existe** — só em `docs/proposta-de-valor.md` e `docs/three-pillars.md` | Não citar em site, loja ou vídeo como recurso. Se entrar no roteiro, é "no mapa", uma vez, sem data. |
| 32 | Mentor, coach ou IA **dentro** do app | **Não existe.** O que existe é o **Conector**: tela instrucional em Ajustes (`conector.*`), OAuth no claude.ai, **12 tools de leitura + 1 de escrita** (`log_mood`), versão 0.4.1; exige conta Claude com conectores personalizados. | "Conecte o Perceva ao seu assistente de IA (hoje, Claude)". Nunca "o app te orienta / analisa / propõe". A "Mentoria" do pedido do dono é isto e só isto. |

### Substituições diretas (para quem for reescrever)

| Sai | Entra |
|---|---|
| Momentum (qualquer forma) | Dia fechado · nada zera |
| Jornadas / quests | Missões (módulo opcional) |
| Leituras curtas / short reads | Recanto: ideias pra ler, ouvir ou ver |
| "quatro inventários" | Avaliação + seis instrumentos (Big Five, Valores de Schwartz, Apego ECR-R, Forças, DISC, Tipos) |
| "lado a lado na aba Eu" | "sobrepostos no mesmo hexágono, na aba Eu" |
| "um resumo de manhã e um checkpoint… você escolhe os horários" | "três lembretes opcionais…" (texto do item 16) |
| "Escolha algumas quests iniciais" | "Escolha 3 práticas pra começar" |
| "Estudos exclusivos" (paywall) | remover |

---

## 2. O que o app faz hoje e ninguém está contando

Cada item traz a frase honesta de marketing (pt-BR) e o gesto observável no app que a sustenta. Onde há número, é o de hoje — atualizar antes de publicar.

1. **Conector com o assistente de IA (MCP).** *"Seu assistente de IA lendo o seu mês — não um conselho de revista."* Gesto: Ajustes → Conector → 5 passos no claude.ai; perguntar "como foi meu mês?", "o que falta hoje?", "há quantos dias não resgato aquela recompensa?"; ditar "registra meu dia: acordei tarde, treinei…". Ressalvas obrigatórias: funciona com Claude em plano com conectores; escreve **só** o humor do dia; nada de concluir prática ou gastar moeda por lá.
2. **Ideias com card que vira.** *"Nunca mais de cinco ideias por material. Vira o card, e a ideia é sua."* Gesto: fim da ideia → toque no card → afirmação de uma frase → vai para Minhas ideias. É o único lugar que "absorve".
3. **Pilha de revisão por swipe.** *"O que você absorveu volta pra você decidir: favorita ou solta."* Gesto: lâmpada no Recanto com contador de pendentes → arrastar para a direita (favorita) ou esquerda (solta) → grade de favoritas.
4. **Explorar que acaba.** *"Cinco cards e acabou. Feito pra não roubar o seu foco."* Gesto: Recanto → Explorar → "Sequência concluída" (`REEL_SET_SIZE = 5`). Anti-feed-infinito é argumento, não limitação.
5. **Deep dive em áudio.** *"Vinte e poucos minutos de áudio pra quem quer entender de verdade — no carro, na louça, antes de dormir."* Gesto: material → "Deep dive · N min". Hoje em 12 dos 35 materiais (10 em PT e EN). Dizer "em parte do catálogo".
6. **Vídeo de um minuto por ideia.** *"Um minuto de vídeo que fixa exatamente aquela ideia."* Hoje em 10 das 107 ideias; a fila do Notebook cresce ter/sex. Dizer "em algumas ideias, crescendo toda semana" — nunca "vídeos infinitos".
7. **Calendário com frentes e filtro.** *"O filtro escolhe os dias; a frente escolhe o que ver deles: rotina, humor ou o que você resgatou."* Gesto: botão-calendário na Home → chips Rotina / Humor / Vault → funil (humor, práticas, dimensões, tags, resgates). Leituras cruzadas ("o que resgatei nos dias ótimos") são o demo.
8. **Espiada do dia.** *"Toque num dia e veja o que aconteceu ali, sem sair do mês."* Gesto: célula do calendário → painel embaixo do grid; abrir o dia completo para desfazer ou registrar atrasado.
9. **Humor diário + Insights de 90 dias.** *"Um check-in por dia. Em 90 dias o app mostra o que costuma vir junto com os seus dias bons — e avisa que junto não é causa."* Gesto: Home → "Humor de hoje" (1–5, tags, nota) → Insights → Por humor / Por atividade, com o aviso "co-ocorrência, não causa". A honestidade do aviso é parte do argumento.
10. **Recompensa com "há quantos dias".** *"Coloque preço no deslize. O app responde a única pergunta que importa: há quantos dias."* Gesto: `/perfil` → "Sem resgatar" → dias desde o último resgate, maior intervalo anterior, "acima do intervalo anterior". Tom: sem sermão, sem confete.
11. **Dia fechado, pular como decisão, retro-log.** *"Pular é decisão, não falha. E dá pra fechar ontem hoje."* Gesto: segurar prática → Pular; "Fechar o dia"; setas de dia no cabeçalho da Home para registrar um dia passado.
12. **Bilíngue de verdade.** *"Cada material escrito em português e em inglês, com exemplos de cada cultura — não traduzido."* Gesto: Ajustes → Idioma; abrir o mesmo material nas duas línguas.
13. **Norte (meta por área).** *"Trace onde quer chegar em cada área, sobre o contorno de onde você está."* Gesto: Eu → Desejada → "Traçar meu norte". É o padrão da Identidade Desejada (Habilidades é módulo).
14. **Espelho de três camadas.** *"Como você se vê, o que o questionário diz e o que você pratica — no mesmo hexágono."* Gesto: Eu → Percebida (self × questionário) e Praticada (contorno da percepção sobre a Dedicação); tela Espelho.
15. **Emblema e títulos vindos dos testes.** *"Seu emblema mostra o esforço do mês, os testes feitos e o que leu. O título vem de quem você é, não de conquista."* Gesto: tocar o avatar → `/perfil` → Personalizar (títulos de DISC/Tipos, paletas).
16. **Minha Semana (módulo).** *"Três coisas grandes por semana e uma lista do que precisa acontecer. Sem XP: o check é a recompensa."* Gesto: Ajustes → Módulos → Minha Semana → faixa na Home.
17. **Check-in noturno de humor por notificação.** *"À noite, um toque: como foi seu dia?"* Gesto: Ajustes → Notificações → hora do fim do dia.
18. **Zero rastreamento, verificável.** *"Nenhum SDK de anúncio ou analytics no app."* Sustentação: `app/package.json`. Combina com o bloco de privacidade do site.
19. **Limite do grátis igual no app e no servidor.** *"Dez práticas e cinco recompensas no grátis — e o servidor garante que é isso mesmo."* Argumento de honestidade para quem desconfia de freemium.

Não entram nesta lista, por não existirem ou por serem promessa: Social, mentor no app, recomendação automática de ideia dentro do app, Momentum.

---

## 3. Capturas do site — estado e recaptura

**Estado.** Quatro arquivos em `perceva-site/public/assets/`: `shot-me.jpg`, `shot-tasks.jpg`, `shot-rewards.jpg`, `shot-learn.jpg` — todos **540×1158 px**, JPEG de 57–75 KB, **UI em inglês**, capturados em aparelho real em **2026-07-13** ("Monday, Jul 13", 20:28–20:29 no status bar) e versionados em 2026-07-26 quando o site foi recuperado byte a byte. O site usa os mesmos quatro no hero (`.phone`, 270 px), na grade "Por dentro do app" e no `screenshot` do JSON-LD, tanto em `/` quanto em `/en/`. A resolução é limítrofe para telas retina na grade e insuficiente para reaproveitar na Play (1080×2400).

**O que está defasado, tela a tela (2 meses de produto):**

| Arquivo | O que a captura mostra | O que o app é hoje |
|---|---|---|
| `shot-tasks.jpg` | Cabeçalho com barra XP "37/100 · LV 33"; chips **Quests / Goals**; abas **Daily / Weekly / One-shot**; rodapé Tasks / Rewards / Me / Learn / Settings | Saudação ("Bom dia") + navegação por dia + XP do dia; chips de Missões/Metas **escondidos** (módulos OFF); buckets **Hoje / Recorrente / Pontual**; faixa "Humor de hoje"; selo "Dia fechado"; rodapé Práticas / Recompensas / Eu / Aprender / Ajustes |
| `shot-me.jpg` | "LV 33 · HEALTH EXPERT"; sub-abas **Assessment / Self-knowledge**; radar em modo comparação | Sistema de títulos substituído (títulos vêm de DISC/Tipos, em Personalizar); **Eu = um painel por pilar**, sem sub-abas — Autoconhecimento mudou para `/perfil` (2026-08-28); o espelho é o contorno sobre o hex |
| `shot-rewards.jpg` | Saldo, "Keep training to unlock bigger vaults", "Track a reward", Indulgence / Good / Experience, botões BUY | Estrutura ainda parecida (as strings seguem no `en.ts`), mas em inglês e mostrando só a metade "comprar"; não existe captura do "há quantos dias" (`/perfil`) |
| `shot-learn.jpg` | "Reading nook · 11/17 Read", capas de ícone sobre dourado, chip "Explainer", "Continue reading" | **A mais defasada**: Recanto com 35 materiais e capas próprias, ideias com imagem 4:5, card que vira, entrada do Explorar, lâmpada de Minhas ideias, deep dive em áudio, vídeos |

**Recapturar — especificação:**

- **Fonte**: build atual da Play (ou APK `preview`), **não Expo Go** (módulos nativos e barra do sistema diferem). Tema escuro (padrão). Aparelho 1080×2400 (Play aceita 9:16 até 9:21; o site reduz).
- **Conta populada** antes de capturar: 60+ dias de histórico em ~15 práticas; humor registrado em ≥ 30 dias com tags e notas; 3+ instrumentos concluídos (um deles Big Five); ≥ 8 ideias absorvidas e 3 favoritas; recompensas com resgates espaçados (para o card "Sem resgatar"); Norte traçado; nome de exibição real, não "Perceva".
- **Dois conjuntos**: pt-BR para `/` e en-US para `/en/` (o site EN é canônico, não pode ficar com telas PT). Mesmas telas, mesma conta.
- **Exportar**: JPEG q≈85, ≤ 120 KB, 1080 de largura para o site (o `tools/optimize-png.mjs` só trata PNG — usar ffmpeg ou similar); PNG sem alpha 1080×2400 para a Play (`02-assets-spec.md`). Nomear pelo conteúdo (`shot-hoje.jpg`, `shot-eu-praticada.jpg`…) e atualizar `index.html`, `en/index.html` e o JSON-LD.
- **Conferir `og.png`** (1200×630, gerado por `tools/make-og.mjs`): se embute captura antiga, regenerar.

**Lista de telas, em ordem de prioridade, com o lugar que cada uma ocupa:**

| # | Tela | Para quê |
|---|---|---|
| 1 | Eu › **Praticada** — hex da Dedicação com o **contorno da percepção** | Hero do site (é a frase matadora em imagem) e slide 1 da loja |
| 2 | **Hoje** — saudação, práticas, faixa de humor, selo de dia parcialmente fechado | Grade "Pratique"; slide 2 da loja |
| 3 | Eu › **Percebida** — hex com notas por área | Grade "Perceba" |
| 4 | **/perfil** — ficha com os 6 testes (2 feitos, 4 com chip Premium) + card "Sem resgatar" | Seção de instrumentos; prova de "ciência nomeada" |
| 5 | **Resultado do Big Five** (nível por traço) | Card Clareza; slide de autoconhecimento na loja (legenda: autoconhecimento, nunca saúde mental) |
| 6 | **Recanto** — capas + card de entrada do Explorar + lâmpada com contador | Grade "Aprenda" |
| 7 | **Uma ideia** — imagem 4:5 + texto + **card virado** com a afirmação | Card Conhecimento; slide do Recanto na loja |
| 8 | **Minhas ideias** — pilha de revisão no meio de um swipe | Reel/vídeo de campanha mais que site |
| 9 | **Calendário** — frente Humor com filtro aplicado e espiada do dia aberta | Nova figura "Meça" (o site não tem nenhuma tela de medição hoje) |
| 10 | **Insights** — "Nos seus N dias ótimos…" com o aviso de co-ocorrência | Apoio à figura 9 |
| 11 | **Recompensas** (pt) — Vault com itens e carteira | Grade "Recompense-se" |
| 12 | **Conector** — tela de Ajustes com URL e exemplos de pergunta | Seção nova do site para o assistente; slide opcional |

A grade atual tem 4 figuras (Perceba · Pratique · Recompense-se · Aprenda). Recomendação: 6 figuras — acrescentar **Meça** (calendário) e **Converse** (conector) — porque medir e conversar são exatamente as duas capacidades que o discurso público não mostra e o app tem.

---

## 4. Riscos transversais para o painel decidir

1. **DISC e Tipos × "ciência nomeada".** O site promete "instrumento, não quiz de revista"; o grátis oferece DISC e Tipos, que não têm o lastro de Big Five/Schwartz/ECR-R. Não são infidelidade (o app não os chama de validados), mas viram uma se um vídeo disser "teste de personalidade de verdade" mostrando o DISC. Regra sugerida: nomear só os três (ou quatro, com Forças) no discurso de ciência; DISC/Tipos aparecem como "pra começar".
2. **Vocabulário RPG.** Nível, XP, moedas, "LV" no cabeçalho, keyword `rpg` na loja — tudo existe. O anti-posicionamento proíbe liderar com isso, não proíbe existir. Decisão que o brief deixou aberta continua aberta; até fechar, nenhuma peça abre com "Nível 1".
3. **Linguagem celebratória no Cofre.** "Comemorar", "curtir agora", "hora de curtir" convivem com o uso como penalidade. Em material público, uma frase para cada uso.
4. **Conector depende de terceiro pago.** Só funciona com Claude em plano com conectores personalizados. Toda menção carrega "hoje, com o Claude".
5. **3×3 do pedido do dono.** Dos três métodos, só Recompensas existe no app; Mentoria é o Conector (externo, leitura + humor); Social não existe. O playbook pode usar a grade como tese, não como lista de recursos.
6. **Momentum na loja.** O rascunho de loja é de 2026-08-18, dez dias antes do desligamento. Se a listagem pública for aberta com ele, nasce infiel. Reescrever antes de submeter.

---

## 5. Fontes verificadas

- Site: `perceva-site/public/index.html`, `public/en/index.html` (meta, JSON-LD linhas 60–95, `.phone` linha 161, `.shot img` linha 228); `public/assets/shot-*.jpg` (540×1158); cópias em `scratchpad/site-pt-copy.txt`, `site-en-copy.txt`.
- Loja: `docs/publish/01-store-metadata.md` (commits `e85dfa1`, `46b5b32`, 2026-08-18); `docs/publish/02-assets-spec.md`.
- Módulos: `app/lib/modules.ts` (`MODULE_REGISTRY`, 4 chaves, `default: false`); `profile.modules.*` em `pt.ts`.
- Momentum: CLAUDE.md § "Identidade Praticada" (migration `20260828000001`); zero ocorrências em `pt.ts`/`en.ts`.
- Instrumentos: seeds `20260507000001/2/5/6/7`, `20260701000002/3/4` (item_count 48/120/57/36/44/72/64); `app/lib/premium/constants.ts` (`PREMIUM_INSTRUMENT_IDS`, `PREMIUM_LEARN_ENABLED=false`, `PURCHASES_ENABLED=true`, commits `038fefe` #308, `5774e4e` #365); `premium.compare.instrumentsFree` = "Avaliação, DISC e Tipos".
- Learning: `app/lib/db/types.ts` (`LearningMaterial.ideas`, `LearningMediaKind`), `app/lib/api/learning.ts` (coleção, pilha de revisão), `app/lib/reels.ts` (`REEL_SET_SIZE = 5`), `IdeasMaterialScreen.tsx` (deep dive = mídia `audio`); áudio: migrations `20260722000005/6/8`, `20260901000002–5`, `20260910000005` → 12 materiais; vídeo: `"video":{"path"…}` em `20260907000003`, `20260910000002/3/5`, `20260911000002` → 10 ideias; catálogo: 35 specs em `learning-drops/ideas-specs/` e `media-specs/`.
- Notificações: `app/lib/notifications/constants.ts` (Brief, Checkpoint 12:30, Nightly → `/mood-checkin`), `scheduler.ts`, `useNotificationsSetup.ts`.
- Google: `app/lib/auth/google.ts` (`isGoogleSignInAvailable`), `app/eas.json` linhas 30/44, `.github/workflows/ci.yml` 83, `promote-production.yml` 140; commits `13e944c` #298, `4536ac6` #301, `01828b3` #303.
- Compras: `app/lib/purchases/purchases.ts` (`purchasesAvailable`), `app/app/premium.tsx` (`CAN_SELL`), `supabase/functions/revenuecat-webhook`, `supabase/migrations/20260825000002_app_config.sql` (`android_release` 1.3.0), `app/app.json` (`version` 1.4.0, `d54c364` #382).
- Conta/idioma: `app/app/(tabs)/profile.tsx` (`functions.invoke('delete-account')`), `profile.language`, `supabase/functions/delete-account`.
- Espelho: `app/components/pillars/DedicacaoPanel.tsx` (linhas 35–41, 143–155), `AvaliacaoPanel.tsx` (linhas 70–95, 195), `app/app/profile-mirror.tsx`; `(tabs)/character.tsx` linha 38 (Autoconhecimento em `/perfil`).
- Recompensa "dias": `app/lib/api/rewards.ts` (`daysSinceLast`, linhas 124–214), `app/components/perfil/VaultGapsCard.tsx`, `perfil.gaps.*`.
- Calendário/humor/insights: `app/lib/calendar/*`, `app/components/calendar/*`, `calendar.*`, `insights.*`, `mood.*` em `pt.ts`; `app/lib/api/correlation.ts` (janela 90 dias).
- Conector: `app/app/conector.tsx`, `conector.*` e `personalizar.aboutHint` em `pt.ts`; `supabase/functions/perceva-mcp/index.ts` (versão 0.4.1; tools: get_day_plan, get_learning_ideas, get_mood_entries, get_mood_stats, get_period_digest, get_profile_summary, get_quests, get_rewards, get_self_knowledge, get_skill_logs, get_task_completions, list_mood_tags, log_mood).
- Navegação/onboarding: `app/components/BottomNavBar.tsx` (5 abas), `app/components/TasksFabStack.tsx` (calendário = FAB), `onboarding.*`, `tour.*`, `home.buckets`, `home.greeting`, `home.daySeal` em `pt.ts`.
