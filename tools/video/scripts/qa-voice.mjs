// QA da narração: transcreve cada fala com o Gemini, compara com o roteiro e
// (com --fix) regrava a que não bater — até N tentativas. Pega fala embolada,
// palavra trocada e homófono que muda o sentido ("mais" ouvido como "mas").
//   node scripts/qa-voice.mjs [--script recanto] [--fix] [--tries 4] [--only a,b]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const name = arg('script', '');
const fix = process.argv.includes('--fix');
const tries = Number(arg('tries', '4'));
const only = arg('only', '').split(',').filter(Boolean);
const voDir = path.join(root, 'public', name ? `vo-${name}` : 'vo');
const { lines } = JSON.parse(fs.readFileSync(path.join(root, 'src', name ? `script.${name}.json` : 'script.json'), 'utf8'));
const key = process.env.GEMINI_API_KEY;

// "5" e "cinco" contam como a mesma palavra (o transcritor escreve algarismo)
const NUM = { um: '1', uma: '1', dois: '2', duas: '2', tres: '3', quatro: '4', cinco: '5', seis: '6', sete: '7', oito: '8', nove: '9', dez: '10' };
const norm = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9% ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => NUM[w] ?? w);
const sim = (a, b) => {
  const x = norm(a), y = norm(b);
  const d = Array.from({ length: x.length + 1 }, (_, i) => [i, ...Array(y.length).fill(0)]);
  for (let j = 1; j <= y.length; j++) d[0][j] = j;
  for (let i = 1; i <= x.length; i++)
    for (let j = 1; j <= y.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
  return 1 - d[x.length][y.length] / Math.max(x.length, y.length, 1);
};

async function transcribe(file) {
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ contents: [{ parts: [
      { inlineData: { mimeType: /\.mp3$/i.test(file) ? 'audio/mp3' : 'audio/wav', data: fs.readFileSync(file).toString('base64') } },
      { text: 'Transcreva este áudio em português do Brasil exatamente como foi falado, palavra por palavra, sem corrigir nem comentar. ' +
        'Nomes próprios prováveis: Perceva (app), Recanto, Explorar, Aprender. Números em algarismos. Responda só com a transcrição.' },
    ] }] }),
  });
  const j = await res.json();
  return (j.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '').trim();
}

let failed = 0;
for (const line of lines) {
  if (only.length && !only.includes(line.id)) continue;
  const file = path.join(voDir, `${line.id}.mp3`);
  for (let t = 1; t <= tries; t++) {
    const heard = await transcribe(file);
    const score = Math.max(sim(heard, line.caption.replace(/\*/g, '')), line.say ? sim(heard, line.say) : 0);
    const ok = score >= 0.86;
    console.log(`${ok ? 'OK  ' : 'FALHA'} ${line.id.padEnd(9)} ${(score * 100).toFixed(0)}%  "${heard}"`);
    if (ok) break;
    if (!fix || t === tries) { failed++; break; }
    execFileSync('node', [path.join(root, 'scripts/tts-gemini.mjs'), ...(name ? ['--script', name] : []), '--only', line.id], { stdio: 'ignore' });
  }
}
process.exitCode = failed ? 1 : 0;
