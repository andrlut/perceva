---
name: content-drop
description: Roda o pipeline de conteúdo do Learning sob demanda (agora), no modelo "ideias primeiro" — 1 a 5 ideias + artigo (Claude) + capa e uma imagem 4:5 por ideia (Gemini image API). Use quando o user pedir "gera um conteúdo agora", "novo material do learning", "faz um drop", "corta X em ideias", "backfill das ideias de X", ou invocar `/content-drop`. É a versão on-demand do cron `learning-publisher`. NÃO use pra outros repos.
---

# /content-drop

Dispara o pipeline de conteúdo do Learning **agora**, na sua máquina (onde as
credenciais existem). É a versão manual do cron `learning-publisher`
(dom+qua). Um material = **ideias** (1–5: título-gancho, afirmação, texto de
100–180 palavras, imagem 4:5 sem texto, fontes) + **artigo** (seção "Ler o
texto completo"; os `##` são as ideias) + **capa** 2:3. Infográfico, reels e
áudio TTS estão aposentados pra drops novos — vídeo por ideia e deep dive
vêm da rotina do Notebook (`.claude/agents/learning-notebook-runner.md`).

## Modos

| Invocação | O que faz |
|---|---|
| `/content-drop` | Material novo do zero: planner → researcher → drafter (ideias + artigo) → reviewer → ideas-spec + lint → migration de texto → art-director → imagens → upload → migration de ideias → `db push` → commit. |
| `/content-drop <tema livre>` | Igual, mas semeia o planner com o tema (ex. `/content-drop sono e luz azul`). |
| `/content-drop --slug <slug>` | **Backfill**: corta um material LEGADO que já existe em ideias (cutter lê o banco) — com parada obrigatória pra você aprovar o texto antes de gastar API. |

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
   `idea_budget`) → `learning-researcher` → `learning-drafter` (devolve
   `ideas[]` + artigo) → `learning-reviewer`. Fail closed: sem tema, pesquisa
   rala ou 2 reprovações → aborta limpo.
3. **Ideas-spec**: escreva `learning-drops/ideas-specs/<slug>.json` VERBATIM
   do `payload.ideas` (+ `slug`, `type`, `material_title`) e rode
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
   `inbox/` é gitignored) → `feat(learning): publish <tipo> — <tema> (<n> ideias)`.
   Modo commit-direto no `main` OU PR, conforme a preferência atual do user.

## Processo — backfill de um legado (`/content-drop --slug <slug>`)

Pra um material que já está no ar sem `ideas` (os 31 do catálogo antigo):

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
