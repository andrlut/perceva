// Perceva — gerador de carrossel PROMOCIONAL (parcerias, campanhas).
// Mesmo cânone visual do carousel.js (fundo ambiente, Fraunces nos títulos,
// Manrope no corpo, glifo no rodapé), mas com estrutura livre: capa com
// logos, N slides de texto numerados e um slide final de chamada. Qualquer
// slide pode carregar uma IMAGEM (ilustração da ideia, quadro de um vídeo do
// molde Remotion, capa do material) — é o que dá apelo visual ao post.
//
// Uso:
//   node promo.js <spec.json> [outDir]
//
// spec.json: array de posts —
//   {
//     "slug": "black-november-programa",
//     "accent": "#FFE08A",                  // cor de destaque (dourado = parceria)
//     "eyebrow": "Black November",           // capa, acima do título
//     "titulo": "...",                       // capa (Fraunces)
//     "subtitulo": "...",                    // capa, abaixo do título (opcional)
//     "image": "frames/cover.png",           // capa: fundo em imagem (opcional)
//     "logos": ["../../social/brand/x.png"], // capa, lado a lado (PNG/WebP), opcional
//     "selo": "Patrocinado · Paker Health",  // pill no canto superior direito (opcional)
//     "slides": [                            // slides do meio
//       { "numero": "1", "titulo": "...", "texto": "...",
//         "image": "frames/x.png",           // opcional: faixa de imagem no alto
//         "crop": { "y": 240, "h": 627 },    // opcional: recorte vertical da imagem (px da origem)
//         "fonte": "Autor, ano · Periódico"  // opcional: pill dourada sobre a imagem
//       }
//     ],
//     "cta": { "titulo": "...", "texto": "...", "botao": "perceva.app/download",
//              "rodape": "...", "thumbs": ["frames/a.png", "..."] }  // thumbs 4:5 (opcional)
//   }
//
// Caminhos de imagem são relativos ao spec.json.
// Saída: <outDir>/<slug>/slide-{1..N}.png (1080×1350, RGB sem alpha).

const path = require('path');
const fs = require('fs');
const os = require('os');

const FONT_DIR = path.join(__dirname, 'fonts').replace(/\\/g, '/');
const CACHE_DIR = path.join(os.tmpdir(), 'perceva-social-fontcache').replace(/\\/g, '/');
const FONTS_CONF = path.join(os.tmpdir(), 'perceva-social-fonts.conf');
fs.mkdirSync(CACHE_DIR, { recursive: true });
fs.writeFileSync(FONTS_CONF, `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig><dir>${FONT_DIR}</dir><cachedir>${CACHE_DIR}</cachedir></fontconfig>
`);
if (process.env.FONTCONFIG_FILE !== FONTS_CONF) {
  const { spawnSync } = require('child_process');
  const r = spawnSync(process.execPath, process.argv.slice(1), {
    env: { ...process.env, FONTCONFIG_FILE: FONTS_CONF },
    stdio: 'inherit',
  });
  process.exit(r.status ?? 1);
}

const sharp = require('sharp');

const W = 1080, H = 1350;
/** Altura da faixa de imagem nos slides do meio. */
const IMG_H = 940;
const C = {
  noite: '#0A0E26', violeta: '#7B5CFF', dourado: '#FFE08A', areia: '#ECEAF6', nevoa: '#9A98B4',
};

let specDir = __dirname;
const resolveImg = (p) => path.resolve(specDir, p);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function wrap(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}
const tspans = (lines, x, y0, lh, anchor = 'start') =>
  lines.map((l, i) => `<tspan x="${x}" y="${y0 + i * lh}"${anchor !== 'start' ? ` text-anchor="${anchor}"` : ''}>${esc(l)}</tspan>`).join('');
const roundedMask = (w, h, rx) => Buffer.from(
  `<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${rx}" fill="#fff"/></svg>`);
