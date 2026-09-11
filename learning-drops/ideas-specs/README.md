# ideas-specs — as ideias de cada material, em texto

Uma **ideia** é a unidade de consumo do Recanto novo: título-gancho,
afirmação de uma frase, texto de 100-180 palavras, uma imagem que retrata a
afirmação, fontes — e, no fim da tela, o card que o leitor vira pra
"absorver". Cada material tem de 1 a 5.

Esta pasta guarda **o texto** das ideias, um arquivo por material,
**versionado no git** (diferente de `inbox/`, que é local). É o que o
maintainer aprova antes de qualquer imagem ser gerada, e é a fonte que
`tools/content-media/generate.mjs --only ideas` (imagens) e
`tools/content-media/emit-migration.mjs` (linha do banco) consomem.

## Quem escreve

- Backfill do catálogo legado: o agente `.claude/agents/learning-idea-cutter.md`
  deriva as ideias do artigo publicado + `reasoning_log.main_points` +
  manchetes de `learning-drops/reels-specs/<slug>.json`. Nunca um fato que
  não está no artigo.
- Drops novos: o `learning-publisher` escreve este arquivo a partir do
  payload do drafter (`ideas[]`, escritas antes do artigo), antes de qualquer
  mídia — mesmo contrato. A aprovação aí é do `learning-reviewer` (regras
  por ideia) + `lint.mjs --ideas`, sem parada humana: o run é autônomo e o
  maintainer audita no commit/PR. A parada obrigatória pra aprovar o texto
  existe só no backfill.

## Contrato — `<slug>.json`

```jsonc
{
  "slug": "catch-up-sleep-weekend",
  "type": "summary | explainer | news",
  "material_title": { "pt": "…", "en": "…" },
  "ideas": [
    {
      "id": "acorda-descansado",   // ^[a-z0-9-]{3,40}$ — IMUTÁVEL, chave da coleta
      "ordinal": 1,                // 1..n contíguo; só ele renumera
      "title": { "pt": "…", "en": "…" },   // ≤ 48 chars, gancho de curiosidade, nunca o nome do tema;
                                           // da ideia 2 em diante vale sozinho FORA do material (Minhas ideias, Explorar, MCP): nomeia o assunto — "tema: afirmação" cabe
      "claim": { "pt": "…", "en": "…" },   // alvo ≤ 120 chars (teto duro 140): é o verso do card, lido inteiro num card de 132px
                                           // (rail do material e Minhas ideias); 121-140 só cabe com a fonte encolhida — evitar.
                                           // Resposta primeiro, vale sozinha
      "body":  { "pt": "…", "en": "…" },   // 100-180 palavras: mecanismo + número com estudo nomeado + o que fazer;
                                           // **negrito** em até 2 trechos; [texto](url) inline permitido
      "image_brief": "…",                  // PT, UMA cena concreta e sem texto que RETRATA a afirmação
      "sources": [                          // 1..3; só source_url + linhas :::source do artigo
        { "label": { "pt": "…", "en": "…" }, "url": "https://…" }
      ],
      "cta": null                           // slot reservado
    }
  ]
}
```

Orçamento por tipo: `news` 1 · `explainer` 1-3 · `summary` 2-5 · teto 5.
Cortar em vez de esticar.

O jsonb `learning_material.ideas` no banco tem, por ideia, dois campos a
mais que o spec **não** carrega — `image: {path, width, height}` e
`video: {pt: {path, duration_seconds, poster} | null, en: … | null}`. Eles
vêm do manifest de mídia, via `emit-migration.mjs`.

## Regras que não se negociam

- **`id` nunca muda nem é reaproveitado.** É a chave de
  `learning_idea_collect` (o card que cada leitor já virou). Re-cortar um
  material preserva os ids das ideias que sobrevivem; ideia nova ganha id
  novo; id de ideia removida não volta. A migration que reescreve `ideas`
  apaga as coletas órfãs.
- **Nenhum fato fora do artigo.** Sem estudo, número, nome, ano ou DOI que
  o `body_pt`/`body_en` não carregue.
- **`image_brief` sem texto** — nada de placas, letreiros, números, telas,
  relógios com numerais. O renderer acrescenta o estilo da casa e a regra de
  "sem texto"; o brief descreve só o assunto.

## Fluxo

Backfill (legado):

1. cutter escreve `<slug>.json` (+ `_review-<lote>.md` com a lista compacta)
2. maintainer aprova o texto
3. `generate.mjs --only ideas --slug <slug>` gera as imagens
4. `emit-migration.mjs` → `/db-migration`

Drop novo (`learning-publisher`): o publisher escreve `<slug>.json` do
payload do drafter já aprovado pelo reviewer → `lint.mjs --ideas` →
art-director escreve `media-specs/<slug>.json` → `generate.mjs --slug <slug>`
(capa + ideias) → upload → `emit-migration.mjs --slug <slug> --with-cover`
→ `db push`. Passo a passo em `.claude/agents/learning-publisher.md`.

`tools/learning-lint/lint.mjs --ideas` valida a parte mecânica do contrato
(contagens, limites, ids, fontes). Rode antes de pedir aprovação. Afirmação
entre 121 e 140 chars sai como WARN, não como erro — mas não é aprovação:
aperte a frase em vez de contar com a fonte encolhida. Título de ideia 2+
sem palavra de ≥5 letras em comum com o título do material e sem
dois-pontos também sai como WARN (`idea_title_no_context`) — é heurística;
o que vale é o título nomear o assunto quando o card aparece fora do
material.
