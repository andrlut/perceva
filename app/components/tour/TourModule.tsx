import { useCallback, useEffect, useRef } from 'react';

import { TourStep, type TourStepData } from './TourStep';

import {
  useActiveTourStepStore,
  useModuleStatus,
  useTourStore,
} from '@/lib/tour/store';
import { useTourEvent } from '@/lib/tour/eventBus';
import type { TourModule as TourModuleId } from '@/lib/tour/constants';

/** Identifier for which screen a tour step belongs on. Each
 *  `<TourModule>` mount carries a matching `screen` prop and only
 *  renders the current step when the two agree. Steps default to
 *  'home' when omitted. */
export type TourScreen = 'home' | 'detail' | 'rewards' | 'me' | 'learn';

/**
 * Step config extension with a screen tag — re-exported so modules can
 * define their step arrays without an extra import.
 */
export type ScreenedStep = TourStepData & {
  /** Screen this step lives on. Defaults to 'home'. */
  screen?: TourScreen;
};

interface Props {
  module: TourModuleId;
  steps: ScreenedStep[];
  /**
   * Which screen this `<TourModule>` mount is attached to. Combined
   * with each step's `screen` tag, decides whether THIS mount should
   * render the current step. When omitted, defaults to 'home'.
   */
  screen?: TourScreen;
  /**
   * Gate render on data being ready behind the tooltip (e.g. M1 only
   * makes sense once the user's tasks have loaded into the list).
   */
  enabled?: boolean;
  /**
   * Fired after EITHER advance or skip when the current step belongs
   * to this mount's screen. Use it to navigate away from a modal-ish
   * screen (e.g. task-form back to Home) so the user isn't stranded
   * with the next step waiting on a different surface.
   */
  onExitScreen?: () => void;
  onComplete?: (outcome: 'completed' | 'skipped') => void;
}

/**
 * Generic module runner. Multiple mounts (one per screen) share a
 * single step index via the tour store, so step 1 can fire on Home
 * and step 2 can fire on the detail screen without each instance
 * maintaining its own counter.
 *
 * Advances on:
 *   - "Próximo" tap (default).
 *   - Event-bus emission when the step declares `awaitEvent`.
 *   - Timer expiration when the step declares `autoAdvanceMs`.
 */
export function TourModule({
  module,
  steps,
  screen = 'home',
  enabled = true,
  onExitScreen,
  onComplete,
}: Props) {
  const status = useModuleStatus(module);
  const setStatus = useTourStore((s) => s.setStatus);
  const stepIndex = useTourStore((s) => s.stepIndices[module] ?? 0);
  const setStepIndex = useTourStore((s) => s.setStepIndex);

  const moduleActive =
    enabled && status !== 'completed' && status !== 'skipped' && steps.length > 0;
  const step = moduleActive ? steps[stepIndex] : null;
  const stepScreen = step?.screen ?? 'home';
  const renderHere = !!step && stepScreen === screen;

  // Event-bus baseline at step mount so we only advance on NEW emits.
  const baselineRef = useRef<number>(0);
  const currentCount = useTourEvent(step?.awaitEvent);
  useEffect(() => {
    baselineRef.current = currentCount;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, step?.awaitEvent]);

  const finish = useCallback(
    async (outcome: 'completed' | 'skipped') => {
      await setStatus(module, outcome);
      setStepIndex(module, 0);
      onComplete?.(outcome);
    },
    [module, setStatus, setStepIndex, onComplete],
  );

  const advance = useCallback(async () => {
    if (status === 'pending') await setStatus(module, 'in_progress');
    if (stepIndex >= steps.length - 1) {
      void finish('completed');
      return;
    }
    setStepIndex(module, stepIndex + 1);
  }, [status, stepIndex, steps.length, setStatus, module, setStepIndex, finish]);

  // Broadcast the visible step so layout consumers (Home scroll bump,
  // etc) can reserve space. Cleared on unmount.
  const setActiveStep = useActiveTourStepStore((s) => s.set);
  useEffect(() => {
    if (!renderHere) return;
    setActiveStep({ module, position: step?.position ?? 'bottom' });
    return () => setActiveStep(null);
  }, [renderHere, module, step?.position, setActiveStep]);

  // Event-driven advancement. Listens on EVERY mount that has the
  // matching step — but advance is idempotent (sets store index), so
  // even if two screens listen at once only one advance happens per
  // emission tick.
  useEffect(() => {
    if (!renderHere || !step?.awaitEvent) return;
    if (currentCount > baselineRef.current) {
      void advance();
    }
  }, [renderHere, step?.awaitEvent, currentCount, advance]);

  // Time-driven advancement (event wins when both set).
  useEffect(() => {
    if (!renderHere || !step?.autoAdvanceMs || step.awaitEvent) return;
    const id = setTimeout(() => {
      void advance();
    }, step.autoAdvanceMs);
    return () => clearTimeout(id);
  }, [renderHere, step?.autoAdvanceMs, step?.awaitEvent, advance, stepIndex]);

  if (!renderHere || !step) return null;

  // Exit hooks — when set, fire AFTER mutating tour state so the new
  // step is already current by the time we navigate away. Same handler
  // for X and Próximo so the user is never trapped on a screen the
  // tour walked them onto.
  const handleNext = () => {
    void advance().then(() => {
      onExitScreen?.();
    });
  };
  const handleSkip = () => {
    void finish('skipped').then(() => {
      onExitScreen?.();
    });
  };

  return (
    <TourStep
      {...step}
      stepIndex={stepIndex + 1}
      totalSteps={steps.length}
      onNext={handleNext}
      onSkip={handleSkip}
    />
  );
}
