import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DayPickerModal } from '@/components/week/DayPickerModal';
import type { WeekItem } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { weekdayShortByIndex } from '@/lib/time';
import { tokens } from '@/theme';

/**
 * One item line. Gestures are split on purpose (owner feedback — hidden
 * long-presses don't exist for users): the CHECKBOX marks done, tapping the
 * TEXT opens the item manager (rename / day / move / delete), the day chip
 * opens the day popup. Checking is wired to ZERO gamification.
 */
export function WeekItemRow({
  item,
  onToggleDone,
  onSetDay,
  onOpen,
}: {
  item: WeekItem;
  onToggleDone: (item: WeekItem) => void;
  onSetDay: (item: WeekItem, day: number | null) => void;
  onOpen: (item: WeekItem) => void;
}) {
  const { t, locale } = useT();
  const [pickerOpen, setPickerOpen] = useState(false);
  const done = item.done_at != null;

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onToggleDone(item);
  };

  return (
    <View style={styles.row}>
      <Pressable
        onPress={handleToggle}
        hitSlop={8}
        style={({ pressed }) => [
          styles.checkbox,
          done && styles.checkboxDone,
          pressed && styles.pressed,
        ]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={item.title}
      >
        {done && <Ionicons name="checkmark" size={13} color={tokens.text.hi} />}
      </Pressable>

      <Pressable
        onPress={() => onOpen(item)}
        onLongPress={() => onOpen(item)}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={t('week.editor.openA11y', { title: item.title })}
      >
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
