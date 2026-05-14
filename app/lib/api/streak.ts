/**
 * Legacy compatibility only. New UI should use lib/api/momentum.
 */

import { momentumKeys, useMomentum } from './momentum';

export const streakKeys = momentumKeys;

export interface StreakState {
  currentStreak: number;
  hasCompletionToday: boolean;
  multiplier: number;
}

export function useStreak() {
  const momentum = useMomentum();
  return {
    ...momentum,
    data: momentum.data
      ? {
          currentStreak: 0,
          hasCompletionToday: false,
          multiplier: 1,
        }
      : undefined,
  };
}
