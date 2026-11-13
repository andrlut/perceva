// Voz de narração via ElevenLabs — o MESMO contrato do tts-gemini.mjs (fala por fala em
// public/<dir>/<id>.mp3, normalizada e com 0,25 s de respiro, + timings.json), então o molde, o QA
// por transcrição (qa-voice.mjs) e as deixas medidas (pauses.mjs) funcionam igual.
//
//   node scripts/tts-eleven.mjs --dir molde/<chave> --lang pt --voice <voice_id> [--model eleven_v3] [--only a,b]
//   node scripts/tts-eleven.mjs --voices "paulo"            -> procura vozes (as suas + a biblioteca) e lista id/nome/sotaque
//   node scripts/tts-eleven.mjs --voices "" --lang pt       -> biblioteca filtrada por idioma
//   node scripts/tts-eleven.mjs --add <public_owner_id>:<voice_id> --name "Paulo"   -> põe a voz da biblioteca nas suas
//   node scripts/tts-eleven.mjs --quota                     -> créditos usados / do plano
//
// A chave: ELEVENLABS_API_KEY no ambiente; no Windows, se o app foi aberto antes da variável existir,
// ela é lida da variável de USUÁRIO (registro) — nunca impressa. Custo: 1 crédito por caractere
// (eleven_v3 / eleven_multilingual_v2); um vídeo de 45 s tem ~460 caracteres por idioma.
//
// Plano free: SEM licença comercial — serve pra teste e piloto, nunca pra subir pro app.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const API = 'https://api.elevenlabs.io';

