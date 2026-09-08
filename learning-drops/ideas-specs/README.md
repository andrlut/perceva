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
- Drops novos: o publisher "ideias primeiro" escreve as ideias antes do
  artigo e cai no mesmo contrato.

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
      "title": { "pt": "…", "en": "…" },   // ≤ 48 chars, gancho de curiosidade, nunca o nome do tema
      "claim": { "pt": "…", "en": "…" },   // ≤ 140 chars, resposta primeiro, vale sozinha (é o verso do card)
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

1. cutter escreve `<slug>.json` (+ `_review-<lote>.md` com a lista compacta)
2. maintainer aprova o texto
3. `generate.mjs --only ideas --slug <slug>` gera as imagens
4. `emit-migration.mjs` → `/db-migration`

`tools/learning-lint/lint.mjs --ideas` valida a parte mecânica do contrato
(contagens, limites, ids, fontes). Rode antes de pedir aprovação.
