import type { ScreenedStep } from '@/components/tour/TourModule';
import type { TranslateOptions } from '@/lib/i18n';

type Translator = (key: string, options?: TranslateOptions) => string;

/**
 * M4 — Rewards.
 *
 *   1. (home)    Rewards bottom-nav tab      — awaitEvent REWARDS_NAVIGATED
 *   2. (rewards) balance + your rewards      — Next (auto-scroll to top)
 *   3. (rewards) redeem + the Gerenciar FAB  — Next (spotlights the gold
 *                floating button at the bottom corner; it always renders,
 *                so the anchor always exists)
 *
 * Step 3 used to auto-scroll to the "Inspiração" block, which disappears
 * once the user owns every template — the FAB is a stable anchor and
 * matches the copy about where the rewards are curated.
 *
 * No commitment: we never ask the user to redeem or add anything.
 */
export const M4_EVENTS = {
  REWARDS_NAVIGATED: 'rewards:navigated',
  /** Fired by the Rewards screen when it regains focus after the user
   *  opened Gerenciar during step 3 — visiting it completes the module
   *  without needing an extra "Próximo" tap. */
  MANAGE_VISITED: 'rewards-manage:visited',
} as const;

export function buildM4Steps(t: Translator): ScreenedStep[] {
  return [
    {
      screen: 'home',
      title: t('tour.m4.step1.title'),
      body: t('tour.m4.step1.body'),
      position: 'bottom',
      awaitEvent: M4_EVENTS.REWARDS_NAVIGATED,
      target: 'tab.rewards',
      awaitCtaLabel: t('tour.common.takeMe'),
    },
    {
      screen: 'rewards',
      title: t('tour.m4.step2.title'),
      body: t('tour.m4.step2.body'),
      position: 'bottom',
    },
    {
      screen: 'rewards',
      title: t('tour.m4.step3.title'),
      body: t('tour.m4.step3.body'),
      // The FAB sits at the bottom corner, so the card opens above it.
      position: 'top',
      target: 'rewards.manage',
      // Opening Gerenciar (and coming back) completes the module; the
      // assist stays for whoever prefers not to tap.
      awaitEvent: M4_EVENTS.MANAGE_VISITED,
      awaitCtaLabel: t('tour.common.next'),
    },
  ];
}
