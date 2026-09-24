// Perceva — gerador de carrossel "Uma ideia com fonte"
// Playbook §9 + cânone visual (IV). Regras editoriais: EDITORIAL.md (mesma pasta).
//
// Uso:
//   node carousel.js <batch.json> [outDir]
//
// batch.json: array de posts —
//   {
//     "slug": "mente-foco-23-minutos",       // nome da pasta do post
//     "dim": "mind",                          // health|body|mind|wealth|bonds|craft
//     "image_path": "attention-residue/idea.3.76640ea0.webp", // caminho no bucket learning-media
//     "titulo": "...",                        // capa; autossuficiente, sem jargão
//     "claim": "...",                         // slide 2
//     "mecanismo": "...",                     // slide 3
//     "fazer": "...",                         // slide 4
//     "fonte": "Autor, ano · Periódico",      // slide 5
//     "eyebrow2": "O que dizem por aí",       // opcional — post de mito
//     "eyebrow3": "O que a trilha mostra"     // opcional — post de mito
//   }
//
// Saída: <outDir>/<slug>/slide-{1..5}-*.png (1080×1350, RGB sem alpha).
// O registro de ideias usadas (used-ideas.json) é atualizado ao final.

const path = require('path');
const fs = require('fs');
const os = require('os');

// Fontes da marca via fontconfig — precisa existir ANTES do primeiro render de texto.
const FONT_DIR = path.join(__dirname, 'fonts').replace(/\\/g, '/');
const CACHE_DIR = path.join(os.tmpdir(), 'perceva-social-fontcache').replace(/\\/g, '/');
const FONTS_CONF = path.join(os.tmpdir(), 'perceva-social-fonts.conf');
fs.mkdirSync(CACHE_DIR, { recursive: true });
fs.writeFileSync(FONTS_CONF, `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig><dir>${FONT_DIR}</dir><cachedir>${CACHE_DIR}</cachedir></fontconfig>
`);
// Setar process.env aqui NÃO chega ao fontconfig nativo (ele lê a env real
// na carga da DLL) — os textos caem em fonte de fallback silenciosamente.
// Solução: se o processo não nasceu com a env certa, re-executa a si mesmo.
if (process.env.FONTCONFIG_FILE !== FONTS_CONF) {
  const { spawnSync } = require('child_process');
  const r = spawnSync(process.execPath, process.argv.slice(1), {
    env: { ...process.env, FONTCONFIG_FILE: FONTS_CONF },
    stdio: 'inherit',
  });
  process.exit(r.status ?? 1);
}

const sharp = require('sharp');

const BUCKET = 'https://uneqnpyzevosznwkmvvo.supabase.co/storage/v1/object/public/learning-media/';
const W = 1080, H = 1350;
const C = {
  noite: '#0A0E26', superficie: '#141A3C', violeta: '#7B5CFF', violetaTexto: '#AFA0FF',
  dourado: '#FFE08A', douradoEscuro: '#C8881C', areia: '#ECEAF6', nevoa: '#9A98B4',
  dim: { health: '#F06565', body: '#F0973E', mind: '#B57BF0', wealth: '#E8B04B', bonds: '#4BB4E8', craft: '#3FB88C' },
};
const DIM_PT = { health: 'Saúde', body: 'Corpo', mind: 'Mente', wealth: 'Prosperidade', bonds: 'Vínculos', craft: 'Ofício' };
const DIM_EN = { health: 'Health', body: 'Body', mind: 'Mind', wealth: 'Wealth', bonds: 'Bonds', craft: 'Craft' };

