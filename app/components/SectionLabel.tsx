import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CoinIcon } from '@/components/CoinIcon';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/**
 * Section title inside a card: a small icon, the uppercase label and, when
 * the section has an explanation, an (i) that hands it to the host (which
 * opens an InfoSheet). The explanation lives behind the (i) instead of as a
 * paragraph under the title — first-user feedback: too much text.
 *
 * `coin` wears the Vault's gold (coin icon + gold label) so a money section
 * reads as money at a glance. The (i) is a 22px glyph in a 36px target
 * (+8 hitSlop): the small one was hard to hit on the first try.
 *
 * Used by the practice form and the Claude connector screen — one header for
 * every card-sectioned screen.
 */
export function SectionLabel({
  icon,
  coin = false,
  label,
  onInfo,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  coin?: boolean;
  label: string;
  onInfo?: () => void;
}) {
  const { t } = useT();
  return (
    <View style={styles.row}>
      {coin ? (
        <CoinIcon size={18} />
      ) : icon ? (
        <Ionicons name={icon} size={16} color={tokens.brand.violet2} />
      ) : null}
      <Text style={[styles.label, coin && { color: tokens.semantic.coinLight }]}>{label}</Text>
      {onInfo && (
        <Pressable
          onPress={onInfo}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('taskForm.infoA11y', { section: label })}
          style={({ pressed }) => [styles.infoBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons
            name="information-circle-outline"
            size={22}
            color={coin ? tokens.semantic.coinLight : tokens.text.dim}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoBtn: {
    marginLeft: 'auto',
    width: 36,
    height: 36,
    marginVertical: -8,
    marginRight: -8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flexShrink: 1,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    lineHeight: 16,
    color: tokens.text.base,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
