import type { ReactNode } from 'react';

import { FabStack } from '@/components/FabStack';
import { useT } from '@/lib/i18n';

interface Props {
  /** Pass the RAW bottom-nav clearance (not the tour-bumped value). */
  bottomOffset: number;
  /** Open the "Todas as práticas" see-all doing surface. */
  onSeeAll: () => void;
  /** Open the history / calendar trail. */
  onCalendar: () => void;
  /** Open "Gerenciar práticas" (buckets, reorder, adopt, create). */
  onManage: () => void;
  /** Home wraps the manage button in the M2 tour TourTarget (id
   *  'home.manage'); other hosts can leave it undefined. */
  manageWrap?: (node: ReactNode) => ReactNode;
}

/**
 * Floating action stack for the Tasks home (Hoje) — mirrors
 * RewardsFabStack. Order top → bottom by inverted frequency of use:
 *   - Gerenciar (small, discreet) — the rarely-opened config surface
 *   - Calendário — the history trail
 *   - Todas as práticas (violet, largest, anchors the thumb zone) — the
 *     see-all doing surface, the most common daily jump off Hoje
 *
 * Replaces the three top-right TodayHeader icons: history + manage moved
 * here (bigger, thumb-reachable targets); quests dropped entirely (the
 * QuestChipsStrip already lives in the Home body).
 */
export function TasksFabStack({
  bottomOffset,
  onSeeAll,
  onCalendar,
  onManage,
  manageWrap,
}: Props) {
  const { t } = useT();
  return (
    <FabStack
      bottomOffset={bottomOffset}
      actions={[
        {
          key: 'manage',
          icon: 'options-outline',
          onPress: onManage,
          accessibilityLabel: t('tasksHub.title'),
          size: 'sm',
          tone: 'neutral',
          wrap: manageWrap,
        },
        {
          key: 'calendar',
          icon: 'calendar-outline',
          onPress: onCalendar,
          accessibilityLabel: t('tabs.history'),
          size: 'md',
          tone: 'neutral',
        },
        {
          key: 'see-all',
          icon: 'albums-outline',
          onPress: onSeeAll,
          accessibilityLabel: t('allPractices.title'),
          size: 'lg',
          tone: 'violet',
        },
      ]}
    />
  );
}
