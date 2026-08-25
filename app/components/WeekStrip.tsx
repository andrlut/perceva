import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GOLD_BADGE_BG, GOLD_TINT_BG } from '@/components/week/gold';
import { useWeekItems, weekStartKey } from '@/lib/api/week';
import { useT } from '@/lib/i18n';
import { useModuleEnabled } from '@/lib/modules';
import { useLoadedSettings } from '@/lib/settings';
import { tokens } from '@/theme';

/**
 * "Minha Semana" strip on the Today hub — the sheet's presence on the one
 * screen the user already opens. Two states:
 *
 *   - Empty week → a quiet invitation to set the week up (the Monday ritual's
 *     in-app entry point; no push needed, the hub IS the morning surface).
 *   - Sheet exists → the 3 bigs at a glance + how many items remain. Tap
 *     opens the full sheet.
 *
 * Module-gated: with `semana` off this renders nothing and the hub is
 * exactly what it was before the module existed.
 */
export function WeekStrip() {
  const router = useRouter();
  const { t } = useT();
  const enabled = useModuleEnabled('semana');
  const settings = useLoadedSettings();
  const ws = weekStartKey(new Date(), settings.weekStart);
  const items = useWeekItems(ws, enabled);

  if (!enabled || !items.data) return null;

  const bigs = items.data.filter((i) => i.slot != null);
  const restOpen = items.data.filter(
    (i) => i.slot == null && i.done_at == null,
  ).length;

  // ── Empty week: the invitation ────────────────────────────────────────────
  if (items.data.length === 0) {
    return (
      <Pressable
        onPress={() => router.push('/semana-montar')}
        style={({ pressed }) => [styles.invite, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={t('week.strip.setupCta')}
      >
        <View style={styles.inviteIcon}>
          <Ionicons name="reader-outline" size={15} color={tokens.semantic.coinLight} />
        </View>
        <View style={styles.inviteBody}>
          <Text style={styles.inviteTitle}>{t('week.strip.setupCta')}</Text>
          <Text style={styles.inviteSub}>{t('week.strip.setupSub')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={15} color={tokens.text.dim} />
      </Pressable>
    );
  }

  // ── Sheet exists: the 3 at a glance ───────────────────────────────────────
  return (
    <Pressable
      onPress={() => router.push('/semana')}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={t('week.title')}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardLabel}>{t('week.strip.label')}</Text>
        {restOpen > 0 && (
          <Text style={styles.cardMore}>
            {t('week.strip.more', { count: restOpen })}
          </Text>
        )}
      </View>
      {bigs.map((b) => {
        const done = b.done_at != null;
        return (
          <View key={b.id} style={styles.bigRow}>
            <View style={[styles.bigNum, done && styles.bigNumDone]}>
              {done ? (
                <Ionicons name="checkmark" size={9} color={tokens.bg.deep} />
              ) : (
                <Text style={styles.bigNumText}>{b.slot}</Text>
              )}
            </View>
            <Text
              style={[styles.bigTitle, done && styles.bigTitleDone]}
              numberOfLines={1}
            >
              {b.title}
            </Text>
          </View>
        );
      })}
      {bigs.length === 0 && (
        <Text style={styles.noBigs}>{t('week.strip.noBigs')}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.8,
  },
  invite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    marginHorizontal: tokens.space[4],
    marginTop: tokens.space[3],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.semantic.coinRim,
    backgroundColor: GOLD_TINT_BG,
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[3],
  },
  inviteIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: GOLD_BADGE_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteBody: {
    flex: 1,
  },
  inviteTitle: {
    fontFamily: tokens.font.familyBold,
    fontSize: 13,
    color: tokens.text.hi,
  },
  inviteSub: {
    fontFamily: tokens.font.family,
    fontSize: 11,
    color: tokens.text.mid,
    marginTop: 1,
  },
  card: {
    marginHorizontal: tokens.space[4],
    marginTop: tokens.space[3],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.border.base,
    backgroundColor: tokens.bg.glass,
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[3],
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontFamily: tokens.font.familyBold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: tokens.text.mid,
  },
  cardMore: {
    fontFamily: tokens.font.familyBold,
    fontSize: 10,
    color: tokens.text.dim,
  },
  bigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
  },
  bigNum: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: GOLD_BADGE_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigNumDone: {
    backgroundColor: tokens.semantic.coin,
  },
  bigNumText: {
    fontFamily: tokens.font.familyHeavy,
    fontSize: 9,
    color: tokens.semantic.coinLight,
  },
  bigTitle: {
    flex: 1,
    fontFamily: tokens.font.familyBold,
    fontSize: 13,
    color: tokens.text.hi,
  },
  bigTitleDone: {
    color: tokens.text.dim,
    textDecorationLine: 'line-through',
    fontFamily: tokens.font.family,
  },
  noBigs: {
    fontFamily: tokens.font.family,
    fontSize: 12,
    color: tokens.text.dim,
  },
});
