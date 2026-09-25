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
    cta: 'Gostou? Essa ideia vive completa no Perceva — pra ler, ver e ouvir, junto de mais de 100 ideias com fonte.',
    tagline: 'Perceba quem você está se tornando.', dims: DIM_PT,
  },
  en: {
    serie: 'One idea, with a source', claimEyebrow: 'The claim', mechEyebrow: 'The mechanism',
    doEyebrow: 'What to do', srcEyebrow: 'The source',
    cta: "Like this? The full idea lives in Perceva — to read, watch and listen, with 100+ sourced ideas.",
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

const roundedMask = (w, h, rx) => Buffer.from(
  `<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${rx}" fill="#fff"/></svg>`);

const tspans = (lines, x, y0, lh) =>
  lines.map((l, i) => `<tspan x="${x}" y="${y0 + i * lh}">${esc(l)}</tspan>`).join('');

// Glifo CANÔNICO "Topo Iris" — mesma spec de app/scripts/export-perceva-icons.mjs
// (agulha curva com pontas em bolinha, canal recortado nos anéis, pupila-esfera).
// `id` precisa ser único dentro do MESMO SVG (mask/gradient não podem colidir).
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

// Fundo "ambiente" — a linguagem das telas do app (screenAmbient + radar
// sutil), no lugar do chapado: gradiente vertical, brilho suave na cor da
// dimensão atrás do texto e anéis do radar sangrando na borda direita.
// Anéis SEM agulha = textura, não elemento de marca (regra do André intacta).
const baseSvg = (inner, dimColor = C.violeta) => {
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
    <radialGradient id="dimglow" cx="0.22" cy="0.3" r="0.75">
      <stop offset="0" stop-color="${dimColor}" stop-opacity="0.10"/>
      <stop offset="1" stop-color="${dimColor}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#amb)"/>
  <rect width="${W}" height="${H}" fill="url(#dimglow)"/>
  ${rings}
  ${inner}</svg>`);
};

function footer(pageLabel, dimColor) {
  return `${iris('foot', 46, H - 122, 76, 0.95)}
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
  // Referência curta ("Autor, ano") no canto superior direito da capa —
  // feedback do André: o selo de série saiu, a fonte ganha presença na chamada.
  const fonteCurta = post.fonte.split('·')[0].trim();
  const pillW = Math.round(fonteCurta.length * 14.5) + 56;
  const overlay = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.noite}" stop-opacity="0"/>
    <stop offset="0.45" stop-color="${C.noite}" stop-opacity="0.82"/>
    <stop offset="1" stop-color="${C.noite}" stop-opacity="0.97"/>
  </linearGradient></defs>
  <rect x="${inner}" y="${H - scrimH}" width="${W - inner * 2}" height="${scrimH - inner}" fill="url(#s)"/>
  <rect x="${W - 52 - pillW}" y="60" width="${pillW}" height="56" rx="28" fill="rgba(10,14,38,0.62)" stroke="rgba(255,220,143,0.35)" stroke-width="1.5"/>
  <text x="${W - 52 - pillW / 2}" y="97" text-anchor="middle" font-family="Manrope" font-weight="700" font-size="27" fill="${C.dourado}">${esc(fonteCurta)}</text>
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
  // Rótulo de seção só quando o post fornece (estrutura de mito) — os rótulos
  // genéricos repetidos em todo post saíram no feedback do André. Um elemento
  // de marca por slide: só o glifo do rodapé.
  const label = eyebrowText ? `${eyebrow(eyebrowText, 208)}` : '';
  const inner = `
  ${label}
  <rect x="88" y="238" width="72" height="8" rx="4" fill="${dimColor}"/>
  <text font-family="${fontFam}" font-weight="${weight}" font-size="${size}" fill="${C.areia}">${tspans(lines, 88, y0, lh)}</text>
  ${footer(opts.page, dimColor)}`;
  await sharp(baseSvg(inner, dimColor)).removeAlpha().png().toFile(outFile);
}

