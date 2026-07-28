import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DayXpStat } from '@/components/DayXpStat';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

interface Props {
  /** Display name shown in the eyebrow line — DECO style. */
  displayName: string;
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
  /** Provided only when a past day is selected → tap the date or the "Hoje"
   *  chip to jump straight back to today. */
  onResetToday?: () => void;
}

/**
 * Header for the V3 Tasks home / day-view.
 *
 *   Row 1: DECO                                   [ Hoje ]  (past days only)
 *   Row 2: ‹  Segunda, Jul 27  ›
 *   Row 3: ⚡ +240 XP                             (green glow; grey at 0)
 *
 * The date is the day selector — the ‹ › arrows step between adjacent days
 * (the whole screen follows), and tapping the date (or the "Hoje" chip)
 * jumps back to today. XP earned that day is a standalone glowing stat on
 * its own line — no band, no ring (the old tasks ring was removed: it read
 * as confusing and competed with the date for width). At 0 XP it's a quiet
 * grey "+0" that lights up green on the first completion.
 */
export function TodayHeader({
  displayName,
  weekdayLabel,
  monthDayLabel,
  xpOfDay,
  isToday,
  onPrevDay,
  onNextDay,
  canGoNext,
  onResetToday,
}: Props) {
  const { t } = useT();

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <Text style={styles.eyebrow} numberOfLines={1}>
          {displayName.toUpperCase()}
        </Text>
        {onResetToday && (
          <Pressable
            onPress={onResetToday}
            hitSlop={8}
            style={({ pressed }) => [styles.todayChip, pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
            accessibilityLabel={t('home.dayNav.backToTodayA11y')}
          >
            <Ionicons name="today-outline" size={13} color={tokens.brand.violet2} />
            <Text style={styles.todayChipText}>{t('home.dayNav.today')}</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.dateRow}>
        <Pressable
          onPress={onPrevDay}
          hitSlop={8}
          style={({ pressed }) => [styles.arrowBtn, pressed && { opacity: 0.5 }]}
          accessibilityRole="button"
          accessibilityLabel={t('home.dayNav.prev')}
        >
          <Ionicons name="chevron-back" size={22} color={tokens.text.hi} />
        </Pressable>

        <Pressable
          onPress={onResetToday}
          disabled={!onResetToday}
          style={styles.headlineWrap}
        >
          <Text style={styles.headline} numberOfLines={1}>
            {weekdayLabel}{' '}
            <Text style={styles.headlineNum}>{monthDayLabel}</Text>
          </Text>
        </Pressable>

        <Pressable
          onPress={onNextDay}
          disabled={!canGoNext}
          hitSlop={8}
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.space[3],
  },
  eyebrow: {
    flex: 1,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    letterSpacing: 1.6,
    color: tokens.semantic.coinLight,
    textTransform: 'uppercase',
  },
  todayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(123,92,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(123,92,255,0.4)',
  },
  todayChipText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: tokens.brand.violet2,
    letterSpacing: 0.3,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[1],
  },
  arrowBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headlineWrap: {
    flex: 1,
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
});
