import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

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
 * Two shapes. `pill` (default) sits beside the eyebrow of the Home mood card
 * and under the question on the check-in screen — one more door, never the
 * main one. `row` is the full-width secondary button of the evening sheet,
 * matching its "Registrar com tags e nota". `onBeforeOpen` lets a host sheet
 * close itself before the app switch.
 */
export function ClaudeDictateButton({
  variant = 'pill',
  onBeforeOpen,
  style,
}: {
  variant?: 'pill' | 'row';
  onBeforeOpen?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useT();
  const settings = useLoadedSettings();
  if (!settings.claudeShortcut) return null;

  const label = t('mood.cta.dictateClaude');
  const press = async () => {
    onBeforeOpen?.();
    const url = buildClaudeCheckinUrl(
      settings.claudeTarget,
      t('mood.claudePrompt'),
    );
    const ok = await openClaude(url);
    if (!ok) Alert.alert(label, t('mood.claudeOpenError'));
  };

  const row = variant === 'row';
  return (
    <Pressable
      onPress={press}
      hitSlop={row ? 0 : 6}
      style={({ pressed }) => [
        row ? styles.row : styles.pill,
        style,
        pressed && { opacity: 0.7 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons
        name="mic-outline"
        size={row ? 18 : 15}
        color={tokens.brand.violet2}
      />
      <Text style={row ? styles.rowText : styles.pillText}>{label}</Text>
    </Pressable>
  );
}

// violet2 on surface2 is the same pairing as FullCheckinButton (4.60:1 dark,
// 5.81:1 light) — AA for the 13px bold label of the pill and the 14px row.
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
});
