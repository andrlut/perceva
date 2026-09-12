# Perceva — Pacote de loja (ASO) v1 · 2026-09-12

Painel editorial do playbook de marca, frente ASO. Reescreve `docs/publish/01-store-metadata.md` (18/08) e a parte de capturas de `02-assets-spec.md` à luz da espinha (`00-espinha.md`), do cânone de vocabulário, da auditoria de fidelidade e dos dossiês de mercado e GTM. Tudo aqui deriva desses arquivos; **sem web**. O que não está neles vem marcado **[a confirmar]**.

Regras que este pacote obedece e que quem editar depois precisa manter:

1. **Lista negra pública** (espinha §7 e vocabulário §3) vale integralmente: sem Momentum, sem Jornadas/quests em PT, sem "Nível 1", sem "quatro inventários", sem "teste/avaliação psicológica", sem Social, sem "Estudos exclusivos", sem "autocuidado"/"self-care" como categoria, sem "pilar" para retrato ou área, sem XP em prosa.
2. **Ciência nomeada, sempre com "inspirado em / baseado em"**, nunca "validado". Big Five (120 itens) · Valores de Schwartz · Apego (ECR-R) · Forças de caráter. DISC e Tipos só como "pra começar", fora da frase de ciência.
3. **Nada que não exista.** Conector = "conecte ao seu assistente de IA (hoje, Claude)". Módulos opcionais aparecem como opcionais. Premium aparece como o que é, sem "assine agora" até a compra de teste real.
4. **"Hábito" na porta, "prática" dentro.** Título, primeira linha e keywords dizem hábitos; o corpo diz práticas.
5. Contagem é em **pontos de código** (é o que as duas lojas contam). Cada campo traz `[N/max]`, re-contado a partir deste arquivo.

Estado das lojas: Play em teste fechado com build de produção (1.4.0) → **pacote pt-BR e en-US da Play é para aplicar agora**; App Store **pronta para colar** no dia em que houver build iOS (conta Apple pendente).

---

## 0. Decisões de campo (resumo de uma tela)

| Campo | Decisão | Por quê |
|---|---|---|
| **Título (30)** — Play e App Store | **`Perceva: hábitos e identidade`** `[29/30]` · **`Perceva: habits & identity`** `[26/30]` | "Perceva: hábitos e autoconhecimento" tem **35** caracteres (o dossiê de mercado estimou 33; não cabe de nenhum jeito). "Identidade" é a palavra de que a marca quer ser dona (espinha §3); "hábitos" é onde a Marina procura. "Autoconhecimento" **não se perde**: vai para o subtítulo da App Store e para a descrição curta da Play, os dois campos que a busca também lê. |
| **Subtítulo App Store (30)** | **`Autoconhecimento na prática`** `[27/30]` · **`Self-knowledge in practice`** `[26/30]` | Carrega a tese (o teste que vira prática) e coloca a palavra de busca onde a Apple indexa sem repetir o título. Alternativa PT mais falada, se o dono preferir: `Teste sério que vira prática` `[28/30]`. |
| **Descrição curta Play (80)** | frase de rua, verbatim | É a única frase da categoria que ninguém mais pode assinar. |
| **Categoria** | Play: **Estilo de vida**. App Store: **Lifestyle** (primária) + **Productivity** (secundária) | Mantida do rascunho: Health & Fitness convida o revisor a ler os instrumentos como saúde; Lifestyle os lê como desenvolvimento pessoal. Nunca Medical. |
| **Descrição longa** | **um texto por idioma, igual nas duas lojas** | Limite idêntico (4.000); um só texto para manter. |
| **Classificação** | 4+ (Apple) · Livre/Everyone (IARC) — **muda uma resposta**: conteúdo gerado por IA = **Sim, com curadoria humana** | Ver §5. Não altera a faixa etária. |
| **Vídeo de prévia** | gravar já; **entrar na ficha só depois de experimento de listagem** | Evidência contestada (Apple publicou o caso em que a página sem vídeo venceu). |
| **Capturas** | 8 frames, ordem "teste primeiro, hábito depois" | Público primário é a Marina (espinha §4). |

---

## 1. Google Play — pt-BR (aplicar agora)

### 1.1 Título `[29/30]`
```
Perceva: hábitos e identidade
```

### 1.2 Descrição curta `[78/80]`
```
Hábitos e autoconhecimento: veja quem seus hábitos estão treinando você a ser.
```
Alternativa com "práticas" (se o dono quiser puxar o vocabulário do produto já na porta): `Hábitos e autoconhecimento: veja quem suas práticas estão treinando você a ser.` `[79/80]`. Recomendo a verbatim: é a frase de rua.

