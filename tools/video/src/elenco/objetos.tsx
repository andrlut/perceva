// Elenco Perceva — objetos v2 (trabalho, casa, rotina).
//
// Mesmas regras do cast.tsx: formas chapadas e redondas, SEM contorno,
// volume = sombra num lado só (luz de cima-esquerda) + um brilho pequeno,
// cores da paleta (theme.ts), a cor da dimensão entra por `accent`, e o que
// anima depende de `t` (frame) ou de `progress` (0..1, a ação da cena).
// Nenhum texto nem número no desenho.
//
// Mora num arquivo próprio pra que a troca da Pessoa (cast.tsx) não esbarre aqui.
import React from 'react';
import { C, dimColor } from '../theme';

type Base = { t?: number; size?: number; accent?: string };

const shade = 'rgba(10,14,38,0.28)';
const shine = 'rgba(255,255,255,0.22)';
const ground = 'rgba(0,0,0,0.25)';
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Quadro (cavalete com folha) — a aula, a explicação. `progress` desenha o esquema. */
export const Quadro: React.FC<Base & { progress?: number }> = ({ size = 260, accent = C.gold, progress = 1 }) => {
  const seg = (i: number, n = 4) => clamp01(progress * n - i);
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 200 230">
      <ellipse cx={100} cy={224} rx={78} ry={6} fill={ground} />
      {/* cavalete */}
      <rect x={40} y={118} width={12} height={106} rx={6} fill="#B98A5E" transform="rotate(12 46 118)" />
      <rect x={148} y={118} width={12} height={106} rx={6} fill="#B98A5E" transform="rotate(-12 154 118)" />
      <rect x={148} y={118} width={6} height={106} rx={3} fill={shade} transform="rotate(-12 154 118)" />
      <rect x={94} y={128} width={12} height={92} rx={6} fill="#8E6A48" />
      {/* quadro */}
      <rect x={12} y={12} width={176} height={130} rx={14} fill={C.surface3} />
      <rect x={100} y={12} width={88} height={130} rx={14} fill={shade} />
      <rect x={21} y={21} width={158} height={112} rx={8} fill={C.hi} />
      <rect x={100} y={21} width={79} height={112} rx={8} fill="rgba(10,14,38,0.07)" />
      <rect x={78} y={4} width={44} height={14} rx={6} fill={C.surface2} />
      <rect x={28} y={140} width={144} height={10} rx={5} fill={C.surface2} />
      <rect x={120} y={134} width={30} height={8} rx={4} fill={accent} />
      {/* o esquema: três caixas ligadas por setas, e um sublinhado */}
      <rect x={34} y={40} width={36} height={26} rx={7} fill={accent} opacity={seg(0)} />
      <rect x={82} y={78} width={36} height={26} rx={7} fill={C.violet2} opacity={seg(1)} />
      <rect x={130} y={40} width={36} height={26} rx={7} fill={dimColor('bonds')} opacity={seg(2)} />
      <path
        d="M70 58 L82 80 M118 82 L130 62"
        stroke={C.deep}
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
        opacity={0.7 * seg(1.5)}
      />
      <path
        d="M36 118 Q100 108 164 118"
        stroke={accent}
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - seg(3)}
      />
    </svg>
  );
};

/** Caneca com vapor — café, chá, a manhã em casa. */
export const Caneca: React.FC<Base & { steam?: boolean }> = ({ t = 0, size = 180, accent = C.violet2, steam = true }) => (
  <svg width={size} height={size * 1.1} viewBox="0 0 180 198" style={{ overflow: 'visible' }}>
    <ellipse cx={82} cy={190} rx={62} ry={6} fill={ground} />
    {steam
      ? [0, 1, 2].map((i) => {
          const k = ((t + i * 15) % 45) / 45;
          return (
            <path
              key={i}
              d={`M${56 + i * 26} ${66 - k * 44} q-11 -12 0 -24 q11 -12 0 -24`}
              stroke={C.hi}
              strokeWidth={7}
              strokeLinecap="round"
              fill="none"
              opacity={Math.sin(k * Math.PI) * 0.6}
            />
          );
        })
      : null}
    {/* alça */}
    <path d="M136 102 a30 30 0 0 1 0 60" stroke={accent} strokeWidth={17} fill="none" strokeLinecap="round" />
    <path d="M136 102 a30 30 0 0 1 0 60" stroke={shade} strokeWidth={17} fill="none" strokeLinecap="round" />
    {/* corpo */}
    <rect x={22} y={78} width={120} height={108} rx={22} fill={accent} />
    <path d="M82 78 h38 a22 22 0 0 1 22 22 v64 a22 22 0 0 1 -22 22 h-38z" fill={shade} />
    <ellipse cx={82} cy={82} rx={60} ry={11} fill={C.surface} />
    <ellipse cx={82} cy={85} rx={50} ry={7} fill={C.deep} />
    <rect x={34} y={100} width={11} height={62} rx={5.5} fill={shine} />
  </svg>
);

