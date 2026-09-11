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
 * BACK: dark glass, a thin top bar in the dimension color and the claim in
 * bold — nothing else. The claim owns the whole face (vertically centered,
 * left-aligned) and ALWAYS fits whole: the size is pre-fitted from the
 * character budget below (font AND line height shrink together, down to
 * 60% of the base) and `adjustsFontSizeToFit` stays on as a safety net for
 * the cases the estimate gets wrong. The source label lives on the idea
 * screen, not here (`data.sourceLabel` is kept for other surfaces).
 *
 * Opening an idea from the back: `openAffordance="corner"` + `onOpen` renders
 * a 30px round arrow button in the top-right corner of the back face (the
 * collection uses it). The claim box starts below that button, so the arrow
 * never sits on text — it costs one line of the top band, never a footer.
 * The button is its own Pressable inside the face; React Native's responder
 * system hands the touch to the innermost Pressable, so tapping it calls
 * `onOpen` and does NOT flip the card. It only receives touches while the
 * back faces the user (`pointerEvents` on the back face).
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
 * ── Claim character budget (glyph-cell model, reviewed 2026-09-08) ────────
 * Assumptions: Manrope 700 average advance ≈ 0.56em, lineHeight = 1.3×size
 * (rounded to whole px), inner width = width − 2·pad, usable height =
 * height − topBar(3) − 2·pad, height = width / 0.8. "Cells" is
 * lines × chars-per-line at the BASE size — the ceiling before any shrink.
 * Real word wrap keeps ~80–90% of it; the last column is a synthetic
 * pt-BR text with 5-letter words, greedy-wrapped with the same model.
 *
 * | Surface (width)                  | pad | inner W×H | base/lh | lines×cpl | cells | ≈ wrapped |
 * |----------------------------------|-----|-----------|---------|-----------|-------|-----------|
 * | Rail (132)                       | 10  | 112×142   | 13/17   | 8 × 15    | 120   | ~95       |
 * | Collection cell (171 on 390 pt)  | 12  | 147×187   | 14.5/19 | 9 × 18    | 162   | ~148      |
 * |   …with the corner affordance    | 12  | 147×155   | 14.5/19 | 8 × 18    | 144   | ~132      |
 * | Idea screen card (300)           | 18  | 264×336   | 18/23   | 14 × 26   | 364   | ~317      |
 *
 * Editorial budget: **120 chars target, 140 hard cap.** 120 is the rail's
 * cell budget at the base size (on the phone a 120-char claim lands at
 * 11.5–12px after the pre-fit, whole). The longest pilot claims (137–140)
 * pre-fit to 11/14 on the rail and 13–13.5/17–18 on the collection cell —
 * no truncation, RN's own shrink never needed. Above 140 the rail heads
 * toward the 0.6 floor (7.8px), which is where legibility, not fit, gives.
 *
 * Self-contained: only `useT`, reanimated and haptics.
 */

/** How the back face lets the user open the idea (see the header). */
export type IdeaCardOpenAffordance = 'none' | 'corner';

export interface IdeaCardProps {
  data: IdeaCardData;
  /** Card width in px; height follows `ideaCardHeight(width)` (4:5). */
  width: number;
  locale: IdeaLocale;
  /** Already in the user's collection → gold rim + check badge. */
  collected: boolean;
  /** Called once, the first time the card turns to the back. */
  onFirstFlip?: () => void;
  /** Called by the corner button on the back (needs `openAffordance="corner"`). */
  onOpen?: () => void;
  /** `"corner"` shows the round arrow button on the back when `onOpen` is given. Default `"none"`. */
  openAffordance?: IdeaCardOpenAffordance;
  /**
   * One muted uppercase line above the headline on the FRONT — the material
   * title, for cards shown outside their material (review stack, collection
   * grid) where a secondary idea's title loses its context alone. Empty or
   * undefined renders nothing; the flip, rim and back are untouched.
   */
  kicker?: string;
  /** Disables the tap (no flip, no haptic). */
  disabled?: boolean;
  testID?: string;
}