function chave() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY.trim();
  if (process.platform === 'win32') {
    try {
      const v = execFileSync('powershell', ['-NoProfile', '-Command', "[Environment]::GetEnvironmentVariable('ELEVENLABS_API_KEY','User')"], { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim();
      if (v) return v;
    } catch {
      /* cai no erro abaixo */
    }
  }
  return '';
}

const LANG = arg('lang', 'pt');
const MODEL = arg('model', 'eleven_v3');
const VOICE = arg('voice', '');
const measureOnly = process.argv.includes('--measure');
const KEY = measureOnly ? '' : chave();
if (!KEY && !measureOnly) {
  console.error('✗ ELEVENLABS_API_KEY não encontrada (nem no ambiente nem na variável de usuário do Windows).');
  process.exit(1);
}
const H = { 'xi-api-key': KEY, 'Content-Type': 'application/json', accept: 'application/json' };

async function get(p) {
  const r = await fetch(API + p, { headers: H });
  if (!r.ok) throw new Error(`ElevenLabs ${r.status} em ${p.split('?')[0]}: ${(await r.text()).slice(0, 300)}`);
  return r.json();
}

// ------------------------------------------------------------------ utilidades (sem gastar crédito)
if (process.argv.includes('--quota')) {
  const s = await get('/v1/user/subscription');
  console.log(`plano ${s.tier}: ${s.character_count} de ${s.character_limit} créditos usados (renova ${new Date(s.next_character_count_reset_unix * 1000).toISOString().slice(0, 10)})`);
  process.exit(0);
}
if (process.argv.includes('--voices')) {
  const q = arg('voices', '') ?? '';
  const mine = await get(`/v2/voices?page_size=100${q ? `&search=${encodeURIComponent(q)}` : ''}`);
  console.log('— suas vozes');
  for (const v of mine.voices ?? []) console.log(`  ${v.voice_id}  ${v.name}  [${v.category}] ${JSON.stringify(v.labels ?? {})}`);
  const params = new URLSearchParams({ page_size: '30', ...(q ? { search: q } : {}), ...(arg('lang') ? { language: LANG } : {}), ...(arg('use') ? { use_cases: arg('use') } : {}), sort: 'trending' });
  const lib = await get(`/v1/shared-voices?${params}`);
  console.log('— biblioteca');
  for (const v of lib.voices ?? [])
    console.log(`  ${v.public_owner_id}:${v.voice_id}  ${v.name}  ${v.gender ?? ''}/${v.age ?? ''} ${v.language ?? ''}-${v.accent ?? ''} · ${v.use_case ?? ''} · ${v.descriptive ?? ''} · uso ${v.usage_character_count_1y ?? '?'}${v.free_users_allowed === false ? ' · SÓ PAGO' : ''}\n      ${(v.description ?? '').replace(/\s+/g, ' ').slice(0, 160)}`);
  process.exit(0);
}
if (arg('add')) {
  const [owner, id] = arg('add').split(':');
  const r = await fetch(`${API}/v1/voices/add/${owner}/${id}`, { method: 'POST', headers: H, body: JSON.stringify({ new_name: arg('name', id) }) });
  if (!r.ok) throw new Error(`ElevenLabs ${r.status} ao adicionar: ${(await r.text()).slice(0, 300)}`);
  console.log(`✓ adicionada: ${(await r.json()).voice_id}`);
  process.exit(0);
}

// ------------------------------------------------------------------ gravar as falas
const dir = arg('dir', '');
if (!dir) {
  console.error('uso: node scripts/tts-eleven.mjs --dir molde/<chave> --lang pt --voice <voice_id> [--model eleven_v3] [--only a,b]');
  process.exit(1);
}
if (!VOICE && !measureOnly) {
  console.error('✗ --voice <voice_id> (veja --voices)');
  process.exit(1);
}
const voDir = path.join(root, 'public', dir);
const { lines } = JSON.parse(fs.readFileSync(path.join(voDir, 'spec.json'), 'utf8'));
const plain = (s) => s.replace(/\*/g, '');
const texto = (l) => plain(l.say ?? l.caption);

// v3 aceita estabilidade 0 (criativa), 0,5 (natural) ou 1 (robusta); os outros modelos, contínua
// 2026-11-11 (pesquisa, o PT soava "fala e para" e com sotaque): a documentação manda o exagero de
// ESTILO em 0 sempre (0,35 aqui deixava a entonação estranha e o sotaque escorregar); a comunidade usa
// stability 0,7–0,8 pra segurar o sotaque no multilingual_v2; speed 0,9–1,0. O v4 (e o v3) recebem o
// language_code e a estabilidade vem em degraus (0 criativa, 0,5 natural, 1 robusta).
const V3 = MODEL === 'eleven_v3' || MODEL.startsWith('eleven_v4');
const speed = arg('speed') ? { speed: Number(arg('speed')) } : {};
const settings = V3
  ? { stability: Number(arg('stability', '0.5')), similarity_boost: 0.75, use_speaker_boost: true, ...speed }
  : { stability: Number(arg('stability', '0.75')), similarity_boost: 0.8, style: Number(arg('style', '0')), use_speaker_boost: true, ...speed };

/** A cota do plano acabou: sai com código 3 — o molde (voice) cai pra Kore e o vídeo sai mesmo assim. */
// TTS_ELEVEN_SIMULA_COTA=1: teste da queda pra Kore sem gastar crédito (a gravação sai com 3 na hora)
if (process.env.TTS_ELEVEN_SIMULA_COTA && !measureOnly && !process.argv.includes('--recortar')) {
  console.error('✗ ElevenLabs sem cota (simulado: TTS_ELEVEN_SIMULA_COTA)');
  process.exit(3);
}
function paraNaCota(status, err) {
  if (!/quota/i.test(err)) return;
  console.error(`✗ ElevenLabs sem cota (${status}): ${err.slice(0, 200)}`);
  process.exit(3);
}

async function synth(i) {
  const l = lines[i];
  const body = {
    text: texto(l),
    model_id: MODEL,
    voice_settings: settings,
    ...(MODEL === 'eleven_multilingual_v2' ? {} : { language_code: LANG === 'en' ? 'en' : 'pt' }),
    // emenda de prosódia com as falas vizinhas (sem cobrar por elas); o v3 não aceita
    ...(V3 ? {} : { previous_text: i > 0 ? texto(lines[i - 1]) : undefined, next_text: i < lines.length - 1 ? texto(lines[i + 1]) : undefined }),
  };
  for (let t = 1; t <= 5; t++) {
    const r = await fetch(`${API}/v1/text-to-speech/${VOICE}?output_format=mp3_44100_128`, { method: 'POST', headers: { ...H, accept: 'audio/mpeg' }, body: JSON.stringify(body) });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    const err = await r.text();
    // 429 (concorrência do plano) = espera e tenta; cota, chave ou voz errada = para na hora
    if (r.status === 429 && !/quota/i.test(err)) {
      await new Promise((ok) => setTimeout(ok, 4000 * t));
      continue;
    }
    paraNaCota(r.status, err);
    throw new Error(`ElevenLabs ${r.status}: ${err.slice(0, 400)}`);
  }
  throw new Error('ElevenLabs: sem resposta após 5 tentativas');
}

// mesma masterização do tts-gemini: silêncio das pontas fora, 0,25 s de respiro, −16 LUFS
function master(raw, mp3) {
  execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y', '-i', raw,
    '-af',
    'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,apad=pad_dur=0.25,loudnorm=I=-16:TP=-1.5:LRA=11',
    '-ar', '44100', '-codec:a', 'libmp3lame', '-b:a', '192k', mp3,
  ]);
  fs.rmSync(raw, { force: true });
}
const seconds = (f) => Math.round(Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString()) * 1000) / 1000;

const only = arg('only', '').split(',').filter(Boolean);
const timings = [];
let gastos = 0;

