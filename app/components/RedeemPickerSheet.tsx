import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import type { Reward } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';
import { REWARD_CATEGORY_META } from '@/theme/rewards';

import { CoinIcon } from './CoinIcon';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Active rewards minus the one-shots already bought. */
  rewards: Reward[];
  /** Today's balance — the retro-log still pays with today's coins. */
  coins: number;
  /** The day being logged, already formatted for the subtitle. */
  dayLabel: string;
  /** Tap → the caller opens the quantity / cost confirm for that reward. */
  onPick: (reward: Reward) => void;
}

/**
 * Bottom sheet that logs a reward on a past day — the retro-log for the
 * Vault, opened from the calendar's day panel. Same grid as the track
 * picker: open, tap, done. The caller confirms quantity and cost.
 *
 * Structure follows the rule for sheets with a scroll inside: the scrim is
 * a sibling BEHIND the sheet, and the sheet is a plain View, so a drag that
 * starts on empty space still scrolls.
 */
export function RedeemPickerSheet({
  visible,
  onClose,
  rewards,
  coins,
  dayLabel,
  onPick,
}: Props) {
  const { t } = useT();
  const handlePick = (reward: Reward) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onClose();
    onPick(reward);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{t('redeemPicker.title')}</Text>
              <Text style={styles.subtitle}>
                {t('redeemPicker.subtitle', { day: dayLabel })}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
            >
              <Ionicons name="close" size={20} color={tokens.text.mid} />
            </Pressable>
          </View>

          {rewards.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="gift-outline" size={32} color={tokens.text.dim} />
              <Text style={styles.emptyTitle}>{t('redeemPicker.emptyTitle')}</Text>
              <Text style={styles.emptySub}>{t('redeemPicker.emptyBody')}</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
              {rewards.map((r) => {
                const cat = REWARD_CATEGORY_META[r.category];
                const affordable = coins >= r.cost;
                return (
                  <Pressable
                    key={r.id}
                    onPress={() => handlePick(r)}
                    style={({ pressed }) => [
                      styles.card,
                      affordable && styles.cardAffordable,
                      pressed && { transform: [{ scale: 0.97 }] },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={r.title}
                    accessibilityValue={{ text: t('rewards.coins', { count: r.cost }) }}
                  >
                    <View style={[styles.iconWrap, { backgroundColor: cat.bg }]}>
                      <AppIcon name={r.icon} size={20} color={cat.color} />
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {r.title}
                    </Text>
                    <View style={styles.costRow}>
                      <CoinIcon size={11} />
                      <Text style={[styles.costText, !affordable && styles.costTextShort]}>
                        {r.cost.toLocaleString()}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: tokens.bg.surface,
    borderTopLeftRadius: tokens.radius.xl,
    borderTopRightRadius: tokens.radius.xl,
    borderTopWidth: 1,
    borderColor: tokens.border.strong,
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[2],
    paddingBottom: tokens.space[6],
    maxHeight: '82%',
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: tokens.text.faint,
    marginBottom: tokens.space[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.space[3],
    marginBottom: tokens.space[4],
  },
  title: {
    ...tokens.type.h2,
    color: tokens.text.hi,
  },
  subtitle: {
    ...tokens.type.caption,
    color: tokens.text.mid,
    marginTop: 4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.space[3],
  },
  card: {
    width: '48%',
    flexGrow: 1,
    minHeight: 130,
    padding: tokens.space[3],
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: tokens.border.base,
    gap: 6,
  },
  cardAffordable: {
    borderColor: 'rgba(255, 200, 61, 0.3)',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    ...tokens.type.body,
    color: tokens.text.hi,
    fontFamily: 'Manrope_700Bold',
    marginTop: 4,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 'auto',
  },
  costText: {
    ...tokens.type.caption,
    color: tokens.semantic.coin,
    fontFamily: 'Manrope_800ExtraBold',
  },
  costTextShort: {
    color: tokens.text.mid,
  },
  emptyBox: {
    paddingVertical: tokens.space[8],
    alignItems: 'center',
    gap: tokens.space[2],
  },
  emptyTitle: {
    ...tokens.type.h3,
    color: tokens.text.hi,
    marginTop: tokens.space[2],
  },
  emptySub: {
    ...tokens.type.caption,
    color: tokens.text.mid,
    textAlign: 'center',
    paddingHorizontal: tokens.space[4],
  },
});
