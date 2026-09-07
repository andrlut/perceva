#!/usr/bin/env node
/* eslint-env node */
/**
 * Content-media pipeline — Phase A (cover + infographic + audio + ideas).
 *
 * Reads a media spec written by the `learning-art-director` agent and produces
 * the media assets for one Learning material, ready for ingestion:
 *   - cover.webp              (Gemini 3.1 Flash Image, 2:3, textless)
 *   - infographic.<loc>.webp  (branded SVG -> resvg -> webp, one per locale)
 *   - audio.<loc>.m4a         (Gemini TTS, from audio-script.<loc>.json)
 *   - idea.<n>.<sha8>.webp    (Gemini 3.1 Flash Image, 4:5, one per entry of
 *                              spec.ideas — Recanto em ideias)
 *   - manifest.json           (what to upload + the DB rows to insert)
 *
 * It does NOT touch Supabase or git — it only writes files into the drop
 * folder. The `learning-publisher` agent (or a human) uploads via
 * `supabase storage cp` and writes the migration from manifest.json
 * (`emit-migration.mjs` does the `ideas` one).
 *
 * A partial run (`--only cover`, `--locales pt`) MERGES into the manifest
 * already in the drop folder instead of replacing it — otherwise the assets an
 * earlier run produced vanish from the manifest and are never uploaded.
 *
 * Usage:
 *   node generate.mjs --slug <slug> [--only cover|infographic|audio|ideas]
 *                     [--locales pt,en] [--dry-run]
 *
 * `--only` is an ALLOWLIST: one step, nothing else runs; any other value is an
 * error. Without it, cover + infographic + audio run as before, plus ideas
 * when the spec carries a non-empty `ideas` array.
 *
 * Spec location:  learning-drops/media-specs/<slug>.json      (versioned; first)
 *                 learning-drops/inbox/<slug>/media-spec.json  (fallback)
 * Output:         learning-drops/inbox/<slug>/  (assets + manifest, gitignored)
 *
 * Env:
 *   GEMINI_API_KEY        required for cover generation (AI Studio key, billing on)
 *   GEMINI_IMAGE_MODEL    optional override (default gemini-3.1-flash-image)
 *   GEMINI_IMAGE_SIZE     optional override (default 1K)
 *   COVER_STYLE_REFS      'none' disables the style reference images, or a
 *                         comma-separated list of files in style-refs/
 *   COVER_STYLE_GLYPH     'on' adds the Perceva glyph as a reference (off by
 *                         default — see lib/styleRefs.mjs for why)
 *   EXPO_PUBLIC_SUPABASE_URL  used to precompute the cover hero_image_url
 *   FFMPEG_PATH           optional ffmpeg override
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

import { synthesizeDialogue, pcmToWav } from './lib/audio.mjs';
import { generateCover, generateIdeaImage } from './lib/cover.mjs';
import { probeDurationSeconds, probeImageSize, toM4a, toWebp, toWebpCover } from './lib/ffmpeg.mjs';
import { buildInfographicSvg } from './lib/infographic.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://uneqnpyzevosznwkmvvo.supabase.co';
const MEDIA_PUBLIC_BASE = `${SUPABASE_URL}/storage/v1/object/public/learning-media/`;

const COVER_W = 768;
const COVER_H = 1152; // 2:3
const IDEA_W = 960;
const IDEA_H = 1200; // 4:5 — the idea image is shown whole inside the card
const INFO_W = 1080;
const INFO_H = 1920; // 9:16 portrait

// `--only` allowlist. A value outside it is an error, not "everything" — the
// old exclusion-list semantics made `--only ideas` regenerate every asset.
const ONLY_STEPS = ['cover', 'infographic', 'audio', 'ideas'];

// Background color resvg paints behind the SVG (matches token bg.deep so any
// transparent edge blends instead of showing white).
const TOKENS_BG = 'rgba(10, 14, 38, 1)';

// ── arg parsing ────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { only: null, locales: null, dryRun: false, slug: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--slug') args.slug = argv[++i];
    else if (a === '--only') args.only = argv[++i];
    else if (a === '--locales') args.locales = argv[++i].split(',').map((s) => s.trim());
    else if (a === '--dry-run') args.dryRun = true;
    else if (!a.startsWith('--') && !args.slug) args.slug = a;
  }
  return args;
}

function die(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

function log(msg) {
  console.log(msg);
}

// Canonical asset order in the manifest, so the output does not depend on which
// partial runs happened in which order.
const KIND_ORDER = ['infographic', 'cover', 'audio', 'idea'];

/**
 * Stable file name for one idea image. The hash covers the id AND the prompt:
 * a re-brief produces a new path (the bucket never overwrites — 409), and the
 * `ideas` JSON in the DB points at whichever one the migration was emitted
 * from. 8 hex chars is plenty for ≤5 ideas per material.
 */
