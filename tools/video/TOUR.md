# Tutorial de tela (Remotion)

O vídeo que **ensina uma tela do app**: a porta que abre quando uma aba
destrava (`app/components/unlock/DoorVideo.tsx`) e, depois, qualquer tela que
precise de um "como usar". Não é história com o elenco (isso é o
[MOLDE.md](MOLDE.md), dos vídeos de ideia). Aqui aparece **a tela de verdade**,
com o dedo tocando, a câmera chegando perto e um destaque no que importa.

Por que réplica e não gravação: não dá pra entrar no app pra filmar. Então a
tela é redesenhada em Remotion **a partir do código do app** (mesmos
StyleSheets, tokens, strings dos locales, fonte Manrope e Ionicons), e é ela
que o dedo toca. O toque muda a tela do jeito que o app muda.

```
tools/video/tours/<tela>.json           o roteiro: falas PT/EN + batidas (deixa → foco, toque, câmera)  ← o que se escreve e revisa
        │  node scripts/tour.mjs build
        ▼
public/tour/<tela>.<lang>/               spec resolvido + voz (gitignored)
        │  voice (TTS Gemini Kore + QA por transcrição) → stills (folha de contato) → render
        ▼
out/tour/<tela>.<lang>/pub/doors/<file>.<lang>.r<rev>.mp4 (+ .poster.webp)
        │  upload → bucket learning-media/doors/…
        ▼
DoorVideo.tsx (DOOR_VIDEO_REV) aponta pra revisão nova
```

## As regras do roteiro (o lint barra o que der pra barrar)

1. **Abre com o porquê da tela.** A primeira fala diz pra que a tela existe
   (vem de `<tela>.help.purpose` no `pt.ts`), com a tela inteira à vista
   (`camera: "wide"`), que é o que faz a pessoa reconhecer a tela. *(lint avisa)*
2. **Mostrar e fazer, 3 a 4 elementos.** Cada elemento central da tela é
   destacado e, quando faz sentido, tocado: a tela reage como o app reage.
   Não é lista de funções: é o caminho que a pessoa vai fazer.
3. **Fecha no (i).** A última fala destaca o botão (i) com `pulse`: "a tela
   explica cada parte". *(lint)*
4. **Toda afirmação é o comportamento real.** Confira cada fala contra
   `<tela>.help.items.*.ai` e o código. Se o app não faz, o vídeo não diz. *(revisor)*
5. **Sem dado de pesquisa.** Nenhum estudo, número de pesquisa, "comprovado".
   Número que aparece é o da tela (saldo, preço). *(lint)*
6. **4 a 8 falas, 25 a 40 s, legenda ≤ 150 caracteres**, no máximo um
   `*destaque*` por fala, título e etiqueta ≤ 24. *(lint)*
7. **PT e EN são versões nativas paralelas**, com as MESMAS batidas; só as
   deixas mudam (são trechos literais da fala de cada idioma). *(lint)*
8. **Só toca o que a réplica sabe responder.** Toque que leva pra outra tela
   (Gerenciar, o informativo, o calendário) é `point`: o dedo aponta e não
   toca, porque a réplica não tem a tela seguinte. *(lint)*
9. **Homófono se resolve reescrevendo.** O QA reprovou "Mirar" ouvido como
   "mira" 4 vezes; virou "toque em Mirar e ela vira…".

## Formato

```jsonc
{
  "screen": "rewards",          // a réplica (src/tutorial/screens)
  "fixture": "inicio",          // os dados de mentira (screens/rewards.fixtures.json)
  "file": "rewards", "rev": 2,  // → doors/rewards.<lang>.r2.mp4
  "posterAt": 1.0,              // segundo do pôster (a tela inteira)
  "kicker": { "pt": "Recompensas", "en": "Rewards" },
  "state": { "goal": null },    // opcional: estado inicial além da fixture
  "lines": [
    {
      "id": "redeem",                                   // único; vira o nome do mp3
      "title": { "pt": "Resgatar", "en": "Redeem" },    // o título no topo enquanto a fala dura
      "pt": { "caption": "Quando o saldo cobre o preço, é só tocar em *Resgatar*." },
      "en": { "caption": "When your balance covers the price, just tap *Redeem*." },
      "pre": 0, "hold": 0.3,                            // segundos antes/depois da fala
      "focus": "card0",                                 // campos de batida direto na fala = batida em "@start"
      "beats": [
        { "at": { "pt": "Resgatar", "en": "Redeem" }, "focus": "card0.cta", "do": "tap" },
        { "at": { "pt": "Resgatar", "en": "Redeem" }, "after": 0.1, "focus": "confirm" }
      ]
    }
  ]
}
```

