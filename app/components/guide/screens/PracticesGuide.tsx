import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CoinIcon } from '@/components/CoinIcon';
import { CompletedBucket, type CompletedItem } from '@/components/CompletedBucket';
import {
  GuideGesture,
  GuideGestureRow,
  GuidePlayground,
  GuideTapHint,
  GuideTryIt,
} from '@/components/guide/GuidePlayground';
import { GuideLabel, GuideStep } from '@/components/guide/GuideStep';
import { MoodCardHeader } from '@/components/mood/MoodCardHeader';
import { MoodFacePlaceholder } from '@/components/mood/MoodFace';
import { MoodFaceRow } from '@/components/mood/MoodFaceRow';
import { TaskCard } from '@/components/TaskCard';
import type { TaskWithSubs } from '@/lib/db/types';
import { screenGuidePrompt } from '@/lib/guide';
import { useT } from '@/lib/i18n';
import { useModules, type ModuleKey } from '@/lib/modules';
import { tokens } from '@/theme';

/**
 * The guide of the Práticas tab (Home) — docs/informativo-de-tela.md,
 * modelled on Minhas ideias (CollectionGuide).
 *
 * "Na prática" is a playground with a REAL TaskCard on a sample practice:
 * tap the check, swipe either way, tap the card (its menu), hold it (edit,
 * since #511 swapped the two) — each gesture
 * does what it does on the screen, minus the write: the guide answers with
 * a line of feedback or an inline replica of the sheet it would open (the
 * real sheets are Modals and would stack on this one). Swipes work because
 * the InfoSheet carries its own GestureHandlerRootView.
 *
 * The rest is one GuideStep per thing on the screen, drawn with the
 * screen's own components where they are pure (CompletedBucket, the mood
 * header and faces, CoinIcon) and as faithful replicas where the screen
 * draws them inline.
 */

const HELP = 'home.help';

/** Every option of the Práticas tab, in the guide's order. */
export const PRACTICES_GUIDE_ITEMS = [
  'check',
  'swipeRight',
  'swipeLeft',
  'tap',
  'hold',
  'days',
  'stats',
  'closeDay',
  'done',
  'skipped',
  'mood',
  'redemptions',
  'buttons',
  'quests',
  'week',
] as const;

type ItemKey = (typeof PRACTICES_GUIDE_ITEMS)[number];
type GestureKey = Extract<ItemKey, 'check' | 'swipeRight' | 'swipeLeft' | 'tap' | 'hold'>;
type StepKey = Exclude<ItemKey, GestureKey>;

const GESTURES: readonly GestureKey[] = ['check', 'swipeRight', 'swipeLeft', 'tap', 'hold'];
const isGesture = (k: ItemKey): k is GestureKey => (GESTURES as readonly string[]).includes(k);

const GESTURE_ICONS: Record<GestureKey, keyof typeof Ionicons.glyphMap> = {
  check: 'checkmark-circle-outline',
  swipeRight: 'arrow-forward-circle-outline',
  swipeLeft: 'arrow-back-circle-outline',
  tap: 'ellipsis-horizontal-circle-outline',
  hold: 'finger-print-outline',
};

/** Items that only exist while a module is on (any of the listed keys). */
const GATES: Partial<Record<ItemKey, readonly ModuleKey[]>> = {
  quests: ['missoes', 'metas'],
  week: ['semana'],
};

function useVisibleKeys(): ItemKey[] {
  const modules = useModules();
  return useMemo(
    () =>
      PRACTICES_GUIDE_ITEMS.filter((k) => {
        const gate = GATES[k];
        return !gate || gate.some((m) => modules[m]);
      }),
    [modules],
  );
}

/** The AI door's prompt — the options this person actually has on screen. */
export function usePracticesGuidePrompt(): string {
  const { t } = useT();
  const keys = useVisibleKeys();
  return useMemo(() => screenGuidePrompt(t, HELP, keys), [t, keys]);
}

/** Sample practice: 2 stars in Contemplar → 20 XP, 20 coins at "Igual". */
const SAMPLE_XP = 20;

type Feedback = 'done' | 'skipped' | 'edit' | null;
type Panel = 'menu' | 'adjust' | null;

