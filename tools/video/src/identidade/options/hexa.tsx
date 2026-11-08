// Família "Hexa v4" — três opções de identidade a partir do Rosto Hexa (hex.tsx).
// A base (geometria, cabelos, elenco, tronco, broche, roupas) é a mesma do hex.tsx,
// copiada pra que a opção "hex" da comparação anterior fique intacta.
import React, { useId } from 'react';
import { random } from 'remotion';
import { C, DIMS, DimId, dimColor } from '../../theme';
import type { IdentityOption, PessoaProps, Pose } from '../types';

type Pt = [number, number];

const SHADE = 'rgba(10,14,38,0.28)';
const SHINE = 'rgba(255,255,255,0.22)';

// ------------------------------------------------------------------ geometria

/** Hexágono em pé (como o radar do app) ou deitado (`flat`), achatável em x. */
const hexPts = (cx: number, cy: number, R: number, sx = 1, flat = false): Pt[] =>
  (flat ? [0, 60, 120, 180, 240, 300] : [-90, -30, 30, 90, 150, 210]).map((a) => {
    const r = (a * Math.PI) / 180;
    return [cx + Math.cos(r) * R * sx, cy + Math.sin(r) * R];
  });

const lerp = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const P = (p: Pt) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;

/** Canto macio no vértice v (entre prev e next): corta `d` em cada aresta. */
const corner = (prev: Pt, v: Pt, next: Pt, d: number) => {
  const a = lerp(v, prev, Math.min(0.5, d / dist(v, prev)));
  const b = lerp(v, next, Math.min(0.5, d / dist(v, next)));
  return `L${P(a)} Q${P(v)} ${P(b)} `;
};

/** Polígono fechado de cantos macios (`d` único ou um por vértice). */
const softPoly = (pts: Pt[], d: number | number[]) => {
  const n = pts.length;
  const dd = (i: number) => (typeof d === 'number' ? d : d[i]);
  const body = pts.map((v, i) => corner(pts[(i - 1 + n) % n], v, pts[(i + 1) % n], dd(i))).join('');
  return 'M' + body.slice(1) + 'Z';
};

/** Linha aberta: as pontas ficam, os vértices do meio amaciam (mesma curva do softPoly). */
const softLine = (pts: Pt[], d: number) => {
  let s = `M${P(pts[0])} `;
  for (let i = 1; i < pts.length - 1; i++) s += corner(pts[i - 1], pts[i], pts[i + 1], d);
  return s + `L${P(pts[pts.length - 1])} `;
};

/** Traço reto paralelo à aresta a→b, `inset` pra dentro (na direção de `toward`). */
const shineOn = (a: Pt, b: Pt, s0: number, s1: number, inset: number, toward: Pt = [100, 95]) => {
  const L = dist(a, b);
  let n: Pt = [-(b[1] - a[1]) / L, (b[0] - a[0]) / L];
  const m = lerp(a, b, 0.5);
  if (n[0] * (toward[0] - m[0]) + n[1] * (toward[1] - m[1]) < 0) n = [-n[0], -n[1]];
  const p = (s: number): Pt => {
    const q = lerp(a, b, s);
    return [q[0] + n[0] * inset, q[1] + n[1] * inset];
  };
  return `M${P(p(s0))} L${P(p(s1))}`;
};

// sentido horário, o mesmo dos contornos — senão a regra nonzero vira furo onde o círculo cruza a forma
const circ = (x: number, y: number, r: number) => `M${x - r} ${y} a${r} ${r} 0 1 1 ${2 * r} 0 a${r} ${r} 0 1 1 ${-2 * r} 0Z`;
const oval = (x: number, y: number, rx: number, ry: number) =>
  `M${x - rx} ${y} a${rx} ${ry} 0 1 1 ${2 * rx} 0 a${rx} ${ry} 0 1 1 ${-2 * rx} 0Z`;

const HEX6 = /^#[0-9a-fA-F]{6}$/;
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: string, b: string, k: number) => {
  if (!HEX6.test(a) || !HEX6.test(b)) return a;
  const [x, y] = [rgb(a), rgb(b)];
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, '0')).join('');
};
/** Destaque dourado/laranja: o broche dourado sumiria nele. */
const nearGold = (a: string) => {
  if (!HEX6.test(a)) return false;
  const [x, g] = [rgb(a), rgb(C.gold)];
  return Math.hypot(x[0] - g[0], x[1] - g[1], x[2] - g[2]) < 110;
};

// ------------------------------------------------------------------- rosto

type Hole = [number, number, number, number];

// Hexágono deitado, um pouco mais alto que largo pra ser rosto:
// testa 71–129 (y 50), maçãs 51/149 (y 95, altura dos olhos), queixo 77–123 (y 141).
const FACE: Pt[] = [
  [71, 50],
  [129, 50],
  [149, 95],
  [123, 141],
  [77, 141],
  [51, 95],
];
const HEAD = softPoly(FACE, [7, 7, 5, 4.5, 4.5, 5]);
// Plano de sombra: tudo à direita de uma reta quase vertical (faceta, não lua).
const FACE_PLANE = 'M128 20 L210 20 L210 170 L113 170Z';
// Brilho: um traço paralelo à aresta de baixo-esquerda (a maçã que pega luz).
const FACE_SHINE = shineOn(FACE[5], FACE[4], 0.16, 0.42, 5.5);

// ------------------------------------------------------------------ cabelos

type HairId = 'bob' | 'beard' | 'twa' | 'silver' | 'braids' | 'curly' | 'bun' | 'afro' | 'crop' | 'long';

type Hair = {
  /** Atrás do rosto (e do tronco): volume, cortinas. */
  back?: string;
  /** Por cima da testa. */
  front?: string;
  /** A mesma lua de sombra nas duas camadas — nenhuma costura aparece. */
  hole: Hole;
  beard?: string;
  stache?: string;
  /** Risca: traço cor de pele por cima do cabelo. */
  part?: string;
  /** Fios soltos fora do contorno (traço na cor do cabelo). */
  strands?: string;
  /** Tranças: riscos escuros na camada de trás + anéis dourados. */
  texture?: string;
  cuffs?: Pt[];
  /** Mecha que cai NA FRENTE do ombro (atrás do rosto, na frente do tronco). */
  drape?: string;
  drapeTexture?: string;
  shine: string;
};

const AFRO_CLOUD = [
  oval(100, 70, 60, 46),
  ...Array.from({ length: 11 }, (_, i) => {
    const a = ((155 + i * 23) * Math.PI) / 180;
    return circ(100 + Math.cos(a) * 57, 70 + Math.sin(a) * 47, 16);
  }),
].join(' ');

const TWA_COILS = Array.from({ length: 9 }, (_, i) => {
  const a = ((192 + i * 19.5) * Math.PI) / 180;
  return circ(100 + Math.cos(a) * 48, 60 + Math.sin(a) * 37, 7.5);
}).join(' ');

const CURLS = [
  [63, 54, 11],
  [74, 38, 12],
  [92, 28, 13],
  [112, 26, 13],
  [130, 33, 12],
  [142, 50, 10.5],
  [121, 16, 8],
  [84, 58, 7],
  [102, 57, 7.5],
]
  .map(([x, y, r]) => circ(x, y, r))
  .join(' ');

