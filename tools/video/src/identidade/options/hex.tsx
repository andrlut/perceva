// Opção "hex" — Rosto Hexa (v2).
//
// O ROSTO é o hexágono, deitado: testa reta, maçãs do rosto pontudas na
// altura dos olhos, queixo reto — com cantos quase vivos (corte ≤ 7, ~12% do
// lado), pra ler hexágono e não "cabeça quadradinha" até a 90 px.
// Todo o resto é orgânico de propósito, pra o hexágono ser o único traço
// geométrico: cabelos que estouram o contorno (volume, risca, fios soltos,
// cachos, tranças), com vão entre o cabelo comprido e a bochecha (não vira
// capuz), e roupas variadas (tricô, sobrecamisa, gola alta, cardigã, zíper,
// polo). A luz corta um PLANO: o lado direito do rosto e do tronco escurece
// em linha reta, como faceta de pedra.
// Marca constante, no mesmo ponto do peito em todo mundo: o broche hexagonal
// dourado (r 9). Em roupa dourada/laranja ele vira navy com aro de ouro.
//
// Estilo do molde: chapado, sem contorno, sombra num lado só (luz de cima-
// esquerda) + um brilho pequeno; cores só do theme.ts e das peles.
import React, { useId } from 'react';
import { C, DIMS, dimColor } from '../../theme';
import type { IdentityOption, PessoaProps } from '../types';

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
// focado (fase 3) = ok nesta opção (só o Hexa v4 desenha o rosto focado)
const TILT = { ok: 0, feliz: -4, cansado: 6, focado: 0 } as const;

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

