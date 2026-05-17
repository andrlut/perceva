# Claude Code skills map — RPG Tasks

Mapa do que vale a pena ter como **skill** do Claude Code neste projeto. Skill = atalho versionado que o Claude lê toda vez que você invoca, com gatilhos automáticos + processo passo-a-passo + guardrails. Reduz repetição e padroniza ações arriscadas (db push, deploy, etc.).

Dois tipos de skill aqui:
- **Locais** — vivem em `~/.claude/skills/<nome>/SKILL.md` na máquina. Cada dev precisa instalar a sua cópia.
- **De marketplace (plugins)** — vivem em plugins (`anthropic-skills`, `design`, `marketing`) que o Claude Code resolve via plugin marketplace. Cada dev precisa habilitar o plugin.

Status atual: temos **só `deploy-site`** local (do projeto fabrisense-site, não desse repo). O resto é vazio. Esse mapa fecha o gap.

---

## 1. Skills a CRIAR (locais, project-specific) — must-have

Skills que codificam fluxos repetitivos deste repo. Servem tanto pra você quanto pro Artur. Vão pra `~/.claude/skills/<nome>/SKILL.md` em cada máquina; o conteúdo da skill é versionado nesse arquivo, e a gente pode mantê-lo num `.claude/skills-templates/` no repo pra Artur só copiar.

| Nome | Gatilhos | O que faz | Por quê |
|---|---|---|---|
| **`/db-migration`** | "criar migration", "mudar schema", "add coluna", "nova RPC" | (a) `git pull --rebase` no main, (b) cria arquivo `supabase/migrations/<data>NNNNNN_<nome>.sql` (counter-style), (c) abre pra edição, (d) `supabase db push --linked` quando o usuário confirmar, (e) commit do `.sql` imediatamente após sucesso. | Hoje (2026-05-17) gastamos horas porque o counter-style foi confundido e migration foi pushada sem commit. Skill enforça a ordem certa. |
| **`/db-migration-review`** | "revisar PR do Artur", "tem SQL no PR", "antes de mergear migration" | Roda `supabase db push --linked --dry-run` (ou faz checkout do branch + push em test), faz cross-ref dos columns no INSERT com o schema real, lista NOT NULL columns sem default, aborta com checklist se algo falhar. | Artur não tem acesso ao Supabase CLI cloud — migrations dele chegam sem dry-run. PR #148 falhou por 3 problemas estruturais que CI não pega. |
| **`/pr-cycle`** | "abre PR", "push e cria PR", "ja deixa mergeado" | (a) Pre-commit check (typecheck + lint), (b) `git push -u origin <branch>`, (c) `gh pr create` com title/body derivados dos commits, (d) opcionalmente aguarda CI verde e mergeia com `--squash --admin --delete-branch`, (e) cleanup do branch local. | Fluxo repetido N vezes por dia. PR sem pre-commit check vira CI vermelho. |
| **`/precommit-check`** | "antes de PR", "verifica TS", "roda lint" | `cd app && npx tsc --noEmit && npx expo lint`. Reporta erros agrupados. Se passar, sinaliza green-light pra PR. | Tem que rodar antes de TODO PR. Esquecer = CI vermelho = ciclo de 10 min de espera. |
| **`/sync-all`** | "sincroniza tudo", "atualiza tudo", "antes de começar trabalho" | (a) `git fetch origin`, (b) lista worktrees + estado de cada (behind/ahead/dirty), (c) pull --rebase do main, (d) `supabase migration list --linked` pra confirmar cloud = git, (e) reporta o que precisa de atenção. | Você abriu Claude Code de manhã e quer começar com tudo limpo. Hoje detectamos prunable worktrees, migrations diferentes, etc. |
| **`/ota-update`** | "manda hotfix", "atualiza APK sem rebuild", "joga update preview" | (a) Confirma que mudança é JS-only (sem package.json, sem app.json, sem código nativo), (b) `cd app && eas update --channel preview`, (c) reporta o update ID + tempo estimado pra usuários verem. | `eas update` é 30s; `eas build` é 15 min. A diferença é ter ou não certeza de que dá pra evitar rebuild. |

**Prioridade de criação** (na ordem em que recomendo construir): `db-migration` → `pr-cycle` → `precommit-check` → `db-migration-review` → `sync-all` → `ota-update`.

---

## 2. Skills a CRIAR — nice-to-have (Phase 2)

Faz sentido só quando o fluxo correspondente ficar repetitivo. Tem coisa que pode esperar.

| Nome | Por quê esperar | Quando vale a pena |
|---|---|---|
| **`/build-apk`** | `eas build` rodamos talvez 1x por semana | Se virar mais frequente (release semanal pro Artur testar) |
| **`/worktree-cleanup`** | `git worktree prune` já é 1 comando | Se acumular muitos worktrees stale (10+) |
| **`/local-dev-start`** | `pnpm dev` é 1 comando | Quando o setup do dev server crescer (variáveis, túneis, prebuild) |
| **`/learning-content-drop`** | Phase 2+ do V3 roadmap, ainda não estamos lá | Quando começar a fazer drops periódicos de materiais |
| **`/i18n-audit`** | App tem `_pt`/`_en` em catálogos | Quando tiver muitas catálogos novos sem `_en` (audit transversal) |
| **`/template-promote`** | Promover entidade user-created a system catalog | Quando começar a operacionalizar o "live content lever" do CLAUDE.md |

---

## 3. Skills JÁ DISPONÍVEIS no Claude Code — vale promover

