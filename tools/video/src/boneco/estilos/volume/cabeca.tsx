// Volume suave — a cabeça: crânio + mandíbula projetados pelo giro (frente/3-4/perfil) e o
// ROSTO DE CADA UM (rodada 3: o painel via "o mesmo olho de anime" em todo mundo, homem de
// delineador e Bia/Lúcia como a Marina recolorida). Cada pessoa tem o seu formato de olho
// (largura, altura, pálpebra caída, inclinação, cor e tamanho da íris), de nariz, de lábio e de
// rosto; cílio só nas mulheres; rubor só na emoção. Mais: sobrancelha, orelha, barba de contorno
// contínuo, óculos, cabelo com volume e brilho, boné/faixa/fone/brinco, e o DEDO NA PELE (a
// bochecha afunda: meia-lua de sombra do lado de lá da luz, borda estufada pegando luz, a marca
// rosada que fica e some devagar, o olho daquele lado aperta).
//
// Tudo nas coordenadas da cabeça: origem no centro (j.cabeca), girada com a cabeça
// (j.ang.cabeca), y pra baixo. Boca na âncora j.boca e bochecha na j.bochecha (ROSTO do
// esqueleto): é ali que o copo encosta e o dedo aperta.
import React from 'react';
import { type Humor, type Juntas, type Proporcao, type Vista, ROSTO } from '../../esqueleto';
import type { Pessoa, Roupa } from '../../elenco';
import { type P, RAD, casco, cachos, clamp, dist, elipse, gira, hash, lerp, poli, reamostra, soma, suave, sub } from './geo';
import { type Mat, ajusta, lum, material, mistura } from './cor';
import { type Kit, Vol } from './kit';
import type { Med } from './corpo';
import { type CabeloGeo, type Giro, cabeloGeo, giroDe, projeta3 } from './cabelo';

export const GIRO: Record<Vista, number> = { frente: 0, 'tres-quartos': 28, perfil: 90 };

type Boca = 'sorriso' | 'aberto' | 'caido' | 'apertado' | 'o' | 'cerrado' | 'entreaberta';
type Expr = { abre: number; baixo: number; sob: number; incl: number; arco: number; boca: Boca; rubor: number; escala: number };
// focado ≠ ok: sobrancelha baixa e reta, olho um tico estreito (as duas pálpebras), lábios
// apertados. Cansado: pálpebra a meio-mastro, sobrancelha RETA (não triste), boca caída de leve.
const HUMOR: Record<Humor, Expr> = {
  ok: { abre: 0.9, baixo: 0.12, sob: 0, incl: 0, arco: 1, boca: 'sorriso', rubor: 0, escala: 1 },
  feliz: { abre: 0.86, baixo: 0.5, sob: 0.025, incl: 0.004, arco: 1.1, boca: 'aberto', rubor: 0.7, escala: 1 },
  cansado: { abre: 0.48, baixo: 0.05, sob: -0.012, incl: 0, arco: 0.3, boca: 'caido', rubor: 0, escala: 1 },
  focado: { abre: 0.62, baixo: 0.3, sob: -0.036, incl: -0.003, arco: 0.2, boca: 'apertado', rubor: 0, escala: 1 },
  surpresa: { abre: 1, baixo: 0, sob: 0.06, incl: 0.012, arco: 1.6, boca: 'o', rubor: 0.15, escala: 1.12 },
};

/** o rosto de cada um: olho, nariz, lábio, formato */
type Feicao = {
  olho: { larg: number; alt: number; iris: number; caido: number; inclina: number; cor: string };
  nariz: 'fino' | 'medio' | 'largo' | 'longo';
  labio: 'fino' | 'medio' | 'cheio';
  rosto: 'oval' | 'quadrado' | 'redondo' | 'fino';
  sobr: number;
};
const FEICOES: Record<string, Feicao> = {
  marina: { olho: { larg: 1, alt: 1, iris: 0.66, caido: 0, inclina: 0.05, cor: '#7A4E30' }, nariz: 'fino', labio: 'medio', rosto: 'oval', sobr: 0.9 },
  caio: { olho: { larg: 1.04, alt: 0.8, iris: 0.62, caido: 0.12, inclina: 0, cor: '#3E2618' }, nariz: 'largo', labio: 'cheio', rosto: 'quadrado', sobr: 1.25 },
  bia: { olho: { larg: 1.1, alt: 0.92, iris: 0.64, caido: 0, inclina: 0.1, cor: '#3A2214' }, nariz: 'largo', labio: 'cheio', rosto: 'fino', sobr: 0.85 },
  theo: { olho: { larg: 0.98, alt: 0.78, iris: 0.6, caido: 0.34, inclina: -0.03, cor: '#6E6034' }, nariz: 'medio', labio: 'medio', rosto: 'quadrado', sobr: 1.3 },
  lucia: { olho: { larg: 1, alt: 1, iris: 0.66, caido: 0.1, inclina: 0, cor: '#4E301E' }, nariz: 'largo', labio: 'cheio', rosto: 'redondo', sobr: 1 },
  rafa: { olho: { larg: 0.92, alt: 0.74, iris: 0.6, caido: 0, inclina: 0, cor: '#4E6680' }, nariz: 'medio', labio: 'fino', rosto: 'redondo', sobr: 1.1 },
  celia: { olho: { larg: 0.9, alt: 0.8, iris: 0.52, caido: 0.28, inclina: 0, cor: '#3A2418' }, nariz: 'largo', labio: 'medio', rosto: 'redondo', sobr: 0.85 },
  antonio: { olho: { larg: 0.88, alt: 0.72, iris: 0.5, caido: 0.4, inclina: -0.04, cor: '#5E6E5E' }, nariz: 'longo', labio: 'fino', rosto: 'quadrado', sobr: 1.2 },
};
const feicaoDe = (p: Pessoa, med: Med): Feicao =>
  FEICOES[p.id] ?? {
    olho: { larg: 1, alt: med.f ? 1 : 0.82, iris: med.idoso ? 0.52 : 0.64, caido: med.idoso ? 0.3 : 0, inclina: 0, cor: '#5A3A28' },
    nariz: 'medio',
    labio: med.f ? 'medio' : 'fino',
    rosto: med.largo ? 'redondo' : 'oval',
    sobr: med.f ? 0.9 : 1.15,
  };

export type CabCtx = {
  k: Kit;
  j: Juntas;
  prop: Proporcao;
  med: Med;
  pessoa: Pessoa;
  roupa: Roupa;
  humor: Humor;
  t: number;
  uid: string;
  toque?: { ponto: [number, number]; forca: number; marca: number };
  /** arrasto do cabelo (corrida) 0..1 */
  arrasto: number;
  segura?: 'halter' | 'copo';
};

/** mundo → coordenadas da cabeça */
export const paraCabeca = (j: Juntas, p: P): P => gira(sub(p, j.cabeca), -j.ang.cabeca);
export const daCabeca = (j: Juntas, p: P): P => soma(j.cabeca, gira(p, j.ang.cabeca));

