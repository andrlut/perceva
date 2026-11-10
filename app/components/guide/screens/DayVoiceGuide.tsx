import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { ProposalRow } from '@/components/dayVoice/ProposalRow';
import { GuideLabel, GuideStep } from '@/components/guide/GuideStep';
import { MoodFace } from '@/components/mood/MoodFace';
import { screenGuidePrompt } from '@/lib/guide';
import { useT } from '@/lib/i18n';
import { tokens } from '@/theme';

/**
 * The (i) of "Conte seu dia" (/day-voice) — docs/informativo-de-tela.md.
 * How to talk so the AI gets it right ("say the practice names", "give a
 * mood from 1 to 5", "say what you didn't do too"), then the card: the
 * replicas are the screen's own ProposalRow. One ordered key list feeds the
 * sheet and the AI prompt alike.
 */

const PREFIX = 'dayVoice.help';

export const DAY_VOICE_GUIDE_ITEMS = [
  'speak',
  'practices',
  'skips',
  'mood',
  'note',
  'review',
  'register',
  'edit',
  'limit',
] as const;

type Key = (typeof DAY_VOICE_GUIDE_ITEMS)[number];

export function useDayVoiceGuidePrompt(): string {
  const { t } = useT();
  return screenGuidePrompt(t, PREFIX, DAY_VOICE_GUIDE_ITEMS);
}

function Said({ text }: { text: string }) {
  return (
    <View style={styles.said}>
      <View style={styles.saidMic}>
        <Ionicons name="mic" size={12} color="#FFFFFF" />
      </View>
      <Text style={styles.saidText}>“{text}”</Text>
    </View>
  );
}

export function DayVoiceGuide() {
  const { t } = useT();
  const k = (key: Key, leaf: 'title' | 'body') => t(`${PREFIX}.items.${key}.${leaf}`);

  const steps: Record<Key, { icon: keyof typeof Ionicons.glyphMap; replica?: React.ReactNode }> = {
    speak: { icon: 'mic-outline', replica: <Said text={t(`${PREFIX}.sampleSaid`)} /> },
    practices: {
      icon: 'checkmark-circle-outline',
      replica: (
        <ProposalRow
          checked
          leading={<Ionicons name="barbell-outline" size={20} color={tokens.semantic.xp} />}
          title={
            <Text>
              {t('dayVoice.completeRow')} <Text style={styles.bold}>{t(`${PREFIX}.samplePractice`)}</Text>
            </Text>
          }
        />
      ),
    },
    skips: {
      icon: 'play-skip-forward-outline',
      replica: (
        <ProposalRow
          checked
          leading={<Ionicons name="walk-outline" size={20} color={tokens.text.dim} />}
          title={
            <Text>
              {t('dayVoice.skipRow')} <Text style={styles.bold}>{t(`${PREFIX}.sampleSkip`)}</Text>
            </Text>
          }
        />
      ),
    },
    mood: {
      icon: 'happy-outline',
      replica: (
        <ProposalRow
          checked
          leading={<MoodFace value={4} size={28} active />}
          title={t('dayVoice.moodRow', { value: 4, label: t('mood.levels.good') })}
          detail={t('dayVoice.tapToChange')}
        />
      ),
    },
    note: {
      icon: 'create-outline',
      replica: (
        <ProposalRow
          checked
          leading={<Ionicons name="create-outline" size={20} color={tokens.brand.violet2} />}
          title={t('dayVoice.noteRow')}
          detail={t(`${PREFIX}.sampleNote`)}
        />
      ),
    },
    review: {
      icon: 'checkbox-outline',
      replica: (
        <ProposalRow
          checked={false}
          leading={<Ionicons name="book-outline" size={20} color={tokens.semantic.xp} />}
          title={
            <Text>
              {t('dayVoice.completeRow')} <Text style={styles.bold}>{t(`${PREFIX}.sampleUnchecked`)}</Text>
            </Text>
          }
        />
      ),
    },
    register: {
      icon: 'checkmark-done-outline',
      replica: (
        <View style={[styles.btn, styles.btnGold]}>
          <Text style={styles.btnGoldText}>{t('dayVoice.register')}</Text>
        </View>
      ),
    },
    edit: {
      icon: 'arrow-undo-outline',
      replica: (
        <View style={[styles.btn, styles.btnGhost]}>
          <Text style={styles.btnGhostText}>{t('dayVoice.edit')}</Text>
        </View>
      ),
    },
    limit: { icon: 'speedometer-outline' },
  };

  return (
    <View style={styles.wrap}>
      <GuideLabel>{t(`${PREFIX}.screenLabel`)}</GuideLabel>
      {DAY_VOICE_GUIDE_ITEMS.map((key) => (
        <GuideStep key={key} icon={steps[key].icon} title={k(key, 'title')} body={k(key, 'body')}>
          {steps[key].replica}
        </GuideStep>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: tokens.space[4],
  },
  bold: {
    fontFamily: 'Manrope_800ExtraBold',
  },
  said: {
    flexDirection: 'row',
    gap: tokens.space[2],
    alignItems: 'flex-start',
    backgroundColor: tokens.bg.surface2,
    borderRadius: tokens.radius.md,
    padding: tokens.space[2],
  },
  saidMic: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.brand.violet,
  },
  saidText: {
    flex: 1,
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: tokens.text.base,
  },
  btn: {
    height: 40,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.space[5],
    alignSelf: 'flex-start',
  },
  btnGold: {
    backgroundColor: tokens.semantic.coin,
  },
  btnGoldText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: tokens.semantic.coinInk,
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: tokens.border.strong,
  },
  btnGhostText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: tokens.text.hi,
  },
});