Built-ins (já vêm com Claude Code, zero install):

| Skill | Quando usar |
|---|---|
| **`/review`** | Antes de mergear PR — review estruturado de mudanças. **Use no PR do Artur sempre.** |
| **`/security-review`** | Antes de mergear mudança em RLS / auth / migration sensível. RPCs SECURITY DEFINER pedem isso. |
| **`/simplify`** | Depois de implementar feature, antes de PR — review de reuso, dead code, simplificações. |
| **`/init`** | Pra refresh do CLAUDE.md depois de mudanças grandes na arquitetura (Phase 1 audit do V3 roadmap). |
| **`/fewer-permission-prompts`** | **Pro Artur**: escaneia transcripts dele e sugere permissions pra adicionar ao `~/.claude/settings.json`. Vai cortar muito prompt no início. |
| **`/consolidate-memory`** | Periodicamente (~mensal): reflexão sobre memórias antigas, merge de duplicatas, prune. |
| **`/update-config`** | Pra configurar hooks (ex: rodar typecheck antes de commit, mostrar lembrete quando branch fica stale). |
| **`/loop`** | Pra polling repetido (ex: checar CI do PR a cada 1 min). Útil mas usa muito turn — preferir Monitor tool. |

---

## 4. Plugins de marketplace — instalar seletivamente

### Já habilitados pra você

`anthropic-skills`, `design`, `marketing` — vejo as skills no contexto. Mas a maioria não cabe no perfil do projeto (sandbox dev de 2 pessoas, sem cliente externo, sem marketing).

### Vale a pena pro Artur instalar

| Plugin | Por que sim |
|---|---|
| **`design`** (parcial) | `design:ux-copy`, `design:design-critique`, `design:accessibility-review` aplicam ao app RN — review de microcopy bilíngue, screenshots de tela, contraste/touch targets. |
| **`anthropic-skills`** | `skill-creator` (criar novas skills), `consolidate-memory` (já listada acima). PDF/DOCX/XLSX/PPTX raramente vão ser usados aqui mas o plugin é leve. |

### Não vale a pena pra esse projeto

| Plugin | Por que não |
|---|---|
| **`marketing:*`** | Não temos pipeline de marketing. App é sandbox interno. Brand-review/SEO/email-sequence/etc são todos out-of-scope. |
| **`design:design-handoff`** | Só faz sentido se tivesse designer separado fazendo entrega de specs. Aqui você é dev + designer. |
| **`design:design-system`** | O sistema de design (tokens.ts) é pequeno e já consolidado. Não compensa o overhead. |
| **`design:user-research`** + **`design:research-synthesis`** | Quando V3 começar a fazer pesquisa qualitativa séria, reconsiderar. Hoje não. |

---

## 5. Action plan recomendado

### Fase 2A — Criar as 6 must-haves (Phase 1)

Por ordem:
1. `/db-migration` ← maior dor agora
2. `/pr-cycle` ← cabe na rotina diária
3. `/precommit-check` ← bloqueio pra esquecimento
4. `/db-migration-review` ← especificamente pros PRs do Artur
5. `/sync-all` ← workflow de início de dia
6. `/ota-update` ← payoff alto quando precisar

Cada uma vira `~/.claude/skills/<nome>/SKILL.md` + entry no `~/.claude/settings.json` se precisar de novas permissions. Vou versionar os arquivos em `.claude/skills-templates/<nome>/SKILL.md` no repo pra Artur só copiar.

### Fase 2B — Distribuição pro Artur

Adicionar ao [ONBOARDING.md](../ONBOARDING.md) um passo:

```
6.5. Skills do Claude Code
- Copia .claude/skills-templates/*/SKILL.md pra ~/.claude/skills/
- Habilita plugins via /plugin: design, anthropic-skills
- Pula marketing (não usamos aqui)
```

### Fase 2C — Promoção das built-ins

Atualizar CLAUDE.md adicionando seção "Skills úteis nesse repo" com bullets pra:
- `/review` antes de mergear
- `/security-review` em PRs com RLS/auth/RPC SECURITY DEFINER
- `/simplify` depois de feature, antes de PR
- `/db-migration-review` em PRs com `.sql`

---

## 6. Custo / esforço estimado

- **Fase 2A** (6 skills locais) — ~30-40 min total, vou fazer eu mesmo.
- **Fase 2B** (ONBOARDING.md update + skills-templates/) — 10 min, integra com 2A.
- **Fase 2C** (CLAUDE.md update) — 5 min.

Total: ~1 hora de trabalho. Entregável é tudo versionado no repo + skills locais funcionais nas duas máquinas (sua + Artur depois que ele clonar + copiar).

---

## 7. Decisões pendentes (preciso de você)

1. **Path de versionamento das skills**: `.claude/skills-templates/<nome>/SKILL.md` no repo (separa do `~/.claude/skills/` da máquina) — OK?
2. **`/pr-cycle` mergeia sozinho com `--admin`?** Posição agressiva (skill 3 igual deploy-site) vs conservadora (pausa antes do merge). Sandbox = agressiva faz sentido.
3. **`/db-migration` aplica direto na cloud ou só prepara o arquivo?** Posição agressiva (aplica) vs conservadora (só cria arquivo, você dá `db push` manual). Hoje agressiva traz risco se algo der errado no SQL.
4. **Habilitar `design` plugin pro Artur agora ou esperar primeiro PR de UI dele?**

Me responde 1-4 e eu construo o Phase 2A.
