#!/usr/bin/env node
/* eslint-env node */
/**
 * Teaser reel-card batch renderer — the "Explorar" feed assets.
 *
 * Reads per-material teaser specs (written by the reels content agents /
 * art-director) and renders 3 cards × 2 locales per material:
 *   learning-drops/reels-specs/_materials.json   slug → {type, dimension_id,
 *                                                titles, hero_image_url}
 *   learning-drops/reels-specs/<slug>.json       {slug, reels:[×3]}
 * Output:
 *   learning-drops/reels-out/<slug>/reel.<loc>.<n>.webp
 *   learning-drops/reels-out/manifest.json       upload list + DB rows
 *
 * Covers are fetched from hero_image_url and transcoded to JPEG (resvg has
 * no webp decoder). Materials without a cover render on the token gradient.
 *
 * Usage:  node reels.mjs --all | --slug <slug>   [--locales pt,en]
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

import { resolveFfmpeg, toWebp } from './lib/ffmpeg.mjs';
import { buildTeaserCardSvg } from './lib/reelteaser.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const SPECS_DIR = join(REPO_ROOT, 'learning-drops', 'reels-specs');
const OUT_DIR = join(REPO_ROOT, 'learning-drops', 'reels-out');

const W = 1080;
const H = 1920;
const TOKENS_BG = 'rgba(10, 14, 38, 1)';
const FONT_OPTS = {
  loadSystemFonts: false,
  fontDirs: [join(__dirname, 'fonts')],
  defaultFontFamily: 'Manrope',
};

const TYPE_LABEL = {
  summary: { pt: 'Resumo', en: 'Summary' },
  explainer: { pt: 'Explicação', en: 'Explainer' },
  news: { pt: 'Notícia', en: 'News' },
};

function parseArgs(argv) {
  const args = { all: false, slug: null, locales: ['pt', 'en'] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--all') args.all = true;
    else if (a === '--slug') args.slug = argv[++i];
    else if (a === '--locales') args.locales = argv[++i].split(',').map((s) => s.trim());
  }
  return args;
}

async function coverDataUri(heroImageUrl, tmpDir, slug) {
  if (!heroImageUrl) return null;
  try {
    const res = await fetch(heroImageUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const rawPath = join(tmpDir, `${slug}-cover-src`);
    writeFileSync(rawPath, buf);
    // resvg has no webp decoder — transcode the cover to JPEG before embedding.
    const jpgPath = join(tmpDir, `${slug}-cover.jpg`);
    execFileSync(resolveFfmpeg(), ['-y', '-hide_banner', '-loglevel', 'error', '-i', rawPath, '-q:v', '4', jpgPath], {
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    return `data:image/jpeg;base64,${readFileSync(jpgPath).toString('base64')}`;
  } catch (e) {
    console.warn(`  ⚠ capa indisponível pra ${slug} (${e.message}) — fundo de token`);
    return null;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const materials = JSON.parse(readFileSync(join(SPECS_DIR, '_materials.json'), 'utf8'));
  const bySlug = Object.fromEntries(materials.map((m) => [m.slug, m]));

  const slugs = args.all
    ? readdirSync(SPECS_DIR)
        .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
        .map((f) => f.replace(/\.json$/, ''))
    : [args.slug].filter(Boolean);
  if (!slugs.length) {
    console.error('Usage: node reels.mjs --all | --slug <slug>');
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const tmpDir = join(OUT_DIR, '.tmp');
  mkdirSync(tmpDir, { recursive: true });

  const manifest = { assets: [], rows: [] };
  let rendered = 0;

  for (const slug of slugs) {
    const meta = bySlug[slug];
    if (!meta) {
      console.warn(`✗ ${slug}: sem entrada em _materials.json — pulado`);
      continue;
    }
    const spec = JSON.parse(readFileSync(join(SPECS_DIR, `${slug}.json`), 'utf8'));
    if (!Array.isArray(spec.reels) || spec.reels.length !== 3) {
      console.warn(`✗ ${slug}: spec.reels precisa ter exatamente 3 cards — pulado`);
      continue;
    }

    const outSlugDir = join(OUT_DIR, slug);
    mkdirSync(outSlugDir, { recursive: true });
    const cover = await coverDataUri(meta.hero_image_url, tmpDir, slug);

    for (const locale of args.locales) {
      const title = locale === 'pt' ? meta.title_pt : meta.title_en;
      const typeLabel = (TYPE_LABEL[meta.type] ?? TYPE_LABEL.explainer)[locale];
      const footerLabel = `${typeLabel} · ${title}`.slice(0, 64);
      const pagePaths = [];

      for (let n = 0; n < 3; n++) {
        const svg = buildTeaserCardSvg({
          locale,
          dimensionId: meta.dimension_id,
          card: spec.reels[n],
          coverDataUri: cover,
          footerLabel,
        });
        const png = new Resvg(svg, {
          background: TOKENS_BG,
          fitTo: { mode: 'width', value: W },
          font: FONT_OPTS,
        }).render().asPng();
        const pngPath = join(tmpDir, `${slug}.${locale}.${n + 1}.png`);
        writeFileSync(pngPath, png);
        const webpName = `reel.${locale}.${n + 1}.webp`;
        toWebp(pngPath, join(outSlugDir, webpName), W);
        const bucketPath = `${slug}/${webpName}`;
        pagePaths.push(bucketPath);
        manifest.assets.push({
          localPath: join('learning-drops', 'reels-out', slug, webpName),
          bucketPath,
          contentType: 'image/webp',
        });
        rendered += 1;
      }

      manifest.rows.push({
        slug,
        kind: 'reel',
        locale,
        path: pagePaths[0],
        page_paths: pagePaths,
        source: 'manual',
        meta: { width: W, height: H },
      });
    }
    console.log(`✓ ${slug}`);
  }

  writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  rmSync(tmpDir, { recursive: true, force: true });
  console.log(`\n${rendered} cards renderizados · manifest em learning-drops/reels-out/manifest.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
