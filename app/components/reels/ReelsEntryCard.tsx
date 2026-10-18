import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ENTRY_TILE_ART_HEIGHT, EntryTile } from '@/components/learning/EntryTile';
import { useT } from '@/lib/i18n';
import { groupPreviewUri, type ReelGroup } from '@/lib/reels';
import { tokens } from '@/theme';
import { DIMENSION_META } from '@/theme/dimensions';

/**
 * The single Study Reels entry point — the "Explorar" tile at the top of the
 * Learning tab (the "story ring" slot users know from Instagram), sharing
 * its row and its EntryTile shell with "Treinar" when the reader has
 * favorites. Its art is a fanned stack of the next groups' art — legacy
 * story cards and idea illustrations alike (an idea without an image yet
 * gets a tile in its dimension color); its count is what's fresh: unread
 * materials plus ideas not yet absorbed, or a calm "all caught up". Hidden
 * entirely by the parent when the deck is empty.
 */

interface Props {
  groups: ReelGroup[];
  unreadCount: number;
  onPress: () => void;
  /** Tour spotlight id for the tile itself (inside the screen padding). */
  tourTargetId?: string;
  style?: StyleProp<ViewStyle>;
}

export function ReelsEntryCard({ groups, unreadCount, onPress, tourTargetId, style }: Props) {
  const { t } = useT();
  const thumbs = groups.slice(0, 3);

  return (
    <EntryTile
      art={
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
      }
      title={t('learning.reels.entry')}
      subtitle={
        unreadCount > 0
          ? t('learning.reels.entrySubtitle', { count: unreadCount })
          : t('learning.reels.entryCaughtUp')
      }
      a11yLabel={t('learning.reels.entry')}
      onPress={onPress}
      tourTargetId={tourTargetId ?? 'reels.entry'}
      style={style}
    />
  );
}

const styles = StyleSheet.create({
  thumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbFrame: {
    width: 28,
    height: ENTRY_TILE_ART_HEIGHT,
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
});
