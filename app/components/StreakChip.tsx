import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { tokens } from '@/theme';

interface Props {
  days: number;
  doneToday: boolean;
}

export function StreakChip({ days, doneToday }: Props) {
  const isDormant = days === 0;
  const flameColor = isDormant
    ? tokens.text.dim
    : doneToday
    ? tokens.semantic.warn
    : tokens.semantic.coin;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDormant
            ? tokens.bg.surface
            : 'rgba(255, 159, 67, 0.1)',
          borderColor: isDormant ? tokens.border.base : 'rgba(255, 159, 67, 0.25)',
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: 'rgba(255, 159, 67, 0.18)' }]}>
        <Ionicons name="flame" size={20} color={flameColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>
          {isDormant ? 'No streak yet' : `${days}-day streak`}
        </Text>
        <Text style={styles.sub}>
          {isDormant
            ? 'Complete a daily quest to start one.'
            : doneToday
            ? 'Today is locked in. Keep going.'
            : 'Complete a daily quest to keep it alive.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    padding: tokens.space[3],
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...tokens.type.body,
    color: tokens.text.hi,
    fontFamily: 'Manrope_800ExtraBold',
  },
  sub: {
    ...tokens.type.caption,
    color: tokens.text.mid,
    marginTop: 2,
  },
});
