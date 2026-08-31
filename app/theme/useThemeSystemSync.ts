import * as NavigationBar from 'expo-navigation-bar';
import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { Appearance, DevSettings, Platform } from 'react-native';

import { useSettingsStore } from '@/lib/settings';

import { ACTIVE_THEME, resolveThemePref } from './activeTheme';

/**
 * Android's system navigation bar draws its own buttons over the app.
 * With the OS in dark mode they render WHITE — invisible over the light
 * theme's porcelain backgrounds (and vice-versa). Steer the button
 * style to match the app's palette, not the OS. Root-layout hook;
 * no-op on iOS (the home indicator self-adjusts).
 */
export function useAndroidNavBarTheme(): void {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    NavigationBar.setButtonStyleAsync(
      ACTIVE_THEME === 'light' ? 'dark' : 'light',
    ).catch(() => {});
  }, []);
}

/**
 * Reload the JS so the app reboots into the current theme preference.
 * The only correct restyle: every StyleSheet captured the boot palette
 * (see activeTheme.ts). Production builds reload via expo-updates;
 * dev/Expo Go via DevSettings.
 */
export function reloadForTheme(): void {
  setTimeout(() => {
    if (Updates.isEnabled) {
      Updates.reloadAsync().catch(() => {});
    } else if (__DEV__) {
      DevSettings.reload();
    }
  }, 300);
}

/**
 * Root-layout hook: while the preference is 'system', an OS color-
 * scheme flip mid-session reloads into the matching palette. Explicit
 * prefs ignore OS flips. Guarded against the spurious same-scheme
 * change events some Androids fire on app foreground.
 */
export function useThemeSystemSync(): void {
  useEffect(() => {
    const sub = Appearance.addChangeListener(() => {
      const pref = useSettingsStore.getState().settings.theme;
      if (pref !== 'system') return;
      if (resolveThemePref(pref) === ACTIVE_THEME) return;
      reloadForTheme();
    });
    return () => sub.remove();
  }, []);
}
