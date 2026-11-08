import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { tokens } from '@/theme';

/** Slim section header of a Gerenciar list — accent icon, eyebrow, one-
 *  line description, count chip and the collapse chevron. No card: the
 *  rows below carry the surface, the header just names the group. */
export function ManageGroupHeader({
  icon,
  accent,
  accentBg,
  label,
  desc,
  count,
  collapsed,
  onToggle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  accentBg: string;
  label: string;
  desc?: string;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [styles.header, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityState={{ expanded: !collapsed }}
    >
      <View style={[styles.icon, { backgroundColor: accentBg }]}>
        <Ionicons name={icon} size={16} color={accent} />
      </View>
      <View style={styles.titleCol}>
        <Text style={[styles.eyebrow, { color: accent }]}>{label.toUpperCase()}</Text>
        {desc ? (
          <Text style={styles.desc} numberOfLines={1}>
            {desc}
          </Text>
        ) : null}
      </View>
      <View style={[styles.countChip, { backgroundColor: accentBg }]}>
        <Text style={[styles.countChipText, { color: accent }]}>{count}</Text>
      </View>
      <Ionicons name={collapsed ? 'chevron-down' : 'chevron-up'} size={16} color={tokens.text.dim} />
    </Pressable>
  );
}

/** Dashed placeholder inside an open, empty group — shows where a drop
 *  would land. */
export function ManageGroupEmpty({ text }: { text: string }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: tokens.border.strong,
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[4],
    marginBottom: tokens.space[2],
  },
  emptyText: {
    ...tokens.type.caption,
    color: tokens.text.dim,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    paddingTop: tokens.space[4],
    paddingBottom: tokens.space[2],
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  eyebrow: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    letterSpacing: 1.2,
  },
  desc: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: tokens.text.dim,
  },
  countChip: {
    minWidth: 24,
    height: 20,
    paddingHorizontal: 7,
    borderRadius: tokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countChipText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    letterSpacing: 0.3,
  },
});
