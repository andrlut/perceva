import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';
import { DIMENSION_META, DIMENSION_ORDER, SUB_META, SUBS_BY_DIM } from '@/theme/dimensions';

const LOOP_MS = 8000;
const RING_R = 92;
const SUB_R = 132;
const SIZE = 300;
const OPTIONS = ['opt1', 'opt2', 'opt3', 'opt4', 'opt5'] as const;
const PICKED = 3;

/**
 * Door animation for Eu: what the tab is made of, in the order the user
 * meets it.
 *
 *   0.00–0.20  six areas on a ring (the 6 dimensions, their colours)
 *   0.20–0.42  each area splits in two: the 12 sub-areas slide outward
 *   0.42–0.70  a questionnaire item slides up; one answer gets picked
 *   0.70–0.94  the Eu badge row pulses with a tap ripple: it opens the profile
 *   0.94–1.00  fade out, loop
 */
export function MeDoorVisual({ width }: { width: number }) {
  const { t } = useT();
  const reduceMotion = useReducedMotion();
  const p = useSharedValue(0);
  const k = Math.min(1, width / SIZE);

  useEffect(() => {
    if (reduceMotion) {
      p.value = 0.38; // the 12 sub-areas, static
      return;
    }
    p.value = 0;
    p.value = withRepeat(withTiming(1, { duration: LOOP_MS, easing: Easing.linear }), -1, false);
  }, [p, reduceMotion]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.06, 0.4, 0.48], [0, 1, 1, 0], 'clamp'),
    transform: [{ scale: interpolate(p.value, [0, 0.08], [0.85, 1], 'clamp') }],
  }));
  const captionAreasStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.02, 0.08, 0.18, 0.22], [0, 1, 1, 0], 'clamp'),
  }));
  const captionSubsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.24, 0.3, 0.4, 0.46], [0, 1, 1, 0], 'clamp'),
  }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.44, 0.5, 0.66, 0.7], [0, 1, 1, 0], 'clamp'),
    transform: [{ translateY: interpolate(p.value, [0.44, 0.52], [40, 0], 'clamp') }],
  }));
  const badgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.7, 0.76, 0.92, 0.97], [0, 1, 1, 0], 'clamp'),
    transform: [
      { translateY: interpolate(p.value, [0.7, 0.78], [24, 0], 'clamp') },
      { scale: interpolate(p.value, [0.84, 0.87, 0.9], [1, 0.97, 1], 'clamp') },
    ],
  }));
  const rippleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.84, 0.86, 0.92], [0, 0.6, 0], 'clamp'),
    transform: [{ scale: interpolate(p.value, [0.84, 0.92], [0.4, 2.2], 'clamp') }],
  }));
  const badgeHintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.86, 0.9, 0.94, 0.97], [0, 1, 1, 0], 'clamp'),
  }));

  return (
    <View style={[styles.root, { width, height: SIZE * k }]}>
      {/* Stage 1 + 2: the ring of areas and the sub-areas around it */}
      <Animated.View style={[styles.stage, ringStyle]}>
        {DIMENSION_ORDER.map((dim, i) => {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / DIMENSION_ORDER.length;
          const [subA, subB] = SUBS_BY_DIM[dim];
          return (
            <View key={dim}>
              <DimDot
                p={p}
                color={DIMENSION_META[dim].color}
                icon={DIMENSION_META[dim].iconName}
                x={SIZE / 2 + RING_R * k * Math.cos(angle)}
                y={SIZE / 2 + RING_R * k * Math.sin(angle)}
                k={k}
              />
              <SubDot
                p={p}
                color={DIMENSION_META[dim].color}
                icon={SUB_META[subA].iconName}
                fromX={SIZE / 2 + RING_R * k * Math.cos(angle)}
                fromY={SIZE / 2 + RING_R * k * Math.sin(angle)}
                toX={SIZE / 2 + SUB_R * k * Math.cos(angle - 0.22)}
                toY={SIZE / 2 + SUB_R * k * Math.sin(angle - 0.22)}
                k={k}
              />
              <SubDot
                p={p}
                color={DIMENSION_META[dim].color}
                icon={SUB_META[subB].iconName}
                fromX={SIZE / 2 + RING_R * k * Math.cos(angle)}
                fromY={SIZE / 2 + RING_R * k * Math.sin(angle)}
                toX={SIZE / 2 + SUB_R * k * Math.cos(angle + 0.22)}
                toY={SIZE / 2 + SUB_R * k * Math.sin(angle + 0.22)}
                k={k}
              />
            </View>
          );
        })}
        <Animated.Text style={[styles.caption, captionAreasStyle]}>
          {t('unlock.visual.me.areas')}
        </Animated.Text>
        <Animated.Text style={[styles.caption, captionSubsStyle]}>
          {t('unlock.visual.me.subs')}
        </Animated.Text>
      </Animated.View>

      {/* Stage 3: a questionnaire item, one answer picked */}
      <Animated.View style={[styles.card, cardStyle]}>
        <Text style={styles.cardKicker}>{t('unlock.visual.me.kicker')}</Text>
        <Text style={styles.cardQuestion}>{t('unlock.visual.me.question')}</Text>
        <View style={styles.options}>
          {OPTIONS.map((key, i) => (
            <OptionPill key={key} p={p} index={i} label={t(`unlock.visual.me.${key}`)} />
          ))}
        </View>
      </Animated.View>

      {/* Stage 4: the Eu badge — tapping it opens the profile */}
      <Animated.View style={[styles.badgeWrap, badgeStyle]}>
        <View style={styles.badgeRow}>
          <View style={styles.emblem}>
            <Animated.View style={[styles.ripple, rippleStyle]} />
            <View style={[styles.ring, { width: 46, height: 46, borderRadius: 23 }]} />
            <View style={[styles.ring, { width: 32, height: 32, borderRadius: 16 }]} />
            <View style={styles.core} />
          </View>
          <View style={styles.badgeText}>
            <Text style={styles.badgeLv}>LV 1</Text>
            <Text style={styles.badgeName}>{t('unlock.visual.me.badgeName')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={tokens.text.mid} />
        </View>
        <Animated.Text style={[styles.badgeHint, badgeHintStyle]}>
          {t('unlock.visual.me.badgeHint')}
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

function DimDot({
  p,
  color,
  icon,
  x,
  y,
  k,
}: {
  p: SharedValue<number>;
  color: string;
  icon: string;
  x: number;
  y: number;
  k: number;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(p.value, [0.2, 0.3], [1, 0.8], 'clamp') }],
    opacity: interpolate(p.value, [0.2, 0.3], [1, 0.55], 'clamp'),
  }));
  const d = 40 * k;
  return (
    <Animated.View
      style={[
        styles.dot,
        { left: x - d / 2, top: y - d / 2, width: d, height: d, borderRadius: d / 2, borderColor: color, backgroundColor: `${color}33` },
        style,
      ]}
    >
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18 * k} color={color} />
    </Animated.View>
  );
}

