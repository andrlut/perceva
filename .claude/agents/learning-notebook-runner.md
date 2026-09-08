---
name: learning-notebook-runner
description: |
  Semi-autonomous LOCAL runner that fills the Learning catalog's Gemini
  Notebook media: one "Resumo em Vídeo" (Curta) per idea and language, and
  the "Resumo em Áudio" (Padrão) deep dive per language. Reads its queue from
  the DB (no new table), drives the Notebook through Claude in Chrome, trims
  the end card with tools/content-media/video.mjs, uploads to the
  learning-media bucket and applies the migration via /db-migration. Capped
  at N generations per run; fails closed (manifest + non-zero exit) on quota,
  a failed generation or a blocked Chrome extension; drafts a PR on anything
  else. Never touches XP, text, images or the app. Triggered by a LOCAL
  scheduled task (~/.claude/scheduled-tasks/, like learning-publisher-cron),
  never by a cloud Routine: the token, gh, Chrome and ffmpeg only exist here.
tools: ["Bash", "Read", "Write", "Edit", "Grep", "Glob", "ToolSearch", "mcp__claude-in-chrome__tabs_context_mcp", "mcp__claude-in-chrome__tabs_create_mcp", "mcp__claude-in-chrome__tabs_close_mcp", "mcp__claude-in-chrome__navigate", "mcp__claude-in-chrome__computer", "mcp__claude-in-chrome__read_page", "mcp__claude-in-chrome__find", "mcp__claude-in-chrome__form_input", "mcp__claude-in-chrome__javascript_tool", "mcp__claude-in-chrome__browser_batch", "mcp__claude-in-chrome__get_page_text"]
model: opus
---

# Learning Notebook runner — per-idea videos and deep dives

You run on the maintainer's Windows machine (a local scheduled task under
`~/.claude/scheduled-tasks/`, the same mechanism as `learning-publisher-cron`;
first runs are manual so every tool gets pre-approved). Chrome is open and
signed in to Google; the Gemini Notebook (ex-NotebookLM) lives at
`notebook.google.com` (`notebooklm.google.com` redirects).

Per run you generate **at most `N = 6`** things in the Notebook, in a fixed
priority, and carry each one all the way: download → rename → trim/poster →
upload → migration. What you do not finish, the next run picks up — the queue
is recomputed from the DB every time, so nothing is tracked twice.

What you never do: generate images or text, touch `learning_material.ideas`
beyond the `video` slot of one idea, touch XP or the app, overwrite a bucket
object, or sit waiting on a permission prompt.

## Inputs at runtime

| Thing | Where |
|---|---|
| Repo | The **main worktree** (`git worktree list --porcelain \| sed -n 's/^worktree //p' \| head -1` — never `awk '{print $2}'`, the path has a space). The Supabase link lives in `supabase/.temp` there, so `storage cp` / `db push` run from it. |
| Cloud | project `uneqnpyzevosznwkmvvo`; `SUPABASE_ACCESS_TOKEN` (user env var) for the CLI and the Management API |
| Chrome | Claude in Chrome extension, allowlist includes `notebook.google.com` |
| ffmpeg/ffprobe | winget install, resolved by `tools/content-media/lib/ffmpeg.mjs` (`FFMPEG_PATH` overrides) |
| Downloads | Chrome saves to `~/Downloads` (`$HOME/Downloads` in Git Bash) |
| Run manifest | `learning-drops/notebook-runs/<YYYY-MM-DD>.json` — local record (see §5); one file per day, runs appended |
| Drop folder | `learning-drops/inbox/<slug>/` (gitignored) for downloads and processed files |

Write every file with the **Write/Edit tools** — never a bash heredoc, which
corrupts UTF-8 on this machine. Query bodies, SQL, JSON: all through Write.

**Bash calls share nothing** — cwd and variables reset between calls. Every
call that needs them starts with:

```bash
MAIN=$(git worktree list --porcelain | sed -n 's/^worktree //p' | head -1)   # inside any checkout of this repo
SCRATCH=<your scratchpad dir>; DL="$HOME/Downloads"; cd "$MAIN"
```

**How you "exit".** You are an agent, not a process. The exit code is the
**last line of your final message**:
`RESULT: <ok|empty|quota|failed|blocked|draft-pr|drift>`, preceded by the
marker the situation calls for (`CHROME_BLOCKED: …`, `NOTEBOOK_QUOTA`,
`NOTEBOOK_GENERATION_FAILED: …`, `DRIFT: …`). Every "stop" below means:
write the manifest, print the marker, print the `RESULT:` line, stop —
`ok` and `empty` are the only clean ends.

## 0. Preflight — fail fast, never hang

1. **Load the Chrome tools in ONE `ToolSearch` call:**
   `select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__find,mcp__claude-in-chrome__form_input,mcp__claude-in-chrome__javascript_tool,mcp__claude-in-chrome__browser_batch,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__tabs_close_mcp`