/** o contorno da cabeça (sem cabelo) nas coordenadas dela */
export function contornoCabeca(vista: Vista, W: number, H: number, med: Med, g: Giro, fe?: Feicao): P[] {
  const pts: P[] = [];
  const rosto = fe?.rosto ?? 'oval';
  const nz = fe?.nariz ?? 'medio';
  // crânio: elipsoide (0,5W × 0,44H × 0,56W) um tico atrás do rosto
  const hw = Math.hypot(0.5 * W * g.c, 0.56 * W * g.s);
  const x0 = -0.04 * W * g.s;
  const cy = -0.06 * H;
  if (vista === 'perfil') {
    // o perfil é desenhado: o crânio da testa, por cima, até a nuca; depois queixo, lábios, nariz
    for (let a = -18; a >= -205; a -= 8) pts.push([x0 + Math.cos(a * RAD) * hw, cy + Math.sin(a * RAD) * 0.44 * H]);
    const ponta = { fino: [0.57, 0.15], medio: [0.585, 0.15], largo: [0.592, 0.158], longo: [0.605, 0.172] }[nz];
    const qq = rosto === 'quadrado' ? 0.455 : 0.44;
    const f: P[] = [
      [-0.46, 0.2],
      [-0.3, 0.33],
      [-0.1, 0.42],
      [0.16, 0.49],
      [0.34, 0.505],
      [qq, 0.45],
      [0.43, 0.37],
      [0.465, 0.31],
      [0.44, 0.278],
      [0.475, 0.248],
      [0.47, 0.205],
      [nz === 'largo' ? 0.545 : 0.53, ponta[1] + 0.04],
      [ponta[0], ponta[1]],
      [0.54, 0.07],
      [0.49, -0.01],
      [0.505, -0.09],
    ];
    return [...pts, ...f.map(([x, y]) => [x * W, y * H] as P)];
  }
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    pts.push([x0 + Math.cos(a) * hw, cy + Math.sin(a) * 0.44 * H]);
  }
  const F = {
    oval: { jx: med.f ? 0.33 : 0.355, qx: med.f ? 0.13 : 0.15, qy: med.f ? 0.49 : 0.5, bx: 0.48 },
    quadrado: { jx: 0.41, qx: 0.2, qy: 0.5, bx: 0.49 },
    redondo: { jx: 0.39, qx: 0.17, qy: 0.49, bx: 0.51 },
    fino: { jx: 0.31, qx: 0.11, qy: 0.51, bx: 0.47 },
  }[rosto];
  const mand: [number, number, number][] = [
    [F.jx, 0.33, 0.1],
    [-F.jx, 0.33, 0.1],
    [0.43, 0.18, -0.12],
    [-0.43, 0.18, -0.12],
    [F.bx, 0.1, 0.17],
    [-F.bx, 0.1, 0.17],
  ];
  // o queixo como um arco (sem ponta no 3/4)
  for (let a = -90; a <= 90; a += 15) {
    const s = Math.sin(a * RAD);
    const c = Math.cos(a * RAD);
    mand.push([F.qx * s * 1.15, F.qy - 0.05 * (1 - c), 0.3 - 0.08 * (1 - c)]);
  }
  for (const [x, y, z] of mand) pts.push(projeta3(g, x * W, y * H, z * W).p);
  return casco(pts);
}

/** o olho: a região visível entre as pálpebras (branco ou íris), a linha da pálpebra e a altura */
function olho(c: P, rx: number, ry: number, abre: number, baixo: number, ref?: { c: P; rx: number; ry: number }, caido = 0, fora = 1) {
  // as pálpebras são as do branco do olho (`ref`): a íris é cortada pelas mesmas linhas.
  // `caido` baixa a pálpebra de cima no canto de FORA (o olho de pálpebra pesada)
  const R = ref ?? { c, rx, ry };
  const N = 16;
  const topo: P[] = [];
  const base: P[] = [];
  const Ly = R.c[1] - R.ry + (1 - abre) * 2 * R.ry;
  const Ky = R.c[1] + R.ry - baixo * 1.7 * R.ry;
  for (let i = 0; i <= N; i++) {
    const x = -rx + (2 * rx * i) / N;
    const e = Math.sqrt(Math.max(0, 1 - (x / rx) ** 2));
    const u = clamp((c[0] + x - R.c[0]) / R.rx, -1, 1);
    const pesa = caido * R.ry * 0.9 * Math.max(0, u * fora) ** 1.3;
    const top = Math.max(c[1] - ry * e, Ly + 0.32 * R.ry * u * u + pesa);
    const bot = Math.min(c[1] + ry * e, Ky + (R.c[1] + R.ry - Ky) * u * u);
    if (bot - top > 0.04 * ry) {
      topo.push([c[0] + x, top]);
      base.push([c[0] + x, bot]);
    }
  }
  const alturaMeio = Math.min(c[1] + ry, Ky) - Math.max(c[1] - ry, Ly);
  return { fechado: topo.length < 3 || alturaMeio < 0.22 * ry, topo, base, alturaMeio, topoY: Math.max(c[1] - ry, Ly) };
}

const fmt = (x: number) => Math.round(x * 100) / 100;

/** meia-lua em volta de `c`, do lado `ang` (graus, tela): raio `r`, espessura `e` no meio, afinando nas pontas */
function meiaLua(c: P, r: number, e: number, ang: number, abertura = 80): string {
  const fora: P[] = [];
  const dentro: P[] = [];
  for (let q = 0; q <= 14; q++) {
    const a = ang - abertura + (2 * abertura * q) / 14;
    const k = Math.cos(((a - ang) / abertura) * (Math.PI / 2));
    const ux = Math.cos(a * RAD);
    const uy = Math.sin(a * RAD);
    fora.push([c[0] + ux * (r + e * k * 0.5), c[1] + uy * (r + e * k * 0.5)]);
    dentro.push([c[0] + ux * (r - e * k * 0.5), c[1] + uy * (r - e * k * 0.5)]);
  }
  return suave([...fora, ...dentro.reverse()]);
}

