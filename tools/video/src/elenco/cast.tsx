// Elenco Perceva — personagens e objetos-padrão dos vídeos das ideias.
//
// Regras do estilo (valem pra toda peça nova):
//  - formas chapadas e redondas, SEM contorno; volume = uma sombra mais escura
//    num lado só (luz vem de cima-esquerda) + um brilho pequeno.
//  - cores só da paleta do app (theme.ts); a cor da dimensão da ideia entra
//    como "cor de destaque" (prop `accent`), o resto é neutro.
//  - cada peça é um componente SVG com partes animáveis (piscar, respirar,
//    ponteiro girando) controladas por `t` = frame, pra reaproveitar em
//    qualquer cena sem redesenhar.
import React from 'react';
import { C, dimColor } from '../theme';

type Base = { t?: number; size?: number; accent?: string };

const shade = 'rgba(10,14,38,0.28)';
const shine = 'rgba(255,255,255,0.22)';

/** Olhos que piscam a cada ~3 s, com deslocamento por personagem. */
const Eyes: React.FC<{ t: number; x: number; y: number; gap: number; seed?: number }> = ({ t, x, y, gap, seed = 0 }) => {
  const k = (t + seed * 37) % 96;
  const ry = k < 4 ? 1.2 : 7;
  return (
    <g fill={C.deep}>
      <ellipse cx={x - gap / 2} cy={y} rx={6} ry={ry} />
      <ellipse cx={x + gap / 2} cy={y} rx={6} ry={ry} />
    </g>
  );
};

/** Pessoa — cabeça redonda, corpo em cápsula. `mood` muda a boca. */
export type Arms = 'none' | 'down' | 'up' | 'out';
export const Pessoa: React.FC<
  Base & { skin?: string; mood?: 'ok' | 'feliz' | 'cansado'; seed?: number; arms?: Arms; still?: boolean; cap?: string; sweat?: boolean }
> = ({ t = 0, size = 260, accent = C.violet, skin = '#F2C9A0', mood = 'ok', seed = 0, arms = 'none', still = false, cap, sweat = false }) => {
  const bob = still ? 0 : Math.sin((t + seed * 11) / 14) * 3;
  const wave = arms === 'up' ? Math.sin((t + seed * 7) / 5) * 10 : 0;
  const [la, ra] = arms === 'down' ? [14, -14] : arms === 'up' ? [150 + wave, -150 - wave] : arms === 'out' ? [14, -78] : [0, 0];
  const arm = (side: 'l' | 'r', a: number) => {
    const px = side === 'l' ? 58 : 142;
    return (
      <g transform={`rotate(${a} ${px} 158)`}>
        <rect x={px - 11} y={150} width={22} height={64} rx={11} fill={accent} />
        <rect x={px - 11} y={150} width={22} height={64} rx={11} fill={shade} opacity={side === 'r' ? 1 : 0.4} />
        <circle cx={px} cy={210} r={12} fill={skin} />
      </g>
    );
  };
  const mouth =
    mood === 'feliz' ? 'M88 104 Q100 118 112 104' : mood === 'cansado' ? 'M90 110 Q100 104 110 110' : 'M90 107 L110 107';
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 200 260">
      <ellipse cx={100} cy={252} rx={58} ry={7} fill="rgba(0,0,0,0.25)" />
      <g transform={`translate(0 ${bob})`}>
        {arms !== 'none' && arm('l', la)}
        {/* corpo */}
        <rect x={52} y={140} width={96} height={110} rx={46} fill={accent} />
        <path d="M100 140 h2 a46 46 0 0 1 46 46 v18 a46 46 0 0 1 -46 46 z" fill={shade} />
        {arms !== 'none' && arm('r', ra)}
        {/* cabeça */}
        <circle cx={100} cy={92} r={52} fill={skin} />
        <path d="M100 40 a52 52 0 0 1 0 104 a40 52 0 0 0 0 -104z" fill={shade} opacity={0.5} />
        <circle cx={80} cy={66} r={9} fill={shine} />
        <Eyes t={t} x={100} y={90} gap={34} seed={seed} />
        <path d={mouth} stroke={C.deep} strokeWidth={5} strokeLinecap="round" fill="none" />
        {mood === 'cansado' && <path d="M78 80 h14 M108 80 h14" stroke={C.deep} strokeWidth={4} strokeLinecap="round" />}
        {cap && (
          <g>
            <path d="M47 84 a53 53 0 0 1 106 0 q-53 -10 -106 0z" fill={cap} />
            <path d="M100 31 a53 53 0 0 1 53 53 q-26 -5 -53 -6z" fill={shade} />
            <rect x={120} y={74} width={58} height={12} rx={6} fill={cap} />
          </g>
        )}
        {sweat && (
          <path
            d={`M152 ${58 + ((t + seed * 9) % 30)} q8 12 0 18 q-8 -6 0 -18z`}
            fill={dimColor('bonds')}
            opacity={1 - ((t + seed * 9) % 30) / 30}
          />
        )}
      </g>
    </svg>
  );
};