// --inteiro (2026-11-10): o roteiro INTEIRO numa tomada só e cortado em falas pelo tempo de cada letra
// (/with-timestamps). Fala por fala a entonação recomeça a cada corte — o "fala e para" que o André
// ouviu no PT. Grava todas as falas (ignora --only); o QA com --fix regrava só a que falhar, sozinha.
// --recortar: corta de novo a tomada única salva (_inteiro.mp3 + _inteiro.json), sem pagar outra
if (process.argv.includes('--recortar')) {
  const { faixa, dur } = JSON.parse(fs.readFileSync(path.join(voDir, '_inteiro.json'), 'utf8'));
  const inteiro = path.join(voDir, '_inteiro.mp3');
  for (let i = 0; i < lines.length; i++) {
    const de = i === 0 ? 0 : (faixa[i - 1].fim + faixa[i].ini) / 2;
    const ate = i === lines.length - 1 ? dur : (faixa[i].fim + faixa[i + 1].ini) / 2;
    const raw = path.join(voDir, `${lines[i].id}.raw.wav`);
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', inteiro, '-ss', de.toFixed(3), '-to', ate.toFixed(3), raw]);
    master(raw, path.join(voDir, `${lines[i].id}.mp3`));
  }
  only.length = 0;
  only.push('__nenhuma__');
  console.log(`recortada a tomada única salva (${dur.toFixed(1)} s)`);
} else if (process.argv.includes('--inteiro') && !measureOnly) {
  const partes = lines.map(texto);
  const full = partes.join(' ');
  const body = { text: full, model_id: MODEL, voice_settings: settings, ...(MODEL === 'eleven_multilingual_v2' ? {} : { language_code: LANG === 'en' ? 'en' : 'pt' }) };
  const r = await fetch(`${API}/v1/text-to-speech/${VOICE}/with-timestamps?output_format=mp3_44100_128`, { method: 'POST', headers: H, body: JSON.stringify(body) });
  if (!r.ok) {
    const err = await r.text();
    paraNaCota(r.status, err);
    throw new Error(`ElevenLabs ${r.status}: ${err.slice(0, 400)}`);
  }
  const res = await r.json();
  const al = res.alignment;
  const inteiro = path.join(voDir, '_inteiro.mp3');
  fs.writeFileSync(inteiro, Buffer.from(res.audio_base64, 'base64'));
  gastos += full.length;
  // o começo e o fim de cada fala no texto inteiro → em segundos; o corte é no MEIO do silêncio entre as falas
  let pos = 0;
  const faixa = partes.map((t) => {
    const a0 = pos;
    const a1 = pos + t.length - 1;
    pos += t.length + 1;
    return { ini: al.character_start_times_seconds[a0], fim: al.character_end_times_seconds[a1] };
  });
  const dur = seconds(inteiro);
  // o alinhamento fica salvo: dá pra recortar uma fala de novo sem pagar outra tomada
  fs.writeFileSync(path.join(voDir, '_inteiro.json'), JSON.stringify({ faixa, dur }, null, 2));
  for (let i = 0; i < lines.length; i++) {
    const de = i === 0 ? 0 : (faixa[i - 1].fim + faixa[i].ini) / 2;
    const ate = i === lines.length - 1 ? dur : (faixa[i].fim + faixa[i + 1].ini) / 2;
    const raw = path.join(voDir, `${lines[i].id}.raw.wav`);
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', inteiro, '-ss', de.toFixed(3), '-to', ate.toFixed(3), raw]);
    master(raw, path.join(voDir, `${lines[i].id}.mp3`));
  }
  only.length = 0;
  only.push('__nenhuma__');
  console.log(`tomada única: ${dur.toFixed(1)} s, ${lines.length} falas cortadas pelo tempo de cada letra`);
}
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  const file = path.join(voDir, `${l.id}.mp3`);
  if (!measureOnly && (!only.length || only.includes(l.id))) {
    const raw = path.join(voDir, `${l.id}.raw.mp3`);
    fs.writeFileSync(raw, await synth(i));
    master(raw, file);
    gastos += texto(l).length;
  }
  const s = seconds(file);
  timings.push({ id: l.id, seconds: s });
  console.log(`${l.id.padEnd(10)} ${s.toFixed(2)}s`);
}
fs.writeFileSync(path.join(voDir, 'timings.json'), JSON.stringify(timings, null, 2));
// --recortar não chamou a API: o voz.json de quem gravou fica (reescrevê-lo punha o modelo padrão, v3, no lugar do v4)
if (!measureOnly && !process.argv.includes('--recortar')) fs.writeFileSync(path.join(voDir, 'voz.json'), JSON.stringify({ provedor: 'elevenlabs', voice_id: VOICE, model: MODEL, settings }, null, 2));
const total = timings.reduce((a, t) => a + t.seconds, 0);
console.log(`voz ElevenLabs ${VOICE} (${MODEL}) — total de fala: ${total.toFixed(1)}s · ~${gastos} créditos nesta rodada`);
