import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { CoinIcon } from '@/components/CoinIcon';
import { ManageRowShell, manageRowStyles } from '@/components/manage/ManageList';
import type { Reward } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';
import { REWARD_CATEGORY_META } from '@/theme/rewards';

/**
 * A reward in Gerenciar recompensas — the Vault card's identity (category-
 * tinted icon tile and left bar, coin cost) on the manage-row chassis
 * shared with práticas (ManageRowShell): tap → edit, handle → drag. The
 * screen wraps it in the drag library's ScaleDecorator; the guide draws
 * it bare.
 */
export function RewardManageRow({
  reward,
  bought,
  isActive = false,
  onEdit,
  onHandlePressIn,
  onHandlePress,
  onMoveUp,
  onMoveDown,
}: {
  reward: Reward;
  /** One-shot already bought: out of the Vault, still yours to edit. */
  bought: boolean;
  isActive?: boolean;
  onEdit: () => void;
  onHandlePressIn?: () => void;
  onHandlePress?: () => void;
  /** Screen-reader reorder (the handle is touch-only). */
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const { t } = useT();
  const cat = REWARD_CATEGORY_META[reward.category];
  const categoryLabel = t(`rewards.categories.${reward.category}` as const);
  const isCustom = !reward.template_id;
  // Spoken value — the chips are visual only, so a screen reader would
  // otherwise never learn that a one-shot is already bought (and hidden
  // from the Shop).
  const a11yValue = [
    t('rewards.coins', { count: reward.cost }),
    categoryLabel,
    reward.is_one_shot
      ? bought
        ? t('rewardsHub.row.a11yBought')
        : t('rewardsHub.row.a11yOneShot')
      : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const a11yActions = onMoveUp
    ? [
        { name: 'moveUp', label: t('rewardsHub.row.a11yMoveUp') },
        { name: 'moveDown', label: t('rewardsHub.row.a11yMoveDown') },
      ]
    : undefined;

  return (
    // The label replaces the children for screen readers, so cost and
    // category travel as the value; move up / down are custom actions
    // here because the handle is touch-only.
    <ManageRowShell
      accent={cat.color}
      isActive={isActive}
      onEdit={onEdit}
      onHandlePressIn={onHandlePressIn}
      onHandlePress={onHandlePress}
      editA11yLabel={t('rewardsHub.row.editA11y', { title: reward.title })}
      a11yValue={a11yValue}
      accessibilityActions={a11yActions}
      onAccessibilityAction={(e) => {
        switch (e.nativeEvent.actionName) {
          case 'moveUp':
            onMoveUp?.();
            break;
          case 'moveDown':
            onMoveDown?.();
            break;
        }
      }}
    >
      <View
        style={[
          manageRowStyles.tile,
          styles.tileBorder,
          { borderColor: `${cat.color}50`, backgroundColor: `${cat.color}26` },
        ]}
      >
        <AppIcon name={reward.icon} size={17} color={cat.color} />
      </View>
      <View style={manageRowStyles.body}>
        <Text style={manageRowStyles.title} numberOfLines={2}>
          {reward.title}
        </Text>
        <View style={manageRowStyles.metaRow}>
          <RewardCostTag cost={reward.cost} />
          <Text style={[styles.categoryNote, { color: cat.color }]} numberOfLines={1}>
            · {categoryLabel}
          </Text>
          {reward.is_one_shot && (
            <View style={manageRowStyles.chip}>
              <Text style={manageRowStyles.chipText}>
                {bought ? t('rewardsHub.boughtChip') : t('rewardsHub.oneShotChip')}
              </Text>
            </View>
          )}
          {isCustom && (
            <View style={manageRowStyles.chip}>
              <Text style={manageRowStyles.chipText}>{t('rewardsHub.customChip')}</Text>
            </View>
          )}
        </View>
      </View>
    </ManageRowShell>
  );
}

/** Coin + cost, as the rows and the catalog cards print it. */
export function RewardCostTag({ cost }: { cost: number }) {
  return (
    <View style={styles.costTag}>
      <CoinIcon size={11} />
      <Text style={styles.costText}>{cost.toLocaleString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tileBorder: {
    borderWidth: 1,
  },
  costTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  costText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    color: tokens.semantic.coinLight,
    letterSpacing: 0.2,
  },
  categoryNote: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    flexShrink: 1,
  },
});