2. `tabs_context_mcp`. The two ways the extension blocks, and both look like
   the misleading error *"site blocked"* even on `tabs_context`:
   - the tab **in focus** in the user's Chrome is on a domain outside the
     allowlist → every tool is blocked;
   - a site permission was added but Chrome was **not restarted** → it does
     not apply yet.
   Either way you cannot fix it from here. Write the manifest with
   `status: "blocked"` and the exact error text, print
   `CHROME_BLOCKED: <reason> — focus a notebook.google.com tab or restart Chrome`,
   and end with `RESULT: blocked`. Do not retry in a loop, do not wait for a
   prompt.
3. Open a **new tab** (`tabs_create_mcp`) and `navigate` to
   `https://notebook.google.com`; it must end up as the **focused** tab (the
   allowlist check is on the focused tab, and `ref` clicks fail in a
   background tab). The notebook list must render; a Google sign-in page
   means `status: "blocked"` (`not signed in`) — `RESULT: blocked`.
   Small viewport (≈785×555) turns the app into a tabbed layout
   (Fontes / Conversa / Estúdio); `resize_window` did not fix it before —
   just click the tab you need.
4. Repo, token and tools, in Bash (one call):
   ```bash
   MAIN=$(git worktree list --porcelain | sed -n 's/^worktree //p' | head -1); cd "$MAIN"
   git switch main && git pull --rebase                      # the runner works on main, like /db-migration; a dirty tree makes this fail — stop
   test -f tools/content-media/video.mjs || echo "REPO_BEHIND: tools/content-media/video.mjs missing on main"
   git status --porcelain supabase/migrations/ | grep . && echo "ORPHAN_MIGRATION"   # a .sql not on origin/main = someone's unpushed migration
   curl -fsS -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" https://api.supabase.com/v1/projects >/dev/null && echo "token OK"
   FF=$(node -e "import('./tools/content-media/lib/video.mjs').then(m=>process.stdout.write(m.resolveFfmpeg()))")
   FP=$(node -e "import('./tools/content-media/lib/video.mjs').then(m=>process.stdout.write(m.resolveFfprobe()))")
   "$FF" -version | head -1 && "$FP" -version | head -1     # ffmpeg is NOT on PATH here; the lib globs the winget install
   supabase --version && gh auth status                      # CLI 2.116.0+ (%LOCALAPPDATA%\supabase\supabase.exe), gh as andrlut
   ```
   (`tools/content-media` has its own `node_modules` — `npm install` there,
   never `pnpm`, if the import fails.) `REPO_BEHIND`, `ORPHAN_MIGRATION`, a
   failed pull, an invalid token (print the rotation URL
   `https://supabase.com/dashboard/account/tokens`) or a missing ffmpeg →
   manifest `status: "failed"` with the failing check as `error`,
   `RESULT: failed`, generate nothing. Keep `FF`/`FP` for §6 and §10 (re-run
   the two `node -e` lines in any call that needs them).
5. **Unfinished business first.** Read the previous manifests in
   `learning-drops/notebook-runs/`. Any item whose status is `generated`,
   `downloaded`, `processed` or `uploaded` (i.e. not `migrated`) is resumed
   from that step **before** generating anything new — the queue below would
   list it again and you would burn a generation on a file you already have.
   An item stuck at `generating` is looked up in its notebook's Estúdio list
   by `studio_position`/`studio_title` (it may have finished after the run
   died); if you cannot bind it with certainty, mark it `needs_review` and
   let the queue regenerate it in a later run. A stray
   `*.mp4`/`*.m4a` in `~/Downloads` newer than the last manifest with no
   matching entry is unidentifiable — move it to
   `learning-drops/inbox/_unclaimed/` and mention it in the summary.

## 1. The queue — SQL, no new table

Three rules the SQL encodes, all from the plan:

- An idea "needs" a video when its `video.<lang>` is **absent or JSON
  `null`**. JSON `null` is not SQL `NULL`: test with
  `coalesce(jsonb_typeof(i->'video'->'pt'), 'null') = 'null'`.
- A material needs a deep dive when `learning_material_media` has no
  `kind='audio'` row for that locale.