### 1.3 Descrição completa `[3617/4000]`
```
Perceva é um app de hábitos e autoconhecimento com uma ideia no centro: você se torna aquilo que pratica. Ele não conta só o que você faz — mostra quem os seus hábitos estão treinando você a ser.

Seis áreas da sua vida — saúde, corpo, mente, prosperidade, vínculos e ofício (lazer e construir) — com nota. E, no mesmo hexágono, três retratos:

▍PERCEBIDA — como você se vê hoje
Autoavaliação nas seis áreas e um questionário de bem-estar, grátis. Para ir fundo, testes com nome: Big Five (inspirado no modelo dos cinco grandes fatores, 120 itens), Valores (baseado na teoria de Schwartz), Apego (escala baseada no ECR-R) e Forças de caráter. Instrumentos de reflexão, não de diagnóstico. Esses quatro fazem parte do Perceva Premium; pra começar, dois questionários rápidos e gratuitos (DISC e Tipos).

▍PRATICADA — o que suas ações treinam em você
Crie práticas e distribua estrelas entre as áreas que cada uma fortalece. Concluir rende Dedicação por área e moedas — e a Dedicação nunca cai. Pular também é decidir: nada zera, nada cobra, e dá pra fechar ontem hoje. O contorno de como você se vê aparece sobre o hexágono do que você pratica: a diferença entre o que você acha e o que você faz.

▍DESEJADA — quem você quer se tornar
Trace o seu Norte: onde quer chegar em cada área, sobre o contorno de onde você está.

▍HUMOR E CALENDÁRIO
Um check-in por dia, com nota e tags. O Calendário mostra os dias como foram — Rotina, Humor e Cofre lado a lado — e o filtro escolhe os dias: o que você resgatou nos dias ótimos, como esteve nas semanas em que treinou. Com 90 dias, os Padrões mostram o que costuma vir junto com os seus dias bons — e avisam que junto não é causa.

▍O RECANTO — ideias com fonte
Cada assunto vira de uma a cinco ideias: uma imagem, um texto de dois minutos, fontes clicáveis; em parte do catálogo, um vídeo de um minuto e um mergulho em áudio de vinte e poucos minutos. No fim, vire o card — a ideia fica com você e volta depois pra você decidir: favorita ou solta. O Explorar acaba em cinco. De propósito.

▍O COFRE — recompensas que você define
Você cria a recompensa, põe o preço em moedas e resgata quando quiser. E se a recompensa for um deslize, o app responde a única pergunta que importa: há quantos dias.

▍O CONECTOR — o assistente que te conhece
Conecte o Perceva ao seu assistente de IA (hoje, Claude) e ele para de adivinhar: passa a ler o que você praticou, como esteve e há quantos dias. Ele escreve só o humor do dia. Os dados vão só pra ele, só quando você pergunta, e você desconecta quando quiser. Precisa de uma conta Claude com conectores.

▍MÓDULOS OPCIONAIS
Quer mais? Ligue em Ajustes: Missões (desafios com prazo e recompensa no fim), Metas, Habilidades (recordes com faixas do iniciante ao mestre) e Minha Semana (três coisas grandes por semana). Vêm desligados: o núcleo é simples.

▍FEITO PRA VOCÊ
• Português e inglês, com troca instantânea — e cada ideia escrita nas duas línguas, não traduzida.
• Três lembretes opcionais: resumo de manhã e check-in de humor à noite, nos horários que você escolher; e um toque ao meio-dia só se você não abriu o app. Cada um desliga separado.
• Seus dados são seus: sem anúncios, sem rastreamento, nenhum SDK de analytics. Entre com e-mail e código. Exclua sua conta e todos os seus dados a qualquer momento, direto no app.
• Grátis: até 10 práticas ativas e 5 recompensas, a Avaliação das seis áreas e o Recanto inteiro.

O Perceva não promete resultado nem substitui acompanhamento profissional. Ele mostra — em dez segundos por dia e uma olhada por semana — quem está aparecendo.

Comece pelas seis áreas. O resto é prática.
```

Notas de fidelidade embutidas (não são opinião, são o que o código faz em 12/09): Dedicação sem bônus (Momentum dormente); três lembretes, e só dois com horário do usuário; áudio em 12 dos 35 materiais e vídeo em 10 das 107 ideias → "em parte do catálogo"; Recanto inteiro grátis (`PREMIUM_LEARN_ENABLED = false`); limites do grátis aplicados no servidor; nenhum SDK de anúncio/analytics; Conector = 12 leituras + 1 escrita (humor). "Entre com e-mail e código" é o que está verificado — Google Sign-In está ligado no código, mas o botão e o login na build da Play ainda precisam ser vistos num aparelho antes de entrar na copy **[a confirmar]**.

### 1.4 Categoria e tags
- **Categoria:** Estilo de vida.
- **Tags (até 5, da lista fixa do console — nomes exatos [a confirmar na tela]):** Autoaperfeiçoamento · Hábitos · Diário · Bem-estar · Produtividade. Se a lista tiver uma tag de humor ("Monitoramento de humor" ou similar), ela entra no lugar de Produtividade: humor é a frente que a ficha antiga não mostrava e a categoria secundária já cobre produtividade na App Store.
- **Termos que precisam aparecer naturalmente na descrição (aparecem):** hábitos, autoconhecimento, práticas, humor, calendário, recompensas, personalidade (via Big Five), bem-estar, rotina — sem repetição forçada; a política de metadados da Play pune enchimento.

### 1.5 Novidades desta versão (release notes) `[491/500]`
Versão de lançamento = a que estiver em `app/app.json` na submissão (hoje `1.4.0`; o rascunho antigo dizia 1.0.0).
```
Primeira versão pública.

• Seis áreas com nota e três retratos: Percebida, Praticada, Desejada.
• Práticas com Dedicação por área (nunca cai) e moedas. Pular também é decidir.
• Check-in de humor e Calendário: Rotina, Humor, Cofre.
• Recanto: ideias com fonte e card que vira; vídeo e áudio em parte do catálogo.
• Cofre: recompensas que você define — e "há quantos dias".
• Testes com nome: Big Five, Valores, Apego, Forças (Premium).
• Conector para o seu assistente de IA (hoje, Claude).
```

---

## 2. Google Play — en-US (aplicar agora, junto)

### 2.1 Title `[26/30]`
```
Perceva: habits & identity
```

### 2.2 Short description `[72/80]`
```
Habits & self-knowledge: see who your habits are training you to become.
```

### 2.3 Full description `[3660/4000]`
```
Perceva is a habits-and-self-knowledge app built on one idea: you become what you practice. It doesn't just count what you do — it shows who your habits are training you to become.

Six areas of your life — health, body, mind, wealth, bonds and craft (play and build) — each with a score. And, on the same hexagon, three portraits:

▍PERCEIVED — how you see yourself today
A self-assessment across the six areas plus a wellbeing questionnaire, free. To go deeper, tests with a name: Big Five (inspired by the five-factor model, 120 items), Values (based on Schwartz's theory), Attachment (a scale based on the ECR-R) and Character Strengths. Instruments for reflection, not diagnosis. Those four are part of Perceva Premium; to get started, two quick free questionnaires (DISC and Types).

▍PRACTICED — what your actions train in you
Create practices and spread stars across the areas each one strengthens. Completing one earns Dedication per area, plus coins — and Dedication only ever goes up. Skipping is a decision too: nothing resets, nothing nags, and you can close yesterday today. The outline of how you see yourself sits over the hexagon of what you actually practice: the gap between what you think and what you do.

▍DESIRED — who you want to become
Set your North: where you want to get to in each area, drawn over the outline of where you are.

▍MOOD AND CALENDAR
One check-in a day, with a note and tags. The Calendar shows your days as they were — Routine, Mood and Vault side by side — and the filter picks the days: what you redeemed on your great days, how you felt in the weeks you trained. After 90 days, Insights show what tends to come along with your good days — and remind you that "together" isn't "because".

▍LEARN — ideas with sources
Each topic becomes one to five ideas: an image, a two-minute read, clickable sources; in part of the catalog, a one-minute video and a twenty-odd-minute audio deep dive. At the end, flip the card — the idea stays with you and comes back later for you to decide: favorite or let go. Explore ends after five. On purpose.

▍THE VAULT — rewards you define
You create the reward, set its price in coins and redeem it when you want. And if the reward is a slip, the app answers the only question that matters: how many days it's been.

▍THE CONNECTOR — the assistant that knows you
Connect Perceva to your AI assistant (Claude, for now) and it stops guessing: it reads what you practiced, how you've been and how many days it's been. It writes only the day's mood. Your data goes to it alone, only when you ask, and you can disconnect anytime. Requires a Claude account with connectors.

▍OPTIONAL MODULES
Want more? Switch them on in Settings: Quests (deadline challenges with a reward at the end), Goals, Skills (personal bests with tiers from beginner to master) and My Week (three big things a week). Off by default: the core stays simple.

▍BUILT FOR YOU
• English and Portuguese, with instant switching — and every idea written in both languages, not translated.
• Three optional reminders: a morning brief and an evening mood check-in at the times you choose, plus a midday nudge only if you haven't opened the app. Each one switches off separately.
• Your data is yours: no ads, no tracking, no analytics SDK. Sign in with email and a code. Delete your account and all your data anytime, right in the app.
• Free: up to 10 active practices and 5 rewards, the six-area Assessment and all of Learn.

Perceva doesn't promise results and isn't a substitute for professional care. It shows you — ten seconds a day, one look a week — who is showing up.

Start with the six areas. The rest is practice.
```