export function cabeca(c: CabCtx) {
  const { k, j, prop, med, pessoa, roupa, humor, t } = c;
  const W = prop.cabecaLarg;
  const H = prop.cabeca;
  const vista = j.vista;
  const g = giroDe(GIRO[vista]);
  const ang = j.ang.cabeca;
  const tf = `translate(${fmt(j.cabeca[0])} ${fmt(j.cabeca[1])}) rotate(${fmt(ang)})`;
  const pele = material(pessoa.pele, 'pele');
  const escura = lum(pessoa.pele) < 0.42;
  const cab = material(pessoa.corCabelo, 'cabelo');
  const grisalho = lum(pessoa.corCabelo) > 0.7;
  const fe = feicaoDe(pessoa, med);
  // esforço: o halter trava a mandíbula; a corrida entreabre a boca
  const halter = c.segura === 'halter';
  const correndo = c.arrasto > 0.5;
  const ex0 = HUMOR[humor];
  const ex: Expr = halter ? { ...ex0, boca: 'cerrado', sob: -0.03, arco: 0.3, baixo: Math.max(ex0.baixo, 0.28), abre: Math.min(ex0.abre, 0.7), rubor: 0.2 } : correndo && ex0.boca !== 'aberto' ? { ...ex0, boca: 'entreaberta' } : ex0;
  const P3 = (x: number, y: number, z: number) => projeta3(g, x * W, y * H, z * W);
  const vira = (x: number, z: number) => (-x * g.s + z * g.c) / Math.hypot(x, z);
  const esp = k.espelho ? -1 : 1; // lado da luz (pros brilhos)

  // ---- contorno (com a bochecha cedendo ao dedo)
  let cont = contornoCabeca(vista, W, H, med, g, fe);
  const toqueLocal = c.toque ? paraCabeca(j, c.toque.ponto) : null;
  const aperto = c.toque ? clamp(c.toque.forca) : 0;
  const marca = c.toque ? clamp(c.toque.marca) : 0;
  if (toqueLocal && aperto > 0) {
    // perto da borda do rosto, a borda cede pra dentro junto com o dedo
    const centro: P = [0, 0.05 * H];
    cont = reamostra(cont, 0.8).map((p) => {
      const d = dist(p, toqueLocal);
      const dir = sub(p, centro);
      const n = Math.hypot(dir[0], dir[1]) || 1;
      const dentro = 0.035 * W * aperto * Math.exp(-((d / (0.16 * W)) ** 2));
      return soma(p, [(-dir[0] / n) * dentro, (-dir[1] / n) * dentro]);
    });
  }
  const dCab = suave(cont);
  const recCab = k.recorte([dCab]);
  // o recorte da cabeça vive nas coordenadas dela: o clipPath é aplicado dentro do grupo girado

  // ---- cabelo
  const grav: P = [Math.sin(ang * RAD), Math.cos(ang * RAD)];
  const cg: CabeloGeo = cabeloGeo(pessoa.cabelo, W, H, g, { grav, arrasto: c.arrasto, t, idoso: med.idoso, esp });
  const borda = (pts: P[]) => (cg.cacho ? suave(cachos(pts, cg.cacho, cg.ondaCacho, hash(pessoa.id) * 4)) : suave(pts));
  const curtoFill =
    pessoa.cabelo === 'curto'
      ? k.linCaixa(esp > 0 ? 0.15 : 0.85, 0, esp > 0 ? 0.6 : 0.4, 1, [
          [0, cab.luz],
          [0.45, cab.base],
          [0.82, cab.base, 0.96],
          [1, cab.sombra, 0.62],
        ])
      : null;
  const fadeFill = cg.fade
    ? k.linCaixa(0, 0, 0, 1, [
        [0, cab.luz],
        [0.42, cab.base],
        [0.62, cab.base, 0.85],
        [1, cab.base, 0.18],
      ])
    : null;
  const fillCab =
    fadeFill ??
    curtoFill ??
    (cg.calvo
      ? k.linCaixa(0, 0, 0, 1, [
          [0, cab.base, 0.3],
          [0.3, cab.sombra, 0.95],
          [1, cab.fundo, 1],
        ])
      : k.bolha(cab, 0.9));
  const fillTras = k.linCaixa(esp > 0 ? 0.2 : 0.8, 0, esp > 0 ? 0.8 : 0.2, 1, [
    [0, cab.base],
    [0.65, cab.sombra],
    [1, cab.sombra],
  ]);

  // ---- olhos e sobrancelhas (de cada um)
  const olhoX = 0.2;
  const ery = 0.08 * H * ex.escala * fe.olho.alt;
  const erx = 0.066 * W * ex.escala;
  const piscar = (() => {
    const ph = (((t + 60) % 120) + 120) % 120;
    return ph < 5 ? [0.5, 1, 1, 0.7, 0.3][Math.floor(ph)] : 0;
  })();
  const fecha = Math.max(j.fecha, piscar);
  const corIris = k.radCaixa(
    0.5,
    0.45,
    0.55,
    [
      [0, '#0E0810'],
      [0.42, '#140C14'],
      [0.5, ajusta(fe.olho.cor, -0.05)],
      [0.82, fe.olho.cor],
      [1, ajusta(fe.olho.cor, -0.18)],
    ],
    `iris${fe.olho.cor}`,
  );
  const corCilio = '#160E1A';
  const corPalp = mistura(pele.fundo, '#1A1018', 0.5);
  const corBranco = k.linCaixa(
    0,
    0,
    0,
    1,
    [
      [0, '#D8D2EA'],
      [0.42, '#FFFFFF'],
      [1, '#F4F1FA'],
    ],
    'branco',
  );
  const corSobr = grisalho ? '#8D8A9C' : ajusta(pessoa.corCabelo, lum(pessoa.corCabelo) < 0.2 ? 0.02 : -0.08, 0.05);
  const olhos: React.ReactNode[] = [];
  const sobrs: React.ReactNode[] = [];
  const rugas: React.ReactNode[] = [];
  for (const lado of [-1, 1] as const) {
    const q = P3(lado * olhoX, -0.005, 0.37);
    const f = vira(lado * olhoX, 0.37) / 0.88;
    if (f < 0.2) continue;
    const fx = clamp(f, 0.55, 1.1);
    const centro: P = q.p;
    const rx = erx * fx;
    // o dedo apertando a bochecha empurra a pálpebra de baixo daquele olho (e um tico a de cima)
    const perto = toqueLocal ? clamp(1 - dist(centro, toqueLocal) / (0.5 * W)) : 0;
    const baixo = clamp(ex.baixo + perto * aperto * 0.42);
    const abre = ex.abre * (med.idoso ? 0.92 : 1) * (1 - fecha) * (1 - perto * aperto * 0.18);
    const rxB = rx * 1.3 * fe.olho.larg;
    const giroOlho = -lado * fe.olho.inclina * 90 * (vista === 'perfil' ? 0.5 : 1);
    const grupo: React.ReactNode[] = [];
    const o = olho(centro, rxB, ery, abre, baixo, undefined, fe.olho.caido, lado);
    const ri = rxB * fe.olho.iris;
    const cIris: P = [centro[0] + (vista === 'frente' ? 0 : 0.16 * rxB), centro[1] + 0.03 * ery];
    const oi = olho(cIris, ri, Math.min(ri * 1.08, ery * 0.98), abre, baixo, { c: centro, rx: rxB, ry: ery }, fe.olho.caido, lado);
    if (o.fechado) {
      // olho fechado: um arco suave pra baixo (piscar, dormir, esforço)
      const y0 = centro[1] + ery * 0.25;
      grupo.push(<path key="f" d={`M${fmt(centro[0] - rxB)} ${fmt(y0)}Q${fmt(centro[0])} ${fmt(y0 + ery * 0.5)} ${fmt(centro[0] + rxB)} ${fmt(y0)}`} stroke={med.f ? corCilio : corPalp} strokeWidth={med.f ? 0.75 : 0.6} strokeLinecap="round" fill="none" />);
    } else {
      grupo.push(<path key="w" d={poli([...o.topo, ...[...o.base].reverse()])} fill={corBranco} />);
      if (oi.topo.length > 2) grupo.push(<path key="i" d={poli([...oi.topo, ...[...oi.base].reverse()])} fill={corIris} />);
      const hb = oi.alturaMeio;
      if (hb > 0.4 * ery) {
        const bx = cIris[0] - esp * 0.32 * ri;
        const by = oi.topoY + hb * 0.3;
        grupo.push(<ellipse key="b" cx={bx} cy={by} rx={ri * 0.3} ry={ri * 0.34} fill="#FFFFFF" opacity={0.92} />);
        grupo.push(<circle key="b2" cx={cIris[0] + esp * 0.34 * ri} cy={oi.topoY + hb * 0.72} r={ri * 0.12} fill="#FFFFFF" opacity={0.6} />);
      }
      // a linha da pálpebra: cílio (grosso, com o risquinho no canto) só nas mulheres; nos
      // homens uma linha fina da cor da pele escurecida (sem cara de delineador)
      const tp = o.topo;
      if (tp.length > 1) {
        const ultimo = lado > 0 ? tp[tp.length - 1] : tp[0];
        const flick = med.f ? `L${fmt(ultimo[0] + lado * rxB * 0.28)} ${fmt(ultimo[1] - ery * 0.22)}` : '';
        const dc = lado > 0 ? `${poli(tp, false)}${flick}` : `${poli([...tp].reverse(), false)}${flick}`;
        grupo.push(<path key="c" d={dc} stroke={med.f ? corCilio : corPalp} strokeWidth={med.f ? (med.idoso ? 0.7 : 0.85) : 0.55} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={med.f ? 1 : 0.85} />);
      }
      // a dobra da pálpebra pesada (Theo, Seu Antônio, Dona Célia)
      if (fe.olho.caido > 0.2 || med.idoso) {
        const yD = Math.min(...o.topo.map((p) => p[1])) - ery * 0.32;
        grupo.push(<path key="d" d={`M${fmt(centro[0] - lado * rxB * 0.2)} ${fmt(yD)}Q${fmt(centro[0] + lado * rxB * 0.5)} ${fmt(yD - ery * 0.08)} ${fmt(centro[0] + lado * rxB * 1.05)} ${fmt(yD + ery * 0.45)}`} stroke={pele.fundo} strokeWidth={0.45} strokeLinecap="round" fill="none" opacity={0.55} />);
      }
    }
    olhos.push(
      <g key={`o${lado}`} transform={`rotate(${fmt(giroOlho)} ${fmt(centro[0])} ${fmt(centro[1])})`}>
        {grupo}
      </g>,
    );
    // sobrancelha: afina pra fora; o humor sobe/desce e endireita (focado: baixa e reta)
    const by = centro[1] - 0.13 * H - ex.sob * H;
    const dentro = -lado;
    const L = 0.115 * W * fx * (med.f ? 1 : 1.05) * (0.92 + 0.08 * fe.olho.larg);
    const xi = centro[0] + dentro * L * 0.95;
    const xo = centro[0] - dentro * L * 1.05;
    const espI = (med.f ? 0.042 : 0.052) * H * fe.sobr;
    const espO = (med.f ? 0.02 : 0.028) * H * fe.sobr;
    const sb: P[] = [];
    const sb2: P[] = [];
    for (let i = 0; i <= 8; i++) {
      const s = i / 8;
      const x = lerp(xi, xo, s);
      const arco = -Math.sin(Math.PI * clamp(s * 0.9 + 0.1)) * 0.028 * H * ex.arco * (med.f ? 1.15 : 0.85);
      const incl = (1 - s) * -ex.incl * H;
      const y = by + arco + incl;
      const e = lerp(espI, espO, s);
      sb.push([x, y - e / 2]);
      sb2.push([x, y + e / 2]);
    }
    sobrs.push(<path key={`s${lado}`} d={suave([...sb, ...sb2.reverse()])} fill={corSobr} />);
    if (med.idoso) {
      // pés de galinha discretos no canto de fora
      const cx = centro[0] - dentro * rxB * 1.1;
      rugas.push(
        <path key={`r${lado}`} d={`M${fmt(cx)} ${fmt(centro[1] - ery * 0.1)}l${fmt(-dentro * rx * 0.5)} ${fmt(-ery * 0.25)}M${fmt(cx)} ${fmt(centro[1] + ery * 0.25)}l${fmt(-dentro * rx * 0.55)} ${fmt(ery * 0.15)}`} stroke={pele.fundo} strokeWidth={0.38} strokeLinecap="round" opacity={0.5} fill="none" />,
      );
    }
  }

  // ---- boca (na âncora do esqueleto), com o lábio de cada um
  const ancB: P = [ROSTO[vista].boca[0] * W, ROSTO[vista].boca[1] * H];
  const fBoca = vista === 'frente' ? 1 : vista === 'tres-quartos' ? 0.86 : 0.42;
  const largL = fe.labio === 'cheio' ? 1.12 : fe.labio === 'fino' ? 0.92 : 1;
  const mw = 0.25 * W * fBoca * largL;
  const corLabio = ajusta(pessoa.pele, escura ? -0.08 : -0.06, escura ? 0 : 0.06, 352, escura ? 4 : 10);
  const corLinha = ajusta(pessoa.pele, escura ? -0.26 : -0.34, -0.02, 350, 6);
  const boca: React.ReactNode[] = [];
  const bx = vista === 'perfil' ? ancB[0] - mw * 0.35 : ancB[0];
  const by = ancB[1];
  const cheio = fe.labio === 'cheio' ? 1 : fe.labio === 'medio' ? 0.55 : 0;
  // lábio de baixo (cheio ou médio) e de cima (cheio), por baixo da linha da boca
  const labios = () => {
    if (cheio <= 0) return;
    const yl = by + 0.016 * H;
    boca.push(<path key="lb" d={`M${fmt(bx - mw * 0.36)} ${fmt(yl - 0.004 * H)}Q${fmt(bx)} ${fmt(yl + 0.06 * H * cheio)} ${fmt(bx + mw * 0.36)} ${fmt(yl - 0.004 * H)}Z`} fill={corLabio} />);
    boca.push(<ellipse key="lbb" cx={bx - esp * mw * 0.08} cy={yl + 0.022 * H * cheio} rx={mw * 0.12} ry={0.007 * H} fill="#FFFFFF" opacity={0.22} />);
    if (fe.labio === 'cheio') {
      const yu = by - 0.002 * H;
      boca.push(<path key="lc" d={`M${fmt(bx - mw * 0.44)} ${fmt(yu + 0.004 * H)}Q${fmt(bx - mw * 0.2)} ${fmt(yu - 0.034 * H)} ${fmt(bx)} ${fmt(yu - 0.018 * H)}Q${fmt(bx + mw * 0.2)} ${fmt(yu - 0.034 * H)} ${fmt(bx + mw * 0.44)} ${fmt(yu + 0.004 * H)}Z`} fill={ajusta(corLabio, -0.04)} />);
    }
  };
  const linha = (d: string, w = 0.6) => boca.push(<path key={`l${boca.length}`} d={d} stroke={corLinha} strokeWidth={w} strokeLinecap="round" fill="none" />);
  if (ex.boca === 'sorriso') {
    labios();
    linha(`M${fmt(bx - mw * 0.46)} ${fmt(by - 0.008 * H)}Q${fmt(bx)} ${fmt(by + 0.034 * H)} ${fmt(bx + mw * 0.46)} ${fmt(by - 0.008 * H)}`, 0.65);
  } else if (ex.boca === 'apertado') {
    // lábios apertados: a linha reta e curta, o lábio de baixo fino, covinhas nos cantos
    if (cheio > 0) boca.push(<path key="lb" d={`M${fmt(bx - mw * 0.3)} ${fmt(by + 0.01 * H)}Q${fmt(bx)} ${fmt(by + 0.03 * H)} ${fmt(bx + mw * 0.3)} ${fmt(by + 0.01 * H)}Z`} fill={corLabio} />);
    linha(`M${fmt(bx - mw * 0.36)} ${fmt(by + 0.006 * H)}L${fmt(bx + mw * 0.36)} ${fmt(by + 0.006 * H)}`, 0.75);
    linha(`M${fmt(bx - mw * 0.42)} ${fmt(by - 0.004 * H)}q${fmt(-mw * 0.04)} ${fmt(0.012 * H)} 0 ${fmt(0.022 * H)}M${fmt(bx + mw * 0.42)} ${fmt(by - 0.004 * H)}q${fmt(mw * 0.04)} ${fmt(0.012 * H)} 0 ${fmt(0.022 * H)}`, 0.4);
  } else if (ex.boca === 'caido') {
    labios();
    linha(`M${fmt(bx - mw * 0.4)} ${fmt(by + 0.016 * H)}Q${fmt(bx)} ${fmt(by + 0.002 * H)} ${fmt(bx + mw * 0.4)} ${fmt(by + 0.016 * H)}`, 0.65);
  } else if (ex.boca === 'aberto') {
    const d = `M${fmt(bx - mw * 0.58)} ${fmt(by - 0.02 * H)}Q${fmt(bx)} ${fmt(by + 0.005 * H)} ${fmt(bx + mw * 0.58)} ${fmt(by - 0.02 * H)}Q${fmt(bx + mw * 0.42)} ${fmt(by + 0.13 * H)} ${fmt(bx)} ${fmt(by + 0.13 * H)}Q${fmt(bx - mw * 0.42)} ${fmt(by + 0.13 * H)} ${fmt(bx - mw * 0.58)} ${fmt(by - 0.02 * H)}Z`;
    const rec = k.recorte([d]);
    if (cheio > 0) boca.push(<path key="ll" d={d} fill="none" stroke={corLabio} strokeWidth={0.9 + 0.9 * cheio} strokeLinejoin="round" />);
    boca.push(<path key="m" d={d} fill="#3A0D1E" />);
    boca.push(
      <g key="mi" clipPath={rec}>
        <rect x={bx - mw} y={by - 0.04 * H} width={mw * 2} height={0.06 * H} rx={0.02 * H} fill="#FFFFFF" />
        <ellipse cx={bx + mw * 0.08} cy={by + 0.135 * H} rx={mw * 0.36} ry={0.05 * H} fill="#E8657E" />
      </g>,
    );
  } else if (ex.boca === 'o' || ex.boca === 'entreaberta') {
    const s = ex.boca === 'o' ? 1 : 0.55;
    const d = `M${fmt(bx)} ${fmt(by - 0.03 * H * s)}C${fmt(bx + mw * 0.32 * s)} ${fmt(by - 0.03 * H * s)} ${fmt(bx + mw * 0.3 * s)} ${fmt(by + 0.09 * H * s)} ${fmt(bx)} ${fmt(by + 0.09 * H * s)}C${fmt(bx - mw * 0.3 * s)} ${fmt(by + 0.09 * H * s)} ${fmt(bx - mw * 0.32 * s)} ${fmt(by - 0.03 * H * s)} ${fmt(bx)} ${fmt(by - 0.03 * H * s)}Z`;
    const rec = k.recorte([d]);
    if (cheio > 0) boca.push(<path key="ll" d={d} fill="none" stroke={corLabio} strokeWidth={0.8 + 0.8 * cheio} />);
    boca.push(<path key="m" d={d} fill="#3A0D1E" />);
    boca.push(
      <g key="mi" clipPath={rec}>
        <ellipse cx={bx} cy={by + 0.1 * H * s} rx={mw * 0.24 * s} ry={0.04 * H * s} fill="#E8657E" />
        {s < 1 && <rect x={bx - mw} y={by - 0.06 * H} width={mw * 2} height={0.045 * H} fill="#FFFFFF" opacity={0.9} />}
      </g>,
    );
  } else {
    // mandíbula travada (o halter): os dentes à mostra, apertados, com a linha do meio
    const ww = mw * 0.5;
    const d = `M${fmt(bx - ww)} ${fmt(by - 0.012 * H)}Q${fmt(bx)} ${fmt(by - 0.02 * H)} ${fmt(bx + ww)} ${fmt(by - 0.012 * H)}L${fmt(bx + ww * 0.9)} ${fmt(by + 0.034 * H)}Q${fmt(bx)} ${fmt(by + 0.042 * H)} ${fmt(bx - ww * 0.9)} ${fmt(by + 0.034 * H)}Z`;
    if (cheio > 0) boca.push(<path key="ll" d={d} fill="none" stroke={corLabio} strokeWidth={0.8 + 0.8 * cheio} strokeLinejoin="round" />);
    boca.push(<path key="m" d={d} fill="#FFFFFF" />);
    linha(`M${fmt(bx - ww * 0.9)} ${fmt(by + 0.011 * H)}L${fmt(bx + ww * 0.9)} ${fmt(by + 0.011 * H)}`, 0.35);
    boca.push(<path key="mc" d={d} fill="none" stroke={corLinha} strokeWidth={0.45} strokeLinejoin="round" />);
  }

  // ---- nariz de cada um (sombra embaixo, asas, brilho na ponta; de perfil está no contorno)
  const nariz: React.ReactNode[] = [];
  const nl = { fino: 0.052, medio: 0.066, largo: 0.09, longo: 0.06 }[fe.nariz] * W;
  const ny = (fe.nariz === 'longo' ? 0.185 : 0.168) * H;
  if (vista === 'frente') {
    nariz.push(<ellipse key="n1" cx={0.012 * W} cy={ny} rx={nl} ry={0.022 * H} fill={pele.fundo} opacity={0.5} />);
    nariz.push(<ellipse key="n2" cx={0.035 * W} cy={ny - 0.075 * H} rx={0.02 * W} ry={0.065 * H} fill={pele.sombra} opacity={0.35} />);
    nariz.push(<ellipse key="n3" cx={-0.012 * W} cy={ny - 0.038 * H} rx={nl * 0.36} ry={0.016 * H} fill="#FFFFFF" opacity={0.26} />);
    if (fe.nariz !== 'fino') {
      // as asas do nariz
      for (const s of [-1, 1]) nariz.push(<path key={`a${s}`} d={`M${fmt(s * nl * 0.82)} ${fmt(ny - 0.03 * H)}q${fmt(s * nl * 0.32)} ${fmt(0.018 * H)} ${fmt(s * nl * 0.02)} ${fmt(0.036 * H)}`} stroke={pele.fundo} strokeWidth={0.45} strokeLinecap="round" fill="none" opacity={0.7} />);
    }
  } else if (vista === 'tres-quartos') {
    const tip = P3(0, fe.nariz === 'longo' ? 0.165 : 0.15, 0.46).p;
    const ponte = P3(0, 0.0, 0.42).p;
    const kw = nl / (0.066 * W);
    const d = suave([
      [ponte[0] - 0.01 * W, ponte[1]],
      [tip[0] + 0.022 * W, tip[1] - 0.04 * H],
      [tip[0] + 0.034 * W * kw, tip[1] + 0.004 * H],
      [tip[0] + 0.006 * W, tip[1] + 0.032 * H],
      [tip[0] - 0.045 * W * kw, tip[1] + 0.028 * H],
      [tip[0] - 0.05 * W * kw, tip[1] + 0.0 * H],
      [ponte[0] - 0.02 * W, ponte[1] + 0.06 * H],
    ]);
    nariz.push(<ellipse key="n0" cx={tip[0] + 0.02 * W} cy={tip[1] + 0.03 * H} rx={0.05 * W * kw} ry={0.02 * H} fill={pele.fundo} opacity={0.4} />);
    nariz.push(<path key="n1" d={d} fill={k.bolha(pele, 1.1)} />);
    nariz.push(<ellipse key="n2" cx={tip[0] - 0.015 * W} cy={tip[1] - 0.012 * H} rx={0.018 * W * kw} ry={0.014 * H} fill="#FFFFFF" opacity={0.28} />);
    nariz.push(<path key="n3" d={`M${fmt(tip[0] - 0.04 * W * kw)} ${fmt(tip[1] + 0.022 * H)}q${fmt(0.02 * W)} ${fmt(0.012 * H)} ${fmt(0.045 * W * kw)} ${fmt(0.002 * H)}`} stroke={pele.fundo} strokeWidth={0.5} strokeLinecap="round" fill="none" opacity={0.7} />);
  } else {
    nariz.push(<path key="n1" d={`M${fmt(0.5 * W)} ${fmt(0.182 * H)}q${fmt(0.02 * W)} ${fmt(-0.012 * H)} ${fmt(0.045 * W)} 0`} stroke={pele.fundo} strokeWidth={0.5} strokeLinecap="round" fill="none" opacity={0.7} />);
    nariz.push(<ellipse key="n2" cx={0.56 * W} cy={0.13 * H} rx={0.016 * W} ry={0.012 * H} fill="#FFFFFF" opacity={0.28} />);
  }

  // ---- rubor: só na emoção (feliz, um tico na surpresa e no esforço)
  const rubor: React.ReactNode[] = [];
  const corRubor = escura ? '#D9506E' : '#FF6F86';
  const fillRubor = k.radCaixa(
    0.5,
    0.5,
    0.5,
    [
      [0, corRubor, escura ? 0.5 : 0.42],
      [1, corRubor, 0],
    ],
    `rub${corRubor}`,
  );
  if (ex.rubor > 0) {
    for (const lado of [-1, 1] as const) {
      const q = P3(lado * 0.27, 0.17, 0.36);
      const f = vira(lado * 0.27, 0.36);
      if (f < 0.15) continue;
      rubor.push(<ellipse key={lado} cx={q.p[0]} cy={q.p[1]} rx={0.11 * W * clamp(f / 0.8, 0.5, 1)} ry={0.06 * H} fill={fillRubor} opacity={ex.rubor} />);
    }
  }

  // ---- linhas da idade (sulco nasogeniano suave)
  if (med.idoso && vista !== 'perfil') {
    for (const lado of [-1, 1] as const) {
      const a = P3(lado * 0.12, 0.17, 0.42);
      const b = P3(lado * 0.17, 0.28, 0.37);
      if (vira(lado * 0.15, 0.4) < 0.3) continue;
      rugas.push(<path key={`n${lado}`} d={`M${fmt(a.p[0])} ${fmt(a.p[1])}Q${fmt(a.p[0] + lado * 0.05 * W)} ${fmt((a.p[1] + b.p[1]) / 2)} ${fmt(b.p[0])} ${fmt(b.p[1])}`} stroke={pele.fundo} strokeWidth={0.42} strokeLinecap="round" fill="none" opacity={0.42} />);
    }
  }
  // cansado: olheira suave
  if (humor === 'cansado') {
    for (const lado of [-1, 1] as const) {
      const q = P3(lado * olhoX, 0.11, 0.36);
      if (vira(lado * olhoX, 0.37) < 0.2) continue;
      rugas.push(<ellipse key={`o${lado}`} cx={q.p[0]} cy={q.p[1]} rx={erx * 1.2} ry={0.022 * H} fill={pele.fundo} opacity={0.35} />);
    }
  }

  // ---- barba (contorno contínuo, sem serrilhado)
  const barba: React.ReactNode[] = [];
  if (pessoa.barba) {
    const corB = pessoa.corCabelo;
    const mb = material(corB, 'cabelo');
    // só os pontos do lado que a câmera vê (de perfil o outro lado da mandíbula dobraria o polígono)
    const regiao = (pts: [number, number, number][]) => pts.filter(([x, , z]) => (x === 0 && z === 0) || vira(x, z) > -0.25).map(([x, y, z]) => P3(x, y, z).p);
    const bigode = regiao([
      [-0.2, 0.262, 0.33],
      [-0.13, 0.2, 0.41],
      [0, 0.188, 0.46],
      [0.13, 0.2, 0.41],
      [0.2, 0.262, 0.33],
      [0.11, 0.236, 0.41],
      [0, 0.232, 0.44],
      [-0.11, 0.236, 0.41],
    ]);
    if (pessoa.barba === 'cheia' || pessoa.barba === 'rala') {
      const fora = regiao([
        [-0.5, -0.02, -0.02],
        [-0.5, 0.2, -0.05],
        [-0.4, 0.4, 0.1],
        [-0.2, 0.56, 0.3],
        [0, 0.59, 0.34],
        [0.2, 0.56, 0.3],
        [0.4, 0.4, 0.1],
        [0.5, 0.2, -0.05],
        [0.5, -0.02, -0.02],
      ]);
      const dentro = regiao([
        [0.42, 0.04, 0.16],
        [0.33, 0.19, 0.33],
        [0.16, 0.25, 0.39],
        [0.06, 0.2, 0.45],
        [-0.06, 0.2, 0.45],
        [-0.16, 0.25, 0.39],
        [-0.33, 0.19, 0.33],
        [-0.42, 0.04, 0.16],
      ]);
      const d = suave([...fora, ...dentro]);
      if (pessoa.barba === 'rala') barba.push(<path key="b" d={d} fill={mb.base} opacity={escura ? 0.42 : 0.3} clipPath={recCab} />);
      else {
        barba.push(<path key="b" d={d} fill={k.bolha(mb, 0.7)} clipPath={recCab} />);
        barba.push(<path key="bb" d={d} fill={k.linCaixa(0, 0, 0, 1, [[0, '#000', 0], [0.7, '#000', 0], [1, '#000', 0.22]], 'bbsh')} clipPath={recCab} />);
      }
    }
    if (pessoa.barba !== 'rala') barba.push(<path key="bg" d={suave(bigode)} fill={k.bolha(mb, 0.9)} />);
    else barba.push(<path key="bg" d={suave(bigode)} fill={mb.base} opacity={escura ? 0.5 : 0.36} />);
  }

  // ---- orelhas
  const orelhaAtras: React.ReactNode[] = [];
  const orelhaFrente: React.ReactNode[] = [];
  const brincos: React.ReactNode[] = [];
  const fones: React.ReactNode[] = [];
  const temFone = roupa.extras?.includes('fone');
  const orelhas: { c: P; lado: number; atras: boolean; rx: number; ry: number; giro: number }[] = [];
  if (vista === 'frente') {
    orelhas.push({ c: [-0.5 * W, 0.07 * H], lado: -1, atras: true, rx: 0.08 * W, ry: 0.11 * H, giro: 8 });
    orelhas.push({ c: [0.5 * W, 0.07 * H], lado: 1, atras: true, rx: 0.08 * W, ry: 0.11 * H, giro: -8 });
  } else {
    const q = P3(-0.49, 0.07, -0.03);
    orelhas.push({ c: [q.p[0] + (vista === 'perfil' ? -0.07 * W : 0.02 * W), q.p[1]], lado: -1, atras: false, rx: (vista === 'perfil' ? 0.085 : 0.07) * W, ry: 0.115 * H, giro: -10 });
  }
  for (const o of orelhas) {
    const d = suave(elipse(o.c, o.rx, o.ry, o.giro, 18));
    const conc: P = soma(o.c, [o.atras ? -o.lado * 0.022 * W : 0.018 * W, 0.005 * H]);
    const el = (
      <g key={`o${o.c[0]}`}>
        <Vol k={k} pecas={[{ d, fill: k.bolha(pele, 0.8) }]} giro={ang} forca={0.7} />
        <ellipse cx={conc[0]} cy={conc[1]} rx={o.rx * 0.5} ry={o.ry * 0.62} transform={`rotate(${o.giro} ${fmt(conc[0])} ${fmt(conc[1])})`} fill={pele.fundo} opacity={0.55} />
      </g>
    );
    (o.atras ? orelhaAtras : orelhaFrente).push(el);
    const lobo: P = soma(o.c, [0, o.ry * 0.85]);
    if (pessoa.brinco) {
      brincos.push(
        <g key={`br${o.c[0]}`}>
          <circle cx={lobo[0]} cy={lobo[1] + 0.05 * W} r={0.05 * W} fill="none" stroke="#E0A21C" strokeWidth={0.75} />
          <path d={`M${fmt(lobo[0] - 0.045 * W)} ${fmt(lobo[1] + 0.04 * W)}a${fmt(0.05 * W)} ${fmt(0.05 * W)} 0 0 1 ${fmt(0.06 * W)} ${fmt(-0.035 * W)}`} fill="none" stroke="#FFE7A0" strokeWidth={0.45} strokeLinecap="round" />
        </g>,
      );
    }
    if (temFone) {
      const fc = soma(o.c, [o.atras ? o.lado * 0.01 * W : 0.02 * W, 0.0]);
      fones.push(
        <g key={`fo${o.c[0]}`}>
          <rect x={fc[0] - 0.024 * W} y={fc[1]} width={0.048 * W} height={0.13 * H} rx={0.024 * W} fill="#E8EAF6" />
          <circle cx={fc[0]} cy={fc[1]} r={0.05 * W} fill={k.bolha(material('#F4F5FF'), 1)} />
          <circle cx={fc[0] - 0.015 * W} cy={fc[1] - 0.015 * W} r={0.015 * W} fill="#FFFFFF" />
        </g>,
      );
    }
  }

  // ---- o dedo na pele (régua do painel, rodada 3): a bochecha AFUNDA — meia-lua de sombra do
  // lado de lá da luz, a borda de pele estufada pegando luz do lado de cá, uma sombra leve fora
  // da borda; a marca rosada FICA (`marca`) e some devagar. Nada de anel simétrico (lia espinha).
  const toque: React.ReactNode[] = [];
  if (toqueLocal) {
    const [tx, ty] = toqueLocal;
    const r = 0.042 * W; // a polpa do dedo
    const angSombra = k.espelho ? 125 : 55; // o lado de lá da luz (luz em cima à esquerda)
    const angLuz = angSombra + 180;
    // a marca rosada (fica depois do aperto): larga, difusa, sem borda
    if (marca > 0.01) {
      const corM = escura ? '#D65A78' : '#FF7A92';
      const fM = k.radCaixa(0.5, 0.5, 0.5, [
        [0, corM, 0.55],
        [0.55, corM, 0.3],
        [1, corM, 0],
      ], `marca${corM}`);
      toque.push(<ellipse key="tm" cx={tx} cy={ty + r * 0.3} rx={r * 3.4} ry={r * 2.5} fill={fM} opacity={marca} />);
    }
    if (aperto > 0.01) {
      // o poço: a parede de dentro do lado da luz fica na sombra (abraça a polpa do dedo); logo
      // fora, a pele estufada pega luz; do outro lado, uma sombra rasa (a pele empurrada)
      toque.push(<path key="tf" d={meiaLua([tx, ty], r * 1.5, r * 0.45 * aperto, angSombra, 65)} fill={pele.sombra} opacity={0.45 * aperto} />);
      toque.push(<path key="tp" d={meiaLua([tx, ty], r * 1.08, r * (0.25 + 0.65 * aperto), angLuz, 95)} fill={pele.fundo} opacity={0.45 + 0.45 * aperto} />);
      toque.push(<path key="te" d={meiaLua([tx, ty], r * 1.95, r * (0.2 + 0.5 * aperto), angLuz, 80)} fill={ajusta(pessoa.pele, 0.08, -0.02)} opacity={0.3 + 0.6 * aperto} />);
    }
    // a sombra do dedo na bochecha (macia, ao longo do dedo, pra baixo-direita)
    if (j.mao[1] === 'aponta') {
      const am = j.ang.mao[1] - ang;
      const dirx = -Math.sin(am * RAD);
      const diry = -Math.cos(am * RAD);
      const L = 0.3 * W;
      const cx = tx + dirx * L * 0.5 + esp * 0.03 * W;
      const cy = ty + diry * L * 0.5 + 0.035 * H;
      const rot = (Math.atan2(diry, dirx) * 180) / Math.PI;
      toque.push(<ellipse key="ts" cx={cx} cy={cy} rx={L * 0.55} ry={0.05 * W} transform={`rotate(${fmt(rot)} ${fmt(cx)} ${fmt(cy)})`} fill={pele.fundo} opacity={0.35} filter={k.desfoque(0.9)} />);
    }
  }

  // ---- cabelo: camadas
  const trancaEls = (frente: boolean) =>
    cg.trancas
      .filter((tr) => tr.frente === frente)
      .map((tr, i) => {
        const pts = tr.pts;
        const d = suave(tubosDe(pts, tr.r), true);
        const els: React.ReactNode[] = [<path key="t" d={d} fill={k.tubo(pts[0], pts[pts.length - 1], tr.r, frente ? cab : material(pessoa.corCabelo, 'cabelo', 0.8))} />];
        // a trama: risquinhos alternados que fazem a trança ler como trança
        const marcas: string[] = [];
        for (let s = 1; s < pts.length - 1; s++) {
          const a = pts[s - 1];
          const b = pts[s + 1];
          const dx = b[0] - a[0];
          const dy = b[1] - a[1];
          const n = Math.hypot(dx, dy) || 1;
          const ux = dx / n;
          const uy = dy / n;
          const lado = s % 2 ? 1 : -1;
          const p = pts[s];
          marcas.push(`M${fmt(p[0] - uy * tr.r * 0.85 * lado)} ${fmt(p[1] + ux * tr.r * 0.85 * lado)}L${fmt(p[0] + uy * tr.r * 0.2 * lado + ux * tr.r * 0.9)} ${fmt(p[1] - ux * tr.r * 0.2 * lado + uy * tr.r * 0.9)}`);
        }
        els.push(<path key="m" d={marcas.join('')} stroke={frente ? cab.luz : cab.sombra} strokeWidth={0.42} strokeLinecap="round" opacity={0.75} fill="none" />);
        // um anel dourado perto da ponta de algumas tranças (o brilho que ela escolheu)
        if (i % 3 === 0) {
          const p = pts[pts.length - 4];
          els.push(<circle key="a" cx={p[0]} cy={p[1]} r={tr.r * 1.05} fill={k.bolha(material('#FFC83D', 'metal'), 1)} />);
        }
        return <g key={i}>{els}</g>;
      });

  const trasEls: React.ReactNode[] = [];
  for (const pts of cg.tras) trasEls.push(<path key={`t${trasEls.length}`} d={borda(pts)} fill={fillTras} />);
  if (cg.rabo) {
    const pts = cg.rabo.pts;
    const d = suave(tubosDe(pts, 0, (s) => 0.1 * W + Math.sin(Math.PI * Math.min(1, s * 1.3)) * 0.08 * W - s * 0.08 * W));
    trasEls.push(<path key="rabo" d={d} fill={k.tubo(pts[0], pts[pts.length - 1], 0.16 * W, cab)} />);
    trasEls.push(<ellipse key="prende" cx={pts[1][0]} cy={pts[1][1]} rx={0.07 * W} ry={0.04 * W} fill={pessoa.cor} />);
  }
  if (cg.coque && !cg.coque.frente) trasEls.push(<circle key="coque" cx={cg.coque.c[0]} cy={cg.coque.c[1]} r={cg.coque.r} fill={k.bolha(cab, 1)} />);

  const recFrente = cg.frente.length ? k.recorte(cg.frente.map((p) => borda(p))) : null;
  const frentePecas = cg.frente.map((p) => ({ d: borda(p), fill: fillCab }));
  const cabeloBorda = frentePecas.length > 0 ? <Vol k={k} pecas={frentePecas} giro={ang} forca={0.9} parte="borda" frio={0.5} /> : null;
  const cabeloFrente = (
    <g>
      {frentePecas.length > 0 && <Vol k={k} pecas={frentePecas} giro={ang} forca={0.9} parte="corpo" />}
      {recFrente && (
        <g clipPath={recFrente}>
          {cg.fios.map((f, i) => (
            <path key={`f${i}`} d={suave(f, false)} stroke={cab.sombra} strokeWidth={0.32} strokeLinecap="round" fill="none" opacity={0.4} />
          ))}
          {cg.brilho.map((b, i) => (
            <path key={`b${i}`} d={suave(b)} fill={i === 0 ? cab.luz : '#FFFFFF'} opacity={i === 0 ? (grisalho ? 0.5 : 0.45) : grisalho ? 0.4 : 0.2} />
          ))}
          {cg.cacho > 0 && cachinhos(cg, pessoa.id, cab, W, H)}
          {/* sombra do cabelo na testa: o volume projeta uma sombra macia logo abaixo da borda */}
        </g>
      )}
      {cg.coque && cg.coque.frente && <circle cx={cg.coque.c[0]} cy={cg.coque.c[1]} r={cg.coque.r} fill={k.bolha(cab, 1)} />}
      {trancaEls(true)}
    </g>
  );
  // sombra que o cabelo faz na testa (dentro da cabeça)
  const sombraCabelo = cg.frente.length ? (
    <g clipPath={recCab} opacity={0.4}>
      {cg.frente.map((p, i) => (
        <path key={i} d={borda(p)} fill={pele.fundo} transform={`translate(${fmt(esp * 0.6)} ${fmt(0.035 * H)})`} filter={k.desfoque(0.8)} />
      ))}
    </g>
  ) : null;
  // careca: brilho no couro cabeludo
  const brilhoCareca = cg.calvo ? <ellipse cx={-esp * 0.14 * W} cy={-0.36 * H} rx={0.16 * W} ry={0.07 * H} transform={`rotate(${-esp * 20} ${fmt(-esp * 0.14 * W)} ${fmt(-0.36 * H)})`} fill="#FFFFFF" opacity={0.28} /> : null;

  // ---- óculos
  const oculos: React.ReactNode[] = [];
  if (pessoa.oculos) {
    const armacao = '#2A2238';
    const lentes: { c: P; w: number; h: number }[] = [];
    for (const lado of [-1, 1] as const) {
      const q = P3(lado * olhoX, 0.03, 0.42);
      const f = vira(lado * olhoX, 0.42) / 0.9;
      if (f < 0.2) continue;
      lentes.push({ c: q.p, w: 0.36 * W * clamp(f, 0.5, 1), h: 0.2 * H });
    }
    lentes.sort((a, b) => a.c[0] - b.c[0]);
    for (const l of lentes) {
      const x = l.c[0] - l.w / 2;
      const y = l.c[1] - l.h / 2;
      oculos.push(<rect key={`l${l.c[0]}`} x={x} y={y} width={l.w} height={l.h} rx={l.h * 0.42} fill="#CFE6FF" fillOpacity={0.14} stroke={armacao} strokeWidth={0.75} />);
      const gx = esp > 0 ? x + l.w * 0.2 : x + l.w * 0.62;
      oculos.push(<path key={`g${l.c[0]}`} d={`M${fmt(gx)} ${fmt(y + l.h * 0.5)}L${fmt(gx + l.w * 0.16)} ${fmt(y + l.h * 0.2)}`} stroke="#FFFFFF" strokeWidth={0.6} strokeLinecap="round" opacity={0.6} />);
    }
    if (lentes.length === 2) {
      const a = lentes[0];
      const b = lentes[1];
      oculos.push(<path key="ponte" d={`M${fmt(a.c[0] + a.w / 2)} ${fmt(a.c[1] - a.h * 0.1)}Q${fmt((a.c[0] + b.c[0]) / 2)} ${fmt(a.c[1] - a.h * 0.32)} ${fmt(b.c[0] - b.w / 2)} ${fmt(b.c[1] - b.h * 0.1)}`} stroke={armacao} strokeWidth={0.75} fill="none" />);
    }
    if (vista !== 'frente' && lentes.length) {
      const a = lentes[0];
      const orelha = P3(-0.47, 0.02, -0.02).p;
      oculos.push(<path key="haste" d={`M${fmt(a.c[0] - a.w / 2)} ${fmt(a.c[1] - a.h * 0.2)}L${fmt(orelha[0])} ${fmt(orelha[1])}`} stroke={armacao} strokeWidth={0.8} strokeLinecap="round" />);
    }
  }

  // ---- boné / faixa
  const chapeu: React.ReactNode[] = [];
  const extras = roupa.extras ?? [];
  if (extras.includes('bone')) {
    const corB = pessoa.cor;
    const mb = material(corB);
    const vol = 1.8;
    const yb = -0.25 * H;
    // a copa: o alto do crânio inflado, da faixa pra cima (a faixa desce um tico na frente)
    const hw = Math.hypot((0.5 * W + vol) * g.c, (0.56 * W + vol) * g.s);
    const x0 = -0.04 * W * g.s;
    const ryb = 0.44 * H + vol;
    const sb = clamp((yb + 0.06 * H) / ryb, -1, 1);
    const a1 = (Math.asin(sb) * 180) / Math.PI; // lado direito
    const cima: P[] = [];
    for (let a = -180 - a1; a <= a1 + 0.01; a += 9) cima.push([x0 + Math.cos(a * RAD) * hw, -0.06 * H + Math.sin(a * RAD) * ryb]);
    const frenteCopa = P3(0, -0.25, 0.6).p;
    const dC = suave([...cima, [frenteCopa[0] + 0.12 * W, yb + 0.03 * H], [frenteCopa[0] - 0.12 * W, yb + 0.03 * H]]);
    // aba: pra frente (de frente, um crescente embaixo da faixa)
    const fr = P3(0, -0.25, 0.56).p;
    let dAba: string;
    if (vista === 'frente') dAba = suave([[fr[0] - 0.46 * W, yb + 0.02 * H], [fr[0], yb - 0.01 * H], [fr[0] + 0.46 * W, yb + 0.02 * H], [fr[0] + 0.28 * W, yb + 0.09 * H], [fr[0], yb + 0.11 * H], [fr[0] - 0.28 * W, yb + 0.09 * H]]);
    else {
      const comp = (vista === 'perfil' ? 0.4 : 0.3) * W;
      dAba = suave([[fr[0] - 0.14 * W, yb - 0.01 * H], [fr[0] + comp * 0.6, yb + 0.005 * H], [fr[0] + comp, yb + 0.05 * H], [fr[0] + comp * 0.7, yb + 0.085 * H], [fr[0] - 0.08 * W, yb + 0.06 * H]]);
    }
    chapeu.push(<Vol key="bone" k={k} giro={ang} pecas={[{ d: dC, fill: k.bolha(mb, 1) }, { d: dAba, fill: k.bolha(material(ajusta(corB, -0.12)), 0.8) }]} />);
    chapeu.push(<circle key="botao" cx={x0} cy={-0.5 * H - vol} r={0.035 * W} fill={mb.sombra} />);
    chapeu.push(<path key="costura" d={`M${fmt(x0 + 0.1 * W * g.s)} ${fmt(-0.5 * H - vol)}Q${fmt(fr[0] - 0.02 * W)} ${fmt(-0.4 * H)} ${fmt(fr[0])} ${fmt(yb)}`} stroke={mb.sombra} strokeWidth={0.4} fill="none" opacity={0.7} />);
  }
  if (extras.includes('faixa')) {
    const cor = roupa.cima.cor;
    const mf = material(cor);
    const vol = (pessoa.cabelo === 'trancas' ? 1.5 : 2.4) + 0.4;
    const banda: P[] = [];
    const banda2: P[] = [];
    for (let f = -180; f <= 180; f += 6) {
      for (const [y, arr] of [
        [-0.34 * H, banda],
        [-0.22 * H, banda2],
      ] as [number, P[]][]) {
        const e = clamp((y + 0.06 * H) / (0.44 * H + vol), -1, 1);
        const kq = Math.sqrt(1 - e * e);
        const q = projeta3(g, (0.5 * W + vol) * kq * Math.sin(f * RAD), y, (0.56 * W + vol) * kq * Math.cos(f * RAD) - 0.04 * W);
        if (q.z > -0.02 * W) arr.push(q.p);
      }
    }
    banda.sort((a, b) => a[0] - b[0]);
    banda2.sort((a, b) => b[0] - a[0]);
    if (banda.length > 2) chapeu.push(<Vol key="faixa" k={k} giro={ang} pecas={[{ d: suave([...banda, ...banda2]), fill: k.bolha(mf, 1) }]} />);
  }

  const tras = <g transform={tf}>{trasEls}{trancaEls(false)}</g>;
  const frente = (
    <g transform={tf}>
      {orelhaAtras}
      <Vol k={k} pecas={[{ d: dCab, fill: k.bolha(pele, 1) }]} giro={ang} frio={0}>
        {/* sombra embaixo do queixo (a mandíbula vira pra dentro) */}
        <g clipPath={recCab}>
          <ellipse cx={vista === 'frente' ? 0 : 0.12 * W} cy={0.52 * H} rx={0.42 * W} ry={0.12 * H} fill={pele.fundo} opacity={0.32} filter={k.desfoque(1.2)} />
          {sombraCabelo}
          {rubor}
          {rugas}
          {toque.length > 0 && <g filter={k.desfoque(0.22)}>{toque}</g>}
          {barba}
        </g>
      </Vol>
      {brilhoCareca}
      {nariz}
      {boca}
      {sobrs}
      {olhos}
      {orelhaFrente}
      {brincos}
      {cabeloFrente}
      {oculos}
      {chapeu}
      {fones}
    </g>
  );
  // a luz de recorte do cabelo da frente vai ANTES de tudo (antes do cabelo de trás e do rosto):
  // só sobra no contorno de fora, nunca como lasca em cima da testa, da orelha ou no vão do rosto
  const bordaCabelo = <g transform={tf}>{cabeloBorda}</g>;
  return { tras, frente, bordaCabelo, recCab, W, H };
}

