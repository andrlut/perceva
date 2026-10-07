# tools/video — vídeos da marca em Remotion

Vídeo como código React. Cores, fontes, hexágono e glyph saem dos mesmos
tokens do app (`src/theme.ts` espelha `app/theme/tokens.ts`), então o vídeo
não destoa da tela. Tudo roda local, e a licença do Remotion é gratuita para
empresas de até 3 pessoas. A narração usa o Gemini TTS e custa centavos por vídeo.

| Filme | Composição | Para quê |
|---|---|---|
| **Manifesto v2** (≤ 60 s, voz Kore) | `Manifesto` (Insta/orgânico) · `ManifestoB` (anúncio, gancho B pra A/B) · `ManifestoApp` (abertura do tutorial, sem CTA) | Vende os 3 módulos (Se conhecer · Praticar · Aprender) e fecha no Emblema. Sem número nem estudo no vídeo; a legenda do post e a base ficam em `copy/manifesto-v2.md`. |
| **Recanto** | `Recanto` | Reels que leva gente pra aba Aprender. Começa em "salvar não é aprender" e termina no jeito de usar o Recanto. |

---

## Começar (primeira vez)

Precisa de **Node 20+** e **ffmpeg** no PATH (no Windows: `winget install Gyan.FFmpeg`).

No Windows, se o render falhar com `spawn ... chrome-headless-shell.exe ENOENT`,
o problema é o limite de 260 caracteres de caminho, não o projeto. O Chrome
que o Remotion baixa fica fundo em `node_modules/.remotion/...`. Clone o repo
numa pasta curta (ex.: `C:\dev\perceva`) ou ligue os caminhos longos do Windows.

```bash
cd tools/video
npm install
npm run studio        # abre o Remotion Studio no navegador (http://localhost:3000)
```

No Studio dá pra escolher a composição na lateral, assistir, arrastar a linha
do tempo e ver cada cena. **As falas aprovadas já estão no git**
(`public/vo*/`), então assistir e renderizar não precisa de chave nenhuma.

```bash
npm run render:recanto   # out/recanto.mp4
npm run render           # out/manifesto.mp4 (Insta/orgânico)
npm run render:b         # out/manifesto-b.mp4 (anúncio, gancho B)
npm run render:app       # out/manifesto-app.mp4 (abertura do tutorial)
npm run stills           # um PNG por cena em out/stills/ (revisão rápida sem MP4)
```

## Mudar o texto ou a voz (precisa de `GEMINI_API_KEY`)

A chave é a mesma da API Gemini (Google AI Studio) que o pipeline de mídia do
Learning usa. Ela entra como variável de ambiente e **nunca vai pro git**.

1. Edite a fala em `src/script.json` (Manifesto) ou `src/script.recanto.json` (Recanto).
2. Regrave só o que mudou: `npm run voice:recanto -- --only hook,save`
3. **Rode o QA antes de mostrar pra alguém:** `npm run qa:recanto -- --fix`.
   Ele transcreve cada fala, compara com o roteiro e regrava o que não bater.
4. `npm run render:recanto`

Formato do roteiro: cada linha é uma cena e um arquivo de voz. `caption` é a
legenda e também o texto que se lê ao gravar. `*palavra*` sai em dourado na
legenda. `say` só existe quando a voz sintética precisa do número por extenso.
`pre` e `hold` dão segundos de imagem antes ou depois da fala.

**O QA já pegou:**
- "Perceva" pronunciado "Perceba" ou "Perseu";
- "Perceba" (o verbo) virando "Perceva";
- fala embolada;
- "mais, só se você pedir" ouvido como "**mas** só se você pedir".

Homófono que inverte o sentido se resolve reescrevendo a frase, não regravando.

Voz: **Kore** é o padrão desde o Manifesto v2. O Recanto foi gravado com a Aoede, e pra regravá-lo com a mesma voz use `--voice Aoede`. Modelo `gemini-3.8-flash-tts`, com a direção de
estilo em `speech_metadata.style`. No 3.8, instrução escrita dentro do
texto é lida em voz alta e deixa a fala lenta. Pra comparar vozes:
`node scripts/tts-gemini.mjs --sample Aoede,Kore,Orus`, depois
`node scripts/judge-voices.mjs out/voices/*.mp3`.

### Trocar pela voz de uma pessoa
Grave cada linha como `public/vo-recanto/<id>.mp3` (celular num cômodo
abafado; o Adobe Podcast Enhance limpa de graça). Depois rode
`npm run voice:recanto -- --measure`, que só remede as durações, e renderize.

---

## Como as peças se encaixam

- **`src/films.ts`**: cada filme é roteiro + pasta de voz + cenas. Pra um vídeo
  novo, crie `src/script.<id>.json`, `src/<id>/scenes.tsx`, uma entrada aqui
  e uma `<Composition>` em `src/Root.tsx`.
- **A duração de cada cena vem da voz.** `timings.json` é medido das falas, e
  `src/timeline.ts` monta a linha do tempo a partir dele. Trocar uma frase
  reajusta tudo sozinho.
- **As animações disparam por deixa**: `cue(s, 'trecho')` é o momento
  estimado em que a fala chega àquele trecho, considerando as pausas.
- **Peças reaproveitáveis**: `components.tsx` (Header, Phone, PracticeRow,
  Footnote, Rich), `Hex.tsx` (o hexágono do app), `Glyph.tsx` (o glyph),
  `Captions.tsx` (legenda queimada, fora da coluna de ícones do Reels).

## Regras antes de publicar (playbook: `docs/brand/`)

- Toda alegação com número sai de `docs/brand/base-cientifica.md`, com
  autor e ano. Nada da lista negra da espinha (§7).
- O Recanto **não** é "método de retenção": o card do fim da ideia mostra a
  resposta. "Tente lembrar antes de virar" é um jeito de usar a revisão
  (a frente mostra só o título), e esse enquadramento ainda está a confirmar
  pelo André (base-cientifica, alegação 14).
- As telas são **réplicas estilizadas**, conferidas contra o código do app
  (rótulos de `pt.ts`, BottomNavBar, IdeaCard). O playbook pede gravação real
  do app; manter o estilo animado é decisão em aberto.
- A música, quando entrar, precisa ser licenciada pra anúncio **e** app
  (Artlist/Epidemic). A biblioteca do Instagram não cobre o app.
- CTA: "Baixa no Android · iPhone: entra na lista" fica só na tela, sem voz,
  pra trocar sem regravar quando o iOS estiver na loja.

A pesquisa por trás do vídeo do Recanto (microlearning, memória,
saber→fazer, mercado e auditoria do app) está em
`docs/brand/research/recanto-microlearning-2026-10.md`.
