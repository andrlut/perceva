import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { claudeNewChatUrl, openClaude } from '@/lib/claudeBridge';
import { useT } from '@/lib/i18n';
import { useLoadedSettings } from '@/lib/settings';
import { tokens } from '@/theme';

/**
 * The AI door of a screen's guide, in two shapes with one behavior:
 *
 *   - GuideAiIcon: a 32px circle fixed in the sheet's header, beside the
 *     close X — always in reach, never in the way;
 *   - GuideAiButton: the full block, the LAST thing in the guide's scroll.
 *
 * Last on purpose (owner, 2026-10-03): the guide's own playground teaches
 * the screen better than the AI does, so the sheet leads with it and leaves
 * the AI as the "still unsure?" ending; the header circle is there for
 * whoever wants it right away.
 *
 * Neither ever hides. With the AI buttons on (Ajustes › Conector), they are
 * violet and open a new Claude chat carrying `prompt` — a guide question is
 * one-off and needs its prompt, and a project link cannot carry one, so it
 * ignores the saved destinations. With them off, they are grey and take the
 * person to the switch (`/conector?focus=atalhos` scrolls to and lights up
 * the "Acessos rápidos" card): grey is the invitation to turn the AI on,
 * not a dead control. Either way the sheet closes first (`onLeave`), so
 * coming back lands on the screen, not on a stale sheet.
 */
function useGuideAi(prompt: string, onLeave: () => void) {
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

  return { on, title, sub, press };
}

/** The full block — the guide's last section. */
export function GuideAiButton({
  prompt,
  onLeave,
}: {
  prompt: string;
  onLeave: () => void;
}) {
  const { on, title, sub, press } = useGuideAi(prompt, onLeave);
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

/**
 * The header circle — the close button's sibling, same size. Its outer
 * hit area stops short of the X's (the X's inner side does the same), so a
 * tap between the two never lands on the wrong one.
 */
export function GuideAiIcon({
  prompt,
  onLeave,
}: {
  prompt: string;
  onLeave: () => void;
}) {
  const { on, title, sub, press } = useGuideAi(prompt, onLeave);
  return (
    <Pressable
      onPress={press}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 4 }}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${sub}`}
      style={({ pressed }) => [
        styles.circle,
        on ? styles.circleOn : styles.circleOff,
        pressed && { opacity: 0.6 },
      ]}
    >
      <Ionicons
        name="sparkles"
        size={16}
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

  // Same 32px circle as the InfoSheet's close button.
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleOn: {
    backgroundColor: 'rgba(123, 92, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(155, 130, 255, 0.55)',
  },
  circleOff: { backgroundColor: 'rgba(255,255,255,0.04)' },
});
