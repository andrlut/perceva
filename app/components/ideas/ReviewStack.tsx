import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import {
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { IdeaCard } from '@/components/ideas/IdeaCard';
import { useT } from '@/lib/i18n';
import { ideaCardHeight, type IdeaCardData, type IdeaLocale } from '@/lib/ideas';
import { tokens } from '@/theme';

/**
 * The review pile at the top of "Minhas ideias".
 *
 * Every absorbed idea lands here once (`reviewed_at IS NULL`). The TOP item
 * is a large `IdeaCard` — flip it to re-read the claim (reveal-only, no RPC),
 * the corner arrow reopens the idea — and the decision is a horizontal swipe:
 * RIGHT keeps it as a favorite, LEFT releases it (still absorbed, just out of
 * the grid). The two buttons under the card do the same for anyone who
 * cannot or would rather not drag; the pan is never the only way.
 *
 * The parent owns the list: `onDecision` fires once the card has flown off,
 * the parent's optimistic cache update drops the item, and the next one is
 * already the top. The top card is a component keyed by the idea, so its
 * drag state (`tx`/`ty`) is born at 0 with the card and dies with it — no
 * reset, no flash of the old card snapping back to center. The next card
 * peeks behind (scaled down, offset, dimmer) and grows into the top pose as
 * the top is dragged, driven by the shared `progress` (0..1 = fraction of
 * the commit distance); a fresh top "deals in" by settling `progress` back
 * to 0.
 *
 * Renders nothing when `items` is empty — the screen shows "Revisão em dia".
 */

export interface ReviewStackItem {
  card: IdeaCardData;
  /** Material title shown above the headline (may be empty). */
  kicker: string;
  slug: string;
}

interface Props {
  /** Pending reviews, oldest first; the first entry is the top card. */
  items: ReviewStackItem[];
  locale: IdeaLocale;
  /** Fired AFTER the fly-out animation, once per swipe/button press. */
  onDecision: (item: ReviewStackItem, favorite: boolean) => void;
  /** The corner arrow on the back of the top card. */
  onOpen: (item: ReviewStackItem) => void;
}

/** Large card: the idea screen's width, capped. */
const MAX_CARD_WIDTH = 320;
/** Release beyond this fraction of the card width commits the decision. */
const COMMIT_RATIO = 0.35;
/** ...or a flick faster than this (px/s), in the direction of the drag. */
const COMMIT_VELOCITY = 900;
const FLY_MS = 260;
/** The new top settling the peek behind it back to the resting pose. */
const DEAL_MS = 200;
const MAX_ROTATE_DEG = 10;
/** Vertical follow while dragging — a hint of lift, not a free axis. */
const DRAG_Y_FOLLOW = 0.12;
const PEEK_SCALE = 0.94;
const PEEK_OFFSET_Y = 14;
const PEEK_OPACITY = 0.7;

/** Width of the top card for a given screen width. */
export function reviewStackCardWidth(screenWidth: number): number {
  return Math.min(screenWidth - 2 * tokens.space[6], MAX_CARD_WIDTH);
}

// ─────────────────────────────────────────────────────────────────────────────
// Top card — owns the drag; one instance per idea (keyed by the parent).
// ─────────────────────────────────────────────────────────────────────────────

interface TopCardHandle {
  /** Fly the card out as if swiped (`favorite` = right). No-op mid-flight. */
  decide: (favorite: boolean) => void;
}

interface TopCardProps {
  item: ReviewStackItem;
  width: number;
  height: number;
  locale: IdeaLocale;
  /** 0 at rest → 1 at the commit distance; the peek card reads it. */
  progress: SharedValue<number>;
  reduceMotion: boolean;
  onDecision: (item: ReviewStackItem, favorite: boolean) => void;
  onOpen: (item: ReviewStackItem) => void;
  ref?: Ref<TopCardHandle>;
}

function TopCard({
  item,
  width,
  height,
  locale,
  progress,
  reduceMotion,
  onDecision,
  onOpen,
  ref,
}: TopCardProps) {
  const { t } = useT();
  const { width: screenW } = useWindowDimensions();
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  // True from launch until unmount — a second swipe/press mid-flight would
  // otherwise fire the decision twice.
  const busy = useSharedValue(false);

  const commit = width * COMMIT_RATIO;
  // Past the screen edge on either side, whatever the card's position.
  const flyDistance = screenW + width;
  const flyMs = reduceMotion ? 0 : FLY_MS;

  // Deal in: the previous top left `progress` at 1 (its peek grew to the top
  // pose); this card IS that pose now, so the fresh peek behind it settles
  // from 1 back to 0.
  useEffect(() => {
    progress.value = withTiming(0, { duration: reduceMotion ? 0 : DEAL_MS });
  }, [progress, reduceMotion]);

  const finish = useCallback(
    (favorite: boolean) => {
      Haptics.selectionAsync().catch(() => {});
      onDecision(item, favorite);
    },
    [item, onDecision],
  );

  const launch = useCallback(
    (favorite: boolean) => {
      if (busy.value) return;
      busy.value = true;
      const dir = favorite ? 1 : -1;
      progress.value = withTiming(1, { duration: flyMs });
      ty.value = withTiming(ty.value - 20, { duration: flyMs });
      tx.value = withTiming(
        dir * flyDistance,
        { duration: flyMs, easing: Easing.in(Easing.quad) },
        (finished) => {
          if (finished) runOnJS(finish)(favorite);
        },
      );
    },
    [busy, progress, ty, tx, flyMs, flyDistance, finish],
  );

  useImperativeHandle(ref, () => ({ decide: launch }), [launch]);

  const open = useCallback(() => onOpen(item), [onOpen, item]);

  // Taps still reach the card's Pressable (flip) — the pan only engages after
  // a clear horizontal pull, and a vertical pull hands the touch back to the
  // list the stack sits in (TaskCard idiom).
  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-14, 14])
    .onUpdate((e) => {
      if (busy.value) return;
      tx.value = e.translationX;
      ty.value = e.translationY * DRAG_Y_FOLLOW;
      progress.value = Math.min(1, Math.abs(e.translationX) / commit);
    })
    .onEnd((e) => {
      if (busy.value) return;
      const x = e.translationX;
      const flick = Math.abs(e.velocityX) > COMMIT_VELOCITY;
      if (x > commit || (flick && e.velocityX > 0 && x > 0)) {
        runOnJS(launch)(true);
      } else if (x < -commit || (flick && e.velocityX < 0 && x < 0)) {
        runOnJS(launch)(false);
      } else {
        tx.value = withSpring(0, tokens.motion.springSnappy);
        ty.value = withSpring(0, tokens.motion.springSnappy);
        progress.value = withSpring(0, tokens.motion.springSnappy);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      {
        rotateZ: `${interpolate(
          tx.value,
          [-width, 0, width],
          [-MAX_ROTATE_DEG, 0, MAX_ROTATE_DEG],
          Extrapolation.CLAMP,
        )}deg`,
      },
    ],
  }));
  const keepStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [0, commit * 0.9], [0, 1], Extrapolation.CLAMP),
  }));
  const releaseStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [-commit * 0.9, 0], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.top, { width, height }, cardStyle]}>
        <IdeaCard
          data={item.card}
          width={width}
          locale={locale}
          collected
          kicker={item.kicker || undefined}
          onOpen={open}
          openAffordance="corner"
        />
        {/* Stamps — fade in with the drag; never catch touches. */}
        <Animated.View
          pointerEvents="none"
          style={[styles.stamp, styles.stampKeep, keepStampStyle]}
        >
          <Ionicons name="star" size={14} color={tokens.brand.violet2} />
          <Text style={[styles.stampText, styles.stampKeepText]}>
            {t('learning.ideas.review.keep')}
          </Text>
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[styles.stamp, styles.stampRelease, releaseStampStyle]}
        >
          <Ionicons name="leaf-outline" size={14} color={tokens.text.mid} />
          <Text style={[styles.stampText, styles.stampReleaseText]}>
            {t('learning.ideas.review.release')}
          </Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Peek — the next card, dimmed and pushed back, growing into place.