// Strings fixas por idioma. EN nativo (Playbook: nunca traduzido); o lugar
// "Recanto" não tem nome EN canônico — o CTA contorna com "Perceva's library".
const STR = {
  pt: {
    serie: 'Uma ideia com fonte', claimEyebrow: 'A afirmação', mechEyebrow: 'O mecanismo',
    doEyebrow: 'O que fazer', srcEyebrow: 'A fonte',
    cta: 'Essa ideia vive no Recanto — a biblioteca do Perceva, onde toda ideia tem fonte.',
    tagline: 'Perceba quem você está se tornando.', dims: DIM_PT,
  },
  en: {
    serie: 'One idea, with a source', claimEyebrow: 'The claim', mechEyebrow: 'The mechanism',
    doEyebrow: 'What to do', srcEyebrow: 'The source',
    cta: "This idea lives in Perceva's library — where every idea comes with a source.",
    tagline: "See who you're becoming.", dims: DIM_EN,
  },
};
const langOf = (post) => (post.lang === 'en' ? 'en' : 'pt');

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

const tspans = (lines, x, y0, lh) =>
  lines.map((l, i) => `<tspan x="${x}" y="${y0 + i * lh}">${esc(l)}</tspan>`).join('');

function iris(cx, cy, r, ringColor, ringOp) {
  const rings = [0.28, 0.52, 0.76, 1].map((f) =>
    `<circle cx="${cx}" cy="${cy}" r="${r * f}" fill="none" stroke="${ringColor}" stroke-opacity="${ringOp}" stroke-width="${r * 0.045}"/>`).join('');
  const dx = r * 0.72, dy = r * 0.48;
  return `${rings}
  <line x1="${cx - dx}" y1="${cy + dy}" x2="${cx + dx}" y2="${cy - dy}" stroke="${C.douradoEscuro}" stroke-width="${r * 0.1}" stroke-linecap="round"/>
  <circle cx="${cx}" cy="${cy}" r="${r * 0.13}" fill="${C.dourado}"/>`;
}

const baseSvg = (inner) => Buffer.from(
  `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${H}" fill="${C.noite}"/>${inner}</svg>`);

function footer(pageLabel, dimColor) {
  return `${iris(84, H - 84, 34, '#BDB3E6', 0.45)}
  <text x="140" y="${H - 76}" font-family="Manrope" font-weight="700" font-size="28" fill="${C.areia}">Perceva</text>
  <text x="${W - 64}" y="${H - 76}" text-anchor="end" font-family="Manrope" font-weight="700" font-size="26" fill="${C.nevoa}">${esc(pageLabel)}</text>
  <rect x="0" y="0" width="12" height="${H}" fill="${dimColor}"/>`;
}

const eyebrow = (text, y, color = C.dourado) =>
  `<text x="88" y="${y}" font-family="Manrope" font-weight="800" font-size="30" letter-spacing="5" fill="${color}">${esc(text.toUpperCase())}</text>`;

async function fetchImage(imagePath) {
  const res = await fetch(BUCKET + imagePath);
  if (!res.ok) throw new Error(`imagem ${imagePath}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function slideCapa(post, imgBuf, outDir) {
  const S = STR[langOf(post)];
  const inner = 24; // moldura noite (cânone)
  const img = await sharp(imgBuf)
    .resize({ width: W - inner * 2, height: H - inner * 2, fit: 'cover' })
    .toBuffer();
  // Fraunces 72px cabe ~21 chars nos 904px úteis; título longo desce pra 60px.
  let titleSize = 72, titleWrap = 21;
  if (post.titulo.length > 42) { titleSize = 60; titleWrap = 26; }
  const titleLines = wrap(post.titulo, titleWrap);
  const titleLh = Math.round(titleSize * 1.17);
  const titleBottom = H - 96 - 44;
  const titleY0 = titleBottom - (titleLines.length - 1) * titleLh - 40;
  const scrimH = Math.max(560, H - titleY0 + 260);
  const overlay = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.noite}" stop-opacity="0"/>
    <stop offset="0.45" stop-color="${C.noite}" stop-opacity="0.82"/>
    <stop offset="1" stop-color="${C.noite}" stop-opacity="0.97"/>
  </linearGradient></defs>
  <rect x="${inner}" y="${H - scrimH}" width="${W - inner * 2}" height="${scrimH - inner}" fill="url(#s)"/>
  ${eyebrow(S.serie, titleY0 - 78)}
  <text font-family="Fraunces" font-weight="600" font-size="${titleSize}" fill="${C.areia}">${tspans(titleLines, 88, titleY0, titleLh)}</text>
  <text x="88" y="${H - 96}" font-family="Manrope" font-weight="700" font-size="28" fill="${C.dim[post.dim]}">${esc(S.dims[post.dim])}</text>
  <text x="${W - 88}" y="${H - 96}" text-anchor="end" font-family="Manrope" font-weight="700" font-size="28" fill="${C.nevoa}">Perceva</text>
</svg>`);
  await sharp(baseSvg(''))
    .composite([{ input: img, left: inner, top: inner }, { input: overlay, left: 0, top: 0 }])
    .removeAlpha().png().toFile(path.join(outDir, 'slide-1-capa.png'));
}

