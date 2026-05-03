# RPG Tasks — modelo de 3 pilares (proposta)

> Documento de discussão. Captura a tese de produto antes de codar a próxima leva
> de features. Pra debater antes de virar realidade.

---

## 0. Filosofia geral

O hero do user é a **resposta a três perguntas diferentes sobre a mesma vida**:

1. **Como eu estou?** → Avaliação
2. **O que eu estou fazendo a respeito?** → Dedicação
3. **No que eu de fato fiquei melhor?** → Skills

São perguntas distintas que costumam ser embaralhadas em apps de habit tracker. Um app que só mede esforço (Habitica, Streaks) faz a pessoa achar que está bem porque "fez as tarefas". Um app que só mede sentimento (Daylio, mood trackers) deixa a pessoa parada em cima do próprio diagnóstico. Um app que só mede output (Strava, Strong) ignora o resto da vida.

A tese é que **os três são necessários e nenhum substitui o outro**:

| Pilar | Mede | Frequência | Tipo de verdade |
|---|---|---|---|
| Avaliação | Estado subjetivo / sentimento de vida | Lenta (semanal/trimestral) | Auto-narrativa |
| Dedicação | Esforço aplicado | Rápida (diária) | Comportamental |
| Skills | Capacidade real verificável | Episódica (quando você testa) | Objetiva |

Os três conversam: Dedicação **deveria** mover Avaliação ao longo de meses; Skills **deveriam** ser o resíduo durável do Esforço; Avaliação é o "porquê" que justifica o resto. Quando os três divergem (ex.: muito XP, mas Avaliação caindo), o app revela um desalinhamento que a pessoa sozinha não enxergaria.

**Princípio de design transversal**: cada pilar tem sua própria estética de feedback. Avaliação é contemplativa (gráfico amplo, edição cuidadosa). Dedicação é dopaminérgica (ding, +XP, level up, streaks). Skills é cerimoniosa (medalha, "top X%", PR novo). Confundir os três tons é o que torna habit trackers cansativos.

**Princípio social** (4º pilar futuro, mas já antecipado nas decisões de hoje): humano otimiza contra tribo. Ver o hero de outra pessoa, fazer quest junto e ser visto fazendo são amplificadores que multiplicam os três pilares. Tudo opt-in, sem leaderboard imposto — comparação forçada é veneno; comparação convidada é combustível.

---

## 1. Pilar **Avaliação** — o espelho

### Essência
A pergunta que esse pilar responde é "**como eu estou na minha vida agora?**". Não "o que estou fazendo", não "o que sei fazer" — só estou. É o pilar mais lento e o mais íntimo. Idealmente, tu olha pra ele e tem uma reação emocional, não cognitiva.

### Duas lentes deliberadamente diferentes

**Self-assessment** (já existe — hex tappable):
- Avaliação intuitiva, gut-check, em segundos.
- Barata de atualizar — pode mudar quando quiser.
- Vulnerável a viés (humor do dia, autoengano, dia bom = nota inflada).
- Função: pulso emocional rápido. Tipo um diário de uma régua só.

**Questionário** (a construir):
- Avaliação estruturada, periódica (sugestão: a cada 30/60/90 dias).
- Baseada em instrumentos validados (Wheel of Life, WHO-5, PERMA, escalas de satisfação de vida usadas em RH e psicologia positiva).
- Mais cara — leva 10-15 min, então é um ritual, não um toque.
- Cada questão tem peso e mapeia pra um sub. Score 0-5 por sub é derivado, não escolhido.
- Função: âncora objetiva contra a qual o self-assessment pode ser checado.

### Por que duas lentes
A **diferença** entre as duas é o sinal mais valioso. Se você se dá 5 em "circle" mas o questionário dá 2, alguma coisa interessante está acontecendo (negação? padrão alto? dia ruim?). O hex pode renderizar as duas sobrepostas — shape sólido = self, outline = questionário — e o gap visual conta uma história sozinho.

### Output esperado
- Snapshot atual nos 12 subs (já temos).
- Histórico em timeline (`assessment_log` já guarda) — sparkline por sub mostrando se você está subindo, parado ou caindo.
- Sugestão suave: "tua nota em sleep caiu 3 pontos em 60 dias — quer criar uma quest?" (link explícito Avaliação → Dedicação).

### Filosofia de UX
Esse pilar **não pode ser viciante**. Não tem streak, não tem badge, não tem confete. É um momento de pausa. Visual amplo, hex grande, tipografia respirando. Quando o user entra, deveria ser parecido com sentar pra escrever uma página de diário — não com abrir Instagram.

---

## 2. Pilar **Dedicação** — o esforço

