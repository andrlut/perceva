---
name: content-drop
description: Roda o pipeline de conteúdo do Learning sob demanda (agora), no modelo "ideias primeiro" — ideias (uma por padrão, cada extra justificada; verso = a resposta que dá pra usar, imagem que não engana) + artigo (Claude) + capa e uma imagem 4:5 por ideia (Gemini image API). Categorias Pesquisa / Livro / Fundamentos; Fundamentos (o Perceva por dentro — subs, telas, filosofia) só sai por aqui, pedido pelo mantenedor. Use quando o user pedir "gera um conteúdo agora", "novo material do learning", "faz um drop", "escreve o fundamento de X", "corta X em ideias", "re-corta as ideias de X", ou invocar `/content-drop`. É a versão on-demand do cron `learning-publisher`. NÃO use pra outros repos.
---

# /content-drop

Dispara o pipeline de conteúdo do Learning **agora**, na sua máquina (onde as
credenciais existem). É a versão manual do cron `learning-publisher`
(dom+qua). Um material = **ideias** (uma por padrão, cada extra justificada
por estudo, mecanismo ou ação próprios: título assertivo que nomeia o assunto,
verso com a resposta que dá pra usar — a instrução com o número que se aplica
ou a conclusão seca, nunca a maquinaria do estudo —, texto de 100–180
palavras, imagem 4:5 sem texto que não engane o leitor, fontes) + **artigo** (seção "Ler o texto completo";
os `##` são as ideias) + **capa** 2:3. Infográfico, reels e áudio TTS estão
aposentados pra drops novos — vídeo por ideia e deep dive vêm da rotina do
Notebook (`.claude/agents/learning-notebook-runner.md`).

**Categorias:** `research` (Pesquisa — uma pergunta respondida pela
ciência, escrita pra durar), `book` (Livro — as ideias de uma obra),
`foundation` (Fundamentos — o Perceva por dentro). O cron só sorteia
Pesquisa e Livro; **Fundamentos só sai daqui, quando o mantenedor pede**.

## Modos

| Invocação | O que faz |
|---|---|
| `/content-drop` | Material novo do zero (Pesquisa ou Livro, o planner decide): planner → researcher → drafter (ideias + artigo) → reviewer → ideas-spec + lint → migration de texto → art-director → imagens → upload → migration de ideias → `db push` → commit. |
| `/content-drop <tema livre>` | Igual, mas semeia o planner com o tema (ex. `/content-drop sono e luz azul`). |
| `/content-drop fundamento <parte do app>` | **Fundamentos**: pula o planner e monta o brief com `category: foundation` e a parte do app (uma sub, uma tela, um princípio — ex. `fundamento recompensas`, `fundamento sub sono`). O resto do fluxo é igual. |
| `/content-drop --slug <slug>` | **Re-corte**: corta de novo em ideias um material que já existe (cutter lê o banco) — com parada obrigatória pra você aprovar o texto antes de gastar API. |

## Pré-requisitos

- `cd tools/content-media && npm install` (uma vez; pacote isolado do pnpm).
- **`GEMINI_API_KEY` setado** (env var de usuário; chave do AI Studio com
  billing ligado — geração de imagem não tem free tier). Sem a chave o run
  **aborta antes do planner** — não existe mais fallback sem imagem.
- Supabase CLI logado (`supabase migration list --linked` funciona) pra subir
  assets e aplicar migrations.

## Processo — material novo (`/content-drop [tema]`)

Siga o agente `learning-publisher` (`.claude/agents/learning-publisher.md`) na
íntegra — é o playbook; isto é só o resumo:

1. **Bootstrap**: branch `learning/drop-<slug-provisório>` a partir de
   `origin/main` (ou direto no `main` no modo commit-direto — ver a memória
   `project-learning-publisher-trigger`). Cheque `GEMINI_API_KEY` e o último
   timestamp aplicado (`supabase migration list --linked | tail -5`).
