// Opção "feijao" — Silhueta. Cabeça e corpo são UM contorno só (um feijão em
// pé, levemente mais largo na base), com um penteado-assinatura por pessoa
// e o rosto da família: dois olhos ovais verticais + sobrancelhas curtas.
// A roupa fecha em diagonal (sobe da esquerda pra direita, como o traço dourado
// do Topo Iris) com um friso e um broche dourados — a marca que toda pessoa usa.
//
// Volume: a sombra é um "aro" que segue o contorno inteiro (corpo + cabelo),
// calculado como silhueta − silhueta deslocada pra cima-esquerda; luz de
// cima-esquerda, um brilho pequeno. O feijão respira (achata/estica na base)
// em vez de quicar, pra não descolar da sombra.
import React, { useId } from 'react';
import { C, dimColor } from '../../theme';
import type { IdentityOption, PessoaProps } from '../types';

const SHADE = 'rgba(10,14,38,0.30)';
const SHINE = 'rgba(255,255,255,0.22)';
/** Tinta do cabelo escuro: violetDeep + deep (preto-azulado da marca, não some no fundo navy). */
const INK = '#231A62';

// Silhueta do feijão (simétrica em x=100): cabeça 100 de largura, cintura sutil
// no pescoço (94), base 108 — coluna macia, não saco.
const BEAN =
  'M100 40 C130 40 150 62 150 92 C150 118 147 132 147 148 C147 170 154 188 154 214 C154 238 138 250 116 250 L84 250 C62 250 46 238 46 214 C46 188 53 170 53 148 C53 132 50 118 50 92 C50 62 70 40 100 40 Z';
// Gola transpassada: a borda sobe da esquerda pra direita.
const NECK_LINE = 'M20 160 C60 156 92 146 114 136 C134 127 154 121 184 118';
const GARMENT = `${NECK_LINE} L190 262 L10 262 Z`;
const PIN = { x: 130, y: 129 };

type Hair = {
  color: string;
  brow: string;
  back?: string; // atrás do feijão (cabelo comprido)
  front?: string; // sobre a cabeça
  dots?: [number, number, number][]; // cachos, coque
  beard?: string;
  glasses?: boolean;
};

const HAIRS: Hair[] = [
  // 0 — comprido, risca do lado, franja varrida pra direita
  {
    color: INK,
    brow: INK,
    back: 'M100 34 C142 34 162 62 161 104 C160 132 164 156 158 176 C155 184 146 184 144 176 L142 130 L58 130 L56 176 C54 184 45 184 42 176 C36 156 40 132 39 104 C38 62 58 34 100 34 Z',
    front: 'M46 104 C40 60 64 34 102 34 C140 34 162 62 156 104 C150 82 136 66 116 60 C100 56 86 58 76 52 C70 66 58 86 46 104 Z',
  },
  // 1 — cachos altos
  {
    color: INK,
    brow: INK,
    front: 'M48 92 C46 58 70 38 100 38 C130 38 154 58 152 92 C144 76 124 66 100 66 C76 66 56 76 48 92 Z',
    dots: [
      [55, 74, 13],
      [61, 55, 15],
      [77, 41, 16],
      [100, 35, 17],
      [123, 41, 16],
      [139, 55, 15],
      [145, 74, 13],
    ],
  },
  // 2 — coque
  {
    color: '#5C3A24',
    brow: '#5C3A24',
    front: 'M49 90 C48 58 70 38 100 38 C130 38 152 58 151 90 C140 70 122 62 100 62 C78 62 60 70 49 90 Z',
    dots: [[100, 29, 15]],
  },
  // 3 — topete que sobe pra direita (o traço do logo)
  {
    color: C.goldDeep,
    brow: '#8D5A3B',
    front: 'M50 88 C48 60 66 44 88 42 C100 28 122 16 152 18 C140 26 134 34 134 44 C148 54 154 70 150 88 C138 70 118 62 98 64 C78 66 60 74 50 88 Z',
  },
  // 4 — careca + barba (a barba é o traço dele)
  {
    color: INK,
    brow: INK,
    beard: 'M53 102 C55 132 76 149 100 149 C124 149 145 132 147 102 C143 114 135 121 125 123 C117 125 110 126 100 126 C90 126 83 125 75 123 C65 121 57 114 53 102 Z',
  },
  // 5 — chanel prateado + óculos dourados
  {
    color: C.mid,
    brow: C.faint,
    front: 'M44 124 C38 62 64 34 100 34 C136 34 162 62 156 124 C156 132 146 134 143 126 C143 104 141 86 134 76 C120 70 110 68 100 68 C88 68 76 70 66 76 C59 86 57 104 57 126 C54 134 44 132 44 124 Z',
    glasses: true,
  },
];

