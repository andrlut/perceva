import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { useRedemptionsForDay } from '@/lib/api/rewards';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/**
 * "Resgates do dia" — the Vault's side of the day on the Home, under the
 * practices and the mood: what was redeemed on the selected day, what it
 * cost, and the way into the Vault. The same reading the calendar's Vault
 * front gives (one row per redemption), so the Home answers the day's three
 * daily marks — XP, coins, mood — and where the coins went.
 *
 * Read-only on purpose: undo lives in the calendar and in Resgates, where
 * the ledger is the subject. The footer opens the Vault (where redeeming
 * happens); a past day's redemptions are filed from the calendar.
 */
export function DayRedemptionsCard({ date }: { date: Date }) {
  const { t } = useT();
  const router = useRouter();
  const { data, isLoading } = useRedemptionsForDay(date);
  const rows = data ?? [];
  const total = rows.reduce((s, r) => s + r.cost_paid, 0);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="gift-outline" size={16} color={tokens.semantic.coinLight} />
        <Text style={styles.title}>{t('home.redemptions.title')}</Text>
        {total > 0 ? <Text style={styles.total}>{`−${total}`}</Text> : null}
      </View>

      {isLoading ? null : rows.length === 0 ? (
        <Text style={styles.empty}>{t('home.redemptions.empty')}</Text>
      ) : (
        rows.map((r) => (
          <View
            key={r.id}
            style={styles.row}
            accessible
            accessibilityLabel={`${r.reward_title}, ${t('rewards.coins', { count: r.cost_paid })}`}
          >
            <View style={styles.rowIcon}>
              <AppIcon name={r.reward_icon || 'gift'} size={15} color={tokens.semantic.coin} />
            </View>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {r.reward_title}
            </Text>
            <Text style={styles.rowCost}>{`−${r.cost_paid}`}</Text>
          </View>
        ))
      )}

      <Pressable
        onPress={() => router.navigate('/(tabs)/rewards')}
        style={({ pressed }) => [styles.link, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
      >
        <Text style={styles.linkText}>{t('home.redemptions.openVault')}</Text>
        <Ionicons name="chevron-forward" size={14} color={tokens.semantic.coinLight} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: tokens.space[4],
    marginTop: tokens.space[3],
    padding: tokens.space[4],
    gap: tokens.space[2],
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.semantic.coinRim,
    backgroundColor: tokens.bg.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: tokens.semantic.coinLight,
  },
  total: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: tokens.semantic.coinLight,
  },
  empty: {
    ...tokens.type.caption,
    color: tokens.text.dim,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 200, 61, 0.14)',
  },
  rowTitle: {
    flex: 1,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    color: tokens.text.hi,
  },
  rowCost: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    color: tokens.text.mid,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    minHeight: 36,
  },
  linkText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.semantic.coinLight,
  },
});
