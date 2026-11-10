import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAiAccess } from '@/lib/api/ai';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/**
 * The door into "Conte seu dia" (/day-voice), inside today's mood card —
 * the "close the day" ritual is where telling the day belongs. Drawn as a
 * text field so it reads as "the place to talk"; tapping opens the screen
 * with the field focused (the keyboard's own microphone is right there).
 *
 * Renders nothing unless this account has the AI (ai_access: on/off +
 * allowlist, server-only) — so nobody outside the allowlist sees a dead box.
 */
export function DayVoiceEntry() {
  const { t } = useT();
  const router = useRouter();
  const access = useAiAccess();

  if (!access.data?.enabled) return null;

  return (
    <Pressable
      onPress={() => router.push('/day-voice')}
      style={({ pressed }) => [styles.field, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityLabel={t('dayVoice.entryA11y')}
    >
      <View style={styles.mic}>
        <Ionicons name="mic" size={15} color="#FFFFFF" />
      </View>
      <Text style={styles.text} numberOfLines={1}>
        {t('dayVoice.entry')}
      </Text>
      <Ionicons name="sparkles-outline" size={15} color={tokens.brand.violet2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
    height: 44,
    paddingLeft: 6,
    paddingRight: tokens.space[3],
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  mic: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.brand.violet,
  },
  text: {
    flex: 1,
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    color: tokens.text.dim,
  },
});
