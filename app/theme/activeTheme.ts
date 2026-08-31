import { Appearance } from 'react-native';

/**
 * Which token palette the app boots with — resolved ONCE at module load
 * from the device color scheme, because ~165 files capture token values
 * inside StyleSheet.create at import time. A mid-session OS theme
 * change can't restyle in place; useThemeSystemSync (root layout)
 * detects it and reloads the JS so the app reboots into the new
 * palette.
 *
 * Standalone builds only follow the system once app.json ships
 * `userInterfaceStyle: "automatic"` (native setting — builds before
 * that pin Appearance to dark). Expo Go always follows the system.
 *
 * An explicit in-app override (Claro/Escuro/Sistema row in Ajustes) is
 * a later phase: it needs a synchronous persisted read before module
 * eval (MMKV or an entry-point gate) — AsyncStorage can't do it.
 *
 * Palette source: the "Perceva — Tema Claro" design canvas (coletânea
 * de 2026-08-31).
 */
export type ThemeName = 'dark' | 'light';

export const ACTIVE_THEME: ThemeName =
  Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
