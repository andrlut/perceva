// Elenco Perceva — cenário (o que fica ATRÁS da protagonista nos ambientes).
//
// Regras do cenário (além das do cast.tsx):
//  - tudo mais escuro e menos saturado que a protagonista e as peças: o
//    cenário é a sala, nunca o assunto. Cores = família navy do app (SET).
//  - formas grandes: no celular, detalhe fino vira ruído.
//  - figurante = a MESMA Pessoa do cast.tsx, menor, com accent apagado e
//    filtro de dessaturação (a identidade nova se propaga sozinha).
//  - partes que vão dentro do SVG grande do fundo são <g> (coordenadas do
//    cenário); as que precisam de filtro ou de pessoa são <div> posicionadas.
import React from 'react';
import { useIdentity } from '../identidade/context';
import { C, dimColor } from '../theme';
import { Arms, Pessoa } from './cast';
import { filtroFigurante, useVisual } from '../molde/visual';

/**
 * Vistas opcionais da identidade ativa (contrato em src/identidade/types.ts),
 * com a mesma caixa e as mesmas props do `Pessoa`: `Costas` (a pessoa de trás:
 * cabelo dela, gola por trás, nada do peito) e `Virada` (espelhada sem
 * espelhar a marca). Sem elas, o cenário cai no desenho genérico de antes.
 */

export const SET = {
  wallTop: '#151B4C',
  wall: '#1C2359',
  wallLow: '#262E6C',
  wallWarm: '#221F57',
  wallWarmLow: '#30296A',
  floor: '#222A66',
  floorLow: '#131843',
  base: '#2C3473',
  furn: '#2A3270',
  furnTop: '#363F84',
  furnDark: '#1E2559',
  frame: '#30387A',
  frameShade: '#252C66',
  build1: '#1A2158',
  build2: '#222A66',
  build3: '#2B3476',
  lit: C.gold2,
  leaf: '#2A9C8A',
  leafDark: '#1F7569',
  asphalt: '#141838',
  curb: '#353E80',
  walk: '#20275E',
} as const;

/** Filtro dos figurantes: mesma pessoa, apagada (o foco é sempre a protagonista). */
export const DIM = 'saturate(0.4) brightness(0.8)';
export const FIG_ACCENT = C.surface3;
export const SKINS = ['#F2C9A0', '#C68B5E', '#8D5A3B', '#E0AC7E', '#5C3A24', '#F5D5B8'];
const HAIR = ['#5A4A7E', '#6E5444', '#44447F', '#7C5C48', '#4E3F66'];

/** Ruído determinístico 0..1 (piscar de tela, janelas acesas). */
export const noise = (n: number) => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// ------------------------------------------------------------ figurantes

/** Figurante de frente: `x` = centro, `y` = linha dos pés. */
export const Figurante: React.FC<{
  t: number;
  x: number;
  y: number;
  size: number;
  seed: number;
  arms?: Arms;
  mood?: 'ok' | 'feliz' | 'cansado';
  dim?: string;
  /** espelha (pra apontar pro outro lado com arms="out") */
  flip?: boolean;
  accent?: string;
}> = ({ t, x, y, size, seed, arms = 'none', mood = 'ok', dim = DIM, flip = false, accent = FIG_ACCENT }) => {
  // virado: a vista espelhada da identidade (o Topo Iris não sai ao contrário); sem ela, scaleX(-1)
  const { Virada } = useIdentity();
  const visual = useVisual();
  const Mirror = flip ? Virada : undefined;
  const P = Mirror ?? Pessoa;
  return (
    <div style={{ position: 'absolute', left: x - size / 2, top: y - size * 1.26, filter: filtroFigurante(visual, dim), transform: flip && !Mirror ? 'scaleX(-1)' : undefined }}>
      <P t={t} size={size} seed={seed} skin={SKINS[seed % SKINS.length]} accent={accent} arms={arms} mood={mood} halo={false} />
    </div>
  );
};

/** Roupas apagadas da plateia (variadas pra fileira não virar carimbo). */
export const SHIRTS = ['#4A4F8E', '#5B4E88', '#3D5C8A', '#5F577F', '#46628A', '#54507E'];

/**
 * Figurante DE COSTAS (plateia, fila da frente). Com a vista `Costas` da
 * identidade, é a mesma pessoa vista de trás (cabelo do seed, gola por trás,
 * sem rosto nem Topo Iris). Sem ela, a Pessoa é desenhada parada, a cabeça
 * (centro ≈ 100,92 da caixa 200×260, pelo contrato da identidade) é coberta
 * pelo cabelo e o peito por uma camada lisa da camisa — nunca rosto, olho ou
 * marca aparecendo pelas costas.
 */
