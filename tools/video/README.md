# tools/video — vídeos da marca em Remotion

Vídeo como código React: cores, fontes, hexágono e glyph saem dos mesmos
tokens do app (`src/theme.ts` espelha `app/theme/tokens.ts`), então o vídeo
nunca destoa da tela. Roda local, sem API paga — a licença do Remotion é
gratuita para empresa de até 3 pessoas.

Primeira peça: **Manifesto** (fixado do Instagram, versão de anúncio e
entrada do app) — os três pilares e por que isso muda quem você está
virando. Roteiro derivado do playbook (`docs/brand/00-espinha.md`): números
só da `base-cientifica.md`, com autor e ano; nada da lista negra.

## Setup (uma vez)

```bash
cd tools/video
npm install
```

## Fluxo

```bash
npm run voice     # voz provisória (sintetizador do Windows) + public/vo/timings.json
npm run studio    # abre o Remotion Studio no navegador: rolar a linha do tempo, ajustar
npm run render    # out/manifesto.mp4 (1080×1920, 30 fps)
node scripts/stills.mjs --scenes   # um PNG por cena em out/stills/, sem gerar o MP4
```

Composições (`src/Root.tsx`):

| id | uso | som |
|---|---|---|
| `Manifesto` | fixado do Insta, Reels, impulsionar | voz + legenda queimada |
| `ManifestoApp` | entrada do app (onboarding) | mudo — som nunca é obrigatório no app; a legenda carrega |

```bash
npx remotion render src/index.ts ManifestoApp out/manifesto-app.mp4 --muted
```

## Como as peças se encaixam

- **`src/script.json`** é a fonte do roteiro: uma linha = uma cena = um
  arquivo de voz. `caption` é a legenda (e o que se lê ao gravar);
  `*palavra*` vira destaque dourado; `say` só existe quando a voz sintética
  precisa de número por extenso.
- **A duração de cada cena vem da voz.** `npm run voice` mede cada WAV e
  grava `timings.json`; `src/timeline.ts` monta a linha do tempo a partir
  dele. Trocar uma frase = rodar `voice` de novo; nada de reajustar quadro
  a quadro.
- As animações dentro da cena disparam por **deixa** (`cue(s, 'trecho')`):
  o momento estimado em que a fala chega àquele trecho.
- `src/scenes.tsx` tem as 12 cenas; `Hex.tsx` e `Glyph.tsx` são o hexágono
  e o glyph do app redesenhados em SVG.

## Trocar pela voz real

1. Grave cada linha de `script.json` (o texto de `caption`) como
   `public/vo/<id>.wav` — `hook.wav`, `study.wav`… Celular num cômodo
   abafado + Adobe Podcast Enhance (grátis) pra limpar.
2. `npm run voice -- -MeasureOnly` — só remede as durações, não sintetiza.
3. `npm run render`.

## Antes de publicar (regras do playbook)

- As telas aqui são **réplicas estilizadas**. A versão final troca por
  gravações reais do app da Play (`scrcpy --record`, tema escuro, conta com
  dados reais) — nada de dado sintético apresentado como real.
- Música: só faixa licenciada para anúncio **e** app (Artlist/Epidemic);
  a biblioteca do Instagram não cobre o uso no app.
- `/perfil`: DISC, Tipos e o "LV" nunca entram no quadro.
