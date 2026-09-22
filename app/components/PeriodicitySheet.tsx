import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RecurrencePicker } from '@/components/RecurrencePicker';
import { useSheetBottomInset } from '@/components/useSheetBottomInset';
import type { Recurrence, TaskWithSubs } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

interface Props {
  visible: boolean;
  /** The practice being re-scheduled. Null while closed. */
  task: TaskWithSubs | null;
  /** Seed the picker with this shape instead of the task's own — a drop
   *  into the periodic group opens the sheet already on Semanal. */
  initialRecurrence?: Recurrence;
  initialTargetCount?: number;
  /** Mutation in flight — the Save button spins and the sheet stays. */
  saving?: boolean;
  onCancel: () => void;
  onConfirm: (recurrence: Recurrence, targetCount: number) => void;
}

/**
 * Bottom sheet that changes only WHEN a practice happens — opened when a
 * row is dropped into the periodic group on the Manage screen. Wraps the
 * very same RecurrencePicker the form uses (type · times per period ·
 * optional weekday / month-day schedule). Save moves the row; nothing
 * else about the practice is touched.
 */
export function PeriodicitySheet({
  visible,
  task,
  initialRecurrence,
  initialTargetCount,
  saving = false,
  onCancel,
  onConfirm,
}: Props) {
  const { t } = useT();
  const sheetBottom = useSheetBottomInset();
  const [recurrence, setRecurrence] = useState<Recurrence>({ type: 'daily' });
  const [targetCount, setTargetCount] = useState(1);

  // Re-seed every time the sheet opens — the picker is local state so
  // half-made edits never leak into the next practice.
  useEffect(() => {
    if (!visible || !task) return;
    setRecurrence(initialRecurrence ?? task.recurrence);
    setTargetCount(initialTargetCount ?? task.target_count ?? 1);
  }, [visible, task, initialRecurrence, initialTargetCount]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={saving ? undefined : onCancel} />
      <SafeAreaView edges={['bottom']} style={styles.sheetWrap} pointerEvents="box-none">
        <View style={[styles.sheet, { paddingBottom: sheetBottom }]}>
          <View style={styles.handle} />
          <Text style={styles.eyebrow}>{t('tasksHub.periodicity.eyebrow').toUpperCase()}</Text>
          <Text style={styles.title} numberOfLines={2}>
            {task?.title ?? ''}
          </Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <RecurrencePicker
              recurrence={recurrence}
              onChange={setRecurrence}
              targetCount={targetCount}
              onChangeTargetCount={setTargetCount}
            />
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              disabled={saving}
              style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              onPress={() => onConfirm(recurrence, targetCount)}
              disabled={saving}
              accessibilityRole="button"
              style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
            >
              {saving ? (
                <ActivityIndicator size="small" color={tokens.text.hi} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color={tokens.text.hi} />
                  <Text style={styles.saveText}>{t('tasksHub.periodicity.save')}</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: tokens.bg.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: tokens.space[5],
    paddingTop: tokens.space[4],
    gap: tokens.space[3],
    maxHeight: '88%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: tokens.border.strong,
    alignSelf: 'center',
  },
  eyebrow: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    letterSpacing: 1.4,
    color: tokens.brand.violet2,
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 18,
    lineHeight: 23,
    color: tokens.text.hi,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingTop: tokens.space[1],
    paddingBottom: tokens.space[2],
  },
  actions: {
    flexDirection: 'row',
    gap: tokens.space[3],
    marginTop: tokens.space[1],
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: tokens.bg.base,
    borderWidth: 1,
    borderColor: tokens.border.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: tokens.text.hi,
  },
  saveBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: tokens.brand.violet,
    ...tokens.shadow.violetGlowSoft,
  },
  saveText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: tokens.text.hi,
    letterSpacing: 0.3,
  },
});
