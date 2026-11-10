// QA da narração: transcreve cada fala com o Gemini, compara com o roteiro e
// (com --fix) regrava a que não bater — até N tentativas. Pega fala embolada,
// palavra trocada e homófono que muda o sentido ("mais" ouvido como "mas").
//   node scripts/qa-voice.mjs [--script recanto] [--fix] [--tries 4] [--only a,b] [--sex female|male|any]
// Além das palavras, confere a narradora (sexo da voz, pergunta neutra ao Gemini): tomada com outra
// voz reprova e, com --fix, é regravada (com a mesma --voice, se passada). Erro da API sai com código 2
// (QA indisponível), sem reprovar nem regravar.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const name = arg('script', '');
const fix = process.argv.includes('--fix');
const tries = Number(arg('tries', '4'));
const only = arg('only', '').split(',').filter(Boolean);
const dir = arg('dir', '');
const lang = arg('lang', 'pt');
const voDir = dir ? path.join(root, 'public', dir) : path.join(root, 'public', name ? `vo-${name}` : 'vo');
const scriptFile = dir ? path.join(voDir, 'spec.json') : path.join(root, 'src', name ? `script.${name}.json` : 'script.json');
const { lines } = JSON.parse(fs.readFileSync(scriptFile, 'utf8'));
const key = process.env.GEMINI_API_KEY;

// "5" e "cinco" contam como a mesma palavra (o transcritor escreve algarismo); as dezenas também
// ("de trinta a sessenta minutos" do card do pré-treino: o transcritor escreve "30 a 60")
const NUM = { um: '1', uma: '1', dois: '2', duas: '2', tres: '3', quatro: '4', cinco: '5', seis: '6', sete: '7', oito: '8', nove: '9', dez: '10', vinte: '20', trinta: '30', quarenta: '40', cinquenta: '50', sessenta: '60', setenta: '70', oitenta: '80', noventa: '90', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10', twenty: '20', thirty: '30', forty: '40', fifty: '50', sixty: '60', seventy: '70', eighty: '80', ninety: '90' };
const norm = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9% ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => NUM[w] ?? SAME[w] ?? w);
// "pra"/"para", "faxina"/"faxinas": compara sem a variação que o transcritor introduz
const SAME = { pra: 'para', pro: 'para', pros: 'para', pras: 'para' };
const stem = (w) => (SAME[w] ?? w).replace(/(s|es)$/, '');
const sim = (a, b) => {
  const x = norm(a), y = norm(b);
  const d = Array.from({ length: x.length + 1 }, (_, i) => [i, ...Array(y.length).fill(0)]);
  for (let j = 1; j <= y.length; j++) d[0][j] = j;
  for (let i = 1; i <= x.length; i++)
    for (let j = 1; j <= y.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
  return 1 - d[x.length][y.length] / Math.max(x.length, y.length, 1);
};

/** Erro da API (não da voz): o QA não tem como julgar, então não reprova nem regrava. Sai com código 2. */
class QaUnavailable extends Error {}

/** Uma pergunta ao Gemini sobre o áudio, com 3 tentativas (1 s, 3 s) pra erro de rede/limite/5xx. */
async function ask(file, text) {
  let last = '';
  for (const wait of [0, 1000, 3000]) {
    if (wait) await new Promise((r) => setTimeout(r, wait));
    try {
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({ contents: [{ parts: [
          { inlineData: { mimeType: /\.mp3$/i.test(file) ? 'audio/mp3' : 'audio/wav', data: fs.readFileSync(file).toString('base64') } },
          { text },
        ] }] }),
      });
      const j = await res.json().catch(() => null);
      const out = j?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('');
      if (res.ok && !j?.error && typeof out === 'string') return out.trim();
      last = `HTTP ${res.status}${j?.error?.message ? ` ${j.error.message.slice(0, 120)}` : ''}`;
    } catch (e) {
      last = String(e?.message ?? e).slice(0, 120);
    }
  }
  throw new QaUnavailable(last);
}

