import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CoinIcon } from '@/components/CoinIcon';
import { MoodFace } from '@/components/mood/MoodFace';
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
  /** Coins earned on the selected day; `null` while loading (like xpOfDay). */
  coinsOfDay: number | null;
  /** The day's mood (1..5), or null when not logged yet. */
  mood: 1 | 2 | 3 | 4 | 5 | null;
  /** The mood shortcut on the right of the stat row — opens the check-in. */
  onMood: () => void;
  /** The (i) in the top-right corner — how the screen works. */
  onInfo: () => void;
}

/**
 * Header for the V3 Tasks home / day-view.
 *
 *   Row 1: ‹ Segunda, Jul 27 ›                              (i)
 *   Row 2: ⚡ 240            🪙 240                ☺
 *
 * Row 2 is the day's three marks, always in view, in three EQUAL thirds
 * (layout only, no dividers): XP on the left edge, coins centered, mood on
 * the right edge under the (i). Glyph + bare number, no "+" and no unit;
 * every glyph and figure is centered on one line (includeFontPadding off,
 * so Android's font padding does not drop the number below its icon). The
 * mood third is always the level-4 face: dashed grey until the day is
 * logged, then that day's own face in color. Tapping it opens the check-in
 * for the selected day.
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
  coinsOfDay,
  mood,
  onMood,
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

        {/* Just the glyph, no chip around it (owner, 2026-10-03). */}
        <Pressable
          onPress={onInfo}
          hitSlop={10}
          style={({ pressed }) => [styles.infoBtn, pressed && { opacity: 0.6 }]}
          accessibilityRole="button"
          accessibilityLabel={t('home.help.a11y')}
        >
          <Ionicons name="information-circle-outline" size={24} color={tokens.text.mid} />
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <View
          style={[styles.third, styles.thirdStart]}
          accessible
          accessibilityRole="text"
          accessibilityLabel={`${xpOfDay ?? 0} XP ${
            isToday ? t('home.xpHero.today') : t('home.xpHero.thatDay')
          }`}
        >
          {xpOfDay !== null && (
            <>
              <Ionicons
                name="flash"
                size={GLYPH}
                color={xpOfDay > 0 ? tokens.semantic.xp : tokens.text.dim}
              />
              <Text style={[styles.num, styles.xpNum, xpOfDay === 0 && styles.zero]}>
                {xpOfDay}
              </Text>
            </>
          )}
        </View>

        <View
          style={[styles.third, styles.thirdCenter]}
          accessible
          accessibilityRole="text"
          accessibilityLabel={t('home.coinsOfDayA11y', { count: coinsOfDay ?? 0 })}
        >
          {coinsOfDay !== null && (
            <>
              <CoinIcon size={GLYPH} />
              <Text style={[styles.num, styles.coinNum, coinsOfDay === 0 && styles.zero]}>
                {coinsOfDay}
              </Text>
            </>
          )}
        </View>

        <View style={[styles.third, styles.thirdEnd]}>
          <Pressable
            onPress={onMood}
            hitSlop={10}
            style={({ pressed }) => [styles.moodBtn, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel={
              mood ? t('home.moodShortcut.editA11y') : t('home.moodShortcut.logA11y')
            }
          >
            {mood ? (
              <MoodFace value={mood} size={FACE} active />
            ) : (
              <MoodFace value={4} size={FACE} ghost />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/** Icon size of the XP and coin thirds; the face is drawn a touch larger so
 *  its disc reads the same height as glyph + figure. */
const GLYPH = 22;
const FACE = 28;

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
  // Glyph only — a 40px target, no fill.
  infoBtn: {
    width: 40,
    height: 40,
    marginRight: -8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
  },
  third: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  thirdStart: { justifyContent: 'flex-start' },
  thirdCenter: { justifyContent: 'center' },
  thirdEnd: { justifyContent: 'flex-end' },
  num: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.4,
    includeFontPadding: false,
    textAlignVertical: 'center',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  xpNum: {
    color: tokens.semantic.xp,
    textShadowColor: tokens.semantic.xpGlow,
  },
  coinNum: {
    color: tokens.semantic.coinLight,
    textShadowColor: tokens.semantic.coinGlow,
  },
  zero: {
    color: tokens.text.dim,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
  moodBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
