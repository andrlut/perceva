import { StyleSheet, View } from 'react-native';

import { BAR_SPAN, barSegments, pct } from '@/lib/dedicacao/scale';
import { tokens } from '@/theme';

/** Where the ruler sits on the track: always the same third. */
const TICK_AT = pct(1 / BAR_SPAN);

interface Props {
  xp: number;
  /** The window's ruler (lib/saturation.ts) — 300 in 30 days. */
  cap: number;
  /** The dimension's color, 6-digit hex (alpha is concatenated). */
  color: string;
}

/**
 * One sub's XP in the window, on the ruler's own geometry: the track runs to
 * BAR_SPAN × the ruler and the neutral tick marks the ruler itself, fixed at
 * a third of the length in every period.
 *
 * Up to the tick the fill is pale — that part is what the hex already shows.
 * Past it the fill is the full color, and it is the only saturated color
 * below the hex: at a glance, what is lit is what went past 300. Beyond the
 * end of the track (900+ in 30 days) the fill stops at the end with a notch,
 * and the number beside the bar carries the true value.
 */
export function SubBar({ xp, cap, color }: Props) {
  const { base, over, clipped } = barSegments(xp, cap);
  return (
    <View style={styles.row} importantForAccessibility="no-hide-descendants">
      <View style={[styles.track, { backgroundColor: `${color}1A` }]} />
      {base > 0 && (
        <View
          style={[
            styles.base,
            { width: pct(base), backgroundColor: `${color}73` },
            over > 0 && styles.baseJoined,
          ]}
        />
      )}
      {over > 0 && (
        <View
          style={[styles.over, { left: TICK_AT, width: pct(over), backgroundColor: color }]}
        />
      )}
      {clipped && <View style={styles.notch} />}
      {/* A sibling of the track, not a child: nothing here clips, so the
          tick can stand taller than the bar on Android too. */}
      <View style={[styles.tick, { left: TICK_AT }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: 14, position: 'relative' },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 3,
    height: 8,
    borderRadius: 4,
  },
  base: {
    position: 'absolute',
    left: 0,
    top: 3,
    height: 8,
    minWidth: 4,
    borderRadius: 4,
  },
  baseJoined: { borderTopRightRadius: 0, borderBottomRightRadius: 0 },
  over: {
    position: 'absolute',
    top: 3,
    height: 8,
    // A few XP past the ruler would otherwise hide under the 2dp tick.
    minWidth: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  notch: {
    position: 'absolute',
    right: 6,
    top: 3,
    width: 2,
    height: 8,
    backgroundColor: tokens.bg.deep,
  },
  tick: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: 14,
    marginLeft: -1,
    borderRadius: 1,
    backgroundColor: tokens.text.hi,
    opacity: 0.6,
  },
});