const Pessoa: React.FC<PessoaProps> = ({
  t = 0,
  size = 260,
  accent = C.violet,
  skin = '#F2C9A0',
  mood = 'ok',
  seed = 0,
  arms = 'none',
  still = false,
  cap,
  sweat = false,
}) => {
  const uid = 'hx' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const n = CAST.length;
  const who = CAST[((seed % n) + n) % n];
  const lap = Math.floor(seed / n);
  const hairColor = lap > 0 ? ALT[(seed + lap) % ALT.length] : who.color;
  const hair = HAIRS[who.hair];
  const brow = who.hair === 'silver' && lap === 0 ? mix(C.mid, C.deep, 0.25) : mix(hairColor, C.deep, 0.3);
  const blush = mix(skin, '#E2566A', 0.4);
  const onGold = nearGold(accent);

  const bob = still ? 0 : Math.sin((t + seed * 11) / 14) * 2.6;
  const wave = arms === 'up' ? Math.sin((t + seed * 7) / 5) * 10 : 0;
  const [la, ra] = arms === 'down' ? [12, -12] : arms === 'up' ? [150 + wave, -150 - wave] : arms === 'out' ? [14, -78] : [0, 0];

  const arm = (side: 'l' | 'r', a: number) => {
    const px = side === 'l' ? 58 : 142;
    return (
      <g transform={`rotate(${a} ${px} 158)`}>
        <rect x={px - 10} y={152} width={20} height={62} rx={10} fill={accent} />
        <rect x={px - 10} y={152} width={20} height={62} rx={10} fill={SHADE} opacity={side === 'r' ? 1 : 0.5} />
        <circle cx={px} cy={210} r={9.5} fill={skin} />
        {side === 'r' && <circle cx={px} cy={210} r={9.5} fill={SHADE} opacity={0.35} />}
      </g>
    );
  };

  // ---- rosto
  const k = (t + seed * 37) % 96;
  const blink = k < 4;
  const EY = 94;
  const eye = (x: number) => {
    if (mood === 'cansado') {
      // pálpebra pesada: meio olho + um traço grosso por cima (com óculos, o traço
      // é a pálpebra inteira — nada de forma extra empilhando com a lente)
      return (
        <g key={x}>
          <ellipse cx={x} cy={EY + 1.8} rx={5.2} ry={blink ? 1.2 : 3.2} fill={C.deep} />
          <path
            d={`M${x - 6.5} ${EY - 0.2} Q${x} ${EY - 1.6} ${x + 6.5} ${EY - 0.2}`}
            stroke={C.deep}
            strokeWidth={who.glasses ? 3.6 : 2.8}
            strokeLinecap="round"
            fill="none"
          />
          {!who.glasses && (
            <path d={`M${x - 5} ${EY + 8.5} Q${x} ${EY + 11} ${x + 5} ${EY + 8.5}`} stroke={SHADE} strokeWidth={2.4} strokeLinecap="round" fill="none" />
          )}
        </g>
      );
    }
    return (
      <g key={x}>
        <ellipse cx={x} cy={EY} rx={5.2} ry={blink ? 1.2 : 6.4} fill={C.deep} />
        {mood === 'feliz' && <ellipse cx={x} cy={EY + 8.2} rx={8.5} ry={5.2} fill={skin} />}
      </g>
    );
  };
  const brows =
    mood === 'feliz'
      ? ['M76 79 Q84 74 92 77', 'M108 77 Q116 74 124 79']
      : mood === 'cansado'
        ? ['M76 83 Q84 81 92 77.5', 'M108 77.5 Q116 81 124 83']
        : ['M76 82 Q84 78 92 80', 'M108 80 Q116 78 124 82'];

  const HX = `rotate(${TILT[mood]} 100 142) ${HEAD_SCALE}`;
  const hideTop = Boolean(cap); // com boné: some a parte de cima do cabelo
  const backVisible = hair.back && !(hideTop && (who.hair === 'afro' || who.hair === 'bun'));

  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 200 260">
      <ellipse cx={100} cy={252} rx={56} ry={7} fill="rgba(0,0,0,0.25)" />
      {/* pernas e sapatos — ficam no chão enquanto o tronco respira */}
      <rect x={72} y={210} width={25} height={34} rx={9} fill={C.faint} />
      <rect x={103} y={210} width={25} height={34} rx={9} fill={C.faint} />
      <rect x={103} y={210} width={25} height={34} rx={9} fill={SHADE} />
      <g>
        <rect x={66} y={238} width={33} height={14} rx={6.5} fill={C.surface3} />
        <rect x={101} y={238} width={33} height={14} rx={6.5} fill={C.surface3} />
        <rect x={101} y={238} width={33} height={14} rx={6.5} fill={SHADE} />
        <rect x={67} y={248.5} width={31} height={3.2} rx={1.6} fill={C.dim} />
        <rect x={102} y={248.5} width={31} height={3.2} rx={1.6} fill={C.dim} opacity={0.7} />
      </g>

      <g transform={`translate(0 ${bob})`}>
        {arms !== 'none' && arm('l', la)}
        {backVisible && (
          <g transform={HX}>
            <Shaded id={`${uid}b`} d={hair.back!} fill={hairColor} hole={hair.hole} />
            {hair.texture && <path d={hair.texture} stroke={SHADE} strokeWidth={2} strokeLinecap="round" fill="none" />}
            {hair.cuffs?.slice(0, 2).map(([x, y]) => (
              <rect key={x} x={x - 3.5} y={y} width={7} height={5} rx={1.5} fill={C.gold} />
            ))}
          </g>
        )}
        {/* pescoço */}
        <rect x={89} y={124} width={22} height={34} rx={7} fill={skin} />
        <rect x={89} y={124} width={22} height={34} rx={7} fill={SHADE} opacity={0.55} />
        {/* tronco: peça única + gola, e a faceta de sombra por cima de tudo */}
        <clipPath id={`${uid}t`}>
          <path d={TORSO} />
        </clipPath>
        <path d={TORSO} fill={accent} />
        <GarmentDetail g={who.garment} accent={accent} skin={skin} uid={uid} />
        <path d={TORSO_PLANE} fill={SHADE} clipPath={`url(#${uid}t)`} />
        <GoldHex x={PIN[0]} y={PIN[1]} r={9} onGold={onGold} />
        {arms !== 'none' && arm('r', ra)}

        <g transform={HX}>
          {hair.drape && (
            <g>
              <Shaded id={`${uid}m`} d={hair.drape} fill={hairColor} hole={[62, 120, 9, 60]} o={0.6} />
              <path d={hair.drapeTexture} stroke={SHADE} strokeWidth={1.8} strokeLinecap="round" fill="none" />
            </g>
          )}
          {hair.drape && hair.cuffs?.[2] && (
            <rect x={hair.cuffs[2][0] - 4.5} y={hair.cuffs[2][1]} width={9} height={5.5} rx={1.6} fill={C.gold} />
          )}
          {/* rosto: hexágono deitado + faceta de sombra reta */}
          <clipPath id={`${uid}h`}>
            <path d={HEAD} />
          </clipPath>
          <path d={HEAD} fill={skin} />
          <path d={FACE_PLANE} fill={SHADE} opacity={0.62} clipPath={`url(#${uid}h)`} />
          <path d={FACE_SHINE} stroke={SHINE} strokeWidth={3.4} strokeLinecap="round" fill="none" />

          {mood === 'feliz' && (
            <g fill={blush} opacity={0.75}>
              <ellipse cx={72} cy={110} rx={7} ry={4.2} />
              <ellipse cx={128} cy={110} rx={7} ry={4.2} />
            </g>
          )}
          {eye(85)}
          {eye(115)}
          <g stroke={brow} strokeWidth={4.2} strokeLinecap="round" fill="none">
            <path d={brows[0]} />
            <path d={brows[1]} />
          </g>
          <path d="M101 99 Q105.5 106 100 108.5" stroke={SHADE} strokeWidth={3.4} strokeLinecap="round" fill="none" />
          {hair.beard && <Shaded id={`${uid}d`} d={hair.beard} fill={hairColor} hole={[92, 96, 54, 52]} />}
          {hair.stache && <path d={hair.stache} fill={hairColor} />}
          {mood === 'feliz' ? (
            // sorriso aberto, sem barra de dentes
            <path d="M87 113 Q100 116.5 113 113 Q111 126 100 126 Q89 126 87 113Z" fill={C.deep} />
          ) : (
            <path
              d={mood === 'cansado' ? 'M93 121 Q100 117 107 121' : 'M93 118 Q100 121.5 107 118'}
              stroke={C.deep}
              strokeWidth={4}
              strokeLinecap="round"
              fill="none"
            />
          )}

          {/* sombra que o cabelo joga na testa (separa cabelo e pele do mesmo tom) */}
          {!hideTop && hair.front && (
            <g clipPath={`url(#${uid}h)`} opacity={0.8}>
              <path d={hair.front} fill={SHADE} transform="translate(1.5 3.5)" />
            </g>
          )}
          {!hideTop && hair.front && <Shaded id={`${uid}f`} d={hair.front} fill={hairColor} hole={hair.hole} />}
          {!hideTop && hair.front && !hair.back && hair.texture && (
            <path d={hair.texture} stroke={mix(hairColor, C.deep, 0.3)} strokeWidth={2} strokeLinecap="round" fill="none" />
          )}
          {!hideTop && hair.part && <path d={hair.part} stroke={mix(skin, C.deep, 0.15)} strokeWidth={2.2} strokeLinecap="round" />}
          {!hideTop && hair.strands && <path d={hair.strands} stroke={hairColor} strokeWidth={2.6} strokeLinecap="round" fill="none" />}
          {!hideTop && <path d={hair.shine} stroke={SHINE} strokeWidth={4} strokeLinecap="round" fill="none" />}

          {who.glasses && (
            <g stroke={C.goldDeep} strokeWidth={2.6} fill="rgba(255,255,255,0.10)" strokeLinejoin="round">
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
              <Shaded
                id={`${uid}c`}
                d="M46 84 C44 50 66 26 100 25 C134 26 156 50 154 84 Q100 72 46 84Z"
                fill={cap}
                hole={[84, 64, 50, 40]}
              />
              <rect x={118} y={75} width={60} height={11} rx={5.5} fill={cap} />
              <rect x={118} y={75} width={60} height={11} rx={5.5} fill={SHADE} opacity={0.5} />
              <GoldHex x={100} y={54} r={6.5} onGold={nearGold(cap)} />
            </g>
          )}
          {sweat && (
            <path
              d={`M156 ${60 + ((t + seed * 9) % 30)} q8 12 0 18 q-8 -6 0 -18z`}
              fill={dimColor('bonds')}
              opacity={1 - ((t + seed * 9) % 30) / 30}
            />
          )}
        </g>
      </g>
    </svg>
  );
};

