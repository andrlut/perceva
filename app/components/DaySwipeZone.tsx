import * as Haptics from 'expo-haptics';
import { useMemo, type ReactNode } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

/**
 * A horizontal swipe that steps days — the top of the Home (header + the
 * strips above the first practice). Right = previous day, left = next day
 * (like turning pages). It wraps ONLY what sits above the practice list:
 * each TaskCard has its own horizontal swipe (complete / skip), and the two
 * must never compete for the same finger.
 *
 * Tuned to stay out of the vertical scroll's way: it activates only after
 * 24px of horizontal travel and fails after 12px of vertical travel; it
 * commits past 60px, or on a flick.
 */
const ACTIVATE_X = 24;
const FAIL_Y = 12;
const COMMIT_X = 60;
const COMMIT_VELOCITY = 600;

export function DaySwipeZone({
  onPrev,
  onNext,
  canNext,
  children,
}: {
  onPrev: () => void;
  onNext: () => void;
  canNext: boolean;
  children: ReactNode;
}) {
  const gesture = useMemo(() => {
    const step = (dir: -1 | 1) => {
      if (dir === 1 && !canNext) return;
      Haptics.selectionAsync().catch(() => {});
      if (dir === 1) onNext();
      else onPrev();
    };
    return Gesture.Pan()
      .activeOffsetX([-ACTIVATE_X, ACTIVATE_X])
      .failOffsetY([-FAIL_Y, FAIL_Y])
      .onEnd((e) => {
        const x = e.translationX;
        const flick = Math.abs(e.velocityX) > COMMIT_VELOCITY;
        if (x > COMMIT_X || (flick && e.velocityX > 0 && x > 0)) runOnJS(step)(-1);
        else if (x < -COMMIT_X || (flick && e.velocityX < 0 && x < 0)) runOnJS(step)(1);
      });
  }, [onPrev, onNext, canNext]);

  return <GestureDetector gesture={gesture}>{children}</GestureDetector>;
}
