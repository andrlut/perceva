# Molde do vídeo de ideia (Remotion)

O vídeo que aparece dentro do card do Recanto, feito por código em vez do
Gemini Notebook. A ideia é contada como **história ilustrada com o elenco
Perceva** e termina com o card virando e a voz lendo o verso.

Por que existe: o Notebook erra em ~5% dos vídeos e não corrige uma cena só.
Aqui o vídeo é **texto revisável**: cada fala é uma linha de JSON, e corrigir
um erro é trocar uma frase e regravar aquela fala.

```
learning-drops/ideas-specs/<slug>.json    título + verso (VERBATIM no vídeo)
learning-drops/video-specs/<slug>.json    o roteiro: falas + cenas + peças + deixas   ← o que se escreve e revisa
        │  node tools/video/scripts/molde.mjs build
        ▼
public/molde/<slug>.<idea>.<lang>/        spec resolvido + voz (gitignored)
        │  voice (TTS Gemini Kore + QA por transcrição) → stills (folha de contato) → render
        ▼
out/molde/<slug>.<idea>.<lang>/pub/idea.<n>.<lang>.r<rev>.mp4 (+ .poster.webp)
        │  upload → bucket learning-media/<slug>/…
        ▼
emit-migration.mjs --videos  →  ideas[].video.{pt,en}
```

## As regras do roteiro (o lint barra o que der pra barrar)

1. **Sem dado de pesquisa.** Nenhum número, %, estudo, pesquisa, amostra,
   participante, universidade, revista, "experimento", "comprovado". Isso
   fica no texto da ideia e no deep dive em áudio. *(lint)*
