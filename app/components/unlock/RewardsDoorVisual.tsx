import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { CoinIcon } from '@/components/CoinIcon';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

Animated.addWhitelistedNativeProps({ text: true });
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

/** One loop, in seconds of a 0→1 progress. Four beats, then it repeats. */
const LOOP_MS = 4000;
const START_COINS = 12;
const PRACTICE_COINS = 8;
const REWARD_PRICE = 20;

/**
 * Door animation for Recompensas (doc "Onboarding simples", Fase 2, decisão
 * (a): animação em código, componentes reais). Scripted, not recorded, so
 * the fields fill at demonstration pace:
 *
 *   1. a practice gets ticked           → "+8" floats up to the wallet
 *   2. the wallet counts 12 → 20
 *   3. a reward you defined lights up   → "Resgatar" is affordable
 *   4. redeemed: the wallet pays, the reward checks off
 *
 * Numbers are illustrative; everything is text and views, so it follows
 * the theme and any redesign for free.
 */
export function RewardsDoorVisual({ width }: { width: number }) {
  const { t } = useT();
  const reduceMotion = useReducedMotion();
  const p = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      p.value = 0.62; // the "affordable reward" beat, static
      return;
    }
    p.value = 0;
    p.value = withRepeat(withTiming(1, { duration: LOOP_MS, easing: Easing.linear }), -1, false);
  }, [p, reduceMotion]);

  // Beat 1 — tick + floating coins
  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(p.value, [0.04, 0.16], [0, 1], 'clamp') }],
    opacity: interpolate(p.value, [0.04, 0.1, 0.9, 1], [0, 1, 1, 0], 'clamp'),
  }));
  const floatStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.16, 0.2, 0.36, 0.42], [0, 1, 1, 0], 'clamp'),
    transform: [{ translateY: interpolate(p.value, [0.16, 0.42], [0, -44], 'clamp') }],
  }));

  // Beat 2 + 4 — the wallet counts up, then pays
  const walletProps = useAnimatedProps(() => {
    const up = interpolate(
      p.value,
      [0.24, 0.42],
      [START_COINS, START_COINS + PRACTICE_COINS],
      'clamp',
    );
    const paid = interpolate(p.value, [0.76, 0.9], [0, REWARD_PRICE], 'clamp');
    const value = Math.max(0, Math.round(up - paid));
    // `text` is a native TextInput prop (whitelisted above), not a React one.
    return { text: String(value) } as unknown as Partial<TextInputProps>;
  });

  // Beat 3 — the reward becomes affordable
  const rewardStyle = useAnimatedStyle(() => {
    const glow = interpolate(p.value, [0.46, 0.58, 0.9, 0.98], [0, 1, 1, 0], 'clamp');
    return {
      borderColor: `rgba(255, 200, 61, ${0.14 + 0.5 * glow})`,
      transform: [{ scale: 1 + 0.02 * glow }],
    };
  });
  const redeemStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.46, 0.58, 0.76, 0.8], [0.35, 1, 1, 0.35], 'clamp'),
  }));
  const redeemedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.78, 0.86, 0.96, 1], [0, 1, 1, 0], 'clamp'),
    transform: [{ scale: interpolate(p.value, [0.78, 0.86], [0.6, 1], 'clamp') }],
  }));

  return (
    <View style={[styles.root, { width }]}>
      {/* Wallet */}
      <View style={styles.wallet}>
        <CoinIcon size={18} />
        <AnimatedTextInput
          editable={false}
          underlineColorAndroid="transparent"
          defaultValue={String(START_COINS)}
          animatedProps={walletProps}
          style={styles.walletText}
        />
        <Text style={styles.walletLabel}>{t('unlock.visual.wallet')}</Text>
      </View>

      {/* Practice row */}
      <View style={styles.row}>
        <View style={styles.checkbox}>
          <Animated.View style={checkStyle}>
            <Ionicons name="checkmark" size={16} color={tokens.bg.deep} />
          </Animated.View>
        </View>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {t('unlock.visual.practice')}
        </Text>
        <View style={styles.coinChip}>
          <CoinIcon size={12} />
          <Text style={styles.coinChipText}>+{PRACTICE_COINS}</Text>
        </View>
        <Animated.View style={[styles.float, floatStyle]} pointerEvents="none">
          <CoinIcon size={12} />
          <Text style={styles.floatText}>+{PRACTICE_COINS}</Text>
        </Animated.View>
      </View>

      {/* Reward card */}
      <Animated.View style={[styles.reward, rewardStyle]}>
        <View style={styles.rewardIcon}>
          <Ionicons name="film-outline" size={18} color={tokens.semantic.coinLight} />
        </View>
        <View style={styles.rewardBody}>
          <Text style={styles.rewardTitle} numberOfLines={1}>
            {t('unlock.visual.reward')}
          </Text>
          <View style={styles.rewardPrice}>
            <CoinIcon size={12} />
            <Text style={styles.rewardPriceText}>{REWARD_PRICE}</Text>
          </View>
        </View>
        <View style={styles.redeemSlot}>
          <Animated.View style={[styles.redeem, redeemStyle]}>
            <Text style={styles.redeemText}>{t('unlock.visual.redeem')}</Text>
          </Animated.View>
          <Animated.View style={[styles.redeemed, redeemedStyle]} pointerEvents="none">
            <Ionicons name="checkmark-circle" size={26} color={tokens.semantic.coin} />
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: tokens.space[3] },
  wallet: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: tokens.semantic.coinRim,
  },
  walletText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 16,
    color: tokens.semantic.coinLight,
    padding: 0,
    minWidth: 24,
    textAlign: 'right',
  },
  walletLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: tokens.text.mid,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: tokens.semantic.xp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    flex: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    color: tokens.text.hi,
  },
  coinChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: tokens.radius.pill,
    backgroundColor: 'rgba(255, 200, 61, 0.12)',
  },
  coinChipText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    color: tokens.semantic.coinLight,
  },
  float: {
    position: 'absolute',
    right: 14,
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  floatText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: tokens.semantic.coin,
  },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 200, 61, 0.14)',
  },
  rewardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 200, 61, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardBody: { flex: 1, gap: 2 },
  rewardTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    color: tokens.text.hi,
  },
  rewardPrice: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rewardPriceText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: tokens.text.mid,
  },
  redeemSlot: { width: 92, alignItems: 'flex-end', justifyContent: 'center' },
  redeem: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.semantic.coin,
  },
  redeemText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    color: tokens.bg.deep,
  },
  redeemed: { position: 'absolute', right: 30 },
});