async function slideTexto(outFile, dimColor, eyebrowText, bodyText, opts = {}) {
  const size = opts.size || 54;
  const lh = Math.round(size * 1.42);
  const maxChars = Math.floor(920 / (size * 0.52));
  const lines = wrap(bodyText, maxChars);
  const blockH = lines.length * lh;
  const y0 = Math.max(330, Math.round((H - blockH) / 2) + 40);
  const fontFam = opts.display ? 'Fraunces' : 'Manrope';
  const weight = opts.display ? 600 : 500;
  const inner = `
  ${iris(W - 150, 190, 95, '#BDB3E6', 0.16)}
  ${eyebrow(eyebrowText, 208)}
  <rect x="88" y="238" width="72" height="8" rx="4" fill="${dimColor}"/>
  <text font-family="${fontFam}" font-weight="${weight}" font-size="${size}" fill="${C.areia}">${tspans(lines, 88, y0, lh)}</text>
  ${footer(opts.page, dimColor)}`;
  await sharp(baseSvg(inner)).removeAlpha().png().toFile(outFile);
}

async function slideFonte(post, outDir) {
  const S = STR[langOf(post)];
  const cardX = 88, cardW = W - 176, cardY = 290, pad = 48;
  // Claim longo é cortado na fronteira de frase pra caber no card-resumo.
  let claim = post.claim;
  if (claim.length > 150) {
    const cut = claim.slice(0, 150).lastIndexOf('. ');
    if (cut > 60) claim = claim.slice(0, cut + 1);
  }
  const titleLines = wrap(post.titulo, 34);
  const claimLines = wrap(claim, 46);
  const fonteLines = wrap(post.fonte, 48);
  // Card cresce com o conteúdo — nunca sobrepõe (bug corrigido no lote 01).
  const titleY = cardY + pad + 40;
  const claimY = titleY + titleLines.length * 52 - 52 + 74;
  const fonteY = claimY + claimLines.length * 43 - 43 + 66;
  const cardH = fonteY + fonteLines.length * 40 - 40 + pad - cardY + 8;
  const ctaY = cardY + cardH + 110;
  const tagY = ctaY + 2 * 56 + 66;
  const inner = `
  ${eyebrow(S.srcEyebrow, 200)}
  <rect x="88" y="230" width="72" height="8" rx="4" fill="${C.dim[post.dim]}"/>
  <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="28" fill="${C.superficie}" stroke="${C.dim[post.dim]}" stroke-opacity="0.55" stroke-width="3"/>
  <text font-family="Manrope" font-weight="700" font-size="40" fill="${C.areia}">${tspans(titleLines, cardX + pad, titleY, 52)}</text>
  <text font-family="Manrope" font-weight="500" font-size="31" fill="${C.nevoa}">${tspans(claimLines, cardX + pad, claimY, 43)}</text>
  <text font-family="Manrope" font-weight="700" font-size="29" fill="${C.dourado}">${tspans(fonteLines, cardX + pad, fonteY, 40)}</text>
  <text font-family="Manrope" font-weight="500" font-size="40" fill="${C.areia}">${tspans(wrap(S.cta, 42), 88, ctaY, 56)}</text>
  <text x="88" y="${tagY}" font-family="Fraunces" font-weight="600" font-size="46" fill="${C.dourado}">${esc(S.tagline)}</text>
  ${footer('perceva.app', C.dim[post.dim])}`;
  await sharp(baseSvg(inner)).removeAlpha().png().toFile(path.join(outDir, 'slide-5-fonte.png'));
}

