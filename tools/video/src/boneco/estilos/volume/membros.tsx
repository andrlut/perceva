// Volume suave — membros: braço (pele, manga, mão, relógio, o que a mão segura) e perna
// (pele, calçado, calça/short/legging). Cada membro é UM grupo de volume (a luz de recorte
// corre pela borda de fora do membro inteiro, sem riscar a junta).
import React from 'react';
import type { Juntas, Proporcao } from '../../esqueleto';
import type { Pessoa, Roupa } from '../../elenco';
import { type P, casco, clamp, dirAng, dist, elipse, esc, lerp, mixP, perp, poli, soma, sub, suave, suaviza, tubo, unit } from './geo';
import { type Mat, ajusta, material, mistura } from './cor';
import { type Kit, type Peca, Vol } from './kit';
import type { Med } from './corpo';

export type MCtx = { k: Kit; j: Juntas; prop: Proporcao; med: Med; pessoa: Pessoa; roupa: Roupa; segura?: 'halter' | 'copo'; t: number; toque?: { ponto: [number, number]; forca: number } };

const fmt = (x: number) => Math.round(x * 100) / 100;

type Manga = { ate: number; folga: number; punho?: 'rib' | 'camisa' | 'vies' | 'barra'; cor?: string };

/** a manga de cada peça de cima: até onde vai (0..1 braço, 1..2 antebraço) e quão solta */
export function mangaDe(r: Roupa): Manga | null {
  const c = r.cima;
  switch (c.tipo) {
    case 'top':
    case 'regata':
      return null;
    case 'camiseta':
      return { ate: 0.46, folga: 1.3, punho: 'barra', cor: c.cor2 };
    case 'manga-longa':
      return { ate: 1.94, folga: 0.9, punho: 'barra' };
    case 'moletom':
      return { ate: 1.9, folga: 2.1, punho: 'rib' };
    case 'camisa':
      return r.contexto === 'trabalho' ? { ate: 1.92, folga: 1.3, punho: 'camisa' } : { ate: 0.58, folga: 1.5, punho: 'barra' };
    case 'blusa':
      return { ate: 1.42, folga: 1.4, punho: 'vies', cor: c.cor2 };
    case 'blazer':
      return { ate: 1.88, folga: 1.7, punho: 'camisa', cor: c.cor2 ?? '#F4F5FF' };
    case 'pijama':
      return { ate: 1.92, folga: 2.0, punho: 'vies', cor: c.cor2 };
  }
}

// ------------------------------------------------------------------ mão

type MaoOut = { pecas: Peca[]; det: React.ReactNode[]; palma: P; eixo: P; lado: P };