### 2.4 Category and tags
Lifestyle · tags: Self-improvement · Habits · Journaling · Wellness · Productivity (same swap rule as §1.4 if a mood tag exists) **[a confirmar]**.

### 2.5 Release notes `[494/500]`
```
First public release.

• Six scored areas, three portraits: Perceived, Practiced, Desired.
• Practices earn Dedication per area (never drops) and coins. Skipping is a decision too.
• Mood check-in and Calendar: Routine, Mood, Vault.
• Learn: ideas with sources, a card that flips; video and audio in part of the catalog.
• The Vault: rewards you define — and "how many days".
• Named tests: Big Five, Values, Attachment, Strengths (Premium).
• Connector for your AI assistant (Claude, for now).
```

---

## 3. App Store — pt-BR (pronta para colar quando houver build)

### 3.1 Nome `[29/30]`
```
Perceva: hábitos e identidade
```

### 3.2 Subtítulo `[27/30]`
```
Autoconhecimento na prática
```
Alternativa: `Teste sério que vira prática` `[28/30]`. Não usar `Hábitos que constroem quem é` (rascunho): repete "hábitos" do nome e gasta o campo sem palavra nova de busca.

### 3.3 Texto promocional `[158/170]`
Campo editável sem nova versão — é onde a mensagem de entrada da Marina vive; trocar por sazonal quando houver campanha.
```
Sabe teste de personalidade? O nosso faz o sério — Big Five, Valores, Apego — e o resultado não para na tela: vira prática diária, nas seis áreas da sua vida.
```

### 3.4 Palavras-chave `[99/100]`
Sem espaços, sem palavras já presentes no nome/subtítulo (a Apple indexa nome e subtítulo; repetir desperdiça o campo). Sem acento onde a Apple casa sem acento em pt.
```
rotina,metas,personalidade,teste,bem-estar,humor,diario,foco,disciplina,produtividade,apego,valores
```

| Termo | Por que entra (uma linha) |
|---|---|
| `rotina` | Busca vizinha de "hábitos" em pt-BR — a Play BR devolve agendas de rotina (Me+, Dear Me) até para "autocuidado"; cobre quem procura rotina, não hábito. |
| `metas` | Intenção explícita ("app de metas"); o módulo Metas existe. |
| `personalidade` | Com `teste` forma "teste de personalidade", a maior demanda orgânica adjacente do mundo (16Personalities, 15–16 mi visitas/mês). |
| `teste` | Idem — sozinho é genérico, combinado é a porta da Marina ("fiz o teste"). |
| `bem-estar` | A palavra permitida para o território emocional (a lista negra veta "saúde mental"); nomeia o questionário grátis. |
| `humor` | **Entra no lugar de `rpg`.** O check-in de humor existe, é uma frente do Calendário e nunca foi anunciado; "diário de humor" aparece em três das buscas BR do dossiê de mercado. |
| `diario` | Combina com `humor` ("diário de humor") e descreve a nota do check-in. |
| `foco` | Intenção de produtividade em quatro caracteres. |
| `disciplina` | Vocabulário do público terciário (quem largou Habitica/Loop) — só ASO, nenhuma campanha. |
| `produtividade` | Categoria secundária; puxa busca sem convidar leitura médica. |
| `apego` | A única palavra que ninguém na categoria tem; quem busca já sabe o que é estilo de apego (ECR-R). |
| `valores` | "Valores pessoais" (Schwartz); baixa competição, alta pertinência. |

Saem do rascunho: `rpg` (convida quem quer jogar, não quem quer mudar — espinha §10), `evoluir` (genérico da categoria), `habito` (já está no nome) e `autoconhecimento` (agora no subtítulo; repetir custaria 16 caracteres).

### 3.5 Descrição `[3617/4000]`
Idêntica à da Play (§1.3). Colar o mesmo bloco.

### 3.6 Novidades `[491/500]`
Idêntica a §1.5 (o campo da App Store aceita 4.000, mas um texto só evita divergência).

### 3.7 Categoria
Primária **Lifestyle**, secundária **Productivity**. Nunca Health & Fitness, nunca Medical (razões no rascunho de 18/08, §0 — permanecem).

---

## 4. App Store — en-US (pronta para colar)

### 4.1 Name `[26/30]`
```
Perceva: habits & identity
```

### 4.2 Subtitle `[26/30]`
```
Self-knowledge in practice
```
"Know yourself" is Dimensional's line — not contested on purpose.

### 4.3 Promotional text `[156/170]`
```
Know those personality tests? Ours is the serious kind — Big Five, Values, Attachment — and the result doesn't stop on screen: it turns into daily practice.
```

### 4.4 Keywords `[98/100]`
```
routine,goals,personality,test,wellbeing,mood,journal,focus,tracker,productivity,attachment,values
```

| Term | Why |
|---|---|
| `routine` | The adjacent habit search; low overlap with the pet/self-care cluster. |
| `goals` | Explicit intent; the Goals module exists. |
| `personality` + `test` | Together they form "personality test", the biggest adjacent organic demand. |
| `wellbeing` | The allowed emotional-territory word (never "mental health"). |
| `mood` | **Replaces `rpg`.** Mood check-in and the Mood front of the Calendar exist and were never advertised; Daylio-style "mood tracker" is a real query. |
| `journal` | Pairs with `mood` ("mood journal") and describes the check-in note. |
| `focus` | Productivity intent in five characters. |
| `tracker` | Combines with "habits" from the name into "habit tracker" — the category query — without spending the word "habit" twice. |
| `productivity` | Secondary category. |
| `attachment` | Nobody in the category owns it; searchers already know ECR-R/attachment styles. |
| `values` | "Personal values" (Schwartz); low competition. |

