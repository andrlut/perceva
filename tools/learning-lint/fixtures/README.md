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

O campo do envelope é `category: research|book|foundation` (budget research 1..3, book 1..5,
foundation 1..3 — teto, sem piso; o mínimo é sempre 1). `type: summary|explainer|news` ainda é
aceito como legado, mapeado summary→book e explainer|news→research, e gera WARN pedindo a
migração pro campo novo.

| fixture | o que prova |
|---|---|
| `pass.json` | research (3 ideias), todas dentro do contrato: título ≤48 ≠ título do material, **sem dois-pontos** (tópico assertivo ou pergunta direta — `idea_title_riddle`) e compartilhando palavra ≥5 letras com `material_title` (`idea_title_no_subject`, vale pra toda ideia inclusive a 1), afirmação ≤120 que é a **resposta que dá pra usar** e não o resumo do estudo (sem autor/ano/amostra — `idea_claim_cites_study`) com pontuação simples (sem travessão, sem ponto e vírgula, <3 vírgulas, <3 frases — `idea_claim_two_jobs`), texto 100–180 palavras por idioma (paridade PT/EN ≤25%), ≤2 negritos, links e fontes http(s), brief sem texto/placa/UI, `cta: null`, sem prefixo "Tema:" repetido entre títulos. Serve de **exemplo do contrato** pro cutter/drafter — por isso sai com **0 WARN**. |
| `pass-claim-over-target.json` | `claim.pt` com **exatos 140** chars e `claim.en` com 122 → **exit 0 com 2 WARN**: entre 121 e 140 a afirmação estoura o orçamento do card (só cabe com a fonte encolhida) mas não é erro, e 140 continua aceito. O runner não afirma WARN, só mostra a contagem na linha — confira o "(2 WARN)". |
| `pass-claim-two-jobs.json` | pontuação como **sintoma, não proibição**: `claim.pt` com travessão + 3 vírgulas e `claim.en` com ponto e vírgula + 3 frases → **exit 0 com 2 WARN** (`idea_claim_two_jobs`). Os quatro sinais da regra num único fixture; nenhum deles derruba o drop, mas cada um diz "essa frase está fazendo dois trabalhos". O gatilho de frases é **3+**, não 2: o drafter autoriza "uma frase (duas bem curtas no máximo)", então duas frases são contrato cumprido — por isso o `claim.en` daqui tem três. |
| `pass-one-idea-research.json` | `category: research` com **1 única ideia** → exit 0, sem WARN de abaixo do mínimo (não existe mais — o budget é só teto). A afirmação é a forma preferida do verso: **instrução com o número que se aplica** ("Ponha o alarme entre 10 e 20 minutos…"). |
| `pass-legacy-type.json` | envelope só com `type: explainer` (sem `category`) → exit 0 com 1 WARN: `legacy "type" field — use "category"`. Mapeado pra `research`. |
| `fail-too-many-ideas.json` | 6 ideias → estoura o teto duro 1..5 (category `book`; o budget por categoria não dispara em cima, é a mesma discrepância) |
| `fail-over-budget.json` | 4 ideias num `research` → acima do budget da categoria (research 1..3, book 1..5, foundation 1..3), mesmo dentro do teto duro 5 |
| `fail-bad-ordinal.json` | ordinais 1 e 3 → sequência quebrada (ordinal precisa ser 1..n sem buracos) |
| `fail-claim-too-long.json` | `claim.pt` com mais de 140 caracteres (teto duro; 121–140 é só WARN, ver `pass-claim-over-target.json`) |
| `fail-claim-cites-study.json` | `claim.pt` termina em "(Leong et al., 2015)" → FAIL `idea_claim_cites_study`. O verso do card é a resposta que o leitor USA, nunca a maquinaria da pesquisa (autor, ano, nome do estudo, `n=`, "no estudo", "os pesquisadores"); isso vive no `body`, que segue exigindo número com estudo nomeado. `claim.en` diz a mesma coisa sem citar (fica como contraste do que se espera). |
| `fail-body-too-short.json` | `body.pt`/`body.en` com menos de 60 palavras (abaixo de 100 é só WARN; abaixo de 60 é FAIL) |
| `fail-missing-source-url.json` | fonte só com `label`, sem `url` http(s) |
| `fail-image-brief-text.json` | `image_brief` menciona "placa" e "texto" — a imagem tem que ser uma cena sem texto, placa, logo, legenda ou UI |
| `fail-dollar-quote.json` | `$$` dentro de `body.pt` — quebraria o `$ideas$…$ideas$` da migration |
| `fail-shared-title-prefix.json` | 2 ideias com `title.pt` começando por "Proteína: …" — mesmo texto antes do primeiro ":" → FAIL `idea_titles_shared_prefix` (o formato "tema: afirmação" repetido entre ideias, ex. real: "Bids: …", "Bids: …", "Bids: …"). `title.en` das duas não colide (fica só como contraste). Os dois títulos com ":" também acendem o WARN `idea_title_riddle` — o dois-pontos é sintoma, não prova (por isso WARN aqui e FAIL editorial no reviewer), e vira proibição quando o prefixo se repete. |

Regras que hoje só têm cobertura indireta (WARN, ou sem fixture própria): afirmação entre 121 e 140 chars (WARN — `pass-claim-over-target.json` só a exercita, o runner não afirma WARNs), título igual ao do material, título sem palavra ≥5 letras em comum com `material_title` (`idea_title_no_subject` — todo `fail-*`/`pass-claim-over-target` daqui dispara isso incidentalmente em algum título, o runner só não afirma WARNs), título com dois-pontos (`idea_title_riddle` — exercitado por `fail-shared-title-prefix.json`), 2+ títulos abrindo com a mesma palavra ≥5 letras sem ":" (variante WARN de `idea_titles_shared_prefix`; a variante FAIL com ":" tem fixture própria acima), slug terminando em `-YYYY-MM` (WARN "carries a date"), >2 negritos, muletas ("vale lembrar", "it's worth noting"…), paridade PT/EN >25%, link inline não-http, `category`/`type` inválidos, `id` duplicado/fora de `^[a-z0-9-]{3,40}$`, `cta` que não é `null`/objeto. Ao endurecer qualquer uma delas, adicione a fixture correspondente.

**Caso de WARN precisa de nome `pass*`.** O runner só conhece dois veredictos (`pass*` → exit 0, `fail-*` → exit 1), então uma regra que é WARN por desenho — `idea_claim_two_jobs`, o teto de 140 chars — vira fixture `pass-<regra>.json` e é conferida pela contagem "(N WARN)" impressa na linha, não por asserção.

O heurístico `dated_framing` (gancho do corpo lido como "acaba de sair" / "this month" / datado) e o formato per-`n` do range de palavras do artigo (`lo = 200 + 250n`, `hi = 350 + 400n`) vivem em `lintBody()`, usada pelos modos `--draft`/`--all`/`--body` — sem fixtures próprias aqui porque não existe subpasta `draft/` ainda (ver `MODES` em `run-fixtures.mjs`; crie-a se for endurecer essas regras).

## Adicionando uma fixture

1. Copie `pass.json` do modo, mude **uma** coisa, salve como `fail-<regra>.json`.
2. Rode o runner e confira que a linha `[FAIL]` impressa é a da regra pretendida — e que não há outra.
3. Registre na tabela acima.

Pra um modo novo, crie a subpasta e adicione a flag no `MODES` do runner.