// cortinas compridas: topo atrás da cabeça, caem por trás dos ombros; a borda de
// dentro (x 64 / 136) sai de trás da maçã do rosto e deixa um vão até o pescoço.
const curtains = (bottom: number, tip = 0) =>
  'M100 20 C64 20 40 40 38 74 L36 ' +
  (bottom - 8) +
  ` Q36 ${bottom} ${44 + tip} ${bottom} L58 ${bottom} Q64 ${bottom} 64 ${bottom - 8} L64 112 L136 112 L136 ${bottom - 8} Q136 ${bottom} 142 ${bottom} L${156 - tip} ${bottom} Q164 ${bottom} 164 ${bottom - 8} L162 74 C160 40 136 20 100 20Z`;

const HAIRS: Record<HairId, Hair> = {
  // Marina: chanel com risca do lado; o lado direito vai pra trás da orelha e mostra a maçã.
  bob: {
    back: 'M56 150 C46 144 40 124 41 100 C41 60 62 26 100 24 C140 22 160 46 160 76 C160 92 157 104 151 112 L138 104 L80 132 L68 150 Q62 154 56 150Z',
    front: 'M118 26 C90 28 62 40 54 68 C51 78 50 88 51 96 C58 76 82 60 110 55 C124 53 138 58 147 68 C150 52 140 30 118 26Z',
    hole: [86, 70, 64, 72],
    strands: 'M117 30 Q123 41 129 54',
    shine: 'M64 48 Q76 35 94 31',
  },
  beard: {
    front: 'M53 84 C46 58 58 30 92 26 C104 20 116 27 124 23 C142 26 154 44 149 84 L143 82 L140 64 Q122 55 100 56 Q78 55 60 64 L57 82Z',
    hole: [92, 64, 56, 44],
    beard:
      softLine(
        [
          [49, 90],
          [49, 97],
          [76, 145],
          [124, 145],
          [151, 97],
          [151, 90],
        ],
        5,
      ) + 'L145 90 Q145 114 127 122 Q112 128 100 128 Q88 128 73 122 Q55 114 55 90Z',
    stache: 'M85 113.5 Q92 106.5 100 109.5 Q108 106.5 115 113.5 Q108 113.5 100 112.5 Q92 113.5 85 113.5Z',
    shine: 'M66 44 Q78 33 94 31',
  },
  // corte natural curtinho: crespo rente, a borda de cachos estoura o contorno.
  twa: {
    front: 'M52 86 C44 54 64 24 100 22 C136 24 156 54 148 86 L143 84 L141 64 Q122 55 100 55 Q78 55 59 64 L57 84Z ' + TWA_COILS,
    hole: [92, 60, 58, 46],
    shine: 'M68 40 Q80 31 94 29',
  },
  // grisalho de entradas altas: a testa reta do hexágono aparece no meio.
  silver: {
    front:
      'M55 80 C49 60 54 42 72 34 C86 26 102 31 112 26 C126 19 146 29 150 49 C153 61 151 71 147 80 L142 78 L141 66 Q136 56 126 55 Q116 50 104 52 Q90 50 80 54 Q66 55 60 66 L59 78Z',
    hole: [90, 64, 58, 44],
    texture: 'M70 44 Q88 36 104 40 M114 34 Q130 31 142 44',
    shine: 'M64 50 Q70 40 80 35',
  },
  // tranças longas, risca no meio, anéis dourados.
  braids: {
    back: curtains(206),
    front:
      'M99 30 C74 30 56 42 52 64 L51 72 C60 62 76 54 99 47Z M101 30 C126 30 144 42 148 64 L149 72 C140 62 124 54 101 47Z M99 30 L101 30 L101 47 L99 47Z',
    hole: [86, 78, 60, 112],
    part: 'M100 31 L100 49',
    texture: [43, 50, 57, 143, 150, 157].map((x) => `M${x} 72 L${x} 203`).join(' '),
    drape: 'M55 104 L69 111 Q71 150 68 180 Q67 186 62 186 Q57 186 57 180 Q58 140 55 104Z',
    drapeTexture: 'M61 110 Q63 148 61 182 M66 113 Q68 150 66 180',
    cuffs: [
      [39, 196],
      [161, 188],
      [62.5, 172],
    ],
    shine: 'M62 40 Q74 31 88 30',
  },
  // cacheado jovem: volume solto em cima, laterais curtas.
  curly: {
    front: 'M54 84 C48 60 58 40 76 34 L124 34 C142 40 152 60 146 84 L141 82 L139 66 Q122 60 100 60 Q78 60 61 66 L59 82Z ' + CURLS,
    hole: [88, 50, 60, 46],
    shine: 'M68 32 Q76 26 86 24',
  },
  bun: {
    back: circ(106, 20, 15),
    front: 'M53 84 C46 56 64 30 100 28 C136 30 154 56 147 84 L142 82 L140 62 Q122 52 100 52 Q78 52 60 62 L58 82Z',
    hole: [92, 56, 56, 46],
    strands: 'M57 68 Q47 84 53 100',
    shine: 'M66 46 Q78 35 92 33',
  },
  afro: {
    back: AFRO_CLOUD,
    front: 'M54 80 C54 60 70 48 100 46 C130 48 146 60 146 80 L141 78 L139 64 Q122 56 100 56 Q78 56 61 64 L59 78Z',
    hole: [86, 56, 70, 62],
    shine: 'M58 34 Q72 20 90 17',
  },
  crop: {
    front: 'M54 82 C48 58 60 32 96 28 C118 24 134 16 142 30 C152 44 152 62 147 82 L142 80 L140 62 Q124 52 104 54 L94 50 Q76 54 61 62 L59 80Z',
    hole: [92, 60, 56, 44],
    strands: 'M96 32 Q116 28 136 30',
    shine: 'M66 44 Q78 34 92 32',
  },
  // liso comprido, risca do lado, vão nas duas bochechas.
  long: {
    back: curtains(198, 4),
    front: 'M84 30 C68 32 56 44 52 62 L51 72 C60 60 72 52 84 48Z M84 30 C114 24 146 38 150 70 L149 78 C140 62 112 50 84 48Z',
    hole: [86, 78, 60, 108],
    part: 'M84 31 L84 49',
    shine: 'M100 32 Q122 31 138 42',
  },
};

// Cores de cabelo: tons de pele mais escuros + dourado/lavanda do app.
const HAIR_C = {
  // nenhum cabelo é igual a uma pele (cabelo = pele + 20–45% de navy), senão some na testa
  espresso: mix('#5C3A24', C.deep, 0.45),
  brown: mix('#5C3A24', C.deep, 0.2),
  chestnut: mix('#8D5A3B', C.deep, 0.22),
  auburn: mix(C.goldDeep, '#5C3A24', 0.4),
  silver: mix(C.mid, C.hi, 0.3),
};

type Garment = 'knit' | 'overshirt' | 'turtle' | 'cardigan' | 'v' | 'zip' | 'polo';
type Who = { hair: HairId; color: string; garment: Garment; earring?: boolean; glasses?: boolean };

/** Elenco: 0–5 é o núcleo (sempre pessoas diferentes); 6–9 completam a multidão. */
const CAST: Who[] = [
  { hair: 'bob', color: HAIR_C.brown, garment: 'knit' }, // 0 Marina
  { hair: 'beard', color: HAIR_C.espresso, garment: 'overshirt' }, // 1
  { hair: 'twa', color: HAIR_C.espresso, garment: 'turtle', earring: true }, // 2
  { hair: 'silver', color: HAIR_C.silver, garment: 'cardigan', glasses: true }, // 3
  { hair: 'braids', color: HAIR_C.espresso, garment: 'v' }, // 4
  { hair: 'curly', color: HAIR_C.chestnut, garment: 'zip' }, // 5
  { hair: 'bun', color: HAIR_C.auburn, garment: 'polo', earring: true }, // 6
  { hair: 'afro', color: HAIR_C.brown, garment: 'knit', earring: true }, // 7
  { hair: 'crop', color: HAIR_C.brown, garment: 'overshirt', glasses: true }, // 8
  { hair: 'long', color: HAIR_C.chestnut, garment: 'v' }, // 9
];
// Da 2ª volta em diante, o cabelo troca de cor.
const ALT = [HAIR_C.chestnut, HAIR_C.auburn, HAIR_C.espresso, HAIR_C.chestnut, HAIR_C.brown, HAIR_C.espresso, HAIR_C.chestnut, HAIR_C.espresso, HAIR_C.auburn, HAIR_C.brown];

