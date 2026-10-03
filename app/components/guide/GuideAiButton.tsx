import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { claudeNewChatUrl, openClaude } from '@/lib/claudeBridge';
import { useT } from '@/lib/i18n';
import { useLoadedSettings } from '@/lib/settings';
import { tokens } from '@/theme';

/**
 * The AI door of a screen's guide — the FIRST thing in the (i) sheet, under
 * its title, outside the scroll so it never scrolls away.
 *
 * It never hides. With the AI buttons on (Ajustes › Conector), it is violet
 * and opens a new Claude chat carrying `prompt` — a guide question is
 * one-off and needs its prompt, and a project link cannot carry one, so it
 * ignores the saved destinations. With them off, it is grey and takes the
 * person to the switch (`/conector?focus=atalhos` scrolls to and lights up
 * the "Acessos rápidos" card): the grey button is the invitation to turn the
 * AI on, not a dead control. Either way it closes the sheet first
 * (`onLeave`), so coming back lands on the screen, not on a stale sheet.
 */
export function GuideAiButton({
  prompt,
  onLeave,
}: {
  prompt: string;
  onLeave: () => void;
}) {
  const { t } = useT();
  const router = useRouter();
  const settings = useLoadedSettings();
  const on = settings.claudeShortcut;

  const title = t('guide.aiTitle');
  const sub = on ? t('guide.aiOn') : t('guide.aiOff');

  const press = async () => {
    onLeave();
    if (!on) {
      router.push({ pathname: '/conector', params: { focus: 'atalhos' } });
      return;
    }
    const ok = await openClaude(claudeNewChatUrl(prompt));
    if (!ok) Alert.alert(title, t('mood.claudeOpenError'));
  };

  return (
    <Pressable
      onPress={press}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${sub}`}
      style={({ pressed }) => [
        styles.btn,
        on ? styles.btnOn : styles.btnOff,
        pressed && { opacity: 0.8 },
      ]}
    >
      <View style={[styles.icon, on ? styles.iconOn : styles.iconOff]}>
        <Ionicons
          name="sparkles"
          size={18}
          color={on ? tokens.text.hi : tokens.text.mid}
        />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, !on && styles.titleOff]}>{title}</Text>
        <Text style={styles.sub} numberOfLines={2}>
          {sub}
        </Text>
      </View>
      <Ionicons
        name={on ? 'open-outline' : 'settings-outline'}
        size={17}
        color={on ? tokens.brand.violet2 : tokens.text.mid}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    paddingHorizontal: tokens.space[3],
    paddingVertical: 10,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
  },
  // On: the violet wash of the app's "this is the special door" surfaces
  // (the review strip, the step badges).
  btnOn: {
    backgroundColor: 'rgba(123, 92, 255, 0.14)',
    borderColor: 'rgba(155, 130, 255, 0.55)',
  },
  // Off: grey, but every text stays readable (text.base / text.mid) — it is
  // an invitation, and a faded button reads as broken.
  btnOff: {
    backgroundColor: tokens.bg.surface2,
    borderColor: tokens.border.base,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOn: { backgroundColor: tokens.brand.violet },
  iconOff: {
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  body: { flex: 1, minWidth: 0, gap: 2 },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: tokens.text.hi,
  },
  titleOff: { color: tokens.text.base },
  sub: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: tokens.text.mid,
  },
});
