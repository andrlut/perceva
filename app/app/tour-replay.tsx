import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { type Href, Stack, useNavigation, useRouter } from 'expo-router';
import { useRef } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBottomSafeClearance } from '@/components/BottomNavBar';
import { ScreenBackground } from '@/components/ScreenBackground';
import { useT } from '@/lib/i18n';
import {
  ROUTE_MODULE_PATH,
  type GuidedModule,
  type RouteModule,
  type TourModuleStatus,
} from '@/lib/tour/constants';
import { useTourStore } from '@/lib/tour/store';
import { exitTourToHome } from '@/lib/tour/navigation';
import { tokens } from '@/theme';

/**
 * Ajustes → "Refazer onboarding". The owner uses this to re-run the
 * onboarding while it is being built, so the full redo is the big card at
 * the top — one tap, straight to the first intro screen.
 *
 * Below it, each part can be redone on its own. Since v2 `replayModule`
 * touches ONLY the module being replayed (the store's in-memory `replaying`
 * slot makes it the current one), so the status column is honest: a module
 * the user never saw still reads "Ainda não visto" after replaying another.
 *
 *   - Opening (intro, pack) → its full-screen route.
 *   - Guided tour (M1…M6) → Home, where each module's first step lives.
 *
 * No M3 row: Missões left the tour (opt-in module, not taught). No wrap
 * row: it marks itself done on mount and only closes the full run.
 */

interface ReplaySpec<M> {
  id: M;
  icon: keyof typeof Ionicons.glyphMap;
}

const OPENING: ReplaySpec<RouteModule>[] = [
  { id: 'intro', icon: 'sparkles-outline' },
  { id: 'pack', icon: 'albums-outline' },
];

const GUIDED: ReplaySpec<GuidedModule>[] = [
  { id: 'M1', icon: 'checkmark-done-outline' },
  { id: 'M2', icon: 'create-outline' },
  { id: 'M4', icon: 'gift-outline' },
  { id: 'M5', icon: 'person-outline' },
  { id: 'M6', icon: 'bulb-outline' },
];

// text.mid (not dim) for "not seen": the label has to stay readable, it
// is the whole point of the column.
const STATUS_TONE: Record<
  TourModuleStatus,
  { color: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  pending: { color: tokens.text.mid, icon: 'ellipse-outline' },
  in_progress: { color: tokens.brand.violet2, icon: 'time-outline' },
  completed: { color: tokens.semantic.xp2, icon: 'checkmark-circle' },
  skipped: { color: tokens.semantic.coinLight, icon: 'play-skip-forward-outline' },
};

const GOLD_INK = '#3D2A00';

