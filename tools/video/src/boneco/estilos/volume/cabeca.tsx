// Volume suave — a cabeça: crânio + mandíbula projetados pelo giro (frente/3-4/perfil), rosto
// (olho oval com brilho e pálpebra que muda com o humor, sobrancelha desenhada, nariz de
// sombra, boca por humor, orelha, rubor), barba, óculos com reflexo, cabelo com volume e
// brilho, boné/faixa/fone/brinco, e o DEDO NA PELE (a bochecha cede, faz anel de sombra,
// avermelha e estufa em volta).
//
// Tudo nas coordenadas da cabeça: origem no centro (j.cabeca), girada com a cabeça
// (j.ang.cabeca), y pra baixo. Boca na âncora j.boca e bochecha na j.bochecha (ROSTO do
// esqueleto): é ali que o copo encosta e o dedo aperta.
import React from 'react';
import { type Humor, type Juntas, type Proporcao, type Vista, ROSTO } from '../../esqueleto';
import type { Pessoa, Roupa } from '../../elenco';
import { type P, RAD, casco, cachos, clamp, dist, elipse, gira, hash, lerp, poli, soma, suave, sub, suaviza } from './geo';
import { type Mat, ajusta, lum, material, mistura } from './cor';
import { type Kit, Vol } from './kit';
import type { Med } from './corpo';
import { type CabeloGeo, type Giro, cabeloGeo, giroDe, projeta3 } from './cabelo';

export const GIRO: Record<Vista, number> = { frente: 0, 'tres-quartos': 28, perfil: 90 };

type Expr = { abre: number; baixo: number; sob: number; incl: number; boca: 'sorriso' | 'aberto' | 'reto' | 'firme' | 'o'; rubor: number; escala: number };
const HUMOR: Record<Humor, Expr> = {
  ok: { abre: 0.9, baixo: 0.1, sob: 0, incl: 0, boca: 'sorriso', rubor: 0.55, escala: 1 },
  feliz: { abre: 0.86, baixo: 0.46, sob: 0.03, incl: 0.005, boca: 'aberto', rubor: 0.9, escala: 1 },
  cansado: { abre: 0.4, baixo: 0.06, sob: -0.004, incl: 0.055, boca: 'reto', rubor: 0.22, escala: 1 },
  focado: { abre: 0.74, baixo: 0.22, sob: -0.016, incl: 0, boca: 'firme', rubor: 0.4, escala: 1 },
  surpresa: { abre: 1, baixo: 0, sob: 0.06, incl: 0.012, boca: 'o', rubor: 0.5, escala: 1.14 },
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
  toque?: { ponto: [number, number]; forca: number };
  /** arrasto do cabelo (corrida) 0..1 */
  arrasto: number;
};

/** mundo → coordenadas da cabeça */
export const paraCabeca = (j: Juntas, p: P): P => gira(sub(p, j.cabeca), -j.ang.cabeca);
export const daCabeca = (j: Juntas, p: P): P => soma(j.cabeca, gira(p, j.ang.cabeca));

