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

const LOOP_MS = 11000;
const RING_R = 92;
const SUB_R = 132;
const SIZE = 300;
const OPTIONS = ['opt1', 'opt2', 'opt3', 'opt4', 'opt5'] as const;
const PICKED = 3;

/**
 * Door animation for Eu. First what the tab measures, then the tab itself,
 * laid out like the real screen so the door doubles as a map of where to
 * tap (feedback 24/10).
 *
 *   0.00–0.14  six areas on a ring (the 6 dimensions, their colours)
 *   0.14–0.30  each area splits in two: the 12 sub-areas slide outward
 *   0.30–0.40  the mock Eu screen slides in: hero row, portrait switcher
 *              (Percebida active), the questionnaire card
 *   0.40–0.50  the card's button pulses, a tap ripple, hint "it lives here"
 *   0.50–0.66  a questionnaire item over the screen, one answer picked
 *   0.66–0.90  back to the screen: the emblem pulses with a tap ripple,
 *              hint "tap it to open your profile"
 *   0.90–1.00  fade out, loop
 */
export function MeDoorVisual({ width }: { width: number }) {
  const { t } = useT();
  const reduceMotion = useReducedMotion();
  const p = useSharedValue(0);
  const k = Math.min(1, width / SIZE);

  useEffect(() => {
    if (reduceMotion) {
      p.value = 0.44; // the mock screen with the questionnaire card, static
      return;
    }
    p.value = 0;
    p.value = withRepeat(withTiming(1, { duration: LOOP_MS, easing: Easing.linear }), -1, false);
  }, [p, reduceMotion]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.04, 0.28, 0.34], [0, 1, 1, 0], 'clamp'),
    transform: [{ scale: interpolate(p.value, [0, 0.06], [0.85, 1], 'clamp') }],
  }));
  const captionAreasStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.02, 0.06, 0.12, 0.15], [0, 1, 1, 0], 'clamp'),
  }));
  const captionSubsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.17, 0.21, 0.28, 0.32], [0, 1, 1, 0], 'clamp'),
  }));
  const screenStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.3, 0.36, 0.92, 0.97], [0, 1, 1, 0], 'clamp'),
    transform: [{ translateY: interpolate(p.value, [0.3, 0.38], [30, 0], 'clamp') }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(p.value, [0.4, 0.43, 0.46, 0.49], [1, 1.08, 1, 1.06], 'clamp') }],
  }));
  const ctaRippleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.46, 0.48, 0.52], [0, 0.55, 0], 'clamp'),
    transform: [{ scale: interpolate(p.value, [0.46, 0.52], [0.5, 2.4], 'clamp') }],
  }));
  const ctaHintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.4, 0.43, 0.5, 0.53], [0, 1, 1, 0], 'clamp'),
  }));
  const itemStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.51, 0.55, 0.64, 0.67], [0, 1, 1, 0], 'clamp'),
    transform: [{ translateY: interpolate(p.value, [0.51, 0.56], [40, 0], 'clamp') }],
  }));
  const emblemStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(p.value, [0.72, 0.75, 0.78], [1, 0.94, 1], 'clamp') }],
  }));
  const emblemRippleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.74, 0.76, 0.84], [0, 0.6, 0], 'clamp'),
    transform: [{ scale: interpolate(p.value, [0.74, 0.84], [0.4, 2.4], 'clamp') }],
  }));
  const badgeHintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.76, 0.8, 0.88, 0.92], [0, 1, 1, 0], 'clamp'),
  }));

  return (
    <View style={[styles.root, { width, height: SIZE * k }]}>
      {/* Stage 1 + 2: the ring of areas and the sub-areas around it */}
      <Animated.View style={[styles.stage, ringStyle]}>
        {DIMENSION_ORDER.map((dim, i) => {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / DIMENSION_ORDER.length;
          const [subA, subB] = SUBS_BY_DIM[dim];
          const cx = SIZE / 2 + RING_R * k * Math.cos(angle);
          const cy = SIZE / 2 + RING_R * k * Math.sin(angle);
          return (
            <View key={dim}>
              <DimDot p={p} color={DIMENSION_META[dim].color} icon={DIMENSION_META[dim].iconName} x={cx} y={cy} k={k} />
              <SubDot
                p={p}
                color={DIMENSION_META[dim].color}
                icon={SUB_META[subA].iconName}
                fromX={cx}
                fromY={cy}
                toX={SIZE / 2 + SUB_R * k * Math.cos(angle - 0.22)}
                toY={SIZE / 2 + SUB_R * k * Math.sin(angle - 0.22)}
                k={k}
              />
              <SubDot
                p={p}
                color={DIMENSION_META[dim].color}
                icon={SUB_META[subB].iconName}
                fromX={cx}
                fromY={cy}
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

      {/* Stage 3 + 4 + 6: the Eu screen, as it really is laid out */}
      <Animated.View style={[styles.screen, screenStyle]}>
        {/* Hero row — the emblem opens the profile */}
        <View style={styles.heroRow}>
          <Animated.View style={[styles.emblem, emblemStyle]}>
            <Animated.View style={[styles.ripple, emblemRippleStyle]} />
            <View style={[styles.ring, { width: 44, height: 44, borderRadius: 22 }]} />
            <View style={[styles.ring, { width: 30, height: 30, borderRadius: 15 }]} />
            <View style={styles.core} />
          </Animated.View>
          <View style={styles.heroText}>
            <Text style={styles.heroLv}>LV 1</Text>
            <Text style={styles.heroName} numberOfLines={1}>
              {t('unlock.visual.me.badgeName')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={tokens.text.mid} />
        </View>

        {/* Portrait switcher — Percebida active, the others still locked */}
        <View style={styles.switcher}>
          <View style={[styles.switch, styles.switchOn]}>
            <Ionicons name="eye-outline" size={18} color={tokens.brand.violet2} />
          </View>
          <View style={styles.switch}>
            <Ionicons name="pulse" size={18} color={tokens.text.dim} />
            <Ionicons name="lock-closed" size={9} color={tokens.text.mid} style={styles.switchLock} />
          </View>
          <View style={styles.switch}>
            <Ionicons name="compass-outline" size={18} color={tokens.text.dim} />
            <Ionicons name="lock-closed" size={9} color={tokens.text.mid} style={styles.switchLock} />
          </View>
        </View>

        {/* The questionnaire card — same shape as the real one */}
        <View style={styles.questCard}>
          <View style={styles.questIcon}>
            <Ionicons name="clipboard-outline" size={18} color={tokens.semantic.coinLight} />
          </View>
          <View style={styles.questBody}>
            <Text style={styles.questTitle} numberOfLines={1}>
              {t('avaliacao.questCardTitle')}
            </Text>
            <Text style={styles.questLine} numberOfLines={1}>
              48 · 5–10 min
            </Text>
          </View>
          <Animated.View style={[styles.questBtn, ctaStyle]}>
            <Animated.View style={[styles.rippleGold, ctaRippleStyle]} />
            <Text style={styles.questBtnText}>{t('avaliacao.questCardCta')}</Text>
          </Animated.View>
        </View>
        <Animated.Text style={[styles.hint, ctaHintStyle]}>
          {t('unlock.visual.me.ctaHint')}
        </Animated.Text>
        <Animated.Text style={[styles.hint, styles.hintTop, badgeHintStyle]}>
          {t('unlock.visual.me.badgeHint')}
        </Animated.Text>
      </Animated.View>

      {/* Stage 5: a questionnaire item, one answer picked */}
      <Animated.View style={[styles.item, itemStyle]}>
        <Text style={styles.itemKicker}>{t('unlock.visual.me.kicker')}</Text>
        <Text style={styles.itemQuestion}>{t('unlock.visual.me.question')}</Text>
        <View style={styles.options}>
          {OPTIONS.map((key, i) => (
            <OptionPill key={key} p={p} index={i} label={t(`unlock.visual.me.${key}`)} />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

function DimDot({ p, color, icon, x, y, k }: { p: SharedValue<number>; color: string; icon: string; x: number; y: number; k: number }) {
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(p.value, [0.14, 0.22], [1, 0.8], 'clamp') }],
    opacity: interpolate(p.value, [0.14, 0.22], [1, 0.55], 'clamp'),
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

function SubDot({ p, color, icon, fromX, fromY, toX, toY, k }: { p: SharedValue<number>; color: string; icon: string; fromX: number; fromY: number; toX: number; toY: number; k: number }) {
  const style = useAnimatedStyle(() => {
    const m = interpolate(p.value, [0.14, 0.26], [0, 1], 'clamp');
    return {
      opacity: interpolate(p.value, [0.14, 0.2], [0, 1], 'clamp'),
      transform: [
        { translateX: (toX - fromX) * m },
        { translateY: (toY - fromY) * m },
        { scale: interpolate(p.value, [0.14, 0.26], [0.3, 1], 'clamp') },
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
    const on = picked ? interpolate(p.value, [0.59, 0.61], [0, 1], 'clamp') : 0;
    return {
      backgroundColor: on > 0.5 ? tokens.brand.violet : tokens.bg.surface2,
      transform: [{ scale: picked ? interpolate(p.value, [0.59, 0.61, 0.64], [1, 1.08, 1], 'clamp') : 1 }],
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
  dot: { position: 'absolute', borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
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
  screen: {
    ...StyleSheet.absoluteFillObject,
    padding: 10,
    gap: 10,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.bg.deep,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  emblem: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  ripple: { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: tokens.semantic.coinGlow },
  rippleGold: { position: 'absolute', alignSelf: 'center', width: 36, height: 36, borderRadius: 18, backgroundColor: tokens.semantic.coinGlow },
  ring: { position: 'absolute', borderWidth: 1.5, borderColor: tokens.semantic.coinRim },
  core: { width: 9, height: 9, borderRadius: 5, backgroundColor: tokens.semantic.coin },
  heroText: { flex: 1, gap: 1 },
  heroLv: { fontFamily: 'Manrope_700Bold', fontSize: 10, color: tokens.text.mid, letterSpacing: 0.6 },
  heroName: { fontFamily: 'Manrope_800ExtraBold', fontSize: 15, color: tokens.text.hi },
  switcher: { flexDirection: 'row', gap: 6 },
  switch: {
    flex: 1,
    height: 38,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.border.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchOn: { backgroundColor: 'rgba(155, 130, 255, 0.18)', borderColor: 'rgba(155, 130, 255, 0.35)' },
  switchLock: { position: 'absolute', top: 4, right: 6 },
  questCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1.5,
    borderColor: tokens.semantic.coinRim,
  },
  questIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 200, 61, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questBody: { flex: 1, gap: 1 },
  questTitle: { fontFamily: 'Manrope_800ExtraBold', fontSize: 12.5, color: tokens.text.hi },
  questLine: { fontFamily: 'Manrope_500Medium', fontSize: 11, color: tokens.text.mid },
  questBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.semantic.coin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questBtnText: { fontFamily: 'Manrope_800ExtraBold', fontSize: 12, color: tokens.bg.deep },
  hint: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    textAlign: 'center',
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12.5,
    color: tokens.semantic.coinLight,
  },
  hintTop: { bottom: undefined, top: 56 },
  item: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: '22%',
    padding: 14,
    gap: 8,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.strong,
  },
  itemKicker: { fontFamily: 'Manrope_700Bold', fontSize: 11, color: tokens.brand.violet2, letterSpacing: 0.4 },
  itemQuestion: { fontFamily: 'Manrope_700Bold', fontSize: 15, lineHeight: 21, color: tokens.text.hi },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  pill: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: tokens.radius.pill, borderWidth: 1, borderColor: tokens.border.base },
  pillText: { fontFamily: 'Manrope_600SemiBold', fontSize: 11.5, color: tokens.text.hi },
});
