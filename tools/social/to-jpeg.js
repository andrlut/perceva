// Converte os slide-*.png de um lote em .jpg ao lado do original.
//
// Por quê: o TikTok rejeita PNG em post de foto ("The 'image/png' type is not
// allowed, use 'image/jpeg' or 'image/webp'") — descoberto no agendamento de
// 19/10 via Metricool, quando os dois posts de foto da semana falharam. O
// Instagram aceita PNG, então o PNG continua sendo a saída canônica do
// carousel.js; o .jpg é a cópia que vai pro TikTok (e serve pra qualquer rede
// que torça o nariz pra PNG).
//
// Uso: node to-jpeg.js <pasta do lote>   (percorre pt/ e en/ inteiros)
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = process.argv[2];
if (!root || !fs.existsSync(root)) {
  console.error('uso: node to-jpeg.js <pasta do lote>');
  process.exit(1);
}

const queue = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/^slide-.*\.png$/i.test(e.name)) queue.push(p);
  }
})(root);

(async () => {
  for (const p of queue) {
    const out = p.replace(/\.png$/i, '.jpg');
    // flatten: os PNGs já saem sem alpha (exigência da App Store), mas
    // garante fundo noite caso algum slide antigo tenha canal alpha.
    await sharp(p)
      .flatten({ background: '#0A0E26' })
      .jpeg({ quality: 92, chromaSubsampling: '4:4:4', mozjpeg: true })
      .toFile(out);
    console.log(path.relative(root, out));
  }
  console.log(`${queue.length} jpg gerados`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
