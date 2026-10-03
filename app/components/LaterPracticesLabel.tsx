import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/**
 * Header of the "created after this day" block in the past-day views (Home
 * on a past day, the calendar's day panel): practices that did not exist yet
 * on that day can still be logged on it, but they never count as open — a
 * practice created today must not reopen every past day the user closed.
 */
export function LaterPracticesLabel() {
  const { t } = useT();
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Ionicons name="time-outline" size={14} color={tokens.text.mid} />
        <Text style={styles.label}>{t('home.laterPractices.title')}</Text>
      </View>
      <Text style={styles.caption}>{t('home.laterPractices.caption')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 2,
    marginTop: tokens.space[3],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: tokens.text.mid,
  },
  caption: {
    ...tokens.type.caption,
    color: tokens.text.dim,
  },
});
