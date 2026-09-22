import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { StyleProp, TextStyle } from 'react-native';

import { resolveIcon } from '@/lib/icons';

interface Props {
  /** Stored icon id — bare Ionicons name or `mdi:<glyph>`. Null/unknown
   *  draws the neutral fallback. */
  name: string | null | undefined;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

/**
 * The one way to draw a USER-CHOSEN icon (task, reward, skill). Resolves
 * the family from the id, so every card, chip, calendar cell and modal
 * renders `mdi:` ids the same way — and a stale or mistyped id shows a
 * quiet placeholder instead of nothing.
 *
 * Fixed UI glyphs (chevrons, tabs, the sub/dimension meta icons) keep
 * using `<Ionicons>` directly; this is only for the free-text `icon` fields.
 */
export function AppIcon({ name, size = 20, color, style }: Props) {
  const { family, glyph } = resolveIcon(name);
  if (family === 'mdi') {
    return (
      <MaterialCommunityIcons name={glyph as never} size={size} color={color} style={style} />
    );
  }
  return <Ionicons name={glyph as never} size={size} color={color} style={style} />;
}