// A cabeça (e tudo que mora nela) é desenhada em escala 0.9 em volta do centro:
// ombros mais largos que a cabeça = proporção de adulto, não de boneco.
const HEAD_SCALE = 'translate(100 92) scale(0.9) translate(-100 -92)';
// O humor também inclina a cabeça (em volta do pescoço): lê de longe.
// focado (fase 3): um tico pra frente, atenta (o rosto é o do Face, abaixo)
const TILT = { ok: 0, feliz: -4, cansado: 6, focado: -1 } as const;

// Tronco: peça única até o meio da coxa — gola reta, ombros caídos, barra.
const TORSO = softPoly(
  [
    [80, 147],
    [120, 147],
    [153, 162],
    [146, 222],
    [54, 222],
    [47, 162],
  ],
  [8, 8, 16, 8, 8, 16],
);
const TORSO_PLANE = 'M126 138 L210 138 L210 232 L118 232Z';
// O broche: mesmo ponto em todo mundo.
const PIN: Pt = [121, 184];

// --------------------------------------------------------------- peças

/** Forma chapada + sombra em lua (tudo fora da elipse `hole` escurece). */
const Shaded: React.FC<{ id: string; d: string; fill: string; hole: Hole; o?: number }> = ({
  id,
  d,
  fill,
  hole: [cx, cy, rx, ry],
  o = 1,
}) => (
  <g>
    <clipPath id={id}>
      <path d={d} />
    </clipPath>
    <path d={d} fill={fill} />
    <path
      clipPath={`url(#${id})`}
      fillRule="evenodd"
      fill={SHADE}
      opacity={o}
      d={`M-20 -20H220V280H-20Z M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`}
    />
  </g>
);

/** Hexágono dourado deitado (broche, brinco, boné): metade de baixo mais funda, anel interno. */
const GoldHex: React.FC<{ x: number; y: number; r: number; onGold?: boolean }> = ({ x, y, r, onGold = false }) => {
  const h = hexPts(x, y, r, 1, true); // 0 direita, 1 baixo-dir, 2 baixo-esq, 3 esquerda, 4 cima-esq, 5 cima-dir
  const outer = softPoly(h, r * 0.18);
  // em roupa dourada/laranja o ouro some: vira o hexágono violeta do app
  const [face, deep] = onGold ? [C.violet, C.violetDeep] : [C.gold, C.goldDeep];
  return (
    <g>
      <path d={outer} fill={face} />
      <path d={`M${P(h[0])} L${P(h[1])} L${P(h[2])} L${P(h[3])}Z`} fill={deep} opacity={0.6} />
      <circle cx={x - r * 0.42} cy={y - r * 0.38} r={r * 0.17} fill="rgba(255,255,255,0.7)" />
    </g>
  );
};

/** Gola/decote + detalhes da peça; recebe a sombra de plano por cima. */
const GarmentDetail: React.FC<{ g: Garment; accent: string; skin: string; uid: string }> = ({ g, accent, skin, uid }) => {
  const dark = mix(accent, C.deep, 0.38);
  const light = mix(accent, C.hi, 0.28);
  const neckSkin = (d: string) => (
    <g>
      <path d={d} fill={skin} />
      <path d={d} fill={SHADE} opacity={0.55} />
    </g>
  );
  switch (g) {
    case 'knit':
      return (
        <g>
          {neckSkin('M88.5 144 L111.5 144 L114 147 Q100 165 86 147Z')}
          <path d="M84 147.5 Q100 169 116 147.5" stroke={dark} strokeWidth={5} fill="none" strokeLinecap="round" />
          <g clipPath={`url(#${uid}t)`}>
            <rect x={40} y={212} width={120} height={14} fill={dark} />
            {[62, 74, 86, 98, 110, 122, 134].map((x) => (
              <path key={x} d={`M${x} 214 V222`} stroke={SHADE} strokeWidth={1.4} />
            ))}
          </g>
        </g>
      );
    case 'overshirt':
      return (
        <g>
          <path d="M86 147 L114 147 L114 224 L86 224Z" fill={mix(C.text, C.mid, 0.3)} />
          {neckSkin('M90.5 146 L109.5 146 Q100 160 90.5 146Z')}
          <path d="M86 150 V224 M114 150 V224" stroke={dark} strokeWidth={2.4} />
          <path d="M79 147 L91 147 L97 165 L84 168Z" fill={dark} />
          <path d="M121 147 L109 147 L103 165 L116 168Z" fill={dark} />
          <rect x={60} y={176} width={18} height={4} rx={2} fill={dark} opacity={0.7} />
        </g>
      );
    case 'turtle':
      return (
        <g>
          <path d="M86 126 L114 126 L116 151 Q100 156 84 151Z" fill={accent} />
          <path d="M86 126 L114 126 L116 151 Q100 156 84 151Z" fill={SHADE} opacity={0.45} />
          <path d="M85.5 141 Q100 145 114.5 141" stroke={dark} strokeWidth={2.2} fill="none" strokeLinecap="round" />
        </g>
      );
    case 'cardigan':
      return (
        <g>
          <path d="M85 147 L100 196 L115 147Z" fill={C.text} />
          {neckSkin('M92.5 145 L107.5 145 L100 155Z')}
          <path d="M87 145 L100 156 L94 166 L82 152Z" fill={C.hi} />
          <path d="M113 145 L100 156 L106 166 L118 152Z" fill={C.text} />
          <path d="M113 145 L100 156 L106 166 L118 152Z" fill={SHADE} opacity={0.35} />
          <path d="M85 148 L100 196 L115 148" stroke={dark} strokeWidth={3.2} fill="none" strokeLinejoin="round" />
          <circle cx={100} cy={204} r={2.4} fill={dark} />
          <circle cx={100} cy={214} r={2.4} fill={dark} />
        </g>
      );
    case 'v':
      return (
        <g>
          {neckSkin('M88 144 L100 172 L112 144Z')}
          <path d="M85.5 146 L100 176 L114.5 146" stroke={dark} strokeWidth={4} fill="none" strokeLinejoin="round" />
        </g>
      );
    case 'zip':
      return (
        <g>
          <path d="M85 136 L115 136 L117 152 Q100 157 83 152Z" fill={accent} />
          <path d="M85 136 L115 136 L117 152 Q100 157 83 152Z" fill={SHADE} opacity={0.4} />
          <path d="M100 141 V224" stroke={dark} strokeWidth={2.6} />
          <rect x={97.5} y={152} width={5} height={10} rx={1.6} fill={C.mid} />
        </g>
      );
    case 'polo':
    default:
      return (
        <g>
          {neckSkin('M90 145 L110 145 L100 163Z')}
          <path d="M85 145 L100 155 L95 165 L80 155Z" fill={light} />
          <path d="M115 145 L100 155 L105 165 L120 155Z" fill={light} />
          <path d="M115 145 L100 155 L105 165 L120 155Z" fill={SHADE} opacity={0.35} />
          <circle cx={100} cy={170} r={1.8} fill={dark} />
          <circle cx={100} cy={178} r={1.8} fill={dark} />
        </g>
      );
  }
};


