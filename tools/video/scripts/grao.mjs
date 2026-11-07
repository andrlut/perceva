#!/usr/bin/env node
// Grão fixo da Lente (src/components.tsx): public/lente/grao.png.
//   node scripts/grao.mjs [--amount 0.028] [--max 0.09] [--seed 7]
//
// 540×960 células (o PNG é desenhado em 1080×1920 com image-rendering pixelated: cada célula vira
// 2×2 px e sobrevive à redução pra 720p). Cada célula é clara (#FFFFFF) ou escura (#05071A) com
// alfa = |z| × amount (z ~ normal, teto --max): a média não mexe no brilho do quadro, só tira o
// chapado. Determinístico (semente fixa) e sem dependência: PNG escrito à mão com zlib do Node.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const arg = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 ? Number(argv[i + 1]) : d;
};
const AMOUNT = arg('amount', 0.028);
const MAX = arg('max', 0.09);
const W = 540;
const H = 960;

// mulberry32: o mesmo grão em toda máquina
let s = arg('seed', 7) >>> 0;
const rnd = () => {
  s = (s + 0x6d2b79f5) >>> 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
// soma de 4 uniformes ≈ normal (desvio sqrt(4/12))
const gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) / Math.sqrt(4 / 12);

const raw = Buffer.alloc((W * 4 + 1) * H);
let sum = 0;
for (let y = 0; y < H; y++) {
  const row = y * (W * 4 + 1);
  raw[row] = 0; // filtro "none"
  for (let x = 0; x < W; x++) {
    const z = gauss();
    const a = Math.min(MAX, Math.abs(z) * AMOUNT);
    sum += a;
    const o = row + 1 + x * 4;
    const [r, g, b] = z > 0 ? [255, 255, 255] : [5, 7, 26];
    raw[o] = r;
    raw[o + 1] = g;
    raw[o + 2] = b;
    raw[o + 3] = Math.round(a * 255);
  }
}

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bits
ihdr[9] = 6; // RGBA
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);
const out = path.join(root, 'public', 'lente', 'grao.png');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, png);
console.log(`✓ ${path.relative(root, out)} · ${W}×${H} (desenhado em 1080×1920) · alfa médio ${((sum / (W * H)) * 100).toFixed(1)}% · teto ${(MAX * 100).toFixed(0)}% · ${(png.length / 1e6).toFixed(2)} MB`);
