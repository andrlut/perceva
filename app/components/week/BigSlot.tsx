import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  GOLD_BADGE_BG,
  GOLD_BORDER_DONE,
  GOLD_TINT_BG,
  GOLD_TINT_BG_DONE,
} from '@/components/week/gold';
import type { WeekItem } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { confirmAction } from '@/lib/util/confirm';
import { tokens } from '@/theme';

/**
 * One of the three "As 3 da Semana" slots — gold-tinted, numbered.
 *
 * There are exactly three of these on the sheet: the template's "máximo 3"
 * rule is physical form (and a DB unique index), never a validation message.
 * An empty slot is a quiet dashed invitation; a filled one checks off like
 * any item and unfolds to hold its "primeiro passo" — nudged, not required.
 */
export function BigSlot({
  slot,
  item,
  onCreate,
  onToggleDone,
  onSetFirstAction,
  onDelete,
}: {
  slot: 1 | 2 | 3;
  item: WeekItem | undefined;
  onCreate: (slot: 1 | 2 | 3, title: string) => void;
  onToggleDone: (item: WeekItem) => void;
  onSetFirstAction: (item: WeekItem, firstAction: string) => void;
  onDelete: (item: WeekItem) => void;
}) {
  const { t } = useT();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [firstActionDraft, setFirstActionDraft] = useState(
    item?.first_action ?? '',
  );

  // Re-sync the first-action draft when the row itself changes (e.g. the
  // ritual rewrote the big) — but never mid-typing on the same row.
  useEffect(() => {
    setFirstActionDraft(item?.first_action ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  const submitTitle = () => {
    const title = draft.trim();
    setEditing(false);
    setDraft('');
    if (title) onCreate(slot, title);
  };

  const submitFirstAction = () => {
    if (!item) return;
    const text = firstActionDraft.trim();
    if (text !== (item.first_action ?? '')) onSetFirstAction(item, text);
  };

  const handleLongPress = async () => {
    if (!item) return;
    const ok = await confirmAction(t('week.deleteConfirmTitle'), item.title, {
      okText: t('common.delete'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (ok) onDelete(item);
  };

  // ── Empty slot ────────────────────────────────────────────────────────────
  if (!item) {
    return (
      <View style={[styles.card, styles.cardEmpty]}>
        {editing ? (
          <View style={styles.row}>
            <View style={[styles.num, styles.numEmpty]}>
              <Text style={styles.numTextEmpty}>{slot}</Text>
            </View>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder={t('week.emptySlot', { n: slot })}
              placeholderTextColor={tokens.text.faint}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={submitTitle}
              onBlur={submitTitle}
            />
          </View>
        ) : (
          <Pressable
            onPress={() => setEditing(true)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={t('week.emptySlot', { n: slot })}
          >
            <View style={[styles.num, styles.numEmpty]}>
              <Text style={styles.numTextEmpty}>{slot}</Text>
            </View>
            <Text style={styles.emptyText}>{t('week.emptySlot', { n: slot })}</Text>
          </Pressable>
        )}
      </View>
    );
  }

  // ── Filled slot ───────────────────────────────────────────────────────────
  const done = item.done_at != null;
  return (
    <View style={[styles.card, done && styles.cardDone]}>
      <Pressable
        onPress={() => onToggleDone(item)}
        onLongPress={handleLongPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={item.title}
      >
        <View style={[styles.num, done && styles.numDone]}>
          {done ? (
            <Ionicons name="checkmark" size={11} color={tokens.bg.deep} />
          ) : (
            <Text style={styles.numText}>{slot}</Text>
          )}
        </View>
        <Text style={[styles.title, done && styles.titleDone]} numberOfLines={2}>
          {item.title}
        </Text>
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('week.firstAction')}
        >
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={15}
            color={tokens.text.dim}
          />
        </Pressable>
      </Pressable>

      {(expanded || (!done && !item.first_action && slot === 1)) && (
        <View style={styles.firstActionRow}>
          <Text style={styles.firstActionLabel}>{t('week.firstAction')}</Text>
          <TextInput
            style={styles.firstActionInput}
            value={firstActionDraft}
            onChangeText={setFirstActionDraft}
            placeholder={t('week.firstActionPlaceholder')}
            placeholderTextColor={tokens.text.faint}
            returnKeyType="done"
            onSubmitEditing={submitFirstAction}
            onBlur={submitFirstAction}
          />
        </View>
      )}
      {!expanded && !!item.first_action && !done && (
        <Text style={styles.firstActionPreview} numberOfLines={1}>
          {item.first_action}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.semantic.coinRim,
    backgroundColor: GOLD_TINT_BG,
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[3],
    marginBottom: tokens.space[2],
  },
  cardEmpty: {
    borderStyle: 'dashed',
    borderColor: tokens.border.strong,
    backgroundColor: 'transparent',
  },
  cardDone: {
    borderColor: GOLD_BORDER_DONE,
    backgroundColor: GOLD_TINT_BG_DONE,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
  },
  pressed: {
    opacity: 0.75,
  },
  num: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: GOLD_BADGE_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numDone: {
    backgroundColor: tokens.semantic.coin,
  },
  numEmpty: {
    backgroundColor: tokens.bg.surface2,
  },
  numText: {
    fontFamily: tokens.font.familyHeavy,
    fontSize: 11,
    color: tokens.semantic.coinLight,
  },
  numTextEmpty: {
    fontFamily: tokens.font.familyHeavy,
    fontSize: 11,
    color: tokens.text.faint,
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
  emptyText: {
    flex: 1,
    fontFamily: tokens.font.family,
    fontSize: 13,
    color: tokens.text.faint,
  },
  input: {
    flex: 1,
    fontFamily: tokens.font.familyBold,
    fontSize: 14,
    color: tokens.text.hi,
    padding: 0,
  },
  firstActionRow: {
    marginTop: tokens.space[2],
    marginLeft: 20 + tokens.space[3],
  },
  firstActionLabel: {
    fontFamily: tokens.font.familyBold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: tokens.semantic.coinLight,
    marginBottom: 2,
  },
  firstActionInput: {
    fontFamily: tokens.font.family,
    fontSize: 13,
    color: tokens.text.base,
    padding: 0,
  },
  firstActionPreview: {
    marginTop: 3,
    marginLeft: 20 + tokens.space[3],
    fontFamily: tokens.font.family,
    fontSize: 12,
    color: tokens.text.mid,
  },
});
