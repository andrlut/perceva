# content-media — Fase A do pipeline de conteúdo

Gera os **assets de mídia** de um material do Learning a partir de um
media spec (escrito pelo agente `learning-art-director`):

- **`cover.webp`** — capa 2:3 atmosférica e **sem texto**, via Gemini 3.1 Flash
  Image (Nano Banana 2), ~US$ 0,067/imagem a 1K, com **referências de estilo**
  (ver `style-refs/`).
- **`idea.<n>.<sha8>.webp`** — uma imagem **4:5 (960×1200)** por ideia do
  material (Recanto em ideias), mesmo modelo, mesmas referências de estilo e
  mesmo custo da capa; a única diferença é a frase de formato (assunto
  centrado, sem faixa vazia pro título). `sha8` = 8 hex de
  `sha256(id + "\n" + image_prompt)`: mudar o brief gera um path novo (o bucket
  nunca sobrescreve) e o manifest fica com **uma** entrada por `idea_id`.
- **`infographic.<pt|en>.webp`** — infográfico retrato 1080×1920, renderizado de
  **SVG com os tokens de marca do Perceva** (resvg), **US$ 0 de API**.
- **`manifest.json`** — descreve o que subir pro bucket e as linhas a inserir no
  banco. O agente `learning-publisher` (ou você) faz o `supabase storage cp` +
  a migration a partir daí (`emit-migration.mjs` escreve a de `ideas`). Uma
  rodada parcial (`--only cover`, `--locales pt`) **faz merge** com o manifest
  que já está na pasta em vez de sobrescrevê-lo: entradas anteriores são
  mantidas se o arquivo ainda existir, e descartadas com aviso se não existir.
  Sem isso, retomar uma etapa que falhou apagava as outras do manifest e elas
  nunca subiam.

Este pacote é **isolado do workspace pnpm** de propósito (não arrasta a árvore
do Expo). Instale com `npm install` aqui dentro, não com `pnpm`.

## Por que o infográfico é código, não imagem gerada

Pedir "desenha um infográfico" pra um modelo de imagem parece o caminho, mas em
2026 os dados são claros: no benchmark **IGenBench** o melhor modelo (Nano Banana
Pro) produz um infográfico **inteiramente correto só ~49% das vezes**, e a
completude de dados média entre modelos é **0,21** — números somem, se
embaralham, rótulos saem errados. Texto legível dentro de imagem colapsa depois
de ~200–800 caracteres, pior ainda em PT com acento.

Renderizar SVG → PNG resolve isso de forma determinística: texto é glifo de
fonte real, cor é hex exato do token. Reservamos o modelo de imagem só pro que
ele faz bem: a **capa sem texto**.

## Referências de estilo (por que a capa não é só prompt)

O modelo recebe, junto do prompt, **3 capas que já estão no ar** como
referência de estilo. Isso existe porque estilo escrito em adjetivos não
sobrevive a troca de geração de modelo: na migração do 2.5 pro 3.1, o mesmo
`STYLE_SUFFIX` que produzia o carvão dessaturado do acervo passou a produzir um
roxo saturado. Com as referências, o look volta a bater. Detalhes, critério de
escolha e as chaves `COVER_STYLE_REFS` / `COVER_STYLE_GLYPH` em
[`style-refs/README.md`](style-refs/README.md).

Se as referências sumirem ou falharem, a geração **degrada pro prompt puro** e
segue — nenhum drop falha por causa disso.

## Setup

```bash
# 1) deps (uma vez)
cd tools/content-media
npm install

# 2) chave do Gemini — só pra CAPA (o infográfico não precisa)
#    - pega em https://aistudio.google.com  (Get API key)
#    - habilita billing no projeto da chave (geração de imagem não tem free tier)
#    - guarda como env var de usuário:
setx GEMINI_API_KEY "sua-chave"   # reabra o terminal depois
```

ffmpeg é localizado automaticamente (instalação via winget). Override com
`FFMPEG_PATH` se precisar.

