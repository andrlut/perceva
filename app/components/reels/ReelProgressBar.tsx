import { StyleSheet, View } from 'react-native';

/**
 * Instagram-style segmented progress bar, discrete on purpose — there are
 * no timers in Study Reels, so a segment is either done, current, or ahead.
 * Past + current render filled, future segments stay as faint tracks.
 */

interface Props {
  count: number;
  /** Segments 0..activeIndex render filled. */
  activeIndex: number;
}

export function ReelProgressBar({ count, activeIndex }: Props) {
  return (
    // Never a hit-target — a tap on the bar must fall through the chrome
    // to the page's advance/retreat zones underneath.
    <View style={styles.row} pointerEvents="none">
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.seg, i <= activeIndex && styles.segFilled]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  seg: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  segFilled: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
});
