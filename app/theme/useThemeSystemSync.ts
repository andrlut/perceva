import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { Appearance, DevSettings } from 'react-native';

import { ACTIVE_THEME } from './activeTheme';

/**
 * Root-layout hook: when the OS color scheme flips mid-session, reload
 * the JS so the app reboots into the matching palette. A reload is the
 * only correct move — every StyleSheet captured the boot palette, so
 * restyling in place isn't possible (see activeTheme.ts).
 *
 * Guarded against the spurious change events some Androids fire on
 * app foreground: only a scheme that actually DIFFERS from the booted
 * palette triggers the reload. Small delay lets the OS transition
 * animation finish so the reload doesn't fight it.
 */
export function useThemeSystemSync(): void {
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      const next = colorScheme === 'light' ? 'light' : 'dark';
      if (next === ACTIVE_THEME) return;
      setTimeout(() => {
        if (Updates.isEnabled) {
          Updates.reloadAsync().catch(() => {});
        } else if (__DEV__) {
          DevSettings.reload();
        }
      }, 300);
    });
    return () => sub.remove();
  }, []);
}
