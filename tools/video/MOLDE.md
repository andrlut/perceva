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

## Cenas

| cena | o que mostra | props | ambiente |
|---|---|---|---|
| `pessoa` | A pessoa no centro, peças caindo em volta nas deixas. Gancho, estado, problema. | `mood`, `arms`, `sweat`, `clock` (rapido/calmo/acalma), `objects[≤4]` `{p, cue?, out?}`, `turn`+`to` (o humor vira; pra `feliz` ela comemora e brilha), `glow` | sim |
| `semana` | 7 dias enchendo de tarefas, relógio disparando. Pressa, rotina, acúmulo. | `from`, `until` (deixas do enchimento), `mood` | sim |
| `virada` | A pessoa passa a peça adiante, pro ajudante (que usa a peça) ou ela some, e o humor vira. | `gives` (peça), `helper` (bool), `from` (entrega), `turn` (vira o humor), `to`, `mood`, `clock` (acalma), `objects[≤2]` | sim |
| `multidao` | 20 pessoas, algumas acendem. "Pouca gente / metade / quase todo mundo", SEM número. | `lit` (poucos/metade/muitos), `at` | não |
| `comparar` | Dois painéis lado a lado; um ganha destaque na deixa e o outro só apaga um pouco. | `left`/`right` `{label ≤22, mood?, object?, arrives?, leaves?, ambiente?, hora?}`, `winner` (left/right), `win`, `pill` `{p?, text}`, `chips[]` (sob o vencedor) | por painel |
| `lista` | A pessoa em cima e até 3 itens grandes entrando nas deixas. Passos, sinais, opções. | `items[1..3]` `{icon, text ≤30, cue}`, `mood`, `to` | sim |
| `cena` | A ideia aplicada: a pessoa num lugar com uma peça na mão. | `setting` (sofa/mesa/cama/chao), `holding` (peça), `helper`+`gives`+`from`, `glow`, `objects[≤2]` (**≤6 com ambiente**), `mood` | sim |
| `pensa` | A pessoa pensando; o balão abre com a peça dentro. Dúvida, desejo, lembrança. | `thought` (peça), `at`, `mood`, `turn`+`to`, `objects[≤2]` | sim |
| `mapa` | **O mapa do dia**: blocos de tarefa caem numa folha do dia, cada um com a cor de como pesa; na virada o dia se redesenha pro que energiza. | `blocks[2..6]` (abaixo), `turn`, `mood`, `to`, `glow`, `side` (left/right: lado da pessoa) | sim |
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
| `treinamento` | tela de projeção com slides abstratos, feixe do projetor, palco baixo, cavalete com quadro, quem apresenta (apontando a tela), fileiras de plateia **de costas**, nucas no primeiro plano | slide troca, quem apresenta gesticula, plateia balança | `pouca` = uma fileira esparsa · `muita` = duas fileiras | — |
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
  junto. A plateia de costas é a mesma Pessoa com a cabeça coberta pelo
  cabelo (`DeCostas`, em `src/elenco/cenario.tsx`).
- **Topo e base escurecem** (vinheta fixa): a sobrancelha e a legenda
  continuam legíveis sobre qualquer lugar.
- Os pés da protagonista ficam no chão: cada cena diz onde ela pisa e o
  ambiente se desloca pra isso.

**Peças num ambiente.** Na `cena`, o que é objeto de verdade **pousa** (nas
pontas da mesa com `setting: "mesa"`, no chão dos lados nos outros
`setting`) e o que é símbolo (ícone `ion:`, coração, moeda, relógio…)
flutua no alto. A ordem do `objects` é a ordem de entrada. Se nenhuma peça
pousou na mesa, ela ganha um enfeite do lugar (abajur em casa, planta no
escritório, caneca). Nas outras cenas as peças continuam nos encaixes de
sempre, só que "pousam" (queda curta) em vez de cair do céu.

**No `comparar`**, o ambiente é por painel (`left.ambiente`,
`right.ambiente`): uma miniatura do lugar atrás de cada caminho (a sala de
aula × a mesa de casa). Gente só aparece na miniatura de `treinamento`.

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
| `still` | nada (o mesmo que não pôr `camera`) | — |

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

`transicao` diz como **esta** cena entra (a passagem da anterior pra ela):
`fade` (a de sempre), `zoom` (atravessa: a antiga cresce, a nova chega
grande e assenta), `desliza` (a câmera continua andando de lado), `corte`
(seco). Sem `transicao`: cena com câmera entra com a passagem que combina
com o movimento (pan → `desliza` no mesmo sentido; push/pull/drift →
`zoom`), cena sem câmera entra com `fade` como sempre. Todas cabem no mesmo
crossfade de 10 frames: a duração do vídeo não muda.

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
  pesa**: `drena` = frio e apagado, `neutro`, `energiza` = dourado com
  faísca e brilho), `size` 1..3 (quanto do dia ocupa; soma ≤ 9), `cue`
  (quando cai; sem deixa, os blocos caem em sequência no começo da fala).
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
`ON_FLOOR` (`src/molde/scenes.tsx`). A folha `Elenco` mostra todas.

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
| `src/elenco/cenario.tsx` | as partes do cenário e os figurantes |
| `src/molde/catalog.json` | cenas, peças e enums que o lint e o render leem |
