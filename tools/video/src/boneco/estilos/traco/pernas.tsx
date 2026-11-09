// Traço editorial — pernas, a parte de baixo da roupa (legging, calça, jeans, moletom, short,
// saia, pijama) e os calçados (tênis com sola e cadarço, sapato, chinelo, meia, bota).
import React from 'react';
import type { Baixo } from '../../elenco';
import { type Ctx, atras } from './ctx';
import { type P, type Perfil, add, base, dist, folga, lerpP, membro, mul, poli, raioEm, sub, suave } from './geo';
import { Vol } from './Vol';
import { clara, mix, sombra, sombraPele } from './cor';

/** perfis da perna pra vista (de frente o músculo de fora é o mais cheio) */
const perfis = (c: Ctx, i: 0 | 1) => {
  const { coxa, canela } = c.corpo;
  if (c.j.vista !== 'frente') return { coxa, canela };
  const lado = (p: Perfil): Perfil => p.map(([t, f, b]) => (i === 1 ? [t, Math.max(f, b), Math.min(f, b)] : [t, Math.min(f, b), Math.max(f, b)]));
  return { coxa: lado(coxa), canela: lado(canela) };
};

type Corte = {
  /** folga na coxa e na canela */
  eCoxa: number;
  eCanela: number;
  /** até onde vai (na canela, 0..1; >1 cobre o peito do pé); < 0: termina na coxa (|valor|) */
  fim: number;
  /** canela reta (calça social, pijama) */
  reta?: boolean;
  /** punho franzido no tornozelo (moletom) */
  punho?: boolean;
  /** cintura (v) */
  cintura: number;
};

const corteDe = (b: Baixo, c: Ctx): Corte => {
  const T = c.tr.T;
  const m = c.pessoa.genero === 'm';
  switch (b.tipo) {
    case 'legging':
      return { eCoxa: 0.25, eCanela: 0.2, fim: 0.93, cintura: 0.3 * T };
    case 'calca':
      return { eCoxa: 1.1, eCanela: 1.0, fim: 1.02, reta: true, cintura: 0.2 * T };
    case 'jeans':
      return { eCoxa: 0.75, eCanela: 0.65, fim: 1.0, cintura: 0.18 * T };
    case 'moletom':
      return { eCoxa: 1.6, eCanela: 1.5, fim: 1.0, punho: true, cintura: 0.24 * T };
    case 'short':
      return { eCoxa: 1.5, eCanela: 0, fim: m ? -0.56 : -0.42, cintura: 0.2 * T };
    case 'pijama':
      return { eCoxa: 1.7, eCanela: 1.6, fim: 0.98, reta: true, cintura: 0.22 * T };
    case 'saia':
      return { eCoxa: 0, eCanela: 0, fim: -0.88, cintura: 0.27 * T };
  }
};

/** pele da perna (coxa + canela) */
const pernaPele = (c: Ctx, i: 0 | 1): string[] => {
  const { j } = c;
  const p = perfis(c, i);
  return [suave(membro(j.quadril[i], j.joelho[i], p.coxa)), suave(membro(j.joelho[i], j.tornozelo[i], p.canela))];
};

/** a perna da roupa (até a barra) */
const pernaRoupa = (c: Ctx, i: 0 | 1, k: Corte): string[] => {
  const { j } = c;
  const p = perfis(c, i);
  const out: string[] = [];
  if (k.fim < 0) {
    out.push(suave(membro(j.quadril[i], j.joelho[i], folga(p.coxa, k.eCoxa, 0, -k.fim, k.eCoxa * 1.1))));
    return out;
  }
  out.push(suave(membro(j.quadril[i], j.joelho[i], folga(p.coxa, k.eCoxa))));
  let can: Perfil = folga(p.canela, k.eCanela, 0, Math.min(1, k.fim));
  if (k.reta) {
    const [rf, rb] = raioEm(p.coxa, 1);
    can = [
      [0, rf + k.eCanela, rb + k.eCanela],
      [Math.min(1, k.fim), rf + k.eCanela * 0.75, rb + k.eCanela * 0.75],
    ];
  }
  if (k.punho) {
    // o tecido sobra acima do punho e o punho aperta
    const [r0] = raioEm(p.canela, 0);
    const [, rb] = raioEm(p.canela, 0.3);
    const [ra] = raioEm(p.canela, 1);
    can = [
      [0, r0 + k.eCanela, r0 + k.eCanela],
      [0.45, rb + 0.6, rb + 0.9],
      [0.82, rb + 0.2, rb + 0.3],
      [0.87, ra + 0.75, ra + 0.75],
      [1, ra + 0.6, ra + 0.6],
    ];
  }
  // a barra passa um pouco do tornozelo (cobre o alto do calçado)
  const fimP = k.fim > 1 ? add(j.tornozelo[i], mul(sub(j.tornozelo[i], j.joelho[i]), (k.fim - 1) * 2.2)) : j.tornozelo[i];
  out.push(suave(membro(j.joelho[i], fimP, can)));
  return out;
};

