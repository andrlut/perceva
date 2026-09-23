import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppIcon } from '@/components/AppIcon';
import type { Reward } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';
import { REWARD_CATEGORY_META } from '@/theme/rewards';

import { CoinIcon } from './CoinIcon';
import { PercevaGlyph } from './PercevaGlyph';

interface Props {
  visible: boolean;
  reward: Reward | null;
  /** How many units were bought in this batch. Drives the "Comprou Nx X"
   *  copy. Defaults to 1 for the solo-buy path. */
  qty?: number;
  /** Total coins debited (sum across the qty units). */
  costPaid: number;
  onClose: () => void;
  /** Take the whole purchase back (refund) and close — the one-tap regret. */
  onUndo: () => void;
}

/**
 * Celebration modal that fires after a redemption. A redemption is a use,
 * so there is nothing left to do but enjoy it: the gold primary closes,
 * the ghost "Desfazer" takes it back.
 *
 * Replaces the default `Alert.alert` success path (ugly system dialog that
 * breaks the gold/vault aesthetic): dark scrim, gold-rimmed card centered,
 * the reward icon scales in with a spring, the title fades up.
 *
 * The reward icon and category accent use the reward's category color so
 * the celebration carries the same identity as the card the user tapped.
 *
 * Visible state is owned by the parent; this component just renders.
 */
export function BuyCelebrationModal({
  visible,
  reward,
  qty = 1,
  costPaid,
  onClose,
  onUndo,
}: Props) {
  const { t } = useT();

  // Card-level entry animation (fade + slide up).
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(20);
  // Reward icon entry animation (delayed spring scale-in for the "pop").
  const iconScale = useSharedValue(0.4);

  useEffect(() => {
    if (visible) {
      cardOpacity.value = withTiming(1, { duration: 220 });
      cardTranslateY.value = withSpring(0, { damping: 18, stiffness: 180 });
      iconScale.value = withDelay(
        80,
        withSequence(
          withSpring(1.1, { damping: 8, stiffness: 200 }),
          withSpring(1, { damping: 12, stiffness: 180 }),
        ),
      );
    } else {
      // Reset for the next open. No exit animation — Modal's own fade
      // animation handles dismissal smoothly enough.
      cardOpacity.value = 0;
      cardTranslateY.value = 20;
      iconScale.value = 0.4;
    }
  }, [visible, cardOpacity, cardTranslateY, iconScale]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  // Guard: if no reward, render nothing inside (Modal still respects
  // visible). Avoids crashing on the cat lookup when state is mid-clear.
  if (!reward) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.scrim} />
      </Modal>
    );
  }

  const cat = REWARD_CATEGORY_META[reward.category];

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
            {/* Background — warm gold gradient like the affordable card,
                so the celebration reads as the "completed" state of that
                same visual language. */}
            <LinearGradient
              colors={tokens.gradient.celebrationCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            {/* Category-tinted wash at the top edge */}
            <LinearGradient
              colors={[`${cat.color}26`, 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              locations={[0, 0.4]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            {/* Faint engraved glyph behind the icon */}
            <View style={styles.glyphWrap} pointerEvents="none">
              <PercevaGlyph
                size={180}
                bare
                palette="gilded"
                idSuffix={`celeb-${reward.id}`}
              />
            </View>

            <View style={styles.content}>
              {/* Eyebrow */}
              <Text style={styles.eyebrow}>{t('rewards.celebration.eyebrow')}</Text>

              {/* Big icon — spring-scales in */}
              <Animated.View
                style={[
                  styles.iconTile,
                  iconStyle,
                  {
                    borderColor: `${cat.color}90`,
                    backgroundColor: `${cat.color}26`,
                  },
                ]}
              >
                <AppIcon name={reward.icon} size={48} color={cat.color} />
              </Animated.View>

              {/* Title */}
              <Text style={styles.title} numberOfLines={2}>
                {qty > 1
                  ? t('rewards.celebration.titleN', { qty, title: reward.title })
                  : t('rewards.celebration.title', { title: reward.title })}
              </Text>

              {/* Cost line */}
              <View style={styles.costRow}>
                <CoinIcon size={16} />
                <Text style={styles.costText}>
                  −{costPaid.toLocaleString()}
                </Text>
              </View>

              {/* CTAs: the gold primary just closes (it is done — enjoy);
                  the ghost takes the purchase back. */}
              <View style={styles.actions}>
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && { opacity: 0.85 },
                  ]}
                  accessibilityRole="button"
                >
                  <LinearGradient
                    colors={tokens.gradient.coinBtn as [string, string, string]}
                    locations={[0, 0.5, 1]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <Ionicons name="sparkles" size={14} color="#3D2A00" />
                  <Text style={styles.primaryText}>
                    {t('rewards.celebration.enjoy').toUpperCase()}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={onUndo}
                  style={({ pressed }) => [
                    styles.ghostBtn,
                    pressed && { opacity: 0.6 },
                  ]}
                  accessibilityRole="button"
                >
                  <Text style={styles.ghostText}>
                    {t('rewards.celebration.undo')}
                  </Text>
                </Pressable>
              </View>
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
    borderColor: tokens.semantic.coinRim,
    overflow: 'hidden',
  },
  glyphWrap: {
    position: 'absolute',
    right: -40,
    bottom: -30,
    width: 180,
    height: 180,
    opacity: 0.08,
  },
  content: {
    padding: tokens.space[5],
    alignItems: 'center',
    gap: tokens.space[3],
  },
  eyebrow: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    letterSpacing: 1.6,
    color: tokens.semantic.coinLight,
  },
  iconTile: {
    width: 96,
    height: 96,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: tokens.space[2],
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 22,
    lineHeight: 26,
    textAlign: 'center',
    color: tokens.text.hi,
    paddingHorizontal: tokens.space[2],
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  costText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 18,
    color: tokens.semantic.coinLight,
  },
  actions: {
    width: '100%',
    gap: tokens.space[2],
    marginTop: tokens.space[3],
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: tokens.space[3],
    borderRadius: 999,
    borderWidth: 1,
    borderColor: tokens.semantic.coinRim,
    overflow: 'hidden',
  },
  primaryText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    letterSpacing: 0.7,
    color: '#3D2A00',
  },
  ghostBtn: {
    paddingVertical: tokens.space[2],
    alignItems: 'center',
  },
  ghostText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.text.mid,
  },
});
