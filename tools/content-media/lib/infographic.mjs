/* eslint-env node */
/**
 * Branded infographic builder for Learning materials.
 *
 * Renders a portrait 1080×1920 SVG from STRUCTURED data (never free-form
 * layout). Text is real font glyphs and colors are exact Perceva design
 * tokens, so the output is deterministic, always spelled correctly, and
 * on-brand — which is exactly why we render code instead of asking an image
 * model to "draw an infographic" (see tools/content-media/README.md for the
 * evidence: even the best 2026 image model gets a fully-correct infographic
 * only ~49% of the time).
 *
 * The caller (generate.mjs) rasterizes the returned SVG string to PNG with
 * @resvg/resvg-js and then to webp with ffmpeg.
 */

// ── Perceva design tokens (mirror of app/theme/tokens.ts) ────────────────
const TOKENS = {
  bg: { deep: '#0A0E26', base: '#0E1230', top: '#1E2348' },
  text: { hi: '#F2F3FF', base: '#D9DBFA', mid: '#9AA0D4', dim: '#6E74A8', faint: '#4A4F7A' },
  dimension: {
    health: '#FF6B7A',
    body: '#FF8A3D',
    mind: '#B07BFF',
    wealth: '#FFC83D',
    bonds: '#4DD0FF',
    craft: '#2EC4B6',
  },
};

const FONT_STACK = "Manrope, 'Segoe UI', 'Helvetica Neue', system-ui, sans-serif";

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/**
 * Greedy word-wrap into at most `maxLines` lines. Returns an array of line
 * strings; the last line gets an ellipsis if text was truncated. `maxChars`
 * is an estimate derived from the font size and available width (sans-serif
 * average advance ≈ 0.54em; bold ≈ 0.58em).
 */
function wrap(text, maxChars, maxLines = 99) {
  const words = String(text ?? '').trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const candidate = cur ? `${cur} ${w}` : w;
    if (candidate.length <= maxChars || !cur) {
      cur = candidate;
    } else {
      lines.push(cur);
      cur = w;
      if (lines.length === maxLines) break;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length > maxLines) lines.length = maxLines;
  // truncation ellipsis
  const usedAllWords =
    lines.join(' ').split(/\s+/).filter(Boolean).length === words.length;
  if (!usedAllWords && lines.length) {
    let last = lines[lines.length - 1];
    while (last.length > 1 && last.length + 1 > maxChars) last = last.slice(0, -1);
    lines[lines.length - 1] = last.replace(/[\s.,;:]+$/, '') + '…';
  }
  return lines;
}

function maxCharsFor(fontSize, width, weight = 'regular') {
  const em = weight === 'bold' ? 0.58 : 0.54;
  return Math.max(4, Math.floor(width / (fontSize * em)));
}

/**
 * @param {object} opts
 * @param {'pt'|'en'} opts.locale
 * @param {string} opts.dimensionId  one of health|body|mind|wealth|bonds|craft
 * @param {object} opts.data         localized infographic content (see README contract)
 * @param {number} [opts.width]
 * @param {number} [opts.height]
 * @returns {string} SVG document
 */