2. **Texto**: `learning-planner` (passe o `[tema]` como dica; o brief traz
   `category`, `idea_budget` — teto — e `main_finding_pt`; em
   `fundamento <parte>` o brief é montado sem planner) →
   `learning-researcher` (conta os achados independentes) →
   `learning-drafter` (devolve `ideas[]` + artigo) → `learning-reviewer`.
   Fail closed: sem tema, pesquisa rala ou 2 reprovações → aborta limpo.
3. **Ideas-spec**: escreva `learning-drops/ideas-specs/<slug>.json` VERBATIM
   do `payload.ideas` (+ `slug`, `category`, `material_title`) e rode
   `node tools/learning-lint/lint.mjs --ideas learning-drops/ideas-specs/<slug>.json`.
   FAIL volta pro drafter uma vez (mesmo orçamento de retries do reviewer).
4. **Migration de texto**: `supabase/migrations/<YYYYMMDD>NNNNNN_learning_material_<slug>.sql`
   como sempre (`learning_material` + `learning_material_sub`; takeaways
   1–5; a coluna `ideas` NÃO entra aqui). Ainda não aplique.
5. **Mídia**: `learning-art-director` escreve
   `learning-drops/media-specs/<slug>.json` (`cover.prompt` +
   `ideas[].image_prompt`, sem os blocos legados) → `node tools/learning-lint/lint.mjs --spec learning-drops/media-specs/<slug>.json`
   → `node tools/content-media/generate.mjs --slug <slug>` (capa + uma
   imagem por ideia; ideia que falha na API é logada e pulada). Suba cada
   asset do `learning-drops/inbox/<slug>/manifest.json` com
   `supabase storage cp <localPath relativo à raiz do repo> ss:///learning-media/<bucketPath> --content-type <contentType> --cache-control "public, max-age=31536000, immutable" --experimental --linked`
   e confira com `supabase storage ls ss:///learning-media/<slug>/ --experimental --linked`
   — o feed não pode ver 404.
6. **Migration de ideias**: `node tools/content-media/emit-migration.mjs --slug <slug> --with-cover`
   (uma migration: `hero_image_url` + `ideas` jsonb com os paths das imagens
   + delete de coletas órfãs; o contador cai em texto + 1). Se a capa
   falhou, o `--with-cover` só avisa e sai com as ideias — publica sem hero e
   diz isso no relatório.
7. **Aplicar**: UM `supabase db push --linked` pras duas. Verifique
   `idea_count`, imagens não nulas e `hero_image_url` (query no passo 12 do
   playbook).
8. **Commit**: `git add -A` (ideas-spec + media-spec + as duas migrations;
   `inbox/` é gitignored) → `feat(learning): publish <categoria> — <tema> (<n> ideias)`.
   Modo commit-direto no `main` OU PR, conforme a preferência atual do user.

## Processo — re-corte de um material publicado (`/content-drop --slug <slug>`)

Pra um material que já está no ar (desde 2026-09-11 o catálogo inteiro já
tem `ideas`; o re-corte aplica as regras novas — uma ideia por padrão,
título e verso que se explicam sozinhos, imagem que não engana, e o trio
entregando o assunto junto):

> **Vídeos e deep dives ficam.** São caros de gerar (fora daqui, no
> Notebook) e o mantenedor decidiu mantê-los mesmo quando o texto muda.
> O `emit-migration.mjs` herda o `video` de cada ideia que sobrevive
> (mesmo `id`) direto da linha atual do banco e, se título, verso ou texto
> mudaram, marca cada lado herdado com `text_revised_at` — o vídeo foi
> gerado antes da revisão. O deep dive é do material inteiro e não é
> tocado. Primeiro uso: 2026-09-22 (30g, solidão, bids, deep work).
>
> **Imagens que não mudaram ficam.** O nome do arquivo é o hash de id +
> `image_prompt`: se o art-director mantiver o prompt palavra por palavra,
> a imagem aprovada continua. Pra gerar só as que mudaram, use
> `generate.mjs --only ideas --idea <id>` — mas o manifest precisa ter as
> que ficaram, com o arquivo na pasta do drop (baixe do bucket), senão o
> merge do manifest descarta e a migration publica essa ideia sem imagem.

