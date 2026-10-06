// QA da narração: transcreve um WAV com o Gemini (texto) para conferir que a
// voz leu exatamente o roteiro — nem a direção de voz, nem palavra a mais.
//   node scripts/transcribe.mjs out/voices/Kore.wav [mais.wav ...]
import fs from 'node:fs';
const key = process.env.GEMINI_API_KEY;
for (const file of process.argv.slice(2)) {
  const data = fs.readFileSync(file).toString('base64');
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ parts: [
        { inlineData: { mimeType: 'audio/wav', data } },
        { text: 'Transcreva este áudio em português, palavra por palavra, sem comentar. Depois, numa linha separada começando com "TOM:", descreva em até 12 palavras o tom e o sotaque da voz.' },
      ] }],
    }),
  });
  const json = await res.json();
  console.log(`== ${file}\n${json.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? JSON.stringify(json).slice(0, 300)}\n`);
}
