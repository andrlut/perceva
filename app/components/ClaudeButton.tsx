import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  buildClaudeUrl,
  openClaude,
  resolveClaudeTarget,
  type ClaudeButtonKey,
} from '@/lib/claudeBridge';
import { useT } from '@/lib/i18n';
import { useLoadedSettings } from '@/lib/settings';
import { tokens } from '@/theme';

/**
 * The AI door of a screen — one icon, for whoever set up the Perceva
 * connector on their Claude account (Ajustes › Conector › Atalho no app).
 *
 * Renders NOTHING until the shortcut setting is on: this is a power-user
 * bridge, not a product feature, so the default app never shows a button
 * that opens another app. A tap resolves this button's destination (its own
 * or the default — lib/claudeBridge), builds the link with `prompt` and
 * hands it to Android; whatever happens next happens in the Claude app, and
 * the connector does the reading or writing.
 *
 * Icon only, on purpose: the labelled version was the biggest thing on the
 * card. The glyph is the generic AI sparkle, not Anthropic's mark — a
 * third-party app has no licence to Claude's logo; `a11yLabel` still says
 * where it goes and why.
 *
 * Three sizes for three hosts:
 *   - `icon`: the 32dp chip in a card header, beside "Editar";
 *   - `square`: 52dp, the same height as the evening sheet's big button;
 *   - `bare`: a plain 36dp header icon on a full screen.
 *
 * `onBeforeOpen` lets a host sheet close itself before the app switch.
 */
export function ClaudeButton({
  buttonKey,
  prompt,
  a11yLabel,
  variant = 'icon',
  onBeforeOpen,
  style,
}: {
  buttonKey: ClaudeButtonKey;
  prompt: string;
  a11yLabel: string;
  variant?: 'icon' | 'square' | 'bare';
  onBeforeOpen?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useT();
  const settings = useLoadedSettings();
  if (!settings.claudeShortcut) return null;

  const press = async () => {
    onBeforeOpen?.();
    const ok = await openClaude(
      buildClaudeUrl(
        resolveClaudeTarget(settings, buttonKey),
        prompt,
        settings.claudePromptInLink,
      ),
    );
    if (!ok) Alert.alert(a11yLabel, t('mood.claudeOpenError'));
  };

  const size = variant === 'square' ? 22 : variant === 'bare' ? 20 : 16;
  const color = variant === 'bare' ? tokens.text.hi : tokens.brand.violet2;

  return (
    <Pressable
      onPress={press}
      hitSlop={variant === 'square' ? 0 : 8}
      style={({ pressed }) => [styles[variant], style, pressed && { opacity: 0.6 }]}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
    >
      <Ionicons name="sparkles-outline" size={size} color={color} />
    </Pressable>
  );
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
