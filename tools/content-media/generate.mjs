#!/usr/bin/env node
/* eslint-env node */
/**
 * Content-media pipeline — Phase A (cover + infographic).
 *
 * Reads a media spec written by the `learning-art-director` agent and produces
 * the media assets for one Learning material, ready for ingestion:
 *   - cover.webp            (Gemini 2.5 Flash Image, 2:3, textless)
 *   - infographic.<loc>.webp (branded SVG -> resvg -> webp, one per locale)
 *   - manifest.json         (what to upload + the DB rows to insert)
 *
 * It does NOT touch Supabase or git — it only writes files into the drop
 * folder. The `learning-publisher` agent (or a human) uploads via
 * `supabase storage cp` and writes the migration from manifest.json.
 *
 * A partial run (`--only cover`, `--locales pt`) MERGES into the manifest
 * already in the drop folder instead of replacing it — otherwise the assets an
 * earlier run produced vanish from the manifest and are never uploaded.
 *
 * Usage:
 *   node generate.mjs --slug <slug> [--only cover|infographic]
 *                     [--locales pt,en] [--dry-run]
 *
 * Spec location:  learning-drops/inbox/<slug>/media-spec.json
 * Output:         same folder
 *
 * Env:
 *   GEMINI_API_KEY        required for cover generation (AI Studio key, billing on)
 *   GEMINI_IMAGE_MODEL    optional override (default gemini-2.5-flash-image)
 *   EXPO_PUBLIC_SUPABASE_URL  used to precompute the cover hero_image_url
 *   FFMPEG_PATH           optional ffmpeg override
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

import { synthesizeDialogue, pcmToWav } from './lib/audio.mjs';
import { generateCover } from './lib/cover.mjs';
import { probeDurationSeconds, toM4a, toWebp, toWebpCover } from './lib/ffmpeg.mjs';
import { buildInfographicSvg } from './lib/infographic.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://uneqnpyzevosznwkmvvo.supabase.co';
const MEDIA_PUBLIC_BASE = `${SUPABASE_URL}/storage/v1/object/public/learning-media/`;

const COVER_W = 768;
const COVER_H = 1152; // 2:3
const INFO_W = 1080;
const INFO_H = 1920; // 9:16 portrait

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
const KIND_ORDER = ['infographic', 'cover', 'audio'];

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
  const carried = [];
  for (const a of prior.assets) {
    if (!a?.bucketPath || !a.localPath || fresh.has(a.bucketPath)) continue;
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
      String(x.locale ?? '').localeCompare(String(y.locale ?? '')),
  );
  manifest.generated = manifest.assets.map((a) => a.localPath);
  return carried.length;
}

// ── main ────────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.slug) die('Missing --slug. Usage: node generate.mjs --slug <slug> [--only cover|infographic] [--dry-run]');

  const inboxDir = join(REPO_ROOT, 'learning-drops', 'inbox', args.slug);
  const specPath = join(inboxDir, 'media-spec.json');
  if (!existsSync(specPath)) {
    die(
      `No media-spec.json at ${specPath}\n` +
        `  The learning-art-director agent writes this file. See tools/content-media/README.md for the contract.`,
    );
  }

  /** @type {any} */
  let spec;
  try {
    spec = JSON.parse(readFileSync(specPath, 'utf8'));
  } catch (e) {
    die(`media-spec.json is not valid JSON: ${e.message}`);
  }

  const dimensionId = spec.dimension_id;
  if (!dimensionId) die('media-spec.json is missing "dimension_id".');

  const wantCover = !['infographic', 'audio'].includes(args.only) && spec.cover?.prompt;
  const wantInfographic = !['cover', 'audio'].includes(args.only) && spec.infographic;
  const wantAudio = !['cover', 'infographic'].includes(args.only);

  const localesAll = args.locales ?? ['pt', 'en'];
  mkdirSync(inboxDir, { recursive: true });
  const tmpDir = join(inboxDir, '.tmp');
  mkdirSync(tmpDir, { recursive: true });

  const manifest = { slug: args.slug, dimension_id: dimensionId, generated: [], assets: [] };

  log(`\n▶ content-media · ${args.slug}  (${dimensionId})`);
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
    log('  · cover (Gemini 2.5 Flash Image, 2:3) …');
    if (!args.dryRun) {
      try {
        const { buffer, mimeType } = await generateCover({ prompt: spec.cover.prompt });
        const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
        const rawPath = join(tmpDir, `cover.raw.${ext}`);
        writeFileSync(rawPath, buffer);

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
  } else if (args.only !== 'infographic' && !spec.cover?.prompt) {
    log('  · cover: skipped (no cover.prompt in spec)');
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
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
