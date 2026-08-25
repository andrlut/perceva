import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DayPickerModal } from '@/components/week/DayPickerModal';
import type { WeekItem } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { weekdayShortByIndex } from '@/lib/time';
import { confirmAction } from '@/lib/util/confirm';
import { tokens } from '@/theme';

/**
 * One item line: checkbox + title + optional day chip. The chip opens a
 * popup (DayPickerModal) — nothing expands inline. Checking is wired to
 * ZERO gamification: light haptic, the row leaves the open list, done.
 * Long-press deletes (with confirm) — the sheet is the user's text.
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

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onToggleDone(item);
  };

  const handleLongPress = async () => {
    const ok = await confirmAction(t('week.deleteConfirmTitle'), item.title, {
      okText: t('common.delete'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (ok) onDelete(item);
  };

  return (
    <View style={styles.row}>
      <Pressable
        onPress={handleToggle}
        onLongPress={handleLongPress}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={item.title}
      >
        <View style={[styles.checkbox, done && styles.checkboxDone]}>
          {done && (
            <Ionicons name="checkmark" size={13} color={tokens.text.hi} />
          )}
        </View>
        <Text style={[styles.title, done && styles.titleDone]} numberOfLines={2}>
          {item.title}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => setPickerOpen(true)}
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

      <DayPickerModal
        visible={pickerOpen}
        day={item.day}
        onSelect={(d) => onSetDay(item, d)}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: tokens.space[2],
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
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
});
