import { type StyleProp, type ViewStyle } from 'react-native';

import { ClaudeButton } from '@/components/ClaudeButton';
import { todayDateKey } from '@/lib/api/mood';
import { useT } from '@/lib/i18n';

/**
 * The mood system's AI door: the `mood` button of the bridge (ClaudeButton),
 * with the check-in prompt. Hosts: the card header on the Home and on any
 * day, the evening sheet (square) and the check-in screen (bare).
 *
 * `dateKey` for a past day puts that date into the prompt so log_mood writes
 * the right day. With a project/chat destination and the prompt not in the
 * link, there is no prompt — the user names the day while dictating.
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
  const isPast = dateKey != null && dateKey !== todayDateKey();
  const prompt = isPast
    ? t('mood.claudePromptPast', { date: formatDay(dateKey, locale) })
    : t('mood.claudePrompt');

  return (
    <ClaudeButton
      buttonKey="mood"
      prompt={prompt}
      a11yLabel={t('mood.cta.dictateClaude')}
      variant={variant}
      onBeforeOpen={onBeforeOpen}
      style={style}
    />
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
