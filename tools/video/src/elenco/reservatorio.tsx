// Reservatório (fase 3): o tanque de estoque — peça `reservatorio`, conteúdo da lente e Medidor do
// `faz`. Um prisma hexagonal de vidro em pé, visto um pouco de cima: a face da frente, uma lateral
// mais clara (a luz vem de cima à esquerda) e outra mais escura, e a boca hexagonal (o hexágono da
// marca) com o aro na cor. Dentro, um campo denso de grãos (cápsulas pequenas) cortado no nível.
//
// Régua do parceiro: ESTOQUE, nunca "carregando". O nível sobe em ≥ 1,5 s com os grãos chovendo e
// assentando; dourado só nos grãos e no aro (vidro e fundo navy à vista, sem glow em volta); sem
// tampa-polo, sem faixas horizontais, sem raio, sem "+". As 3 marcas da lateral são curtas e sem
// número (um copo medidor, não uma bateria).
//
// Mesmas regras do cast.tsx: chapado, sem contorno, sombra num lado só, nada de texto no desenho.
// Importa só TIPOS de scenes.tsx (sem ciclo de import).
import React from 'react';
import { Easing, interpolate, spring } from 'remotion';
import { MOLA } from '../components';
import { C } from '../theme';
import { FPS, cue } from '../timeline';
import type { MS } from '../molde/scenes';
import type { ReservaSpec } from '../molde/spec';

// ------------------------------------------------------------------ utilidades (a lente usa também)

