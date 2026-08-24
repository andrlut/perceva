import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { useCalendarStore } from '@/lib/calendar/store';

/**
 * Retired route. Dedicação is no longer a screen — it is the Rotina front of
 * the calendar, where its heatmap became the intensity ramp, its dimension /
 * sub / min-XP filters became facets of the one funnel, and its chronological
 * log became the list view.
 *
 * This file stays as a redirect because two live entry points still push here
 * with params (`components/pillars/DedicacaoPanel.tsx`), and because a user who
 * kept the old screen in their back stack should land somewhere useful rather
 * than on "Unmatched Route".
 *
 * `dims`, `subs` and `minXp` translate straight into filter facets. `granularity`
 * and `offset` are deliberately dropped: period stopped being filter state and
 * became navigation (month arrows, quarter view), so there is nothing on the
 * other side to receive them.
 */
export default function DedicacaoHistoryRedirect() {
  const params = useLocalSearchParams<{ dims?: string; subs?: string; minXp?: string }>();

  // The calendar seeds its filter from the params it receives; the front is
  // store state, so it is set here instead of travelling through the URL.
  useEffect(() => {
    useCalendarStore.setState({ front: 'rotina', view: 'month' });
  }, []);

  return (
    <Redirect
      href={{
        pathname: '/history',
        params: {
          ...(params.dims ? { dims: params.dims } : {}),
          ...(params.subs ? { subs: params.subs } : {}),
          ...(params.minXp ? { minXp: params.minXp } : {}),
        },
      }}
    />
  );
}
