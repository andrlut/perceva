import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { dateKeyFromLocal } from '@/lib/api/history';
import type { MoodLog } from '@/lib/db/types';
import { getCurrentLocale, useT } from '@/lib/i18n';
import { moodLevel } from '@/lib/mood';
import { tokens } from '@/theme';

interface Props {
  /** Map keyed by `YYYY-MM-DD` local-day → that day's mood entry. */
  moods: Map<string, MoodLog> | undefined;
  monthDate: Date;
  selected: Date;
  onSelectDay: (d: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  canGoNext: boolean;
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  pt: 'pt-BR',
};

/**
 * Month calendar colored by mood — the "how I felt this month" view. Each day
 * with an entry fills with its mood color; a small dot marks days that also
 * carry a note or tags. Mirrors the History MonthGrid's layout/navigation so
 * the two calendars feel like one system.
 */
export function MoodMonthGrid({
  moods,
  monthDate,
  selected,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
  canGoNext,
}: Props) {
  const { t } = useT();
  const rows = useMemo(() => buildMonthRows(monthDate), [monthDate]);
  const todayKey = dateKeyFromLocal(new Date());
  const selectedKey = dateKeyFromLocal(selected);
  const now = Date.now();

  const monthLabel = useMemo(() => {
    const tag = LOCALE_MAP[getCurrentLocale()] ?? 'en-US';
    const raw = monthDate.toLocaleDateString(tag, {
      month: 'long',
      year: 'numeric',
    });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [monthDate]);

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
        {WEEKDAY_LABELS.map((l, i) => (
          <Text key={i} style={styles.weekdayLabel}>
            {l}
          </Text>
        ))}
      </View>

      {rows.map((week, rowIdx) => (
        <View key={rowIdx} style={styles.weekRow}>
          {week.map((cell, colIdx) => {
            if (!cell) {
              return <View key={colIdx} style={styles.cellEmpty} />;
            }
            const key = dateKeyFromLocal(cell);
            const entry = moods?.get(key);
            const level = entry ? moodLevel(entry.mood) : null;
            const hasExtras = !!entry && (!!entry.note || (entry.tags?.length ?? 0) > 0);
            const isToday = key === todayKey;
            const isSelected = key === selectedKey;
            const isFuture = cell.getTime() > now;
            return (
              <Pressable
                key={key}
                onPress={() => !isFuture && onSelectDay(cell)}
                disabled={isFuture}
                style={[
                  styles.cell,
                  level
                    ? { backgroundColor: level.color, borderColor: 'transparent' }
                    : { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: tokens.border.base },
                  isToday && styles.cellToday,
                  isSelected && styles.cellSelected,
                  isFuture && styles.cellFuture,
                ]}
              >
                <Text
                  style={[
                    styles.dayNum,
                    level ? styles.dayNumOnColor : null,
                    isFuture && { opacity: 0.4 },
                  ]}
                >
                  {cell.getDate()}
                </Text>
                {hasExtras && <View style={styles.extrasDot} />}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/** 6-row × 7-col grid for the month; null slots before day 1 / after last. */
function buildMonthRows(anyDay: Date): (Date | null)[][] {
  const first = new Date(anyDay.getFullYear(), anyDay.getMonth(), 1);
  const lastDay = new Date(anyDay.getFullYear(), anyDay.getMonth() + 1, 0).getDate();
  const firstDow = first.getDay();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) {
    cells.push(new Date(anyDay.getFullYear(), anyDay.getMonth(), d));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  while (rows.length > 0 && rows[rows.length - 1].every((c) => c === null)) {
    rows.pop();
  }
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
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellEmpty: { flex: 1, aspectRatio: 1 },
  dayNum: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: tokens.text.hi,
  },
  dayNumOnColor: {
    color: tokens.bg.deep,
    fontFamily: 'Manrope_800ExtraBold',
  },
  cellToday: { borderColor: tokens.text.hi, borderWidth: 1.5 },
  cellSelected: { borderColor: tokens.semantic.coin, borderWidth: 2 },
  cellFuture: { opacity: 0.3 },
  extrasDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
});
