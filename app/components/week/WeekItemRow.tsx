import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { WeekItem } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { weekdayShortByIndex } from '@/lib/time';
import { confirmAction } from '@/lib/util/confirm';
import { tokens } from '@/theme';

/**
 * One "Mais desta semana" line: checkbox + title + optional day chip.
 * Tapping the chip unfolds an inline row of the 7 days (+ "any day") — no
 * modal, no time picker: the sheet's "when" is a day at most, never an hour.
 * Long-press deletes (with confirm) — the sheet is the user's text to erase.
 *
 * Checking is wired to ZERO gamification by design: it flips `done_at`,
 * nothing else. The tick is the reward.
 */
export function WeekItemRow({
  item,
  onToggleDone,
  onSetDay,
  onDelete,
}: {
  item: WeekItem;
  onToggleDone: (item: WeekItem) => void;
  onSetDay: (item: WeekItem, day: number | null) => void;
  onDelete: (item: WeekItem) => void;
}) {
  const { t, locale } = useT();
  const [pickerOpen, setPickerOpen] = useState(false);
  const done = item.done_at != null;

  const handleLongPress = async () => {
    const ok = await confirmAction(
      t('week.deleteConfirmTitle'),
      item.title,
      {
        okText: t('common.delete'),
        cancelText: t('common.cancel'),
        destructive: true,
      },
    );
    if (ok) onDelete(item);
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => onToggleDone(item)}
        onLongPress={handleLongPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={item.title}
      >
        <View style={[styles.checkbox, done && styles.checkboxDone]}>
          {done && (
            <Ionicons name="checkmark" size={13} color={tokens.text.hi} />
          )}
        </View>
        <Text
          style={[styles.title, done && styles.titleDone]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <Pressable
          onPress={() => setPickerOpen((v) => !v)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('week.dayChipA11y')}
          style={({ pressed }) => [
            styles.dayChip,
            item.day == null && styles.dayChipEmpty,
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={[
              styles.dayChipText,
              item.day == null && styles.dayChipTextEmpty,
            ]}
          >
            {item.day == null ? '—' : weekdayShortByIndex(item.day, locale)}
          </Text>
        </Pressable>
      </Pressable>

      {pickerOpen && (
        <View style={styles.picker}>
          {[0, 1, 2, 3, 4, 5, 6].map((d) => (
            <Pressable
              key={d}
              onPress={() => {
                onSetDay(item, d);
                setPickerOpen(false);
              }}
              style={({ pressed }) => [
                styles.pickerDay,
                item.day === d && styles.pickerDayOn,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.pickerDayText,
                  item.day === d && styles.pickerDayTextOn,
                ]}
              >
                {weekdayShortByIndex(d, locale)}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => {
              onSetDay(item, null);
              setPickerOpen(false);
            }}
            style={({ pressed }) => [styles.pickerDay, pressed && styles.pressed]}
          >
            <Text style={styles.pickerDayText}>—</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: tokens.space[2],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
    borderRadius: tokens.radius.md,
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[3],
  },
  pressed: {
    opacity: 0.75,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: tokens.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    borderColor: tokens.brand.violet,
    backgroundColor: tokens.brand.violetDeep,
  },
  title: {
    flex: 1,
    fontFamily: tokens.font.familyBold,
    fontSize: 14,
    color: tokens.text.hi,
  },
  titleDone: {
    color: tokens.text.dim,
    textDecorationLine: 'line-through',
    fontFamily: tokens.font.family,
  },
  dayChip: {
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(155, 130, 255, 0.4)',
    backgroundColor: 'rgba(123, 92, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    minWidth: 44,
    alignItems: 'center',
  },
  dayChipEmpty: {
    borderColor: tokens.border.base,
    backgroundColor: 'transparent',
  },
  dayChipText: {
    fontFamily: tokens.font.familyBold,
    fontSize: 10,
    letterSpacing: 0.6,
    color: tokens.brand.violet2,
  },
  dayChipTextEmpty: {
    color: tokens.text.dim,
  },
  picker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: tokens.space[2],
    paddingHorizontal: tokens.space[1],
  },
  pickerDay: {
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.border.base,
    paddingHorizontal: 11,
    paddingVertical: 6,
    minWidth: 44,
    alignItems: 'center',
  },
  pickerDayOn: {
    borderColor: tokens.brand.violet2,
    backgroundColor: 'rgba(123, 92, 255, 0.18)',
  },
  pickerDayText: {
    fontFamily: tokens.font.familyBold,
    fontSize: 10,
    letterSpacing: 0.6,
    color: tokens.text.mid,
  },
  pickerDayTextOn: {
    color: tokens.text.hi,
  },
});
