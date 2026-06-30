# Perceva V3 — Auditoria + Handoff de Ação (2026-06-30)

> **Para o Claude Code do André.** Este doc é auto-contido: traz o contexto
> necessário (specs/decisões que vivem fora do repo) + os achados da passada
> rápida do Artur + ações concretas. Onde marcado **✅ Pode atuar**, prossiga
> com a varredura completa e a correção/implementação se **não for mudança
> crítica que possa quebrar algo já em produção**. Onde marcado **⛔ Requer
> Artur**, só investigue/proponha — não aplique sem o sinal verde dele.

## Como usar este doc
1. Leia "Contexto embutido" — são fatos/decisões que não estão no `CLAUDE.md`.
2. Vá por área (1–5). Cada item tem: **status**, **evidência**, **ação** e
   (quando aplicável) **critério de aceite** + **guardrails**.
3. Respeite a "Linha de corte ✅/⛔" abaixo — é a regra que o Artur definiu.

## Linha de corte — o que pode atuar vs. o que espera o Artur
**✅ Pode atuar (não-crítico, baixo risco de quebrar produção):**
- Mudanças JS/TS de front-end (telas, hooks, componentes, copy/i18n).
- Correções de bug claras e isoladas, sem migration.
- Investigação/varredura profunda de qualquer área (ler à vontade).
- Documentar/versionar processos (ex: pipeline do Learn) sem rodar em massa.
- Disparar `eas build` (rebuild nativo) — não altera dado.

**⛔ Requer sinal do Artur antes de aplicar:**
- Qualquer **migration nova** (push no Supabase compartilhado) — especialmente
  RLS/RPC que mexem em insert/enforcement (podem trancar usuário fora).
- Mudança de **balance**: curva de nível, multiplicadores de Momentum/streak.
- Scripts de **correção de dado vivo** (XP/coins já creditados).
- Alterar qualquer uma das **5 decisões fechadas de subscription tiers**.

## Legenda
🔴 Bug confirmado · 🟡 Risco a verificar · ⚪ Não implementado · 🟢 OK · 🔵 Precisa aprofundar

## Backlog priorizado (visão rápida)
| # | Item | Status | Ação | Risco |
|---|---|---|---|---|
| 1a | Threshold de nível não recalibrado vs curva nova | 🟡 | ⛔ propor recalibração (balance + dado vivo) | alto |
| 1b | `complete_task`: agregação XP + streak consistente | 🔵 | ✅ investigar; aplicar fix só se não-breaking | médio |
| 1c | `confirmCompletion.ts` curva antiga | ✅feito | — (corrigido nesta passada) | — |
| 2 | Pipeline de automação do Learn não versionado | ⚪/🔵 | ✅ versionar/documentar o processo | baixo |
| 3 | Notificações não disparam | 🔵 | ✅ investigar runtime + rebuild nativo | baixo |
| 4 | Subscription tiers (spec inteira) | ⚪ | front-end ✅ · migration/RLS/RPC ⛔ | alto |
| 5a | Skills CRUD polishing | 🔵 | ✅ varrer + polir | baixo |
| 5b | Bugs transversais de scroll/botão fixo | 🔵 | ✅ varrer call sites + corrigir | baixo |
| 5c | CLAUDE.md desatualizado | 🟡 | ✅ atualizar no PR de fechamento da Phase 1 | baixo |

---

# Contexto embutido (não está no repo)

### C1 — Curva de XP/coins (rebalance já aplicado)
| Estrelas | XP/Coins (NOVA, atual) | XP/Coins (antiga) |
|---|---|---|
| 1★ | 10 | 5 |
| 2★ | 20 | 15 |
| 3★ | 35 | 40 |
| 4★ | 55 | 100 |
| 5★ | 80 | 250 |

