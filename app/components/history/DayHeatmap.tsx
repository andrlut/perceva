import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { dateKeyFromLocal } from '@/lib/api/history';
import type { DimensionId } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import type { WeekStart } from '@/lib/settings';
import { tokens } from '@/theme';
import { DIMENSION_META } from '@/theme/dimensions';

/** Everything one day cell renders, resolved by the caller per date key. */
export interface DayCellData {
  /** Cell fill — the day's mood color. Omit for an empty (bordered) cell. */
  bg?: string | null;
  /** True when `bg` is saturated → day number + XP flip to dark ink. */
  onColor?: boolean;
  /** The day's XP total. Rendered as a number; 0 renders nothing. */
  xp?: number;
  /** Dimensions the day touched, already deduped and ordered. */
  dims?: DimensionId[];
  /** Corner pip — e.g. the mood entry carries a note or tags. */
  mark?: boolean;
  /** Appended to the composed accessibilityLabel, e.g. the mood name. */
  a11yNote?: string;
}

interface Props {
  monthDate: Date;
  selected: Date | null;
  onSelectDay: (d: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  canGoNext: boolean;
  /** Per-day cell contents; null → empty (bordered) cell. */
  dataFor: (dateKey: string) => DayCellData | null;
  weekStart?: WeekStart;
}

/**
 * Cell height instead of `aspectRatio: 1`. A square cell (~37dp on a 360dp
 * phone) cannot stack a day number, an XP figure and a dot row legibly;
 * dropping the Atividade|Humor segmented control from the History card
 * freed roughly the 9dp per row this costs.
 */
const CELL_HEIGHT = 46;

/**
 * Six dimensions can fire in one day but six 5dp dots plus gaps overrun a
 * narrow cell. Five is the honest ceiling — a day touching more than five
 * of the six pillars is vanishingly rare, and the cell clips rather than
 * reflows when it happens.
 */
const MAX_DOTS = 5;

/**
 * The single month-grid heatmap for the whole app. A cell is one unified
 * read of the day rather than a single-channel swatch: background = mood,
 * number = XP, dots = which dimensions were practiced. Everything is
 * delegated to `dataFor`, so callers stay in charge of the semantics.
 */
export function DayHeatmap({
  monthDate,
  selected,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
  canGoNext,
  dataFor,
  weekStart = 'sunday',
}: Props) {
  const { t, locale } = useT();
  const meta = useMetaLookup();
  const rows = useMemo(() => buildMonthRows(monthDate, weekStart), [monthDate, weekStart]);
  const todayKey = dateKeyFromLocal(new Date());
  const selectedKey = selected ? dateKeyFromLocal(selected) : null;
  const now = Date.now();

  // The catalog stores the 7 initials Sunday-first (it also feeds the
  // recurrence day picker); rotate when the user starts weeks on Monday.
  const base = t('recurrencePicker.weekdays').split(',');
  const weekdayLabels = weekStart === 'sunday' ? base : [...base.slice(1), base[0]];

  const intlTag = LOCALE_MAP[locale] ?? 'en-US';
  const monthLabel = useMemo(() => {
    const raw = monthDate.toLocaleDateString(intlTag, { month: 'long', year: 'numeric' });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [monthDate, intlTag]);
  // One formatter for up to 42 cells — constructing it per cell is the
  // expensive part of composing the labels.
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
        {weekdayLabels.map((l, i) => (
          <Text key={i} style={styles.weekdayLabel}>
            {l}
          </Text>
        ))}
      </View>

      {rows.map((week, rowIdx) => (
        <View key={rowIdx} style={styles.weekRow}>
          {week.map((cell, colIdx) => {
            if (!cell) return <View key={colIdx} style={styles.cellEmpty} />;
            const key = dateKeyFromLocal(cell);
            const data = dataFor(key);
            const xp = data?.xp ?? 0;
            const dims = data?.dims ?? [];
            const isToday = key === todayKey;
            const isSelected = key === selectedKey;
            const isFuture = cell.getTime() > now;

            const parts = [dayFmt.format(cell)];
            if (data?.a11yNote) parts.push(data.a11yNote);
            if (xp > 0) parts.push(`${xp} XP`);
            if (dims.length > 0) {
              parts.push(dims.map((d) => meta.dim(d).label).join(t('format.listSeparator')));
            }
            if (parts.length === 1) parts.push(t('a11y.dayCellEmpty'));

            return (
              <Pressable
                key={key}
                onPress={() => !isFuture && onSelectDay(cell)}
                disabled={isFuture}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={parts.join(' · ')}
                style={[
                  styles.cell,
                  data?.bg
                    ? { backgroundColor: data.bg, borderColor: 'transparent' }
                    : { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: tokens.border.base },
                  isToday && styles.cellToday,
                  isSelected && styles.cellSelected,
                  isFuture && styles.cellFuture,
                ]}
              >
                <Text
                  style={[
                    styles.dayNum,
                    data?.onColor ? styles.inkOnColor : null,
                    isFuture && { opacity: 0.4 },
                  ]}
                >
                  {cell.getDate()}
                </Text>
                {xp > 0 && (
                  <Text style={[styles.xpNum, data?.onColor ? styles.inkOnColor : null]}>
                    {formatXp(xp)}
                  </Text>
                )}
                {dims.length > 0 && (
                  <View style={styles.dotTrack}>
                    {dims.slice(0, MAX_DOTS).map((d) => (
                      <View
                        key={d}
                        style={[styles.dot, { backgroundColor: DIMENSION_META[d].color }]}
                      />
                    ))}
                  </View>
                )}
                {data?.mark && <View style={styles.mark} />}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const LOCALE_MAP: Record<string, string> = { en: 'en-US', pt: 'pt-BR' };

/** Compact XP for a ~37dp-wide cell: 940, 1.2k, 12k. */
function formatXp(xp: number): string {
  if (xp < 1000) return String(xp);
  const k = xp / 1000;
  return k < 10 ? `${k.toFixed(1).replace(/\.0$/, '')}k` : `${Math.round(k)}k`;
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
  weekRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  cell: {
    flex: 1,
    height: CELL_HEIGHT,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
    gap: 1,
    // Clips the dot track rather than letting it bleed past the rounded
    // corners on narrow screens.
    overflow: 'hidden',
  },
  cellEmpty: { flex: 1, height: CELL_HEIGHT },
  dayNum: { fontFamily: 'Manrope_700Bold', fontSize: 11, color: tokens.text.hi },
  xpNum: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.2,
    // Never tokens.semantic.xp — that green is byte-identical to the
    // "great" mood fill, so XP would disappear on the days it matters.
    color: tokens.text.base,
  },
  inkOnColor: { color: tokens.bg.deep, fontFamily: 'Manrope_800ExtraBold' },
  dotTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1.5,
    paddingHorizontal: 2,
    paddingVertical: 1.5,
    borderRadius: tokens.radius.pill,
    // Dark backing rather than a per-dot ring: three dimension colors sit
    // within a hair of a mood fill (wealth IS mood-"ok" #FFC83D, health vs
    // "terrible", body vs "bad"), and a 1px ring on a 5dp dot eats most of
    // the color. The track separates the whole row from any background.
    backgroundColor: tokens.bg.deep,
  },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  cellToday: { borderColor: tokens.text.hi, borderWidth: 1.5 },
  // Violet, not tokens.semantic.coin: that gold is the exact "ok" mood
  // fill, so the selection ring used to vanish on those days.
  cellSelected: { borderColor: tokens.brand.violet2, borderWidth: 2 },
  cellFuture: { opacity: 0.3 },
  mark: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
});