export const DeCostas: React.FC<{ t: number; x: number; y: number; size: number; seed: number; dim?: string; sway?: number }> = ({
  t,
  x,
  y,
  size,
  seed,
  dim = DIM,
  sway = 1,
}) => {
  const hair = HAIR[seed % HAIR.length];
  const skin = SKINS[(seed * 5 + 1) % SKINS.length];
  const shirt = SHIRTS[seed % SHIRTS.length];
  const rot = Math.sin((t + seed * 23) / 40) * 1.2 * sway;
  const Back = useIdentity().Costas;
  const visual = useVisual();
  return (
    <div
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size * 1.26,
        width: size,
        height: size * 1.3,
        filter: filtroFigurante(visual, dim),
        transform: `rotate(${rot}deg)`,
        transformOrigin: '50% 100%',
      }}
    >
      {Back ? (
        <Back t={0} size={size} seed={seed} skin={skin} accent={shirt} arms="none" still />
      ) : (
        <>
          <Pessoa t={0} size={size} seed={seed} skin={skin} accent={shirt} arms="none" still />
          <svg style={{ position: 'absolute', left: 0, top: 0 }} width={size} height={size * 1.3} viewBox="0 0 200 260">
            {/* costas da camisa por cima do peito (gola, botões e marca são da frente) */}
            <path d="M64 150 Q100 143 136 150 L137 206 Q100 212 63 206Z" fill={shirt} />
            <path d="M122 148 Q130 149 136 150 L137 206 Q131 207.5 124 208.5 C128 188 128 166 122 148Z" fill="rgba(10,14,38,0.28)" />
            <rect x={84} y={126} width={32} height={24} rx={10} fill={skin} />
            <ellipse cx={46} cy={98} rx={11} ry={15} fill={skin} />
            <ellipse cx={154} cy={98} rx={11} ry={15} fill={skin} />
            <circle cx={100} cy={88} r={57} fill={hair} />
            <path d="M46 96 q54 34 108 0 v14 q-54 30 -108 0z" fill={hair} />
            <path d="M100 31 a57 57 0 0 1 0 114 a44 57 0 0 0 0 -114z" fill="rgba(10,14,38,0.28)" />
            <ellipse cx={76} cy={58} rx={18} ry={11} fill="rgba(255,255,255,0.16)" />
          </svg>
        </>
      )}
    </div>
  );
};

// ------------------------------------------------------------ partes do fundo (<g>)

export type Hora = 'manha' | 'dia' | 'noite';

const SKY: Record<Hora, [string, string, string]> = {
  manha: ['#2E2F78', '#74519A', '#E8A15A'],
  dia: ['#2C3D8C', '#3D55AC', '#5A74C4'],
  noite: ['#0D1236', '#171E52', '#232C6A'],
};