/** Casa — telhado na cor de destaque, janela que acende. */
export const Casa: React.FC<Base & { lit?: number }> = ({ size = 260, accent = C.gold, lit = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    <ellipse cx={100} cy={188} rx={80} ry={7} fill="rgba(0,0,0,0.25)" />
    <rect x={38} y={88} width={124} height={96} rx={10} fill={C.surface3} />
    <rect x={100} y={88} width={62} height={96} rx={10} fill={shade} />
    <path d="M24 96 L100 30 L176 96 Q180 102 172 104 L28 104 Q20 102 24 96z" fill={accent} />
    <path d="M100 30 L176 96 Q180 102 172 104 L100 104z" fill={shade} />
    <rect x={56} y={118} width={34} height={30} rx={6} fill={C.gold2} opacity={0.25 + 0.75 * lit} />
    <rect x={112} y={130} width={32} height={54} rx={8} fill={C.surface} />
    <circle cx={138} cy={158} r={3} fill={C.gold2} />
  </svg>
);

/** Relógio — ponteiros girando com `t`; `speed` acelera (pressa). */
export const Relogio: React.FC<Base & { speed?: number }> = ({ t = 0, size = 220, accent = C.violet2, speed = 1 }) => {
  const m = (t * 6 * speed) % 360;
  const h = (t * 0.5 * speed) % 360;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <circle cx={100} cy={100} r={84} fill={accent} />
      <path d="M100 16 a84 84 0 0 1 0 168 a70 84 0 0 0 0 -168z" fill={shade} />
      <circle cx={100} cy={100} r={66} fill={C.hi} />
      {[0, 90, 180, 270].map((a) => (
        <rect key={a} x={97} y={40} width={6} height={14} rx={3} fill={C.faint} transform={`rotate(${a} 100 100)`} />
      ))}
      <rect x={96} y={62} width={8} height={42} rx={4} fill={C.deep} transform={`rotate(${h} 100 100)`} />
      <rect x={97.5} y={46} width={5} height={58} rx={2.5} fill={accent} transform={`rotate(${m} 100 100)`} />
      <circle cx={100} cy={100} r={8} fill={C.deep} />
    </svg>
  );
};

/** Balão de pensamento — bolinhas que sobem em sequência, conteúdo dentro. */
export const Pensamento: React.FC<Base & { children?: React.ReactNode }> = ({ t = 0, size = 300, children }) => {
  const pop = (d: number) => Math.min(1, Math.max(0, (t - d) / 8));
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 250 200">
      <circle cx={30} cy={186} r={8 * pop(0)} fill={C.surface3} />
      <circle cx={52} cy={164} r={13 * pop(6)} fill={C.surface3} />
      <g opacity={pop(12)} transform={`translate(140 84) scale(${0.6 + 0.4 * pop(12)}) translate(-140 -84)`}>
        {[
          [100, 70, 44],
          [150, 56, 50],
          [196, 80, 40],
          [170, 118, 42],
          [116, 116, 40],
        ].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill={C.surface3} />
        ))}
        <rect x={86} y={64} width={124} height={60} rx={30} fill={C.surface3} />
        <g transform="translate(113 53)">{children}</g>
      </g>
    </svg>
  );
};