`say` (por idioma) é o que a voz lê quando precisa ser diferente da legenda
(ex.: legenda "(i)", voz "o botão de informação").

### Batida

| campo | o que faz |
|---|---|
| `at` | deixa LITERAL da fala daquele idioma, ou `@start` (começo da fala) / `@end` (fim da fala) |
| `after` | segundos depois da deixa |
| `focus` | alvo do destaque (o resto escurece, anel violeta em volta). `null` apaga |
| `camera` | `focus` (padrão quando há foco: enquadra o alvo) · `wide` (a tela inteira) · `hold` (não mexe: use pra andar o destaque DENTRO de um modal sem cortar o modal) · número = zoom fixo (1 a 2,5) |
| `do` | `tap` (toca, a tela reage) · `point` (aponta sem tocar) · `swipe` (arrasta, com `scroll`) · `hold` (segurar; ainda sem comportamento nas Recompensas) |
| `target` | alvo do dedo, se for outro que o do destaque (ex.: destaca a quantidade e toca no +) |
| `scroll` | rolagem em dp, ou um alvo que sobe pra perto do topo |
| `set` | muda o estado direto (raro: o toque já muda como o app muda) |
| `callout` | etiqueta curta ao lado do alvo (≤ 24); `null` tira |
| `pulse` / `tone` | o anel pulsa (o fecho) · `gold` em vez de violeta |

**Tempo:** o toque cai exatamente na deixa; câmera e destaque chegam 3
quadros antes, o dedo viaja ~0,5 s antes. Uma batida sem ação começa na
deixa e assenta em ~0,5 s. Duas batidas a menos de ~0,5 s uma da outra na
fala ficam corridas: junte num alvo só (ex.: `confirm.amount` = quantidade +
total, em vez de destacar um e depois o outro).

**A mão:** em pé, vindo de baixo. Quando o destaque mostra mais que o botão
tocado e, em pé, a mão cobriria esse resto (o `+` com quantidade e total
destacados: ela sentaria no total que acabou de mudar), o motor a faz entrar
deitada, pela direita, e sair na horizontal (`HANDS` em `engine.ts`). Não há
campo no roteiro pra isso: é a geometria que decide. Depois do toque ela
levanta e espera a próxima ação de onde parou (nunca volta ao ponto do
toque). Quando o toque põe **outra coisa debaixo do dedo** (um modal abre ali,
o Mirar tira o cartão e o de baixo ocupa o lugar), a tela marca o toque com
`lift` (`TimedPatch`, `screens/types.ts`): mão e onda somem em T+8
(`TIME.LEAVE`) e não esperam em cima do que entrou. Fechar um modal e voltar
pra loja não levanta: a mão segue pro próximo gesto.

**Modais:** texto nunca atravessa texto. O cartão vazio entra antes e o texto
dele por cima; na saída o texto sai antes e o cartão vazio depois; o véu é um
só pros dois modais e só desce quando o último cartão saiu. Os alvos de um
modal somem no toque que o fecha (o anel apaga junto com o texto), e os da
loja somem no toque que abre um modal e voltam no que fecha: o anel nunca
cerca um botão que o modal tapou, e a loja não responde a toque por baixo
dele. O destaque que vai pro modal sai logo depois do toque (`after: 0.1`):
câmera e anel abrem junto com o modal, em vez de ficarem no botão já coberto.

## Alvos das Recompensas

`balance` (o herói do saldo) · `info` · `goal` (cartão "Sua meta") ·
`goal.close` · `goal.cta` · `trackCta` (convite "Mirar uma recompensa", sem
meta) · `chips` · `chip.indulgence|good|experience` ·
`section.available|almost|big` · `card0` / `card0.cta` (o 1º cartão da loja e
o botão dele) · `card:<id>` / `card:<id>:cta` (por id da fixture) · `add` ·
`fab.manage` · `fab.calendar` · `fabs` · `nav` · `nav.rewards` · `confirm` ·
`confirm.amount` · `confirm.qty` · `confirm.plus|minus` · `confirm.total` ·
`confirm.redeem` · `confirm.cancel` · `celebration` · `celebration.enjoy` ·
`celebration.undo`. Lista e o que cada toque faz: `src/tutorial/screens/targets.json`.

