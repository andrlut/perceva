#!/usr/bin/env node
// Boneco v5 — folhas de comparação de um estilo (e o clip de 5 s).
//   node scripts/boneco.mjs <estilo> [<estilo>...] [--clip] [--frames 0,8,16]
// Saída: out/boneco/<estilo>/{elenco.png, acoes.png, clip.mp4, clip-<quadro>.png}
//   --clip     também renderiza o clip (5 s, ~1 min de render)
//   --frames   quadros do clip pra salvar como png (conferir a corrida sem assistir)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const clip = args.includes('--clip');
const fi = args.indexOf('--frames');
const frames = fi >= 0 ? args[fi + 1].split(',').map(Number) : [];
const ids = args.filter((a, i) => !a.startsWith('--') && !(fi >= 0 && i === fi + 1));
if (!ids.length) {
  console.error('uso: node scripts/boneco.mjs <estilo> [--clip] [--frames 0,8,16]');
  process.exit(1);
}
const { bundle } = await import('@remotion/bundler');
const { renderStill, renderMedia, selectComposition } = await import('@remotion/renderer');
const serveUrl = await bundle({ entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public') });
for (const estilo of ids) {
  const out = path.join(root, 'out/boneco', estilo);
  fs.mkdirSync(out, { recursive: true });
  const inputProps = { estilo };
  for (const [id, file] of [['BonecoElenco', 'elenco.png'], ['BonecoAcoes', 'acoes.png']]) {
    const composition = await selectComposition({ serveUrl, id, inputProps });
    await renderStill({ serveUrl, composition, frame: 0, output: path.join(out, file), inputProps });
    console.log(`✓ ${path.relative(root, path.join(out, file))}`);
  }
  if (clip || frames.length) {
    const composition = await selectComposition({ serveUrl, id: 'BonecoClip', inputProps });
    for (const fr of frames) {
      const f = path.join(out, `clip-${String(fr).padStart(3, '0')}.png`);
      await renderStill({ serveUrl, composition, frame: fr, output: f, inputProps });
      console.log(`✓ ${path.relative(root, f)}`);
    }
    if (clip) {
      const f = path.join(out, 'clip.mp4');
      await renderMedia({ serveUrl, composition, codec: 'h264', crf: 20, outputLocation: f, inputProps, concurrency: 4 });
      console.log(`✓ ${path.relative(root, f)}`);
    }
  }
}
