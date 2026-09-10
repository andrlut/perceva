# content-media — mídia do Learning (capa + imagens das ideias)

Gera os **assets de mídia** de um material do Learning a partir do media spec
**versionado** que o agente `learning-art-director` escreve em
`learning-drops/media-specs/<slug>.json`:

- **`cover.<sha8>.webp`** — capa 2:3 (768×1152) atmosférica e **sem texto**, via Gemini
  3.1 Flash Image (Nano Banana 2), ~US$ 0,067/imagem a 1K, com **referências de
  estilo** (ver `style-refs/`).
- **`idea.<n>.<sha8>.webp`** — uma imagem **4:5 (960×1200)** por ideia do
  material (Recanto em ideias), mesmo modelo, mesmas referências de estilo e
  mesmo custo da capa; a única diferença é a frase de formato (assunto
  centrado, sem faixa vazia pro título). `sha8` = 8 hex de
  `sha256(id + "\n" + image_prompt)`: mudar o prompt gera um path novo (o bucket
  nunca sobrescreve) e o manifest fica com **uma** entrada por `idea_id`.
- **`manifest.json`** — descreve o que subir pro bucket e o que entra no banco.
  `emit-migration.mjs --with-cover` escreve a migration (capa + ideias) a partir
  dele. Uma rodada parcial (`--only cover`, `--only ideas`) **faz merge** com o
  manifest que já está na pasta em vez de sobrescrevê-lo: entradas anteriores
  são mantidas se o arquivo ainda existir, e descartadas com aviso se não
  existir. Sem isso, retomar uma etapa que falhou apagava as outras do manifest
  e elas nunca subiam.

Um drop novo custa ~US$ 0,07 × (1 + nº de ideias): capa + 5 imagens ≈ US$ 0,40
no teto.

