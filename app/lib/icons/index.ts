import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Icon ids as STORED (task.icon, reward.icon, skill.icon — free text, no
 * DB constraint) and as rendered by `<AppIcon>`:
 *
 *   'pizza'          → Ionicons glyph "pizza"            (the historical form)
 *   'mdi:smoking'    → MaterialCommunityIcons "smoking"  (7k glyphs Ionicons lacks)
 *
 * Every row written before 2026-09-22 is a bare Ionicons name, so the bare
 * form stays the default and nothing needs a backfill. Unknown ids fall back
 * to a neutral glyph instead of a blank tile (a renamed glyph, a typo in
 * Studio) — see `resolveIcon`.
 */
export type IconFamily = 'ion' | 'mdi';

export interface ResolvedIcon {
  family: IconFamily;
  glyph: string;
}

const MDI_PREFIX = 'mdi:';

const ION_GLYPHS = Ionicons.glyphMap as Record<string, number>;
const MDI_GLYPHS = MaterialCommunityIcons.glyphMap as Record<string, number>;

/** Shown when an id resolves to nothing. Neutral, never misleading. */
export const FALLBACK_ICON: ResolvedIcon = { family: 'ion', glyph: 'ellipse-outline' };

export function mdi(glyph: string): string {
  return MDI_PREFIX + glyph;
}

/** Family + glyph for an id, or null when the glyph does not exist. */
export function parseIcon(id: string | null | undefined): ResolvedIcon | null {
  if (!id) return null;
  if (id.startsWith(MDI_PREFIX)) {
    const glyph = id.slice(MDI_PREFIX.length);
    return glyph in MDI_GLYPHS ? { family: 'mdi', glyph } : null;
  }
  return id in ION_GLYPHS ? { family: 'ion', glyph: id } : null;
}

export function isKnownIcon(id: string | null | undefined): boolean {
  return parseIcon(id) !== null;
}

/** Never null: the parsed icon, or the fallback. */
export function resolveIcon(id: string | null | undefined): ResolvedIcon {
  return parseIcon(id) ?? FALLBACK_ICON;
}

/** Accent- and case-insensitive haystack for the picker's search. */
export function normalizeSearch(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}
