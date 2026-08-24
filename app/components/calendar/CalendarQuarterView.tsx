/**
 * Quarter view — three months zoomed out to density maps.
 *
 * The zoom-out drops the calendar grammar on purpose: the mini-maps are NOT
 * aligned by weekday. Aligning them would cost a leading gap of up to six
 * blank cells per month and buy nothing at this size — a 6dp square cannot be
 * read as "a Tuesday". What survives the zoom is shape and density, so each
 * month is simply its days in order, wrapped seven per row. The month grid is
 * where weekday alignment matters; this is a thumbnail of the same data.
 */

import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { dateKeyFromLocal } from '@/lib/api/history';
import {
  dayMatchesFilter,
  summarize,
  type CalendarDay,
  type CalendarFilter,
} from '@/lib/calendar/filters';
import { FILTERED_OUT_OPACITY, paintForFront } from '@/lib/calendar/paint';
import type { CalendarFront } from '@/lib/calendar/store';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

interface Props {
  /** Three months, oldest first (any date inside each month). */
  monthDates: Date[];
  /** Every day of the whole quarter, keyed by local 'YYYY-MM-DD'. */
  days: Map<string, CalendarDay>;
  /** Intensity reference for the quarter, computed once by the parent. */
  reference: number;
  front: CalendarFront;
  filter: CalendarFilter;
  onSelectMonth: (monthDate: Date) => void;
  locale: 'pt' | 'en';
}

interface Cell {
  key: string;
  bg: string;
  opacity: number;
}

interface MonthRow {
  key: string;
  date: Date;
  label: string;
  total: string;
  cells: Cell[];
}

/** Days after today are drawn as empty slots and never as "no activity". */
const FUTURE_BG = 'rgba(255,255,255,0.03)';
const FUTURE_OPACITY = 0.4;

export function CalendarQuarterView({
  monthDates,
  days,
  reference,
  front,
  filter,
  onSelectMonth,
  locale,
}: Props) {
  const { t } = useT();
  const intl = locale === 'pt' ? 'pt-BR' : 'en-US';

  const rows = useMemo<MonthRow[]>(() => {
    const todayKey = dateKeyFromLocal(new Date());

    return monthDates.map((monthDate) => {
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      // Day 0 of the next month is the last day of this one — covers 28/29/30/31
      // without a leap-year table.
      const dayCount = new Date(year, month + 1, 0).getDate();

      const cells: Cell[] = [];
      const monthDays: CalendarDay[] = [];

      for (let d = 1; d <= dayCount; d += 1) {
        const key = dateKeyFromLocal(new Date(year, month, d));
        const day = days.get(key);
        if (day) monthDays.push(day);

        // 'YYYY-MM-DD' keys sort lexicographically, so a string compare is a
        // date compare — and it stays on the local calendar day, unlike a
        // Date-vs-Date comparison against the current clock time.
        if (key > todayKey) {
          cells.push({ key, bg: FUTURE_BG, opacity: FUTURE_OPACITY });
          continue;
        }

        const paint = paintForFront(day, front, reference);
        const dimmed = day !== undefined && !dayMatchesFilter(day, filter);
        cells.push({
          key,
          bg: paint.bg,
          opacity: dimmed ? FILTERED_OUT_OPACITY : 1,
        });
      }

      const totals = summarize(monthDays, filter);
      let total: string;
      if (front === 'humor') {
        total =
          totals.moodAvg === null
            ? t('calendar.summary.humorEmpty')
            : t('calendar.summary.humor', {
                avg: totals.moodAvg.toLocaleString(intl, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                }),
              });
      } else if (front === 'vault') {
        total = t('calendar.summary.vault', {
          count: totals.redemptionCount,
          coins: totals.spent.toLocaleString(intl),
        });
      } else {
        total = `+${totals.xp.toLocaleString(intl)} XP`;
      }

      const raw = monthDate.toLocaleDateString(intl, { month: 'long' });
      const label = raw.charAt(0).toUpperCase() + raw.slice(1);

      return { key: `${year}-${month}`, date: monthDate, label, total, cells };
    });
  }, [monthDates, days, reference, front, filter, intl, t]);

  return (
    <View>
      <Text style={styles.hint}>{t('calendar.quarter.hint')}</Text>

      {rows.map((row, index) => (
        <Pressable
          key={row.key}
          style={[styles.monthRow, index === rows.length - 1 && styles.monthRowLast]}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            onSelectMonth(row.date);
          }}
          accessibilityRole="button"
          accessibilityLabel={`${row.label}, ${row.total}`}
        >
          {({ pressed }) => (
            <>
              <View style={[styles.labelCol, pressed && styles.pressed]}>
                <Text style={styles.monthName} numberOfLines={1}>
                  {row.label}
                </Text>
                <Text style={styles.monthTotal} numberOfLines={2}>
                  {row.total}
                </Text>
              </View>
              <View style={[styles.map, pressed && styles.pressed]}>
                {row.cells.map((cell) => (
                  <View
                    key={cell.key}
                    style={[styles.cell, { backgroundColor: cell.bg, opacity: cell.opacity }]}
                  />
                ))}
              </View>
            </>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontFamily: tokens.font.family,
    fontSize: 10.5,
    lineHeight: 15,
    color: tokens.text.dim,
    marginBottom: tokens.space[3],
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: tokens.space[4],
  },
  monthRowLast: {
    marginBottom: 0,
  },
  pressed: {
    opacity: 0.7,
  },
  labelCol: {
    width: 78,
    paddingRight: tokens.space[2],
  },
  monthName: {
    fontFamily: tokens.font.familyBold,
    fontSize: 13,
    lineHeight: 17,
    color: tokens.text.base,
  },
  monthTotal: {
    fontFamily: tokens.font.family,
    fontSize: 10,
    lineHeight: 14,
    color: tokens.text.dim,
    marginTop: 2,
  },
  map: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    gap: 2,
  },
  cell: {
    // Seven columns have to survive the narrowest map area we ship. That area
    // is screen − 32 (padding) − 78 (label column): 265dp at 375, but only
    // **210dp at 320**. The fit constraint is 7w + 6g ≤ W, so at 12.6% and a
    // 2dp gap it needs W ≥ 102dp — clear everywhere. (13.2% with a 3dp gap
    // needs 237dp: fine on a 375 phone, and silently wraps to six columns on a
    // 320 one, which turns the month map into a different shape per device.)
    // The few percent of slack on the right is deliberate slack, not a bug.
    width: '12.6%',
    aspectRatio: 1,
    borderRadius: 3,
  },
});