2. **Fidelidade.** Toda fala sai do corpo da ideia. Onde o texto pede
   cautela, o vídeo fala com cautela ("tende a", "um pouco", "parece render
   mais"). Nunca promete mais do que o texto. *(revisor)*
3. **História, não resumo.** Gancho (a tensão) → o que pesa → a virada → o
   que fazer → verso. Pessoas e objetos fazendo coisas, não slides.
4. **Termina no verso**, que é a cena `verso`, sempre a última, lida
   palavra por palavra do ideas-spec. O roteiro não escreve o verso. *(lint)*
5. **4 a 8 falas, ≤ 58 s estimados**, legenda ≤ 150 caracteres, no máximo
   um `*destaque*` por fala. *(lint)*
6. **Nada pequeno na tela.** As cenas já garantem tamanho. Não force
   multidão em lista nem chip com frase longa (chip ≤ 30 caracteres).
7. **PT e EN são versões nativas paralelas**, não tradução palavra por
   palavra; as deixas de cada idioma são trechos da fala daquele idioma.
8. **Homófono que muda o sentido se resolve reescrevendo.** Se o QA da voz
   reprovar a mesma palavra 4 vezes, troque a palavra.
9. **Lugar e câmera servem à história.** Ambiente quando a fala se passa em
   algum lugar (o trabalho, a aula, a casa, a rua); câmera quando a fala tem
   um movimento (aproximar no que importa, revelar o lugar, acompanhar o
   caminho). Nunca os dois só pra enfeitar. *(revisor)*

## Formato

```jsonc
{
  "slug": "buying-time-chores",
  "ideas": {
    "comprar-tempo": {                       // id da ideia no ideas-spec
      "dimension": "wealth",                 // opcional: o manifest do drop já tem
      "lines": [
        {
          "id": "hook",                      // único; vira o nome do mp3
          "scene": "pessoa",                 // uma das cenas abaixo
          "pt": { "caption": "Quando o dia não cabe nas horas, *vale pagar…?*" },
          "en": { "caption": "When the day won't fit in the hours, *is it worth…?*" },
          "pre": 0, "hold": 0,               // segundos de imagem antes/depois da fala
          "props": {                         // o que a cena mostra; {pt,en} em qualquer texto/deixa
            "mood": "cansado", "clock": "rapido",
            "ambiente": "casa",              // opcional: o lugar atrás da pessoa
            "camera": { "move": "push" },    // opcional: o movimento da fala
            "objects": [{ "p": "vassoura", "cue": { "pt": "dia não cabe", "en": "won't fit" } }]
          }
        },
        { "id": "do", "scene": "verso" }     // sempre a última; o texto vem do card
      ]
    }
  }
}
```

`say` (opcional, por idioma) é o texto que a voz lê quando ele precisa ser
diferente da legenda. **Deixa** (`cue`, `turn`, `from`, `until`, `at`,
`win`, `glow`, `out`, `arrives`, `leaves`, e o `cue` da câmera e dos blocos
do mapa) é um trecho **literal** da fala daquele idioma (maiúscula conta). A
peça entra quando a voz chega ali. Se a deixa não estiver na fala, o lint
reprova.

### Vídeo que não é de ideia (as portas das abas)

Quando toda ideia do roteiro traz `card: { title, claim, file?, image? }`
(em `{pt,en}`), o molde não procura ideas-spec: o verso lê esse `claim`.
`file` dá o nome do mp4 (`doors/rewards.pt.r1.mp4` em vez de
`idea.<n>`) e `image` (caminho no repo) é a frente do card. O `verso`
aceita `done` pra trocar o selo "IDEIA ABSORVIDA". Exemplo:
`learning-drops/video-specs/doors.json` (as portas do onboarding, lidas
por `app/components/unlock/DoorVideo.tsx`).

Com `"bridge": "tour"` a ideia é a **abertura** de um tutorial de tela
(o porquê, antes da tela): 2 a 4 falas, ≤ 24 s, **sem** verso, e o `render`
daqui só sai como conferência; o vídeo de verdade é o da porta, montado pelo
`tour.mjs render` ([TOUR.md](TOUR.md), "Abertura").

## Cenas

| cena | o que mostra | props | ambiente |
|---|---|---|---|
| `pessoa` | A pessoa no centro, peças caindo em volta nas deixas. Gancho, estado, problema. | `mood`, `arms`, `sweat`, `clock` (rapido/calmo/acalma), `objects[≤4]` `{p, cue?, out?, stay?}` (`stay`: a peça já estava em cena na fala anterior, no mesmo encaixe — use com `transicao: "corte"`), `turn`+`to` (o humor vira; pra `feliz` ela comemora e brilha), `glow` | sim |
| `semana` | 7 dias enchendo de tarefas, relógio disparando. Pressa, rotina, acúmulo. | `from`, `until` (deixas do enchimento), `mood` | sim |
| `virada` | A pessoa passa a peça adiante, pro ajudante (que usa a peça) ou ela some, e o humor vira. | `gives` (peça), `helper` (bool), `from` (entrega), `turn` (vira o humor), `to`, `mood`, `clock` (acalma), `objects[≤2]` | sim |
| `multidao` | 20 pessoas, algumas acendem. "Pouca gente / metade / quase todo mundo", SEM número. | `lit` (poucos/metade/muitos), `at` | não |
| `comparar` | Dois painéis lado a lado; um ganha destaque na deixa e o outro só apaga um pouco. Sem `chips`, os painéis são altos (descem pela faixa vazia: miniatura, pessoa, peça e rótulo crescem). | `left`/`right` `{label ≤22, mood?, object?, arrives?, leaves?, ambiente?, hora?}`, `winner` (left/right), `win`, `pill` `{p?, text}`, `chips[]` (sob o vencedor) | por painel |
| `lista` | A pessoa em cima e até 3 itens grandes entrando nas deixas. Passos, sinais, opções. | `items[1..3]` `{icon, text ≤30, cue}`, `mood`, `to` | sim |
| `cena` | A ideia aplicada: a pessoa num lugar com uma peça na mão. | `setting` (sofa/mesa/cama/chao), `holding` (peça), `helper`+`gives`+`from`, `glow`, `objects[≤2]` (**≤6 com ambiente**), `mood` | sim |
| `pensa` | A pessoa pensando; o balão abre com a peça dentro. Dúvida, desejo, lembrança. Com `ambiente: treinamento` ela **senta na plateia** (fileira do meio, encosto da cadeira na frente, turma de costas dos lados) e o balão abre pra esquerda, por cima da lista do slide: é assim que se mostra "assistir a uma aula". Com câmera, o balão encolhe (a cauda fica sobre a cabeça dela) até a nuvem da esquerda ficar ≥ 20 px dentro do quadro no ponto mais perto do movimento. | `thought` (peça), `at`, `mood`, `turn`+`to`, `objects[≤2]` | sim |
| `mapa` | **O mapa do dia**: blocos de tarefa caem numa folha do dia, cada um com a cor de como pesa; na virada o dia se redesenha pro que energiza. Com `label` nos blocos, a folha alarga e cada bloco leva o NOME da tarefa. | `blocks[2..6]` (abaixo), `turn`, `mood`, `to`, `glow`, `side` (left/right: lado da pessoa) | sim |
| `caderno` | **(fase 2, piloto)** O método resolvido num exemplo: a página do caderno em plano fechado, a caneta escrevendo cada tarefa com o nome, uma barra pro tempo e uma marca de energia (↓ tira / – / ↑ dá). Os mesmos `blocks` do mapa, então caderno e mapa contam o mesmo dia. | `blocks[2..6]` com `label` (≤ 16) e `feel` (`size` = tempo, `cue` = quando o nome começa), `from` (coluna do tempo), `at` (coluna da energia), `semana` (deixa: os dias acendem no alto), `heads` (os 3 títulos; default no idioma) | não |
| `verso` | O card vira e a voz lê o verso. **Sempre a última.** | `kicker`, `done` (opcionais) | não |

Toda cena aceita `kicker` (≤ 24 caracteres), a sobrancelha dourada no topo.
A 1ª cena recebe o nome da área se não tiver kicker. Toda cena aceita
`camera` e `transicao` (abaixo); o verso só aceita câmera sem deixa.

O lint conta peças: `objects` além do que a cena desenha é erro (antes era
cortado em silêncio).

## Ambientes (`ambiente`)

O lugar atrás da protagonista, desenhado em três camadas com parallax:
**fundo** (parede, janela, céu, prédios — anda pouco com a câmera), **meio**
(móveis, colegas, plateia, rua — onde mora o movimento ambiente) e
**primeiro plano** (folhas, quina de mesa, poste — desfocado, só nos cantos
de baixo, acima da legenda). Sem `ambiente`, a cena sai exatamente como
antes (o palco navy vazio).

| `ambiente` | o que tem | movimento ambiente | `gente` (default) | `hora` (default) |
|---|---|---|---|---|
| `escritorio` | janela com skyline, estante, relógio de parede, mural de post-its, luminárias pendentes, planta, colegas em mesas com monitor | nuvens, colegas digitando, telas piscando, janelas acesas, ponteiros, folhas | `pouca` = até 2 colegas · `muita` = 4 + alguém passando | `dia` |
| `treinamento` | tela de projeção com slides abstratos que trocam, **todos no mesmo arranjo** (lista à esquerda, sem nada redondo, que é o lado que o balão cobre; gráfico à direita, onde a vareta encosta), feixe do projetor, palco baixo, cavalete com quadro, quem apresenta (de pé no palco, à direita da tela, com uma vareta no gráfico), fileiras de plateia **de costas**, nucas no primeiro plano | slide troca, a ponta da vareta passeia pelo slide, plateia balança | `pouca` = uma fileira esparsa · `muita` = duas fileiras (no `pensa`, a segunda é a dela) | — |
| `casa` | janela com o nascer do sol (ou noite), cortinas, quadro na parede, estante, tapete, mesinha com abajur + caneca + planta (se a cena não tiver mesa) | sol subindo, vapor da caneca, cortina, abajur | `nenhuma` · `pouca` = 1 pessoa · `muita` = 2 | `manha` |
| `cidade` | céu com nuvens e sol/lua, duas camadas de prédios, calçadas, rua com faixa, árvores, poste, ônibus e carro passando, pedestres | nuvens, ônibus/carro, pedestres andando, árvores, janelas acesas | `pouca` = 2 pedestres · `muita` = 4 | `dia` |

`gente`: `nenhuma` / `pouca` / `muita`. `hora`: `manha` / `dia` / `noite`
(muda o céu das janelas e da rua). Os dois só valem com `ambiente`.

Regras que o próprio ambiente garante (não precisa pensar nelas no roteiro):

- **A protagonista é sempre o foco.** Cenário mais escuro e menos saturado,
  um foco de luz com a cor da área atrás dela, sombra separando ela e as
  peças do fundo, e ninguém do cenário entra na faixa onde ela está.
- **Figurante = a mesma `Pessoa`** do elenco, menor e apagada (accent
  neutro + filtro). Quando a identidade das pessoas mudar, o cenário muda
  junto. Duas vistas da identidade entram no cenário, as duas opcionais no
  contrato (`IdentityOption.Costas` e `.Virada`, em `src/identidade/types.ts`):
  a **plateia de costas** é a vista `Costas` (o cabelo da pessoa visto de
  trás, gola por trás, nada do peito: sem rosto, botão nem marca), e **quem
  aponta pro outro lado** é a vista `Virada` (espelhada sem espelhar a marca
  do peito). Uma identidade sem essas vistas cai no desenho genérico
  (`DeCostas` cobre a frente da Pessoa com cabelo e camisa lisa; `Figurante`
  vira a Pessoa com `scaleX(-1)`), em `src/elenco/cenario.tsx`.
- **Nada do cenário fica embaixo do que a cena desenha.** Cada cena declara
  o que põe por cima do lugar (as peças nos encaixes, a da mão, as pontas da
  mesa onde alguma peça pousou, o balão, a folha do mapa, os chips da lista,
  o relógio) e o cenário sai dali:
  - **colega e posto andam juntos.** Se qualquer pedaço do posto (rosto,
    corpo, monitor, mesa) fica embaixo de peça, os dois vão pra beirada do
    mesmo lado; se lá a cabeça encostaria na borda (< 20 px) ou ainda
    sobraria mesa/monitor embaixo de peça, **os dois saem**. Nunca sobra
    colega espremido entre a borda e a peça, nem monitor espiando atrás
    dela. Por isso `pessoa` no escritório com 3–4 peças costuma ficar sem
    colega;
  - móvel do meio sai (a mesinha de casa, quem apresenta);
  - **enfeite do fundo segue a mesma regra**: o relógio e o mural do
    escritório, o quadro da casa e da sala de aula, a planta do canto do
    escritório, o cavalete e o vaso da estante andam pela mesma parede se
    houver lugar livre, ou saem (quadro meio coberto atrás de peça é ruído);
  - o canto do primeiro plano que encostar nisso some sozinho.
  No `mapa`, o cenário só sobra do lado da pessoa.
- **O lugar não repete a peça da fala.** Se a cena mostra o quadro (no
  balão, na mão, caindo), a sala de aula fica sem o cavalete dela; a
  caneca, a planta e o relógio de parede do cenário somem do mesmo jeito.
- **Topo e base escurecem** (vinheta fixa): a sobrancelha e a legenda
  continuam legíveis sobre qualquer lugar.
- Os pés da protagonista ficam no chão: cada cena diz onde ela pisa e o
  ambiente se desloca pra isso.
- **Na sala de aula, quem assiste é a protagonista do `pensa`** (sentada
  na plateia). Nas outras cenas ela fica na frente da turma, virada pra
  câmera, e lê como quem apresenta: o lint avisa.

**Peças num ambiente.** Na `cena`, o que é objeto de verdade **pousa** (nas
pontas da mesa com `setting: "mesa"`, no chão dos lados nos outros
`setting`) e o resto flutua: os dois encaixes grandes do alto vão primeiro
pro que é desenho (envelope, monitor…), e as fichas `ion:` ficam com os
dois de baixo, que passam por cima de estante e móvel (a ficha redonda já
separa do fundo). Desenho que ainda cair num encaixe de baixo vai numa
ficha também. A ordem do `objects` continua sendo a ordem de entrada. Na
mesa, as peças das pontas têm ≥ 120 px de desenho mesmo no plano aberto do
lugar (a mesa fica mais larga com ambiente), e a ponta onde uma peça pousou
é dela inteira: a planta do canto e o vaso da estante atrás dela saem. Se nenhuma peça pousou na
mesa, ela ganha um enfeite do lugar (abajur em casa, planta no escritório,
caneca; na sala de aula a caneca vai pra ponta esquerda, longe da mão de
quem apresenta). Nas outras cenas as peças continuam nos encaixes de
sempre, só que "pousam" (queda curta) em vez de cair do céu.

**No `comparar`**, o ambiente é por painel (`left.ambiente`,
`right.ambiente`): uma miniatura do lugar atrás de cada caminho (a sala de
aula × a mesa de casa). Gente só aparece na miniatura de `treinamento`. A
miniatura segue as mesmas regras do lugar inteiro: nada dela fica embaixo
da peça do painel (a mesinha de casa e quem apresenta saem) e ela não
repete a peça (sem cavalete quando a peça é o quadro). Os dois rótulos têm
o mesmo corpo: no painel alto ele cresce até onde os dois cabem numa linha;
rótulo que não cabe nem assim quebra em duas linhas equilibradas (nunca uma
palavra sozinha embaixo). O rótulo é texto de tela, não fala: dá pra
encurtar sem regravar a voz.

## Câmera (`camera`) e passagem (`transicao`)

```jsonc
"camera": { "move": "push", "focus": "peca", "cue": { "pt": "o que rende", "en": "what works" }, "forca": "leve" }
```

| `move` | o que faz | quando usar |
|---|---|---|
| `push` | aproxima do foco (até ~12%) e traz o foco um pouco pro centro | a frase que importa, a percepção, a virada |
| `pull` | começa perto e abre, revelando o lugar | abrir um lugar novo, o "agora olha o todo" |
| `pan-left` / `pan-right` | atravessa o palco de lado; o fundo anda menos que a pessoa e o primeiro plano anda mais | caminho, rotina, rua, "enquanto isso" |
| `drift` | flutua devagar, quase parada | pensar, manhã calma, respiro |
| `dolly` | (v4) o fundo cresce e a pessoa fica do mesmo tamanho; o fundo desfoca um pouco | "caiu a ficha" — **uma vez por vídeo**, com `cue` |
| `still` | só a câmera na mão (o mesmo que não pôr `camera`) | — |

- `focus`: `pessoa` (default), `peca` (a peça principal da cena: a da mão,
  a do balão, a 1ª que cai), `mapa` (só na cena mapa), ou uma região fixa:
  `centro`, `esquerda`, `direita`, `topo`, `base`.
- `cue` (opcional): sem deixa, o movimento atravessa a cena inteira
  (inclusive o crossfade de saída — nunca congela antes do corte). Com
  deixa, a câmera fica parada até a voz chegar ali e faz o movimento em
  ~1,3 s: um "soco" de câmera na frase que importa.
- `forca`: `leve` (≈ metade) ou `forte` (≈ o dobro; pode cortar o que está
  na borda oposta ao foco — use só quando o resto da cena pode sair).
- A sobrancelha e a legenda nunca se movem.
- **Câmera na mão (v4, sempre ligada):** toda cena com palco respira 3–5 px e
  ±0,2°, por profundidade (o fundo anda menos). Desligar: `HANDHELD = 0` em
  `src/molde/camera.tsx`.
- **Soco de mola (v4):** com `cue`, o movimento é uma mola (`MOLA.camera`,
  fase 1: passa 3,8% do alvo, 90% em 7 quadros; na v4 passava 7,3%).
- **Rack focus (v4):** no `push` (e no `dolly`) o fundo desfoca enquanto a
  câmera chega (até |1 − profundidade| × 7 px); no `pull` ele volta a focar.

`transicao` diz como **esta** cena entra (a passagem da anterior pra ela):
`fade` (mergulho: a antiga apaga na 1ª metade, a nova acende na 2ª), `zoom`
(atravessa: a antiga cresce, a nova chega grande e assenta), `desliza` (a
câmera continua andando de lado), `corte` (seco), `chicote` (whip pan, as
duas cenas correm juntas pro lado, com desfoque horizontal que segue a
velocidade — "em outro lugar", "enquanto isso") e `hexa` (a nova nasce de
dentro de um hexágono que se abre na altura do peito, (540, 1100), com aro
dourado). Todas cabem no mesmo crossfade de 10 frames: a duração do vídeo
não muda.

**Política de passagens (requinte, fase 1 — `passagens()` em
`src/molde/transicao.tsx`; o lint avisa o que cai).** Na v4 cada cena
escolhia a sua e a câmera puxava zoom/desliza: 5 tipos em 7 emendas, e o olho
parava de ler qualquer uma. Agora:

| passagem | vale onde |
|---|---|
| `fade` (mergulho) | o padrão — toda emenda sem pedido, e todo pedido que cai |
| `hexa` | **só o verso** (a assinatura: o hexágono abre o card). Fica automático no verso; pedido em outra cena vira mergulho |
| `chicote` / `desliza` / `zoom` | só quando o roteiro pede, e **só a primeira** do vídeo (o soco). Guarde pra fala que vira a história |
| `corte` | sempre (é emenda de continuidade, não efeito) |

A câmera não escolhe mais a passagem.

## Requinte — fase 1 (acabamento, 2026-11-07)

O que a fase 1 fixou no molde (a régua veio da análise dos 21 estilos da skill
claude-video e das skills oficiais do Remotion; página do André:
https://claude.ai/artifact/3g7iHRpWs4EeEnnsv8Q4Xh):

- **Molas da marca** (`MOLA` em `src/components.tsx`): nenhuma passa de 4%
  do alvo — `pousa` (peça, chip, bloco), `entra` (pessoa, painel, folha,
  card), `peso` (a peça que cai e amassa), `camera` (soco), `vira` (o card
  do verso). Antes iam de 5% a 19% (o amassado do Drop chegava a ~42%).
  Cena nova escolhe uma destas; não inventa mola.
- **Saída mais curta que a entrada** (`sai()` em `src/components.tsx`):
  ease-in de 8 quadros (peça que sai, painel que perde a peça, legenda no
  fim da fala). O olho já leu a coisa.
- **O card do verso vira com mola** (`MOLA.vira`, passa ~3° e assenta) e
  encolhe 4% de lado no meio do giro. Era linear e parava seco.
- **Legenda sem quadro vazio:** o bloco novo nasce a 40% e sobe com
  ease-out; o fim da fala sai em 6 quadros. Sombra curta (a de 18 px virava
  brilho).
- **Lente** (`<Lente>` em `src/components.tsx`): vinheta redonda presa ao
  quadro, por cima das cenas e por baixo da legenda. Na porta, a `Porta` põe
  uma lente só por cima das duas partes.
- **Captura sem perda:** `renderMedia` com `imageFormat: 'png'` (o padrão da
  API é JPEG 80; o `setJpegQuality` do config só vale na linha de comando).
  A versão do app reduz pra 720p com lanczos e `-tune animation` (crf 23).
- O halo dourado do rodapé do fundo saiu (por cima do navy virava uma mancha
  marrom atrás da legenda e do verso).

**O que a fase 1 testou e o André vetou na 1.1 (07/11, vendo o vídeo):**
- *Dourado só no destaque* (peças e sobrancelha em violeta, a cor da área só
  num hexágono pequeno): ficou monótono. As peças, a sobrancelha e o card
  voltaram à cor da ÁREA, com os brilhos e a barra no topo do verso.
- *Grão fixo na lente*: no celular parecia baixa resolução. Saiu.
- *O radar atrás de quem fica feliz* (abaixo): esquisito. Voltaram as
  estrelinhas de brilho.
- **Medidor de ritmo a cada render:** `render` roda `scripts/ritmo.mjs` no
  mp4 e imprime quase-parada, amplitude, picos e os trechos de mais de 1 s
  sem nada grande se mexendo (`<video>.ritmo.json`). Só avisa; `--sem-ritmo`
  pula. A régua dos estilos de referência: 16–55% em quase-parada, nenhum
  buraco de mais de 1 s fora do fim.

## Requinte — fase 2 + "demonstrar a ideia" (piloto, 2026-11-07)

O André comparou o nosso vídeo com o do Notebook da mesma ideia: os dois são
igualmente parados (85–86% em quase-parada), mas o do Notebook mostra o
MÉTODO resolvido num exemplo (tarefas com nome, rótulos, o quadro que se
reorganiza). O piloto troca "ilustrar a frase" por "demonstrar a ideia" nas
falas do método e já leva os moldes da fase 2:

- **Cena `caderno`** e **nome nos blocos do mapa** (`label`): palavra na tela
  pela primeira vez no meio do vídeo (≥ 38 px, ≤ 16 caracteres, sem número —
  o lint barra). O tempo continua sem hora: é o comprimento da barra.
- **Texto por máscara** (`<Mascara>` em `src/components.tsx`): `sobe` (a
  sobrancelha, os rótulos do comparar, os títulos das colunas, o nome da
  marca) e `escreve` (a máscara abre com a caneta na ponta da tinta: nomes
  do caderno e dos blocos). Texto novo não entra só por fade.
- **Verso que acende com a voz:** cada palavra do card sai de 30%, chega
  dourada no quadro em que a voz a diz e assenta no branco.
- **Voz medida** (`pauses.json`, `scripts/pauses.mjs`, gravado pelo
  `molde.mjs` depois do voice e antes de todo stills/render, e pelo `tour.mjs`
  antes de montar a porta — sempre antes do bundle, que copia `public/` na
  hora): começo, fim e pausas reais de cada fala (silencedetect). As deixas
  ancoram nas pausas que casam com pontuação (`src/timeline.ts`), e só se o
  ritmo de leitura que a âncora implica, antes e depois dela, for plausível
  (0,6× a 1,7× da média da fala): uma respiração no meio da frase não pode
  casar com a vírgula mais perto. Entre âncoras, interpola por caractere (a
  pausa casada já está no tempo medido; somar o peso da pontuação contava a
  mesma pausa duas vezes). Cada entrada guarda `dur`; se a fala foi
  regravada e ninguém mediu, a duração não bate com o `timings.json` e o
  Molde volta pra estimativa. É o começo do "tempo real por palavra" sem
  conta nova.
- **Um soco, na virada:** o chicote saiu da aula e foi pro "Outro caminho".
- **Fecho com a marca:** depois do selo, o glyph se desenha e "Perceva" sobe
  ao lado.
- **Luz com origem** (`<Luz>` em `src/molde/ambientes.tsx`): na casa de
  manhã/dia, o facho da janela atravessa a sala com poeira boiando, por
  baixo da pessoa e das peças (peça sempre por cima da luz); no caderno, a
  janela cai na página em dois painéis. Sem facho quando a cena cobre ¾ da
  janela (luz sem origem à vista não vale) ou quando o caminho do facho cai
  em cima do assunto (a folha do mapa, de qualquer lado).
- **O que a revisão do piloto ensinou pro roteiro de "demonstrar":** a tela
  mostra o método, a fala não recita o verso (guarde as palavras dele pro
  card; os substantivos do método — tarefa, tempo, energia — ficam na página,
  e a voz usa verbo concreto); a voz pergunta e o exemplo responde ("como
  ficou a sua energia", e as pílulas dizem tira/dá); não ligue duas coisas
  que o texto não liga ("o que te dá energia" não é "o que você faz bem");
  a sobrancelha não repete o verbo do verso nem entrega a virada; e a deixa
  de cada bloco cai no bloco que a palavra descreve.
- **O card nunca deixa a última palavra sozinha** (as duas últimas palavras do
  verso ficam juntas na quebra de linha).

**Piloto lado a lado** (`--roteiro <arquivo> --tag <nome>`): lê outro
roteiro e grava em chaves à parte (`<slug>.<ideia>-<tag>.<lang>`); a voz e o
vídeo de verdade ficam intocados, e piloto nunca sobe. Use pra testar uma
mudança de roteiro ou de cena lado a lado antes de virar padrão.

**Aprovado pelo André em 07/11** ("ficou top assim"), incluindo o dourado que
cresce no mapa antes do card dizer "faz bem". O piloto virou o roteiro de
verdade (`learning-drops/video-specs/job-crafting-additive.json`, ideia
`faca-o-mapa-voce-mesmo`, revisão r2 no app; ordem caderno → mapa → a
comparação aula × caderno fecha o argumento) e o **Hexa Limpo virou o rosto
padrão** (`src/identidade/active.ts`). O roteirista e o revisor do pipeline
(`.claude/agents/learning-video-director.md` e `learning-video-reviewer.md`)
aprenderam o caderno e as lições da revisão.

**Fraunces itálico** (`public/fonts/Fraunces_Italic_var.ttf`, a variável
itálica oficial do Google Fonts, licença OFL em `public/fonts/Fraunces-OFL.txt`):
nos nomes que a caneta escreve no caderno, com cara de anotação à mão, com o
eixo `WONK` em 0 (com ele, o "l" ganha uma volta e "Emails" lia "Emaiſs"). A reta
continua sendo a `Fraunces_600` estática (nada aprovado muda de desenho).
O destaque do verso continua sendo a cor: trocar de estilo enquanto a voz lê
faria a linha pular.

## O radar no feliz (identidades Hexa v4) — DESLIGADO

Desligado em 07/11 (`RADAR = false` em `src/identidade/options/hexa.tsx`):
o André achou o hexágono atrás da pessoa esquisito e prefere as estrelinhas
de brilho. Com ele desligado, as cenas voltam a pôr as estrelinhas no feliz e
a frente do card continua sendo o Elenco (`frenteElenco` da identidade). O
que segue é a regra, se um dia voltar.

As identidades `hexa-*` desenham atrás de quem fica `feliz` o radar do app
(placa escura, réguas, polígono das 6 áreas enchendo do centro). Regras:
figurante e fundo nunca acendem (`halo={false}`); sentada atrás de mesa o radar
fica em volta da cabeça (`halo="cabeca"`); com o radar aceso as cenas tiram as
estrelinhas de brilho (não dizer "feliz" duas vezes). No roteiro, guarde o
`to: "feliz"` pro momento em que a protagonista se percebe e faz por conta
própria — se todo mundo acende o tempo todo, o símbolo dilui.

## Som (`--sfx`, v4) e identidade (`--identity`)

- `node scripts/molde.mjs render … --sfx` toca efeitos **sintetizados no ffmpeg**
  (`node scripts/sfx.mjs` → `public/sfx/*.wav`, sem licença de terceiros) por
  baixo da voz: whoosh nas passagens que andam (zoom, desliza, hexa,
  chicote), soco grave no `push` com deixa, "bloop" quando uma peça pousa,
  sininho quando alguém vira feliz (o hexágono acende), ar subindo antes do
  verso. Volumes em `src/molde/sfx.tsx` (~−18 a −24 dB sob a voz). Sem
  `--sfx`, silêncio como sempre. Ainda experimental: o André ouve antes de
  virar padrão.
- `--identity <id>` (stills e render) desenha o elenco com outra opção de
  `src/identidade` sem mexer em `active.ts`; o mp4 sai em
  `out/molde/<key>/identidade/<id>[-som].mp4` e **não sobe**.

## Mapa do dia (`mapa`)

```jsonc
{
  "id": "map", "scene": "mapa",
  "pt": { "caption": "No papel, o dia aparece: o que pesa, o que rende. Aí você *puxa o dia pro que rende*." },
  "props": {
    "ambiente": "escritorio", "mood": "cansado", "turn": { "pt": "puxa o dia" },
    "blocks": [
      { "icon": "mail",          "feel": "drena",    "size": 2, "cue": { "pt": "o que pesa" }, "then": { "size": 1 } },
      { "icon": "people",        "feel": "neutro" },
      { "icon": "document-text", "feel": "drena",    "size": 2, "then": { "feel": "energiza", "icon": "color-palette" } },
      { "icon": "bulb",          "feel": "energiza",            "cue": { "pt": "o que rende" }, "then": { "size": 2 } }
    ]
  }
}
```

- Uma folha do dia: sol em cima (manhã), lua embaixo (noite), um trilho sem
  horas. **Nunca hora nem número.**
- Cada bloco: `icon` (Ionicons, diz **o que** é), `feel` (diz **como
  pesa**, em três degraus de luz que se separam sem som no celular:
  `drena` = cinza-azulado frio, sem cor, ícone desbotado; `neutro` = um
  meio-tom violeta claro com ícone claro; `energiza` = dourado com faísca e
  brilho), `size` 1..3 (quanto do dia ocupa; soma ≤ 9), `cue` (quando cai;
  sem deixa, os blocos caem em sequência no começo da fala).
- **Segunda batida** (opcional): na deixa `turn`, todo bloco com `then`
  vira — `then.feel` (muda a cor), `then.size` (cresce/encolhe; o dia se
  redistribui), `then.icon` (vira outra tarefa). A pessoa pega a caneta, o
  humor vai pra `to` (default `feliz`) e os blocos que passam a energizar
  brilham. `then` sem `turn` (ou o contrário) é erro.
- A pessoa fica ao lado (`side`: `left` default, ou `right`).

## Peças

**Elenco desenhado** (`src/elenco/cast.tsx`): `casa`, `relogio`, `moeda`,
`celular`, `sacola`, `vassoura`, `cesto`, `louca`, `livro`, `cama`,
`computador`, `coracao`, `caderno`, `lampada`, `copo` (bebida com colher — pó
misturado na água ou no suco; sem haste nem alça, pra não ler vinho ou café).

**Objetos v2** (`src/elenco/objetos.tsx`): `quadro` (cavalete com esquema
sendo desenhado: aula, explicação), `caneca` (com vapor: café, chá, manhã),
`planta` (vaso com folhas que balançam), `caneta` (marcador: escrever,
redesenhar), `agenda` (o dia em blocos claros e frios: planejar), `monitor`
(tela de mesa que acende, cursor piscando: trabalho no computador),
`papelada` (pilha presa: burocracia, pendência), `envelope` (com aviso
pulando: e-mail, mensagem chegando).

A pessoa, o ajudante, o sofá, a semana, o brilho e todo o cenário
(`src/elenco/cenario.tsx`: janela, estante, mural, pendente, posto de
trabalho, plateia, prédios, árvore, ônibus, carro, poste…) entram pelas
cenas e pelos ambientes; não são peças do roteiro.

**Ícone do app** (`ion:<nome>`, 1.357 do Ionicons, numa ficha redonda): pra
o que o elenco ainda não tem: `ion:barbell`, `ion:bed`, `ion:cafe`,
`ion:easel`, `ion:walk`, `ion:wine`, `ion:people`, `ion:chatbubbles`, … Os
ícones dos chips (`icon`) e dos blocos do mapa são nomes do Ionicons sem o
prefixo.

Peça que aparece em mais de um vídeo merece virar desenho: desenhe em
`objetos.tsx` (mesmas regras do `cast.tsx`: chapado, sem contorno, sombra
num lado só, cores da paleta, `accent` = cor da área, animação por `t` ou
`progress`, nenhum texto), registre em `src/molde/Peca.tsx` e em
`src/molde/catalog.json`. O render quebra se as duas listas divergirem. Se
ela deve pousar na mesa/chão num ambiente, ponha o nome em `ON_DESK` /
`ON_FLOOR` (`src/molde/scenes.tsx`); se a caixa dela não é quadrada, ponha
a proporção em `BOX` (`src/molde/Peca.tsx`: é por ela que o cenário sabe
onde a peça está). A folha `Elenco` (`src/elenco/Sheet.tsx`) lê o registro
do `Peca.tsx`, então mostra todas, mais as pessoas e as vistas de costas e
espelhada da identidade ativa: `COMP=Elenco node scripts/stills.mjs 60`.

## Densidade × legibilidade

O vídeo é visto num celular, sem som, em ~50 s. Mais coisa na tela só vale
se cada coisa continuar lendo:

- **Um assunto por cena.** O ambiente é o lugar, não o assunto: o olho tem
  que ir direto pra pessoa e pra peça da fala.
- Pessoa protagonista ≥ 150 px, peça ≥ 120 px (as das pontas da mesa já têm
  esse tamanho), texto ≥ 38 px. Nada disso muda com ambiente.
- `cena` com ambiente aceita até 6 peças; **3 a 4 é o ponto doce**. Seis só
  quando a fala lista coisas ("o e-mail, a papelada, a reunião…") e cada
  uma tem a sua deixa.
- `gente: "muita"` só quando a multidão é a ideia (a aula cheia, a rua
  movimentada). Pra "pouca gente / a maioria" continua sendo a `multidao`.
- Câmera em 2 a 4 falas por vídeo; o resto parado deixa o movimento contar.
  Não ponha `push` com deixa em duas falas seguidas.
- Ambiente pode se repetir em falas seguidas (é o mesmo lugar): a passagem
  fica contínua. Trocar de lugar a cada fala cansa; 2 a 3 lugares por vídeo.

## Comandos

```bash
cd tools/video
node scripts/molde.mjs lint   --slug <slug>                # grátis: roda antes de tudo
node scripts/molde.mjs all    --slug <slug> --lang both    # build → voz+QA → quadros → vídeo
node scripts/molde.mjs upload --slug <slug> --lang both    # do checkout principal (CLI do supabase)
node scripts/molde.mjs videos --slug <slug> --out ../../learning-drops/inbox/<slug>/videos.json
node ../content-media/emit-migration.mjs --slug <slug> --videos learning-drops/inbox/<slug>/videos.json
```

**Prévia sem voz** (testar cena, ambiente e câmera sem gastar TTS):

```bash
node scripts/molde.mjs build  --slug <slug> --lang pt --silent   # tempos estimados pelo texto
node scripts/molde.mjs stills --slug <slug> --lang pt --at 0.1,0.5,1 --scale 0.3
node scripts/molde.mjs render --slug <slug> --lang pt            # → out/molde/<key>/preview.mp4
node scripts/molde.mjs build  --slug <slug> --lang pt            # volta pro modo de verdade antes da voz
```

O `--silent` grava `timings.silent.json` e marca o spec; o `timings.json` da
voz gravada nunca é sobrescrito. O render de prévia não gera `pub/` nem
`video.json`, então não tem como uma prévia subir pro bucket.

`stills --at 0.1,0.5,1` faz vários quadros por cena (frações da fala, uma
linha por cena na folha): é como se confere câmera, entrada de peça e a
segunda batida do mapa. Sem `--at`, um quadro no fim de cada fala.

**Correção cirúrgica** (o motivo do molde): troque a fala no roteiro, rode
`build` (ele marca só as falas que mudaram), `voice` (regrava só essas, com
QA), `render --rev 2`, `upload --rev 2` e uma migration que aponta o
`video.<lang>` pro `.r2.mp4`. O bucket nunca sobrescreve, então a revisão
anterior continua lá.

A folha de contato (`out/molde/<key>/sheet.png`, um quadro por cena) é o
que o revisor olha. É mais rápido que assistir e pega peça errada, cena
vazia e coisa pequena.

## Onde está cada coisa

| arquivo | o quê |
|---|---|
| `src/molde/scenes.tsx` | as cenas + o `Stage` (ambiente, câmera, sobrancelha) |
| `src/molde/ambientes.tsx` | os 4 ambientes (fundo/meio/primeiro plano), foco de luz, vinheta, miniatura do comparar |
| `src/molde/camera.tsx` | o movimento da câmera e as camadas com parallax |
| `src/molde/transicao.tsx` | as passagens entre cenas |
| `src/elenco/cast.tsx` | a Pessoa e as peças v1 (a Pessoa tem API congelada) |
| `src/elenco/objetos.tsx` | as peças v2 |
| `src/elenco/cenario.tsx` | as partes do cenário e os figurantes (de frente, de costas, a cadeira da plateia) |
| `src/identidade/types.ts` | o contrato da identidade: `Pessoa` + as vistas opcionais `Costas` e `Virada` |
| `src/molde/catalog.json` | cenas, peças e enums que o lint e o render leem |