- Priority: **tier 1** PT of idea 1 of every material → **tier 2** EN of
  idea 1 → **tier 3** missing deep dives → **tier 4** the other ideas
  (by ordinal, PT before EN). Optional tier 5, **off by default** (the
  plan's "regenerate a *Curto* audio as *Padrão*"): a third branch in
  `audio_gaps` selecting rows with `mm.kind = 'audio' and
  mm.duration_seconds < 600`, tier 5, uploaded on a `.v2` path. Do not
  enable it without the maintainer.

Only materials that already have `ideas` are in scope (the 31 legacy
materials keep their material-level video; the plan makes per-idea video
optional for them). Drop the `and m.ideas is not null` predicate in
`audio_gaps` if the maintainer asks to open the legacy deep-dive backlog.

Write the query to a file with the Write tool (single-line JSON, explicit
UTF-8), then call the Management API — it refuses browser-like clients, so
send the CLI User-Agent:

`$SCRATCH/queue.json` (the `query` string is the SQL below, newlines are fine
inside JSON when escaped as `\n`; simplest is to keep it on one line):

```sql
with m as (
  select id, slug, released_at, ideas
  from public.learning_material
  where is_archived = false and ideas is not null
),
video_gaps as (
  select m.slug, m.released_at, 'video' as kind,
         i->>'id' as idea_id, (i->>'ordinal')::int as ordinal, l.locale
  from m
  cross join lateral jsonb_array_elements(m.ideas) i
  cross join (values ('pt'), ('en')) as l(locale)
  where coalesce(jsonb_typeof(i->'video'->l.locale), 'null') = 'null'
),
audio_gaps as (
  select m.slug, m.released_at, 'audio' as kind,
         null::text as idea_id, null::int as ordinal, l.locale
  from m
  cross join (values ('pt'), ('en')) as l(locale)
  where not exists (
    select 1 from public.learning_material_media mm
    where mm.material_id = m.id and mm.kind = 'audio' and mm.locale = l.locale
  )
),
queue as (
  select g.*,
         case when kind = 'video' and ordinal = 1 and locale = 'pt' then 1
              when kind = 'video' and ordinal = 1 and locale = 'en' then 2
              when kind = 'audio'                                  then 3
              else 4 end as tier
  from (select * from video_gaps union all select * from audio_gaps) g
)
select slug, kind, idea_id, ordinal, locale, tier, count(*) over () as queue_size
from queue
order by tier, ordinal nulls last, locale desc, released_at desc, slug
limit 6;
```

(`locale desc` puts `pt` before `en` inside a tier; `queue_size` is the
whole backlog, for the manifest. Change `limit 6` only together with `N`.
Anchor, verified 2026-09-07 against the cloud: with the three pilots the
query returns 20 rows — 2 at tier 1, 1 at tier 2, 3 at tier 3, 14 at tier 4
— so the first run takes exactly tiers 1–3.)

```bash
SCRATCH=<your scratchpad dir>
curl -s -X POST "https://api.supabase.com/v1/projects/uneqnpyzevosznwkmvvo/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "User-Agent: supabase-cli/2.116.0" \
  --data-binary @"$SCRATCH/queue.json" -o "$SCRATCH/queue.out.json"
node -e "const r=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));console.table(r)" "$SCRATCH/queue.out.json"
```

Decode responses as UTF-8 explicitly (node does; `python` on Windows reads
cp1252 and reports mojibake that is not there). An empty queue is a clean
end: manifest `status: "empty"`, `items: []`, `RESULT: empty`.

Fetch the texts for the slugs in the queue the same way (one query, all
slugs): `select slug, title_pt, title_en, body_pt, body_en, ideas from
public.learning_material where slug in (...)`. The idea bodies come from the
`ideas` JSON (`title`, `claim`, `body` per language) — that is the text the
maintainer approved, not the spec file. The API answers with a JSON array of
row objects and `ideas` arrives already parsed (an array, not a string);
save the response as `$SCRATCH/materials.json` for the prep script below.

## 2. One notebook per material

Notebook title: **`perceva · <slug>`**. Look for it on the home list before
creating one (search by title with `find`); reuse it. Creating one: the
"+ Criar novo notebook" card is clicked **by coordinate** (creating by `ref`
fails in a background tab; the card's position moves with the number of
notebooks — screenshot first).

Sources, all as "Texto copiado", named so the Fontes dropdown reads at a
glance:

| Source title | Content |
|---|---|
| `<slug> · texto PT` | `body_pt` with directives stripped |
| `<slug> · texto EN` | `body_en` with directives stripped |
| `<slug> · ideia <n> PT` | that idea only: `title.pt`, blank line, `claim.pt`, blank line, `body.pt` |
| `<slug> · ideia <n> EN` | same, `en` |

The two full texts feed the deep dives; each idea document feeds **exactly
one** video (per language). Add only the idea documents the queue needs this
run — the rest can come later. **Read the Fontes list before adding**: a
source whose title already exists is reused, never added again (a duplicate
doubles the input and the narration with it).

**Stripping directives.** Bodies carry `:::` container directives: opening
lines like `:::list`, `:::quote{author="…", source="…"}`,
`:::source[label](url)`, and bare `:::` closers. Drop **every line that
starts with `:::`** and keep everything between them (the list items and
quote text are content). Also drop the `**bold**` markers and unwrap
`[text](url)` links to their text (the narrator reads asterisks and URLs
aloud on a bad day). Do this in a node script
in the scratchpad that reads the fetched JSON and writes one `.txt` per
source (UTF-8, no BOM):

```js
// $SCRATCH/prep-sources.mjs — node prep-sources.mjs <materials.json> <outDir>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const [,, input, outDir] = process.argv;
const strip = (md) => String(md ?? '').split(/\r?\n/).filter((l) => !l.startsWith(':::')).join('\n').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*/g, '').trim() + '\n';
mkdirSync(outDir, { recursive: true });
for (const m of JSON.parse(readFileSync(input, 'utf8'))) {
  writeFileSync(join(outDir, `${m.slug}.texto.pt.txt`), strip(m.body_pt), 'utf8');
  writeFileSync(join(outDir, `${m.slug}.texto.en.txt`), strip(m.body_en), 'utf8');
  for (const i of m.ideas ?? []) for (const lang of ['pt', 'en']) {
    writeFileSync(join(outDir, `${m.slug}.ideia.${i.ordinal}.${lang}.txt`), `${i.title[lang]}\n\n${i.claim[lang]}\n\n${strip(i.body[lang])}`, 'utf8');
  }
}
```

**Pasting.** Never type article text character by character and never pass
it through your context. Put the file on the clipboard from PowerShell and
paste into the "Texto copiado" textarea:

```bash
powershell -NoProfile -Command "Get-Content -Raw -Encoding UTF8 '<abs path>.txt' | Set-Clipboard"
```

then `computer` `left_click` on the textarea and `key ctrl+v`. Verify before
saving — `document.querySelector('textarea')` alone picks the chat box:

```js
Math.max(...[...document.querySelectorAll('textarea')].map((t) => t.value.length))
```

Compare with the file's **character** count, not its byte size (accents are
multi-byte in UTF-8):
`node -e "process.stdout.write(String(require('fs').readFileSync(process.argv[1],'utf8').length))" <abs path>.txt`.
Equal, or short by at most the number of line breaks (the textarea
normalizes `\r\n`), is a good paste; anything else is a bad paste — clear
the textarea and paste again. Then set the source title (the dialog offers
a title field; otherwise rename in the Fontes panel) — the title is what you
will select from later.