/** o contorno da cabeça (sem cabelo) nas coordenadas dela */
export function contornoCabeca(vista: Vista, W: number, H: number, med: Med, g: Giro): P[] {
  const pts: P[] = [];
  // crânio: elipsoide (0,5W × 0,44H × 0,56W) um tico atrás do rosto
  const hw = Math.hypot(0.5 * W * g.c, 0.56 * W * g.s);
  const x0 = -0.04 * W * g.s;
  const cy = -0.06 * H;
  if (vista === 'perfil') {
    // o perfil é desenhado: o crânio da testa, por cima, até a nuca; depois queixo, lábios, nariz
    for (let a = -18; a >= -205; a -= 8) pts.push([x0 + Math.cos(a * RAD) * hw, cy + Math.sin(a * RAD) * 0.44 * H]);
    const f: P[] = [
      [-0.46, 0.2],
      [-0.3, 0.33],
      [-0.08, 0.4],
      [0.16, 0.485],
      [0.34, 0.5],
      [0.44, 0.44],
      [0.425, 0.37],
      [0.465, 0.31],
      [0.44, 0.278],
      [0.475, 0.248],
      [0.47, 0.205],
      [0.53, 0.188],
      [0.585, 0.15],
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
  const jx = med.largo ? 0.4 : med.f ? 0.32 : 0.355;
  const qx = med.largo ? 0.18 : med.f ? 0.125 : 0.15;
  const qy = med.f ? 0.49 : 0.5;
  const mand: [number, number, number][] = [
    [0, qy, 0.32],
    [qx, qy - 0.03, 0.28],
    [-qx, qy - 0.03, 0.28],
    [jx, 0.33, 0.1],
    [-jx, 0.33, 0.1],
    [0.43, 0.18, -0.12],
    [-0.43, 0.18, -0.12],
    [med.largo ? 0.5 : 0.48, 0.1, 0.17],
    [med.largo ? -0.5 : -0.48, 0.1, 0.17],
  ];
  for (const [x, y, z] of mand) pts.push(projeta3(g, x * W, y * H, z * W).p);
  return casco(pts);
}

/** o olho: a íris visível entre as pálpebras, a linha dos cílios e os brilhos */
function olho(c: P, rx: number, ry: number, abre: number, baixo: number) {
  const N = 14;
  const topo: P[] = [];
  const base: P[] = [];
  const Ly = -ry + (1 - abre) * 2 * ry;
  const Ky = ry - baixo * 1.7 * ry;
  for (let i = 0; i <= N; i++) {
    const x = -rx + (2 * rx * i) / N;
    const e = Math.sqrt(Math.max(0, 1 - (x / rx) ** 2));
    const u = x / rx;
    const top = Math.max(-ry * e, Ly + 0.32 * ry * u * u);
    const bot = Math.min(ry * e, Ky + (ry - Ky) * u * u);
    if (bot - top > 0.04 * ry) {
      topo.push([c[0] + x, c[1] + top]);
      base.push([c[0] + x, c[1] + bot]);
    }
  }
  const alturaMeio = Math.min(ry, Ky) - Math.max(-ry, Ly);
  return { fechado: topo.length < 3 || alturaMeio < 0.22 * ry, topo, base, alturaMeio, Ly };
}

const fmt = (x: number) => Math.round(x * 100) / 100;

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
  const ex = HUMOR[humor];
  const P3 = (x: number, y: number, z: number) => projeta3(g, x * W, y * H, z * W);
  const vira = (x: number, z: number) => (-x * g.s + z * g.c) / Math.hypot(x, z);
  const esp = k.espelho ? -1 : 1; // lado da luz (pros brilhos)

  // ---- contorno (com a bochecha cedendo ao dedo)
  let cont = contornoCabeca(vista, W, H, med, g);
  const toqueLocal = c.toque && c.toque.forca > 0.02 ? paraCabeca(j, c.toque.ponto) : null;
  const forca = c.toque ? clamp((c.toque.forca - 0.15) / 0.45) : 0;
  if (toqueLocal && forca > 0) {
    // a borda perto do dedo estufa um tico pra fora (a bochecha empurrada)
    cont = cont.map((p) => {
      const d = dist(p, toqueLocal);
      const R = 0.2 * W;
      if (d > R) return p;
      const q = 1 - d / R;
      const dir = sub(p, [0, 0.05 * H]);
      const n = Math.hypot(dir[0], dir[1]) || 1;
      return soma(p, [(dir[0] / n) * q * q * 0.035 * W * forca, (dir[1] / n) * q * q * 0.035 * W * forca]);
    });
  }
  const dCab = suave(cont);
  const recCab = k.recorte([dCab]);
  // o recorte da cabeça vive nas coordenadas dela: o clipPath é aplicado dentro do grupo girado

  // ---- cabelo
  const grav: P = [Math.sin(ang * RAD), Math.cos(ang * RAD)];
  const cg: CabeloGeo = cabeloGeo(pessoa.cabelo, W, H, g, { grav, arrasto: c.arrasto, t, idoso: med.idoso, esp });
  const borda = (pts: P[]) => (cg.cacho ? suave(cachos(pts, cg.cacho, cg.ondaCacho, hash(pessoa.id) * 4)) : suave(pts));
  const fadeFill = cg.fade
    ? k.linCaixa(0, 0, 0, 1, [
        [0, cab.luz],
        [0.42, cab.base],
        [0.62, cab.base, 0.85],
        [1, cab.base, 0.18],
      ])
    : null;
  const fillCab = fadeFill ?? (cg.calvo
    ? k.linCaixa(0, 0, 0, 1, [
        [0, cab.luz, 0.35],
        [0.3, cab.base, 0.92],
        [1, cab.sombra, 1],
      ])
    : k.bolha(cab, 0.9));
  const fillTras = k.linCaixa(esp > 0 ? 0.2 : 0.8, 0, esp > 0 ? 0.8 : 0.2, 1, [
    [0, cab.base],
    [0.65, cab.sombra],
    [1, cab.sombra],
  ]);

  // ---- olhos e sobrancelhas
  const olhoX = 0.2;
  const ery = 0.08 * H * ex.escala;
  const erx = 0.066 * W * ex.escala;
  const piscar = (() => {
    const ph = (((t + 60) % 120) + 120) % 120;
    return ph < 5 ? [0.5, 1, 1, 0.7, 0.3][Math.floor(ph)] : 0;
  })();
  const fecha = Math.max(j.fecha, piscar);
  const abreBase = ex.abre * (med.idoso ? 0.92 : 1);
  const corOlho = k.radCaixa(0.42, 0.3, 0.75, [
    [0, '#3A2632'],
    [0.6, '#1C1222'],
    [1, '#120A16'],
  ], 'iris');
  const corCilio = '#160E1A';
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
    // o aperto do dedo sobe a pálpebra de baixo do olho do lado da bochecha apertada
    const perto = toqueLocal ? clamp(1 - dist(centro, toqueLocal) / (0.45 * W)) : 0;
    const baixo = clamp(ex.baixo + perto * forca * 0.16);
    const abre = abreBase * (1 - fecha);
    const o = olho(centro, rx, ery, abre, baixo);
    const ext = lado * (vista === 'frente' ? 1 : lado > 0 ? 1 : 1);
    if (o.fechado) {
      // olho fechado: um arco suave pra baixo (piscar, dormir, esforço)
      const y0 = centro[1] + ery * 0.25;
      olhos.push(<path key={`f${lado}`} d={`M${fmt(centro[0] - rx)} ${fmt(y0)}Q${fmt(centro[0])} ${fmt(y0 + ery * 0.5)} ${fmt(centro[0] + rx)} ${fmt(y0)}`} stroke={corCilio} strokeWidth={0.62} strokeLinecap="round" fill="none" />);
    } else {
      const d = poli([...o.topo, ...[...o.base].reverse()]);
      olhos.push(<path key={`i${lado}`} d={d} fill={corOlho} />);
      // brilho (do lado da luz) e um pontinho do outro lado
      const topoY = Math.max(centro[1] - ery, centro[1] + o.Ly);
      const hb = o.alturaMeio;
      if (hb > 0.45 * ery) {
        const bx = centro[0] - esp * 0.3 * rx;
        const by = topoY + hb * 0.3;
        olhos.push(<ellipse key={`b${lado}`} cx={bx} cy={by} rx={rx * 0.36} ry={rx * 0.4} fill="#FFFFFF" opacity={0.95} />);
        olhos.push(<circle key={`b2${lado}`} cx={centro[0] + esp * 0.32 * rx} cy={topoY + hb * 0.72} r={rx * 0.15} fill="#FFFFFF" opacity={0.7} />);
      }
      // cílios: a linha da pálpebra de cima (mais grossa e com um risquinho no canto nas mulheres)
      const tp = o.topo;
      if (tp.length > 1) {
        const ultimo = lado > 0 ? tp[tp.length - 1] : tp[0];
        const flick = med.f ? `L${fmt(ultimo[0] + ext * rx * 0.32)} ${fmt(ultimo[1] - ery * 0.22)}` : '';
        const dc = lado > 0 ? `${poli(tp, false)}${flick}` : `${poli([...tp].reverse(), false)}${flick}`;
        olhos.push(<path key={`c${lado}`} d={dc} stroke={corCilio} strokeWidth={med.f ? 0.75 : 0.55} strokeLinecap="round" strokeLinejoin="round" fill="none" />);
      }
    }
    // sobrancelha: afina pra fora; inclina com o humor (cansado: ponta de dentro sobe)
    const by = centro[1] - 0.13 * H - ex.sob * H - (fecha > 0.5 && humor === 'ok' ? 0 : 0);
    const dentro = -lado; // a ponta de dentro aponta pro meio do rosto
    const L = 0.115 * W * fx * (med.f ? 1 : 1.05);
    const xi = centro[0] + dentro * L * 0.95 * (lado < 0 ? 1 : 1);
    const xo = centro[0] - dentro * L * 1.05;
    const espI = (med.f ? 0.044 : 0.058) * H;
    const espO = (med.f ? 0.022 : 0.03) * H;
    const sb: P[] = [];
    const sb2: P[] = [];
    for (let i = 0; i <= 8; i++) {
      const s = i / 8;
      const x = lerp(xi, xo, s);
      const arco = -Math.sin(Math.PI * clamp(s * 0.9 + 0.1)) * 0.028 * H * (humor === 'surpresa' ? 1.6 : 1);
      const incl = (1 - s) * -ex.incl * H;
      const y = by + arco + incl;
      const e = lerp(espI, espO, s);
      sb.push([x, y - e / 2]);
      sb2.push([x, y + e / 2]);
    }
    sobrs.push(<path key={`s${lado}`} d={suave([...sb, ...sb2.reverse()])} fill={corSobr} />);
    if (med.idoso) {
      // pés de galinha discretos no canto de fora
      const cx = centro[0] - dentro * rx * 1.25;
      rugas.push(
        <path key={`r${lado}`} d={`M${fmt(cx)} ${fmt(centro[1] - ery * 0.1)}l${fmt(-dentro * rx * 0.5)} ${fmt(-ery * 0.25)}M${fmt(cx)} ${fmt(centro[1] + ery * 0.25)}l${fmt(-dentro * rx * 0.55)} ${fmt(ery * 0.15)}`} stroke={pele.fundo} strokeWidth={0.38} strokeLinecap="round" opacity={0.45} fill="none" />,
      );
    }
  }

  // ---- boca (na âncora do esqueleto)
  const ancB: P = [ROSTO[vista].boca[0] * W, ROSTO[vista].boca[1] * H];
  const fBoca = vista === 'frente' ? 1 : vista === 'tres-quartos' ? 0.86 : 0.42;
  const mw = 0.25 * W * fBoca;
  const labio = ajusta(pessoa.pele, escura ? -0.2 : -0.24, 0.14, 350, 10);
  const boca: React.ReactNode[] = [];
  const bx = vista === 'perfil' ? ancB[0] - mw * 0.35 : ancB[0];
  const by = ancB[1];
  if (ex.boca === 'sorriso') {
    const d = `M${fmt(bx - mw / 2)} ${fmt(by - 0.012 * H)}Q${fmt(bx)} ${fmt(by + 0.05 * H)} ${fmt(bx + mw / 2)} ${fmt(by - 0.012 * H)}Q${fmt(bx)} ${fmt(by + 0.022 * H)} ${fmt(bx - mw / 2)} ${fmt(by - 0.012 * H)}Z`;
    boca.push(<path key="m" d={d} fill={labio} />);
  } else if (ex.boca === 'aberto') {
    const d = `M${fmt(bx - mw * 0.58)} ${fmt(by - 0.02 * H)}Q${fmt(bx)} ${fmt(by + 0.005 * H)} ${fmt(bx + mw * 0.58)} ${fmt(by - 0.02 * H)}Q${fmt(bx + mw * 0.42)} ${fmt(by + 0.13 * H)} ${fmt(bx)} ${fmt(by + 0.13 * H)}Q${fmt(bx - mw * 0.42)} ${fmt(by + 0.13 * H)} ${fmt(bx - mw * 0.58)} ${fmt(by - 0.02 * H)}Z`;
    const rec = k.recorte([d]);
    boca.push(<path key="m" d={d} fill="#3A0D1E" />);
    boca.push(
      <g key="mi" clipPath={rec}>
        <rect x={bx - mw} y={by - 0.04 * H} width={mw * 2} height={0.06 * H} rx={0.02 * H} fill="#FFFFFF" />
        <ellipse cx={bx + mw * 0.08} cy={by + 0.135 * H} rx={mw * 0.36} ry={0.05 * H} fill="#E8657E" />
      </g>,
    );
  } else if (ex.boca === 'o') {
    const d = `M${fmt(bx)} ${fmt(by - 0.035 * H)}C${fmt(bx + mw * 0.32)} ${fmt(by - 0.035 * H)} ${fmt(bx + mw * 0.3)} ${fmt(by + 0.1 * H)} ${fmt(bx)} ${fmt(by + 0.1 * H)}C${fmt(bx - mw * 0.3)} ${fmt(by + 0.1 * H)} ${fmt(bx - mw * 0.32)} ${fmt(by - 0.035 * H)} ${fmt(bx)} ${fmt(by - 0.035 * H)}Z`;
    const rec = k.recorte([d]);
    boca.push(<path key="m" d={d} fill="#3A0D1E" />);
    boca.push(
      <g key="mi" clipPath={rec}>
        <ellipse cx={bx} cy={by + 0.11 * H} rx={mw * 0.24} ry={0.045 * H} fill="#E8657E" />
      </g>,
    );
  } else if (ex.boca === 'reto') {
    const d = `M${fmt(bx - mw * 0.4)} ${fmt(by + 0.012 * H)}Q${fmt(bx)} ${fmt(by - 0.006 * H)} ${fmt(bx + mw * 0.4)} ${fmt(by + 0.016 * H)}`;
    boca.push(<path key="m" d={d} stroke={labio} strokeWidth={0.75} strokeLinecap="round" fill="none" />);
  } else {
    // focado: boca fechada, firme, sem cara de bravo
    const d = `M${fmt(bx - mw * 0.36)} ${fmt(by + 0.004 * H)}Q${fmt(bx)} ${fmt(by + 0.016 * H)} ${fmt(bx + mw * 0.36)} ${fmt(by + 0.002 * H)}`;
    boca.push(<path key="m" d={d} stroke={labio} strokeWidth={0.85} strokeLinecap="round" fill="none" />);
  }

  // ---- nariz (sombra e brilho; de perfil já está no contorno)
  const nariz: React.ReactNode[] = [];
  if (vista === 'frente') {
    nariz.push(<ellipse key="n1" cx={0.012 * W} cy={0.168 * H} rx={0.062 * W} ry={0.022 * H} fill={pele.fundo} opacity={0.5} />);
    nariz.push(<ellipse key="n2" cx={0.035 * W} cy={0.09 * H} rx={0.022 * W} ry={0.065 * H} fill={pele.sombra} opacity={0.35} />);
    nariz.push(<ellipse key="n3" cx={-0.012 * W} cy={0.128 * H} rx={0.022 * W} ry={0.016 * H} fill="#FFFFFF" opacity={0.28} />);
  } else if (vista === 'tres-quartos') {
    const tip = P3(0, 0.15, 0.46).p;
    const ponte = P3(0, 0.0, 0.42).p;
    const d = suave([
      [ponte[0] - 0.01 * W, ponte[1]],
      [tip[0] + 0.022 * W, tip[1] - 0.04 * H],
      [tip[0] + 0.034 * W, tip[1] + 0.004 * H],
      [tip[0] + 0.006 * W, tip[1] + 0.032 * H],
      [tip[0] - 0.045 * W, tip[1] + 0.028 * H],
      [tip[0] - 0.05 * W, tip[1] + 0.0 * H],
      [ponte[0] - 0.02 * W, ponte[1] + 0.06 * H],
    ]);
    nariz.push(<ellipse key="n0" cx={tip[0] + 0.025 * W} cy={tip[1] + 0.03 * H} rx={0.05 * W} ry={0.02 * H} fill={pele.fundo} opacity={0.4} />);
    nariz.push(<path key="n1" d={d} fill={k.bolha(pele, 1.2)} />);
    nariz.push(<ellipse key="n2" cx={tip[0] - 0.015 * W} cy={tip[1] - 0.012 * H} rx={0.018 * W} ry={0.014 * H} fill="#FFFFFF" opacity={0.3} />);
    nariz.push(<path key="n3" d={`M${fmt(tip[0] - 0.035 * W)} ${fmt(tip[1] + 0.028 * H)}q${fmt(0.02 * W)} ${fmt(0.008 * H)} ${fmt(0.04 * W)} 0`} stroke={pele.fundo} strokeWidth={0.5} strokeLinecap="round" fill="none" opacity={0.7} />);
  } else {
    nariz.push(<path key="n1" d={`M${fmt(0.5 * W)} ${fmt(0.18 * H)}q${fmt(0.02 * W)} ${fmt(-0.012 * H)} ${fmt(0.045 * W)} 0`} stroke={pele.fundo} strokeWidth={0.5} strokeLinecap="round" fill="none" opacity={0.7} />);
    nariz.push(<ellipse key="n2" cx={0.56 * W} cy={0.128 * H} rx={0.016 * W} ry={0.012 * H} fill="#FFFFFF" opacity={0.3} />);
  }

  // ---- rubor
  const rubor: React.ReactNode[] = [];
  const corRubor = escura ? '#E8486A' : '#FF5C7A';
  const fillRubor = k.radCaixa(0.5, 0.5, 0.5, [
    [0, corRubor, escura ? 0.55 : 0.5],
    [1, corRubor, 0],
  ], `rub${corRubor}`);
  for (const lado of [-1, 1] as const) {
    const q = P3(lado * 0.27, 0.17, 0.36);
    const f = vira(lado * 0.27, 0.36);
    if (f < 0.15) continue;
    rubor.push(<ellipse key={lado} cx={q.p[0]} cy={q.p[1]} rx={0.11 * W * clamp(f / 0.8, 0.5, 1)} ry={0.06 * H} fill={fillRubor} opacity={ex.rubor} />);
  }

  // ---- linhas da idade (sulco nasogeniano suave)
  if (med.idoso && vista !== 'perfil') {
    for (const lado of [-1, 1] as const) {
      const a = P3(lado * 0.12, 0.17, 0.42);
      const b = P3(lado * 0.17, 0.28, 0.37);
      if (vira(lado * 0.15, 0.4) < 0.3) continue;
      rugas.push(<path key={`n${lado}`} d={`M${fmt(a.p[0])} ${fmt(a.p[1])}Q${fmt(a.p[0] + lado * 0.05 * W)} ${fmt((a.p[1] + b.p[1]) / 2)} ${fmt(b.p[0])} ${fmt(b.p[1])}`} stroke={pele.fundo} strokeWidth={0.42} strokeLinecap="round" fill="none" opacity={0.38} />);
    }
  }
  // cansado: olheira suave
  if (humor === 'cansado') {
    for (const lado of [-1, 1] as const) {
      const q = P3(lado * olhoX, 0.12, 0.36);
      if (vira(lado * olhoX, 0.37) < 0.2) continue;
      rugas.push(<ellipse key={`o${lado}`} cx={q.p[0]} cy={q.p[1]} rx={erx * 1.1} ry={0.025 * H} fill={pele.fundo} opacity={0.3} />);
    }
  }

  // ---- barba
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
      const reg = [...fora, ...dentro];
      if (pessoa.barba === 'rala') {
        barba.push(<path key="b" d={suave(reg)} fill={mb.base} opacity={escura ? 0.42 : 0.3} clipPath={recCab} />);
      } else {
        const d = suave(cachos(reg, 0.45, 2.6));
        barba.push(<path key="b" d={d} fill={k.bolha(mb, 0.7)} clipPath={recCab} />);
        barba.push(<path key="bb" d={d} fill={k.linCaixa(0, 0, 0, 1, [[0, '#000', 0], [0.7, '#000', 0], [1, '#000', 0.25]], 'bbsh')} clipPath={recCab} />);
      }
    }
    if (pessoa.barba !== 'rala') {
      const db = suave(bigode);
      barba.push(<path key="bg" d={db} fill={k.bolha(mb, 0.9)} />);
    } else {
      barba.push(<path key="bg" d={suave(bigode)} fill={mb.base} opacity={escura ? 0.5 : 0.36} />);
    }
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
    orelhas.push({ c: [q.p[0] + (vista === 'perfil' ? 0 : 0.02 * W), q.p[1]], lado: -1, atras: false, rx: (vista === 'perfil' ? 0.085 : 0.07) * W, ry: 0.115 * H, giro: -10 });
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

  // ---- o dedo na pele
  const toque: React.ReactNode[] = [];
  if (toqueLocal && forca > 0) {
    const [tx, ty] = toqueLocal;
    const r = 0.05 * W * (0.8 + 0.4 * forca);
    const corRub = escura ? '#D84464' : '#FF5470';
    const fRub = k.radCaixa(0.5, 0.5, 0.5, [
      [0, corRub, 0.3],
      [0.6, corRub, 0.12],
      [1, corRub, 0],
    ], 'aperto');
    // o poço: anel escuro mais grosso do lado de cima-esquerda (a parede de dentro que não pega luz)
    const fx = k.espelho ? 0.7 : 0.3;
    const fPoco = k.radCaixa(0.5, 0.5, 0.5, [
      [0, pele.fundo, 0],
      [0.55, pele.fundo, 0.05],
      [0.86, pele.fundo, 0.75],
      [1, pele.fundo, 0],
    ], `poco${k.espelho}`, 1 - fx, 0.68);
    // a borda estufada: anel claro mais grosso do lado da luz, sombra macia do outro lado
    const fEstufa = k.radCaixa(0.5, 0.5, 0.5, [
      [0, pele.luz, 0],
      [0.62, pele.luz, 0],
      [0.8, pele.luz, 0.55],
      [1, pele.luz, 0],
    ], `estufa${k.espelho}`, fx, 0.32);
    const fSombraFora = k.radCaixa(0.5, 0.5, 0.5, [
      [0, pele.fundo, 0],
      [0.7, pele.fundo, 0],
      [0.88, pele.fundo, 0.45],
      [1, pele.fundo, 0],
    ], `fora${k.espelho}`, fx, 0.3);
    // a pele avermelha em volta do aperto (difuso)
    toque.push(<ellipse key="tr" cx={tx} cy={ty + r * 0.3} rx={r * 3} ry={r * 2.6} fill={fRub} opacity={0.3 + 0.7 * forca} />);
    toque.push(<ellipse key="tf" cx={tx + esp * r * 0.25} cy={ty + r * 0.3} rx={r * 2.25} ry={r * 2.0} fill={fSombraFora} opacity={0.3 + 0.7 * forca} />);
    toque.push(<ellipse key="te" cx={tx} cy={ty + r * 0.1} rx={r * 1.95} ry={r * 1.75} fill={fEstufa} opacity={0.3 + 0.7 * forca} />);
    toque.push(<ellipse key="tp" cx={tx} cy={ty} rx={r * (0.95 + 0.35 * forca)} ry={r * (0.85 + 0.3 * forca)} fill={fPoco} opacity={0.35 + 0.65 * forca} />);
    // a dobrinha que a pele faz embaixo do dedo
    const arco = (a0: number, a1: number, rr: number) => {
      const p0: P = [tx + Math.cos(a0 * RAD) * rr, ty + Math.sin(a0 * RAD) * rr];
      const p1: P = [tx + Math.cos(a1 * RAD) * rr, ty + Math.sin(a1 * RAD) * rr];
      return `M${fmt(p0[0])} ${fmt(p0[1])}A${fmt(rr)} ${fmt(rr)} 0 0 1 ${fmt(p1[0])} ${fmt(p1[1])}`;
    };
    toque.push(<path key="td" d={arco(35, 125, r * 1.75)} stroke={pele.fundo} strokeWidth={0.35} strokeLinecap="round" fill="none" opacity={0.55 * forca} />);
    // a sombra do dedo na bochecha (macia, ao longo do dedo, pra baixo-direita)
    if (j.mao[1] === 'aponta') {
      const am = j.ang.mao[1] - ang;
      const dirx = -Math.sin(am * RAD);
      const diry = -Math.cos(am * RAD);
      const L = 0.32 * W;
      const cx = tx + dirx * L * 0.5 + esp * 0.03 * W;
      const cy = ty + diry * L * 0.5 + 0.04 * H;
      const rot = (Math.atan2(diry, dirx) * 180) / Math.PI;
      toque.push(<ellipse key="ts" cx={cx} cy={cy} rx={L * 0.55} ry={0.05 * W} transform={`rotate(${fmt(rot)} ${fmt(cx)} ${fmt(cy)})`} fill={pele.fundo} opacity={0.4} filter={k.desfoque(0.9)} />);
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
  const cabeloFrente = (
    <g>
      {frentePecas.length > 0 && <Vol k={k} pecas={frentePecas} giro={ang} forca={0.9} />}
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
      <Vol k={k} pecas={[{ d: dCab, fill: k.bolha(pele, 1) }]} giro={ang}>
        {/* sombra embaixo do queixo (a mandíbula vira pra dentro) e o volume da maçã do rosto */}
        <g clipPath={recCab}>
          <ellipse cx={vista === 'frente' ? 0 : 0.12 * W} cy={0.52 * H} rx={0.42 * W} ry={0.12 * H} fill={pele.fundo} opacity={0.35} filter={k.desfoque(1.2)} />
          {sombraCabelo}
          {rubor}
          {rugas}
          {toque.length > 0 && <g filter={k.desfoque(0.3)}>{toque}</g>}
          {barba}
        </g>
      </Vol>
      {brilhoCareca}
      {nariz}
      {sobrs}
      {olhos}
      {boca}
      {orelhaFrente}
      {brincos}
      {cabeloFrente}
      {oculos}
      {chapeu}
      {fones}
    </g>
  );
  return { tras, frente, recCab, W, H };
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
