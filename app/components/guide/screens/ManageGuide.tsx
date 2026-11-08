import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import {
  GuideGesture,
  GuideGestureRow,
  GuidePlayground,
  GuideTapHint,
  GuideTryIt,
} from '@/components/guide/GuidePlayground';
import { GuideFit } from '@/components/guide/GuideFit';
import { GuideLabel, GuideStep } from '@/components/guide/GuideStep';
import {
  ArchivedFooter,
  ManageArchivedRow,
  archivedMetaStyle,
} from '@/components/manage/ArchivedFooter';
import { ManageDoor } from '@/components/manage/ManageDoors';
import { ManageGroupEmpty, ManageGroupHeader } from '@/components/manage/ManageGroupHeader';
import { ManageSearchField, manageRowStyles } from '@/components/manage/ManageList';
import { ManageIconButton } from '@/components/manage/ManageTopBar';
import { PracticeManageRow } from '@/components/manage/PracticeManageRow';
import { BUCKETS, type PracticeBucket } from '@/components/manage/practiceBuckets';
import { RewardCostTag, RewardManageRow } from '@/components/manage/RewardManageRow';
import type { Reward, RewardCategory, SubId, DimensionId, TaskWithSubs } from '@/lib/db/types';
import { screenGuidePrompt } from '@/lib/guide';
import { useT } from '@/lib/i18n';
import { useRewardLimit, useTaskLimit, type EntityLimit } from '@/lib/premium';
import { tokens } from '@/theme';

/**
 * The guides of the two Gerenciar screens — /tasks (práticas) and
 * /rewards-manage (recompensas) — docs/informativo-de-tela.md. One file
 * because the screens are ONE pattern (owner, 2026-11-07): same doors,
 * same rows, same Arquivadas, same header; the guides mirror that, item
 * for item, and only the content differs.
 *
 * "Na lista" is a playground with the screen's REAL rows on sample data:
 * tap a row (the edit form, answered with a line), tap the handle (stands
 * in for the drag: the row moves one slot down; in práticas, past the
 * group's end it lands in the other group, which is what changes WHEN it
 * happens). A real drag can't live here — the drag list cannot nest in the
 * sheet's ScrollView — so the tap moves the row and the line says how the
 * screen does it.
 *
 * The free-plan item is gated: Premium has no counter, so it leaves the
 * sheet and the prompt alike.
 */

const PRACTICES = 'tasksHub.help';
const REWARDS = 'rewardsHub.help';

/** Every option of Gerenciar práticas, in the guide's order. */
export const MANAGE_PRACTICES_GUIDE_ITEMS = [
  'edit',
  'drag',
  'regroup',
  'create',
  'suggested',
  'groups',
  'search',
  'calendar',
  'archived',
  'limit',
] as const;

/** Every option of Gerenciar recompensas, in the guide's order. */
export const MANAGE_REWARDS_GUIDE_ITEMS = [
  'edit',
  'drag',
  'create',
  'suggested',
  'search',
  'calendar',
  'archived',
  'limit',
] as const;

type PracticesKey = (typeof MANAGE_PRACTICES_GUIDE_ITEMS)[number];
type RewardsKey = (typeof MANAGE_REWARDS_GUIDE_ITEMS)[number];
type GestureKey = 'edit' | 'drag' | 'regroup';

const GESTURES: readonly string[] = ['edit', 'drag', 'regroup'];
const isGesture = (k: string): k is GestureKey => GESTURES.includes(k);

const GESTURE_ICONS: Record<GestureKey, keyof typeof Ionicons.glyphMap> = {
  edit: 'create-outline',
  drag: 'reorder-three-outline',
  regroup: 'swap-vertical-outline',
};

interface Step {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  replica?: React.ReactNode;
}

/** Keys shown to this person: the free-plan item only on the free plan. */
function useVisibleKeys<K extends string>(items: readonly K[], limit: EntityLimit): K[] {
  return useMemo(
    () => items.filter((k) => k !== 'limit' || !limit.unlimited),
    [items, limit.unlimited],
  );
}

/** The AI door's prompt for Gerenciar práticas. */
export function useManagePracticesGuidePrompt(): string {
  const { t } = useT();
  const keys = useVisibleKeys(MANAGE_PRACTICES_GUIDE_ITEMS, useTaskLimit());
  return useMemo(() => screenGuidePrompt(t, PRACTICES, keys), [t, keys]);
}

/** The AI door's prompt for Gerenciar recompensas. */
export function useManageRewardsGuidePrompt(): string {
  const { t } = useT();
  const keys = useVisibleKeys(MANAGE_REWARDS_GUIDE_ITEMS, useRewardLimit());
  return useMemo(() => screenGuidePrompt(t, REWARDS, keys), [t, keys]);
}

