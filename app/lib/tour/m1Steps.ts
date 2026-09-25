import { create } from 'zustand';

import type { ScreenedStep } from '@/components/tour/TourModule';
import type { TranslateOptions } from '@/lib/i18n';

type Translator = (key: string, options?: TranslateOptions) => string;

/**
 * Tour event names Home (and the mood strip on it) emit so M1 advances on
 * real gestures.
 */
export const M1_EVENTS = {
  TASK_COMPLETED: 'task:completed',
  DRAWER_EXPANDED: 'drawer:expanded',
  MOOD_LOGGED: 'mood:logged',
  TASK_LONG_PRESSED: 'task:long-pressed',
} as const;

/** `<TourTarget>` ids M1 spotlights — all on Home. */
export const M1_TARGETS = {
  /** The first open practice card of the day. */
  CARD: 'home.task-first',
  /** The "Feitas hoje" drawer. */
  DRAWER: 'home.completed',
  /** The mood check-in card (MoodHubStrip). */
  MOOD: 'home.mood',
} as const;

export interface M1Options {
  /** Something was completed today — only then can "Feitas hoje" open. */
  hasCompletedToday: boolean;
  /** The Home mood card is actually on screen. */
  moodCardVisible: boolean;
}

/**
 * M1 — Práticas, entirely on Home:
 *
 *   1. mark a practice done            — awaitEvent TASK_COMPLETED
 *   2. open "Feitas hoje"              — awaitEvent DRAWER_EXPANDED
 *                                        (only when a completion exists today:
 *                                        an empty drawer cannot open, which is
 *                                        exactly how the old step failed)
 *   3. mood in one line                — awaitEvent MOOD_LOGGED
 *                                        (only when the mood card renders)
 *   4. press and hold                  — awaitEvent TASK_LONG_PRESSED, LAST
 *
 * The long-press step is last on purpose: it opens a native action sheet,
 * and a tooltip for a following step would sit hidden behind it (2026-09
 * audit). Ending the module on the gesture leaves nothing behind the sheet.
 *
 * Every step has an assist that jumps to the next HOME step (they all are),
 * so a day that can't perform a gesture never traps the user.
 *
 * The step LIST depends on the day — see `useM1PlanStore` for how Home keeps
 * the shared step index from sliding when the list changes.
 */
export function buildM1Steps(t: Translator, opts: M1Options): ScreenedStep[] {
  const steps: ScreenedStep[] = [
    {
      screen: 'home',
      title: t('tour.m1.complete.title'),
      body: t('tour.m1.complete.body'),
      position: 'bottom',
      target: M1_TARGETS.CARD,
      awaitEvent: M1_EVENTS.TASK_COMPLETED,
      awaitCtaLabel: t('tour.common.next'),
      assistSkipsToSameScreen: true,
    },
  ];
  if (opts.hasCompletedToday) {
    steps.push({
      screen: 'home',
      title: t('tour.m1.drawer.title'),
      body: t('tour.m1.drawer.body'),
      position: 'bottom',
      target: M1_TARGETS.DRAWER,
      awaitEvent: M1_EVENTS.DRAWER_EXPANDED,
      awaitCtaLabel: t('tour.common.next'),
      assistSkipsToSameScreen: true,
    });
  }
  if (opts.moodCardVisible) {
    steps.push({
      screen: 'home',
      title: t('tour.m1.mood.title'),
      body: t('tour.m1.mood.body'),
      position: 'bottom',
      target: M1_TARGETS.MOOD,
      awaitEvent: M1_EVENTS.MOOD_LOGGED,
      awaitCtaLabel: t('tour.common.next'),
      assistSkipsToSameScreen: true,
    });
  }
  steps.push({
    screen: 'home',
    title: t('tour.m1.hold.title'),
    body: t('tour.m1.hold.body'),
    position: 'bottom',
    target: M1_TARGETS.CARD,
    awaitEvent: M1_EVENTS.TASK_LONG_PRESSED,
    awaitCtaLabel: t('tour.m1.hold.cta'),
    // Last step: the assist finds no later home step and finishes M1.
    assistSkipsToSameScreen: true,
  });
  return steps;
}

/**
 * M1's plan (which optional steps exist) for the current run.
 *
 * The step index is shared and positional, so the list may only change while
 * step 1 is on screen. Once the module moves past it Home freezes the plan
 * here, and a later completion, undo or mood refetch can no longer slide the
 * index onto a different step.
 *
 * `completedThisRun` closes the one race that matters: a completion on step 1
 * must add the "Feitas hoje" step BEFORE the index advances onto it. Home
 * writes it in the same tick as the TASK_COMPLETED emit; both are zustand
 * stores, so React applies the two in one render and the step exists by the
 * time TourModule advances. (A useState latch would land a render later and
 * the index would first advance onto the mood step.)
 */
interface M1PlanState {
  completedThisRun: boolean;
  frozen: M1Options | null;
  noteCompletion: () => void;
  freeze: (plan: M1Options) => void;
  unfreeze: () => void;
  reset: () => void;
}

export const useM1PlanStore = create<M1PlanState>((set, get) => ({
  completedThisRun: false,
  frozen: null,
  noteCompletion: () => {
    if (!get().completedThisRun) set({ completedThisRun: true });
  },
  freeze: (plan) => set({ frozen: plan }),
  unfreeze: () => {
    if (get().frozen) set({ frozen: null });
  },
  reset: () => {
    if (get().completedThisRun || get().frozen) set({ completedThisRun: false, frozen: null });
  },
}));
