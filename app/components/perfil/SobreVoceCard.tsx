import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ABOUT_FIELDS,
  draftFrom,
  filledFields,
  useProfileContext,
  type AboutDraft,
  type AboutField,
} from '@/lib/api/aboutMe';
import { useCharacter } from '@/lib/api/character';
import { buildClaudeUrl, openClaude, resolveClaudeTarget } from '@/lib/claudeBridge';
import { useT } from '@/lib/i18n';
import { useLoadedSettings } from '@/lib/settings';
import { formatClock } from '@/lib/time';
import { tokens } from '@/theme';

type T = ReturnType<typeof useT>['t'];
type Locale = ReturnType<typeof useT>['locale'];

export const ABOUT_ICONS: Record<AboutField, keyof typeof Ionicons.glyphMap> = {
  ai: 'chatbubble-ellipses-outline',
  rhythm: 'time-outline',
  focus: 'flag-outline',
  phase: 'home-outline',
  blockers: 'hand-left-outline',
  work: 'briefcase-outline',
  moment: 'journal-outline',
};

/** One line saying what is saved in a field, or null when it is empty. */
export function aboutSummary(field: AboutField, d: AboutDraft, t: T, locale: Locale): string | null {
  const clock = (c: { h: number; m: number }) => formatClock(c.h, c.m, locale);
  switch (field) {
    case 'ai': {
      const parts: string[] = [];
      if (d.aiTone) parts.push(t(`sobreVoce.tone.${d.aiTone}`));
      if (d.aiPush) parts.push(t(`sobreVoce.push.${d.aiPush}`));
      if (d.aiAvoid.length) parts.push(t('sobreVoce.summary.avoid', { list: d.aiAvoid.join(', ') }));
      return parts.length ? parts.join(' · ') : null;
    }
    case 'rhythm': {
      const parts: string[] = [];
      if (d.wake) parts.push(t('sobreVoce.summary.wake', { t: clock(d.wake) }));
      if (d.sleep) parts.push(t('sobreVoce.summary.sleep', { t: clock(d.sleep) }));
      if (d.workStart && d.workEnd) {
        parts.push(t('sobreVoce.summary.work', { from: clock(d.workStart), to: clock(d.workEnd) }));
      }
      if (d.bestTime) {
        parts.push(t('sobreVoce.summary.best', { best: t(`sobreVoce.best.${d.bestTime}`).toLowerCase() }));
      }
      return parts.length ? parts.join(' · ') : null;
    }
    case 'focus':
      return d.focus.trim() || null;
    case 'phase': {
      const parts = [
        ...d.lifePhase.map((p) => t(`sobreVoce.phase.${p}`)),
        ...d.livingWith.map((p) => t(`sobreVoce.living.${p}`)),
      ];
      return parts.length ? parts.join(' · ') : null;
    }
    case 'blockers':
      return d.blockers.length ? d.blockers.map((b) => t(`sobreVoce.blocker.${b}`)).join(' · ') : null;
    case 'work':
      return d.profession.trim() || null;
    case 'moment':
      return d.about.trim() || null;
  }
}

/**
 * "Sobre você" in /perfil, right under the Emblema: seven optional fields
 * the AI reads, each saying what it is for, with a "X de 7" that shows how
 * much is left. A row opens the editor (/sobre-voce) on that field.
 *
 * "Completar com a IA" opens Claude with the request already written (the
 * bridge in lib/claudeBridge — the link carries the instruction only, never
 * anything the person wrote). The Perceva connector then lists what is
 * missing (get_setup_checklist) and saves "Sobre você" after the person
 * confirms (update_about_me). Without the app shortcut switched on there is
 * no connector to talk to yet, so the same button opens Ajustes › Conector,
 * where it gets set up.
 */