const FLIP_MS = 420;
/** Width at which the "large" type sizes apply (rail → large is linear). */
const LARGE_WIDTH = 300;
/** Collection cell on a 390-pt phone (`collectionCardWidth(390)`) — the mid stop of the claim size. */
const COLLECTION_CELL_WIDTH = 171;
const OVERLAY_LOCATIONS = [0, 0.45, 1] as const;

/** Height of the dimension-colored bar at the top of the back face. */
const TOP_BAR_H = 3;
/** Corner "open" button: diameter, inset from the bar/right edge, gap to the claim. */
const OPEN_BTN_SIZE = 30;
const OPEN_BTN_INSET = 8;
const OPEN_BTN_GAP = 6;

/** Claim type: base size stops (width → px), line height and the shrink floor. */
const CLAIM_SIZE_STOPS: readonly (readonly [number, number])[] = [
  [IDEA_CARD_RAIL_WIDTH, 13],
  [COLLECTION_CELL_WIDTH, 14.5],
  [LARGE_WIDTH, 18],
];
const CLAIM_LINE_HEIGHT = 1.3;
const CLAIM_MIN_SCALE = 0.6;
/** Manrope 700 average glyph advance as a fraction of the font size. */
const CLAIM_AVG_ADVANCE_EM = 0.56;

/** Linear size between the rail width and the large width, clamped. */
function scaled(width: number, atRail: number, atLarge: number): number {
  const t = Math.min(
    1,
    Math.max(0, (width - IDEA_CARD_RAIL_WIDTH) / (LARGE_WIDTH - IDEA_CARD_RAIL_WIDTH)),
  );
  return Math.round((atRail + (atLarge - atRail) * t) * 2) / 2;
}

/** Piecewise-linear claim base size through `CLAIM_SIZE_STOPS`, in 0.5px steps, clamped. */
function claimBaseSize(width: number): number {
  const first = CLAIM_SIZE_STOPS[0];
  if (width <= first[0]) return first[1];
  for (let i = 1; i < CLAIM_SIZE_STOPS.length; i += 1) {
    const [w0, s0] = CLAIM_SIZE_STOPS[i - 1];
    const [w1, s1] = CLAIM_SIZE_STOPS[i];
    if (width <= w1) {
      return Math.round((s0 + ((s1 - s0) * (width - w0)) / (w1 - w0)) * 2) / 2;
    }
  }
  return CLAIM_SIZE_STOPS[CLAIM_SIZE_STOPS.length - 1][1];
}

function claimLineHeight(size: number): number {
  return Math.round(size * CLAIM_LINE_HEIGHT);
}

/**
 * Greedy word-wrap line count for `text` when `charsPerLine` glyph cells fit
 * on a line (a word longer than the line spills over as many lines as needed).
 */
function estimateLines(text: string, charsPerLine: number): number {
  const cpl = Math.max(1, charsPerLine);
  let lines = 1;
  let used = 0;
  for (const word of text.split(/\s+/)) {
    const len = word.length;
    if (len === 0) continue;
    if (used > 0 && used + 1 + len <= cpl) {
      used += 1 + len;
      continue;
    }
    if (used > 0) lines += 1;
    lines += Math.ceil(len / cpl) - 1;
    used = len % cpl || cpl;
  }
  return lines;
}

interface ClaimBox {
  lineHeight: number;
  /** Lines that fit in the box at `lineHeight` — also the `numberOfLines` cap. */
  maxLines: number;
  /** Glyph cells per line at this size (0.56em average advance). */
  charsPerLine: number;
}

interface ClaimFit {
  fontSize: number;
  lineHeight: number;
  maxLines: number;
}

function claimBoxAt(size: number, innerW: number, innerH: number): ClaimBox {
  const lineHeight = claimLineHeight(size);
  return {
    lineHeight,
    maxLines: Math.max(1, Math.floor(innerH / lineHeight)),
    charsPerLine: Math.max(1, Math.floor(innerW / (size * CLAIM_AVG_ADVANCE_EM))),
  };
}

/**
 * Largest size in [0.6·base, base] (0.5px steps) at which the claim's
 * estimated line count fits the box; font and line height shrink together.
 * At the floor the estimate may still not fit — `adjustsFontSizeToFit`
 * takes over from there.
 */
