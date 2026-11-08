import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBottomNavClearance } from '@/components/BottomNavBar';
import { HeroGuide, useHeroGuidePrompt } from '@/components/guide/screens/HeroGuide';
import { HeroHeader } from '@/components/HeroHeader';
import { InfoSheet } from '@/components/InfoSheet';
import { PillarSwitcher, type PillarKey } from '@/components/PillarSwitcher';
import { LockedPanel, LockedScreen } from '@/components/unlock/LockedScreen';
import { UnlockDoor } from '@/components/unlock/UnlockDoor';
import { ScreenBackground } from '@/components/ScreenBackground';
import { AvaliacaoPanel } from '@/components/pillars/AvaliacaoPanel';
import { DedicacaoPanel } from '@/components/pillars/DedicacaoPanel';
import { CaminhoPanel } from '@/components/pillars/CaminhoPanel';
import { NortePanel } from '@/components/pillars/NortePanel';
import { useCharacter } from '@/lib/api/character';
import { useSkillStates } from '@/lib/api/skills';
import { useT } from '@/lib/i18n';
import { useIsLocked } from '@/lib/unlock';
import { useModuleEnabled } from '@/lib/modules';
import { usePullToRefresh } from '@/lib/usePullToRefresh';
import { tokens } from '@/theme';

/**
 * Eu tab — full-width HeroHeader on top (Iris-Wrapped Avatar), then a
 * 3-icon pillar switcher with ONE panel per pillar (the second segments
 * are gone: Autoconhecimento moved to /perfil behind the avatar tap,
 * Momentum went dormant, Caminho folded under Norte and self-gates by
 * module). Content renders directly into the page scroll (no card
 * wrapper) so the chart / list / placeholder dominates.
 *
 *   - Percebida → Avaliação (hex chamariz)
 *   - Praticada → Dedicação (XP view)
 *   - Desejada  → Norte (+ Caminho below it while its modules are on)
 *
 * Loading and error render INSIDE the tree (not as early returns), so the
 * page scroll and its RefreshControl exist in every state of the screen.
 */
/** Progressive lock (doc "Onboarding simples", Fase 2): locked → the
 *  "what opens it" screen (its shortcut is the Avaliação); first opening →
 *  the animated door over the real content; after that, the tab as it
 *  always was — with the later portraits gating themselves inside. */
export default function CharacterScreen() {
  const locked = useIsLocked('me');
  if (locked) return <LockedScreen feature="me" />;
  return (
    <>
      <CharacterScreenContent />
      <UnlockDoor feature="me" />
    </>
  );
}

function CharacterScreenContent() {
  const { t } = useT();
  const character = useCharacter();
  // Skills feed the Desejada pillar's Caminho section only — no fetch
  // while the module is off (CaminhoPanel hides the section too).
  const skillsOn = useModuleEnabled('skills');
  const skillStates = useSkillStates({ enabled: skillsOn });
  // Pull indicator is local state — the queries' isRefetching also flips on
  // every background refetch (mutations, app foreground). Also the retry
  // path of the error state below.
  const pull = usePullToRefresh(() =>
    Promise.all([
      character.refetch(),
      // refetch() bypasses `enabled` — keep the module gate.
      ...(skillsOn ? [skillStates.refetch()] : []),
    ]),
  );
  const params = useLocalSearchParams<{ pillar?: PillarKey }>();

  // The (i) in the hero header: the tab's guide.
  const [helpOpen, setHelpOpen] = useState(false);
  const guidePrompt = useHeroGuidePrompt();

  // Portraits open in sequence (Percebida → Praticada → Desejada); a locked
  // one shows what opens it instead of its panel.
  const lockedPracticed = useIsLocked('me_practiced');
  const lockedDesired = useIsLocked('me_desired');
  const [activePillar, setActivePillar] = useState<PillarKey>(
    // Opens on Praticada: what was practiced lately is the reading that
    // changes day to day, so it is the one worth landing on — unless it is
    // still locked, then on the first portrait.
    params.pillar ?? (lockedPracticed ? 'percebida' : 'praticada'),
  );

  // Honor `?pillar=` changes after mount — e.g. the Home XP card pushes
  // back to this tab to land on Praticada/Dedicação. Without this, the
  // first push works but subsequent re-pushes with the same param do
  // nothing because activePillar is already set.
  useEffect(() => {
    if (params.pillar && params.pillar !== activePillar) {
      setActivePillar(params.pillar);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.pillar]);
  const bottomClearance = useBottomNavClearance();

  const data = character.data;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenBackground>
        <ScrollView
          contentContainerStyle={[
            { paddingBottom: bottomClearance },
            !data && styles.statusContent,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={pull.refreshing}
              onRefresh={pull.onRefresh}
              tintColor={tokens.brand.violet2}
            />
          }
        >
          {character.isLoading ? (
            <View style={styles.statusBox}>
              <ActivityIndicator color={tokens.brand.violet2} />
            </View>
          ) : !data ? (
            // Pull to retry — the ScrollView's RefreshControl refetches.
            <View style={styles.statusBox}>
              <Text style={styles.errorText}>{t('character.failedToLoad')}</Text>
            </View>
          ) : (
            <>
              {/* Full-width header — sits flush against the SafeArea so the
                  ambient halo bleeds from the screen edge. No surrounding
                  padding; the header owns its own internal spacing. */}
              <HeroHeader onInfo={() => setHelpOpen(true)} />

              {/* Tab body — padded inset under the header. One panel per
                  pillar; Desejada stacks Caminho under Norte (its sections
                  self-gate by module, so a module-light user sees Norte only). */}
              <View style={styles.body}>
                <PillarSwitcher
                  active={activePillar}
                  onChange={setActivePillar}
                  locked={[
                    ...(lockedPracticed ? (['praticada'] as const) : []),
                    ...(lockedDesired ? (['desejada'] as const) : []),
                  ]}
                />
                <View style={styles.subViewWrap}>
                  {activePillar === 'percebida' && (
                    <AvaliacaoPanel subScores={data.subScores} />
                  )}
                  {activePillar === 'praticada' && lockedPracticed && (
                    <LockedPanel feature="me_practiced" />
                  )}
                  {activePillar === 'praticada' && !lockedPracticed && (
                    <DedicacaoPanel dimensions={data.dimensions} />
                  )}
                  {activePillar === 'desejada' && lockedDesired && (
                    <LockedPanel feature="me_desired" />
                  )}
                  {activePillar === 'desejada' && !lockedDesired && (
                    <View style={styles.desejadaStack}>
                      <NortePanel subScores={data.subScores} />
                      <CaminhoPanel skills={skillStates.data ?? []} />
                    </View>
                  )}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </ScreenBackground>

      {/* The tab's guide (docs/informativo-de-tela.md). */}
      <InfoSheet
        visible={helpOpen}
        onClose={() => setHelpOpen(false)}
        title={t('hero.help.title')}
        aiPrompt={guidePrompt}
        video="me"
      >
        <HeroGuide />
      </InfoSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  /** Loading / error: the scroll content fills the viewport so the status
   *  box centres, and the RefreshControl stays reachable for a retry. */
  statusContent: { flexGrow: 1 },
  statusBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.space[6],
  },
  errorText: { ...tokens.type.body, color: tokens.text.mid, textAlign: 'center' },
  body: {
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[3],
    gap: tokens.space[4],
  },
  subViewWrap: {
    marginTop: 0,
  },
  desejadaStack: {
    gap: tokens.space[5],
  },
});
