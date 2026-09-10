import type { ReactNode } from 'react';

import { FabStack, fabStackClearance, type FabSize } from '@/components/FabStack';
import { useT } from '@/lib/i18n';

const CALENDAR_SIZE: FabSize = 'md';
const SEE_ALL_SIZE: FabSize = 'lg';

/** Height this stack occupies above its `bottomOffset` — the Home scroll
 *  reserves it. Derived from the SAME sizes the buttons render with, so
 *  resizing a button can't silently re-open the overlap. */
export const TASKS_FAB_CLEARANCE = fabStackClearance([CALENDAR_SIZE, SEE_ALL_SIZE]);

interface Props {
  /** Pass the RAW bottom-nav clearance (not the tour-bumped value). */
  bottomOffset: number;
  /** Open the "Todas as práticas" see-all doing surface (which itself hosts
   *  the "Gerenciar" entry). */
  onSeeAll: () => void;
  /** Open the unified History calendar. */
  onCalendar: () => void;
  /** Home wraps the primary (Todas) button in the M2 tour TourTarget (id
   *  'home.manage'); other hosts can leave it undefined. */
  seeAllWrap?: (node: ReactNode) => ReactNode;
}

/**
 * Floating action stack for the Tasks home (Hoje) — two buttons in the
 * bottom-right thumb zone:
 *   - Calendário (top) — the unified History calendar, a dedicated,
 *     heavy screen worth its own button
 *   - Todas as práticas (bottom, violet, primary) — the see-all doing
 *     surface; "Gerenciar práticas" lives INSIDE it, so it doesn't need a
 *     FAB of its own and the stack stays out of the way of the per-card
 *     complete buttons.
 */
export function TasksFabStack({
  bottomOffset,
  onSeeAll,
  onCalendar,
  seeAllWrap,
}: Props) {
  const { t } = useT();
  return (
    <FabStack
      bottomOffset={bottomOffset}
      actions={[
        {
          key: 'calendar',
          icon: 'calendar-outline',
          onPress: onCalendar,
          accessibilityLabel: t('tabs.history'),
          size: CALENDAR_SIZE,
          tone: 'neutral',
        },
        {
          key: 'see-all',
          icon: 'albums-outline',
          onPress: onSeeAll,
          accessibilityLabel: t('allPractices.title'),
          size: SEE_ALL_SIZE,
          tone: 'violet',
          wrap: seeAllWrap,
        },
      ]}
    />
  );
}
