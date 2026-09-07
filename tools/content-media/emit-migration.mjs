#!/usr/bin/env node
/* eslint-env node */
/**
 * emit-migration — writes the SQL that publishes `learning_material.ideas`
 * (Recanto em ideias) for one or more materials.
 *
 * Joins two files per slug:
 *   learning-drops/ideas-specs/<slug>.json   the ideas (versioned; the text
 *                                            the reviewer approved)
 *   learning-drops/inbox/<slug>/manifest.json the media generate.mjs produced
 *                                            (optional — assets of kind 'idea'
 *                                            fill each idea's `image`)
 * plus, optionally, a videos file for the per-idea Notebook videos:
 *   { "<slug>": { "<idea_id>": { "pt": {path, duration_seconds, poster} | null,
 *                                "en": … | null } } }
 *
 * Output: ONE migration with `begin;` … `commit;`, one `update … set ideas =
 * $ideas$<json>$ideas$::jsonb` per slug, then the orphan cleanup that drops
 * `learning_idea_collect` rows whose idea id left the JSON (a re-cut), and a
 * guard that fails the migration when a slug does not exist (a 0-row update
 * would otherwise ship nothing, silently).
 *
 * It only writes the .sql file. Applying it is `/db-migration` (or
 * `supabase db push --linked`) — AFTER the images are in the bucket.
 *
 * Usage:
 *   node emit-migration.mjs --slug <slug> [--slug <slug2> …]
 *                           [--out <path>] [--stdout] [--videos <json>]
 *
 *   default path: supabase/migrations/<YYYYMMDD>NNNNNN_learning_ideas_<slug|batch>.sql
 *   (counter-style, next free NNNNNN for today; always printed)
 *
 * Fails (exit 1) on: missing spec, ideas count outside 1..5, ordinals not
 * exactly 1..n, duplicate or malformed ids, missing bilingual fields, a
 * source without an http(s) url, a bad videos entry, or any `$ideas$` / `$$`
 * / `\u0000` in the payload (the first two would break the dollar quoting,
 * the last is rejected by jsonb).
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const SPECS_DIR = join(REPO_ROOT, 'learning-drops', 'ideas-specs');
const INBOX_DIR = join(REPO_ROOT, 'learning-drops', 'inbox');
const MIGRATIONS_DIR = join(REPO_ROOT, 'supabase', 'migrations');

const MAX_IDEAS = 5;
const SLUG_RE = /^[a-z0-9_-]+$/; // `_` only for smoke/meta files, never a real slug
const IDEA_ID_RE = /^[a-z0-9-]{3,40}$/;
const LOCALES = ['pt', 'en'];
// Soft budget per material type (the hard cap is 1..5). Lint owns the rule;
// here it is only a warning so a deliberate exception still emits.
const TYPE_BUDGET = { news: [1, 1], explainer: [1, 3], summary: [2, 5] };
// Dollar-quote tag for the JSON payload. Anything in the payload that could
// close it (or open a plain `$$` block) must fail before it reaches SQL.
const DOLLAR_TAG = '$ideas$';

// ── arg parsing ────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { slugs: [], out: null, stdout: false, videos: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--slug') args.slugs.push(argv[++i]);
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--stdout') args.stdout = true;
    else if (a === '--videos') args.videos = argv[++i];
    else if (!a.startsWith('--')) args.slugs.push(a);
    else die(`Unknown option ${a}\n  ${USAGE}`);
  }
  return args;
}

const USAGE =
  'Usage: node emit-migration.mjs --slug <slug> [--slug <slug2> …] [--out <path>] [--stdout] [--videos <json>]';

// Everything diagnostic goes to stderr so `--stdout` yields pure SQL.
function die(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

function warn(msg) {
  console.error(`  ! ${msg}`);
}

function info(msg) {
  console.error(msg);
}

function readJson(path, what) {
  let raw;
  try {
    raw = readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
  } catch (e) {
    die(`Cannot read ${what} at ${path}: ${e.message}`);
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    die(`${what} is not valid JSON (${path}): ${e.message}`);
  }
}

// ── validation helpers ─────────────────────────────────────────────────────
function isBilingual(v) {
  return (
    v != null &&
    typeof v === 'object' &&
    LOCALES.every((loc) => typeof v[loc] === 'string' && v[loc].trim().length > 0)
  );
}

function isHttpUrl(u) {
  return typeof u === 'string' && /^https?:\/\/\S+$/i.test(u);
}

/**
 * One idea's `video` value: `{pt, en}` where each side is null or the
 * Notebook clip descriptor. Missing sides default to null; a present side with
 * the wrong shape is an error (the client trusts `path`).
 */
