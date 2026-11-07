#!/usr/bin/env node
// Efeitos sonoros do molde, SINTETIZADOS no ffmpeg (sem biblioteca de terceiros, sem licença a
// conferir) → public/sfx/*.wav. Determinístico: rodar de novo dá o mesmo arquivo.
//   node scripts/sfx.mjs
// Pesquisa (2026-11-07): whoosh em movimento de câmera e passagem, pop nas peças que pousam,
// sininho na virada pro feliz (o hexágono acende), subida curta antes do verso; tudo ~−18 a −24 dB
// abaixo da voz. Quem toca é o Molde com `sfx` (src/molde/sfx.tsx).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public', 'sfx');
fs.mkdirSync(out, { recursive: true });

const SOUNDS = {
  // ar passando: ruído rosa + marrom, banda média, sobe devagar e cai mais devagar ainda (sem corte)
  whoosh: ['-f', 'lavfi', '-i', 'anoisesrc=d=0.62:c=pink:r=48000:a=0.8:s=7', '-f', 'lavfi', '-i', 'anoisesrc=d=0.62:c=brown:r=48000:a=0.9:s=9', '-filter_complex', '[0][1]amix=inputs=2:normalize=0,highpass=f=180,lowpass=f=2200,afade=t=in:st=0:d=0.26:curve=hsin,afade=t=out:st=0.26:d=0.36:curve=hsin[a]', '-map', '[a]'],
  // o soco de câmera: mais curto e mais grave
  punch: ['-f', 'lavfi', '-i', 'anoisesrc=d=0.36:c=brown:r=48000:a=0.8:s=11', '-f', 'lavfi', '-i', "aevalsrc='0.55*sin(2*PI*(110*t-90*t*t))*exp(-11*t)*min(1,t*200)':d=0.36:s=48000", '-filter_complex', '[0]highpass=f=90,lowpass=f=900,afade=t=in:st=0:d=0.06:curve=qsin,afade=t=out:st=0.08:d=0.28:curve=hsin[n];[n][1]amix=inputs=2:normalize=0[a]', '-map', '[a]'],
  // peça pousando: "bloop" curto, de agudo pra médio (1400 → 600 Hz em 80 ms)
  pop: ['-f', 'lavfi', '-i', "aevalsrc='0.7*sin(2*PI*(1400*t-5000*t*t))*exp(-38*t)*min(1,t*400)':d=0.1:s=48000"],
  // o hexágono acendendo: sino de três parciais com um leve batimento (brilho, não clique)
  chime: ['-f', 'lavfi', '-i', "aevalsrc='0.22*(sin(2*PI*1568*t)+0.7*sin(2*PI*1572*t)+0.55*sin(2*PI*2093*t)+0.3*sin(2*PI*3136*t))*exp(-3*t)*min(1,t*300)':d=1.2:s=48000"],
  // antes do verso: ar subindo (ruído filtrado que cresce), sem tom de apito
  riser: ['-f', 'lavfi', '-i', 'anoisesrc=d=1.2:c=pink:r=48000:a=0.7:s=5', '-af', 'highpass=f=400,lowpass=f=5000,afade=t=in:st=0:d=1.05:curve=tri,afade=t=out:st=1.05:d=0.15:curve=hsin'],
};

for (const [name, args] of Object.entries(SOUNDS)) {
  const f = path.join(out, `${name}.wav`);
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args, '-ac', '2', '-ar', '48000', f]);
  console.log(`✓ public/sfx/${name}.wav`);
}
