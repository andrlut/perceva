#!/usr/bin/env node
// Medidor de ritmo: põe em número o MOVIMENTO de um vídeo já renderizado. O defeito que ninguém
// consegue nomear assistindo ("está morno", "falta requinte") quase sempre é o filme andar no mesmo
// volume o tempo todo; aqui isso vira amplitude, quase-parada, picos, buracos e piscadas.
//   node scripts/ritmo.mjs out/molde/<job>/video.mp4
//   node scripts/ritmo.mjs NOSSO.mp4 --contra REFERENCIA.mp4      # teste de aceite (sai 1 se reprovar)
//   node scripts/ritmo.mjs NOSSO.mp4 --alvo movimento-alvo.json    # metas sem ter o vídeo de referência
//   node scripts/ritmo.mjs NOSSO.mp4 [--json saida.json] [--folha folha.jpg] [--max-gap 1] [--min-hold 0.3]
//                                     [--end-hold 0] [--escala 108x192] [--sem-perfil]
//
// Parte 1 — energia (perícia de movimento). Diferença média de luma entre quadros vizinhos, num
// quadro pequeno (192×108; 108×192 se o vídeo for vertical — mesma conta de pixels, sem achatar o
// movimento vertical). Pequeno de propósito: mede MOVIMENTO, não detalhe, e some com o chiado da
// compressão. Agrupa em baldes de 0,5 s e tira:
//   · mediana e pico do perfil, e AMPLITUDE = pico ÷ mediana — o número que mais separa motion
//     premium de morno: o bom alterna rajada e silêncio, o morno nunca bate;
//   · quase-parada = baldes abaixo de 10% do pico (a respiração); picos = acima de 60% (os socos);
//   · cortes duros = scene score > 0,18 (crossfade não aparece aqui — e isso também é informação);
//   · nossos acréscimos: "sem respiro" = trechos de 4 s ou mais sem nenhum balde em quase-parada
//     (diz ONDE o filme está morno, não só que está); "soco solitário" = o maior balde é 1,5x ou mais
//     o segundo (a mais de 1 s dele) — aí amplitude e quase-parada passam por causa de UM soco e o
//     resto do filme some abaixo da linha de pico (foi o caso do Hexa v4: o chicote dos 4 s).
// Parte 2 — ritmo, olhando os pixels:
//   · buraco morto: nada muda por mais de --max-gap s. "Mudar" = um passo de 0,1 s (10 q/s, 240 px
//     de largura) em que mais de 0,4% dos pixels se mexem mais de 14 níveis. Rótulo pequeno
//     deslizando ou fade lento de cor podem não contar — o que conta é coisa grande se mexendo;
//   · piscada: plano mais curto que --min-hold s entre dois cortes secos (30 q/s, 160 px, >35% dos
//     pixels mexendo >30 níveis), ou algo que entra e sai de novo em menos de --min-hold s.
//     Tremulação mais rápida que ~3 vezes por segundo conta como piscada.
// Sai 1 se o ritmo falhar ou o teste de aceite (--contra / --alvo) reprovar; 2 se ffmpeg/ffprobe falhar.
// Sem --contra/--alvo a energia é só informativa (ela vira a REFERÊNCIA e imprime as metas dela).
//
// Algoritmos reescritos em Node a partir de scripts/pericia-movimento.py, scripts/ritmo.py e
// scripts/_midia.py da skill "claude-video" — Copyright (c) 2026 Felipe Borges (claude-video) e
// Copyright (c) 2026 Claude Video Studio contributors, licença MIT. Só ffmpeg/ffprobe no PATH
// (o mesmo que sfx.mjs já usa); nenhuma dependência nova.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const flag = (n) => argv.includes(`--${n}`);
const COM_VALOR = new Set(['contra', 'alvo', 'json', 'folha', 'max-gap', 'min-hold', 'end-hold', 'escala']);
const posicionais = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--') && COM_VALOR.has(argv[i - 1].slice(2))));
const video = posicionais[0];
if (!video || flag('help')) {
  console.log('uso: node scripts/ritmo.mjs <video.mp4> [--contra REF.mp4 | --alvo alvo.json] [--json saida.json] [--folha folha.jpg]');
  console.log('     [--max-gap 1.0] [--min-hold 0.3] [--end-hold 0] [--escala LxA] [--sem-perfil]');
  process.exit(video ? 0 : 2);
}
const MAX_GAP = Number(arg('max-gap', '1.0'));
const MIN_HOLD = Number(arg('min-hold', '0.3'));
const END_HOLD = Number(arg('end-hold', '0'));
const BALDE = 0.5; // segundos por balde do perfil de energia
const r2 = (x) => Math.round(x * 100) / 100;

