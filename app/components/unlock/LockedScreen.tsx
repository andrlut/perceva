import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBottomNavClearance } from '@/components/BottomNavBar';
import { ScreenBackground } from '@/components/ScreenBackground';
import { OnbPrimaryButton } from '@/components/tour/OnboardingKit';
import { useCompletionStats } from '@/lib/api/history';
import { useT } from '@/lib/i18n';
import { UNLOCK_TRIGGERS, useUnlockStore, type UnlockFeature } from '@/lib/unlock';
import { tokens } from '@/theme';

const TAB_NAME_KEY: Record<UnlockFeature, string> = {
  rewards: 'tabs.rewards',
  learning: 'tabs.learning',
  me: 'tabs.hero',
  me_practiced: 'pillar.top.praticada.label',
  me_desired: 'pillar.top.desejada.label',
};

/**
 * What a locked feature shows instead of its content (doc "Onboarding
 * simples", Fase 2): a neutral lock — never the gold Premium seal, so it
 * reads as "ainda não" rather than "pague" — one line saying what opens it,
 * the progress so far, and the shortcut. Recompensas and Aprender open on
 * "Abrir agora"; Eu's shortcut is the Avaliação itself (the first portrait
 * is born from it; opening it empty would teach nothing). The two later
 * portraits have no shortcut — they are the reward for using the app.
 */
export function LockedPanel({ feature }: { feature: UnlockFeature }) {
  const { t } = useT();
  const router = useRouter();
  const unlock = useUnlockStore((s) => s.unlock);
  const stats = useCompletionStats();

  const count =
    feature === 'me_practiced'
      ? UNLOCK_TRIGGERS.practicedAfterDays
      : UNLOCK_TRIGGERS.rewardsAfterCompletions;
  const progress =
    feature === 'rewards'
      ? t('unlock.progress.completions', {
          done: Math.min(stats.data?.total ?? 0, count),
          count,
        })
      : feature === 'me_practiced'
        ? t('unlock.progress.days', { done: Math.min(stats.data?.days ?? 0, count), count })
        : null;

  const openNow = () => {
    Haptics.selectionAsync().catch(() => {});
    void unlock(feature, 'manual');
  };
  const goAssessment = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push('/self-assessment');
  };

  return (
    <View style={styles.panel}>
      <View style={styles.lockRing}>
        <Ionicons name="lock-closed-outline" size={26} color={tokens.text.mid} />
      </View>
      <Text style={styles.title}>{t(TAB_NAME_KEY[feature])}</Text>
      <Text style={styles.line}>{t(`unlock.line.${feature}`, { count })}</Text>
      {progress ? <Text style={styles.progress}>{progress}</Text> : null}

      {feature === 'rewards' || feature === 'learning' ? (
        <View style={styles.actions}>
          <OnbPrimaryButton label={t('unlock.openNow')} icon="arrow-forward" onPress={openNow} />
          <Text style={styles.hint}>{t('unlock.hint')}</Text>
        </View>
      ) : feature === 'me' ? (
        <View style={styles.actions}>
          <OnbPrimaryButton
            label={t('unlock.doAssessment')}
            icon="arrow-forward"
            onPress={goAssessment}
          />
        </View>
      ) : null}
    </View>
  );
}

/** Full tab body for a locked tab: same frame as the real screen. */
export function LockedScreen({ feature }: { feature: UnlockFeature }) {
  const bottomClearance = useBottomNavClearance();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenBackground>
        <View style={[styles.center, { paddingBottom: bottomClearance }]}>
          <LockedPanel feature={feature} />
        </View>
      </ScreenBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  center: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: tokens.space[5],
  },
  panel: {
    alignItems: 'center',
    gap: tokens.space[3],
    paddingVertical: tokens.space[6],
  },
  lockRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: tokens.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.space[1],
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 22,
    color: tokens.text.hi,
    textAlign: 'center',
  },
  line: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
    lineHeight: 22,
    color: tokens.text.base,
    textAlign: 'center',
    maxWidth: 320,
  },
  progress: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.text.mid,
    letterSpacing: 0.3,
  },
  actions: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: tokens.space[3],
    marginTop: tokens.space[3],
  },
  hint: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: tokens.text.mid,
  },
});
