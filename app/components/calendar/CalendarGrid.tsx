import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MoodMouth } from '@/components/mood/MoodMouth';
import { dateKeyFromLocal } from '@/lib/api/history';
import {
  dayMatchesFilter,
  isFilterActive,
  type CalendarDay,
  type CalendarFilter,
} from '@/lib/calendar/filters';
import { formatCellXp } from '@/lib/calendar/intensity';
import { FILTERED_OUT_OPACITY, paintForFront } from '@/lib/calendar/paint';
import type { CalendarFront } from '@/lib/calendar/store';
import { useT } from '@/lib/i18n';
import { moodLevel } from '@/lib/mood';
import type { WeekStart } from '@/lib/settings';
import { tokens } from '@/theme';

/**
 * The month grid. **One geometry, three fronts.**
 *
 * Every cell is the same 44dp box on every front — same height, same radius,
 * same corner for the date. Only the fill and the one centred figure change.
 * That is what makes the front chips feel instant: switching them re-tints a
 * grid that is already laid out and already in cache, so nothing re-measures,
 * nothing reflows, and the scroll position cannot jump under the user's thumb.
 * It is also the fix for the screen this replaces, whose cell stacked a mood
 * fill, an XP figure and up to four dimension dots at once.
 *
 * ## Cell budget (why 44 and why one figure)
 *
 * Worst case we ship on is a 320dp phone: 320 − 32 (screen padding) − 30 (six
 * 5dp gaps) = 258/7 = **36.8dp** of cell width; a 360dp phone gives 42.6dp.
 * Manrope's widest digit advances 0.674em, so the centred figure at 12.5dp
 * measures at most 3 × 8.4 = 25.3dp and clears both. A fourth glyph would not,
 * which is what `formatCellXp` collapses to "1k".
 *
 * Vertically: corner date (top 3, lineHeight 10) → 13, centred figure
 * (lineHeight 15) → 14…29 in a 44dp box, bottom marks (bottom 3, height 9) →
 * 32…41. Two clear dp between each band. Raise the height before adding any
 * fourth element, and keep `allowFontScaling={false}` on both figures — the box
 * is fixed and clips, so an OS font scale would push the bottom marks out of
 * frame rather than reflow.
 */
const CELL_HEIGHT = 44;
const CELL_GAP = 5;

/** Bottom marks (mood tags, reward icons) that fit before the row is clipped. */
const MAX_MARKS = 3;

interface Props {
  monthDate: Date;
  days: Map<string, CalendarDay>;
  reference: number;
  front: CalendarFront;
  filter: CalendarFilter;
  selectedKey: string | null;
  onSelectDay: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  canGoNext: boolean;
  weekStart: WeekStart;
  /** Mood-tag slug → emoji, for the mood front's bottom marks. */
  tagEmojis: Map<string, string>;
}

const LOCALE_TAG: Record<string, string> = { en: 'en-US', pt: 'pt-BR' };