const svgLayer = (inner) => Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`);

const GLYPH_PATH = 'M 180 720 Q 380 600 512 512 Q 644 424 844 304';
function iris(id, x, y, size, opacity = 1) {
  const s = size / 1024;
  return `
  <defs>
    <radialGradient id="pupil-${id}" cx="0.4" cy="0.4" r="0.7">
      <stop offset="0" stop-color="#FFDC8F"/><stop offset="1" stop-color="#8A5C0F"/>
    </radialGradient>
    <mask id="rings-${id}">
      <rect x="0" y="0" width="1024" height="1024" fill="white"/>
      <path d="${GLYPH_PATH}" fill="none" stroke="black" stroke-width="60" stroke-linecap="round"/>
    </mask>
  </defs>
  <g transform="translate(${x},${y}) scale(${s})" opacity="${opacity}">
    <g mask="url(#rings-${id})" stroke="#FFE3A6" fill="none" stroke-width="14">
      <circle cx="512" cy="512" r="320" opacity="0.45"/>
      <circle cx="512" cy="512" r="260" opacity="0.55"/>
      <circle cx="512" cy="512" r="200" opacity="0.7"/>
      <circle cx="512" cy="512" r="140" opacity="0.85"/>
      <circle cx="512" cy="512" r="80" opacity="1"/>
    </g>
    <path d="${GLYPH_PATH}" fill="none" stroke="#FFDC8F" stroke-width="22" stroke-linecap="round"/>
    <circle cx="180" cy="720" r="18" fill="#FFDC8F"/>
    <circle cx="844" cy="304" r="22" fill="#FFDC8F"/>
    <circle cx="512" cy="512" r="38" fill="url(#pupil-${id})"/>
  </g>`;
}

const baseSvg = (inner, accent = C.violeta) => {
  const rings = [210, 330, 450, 570, 690].map((r) =>
    `<circle cx="${W + 40}" cy="430" r="${r}" fill="none" stroke="#BDB3E6" stroke-opacity="0.055" stroke-width="2.5"/>`).join('');
  return Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="amb" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#171B3E"/>
      <stop offset="0.5" stop-color="#0E1230"/>
      <stop offset="1" stop-color="#0A0E26"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.22" cy="0.3" r="0.75">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.12"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#amb)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  ${rings}
  ${inner}</svg>`);
};

function footer(pageLabel, accent) {
  return `${iris('foot', 46, H - 122, 76, 0.95)}
  <text x="140" y="${H - 76}" font-family="Manrope" font-weight="700" font-size="28" fill="${C.areia}">Perceva</text>
  <text x="${W - 64}" y="${H - 76}" text-anchor="end" font-family="Manrope" font-weight="700" font-size="26" fill="${C.nevoa}">${esc(pageLabel)}</text>
  <rect x="0" y="0" width="12" height="${H}" fill="${accent}"/>`;
}
const eyebrow = (text, y, color = C.dourado, x = 88, anchor = 'start') =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Manrope" font-weight="800" font-size="30" letter-spacing="5" fill="${color}">${esc(text.toUpperCase())}</text>`;
const pill = (text, xRight, y, color = C.dourado, size = 25) => {
  const w = Math.round(text.length * (size * 0.54)) + 56;
  return `<rect x="${xRight - w}" y="${y}" width="${w}" height="56" rx="28" fill="rgba(10,14,38,0.62)" stroke="rgba(255,220,143,0.35)" stroke-width="1.5"/>
  <text x="${xRight - w / 2}" y="${y + 37}" text-anchor="middle" font-family="Manrope" font-weight="700" font-size="${size}" letter-spacing="1" fill="${color}">${esc(text)}</text>`;
};

async function logoRow(paths, maxH, gap) {
  const bufs = [];
  for (const p of paths) {
    const b = await sharp(fs.readFileSync(resolveImg(p))).resize({ height: maxH, fit: 'inside' }).png().toBuffer();
    const m = await sharp(b).metadata();
    bufs.push({ b, w: m.width, h: m.height });
  }
  const total = bufs.reduce((s, x) => s + x.w, 0) + gap * (bufs.length - 1);
  return { bufs, total };
}

/** Imagem cobrindo w×h (cover), com recorte vertical opcional na origem. */
async function coverImage(p, w, h, crop) {
  let img = sharp(fs.readFileSync(resolveImg(p)));
  if (crop) {
    const m = await img.metadata();
    const y = Math.max(0, Math.min(crop.y ?? 0, m.height - 1));
    const hh = Math.min(crop.h ?? m.height - y, m.height - y);
    img = img.extract({ left: 0, top: y, width: m.width, height: hh });
  }
  return img.resize({ width: w, height: h, fit: 'cover', kernel: 'lanczos3' }).png().toBuffer();
}

