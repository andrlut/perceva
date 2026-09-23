import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { useBottomSafeClearance } from '@/components/BottomNavBar';
import { CoinIcon } from '@/components/CoinIcon';
import { EmptyHero } from '@/components/EmptyHero';
import { HistoryActionSheet } from '@/components/HistoryActionSheet';
import { ScreenBackground } from '@/components/ScreenBackground';
import { UndoRedemptionModal } from '@/components/UndoRedemptionModal';
import {
  useRedemptionLog,
  useUndoRedemption,
  type RedemptionEntry,
} from '@/lib/api/rewards';
import { useT } from '@/lib/i18n';
import { timeAgo } from '@/lib/time';
import { usePullToRefresh } from '@/lib/usePullToRefresh';
import { showInfo } from '@/lib/util/confirm';
import { tokens } from '@/theme';
import { REWARD_CATEGORY_META } from '@/theme/rewards';

/**
 * Resgates — the flat ledger of what the user redeemed, newest first. The
 * Vault's primary floating button lands here, the way Todas as práticas is
 * the Home's. Hold a row → undo (refund). Gerenciar sits in the header, so
 * this screen is the door to editing too. Day-by-day (and logging a day
 * that passed) lives in the calendar.
 */
export default function RewardsHistoryScreen() {
  const router = useRouter();
  const { t } = useT();
  const bottomClearance = useBottomSafeClearance();
  const log = useRedemptionLog(100);
  const undo = useUndoRedemption();

  // Long-press → action sheet; "Desfazer" → confirm modal. Same separation
  // as everywhere else (sheet for picking, modal for the irreversible bit).
  const [actionRow, setActionRow] = useState<RedemptionEntry | null>(null);
  const [undoing, setUndoing] = useState<RedemptionEntry | null>(null);

  const pull = usePullToRefresh(() => log.refetch());

  const handleConfirmUndo = async (entry: RedemptionEntry) => {
    setUndoing(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    try {
      await undo.mutateAsync(entry.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('common.unknownError');
      showInfo(t('rewards.undoConfirm.failTitle'), msg);
    }
  };

  const entries = log.data ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenBackground>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Ionicons name="chevron-back" size={22} color={tokens.text.hi} />
          </Pressable>
          <Text style={styles.title}>{t('rewards.history.title')}</Text>
          <View style={styles.topActions}>
            {/* Gerenciar recompensas lives here (moved off the Vault's
                floating stack) — order, adopt, edit, archive. */}
            <Pressable
              onPress={() => router.push('/rewards-manage')}
              style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('rewardsHub.title')}
            >
              <Ionicons name="options-outline" size={20} color={tokens.text.mid} />
            </Pressable>
          </View>
        </View>

        {log.isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={tokens.brand.violet2} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingBottom: Math.max(tokens.space[10], bottomClearance) + tokens.space[6] },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={pull.refreshing}
                onRefresh={pull.onRefresh}
                tintColor={tokens.brand.violet2}
                colors={[tokens.brand.violet2]}
              />
            }
          >
            {entries.length === 0 ? (
              <View style={styles.emptyBox}>
                <EmptyHero tone="coin" iconName="gift" size={140} />
                <Text style={styles.emptyTitle}>{t('rewards.history.emptyTitle')}</Text>
                <Text style={styles.emptySub}>{t('rewards.history.emptySub')}</Text>
              </View>
            ) : (
              <>
                <Text style={styles.lead}>{t('rewards.history.lead')}</Text>
                <View style={styles.list}>
                  {entries.map((r) => {
                    const cat = r.reward_category ? REWARD_CATEGORY_META[r.reward_category] : null;
                    return (
                      <Pressable
                        key={r.id}
                        style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
                        onLongPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                          setActionRow(r);
                        }}
                        delayLongPress={400}
                        accessibilityRole="button"
                        accessibilityLabel={r.reward_title}
                        accessibilityValue={{
                          text: `${t('rewards.coins', { count: r.cost_paid })} · ${timeAgo(r.redeemed_at)}`,
                        }}
                        accessibilityHint={t('rewards.history.rowHint')}
                      >
                        <View
                          style={[
                            styles.iconWrap,
                            cat
                              ? { backgroundColor: cat.bg }
                              : { backgroundColor: 'rgba(255,255,255,0.05)' },
                          ]}
                        >
                          <AppIcon
                            name={r.reward_icon}
                            size={15}
                            color={cat ? cat.color : tokens.text.mid}
                          />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.rowTitle} numberOfLines={1}>
                            {r.reward_title}
                          </Text>
                          <Text style={styles.rowMeta}>{timeAgo(r.redeemed_at)}</Text>
                        </View>
                        <View style={styles.rowCost}>
                          <CoinIcon size={11} />
                          <Text style={styles.rowCostText}>−{r.cost_paid.toLocaleString()}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}
          </ScrollView>
        )}
      </ScreenBackground>

      <HistoryActionSheet
        visible={!!actionRow}
        rewardTitle={actionRow?.reward_title ?? ''}
        onCancel={() => setActionRow(null)}
        onUndo={() => {
          const r = actionRow;
          setActionRow(null);
          if (r) setUndoing(r);
        }}
      />

      <UndoRedemptionModal
        visible={!!undoing}
        rewardTitle={undoing?.reward_title ?? ''}
        rewardIcon={undoing?.reward_icon ?? 'gift'}
        category={undoing?.reward_category ?? null}
        refund={undoing?.cost_paid ?? 0}
        onCancel={() => setUndoing(null)}
        onConfirm={() => {
          const r = undoing;
          if (r) handleConfirmUndo(r);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  loadingBox: { paddingVertical: tokens.space[10], alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.space[2],
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[2],
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.surface,
  },
  title: {
    ...tokens.type.h3,
    color: tokens.text.hi,
    flexShrink: 1,
  },
  content: {
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[3],
  },
  lead: {
    ...tokens.type.caption,
    color: tokens.text.dim,
    paddingBottom: tokens.space[3],
  },
  list: {
    gap: tokens.space[2],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    paddingHorizontal: tokens.space[3],
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: tokens.border.base,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    lineHeight: 18,
    color: tokens.text.hi,
  },
  rowMeta: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: tokens.text.mid,
    marginTop: 1,
  },
  rowCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowCostText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    color: tokens.semantic.coinLight,
  },
  emptyBox: {
    alignItems: 'center',
    gap: tokens.space[2],
    paddingVertical: tokens.space[8],
    paddingHorizontal: tokens.space[6],
  },
  emptyTitle: {
    ...tokens.type.h3,
    color: tokens.text.hi,
    marginTop: tokens.space[2],
  },
  emptySub: {
    ...tokens.type.body,
    color: tokens.text.mid,
    textAlign: 'center',
  },
});
