/**
 * Client mirror of `mark_material_read` (migration 20261008000001): reading
 * in the Recanto no longer pays XP or coins — the reward for learning is a
 * practice the reader adopts ("Absorver uma ideia", catalog
 * `learn_absorb_idea`), under the same rules as every practice. Kept as a
 * function so the "+N XP" previews have one source; every surface hides its
 * preview when this is 0.
 *
 * History: legacy materials paid 5 + 5 per sub (per dimension); materials
 * with ideas paid 10 + 2 per idea, generic (20260907000002).
 */
export function xpForMaterial(_ideaCount: number, _subCount: number): number {
  return 0;
}