/** Gradientes do cenário (um <defs> por SVG; ids com prefixo pra não colidir). */
export const SkyDefs: React.FC<{ id: string; hora: Hora }> = ({ id, hora }) => {
  const [a, b, c] = SKY[hora];
  return (
    <defs>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={a} />
        <stop offset="0.6" stopColor={b} />
        <stop offset="1" stopColor={c} />
      </linearGradient>
      <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={SET.wallTop} />
        <stop offset="1" stopColor={SET.wallLow} />
      </linearGradient>
      <linearGradient id={`${id}-warm`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={SET.wallTop} />
        <stop offset="1" stopColor={SET.wallWarmLow} />
      </linearGradient>
      <linearGradient id={`${id}-floor`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={SET.floor} />
        <stop offset="1" stopColor={SET.floorLow} />
      </linearGradient>
      <radialGradient id={`${id}-sun`}>
        <stop offset="0" stopColor={C.gold2} stopOpacity={0.9} />
        <stop offset="0.35" stopColor={C.gold} stopOpacity={0.45} />
        <stop offset="1" stopColor={C.gold} stopOpacity={0} />
      </radialGradient>
      <radialGradient id={`${id}-lamp`}>
        <stop offset="0" stopColor={C.gold2} stopOpacity={0.55} />
        <stop offset="1" stopColor={C.gold2} stopOpacity={0} />
      </radialGradient>
    </defs>
  );
};

/** Nuvem chapada. */
export const Nuvem: React.FC<{ x: number; y: number; w: number; opacity?: number }> = ({ x, y, w, opacity = 0.16 }) => (
  <g transform={`translate(${x} ${y}) scale(${w / 200})`} opacity={opacity}>
    <ellipse cx={60} cy={44} rx={50} ry={30} fill={C.hi} />
    <ellipse cx={112} cy={30} rx={56} ry={36} fill={C.hi} />
    <ellipse cx={160} cy={48} rx={40} ry={26} fill={C.hi} />
    <rect x={20} y={44} width={170} height={28} rx={14} fill={C.hi} />
  </g>
);

/** Fileira de prédios (silhueta com janelas acesas que piscam devagar). */
export const Predios: React.FC<{ x: number; base: number; w: number; t: number; tone?: 1 | 2 | 3; seed?: number; tall?: number }> = ({
  x,
  base,
  w,
  t,
  tone = 2,
  seed = 1,
  tall = 1,
}) => {
  const fill = tone === 1 ? SET.build1 : tone === 2 ? SET.build2 : SET.build3;
  const out: React.ReactNode[] = [];
  let cx = x;
  let i = 0;
  while (cx < x + w) {
    const bw = 70 + Math.round(noise(seed * 31 + i) * 70);
    const bh = (110 + Math.round(noise(seed * 17 + i * 3) * 190)) * tall;
    out.push(<rect key={`b${i}`} x={cx} y={base - bh} width={bw} height={bh + 4} rx={6} fill={fill} />);
    out.push(<rect key={`s${i}`} x={cx + bw * 0.6} y={base - bh} width={bw * 0.4} height={bh + 4} rx={6} fill="rgba(5,7,26,0.22)" />);
    // janelas: grade esparsa, algumas acesas
    for (let r = 0; r < Math.floor(bh / 46) - 1; r++)
      for (let c = 0; c < Math.floor(bw / 30); c++) {
        const n = noise(seed * 7 + i * 13 + r * 5 + c);
        if (n > 0.62) {
          const on = noise(n * 100 + Math.floor((t + n * 400) / 160)) > 0.25;
          out.push(
            <rect
              key={`w${i}-${r}-${c}`}
              x={cx + 12 + c * 30}
              y={base - bh + 22 + r * 46}
              width={12}
              height={18}
              rx={3}
              fill={SET.lit}
              opacity={on ? 0.32 : 0.06}
            />,
          );
        }
      }
    cx += bw + 6;
    i++;
  }
  return <g>{out}</g>;
};

/** Janela: céu da hora (nuvens, sol ou lua), skyline opcional, caixilho e peitoril. */
export const Janela: React.FC<{
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  t: number;
  hora: Hora;
  skyline?: boolean;
  panes?: number;
}> = ({ id, x, y, w, h, t, hora, skyline = true, panes = 3 }) => {
  const clip = `${id}-clip-${x}`;
  const sunY = y + h * 0.78 - Math.min(h * 0.18, t * 0.25);
  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <rect x={x} y={y} width={w} height={h} rx={10} />
        </clipPath>
      </defs>
      <rect x={x - 18} y={y - 18} width={w + 36} height={h + 36} rx={18} fill={SET.frame} />
      <g clipPath={`url(#${clip})`}>
        <rect x={x} y={y} width={w} height={h} fill={`url(#${id}-sky)`} />
        {hora === 'manha' ? (
          <>
            <circle cx={x + w * 0.62} cy={sunY} r={h * 0.5} fill={`url(#${id}-sun)`} />
            <circle cx={x + w * 0.62} cy={sunY} r={h * 0.1} fill={C.gold2} />
          </>
        ) : hora === 'noite' ? (
          <>
            <circle cx={x + w * 0.74} cy={y + h * 0.24} r={h * 0.07} fill={C.text} opacity={0.9} />
            <circle cx={x + w * 0.74 + h * 0.03} cy={y + h * 0.24 - h * 0.02} r={h * 0.06} fill={SKY.noite[1]} />
            {[0.1, 0.3, 0.46, 0.58, 0.88].map((k, i) => (
              <circle key={i} cx={x + w * k} cy={y + h * (0.12 + 0.1 * noise(i))} r={2.5} fill={C.hi} opacity={0.3 + 0.4 * noise(i + Math.floor(t / 20))} />
            ))}
          </>
        ) : null}
        {[0, 1, 2].map((i) => {
          const span = w + 400;
          const cx = x - 200 + ((i * span) / 3 + t * (0.35 + i * 0.1)) % span;
          return <Nuvem key={i} x={cx} y={y + h * (0.1 + i * 0.12)} w={w * (0.32 - i * 0.04)} opacity={hora === 'noite' ? 0.05 : 0.14} />;
        })}
        {skyline ? (
          <>
            <Predios x={x - 40} base={y + h + 4} w={w + 80} t={t} tone={1} seed={3} tall={0.6} />
            <Predios x={x - 10} base={y + h + 4} w={w + 40} t={t} tone={2} seed={8} tall={0.42} />
          </>
        ) : null}
      </g>
      {/* caixilho */}
      {Array.from({ length: panes - 1 }, (_, i) => (
        <rect key={i} x={x + ((i + 1) * w) / panes - 7} y={y} width={14} height={h} fill={SET.frame} />
      ))}
      <rect x={x} y={y + h * 0.55} width={w} height={12} fill={SET.frame} />
      <rect x={x - 30} y={y + h + 10} width={w + 60} height={22} rx={8} fill={SET.furnTop} />
      <rect x={x - 30} y={y + h + 26} width={w + 60} height={8} rx={4} fill={SET.frameShade} />
      {/* reflexo no vidro */}
      <path d={`M${x + w * 0.08} ${y + h * 0.9} L${x + w * 0.2} ${y + h * 0.08} L${x + w * 0.26} ${y + h * 0.08} L${x + w * 0.14} ${y + h * 0.9}z`} fill="rgba(255,255,255,0.05)" />
    </g>
  );
};

/** Onde fica o vasinho da prateleira do meio da Estante (folhas incluídas), em coordenadas do cenário. */
export const estanteVaso = (x: number, y: number, h: number): [number, number, number, number] => {
  const vx = x + 14 + 3 * 28;
  const vy = y + (h / 3) * 2 - 14;
  return [vx - 12, vy - 72, vx + 46, vy];
};

/** Estante com livros (lombadas nas cores das dimensões, apagadas) e um vaso (`vase={false}`: a cena pôs peça em cima dele). */
export const Estante: React.FC<{ x: number; y: number; w: number; h: number; t: number; vase?: boolean }> = ({ x, y, w, h, t, vase = true }) => {
  const shelves = 3;
  const gap = h / shelves;
  const colors = [dimColor('mind'), dimColor('bonds'), dimColor('health'), C.gold, dimColor('craft'), C.violet2];
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={SET.furn} />
      <rect x={x + w * 0.62} y={y} width={w * 0.38} height={h} rx={10} fill="rgba(5,7,26,0.25)" />
      {Array.from({ length: shelves }, (_, s) => {
        const sy = y + gap * (s + 1);
        let bx = x + 14;
        const books: React.ReactNode[] = [];
        let k = 0;
        while (bx < x + w - 40) {
          const bw = 16 + Math.round(noise(s * 9 + k) * 14);
          const bh = gap * (0.48 + noise(s * 5 + k * 2) * 0.32);
          const lean = noise(s + k * 7) > 0.85 ? 10 : 0;
          books.push(
            <rect
              key={k}
              x={bx}
              y={sy - 12 - bh}
              width={bw}
              height={bh}
              rx={4}
              fill={colors[(s * 3 + k) % colors.length]}
              opacity={0.42}
              transform={lean ? `rotate(${lean} ${bx} ${sy - 12})` : undefined}
            />,
          );
          bx += bw + 4 + (lean ? 10 : 0);
          k++;
          if (s === 1 && k === 3) bx += 46; // espaço pro vaso
        }
        return (
          <g key={s}>
            {books}
            <rect x={x - 6} y={sy - 14} width={w + 12} height={14} rx={6} fill={SET.furnTop} />
          </g>
        );
      })}
      {/* vasinho na prateleira do meio (some se a cena pôs uma peça na frente dele: folha espiando atrás de peça é ruído) */}
      {vase ? (
        <g transform={`translate(${x + 14 + 3 * 28} ${y + gap * 2 - 14})`}>
          <path d="M0 0 h34 l-4 -30 h-26z" fill={SET.frame} />
          {[-24, 0, 24].map((a, i) => (
            <ellipse key={i} cx={17} cy={-46} rx={7} ry={20} fill={SET.leafDark} transform={`rotate(${a + Math.sin(t / 30 + i) * 3} 17 -30)`} />
          ))}
        </g>
      ) : null}
    </g>
  );
};

