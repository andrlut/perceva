// "Animação de série" — proporção, físico (larguras de corpo e membros) e o quadro do tronco.
//
// Proporção: ~5,2 cabeças (adulto de série de TV: cabeça um tico grande, corpo de gente).
// O físico NÃO entra na Proporcao do contrato (ela só tem comprimentos e meias larguras dos
// pivôs); raios de braço/perna e o perfil do tronco moram aqui e saem da pessoa.
import type { Juntas, Proporcao } from '../../esqueleto';
import type { Pessoa } from '../../elenco';
import { type P, RAD, add, clamp, dist, mul, norm, sub, suaviza } from './base';

export const PROP: Proporcao = {
  cabeca: 56,
  cabecaLarg: 46.5,
  pescoco: 14,
  tronco: 84,
  ombros: 30,
  quadris: 13,
  braco: 50,
  antebraco: 45,
  mao: 19.5,
  coxa: 72,
  canela: 66,
  tornozelo: 7,
  pe: 30,
};

export function propDe(p: Pessoa): Proporcao {
  const f = p.genero === 'f';
  const ko = { esguio: 0.93, medio: 1, forte: 1.1, largo: 1.08 }[p.corpo];
  const kq = { esguio: 0.94, medio: 1, forte: 1.02, largo: 1.16 }[p.corpo];
  const idoso = p.idade === 'idoso';
  const alt = f ? 0.975 : 1;
  return {
    ...PROP,
    cabecaLarg: PROP.cabecaLarg * (p.corpo === 'largo' ? 1.04 : p.corpo === 'esguio' ? 0.97 : 1) * (f ? 0.97 : 1),
    tronco: PROP.tronco * alt * (idoso ? 0.96 : 1),
    ombros: (f ? 33.5 : 38) * ko * (idoso ? 0.96 : 1),
    quadris: (f ? 16 : 14.2) * kq,
    braco: PROP.braco * alt,
    antebraco: PROP.antebraco * alt,
    coxa: PROP.coxa * alt * (idoso ? 0.98 : 1),
    canela: PROP.canela * alt * (idoso ? 0.98 : 1),
    pe: PROP.pe * (f ? 0.92 : 1),
  };
}

/** [vf (fração do tronco a partir da pélvis), meia largura de frente, fundura da frente, fundura das costas] */
export type Nivel = [number, number, number, number];

export type Fisico = {
  ombros: number;
  quadris: number;
  /** raios do braço: ombro, cotovelo, punho */
  braco: [number, number, number];
  /** raios da coxa: quadril, joelho */
  coxa: [number, number];
  /** canela: raio no joelho, bojo da panturrilha, raio no tornozelo */
  canela: [number, number, number];
  niveis: Nivel[];
  pescoco: number;
  f: boolean;
  idoso: boolean;
  /** barriga (largo/maduro) — dobra da camiseta */
  barriga: number;
};

