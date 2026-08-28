import { useEffect } from 'react';

import { useSession } from '@/lib/auth';

import {
  logInPurchases,
  logOutPurchases,
  purchasesAvailable,
} from './purchases';

/**
 * Root-layout hook (mounted once, like useNotificationsSetup): keeps the
 * RevenueCat identity in lockstep with the Supabase session. No-op wherever
 * purchases are unavailable (Expo Go, pre-1.3.0 binaries, platforms without
 * an API key).
 */
export function usePurchasesSetup(): void {
  const { user, isLoading } = useSession();

  useEffect(() => {
    if (!purchasesAvailable() || isLoading) return;
    if (user?.id) {
      logInPurchases(user.id);
    } else {
      logOutPurchases();
    }
  }, [user?.id, isLoading]);
}
