import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { tokens } from '@/theme';

/**
 * Page 3 visual — an idea card caught mid-flip. The front is the hook
 * (kicker · title · "vire o card"), the back is the usable answer with its
 * source and the gold "Absorvida" rim the real card gets.
 *
 * While the page is on screen the card flips front → back → front on a
 * slow loop. Reduced motion (and before the page is first shown) parks it
 * at a fixed tilt so it still reads as "a card that turns".
 *
 * Each face hides itself past 90° by OPACITY as well as backfaceVisibility:
 * Android's backface culling on rotateY is not reliable on every device.
 */

const TILT = -24;
const FLIP_MS = 760;

export function IdeaFlipVisual({ width, active }: { width: number; active: boolean }) {
  const { t } = useT();
  const meta = useMetaLookup();
  const reduceMotion = useReducedMotion();
  const mind = meta.dim('mind');

  const cardW = Math.min(width, 250);
  const cardH = Math.round(cardW * 1.18);
  // The back carries the longest text; a small card steps its size down.
  const compact = cardW < 230;

  const rot = useSharedValue(TILT);

  useEffect(() => {
    if (reduceMotion || !active) {
      cancelAnimation(rot);
      if (reduceMotion) rot.value = TILT;
      return;
    }
    const ease = Easing.inOut(Easing.cubic);
    rot.value = withSequence(
      withTiming(0, { duration: 420, easing: ease }),
      withRepeat(
        withSequence(
          withDelay(1500, withTiming(180, { duration: FLIP_MS, easing: ease })),
          withDelay(2600, withTiming(360, { duration: FLIP_MS, easing: ease })),
        ),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(rot);
  }, [active, reduceMotion, rot]);

  const frontStyle = useAnimatedStyle(() => {
    const a = ((rot.value % 360) + 360) % 360;
    const visible = a < 90 || a > 270;
    return {
      opacity: visible ? 1 : 0,
      transform: [{ perspective: 900 }, { rotateY: `${rot.value}deg` }],
    };
  });
  const backStyle = useAnimatedStyle(() => {
    const a = (((rot.value + 180) % 360) + 360) % 360;
    const visible = a < 90 || a > 270;
    return {
      opacity: visible ? 1 : 0,
      transform: [{ perspective: 900 }, { rotateY: `${rot.value + 180}deg` }],
    };
  });

  return (
    <View
      style={[styles.stage, { height: cardH + 8 }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('tour.intro.learning.artA11y')}
    >
      {/* Front — the hook. */}
      <Animated.View style={[styles.face, { width: cardW, height: cardH }, frontStyle]}>
        <LinearGradient
          colors={[mind.bg, tokens.bg.surface2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.art}
        >
          <Ionicons name="book-outline" size={34} color={mind.color} />
        </LinearGradient>
        <View style={styles.faceBody}>
          <Text style={[styles.kicker, { color: mind.color }]} numberOfLines={1}>
            {mind.label}
            {' · '}
            {t('learning.ideas.ideaOf', { n: 1, total: 3 })}
          </Text>
          <Text style={styles.cardTitle} numberOfLines={3}>
            {t('tour.intro.learning.cardTitle')}
          </Text>
          <View style={styles.hintRow}>
            <Ionicons name="sync" size={14} color={tokens.text.dim} />
            <Text style={styles.hint}>{t('tour.intro.learning.cardHint')}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Back — the answer, absorbed. */}
      <Animated.View
        style={[styles.face, styles.back, { width: cardW, height: cardH }, backStyle]}
      >
        <View style={styles.absorbedBadge}>
          <Ionicons name="checkmark-circle" size={16} color={tokens.semantic.coin} />
          <Text style={styles.absorbedText}>{t('tour.intro.learning.absorbed')}</Text>
        </View>
        <Text style={[styles.backText, compact && styles.backTextCompact]}>
          {t('tour.intro.learning.cardBack')}
        </Text>
        <View style={styles.sourceRow}>
          <Ionicons name="document-text-outline" size={14} color={tokens.text.dim} />
          <Text style={styles.source} numberOfLines={2}>
            {t('tour.intro.learning.cardSource')}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  face: {
    position: 'absolute',
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.border.strong,
    backgroundColor: tokens.bg.surface,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
    ...tokens.shadow.deep,
  },
  art: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceBody: {
    padding: tokens.space[4],
    gap: tokens.space[2],
  },
  kicker: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  cardTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 18,
    lineHeight: 23,
    color: tokens.text.hi,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hint: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    lineHeight: 16,
    color: tokens.text.dim,
  },
  back: {
    borderColor: tokens.semantic.coinRim,
    borderWidth: 1.5,
    padding: tokens.space[4],
    justifyContent: 'space-between',
  },
  absorbedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: tokens.space[2],
    paddingVertical: 4,
    borderRadius: tokens.radius.pill,
    backgroundColor: 'rgba(255, 200, 61, 0.14)',
  },
  absorbedText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    lineHeight: 16,
    color: tokens.semantic.coinLight,
  },
  backText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    lineHeight: 23,
    color: tokens.text.hi,
  },
  backTextCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  source: {
    flex: 1,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    lineHeight: 17,
    color: tokens.text.dim,
  },
});