export function PracticesGuide() {
  const { t } = useT();
  const keys = useVisibleKeys();
  const [tried, setTried] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [panel, setPanel] = useState<Panel>(null);

  const sample = useMemo<TaskWithSubs>(
    () => ({
      id: 'guide-sample',
      character_id: 'guide',
      title: t(`${HELP}.sampleTitle`),
      description: null,
      task_type: 'daily',
      recurrence: { type: 'daily' },
      target_count: 1,
      is_archived: false,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      template_id: null,
      icon: 'leaf-outline',
      coin_multiplier: 1,
      subs: [{ sub_id: 'contemplate', stars: 2 }],
      primary_sub_id: 'contemplate',
      primary_dimension_id: 'mind',
      total_stars: 2,
    }),
    [t],
  );

  const act = (f: Feedback, p: Panel = null) => {
    setTried(true);
    setFeedback(f);
    setPanel(p);
  };

  const doneItem = useMemo<CompletedItem[]>(
    () => [
      {
        task: sample,
        completionId: 'guide-done',
        xp: SAMPLE_XP,
        coins: SAMPLE_XP,
        subs: sample.subs,
        at: new Date().toISOString(),
        coinMultiplier: 1,
      },
    ],
    [sample],
  );
  const skippedItem = useMemo<CompletedItem[]>(() => [{ task: sample }], [sample]);

  const steps: Record<
    StepKey,
    { icon: keyof typeof Ionicons.glyphMap; iconColor?: string; replica?: React.ReactNode }
  > = {
    days: { icon: 'calendar-number-outline', replica: <DayNavReplica /> },
    stats: { icon: 'flash-outline', iconColor: tokens.semantic.coin, replica: <StatsReplica /> },
    closeDay: { icon: 'checkmark-done-outline', replica: <ClearDayReplica label={t('home.clearDay.cta')} /> },
    done: {
      icon: 'checkmark-circle-outline',
      replica: (
        <CompletedBucket
          items={doneItem}
          title={t('home.completedBucket.today')}
          open
          onUndo={() => {}}
          onExtra={() => {}}
        />
      ),
    },
    skipped: {
      icon: 'play-skip-forward-outline',
      replica: (
        <CompletedBucket
          items={skippedItem}
          title={t('home.skippedBucket.today')}
          variant="skipped"
          open
          onUnskip={() => {}}
        />
      ),
    },
    mood: {
      icon: 'happy-outline',
      replica: (
        <View style={styles.card}>
          <MoodCardHeader
            eyebrow={t('mood.prompt.title')}
            action={t('mood.cta.fill')}
            a11yLabel={t('mood.cta.full')}
            onPress={() => {}}
          />
          <MoodFaceRow value={null} onSelect={() => {}} size="sm" showLabels={false} />
        </View>
      ),
    },
    redemptions: { icon: 'gift-outline', iconColor: tokens.semantic.coin, replica: <RedemptionsReplica /> },
    buttons: { icon: 'albums-outline', replica: <FabsReplica /> },
    quests: { icon: 'flag-outline', iconColor: tokens.semantic.coin, replica: <QuestsReplica /> },
    week: { icon: 'calendar-outline', replica: <WeekReplica /> },
  };

  const gestureKeys = keys.filter(isGesture);
  const stepKeys = keys.filter((k): k is StepKey => !isGesture(k));

  return (
    <>
      <GuideLabel>{t(`${HELP}.cardLabel`)}</GuideLabel>
      <GuidePlayground column>
        <View>
          <TaskCard
            task={sample}
            onComplete={() => act('done')}
            onSwipeComplete={() => act(null, 'adjust')}
            onSkip={() => act('skipped')}
            // Since #511 the card itself routes a TAP on its body to
            // onLongPress (the menu) and a HOLD to onEdit.
            onLongPress={() => act(null, 'menu')}
            onEdit={() => act('edit')}
          />
          {!tried && <GuideTapHint />}
        </View>

        {feedback && <DemoFeedback kind={feedback} />}
        {panel === 'menu' && <MenuReplica />}
        {panel === 'adjust' && <AdjustReplica />}

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

/** What the gesture would have done, in one line. */
function DemoFeedback({ kind }: { kind: Exclude<Feedback, null> }) {
  const { t } = useT();
  const text =
    kind === 'done'
      ? t(`${HELP}.demoDone`, { xp: SAMPLE_XP, coins: SAMPLE_XP })
      : kind === 'skipped'
        ? t(`${HELP}.demoSkipped`)
        : t(`${HELP}.demoEdit`);
  const icon: keyof typeof Ionicons.glyphMap =
    kind === 'done' ? 'checkmark-circle' : kind === 'skipped' ? 'play-skip-forward' : 'create-outline';
  return (
    <View style={styles.feedback}>
      <Ionicons name={icon} size={15} color={kind === 'done' ? tokens.semantic.coin : tokens.text.mid} />
      <Text style={styles.feedbackText}>{text}</Text>
    </View>
  );
}

/** The hold menu (TaskActionSheet), inert. */
function MenuReplica() {
  const { t } = useT();
  const rows: { icon: keyof typeof Ionicons.glyphMap; color: string; title: string; sub: string }[] = [
    {
      icon: 'star',
      color: tokens.semantic.coin,
      title: t('tasks.actionSheet.adjustStars'),
      sub: t('tasks.actionSheet.adjustStarsSub'),
    },
    {
      icon: 'play-skip-forward-outline',
      color: tokens.text.hi,
      title: t('tasks.actionSheet.skipToday'),
      sub: t('tasks.actionSheet.skipTodaySub'),
    },
    {
      icon: 'create-outline',
      color: tokens.text.hi,
      title: t('tasks.actionSheet.editTask'),
      sub: t('tasks.actionSheet.editTaskSub'),
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

/** The adjust sheet (CompleteTaskSheet), inert: stars per sub-area, the
 *  coins for this log only, and how many times. */
function AdjustReplica() {
  const { t } = useT();
  return (
    <View style={styles.panel}>
      <Text style={styles.panelLabel}>{t(`${HELP}.adjustLabel`)}</Text>
      <View style={styles.adjustRow}>
        <Text style={styles.adjustName}>{t('tasks.completeSheet.totalStars')}</Text>
        <Stepper value="2★" />
      </View>
      <View style={styles.adjustRow}>
        <Text style={styles.adjustName}>{t(`${HELP}.adjustCoins`)}</Text>
        <View style={styles.coinChips}>
          {(['none', 'half', 'same', 'double'] as const).map((m) => (
            <View key={m} style={[styles.coinChip, m === 'same' && styles.coinChipOn]}>
              <Text style={[styles.coinChipText, m === 'same' && styles.coinChipTextOn]}>
                {t(`${HELP}.coinLevels.${m}`)}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.adjustRow}>
        <Text style={styles.adjustName}>{t('tasks.completeSheet.times')}</Text>
        <Stepper value="1" />
      </View>
    </View>
  );
}

function Stepper({ value }: { value: string }) {
  return (
    <View style={styles.stepper}>
      <Ionicons name="remove" size={14} color={tokens.text.mid} />
      <Text style={styles.stepperValue}>{value}</Text>
      <Ionicons name="add" size={14} color={tokens.text.mid} />
    </View>
  );
}

/** ‹ Segunda, 3 out › — the header's day navigation, small. */
function DayNavReplica() {
  const { locale } = useT();
  const label = useMemo(() => {
    const raw = new Date().toLocaleDateString(locale === 'en' ? 'en-US' : 'pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [locale]);
  return (
    <View style={styles.dayNav}>
      <Ionicons name="chevron-back" size={18} color={tokens.text.hi} />
      <Text style={styles.dayNavText} numberOfLines={1}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={tokens.text.faint} />
      <Ionicons name="swap-horizontal" size={16} color={tokens.brand.violet2} style={styles.dayNavSwipe} />
    </View>
  );
}

/** ⚡ 40  🪙 40  ☺ — the header's stat row. */
function StatsReplica() {
  return (
    <View style={styles.stats}>
      <View style={styles.stat}>
        <Ionicons name="flash" size={16} color={tokens.brand.violet2} />
        <Text style={styles.statValue}>40</Text>
      </View>
      <View style={styles.stat}>
        <CoinIcon size={16} />
        <Text style={[styles.statValue, { color: tokens.semantic.coin }]}>40</Text>
      </View>
      <MoodFacePlaceholder size={24} />
    </View>
  );
}

/** "Fechar o dia" — same look as the button on the screen (index.tsx). */
function ClearDayReplica({ label }: { label: string }) {
  return (
    <View style={styles.clearDay}>
      <Ionicons name="checkmark-done-outline" size={16} color={tokens.brand.violet2} />
      <Text style={styles.clearDayText}>{label}</Text>
    </View>
  );
}

/** "Resgates do dia" — its header with the gold + and the empty line. */
function RedemptionsReplica() {
  const { t } = useT();
  return (
    <View style={styles.card}>
      <View style={styles.redeemHead}>
        <Text style={styles.redeemTitle}>{t('home.redemptions.title')}</Text>
        <View style={styles.redeemAdd}>
          <Ionicons name="add" size={16} color="#3D2A00" />
        </View>
      </View>
      <Text style={styles.redeemEmpty}>{t('home.redemptions.empty')}</Text>
    </View>
  );
}

/** The two floating buttons: calendar on top, the violet one below. */
function FabsReplica() {
  return (
    <View style={styles.fabs}>
      <View style={[styles.fab, styles.fabSmall]}>
        <Ionicons name="calendar-outline" size={20} color={tokens.text.hi} />
      </View>
      <View style={[styles.fab, styles.fabMain]}>
        <Ionicons name="albums-outline" size={24} color={tokens.text.hi} />
      </View>
    </View>
  );
}

/** The quest chips' browse pills ("+ Missões", "+ Metas"). */
function QuestsReplica() {
  const { t } = useT();
  return (
    <View style={styles.pills}>
      <View style={styles.questPill}>
        <Ionicons name="add" size={13} color={tokens.semantic.coin} />
        <Text style={[styles.questPillText, { color: tokens.semantic.coin }]}>
          {t('home.quests.browseChip')}
        </Text>
      </View>
      <View style={styles.questPill}>
        <Ionicons name="add" size={13} color="#FF9F5A" />
        <Text style={[styles.questPillText, { color: '#FF9F5A' }]}>{t('home.goals.browseChip')}</Text>
      </View>
    </View>
  );
}

/** The Minha Semana invite. */
function WeekReplica() {
  const { t } = useT();
  return (
    <View style={styles.card}>
      <Text style={styles.redeemTitle}>{t('week.strip.setupCta')}</Text>
      <Text style={styles.redeemEmpty}>{t('week.strip.setupSub')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: tokens.space[3],
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
    gap: tokens.space[2],
  },
  feedback: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
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
    backgroundColor: 'rgba(123, 92, 255, 0.12)',
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
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  adjustName: {
    flexShrink: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: tokens.text.base,
  },
  coinChips: { flexDirection: 'row', gap: 4 },
  coinChip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  coinChipOn: {
    borderColor: tokens.semantic.coin,
    backgroundColor: 'rgba(255, 200, 61, 0.14)',
  },
  coinChipText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    color: tokens.text.mid,
  },
  coinChipTextOn: { color: tokens.semantic.coin },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  stepperValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    color: tokens.text.hi,
  },
  dayNav: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dayNavText: {
    flexShrink: 1,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: tokens.text.hi,
  },
  dayNavSwipe: { marginLeft: 'auto' },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: tokens.text.hi,
  },
  clearDay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 40,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(155, 130, 255, 0.45)',
    backgroundColor: 'rgba(123, 92, 255, 0.12)',
  },
  clearDayText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    color: tokens.brand.violet2,
    letterSpacing: 0.2,
  },
  redeemHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  redeemTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    color: tokens.text.hi,
  },
  redeemAdd: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.semantic.coin,
  },
  redeemEmpty: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: tokens.text.mid,
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
  fabMain: { width: 48, height: 48, backgroundColor: tokens.brand.violet },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  questPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.border.strong,
  },
  questPillText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
});