/** A free-plan counter near the cap, for the "Plano gratuito" replica. */
function sampleLimit(entity: 'task' | 'reward'): EntityLimit {
  return entity === 'task'
    ? { entity, count: 8, limit: 10, unlimited: false, atLimit: false, near: true }
    : { entity, count: 4, limit: 5, unlimited: false, atLimit: false, near: true };
}

const noop = () => {};

// ─────────────────────────────────────────────────────────────────────────────
// Gerenciar práticas
// ─────────────────────────────────────────────────────────────────────────────

type PracticeId = 'a' | 'b' | 'c';
type PracticeFeedback = 'edit' | 'reorder' | 'periodic' | 'daily' | null;

const PRACTICE_SAMPLES: Record<
  PracticeId,
  { icon: string; sub: SubId; dim: DimensionId; stars: 1 | 2; catalog: boolean }
> = {
  a: { icon: 'water-outline', sub: 'nutrition', dim: 'health', stars: 1, catalog: true },
  b: { icon: 'leaf-outline', sub: 'contemplate', dim: 'mind', stars: 2, catalog: false },
  c: { icon: 'call-outline', sub: 'circle', dim: 'bonds', stars: 2, catalog: true },
};

const SAMPLE_TITLE: Record<PracticeId, string> = { a: 'sampleA', b: 'sampleB', c: 'sampleC' };

/** A sample practice, its schedule following the group it sits in — so a
 *  row moved into Periódicas reads "2× por semana" and one moved back
 *  reads as a plain daily. */
function samplePractice(id: PracticeId, title: string, bucket: PracticeBucket): TaskWithSubs {
  const s = PRACTICE_SAMPLES[id];
  return {
    id: `guide-${id}`,
    character_id: 'guide',
    title,
    description: null,
    task_type: bucket === 'daily' ? 'daily' : 'weekly',
    recurrence: bucket === 'daily' ? { type: 'daily' } : { type: 'weekly' },
    target_count: bucket === 'daily' ? 1 : 2,
    is_archived: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    template_id: s.catalog ? 'guide-template' : null,
    icon: s.icon,
    coin_multiplier: 1,
    coin_stars: null,
    subs: [{ sub_id: s.sub, stars: s.stars }],
    primary_sub_id: s.sub,
    primary_dimension_id: s.dim,
    total_stars: s.stars,
  };
}

