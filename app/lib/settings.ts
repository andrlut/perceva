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
  /** Master notification toggle (placeholder until expo-notifications wired). */
  notificationsEnabled: boolean;
  /** Daily reminder enabled (placeholder). */
  dailyReminder: boolean;
  /** Quest deadline reminder enabled (placeholder). */
  questReminder: boolean;
  /** Streak-at-risk reminder enabled (placeholder). */
  streakReminder: boolean;
}

const DEFAULTS: AppSettings = {
  theme: 'dark',
  language: 'en',
  weekStart: 'sunday',
  confirmHighDifficultyComplete: true,
  notificationsEnabled: false,
  dailyReminder: false,
  questReminder: false,
  streakReminder: false,
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
      const parsed = raw ? (JSON.parse(raw) as Partial<AppSettings>) : {};
      // Auto-detect language from device on first launch (no stored value).
      // Once the user has saved a preference, never override it.
      const language = parsed.language ?? detectDeviceLanguage();
      set({
        status: 'ready',
        settings: { ...DEFAULTS, ...parsed, language },
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