Dropped from the draft: `rpg`, `growth` (generic), `habit` (in the name), `self-improvement` (generic, 16 chars; "self-knowledge" now sits in the subtitle).

### 4.5 Description `[3660/4000]`
Identical to Play (§2.3).

### 4.6 What's New `[494/500]`
Identical to §2.5.

---

## 5. Classificação, Data Safety e formulários — o que muda

| Onde | Rascunho de 18/08 | Agora |
|---|---|---|
| **Apple — Age Rating, "conteúdo gerado por IA mostrado ao usuário"** | "confirmar com o dono do pipeline" | **Sim.** As ideias, os vídeos de um minuto e os mergulhos em áudio do Recanto são gerados por modelo e passam por **curadoria humana** (aprovação do texto antes da imagem, lint editorial, pipeline 2×/semana). Não é chat aberto nem geração sob demanda pelo usuário. A faixa continua **4+**. |
| **Play — declarações de conteúdo do app** | não tratava | Se o console apresentar uma declaração de conteúdo gerado por IA, responder **Sim, pré-gerado e curado pelo desenvolvedor**. A política de IA generativa da Play (mecanismo de denúncia in-app) mira apps que geram conteúdo em resposta ao usuário; o Perceva não gera nada sob demanda — **[a confirmar na redação vigente da política]**. |
| **IARC — compras digitais** | Sim (assinatura via RevenueCat) | Mantido: **Sim**. Sem preço na ficha até a compra de teste real (espinha §7, "Em breve"). |
| **IARC — troca de conteúdo entre usuários** | Não | Mantido: **Não** (Social não existe). |
| **Data Safety — "App activity"** | "tasks, rewards, skills, quests, XP, **streak**, logs" | "práticas, recompensas, **Dedicação (XP) e moedas**, humor (nota 1–5, texto e tags), ideias absorvidas, módulos opcionais". O app não computa streak nem aplica bônus — declarar "streak" é declarar dado que não existe. |
| **Data Safety — "compartilha com terceiros?"** | Não | Continua **Não**, com uma ressalva a registrar na política de privacidade: o **Conector** envia dados à Anthropic **só quando o usuário conecta e pergunta**, por OAuth que ele mesmo autoriza e revoga. A definição de "compartilhamento" da Play exclui transferências iniciadas pelo usuário em que ele espera que o dado vá — **[a confirmar na redação vigente]**; a nutrition label da Apple tem exclusão equivalente para dado enviado por escolha explícita do usuário — **[a confirmar]**. Em qualquer caso, a política de privacidade do site precisa de um parágrafo do Conector antes da submissão. |
| **Categoria / URLs / e-mail** | Lifestyle; `perceva.app/privacy`, `/en/privacy`; `contact@perceva.app` | Mantidos. |

---

## 6. Capturas de tela — roteiro de 8 frames

### 6.1 Especificação
- **Fonte:** build da Play (ou APK `preview`), **nunca Expo Go** (módulos nativos e barra do sistema diferem). Tema escuro (padrão). Idioma **pt-BR** para o conjunto principal; repetir o mesmo roteiro em **en-US** para a ficha EN (o site EN também é canônico).
- **Formato:** 1080×2400 PNG **sem alpha**, 8 arquivos (Play aceita 2–8; App Store até 10 — os dois extras estão em 6.3). Para a App Store, reexportar do mesmo layout em 1260×2736.
- **Layout do frame:** faixa superior (~18% da altura) em noite `#0A0E26` com a legenda em **Manrope Bold**, areia `#ECEAF6`, ≥ 72 px, no máximo 4 palavras por linha; filete violeta `#7B5CFF` sob a legenda; abaixo, a captura dentro de uma moldura de aparelho discreta (raio 24 px, sombra leve). Sem mãos, sem pessoas, sem emoji. Um frame, uma ideia.
- **Barra de status limpa:** modo demo do Android (Opções do desenvolvedor → Demonstração da IU do sistema): bateria cheia, sem notificações, relógio 08:00 (hora do resumo da manhã — detalhe que só o time nota, mas conta).
- **Conta populada antes de capturar** (fidelidade §3): 60+ dias de histórico em ~15 práticas; humor em ≥ 30 dias com tags e notas; Big Five e Apego concluídos (mais a Avaliação); ≥ 8 ideias absorvidas e 3 favoritas; recompensas com resgates espaçados (para o card "Sem resgatar"); Norte traçado; **nome de exibição real** — nunca "Perceva", nunca "Aventureiro(a)".
- **Antes da sessão de captura, quatro strings P1 do backlog de vocabulário** (chaves em `pt.ts` + 1 migration): `Vault` → `Cofre` no chip do calendário; `Sua colheita` → `Cofre` no hero de Recompensas; `Riqueza` → `Prosperidade`; `Criação` → `Ofício`. São as quatro palavras que a ficha nova usa e a tela velha contradiz; sem elas, os frames 3, 6 e 8 nascem infiéis à copy. É JS + uma migration curta — cabe num OTA antes de fotografar **[a confirmar se o dono quer segurar a captura por isso]**.
- **O que nunca aparece em legenda:** nível, XP, "sequência", Momentum, "Jornadas", "psicológico", preço, "em breve", Social.

### 6.2 Os 8 frames — história "teste primeiro, hábito depois"
A ordem é a mensagem de entrada da Marina em imagens: reconhece o teste (1–2), vê as seis áreas com nota (3), vê o teste virar prática (4), vê o espelho — o que ninguém mais entrega (5), vê que medir inclui humor (6), vê que aprender é curto e com fonte (7), vê que a recompensa é dela (8).

