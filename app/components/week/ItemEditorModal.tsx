import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { GOLD_BADGE_BG } from '@/components/week/gold';
import {
  useAllocateItem,
  useDeleteWeekItem,
  useUpdateWeekItem,
} from '@/lib/api/week';
import type { WeekItem } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { weekdayShortByIndex } from '@/lib/time';
import { confirmAction } from '@/lib/util/confirm';
import { tokens } from '@/theme';

/**
 * The item manager — owner's ask: one central menu per item. Tap any item's
 * text (sheet, pool, ritual) and everything lives here: rename, day, move
 * between the week and the queue, demote from the 3, delete. The checkbox
 * stays the only "done" gesture; managing is always this popup.
 */
export function ItemEditorModal({
  item,
  cacheWeek,
  sheetWeek,
  onClose,
}: {
  /** null = hidden. */
  item: WeekItem | null;
  /** Cache the item currently lives in (a week key, or null = pool). */
  cacheWeek: string | null;
  /** What "Esta semana" means here (the sheet/ritual's week). */
  sheetWeek: string;
  onClose: () => void;
}) {
  const { t, locale } = useT();
  const updateItem = useUpdateWeekItem();
  const deleteItem = useDeleteWeekItem();
  const allocate = useAllocateItem();

  const [title, setTitle] = useState('');
  useEffect(() => {
    setTitle(item?.title ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  if (!item) return null;

  const inPool = item.week_start == null;
  const isBig = item.slot != null;

  const saveTitleIfChanged = () => {
    const next = title.trim();
    if (next && next !== item.title) {
      updateItem.mutate({ id: item.id, weekStart: cacheWeek, patch: { title: next } });
    }
  };

  const close = () => {
    saveTitleIfChanged();
    onClose();
  };

  const handleSetDay = (day: number | null) => {
    updateItem.mutate({ id: item.id, weekStart: cacheWeek, patch: { day } });
  };

  const handleMove = () => {
    saveTitleIfChanged();
    allocate.mutate({
      item,
      fromWeek: cacheWeek,
      toWeek: inPool ? sheetWeek : null,
    });
    onClose();
  };

  const handleUnslot = () => {
    saveTitleIfChanged();
    allocate.mutate({ item, fromWeek: cacheWeek, toWeek: cacheWeek, slot: null });
    onClose();
  };

  const handleDelete = async () => {
    const ok = await confirmAction(t('week.deleteConfirmTitle'), item.title, {
      okText: t('common.delete'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (!ok) return;
    deleteItem.mutate({ id: item.id, weekStart: cacheWeek });
    onClose();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* ── Title ── */}
          <View style={styles.titleRow}>
            {isBig && (
              <View style={styles.bigBadge}>
                <Text style={styles.bigBadgeText}>{item.slot}</Text>
              </View>
            )}
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder={t('week.editor.titlePlaceholder')}
              placeholderTextColor={tokens.text.faint}
              returnKeyType="done"
              onSubmitEditing={close}
            />
            <Pressable onPress={close} hitSlop={10} accessibilityRole="button">
              <Ionicons name="close" size={18} color={tokens.text.mid} />
            </Pressable>
          </View>

          {/* ── Day (only for allocated items) ── */}
          {!inPool && (
            <>
              <Text style={styles.label}>{t('week.editor.dayLabel')}</Text>
              <View style={styles.dayGrid}>
                {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => handleSetDay(item.day === d ? null : d)}
                    style={({ pressed }) => [
                      styles.dayChip,
                      item.day === d && styles.dayChipOn,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: item.day === d }}
                  >
                    <Text
                      style={[
                        styles.dayChipText,
                        item.day === d && styles.dayChipTextOn,
                      ]}
                    >
                      {weekdayShortByIndex(d, locale)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {/* ── Actions ── */}
          <View style={styles.actions}>
            <Pressable
              onPress={handleMove}
              style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Ionicons
                name={inPool ? 'arrow-up-outline' : 'archive-outline'}
                size={14}
                color={tokens.brand.violet2}
              />
              <Text style={styles.actionText}>
                {inPool ? t('week.editor.toWeek') : t('week.editor.toPool')}
              </Text>
            </Pressable>
            {isBig && (
              <Pressable
                onPress={handleUnslot}
                style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <Ionicons
                  name="remove-circle-outline"
                  size={14}
                  color={tokens.semantic.coinLight}
                />
                <Text style={[styles.actionText, { color: tokens.semantic.coinLight }]}>
                  {t('week.bigMenu.unslot')}
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Ionicons name="trash-outline" size={14} color={tokens.semantic.danger} />
              <Text style={[styles.actionText, { color: tokens.semantic.danger }]}>
                {t('common.delete')}
              </Text>
            </Pressable>
          </View>

          {/* ── Save ── */}
          <Pressable
            onPress={close}
            style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.saveText}>{t('week.editor.save')}</Text>
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
    padding: tokens.space[5],
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.strong,
    borderRadius: tokens.radius.lg,
    padding: tokens.space[4],
  },
  pressed: {
    opacity: 0.75,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
  },
  bigBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: GOLD_BADGE_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigBadgeText: {
    fontFamily: tokens.font.familyHeavy,
    fontSize: 11,
    color: tokens.semantic.coinLight,
  },
  titleInput: {
    flex: 1,
    fontFamily: tokens.font.familyBold,
    fontSize: 15,
    color: tokens.text.hi,
    padding: 0,
  },
  label: {
    fontFamily: tokens.font.familyBold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: tokens.text.mid,
    marginTop: tokens.space[4],
    marginBottom: tokens.space[2],
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayChip: {
    minWidth: 46,
    alignItems: 'center',
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    borderColor: tokens.border.base,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  dayChipOn: {
    borderColor: tokens.brand.violet2,
    backgroundColor: 'rgba(123, 92, 255, 0.18)',
  },
  dayChipText: {
    fontFamily: tokens.font.familyBold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: tokens.text.base,
  },
  dayChipTextOn: {
    color: tokens.text.hi,
  },
  actions: {
    marginTop: tokens.space[4],
    gap: tokens.space[2],
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
    borderWidth: 1,
    borderColor: tokens.border.base,
    borderRadius: tokens.radius.md,
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[3],
  },
  actionText: {
    fontFamily: tokens.font.familyBold,
    fontSize: 13,
    color: tokens.brand.violet2,
  },
  saveBtn: {
    marginTop: tokens.space[4],
    backgroundColor: tokens.brand.violetDeep,
    borderRadius: tokens.radius.md,
    paddingVertical: tokens.space[3],
    alignItems: 'center',
  },
  saveText: {
    fontFamily: tokens.font.familyBold,
    fontSize: 14,
    color: tokens.text.hi,
  },
});