/** Quadro emoldurado na parede (paisagem abstrata, sem texto). */
export const Quadrinho: React.FC<{ x: number; y: number; w: number; h: number }> = ({ x, y, w, h }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={10} fill={SET.frame} />
    <rect x={x + 12} y={y + 12} width={w - 24} height={h - 24} rx={6} fill="#2C3478" />
    <circle cx={x + w * 0.7} cy={y + h * 0.36} r={h * 0.12} fill={C.gold} opacity={0.45} />
    <path d={`M${x + 12} ${y + h - 12} L${x + w * 0.38} ${y + h * 0.45} L${x + w * 0.6} ${y + h * 0.7} L${x + w * 0.75} ${y + h * 0.56} L${x + w - 12} ${y + h - 12}z`} fill={SET.leafDark} opacity={0.8} />
  </g>
);

/** Cortina (lado da janela), balança um pouco. */
export const Cortina: React.FC<{ x: number; y: number; w: number; h: number; t: number; flip?: boolean }> = ({ x, y, w, h, t, flip }) => {
  const s = Math.sin(t / 45) * 6;
  const d = flip
    ? `M${x + w} ${y} h${-w} q${-10 + s} ${h * 0.5} ${12} ${h} h${w - 12}z`
    : `M${x} ${y} h${w} q${10 - s} ${h * 0.5} ${-12} ${h} h${-w + 12}z`;
  return (
    <g>
      <rect x={x - 20} y={y - 20} width={w + 40} height={12} rx={6} fill={SET.frame} />
      <path d={d} fill="#34307A" />
      {[0.3, 0.62].map((k) => (
        <rect key={k} x={x + w * k} y={y} width={8} height={h} rx={4} fill="rgba(5,7,26,0.25)" />
      ))}
    </g>
  );
};

