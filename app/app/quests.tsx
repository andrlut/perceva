import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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

import { QuestCard } from '@/components/QuestCard';
import { QuestTemplateCard } from '@/components/QuestTemplateCard';
import {
  useAbandonQuest,
  useCompleteQuest,
  useQuestTemplates,
  useQuests,
  useStartQuestFromTemplate,
} from '@/lib/api/quests';
import type { QuestTemplate } from '@/lib/db/types';
import { confirmAction, showInfo } from '@/lib/util/confirm';
import { tokens } from '@/theme';
import { getQuestCategoryMeta } from '@/theme/quests';

/** Display order for category groupings — keeps the board scannable. */
const CATEGORY_ORDER = ['fitness', 'health', 'mind', 'wealth', 'bonds', 'craft'];

export default function QuestBoardScreen() {
  const router = useRouter();
  const quests = useQuests();
  const templates = useQuestTemplates();
  const startTemplate = useStartQuestFromTemplate();
  const completeQuest = useCompleteQuest();
  const abandonQuest = useAbandonQuest();
  const [busyId, setBusyId] = useState<string | null>(null);

  const { active, others } = useMemo(() => {
    const all = quests.data ?? [];
    return {
      active: all.filter((q) => q.quest.status === 'active'),
      others: all.filter((q) => q.quest.status !== 'active').slice(0, 5),
    };
  }, [quests.data]);

  // Templates the user already has an active or recent copy of —
  // dim them so the user knows.
  const activeTemplateIds = useMemo(() => {
    const set = new Set<string>();
    (quests.data ?? []).forEach((q) => {
      if (q.quest.template_id && q.quest.status === 'active') {
        set.add(q.quest.template_id);
      }
    });
    return set;
  }, [quests.data]);

  // Group templates by category so the board reads as a curated catalog
  // instead of a flat dump. Categories rendered in CATEGORY_ORDER first,
  // then any unknown ones at the end (defensive — catalog can grow).
  const templatesByCategory = useMemo(() => {
    const map = new Map<string, QuestTemplate[]>();
    for (const t of templates.data ?? []) {
      const arr = map.get(t.category) ?? [];
      arr.push(t);
      map.set(t.category, arr);
    }
    return map;
  }, [templates.data]);

  const orderedCategories = useMemo(() => {
    const known = CATEGORY_ORDER.filter((c) => templatesByCategory.has(c));
    const unknown = Array.from(templatesByCategory.keys()).filter(
      (c) => !CATEGORY_ORDER.includes(c),
    );
    return [...known, ...unknown];
  }, [templatesByCategory]);

  const handleStart = async (templateId: string) => {
    setBusyId(templateId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      await startTemplate.mutateAsync(templateId);
    } catch (e) {
      const err = e as { message?: string; code?: string; details?: string; hint?: string };
      console.error('[start_quest_from_template] failed', err);
      const msg =
        [err.message, err.code, err.details, err.hint].filter(Boolean).join('\n') ||
        'Unknown error';
      showInfo('Could not start quest', msg);
    } finally {
      setBusyId(null);
    }
  };

  const handleClaim = async (questId: string) => {
    setBusyId(questId);
    try {
      const result = await completeQuest.mutateAsync(questId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      showInfo(
        'Quest complete!',
        `+${result.reward_xp} XP and +${result.reward_coins} coins.`,
      );
    } catch (e) {
      const err = e as { message?: string; code?: string; details?: string; hint?: string };
      console.error('[complete_quest] failed', err);
      const msg =
        [err.message, err.code, err.details, err.hint].filter(Boolean).join('\n') ||
        'Unknown error';
      showInfo('Could not claim', msg);
    } finally {
      setBusyId(null);
    }
  };

  const handleAbandon = async (questId: string, title: string) => {
    const ok = await confirmAction(
      'Abandon quest?',
      `"${title}" will be marked as abandoned. No reward.`,
      { okText: 'Abandon', cancelText: 'Keep it', destructive: true },
    );
    if (!ok) return;
    setBusyId(questId);
    try {
      await abandonQuest.mutateAsync(questId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      showInfo('Could not abandon', msg);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
          hitSlop={8}
        >
          <Ionicons name="close" size={24} color={tokens.text.hi} />
        </Pressable>
        <Text style={styles.headerTitle}>Quest Board</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={quests.isRefetching || templates.isRefetching}
            onRefresh={() => {
              quests.refetch();
              templates.refetch();
            }}
            tintColor={tokens.brand.violet2}
          />
        }
      >
        <Text style={styles.tagline}>
          Pick something hard. Claim a reward. Or set your own.
        </Text>

        {/* Active quests */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your active quests</Text>
          {active.length > 0 && (
            <Text style={styles.sectionMeta}>{active.length}</Text>
          )}
        </View>

        {quests.isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={tokens.brand.violet2} />
          </View>
        ) : active.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="trophy-outline" size={36} color={tokens.text.dim} />
            <Text style={styles.emptyTitle}>No active quests</Text>
            <Text style={styles.emptySub}>
              Tap a template below to take one on.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {active.map((q) => (
              <QuestCard
                key={q.quest.id}
                data={q}
                onClaim={() => handleClaim(q.quest.id)}
                onAbandon={
                  busyId !== q.quest.id
                    ? () => handleAbandon(q.quest.id, q.quest.title)
                    : undefined
                }
              />
            ))}
          </View>
        )}

        {/* Templates — grouped by category */}
        <View style={[styles.sectionHeader, { marginTop: tokens.space[6] }]}>
          <Text style={styles.sectionTitle}>Quest Board</Text>
          <Text style={styles.sectionMeta}>system catalog</Text>
        </View>

        {templates.isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={tokens.brand.violet2} />
          </View>
        ) : (
          <View style={styles.categoryList}>
            {orderedCategories.map((cat) => {
              const meta = getQuestCategoryMeta(cat);
              const items = templatesByCategory.get(cat) ?? [];
              return (
                <View key={cat} style={styles.categoryBlock}>
                  <View style={styles.categoryHeader}>
                    <View style={[styles.categoryIcon, { backgroundColor: meta.bg }]}>
                      <Ionicons
                        name={meta.icon as never}
                        size={12}
                        color={meta.color}
                      />
                    </View>
                    <Text
                      style={[
                        styles.categoryLabel,
                        { color: meta.color },
                      ]}
                    >
                      {meta.label.toUpperCase()}
                    </Text>
                    <Text style={styles.categoryCount}>{items.length}</Text>
                  </View>
                  <View style={styles.list}>
                    {items.map((t) => (
                      <View
                        key={t.id}
                        style={
                          activeTemplateIds.has(t.id)
                            ? styles.templateAlreadyActive
                            : undefined
                        }
                      >
                        <QuestTemplateCard
                          template={t}
                          onStart={() => handleStart(t.id)}
                          isStarting={busyId === t.id}
                        />
                        {activeTemplateIds.has(t.id) && (
                          <Text style={styles.alreadyActiveLabel}>Already active</Text>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Custom quests deferred — once start_custom_quest gets a UI, a
            "Custom" block will sit above the system catalog (mirrors the
            tasks "Mine vs Suggested" pattern). For now: doc the gap so
            the user knows where the surface will live. */}
        <Text style={styles.customDeferredNote}>
          Custom quest creation is coming soon. For now, the system catalog
          above covers the highest-yield arcs.
        </Text>

        {/* Recent history */}
        {others.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: tokens.space[6] }]}>
              <Text style={styles.sectionTitle}>Recently finished</Text>
            </View>
            <View style={styles.list}>
              {others.map((q) => (
                <QuestCard key={q.quest.id} data={q} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.border.base,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.surface,
  },
  headerTitle: {
    ...tokens.type.h3,
    color: tokens.text.hi,
  },
  content: {
    padding: tokens.space[4],
    paddingBottom: tokens.space[10],
    gap: tokens.space[2],
  },
  tagline: {
    ...tokens.type.caption,
    color: tokens.text.mid,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: tokens.space[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: tokens.space[3],
    marginBottom: tokens.space[3],
  },
  sectionTitle: {
    ...tokens.type.h3,
    color: tokens.text.hi,
  },
  sectionMeta: {
    ...tokens.type.caption,
    color: tokens.text.dim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: {
    gap: tokens.space[3],
  },
  loadingBox: {
    paddingVertical: tokens.space[6],
    alignItems: 'center',
  },
  emptyBox: {
    paddingVertical: tokens.space[6],
    alignItems: 'center',
    gap: tokens.space[2],
    backgroundColor: tokens.bg.surface,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.border.base,
    borderStyle: 'dashed',
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
    paddingHorizontal: tokens.space[6],
  },
  templateAlreadyActive: {
    opacity: 0.5,
  },
  alreadyActiveLabel: {
    ...tokens.type.caption,
    color: tokens.text.dim,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  categoryList: {
    gap: tokens.space[5],
  },
  categoryBlock: {
    gap: tokens.space[3],
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
  },
  categoryIcon: {
    width: 22,
    height: 22,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    letterSpacing: 0.8,
    flex: 1,
  },
  categoryCount: {
    ...tokens.type.caption,
    color: tokens.text.dim,
    fontFamily: 'Manrope_700Bold',
  },
  customDeferredNote: {
    ...tokens.type.caption,
    color: tokens.text.dim,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: tokens.space[5],
    paddingHorizontal: tokens.space[6],
  },
});