// Boné raso, usado pra trás no alto da cabeça: a aba fica acima das sobrancelhas.
const CAP_DOME = 'M46 72 C44 48 68 33 100 33 C132 33 156 48 154 72 C130 62 70 62 46 72 Z';
const CAP_VISOR = 'M128 66 C150 60 172 61 183 67 C179 74 152 75 128 72 Z';
/** Abaixo da aba do boné: o que do penteado continua aparecendo. */
const BELOW_CAP = 68;

const Eye: React.FC<{ x: number; y: number; mood: string; blink: boolean }> = ({ x, y, mood, blink }) => {
  if (blink) return <rect x={x - 6} y={y - 1.6} width={12} height={3.2} rx={1.6} />;
  if (mood === 'feliz')
    return <path d={`M${x - 5.8} ${y + 3} C${x - 5.8} ${y - 12} ${x + 5.8} ${y - 12} ${x + 5.8} ${y + 3} C${x + 3} ${y - 1} ${x - 3} ${y - 1} ${x - 5.8} ${y + 3} Z`} />;
  if (mood === 'cansado')
    return <path d={`M${x - 5.8} ${y - 1} C${x - 2} ${y - 2.5} ${x + 2} ${y - 2.5} ${x + 5.8} ${y - 1} C${x + 5.8} ${y + 9} ${x - 5.8} ${y + 9} ${x - 5.8} ${y - 1} Z`} />;
  return <ellipse cx={x} cy={y} rx={5.6} ry={8.6} />;
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
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const s = ((seed % 6) + 6) % 6;
  const hair = HAIRS[s];
  const k = still ? 1 : 1 + 0.013 * Math.sin((t + seed * 11) / 14);
  const blink = (t + seed * 37) % 96 < 4;
  const wave = arms === 'up' ? Math.sin((t + seed * 7) / 5) * 10 : 0;
  const [la, ra] =
    arms === 'down' ? [20, -20] : arms === 'up' ? [150 + wave, -150 - wave] : arms === 'out' ? [20, -78] : [0, 0];

  const arm = (side: 'l' | 'r', a: number) => {
    const px = side === 'l' ? 58 : 142;
    return (
      <g transform={`rotate(${a} ${px} 158)`}>
        <rect x={px - 9} y={150} width={18} height={64} rx={9} fill={accent} />
        <rect x={px - 9} y={150} width={18} height={64} rx={9} fill={SHADE} opacity={side === 'r' ? 1 : 0.55} />
        <circle cx={px} cy={212} r={10.5} fill={skin} />
      </g>
    );
  };

  // Penteado de cima (com boné, só o que sai por baixo da aba).
  const hairTop = (fill: string) => (
    <g clipPath={cap ? `url(#fjc${uid})` : undefined}>
      {hair.front && <path d={hair.front} fill={fill} />}
      {hair.dots?.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={fill} />)}
    </g>
  );
  // Silhueta inteira (feijão + cabelo + boné) — base do aro de sombra.
  const sil = (fill: string) => (
    <>
      <path d={BEAN} fill={fill} />
      {hair.back && <path d={hair.back} fill={fill} />}
      {hairTop(fill)}
      {cap && <path d={CAP_DOME} fill={fill} />}
      {cap && <path d={CAP_VISOR} fill={fill} />}
    </>
  );

  const ex = 17;
  const ey = 92;
  const browY = mood === 'feliz' ? ey - 23 : ey - 19;
  const brow = (side: -1 | 1) => {
    const x = 100 + side * ex;
    if (mood === 'cansado') {
      // pontas de dentro sobem: cansaço/preocupação
      const inner = x - side * 7;
      const outer = x + side * 7;
      return <path d={`M${outer} ${ey - 15} L${inner} ${ey - 20}`} />;
    }
    return <path d={`M${x - 7} ${browY} Q${x} ${browY - 3} ${x + 7} ${browY}`} />;
  };
  const mouth =
    mood === 'feliz' ? (
      <path d="M88.5 110 Q100 127 111.5 110 Q100 115 88.5 110 Z" fill={C.deep} />
    ) : mood === 'cansado' ? (
      <path d="M92 119 Q100 113 108 119" stroke={C.deep} strokeWidth={4.4} strokeLinecap="round" fill="none" />
    ) : (
      <path d="M93 115 Q100 118 107 115" stroke={C.deep} strokeWidth={4.4} strokeLinecap="round" fill="none" />
    );
  const drop = (t + seed * 9) % 30;

  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 200 260" style={{ overflow: 'visible' }}>
      <defs>
        <clipPath id={`fjb${uid}`}>
          <path d={BEAN} />
        </clipPath>
        <clipPath id={`fjc${uid}`}>
          <rect x={0} y={BELOW_CAP} width={200} height={260 - BELOW_CAP} />
        </clipPath>
        {/* aro de sombra = silhueta − silhueta deslocada pra cima-esquerda */}
        <mask id={`fjm${uid}`} maskUnits="userSpaceOnUse" x={-20} y={-20} width={240} height={300}>
          {sil('#fff')}
          <g transform="translate(-15 -6)">{sil('#000')}</g>
        </mask>
      </defs>
      <ellipse cx={100} cy={252} rx={60} ry={7} fill="rgba(0,0,0,0.25)" />
      <g transform={`translate(100 250) scale(${1 - (k - 1) * 0.6} ${k}) translate(-100 -250)`}>
        {hair.back && <path d={hair.back} fill={hair.color} />}
        {arms !== 'none' && arm('l', la)}
        {arms !== 'none' && arm('r', ra)}
        {/* feijão: pele em cima, roupa transpassada embaixo */}
        <g clipPath={`url(#fjb${uid})`}>
          <rect x={0} y={0} width={200} height={260} fill={skin} />
          <path d={GARMENT} fill={accent} />
          <path d={NECK_LINE} stroke={C.gold2} strokeWidth={4} fill="none" />
        </g>
        {hairTop(hair.color)}
        {hair.beard && <path d={hair.beard} fill={hair.color} />}
        {cap && (
          <g>
            <path d={CAP_DOME} fill={cap} />
            <path d={CAP_VISOR} fill={cap} />
          </g>
        )}
        <rect x={-20} y={-20} width={240} height={300} fill={SHADE} mask={`url(#fjm${uid})`} />
        <path d={cap ? 'M58 62 Q63 47 80 41' : 'M58 74 Q61 57 78 51'} stroke={SHINE} strokeWidth={5} strokeLinecap="round" fill="none" />
        {/* broche: a ponta do traço dourado */}
        <circle cx={PIN.x} cy={PIN.y} r={5.5} fill={C.gold} />
        <circle cx={PIN.x - 1.6} cy={PIN.y - 1.6} r={2} fill={C.goldLight} />
        {/* rosto da família */}
        <g stroke={hair.brow} strokeWidth={4.6} strokeLinecap="round" fill="none">
          {brow(-1)}
          {brow(1)}
        </g>
        <g fill={C.deep}>
          <Eye x={100 - ex} y={ey} mood={mood} blink={blink} />
          <Eye x={100 + ex} y={ey} mood={mood} blink={blink} />
        </g>
        <path d="M101.5 98 C106 103 107.5 107 103 109.5 C101 110.5 98.5 109.6 98.4 108" fill={SHADE} />
        {mouth}
        {hair.glasses && (
          <g stroke={C.goldDeep} strokeWidth={3} fill="none">
            <circle cx={100 - ex} cy={ey} r={12.5} />
            <circle cx={100 + ex} cy={ey} r={12.5} />
            <path d={`M${100 - ex + 12.5} ${ey - 1} Q100 ${ey - 5} ${100 + ex - 12.5} ${ey - 1}`} />
          </g>
        )}
        {sweat && (
          <path
            d={`M150 ${74 + drop} q9 13 0 20 q-9 -7 0 -20z`}
            fill={dimColor('bonds')}
            opacity={1 - drop / 30}
          />
        )}
      </g>
    </svg>
  );
};

