# style-refs — as capas que ensinam o estilo ao modelo

Imagens de referência mandadas junto com o prompt na geração de capa
(`lib/styleRefs.mjs` carrega, `lib/cover.mjs` envia). Cada arquivo aqui é uma
capa que **está no ar no app**; `manifest.json` guarda a procedência de cada um.

## Por que existe

O look da casa morava inteiro no `STYLE_SUFFIX`, um parágrafo de adjetivos.
Adjetivo não sobrevive a troca de geração de modelo: o `gemini-2.5-flash-image`
e o `gemini-3.1-flash-image` leem as mesmas palavras e desenham coisas
diferentes. Medido na migração pro 3.1, mesmo prompt, mesma capa:

| Referências | Resultado |
|---|---|
| Nenhuma (só o prompt) | Roxo/índigo saturado. Segue o texto ao pé da letra e **não** parece as capas do app. |
| As 3 capas daqui | Carvão dessaturado, sálvia secundário, um foco âmbar. Igual ao acervo. |
| 2 capas + o glifo | Volta pro roxo saturado — o glifo puxa a paleta do tile da marca. |

Ou seja: as referências ganham do texto, e são elas que mantêm a continuidade
visual do feed.

## Como as três foram escolhidas

Não é gosto, é o que o acervo já faz de forma consistente: fundo carvão-navy
dessaturado, ilustração flat, assunto ancorado no terço inferior com os dois
terços de cima quase vazios (é onde o app sobrepõe o título), uma única luz
âmbar como foco e um secundário sálvia discreto.

Os assuntos são deliberadamente distintos entre si — figuras humanas, interior
arquitetônico, natureza-morta. Se as três tivessem o mesmo tipo de assunto, o
modelo tenderia a puxar o assunto junto com o estilo.

A capa do **ikea-effect** foi excluída de propósito: é clara, morna e quase 3D,
o ponto fora da curva do catálogo. Usá-la ensinaria o modelo errado.

## Mexer aqui

Pra trocar uma referência, copie de `learning-drops/inbox/<slug>/cover.webp` ou
do bucket público
(`.../storage/v1/object/public/learning-media/<slug>/cover.webp`) e atualize a
entrada no `manifest.json`. **Mantenha três**: é o teto de imagens de
referência de estilo do Gemini 3.x flash. Mantenha 2:3 — referência retrato
reforça o `aspectRatio` pedido em vez de brigar com ele.

Trocar um arquivo daqui muda o estilo de **toda capa futura**, então é uma
mudança de diff revisável, nunca um download em runtime.

## Chaves de ambiente

| Var | Efeito |
|---|---|
| `COVER_STYLE_REFS=none` | Desliga as referências (volta ao prompt puro). |
| `COVER_STYLE_REFS=a.webp,b.webp` | Lista explícita, relativa a esta pasta. |
| `COVER_STYLE_GLYPH=on` | Inclui o glifo. **Desligado por default** — mediu pior (tabela acima), e mandar um logo como referência de estilo é o caminho mais curto pra ele aparecer estampado numa capa que, por contrato, não pode ter marca. |

O `glyph.svg` é gêmeo em SVG plano do `app/components/PercevaGlyph.tsx`
(paleta midnight, com tile), rasterizado em runtime pelo resvg — que já é
dependência do pacote por causa do infográfico. Se o componente mudar, espelhe
aqui.
