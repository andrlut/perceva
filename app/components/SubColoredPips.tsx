import { StyleSheet, Text, View } from 'react-native';

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
  max,
}: {
  subs: TaskSub[];
  /** Pip edge in dp. The drawer runs slightly smaller than the card. */
  size?: number;
  /**
   * Cap the strip and render "+N" for the remainder. There is no total-star
   * cap per completion (only 5 per sub), so a 3-sub rep can legitimately be
   * 9 stars — uncapped, that strip bleeds out of a narrow row.
   */
  max?: number;
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
  const shown = max !== undefined ? pips.slice(0, max) : pips;
  const hidden = pips.length - shown.length;
  return (
    <View style={styles.row}>
      {shown.map((color, i) => (
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
      {hidden > 0 && <Text style={styles.more}>+{hidden}</Text>}
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
  more: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 9,
    color: tokens.text.mid,
    marginLeft: 1,
  },
});
