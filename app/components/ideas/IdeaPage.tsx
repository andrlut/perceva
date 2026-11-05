import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useMemo } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IdeaCard } from '@/components/ideas/IdeaCard';
import { IdeaVideo } from '@/components/ideas/IdeaVideo';
import { LearningBody } from '@/components/LearningBody';
import type { DimensionId, LearningIdea } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import {
  IDEA_IMAGE_ASPECT,
  type IdeaLocale,
  ideaImageUri,
  ideaVideoPosterUri,
  ideaVideoUri,
  localizedIdea,
  pickIdeaVideo,
  pickLocalized,
  toCardData,
} from '@/lib/ideas';
import { tokens } from '@/theme';
import { DIMENSION_META } from '@/theme/dimensions';

/**
 * One idea = one page of the horizontal pager in `IdeaScreen`.
 *
 * Top to bottom: the Notebook video (or the idea illustration, or a
 * dimension-tinted placeholder), the hook title, the claim pulled out with
 * a bar in the dimension color, the 100–180-word body, the source chips,
 * THE card (the only flip in the product that collects — wired through
 * `onFirstFlip`) with its hint, and the primary button (next idea, or back
 * to the material on the last page).
 *
 * The page owns no data: `collected` and the flip callback come from the
 * screen, which is the single owner of the collect flow.
 */

export interface IdeaPageMaterial {
  id: string;
  slug: string;
  dimension_id: DimensionId;
}

interface Props {
  idea: LearningIdea;
  material: IdeaPageMaterial;
  locale: IdeaLocale;
  pageW: number;
  pageH: number;
  /** Only the active page autoplays its video. */
  isActive: boolean;
  /** Already in the collection (server or optimistic). */
  collected: boolean;
  /** Bottom safe-area inset — the scroll reserves it under the button. */
  bottomInset: number;
  onFirstFlip: (idea: LearningIdea) => void;
  /** null on the last page → the button becomes "back to the material". */
  onNext: (() => void) | null;
  onExit: () => void;
}

/** Widest the hero card gets — keeps it a card, not a poster, on tablets. */
const CARD_MAX_WIDTH = 300;
/** Media never eats more than this share of the page height. */
const IMAGE_MAX_SHARE = 0.52;
const VIDEO_MAX_SHARE = 0.55;

