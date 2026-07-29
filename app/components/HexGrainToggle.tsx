import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

interface Props {
  /** 'dims' shows the 6-dimension hexagon; 'subs' the 12-sub dodecagon. */
  mode: 'dims' | 'subs';
  onToggle: () => void;
  /** Pillar accent (hex) — tints the pill to match the hex it controls. */
  accent: string;
}

/**
 * The small pill that flips a hex between its 6 dimensions and all 12
 * sub-attributes. Shared by all three pillar hexes so the affordance reads
 * the same everywhere; the accent is the only thing that changes. Shows the
 * CURRENT axis count ("6" / "12"); tapping switches and the hex re-shapes.
 */
export function HexGrainToggle({ mode, onToggle, accent }: Props) {
  const { t } = useT();
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [
          styles.toggle,
          { borderColor: `${accent}4D`, backgroundColor: `${accent}14` },
          pressed && { opacity: 0.7 },
        ]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityState={{ selected: mode === 'subs' }}
        accessibilityLabel={mode === 'dims' ? t('hex.showSubs') : t('hex.showDims')}
      >
        <Ionicons name="git-network-outline" size={13} color={accent} />
        <Text style={[styles.text, { color: accent }]}>
          {mode === 'dims' ? '6' : '12'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: -tokens.space[2],
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
  },
  text: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
  },
});