### Essência
Pergunta: "**o que eu estou fazendo, hoje e essa semana, sobre cada dimensão da minha vida?**". É o pilar do *agir* — onde a vida vira ação concreta. Honesto sobre uma coisa: ele mede **esforço, não resultado**. Você ganha XP por aparecer, não por colher.

### Mecânica em duas escalas
**Tasks** (curto prazo): unidade atômica do esforço. Daily/weekly/monthly/one-shot. Granularidade fina, recompensa imediata (XP + coins na hora).

**Quests** (médio prazo): conjunto de tasks com deadline e recompensa em bloco. Granularidade grossa, recompensa diferida. É onde ambição entra. "Correr 50km esse mês" não é uma task — é uma quest que se nutre de tasks.

A divisão importa: tasks dão dopamina diária, quests dão sentido. Sozinhas, tasks viram checklist sem alma; quests sozinhas viram metas vazias sem comportamento de suporte.

### XP, coins, streak
- **XP** é a moeda do esforço — acumula pra sempre, nunca perde, nunca cai. É o "diário de presença" da sua vida.
- **Coins** é XP fungível — converte de volta em vida via Rewards. Atalho deliberado pra evitar burnout: se você só acumula sem gastar, o jogo vira tirano.
- **Streak** é o sinal de continuidade — não pune (não some seu XP), só celebra.

### Filosofia
**Ação precede sentimento.** Você não espera estar motivado pra agir; você age, e a motivação aparece. Esse pilar é o que faz a pessoa atravessar dias ruins — porque "fechar a tarefa" é um contrato consigo mesmo que não depende de como você se sente.

Por isso aqui é onde a gamificação fica pesada: notificação, número subindo, level up, ding. É proposital. Esse é o pilar barulhento, e tudo bem que seja.

### Conexão com os outros
- Cada task/quest pode marcar uma dimensão e/ou um sub → Dedicação alimenta XP por dimensão → ranking interno de pra onde sua vida está se movendo.
- Quest pode ter requirement de skill ("chegue a 30 push-ups") → Dedicação cria a estrutura, Skills certifica que aconteceu.
- Movimento sustentado em Dedicação **deveria** mover Avaliação. Se não move, o set de tasks está mal-calibrado pra vida real do user.

---

## 3. Pilar **Skills** — a capacidade real

### Essência
Pergunta: "**no que eu objetivamente fiquei melhor?**". É o pilar mais raro de aparecer em apps do gênero, e talvez o mais importante a longo prazo. Esforço sem skill é hamster wheel; skill sem esforço é talento desperdiçado; os dois juntos são o que destrava progresso real.

### Catálogo + custom
- **Catálogo** (push-ups, corrida, meditação, leitura, etc.): skills universais com tiers ancorados em **percentis populacionais adultos**. Bronze ≈ acima da média. Silver ≈ top 25%. Gold ≈ top 10%. Master ≈ top 1-3%. Isso dá referência objetiva contra a humanidade — tu não está só competindo contigo.
- **Custom**: a vida é tua. Quer rastrear "minutos de violão" ou "linhas de código abertas em projeto pessoal", cria. Sem percentis, mas com mesma mecânica de PR e tiers locais.

### Por que ancorar em percentil populacional
O dado de "top X%" é o que transforma o número de uma planilha pessoal num **rank inteligível**. "Faço 40 push-ups" não significa nada pra ninguém. "Top 15% dos adultos em push-ups" significa muito. Isso ataca o problema de auto-medição: sem âncora externa, fica fácil ou achar que é deus ou achar que é ninguém.

### PRs e medalhas
- Skill log é **append-only e imutável**. Você só sobe.
- Medalhas só podem ser **ganhas**, nunca perdidas. Mesmo que você pare, o que você atingiu permanece.
- Diferente de XP (que premia presença) e Self-assessment (que flutua), medalhas são o **registro durável** do que você se tornou.

### Filosofia
Skills é o pilar que separa "eu estou tentando" de "eu fiquei melhor". É também o que protege o app de virar teatro: dá pra fingir que tá indo bem em Avaliação (auto-engano) e em Dedicação (clicar tarefas mecanicamente), mas não dá pra fingir um PR de corrida.

Por isso o tom dele é **cerimonioso, não dopaminérgico**. Ganhar uma medalha é um momento — tela de unlock, animação dedicada, talvez compartilhável. Não é "+50 XP, pong, próximo".

### Conexão com os outros
- Cada skill aponta pra uma dimensão → contribui pra leitura visual no hero.
- Skills podem ser usadas como requirement de quest → fechar o ciclo Dedicação ↔ Skills.
- Em algum momento, Skills é o que o user vai mostrar pros outros (degrau social abaixo).

