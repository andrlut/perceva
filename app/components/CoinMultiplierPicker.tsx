import { StyleSheet, Text, View } from 'react-native';

import { SegmentedControl } from '@/components/SegmentedControl';
import type { CoinMultiplier } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { COIN_MULTIPLIER_BY_KEY, coinMultiplierKey, type CoinMultiplierKey } from '@/lib/xp';
import { tokens } from '@/theme';

/**
 * How many coins a practice pays relative to its XP: Nada / Metade / Igual /
 * Dobro. XP stays the stars — the effort spent; this is what the practice is
 * worth in his reward economy (playing a videogame can be worth nothing,
 * meditating double).
 *
 * Used twice: in the practice form, where it sets the default, and in the
 * completion sheet, where it overrides that default for one log only.
 */
export function CoinMultiplierPicker({
  value,
  onChange,
  label,
}: {
  value: CoinMultiplier;
  onChange: (m: CoinMultiplier) => void;
  /** Optional small caption above the control (the sheet has no field label). */
  label?: string;
}) {
  const { t } = useT();
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <SegmentedControl<CoinMultiplierKey>
        options={[
          { value: 'none', label: t('tasks.coinMultiplier.none') },
          { value: 'half', label: t('tasks.coinMultiplier.half') },
          { value: 'same', label: t('tasks.coinMultiplier.same') },
          { value: 'double', label: t('tasks.coinMultiplier.double') },
        ]}
        value={coinMultiplierKey(value)}
        onChange={(key) => onChange(COIN_MULTIPLIER_BY_KEY[key])}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: tokens.space[2] },
  label: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: tokens.text.mid,
  },
});