function fitClaim(claim: string, base: number, innerW: number, innerH: number): ClaimFit {
  const floor = Math.ceil(base * CLAIM_MIN_SCALE * 2) / 2;
  let size = base;
  let box = claimBoxAt(size, innerW, innerH);
  while (size - 0.5 >= floor && estimateLines(claim, box.charsPerLine) > box.maxLines) {
    size -= 0.5;
    box = claimBoxAt(size, innerW, innerH);
  }
  return { fontSize: size, lineHeight: box.lineHeight, maxLines: box.maxLines };
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
  openAffordance = 'none',
  kicker,
  disabled = false,
  testID,
}: IdeaCardProps) {
  const { t } = useT();
  const height = ideaCardHeight(width);

  const title = pickLocalized(data.title, locale);
  const claim = pickLocalized(data.claim, locale);
  const imageUri = ideaImageUriFromPath(data.imagePath);

  const dim = DIMENSION_META[data.dimensionId];
  const dimColor = dim.color;
  const iconName = dim.iconName as keyof typeof Ionicons.glyphMap;

  // Type and padding scale with the card: ~13px title on the 132px rail,
  // ~20px on a 300px hero card.
  const pad = scaled(width, 10, 18);
  const titleSize = scaled(width, 13, 20);
  const kickerSize = scaled(width, 10, 11);
  const iconSize = Math.round(width * 0.28);
  const compact = width < 200;
  const showKicker = kicker != null && kicker.trim().length > 0;

  const showOpen = openAffordance === 'corner' && onOpen != null;
  // The claim box: below the top bar (and below the corner button when it is
  // there), `pad` on the other three sides.
  const claimTop = showOpen
    ? TOP_BAR_H + OPEN_BTN_INSET + OPEN_BTN_SIZE + OPEN_BTN_GAP
    : TOP_BAR_H + pad;
  const claimFit = useMemo(
    () => fitClaim(claim, claimBaseSize(width), width - 2 * pad, height - claimTop - pad),
    [claim, width, pad, height, claimTop],
  );

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
          {showKicker && (
            <Text
              style={[
                styles.kicker,
                { fontSize: kickerSize, lineHeight: Math.round(kickerSize * 1.3) },
              ]}
              numberOfLines={1}
            >
              {kicker}
            </Text>
          )}
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

      {/* BACK — glass, dimension top bar, the claim, optional corner button.
         Touches only reach it while it faces the user (Android can otherwise
         hit the rotated-away button through the front). */}
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
        <View style={[styles.claimBox, { top: claimTop, left: pad, right: pad, bottom: pad }]}>
          <Text
            style={[
              styles.claim,
              { fontSize: claimFit.fontSize, lineHeight: claimFit.lineHeight },
            ]}
            numberOfLines={claimFit.maxLines}
            adjustsFontSizeToFit
            minimumFontScale={CLAIM_MIN_SCALE}
          >
            {claim}
          </Text>
        </View>
        {showOpen && (
          <Pressable
            onPress={onOpen}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('learning.ideas.openIdea')}
            style={({ pressed }) => [
              styles.openBtn,
              { borderColor: withAlpha(dimColor, 0.7) },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="arrow-forward" size={16} color={tokens.text.hi} />
          </Pressable>
        )}
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
  /** Material title above the headline — same left inset, one line, muted. */
  kicker: {
    fontFamily: 'Manrope_700Bold',
    color: 'rgba(255, 255, 255, 0.72)',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
    height: TOP_BAR_H,
  },
  /** The claim's box — the whole face minus the top bar/corner button and `pad`. */
  claimBox: {
    position: 'absolute',
    justifyContent: 'center',
  },
  claim: {
    fontFamily: 'Manrope_700Bold',
    color: tokens.text.hi,
    textAlign: 'left',
  },
  /** Round arrow in the top-right corner of the back — dark glass, dimension rim. */
  openBtn: {
    position: 'absolute',
    top: TOP_BAR_H + OPEN_BTN_INSET,
    right: OPEN_BTN_INSET,
    width: OPEN_BTN_SIZE,
    height: OPEN_BTN_SIZE,
    borderRadius: OPEN_BTN_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(6, 8, 30, 0.85)',
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.8,
  },
});
