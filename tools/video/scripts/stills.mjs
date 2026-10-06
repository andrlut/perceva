// Renderiza quadros soltos (um bundle só) pra revisar o visual sem gerar o MP4.
//   node scripts/stills.mjs 150 450 800      -> out/stills/f150.png ...
//   node scripts/stills.mjs --scenes         -> um quadro a 75% de cada cena
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const comp = process.env.COMP ?? 'Manifesto';
const serveUrl = await bundle({ entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public') });
const composition = await selectComposition({ serveUrl, id: comp });
let frames = args.filter((a) => /^\d+$/.test(a)).map(Number);
if (args.includes('--scenes')) {
  frames = composition.props.scenes.map((s) => s.start + Math.round(s.frames * 0.75));
}
fs.mkdirSync(path.join(root, 'out/stills'), { recursive: true });
for (const frame of frames) {
  const output = path.join(root, `out/stills/${comp.toLowerCase()}-f${frame}.png`);
  await renderStill({ serveUrl, composition, frame, output, scale: 0.5 });
  console.log(output);
}