function maoDe(c: MCtx, i: 0 | 1, mp: Mat, chave: string): MaoOut {
  const { k, j, prop, med } = c;
  const w = j.punho[i];
  const a = dirAng(j.ang.mao[i]);
  const L = prop.mao * 1.06;
  // o lado do polegar: pra frente (+x quando a mão pende); de frente, pra dentro do corpo
  let s: P = [a[1], -a[0]];
  if (j.vista === 'frente' && i === 1) s = esc(s, -1);
  const W2 = med.palma * 1.12;
  const loc = (u: number, v: number): P => soma(w, soma(esc(a, u * L), esc(s, v * W2)));
  const modo = j.mao[i];
  const pecas: Peca[] = [];
  const det: React.ReactNode[] = [];
  const fill = k.tubo(w, loc(1, 0), W2, mp);
  const vinco = (pts: P[], op = 0.5) => <path key={`v${det.length}`} d={suave(pts, false)} stroke={mp.fundo} strokeWidth={0.32} strokeLinecap="round" fill="none" opacity={op} />;
  const dedo = (de: [number, number], ate: [number, number], r: number) => ({ d: suave(tubo(loc(...de), loc(...ate), () => r * W2, { n: 4 })), fill });
  if (modo === 'fechada' || modo === 'segura') {
    pecas.push({ d: suave([loc(-0.05, -0.85), loc(0.3, -1.02), loc(0.58, -0.98), loc(0.7, -0.6), loc(0.72, 0.1), loc(0.66, 0.8), loc(0.4, 1.02), loc(0.08, 0.86)]), fill });
    pecas.push(dedo([0.28, 0.95], [0.5, 0.35], 0.3));
    det.push(vinco([loc(0.48, -0.85), loc(0.66, -0.75)]), vinco([loc(0.5, -0.4), loc(0.69, -0.3)]), vinco([loc(0.5, 0.05), loc(0.7, 0.12)]));
  } else if (modo === 'aponta') {
    // punho com os nós dos três dedos dobrados de um lado e o INDICADOR saindo do lado do
    // polegar (assimétrico de propósito: dedo do meio levantado no meio do punho lê como gesto)
    pecas.push({ d: suave([loc(-0.05, -0.85), loc(0.3, -1.0), loc(0.52, -0.96), loc(0.6, -0.5), loc(0.6, 0.35), loc(0.48, 0.95), loc(0.1, 0.86)]), fill });
    for (const [q, v] of [[0, -0.66], [1, -0.22], [2, 0.18]] as [number, number][]) {
      const c0 = loc(0.6 - q * 0.015, v);
      pecas.push({ d: suave(tubo(loc(0.5, v), c0, () => 0.3 * W2, { n: 3 })), fill });
    }
    const r = 0.27 * W2;
    // com toque, a polpa do dedo pousa no ponto de contato (a projeção dele no eixo da mão)
    let alcance = L;
    if (c.toque && i === 1) {
      const rel = sub(c.toque.ponto, w);
      alcance = clamp(rel[0] * a[0] + rel[1] * a[1] + r * 0.5, 0.62 * L, 1.05 * L);
    }
    const ponta = soma(soma(w, esc(a, alcance - r * 0.9)), esc(s, 0.18 * W2));
    pecas.push({ d: suave(tubo(loc(0.4, 0.6), ponta, (t) => lerp(0.36, 0.28, t) * W2, { n: 5 })), fill });
    // o polegar aberto pro lado (a mão lê como "apontar", em L)
    pecas.push(dedo([0.2, 0.85], [0.5, 1.45], 0.3));
    det.push(vinco([loc(0.56, -0.44), loc(0.62, -0.44)], 0.6), vinco([loc(0.56, -0.0), loc(0.62, -0.02)], 0.6));
    // unha (um brilho na ponta)
    const un = soma(soma(w, esc(a, alcance - r * 1.6)), esc(s, 0.18 * W2));
    det.push(<circle key="unha" cx={un[0]} cy={un[1]} r={r * 0.45} fill="#FFFFFF" opacity={0.25} />);
  } else if (modo === 'aberta') {
    pecas.push({ d: suave([loc(-0.05, -0.85), loc(0.3, -1.0), loc(0.56, -0.95), loc(0.6, 0), loc(0.56, 0.95), loc(0.3, 1.0), loc(0.05, 0.85)]), fill });
    const base = [-0.7, -0.24, 0.22, 0.66];
    const ang = [-0.42, -0.14, 0.12, 0.38];
    const cmp = [0.38, 0.47, 0.45, 0.36];
    base.forEach((b, q) => {
      const de: [number, number] = [0.52, b];
      const ate: [number, number] = [0.52 + cmp[q], b + (ang[q] * cmp[q] * L) / W2];
      pecas.push(dedo(de, ate, 0.22));
    });
    pecas.push(dedo([0.18, 0.8], [0.42, 1.55], 0.28));
  } else {
    // solta: palma + dedos juntos num bloco curvo, polegar na frente
    pecas.push({ d: suave([loc(-0.05, -0.86), loc(0.28, -1.0), loc(0.62, -0.92), loc(0.9, -0.62), loc(1.0, -0.15), loc(0.96, 0.3), loc(0.76, 0.62), loc(0.45, 0.92), loc(0.1, 0.86)]), fill });
    pecas.push(dedo([0.24, 0.72], [0.55, 1.02], 0.29));
    det.push(vinco([loc(0.66, -0.45), loc(0.93, -0.38)], 0.4), vinco([loc(0.66, 0.05), loc(0.92, 0.08)], 0.4));
  }
  return { pecas, det, palma: loc(0.4, 0), eixo: a, lado: s };
}

// ------------------------------------------------------------------ braço

