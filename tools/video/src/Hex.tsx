import React from 'react';
import glyphs from './ionicons.json';
import { C, DIMS, FONT } from './theme';

// Mesma geometria do HexRadar do app: eixo 0 (Saúde) no topo, sentido horário.
const angleAt = (j: number) => (j / 6) * Math.PI * 2 - Math.PI / 2;
const pt = (j: number, r: number): [number, number] => [Math.cos(angleAt(j)) * r, Math.sin(angleAt(j)) * r];
const poly = (vals: number[], R: number) => vals.map((v, j) => pt(j, Math.max(v, 0.001) * R).join(',')).join(' ');

/** Posição (no quadro) do vértice j a um valor v, dado o centro do hexágono. */
export const hexPoint = (cx: number, cy: number, size: number, j: number, v: number): [number, number] => {
  const [x, y] = pt(j, (size / 2) * v);
  return [cx + x, cy + y];
};

type Props = {
  id: string;
  size: number; // diâmetro do hexágono (sem rótulos)
  cx: number;
  cy: number;
  values: number[]; // o que você pratica (0..1)
  contour?: number[]; // como você se vê (0..1)
  contourDraw?: number; // 0..1
  grid?: number; // 0..1 — desenha a grade
  fill?: number; // 0..1 — opacidade da forma
  icons?: boolean;
  labels?: boolean;
  highlight?: number; // índice do eixo em destaque
  highlightAmt?: number; // 0..1
  rotate?: number; // graus
  muted?: boolean;
  opacity?: number;
};

export const Hex: React.FC<Props> = ({
  id,
  size,
  cx,
  cy,
  values,
  contour,
  contourDraw = 1,
  grid = 1,
  fill = 1,
  icons = false,
  labels = false,
  highlight,
  highlightAmt = 0,
  rotate = 0,
  muted = false,
  opacity = 1,
}) => {
  const R = size / 2;
  const pad = labels ? 190 : icons ? 90 : 20;
  const W = size + pad * 2;
  const ring = (k: number) => poly([k, k, k, k, k, k], R);
  return (
    <svg
      width={W}
      height={W}
      viewBox={`${-W / 2} ${-W / 2} ${W} ${W}`}
      style={{
        position: 'absolute',
        left: cx - W / 2,
        top: cy - W / 2,
        overflow: 'visible',
        transform: `rotate(${rotate}deg)`,
        opacity,
      }}
    >
      <defs>
        <radialGradient id={`fill-${id}`} cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor={muted ? C.faint : C.violet2} stopOpacity="0.55" />
          <stop offset="1" stopColor={muted ? C.faint : C.violetDeep} stopOpacity="0.85" />
        </radialGradient>
        <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* grade: 4 anéis + raios */}
      <g opacity={grid}>
        {[0.25, 0.5, 0.75, 1].map((k) => (
          <polygon
            key={k}
            points={ring(k)}
            fill={k === 1 ? 'rgba(36,42,88,0.35)' : 'none'}
            stroke={k === 1 ? C.borderStrong : C.border}
            strokeWidth={k === 1 ? 3 : 2}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - grid}
          />
        ))}
        {DIMS.map((_, j) => {
          const [x, y] = pt(j, R);
          return <line key={j} x1={0} y1={0} x2={x * grid} y2={y * grid} stroke={C.border} strokeWidth={2} />;
        })}
      </g>

      {/* o que você pratica */}
      <polygon
        points={poly(values, R)}
        fill={`url(#fill-${id})`}
        fillOpacity={fill}
        stroke={muted ? C.dim : C.violet2}
        strokeOpacity={fill}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      {values.map((v, j) => {
        if (v < 0.02) return null;
        const [x, y] = pt(j, v * R);
        return <circle key={j} cx={x} cy={y} r={9} fill={muted ? C.dim : DIMS[j].color} opacity={fill} />;
      })}

      {/* como você se vê */}
      {contour ? (
        <polygon
          points={poly(contour, R)}
          fill="none"
          stroke={C.gold2}
          strokeWidth={6}
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - contourDraw}
          filter={`url(#glow-${id})`}
        />
      ) : null}

      {/* destaque de um eixo */}
      {highlight !== undefined && highlightAmt > 0 ? (
        (() => {
          const v = Math.max(values[highlight], contour ? contour[highlight] : 0);
          const [x, y] = pt(highlight, v * R * 0.75);
          return (
            <ellipse
              cx={x}
              cy={y}
              rx={R * 0.32 * (0.8 + highlightAmt * 0.2)}
              ry={R * 0.32 * (0.8 + highlightAmt * 0.2)}
              fill="none"
              stroke={C.hi}
              strokeWidth={4}
              strokeDasharray="10 12"
              opacity={highlightAmt}
            />
          );
        })()
      ) : null}

      {/* ícones e nomes das áreas */}
      {icons || labels
        ? DIMS.map((d, j) => {
            const [x, y] = pt(j, R + 58);
            const [lx, ly] = pt(j, R + (labels ? 130 : 58));
            return (
              <g key={d.id} transform={`rotate(${-rotate} ${x} ${y})`}>
                <circle cx={x} cy={y} r={34} fill={`${d.color}2E`} />
                <text
                  x={x}
                  y={y + 13}
                  textAnchor="middle"
                  fontFamily={FONT.icon}
                  fontSize={36}
                  fill={d.color}
                >
                  {String.fromCodePoint(glyphs[d.icon as keyof typeof glyphs])}
                </text>
                {labels ? (
                  <text
                    x={lx}
                    y={ly + (j === 0 ? -6 : j === 3 ? 24 : 10)}
                    textAnchor="middle"
                    fontFamily={FONT.body}
                    fontWeight={700}
                    fontSize={28}
                    fill={highlight === j && highlightAmt > 0 ? C.hi : C.mid}
                  >
                    {d.label}
                  </text>
                ) : null}
              </g>
            );
          })
        : null}
    </svg>
  );
};
