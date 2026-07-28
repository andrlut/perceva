import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

interface Props {
  /** XP earned on the day. 0 renders quiet/grey; > 0 renders glowing green. */
  xp: number;
  /** Picks the a11y wording ("today" vs "on this day"). */
  isToday: boolean;
}

/**
 * Standalone "XP earned this day" stat — a flash glyph + big +N XP on one
 * borderless line. Green with a glow when > 0; a quiet grey "+0" otherwise
 * (a fresh day reads calm, then lights up on the first completion). Shared
 * by the Home day-view header and the History day detail so the two read
 * identically.
 */
export function DayXpStat({ xp, isToday }: Props) {
  const { t } = useT();
  const zero = xp === 0;
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${xp} XP ${
        isToday ? t('home.xpHero.today') : t('home.xpHero.thatDay')
      }`}
    >
      <Ionicons
        name="flash"
        size={20}
        color={zero ? tokens.text.dim : tokens.semantic.xp}
        style={{ marginBottom: 3 }}
      />
      <Text style={[styles.num, zero && styles.zero]}>+{xp}</Text>
      <Text style={[styles.unit, zero && styles.zero]}>XP</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  num: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 30,
    lineHeight: 32,
    color: tokens.semantic.xp,
    letterSpacing: -0.5,
    textShadowColor: tokens.semantic.xpGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  unit: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    color: tokens.semantic.xp,
    marginLeft: 1,
    marginBottom: 4,
  },
  zero: {
    color: tokens.text.dim,
    textShadowColor: 'transparent',
    textShadowRadius: 0,
  },
});