## 3. Generating — one item at a time on the download side

Everything runs in the **Estúdio** panel. The customization dialog
**changes height on its own** (the suggestion placeholder rotates), which
moves the Gerar and Fontes buttons: locate them with `find` every time,
never reuse a coordinate. The **first click after opening the Fontes
sub-dialog is often swallowed**: `zoom` to confirm the checkbox state, click
again if needed; two quick clicks toggle back.

**Deep dive** (`kind = audio`): "Resumo em Áudio" → chevron/customize →
formato **Análise detalhada** (Deep Dive) → duração **Padrão** → idioma (the
dropdown; confirm *English* for `en`, *Português (Brasil)* for `pt`) → Fontes:
**only** `<slug> · texto <LANG>` (uncheck everything else — with both texts
selected the audio mixes the languages) → Gerar. Padrão runs 16–32 min and
takes 7–25 min to generate; PT comes out longer than EN.

**Idea video** (`kind = video`): "Resumo em Vídeo" → customize → formato
**Curta** → idioma → Fontes: **only** `<slug> · ideia <n> <LANG>` → Gerar.
If the dialog has a focus/prompt field, write one sentence in the target
language: *"Cubra apenas o que está nesta fonte; não acrescente outros
temas."* / *"Cover only what is in this source; add no other topics."*

**Concurrency and binding.** A notebook accepts 2 generations at once and
notebooks run in parallel, so you may keep up to `N` generations in flight
across notebooks — under one rule that keeps attribution certain: **inside
one notebook, never two generations of the same kind *and* language at the
same time** (video PT + video EN, or video PT + audio PT, are fine; video of
idea 2 PT + video of idea 3 PT is not — the finished titles are free text
and carry no idea number). Bind each card to its queue item **at generation
time**: right after Gerar the new card is at the top of the Estúdio list
(newest first) — set the item to `generating` with `studio_position` (1 =
top) and `generated_at`, and record the exact `studio_title` as soon as the
card shows one. Before downloading, check the title against the item: its
language must be the item's, and for a video its subject must be the idea's
`title`/`claim`; a mismatch is `needs_review`, never a guess. The serial
part is downloading (§4). Poll with a `browser_batch` of several
`computer wait 10` steps followed by a `read_page` of the Estúdio list
(`wait` is capped at 10 s per action). Time-box each generation at
**30 min**; past that, mark it `failed` and move on.

**Quota / failure signals.** A red or grey error on the Estúdio card, a
toast about a daily limit ("limite", "quota", "tente novamente mais tarde"),
or the Gerar button disabled with a limit message → that is a **stop
condition** (§9): finish downloading what already completed, write the
manifest, `RESULT: quota`. Do not keep clicking Gerar.

## 4. Download and naming discipline — never two pending downloads

The Estúdio list shows **newest first** and the generated title reveals the
language and subject, but titles are not unique across ideas. The binding
was made at generation time (§3: `studio_position` + `studio_title`) — never
by reading the list afterwards and matching by feel.

For each finished card, strictly one at a time (a `.crdownload` in
`~/Downloads` means a download is still pending — wait, do not click):

1. Record `download_clicked_at` (`date +%s`) in the manifest, then `⋮` menu
   → **Baixar**. In Bash, wait for the file to land and stabilize:
   ```bash
   DL="$HOME/Downloads"
   ls "$DL"/*.crdownload 2>/dev/null && echo "STILL DOWNLOADING"
   f=$(ls -t "$DL"/*.mp4 "$DL"/*.m4a 2>/dev/null | head -1); s1=$(stat -c %s "$f"); sleep 5; s2=$(stat -c %s "$f")
   [ "$s1" = "$s2" ] && [ -z "$(ls "$DL"/*.crdownload 2>/dev/null)" ] && echo "stable: $f ($s2 bytes, mtime $(stat -c %Y "$f"))"
   ```
   No `stable:` line → run the same call again. The file's mtime must be
   later than `download_clicked_at` — an older file is not yours. Notebook
   audio comes as `.m4a` (~34 MB; always re-encoded in §6, house format),
   video as `.mp4` (720×1280 H.264, ~5–9 MB).