/** Pseudoaleatório fixo por índice: o mesmo grão no mesmo lugar em todo quadro. */
export const rnd = (i: number, salt = 0) => {
  const x = Math.sin(i * 127.1 + salt * 311.7 + 0.5) * 43758.5453;
  return x - Math.floor(x);
};
const rgbOf = (h: string): [number, number, number] | null => {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(h.trim());
  if (!m) return null;
  const x = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)];
};
/** Mistura duas cores hex (t = 0 → a, 1 → b). Cor que não é hex volta como veio. */
export const mix = (a: string, b: string, t: number) => {
  const A = rgbOf(a);
  const B = rgbOf(b);
  if (!A || !B) return a;
  const c = A.map((v, i) => Math.round(v + (B[i] - v) * Math.max(0, Math.min(1, t))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const SHADE = 'rgba(10,14,38,0.28)';
const shine = 'rgba(255,255,255,0.22)';

// ------------------------------------------------------------------ geometria (viewBox 200 × 270)
//
// Hexágono com uma face de frente, achatado em K (visto de cima). Fora = o vidro; dentro = o
// conteúdo (5 un. de parede). y do topo = centro da boca; y da base = aresta de baixo da frente.
const K = 0.3;
const R = 84;
const DZ = R * 0.866 * K; // meia profundidade do hexágono visto de cima
const TOP = 42;
const BASE = 250;
const X = { l: 100 - R, fl: 100 - R / 2, fr: 100 + R / 2, r: 100 + R };
const RI = R - 6;
const DI = RI * 0.866 * K;
const XI = { l: 100 - RI, fl: 100 - RI / 2, fr: 100 + RI / 2, r: 100 + RI };
const IN_BASE = BASE - 5; // aresta de baixo do conteúdo, na frente
const IN_LO = IN_BASE - DI; // centro do hexágono do fundo
const IN_HI = TOP + 3; // centro da superfície com o tanque cheio (rente ao aro)
/** y do centro da superfície do conteúdo no nível n. */
const surfY = (n: number) => IN_LO - (IN_LO - IN_HI) * n;

const pts = (p: [number, number][]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
const FACE_L = pts([[X.l, TOP], [X.fl, TOP + DZ], [X.fl, BASE], [X.l, BASE - DZ]]);
const FACE_F = pts([[X.fl, TOP + DZ], [X.fr, TOP + DZ], [X.fr, BASE], [X.fl, BASE]]);
const FACE_R = pts([[X.fr, TOP + DZ], [X.r, TOP], [X.r, BASE - DZ], [X.fr, BASE]]);
const OUTER = pts([[X.l, TOP], [X.fl, TOP - DZ], [X.fr, TOP - DZ], [X.r, TOP], [X.r, BASE - DZ], [X.fr, BASE], [X.fl, BASE], [X.l, BASE - DZ]]);
const MOUTH = pts([[X.l, TOP], [X.fl, TOP + DZ], [X.fr, TOP + DZ], [X.r, TOP], [X.fr, TOP - DZ], [X.fl, TOP - DZ]]);
const RIM_BACK = `M${X.l} ${TOP} L${X.fl} ${TOP - DZ} L${X.fr} ${TOP - DZ} L${X.r} ${TOP}`;
const RIM_FRONT_L = `M${X.l} ${TOP} L${X.fl} ${TOP + DZ} L${100} ${TOP + DZ}`;
const RIM_FRONT_R = `M${100} ${TOP + DZ} L${X.fr} ${TOP + DZ} L${X.r} ${TOP}`;

/** O contorno do conteúdo com a superfície em yc: a boca de trás reta, o fundo pela frente. */
const silhouette = (yc: number) =>
  `M${XI.l} ${yc} L${XI.fl} ${yc - DI} L${XI.fr} ${yc - DI} L${XI.r} ${yc} L${XI.r} ${IN_LO} L${XI.fr} ${IN_BASE} L${XI.fl} ${IN_BASE} L${XI.l} ${IN_LO} Z`;
/** A aresta da frente da superfície, com a ondinha (amplitude `amp`, em un.). */
const frontEdge = (yc: number, t: number, amp: number): [number, number][] => {
  const corners: [number, number][] = [[XI.l, yc], [XI.fl, yc + DI], [XI.fr, yc + DI], [XI.r, yc]];
  const out: [number, number][] = [];
  for (let k = 0; k < 3; k++) {
    const [ax, ay] = corners[k];
    const [bx, by] = corners[k + 1];
    const n = k === 1 ? 14 : 6;
    for (let j = 0; j < n; j++) {
      const f = j / n;
      const x = ax + (bx - ax) * f;
      out.push([x, ay + (by - ay) * f + amp * Math.sin(x * 0.16 + t * 0.22)]);
    }
  }
  out.push(corners[3]);
  return out;
};

// ------------------------------------------------------------------ os grãos

type Grao = { x: number; y: number; a: number; v: number; k: number };
/** Campo fixo de cápsulas em grade hexagonal com sacudida; o nível só recorta. */
const GRAOS: Grao[] = (() => {
  const out: Grao[] = [];
  let i = 0;
  for (let row = 0; ; row++) {
    const y = IN_BASE + 1 - row * 6.2;
    if (y < TOP - DZ - 4) break;
    for (let x = XI.l - 3 + (row % 2 ? 4.7 : 0); x < XI.r + 4; x += 9.4) {
      out.push({ x: x + (rnd(i, 1) - 0.5) * 3.2, y: y + (rnd(i, 2) - 0.5) * 2.6, a: (rnd(i, 3) - 0.5) * 150, v: rnd(i, 4), k: rnd(i, 5) });
      i++;
    }
  }
  return out;
})();
const GRAO_W = 8.2;
const GRAO_H = 4.6;

const Capsula: React.FC<{ x: number; y: number; a: number; fill: string; s?: number; op?: number }> = ({ x, y, a, fill, s = 1, op = 1 }) => (
  <rect
    x={-GRAO_W / 2}
    y={-GRAO_H / 2}
    width={GRAO_W}
    height={GRAO_H}
    rx={GRAO_H / 2}
    fill={fill}
    opacity={op}
    transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(0)}) scale(${s})`}
  />
);

// ------------------------------------------------------------------ tempos

/** Quadros entre a deixa e o primeiro grão pousar (o nível só anda depois). */
export const POUSA = 8;
/** Duração da subida do nível (≥ 1,5 s: estoque enchendo, não "carregando"). */
export const SOBE = 48;
/** Os grãos de cima assentam por 12 q depois da subida. */
const ASSENTA = 12;
/** A descida de um jato (ease-out de 10 q) e o tamanho do gole. */
const DESCE = 10;
const GOLE = 0.06;
/** O borrifo da válvula some em 12 q; o fio de cima cai em 18 q. */
export const JATO = 12;
export const PINGA = 18;
const QUEDA = 16;
const CHUVA = 16;

/**
 * O tanque. `size` = largura; altura = 1,35 × size. `nivel` 0..1. `jato`/`pinga` 0..1 = fase de um
 * jato pela válvula / de um fio caindo no topo (0 = nada). `assenta` = quadros desde que a última
 * subida começou (de `reservaAt`): enquanto ela dura, os grãos chovem pela boca; depois, os de cima
 * assentam. Sem `assenta` (a peça com `progress`), o nível só acompanha.
 */
export const Reservatorio: React.FC<{
  t: number;
  size: number;
  nivel: number;
  accent?: string;
  conteudo?: 'grao' | 'liquido';
  jato?: number;
  pinga?: number;
  assenta?: number;
}> = ({ t, size, nivel, accent = C.gold, conteudo = 'grao', jato = 0, pinga = 0, assenta }) => {
  const id = `res${React.useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const n = clamp01(nivel);
  const yc = surfY(n);
  const has = n > 0.004;
  const liquido = conteudo === 'liquido';
  const dark = mix(accent, C.deep, 0.26);
  const light = mix(accent, '#FFFFFF', 0.32);
  const backing = mix(accent, C.deep, 0.8);

  // subida: chove até o fim dela; depois os grãos de cima assentam com a mola de pouso
  const a = assenta ?? 1e9;
  const subindo = a >= 0 && a < POUSA + SOBE;
  const solto = subindo ? 1 : a < POUSA + SOBE + ASSENTA + 8 ? 1 - spring({ frame: a - POUSA - SOBE, fps: FPS, config: MOLA.pousa }) : 0;
  const amp = liquido ? 1.8 : 1.1;
  const edge = frontEdge(yc, t, amp);
  const surface = `M${XI.l} ${yc} L${XI.fl} ${yc - DI} L${XI.fr} ${yc - DI} L${XI.r} ${yc} ${edge
    .slice()
    .reverse()
    .map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ')} Z`;
  const rightFace = `M${XI.fr} ${yc + DI} L${XI.r} ${yc} L${XI.r} ${IN_LO} L${XI.fr} ${IN_BASE} Z`;
  const leftFace = `M${XI.l} ${yc} L${XI.fl} ${yc + DI} L${XI.fl} ${IN_BASE} L${XI.l} ${IN_LO} Z`;
  const topBack = yc - DI;

  // grãos que caem pela boca durante a subida (cada um pousa na superfície e some)
  const chuva: React.ReactNode[] = [];
  if (!liquido && subindo) {
    for (let i = 0; i < CHUVA; i++) {
      const c = Math.floor((a - (i * QUEDA) / CHUVA) / QUEDA);
      if (c < 0) continue;
      const nasce = c * QUEDA + (i * QUEDA) / CHUVA;
      if (nasce > POUSA + SOBE - QUEDA) continue;
      const tau = (a - nasce) / QUEDA;
      const seed = i * 13 + c;
      const x = XI.fl - 14 + rnd(seed, 6) * (XI.fr - XI.fl + 28);
      const y0 = -70 - rnd(seed, 7) * 40;
      const land = yc + (rnd(seed, 8) - 0.5) * DI * 1.3;
      const y = y0 + (land - y0) * tau * tau;
      if (y >= land) continue;
      chuva.push(<Capsula key={`c${i}`} x={x} y={y} a={rnd(seed, 9) * 180 + tau * 260} fill={rnd(seed, 10) < 0.3 ? light : accent} />);
    }
  }
  // o fio de 6 grãos que pinga no centro
  if (!liquido && pinga > 0 && pinga < 1) {
    const head = -80 + (yc + 80) * Math.pow(pinga, 1.5) * 1.12;
    for (let j = 0; j < 6; j++) {
      const y = head - j * 11;
      if (y > yc || y < -96) continue;
      chuva.push(<Capsula key={`p${j}`} x={100 + Math.sin(j * 1.7) * 1.2} y={y} a={90 + j * 23} fill={j % 2 ? light : accent} />);
    }
  }

  // o borrifo da válvula: 8 grãos em arco pra fora, que caem e somem
  const spout: [number, number] = [X.r + 15, BASE - DZ - 17];
  const borrifo: React.ReactNode[] = [];
  if (jato > 0 && jato < 1) {
    for (let j = 0; j < 8; j++) {
      const tau = clamp01((jato - j * 0.045) / 0.68);
      if (tau <= 0 || tau >= 1) continue;
      const x = spout[0] + 4 + tau * (24 + j * 5);
      const y = spout[1] + 1 - tau * (13 - j * 0.9) + 44 * tau * tau;
      if (liquido) borrifo.push(<circle key={j} cx={x} cy={y} r={3.2 * (1 - 0.4 * tau)} fill={accent} opacity={1 - tau * tau} />);
      else borrifo.push(<Capsula key={j} x={x} y={y} a={j * 41 + tau * 300} fill={j % 3 ? accent : light} op={1 - tau * tau} />);
    }
  }
  const abre = jato > 0 && jato < 1 ? Math.sin(Math.PI * jato) : 0;

  // as 3 marcas da lateral (curtas, sem número): na face da esquerda, seguindo a inclinação dela
  const marcas = [0.25, 0.5, 0.75].map((m) => {
    const yv = surfY(m) - 2;
    const slope = DZ / (X.fl - X.l);
    const x1 = X.l + 9;
    const x2 = X.l + 22;
    return <line key={m} x1={x1} y1={yv + (x1 - X.l) * slope} x2={x2} y2={yv + (x2 - X.l) * slope} stroke="rgba(255,255,255,0.55)" strokeWidth={3} strokeLinecap="round" />;
  });

  return (
    <svg width={size} height={size * 1.35} viewBox="0 0 200 270" style={{ overflow: 'visible' }}>
      <defs>
        <clipPath id={`${id}c`}>
          <path d={silhouette(yc)} />
        </clipPath>
      </defs>
      <ellipse cx={100} cy={BASE + 5} rx={92} ry={9} fill="rgba(0,0,0,0.25)" />
      {/* vidro de trás e a boca vista de cima (o fundo de dentro) */}
      <polygon points={OUTER} fill="rgba(255,255,255,0.06)" />
      <polygon points={MOUTH} fill="rgba(10,14,38,0.32)" />
      <path d={RIM_BACK} stroke={dark} strokeWidth={6} fill="none" strokeLinejoin="round" strokeLinecap="round" />

      {/* o conteúdo, recortado no nível */}
      {has ? (
        <g clipPath={`url(#${id}c)`}>
          <rect x={0} y={0} width={200} height={270} fill={liquido ? accent : backing} opacity={liquido ? 1 : 0.94} />
          {liquido ? (
            <>
              <circle cx={74} cy={IN_BASE - 30} r={4} fill={shine} />
              <circle cx={118} cy={IN_BASE - 62} r={3} fill={shine} />
              <circle cx={92} cy={IN_BASE - 96} r={2.5} fill={shine} />
            </>
          ) : (
            GRAOS.map((g, i) => {
              if (g.y < topBack - 5) return null;
              // os de cima ficam soltos enquanto chove e assentam depois
              const perto = g.y - topBack < 20;
              const dy = perto && solto > 0 ? -solto * (1.2 + 2.4 * g.k) * (subindo ? 0.6 + 0.4 * Math.sin(t * 0.7 + g.k * 9) : 1) : 0;
              const fill = g.v < 0.58 ? accent : g.v < 0.9 ? dark : light;
              return <Capsula key={i} x={g.x} y={g.y + dy} a={g.a} fill={fill} />;
            })
          )}
          {/* a superfície (de cima, lida pela boca), a lateral da direita na sombra, a da esquerda na luz */}
          <path d={surface} fill={liquido ? light : 'rgba(255,255,255,0.13)'} opacity={liquido ? 0.55 : 1} />
          <path d={rightFace} fill={SHADE} />
          <path d={leftFace} fill="rgba(255,255,255,0.05)" />
        </g>
      ) : null}

      {chuva}

      {/* vidro da frente: lateral clara, frente, lateral escura; reflexo vertical */}
      <polygon points={FACE_L} fill="rgba(255,255,255,0.15)" />
      <polygon points={FACE_F} fill="rgba(255,255,255,0.07)" />
      <polygon points={FACE_R} fill="rgba(10,14,38,0.16)" />
      <rect x={X.fl + 9} y={TOP + DZ + 14} width={7} height={BASE - TOP - DZ - 40} rx={3.5} fill={shine} />
      <rect x={X.fl + 20} y={TOP + DZ + 22} width={3} height={BASE - TOP - DZ - 90} rx={1.5} fill="rgba(255,255,255,0.13)" />
      <rect x={X.l + 4} y={TOP + 10} width={4} height={BASE - TOP - DZ - 34} rx={2} fill="rgba(255,255,255,0.12)" transform={`skewY(${((Math.atan(DZ / (X.fl - X.l)) * 180) / Math.PI).toFixed(1)})`} />
      {marcas}

      {/* válvula pequena embaixo à direita: o cano e a manopla que abre no jato */}
      <rect x={X.r - 4} y={spout[1] - 5} width={spout[0] - X.r + 6} height={10} rx={3} fill={C.mid} />
      <rect x={X.r - 4} y={spout[1]} width={spout[0] - X.r + 6} height={5} rx={2.5} fill={SHADE} />
      <rect x={spout[0] - 1} y={spout[1] - 7} width={5} height={14} rx={2} fill={C.dim} />
      <g transform={`rotate(${(90 * abre).toFixed(1)} ${X.r + 7} ${spout[1] - 6})`}>
        <rect x={X.r + 5.5} y={spout[1] - 13} width={3} height={8} rx={1.5} fill={C.dim} />
        <rect x={X.r + 1} y={spout[1] - 15} width={12} height={4} rx={2} fill={C.mid} />
      </g>
      {borrifo}

      {/* o aro (a boca hexagonal da marca), na frente: luz na esquerda, sombra na direita */}
      <path d={RIM_FRONT_L} stroke={accent} strokeWidth={6} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <path d={RIM_FRONT_R} stroke={accent} strokeWidth={6} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <path d={RIM_FRONT_R} stroke={SHADE} strokeWidth={6} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <path d={`M${X.l + 3} ${TOP + 1} L${X.fl - 4} ${TOP + DZ - 1}`} stroke={light} strokeWidth={2.2} strokeLinecap="round" />
    </svg>
  );
};

// ------------------------------------------------------------------ estado no quadro

/** Um trecho do nível: de → para, entre a0 e a1 (subida em seno, descida em ease-out). */
type Trecho = { de: number; para: number; a0: number; a1: number; modo: 'sobe' | 'desce' };
const valor = (tr: Trecho, f: number) =>
  interpolate(f, [tr.a0, tr.a1], [tr.de, tr.para], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: tr.modo === 'sobe' ? Easing.inOut(Easing.sin) : Easing.out(Easing.cubic),
  });

/**
 * Estado do tanque no quadro. `nivel`: o 1º valor sem deixa vale desde o começo (com deixa, o tanque
 * começa vazio e enche nela); cada valor seguinte sobe (grãos chovendo, ≥ 1,5 s) ou desce (10 q) a
 * partir da sua deixa (sem deixa = quando a fala começa). Cada `gasta` solta um jato pela válvula e
 * tira um gole (−0,06) sem esvaziar; cada `pinga` derruba um fio de 6 grãos no topo (o nível fica).
 * `assenta` = quadros desde o começo da última subida (o tanque chove e assenta com ele).
 */
export const reservaAt = (s: MS, spec: ReservaSpec, frame: number): { nivel: number; jato: number; pinga: number; assenta: number } => {
  type Ev = { at: number; v?: number };
  const nivel = spec.nivel ?? [];
  const first = nivel[0];
  const evs: Ev[] = [];
  let start = 0;
  nivel.forEach((n, i) => {
    if (i === 0 && !n.cue) start = clamp01(n.v);
    else evs.push({ at: n.cue ? cue(s, n.cue) : s.lead, v: clamp01(n.v) });
  });
  if (first?.cue) start = 0;
  for (const g of spec.gasta ?? []) evs.push({ at: cue(s, g.cue) });
  evs.sort((x, y) => x.at - y.at);

  let tr: Trecho = { de: start, para: start, a0: -1e9, a1: -1e9 + 1, modo: 'desce' };
  let subiu = -1e9;
  for (const e of evs) {
    if (frame < e.at) break;
    const cur = valor(tr, e.at);
    if (e.v === undefined && tr.modo === 'sobe' && e.at < tr.a1) {
      // gole no meio da subida: ela segue até o fim (sem tranco), só que um gole abaixo
      const alvo = Math.max(0, tr.para - GOLE);
      tr = alvo > cur ? { de: cur, para: alvo, a0: e.at, a1: Math.max(tr.a1, e.at + 12), modo: 'sobe' } : { de: cur, para: alvo, a0: e.at, a1: e.at + DESCE, modo: 'desce' };
      continue;
    }
    const alvo = e.v === undefined ? Math.max(0, cur - GOLE) : e.v;
    if (alvo > cur) {
      tr = { de: cur, para: alvo, a0: e.at + POUSA, a1: e.at + POUSA + SOBE, modo: 'sobe' };
      subiu = e.at;
    } else tr = { de: cur, para: alvo, a0: e.at, a1: e.at + DESCE, modo: 'desce' };
  }
  const phase = (list: { cue: string }[] | undefined, dur: number) => {
    let p = 0;
    for (const g of list ?? []) {
      const a = cue(s, g.cue);
      if (frame >= a && frame < a + dur) p = (frame - a) / dur;
    }
    return p;
  };
  return { nivel: valor(tr, frame), jato: phase(spec.gasta, JATO), pinga: phase(spec.pinga, PINGA), assenta: frame - subiu };
};

// ------------------------------------------------------------------ o medidor do `faz`

/** O tanque dentro da ficha do Medidor: largura e canto (frações da largura da ficha). */
const MED = { tanque: 0.66, left: 0.07, top: 0.08 };
/**
 * O gole do Medidor (acabamento da fase 3): o borrifo do tanque é de grão de 7 px — na ficha ele
 * some. Por cima dele, um JATO de 14 cápsulas 2,3× maiores sai da válvula num arco curto e cai até o
 * pé da ficha, uma atrás da outra (cada uma voa 0,5 da fase), e some no chão da ficha. Dourado só
 * nos grãos; sem brilho em volta.
 */
const JATO_MED = { n: 14, passo: 0.036, voo: 0.5, escala: 2.3 };

/**
 * O tanque do `faz`, numa ficha navy, ao lado dela. `x`,`y` = canto de cima à esquerda da ficha;
 * `size` = largura da ficha (altura = 1,35 ×; ≥ 240 px pra ler o gole). O tanque fica à esquerda e
 * no alto da ficha: a válvula embaixo à direita e, entre ela e a borda, o espaço do jato.
 */
export const Medidor: React.FC<{ t: number; x: number; y: number; size: number; nivel: number; jato: number; accent?: string }> = ({ t, x, y, size, nivel, jato, accent = C.gold }) => {
  const h = size * 1.35;
  const tw = size * MED.tanque;
  const tl = size * MED.left;
  const tt = size * MED.top;
  // a válvula na ficha (px): o mesmo `spout` do Reservatorio, na escala do tanque
  const u = tw / 200;
  const sx = tl + (X.r + 15) * u;
  const sy = tt + (BASE - DZ - 17) * u;
  const light = mix(accent, '#FFFFFF', 0.32);
  const dark = mix(accent, C.deep, 0.26);
  const chao = h - size * 0.07;
  const graos: React.ReactNode[] = [];
  if (jato > 0 && jato < 1) {
    for (let j = 0; j < JATO_MED.n; j++) {
      const tau = clamp01((jato - j * JATO_MED.passo) / JATO_MED.voo);
      if (tau <= 0 || tau >= 1) continue;
      // sai pra fora (o arco abre de grão em grão) e cai até o pé da ficha
      const alcance = size - sx - size * 0.1 - (j % 3) * size * 0.025;
      const gx = sx + size * 0.02 + alcance * tau;
      const gy = sy - size * 0.05 * Math.sin(Math.PI * Math.min(1, tau * 1.6)) + (chao - sy) * tau * tau;
      const op = tau < 0.82 ? 1 : 1 - (tau - 0.82) / 0.18;
      graos.push(<Capsula key={j} x={gx} y={gy} a={j * 47 + tau * 320} fill={j % 4 === 3 ? light : j % 4 === 1 ? dark : accent} s={JATO_MED.escala * u} op={op} />);
    }
  }
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: size, height: h }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: size * 0.14,
          background: `linear-gradient(160deg, rgba(35,41,88,0.92) 0%, rgba(10,14,38,0.9) 100%)`,
          boxShadow: '0 18px 40px rgba(0,0,0,0.38), inset 0 0 0 2px rgba(255,255,255,0.07)',
        }}
      />
      <div style={{ position: 'absolute', left: tl, top: tt }}>
        <Reservatorio t={t} size={tw} nivel={nivel} jato={jato} accent={accent} />
      </div>
      {graos.length ? (
        <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={size} height={h}>
          {graos}
        </svg>
      ) : null}
    </div>
  );
};