/** Moeda — gira no próprio eixo (achatamento horizontal). */
export const Moeda: React.FC<Base> = ({ t = 0, size = 160, accent = C.gold }) => {
  const sx = Math.abs(Math.cos(t / 10)) * 0.85 + 0.15;
  return (
    <svg width={size} height={size} viewBox="0 0 160 160">
      <g transform={`translate(80 80) scale(${sx} 1) translate(-80 -80)`}>
        <circle cx={80} cy={80} r={64} fill={C.goldDeep} />
        <circle cx={76} cy={76} r={60} fill={accent} />
        <circle cx={76} cy={76} r={42} fill="none" stroke={C.goldDeep} strokeWidth={6} opacity={0.5} />
        <circle cx={56} cy={52} r={8} fill={shine} />
      </g>
    </svg>
  );
};

/** Celular — tela que acende com a cor de destaque. */
export const Celular: React.FC<Base & { glow?: number }> = ({ size = 200, accent = C.violet, glow = 1 }) => (
  <svg width={size * 0.6} height={size} viewBox="0 0 120 200">
    <rect x={10} y={6} width={100} height={188} rx={18} fill={C.surface3} />
    <rect x={60} y={6} width={50} height={188} rx={18} fill={shade} />
    <rect x={20} y={22} width={80} height={150} rx={8} fill={accent} opacity={0.3 + 0.7 * glow} />
    <rect x={30} y={40} width={60} height={10} rx={5} fill={C.hi} opacity={0.8 * glow} />
    <rect x={30} y={58} width={40} height={10} rx={5} fill={C.hi} opacity={0.5 * glow} />
    <rect x={48} y={180} width={24} height={5} rx={2.5} fill={C.faint} />
  </svg>
);

