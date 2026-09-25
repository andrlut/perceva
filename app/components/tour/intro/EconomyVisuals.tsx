import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { CoinIcon } from '@/components/CoinIcon';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { baseXpForDifficulty, type Difficulty } from '@/lib/xp';
import { tokens } from '@/theme';
import { SUB_META } from '@/theme/dimensions';

/**
 * Pages 4 and 5 of the method intro — the two dials of the economy.
 *
 * Every number is READ from `lib/xp.ts` (the client mirror of the server's
 * `base_xp_for_stars`), never typed into the copy, so a rebalance can't
 * leave the intro teaching a stale table. The worked example is the same
 * practice on both pages — "Meditar 10 minutos", Contemplar 2★ — so page 5
 * can show its coins as a function of the Dedicação page 4 just earned.
 *
 * Stars are written "2★", the notation the practice form's per-sub stepper
 * uses — the next screen (the starter pack) must read as the same thing.
 */

const STARS: Difficulty[] = [1, 2, 3, 4, 5];
export const EXAMPLE_SUB = 'contemplate' as const;
export const EXAMPLE_STARS: Difficulty = 2;

/** The five-step table: n★ → +XP in that sub-area's area. */
export function StarTable() {
  const { t } = useT();
  return (
    <View style={styles.table}>
      {STARS.map((n) => {
        const xp = baseXpForDifficulty(n);
        return (
          <View
            key={n}
            style={styles.cell}
            accessible
            accessibilityLabel={t('tour.intro.dedication.cellA11y', { stars: n, xp })}
          >
            <Text style={styles.cellStars}>
              {n}
              <Text style={styles.star}>★</Text>
            </Text>
            <Text style={styles.cellXp}>+{xp}</Text>
          </View>
        );
      })}
    </View>
  );
}

/** One practice, one sub-area, the arithmetic spelled out. */
export function DedicationExample() {
  const { t } = useT();
  const meta = useMetaLookup();
  const sub = meta.sub(EXAMPLE_SUB);
  const dim = meta.dim(SUB_META[EXAMPLE_SUB].dimensionId);
  const xp = baseXpForDifficulty(EXAMPLE_STARS);

  return (
    <View style={styles.exampleCard}>
      <Text style={styles.exampleLabel}>{t('tour.intro.dedication.exampleLabel')}</Text>
      <Text style={styles.exampleTitle}>{t('tour.intro.dedication.exampleTitle')}</Text>
      <View style={styles.exampleRow}>
        <View style={[styles.subChip, { backgroundColor: dim.bg }]}>
          <Ionicons
            name={SUB_META[EXAMPLE_SUB].iconName as keyof typeof Ionicons.glyphMap}
            size={14}
            color={dim.color}
          />
          <Text style={[styles.subChipText, { color: dim.color }]} numberOfLines={1}>
            {sub.label}
          </Text>
          <Text style={[styles.subChipStars, { color: dim.color }]}>
            {EXAMPLE_STARS}★
          </Text>
        </View>
        <Ionicons name="arrow-forward" size={16} color={tokens.text.dim} />
        <Text style={styles.gain} numberOfLines={2}>
          {t('tour.intro.dedication.exampleGain', { xp, area: dim.label })}
        </Text>
      </View>
    </View>
  );
}

const MULTIPLIERS = [
  { key: 'none', value: 0 },
  { key: 'half', value: 0.5 },
  { key: 'same', value: 1 },
  { key: 'double', value: 2 },
] as const;

/**
 * The coin dial for the example practice: the four choices with the coins
 * each would pay for the same +20 of Dedicação. "Igual" is the default.
 * Labels are the practice form's own (`tasks.coinMultiplier.*`).
 */
