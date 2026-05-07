import * as Localization from 'expo-localization';

import type { LanguageCode } from '@/lib/settings';

/**
 * Pick the initial app locale from the device. PT-* → 'pt', anything else
 * (including unknown) falls back to 'en' since the primary target market is
 * en-US.
 */
export function detectDeviceLanguage(): LanguageCode {
  try {
    const locales = Localization.getLocales();
    const code = locales[0]?.languageCode?.toLowerCase() ?? 'en';
    return code === 'pt' ? 'pt' : 'en';
  } catch {
    return 'en';
  }
}