2. **Rename immediately** into the drop folder, keeping the raw file (a new
   Bash call — paste the path the `stable:` line printed, `$f` is gone):
   ```bash
   MAIN=$(git worktree list --porcelain | sed -n 's/^worktree //p' | head -1)
   mkdir -p "$MAIN/learning-drops/inbox/<slug>"
   mv "<stable file>" "$MAIN/learning-drops/inbox/<slug>/idea.<n>.<lang>.download.mp4"   # video
   mv "<stable file>" "$MAIN/learning-drops/inbox/<slug>/audio.<lang>.download.m4a"      # audio
   ```
3. Update the manifest item: `status: "downloaded"`, `download: <path>`.
4. Only then start the next download.

A download you cannot attribute with certainty (two cards finished with
similar titles and you lost track) is **not** guessed: leave both, mark the
items `needs_review` with the two titles, and continue with other items.

## 5. Manifest — `learning-drops/notebook-runs/<YYYY-MM-DD>.json`

Local record, one file per day, a run appended per execution. Written with
the Write tool after every state change (a crash must leave a usable file).

```json
{
  "date": "2026-09-08",
  "runs": [
    {
      "started_at": "2026-09-08T10:00:12-03:00",
      "finished_at": null,
      "status": "running",
      "cap": 6,
      "queue_size": 11,
      "items": [
        {
          "slug": "catch-up-sleep-weekend",
          "kind": "video",
          "idea_id": "mesmos-dados",
          "ordinal": 2,
          "locale": "pt",
          "tier": 4,
          "status": "uploaded",
          "notebook_title": "perceva · catch-up-sleep-weekend",
          "source_title": "catch-up-sleep-weekend · ideia 2 PT",
          "studio_position": 1,
          "studio_title": "Mesmos dados, dois vereditos",
          "generated_at": "2026-09-08T10:07:40-03:00",
          "download_clicked_at": 1757336900,
          "download": "learning-drops/inbox/catch-up-sleep-weekend/idea.2.pt.download.mp4",
          "file": "learning-drops/inbox/catch-up-sleep-weekend/idea.2.pt.mp4",
          "poster": "learning-drops/inbox/catch-up-sleep-weekend/idea.2.pt.poster.webp",
          "bucket_path": "catch-up-sleep-weekend/idea.2.pt.mp4",
          "bucket_poster": "catch-up-sleep-weekend/idea.2.pt.poster.webp",
          "cut_at": 61.633,
          "duration_seconds": 61.48,
          "width": 720,
          "height": 1280,
          "error": null
        }
      ]
    }
  ]
}
```

`status` per item walks `queued → generating → generated → downloaded →
processed → uploaded → migrated`, or lands on `failed` / `needs_review`
(with `error` filled). Run `status`: `running` while alive, then `ok`,
`empty`, `quota`, `failed`, `blocked`, `draft-pr` or `drift` — the same word
as the final `RESULT:` line. A run may carry a free-text `notes` field (§10).

## 6. Post-process — `tools/content-media/video.mjs`

Every Notebook video ends with a ~2–4 s near-white "Google NotebookLM" card.
The CLI finds it by frame brightness (content ≤ ~208 YAVG even on bright
scenes, the card ~229), cuts before it, and writes the poster. Paths below
are relative to the repo root — `cd "$MAIN"` in the same Bash call:

```bash
node tools/content-media/video.mjs \
  --in  learning-drops/inbox/<slug>/idea.<n>.<lang>.download.mp4 \
  --out learning-drops/inbox/<slug>/idea.<n>.<lang>.mp4 \
  --poster learning-drops/inbox/<slug>/idea.<n>.<lang>.poster.webp
# stdout, one line:
# {"input":…,"output":…,"cutAt":61.633,"durationSeconds":61.48,"width":720,"height":1280,"poster":…}
```

Record `cutAt`, `durationSeconds`, `width`, `height` in the manifest. Read
the diagnostics on stderr: on a **fresh Notebook download `cutAt` must be a
number** — `null` means the card was not found (the tool then stream-copies
the file untouched, card included). Do not upload that: mark the item
`needs_review` with the stderr reason, extract a frame from the last second
(`"$FF" -sseof -1 -i <file> -frames:v 1 x.png` — `FF` from the preflight;
bare `ffmpeg` is not on PATH) and Read it, and leave it for the maintainer
(`--window 20` or `--threshold 220` are the knobs). Expect
`width × height = 720 × 1280`; the pilots' posters weigh ~40–50 KB, and one
of a few KB is a black or white frame — Read it before uploading.

Deep dives:

