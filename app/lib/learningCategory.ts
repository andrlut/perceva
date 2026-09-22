import type { Ionicons } from '@expo/vector-icons';

import type { LearningMaterialCategory } from '@/lib/db/types';
import { tokens } from '@/theme';

/** Display order in the filter sheet — the bulk of the catalog first. */
export const CATEGORY_ORDER: LearningMaterialCategory[] = ['research', 'book', 'foundation'];

/** Color + glyph per category (cover meta row). Label: `learning.category.<key>`. */
export const CATEGORY_META: Record<
  LearningMaterialCategory,
  { color: string; glyph: keyof typeof Ionicons.glyphMap }
> = {
  research: { color: tokens.brand.violet2, glyph: 'flask' },
  book: { color: tokens.semantic.coin, glyph: 'book' },
  foundation: { color: tokens.dimension.bonds, glyph: 'compass' },
};

/**
 * The category of a material row, tolerant of a missing or unknown value
 * (a row cached before the column existed, or a category added later):
 * falls back to the legacy `type` mirror and never throws. The bundle
 * before this one crashed on an unknown `type` — this lookup must not.
 */
export function categoryOf(row: {
  category?: string | null;
  type?: string | null;
}): LearningMaterialCategory {
  const c = row.category;
  if (c === 'research' || c === 'book' || c === 'foundation') return c;
  return row.type === 'summary' ? 'book' : 'research';
}
