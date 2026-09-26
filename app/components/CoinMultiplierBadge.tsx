import { StyleSheet, Text } from 'react-native';

import { useT } from '@/lib/i18n';
import { coinMultiplierKey } from '@/lib/xp';
import { tokens } from '@/theme';

/**
 * The quiet mark beside a practice's XP when its coins are not "Igual":
 * `nada` / `½` / `2×` in a hairline pill, dim text, no coin icon and no coin
 * figure — the XP number stays the only number on the row, and the badge
 * only says how the coins relate to it. Renders nothing on "Igual" (the
 * default, where the XP figure already is the coin figure).
 *
 * The spoken label is the full sentence from the picker
 * (`tasks.coinMultiplier.explain.*`), so a screen reader gets the meaning,
 * not "two times".
 */
export function CoinMultiplierBadge({ multiplier }: { multiplier: number }) {
  const { t } = useT();
  const key = coinMultiplierKey(multiplier);
  if (key === 'same') return null;
  return (
    <Text
      style={styles.badge}
      accessibilityLabel={t(`tasks.coinMultiplier.explain.${key}`)}
      numberOfLines={1}
    >
      {t(`tasks.coinMultiplier.badge.${key}`)}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    lineHeight: 13,
    color: tokens.text.dim,
    letterSpacing: 0.2,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: tokens.radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.border.strong,
    overflow: 'hidden',
  },
});