`XP = Coins`. Fonte de verdade dupla, **já consistente**: cliente
`app/lib/xp.ts` (`REWARD_BY_DIFFICULTY`) + servidor `public.base_xp_for_stars`
(migration `20260528000001_xp_curve_rebalance.sql`). **Não mexer na curva por
estrela** — está certa nos dois lados.

### C2 — Notificações (spec de implementação)
| Notificação | Horário | Condição |
|---|---|---|
| Daily Brief | configurável, padrão 8h | sempre dispara |
| Checkpoint | 12h30 fixo | só se o usuário NÃO abriu o app hoje |

Estrutura: `app/lib/notifications/` (`index/permissions/scheduler/session/constants` + `useNotificationsSetup`). Boot via `AppState` no `_layout.tsx`. Deps `expo-notifications` + `expo-device`.

### C3 — Subscription Tiers (spec FECHADA — não alterar as decisões)
| Decisão | Resolução |
|---|---|
| Onde mora o tier | coluna `profile.subscription_tier text not null default 'free'` + CHECK. Tabela `subscription` separada só quando entrar gateway real. |
| Limites free | 10 tasks ativas · 5 rewards ativas · 3 skills · 3 quests ativas (arquivado não conta) |
| Enforcement | híbrido: RLS de insert + checks inline nas RPCs `start_task_from_template`, `start_quest_from_template`, `start_custom_quest`, `create_custom_skill` |
| UX do bloqueio | tap-to-modal; badge contador a partir de ≥80%; sem bloqueio preemptivo |
| Como vira premium | manual via Supabase Studio durante o beta |

### C4 — V3 em uma frase
App repositionado em 3 pilares de identidade: **Percebida** (como se vê hoje),
**Praticada** (o que as ações treinam — Dedicação/XP + Momentum), **Desejada**
(quem quer se tornar — Skills + Metas). Tour pós-login (M0–M6 + wrap) já em
produção. Rename de UI: Quests→**Missões**, Goals→**Metas**.

---

# 1. XP / Dedicação

## 1a — 🟡 Threshold de nível não recalibrado *(causa provável do "nível geral errado")* — ⛔ Requer Artur
**Evidência:** `app/lib/xp.ts` — fonte única do nível. `xpForLevel(level) = (level-1)² × 100`; inverso `level = floor(sqrt(xp/100)) + 1` (nível 1=0, 2=100, 3=400, 4=900, 5=1600 XP). A migration de rebalance só trocou `base_xp_for_stars` — **a curva de nível ficou intacta**, calibrada pras recompensas ~3× maiores da curva antiga.

**Diagnóstico:** XP por sub e XP total acumulam certo; o nível é computado certo *matematicamente*. Mas com a curva nova (5★=80 em vez de 250) o usuário sobe de nível **~3× mais devagar**. O sintoma "nível geral errado" é calibração, não bug de cálculo.

**Ação (⛔ propor, não aplicar):** decidir com o Artur entre (a) reduzir o `100` base e/ou suavizar o expoente da curva de nível pra casar com a curva 10–80, ou (b) confirmar que o leveling lento é intencional. Mudar a curva **altera o nível exibido de todo usuário existente** → mudança sensível.
- Se for atuar: a fórmula é puramente client-side (deriva de `character.total_xp`), então **não precisa migration** — é editar `xp.ts`. Mas é **balance** → só com aprovação.
- Sugestão de ponto de partida pra discussão (não aplicar ainda): base `40` em vez de `100` aproxima o ritmo de leveling do que era com a curva antiga. Validar com simulação antes.

## 1b — 🔵 `complete_task`: agregação de XP total + consistência do streak — ✅ Pode investigar
**Ação:** ler `complete_task` (migrations `20260514000002_complete_task_momentum_bonus.sql` e `20260517000002_task_completion_template.sql`) linha a linha e confirmar: (1) como agrega XP total a partir dos `base_xp_for_stars` por sub; (2) se `streak_multiplier` é aplicado de forma consistente entre o total e os subs; (3) cruzar `character_dimension` vs `character_sub_score`/`assessment_log` nas telas `profile-mirror.tsx`, `dimension/[id]`, `sub/[id]` (não misturar XP de prática com score percebido).
- Investigação é ✅. **Aplicar correção na RPC = migration ⛔** (revisar com Artor antes do push). Correção só em tela (front) = ✅.
- Item de feature relacionado, fora de fix pontual: "window-based reads" da Dedicação (pendência citada no `CLAUDE.md`).

