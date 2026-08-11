/**
 * Public surface of the Perceva notification system. Callers should
 * import from `@/lib/notifications` — never reach into individual
 * sub-modules. Keeps the implementation refactor-safe.
 */

export {
  hasNotificationPermission,
  requestNotificationPermissions,
} from './permissions';
export { hasOpenedToday, registerAppOpen } from './session';
export {
  cancelAllNotifications,
  cancelCheckpoint,
  configureNotificationHandler,
  scheduleCheckpoint,
  scheduleDailyBrief,
  scheduleNightlyCheckin,
} from './scheduler';
export { NOTIFICATION_IDS, type NotificationLocale } from './constants';

import { registerAppOpen } from './session';
import {
  cancelAllNotifications,
  scheduleCheckpoint,
  scheduleDailyBrief,
  scheduleNightlyCheckin,
} from './scheduler';
import type { NotificationLocale } from './constants';

/** Per-type notification toggles + times from Settings (the master switch is
 *  handled separately). Each maps to a real scheduled notification. */
export interface NotificationToggles {
  /** Morning Daily Brief + the 12:30 "come back" checkpoint. */
  dailyReminder: boolean;
  /** Evening mood check-in, deep-links to /mood-checkin. */
  moodCheckin: boolean;
  /** Daily Brief time, from AppSettings. */
  brief: { hour: number; minute: number };
  /** End-of-day check-in time, from AppSettings. */
  dayEnd: { hour: number; minute: number };
}

/**
 * Run the setup the app needs after permissions are granted. Re-runs are
 * idempotent — it clears everything first, then schedules only the
 * notifications whose Settings toggle is on. Safe to call on boot and on
 * every Settings change.
 *
 *   - `dailyReminder` on → Daily Brief at the user's chosen time + the 12:30
 *     checkpoint armed for tomorrow (see scheduleCheckpoint).
 *   - `moodCheckin` on → the nightly mood check-in at the user's day-end time.
 *   - Today's open is always stamped so the checkpoint has correct semantics.
 */
/**
 * Serializes every run. Each run is `cancelAll` followed by up to three
 * schedules, and `cancelById` works off a snapshot of what exists at that
 * instant — so two interleaved runs each cancel only what the OTHER had
 * already scheduled, and both survive. That is how a user ends up with two
 * daily briefs, one of them at a time they never chose. Boot and a Settings
 * change can overlap exactly this way.
 */
let setupChain: Promise<void> = Promise.resolve();

export function setupNotifications(
  locale: NotificationLocale,
  toggles: NotificationToggles,
): Promise<void> {
  const run = setupChain.then(async () => {
    // Clean slate so flipping a sub-toggle OFF actually removes its
    // notification. Kept in the same critical section as the schedules
    // below: aborting between them would leave NOTHING scheduled.
    await cancelAllNotifications();

    if (toggles.dailyReminder) {
      await scheduleDailyBrief(toggles.brief.hour, toggles.brief.minute, locale);
      await scheduleCheckpoint(locale);
    }
    if (toggles.moodCheckin) {
      await scheduleNightlyCheckin(toggles.dayEnd.hour, toggles.dayEnd.minute, locale);
    }

    await registerAppOpen();
  });
  // Never let one failed run poison the chain for every later one.
  setupChain = run.catch(() => {});
  return run;
}

/** Toggle handler for the Settings master switch. */
export async function setNotificationsEnabled(
  enabled: boolean,
  locale: NotificationLocale,
  toggles: NotificationToggles,
): Promise<void> {
  if (!enabled) {
    await cancelAllNotifications();
    return;
  }
  await setupNotifications(locale, toggles);
}
