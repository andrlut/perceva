import { useSession } from '@/lib/auth';

import { GATES_SINCE, UNLOCK_GATES_ENABLED } from './constants';

/**
 * True on the account's first calendar day (local), for accounts that go
 * through the progressive unlocks. Day one is for the first practice only:
 * the mood check-in (strip + evening prompt) joins Hoje from day 2
 * (Onboarding simples, unlock table). Grandfathered accounts and the
 * kill-switch read false, so nothing changes for them.
 */
export function useIsFirstDay(): boolean {
  const { session } = useSession();
  const createdAt = session?.user?.created_at;
  if (!UNLOCK_GATES_ENABLED || !createdAt) return false;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;
  if (created.getTime() < new Date(GATES_SINCE).getTime()) return false;
  const now = new Date();
  return (
    created.getFullYear() === now.getFullYear() &&
    created.getMonth() === now.getMonth() &&
    created.getDate() === now.getDate()
  );
}