async function slideCapa(post, outDir, total) {
  const accent = post.accent || C.dourado;
  const composites = [];
  let logosSvg = '';
  // Logos: com imagem de fundo, ficam na faixa de cima (sobre o scrim do topo);
  // sem imagem, no meio, acima do título.
  const logoY = post.image ? 180 : 236;
  if (post.logos && post.logos.length) {
    const { bufs, total: tw } = await logoRow(post.logos, 100, 56);
    let x = Math.round((W - tw) / 2);
    for (let i = 0; i < bufs.length; i++) {
      composites.push({ input: bufs[i].b, left: x, top: logoY + Math.round((100 - bufs[i].h) / 2) });
      if (i < bufs.length - 1) {
        const cx = x + bufs[i].w + 28;
        logosSvg += `<text x="${cx}" y="${logoY + 68}" text-anchor="middle" font-family="Manrope" font-weight="500" font-size="44" fill="${C.nevoa}">×</text>`;
      }
      x += bufs[i].w + 56;
    }
  }
  const long = post.titulo.length > 40;
  const titleSize = long ? 64 : 76;
  const titleLines = wrap(post.titulo, long ? 24 : 20);
  const lh = Math.round(titleSize * 1.15);
  const subLines = post.subtitulo ? wrap(post.subtitulo, 40) : [];

  if (post.image) {
    // Capa com imagem: a arte ocupa tudo dentro de uma moldura noite de 24px;
    // scrim em cima (eyebrow, selo, logos) e embaixo (título, subtítulo).
    const inner = 24;
    const img = await sharp(await coverImage(post.image, W - inner * 2, H - inner * 2, post.crop)).modulate({ brightness: post.imageBoost ?? 1.18 }).png().toBuffer();
    const titleBottom = H - 96 - 60 - subLines.length * 50;
    const titleY0 = titleBottom - (titleLines.length - 1) * lh;
    const subY0 = titleBottom + 64;
    const scrimH = Math.max(560, H - titleY0 + 150);
    const overlay = svgLayer(`
  <defs>
    <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.noite}" stop-opacity="0"/>
      <stop offset="0.4" stop-color="${C.noite}" stop-opacity="0.80"/>
      <stop offset="1" stop-color="${C.noite}" stop-opacity="0.97"/>
    </linearGradient>
    <linearGradient id="t" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.noite}" stop-opacity="0.82"/>
      <stop offset="1" stop-color="${C.noite}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="${inner}" y="${inner}" width="${W - inner * 2}" height="320" fill="url(#t)"/>
  <rect x="${inner}" y="${H - scrimH}" width="${W - inner * 2}" height="${scrimH - inner}" fill="url(#s)"/>
  ${eyebrow(post.eyebrow || '', 110, accent, 88, 'start')}
  ${post.selo ? pill(post.selo, W - 52, 64) : ''}
  ${logosSvg}
  <rect x="88" y="${titleY0 - lh + 8}" width="72" height="8" rx="4" fill="${accent}"/>
  <text font-family="Fraunces" font-weight="600" font-size="${titleSize}" fill="${C.areia}">${tspans(titleLines, 88, titleY0, lh)}</text>
  <text font-family="Manrope" font-weight="500" font-size="36" fill="${C.nevoa}">${tspans(subLines, 88, subY0, 50)}</text>
  <text x="${W - 88}" y="${H - 96}" text-anchor="end" font-family="Manrope" font-weight="700" font-size="28" fill="${C.nevoa}">Perceva</text>
  <text x="88" y="${H - 96}" font-family="Manrope" font-weight="700" font-size="26" fill="${C.nevoa}">1 · ${total}</text>`);
    await sharp(baseSvg('', accent))
      .composite([{ input: img, left: inner, top: inner }, ...composites, { input: overlay, left: 0, top: 0 }])
      .removeAlpha().png().toFile(path.join(outDir, 'slide-1-capa.png'));
    return;
  }

  const titleY0 = 470;
  const subY0 = titleY0 + titleLines.length * lh + 28;
  const inner = `
  ${eyebrow(post.eyebrow || '', 150, accent, W / 2, 'middle')}
  ${post.selo ? pill(post.selo, W - 52, 60) : ''}
  ${logosSvg}
  <rect x="${W / 2 - 36}" y="${titleY0 - 92}" width="72" height="8" rx="4" fill="${accent}"/>
  <text font-family="Fraunces" font-weight="600" font-size="${titleSize}" fill="${C.areia}">${tspans(titleLines, W / 2, titleY0, lh, 'middle')}</text>
  <text font-family="Manrope" font-weight="500" font-size="40" fill="${C.nevoa}">${tspans(subLines, W / 2, subY0 + 40, 54, 'middle')}</text>
  ${footer(`1 · ${total}`, accent)}`;
  await sharp(baseSvg('', accent)).composite([...composites, { input: svgLayer(inner), left: 0, top: 0 }])
    .removeAlpha().png().toFile(path.join(outDir, 'slide-1-capa.png'));
}

