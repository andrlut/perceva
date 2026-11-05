import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GOLD_BADGE_BG, GOLD_TINT_BG } from '@/components/week/gold';
import { trackOnce } from '@/lib/analytics';
import {
  useActivePartnerCampaign,
  useAutoClaimPartnerCoupon,
  usePartnerCampaignStatus,
} from '@/lib/api/partners';
import { useT } from '@/lib/i18n';
import { useLocalizedPick } from '@/lib/i18n/catalog';
import { campaignStateLine, canDismissCampaignCard } from '@/lib/partnerCampaign';
import { tokens } from '@/theme';

/**
 * Partner campaign strip on the Today hub (Programa Paker Health). Same
 * footprint as StoreUpdateCard / WeekStrip — icon disc, text, one trailing
 * control — in the gold of partner/reward surfaces (violet is the system
 * notice colour). One card, one state line from the server's status
 * (`campaignStateLine` in lib/partnerCampaign, shared word for word with the
 * sponsored material's campaign row), plus a thin bar while the streak runs.
 *
 * The eyebrow says "Patrocinado" — paid content says so (the title already
 * names the partner). The whole card opens `/campaign/<id>`, where every
 * action lives — no inline CTA. A member's unlock is claimed here on sight
 * (`useAutoClaimPartnerCoupon`): an unclaimed unlock dies with the streak.
 * The program gives two rewards (a Perceva Premium discount and the
 * partner's coupon); the line talks about both.
 *
 * The X only shows while there is no progress to hide — before any
 * involvement, or once every code is in hand (`canDismissCampaignCard`). A
 * dismissal (per campaign) stops counting while there is live progress, so
 * a practice adopted after the X still shows its streak.
 *
 * Never gated on modules or Premium; the caller passes `enabled` for the
 * tour (quiet until it's over, like the mood prompt).
 */
const DISMISS_KEY = '@perceva/campaign_dismissed';

interface Props {
  enabled: boolean;
}

export function PartnerCampaignCard({ enabled }: Props) {
  const router = useRouter();
  const { t } = useT();
  const { pick } = useLocalizedPick();
  const campaign = useActivePartnerCampaign({ enabled });
  const campaignId = campaign.data?.id ?? null;
  const status = usePartnerCampaignStatus(campaignId, { enabled });
  // Keyed by campaign id: a new campaign never inherits the last one's X.
  const [dismissal, setDismissal] = useState<{ id: string; dismissed: boolean } | null>(
    null,
  );

  useEffect(() => {
    if (!campaignId) return;
    let alive = true;
    AsyncStorage.getItem(`${DISMISS_KEY}:${campaignId}`)
      .then((v) => {
        if (alive) setDismissal({ id: campaignId, dismissed: v != null });
      })
      .catch(() => {
        if (alive) setDismissal({ id: campaignId, dismissed: false });
      });
    return () => {
      alive = false;
    };
  }, [campaignId]);

  const s = status.data ?? null;
  useAutoClaimPartnerCoupon(s);

  const canDismiss =
    s != null && campaign.data != null && canDismissCampaignCard(campaign.data, s);
  const hydrated = campaignId != null && dismissal?.id === campaignId;
  const visible =
    enabled &&
    campaign.data != null &&
    hydrated &&
    s != null &&
    !(dismissal?.dismissed && canDismiss);

  useEffect(() => {
    if (!visible || !campaignId) return;
    void trackOnce(`campaign_card_seen:${campaignId}`, 'campaign_card_seen', {
      campaign: campaignId,
      source: 'banner',
    });
  }, [visible, campaignId]);

  if (!visible || !campaign.data || !s) return null;
  const c = campaign.data;
  const title = pick(c.title_en, c.title_pt);
  const sponsored = t('campaign.sponsored');

  const dismiss = () => {
    setDismissal({ id: c.id, dismissed: true });
    AsyncStorage.setItem(`${DISMISS_KEY}:${c.id}`, '1').catch(() => {});
  };

  const open = () =>
    router.push({ pathname: '/campaign/[id]', params: { id: c.id, source: 'banner' } });

  const line = campaignStateLine(c, s, t);
  const showBar = s.adopted && !s.claimed;
  const ratio = s.goal > 0 ? Math.min(1, s.streak_days / s.goal) : 0;

  return (
    <View style={styles.card}>
      <Pressable
        onPress={open}
        style={({ pressed }) => [
          styles.main,
          !canDismiss && styles.mainFull,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        // The label replaces the visible texts, so the disclosure rides in it.
        accessibilityLabel={t('campaign.card.a11y', { sponsored, title })}
        accessibilityHint={line}
      >
        <View style={styles.icon}>
          <Ionicons
            name={s.unlocked ? 'gift' : 'ribbon'}
            size={17}
            color={tokens.semantic.coinLight}
          />
        </View>
        <View style={styles.body}>
          <Text style={styles.eyebrow} numberOfLines={1}>
            {sponsored}
          </Text>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.sub} numberOfLines={2}>
            {line}
          </Text>
          {showBar && (
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.round(ratio * 100)}%` }]} />
            </View>
          )}
        </View>
        {!canDismiss && (
          <Ionicons name="chevron-forward" size={15} color={tokens.text.dim} />
        )}
      </Pressable>
      {canDismiss && (
        <Pressable
          onPress={dismiss}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={t('campaign.card.dismissA11y')}
          style={({ pressed }) => [styles.close, pressed && styles.pressed]}
        >
          <Ionicons name="close" size={15} color={tokens.text.dim} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Padding lives on the two Pressables, not here, so the WHOLE card is a
  // tap target: the body to the edge, the X in its own corner. Siblings, not
  // nested — a nested button is unreachable for TalkBack.
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: tokens.space[4],
    marginTop: tokens.space[3],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.semantic.coinRim,
    backgroundColor: GOLD_TINT_BG,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    paddingVertical: tokens.space[3],
    paddingLeft: tokens.space[3],
  },
  mainFull: {
    paddingRight: tokens.space[3],
  },
  pressed: {
    opacity: 0.8,
  },
  // StoreUpdateCard's disc: 28px, 17px glyph.
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: GOLD_BADGE_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  eyebrow: {
    fontFamily: tokens.font.familyBold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: tokens.semantic.coinLight,
    marginBottom: 1,
  },
  title: {
    fontFamily: tokens.font.familyBold,
    fontSize: 13,
    color: tokens.text.hi,
  },
  sub: {
    fontFamily: tokens.font.family,
    fontSize: 11,
    color: tokens.text.mid,
    marginTop: 1,
  },
  track: {
    height: 3,
    borderRadius: 2,
    backgroundColor: GOLD_BADGE_BG,
    marginTop: 6,
    overflow: 'hidden',
  },
  fill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: tokens.semantic.coin,
  },
  close: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: tokens.space[3],
  },
});
