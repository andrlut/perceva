# Learning drops — conteúdo do Gemini Notebook → app

Esteira semi-automática de conteúdo do Learning. Você produz no Gemini Notebook
(ex-NotebookLM) e baixa os arquivos aqui; a ingestão (Claude) transcodifica, sobe
pro bucket `learning-media`, escreve a migration e agenda o release.

## Estrutura

```
learning-drops/
├── backlog/      # fichas de produção (VERSIONADO) — uma por assunto planejado
├── inbox/        # drops aguardando ingestão (local, gitignored)
│   └── <slug>/   # uma pasta por material
└── published/    # arquivo morto pós-ingestão (local, gitignored)
```

## Convenção de nomes dentro de `inbox/<slug>/`

| Arquivo | O que é | Obrigatório? |
|---|---|---|
| `audio.pt.m4a` / `audio.en.wav` | Audio Overview baixado (qualquer extensão de áudio) | não |
| `infographic.pt.png` / `infographic.en.png` | Infográfico exportado | não |
| `deck.pt.pdf` / `deck.en.pdf` | Slide deck em PDF (vira páginas de imagem na ingestão) | não |
| `report.pt.md` / `report.en.docx` | Texto do report (md, docx ou txt) | não |
| `cover.png` | Capa retrato 2:3 (Nano Banana, SEM texto na arte) | recomendado |

Só sobe o que existir — o app mostra apenas os modos disponíveis e sinaliza
mídia em uma língua só com um badge (PT/EN).

Metadados (título, dimensão, subs, fonte) vêm da **ficha** correspondente em
`backlog/<slug>.md` — nada é duplicado na pasta do drop.

## Regras da ingestão

- Áudio NUNCA sobe cru: transcodifica pra AAC mono 64 kbps + `+faststart`
  (~0,5 MB/min) com `--content-type audio/mp4` e cache longo já no 1º upload.
- Imagens viram webp (~1080 px de largura).
- Upload primeiro, `storage ls` confere, migration depois — o feed nunca vê 404.
- `released_at` é agendado pelos próximos slots livres (padrão: ter/sex) —
  o feed só mostra materiais com `released_at <= agora`.