**Legado (só pros 31 materiais antigos, até a Fase 4):** o infográfico
(`infographic.<pt|en>.webp`) e o áudio por TTS (`audio.<loc>.m4a`) continuam
no `generate.mjs`, mas **drop novo não gera nenhum dos dois** — o deep dive e o
vídeo por ideia vêm do Gemini Notebook, pela rotina `learning-notebook-runner`.
Ver [Legado](#legado-até-a-fase-4) no fim.

Este pacote é **isolado do workspace pnpm** de propósito (não arrasta a árvore
do Expo). Instale com `npm install` aqui dentro, não com `pnpm`.

## Referências de estilo (por que a imagem não é só prompt)

O modelo recebe, junto do prompt, **3 capas que já estão no ar** como
referência de estilo — na capa **e** nas imagens das ideias. Isso existe porque
estilo escrito em adjetivos não sobrevive a troca de geração de modelo: na
migração do 2.5 pro 3.1, o mesmo `STYLE_SUFFIX` que produzia o carvão
dessaturado do acervo passou a produzir um roxo saturado. Com as referências, o
look volta a bater. Detalhes, critério de escolha e as chaves
`COVER_STYLE_REFS` / `COVER_STYLE_GLYPH` em
[`style-refs/README.md`](style-refs/README.md).

Se as referências sumirem ou falharem, a geração **degrada pro prompt puro** e
segue — nenhum drop falha por causa disso.

## Setup

```bash
# 1) deps (uma vez)
cd tools/content-media
npm install

# 2) chave do Gemini — capa e imagens das ideias
#    - pega em https://aistudio.google.com  (Get API key)
#    - habilita billing no projeto da chave (geração de imagem não tem free tier)
#    - guarda como env var de usuário:
setx GEMINI_API_KEY "sua-chave"   # reabra o terminal depois
```

ffmpeg é localizado automaticamente (instalação via winget). Override com
`FFMPEG_PATH` se precisar.

## Uso — drop novo (ideias primeiro)

O texto já está aprovado (`learning-drops/ideas-specs/<slug>.json` + o artigo)
quando a mídia começa. Cinco passos, nesta ordem:

```bash
# 1) o agente learning-art-director escreveu learning-drops/media-specs/<slug>.json
#    (cover.prompt + um image_prompt por ideia) — commite junto com o ideas-spec

# 2) gerar: capa + uma imagem por ideia → learning-drops/inbox/<slug>/ + manifest.json
node generate.mjs --slug <slug>

# 3) subir cada asset do manifest (o generate imprime os comandos prontos)
supabase storage cp ./learning-drops/inbox/<slug>/<localPath> ss:///learning-media/<bucketPath> \
  --content-type image/webp --cache-control "public, max-age=31536000, immutable" --experimental --linked
supabase storage ls ss:///learning-media/<slug>/ --experimental --linked   # confere: o feed nunca vê 404

# 4) a migration de mídia: hero_image_url (capa) + ideas, num arquivo só
node emit-migration.mjs --slug <slug> --with-cover

# 5) aplicar com /db-migration (DEPOIS do upload)
```

Sem `--only`, o `generate.mjs` roda capa + ideias; o infográfico e o áudio só
entram se o spec tiver um bloco `infographic` ou se existir um
`audio-script.<loc>.json` na pasta — um spec de drop novo não tem nenhum dos
dois, então nada de legado roda por acidente.

Reprocessar uma etapa:

```bash
node generate.mjs --slug <slug> --only cover    # só a capa
node generate.mjs --slug <slug> --only ideas    # só as imagens das ideias
node generate.mjs --slug <slug> --dry-run       # ver o que rodaria sem escrever nada
```

`--only` é uma **allowlist**: `cover | ideas | infographic | audio`, um passo
só, e qualquer outro valor é erro (antes era lista de exclusão, e `--only
ideas` regenerava tudo). Os dois últimos são legado. Uma ideia que falha na
API é logada e as outras seguem — a tela cai na imagem ausente, o material
inteiro não.

**Onde fica o spec:** `learning-drops/media-specs/<slug>.json` (**versionado**,
lido primeiro); se não existir, `learning-drops/inbox/<slug>/media-spec.json`
(layout antigo, ainda aceito como fallback). Os assets e o `manifest.json`
ficam em `learning-drops/inbox/<slug>/` (gitignored).

Entrada: `learning-drops/media-specs/<slug>.json`
Saída: `learning-drops/inbox/<slug>/` (`cover.<sha8>.webp`, `idea.*.webp`,
`manifest.json`). A pasta `inbox/` é gitignored — os assets sobem pro Storage,
não pro git.

### Migration de mídia — `emit-migration.mjs`

Junta o spec de ideias aprovado (`learning-drops/ideas-specs/<slug>.json`,
versionado) com o `manifest.json` do drop e escreve a migration que publica
`learning_material.ideas` — e, com `--with-cover`, a capa:

```bash
# drop novo: capa + ideias → supabase/migrations/<hoje>NNNNNN_learning_ideas_<slug>.sql
node emit-migration.mjs --slug <slug> --with-cover

# backfill de material que já tem capa: só as ideias
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

**`--with-cover`**: pra cada slug cujo manifest tem um asset `role: "cover"`, a
migration ganha, **antes** do update de `ideas` daquele slug,
`update public.learning_material set hero_image_url = '<hero_image_url>' where slug = '<slug>'`
— o valor é o `hero_image_url` que o `generate.mjs` já gravou no manifest,
reaproveitado verbatim (a base do bucket mora num lugar só). Slug sem capa no
manifest avisa no stderr e sai só com as ideias (um backfill de material
antigo mantém a capa que já tem). O cabeçalho da migration lista a capa junto
das imagens a subir.

O SQL é `begin;` → guarda que falha se algum slug não existir → (capa) → um
`update … set ideas = $ideas$…$ideas$::jsonb` por slug → o `delete` das coletas
órfãs (`learning_idea_collect` de ids que saíram do JSON) → `commit;`. Falha
(exit 1) se o payload tiver `$ideas$` ou `$$`, se os ordinais não forem
exatamente `1..n`, se houver menos de 1 ou mais de 5 ideias, id repetido ou
fora de `^[a-z0-9-]{3,40}$`, campo bilíngue faltando, fonte sem `http(s)` ou
capa sem `hero_image_url` http(s) no manifest. Migrations são write-once: o
script recusa sobrescrever um `--out` que já existe. Escreve em UTF-8
explícito; o caminho escolhido é sempre impresso. Aplicar continua sendo
`/db-migration`, **depois** de subir as imagens.

## Contrato do media spec

Campos com `{ "pt": …, "en": … }` são bilíngues. Drop novo = `cover` + `ideas`;
nada mais.

```jsonc
{
  "slug": "summary-atomic-habits",
  "dimension_id": "craft",            // health|body|mind|wealth|bonds|craft
  "title": { "pt": "…", "en": "…" },  // referência (não renderizado direto)

  "cover": {
    // Cena atmosférica, evocativa, SEM texto. O script já injeta o estilo de
    // marca (fundo escuro, luz dramática, 2:3 com respiro pro título, "no text").
    "prompt": "Uma fileira de dominós em gradiente de tamanho, o primeiro caindo, luz lateral dramática."
  },

  "ideas": [                          // 1–5; espelha ideas-specs/<slug>.json, mesma ordem
    {
      "id": "sessenta-e-seis-dias",   // IMUTÁVEL — mesmo id do ideas-spec (chave da coleta;
                                      // é por ele que emit-migration casa a imagem)
      "ordinal": 1,
      // Versão art-directed do image_brief: MESMA cena, mesmo assunto, mais
      // composição e luz. O script injeta o estilo da capa, em 4:5 com o
      // assunto centrado e sem faixa de título.
      "image_prompt": "Um calendário de parede virando página após página até uma marca dourada no último dia, ocupando o centro do quadro; luz quente vinda da direita."
    }
  ]

  // "infographic": { … }  ← LEGADO, opcional. O linter só valida se existir;
  //                          drop novo não escreve. Ver "Legado" abaixo.
}
```

Backfill de material antigo (já tem capa): o spec pode ter só `ideas` — o
linter avisa "no cover block (ideas-only backfill spec)" e segue.

Validar: `node tools/learning-lint/lint.mjs --spec learning-drops/media-specs/<slug>.json`
(WARN de palavra de texto no prompt — placa, letreiro, tela, logo — é pra
corrigir, não pra ignorar).

## Legado (até a Fase 4)

Nada abaixo roda num drop novo. Fica no repo só pra reprocessar os 31
materiais que nasceram antes do Recanto em ideias.

**Infográfico** — `infographic.<pt|en>.webp`, retrato 1080×1920, renderizado de
**SVG com os tokens de marca** (resvg), US$ 0 de API. É código e não imagem
gerada porque, no benchmark IGenBench (2026), o melhor modelo de imagem acerta
um infográfico inteiro só ~49% das vezes e a completude média de dados é 0,21 —
texto legível dentro de imagem colapsa depois de ~200–800 caracteres, pior em
PT com acento. `node generate.mjs --slug <slug> --only infographic` lê o bloco
`infographic` do spec (`eyebrow`, `headline`, `subhead`, 3 `points` com Ionicons,
`stat`, `source` — `media-spec.example.json` ainda traz um bloco completo).
Fonte: Manrope se houver `Manrope-ExtraBold.ttf` / `Manrope-Medium.ttf` em
`tools/content-media/fonts/`; senão o resvg cai pra Segoe UI.

**Áudio por TTS** — `node generate.mjs --slug <slug> --only audio` sintetiza
`learning-drops/inbox/<slug>/audio-script.<loc>.json` (diálogo de 2 vozes) com
Gemini 2.5 Flash TTS multi-speaker e converte pra `audio.<loc>.m4a` (AAC mono
64k), ~US$ 0,15 por 10 min. **O agente que escrevia esse roteiro
(`learning-audio-writer`) foi aposentado em 2026-09-10** — o deep dive de
material novo é o "Resumo em Áudio" do Gemini Notebook, via
`learning-notebook-runner`. Se algum dia precisar do passo, o roteiro é escrito
à mão no contrato abaixo:

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

**Teaser reels** — `reels.mjs` renderiza os cards do Explorar a partir de
`learning-drops/reels-specs/<slug>.json` (+ `_materials.json`). Material novo
não tem reels-spec: o Explorar mostra um card por ideia, direto do
`learning_material.ideas`.
