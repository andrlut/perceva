import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { LearningFeedCard } from '@/lib/api/learning';
import type { DimensionId, LearningMaterialType, SubId } from '@/lib/db/types';
import { useT, type TranslateOptions } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { tokens } from '@/theme';
import { DIMENSION_ORDER, SUB_META, SUBS_BY_DIM } from '@/theme/dimensions';

type Translator = (key: string, options?: TranslateOptions) => string;

/**
 * Collapsible "library stats" pill at the top of the Learn feed.
 *
 * Collapsed: just "X read · Y to go". Tap to expand a small breakdown by
 * dim/sub/type. Stays out of the way until the user wants it.
 */

interface Props {
  cards: LearningFeedCard[];
  readSet: Set<string>;
  open: boolean;
  onToggle: () => void;
}

const TYPES: LearningMaterialType[] = ['explainer', 'summary', 'news'];

function typeLabel(type: LearningMaterialType, t: Translator): string {
  return t(`learning.type.${type}`);
}

export function LearningStatsPanel({ cards, readSet, open, onToggle }: Props) {
  const { t } = useT();
  const meta = useMetaLookup();

  const stats = useMemo(() => {
    const total = cards.length;
    const read = cards.filter((c) => readSet.has(c.id)).length;

    // Per-sub counts (read/total). A material can tag N subs, so its
    // contribution is counted once per tag.
    const perSub = new Map<SubId, { read: number; total: number }>();
    for (const c of cards) {
      for (const sub of c.subs) {
        const slot = perSub.get(sub) ?? { read: 0, total: 0 };
        slot.total += 1;
        if (readSet.has(c.id)) slot.read += 1;
        perSub.set(sub, slot);
      }
    }

    // Per-type counts.
    const perType = new Map<LearningMaterialType, { read: number; total: number }>();
    for (const c of cards) {
      const slot = perType.get(c.type) ?? { read: 0, total: 0 };
      slot.total += 1;
      if (readSet.has(c.id)) slot.read += 1;
      perType.set(c.type, slot);
    }

    return { total, read, perSub, perType };
  }, [cards, readSet]);

  return (
    <View style={styles.root}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
      >
        <Ionicons name="stats-chart" size={14} color={tokens.brand.violet2} />
        <Text style={styles.pillText}>
          {t('learning.stats.summary', { read: stats.read, total: stats.total })}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={tokens.text.mid}
        />
      </Pressable>

      {open && (
        <View style={styles.panel}>
          {/* Per-dim grid */}
          <Text style={styles.section}>{t('learning.stats.byDim')}</Text>
          <View style={styles.grid}>
            {DIMENSION_ORDER.map((dimId: DimensionId) => {
              const dim = meta.dim(dimId);
              const subs = SUBS_BY_DIM[dimId];
              const read = subs.reduce(
                (acc, s) => acc + (stats.perSub.get(s)?.read ?? 0),
                0,
              );
              const total = subs.reduce(
                (acc, s) => acc + (stats.perSub.get(s)?.total ?? 0),
                0,
              );
              return (
                <View key={dimId} style={[styles.cell, { borderColor: dim.color + '55' }]}>
                  <Ionicons
                    name={dim.iconName as keyof typeof Ionicons.glyphMap}
                    size={14}
                    color={dim.color}
                  />
                  <Text style={[styles.cellLabel, { color: tokens.text.base }]}>{dim.label}</Text>
                  <Text style={styles.cellRatio}>
                    <Text style={{ color: dim.color }}>{read}</Text>
                    <Text style={styles.cellRatioSep}>/{total}</Text>
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Per-type row */}
          <Text style={styles.section}>{t('learning.stats.byType')}</Text>
          <View style={styles.typeRow}>
            {TYPES.map((type) => {
              const slot = stats.perType.get(type) ?? { read: 0, total: 0 };
              return (
                <View key={type} style={styles.typePill}>
                  <Text style={styles.typeLabel}>{typeLabel(type, t)}</Text>
                  <Text style={styles.typeRatio}>
                    <Text style={{ color: tokens.brand.violet2 }}>{slot.read}</Text>
                    <Text style={styles.cellRatioSep}>/{slot.total}</Text>
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Subs with content for the curious */}
          {stats.perSub.size > 0 && (
            <>
              <Text style={styles.section}>{t('learning.stats.bySub')}</Text>
              <View style={styles.subRow}>
                {Array.from(stats.perSub.entries()).map(([subId, slot]) => {
                  const sub = meta.sub(subId);
                  const dim = meta.dim(SUB_META[subId].dimensionId);
                  return (
                    <View key={subId} style={[styles.subPill, { borderColor: dim.color + '44' }]}>
                      <Ionicons
                        name={SUB_META[subId].iconName as keyof typeof Ionicons.glyphMap}
                        size={11}
                        color={dim.color}
                      />
                      <Text style={styles.subLabel}>{sub.label}</Text>
                      <Text style={styles.subRatio}>
                        <Text style={{ color: dim.color }}>{slot.read}</Text>
                        <Text style={styles.cellRatioSep}>/{slot.total}</Text>
                      </Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[2],
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: tokens.bg.glass,
    borderWidth: 1,
    borderColor: tokens.border.strong,
  },
  pillPressed: { opacity: 0.85 },
  pillText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: tokens.text.base,
  },
  panel: {
    marginTop: 10,
    padding: 14,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.bg.glass,
    borderWidth: 1,
    borderColor: tokens.border.strong,
    gap: 10,
  },
  section: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    letterSpacing: 1.2,
    color: tokens.text.dim,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexBasis: '48%',
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.bg.glassStrong,
    borderWidth: 1,
  },
  cellLabel: {
    flex: 1,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
  },
  cellRatio: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
  },
  cellRatioSep: {
    color: tokens.text.dim,
    fontFamily: 'Manrope_500Medium',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: tokens.bg.glassStrong,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  typeLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: tokens.text.mid,
  },
  typeRatio: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
  },
  subRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  subPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: tokens.bg.glassStrong,
    borderWidth: 1,
  },
  subLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
    color: tokens.text.mid,
  },
  subRatio: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
  },
});