export function braco(c: MCtx, i: 0 | 1, naFrente = false): { el: React.ReactNode; ds: string[] } {
  const { k, j, med, pessoa, roupa } = c;
  const longe = naFrente ? 0.15 : j.vista === 'frente' ? (i === 0 ? 0.25 : 0) : i === 0 ? 1 : 0;
  const mp = material(pessoa.pele, 'pele', longe);
  const sh = j.ombro[i];
  const el = j.cotovelo[i];
  const wr = j.punho[i];
  const d1 = dist(sh, el) > 1e-3 ? unit(sub(el, sh)) : ([0, 1] as P);
  const a0 = soma(sh, esc(d1, 2.4));
  const pecas: Peca[] = [];
  const det: React.ReactNode[] = [];
  // o mesmo raio de gradiente no braço e no antebraço: com o braço reto, a luz corre contínua
  const rgP = (med.rBraco(0.3) + med.rAnte(0.3)) / 2;
  pecas.push({ d: suave(tubo(a0, el, med.rBraco)), fill: k.tubo(a0, el, rgP, mp) });
  pecas.push({ d: suave(tubo(el, wr, med.rAnte)), fill: k.tubo(el, wr, rgP, mp) });

  // manga
  const m = mangaDe(roupa);
  const mt = material(roupa.cima.cor, 'tecido', longe);
  if (m) {
    const ini = soma(sh, esc(d1, 1.2));
    const f = m.folga;
    if (m.ate <= 1) {
      const fim = mixP(a0, el, m.ate);
      const r = (t: number) => med.rBraco(t * m.ate) + f + 0.6 * suaviza(0.6, 1, t);
      pecas.push({ d: suave(tubo(ini, fim, r, { pontaB: 'reta' })), fill: k.tubo(ini, fim, r(0.5), mt) });
      // a barra: a boca da manga por dentro (sombra) + o friso da barra
      const dd = unit(sub(fim, ini));
      const n = perp(dd);
      const rr = r(1);
      det.push(<path key="mbar" d={`M${fmt(fim[0] + n[0] * rr)} ${fmt(fim[1] + n[1] * rr)}L${fmt(fim[0] - n[0] * rr)} ${fmt(fim[1] - n[1] * rr)}`} stroke={m.cor ?? mt.sombra} strokeWidth={m.cor ? 1.1 : 0.7} strokeLinecap="round" opacity={m.cor ? 0.95 : 0.6} transform={`translate(${fmt(-dd[0] * 1.1)} ${fmt(-dd[1] * 1.1)})`} />);
    } else {
      const rS = (t: number) => med.rBraco(t) + f;
      const rgM = (rS(0.3) + med.rAnte(0.3) + f) / 2;
      pecas.push({ d: suave(tubo(ini, el, rS)), fill: k.tubo(ini, el, rgM, mt) });
      const q = m.ate - 1;
      const fim = mixP(el, wr, q);
      const rib = m.punho === 'rib';
      const rA = (t: number) => (med.rAnte(t * q) + f * (rib ? 1 - 0.55 * suaviza(0.75, 1, t) : 1)) + (m.punho === 'vies' ? 0.5 * suaviza(0.6, 1, t) : 0);
      pecas.push({ d: suave(tubo(el, fim, rA, { pontaB: 'reta' })), fill: k.tubo(el, fim, rgM, mt) });
      const dd = unit(sub(fim, el));
      const n = perp(dd);
      if (rib || m.punho === 'camisa' || m.punho === 'vies') {
        const cor = m.punho === 'camisa' ? m.cor ?? '#F4F5FF' : m.punho === 'vies' ? m.cor ?? mt.sombra : mt.sombra;
        const larg = m.punho === 'camisa' ? 2.2 : m.punho === 'vies' ? 1.1 : 2.6;
        const a = soma(fim, esc(dd, -larg));
        const rr = rA(1) * (m.punho === 'camisa' ? 0.82 : 1);
        const cm = material(cor, 'tecido', longe);
        const pts = tubo(m.punho === 'camisa' ? fim : a, m.punho === 'camisa' ? soma(fim, esc(dd, larg)) : fim, () => rr, { pontaA: 'reta', pontaB: 'reta', n: 3 });
        pecas.push({ d: suave(pts), fill: k.tubo(a, fim, rr, cm) });
        if (rib) {
          for (let q2 = -2; q2 <= 2; q2++) {
            const p = soma(soma(a, esc(dd, larg * 0.5)), esc(n, q2 * rr * 0.32));
            det.push(<path key={`rib${q2}`} d={`M${fmt(p[0] - dd[0] * larg * 0.4)} ${fmt(p[1] - dd[1] * larg * 0.4)}l${fmt(dd[0] * larg * 0.8)} ${fmt(dd[1] * larg * 0.8)}`} stroke={mt.fundo} strokeWidth={0.3} opacity={0.6} />);
          }
        }
      }
      // listra lateral da manga (camiseta de treino de manga longa)
      if (roupa.cima.tipo === 'manga-longa' && roupa.cima.cor2) {
        const s1 = soma(soma(ini, esc(d1, 3)), esc(perp(d1), -rS(0.1) * 0.55));
        const s2 = soma(el, esc(perp(d1), -rS(1) * 0.55));
        const s3 = soma(fim, esc(n, -rA(1) * 0.55));
        det.push(<path key="lst" d={suave([s1, s2, s3], false)} stroke={roupa.cima.cor2} strokeWidth={0.9} strokeLinecap="round" fill="none" opacity={0.9} />);
      }
      // dobras do cotovelo quando dobra
      const dob = Math.abs(((j.ang.antebraco[i] - j.ang.braco[i] + 540) % 360) - 180);
      if (dob > 25) {
        const lado = Math.sign(((j.ang.antebraco[i] - j.ang.braco[i] + 540) % 360) - 180) || 1;
        const nn = esc(perp(d1), lado);
        for (const q2 of [0.35, 0.7]) {
          const p0 = soma(el, esc(nn, rS(1) * q2));
          const p1 = soma(p0, soma(esc(d1, -2.4), esc(nn, -0.6)));
          det.push(<path key={`dob${q2}`} d={`M${fmt(p0[0])} ${fmt(p0[1])}Q${fmt((p0[0] + p1[0]) / 2 + nn[0] * 0.8)} ${fmt((p0[1] + p1[1]) / 2 + nn[1] * 0.8)} ${fmt(p1[0])} ${fmt(p1[1])}`} stroke={mt.fundo} strokeWidth={0.45} strokeLinecap="round" fill="none" opacity={0.45 * clamp((dob - 25) / 40)} />);
        }
      }
    }
  }

  // a mão e o que ela segura
  const mao = maoDe(c, i, mp, `m${i}`);
  const segura = c.segura && j.mao[i] === 'segura' ? c.segura : null;
  const garrafa = !segura && i === 0 && j.mao[0] === 'solta' && roupa.extras?.includes('garrafa');
  const antes: Peca[] = [];
  const depois: Peca[] = [];
  const detProp: React.ReactNode[] = [];
  if (segura === 'halter') {
    // o halter atravessa o punho: o eixo aponta meio pra câmera (encurta), as anilhas são discos
    // vistos de lado (elipse + a espessura), a de trás antes da mão e a da frente depois
    const g = mao.palma;
    const ax = mao.lado;
    const giro = (Math.atan2(ax[1], ax[0]) * 180) / Math.PI;
    const ferro = material('#33395E', 'tecido', longe);
    const cor = material(pessoa.cor, 'tecido', longe);
    const cromo = material('#C9CEE8', 'metal', longe);
    const anilha = (lado: number): Peca[] => {
      const c0 = soma(g, esc(ax, lado * 4.9));
      const c1 = soma(c0, esc(ax, lado * 2.2));
      const corpo = suave(casco([...elipse(c0, 2.3, 5.8, giro, 20), ...elipse(c1, 2.3, 5.8, giro, 20)]));
      const face = suave(elipse(c1, 2.3, 5.8, giro, 24));
      const aro = suave(elipse(c1, 1.75, 4.5, giro, 20));
      const cubo = suave(elipse(c1, 0.9, 1.9, giro, 14));
      const fio = esc(perp(ax), 1);
      return [
        { d: corpo, fill: k.tubo(soma(c0, esc(fio, -6)), soma(c0, esc(fio, 6)), 6, ferro) },
        { d: face, fill: k.bolha(ferro, 1.2) },
        { d: aro, fill: k.bolha(cor, 1) },
        { d: cubo, fill: k.bolha(cromo, 1) },
      ];
    };
    const ca = soma(g, esc(ax, -5));
    const cb = soma(g, esc(ax, 5));
    antes.push({ d: suave(tubo(ca, cb, () => 1.15, { n: 2 })), fill: k.tubo(ca, cb, 1.15, cromo) });
    const [tras, frente] = ax[0] * (k.espelho ? -1 : 1) > 0 ? [-1, 1] : [1, -1];
    antes.push(...anilha(tras));
    depois.push(...anilha(frente));
  } else if (segura === 'copo' || garrafa) {
    const g = mao.palma;
    const up: P = [0, -1];
    // perto da boca o copo inclina até a borda encostar nos lábios
    const boca = j.boca;
    const dB = dist(g, boca);
    const perto = segura === 'copo' ? suaviza(16, 8, dB) : 0;
    const paraBoca = unit(sub(boca, g));
    const eixo = unit(mixP(up, paraBoca, perto));
    const Lc = garrafa ? 15 : 11;
    const rT = garrafa ? 2.6 : 3.7;
    const rB = garrafa ? 2.6 : 2.9;
    let base = soma(g, esc(eixo, -Lc * (garrafa ? 0.45 : 0.32)));
    let topo = soma(base, esc(eixo, Lc));
    if (perto > 0) {
      // a borda (do lado de fora do rosto) cai nos lábios
      const n = perp(eixo);
      const fora = n[0] > 0 ? n : esc(n, -1);
      const alvo = soma(boca, esc(fora, rT * 0.75));
      const corr = esc(sub(alvo, topo), perto);
      base = soma(base, corr);
      topo = soma(topo, corr);
    }
    const corpo = suave(tubo(base, topo, (t) => lerp(rB, rT, t), { pontaA: 'reta', pontaB: 'reta', n: 4 }));
    if (garrafa) {
      const mg = material(pessoa.cor, 'tecido');
      antes.push({ d: corpo, fill: k.tubo(base, topo, rT, material('#DDF3FF')) });
      const tampa = suave(tubo(topo, soma(topo, esc(eixo, 3)), () => 1.9, { pontaA: 'reta' }));
      antes.push({ d: tampa, fill: k.tubo(topo, soma(topo, esc(eixo, 3)), 1.9, mg) });
      detProp.push(<path key="rot" d={suave(tubo(mixP(base, topo, 0.3), mixP(base, topo, 0.65), () => rT + 0.05, { pontaA: 'reta', pontaB: 'reta', n: 2 }))} fill={pessoa.cor} opacity={0.85} />);
    } else {
      const rec = k.recorte([corpo]);
      const nivel = lerp(base[1], topo[1], 0.62);
      const agua = material('#4DD0FF');
      // o vidro por trás, a água (sempre na horizontal), o brilho do vidro
      antes.push({ d: corpo, fill: k.tubo(base, topo, rT, material('#E6F4FF')), op: 0.5 });
      detProp.push(
        <g key="agua" clipPath={rec}>
          <rect x={Math.min(base[0], topo[0]) - 10} y={nivel} width={30} height={30} fill={k.lin([0, nivel], [0, nivel + 10], [[0, agua.luz], [1, agua.sombra]])} opacity={0.92} />
          <rect x={Math.min(base[0], topo[0]) - 10} y={nivel - 0.25} width={30} height={0.7} fill="#FFFFFF" opacity={0.7} />
        </g>,
      );
      const n = perp(eixo);
      const b1 = soma(mixP(base, topo, 0.15), esc(n, -rB * 0.55));
      const b2 = soma(mixP(base, topo, 0.85), esc(n, -rT * 0.6));
      detProp.push(<path key="br" d={`M${fmt(b1[0])} ${fmt(b1[1])}L${fmt(b2[0])} ${fmt(b2[1])}`} stroke="#FFFFFF" strokeWidth={0.8} strokeLinecap="round" opacity={0.75} />);
      const e1 = soma(topo, esc(n, rT));
      const e2 = soma(topo, esc(n, -rT));
      detProp.push(<path key="borda" d={`M${fmt(e1[0])} ${fmt(e1[1])}L${fmt(e2[0])} ${fmt(e2[1])}`} stroke="#FFFFFF" strokeWidth={0.55} strokeLinecap="round" opacity={0.85} />);
    }
  }

  // relógio no pulso da frente (se a manga não cobre)
  if (roupa.extras?.includes('relogio') && i === 1 && (!m || m.ate < 1.7)) {
    const dd = unit(sub(wr, el));
    const a = soma(wr, esc(dd, -2.6));
    const b = soma(wr, esc(dd, -0.6));
    const rr = med.rAnte(0.9) + 0.45;
    const pul = material(pessoa.cor, 'tecido', longe);
    pecas.push({ d: suave(tubo(a, b, () => rr, { pontaA: 'reta', pontaB: 'reta', n: 2 })), fill: k.tubo(a, b, rr, pul) });
    const s = j.vista === 'frente' ? perp(dd) : ([dd[1], -dd[0]] as P);
    const fc = soma(mixP(a, b, 0.5), esc(s, rr * 0.35));
    det.push(<circle key="mostr" cx={fc[0]} cy={fc[1]} r={rr * 0.7} fill="#1A1630" />, <circle key="vid" cx={fc[0] - 0.3} cy={fc[1] - 0.3} r={rr * 0.28} fill="#FFFFFF" opacity={0.5} />);
  }

  const todas = [...pecas, ...antes, ...mao.pecas, ...depois];
  return {
    el: (
      <Vol k={k} pecas={todas} forca={longe ? 0.45 : 1}>
        {det}
        {mao.det}
        {detProp}
      </Vol>
    ),
    ds: todas.map((p) => p.d),
  };
}

