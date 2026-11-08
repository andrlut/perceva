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
   Quando o porquê é maior que a tela (por que se recompensar, e não só o
   que a loja faz), ele vira a **abertura** com o elenco (abaixo) e a
   primeira fala do tutorial passa a ser a ponte da história pra tela.
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

### Abertura (`intro`): o porquê com o elenco, antes da tela

`"intro": { "slug": "doors", "idea": "rewards-why" }` abre o vídeo da porta
com 2 a 4 falas do [molde](MOLDE.md) (a pessoa, o lugar, as peças) que
contam **por que a tela vale a pena na vida**, e só então a tela entra, num
zoom pra dentro do celular. A abertura é uma ideia de
`learning-drops/video-specs/<slug>.json` com `"bridge": "tour"`: sem verso,
lint e voz do molde, ≤ 24 s. A composição `Porta`
(`src/tutorial/Porta.tsx`) emenda as duas partes; cada uma guarda o próprio
relógio, voz e legenda. O audit do movimento continua sendo o do tutorial.
Teto da porta inteira: **66 s** (1 min + 10%).

- Mesmas regras do molde na abertura: história, sem estudo nem número, sem
  promessa. Pra Recompensas a régua é a de `docs/brand/base-cientifica.md`
  §2.4 (recompensa autodefinida e imediata; nada de "a recompensa treina
  você", petisco ou celebrar gasto).
- A última fala da abertura e a primeira do tutorial são uma ponte: a
  história termina no princípio, a tela mostra onde ele acontece (r3:
  "Você define a recompensa… E o preço também." → "Aqui, as práticas pagam
  na hora, em moedas…" — o preço é em moedas, e o "na hora" responde ao "só
  lá na frente" do gancho).
- A porta abre **muda**: a legenda é o canal principal, e ela corta no `:`.
  Rótulo seguido de dois-pontos ("É o reforço positivo:") aparece sozinho
  e se cola na frase anterior; escreva a virada ("Aí entra o reforço
  positivo:").
- Na porta a legenda da abertura usa o desenho da do tutorial (centrada,
  52 px, mesma altura: `Molde captions="door"`), pra não pular na passagem.
- Mesma narradora nas duas partes: o `qa-voice` confere a voz (sexo, pergunta
  neutra) além das palavras; uma tomada com outra voz passou no r3 antes disso.
- Ordem: `molde.mjs build --slug doors --idea <id>` + `voice` + `stills`
  (conferir as cenas), depois `tour.mjs build` + `voice` + `stills` +
  `render` (que já sai com as duas partes).

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
deitada, pela direita, e sair na horizontal (`HANDS` em `engine.ts`). Também
entra deitada num alvo rente ao pé do palco, onde em pé ela desceria na
legenda. Não há campo no roteiro pra isso: é a geometria que decide. Quando o
toque põe **outra coisa debaixo do dedo** (um modal abre ali, um modal FECHA e
a loja reaparece embaixo, o Mirar tira o cartão), a tela marca o toque com
`lift` (`TimedPatch`, `screens/types.ts`): mão, disco e onda somem em T+8
(`TIME.LEAVE`), junto com o cartão que sai, e não esperam em cima do que
entrou. Nada do toque sobrevive na tela de baixo (o disco do Aproveita! ficava
2 quadros em cima da loja, encostado no Resgatar do 1 hora de jogo, e a mão
ficava presa na tela enquanto a câmera abria).

As regras da mão (o motor garante e o `plan.audit` confere quadro a quadro;
`HAND` em `engine.ts`):

1. **A mão mora no palco.** Ela nunca atravessa a faixa da legenda nem o
   cabeçalho: a mão inteira (não só a ponta) fica dentro do palco em todo
   quadro. Quando (re)aparece, ela acende **já dentro do palco**, a
   `HAND.ENTRY` (150 px) do primeiro alvo, e anda só isso; se a borda encurta o
   caminho, ela gira o lado de chegada (o `+` rente à direita: entra por baixo).
   Viajando, ela vai pra onde o alvo **vai estar** quando ela chegar (a câmera
   da chegada), em linha reta: seguindo o alvo pela câmera que ainda anda, ela
   descia junto com o FAB do canto. No arrasto ela chega pelo lado oposto ao
   do arrasto, pra seguir no mesmo sentido sem parar. Quando não espera a
   próxima ação, depois do toque ela volta `HAND.EXIT` pelo lado de onde veio,
   apagando. (Antes ela vinha de 430 px abaixo e cruzava "Errou? Desfazer
   devolve." no caminho pro Desfazer.) Aparecendo, ela acende e anda em
   `TIME.ENTRY` (12) quadros.
2. **Andando, a mão nunca passa por cima de um controle que não é dela.** O
   caminho é planejado contra os `controls` (`targets.json`), quadro a quadro e
   com a câmera andando, não é uma linha reta às cegas: a ponta fica a pelo
   menos `HAND.TRANSIT` (24 px) de qualquer controle alheio (o dela é o alvo de
   onde vem e o pra onde vai; apelidos como `card0.cta` contam como dela). Ao
   reaparecer, o lado de chegada é o mais perto do natural (de 12,5° em 12,5°)
   em que o caminho inteiro é limpo e o ponto onde ela acende fica a
   `HAND.CLEAR` dos outros controles, no quadro em que começa e no da chegada.
   Esperando entre dois gestos, a viagem é reta se for limpa, senão uma curva
   que contorna (desvio de ±60 a ±240 px); se nenhuma é limpa, ela sai e
   reentra. Os alvos de um modal que ainda vai abrir (`L.hidden`: geometria só
   pra câmera e destaque mirarem) não são controle, porque não estão na tela.
   (Antes ela descia reta do descanso até o dourado, por cima do Resgatar do
   Café.)
3. **Apontar termina antes de a câmera andar.** Quando o apontar não segue pra
   outro gesto, a mão apaga NO LUGAR, no próprio alvo, em `TIME.POINT_OUT` (8)
   quadros, e some antes de a câmera ou o destaque saírem. Parada na tela com a
   câmera abrindo, a ponta caía no botão do calendário e apagava em cima do
   cartão do Café.
4. **Mão parada nunca fica em cima ou ao lado de um controle.** Esperando entre
   dois gestos (estacionada), a ponta fica a pelo menos `HAND.CLEAR` (60 px a
   1080 de largura) de qualquer controle tocável — os alvos que a tela declara
   em `controls` (`targets.json` → `ScreenModule.controls`): botões, chips,
   abas, o cartão da meta. O ponto de estacionar é escolhido do layout, quadro
   a quadro (a câmera pode andar enquanto ela espera), o mais aberto perto do
   natural. Apontar é exceção só enquanto o destaque está no alvo apontado:
   quando o destaque sai, a mão já parte pro próximo gesto.
5. **O arrasto é 1:1: o conteúdo anda exatamente o que o dedo anda.** Enquanto
   aperta (`TIME.DRAG`, 14 quadros), o dedo fica preso ao MESMO ponto do
   conteúdo: o que estava debaixo dele vai junto. Depois que solta, uma inércia
   curta e honesta (`SWIPE` em `engine.ts`, `swipeProgress` em
   `screens/types.ts`): 78% do caminho com o dedo, 22% de inércia que sai com a
   velocidade da soltura e freia em ~12 quadros. A tela e o dedo leem a mesma
   conta. (Antes o conteúdo andava 2–3× o dedo: a lista escorregava debaixo do
   dedo apertado e o rastro cruzava os Resgatar.) O contato é calculado do
   layout: um ponto neutro do conteúdo (corpo de cartão longe do botão,
   cabeçalho, o vazio) em que, quadro a quadro do arrasto, a mão inteira cabe
   no palco, o dedo está em cima do que rola e fica a `HAND.CLEAR` de qualquer
   controle, inclusive os fixos (FABs, barra de abas). Como o dedo segue o
   conteúdo, isso vale pro caminho inteiro, não só pro contato e pra soltura.
   Solto, o dedo segue no embalo, freando, e apaga em `TIME.LIFT_OFF` (8): depois
   de um arrasto a mão nunca estaciona, o próximo gesto reaparece. No lugar do
   disco e da onda do toque, um rastro curto, encurtado pra nunca cruzar um
   controle. Consequência pro roteiro: um arrasto rola no máximo ~1,25× a altura
   útil da tela com a câmera aberta (`camera: "wide"` no arrasto; com zoom o
   dedo teria que andar mais que o palco). A rolagem do Mirar até o topo
   abre a câmera no arrasto e só depois destaca a meta (`focus` + `"camera":
   "hold"`). Rolagem maior vira dois arrastos.

**Modais:** texto nunca atravessa texto, e nenhum quadro mostra duas camadas
de texto legíveis. O véu sobe primeiro e o cartão vazio sobe junto, opaco no
quadro em que o véu assenta; **só então** entra o texto do cartão (com o véu
ainda subindo, a loja atrás está clara e, pelos 95% do `confirmCardWarm`,
"Disponíveis agora" e os títulos dos cartões liam por trás do texto da
confirmação). O assentado é o do app: véu 0,65, cartão 95% opaco. Na saída o
texto sai antes e o cartão vazio depois; o véu é um só pros dois modais (a
comemoração abre sob o véu já de pé e o texto dela entra em `CONTENT_AT`) e só
desce quando o último cartão saiu. Os alvos de um
modal somem no toque que o fecha (o anel apaga junto com o texto), e os da
loja somem no toque que abre um modal e voltam no que fecha: o anel nunca
cerca um botão que o modal tapou, e a loja não responde a toque por baixo
dele. O destaque que vai pro modal sai logo depois do toque (`after: 0.1`):
câmera e anel abrem junto com o modal, em vez de ficarem no botão já coberto.

**O anel do destaque nunca sai do alvo dele.** Trocar de alvo não estica nem
desliza um anel pela tela (de passagem ele emoldurava chips, "Café especial",
o calendário, "3 ITENS", ou cercava o vazio antes do (i) entrar no quadro): o
anel novo acende NO alvo novo enquanto o velho apaga NO alvo velho
(`TIME.SPOT`). O buraco do véu de cada um é uma máscara: o novo abre na 1ª
metade e o velho fecha na 2ª, então onde os dois se sobrepõem (o cartão e o
botão dele) a tela nunca escurece no meio da troca. Um anel segue o alvo dele
quadro a quadro (a rolagem, a câmera). Um alvo que ainda não existe (a meta,
antes do Mirar assentar) só acende quando aparece. Um que sumiu (o cartão
mirado, o botão que o modal tapou) apaga no último lugar em `LOST_FADE` (6), na
mesma curva ease-out do cartão que sai: em 3 quadros o anel já está a 12%.
Linear, o anel sobrevivia ao cartão e emoldurava o vazio por 2 quadros.
(`SpotLayer` em `engine.ts`, `Spotlight` em `overlays.tsx`.)

**A tela nunca corta.** Quando a grade muda (a meta entra, um filtro), a
réplica anima de um layout pro outro em `REFLOW` (12) quadros, ease-in-out
(`blendRewards` em `rewardsLayout.ts`). O que existe nos dois desliza (posição
e rolagem interpoladas). O que só existe num deles apaga ou acende no lugar,
em sequência, nunca dois textos juntos: a contagem "2 ITENS" → "1 ITEM", o
convite "Mirar uma recompensa" → a meta (que cresce da altura do convite, sem
cobrir os chips). Se a lista encolhe abaixo da rolagem, a rolagem volta pro
fim, como o ScrollView, no mesmo movimento (`scrollMotion: 'instant'`). Antes,
0,73 s depois do Mirar, a lista pulava ~340 px num quadro só, sem causa na tela.

**Títulos:** a troca do título do topo é em sequência: o velho sobe e apaga
(`TIME.TITLE_OUT`, 5 quadros) e só depois o novo sobe e acende
(`TIME.TITLE_IN`, 7). Dois títulos nunca aparecem no mesmo quadro (cruzados,
"Mirar" e "Gerenciar" viravam uma mancha por ~5 quadros em toda troca de fala).
Vale pra qualquer texto que troca no mesmo lugar: um sai, depois o outro entra.

**O audit do movimento** (`plan.audit`, `engine.ts`) varre o filme inteiro,
quadro a quadro, e aponta:

| regra | o que pega |
|---|---|
| `stage` | mão fora do palco (na legenda ou no cabeçalho) |
| `rest` | mão parada (andou menos de 30 px em 6 quadros, fora de um gesto) a menos de `HAND.CLEAR` de um controle |
| `path` | mão andando ou levantando (opacidade ≥ 0,3, sem apertar) a menos de `HAND.TRANSIT` de um controle alheio e mais perto dele que do próprio alvo |
| `contact` | o dedo apertado do arrasto a menos de `HAND.CLEAR` de um controle, no caminho inteiro |
| `drag` | o conteúdo não anda com o dedo apertado (mais de 2 px de diferença entre a ponta e o ponto do conteúdo que ela apertou), ou a inércia passa de 30% do caminho |
| `ring` | um anel aceso fora do próprio alvo (esticado, deslizando), ou ainda visível mais de 3 quadros depois de o alvo sair da tela |
| `jump` | um alvo anda mais de 60 px num quadro **e** 2,5× mais que nos quadros vizinhos: um corte, não uma animação rápida |
| `pop` | mão aparecendo ou sumindo num salto |
| `title` | dois títulos juntos |

As regras foram conferidas por mutação: com o comportamento antigo de cada
problema re-injetado, o audit acusa e o código atual passa com 0:
- arrasto de 455 px com a lista andando 1.232: `drag`;
- apontar preso com a câmera abrindo: `path`;
- viagem reta até o dourado: `path`;
- anel esticando: `ring`;
- anel que apaga linear depois do alvo: `ring`;
- reflow num quadro: `jump`.

O `stills` grava `stills/motion.json` com:

- cada problema, com o quadro;
- cada aparição da mão;
- cada arrasto: curso do dedo × do conteúdo, inércia, folga do caminho e o
  maior desvio dedo × conteúdo;
- cada viagem esperando, com o desvio da curva;
- cada saída de apontar.

O `render` **recusa** quando há problema (`--allow-motion` só pra rascunho).

**O render é o último passo.** Nenhuma edição em `src/tutorial/**`,
`scripts/tour.mjs` ou `tours/<tela>.json` depois dele: o mp4 revisado tem que
ser o do código atual. A prova é o mtime: o arquivo de tour mais novo é mais
velho que os dois mp4. Mexeu depois? `stills` + `render` de novo (o audit
volta com 0).

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
imediata; aqui o cartão apaga no lugar (`LEAVE_FADE`, 6) e a grade se
reorganiza ANIMADA a partir de T+9 (`TRACK_SETTLE`), em `REFLOW` (12) quadros,
com a mão já fora (some em T+8) e a câmera parada. Fechado debaixo do dedo, o
cartão de baixo caía onde a onda ainda estava e parecia ser ele o tocado. A
câmera que vai pra meta mira onde ela vai entrar (`rectSoon`); o anel só acende
quando ela existe.

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
(`screens/types.ts`), registrada em `screens/index.ts` e em `targets.json`
(com a lista `controls`: sem ela a mão não sabe do que guardar distância),
com fixture em JSON. Compare com o app antes do roteiro: `replica`. A rolagem
do arrasto anda em `swipeProgress` com o `scrollMotion` que o motor manda (a
mesma conta do dedo); sem dedo, `SCROLL_EASE`. A grade que muda anima entre os
dois layouts (o `blendRewards` é o modelo), e os alvos de um modal que ainda vai
abrir saem em `L.hidden`.

## Comandos

```bash
cd tools/video
node scripts/tour.mjs lint    --tour rewards                       # grátis: roda antes de tudo
node scripts/tour.mjs replica --fixture vitrine --lang pt --scale 1   # só a tela (compare com o print do app)
node scripts/tour.mjs replica --state '{"confirm":{"id":"jogo","qty":2}}' --name confirm
node scripts/tour.mjs build   --tour rewards --silent              # sem voz: tempos estimados, pra quadros grátis
node scripts/tour.mjs stills  --tour rewards --lang pt             # out/tour/rewards.pt/sheet.png + stills/index.json
node scripts/tour.mjs frames  --tour rewards --lang pt --frames 300,420 --scale 1
node scripts/tour.mjs frames  --tour rewards --lang both --plan plan.json --scale 1 --clean   # janelas de movimento + frames/index.json
node scripts/tour.mjs all     --tour rewards --lang both           # build → voz+QA → quadros → vídeo
node scripts/tour.mjs upload  --tour rewards --lang both           # do checkout principal (CLI do supabase)
```

A folha de contato (`out/tour/<tela>.<lang>/sheet.png`, um quadro logo
depois de cada batida) e o `stills/index.json` (o que cada quadro deveria
mostrar, com `beat` = o quadro da batida e `t` = a distância dela) são o que o
revisor olha. O toque com `lift` é tirado em **T+4**, o contato (dedo
apertando, onda saindo do controle), porque em T+9 a mão já sumiu; o T+9
entra logo depois, se a folha tiver espaço (até 25 quadros), mostrando o que
ocupou o lugar. `stills/marks.json` guarda todas as batidas em quadros (com
`lift` e `handFrom`, o quadro em que a mão parte) — é a base pra montar o
`--plan` do `frames`: uma lista `[{ frame, window, t, expect }]` (ou
`{ pt: [...], en: [...] }`) que vira `frames/index.json`, com o que cada quadro
deveria mostrar. `--clean` apaga a pasta antes: quadro velho engana.

Correção cirúrgica: mude a fala, `build` (marca só as que mudaram), `voice`
(regrava só essas, com QA), `render --rev N+1`, `upload`, e suba
`DOOR_VIDEO_REV` no `DoorVideo.tsx`. O bucket nunca sobrescreve.

Agentes: `.claude/agents/tutorial-video-director.md` (escreve o roteiro a
partir do informativo) e `.claude/agents/tutorial-video-reviewer.md` (SCRIPT
e FRAMES).
