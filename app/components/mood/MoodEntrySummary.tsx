import { StyleSheet, Text, View } from 'react-native';

import { MoodFace } from '@/components/mood/MoodFace';
import { useMoodTags } from '@/lib/api/mood';
import type { MoodLog } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { moodLevel } from '@/lib/mood';
import { tokens } from '@/theme';

/**
 * One logged day, read back: the face and level, the tags in two tinted
 * rows (how it felt / what influenced it), the note.
 *
 * Shared by the Home's today strip (MoodHubStrip) and the any-day card
 * (MoodDayDetail — past days on the Home, every day in the calendar), so
 * today reads exactly like yesterday. It used to be that today collapsed to
 * "Hoje: bem" while the previous day showed everything, and the owner had
 * to go back a day to see what he had just written.
 *
 * Renders a fragment on purpose: the pieces join the parent card's own
 * `gap`, so each host keeps its eyebrow and buttons around them.
 */
export function MoodEntrySummary({
  entry,
}: {
  entry: Pick<MoodLog, 'mood' | 'tags' | 'note'>;
}) {
  const { t, locale } = useT();
  const catalog = useMoodTags();
  const level = moodLevel(entry.mood);

  const tagLabel = (slug: string): string => {
    const tg = catalog.data?.find((x) => x.slug === slug);
    if (!tg) return slug;
    const label = locale === 'en' ? tg.label_en : tg.label_pt;
    return tg.emoji ? `${tg.emoji} ${label}` : label;
  };

  // Emotion ("como se sentiu") and context ("o que influenciou") read as two
  // different statements — two pill rows with distinct tints. Unknown slugs
  // (catalog still loading / tag later deactivated) fall into the emotion
  // row so nothing silently disappears.
  const entryTags = entry.tags ?? [];
  const contextSlugs = new Set(
    (catalog.data ?? [])
      .filter((x) => x.tag_group === 'context')
      .map((x) => x.slug),
  );
  const emotionTags = entryTags.filter((s) => !contextSlugs.has(s));
  const contextTags = entryTags.filter((s) => contextSlugs.has(s));

  return (
    <>
      {/* Drawn face (MoodFace): features in the level's measured ink on the
          level-colored disc. The label beside it stays neutral text.hi
          (bottom ramp steps are ~3.2:1 as text). */}
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
    </>
  );
}

const styles = StyleSheet.create({
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
