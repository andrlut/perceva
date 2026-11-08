// Opção "iris" — a assinatura mora no OLHAR.
//
// Cada olho é o Topo Iris do logo em miniatura: campo marinho, íris violeta
// com um anel concêntrico mais claro, pupila e um brilho dourado no canto de
// cima-esquerda (a luz do estilo). A pálpebra de cima corta o topo do olho:
// olhar calmo, de adulto, nunca o olho arregalado de desenho infantil.
// E o traço dourado diagonal do logo volta como UMA mecha de cabelo que sobe
// da esquerda-baixo pra direita-cima, no mesmo lugar em todo mundo.
//
// Abaixo de 130 px o olho perde os anéis (vira íris + pupila + brilho), que é
// o que ainda se lê numa multidão de 90 px.
import React, { useId } from 'react';
import { C, dimColor } from '../../theme';
import type { IdentityOption, PessoaProps } from '../types';

const shade = 'rgba(10,14,38,0.28)';
const shine = 'rgba(255,255,255,0.22)';

// ------------------------------------------------------------------ cores
const HAIR = {
  black: '#2E2229', // quase-preto quente: o marrom mais escuro das peles sob a sombra marinho
  dark: '#5C3A24',
  brown: '#8D5A3B',
  grey: C.mid,
  blond: C.goldDeep,
} as const;