| # | Tela e estado a capturar | Legenda pt (3–5 palavras) | Legenda en | Precisa estar visível | Não pode estar visível |
|---|---|---|---|---|---|
| 1 | **Resultado do Big Five** — os cinco traços com nível, na conta com o teste concluído | Sabe teste de personalidade? | Know those personality tests? | os 5 traços e o nome do instrumento ("Big Five", "120 itens") | chip Premium bloqueando; qualquer "psicológico" |
| 2 | **/perfil** (ficha) — Avaliação, Big Five e Apego feitos; Valores e Forças com chip Premium; card "Sem resgatar" logo abaixo, se couber | Big Five, Valores, Apego, Forças | Big Five, Values, Attachment, Strengths | os quatro nomes legíveis; chips Premium honestos | DISC/Tipos em destaque (rolar para que fiquem fora ou abaixo — não recortar a interface) |
| 3 | **Eu › Percebida** — hexágono com nota nas seis áreas, self × questionário sobrepostos | Seis áreas, com nota | Six areas, each scored | os seis rótulos: Saúde · Corpo · Mente · Prosperidade · Vínculos · Ofício | "Riqueza"/"Criação" (ver 6.1) |
| 4 | **Hoje** — saudação com nome real, 5–7 práticas (2–3 marcadas, estrelas por área), faixa "Humor de hoje" respondida, selo de dia parcialmente fechado | O resultado vira prática | The result becomes practice | práticas com estrelas; humor do dia | lista vazia; "Aventureiro"; chips de Missões/Metas (módulos off — não aparecem) |
| 5 | **Eu › Praticada** — hexágono da Dedicação (30 dias) com o **contorno da percepção** sobreposto | Quem você está virando | Who you're becoming | contorno claramente diferente do hexágono (a diferença é a imagem) | período sem dados |
| 6 | **Calendário** — frente Humor, filtro aplicado (ex.: humor ≥ 4), espiada do dia aberta embaixo do grid | Humor e rotina, lado a lado | Mood and routine, side by side | chips Rotina · Humor · Cofre; funil com filtro ativo; painel do dia | chip "Vault" (ver 6.1) |
| 7 | **Uma ideia** — imagem 4:5 + texto; **card virado** com a afirmação, no fim | Uma ideia. Com fonte. | One idea. With sources. | fontes clicáveis ou a afirmação do card virado | — |
| 8 | **Recompensas › Cofre** — Loja com 4–6 recompensas precificadas (uma delas um deslize), carteira com saldo | Você define o preço | You set the price | itens com preço em moedas; título "Cofre" | "Sua colheita"; confete/celebração |

### 6.3 Extras só para a App Store (slots 9–10)
| # | Tela | Legenda pt | Legenda en |
|---|---|---|---|
| 9 | **Conector** — tela de Ajustes com URL e exemplos de pergunta ("como foi meu mês?", "há quantos dias…") | Seu assistente lê seus dados | Your assistant reads your data |
| 10 | **Minhas ideias** — pilha de revisão no meio de um swipe | Favorita ou solta | Favorite or let go |

O frame 9 carrega "(hoje, Claude)" em texto pequeno dentro da própria tela — a legenda não precisa repetir. Se a Apple pedir, "Claude" é produto de terceiro nomeado, não plataforma móvel concorrente.

### 6.4 Experimento de listagem (Play)
Rodar depois de 4–6 semanas de dados: variante B = ordem "hábito primeiro" (frames 4-5-1-2-3-6-7-8). Critério: conversão de ficha da B ≥ A com 90% de confiança **e** D1 sem queda. Só depois testar vídeo (§7.4).

---

## 7. Vídeo de prévia — roteiro mestre de 30 s