/**
 * Piso com rodapé, tábuas em perspectiva (fugindo pro centro) e, se houver
 * janela, a mancha de luz que ela joga no chão (`light` = [x0, x1] da janela).
 */
export const Piso: React.FC<{ id: string; y: number; light?: [number, number]; warm?: boolean }> = ({ id, y, light, warm }) => {
  const vx = 540;
  const rows = [36, 84, 148, 232, 344, 490];
  // fuga 700 px acima do rodapé: no rodapé as tábuas abrem 180 px, 600 px abaixo, 334 px
  return (
    <g>
      <rect x={-500} y={y} width={2100} height={1600} fill={`url(#${id}-floor)`} />
      {light ? (
        <path
          d={`M${light[0]} ${y} L${light[1]} ${y} L${light[1] + (light[1] - vx) * 0.9} ${y + 420} L${light[0] + (light[0] - vx) * 0.9} ${y + 420}z`}
          fill={warm ? C.gold2 : C.hi}
          opacity={warm ? 0.07 : 0.045}
        />
      ) : null}
      {rows.map((r) => (
        <rect key={r} x={-500} y={y + r} width={2100} height={3} fill="rgba(5,7,26,0.22)" />
      ))}
      {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((k) => (
        <path key={k} d={`M${vx + 180 * k} ${y} L${vx + 334 * k} ${y + 600}`} stroke="rgba(5,7,26,0.16)" strokeWidth={3} />
      ))}
      <rect x={-500} y={y - 6} width={2100} height={12} fill={SET.base} />
    </g>
  );
};

/** Árvore de calçada — copa que balança. */
export const Arvore: React.FC<{ x: number; base: number; size: number; t: number; seed?: number }> = ({ x, base, size, t, seed = 0 }) => {
  const s = Math.sin(t / 34 + seed) * 2;
  const k = size / 300;
  return (
    <g transform={`translate(${x} ${base}) scale(${k})`}>
      <ellipse cx={0} cy={0} rx={70} ry={8} fill="rgba(0,0,0,0.25)" />
      <rect x={-14} y={-150} width={28} height={150} rx={10} fill="#3A2E58" />
      <g transform={`rotate(${s} 0 -150)`}>
        <circle cx={-50} cy={-200} r={70} fill={SET.leafDark} />
        <circle cx={46} cy={-210} r={74} fill={SET.leafDark} />
        <circle cx={0} cy={-270} r={84} fill={SET.leaf} opacity={0.75} />
        <circle cx={40} cy={-250} r={60} fill="rgba(5,7,26,0.2)" />
      </g>
    </g>
  );
};

/** Ônibus de perfil (vai da esquerda pra direita). */
export const Onibus: React.FC<{ x: number; base: number; w: number; t: number; accent?: string }> = ({ x, base, w, t, accent = dimColor('craft') }) => {
  const k = w / 520;
  const spin = (t * 12) % 360;
  return (
    <g transform={`translate(${x} ${base}) scale(${k})`}>
      <ellipse cx={260} cy={0} rx={250} ry={10} fill="rgba(0,0,0,0.3)" />
      <rect x={0} y={-210} width={520} height={180} rx={34} fill="#2C3680" />
      <rect x={0} y={-120} width={520} height={90} rx={30} fill="rgba(5,7,26,0.22)" />
      <rect x={0} y={-100} width={520} height={18} fill={accent} opacity={0.55} />
      {[30, 130, 230, 330].map((wx) => (
        <rect key={wx} x={wx} y={-188} width={84} height={62} rx={12} fill={C.gold2} opacity={0.22} />
      ))}
      <rect x={430} y={-188} width={70} height={110} rx={14} fill={C.gold2} opacity={0.3} />
      {[110, 410].map((cx) => (
        <g key={cx} transform={`rotate(${spin} ${cx} -26)`}>
          <circle cx={cx} cy={-26} r={30} fill={C.deep} />
          <circle cx={cx} cy={-26} r={12} fill={SET.frame} />
          <rect x={cx - 3} y={-50} width={6} height={20} fill={SET.frame} />
        </g>
      ))}
      <circle cx={508} cy={-60} r={8} fill={C.gold2} opacity={0.8} />
    </g>
  );
};