export function ManagePracticesGuide({ suggestedCount }: { suggestedCount: number }) {
  const { t } = useT();
  const limit = useTaskLimit();
  const keys = useVisibleKeys(MANAGE_PRACTICES_GUIDE_ITEMS, limit);
  // The screen's real content width (16dp gutters): the miniatures are laid
  // out at it and scaled to the sheet, so rows keep their proportions.
  const naturalWidth = useWindowDimensions().width - 32;
  const [tried, setTried] = useState(false);
  const [feedback, setFeedback] = useState<PracticeFeedback>(null);
  const [groups, setGroups] = useState<Record<PracticeBucket, PracticeId[]>>({
    daily: ['a', 'b'],
    periodic: ['c'],
  });
  const [collapsed, setCollapsed] = useState<Record<PracticeBucket, boolean>>({
    daily: false,
    periodic: false,
  });

  const tryIt = (fn: () => void) => () => {
    setTried(true);
    fn();
  };

  /** The handle's stand-in for a drag: one slot down; past the group's
   *  end, into the top of the other group (and that group opens, like on
   *  the screen — a row never lands behind a closed header). */
  const moveDown = (id: PracticeId) => {
    const from: PracticeBucket = groups.daily.includes(id) ? 'daily' : 'periodic';
    const to: PracticeBucket = from === 'daily' ? 'periodic' : 'daily';
    const list = groups[from];
    const i = list.indexOf(id);
    if (i < list.length - 1) {
      const next = [...list];
      next[i] = list[i + 1]!;
      next[i + 1] = id;
      setGroups({ ...groups, [from]: next });
      setFeedback('reorder');
      return;
    }
    setGroups({
      ...groups,
      [from]: list.filter((x) => x !== id),
      [to]: [id, ...groups[to]],
    });
    setCollapsed((prev) => ({ ...prev, [to]: false }));
    setFeedback(to);
  };

  const doorWidth = (naturalWidth - tokens.space[3]) / 2;

  const steps: Record<Exclude<PracticesKey, GestureKey>, Step> = {
    create: {
      icon: 'create-outline',
      replica: (
        <DoorReplica
          width={doorWidth}
          variant="create"
          title={t('tasksHub.doors.create')}
          desc={t('tasksHub.doors.createDesc')}
        />
      ),
    },
    suggested: {
      icon: 'albums-outline',
      iconColor: tokens.semantic.coin,
      replica: (
        <DoorReplica
          width={doorWidth}
          variant="suggested"
          title={t('tasksHub.doors.suggested')}
          desc={t('tasksHub.doors.suggestedDesc', { count: suggestedCount })}
        />
      ),
    },
    groups: {
      icon: 'layers-outline',
      replica: (
        <GuideFit naturalWidth={naturalWidth}>
          <View>
            {BUCKETS.map((meta) => (
              <ManageGroupHeader
                key={meta.id}
                icon={meta.iconName}
                accent={meta.accent}
                accentBg={meta.accentBg}
                label={t(meta.labelKey)}
                desc={t(meta.descKey)}
                count={meta.id === 'daily' ? 2 : 1}
                collapsed={false}
                onToggle={noop}
              />
            ))}
          </View>
        </GuideFit>
      ),
    },
    search: {
      icon: 'search',
      replica: <SearchReplica width={naturalWidth} placeholder={t('tasksHub.search.placeholderMine')} />,
    },
    calendar: {
      icon: 'calendar-outline',
      replica: <ManageIconButton icon="calendar-outline" onPress={noop} a11yLabel="" />,
    },
    archived: {
      icon: 'archive-outline',
      replica: (
        <GuideFit naturalWidth={naturalWidth}>
          <ArchivedFooter label={t('tasksHub.archived.section')} count={1} open onToggle={noop}>
            <ManageArchivedRow
              icon="barbell-outline"
              title={t(`${PRACTICES}.sampleArchived`)}
              meta={<Text style={archivedMetaStyle}>{t('recurrence.everyDay')}</Text>}
              busy={false}
              onRestore={noop}
              onDelete={noop}
              restoreLabel={t('tasksHub.archived.restore')}
              restoreA11y=""
              deleteA11y=""
            />
          </ArchivedFooter>
        </GuideFit>
      ),
    },
    limit: {
      icon: 'ribbon-outline',
      iconColor: tokens.semantic.coin,
      replica: (
        <DoorReplica
          width={doorWidth}
          variant="create"
          title={t('tasksHub.doors.create')}
          desc={t('tasksHub.doors.createDesc')}
          limit={sampleLimit('task')}
        />
      ),
    },
  };

  const gestureKeys = keys.filter((k): k is Extract<PracticesKey, GestureKey> => isGesture(k));
  const stepKeys = keys.filter((k): k is Exclude<PracticesKey, GestureKey> => !isGesture(k));

  const feedbackText =
    feedback === 'edit'
      ? t(`${PRACTICES}.demoEdit`)
      : feedback === 'reorder'
        ? t(`${PRACTICES}.demoReorder`)
        : feedback === 'periodic'
          ? t(`${PRACTICES}.demoPeriodic`)
          : feedback === 'daily'
            ? t(`${PRACTICES}.demoDaily`)
            : null;

  return (
    <>
      <GuideLabel>{t(`${PRACTICES}.listLabel`)}</GuideLabel>
      <GuidePlayground column>
        <GuideFit naturalWidth={naturalWidth}>
          <View>
            {BUCKETS.map((meta) => {
              const ids = groups[meta.id];
              return (
                <View key={meta.id}>
                  <ManageGroupHeader
                    icon={meta.iconName}
                    accent={meta.accent}
                    accentBg={meta.accentBg}
                    label={t(meta.labelKey)}
                    desc={t(meta.descKey)}
                    count={ids.length}
                    collapsed={collapsed[meta.id]}
                    onToggle={() =>
                      setCollapsed((prev) => ({ ...prev, [meta.id]: !prev[meta.id] }))
                    }
                  />
                  {collapsed[meta.id] ? null : ids.length === 0 ? (
                    <ManageGroupEmpty text={t('tasksHub.bucketEmpty')} />
                  ) : (
                    ids.map((id, i) => (
                      <View key={id}>
                        <PracticeManageRow
                          task={samplePractice(id, t(`${PRACTICES}.${SAMPLE_TITLE[id]}`), meta.id)}
                          onEdit={tryIt(() => setFeedback('edit'))}
                          onHandlePress={tryIt(() => moveDown(id))}
                        />
                        {/* The hand sits on the first row's top-right
                            corner — right over the handle. */}
                        {!tried && meta.id === 'daily' && i === 0 && <GuideTapHint />}
                      </View>
                    ))
                  )}
                </View>
              );
            })}
          </View>
        </GuideFit>

        {feedbackText ? <FeedbackLine text={feedbackText} /> : null}

        <GuideTryIt>{t(`${PRACTICES}.tryIt`)}</GuideTryIt>
        <GuideGestureRow>
          {gestureKeys.map((k) => (
            <GuideGesture
              key={k}
              icon={GESTURE_ICONS[k]}
              title={t(`${PRACTICES}.items.${k}.title`)}
              body={t(`${PRACTICES}.items.${k}.body`)}
            />
          ))}
        </GuideGestureRow>
      </GuidePlayground>

      <GuideLabel>{t(`${PRACTICES}.screenLabel`)}</GuideLabel>
      {stepKeys.map((k) => (
        <GuideStep
          key={k}
          icon={steps[k].icon}
          iconColor={steps[k].iconColor}
          title={t(`${PRACTICES}.items.${k}.title`)}
          body={t(`${PRACTICES}.items.${k}.body`)}
        >
          {steps[k].replica}
        </GuideStep>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Gerenciar recompensas
// ─────────────────────────────────────────────────────────────────────────────

type RewardId = 'a' | 'b' | 'c';

const REWARD_SAMPLES: Record<
  RewardId,
  { title: string; cost: number; icon: string; category: RewardCategory; catalog: boolean }
> = {
  a: { title: 'sampleA', cost: 120, icon: 'cafe-outline', category: 'indulgence', catalog: true },
  b: { title: 'sampleB', cost: 60, icon: 'tv-outline', category: 'indulgence', catalog: false },
  c: { title: 'sampleC', cost: 400, icon: 'restaurant-outline', category: 'experience', catalog: true },
};

function sampleReward(id: string, title: string, s: (typeof REWARD_SAMPLES)[RewardId]): Reward {
  return {
    id: `guide-${id}`,
    character_id: 'guide',
    title,
    description: null,
    cost: s.cost,
    icon: s.icon,
    category: s.category,
    is_one_shot: false,
    template_id: s.catalog ? 'guide-template' : null,
    is_archived: false,
    sort_order: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

export function ManageRewardsGuide({ suggestedCount }: { suggestedCount: number }) {
  const { t } = useT();
  const limit = useRewardLimit();
  const keys = useVisibleKeys(MANAGE_REWARDS_GUIDE_ITEMS, limit);
  const naturalWidth = useWindowDimensions().width - 32;
  const [tried, setTried] = useState(false);
  const [feedback, setFeedback] = useState<'edit' | 'reorder' | null>(null);
  const [order, setOrder] = useState<RewardId[]>(['a', 'b', 'c']);

  const tryIt = (fn: () => void) => () => {
    setTried(true);
    fn();
  };

  /** The handle's stand-in for a drag: one slot down, the last back to
   *  the top. */
  const moveDown = (id: RewardId) => {
    const i = order.indexOf(id);
    if (i < order.length - 1) {
      const next = [...order];
      next[i] = order[i + 1]!;
      next[i + 1] = id;
      setOrder(next);
    } else {
      setOrder([id, ...order.filter((x) => x !== id)]);
    }
    setFeedback('reorder');
  };

  const doorWidth = (naturalWidth - tokens.space[3]) / 2;

  const steps: Record<Exclude<RewardsKey, GestureKey>, Step> = {
    create: {
      icon: 'create-outline',
      replica: (
        <DoorReplica
          width={doorWidth}
          variant="create"
          title={t('rewardsHub.doors.create')}
          desc={t('rewardsHub.doors.createDesc')}
        />
      ),
    },
    suggested: {
      icon: 'albums-outline',
      iconColor: tokens.semantic.coin,
      replica: (
        <DoorReplica
          width={doorWidth}
          variant="suggested"
          title={t('rewardsHub.doors.suggested')}
          desc={t('rewardsHub.doors.suggestedDesc', { count: suggestedCount })}
        />
      ),
    },
    search: {
      icon: 'search',
      replica: (
        <SearchReplica width={naturalWidth} placeholder={t('rewardsHub.search.placeholderMine')} />
      ),
    },
    calendar: {
      icon: 'calendar-outline',
      replica: <ManageIconButton icon="calendar-outline" onPress={noop} a11yLabel="" />,
    },
    archived: {
      icon: 'archive-outline',
      replica: (
        <GuideFit naturalWidth={naturalWidth}>
          <ArchivedFooter label={t('rewardsHub.archived.section')} count={1} open onToggle={noop}>
            <ManageArchivedRow
              icon="pizza-outline"
              title={t(`${REWARDS}.sampleArchived`)}
              meta={
                <View style={manageRowStyles.metaRow}>
                  <RewardCostTag cost={80} />
                  <Text style={archivedMetaStyle}>· {t('rewards.categories.indulgence')}</Text>
                </View>
              }
              busy={false}
              onRestore={noop}
              onDelete={noop}
              restoreLabel={t('rewardsHub.archived.restore')}
              restoreA11y=""
              deleteA11y=""
            />
          </ArchivedFooter>
        </GuideFit>
      ),
    },
    limit: {
      icon: 'ribbon-outline',
      iconColor: tokens.semantic.coin,
      replica: (
        <DoorReplica
          width={doorWidth}
          variant="create"
          title={t('rewardsHub.doors.create')}
          desc={t('rewardsHub.doors.createDesc')}
          limit={sampleLimit('reward')}
        />
      ),
    },
  };

  const gestureKeys = keys.filter((k): k is Extract<RewardsKey, GestureKey> => isGesture(k));
  const stepKeys = keys.filter((k): k is Exclude<RewardsKey, GestureKey> => !isGesture(k));

  return (
    <>
      <GuideLabel>{t(`${REWARDS}.listLabel`)}</GuideLabel>
      <GuidePlayground column>
        <GuideFit naturalWidth={naturalWidth}>
          <View>
            {order.map((id, i) => (
              <View key={id}>
                <RewardManageRow
                  reward={sampleReward(id, t(`${REWARDS}.${REWARD_SAMPLES[id].title}`), REWARD_SAMPLES[id])}
                  bought={false}
                  onEdit={tryIt(() => setFeedback('edit'))}
                  onHandlePress={tryIt(() => moveDown(id))}
                />
                {!tried && i === 0 && <GuideTapHint />}
              </View>
            ))}
          </View>
        </GuideFit>

        {feedback ? (
          <FeedbackLine
            text={feedback === 'edit' ? t(`${REWARDS}.demoEdit`) : t(`${REWARDS}.demoReorder`)}
          />
        ) : null}

        <GuideTryIt>{t(`${REWARDS}.tryIt`)}</GuideTryIt>
        <GuideGestureRow>
          {gestureKeys.map((k) => (
            <GuideGesture
              key={k}
              icon={GESTURE_ICONS[k]}
              title={t(`${REWARDS}.items.${k}.title`)}
              body={t(`${REWARDS}.items.${k}.body`)}
            />
          ))}
        </GuideGestureRow>
      </GuidePlayground>

      <GuideLabel>{t(`${REWARDS}.screenLabel`)}</GuideLabel>
      {stepKeys.map((k) => (
        <GuideStep
          key={k}
          icon={steps[k].icon}
          iconColor={steps[k].iconColor}
          title={t(`${REWARDS}.items.${k}.title`)}
          body={t(`${REWARDS}.items.${k}.body`)}
        >
          {steps[k].replica}
        </GuideStep>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared replicas
// ─────────────────────────────────────────────────────────────────────────────

/** One door at its real width (half the screen), scaled down if the sheet
 *  is narrower. The row wrapper gives the door's flex: 1 a width to fill. */
function DoorReplica({
  width,
  variant,
  title,
  desc,
  limit,
}: {
  width: number;
  variant: 'create' | 'suggested';
  title: string;
  desc: string;
  limit?: EntityLimit;
}) {
  return (
    <GuideFit naturalWidth={width}>
      <View style={styles.doorRow}>
        <ManageDoor variant={variant} title={title} desc={desc} onPress={noop} limit={limit} />
      </View>
    </GuideFit>
  );
}

/** The search field as it opens under the doors, laid out at the full
 *  screen width — the field carries the screen's 16dp gutters itself. */
function SearchReplica({ width, placeholder }: { width: number; placeholder: string }) {
  return (
    <GuideFit naturalWidth={width + tokens.space[4] * 2}>
      <View style={styles.searchBleed}>
        <ManageSearchField value="" onChangeText={noop} placeholder={placeholder} autoFocus={false} />
      </View>
    </GuideFit>
  );
}

function FeedbackLine({ text }: { text: string }) {
  return (
    <View style={styles.feedback}>
      <Ionicons name="sparkles" size={15} color={tokens.brand.violet2} />
      <Text style={styles.feedbackText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  doorRow: { flexDirection: 'row' },
  // Cancels the field's top margin (it sits under the doors on screen).
  searchBleed: { marginTop: -tokens.space[3] },
  feedback: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  feedbackText: {
    flex: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    lineHeight: 17,
    color: tokens.text.hi,
  },
});
