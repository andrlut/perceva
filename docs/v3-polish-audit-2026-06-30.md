# Varredura Rápida — Perceva V3 (2026-06-30)

> Passada 1 (rápida/barata): greps + leituras pontuais. Só fixes triviais de
> arquivo único, sem migration. Tudo que exige aprofundamento fica 🔵 pro
> André. Base: `perceva-v3-audit-scan.md`.

## Legenda
- 🔴 Bug confirmado · 🟡 Risco a verificar · ⚪ Não implementado · 🟢 OK · 🔵 Precisa aprofundar

## Resumo executivo
| Área | Status |
|---|---|
| 1. XP/Dedicação | 🟢 curva por estrela (cliente+servidor) correta · 🟡 **threshold de nível não recalibrado** (causa provável do "nível geral errado") · 🔴 1 valor antigo hardcoded em dead code (corrigido) |
| 2. Learn automation | ⚪/🔵 conteúdo versionado via migrations; **pipeline de automação NÃO está no repo** |
| 3. Notificações | 🟢 código presente e com API correta · 🔵 "não dispara" → provável rebuild nativo / runtime (precisa device) |
| 4. Subscription tiers | ⚪ **nada implementado** (coluna não existe) |
| 5. Phase 1 polish | majoritariamente 🟢 (saiu) · alguns 🔵 |

---

## 1. Cálculo de XP/Dedicação

**🟢 Curva por estrela está correta e consistente nos dois lados.**
- Cliente: `app/lib/xp.ts` → `REWARD_BY_DIFFICULTY` = `10/20/35/55/80` (1★→5★), XP = coins.
- Servidor: `public.base_xp_for_stars` rebalanceada na migration `supabase/migrations/20260528000001_xp_curve_rebalance.sql` → mesmos `10/20/35/55/80`. As RPCs (`complete_task`, momentum bonus, template completion) consomem o helper, então não há tabela duplicada pra escapar.
- Grep por `250`/curva antiga no código ativo: só sobra um comentário em `xp.ts` (intencional) — ver o 🔴 abaixo.

**🔴 (corrigido nesta passada) `app/lib/util/confirmCompletion.ts`** tinha a **curva antiga hardcoded** numa mensagem de confirmação: `5★ → "250 XP / 250 coins"`, `4★ → "100 XP / 100 coins"`. Corrigido pra `80` e `55`.
- ⚠️ Contexto importante: **essa função (`maybeConfirmHardCompletion`) não tem nenhum caller** — é dead code, então a mensagem errada nunca aparecia pro usuário. O fix é só pra não deixar valor errado caso seja religada.
- ⚠️ Também é uma **string hardcoded em inglês** (não passa pelo i18n). Fica anotado como gap (ver "Gaps de contexto").

**🟡 Threshold de nível NÃO foi recalibrado junto com a curva — causa mais provável do sintoma "nível geral errado".**
- Fonte única: `app/lib/xp.ts`, `levelProgress` / `xpForLevel`. Fórmula: `xpForLevel(level) = (level-1)² × 100`; inverso `level = floor(sqrt(xp/100)) + 1` (nível 1=0, 2=100, 3=400, 4=900, 5=1600 XP).
- A migration de rebalance só trocou `base_xp_for_stars` — **a curva de nível ficou intacta**, calibrada pra recompensas ~3× maiores (curva antiga, 5★=250). Com a curva nova (5★=80), o XP total acumula certo e o nível é computado certo **matematicamente**, mas o personagem sobe de nível **bem mais devagar** do que na época da curva antiga. Isso bate com "XP por sub OK, mas nível geral parece errado/travado".
- **Não corrigido de propósito**: é decisão de balance + mexe no nível exibido de todo usuário existente (dado vivo). Não é fix trivial.
- 🔵 Pro André/Artur decidirem: recalibrar o `100` base da curva de nível (e/ou o expoente) pra casar com a curva 10–80, OU confirmar que o leveling lento é intencional.

**🔵 Aprofundar (pro doc do André):** ler `complete_task` linha a linha (agregação XP total a partir dos subs + consistência do `streak_multiplier` entre total e subs); cruzar `character_dimension` vs `character_sub_score`/`assessment_log` nas telas (`profile-mirror`, `dimension/[id]`, `sub/[id]`); a pendência "window-based reads" da Dedicação.

---

## 2. Automação dos artigos da aba Learn

**⚪/🔵 Conteúdo versionado, automação NÃO.**
- O conteúdo da Learn vive em **migrations SQL versionadas** (≥10 arquivos `*_learning_*` em `supabase/migrations/`, incl. `learning_foundation`, `learning_seed_glossary`, `learning_takeaways`, `learning_publisher_infra`, `learning_validation_content`, `learning_strength_prose_rewrite`…). Há inclusive `learning_publisher_infra` (estrutura de publicação no DB).
- **Não existe `supabase/functions/`** (nenhuma Edge Function) e **nenhum script de extração/ingestão** versionado (`app/scripts/` só tem `export-perceva-icons.mjs` e `reset-project.js`).
- **Conclusão:** o destino (tabelas + seeds) está no git, mas o **pipeline que gera esses seeds** (extração/upload que o André roda via Claude) **não é repetível pelo time hoje** — só pela pessoa que rodou. Esse é o achado principal da seção.
- 🔵 Conversa a ter com o André pra formalizar/versionar o processo. **Nada recriado nesta passada** (conforme instrução).

---

## 3. Notificações (Daily Brief / Checkpoint)

