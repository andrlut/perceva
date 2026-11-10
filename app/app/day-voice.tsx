import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { ProposalRow } from '@/components/dayVoice/ProposalRow';
import { DayVoiceGuide, useDayVoiceGuidePrompt } from '@/components/guide/screens/DayVoiceGuide';
import { ScreenInfoButton } from '@/components/guide/ScreenInfoButton';
import { ScreenTip } from '@/components/guide/ScreenTip';
import { InfoSheet } from '@/components/InfoSheet';
import { MoodFace } from '@/components/mood/MoodFace';
import { MoodFaceRow } from '@/components/mood/MoodFaceRow';
import { ScreenBackground } from '@/components/ScreenBackground';
import {
  recordAiOutcome,
  useAiAccess,
  useDayVoiceDraft,
  type DayVoiceDraft,
  type DayVoiceFailure,
} from '@/lib/api/ai';
import { todayDateKey, useLogMood, useMoodForDay, useMoodTags } from '@/lib/api/mood';
import { useActiveTasks, useCompleteTask, useSkipTasksBulk } from '@/lib/api/tasks';
import type { MoodLog } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { moodLevel, type MoodValue } from '@/lib/mood';
import { useDictation } from '@/lib/speech';
import { supabase } from '@/lib/supabase';
import { useKeyboardHeight } from '@/lib/use-keyboard-height';
import { rewardForTaskSubs } from '@/lib/xp';
import { tokens } from '@/theme';

/**
 * "Conte seu dia" — the person tells the day (keyboard microphone, or the
 * native mic button on builds that carry it), the AI (Edge Function
 * perceva-ai, Claude Haiku 5.5) proposes a card — mood, tags, note,
 * practices done or skipped today — and NOTHING is written until Registrar.
 *
 * Registrar uses the hooks the Home already uses, so the Home's Desfazer
 * undoes any line: useCompleteTask (complete_task), useSkipTasksBulk
 * (task_skip) and the mood write. The mood write MERGES: log_mood replaces
 * the day's note AND tags whenever it gets either, so the day is re-read
 * right before writing and the new note is appended, the tags unioned.
 *
 * The card's assertiveness (lines proposed / unchecked / edited) goes to the
 * ledger as numbers only (ai_record_outcome). The transcript is never stored.
 */

type Phase = 'input' | 'loading' | 'review';

interface MoodLine {
  proposed: boolean;
  checked: boolean;
  value: number | null;
  tags: string[];
  edited: boolean;
  picking: boolean;
}

interface NoteLine {
  proposed: boolean;
  checked: boolean;
  text: string;
  edited: boolean;
  editing: boolean;
}

interface PracticeLine {
  kind: 'complete' | 'skip';
  task_id: string;
  title: string;
  icon: string | null;
  checked: boolean;
}

const EMPTY_MOOD: MoodLine = { proposed: false, checked: false, value: null, tags: [], edited: false, picking: false };
const EMPTY_NOTE: NoteLine = { proposed: false, checked: false, text: '', edited: false, editing: false };

