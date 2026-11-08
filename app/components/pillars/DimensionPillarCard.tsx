import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { LinearTransition, useReducedMotion } from 'react-native-reanimated';

import { pct } from '@/lib/dedicacao/scale';
import type { DimensionId, SubId } from '@/lib/db/types';
import { useMetaLookup } from '@/lib/i18n/meta';
import { ACTIVE_THEME, tokens } from '@/theme';
import { DIMENSION_META } from '@/theme/dimensions';

export interface PillarCardSub {
  subId: SubId;
  /** The number beside the sub's name, pre-formatted ("420", "3,5 → 4,5"). */
  value: string;
  /** Lights the number in the dimension's color (Praticada: past the ruler). */
  reached?: boolean;
  /** Nothing there yet — the number fades. */
  faint?: boolean;
  /** The bar under the name. Each pillar draws its own ruler. */
  bar: ReactNode;
  a11yLabel?: string;
}

interface Props {
  dimId: DimensionId;
  /** The dimension's reading in this pillar, big and neutral. */
  value: string;
  /** Small dim suffix after the value (" XP", "/10"). */
  unit?: string;
  faint?: boolean;
  subs: PillarCardSub[];
  onPress: () => void;
  /** Set → the card is an accordion (chevron up/down) and `children` render
   *  under a divider while open. Unset → the tap navigates (chevron →). */
  expanded?: boolean;
  children?: ReactNode;
}

/**
 * One dimension card of the Eu tab — the anatomy born in Praticada and now
 * shared by the three portraits, so they read as one screen: icon halo ·
 * name · the pillar's number, then one row per sub (name and number over
 * its bar).
 *
 * Purely presentational: every number arrives formatted and every bar
 * arrives drawn. Praticada passes XP over the ruler's SubBar and opens in
 * place; Percebida and Desejada pass 0..5 scores over a ScoreBar and open
 * the area.
 */
export function DimensionPillarCard({
  dimId,
  value,
  unit,
  faint,
  subs,
  onPress,
  expanded,
  children,
}: Props) {
  const metaLookup = useMetaLookup();
  const reduceMotion = useReducedMotion();
  const meta = DIMENSION_META[dimId];
  const expandable = expanded !== undefined;

  return (
    <Animated.View layout={reduceMotion ? undefined : LinearTransition.duration(220)}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
        accessibilityRole="button"
        accessibilityState={expandable ? { expanded } : undefined}
      >
        <View style={styles.top}>
          <View style={[styles.iconHalo, { backgroundColor: meta.bg }]}>
            <Ionicons name={meta.iconName as never} size={16} color={meta.color} />
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {metaLookup.dim(dimId).label}
          </Text>
          <Text style={[styles.total, faint && styles.faint]}>
            {value}
            {unit ? <Text style={styles.totalUnit}>{unit}</Text> : null}
          </Text>
          <Ionicons
            name={expandable ? (expanded ? 'chevron-up' : 'chevron-down') : 'chevron-forward'}
            size={14}
            color={tokens.text.dim}
          />
        </View>

        {subs.map((sub) => (
          <View
            key={sub.subId}
            style={styles.subBlock}
            accessible={sub.a11yLabel ? true : undefined}
            accessibilityLabel={sub.a11yLabel}
          >
            <View style={styles.subLabelRow}>
              <Text style={styles.subName} numberOfLines={1}>
                {metaLookup.sub(sub.subId).label}
              </Text>
              <Text
                style={[
                  styles.subValue,
                  sub.reached && [styles.subValueReached, { color: meta.color }],
                  sub.faint && styles.faint,
                ]}
              >
                {sub.value}
              </Text>
            </View>
            {sub.bar}
          </View>
        ))}

        {expanded && children ? (
          <View style={styles.expandWrap}>
            <View style={styles.divider} />
            {children}
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

/**
 * A 0..5 score on the same track as Praticada's SubBar (8dp, rounded), so
 * the three portraits share one bar. Alone it is a plain fill. With `from`
 * (Desejada) the stretch up to `from` is pale — where you are, which the
 * hex's outline already shows — and only the climb to `fill` is lit, the
 * same "lit = the point of this pillar" grammar SubBar uses past the ruler.
 */
export function ScoreBar({
  fill,
  from,
  color,
}: {
  /** 0..1 */
  fill: number;
  /** 0..1 — draws [0, from] pale and [from, fill] lit. */
  from?: number;
  /** 6-digit hex (alpha is concatenated). */
  color: string;
}) {
  const end = Math.max(0, Math.min(1, fill));
  const base = from === undefined ? 0 : Math.max(0, Math.min(1, from));
  const lit = end > base ? end - base : 0;
  return (
    <View style={styles.barRow} importantForAccessibility="no-hide-descendants">
      <View style={[styles.track, { backgroundColor: `${color}1A` }]} />
      {base > 0 && (
        <View
          style={[
            styles.seg,
            { left: 0, width: pct(base), backgroundColor: `${color}73` },
            lit > 0 && styles.joinedRight,
          ]}
        />
      )}
      {lit > 0 && (
        <View
          style={[
            styles.seg,
            { left: pct(base), width: pct(lit), backgroundColor: color },
            base > 0 && styles.joinedLeft,
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.md,
    gap: tokens.space[2],
    // Dark: the faint wash Praticada always had. Light: a 2.5% white wash
    // vanishes on the porcelain bg, so the card takes the surface + edge.
    backgroundColor: ACTIVE_THEME === 'light' ? tokens.bg.surface : 'rgba(255,255,255,0.025)',
    borderWidth: 1,
    borderColor: ACTIVE_THEME === 'light' ? tokens.border.base : 'transparent',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
  },
  iconHalo: {
    width: 28,
    height: 28,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flex: 1,
    minWidth: 0,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: tokens.text.hi,
  },
  total: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 18,
    letterSpacing: -0.2,
    color: tokens.text.hi,
    fontVariant: ['tabular-nums'],
  },
  totalUnit: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    letterSpacing: 0,
    color: tokens.text.dim,
  },
  faint: { color: tokens.text.faint },
  subBlock: { gap: 3 },
  subLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: tokens.space[2],
  },
  subName: {
    flex: 1,
    minWidth: 0,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: tokens.text.mid,
  },
  subValue: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: tokens.text.mid,
    fontVariant: ['tabular-nums'],
  },
  subValueReached: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
  },
  expandWrap: {
    gap: tokens.space[2],
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: tokens.border.divider,
  },
  // ScoreBar — the geometry of SubBar's track (components/dedicacao/SubBar).
  barRow: { height: 14, position: 'relative' },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 3,
    height: 8,
    borderRadius: 4,
  },
  seg: {
    position: 'absolute',
    top: 3,
    height: 8,
    minWidth: 4,
    borderRadius: 4,
  },
  joinedRight: { borderTopRightRadius: 0, borderBottomRightRadius: 0 },
  joinedLeft: { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
});
