# learning-lint fixtures

Self-test do `lint.mjs`. Rodar sempre que mexer numa regra:

```bash
node tools/learning-lint/run-fixtures.mjs            # exit 0 = tudo bateu
node tools/learning-lint/run-fixtures.mjs --verbose  # saída completa do linter por fixture
```

## Convenção

- Cada subpasta é um **modo** do linter: `ideas/` → `--ideas`, `reels/` → `--reels`, `spec/` → `--spec`, `draft/` → `--draft` (mapa `MODES` em `run-fixtures.mjs`).
- `pass*.json` precisa sair com **exit 0** (WARNs são permitidos e aparecem na linha).
- `fail-*.json` precisa sair com **exit 1** e ter **ao menos uma linha `[FAIL]`** — um JSON quebrado (exceção, exit 1 sem `[FAIL]`) conta como discrepância, não como falha esperada.
- Qualquer outro nome é ignorado com aviso.
- **Uma regra por fixture de falha.** O runner imprime as linhas `[FAIL]` de cada `fail-*` justamente pra você conferir que ela cai pela regra que o nome promete, e só por ela.

Fixtures são **material de teste**, não conteúdo publicável: os textos foram escritos de memória para ter a forma certa (tamanho, fontes, brief), não passaram pelo researcher/reviewer.

## `ideas/` — ideas-spec (`learning-drops/ideas-specs/<slug>.json`)

| fixture | o que prova |
|---|---|
| `pass.json` | explainer com 3 ideias, todas dentro do contrato: título ≤48 ≠ título do material, afirmação ≤140, texto 100–180 palavras por idioma (paridade PT/EN ≤25%), ≤2 negritos, links e fontes http(s), brief sem texto/placa/UI, `cta: null`. Serve de **exemplo do contrato** pro cutter/drafter. |
| `fail-too-many-ideas.json` | 6 ideias → estoura o teto duro 1..5 (summary; o budget por tipo não dispara em cima, é a mesma discrepância) |
| `fail-over-budget.json` | 2 ideias num `news` → acima do budget do tipo (news 1, explainer 3, summary 5), mesmo dentro do teto duro |
| `fail-bad-ordinal.json` | ordinais 1 e 3 → sequência quebrada (ordinal precisa ser 1..n sem buracos) |
| `fail-claim-too-long.json` | `claim.pt` com mais de 140 caracteres |
| `fail-body-too-short.json` | `body.pt`/`body.en` com menos de 60 palavras (abaixo de 100 é só WARN; abaixo de 60 é FAIL) |
| `fail-missing-source-url.json` | fonte só com `label`, sem `url` http(s) |
| `fail-image-brief-text.json` | `image_brief` menciona "placa" e "texto" — a imagem tem que ser uma cena sem texto, placa, logo, legenda ou UI |
| `fail-dollar-quote.json` | `$$` dentro de `body.pt` — quebraria o `$ideas$…$ideas$` da migration |

Regras que hoje só têm cobertura indireta (WARN, ou sem fixture própria): título igual ao do material, >2 negritos, muletas ("vale lembrar", "it's worth noting"…), paridade PT/EN >25%, link inline não-http, `type` inválido, `id` duplicado/fora de `^[a-z0-9-]{3,40}$`, `cta` que não é `null`/objeto. Ao endurecer qualquer uma delas, adicione a fixture correspondente.

## Adicionando uma fixture

1. Copie `pass.json` do modo, mude **uma** coisa, salve como `fail-<regra>.json`.
2. Rode o runner e confira que a linha `[FAIL]` impressa é a da regra pretendida — e que não há outra.
3. Registre na tabela acima.

Pra um modo novo, crie a subpasta e adicione a flag no `MODES` do runner.
