import React from 'react';
import glyphs from './ionicons.json';
import { C } from './theme';

// O Emblema — réplica de app/components/Emblema.tsx (viewBox 1024, paleta
// primary): o glyph da marca desenhado pelos dados de quem usa.
//   anéis           → práticas (esforço da janela de 30 dias)
//   braços + bolas  → testes concluídos (crescem um terço por teste)
//   centro + órbita → as áreas que mais treinam (12 contas, acesas ou não)
//   halo            → ideias lidas no Recanto
// No vídeo cada canal recebe um valor 0..1 animável.

const RINGS = [140, 200, 260, 320, 380];
const TILE_R = 105;
const ARM_LEFT = 'M 512 512 Q 380 600 180 720';
const ARM_RIGHT = 'M 512 512 Q 644 424 844 304';
const ARM_LEN = 391.8;
const ORBIT_R = 455;
const SAT_R = 42;

const PAL = { mark: '#FFE3A6', accent: '#9B82FF', accentDeep: '#5B3CE0' };

// Ordem do hex (DIMENSION_ORDER × SUBS_BY_DIM) e ângulo = i × 30 − 77 graus.
const SUBS: { icon: keyof typeof glyphs; color: string }[] = [
  { icon: 'moon', color: '#FF6B7A' },
  { icon: 'restaurant', color: '#FF6B7A' },
  { icon: 'barbell', color: '#FF8A3D' },
  { icon: 'flash', color: '#FF8A3D' },
  { icon: 'book', color: '#B07BFF' },
  { icon: 'leaf', color: '#B07BFF' },
  { icon: 'wallet', color: '#FFC83D' },
  { icon: 'briefcase', color: '#FFC83D' },
  { icon: 'people', color: '#4DD0FF' },
  { icon: 'heart', color: '#4DD0FF' },
  { icon: 'game-controller', color: '#2EC4B6' },
  { icon: 'construct', color: '#2EC4B6' },
];

export const Emblema: React.FC<{
  size: number;
  cx: number;
  cy: number;
  /** 0..5 — quantos anéis cheios (fração permitida) */
  rings: number;
  /** 0..6 — testes concluídos (fração permitida, pra animar) */
  tests: number;
  /** 0..1 — brilho do halo (ideias lidas) */
  halo: number;
  /** quais das 12 áreas estão acesas (0..1 cada, pra animar) */
  lit: number[];
  /** índice da área no centro (a mais treinada), ou null */
  center: number | null;
  opacity?: number;
  scale?: number;
}> = ({ size, cx, cy, rings, tests, halo, lit, center, opacity = 1, scale = 1 }) => {
  // Como armFills() do app: teste ímpar cresce o braço esquerdo, par o
  // direito, um terço por teste. Aqui contínuo, pra animar o crescimento.
  const n = Math.max(0, Math.min(6, tests));
  const step = (k: number) => Math.max(0, Math.min(1, n - (k - 1)));
  const leftFill = (step(1) + step(3) + step(5)) / 3;
  const rightFill = (step(2) + step(4) + step(6)) / 3;
  const armDash = (fill: number) => {
    const visible = (ARM_LEN - TILE_R) * fill;
    return { strokeDasharray: `${visible} ${ARM_LEN}`, strokeDashoffset: -TILE_R };
  };
  const centerSub = center !== null ? SUBS[center] : null;
  const box = size * 1.3; // espaço pra órbita e halo
  return (
    <div
      style={{
        position: 'absolute',
        left: cx - box / 2,
        top: cy - box / 2,
        width: box,
        height: box,
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      {/* halo: atmosfera da leitura */}
      <div
        style={{
          position: 'absolute',
          inset: -box * 0.25,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(155,130,255,${0.08 + 0.4 * halo}) 0%, rgba(155,130,255,${0.02 + 0.12 * halo}) 35%, rgba(155,130,255,0) 60%)`,
        }}
      />
      <svg width={box} height={box} viewBox="-64 -64 1152 1152" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <linearGradient id="emb-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={PAL.accent} />
            <stop offset="1" stopColor={PAL.accentDeep} />
          </linearGradient>
        </defs>
        {RINGS.map((r) => (
          <circle key={`t${r}`} cx={512} cy={512} r={r} fill="none" stroke={C.faint} strokeWidth={12} opacity={0.4} />
        ))}
        {RINGS.map((r, i) => {
          const f = Math.max(0, Math.min(1, rings - i));
          if (f <= 0) return null;
          const c = 2 * Math.PI * r;
          return (
            <circle
              key={`f${r}`}
              cx={512}
              cy={512}
              r={r}
              fill="none"
              stroke="url(#emb-fill)"
              strokeWidth={20}
              strokeLinecap="round"
              strokeDasharray={`${c * f} ${c}`}
              transform="rotate(-90 512 512)"
            />
          );
        })}
        {leftFill > 0 ? <path d={ARM_LEFT} fill="none" stroke={PAL.mark} strokeWidth={22} strokeLinecap="round" {...armDash(leftFill)} /> : null}
        {rightFill > 0 ? <path d={ARM_RIGHT} fill="none" stroke={PAL.mark} strokeWidth={22} strokeLinecap="round" {...armDash(rightFill)} /> : null}
        {leftFill >= 1 ? <circle cx={180} cy={720} r={18} fill={PAL.mark} /> : null}
        {rightFill >= 1 ? <circle cx={844} cy={304} r={22} fill={PAL.mark} /> : null}
        <circle cx={512} cy={512} r={ORBIT_R} fill="none" stroke={C.faint} strokeWidth={4} opacity={0.35} />
        {SUBS.map((sub, i) => {
          const rad = ((i * 30 - 77) * Math.PI) / 180;
          const x = 512 + ORBIT_R * Math.cos(rad);
          const y = 512 + ORBIT_R * Math.sin(rad);
          const on = lit[i] ?? 0;
          return (
            <g key={sub.icon + i}>
              <circle cx={x} cy={y} r={SAT_R} fill={C.deep} stroke={on > 0.5 ? sub.color : C.faint} strokeWidth={7} strokeOpacity={0.38 + 0.62 * on} />
              <text x={x} y={y + 19} textAnchor="middle" fontFamily="Ionicons" fontSize={54} fill={on > 0.5 ? sub.color : C.faint} opacity={0.4 + 0.6 * on}>
                {String.fromCodePoint(glyphs[sub.icon])}
              </text>
            </g>
          );
        })}
        <circle
          cx={512}
          cy={512}
          r={TILE_R}
          fill={centerSub ? `${centerSub.color}29` : 'rgba(255,255,255,0.04)'}
          stroke={centerSub ? centerSub.color : C.faint}
          strokeWidth={8}
          opacity={centerSub ? 1 : 0.5}
        />
        {centerSub ? (
          <text x={512} y={512 + 42} textAnchor="middle" fontFamily="Ionicons" fontSize={118} fill={centerSub.color}>
            {String.fromCodePoint(glyphs[centerSub.icon])}
          </text>
        ) : null}
      </svg>
    </div>
  );
};
