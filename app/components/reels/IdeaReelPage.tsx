import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { useT } from '@/lib/i18n';
import { IDEA_IMAGE_ASPECT, ideaCardHeight } from '@/lib/ideas';
import type { IdeaReelGroup } from '@/lib/reels';
// PINNED-DARK SURFACE (same rule as ReelChrome): the idea stage sits in
// the same stories-player as the dark legacy artwork, under the same
// pinned-dark chrome. Import the dark palette directly so a light-theme
// boot doesn't turn this one page into a light slide between dark ones.
import { tokens } from '@/theme/tokens';
import { DIMENSION_META } from '@/theme/dimensions';

/**
 * The stage of an idea group inside the reel pager — the visual only; the
 * tap zones (prev/next + hold-to-peek) are laid over it by ReelGroupPage,
 * exactly as they are over the legacy art.
 *
 * Centred column: the idea illustration (4:5, rimmed in the dimension
 * color, dimension placeholder when the idea has no image yet), the hook
 * title as the headline, then the parent material and "Ideia n de N". No
 * icons, no infographic — the card is a hook; the idea itself (video/text
 * → flip card → absorb) lives on /idea/[slug].
 *
 * The image is bounded by BOTH axes so the whole column always clears the
 * chrome bands: on tall phones the width wins (page minus the side gutter),
 * on short ones the height budget shrinks the picture instead of pushing
 * the headline under the bottom actions.
 */

/** Vertical room kept for the chrome (progress bar + title strip / the
 *  action row) and for the text column under the picture. Approximate on
 *  purpose — the page gets no insets, and the legacy art tolerates the same
 *  overlap on tiny screens. */
const CHROME_TOP_RESERVE = 120;
const CHROME_BOTTOM_RESERVE = 100;
const TEXT_RESERVE = 150;
const MIN_IMAGE_W = 160;

interface Props {
  group: IdeaReelGroup;
  isActive: boolean;
  pageW: number;
  pageH: number;
}

export function IdeaReelPage({ group, isActive, pageW, pageH }: Props) {
  const { t } = useT();

  const columnW = pageW - 2 * tokens.space[5];
  const maxByHeight = Math.floor(
    (pageH - CHROME_TOP_RESERVE - CHROME_BOTTOM_RESERVE - TEXT_RESERVE) * IDEA_IMAGE_ASPECT,
  );
  const imgW = Math.max(MIN_IMAGE_W, Math.min(columnW, maxByHeight));
  const imgH = ideaCardHeight(imgW);

  const iconName = DIMENSION_META[group.dimensionId].iconName as keyof typeof Ionicons.glyphMap;
  const a11yLabel = group.claim ? `${group.title} — ${group.claim}` : group.title;

  return (
    <View style={[styles.page, { width: pageW, height: pageH }]}>
      <View
        style={[
          styles.frame,
          { width: imgW, height: imgH, borderColor: group.accent + 'B3' },
        ]}
      >
        {group.imageUri ? (
          <Image
            source={{ uri: group.imageUri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={150}
            cachePolicy="memory-disk"
            priority={isActive ? 'high' : 'normal'}
            recyclingKey={group.key}
            accessibilityLabel={a11yLabel}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              styles.placeholder,
              { backgroundColor: group.accent + '2E' },
            ]}
            accessible
            accessibilityLabel={a11yLabel}
          >
            <Ionicons name={iconName} size={56} color="rgba(255, 255, 255, 0.9)" />
          </View>
        )}
      </View>

      <Text style={[styles.headline, { width: columnW }]} numberOfLines={3}>
        {group.title}
      </Text>
      {group.materialTitle ? (
        <Text style={[styles.material, { width: columnW }]} numberOfLines={1}>
          {group.materialTitle}
        </Text>
      ) : null}
      <Text style={[styles.ordinal, { color: group.accent }]}>
        {t('learning.ideas.ideaOf', { n: group.ordinal, total: group.ideaCount })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: tokens.bg.deep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    borderRadius: tokens.radius.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
    backgroundColor: tokens.bg.surface,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    marginTop: tokens.space[5],
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.2,
    color: tokens.text.hi,
    textAlign: 'center',
  },
  material: {
    marginTop: tokens.space[3],
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    color: tokens.text.mid,
    textAlign: 'center',
  },
  ordinal: {
    marginTop: tokens.space[1],
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
