import type { ScreenedStep } from '@/components/tour/TourModule';
import type { TranslateOptions } from '@/lib/i18n';

type Translator = (key: string, options?: TranslateOptions) => string;

/**
 * M5 — Eu. The tab is organised around the three portraits (Percebida,
 * Praticada, Desejada), which ARE the perceba / pratique / torne-se
 * triad. v2 stops being read-only: the Percebida step hands the user the
 * one action that fills the portrait — the autoavaliação — because the
 * old tour pointed at a flat hex and never said how to fill it (first-user
 * feedback: the questionnaire, the starting pillar, was never mentioned).
 *
 *   1. (home) Eu bottom-nav tab          — awaitEvent ME_NAVIGATED
 *   2. (me)   the three-portrait switcher — Next (spotlights it)
 *   3. (me)   Percebida: start here       — awaitEvent SELF_ASSESSMENT_OPENED
 *             (spotlights "Fazer autoavaliação"; tapping it opens the
 *             modal AND advances, so step 4 waits underneath for the
 *             return; "Depois" advances without it)
 *   4. (me)   Praticada                   — Next
 *   5. (me)   Desejada / Norte            — Next → Home
 *
 * The Eu screen drives the visible portrait off this step index
 * (`M5_PILLAR_BY_STEP`), so tapping Próximo flips the portrait under the
 * tooltip — "show, don't tell".
 */
export const M5_EVENTS = {
  ME_NAVIGATED: 'me:navigated',
  /** Emitted by AvaliacaoPanel when "Fazer autoavaliação" is tapped. */
  SELF_ASSESSMENT_OPENED: 'self-assessment:opened',
} as const;

/** Portrait each Eu-screen step shows, by step index (index 0 is Home). */
export const M5_PILLAR_BY_STEP: Record<number, 'percebida' | 'praticada' | 'desejada'> = {
  1: 'percebida',
  2: 'percebida',
  3: 'praticada',
  4: 'desejada',
};

/** Index of the "start here" step — the Eu screen scrolls the
 *  self-assessment CTA clear of the tooltip for it. */
export const M5_SELF_ASSESSMENT_STEP = 2;

export function buildM5Steps(t: Translator): ScreenedStep[] {
  return [
    {
      screen: 'home',
      title: t('tour.m5.step1.title'),
      body: t('tour.m5.step1.body'),
      position: 'bottom',
      awaitEvent: M5_EVENTS.ME_NAVIGATED,
      target: 'tab.character',
      awaitCtaLabel: t('tour.common.takeMe'),
    },
    {
      screen: 'me',
      title: t('tour.m5.step2.title'),
      body: t('tour.m5.step2.body'),
      position: 'bottom',
      target: 'me.pillars',
    },
    {
      screen: 'me',
      title: t('tour.m5.step3.title'),
      body: t('tour.m5.step3.body'),
      position: 'bottom',
      target: 'me.self-assessment',
      awaitEvent: M5_EVENTS.SELF_ASSESSMENT_OPENED,
      // Advances in place: step 4 lives on this same screen.
      awaitCtaLabel: t('tour.m5.step3.later'),
    },
    {
      screen: 'me',
      title: t('tour.m5.step4.title'),
      body: t('tour.m5.step4.body'),
      position: 'bottom',
    },
    {
      screen: 'me',
      title: t('tour.m5.step5.title'),
      body: t('tour.m5.step5.body'),
      position: 'bottom',
    },
  ];
}