/** "HH:MM" local — stamps an appended note, like the MCP's merge. */
function localHHMM(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function DayVoiceScreen() {
  const { t, locale } = useT();
  const router = useRouter();
  const keyboardHeight = useKeyboardHeight();
  const access = useAiAccess();
  const draftMutation = useDayVoiceDraft();
  const activeTasks = useActiveTasks();
  const moodTags = useMoodTags();
  const completeTask = useCompleteTask();
  const skipBulk = useSkipTasksBulk();
  const logMood = useLogMood();

  const [phase, setPhase] = useState<Phase>('input');
  const [text, setText] = useState('');
  const [error, setError] = useState<{ message: string; refunded: boolean } | null>(null);
  const [remark, setRemark] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [proposedLines, setProposedLines] = useState(0);
  const [draftDate, setDraftDate] = useState(todayDateKey());
  const [mood, setMood] = useState<MoodLine>(EMPTY_MOOD);
  const [note, setNote] = useState<NoteLine>(EMPTY_NOTE);
  const [practices, setPractices] = useState<PracticeLine[]>([]);
  const [registering, setRegistering] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const guidePrompt = useDayVoiceGuidePrompt();
  const inputRef = useRef<TextInput>(null);

  const dayMood = useMoodForDay(draftDate);
  const existingMood: MoodLog | null = dayMood.data ?? null;

  const maxChars = access.data?.max_chars ?? 1500;
  const perDay = access.data?.per_day ?? 30;
  const usedToday = access.data?.used_today ?? 0;

  const dictation = useDictation({
    lang: locale === 'en' ? 'en-US' : 'pt-BR',
    onText: (next) => setText(next.slice(0, maxChars)),
  });

  // Without the native mic the keyboard's own microphone is the way in:
  // open the keyboard straight away. With it, the big button is.
  useEffect(() => {
    if (dictation.available) return;
    const id = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(id);
  }, [dictation.available]);

  const tagLabel = useMemo(() => {
    const map = new Map<string, string>();
    for (const tag of moodTags.data ?? []) {
      map.set(tag.slug, `${tag.emoji ? `${tag.emoji} ` : ''}${locale === 'en' ? tag.label_en : tag.label_pt}`);
    }
    return (slug: string) => map.get(slug) ?? slug;
  }, [moodTags.data, locale]);

  const taskById = useMemo(
    () => new Map((activeTasks.data ?? []).map((task) => [task.id, task])),
    [activeTasks.data],
  );

  const failureMessage = (reason: DayVoiceFailure, extra: { max?: number; total?: number }) => {
    switch (reason) {
      case 'rate_day':
        return t('dayVoice.errors.rate_day', { total: extra.total ?? perDay });
      case 'too_long':
        return t('dayVoice.errors.too_long', { max: extra.max ?? maxChars });
      default:
        return t(`dayVoice.errors.${reason}`, { defaultValue: t('dayVoice.errors.ai_failed') });
    }
  };

  const applyDraft = (draft: DayVoiceDraft) => {
    setDraftDate(draft.date);
    // A note with no rating on a day with no mood yet can't be saved alone
    // (mood_log needs a rating): open the faces right away instead of
    // failing at Registrar.
    const needsRating = !draft.mood?.value && !existingMood && (!!draft.note || !!draft.mood?.tags.length);
    setMood(
      draft.mood
        ? { proposed: true, checked: true, value: draft.mood.value, tags: draft.mood.tags, edited: false, picking: needsRating }
        : { ...EMPTY_MOOD, picking: needsRating },
    );
    setNote(
      draft.note
        ? { proposed: true, checked: true, text: draft.note, edited: false, editing: false }
        : EMPTY_NOTE,
    );
    setPractices([
      ...draft.complete.map((p) => ({ kind: 'complete' as const, ...p, checked: true })),
      ...draft.skip.map((p) => ({ kind: 'skip' as const, ...p, checked: true })),
    ]);
  };

  const understand = async () => {
    const body = text.trim();
    if (!body) {
      setError({ message: t('dayVoice.errors.empty_text'), refunded: false });
      return;
    }
    if (dictation.listening) dictation.stop();
    inputRef.current?.blur();
    setError(null);
    setRemark(null);
    setPhase('loading');
    const res = await draftMutation.mutateAsync({ text: body, locale });
    if (!res.ok) {
      setPhase('input');
      setRemark(res.remark ?? null);
      setError({
        message: failureMessage(res.reason, { max: res.max_chars, total: res.per_day }),
        refunded: res.reason === 'not_understood' || res.reason === 'ai_failed' || res.reason === 'too_long',
      });
      return;
    }
    Haptics.selectionAsync().catch(() => {});
    setRequestId(res.request_id);
    setProposedLines(res.lines);
    setRemark(res.remark);
    applyDraft(res.draft);
    setPhase('review');
  };

  const backToEdit = () => {
    setPhase('input');
    setRequestId(null);
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  // ── Registrar ─────────────────────────────────────────────────────────────
  const register = async () => {
    const moodWanted = mood.checked && (mood.value != null || mood.tags.length > 0);
    const noteWanted = note.checked && note.text.trim().length > 0;
    const chosen = practices.filter((p) => p.checked);
    if (!moodWanted && !noteWanted && chosen.length === 0) {
      Alert.alert(t('dayVoice.noneChecked'));
      return;
    }
    const finalMood = (mood.checked ? mood.value : null) ?? existingMood?.mood ?? null;
    if ((moodWanted || noteWanted) && finalMood == null) {
      setMood((m) => ({ ...m, checked: true, picking: true }));
      Alert.alert(t('dayVoice.needMood'));
      return;
    }

    setRegistering(true);
    const failed: string[] = [];

    for (const line of chosen.filter((p) => p.kind === 'complete')) {
      const task = taskById.get(line.task_id);
      if (!task) {
        failed.push(line.title);
        continue;
      }
      try {
        await completeTask.mutateAsync({ task, subs: task.subs, completedLocalDate: draftDate });
      } catch {
        failed.push(line.title);
      }
    }

    const skips = chosen.filter((p) => p.kind === 'skip');
    if (skips.length) {
      try {
        await skipBulk.mutateAsync({ taskIds: skips.map((s) => s.task_id) });
      } catch {
        failed.push(...skips.map((s) => s.title));
      }
    }

    if (moodWanted || noteWanted) {
      try {
        const newTags = moodWanted ? mood.tags : [];
        if (!noteWanted && newTags.length === 0) {
          // Mood only: the quick log, which keeps the day's note and tags.
          await logMood.mutateAsync({ mood: finalMood as MoodValue, loggedFor: draftDate });
        } else {
          // Re-read the day right before writing: the merge must be against
          // what is there NOW (a note dictated elsewhere a minute ago).
          const { data: rows, error } = await supabase
            .from('mood_log')
            .select('mood,note,tags')
            .eq('logged_for', draftDate)
            .limit(1);
          if (error) throw error;
          const fresh = (rows?.[0] ?? null) as Pick<MoodLog, 'mood' | 'note' | 'tags'> | null;
          const tags = [...new Set([...(fresh?.tags ?? []), ...newTags])];
          const prevNote = fresh?.note?.trim() ?? '';
          const add = noteWanted ? note.text.trim() : '';
          const merged = !add
            ? prevNote
            : prevNote
              ? `${prevNote}\n\n— ${localHHMM(new Date())} · ${t('dayVoice.noteStamp')}\n${add}`
              : add;
          await logMood.mutateAsync({
            mood: finalMood as MoodValue,
            note: merged || null,
            tags,
            loggedFor: draftDate,
          });
        }
      } catch {
        failed.push(t('dayVoice.moodRowShort'));
      }
    }

    if (requestId) {
      const unchecked =
        (mood.proposed && !mood.checked ? 1 : 0) +
        (note.proposed && !note.checked ? 1 : 0) +
        practices.filter((p) => !p.checked).length;
      const edited = (mood.proposed && mood.edited ? 1 : 0) + (note.proposed && note.edited ? 1 : 0);
      recordAiOutcome({ requestId, proposed: proposedLines, unchecked, edited });
    }

    setRegistering(false);
    if (failed.length) {
      Alert.alert(t('dayVoice.saveFailTitle'), t('dayVoice.partialFail', { items: failed.join(', ') }));
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    router.back();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const checkedCount =
    (mood.checked && (mood.value != null || mood.tags.length > 0) ? 1 : 0) +
    (note.checked && note.text.trim() ? 1 : 0) +
    practices.filter((p) => p.checked).length;

  const renderMoodRow = () => {
    if (!mood.proposed && !mood.picking) return null;
    const value = mood.value;
    const title =
      value != null
        ? t('dayVoice.moodRow', { value, label: t(`mood.levels.${moodLevel(value).key}`) })
        : existingMood
          ? t('dayVoice.moodKeep', { label: t(`mood.levels.${moodLevel(existingMood.mood).key}`) })
          : t('dayVoice.moodPick');
    return (
      <ProposalRow
        checked={mood.checked}
        onToggle={() => setMood((m) => ({ ...m, checked: !m.checked }))}
        leading={
          value != null ? (
            <MoodFace value={value as MoodValue} size={28} active />
          ) : (
            <Ionicons name="happy-outline" size={22} color={tokens.text.dim} />
          )
        }
        title={title}
        detail={mood.picking ? null : t('dayVoice.tapToChange')}
        onPressBody={() => setMood((m) => ({ ...m, picking: !m.picking }))}
        bodyA11y={t('dayVoice.moodChangeA11y')}
      >
        {mood.picking ? (
          <MoodFaceRow
            value={(value as MoodValue | null) ?? null}
            size="sm"
            showLabels={false}
            onSelect={(v) =>
              setMood((m) => ({ ...m, value: v, checked: true, edited: m.edited || v !== m.value, picking: false }))
            }
          />
        ) : null}
        {mood.tags.length ? (
          <View style={styles.tagWrap}>
            {mood.tags.map((slug) => (
              <Pressable
                key={slug}
                onPress={() =>
                  setMood((m) => ({ ...m, tags: m.tags.filter((x) => x !== slug), edited: true }))
                }
                style={({ pressed }) => [styles.tag, pressed && { opacity: 0.6 }]}
                accessibilityRole="button"
                accessibilityLabel={t('dayVoice.removeTagA11y', { tag: tagLabel(slug) })}
              >
                <Text style={styles.tagText}>{tagLabel(slug)}</Text>
                <Ionicons name="close" size={12} color={tokens.text.dim} />
              </Pressable>
            ))}
          </View>
        ) : null}
      </ProposalRow>
    );
  };

  const renderNoteRow = () => {
    if (!note.proposed) return null;
    return (
      <ProposalRow
        checked={note.checked}
        onToggle={() => setNote((n) => ({ ...n, checked: !n.checked }))}
        leading={<Ionicons name="create-outline" size={20} color={tokens.brand.violet2} />}
        title={t('dayVoice.noteRow')}
        detail={note.editing ? null : note.text}
        onPressBody={() => setNote((n) => ({ ...n, editing: !n.editing }))}
        bodyA11y={t('dayVoice.noteEditA11y')}
      >
        {note.editing ? (
          <TextInput
            value={note.text}
            onChangeText={(v) => setNote((n) => ({ ...n, text: v, edited: true, checked: true }))}
            multiline
            autoFocus
            maxLength={1000}
            style={styles.noteInput}
            placeholderTextColor={tokens.text.faint}
          />
        ) : null}
      </ProposalRow>
    );
  };

  const renderPractice = (line: PracticeLine, idx: number) => {
    const task = taskById.get(line.task_id);
    const reward = task && line.kind === 'complete'
      ? rewardForTaskSubs(task.subs, task.coin_multiplier, task.coin_stars).total
      : null;
    return (
      <ProposalRow
        key={`${line.kind}-${line.task_id}`}
        checked={line.checked}
        onToggle={() =>
          setPractices((list) => list.map((p, i) => (i === idx ? { ...p, checked: !p.checked } : p)))
        }
        leading={
          <AppIcon
            name={line.icon ?? (line.kind === 'complete' ? 'checkmark-circle-outline' : 'play-skip-forward-outline')}
            size={20}
            color={line.kind === 'complete' ? tokens.semantic.xp : tokens.text.dim}
          />
        }
        title={
          <Text>
            {line.kind === 'complete' ? t('dayVoice.completeRow') : t('dayVoice.skipRow')}{' '}
            <Text style={styles.bold}>{line.title}</Text>
          </Text>
        }
        reward={
          reward ? (
            <Text style={styles.reward}>
              {reward.xp > 0 ? <Text style={styles.rewardXp}>+{reward.xp}</Text> : null}
              {reward.xp > 0 && reward.coins > 0 ? <Text style={styles.rewardSep}> · </Text> : null}
              {reward.coins > 0 ? <Text style={styles.rewardCoin}>+{reward.coins}</Text> : null}
            </Text>
          ) : null
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenBackground>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <Ionicons name="close" size={22} color={tokens.text.hi} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('dayVoice.title')}</Text>
          <ScreenInfoButton onPress={() => setHelpOpen(true)} a11yLabel={t('dayVoice.help.a11y')} />
        </View>

        <View style={[styles.flex, { paddingBottom: keyboardHeight }]}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
          >
            <ScreenTip id="dayVoice" />

            {phase === 'review' ? (
              <Pressable
                onPress={backToEdit}
                style={({ pressed }) => [styles.said, pressed && { opacity: 0.75 }]}
                accessibilityRole="button"
                accessibilityLabel={t('dayVoice.edit')}
              >
                <View style={styles.saidMic}>
                  <Ionicons name="mic" size={14} color="#FFFFFF" />
                </View>
                <Text style={styles.saidText} numberOfLines={4}>
                  “{text.trim()}”
                </Text>
              </Pressable>
            ) : (
              <>
                <View style={styles.inputCard}>
                  <TextInput
                    ref={inputRef}
                    value={text}
                    onChangeText={(v) => {
                      setText(v);
                      if (error) setError(null);
                    }}
                    placeholder={dictation.available ? t('dayVoice.placeholderMic') : t('dayVoice.placeholder')}
                    placeholderTextColor={tokens.text.faint}
                    multiline
                    maxLength={maxChars}
                    editable={phase === 'input'}
                    style={styles.input}
                    textAlignVertical="top"
                  />
                  <View style={styles.inputMeta}>
                    <Text style={styles.meta}>
                      {t('dayVoice.quota', { used: usedToday, total: perDay })}
                    </Text>
                    <Text style={styles.meta}>
                      {text.length}/{maxChars}
                    </Text>
                  </View>
                </View>

                {dictation.available ? (
                  <View style={styles.micWrap}>
                    <Pressable
                      onPress={() => (dictation.listening ? dictation.stop() : dictation.start(text))}
                      disabled={phase !== 'input'}
                      style={({ pressed }) => [
                        styles.micBtn,
                        dictation.listening && styles.micBtnOn,
                        pressed && { opacity: 0.8 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={dictation.listening ? t('dayVoice.micA11yStop') : t('dayVoice.micA11yStart')}
                    >
                      <Ionicons name={dictation.listening ? 'stop' : 'mic'} size={30} color="#FFFFFF" />
                    </Pressable>
                    <Text style={styles.micLabel}>
                      {dictation.listening ? t('dayVoice.listening') : t('dayVoice.micStart')}
                    </Text>
                    {dictation.error ? (
                      <Text style={styles.micError}>{t(`dayVoice.micErrors.${dictation.error}`)}</Text>
                    ) : null}
                  </View>
                ) : null}
              </>
            )}

            {phase === 'loading' ? (
              <View style={styles.loading}>
                <ActivityIndicator color={tokens.brand.violet2} />
                <Text style={styles.loadingText}>{t('dayVoice.understanding')}</Text>
              </View>
            ) : null}

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="information-circle-outline" size={18} color={tokens.semantic.warn} />
                <View style={styles.flex}>
                  <Text style={styles.errorText}>{error.message}</Text>
                  {remark ? <Text style={styles.errorSub}>{remark}</Text> : null}
                  {error.refunded ? <Text style={styles.errorSub}>{t('dayVoice.refunded')}</Text> : null}
                </View>
              </View>
            ) : null}

            {phase === 'review' ? (
              <View style={styles.card}>
                <Text style={styles.eyebrow}>{t('dayVoice.cardEyebrow')}</Text>
                {renderMoodRow()}
                {renderNoteRow()}
                {practices.map(renderPractice)}
                {remark ? (
                  <View style={styles.remark}>
                    <Ionicons name="chatbubble-ellipses-outline" size={14} color={tokens.text.dim} />
                    <Text style={styles.remarkText}>{remark}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            {phase === 'review' ? (
              <View style={styles.btnRow}>
                <Pressable
                  onPress={backToEdit}
                  disabled={registering}
                  style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && { opacity: 0.7 }]}
                  accessibilityRole="button"
                >
                  <Text style={styles.btnGhostText}>{t('dayVoice.edit')}</Text>
                </Pressable>
                <Pressable
                  onPress={register}
                  disabled={registering || checkedCount === 0}
                  style={({ pressed }) => [
                    styles.btn,
                    styles.btnGold,
                    (registering || checkedCount === 0) && { opacity: 0.5 },
                    pressed && { opacity: 0.85 },
                  ]}
                  accessibilityRole="button"
                >
                  {registering ? (
                    <ActivityIndicator color={tokens.semantic.coinInk} />
                  ) : (
                    <Text style={styles.btnGoldText}>{t('dayVoice.register')}</Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={understand}
                disabled={phase === 'loading' || !text.trim()}
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnGold,
                  (phase === 'loading' || !text.trim()) && { opacity: 0.5 },
                  pressed && { opacity: 0.85 },
                ]}
                accessibilityRole="button"
              >
                <Ionicons name="sparkles" size={16} color={tokens.semantic.coinInk} />
                <Text style={styles.btnGoldText}>{t('dayVoice.understand')}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScreenBackground>

      <InfoSheet
        visible={helpOpen}
        onClose={() => setHelpOpen(false)}
        title={t('dayVoice.help.title')}
        aiPrompt={guidePrompt}
      >
        <DayVoiceGuide />
      </InfoSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.border.divider,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...tokens.type.h3,
    color: tokens.text.hi,
  },
  content: {
    padding: tokens.space[4],
    paddingBottom: tokens.space[6],
    gap: tokens.space[3],
  },
  inputCard: {
    backgroundColor: tokens.bg.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.border.base,
    padding: tokens.space[3],
    gap: tokens.space[2],
  },
  input: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 16,
    lineHeight: 23,
    color: tokens.text.hi,
    minHeight: 150,
  },
  inputMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meta: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: tokens.text.dim,
  },
  micWrap: {
    alignItems: 'center',
    gap: tokens.space[2],
    paddingVertical: tokens.space[2],
  },
  micBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.brand.violet,
  },
  micBtnOn: {
    backgroundColor: tokens.semantic.danger,
  },
  micLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.text.mid,
  },
  micError: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12.5,
    color: tokens.semantic.warn,
    textAlign: 'center',
  },
  said: {
    flexDirection: 'row',
    gap: tokens.space[3],
    alignItems: 'flex-start',
    backgroundColor: tokens.bg.surface,
    borderRadius: tokens.radius.md,
    padding: tokens.space[3],
  },
  saidMic: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.brand.violet,
  },
  saidText: {
    flex: 1,
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: tokens.text.base,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space[2],
    paddingVertical: tokens.space[4],
  },
  loadingText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    color: tokens.text.mid,
  },
  errorBox: {
    flexDirection: 'row',
    gap: tokens.space[2],
    padding: tokens.space[3],
    borderRadius: tokens.radius.md,
    backgroundColor: 'rgba(255, 159, 67, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 67, 0.35)',
  },
  errorText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13.5,
    lineHeight: 19,
    color: tokens.text.hi,
  },
  errorSub: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12.5,
    lineHeight: 17,
    color: tokens.text.dim,
    marginTop: 2,
  },
  card: {
    backgroundColor: tokens.bg.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.border.base,
    padding: tokens.space[3],
    gap: tokens.space[2],
  },
  eyebrow: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: tokens.semantic.coinLight,
  },
  bold: {
    fontFamily: 'Manrope_800ExtraBold',
  },
  reward: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  rewardXp: { color: tokens.semantic.xp },
  rewardSep: { color: tokens.text.dim },
  rewardCoin: { color: tokens.semantic.coin },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  tagText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: tokens.text.base,
  },
  noteInput: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: tokens.text.hi,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: tokens.bg.surface,
    borderRadius: tokens.radius.sm,
    padding: tokens.space[2],
  },
  remark: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
    paddingTop: tokens.space[1],
  },
  remarkText: {
    flex: 1,
    fontFamily: 'Manrope_500Medium',
    fontSize: 12.5,
    lineHeight: 17,
    color: tokens.text.dim,
  },
  footer: {
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[2],
    paddingBottom: tokens.space[3],
  },
  btnRow: {
    flexDirection: 'row',
    gap: tokens.space[2],
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    height: 52,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGold: {
    backgroundColor: tokens.semantic.coin,
  },
  btnGoldText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: tokens.semantic.coinInk,
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: tokens.border.strong,
  },
  btnGhostText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: tokens.text.hi,
  },
});
