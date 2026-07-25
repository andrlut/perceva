import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

import { PercevaGlyph } from './PercevaGlyph';

interface Props {
  visible: boolean;
  /** Practices completed today (any recurrence). */
  doneCount: number;
  /** Practices explicitly skipped today. */
  skippedCount: number;
  /** Total XP earned from today's completions. 0 hides the stat. */
  xpToday: number;
  onClose: () => void;
}

/** Gold celebration palette — same trio as the Vault buy celebration. */
const GOLD = ['#FFE890', '#FFC83D', '#C8881C'] as const;

/** Radial burst geometry — pure reanimated (no confetti lib, OTA-safe). */
const BURST_COUNT = 12;
/** Square stage the dots travel inside; the glyph tile sits at its center. */
const BURST_AREA = 148;

/**
 * One gold dot of the radial burst: staggered by index, it flies outward
 * from the glyph center along its fixed angle while fading and shrinking.
 */
function BurstDot({ index, visible }: { index: number; visible: boolean }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      progress.value = 0;
      progress.value = withDelay(
        160 + index * 35,
        withTiming(1, { duration: 640, easing: Easing.out(Easing.cubic) }),
      );
    } else {
      progress.value = 0;
    }
  }, [visible, index, progress]);

  const angle = (index / BURST_COUNT) * Math.PI * 2;
  // Alternate radii + sizes so the burst reads organic, not geometric.
  const dist = index % 2 === 0 ? 78 : 58;
  const size = index % 3 === 0 ? 8 : 5;
  const color = GOLD[index % GOLD.length];

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.12, 1], [0, 1, 0]),
    transform: [
      { translateX: Math.cos(angle) * dist * progress.value },
      { translateY: Math.sin(angle) * dist * progress.value },
      { scale: interpolate(progress.value, [0, 1], [1, 0.35]) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: (BURST_AREA - size) / 2,
          left: (BURST_AREA - size) / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

/**
 * "Day cleared" celebration — fires once per day when the user finishes
 * (or consciously skips) every recurring practice due today. Gold-vault
 * aesthetic: dark scrim, gold-rimmed card, the Perceva glyph pops in with
 * a spring while a reanimated radial burst of gold dots flies outward.
 *
 * Two copy variants: the default triumphant one, and a gentler one when
 * the day was cleared purely by skipping (0 completions) — skipping is a
 * decision too, no guilt.
 *
 * Visible state is owned by the parent; this component just renders.
 */
export function DayClearedCelebration({
  visible,
  doneCount,
  skippedCount,
  xpToday,
  onClose,
}: Props) {
  const { t } = useT();

  // Card-level entry animation (fade + slide up) — same grammar as
  // BuyCelebrationModal so celebrations feel like one family.
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(20);
  // Glyph tile entry — delayed spring scale-in for the "pop".
  const glyphScale = useSharedValue(0.4);

  useEffect(() => {
    if (visible) {
      cardOpacity.value = withTiming(1, { duration: 220 });
      cardTranslateY.value = withSpring(0, { damping: 18, stiffness: 180 });
      glyphScale.value = withDelay(
        80,
        withSequence(
          withSpring(1.1, { damping: 8, stiffness: 200 }),
          withSpring(1, { damping: 12, stiffness: 180 }),
        ),
      );
    } else {
      // Reset for the next open. No exit animation — Modal's own fade
      // handles dismissal smoothly enough.
      cardOpacity.value = 0;
      cardTranslateY.value = 20;
      glyphScale.value = 0.4;
    }
  }, [visible, cardOpacity, cardTranslateY, glyphScale]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const glyphStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glyphScale.value }],
  }));

  // All-skipped day: the contract was honored purely with skips.
  const allSkipped = doneCount === 0 && skippedCount > 0;

  const statParts: string[] = [];
  if (doneCount > 0) {
    statParts.push(t('home.dayCleared.statsDone', { count: doneCount }));
  }
  if (skippedCount > 0) {
    statParts.push(t('home.dayCleared.statsSkipped', { count: skippedCount }));
  }
  if (xpToday > 0) {
    statParts.push(t('home.dayCleared.statsXp', { xp: xpToday }));
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.scrim} onPress={onClose}>
        <Animated.View style={[styles.cardWrap, cardStyle]}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.card}>
            {/* Warm gold-over-night gradient — the "completed" state of
                the day, same base as the Vault celebration. */}
            <LinearGradient
              colors={['rgba(60,45,20,0.95)', 'rgba(20,24,60,0.98)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            {/* Gold wash at the top edge */}
            <LinearGradient
              colors={['rgba(255,200,61,0.16)', 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              locations={[0, 0.4]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            <View style={styles.content}>
              {/* Glyph centerpiece + radial gold burst */}
              <View style={styles.burstArea}>
                {Array.from({ length: BURST_COUNT }, (_, i) => (
                  <BurstDot key={i} index={i} visible={visible} />
                ))}
                <Animated.View style={[styles.glyphTile, glyphStyle]}>
                  <PercevaGlyph
                    size={64}
                    bare
                    palette="gilded"
                    idSuffix="day-cleared"
                  />
                </Animated.View>
              </View>

              {/* Title + body — variant by how the day was cleared */}
              <Text style={styles.title}>
                {allSkipped
                  ? t('home.dayCleared.allSkippedTitle')
                  : t('home.dayCleared.title')}
              </Text>
              <Text style={styles.body}>
                {allSkipped
                  ? t('home.dayCleared.allSkippedBody')
                  : t('home.dayCleared.body')}
              </Text>

              {/* Stats row: X done · Y skipped · +Z XP */}
              {statParts.length > 0 && (
                <View style={styles.statsRow}>
                  <Text style={styles.statsText}>
                    {statParts.join('  ·  ')}
                  </Text>
                </View>
              )}

              {/* Single gold CTA */}
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && { opacity: 0.85 },
                ]}
                accessibilityRole="button"
              >
                <LinearGradient
                  colors={[...GOLD]}
                  locations={[0, 0.5, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.primaryText}>
                  {t('home.dayCleared.cta').toUpperCase()}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.space[5],
  },
  cardWrap: {
    width: '100%',
    maxWidth: 360,
  },
  card: {
    position: 'relative',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 61, 0.55)',
    overflow: 'hidden',
  },
  content: {
    padding: tokens.space[5],
    alignItems: 'center',
    gap: tokens.space[3],
  },
  burstArea: {
    width: BURST_AREA,
    height: BURST_AREA,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphTile: {
    width: 96,
    height: 96,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 61, 0.55)',
    backgroundColor: 'rgba(255, 200, 61, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 24,
    lineHeight: 28,
    textAlign: 'center',
    color: tokens.text.hi,
    paddingHorizontal: tokens.space[2],
  },
  body: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: tokens.text.mid,
    paddingHorizontal: tokens.space[3],
  },
  statsRow: {
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[2],
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 61, 0.25)',
    backgroundColor: 'rgba(255, 200, 61, 0.08)',
  },
  statsText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: '#FFE3A6',
    letterSpacing: 0.3,
  },
  primaryBtn: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.space[3],
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,224,138,0.55)',
    overflow: 'hidden',
    marginTop: tokens.space[2],
  },
  primaryText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    letterSpacing: 0.7,
    color: '#3D2A00',
  },
});
