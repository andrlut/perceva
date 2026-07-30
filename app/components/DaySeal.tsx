import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

import { dimensionForSub } from '@/lib/api/tasks';
import type { DayCompletion } from '@/lib/api/history';
import type { DimensionId } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { tokens } from '@/theme';
import { DIMENSION_ORDER } from '@/theme/dimensions';

interface Props {
  /**
   * Every completion logged on the selected day — `dayDetail.completions`,
   * the exact array the Concluídas drawer is built from, so the panel and
   * its receipt below physically cannot disagree.
   */
  completions: DayCompletion[];
  /** Practices skipped on this day — the Puladas drawer's row count. */
  skippedCount: number;
  /** Only picks between the two `none` strings (today vs. that day). */
  isToday: boolean;
  /**
   * Is the data behind `completions` / `skippedCount` in agreement with the
   * server yet?
   *
   * Load-bearing. The condition that MOUNTS this panel (`dayOpen.length === 0`)
   * is fed by the OPTIMISTIC bucket cache, while both props that decide its
   * MODE come from caches with no optimistic pass. So for one whole
   * round-trip after the day's last action the panel would see done=0 and
   * skipped=0 and confidently announce "Nada programado" over a day the user
   * just finished. While unsettled we fall back to the old data-independent
   * line, which is true in every state.
   */
  settled: boolean;
}

/**
 * What a day with nothing left open looks like.
 *
 * Replaces the single grey line ("Nada em aberto neste dia.") that stated an
 * ABSENCE where the day actually held a PRESENCE. It names what the day was
 * and decomposes it into the pillars the user trained — information neither
 * the XP hero above nor the collapsed drawers below can show.
 *
 * Four honest cases, because congratulating all four the same way would be a
 * lie the user would catch immediately:
 *
 *   complete — done ≥1, skipped 0 → gold seal + halo. The proud one.
 *   cleared  — mixed             → gold seal, no halo. Decided, not perfect.
 *   settled  — done 0, skips only → muted moon. Names the choice, no praise,
 *                                   no guilt, and claims nothing was trained.
 *   none     — nothing scheduled  → no card at all, just the quiet line. An
 *                                   empty Tuesday had no contract to close.
 *
 * Carries NO XP figure by construction (there is no prop for one): the hero
 * and the Concluídas header already print it twice. Carries no PercevaGlyph
 * and no burst either — those stay exclusive to the once-a-day modal.
 * Register split: modal = a motion event, panel = a motion arrival.
 */
