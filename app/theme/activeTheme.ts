import { Appearance } from 'react-native';

/**
 * Which token palette the app runs with.
 *
 * Resolution order:
 *   1. Module load: the device scheme (synchronous) — a provisional
 *      value so early modules have SOMETHING coherent.
 *   2. Theme boot gate (theme/useThemeBoot, mounted in the root
 *      layout): once the persisted Ajustes preference hydrates, the
 *      gate re-resolves ('system' → device scheme; explicit pref wins),
 *      updates this live binding and rewrites the shared tokens object
 *      IN PLACE — all before the router's Stack renders, so every
 *      lazily-loaded route module creates its StyleSheets against the
 *      final palette.
 *
 * Mid-session changes (Ajustes row, or an OS flip while pref is
 * 'system') reload the JS — StyleSheets captured at module load can't
 * be restyled in place.
 *
 * Known residue: the handful of components the root layout imports
 * eagerly (ConfirmHost, premium hosts, OtaUpdateGate) create their
 * styles before the gate runs, so under an explicit pref that differs
 * from the device scheme those few overlays keep the device-scheme
 * palette until they're migrated to render-time styles.
 *
 * Palette source: the "Perceva — Tema Claro" design canvas.
 */
export type ThemeName = 'dark' | 'light';
export type ThemePref = ThemeName | 'system';

export function systemTheme(): ThemeName {
  return Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
}

export function resolveThemePref(pref: ThemePref): ThemeName {
  return pref === 'system' ? systemTheme() : pref;
}

/** Live binding — import it fresh where needed; do not copy at module
 *  scope in eagerly-loaded files (lazily-loaded route modules may). */
export let ACTIVE_THEME: ThemeName = systemTheme();

/** Theme-boot internal — do not call from feature code. */
export function __setActiveTheme(name: ThemeName): void {
  ACTIVE_THEME = name;
}