/** Planta no vaso — folhas que balançam devagar. Casa, escritório, cuidado. */
export const Planta: React.FC<Base> = ({ t = 0, size = 200, accent = C.surface3 }) => {
  const leaf = dimColor('craft');
  const sway = (k: number) => Math.sin(t / 28 + k) * 3.5;
  const leaves: [number, number, number][] = [
    [-52, 62, 0],
    [-24, 78, 1.3],
    [4, 84, 2.1],
    [30, 76, 0.7],
    [56, 60, 1.8],
  ];
  return (
    <svg width={size * 0.8} height={size} viewBox="0 0 160 200" style={{ overflow: 'visible' }}>
      <ellipse cx={80} cy={194} rx={50} ry={6} fill={ground} />
      {leaves.map(([a, len, k], i) => (
        <g key={i} transform={`rotate(${a + sway(k)} 80 128)`}>
          <ellipse cx={80} cy={128 - len / 2 - 4} rx={15} ry={len / 2 + 4} fill={leaf} />
          <path d={`M80 ${128 - len - 8} a15 ${len / 2 + 4} 0 0 1 0 ${len + 8}z`} fill={shade} />
          <rect x={78.5} y={128 - len} width={3} height={len - 6} rx={1.5} fill={shade} />
        </g>
      ))}
      {/* vaso */}
      <path d="M38 122 h84 l-10 66 q-1 6 -7 6 h-50 q-6 0 -7 -6z" fill={accent} />
      <path d="M80 122 h42 l-10 66 q-1 6 -7 6 h-25z" fill={shade} />
      <rect x={32} y={116} width={96} height={16} rx={8} fill={accent} />
      <rect x={80} y={116} width={48} height={16} rx={8} fill={shade} />
      <circle cx={52} cy={146} r={5} fill={shine} />
    </svg>
  );
};

/** Caneta (marcador) — escrever, marcar, redesenhar. `progress` 0..1 = risco saindo da ponta. */
export const Caneta: React.FC<Base & { progress?: number }> = ({ size = 200, accent = C.gold, progress = 0 }) => (
  <svg width={size * 0.5} height={size} viewBox="0 0 100 200" style={{ overflow: 'visible' }}>
    {progress > 0 ? (
      <path
        d="M30 196 q30 -6 60 4"
        stroke={accent}
        strokeWidth={8}
        strokeLinecap="round"
        fill="none"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - clamp01(progress)}
      />
    ) : null}
    <g transform="rotate(18 50 100)">
      <rect x={34} y={40} width={34} height={128} rx={15} fill={accent} />
      <rect x={51} y={40} width={17} height={128} rx={8} fill={shade} />
      <path d="M36 160 h30 l-8 26 q-7 6 -14 0z" fill={C.surface3} />
      <path d="M45 182 h12 l-4 12 q-2 3 -4 0z" fill={C.deep} />
      <rect x={32} y={8} width={38} height={58} rx={16} fill={C.surface3} />
      <rect x={51} y={8} width={19} height={58} rx={9} fill={shade} />
      <rect x={60} y={16} width={9} height={52} rx={4.5} fill={C.surface2} />
      <rect x={40} y={52} width={8} height={100} rx={4} fill={shine} />
    </g>
  </svg>
);

/** Agenda aberta com o dia em blocos (claros = o que rende, frios = o que pesa). `progress` vai preenchendo. */
export const Agenda: React.FC<Base & { progress?: number }> = ({ size = 220, accent = dimColor('craft'), progress = 1 }) => {
  const rows: { h: number; boost: boolean }[] = [
    { h: 26, boost: true },
    { h: 38, boost: false },
    { h: 24, boost: false },
    { h: 32, boost: true },
    { h: 24, boost: false },
  ];
  let y = 62;
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 200 220">
      <ellipse cx={100} cy={212} rx={80} ry={6} fill={ground} />
      <rect x={22} y={18} width={160} height={188} rx={16} fill={accent} />
      <rect x={102} y={18} width={80} height={188} rx={16} fill={shade} />
      <rect x={32} y={30} width={142} height={168} rx={10} fill={C.hi} />
      <rect x={103} y={30} width={71} height={168} rx={10} fill="rgba(10,14,38,0.06)" />
      {[46, 72, 98, 124, 150].map((x) => (
        <rect key={x} x={x} y={12} width={10} height={26} rx={5} fill={C.surface3} />
      ))}
      {/* sol no topo da página: é o dia */}
      <circle cx={156} cy={48} r={8} fill={C.gold} />
      <rect x={46} y={56} width={4} height={130} rx={2} fill={C.mid} opacity={0.35} />
      {rows.map((r, i) => {
        const on = clamp01(progress * rows.length - i);
        const top = y;
        y += r.h + 6;
        return (
          <g key={i} opacity={on}>
            <circle cx={48} cy={top + r.h / 2} r={4.5} fill={r.boost ? C.gold : C.mid} />
            <rect x={58} y={top} width={(r.boost ? 104 : 92) * (0.6 + 0.4 * on)} height={r.h} rx={7} fill={r.boost ? C.gold : C.mid} opacity={r.boost ? 1 : 0.45} />
          </g>
        );
      })}
    </svg>
  );
};

