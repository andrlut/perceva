import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useT } from '@/lib/i18n';
import type { IdeaCardData, IdeaLocale } from '@/lib/ideas';
import {
  IDEA_CARD_RAIL_WIDTH,
  ideaCardHeight,
  ideaImageUriFromPath,
  pickLocalized,
} from '@/lib/ideas';
import { tokens } from '@/theme';
import { DIMENSION_META } from '@/theme/dimensions';

/**
 * THE idea card — a 4:5 portrait tile that flips on tap.
 *
 * FRONT: the idea illustration (or a dimension-tinted placeholder with the
 * dimension's Ionicon), a dimension-tinted gradient at the bottom and the
 * hook title over it, inside a thin frame in the dimension color.
 * BACK: dark glass, a thin top bar in the dimension color, the claim in bold,
 * the first source label muted at the bottom and — when `onOpen` is given —
 * a small "Abrir ideia" pill.
 *
 * The card knows nothing about collecting: it only reports the FIRST time it
 * turns to the back via `onFirstFlip` (fired once per mount, whether or not
 * `collected` is already true). The idea screen wires that to the
 * `collect_idea` RPC; the rail and the collection leave it undefined so the
 * flip is reveal-only. A collected card renders front-side with a gold rim
 * + a gold check badge and flips freely. The one exception to "once": when
 * `collected` goes true → false (the screen rolled back an optimistic
 * collect after a failed RPC) the guard re-arms so the next flip to the
 * back can retry instead of needing a remount.
 *
 * Self-contained: only `useT`, reanimated and haptics.
 */

export interface IdeaCardProps {
  data: IdeaCardData;
  /** Card width in px; height follows `ideaCardHeight(width)` (4:5). */
  width: number;
  locale: IdeaLocale;
  /** Already in the user's collection → gold rim + check badge. */
  collected: boolean;
  /** Called once, the first time the card turns to the back. */
  onFirstFlip?: () => void;
  /** When given, the back shows an "Abrir ideia" pill that calls it. */
  onOpen?: () => void;
  /** Disables the tap (no flip, no haptic). */
  disabled?: boolean;
  testID?: string;
}

const FLIP_MS = 420;
/** Width at which the "large" type sizes apply (rail → large is linear). */
const LARGE_WIDTH = 300;
const OVERLAY_LOCATIONS = [0, 0.45, 1] as const;

/** Linear size between the rail width and the large width, clamped. */
function scaled(width: number, atRail: number, atLarge: number): number {
  const t = Math.min(
    1,
    Math.max(0, (width - IDEA_CARD_RAIL_WIDTH) / (LARGE_WIDTH - IDEA_CARD_RAIL_WIDTH)),
  );
  return Math.round((atRail + (atLarge - atRail) * t) * 2) / 2;
}