// ------------------------------------------------------------------ perna

/** o calçado no plano do pé; de frente o pé encurta e abre pra fora */
function calcado(c: MCtx, i: 0 | 1, longe: number): { pecas: Peca[]; det: React.ReactNode[] } {
  const { k, j, prop, pessoa, roupa } = c;
  const cal = roupa.calcado;
  const v = j.vista;
  const fator = v === 'frente' ? 0.6 : v === 'tres-quartos' ? 0.86 : 1;
  const ca = j.calcanhar[i];
  const po = j.ponta[i];
  const sola0 = mixP(ca, po, 0.25);
  let dir = unit(sub(po, ca));
  if (v === 'frente' && i === 0) dir = [-dir[0], dir[1]];
  const up: P = dir[0] >= 0 ? [dir[1], -dir[0]] : [-dir[1], dir[0]];
  const Lf = prop.pe * fator;
  const F = (u: number, h: number): P => soma(sola0, soma(esc(dir, u * Lf - 0.25 * Lf), esc(up, h)));
  const pecas: Peca[] = [];
  const det: React.ReactNode[] = [];
  const mc = material(cal.cor, 'tecido', longe);
  const ms = material(cal.sola ?? ajusta(cal.cor, -0.2), 'tecido', longe);
  const fCal = k.tubo(F(0.5, 0), F(0.5, 9), 4.5, mc);
  const fSola = k.tubo(F(0.5, 0), F(0.5, 2.4), 1.4, ms);
  const mpe = material(pessoa.pele, 'pele', longe);
  const linha = (pts: P[], cor: string, w: number, op = 1) => <path key={`l${det.length}`} d={suave(pts, false)} stroke={cor} strokeWidth={w} strokeLinecap="round" fill="none" opacity={op} />;
  if (cal.tipo === 'tenis' || cal.tipo === 'bota') {
    const bota = cal.tipo === 'bota';
    const meia = roupa.baixo.tipo === 'short' || roupa.baixo.tipo === 'saia';
    if (meia && !bota) pecas.push({ d: suave([F(0.1, 7), F(0.06, 10.6), F(0.4, 11), F(0.42, 7.5)]), fill: k.tubo(F(0.2, 7), F(0.2, 11), 2, material('#F4F5FF', 'tecido', longe)) });
    const cano = bota ? 15 : 8.4;
    pecas.push({
      d: suave([F(-0.02, 1.8), F(-0.05, 5.5), F(0.04, cano), F(0.3, cano - 0.6), F(0.42, cano + 0.5), F(0.58, 6.6), F(0.8, 4.6), F(1.0, 2.9), F(1.0, 1.6)]),
      fill: fCal,
    });
    pecas.push({ d: suave([F(-0.04, 0.4), F(-0.03, 2.4), F(0.5, 2.1), F(1.0, 2.2), F(1.05, 1.0), F(1.0, -0.05), F(0.05, -0.05)]), fill: fSola });
    if (!bota) {
      for (const u of [0.46, 0.55, 0.64]) det.push(linha([F(u - 0.03, 7.6 - (u - 0.46) * 9), F(u + 0.05, 6.6 - (u - 0.46) * 9)], '#FFFFFF', 0.55, 0.85));
      det.push(linha([F(0.12, 3.6), F(0.32, 4.6), F(0.6, 4.0)], ms.base, 0.9, 0.95));
    }
    det.push(<ellipse key="brilho" cx={F(0.82, 3.6)[0]} cy={F(0.82, 3.6)[1]} rx={1.3} ry={0.7} fill="#FFFFFF" opacity={0.35} />);
  } else if (cal.tipo === 'sapato') {
    pecas.push({ d: suave([F(-0.01, 1.4), F(-0.04, 4.6), F(0.06, 6.6), F(0.36, 6.4), F(0.62, 4.6), F(0.86, 3.2), F(1.02, 1.8), F(1.0, 1.0)]), fill: fCal });
    pecas.push({ d: suave([F(-0.03, 0.2), F(-0.02, 1.4), F(0.5, 1.2), F(1.02, 1.1), F(1.02, 0.2), F(0.5, 0.0), F(0.02, -0.05)]), fill: k.tubo(F(0.5, 0), F(0.5, 1.4), 0.8, material(ajusta(cal.cor, -0.15), 'tecido', longe)) });
    pecas.push({ d: suave([F(-0.03, 0.0), F(-0.03, 2.4), F(0.2, 2.4), F(0.22, 0.0)]), fill: fSola });
    det.push(<ellipse key="brilho" cx={F(0.8, 3.0)[0]} cy={F(0.8, 3.0)[1]} rx={1.6} ry={0.6} fill="#FFFFFF" opacity={0.42} />);
    det.push(linha([F(0.52, 5.4), F(0.62, 4.4)], mc.fundo, 0.4, 0.6));
  } else if (cal.tipo === 'chinelo') {
    pecas.push({ d: suave([F(-0.02, 1.2), F(-0.03, 4.8), F(0.12, 8.2), F(0.4, 8.6), F(0.6, 5.6), F(0.85, 3.6), F(1.0, 2.6), F(0.98, 1.2)]), fill: k.tubo(F(0.5, 1), F(0.5, 8), 3.6, mpe) });
    pecas.push({ d: suave([F(-0.06, 0.0), F(-0.06, 1.3), F(0.5, 1.4), F(1.06, 1.3), F(1.06, 0.0), F(0.5, -0.1)]), fill: fCal });
    pecas.push({ d: suave([F(0.42, 1.2), F(0.48, 6.4), F(0.6, 6.0), F(0.64, 1.2)]), fill: k.tubo(F(0.5, 1), F(0.5, 6), 1.2, mc) });
  } else {
    // meia (em casa / pijama): o pé de meia com o punho canelado
    pecas.push({ d: suave([F(-0.02, 1.0), F(-0.04, 5.0), F(0.06, 11.5), F(0.4, 11.5), F(0.44, 7.0), F(0.68, 4.6), F(0.9, 3.4), F(1.0, 1.8), F(0.96, 0.4), F(0.4, 0.1), F(0.05, 0.2)]), fill: k.tubo(F(0.5, 0), F(0.5, 10), 4, mc) });
    for (const h of [9.6, 10.6]) det.push(linha([F(0.06, h), F(0.4, h)], mc.sombra, 0.35, 0.7));
  }
  return { pecas, det };
}