export function DaySeal({
  completions,
  skippedCount,
  isToday,
  settled,
}: Props) {
  const { t } = useT();
  const meta = useMetaLookup();
  const reduceMotion = useReducedMotion();

  const done = completions.length;
  const mode: 'complete' | 'cleared' | 'settled' | 'none' | 'pending' = !settled
    ? 'pending'
    : done > 0 && skippedCount === 0
      ? 'complete'
      : done > 0
        ? 'cleared'
        : skippedCount > 0
          ? 'settled'
          : 'none';

  // One count per (completion × distinct dimension) — a multi-sub practice
  // feeding mind+body counts once for each, never twice for the same one.
  // Ordered by DIMENSION_ORDER, never by count, so pills don't reshuffle
  // when a rep is undone.
  const dimCounts = useMemo(() => {
    const m = new Map<DimensionId, number>();
    for (const c of completions) {
      for (const d of new Set(c.subs.map((s) => dimensionForSub(s.sub_id)))) {
        m.set(d, (m.get(d) ?? 0) + 1);
      }
    }
    return DIMENSION_ORDER.filter((d) => m.has(d)).map(
      (d) => [d, m.get(d)!] as const,
    );
  }, [completions]);

  // Driven off the MODE TRANSITION, not off mount. `useReducedMotion()`
  // returns a module-level constant and a shared value's identity never
  // changes, so a mount-only effect would fire its single spring while the
  // panel was still showing a plain line — and the seal would then appear
  // already at rest, never popping. That is the normal path: the panel mounts
  // in `pending`/`none` on the frame the day's last practice is closed.
  const sealScale = useSharedValue(reduceMotion ? 1 : 0.72);
  const hasSeal = mode === 'complete' || mode === 'cleared' || mode === 'settled';
  useEffect(() => {
    if (reduceMotion || !hasSeal) return;
    sealScale.value = 0.72;
    sealScale.value = withDelay(90, withSpring(1, tokens.motion.springBouncy));
  }, [reduceMotion, hasSeal, sealScale]);
  const sealStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sealScale.value }],
  }));

  // `pending` reuses the pre-existing, data-INDEPENDENT copy: it only ever
  // claimed nothing was OPEN, which stays true through the optimistic frame,
  // unlike `none`'s positive claim that nothing was scheduled.
  if (mode === 'pending') {
    return (
      <Text style={styles.quietLine}>
        {isToday
          ? t('home.bucketTabs.emptyToday')
          : t('home.emptyPastDay')}
      </Text>
    );
  }

  if (mode === 'none') {
    return (
      <Text style={styles.quietLine}>
        {isToday
          ? t('home.daySeal.none.today')
          : t('home.daySeal.none.day')}
      </Text>
    );
  }

  const rewarded = mode === 'complete' || mode === 'cleared';
  const title = t(`home.daySeal.${mode}.title`);
  const body = t(`home.daySeal.${mode}.body`);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          borderColor: rewarded
            ? tokens.semantic.coinRim
            : tokens.border.strong,
        },
      ]}
      entering={
        reduceMotion ? undefined : FadeInDown.duration(tokens.motion.dur).delay(40)
      }
    >
      <LinearGradient
        colors={tokens.gradient.todayHero}
        locations={tokens.gradient.todayHeroLocations}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* The modal's top wash, at 0.09 with a longer stop — the resting-state
          cousin of the celebration, deliberately not a copy of it. */}
      {rewarded && (
        <LinearGradient
          colors={['rgba(255, 200, 61, 0.09)', 'transparent']}
          locations={[0, 0.55]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}

      <View style={styles.sealWrap}>
        {mode === 'complete' && <View style={styles.halo} pointerEvents="none" />}
        <Animated.View
          style={[
            styles.seal,
            sealStyle,
            rewarded
              ? [
                  {
                    backgroundColor: 'rgba(255, 200, 61, 0.12)',
                    borderColor: tokens.semantic.coinRim,
                  },
                  mode === 'complete'
                    ? tokens.shadow.coinGlow
                    : tokens.shadow.coinGlowSoft,
                ]
              : {
                  backgroundColor: tokens.bg.surface2,
                  borderColor: tokens.border.strong,
                },
          ]}
        >
          <Ionicons
            name={rewarded ? 'checkmark-done' : 'moon-outline'}
            size={rewarded ? 28 : 24}
            color={rewarded ? tokens.semantic.coin : tokens.text.mid}
            importantForAccessibility="no-hide-descendants"
          />
        </Animated.View>
      </View>

      <View
        style={styles.textCol}
        accessible
        accessibilityRole="text"
        accessibilityLabel={`${title} ${body}`}
      >
        <Text
          style={[
            styles.title,
            { color: rewarded ? tokens.text.hi : tokens.text.base },
          ]}
        >
          {title}
        </Text>
        <Text style={styles.body}>{body}</Text>
      </View>

      {/* Nothing was trained on a settled day, so it claims nothing. */}
      {rewarded && dimCounts.length > 0 && (
        <View style={styles.trainedCol}>
          <Text style={styles.eyebrow}>{t('home.daySeal.trained')}</Text>
          <View style={styles.pillRow}>
            {dimCounts.map(([id, count], i) => {
              const dim = meta.dim(id);
              return (
                <Animated.View
                  key={id}
                  entering={
                    reduceMotion
                      ? undefined
                      : FadeInDown.delay(200 + Math.min(i, 5) * 45).duration(200)
                  }
                  style={[
                    styles.pill,
                    { backgroundColor: dim.bg, borderColor: dim.color + '44' },
                  ]}
                  accessibilityRole="text"
                  accessibilityLabel={t('home.daySeal.a11yPillar', {
                    dimension: dim.label,
                    count,
                  })}
                >
                  <Ionicons
                    name={dim.iconName as never}
                    size={16}
                    color={dim.color}
                  />
                  {/* A row of "×1"s is noise — only a repeat earns the count. */}
                  {count >= 2 && (
                    <Text style={[styles.pillCount, { color: dim.color }]}>
                      ×{count}
                    </Text>
                  )}
                </Animated.View>
              );
            })}
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Verbatim the old `tabEmpty` rules this component replaced.
  quietLine: {
    ...tokens.type.caption,
    color: tokens.text.dim,
    fontStyle: 'italic',
    paddingVertical: tokens.space[4],
    textAlign: 'center',
  },
  // Gradient fill + gold rim + radius.xl at the full taskList inset: wider
  // than the two drawers below (they add their own space[3] margin), and a
  // different fill KIND, so it can never read as a third drawer.
  card: {
    borderRadius: tokens.radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    paddingVertical: tokens.space[5],
    paddingHorizontal: tokens.space[4],
    gap: tokens.space[3],
    marginVertical: tokens.space[1],
  },
  sealWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: tokens.radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 61, 0.20)',
  },
  seal: {
    width: 56,
    height: 56,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    alignItems: 'center',
    gap: tokens.space[2],
  },
  title: {
    ...tokens.type.h2,
    fontFamily: tokens.font.familyHeavy,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  body: {
    ...tokens.type.body,
    color: tokens.text.mid,
    textAlign: 'center',
    maxWidth: 290,
  },
  trainedCol: {
    alignItems: 'center',
    gap: tokens.space[2],
    marginTop: tokens.space[1],
  },
  eyebrow: {
    ...tokens.type.eyebrow,
    color: tokens.text.dim,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: tokens.space[2],
  },
  pill: {
    height: 30,
    minWidth: 30,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    paddingHorizontal: tokens.space[2],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pillCount: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
  },
});
