/**
 * Custom app entry (package.json "main") — the THEME GATE.
 *
 * Why this exists: the Ajustes theme preference lives in AsyncStorage
 * (async), but ~165 modules capture token values inside
 * StyleSheet.create the moment they are evaluated — and Expo Router
 * evaluates the route graph when <App/> mounts, NOT lazily. The only
 * point where the persisted preference can win is therefore BEFORE the
 * app tree renders at all: read pref → rewrite the shared tokens object
 * → only then render expo-router's App. The native splash stays up
 * during the read (tens of ms), so users never see a flash.
 *
 * Keep the import surface of this file minimal: everything imported
 * here evaluates BEFORE the gate, so nothing with StyleSheets may be
 * pulled in (theme modules and lib/settings are style-free leaves).
 *
 * This replaces the previous useThemeBoot root-layout gate, which ran
 * too late for exactly that reason.
 */
import '@expo/metro-runtime';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { App } from 'expo-router/build/qualified-entry';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';
import { useEffect, useState } from 'react';

import { SETTINGS_STORAGE_KEY } from './lib/settings';
import { __applyThemeTokens } from './theme';
import { __setActiveTheme, resolveThemePref } from './theme/activeTheme';

function ThemeGate() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        const stored = raw ? JSON.parse(raw).theme : null;
        const pref =
          stored === 'light' || stored === 'dark' || stored === 'system'
            ? stored
            : 'system';
        const resolved = resolveThemePref(pref);
        __setActiveTheme(resolved);
        __applyThemeTokens(resolved);
      } catch {
        // Unreadable settings → keep the system-resolved boot palette.
      }
      if (alive) setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // null keeps the native splash up — no theme-flash frame.
  return ready ? <App /> : null;
}

renderRootComponent(ThemeGate);
