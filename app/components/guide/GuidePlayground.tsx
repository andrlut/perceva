import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { tokens } from '@/theme';

/**
 * The playground of a screen's guide — the "try it here" box where the
 * screen's REAL element answers its real gestures (docs/informativo-de-
 * tela.md). Shared by every guide so the box, the gesture rows and the
 * pulsing hand look the same on every screen:
 *
 *   <GuidePlayground>
 *     <View>{live element}{!tried && <GuideTapHint />}</View>
 *     <View style={{ flex: 1 }}>
 *       <GuideTryIt>…</GuideTryIt>
 *       <GuideGesture icon=… title=… body=… />
 *     </View>
 *   </GuidePlayground>
 *
 * `column` stacks instead of sitting side by side — for a live element that
 * is wide (a practice card, a reward tile) rather than a 4:5 card.
 */
export function GuidePlayground({
  children,
  column = false,
  style,
}: {
  children: React.ReactNode;
  column?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.box, column && styles.column, style]}>{children}</View>;
}

/** The violet "Experimente…" line over the gestures. */
export function GuideTryIt({ children }: { children: string }) {
  return <Text style={styles.tryIt}>{children}</Text>;
}

/** One gesture: icon, verb, what it does. */
export function GuideGesture({
  icon,
  title,
  body,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.gesture}>
      <Ionicons name={icon} size={16} color={tokens.brand.violet2} style={styles.gestureIcon} />
      <View style={styles.gestureCol}>
        <Text style={styles.gestureTitle}>{title}</Text>
        <Text style={styles.gestureBody}>{body}</Text>
      </View>
    </View>
  );
}

/** The hand that pulses on the live element until the first try. Its parent
 *  must be the element's wrapper (it sits on the top-right corner). Still
 *  under reduced motion; never takes a touch. */
export function GuideTapHint({ style }: { style?: StyleProp<ViewStyle> }) {
  const reduce = useReducedMotion();
  const scale = useSharedValue(1);
  useEffect(() => {
    if (reduce) return;
    scale.value = withRepeat(
      withSequence(withTiming(1.18, { duration: 650 }), withTiming(1, { duration: 650 })),
      -1,
    );
    return () => cancelAnimation(scale);
  }, [reduce, scale]);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View pointerEvents="none" style={[styles.tapHint, style, animated]}>
      <Ionicons name="hand-left" size={14} color={tokens.text.hi} />
    </Animated.View>
  );
}

/** A row of gesture lines under a wide live element (column playgrounds). */
export function GuideGestureRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.gestureRow}>{children}</View>;
}

const styles = StyleSheet.create({
  // A tinted box so it reads as "try here", not as text.
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    padding: tokens.space[3],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(155, 130, 255, 0.35)',
    backgroundColor: 'rgba(123, 92, 255, 0.07)',
  },
  column: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  tryIt: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    letterSpacing: 0.3,
    color: tokens.brand.violet2,
  },
  gesture: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  gestureIcon: { marginTop: 1 },
  gestureCol: { flex: 1, minWidth: 0, gap: 1 },
  gestureTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    color: tokens.text.hi,
  },
  gestureBody: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 17,
    color: tokens.text.base,
  },
  gestureRow: { gap: 10 },
  tapHint: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.brand.violet,
    borderWidth: 2,
    borderColor: tokens.bg.surface,
  },
});