export function perna(c: MCtx, i: 0 | 1): { el: React.ReactNode; ds: string[]; calca: string[] } {
  const { k, j, med, pessoa, roupa } = c;
  const longe = j.vista === 'frente' ? (i === 0 ? 0.2 : 0) : i === 0 ? 1 : 0;
  const mp = material(pessoa.pele, 'pele', longe);
  const hip = j.quadril[i];
  const kn = j.joelho[i];
  const an = j.tornozelo[i];
  const b = roupa.baixo;
  const longa = b.tipo !== 'short' && b.tipo !== 'saia';
  const pecas: Peca[] = [];
  const det: React.ReactNode[] = [];
  const calca: string[] = [];
  if (!longa) {
    const rgP = (med.rCanela(0.3) + med.rCoxa(0.5)) / 2;
    pecas.push({ d: suave(tubo(kn, an, med.rCanela)), fill: k.tubo(kn, an, rgP, mp) });
    pecas.push({ d: suave(tubo(hip, kn, med.rCoxa)), fill: k.tubo(hip, kn, rgP, mp) });
    // joelho: um brilho e uma sombrinha
    det.push(<ellipse key="jo" cx={kn[0]} cy={kn[1] - 1} rx={2.4} ry={1.6} fill={mp.luz} opacity={0.35} />);
  }
  const cal = calcado(c, i, longe);
  pecas.push(...cal.pecas);
  const mt = material(b.cor, 'tecido', longe);
  const dS = unit(sub(an, kn));
  const fimCanela = soma(an, esc(dS, b.tipo === 'legging' ? -0.6 : 1.6));
  if (longa) {
    const R = {
      legging: { c: (t: number) => med.rCoxa(t) + 0.4, s: (t: number) => med.rCanela(t) + 0.35 },
      jeans: { c: (t: number) => Math.max(med.rCoxa(t) + 1.1, lerp(9.4, 7.2, t)), s: (t: number) => lerp(7.2, 6.3, t) },
      calca: { c: (t: number) => Math.max(med.rCoxa(t) + 1.2, lerp(9.8, 7.6, t)), s: (t: number) => lerp(7.6, 7.0, t) },
      moletom: { c: (t: number) => med.rCoxa(t) + 2.3, s: (t: number) => med.rCanela(t) + 2.3 - 2.4 * suaviza(0.82, 1, t) },
      pijama: { c: (t: number) => med.rCoxa(t) + 2.4, s: (t: number) => lerp(8.2, 7.9, t) },
    }[b.tipo as 'jeans'];
    const rgC = (R.s(0.3) + R.c(0.5)) / 2;
    pecas.push({ d: suave(tubo(kn, fimCanela, R.s, { pontaB: 'reta' })), fill: k.tubo(kn, fimCanela, rgC, mt) });
    pecas.push({ d: suave(tubo(hip, kn, R.c)), fill: k.tubo(hip, kn, rgC, mt) });
    calca.push(pecas[pecas.length - 1].d, pecas[pecas.length - 2].d);
    const nC = perp(unit(sub(kn, hip)));
    const nS = perp(dS);
    // o lado da costura: o de trás (−x de 3/4); de frente, o de fora
    const ladoC = j.vista === 'frente' ? (i === 0 ? -1 : 1) * Math.sign(nC[0] || 1) : -Math.sign(nC[0] || 1);
    const ladoS = j.vista === 'frente' ? (i === 0 ? -1 : 1) * Math.sign(nS[0] || 1) : -Math.sign(nS[0] || 1);
    const costura = [soma(hip, esc(nC, ladoC * R.c(0) * 0.7)), soma(kn, esc(nC, ladoC * R.c(1) * 0.7)), soma(fimCanela, esc(nS, ladoS * R.s(1) * 0.7))];
    if (b.tipo === 'legging' && b.cor2) det.push(<path key="lst" d={suave(costura, false)} stroke={b.cor2} strokeWidth={1.1} strokeLinecap="round" fill="none" />);
    if (b.tipo === 'pijama' && b.cor2) det.push(<path key="vies" d={suave(costura, false)} stroke={b.cor2} strokeWidth={0.8} strokeLinecap="round" fill="none" />);
    if (b.tipo === 'jeans') {
      det.push(<path key="pesp" d={suave(costura, false)} stroke={mistura(b.cor, '#FFD58A', 0.55)} strokeWidth={0.4} strokeDasharray="1 0.9" fill="none" opacity={0.85} />);
      // barra dobrada
      const a = soma(fimCanela, esc(dS, -2.2));
      pecas.push({ d: suave(tubo(a, fimCanela, () => R.s(1) + 0.3, { pontaA: 'reta', pontaB: 'reta', n: 2 })), fill: k.tubo(a, fimCanela, R.s(1), material(ajusta(b.cor, 0.08), 'tecido', longe)) });
    }
    if (b.tipo === 'calca') {
      // o vinco da calça social
      const meio = [soma(hip, esc(nC, -ladoC * 1.2)), soma(kn, esc(nS, -ladoS * 0.6)), soma(fimCanela, esc(nS, -ladoS * 0.8))];
      det.push(<path key="vinco" d={suave(meio, false)} stroke={mt.luz} strokeWidth={0.45} fill="none" opacity={0.5} />);
    }
    if (b.tipo === 'moletom') {
      const a = soma(fimCanela, esc(dS, -2.6));
      const rr = med.rCanela(1) + 0.9;
      pecas.push({ d: suave(tubo(a, fimCanela, () => rr, { pontaA: 'reta', pontaB: 'reta', n: 2 })), fill: k.tubo(a, fimCanela, rr, material(ajusta(b.cor, -0.06), 'tecido', longe)) });
    }
    // dobras atrás do joelho quando dobra
    const dob = j.ang.coxa[i] - j.ang.canela[i];
    if (dob > 30) {
      for (const q of [0.3, 0.65]) {
        const p0 = soma(kn, esc(nC, -0.4 * R.c(1) + q * 2));
        const p1 = soma(p0, esc(unit(sub(hip, kn)), 2.6));
        det.push(<path key={`dob${q}`} d={`M${fmt(p0[0])} ${fmt(p0[1])}L${fmt(p1[0])} ${fmt(p1[1])}`} stroke={mt.fundo} strokeWidth={0.45} strokeLinecap="round" opacity={0.35 * clamp((dob - 30) / 50)} />);
      }
    }
  } else if (b.tipo === 'short') {
    const fim = mixP(hip, kn, 0.5);
    const r = (t: number) => med.rCoxa(t * 0.5) + 1.5 + 0.9 * suaviza(0.5, 1, t);
    pecas.push({ d: suave(tubo(soma(hip, esc(unit(sub(hip, kn)), 1)), fim, r, { pontaB: 'reta' })), fill: k.tubo(hip, fim, r(0.5), mt) });
    calca.push(pecas[pecas.length - 1].d);
    if (b.cor2) {
      const nC = perp(unit(sub(kn, hip)));
      const lado = j.vista === 'frente' ? (i === 0 ? -1 : 1) * Math.sign(nC[0] || 1) : -Math.sign(nC[0] || 1);
      det.push(<path key="lst" d={poli([soma(hip, esc(nC, lado * r(0) * 0.75)), soma(fim, esc(nC, lado * r(1) * 0.8))], false)} stroke={b.cor2} strokeWidth={1.1} strokeLinecap="round" />);
    }
  }
  return {
    el: (
      <Vol k={k} pecas={pecas} forca={longe ? 0.45 : 1}>
        {cal.det}
        {det}
      </Vol>
    ),
    ds: pecas.map((p) => p.d),
    calca,
  };
}

export const _f = fmt;
