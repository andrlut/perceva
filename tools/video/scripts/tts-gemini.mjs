// Voz de narração via Gemini TTS (mesma GEMINI_API_KEY do pipeline de mídia
// do Learning). Custo: centavos por vídeo.
//
//   node scripts/tts-gemini.mjs                       -> public/vo/<id>.mp3 + timings.json (vídeo do script.json)
//   node scripts/tts-gemini.mjs --script recanto      -> usa src/script.recanto.json, grava em public/vo-recanto/
//   node scripts/tts-gemini.mjs --voice Sulafat       -> troca a voz (padrão abaixo)
//   node scripts/tts-gemini.mjs --sample Kore,Charon  -> out/voices/<voz>.mp3 com as 2 primeiras falas, pra comparar
//   node scripts/tts-gemini.mjs --only close,feeling  -> regrava só essas falas (as outras ficam)
//   node scripts/tts-gemini.mjs --measure             -> só remede as falas que já existem (ex.: voz gravada à mão)
//
// Cada WAV é normalizado para ~-16 LUFS (ffmpeg) e medido; timings.json é o
// que o Remotion lê para dar a cada cena a duração da sua fala.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};

const MODEL = arg('model', 'gemini-3.8-flash-tts');
const VOICE = arg('voice', 'Kore');
const scriptName = arg('script', '');
const scriptFile = path.join(root, 'src', scriptName ? `script.${scriptName}.json` : 'script.json');
const voDir = path.join(root, 'public', scriptName ? `vo-${scriptName}` : 'vo');
const sample = arg('sample', '');

// Direção de voz (opcional). Instrução longa deixa o modelo lento e
// arrastado (medido: 15,7 s sem direção × 33 s com um parágrafo de direção),
// então o padrão é nenhuma; se usar, que seja curta: --direction "Com voz calorosa"
const DIRECTION = arg('direction', '');
// No 3.8 a direção vai em speech_metadata.style (fora do texto — no texto ela
// seria lida em voz alta). Vazio = estilo padrão da voz.
// ordem: --style na linha de comando > "style" do roteiro > padrão
const DEFAULT_STYLE = 'warm, close and confident Brazilian Portuguese narrator; natural conversational pace; smiling slightly; never a radio announcer';

const key = process.env.GEMINI_API_KEY;
if (!key && !process.argv.includes('--measure')) throw new Error('GEMINI_API_KEY não está no ambiente.');

const plain = (s) => s.replace(/\*/g, '');

async function synth(text, voice) {
  const body = {
    contents: [{ role: 'user', parts: [{ text: DIRECTION ? `${DIRECTION}: ${text}` : text, ...(STYLE ? { speech_metadata: { style: STYLE } } : {}) }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    },
  };
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const json = await res.json();
      const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
      if (!part) throw new Error(`sem áudio na resposta: ${JSON.stringify(json).slice(0, 300)}`);
      const mime = part.inlineData.mimeType ?? '';
      const bytes = Buffer.from(part.inlineData.data, 'base64');
      // gemini-3.x devolve WAV pronto; os 2.5-preview devolvem PCM cru (audio/L16;rate=24000)
      if (mime.includes('wav')) return { wav: bytes };
      const rate = Number(/rate=(\d+)/.exec(mime)?.[1] ?? 24000);
      return { pcm: bytes, rate };
    }
    const err = await res.text();
    if (res.status === 429 || res.status >= 500) {
      await new Promise((r) => setTimeout(r, 4000 * attempt));
      continue;
    }
    throw new Error(`Gemini TTS ${res.status}: ${err.slice(0, 400)}`);
  }
  throw new Error('Gemini TTS: sem resposta após 4 tentativas');
}

function writeWav(file, { wav, pcm, rate }) {
  if (wav) {
    fs.writeFileSync(file, wav);
    return;
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(file, Buffer.concat([header, pcm]));
}

// Normaliza volume, corta o silêncio das pontas (deixa 0,25 s de respiro) e
// grava MP3 — as falas aprovadas ficam versionadas no git (o TTS não repete a
// mesma tomada), então precisam ser leves.
function master(raw, mp3) {
  execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y', '-i', raw,
    '-af',
    'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,apad=pad_dur=0.25,loudnorm=I=-16:TP=-1.5:LRA=11',
    '-ar', '44100', '-codec:a', 'libmp3lame', '-b:a', '192k', mp3,
  ]);
  fs.rmSync(raw, { force: true });
}

function seconds(file) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString();
  return Math.round(Number(out) * 1000) / 1000;
}

const { lines, style: scriptStyle } = JSON.parse(fs.readFileSync(scriptFile, 'utf8'));
const STYLE = arg('style', scriptStyle ?? DEFAULT_STYLE);

if (sample) {
  const dir = path.join(root, 'out', 'voices');
  fs.mkdirSync(dir, { recursive: true });
  const text = lines.slice(0, 2).map((l) => plain(l.say ?? l.caption)).join(' ');
  for (const voice of sample.split(',')) {
    const file = path.join(dir, `${voice.trim()}.mp3`);
    const raw = `${file}.raw.wav`;
    writeWav(raw, await synth(text, voice.trim()));
    master(raw, file);
    console.log(`${voice.trim().padEnd(14)} ${seconds(file).toFixed(1)}s  ${file}`);
  }
  process.exit(0);
}

fs.mkdirSync(voDir, { recursive: true });
const only = arg('only', '').split(',').filter(Boolean);
const measureOnly = process.argv.includes('--measure');
const timings = [];
for (const line of lines) {
  const file = path.join(voDir, `${line.id}.mp3`);
  if (!measureOnly && (!only.length || only.includes(line.id))) {
    const raw = path.join(voDir, `${line.id}.raw.wav`);
    writeWav(raw, await synth(plain(line.say ?? line.caption), VOICE));
    master(raw, file);
  }
  const s = seconds(file);
  timings.push({ id: line.id, seconds: s });
  console.log(`${line.id.padEnd(10)} ${s.toFixed(2)}s`);
}
fs.writeFileSync(path.join(voDir, 'timings.json'), JSON.stringify(timings, null, 2));
const total = timings.reduce((a, t) => a + t.seconds, 0);
console.log(`voz ${VOICE} (${MODEL}) — total de fala: ${total.toFixed(1)}s`);