/** Sacola de compras — o "objeto" quando a ideia fala em comprar coisas. */
export const Sacola: React.FC<Base> = ({ size = 200, accent = C.surface3 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    <ellipse cx={100} cy={190} rx={66} ry={6} fill="rgba(0,0,0,0.25)" />
    <path d="M70 70 a30 34 0 0 1 60 0" stroke={C.mid} strokeWidth={9} fill="none" strokeLinecap="round" />
    <path d="M40 66 h120 l12 116 q1 8 -8 8 h-128 q-9 0 -8 -8z" fill={accent} />
    <path d="M100 66 h60 l12 116 q1 8 -8 8 h-64z" fill={shade} />
    <circle cx={70} cy={84} r={6} fill={C.deep} />
    <circle cx={130} cy={84} r={6} fill={C.deep} />
  </svg>
);

/** Vassoura — a tarefa doméstica genérica. */
export const Vassoura: React.FC<Base & { tilt?: number }> = ({ size = 220, accent = C.goldDeep, tilt = -12 }) => (
  <svg width={size * 0.6} height={size} viewBox="0 0 120 200">
    <g transform={`rotate(${tilt} 60 100)`}>
      <rect x={55} y={6} width={10} height={130} rx={5} fill="#B98A5E" />
      <rect x={60} y={6} width={5} height={130} rx={2.5} fill={shade} />
      <rect x={42} y={128} width={36} height={14} rx={5} fill={C.surface3} />
      <path d="M34 140 h52 l14 52 q1 5 -5 5 h-70 q-6 0 -5 -5z" fill={accent} />
      <path d="M60 140 h26 l14 52 q1 5 -5 5 h-35z" fill={shade} />
      {[46, 58, 70, 82].map((x) => (
        <path key={x} d={`M${x} 150 l${(x - 60) * 0.2} 40`} stroke={shade} strokeWidth={3} strokeLinecap="round" />
      ))}
    </g>
  </svg>
);

/** Cesto de roupa — roupa por lavar/dobrar. */
export const Cesto: React.FC<Base> = ({ size = 220, accent = C.surface3 }) => (
  <svg width={size} height={size * 0.85} viewBox="0 0 200 170">
    <ellipse cx={100} cy={162} rx={70} ry={6} fill="rgba(0,0,0,0.25)" />
    <circle cx={74} cy={58} r={30} fill={dimColor('bonds')} />
    <circle cx={116} cy={52} r={34} fill={dimColor('health')} />
    <circle cx={140} cy={66} r={22} fill={C.violet2} />
    <path d="M36 66 h128 l-14 90 q-1 6 -7 6 h-86 q-6 0 -7 -6z" fill={accent} />
    <path d="M100 66 h64 l-14 90 q-1 6 -7 6 h-43z" fill={shade} />
    {[92, 116, 140].map((y) => (
      <rect key={y} x={46} y={y} width={108} height={5} rx={2.5} fill={shade} />
    ))}
    <rect x={30} y={60} width={140} height={14} rx={7} fill={C.surface2} />
  </svg>
);

/** Louça — pilha de pratos com uma esponja. */
export const Louca: React.FC<Base> = ({ size = 200 }) => (
  <svg width={size} height={size * 0.8} viewBox="0 0 200 160">
    <ellipse cx={100} cy={152} rx={76} ry={6} fill="rgba(0,0,0,0.25)" />
    {[0, 1, 2, 3, 4].map((i) => (
      <g key={i} transform={`translate(${i % 2 ? 6 : -4} ${-i * 22})`}>
        <ellipse cx={100} cy={136} rx={70} ry={14} fill={C.text} />
        <ellipse cx={100} cy={132} rx={52} ry={8} fill={C.mid} />
      </g>
    ))}
    <rect x={142} y={8} width={44} height={26} rx={8} fill={C.gold} transform="rotate(18 164 21)" />
    <rect x={142} y={24} width={44} height={10} rx={4} fill={C.xp} transform="rotate(18 164 21)" />
  </svg>
);


/** Sofá — desenha o encosto, depois quem está sentado (children), depois o assento na frente. */
export const Sofa: React.FC<{ width?: number; accent?: string; children?: React.ReactNode; seatTop?: number }> = ({
  width = 620,
  accent = dimColor('craft'),
  children,
  seatTop = 0,
}) => {
  const h = width * 0.5;
  return (
    <div style={{ position: 'relative', width, height: h }}>
      <svg style={{ position: 'absolute', inset: 0 }} width={width} height={h} viewBox="0 0 300 150">
        <rect x={30} y={20} width={240} height={80} rx={26} fill={accent} />
        <rect x={150} y={20} width={120} height={80} rx={26} fill={shade} />
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, top: seatTop }}>{children}</div>
      <svg style={{ position: 'absolute', inset: 0 }} width={width} height={h} viewBox="0 0 300 150">
        <ellipse cx={150} cy={146} rx={140} ry={5} fill="rgba(0,0,0,0.3)" />
        <rect x={20} y={84} width={260} height={50} rx={18} fill={accent} />
        <rect x={150} y={84} width={130} height={50} rx={18} fill={shade} />
        <rect x={6} y={60} width={44} height={78} rx={20} fill={accent} />
        <rect x={250} y={60} width={44} height={78} rx={20} fill={accent} />
        <rect x={250} y={60} width={44} height={78} rx={20} fill={shade} />
        <rect x={36} y={134} width={10} height={14} rx={3} fill={C.surface} />
        <rect x={254} y={134} width={10} height={14} rx={3} fill={C.surface} />
      </svg>
    </div>
  );
};

/** Livro aberto. */
export const Livro: React.FC<Base> = ({ size = 140, accent = dimColor('mind') }) => (
  <svg width={size} height={size * 0.7} viewBox="0 0 140 98">
    <path d="M70 18 q-30 -14 -62 -6 v76 q32 -8 62 6z" fill={C.hi} />
    <path d="M70 18 q30 -14 62 -6 v76 q-32 -8 -62 6z" fill={C.text} />
    <path d="M70 94 q-32 -14 -66 -4 v-6 q34 -10 66 4 q32 -14 66 -4 v6 q-34 -10 -66 4z" fill={accent} />
    {[30, 42, 54].map((y) => (
      <g key={y}>
        <rect x={20} y={y} width={38} height={4} rx={2} fill={C.faint} opacity={0.5} />
        <rect x={82} y={y} width={38} height={4} rx={2} fill={C.faint} opacity={0.5} />
      </g>
    ))}
  </svg>
);