function ideaFileName(id, ordinal, imagePrompt) {
  const sha8 = createHash('sha256').update(`${id}\n${imagePrompt}`).digest('hex').slice(0, 8);
  return `idea.${ordinal}.${sha8}.webp`;
}

/**
 * Fold the manifest already on disk into the one this run built. Every prior
 * asset this run did not regenerate is carried over, as long as its file is
 * still in the drop folder — a manifest entry without a file breaks the upload
 * step. Mutates `manifest`; returns how many entries were carried over.
 */
function mergePriorManifest(manifest, inboxDir) {
  const priorPath = join(inboxDir, 'manifest.json');
  if (!existsSync(priorPath)) return 0;

  let prior;
  try {
    prior = JSON.parse(readFileSync(priorPath, 'utf8'));
  } catch (e) {
    log(`  ! manifest.json on disk is not valid JSON (${e.message}) — overwriting it`);
    return 0;
  }
  if (!prior || prior.slug !== manifest.slug || !Array.isArray(prior.assets)) return 0;

  const fresh = new Set(manifest.assets.map((a) => a.bucketPath));
  // An idea regenerated with a new prompt gets a new sha8 path, so bucketPath
  // alone would keep BOTH versions in the manifest; key ideas by idea_id too.
  const freshIdeas = new Set(
    manifest.assets.filter((a) => a.kind === 'idea').map((a) => a.idea_id),
  );
  const carried = [];
  for (const a of prior.assets) {
    if (!a?.bucketPath || !a.localPath || fresh.has(a.bucketPath)) continue;
    if (a.kind === 'idea' && freshIdeas.has(a.idea_id)) {
      log(`  · superseded ${a.localPath} (idea ${a.idea_id} regenerated in this run)`);
      continue;
    }
    if (!existsSync(join(inboxDir, a.localPath))) {
      log(`  ! dropped stale manifest entry ${a.localPath} (file no longer in the drop folder)`);
      continue;
    }
    carried.push(a);
    log(`  · carried over ${a.localPath} from a previous run`);
  }
  if (carried.length === 0) return 0;

  manifest.assets = [...manifest.assets, ...carried].sort(
    (x, y) =>
      KIND_ORDER.indexOf(x.kind) - KIND_ORDER.indexOf(y.kind) ||
      String(x.locale ?? '').localeCompare(String(y.locale ?? '')) ||
      (x.ordinal ?? 0) - (y.ordinal ?? 0),
  );
  manifest.generated = manifest.assets.map((a) => a.localPath);
  return carried.length;
}