1. **Cortar**: dispare `learning-idea-cutter` com o slug. Ele lê o material do
   banco (Management API, User-Agent de CLI), deriva 1–5 ideias sem fato novo
   (artigo + `reasoning_log.main_points` + manchetes do `reels-specs/` legado), mantém
   os `id`s de um `ideas-specs/<slug>.json` anterior se houver, e escreve
   `learning-drops/ideas-specs/<slug>.json` (+ `_review-<lote>.md`). Rode
   `node tools/learning-lint/lint.mjs --ideas learning-drops/ideas-specs/<slug>.json`.
2. **PARE e mostre** `learning-drops/ideas-specs/<slug>.json` (ou o
   `_review-<lote>.md`) pro maintainer aprovar o texto. **Passo humano
   obrigatório** — nada de imagem antes do "ok". Os `id`s ficam definitivos
   depois da primeira migration; é agora que se mexe neles.
3. **Art direction (só ideias)**: dispare `learning-art-director` em modo
   ideias. Ele escreve `learning-drops/media-specs/<slug>.json` com
   `ideas[].image_prompt` e **sem bloco `cover`** quando o material já tem
   `hero_image_url` (o lint avisa "ideas-only backfill spec", é esperado) —
   ou **com** `cover.prompt` se o material não tem capa. Lint:
   `node tools/learning-lint/lint.mjs --spec learning-drops/media-specs/<slug>.json`.
4. **Imagens**: `node tools/content-media/generate.mjs --slug <slug> --only ideas`.
   Se o spec trouxe capa, rode também `--only cover` (o manifest faz merge
   entre rodadas parciais). Use sempre `--only` aqui: a pasta
   `inbox/<slug>/` de um legado pode guardar sobras do fluxo aposentado
   (`audio-script.*.json`) e um run sem `--only` reativaria esse passo.
5. **Upload**: mesmo `supabase storage cp` + `storage ls` do fluxo novo. `cp`
   nunca sobrescreve (409) — pule o que o `ls` já mostra.
6. **Migration**: `node tools/content-media/emit-migration.mjs --slug <slug>`
   (adicione `--with-cover` **só** se uma capa foi gerada). Vários legados de
   uma vez: repita `--slug` — sai uma migration `_batch`.
7. **Aplicar + commit**: `supabase db push --linked`, verificar `idea_count` e
   imagens, `git add -A` (ideas-spec + media-spec + migration) e commit
   `feat(learning): ideias — <slug> (<n> ideias)`.

Ao final, avise que a fila do Notebook (`learning-notebook-runner`) vai gerar
os vídeos por ideia e o deep dive na próxima execução — não é parte deste
comando.

## Notas

- **Custo**: capa ~US$ 0,07 + ~US$ 0,05 por imagem de ideia. Um explainer com
  3 ideias fica em ~US$ 0,22; um resumo com 5 ideias, ~US$ 0,32. Backfill sem
  capa: só as ideias.
- **`inbox/` é gitignored** — só ideas-spec, media-spec e migrations vão pro
  git; os assets vivem no Storage.
- **Idempotência**: slug que já existe vira UPDATE (modo rewrite), nunca
  INSERT duplicado. Ao reescrever, preserve os `id`s das ideias que
  sobrevivem — `emit-migration` apaga as coletas dos ids que somem, e o
  relatório tem que avisar quando isso acontece. Imagem re-briefada ganha
  path novo (`sha8` muda); o bucket nunca sobrescreve.
- **Imagem que falhou**: publica mesmo assim com `image: null` (a tela mostra
  placeholder na cor da dimensão) e lista os ids no relatório; um
  `generate.mjs --only ideas` + re-emit depois completa.
- **Legado**: infográfico, reels e o `learning-audio-writer` não rodam mais
  em drops novos. Vídeo por ideia e deep dive em áudio = rotina do Notebook
  (`.claude/agents/learning-notebook-runner.md`).
