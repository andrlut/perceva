/**
 * Client mirror of `mark_material_read`'s two branches (migration
 * 20260907000002). The server is authoritative — this only feeds the
 * "+N XP" previews. Keep both in lockstep.
 *
 * - Legacy material (no ideas): 5 base + 5 per related sub, credited per
 *   dimension on the server.
 * - Material with ideas: 10 base + 2 per idea, generic (no dimension).
 */

export const LEGACY_XP_BASE = 5;
export const LEGACY_XP_PER_SUB = 5;
export const IDEAS_XP_BASE = 10;
export const IDEAS_XP_PER_IDEA = 2;

export function xpForMaterial(ideaCount: number, subCount: number): number {
  if (ideaCount > 0) return IDEAS_XP_BASE + IDEAS_XP_PER_IDEA * ideaCount;
  return LEGACY_XP_BASE + LEGACY_XP_PER_SUB * subCount;
}