// ── ffmpeg ────────────────────────────────────────────────────────────────────────────────────────
const roda = (bin, args) => {
  const r = spawnSync(bin, args, { maxBuffer: 1.5e9 });
  if (r.error) { console.error(`erro: não consegui rodar '${bin}' (${r.error.code ?? r.error.message}). Está no PATH?`); process.exit(2); }
  if (r.status !== 0) { console.error(`erro: ${bin} saiu com ${r.status}\n${r.stderr.toString().slice(-800)}`); process.exit(2); }
  return r.stdout;
};

const sonda = (v) => {
  const d = JSON.parse(roda('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate:format=duration', '-of', 'json', v]).toString());
  const s = d.streams[0];
  const [num, den] = (s.r_frame_rate ?? '30/1').split('/').map(Number);
  return { dur: Number(d.format?.duration ?? 0), fps: Math.round((num / (den || 1)) * 1000) / 1000, w: s.width, h: s.height };
};

/** Energia por quadro: [[t, diferença média de luma], ...] (tblend=difference + signalstats). */
const energia = (v, escala) => {
  const txt = roda('ffmpeg', ['-v', 'error', '-i', v, '-vf', `scale=${escala},tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-`, '-f', 'null', '-']).toString();
  return [...txt.matchAll(/pts_time:([\d.]+)[\s\S]*?YAVG=([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
};

/** Cortes duros (scene > limiar). Um corte acende vários quadros: agrupa os vizinhos (< 0,25 s). */
const cortesDuros = (v, limiar = 0.18) => {
  const txt = roda('ffmpeg', ['-v', 'error', '-i', v, '-filter:v', `select='gt(scene,${limiar})',metadata=print:file=-`, '-f', 'null', '-']).toString();
  const out = [];
  for (const m of txt.matchAll(/pts_time:([\d.]+)/g)) {
    const t = Number(m[1]);
    if (!out.length || t - out[out.length - 1] > 0.25) out.push(t);
  }
  return out;
};

/** Quadros em tons de cinza (1 byte por pixel), amostrados a `fps` com `largura` px. */
const cinza = (v, info, fps, largura) => {
  const h = Math.round((largura * info.h) / info.w / 2) * 2;
  const raw = roda('ffmpeg', ['-v', 'error', '-i', v, '-vf', `fps=${fps},scale=${largura}:${h},format=gray`, '-f', 'rawvideo', '-']);
  const n = largura * h;
  const quadros = [];
  for (let i = 0; i + n <= raw.length; i += n) quadros.push(raw.subarray(i, i + n));
  return quadros;
};

/** Fração dos pixels que mudaram mais de `limiar` níveis entre dois quadros. */
const mexeu = (a, b, limiar = 14) => {
  let m = 0;
  for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; if (d > limiar || d < -limiar) m++; }
  return m / (a.length || 1);
};

// ── parte 1: energia ──────────────────────────────────────────────────────────────────────────────
const medir = (v) => {
  if (!fs.existsSync(v)) { console.error(`erro: não achei ${v}`); process.exit(2); }
  const info = sonda(v);
  const escala = arg('escala', '') || (info.h > info.w ? '108:192' : '192:108');
  const baldes = new Map();
  for (const [t, y] of energia(v, escala.replace('x', ':'))) {
    const k = Math.round(t / BALDE) * BALDE;
    if (!baldes.has(k)) baldes.set(k, []);
    baldes.get(k).push(y);
  }
  const perfil = [...baldes.entries()].sort((a, b) => a[0] - b[0]).map(([k, ys]) => [k, ys.reduce((s, y) => s + y, 0) / ys.length]);
  if (!perfil.length) { console.error(`erro: não consegui medir energia de ${v}`); process.exit(2); }
  const vals = perfil.map((p) => p[1]).sort((a, b) => a - b);
  const mediana = vals[Math.floor(vals.length / 2)];
  const pico = vals[vals.length - 1];
  const teto = Math.max(pico, 1e-6);
  const vales = perfil.filter(([, y]) => y < teto * 0.1).map(([k]) => k);
  const picos = perfil.filter(([, y]) => y > teto * 0.6).map(([k]) => k);
  // nosso acréscimo: o segundo soco (maior balde a mais de 1 s do pico). Se o pico é muito maior que
  // ele, um soco só achata o resto: amplitude e quase-parada passam, mas os picos somem.
  const tPico = perfil.find(([, y]) => y === pico)[0];
  const pico2 = Math.max(0, ...perfil.filter(([k]) => Math.abs(k - tPico) > 1).map(([, y]) => y));
  const cortes = cortesDuros(v);
  // sem respiro: corridas de baldes seguidos sem quase-parada, de 4 s pra cima
  const semRespiro = [];
  let ini = null;
  perfil.forEach(([k, y], i) => {
    const parado = y < teto * 0.1;
    if (!parado && ini == null) ini = k;
    const fim = i === perfil.length - 1;
    if ((parado || fim) && ini != null) {
      const ate = parado ? perfil[i - 1][0] : k;
      if (ate - ini + BALDE >= 4) semRespiro.push([ini, ate + BALDE]);
      ini = null;
    }
  });
  const dez = info.dur / 10 || 1;
  return {
    arquivo: v, duracao: info.dur, fps: info.fps, resolucao: `${info.w}x${info.h}`, escala,
    cortes_duros: cortes.map(r2),
    perfil: Object.fromEntries(perfil.map(([k, y]) => [k.toFixed(1), Math.round(y * 1000) / 1000])),
    mediana, pico, t_pico: tPico, pico2,
    amplitude: mediana ? pico / mediana : 0,
    vales, picos,
    fracao_parada: vales.length / perfil.length,
    picos_por_10s: picos.length / dez,
    cortes_por_10s: cortes.length / dez,
    sem_respiro: semRespiro,
    _info: info,
  };
};

// ── parte 2: ritmo ────────────────────────────────────────────────────────────────────────────────
const ritmo = (v, info) => {
  const dur = info.dur;
  // buracos mortos, a 10 passos por segundo
  const f10 = cinza(v, info, 10, 240);
  const eventos = [];
  for (let i = 1; i < f10.length; i++) if (mexeu(f10[i - 1], f10[i]) > 0.004) eventos.push(r2(i / 10));
  const pts = [0, ...eventos, r2(dur)];
  const vaos = [];
  for (let i = 0; i < pts.length - 1; i++) vaos.push([pts[i], pts[i + 1], r2(pts[i + 1] - pts[i])]);
  let mortos = vaos.filter((g) => g[2] > MAX_GAP + 0.05);
  if (END_HOLD) mortos = mortos.filter((g) => !(g[1] >= dur - 0.05 && g[2] <= END_HOLD + 0.05));

  // piscadas e planos curtos, a 30 passos por segundo
  const f30 = cinza(v, info, 30, 160);
  // quadros olhados pra cada lado; arredonda como o round do Python (4,5 → 4)
  const k = Math.max(1, Math.round((MIN_HOLD / 2) * 30 - 1e-9));
  const cortes = [];
  for (let i = 1; i < f30.length; i++) if (mexeu(f30[i - 1], f30[i], 30) > 0.35) cortes.push(i / 30);
  const flashes = [];
  for (let i = k; i < f30.length - k; i += 2) {
    const ac = mexeu(f30[i - k], f30[i], 30);
    const ab = mexeu(f30[i - k], f30[i + k], 30);
    if (ac > 0.01 && ab < 0.25 * ac) flashes.push(r2(i / 30));
  }
  const planos = [0, ...cortes, dur];
  const curtos = [];
  for (let i = 0; i < planos.length - 1; i++) if (planos[i + 1] - planos[i] < MIN_HOLD - 0.01) curtos.push([r2(planos[i]), r2(planos[i + 1])]);
  const piscadas = [];
  for (const t of flashes) {
    const u = piscadas[piscadas.length - 1];
    if (u && t - u[1] <= 0.1) u[1] = t;
    else piscadas.push([t, t]);
  }
  return {
    passos_com_mudanca: eventos.length,
    maior_buraco_s: Math.max(...vaos.map((g) => g[2])),
    buracos_mortos: mortos,
    cortes_secos: cortes.map(r2),
    planos_curtos: curtos,
    piscadas,
    passou: !mortos.length && !curtos.length && !piscadas.length,
  };
};

// ── metas e aceite ────────────────────────────────────────────────────────────────────────────────
/**
 * Metas derivadas de uma medida de referência (as mesmas contas da perícia original). Picos viram
 * "por 10 s" porque a referência raramente tem a nossa duração (as delas têm 5–30 s, as nossas ~50 s):
 * contar picos absolutos premiaria vídeo comprido.
 */
const metasDe = (ref) => ({
  amplitude_min: Math.round(ref.amplitude * 0.7 * 10) / 10,
  // piso de 25%, mas nunca acima do que a própria referência faz (referência rápida fica abaixo)
  fracao_parada_min: r2(Math.max(Math.min(0.25, ref.fracao_parada * 0.9), ref.fracao_parada - 0.1)),
  picos_por_10s_min: r2(Math.max(0, (ref.picos_por_10s ?? (ref.picos?.length ?? 0) / ((ref.duracao || 10) / 10)) * 0.7)),
  cortes_duros_ref: ref.cortes_duros?.length ?? null,
});

/** --alvo aceita um alvo pronto (amplitude_min…, como movimento-alvo.json) ou uma medida (amplitude, fracao_parada, picos…). */
const lerAlvo = (f) => {
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (j.amplitude_min != null) return { amplitude_min: j.amplitude_min, fracao_parada_min: j.fracao_parada_min ?? 0, picos_por_10s_min: j.picos_por_10s_min ?? 0, cortes_duros_ref: null };
  return metasDe(j);
};

const aceite = (nosso, mt, ref) => {
  const linhas = [
    ['amplitude', `${nosso.amplitude.toFixed(1)}x`, ref ? `${ref.amplitude.toFixed(1)}x` : '—', `>= ${mt.amplitude_min.toFixed(1)}x`, nosso.amplitude >= mt.amplitude_min],
    ['quase-parada', `${Math.round(nosso.fracao_parada * 100)}%`, ref ? `${Math.round(ref.fracao_parada * 100)}%` : '—', `>= ${Math.round(mt.fracao_parada_min * 100)}%`, nosso.fracao_parada >= mt.fracao_parada_min],
    ['picos/10s', nosso.picos_por_10s.toFixed(2), ref ? ref.picos_por_10s.toFixed(2) : '—', `>= ${mt.picos_por_10s_min.toFixed(2)}`, nosso.picos.length >= 1 && nosso.picos_por_10s >= mt.picos_por_10s_min],
  ];
  console.log(`\n${'='.repeat(68)}\n  TESTE DE ACEITE\n${'='.repeat(68)}`);
  console.log(`\n  ${'' .padEnd(14)} ${'nosso'.padEnd(10)} ${'referência'.padEnd(12)} ${'meta'.padEnd(12)}`);
  for (const [n, a, b, m, ok] of linhas) console.log(`  ${n.padEnd(14)} ${a.padEnd(10)} ${b.padEnd(12)} ${m.padEnd(12)} ${ok ? 'PASSA' : 'FALHA'}`);
  if (mt.cortes_duros_ref) console.log(`  (a referência tem ${mt.cortes_duros_ref} corte(s) duro(s); o nosso tem ${nosso.cortes_duros.length} — um filme só de crossfade nunca soca)`);
  const falhas = linhas.filter((l) => !l[4]).map((l) => l[0]);
  if (falhas.length) {
    console.log(`\n  REPROVADO em: ${falhas.join(', ')}`);
    if (falhas.includes('amplitude') || falhas.includes('quase-parada')) {
      // o caso da perícia original: filme morno, no mesmo volume o tempo todo
      console.log('  O filme está uniforme demais. Acelerar tudo só sobe a mediana.');
      console.log('  Eleja UM beat pra ser o soco (corte seco em vez de crossfade, entrada mais curta, objeto maior)');
      console.log('  e aprofunde as paradas dos vizinhos (tire o movimento ocioso: drift decorativo, respiração em parado).');
    } else {
      // o nosso caso: rajada e silêncio existem, mas há socos de menos (ou um só achata os outros)
      console.log('  Há silêncio de sobra e soco de menos. Suba 2–3 beats pra perto do maior (passagem mais curta,');
      console.log('  soco de câmera na deixa, peça grande atravessando) ou baixe o maior se ele for um soco solitário.');
    }
  } else console.log('\n  APROVADO — a assinatura de movimento bate com a meta.');
  return { linhas: linhas.map(([n, a, b, m, ok]) => ({ medida: n, nosso: a, referencia: b, meta: m, passa: ok })), passou: !falhas.length };
};

// ── impressão ─────────────────────────────────────────────────────────────────────────────────────
const barra = (y, teto, largura = 30) => (teto ? '#'.repeat(Math.round((y / teto) * largura)) : '');
const seg = (t) => `${t.toFixed(1)}s`;

const imprimeEnergia = (m) => {
  console.log(`\n  ${path.basename(m.arquivo)}`);
  console.log(`  ${m.duracao.toFixed(2)}s · ${m.resolucao} · ${m.fps} q/s · medido em ${m.escala}`);
  console.log(`  cortes duros: ${m.cortes_duros.length ? m.cortes_duros.map((t) => `${t.toFixed(2)}s`).join(', ') : 'nenhum (filme todo em transição suave)'}`);
  if (!flag('sem-perfil')) {
    console.log();
    const picos = new Set(m.picos), vales = new Set(m.vales);
    for (const [k, y] of Object.entries(m.perfil)) {
      const t = Number(k);
      const marca = picos.has(t) ? '  <- pico' : vales.has(t) ? '  <- parada' : '';
      console.log(`  ${k.padStart(6)}s ${y.toFixed(2).padStart(7)}  ${barra(y, m.pico).padEnd(30)}${marca}`);
    }
  }
  console.log();
  console.log(`  mediana ${m.mediana.toFixed(2)} | pico ${m.pico.toFixed(2)} | AMPLITUDE ${m.amplitude.toFixed(1)}x | em quase-parada ${Math.round(m.fracao_parada * 100)}% | picos ${m.picos.length} (${m.picos_por_10s.toFixed(2)}/10s)`);
  if (m.picos.length) console.log(`  picos em: ${m.picos.map(seg).join(' · ')}`);
  if (m.pico2 && m.pico / m.pico2 >= 1.5) console.log(`  soco solitário: o maior (${seg(m.t_pico)}) é ${(m.pico / m.pico2).toFixed(1)}x o segundo — o resto do filme fica abaixo da linha de pico`);
  if (m.sem_respiro.length) console.log(`  sem respiro (>= 4 s sem quase-parada): ${m.sem_respiro.map(([a, b]) => `${seg(a)}–${seg(b)}`).join(' · ')}`);
};

const imprimeRitmo = (r) => {
  console.log(`\n  ritmo: maior buraco ${r.maior_buraco_s} s (limite ${MAX_GAP}), ${r.passos_com_mudanca} passos com mudança, ${r.cortes_secos.length} cortes secos`);
  for (const g of r.buracos_mortos) console.log(`  FALHOU buraco morto de ${g[0]} a ${g[1]} s (${g[2]} s sem nada grande se mexendo)`);
  for (const s of r.planos_curtos) console.log(`  FALHOU plano de ${s[0]} a ${s[1]} s é mais curto que ${MIN_HOLD} s`);
  for (const p of r.piscadas) console.log(`  FALHOU algo entra e sai por volta de ${p[0]} a ${p[1]} s (na tela por menos de ${MIN_HOLD} s)`);
  console.log(`  ritmo ${r.passou ? 'PASSOU' : 'FALHOU'}`);
};

const imprimeMetas = (mt) => {
  console.log('\n  METAS QUE ESTE FILME IMPÕE, SE FOR A REFERÊNCIA');
  console.log(`  · amplitude (pico ÷ mediana) >= ${mt.amplitude_min.toFixed(1)}x`);
  console.log(`  · fração em quase-parada >= ${Math.round(mt.fracao_parada_min * 100)}%`);
  console.log(`  · picos por 10 s >= ${mt.picos_por_10s_min.toFixed(2)} (e pelo menos 1)`);
  if (mt.cortes_duros_ref != null) console.log(`  · ${mt.cortes_duros_ref} corte(s) duro(s) aqui — se ela soca, o nosso precisa socar em algum lugar`);
};

// ── principal ─────────────────────────────────────────────────────────────────────────────────────
const t0 = Date.now();
const m = medir(video);
imprimeEnergia(m);
const r = ritmo(video, m._info);
imprimeRitmo(r);

let ac = null;
let ref = null;
const contra = arg('contra', '');
const alvo = arg('alvo', '');
if (contra) {
  ref = medir(contra);
  imprimeEnergia(ref);
  const mt = metasDe(ref);
  imprimeMetas(mt);
  ac = aceite(m, mt, ref);
} else if (alvo) {
  const mt = lerAlvo(alvo);
  console.log(`\n  alvo: ${alvo}`);
  ac = aceite(m, mt, null);
} else {
  imprimeMetas(metasDe(m));
  console.log(`\n  (medido como REFERÊNCIA. Pra testar o nosso contra ele: node scripts/ritmo.mjs NOSSO.mp4 --contra ${video})`);
}

const folha = arg('folha', '');
if (folha) {
  // folha de contato: um quadro por segundo a partir de 0 s, da esquerda pra direita
  const { w, h, dur } = m._info;
  const deitado = w >= h;
  const cols = deitado ? 6 : 8;
  const linhas = Math.max(1, Math.ceil(dur / cols));
  roda('ffmpeg', ['-v', 'error', '-y', '-i', video, '-vf', `fps=1:round=down,scale=${deitado ? 320 : 180}:-2,tile=${cols}x${linhas}:padding=8:margin=8:color=white`, '-frames:v', '1', '-q:v', '4', folha]);
  console.log(`\n  folha de contato -> ${folha}`);
}

const json = arg('json', '');
if (json) {
  const limpa = ({ _info, ...x }) => x;
  fs.writeFileSync(json, JSON.stringify({ ...limpa(m), ritmo: r, ...(ref ? { referencia: limpa(ref) } : {}), ...(ac ? { aceite: ac } : {}) }, null, 2));
  console.log(`\n  JSON -> ${json}`);
}
const passou = r.passou && (!ac || ac.passou);
console.log(`\n  ${passou ? 'PASSOU' : 'FALHOU'} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
process.exit(passou ? 0 : 1);