const lin = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lum = (hex: string) => {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => lin(parseInt(h.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
/** Primeira cor de cabelo que se separa da pele; senão a que mais se separa. */
const pickHair = (cands: string[], skin: string) =>
  cands.find((c) => contrast(c, skin) >= 1.45) ?? [...cands].sort((a, b) => contrast(b, skin) - contrast(a, skin))[0];

// ------------------------------------------------------------------ formas
type Shape = { d: string } | { cx: number; cy: number; r: number } | { cx: number; cy: number; rx: number; ry: number };
const draw = (shapes: Shape[], fill: string, k: string) =>
  shapes.map((s, i) =>
    'd' in s ? (
      <path key={k + i} d={s.d} fill={fill} />
    ) : 'r' in s ? (
      <circle key={k + i} cx={s.cx} cy={s.cy} r={s.r} fill={fill} />
    ) : (
      <ellipse key={k + i} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill={fill} />
    ),
  );

// Borda do cabelo centrada na cabeça (100,92): meia-largura do círculo de raio r na altura y.
const ox = (r: number, y: number) => Math.sqrt(Math.max(0, r * r - (y - 92) ** 2));
/** Calota que abraça a cabeça: arco de raio r do lado esquerdo em y0 ao direito em y0, por cima. */
const calota = (r: number, y0: number) => `M${100 - ox(r, y0)} ${y0} A${r} ${r} 0 1 1 ${100 + ox(r, y0)} ${y0}`;

/** Mecha: lente fina nas pontas e cheia no meio, ao longo de uma curva quadrática. */
const mecha = (x0: number, y0: number, cx: number, cy: number, x2: number, y2: number, w: number) => {
  const dx = x2 - x0;
  const dy = y2 - y0;
  const L = Math.hypot(dx, dy);
  const nx = (-dy / L) * w;
  const ny = (dx / L) * w;
  return `M${x0} ${y0} Q${cx + nx} ${cy + ny} ${x2} ${y2} Q${cx - nx} ${cy - ny} ${x0} ${y0} Z`;
};

type Hair = {
  color: string[];
  back?: Shape[];
  front: Shape[];
  /** a mecha dourada (forma preenchida) */
  strand: string;
  glasses?: boolean;
  beard?: string;
  earrings?: boolean;
  /** decote: careca (U), V, gola de camisa ou canoa */
  neck: 'u' | 'v' | 'gola' | 'canoa';
};

const HAIRS: Hair[] = [
  // 0 — curto, varrido pra esquerda, risca do lado direito
  {
    color: [HAIR.dark, HAIR.black],
    front: [{ d: `${calota(52, 100)} L148 92 Q143 66 127 57 Q96 60 66 75 Q58 82 57 100 Z` }, { cx: 119, cy: 47, rx: 14, ry: 9 }],
    strand: mecha(60, 78, 88, 57, 124, 48, 7),
    neck: 'u',
  },
  // 1 — black power, cachos
  {
    color: [HAIR.black, HAIR.dark],
    back: [
      { cx: 100, cy: 80, r: 55 },
      ...Array.from({ length: 11 }, (_, i) => {
        const a = ((-22 + i * 22.4) * Math.PI) / 180;
        return { cx: 100 + 54 * Math.cos(a), cy: 80 - 52 * Math.sin(a), r: 14 };
      }),
    ],
    front: [
      { cx: 100, cy: 56, rx: 40, ry: 14 },
      { cx: 61, cy: 74, r: 11 },
      { cx: 76, cy: 61, r: 13 },
      { cx: 94, cy: 54, r: 13 },
      { cx: 112, cy: 54, r: 13 },
      { cx: 128, cy: 60, r: 13 },
      { cx: 140, cy: 73, r: 11 },
    ],
    strand: mecha(66, 66, 90, 46, 124, 30, 7),
    neck: 'v',
  },
  // 2 — mais velho: grisalho curto penteado pra trás, óculos redondos
  {
    color: [HAIR.grey],
    front: [{ d: `${calota(51, 96)} L146 96 Q146 70 128 60 Q100 52 72 60 Q54 70 54 96 Z` }],
    strand: mecha(66, 59, 88, 46, 120, 43, 6),
    glasses: true,
    neck: 'gola',
  },
  // 3 — coque no alto, cabelo puxado, brinco de pérola
  {
    color: [HAIR.brown, HAIR.dark, HAIR.black],
    back: [{ cx: 102, cy: 31, r: 18 }],
    front: [{ d: `${calota(51, 98)} L146 98 Q147 62 104 56 Q99 60 96 56 Q53 62 54 98 Z` }],
    strand: mecha(57, 84, 68, 58, 96, 42, 7),
    earrings: true,
    neck: 'canoa',
  },
  // 4 — degradê curtinho com risco raspado, barba
  {
    color: [HAIR.black, HAIR.dark],
    front: [{ d: 'M51 96 L51 76 Q52 38 100 37 Q148 38 149 76 L149 96 L145 96 Q144 70 134 63 Q100 57 66 63 Q56 70 55 96 Z' }],
    strand: mecha(61, 64, 71, 52, 86, 42, 4.6),
    neck: 'gola',
    beard: 'M52 100 Q53 145 100 146 Q147 145 148 100 L143 100 Q141 128 120 131 Q100 125 80 131 Q59 128 57 100 Z',
  },
  // 5 — comprido com franja cortina
  {
    color: [HAIR.blond, HAIR.brown, HAIR.dark],
    back: [{ d: 'M46 90 Q40 150 46 182 Q100 194 154 182 Q160 150 154 90 Z' }, { cx: 100, cy: 88, r: 54 }],
    front: [{ d: `${calota(53, 112)} L141 112 Q141 66 110 57 Q103 55 100 50 Q97 55 90 57 Q59 66 59 112 Z` }],
    strand: mecha(53, 108, 56, 70, 90, 55, 7),
    neck: 'v',
  },
];

// ------------------------------------------------------------------ olhos
const Eye: React.FC<{ x: number; y: number; detail: boolean; closed: boolean; mood: PessoaProps['mood']; skin: string }> = ({
  x,
  y,
  detail,
  closed,
  mood,
  skin,
}) => {
  if (closed) {
    return <path d={`M${x - 10} ${y - 1} Q${x} ${y + 4} ${x + 10} ${y - 1}`} stroke={C.deep} strokeWidth={3.4} strokeLinecap="round" fill="none" />;
  }
  const out = x < 100 ? -1 : 1; // lado de fora do rosto
  // pálpebra de cima: calma (ok/feliz) ou pesada caindo pra fora (cansado)
  const lidIn = mood === 'cansado' ? y - 1.5 : y - 5;
  const lidOut = mood === 'cansado' ? y + 1.5 : y - 5;
  const [lx, rx] = out < 0 ? [lidOut, lidIn] : [lidIn, lidOut];
  const lid = `M${x - 13} ${y - 16} H${x + 13} V${rx} Q${x} ${(lx + rx) / 2 - (mood === 'cansado' ? 0 : 2)} ${x - 13} ${lx} Z`;
  return (
    <g>
      <circle cx={x} cy={y} r={9.5} fill={C.deep} />
      {detail ? (
        <>
          <circle cx={x} cy={y} r={8.3} fill="none" stroke={C.violet2} strokeWidth={0.9} opacity={0.35} />
          <circle cx={x} cy={y} r={6.7} fill={C.violet} />
          <circle cx={x} cy={y} r={4.8} fill="none" stroke={C.violet2} strokeWidth={1.2} />
          <circle cx={x} cy={y} r={3.1} fill={C.deep} />
          <circle cx={x - 3.1} cy={y - 3} r={2.2} fill={C.gold2} />
        </>
      ) : (
        <>
          <circle cx={x} cy={y} r={6.4} fill={C.violet} />
          <circle cx={x} cy={y} r={3.2} fill={C.deep} />
          <circle cx={x - 3} cy={y - 2.8} r={2.5} fill={C.gold2} />
        </>
      )}
      <path d={lid} fill={skin} />
      {mood === 'cansado' && (
        <>
          <path d={lid} fill={shade} opacity={0.3} />
          <path d={`M${x - 11} ${lx + (out < 0 ? 0.3 : 0)} L${x + 11} ${rx}`} stroke={C.deep} strokeWidth={2.6} strokeLinecap="round" />
        </>
      )}
      {mood === 'feliz' && (
        // bochecha que sobe: o olho vira meia-lua sorridente, a íris continua lá
        <ellipse cx={x} cy={y + 12} rx={14} ry={8.5} fill={skin} />
      )}
    </g>
  );
};

// ------------------------------------------------------------------ pessoa
export const Pessoa: React.FC<PessoaProps> = ({
  t = 0,
  size = 260,
  accent = C.violet,
  skin = '#F2C9A0',
  mood = 'ok',
  seed = 0,
  arms = 'none',
  still = false,
  cap: capColor,
  sweat = false,
}) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const s = ((Math.round(seed) % 6) + 6) % 6;
  const H = HAIRS[s];
  const hair = pickHair(H.color, skin);
  const detail = size >= 130;
  const bob = still ? 0 : Math.sin((t + seed * 11) / 14) * 3;
  const wave = arms === 'up' ? Math.sin((t + seed * 7) / 5) * 10 : 0;
  const [la, ra] = arms === 'down' ? [14, -14] : arms === 'up' ? [150 + wave, -150 - wave] : arms === 'out' ? [14, -78] : [0, 0];
  const k = (t + seed * 37) % 96;
  const closed = k < 4;
  const strandColor = hair === HAIR.blond ? C.goldLight : C.gold;
  const browColor = hair === HAIR.grey ? C.dim : hair;

  const arm = (side: 'l' | 'r', a: number) => {
    const px = side === 'l' ? 58 : 142;
    return (
      <g transform={`rotate(${a} ${px} 158)`}>
        <rect x={px - 10.5} y={150} width={21} height={62} rx={10.5} fill={accent} />
        <rect x={px - 10.5} y={150} width={21} height={62} rx={10.5} fill={shade} opacity={side === 'r' ? 1 : 0.4} />
        <circle cx={px} cy={210} r={11.5} fill={skin} />
      </g>
    );
  };

  const brows =
    mood === 'feliz'
      ? ['M72 77 Q82 71 92 75', 'M108 75 Q118 71 128 77']
      : mood === 'cansado'
        ? ['M72 82 Q82 80 92 76', 'M108 76 Q118 80 128 82']
        : ['M72 80 Q82 75 92 78', 'M108 78 Q118 75 128 80'];
  const mouth = mood === 'feliz' ? null : mood === 'cansado' ? 'M91 120 Q100 115 109 120' : 'M91 116 Q100 121 109 116';

  // Sombra do cabelo, recortada na própria forma. O brilho do cabelo É a
  // mecha dourada (fica do lado da luz, em cima-esquerda) — não tem outro.
  const hairVolume = (id: string) => (
    <g clipPath={`url(#${id})`}>
      <ellipse cx={158} cy={86} rx={40} ry={74} fill={shade} />
    </g>
  );

  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 200 260" style={{ overflow: 'visible' }}>
      <defs>
        {H.back && <clipPath id={`${uid}b`}>{draw(H.back, '#000', 'cb')}</clipPath>}
        <clipPath id={`${uid}f`}>{draw(H.front, '#000', 'cf')}</clipPath>
        <clipPath id={`${uid}s`}>
          {draw(H.front, '#000', 'sf')}
          {H.back && draw(H.back, '#000', 'sb')}
        </clipPath>
        {/* com boné, só o cabelo abaixo da aba */}
        <clipPath id={`${uid}u`}>
          <rect x={0} y={78} width={200} height={182} />
        </clipPath>
      </defs>
      <ellipse cx={100} cy={252} rx={56} ry={7} fill="rgba(0,0,0,0.25)" />
      <g transform={`translate(0 ${bob})`}>
        {/* cabelo de trás */}
        {H.back && (
          <g clipPath={capColor ? `url(#${uid}u)` : undefined}>
            {draw(H.back, hair, 'b')}
            {hairVolume(`${uid}b`)}
          </g>
        )}
        {arms !== 'none' && arm('l', la)}
        {/* pescoço + corpo */}
        <rect x={89} y={118} width={22} height={32} rx={8} fill={skin} />
        <rect x={89} y={118} width={22} height={32} rx={8} fill={shade} opacity={0.6} />
        <path d="M54 176 Q54 142 88 140 L112 140 Q146 142 146 176 L143 238 Q142 250 130 250 L70 250 Q58 250 57 238 Z" fill={accent} />
        <path d="M100 140 L112 140 Q146 142 146 176 L143 238 Q142 250 130 250 L100 250 Z" fill={shade} />
        {H.neck === 'v' ? (
          <>
            <path d="M88 140 L100 160 L112 140 Z" fill={skin} />
            <path d="M88 140 L100 150 L112 140 Z" fill={shade} opacity={0.7} />
          </>
        ) : H.neck === 'canoa' ? (
          <>
            <path d="M78 141 Q100 154 122 141 Z" fill={skin} />
            <path d="M84 141 Q100 147 116 141 Z" fill={shade} opacity={0.7} />
          </>
        ) : (
          <>
            <path d="M87 140 Q100 158 113 140 Z" fill={skin} />
            <path d="M87 140 Q100 150 113 140 Z" fill={shade} opacity={0.7} />
          </>
        )}
        {H.neck === 'gola' && (
          <g>
            <path d="M85 138 L100 154 L90 162 L79 145 Z" fill={accent} />
            <path d="M115 138 L100 154 L110 162 L121 145 Z" fill={accent} />
            <path d="M85 138 L100 154 L90 162 L79 145 Z" fill={shine} />
            <path d="M115 138 L100 154 L110 162 L121 145 Z" fill={shine} opacity={0.4} />
          </g>
        )}
        {arms !== 'none' && arm('r', ra)}
        {/* orelhas */}
        <circle cx={53} cy={98} r={9} fill={skin} />
        <circle cx={147} cy={98} r={9} fill={skin} />
        <circle cx={147} cy={98} r={9} fill={shade} opacity={0.6} />
        {H.earrings && (
          <>
            <circle cx={52} cy={111} r={3.4} fill={C.hi} />
            <circle cx={148} cy={111} r={3.4} fill={C.text} />
          </>
        )}
        {/* cabeça */}
        <circle cx={100} cy={92} r={48} fill={skin} />
        <path d="M100 44 a48 48 0 0 1 0 96 a37 48 0 0 0 0 -96z" fill={shade} opacity={0.5} />
        {/* rosto */}
        <ellipse cx={101} cy={106} rx={4} ry={3} fill="rgba(10,14,38,0.16)" />
        <Eye x={82} y={95} detail={detail} closed={closed} mood={mood} skin={skin} />
        <Eye x={118} y={95} detail={detail} closed={closed} mood={mood} skin={skin} />
        {mood === 'feliz' && (
          <>
            <ellipse cx={72} cy={112} rx={7} ry={4} fill={dimColor('health')} opacity={0.22} />
            <ellipse cx={128} cy={112} rx={7} ry={4} fill={dimColor('health')} opacity={0.22} />
          </>
        )}
        {brows.map((d) => (
          <path key={d} d={d} stroke={browColor} strokeWidth={4.6} strokeLinecap="round" fill="none" />
        ))}
        {H.beard && <path d={H.beard} fill={hair} />}
        {mouth ? (
          <path d={mouth} stroke={C.deep} strokeWidth={4.6} strokeLinecap="round" fill="none" />
        ) : (
          <path d="M86 113 Q100 115 114 113 Q113 129 100 129 Q87 129 86 113 Z" fill={C.deep} />
        )}
        {H.glasses && (
          <g fill="none" stroke={C.text} strokeWidth={2.6}>
            <circle cx={82} cy={95} r={15} />
            <circle cx={118} cy={95} r={15} />
            <path d="M97 93 Q100 90 103 93 M67 93 L54 90 M133 93 L146 90" strokeLinecap="round" />
          </g>
        )}
        {/* cabelo da frente + a mecha dourada */}
        <g clipPath={capColor ? `url(#${uid}u)` : undefined}>
          {draw(H.front, hair, 'f')}
          {hairVolume(`${uid}f`)}
          <g clipPath={`url(#${uid}s)`}>
            <path d={H.strand} fill={strandColor} />
          </g>
        </g>
        {capColor && (
          <g>
            <path d="M47 82 a53 47 0 0 1 106 0 q-53 -10 -106 0z" fill={capColor} />
            <path d="M100 35 a53 47 0 0 1 53 47 q-26 -5 -53 -6z" fill={shade} />
            <rect x={120} y={72} width={58} height={12} rx={6} fill={capColor} />
            <circle cx={100} cy={37} r={4} fill={shade} />
          </g>
        )}
        {sweat && (
          <path
            d={`M154 ${60 + ((t + seed * 9) % 30)} q8 12 0 18 q-8 -6 0 -18z`}
            fill={dimColor('bonds')}
            opacity={1 - ((t + seed * 9) % 30) / 30}
          />
        )}
      </g>
    </svg>
  );
};

// ------------------------------------------------------------------ fundo
/** Os anéis do Topo Iris, bem apagados, se abrindo devagar atrás do elenco. */
export const Backdrop: React.FC<{ t: number; width: number; height: number; accent: string }> = ({ t, width, height }) => {
  const step = Math.max(width, height) * 0.14;
  const drift = (t * 0.3) % step;
  const cx = width / 2;
  const cy = height * 0.62;
  return (
    <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
      {Array.from({ length: 7 }, (_, i) => {
        const r = (i + 0.4) * step + drift;
        const o = Math.max(0, 0.16 * (1 - r / (step * 7.4)));
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={C.violet2} strokeWidth={2} opacity={o} />;
      })}
    </svg>
  );
};

export const option: IdentityOption = {
  id: 'iris',
  name: 'Olhar Íris',
  pitch: 'O logo mora no olhar: íris violeta em anéis com brilho dourado, e em todo mundo uma mecha dourada na diagonal do Topo Iris.',
  Pessoa,
  Backdrop,
};
