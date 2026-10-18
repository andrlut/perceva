import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { TourTarget } from '@/components/tour/TourTarget';
import { useT } from '@/lib/i18n';
import { groupPreviewUri, type ReelGroup } from '@/lib/reels';
import { tokens } from '@/theme';
import { DIMENSION_META } from '@/theme/dimensions';

/**
 * The single Study Reels entry point — a compact card at the top of the
 * Learning tab (the "story ring" slot users know from Instagram), sharing
 * its row with the "Treinar" tile when the reader has favorites. Shows a
 * fanned stack of the next groups' art — legacy story cards and idea
 * illustrations alike (an idea without an image yet gets a tile in its
 * dimension color) — with a count of what's fresh: unread materials plus
 * ideas not yet absorbed. Flips to a calm "all caught up" state when that
 * pile is empty. Hidden entirely by the parent when the deck is empty.
 *
 * Kept small on purpose: the tab is about the materials below, and the
 * entry cards must not eat the first screen. The row's padding lives in the
 * parent, so the two tiles share one gutter.
 */

interface Props {
  groups: ReelGroup[];
  unreadCount: number;
  onPress: () => void;
  /** Tour spotlight id for the card itself (inside the screen padding). */
  tourTargetId?: string;
  style?: StyleProp<ViewStyle>;
}

export function ReelsEntryCard({ groups, unreadCount, onPress, tourTargetId, style }: Props) {
  const { t } = useT();
  const thumbs = groups.slice(0, 3);

  return (
    <View style={style}>
      <TourTarget id={tourTargetId ?? 'reels.entry'} radius={tokens.radius.lg}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={t('learning.reels.entry')}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      >
        <View style={styles.thumbRow}>
          {thumbs.map((g, i) => {
            const uri = groupPreviewUri(g);
            return (
              <View
                key={g.key}
                style={[
                  styles.thumbFrame,
                  { borderColor: g.accent, marginLeft: i === 0 ? 0 : -12, zIndex: 3 - i },
                ]}
              >
                {uri ? (
                  <Image
                    source={{ uri }}
                    style={styles.thumb}
                    contentFit="cover"
                    transition={150}
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <View style={[styles.thumb, styles.thumbTile, { backgroundColor: g.accent + '2E' }]}>
                    <Ionicons
                      name={DIMENSION_META[g.dimensionId].iconName as keyof typeof Ionicons.glyphMap}
                      size={14}
                      color={g.accent}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={1}>
            {t('learning.reels.entry')}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {unreadCount > 0
              ? t('learning.reels.entrySubtitle', { count: unreadCount })
              : t('learning.reels.entryCaughtUpShort')}
          </Text>
        </View>
      </Pressable>
      </TourTarget>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    paddingVertical: tokens.space[2],
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.bg.glass,
    borderWidth: 1,
    borderColor: tokens.semantic.coinRim,
  },
  thumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbFrame: {
    width: 28,
    height: 42,
    borderRadius: tokens.radius.sm,
    borderWidth: 1.5,
    overflow: 'hidden',
    backgroundColor: tokens.bg.deep,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbTile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: tokens.text.hi,
  },
  subtitle: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: tokens.text.mid,
    marginTop: 1,
  },
});
