import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { LearningIdeaPublic } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { ideaImageUriFromPath } from '@/lib/ideas';
import { tokens } from '@/theme';
import { DIMENSION_META } from '@/theme/dimensions';

/**
 * "Minhas ideias" strip — the single entry to the collection, at the top of
 * the Learn tab between the Continue card and the carousels. A glass row:
 * albums icon, title + "N ideias absorvidas", a fanned stack of the most
 * recently released absorbed ideas (up to 4 tiny 4:5 thumbs, framed in
 * their dimension color) and a chevron. Hidden by the parent (and by its own
 * guard) until the user has absorbed at least one idea.
 */

interface Props {
  /** Total absorbed ideas; the strip renders nothing below 1. */
  count: number;
  /** Absorbed ideas, newest release first — at most 4 become thumbs. */
  recent: LearningIdeaPublic[];
  onPress: () => void;
}

const MAX_THUMBS = 4;

export function MyIdeasStrip({ count, recent, onPress }: Props) {
  const { t } = useT();
  if (count < 1) return null;

  const thumbs = recent.slice(0, MAX_THUMBS);
  const subtitle = t('learning.ideas.myIdeasCount', { count });

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel={`${t('learning.ideas.myIdeas')} · ${subtitle}`}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="albums" size={16} color={tokens.semantic.coinLight} />
        </View>

        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={1}>
            {t('learning.ideas.myIdeas')}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        {thumbs.length > 0 && (
          <View style={styles.thumbRow}>
            {thumbs.map((row, i) => {
              const dim = DIMENSION_META[row.dimension_id];
              const uri = ideaImageUriFromPath(row.image_path);
              return (
                <View
                  key={`${row.material_id}:${row.idea_id}`}
                  style={[
                    styles.thumbFrame,
                    {
                      borderColor: dim.color,
                      marginLeft: i === 0 ? 0 : -10,
                      zIndex: MAX_THUMBS - i,
                    },
                  ]}
                >
                  {uri ? (
                    <Image
                      source={uri}
                      style={styles.thumb}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      recyclingKey={uri}
                      transition={120}
                    />
                  ) : (
                    // Dimension-tinted square when the idea has no image.
                    <View style={[styles.thumb, { backgroundColor: dim.bg }]} />
                  )}
                </View>
              );
            })}
          </View>
        )}

        <Ionicons name="chevron-forward" size={18} color={tokens.text.dim} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: tokens.space[4],
    marginBottom: tokens.space[3],
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    paddingVertical: tokens.space[3] - 2,
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.bg.glass,
    borderWidth: 1,
    borderColor: tokens.border.strong,
  },
  pressed: {
    opacity: 0.85,
  },
  /** Gold-tinted disc — the collection is the gold-rim vocabulary. */
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: tokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 200, 61, 0.14)',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: tokens.text.hi,
  },
  subtitle: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: tokens.text.mid,
    marginTop: 1,
  },
  thumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  /** 36×45 — the same 4:5 as the cards themselves. */
  thumbFrame: {
    width: 36,
    height: 45,
    borderRadius: tokens.radius.xs,
    borderWidth: 1.5,
    overflow: 'hidden',
    backgroundColor: tokens.bg.deep,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
});