export const IdeaPage = memo(function IdeaPage({
  idea,
  material,
  locale,
  pageW,
  pageH,
  isActive,
  collected,
  bottomInset,
  onFirstFlip,
  onNext,
  onExit,
}: Props) {
  const { t } = useT();

  const dim = DIMENSION_META[material.dimension_id];
  const dimColor = dim.color;
  const dimIcon = dim.iconName as keyof typeof Ionicons.glyphMap;

  const text = useMemo(() => localizedIdea(idea, locale), [idea, locale]);
  const videoPick = useMemo(() => pickIdeaVideo(idea, locale), [idea, locale]);
  const imageUri = ideaImageUri(idea);
  const cardData = useMemo(() => toCardData(idea, material), [idea, material]);

  const contentW = pageW - 2 * tokens.space[4];
  const cardW = Math.min(pageW - 2 * tokens.space[6], CARD_MAX_WIDTH);
  const imageH = Math.round(Math.min(contentW / IDEA_IMAGE_ASPECT, pageH * IMAGE_MAX_SHARE));
  const textLangBadge = text.isFallback ? (locale === 'pt' ? 'EN' : 'PT') : null;

  const openSource = (url: string) => {
    Haptics.selectionAsync().catch(() => {});
    Linking.openURL(url).catch(() => {});
  };

  const onPrimary = () => {
    Haptics.selectionAsync().catch(() => {});
    if (onNext) onNext();
    else onExit();
  };

  return (
    <ScrollView
      style={{ width: pageW, height: pageH }}
      contentContainerStyle={[styles.content, { paddingBottom: bottomInset + tokens.space[6] }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Media ─────────────────────────────────────────────────────── */}
      {videoPick ? (
        <IdeaVideo
          uri={ideaVideoUri(videoPick.video)}
          poster={ideaVideoPosterUri(videoPick.video)}
          isActive={isActive}
          langBadge={videoPick.isFallback ? videoPick.locale.toUpperCase() : null}
          durationSeconds={videoPick.video.duration_seconds}
          width={contentW}
          maxHeight={pageH * VIDEO_MAX_SHARE}
          accentColor={dimColor}
        />
      ) : imageUri ? (
        <View style={[styles.mediaBox, { height: imageH, borderColor: dimColor + 'B3' }]}>
          <Image
            source={{ uri: imageUri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={imageUri}
            transition={160}
          />
        </View>
      ) : (
        <View
          style={[
            styles.mediaBox,
            styles.placeholder,
            { height: imageH, borderColor: dimColor + 'B3', backgroundColor: dim.bg },
          ]}
        >
          <Ionicons name={dimIcon} size={64} color="rgba(255, 255, 255, 0.9)" />
        </View>
      )}

      {/* ── Title ─────────────────────────────────────────────────────── */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{text.title}</Text>
        {textLangBadge ? (
          <View style={styles.langBadge}>
            <Text style={styles.langBadgeText}>{textLangBadge}</Text>
          </View>
        ) : null}
      </View>

      {/* ── Claim — the one sentence that stands alone ───────────────── */}
      {text.claim.length > 0 && (
        <View style={styles.claimRow}>
          <View style={[styles.claimBar, { backgroundColor: dimColor }]} />
          <Text style={styles.claim}>{text.claim}</Text>
        </View>
      )}

      {/* ── Body ──────────────────────────────────────────────────────── */}
      {text.body.length > 0 && (
        <View style={styles.bodyWrap}>
          <LearningBody body={text.body} />
        </View>
      )}

      {/* ── Sources ───────────────────────────────────────────────────── */}
      {idea.sources.length > 0 && (
        <View style={styles.sourcesWrap}>
          {idea.sources.map((source, idx) => {
            const label = pickLocalized(source.label, locale) || source.url;
            return (
              <Pressable
                key={`${source.url}-${idx}`}
                onPress={() => openSource(source.url)}
                accessibilityRole="link"
                accessibilityLabel={label}
                style={({ pressed }) => [styles.sourceChip, pressed && styles.pressed]}
              >
                <Ionicons name="open-outline" size={13} color={tokens.text.mid} />
                <Text style={styles.sourceText} numberOfLines={1}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* ── The card — flipping it here is what absorbs the idea ──────── */}
      <View style={styles.cardWrap}>
        <IdeaCard
          data={cardData}
          width={cardW}
          locale={locale}
          collected={collected}
          onFirstFlip={() => onFirstFlip(idea)}
        />
        {collected ? (
          <View style={styles.hintRow}>
            <Ionicons name="checkmark-circle" size={15} color={tokens.semantic.coin} />
            <Text style={[styles.hint, styles.hintAbsorbed]}>{t('learning.ideas.absorbed')}</Text>
          </View>
        ) : (
          <Text style={styles.hint}>{t('learning.ideas.flipToAbsorb')}</Text>
        )}
      </View>

      {/* ── Primary button ────────────────────────────────────────────── */}
      <Pressable
        onPress={onPrimary}
        accessibilityRole="button"
        style={({ pressed }) => [styles.ctaWrap, pressed && styles.pressed]}
      >
        <LinearGradient
          colors={tokens.gradient.completeBtn}
          locations={tokens.gradient.completeBtnLocations}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>
            {onNext ? t('learning.ideas.next') : t('learning.ideas.backToMaterial')}
          </Text>
          <Ionicons
            name={onNext ? 'arrow-forward' : 'arrow-undo-outline'}
            size={16}
            color={tokens.text.hi}
          />
        </LinearGradient>
      </Pressable>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[2],
    gap: tokens.space[4],
  },
  mediaBox: {
    width: '100%',
    borderRadius: tokens.radius.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    backgroundColor: tokens.bg.surface,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    flex: 1,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.2,
    color: tokens.text.hi,
  },
  langBadge: {
    marginTop: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(123, 92, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(123, 92, 255, 0.42)',
  },
  langBadgeText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 9,
    letterSpacing: 0.6,
    color: tokens.brand.violet2,
  },
  claimRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  claimBar: {
    width: 3,
    borderRadius: 2,
  },
  claim: {
    flex: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 17,
    lineHeight: 24,
    color: tokens.text.hi,
  },
  bodyWrap: {
    paddingTop: tokens.space[1],
  },
  sourcesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.bg.glass,
    borderWidth: 1,
    borderColor: tokens.border.strong,
  },
  sourceText: {
    flexShrink: 1,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: tokens.text.base,
  },
  cardWrap: {
    alignItems: 'center',
    gap: tokens.space[3],
    paddingTop: tokens.space[3],
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hint: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12.5,
    color: tokens.text.mid,
    textAlign: 'center',
  },
  hintAbsorbed: {
    color: tokens.semantic.coin,
  },
  ctaWrap: {
    marginTop: tokens.space[2],
    borderRadius: tokens.radius.md,
    ...tokens.shadow.violetGlowSoft,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: tokens.radius.md,
  },
  ctaText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: tokens.text.hi,
  },
  pressed: {
    opacity: 0.85,
  },
});