/** Carro de perfil. */
export const Carro: React.FC<{ x: number; base: number; w: number; t: number; accent?: string }> = ({ x, base, w, t, accent = dimColor('health') }) => {
  const k = w / 300;
  const spin = (t * 14) % 360;
  return (
    <g transform={`translate(${x} ${base}) scale(${k})`}>
      <ellipse cx={150} cy={0} rx={140} ry={8} fill="rgba(0,0,0,0.3)" />
      <path d="M70 -100 q20 -40 70 -40 h40 q40 0 66 40z" fill={accent} opacity={0.5} />
      <rect x={0} y={-104} width={300} height={74} rx={30} fill={accent} opacity={0.5} />
      <rect x={0} y={-70} width={300} height={40} rx={20} fill="rgba(5,7,26,0.3)" />
      <path d="M96 -104 q14 -28 46 -28 h30 q26 0 44 28z" fill={C.gold2} opacity={0.16} />
      {[64, 236].map((cx) => (
        <g key={cx} transform={`rotate(${spin} ${cx} -24)`}>
          <circle cx={cx} cy={-24} r={26} fill={C.deep} />
          <circle cx={cx} cy={-24} r={10} fill={SET.frame} />
          <rect x={cx - 3} y={-44} width={6} height={16} fill={SET.frame} />
        </g>
      ))}
    </g>
  );
};

/** Poste de luz com halo. */
export const Poste: React.FC<{ id: string; x: number; base: number; h: number; on?: number }> = ({ id, x, base, h, on = 1 }) => (
  <g>
    <circle cx={x + 40} cy={base - h + 26} r={90} fill={`url(#${id}-lamp)`} opacity={on} />
    <rect x={x - 7} y={base - h} width={14} height={h} rx={7} fill={SET.frame} />
    <path d={`M${x} ${base - h + 6} q0 -20 40 -20`} stroke={SET.frame} strokeWidth={12} fill="none" strokeLinecap="round" />
    <rect x={x + 26} y={base - h + 10} width={34} height={18} rx={8} fill={C.gold2} opacity={0.5 + 0.4 * on} />
  </g>
);

/**
 * Tela de projeção com "slides" abstratos que trocam (sem texto nem número).
 * Todo slide tem o MESMO arranjo: lista na metade esquerda (é ela que o balão
 * do `pensa` cobre) e gráfico na direita (onde a vareta de quem apresenta
 * encosta, em ≈ 0,86 w × 0,64 h). Nada redondo na metade da lista: forma
 * grande e redonda meio escondida atrás do balão vira uma lua.
 */
export const Projecao: React.FC<{ x: number; y: number; w: number; h: number; t: number; accent: string }> = ({ x, y, w, h, t, accent }) => {
  const slide = Math.floor(t / 110) % 2;
  const fadeK = Math.min(1, (t % 110) / 10);
  const X = (k: number) => x + w * k;
  const Y = (k: number) => y + h * k;
  // marcador da lista: quadradinho de canto arredondado (nunca bolinha)
  const bullet = (cy: number, fill: string) => <rect x={X(0.11) - h * 0.035} y={Y(cy) - h * 0.035} width={h * 0.07} height={h * 0.07} rx={h * 0.018} fill={fill} opacity={0.7} />;
  // gráfico de área do 2º slide: sobe da esquerda pra direita e cobre o ponto da vareta
  const pts: [number, number][] = [
    [0.6, 0.74],
    [0.68, 0.62],
    [0.76, 0.66],
    [0.84, 0.46],
    [0.92, 0.34],
  ];
  const line = pts.map(([a, b]) => `${X(a)},${Y(b)}`).join(' ');
  const inner = (k: number) =>
    k === 0 ? (
      <g>
        <rect x={X(0.08)} y={Y(0.12)} width={w * 0.5} height={h * 0.1} rx={8} fill={C.hi} opacity={0.5} />
        {[0, 1, 2].map((r) => (
          <g key={r}>
            {bullet(0.38 + r * 0.17, accent)}
            <rect x={X(0.16)} y={Y(0.35 + r * 0.17)} width={w * (0.3 - r * 0.05)} height={h * 0.06} rx={6} fill={C.hi} opacity={0.32} />
          </g>
        ))}
        {[0.42, 0.62, 0.84].map((bh, i) => (
          <rect key={i} x={X(0.6 + i * 0.11)} y={Y(0.88 - bh * 0.6)} width={w * 0.08} height={h * bh * 0.6} rx={6} fill={i === 2 ? accent : C.violet2} opacity={0.6} />
        ))}
      </g>
    ) : (
      <g>
        <rect x={X(0.08)} y={Y(0.12)} width={w * 0.4} height={h * 0.1} rx={8} fill={C.hi} opacity={0.45} />
        {[0.34, 0.22, 0.28].map((lw, r) => (
          <g key={r}>
            {bullet(0.38 + r * 0.17, r === 1 ? accent : C.violet2)}
            <rect x={X(0.16)} y={Y(0.35 + r * 0.17)} width={w * lw} height={h * 0.06} rx={6} fill={C.hi} opacity={0.3} />
          </g>
        ))}
        <polygon points={`${X(0.92)},${Y(0.88)} ${X(0.6)},${Y(0.88)} ${line}`} fill={accent} opacity={0.32} />
        <polyline points={line} fill="none" stroke={C.violet2} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" opacity={0.75} />
        <rect x={X(0.58)} y={Y(0.88)} width={w * 0.35} height={5} rx={2.5} fill={C.hi} opacity={0.3} />
      </g>
    );
  return (
    <g>
      {/* feixe do projetor */}
      <path d={`M${x + w / 2 - 20} ${y - 260} L${x} ${y} L${x + w} ${y + h} L${x + w / 2 + 20} ${y - 260}z`} fill={C.hi} opacity={0.025} />
      <rect x={x - 16} y={y - 16} width={w + 32} height={h + 32} rx={14} fill={SET.frame} />
      <rect x={x} y={y} width={w} height={h} rx={6} fill="#34408E" />
      <g opacity={slide === 0 ? fadeK : 1 - fadeK}>{inner(0)}</g>
      <g opacity={slide === 1 ? fadeK : 1 - fadeK}>{inner(1)}</g>
    </g>
  );
};

