import { useCallback, useState } from 'react';

/**
 * Pull-to-refresh indicator as LOCAL state.
 *
 * Binding a RefreshControl to the queries' `isRefetching` shows the spinner
 * on every background refetch too — a mutation's invalidation, a return to
 * the screen, the app coming back to the foreground (the root layout wires
 * TanStack's focusManager to AppState). On iOS `refreshing=true` even scrolls
 * the content down to reveal the control. With this hook the spinner only
 * runs for a real pull, from the gesture until that pull's refetches settle;
 * background refetches update the data silently.
 *
 *   const { refreshing, onRefresh } = usePullToRefresh(() =>
 *     Promise.all([tasks.refetch(), templates.refetch()]),
 *   );
 *   <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
 */
export function usePullToRefresh(refetch: () => Promise<unknown> | void) {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);
  return { refreshing, onRefresh };
}
