import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View, type DimensionValue } from 'react-native';

import type { SubId } from '@/lib/db/types';
import { tokens } from '@/theme';
import { DIMENSION_META, DIMENSION_ORDER, SUB_META, SUBS_BY_DIM } from '@/theme/dimensions';

interface Props {
  scores: Map<SubId, number>;
  size?: number;
}

const DIM_MAX = 10;
const PADDING = 38;

function angleAt(j: number) {
  return (j / 6) * Math.PI * 2 - Math.PI / 2;
}

interface LineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width?: number;
  opacity?: number;
}

/** A line segment between two points, drawn as a thin rotated View. */
function Line({ x1, y1, x2, y2, color, width = 1, opacity = 1 }: LineProps) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (
    <View
      style={{
        position: 'absolute',
        left: x1,
        top: y1 - width / 2,
        width: length,
        height: width,
        backgroundColor: color,
        opacity,
        transformOrigin: '0% 50%',
        transform: [{ rotate: `${angle}deg` }],
      }}
    />
  );
}

/**
 * Pure-RN hexagon chart for Android (where react-native-svg crashes).
 *
 * Same data as HexChart: 6 dim vertices, score 0-10 each (sum of 2 subs).
 * Drawn with absolutely-positioned Views and rotated Line segments —
 * no native SVG module involved.
 */