/** o bloco do quadril (calça/short): cintura → lados → alto das coxas, acompanhando as pernas */
const quadrilRoupa = (c: Ctx, k: Corte): string => {
  const { j, tr } = c;
  const e = Math.max(0.3, k.eCoxa * 0.7);
  const pts: P[] = [];
  const wv = k.cintura;
  pts.push(tr.pt(tr.xm(wv, e * 0.6), wv));
  pts.push(tr.pt(tr.meio(wv, e) * 0.6, wv + 0.4));
  pts.push(tr.pt(tr.xM(wv, e * 0.6), wv));
  for (const v of [wv * 0.45, -2]) pts.push(tr.pt(tr.xM(v, e), v));
  const p = perfis(c, 1);
  const p0 = perfis(c, 0);
  const coxaPt = (i: 0 | 1, t: number, lado: 1 | -1, perf: Perfil) => {
    const q = j.quadril[i];
    const jo = j.joelho[i];
    const L = dist(q, jo);
    const d: P = [(jo[0] - q[0]) / L, (jo[1] - q[1]) / L];
    const n: P = [d[1], -d[0]];
    const [rf, rb] = raioEm(perf, t);
    const r = (lado > 0 ? rf : rb) + e;
    return add(add(q, mul(d, L * t)), mul(n, r * lado));
  };
  pts.push(coxaPt(1, 0.22, 1, p.coxa));
  // gancho: entre as duas coxas
  const g = lerpP(add(j.quadril[0], mul(sub(j.joelho[0], j.quadril[0]), 0.2)), add(j.quadril[1], mul(sub(j.joelho[1], j.quadril[1]), 0.2)), 0.5);
  pts.push(g);
  pts.push(coxaPt(0, 0.22, -1, p0.coxa));
  for (const v of [-2, wv * 0.45]) pts.push(tr.pt(tr.xm(v, e), v));
  return suave(pts);
};

/** saia evasê: o casco da cintura e das duas coxas até a barra */
const saia = (c: Ctx, k: Corte): string => {
  const { j, tr } = c;
  const wv = k.cintura;
  const ptsAll: P[] = [];
  for (const v of [wv, wv * 0.5, 0, -6]) {
    ptsAll.push(tr.pt(tr.xm(v, 0.8), v));
    ptsAll.push(tr.pt(tr.xM(v, 0.8), v));
  }
  const t = -k.fim;
  for (const i of [0, 1] as const) {
    const q = j.quadril[i];
    const jo = j.joelho[i];
    const L = dist(q, jo);
    const d: P = [(jo[0] - q[0]) / L, (jo[1] - q[1]) / L];
    const n: P = [d[1], -d[0]];
    const [rf, rb] = raioEm(c.corpo.coxa, t);
    const m = add(q, mul(d, L * t));
    ptsAll.push(add(m, mul(n, rf + 3.2)));
    ptsAll.push(add(m, mul(n, -(rb + 3.2))));
    ptsAll.push(add(m, mul(d, 1.2)));
  }
  return suave(casco(ptsAll), true, 0.7);
};

/** casco convexo (monotone chain) */
export function casco(pts: P[]): P[] {
  const s = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o: P, a: P, b: P) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: P[] = [];
  for (const p of s) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
    lo.push(p);
  }
  const up: P[] = [];
  for (let i = s.length - 1; i >= 0; i--) {
    const p = s[i];
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop();
    up.push(p);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}

// ------------------------------------------------------------------ calçados

