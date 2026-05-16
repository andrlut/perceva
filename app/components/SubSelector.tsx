import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { tokens } from '@/theme';

interface SubOption {
  key: string;
  label: string;
}

interface Props {
  options: [SubOption, SubOption];
  active: string;
  onChange: (key: string) => void;
  /** Accent color for the active item — usually matches the parent pillar tone. */
  accent: string;
  halo: string;
  border: string;
}

/**
 * 2-segment chooser used inside each pillar to flip between its two sub-pilares
 * (e.g. Avaliação ↔ Autoconhecimento for Percebida). Tighter than PillarSwitcher
 * since it's a level deeper in the hierarchy — small chips, no icons.
 */
export function SubSelector({
  options,
  active,
  onChange,
  accent,
  halo,
  border,
}: Props) {
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const isActive = opt.key === active;
        return (
          <Pressable
            key={opt.key}
            onPress={() => {
              if (!isActive) Haptics.selectionAsync().catch(() => {});
              onChange(opt.key);
            }}
            style={({ pressed }) => [
              styles.chip,
              isActive && {
                backgroundColor: halo,
                borderColor: border,
              },
              pressed && { opacity: 0.85 },
            ]}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityState={isActive ? { selected: true } : {}}
          >
            <Text
              style={[
                styles.label,
                { color: isActive ? accent : tokens.text.dim },
              ]}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.space[2],
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.pill,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  label: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    letterSpacing: 0.3,
  },
});
