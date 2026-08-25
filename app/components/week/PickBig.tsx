import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GOLD_BADGE_BG } from '@/components/week/gold';
import { WeekAddInput } from '@/components/week/WeekAddInput';
import type { WeekItem } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/**
 * The bigs are CHOSEN, never typed twice (owner's call): these components
 * present the candidates — the pool ("Pra depois") plus the week's open
 * items — for selection.
 */

export interface BigCandidate {
  item: WeekItem;
  from: 'pool' | 'week';
}

/**
 * Multi-selection list used inline by the ritual's step 2. Selection order
 * is meaning: the first pick is "if only one happens, it's this one".
 */
export function BigCandidateList({
  candidates,
  selectedIds,
  onToggle,
  onCreate,
}: {
  candidates: BigCandidate[];
  /** Ordered — index 0 = big #1. */
  selectedIds: string[];
  onToggle: (id: string) => void;
  onCreate: (title: string) => void;
}) {
  const { t } = useT();

  return (
    <View>
      {candidates.length === 0 && (
        <Text style={styles.empty}>{t('week.pick.empty')}</Text>
      )}
      {candidates.map(({ item, from }) => {
        const order = selectedIds.indexOf(item.id);
        const selected = order >= 0;
        return (
          <Pressable
            key={item.id}
            onPress={() => onToggle(item.id)}
            style={({ pressed }) => [
              styles.row,
              selected && styles.rowOn,
              pressed && styles.pressed,
            ]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={item.title}
          >
            <View style={[styles.badge, selected && styles.badgeOn]}>
              {selected && <Text style={styles.badgeText}>{order + 1}</Text>}
            </View>
            <Text style={styles.rowTitle} numberOfLines={2}>
              {item.title}
            </Text>
            {from === 'pool' && (
              <Text style={styles.fromTag}>{t('week.pick.fromPool')}</Text>
            )}
          </Pressable>
        );
      })}
      <WeekAddInput
        placeholder={t('week.pick.newPlaceholder')}
        onSubmit={onCreate}
      />
    </View>
  );
}

/**
 * Single-pick popup used by an empty slot on the sheet: tap a candidate and
 * it becomes that slot's big, immediately.
 */
export function PickBigModal({
  visible,
  slot,
  candidates,
  onPick,
  onCreate,
  onClose,
}: {
  visible: boolean;
  slot: 1 | 2 | 3;
  candidates: BigCandidate[];
  onPick: (candidate: BigCandidate) => void;
  onCreate: (title: string) => void;
  onClose: () => void;
}) {
  const { t } = useT();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {t('week.pick.slotTitle', { n: slot })}
            </Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button">
              <Ionicons name="close" size={18} color={tokens.text.mid} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {candidates.length === 0 && (
              <Text style={styles.empty}>{t('week.pick.empty')}</Text>
            )}
            {candidates.map((c) => (
              <Pressable
                key={c.item.id}
                onPress={() => {
                  onPick(c);
                  onClose();
                }}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={c.item.title}
              >
                <View style={styles.badge} />
                <Text style={styles.rowTitle} numberOfLines={2}>
                  {c.item.title}
                </Text>
                {c.from === 'pool' && (
                  <Text style={styles.fromTag}>{t('week.pick.fromPool')}</Text>
                )}
              </Pressable>
            ))}
            <WeekAddInput
              placeholder={t('week.pick.newPlaceholder')}
              onSubmit={onCreate}
            />
          </ScrollView>
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
    maxHeight: '75%',
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.strong,
    borderRadius: tokens.radius.lg,
    padding: tokens.space[4],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.space[3],
  },
  cardTitle: {
    fontFamily: tokens.font.familyBold,
    fontSize: 15,
    color: tokens.text.hi,
  },
  scroll: {
    flexGrow: 0,
  },
  pressed: {
    opacity: 0.75,
  },
  empty: {
    fontFamily: tokens.font.family,
    fontSize: 13,
    color: tokens.text.dim,
    marginBottom: tokens.space[3],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: tokens.border.base,
    borderRadius: tokens.radius.md,
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[3],
    marginBottom: tokens.space[2],
  },
  rowOn: {
    borderColor: tokens.semantic.coinRim,
    backgroundColor: 'rgba(255, 200, 61, 0.08)',
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: tokens.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOn: {
    borderColor: 'transparent',
    backgroundColor: GOLD_BADGE_BG,
  },
  badgeText: {
    fontFamily: tokens.font.familyHeavy,
    fontSize: 10,
    color: tokens.semantic.coinLight,
  },
  rowTitle: {
    flex: 1,
    fontFamily: tokens.font.familyBold,
    fontSize: 13,
    color: tokens.text.hi,
  },
  fromTag: {
    fontFamily: tokens.font.familyBold,
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: tokens.text.faint,
  },
});
