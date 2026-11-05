import { router, type Href } from 'expo-router';

import { SETTINGS_MODULE } from './constants';
import { getCurrentTourModule, useTourStore } from './store';

/**
 * Where to go right after landing on Home once onboarding ends — set by the
 * intro's "start with the self-assessment" choice, consumed (once) by
 * exitTourToHome — or by the help module's end when that one is still to
 * run, since it comes first. Persisted by the tour store, so a killed app
 * still lands where the user asked.
 */
export function setAfterOnboarding(href: string | null): void {
  void useTourStore.getState().setAfterOnboarding(href);
}

/**
 * Leave a full-screen onboarding route for Home.
 *
 * On a first run the onboarding routes were REPLACED into an otherwise empty
 * stack (the AuthGate replaces whatever was there), so there is no (tabs)
 * underneath and replacing is right. On a replay from Ajustes the stack still
 * holds the original (tabs) under the tour screen — replacing would mount a
 * second tabs navigator on top of the first (and "Refazer onboarding" run in
 * a loop would keep stacking them). Pop back to it instead, then switch it to
 * Home, since the user started the replay from the Ajustes tab.
 */
export function exitTourToHome(): void {
  if (router.canDismiss()) {
    router.dismissAll();
    router.navigate('/(tabs)');
  } else {
    router.replace('/(tabs)');
  }
  // The mandatory help module (Ajustes) runs first; it hands the hop over
  // when it ends (takeAfterOnboarding).
  if (getCurrentTourModule() === SETTINGS_MODULE) return;
  const next = takeAfterOnboarding();
  if (next) router.push(next);
}

/** Read-and-clear the pending after-onboarding destination. */
export function takeAfterOnboarding(): Href | null {
  const next = useTourStore.getState().afterOnboarding;
  if (next) void useTourStore.getState().setAfterOnboarding(null);
  return next as Href | null;
}