/** Calçado de lado (3/4 e perfil): na base do pé (x do calcanhar → ponta, y pra cima). */
const calcadoLado = (c: Ctx, i: 0 | 1, id: string): React.ReactNode => {
  const { j, roupa } = c;
  const C = j.calcanhar[i];
  const Pn = j.ponta[i];
  const Lr = dist(C, Pn) || 1;
  const enc = j.vista === 'tres-quartos' ? 0.86 : 1;
  const L = Lr * enc;
  const d: P = [(Pn[0] - C[0]) / Lr, (Pn[1] - C[1]) / Lr];
  const up: P = [d[1], -d[0]];
  // o calcanhar recua um tico na vista de 3/4 (o pé encurta pra frente)
  const o = add(C, mul(d, Lr * (1 - enc) * 0.25));
  const b = base(o, d, up);
  const tipo = roupa.calcado.tipo;
  const cor = atras(c, roupa.calcado.cor, i);
  const sola = atras(c, roupa.calcado.sola ?? (tipo === 'tenis' ? '#F4F5FF' : sombra(roupa.calcado.cor, 1.2)), i);
  const pele = atras(c, c.pele, i, true);
  const Ld = c.L;
  if (tipo === 'chinelo' || tipo === 'meia') {
    // o pé (com meia ou de chinelo)
    const pe = suave([b(-0.4, 1.0), b(-0.2, 3.6), b(0.18 * L, 5.8), b(0.4 * L, 5.0), b(0.72 * L, 3.0), b(L + 0.2, 1.7), b(L + 0.3, 0.4), b(0.6 * L, 0), b(0.1 * L, 0.1)]);
    if (tipo === 'meia') {
      const punho = suave([b(-0.5, 3.4), b(0.42 * L, 3.9), b(0.42 * L, 7.2), b(-0.4, 7.4)]);
      return (
        <g>
          <Vol id={`${id}m`} ds={[pe, punho]} cor={cor} sombra={sombra(cor)} s={1} luzDir={Ld} />
          <path d={poli([b(-0.45, 6.0), b(0.42 * L, 5.6), b(0.42 * L, 6.3), b(-0.45, 6.7)])} fill={sombra(cor, 0.6)} />
        </g>
      );
    }
    const solado = poli([b(-0.7, -0.6), b(L + 0.6, -0.6), b(L + 0.8, 0.5), b(-0.8, 0.5)]);
    return (
      <g>
        <path d={solado} fill={sombra(cor, 0.5)} />
        <path d={poli([b(-0.6, 0.3), b(L + 0.6, 0.3), b(L + 0.7, 0.9), b(-0.7, 0.9)])} fill={cor} />
        <Vol id={`${id}p`} ds={[pe]} cor={pele} sombra={sombraPele(pele)} s={0.9} luzDir={Ld} />
        {/* dedos */}
        <path d={suave([b(0.84 * L, 1.9), b(0.92 * L, 2.0), b(0.9 * L, 0.9)], false)} stroke={sombraPele(pele)} strokeWidth={0.35} fill="none" strokeLinecap="round" />
        {/* tira do chinelo */}
        <path d={suave([b(0.78 * L, 0.6), b(0.6 * L, 3.3), b(0.42 * L, 4.6)], false)} stroke={cor} strokeWidth={1.1} fill="none" strokeLinecap="round" />
      </g>
    );
  }
  if (tipo === 'sapato') {
    const s = suave([b(-0.4, 0.3), b(-0.6, 3.4), b(0.05 * L, 5.0), b(0.3 * L, 4.5), b(0.55 * L, 3.9), b(0.82 * L, 2.9), b(L + 0.6, 1.6), b(L + 0.5, 0.4), b(0.5 * L, 0.5)]);
    return (
      <g>
        <path d={poli([b(-0.4, -0.2), b(0.22 * L, -0.2), b(0.24 * L, 0.7), b(-0.4, 0.7)])} fill={sombra(cor, 1.4)} />
        <path d={suave([b(0.3 * L, 0.0), b(L + 0.5, 0.0), b(L + 0.6, 0.7), b(0.3 * L, 0.7)])} fill={sombra(cor, 1.4)} />
        <Vol id={`${id}s`} ds={[s]} cor={cor} sombra={sombra(cor)} s={1.0} luzDir={Ld} rim={{ cor: mix(cor, c.luz, 0.6), r: 0.45 }} />
        <path d={suave([b(0.66 * L, 2.6), b(0.84 * L, 2.1), b(0.9 * L, 1.9)], false)} stroke={clara(cor, 0.45)} strokeWidth={0.45} fill="none" strokeLinecap="round" opacity={0.8} />
      </g>
    );
  }
  if (tipo === 'bota') {
    const s = suave([b(-0.4, 0.6), b(-0.5, 11), b(0.42 * L, 11), b(0.48 * L, 5), b(0.8 * L, 3.2), b(L + 0.4, 1.8), b(L + 0.3, 0.6)]);
    return (
      <g>
        <path d={poli([b(-0.6, -0.4), b(L + 0.6, -0.4), b(L + 0.6, 1), b(-0.6, 1)])} fill={sombra(cor, 1.4)} />
        <Vol id={`${id}b`} ds={[s]} cor={cor} sombra={sombra(cor)} s={1.1} luzDir={Ld} />
      </g>
    );
  }
  // tênis: sola grossa (com a ponta levantada), cabedal, biqueira, colarinho acolchoado, cadarço
  const solaD = suave([b(-0.9, -0.2), b(0.5 * L, -0.25), b(L + 0.2, -0.05), b(L + 0.9, 1.0), b(L + 0.4, 1.9), b(0.5 * L, 1.75), b(-0.3, 1.9), b(-1.1, 1.2)]);
  const cab = suave([b(-0.8, 1.4), b(-0.9, 5.0), b(-0.3, 7.6), b(0.18 * L, 7.2), b(0.36 * L, 7.9), b(0.54 * L, 5.9), b(0.78 * L, 4.3), b(L + 0.2, 3.3), b(L + 0.7, 1.7)]);
  const laco = [0, 1, 2].map((k) => {
    const a = b(0.4 * L + k * 0.11 * L, 6.7 - k * 0.75);
    const z = b(0.4 * L + k * 0.11 * L + 0.7, 5.7 - k * 0.75);
    return <path key={k} d={`M${a[0]} ${a[1]}L${z[0]} ${z[1]}`} stroke={clara(cor, 0.75)} strokeWidth={0.5} strokeLinecap="round" />;
  });
  const faixa = suave([b(0.12 * L, 2.0), b(0.38 * L, 4.6), b(0.5 * L, 4.0), b(0.32 * L, 2.0)]);
  return (
    <g>
      <Vol id={`${id}t`} ds={[cab]} cor={cor} sombra={sombra(cor)} s={1.0} luzDir={Ld} rim={{ cor: mix(cor, c.luz, i === 1 ? 0.6 : 0.35), r: 0.42 }} />
      <path d={faixa} fill={sola} opacity={0.9} />
      <path d={suave([b(-0.7, 5.4), b(-0.3, 7.6), b(0.2 * L, 7.2), b(0.15 * L, 6.2), b(-0.4, 5.7)])} fill={sombra(cor, 0.7)} />
      {laco}
      <Vol id={`${id}u`} ds={[solaD]} cor={sola} sombra={sombra(sola)} s={0.5} luzDir={Ld} />
      <path d={suave([b(-0.7, 0.9), b(0.5 * L, 0.75), b(L + 0.5, 0.9)], false)} stroke={sombra(sola, 0.6)} strokeWidth={0.3} fill="none" />
    </g>
  );
};