async function slideTexto(outFile, accent, s, page) {
  if (s.image) return slideImagem(outFile, accent, s, page);
  const titleLines = wrap(s.titulo, 24);
  const tLh = 66;
  const bodyLines = wrap(s.texto, 36);
  const bLh = 64;
  const numero = s.numero
    ? `<circle cx="124" cy="258" r="40" fill="${accent}"/><text x="124" y="274" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="40" fill="${C.noite}">${esc(String(s.numero))}</text>`
    : `<rect x="88" y="238" width="72" height="8" rx="4" fill="${accent}"/>`;
  const titleY0 = 400;
  const bodyY0 = titleY0 + titleLines.length * tLh + 40;
  const inner = `
  ${numero}
  <text font-family="Fraunces" font-weight="600" font-size="56" fill="${C.areia}">${tspans(titleLines, 88, titleY0, tLh)}</text>
  <text font-family="Manrope" font-weight="500" font-size="44" fill="${C.areia}" fill-opacity="0.92">${tspans(bodyLines, 88, bodyY0 + 44, bLh)}</text>
  ${footer(page, accent)}`;
  await sharp(baseSvg(inner, accent)).removeAlpha().png().toFile(outFile);
}

/**
 * Slide com imagem: a arte ocupa a faixa de cima (IMG_H), com um degradê pra
 * noite na base onde entram o número e o título; o corpo fica no painel
 * embaixo. A fonte (quando há) vira a pill dourada no canto da imagem.
 */
async function slideImagem(outFile, accent, s, page) {
  const img = await coverImage(s.image, W, IMG_H, s.crop);
  const titleLines = wrap(s.titulo, 26);
  const tLh = 62;
  const titleBottom = IMG_H - 36;
  const titleY0 = titleBottom - (titleLines.length - 1) * tLh;
  const numero = s.numero
    ? `<circle cx="124" cy="${titleY0 - 96}" r="34" fill="${accent}"/><text x="124" y="${titleY0 - 83}" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="34" fill="${C.noite}">${esc(String(s.numero))}</text>`
    : `<rect x="88" y="${titleY0 - 110}" width="72" height="8" rx="4" fill="${accent}"/>`;
  const bodyLines = wrap(s.texto, 46);
  const bLh = 50;
  const bodyY0 = IMG_H + 44;
  const overlay = svgLayer(`
  <defs>
    <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.noite}" stop-opacity="0"/>
      <stop offset="0.55" stop-color="${C.noite}" stop-opacity="0.78"/>
      <stop offset="1" stop-color="${C.noite}" stop-opacity="1"/>
    </linearGradient>
  </defs>
  <rect x="0" y="${IMG_H - 520}" width="${W}" height="521" fill="url(#s)"/>
  ${s.fonte ? (s.fontePos === 'left' ? pill(s.fonte, 52 + Math.round(s.fonte.length * 13.5) + 56, 60) : pill(s.fonte, W - 52, 60)) : ''}
  ${numero}
  <text font-family="Fraunces" font-weight="600" font-size="52" fill="${C.areia}">${tspans(titleLines, 88, titleY0, tLh)}</text>
  <text font-family="Manrope" font-weight="500" font-size="36" fill="${C.areia}" fill-opacity="0.92">${tspans(bodyLines, 88, bodyY0 + 36, bLh)}</text>
  ${footer(page, accent)}`);
  await sharp(baseSvg('', accent))
    .composite([{ input: img, left: 0, top: 0 }, { input: overlay, left: 0, top: 0 }])
    .removeAlpha().png().toFile(outFile);
}

