import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { create } from 'zustand';

import { detectDeviceLanguage } from '@/lib/i18n/detect';

const KEY = 'rpgtasks.settings.v1';

export type ThemeMode = 'light' | 'dark' | 'system';
export type LanguageCode = 'en' | 'pt';
export type WeekStart = 'sunday' | 'monday';

export interface AppSettings {
  theme: ThemeMode;
  language: LanguageCode;
  weekStart: WeekStart;
  /** Show a confirm dialog before completing a 4★ or 5★ task. */
  confirmHighDifficultyComplete: boolean;
  /** Master notification switch — gates every scheduled notification. */
  notificationsEnabled: boolean;
  /** Daily reminder: the 08:00 Daily Brief + the 12:30 "come back" checkpoint. */
  dailyReminder: boolean;
  /** @deprecated No notification is wired to this yet — kept for settings
   *  back-compat; not surfaced in the UI. */
  questReminder: boolean;
  /** @deprecated No notification is wired to this yet — kept for settings
   *  back-compat; not surfaced in the UI. */
  momentumReminder: boolean;
  /** Mood check-in: the nightly notification + the in-app Today Hub prompt. */
  moodCheckinPrompt: boolean;
  /** Daily Brief time. The 12:30 checkpoint is NOT derived from it — it means
   *  "we haven't seen you at midday", which isn't tied to wake time. */
  briefHour: number;
  briefMinute: number;
  /**
   * End-of-day check-in time. ONE value drives BOTH the nightly push and the
   * earliest hour the in-app mood prompt may appear: they are the same felt
   * event ("o app me pergunta como foi meu dia") and already share one
   * toggle. Two hour fields for one event is how you get "I set it to 22 and
   * it still popped at 17".
   */
  dayEndHour: number;
  dayEndMinute: number;
}

/** Guards a persisted value that a corrupt blob could otherwise turn into a
 *  notification scheduled at NaN o'clock (i.e. never). */
function clampInt(
  v: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max
    ? Math.trunc(v)
    : fallback;
}

const DEFAULTS: AppSettings = {
  theme: 'dark',
  language: 'en',
  weekStart: 'sunday',
  confirmHighDifficultyComplete: true,
  notificationsEnabled: false,
  dailyReminder: true,
  questReminder: false,
  momentumReminder: false,
  moodCheckinPrompt: true,
  // Literals, deliberately not imported from lib/notifications/constants:
  // useNotificationsSetup already imports this module, so the reverse import
  // would be a cycle. These reproduce the previous hardcoded behaviour.
  briefHour: 8,
  briefMinute: 0,
  dayEndHour: 21,
  dayEndMinute: 0,
};

type Status = 'unknown' | 'ready';

interface Store {
  status: Status;
  settings: AppSettings;
  load: () => Promise<void>;
  set: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
}

export const useSettingsStore = create<Store>((set, get) => ({
  status: 'unknown',
  settings: DEFAULTS,
  load: async () => {
    if (get().status !== 'unknown') return;
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const parsed = raw
        ? (JSON.parse(raw) as Partial<AppSettings> & { streakReminder?: boolean })
        : {};
      // Auto-detect language from device on first launch (no stored value).
      // Once the user has saved a preference, never override it.
      const language = parsed.language ?? detectDeviceLanguage();
      set({
        status: 'ready',
        settings: {
          ...DEFAULTS,
          ...parsed,
          momentumReminder: parsed.momentumReminder ?? parsed.streakReminder ?? false,
          language,
          briefHour: clampInt(parsed.briefHour, 0, 23, DEFAULTS.briefHour),
          briefMinute: clampInt(parsed.briefMinute, 0, 59, DEFAULTS.briefMinute),
          dayEndHour: clampInt(parsed.dayEndHour, 0, 23, DEFAULTS.dayEndHour),
          dayEndMinute: clampInt(parsed.dayEndMinute, 0, 59, DEFAULTS.dayEndMinute),
        },
      });
    } catch {
      set({
        status: 'ready',
        settings: { ...DEFAULTS, language: detectDeviceLanguage() },
      });
    }
  },
  set: async (key, value) => {
    const next = { ...get().settings, [key]: value };
    set({ settings: next });
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // best-effort; in-memory still updated
    }
  },
}));

/** Hook that triggers a one-time load and returns the current settings. */
export function useLoadedSettings(): AppSettings {
  const status = useSettingsStore((s) => s.status);
  const settings = useSettingsStore((s) => s.settings);
  const load = useSettingsStore((s) => s.load);
  useEffect(() => {
    if (status === 'unknown') load();
  }, [status, load]);
  return settings;
}
