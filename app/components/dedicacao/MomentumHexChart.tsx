import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { HexRadar, type HexAxis } from '@/components/HexRadar';
import type { DimensionId } from '@/lib/db/types';
// Share the Dedicação vertex floor so a token amount of momentum still shows
// a visible vertex instead of reading as zero. Only the floor is shared —
// this hex's scale is absolute (see below), not relative to a leader.
import { MIN_RATIO } from '@/lib/dedicacao/scale';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import {
  MOMENTUM_CAP_VALUE,
  momentumTier,
  type AttributeMomentum,
} from '@/lib/xp';
import { DIMENSION_ORDER } from '@/theme/dimensions';

interface Props {
  momentum: AttributeMomentum[];
  size?: number;
  onAxisPress?: (dim: DimensionId) => void;
  idSuffix: string;
}

/**
 * Six-axis momentum radar. Unlike the Dedicação hex, this scale is ABSOLUTE:
 * each axis is dimMomentum / MOMENTUM_CAP_VALUE (300, the +25% bonus cap), so
 * a full hexagon truthfully means "peak everywhere" rather than "biggest this
 * window" — momentum has a real ceiling, windowed XP doesn't. Center = the
 * mean momentum, captioned with its tier word (CALMO/SUBINDO/FORTE/PLENO).
 */
export function MomentumHexChart({
  momentum,
  size = 240,
  onAxisPress,
  idSuffix,
}: Props) {
  const { t } = useT();
  const metaLookup = useMetaLookup();

  const byDim = useMemo(() => {
    const m = new Map<DimensionId, number>();
    for (const attr of momentum) m.set(attr.dimensionId, attr.momentum);
    return m;
  }, [momentum]);

  const axes = useMemo<HexAxis[]>(
    () =>
      DIMENSION_ORDER.map((dimId) => {
        const value = byDim.get(dimId) ?? 0;
        const ratio =
          value > 0
            ? Math.min(1, Math.max(MIN_RATIO, value / MOMENTUM_CAP_VALUE))
            : 0;
        return {
          dimId,
          ratio,
          active: value > 0,
          a11yLabel: t('home.momentum.hexAxisA11y', {
            dim: metaLookup.dim(dimId).label,
            value,
          }),
        };
      }),
    [byDim, t, metaLookup],
  );

  const mean = useMemo(() => {
    const sum = DIMENSION_ORDER.reduce((s, d) => s + (byDim.get(d) ?? 0), 0);
    return Math.round(sum / DIMENSION_ORDER.length);
  }, [byDim]);

  const tier = momentumTier(mean);

  return (
    <View style={styles.wrap}>
      <HexRadar
        axes={axes}
        centerValue={String(mean)}
        centerUnit={t(`home.momentum.tier.${tier}`).toUpperCase()}
        centerFontSize={24}
        size={size}
        onAxisPress={onAxisPress}
        idSuffix={idSuffix}
        a11yLabel={t('a11y.momentumByDimension')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
});