## 1c — ✅ FEITO nesta passada — `confirmCompletion.ts`
`app/lib/util/confirmCompletion.ts` tinha a curva antiga hardcoded (`5★→250`, `4★→100`). Corrigido pra `80`/`55`. **Obs:** `maybeConfirmHardCompletion` é **dead code** (sem callers) e a string é **hardcoded em inglês** (gap de i18n). Se for mexer, considerar i18n-ificar ou remover a função.

---

# 2. Automação dos artigos da aba Learn — ⚪/🔵 — ✅ Pode atuar (versionar/documentar)
**Evidência:** o **conteúdo** está versionado em ≥10 migrations `supabase/migrations/*_learning_*` (`learning_foundation`, `learning_seed_glossary`, `learning_takeaways`, `learning_publisher_infra`, `learning_validation_content`, `learning_strength_prose_rewrite`…). **Não existe** `supabase/functions/` nem script de extração/ingestão versionado (`app/scripts/` só tem `export-perceva-icons.mjs` e `reset-project.js`).

**Conclusão:** o destino (tabelas + seeds) está no git, mas o **pipeline que gera os seeds** (a extração/upload que o André roda via Claude) **não é repetível pelo time** — só por quem rodou.

**Ação (✅):** como esse pipeline é seu (André), versionar/documentar o processo é o trabalho mais valioso aqui — um script em `scripts/` ou Edge Function em `supabase/functions/` + um `docs/learning-pipeline.md` explicando como gerar a próxima leva. **Não rodar ingestão em massa nem recriar conteúdo** sem alinhar com o Artur — só tornar o processo repetível.

---

# 3. Notificações (Daily Brief / Checkpoint) não disparando — 🔵 — ✅ Pode atuar
**🟢 O código está presente e correto** (a hipótese de "nunca commitado" é falsa):
- `app/lib/notifications/` completo (6 arquivos, incl. `useNotificationsSetup.ts`, chamado no `RootLayout`).
- `scheduler.ts` usa a **sintaxe nova SDK 51+**: `Notifications.SchedulableTriggerInputTypes.DAILY` (Daily Brief) e `.DATE` (Checkpoint). Não usa a antiga sem `type`.
- `package.json`: `expo-notifications ~0.32.17` + `expo-device ~8.0.10`. `app.json`: plugin `expo-notifications` presente.

**Ação (✅ investigar + corrigir não-breaking):**
1. **Causa #1 (provável): módulo nativo precisa de `eas build`.** Se o APK atual recebeu só OTA (`eas update`), o módulo nativo de notificações pode não estar ativo. Confirmar a data do último `eas build --profile preview` vs. quando as notificações entraram. Se for o caso, **disparar um rebuild** (✅, não altera dado).
2. Confirmar agendamento em runtime: `getAllScheduledNotificationsAsync()` num device, logar. Permissão concedida? (`permissions.ts`).
3. Auditar a ordem no boot (`session.ts`/`useNotificationsSetup.ts`): registra "open de hoje" → agenda Checkpoint → cancela Checkpoint. Garantir que o Checkpoint não é cancelado **antes** de ser agendado (corrida de ordem). Fix aqui = JS, ✅.
4. Android Doze / otimização de bateria — teste manual em device, não é código.

**Critério de aceite:** Daily Brief dispara no horário configurado; Checkpoint dispara 12h30 **só** quando o app não foi aberto no dia.

---