/** `#RRGGBB` (or `#RGB`) → `rgba(r, g, b, alpha)`; non-hex colors pass through. */
function withAlpha(color: string, alpha: number): string {
  if (!color.startsWith('#')) return color;
  const raw = color.slice(1);
  const hex =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw.slice(0, 6);
  const n = parseInt(hex, 16);
  if (Number.isNaN(n) || hex.length !== 6) return color;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const IdeaCard = memo(function IdeaCard({
  data,
  width,
  locale,
  collected,
  onFirstFlip,
  onOpen,
  disabled = false,
  testID,
}: IdeaCardProps) {
  const { t } = useT();
  const height = ideaCardHeight(width);

  const title = pickLocalized(data.title, locale);
  const claim = pickLocalized(data.claim, locale);
  const source = data.sourceLabel ? pickLocalized(data.sourceLabel, locale) : '';
  const imageUri = ideaImageUriFromPath(data.imagePath);

  const dim = DIMENSION_META[data.dimensionId];
  const dimColor = dim.color;
  const iconName = dim.iconName as keyof typeof Ionicons.glyphMap;

  // Type and padding scale with the card: ~13px title on the 132px rail,
  // ~20px on a 300px hero card.
  const pad = scaled(width, 10, 18);
  const titleSize = scaled(width, 13, 20);
  const claimSize = scaled(width, 12.5, 18);
  const sourceSize = scaled(width, 9, 11.5);
  const iconSize = Math.round(width * 0.28);
  const compact = width < 200;

  const overlayColors = useMemo(
    () =>
      ['rgba(0, 0, 0, 0)', withAlpha(dimColor, 0.35), 'rgba(6, 8, 30, 0.92)'] as const,
    [dimColor],
  );
  const frameStyle = useMemo(
    () =>
      collected
        ? { borderWidth: 2, borderColor: tokens.semantic.coin }
        : { borderWidth: 1.5, borderColor: withAlpha(dimColor, 0.7) },
    [collected, dimColor],
  );

  // ── Flip ──────────────────────────────────────────────────────────────────
  const [flipped, setFlipped] = useState(false);
  const firstFlipDone = useRef(false);
  // Re-arm after a rollback (collected true → false) so a failed collect can
  // be retried by flipping again; never fires on the rail/collection, where
  // `collected` only ever goes false → true.
  const wasCollected = useRef(collected);
  useEffect(() => {
    if (wasCollected.current && !collected) firstFlipDone.current = false;
    wasCollected.current = collected;
  }, [collected]);
  const progress = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${interpolate(progress.value, [0, 1], [0, 180])}deg` },
    ],
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${interpolate(progress.value, [0, 1], [180, 360])}deg` },
    ],
  }));

  const toggle = useCallback(() => {
    const next = !flipped;
    setFlipped(next);
    Haptics.selectionAsync().catch(() => {});
    progress.value = withTiming(next ? 1 : 0, {
      duration: reduceMotion ? 0 : FLIP_MS,
      easing: Easing.inOut(Easing.cubic),
    });
    if (next && !firstFlipDone.current) {
      firstFlipDone.current = true;
      onFirstFlip?.();
    }
  }, [flipped, onFirstFlip, progress, reduceMotion]);

  const a11yLabel = flipped
    ? t('learning.ideas.a11yCardBack', { claim })
    : t('learning.ideas.a11yCardFront', { title });

  return (
    <Pressable
      onPress={toggle}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ selected: collected, disabled }}
      style={[styles.root, { width, height }, collected && styles.rootCollected]}
    >
      {/* FRONT — image + tinted gradient + title. Non-interactive: the outer
         Pressable owns the tap. */}
      <Animated.View pointerEvents="none" style={[styles.face, frameStyle, frontStyle]}>
        {imageUri ? (
          <Image
            source={imageUri}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={imageUri}
            transition={120}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              styles.placeholder,
              { backgroundColor: withAlpha(dimColor, 0.18) },
            ]}
          >
            <Ionicons name={iconName} size={iconSize} color="rgba(255, 255, 255, 0.9)" />
          </View>
        )}
        <LinearGradient
          colors={overlayColors}
          locations={OVERLAY_LOCATIONS}
          style={styles.overlay}
        />
        <View style={[styles.titleWrap, { padding: pad }]}>
          <Text
            style={[
              styles.title,
              { fontSize: titleSize, lineHeight: Math.round(titleSize * 1.18) },
            ]}
            numberOfLines={compact ? 3 : 4}
          >
            {title}
          </Text>
        </View>
        {collected && (
          <View style={[styles.badge, { top: pad - 2, right: pad - 2 }]}>
            <Ionicons name="checkmark" size={13} color={tokens.bg.deep} />
          </View>
        )}
      </Animated.View>

      {/* BACK — glass, dimension top bar, claim, source, optional open pill.
         Touches only reach it while it faces the user (Android can otherwise
         hit the rotated-away pill through the front). */}
      <Animated.View
        pointerEvents={flipped ? 'auto' : 'none'}
        style={[styles.face, styles.back, frameStyle, backStyle]}
      >
        <LinearGradient
          colors={tokens.gradient.taskCard}
          locations={tokens.gradient.taskCardLocations}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.topBar, { backgroundColor: dimColor }]} />
        <View style={[styles.backBody, { padding: pad, paddingTop: pad + 3 }]}>
          <View style={styles.claimWrap}>
            <Text
              style={[
                styles.claim,
                { fontSize: claimSize, lineHeight: Math.round(claimSize * 1.3) },
              ]}
              numberOfLines={compact ? 6 : 8}
            >
              {claim}
            </Text>
          </View>
          {(source.length > 0 || onOpen) && (
            <View style={styles.backFooter}>
              {source.length > 0 && (
                <Text
                  style={[
                    styles.source,
                    { fontSize: sourceSize, lineHeight: Math.round(sourceSize * 1.35) },
                  ]}
                  numberOfLines={2}
                >
                  {source}
                </Text>
              )}
              {onOpen && (
                <Pressable
                  onPress={onOpen}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={t('learning.ideas.openIdea')}
                  style={({ pressed }) => [styles.openPill, pressed && styles.pressed]}
                >
                  <Text style={styles.openPillText}>{t('learning.ideas.openIdea')}</Text>
                  <Ionicons name="arrow-forward" size={11} color={tokens.brand.violet2} />
                </Pressable>
              )}
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  root: {
    position: 'relative',
  },
  /** Soft gold glow once the idea is in the collection. */
  rootCollected: {
    ...tokens.shadow.coinGlowSoft,
  },
  face: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: tokens.radius.lg,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
    backgroundColor: tokens.bg.surface,
  },
  back: {
    backgroundColor: tokens.bg.surface2,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '62%',
  },
  titleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    color: '#FFFFFF',
    letterSpacing: 0.1,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  badge: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: tokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.semantic.coin,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  backBody: {
    flex: 1,
  },
  claimWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  claim: {
    fontFamily: 'Manrope_700Bold',
    color: tokens.text.hi,
  },
  backFooter: {
    gap: 8,
  },
  source: {
    fontFamily: 'Manrope_600SemiBold',
    color: tokens.text.dim,
  },
  openPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: tokens.radius.pill,
    backgroundColor: 'rgba(123, 92, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(123, 92, 255, 0.42)',
  },
  openPillText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: tokens.brand.violet2,
  },
  pressed: {
    opacity: 0.8,
  },
});
