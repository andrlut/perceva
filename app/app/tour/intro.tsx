import type { ErrorBoundaryProps } from 'expo-router';
import { TourErrorBoundary } from '@/components/tour/TourErrorBoundary';
import { Stack } from 'expo-router';

import { IntroPager } from '@/components/tour/intro/IntroPager';

/**
 * /tour/intro — the method intro, the first full-screen module after login
 * (replaces the old pre-login slides and the M0 welcome). The AuthGate
 * re-opens it on every boot until the last page is answered; the pager and
 * all of its logic live in `components/tour/intro/`.
 *
 * No swipe-back gesture: the pager owns horizontal swipes, and leaving
 * would only bounce back here (Android hardware back is handled inside).
 */
export default function TourIntroScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <IntroPager />
    </>
  );
}

/** A render error here must never lock the app on every launch. */
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <TourErrorBoundary module="intro" {...props} />;
}