// ===================================================================== v4 (2026-11-07)
//
// Família Hexa v4 — o pedido do André depois da rodada "Gente de verdade":
// fica o Rosto Hexa (mais limpo, mais identidade), sai a imitação de gente de
// verdade e sai a íris colorida. Olho PRETO, expressão em traço PRETO (neutro),
// e o hexágono que acende atrás quando a pessoa fica feliz vira assinatura.
// Três graus de abstração, mesma anatomia de contrato (caixa 200×260):
//  - limpo   → a gente do Rosto Hexa, sem nariz/blush, olho e traço pretos
//  - mascote → cabeça hexa grande, corpo curto, cabelo em silhueta chapada
//  - cor     → o rosto na cor (clara) de uma das 6 áreas, cabelo no tom fundo dela
// Vida (pesquisa de 2026-11-07): piscada sorteada de 2–5 s (às vezes dupla),
// respiração em escala, pulinho na virada pro feliz, halo com follow-through.

const INK = '#15161F';
// v4.1: a cabeça do Limpo/Cor um tico maior que a do Rosto Hexa (0,9 → 0,96): mais leitura, ainda adulto
const HEAD_V4 = 'translate(100 92) scale(0.96) translate(-100 -92)';

/** 0 = olho aberto, 1 = fechado. Piscadas a cada 2–5 s (sorteio pelo seed), 18% delas duplas. */
const blinkAt = (t: number, seed: number) => {
  const shape = (d: number) => (d < 2 ? d / 2 : d < 4 ? 1 : Math.max(0, 1 - (d - 3) / 4));
  let start = 18 + Math.floor(random(`pisca-${seed}`) * 70);
  for (let n = 0; start <= t && n < 500; n++) {
    const d = t - start;
    if (d < 8) return shape(d);
    if (random(`dupla-${seed}-${n}`) < 0.18 && d >= 10 && d < 18) return shape(d - 10);
    start += 60 + Math.floor(random(`intervalo-${seed}-${n}`) * 90);
  }
  return 0;
};

/**
 * O radar do app atrás de quem fica feliz (v4). DESLIGADO em 2026-11-07: o André viu o vídeo e
 * achou o hexágono atrás "esquisito" — prefere as estrelinhas de brilho de sempre (as cenas voltam
 * a pô-las quando a identidade não tem `halo`). Religar = true aqui; as opções leem daqui.
 */
const RADAR = false;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
/** easeOutBack: passa um pouco e volta (o "assentar" das molas, sem spring()). */
const outBack = (x: number) => {
  const c = 1.0; // fase 1: passa 3,7% (era 1,9 → 12%)
  const y = clamp01(x) - 1;
  return 1 + (c + 1) * y * y * y + c * y * y;
};

/**
 * O radar do app (HexRadar) acendendo atrás de quem fica feliz — "o seu hexágono
 * enche". Placa escura (a pessoa salta como medalha), réguas em terços, raios, e o
 * polígono de dados violeta que cresce do centro até os valores da pessoa (sorteados
 * pelo seed, 0,55–0,95), com as 6 cores das áreas nos vértices. Sem aro dourado: o
 * ouro fica pro broche e pro card (revisão de marca v4: o aro dourado lia como moldura).
 * Entra com passagem (outBack), os pontos chegam em cascata (+2 quadros cada), depois
 * respira devagar. Pequeno (multidão): placa, contorno e pontos, sem réguas.
 */
const Halo: React.FC<{ since: number; t: number; small: boolean; seed: number; cy?: number; R?: number }> = ({ since, t, small, seed, cy = 112, R = 112 }) => {
  const a = clamp01(since / 6);
  const s = (0.72 + 0.28 * outBack(since / 14)) * (1 + 0.01 * Math.sin(t / 30));
  const grow = outBack((since - 3) / 16);
  const outer = hexPts(100, cy, R);
  const axis = (j: number, k: number): Pt => [100 + (outer[j][0] - 100) * k, cy + (outer[j][1] - cy) * k];
  // valores entre 0,62 e 0,95 do raio: com o raio maior que a cabeça, o polígono e os 6 pontos
  // ficam FORA do cabelo e dos ombros (revisão v4.1: centrado no rosto, lia como capuz)
  const ratios = DIMS.map((_, j) => 0.62 + 0.33 * random(`radar-${seed}-${j}`));
  const data = ratios.map((r, j) => axis(j, Math.max(0, r * grow)));
  const gid = `rg${seed}${small ? 's' : ''}${Math.round(cy)}`;
  return (
    <g opacity={a} transform={`translate(100 ${cy}) scale(${s}) translate(-100 ${-cy})`}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.violet2} stopOpacity={0.75} />
          <stop offset="1" stopColor={C.violet} stopOpacity={0.35} />
        </linearGradient>
      </defs>
      <path d={softPoly(outer, R * 0.1)} fill="rgba(10,12,38,0.55)" stroke="rgba(255,255,255,0.26)" strokeWidth={small ? 3 : 2} />
      {!small && (
        <g stroke="rgba(255,255,255,0.13)" strokeWidth={1.6} fill="none">
          <path d={softPoly(hexPts(100, cy, R * 0.67), R * 0.06)} />
          <path d={softPoly(hexPts(100, cy, R * 0.34), R * 0.03)} />
          {outer.map((p, j) => (
            <path key={j} d={`M100 ${cy} L${p[0].toFixed(1)} ${p[1].toFixed(1)}`} />
          ))}
        </g>
      )}
      {grow > 0.02 && <path d={'M' + data.map(P).join(' L') + 'Z'} fill={`url(#${gid})`} stroke={C.violet2} strokeWidth={small ? 3 : 2.4} strokeLinejoin="round" />}
      {data.map((p, j) => (
        <circle key={j} cx={p[0]} cy={p[1]} r={small ? 7 : 6} fill={DIMS[j].color} stroke={C.deep} strokeWidth={2} opacity={clamp01((since - 5 - j * 2) / 5)} />
      ))}
    </g>
  );
};

/** Luminância relativa (WCAG) — o ponto de luz no olho só onde o preto some na pele. */
const lum = (h: string) => {
  if (!HEX6.test(h)) return 1;
  const c = rgb(h).map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};

type Style = 'limpo' | 'mascote' | 'cor';

// Rosto na cor de uma área (opção "cor"): versão clara, pra o olho preto ler.
// A protagonista (seed 0) é a lavanda da Mente — a cor da marca.
const TINT_DIMS: DimId[] = ['mind', 'bonds', 'health', 'craft', 'wealth', 'body'];
const TINTS = TINT_DIMS.map((d) => mix(dimColor(d), '#FFFFFF', 0.4));

const EYE_X = [85, 115] as const;