async function slideCTA(post, outDir, total) {
  const accent = post.accent || C.dourado;
  const c = post.cta;
  const composites = [];
  let top = 0;
  if (c.thumbs && c.thumbs.length) {
    // Fileira de thumbs 4:5 com cantos arredondados, no alto.
    const n = c.thumbs.length;
    const tw = n >= 3 ? 272 : 320, th = Math.round(tw * 1.25), gap = 24;
    let x = Math.round((W - (n * tw + (n - 1) * gap)) / 2);
    const y = 150;
    for (const p of c.thumbs) {
      const b = await sharp(fs.readFileSync(resolveImg(p))).resize({ width: tw, height: th, fit: 'cover' })
        .composite([{ input: roundedMask(tw, th, 24), blend: 'dest-in' }]).png().toBuffer();
      composites.push({ input: b, left: x, top: y });
      x += tw + gap;
    }
    top = y + th;
  }
  const titleLines = wrap(c.titulo, 22);
  const textLines = wrap(c.texto || '', 40);
  const titleY0 = top ? top + 130 : 430;
  const textY0 = titleY0 + titleLines.length * 72 + 30;
  const btnY = textY0 + textLines.length * 54 + 70;
  const btnW = Math.max(340, Math.round(c.botao.length * 19) + 80);
  const inner = `
  <rect x="${W / 2 - 36}" y="${titleY0 - 100}" width="72" height="8" rx="4" fill="${accent}"/>
  <text font-family="Fraunces" font-weight="600" font-size="60" fill="${C.areia}">${tspans(titleLines, W / 2, titleY0, 72, 'middle')}</text>
  <text font-family="Manrope" font-weight="500" font-size="40" fill="${C.areia}" fill-opacity="0.9">${tspans(textLines, W / 2, textY0 + 40, 54, 'middle')}</text>
  <rect x="${W / 2 - btnW / 2}" y="${btnY}" width="${btnW}" height="78" rx="39" fill="${C.violeta}"/>
  <text x="${W / 2}" y="${btnY + 50}" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="32" fill="#FFFFFF">${esc(c.botao)}</text>
  ${c.rodape ? `<text x="${W / 2}" y="${btnY + 150}" text-anchor="middle" font-family="Manrope" font-weight="600" font-size="26" fill="${C.nevoa}">${esc(c.rodape)}</text>` : ''}
  ${footer(`${total} · ${total}`, accent)}`;
  await sharp(baseSvg('', accent)).composite([...composites, { input: svgLayer(inner), left: 0, top: 0 }])
    .removeAlpha().png().toFile(path.join(outDir, `slide-${total}-cta.png`));
}

(async () => {
  const specPath = process.argv[2];
  if (!specPath) { console.error('uso: node promo.js <spec.json> [outDir]'); process.exit(1); }
  specDir = path.dirname(path.resolve(specPath));
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8').replace(/^﻿/, ''));
  const outRoot = process.argv[3] ||
    path.join(__dirname, '..', '..', 'social', 'promo-' + new Date().toISOString().slice(0, 10));
  for (const post of spec) {
    const all = [post.titulo, post.subtitulo || '', ...post.slides.flatMap((s) => [s.titulo, s.texto]), post.cta.titulo, post.cta.texto || ''].join(' ');
    if (/\p{Extended_Pictographic}/u.test(all)) { console.error(`REPROVADO ${post.slug}: emoji`); process.exit(1); }
    if (/!!|!\s*!/.test(all)) { console.error(`REPROVADO ${post.slug}: exclamação em série`); process.exit(1); }
    const total = post.slides.length + 2;
    const outDir = path.join(outRoot, post.slug);
    fs.mkdirSync(outDir, { recursive: true });
    await slideCapa(post, outDir, total);
    for (let i = 0; i < post.slides.length; i++) {
      await slideTexto(path.join(outDir, `slide-${i + 2}.png`), post.accent || C.dourado, post.slides[i], `${i + 2} · ${total}`);
    }
    await slideCTA(post, outDir, total);
    console.log('ok', post.slug);
  }
  console.log(`done → ${outRoot}`);
})().catch((e) => { console.error(e); process.exit(1); });
