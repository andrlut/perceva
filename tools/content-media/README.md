# content-media — Fase A do pipeline de conteúdo

Gera os **assets de mídia** de um material do Learning a partir de um
`media-spec.json` (escrito pelo agente `learning-art-director`):

- **`cover.webp`** — capa 2:3 atmosférica e **sem texto**, via Gemini 2.5 Flash
  Image (Nano Banana), ~US$ 0,039/imagem.
- **`infographic.<pt|en>.webp`** — infográfico retrato 1080×1920, renderizado de
  **SVG com os tokens de marca do Perceva** (resvg), **US$ 0 de API**.
- **`manifest.json`** — descreve o que subir pro bucket e as linhas a inserir no
  banco. O agente `learning-publisher` (ou você) faz o `supabase storage cp` +
  a migration a partir daí.

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
# tudo (capa + infográfico pt/en)
node generate.mjs --slug summary-atomic-habits

# só o infográfico (não gasta API — bom pra iterar layout)
node generate.mjs --slug summary-atomic-habits --only infographic

# só a capa
node generate.mjs --slug summary-atomic-habits --only cover

# só o áudio (podcast 2 vozes) — precisa de audio-script.<loc>.json
node generate.mjs --slug summary-atomic-habits --only audio

# ver o que rodaria sem escrever nada
node generate.mjs --slug summary-atomic-habits --dry-run
```

**Áudio (Fase B):** o agente `learning-audio-writer` escreve o diálogo de 2 vozes
e salva em `learning-drops/inbox/<slug>/audio-script.<loc>.json`. O
`generate.mjs` (passo `audio`) sintetiza com **Gemini 2.5 Flash TTS
multi-speaker** (24 kHz PCM), corta em segmentos de ~2,4 min (a qualidade
degrada depois de poucos min), costura e converte pra `audio.<loc>.m4a` (AAC
mono 64k). ~US$ 0,15 por episódio de 10 min (25 tokens/seg × $10/1M). Usa a
**mesma `GEMINI_API_KEY`** da capa.

Entrada: `learning-drops/inbox/<slug>/media-spec.json`
Saída: mesma pasta (`cover.webp`, `infographic.*.webp`, `*.svg` p/ auditoria,
`manifest.json`). A pasta `inbox/` é gitignored — os assets sobem pro Storage,
não pro git.

## Contrato do `media-spec.json`

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