/** Olhos, sobrancelhas e boca em traço preto. `big`: proporção de mascote. */
const Face: React.FC<{ mood: PessoaProps['mood']; blink: number; glasses?: boolean; big?: boolean; skin: string }> = ({ mood = 'ok', blink, glasses, big, skin }) => {
  const EY = big ? 97 : 94;
  // v4.1 (revisão de marca): o olho do Limpo cresceu rumo ao do Mascote — lê melhor a 90 px
  const [rx, ry] = big ? [6.2, 7.8] : [5.8, 7.1];
  const sw = big ? 4.2 : 3.9;
  // ponto de luz só onde o preto some (pele escura); na clara, o olho é preto puro
  const glint = lum(skin) < 0.2;
  const eye = (x: number) => {
    if (mood === 'feliz') {
      // olho sorrindo: o "^" (pálpebra de baixo subindo) — piscar não muda
      return <path key={x} d={`M${x - rx - 1} ${EY + 2.5} Q${x} ${EY - ry - 1} ${x + rx + 1} ${EY + 2.5}`} stroke={INK} strokeWidth={sw} strokeLinecap="round" fill="none" />;
    }
    if (mood === 'cansado') {
      // pálpebra pesada: meio olho por baixo de um traço reto
      return (
        <g key={x}>
          <ellipse cx={x} cy={EY + 2} rx={rx} ry={(ry * 0.55) * (1 - 0.8 * blink)} fill={INK} />
          <path d={`M${x - rx - 1.5} ${EY - 0.4} Q${x} ${EY - 1.4} ${x + rx + 1.5} ${EY - 0.4}`} stroke={INK} strokeWidth={glasses ? sw - 0.4 : sw - 0.8} strokeLinecap="round" fill="none" />
        </g>
      );
    }
    if (mood === 'focado') {
      // fase 3: atenta, sem ler brava — o olho do ok um tico mais aberto e SEMPRE com o ponto de luz
      // (é o brilho no olho que separa "atenta" de "séria"; sem ele, a sobrancelha reta lê dura)
      const fy = ry * 1.06;
      return (
        <g key={x}>
          <ellipse cx={x} cy={EY} rx={rx} ry={Math.max(1.1, fy * (1 - blink))} fill={INK} />
          {blink < 0.4 && <circle cx={x + rx * 0.38} cy={EY - fy * 0.42} r={rx * 0.28} fill="#FFFFFF" opacity={0.85} />}
        </g>
      );
    }
    return (
      <g key={x}>
        <ellipse cx={x} cy={EY} rx={rx} ry={Math.max(1.1, ry * (1 - blink))} fill={INK} />
        {/* um ponto de luz: o olho continua preto, mas não some na pele escura */}
        {glint && blink < 0.4 && <circle cx={x + rx * 0.38} cy={EY - ry * 0.42} r={rx * 0.28} fill="#FFFFFF" opacity={0.85} />}
      </g>
    );
  };
  const dy = big ? 2 : 0;
  const brows =
    mood === 'feliz'
      ? [`M76 ${78 + dy} Q84 ${73 + dy} 92 ${76 + dy}`, `M108 ${76 + dy} Q116 ${73 + dy} 124 ${78 + dy}`]
      : mood === 'cansado'
        ? [`M76 ${83 + dy} Q84 ${81 + dy} 92 ${77 + dy}`, `M108 ${77 + dy} Q116 ${81 + dy} 124 ${83 + dy}`]
        : mood === 'focado'
          ? // retas, a ponta de dentro meio ponto MAIS ALTA que a de fora: brava é a de dentro descendo
            [`M77 ${80 + dy} L91 ${79.5 + dy}`, `M109 ${79.5 + dy} L123 ${80 + dy}`]
          : [`M77 ${81 + dy} Q84 ${78 + dy} 91 ${80 + dy}`, `M109 ${80 + dy} Q116 ${78 + dy} 123 ${81 + dy}`];
  const my = big ? 3 : 0;
  return (
    <g>
      {EYE_X.map(eye)}
      <g stroke={INK} strokeWidth={big ? 3.6 : 3.5} strokeLinecap="round" fill="none">
        <path d={brows[0]} />
        <path d={brows[1]} />
      </g>
      {mood === 'feliz' ? (
        // sorriso aberto (sem dentes), um tico de língua no tom da pele pra não virar buraco
        <g>
          <path d={`M87 ${113 + my} Q100 ${116.5 + my} 113 ${113 + my} Q111 ${126 + my} 100 ${126 + my} Q89 ${126 + my} 87 ${113 + my}Z`} fill={INK} />
          <path d={`M93 ${123.4 + my} Q100 ${119.5 + my} 107 ${123.4 + my} Q104 ${125.6 + my} 100 ${125.6 + my} Q96 ${125.6 + my} 93 ${123.4 + my}Z`} fill={mix(skin, '#E2566A', 0.55)} />
        </g>
      ) : (
        <path
          d={
            mood === 'cansado'
              ? `M93 ${121 + my} Q100 ${117.5 + my} 107 ${121 + my}`
              : mood === 'focado'
                ? // boca quase reta (um fio de sorriso): concentrada, não emburrada
                  `M93.5 ${118 + my} Q100 ${119.5 + my} 106.5 ${118 + my}`
                : `M92.5 ${117.5 + my} Q100 ${122 + my} 107.5 ${117.5 + my}`
          }
          stroke={INK}
          strokeWidth={big ? 4.2 : 4}
          strokeLinecap="round"
          fill="none"
        />
      )}
    </g>
  );
};

/** Movimento comum: respiração, pulinho/afundada na virada de humor. */
const lifeOf = (t: number, seed: number, mood: PessoaProps['mood'], since: number, still: boolean, strength = 1) => {
  const breath = still ? 0 : Math.sin((t + seed * 13) / 17);
  const hop = mood === 'feliz' && since < 16 ? -7 * strength * Math.sin((Math.PI * since) / 16) : 0;
  const slump = mood === 'cansado' ? 2.2 * strength * clamp01(since / 10) : 0;
  // squash de aterrissagem do pulinho (mantém volume)
  const land = mood === 'feliz' && since >= 14 && since < 22 ? Math.sin((Math.PI * (since - 14)) / 8) : 0;
  const sx = 1 - 0.006 * strength * breath + 0.05 * land;
  const sy = 1 + 0.014 * strength * breath - 0.06 * land;
  return {
    body: `translate(100 244) scale(${sx} ${sy}) translate(-100 -244)`,
    lift: hop + slump + (still ? 0 : Math.sin((t + seed * 11) / 14) * 1.4),
    sx,
    sy,
  };
};

/**
 * A vida do tronco em números (fase 3): o Ator (src/elenco/acao.tsx) põe a peça e a mão por cima
 * dela, então precisa saber onde a mão está DE VERDADE — com a respiração (escala em volta de
 * 100,244) e o sobe-desce (lift) que o corpo do Hexa Limpo faz sozinho.
 */
export const vidaDe = (t: number, seed: number, mood: PessoaProps['mood'], since: number, still = false) => {
  const l = lifeOf(t, seed, mood, since, still);
  return { lift: l.lift, sx: l.sx, sy: l.sy };
};

/**
 * Transformação da pose (fase 3) em volta dos pés (100,252): sobe/desce `y`, inclina, amassa no
 * pouso. As pernas não descem com o corpo (y > 0 = agacha: o tronco cobre mais perna, o pé fica no
 * chão), e a inclinação levanta o corpo o que o pé de baixo afundaria — nada passa da linha do chão.
 */
const poseT = (pose: Pose, legs: boolean) => {
  const y = pose.y ?? 0;
  const inc = pose.inclina ?? 0;
  const a = pose.amassa ?? 0;
  const lift = -34 * Math.sin((Math.abs(inc) * Math.PI) / 180);
  const Y = (legs ? Math.min(0, y) : y) + lift;
  return `translate(0 ${Y.toFixed(2)}) rotate(${inc.toFixed(2)} 100 252) translate(100 252) scale(${(1 + 0.08 * a).toFixed(4)} ${(1 - 0.1 * a).toFixed(4)}) translate(-100 -252)`;
};

