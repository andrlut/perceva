# ideas-specs — as ideias de cada material, em texto

Uma **ideia** é a unidade de consumo do Recanto: título, afirmação de uma
frase (o verso do card), texto de 100-180 palavras, uma imagem, fontes — e,
no fim da tela, o card que o leitor vira pra "absorver". Cada material tem
**uma ideia por padrão**; cada ideia a mais precisa se justificar (teto 5).

**As três superfícies aparecem sempre juntas, e o conjunto é o que mais
importa.** O leitor encontra a ideia pela imagem, pelo título e pelo verso do
card, lado a lado, sem capa nem artigo em volta. **Régua do conjunto: os três
juntos precisam entregar o assunto — pelo menos um deles o nomeia — e não
podem se contradizer.** E nenhum dos três pode passar vergonha sozinho, omitir
o assunto principal nem deixá-lo dúbio:

- o **título** é um tópico assertivo (ou uma pergunta direta) que nomeia o
  assunto e dá vontade de ler — a curiosidade mora na resposta, nunca no
  assunto. **Sem charada**: a construção "Tema: frase enigmática" com
  dois-pontos é desencorajada (e continua PROIBIDA quando duas ideias do mesmo
  material compartilham o prefixo). Um livro não fica usando dois-pontos pra
  dizer as coisas;
- o **verso** é a resposta que dá pra usar — a instrução com o número que se
  aplica ou, quando o achado não pede ação, a conclusão seca. Nunca a
  maquinaria do estudo (ver a seção abaixo);
- a **imagem** não pode enganar. A régua dela é mais estreita que a das outras
  duas, porque imagem sem texto raramente nomeia um assunto sozinha:
  **reprova quando puxa pro assunto errado** — interruptores numa ideia de
  proteína (o leitor leu "conexão entre gerações"), barra de musculação numa
  ideia sobre risco (leu "academia"), balança com moedas numa ideia de sono
  (leu "finanças"). **Passa quando é neutra ou certa**, mesmo que um leitor
  não consiga nomear o assunto só por ela. "Assunto primeiro" segue sendo a
  **preferência** de direção de arte, não uma reprovação automática.

Esta pasta guarda **o texto** das ideias, um arquivo por material,
**versionado no git** (diferente de `inbox/`, que é local). É o que o
maintainer aprova antes de qualquer imagem ser gerada, e é a fonte que
`tools/content-media/generate.mjs --only ideas` (imagens) e
`tools/content-media/emit-migration.mjs` (linha do banco) consomem.

## O verso é a resposta, não o estudo

O verso (`claim`) é o que o leitor leva e usa. Em ordem de preferência:

1. **a instrução com o número que se aplica** — "Coma 25 a 30 g de proteína em
   cada refeição", "Junte 25 vezes o seu gasto anual", "Fale de carreira com
   quem você não fala há anos";
2. **quando o achado não pede ação, a conclusão seca** — "Pessoas solitárias
   têm memória pior, mas a queda ao longo do tempo é a mesma".

Nunca a maquinaria do estudo: **nada de nome de autor, nome de estudo, tamanho
de amostra, "no estudo", "os pesquisadores", "nos dados de X", "n=", nem
percentual de pessoas que responderam algo**. Isso vive no `body`, que continua
exigindo número com estudo nomeado. O número que entra no verso é o número que
o leitor **usa** (gramas, horas, refeições, múltiplos), não o número que mede a
pesquisa.

**Sem charada.** O card não é enigma com a resposta escondida dentro. Diga
direto.

**Pontuação simples, por consequência.** Travessão, ponto e vírgula e vírgulas
em série não são proibidos, mas quase sempre são sinal de que a frase está
fazendo dois trabalhos: corte um. Uma afirmação por card.

Antes → depois, do teste com o mantenedor:

| ✗ | ✓ |
|---|---|
| "Quem é solitário lembra menos agora — mas a memória cai no mesmo ritmo (SHARE, 10.217 idosos)." | "Pessoas solitárias têm memória pior, mas a queda ao longo do tempo é a mesma." |
| "Nos dados de Hall, amigo casual sai por ~50 horas juntos; amigo, ~90; amigo próximo, 200 ou mais." | "Amigo casual leva 50 horas juntos; amigo, 90; próximo, 200." |
| "Mesma base britânica: 19% menos doença cardíaca num estudo, benefício nenhum no outro. Compensar só ajuda quem dorme pouco na semana." | "Dormir mais no fim de semana só compensa quem dorme menos de 6h durante a semana." |

Os limites de tamanho não mudam: alvo 120 chars, teto duro 140.

## Quem escreve

- Re-corte do catálogo: o agente `.claude/agents/learning-idea-cutter.md`
  deriva as ideias do artigo publicado. Nunca um fato que não está no
  artigo — e nunca uma ideia por seção só porque a seção existe.
