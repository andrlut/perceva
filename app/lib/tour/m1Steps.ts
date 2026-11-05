import type { ScreenedStep } from '@/components/tour/TourModule';
import type { TranslateOptions } from '@/lib/i18n';

type Translator = (key: string, options?: TranslateOptions) => string;

/** Tour event Home emits so M1 advances on the real gesture. */
export const M1_EVENTS = {
  TASK_COMPLETED: 'task:completed',
} as const;

/** `<TourTarget>` ids M1 spotlights — on Home. */
export const M1_TARGETS = {
  /** The first open practice card of the day. */
  CARD: 'home.task-first',
} as const;

/**
 * M1 — the one guided step that survived the 2026-11 simplification
 * ("Onboarding simples"): mark the first practice done. Everything else is
 * taught in place — each locked tab opens with its own animated door
 * (components/unlock) and every screen has its (i).
 *
 * The step spotlights today's first open card and advances on the real
 * completion (TASK_COMPLETED). The assist ("Pular este passo") finishes the
 * module, so a day without a card to practise on never traps the user.
 */
export function buildM1Steps(t: Translator): ScreenedStep[] {
  return [
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
}