---

## 4. Pilar futuro: **Social** — a tribo

### Essência
Pergunta: "**quem está comigo, e como a vida deles e a minha conversam?**". Não é um pilar em pé de igualdade ainda — é um amplificador dos outros três. Mas merece ser pensado desde já porque toca schema, privacidade, e é a coisa que torna o app pegajoso a longo prazo.

### Três faces
1. **Ver** — perfil público read-only de outro hero (mesmos 3 pilares dele, se ele consentir tornar visível). Não é leaderboard. É retrato.
2. **Fazer junto** — quests em grupo. Pode ser pooled ("juntos somamos 200km") ou per-member ("cada um corre 50km"). Recompensa compartilhada ou individual.
3. **Empurrar** — encorajamento leve, não invasivo. Reagir a uma medalha de amigo. "Visto" sutil quando alguém completa quest. Sem chat — não é mais uma rede social.

### Princípios duros
- **Opt-in em tudo.** Default = privado. Você escolhe ser visível, escolhe aceitar amigo, escolhe participar de quest.
- **Sem comparação forçada.** Nada de leaderboard global. Nada de "ranking de amigos". Comparação só quando o user vai buscar.
- **Sem feed.** O app não tenta ser Instagram. Você abre porque quer ver alguém específico, não pra rolar timeline.
- **Bonds já existe como dimensão.** Adicionar social é coerente com a tese do app ("relacionamentos são dimensão de vida"), não bolted-on.

### Por que pensar agora mesmo sem implementar
Decisões de schema feitas hoje sem essa lente são caras de reverter:
- `quest.character_id` único hoje vs. `quest_party(quest_id, member_id)` futuro.
- Reads de profile assumindo `id = auth.uid()` vs. profile público com flag.
- Identificador de usuário (`@handle`) que hoje não existe mas vai precisar pra link de perfil.

Não precisa implementar — só não cravar contra.

---

## 5. Visão de produto: como os pilares se conectam

```
                     ┌──────────────────────┐
                     │     AVALIAÇÃO        │  ← "como estou"
                     │  (self + quiz)       │
                     └──────────┬───────────┘
                                │ dispara
                                │ "sleep caiu, quer criar quest?"
                                ▼
        ┌──────────────────────────────────────────┐
        │             DEDICAÇÃO                    │  ← "o que faço"
        │      (tasks → XP → quests → coins)       │
        └────────────┬─────────────────────────────┘
                     │ produz, ao longo do tempo
                     │ PRs reais
                     ▼
                ┌──────────────┐
                │    SKILLS    │  ← "no que melhorei"
                │  (medalhas)  │
                └──────┬───────┘
                       │ certifica
                       │ progresso real
                       ▼
                  ┌─────────┐
                  │ SOCIAL  │  ← amplificador
                  │ (futuro)│
                  └─────────┘
```

A flecha que **falta hoje** no app é a de Avaliação → Dedicação ("seu sub X caiu, sugerimos uma quest"). É o feedback loop que transforma o app de tracker em **conselheiro suave**.

---

## 6. Sequência de execução (proposta, debatível)

| # | Frente | Risco | Bloqueia o quê |
|---|---|---|---|
| 0 | Mergear branch atual (migration de `assessment_log` + leitura por source) | Baixo | Tudo de Avaliação |
| 1 | Refatorar Hero em 3 cards de pilar (cosmético + roteamento) | Baixo | Onboarding mental do user nos pilares |
| 2 | Construir o Questionário (schema + fluxo + RPC) | Médio | Lente "objetiva" de Avaliação |
| 3 | Mostrar percentil populacional em Skills (já tem dado) | Baixo | Sensação de rank objetivo |
| 4 | Loop Avaliação → sugestão de quest | Médio | Conselheiro suave |
| 5 | Social v0 (perfil público + amigos + party quest) | Alto | Tudo que é multi-user |
| 6 | Histórico de Avaliação visualizado (sparkline em sub) | Baixo | Storytelling de longo prazo |

---

## 7. Pontos abertos pra debate

- A divisão dos 3 pilares parece forte ou tem sobreposição?
- Avaliação ter duas lentes (self + quiz) faz sentido, ou é over-engineering pra v0?
- Quest em grupo: pooled ou per-member como default?
- Tom de cada pilar (contemplativo vs. dopaminérgico vs. cerimonioso) — concorda ou achas que devem ser todos consistentes?
- Algum 4º pilar que falta? (Ex.: "Ritmo" — sleep/energia/hábitos passivos. Hoje virou sub do Health, mas pode ser que mereça destaque.)
