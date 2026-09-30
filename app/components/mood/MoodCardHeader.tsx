import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ClaudeDictateButton } from '@/components/mood/ClaudeDictateButton';
import { tokens } from '@/theme';

/**
 * The header row of a mood card: the eyebrow on the left, the actions on the
 * right — a short "Editar" / "Preencher" chip into the full check-in and,
 * when the owner switched it on, the AI chip beside it.
 *
 * Shared by the Home's today strip (MoodHubStrip) and the any-day card
 * (MoodDayDetail — past days on the Home, every day in the calendar), so the
 * two doors sit in the same place on every day.
 *
 * Why chips and not the old 52dp full-width button: the button was the
 * biggest thing on the card and its label spilled; the owner asked for a
 * short word and the little icon, well placed. 32dp with 8dp of hit slop is
 * a real target, unlike the 12px text link that started all this.
 *
 * `action` is the visible word; `a11yLabel` is the full sentence TalkBack
 * reads ("Registrar com tags e nota"). `dateKey` scopes the AI prompt to a
 * past day.
 */
export function MoodCardHeader({
  eyebrow,
  action,
  a11yLabel,
  onPress,
  dateKey,
}: {
  eyebrow: string;
  action: string;
  a11yLabel: string;
  onPress: () => void;
  dateKey?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.eyebrow} numberOfLines={1}>
        {eyebrow}
      </Text>
      <View style={styles.actions}>
        <Pressable
          onPress={onPress}
          hitSlop={8}
          style={({ pressed }) => [styles.chip, pressed && { opacity: 0.6 }]}
          accessibilityRole="button"
          accessibilityLabel={a11yLabel}
        >
          <Ionicons name="create-outline" size={14} color={tokens.brand.violet2} />
          <Text style={styles.chipText}>{action}</Text>
        </Pressable>
        <ClaudeDictateButton variant="icon" dateKey={dateKey} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.space[2],
  },
  eyebrow: {
    flexShrink: 1,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: tokens.text.dim,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // violet2 on surface2: 4.60:1 dark / 5.81:1 light — AA for 12px bold.
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  chipText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    letterSpacing: 0.2,
    color: tokens.brand.violet2,
  },
});