/** Sombra no chão com a pose: encolhe quando o corpo sobe (até 55% no topo do salto). */
const shadowK = (pose?: Pose) => 1 - Math.min(0.45, Math.max(0, -(pose?.y ?? 0)) / 130);

const armOf = (side: 'l' | 'r', a: number, accent: string, skin: string, shade: boolean) => {
  const px = side === 'l' ? 58 : 142;
  return (
    <g transform={`rotate(${a} ${px} 158)`} key={side}>
      <rect x={px - 10} y={152} width={20} height={62} rx={10} fill={accent} />
      {shade && <rect x={px - 10} y={152} width={20} height={62} rx={10} fill={SHADE} opacity={side === 'r' ? 1 : 0.5} />}
      <circle cx={px} cy={210} r={9.5} fill={skin} />
      {shade && side === 'r' && <circle cx={px} cy={210} r={9.5} fill={SHADE} opacity={0.35} />}
    </g>
  );
};

/**
 * Fase 3: o braço que CRUZA o tronco (o copo na frente do peito, a mão na boca) é da mesma cor da
 * roupa — sem nada, ele some. Vai claro (pega a luz de cima) e deixa a sombra dele no tronco, logo
 * abaixo: a regra "sombra num lado só", sem contorno.
 */
const crosses = (side: 'l' | 'r', a: number) => (side === 'r' ? a > 30 && a < 150 : a < -30 && a > -150);
const armCast = (side: 'l' | 'r', a: number, uid: string) => {
  const px = side === 'l' ? 58 : 142;
  return (
    <g clipPath={`url(#${uid}t)`} key={`${side}c`}>
      <g transform={`translate(0 6) rotate(${a} ${px} 158)`}>
        <rect x={px - 11} y={152} width={22} height={64} rx={11} fill="rgba(10,14,38,0.4)" />
      </g>
    </g>
  );
};

const armAngles = (arms: PessoaProps['arms'], t: number, seed: number): [number, number] => {
  const wave = arms === 'up' ? Math.sin((t + seed * 7) / 5) * 10 : 0;
  return arms === 'down' ? [12, -12] : arms === 'up' ? [150 + wave, -150 - wave] : arms === 'out' ? [14, -78] : [0, 0];
};

const Sweat: React.FC<{ t: number; seed: number; x?: number }> = ({ t, seed, x = 156 }) => (
  <path d={`M${x} ${60 + ((t + seed * 9) % 30)} q8 12 0 18 q-8 -6 0 -18z`} fill={dimColor('bonds')} opacity={1 - ((t + seed * 9) % 30) / 30} />
);

// ------------------------------------------------------------- limpo e cor