export function CoinDial() {
  const { t } = useT();
  const xp = baseXpForDifficulty(EXAMPLE_STARS);

  return (
    <View style={styles.dialCard}>
      <View style={styles.dialHeader}>
        <Text style={styles.dialTitle} numberOfLines={1}>
          {t('tour.intro.dedication.exampleTitle')}
        </Text>
        <Text style={styles.dialXp}>{t('tour.intro.coins.exampleDedication', { xp })}</Text>
      </View>
      <View style={styles.dialRow}>
        {MULTIPLIERS.map((m) => {
          const on = m.key === 'same';
          // Per sub, rounded half up — the same rule complete_task uses.
          const coins = Math.round(xp * m.value);
          const label = t(`tasks.coinMultiplier.${m.key}`);
          return (
            <View
              key={m.key}
              style={[styles.dialCell, on && styles.dialCellOn]}
              accessible
              accessibilityLabel={
                on
                  ? t('tour.intro.coins.dialA11yDefault', { label, coins })
                  : t('tour.intro.coins.dialA11y', { label, coins })
              }
            >
              <Text style={[styles.dialLabel, on && styles.dialLabelOn]} numberOfLines={1}>
                {label}
              </Text>
              <View style={styles.dialCoins}>
                <CoinIcon size={14} />
                <Text style={styles.dialCoinsText}>{coins}</Text>
              </View>
              {on ? (
                <Text style={styles.dialDefault} numberOfLines={1}>
                  {t('tour.intro.coins.default')}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const REWARDS = [
  { key: 'reward1', icon: 'film-outline', price: 120 },
  { key: 'reward2', icon: 'restaurant-outline', price: 300 },
  { key: 'reward3', icon: 'sunny-outline', price: 200 },
] as const;

/** Three rewards the user might create — their names, their prices. */
export function RewardSamples() {
  const { t } = useT();
  return (
    <View style={styles.rewards}>
      {REWARDS.map((r) => (
        <View key={r.key} style={styles.rewardCard}>
          <Ionicons name={r.icon} size={22} color={tokens.semantic.coinLight} />
          <Text style={styles.rewardName} numberOfLines={2}>
            {t(`tour.intro.coins.${r.key}`)}
          </Text>
          <View style={styles.rewardPrice}>
            <CoinIcon size={13} />
            <Text style={styles.rewardPriceText}>{r.price}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Star table ────────────────────────────────────────────────────────
  table: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: 6,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: tokens.space[3],
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.bg.glass,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  cellStars: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 16,
    lineHeight: 20,
    color: tokens.text.hi,
  },
  star: {
    color: tokens.brand.violet2,
  },
  cellXp: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    lineHeight: 19,
    color: tokens.semantic.xp,
  },

  // ── Worked example ────────────────────────────────────────────────────
  exampleCard: {
    alignSelf: 'stretch',
    gap: 6,
    padding: tokens.space[4],
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.bg.glass,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  exampleLabel: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: tokens.text.dim,
  },
  exampleTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 16,
    lineHeight: 21,
    color: tokens.text.hi,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: tokens.space[2],
    marginTop: 2,
  },
  subChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: tokens.space[2] + 2,
    paddingVertical: 5,
    borderRadius: tokens.radius.pill,
    flexShrink: 1,
  },
  subChipText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    lineHeight: 17,
    flexShrink: 1,
  },
  subChipStars: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    lineHeight: 17,
  },
  gain: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    lineHeight: 20,
    color: tokens.semantic.xp,
    flexShrink: 1,
  },

  // ── Coin dial ─────────────────────────────────────────────────────────
  dialCard: {
    alignSelf: 'stretch',
    gap: tokens.space[3],
    padding: tokens.space[4],
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.bg.glass,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  dialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.space[2],
  },
  dialTitle: {
    flex: 1,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    lineHeight: 20,
    color: tokens.text.hi,
  },
  dialXp: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    lineHeight: 17,
    color: tokens.semantic.xp,
  },
  dialRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dialCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: tokens.space[2] + 2,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  dialCellOn: {
    borderColor: tokens.brand.violet2,
    backgroundColor: tokens.brand.violetGlow,
  },
  dialLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    lineHeight: 16,
    color: tokens.text.mid,
  },
  dialLabelOn: {
    color: tokens.text.hi,
  },
  dialCoins: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dialCoinsText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    lineHeight: 19,
    color: tokens.semantic.coinLight,
  },
  dialDefault: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    lineHeight: 15,
    color: tokens.brand.violet2,
  },

  // ── Reward samples ────────────────────────────────────────────────────
  rewards: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: tokens.space[2],
  },
  rewardCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[2],
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.bg.glass,
    borderWidth: 1,
    borderColor: tokens.semantic.coinRim,
  },
  rewardName: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    lineHeight: 17,
    color: tokens.text.hi,
    textAlign: 'center',
  },
  rewardPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardPriceText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    lineHeight: 18,
    color: tokens.semantic.coinLight,
  },
});
