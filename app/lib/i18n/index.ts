import { I18n } from 'i18n-js';
import { useMemo } from 'react';

import { useSettingsStore, type LanguageCode } from '@/lib/settings';

import en from './locales/en';
import pt from './locales/pt';

/**
 * Single i18n-js instance shared by the app. The `locale` is set imperatively
 * by `useT` whenever the language preference in the settings store changes,
 * so every consumer of the hook re-renders against the current language.
 */
export const i18n = new I18n(
  { en, pt },
  {
    defaultLocale: 'en',
    enableFallback: true,
    missingBehavior: __DEV__ ? 'guess' : 'message',
  },
);

i18n.locale = 'en';

export type TranslateOptions = Record<string, string | number | undefined>;

/**
 * `t('home.greeting.morning')` — straight lookup.
 * `t('rewards.coins', { count: 3 })` — pluralized when key is `{ one, other }`.
 * `t('rewards.actions.confirmRedeem', { cost: 10, title: 'Coffee' })` —
 * interpolation.
 */
export function translate(key: string, options?: TranslateOptions): string {
  return i18n.t(key, options);
}

/**
 * Hook that returns a translator bound to the current app language. Re-renders
 * automatically when the user toggles the language in settings.
 */
export function useT() {
  const language = useSettingsStore((s) => s.settings.language);

  return useMemo(() => {
    i18n.locale = language;
    const t = (key: string, options?: TranslateOptions) => i18n.t(key, options);
    return { t, locale: language as LanguageCode };
  }, [language]);
}

/**
 * Reads the locale once without subscribing — useful inside imperative code
 * (event handlers, async flows) where you don't want to trigger re-renders.
 */
export function getCurrentLocale(): LanguageCode {
  return useSettingsStore.getState().settings.language;
}

/**
 * Hard-set the locale. The settings store is the source of truth, so this is
 * a thin wrapper that also writes to AsyncStorage.
 */
export async function setLocale(language: LanguageCode): Promise<void> {
  await useSettingsStore.getState().set('language', language);
}
