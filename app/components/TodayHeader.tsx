import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinear, Stop } from 'react-native-svg';

import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

interface Props {
  /** Display name shown in the eyebrow line — DECO style. */
  displayName: string;
  /** Big headline: weekday word, e.g. "Sunday,". */
  weekdayLabel: string;
  /** Big headline: month + day, e.g. "May 24". Drawn in violet with a glow. */
  monthDayLabel: string;
  /** Tasks completed on the selected day — fills the ring proportionally. */
  ringDone: number;
  /** Total tasks contributing to the ring. Pass 0 to hide the ring (e.g.
   *  on a past day, where "today's contract" doesn't apply). */
  ringTotal: number;
  /** Step to the previous day. */
  onPrevDay: () => void;
  /** Step to the next day (no-op past today). */
  onNextDay: () => void;
  /** False when the selected day IS today — the next arrow greys out (you
   *  can't act on a future contract). */
  canGoNext: boolean;
  /** Provided only when a past day is selected → tap the date or the "Hoje"
   *  chip to jump straight back to today. */
  onResetToday?: () => void;
}

const RING_SIZE = 52;
const RING_STROKE = 5;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * Two-row header for the V3 Tasks home.
 *
 *   Row 1: DECO                                   [ Hoje ]  (past days only)
 *   Row 2: ‹  Segunda, Jul 27  ›              [ring 6/7]
 *
 * The date is the day selector: the ‹ › arrows step between adjacent days
 * (the whole screen follows — tasks, XP hero, completed drawer), so the
 * user can go back and log something they forgot on a past day. Tapping the
 * date (or the "Hoje" chip) jumps back to today. The next arrow greys out
 * on today. Eyebrow uses Perceva pale-gold; the month/day fragment is
 * violet with a glow to mirror the Rewards card vocabulary.
 */
export function TodayHeader({
  displayName,
  weekdayLabel,
  monthDayLabel,
  ringDone,
  ringTotal,
  onPrevDay,
  onNextDay,
  canGoNext,
  onResetToday,
}: Props) {
  const { t } = useT();
  const pct = ringTotal > 0 ? Math.min(1, ringDone / ringTotal) : 0;
  const dashOffset = RING_CIRCUMFERENCE - pct * RING_CIRCUMFERENCE;

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

        {ringTotal > 0 && (
          <View style={styles.ringWrap}>
            <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
              <Defs>
                <SvgLinear id="todayRing" x1="0" y1="0" x2={RING_SIZE} y2={RING_SIZE}>
                  <Stop offset="0%" stopColor={tokens.brand.violet2} />
                  <Stop offset="100%" stopColor={tokens.brand.violet} />
                </SvgLinear>
              </Defs>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke="#1e2240"
                strokeWidth={RING_STROKE}
                fill="none"
              />
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke="url(#todayRing)"
                strokeWidth={RING_STROKE}
                fill="none"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
              />
            </Svg>
            <View style={styles.ringCenter} pointerEvents="none">
              <Text style={styles.ringNum}>{ringDone}</Text>
            </View>
          </View>
        )}
      </View>
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
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    position: 'relative',
    marginLeft: tokens.space[1],
  },
  ringCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringNum: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 16,
    color: tokens.text.hi,
    textShadowColor: 'rgba(155,130,255,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