### 7.1 Regras
- **Só captura do app.** Sem mãos, sem pessoas, sem aparelho filmado, sem stock. É a regra da Apple para App Previews e é o que a espinha exige (tela grande, rosto pequeno fica para social — aqui, rosto nenhum).
- **886×1920** (retrato, iPhone 6,9"), H.264, 30 fps, 15–30 s. Captura Android em 1080×2400 (`adb shell screenrecord --size 1080x2400 --bit-rate 12M`) → redimensionar para 886 de largura (fica 1969 de altura) → cortar 24–25 px em cima e embaixo. Na Play, o vídeo entra como link do YouTube (não privado, sem monetização) **[a confirmar orientação aceita: retrato costuma valer]**.
- **Autoplay mudo → texto na tela.** Cada cena tem uma frase de 3–5 palavras, Manrope Bold, entrando nos primeiros 10 quadros; a trilha é opcional e nunca carrega informação. Sem locução na versão de loja; a versão com voz do fundador é derivada para Reels/TikTok.
- **Uma ação por cena, corte seco.** Nada de zoom, nada de transição.
- **Nunca no vídeo:** preço, "Baixe", "em breve", nível/XP em destaque, Momentum, Social, "psicológico".

### 7.2 Roteiro (pt-BR; texto en ao lado)
| Tempo | Tela e ação | Texto na tela (pt) | Text on screen (en) |
|---|---|---|---|
| 0:00–0:03 | Resultado do Big Five aparece (fade curto); dedo invisível — a tela já está pronta | Sabe teste de personalidade? | Know those personality tests? |
| 0:03–0:07 | /perfil rola devagar: Big Five · Valores · Apego · Forças, chips Premium honestos | Com nome. Não quiz. | Named. Not a quiz. |
| 0:07–0:11 | Eu › Percebida: hexágono desenha as seis áreas com nota | Seis áreas, com nota | Six areas, each scored |
| 0:11–0:16 | Hoje: duas práticas marcadas (estrelas, Dedicação sobe, moedas); um toque no humor do dia | Cada prática é um voto | Every practice is a vote |
| 0:16–0:20 | Eu › Praticada: o contorno da percepção cai sobre o hexágono da Dedicação; pausa de 1 s na diferença | Quem você está virando | Who you're becoming |
| 0:20–0:24 | Calendário: chip Rotina → Humor; filtro "dias ótimos"; espiada de um dia abre | Humor e rotina, lado a lado | Mood and routine, side by side |
| 0:24–0:27 | Uma ideia: rola até o fim; o card vira e mostra a afirmação | Uma ideia. Com fonte. | One idea. With sources. |
| 0:27–0:30 | Cartão final: glifo Perceva (Iris) sobre noite; tagline; nada mais | Perceba quem você está se tornando. | See who you're becoming. |

Quadro de pôster (App Store): 0:17, o contorno sobre o hexágono. É a frase de rua em imagem.

### 7.3 Versões derivadas do mesmo master
- **Reels/TikTok/Shorts 9:16** (1080×1920): mesmo corte + voz do fundador em janela pequena no canto, legenda queimada; gancho falado = texto do quadro 1.
- **Site**: 0:07–0:20 em loop mudo no hero (13 s).
- **Nomeação de featuring**: o master de 30 s, sem alterações (é um dos 5 URLs da Apple).

### 7.4 A regra: só entra na ficha depois de experimento de listagem
O ganho de vídeo na conversão é **contestado** (dossiê GTM 2.8): fornecedores de ASO publicam +16% a +40%; a própria Apple publicou o caso Simply Piano, em que a página **sem** vídeo venceu por 3% com 100% de confiança; guias independentes registram vídeo fraco derrubando 10–15%. Portanto: (1) gravar agora — o vídeo é obrigatório para social, imprensa e featuring; (2) lançar a ficha **sem** vídeo; (3) depois do experimento de screenshots (§6.4), rodar "com vídeo × sem vídeo" na Play (Experimentos de listagem) e, quando houver iOS, na Product Page Optimization da Apple; (4) manter o vídeo só se a conversão não cair e D1 se mantiver.

---

## 8. Featuring — texto pronto para colar

### 8.1 Google Play — formulário de nomeação
**Quando:** na **primeira semana de produção**. Para app novo o formulário pede **8 semanas** de antecedência e o app precisa ter lançado até **4 meses** antes da data de destaque desejada — o relógio começa no dia em que a listagem pública abre. Pré-requisitos: nota ≥ 3,0, AAB no console, ficha completa. Atender não garante destaque. Pedir a janela de 8 a 12 semanas após a produção; regiões: Brasil primeiro, depois "todas as regiões" para a ficha EN.

**Descrição do app (pt-BR):**
> O Perceva é um app de hábitos e autoconhecimento feito no Brasil, escrito nativamente em português e em inglês. Ele mede seis áreas da vida — saúde, corpo, mente, prosperidade, vínculos e ofício — e coloca no mesmo hexágono três retratos: como a pessoa se vê (autoavaliação e testes com nome: Big Five com 120 itens, Valores baseado em Schwartz, Apego baseado no ECR-R, Forças de caráter), o que ela pratica (práticas com Dedicação por área e moedas; pular é decisão, nada zera) e quem quer se tornar (um Norte por área). Traz check-in de humor com calendário e padrões de 90 dias; um Recanto de ideias curtas com fonte — imagem, texto, vídeo e áudio, com um card que vira para guardar a ideia; um Cofre de recompensas que a própria pessoa define e precifica; e um Conector que permite ao assistente de IA da pessoa (hoje, Claude) ler os dados dela por um protocolo aberto — só leitura, mais o humor do dia. Sem anúncios, sem SDK de analytics, exclusão de conta dentro do app.

**O que é único (pt-BR):**
> 1. Psicometria nomeada, hábitos e humor no mesmo hexágono — na Play Brasil, "hábitos" é território de rastreadores e "autoconhecimento" é de roda da vida e terapia; nenhum app fecha o ciclo. 2. Gentileza por arquitetura: não existe sequência punitiva; a Dedicação nunca cai; pular é uma decisão registrada. 3. Conector por protocolo aberto (MCP): o primeiro app de hábitos em português a entregar os dados do usuário ao assistente do próprio usuário, com escrita restrita ao humor do dia. 4. Bilíngue de verdade: cada ideia do Recanto é escrita nas duas línguas, não traduzida. 5. O Cofre responde "há quantos dias" — a recompensa como medida, não só como prêmio.

**Plano de marketing (pt-BR, 90 dias):**
> Semanas 1–2: listagem pública, site apontando para a ficha, registro do Conector nos diretórios MCP, esta nomeação. Semanas 3–8: vídeo curto founder-led em português (3–5 clipes/semana em quatro séries: a sensação mente; do teste à prática; uma ideia com fonte; bastidor honesto), Show HN do servidor MCP, pautas para Canaltech, Manual do Usuário, TechTudo e Hipsters Ponto Tech, 10–20 nano-influenciadores de psicologia baseada em evidências em permuta. Semanas 9–13: experimento de listagem (capturas, depois vídeo), collabs com criadores de psicologia, teste pago de R$ 3–5 mil só se conversão de ficha ≥ 12% e D7 ≥ 11%. Métrica-norte: pessoas com ao menos um registro por semana durante 8 semanas.

**Monetização:** freemium. Grátis: até 10 práticas ativas e 5 recompensas, Avaliação das seis áreas, Recanto completo. Perceva Premium (assinatura via Play Billing): R$ 14,90/mês ou R$ 99,90/ano; libera os quatro instrumentos profundos e limites maiores. Limites do grátis aplicados no servidor.

**Métricas de retenção / ARPDAU:** preencher com os números do console na data do envio **[a confirmar — hoje a base é de ~21 contas em teste fechado; não há métrica pública]**. Metas declaradas: D1 25–32%, D7 11–16%, D30 ≥ 8%.

**App description (en-US, same form if filed for the EN listing):**
> Perceva is a habits-and-self-knowledge app made in Brazil and written natively in Portuguese and English. It scores six areas of life — health, body, mind, wealth, bonds, craft — and lays three portraits on one hexagon: how you see yourself (a self-assessment plus named tests: Big Five with 120 items, Values based on Schwartz, Attachment based on the ECR-R, Character Strengths), what you actually practice (practices earn Dedication per area and coins; skipping is a decision, nothing resets) and who you want to become (a North per area). It includes a daily mood check-in with a calendar and 90-day insights; Learn, a set of short sourced ideas — image, text, video and audio, with a card you flip to keep the idea; a Vault of rewards you define and price yourself; and a Connector that lets your own AI assistant (Claude, for now) read your data over an open protocol — read-only, plus the day's mood. No ads, no analytics SDK, in-app account deletion.

**What's unique (en-US):**
> 1. Named psychometrics, habits and mood on the same hexagon — habit trackers count, personality apps describe; nothing closes the loop. 2. Kindness by architecture: no punitive streak exists; Dedication never drops; skipping is a recorded decision. 3. An open-protocol Connector (MCP): the user's own assistant reads the user's own data, with writes limited to the day's mood. 4. Genuinely bilingual: every idea is authored in both languages, never translated. 5. The Vault answers "how many days" — the reward as a measure, not just a treat.

### 8.2 Apple — nomeação de featuring (App Store Connect → Featuring → Nominations)
**Quando:** assim que houver build no TestFlight, com **≥ 3 semanas** de antecedência da data de lançamento. Tipo: **App Launch**. Papéis que podem enviar: Account Holder, Admin, App Manager ou Marketing. Campos: descrição detalhada, data de publicação, países, localizações, até **5 URLs** (TestFlight incluso), detalhes de acessibilidade, inclusividade e o que é único no app e no time.

**Países:** Brasil e Estados Unidos no lançamento; ficha em pt-BR e en-US. **Localizações:** pt-BR e en-US nativas — interface, catálogo e cada ideia do Recanto escritos em cada língua, com exemplos da cultura de cada uma; troca instantânea em Ajustes.

**5 URLs:** (1) TestFlight; (2) `https://perceva.app` / `https://perceva.app/en/`; (3) o vídeo master de 30 s; (4) a política de privacidade `https://perceva.app/privacy`; (5) página do Conector no registro MCP **[a confirmar após publicar no registry]**.

**Descrição detalhada (pt-BR):**
> O Perceva parte de uma ideia simples: você se torna aquilo que pratica. Ele não conta só o que a pessoa faz — mostra quem os hábitos dela estão treinando ela a ser. Seis áreas da vida com nota; três retratos no mesmo hexágono: como você se vê (autoavaliação e testes com nome — Big Five com 120 itens, Valores baseado na teoria de Schwartz, Apego em escala baseada no ECR-R, Forças de caráter — instrumentos de reflexão, não de diagnóstico), o que você pratica (práticas em um toque, Dedicação que nunca cai, pular como decisão) e quem você quer se tornar (um Norte por área). Um check-in de humor por dia e um calendário que mostra rotina, humor e recompensas lado a lado, com padrões em 90 dias e o aviso de que junto não é causa. Um Recanto de ideias com fonte — nunca mais de cinco por assunto; o Explorar acaba de propósito. Um Cofre em que a própria pessoa define e precifica as recompensas — e que, se a recompensa for um deslize, responde "há quantos dias". E um Conector que deixa o assistente de IA da pessoa (hoje, Claude) ler os dados dela, só quando ela pergunta.

**História do desenvolvedor (pt-BR):**
> O Perceva é feito por um desenvolvedor solo no Brasil, com o irmão como primeiro testador. Nasceu de duas frustrações: apps de hábito que punem o dia perdido e testes de personalidade cujo resultado para na tela. As decisões que definem o produto vieram do uso real: nunca existiu sequência punitiva; o próprio criador usa o Cofre para pôr preço num deslize e passou a olhar "há quantos dias" em vez de "quantas moedas"; o Conector existiu antes como ferramenta pessoal, para o assistente parar de dar conselho de revista e ler o mês de verdade. O app não tem SDK de anúncio nem de analytics; a fronteira dos dados é a conta da pessoa, e a exclusão é dentro do app.

**Acessibilidade e inclusividade (pt-BR):**
> Tema escuro por padrão, com a rampa de intensidade do calendário validada para contraste WCAG contra fundo e texto (a tinta de cada degrau foi escolhida pelo validador, não pelo gosto). Sem cronômetro, sem contagem regressiva, sem punição por ausência — o desenho reduz pressão por arquitetura, não por aviso. Registro em um toque; humor em três; nada exige texto. Compatibilidade com leitor de tela e escala dinâmica de fonte: **[a confirmar antes de enviar — não auditado nesta rodada]**.

**Detailed description (en-US):**
> Perceva starts from a simple idea: you become what you practice. It doesn't just count what you do — it shows who your habits are training you to become. Six life areas, each scored; three portraits on one hexagon: how you see yourself (a self-assessment and named tests — Big Five with 120 items, Values based on Schwartz's theory, Attachment on a scale based on the ECR-R, Character Strengths — instruments for reflection, not diagnosis), what you practice (one-tap practices, Dedication that never drops, skipping as a decision) and who you want to become (a North per area). One mood check-in a day and a calendar that shows routine, mood and rewards side by side, with 90-day insights and the reminder that "together" isn't "because". Learn: ideas with sources — never more than five per topic; Explore ends on purpose. A Vault where you define and price your own rewards — and, if the reward is a slip, it answers "how many days". And a Connector that lets your AI assistant (Claude, for now) read your data, only when you ask.