function normalizeVideo(slug, ideaId, raw, errors) {
  const out = { pt: null, en: null };
  if (raw == null) return out;
  if (typeof raw !== 'object') {
    errors.push(`${slug}/${ideaId}: videos entry must be an object {pt, en}`);
    return out;
  }
  for (const loc of LOCALES) {
    const side = raw[loc];
    if (side == null) continue;
    const ok =
      typeof side === 'object' &&
      typeof side.path === 'string' &&
      side.path.length > 0 &&
      Number.isFinite(side.duration_seconds) &&
      side.duration_seconds > 0 &&
      (side.poster == null || typeof side.poster === 'string');
    if (!ok) {
      errors.push(
        `${slug}/${ideaId}: video.${loc} needs {path: string, duration_seconds: number > 0, poster: string|null}`,
      );
      continue;
    }
    out[loc] = {
      path: side.path,
      duration_seconds: Math.round(side.duration_seconds),
      poster: side.poster ?? null,
    };
  }
  return out;
}

/**
 * Build the DB `ideas` array for one slug. Returns `{ ideas, images }` or
 * dies with every problem found (not just the first — a spec round-trip to
 * the reviewer is the expensive part).
 */
function buildIdeas(slug, spec, manifest, videosForSlug) {
  const errors = [];

  if (spec.slug != null && spec.slug !== slug) {
    errors.push(`spec.slug is "${spec.slug}" but the file is ${slug}.json`);
  }
  const ideas = Array.isArray(spec.ideas) ? spec.ideas : null;
  if (!ideas) errors.push('spec has no "ideas" array');
  else if (ideas.length < 1 || ideas.length > MAX_IDEAS) {
    errors.push(`ideas count is ${ideas.length}; must be 1..${MAX_IDEAS}`);
  }
  if (errors.length) die(`${slug}: ${errors.join('\n  ')}`);

  const budget = TYPE_BUDGET[spec.type];
  if (spec.type && !budget) warn(`${slug}: unknown type "${spec.type}" (no budget check)`);
  if (budget && (ideas.length < budget[0] || ideas.length > budget[1])) {
    warn(`${slug}: ${ideas.length} idea(s) for type "${spec.type}" (budget ${budget[0]}–${budget[1]})`);
  }

  // Ordinals must be exactly 1..n — the app pages by them and the file names
  // carry them.
  const ordinals = ideas.map((i) => i?.ordinal).sort((a, b) => a - b);
  const expected = ideas.map((_, k) => k + 1);
  if (!ordinals.every((o, k) => o === expected[k])) {
    errors.push(`ordinals are [${ideas.map((i) => i?.ordinal).join(', ')}]; must be exactly 1..${ideas.length}`);
  }

  const seenIds = new Set();
  const ideaAssets = (manifest?.assets ?? []).filter((a) => a?.kind === 'idea');
  const images = [];
  const rows = [];

  for (const idea of [...ideas].sort((a, b) => a.ordinal - b.ordinal)) {
    const tag = `idea ${idea?.ordinal ?? '?'} (${idea?.id ?? 'sem id'})`;
    if (!IDEA_ID_RE.test(String(idea?.id ?? ''))) {
      errors.push(`${tag}: id must match ${IDEA_ID_RE}`);
    } else if (seenIds.has(idea.id)) {
      errors.push(`${tag}: duplicate id`);
    }
    seenIds.add(idea?.id);

    for (const field of ['title', 'claim', 'body']) {
      if (!isBilingual(idea?.[field])) errors.push(`${tag}: ${field} needs non-empty pt and en`);
    }

    const sources = Array.isArray(idea?.sources) ? idea.sources : [];
    if (sources.length < 1 || sources.length > 3) {
      errors.push(`${tag}: needs 1..3 sources (has ${sources.length})`);
    }
    sources.forEach((s, k) => {
      if (!isBilingual(s?.label)) errors.push(`${tag}: sources[${k}].label needs pt and en`);
      if (!isHttpUrl(s?.url)) errors.push(`${tag}: sources[${k}].url must be http(s)`);
    });

    // Image: by idea_id first (stable across re-orderings), ordinal as a
    // fallback for manifests written before ids existed.
    let asset = ideaAssets.find((a) => a.idea_id === idea?.id);
    if (!asset) {
      asset = ideaAssets.find((a) => a.idea_id == null && a.ordinal === idea?.ordinal);
      if (asset) warn(`${slug}: ${tag} image matched by ordinal only (manifest entry has no idea_id)`);
    }
    let image = null;
    if (asset) {
      if (!asset.bucketPath || !asset.width || !asset.height) {
        errors.push(`${tag}: manifest asset ${asset.localPath ?? '?'} lacks bucketPath/width/height`);
      } else {
        image = { path: asset.bucketPath, width: asset.width, height: asset.height };
        images.push(asset.bucketPath);
      }
    } else {
      warn(`${slug}: ${tag} has no image in the manifest (image = null)`);
    }

    const video = normalizeVideo(slug, idea?.id, videosForSlug?.[idea?.id], errors);

    rows.push({
      id: idea?.id,
      ordinal: idea?.ordinal,
      title: { pt: idea?.title?.pt, en: idea?.title?.en },
      claim: { pt: idea?.claim?.pt, en: idea?.claim?.en },
      body: { pt: idea?.body?.pt, en: idea?.body?.en },
      image,
      video,
      sources: sources.map((s) => ({ label: { pt: s?.label?.pt, en: s?.label?.en }, url: s?.url })),
      cta: idea?.cta ?? null,
    });
  }

  if (videosForSlug) {
    for (const id of Object.keys(videosForSlug)) {
      if (!seenIds.has(id)) errors.push(`videos file names idea "${id}", which is not in the spec`);
    }
  }

  if (errors.length) die(`${slug}:\n  ${errors.join('\n  ')}`);
  return { ideas: rows, images };
}