export function buildInfographicSvg({ locale, dimensionId, data, width = 1080, height = 1920 }) {
  const accent = TOKENS.dimension[dimensionId] ?? TOKENS.dimension.mind;
  const PAD = 96;
  const inner = width - PAD * 2;
  const pick = (v) => (v && typeof v === 'object' ? v[locale] ?? v.pt ?? v.en : v);

  const parts = [];
  let y = 0;

  const text = (content, { x = PAD, size, weight = 'regular', fill, spacing, anchor = 'start' } = {}) => {
    const fw = weight === 'bold' ? 800 : weight === 'semibold' ? 700 : 500;
    parts.push(
      `<text x="${x}" y="${y}" font-family="${FONT_STACK}" font-size="${size}" font-weight="${fw}" fill="${fill}"` +
        (spacing ? ` letter-spacing="${spacing}"` : '') +
        (anchor !== 'start' ? ` text-anchor="${anchor}"` : '') +
        `>${esc(content)}</text>`,
    );
  };

  const multiline = (content, { size, weight = 'regular', fill, lineHeight, maxLines = 99, x = PAD }) => {
    const lines = wrap(content, maxCharsFor(size, inner, weight), maxLines);
    const lh = lineHeight ?? Math.round(size * 1.22);
    const fw = weight === 'bold' ? 800 : weight === 'semibold' ? 700 : 500;
    for (const line of lines) {
      y += lh;
      parts.push(
        `<text x="${x}" y="${y}" font-family="${FONT_STACK}" font-size="${size}" font-weight="${fw}" fill="${fill}">${esc(line)}</text>`,
      );
    }
    return lines.length;
  };

  // ── background ──────────────────────────────────────────────────────────
  const defs =
    `<defs>` +
    `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${TOKENS.bg.top}"/>` +
    `<stop offset="0.5" stop-color="${TOKENS.bg.base}"/>` +
    `<stop offset="1" stop-color="${TOKENS.bg.deep}"/>` +
    `</linearGradient>` +
    `<radialGradient id="halo" cx="0.5" cy="0.12" r="0.8">` +
    `<stop offset="0" stop-color="${accent}" stop-opacity="0.16"/>` +
    `<stop offset="1" stop-color="${accent}" stop-opacity="0"/>` +
    `</radialGradient>` +
    `</defs>`;
  const bg =
    `<rect width="${width}" height="${height}" fill="url(#bg)"/>` +
    `<rect width="${width}" height="${height}" fill="url(#halo)"/>` +
    `<rect x="0" y="0" width="${width}" height="10" fill="${accent}"/>`;

  // ── header ──────────────────────────────────────────────────────────────
  y = 150;
  const eyebrow = pick(data.eyebrow);
  if (eyebrow) {
    text(String(eyebrow).toUpperCase(), { size: 30, weight: 'semibold', fill: accent, spacing: 4 });
    y += 28;
  }

  y += 44;
  multiline(pick(data.headline), { size: 86, weight: 'bold', fill: TOKENS.text.hi, lineHeight: 92, maxLines: 3 });

  const subhead = pick(data.subhead);
  if (subhead) {
    y += 20;
    multiline(subhead, { size: 38, weight: 'regular', fill: TOKENS.text.mid, lineHeight: 50, maxLines: 3 });
  }

  // divider
  y += 56;
  parts.push(`<rect x="${PAD}" y="${y}" width="${inner}" height="3" rx="1.5" fill="${TOKENS.text.faint}" opacity="0.5"/>`);
  y += 8;

  // ── the 3 idea blocks ──────────────────────────────────────────────────
  const points = (data.points ?? []).slice(0, 3);
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    y += 78;
    const numY = y;
    // big numeral in accent, left rail
    parts.push(
      `<text x="${PAD}" y="${numY}" font-family="${FONT_STACK}" font-size="64" font-weight="800" fill="${accent}">${p.n ?? i + 1}</text>`,
    );
    // point title, indented past the numeral
    const railX = PAD + 92;
    const railInner = width - railX - PAD;
    const titleLines = wrap(pick(p.title), maxCharsFor(44, railInner, 'bold'), 2);
    let ty = numY;
    for (let k = 0; k < titleLines.length; k++) {
      if (k > 0) ty += 52;
      parts.push(
        `<text x="${railX}" y="${ty}" font-family="${FONT_STACK}" font-size="44" font-weight="700" fill="${TOKENS.text.hi}">${esc(titleLines[k])}</text>`,
      );
    }
    y = ty;
    // point body
    const bodyLines = wrap(pick(p.body), maxCharsFor(34, railInner), 4);
    for (const line of bodyLines) {
      y += 46;
      parts.push(
        `<text x="${railX}" y="${y}" font-family="${FONT_STACK}" font-size="34" font-weight="500" fill="${TOKENS.text.base}">${esc(line)}</text>`,
      );
    }
  }

  // ── optional highlight stat ────────────────────────────────────────────
  // Guard: only render the stat if there's real room before the footer, so a
  // material with three long idea blocks never collides with the source row.
  const statFits = y < height - 420;
  if (statFits && data.stat && pick(data.stat.value ?? data.stat)) {
    const statValue = pick(data.stat.value ?? data.stat);
    const statCaption = pick(data.stat.caption);
    y += 96;
    parts.push(`<rect x="${PAD}" y="${y}" width="${inner}" height="3" rx="1.5" fill="${TOKENS.text.faint}" opacity="0.4"/>`);
    y += 110;
    parts.push(
      `<text x="${PAD}" y="${y}" font-family="${FONT_STACK}" font-size="120" font-weight="800" fill="${accent}">${esc(statValue)}</text>`,
    );
    if (statCaption) {
      // Stack the caption just under the numeral (aligning it beside a
      // variable-width numeral is unreliable in flat SVG).
      y += 12;
      multiline(statCaption, { size: 36, weight: 'regular', fill: TOKENS.text.mid, lineHeight: 46, maxLines: 2 });
    }
  }

  // ── footer ──────────────────────────────────────────────────────────────
  const footerY = height - 96;
  parts.push(`<rect x="${PAD}" y="${footerY - 44}" width="${inner}" height="2" rx="1" fill="${TOKENS.text.faint}" opacity="0.4"/>`);
  const source = pick(data.source);
  if (source) {
    parts.push(
      `<text x="${PAD}" y="${footerY}" font-family="${FONT_STACK}" font-size="26" font-weight="500" fill="${TOKENS.text.dim}">${esc(source)}</text>`,
    );
  }
  // Perceva wordmark, right-aligned
  parts.push(
    `<text x="${width - PAD}" y="${footerY}" font-family="${FONT_STACK}" font-size="30" font-weight="800" fill="${TOKENS.text.mid}" text-anchor="end" letter-spacing="3">PERCEVA</text>`,
  );

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    defs +
    bg +
    parts.join('') +
    `</svg>`
  );
}
