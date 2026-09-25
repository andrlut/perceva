// Banner do YouTube — 2560x1440, texto na safe area central 1546x423.
// Usa o glifo CANÔNICO "Topo Iris" (mesma spec de scripts/export-perceva-icons.mjs):
// agulha curva com pontas em bolinha, canal recortado nos anéis, pupila em esfera.
const path = require('path');
const fs = require('fs');
const os = require('os');
const FONT_DIR = 'C:/Users/Administrator/Projects/rpgtasks/tools/social/fonts';
const CONF = path.join(os.tmpdir(), 'perceva-banner-fonts.conf');
fs.writeFileSync(CONF, `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig><dir>${FONT_DIR}</dir><cachedir>${os.tmpdir().replace(/\\/g, '/')}/perceva-banner-cache</cachedir></fontconfig>`);
if (process.env.FONTCONFIG_FILE !== CONF) {
  const { spawnSync } = require('child_process');
  process.exit(spawnSync(process.execPath, process.argv.slice(1), { env: { ...process.env, FONTCONFIG_FILE: CONF }, stdio: 'inherit' }).status ?? 1);
}
const sharp = require('sharp');

const W = 2560, H = 1440;
const CY = H / 2;
const MARK = '#FFDC8F', MARK_DEEP = '#8A5C0F', ACCENT = '#FFE3A6';
const PATH_D = 'M 180 720 Q 380 600 512 512 Q 644 424 844 304';

// Glifo canônico em viewBox 1024, posicionado por translate/scale.
// `id` único por instância (masks/gradients não podem colidir).
function glyph(id, x, y, size, opacity = 1) {
  const s = size / 1024;
  return `
  <defs>
    <radialGradient id="pupil-${id}" cx="0.4" cy="0.4" r="0.7">
      <stop offset="0" stop-color="${MARK}"/>
      <stop offset="1" stop-color="${MARK_DEEP}"/>
    </radialGradient>
    <mask id="rings-${id}">
      <rect x="0" y="0" width="1024" height="1024" fill="white"/>
      <path d="${PATH_D}" fill="none" stroke="black" stroke-width="60" stroke-linecap="round"/>
    </mask>
  </defs>
  <g transform="translate(${x},${y}) scale(${s})" opacity="${opacity}">
    <g mask="url(#rings-${id})" stroke="${ACCENT}" fill="none" stroke-width="14">
      <circle cx="512" cy="512" r="320" opacity="0.45"/>
      <circle cx="512" cy="512" r="260" opacity="0.55"/>
      <circle cx="512" cy="512" r="200" opacity="0.7"/>
      <circle cx="512" cy="512" r="140" opacity="0.85"/>
      <circle cx="512" cy="512" r="80" opacity="1"/>
    </g>
    <path d="${PATH_D}" fill="none" stroke="${MARK}" stroke-width="22" stroke-linecap="round"/>
    <circle cx="180" cy="720" r="18" fill="${MARK}"/>
    <circle cx="844" cy="304" r="22" fill="${MARK}"/>
    <circle cx="512" cy="512" r="38" fill="url(#pupil-${id})"/>
  </g>`;
}

async function banner(tagline, outFile) {
  const gsz = 210; // glifo do lockup
  const gx = 880, gy = CY - 66 - gsz / 2 + 26;
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1E2348"/><stop offset="0.55" stop-color="#0E1230"/><stop offset="1" stop-color="#0A0E26"/>
    </linearGradient>
    <radialGradient id="halo" cx="0.5" cy="0.5" r="0.45">
      <stop offset="0" stop-color="#7B5CFF" stop-opacity="0.22"/><stop offset="1" stop-color="#7B5CFF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#halo)"/>
  ${glyph('tr', 1930, -90, 560, 0.26)}
  ${glyph('bl', 120, 960, 440, 0.18)}
  ${glyph('main', gx, gy, gsz, 1)}
  <text x="${gx + gsz + 44}" y="${CY + 14}" font-family="Fraunces" font-weight="600" font-size="170" fill="#ECEAF6">Perceva</text>
  <text x="${W / 2}" y="${CY + 132}" text-anchor="middle" font-family="Manrope" font-weight="600" font-size="52" fill="#FFE08A">${tagline}</text>
</svg>`;
  await sharp(Buffer.from(svg)).removeAlpha().png().toFile(outFile);
  console.log(outFile, Math.round(fs.statSync(outFile).size / 1024) + 'KB');
}

(async () => {
  const out = 'C:/Users/Administrator/Projects/rpgtasks/social/brand';
  fs.mkdirSync(out, { recursive: true });
  await banner('Perceba quem você está se tornando.', out + '/youtube-banner-pt.png');
  await banner("See who you're becoming.", out + '/youtube-banner-en.png');
})().catch((e) => { console.error(e); process.exit(1); });