O toque segue o app: `card…:cta` abre a confirmação quando o saldo paga e
**mira** quando não paga; `confirm.redeem` fecha a confirmação, desconta o
saldo na hora (otimista, como `useRedeemRewardN`) e abre a comemoração; 
`celebration.undo` devolve o que foi pago; Mirar tira o cartão da grade e o
põe no topo (a grade se reorganiza pelos 30% do "Quase lá"). No app a troca é
imediata; aqui o cartão apaga no lugar e o vão só fecha (e a meta só aparece)
em T+22 (`TRACK_SETTLE`), depois que a mão saiu: fechado debaixo do dedo, o
cartão de baixo caía onde a onda ainda estava e parecia ser ele o tocado. A
câmera e o anel que vão pra meta miram onde ela vai entrar (`rectSoon`).

## Como é feito (pra mexer ou fazer outra tela)

| arquivo | papel |
|---|---|
| `src/tutorial/screens/rewardsLayout.ts` | o layout calculado do código do app (cada número comentado com a origem) e os retângulos de TODOS os alvos; o comportamento do toque |
| `src/tutorial/screens/RewardsScreen.tsx` | a réplica desenhada em dp a partir do layout; a animação (saldo, modais, rolagem) |
| `src/tutorial/screens/chrome.tsx` | barra de status, barra de abas flutuante, alça, aro do celular (411 × 760 dp) |
| `src/tutorial/screens/i18n.ts` | importa os locales DO APP (`app/lib/i18n/locales`): a palavra na tela é a do app |
| `src/tutorial/text.ts` + `metrics.json` | larguras do Manrope (fontTools) e a altura de linha do Android, pra medir sem navegador |
| `src/tutorial/engine.ts` | deixas → estado (pelo comportamento), câmera, destaque, dedo, etiqueta |
| `src/tutorial/overlays.tsx` | `Spotlight`, `Finger`, `CameraLayer` (+ `focusCam`/`project`), `Callout` |
| `src/tutorial/Tour.tsx` | a composição `Tour` (cabeçalho, palco, legenda queimada, voz) e o modo `replica` |

**Tela nova** = um `<Tela>Layout.ts` + `<Tela>Screen.tsx` no mesmo contrato
(`screens/types.ts`), registrada em `screens/index.ts` e em `targets.json`,
com fixture em JSON. Compare com o app antes do roteiro: `replica`.

## Comandos

```bash
cd tools/video
node scripts/tour.mjs lint    --tour rewards                       # grátis: roda antes de tudo
node scripts/tour.mjs replica --fixture vitrine --lang pt --scale 1   # só a tela (compare com o print do app)
node scripts/tour.mjs replica --state '{"confirm":{"id":"jogo","qty":2}}' --name confirm
node scripts/tour.mjs build   --tour rewards --silent              # sem voz: tempos estimados, pra quadros grátis
node scripts/tour.mjs stills  --tour rewards --lang pt             # out/tour/rewards.pt/sheet.png + stills/index.json
node scripts/tour.mjs frames  --tour rewards --lang pt --frames 300,420 --scale 1
node scripts/tour.mjs all     --tour rewards --lang both           # build → voz+QA → quadros → vídeo
node scripts/tour.mjs upload  --tour rewards --lang both           # do checkout principal (CLI do supabase)
```

A folha de contato (`out/tour/<tela>.<lang>/sheet.png`, um quadro logo
depois de cada batida) e o `stills/index.json` (o que cada quadro deveria
mostrar) são o que o revisor olha.

Correção cirúrgica: mude a fala, `build` (marca só as que mudaram), `voice`
(regrava só essas, com QA), `render --rev N+1`, `upload`, e suba
`DOOR_VIDEO_REV` no `DoorVideo.tsx`. O bucket nunca sobrescreve.

Agentes: `.claude/agents/tutorial-video-director.md` (escreve o roteiro a
partir do informativo) e `.claude/agents/tutorial-video-reviewer.md` (SCRIPT
e FRAMES).
