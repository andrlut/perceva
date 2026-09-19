import { StyleSheet, View } from 'react-native';

interface Props {
  /** XP per bucket (day, week or month), oldest first. */
  values: number[];
  /** Buckets that have already started. The rest are the future of the
   *  current period — drawn hollow and left out of any count. */
  elapsed: number;
  /** The biggest bucket to scale the paint against — shared by the strips
   *  of one card, so their colors compare. */
  max: number;
  /** The dimension's color, 6-digit hex (alpha is concatenated). */
  color: string;
}

/**
 * One cell per bucket, all the same size, painted by how much XP the bucket
 * got. It answers the question the totals cannot — constancy: a row of lit
 * cells is a habit, a few bright cells between empty ones are isolated
 * events. Size never encodes anything, so a heavy day cannot hide the empty
 * days around it the way a tall bar would.
 */
export function DayStrip({ values, elapsed, max, color }: Props) {
  return (
    <View style={styles.row} importantForAccessibility="no-hide-descendants">
      {values.map((v, i) =>
        i >= elapsed ? (
          <View key={i} style={[styles.cell, styles.future, { borderColor: `${color}33` }]} />
        ) : (
          <View
            key={i}
            style={[
              styles.cell,
              {
                backgroundColor: color,
                // A practiced bucket never drops below 0.4, so the faintest
                // one still reads as "lit" next to an empty one (0.12).
                opacity: v > 0 && max > 0 ? 0.4 + 0.6 * Math.min(1, v / max) : 0.12,
              },
            ]}
          />
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
  cell: { flex: 1, height: 16, borderRadius: 3 },
  future: { borderWidth: 1, backgroundColor: 'transparent' },
});