export default function TourReplayScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { t } = useT();
  const modules = useTourStore((s) => s.modules);
  const replayModule = useTourStore((s) => s.replayModule);
  const resetAll = useTourStore((s) => s.resetAll);
  const bottomClearance = useBottomSafeClearance();
  // One navigation per visit: a double tap would stack two replaces (and a
  // second replayModule over the first). Never re-armed on success — the
  // screen is replaced; only a failure hands the taps back.
  const busy = useRef(false);

  const run = async (reset: () => Promise<void>, to: Href) => {
    if (busy.current) return;
    busy.current = true;
    Haptics.selectionAsync().catch(() => {});
    try {
      await reset();
      // Resetting intro/pack also wakes the AuthGate, which may already
      // have replaced this screen with the same route — replacing again
      // would mount it twice.
      if (!navigation.isFocused()) return;
      if (to === '/(tabs)') exitTourToHome();
      else router.replace(to);
    } catch {
      busy.current = false;
    }
  };

  const handleReplayAll = () => run(resetAll, '/tour/intro');
  const handleReplayOpening = (id: RouteModule) =>
    run(() => replayModule(id), ROUTE_MODULE_PATH[id]);
  const handleReplayGuided = (id: GuidedModule) =>
    run(() => replayModule(id), '/(tabs)');

  const renderRow = (
    spec: ReplaySpec<RouteModule | GuidedModule>,
    onPress: () => void,
  ) => {
    const status: TourModuleStatus = modules[spec.id]?.status ?? 'pending';
    const tone = STATUS_TONE[status];
    const name = t(`tour.replay.modules.${spec.id}.name`);
    const statusLabel = t(`tour.replay.status.${status}`);
    return (
      <Pressable
        key={spec.id}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        accessibilityRole="button"
        accessibilityLabel={t('tour.replay.rowA11y', { name, status: statusLabel })}
      >
        <View style={styles.rowIcon}>
          <Ionicons name={spec.icon} size={20} color={tokens.brand.violet2} />
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.rowName}>{name}</Text>
          <Text style={styles.rowDesc}>{t(`tour.replay.modules.${spec.id}.desc`)}</Text>
          <View style={styles.statusRow}>
            <Ionicons name={tone.icon} size={14} color={tone.color} />
            <Text style={[styles.rowStatus, { color: tone.color }]}>{statusLabel}</Text>
          </View>
        </View>
        <View style={styles.replayPill}>
          <Ionicons name="refresh" size={14} color={tokens.brand.violet2} />
          <Text style={styles.replayText}>{t('tour.replay.replayBtn')}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenBackground>
        <Stack.Screen options={{ headerShown: false }} />

        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Ionicons name="chevron-back" size={24} color={tokens.text.hi} />
          </Pressable>
          <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
            {t('tour.replay.title')}
          </Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomClearance + tokens.space[4] }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>{t('tour.replay.subtitle')}</Text>

          {/* The full redo — what the owner reaches for while testing. */}
          <Pressable
            onPress={handleReplayAll}
            style={({ pressed }) => [styles.allCard, pressed && { opacity: 0.88 }]}
            accessibilityRole="button"
            accessibilityLabel={t('tour.replay.allTitle')}
            accessibilityHint={t('tour.replay.allDesc')}
          >
            <View style={styles.allTop}>
              <View style={styles.allIcon}>
                <Ionicons name="refresh" size={22} color={tokens.semantic.coin} />
              </View>
              <View style={styles.allBody}>
                <Text style={styles.allTitle}>{t('tour.replay.allTitle')}</Text>
                <Text style={styles.allDesc}>{t('tour.replay.allDesc')}</Text>
              </View>
            </View>
            <View style={styles.allCta}>
              <Text style={styles.allCtaText}>{t('tour.replay.allCta')}</Text>
              <Ionicons name="arrow-forward" size={16} color={GOLD_INK} />
            </View>
          </Pressable>

          <Text style={styles.sectionLabel}>{t('tour.replay.sectionOpening')}</Text>
          <View style={styles.list}>
            {OPENING.map((spec) => renderRow(spec, () => handleReplayOpening(spec.id)))}
          </View>

          <Text style={styles.sectionLabel}>{t('tour.replay.sectionGuided')}</Text>
          <View style={styles.list}>
            {GUIDED.map((spec) => renderRow(spec, () => handleReplayGuided(spec.id)))}
          </View>

          <Text style={styles.footnote}>{t('tour.replay.footnote')}</Text>
        </ScrollView>
      </ScreenBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.space[2],
    paddingVertical: tokens.space[2],
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...tokens.type.h3,
    color: tokens.text.hi,
    flexShrink: 1,
  },
  content: {
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[1],
    gap: tokens.space[3],
  },
  subtitle: {
    ...tokens.type.body,
    color: tokens.text.mid,
  },
  allCard: {
    gap: tokens.space[4],
    padding: tokens.space[4],
    borderRadius: tokens.radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 200, 61, 0.55)',
    backgroundColor: 'rgba(255, 200, 61, 0.09)',
    marginTop: tokens.space[1],
  },
  allTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.space[3],
  },
  allIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 200, 61, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 61, 0.35)',
  },
  allBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  allTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 18,
    lineHeight: 23,
    color: tokens.semantic.coinLight,
  },
  allDesc: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: tokens.text.base,
  },
  allCta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: tokens.space[5],
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.semantic.coin,
    borderWidth: 1,
    borderColor: 'rgba(255, 224, 138, 0.55)',
  },
  allCtaText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: GOLD_INK,
    letterSpacing: 0.3,
  },
  sectionLabel: {
    ...tokens.type.eyebrow,
    color: tokens.text.mid,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: tokens.space[3],
    paddingLeft: tokens.space[1],
  },
  list: {
    gap: tokens.space[2],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    minHeight: 64,
    paddingVertical: tokens.space[3],
    paddingHorizontal: tokens.space[3],
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.border.base,
    backgroundColor: tokens.bg.surface,
  },
  rowPressed: {
    opacity: 0.75,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(123, 92, 255, 0.12)',
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowName: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    lineHeight: 20,
    color: tokens.text.hi,
  },
  rowDesc: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: tokens.text.mid,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  rowStatus: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    lineHeight: 17,
  },
  replayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: tokens.space[3],
    paddingVertical: tokens.space[2],
    borderRadius: tokens.radius.pill,
    backgroundColor: 'rgba(123, 92, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(123, 92, 255, 0.35)',
  },
  replayText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    color: tokens.brand.violet2,
  },
  footnote: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: tokens.text.mid,
    marginTop: tokens.space[3],
    paddingHorizontal: tokens.space[1],
  },
});
