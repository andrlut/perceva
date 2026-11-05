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
`win`, `glow`, `out`, `arrives`, `leaves`) é um trecho **literal** da fala
daquele idioma. A peça entra quando a voz chega ali. Se a deixa não estiver
na fala, o lint reprova.

## Cenas

| cena | o que mostra | props |
|---|---|---|
| `pessoa` | A pessoa no centro, peças caindo em volta nas deixas. Gancho, estado, problema. | `mood`, `arms`, `sweat`, `clock` (rapido/calmo/acalma), `objects[≤4]` `{p, cue?, out?}`, `turn`+`to` (o humor vira; pra `feliz` ela comemora e brilha), `glow` |
| `semana` | 7 dias enchendo de tarefas, relógio disparando. Pressa, rotina, acúmulo. | `from`, `until` (deixas do enchimento), `mood` |
| `virada` | A pessoa passa a peça adiante, pro ajudante (que usa a peça) ou ela some, e o humor vira. | `gives` (peça), `helper` (bool), `from` (entrega), `turn` (vira o humor), `to`, `mood`, `clock` (acalma) |
| `multidao` | 20 pessoas, algumas acendem. "Pouca gente / metade / quase todo mundo", SEM número. | `lit` (poucos/metade/muitos), `at` |
| `comparar` | Dois painéis lado a lado; um ganha destaque na deixa e o outro só apaga um pouco. | `left`/`right` `{label ≤22, mood?, object?, arrives?, leaves?}`, `winner` (left/right), `win`, `pill` `{p?, text}`, `chips[]` (sob o vencedor) |
| `lista` | A pessoa em cima e até 3 itens grandes entrando nas deixas. Passos, sinais, opções. | `items[1..3]` `{icon, text ≤30, cue}`, `mood`, `to` |
| `cena` | A ideia aplicada: a pessoa num lugar com uma peça na mão. | `setting` (sofa/mesa/cama/chao), `holding` (peça), `helper`+`gives`+`from`, `glow`, `objects[≤2]`, `mood` |
| `pensa` | A pessoa pensando; o balão abre com a peça dentro. Dúvida, desejo, lembrança. | `thought` (peça), `at`, `mood`, `turn`+`to`, `objects[≤2]` |
| `verso` | O card vira e a voz lê o verso. **Sempre a última.** | `kicker` (opcional) |

Toda cena aceita `kicker` (≤ 24 caracteres), a sobrancelha dourada no topo.
A 1ª cena recebe o nome da área se não tiver kicker.

## Peças

**Elenco desenhado** (`src/elenco/cast.tsx`): `casa`, `relogio`, `moeda`,
`celular`, `sacola`, `vassoura`, `cesto`, `louca`, `livro`, `cama`,
`computador`, `coracao`, `caderno`, `lampada`. A pessoa, o ajudante, o sofá,
a semana e o brilho entram pelas cenas.

**Ícone do app** (`ion:<nome>`, 1.357 do Ionicons, numa ficha redonda): pra
o que o elenco ainda não tem: `ion:barbell`, `ion:bed`, `ion:cafe`,
`ion:easel`, `ion:walk`, `ion:wine`, `ion:people`, `ion:chatbubbles`, … Os
ícones dos chips (`icon`) são nomes do Ionicons sem o prefixo.

Peça que aparece em mais de um vídeo merece virar desenho: desenhe em
`cast.tsx`, registre em `src/molde/Peca.tsx` e em `src/molde/catalog.json`.
O render quebra se as duas listas divergirem.

## Comandos

```bash
cd tools/video
node scripts/molde.mjs lint   --slug <slug>                # grátis: roda antes de tudo
node scripts/molde.mjs all    --slug <slug> --lang both    # build → voz+QA → quadros → vídeo
node scripts/molde.mjs upload --slug <slug> --lang both    # do checkout principal (CLI do supabase)
node scripts/molde.mjs videos --slug <slug> --out ../../learning-drops/inbox/<slug>/videos.json
node ../content-media/emit-migration.mjs --slug <slug> --videos learning-drops/inbox/<slug>/videos.json
```

**Correção cirúrgica** (o motivo do molde): troque a fala no roteiro, rode
`build` (ele marca só as falas que mudaram), `voice` (regrava só essas, com
QA), `render --rev 2`, `upload --rev 2` e uma migration que aponta o
`video.<lang>` pro `.r2.mp4`. O bucket nunca sobrescreve, então a revisão
anterior continua lá.

A folha de contato (`out/molde/<key>/sheet.png`, um quadro por cena) é o
que o revisor olha. É mais rápido que assistir e pega peça errada, cena
vazia e coisa pequena.
