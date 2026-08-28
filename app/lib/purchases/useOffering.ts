import { useQuery } from '@tanstack/react-query';

import type { PurchasesPackage } from 'react-native-purchases';

import type { PlanId } from '@/lib/premium';

import { getCurrentOffering, purchasesAvailable } from './purchases';

export interface OfferingPlans {
  annual: PurchasesPackage | null;
  monthly: PurchasesPackage | null;
}

/**
 * The live "default" offering mapped to the app's PlanId model. Uses RC's
 * standard package slots ($rc_annual / $rc_monthly → .annual / .monthly).
 * Disabled entirely when purchases are unavailable, so the paywall falls
 * back to the hardcoded i18n prices without firing a doomed query.
 */
export function useOffering() {
  return useQuery<OfferingPlans>({
    queryKey: ['rc', 'offering'],
    enabled: purchasesAvailable(),
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const offering = await getCurrentOffering();
      return {
        annual: offering?.annual ?? null,
        monthly: offering?.monthly ?? null,
      };
    },
  });
}

export function packageForPlan(
  plans: OfferingPlans | undefined,
  plan: PlanId,
): PurchasesPackage | null {
  if (!plans) return null;
  return plan === 'annual' ? plans.annual : plans.monthly;
}
