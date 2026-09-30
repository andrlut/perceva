import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { todayDateKey } from '@/lib/api/mood';
import { buildClaudeCheckinUrl, openClaude } from '@/lib/claudeBridge';
import { useT } from '@/lib/i18n';
import { useLoadedSettings } from '@/lib/settings';
import { tokens } from '@/theme';

/**
 * The AI door of the mood system — one icon, for whoever set up the Perceva
 * connector on their Claude account (Ajustes › Conector › Atalho no app).
 *
 * Renders NOTHING until the shortcut setting is on: this is a power-user
 * bridge, not a product feature, so the default app never shows a button
 * that opens another app. A tap builds the link off the saved target
 * (project / chat / new chat with the prompt prefilled — lib/claudeBridge)
 * and hands it to Android; the dictation itself happens inside the Claude
 * app, and the connector's log_mood does the writing.
 *
 * Icon only, on purpose: the labelled version was the biggest thing on the
 * card. The glyph is the generic AI sparkle, not Anthropic's mark — a
 * third-party app has no licence to Claude's logo; the accessible name still
 * says where it goes.
 *
 * Three sizes for three hosts:
 *   - `icon`: the 32dp pill in a card header, beside "Editar" (MoodCardHeader);
 *   - `square`: 52dp, the same height as the evening sheet's big button;
 *   - `bare`: a plain 36dp header icon on the check-in screen.
 *
 * `dateKey` for a past day puts that date into the new-chat prompt so
 * log_mood writes the right day. With a project/chat target there is no
 * prompt — the user names the day while dictating. `onBeforeOpen` lets a
 * host sheet close itself before the app switch.
 */
export function ClaudeDictateButton({
  variant = 'icon',
  dateKey,
  onBeforeOpen,
  style,
}: {
  variant?: 'icon' | 'square' | 'bare';
  dateKey?: string;
  onBeforeOpen?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { t, locale } = useT();
  const settings = useLoadedSettings();
  if (!settings.claudeShortcut) return null;

  const label = t('mood.cta.dictateClaude');
  const isPast = dateKey != null && dateKey !== todayDateKey();
  const prompt = isPast
    ? t('mood.claudePromptPast', { date: formatDay(dateKey, locale) })
    : t('mood.claudePrompt');

  const press = async () => {
    onBeforeOpen?.();
    const ok = await openClaude(
      buildClaudeCheckinUrl(settings.claudeTarget, prompt),
    );
    if (!ok) Alert.alert(label, t('mood.claudeOpenError'));
  };

  const size = variant === 'square' ? 22 : variant === 'bare' ? 20 : 16;
  const color = variant === 'bare' ? tokens.text.hi : tokens.brand.violet2;

  return (
    <Pressable
      onPress={press}
      hitSlop={variant === 'square' ? 0 : 8}
      style={({ pressed }) => [styles[variant], style, pressed && { opacity: 0.6 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name="sparkles-outline" size={size} color={color} />
    </Pressable>
  );
}

/** "terça-feira, 29 de setembro (2026-09-29)" — the words for the person,
 *  the ISO key for log_mood's `date`. */
function formatDay(dateKey: string, locale: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  const words = dt.toLocaleDateString(locale === 'en' ? 'en-US' : 'pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return `${words} (${dateKey})`;
}

const styles = StyleSheet.create({
  // Same quiet chip as the "Editar" pill it sits beside: surface2 fill,
  // base rim, the violet glyph is what says "action".
  icon: {
    width: 34,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  square: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: tokens.border.strong,
  },
  bare: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
