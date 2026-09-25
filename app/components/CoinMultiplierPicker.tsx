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
 *
 * Under the control, one concrete line spells out the SELECTED option with
 * numbers ("+20 de Dedicação, +10 moedas") — the four words alone didn't say
 * what they multiply (first-user feedback, 2026-09).
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
  const key = coinMultiplierKey(value);
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
        value={key}
        onChange={(k) => onChange(COIN_MULTIPLIER_BY_KEY[k])}
      />
      <Text style={styles.explain} accessibilityLiveRegion="polite">
        {t(`tasks.coinMultiplier.explain.${key}`)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: tokens.space[2] },
  label: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: tokens.text.mid,
  },
  // 13px in text.mid — readable on both the form and the sheet surface.
  explain: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: tokens.text.mid,
  },
});