/**
 * Palco opcional: o radar de 6 áreas bem apagado. A Pessoa nunca desenha isso —
 * é a cena que escolhe pôr; serve pra cartela vazia (título, fechamento), não
 * pra ambiente (escritório, rua), onde o broche sozinho já assina.
 */
const Backdrop: React.FC<{ t: number; width: number; height: number; accent: string }> = ({ t, width, height, accent }) => {
  const cx = width / 2;
  const cy = height * 0.52;
  const R = height * 0.47;
  const s = 1 + 0.012 * Math.sin(t / 30);
  const outer = hexPts(cx, cy, R * s);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      {[1, 0.7, 0.4].map((k, i) => (
        <path
          key={k}
          d={softPoly(hexPts(cx, cy, R * k * s), R * k * 0.06)}
          fill="none"
          stroke={accent}
          strokeWidth={3}
          opacity={0.13 - i * 0.03}
        />
      ))}
      {outer.map((p, j) => (
        <circle key={j} cx={p[0]} cy={p[1]} r={6} fill={DIMS[j].color} opacity={0.45} />
      ))}
    </svg>
  );
};

export const option: IdentityOption = {
  id: 'hex',
  name: 'Rosto Hexa',
  pitch: 'O rosto de todo mundo é o hexágono das 6 áreas do app — testa reta, maçãs pontudas, queixo reto — com cabelo e roupa livres em volta e o broche hexagonal dourado sempre no mesmo ponto do peito.',
  Pessoa,
  Backdrop,
};
