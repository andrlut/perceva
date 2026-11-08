// Vídeo do site (perceva.app): a volta pelas telas do app — src/tutorial/Vitrine.tsx.
// Cada trecho é um tour curto (tools/video/tours/vitrine-*.json, "kind": "vitrine"); este
// script roda o tour.mjs em cada um e renderiza o filme emendado com o cartão final.
//
//   node scripts/vitrine.mjs lint                          o lint de cada trecho (grátis)
//   node scripts/vitrine.mjs build  [--lang pt|en|both] [--silent]
//   node scripts/vitrine.mjs voice  [--lang …]              TTS Kore + QA por transcrição, por trecho
//   node scripts/vitrine.mjs stills [--lang …]              folha de contato + audit do movimento, por trecho
//   node scripts/vitrine.mjs render [--lang …]              o filme: out/vitrine/<lang>/intro.<lang>.mp4 (720p) + pôster + folha
//   node scripts/vitrine.mjs all    [--lang …]              build → voice → stills → render
//
// O site usa public/assets/video/intro.<lang>.mp4 (+ .poster.webp) no repo andrlut/perceva-site:
// copie os dois arquivos de out/vitrine/<lang>/ pra lá.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pendingLines } from './voiced.mjs';

const root = path.resolve(import.meta.dirname, '..');
const argv = process.argv.slice(2);
const step = argv[0];
const arg = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i > 0 ? argv[i + 1] : d;
};
const flag = (n) => argv.includes(`--${n}`);
const langArg = arg('lang', 'both');
const LANGS = langArg === 'both' ? ['pt', 'en'] : [langArg];
/** a mesma ordem de VITRINE_SEGMENTS (src/tutorial/Vitrine.tsx) */
const SEGMENTS = ['vitrine-eu', 'vitrine-praticas', 'vitrine-recompensas', 'vitrine-recanto', 'vitrine-fecho'];
const die = (m) => {
  console.error(`✗ ${m}`);
  process.exit(1);
};
const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

const tour = (sub, seg, extra = []) =>
  execFileSync('node', [path.join(root, 'scripts', 'tour.mjs'), sub, '--tour', seg, '--lang', langArg, ...extra], { stdio: 'inherit', cwd: root });

async function render() {
  const { bundle } = await import('@remotion/bundler');
  const { renderMedia, selectComposition } = await import('@remotion/renderer');
  const serveUrl = await bundle({ entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public') });
  for (const lang of LANGS) {
    const inputProps = { lang };
    const composition = await selectComposition({ serveUrl, id: 'Vitrine', inputProps });
    // cada trecho: com voz em dia e sem problema de movimento (as mesmas travas do tour.mjs render)
    let bad = 0;
    for (const p of composition.props.parts) {
      const k = p.tour.tourKey;
      if (p.tour.spec.silent && !flag('allow-silent')) die(`${k}: build --silent (sem voz) — rode build + voice (ou --allow-silent pra rascunho)`);
      const pending = p.tour.spec.silent ? [] : pendingLines(path.join(root, 'public', 'tour', k), p.tour.spec.lines);
      if (pending.length) die(`${k}: fala sem voz em dia (${pending.map((l) => l.id).join(', ')}) — node scripts/vitrine.mjs voice --lang ${lang}`);
      for (const i of p.tour.motion?.issues ?? []) {
        bad++;
        console.warn(`! ${k} ${(i.frame / 30).toFixed(2)} s [${i.rule}] ${i.what}`);
      }
    }
    if (bad && !flag('allow-motion')) die(`vitrine.${lang}: ${bad} problema(s) de movimento (acima) — corrija o roteiro (ou --allow-motion pra rascunho)`);
    const dir = path.join(root, 'out', 'vitrine', lang);
    fs.mkdirSync(dir, { recursive: true });
    const full = path.join(dir, 'video.mp4');
    let shown = -1;
    await renderMedia({
      serveUrl,
      composition,
      codec: 'h264',
      imageFormat: 'png',
      outputLocation: full,
      inputProps,
      onProgress: ({ progress }) => {
        const pct = Math.floor(progress * 10) * 10;
        if (pct !== shown) process.stdout.write(`${(shown = pct)}% `);
      },
    });
    console.log('');
    // a versão do site: 720p, AAC 96k, faststart (a mesma régua das portas do app)
    const silent = composition.props.parts.some((p) => p.tour.spec.silent);
    const name = `intro.${lang}${silent ? '.silent' : ''}`;
    const mp4 = path.join(dir, `${name}.mp4`);
    const poster = path.join(dir, `${name}.poster.webp`);
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', full, '-vf', 'scale=720:1280:flags=lanczos', '-c:v', 'libx264', '-crf', '23', '-preset', 'slow', '-tune', 'animation', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', mp4]);
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', arg('poster', '1.0'), '-i', mp4, '-frames:v', '1', '-vf', 'scale=720:-1', '-c:v', 'libwebp', '-quality', '82', poster]);
    // folha de conferência do filme inteiro: um quadro a cada 2 s
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', mp4, '-vf', 'fps=1/2,scale=240:-1,tile=8x3:padding=8:color=0x0A0E26', '-frames:v', '1', path.join(dir, 'sheet.png')]);
    const secs = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString());
    console.log(`✓ vitrine.${lang}: ${secs.toFixed(1)} s · ${(fs.statSync(mp4).size / 1e6).toFixed(2)} MB · ${path.relative(root, mp4)} · folha ${path.relative(root, path.join(dir, 'sheet.png'))}`);
  }
}

if (step === 'lint' || step === 'build' || step === 'voice' || step === 'stills') {
  for (const seg of SEGMENTS) tour(step, seg, step === 'build' && flag('silent') ? ['--silent'] : []);
} else if (step === 'render') await render();
else if (step === 'all') {
  for (const seg of SEGMENTS) tour('build', seg, flag('silent') ? ['--silent'] : []);
  if (!flag('silent')) for (const seg of SEGMENTS) tour('voice', seg);
  for (const seg of SEGMENTS) tour('stills', seg);
  await render();
} else die(`passo desconhecido: ${step ?? '(nenhum)'} — lint | build | voice | stills | render | all`);
