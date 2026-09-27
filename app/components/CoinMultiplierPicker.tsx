import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CoinIcon } from '@/components/CoinIcon';
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
 * Four gold tiles, the glyph first (0 / ½ / 1× / 2×) and the word small
 * under it — the money identity of the Vault, not a generic segmented
 * control. The sentence explaining each option lives behind the form's (i)
 * (`tasks.coinMultiplier.explain.*`) and is what a screen reader hears on
 * each tile; both hosts already show the resulting coins next to the XP.
 */

const KEYS: CoinMultiplierKey[] = ['none', 'half', 'same', 'double'];
const GLYPH: Record<CoinMultiplierKey, string> = {
  none: '0',
  half: '½',
  same: '1×',
  double: '2×',
};

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
  const selected = coinMultiplierKey(value);
  return (
    <View style={styles.wrap}>
      {label ? (
        <View style={styles.labelRow}>
          <CoinIcon size={14} />
          <Text style={styles.label}>{label}</Text>
        </View>
      ) : null}
      <View style={styles.row} accessibilityRole="radiogroup">
        {KEYS.map((key) => {
          const active = key === selected;
          return (
            <Pressable
              key={key}
              onPress={() => {
                if (active) return;
                Haptics.selectionAsync().catch(() => {});
                onChange(COIN_MULTIPLIER_BY_KEY[key]);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${t(`tasks.coinMultiplier.${key}`)}. ${t(`tasks.coinMultiplier.explain.${key}`)}`}
              style={({ pressed }) => [
                styles.tile,
                active && styles.tileActive,
                pressed && !active && { opacity: 0.7 },
              ]}
            >
              <Text style={[styles.glyph, active && styles.glyphActive]}>{GLYPH[key]}</Text>
              <Text style={[styles.word, active && styles.wordActive]} numberOfLines={1}>
                {t(`tasks.coinMultiplier.${key}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: tokens.space[2] },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: tokens.semantic.coinLight,
  },
  row: {
    flexDirection: 'row',
    gap: tokens.space[2],
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: tokens.space[2],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.border.base,
    backgroundColor: tokens.bg.surface,
  },
  tileActive: {
    borderColor: tokens.semantic.coinRim,
    backgroundColor: 'rgba(255, 200, 61, 0.14)',
  },
  glyph: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 18,
    lineHeight: 22,
    color: tokens.text.mid,
  },
  glyphActive: {
    color: tokens.semantic.coinLight,
  },
  word: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: tokens.text.dim,
  },
  wordActive: {
    color: tokens.semantic.coinLight,
  },
});
