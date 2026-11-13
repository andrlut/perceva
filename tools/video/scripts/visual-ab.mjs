#!/usr/bin/env node
// Antes × depois do acabamento do fundo (src/molde/visual.ts) num vídeo já montado.
//   node scripts/visual-ab.mjs <specKey> [--visual v5] [--at 0.55]
// Pra cada cena, o quadro em `at` (fração da cena) com e sem o acabamento, lado a lado:
// out/visual-ab/<specKey>/<n>-<cena>.png (+ sheet.png com tudo).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : d;
};
const specKey = args.find((a, i) => !a.startsWith('--') && !['--visual', '--at'].includes(args[i - 1]));
if (!specKey) {
  console.error('uso: node scripts/visual-ab.mjs <specKey> [--visual v5] [--at 0.55]');
  process.exit(1);
}
const visual = opt('--visual', 'v5');
const at = Number(opt('--at', '0.55'));
const out = path.join(root, 'out/visual-ab', specKey);
fs.mkdirSync(out, { recursive: true });
const { bundle } = await import('@remotion/bundler');
const { renderStill, selectComposition } = await import('@remotion/renderer');
const serveUrl = await bundle({ entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public') });
const base = { specKey, spec: null, scenes: [] };
const comp = await selectComposition({ serveUrl, id: 'Molde', inputProps: base });
const scenes = comp.props.scenes;
const files = [];
for (const [i, s] of scenes.entries()) {
  if (s.scene === 'verso') continue;
  const frame = Math.round(s.start + s.frames * at);
  for (const [tag, props] of [['antes', base], ['depois', { ...base, visual }]]) {
    const composition = await selectComposition({ serveUrl, id: 'Molde', inputProps: props });
    const f = path.join(out, `${String(i + 1).padStart(2, '0')}-${s.scene}.${tag}.png`);
    await renderStill({ serveUrl, composition, frame, output: f, inputProps: props, scale: 0.5 });
    files.push(f);
  }
  console.log(`✓ cena ${i + 1} (${s.scene}) quadro ${frame}`);
}
fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify(files.map((f) => path.basename(f)), null, 1));
