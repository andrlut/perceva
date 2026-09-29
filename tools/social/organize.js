// Organiza um lote gerado em blocos por idioma/rede, com numeração = dia da
// semana (01-seg … 05-sex). Regra de calendário (EDITORIAL v4):
//   carrosséis → dias 1..3 (seg, ter, qua) na ordem do batch
//   reels      → dias 4..5 (qui, sex) na mesma ordem — espaçamento automático
//
// Uso: node organize.js <loteDir>
// Requer <loteDir>/batch.json (a rotina agora o mantém no lote) com, por post:
//   slug, lang ("en" opcional), video (true opcional).
// Saída: <loteDir>/{pt,en}/{instagram,tiktok,youtube}/NN-dia-slug/…
// As pastas originais por slug são removidas após a cópia.
const fs = require('fs');
const path = require('path');

const DIA = { 1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex' };

const lote = process.argv[2];
if (!lote) { console.error('uso: node organize.js <loteDir>'); process.exit(1); }
const batch = JSON.parse(fs.readFileSync(path.join(lote, 'batch.json'), 'utf8').replace(/^﻿/, ''));

const copyDir = (from, to) => {
  fs.mkdirSync(to, { recursive: true });
  for (const f of fs.readdirSync(from)) fs.copyFileSync(path.join(from, f), path.join(to, f));
};
const copyFile = (from, toDir, name) => {
  fs.mkdirSync(toDir, { recursive: true });
  fs.copyFileSync(from, path.join(toDir, name));
};

for (const lang of ['pt', 'en']) {
  const posts = batch.filter((p) => (p.lang === 'en' ? 'en' : 'pt') === lang);
  if (!posts.length) continue;
  const base = path.join(lote, lang);

  posts.forEach((p, i) => {
    const day = i + 1; // carrosséis: seg, ter, qua…
    if (day > 3) console.warn(`AVISO: mais de 3 carrosséis em ${lang} — ${p.slug} caiu em dia ${day}`);
    const src = path.join(lote, p.slug);
    const slides = fs.readdirSync(src).filter((f) => f.startsWith('slide-'));
    const dirName = `${String(day).padStart(2, '0')}-${DIA[day]}-${p.slug}`;
    for (const rede of ['instagram', 'tiktok']) {
      const dest = path.join(base, rede, dirName);
      fs.mkdirSync(dest, { recursive: true });
      for (const f of slides) fs.copyFileSync(path.join(src, f), path.join(dest, f));
    }
  });

  posts.filter((p) => p.video).forEach((p, i) => {
    const day = 4 + i; // reels: qui, sex
    if (day > 5) { console.warn(`AVISO: mais de 2 reels em ${lang} — ${p.slug} ficou sem dia`); return; }
    const reel = path.join(lote, p.slug, 'reel.mp4');
    if (!fs.existsSync(reel)) { console.warn(`AVISO: ${p.slug} marcado video:true sem reel.mp4`); return; }
    const dirName = `${String(day).padStart(2, '0')}-${DIA[day]}-reel-${p.slug}`;
    for (const rede of ['instagram', 'tiktok', 'youtube'])
      copyFile(reel, path.join(base, rede, dirName), 'reel.mp4');
  });
}

// Remove as pastas originais por slug (o conteúdo agora vive nos blocos por rede).
for (const p of batch) fs.rmSync(path.join(lote, p.slug), { recursive: true, force: true });
console.log('organizado:', lote);
