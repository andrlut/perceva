import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { IdeaReelPage } from '@/components/reels/IdeaReelPage';
import type { LegacyReelGroup, ReelGroup } from '@/lib/reels';
import { useT } from '@/lib/i18n';

/**
 * One group's page inside the reel pager — a legacy material's baked art
 * or a native idea card (IdeaReelPage), under the SAME two tap zones.
 *
 * Cards inside a legacy group advance with an instant image swap
 * (Instagram semantics — a cut, not a slide); crossing the group's edges
 * hands off to the parent, which scrolls the outer pager to the neighboring
 * group. An idea group is always a single card, so its taps hand off
 * straight away. Today every legacy group has a single card too, so taps
 * always hand off — the inner state is the phase-2 (sliced storyboard)
 * path, already wired.
 *
 * The card background is the infographics' own navy so the pre-decode
 * frame and the letterbox blend into the artwork instead of flashing black
 * (the idea stage paints the same navy, `tokens.bg.deep`).
 */

const CARD_BG = '#0A0E26';
/** Back zone is narrower (~30/70) so accidental back-taps stay rare. */
const PREV_ZONE_RATIO = 0.3;
/**
 * RN suppresses onPress once onLongPress fires, so this threshold decides
 * when a slow deliberate tap stops advancing and becomes hold-to-peek.
 * 200ms sits inside the normal tap-duration distribution and made taps
 * "randomly" do nothing — keep it at the platform's 500ms default.
 */
const CHROME_PEEK_DELAY_MS = 500;

interface Props {
  group: ReelGroup;
  isActive: boolean;
  pageW: number;
  pageH: number;
  onPrevGroup: () => void;
  onNextGroup: () => void;
  onChromeHide: () => void;
  onChromeShow: () => void;
}

export function ReelGroupPage({
  group,
  isActive,
  pageW,
  pageH,
  onPrevGroup,
  onNextGroup,
  onChromeHide,
  onChromeShow,
}: Props) {
  const { t } = useT();
  const [cardIndex, setCardIndex] = useState(0);
  const cardCount = group.kind === 'idea' ? 1 : group.cards.length;
  const index = Math.min(cardIndex, cardCount - 1);

  const advance = () => {
    Haptics.selectionAsync().catch(() => {});
    if (index < cardCount - 1) setCardIndex(index + 1);
    else onNextGroup();
  };
  const retreat = () => {
    Haptics.selectionAsync().catch(() => {});
    if (index > 0) setCardIndex(index - 1);
    else onPrevGroup();
  };

  return (
    <View style={[styles.page, { width: pageW, height: pageH }]}>
      {group.kind === 'idea' ? (
        <IdeaReelPage group={group} isActive={isActive} pageW={pageW} pageH={pageH} />
      ) : (
        <LegacyArt group={group} index={index} isActive={isActive} pageW={pageW} pageH={pageH} />
      )}
      <Pressable
        onPress={retreat}
        onLongPress={onChromeHide}
        onPressOut={onChromeShow}
        delayLongPress={CHROME_PEEK_DELAY_MS}
        accessibilityRole="button"
        accessibilityLabel={t('learning.reels.prevZone')}
        style={[styles.zone, { left: 0, width: pageW * PREV_ZONE_RATIO }]}
      />
      <Pressable
        onPress={advance}
        onLongPress={onChromeHide}
        onPressOut={onChromeShow}
        delayLongPress={CHROME_PEEK_DELAY_MS}
        accessibilityRole="button"
        accessibilityLabel={t('learning.reels.nextZone')}
        style={[styles.zone, { right: 0, width: pageW * (1 - PREV_ZONE_RATIO) }]}
      />
    </View>
  );
}

interface LegacyArtProps {
  group: LegacyReelGroup;
  index: number;
  isActive: boolean;
  pageW: number;
  pageH: number;
}

/** The baked story card, contain-fit (MediaViewer math) — at 9:16 on most
 *  phones this is nearly full-bleed, with slim letterbox bands that share
 *  the card's navy. */
function LegacyArt({ group, index, isActive, pageW, pageH }: LegacyArtProps) {
  const card = group.cards[index]!;
  const scale = Math.min(pageW / card.width, pageH / card.height);
  const fitW = card.width * scale;
  const fitH = card.height * scale;

  return (
    <Image
      source={{ uri: card.uri }}
      style={{ width: fitW, height: fitH }}
      contentFit="contain"
      transition={0}
      cachePolicy="memory-disk"
      priority={isActive ? 'high' : 'normal'}
      recyclingKey={card.key}
      accessibilityLabel={card.alt ?? `${group.title} — ${group.summary}`}
    />
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
});
