import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { HeroHeader } from '@/components/HeroHeader';
import { PillarSwitcher, type PillarKey } from '@/components/PillarSwitcher';
import { ScreenBackground } from '@/components/ScreenBackground';
import { AvaliacaoPanel } from '@/components/pillars/AvaliacaoPanel';
import { DedicacaoPanel } from '@/components/pillars/DedicacaoPanel';
import { CaminhoPanel } from '@/components/pillars/CaminhoPanel';
import { NortePanel } from '@/components/pillars/NortePanel';
import { useCharacter } from '@/lib/api/character';
import { useSkillStates } from '@/lib/api/skills';
import { useT } from '@/lib/i18n';
import { useModuleEnabled } from '@/lib/modules';
import { TourModule } from '@/components/tour/TourModule';
import { TourTarget } from '@/components/tour/TourTarget';
import { emitTourEvent } from '@/lib/tour/eventBus';
import {
  buildM5Steps,
  M5_EVENTS,
  M5_PILLAR_BY_STEP,
  M5_SELF_ASSESSMENT_STEP,
} from '@/lib/tour/m5Steps';
import {
  useActiveTourStepStore,
  useIsCurrentTourModule,
  useTourStore,
} from '@/lib/tour/store';
import { remeasureActiveTourTarget } from '@/lib/tour/targets';
import { usePullToRefresh } from '@/lib/usePullToRefresh';
import { tokens } from '@/theme';

/** Room kept under the "Fazer autoavaliação" CTA during M5 step 3 so the
 *  questionnaire CTA right below it also clears the tooltip — the step's
 *  copy points at it ("logo abaixo"). One CTA row + the panel gap. */
const QUESTIONNAIRE_ROOM = 44 + tokens.space[3];
/** Gap between a spotlighted anchor and the tooltip card's top edge
 *  (spotlight hole pad + ring + breathing room). */
const CARD_GAP = 24;
/** Fallback tooltip height before the card has measured itself. */
const CARD_FALLBACK_H = 280;

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
 * Loading and error render INSIDE the tree (not as early returns) so the
 * M5 `<TourModule>` mount always exists: the focus effect can advance M5
 * onto this screen before the character query lands, and a step whose
 * mount never renders would leave the tour silent with no way to skip
 * (audit 2026-09).
 */
