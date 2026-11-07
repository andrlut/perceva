import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/** The disclosure's floor: never smaller than the eyebrow (11/13). */
const MIN_SIZE = tokens.type.eyebrow.fontSize;
const LINE_RATIO = tokens.type.eyebrow.lineHeight / tokens.type.eyebrow.fontSize;

interface Props {
  /** Partner name (`sponsorOf(row).name`). */
  name: string;
  /** Font size; clamped to the eyebrow's 11 at minimum. */
  size?: number;
  /** Text + ribbon colour. Defaults to `semantic.coinLight`; IdeaCard's
   *  front passes its own pale gold, since that face is dark in both
   *  themes. */
  color?: string;
  numberOfLines?: number;
  /** `center` for the reels column; `start` everywhere else. */
  align?: 'start' | 'center';
  /** Text shadow for lines laid over an image. */
  shadow?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * The Recanto's partner mark — ribbon + "Patrocinado · {name}"
 * (`learning.sponsorWith`) in gold small caps. ONE component for every
 * surface sponsored content reaches (cover caption, material screens, idea
 * screen header, idea card front, Explorar reels), so the disclosure keeps
 * one anatomy and never drops below a legible size.
 */
export const SponsorLine = memo(function SponsorLine({
  name,
  size = MIN_SIZE,
  color = tokens.semantic.coinLight,
  numberOfLines = 1,
  align = 'start',
  shadow = false,
  style,
}: Props) {
  const { t } = useT();
  const fontSize = Math.max(MIN_SIZE, size);
  const lineHeight = Math.round(fontSize * LINE_RATIO);
  const iconSize = fontSize + 1;
  return (
    <View style={[styles.row, align === 'center' && styles.rowCenter, style]}>
      <Ionicons
        name="ribbon"
        size={iconSize}
        color={color}
        style={[{ marginTop: Math.max(0, (lineHeight - iconSize) / 2) }, shadow && styles.shadow]}
      />
      <Text
        style={[
          styles.text,
          { fontSize, lineHeight, color },
          align === 'center' && styles.textCenter,
          shadow && styles.shadow,
        ]}
        numberOfLines={numberOfLines}
      >
        {t('learning.sponsorWith', { name })}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  // flex-start + the icon's computed top margin keeps the ribbon on the
  // first line when the name wraps to a second.
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
  },
  rowCenter: {
    justifyContent: 'center',
  },
  text: {
    ...tokens.type.eyebrow,
    flexShrink: 1,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  textCenter: {
    textAlign: 'center',
  },
  shadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
