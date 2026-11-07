import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import type { DimensionId, SubId } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { tokens } from '@/theme';
import { DIMENSION_META, DIMENSION_ORDER, SUBS_BY_DIM, SUB_META } from '@/theme/dimensions';

/**
 * The short "6 areas" animation that opens the starter pack (Onboarding
 * simples, decided 2026-10-19): before the 12-practice selector, the six
 * areas of life bloom in one by one around a ring, then each sprouts its
 * two sub-areas — the vocabulary the selector is about to use. About three
 * seconds; the counter in the middle goes 1…6, then 12.
 *
 * Pure Reanimated, one shared value per element (each element is its own
 * component so the hooks stay flat). `onReady` fires once the loop is
 * done — the host shows its button then. Reduced motion: final state at
 * once, `onReady` immediately.
 */

const AREA_STEP = 260;
const AREA_DUR = 420;
const SUBS_AT = 1900;
const SUB_STEP = 110;
const SUB_DUR = 360;
/** When the loop is over (last sub landed + a beat). */
export const AREAS_REVEAL_MS = SUBS_AT + 5 * SUB_STEP + SUB_DUR + 450;

const BADGE = 52;
const SUB = 24;

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

export function AreasReveal({
  size,
  onReady,
}: {
  /** Stage side in px (square). */
  size: number;
  onReady: () => void;
}) {
  const { t } = useT();
  const meta = useMetaLookup();
  const reduceMotion = useReducedMotion();

  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.36;
  const RS = size * 0.205;

  // The counter in the middle is plain state on a JS timer: six ticks and
  // one jump, nothing a frame could miss.
  const [count, setCount] = useState<{ n: number; subs: boolean }>(
    reduceMotion ? { n: 12, subs: true } : { n: 0, subs: false },
  );

  useEffect(() => {
    if (reduceMotion) {
      onReady();
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    DIMENSION_ORDER.forEach((_, i) => {
      timers.push(setTimeout(() => setCount({ n: i + 1, subs: false }), i * AREA_STEP + 220));
    });
    timers.push(setTimeout(() => setCount({ n: 12, subs: true }), SUBS_AT + 3 * SUB_STEP));
    timers.push(setTimeout(onReady, AREAS_REVEAL_MS));
    return () => timers.forEach(clearTimeout);
    // Runs once per mount: the loop is not restarted by a parent re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  return (
    <View style={{ width: size, height: size }} accessible accessibilityLabel={t('tour.pack.areas.a11y')}>
      {DIMENSION_ORDER.map((id, i) => {
        const deg = -90 + 60 * i;
        const p = polar(cx, cy, R, deg);
        const [subA, subB] = SUBS_BY_DIM[id];
        const a = polar(cx, cy, RS, deg - 24);
        const b = polar(cx, cy, RS, deg + 24);
        return (
          <View key={id} style={StyleSheet.absoluteFill} pointerEvents="none">
            <AreaBadge id={id} index={i} x={p.x} y={p.y} label={meta.dim(id).label} reduce={reduceMotion} />
            <SubDot id={subA} index={i} x={a.x} y={a.y} reduce={reduceMotion} />
            <SubDot id={subB} index={i} x={b.x} y={b.y} reduce={reduceMotion} />
          </View>
        );
      })}

      {/* The counter: 1…6 areas, then 12 sub-areas. */}
      <View style={[styles.center, { left: cx - 44, top: cy - 26 }]} pointerEvents="none">
        {count.n > 0 ? (
          <Animated.View key={count.subs ? 'subs' : 'areas'} entering={FadeIn.duration(180)} style={styles.centerInner}>
            <Text style={[styles.count, count.subs && styles.countSubs]}>{count.n}</Text>
            <Text style={styles.countLabel}>
              {t(count.subs ? 'tour.pack.areas.countSubs' : 'tour.pack.areas.countAreas')}
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

function AreaBadge({
  id,
  index,
  x,
  y,
  label,
  reduce,
}: {
  id: DimensionId;
  index: number;
  x: number;
  y: number;
  label: string;
  reduce: boolean;
}) {
  const dim = DIMENSION_META[id];
  const v = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    if (reduce) return;
    v.value = withDelay(
      index * AREA_STEP,
      withTiming(1, { duration: AREA_DUR, easing: Easing.out(Easing.back(1.8)) }),
    );
  }, [reduce, index, v]);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(v.value, [0, 0.35, 1], [0, 1, 1]),
    transform: [{ scale: interpolate(v.value, [0, 1], [0.3, 1]) }],
  }));
  return (
    <Animated.View style={[styles.badgeWrap, { left: x - BADGE / 2, top: y - BADGE / 2 }, style]}>
      <View
        style={[
          styles.badge,
          { backgroundColor: dim.bg, borderColor: `${dim.color}80`, shadowColor: dim.color },
        ]}
      >
        <Ionicons name={dim.iconName as keyof typeof Ionicons.glyphMap} size={24} color={dim.color} />
      </View>
      <Text style={[styles.badgeLabel, { color: dim.color }]} numberOfLines={1}>
        {label}
      </Text>
    </Animated.View>
  );
}

function SubDot({
  id,
  index,
  x,
  y,
  reduce,
}: {
  id: SubId;
  index: number;
  x: number;
  y: number;
  reduce: boolean;
}) {
  const sub = SUB_META[id];
  const dim = DIMENSION_META[sub.dimensionId];
  const v = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    if (reduce) return;
    v.value = withDelay(
      SUBS_AT + index * SUB_STEP,
      withTiming(1, { duration: SUB_DUR, easing: Easing.out(Easing.back(1.6)) }),
    );
  }, [reduce, index, v]);
  const style = useAnimatedStyle(() => ({
    opacity: v.value,
    transform: [{ scale: interpolate(v.value, [0, 1], [0.2, 1]) }],
  }));
  return (
    <Animated.View
      style={[
        styles.sub,
        { left: x - SUB / 2, top: y - SUB / 2, backgroundColor: dim.bg, borderColor: `${dim.color}66` },
        style,
      ]}
    >
      <Ionicons name={sub.iconName as keyof typeof Ionicons.glyphMap} size={12} color={dim.color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badgeWrap: {
    position: 'absolute',
    width: BADGE,
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
  },
  badgeLabel: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.2,
    width: 96,
    textAlign: 'center',
  },
  sub: {
    position: 'absolute',
    width: SUB,
    height: SUB,
    borderRadius: SUB / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    width: 88,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerInner: { alignItems: 'center' },
  count: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 30,
    lineHeight: 34,
    color: tokens.text.hi,
    fontVariant: ['tabular-nums'],
  },
  countSubs: { color: tokens.brand.violet2 },
  countLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    lineHeight: 14,
    color: tokens.text.mid,
    letterSpacing: 0.3,
  },
});