export function fisicoDe(p: Pessoa, prop: Proporcao): Fisico {
  const f = p.genero === 'f';
  const c = p.corpo;
  const lb = { esguio: 0.9, medio: 1, forte: 1.28, largo: 1.24 }[c];
  const lp = { esguio: 0.92, medio: 1, forte: 1.14, largo: 1.28 }[c];
  const braco = (f ? [8.0, 5.9, 4.3] : [9.0, 6.7, 4.9]).map((x, i) => x * (i === 2 ? Math.sqrt(lb) : lb)) as [number, number, number];
  const coxa = (f ? [14.0, 7.8] : [13.2, 8.2]).map((x) => x * lp) as [number, number];
  const canela = (f ? [7.6, 2.4, 4.4] : [8.2, 2.6, 4.8]).map((x) => x * Math.sqrt(lp)) as [number, number, number];
  const quadril = prop.quadris + coxa[0] + 0.4;
  // perfil do tronco [vf, W, F, B]
  const N: Nivel[] = f
    ? [
        [-0.17, quadril * 0.8, 11, 16],
        [0, quadril, 14, 19],
        [0.2, quadril * 0.9, 13.5, 15.5],
        [0.42, 21, 12.5, 12],
        [0.66, 25, 18, 13.5],
        [0.84, 26, 14.5, 13],
        [1.0, 9.6, 7, 7.6],
      ]
    : [
        [-0.17, quadril * 0.8, 11, 15],
        [0, quadril, 14, 17],
        [0.2, quadril * 0.94, 14, 15],
        [0.42, 23.5, 14, 13],
        [0.66, 28.5, 16.5, 15.5],
        [0.84, 30, 14, 14.5],
        [1.0, 10.8, 7.6, 8.2],
      ];
  const mult = (vf: number, kw: number, kf: number, kb: number) => {
    const n = N.find((x) => x[0] === vf)!;
    n[1] *= kw;
    n[2] *= kf;
    n[3] *= kb;
  };
  let barriga = 0;
  // o tronco é um tico mais cheio que o de gente de verdade: a cabeça de série é grande, e um
  // corpo "real" do lado dela parece magricela
  N.forEach((n) => n[0] > 0.1 && ((n[1] *= 1.1), (n[2] *= 1.12), (n[3] *= 1.12)));
  if (c === 'esguio') N.forEach((n) => n[0] > 0.1 && ((n[1] *= 0.94), (n[2] *= 0.93), (n[3] *= 0.93)));
  if (c === 'forte') {
    mult(0.42, 1.04, 1.04, 1.04);
    mult(0.66, 1.13, 1.16, 1.08);
    mult(0.84, 1.15, 1.12, 1.1);
    mult(1.0, 1.18, 1.1, 1.18);
  }
  if (c === 'largo') {
    // volume distribuído (peito, costas, quadril, cintura) com a curva ALTA — uma bola baixa na
    // barriga, de perfil, lia gravidez
    mult(-0.17, 1.08, 1.12, 1.16);
    mult(0, 1.04, 1.14, 1.16);
    mult(0.2, 1.18, 1.45, 1.2);
    mult(0.42, 1.34, 1.62, 1.24);
    mult(0.66, 1.2, 1.4, 1.22);
    mult(0.84, 1.12, 1.2, 1.16);
    mult(1.0, 1.18, 1.12, 1.14);
    barriga = 1;
  }
  if (p.idade === 'maduro') {
    mult(0.42, 1.05, 1.1, 1);
    barriga = Math.max(barriga, 0.4);
  }
  const idoso = p.idade === 'idoso';
  if (idoso) {
    // um tico de curva nas costas (digno, não caricato)
    N.find((x) => x[0] === 0.84)![3] += 2.4;
    N.find((x) => x[0] === 1.0)![3] += 2.2;
    N.find((x) => x[0] === 0.66)![2] -= 0.6;
  }
  const pescoco = (f ? 6.3 : 7.5) * (c === 'forte' ? 1.14 : c === 'largo' ? 1.12 : c === 'esguio' ? 0.93 : 1);
  return { ombros: prop.ombros, quadris: prop.quadris, braco, coxa, canela, niveis: N, pescoco, f, idoso, barriga };
}

// ------------------------------------------------------------------ o quadro do tronco

/**
 * O tronco é um "cilindro" de seções elípticas (meia largura W, fundura da frente F e das costas
 * B por nível) girado pela vista: de frente aparece W; de perfil, F + B. Visto de 3/4, a borda
 * da frente é √((W·w)² + (F·s)²), com w = j.largura (cos do giro) e s = sen do giro.
 * A pélvis não gira (quadris horizontais); a seção vai girando com o peito do meio pra cima.
 */
export type Tronco = {
  T: number;
  w: number;
  s: number;
  /** (u, vf) → mundo: u na largura (+ = pra +x), vf = fração do tronco (0 pélvis, 1 base do pescoço) */
  P: (u: number, vf: number) => P;
  W: (vf: number) => number;
  F: (vf: number) => number;
  B: (vf: number) => number;
  /** borda da frente (+x) e de trás (−x), com folga `e` */
  xr: (vf: number, e?: number) => number;
  xl: (vf: number, e?: number) => number;
  /** ponto na superfície da FRENTE: `lado` de −W a W (como se visto de frente), `dz` = pra fora */
  frente: (lado: number, vf: number, dz?: number) => P;
  /** u de um ponto da frente (pra montar formas em (u, vf)) */
  uFrente: (lado: number, vf: number, dz?: number) => number;
  /** centro do pescoço (u) e raio */
  nc: number;
  nr: number;
  /** cantos dos ombros (u) */
  cantoR: (e?: number) => number;
  cantoL: (e?: number) => number;
};

