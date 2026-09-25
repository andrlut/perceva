import type { ScreenedStep } from '@/components/tour/TourModule';
import type { TranslateOptions } from '@/lib/i18n';

type Translator = (key: string, options?: TranslateOptions) => string;

/**
 * M6 — Aprender. Two steps, and the second finally teaches the model the
 * Recanto runs on (the old copy described the retired reels/infographic
 * feed — audit 2026-09):
 *
 *   1. (home)  Learn bottom-nav tab   — awaitEvent LEARN_NAVIGATED
 *   2. (learn) the ideas model in one card: 1–5 short ideas per material,
 *              with sources; flip the card at the end to absorb; absorbing
 *              a whole material is what earns Dedicação; Minhas ideias
 *              keeps what you absorbed. Spotlights the "Minhas ideias"
 *              bulb FAB — the one anchor that survives #454's shelves.
 *
 * On completion (or skip) the caller routes to /tour/wrap when it is still
 * pending, else back Home.
 */
export const M6_EVENTS = {
  LEARN_NAVIGATED: 'learn:navigated',
} as const;

export function buildM6Steps(t: Translator): ScreenedStep[] {
  return [
    {
      screen: 'home',
      title: t('tour.m6.step1.title'),
      body: t('tour.m6.step1.body'),
      position: 'bottom',
      awaitEvent: M6_EVENTS.LEARN_NAVIGATED,
      target: 'tab.learning',
      awaitCtaLabel: t('tour.common.takeMe'),
    },
    {
      screen: 'learn',
      title: t('tour.m6.step2.title'),
      body: t('tour.m6.step2.body'),
      // The bulb FAB sits at the bottom corner, so the card opens above it.
      position: 'top',
      target: 'learn.my-ideas',
    },
  ];
}
