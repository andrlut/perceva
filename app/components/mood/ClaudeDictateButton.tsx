import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { todayDateKey } from '@/lib/api/mood';
import { buildClaudeCheckinUrl, openClaude } from '@/lib/claudeBridge';
import { useT } from '@/lib/i18n';
import { useLoadedSettings } from '@/lib/settings';
import { tokens } from '@/theme';

/**
 * "Ditar no Claude" — the voice door of the mood system, for whoever set up
 * the Perceva connector on their Claude account (Ajustes › Conector › Atalho
 * no app).
 *
 * Renders NOTHING until the shortcut setting is on: this is a power-user
 * bridge, not a product feature, so the default app never shows a button
 * that opens another app. A tap builds the link off the saved target
 * (project / chat / new chat with the prompt prefilled — lib/claudeBridge)
 * and hands it to Android; the dictation itself happens inside the Claude
 * app, and the connector's log_mood does the writing.
 *
 * Three shapes:
 *   - `side`: compact "Claude" beside the check-in button (MoodActionsRow) —
 *     wherever a day can be filled or edited, the AI option is in that row;
 *   - `row`: full-width secondary button of the evening sheet;
 *   - `pill`: the small one under the question on the check-in screen.
 *
 * `dateKey` for a past day puts that date into the new-chat prompt so
 * log_mood writes the right day. With a project/chat target there is no
 * prompt — the user names the day while dictating. `onBeforeOpen` lets a
 * host sheet close itself before the app switch.
 */
export function ClaudeDictateButton({
  variant = 'pill',
  dateKey,
  onBeforeOpen,
  style,
}: {
  variant?: 'pill' | 'row' | 'side';
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

  const box =
    variant === 'row' ? styles.row : variant === 'side' ? styles.side : styles.pill;
  const text =
    variant === 'row'
      ? styles.rowText
      : variant === 'side'
        ? styles.sideText
        : styles.pillText;

  return (
    <Pressable
      onPress={press}
      hitSlop={variant === 'pill' ? 6 : 0}
      style={({ pressed }) => [box, style, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons
        name="mic-outline"
        size={variant === 'pill' ? 15 : 18}
        color={tokens.brand.violet2}
      />
      <Text style={text}>
        {variant === 'side' ? t('mood.cta.dictateClaudeShort') : label}
      </Text>
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

// violet2 on surface2 is the same pairing as FullCheckinButton (4.60:1 dark,
// 5.81:1 light) — AA for every label size used here.
const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.brand.violet2,
    backgroundColor: tokens.bg.surface2,
  },
  pillText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    letterSpacing: 0.2,
    color: tokens.brand.violet2,
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.brand.violet2,
    backgroundColor: tokens.bg.surface2,
  },
  rowText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    letterSpacing: 0.2,
    color: tokens.brand.violet2,
  },
  // Same height and rim as the check-in button it sits beside, so the pair
  // reads as one control with two doors.
  side: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.brand.violet2,
    backgroundColor: tokens.bg.surface2,
  },
  sideText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    letterSpacing: 0.2,
    color: tokens.brand.violet2,
  },
});