export function troncoDe(j: Juntas, fis: Fisico): Tronco {
  const T = dist(j.pelvis, j.peito) || 1;
  const up = norm(sub(j.peito, j.pelvis));
  const w = j.largura;
  const s = Math.sqrt(Math.max(0, 1 - w * w));
  const am = 1 + 0.05 * j.amassa;
  const tr = j.ang.tronco;
  const P = (u: number, vf: number): P => {
    const c = add(j.pelvis, mul(up, vf * T));
    const a = tr * suaviza(0, 0.62, vf) * RAD;
    return [c[0] + Math.cos(a) * u, c[1] + Math.sin(a) * u];
  };
  const N = fis.niveis;
  const it = (vf: number, k: 1 | 2 | 3) => {
    if (vf <= N[0][0]) return N[0][k];
    for (let i = 0; i < N.length - 1; i++) {
      const a = N[i];
      const b = N[i + 1];
      if (vf <= b[0]) {
        const x = (vf - a[0]) / (b[0] - a[0]);
        // interpolação suave entre níveis (o tronco não fica facetado)
        const e = x * x * (3 - 2 * x);
        return a[k] + (b[k] - a[k]) * e;
      }
    }
    return N[N.length - 1][k];
  };
  const W = (vf: number) => it(vf, 1) * am;
  const F = (vf: number) => it(vf, 2);
  const B = (vf: number) => it(vf, 3);
  const xr = (vf: number, e = 0) => Math.hypot(W(vf) * w, F(vf) * s) + e;
  const xl = (vf: number, e = 0) => -(Math.hypot(W(vf) * w, B(vf) * s) + e);
  const nr = fis.pescoco;
  const nc = -s * nr * 0.35;
  const uFrente = (lado: number, vf: number, dz = 0) => {
    const Wv = Math.max(W(vf), Math.abs(lado) + 0.5);
    const dep = F(vf) * Math.sqrt(clamp(1 - (lado / Wv) ** 2)) + dz;
    return lado * w + dep * s;
  };
  const frente = (lado: number, vf: number, dz = 0) => P(uFrente(lado, vf, dz), vf);
  const r0 = fis.braco[0];
  const cantoR = (e = 0) => Math.max(fis.ombros * w * am + r0 * 0.5, xr(0.84)) + e;
  const cantoL = (e = 0) => Math.min(-(fis.ombros * w * am + r0 * 0.5), xl(0.84)) - e;
  return { T, w, s, P, W, F, B, xr, xl, frente, uFrente, nc, nr, cantoR, cantoL };
}

/** sinais de movimento pro movimento secundário (cabelo, cordão, saia) — sem estado: sai da pose */
export type Mov = {
  /** ângulo do que pende solto (graus; + = pra +x): pra trás quando o corpo inclina e corre */
  balanco: number;
  /** quanto o corpo está acima do normal (fração da altura): o cabelo "flutua" no voo */
  sobe: number;
  /** 0 parado … 1 correndo */
  corrida: number;
  /** oscilação defasada da passada (−1..1) */
  osc: number;
};

export function movDe(j: Juntas, prop: Proporcao, t: number, seed: number): Mov {
  const pernaH = prop.tornozelo + prop.canela + prop.coxa;
  const sobe = -(j.pelvis[1] + pernaH) / j.altura;
  const sep = j.ang.coxa[1] - j.ang.coxa[0];
  const b0 = j.ang.coxa[0] - j.ang.canela[0];
  const b1 = j.ang.coxa[1] - j.ang.canela[1];
  const corrida = clamp((Math.abs(sep) + Math.abs(b0 - b1) * 0.5) / 70);
  const lag = 1.1;
  const osc = (sep / 80) * Math.cos(lag) + ((b0 - b1) / 110) * Math.sin(lag);
  const idle = Math.sin(t / 29 + seed * 6.28) * 2.2 + Math.sin(t / 13 + seed * 3) * 0.7;
  const balanco = -Math.max(0, j.ang.tronco) * 1.5 - corrida * 14 + osc * 12 * corrida + idle;
  return { balanco, sobe, corrida, osc };
}
