import AsyncStorage from '@react-native-async-storage/async-storage';
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
    try {
      // Guarded require — binaries built before expo-navigation-bar was
      // added lack the native module and the package THROWS on import;
      // an OTA must never assume it exists (same pattern as
      // react-native-purchases). Those binaries keep the OS default
      // until their next native build.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const NavigationBar =
        require('expo-navigation-bar') as typeof import('expo-navigation-bar');
      NavigationBar.setButtonStyleAsync(
        ACTIVE_THEME === 'light' ? 'dark' : 'light',
      ).catch(() => {});
    } catch {
      // Native module absent — nothing to steer.
    }
  }, []);
}

/**
 * Reload the JS so the app reboots into the current theme preference.
 * The only correct restyle: every StyleSheet captured the boot palette
 * (see activeTheme.ts). Production builds reload via expo-updates;
 * dev/Expo Go via DevSettings.
 *
 * UNGUARDED ON PURPOSE — this is the user-initiated path (the "Apply"
 * button in Ajustes). A person tapping a button is its own rate limit.
 * The automatic path is `maybeReloadForSystemFlip` below, which is not.
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
 * Stamp of the last AUTOMATIC theme reload.
 *
 * Persisted, not a module flag: `Updates.reloadAsync()` builds a brand
 * new JS context, so anything in memory is reset by the very event we
 * need to remember. This key is the only thing that survives the reload
 * and can therefore break a loop that spans contexts.
 */
const AUTO_RELOAD_STAMP_KEY = 'rpgtasks.theme.autoReloadAt';

/** One automatic reload per minute, ever. See the guard notes below. */
const AUTO_RELOAD_COOLDOWN_MS = 60_000;

/**
 * How long after boot an OS theme event is treated as noise.
 *
 * Android's AppearanceModule keeps `lastEmittedColorScheme = null` per
 * JS context, so the FIRST onConfigurationChanged of every context
 * emits `appearanceChanged` even when nothing actually changed. A flip
 * in the first seconds of boot is that artefact, not a person reaching
 * for their system settings.
 */
const BOOT_GRACE_MS = 10_000;

const BOOT_AT = Date.now();

/**
 * Decide whether an `appearanceChanged` event should reload the app.
 *
 * THIS IS THE FUNCTION THAT SHIPPED THE BOOT LOOP (#372–#379, rolled
 * back from production 2026-08-31). Worth keeping the failure in view,
 * because every guard below exists for one step of it:
 *
 *   1. entry gate resolves a stored pref of 'dark'; ACTIVE_THEME='dark'
 *   2. RootLayout mounts, arming this listener, BEFORE the settings
 *      store has hydrated from AsyncStorage
 *   3. Android emits its first (spurious) appearanceChanged
 *   4. `getState().settings.theme` answers with DEFAULTS — and the
 *      default became 'system' in that same batch — so the "explicit
 *      prefs ignore OS flips" guard failed OPEN for every user
 *   5. resolveThemePref('system') = 'light' ≠ 'dark' → reloadAsync()
 *   6. new JS context → back to step 1, forever
 *
 * Invisible in Expo Go, where `Updates.isEnabled` is false and, under
 * --no-dev, `__DEV__` too: the reload was literally dead code there.
 * And a deliberate reloadAsync never enters expo-updates' error
 * recovery, so the platform's own bad-update safety net never fired.
 *
 * Fails CLOSED everywhere: the worst case is a stale palette until the
 * user taps Apply, never an app that cannot finish booting.
 */
async function shouldAutoReload(): Promise<boolean> {
  const state = useSettingsStore.getState();

  // Guard 1 — the one that failed open. Before hydration the store
  // answers DEFAULTS, which is not the user's preference.
  if (state.status !== 'ready') return false;

  // Guard 2 — an explicit Light/Dark choice ignores the OS entirely.
  const pref = state.settings.theme;
  if (pref !== 'system') return false;

  // Guard 3 — already showing the right palette (the spurious event).
  if (resolveThemePref(pref) === ACTIVE_THEME) return false;

  // Guard 4 — boot noise, not a person.
  if (Date.now() - BOOT_AT < BOOT_GRACE_MS) return false;

  // Guard 5 — the circuit breaker. Bounds ANY residual disagreement
  // between the palette and the OS to a single reload, whatever its
  // cause, including causes not yet understood.
  try {
    const raw = await AsyncStorage.getItem(AUTO_RELOAD_STAMP_KEY);
    const last = raw ? Number(raw) : 0;
    if (Number.isFinite(last) && Date.now() - last < AUTO_RELOAD_COOLDOWN_MS) {
      return false;
    }
    await AsyncStorage.setItem(AUTO_RELOAD_STAMP_KEY, String(Date.now()));
  } catch {
    // Storage unreadable — refuse rather than risk the loop.
    return false;
  }

  return true;
}

/**
 * Root-layout hook: while the preference is 'system', an OS color-
 * scheme flip mid-session reloads into the matching palette. Explicit
 * prefs ignore OS flips.
 */
export function useThemeSystemSync(): void {
  useEffect(() => {
    const sub = Appearance.addChangeListener(() => {
      void shouldAutoReload().then((go) => {
        if (go) reloadForTheme();
      });
    });
    return () => sub.remove();
  }, []);
}
