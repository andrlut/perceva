/* eslint-env node */
/**
 * Branded infographic builder for Learning materials.
 *
 * Renders a portrait 1080×1920 SVG from STRUCTURED data (never free-form
 * layout). Text is real font glyphs (Manrope), icons are real Ionicons glyphs
 * (the same set the app uses), and colors are exact Perceva design tokens — so
 * the output is deterministic, correctly spelled, on-brand, and genuinely
 * VISUAL (icon badges, cards, accent shapes) rather than a wall of text. This
 * is why we render code instead of asking an image model to "draw an
 * infographic" (even the best 2026 image model gets a fully-correct one only
 * ~49% of the time).
 *
 * The caller (generate.mjs) rasterizes the returned SVG to PNG with
 * @resvg/resvg-js (which loads the fonts in tools/content-media/fonts/) and
 * then to webp with ffmpeg.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

// Ionicons name for each dimension (mirror of app/theme/dimensions.ts).
const DIM_ICON = {
  health: 'heart',
  body: 'fitness',
  mind: 'sparkles',
  wealth: 'cash',
  bonds: 'people',
  craft: 'color-palette',
};

const FONT_STACK = "Manrope, 'Segoe UI', system-ui, sans-serif";

// Ionicons glyph map (name -> codepoint). Copied from @expo/vector-icons.
let GLYPHS = {};
try {
  GLYPHS = JSON.parse(readFileSync(join(__dirname, '..', 'ionicons-glyphmap.json'), 'utf8'));
} catch {
  GLYPHS = {};
}

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/** Render an Ionicon glyph centered at (cx, cy). Returns '' if unknown. */
function icon(name, cx, cy, size, color, opacity = 1) {
  const code = GLYPHS[name];
  if (!code) return '';
  const o = opacity === 1 ? '' : ` opacity="${opacity}"`;
  // +0.36em vertical nudge centers the glyph on cy for the Ionicons metrics.
  return `<text x="${cx}" y="${cy + size * 0.36}" font-family="Ionicons" font-size="${size}" fill="${color}" text-anchor="middle"${o}>&#${code};</text>`;
}