// ── main ────────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const usage = `Usage: node generate.mjs --slug <slug> [--only ${ONLY_STEPS.join('|')}] [--locales pt,en] [--dry-run]`;
  if (!args.slug) die(`Missing --slug. ${usage}`);
  // Validated before the spec lookup so a typo fails the same way whether or
  // not the drop folder exists.
  if (args.only != null && !ONLY_STEPS.includes(args.only)) {
    die(`Unknown --only value "${args.only}". Allowed: ${ONLY_STEPS.join(' | ')}\n  ${usage}`);
  }

  const inboxDir = join(REPO_ROOT, 'learning-drops', 'inbox', args.slug);
  // The versioned spec wins; the in-drop file is the pre-media-specs/ layout.
  const specCandidates = [
    join(REPO_ROOT, 'learning-drops', 'media-specs', `${args.slug}.json`),
    join(inboxDir, 'media-spec.json'),
  ];
  const specPath = specCandidates.find((p) => existsSync(p));
  if (!specPath) {
    die(
      `No media spec for "${args.slug}". Looked for:\n` +
        specCandidates.map((p) => `    ${p}`).join('\n') +
        `\n  The learning-art-director agent writes this file. See tools/content-media/README.md for the contract.`,
    );
  }

  /** @type {any} */
  let spec;
  try {
    // Windows editors like to prepend a BOM, which JSON.parse rejects.
    spec = JSON.parse(readFileSync(specPath, 'utf8').replace(/^\uFEFF/, ''));
  } catch (e) {
    die(`${specPath} is not valid JSON: ${e.message}`);
  }

  const dimensionId = spec.dimension_id;
  if (!dimensionId) die('media spec is missing "dimension_id".');

  // No --only: every step is in scope (ideas only if the spec has any).
  const inScope = (step) => args.only == null || args.only === step;
  const ideas = Array.isArray(spec.ideas) ? spec.ideas : [];
  const wantCover = inScope('cover') && Boolean(spec.cover?.prompt);
  const wantInfographic = inScope('infographic') && Boolean(spec.infographic);
  const wantAudio = inScope('audio');
  const wantIdeas = inScope('ideas') && (args.only === 'ideas' || ideas.length > 0);

  const localesAll = args.locales ?? ['pt', 'en'];
  mkdirSync(inboxDir, { recursive: true });
  const tmpDir = join(inboxDir, '.tmp');
  mkdirSync(tmpDir, { recursive: true });

  const manifest = { slug: args.slug, dimension_id: dimensionId, generated: [], assets: [] };

  log(`\n▶ content-media · ${args.slug}  (${dimensionId})`);
  log(`  spec: ${specPath}`);
  if (args.dryRun) log('  [dry-run: no files written, no API calls]');

  // ── infographic (one webp per locale that has content) ────────────────────
  if (wantInfographic) {
    // Only render a locale if its headline exists.
    const info = spec.infographic;
    const locales = localesAll.filter((loc) => {
      const h = info.headline;
      return h && (typeof h === 'string' || h[loc]);
    });
    if (locales.length === 0) log('  · infographic: skipped (no localized headline in spec)');
    for (const locale of locales) {
      log(`  · infographic.${locale} …`);
      if (args.dryRun) continue;
      const svg = buildInfographicSvg({ locale, dimensionId, data: info, width: INFO_W, height: INFO_H });
      // Keep the SVG for auditing / manual tweaks.
      writeFileSync(join(inboxDir, `infographic.${locale}.svg`), svg, 'utf8');

      const resvg = new Resvg(svg, {
        background: TOKENS_BG,
        fitTo: { mode: 'width', value: INFO_W },
        font: {
          loadSystemFonts: true,
          fontDirs: [join(__dirname, 'fonts')], // drop Manrope-*.ttf here to upgrade
          defaultFontFamily: 'Segoe UI',
        },
      });
      const png = resvg.render().asPng();
      const tmpPng = join(tmpDir, `infographic.${locale}.png`);
      writeFileSync(tmpPng, png);

      const outWebp = join(inboxDir, `infographic.${locale}.webp`);
      toWebp(tmpPng, outWebp, INFO_W, 84);

      manifest.assets.push({
        role: 'media',
        kind: 'infographic',
        locale,
        source: 'manual',
        localPath: `infographic.${locale}.webp`,
        bucketPath: `${args.slug}/infographic.${locale}.webp`,
        width: INFO_W,
        height: INFO_H,
        contentType: 'image/webp',
      });
      manifest.generated.push(`infographic.${locale}.webp`);
      log(`    ✓ infographic.${locale}.webp`);
    }
  }

  // ── cover (single 2:3 image, textless) ────────────────────────────────────
  if (wantCover) {
    log('  · cover (Gemini 3.1 Flash Image, 2:3) …');
    if (!args.dryRun) {
      try {
        const { buffer, mimeType, refs } = await generateCover({
          prompt: spec.cover.prompt,
          onWarn: (m) => log(`      ! ${m}`),
        });
        const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
        const rawPath = join(tmpDir, `cover.raw.${ext}`);
        writeFileSync(rawPath, buffer);

        // Logged on every run so we learn whether aspectRatio was honoured
        // instead of assuming it — the ffmpeg crop hides the answer otherwise.
        const size = probeImageSize(rawPath);
        const ratio = size ? size.width / size.height : null;
        log(
          `      ${size ? `${size.width}×${size.height}` : 'dimensões desconhecidas'}` +
            (ratio
              ? Math.abs(ratio - 2 / 3) < 0.01
                ? ' (2:3 honrado)'
                : ' (NÃO é 2:3 — o crop corta)'
              : '') +
            ` · ${refs.length} ref(s) de estilo${refs.length ? `: ${refs.join(', ')}` : ''}`,
        );

        const outWebp = join(inboxDir, 'cover.webp');
        toWebpCover(rawPath, outWebp, COVER_W, COVER_H, 84);

        manifest.assets.push({
          role: 'cover',
          kind: 'cover',
          locale: null,
          source: 'gemini-api',
          localPath: 'cover.webp',
          bucketPath: `${args.slug}/cover.webp`,
          hero_image_url: `${MEDIA_PUBLIC_BASE}${args.slug}/cover.webp`,
          width: COVER_W,
          height: COVER_H,
          contentType: 'image/webp',
        });
        manifest.generated.push('cover.webp');
        log('    ✓ cover.webp');
      } catch (e) {
        log(`    ✗ cover failed: ${e.message}`);
        log('      (infographic assets, if any, were still produced)');
      }
    }
  } else if (inScope('cover')) {
    log('  · cover: skipped (no cover.prompt in spec)');
  }

  // ── ideas (one 4:5 image per idea, textless) ──────────────────────────────
  // One failure logs and moves on: an idea without an image still ships (the
  // idea screen falls back to the card without art); the whole material
  // failing over one refused prompt would not.
  if (wantIdeas) {
    if (ideas.length === 0) log('  · ideas: skipped (no "ideas" array in spec)');
    for (const idea of ideas) {
      const id = idea?.id;
      const ordinal = idea?.ordinal;
      const imagePrompt = typeof idea?.image_prompt === 'string' ? idea.image_prompt.trim() : '';
      if (!id || !Number.isInteger(ordinal) || ordinal < 1 || !imagePrompt) {
        log(`    ✗ idea ${ordinal ?? '?'} (${id ?? 'sem id'}): needs id, ordinal ≥ 1 and image_prompt — skipped`);
        continue;
      }
      const fileName = ideaFileName(id, ordinal, imagePrompt);
      log(`  · ${fileName} ← ${id} (Gemini 3.1 Flash Image, 4:5) …`);
      if (args.dryRun) continue;
      try {
        const { buffer, mimeType, refs } = await generateIdeaImage({
          prompt: imagePrompt,
          onWarn: (m) => log(`      ! ${m}`),
        });
        const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
        const rawPath = join(tmpDir, `idea.${ordinal}.raw.${ext}`);
        writeFileSync(rawPath, buffer);

        const size = probeImageSize(rawPath);
        const ratio = size ? size.width / size.height : null;
        log(
          `      ${size ? `${size.width}×${size.height}` : 'dimensões desconhecidas'}` +
            (ratio
              ? Math.abs(ratio - 4 / 5) < 0.01
                ? ' (4:5 honrado)'
                : ' (NÃO é 4:5 — o crop corta)'
              : '') +
            ` · ${refs.length} ref(s) de estilo${refs.length ? `: ${refs.join(', ')}` : ''}`,
        );

        toWebpCover(rawPath, join(inboxDir, fileName), IDEA_W, IDEA_H, 84);

        manifest.assets.push({
          role: 'idea',
          kind: 'idea',
          idea_id: id,
          ordinal,
          source: 'gemini-api',
          localPath: fileName,
          bucketPath: `${args.slug}/${fileName}`,
          width: IDEA_W,
          height: IDEA_H,
          contentType: 'image/webp',
        });
        manifest.generated.push(fileName);
        log(`    ✓ ${fileName}`);
      } catch (e) {
        log(`    ✗ idea ${ordinal} (${id}) failed: ${e.message}`);
        log('      (continuing with the remaining ideas)');
      }
    }
  }

  // ── audio (2-host podcast per locale that has a dialogue script) ──────────
  if (wantAudio) {
    const audioLocales = localesAll.filter((loc) =>
      existsSync(join(inboxDir, `audio-script.${loc}.json`)),
    );
    if (audioLocales.length === 0 && args.only === 'audio') {
      log('  · audio: skipped (no audio-script.<loc>.json — run learning-audio-writer first)');
    }
    for (const locale of audioLocales) {
      log(`  · audio.${locale} (Gemini TTS multi-voz) …`);
      if (args.dryRun) continue;
      try {
        const script = JSON.parse(readFileSync(join(inboxDir, `audio-script.${locale}.json`), 'utf8'));
        const { pcm, sampleRate, segments } = await synthesizeDialogue({
          turns: script.turns,
          hosts: script.hosts,
          style: script.style,
          onProgress: (m) => log(`      ${m}`),
        });
        const wavPath = join(tmpDir, `audio.${locale}.wav`);
        writeFileSync(wavPath, pcmToWav(pcm, sampleRate));
        const outM4a = join(inboxDir, `audio.${locale}.m4a`);
        toM4a(wavPath, outM4a, '64k');
        const dur = probeDurationSeconds(outM4a);
        manifest.assets.push({
          role: 'media',
          kind: 'audio',
          locale,
          source: 'gemini-api',
          localPath: `audio.${locale}.m4a`,
          bucketPath: `${args.slug}/audio.${locale}.m4a`,
          duration_seconds: dur,
          contentType: 'audio/mp4',
        });
        manifest.generated.push(`audio.${locale}.m4a`);
        const mm = Math.floor(dur / 60);
        const ss = String(dur % 60).padStart(2, '0');
        log(`    ✓ audio.${locale}.m4a (${segments} segmento(s), ${mm}:${ss})`);
      } catch (e) {
        log(`    ✗ audio.${locale} failed: ${e.message}`);
      }
    }
  }

  // ── manifest + cleanup ────────────────────────────────────────────────────
  const producedNow = manifest.generated.length;
  if (!args.dryRun) {
    mergePriorManifest(manifest, inboxDir);
    writeFileSync(join(inboxDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
  }

  // ── summary + next steps ──────────────────────────────────────────────────
  log(`\n✓ Done. ${producedNow} asset(s) generated, ${manifest.generated.length} in the manifest · learning-drops/inbox/${args.slug}/`);
  if (manifest.assets.length && !args.dryRun) {
    log('\nNext (ingestion — the publisher agent does this automatically):');
    for (const a of manifest.assets) {
      log(
        `  supabase storage cp ./learning-drops/inbox/${args.slug}/${a.localPath} ` +
          `ss:///learning-media/${a.bucketPath} --content-type ${a.contentType} ` +
          `--cache-control "public, max-age=31536000, immutable" --experimental --linked`,
      );
    }
    log('\n  Then write a migration from manifest.json:');
    log('   · cover  -> update learning_material set hero_image_url = <hero_image_url> where slug = ...');
    log("   · media  -> insert into learning_material_media (kind, locale, path, source, meta) ...");
    if (manifest.assets.some((a) => a.kind === 'idea')) {
      log(`   · ideas  -> node tools/content-media/emit-migration.mjs --slug ${args.slug}`);
      log('              (joins learning-drops/ideas-specs/<slug>.json with this manifest)');
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
