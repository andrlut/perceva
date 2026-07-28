import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { HexRadar, type HexAxis } from '@/components/HexRadar';
import type { DimensionId, SubId } from '@/lib/db/types';
import { formatScore } from '@/lib/util/formatScore';
import { tokens } from '@/theme';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { DIMENSION_ORDER, SUBS_BY_DIM } from '@/theme/dimensions';

interface HexChartProps {
  /** Map of sub_id → score (0-5). Missing keys render as 0. */
  scores: Map<SubId, number>;
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
  size = 320,
  secondaryColor = tokens.dimension.bonds,
  onDimPress,
}: HexChartProps) {
  const { t } = useT();
  const metaLookup = useMetaLookup();

  const mains = useMemo(() => dimScores(scores), [scores]);

  const secondary = useMemo(() => {
    if (!secondaryScores) return undefined;
    return dimScores(secondaryScores).map((m) => m.score / DIM_MAX);
  }, [secondaryScores]);

  const overall = useMemo(() => {
    const sum = mains.reduce((s, m) => s + m.score, 0);
    return Math.round((sum / mains.length) * 10) / 10;
  }, [mains]);

  const axes = useMemo<HexAxis[]>(
    () =>
      mains.map((m) => ({
        dimId: m.dim,
        ratio: m.score / DIM_MAX,
        active: m.score > 0,
        a11yLabel: t('avaliacao.hexAxisA11y', {
          dim: metaLookup.dim(m.dim).label,
          score: formatScore(m.score),
          max: DIM_MAX,
        }),
      })),
    [mains, t, metaLookup],
  );

  return (
    <View style={styles.canvas}>
      <HexRadar
        axes={axes}
        secondary={secondary}
        secondaryColor={secondaryColor}
        centerValue={overall.toFixed(1)}
        centerFontSize={28}
        size={size}
        onAxisPress={onDimPress}
        idSuffix="avaliacao"
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