/** Semana — 7 dias; cada dia vai enchendo (fill 0..1) com blocos de tarefa. */
export const Semana: React.FC<{ width?: number; fill?: number; accent?: string }> = ({ width = 860, fill = 0, accent = dimColor('health') }) => {
  const days = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
  const per = (i: number) => Math.max(0, Math.min(1, fill * 7 - i * 0.6));
  return (
    <svg width={width} height={width * 0.42} viewBox="0 0 700 294">
      {days.map((d, i) => {
        const x = 10 + i * 98;
        const f = per(i);
        const blocks = Math.round(f * 4);
        return (
          <g key={i}>
            <rect x={x} y={10} width={84} height={274} rx={18} fill={C.surface2} />
            <rect x={x} y={10} width={84} height={48} rx={18} fill={C.surface3} />
            <text x={x + 42} y={44} textAnchor="middle" fontFamily="Manrope" fontWeight={800} fontSize={26} fill={C.mid}>
              {d}
            </text>
            {Array.from({ length: blocks }, (_, b) => (
              <rect key={b} x={x + 10} y={240 - b * 52} width={64} height={42} rx={10} fill={b % 2 ? C.violet2 : accent} opacity={0.9} />
            ))}
          </g>
        );
      })}
    </svg>
  );
};

/** Brilhos — estrelinhas de 4 pontas que piscam em volta de algo bom. */
export const Brilho: React.FC<Base & { on?: number }> = ({ t = 0, size = 300, accent = C.gold2, on = 1 }) => {
  const pts = [
    [40, 60, 0],
    [250, 40, 9],
    [270, 200, 17],
    [30, 230, 25],
    [150, 18, 33],
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 300 300" style={{ pointerEvents: 'none' }}>
      {pts.map(([x, y, d], i) => {
        const k = ((t + d) % 40) / 40;
        const sc = on * Math.sin(k * Math.PI);
        return (
          <path
            key={i}
            transform={`translate(${x} ${y}) scale(${sc})`}
            d="M0 -18 Q3 -3 18 0 Q3 3 0 18 Q-3 3 -18 0 Q-3 -3 0 -18z"
            fill={accent}
          />
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------- v1 (molde)
// Peças que o molde genérico pede com frequência no catálogo: sono, trabalho,
// vínculos, anotação, ideia. Mesmo estilo: chapado, sombra num lado só.

/** Cama — cabeceira na cor de destaque, travesseiro e coberta. */
export const Cama: React.FC<Base> = ({ size = 320, accent = dimColor('health') }) => (
  <svg width={size} height={size * 0.6} viewBox="0 0 300 180">
    <ellipse cx={150} cy={172} rx={136} ry={6} fill="rgba(0,0,0,0.28)" />
    <rect x={14} y={30} width={40} height={140} rx={14} fill={accent} />
    <rect x={14} y={30} width={40} height={140} rx={14} fill={shade} opacity={0.5} />
    <rect x={40} y={96} width={246} height={56} rx={16} fill={C.surface3} />
    <rect x={58} y={70} width={70} height={36} rx={16} fill={C.hi} />
    <rect x={120} y={84} width={166} height={52} rx={18} fill={accent} />
    <rect x={206} y={84} width={80} height={52} rx={18} fill={shade} />
    <rect x={48} y={150} width={12} height={20} rx={4} fill={C.surface2} />
    <rect x={270} y={150} width={12} height={20} rx={4} fill={C.surface2} />
  </svg>
);

/** Computador — notebook aberto, tela que acende (`glow` 0..1). */
export const Computador: React.FC<Base & { glow?: number }> = ({ size = 280, accent = C.violet, glow = 1 }) => (
  <svg width={size} height={size * 0.72} viewBox="0 0 260 188">
    <ellipse cx={130} cy={180} rx={120} ry={6} fill="rgba(0,0,0,0.28)" />
    <rect x={34} y={10} width={192} height={128} rx={14} fill={C.surface3} />
    <rect x={46} y={22} width={168} height={104} rx={8} fill={accent} opacity={0.35 + 0.65 * glow} />
    <rect x={60} y={40} width={90} height={10} rx={5} fill={C.hi} opacity={0.7 * glow} />
    <rect x={60} y={60} width={120} height={10} rx={5} fill={C.hi} opacity={0.45 * glow} />
    <rect x={60} y={80} width={70} height={10} rx={5} fill={C.hi} opacity={0.45 * glow} />
    <path d="M10 146 h240 l-14 26 h-212z" fill={C.surface2} />
    <path d="M130 146 h120 l-14 26 h-106z" fill={shade} />
    <rect x={104} y={150} width={52} height={8} rx={4} fill={C.surface3} />
  </svg>
);

/** Coração — bate devagar (`beat` liga a pulsação). */
export const Coracao: React.FC<Base & { beat?: boolean }> = ({ t = 0, size = 200, accent = dimColor('health'), beat = true }) => {
  const k = beat ? 1 + 0.06 * Math.max(0, Math.sin(t / 5)) : 1;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <g transform={`translate(100 104) scale(${k}) translate(-100 -104)`}>
        <path d="M100 176 C40 132 18 100 18 70 a42 42 0 0 1 82 -14 a42 42 0 0 1 82 14 c0 30 -22 62 -82 106z" fill={accent} />
        <path d="M100 56 a42 42 0 0 1 82 14 c0 30 -22 62 -82 106z" fill={shade} />
        <circle cx={58} cy={64} r={12} fill={shine} />
      </g>
    </svg>
  );
};

/** Caderno — páginas com linhas que vão sendo escritas (`write` 0..1). */
export const Caderno: React.FC<Base & { write?: number }> = ({ size = 220, accent = dimColor('craft'), write = 1 }) => {
  const rows = [44, 70, 96, 122, 148];
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 200 220">
      <ellipse cx={100} cy={212} rx={80} ry={6} fill="rgba(0,0,0,0.28)" />
      <rect x={30} y={14} width={150} height={190} rx={14} fill={accent} />
      <rect x={42} y={20} width={132} height={178} rx={10} fill={C.hi} />
      <rect x={108} y={20} width={66} height={178} rx={10} fill="rgba(10,14,38,0.08)" />
      {[34, 70, 106, 142, 178].map((y) => (
        <rect key={y} x={22} y={y} width={22} height={10} rx={5} fill={C.surface3} />
      ))}
      {rows.map((y, i) => {
        const w = Math.max(0, Math.min(1, write * rows.length - i)) * (i % 2 ? 84 : 104);
        return <rect key={y} x={58} y={y} width={w} height={8} rx={4} fill={C.violetDeep} opacity={0.7} />;
      })}
    </svg>
  );
};

/** Lâmpada — a ideia que acende (`on` 0..1). */
export const Lampada: React.FC<Base & { on?: number }> = ({ size = 200, accent = C.gold, on = 1 }) => (
  <svg width={size} height={size * 1.2} viewBox="0 0 200 240" style={{ overflow: 'visible' }}>
    {[0, 45, 90, 135, 180].map((a) => (
      <rect
        key={a}
        x={96}
        y={-6}
        width={8}
        height={26}
        rx={4}
        fill={accent}
        opacity={on}
        transform={`rotate(${a - 90} 100 92)`}
      />
    ))}
    <circle cx={100} cy={92} r={62} fill={on > 0.5 ? accent : C.surface3} />
    <path d="M100 30 a62 62 0 0 1 0 124 a46 62 0 0 0 0 -124z" fill={shade} />
    <circle cx={76} cy={70} r={12} fill={shine} />
    <rect x={70} y={150} width={60} height={22} rx={8} fill={C.surface3} />
    <rect x={76} y={176} width={48} height={16} rx={8} fill={C.surface2} />
    <rect x={86} y={196} width={28} height={12} rx={6} fill={C.surface3} />
  </svg>
);
