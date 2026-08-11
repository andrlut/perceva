import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useT } from '@/lib/i18n';
import { formatClock, formatHourShort } from '@/lib/time';
import { tokens } from '@/theme';

interface Props {
  visible: boolean;
  eyebrow: string;
  title: string;
  description?: string;
  hour: number;
  minute: number;
  /** Inclusive hour bounds. Constraining the range is what keeps this a
   *  glanceable grid instead of something you have to scroll. */
  minHour: number;
  maxHour: number;
  onCancel: () => void;
  onConfirm: (hour: number, minute: number) => void;
}

const MINUTES = [0, 15, 30, 45];

/** Snap an incoming value onto the grid, so a finer-grained stored value can
 *  never render with nothing selected. */
function snap15(m: number): number {
  return (Math.round(m / 15) * 15) % 60;
}

/**
 * Hand-rolled time picker — a bounded chip grid, not a scroll wheel.
 *
 * No picker library is installed, and adding one would be a native module:
 * that would force a full `eas build` and cost the whole feature its
 * over-the-air path. A grid is also correct on first paint, can't wobble
 * between indices, and is drivable by a screen reader — none of which is true
 * of a hand-built wheel.
 *
 * Commits on Save, never on each tap: every write re-runs the notifications
 * effect, which cancels ALL scheduled notifications and re-schedules three.
 * Overlapping runs of that are how a user ends up with nothing scheduled.
 */
export function TimePickerSheet({
  visible,
  eyebrow,
  title,
  description,
  hour,
  minute,
  minHour,
  maxHour,
  onCancel,
  onConfirm,
}: Props) {
  const { t, locale } = useT();
  const [draft, setDraft] = useState({ h: hour, m: snap15(minute) });

  // Re-prime on open so a cancelled edit never leaks into the next one.
  useEffect(() => {
    if (visible) setDraft({ h: hour, m: snap15(minute) });
  }, [visible, hour, minute]);

  const dirty = draft.h !== hour || draft.m !== minute;
  const hours: number[] = [];
  for (let h = minHour; h <= maxHour; h++) hours.push(h);

  const pick = (next: { h: number; m: number }) => {
    Haptics.selectionAsync().catch(() => {});
    setDraft(next);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel} />
      <SafeAreaView edges={['bottom']} style={styles.sheetWrap} pointerEvents="box-none">
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
          {!!description && <Text style={styles.description}>{description}</Text>}

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* The focal point a grid otherwise lacks. */}
            <Text style={styles.readout}>
              {formatClock(draft.h, draft.m, locale)}
            </Text>

            <Text style={styles.subLabel}>{t('timePicker.hourLabel')}</Text>
            <View style={styles.grid}>
              {hours.map((h) => {
                const selected = h === draft.h;
                return (
                  <Pressable
                    key={h}
                    onPress={() => pick({ h, m: draft.m })}
                    style={[
                      styles.cell,
                      styles.hourCell,
                      // en labels ("9 PM") are wider and clip at 4 columns.
                      { flexBasis: locale === 'en' ? '30%' : '22%' },
                      selected && styles.cellSelected,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={t('timePicker.a11ySelect', {
                      time: formatClock(h, draft.m, locale),
                    })}
                  >
                    <Text style={[styles.cellText, selected && styles.cellTextSelected]}>
                      {formatHourShort(h, locale)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.subLabel}>{t('timePicker.minuteLabel')}</Text>
            <View style={styles.grid}>
              {MINUTES.map((m) => {
                const selected = m === draft.m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => pick({ h: draft.h, m })}
                    style={[
                      styles.cell,
                      styles.minuteCell,
                      selected && styles.cellSelected,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={t('timePicker.a11ySelect', {
                      time: formatClock(draft.h, m, locale),
                    })}
                  >
                    {/* The leading colon separates this row from the hour
                        grid at a glance. */}
                    <Text style={[styles.cellText, selected && styles.cellTextSelected]}>
                      :{String(m).padStart(2, '0')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.6 }]}
              accessibilityRole="button"
            >
              <Text style={styles.ghostText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              onPress={() => onConfirm(draft.h, draft.m)}
              disabled={!dirty}
              style={({ pressed }) => [
                styles.primaryBtn,
                !dirty && { opacity: 0.5 },
                pressed && dirty && { opacity: 0.8 },
              ]}
              accessibilityRole="button"
              accessibilityState={{ disabled: !dirty }}
            >
              <Text style={styles.primaryText}>{t('common.save')}</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: tokens.bg.surface,
    borderTopLeftRadius: tokens.radius.lg,
    borderTopRightRadius: tokens.radius.lg,
    padding: tokens.space[5],
    gap: tokens.space[3],
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: tokens.border.strong,
    alignSelf: 'center',
    marginBottom: tokens.space[2],
  },
  eyebrow: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    letterSpacing: 1.4,
    color: tokens.brand.violet2,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 18,
    color: tokens.text.hi,
  },
  description: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    lineHeight: 19,
    color: tokens.text.mid,
  },
  // Fits without scrolling at default font scale; the ScrollView is the
  // escape hatch for large OS font scales.
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: tokens.space[2],
  },
  readout: {
    ...tokens.type.numLg,
    color: tokens.text.hi,
    textAlign: 'center',
    paddingVertical: tokens.space[2],
  },
  subLabel: {
    ...tokens.type.caption,
    color: tokens.text.mid,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.space[2],
  },
  cell: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.border.base,
    backgroundColor: tokens.bg.surface2,
  },
  hourCell: {
    minWidth: 64,
    height: 48,
  },
  minuteCell: {
    flexBasis: '22%',
    minWidth: 64,
    height: 44,
  },
  cellSelected: {
    borderColor: tokens.brand.violet2,
    backgroundColor: 'rgba(123, 92, 255, 0.16)',
  },
  cellText: {
    ...tokens.type.caption,
    fontFamily: 'Manrope_700Bold',
    color: tokens.text.mid,
  },
  cellTextSelected: {
    color: tokens.brand.violet2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: tokens.space[1],
  },
  ghostBtn: {
    minHeight: 44,
    paddingHorizontal: tokens.space[3],
    justifyContent: 'center',
  },
  ghostText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: tokens.text.mid,
  },
  primaryBtn: {
    minHeight: 44,
    paddingHorizontal: tokens.space[5],
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.brand.violet2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: '#12142E',
  },
});
