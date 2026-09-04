import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoinIcon } from '@/components/CoinIcon';
import {
  SubStarTargetPicker,
  type SubStarTarget,
} from '@/components/SubStarTargetPicker';
import { useStartCustomQuest } from '@/lib/api/quests';
import { useActiveTasks } from '@/lib/api/tasks';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { useModules, useRequireAnyModule } from '@/lib/modules';
import { freeLimitEntity, useLimitModalStore } from '@/lib/premium';
import { deriveQuestReward } from '@/lib/quests/reward';
import { useKeyboardOverlap } from '@/lib/use-keyboard-height';
import { showInfo } from '@/lib/util/confirm';
import { tokens } from '@/theme';

/**
 * Criação de quest personalizada — formulário COMPARTILHADO pelos dois
 * boards, porque a tabela `quest` é uma só e o que separa os produtos é
 * o kind do requisito:
 *
 *   Missões  → `accumulate_sub_stars`  (junte N★ num sub)
 *   Metas    → `complete_task_n_times` (faça a prática N vezes)
 *
 * O modo é DERIVADO do gate no render, nunca capturado num inicializador
 * de useState: `useModules()` devolve tudo false até o profile carregar,
 * então uma escolha feita nesse instante estaria errada. Com as duas
 * chaves ligadas aparece um seletor; com uma só, o modo é o dela.
 *
 * Antes desta versão a tela era gateada só por `metas`, e quem ligava
 * apenas Missões via o board sem botão de criar — o pedido que originou
 * esta mudança.
 *
 * Categoria continua fora do formulário de propósito: `quest` não tem
 * coluna de categoria, então não haveria onde pousar.
 *
 * Recompensa é DERIVADA das estrelas exigidas (lib/quests/reward.ts), não
 * digitada. A fórmula antiga daqui (`50 + 10 * dias`) pagava pelo TEMPO,
 * então esticar o prazo aumentava o prêmio de uma missão mais fácil.
 */
const DURATION_PRESETS = [7, 14, 21, 30];
const MAX_TITLE = 60;
const MAX_DESCRIPTION = 200;

/** Baseline "faça isso com regularidade", escalando com a janela. */
function defaultTaskTarget(days: number): number {
  return Math.max(7, Math.floor(days / 2));
}

type QuestMode = 'sub_stars' | 'tasks';

