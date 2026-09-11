---
name: db-migration
description: Cria uma nova migration Supabase no padrão counter-style do repo, aplica direto na cloud (instância compartilhada `uneqnpyzevosznwkmvvo`) e commita o `.sql` no git imediatamente após sucesso — na ordem certa pra evitar history mismatch entre máquinas. Use quando o user pedir "criar migration", "mudar schema", "adicionar coluna", "nova RPC", "alterar tabela", "fazer migration de X", ou explicitamente invocar `/db-migration`. NÃO use pra outros projetos — config é específica do repo `rpgtasks`.
---

# /db-migration

Skill nível 3 (agressiva) — cria a migration, aplica na cloud Supabase compartilhada, e commita o arquivo no git, tudo no fluxo correto pra não quebrar o histórico do outro dev.

## Quando invocar

- "Criar migration pra X", "preciso mudar o schema", "adicionar coluna em Y"
- "Nova RPC pra Z", "alterar tabela"
- User invoca explicitamente `/db-migration`
- Depois de ajustar tipos em `app/lib/db/` e o user pedir pra refletir no schema

## Quando NÃO invocar

- Edição de migration já mergeada (write-once rule — abrir fix-up PR em vez de editar)
- User só perguntou se vale criar migration (modo exploratório)
- Existem worktrees stale com migrations pendentes (perigo de conflito)

## Configurações fixas

```
Supabase project ref: uneqnpyzevosznwkmvvo
Migrations dir:       supabase/migrations/
Naming pattern:       <YYYYMMDD>NNNNNN_<snake_case_name>.sql
Repo root:            detectado dinâmico — não hardcodar path
```

**Portabilidade**: rode tudo via a Bash tool (funciona no Windows local e no sandbox Linux da nuvem). O root é detectado em runtime, nunca hardcodado:

```bash
# main worktree (onde o supabase CLI está linkado); na nuvem é o checkout único
MAIN=$(git worktree list --porcelain | sed -n '1s/^worktree //p')
cd "$MAIN"
```

Cada chamada da Bash tool é um shell novo: redefina `MAIN` e o `slug` no começo de cada bloco que usa os dois.

> **Nenhum snippet desta skill pode ter cifrão seguido de dígito.** Quando a skill é invocada com argumentos, cada `$N` do texto (N = dígito) vira o N-ésimo argumento antes de chegar a você — o antigo snippet de `awk` que imprimia o 2º campo chegou como `print SQL`. (E ele já estava errado sem argumento nenhum: o path tem espaço — `André Luthold` — e o 2º campo era só `C:/Users/André`.) `${var}`, `$(…)`, `$((…))` e `$?` podem; referência de campo ou de grupo com cifrão (awk, sed, perl), não.

## Pré-requisitos (validar e abortar com mensagem clara se faltar)

- `SUPABASE_ACCESS_TOKEN` setado no ambiente (`[ -n "$SUPABASE_ACCESS_TOKEN" ]`). Local: env var de usuário no Windows (visível no Git Bash). Nuvem: secret no ambiente do sandbox.
- **Token VÁLIDO, não só presente.** O erro mais recorrente desse repo é PAT expirado/revogado: o CLI morre em `Initialising login role... 401 Unauthorized` no push, depois de já ter criado o arquivo. Testar a validade ANTES de tocar em qualquer migration:

  ```bash
  if curl -fsS -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
       https://api.supabase.com/v1/projects >/dev/null 2>&1; then
    echo "token OK"
  else
    echo "TOKEN INVÁLIDO — rotaciona em https://supabase.com/dashboard/account/tokens e atualiza a env var SUPABASE_ACCESS_TOKEN (local: setx/User env; nuvem: secret do sandbox)"
  fi
  ```

  Se não retornar `token OK` → **abortar** com a URL de rotação. Não seguir pro Passo 1.
- Repo limpo no main worktree (`git status` sem `.sql` pendentes em `supabase/migrations/`)
- `gh auth status` ok (pra futuras operações)
- Projeto linkado: `supabase db push --linked` exige `supabase link --project-ref uneqnpyzevosznwkmvvo` rodado uma vez nesse checkout. Local já está linkado; **na nuvem o `cloud-setup.sh` faz o link no bootstrap** — se der "Cannot find project ref", rodar o link.

## Processo (5 passos)

