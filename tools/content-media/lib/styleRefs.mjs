/* eslint-env node */
/**
 * Style reference images for cover generation.
 *
 * WHY THIS EXISTS: the house look of the Learning covers used to live entirely
 * in cover.mjs's STYLE_SUFFIX — a paragraph of adjectives. Prose does not
 * survive a model generation change: gemini-2.5-flash-image and
 * gemini-3.1-flash-image read the same words and draw different pictures.
 * Anchoring the style to PIXELS of covers that are already live keeps new
 * covers in the same family as the ones in the app.
 *
 * The refs and the reasoning behind the selection live in ../style-refs/
 * (manifest.json documents each file's provenance).
 *
 * NOTHING HERE MAY THROW. A missing or corrupt ref degrades to prompt-only —
 * a drop shipping with a slightly-off cover is a bad day; a drop failing
 * outright because a jpeg went missing is a worse one.
 *
 * Env:
 *   COVER_STYLE_REFS   'none'/'off' disables; a comma-separated list of file
 *                      names (relative to style-refs/) or absolute paths
 *                      replaces the default set. Unset = the covers in the
 *                      manifest.
 *   COVER_STYLE_GLYPH  'on'/'1'/'true' appends the Perceva glyph. OFF by
 *                      default: no house cover contains a mark, and feeding a
 *                      logo as a style reference is the shortest path to one
 *                      being stamped into the art — which the cover contract
 *                      forbids outright.
 */

import { readFileSync } from 'node:fs';
import { dirname, extname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REFS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'style-refs');

/** Gemini 3.x flash accepts at most 3 STYLE reference images. */
export const MAX_STYLE_REFS = 3;

const MIME_BY_EXT = {
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

const isOn = (v) => /^(on|1|true|yes)$/i.test(String(v ?? '').trim());
const isOff = (v) => /^(none|off|0|false|no)$/i.test(String(v ?? '').trim());

/** Read the manifest, or null if it is missing/unparseable (never throws). */
function readManifest(onWarn) {
  try {
    return JSON.parse(readFileSync(join(REFS_DIR, 'manifest.json'), 'utf8'));
  } catch (e) {
    onWarn?.(`style-refs/manifest.json ilegível (${e.code || e.message}) — seguindo só com o prompt`);
    return null;
  }
}

/** Which files to send, as manifest entries. */
function selectEntries(onWarn) {
  const raw = process.env.COVER_STYLE_REFS;
  if (isOff(raw)) return [];

  const manifest = readManifest(onWarn);
  const all = Array.isArray(manifest?.refs) ? manifest.refs : [];

  // Explicit override: an arbitrary list of names/paths.
  if (raw !== undefined && raw.trim() !== '') {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((file) => all.find((r) => r.file === file) ?? { file });
  }

  const entries = all.filter((r) => r.kind === 'cover');
  if (isOn(process.env.COVER_STYLE_GLYPH)) {
    const glyph = all.find((r) => r.kind === 'glyph');
    // The cap is 3, so turning the glyph on costs a cover rather than
    // silently sending a 4th ref the model may ignore.
    if (glyph) entries.splice(MAX_STYLE_REFS - 1, entries.length, glyph);
  }
  return entries;
}

/** Rasterize an SVG ref to PNG. resvg is already a dependency (infographics). */
async function rasterize(path, width) {
  const { Resvg } = await import('@resvg/resvg-js');
  const svg = readFileSync(path, 'utf8');
  return new Resvg(svg, { fitTo: { mode: 'width', value: width || 512 } }).render().asPng();
}

/**
 * Load the style references as Gemini inline-data parts.
 * @param {(msg: string) => void} [onWarn]
 * @returns {Promise<{ parts: Array<{inlineData: {mimeType: string, data: string}}>, names: string[] }>}
 */
export async function loadStyleRefs(onWarn) {
  const entries = selectEntries(onWarn);
  if (entries.length > MAX_STYLE_REFS) {
    onWarn?.(`${entries.length} refs configuradas; o modelo aceita ${MAX_STYLE_REFS} — usando as primeiras`);
  }

  const parts = [];
  const names = [];
  for (const entry of entries.slice(0, MAX_STYLE_REFS)) {
    const path = isAbsolute(entry.file) ? entry.file : join(REFS_DIR, entry.file);
    const ext = extname(path).toLowerCase();
    try {
      let buffer;
      let mimeType;
      if (ext === '.svg') {
        // SVG is not a mime type Gemini accepts — rasterize it first.
        buffer = await rasterize(path, entry.rasterize);
        mimeType = 'image/png';
      } else {
        mimeType = MIME_BY_EXT[ext];
        if (!mimeType) {
          onWarn?.(`ref ignorada, extensão não suportada: ${entry.file}`);
          continue;
        }
        buffer = readFileSync(path);
      }
      parts.push({ inlineData: { mimeType, data: buffer.toString('base64') } });
      names.push(entry.file);
    } catch (e) {
      onWarn?.(`ref de estilo indisponível, seguindo sem ela: ${entry.file} (${e.code || e.message})`);
    }
  }
  return { parts, names };
}
