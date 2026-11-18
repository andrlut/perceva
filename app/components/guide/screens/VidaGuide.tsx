import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { GuideFit } from '@/components/guide/GuideFit';
import { GuideLabel, GuideStep } from '@/components/guide/GuideStep';
import {
  VidaCutChips,
  VidaEntryCard,
  VidaPracticeRow,
  VidaScenes,
  VidaSubChips,
} from '@/components/vida/VidaParts';
import type { LifeScene } from '@/lib/api/lifeVision';
import { screenGuidePrompt } from '@/lib/guide';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/**
 * The (i) of "A vida que eu quero" (/vida and its form) —
 * docs/informativo-de-tela.md. No gesture on the screen, so no playground:
 * one step per option, top to bottom, each replica drawn with the screen's
 * own pieces (components/vida/VidaParts) on a sample vision. One ordered key
 * list feeds the sheet and the AI prompt alike.
 */

const PREFIX = 'vida.help';

export const VIDA_GUIDE_ITEMS = [
  'scenes',
  'headline',
  'guiltFree',
  'cuts',
  'firstPractice',
  'edit',
  'eu',
  'ai',
  'delete',
] as const;

type Key = (typeof VIDA_GUIDE_ITEMS)[number];

export function useVidaGuidePrompt(): string {
  const { t } = useT();
  return screenGuidePrompt(t, PREFIX, VIDA_GUIDE_ITEMS);
}

/** The sample vision the replicas draw (the owner's own three, generic). */
export function useVidaSample(): { headline: string; scenes: LifeScene[] } {
  const { t } = useT();
  return {
    headline: t(`${PREFIX}.sampleHeadline`),
    scenes: [
      { text: t(`${PREFIX}.sampleScene1`), dim: 'wealth' },
      { text: t(`${PREFIX}.sampleScene2`), dim: 'wealth' },
      { text: t(`${PREFIX}.sampleScene3`), dim: 'bonds' },
    ],
  };
}

export function VidaGuide() {
  const { t } = useT();
  const sample = useVidaSample();
  const naturalWidth = useWindowDimensions().width - 32;
  const k = (key: Key, leaf: 'title' | 'body') => t(`${PREFIX}.items.${key}.${leaf}`);

  const steps: Record<Key, { icon: keyof typeof Ionicons.glyphMap; replica?: React.ReactNode }> = {
    scenes: {
      icon: 'sparkles-outline',
      replica: (
        <GuideFit naturalWidth={naturalWidth}>
          <VidaScenes scenes={sample.scenes} />
        </GuideFit>
      ),
    },
    headline: {
      icon: 'text-outline',
      replica: <Text style={styles.headline}>{sample.headline}</Text>,
    },
    guiltFree: { icon: 'heart-outline', replica: <VidaSubChips subs={['circle', 'play', 'nutrition']} /> },
    cuts: {
      icon: 'cut-outline',
      replica: <VidaCutChips cuts={[t(`${PREFIX}.sampleCut1`), t(`${PREFIX}.sampleCut2`)]} />,
    },
    firstPractice: {
      icon: 'checkmark-circle-outline',
      replica: <VidaPracticeRow title={t(`${PREFIX}.samplePractice`)} icon="calendar-outline" />,
    },
    edit: {
      icon: 'time-outline',
      replica: (
        <View style={styles.editRow}>
          <Text style={styles.muted}>{t(`${PREFIX}.sampleWritten`)}</Text>
          <View style={styles.editBtn}>
            <Ionicons name="create-outline" size={14} color={tokens.semantic.coinInk} />
            <Text style={styles.editText}>{t('common.edit')}</Text>
          </View>
        </View>
      ),
    },
    eu: {
      icon: 'person-circle-outline',
      replica: (
        <GuideFit naturalWidth={naturalWidth}>
          <VidaEntryCard headline={sample.headline} scenes={sample.scenes} onPress={() => {}} />
        </GuideFit>
      ),
    },
    ai: { icon: 'chatbubbles-outline' },
    delete: {
      icon: 'trash-outline',
      replica: <Text style={styles.deleteText}>{t('vida.deleteAll')}</Text>,
    },
  };

  return (
    <View style={styles.wrap}>
      <GuideLabel>{t(`${PREFIX}.screenLabel`)}</GuideLabel>
      {VIDA_GUIDE_ITEMS.map((key) => (
        <GuideStep key={key} icon={steps[key].icon} title={k(key, 'title')} body={k(key, 'body')}>
          {steps[key].replica}
        </GuideStep>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: tokens.space[4] },
  headline: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 20,
    color: tokens.semantic.coin,
  },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.space[3] },
  muted: { flex: 1, fontFamily: 'Manrope_500Medium', fontSize: 12.5, color: tokens.text.mid },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.semantic.coin,
  },
  editText: { fontFamily: 'Manrope_800ExtraBold', fontSize: 12, color: tokens.semantic.coinInk },
  deleteText: { fontFamily: 'Manrope_700Bold', fontSize: 13, color: tokens.semantic.danger },
});
