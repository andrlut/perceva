import { router, type Href } from 'expo-router';

/**
 * Where to go right after landing on Home once onboarding ends — set by the
 * intro's "start with the self-assessment" choice, consumed (once) by
 * exitTourToHome. In memory only: a killed app simply lands on Home.
 */
let afterHome: Href | null = null;

export function setAfterOnboarding(href: Href | null): void {
  afterHome = href;
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
  const next = afterHome;
  afterHome = null;
  if (next) router.push(next);
}