const transcribe = (file) =>
  ask(
    file,
    lang === 'en'
      ? 'Transcribe this English audio exactly as spoken, word for word, without correcting or commenting. Numbers as digits. Reply with the transcription only.'
      : 'Transcreva este áudio em português do Brasil exatamente como foi falado, palavra por palavra, sem corrigir nem comentar. ' +
          'Nomes próprios prováveis: Perceva (app), Recanto, Explorar, Aprender. Números em algarismos. Responda só com a transcrição.',
  );

// A narradora também é conferida, não só as palavras: na porta de Recompensas (r3, 2026-11-06) uma
// tomada da Kore saiu com outra voz, grave e masculina, e passou no QA de texto com 100%. Pergunta
// neutra (sem sugerir resposta), SEMPRE 3 vezes, e passa com 2 que batem com o esperado: aceitar no
// primeiro "female" deixava uma tomada masculina passar com um único engano do classificador.
// Kore e Aoede (as vozes do projeto) são femininas: --sex male|female|any muda o esperado.
const expectSex = arg('sex', 'female');
const askSex = async (file) =>
  /sex\s*=\s*(male|female|ambiguous)/i.exec(
    await ask(file, 'Listen to the speaker. Answer in ONE line exactly: "sex=<male|female|ambiguous>; confidence=<0-100>". Nothing else.'),
  )?.[1]?.toLowerCase() ?? 'ambiguous';
async function narratorOk(file) {
  if (expectSex === 'any') return { ok: true, heard: 'any' };
  const votes = [await askSex(file), await askSex(file), await askSex(file)];
  return { ok: votes.filter((x) => x === expectSex).length >= 2, heard: votes.join('/') };
}

let failed = 0;
try {
for (const line of lines) {
  if (only.length && !only.includes(line.id)) continue;
  const file = path.join(voDir, `${line.id}.mp3`);
  for (let t = 1; t <= tries; t++) {
    const heard = await transcribe(file);
    const score = Math.max(sim(heard, line.caption.replace(/\*/g, '')), line.say ? sim(heard, line.say) : 0);
    // Semelhança alta não basta: "a diferença provável" ouvido como "a diferença pro app"
    // passou com 89%. Toda palavra de conteúdo (5+ letras) e todo número do roteiro tem que estar
    // na fala ("in two mornings" ouvido como "into mornings" passou com 88%).
    const heardSet = new Set(norm(heard).map(stem));
    const missing = [...new Set(norm(line.say ?? line.caption.replace(/\*/g, '')).filter((w) => w.length >= 5 || /^\d+$/.test(w)))].filter(
      (w) => !heardSet.has(stem(w)),
    );
    const words = score >= 0.86 && missing.length === 0;
    const voice = words ? await narratorOk(file) : { ok: true, heard: '' };
    const ok = words && voice.ok;
    console.log(
      `${ok ? 'OK  ' : 'FALHA'} ${line.id.padEnd(9)} ${(score * 100).toFixed(0)}%${missing.length ? ` faltou: ${missing.join(', ')}` : ''}` +
        `${voice.ok ? '' : ` · OUTRA VOZ (ouvida: ${voice.heard}; esperada: ${expectSex})`}  "${heard}"`,
    );
    if (ok) break;
    if (!fix || t === tries) { failed++; break; }
    // regrava com a MESMA voz da gravação (--voice): sem isso o tts-gemini caía no padrão (Kore);
    // --tts eleven regrava pela ElevenLabs (tts-eleven.mjs, mesmo contrato), com o mesmo --model
    const voiceArg = arg('voice');
    const modelArg = arg('model');
    const ttsScript = arg('tts') === 'eleven' ? 'tts-eleven.mjs' : 'tts-gemini.mjs';
    execFileSync('node', [path.join(root, 'scripts', ttsScript), ...(dir ? ['--dir', dir, '--lang', lang] : name ? ['--script', name] : []), ...(voiceArg ? ['--voice', voiceArg] : []), ...(modelArg ? ['--model', modelArg] : []), '--only', line.id], { stdio: 'ignore' });
  }
}
} catch (e) {
  if (!(e instanceof QaUnavailable)) throw e;
  console.error(`✗ QA indisponível (API do Gemini: ${e.message}) — nada foi reprovado nem regravado; rode de novo daqui a pouco`);
  process.exit(2);
}
process.exitCode = failed ? 1 : 0;
