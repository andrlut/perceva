import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { BuyConfirmModal } from '@/components/BuyConfirmModal';
import { RedeemPickerSheet } from '@/components/RedeemPickerSheet';
import { UndoRedemptionModal } from '@/components/UndoRedemptionModal';
import { useCharacter } from '@/lib/api/character';
import {
  useOwnedOneShotIds,
  useRedeemRewardN,
  useRedemptionsForDay,
  useRewards,
  useUndoRedemption,
  type RedemptionEntry,
} from '@/lib/api/rewards';
import type { Reward } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { showInfo } from '@/lib/util/confirm';
import { tokens } from '@/theme';

/**
 * "Resgates do dia" — the rewards side of the day on the Home, under the
 * practices and the mood. The same contract as the calendar's day panel:
 *
 *   - each redemption of the selected day is a row (icon, title, cost) with
 *     its own undo (UndoRedemptionModal → undo_reward_redemption, refunds);
 *   - the gold "+" — and the whole empty card — opens the redeem sheet
 *     (RedeemPickerSheet → BuyConfirmModal), filed ON THE DAY BEING VIEWED:
 *     now for today, noon local for a past day, paid with today's balance.
 *     So a forgotten past day is logged right here, as with practices.
 *
 * Self-contained: it owns the sheets and the mutations, so the Home only
 * hands it the date and the day's label.
 */
export function DayRedemptionsCard({ date, dayLabel }: { date: Date; dayLabel: string }) {
  const { t } = useT();
  const { data, isLoading } = useRedemptionsForDay(date);
  const character = useCharacter();
  const activeRewards = useRewards();
  const ownedOneShots = useOwnedOneShotIds();
  const redeem = useRedeemRewardN();
  const undo = useUndoRedemption();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [picked, setPicked] = useState<Reward | null>(null);
  const [undoing, setUndoing] = useState<RedemptionEntry | null>(null);

  const rows = data ?? [];
  const total = rows.reduce((s, r) => s + r.cost_paid, 0);
  const coins = character.data?.character.coins ?? 0;
  const isToday = new Date().toDateString() === date.toDateString();

  const redeemable = useMemo(() => {
    const owned = ownedOneShots.data;
    return (activeRewards.data ?? []).filter((r) => !(r.is_one_shot && owned?.has(r.id)));
  }, [activeRewards.data, ownedOneShots.data]);

  const openPicker = () => {
    Haptics.selectionAsync().catch(() => {});
    setPickerOpen(true);
  };

  const confirmRedeem = async (reward: Reward, qty: number) => {
    setPicked(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    // Noon local on a past day (the calendar's stamp); today logs now, so the
    // ledger keeps its real order.
    const stamp = new Date(date);
    stamp.setHours(12, 0, 0, 0);
    try {
      await redeem.mutateAsync({
        rewardId: reward.id,
        cost: reward.cost,
        qty,
        at: isToday ? undefined : stamp.toISOString(),
      });
    } catch (err) {
      const e = err as { message?: string };
      showInfo(t('reward.shop.buyFail'), e.message ?? t('common.unknownError'));
    }
  };

  const confirmUndo = async (r: RedemptionEntry) => {
    setUndoing(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      await undo.mutateAsync(r.id);
    } catch (err) {
      const e = err as { message?: string };
      showInfo(t('rewards.undoConfirm.failTitle'), e.message ?? t('common.unknownError'));
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="gift-outline" size={16} color={tokens.semantic.coinLight} />
        <Text style={styles.title}>{t('home.redemptions.title')}</Text>
        {total > 0 ? <Text style={styles.total}>{`−${total}`}</Text> : null}
        <Pressable
          onPress={openPicker}
          hitSlop={8}
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel={t('home.redemptions.addA11y')}
        >
          <Ionicons name="add" size={18} color={tokens.semantic.coinLight} />
        </Pressable>
      </View>

      {isLoading ? null : rows.length === 0 ? (
        <Pressable
          onPress={openPicker}
          style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel={t('home.redemptions.addA11y')}
        >
          <Text style={styles.empty}>{t('home.redemptions.empty')}</Text>
        </Pressable>
      ) : (
        rows.map((r) => (
          <View
            key={r.id}
            style={styles.row}
            accessible
            accessibilityLabel={`${r.reward_title}, ${t('rewards.coins', { count: r.cost_paid })}`}
          >
            <View style={styles.rowIcon}>
              <AppIcon name={r.reward_icon || 'gift'} size={15} color={tokens.semantic.coin} />
            </View>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {r.reward_title}
            </Text>
            <Text style={styles.rowCost}>{`−${r.cost_paid}`}</Text>
            <Pressable
              onPress={() => setUndoing(r)}
              hitSlop={8}
              style={({ pressed }) => [styles.undoBtn, pressed && { opacity: 0.6 }]}
              accessibilityRole="button"
              accessibilityLabel={t('calendar.day.undoRedeemA11y', { title: r.reward_title })}
            >
              <Ionicons name="arrow-undo" size={16} color={tokens.brand.violet2} />
            </Pressable>
          </View>
        ))
      )}

      <RedeemPickerSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        rewards={redeemable}
        coins={coins}
        dayLabel={dayLabel}
        onPick={setPicked}
      />
      <BuyConfirmModal
        visible={picked !== null}
        reward={picked}
        coins={coins}
        onCancel={() => setPicked(null)}
        onConfirm={(qty) => {
          const r = picked;
          if (r) void confirmRedeem(r, qty);
        }}
      />
      <UndoRedemptionModal
        visible={undoing !== null}
        rewardTitle={undoing?.reward_title ?? ''}
        rewardIcon={undoing?.reward_icon || 'gift'}
        category={undoing?.reward_category ?? null}
        refund={undoing?.cost_paid ?? 0}
        onCancel={() => setUndoing(null)}
        onConfirm={() => {
          const r = undoing;
          if (r) void confirmUndo(r);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: tokens.space[4],
    marginTop: tokens.space[3],
    padding: tokens.space[4],
    gap: tokens.space[2],
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.semantic.coinRim,
    backgroundColor: tokens.bg.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: tokens.semantic.coinLight,
  },
  total: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: tokens.semantic.coinLight,
  },
  // The app's 32×32 control, in gold.
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 200, 61, 0.14)',
    borderWidth: 1,
    borderColor: tokens.semantic.coinRim,
  },
  emptyBtn: {
    paddingVertical: 4,
  },
  empty: {
    ...tokens.type.caption,
    color: tokens.text.dim,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 200, 61, 0.14)',
  },
  rowTitle: {
    flex: 1,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    color: tokens.text.hi,
  },
  rowCost: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    color: tokens.text.mid,
  },
  undoBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
