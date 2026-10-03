import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DayXpStat } from '@/components/DayXpStat';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

interface Props {
  /** Big headline: weekday word, e.g. "Sunday,". */
  weekdayLabel: string;
  /** Big headline: month + day, e.g. "May 24". Drawn in violet with a glow. */
  monthDayLabel: string;
  /** XP earned on the selected day. `null` = still loading — the stat row is
   *  hidden so it never flashes "+0". */
  xpOfDay: number | null;
  /** Only used to pick the a11y wording ("today" vs "on this day"). */
  isToday: boolean;
  /** Step to the previous day. */
  onPrevDay: () => void;
  /** Step to the next day (no-op past today). */
  onNextDay: () => void;
  /** False when the selected day IS today — the next arrow greys out. */
  canGoNext: boolean;
  /** Provided only when a past day is selected → tapping the date jumps
   *  straight back to today. */
  onResetToday?: () => void;
  /** The (i) in the top-right corner — how the screen works. */
  onInfo: () => void;
}

/**
 * Header for the V3 Tasks home / day-view.
 *
 *   Row 1: ‹ Segunda, Jul 27 ›                              (i)
 *   Row 2: ⚡ +240 XP                     (green glow; grey at 0)
 *
 * The date is the day selector: the arrows hug the date string (the next
 * arrow sits right after it, not at the screen edge), and the back arrow's
 * glyph lines up with the left edge of everything below it. Tapping the
 * date on a past day jumps back to today — there is no separate "Hoje" chip
 * and no name eyebrow any more (2026-10-03): the row they took went to the
 * date, and the freed top-right corner holds the screen's (i), the same
 * 40px chip as the other screens. Swiping the top of the screen also steps
 * days (the host owns that gesture).
 */
export function TodayHeader({
  weekdayLabel,
  monthDayLabel,
  xpOfDay,
  isToday,
  onPrevDay,
  onNextDay,
  canGoNext,
  onResetToday,
  onInfo,
}: Props) {
  const { t } = useT();

  return (
    <View style={styles.wrap}>
      <View style={styles.dateRow}>
        <Pressable
          onPress={onPrevDay}
          hitSlop={10}
          style={({ pressed }) => [styles.arrowBtn, styles.arrowPrev, pressed && { opacity: 0.5 }]}
          accessibilityRole="button"
          accessibilityLabel={t('home.dayNav.prev')}
        >
          <Ionicons name="chevron-back" size={22} color={tokens.text.hi} />
        </Pressable>

        <Pressable
          onPress={onResetToday}
          disabled={!onResetToday}
          style={styles.headlineWrap}
          accessibilityRole={onResetToday ? 'button' : 'header'}
          accessibilityHint={onResetToday ? t('home.dayNav.backToTodayA11y') : undefined}
        >
          <Text style={styles.headline} numberOfLines={1}>
            {weekdayLabel}{' '}
            <Text style={styles.headlineNum}>{monthDayLabel}</Text>
          </Text>
        </Pressable>

        <Pressable
          onPress={onNextDay}
          disabled={!canGoNext}
          hitSlop={10}
          style={({ pressed }) => [
            styles.arrowBtn,
            pressed && canGoNext && { opacity: 0.5 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('home.dayNav.next')}
        >
          <Ionicons
            name="chevron-forward"
            size={22}
            color={canGoNext ? tokens.text.hi : tokens.text.faint}
          />
        </Pressable>

        <View style={styles.spacer} />

        <Pressable
          onPress={onInfo}
          hitSlop={8}
          style={({ pressed }) => [styles.infoBtn, pressed && { opacity: 0.6 }]}
          accessibilityRole="button"
          accessibilityLabel={t('home.help.a11y')}
        >
          <Ionicons name="information-circle-outline" size={22} color={tokens.text.hi} />
        </Pressable>
      </View>

      {xpOfDay !== null && <DayXpStat xp={xpOfDay} isToday={isToday} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[2],
    paddingBottom: tokens.space[2],
    gap: 10,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowBtn: {
    width: 28,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The chevron's stroke starts ~6px inside its 22px box: pull the button
  // left by that much so the glyph lines up with the content edge below.
  arrowPrev: {
    alignItems: 'flex-start',
    marginLeft: -6,
  },
  headlineWrap: {
    flexShrink: 1,
  },
  headline: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 24,
    lineHeight: 28,
    color: tokens.text.hi,
    letterSpacing: -0.3,
  },
  headlineNum: {
    color: tokens.brand.violet2,
    textShadowColor: 'rgba(155,130,255,0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  spacer: {
    flex: 1,
    minWidth: tokens.space[2],
  },
  // Same 40px chip as the (i) on Minhas ideias.
  infoBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.surface,
  },
});