export default function CharacterScreen() {
  const { t } = useT();
  const router = useRouter();
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

  const [activePillar, setActivePillar] = useState<PillarKey>(
    // Opens on Praticada: what was practiced lately is the reading that
    // changes day to day, so it is the one worth landing on.
    params.pillar ?? 'praticada',
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
  const scrollViewRef = useRef<ScrollView>(null);

  // ── M5 tour plumbing ────────────────────────────────────────────────
  const isM5Current = useIsCurrentTourModule('M5');
  const m5StepIndex = useTourStore((s) => s.stepIndices.M5 ?? 0);
  const m5Status = useTourStore((s) => s.modules.M5?.status);
  const contentH = useRef(0);
  const viewportH = useRef(0);
  // Scroll anchors, measured in window coordinates at scroll time (never
  // cached, so a panel reorder or a taller header can't leave a stale Y):
  // a zero-height marker at the top of the scroll content, the pillar
  // switcher and the "Fazer autoavaliação" CTA inside AvaliacaoPanel.
  const contentTopRef = useRef<View>(null);
  const switcherRef = useRef<View>(null);
  const selfAssessmentRef = useRef<View>(null);

  // While an M5 tooltip is open on this tab (steps 2-5, all bottom-pinned)
  // add extra bottom room so the user can scroll content clear of the
  // tooltip card — same buffer pattern as the other modules.
  const m5OnMeStep =
    isM5Current && m5Status === 'in_progress' && m5StepIndex >= 1 && m5StepIndex <= 4;
  // Floor at the historical 260, but grow with the REAL measured card
  // height so a taller restyled card can't eat the gap.
  const tourCardHeight = useActiveTourStepStore((s) => s.cardHeight);
  const m5Bump = m5OnMeStep ? Math.max(260, (tourCardHeight ?? 0) + 24) : 0;

  // M5 step 1 lives on Home and waits for the user to reach this tab.
  // Emit ME_NAVIGATED when the screen gains focus while step 1 is still
  // current, so the Home tooltip advances to step 2 (which renders here —
  // in the loading/error states too, see the note on the component).
  useFocusEffect(
    useCallback(() => {
      const state = useTourStore.getState();
      const status = state.modules.M5?.status ?? 'pending';
      const idx = state.stepIndices.M5 ?? 0;
      if (isM5Current && idx === 0 && status !== 'completed' && status !== 'skipped') {
        emitTourEvent(M5_EVENTS.ME_NAVIGATED);
      }
    }, [isM5Current]),
  );

  /**
   * Scroll so `node` lands `placeY(height)` px below the viewport top.
   * Content Y comes from the window-coordinate difference against the
   * content-top marker — independent of the current offset and of how
   * measureLayout treats scroll views on each architecture. Clamped to the
   * scroll range. Re-measures the spotlight once the animation settles.
   */
  const scrollAnchorTo = useCallback(
    (node: View | null, placeY: (height: number) => number) => {
      const top = contentTopRef.current;
      const sv = scrollViewRef.current;
      if (!node || !top || !sv) return;
      top.measureInWindow((_tx, topY) => {
        node.measureInWindow((_nx, nodeY, _nw, nodeH) => {
          if (nodeH <= 0) return;
          const range = Math.max(0, contentH.current - viewportH.current);
          const y = Math.min(range, Math.max(0, nodeY - topY - placeY(nodeH)));
          sv.scrollTo({ y, animated: true });
          setTimeout(remeasureActiveTourTarget, 450);
        });
      });
    },
    [],
  );

  // Drive the active portrait off the M5 step index so tapping Próximo
  // flips it under the tooltip (M5_PILLAR_BY_STEP). Scroll:
  //   - step 3 (Percebida, "start here"): the self-assessment CTA — and
  //     the questionnaire just below it — settle in the open band above
  //     the bottom-pinned card;
  //   - every other step on this tab: the switcher goes to the top, so
  //     the portrait it just flipped to fills the space above the card.
  // Re-runs when the card measures itself (m5Bump) to use its real height.
  // Waits for the character data: before it lands, neither anchor exists.
  const dataReady = character.data != null;
  useEffect(() => {
    if (!isM5Current || m5Status !== 'in_progress' || !dataReady) return;
    const pillar = M5_PILLAR_BY_STEP[m5StepIndex];
    if (pillar) setActivePillar(pillar);
    const id = setTimeout(() => {
      if (m5StepIndex === M5_SELF_ASSESSMENT_STEP) {
        scrollAnchorTo(selfAssessmentRef.current, (h) => {
          const cardH = useActiveTourStepStore.getState().cardHeight ?? CARD_FALLBACK_H;
          const cardTop = viewportH.current - bottomClearance - tokens.space[2] - cardH;
          return Math.max(tokens.space[4], cardTop - CARD_GAP - QUESTIONNAIRE_ROOM - h);
        });
      } else if (pillar) {
        scrollAnchorTo(switcherRef.current, () => tokens.space[3]);
      }
    }, 180);
    return () => clearTimeout(id);
  }, [isM5Current, m5Status, m5StepIndex, m5Bump, dataReady, bottomClearance, scrollAnchorTo]);

  const data = character.data;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenBackground>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            { paddingBottom: bottomClearance + m5Bump },
            !data && styles.statusContent,
          ]}
          showsVerticalScrollIndicator={false}
          onLayout={(e) => {
            viewportH.current = e.nativeEvent.layout.height;
          }}
          onContentSizeChange={(_w, h) => {
            contentH.current = h;
          }}
          onScrollEndDrag={remeasureActiveTourTarget}
          onMomentumScrollEnd={remeasureActiveTourTarget}
          refreshControl={
            <RefreshControl
              refreshing={pull.refreshing}
              onRefresh={pull.onRefresh}
              tintColor={tokens.brand.violet2}
            />
          }
        >
          <View ref={contentTopRef} collapsable={false} />

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
              <HeroHeader />

              {/* Tab body — padded inset under the header. One panel per
                  pillar; Desejada stacks Caminho under Norte (its sections
                  self-gate by module, so a module-light user sees Norte only). */}
              <View style={styles.body}>
                <View ref={switcherRef} collapsable={false}>
                  <TourTarget id="me.pillars" radius={tokens.radius.md}>
                    <PillarSwitcher active={activePillar} onChange={setActivePillar} />
                  </TourTarget>
                </View>
                <View style={styles.subViewWrap}>
                  {activePillar === 'percebida' && (
                    <AvaliacaoPanel
                      subScores={data.subScores}
                      selfAssessmentAnchorRef={selfAssessmentRef}
                    />
                  )}
                  {activePillar === 'praticada' && (
                    <DedicacaoPanel dimensions={data.dimensions} />
                  )}
                  {activePillar === 'desejada' && (
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

      {/* M5 steps 2-5 live here (switcher, then the three portraits — the
         Percebida one hands over "Fazer autoavaliação"). Step 1 is on Home
         (Eu tab spotlight). Mounted in every state of this screen, loading
         and error included. Finishing returns the user to the Tasks home
         so the next module's Home-anchored step 1 can show. No `flatNav` —
         this is a tab screen WITH the BottomNavBar. */}
      <TourModule
        module="M5"
        screen="me"
        steps={buildM5Steps(t)}
        enabled={isM5Current}
        onExitScreen={() => router.navigate('/(tabs)')}
      />
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
