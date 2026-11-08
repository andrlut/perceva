import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ACTIVE_THEME, tokens } from '@/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

export interface PillarAction {
  key: string;
  icon: IoniconName;
  label: string;
  /** Quiet note on the right ("1 min", "há 3 dias"). */
  value?: string;
  onPress: () => void;
}

interface Props {
  actions: PillarAction[];
  /** The pillar's color (Percebida violet, Praticada green, Desejada gold). */
  accent: string;
}

/**
 * The card that closes a portrait of the Eu tab: what you can do from here,
 * one row each, every row the same anatomy (icon halo · label · note · →).
 * It replaced a stack of loose buttons — solid, dashed, a bare link — that
 * each spoke a different visual language. Same surface and halo as the
 * dimension cards above it, so it reads as one more sibling of the list.
 */
export function PillarActions({ actions, accent }: Props) {
  if (actions.length === 0) return null;
  return (
    <View style={styles.card}>
      {actions.map((a, i) => (
        <View key={a.key}>
          {i > 0 && <View style={styles.divider} />}
          <Pressable
            onPress={a.onPress}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
            accessibilityLabel={a.value ? `${a.label}, ${a.value}` : a.label}
          >
            <View style={[styles.iconHalo, { backgroundColor: `${accent}1F` }]}>
              <Ionicons name={a.icon} size={16} color={accent} />
            </View>
            <Text style={styles.label} numberOfLines={1}>
              {a.label}
            </Text>
            {a.value ? (
              <Text style={styles.value} numberOfLines={1}>
                {a.value}
              </Text>
            ) : null}
            <Ionicons name="chevron-forward" size={14} color={tokens.text.dim} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: tokens.radius.md,
    // Same surface as DimensionPillarCard (light gets a real edge).
    backgroundColor: ACTIVE_THEME === 'light' ? tokens.bg.surface : 'rgba(255,255,255,0.025)',
    borderWidth: ACTIVE_THEME === 'light' ? 1 : 0,
    borderColor: tokens.border.base,
    overflow: 'hidden',
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[3],
  },
  iconHalo: {
    width: 28,
    height: 28,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    minWidth: 0,
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: tokens.text.hi,
  },
  value: {
    flexShrink: 0,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: tokens.text.dim,
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: 1,
    backgroundColor: tokens.border.divider,
    marginHorizontal: tokens.space[3],
  },
});
