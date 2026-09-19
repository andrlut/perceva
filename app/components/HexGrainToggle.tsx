import { Ionicons } from '@expo/vector-icons';
import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useT } from '@/lib/i18n';
import { type HexGrain, useLoadedSettings } from '@/lib/settings';
import { tokens } from '@/theme';

interface Props {
  /** 'dims' shows the 6-dimension hexagon; 'subs' the 12-sub dodecagon. */
  mode: HexGrain;
  onToggle: () => void;
  /** Pillar accent (hex) — tints the pill to match the hex it controls. */
  accent: string;
  /** Optional control on the left of the same row (Praticada's teto pill). */
  leading?: ReactNode;
}

/**
 * The grain a pillar hex shows: the user's default (Ajustes → Preferências →
 * "Hexágono abre em") until the pill flips it. The flip lasts the visit and
 * is never saved — the setting is where the hex starts, the pill is a glance.
 */
export function useHexGrain(): [HexGrain, () => void] {
  const { hexGrain } = useLoadedSettings();
  const [override, setOverride] = useState<HexGrain | null>(null);
  const mode = override ?? hexGrain;
  return [mode, () => setOverride(mode === 'dims' ? 'subs' : 'dims')];
}

/**
 * The small pill that flips a hex between its 6 dimensions and all 12
 * sub-attributes. Shared by all three pillar hexes so the affordance reads
 * the same everywhere; the accent is the only thing that changes. Shows the
 * CURRENT axis count ("6" / "12"); tapping switches and the hex re-shapes.
 */
export function HexGrainToggle({ mode, onToggle, accent, leading }: Props) {
  const { t } = useT();
  return (
    <View style={[styles.row, leading ? styles.rowSplit : null]}>
      {leading}
      <HexPill
        icon="git-network-outline"
        label={mode === 'dims' ? '6' : '12'}
        accent={accent}
        onPress={onToggle}
        selected={mode === 'subs'}
        a11yLabel={mode === 'dims' ? t('hex.showSubs') : t('hex.showDims')}
      />
    </View>
  );
}

/**
 * The pill itself, for any hex-level switch that should read like the grain
 * one. Like it, the label shows the CURRENT state.
 */
export function HexPill({
  icon,
  label,
  accent,
  onPress,
  selected,
  a11yLabel,
}: {
  icon: string;
  label: string;
  /** 6-digit hex — the chrome concatenates alpha. */
  accent: string;
  onPress: () => void;
  selected: boolean;
  a11yLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.toggle,
        { borderColor: `${accent}4D`, backgroundColor: `${accent}14` },
        pressed && { opacity: 0.7 },
      ]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={a11yLabel}
    >
      <Ionicons name={icon as never} size={13} color={accent} />
      <Text style={[styles.text, { color: accent }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: -tokens.space[2],
  },
  rowSplit: { justifyContent: 'space-between' },
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
