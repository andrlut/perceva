// Confere a pronúncia do nome da marca e a entonação de falas específicas.
//   node scripts/check-pronunciation.mjs public/vo/three.wav public/vo/close.wav
import fs from 'node:fs';
const key = process.env.GEMINI_API_KEY;
for (const f of process.argv.slice(2)) {
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ contents: [{ parts: [
      { inlineData: { mimeType: 'audio/wav', data: fs.readFileSync(f).toString('base64') } },
      { text: 'Este áudio cita o nome de um app brasileiro chamado "Perceva" (pronúncia esperada: per-SÊ-va, com "v"), se citar. ' +
        '1) Transcreva. 2) Se o nome aparece, escreva foneticamente como ele foi dito e diga se soa como "Perceva", "Perceba", "Perseu" ou outra coisa. ' +
        '3) Alguma frase afirmativa soou como pergunta? Responda curto, em português. ' +
        'Termine com uma linha exatamente assim: "VEREDITO: OK" se o nome (quando citado) soa como Perceva e nada soou como pergunta indevida; senão "VEREDITO: ERRO".' },
    ] }] }),
  });
  const j = await res.json();
  const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
  console.log(`== ${f}\n${text}\n`);
  // sai com erro se qualquer arquivo não passou — dá pra usar em loop de regravação
  if (!/VEREDITO:\s*OK/.test(text)) process.exitCode = 1;
}
