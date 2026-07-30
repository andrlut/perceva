import { StyleSheet, View } from 'react-native';

import type { TaskSub } from '@/lib/db/types';
import { tokens } from '@/theme';
import { DIMENSION_META, SUB_META } from '@/theme/dimensions';

/**
 * Pips colored per-sub: a 2★+1★+1★ task draws 2 of sub-1's color, 1 of
 * sub-2's, 1 of sub-3's. Total pips = sum of stars across subs.
 *
 * Shared by TaskCard (the task's DEFAULT allocation) and CompletedBucket
 * (the stars a specific completion ACTUALLY used, which is what explains
 * why two rows of the same practice can pay different XP).
 */
export function SubColoredPips({
  subs,
  size = 6,
}: {
  subs: TaskSub[];
  /** Pip edge in dp. The drawer runs slightly smaller than the card. */
  size?: number;
}) {
  const pips: string[] = [];
  for (const s of subs) {
    const sub = SUB_META[s.sub_id];
    const color = sub ? DIMENSION_META[sub.dimensionId].color : tokens.brand.violet2;
    for (let i = 0; i < s.stars; i++) {
      pips.push(color);
    }
  }
  if (pips.length === 0) return null;
  return (
    <View style={styles.row}>
      {pips.map((color, i) => (
        <View
          key={i}
          style={[
            styles.pip,
            {
              width: size,
              height: size,
              borderRadius: size / 4,
              backgroundColor: color,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  pip: {
    // width/height/radius/color come from the caller-sized style above.
  },
});