export function SobreVoceCard() {
  const { t, locale } = useT();
  const router = useRouter();
  const character = useCharacter();
  const context = useProfileContext();
  const settings = useLoadedSettings();

  const draft = useMemo(
    () => draftFrom(character.data?.profile, context.data),
    [character.data?.profile, context.data],
  );
  const filled = filledFields(draft);
  const total = ABOUT_FIELDS.length;
  const loading = character.isLoading || context.isLoading;

  const completeWithAi = async () => {
    if (!settings.claudeShortcut) {
      router.push('/conector');
      return;
    }
    const ok = await openClaude(
      buildClaudeUrl(
        resolveClaudeTarget(settings, 'about'),
        t('sobreVoce.aiPrompt'),
        settings.claudePromptInLink,
      ),
    );
    if (!ok) Alert.alert(t('sobreVoce.completeWithAi'), t('mood.claudeOpenError'));
  };

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.eyebrow}>{t('sobreVoce.eyebrow')}</Text>
          <Text style={styles.title}>{t('sobreVoce.title')}</Text>
        </View>
        <View
          style={styles.countPill}
          accessible
          accessibilityLabel={t('sobreVoce.progressA11y', { n: filled.size, total })}
        >
          <Text style={styles.countText}>
            {loading ? ' ' : t('sobreVoce.progress', { n: filled.size, total })}
          </Text>
        </View>
      </View>

      <View style={styles.segments} importantForAccessibility="no-hide-descendants">
        {ABOUT_FIELDS.map((f) => (
          <View key={f} style={[styles.segment, filled.has(f) && styles.segmentOn]} />
        ))}
      </View>
      <Text style={styles.optional}>{t('sobreVoce.optional')}</Text>

      <View style={styles.rows}>
        {ABOUT_FIELDS.map((f, i) => {
          const summary = loading ? null : aboutSummary(f, draft, t, locale);
          const title = t(`sobreVoce.fields.${f}.title`);
          return (
            <Pressable
              key={f}
              onPress={() => router.push({ pathname: '/sobre-voce', params: { field: f } })}
              style={({ pressed }) => [
                styles.row,
                i > 0 && styles.rowDivider,
                pressed && { opacity: 0.7 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('sobreVoce.rowA11y', { field: title })}
            >
              <View style={[styles.rowIcon, summary != null && styles.rowIconOn]}>
                <Ionicons
                  name={ABOUT_ICONS[f]}
                  size={16}
                  color={summary != null ? tokens.semantic.coin : tokens.text.dim}
                />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{title}</Text>
                <Text
                  style={summary != null ? styles.rowValue : styles.rowPurpose}
                  numberOfLines={2}
                >
                  {summary ?? t(`sobreVoce.fields.${f}.purpose`)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={tokens.text.dim} />
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => void completeWithAi()}
        style={({ pressed }) => [styles.aiBtn, pressed && { opacity: 0.85 }]}
        accessibilityRole="button"
        accessibilityLabel={t('sobreVoce.completeA11y')}
      >
        <Ionicons name="sparkles" size={16} color={tokens.semantic.coinInk} />
        <Text style={styles.aiText}>{t('sobreVoce.completeWithAi')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: tokens.space[2],
    padding: tokens.space[4],
    marginBottom: tokens.space[4],
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1.5,
    borderColor: tokens.semantic.coinRim,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: tokens.space[3] },
  headText: { flex: 1, minWidth: 0, gap: 2 },
  eyebrow: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: tokens.semantic.coin,
  },
  title: { fontFamily: 'Manrope_800ExtraBold', fontSize: 19, color: tokens.text.hi },
  countPill: {
    minWidth: 64,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.bg.surface2,
    borderWidth: 1,
    borderColor: tokens.semantic.coinRim,
  },
  countText: { fontFamily: 'Manrope_800ExtraBold', fontSize: 13, color: tokens.semantic.coin },
  segments: { flexDirection: 'row', gap: 4, marginTop: tokens.space[1] },
  segment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: tokens.bg.surface2,
  },
  segmentOn: { backgroundColor: tokens.semantic.coin },
  optional: { fontFamily: 'Manrope_500Medium', fontSize: 11.5, color: tokens.text.dim },
  rows: { marginTop: tokens.space[1] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    paddingVertical: 10,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: tokens.border.divider },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.surface2,
  },
  rowIconOn: { backgroundColor: 'rgba(255, 200, 61, 0.14)' },
  rowText: { flex: 1, minWidth: 0, gap: 1 },
  rowTitle: { fontFamily: 'Manrope_700Bold', fontSize: 14, color: tokens.text.hi },
  rowValue: { fontFamily: 'Manrope_600SemiBold', fontSize: 12.5, lineHeight: 17, color: tokens.text.base },
  rowPurpose: { fontFamily: 'Manrope_500Medium', fontSize: 12, lineHeight: 16, color: tokens.text.dim },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    marginTop: tokens.space[2],
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.semantic.coin,
  },
  aiText: { fontFamily: 'Manrope_800ExtraBold', fontSize: 14.5, color: tokens.semantic.coinInk },
});
