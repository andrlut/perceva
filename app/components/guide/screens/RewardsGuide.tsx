import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { AddCard } from '@/components/AddCard';
import { CoinIcon } from '@/components/CoinIcon';
import {
  GuideGesture,
  GuideGestureRow,
  GuidePlayground,
  GuideTapHint,
  GuideTryIt,
} from '@/components/guide/GuidePlayground';
import { GuideFit } from '@/components/guide/GuideFit';
import { GuideLabel, GuideStep } from '@/components/guide/GuideStep';
import { RewardCard } from '@/components/RewardCard';
import { TrackedRewardCard } from '@/components/TrackedRewardCard';
import type { Reward } from '@/lib/db/types';
import { screenGuidePrompt } from '@/lib/guide';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/**
 * The guide of the Recompensas tab (the Vault) — docs/informativo-de-tela.md.
 *
 * The playground is two REAL RewardCards on a sample balance: one the
 * balance pays (gold, "Resgatar") and one it does not yet ("Mirar"). Each
 * gesture answers like the screen would, minus the write: Resgatar says
 * what the confirmation does, holding shows the card's menu, and Mirar
 * turns the second reward into the real TrackedRewardCard — the goal slot
 * at the top of the shop.
 *
 * "Resgate = uso, sem Banco": redeeming pays and counts as used at once;
 * undo lives in the celebration, then in the calendar and in Resgates —
 * the step nobody finds alone, so it has its own row.
 */

const HELP = 'rewards.help';

/** Every option of the Recompensas tab, in the guide's order. */
export const REWARDS_GUIDE_ITEMS = [
  'redeem',
  'hold',
  'track',
  'balance',
  'chips',
  'sections',
  'add',
  'undo',
  'buttons',
] as const;

type ItemKey = (typeof REWARDS_GUIDE_ITEMS)[number];
type GestureKey = Extract<ItemKey, 'redeem' | 'hold' | 'track'>;
type StepKey = Exclude<ItemKey, GestureKey>;

const GESTURES: readonly GestureKey[] = ['redeem', 'hold', 'track'];
const isGesture = (k: ItemKey): k is GestureKey => (GESTURES as readonly string[]).includes(k);

const GESTURE_ICONS: Record<GestureKey, keyof typeof Ionicons.glyphMap> = {
  redeem: 'gift-outline',
  hold: 'finger-print-outline',
  track: 'locate-outline',
};

/** The AI door's prompt — every option, with its mechanics. */
export function useRewardsGuidePrompt(): string {
  const { t } = useT();
  return useMemo(() => screenGuidePrompt(t, HELP, REWARDS_GUIDE_ITEMS), [t]);
}

/** Sample balance: pays the first reward (120), not the second (200). */
const BALANCE = 150;

