import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import type { LearningMaterialType } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/**
 * Tiny round badge surfacing the material type on a book cover — icon only
 * (explainer/summary/news each get a distinct color + glyph) so it reads at
 * a glance without eating cover space with a text label. Rendered inline by
 * CoverCard inside the top title block (no longer absolutely positioned); the
 * visible-text label was dropped, but the type name stays as the a11y label.
 */
export const TYPE_META: Record<
  LearningMaterialType,
  { color: string; glyph: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap }
> = {
  explainer: { color: tokens.brand.violet2, glyph: 'book' },
  summary: { color: tokens.semantic.coin, glyph: 'bookmark' },
  news: { color: tokens.dimension.bonds, glyph: 'flash' },
};

interface Props {
  type: LearningMaterialType;
}

export function TypeSash({ type }: Props) {
  const { t } = useT();
  const m = TYPE_META[type];
  return (
    <View
      style={[styles.sash, { borderColor: m.color + '99' }]}
      accessibilityLabel={t(`learning.type.${type}`)}
    >
      <Ionicons name={m.glyph} size={13} color={m.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  sash: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(10, 14, 38, 0.72)',
    borderWidth: 1,
  },
});
