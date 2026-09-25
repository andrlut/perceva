import type { ScreenedStep } from '@/components/tour/TourModule';
import type { TranslateOptions } from '@/lib/i18n';

type Translator = (key: string, options?: TranslateOptions) => string;

/**
 * M4 — Recompensas. Answers the two questions first users could not
 * ("what do coins do?", "where do rewards come from?") against the Vault
 * as it is since "resgate = uso" (#444/#445): no Banco any more — buying a
 * reward uses it on the spot, and curation lives behind the Vault's gold
 * primary button (Gerenciar recompensas).
 *
 *   1. (home)    Rewards bottom-nav tab        — awaitEvent REWARDS_NAVIGATED
 *   2. (rewards) the coin balance: coins come
 *                from practices done           — Next (spotlights the hero)
 *   3. (rewards) create / adopt in Gerenciar,
 *                redeem when you want          — awaitEvent MANAGE_VISITED
 *                (spotlights the gold FAB; opening Gerenciar and coming
 *                back completes the module, the assist is for whoever
 *                prefers not to tap)
 *
 * Step 3 names the card's button through `rewards.vault.cta.buy` so the
 * verb the tour teaches is, by construction, the verb on screen. The copy
 * is neutral on purpose: a price can be a treat or the cost of a slip.
 *
 * No commitment: we never ask the user to redeem or create anything.
 */
export const M4_EVENTS = {
  REWARDS_NAVIGATED: 'rewards:navigated',
  /** Fired by the Rewards screen when it regains focus after the user
   *  opened Gerenciar during step 3 — visiting it completes the module
   *  without needing an extra "Próximo" tap. */
  MANAGE_VISITED: 'rewards-manage:visited',
} as const;

/** Index of the step that completes on the Gerenciar visit. */
export const M4_MANAGE_STEP = 2;

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
      // The balance sits at the top of the Vault; the card goes below it.
      position: 'bottom',
      target: 'rewards.balance',
    },
    {
      screen: 'rewards',
      title: t('tour.m4.step3.title'),
      body: t('tour.m4.step3.body', { verb: t('rewards.vault.cta.buy') }),
      // The gold FAB sits at the bottom corner, so the card opens above it.
      position: 'top',
      target: 'rewards.manage',
      awaitEvent: M4_EVENTS.MANAGE_VISITED,
      awaitCtaLabel: t('tour.common.next'),
    },
  ];
}
