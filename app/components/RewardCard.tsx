import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import type { Reward } from '@/lib/db/types';
import { tokens } from '@/theme';
import { REWARD_CATEGORY_META } from '@/theme/rewards';

import { CoinIcon } from './CoinIcon';
import { ProgressBar } from './ProgressBar';

interface Props {
  reward: Reward;
  affordable: boolean;
  /** Coins still needed to afford this reward (used in the disabled button label). */
  deficit?: number;
  /** Current player coin balance — drives the inline progress bar. */
  coins: number;
  /** True if this reward is the user's currently tracked one. */
  tracked?: boolean;
  onRedeem: () => void;
  onEdit?: () => void;
  onLongPress?: () => void;
  /** Called when the user taps SAVE on a non-affordable, non-tracked card. */
  onTrack?: () => void;
  /** Called when the user taps UNTRACK on the currently-tracked card. */
  onUntrack?: () => void;
  isRedeeming?: boolean;
}

type BadgeKind =
  | 'tracking'
  | 'buy_now'
  | 'almost'
  | 'big_goal'
  | 'category';

interface BadgeInfo {
  kind: BadgeKind;
  label: string;
  color: string;
  bg: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

const ALMOST_THRESHOLD = 500;
const BIG_GOAL_THRESHOLD = 2500;

function pickBadge(opts: {
  reward: Reward;
  affordable: boolean;
  deficit: number;
  tracked: boolean;
  catColor: string;
  catBg: string;
}): BadgeInfo {
  const { reward, affordable, deficit, tracked, catColor, catBg } = opts;
  if (tracked) {
    return {
      kind: 'tracking',
      label: 'Tracking',
      color: tokens.semantic.coin2,
      bg: 'rgba(255, 224, 138, 0.18)',
      icon: 'bookmark',
    };
  }
  if (affordable) {
    return {
      kind: 'buy_now',
      label: 'Buy now',
      color: tokens.semantic.xp2,
      bg: 'rgba(111, 232, 170, 0.18)',
      icon: 'flash',
    };
  }
  if (deficit > 0 && deficit <= ALMOST_THRESHOLD) {
    return {
      kind: 'almost',
      label: 'Almost there',
      color: tokens.semantic.warn,
      bg: 'rgba(255, 159, 67, 0.18)',
      icon: 'trending-up',
    };
  }
  if (reward.cost >= BIG_GOAL_THRESHOLD) {
    return {
      kind: 'big_goal',
      label: 'Big goal',
      color: tokens.brand.violet2,
      bg: 'rgba(155, 130, 255, 0.18)',
      icon: 'rocket',
    };
  }
  return {
    kind: 'category',
    label: REWARD_CATEGORY_META[reward.category].short,
    color: catColor,
    bg: catBg,
  };
}

/**
 * Vertical reward card for the Shop grid. Surfaces "apego" (attachment) via:
 *
 * - A contextual badge top-right that names the card's role for the player
 *   (Tracking / Buy now / Almost there / Big goal / Category).
 * - A thin progress bar inside the body when the reward is unaffordable or
 *   actively tracked, so big-cost items don't feel like dead weight.
 * - A footer button whose label depends on the state — BUY (gradient gold)
 *   when affordable, UNTRACK when this is the tracked one, SAVE for new
 *   savings goals.
 */
export function RewardCard({
  reward,
  affordable,
  deficit = 0,
  coins,
  tracked = false,
  onRedeem,
  onEdit,
  onLongPress,
  onTrack,
  onUntrack,
  isRedeeming,
}: Props) {
  const cat = REWARD_CATEGORY_META[reward.category];
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, tokens.motion.springSnappy);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, tokens.motion.springBouncy);
  };
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const badge = pickBadge({
    reward,
    affordable,
    deficit,
    tracked,
    catColor: cat.color,
    catBg: cat.bg,
  });

  const showProgress = !affordable || tracked;

  // Footer affordance picks one of three actions:
  //   tracked → UNTRACK (subtle, removes pin)
  //   affordable → BUY (gold gradient, primary)
  //   else → SAVE (violet pill, sets the tracked reward)
  const footer = (() => {
    if (affordable) {
      return {
        kind: 'buy' as const,
        label: isRedeeming ? 'BUYING…' : 'BUY',
        onPress: onRedeem,
        disabled: isRedeeming,
      };
    }
    if (tracked) {
      return {
        kind: 'untrack' as const,
        label: 'UNTRACK',
        onPress: onUntrack,
        disabled: !onUntrack,
      };
    }
    return {
      kind: 'save' as const,
      label: 'SAVE',
      onPress: onTrack,
      disabled: !onTrack,
    };
  })();

  return (
    <View
      style={[
        styles.container,
        !affordable && !tracked && styles.containerDim,
        tracked && styles.containerTracked,
      ]}
    >
      <Pressable
        style={({ pressed }) => [styles.body, pressed && onEdit && { opacity: 0.7 }]}
        onPress={onEdit}
        onLongPress={onLongPress}
        disabled={!onEdit && !onLongPress}
      >
        <View style={styles.topRow}>
          <View style={[styles.iconWrap, { backgroundColor: cat.bg }]}>
            <Ionicons name={reward.icon as never} size={22} color={cat.color} />
          </View>
          <View
            style={[styles.badge, { backgroundColor: badge.bg }]}
            pointerEvents="none"
          >
            {badge.icon ? (
              <Ionicons name={badge.icon} size={10} color={badge.color} />
            ) : null}
            <Text style={[styles.badgeText, { color: badge.color }]} numberOfLines={1}>
              {badge.label}
            </Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {reward.title}
        </Text>
        {reward.description ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {reward.description}
          </Text>
        ) : null}

        {showProgress ? (
          <View style={styles.progressWrap}>
            <ProgressBar
              value={Math.min(coins, reward.cost)}
              max={reward.cost}
              color={tracked ? tokens.semantic.coin : cat.color}
              height={4}
            />
            <Text style={styles.progressLabel}>
              {affordable
                ? 'ready'
                : `${deficit.toLocaleString()} to go`}
            </Text>
          </View>
        ) : null}

        <View style={styles.costRow}>
          <CoinIcon size={13} />
          <Text style={[styles.cost, !affordable && { color: tokens.text.dim }]}>
            {reward.cost.toLocaleString()}
          </Text>
        </View>
      </Pressable>

      <Animated.View style={buttonStyle}>
        <Pressable
          onPress={footer.onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={footer.disabled}
          hitSlop={4}
        >
          {footer.kind === 'buy' ? (
            <LinearGradient
              colors={tokens.gradient.coinBtn}
              locations={tokens.gradient.coinBtnLocations}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[styles.actionButton, styles.actionBuy]}
            >
              <Text style={styles.actionBuyText}>{footer.label}</Text>
            </LinearGradient>
          ) : footer.kind === 'save' ? (
            <View style={[styles.actionButton, styles.actionSave]}>
              <Ionicons name="bookmark-outline" size={12} color={tokens.brand.violet2} />
              <Text style={styles.actionSaveText}>{footer.label}</Text>
            </View>
          ) : (
            <View style={[styles.actionButton, styles.actionUntrack]}>
              <Ionicons name="close" size={12} color={tokens.text.mid} />
              <Text style={styles.actionUntrackText}>{footer.label}</Text>
            </View>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.bg.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.border.base,
    padding: tokens.space[4],
    gap: tokens.space[2],
    minHeight: 188,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  containerDim: {
    opacity: 0.92,
  },
  containerTracked: {
    borderColor: 'rgba(255, 200, 61, 0.45)',
    backgroundColor: 'rgba(255, 200, 61, 0.05)',
  },
  body: {
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: tokens.space[2],
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: tokens.radius.pill,
    maxWidth: 100,
  },
  badgeText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 9,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    ...tokens.type.bodyLg,
    color: tokens.text.hi,
    fontFamily: 'Manrope_700Bold',
  },
  subtitle: {
    ...tokens.type.caption,
    color: tokens.text.mid,
  },
  progressWrap: {
    marginTop: 8,
    gap: 4,
  },
  progressLabel: {
    ...tokens.type.caption,
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    color: tokens.text.dim,
    letterSpacing: 0.3,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  cost: {
    ...tokens.type.body,
    color: tokens.semantic.coin,
    fontFamily: 'Manrope_800ExtraBold',
  },
  actionButton: {
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  actionBuy: {
    borderWidth: 1,
    borderColor: 'rgba(255, 235, 180, 0.4)',
    shadowColor: tokens.semantic.coin,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  actionBuyText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    color: '#3D2A00',
    letterSpacing: 0.6,
  },
  actionSave: {
    backgroundColor: 'rgba(155, 130, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(155, 130, 255, 0.32)',
  },
  actionSaveText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    color: tokens.brand.violet2,
    letterSpacing: 0.5,
  },
  actionUntrack: {
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  actionUntrackText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: tokens.text.mid,
    letterSpacing: 0.4,
  },
});
