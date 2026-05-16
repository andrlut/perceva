import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

export type PillarKey = 'percebida' | 'praticada' | 'desejada';

interface Props {
  active: PillarKey;
  onChange: (next: PillarKey) => void;
}

interface Item {
  key: PillarKey;
  icon: 'eye-outline' | 'pulse' | 'compass-outline';
  accent: string;
  halo: string;
  border: string;
}

const ITEMS: Item[] = [
  {
    key: 'percebida',
    icon: 'eye-outline',
    accent: tokens.brand.violet2,
    halo: 'rgba(155, 130, 255, 0.18)',
    border: 'rgba(155, 130, 255, 0.35)',
  },
  {
    key: 'praticada',
    icon: 'pulse',
    accent: tokens.semantic.xp2,
    halo: 'rgba(111, 232, 170, 0.18)',
    border: 'rgba(61, 214, 140, 0.35)',
  },
  {
    key: 'desejada',
    icon: 'compass-outline',
    accent: tokens.semantic.coin,
    halo: 'rgba(255, 200, 61, 0.18)',
    border: 'rgba(255, 200, 61, 0.35)',
  },
];

/**
 * Top-level pillar switcher — three icons (one per V3 pilar) laid out
 * full-width with a tone-tinted halo on the active item. Replaces the
 * V2 PillarTabs which used text segments and KPIs.
 *
 * Tones mirror the V3 feedback registers:
 *   - Percebida → contemplative (violet)
 *   - Praticada → dopaminergic (xp green)
 *   - Desejada → ceremonious (coin gold)
 */
export function PillarSwitcher({ active, onChange }: Props) {
  const { t } = useT();
  return (
    <View style={styles.row}>
      {ITEMS.map((it) => {
        const isActive = it.key === active;
        return (
          <Pressable
            key={it.key}
            onPress={() => {
              if (!isActive) Haptics.selectionAsync().catch(() => {});
              onChange(it.key);
            }}
            style={({ pressed }) => [
              styles.tab,
              isActive && {
                backgroundColor: it.halo,
                borderColor: it.border,
              },
              pressed && { opacity: 0.85 },
            ]}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityState={isActive ? { selected: true } : {}}
            accessibilityLabel={t(`pillar.top.${it.key}.label`)}
          >
            <Ionicons
              name={it.icon}
              size={22}
              color={isActive ? it.accent : tokens.text.dim}
            />
            <Text
              style={[
                styles.label,
                { color: isActive ? it.accent : tokens.text.dim },
              ]}
              numberOfLines={1}
            >
              {t(`pillar.top.${it.key}.label`).toUpperCase()}
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
    gap: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[2],
    borderRadius: tokens.radius.md,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  label: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    letterSpacing: 1.2,
  },
});
