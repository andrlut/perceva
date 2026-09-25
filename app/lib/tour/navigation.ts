import { router } from 'expo-router';

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
}
