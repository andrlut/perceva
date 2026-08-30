/**
 * Which token palette the app boots with.
 *
 * Phase 1 (this file): a build-time switch — flip to 'light' and reload
 * to try the light theme end to end. Runtime switching (Settings toggle
 * + persisted preference) is a later phase: ~165 files capture token
 * values inside StyleSheet.create at module load, so a live switch
 * needs either a restart prompt or a broader refactor to dynamic
 * styles. Keep 'dark' on main until the light palette is approved.
 *
 * Palette source: the "Perceva — Tema Claro" design canvas (coletânea
 * de 2026-08-31) — porcelain-lavender grounds, ink text, violet/gold
 * recalibrated for AA on light.
 */
export const ACTIVE_THEME: 'dark' | 'light' = 'dark';
