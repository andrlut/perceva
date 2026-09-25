# Editorial — série "Uma ideia com fonte" (carrossel)

Regras pra QUALQUER geração futura de posts desta série — humana ou por agente.
Fonte da verdade maior: **Playbook Perceva** (artifact `29ceffd6…`, cap. 7 Vocabulário,
cap. 9 Sistema de conteúdo, Voz e tom, Identidade visual). Este arquivo resume o que o
gerador não consegue checar sozinho + as lições aprendidas em produção.

## Estrutura do carrossel (5 slides, 1080×1350) — v3, feedback do André (set/2026)

1. **Capa** — imagem 4:5 da ideia (bucket `learning-media`) + moldura noite 24px +
   título em Fraunces (SEM selo de série) + **pill com a fonte curta ("Autor, ano")
   no canto superior direito** + dimensão e wordmark.
2. **Claim** — Fraunces, o dado/tese em uma ou duas frases. **Sem rótulo de seção**
   (rótulos genéricos repetidos saíram); post de mito usa eyebrow2 "O que dizem
   por aí" — aí sim, é narrativa.
3. **Mecanismo** — Manrope, como funciona, até 3 frases. Sem rótulo (mito:
   eyebrow3 "O que a trilha mostra").
4. **O que fazer** — o gesto concreto. Sem rótulo.
5. **Fonte + chamada padrão** — SEMPRE: referência completa em destaque (dourado),
   **print 4:5 da ideia** (com play sobreposto quando o batch marca `"video": true`),
   chamada padrão dos formatos ("pra ler, ver e ouvir…") e botão perceva.app.
   Um elemento de marca por slide: só o glifo do rodapé (regra do André).

## Lições de produção (obrigatórias)

- **Post de mito NUNCA assume que o leitor conhece o mito.** Estrutura obrigatória:
  slide 2 vira `eyebrow2: "O que dizem por aí"` e APRESENTA o número/frase como circula
  (quem nunca viu aprende ali); slide 3 vira `eyebrow3: "O que a trilha mostra"` e faz a
  revelação. A capa vira pergunta ("Leva 23 minutos pra recuperar o foco?") ou afirmação
  autossuficiente ("O número mais famoso sobre casais não tem fonte").
- **Jargão técnico nunca vai na capa** (ex.: "bids"). No corpo, só depois de definido em
  português ("pedidos de atenção").
- **A capa precisa fazer sentido pra quem nunca viu o assunto.** Teste: uma pessoa que
  não conhece o tema entende o que vai ganhar abrindo o carrossel?
- A primeira linha da legenda (a que aparece cortada no feed) segue a mesma regra:
  conta o mito/dado, não o referencia.

## Voz (resumo operacional do Playbook)

- Sem emoji em superfície de marca. Sem exclamação em série. Frases curtas, "você",
  verbo no presente.
- **Número sempre com fonte nomeada** (autor, ano). Nunca "baseado em ciência" solto,
  nunca "comprovado".
- Prometer VER, nunca resultado ("você vai ver", não "você vai dormir melhor").
- Dizer a ressalva quando existir ("14 pessoas num laboratório", "amostra pequena,
  mecanismo plausível").
- Lista negra completa: Playbook cap. 7. O gerador barra mecanicamente os termos mais
  perigosos; o resto é responsabilidade de quem escreve o batch.

## Seleção de ideias

- Fonte: tabela `learning_material` (coluna `ideas`, jsonb) — só materiais
  `is_archived=false`, ideias com `image.path` e `sources[0]` preenchidos.
- **Nunca repetir**: conferir `used-ideas.json` (chave = `image_path`); o gerador avisa,
  mas a seleção deve evitar antes.
- Alternar dimensões entre posts consecutivos (não publicar duas da mesma dimensão em
  sequência).
- `claim`, `mecanismo` e `fazer` são REESCRITOS pra caber nos slides — não copiar o body
  inteiro. `mecanismo` ≤ ~280 caracteres; `fazer` ≤ ~200; sempre fiéis ao body original.

## Legendas (legendas.md do lote)

- Instagram: 1ª linha = gancho autossuficiente; 2º parágrafo = mecanismo + fonte;
  3º = CTA "Recanto, dentro do Perceva. Link na bio."
- TikTok (modo foto): 1–2 frases secas + fonte.
- Hashtags estáveis, sempre as mesmas: `#autoconhecimento #habitos #psicologia #bemestar #perceva`
- Cadência: 2 carrosséis/semana, dimensões alternadas.

## Inglês (contas EN separadas)

- Cada post do batch aceita `"lang": "en"` — o gerador troca as strings fixas
  (série "One idea, with a source", eyebrows, CTA "Perceva's library", tagline
  "See who you're becoming.", dimensões EN).
- **EN é escrito nativo a partir do body.en do banco — NUNCA traduzido do PT.**
  Todas as ideias têm title/claim/body em EN; ~29 têm vídeo EN (`video.en.path`).
- O lote EN acompanha as MESMAS ideias do lote PT da semana (produção única),
  mas cada idioma pode divergir se a ideia foi revisada/removida num deles.
- Legendas EN: mesmo formato; hashtags estáveis EN
  `#habits #selfknowledge #psychology #wellbeing #perceva`.
- Publicação nas contas EN próprias (nunca misturar idiomas num perfil só).
- Ledger: entradas têm `lang` ("pt"/"en", ausente = pt) — a mesma ideia pode
  ser usada uma vez em cada idioma.
- Atenção: ideias são revisadas — o `image_path` (hash) pode mudar entre
  semanas. Se uma busca por hash não achar, procurar pelo slug do material +
  `idea_id`.

## Reels reaproveitados do Recanto

- ~38 das ideias têm vídeo pt pronto (`ideas[].video.pt.path` no jsonb; mp4 vertical
  60–90 s no bucket `learning-media`, com poster). São os vídeos do Explorar do app —
  já nascem no cânone visual; publicar como estão, sem reeditar.
- Ao montar um lote: se a ideia escolhida tem `video.pt`, baixar o mp4 pra pasta do
  post como `reel.mp4` e adicionar bloco de legenda de reel no legendas.md (IG/TikTok
  + título de Shorts). O mesmo arquivo serve em Reels, TikTok e Shorts.
- Preferir ideias COM vídeo no critério de seleção quando o gancho for equivalente —
  um tema com carrossel + reel rende dois posts na semana sem produção extra.
- Cadência sugerida: reel 2–3 dias depois do carrossel do mesmo tema.

## Saída

- PNG RGB **sem canal alpha** (o gerador já remove).
- Lote em `social/lote-AAAA-MM-DD/<slug>/slide-*.png` + `legendas.md` na raiz do lote.