**🟢 Implementação está presente e o código parece correto** — a hipótese do scan ("nunca commitado") está **incorreta**.
- `app/lib/notifications/` existe com `constants.ts`, `index.ts`, `permissions.ts`, `scheduler.ts`, `session.ts` **+ `useNotificationsSetup.ts`** (6 arquivos; o hook de boot está incluso e é chamado no `RootLayout`).
- `scheduler.ts` usa a **sintaxe nova (SDK 51+)**: `Notifications.SchedulableTriggerInputTypes.DAILY` (Daily Brief, hour/minute) e `.DATE` (Checkpoint). **Não** usa a sintaxe antiga sem `type`.
- `package.json`: `expo-notifications ~0.32.17` e `expo-device ~8.0.10` presentes. `app.json`: plugin `expo-notifications` configurado.

**🔵 Como o código está correto, o "não dispara" provavelmente é fora do código JS:**
- Causa estatística #1: **módulo nativo precisa de `eas build`** — se o APK em uso recebeu só `eas update` (OTA), o `expo-notifications` nativo pode não estar ativo. OTA não ativa módulo nativo novo.
- Outras: permissão negada em runtime; Doze mode / otimização de bateria do Android; agendamento não confirmado em runtime (`getAllScheduledNotificationsAsync`). Tudo precisa **teste em device real** — fora do escopo desta passada.
- Verificar também a ordem em `session.ts`/boot (registra open do dia → agenda Checkpoint → cancela Checkpoint) pra garantir que o Checkpoint não é cancelado antes de agendar.

---

## 4. Monetização — Subscription Tiers

**⚪ Nada implementado.**
- `grep subscription_tier` em `supabase/migrations/` → **0 ocorrências**. Em `app/` + `supabase/` inteiro (incl. `subscriptionTier`) → **0 ocorrências**.
- A coluna `profile.subscription_tier` não existe; nenhuma RLS/RPC/front-end referencia tiers. **Toda a spec da seção 4 está por implementar** — vira projeto inteiro pro doc do André (auditoria de RLS, 4 checks inline nas RPCs, hooks/modal/badge, limites 10/5/3/3).
- As 5 decisões fechadas da spec **não foram tocadas** (conforme instrução).

---

## 5. Varredura geral de polish (Phase 1)

| # | Item | Status |
|---|---|---|
| 2 | `released_at`/`version` em template tables | 🟢 saiu — `supabase/migrations/20260513000001_template_released_at.sql` (+ usado no `learning_foundation`) |
| 3 | Nav: Profile→Settings, tab Learning, History em Tasks | 🟢 Settings (tab title `Settings`, i18n `tabs.settings`), Learning ativo, History acessível pela Home/Tasks |
| 4 | Auditoria PT/EN + glossário | 🟢 **feito recentemente** — varredura i18n completa (PRs #251/#252): paridade 969 chaves, 0 faltando, hardcodeds traduzidos. Glossário Dedicação/Momentum/3 pilares presente nas locales |
| 5 | Skills CRUD polishing | 🔵 status não aprofundado (telas existem: `skills.tsx`, `skill-form.tsx`, `skill/[id]`) |
| 6 | Rewards visual polish | 🟢 Vault redesign saiu (hero, cards, chips) |
| 7 | Bugs transversais de scroll/botão fixo | 🔵 aprofundar — confirmar todos os call sites de `useBottomNavClearance()` é trabalho de várias leituras |

Rebrand visual Perceva: 🟢 saiu (app.json name=Perceva, login/onboarding com identidade Perceva, ícones exportados, `PercevaGlyph`).

---

## Gaps de contexto (que o scan de origem pode não ter pego)

1. **O scan trata várias frentes como "talvez não feitas" — a maioria ESTÁ feita** e merece atualizar o status antes do doc do André:
   - Notificações: implementadas + wired (não "nunca commitadas").
   - Curva de XP: rebalanceada cliente **e** servidor.
   - Quests→Missões / Goals→Metas: rename **feito** na UI/i18n (`home.quests.browseChip='Missões'`, board de Missões, `pillar.sub.desejada` = Metas/Skills).
   - Tour pós-login completo (M0–M6 + wrap + replay) — **não mencionado no scan**, mas é uma frente grande já em produção.
   - Rebrand Perceva: feito (parcial — `CLAUDE.md` ainda diz "stays RPG Tasks", ver abaixo).
2. **CLAUDE.md desatualizado (confirmado)** — o roadmap V3 lista só os 7 itens da Phase 1 original e **não menciona**: rebrand Perceva, sistema de notificações, curva de XP nova, rename Quests→Missões/Goals→Metas, tour pós-login, nem subscription tiers. Diz "App name: stays RPG Tasks" enquanto `app.json` já é Perceva. **Atualização fica pro PR de fechamento da Phase 1** (não agora).
3. **Bug do tour em cold boot — JÁ CORRIGIDO hoje** (PR #253, OTA preview publicado): o tour disparava todo boot por uma corrida de hidratação em `useTourReady`. Mencionado aqui pro André não re-investigar.
4. **Dívida de i18n residual**: `confirmCompletion.ts` (dead code) e os componentes dead-code `QuestChip.tsx` / `modal.tsx` têm strings hardcoded em inglês. Baixa prioridade.

---

## Fixes triviais aplicados nesta passada
- `app/lib/util/confirmCompletion.ts`: curva antiga `250/100` → `80/55` (valores da curva atual). Dead code, mas evita valor errado se religado.

Nada de migration, nada de balance, nada das decisões fechadas — tudo conforme a seção 6 do scan.