function validate(post) {
  const errs = [];
  for (const k of ['slug', 'dim', 'image_path', 'titulo', 'claim', 'mecanismo', 'fazer', 'fonte'])
    if (!post[k]) errs.push(`campo obrigatório ausente: ${k}`);
  if (post.dim && !C.dim[post.dim]) errs.push(`dim inválida: ${post.dim}`);
  // Guardas editoriais mecânicas (a lista completa é o EDITORIAL.md):
  const all = [post.titulo, post.claim, post.mecanismo, post.fazer].join(' ');
  if (/\p{Extended_Pictographic}/u.test(all)) errs.push('emoji em superfície de marca (proibido)');
  if (/!!|!\s*!/.test(all)) errs.push('exclamação em série (proibido)');
  const blacklist = /melhor vers[ãa]o|teste psicol[óo]gico|avalia[çc][ãa]o psicol[óo]gica|gamifique|tudo em um|all-in-one|autocuidado|mentoria|\bcoach\b|não perca|sequência de \d+ dias|21 dias|desbloqueie/i;
  const hit = all.match(blacklist);
  if (hit) errs.push(`termo da lista negra do Playbook: "${hit[0]}"`);
  return errs;
}

(async () => {
  const batchPath = process.argv[2];
  if (!batchPath) { console.error('uso: node carousel.js <batch.json> [outDir]'); process.exit(1); }
  // BOM-safe: arquivos salvos pelo PowerShell/editores Windows vêm com U+FEFF.
  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8').replace(/^﻿/, ''));
  const outRoot = process.argv[3] ||
    path.join(__dirname, '..', '..', 'social', 'lote-' + new Date().toISOString().slice(0, 10));

  const usedPath = path.join(__dirname, 'used-ideas.json');
  const used = fs.existsSync(usedPath) ? JSON.parse(fs.readFileSync(usedPath, 'utf8')) : [];

  for (const post of batch) {
    const errs = validate(post);
    if (errs.length) { console.error(`REPROVADO ${post.slug || '?'}:\n  - ` + errs.join('\n  - ')); process.exit(1); }
    if (used.some((u) => u.image_path === post.image_path && (u.lang || 'pt') === langOf(post)))
      console.warn(`AVISO ${post.slug}: ideia já usada antes (${post.image_path})`);
  }

  for (const post of batch) {
    const outDir = path.join(outRoot, post.slug);
    fs.mkdirSync(outDir, { recursive: true });
    const imgBuf = await fetchImage(post.image_path);
    await slideCapa(post, imgBuf, outDir);
    await slideTexto(path.join(outDir, 'slide-2-afirmacao.png'), C.dim[post.dim],
      post.eyebrow2 || STR[langOf(post)].claimEyebrow, post.claim, { display: true, size: post.eyebrow2 ? 54 : 62, page: '2 · 5' });
    await slideTexto(path.join(outDir, 'slide-3-mecanismo.png'), C.dim[post.dim],
      post.eyebrow3 || STR[langOf(post)].mechEyebrow, post.mecanismo, { size: 47, page: '3 · 5' });
    await slideTexto(path.join(outDir, 'slide-4-o-que-fazer.png'), C.dim[post.dim],
      STR[langOf(post)].doEyebrow, post.fazer, { size: 50, page: '4 · 5' });
    await slideFonte(post, outDir);
    if (!used.some((u) => u.image_path === post.image_path && (u.lang || 'pt') === langOf(post)))
      used.push({ image_path: post.image_path, slug: post.slug, date: new Date().toISOString().slice(0, 10), lang: langOf(post) });
    console.log('ok', post.slug);
  }

  fs.writeFileSync(usedPath, JSON.stringify(used, null, 2) + '\n');
  console.log(`done → ${outRoot}`);
})().catch((e) => { console.error(e); process.exit(1); });
