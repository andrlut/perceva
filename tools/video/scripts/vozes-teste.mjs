// Teste de vozes da ElevenLabs em PT-BR com um JUIZ (Gemini ouvindo o áudio): grava o mesmo trecho em
// várias vozes × modelos, numa tomada só, e pede ao Gemini nota de sotaque brasileiro, pausas e
// entonação — e a MESMA nota pra voz de hoje (Gemini Kore), que é a régua (o André acha "boa").
//
//   node scripts/vozes-teste.mjs --dir molde/<chave-com-voz-gemini> --ids hook,reserve,efforts2 \
//     --vozes Paulo:Qrdut83w0Cr152Yb4Xn3:m,Dani:PznTnBc8X6pvixs9UkQm:f --modelos eleven_v4,eleven_multilingual_v2
// Saída: out/vozes/<voz>.<modelo>.mp3 + out/vozes/notas.json (ordenado pela nota).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > 0 ? process.argv[i + 1] : d;
};
const chaveEL = () =>
  process.env.ELEVENLABS_API_KEY ||
  execFileSync('powershell', ['-NoProfile', '-Command', "[Environment]::GetEnvironmentVariable('ELEVENLABS_API_KEY','User')"]).toString().trim();
const GEM = process.env.GEMINI_API_KEY;
if (!GEM) throw new Error('GEMINI_API_KEY ausente');
const EL = chaveEL();

const dir = path.join(root, 'public', arg('dir'));
const ids = arg('ids').split(',');
const spec = JSON.parse(fs.readFileSync(path.join(dir, 'spec.json'), 'utf8'));
const linhas = ids.map((id) => spec.lines.find((l) => l.id === id));
const texto = linhas.map((l) => (l.say ?? l.caption).replace(/\*/g, '')).join(' ');
const out = path.join(root, 'out', 'vozes');
fs.mkdirSync(out, { recursive: true });

const vozes = arg('vozes').split(',').map((v) => {
  const [nome, id, sexo] = v.split(':');
  return { nome, id, sexo };
});
const modelos = arg('modelos', 'eleven_v4,eleven_multilingual_v2').split(',');
const ajustes = (m) =>
  m === 'eleven_multilingual_v2'
    ? { voice_settings: { stability: 0.75, similarity_boost: 0.8, style: 0, use_speaker_boost: true } }
    : { voice_settings: { stability: 0.5, similarity_boost: 0.75, use_speaker_boost: true }, language_code: 'pt' };

async function gravar(v, m) {
  const file = path.join(out, `${v.nome}.${m}.mp3`);
  if (fs.existsSync(file)) return file;
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${v.id}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': EL, 'Content-Type': 'application/json', accept: 'audio/mpeg' },
    body: JSON.stringify({ text: texto, model_id: m, ...ajustes(m) }),
  });
  if (!r.ok) throw new Error(`${v.nome}/${m}: ${r.status} ${(await r.text()).slice(0, 200)}`);
  fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  return file;
}

// a régua: as mesmas falas na voz de hoje, emendadas
function referencia() {
  const file = path.join(out, `Kore.gemini.mp3`);
  const lista = path.join(out, '_lista.txt');
  fs.writeFileSync(lista, ids.map((id) => `file '${path.join(dir, `${id}.mp3`).replace(/\\/g, '/')}'`).join('\n'));
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lista, '-c', 'copy', file]);
  return file;
}

const PERGUNTA = `Você é um diretor de dublagem brasileiro, exigente. Ouça esta narração em português do Brasil (texto: "${texto}").
Responda SÓ um JSON, sem comentário fora dele:
{"sotaque_br": <0-10: 10 = brasileiro nativo indistinguível, 0 = claramente estrangeiro>,
 "sotaque_estranho": "<nenhum | português de Portugal | inglês | espanhol | robótico | outro: ...>",
 "pausas": <0-10: 10 = pausas só onde um locutor brasileiro pausaria; baixo = para no meio da frase como se tivesse ponto>,
 "entonacao": <0-10: 10 = entonação natural de locutor de vídeo curto; baixo = monótona ou subindo/descendo nos lugares errados>,
 "pronuncia": <0-10>,
 "problemas": ["<curto, com a palavra ou o trecho>"]}`;

async function julgar(file) {
  const notas = [];
  for (let k = 0; k < 2; k++) {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEM },
      body: JSON.stringify({ contents: [{ parts: [{ inlineData: { mimeType: 'audio/mp3', data: fs.readFileSync(file).toString('base64') } }, { text: PERGUNTA }] }], generationConfig: { responseMimeType: 'application/json' } }),
    });
    const j = await res.json();
    const t = j?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '{}';
    try {
      notas.push(JSON.parse(t));
    } catch {
      /* resposta torta: ignora */
    }
  }
  const media = (k) => +(notas.reduce((a, n) => a + (Number(n[k]) || 0), 0) / Math.max(1, notas.length)).toFixed(1);
  const r = { sotaque_br: media('sotaque_br'), pausas: media('pausas'), entonacao: media('entonacao'), pronuncia: media('pronuncia') };
  return { ...r, total: +(r.sotaque_br * 0.4 + r.pausas * 0.25 + r.entonacao * 0.25 + r.pronuncia * 0.1).toFixed(2), estranho: notas.map((n) => n.sotaque_estranho), problemas: notas.flatMap((n) => n.problemas ?? []).slice(0, 4) };
}

const resultados = [];
const ref = referencia();
resultados.push({ voz: 'Kore (Gemini, hoje)', modelo: 'gemini', file: path.relative(root, ref), ...(await julgar(ref)) });
console.log('régua', JSON.stringify(resultados[0]));
for (const v of vozes)
  for (const m of modelos) {
    try {
      const f = await gravar(v, m);
      const n = await julgar(f);
      resultados.push({ voz: v.nome, modelo: m, file: path.relative(root, f), ...n });
      console.log(`${v.nome.padEnd(10)} ${m.padEnd(24)} total ${n.total}  br ${n.sotaque_br} pausas ${n.pausas} ent ${n.entonacao}  ${n.estranho.join('/')}`);
    } catch (e) {
      console.log(`✗ ${v.nome} ${m}: ${e.message}`);
    }
  }
resultados.sort((a, b) => b.total - a.total);
fs.writeFileSync(path.join(out, 'notas.json'), JSON.stringify({ texto, resultados }, null, 2));
console.log(`créditos ≈ ${texto.length * vozes.length * modelos.length} · ${path.join(out, 'notas.json')}`);
