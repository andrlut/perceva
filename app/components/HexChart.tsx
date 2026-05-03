import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Polygon, Text as SvgText } from 'react-native-svg';

import type { SubId } from '@/lib/db/types';
import { tokens } from '@/theme';
import { DIMENSION_META, DIMENSION_ORDER, SUB_META, SUBS_BY_DIM } from '@/theme/dimensions';

interface HexChartProps {
  /** Map of sub_id → score (0-5). Missing keys render as 0. */
  scores: Map<SubId, number>;
  size?: number;
}

/**
 * Wheel-of-life chart with 12 axes (one per sub) and 6 dim wedges painted
 * underneath. Each dim spans 60° of the circle and contains its 2 sub axes.
 *
 *   - Background: 6 dim-tinted wedges (subtle wash, dim color)
 *   - Axes: 12, 30° apart, sub corner dots colored by dim
 *   - User shape: violet polygon connecting the 12 sub scores (0-5 each)
 *   - Dim balls: 6 circles at each wedge midpoint, radius scales to the
 *     dim's *summed* score (0-10 integer), value labeled inside
 *   - Bottom legend: 6 columns with dim sum + 2 sub scores
 */
export function HexChart({ scores, size = 300 }: HexChartProps) {
  // Flat list of 12 subs in display order (dim-paired).
  const subOrder = useMemo<SubId[]>(
    () => DIMENSION_ORDER.flatMap((d) => SUBS_BY_DIM[d]),
    [],
  );

  const padding = 56;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - padding;
  const SUB_MAX = 5;
  const DIM_MAX = 10; // sum of two subs

  // Sub corners — 12 axes, 30° steps starting at top.
  const corners = useMemo(() => {
    return subOrder.map((subId, i) => {
      const angle = (Math.PI / 6) * i - Math.PI / 2;
      const meta = SUB_META[subId];
      return {
        subId,
        dimensionId: meta.dimensionId,
        angle,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });
  }, [subOrder, cx, cy, radius]);

  // Dim wedges — each 60° centered on the dim's midpoint angle.
  // Boundary between dim d-1 and dim d sits at angle (60d - 105) deg.
  const wedges = useMemo(() => {
    return DIMENSION_ORDER.map((dim, d) => {
      const startDeg = -105 + 60 * d;
      const endDeg = -45 + 60 * d;
      const startRad = (startDeg * Math.PI) / 180;
      const endRad = (endDeg * Math.PI) / 180;
      const x1 = cx + radius * Math.cos(startRad);
      const y1 = cy + radius * Math.sin(startRad);
      const x2 = cx + radius * Math.cos(endRad);
      const y2 = cy + radius * Math.sin(endRad);
      // 60° < 180°, so large-arc-flag = 0; sweep clockwise = 1
      const path = `M ${cx},${cy} L ${x1.toFixed(2)},${y1.toFixed(2)} A ${radius},${radius} 0 0 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;
      return { dim, path };
    });
  }, [cx, cy, radius]);

  // Dim midpoints — angle bisects the two sub axes; ball radius reflects
  // the *summed* dim score (0-10 integer when both subs are integers).
  const dimMids = useMemo(() => {
    return DIMENSION_ORDER.map((dim, d) => {
      const angle = (Math.PI / 6) * (2 * d + 0.5) - Math.PI / 2;
      const [a, b] = SUBS_BY_DIM[dim];
      const sa = scores.get(a) ?? 0;
      const sb = scores.get(b) ?? 0;
      const sum = sa + sb;
      // Pull ball slightly toward edge for visibility; minimum radius so a
      // 0/0 dim still has a small ball at the center, not literally at (cx,cy).
      const minR = 14;
      const targetR = (sum / DIM_MAX) * radius;
      const r = Math.max(minR, targetR);
      return {
        dim,
        sum,
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        labelX: cx + (radius + 26) * Math.cos(angle),
        labelY: cy + (radius + 26) * Math.sin(angle),
      };
    });
  }, [scores, cx, cy, radius]);

  // Concentric grid (every full point on the 0-5 sub scale).
  const gridRings = [1 / 5, 2 / 5, 3 / 5, 4 / 5, 1.0];

  const framePoints = corners
    .map((c) => `${c.x.toFixed(2)},${c.y.toFixed(2)}`)
    .join(' ');

  const valuePoints = corners
    .map((c) => {
      const v = scores.get(c.subId) ?? 0;
      const r = (v / SUB_MAX) * radius;
      const x = cx + r * Math.cos(c.angle);
      const y = cy + r * Math.sin(c.angle);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <View>
      <View style={{ width: size, height: size, alignSelf: 'center' }}>
        <Svg width={size} height={size}>
          {/* Dim-tinted wedge backgrounds */}
          {wedges.map((w, i) => (
            <Path
              key={`wedge-${i}`}
              d={w.path}
              fill={DIMENSION_META[w.dim].color}
              fillOpacity={0.08}
              stroke={DIMENSION_META[w.dim].color}
              strokeOpacity={0.18}
              strokeWidth={1}
            />
          ))}

          {/* Concentric grid rings (12-sided) */}
          {gridRings.map((g, i) => {
            const pts = corners
              .map((c) => {
                const r = g * radius;
                const x = cx + r * Math.cos(c.angle);
                const y = cy + r * Math.sin(c.angle);
                return `${x.toFixed(2)},${y.toFixed(2)}`;
              })
              .join(' ');
            return (
              <Polygon
                key={`ring-${i}`}
                points={pts}
                fill="none"
                stroke={tokens.border.divider}
                strokeWidth={1}
              />
            );
          })}

          {/* Spokes — subtle, just for axis reference */}
          {corners.map((c, i) => (
            <Line
              key={`spoke-${i}`}
              x1={cx}
              y1={cy}
              x2={c.x}
              y2={c.y}
              stroke={tokens.border.divider}
              strokeWidth={1}
            />
          ))}

          {/* Outer 12-sided frame */}
          <Polygon
            points={framePoints}
            fill="none"
            stroke={tokens.border.strong}
            strokeWidth={1.5}
          />

          {/* User value polygon (12 sub points) */}
          <Polygon
            points={valuePoints}
            fill={tokens.brand.violetGlow}
            stroke={tokens.brand.violet2}
            strokeWidth={2}
          />

          {/* Sub corner dots — small, dim-colored, on top of polygon */}
          {corners.map((c, i) => {
            const v = scores.get(c.subId) ?? 0;
            const r = (v / SUB_MAX) * radius;
            const x = cx + r * Math.cos(c.angle);
            const y = cy + r * Math.sin(c.angle);
            return (
              <Circle
                key={`sub-dot-${i}`}
                cx={x}
                cy={y}
                r={3.5}
                fill={DIMENSION_META[c.dimensionId].color}
                stroke={tokens.bg.deep}
                strokeWidth={1}
              />
            );
          })}

          {/* Dim midpoint balls — bigger, with sum 0-10 integer */}
          {dimMids.map((m, i) => (
            <Circle
              key={`dim-ball-${i}`}
              cx={m.x}
              cy={m.y}
              r={14}
              fill={DIMENSION_META[m.dim].color}
              stroke={tokens.bg.deep}
              strokeWidth={2}
            />
          ))}
          {dimMids.map((m, i) => (
            <SvgText
              key={`dim-ball-text-${i}`}
              x={m.x}
              y={m.y + 4}
              textAnchor="middle"
              fontSize={12}
              fontWeight="800"
              fill={tokens.text.hi}
            >
              {m.sum}
            </SvgText>
          ))}

          {/* Dim labels around the perimeter */}
          {dimMids.map((m, i) => (
            <SvgText
              key={`dim-label-${i}`}
              x={m.labelX}
              y={m.labelY + 4}
              textAnchor="middle"
              fontSize={10}
              fontWeight="800"
              fill={DIMENSION_META[m.dim].color}
            >
              {DIMENSION_META[m.dim].label.toUpperCase()}
            </SvgText>
          ))}
        </Svg>
      </View>

      {/* Legend: 6 columns, dim sum + 2 sub scores */}
      <View style={styles.legend}>
        {DIMENSION_ORDER.map((dim) => {
          const meta = DIMENSION_META[dim];
          const subIds = SUBS_BY_DIM[dim];
          const sa = scores.get(subIds[0]) ?? 0;
          const sb = scores.get(subIds[1]) ?? 0;
          const sum = sa + sb;
          return (
            <View
              key={dim}
              style={[styles.legendCol, { borderColor: `${meta.color}33` }]}
            >
              <View style={[styles.legendBadge, { backgroundColor: meta.color }]}>
                <Text style={styles.legendBadgeText}>{sum}</Text>
              </View>
              <Text
                style={[styles.legendDim, { color: meta.color }]}
                numberOfLines={1}
              >
                {meta.label}
              </Text>
              {subIds.map((subId, i) => {
                const subMeta = SUB_META[subId];
                const score = i === 0 ? sa : sb;
                return (
                  <View key={subId} style={styles.legendSubRow}>
                    <Ionicons
                      name={subMeta.iconName as never}
                      size={9}
                      color={tokens.text.dim}
                    />
                    <Text style={styles.legendSubLabel} numberOfLines={1}>
                      {subMeta.label}
                    </Text>
                    <Text style={styles.legendSubScore}>{score}</Text>
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    marginTop: tokens.space[4],
    gap: tokens.space[1],
  },
  legendCol: {
    flex: 1,
    gap: 3,
    paddingHorizontal: 3,
    paddingTop: tokens.space[3],
    paddingBottom: tokens.space[2],
    backgroundColor: tokens.bg.surface,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    alignItems: 'stretch',
  },
  legendBadge: {
    alignSelf: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  legendBadgeText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    color: tokens.text.hi,
  },
  legendDim: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 9,
    letterSpacing: 0.4,
    textAlign: 'center',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  legendSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 2,
  },
  legendSubLabel: {
    flex: 1,
    fontFamily: 'Manrope_500Medium',
    fontSize: 8,
    color: tokens.text.mid,
  },
  legendSubScore: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    color: tokens.text.hi,
  },
});