function sampleReward(id: string, title: string, cost: number, icon: string): Reward {
  return {
    id,
    character_id: 'guide',
    title,
    description: null,
    cost,
    icon,
    category: 'indulgence',
    is_one_shot: false,
    template_id: null,
    is_archived: false,
    sort_order: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

type Feedback = 'redeem' | null;

export function RewardsGuide() {
  const { t } = useT();
  const [tried, setTried] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [menuShown, setMenuShown] = useState(false);
  const [tracked, setTracked] = useState(false);
  // The shop's real content width (16dp gutters): the miniature is laid
  // out at it and scaled to the sheet, so the cards keep their proportions.
  const naturalWidth = useWindowDimensions().width - 32;

  const affordable = useMemo(
    () => sampleReward('guide-a', t(`${HELP}.sampleA`), 120, 'cafe-outline'),
    [t],
  );
  const pricey = useMemo(
    () => sampleReward('guide-b', t(`${HELP}.sampleB`), 200, 'restaurant-outline'),
    [t],
  );

  const tryIt = (fn: () => void) => () => {
    setTried(true);
    fn();
  };

  const steps: Record<
    StepKey,
    { icon: keyof typeof Ionicons.glyphMap; iconColor?: string; replica?: React.ReactNode }
  > = {
    balance: { icon: 'wallet-outline', iconColor: tokens.semantic.coin, replica: <BalanceReplica /> },
    chips: { icon: 'pricetags-outline', replica: <ChipsReplica /> },
    sections: { icon: 'layers-outline', replica: <SectionsReplica /> },
    add: {
      icon: 'add-circle-outline',
      replica: (
        <AddCard
          label={t('rewards.vault.addReward')}
          sublabel={t('rewards.vault.addRewardSub')}
          onPress={() => {}}
        />
      ),
    },
    undo: { icon: 'arrow-undo-outline' },
    buttons: { icon: 'options-outline', iconColor: tokens.semantic.coin, replica: <FabsReplica /> },
  };

  const gestureKeys = REWARDS_GUIDE_ITEMS.filter(isGesture);
  const stepKeys = REWARDS_GUIDE_ITEMS.filter((k): k is StepKey => !isGesture(k));

  return (
    <>
      <GuideLabel>{t(`${HELP}.cardLabel`)}</GuideLabel>
      <GuidePlayground column>
        {/* The shop in miniature: laid out at the screen's real width, in the
            real two-up grid (48% cards), then scaled to fit the sheet.
            Squeezed into half the sheet instead, the card's pill ran past
            its edge (owner's screenshot, 2026-10-04). */}
        <GuideFit naturalWidth={naturalWidth}>
          <View style={styles.shop}>
            {tracked && (
              <TrackedRewardCard
                reward={pricey}
                coins={BALANCE}
                onChange={() => {}}
                onUntrack={() => setTracked(false)}
              />
            )}
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <RewardCard
                  reward={affordable}
                  affordable
                  coins={BALANCE}
                  deficit={0}
                  onRedeem={tryIt(() => setFeedback('redeem'))}
                  onLongPress={tryIt(() => setMenuShown(true))}
                />
                {!tried && <GuideTapHint />}
              </View>
              {!tracked && (
                <View style={styles.gridItem}>
                  <RewardCard
                    reward={pricey}
                    affordable={false}
                    coins={BALANCE}
                    deficit={pricey.cost - BALANCE}
                    onRedeem={() => {}}
                    onLongPress={tryIt(() => setMenuShown(true))}
                    onTrack={tryIt(() => setTracked(true))}
                  />
                </View>
              )}
            </View>
          </View>
        </GuideFit>

        {feedback === 'redeem' && (
          <View style={styles.feedback}>
            <Ionicons name="gift" size={15} color={tokens.semantic.coin} />
            <Text style={styles.feedbackText}>{t(`${HELP}.demoRedeem`)}</Text>
          </View>
        )}
        {tracked && (
          <View style={styles.feedback}>
            <Ionicons name="locate" size={15} color={tokens.brand.violet2} />
            <Text style={styles.feedbackText}>{t(`${HELP}.demoTrack`)}</Text>
          </View>
        )}
        {menuShown && <MenuReplica />}

        <GuideTryIt>{t(`${HELP}.tryIt`)}</GuideTryIt>
        <GuideGestureRow>
          {gestureKeys.map((k) => (
            <GuideGesture
              key={k}
              icon={GESTURE_ICONS[k]}
              title={t(`${HELP}.items.${k}.title`)}
              body={t(`${HELP}.items.${k}.body`)}
            />
          ))}
        </GuideGestureRow>
      </GuidePlayground>

      <GuideLabel>{t(`${HELP}.screenLabel`)}</GuideLabel>

      {stepKeys.map((k) => (
        <GuideStep
          key={k}
          icon={steps[k].icon}
          iconColor={steps[k].iconColor}
          title={t(`${HELP}.items.${k}.title`)}
          body={t(`${HELP}.items.${k}.body`)}
        >
          {steps[k].replica}
        </GuideStep>
      ))}
    </>
  );
}

/** The card's hold menu (RewardActionSheet), inert. */
function MenuReplica() {
  const { t } = useT();
  const rows: { icon: keyof typeof Ionicons.glyphMap; color: string; title: string; sub: string }[] = [
    {
      icon: 'gift-outline',
      color: tokens.semantic.coin,
      title: t('rewards.actionSheet.buyQuantity'),
      sub: t('rewards.actionSheet.buyQuantitySub'),
    },
    {
      icon: 'create-outline',
      color: tokens.text.hi,
      title: t('rewards.actionSheet.edit'),
      sub: t('rewards.actionSheet.editSub'),
    },
    {
      icon: 'archive-outline',
      color: tokens.text.hi,
      title: t('rewards.actionSheet.archive'),
      sub: t('rewards.actionSheet.archiveSub'),
    },
  ];
  return (
    <View style={styles.panel}>
      <Text style={styles.panelLabel}>{t(`${HELP}.menuLabel`)}</Text>
      {rows.map((r) => (
        <View key={r.title} style={styles.panelRow}>
          <View style={styles.panelIcon}>
            <Ionicons name={r.icon} size={15} color={r.color} />
          </View>
          <View style={styles.panelBody}>
            <Text style={styles.panelTitle} numberOfLines={1}>
              {r.title}
            </Text>
            <Text style={styles.panelSub} numberOfLines={1}>
              {r.sub}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/** The coin and the balance, as the top of the shop shows them (smaller). */
function BalanceReplica() {
  return (
    <View style={styles.balance}>
      <CoinIcon size={28} />
      <Text style={styles.balanceValue}>{BALANCE}</Text>
    </View>
  );
}

/** The three category chips; the first one on. */
function ChipsReplica() {
  const { t } = useT();
  return (
    <View style={styles.chips}>
      {(['indulgence', 'good', 'experience'] as const).map((c, i) => (
        <View key={c} style={[styles.chip, i === 0 && styles.chipOn]}>
          <Text style={[styles.chipText, i === 0 && styles.chipTextOn]}>
            {t(`rewards.categories.${c}`)}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** The three section headers, with their counts. */
function SectionsReplica() {
  const { t } = useT();
  const rows = [
    { key: 'available', count: 2 },
    { key: 'almost', count: 1 },
    { key: 'big', count: 3 },
  ] as const;
  return (
    <View style={styles.sections}>
      {rows.map((r) => (
        <View key={r.key} style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t(`rewards.vault.sections.${r.key}`)}</Text>
          <Text style={styles.sectionCount}>{t('rewards.vault.itemsCount', { count: r.count })}</Text>
        </View>
      ))}
    </View>
  );
}

/** Calendar on top, the gold Gerenciar below. */
function FabsReplica() {
  return (
    <View style={styles.fabs}>
      <View style={[styles.fab, styles.fabSmall]}>
        <Ionicons name="calendar-outline" size={20} color={tokens.text.hi} />
      </View>
      <View style={[styles.fab, styles.fabMain]}>
        <Ionicons name="options-outline" size={24} color="#3D2A00" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // The real shop's grid (rewards.tsx): 12dp gaps, 48% cards that grow.
  shop: { gap: tokens.space[3] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space[3] },
  gridItem: { width: '48%', flexGrow: 1 },
  feedback: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  feedbackText: {
    flex: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    lineHeight: 17,
    color: tokens.text.hi,
  },
  panel: {
    gap: 8,
    padding: tokens.space[3],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.border.base,
    backgroundColor: tokens.bg.surface2,
  },
  panelLabel: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: tokens.text.mid,
  },
  panelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  panelIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 200, 61, 0.12)',
  },
  panelBody: { flex: 1, minWidth: 0 },
  panelTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.text.hi,
  },
  panelSub: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: tokens.text.mid,
  },
  balance: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  balanceValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 26,
    color: tokens.semantic.coin,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.border.strong,
  },
  chipOn: {
    borderColor: tokens.semantic.coin,
    backgroundColor: 'rgba(255, 200, 61, 0.14)',
  },
  chipText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: tokens.text.mid,
  },
  chipTextOn: { color: tokens.semantic.coin },
  sections: { gap: 6 },
  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    color: tokens.text.hi,
  },
  sectionCount: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: tokens.text.dim,
  },
  fabs: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fab: { alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  fabSmall: {
    width: 40,
    height: 40,
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  fabMain: { width: 48, height: 48, backgroundColor: tokens.semantic.coin },
});
