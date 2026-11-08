import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { LimitCounterBadge } from '@/components/premium/LimitCounterBadge';
import type { EntityLimit } from '@/lib/premium';
import { tokens } from '@/theme';

/**
 * The two doors at the top of a Gerenciar screen (Onboarding simples, André
 * 19/10): one of your own, or a suggested one from the catalog. Same doors
 * on práticas and recompensas — violet for yours, gold for the catalog —
 * and they replace the old "Nova …" card at the foot of the list.
 */
export function ManageDoors({
  createTitle,
  createDesc,
  suggestedTitle,
  suggestedDesc,
  onCreate,
  onSuggested,
  limit,
}: {
  createTitle: string;
  createDesc: string;
  suggestedTitle: string;
  suggestedDesc: string;
  onCreate: () => void;
  onSuggested: () => void;
  /** Free-plan slots of what "Criar a minha" creates. The counter shows
   *  near the cap only (LimitCounterBadge decides). */
  limit?: EntityLimit;
}) {
  return (
    <View style={styles.doors}>
      <ManageDoor
        variant="create"
        title={createTitle}
        desc={createDesc}
        onPress={onCreate}
        limit={limit}
      />
      <ManageDoor
        variant="suggested"
        title={suggestedTitle}
        desc={suggestedDesc}
        onPress={onSuggested}
      />
    </View>
  );
}

const DOOR_META = {
  create: {
    icon: 'create-outline',
    color: tokens.brand.violet2,
    tile: 'rgba(123, 92, 255, 0.18)',
    border: 'rgba(155, 130, 255, 0.55)',
  },
  suggested: {
    icon: 'albums-outline',
    color: tokens.semantic.coin,
    tile: 'rgba(255, 200, 61, 0.16)',
    border: 'rgba(255, 200, 61, 0.45)',
  },
} as const;

/** One door. Exported for the guides' replicas. */
export function ManageDoor({
  variant,
  title,
  desc,
  onPress,
  limit,
  style,
}: {
  variant: 'create' | 'suggested';
  title: string;
  desc: string;
  onPress: () => void;
  limit?: EntityLimit;
  style?: StyleProp<ViewStyle>;
}) {
  const meta = DOOR_META[variant];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.door,
        { borderColor: meta.border },
        style,
        pressed && { opacity: 0.85 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[styles.doorIcon, { backgroundColor: meta.tile }]}>
        <Ionicons name={meta.icon} size={22} color={meta.color} />
      </View>
      {limit ? (
        <View style={styles.badge} pointerEvents="none">
          <LimitCounterBadge limit={limit} />
        </View>
      ) : null}
      <Text style={styles.doorTitle}>{title}</Text>
      <Text style={styles.doorDesc}>{desc}</Text>
    </Pressable>
  );
}

/** The catalog view's way back to the list, with what is left to adopt. */
export function ManageCatalogBack({
  label,
  countLabel,
  onPress,
}: {
  label: string;
  countLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.backRow, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name="chevron-back" size={18} color={tokens.brand.violet2} />
      <Text style={styles.backText}>{label}</Text>
      <View style={{ flex: 1 }} />
      <Text style={styles.backCount}>{countLabel}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  doors: {
    flexDirection: 'row',
    gap: tokens.space[3],
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[2],
  },
  door: {
    flex: 1,
    gap: 6,
    padding: tokens.space[3],
    borderRadius: tokens.radius.lg,
    borderWidth: 1.5,
    backgroundColor: tokens.bg.surface,
  },
  doorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Top-right corner, level with the icon: the "8/10" belongs to the
  // button that spends the slot.
  badge: {
    position: 'absolute',
    top: tokens.space[3],
    right: tokens.space[3],
  },
  doorTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    lineHeight: 20,
    color: tokens.text.hi,
  },
  doorDesc: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: tokens.text.mid,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
    paddingHorizontal: tokens.space[3],
    marginHorizontal: tokens.space[4],
    marginTop: tokens.space[2],
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  backText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: tokens.brand.violet2,
  },
  backCount: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: tokens.text.mid,
  },
});
