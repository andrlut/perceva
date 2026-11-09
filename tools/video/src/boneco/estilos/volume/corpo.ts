// Volume suave — o corpo: medidas por pessoa (corpo, gênero, idade), o tronco como seções
// elípticas projetadas pela vista, e os membros como tubos que afinam (bíceps, panturrilha).
import type { Juntas, Proporcao } from '../../esqueleto';
import type { Pessoa } from '../../elenco';
import { type P, RAD, clamp, dist, lerp, mixP, suaviza } from './geo';

export type Med = {
  f: boolean;
  idoso: boolean;
  forte: boolean;
  largo: boolean;
  esguio: boolean;
  rPescoco: number;
  rBraco: (t: number) => number;
  rAnte: (t: number) => number;
  rCoxa: (t: number) => number;
  rCanela: (t: number) => number;
  /** meia largura da palma */
  palma: number;
  /** curvatura das costas (idoso: um tico de corcunda) */
  corcunda: number;
  chaves: { v: number; A: number; F: number; B: number }[];
};

/** a proporção da pessoa: o corpo muda as larguras, gênero e idade um pouco a altura */
export function propDaPessoa(base: Proporcao, p: Pessoa): Proporcao {
  const f = p.genero === 'f';
  const idoso = p.idade === 'idoso';
  const OMB = { esguio: 19.5, medio: 21.5, forte: 25, largo: 27 }[p.corpo];
  const QUA = { esguio: 10, medio: 11, forte: 11.4, largo: 14.6 }[p.corpo];
  const alt = (f ? -2.5 : 1) + (idoso ? -3 : 0) + (p.idade === 'jovem' ? 0.5 : 0);
  return {
    ...base,
    ombros: OMB - (f ? 2.2 : 0) - (idoso ? 0.8 : 0),
    quadris: QUA + (f ? 1.4 : 0),
    cabecaLarg: base.cabecaLarg + (p.corpo === 'largo' ? 2.2 : 0) + (f ? -0.6 : 0),
    tronco: base.tronco - (idoso ? 2 : 0) + (f ? -1.2 : 0),
    pescoco: base.pescoco - (idoso ? 1.2 : 0) + (f ? 0.6 : 0),
    coxa: base.coxa + alt * 0.5,
    canela: base.canela + alt * 0.5,
    braco: base.braco + alt * 0.25,
    antebraco: base.antebraco + alt * 0.2,
  };
}

export function medidas(p: Pessoa, prop: Proporcao): Med {
  const f = p.genero === 'f';
  const idoso = p.idade === 'idoso';
  const forte = p.corpo === 'forte';
  const largo = p.corpo === 'largo';
  const esguio = p.corpo === 'esguio';
  const k = { esguio: 0.95, medio: 1.1, forte: 1.22, largo: 1.34 }[p.corpo] * (idoso ? 0.95 : 1);
  const kb = k * (f ? 0.88 : 1) * (forte ? 1.08 : 1);
  const kp = k * (f ? 1.03 : 1) * (largo ? 1.06 : 1);
  const bi = forte ? 1.7 : f ? 0.6 : 1;
  const rBraco = (t: number) => kb * (5.3 - 1.0 * t + 0.45 * bi * Math.sin(Math.PI * clamp(t * 1.1)));
  const rAnte = (t: number) => kb * (4.3 + 0.55 * Math.sin(Math.PI * clamp(t * 1.5)) - 1.25 * t);
  const rCoxa = (t: number) => kp * (8.5 - 2.9 * t + 0.5 * Math.sin(Math.PI * t));
  const rCanela = (t: number) => kp * (5.3 + 1.0 * Math.sin(Math.PI * clamp(t * 1.9)) - 1.85 * t);
  const rPescoco = (f ? 5.0 : 6.0) * (forte ? 1.12 : esguio ? 0.94 : largo ? 1.2 : 1);
  const S = prop.ombros;
  const Q = prop.quadris;
  const hipA = Q + rCoxa(0) * 0.9 + (f ? 1.2 : 0);
  const cintura = f ? hipA * (largo ? 1.0 : 0.74) : lerp(hipA, S, 0.3) * (largo ? 1.12 : forte ? 0.8 : 0.88);
  const barriga = largo ? 11 : 0;
  const busto = f ? (largo ? 4.6 : 3.2) : forte ? 1.2 : 0;
  const bumbum = f ? 2.4 : 0.6;
  const corcunda = idoso ? 2.6 : 0;
  const del = forte ? 3.2 : 2.3;
  const chaves = [
    { v: 1.04, A: rPescoco + 1.4, F: rPescoco * 0.9, B: rPescoco * 1.05 + corcunda * 0.4 },
    { v: 0.99, A: S - 1.5, F: 0.42 * S, B: 0.46 * S + corcunda },
    { v: 0.91, A: S + del, F: 0.5 * S, B: 0.5 * S + corcunda },
    { v: 0.77, A: S - 0.4 + (largo ? 1.5 : 0), F: 0.55 * S + busto + (largo ? 2 : 0), B: 0.5 * S + corcunda * 0.7 },
    { v: 0.6, A: lerp(S - 1.2, cintura, 0.3) + (largo ? 1.5 : 0), F: 0.55 * S + busto * 0.75 + barriga * 0.45, B: 0.47 * S },
    { v: 0.36, A: cintura, F: 0.47 * S + barriga, B: 0.43 * S },
    { v: 0.15, A: lerp(cintura, hipA, 0.72), F: 0.46 * S + barriga * 0.65, B: 0.48 * S + bumbum },
    { v: 0.0, A: hipA, F: 0.45 * S + barriga * 0.25, B: 0.52 * S + bumbum },
    { v: -0.09, A: hipA - 0.8, F: 0.42 * S, B: 0.5 * S + bumbum * 0.8 },
  ];
  return { f, idoso, forte, largo, esguio, rPescoco, rBraco, rAnte, rCoxa, rCanela, palma: kb * 3.7, corcunda, chaves };
}