/** Calçado de frente: a ponta vem pra câmera — domo do cabedal, sola por baixo, cadarço no meio. */
const calcadoFrente = (c: Ctx, i: 0 | 1, id: string): React.ReactNode => {
  const { j, roupa } = c;
  const tz = j.tornozelo[i];
  const can = sub(j.tornozelo[i], j.joelho[i]);
  const cl = Math.hypot(can[0], can[1]) || 1;
  const dn: P = [can[0] / cl, can[1] / cl];
  const solaPt = add(tz, mul(dn, c.prop.tornozelo));
  const fora = i === 0 ? -1 : 1;
  const cx = solaPt[0] + fora * 0.9;
  const sy = solaPt[1];
  const tipo = roupa.calcado.tipo;
  const cor = atras(c, roupa.calcado.cor, i);
  const solaCor = atras(c, roupa.calcado.sola ?? (tipo === 'tenis' ? '#F4F5FF' : sombra(roupa.calcado.cor, 1.2)), i);
  const w = 4.3;
  const Ld = c.L;
  if (tipo === 'chinelo' || tipo === 'meia') {
    const pele = atras(c, c.pele, i, true);
    const pe = suave([[cx - w * 0.75, sy - 0.6], [cx - w * 0.8, sy - 4], [cx - 1.8, sy - 6.4], [cx + 1.8, sy - 6.4], [cx + w * 0.8, sy - 4], [cx + w * 0.8, sy - 0.6], [cx, sy + 0.3]]);
    if (tipo === 'meia') {
      return <Vol id={`${id}m`} ds={[pe]} cor={cor} sombra={sombra(cor)} s={0.9} luzDir={Ld} />;
    }
    return (
      <g>
        <path d={suave([[cx - w, sy - 0.5], [cx + w, sy - 0.5], [cx + w, sy + 0.6], [cx - w, sy + 0.6]])} fill={cor} />
        <Vol id={`${id}p`} ds={[pe]} cor={pele} sombra={sombraPele(pele)} s={0.8} luzDir={Ld} />
        <path d={`M${cx - w * 0.7} ${sy - 3.2}Q${cx} ${sy - 0.8} ${cx + w * 0.7} ${sy - 3.2}`} stroke={cor} strokeWidth={1.1} fill="none" strokeLinecap="round" />
      </g>
    );
  }
  const alto = tipo === 'bota' ? 11 : tipo === 'sapato' ? 4.8 : 7.0;
  const dom = suave([[cx - w, sy - 0.8], [cx - w * 0.92, sy - alto * 0.6], [cx - 2.1, sy - alto], [cx + 2.1, sy - alto], [cx + w * 0.92, sy - alto * 0.6], [cx + w, sy - 0.8], [cx, sy - 0.1]]);
  const solaD = suave([[cx - w - 0.4, sy - 1.4], [cx + w + 0.4, sy - 1.4], [cx + w + 0.3, sy + 0.2], [cx - w - 0.3, sy + 0.2]], true, 0.6);
  return (
    <g>
      <Vol id={`${id}d`} ds={[dom]} cor={cor} sombra={sombra(cor)} s={1.0} luzDir={Ld} />
      {tipo === 'tenis'
        ? [0, 1, 2].map((k) => (
            <path key={k} d={`M${cx - 1.1} ${sy - 4.6 + k * 1.05}L${cx + 1.1} ${sy - 4.6 + k * 1.05}`} stroke={clara(cor, 0.75)} strokeWidth={0.5} strokeLinecap="round" />
          ))
        : null}
      {tipo === 'sapato' ? <path d={`M${cx - 1.2} ${sy - 2.4}Q${cx} ${sy - 3.2} ${cx + 1.4} ${sy - 2.5}`} stroke={clara(cor, 0.45)} strokeWidth={0.45} fill="none" strokeLinecap="round" /> : null}
      <Vol id={`${id}u`} ds={[solaD]} cor={tipo === 'tenis' ? solaCor : sombra(cor, 1.3)} sombra={sombra(tipo === 'tenis' ? solaCor : cor, tipo === 'tenis' ? 0.7 : 1.6)} s={0.5} luzDir={Ld} />
    </g>
  );
};