function SubDot({
  p,
  color,
  icon,
  fromX,
  fromY,
  toX,
  toY,
  k,
}: {
  p: SharedValue<number>;
  color: string;
  icon: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  k: number;
}) {
  const style = useAnimatedStyle(() => {
    const m = interpolate(p.value, [0.2, 0.34], [0, 1], 'clamp');
    return {
      opacity: interpolate(p.value, [0.2, 0.28], [0, 1], 'clamp'),
      transform: [
        { translateX: (toX - fromX) * m },
        { translateY: (toY - fromY) * m },
        { scale: interpolate(p.value, [0.2, 0.34], [0.3, 1], 'clamp') },
      ],
    };
  });
  const d = 28 * k;
  return (
    <Animated.View
      style={[
        styles.dot,
        { left: fromX - d / 2, top: fromY - d / 2, width: d, height: d, borderRadius: d / 2, borderColor: color, backgroundColor: tokens.bg.surface },
        style,
      ]}
    >
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={13 * k} color={color} />
    </Animated.View>
  );
}

function OptionPill({ p, index, label }: { p: SharedValue<number>; index: number; label: string }) {
  const picked = index === PICKED;
  const style = useAnimatedStyle(() => {
    const on = picked ? interpolate(p.value, [0.56, 0.6], [0, 1], 'clamp') : 0;
    return {
      backgroundColor: on > 0.5 ? tokens.brand.violet : tokens.bg.surface2,
      transform: [{ scale: picked ? interpolate(p.value, [0.56, 0.59, 0.62], [1, 1.08, 1], 'clamp') : 1 }],
    };
  });
  return (
    <Animated.View style={[styles.pill, style]}>
      <Text style={styles.pillText} numberOfLines={1}>
        {label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { alignSelf: 'center', justifyContent: 'center' },
  stage: { ...StyleSheet.absoluteFillObject },
  dot: {
    position: 'absolute',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '46%',
    textAlign: 'center',
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: tokens.text.hi,
  },
  card: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: '18%',
    padding: 16,
    gap: 10,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.strong,
  },
  cardKicker: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: tokens.brand.violet2,
    letterSpacing: 0.4,
  },
  cardQuestion: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    lineHeight: 22,
    color: tokens.text.hi,
  },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  pillText: { fontFamily: 'Manrope_600SemiBold', fontSize: 12, color: tokens.text.hi },
  badgeWrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: '30%',
    gap: 10,
    alignItems: 'center',
  },
  badgeRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.strong,
  },
  emblem: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  ripple: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: tokens.semantic.coinGlow,
  },
  ring: { position: 'absolute', borderWidth: 1.5, borderColor: tokens.semantic.coinRim },
  core: { width: 10, height: 10, borderRadius: 5, backgroundColor: tokens.semantic.coin },
  badgeText: { flex: 1, gap: 2 },
  badgeLv: { fontFamily: 'Manrope_700Bold', fontSize: 11, color: tokens.text.mid, letterSpacing: 0.6 },
  badgeName: { fontFamily: 'Manrope_800ExtraBold', fontSize: 16, color: tokens.text.hi },
  badgeHint: { fontFamily: 'Manrope_600SemiBold', fontSize: 13, color: tokens.semantic.coinLight },
});