/**
 * Compact JSON, then the only three things dollar quoting cannot carry.
 * Checking the serialized payload covers every string (keys included).
 */
function serializeIdeas(slug, ideas) {
  const json = JSON.stringify(ideas);
  const problems = [];
  if (json.includes(DOLLAR_TAG)) problems.push(`contains ${DOLLAR_TAG} (closes the dollar quote)`);
  if (json.includes('$$')) problems.push('contains $$');
  if (json.includes('\\u0000')) problems.push('contains \\u0000 (rejected by jsonb)');
  if (problems.length) die(`${slug}: payload ${problems.join('; ')}`);
  return json;
}

// ── SQL ─────────────────────────────────────────────────────────────────────
function sqlLiteral(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}

/** Local calendar date (the machine's), as the migration counter uses it. */
function localDate() {
  const now = new Date();
  const y = String(now.getFullYear());
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return { compact: `${y}${m}${d}`, iso: `${y}-${m}-${d}` };
}

function buildSql({ fileName, entries, videoCount }) {
  const today = localDate().iso;
  const slugs = entries.map((e) => e.slug);
  const allImages = entries.flatMap((e) => e.images);
  const missing = entries.flatMap((e) =>
    e.ideas.filter((i) => i.image == null).map((i) => `${e.slug}/${i.id}`),
  );

  const lines = [];
  lines.push(`-- migration: ${fileName}`);
  lines.push(
    `-- purpose: publica as ideias (Recanto em ideias) de ${entries.length} material(is) do Learning:`,
  );
  for (const e of entries) lines.push(`--          ${e.slug} · ${e.ideas.length} ideia(s)`);
  lines.push('--');
  lines.push('-- affected tables: learning_material (ideas), learning_idea_collect (coletas órfãs)');
  lines.push('-- new rpcs:        none');
  lines.push('-- breaking?        no — só reescreve `ideas` dos slugs listados; material sem');
  lines.push('--                  `ideas` continua na tela legada, byte a byte');
  lines.push('--');
  lines.push('-- notes:');
  lines.push('--   migrations são write-once; nunca editar depois de aplicar');
  lines.push(`--   GERADO por tools/content-media/emit-migration.mjs em ${today} — não editar`);
  lines.push('--   à mão: corrija learning-drops/ideas-specs/<slug>.json (e o manifest do drop)');
  lines.push('--   e reemita.');
  lines.push('--   `id` de ideia é IMUTÁVEL (chave de learning_idea_collect); ordinal e texto');
  lines.push('--   podem mudar. O delete no fim remove só coletas de ids que saíram do JSON.');
  if (allImages.length) {
    lines.push('--   imagens no bucket learning-media (subir ANTES de aplicar, cache imutável):');
    for (const p of allImages) lines.push(`--     ${p}  (960x1200, gemini-api)`);
  } else {
    lines.push('--   imagens: nenhuma no manifest (todas as ideias com image = null)');
  }
  if (missing.length && allImages.length) lines.push(`--   sem imagem: ${missing.join(', ')}`);
  lines.push(`--   vídeos por ideia: ${videoCount === 0 ? 'nenhum (video = {pt: null, en: null})' : `${videoCount} lado(s) preenchido(s)`}`);
  lines.push('');
  lines.push('begin;');
  lines.push('');
  lines.push('-- Guarda: um update em slug inexistente afetaria 0 linhas e passaria em silêncio.');
  lines.push('do $guard$');
  lines.push('declare');
  lines.push('  missing text;');
  lines.push('begin');
  lines.push('  select string_agg(s, \', \') into missing');
  lines.push(`  from unnest(array[${slugs.map(sqlLiteral).join(', ')}]) as s`);
  lines.push('  where not exists (select 1 from public.learning_material m where m.slug = s);');
  lines.push('  if missing is not null then');
  lines.push("    raise exception 'learning_ideas: slug(s) not found in learning_material: %', missing;");
  lines.push('  end if;');
  lines.push('end');
  lines.push('$guard$;');
  lines.push('');
  for (const e of entries) {
    lines.push(`-- ${e.slug} · ${e.ideas.length} ideia(s)`);
    lines.push('update public.learning_material');
    lines.push(`set ideas = ${DOLLAR_TAG}${e.json}${DOLLAR_TAG}::jsonb,`);
    lines.push('    updated_at = now()');
    lines.push(`where slug = ${sqlLiteral(e.slug)};`);
    lines.push('');
  }
  for (const e of entries) {
    lines.push(`-- ${e.slug}: coletas de ids que saíram do JSON (re-corte)`);
    lines.push('delete from public.learning_idea_collect c');
    lines.push('using public.learning_material m');
    lines.push('where m.id = c.material_id');
    lines.push(`  and m.slug = ${sqlLiteral(e.slug)}`);
    lines.push("  and not exists (select 1 from jsonb_array_elements(m.ideas) i where i->>'id' = c.idea_id);");
    lines.push('');
  }
  lines.push('commit;');
  lines.push('');
  return lines.join('\n');
}

