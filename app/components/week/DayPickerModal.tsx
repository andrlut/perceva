import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useT } from '@/lib/i18n';
import { weekdayShortByIndex } from '@/lib/time';
import { tokens } from '@/theme';

/**
 * "Que dia?" — a real popup (owner's ask: tap, the days appear, pick, done —
 * nothing shifting the list around). Selecting closes immediately.
 */
export function DayPickerModal({
  visible,
  day,
  onSelect,
  onClose,
}: {
  visible: boolean;
  day: number | null;
  onSelect: (day: number | null) => void;
  onClose: () => void;
}) {
  const { t, locale } = useT();

  const pick = (d: number | null) => {
    onSelect(d);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{t('week.dayModal.title')}</Text>
          <View style={styles.grid}>
            {[0, 1, 2, 3, 4, 5, 6].map((d) => (
              <Pressable
                key={d}
                onPress={() => pick(d)}
                style={({ pressed }) => [
                  styles.chip,
                  day === d && styles.chipOn,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: day === d }}
              >
                <Text style={[styles.chipText, day === d && styles.chipTextOn]}>
                  {weekdayShortByIndex(d, locale)}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={() => pick(null)}
            style={({ pressed }) => [styles.noneBtn, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.noneText}>{t('week.dayModal.none')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 8, 24, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.space[6],
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.strong,
    borderRadius: tokens.radius.lg,
    padding: tokens.space[4],
  },
  pressed: {
    opacity: 0.75,
  },
  title: {
    fontFamily: tokens.font.familyBold,
    fontSize: 15,
    color: tokens.text.hi,
    marginBottom: tokens.space[3],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minWidth: 64,
    alignItems: 'center',
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    borderColor: tokens.border.base,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  chipOn: {
    borderColor: tokens.brand.violet2,
    backgroundColor: 'rgba(123, 92, 255, 0.18)',
  },
  chipText: {
    fontFamily: tokens.font.familyBold,
    fontSize: 12,
    letterSpacing: 0.6,
    color: tokens.text.base,
  },
  chipTextOn: {
    color: tokens.text.hi,
  },
  noneBtn: {
    marginTop: tokens.space[3],
    alignItems: 'center',
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    borderColor: tokens.border.base,
    paddingVertical: 10,
  },
  noneText: {
    fontFamily: tokens.font.familyBold,
    fontSize: 12,
    color: tokens.text.mid,
  },
});
