import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DimensionId, SubId } from '@/lib/db/types';
import { useMetaLookup } from '@/lib/i18n/meta';
import { tokens } from '@/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

export interface DimSubBar {
  subId: SubId;
  /** Fill fraction 0..1. For a stacked current→target bar, this is the
   *  OUTER (target) extent; `baseFill` is the solid inner extent. */
  fill: number;
  /** Inner solid fill 0..1 — renders solid on top up to here, with `fill`
   *  drawn translucent behind it. Used by Desejada's current→desired bar. */
  baseFill?: number;
  /** Right-aligned value label, e.g. "+840 XP". */
  valueLabel?: string;
}

export interface DimCardRow {
  dimId: DimensionId;
  /** Header badge — a solid score pill, a soft delta chip, or a bare icon. */
  badge?: { text?: string; icon?: IoniconName; tone?: 'solid' | 'chip' };
  /** Optional dim-level bar above the sub rows (Praticada window bar). */
  dimBar?: { fill: number; tick?: number };
  /** Optional caption under the sub bars, e.g. "sono 3,5 → 4,5". */
  caption?: string;
  subs: DimSubBar[];
}

interface Props {
  rows: DimCardRow[];
  /** Single accent overriding each dim's own color (Desejada = gold).
   *  Default: each card uses its dimension's meta color. */
  accent?: string;
  onDimPress?: (dim: DimensionId) => void;
}

function clampPct(v: number) {
  return `${Math.max(0, Math.min(100, v * 100))}%` as const;
}

/**
 * The six dimension cards that sit under a pillar's hex — 3 rows × 2, each
 * card = dim header (icon · label · badge) over its sub bars. Extracted
 * from HexChart so all three pillars share one card language while each
 * owns its own scale: Percebida passes score/5 fills, Praticada passes
 * window ratios + XP labels, Desejada passes stacked current→desired fills.
 *
 * Purely presentational — every fraction arrives pre-normalized 0..1 and
 * every label pre-formatted. It draws what it's handed; the pillar decides
 * what the numbers mean.
 */
export function DimensionCards({ rows, accent, onDimPress }: Props) {
  const metaLookup = useMetaLookup();

  return (
    <View style={styles.legend}>
      {[0, 2, 4].map((rowStart) => (
        <View key={`row-${rowStart}`} style={styles.legendRow}>
          {rows.slice(rowStart, rowStart + 2).map((row) => {
            const meta = metaLookup.dim(row.dimId);
            const color = accent ?? meta.color;
            const badge = row.badge;
            const content = (
              <>
                <View style={styles.cardHeader}>
                  <Ionicons name={meta.iconName as never} size={12} color={color} />
                  <Text style={[styles.cardLabel, { color }]} numberOfLines={1}>
                    {meta.label.toUpperCase()}
                  </Text>
                  {badge ? (
                    badge.tone === 'chip' ? (
                      <View style={[styles.chip, { backgroundColor: `${color}22` }]}>
                        {badge.icon ? (
                          <Ionicons name={badge.icon} size={11} color={color} />
                        ) : null}
                        {badge.text ? (
                          <Text style={[styles.chipText, { color }]}>{badge.text}</Text>
                        ) : null}
                      </View>
                    ) : (
                      <View style={[styles.cardBadge, { backgroundColor: color }]}>
                        {badge.icon ? (
                          <Ionicons name={badge.icon} size={11} color="#0E1230" />
                        ) : null}
                        {badge.text ? (
                          <Text style={styles.cardBadgeText}>{badge.text}</Text>
                        ) : null}
                      </View>
                    )
                  ) : null}
                </View>

                {row.dimBar ? (
                  <View style={[styles.dimBar, { backgroundColor: `${color}1A` }]}>
                    <View
                      style={[
                        styles.dimBarFill,
                        { width: clampPct(row.dimBar.fill), backgroundColor: color },
                      ]}
                    />
                    {row.dimBar.tick !== undefined ? (
                      <View style={[styles.tick, { left: clampPct(row.dimBar.tick) }]} />
                    ) : null}
                  </View>
                ) : null}

                {row.subs.map((sub) => {
                  const subMeta = metaLookup.sub(sub.subId);
                  const stacked = sub.baseFill !== undefined;
                  return (
                    <View key={sub.subId} style={styles.subRow}>
                      <Ionicons
                        name={subMeta.iconName as never}
                        size={12}
                        color={color}
                      />
                      <View style={[styles.bar, { backgroundColor: `${color}1A` }]}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: clampPct(sub.fill),
                              backgroundColor: stacked ? `${color}55` : color,
                            },
                          ]}
                        />
                        {stacked ? (
                          <View
                            style={[
                              styles.barFill,
                              {
                                width: clampPct(sub.baseFill ?? 0),
                                backgroundColor: color,
                              },
                            ]}
                          />
                        ) : null}
                      </View>
                      {sub.valueLabel ? (
                        <Text style={styles.subValue} numberOfLines={1}>
                          {sub.valueLabel}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}

                {row.caption ? (
                  <Text style={styles.caption} numberOfLines={1}>
                    {row.caption}
                  </Text>
                ) : null}
              </>
            );

            if (onDimPress) {
              return (
                <Pressable
                  key={`card-${row.dimId}`}
                  onPress={() => onDimPress(row.dimId)}
                  style={({ pressed }) => [
                    styles.card,
                    { borderColor: `${color}40` },
                    pressed && { opacity: 0.7 },
                  ]}
                  hitSlop={2}
                >
                  {content}
                </Pressable>
              );
            }
            return (
              <View
                key={`card-${row.dimId}`}
                style={[styles.card, { borderColor: `${color}40` }]}
              >
                {content}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    gap: tokens.space[2],
  },
  legendRow: {
    flexDirection: 'row',
    gap: tokens.space[2],
  },
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  cardLabel: {
    flex: 1,
    minWidth: 0,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    letterSpacing: 1,
  },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 7,
    justifyContent: 'center',
  },
  cardBadgeText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    color: '#0E1230',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  chipText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
  },
  dimBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 2,
  },
  dimBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 3,
  },
  tick: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  bar: {
    flex: 1,
    height: 5,
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 2,
  },
  subValue: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    color: tokens.text.dim,
    minWidth: 46,
    textAlign: 'right',
  },
  caption: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
    color: tokens.text.dim,
    marginTop: 6,
  },
});
