// Ranqueia amostras de voz com o Gemini ouvindo todas lado a lado — triagem,
// não veredito: a escolha final é de quem vai assinar o vídeo.
//   node scripts/judge-voices.mjs out/voices/*.wav
import fs from 'node:fs';
import path from 'node:path';
const key = process.env.GEMINI_API_KEY;
const files = process.argv.slice(2);
const parts = [];
files.forEach((f, i) => {
  parts.push({ text: `Amostra ${i + 1}: voz "${path.basename(f, '.wav')}"` });
  parts.push({ inlineData: { mimeType: 'audio/wav', data: fs.readFileSync(f).toString('base64') } });
});
parts.push({
  text:
    'Você é diretor de elenco de locução para um vídeo de marca no Instagram brasileiro (público: mulheres e homens de 25 a 40 anos, ' +
    'que já fizeram terapia ou teste de personalidade). Todas as amostras leem o MESMO texto. Avalie cada uma de 1 a 10 em: ' +
    'naturalidade (soa humana, sem artefato robótico), sotaque brasileiro natural (sem sotaque de Portugal nem de estrangeiro), ' +
    'pronúncia correta das palavras, ritmo (nem arrastado nem corrido), calor/confiança (próxima, sem tom de propaganda). ' +
    'Aponte qualquer erro de pronúncia ou palavra trocada. Termine com um ranking das 3 melhores para este uso e o porquê, em português.',
});
const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
  body: JSON.stringify({ contents: [{ parts }] }),
});
const json = await res.json();
console.log(json.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? JSON.stringify(json).slice(0, 500));