/** Mural de recados com post-its coloridos que tremem de leve (sem texto). */
export const Mural: React.FC<{ x: number; y: number; w: number; h: number; t: number }> = ({ x, y, w, h, t }) => {
  const notes = [C.gold, dimColor('health'), dimColor('bonds'), C.gold2, dimColor('craft'), C.violet2];
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={SET.frame} />
      <rect x={x + 10} y={y + 10} width={w - 20} height={h - 20} rx={6} fill="#3B3A78" />
      {notes.map((c, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const nx = x + 22 + col * (w - 44) * 0.5 + (row % 2) * 10;
        const ny = y + 22 + row * (h - 44) * 0.33;
        const r = (noise(i * 3) - 0.5) * 14 + Math.sin(t / 22 + i) * 2;
        return <rect key={i} x={nx} y={ny} width={(w - 44) * 0.42} height={(h - 44) * 0.26} rx={4} fill={c} opacity={0.55} transform={`rotate(${r} ${nx + 20} ${ny})`} />;
      })}
    </g>
  );
};

/** Luminária pendente com cone de luz no chão. `y` = altura da cúpula. */
export const Pendente: React.FC<{ x: number; y: number; floor: number; t: number }> = ({ x, y, floor, t }) => {
  const sw = Math.sin(t / 60) * 1.5;
  return (
    <g transform={`rotate(${sw} ${x} -600)`}>
      <path d={`M${x - 26} ${y + 30} L${x - 220} ${floor} L${x + 220} ${floor} L${x + 26} ${y + 30}z`} fill={C.gold2} opacity={0.035} />
      <rect x={x - 2} y={-600} width={4} height={y + 600} fill={SET.frame} />
      <path d={`M${x - 46} ${y + 34} q0 -46 46 -46 q46 0 46 46z`} fill={SET.furnTop} />
      <path d={`M${x} ${y - 12} q46 0 46 46 h-46z`} fill="rgba(5,7,26,0.25)" />
      <ellipse cx={x} cy={y + 36} rx={24} ry={8} fill={C.gold2} opacity={0.8} />
    </g>
  );
};

// ------------------------------------------------------------ partes com pessoa (<div>)

/**
 * O que um Posto ocupa (coordenadas do cenário, mesma geometria do desenho
 * abaixo): rosto, corpo, monitor e a mesa com caneca, teclado e pés. É por
 * aqui que o ambiente sabe se alguma parte do posto ficaria embaixo de peça:
 * o colega e o posto andam juntos ou saem juntos, nunca sobra um pedaço.
 */
export const postoPartes = (x: number, top: number, size = 170, flip = false): [number, number, number, number][] => {
  const pTop = top - size * 1.3 * 0.7;
  const mx = flip ? x - size * 0.95 : x + size * 0.32;
  const deskW = size * 2.1;
  const visual = useVisual();
  return [
    [x - 0.34 * size, pTop + 0.12 * size, x + 0.34 * size, pTop + 0.8 * size],
    [x - 0.4 * size, pTop + 0.8 * size, x + 0.4 * size, top],
    [mx, top - 100, mx + size * 0.64, top],
    [x - deskW / 2, top - 40, x + deskW / 2, top + 116],
  ];
};

/**
 * Posto de trabalho de um colega: mesa com painel, monitor de lado (tela que
 * pisca), teclado e as mãos digitando. `x` = centro da pessoa, `top` = tampo.
 */
