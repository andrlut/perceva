import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { SubId } from '@/lib/db/types';
import { tokens } from '@/theme';
import { DIMENSION_META, DIMENSION_ORDER, SUB_META, SUBS_BY_DIM } from '@/theme/dimensions';

interface Props {
  scores: Map<SubId, number>;
}

/**
 * Pure-RN fallback for HexChart — no react-native-svg involved. Same data
 * shape (12 sub scores), rendered as a 2 × 3 grid of dim cards with pip
 * bars. Used when the SVG hex crashes on Android.
 */
export function HexChartFallback({ scores }: Props) {
  const overall = (() => {
    let sum = 0;
    for (const dim of DIMENSION_ORDER) {
      const [a, b] = SUBS_BY_DIM[dim];
      sum += (scores.get(a) ?? 0) + (scores.get(b) ?? 0);
    }
    return Math.round((sum / DIMENSION_ORDER.length) * 10) / 10;
  })();

  return (
    <View style={styles.wrap}>
      <View style={styles.overallRow}>
        <Text style={styles.overallNum}>{overall.toFixed(1)}</Text>
        <Text style={styles.overallLabel}>/ 10 overall</Text>
      </View>

      <View style={styles.grid}>
        {DIMENSION_ORDER.map((dim) => {
          const meta = DIMENSION_META[dim];
          const subIds = SUBS_BY_DIM[dim];
          const sa = scores.get(subIds[0]) ?? 0;
          const sb = scores.get(subIds[1]) ?? 0;
          const sum = sa + sb;
          return (
            <View
              key={dim}
              style={[styles.card, { borderColor: `${meta.color}40` }]}
            >
              <View style={styles.cardHeader}>
                <Ionicons
                  name={meta.iconName as never}
                  size={14}
                  color={meta.color}
                />
                <Text
                  style={[styles.cardLabel, { color: meta.color }]}
                  numberOfLines={1}
                >
                  {meta.label.toUpperCase()}
                </Text>
                <View style={[styles.cardBadge, { backgroundColor: meta.color }]}>
                  <Text style={styles.cardBadgeText}>{sum}</Text>
                </View>
              </View>
              {subIds.map((subId, i) => {
                const subMeta = SUB_META[subId];
                const score = i === 0 ? sa : sb;
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
                                p <= score
                                  ? meta.color
                                  : 'rgba(255,255,255,0.10)',
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
  wrap: {
    gap: tokens.space[3],
  },
  overallRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: tokens.space[2],
  },
  overallNum: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 36,
    color: tokens.text.hi,
  },
  overallLabel: {
    ...tokens.type.caption,
    color: tokens.text.mid,
    fontFamily: 'Manrope_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.space[2],
  },
  card: {
    width: '31.5%',
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
