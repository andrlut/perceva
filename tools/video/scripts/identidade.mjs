#!/usr/bin/env node
// Folha de uma (ou mais) opção de identidade → out/identidade/<id>.png (+ <id>.f2.png num 2º quadro).
//   node scripts/identidade.mjs hex iris      (sem argumento: todas)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'out/identidade');
fs.mkdirSync(out, { recursive: true });
const { bundle } = await import('@remotion/bundler');
const { renderStill, selectComposition } = await import('@remotion/renderer');
const serveUrl = await bundle({ entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public') });
const optDir = path.join(root, 'src/identidade/options');
const all = fs
  .readdirSync(optDir)
  .filter((f) => f.endsWith('.tsx'))
  .flatMap((f) => [...fs.readFileSync(path.join(optDir, f), 'utf8').matchAll(/^\s*id: '([\w-]+)'/gm)].map((m) => m[1]));
const ids = process.argv.slice(2).length ? process.argv.slice(2) : all;
for (const option of ids) {
  if (!all.includes(option)) throw new Error(`opção desconhecida: ${option} (tem: ${all.join(', ')})`);
  const inputProps = { option };
  const composition = await selectComposition({ serveUrl, id: 'Identidade', inputProps });
  for (const [frame, suffix] of [[20, ''], [61, '.f2']]) {
    const f = path.join(out, `${option}${suffix}.png`);
    await renderStill({ serveUrl, composition, frame, output: f, inputProps });
  }
  console.log(`✓ ${path.relative(root, path.join(out, option + '.png'))}`);
}
