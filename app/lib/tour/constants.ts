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
 *   - GUIDED modules: since the 2026-11 simplification ("Onboarding
 *     simples") there is ONE, `M1` — mark the first practice done, a single
 *     spotlight step on Home. The old M2…M6 walk-throughs and the `wrap`
 *     closing screen were deleted: each locked tab now opens with its own
 *     animated door (lib/unlock) and every screen has its (i).
 *
 * Ids are persisted (AsyncStorage) — keep them stable. Legacy keys an
 * installed app may still carry (M0, M0_5, M2…M6, wrap) are ignored by every
 * reader; `M1` keeps its id so an account that already did or skipped the
 * old tour is not shown the step again.
 */

export const TOUR_MODULES = ['intro', 'pack', 'settings', 'M1'] as const;

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

/** The spotlight modules that run after the help module. */
export const GUIDED_MODULES = ['M1'] as const;
export type GuidedModule = (typeof GUIDED_MODULES)[number];

export function isTerminal(status: TourModuleStatus | undefined): boolean {
  return status === 'completed' || status === 'skipped';
}