export function HexChartFallback({ scores, size = 320 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - PADDING;

  const mains = useMemo(() => {
    return DIMENSION_ORDER.map((dim, j) => {
      const [a, b] = SUBS_BY_DIM[dim];
      const sa = scores.get(a) ?? 0;
      const sb = scores.get(b) ?? 0;
      const score = sa + sb;
      const angle = angleAt(j);
      const r = (score / DIM_MAX) * R;
      return {
        dim,
        score,
        sa,
        sb,
        angle,
        // Vertex of the score polygon (where the colored disc lives).
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        // Outer hex frame vertex (full R).
        fx: cx + Math.cos(angle) * R,
        fy: cy + Math.sin(angle) * R,
        // Outer label position.
        lx: cx + Math.cos(angle) * (R + 22),
        ly: cy + Math.sin(angle) * (R + 22),
      };
    });
  }, [scores, cx, cy, R]);

  const overall = useMemo(() => {
    const sum = mains.reduce((s, m) => s + m.score, 0);
    return Math.round((sum / mains.length) * 10) / 10;
  }, [mains]);

  // Concentric reference rings — circles with dashed border, since
  // hex-shaped grids without SVG would need 12 more rotated Views.
  const ringSizes = [0.5, 0.75, 1.0];

  return (
    <View>
      <View style={[styles.canvas, { width: size, height: size }]}>
        {/* Concentric reference circles */}
        {ringSizes.map((g, i) => {
          const d = R * 2 * g;
          return (
            <View
              key={`ring-${i}`}
              style={{
                position: 'absolute',
                left: cx - d / 2,
                top: cy - d / 2,
                width: d,
                height: d,
                borderRadius: d / 2,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.06)',
                borderStyle: g === 1 ? 'solid' : 'dashed',
              }}
            />
          );
        })}

        {/* Static hex frame (full R) */}
        {mains.map((m, j) => {
          const next = mains[(j + 1) % 6];
          return (
            <Line
              key={`frame-${j}`}
              x1={m.fx}
              y1={m.fy}
              x2={next.fx}
              y2={next.fy}
              color="rgba(255,255,255,0.18)"
              width={1}
            />
          );
        })}

        {/* Spokes from center to each frame vertex */}
        {mains.map((m, j) => (
          <Line
            key={`spoke-${j}`}
            x1={cx}
            y1={cy}
            x2={m.fx}
            y2={m.fy}
            color="rgba(255,255,255,0.06)"
            width={1}
          />
        ))}

        {/* Score polygon outline */}
        {mains.map((m, j) => {
          const next = mains[(j + 1) % 6];
          return (
            <Line
              key={`score-${j}`}
              x1={m.x}
              y1={m.y}
              x2={next.x}
              y2={next.y}
              color={tokens.brand.violet2}
              width={2}
            />
          );
        })}

        {/* Outer dim labels */}
        {mains.map((m) => {
          const meta = DIMENSION_META[m.dim];
          // Smart text alignment so labels hug the perimeter without
          // drifting into the chart.
          const dx = m.lx - cx;
          const align: 'left' | 'right' | 'center' =
            dx > 5 ? 'left' : dx < -5 ? 'right' : 'center';
          const labelWidth = 80;
          const labelLeft =
            align === 'left'
              ? m.lx
              : align === 'right'
                ? m.lx - labelWidth
                : m.lx - labelWidth / 2;
          return (
            <Text
              key={`label-${m.dim}`}
              style={[
                styles.outerLabel,
                {
                  position: 'absolute',
                  left: labelLeft,
                  top: m.ly - 7,
                  width: labelWidth,
                  textAlign: align,
                  color: meta.color,
                },
              ]}
              numberOfLines={1}
            >
              {meta.label.toUpperCase()}
            </Text>
          );
        })}

        {/* Vertex score discs (colored, with score inside) */}
        {mains.map((m) => {
          const meta = DIMENSION_META[m.dim];
          const DISC = 30;
          return (
            <View
              key={`disc-${m.dim}`}
              style={{
                position: 'absolute',
                left: m.x - DISC / 2,
                top: m.y - DISC / 2,
                width: DISC,
                height: DISC,
                borderRadius: DISC / 2,
                backgroundColor: meta.color,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: tokens.bg.deep,
              }}
            >
              <Text style={styles.discText}>{m.score}</Text>
            </View>
          );
        })}

        {/* Center overall number */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: cy - 16,
            width: size,
            alignItems: 'center',
          }}
        >
          <Text style={styles.overallText}>{overall.toFixed(1)}</Text>
        </View>
      </View>

      {/* Legend: 2 × 3 grid of dim cards with sub pip rows */}
      <View style={styles.legendGrid}>
        {mains.map((m) => {
          const meta = DIMENSION_META[m.dim];
          const subIds = SUBS_BY_DIM[m.dim];
          const cardWidth: DimensionValue = '31.5%';
          return (
            <View
              key={`card-${m.dim}`}
              style={[
                styles.card,
                { width: cardWidth, borderColor: `${meta.color}40` },
              ]}
            >
              <View style={styles.cardHeader}>
                <Ionicons
                  name={meta.iconName as never}
                  size={12}
                  color={meta.color}
                />
                <Text
                  style={[styles.cardLabel, { color: meta.color }]}
                  numberOfLines={1}
                >
                  {meta.label.toUpperCase()}
                </Text>
                <View style={[styles.cardBadge, { backgroundColor: meta.color }]}>
                  <Text style={styles.cardBadgeText}>{m.score}</Text>
                </View>
              </View>
              {subIds.map((subId, i) => {
                const subMeta = SUB_META[subId];
                const score = i === 0 ? m.sa : m.sb;
                return (
                  <View key={subId} style={styles.subRow}>
                    <Text style={styles.subLabel} numberOfLines={1}>
                      {subMeta.label}
                    </Text>
                    <View style={styles.pips}>
                      {[1, 2, 3, 4, 5].map((p) => (
                        <View
                          key={p}
                          style={[
                            styles.pip,
                            {
                              backgroundColor:
                                p <= score ? meta.color : 'rgba(255,255,255,0.10)',
                            },
                          ]}
                        />
                      ))}
                    </View>
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
  canvas: {
    alignSelf: 'center',
    position: 'relative',
  },
  outerLabel: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    letterSpacing: 1.2,
  },
  discText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    color: '#0E1230',
  },
  overallText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 28,
    color: tokens.text.hi,
  },
  legendGrid: {
    marginTop: tokens.space[3],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.space[2],
  },
  card: {
    flexGrow: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  cardLabel: {
    flex: 1,
    minWidth: 0,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 9,
    letterSpacing: 1.2,
  },
  cardBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadgeText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    color: '#0E1230',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
  },
  subLabel: {
    flex: 1,
    minWidth: 0,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
    color: tokens.text.mid,
  },
  pips: {
    flexDirection: 'row',
    gap: 2,
  },
  pip: {
    width: 6,
    height: 6,
    borderRadius: 2,
  },
});