**Fontes (opcional, recomendado):** o infográfico usa Manrope (fonte da marca).
Se não houver Manrope instalada, o resvg cai pra Segoe UI — ainda fica limpo.
Pra fidelidade total, coloque `Manrope-ExtraBold.ttf` e `Manrope-Medium.ttf` em
`tools/content-media/fonts/`.

## Uso

```bash
# tudo (capa + infográfico pt/en + áudio; + ideias se o spec tiver `ideas`)
node generate.mjs --slug summary-atomic-habits

# só o infográfico (não gasta API — bom pra iterar layout)
node generate.mjs --slug summary-atomic-habits --only infographic

# só a capa
node generate.mjs --slug summary-atomic-habits --only cover

# só o áudio (podcast 2 vozes) — precisa de audio-script.<loc>.json
node generate.mjs --slug summary-atomic-habits --only audio

# só as imagens das ideias (uma por entrada de spec.ideas)
node generate.mjs --slug summary-atomic-habits --only ideas

# ver o que rodaria sem escrever nada
node generate.mjs --slug summary-atomic-habits --dry-run
```

`--only` é uma **allowlist**: `cover | infographic | audio | ideas`, um passo
só, e qualquer outro valor é erro (antes era lista de exclusão, e `--only
ideas` regenerava tudo). Uma ideia que falha na API é logada e as outras
seguem — a tela cai na imagem ausente, o material inteiro não.

**Onde fica o spec:** `learning-drops/media-specs/<slug>.json` (**versionado**,
lido primeiro); se não existir, `learning-drops/inbox/<slug>/media-spec.json`
(layout antigo). Os assets e o `manifest.json` continuam em
`learning-drops/inbox/<slug>/` (gitignored).

### Migration das ideias — `emit-migration.mjs`

Junta o spec de ideias aprovado (`learning-drops/ideas-specs/<slug>.json`,
versionado) com o `manifest.json` do drop e escreve a migration que publica
`learning_material.ideas`:

```bash
# um material → supabase/migrations/<hoje>NNNNNN_learning_ideas_<slug>.sql
node emit-migration.mjs --slug catch-up-sleep-weekend

# lote (um arquivo, sufixo _batch) + vídeos do Notebook já cortados
node emit-migration.mjs --slug summary-antifragile --slug glossary-play --videos videos.json

# só olhar o SQL / escolher o caminho
node emit-migration.mjs --slug glossary-play --stdout
node emit-migration.mjs --slug glossary-play --out supabase/migrations/20260910000002_learning_ideas_pilots.sql
```

Cada ideia sai com `image` (do asset `kind: 'idea'` do manifest, casado por
`idea_id`; `null` se não houver) e `video` (`{pt: null, en: null}` salvo o que
vier no `--videos`, no formato
`{"<slug>": {"<idea_id>": {"pt": {path, duration_seconds, poster} | null, "en": …}}}`).
O SQL é `begin;` → guarda que falha se algum slug não existir → um
`update … set ideas = $ideas$…$ideas$::jsonb` por slug → o `delete` das coletas
órfãs (`learning_idea_collect` de ids que saíram do JSON) → `commit;`. Falha
(exit 1) se o payload tiver `$ideas$` ou `$$`, se os ordinais não forem
exatamente `1..n`, se houver menos de 1 ou mais de 5 ideias, id repetido ou
fora de `^[a-z0-9-]{3,40}$`, campo bilíngue faltando ou fonte sem `http(s)`.
Escreve em UTF-8 explícito; o caminho escolhido é sempre impresso. Aplicar
continua sendo `/db-migration`, **depois** de subir as imagens.

**Áudio (Fase B):** o agente `learning-audio-writer` escreve o diálogo de 2 vozes
e salva em `learning-drops/inbox/<slug>/audio-script.<loc>.json`. O
`generate.mjs` (passo `audio`) sintetiza com **Gemini 2.5 Flash TTS
multi-speaker** (24 kHz PCM), corta em segmentos de ~2,4 min (a qualidade
degrada depois de poucos min), costura e converte pra `audio.<loc>.m4a` (AAC
mono 64k). ~US$ 0,15 por episódio de 10 min (25 tokens/seg × $10/1M). Usa a
**mesma `GEMINI_API_KEY`** da capa.