// Slide final v3 (feedback do André): SEMPRE a fonte em destaque + print da
// ideia (play quando post.video=true) + chamada padrão dos formatos do app.
// Um elemento de marca só: o glifo do rodapé.
async function slideCTA(post, imgBuf, outDir) {
  const S = STR[langOf(post)];
  const fonteLines = wrap(post.fonte, 44);
  const fonteY = 258;
  // Thumb 4:5 da ideia com cantos arredondados; play sobreposto se houver vídeo.
  const tw = 400, th = 500;
  const tx = (W - tw) / 2, ty = fonteY + fonteLines.length * 52 + 46;
  const thumb = await sharp(imgBuf).resize({ width: tw, height: th, fit: 'cover' })
    .composite([{ input: roundedMask(tw, th, 28), blend: 'dest-in' }]).png().toBuffer();
  const play = post.video
    ? `<circle cx="${W / 2}" cy="${ty + th / 2}" r="62" fill="rgba(10,14,38,0.62)" stroke="${C.dourado}" stroke-width="3"/>
       <path d="M ${W / 2 - 18} ${ty + th / 2 - 30} L ${W / 2 + 34} ${ty + th / 2} L ${W / 2 - 18} ${ty + th / 2 + 30} Z" fill="${C.dourado}"/>`
    : '';
  const ctaLines = wrap(S.cta, 42);
  const ctaY = ty + th + 92;
  const btnY = ctaY + ctaLines.length * 56 + 40;
  const centered = (lines, y0, lh) =>
    lines.map((l, i) => `<tspan x="${W / 2}" y="${y0 + i * lh}">${esc(l)}</tspan>`).join('');
  const inner = `
  ${eyebrow(S.srcEyebrow, 196)}
  <rect x="88" y="222" width="72" height="8" rx="4" fill="${C.dim[post.dim]}"/>
  <text font-family="Manrope" font-weight="700" font-size="38" fill="${C.dourado}">${tspans(fonteLines, 88, fonteY + 44, 52)}</text>
  ${play}
  <text text-anchor="middle" font-family="Manrope" font-weight="500" font-size="40" fill="${C.areia}">${centered(ctaLines, ctaY, 56)}</text>
  <rect x="${W / 2 - 170}" y="${btnY}" width="340" height="78" rx="39" fill="${C.violeta}"/>
  <text x="${W / 2}" y="${btnY + 50}" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="32" fill="#FFFFFF">perceva.app</text>
  ${footer('5 · 5', C.dim[post.dim])}`;
  // Thumb entra como composite raster (o SVG traz o resto por cima/baixo).
  const base = await sharp(baseSvg('', C.dim[post.dim])).toBuffer();
  await sharp(base)
    .composite([
      { input: thumb, left: tx, top: ty },
      { input: Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`), left: 0, top: 0 },
    ])
    .removeAlpha().png().toFile(path.join(outDir, 'slide-5-fonte-perceva.png'));
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
      post.eyebrow2 || null, post.claim, { display: true, size: post.eyebrow2 ? 54 : 62, page: '2 · 5' });
    await slideTexto(path.join(outDir, 'slide-3-mecanismo.png'), C.dim[post.dim],
      post.eyebrow3 || null, post.mecanismo, { size: 47, page: '3 · 5' });
    await slideTexto(path.join(outDir, 'slide-4-o-que-fazer.png'), C.dim[post.dim],
      null, post.fazer, { size: 50, page: '4 · 5' });
    await slideCTA(post, imgBuf, outDir);
    if (!used.some((u) => u.image_path === post.image_path && (u.lang || 'pt') === langOf(post)))
      used.push({ image_path: post.image_path, slug: post.slug, date: new Date().toISOString().slice(0, 10), lang: langOf(post) });
    console.log('ok', post.slug);
  }

  fs.writeFileSync(usedPath, JSON.stringify(used, null, 2) + '\n');
  console.log(`done → ${outRoot}`);
})().catch((e) => { console.error(e); process.exit(1); });
