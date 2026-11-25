import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useAiAccess } from '@/lib/api/ai';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/**
 * The door into "Conte seu dia" (/day-voice). Lives in today's mood card on
 * the Home and on top of the mood check-in — marking the mood is where
 * telling the day belongs (owner, 2026-11-25: "embutido no botão de marcar o
 * humor"). Opens with `?autostart=1`, so with the native mic the phone is
 * already listening when the screen appears; after Registrar the person
 * lands back where they came from, with everything filled in to adjust.
 *
 * ONE switch turns it on: "Conte seu dia com IA" in Ajustes › Sua IA, which
 * is the AI consent. Renders only when the server has the AI for this
 * account (ai_access.enabled: kill-switch, Premium / allowlist) AND that
 * consent is on — so switching it on makes the door appear, switching it off
 * makes it go. (A separate module switch in Ajustes › Módulos, 2026-11-25,
 * had the same name and left the owner with the consent on and no door.)
 */
export function DayVoiceEntry({ style }: { style?: StyleProp<ViewStyle> }) {
  const { t } = useT();
  const router = useRouter();
  const access = useAiAccess();

  if (!access.data?.enabled || access.data.consent !== true) return null;

  return (
    <Pressable
      onPress={() => router.push('/day-voice?autostart=1')}
      style={({ pressed }) => [styles.field, style, pressed && { opacity: 0.75 }]}
      accessibilityRole="button"
      accessibilityLabel={t('dayVoice.entryA11y')}
    >
      <View style={styles.mic}>
        <Ionicons name="mic" size={18} color="#FFFFFF" />
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {t('dayVoice.entry')}
        </Text>
        <Text style={styles.hint} numberOfLines={1}>
          {t('dayVoice.entryHint')}
        </Text>
      </View>
      <Ionicons name="sparkles" size={16} color={tokens.brand.violet2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    minHeight: 60,
    paddingVertical: tokens.space[2],
    paddingLeft: tokens.space[2],
    paddingRight: tokens.space[3],
    borderRadius: tokens.radius.md,
    backgroundColor: 'rgba(123, 92, 255, 0.12)',
    borderWidth: 1,
    borderColor: tokens.brand.violetGlow,
  },
  mic: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.brand.violet,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: tokens.text.hi,
  },
  hint: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12.5,
    color: tokens.text.mid,
  },
});
