import { type ReactNode, useEffect, useRef } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useTourTargetsStore } from '@/lib/tour/targets';

/**
 * Wraps the element a tour step spotlights. Inert unless its `id` is the
 * currently-active tour target; then it:
 *
 *   1. measures itself in window coordinates and publishes the rect so
 *      the `SpotlightBackdrop` can cut its dim-layer hole around it, and
 *   2. renders a pulsing gold ring around its own children — locally,
 *      so the ring survives any z-order fight (e.g. the floating
 *      BottomNavBar renders ABOVE screen-level overlays; a ring drawn
 *      by the backdrop would be buried under the bar, one drawn here
 *      glows on top of it).
 *
 * Purely visual: the ring has `pointerEvents: 'none'` and the wrapper
 * never intercepts touches, so the tour's real-gesture model is intact.
 */

interface Props {
  id: string;
  children: ReactNode;
  /** Layout style for the wrapper (e.g. `{ flex: 1 }` inside rows). */
  style?: StyleProp<ViewStyle>;
  /** Ring corner radius — match the child's borderRadius. */
  radius?: number;
}

const RING_COLOR = '#FFC83D';
const RING_INSET = -5; // ring floats just outside the child bounds

export function TourTarget({ id, children, style, radius = 16 }: Props) {
  const ref = useRef<View>(null);
  const isActive = useTourTargetsStore((s) => s.activeTargetId === id);
  const measureTick = useTourTargetsStore((s) => s.measureTick);

  // Measure while active — on activation, on every remeasure tick, and
  // (via onLayout → tick) on layout changes. Small delay lets the frame
  // settle before reading coordinates.
  useEffect(() => {
    if (!isActive) return;
    const timer = setTimeout(() => {
      ref.current?.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          useTourTargetsStore.getState().setRect(id, { x, y, width, height });
        }
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [isActive, measureTick, id]);

  // Drop the published rect once this target stops being spotlighted so
  // the backdrop never cuts a hole around a stale position.
  useEffect(() => {
    if (!isActive) return;
    return () => useTourTargetsStore.getState().clearRect(id);
  }, [isActive, id]);

  // Pulsing ring opacity — only animates while visible.
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (!isActive) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
    return () => {
      pulse.value = 1;
    };
  }, [isActive, pulse]);

  const ringStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View
      ref={ref}
      collapsable={false}
      style={style}
      onLayout={() => {
        // Re-measure through the shared tick so window coords (not just
        // local layout) get refreshed.
        if (useTourTargetsStore.getState().activeTargetId === id) {
          useTourTargetsStore.getState().requestRemeasure();
        }
      }}
    >
      {children}
      {isActive && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            { borderRadius: radius },
            ringStyle,
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    top: RING_INSET,
    left: RING_INSET,
    right: RING_INSET,
    bottom: RING_INSET,
    borderWidth: 2.5,
    borderColor: RING_COLOR,
    // Soft glow — iOS shadow; Android relies on the bright stroke alone
    // (elevation would draw a rect shadow behind the transparent ring).
    shadowColor: RING_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
});