Entrada: `learning-drops/media-specs/<slug>.json` (ou o fallback
`inbox/<slug>/media-spec.json`)
Saída: `learning-drops/inbox/<slug>/` (`cover.webp`, `idea.*.webp`,
`infographic.*.webp`, `*.svg` p/ auditoria, `manifest.json`). A pasta `inbox/`
é gitignored — os assets sobem pro Storage, não pro git.

## Contrato do media spec

Campos com `{ "pt": …, "en": … }` são bilíngues; pode passar string única se for
igual nos dois. O infográfico só é gerado num locale se o `headline` daquele
locale existir.

```jsonc
{
  "slug": "summary-atomic-habits",
  "dimension_id": "craft",            // health|body|mind|wealth|bonds|craft — define a cor de destaque
  "title": { "pt": "…", "en": "…" },  // referência (não renderizado direto)

  "cover": {
    // Cena atmosférica, evocativa, SEM texto. O script já injeta o estilo de
    // marca (fundo escuro, luz dramática, 2:3, "no text").
    "prompt": "Uma fileira de dominós em gradiente de tamanho, o primeiro caindo, luz lateral dramática."
  },

  "ideas": [                          // opcional; 1–5, espelha ideas-specs/<slug>.json
    {
      "id": "sessenta-e-seis-dias",   // IMUTÁVEL — mesmo id do ideas-spec (chave da coleta)
      "ordinal": 1,
      // Cena SEM texto que RETRATA a afirmação da ideia (nunca decoração).
      // O script injeta o mesmo estilo da capa, em 4:5 com o assunto centrado.
      "image_prompt": "Um calendário de parede virando página após página até uma marca dourada no dia 66."
    }
  ],

  "infographic": {
    "eyebrow":  { "pt": "Ofício · Hábitos", "en": "Craft · Habits" },   // linha-guia (vira MAIÚSCULA)
    "headline": { "pt": "66 dias, não 21",  "en": "66 days, not 21" },  // 2–5 palavras, o gancho
    "subhead":  { "pt": "…", "en": "…" },                               // 1 frase (opcional)
    "points": [                        // exatamente 3 — espelham as 3 ideias-herói do artigo
      {
        "n": 1,
        "icon":  "hourglass",                // nome de um Ionicons (o mesmo set do app)
        "title": { "pt": "…", "en": "…" },   // 2–5 palavras
        "body":  { "pt": "…", "en": "…" }    // 1–3 frases curtas (~máx 4 linhas)
      }
      // … pontos 2 e 3
    ],
    "stat": {                          // destaque numérico (opcional)
      "icon":    "repeat",                 // Ionicons (fallback: stats-chart)
      "value":   "~43%",
      "caption": { "pt": "…", "en": "…" }
    },
    "source": { "pt": "Autor et al., Ano · Journal", "en": "…" }
  }
}
```

Veja `media-spec.example.json` para um exemplo completo e preenchido.

## Contrato do `audio-script.<loc>.json` (Fase B)

Escrito pelo agente `learning-audio-writer`, um por locale:

```jsonc
{
  "locale": "pt",
  "hosts": [                          // EXATAMENTE 2 (limite do multispeaker)
    { "name": "Bia", "voice": "Kore" },   // voice = nome de voz prebuilt do Gemini
    { "name": "Téo", "voice": "Puck" }
  ],
  "style": "Leia como um podcast em pt-BR, conversa natural entre Bia e Téo:",
  "turns": [                          // diálogo; speaker casa com hosts[].name
    { "speaker": "Bia", "text": "…" },   // SEM dígitos/símbolos — soletrar ("setenta e um mil")
    { "speaker": "Téo", "text": "…" }
  ]
}
```
