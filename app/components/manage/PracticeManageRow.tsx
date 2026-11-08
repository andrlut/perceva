import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { CoinIcon } from '@/components/CoinIcon';
import { CoinMultiplierBadge } from '@/components/CoinMultiplierBadge';
import { ManageRowShell, manageRowStyles } from '@/components/manage/ManageList';
import { SubColoredPips } from '@/components/SubColoredPips';
import { SubStack } from '@/components/SubStack';
import { isCoinsOnly, type TaskWithSubs } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { describeRecurrence } from '@/lib/recurrence';
import { rewardForTaskSubs } from '@/lib/xp';
import { tokens } from '@/theme';

/**
 * A practice in Gerenciar práticas — the Home TaskCard's vocabulary
 * (gradient surface, dim-tinted icon tile, sub stack + colored pips + XP +
 * recurrence note) minus the check button, on the shared manage-row
 * chassis (ManageRowShell): tap → edit, handle → drag. The screen wraps it
 * in the drag library's ScaleDecorator; the guide draws it bare.
 */
export function PracticeManageRow({
  task,
  isActive = false,
  onEdit,
  onHandlePressIn,
  onHandlePress,
  onMoveUp,
  onMoveDown,
  onSwitchGroup,
}: {
  task: TaskWithSubs;
  isActive?: boolean;
  onEdit: () => void;
  onHandlePressIn?: () => void;
  onHandlePress?: () => void;
  /** Screen-reader reorder / regroup (the handle is touch-only). */
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onSwitchGroup?: () => void;
}) {
  const { t } = useT();
  const lookup = useMetaLookup();
  const sub = lookup.sub(task.primary_sub_id);
  const dim = lookup.dim(task.primary_dimension_id);
  const coinsOnly = isCoinsOnly(task);
  const reward = rewardForTaskSubs(task.subs, task.coin_multiplier, task.coin_stars);
  const isCustom = !task.template_id;
  const recurrenceLabel = describeRecurrence(task.recurrence, task.target_count, t);
  // Same rule as TaskCard: the note only when it says something the group
  // does not — a plain daily is already "todo dia" by being in Diárias.
  const showRecurrence = task.recurrence.type !== 'daily' || task.target_count > 1;
  const a11yActions = onMoveUp
    ? [
        { name: 'moveUp', label: t('tasksHub.row.a11yMoveUp') },
        { name: 'moveDown', label: t('tasksHub.row.a11yMoveDown') },
        { name: 'switchGroup', label: t('tasksHub.row.a11ySwitchGroup') },
      ]
    : undefined;

  return (
    // The label replaces the children for screen readers, so the schedule
    // travels as the value; reorder / regroup are custom actions here
    // because the handle is touch-only.
    <ManageRowShell
      accent={coinsOnly ? tokens.semantic.coin : dim.color}
      isActive={isActive}
      onEdit={onEdit}
      onHandlePressIn={onHandlePressIn}
      onHandlePress={onHandlePress}
      editA11yLabel={t('tasksHub.row.editA11y', { title: task.title })}
      a11yValue={recurrenceLabel}
      accessibilityActions={a11yActions}
      onAccessibilityAction={(e) => {
        switch (e.nativeEvent.actionName) {
          case 'moveUp':
            onMoveUp?.();
            break;
          case 'moveDown':
            onMoveDown?.();
            break;
          case 'switchGroup':
            onSwitchGroup?.();
            break;
        }
      }}
    >
      {coinsOnly ? (
        <View style={[manageRowStyles.tile, { backgroundColor: 'rgba(255, 200, 61, 0.14)' }]}>
          {task.icon ? (
            <AppIcon name={task.icon} size={17} color={tokens.semantic.coinLight} />
          ) : (
            <CoinIcon size={19} />
          )}
        </View>
      ) : (
        <View style={[manageRowStyles.tile, { backgroundColor: dim.bg }]}>
          <AppIcon name={task.icon ?? sub.iconName} size={17} color={dim.color} />
        </View>
      )}
      <View style={manageRowStyles.body}>
        <Text style={manageRowStyles.title} numberOfLines={2}>
          {task.title}
        </Text>
        <View style={manageRowStyles.metaRow}>
          {coinsOnly ? (
            <View style={styles.coinsOnlyMeta}>
              <CoinIcon size={14} />
              <Text style={styles.coinsOnlyValue}>+{reward.total.coins}</Text>
            </View>
          ) : (
            <>
              {task.subs.length > 0 && (
                <SubStack subIds={task.subs.map((s) => s.sub_id)} max={3} size={16} />
              )}
              <SubColoredPips subs={task.subs} size={5} />
              <Text style={styles.rewardValue}>+{reward.total.xp}</Text>
              <CoinMultiplierBadge multiplier={task.coin_multiplier} />
            </>
          )}
          {showRecurrence && (
            <Text style={styles.recurrenceNote} numberOfLines={1}>
              · {recurrenceLabel}
            </Text>
          )}
          {isCustom && (
            <View style={manageRowStyles.chip}>
              <Text style={manageRowStyles.chipText}>{t('tasksHub.customChip')}</Text>
            </View>
          )}
        </View>
      </View>
    </ManageRowShell>
  );
}

const styles = StyleSheet.create({
  coinsOnlyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coinsOnlyValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    color: tokens.semantic.coinLight,
  },
  rewardValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    color: tokens.semantic.xp,
    letterSpacing: 0.2,
  },
  // The row's only statement of WHEN inside Periódicas — text.mid (AA on
  // both palettes), not the faint italic the Home card can afford because
  // Hoje already says "today".
  recurrenceNote: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: tokens.text.mid,
    flexShrink: 1,
  },
});