/** Counter-style name: <YYYYMMDD><NNNNNN>, next free NNNNNN for today. */
function nextMigrationName(suffix) {
  const today = localDate().compact;
  let max = 0;
  if (existsSync(MIGRATIONS_DIR)) {
    for (const f of readdirSync(MIGRATIONS_DIR)) {
      const m = new RegExp(`^${today}(\\d{6})_`).exec(f);
      if (m) max = Math.max(max, Number(m[1]));
    }
  }
  return `${today}${String(max + 1).padStart(6, '0')}_learning_ideas_${suffix}.sql`;
}

// ── main ────────────────────────────────────────────────────────────────────
function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.slugs.length === 0) die(`Missing --slug. ${USAGE}`);
  for (const s of args.slugs) {
    if (!s || !SLUG_RE.test(s)) die(`Invalid slug "${s}" (expected ${SLUG_RE})`);
  }
  if (new Set(args.slugs).size !== args.slugs.length) die('The same slug was given twice.');

  const videos = args.videos ? readJson(resolve(args.videos), 'videos file') : null;
  if (videos && (typeof videos !== 'object' || Array.isArray(videos))) {
    die('videos file must be an object keyed by slug');
  }

  const entries = [];
  let videoCount = 0;
  for (const slug of args.slugs) {
    const specPath = join(SPECS_DIR, `${slug}.json`);
    if (!existsSync(specPath)) {
      die(`No ideas spec for "${slug}" at ${specPath}\n  The learning-idea-cutter / learning-drafter agent writes it.`);
    }
    const spec = readJson(specPath, `ideas spec ${slug}`);

    const manifestPath = join(INBOX_DIR, slug, 'manifest.json');
    const manifest = existsSync(manifestPath) ? readJson(manifestPath, `manifest ${slug}`) : null;
    if (!manifest) warn(`${slug}: no manifest at ${relative(REPO_ROOT, manifestPath)} — every image will be null`);
    else if (manifest.slug && manifest.slug !== slug) die(`${slug}: manifest.json belongs to "${manifest.slug}"`);

    const { ideas, images } = buildIdeas(slug, spec, manifest, videos?.[slug]);
    videoCount += ideas.reduce((n, i) => n + (i.video.pt ? 1 : 0) + (i.video.en ? 1 : 0), 0);
    entries.push({ slug, ideas, images, json: serializeIdeas(slug, ideas) });
  }
  if (videos) {
    for (const s of Object.keys(videos)) {
      if (!args.slugs.includes(s)) warn(`videos file has "${s}", which is not among the slugs — ignored`);
    }
  }

  const suffix = entries.length === 1 ? entries[0].slug : 'batch';
  const outPath = args.out ? resolve(args.out) : join(MIGRATIONS_DIR, nextMigrationName(suffix));
  const sql = buildSql({ fileName: outPath.split(/[\\/]/).pop(), entries, videoCount });

  info(`\n▶ emit-migration · ${entries.map((e) => `${e.slug} (${e.ideas.length})`).join(', ')}`);
  const shown = relative(REPO_ROOT, outPath);
  info(`  → ${shown && !shown.startsWith('..') ? shown : outPath}`);

  if (args.stdout) process.stdout.write(sql);
  if (!args.stdout || args.out) {
    if (existsSync(outPath)) die(`${outPath} already exists — migrations are write-once; pick another --out`);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, sql, 'utf8');
    info(`  ✓ written (${Buffer.byteLength(sql, 'utf8')} bytes, utf-8)`);
  } else {
    info('  (--stdout: nothing written)');
  }
  info('\n  Next: upload the images listed in the header, `supabase storage ls` to confirm,');
  info('        then apply with /db-migration (or `supabase db push --linked`).\n');
}

main();
