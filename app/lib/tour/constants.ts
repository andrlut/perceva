/**
 * Post-login onboarding + guided tour — module identifiers.
 *
 * Two kinds of module, in one sequence:
 *
 *   - ROUTE modules (`intro`, `pack`) are full-screen routes. The AuthGate
 *     re-opens the first unfinished one on every boot, so abandoning one
 *     (app killed, back gesture) can never strand the rest of the tour —
 *     the dead end the 2026-09 audit found on the old M0.5 route.
 *   - `settings` is the one MANDATORY spotlight module: Ajustes › Refazer
 *     tutorial and "Conecte sua IA". It runs right after the starter pack
 *     on a first run whatever the intro choice was (tour, self-assessment
 *     or skip) — first users found the app confusing, so nobody starts
 *     without knowing where help lives. Not in GUIDED_MODULES on purpose:
 *     "Pular o tour" and "Sair do tour" never touch it, and its tooltips
 *     carry no skip links (three taps of Próximo).
 *   - GUIDED modules (`M1`…`M6`) are the spotlight tooltips that ride on
 *     the real screens and wait for real gestures. Only the first
 *     unfinished one renders (see `useIsCurrentTourModule`).
 *   - `wrap` is the closing full screen; it marks itself completed on
 *     mount, so backing out of it cannot leave the tour unfinished.
 *
 * Ids are persisted (AsyncStorage) — keep them stable. `M3` (Missões) was
 * removed in v2: Missões is premium and an opt-in module, so it is not
 * taught by the tour. The numbering keeps its gap on purpose.
 */

export const TOUR_MODULES = [
  'intro',
  'pack',
  'settings',
  'M1',
  'M2',
  'M4',
  'M5',
  'M6',
  'wrap',
] as const;

export type TourModule = (typeof TOUR_MODULES)[number];

export type TourModuleStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'skipped';

/** Full-screen modules the AuthGate re-opens until they are answered. */
export const ROUTE_MODULES = ['intro', 'pack'] as const;
export type RouteModule = (typeof ROUTE_MODULES)[number];

export const ROUTE_MODULE_PATH: Record<RouteModule, '/tour/intro' | '/tour/pack'> = {
  intro: '/tour/intro',
  pack: '/tour/pack',
};

/** The mandatory help module (see the header). */
export const SETTINGS_MODULE = 'settings' as const;

/** The optional spotlight modules, in the order they run. */
export const GUIDED_MODULES = ['M1', 'M2', 'M4', 'M5', 'M6'] as const;
export type GuidedModule = (typeof GUIDED_MODULES)[number];

export function isTerminal(status: TourModuleStatus | undefined): boolean {
  return status === 'completed' || status === 'skipped';
}
