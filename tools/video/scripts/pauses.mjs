// Voz medida (requinte, fase 2): onde cada fala começa e termina no mp3 e as pausas do meio
// (ffmpeg silencedetect a −36 dB, ≥ 0,12 s) → <dir>/pauses.json, que o Molde lê (src/molde/Molde.tsx)
// pra ancorar as deixas nas pausas reais (src/timeline.ts). Usado pelo molde.mjs (voice, stills,
// render) e pelo tour.mjs (render da porta, que monta a abertura). Grátis e local.
//
// Cada entrada guarda `dur` (a duração do mp3 medido): se a fala for regravada e ninguém medir de
// novo, o Molde vê que a duração não bate com o timings.json e volta pra estimativa em vez de usar
// as pausas da tomada velha.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

export function measurePauses(dir) {
  const specFile = path.join(dir, 'spec.json');
  if (!fs.existsSync(specFile)) return;
  const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
  if (spec.silent) return;
  const out = {};
  for (const l of spec.lines) {
    const mp3 = path.join(dir, `${l.id}.mp3`);
    if (!fs.existsSync(mp3)) continue;
    const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp3]).toString());
    const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', mp3, '-af', 'silencedetect=noise=-36dB:d=0.12', '-f', 'null', '-'], { encoding: 'utf8' });
    const sil = [];
    let open = null;
    for (const line of (r.stderr ?? '').split(/\r?\n/)) {
      const a = /silence_start: (-?[\d.]+)/.exec(line);
      if (a) open = Math.max(0, Number(a[1]));
      const b = /silence_end: ([\d.]+)/.exec(line);
      if (b && open != null) {
        sil.push([open, Number(b[1])]);
        open = null;
      }
    }
    if (open != null) sil.push([open, dur]);
    let start = 0;
    let end = dur;
    if (sil.length && sil[0][0] <= 0.05) start = sil.shift()[1];
    if (sil.length && sil[sil.length - 1][1] >= dur - 0.05) end = sil.pop()[0];
    const r3 = (x) => Math.round(x * 1000) / 1000;
    out[l.id] = { dur: r3(dur), start: r3(start), end: r3(end), pauses: sil.map(([a, b]) => [r3(a), r3(b)]) };
  }
  fs.writeFileSync(path.join(dir, 'pauses.json'), JSON.stringify(out, null, 2));
}