**Developer story (en-US):**
> Perceva is built by a solo developer in Brazil, with his brother as the first tester. It came out of two frustrations: habit apps that punish a missed day, and personality tests whose results stop on the screen. The product's defining decisions came from real use: there has never been a punitive streak; the creator uses the Vault to put a price on a slip and started reading "how many days" instead of "how many coins"; the Connector existed first as a personal tool, so the assistant would stop giving magazine advice and read the actual month. No ad or analytics SDK; the user's account is the data boundary, and deletion lives in the app.

**Accessibility and inclusivity (en-US):**
> Dark theme by default, with the calendar's intensity ramp validated for WCAG contrast against both background and text (each step's ink was picked by the validator, not by taste). No timers, no countdowns, no penalty for absence — pressure is reduced by architecture, not by disclaimers. Logging takes one tap; mood takes three; nothing requires typing. Screen-reader and dynamic-type support: **[to confirm before filing — not audited this round]**.

---

## 9. Diferenças entre pt e en (escolhas de palavra, não tradução)

| Conceito | pt-BR | en-US | Por quê a diferença |
|---|---|---|---|
| Título | hábitos e identidade | habits & identity | "&" é nativo em títulos EN e poupa dois caracteres. |
| Subtítulo | Autoconhecimento na prática | Self-knowledge in practice | Mesma tese; "in practice" é a locução idiomática, "na prática" idem. |
| Descrição curta | "seus hábitos" duas vezes | "your habits" duas vezes | Frase de rua verbatim nas duas; em EN "practices" na porta soaria estranho. |
| Lugar do Learning | **Recanto** | **Learn** (sem nome próprio) | EN não tem substantivo quente que passe em 2 s; "nook" é marca de e-reader. |
| Recompensas | **Cofre** | **Vault** | Nome próprio nas duas; "Vault" em PT saiu. |
| Correlações | **Padrões** | **Insights** | "Insights" é anglicismo evitável em PT e nativo em EN. |
| Áudio longo | mergulho em áudio | audio deep dive | "Deep dive" não passa em 2 s em pt-BR. |
| Desafio com prazo | **Missões** | **Quests** | "Quest" é jargão em PT; "Missions" soa militar em EN. |
| Escada / marca pessoal | faixas · recordes | tiers · personal bests | "Faixa" ecoa arte marcial; "PR" ficou fora da prosa EN. |
| Lembrete do meio-dia | toque ao meio-dia | midday nudge | "Checkpoint" saiu do PT. |
| Assistente | (hoje, Claude) | (Claude, for now) | Mesma ressalva; ordem idiomática. |
| Aviso de correlação | junto não é causa | "together" isn't "because" | Em EN a forma citada evita o par "correlation/causation", que soa de manual. |
| Área "craft" | Ofício (lazer e construir) | craft (play and build) | Glosa obrigatória em PT na primeira menção; em EN "craft" já cobre. |
| Instrumentos | Forças de caráter · Apego (escala baseada no ECR-R) | Character Strengths · Attachment (a scale based on the ECR-R) | Nome público de cada língua; "inspirado/baseado em" nas duas. |
| Keywords só de um lado | `disciplina` | `tracker` | "Disciplina" é o vocabulário do público terciário em pt-BR; "tracker" combina com "habits" do título EN. |
| Fecho | Comece pelas seis áreas. O resto é prática. | Start with the six areas. The rest is practice. | Idêntico por decisão da espinha. |