const makeGente = (style: 'limpo' | 'cor'): React.FC<PessoaProps> => {
  const Comp: React.FC<PessoaProps> = ({ t = 0, size = 260, accent = C.violet, skin: skinIn = '#F2C9A0', mood = 'ok', seed = 0, arms = 'none', still = false, cap, sweat = false, since, halo = true, pose }) => {
    const uid = 'hv' + useId().replace(/[^a-zA-Z0-9]/g, '');
    const n = CAST.length;
    const who = CAST[((seed % n) + n) % n];
    const lap = Math.floor(seed / n);
    const skin = style === 'cor' ? TINTS[((seed % 6) + 6) % 6] : skinIn;
    const hairColor = style === 'cor' ? mix(mix(dimColor(TINT_DIMS[((seed % 6) + 6) % 6]), C.deep, 0.5), '#000000', 0.1) : lap > 0 ? ALT[(seed + lap) % ALT.length] : who.color;
    const hair = HAIRS[who.hair];
    const onGold = nearGold(accent);
    const sinceM = since ?? t;
    const life = lifeOf(t, seed, mood, sinceM, still);
    // fase 3: a pose (src/elenco/acao.tsx) manda nos braços; sem pose, tudo como antes
    const [la, ra] = pose?.braco ?? armAngles(arms, t, seed);
    const showArms = arms !== 'none' || !!pose?.braco;
    // braço na FRENTE da cabeça (a mão na boca ao beber): desenhado depois do grupo da cabeça
    const [frL, frR] = pose?.frente ?? [false, false];
    // braço que cruza o tronco (só com pose): vai pra frente do tronco, claro, com a sombra dele embaixo
    const crL = !!pose?.braco && crosses('l', la);
    const crR = !!pose?.braco && crosses('r', ra);
    const blink = Math.max(still ? 0 : blinkAt(t, seed), pose?.fecha ?? 0);
    const HX = `rotate(${TILT[mood] + (pose?.cabeca ?? 0)} 100 142) ${HEAD_V4}`;
    const hideTop = Boolean(cap);
    const backVisible = hair.back && !(hideTop && (who.hair === 'afro' || who.hair === 'bun'));
    const facet = style === 'cor' ? 0.3 : 0.42;
    // as duas pernas, cada uma girando no quadril e subindo (o joelho vem pra câmera; a barra cobre o topo)
    const legL = (
      <>
        <rect x={72} y={210} width={25} height={34} rx={9} fill={C.faint} />
        <rect x={66} y={238} width={33} height={14} rx={6.5} fill={C.surface3} />
      </>
    );
    const legR = (
      <>
        <rect x={103} y={210} width={25} height={34} rx={9} fill={C.faint} />
        <rect x={103} y={210} width={25} height={34} rx={9} fill={SHADE} />
        <rect x={101} y={238} width={33} height={14} rx={6.5} fill={C.surface3} />
        <rect x={101} y={238} width={33} height={14} rx={6.5} fill={SHADE} />
      </>
    );
    // o joelho que sobe vem pra câmera: a perna cresce um tico (perspectiva) em volta do quadril
    const legPose = (i: 0 | 1, el: React.ReactNode) => {
      const e = pose?.ergue?.[i] ?? 0;
      const r = pose?.perna?.[i] ?? 0;
      const qx = i ? 115.5 : 84.5;
      const s = 1 + 0.012 * e;
      // a perna que abre gira a sola: o canto de dentro desceria do chão — sobe o que ele desceria
      const up = e + 15 * Math.sin((Math.abs(r) * Math.PI) / 180);
      return <g transform={`translate(0 ${(-up).toFixed(2)}) rotate(${r} ${qx} 212) translate(${qx} 212) scale(${s.toFixed(4)}) translate(${-qx} -212)`}>{el}</g>;
    };
    const body = (
        <g transform={life.body}>
          <g transform={`translate(0 ${life.lift})`}>
            {showArms && !frL && !crL && armOf('l', la, accent, skin, true)}
            {backVisible && (
              <g transform={HX}>
                <Shaded id={`${uid}b`} d={hair.back!} fill={hairColor} hole={hair.hole} />
                {hair.texture && <path d={hair.texture} stroke={SHADE} strokeWidth={2} strokeLinecap="round" fill="none" />}
                {hair.cuffs?.slice(0, 2).map(([x, y]) => <rect key={x} x={x - 3.5} y={y} width={7} height={5} rx={1.5} fill={C.gold} />)}
              </g>
            )}
            <rect x={89} y={124} width={22} height={34} rx={7} fill={skin} />
            <rect x={89} y={124} width={22} height={34} rx={7} fill={SHADE} opacity={0.55} />
            <clipPath id={`${uid}t`}>
              <path d={TORSO} />
            </clipPath>
            <path d={TORSO} fill={accent} />
            <GarmentDetail g={who.garment} accent={accent} skin={skin} uid={uid} />
            <path d={TORSO_PLANE} fill={SHADE} clipPath={`url(#${uid}t)`} />
            <GoldHex x={PIN[0]} y={PIN[1]} r={9} onGold={onGold} />
            {showArms && crL && armCast('l', la, uid)}
            {showArms && crR && armCast('r', ra, uid)}
            {showArms && crL && !frL && armOf('l', la, accent, skin, false)}
            {showArms && !frR && armOf('r', ra, accent, skin, !crR)}

            <g transform={HX}>
              {hair.drape && (
                <g>
                  <Shaded id={`${uid}m`} d={hair.drape} fill={hairColor} hole={[62, 120, 9, 60]} o={0.6} />
                  <path d={hair.drapeTexture} stroke={SHADE} strokeWidth={1.8} strokeLinecap="round" fill="none" />
                </g>
              )}
              {hair.drape && hair.cuffs?.[2] && <rect x={hair.cuffs[2][0] - 4.5} y={hair.cuffs[2][1]} width={9} height={5.5} rx={1.6} fill={C.gold} />}
              <clipPath id={`${uid}h`}>
                <path d={HEAD} />
              </clipPath>
              <path d={HEAD} fill={skin} />
              <path d={FACE_PLANE} fill={SHADE} opacity={facet} clipPath={`url(#${uid}h)`} />
              <path d={FACE_SHINE} stroke={SHINE} strokeWidth={3.4} strokeLinecap="round" fill="none" />
              <Face mood={mood} blink={blink} glasses={who.glasses} skin={skin} />
              {hair.beard && <Shaded id={`${uid}d`} d={hair.beard} fill={hairColor} hole={[92, 96, 54, 52]} />}
              {hair.stache && <path d={hair.stache} fill={hairColor} />}
              {mood === 'feliz' && hair.beard && <path d="M87 113 Q100 116.5 113 113 Q111 126 100 126 Q89 126 87 113Z" fill={INK} />}
              {!hideTop && hair.front && (
                <g clipPath={`url(#${uid}h)`} opacity={0.8}>
                  <path d={hair.front} fill={SHADE} transform="translate(1.5 3.5)" />
                </g>
              )}
              {!hideTop && hair.front && <Shaded id={`${uid}f`} d={hair.front} fill={hairColor} hole={hair.hole} />}
              {!hideTop && hair.front && !hair.back && hair.texture && <path d={hair.texture} stroke={mix(hairColor, C.deep, 0.3)} strokeWidth={2} strokeLinecap="round" fill="none" />}
              {!hideTop && hair.part && <path d={hair.part} stroke={mix(skin, C.deep, 0.15)} strokeWidth={2.2} strokeLinecap="round" />}
              {!hideTop && hair.strands && <path d={hair.strands} stroke={hairColor} strokeWidth={2.6} strokeLinecap="round" fill="none" />}
              {!hideTop && <path d={hair.shine} stroke={SHINE} strokeWidth={4} strokeLinecap="round" fill="none" />}
              {who.glasses && (
                <g stroke={INK} strokeWidth={2.4} fill="rgba(255,255,255,0.10)" strokeLinejoin="round">
                  <path d={softPoly(hexPts(85, 94, 11.5, 1, true), 2.5)} />
                  <path d={softPoly(hexPts(115, 94, 11.5, 1, true), 2.5)} />
                  <path d="M96.5 92.5 Q100 89.5 103.5 92.5 M73.5 93 L53 91 M126.5 93 L147 91" fill="none" />
                </g>
              )}
              {who.earring && (
                <g>
                  <path d="M52.5 97 V106 M147.5 97 V106" stroke={C.goldDeep} strokeWidth={1.8} strokeLinecap="round" />
                  <GoldHex x={52.5} y={111.5} r={5.5} />
                  <GoldHex x={147.5} y={111.5} r={5.5} />
                </g>
              )}
              {cap && (
                <g>
                  <Shaded id={`${uid}c`} d="M46 84 C44 50 66 26 100 25 C134 26 156 50 154 84 Q100 72 46 84Z" fill={cap} hole={[84, 64, 50, 40]} />
                  <rect x={118} y={75} width={60} height={11} rx={5.5} fill={cap} />
                  <rect x={118} y={75} width={60} height={11} rx={5.5} fill={SHADE} opacity={0.5} />
                  <GoldHex x={100} y={54} r={6.5} onGold={nearGold(cap)} />
                </g>
              )}
              {sweat && <Sweat t={t} seed={seed} />}
            </g>
            {showArms && frL && armOf('l', la, accent, skin, !crL)}
            {showArms && frR && armOf('r', ra, accent, skin, !crR)}
          </g>
        </g>
    );
    return (
      <svg width={size} height={size * 1.3} viewBox="0 0 200 260" style={{ overflow: 'visible' }}>
        {RADAR && mood === 'feliz' && halo && <Halo since={sinceM} t={t} seed={seed} small={size < 170} {...(halo === 'cabeca' ? { cy: 82, R: 98 } : { cy: 128, R: 150 })} />}
        <ellipse cx={100} cy={252} rx={pose ? 56 * shadowK(pose) : 56} ry={7} fill="rgba(0,0,0,0.25)" />
        {pose ? (
          // fase 3: tudo menos a sombra gira/sobe/amassa em volta dos pés
          <>
            <g transform={poseT(pose, true)}>
              {legPose(0, legL)}
              {legPose(1, legR)}
            </g>
            <g transform={poseT(pose, false)}>{body}</g>
          </>
        ) : (
          <>
            <rect x={72} y={210} width={25} height={34} rx={9} fill={C.faint} />
            <rect x={103} y={210} width={25} height={34} rx={9} fill={C.faint} />
            <rect x={103} y={210} width={25} height={34} rx={9} fill={SHADE} />
            <rect x={66} y={238} width={33} height={14} rx={6.5} fill={C.surface3} />
            <rect x={101} y={238} width={33} height={14} rx={6.5} fill={C.surface3} />
            <rect x={101} y={238} width={33} height={14} rx={6.5} fill={SHADE} />

            {body}
          </>
        )}
      </svg>
    );
  };
  return Comp;
};

// ------------------------------------------------------------------ mascote
// Cabeça hexa grande (×1,16, cantos mais redondos), corpo curto sem pescoço,
// roupa lisa com o broche, cabelo em silhueta chapada (sem fio, risca nem brilho).

const M_HEAD = softPoly(FACE, [11, 11, 9, 8, 8, 9]);
const M_HX = (mood: NonNullable<PessoaProps['mood']>) => `rotate(${TILT[mood] * 1.2} 100 150) translate(100 96) scale(1.16) translate(-100 -96)`;
const M_TORSO = softPoly(
  [
    [72, 146],
    [128, 146],
    [150, 168],
    [142, 226],
    [58, 226],
    [50, 168],
  ],
  [12, 12, 18, 12, 12, 18],
);
const M_PIN: Pt = [119, 186];

