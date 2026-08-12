/* eslint-env node */
/**
 * Teaser reel-card builder — the "Explorar" feed format.
 *
 * One card per key point of a material: newspaper-style curiosity hook.
 * Anatomy (1080×1920): article cover as background (cover-crop + vertical
 * scrim) → accent bar → big headline (auto-sized, ≤3 lines) → minimal hero
 * metaphor built from shapes + Ionicons (never the answer — that lives in
 * the article) → lede paragraph (scene → tension → promise) → round accent
 * arrow button (visual affordance for the viewer's "Ler completo") → footer.
 *
 * Format approved 2026-08-11 (antifragile prototype). Deliberately image-only
 * and deterministic: same philosophy as infographic.mjs — code renders,
 * models write structured content.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Perceva design tokens (mirror of app/theme/tokens.ts) ────────────────
const TOKENS = {
  bg: { deep: '#0A0E26', base: '#0E1230', top: '#1E2348' },
  text: { hi: '#F2F3FF', base: '#D9DBFA', mid: '#9AA0D4', dim: '#6E74A8', faint: '#4A4F7A' },
  danger: '#FF5C7A',
  dimension: {
    health: '#FF6B7A',
    body: '#FF8A3D',
    mind: '#B07BFF',
    wealth: '#FFC83D',
    bonds: '#4DD0FF',
    craft: '#2EC4B6',
  },
};

const DIM_ICON = {
  health: 'heart',
  body: 'fitness',
  mind: 'sparkles',
  wealth: 'cash',
  bonds: 'people',
  craft: 'color-palette',
};

const FONT_STACK = "Manrope, 'Segoe UI', system-ui, sans-serif";

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

function icon(name, cx, cy, size, color, opacity = 1) {
  const code = GLYPHS[name];
  if (!code) return '';
  const o = opacity === 1 ? '' : ` opacity="${opacity}"`;
  return `<text x="${cx}" y="${cy + size * 0.36}" font-family="Ionicons" font-size="${size}" fill="${color}" text-anchor="middle"${o}>&#${code};</text>`;
}

const fw = (w) => (w === 'bold' ? 800 : w === 'semibold' ? 700 : w === 'medium' ? 500 : 400);

function textEl(content, x, y, { size, weight = 'regular', fill, spacing, anchor, opacity }) {
  return (
    `<text x="${x}" y="${y}" font-family="${FONT_STACK}" font-size="${size}" font-weight="${fw(weight)}" fill="${fill}"` +
    (spacing ? ` letter-spacing="${spacing}"` : '') +
    (anchor ? ` text-anchor="${anchor}"` : '') +
    (opacity != null ? ` opacity="${opacity}"` : '') +
    `>${esc(content)}</text>`
  );
}

function wrap(text, maxChars) {
  const words = String(text ?? '').trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const cand = cur ? `${cur} ${w}` : w;
    if (cand.length <= maxChars || !cur) cur = cand;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Resolve an Ionicons name; unknown names fall back to the dimension icon. */
function safeIcon(name, dimensionId) {
  if (name && GLYPHS[name]) return name;
  return DIM_ICON[dimensionId] ?? 'sparkles';
}

/** Icon-in-ring bubble; `question` renders a "?" instead of an icon. */
function bubble(cx, cy, r, { iconName = null, question = false, color, glow = false }) {
  let s = '';
  if (glow) s += `<circle cx="${cx}" cy="${cy}" r="${r + 34}" fill="${color}" fill-opacity="0.14"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${TOKENS.bg.deep}" fill-opacity="0.55"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-opacity="0.75" stroke-width="3.5"/>`;
  if (iconName) s += icon(iconName, cx, cy, r * 0.92, color);
  if (question)
    s += textEl('?', cx, cy + r * 0.34, { size: r * 1.15, weight: 'bold', fill: color, anchor: 'middle' });
  return s;
}

// ── hero metaphor library ────────────────────────────────────────────────
// All heroes sit in the mid band (~y 900-1250) over the visible part of the
// cover; the answer slot is always a "?".
const W = 1080;
const H = 1920;
const PAD = 80;

