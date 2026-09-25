import { router } from 'expo-router';

import type { ScreenedStep, TourScreen } from '@/components/tour/TourModule';
import { isTerminal } from '@/lib/tour/constants';
import { getCurrentTourModule, useTourStore } from '@/lib/tour/store';
import type { TranslateOptions } from '@/lib/i18n';

type Translator = (key: string, options?: TranslateOptions) => string;

/**
 * M2 — Criar prática, along the REAL path (no tour-only reroute):
 *
 *   1. (home)   "Todas as práticas" FAB  — awaitEvent ALL_OPENED, fired by
 *                                          the FAB's normal press (which still
 *                                          opens /all-practices)
 *   2. (all)    the "Gerenciar" entry    — awaitEvent MANAGE_OPENED
 *   3. (tasks)  the `+`                  — awaitEvent CREATE_TASK_TAPPED
 *   4. (create) what it trains           — sub-areas + 1..5 stars each
 *   5. (create) how often                — cadence
 *   6. (create) what it's worth in coins — the multiplier; last
 *
 * The 2026-09 audit found the old step 1 rerouted the FAB to /tasks while
 * the step was up, so the tour trained a gesture that did something else
 * afterwards. Every gesture here does exactly what it does outside the tour.
 *
 * The form is passive: nothing has to be filled or saved. Leaving it in any
 * way while a create step is up — the last Próximo, the X, hardware back,
 * saving — completes M2 and lands on HOME (`finishM2AtHome`), where the next
 * module picks up. The audit found the old M2 ended stranded on /tasks.
 */
export const M2_EVENTS = {
  ALL_OPENED: 'all-practices:opened',
  MANAGE_OPENED: 'manage-practices:opened',
  CREATE_TASK_TAPPED: 'create-task:tapped',
} as const;

/** Step ids, in order. Screens key their scroll/measure logic off these. */
export const M2_STEP_KEYS = ['seeAll', 'manage', 'create', 'trains', 'often', 'coins'] as const;
export type M2StepKey = (typeof M2_STEP_KEYS)[number];

/** Screen each step lives on, aligned with M2_STEP_KEYS. */
export const M2_STEP_SCREENS: readonly TourScreen[] = [
  'home',
  'all',
  'tasks',
  'create',
  'create',
  'create',
];

export function buildM2Steps(t: Translator): ScreenedStep[] {
  return [
    {
      screen: 'home',
      title: t('tour.m2.seeAll.title'),
      body: t('tour.m2.seeAll.body'),
      // 'top' keeps the bottom-right FAB and its ring in the clear.
      position: 'top',
      target: 'home.manage',
      awaitEvent: M2_EVENTS.ALL_OPENED,
      awaitCtaLabel: t('tour.common.takeMe'),
    },
    {
      screen: 'all',
      title: t('tour.m2.manage.title'),
      body: t('tour.m2.manage.body'),
      position: 'bottom',
      target: 'all.manage',
      awaitEvent: M2_EVENTS.MANAGE_OPENED,
      awaitCtaLabel: t('tour.common.takeMe'),
    },
    {
      screen: 'tasks',
      title: t('tour.m2.create.title'),
      body: t('tour.m2.create.body'),
      position: 'bottom',
      target: 'tasks.create',
      awaitEvent: M2_EVENTS.CREATE_TASK_TAPPED,
      awaitCtaLabel: t('tour.common.takeMe'),
    },
    {
      // No spotlight on the form steps: the form stays bright and usable,
      // and the screen scrolls each section into view instead.
      screen: 'create',
      title: t('tour.m2.trains.title'),
      body: t('tour.m2.trains.body'),
      position: 'bottom',
    },
    {
      screen: 'create',
      title: t('tour.m2.often.title'),
      body: t('tour.m2.often.body'),
      position: 'bottom',
    },
    {
      screen: 'create',
      title: t('tour.m2.coins.title'),
      body: t('tour.m2.coins.body'),
      position: 'bottom',
      primaryLabel: t('tour.m2.coins.cta'),
    },
  ];
}

/** True when M2 is THE current module and its step lives on `screen`. */
export function isM2StepOn(screen: TourScreen): boolean {
  if (getCurrentTourModule() !== 'M2') return false;
  const idx = useTourStore.getState().stepIndices.M2 ?? 0;
  return M2_STEP_SCREENS[idx] === screen;
}

/**
 * End M2 and put the user back on Home, where the next module's first step
 * lives. Completes the module unless it already ended (a skip stays a skip),
 * then pops every screen the tour walked through — all-practices, /tasks and
 * the form — in one transition. `dismissTo` (expo-router 6) pops to the
 * (tabs) route that is already at the bottom of the stack instead of pushing
 * a second copy of it.
 */
export function finishM2AtHome(): void {
  const s = useTourStore.getState();
  if (!isTerminal(s.modules.M2?.status)) void s.setStatus('M2', 'completed');
  s.setStepIndex('M2', 0);
  router.dismissTo('/(tabs)');
}