---

## 10. Diff contra o rascunho de 18/08 (`01-store-metadata.md` + `02-assets-spec.md`)

| Campo | Sai | Entra |
|---|---|---|
| Título (2 lojas) | `Perceva` com a versão longa "recomendada" | `Perceva: hábitos e identidade` / `Perceva: habits & identity` **fixados** |
| Subtítulo App Store | `Hábitos que constroem quem é` / `Habits that build who you are` | `Autoconhecimento na prática` / `Self-knowledge in practice` |
| Descrição curta Play | "Hábitos que constroem quem você quer ser. Treine, evolua e conheça-se melhor." | "Hábitos e autoconhecimento: veja quem seus hábitos estão treinando você a ser." |
| Texto promocional | "Cada hábito concluído é um passo… testes de autoconhecimento." | "Sabe teste de personalidade? O nosso faz o sério — Big Five, Valores, Apego — …" |
| Keywords pt | `habito,…,rpg,evoluir` (com `autoconhecimento`) | `−rpg −evoluir −habito −autoconhecimento` · `+teste +humor +apego +valores` |
| Keywords en | `habit,…,self-improvement,…,rpg,growth` | `−rpg −growth −habit −self-improvement` · `+test +mood +tracker +attachment +values` |
| Abertura da descrição | "app de hábitos e desenvolvimento pessoal… três pilares de identidade" | "app de hábitos e autoconhecimento… mostra quem os seus hábitos estão treinando você a ser… três retratos" |
| Áreas | "finanças"; "ofício" sem glosa | "prosperidade"; "ofício (lazer e construir)" |
| Instrumentos | "quatro inventários de autorreflexão" (sem nome) | Big Five (inspirado…, 120 itens) · Valores (baseado em Schwartz) · Apego (baseado no ECR-R) · Forças de caráter; Premium explícito; Avaliação grátis; DISC e Tipos "pra começar" |
| PRATICADA | "Sua constância vira Momentum… Aceite Jornadas (quests)" | "a Dedicação nunca cai. Pular também é decidir… fechar ontem hoje" + o contorno sobre o hexágono |
| DESEJADA | "Habilidades com faixas de progressão" | **Norte** (padrão); Habilidades desce para módulos opcionais |
| "O CICLO QUE FUNCIONA" | Treine / Ganhe / Resgate | removido; o Cofre ganha seção própria com "há quantos dias" |
| Seção nova | — | **HUMOR E CALENDÁRIO** (frentes, filtro, Padrões, "junto não é causa") |
| Aprender | "biblioteca de leituras curtas e visuais" | **O RECANTO**: 1–5 ideias, imagem + texto + fontes, vídeo/áudio em parte do catálogo, card que vira, Explorar acaba |
| Seção nova | — | **O CONECTOR** ("hoje, Claude"; lê; escreve só humor; desconecta quando quiser) |
| Seção nova | — | **MÓDULOS OPCIONAIS** (Missões, Metas, Habilidades, Minha Semana — desligados por padrão) |
| Notificações | "um resumo de manhã e um checkpoint… você escolhe os horários" | "três lembretes opcionais… toque ao meio-dia só se você não abriu o app" |
| Conta e dados | "Autenticação segura" | "sem anúncios, sem rastreamento, nenhum SDK de analytics. Entre com e-mail e código" |
| Grátis | — | "até 10 práticas ativas e 5 recompensas, a Avaliação das seis áreas e o Recanto inteiro" |
| Fecho | "Comece no Nível 1. O resto a gente cuida." | "Comece pelas seis áreas. O resto é prática." |
| Novidades | v1.0.0 com Momentum, Jornadas, "quatro inventários", "biblioteca de leituras" | versão de `app.json` (1.4.x) com retratos, humor/calendário, Recanto, Cofre "há quantos dias", testes nomeados, Conector |
| Age rating (IA) | "confirmar" | **Sim, com curadoria humana** |
| Data Safety | "XP, streak" | "Dedicação (XP) e moedas, humor, ideias absorvidas"; ressalva do Conector para a política de privacidade |
| Capturas (02-assets) | frame 1 "streak/momentum visível"; frames de Skills e Quests; "conta com streak alto" | 8 frames "teste primeiro, hábito depois"; Skills/Quests saem (módulos off); conta populada por humor, testes e ideias |
| Vídeo (02-assets) | "pular no v1" | gravar já (30 s, só app); ficha só depois de experimento de listagem |
| Categoria, classificação, URLs, e-mail de suporte | Lifestyle; 4+/Livre; `perceva.app/privacy`; `contact@perceva.app` | **mantidos** |

---

## 11. Pendências [a confirmar] antes de submeter
1. **Google Sign-In na build da Play** — abrir num Android, ver o botão, fazer um login. Se funcionar, a linha vira "Entre com Google ou com e-mail e código"; senão, fica como está.
2. **Compra de teste real no RevenueCat** — até lá, nenhum preço na ficha e nenhum "assine".
3. **DISC e Tipos** — a espinha recomenda rebaixar a "pra começar" (já é como a descrição os trata). Se o dono decidir escondê-los de toda peça pública, apagar a oração "pra começar, dois questionários rápidos e gratuitos (DISC e Tipos)" nas duas línguas (−68 / −64 caracteres, sem efeito no limite).
4. **Quatro strings P1** (Cofre, Prosperidade, Ofício, hero de Recompensas) antes da captura — ou aceitar recapturar depois.
5. **Nomes exatos das tags da Play** e a existência de uma tag de humor.
6. **Redação vigente** da política de IA generativa da Play e das definições de "compartilhamento" (Play) e de dado enviado por escolha do usuário (Apple) para o Conector; e o parágrafo do Conector na política de privacidade do site.
7. **Acessibilidade** (leitor de tela, escala de fonte) antes da nomeação da Apple.
8. **Métricas do console** para o formulário do Google, no dia do envio.
9. **Orientação de vídeo aceita pelo YouTube/Play** para o link de prévia.