function heroTrio(accent, dimensionId, icons) {
  const cy = 1050;
  const r = 92;
  let h = '';
  h += bubble(W * 0.22, cy, r, { iconName: safeIcon(icons?.a, dimensionId), color: TOKENS.danger });
  h += bubble(W * 0.5, cy, r, { iconName: safeIcon(icons?.b, dimensionId), color: TOKENS.text.mid });
  h += bubble(W * 0.78, cy, r + 10, { question: true, color: accent, glow: true });
  h += `<line x1="${W * 0.22 + r}" y1="${cy}" x2="${W * 0.5 - r}" y2="${cy}" stroke="${TOKENS.text.faint}" stroke-width="3" stroke-dasharray="2 14" opacity="0.8"/>`;
  h += `<line x1="${W * 0.5 + r}" y1="${cy}" x2="${W * 0.78 - r - 10}" y2="${cy}" stroke="${TOKENS.text.faint}" stroke-width="3" stroke-dasharray="2 14" opacity="0.8"/>`;
  return h;
}

function heroRing(accent, dimensionId, icons) {
  const cx = W / 2;
  const cy = 1030;
  const R = 150;
  let h = '';
  h += `<circle cx="${cx}" cy="${cy}" r="${R + 44}" fill="${accent}" fill-opacity="0.10"/>`;
  h += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${TOKENS.bg.deep}" fill-opacity="0.5"/>`;
  h += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${accent}" stroke-opacity="0.75" stroke-width="4"/>`;
  h += `<circle cx="${cx}" cy="${cy}" r="${R - 26}" fill="none" stroke="${accent}" stroke-opacity="0.2" stroke-width="2" stroke-dasharray="4 14"/>`;
  if (icons?.symbol === 'minus') {
    h += `<rect x="${cx - 92}" y="${cy - 19}" width="184" height="38" rx="19" fill="${accent}"/>`;
  } else {
    h += icon(safeIcon(icons?.symbol, dimensionId), cx, cy, 120, accent);
  }
  return h;
}

function heroAsymmetry(accent, _dimensionId, _icons) {
  const barY = 1030;
  const bigCx = W * 0.32;
  const bigR = 130;
  const smallCx = W * 0.76;
  const smallR = 66;
  let h = '';
  h += `<rect x="${bigCx}" y="${barY - 12}" width="${smallCx - bigCx}" height="24" rx="12" fill="${TOKENS.text.faint}" opacity="0.7"/>`;
  h += `<circle cx="${bigCx}" cy="${barY}" r="${bigR}" fill="${TOKENS.bg.deep}" fill-opacity="0.55"/>`;
  h += `<circle cx="${bigCx}" cy="${barY}" r="${bigR}" fill="none" stroke="${TOKENS.text.mid}" stroke-width="4"/>`;
  h += `<circle cx="${smallCx}" cy="${barY}" r="${smallR + 24}" fill="${accent}" fill-opacity="0.14"/>`;
  h += `<circle cx="${smallCx}" cy="${barY}" r="${smallR}" fill="${TOKENS.bg.deep}" fill-opacity="0.55"/>`;
  h += `<circle cx="${smallCx}" cy="${barY}" r="${smallR}" fill="none" stroke="${accent}" stroke-width="4"/>`;
  h += textEl('?', smallCx, barY + 24, { size: 76, weight: 'bold', fill: accent, anchor: 'middle' });
  return h;
}

function heroSolo(accent, dimensionId, icons) {
  const cy = 1040;
  let h = '';
  h += bubble(W * 0.38, cy, 110, { iconName: safeIcon(icons?.symbol ?? icons?.a, dimensionId), color: TOKENS.text.mid });
  h += `<line x1="${W * 0.38 + 110}" y1="${cy}" x2="${W * 0.66 - 86}" y2="${cy}" stroke="${TOKENS.text.faint}" stroke-width="3" stroke-dasharray="2 14" opacity="0.8"/>`;
  h += bubble(W * 0.66, cy, 86, { question: true, color: accent, glow: true });
  return h;
}

const HEROES = { trio: heroTrio, ring: heroRing, asymmetry: heroAsymmetry, solo: heroSolo };

/**
 * @param {object} opts
 * @param {'pt'|'en'} opts.locale
 * @param {string} opts.dimensionId
 * @param {object} opts.card       one entry of spec.reels: {metaphor, icons, headline{pt,en}, lede{pt,en}}
 * @param {string|null} opts.coverDataUri  data:image/jpeg;base64,... (resvg can't read webp — transcode first)
 * @param {string} opts.footerLabel        e.g. "Resumo · Antifrágil — Nassim Taleb"
 * @returns {string} SVG document (1080×1920)
 */
