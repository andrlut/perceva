import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DimensionId, LearningIdea } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import type { IdeaLocale } from '@/lib/ideas';
import { formatDuration, ideaImageUri, localizedIdea, pickIdeaVideo } from '@/lib/ideas';
import { tokens } from '@/theme';
import { DIMENSION_META } from '@/theme/dimensions';

/**
 * One line of the idea list on the material screen:
 *
 *   ( n ) ▶  Você acorda descansado. Seu corpo, não.        Absorvida ›
 *   ( n ) ▶  Mesmos dados, dois vereditos opostos.               1:04 ›
 *   ( n ) ▷  Três fusos toda sexta, sem sair de casa.                 ›
 *
 * The number chip wears the dimension color; the glyph says what the idea
 * screen will open with (video / image / neither); the trailing text is
 * "Absorvida" in gold once collected, else the video length when there is
 * one. Tapping the row is the parent's job (`onPress`).
 */

export interface IdeaListRowProps {
  idea: LearningIdea;
  dimensionId: DimensionId;
  locale: IdeaLocale;
  collected: boolean;
  onPress: () => void;
  /** Hides the bottom hairline (last row of a grouped list). */
  last?: boolean;
  testID?: string;
}

type Glyph = 'play-circle' | 'image-outline' | 'ellipse-outline';

export const IdeaListRow = memo(function IdeaListRow({
  idea,
  dimensionId,
  locale,
  collected,
  onPress,
  last = false,
  testID,
}: IdeaListRowProps) {
  const { t } = useT();
  const dim = DIMENSION_META[dimensionId];

  const { title } = localizedIdea(idea, locale);
  const video = pickIdeaVideo(idea, locale);
  const hasImage = ideaImageUri(idea) != null;

  const glyph: Glyph = video ? 'play-circle' : hasImage ? 'image-outline' : 'ellipse-outline';
  const trailing = collected
    ? t('learning.ideas.absorbed')
    : video
      ? formatDuration(video.video.duration_seconds)
      : null;

  const a11yLabel = [`${idea.ordinal}. ${title}`, trailing].filter(Boolean).join(', ');

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ selected: collected }}
      style={({ pressed }) => [styles.row, !last && styles.rowDivider, pressed && styles.pressed]}
    >
      <View style={[styles.numChip, { backgroundColor: dim.bg }]}>
        <Text style={[styles.numText, { color: dim.color }]}>{idea.ordinal}</Text>
      </View>

      <Ionicons
        name={glyph}
        size={18}
        color={video ? dim.color : tokens.text.dim}
        style={styles.glyph}
      />

      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>

      {trailing != null && (
        <Text
          style={[styles.trailing, collected && styles.trailingCollected]}
          numberOfLines={1}
        >
          {trailing}
        </Text>
      )}

      <Ionicons name="chevron-forward" size={16} color={tokens.text.dim} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.border.base,
  },
  pressed: {
    opacity: 0.7,
  },
  numChip: {
    width: 26,
    height: 26,
    borderRadius: tokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
  },
  glyph: {
    marginRight: -2,
  },
  title: {
    flex: 1,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    lineHeight: 19,
    color: tokens.text.base,
  },
  trailing: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: tokens.text.dim,
    maxWidth: 96,
  },
  trailingCollected: {
    color: tokens.semantic.coin,
  },
});