# 4. Subscription Tiers — ⚪ nada implementado — front-end ✅ / backend ⛔
**Evidência:** `grep subscription_tier` em todo o repo (`app/` + `supabase/`, incl. `subscriptionTier`) → **0 ocorrências**. Coluna não existe; nenhuma RLS/RPC/tela referencia tier. **A spec inteira (C3) está por implementar.**

**Ação — dividir por risco:**
- **⛔ Requer Artor (migration + enforcement):** migration adicionando `profile.subscription_tier text not null default 'free'` + CHECK; RLS de insert e os 4 checks inline nas RPCs (`start_task_from_template`, `start_quest_from_template`, `start_custom_quest`, `create_custom_skill`). RLS de insert mal calibrada **tranca o usuário fora** → revisar com Artur antes de qualquer push. Pode **escrever a migration e abrir PR pra revisão**, mas não dar push direto.
- **✅ Pode atuar (front-end, não-breaking):** hook que lê o tier + conta ativos por entidade; modal de bloqueio (tap-to-modal); badge contador a partir de ≥80% nas 4 telas (tasks, rewards, skills, quests). Pode construir contra um tier mock/local enquanto a coluna não existe, atrás de um flag, sem quebrar nada.
- **Antes de implementar:** reconferir tamanho atual de `task_template`/`reward_template` — se mudaram desde a spec, os limites (10/5/3/3) podem precisar revisão (decisão do Artur).
- **Não alterar as 5 decisões da C3.**

---

# 5. Polish geral (Phase 1)

| # | Item | Status | Ação |
|---|---|---|---|
| 2 | `released_at`/`version` em template tables | 🟢 saiu (`20260513000001_template_released_at.sql`) | — |
| 3 | Nav Profile→Settings, tab Learning, History em Tasks | 🟢 saiu | — |
| 4 | Auditoria PT/EN + glossário | 🟢 feito (PRs #251/#252; paridade 969 chaves) | — |
| 5 | Skills CRUD polishing | 🔵 | ✅ varrer `skills.tsx`/`skill-form.tsx`/`skill/[id]` e polir o que faltar (UI, não-breaking) |
| 6 | Rewards visual polish | 🟢 Vault redesign saiu | — |
| 7 | Bugs transversais scroll/botão fixo | 🔵 | ✅ varrer todos os call sites de `useBottomNavClearance()`/`useBottomSafeClearance()` e corrigir sobreposições (UI, não-breaking) |

Rebrand Perceva: 🟢 saiu (app.json name, login/onboarding, `PercevaGlyph`, ícones).

---

# Gaps de contexto / notas pro André
1. **Muita coisa que parecia pendente JÁ ESTÁ feita:** notificações (implementadas+wired), curva de XP (cliente+servidor), Quests→Missões/Goals→Metas (UI/i18n), tour pós-login completo (M0–M6 + wrap + replay), rebrand Perceva. Não re-investigar do zero.
2. **CLAUDE.md desatualizado (✅ atualizar):** o roadmap V3 ainda lista só os 7 itens originais e diz "App name: stays RPG Tasks" (já é Perceva no `app.json`). Não cita notificações, curva nova, rename, tour, nem subscription tiers. Atualizar no PR de fechamento da Phase 1 — é doc, não-breaking, pode atuar.
3. **Bug do tour em cold boot — JÁ CORRIGIDO** (PR #253 + OTA preview): `useTourReady` reportava "ready" com estado defasado durante a hidratação no boot → o AuthGate jogava no tour todo cold start. Resolvido derivando o ready direto do store. Não re-investigar.
4. **Dívida de i18n residual (baixa prioridade):** `confirmCompletion.ts` (dead code) + componentes dead-code `QuestChip.tsx` e `modal.tsx` têm strings hardcoded em inglês.

# Fixes aplicados nesta passada (passada rápida do Artur)
- `app/lib/util/confirmCompletion.ts`: curva antiga `250/100` → `80/55`.

Sem migration, sem balance, sem tocar nas decisões fechadas.