/** Greedy word-wrap into at most `maxLines` lines, ellipsizing overflow. */
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
  const usedAll = lines.join(' ').split(/\s+/).filter(Boolean).length === words.length;
  if (!usedAll && lines.length) {
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

function fw(weight) {
  return weight === 'bold' ? 800 : weight === 'semibold' ? 700 : weight === 'medium' ? 500 : 400;
}

function textEl(content, x, y, { size, weight = 'regular', fill, spacing, anchor }) {
  return (
    `<text x="${x}" y="${y}" font-family="${FONT_STACK}" font-size="${size}" font-weight="${fw(weight)}" fill="${fill}"` +
    (spacing ? ` letter-spacing="${spacing}"` : '') +
    (anchor ? ` text-anchor="${anchor}"` : '') +
    `>${esc(content)}</text>`
  );
}

/**
 * @param {object} opts
 * @param {'pt'|'en'} opts.locale
 * @param {string} opts.dimensionId  health|body|mind|wealth|bonds|craft
 * @param {object} opts.data         localized infographic content (see README)
 * @returns {string} SVG document
 */
export function buildInfographicSvg({ locale, dimensionId, data, width = 1080, height = 1920 }) {
  const accent = TOKENS.dimension[dimensionId] ?? TOKENS.dimension.mind;
  const dimIcon = DIM_ICON[dimensionId] ?? 'sparkles';
  const PAD = 80;
  const inner = width - PAD * 2;
  const pick = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v[locale] ?? v.pt ?? v.en : v);

  const out = [];

  // ── defs ──────────────────────────────────────────────────────────────
  out.push(
    `<defs>` +
      `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="${TOKENS.bg.top}"/>` +
      `<stop offset="0.55" stop-color="${TOKENS.bg.base}"/>` +
      `<stop offset="1" stop-color="${TOKENS.bg.deep}"/>` +
      `</linearGradient>` +
      `<radialGradient id="orbA" cx="0.5" cy="0.5" r="0.5">` +
      `<stop offset="0" stop-color="${accent}" stop-opacity="0.22"/>` +
      `<stop offset="1" stop-color="${accent}" stop-opacity="0"/>` +
      `</radialGradient>` +
      `<radialGradient id="orbB" cx="0.5" cy="0.5" r="0.5">` +
      `<stop offset="0" stop-color="${accent}" stop-opacity="0.14"/>` +
      `<stop offset="1" stop-color="${accent}" stop-opacity="0"/>` +
      `</radialGradient>` +
      `</defs>`,
  );

  // ── background: gradient + orbs + watermark icon + accent bar ───────────
  out.push(`<rect width="${width}" height="${height}" fill="url(#bg)"/>`);
  out.push(`<circle cx="${width - 60}" cy="200" r="460" fill="url(#orbA)"/>`);
  out.push(`<circle cx="40" cy="${height - 260}" r="420" fill="url(#orbB)"/>`);
  // giant faint dimension glyph, bottom-right
  out.push(icon(dimIcon, width - 250, height - 250, 620, accent, 0.05));
  out.push(`<rect x="0" y="0" width="${width}" height="10" fill="${accent}"/>`);

  let y = 150;

  // ── header: icon chip + eyebrow ─────────────────────────────────────────
  const eyebrow = pick(data.eyebrow);
  if (eyebrow) {
    const chipR = 40;
    const chipCx = PAD + chipR;
    const chipCy = y;
    out.push(`<circle cx="${chipCx}" cy="${chipCy}" r="${chipR}" fill="${accent}" fill-opacity="0.16"/>`);
    out.push(`<circle cx="${chipCx}" cy="${chipCy}" r="${chipR}" fill="none" stroke="${accent}" stroke-opacity="0.35" stroke-width="2"/>`);
    out.push(icon(dimIcon, chipCx, chipCy, 40, accent));
    out.push(
      textEl(String(eyebrow).toUpperCase(), PAD + chipR * 2 + 24, chipCy + 11, {
        size: 30,
        weight: 'semibold',
        fill: accent,
        spacing: 3,
      }),
    );
    y = chipCy + chipR + 44;
  }

  // ── headline ────────────────────────────────────────────────────────────
  for (const line of wrap(pick(data.headline), maxCharsFor(84, inner, 'bold'), 3)) {
    y += 90;
    out.push(textEl(line, PAD, y, { size: 84, weight: 'bold', fill: TOKENS.text.hi }));
  }

  // ── subhead ─────────────────────────────────────────────────────────────
  const subhead = pick(data.subhead);
  if (subhead) {
    y += 22;
    for (const line of wrap(subhead, maxCharsFor(37, inner), 3)) {
      y += 48;
      out.push(textEl(line, PAD, y, { size: 37, weight: 'regular', fill: TOKENS.text.mid }));
    }
  }

  y += 64;

  // ── the 3 idea cards ────────────────────────────────────────────────────
  const points = (data.points ?? []).slice(0, 3);
  const cardPad = 40;
  const badgeR = 44;
  const railX = PAD + cardPad + badgeR * 2 + 28; // text column starts right of the badge
  const railW = width - PAD - cardPad - (railX - PAD);

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const titleLines = wrap(pick(p.title), maxCharsFor(42, railW, 'bold'), 2);
    const bodyLines = wrap(pick(p.body), maxCharsFor(33, railW), 4);
    const contentH = titleLines.length * 50 + 14 + bodyLines.length * 44;
    const cardH = Math.max(contentH + cardPad * 2, badgeR * 2 + cardPad * 2);
    const cardTop = y;

    // card surface + border + left accent stripe
    out.push(
      `<rect x="${PAD}" y="${cardTop}" width="${inner}" height="${cardH}" rx="30" fill="${TOKENS.bg.top}" fill-opacity="0.55"/>`,
    );
    out.push(
      `<rect x="${PAD}" y="${cardTop}" width="${inner}" height="${cardH}" rx="30" fill="none" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="2"/>`,
    );
    out.push(`<rect x="${PAD}" y="${cardTop + 22}" width="8" height="${cardH - 44}" rx="4" fill="${accent}"/>`);

    // icon badge
    const badgeCx = PAD + cardPad + badgeR;
    const badgeCy = cardTop + cardPad + badgeR;
    out.push(`<circle cx="${badgeCx}" cy="${badgeCy}" r="${badgeR}" fill="${accent}" fill-opacity="0.16"/>`);
    out.push(`<circle cx="${badgeCx}" cy="${badgeCy}" r="${badgeR}" fill="none" stroke="${accent}" stroke-opacity="0.4" stroke-width="2"/>`);
    const pIcon = p.icon && GLYPHS[p.icon] ? p.icon : dimIcon;
    out.push(icon(pIcon, badgeCx, badgeCy, 46, accent));

    // faint step numeral, top-right of the card
    out.push(
      textEl(String(p.n ?? i + 1), PAD + inner - 28, cardTop + 82, {
        size: 92,
        weight: 'bold',
        fill: accent,
        anchor: 'end',
      }).replace('<text ', '<text opacity="0.14" '),
    );

    // title
    let ty = cardTop + cardPad + 42;
    for (let k = 0; k < titleLines.length; k++) {
      if (k > 0) ty += 50;
      out.push(textEl(titleLines[k], railX, ty, { size: 42, weight: 'bold', fill: TOKENS.text.hi }));
    }
    // body
    let by = ty + 14;
    for (const line of bodyLines) {
      by += 44;
      out.push(textEl(line, railX, by, { size: 33, weight: 'regular', fill: TOKENS.text.base }));
    }

    y = cardTop + cardH + 28;
  }

  // ── highlight stat card ─────────────────────────────────────────────────
  if (data.stat && pick(data.stat.value ?? data.stat)) {
    const statValue = pick(data.stat.value ?? data.stat);
    const statCaption = pick(data.stat.caption);
    const statIcon = data.stat.icon && GLYPHS[data.stat.icon] ? data.stat.icon : 'stats-chart';
    const statH = 220;
    const cardTop = y;
    out.push(`<rect x="${PAD}" y="${cardTop}" width="${inner}" height="${statH}" rx="30" fill="${accent}" fill-opacity="0.12"/>`);
    out.push(
      `<rect x="${PAD}" y="${cardTop}" width="${inner}" height="${statH}" rx="30" fill="none" stroke="${accent}" stroke-opacity="0.35" stroke-width="2"/>`,
    );
    // icon chip left
    const chipCx = PAD + 44 + 46;
    const chipCy = cardTop + statH / 2;
    out.push(`<circle cx="${chipCx}" cy="${chipCy}" r="52" fill="${accent}" fill-opacity="0.18"/>`);
    out.push(icon(statIcon, chipCx, chipCy, 52, accent));
    // big number + caption, stacked to the right of the chip
    const tx = chipCx + 52 + 40;
    out.push(textEl(statValue, tx, cardTop + 118, { size: 96, weight: 'bold', fill: accent }));
    if (statCaption) {
      let cy2 = cardTop + 118 + 8;
      for (const line of wrap(statCaption, maxCharsFor(34, width - tx - PAD), 2)) {
        cy2 += 42;
        out.push(textEl(line, tx, cy2, { size: 34, weight: 'medium', fill: TOKENS.text.mid }));
      }
    }
    y = cardTop + statH + 28;
  }

  // ── footer ──────────────────────────────────────────────────────────────
  const footerY = height - 84;
  out.push(`<rect x="${PAD}" y="${footerY - 46}" width="${inner}" height="2" rx="1" fill="${TOKENS.text.faint}" opacity="0.4"/>`);
  const source = pick(data.source);
  if (source) {
    out.push(textEl(source, PAD, footerY, { size: 26, weight: 'medium', fill: TOKENS.text.dim }));
  }
  out.push(
    textEl('PERCEVA', width - PAD, footerY, {
      size: 30,
      weight: 'bold',
      fill: TOKENS.text.mid,
      anchor: 'end',
      spacing: 3,
    }),
  );

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    out.join('') +
    `</svg>`
  );
}
