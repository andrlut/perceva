import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { HexRadar, type HexAxis } from '@/components/HexRadar';
import type { DimensionId, SubId } from '@/lib/db/types';
import { windowRatio } from '@/lib/dedicacao/scale';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { tokens } from '@/theme';
import { DIMENSION_ORDER, SUB_META } from '@/theme/dimensions';

interface DimSlice {
  dimId: DimensionId;
  xp: number;
}

interface SubSlice {
  subId: SubId;
  dimId: DimensionId;
  xp: number;
}

interface Props {
  /** Per-dim XP for this window, any order. Missing dims count as 0. */
  slices: DimSlice[];
  /** 'dims' (default) plots the 6 dimensions; 'subs' plots all 12
   *  sub-attributes from `subSlices`, normalized against the leading sub. */
  variant?: 'dims' | 'subs';
  /** Per-sub XP for the window, 12 entries in dim order. Required when
   *  variant is 'subs'. */
  subSlices?: SubSlice[];
  totalXp: number;
  /** Total XP in the prior window, or null when comparison doesn't apply
   *  (granularity = 'all'). */
  prevTotalXp: number | null;
  /** True while the window query is in flight. Suppresses the "no XP"
   *  caption — `slices` reads all-zero before the data lands, and asserting
   *  an empty period we haven't loaded yet is a lie, not a placeholder. */
  isLoading?: boolean;
  size?: number;
  onAxisPress?: (dim: DimensionId) => void;
  /** Stable id for the gradient def — required when more than one hex can
   *  render on the same screen (SVG defs share a flat namespace). */
  idSuffix: string;
}

/**
 * Keep the centered figure to five glyphs. A raw total can run six digits,
 * and the center is the one place on this chart where the string cannot be
 * allowed to set the geometry. The 999_500 boundary exists so the last `k`
 * bucket rounds to `999k` rather than printing `1000k`.
 */
function formatCenterXp(xp: number): string {
  if (xp < 10_000) return xp.toLocaleString();
  if (xp < 999_500) return `${Math.round(xp / 100) / 10}k`.replace('.', ',');
  if (xp < 99_950_000) return `${Math.round(xp / 100_000) / 10}M`.replace('.', ',');
  return `${Math.round(xp / 1_000_000)}M`;
}

/**
 * Six-axis XP radar — one axis per dimension, in DIMENSION_ORDER, normalized
 * against the largest dimension in the current window. It answers "where did
 * my effort concentrate", and reads shape-first: a balanced window fills the
 * hexagon evenly, a lopsided one spikes.
 *
 * The scale is deliberately relative. Nothing here says how much XP is "a
 * lot" — only which dims led. Absolute magnitude lives in the total under
 * the hex and in the per-dim cards.
 *
 * Empty window: grid only, no shape, and a caption saying so.
 * Single-dominant window: a spike from the center — degenerate but truthful,
 * and the MIN_RATIO floor keeps the other non-zero dims from vanishing.
 */
export function XpHexChart({
  slices,
  variant = 'dims',
  subSlices,
  totalXp,
  prevTotalXp,
  isLoading = false,
  size = 240,
  onAxisPress,
  idSuffix,
}: Props) {
  const { t } = useT();
  const metaLookup = useMetaLookup();

  // Normalized via the shared `windowRatio` — relative to the leading axis of
  // the current grain (leading dim in 'dims', leading sub in 'subs'), the same
  // mapping the dimension-card bars use. In 'subs' each axis carries its sub
  // glyph but its parent dim's color, so the dodecagon reads as six lobes.
  const vertices = useMemo(() => {
    if (variant === 'subs') {
      const subs = subSlices ?? [];
      const max = subs.reduce((m, s) => Math.max(m, s.xp), 0);
      return subs.map((s) => ({
        dimId: s.dimId,
        iconName: SUB_META[s.subId].iconName as string | undefined,
        label: metaLookup.sub(s.subId).label,
        xp: s.xp,
        ratio: windowRatio(s.xp, max),
      }));
    }
    const xpById = new Map(slices.map((s) => [s.dimId, s.xp]));
    const max = DIMENSION_ORDER.reduce(
      (m, d) => Math.max(m, xpById.get(d) ?? 0),
      0,
    );
    return DIMENSION_ORDER.map((dimId) => {
      const xp = xpById.get(dimId) ?? 0;
      return {
        dimId,
        iconName: undefined as string | undefined,
        label: metaLookup.dim(dimId).label,
        xp,
        ratio: windowRatio(xp, max),
      };
    });
  }, [variant, slices, subSlices, metaLookup]);

  const hasData = totalXp > 0 && vertices.some((v) => v.xp > 0);

  const axes = useMemo<HexAxis[]>(
    () =>
      vertices.map((v) => ({
        dimId: v.dimId,
        iconName: v.iconName,
        ratio: hasData ? v.ratio : 0,
        active: v.xp > 0,
        a11yLabel: t('dedicacao.hexAxisA11y', {
          dim: v.label,
          xp: v.xp.toLocaleString(),
        }),
      })),
    [vertices, hasData, t],
  );

  const delta = useMemo(() => {
    if (prevTotalXp === null) return null;
    if (prevTotalXp === 0 && totalXp === 0) return null;
    if (prevTotalXp === 0) return { kind: 'new' as const };
    const diff = totalXp - prevTotalXp;
    const pct = Math.round((diff / prevTotalXp) * 100);
    return { kind: 'pct' as const, pct, positive: diff >= 0 };
  }, [totalXp, prevTotalXp]);

  return (
    <View style={styles.wrap}>
      {/* The one number that still differs from Avaliação, and only because
          the string does: a score is three glyphs, an XP total can be six.
          24 keeps a five-glyph figure inside the inner ring at the shared
          canvas size; past five, `formatCenterXp` abbreviates rather than
          letting the string dictate the geometry. */}
      <HexRadar
        axes={axes}
        centerValue={formatCenterXp(totalXp)}
        centerUnit="XP"
        centerFontSize={24}
        size={size}
        onAxisPress={onAxisPress}
        idSuffix={idSuffix}
        a11yLabel={t('a11y.xpByDimension')}
      />

      <View style={styles.caption}>
        {/* The delta wins whenever it exists, including the empty window
            that follows a non-empty one: "▼ -100%" says strictly more than
            "no XP this period". The caption is the fallback, and it stays
            silent while loading rather than asserting an empty period. */}
        {delta ? (
          <Text
            style={[
              styles.deltaText,
              {
                color:
                  delta.kind === 'new' || delta.positive
                    ? tokens.semantic.xp2
                    : tokens.semantic.warn,
              },
            ]}
          >
            {delta.kind === 'new'
              ? t('dedicacao.deltaNew', { xp: totalXp.toLocaleString() })
              : `${delta.positive ? '▲ +' : '▼ '}${delta.pct}%`}
          </Text>
        ) : !hasData && !isLoading ? (
          <Text style={styles.emptyText}>{t('dedicacao.hexEmpty')}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: tokens.space[2] },
  caption: { alignItems: 'center', gap: 2 },
  deltaText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  emptyText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: tokens.text.dim,
    letterSpacing: 0.3,
  },
});