export function buildTeaserCardSvg({ locale, dimensionId, card, coverDataUri, footerLabel }) {
  const accent = TOKENS.dimension[dimensionId] ?? TOKENS.dimension.mind;
  const pick = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v[locale] ?? v.pt ?? v.en : v);

  const out = [];
  out.push(
    `<defs><linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="${TOKENS.bg.deep}" stop-opacity="0.78"/>` +
      `<stop offset="0.30" stop-color="${TOKENS.bg.deep}" stop-opacity="0.34"/>` +
      `<stop offset="0.52" stop-color="${TOKENS.bg.deep}" stop-opacity="0.22"/>` +
      `<stop offset="0.74" stop-color="${TOKENS.bg.deep}" stop-opacity="0.82"/>` +
      `<stop offset="1" stop-color="${TOKENS.bg.deep}" stop-opacity="0.95"/>` +
      `</linearGradient>` +
      `<linearGradient id="bgfall" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="${TOKENS.bg.top}"/><stop offset="0.55" stop-color="${TOKENS.bg.base}"/><stop offset="1" stop-color="${TOKENS.bg.deep}"/>` +
      `</linearGradient></defs>`,
  );
  out.push(`<rect width="${W}" height="${H}" fill="${coverDataUri ? TOKENS.bg.deep : 'url(#bgfall)'}"/>`);
  if (coverDataUri) {
    out.push(
      `<image href="${coverDataUri}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMin slice"/>`,
    );
    out.push(`<rect width="${W}" height="${H}" fill="url(#scrim)"/>`);
  }
  out.push(`<rect x="0" y="0" width="${W}" height="10" fill="${accent}"/>`);

  // headline — auto-size down until it fits 3 lines
  const headline = pick(card.headline);
  let hlSize = 104;
  let hlLines = wrap(headline, Math.floor((W - PAD * 2) / (hlSize * 0.58)));
  while (hlLines.length > 3 && hlSize > 80) {
    hlSize -= 8;
    hlLines = wrap(headline, Math.floor((W - PAD * 2) / (hlSize * 0.58)));
  }
  let y = 248;
  for (const line of hlLines) {
    out.push(textEl(line, PAD, y, { size: hlSize, weight: 'bold', fill: TOKENS.text.hi }));
    y += hlSize * 1.1;
  }

  // hero metaphor
  const hero = HEROES[card.metaphor] ?? heroSolo;
  out.push(hero(accent, dimensionId, card.icons ?? {}));

  // lede + round arrow button
  const btnR = 54;
  const btnCx = W - PAD - btnR;
  const ledeW = btnCx - btnR - 44 - PAD;
  let ledeSize = 36;
  let ledeLines = wrap(pick(card.lede), Math.floor(ledeW / (ledeSize * 0.54)));
  if (ledeLines.length > 6) {
    ledeSize = 34;
    ledeLines = wrap(pick(card.lede), Math.floor(ledeW / (ledeSize * 0.54)));
  }
  const ledeLineH = ledeSize + 16;
  const ledeBottom = 1660;
  let ky = ledeBottom - (ledeLines.length - 1) * ledeLineH;
  const ledeCenterY = ledeBottom - ((ledeLines.length - 1) * ledeLineH) / 2;
  for (const line of ledeLines) {
    out.push(textEl(line, PAD, ky, { size: ledeSize, weight: 'medium', fill: TOKENS.text.base }));
    ky += ledeLineH;
  }
  out.push(`<circle cx="${btnCx}" cy="${ledeCenterY - 12}" r="${btnR}" fill="${accent}"/>`);
  out.push(icon('arrow-forward', btnCx, ledeCenterY - 12, 46, TOKENS.bg.deep));

  // footer
  const fy = H - 84;
  out.push(`<rect x="${PAD}" y="${fy - 46}" width="${W - PAD * 2}" height="2" rx="1" fill="${TOKENS.text.faint}" opacity="0.4"/>`);
  out.push(textEl(footerLabel, PAD, fy, { size: 26, weight: 'medium', fill: TOKENS.text.dim }));
  out.push(textEl('PERCEVA', W - PAD, fy, { size: 30, weight: 'bold', fill: TOKENS.text.mid, anchor: 'end', spacing: 3 }));

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    out.join('') +
    `</svg>`
  );
}
