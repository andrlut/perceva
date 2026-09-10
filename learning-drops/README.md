# Learning drops — do texto ao bucket

Um material novo do Learning nasce em texto, ganha mídia e vira migration. Os
arquivos passam por quatro lugares — dois **versionados**, dois **locais**:

| # | Onde | O que é | Git? | Quem escreve |
|---|---|---|---|---|
| 1 | `ideas-specs/<slug>.json` | O **texto** das ideias (1–5 por material): título-gancho, afirmação, corpo, fontes e `image_brief`. É o que o maintainer aprova. Contrato em [`ideas-specs/README.md`](ideas-specs/README.md). | versionado | `learning-publisher` (drop novo, a partir do payload do drafter) · `learning-idea-cutter` (backfill do legado) |
| 2 | `media-specs/<slug>.json` | Os **prompts** de imagem: `cover.prompt` + um `image_prompt` por ideia (mesmo `id`). Contrato em [`tools/content-media/README.md`](../tools/content-media/README.md). | versionado | `learning-art-director` |
| 3 | `inbox/<slug>/` | Os **assets** gerados (`cover.<sha8>.webp`, `idea.<n>.<sha8>.webp`) + `manifest.json`. Sobem pro bucket `learning-media`, não pro git. Também é onde a rotina do Notebook deixa o deep dive e os vídeos por ideia. | local (gitignored) | `tools/content-media/generate.mjs` · `learning-notebook-runner` |
| 4 | `supabase/migrations/` | Texto (publisher) e mídia (`emit-migration.mjs --with-cover`: `hero_image_url` + `ideas`), aplicadas com `/db-migration` **depois** do upload. | versionado | publisher / `emit-migration.mjs` |

Fluxo de um drop:

```
ideas-specs/<slug>.json  ──►  media-specs/<slug>.json  ──►  generate.mjs  ──►  inbox/<slug>/
      (texto, git)               (prompts, git)             (Gemini)          (assets + manifest)
                                                                                     │
                     /db-migration  ◄──  emit-migration.mjs --with-cover  ◄──  supabase storage cp
```

Áudio (deep dive) e vídeo por ideia **não passam por API de TTS**: vêm do
Gemini Notebook pela rotina `learning-notebook-runner`
(`.claude/agents/learning-notebook-runner.md`), que baixa em `inbox/<slug>/`,
corta com `tools/content-media/video.mjs`, sobe e escreve a própria migration
(`ideas[].video` via `emit-migration.mjs --videos`, deep dive em
`learning_material_media kind='audio'`).

## Estrutura

```
learning-drops/
├── backlog/        # fichas de produção (VERSIONADO) — uma por assunto planejado
├── ideas-specs/    # texto das ideias, um <slug>.json por material (VERSIONADO)
├── media-specs/    # prompts de capa + imagens das ideias (VERSIONADO)
├── reels-specs/    # LEGADO — cards do Explorar dos 31 materiais antigos (VERSIONADO)
├── inbox/          # assets + manifest aguardando upload/ingestão (local, gitignored)
│   └── <slug>/
├── published/      # arquivo morto pós-ingestão (local, gitignored)
├── reels-out/      # cards renderizados do legado (local, gitignored)
└── notebook-runs/  # manifests da rotina do Notebook (local, gitignored)
```

## Convenção de nomes dentro de `inbox/<slug>/`

| Arquivo | O que é | Origem |
|---|---|---|
| `cover.<sha8>.webp` | Capa 2:3 (768×1152), sem texto | `generate.mjs` |
| `idea.<n>.<sha8>.webp` | Imagem 4:5 (960×1200) da ideia `n`; `sha8` muda se o prompt mudar | `generate.mjs` |
| `manifest.json` | O que subir e o que entra no banco (`role: cover|idea`, `bucketPath`, `hero_image_url`) | `generate.mjs` |
| `audio.pt.m4a` / `audio.en.m4a` | Deep dive ("Resumo em Áudio", Padrão), AAC mono 64k | Notebook runner |
| `idea.<n>.<pt|en>.mp4` + `.webp` | Vídeo curto da ideia `n` ("Resumo em Vídeo", Curta) + poster do 1º frame | Notebook runner |
| `media-spec.json` | LEGADO — layout antigo do spec; `generate.mjs` ainda lê como fallback de `media-specs/<slug>.json` | — |
| `infographic.<loc>.webp`, `video.<loc>.mp4`, `deck.<loc>.pdf`, `report.<loc>.md` | LEGADO — mídia dos materiais antigos (drop manual do Notebook, infográfico por SVG) | — |

Só sobe o que existir — o app mostra apenas os modos disponíveis e sinaliza
mídia em uma língua só com um badge (PT/EN).

Metadados (título, dimensão, subs, fonte) vêm da **ficha** correspondente em
`backlog/<slug>.md` e do próprio `ideas-specs/<slug>.json` — nada é duplicado
na pasta do drop.

## Legado (até a Fase 4)

- **`reels-specs/` + `tools/content-media/reels.mjs`**: os cards de teaser do
  Explorar dos materiais que nasceram antes do Recanto em ideias. Drop novo
  **não escreve reels-spec** — o Explorar mostra um card por ideia, direto de
  `learning_material.ideas`. O cutter ainda lê as manchetes daqui no backfill.
- **Infográfico**: não é gerado pra drop novo. As rows `learning_material_media`
  de `infographic`/`reel` dos 31 ficam no ar até a Fase 4;
  `generate.mjs --only infographic` só existe pra reprocessá-los.
- **Áudio por TTS** (`audio-script.<loc>.json` → `generate.mjs --only audio`):
  o agente que escrevia o roteiro foi aposentado; o deep dive vem do Notebook.

## Regras da ingestão

- Áudio NUNCA sobe cru: transcodifica pra AAC mono 64 kbps + `+faststart`
  (~0,5 MB/min) com `--content-type audio/mp4` e cache longo já no 1º upload.
- Vídeo é curto e complementar (não aula inteira): H.264 + AAC em `.mp4` com
  `+faststart`, ≤150 MB (limite do bucket), `--content-type video/mp4`.
  Upload é SEMPRE do maintainer via CLI (`supabase storage cp`) — o bucket não
  tem policy de escrita de cliente e NUNCA aceita upload de usuário. Vídeo por
  ideia vai em `ideas[].video.<lang>` (`path`, `duration_seconds`, `poster`);
  deep dive em `learning_material_media` com `kind='audio'`, `locale`, `path`
  bucket-relativo e `duration_seconds` obrigatório (vira o pill "N min").
- Imagens já saem do `generate.mjs` em webp no tamanho certo; nada de
  reprocessar à mão.
- **Bucket nunca sobrescreve** (409): imagem de ideia re-gerada ganha `sha8`
  novo; capa re-gerada de material já publicado precisa de um path novo.
- Upload primeiro, `storage ls` confere, migration depois — o feed nunca vê 404.
- `released_at` é agendado pelos próximos slots livres (padrão: ter/sex) —
  o feed só mostra materiais com `released_at <= agora`.