/** Monitor de mesa — tela que acende (`progress`) e cursor piscando. */
export const Monitor: React.FC<Base & { progress?: number }> = ({ t = 0, size = 260, accent = C.violet, progress = 1 }) => {
  const glow = 0.35 + 0.65 * progress;
  const blink = Math.floor(t / 15) % 2 === 0;
  return (
    <svg width={size} height={size * 0.9} viewBox="0 0 240 216">
      <ellipse cx={120} cy={208} rx={80} ry={6} fill={ground} />
      <rect x={104} y={150} width={32} height={44} rx={6} fill={C.surface2} />
      <rect x={120} y={150} width={16} height={44} rx={6} fill={shade} />
      <rect x={66} y={188} width={108} height={16} rx={8} fill={C.surface3} />
      <rect x={10} y={8} width={220} height={150} rx={16} fill={C.surface3} />
      <rect x={120} y={8} width={110} height={150} rx={16} fill={shade} />
      <rect x={22} y={20} width={196} height={120} rx={8} fill={accent} opacity={glow} />
      <rect x={38} y={38} width={96} height={12} rx={6} fill={C.hi} opacity={0.8 * progress} />
      <rect x={38} y={60} width={150} height={10} rx={5} fill={C.hi} opacity={0.5 * progress} />
      <rect x={38} y={80} width={120} height={10} rx={5} fill={C.hi} opacity={0.5 * progress} />
      <rect x={38} y={100} width={70} height={10} rx={5} fill={C.hi} opacity={0.5 * progress} />
      <rect x={114} y={98} width={5} height={16} rx={2} fill={C.hi} opacity={blink ? progress : 0} />
      <circle cx={120} cy={148} r={3} fill={C.faint} />
    </svg>
  );
};

/** Papelada — pilha de folhas presas: o trabalho que pesa, burocracia, pendência. */
export const Papelada: React.FC<Base> = ({ size = 220, accent = C.surface3 }) => {
  const sheets = [
    { r: -7, dx: -6, fill: C.text },
    { r: 5, dx: 8, fill: C.hi },
    { r: -2, dx: 0, fill: C.text },
    { r: 3, dx: 2, fill: C.hi },
  ];
  return (
    <svg width={size} height={size * 0.95} viewBox="0 0 200 190">
      <ellipse cx={100} cy={182} rx={82} ry={6} fill={ground} />
      {sheets.map((s, i) => (
        <g key={i} transform={`translate(${s.dx} ${-i * 14}) rotate(${s.r} 100 120)`}>
          <rect x={34} y={64} width={132} height={110} rx={8} fill={s.fill} />
          <rect x={100} y={64} width={66} height={110} rx={8} fill="rgba(10,14,38,0.08)" />
          {i === sheets.length - 1
            ? [86, 104, 122, 140].map((y, k) => (
                <rect key={y} x={50} y={y} width={k % 2 ? 70 : 96} height={7} rx={3.5} fill={C.faint} opacity={0.55} />
              ))
            : null}
        </g>
      ))}
      {/* prendedor */}
      <rect x={78} y={8} width={44} height={30} rx={8} fill={accent} />
      <rect x={100} y={8} width={22} height={30} rx={8} fill={shade} />
      <path d="M84 30 q16 -22 32 0" stroke={C.mid} strokeWidth={5} fill="none" strokeLinecap="round" />
    </svg>
  );
};

/** Envelope com aviso — e-mail, mensagem chegando. O pontinho pula com `t`. */
export const Envelope: React.FC<Base> = ({ t = 0, size = 220, accent = dimColor('health') }) => {
  const hop = Math.max(0, Math.sin(t / 7)) * 6;
  return (
    <svg width={size} height={size * 0.78} viewBox="0 0 200 156" style={{ overflow: 'visible' }}>
      <ellipse cx={100} cy={150} rx={80} ry={6} fill={ground} />
      <rect x={14} y={26} width={172} height={116} rx={14} fill={C.hi} />
      <rect x={100} y={26} width={86} height={116} rx={14} fill="rgba(10,14,38,0.08)" />
      <path d="M18 132 L84 84 q16 -10 32 0 L182 132" fill={C.text} />
      <path d="M18 36 L88 90 q12 8 24 0 L182 36" fill={C.mid} />
      <path d="M100 96 q6 -2 12 -6 L182 36 v6 L112 94 q-6 4 -12 4z" fill={shade} />
      <circle cx={176} cy={30 - hop} r={20} fill={accent} />
      <circle cx={170} cy={23 - hop} r={5} fill={shine} />
    </svg>
  );
};