const Mascote: React.FC<PessoaProps> = ({ t = 0, size = 260, accent = C.violet, skin = '#F2C9A0', mood = 'ok', seed = 0, arms = 'none', still = false, cap, sweat = false, since, halo = true, pose }) => {
  const uid = 'hm' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const n = CAST.length;
  const who = CAST[((seed % n) + n) % n];
  const lap = Math.floor(seed / n);
  const hairColor = lap > 0 ? ALT[(seed + lap) % ALT.length] : who.color;
  const hair = HAIRS[who.hair];
  const sinceM = since ?? t;
  const life = lifeOf(t, seed, mood, sinceM, still, 1.4);
  // o Mascote só lê os braços da pose (fase 3)
  const [la, ra] = pose?.braco ?? armAngles(arms, t, seed);
  const showArms = arms !== 'none' || !!pose?.braco;
  const blink = still ? 0 : blinkAt(t, seed);
  const HX = M_HX(mood);
  const hideTop = Boolean(cap);
  const backVisible = hair.back && !(hideTop && (who.hair === 'afro' || who.hair === 'bun'));
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 200 260" style={{ overflow: 'visible' }}>
      {RADAR && mood === 'feliz' && halo && <Halo since={sinceM} t={t} seed={seed} small={size < 170} {...(halo === 'cabeca' ? { cy: 86, R: 108 } : { cy: 124, R: 160 })} />}
      <ellipse cx={100} cy={252} rx={50} ry={7} fill="rgba(0,0,0,0.25)" />
      <rect x={76} y={216} width={20} height={28} rx={9} fill={C.faint} />
      <rect x={104} y={216} width={20} height={28} rx={9} fill={C.faint} />
      <rect x={70} y={238} width={30} height={14} rx={7} fill={C.surface3} />
      <rect x={100} y={238} width={30} height={14} rx={7} fill={C.surface3} />
      <g transform={life.body}>
        <g transform={`translate(0 ${life.lift})`}>
          {showArms && armOf('l', la, accent, skin, false)}
          {backVisible && (
            <g transform={HX}>
              <path d={hair.back!} fill={hairColor} />
              {hair.cuffs?.slice(0, 2).map(([x, y]) => <rect key={x} x={x - 3.5} y={y} width={7} height={5} rx={1.5} fill={C.gold} />)}
            </g>
          )}
          <path d={M_TORSO} fill={accent} />
          <path d={M_TORSO} fill="rgba(255,255,255,0.08)" transform="translate(100 186) scale(0.82 0.7) translate(-100 -186)" />
          <GoldHex x={M_PIN[0]} y={M_PIN[1]} r={9.5} onGold={nearGold(accent)} />
          {showArms && armOf('r', ra, accent, skin, false)}
          <g transform={HX}>
            <path d={M_HEAD} fill={skin} />
            <path d={FACE_SHINE} stroke={SHINE} strokeWidth={3.4} strokeLinecap="round" fill="none" />
            <Face mood={mood} blink={blink} glasses={who.glasses} big skin={skin} />
            {hair.beard && <path d={hair.beard} fill={hairColor} />}
            {hair.stache && <path d={hair.stache} fill={hairColor} />}
            {mood === 'feliz' && hair.beard && <path d="M87 116 Q100 119.5 113 116 Q111 129 100 129 Q89 129 87 116Z" fill={INK} />}
            {!hideTop && hair.front && <path d={hair.front} fill={hairColor} />}
            {who.glasses && (
              <g stroke={INK} strokeWidth={2.6} fill="none" strokeLinejoin="round">
                <path d={softPoly(hexPts(85, 97, 12, 1, true), 3)} />
                <path d={softPoly(hexPts(115, 97, 12, 1, true), 3)} />
                <path d="M97 95.5 Q100 93 103 95.5" />
              </g>
            )}
            {who.earring && (
              <g>
                <GoldHex x={52.5} y={108} r={5} />
                <GoldHex x={147.5} y={108} r={5} />
              </g>
            )}
            {cap && (
              <g>
                <path d="M46 84 C44 50 66 26 100 25 C134 26 156 50 154 84 Q100 72 46 84Z" fill={cap} />
                <rect x={118} y={75} width={60} height={11} rx={5.5} fill={cap} />
                <GoldHex x={100} y={54} r={6.5} onGold={nearGold(cap)} />
              </g>
            )}
            {sweat && <Sweat t={t} seed={seed} x={158} />}
          </g>
        </g>
      </g>
    </svg>
  );
};

// ------------------------------------------------------------------- costas
// Plateia (fila da frente): a mesma pessoa vista de trás — nuca = a cabeça hexa
// inteira na cor do cabelo, gola por trás, nada do peito.

const makeCostas = (style: Style): React.FC<PessoaProps> => {
  const Comp: React.FC<PessoaProps> = ({ size = 260, accent = C.violet, skin: skinIn = '#F2C9A0', seed = 0 }) => {
    const n = CAST.length;
    const who = CAST[((seed % n) + n) % n];
    const lap = Math.floor(seed / n);
    const skin = style === 'cor' ? TINTS[((seed % 6) + 6) % 6] : skinIn;
    const hairColor = style === 'cor' ? mix(dimColor(TINT_DIMS[((seed % 6) + 6) % 6]), C.deep, 0.5) : lap > 0 ? ALT[(seed + lap) % ALT.length] : who.color;
    const hair = HAIRS[who.hair];
    const mas = style === 'mascote';
    const HX = mas ? M_HX('ok') : HEAD_V4;
    return (
      <svg width={size} height={size * 1.3} viewBox="0 0 200 260" style={{ overflow: 'visible' }}>
        <path d={mas ? M_TORSO : TORSO} fill={accent} />
        {!mas && <rect x={89} y={124} width={22} height={30} rx={7} fill={skin} />}
        <g transform={HX}>
          {hair.back && <path d={hair.back} fill={hairColor} />}
          <path d={mas ? M_HEAD : HEAD} fill={who.hair === 'silver' ? mix(skin, hairColor, 0.65) : hairColor} />
          {hair.front && <path d={hair.front} fill={hairColor} />}
        </g>
      </svg>
    );
  };
  return Comp;
};

/** Palco opcional (folha): o radar de 6 áreas bem apagado — mesmo da opção hex. */
const Backdrop: React.FC<{ t: number; width: number; height: number; accent: string }> = ({ t, width, height, accent }) => {
  const cx = width / 2;
  const cy = height * 0.52;
  const R = height * 0.47;
  const s = 1 + 0.012 * Math.sin(t / 30);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      {[1, 0.7, 0.4].map((k, i) => (
        <path key={k} d={softPoly(hexPts(cx, cy, R * k * s), R * k * 0.06)} fill="none" stroke={accent} strokeWidth={3} opacity={0.1 - i * 0.025} />
      ))}
    </svg>
  );
};

export const hexaLimpo: IdentityOption = {
  id: 'hexa-limpo',
  name: 'Hexa Limpo',
  pitch: 'O Rosto Hexa sem nariz nem blush: olho e expressão em traço preto, cabelo e roupa de gente, e o hexágono do app acendendo atrás de quem fica feliz.',
  Pessoa: makeGente('limpo'),
  Costas: makeCostas('limpo'),
  Backdrop,
  halo: RADAR,
  frenteElenco: true,
};

export const hexaMascote: IdentityOption = {
  id: 'hexa-mascote',
  name: 'Hexa Mascote',
  pitch: 'Cabeça hexa grande e de cantos redondos, corpo curto, cabelo em silhueta chapada: um personagem de marca que se reconhece pela silhueta, com olho preto e o hexágono que acende no feliz.',
  Pessoa: Mascote,
  Costas: makeCostas('mascote'),
  Backdrop,
  halo: RADAR,
  frenteElenco: true,
};

export const hexaCor: IdentityOption = {
  id: 'hexa-cor',
  name: 'Hexa Cor',
  pitch: 'O Rosto Hexa com o rosto na cor clara de uma das 6 áreas do app (a protagonista é a lavanda da Mente), cabelo no tom fundo da mesma cor, olho e traço pretos.',
  Pessoa: makeGente('cor'),
  Costas: makeCostas('cor'),
  Backdrop,
  halo: RADAR,
  frenteElenco: true,
};