- Drops novos: o `learning-publisher` escreve este arquivo a partir do
  payload do drafter (`ideas[]`, escritas antes do artigo), antes de qualquer
  mídia — mesmo contrato. A aprovação aí é do `learning-reviewer` (regras
  por ideia) + `lint.mjs --ideas`, sem parada humana: o run é autônomo e o
  maintainer audita no commit/PR. A parada obrigatória pra aprovar o texto
  existe só no re-corte.

## Contrato — `<slug>.json`

```jsonc
{
  "slug": "catch-up-sleep-weekend",          // sem sufixo de data nos slugs novos
  "category": "research | book | foundation", // Pesquisa · Livro · Fundamentos
  "material_title": { "pt": "…", "en": "…" },
  "ideas": [
    {
      "id": "acorda-descansado",   // ^[a-z0-9-]{3,40}$ — IMUTÁVEL, chave da coleta
      "ordinal": 1,                // 1..n contíguo; só ele renumera
      "title": { "pt": "…", "en": "…" },   // ≤ 48 chars: tópico assertivo (ou pergunta direta) que nomeia o assunto
                                           // + dá vontade de ler; não entrega a resposta; toda ideia (a 1 inclusive).
                                           // Sem charada: "Tema: frase enigmática" desencorajado, e o prefixo repetido
                                           // entre irmãs ("Bids: …") é proibido
      "claim": { "pt": "…", "en": "…" },   // alvo ≤ 120 chars (teto duro 140): é o verso do card, lido inteiro num card de 132px;
                                           // 121-140 só cabe com a fonte encolhida — evitar.
                                           // A resposta que dá pra usar: a instrução com o número que se aplica ou,
                                           // se o achado não pede ação, a conclusão seca. Uma afirmação, sem charada.
                                           // Nunca autor, nome de estudo, amostra, "no estudo" nem % de pessoas
      "body":  { "pt": "…", "en": "…" },   // 100-180 palavras: mecanismo + número com estudo nomeado + o que fazer;
                                           // **negrito** em até 2 trechos; [texto](url) inline permitido
      "image_brief": "…",                  // PT, UMA cena concreta e sem texto do ASSUNTO da ideia; reprova só quando
                                           // puxa pro assunto errado — "assunto primeiro" é preferência, não reprovação
      "sources": [                          // 1..3; só source_url + linhas :::source do artigo
        { "label": { "pt": "…", "en": "…" }, "url": "https://…" }
      ],
      "cta": null                           // slot reservado
    }
  ]
}
```

Specs antigos ainda trazem `"type": "summary | explainer | news"`; o lint
aceita com WARN (summary = book; explainer e news = research).

**Orçamento por categoria — teto, nunca meta:** `research` 1-3 · `book`
1-5 · `foundation` 1-3 · teto duro 5. Comece de **uma** ideia; uma ideia a
mais só entra se diferir de cada irmã no **estudo**, no **mecanismo** ou na
**ação**. Contexto, ressalva, definição e receita não são ideias — viram
parágrafo dentro da ideia que servem. Cortar em vez de esticar; nunca
empacotar três ferramentas num card.

Por que tão estrito: até 2026-09-19 todo explainer tinha exatamente 3 ideias
e 6 de 7 resumos de livro tinham 4 — o número vinha do modelo de artigo
(3 seções, 950-1250 palavras fixas), não do conteúdo, e cerca de 1 ideia em
4 era enchimento.

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
  "sem texto"; o brief descreve só a cena. A régua dura é **não enganar**:
  nada de metáfora que puxe pro assunto errado (interruptores pra uma ideia de
  proteína). Assunto reconhecível é a preferência, não uma reprovação.
- **Escrito pra durar.** Nada no título, no verso ou na abertura depende do
  ciclo de notícias; a data do estudo aparece só na citação.

## Fluxo

Re-corte (catálogo publicado):

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
(contagens, limites, ids, fontes, prefixo repetido nos títulos). Rode antes
de pedir aprovação. Afirmação entre 121 e 140 chars sai como WARN, não como
erro — mas não é aprovação: aperte a frase em vez de contar com a fonte
encolhida. Título que não divide palavra nenhuma com o título do material
sai como WARN (`idea_title_no_subject`) — é heurística; o que vale é o
título nomear o assunto (o reviewer chama a mesma regra de
`idea_title_no_subject` e reprova por ela). Quem julga o sentido é o reviewer,
e o agente `learning-card-tester` — um leitor apressado às cegas (Haiku) que vê
um elemento por vez e diz do que se trata; a imagem só reprova quando aponta
pro assunto errado. O `learning-publisher` roda esse teste em três pontos:
título e verso logo depois do reviewer (passo 5b), o prompt da imagem antes de
gerar (8b) e a imagem pronta (9b, com no máximo uma regeração por ideia). A
régua foi calibrada com o mantenedor em 20 cards publicados (2026-09-20).
