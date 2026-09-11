import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { FullCheckinButton } from '@/components/mood/FullCheckinButton';
import { MoodFace } from '@/components/mood/MoodFace';
import { MoodFaceRow } from '@/components/mood/MoodFaceRow';
import { dateKeyFromLocal } from '@/lib/api/history';
import { useLogMood, useMoodForDay, useMoodTags } from '@/lib/api/mood';
import { useT } from '@/lib/i18n';
import { moodLevel, type MoodValue } from '@/lib/mood';
import { tokens } from '@/theme';

interface Props {
  /** Local YYYY-MM-DD to show/edit the mood for. */
  dateKey: string;
}

/**
 * One day's mood — shared by the Home (any day but today, which gets
 * MoodHubStrip) and the calendar's day panel.
 *
 * Same two doors as the Home's today strip, so a past day is as easy to log
 * as today:
 *   - no entry: the question, five faces — one tap logs THIS day, retroactive
 *     when it is past — and a real button into the full check-in for it;
 *   - entry: face + level + tags + note, and the same button to add or edit
 *     the tags and the note.
 * The empty state used to be a sentence and a 12px "Registrar humor" link in
 * the corner, which is exactly what the owner could not find.
 */
export function MoodDayDetail({ dateKey }: Props) {
  const { t, locale } = useT();
  const router = useRouter();
  const day = useMoodForDay(dateKey);
  const catalog = useMoodTags();
  const logMood = useLogMood();

  // "Unknown" must never render as "not logged". Until the read succeeds,
  // `day.data` is undefined for THREE different reasons — still loading,
  // failed, and genuinely empty — and only the third may show the faces: a
  // quick log over a day whose entry we simply have not read yet would change
  // its mood behind his back.
  if (!day.isSuccess) return null;

  const entry = day.data ?? null;
  const level = entry ? moodLevel(entry.mood) : null;
  const isToday = dateKey === dateKeyFromLocal(new Date());

  const open = () =>
    router.push({ pathname: '/mood-checkin', params: { date: dateKey } });

  if (!entry || !level) {
    const quickLog = (v: MoodValue) => {
      if (logMood.isPending) return;
      logMood.mutate(
        { mood: v, loggedFor: dateKey },
        {
          onSuccess: () => {
            // Haptic only once the RPC actually landed — a premature success
            // signal on a failed save would gaslight the user.
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          },
          onError: (err) => {
            Alert.alert(t('mood.saveError'), (err as { message?: string }).message ?? '');
          },
        },
      );
    };
    return (
      <View style={styles.card}>
        <Text style={styles.eyebrow}>{t('mood.day.eyebrow')}</Text>
        <Text style={styles.question}>
          {isToday ? t('mood.todayCard.promptTitle') : t('mood.questionPast')}
        </Text>
        <View style={[logMood.isPending && { opacity: 0.5 }]}>
          <MoodFaceRow value={null} onSelect={quickLog} size="sm" showLabels={false} />
        </View>
        <FullCheckinButton icon="create-outline" label={t('mood.cta.full')} onPress={open} />
      </View>
    );
  }

  const tagLabel = (slug: string): string => {
    const tg = catalog.data?.find((x) => x.slug === slug);
    if (!tg) return slug;
    const label = locale === 'en' ? tg.label_en : tg.label_pt;
    return tg.emoji ? `${tg.emoji} ${label}` : label;
  };

  // Emotion ("como se sentiu") and context ("o que influenciou") read as two
  // different statements — render them as two pill rows with distinct tints.
  // Unknown slugs (catalog still loading / tag later deactivated) fall into
  // the emotion row so nothing silently disappears.
  const entryTags = entry.tags ?? [];
  const contextSlugs = new Set(
    (catalog.data ?? [])
      .filter((x) => x.tag_group === 'context')
      .map((x) => x.slug),
  );
  const emotionTags = entryTags.filter((s) => !contextSlugs.has(s));
  const contextTags = entryTags.filter((s) => contextSlugs.has(s));
  const hasDetails = entryTags.length > 0 || (entry.note?.trim().length ?? 0) > 0;

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{t('mood.day.eyebrow')}</Text>

      {/* Drawn face (MoodFace): features in the level's measured ink on the
          level-colored disc. The label beside it stays neutral text.hi (bottom
          ramp steps are ~3.2:1 as text). */}
      <View style={styles.moodRow}>
        <MoodFace value={level.value} size={44} active />
        <Text style={styles.levelLabel}>{t(`mood.levels.${level.key}`)}</Text>
      </View>

      {emotionTags.length > 0 && (
        <View style={styles.tagsWrap}>
          {emotionTags.map((slug) => (
            <View key={slug} style={styles.tagPill}>
              <Text style={styles.tagText}>{tagLabel(slug)}</Text>
            </View>
          ))}
        </View>
      )}

      {contextTags.length > 0 && (
        <View style={styles.tagsWrap}>
          {contextTags.map((slug) => (
            <View key={slug} style={[styles.tagPill, styles.tagPillContext]}>
              <Text style={styles.tagText}>{tagLabel(slug)}</Text>
            </View>
          ))}
        </View>
      )}

      {entry.note ? <Text style={styles.note}>{entry.note}</Text> : null}

      <FullCheckinButton
        icon={hasDetails ? 'create-outline' : 'add-circle-outline'}
        label={hasDetails ? t('mood.cta.editTagsNote') : t('mood.cta.addTagsNote')}
        onPress={open}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.bg.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.border.base,
    padding: tokens.space[3],
    gap: tokens.space[3],
  },
  eyebrow: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: tokens.text.dim,
  },
  question: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    lineHeight: 20,
    color: tokens.text.hi,
    marginTop: -tokens.space[1],
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
  },
  levelLabel: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 18,
    color: tokens.text.hi,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: tokens.radius.pill,
    backgroundColor: 'rgba(123, 92, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(123, 92, 255, 0.28)',
  },
  // Context ("what influenced the day") pills — gold-tinted, echoing the
  // app's quest/context accent, so the two tag families read apart at a
  // glance without needing section headers in this compact card.
  tagPillContext: {
    backgroundColor: 'rgba(255, 200, 61, 0.10)',
    borderColor: 'rgba(255, 200, 61, 0.28)',
  },
  tagText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: tokens.text.base,
  },
  note: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: tokens.text.base,
    fontStyle: 'italic',
  },
});
