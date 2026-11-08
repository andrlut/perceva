import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ENTRY_TILE_ART_HEIGHT, EntryTile } from '@/components/learning/EntryTile';
import type { LearningFeedCard } from '@/lib/api/learning';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';
import { DIMENSION_META, SUB_META } from '@/theme/dimensions';

/**
 * "Continue lendo" — the material the reader left halfway, one tap back in.
 * It sits right under the Explorar / Treinar row, so it wears the same
 * EntryTile chassis: the cover as a 2:3 thumbnail in the art slot, "Continue
 * lendo" as the title, the material's name as the one detail line and a
 * thin gold bar for how far along it is. Nothing else on purpose (owner,
 * 2026-11-07): the old hero — glyph vignette, "Próxima: …", meta row and a
 * play button — was twice its neighbours' height for the same one job.
 *
 * `percent` is absorbed/total ideas for materials with ideas, the scroll
 * watermark for legacy articles; the tab decides which. Without `onPress`
 * the card is inert (the guide's replica).
 */

interface Props {
  card: LearningFeedCard;
  /** 0..100 — drives the progress bar. */
  percent: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function ContinueLendoCard({ card, percent, onPress, style }: Props) {
  const { t, locale } = useT();
  const title = locale === 'pt' ? card.title_pt : card.title_en;
  const dimColor = DIMENSION_META[card.dimension_id].color;
  const primarySub = card.subs[0];
  const fallbackIcon = (
    primarySub && SUB_META[primarySub]
      ? SUB_META[primarySub].iconName
      : DIMENSION_META[card.dimension_id].iconName
  ) as keyof typeof Ionicons.glyphMap;

  return (
    <EntryTile
      art={
        <View style={[styles.thumb, { borderColor: dimColor }]}>
          {card.hero_image_url ? (
            <Image
              source={card.hero_image_url}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={120}
            />
          ) : (
            <View style={[styles.thumbTile, { backgroundColor: dimColor + '2E' }]}>
              <Ionicons name={fallbackIcon} size={14} color={dimColor} />
            </View>
          )}
        </View>
      }
      title={t('learning.continueReading')}
      subtitle={title}
      progress={percent}
      a11yLabel={`${t('learning.continueReading')}: ${title} · ${Math.round(percent)}%`}
      onPress={
        onPress
          ? () => {
              Haptics.selectionAsync().catch(() => {});
              onPress();
            }
          : undefined
      }
      style={style}
    />
  );
}

const styles = StyleSheet.create({
  // Same frame as the Explorar tile's thumbnails: 28×42 is the covers' own
  // 2:3, so the art is cropped, never squeezed.
  thumb: {
    width: 28,
    height: ENTRY_TILE_ART_HEIGHT,
    borderRadius: tokens.radius.sm,
    borderWidth: 1.5,
    overflow: 'hidden',
    backgroundColor: tokens.bg.deep,
  },
  thumbTile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