export const Posto: React.FC<{ t: number; x: number; top: number; seed: number; size?: number; mug?: boolean; flip?: boolean }> = ({
  t,
  x,
  top,
  seed,
  size = 170,
  mug = false,
  flip = false,
}) => {
  const h = size * 1.3;
  const pTop = top - h * 0.7;
  const skin = SKINS[seed % SKINS.length];
  const tap = (k: number) => (Math.floor(t / 3 + seed * 5 + k * 2) % 3 === 0 ? -5 : 0);
  const flick = 0.5 + 0.25 * noise(Math.floor(t / 5) + seed * 9);
  const mx = flip ? x - size * 0.95 : x + size * 0.32;
  const deskW = size * 2.1;
  const visual = useVisual();
  return (
    <>
      <div style={{ position: 'absolute', left: x - size / 2, top: pTop, filter: filtroFigurante(visual, DIM) }}>
        <Pessoa t={t} size={size} seed={seed} skin={skin} accent={FIG_ACCENT} arms="none" mood="ok" />
      </div>
      <svg style={{ position: 'absolute', left: x - deskW / 2, top: top - 120, overflow: 'visible' }} width={deskW} height={240} viewBox={`0 0 ${deskW} 240`}>
        {/* monitor virado pra câmera, de lado */}
        <g transform={`translate(${mx - (x - deskW / 2)} 0)`}>
          <rect x={size * 0.28} y={86} width={14} height={34} fill={SET.frameShade} />
          <rect x={0} y={20} width={size * 0.64} height={size * 0.44} rx={8} fill={SET.frame} />
          <rect x={6} y={26} width={size * 0.64 - 12} height={size * 0.44 - 12} rx={5} fill={C.violet} opacity={flick * 0.55} />
          <rect x={14} y={36} width={size * 0.3} height={6} rx={3} fill={C.hi} opacity={0.3} />
          <rect x={14} y={48} width={size * 0.4} height={6} rx={3} fill={C.hi} opacity={0.2} />
        </g>
        {/* tampo + painel */}
        <rect x={0} y={120} width={deskW} height={16} rx={6} fill={SET.furnTop} />
        <rect x={10} y={136} width={deskW - 20} height={72} rx={6} fill={SET.furn} />
        <rect x={deskW / 2} y={136} width={deskW / 2 - 10} height={72} rx={6} fill="rgba(5,7,26,0.22)" />
        <rect x={16} y={208} width={12} height={28} rx={4} fill={SET.furnDark} />
        <rect x={deskW - 28} y={208} width={12} height={28} rx={4} fill={SET.furnDark} />
        {/* teclado e mãos */}
        <rect x={deskW / 2 - size * 0.28} y={110} width={size * 0.56} height={10} rx={4} fill={SET.frame} />
        <circle cx={deskW / 2 - size * 0.14} cy={108 + tap(0)} r={size * 0.06} fill={skin} opacity={0.55} />
        <circle cx={deskW / 2 + size * 0.14} cy={108 + tap(1)} r={size * 0.06} fill={skin} opacity={0.55} />
        {mug ? (
          <g transform={`translate(${flip ? deskW - 44 : 18} 84)`}>
            <rect x={0} y={0} width={26} height={36} rx={7} fill={SET.frame} />
            <path d="M26 8 a10 10 0 0 1 0 18" stroke={SET.frame} strokeWidth={6} fill="none" />
            {[0, 1].map((i) => {
              const k = ((t + i * 20) % 40) / 40;
              return <path key={i} d={`M${8 + i * 10} ${-4 - k * 26} q-5 -6 0 -12 q5 -6 0 -12`} stroke={C.hi} strokeWidth={3.5} strokeLinecap="round" fill="none" opacity={Math.sin(k * Math.PI) * 0.35} />;
            })}
          </g>
        ) : null}
      </svg>
    </>
  );
};

/**
 * Encosto da cadeira da plateia, visto de trás: vai NA FRENTE de quem senta
 * (esconde da cintura pra baixo). `x` = centro, `y` = linha dos pés de quem
 * senta, `size` = tamanho dessa pessoa. A protagonista que senta na plateia
 * (cena pensa no treinamento) usa o mesmo, por cima dela.
 */
export const Encosto: React.FC<{ x: number; y: number; size: number; tone?: string }> = ({ x, y, size, tone = SET.furn }) => (
  <svg style={{ position: 'absolute', left: x - size * 0.42, top: y - size * 0.3 }} width={size * 0.84} height={size * 0.75} viewBox="0 0 100 90">
    <rect x={4} y={0} width={92} height={56} rx={18} fill={tone} />
    <rect x={50} y={0} width={46} height={56} rx={18} fill="rgba(5,7,26,0.25)" />
    <rect x={14} y={56} width={8} height={34} rx={3} fill={SET.furnDark} />
    <rect x={78} y={56} width={8} height={34} rx={3} fill={SET.furnDark} />
  </svg>
);

/** Fileira de plateia de costas, com o encosto das cadeiras na frente. */
export const Plateia: React.FC<{ t: number; xs: number[]; y: number; size: number; seed?: number }> = ({ t, xs, y, size, seed = 0 }) => (
  <>
    {xs.map((x, i) => (
      <React.Fragment key={i}>
        <DeCostas t={t} x={x} y={y} size={size} seed={seed + i} />
        <Encosto x={x} y={y} size={size} />
      </React.Fragment>
    ))}
  </>
);