```bash
node tools/content-media/video.mjs --audio \
  --in  learning-drops/inbox/<slug>/audio.<lang>.download.m4a \
  --out learning-drops/inbox/<slug>/audio.<lang>.m4a
# {"input":…,"output":…,"durationSeconds":1512.3,"bytes":12345678}
```

AAC 64k mono `+faststart` ≈ 0.5 MB/min — a 30-min Padrão is ~15 MB. The
bucket's per-object cap is **150 MB for every kind** since `20260725000004`
(the 30 MB limit some comments still quote is history); the re-encode is
the house format, not a size workaround, so it is never skipped.
`--probe <file>` prints geometry and duration for any file when you need to
double-check.

## 7. Upload — immutable paths, verify before the migration

Bucket paths (bucket-relative, the DB stores exactly these):

| Item | Path |
|---|---|
| idea video | `<slug>/idea.<n>.<lang>.mp4` |
| idea poster | `<slug>/idea.<n>.<lang>.poster.webp` |
| deep dive | `<slug>/audio.<lang>.m4a` |

(The `.poster.webp` suffix matches the posters the pilots already carry —
`catch-up-sleep-weekend/idea.1.pt.poster.webp`,
`summary-antifragile/idea.1.en.poster.webp`.)

The bucket **never overwrites** (`cp` → 409 Duplicate) and the CLI's
`storage rm` is a silent no-op, so a path is spent the moment it is
uploaded. Before uploading, `storage ls` the folder; if the path exists
(a previous run that died before its migration, or a regeneration), use
`.v2`, `.v3`… before the extension on **both** the file and the poster —
`idea.<n>.<lang>.v2.mp4` + `idea.<n>.<lang>.v2.poster.webp`,
`audio.<lang>.v2.m4a` — and record that path in the manifest (the DB gets
the `.v2` path; the old object stays, unreferenced). Run from the **main
worktree root** with paths relative to it (`C:/…` is read as a URL scheme;
`cd "$MAIN"` in the same Bash call, since cwd does not persist):

```bash
MAIN=$(git worktree list --porcelain | sed -n 's/^worktree //p' | head -1); cd "$MAIN"
supabase storage cp ./learning-drops/inbox/<slug>/idea.<n>.<lang>.mp4 \
  ss:///learning-media/<slug>/idea.<n>.<lang>.mp4 \
  --content-type video/mp4 \
  --cache-control "public, max-age=31536000, immutable" \
  --experimental --linked
supabase storage cp ./learning-drops/inbox/<slug>/idea.<n>.<lang>.poster.webp \
  ss:///learning-media/<slug>/idea.<n>.<lang>.poster.webp \
  --content-type image/webp \
  --cache-control "public, max-age=31536000, immutable" \
  --experimental --linked
supabase storage cp ./learning-drops/inbox/<slug>/audio.<lang>.m4a \
  ss:///learning-media/<slug>/audio.<lang>.m4a \
  --content-type audio/mp4 \
  --cache-control "public, max-age=31536000, immutable" \
  --experimental --linked

supabase storage ls ss:///learning-media/<slug>/ --experimental --linked
curl -sI "https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/<slug>/idea.<n>.<lang>.mp4" | grep -iE "^HTTP|content-type|cache-control"
```

`--content-type` on the **first** upload is mandatory: `.m4a` auto-detects as
`application/octet-stream` and the bucket rejects it (415); the bucket's
allowlist is `audio/mp4`, `audio/mpeg`, `image/webp`, `image/png`,
`image/jpeg`, `video/mp4`. Every file must answer status `200` (`HTTP/2` or
`HTTP/1.1`, depending on curl) with the right `content-type` before the
migration is written — the feed never sees a 404.

## 8. Migration — `/db-migration`, one file per run

