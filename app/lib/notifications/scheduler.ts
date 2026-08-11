import * as Notifications from 'expo-notifications';

import {
  CHECKPOINT_HOUR,
  CHECKPOINT_MINUTE,
  MESSAGES_EN,
  MESSAGES_PT,
  NIGHTLY_CHECKIN_ROUTE,
  NOTIFICATION_IDS,
  type NotificationLocale,
  pickRandom,
} from './constants';

/**
 * Install the global notification handler. Call ONCE at app boot
 * (before any scheduling) — controls how foreground notifications
 * render. Sound + badge are off by default; the alert is shown so
 * the user still gets feedback when the app is in the background.
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

function getMessages(locale: NotificationLocale) {
  return locale === 'en-US' ? MESSAGES_EN : MESSAGES_PT;
}

/**
 * Cancel a scheduled notification by our custom `data.id` tag. Expo
 * gives each scheduled notification a randomly-generated identifier;
 * we tag ours in `content.data.id` so we can find them later without
 * juggling those random ids.
 */
async function cancelById(id: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if ((n.content.data as { id?: string } | null)?.id === id) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}

/**
 * Daily Brief — recurring trigger at hour:minute every day. Cancels
 * any previous Daily Brief first so it's idempotent (safe to call on
 * every app boot and on Settings save).
 */
export async function scheduleDailyBrief(
  hour: number,
  minute: number,
  locale: NotificationLocale = 'pt-BR',
): Promise<void> {
  await cancelById(NOTIFICATION_IDS.DAILY_BRIEF);

  const msg = pickRandom(getMessages(locale).dailyBrief);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: msg.title,
      body: msg.body,
      data: { id: NOTIFICATION_IDS.DAILY_BRIEF },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

/**
 * Nightly mood check-in — a recurring DAILY trigger at 21:00. Unlike the
 * Checkpoint it needs no boot-order dance: a DAILY trigger fires at the next
 * occurrence automatically, so we never hand-arm "today at 21:00". Tapping it
 * deep-links to the mood check-in screen (see the response listener in
 * useNotificationsSetup). Cancel-first so it's idempotent.
 */
export async function scheduleNightlyCheckin(
  hour: number,
  minute: number,
  locale: NotificationLocale = 'pt-BR',
): Promise<void> {
  await cancelById(NOTIFICATION_IDS.NIGHTLY_CHECKIN);

  const msg = pickRandom(getMessages(locale).nightly);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: msg.title,
      body: msg.body,
      data: {
        id: NOTIFICATION_IDS.NIGHTLY_CHECKIN,
        route: NIGHTLY_CHECKIN_ROUTE,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

/**
 * Checkpoint — the 12:30 "haven't seen you today?" nudge. Armed for the
 * NEXT day's 12:30 and re-armed on every app open (cancel-and-reschedule).
 *
 * Why tomorrow and not today: setup + every foreground run *because* the
 * user just opened the app, so today is already "covered". A checkpoint
 * for today would either be cancelled immediately (the old bug) or fire
 * despite the user having shown up. Arming tomorrow gives the correct
 * "no open today" semantics: if the user opens again before tomorrow
 * 12:30, that open pushes it to the day after; if they DON'T open
 * tomorrow, it fires at 12:30.
 */
export async function scheduleCheckpoint(
  locale: NotificationLocale = 'pt-BR',
): Promise<void> {
  await cancelById(NOTIFICATION_IDS.CHECKPOINT);

  const trigger = new Date();
  trigger.setDate(trigger.getDate() + 1);
  trigger.setHours(CHECKPOINT_HOUR, CHECKPOINT_MINUTE, 0, 0);

  const msg = pickRandom(getMessages(locale).checkpoint);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: msg.title,
      body: msg.body,
      data: { id: NOTIFICATION_IDS.CHECKPOINT },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: trigger,
    },
  });
}

/** Drop the pending checkpoint. Called when the user opens the app —
 *  no point reminding them to open something they're already inside. */
export async function cancelCheckpoint(): Promise<void> {
  await cancelById(NOTIFICATION_IDS.CHECKPOINT);
}

/** Nuke every Perceva notification (and any other scheduled ones for
 *  this app). Used when the user toggles notifications OFF in Settings. */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// getBriefTime/setBriefTime lived here with their own AsyncStorage keys and
// never had a single caller — the time was settable in code and unreachable
// from the UI. The value now lives in AppSettings alongside every other
// preference, so rescheduling happens reactively in useNotificationsSetup
// rather than needing the Settings screen to call the scheduler itself.