export default function QuestCreateScreen() {
  const router = useRouter();
  const { t } = useT();
  const meta = useMetaLookup();
  // Any-of: o formulário serve os dois boards. Fail-closed — `false` até
  // o profile carregar, e redireciona pra home se as duas chaves estiverem
  // desligadas (cobre deep link).
  const gate = useRequireAnyModule(['missoes', 'metas']);
  const modules = useModules();
  const tasks = useActiveTasks();
  const startCustomQuest = useStartCustomQuest();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationDays, setDurationDays] = useState<number>(30);
  const [linkedTaskIds, setLinkedTaskIds] = useState<Set<string>>(new Set());
  const [subTargets, setSubTargets] = useState<SubStarTarget[]>([]);
  const [partial, setPartial] = useState(true);
  const [modePick, setModePick] = useState<QuestMode>('sub_stars');
  const keyboardHeight = useKeyboardOverlap();

  // Modo derivado no render. Com as duas chaves ligadas o usuário escolhe;
  // com uma só, é a dela. NUNCA um useState inicializado a partir de
  // `modules`, que é todo-false enquanto o profile carrega.
  const bothOn = modules.missoes && modules.metas;
  const mode: QuestMode = bothOn
    ? modePick
    : modules.missoes
      ? 'sub_stars'
      : 'tasks';

  // Estrelas exigidas — a base da recompensa nos dois modos.
  const totalStars = useMemo(() => {
    if (mode === 'sub_stars') {
      return subTargets.reduce((sum, s) => sum + s.stars, 0);
    }
    const perTask = defaultTaskTarget(durationDays);
    return (tasks.data ?? [])
      .filter((task) => linkedTaskIds.has(task.id))
      .reduce((sum, task) => sum + perTask * (task.total_stars ?? 1), 0);
  }, [mode, subTargets, tasks.data, linkedTaskIds, durationDays]);

  const { xp: rewardXp, coins: rewardCoins } = useMemo(
    () => deriveQuestReward(totalStars),
    [totalStars],
  );

  const requirementCount =
    mode === 'sub_stars' ? subTargets.length : linkedTaskIds.size;

  // Exigir pelo menos um requisito: sem isso a RPC cria uma quest que nunca
  // fecha, e que ainda aparece no board de Metas (o `.every` de goals.tsx é
  // verdadeiro vacuamente sobre um array vazio).
  const canSave =
    title.trim().length > 0 &&
    requirementCount > 0 &&
    !startCustomQuest.isPending;

  const toggleTask = (taskId: string) => {
    Haptics.selectionAsync().catch(() => {});
    setLinkedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const handleSave = async () => {
    if (!canSave) return;
    const deadline = new Date(Date.now() + durationDays * 86400000).toISOString();
    // UM requisito por sub: o CHECK quest_requirement_kind_payload amarra
    // sub_id singular + target_count na mesma linha. Os dois arrays nunca
    // se misturam — uma quest é de um modo só.
    const requirements =
      mode === 'sub_stars'
        ? subTargets.map((s, i) => ({
            kind: 'accumulate_sub_stars' as const,
            sub_id: s.sub_id,
            target_count: s.stars,
            sort_order: i,
          }))
        : [...linkedTaskIds].map((taskId) => ({
            kind: 'complete_task_n_times' as const,
            task_id: taskId,
            target_count: defaultTaskTarget(durationDays),
          }));

    try {
      await startCustomQuest.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        deadline,
        reward_xp: rewardXp,
        reward_coins: rewardCoins,
        allow_partial: partial,
        requirements,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      router.back();
    } catch (e) {
      const limited = freeLimitEntity(e);
      if (limited) {
        router.back();
        useLimitModalStore.getState().open(limited);
        return;
      }
      const err = e as { message?: string; code?: string; details?: string; hint?: string };
      console.error('[start_custom_quest] failed', err);
      showInfo(
        t('quests.create.saveFail'),
        [err.message, err.code, err.details, err.hint].filter(Boolean).join('\n') ||
          'Unknown error',
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
          hitSlop={10}
        >
          <Ionicons name="close" size={16} color={tokens.text.mid} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {mode === 'sub_stars'
            ? t('quests.create.titleMissao')
            : t('quests.create.title')}
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          style={({ pressed }) => [
            styles.saveBtn,
            !canSave && styles.saveBtnDisabled,
            pressed && canSave && { opacity: 0.85 },
          ]}
        >
          {startCustomQuest.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>{t('common.save')}</Text>
          )}
        </Pressable>
      </View>

      {!gate ? (
        // `useModules()` é todo-false até o profile carregar; montar o corpo
        // agora escolheria o modo errado e piscaria o formulário do outro
        // board na cara do usuário.
        <View style={styles.gateLoading}>
          <ActivityIndicator color={tokens.brand.violet2} />
        </View>
      ) : (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            keyboardHeight > 0 && { paddingBottom: keyboardHeight + tokens.space[10] },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Mode — só quando as DUAS chaves estão ligadas. Com uma só, o
              modo é o dela e um seletor de uma opção seria ruído. */}
          {bothOn && (
            <View style={styles.field}>
              <Text style={styles.label}>{t('quests.create.modeLabel')}</Text>
              <View style={styles.durationRow}>
                {(['sub_stars', 'tasks'] as const).map((m) => {
                  const selected = mode === m;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => setModePick(m)}
                      style={({ pressed }) => [
                        styles.modePill,
                        selected && styles.durationPillSelected,
                        pressed && { opacity: 0.85 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.durationText,
                          selected && styles.durationTextSelected,
                        ]}
                      >
                        {m === 'sub_stars'
                          ? t('quests.create.modeSubStars')
                          : t('quests.create.modeTasks')}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Title */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('quests.create.nameLabel')}</Text>
            <TextInput
              value={title}
              onChangeText={(v) => setTitle(v.slice(0, MAX_TITLE))}
              placeholder={t('quests.create.namePlaceholder')}
              placeholderTextColor={tokens.text.faint}
              style={styles.input}
              maxLength={MAX_TITLE}
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('quests.create.descLabel')}</Text>
            <TextInput
              value={description}
              onChangeText={(v) => setDescription(v.slice(0, MAX_DESCRIPTION))}
              placeholder={t('quests.create.descPlaceholder')}
              placeholderTextColor={tokens.text.faint}
              style={[styles.input, styles.inputMultiline]}
              multiline
              maxLength={MAX_DESCRIPTION}
            />
          </View>

          {/* Duration */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('quests.create.durationLabel')}</Text>
            <View style={styles.durationRow}>
              {DURATION_PRESETS.map((d) => {
                const selected = durationDays === d;
                return (
                  <Pressable
                    key={d}
                    onPress={() => setDurationDays(d)}
                    style={({ pressed }) => [
                      styles.durationPill,
                      selected && styles.durationPillSelected,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.durationText,
                        selected && styles.durationTextSelected,
                      ]}
                    >
                      {d}d
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Sub star targets — o construtor de Missões */}
          {mode === 'sub_stars' && (
            <View style={styles.field}>
              <Text style={styles.label}>{t('quests.create.subsLabel')}</Text>
              <Text style={styles.hint}>{t('quests.create.subsHint')}</Text>
              <SubStarTargetPicker value={subTargets} onChange={setSubTargets} />
            </View>
          )}

          {/* Linked tasks — o construtor de Metas */}
          {mode === 'tasks' && (
          <View style={styles.field}>
            <Text style={styles.label}>{t('quests.create.tasksLabel')}</Text>
            <View style={styles.tasksWrap}>
              {tasks.isLoading ? (
                <View style={styles.tasksLoading}>
                  <ActivityIndicator color={tokens.brand.violet2} />
                </View>
              ) : (tasks.data ?? []).length === 0 ? (
                <Text style={styles.tasksEmpty}>{t('quests.create.tasksEmpty')}</Text>
              ) : (
                (tasks.data ?? []).map((task, idx) => {
                  const selected = linkedTaskIds.has(task.id);
                  const dim = meta.dim(task.primary_dimension_id);
                  return (
                    <Pressable
                      key={task.id}
                      onPress={() => toggleTask(task.id)}
                      style={({ pressed }) => [
                        styles.taskRow,
                        idx === (tasks.data ?? []).length - 1 && styles.taskRowLast,
                        pressed && { opacity: 0.85 },
                        !selected && { opacity: 0.55 },
                      ]}
                    >
                      <View style={[styles.taskIcon, { backgroundColor: dim.bg }]}>
                        <Ionicons
                          name={dim.iconName as never}
                          size={11}
                          color={dim.color}
                        />
                      </View>
                      <Text style={styles.taskName} numberOfLines={1}>
                        {task.title}
                      </Text>
                      <View
                        style={[
                          styles.taskCheck,
                          selected
                            ? { backgroundColor: tokens.brand.violet }
                            : styles.taskCheckEmpty,
                        ]}
                      >
                        {selected && <Ionicons name="checkmark" size={11} color="#fff" />}
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          </View>
          )}

          {/* Partial toggle */}
          <View style={styles.field}>
            <View style={styles.partialRow}>
              <View style={styles.partialInfo}>
                <Text style={styles.partialTitle}>{t('quests.create.partialTitle')}</Text>
                <Text style={styles.partialSub}>{t('quests.create.partialSub')}</Text>
              </View>
              <Switch
                value={partial}
                onValueChange={setPartial}
                trackColor={{ false: tokens.bg.surface2, true: tokens.brand.violet }}
                thumbColor={tokens.text.hi}
              />
            </View>
          </View>

          {/* Reward preview */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('quests.create.rewardLabel')}</Text>
            <View style={styles.rewardPreview}>
              <View style={styles.rewardChip}>
                <Ionicons name="flash" size={13} color={tokens.brand.violet2} />
                <Text style={[styles.rewardChipText, { color: tokens.brand.violet2 }]}>
                  +{rewardXp} XP
                </Text>
              </View>
              <View style={styles.rewardChip}>
                <CoinIcon size={13} />
                <Text style={[styles.rewardChipText, { color: tokens.semantic.coin }]}>
                  +{rewardCoins}
                </Text>
              </View>
              <Text style={styles.rewardNote}>{t('quests.create.rewardNote')}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  gateLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modePill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.border.base,
    backgroundColor: tokens.bg.surface,
  },
  hint: {
    ...tokens.type.caption,
    color: tokens.text.mid,
    marginTop: -4,
    marginBottom: tokens.space[2],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[2],
    borderBottomWidth: 1,
    borderBottomColor: tokens.border.base,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: tokens.border.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: tokens.text.hi,
  },
  saveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: tokens.brand.violet,
    minWidth: 60,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: tokens.bg.surface2,
  },
  saveBtnText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    color: '#fff',
  },

  scroll: {
    padding: tokens.space[3],
    gap: tokens.space[3],
  },
  field: {
    gap: 5,
  },
  label: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    letterSpacing: 0.7,
    color: tokens.text.dim,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: tokens.text.hi,
  },
  inputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },

  durationRow: {
    flexDirection: 'row',
    gap: 4,
  },
  durationPill: {
    flex: 1,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
  },
  durationPillSelected: {
    backgroundColor: 'rgba(123,92,255,0.12)',
    borderColor: tokens.brand.violet,
  },
  durationText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: tokens.text.dim,
  },
  durationTextSelected: {
    color: tokens.brand.violet2,
    fontFamily: 'Manrope_800ExtraBold',
  },

  tasksWrap: {
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
    borderRadius: 9,
    overflow: 'hidden',
  },
  tasksLoading: {
    padding: tokens.space[3],
    alignItems: 'center',
  },
  tasksEmpty: {
    padding: tokens.space[3],
    textAlign: 'center',
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: tokens.text.dim,
    fontStyle: 'italic',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: tokens.border.base,
  },
  taskRowLast: {
    borderBottomWidth: 0,
  },
  taskIcon: {
    width: 22,
    height: 22,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskName: {
    flex: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: tokens.text.hi,
  },
  taskCheck: {
    width: 18,
    height: 18,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCheckEmpty: {
    borderWidth: 1,
    borderColor: tokens.border.strong,
    backgroundColor: 'transparent',
  },

  partialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
    borderRadius: 9,
  },
  partialInfo: {
    flex: 1,
  },
  partialTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: tokens.text.hi,
  },
  partialSub: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 10,
    color: tokens.text.dim,
    marginTop: 1,
  },

  rewardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
    borderRadius: 9,
    flexWrap: 'wrap',
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardChipText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
  },
  rewardNote: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 9,
    color: tokens.text.faint,
    fontStyle: 'italic',
    flex: 1,
    minWidth: 100,
  },
});