/** tubo ao longo de uma polilinha (tranças, rabo): lados deslocados + pontas redondas */
function tubosDe(pts: P[], r: number, perfil?: (s: number) => number): P[] {
  const esq: P[] = [];
  const dir: P[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const m = Math.hypot(dx, dy) || 1;
    const rr = perfil ? perfil(i / (n - 1)) : r * (i === n - 1 ? 0.7 : 1);
    esq.push([pts[i][0] - (dy / m) * rr, pts[i][1] + (dx / m) * rr]);
    dir.push([pts[i][0] + (dy / m) * rr, pts[i][1] - (dx / m) * rr]);
  }
  const fim = pts[n - 1];
  const ini = pts[0];
  return [...esq, [fim[0] + (fim[0] - pts[n - 2][0]) * 0.3, fim[1] + (fim[1] - pts[n - 2][1]) * 0.3], ...dir.reverse(), [ini[0] - (pts[1][0] - ini[0]) * 0.3, ini[1] - (pts[1][1] - ini[1]) * 0.3]];
}

/** cachinhos: arcos claros espalhados na massa (o brilho de cada cacho), determinísticos */
function cachinhos(cg: CabeloGeo, id: string, cab: Mat, W: number, H: number) {
  const pol = cg.frente[0];
  if (!pol) return null;
  const xs = pol.map((p) => p[0]);
  const ys = pol.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const arcos: string[] = [];
  const n = cg.cacho > 1.5 ? 26 : 16;
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, hash(`${id}x${i}`));
    const y = lerp(y0, Math.min(y1, y0 + (y1 - y0) * 0.9), hash(`${id}y${i}`));
    const r = (0.035 + 0.025 * hash(`${id}r${i}`)) * W * (cg.cacho > 1.5 ? 1.1 : 0.8);
    arcos.push(`M${fmt(x - r)} ${fmt(y)}a${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(r * 1.6)} ${fmt(-r * 0.6)}`);
  }
  return <path d={arcos.join('')} stroke={cab.luz} strokeWidth={0.5} strokeLinecap="round" fill="none" opacity={0.55} />;
}
