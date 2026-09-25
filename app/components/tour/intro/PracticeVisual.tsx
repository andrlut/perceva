import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useReducedMotion, ZoomIn } from 'react-native-reanimated';

import { MoodFace } from '@/components/mood/MoodFace';
import type { SubId } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import type { MoodValue } from '@/lib/mood';
import { tokens } from '@/theme';
import { SUB_META } from '@/theme/dimensions';

/**
 * Page 2 visual — a slice of a day. Two practices get checked off, one is
 * marked "Pulada hoje" (skipping is a decision, not a failure — the page's
 * payoff line), and the mood row lands on a face. The checks pop in the
 * first time the page is shown; under reduced motion the day is already
 * filled in.
 *
 * Sub-area names and colors come from the app's own catalog, so the
 * example speaks the same vocabulary as the Home it previews.
 */

interface Row {
  titleKey: string;
  sub: SubId;
  state: 'done' | 'skipped';
}

const ROWS: Row[] = [
  { titleKey: 'tour.intro.practice.example1', sub: 'sleep', state: 'done' },
  { titleKey: 'tour.intro.practice.example2', sub: 'strength', state: 'done' },
  { titleKey: 'tour.intro.practice.example3', sub: 'learn', state: 'skipped' },
];

const MOOD_PICK: MoodValue = 4;

export function PracticeVisual({ active }: { active: boolean }) {
  const { t } = useT();
  const meta = useMetaLookup();
  const reduceMotion = useReducedMotion();

  // Sticky: animate the first showing, then keep the day filled in.
  const [played, setPlayed] = useState(reduceMotion);
  useEffect(() => {
    if (active) setPlayed(true);
  }, [active]);
  const filled = played || reduceMotion;
  const pop = (delay: number) =>
    reduceMotion ? undefined : ZoomIn.springify().damping(14).delay(delay);

  return (
    <View
      style={styles.card}
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('tour.intro.practice.artA11y')}
    >
      {ROWS.map((row, i) => {
        const sub = meta.sub(row.sub);
        const dim = meta.dim(SUB_META[row.sub].dimensionId);
        return (
          <View key={row.titleKey} style={[styles.row, i > 0 && styles.rowDivider]}>
            <View style={[styles.subIcon, { backgroundColor: dim.bg }]}>
              <Ionicons
                name={SUB_META[row.sub].iconName as keyof typeof Ionicons.glyphMap}
                size={16}
                color={dim.color}
              />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {t(row.titleKey)}
              </Text>
              <Text style={[styles.rowSub, { color: dim.color }]} numberOfLines={1}>
                {sub.label}
              </Text>
            </View>
            {row.state === 'done' ? (
              <View style={styles.checkSlot}>
                {filled ? (
                  <Animated.View entering={pop(180 + i * 260)} style={styles.checkDone}>
                    <Ionicons name="checkmark" size={17} color={tokens.bg.deep} />
                  </Animated.View>
                ) : (
                  <View style={styles.checkEmpty} />
                )}
              </View>
            ) : filled ? (
              <Animated.View
                entering={reduceMotion ? undefined : FadeIn.duration(260).delay(760)}
                style={styles.skipChip}
              >
                <Ionicons name="play-skip-forward" size={12} color={tokens.text.mid} />
                <Text style={styles.skipText}>{t('tour.intro.practice.skipped')}</Text>
              </Animated.View>
            ) : (
              <View style={styles.checkSlot}>
                <View style={styles.checkEmpty} />
              </View>
            )}
          </View>
        );
      })}

      <View style={[styles.moodRow, styles.rowDivider]}>
        <Text style={styles.moodLabel}>{t('tour.intro.practice.mood')}</Text>
        <View style={styles.faces}>
          {([1, 2, 3, 4, 5] as MoodValue[]).map((v) => {
            const on = filled && v === MOOD_PICK;
            return on ? (
              <Animated.View
                key={v}
                entering={reduceMotion ? undefined : ZoomIn.springify().damping(12).delay(1000)}
              >
                <MoodFace value={v} size={26} active />
              </Animated.View>
            ) : (
              <MoodFace key={v} value={v} size={26} />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    backgroundColor: tokens.bg.glass,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.border.base,
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[1],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    paddingVertical: tokens.space[3],
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: tokens.border.divider,
  },
  subIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 1,
  },
  rowTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    lineHeight: 20,
    color: tokens.text.hi,
  },
  rowSub: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    lineHeight: 17,
  },
  checkSlot: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkEmpty: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: tokens.border.strong,
  },
  checkDone: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: tokens.semantic.xp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: tokens.space[2],
    paddingVertical: 4,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.bg.surface2,
  },
  skipText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    lineHeight: 16,
    color: tokens.text.mid,
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.space[2],
    paddingVertical: tokens.space[3],
  },
  moodLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    lineHeight: 18,
    color: tokens.text.base,
    flexShrink: 1,
  },
  faces: {
    flexDirection: 'row',
    gap: 6,
  },
});