### Passo 1 — Sync forçado do main

Mexer no schema da cloud sem `git pull` é o erro mais perigoso desse repo (PR #148 saga). Sempre puxar primeiro:

```bash
MAIN=$(git worktree list --porcelain | sed -n '1s/^worktree //p')
cd "$MAIN"
git switch main
git pull --rebase
```

Se houver `.sql` em `supabase/migrations/` que não está no main remote, **abortar** — sinal de migration órfã (alguém pushou na cloud mas não commitou ainda).

### Passo 2 — Calcular o número: maior + 1 sobre main ∪ cloud

O número novo tem que ser maior que **toda** versão de hoje que exista em qualquer um de dois lugares:

- **(a) arquivos em `supabase/migrations/`** do main recém-puxado;
- **(b) histórico da cloud** (`supabase_migrations.schema_migrations`) — é o que pega a migration que outra sessão **já aplicou e ainda não mergeou**, invisível no main.

E é **maior + 1, não contagem + 1**: com buraco na sequência do dia (`000001`, `000003`), contagem + 1 devolve `000003` de novo.

Por que tanto cuidado: o CLI casa migration **só pela versão**. Arquivo novo com versão já aplicada é tratado como aplicado — o `db push` responde "up to date", não roda o SQL e não dá erro. Em 2026-09-10 a skill fez pull, contou `000001`/`000002` e escolheu `20260910000003`; segundos depois outra sessão mergeou a #404, que já tinha aplicado o próprio `20260910000003_…` na cloud. O dry-run respondeu `{"upToDate":true,"migrations":[]}` e só foi pego porque a saída foi lida no olho.

```bash
MAIN=$(git worktree list --porcelain | sed -n '1s/^worktree //p')
cd "$MAIN"
today=$(date +%Y%m%d)

# (a) main — versões de hoje nos arquivos
local_v=$(ls supabase/migrations/ | grep -o "^${today}[0-9]\{6\}")

# (b) cloud — versões de hoje já aplicadas (read-only; User-Agent de browser leva 403)
remote_json=$(curl -fsS -X POST "https://api.supabase.com/v1/projects/uneqnpyzevosznwkmvvo/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "User-Agent: supabase-cli/2.116.0" \
  -d "{\"query\": \"select version, name from supabase_migrations.schema_migrations where version like '${today}%' order by version\", \"read_only\": true}") \
  || { echo "ABORT: não li o histórico da cloud — sem ele o número pode colidir"; exit 1; }
remote_v=$(printf '%s' "$remote_json" | grep -o "${today}[0-9]\{6\}")

# maior + 1 sobre a união (10# força decimal: 000008 não vira octal)
max=$(printf '%s\n' $local_v $remote_v | sort -u | tail -1)
if [ -n "$max" ]; then n=$((10#${max:8} + 1)); else n=1; fi
next="${today}$(printf '%06d' "$n")"

echo "main:  $(echo $local_v)"
echo "cloud: $remote_json"
slug="${next}_<nome-sugerido>"
echo "slug:  $slug"
```

Leia a linha `cloud` antes de seguir: versão que está lá e **não** está em `main` é migration de outra sessão, aplicada e não mergeada. O número novo já pula ela, mas o push do Passo 4 vai recusar até o arquivo dela chegar no seu checkout (armadilha no Passo 4) — avise o user agora, não depois. Conferência equivalente no olho: `supabase migration list --linked` (coluna Remote); o snippet usa a API porque ela devolve JSON com o `name` e não depende do login role do CLI.

**Importante**: nunca usar timestamp-style (`YYYYMMDDHHMMSS`). Convenção do repo é counter-style.

### Passo 3 — Criar e editar o arquivo

Cria `supabase/migrations/${slug}.sql` com header padrão:

```sql
-- migration: <slug>.sql
-- purpose: <descrição curta do que essa migration faz>
--
-- affected tables: <lista>
-- new rpcs:        <lista, ou "none">
-- breaking?       <yes/no — se yes, listar como código existente deve adaptar>
--
-- notes:
--   migrations são write-once; nunca editar depois de aplicar
--   <outras notas relevantes>

begin;

-- <SQL aqui>

commit;
```

Mostra ao user pra ele confirmar o conteúdo antes do push. Validar antes de pushar:
- `CREATE OR REPLACE FUNCTION` com return type diferente? → exige `DROP FUNCTION` antes
- `ALTER TABLE` com `NOT NULL` adicionado? → precisa de default ou backfill
- INSERT em catálogos? → ON CONFLICT (id) DO NOTHING (idempotente, padrão do repo)
- Coluna nova em `quest_template`/`task_template`/`reward_template`? → adicionar coluna `*_pt` (e opcionalmente `*_en`) pra bilíngue

A confirmação do user pode levar minutos, e outra sessão pode aplicar migration nesse meio-tempo — por isso o Passo 4 revalida em vez de confiar no número do Passo 2.

### Passo 4 — Gate de dry-run → push → confirmar

#### 4a — Dry-run obrigatório, imediatamente antes do push

```bash
MAIN=$(git worktree list --porcelain | sed -n '1s/^worktree //p')
cd "$MAIN"
slug="<slug do Passo 2>"
file="${slug}.sql"
out=$(echo "Y" | supabase db push --linked --dry-run 2>&1); rc=$?
printf '%s\n' "$out"
listed=$(printf '%s' "$out" | grep -o '[0-9]\{14\}_[A-Za-z0-9_.-]*\.sql' | sort -u)
if [ "$rc" -eq 0 ] && [ "$listed" = "$file" ]; then
  echo "GATE OK — o push vai aplicar só $file"
else
  echo "ABORT — o dry-run não listou exatamente $file (rc=$rc; listou: ${listed:-nada}). NÃO pushar."
fi
```

Passa **só** com exit 0 **e** a lista de migrations igual ao arquivo novo — nada a mais, nada a menos. Sob o Claude Code o CLI imprime a lista duas vezes, em texto (`• <arquivo>`) e em JSON (`"migrations":[…]`), e o grep pega as duas; o exit code entra porque nas saídas de erro o nome do arquivo aparece dentro do `suggestion`.

Qualquer outra saída → **abortar e explicar ao user** o que ela significa:

| Saída do dry-run | Significado |
|---|---|
| `Remote database is up to date` / `"upToDate":true,"migrations":[]` | **Colisão de versão.** Alguém já aplicou essa versão; o CLI acha que o seu arquivo é aquele e o push real seria um no-op silencioso. |
| Lista com outro arquivo além do seu | Migration pendente de outra pessoa no checkout (órfã ou de outra sessão) — o push aplicaria SQL que não é seu. |
| `Remote migration versions not found in local migrations directory` (rc=1) | A cloud tem versão que o checkout não tem — armadilha abaixo. |
| `Found local migration files to be inserted before the last migration on remote database` (rc=1) | Seu número está abaixo do topo da cloud (ex.: uma sessão na nuvem, em UTC, já usou a data de amanhã). Não contornar com `--include-all`. |

Depois de abortar: `git pull --rebase` (o seu `.sql` ainda não commitado não atrapalha), refazer o Passo 2, renomear o arquivo com `mv`, atualizar a linha `-- migration:` do header e rodar o gate de novo. Nunca pushar "pra ver".

**Armadilha — cloud à frente do checkout.** Se a cloud tem uma versão que o seu `supabase/migrations/` não tem, o CLI erra com `Remote migration versions not found in local migrations directory` e sugere `supabase migration repair --status reverted <versão>` e `supabase db pull`. **NUNCA rodar nenhum dos dois.** O `repair` só reescreve o histórico — o schema daquela migration continua aplicado, e o arquivo dela colide quando for mergeado; o `db pull` fabrica uma migration nova a partir do schema remoto. O conserto é trazer o arquivo: o `name` que a query do Passo 2 devolveu diz qual é (`<versão>_<name>.sql`). Ache a branch que o carrega (`git fetch --all && git log --all --format='%h %D %s' -- 'supabase/migrations/<versão>_*'`), espere o merge e puxe o main. Depois de squash merge, `git log main..<branch>` mostra a branch como "fora do main" pra sempre — confira o main de verdade com `git log main -- <arquivo>` antes de concluir que ela não mergeou.

#### 4b — Push real (só depois do `GATE OK`)

```bash
MAIN=$(git worktree list --porcelain | sed -n '1s/^worktree //p')
cd "$MAIN"
echo "Y" | supabase db push --linked
```

Se der erro:
- `cannot change return type of existing function` → adicionar `drop function if exists` antes do `create or replace`
- `column X of relation Y does not exist` → coluna não foi criada por ALTER TABLE prévio na migration
- `null value in column "X" violates not-null constraint` → INSERT precisa fornecer essa coluna ou ALTER COLUMN DROP NOT NULL
- `Remote migration versions not found…` (o velho "history mismatch") → armadilha do 4a

#### 4c — Confirmar que foi o SEU SQL que rodou

Entre o dry-run e o push ainda existem segundos em que outra sessão pode ocupar a mesma versão — aí o push real também vira no-op. A cloud guarda o `name` de cada versão, e ele tem que ser o seu:

```bash
slug="<slug do Passo 2>"
next="${slug%%_*}"; nome="${slug#*_}"
got=$(curl -fsS -X POST "https://api.supabase.com/v1/projects/uneqnpyzevosznwkmvvo/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "User-Agent: supabase-cli/2.116.0" \
  -d "{\"query\": \"select name from supabase_migrations.schema_migrations where version = '${next}'\", \"read_only\": true}") \
  || { echo "não consegui consultar — repetir; NÃO ir pro Passo 5 sem resposta"; exit 1; }
echo "$got"
if printf '%s' "$got" | grep -qF "\"name\":\"${nome}\""; then
  echo "APLICADO — ${next} é o seu SQL"
else
  echo "NÃO APLICADO — ${next} não é ${nome}"
fi
```

`NÃO APLICADO` → **não commitar**: o SQL não rodou. Volte ao Passo 1 com número novo.

### Passo 5 — Commit imediato

**Crítico — não pular, e só depois do `APLICADO` do 4c:**

```bash
MAIN=$(git worktree list --porcelain | sed -n '1s/^worktree //p')
cd "$MAIN"
slug="<slug do Passo 2>"
git add "supabase/migrations/${slug}.sql"
git commit -m "feat(db): <descrição>" -m "Co-Authored-By: Claude <modelo> <noreply@anthropic.com>"
git push
```

Sem isso, o Artur não tem o `.sql` no git e a próxima vez que ele rodar `db push` da máquina dele vai dar history mismatch. O inverso é tão ruim quanto: commitar um `.sql` que não rodou faz o git afirmar um schema que a cloud não tem, e ninguém percebe até algo quebrar.

## Notas importantes

- **Nunca rodar `db push --linked` sem `git pull --rebase` antes.** É o golden rule do BD compartilhado.
- **Nunca rodar `db push` sem o gate do Passo 4a.** O CLI casa migration só pela versão: "up to date" com arquivo novo no diretório é colisão, não sucesso.
- **Nunca usar `supabase migration repair --status reverted`** — nem quando o próprio CLI sugere. Só remove o registro de histórico, o schema continua aplicado, próximo push do outro dev quebra.
- **Migrations write-once**: nunca editar depois de aplicada. Se precisar consertar, criar nova migration (ou fixup PR se ainda não aplicada).
- **Counter-style sequencial por dia**: `20260517000001` → `20260517000002` → `20260517000003`. Número novo = maior versão do dia (main ∪ cloud) + 1.

## Quando algo der errado

| Sintoma | Causa provável | Ação |
|---|---|---|
| "Cannot find project ref" | CLI fora do main worktree, ou checkout não linkado | `cd "$MAIN"` antes; na nuvem rodar `supabase link --project-ref uneqnpyzevosznwkmvvo` |
| Gate do 4a abortou, ou 4c deu `NÃO APLICADO` | Colisão de versão ou migration alheia pendente — o SQL NÃO rodou | Tabela do Passo 4a; `git pull --rebase` + Passo 2 + renomear. Nunca commitar o arquivo como está |
| `Remote migration versions not found in local migrations directory` | Outra sessão aplicou migration e ainda não mergeou | Trazer o arquivo via git (armadilha do 4a). NUNCA `migration repair` nem `db pull` |
| Push falhou no meio da migration | Transaction rolled back, schema intacto | Editar a migration localmente (se nunca aplicada) e re-pushar |
| Erro de permissão / 401 | Token expirado | Renovar PAT no dashboard Supabase e atualizar a env var |
| `supabase: command not found` (nuvem) | CLI não instalado no sandbox | Rodar `.claude/cloud-setup.sh` |
