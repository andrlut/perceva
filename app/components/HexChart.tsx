import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { HexRadar, type HexAxis } from '@/components/HexRadar';
import type { DimensionId, SubId } from '@/lib/db/types';
import { formatScore } from '@/lib/util/formatScore';
import { tokens } from '@/theme';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { DIMENSION_ORDER, SUB_META, SUBS_BY_DIM } from '@/theme/dimensions';

interface HexChartProps {
  /** Map of sub_id → score (0-5). Missing keys render as 0. */
  scores: Map<SubId, number>;
  /** 'dims' (default) plots the 6 dimensions (each = its two subs summed,
   *  out of 10). 'subs' plots all 12 sub-attributes (each out of 5) grouped
   *  so a dimension's two subs sit adjacent, sharing its color. */
  variant?: 'dims' | 'subs';
  /** Optional second series — rendered as an outline-only polygon in the
   *  secondary color, no vertex dots. Used for "self vs questionnaire"
   *  comparison without doubling up the visual weight. */
  secondaryScores?: Map<SubId, number>;
  size?: number;
  /** Color for the secondary polygon outline. Defaults to bonds teal. */
  secondaryColor?: string;
  /** When provided, the vertex badges become tappable and call this with
   *  the dim id — drills into the dim detail screen from the hex. */
  onDimPress?: (dim: DimensionId) => void;
  /** SVG gradient-def namespace. Defaults to 'avaliacao'. Override when a
   *  second hex (e.g. Norte's desired-state chart) can share the screen. */
  idSuffix?: string;
  /** Force the centered figure instead of the computed average — e.g. an
   *  em dash for Norte's "no targets set yet" empty state. */
  centerValue?: string;
}

const SUB_MAX = 5;
const DIM_MAX = SUB_MAX * 2;

function dimScores(scores: Map<SubId, number>) {
  return DIMENSION_ORDER.map((dim) => {
    const [a, b] = SUBS_BY_DIM[dim];
    const sa = scores.get(a) ?? 0;
    const sb = scores.get(b) ?? 0;
    return { dim, sa, sb, score: sa + sb };
  });
}

/**
 * Wheel-of-life hexagon — the Avaliação side of the shared HexRadar canvas.
 *
 * Owns only the scoring: two subs sum into a dim score out of DIM_MAX, and
 * that absolute fraction is the axis ratio. Unlike Dedicação the scale is
 * not relative — a full hexagon here means a 10/10 everywhere, which is a
 * claim worth being able to make.
 *
 * The six dimension cards that used to live here now render separately via
 * <DimensionCards> so the source toggle and the cards can sit in the
 * standard order below the hex. This component is the radar canvas only:
 * per-dim numbers ride the legend cards, the average sits in the center.
 */
export function HexChart({
  scores,
  secondaryScores,
  variant = 'dims',
  size = 320,
  secondaryColor = tokens.dimension.bonds,
  onDimPress,
  idSuffix = 'avaliacao',
  centerValue,
}: HexChartProps) {
  const { t } = useT();
  const metaLookup = useMetaLookup();

  const mains = useMemo(() => dimScores(scores), [scores]);

  // 12 subs in dim order, each tagged with its parent dim — so the dodecagon
  // reads as six color-paired lobes when the user expands to sub grain.
  const subOrder = useMemo(
    () =>
      DIMENSION_ORDER.flatMap((dim) =>
        SUBS_BY_DIM[dim].map((sub) => ({ sub, dim })),
      ),
    [],
  );

  const secondary = useMemo(() => {
    if (!secondaryScores) return undefined;
    if (variant === 'subs') {
      return subOrder.map(({ sub }) => (secondaryScores.get(sub) ?? 0) / SUB_MAX);
    }
    return dimScores(secondaryScores).map((m) => m.score / DIM_MAX);
  }, [secondaryScores, variant, subOrder]);

  // Center stays the overall average of the six dimensions in both variants —
  // the same wellbeing figure, just a coarser or finer shape around it.
  const overall = useMemo(() => {
    const sum = mains.reduce((s, m) => s + m.score, 0);
    return Math.round((sum / mains.length) * 10) / 10;
  }, [mains]);

  const axes = useMemo<HexAxis[]>(() => {
    if (variant === 'subs') {
      return subOrder.map(({ sub, dim }) => {
        const score = scores.get(sub) ?? 0;
        return {
          dimId: dim,
          iconName: SUB_META[sub].iconName,
          ratio: score / SUB_MAX,
          active: score > 0,
          a11yLabel: t('avaliacao.hexAxisA11y', {
            dim: metaLookup.sub(sub).label,
            score: formatScore(score),
            max: SUB_MAX,
          }),
        };
      });
    }
    return mains.map((m) => ({
      dimId: m.dim,
      ratio: m.score / DIM_MAX,
      active: m.score > 0,
      a11yLabel: t('avaliacao.hexAxisA11y', {
        dim: metaLookup.dim(m.dim).label,
        score: formatScore(m.score),
        max: DIM_MAX,
      }),
    }));
  }, [variant, subOrder, scores, mains, t, metaLookup]);

  return (
    <View style={styles.canvas}>
      <HexRadar
        axes={axes}
        secondary={secondary}
        secondaryColor={secondaryColor}
        centerValue={centerValue ?? overall.toFixed(1)}
        centerFontSize={28}
        size={size}
        onAxisPress={onDimPress}
        idSuffix={idSuffix}
        a11yLabel={t('a11y.scoreByDimension')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    alignSelf: 'center',
  },
});