// ─────────────────────────────────────────────────────────────────────────────

interface PeekCardProps {
  item: ReviewStackItem;
  width: number;
  height: number;
  locale: IdeaLocale;
  progress: SharedValue<number>;
}

const PeekCard = memo(function PeekCard({
  item,
  width,
  height,
  locale,
  progress,
}: PeekCardProps) {
  const peekStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [PEEK_OPACITY, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [PEEK_OFFSET_Y, 0], Extrapolation.CLAMP) },
      { scale: interpolate(progress.value, [0, 1], [PEEK_SCALE, 1], Extrapolation.CLAMP) },
    ],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.peek, { width, height }, peekStyle]}>
      <IdeaCard
        data={item.card}
        width={width}
        locale={locale}
        collected
        kicker={item.kicker || undefined}
        disabled
      />
    </Animated.View>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// The stack
// ─────────────────────────────────────────────────────────────────────────────

export function ReviewStack({ items, locale, onDecision, onOpen }: Props) {
  const { t } = useT();
  const { width: screenW } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const width = reviewStackCardWidth(screenW);
  const height = ideaCardHeight(width);
  const progress = useSharedValue(0);
  const topRef = useRef<TopCardHandle>(null);

  // Decisions made on this mount — the counter's numerator. `total` adds the
  // remaining pile, so a pile that grows while open (a refetch) just extends
  // the count instead of jumping.
  const [done, setDone] = useState(0);

  const handleDecision = useCallback(
    (item: ReviewStackItem, favorite: boolean) => {
      setDone((n) => n + 1);
      onDecision(item, favorite);
    },
    [onDecision],
  );

  const top = items[0];
  const peek = items[1];
  if (!top) return null;

  const total = done + items.length;
  const n = Math.min(done + 1, total);

  return (
    <View style={styles.root}>
      <Text style={styles.counter}>{t('learning.ideas.review.progress', { n, total })}</Text>

      <View style={[styles.deck, { width, height: height + PEEK_OFFSET_Y }]}>
        {peek && (
          <PeekCard
            key={`${peek.card.materialId}:${peek.card.id}`}
            item={peek}
            width={width}
            height={height}
            locale={locale}
            progress={progress}
          />
        )}
        <TopCard
          key={`${top.card.materialId}:${top.card.id}`}
          ref={topRef}
          item={top}
          width={width}
          height={height}
          locale={locale}
          progress={progress}
          reduceMotion={reduceMotion}
          onDecision={handleDecision}
          onOpen={onOpen}
        />
      </View>

      <Text style={styles.hint}>{t('learning.ideas.review.hint')}</Text>

      {/* Buttons — the same decision without the drag. */}
      <View style={[styles.actions, { width }]}>
        <Pressable
          onPress={() => topRef.current?.decide(false)}
          accessibilityRole="button"
          accessibilityLabel={t('learning.ideas.review.a11yRelease')}
          style={({ pressed }) => [styles.btn, styles.btnRelease, pressed && styles.pressed]}
        >
          <Ionicons name="close" size={16} color={tokens.text.mid} />
          <Text style={styles.btnReleaseText}>{t('learning.ideas.review.release')}</Text>
        </Pressable>
        <Pressable
          onPress={() => topRef.current?.decide(true)}
          accessibilityRole="button"
          accessibilityLabel={t('learning.ideas.review.a11yKeep')}
          style={({ pressed }) => [styles.btn, styles.btnKeep, pressed && styles.pressed]}
        >
          <LinearGradient
            colors={tokens.gradient.coinBtn}
            locations={tokens.gradient.coinBtnLocations}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="star" size={16} color={tokens.bg.deep} />
          <Text style={styles.btnKeepText}>{t('learning.ideas.review.keep')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: tokens.space[3],
    paddingTop: tokens.space[1],
    paddingBottom: tokens.space[2],
  },
  counter: {
    ...tokens.type.eyebrow,
    color: tokens.semantic.coinLight,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  deck: {
    position: 'relative',
  },
  peek: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  /** Rotated label over the card — the drag's verdict before release. */
  stamp: {
    position: 'absolute',
    top: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: tokens.radius.sm,
    borderWidth: 2,
  },
  stampKeep: {
    left: 14,
    transform: [{ rotateZ: '-12deg' }],
    backgroundColor: 'rgba(123, 92, 255, 0.22)',
    borderColor: tokens.brand.violet2,
  },
  stampRelease: {
    right: 14,
    transform: [{ rotateZ: '12deg' }],
    backgroundColor: 'rgba(10, 14, 38, 0.72)',
    borderColor: tokens.text.mid,
  },
  stampText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  stampKeepText: {
    color: tokens.brand.violet2,
  },
  stampReleaseText: {
    color: tokens.text.mid,
  },
  hint: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12.5,
    lineHeight: 17,
    color: tokens.text.mid,
    textAlign: 'center',
    paddingHorizontal: tokens.space[4],
  },
  actions: {
    flexDirection: 'row',
    gap: tokens.space[3],
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: tokens.radius.pill,
    overflow: 'hidden',
  },
  btnRelease: {
    backgroundColor: tokens.bg.glass,
    borderWidth: 1,
    borderColor: tokens.border.strong,
  },
  btnReleaseText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: tokens.text.mid,
  },
  btnKeep: {
    ...tokens.shadow.coinGlowSoft,
  },
  btnKeepText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: tokens.bg.deep,
  },
  pressed: {
    opacity: 0.85,
  },
});
