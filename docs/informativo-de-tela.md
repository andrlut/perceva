# Informativo de tela (o (i))

O (i) do cabeçalho de cada tela é o **informativo**: ensina a mexer na tela. O maior problema do app hoje é as pessoas não saberem usar as telas, então o informativo é feito pra ser lúdico e completo.

**Referência:** Minhas ideias — `app/components/ideas/CollectionGuide.tsx` (PRs #505, #507 e o do modelo do pedido). Toda tela nova copia esse molde.

## O que o informativo tem, de cima pra baixo

1. **Cabeçalho:** título, o **círculo da IA** e o X. O círculo fica sempre ali.
2. **Playground ("Na carta"):** o elemento REAL da tela, com os gestos dela. No Minhas ideias é uma carta da prateleira da pessoa: tocar vira, segurar mostra o menu. Uma mão pulsa até a primeira tentativa.
3. **Passos ("Na tela"):** um `GuideStep` por opção — selo de ícone, palavra-chave, uma frase e uma **réplica** do elemento, desenhada com os mesmos componentes da tela.
4. **Último bloco ("Ainda com dúvida?"):** "Entenda com a IA". A IA fecha o informativo, não abre: o próprio informativo ensina melhor.

## Regras

- **Toda opção da tela é um item.** Cada gesto, botão, filtro, faixa e campo. Se dá pra fazer na tela, tem item.
- **Uma lista ordenada de itens alimenta o informativo E o pedido da IA** (`app/lib/guide.ts`). O que está no informativo está no pedido, por construção. Foi assim que "notas" e "segurar a carta" deixaram de sumir da resposta do Claude: antes o pedido só citava os temas.
- **Cada item tem três textos** em `<tela>.help.items.<chave>`:
  - `title` e `body`: o que o informativo mostra. Curto.
  - `ai`: o detalhe que só o Claude recebe, a mecânica que no informativo fica por conta da réplica (o que tem no menu, onde tocar, o que não apaga).
- **A IA nunca some.** Ligada: violeta, abre conversa nova no Claude com o pedido da tela. Desligada: cinza, leva pros ajustes (`/conector?focus=atalhos`).
- **Réplicas usam os componentes da própria tela** (no Minhas ideias, `CollectionControls`). Inertes e escondidas do leitor de tela.
- **Elemento largo nunca entra espremido.** O informativo é uns 80 de largura mais estreito que a tela: espremido, o botão do cartão de recompensa vazou da borda e "Trimestre" quebrou no meio. Use `GuideFit`, que mostra a peça inteira em miniatura, na proporção da tela.
- **Nenhum dado pessoal no pedido.** Só como a tela funciona; os dados o Claude lê pelo conector.

## Peças prontas (`app/components/guide/`)

| Peça | Pra quê |
|---|---|
| `ScreenInfoButton` | O (i) do canto superior direito: só o glifo, sem fundo de botão. O mesmo em toda aba. |
| `GuidePlayground`, `GuideTryIt`, `GuideGesture`, `GuideTapHint` | A caixa de teste com o elemento real, o rótulo "Experimente", as linhas de gesto e a mão pulsando até a primeira tentativa. `column` empilha quando o elemento é largo. |
| `GuideLabel`, `GuideStep` | O rótulo de seção e a linha de cada opção com a réplica. |
| `GuideFit` | Miniatura: desenha o elemento na largura real da tela e encolhe tudo pra caber, sem cortar. Pra cartões em grade e linhas de botões. |
| `GuideAiButton`, `GuideAiIcon` | A IA, que o `InfoSheet` já põe sozinho no fim e ao lado do X quando recebe `aiPrompt`. |

## Como replicar numa tela nova

1. **Liste as opções da tela.** Cada uma vira uma chave, na ordem em que a pessoa encontra.
2. **Textos, pt e en,** em `<tela>.help`: `title`, `a11y`, `screenName`, `purpose` (uma frase em primeira pessoa: pra que serve a tela), `examples` (completa "com exemplos …"), os rótulos das seções e `items.<chave>.{title, body, ai}`.
3. **Extraia pra componentes** os controles que a réplica vai desenhar, e use-os na tela e no informativo.
4. **Crie `<Tela>Guide.tsx`** com:
   - `<TELA>_GUIDE_ITEMS`, a lista ordenada de chaves;
   - o playground, se a tela tiver gesto;
   - um `Record<chave, { icon, replica }>` com uma linha por passo. O TypeScript recusa compilar com uma chave sem linha;
   - `use<Tela>GuidePrompt()`, que chama `buildGuidePrompt` com `guideItems`.
5. **Na tela:** `<InfoSheet title={…} aiPrompt={use<Tela>GuidePrompt()}><TelaGuide … /></InfoSheet>`.
6. **Teste o pedido:** com a IA ligada, toque no círculo e confira que a resposta do Claude passa por todas as opções.

## Telas que já têm

| Tela | Informativo | Caixa de teste |
|---|---|---|
| Minhas ideias | `components/ideas/CollectionGuide.tsx` | uma carta da prateleira: tocar vira, segurar mostra o menu |
| Práticas | `components/guide/screens/PracticesGuide.tsx` | um `TaskCard` de exemplo: check, arrastar pros dois lados, segurar, tocar no nome |
| Recanto | `components/guide/screens/RecantoGuide.tsx` | a carta do fim da ideia: virar absorve |
| Recompensas | `components/guide/screens/RewardsGuide.tsx` | duas recompensas: resgatar, segurar, mirar |
| Eu | `components/guide/screens/HeroGuide.tsx` | os três pilares mudando o hex, o 6/12 e os ícones das pontas |

Ajustes não tem informativo, de propósito.

**Opções que dependem de módulo** (Missões, Metas, Semana, Habilidades) entram num mapa `GATES` do informativo: somem do informativo **e** do pedido de quem não tem o módulo ligado. Ver `PracticesGuide` e `HeroGuide`.

**Gestos dentro do informativo:** o `InfoSheet` tem o próprio `GestureHandlerRootView`, porque o `Modal` é uma janela à parte no Android. Sem isso, arrastar um cartão de prática dentro do informativo não funciona.

**Nunca abra a folha de verdade de dentro do informativo** (menu, ajuste, confirmação: todas são `Modal` e empilhariam). Mostre uma réplica inerte embaixo da caixa de teste, como o menu do Minhas ideias.

## Depois: MCP de informativos

Quando existir o MCP exclusivo de informativos, os textos `ai` viram o conteúdo que ele serve por tela, e o pedido encolhe pra "leia o guia da tela X e me explique com os meus dados". A lista de itens continua sendo a fonte.
