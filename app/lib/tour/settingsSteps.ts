import type { ScreenedStep } from '@/components/tour/TourModule';
import type { TranslateOptions } from '@/lib/i18n';

type Translator = (key: string, options?: TranslateOptions) => string;

/**
 * Help module — Ajustes. Mandatory on a first run, right after the starter
 * pack, whatever the intro choice was: first users found the app
 * confusing, so before anything else they learn the two ways out of being
 * lost (see SETTINGS_MODULE in constants.ts).
 *
 *   1. (home)     Ajustes bottom-nav tab   — awaitEvent SETTINGS_NAVIGATED
 *   2. (settings) "Refazer tutorial" card  — Next
 *   3. (settings) "Conecte sua IA" card    — Entendi → Home (the guided
 *                 tour's M1, the self-assessment, or just Home)
 *
 * Premium sits above both cards and is deliberately never spotlighted: the
 * first thing the tour shows must not read as a paywall. The settings
 * screen scrolls it out of view while steps 2–3 run.
 */
export const SETTINGS_EVENTS = {
  SETTINGS_NAVIGATED: 'settings:navigated',
} as const;

export function buildSettingsSteps(t: Translator): ScreenedStep[] {
  return [
    {
      screen: 'home',
      title: t('tour.settings.step1.title'),
      body: t('tour.settings.step1.body'),
      position: 'bottom',
      awaitEvent: SETTINGS_EVENTS.SETTINGS_NAVIGATED,
      target: 'tab.profile',
      awaitCtaLabel: t('tour.common.takeMe'),
    },
    {
      screen: 'settings',
      title: t('tour.settings.step2.title'),
      body: t('tour.settings.step2.body'),
      position: 'bottom',
      target: 'settings.replay',
    },
    {
      screen: 'settings',
      title: t('tour.settings.step3.title'),
      body: t('tour.settings.step3.body'),
      position: 'bottom',
      target: 'settings.ai',
      primaryLabel: t('tour.settings.done'),
    },
  ];
}
