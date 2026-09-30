import type { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ClaudeDictateButton } from '@/components/mood/ClaudeDictateButton';
import { FullCheckinButton } from '@/components/mood/FullCheckinButton';
import { tokens } from '@/theme';

/**
 * The buttons under a mood card: the door into the full check-in and, right
 * beside it, the "Claude" door (ClaudeDictateButton) — which is absent
 * until the shortcut is on, leaving the check-in button alone and full
 * width, exactly as before.
 *
 * Wherever the owner can tap to fill or edit a day, the AI option sits in
 * the same row, not elsewhere on the card. The row wraps: on a wide phone
 * both share one line (the check-in button grows, Claude keeps its natural
 * width); on a narrow one they stack, each full width, instead of squeezing
 * a label into two lines.
 *
 * `dateKey` scopes the Claude prompt to a past day (see the button).
 */
export function MoodActionsRow({
  icon,
  label,
  onPress,
  dateKey,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  dateKey?: string;
}) {
  return (
    <View style={styles.row}>
      <FullCheckinButton
        icon={icon}
        label={label}
        onPress={onPress}
        style={styles.primary}
      />
      <ClaudeDictateButton variant="side" dateKey={dateKey} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.space[2],
  },
  // 190 + gap + the ~100dp Claude button fits the 304dp a 360dp phone leaves
  // inside the card; anything narrower wraps rather than squeezes.
  primary: {
    flexGrow: 1,
    flexBasis: 190,
  },
});