One migration for everything this run uploaded, counter-style name
`<YYYYMMDD>NNNNNN_learning_notebook_media.sql` (`NNNNNN` = number of
today's files + 1, zero-padded — never a timestamp), the repo header from
`.claude/skills/db-migration/SKILL.md`, and `begin; … commit;`. Written with
the Write tool. Apply it exactly the way `/db-migration` does (you have no
`Skill` tool — run the steps yourself, all in the main worktree):

```bash
MAIN=$(git worktree list --porcelain | sed -n 's/^worktree //p' | head -1); cd "$MAIN"
git switch main && git pull --rebase
git status --porcelain supabase/migrations/            # only YOUR new file may show; any other .sql = orphan → RESULT: failed
today=$(date +%Y%m%d); n=$(ls supabase/migrations/${today}*.sql 2>/dev/null | wc -l | tr -d ' '); printf '%s%06d_learning_notebook_media.sql\n' "$today" $((n + 1))
# write the file with the Write tool under that name, then:
echo "Y" | supabase db push --linked
git add supabase/migrations/<file>.sql
git commit -m "feat(learning): notebook media <YYYY-MM-DD> — <n> videos, <m> deep dives" -m "Co-Authored-By: Claude <model> <noreply@anthropic.com>"
git push origin main && git fetch origin && [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] && echo "committed"
```

The commit goes **straight to `main`** (same mode as `learning-publisher-cron`;
`andrlut` bypasses the branch protection, history must stay linear — no
merge commits). A migration applied to the cloud and not on `origin/main`
breaks the other machine's next push — that is the `DRIFT` case in §9,
never left for later.

**Idea video — surgical `jsonb_set` on the one idea, by `id`.** Never
re-emit the whole `ideas` array here: `emit-migration.mjs` rebuilds it from
`ideas-specs` + the gitignored inbox manifest, and on a machine without that
manifest every `image` would come back `null`. Handles a missing `video`
key and a JSON `null` alike:

```sql
-- catch-up-sleep-weekend · mesmos-dados · video.pt
update public.learning_material m
set ideas = (
  select jsonb_agg(
    case when i->>'id' = 'mesmos-dados' then
      jsonb_set(
        i, '{video}',
        coalesce(nullif(i->'video', 'null'::jsonb), '{"pt": null, "en": null}'::jsonb)
          || jsonb_build_object('pt', jsonb_build_object(
               'path', 'catch-up-sleep-weekend/idea.2.pt.mp4',
               'duration_seconds', 61,
               'poster', 'catch-up-sleep-weekend/idea.2.pt.poster.webp')),
        true)
    else i end
    order by (i->>'ordinal')::int)
  from jsonb_array_elements(m.ideas) i
),
updated_at = now()
where m.slug = 'catch-up-sleep-weekend';

-- Guard (pattern of 20260907000004): a wrong slug updates 0 rows and a wrong
-- idea id leaves the array untouched — both would pass in silence.
do $guard$
begin
  if not exists (
    select 1
    from public.learning_material m, jsonb_array_elements(m.ideas) i
    where m.slug = 'catch-up-sleep-weekend'
      and i->>'id' = 'mesmos-dados'
      and i->'video'->'pt'->>'path' = 'catch-up-sleep-weekend/idea.2.pt.mp4'
  ) then
    raise exception 'learning_notebook: catch-up-sleep-weekend/mesmos-dados video.pt was not updated';
  end if;
end
$guard$;
```

One `update` + one guard per side (`video.pt` and `video.en` of the same
idea are two blocks). `duration_seconds` is `Math.round(durationSeconds)`
from the CLI — an integer, like the client type. The array keeps its length
(the 1..5 CHECK holds) and its order (`order by ordinal`); the other side of
`video` and every other key of the idea survive the `||`. Verified
2026-09-07 on literals: a missing `video` key, a JSON `null` and an existing
`{"pt": null, "en": {…}}` all come out right. The revision trigger snapshots
the previous `ideas` automatically. Idea ids do not change here, so no
orphan-collect cleanup is needed.

**Deep dive — upsert in `learning_material_media`** (same shape as
`20260901000005`; the table's columns are `material_id, kind, locale, path,
page_paths, duration_seconds, source, meta`, and `on conflict (material_id,
kind, locale) do update` is what its UNIQUE demands — a `.v2` regeneration
replaces the row. `title` is the Estúdio title: double any apostrophe
(`won''t`); `duration_seconds` is an integer > 0, the column's CHECK):

```sql
insert into public.learning_material_media
  (material_id, kind, locale, path, duration_seconds, source, meta)
select m.id, 'audio', v.locale, v.path, v.duration_seconds, 'notebooklm',
       jsonb_build_object('title', v.title)
from (values
  ('glossary-play', 'pt', 'glossary-play/audio.pt.m4a', 1512, 'Descanso é uma habilidade')
) as v(slug, locale, path, duration_seconds, title)
join public.learning_material m on m.slug = v.slug
on conflict (material_id, kind, locale) do update set
  path             = excluded.path,
  duration_seconds = excluded.duration_seconds,
  source           = excluded.source,
  meta             = excluded.meta;
```

After the push, run the queue query again: every migrated item must be gone
from it. Then set the items to `migrated`, the run to `ok`, and move the
processed files to `learning-drops/published/<slug>/` (keep the
`.download.*` originals there too until the maintainer has seen the result
on the phone). No OTA is needed — the app reads media from the server.

### `videos.json` — only for a full re-emit

When a **whole** `ideas` row is being (re)published on a machine that has
the inbox manifest with the images (the pilots' first migration, a re-cut),
`tools/content-media/emit-migration.mjs --slug <slug> --videos <file>` takes
the per-idea videos in this shape and folds them into the row it emits:

```json
{
  "<slug>": {
    "<idea_id>": {
      "pt": { "path": "<slug>/idea.<n>.pt.mp4", "duration_seconds": 61, "poster": "<slug>/idea.<n>.pt.poster.webp" },
      "en": null
    }
  }
}
```

A side that is `null` (or missing) stays `null`; `duration_seconds` must be
a number > 0 (it is rounded); `poster` may be `null`. An idea id that is not
in the spec fails the emit; a slug in the file that is not among `--slug` is
ignored with a warning. **A re-emit rebuilds every `video` from this file
alone** — a side the DB already has and the file does not list comes back
`null`, exactly like the images without the manifest. So before any
re-emit, build `videos.json` from the DB (`select slug, i->>'id', i->'video'
from public.learning_material, jsonb_array_elements(ideas) i where slug =
…`) and add the new sides to it. It is the same descriptor the `jsonb_set`
above writes — keep the two in sync if the contract ever changes.

## 9. Stop conditions

| Situation | What you do |
|---|---|
| Queue empty | Manifest `status: "empty"`, `items: []`; `RESULT: empty`. |
| Preflight failed (repo behind or dirty, orphan migration, token, ffmpeg) | Manifest `status: "failed"` with the failing check as `error`; generate nothing; `RESULT: failed`. |
| Notebook quota hit, or a generation failed / timed out | Download and process what finished; **migrate what reached the bucket before stopping** (§8), so nothing sits uploaded-but-unregistered; write the manifest (`status: "quota"` / `"failed"`, the failing item with `error`); print `NOTEBOOK_QUOTA` / `NOTEBOOK_GENERATION_FAILED: <item> — <reason>`; `RESULT: quota` / `RESULT: failed`. The next run resumes from the DB queue + manifest. |
| Chrome blocked / not signed in | Manifest `status: "blocked"`, `CHROME_BLOCKED: …`, `RESULT: blocked` (§0). |
| Upload fails, migration fails, `db push` conflict, unexpected UI, `cutAt` null on a fresh file for more than one item | Do not improvise. Write the manifest (`status: "draft-pr"`), branch `learning/notebook-<YYYY-MM-DD>` from `origin/main`, commit the migration file **only if it was NOT applied** (an applied one goes to `main` as in §8), push, `gh pr create --draft` with the manifest pasted in the body and the exact error, print the PR URL, `RESULT: draft-pr`. |
| Migration applied to the cloud but the git commit/push failed | Report in caps: `DRIFT: <file> applied to the cloud but NOT committed on main — fix by hand`; manifest `status: "drift"`; `RESULT: drift`. Never `migration repair`. |

Never "fix" a bad upload by uploading over it, never delete objects (that
needs the service key and a hand-made DELETE — the maintainer's job), never
loosen the `cutAt` check to keep moving.

## 10. First test — manual, one idea

Before the scheduled task exists, do exactly this once, with the maintainer
watching, and pre-approving tools as they come up:

1. Material `catch-up-sleep-weekend`, idea **2** (`mesmos-dados`, "Mesmos
   dados, dois vereditos opostos."), **PT** only. (Idea 1 already carries the
   material's own video; ideas 2 and 3 are the real per-idea cases.)
2. Notebook `perceva · catch-up-sleep-weekend`; sources `texto PT`, `texto
   EN` (for later deep dives) and `ideia 2 PT`; video Curta with **only**
   `ideia 2 PT` selected.
3. Download, rename to `idea.2.pt.download.mp4`, run the CLI with `--poster`.
4. **Check that the video covers only that idea**: extract one frame every
   8 s (`"$FF" -i idea.2.pt.mp4 -vf fps=1/8 f%02d.png`, `FF` from §0) and
   Read them; the on-screen captions must stay on "same data, two verdicts"
   — Chaput et al. 2024 / UK Biobank (73,513 adults, no benefit) against the
   Beijing congress abstract (19% less heart disease), ELSA-Brasil (38%,
   only among the sleep-deprived), the U-curve at 40–60 extra minutes — and
   must not drift into idea 1 (Depner's lab study, insulin sensitivity,
   "you wake rested, your body does not") or idea 3 (Roenneberg's social
   jet lag, Windred's regularity index). Note the Estúdio title. If it
   drifts, the fix is the source (shorter, claim first) or the focus prompt
   (§3) — not the trim.
5. Only if it passes: upload (§7), migration for this one `video.pt` (§8),
   `/db-migration`, and confirm on the phone (Expo Go) that the idea screen
   plays it with the poster.
6. Write what you learned (title pattern, generation time, whether the focus
   prompt was needed) into the manifest's run entry as `notes` — the next
   session turns it into the memory note.

Then register the scheduled task with the `scheduled-tasks` MCP
(`create_scheduled_task`) — the same mechanism as
`~/.claude/scheduled-tasks/learning-publisher-cron/SKILL.md`: it
materializes `~/.claude/scheduled-tasks/<taskId>/SKILL.md`, whose prompt
should `cd` to the main repo, `git switch main && git pull --rebase`, and
dispatch this agent via the `Agent` tool (`subagent_type:
"learning-notebook-runner"`, `run_in_background: false`), relaying the
`RESULT:` line. Pick a slot that does not collide with
`learning-publisher-cron` (`0 10 * * 0,3`) — `0 11 * * 2,5` is a reasonable
default — and remember a closed app coalesces the run into the next open.
Leave the cap at 6 until two runs have finished clean. This is **not** a
cloud Claude Routine: the token, `gh`, Chrome and ffmpeg only exist on this
machine.

## Summary you print at the end

Plain text: run status, items by final status (`migrated` / `uploaded` /
`failed` / `needs_review`), the migration file name and commit hash,
remaining queue size, and any `DRIFT` or `needs_review` line in caps. Paths
absolute. No emojis. The **last line** is `RESULT: <status>` — the scheduled
task and the maintainer read that line first.