export type Tronco = {
  T: number;
  w: number;
  s: number;
  /** (u lateral, v pra cima a partir da pélvis) → mundo, dobrando a coluna na cintura */
  mapa: (u: number, v: number) => P;
  /** u da borda do tronco na altura v (lado +1 = frente/direita, −1 = costas/esquerda) */
  borda: (v: number, lado: 1 | -1, folga?: number) => number;
  /** u da linha do meio da frente (botões, decote) */
  meio: (v: number) => number;
  /** amostra um lado de v0 a v1 (unidades), já no mundo */
  lado: (v0: number, v1: number, lado: 1 | -1, folga?: number, n?: number) => P[];
};

export function tronco(j: Juntas, med: Med): Tronco {
  const T = dist(j.pelvis, j.peito);
  const w = j.largura;
  const s = Math.sqrt(Math.max(0, 1 - w * w));
  const am = 1 + 0.05 * j.amassa;
  const tr = j.ang.tronco * RAD;
  const cT = Math.cos(tr);
  const sT = Math.sin(tr);
  const pel = j.pelvis;
  const mapa = (u: number, v: number): P => {
    const k = suaviza(0.05, 0.55, v / T);
    const hip: P = [pel[0] + u, pel[1] - v];
    const ch: P = [pel[0] + u * cT + v * sT, pel[1] + u * sT - v * cT];
    return mixP(hip, ch, k);
  };
  const ks = med.chaves;
  const chave = (v: number) => {
    const x = v / T;
    if (x >= ks[0].v) return ks[0];
    for (let i = 0; i < ks.length - 1; i++) {
      const a = ks[i];
      const b = ks[i + 1];
      if (x <= a.v && x >= b.v) {
        const kk = (a.v - x) / (a.v - b.v);
        const e = kk * kk * (3 - 2 * kk);
        return { v, A: lerp(a.A, b.A, e), F: lerp(a.F, b.F, e), B: lerp(a.B, b.B, e) };
      }
    }
    return ks[ks.length - 1];
  };
  const borda = (v: number, lado: 1 | -1, folga = 0) => {
    const c = chave(v);
    const a = (c.A + folga) * w * am;
    return lado > 0 ? Math.hypot(a, (c.F + folga) * s) : -Math.hypot(a, (c.B + folga) * s);
  };
  const meio = (v: number) => chave(v).F * s * 0.82;
  const lado = (v0: number, v1: number, ld: 1 | -1, folga = 0, n = 6): P[] => {
    // amostra nas alturas das chaves (o deltoide, o busto, a cintura) + o meio entre elas
    const lo = Math.min(v0, v1);
    const hi = Math.max(v0, v1);
    const vs: number[] = [v0, v1];
    for (let i = 1; i < n; i++) vs.push(lerp(v0, v1, i / n));
    for (const kk of ks) {
      const v = kk.v * T;
      if (v > lo + 1 && v < hi - 1) vs.push(v);
    }
    vs.sort((a, b) => (v0 < v1 ? a - b : b - a));
    const limpo: number[] = [];
    for (const v of vs) if (!limpo.length || Math.abs(v - limpo[limpo.length - 1]) > 1.6 || v === vs[vs.length - 1]) limpo.push(v);
    if (limpo.length > 2 && Math.abs(limpo[limpo.length - 1] - limpo[limpo.length - 2]) < 1.6) limpo.splice(limpo.length - 2, 1);
    return limpo.map((v) => mapa(borda(v, ld, folga), v));
  };
  return { T, w, s, mapa, borda, meio, lado };
}