export const calcado = (c: Ctx, i: 0 | 1) => (c.j.vista === 'frente' ? calcadoFrente(c, i, `${c.uid}-pe${i}`) : calcadoLado(c, i, `${c.uid}-pe${i}`));

// ------------------------------------------------------------------ pernas montadas

export type Pernas = {
  /** perna de trás (pele/roupa/calçado), antes do tronco */
  tras: React.ReactNode;
  /** quadril + perna da frente, depois do cabelo de trás e antes da blusa */
  frente: React.ReactNode;
};

export function pernas(c: Ctx): Pernas {
  const { roupa, uid } = c;
  const b = roupa.baixo;
  const k = corteDe(b, c);
  const corB = (i: 0 | 1) => atras(c, b.cor, i);
  const pele = (i: 0 | 1) => atras(c, c.pele, i, true);
  const pelePerna = (i: 0 | 1) => (
    <Vol key={`pp${i}`} id={`${uid}-pp${i}`} ds={pernaPele(c, i)} cor={pele(i)} sombra={sombraPele(pele(i))} s={1.5} luzDir={c.L} />
  );
  // canela à mostra entre a barra e o calçado (legging 7/8)
  const tornozeloPele = (i: 0 | 1) =>
    k.fim > 0 && k.fim < 1 ? (
      <Vol key={`tp${i}`} id={`${uid}-tp${i}`} ds={[suave(membro(c.j.joelho[i], c.j.tornozelo[i], folga(perfis(c, i).canela, -0.05, k.fim - 0.08, 1)))]} cor={pele(i)} sombra={sombraPele(pele(i))} s={1} luzDir={c.L} />
    ) : null;
  const listra = (i: 0 | 1) => {
    if (!b.cor2 || (b.tipo !== 'legging' && b.tipo !== 'short' && b.tipo !== 'moletom')) return null;
    if (i === 0 && c.j.vista !== 'frente') return null;
    const { j } = c;
    const p = perfis(c, i);
    const fim = k.fim < 0 ? -k.fim : Math.min(1, k.fim);
    const lado = c.j.vista === 'frente' ? (i === 1 ? 1 : -1) : -0.15;
    const linha = (a: P, z: P, perf: Perfil, t0: number, t1: number) => {
      const L = dist(a, z);
      const d: P = [(z[0] - a[0]) / L, (z[1] - a[1]) / L];
      const n: P = [d[1], -d[0]];
      const pts: P[] = [];
      for (let s = 0; s <= 6; s++) {
        const t = t0 + ((t1 - t0) * s) / 6;
        const [rf, rb] = raioEm(perf, t);
        const r = (lado > 0 ? rf : rb) * Math.abs(lado) * 0.82 + (lado > 0 ? 0 : 0);
        pts.push(add(add(a, mul(d, L * t)), mul(n, r * Math.sign(lado))));
      }
      return pts;
    };
    const pts = k.fim < 0 ? linha(j.quadril[i], j.joelho[i], p.coxa, 0.05, fim) : [...linha(j.quadril[i], j.joelho[i], p.coxa, 0.05, 1), ...linha(j.joelho[i], j.tornozelo[i], p.canela, 0.05, fim)];
    return <path key={`l${i}`} d={suave(pts, false)} stroke={atras(c, b.cor2, i)} strokeWidth={0.9} fill="none" strokeLinecap="round" opacity={0.95} />;
  };
  const barra = (i: 0 | 1) => {
    // barra do short / punho do moletom / viés do pijama
    const { j } = c;
    if (b.tipo === 'short') {
      const t = -k.fim;
      const q = j.quadril[i];
      const jo = j.joelho[i];
      const L = dist(q, jo);
      const d: P = [(jo[0] - q[0]) / L, (jo[1] - q[1]) / L];
      const n: P = [d[1], -d[0]];
      const [rf, rb] = raioEm(perfis(c, i).coxa, t);
      const m = add(q, mul(d, L * t));
      const a = add(m, mul(n, rf + k.eCoxa));
      const z = add(m, mul(n, -(rb + k.eCoxa * 1.1)));
      const a2 = add(a, mul(d, -1.1));
      const z2 = add(z, mul(d, -1.1));
      return <path key={`b${i}`} d={poli([a2, a, z, z2])} fill={b.cor2 ? atras(c, b.cor2, i) : sombra(corB(i), 0.5)} />;
    }
    if (b.tipo === 'pijama' && b.cor2) {
      const L = dist(j.joelho[i], j.tornozelo[i]);
      const d: P = [(j.tornozelo[i][0] - j.joelho[i][0]) / L, (j.tornozelo[i][1] - j.joelho[i][1]) / L];
      const n: P = [d[1], -d[0]];
      const [rf, rb] = raioEm(perfis(c, i).coxa, 1);
      const m = add(j.joelho[i], mul(d, L * 0.94));
      const r1 = rf + k.eCanela * 0.75;
      const r2 = rb + k.eCanela * 0.75;
      return <path key={`b${i}`} d={poli([add(m, mul(n, r1)), add(m, mul(n, -r2)), add(add(m, mul(n, -r2)), mul(d, 0.8)), add(add(m, mul(n, r1)), mul(d, 0.8))])} fill={atras(c, b.cor2, i)} />;
    }
    if (b.tipo === 'moletom') {
      const L = dist(j.joelho[i], j.tornozelo[i]);
      const d: P = [(j.tornozelo[i][0] - j.joelho[i][0]) / L, (j.tornozelo[i][1] - j.joelho[i][1]) / L];
      const n: P = [d[1], -d[0]];
      const m = add(j.joelho[i], mul(d, L * 0.88));
      return <path key={`b${i}`} d={poli([add(m, mul(n, 2.9)), add(m, mul(n, -2.9)), add(add(m, mul(n, -2.8)), mul(d, L * 0.12)), add(add(m, mul(n, 2.8)), mul(d, L * 0.12))])} fill={sombra(corB(i), 0.45)} />;
    }
    return null;
  };

  const tras: React.ReactNode[] = [];
  const frente: React.ReactNode[] = [];
  const i0 = 0 as const;
  const i1 = 1 as const;
  if (b.tipo === 'saia') {
    tras.push(pelePerna(i0), calcado(c, i0));
    const sk = saia(c, k);
    frente.push(pelePerna(i1), calcado(c, i1));
    frente.push(<Vol key="saia" id={`${uid}-saia`} ds={[sk]} cor={b.cor} sombra={sombra(b.cor)} s={2.6} luzDir={c.L} />);
    // pregas suaves
    const { j } = c;
    for (const i of [0, 1] as const) {
      const q = j.quadril[i];
      const jo = j.joelho[i];
      const a = add(q, mul(sub(jo, q), 0.35));
      const z = add(q, mul(sub(jo, q), 0.84));
      frente.push(<path key={`pr${i}`} d={`M${a[0]} ${a[1]}L${z[0]} ${z[1]}`} stroke={sombra(b.cor, 0.55)} strokeWidth={0.6} strokeLinecap="round" opacity={0.7} />);
    }
    return { tras, frente };
  }
  for (const i of [0, 1] as const) {
    const out = i === 0 ? tras : frente;
    if (b.tipo === 'short' || (k.fim > 0 && k.fim < 1)) {
      if (b.tipo === 'short') out.push(pelePerna(i));
      else out.push(tornozeloPele(i));
    }
    // a barra da calça cai POR CIMA do calçado (o calçado vem antes); legging e short, não
    const calcaPorCima = k.fim >= 1;
    if (calcaPorCima) out.push(calcado(c, i));
    const ds = pernaRoupa(c, i, k);
    if (i === 1) ds.push(quadrilRoupa(c, k));
    out.push(<Vol key={`pr${i}`} id={`${uid}-pr${i}`} ds={ds} cor={corB(i)} sombra={sombra(corB(i))} s={1.6} luzDir={c.L} />);
    if (i === 1 && (b.tipo === 'legging' || b.tipo === 'short')) {
      // cós (aparece com o top; com a blusa por cima some)
      const { tr } = c;
      const wv = k.cintura;
      const e = Math.max(0.3, k.eCoxa * 0.7);
      const cos = suave([tr.pt(tr.xm(wv, e * 0.6), wv), tr.pt(tr.meio(wv, e) * 0.6, wv + 0.4), tr.pt(tr.xM(wv, e * 0.6), wv), tr.pt(tr.xM(wv - 2.6, e * 0.7), wv - 2.6), tr.pt(tr.meio(wv - 2.6, e) * 0.6, wv - 2.3), tr.pt(tr.xm(wv - 2.6, e * 0.7), wv - 2.6)], true, 0.5);
      out.push(<path key="cos" d={cos} fill={b.cor2 ?? sombra(b.cor, 0.5)} opacity={0.9} />);
    }
    const l = listra(i);
    if (l) out.push(l);
    const br = barra(i);
    if (br) out.push(br);
    if (b.tipo === 'jeans') {
      // costura de fora (pesponto claro)
      const { j } = c;
      const lado = c.j.vista === 'frente' ? (i === 1 ? 1 : -1) : 1;
      const p = perfis(c, i);
      const pts: P[] = [];
      for (const [a, z, perf, t0, t1] of [
        [j.quadril[i], j.joelho[i], p.coxa, 0.12, 1],
        [j.joelho[i], j.tornozelo[i], p.canela, 0, 0.95],
      ] as [P, P, Perfil, number, number][]) {
        const L = dist(a, z);
        const d: P = [(z[0] - a[0]) / L, (z[1] - a[1]) / L];
        const n: P = [d[1], -d[0]];
        for (let s = 0; s <= 4; s++) {
          const t = t0 + ((t1 - t0) * s) / 4;
          const [rf, rb] = raioEm(perf, t);
          pts.push(add(add(a, mul(d, L * t)), mul(n, lado > 0 ? (rf + k.eCoxa) * 0.55 : -(rb + k.eCoxa) * 0.55)));
        }
      }
      if (i === 1 || c.j.vista === 'frente') out.push(<path key={`js${i}`} d={suave(pts, false)} stroke={clara(corB(i), 0.35)} strokeWidth={0.32} strokeDasharray="0.9 0.6" fill="none" opacity={0.8} />);
    }
    if (!calcaPorCima) out.push(calcado(c, i));
  }
  return { tras, frente };
}