export function CalendarGrid({
  monthDate,
  days,
  reference,
  front,
  filter,
  selectedKey,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
  canGoNext,
  weekStart,
  tagEmojis,
}: Props) {
  const { t, locale } = useT();
  const rows = useMemo(() => buildMonthRows(monthDate, weekStart), [monthDate, weekStart]);
  const todayKey = dateKeyFromLocal(new Date());
  const now = Date.now();
  const filtering = isFilterActive(filter);

  // The catalog stores the seven initials Sunday-first (it also feeds the
  // recurrence day picker); rotate when the user starts weeks on Monday.
  const baseLabels = t('recurrencePicker.weekdays').split(',');
  const weekdayLabels =
    weekStart === 'sunday' ? baseLabels : [...baseLabels.slice(1), baseLabels[0]];

  const intlTag = LOCALE_TAG[locale] ?? 'en-US';
  const monthLabel = useMemo(() => {
    const raw = monthDate.toLocaleDateString(intlTag, { month: 'long', year: 'numeric' });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [monthDate, intlTag]);
  // One formatter for up to 42 cells — building it per cell is the expensive
  // half of composing the labels.
  const dayFmt = useMemo(
    () => new Intl.DateTimeFormat(intlTag, { day: 'numeric', month: 'long' }),
    [intlTag],
  );

  return (
    <View>
      <View style={styles.headerRow}>
        <Pressable
          onPress={onPrevMonth}
          hitSlop={8}
          style={({ pressed }) => [styles.chev, pressed && styles.chevPressed]}
          accessibilityRole="button"
          accessibilityLabel={t('a11y.prevMonth')}
        >
          <Ionicons name="chevron-back" size={18} color={tokens.text.hi} />
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable
          onPress={canGoNext ? onNextMonth : undefined}
          disabled={!canGoNext}
          hitSlop={8}
          style={({ pressed }) => [
            styles.chev,
            !canGoNext && styles.chevDisabled,
            pressed && canGoNext && styles.chevPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('a11y.nextMonth')}
        >
          <Ionicons
            name="chevron-forward"
            size={18}
            color={canGoNext ? tokens.text.hi : tokens.text.faint}
          />
        </Pressable>
      </View>

      <View style={styles.weekdayHeader}>
        {weekdayLabels.map((label, i) => (
          <Text key={i} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      {rows.map((week, rowIdx) => (
        <View key={rowIdx} style={styles.weekRow}>
          {week.map((cell, colIdx) => {
            if (!cell) return <View key={colIdx} style={styles.cellEmpty} />;

            const key = dateKeyFromLocal(cell);
            const day = days.get(key);
            const paint = paintForFront(day, front, reference);
            const isFuture = cell.getTime() > now;
            const matched = !filtering || (!!day && dayMatchesFilter(day, filter));
            const isSelected = key === selectedKey;
            const isToday = key === todayKey;

            const parts: string[] = [dayFmt.format(cell)];
            if (day) {
              if (day.mood !== null) parts.push(t(`mood.levels.${moodLevel(day.mood).key}`));
              if (day.xp > 0) parts.push(t('a11y.dayCellXp', { xp: day.xp }));
              if (day.practices.length > 0) {
                parts.push(t('a11y.dayCellPractices', { count: day.practices.length }));
              }
              if (day.spent > 0) parts.push(t('a11y.dayCellSpent', { coins: day.spent }));
              if (day.hasNote) parts.push(t('a11y.dayCellNote'));
            }
            if (parts.length === 1) parts.push(t('a11y.dayCellEmpty'));
            if (!matched) parts.push(t('a11y.dayCellFiltered'));

            return (
              <Pressable
                key={key}
                onPress={() => !isFuture && onSelectDay(cell)}
                disabled={isFuture}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled: isFuture }}
                accessibilityLabel={parts.join(' · ')}
                style={[
                  styles.cell,
                  { backgroundColor: paint.bg, borderColor: paint.border },
                  isToday && [styles.cellToday, { borderColor: paint.ink }],
                  isSelected && [styles.cellSelected, { borderColor: paint.ink }],
                  isFuture && styles.cellFuture,
                  !matched && !isFuture && { opacity: FILTERED_OUT_OPACITY },
                ]}
              >
                <Text
                  allowFontScaling={false}
                  style={[styles.dayNum, { color: paint.inkDim }]}
                >
                  {cell.getDate()}
                </Text>

                <CellFigure day={day} front={front} paint={paint} isFuture={isFuture} />

                {!isFuture && (
                  <CellMarks day={day} front={front} paint={paint} tagEmojis={tagEmojis} />
                )}

                {!isFuture && front !== 'vault' && day?.hasNote && (
                  <View style={[styles.notePip, { backgroundColor: paint.inkDim }]} />
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/** The one centred figure — the front's headline for that day. */
function CellFigure({
  day,
  front,
  paint,
  isFuture,
}: {
  day: CalendarDay | undefined;
  front: CalendarFront;
  paint: ReturnType<typeof paintForFront>;
  isFuture: boolean;
}) {
  if (!day || isFuture) return null;

  if (front === 'rotina') {
    if (day.xp <= 0) return null;
    return (
      <Text allowFontScaling={false} numberOfLines={1} style={[styles.figure, { color: paint.ink }]}>
        {formatCellXp(day.xp)}
      </Text>
    );
  }

  if (front === 'humor') {
    if (day.mood === null) return null;
    // The fill already carries the level; the mouth repeats it as shape so the
    // reading survives without hue discrimination.
    return <MoodMouth value={day.mood} width={17} color={paint.ink} />;
  }

  if (day.redemptions.length === 0) return null;
  // A day can hold only `use` events (something banked earlier being consumed),
  // and those cost nothing — a "−0" would be a lie, so it gets a check instead.
  if (day.spent <= 0) {
    return <Ionicons name="checkmark" size={14} color={tokens.semantic.xp} />;
  }
  return (
    <Text allowFontScaling={false} numberOfLines={1} style={[styles.figure, { color: paint.ink }]}>
      {`−${formatCellXp(day.spent)}`}
    </Text>
  );
}

/** Bottom band: mood tags on the mood front, reward glyphs on the Vault. */
function CellMarks({
  day,
  front,
  paint,
  tagEmojis,
}: {
  day: CalendarDay | undefined;
  front: CalendarFront;
  paint: ReturnType<typeof paintForFront>;
  tagEmojis: Map<string, string>;
}) {
  if (!day) return null;

  if (front === 'humor') {
    const emojis = day.tagIds
      .map((slug) => tagEmojis.get(slug))
      .filter((e): e is string => !!e)
      .slice(0, MAX_MARKS);
    if (emojis.length === 0) return null;
    return (
      <View style={styles.markRow}>
        <Text allowFontScaling={false} style={styles.markEmoji}>
          {emojis.join('')}
        </Text>
      </View>
    );
  }

  if (front === 'vault') {
    const icons = day.redemptions.slice(0, MAX_MARKS);
    if (icons.length === 0) return null;
    return (
      <View style={styles.markRow}>
        {icons.map((r) => (
          <Ionicons
            key={r.id}
            name={(r.icon ?? 'gift') as keyof typeof Ionicons.glyphMap}
            size={9}
            color={paint.ink}
          />
        ))}
      </View>
    );
  }

  return null;
}

function buildMonthRows(anyDay: Date, weekStart: WeekStart): (Date | null)[][] {
  const first = new Date(anyDay.getFullYear(), anyDay.getMonth(), 1);
  const lastDay = new Date(anyDay.getFullYear(), anyDay.getMonth() + 1, 0).getDate();
  const dow = first.getDay(); // 0=Sun..6=Sat
  const lead = weekStart === 'sunday' ? dow : (dow + 6) % 7;
  const cells: (Date | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) {
    cells.push(new Date(anyDay.getFullYear(), anyDay.getMonth(), d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  while (rows.length > 0 && rows[rows.length - 1].every((c) => c === null)) rows.pop();
  return rows;
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  chev: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevPressed: { opacity: 0.7, transform: [{ scale: 0.94 }] },
  chevDisabled: { opacity: 0.4 },
  monthLabel: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: tokens.text.hi,
    letterSpacing: 0.3,
  },
  weekdayHeader: { flexDirection: 'row', marginBottom: 6 },
  weekdayLabel: {
    flex: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    color: tokens.text.dim,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  weekRow: { flexDirection: 'row', gap: CELL_GAP, marginBottom: CELL_GAP },
  cell: {
    flex: 1,
    height: CELL_HEIGHT,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cellEmpty: { flex: 1, height: CELL_HEIGHT },
  dayNum: {
    position: 'absolute',
    top: 3,
    left: 5,
    fontFamily: 'Manrope_700Bold',
    fontSize: 9,
    lineHeight: 10,
  },
  figure: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12.5,
    lineHeight: 15,
    // Zero, not the usual 0.2: tracking is what pushes a three-glyph figure
    // past the 36.8dp worst-case cell.
    letterSpacing: 0,
  },
  markRow: {
    position: 'absolute',
    bottom: 3,
    left: 0,
    right: 0,
    height: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  markEmoji: { fontSize: 8, lineHeight: 9 },
  // Both rings take the cell's own ink at render time: no fixed color survives
  // three palettes, and the two obvious candidates are the two worst — violet
  // vanishes on the intensity ramp it belongs to, and white vanishes on the top
  // of the mood ramp. Width is what separates today from selected.
  cellToday: { borderWidth: 1.5 },
  cellSelected: { borderWidth: 2 },
  cellFuture: { opacity: 0.3 },
  notePip: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.75,
  },
});