/** Fundo: o traço dourado do Topo Iris virado luz — uma faixa larga e
 *  desfocada que sobe da esquerda pra direita atrás das cabeças, o mesmo
 *  gesto da gola que cada pessoa veste. */
const Backdrop: React.FC<{ t: number; width: number; height: number; accent: string }> = ({ t, width: w, height: h, accent }) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const draw = Math.min(1, Math.max(0, t / 30));
  const X = (u: number) => w * (-0.05 + 1.1 * u);
  const Y = (v: number) => h * (0.08 + 0.55 * v);
  const d = `M${X(0)} ${Y(1)} Q${X(0.301)} ${Y(0.712)} ${X(0.5)} ${Y(0.5)} Q${X(0.699)} ${Y(0.288)} ${X(1)} ${Y(0)}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      <defs>
        <filter id={`fjf${uid}`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation={h * 0.06} />
        </filter>
      </defs>
      <g filter={`url(#fjf${uid})`}>
        <path d={d} stroke={accent} strokeWidth={h * 0.32} strokeLinecap="round" fill="none" opacity={0.1} />
        <path
          d={d}
          stroke={C.gold}
          strokeWidth={h * 0.1}
          strokeLinecap="round"
          fill="none"
          opacity={0.13}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
        />
      </g>
    </svg>
  );
};

export const option: IdentityOption = {
  Backdrop,
  id: 'feijao',
  name: 'Família Feijão',
  pitch: 'Um contorno só — cabeça e corpo no mesmo feijão —, um penteado que é a assinatura de cada pessoa e a gola em diagonal com friso dourado, o traço do logo vestido.',
  Pessoa,
};
