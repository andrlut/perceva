import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useT } from '@/lib/i18n';
import type { ReelGroup } from '@/lib/reels';
import { tokens } from '@/theme';

/**
 * The single Study Reels entry point — a full-width card at the top of the
 * Learning tab (the "story ring" slot users know from Instagram). Shows a
 * fanned stack of the next materials' art with a count of what's fresh;
 * flips to a calm "all caught up · replay" state when the unread pile is
 * empty. Hidden entirely by the parent when the deck is empty.
 */

interface Props {
  groups: ReelGroup[];
  unreadCount: number;
  onPress: () => void;
}

export function ReelsEntryCard({ groups, unreadCount, onPress }: Props) {
  const { t } = useT();
  const thumbs = groups.slice(0, 3);

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={t('learning.reels.entry')}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      >
        <View style={styles.thumbRow}>
          {thumbs.map((g, i) => (
            <View
              key={g.key}
              style={[
                styles.thumbFrame,
                { borderColor: g.accent, marginLeft: i === 0 ? 0 : -14, zIndex: 3 - i },
              ]}
            >
              <Image
                source={{ uri: g.cards[0]!.uri }}
                style={styles.thumb}
                contentFit="cover"
                transition={150}
                cachePolicy="memory-disk"
              />
            </View>
          ))}
        </View>

        <View style={styles.textCol}>
          <Text style={styles.title}>{t('learning.reels.entry')}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {unreadCount > 0
              ? t('learning.reels.entrySubtitle', { count: unreadCount })
              : t('learning.reels.entryCaughtUp')}
          </Text>
        </View>

        <View style={styles.playChip}>
          <Ionicons name="play" size={16} color="#3D2A00" />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[3],
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    padding: tokens.space[3],
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
    width: 38,
    height: 58,
    borderRadius: tokens.radius.sm,
    borderWidth: 1.5,
    overflow: 'hidden',
    backgroundColor: tokens.bg.deep,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  textCol: {
    flex: 1,
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
  playChip: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.semantic.coin,
  },
});
