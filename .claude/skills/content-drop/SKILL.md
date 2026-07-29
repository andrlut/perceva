---
name: content-drop
description: Roda o pipeline de conteúdo do Learning sob demanda (agora), gerando material completo — texto (Claude) + capa (Gemini image API) + infográfico (SVG/resvg). Use quando o user pedir "gera um conteúdo agora", "novo material do learning", "faz um drop", "gera a capa/infográfico de X", ou invocar `/content-drop`. É a versão on-demand do cron `learning-publisher`. NÃO use pra outros repos.
---

# /content-drop

Dispara o pipeline de conteúdo do Learning **agora**, na sua máquina (onde as
credenciais existem). É a versão manual do cron `learning-publisher`
(dom+qua). Fase A: texto + **capa** (Gemini 2.5 Flash Image) + **infográfico**
(render local de SVG, sem custo de API).

## Modos

| Invocação | O que faz |
|---|---|
| `/content-drop` | Material novo do zero: planner → researcher → drafter → reviewer → publica texto → **mídia** → ingere → commit. |
| `/content-drop <tema livre>` | Igual, mas semeia o planner com o tema (ex. `/content-drop sono e luz azul`). |
| `/content-drop --slug <slug>` | **Só mídia** pra um material que já existe (ex. dar capa/infográfico a um artigo antigo). Pula a escrita. |
| `/content-drop --slug <slug> --only infographic` | Só o infográfico (não gasta API). Também aceita `--only cover`. |

## Pré-requisitos

- **Infográfico**: nenhum além de `cd tools/content-media && npm install` (uma vez).
- **Capa**: `GEMINI_API_KEY` setado (chave do AI Studio com billing ligado —
  geração de imagem não tem free tier). Sem a chave, o run ainda entrega o
  infográfico e só pula a capa, avisando.
- Supabase CLI logado (`supabase migration list --linked` funciona) para ingerir.

## Processo — material novo (`/content-drop [tema]`)

Siga o agente `learning-publisher` (`.claude/agents/learning-publisher.md`) na
íntegra — ele já inclui o passo de mídia (6b). Resumo:

1. **Branch**: `git switch -c learning/drop-<slug-provisório> origin/main` (ou
   trabalhe direto no `main` no modo commit-direto — ver a memória
   `project-learning-publisher-trigger`). Escolha um timestamp de migration `>`
   o último aplicado (`supabase migration list --linked | tail -5`).
2. **Texto**: dispare `learning-planner` (passe o `[tema]` como dica se houver)
   → `learning-researcher` → `learning-drafter` → `learning-reviewer`. Fail
   closed: se o planner não achar tema ou a pesquisa vier rala, aborte limpo.
3. **Migration de texto**: escreva + `supabase db push --linked`.
4. **Mídia (6b)**: dispare `learning-art-director` com o payload do drafter →
   ele escreve `learning-drops/inbox/<slug>/media-spec.json`. Rode
   `node tools/content-media/generate.mjs --slug <slug>`. Leia o
   `manifest.json`, suba os assets com `supabase storage cp` e escreva a
   migration de mídia (`hero_image_url` + linhas `learning_material_media`).
   `storage ls` antes de aplicar — o feed não pode ver 404.
5. **Commit**: `feat(learning): <tipo> — <título>` (as duas migrations). Modo
   commit-direto no `main` OU PR, conforme a preferência atual do user.

## Processo — só mídia (`/content-drop --slug <slug>`)

Quando o material já existe e você só quer capa/infográfico:

1. Puxe o material do banco:
   ```bash
   supabase db query --linked "select slug, dimension_id, title_pt, title_en, summary_pt, summary_en, source_label_pt, source_label_en, reasoning_log, body_pt, body_en from public.learning_material where slug = '<slug>'"
   ```
2. Dispare `learning-art-director` com esse conteúdo (as 3 ideias-herói saem do
   `reasoning_log.main_points`; se não houver, derive do `body_pt`). Ele escreve
   o `media-spec.json`.
3. `node tools/content-media/generate.mjs --slug <slug>` (respeite `--only` se
   passado).
4. Suba do `manifest.json` e escreva **uma** migration só de mídia. Commit.

## Áudio (Fase B, opt-in)

Podcast de 2 vozes estilo NotebookLM, via API — **não roda por padrão** (custa
e demora; ligar por material). Fluxo: dispare `learning-audio-writer` (escreve o
diálogo → `audio-script.<loc>.json`) → `node tools/content-media/generate.mjs
--slug <slug> --only audio` (Gemini TTS multi-voz → `audio.<loc>.m4a`) → suba +
migration `kind='audio'` com `duration_seconds` do manifest. ~US$ 0,15 por
episódio de 10 min. A aba **Áudio** sai do "em breve".

## Notas

- **Custo**: infográfico ~US$ 0; capa ~US$ 0,039; áudio ~US$ 0,15/10 min. Um
  drop de capa+infográfico é ~4 centavos; com áudio, ~19 centavos.
- **`inbox/` é gitignored** — só as migrations vão pro git; os assets vivem no
  Storage.
- **Idempotência**: se o slug já existe e você ia inserir, vire UPDATE (modo
  rewrite). Pra mídia, `on conflict (material_id, kind, locale) do nothing` já
  protege; a capa é um UPDATE de `hero_image_url`, sempre seguro.
- Iterar layout do infográfico sem gastar API: `--only infographic` quantas
  vezes quiser; edite `media-spec.json` à mão entre runs.
