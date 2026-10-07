import React from 'react';
import { C } from './theme';

// Glyph "Topo Iris" — mesmos traços de app/components/PercevaGlyph.tsx
// (viewBox 1024, paleta primary), com dois controles de animação:
//   rings — os anéis nascem do centro pra fora, um após o outro
//   path  — o traço dourado se desenha da ponta de baixo à de cima
const RINGS = [
  { r: 80, o: 1 },
  { r: 140, o: 0.85 },
  { r: 200, o: 0.7 },
  { r: 260, o: 0.55 },
  { r: 320, o: 0.45 },
];
const PATH_D = 'M 180 720 Q 380 600 512 512 Q 644 424 844 304';

export const Glyph: React.FC<{
  size: number;
  cx: number;
  cy: number;
  rings?: number; // 0..1
  path?: number; // 0..1
  glow?: number; // 0..1
  opacity?: number;
  rotate?: number;
}> = ({ size, cx, cy, rings = 1, path = 1, glow = 0.6, opacity = 1, rotate = 0 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 1024 1024"
    style={{
      position: 'absolute',
      left: cx - size / 2,
      top: cy - size / 2,
      overflow: 'visible',
      opacity,
      transform: `rotate(${rotate}deg)`,
      filter: `drop-shadow(0 0 ${40 * glow}px rgba(123,92,255,${0.7 * glow}))`,
    }}
  >
    <defs>
      <radialGradient id="glyph-pupil" cx="0.4" cy="0.4" r="0.7">
        <stop offset="0" stopColor={C.goldLight} />
        <stop offset="1" stopColor={C.goldDeep} />
      </radialGradient>
    </defs>
    <g fill="none" stroke={C.violet2} strokeWidth={14}>
      {RINGS.map((ring, i) => {
        const t = Math.min(1, Math.max(0, rings * RINGS.length - i));
        return <circle key={ring.r} cx={512} cy={512} r={ring.r * (0.6 + 0.4 * t)} opacity={ring.o * t} />;
      })}
    </g>
    <path
      d={PATH_D}
      fill="none"
      stroke={C.goldLight}
      strokeWidth={22}
      strokeLinecap="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - path}
    />
    <circle cx={180} cy={720} r={18} fill={C.goldLight} opacity={path > 0 ? 1 : 0} />
    <circle cx={844} cy={304} r={22} fill={C.goldLight} opacity={path >= 1 ? 1 : 0} />
    <circle cx={512} cy={512} r={38 * Math.min(1, rings * 2)} fill="url(#glyph-pupil)" />
  </svg>
);
