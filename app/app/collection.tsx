import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBottomSafeClearance } from '@/components/BottomNavBar';
import { CollectionGrid } from '@/components/ideas/CollectionGrid';
import { ScreenBackground } from '@/components/ScreenBackground';
import { useCollectedIdeas, useIdeaCards } from '@/lib/api/learning';
import type { DimensionId } from '@/lib/db/types';
import { useT } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import { toCardDataFromPublic, type IdeaCardData, type IdeaLocale } from '@/lib/ideas';
import { tokens } from '@/theme';
import { DIMENSION_META, DIMENSION_ORDER } from '@/theme/dimensions';

/**
 * "Minhas ideias" — the user's collection of absorbed idea cards.
 *
 * Data: every published idea (`useIdeaCards()`, the `learning_idea_public`
 * view) filtered by the user's collection (`useCollectedIdeas()`), newest
 * release first then by ordinal. A row of dimension pills narrows the grid to
 * one dimension; only dimensions with at least one absorbed idea get a pill.
 *
 * The flip here is reveal-only — collecting happens solely on the card at the
 * end of the idea screen — and the back's "Abrir ideia" reopens that screen
 * on the card's ordinal. Reached from the strip at the top of the Learn tab.
 */

const EMPTY_COLLECTION: Map<string, Set<string>> = new Map();

export default function CollectionScreen() {
  const router = useRouter();
  const { t, locale } = useT();
  const meta = useMetaLookup();
  const bottomClearance = useBottomSafeClearance();
  const ideaCards = useIdeaCards();
  const collected = useCollectedIdeas();

  const [dimFilter, setDimFilter] = useState<DimensionId | null>(null);
  const ideaLocale: IdeaLocale = locale === 'pt' ? 'pt' : 'en';

  const collectedMap = collected.data ?? EMPTY_COLLECTION;

  // Absorbed cards, newest material first, ideas in reading order inside it.
  // The query already orders this way; sorting again is cheap and keeps the
  // screen honest if the hook's ordering ever changes.
  const mine = useMemo<IdeaCardData[]>(() => {
    const rows = (ideaCards.data ?? []).filter((r) =>
      collectedMap.get(r.material_id)?.has(r.idea_id),
    );
    rows.sort((a, b) => {
      const byRelease =
        new Date(b.released_at).getTime() - new Date(a.released_at).getTime();
      return byRelease !== 0 ? byRelease : a.ordinal - b.ordinal;
    });
    return rows.map(toCardDataFromPublic);
  }, [ideaCards.data, collectedMap]);

  // Only dimensions that actually hold an absorbed idea get a pill.
  const dims = useMemo(() => {
    const present = new Set(mine.map((c) => c.dimensionId));
    return DIMENSION_ORDER.filter((d) => present.has(d));
  }, [mine]);

  // A filter pointing at a dimension with no cards (a re-cut dropped its last
  // idea) silently falls back to "Todas" instead of showing an empty grid.
  const activeDim = dimFilter && dims.includes(dimFilter) ? dimFilter : null;
  const visible = useMemo(
    () => (activeDim ? mine.filter((c) => c.dimensionId === activeDim) : mine),
    [mine, activeDim],
  );

  const onOpen = useCallback(
    (card: IdeaCardData) => {
      Haptics.selectionAsync().catch(() => {});
      router.push({
        pathname: '/idea/[slug]',
        params: { slug: card.slug, idea: String(card.ordinal) },
      });
    },
    [router],
  );

  const selectDim = (dim: DimensionId | null) => {
    Haptics.selectionAsync().catch(() => {});
    setDimFilter(dim);
  };

  const loading = ideaCards.isLoading || collected.isLoading;
  const failed = ideaCards.isError || collected.isError;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenBackground withGoldHalo>
        {/* Header — back chevron + title with the count underneath. */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Ionicons name="chevron-back" size={22} color={tokens.text.hi} />
          </Pressable>
          <View style={styles.titleCol}>
            <Text style={styles.title} numberOfLines={1}>
              {t('learning.ideas.myIdeas')}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {t('learning.ideas.myIdeasCount', { count: mine.length })}
            </Text>
          </View>
        </View>

        {/* Dimension pills — "Todas" + one per dimension with a card. */}
        {dims.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            // flexGrow 0: a ScrollView defaults to flexGrow 1 and would
            // otherwise split the column with the grid below it.
            style={styles.pillScroll}
            contentContainerStyle={styles.pillRow}
          >
            <DimPill
              label={t('learning.ideas.allDims')}
              accent={tokens.brand.violet2}
              active={activeDim === null}
              onPress={() => selectDim(null)}
            />
            {dims.map((dimId) => {
              const dim = meta.dim(dimId);
              return (
                <DimPill
                  key={dimId}
                  label={dim.label}
                  iconName={dim.iconName as keyof typeof Ionicons.glyphMap}
                  accent={DIMENSION_META[dimId].color}
                  active={activeDim === dimId}
                  onPress={() => selectDim(dimId)}
                />
              );
            })}
          </ScrollView>
        )}

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={tokens.brand.violet2} />
          </View>
        ) : failed ? (
          <View style={styles.centerBox}>
            <Ionicons name="cloud-offline-outline" size={36} color={tokens.text.dim} />
            <Text style={styles.emptyText}>{t('learning.reels.loadError')}</Text>
            <Pressable
              onPress={() => {
                ideaCards.refetch();
                collected.refetch();
              }}
              style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.8 }]}
              accessibilityRole="button"
            >
              <Text style={styles.retryText}>{t('learning.reels.retry')}</Text>
            </Pressable>
          </View>
        ) : (
          <CollectionGrid
            cards={visible}
            locale={ideaLocale}
            onOpen={onOpen}
            paddingBottom={bottomClearance}
            ListEmptyComponent={
              <View style={styles.centerBox}>
                <Ionicons name="albums-outline" size={36} color={tokens.text.dim} />
                <Text style={styles.emptyText}>{t('learning.ideas.myIdeasEmpty')}</Text>
              </View>
            }
          />
        )}
      </ScreenBackground>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dimension pill — same vocabulary as the Learn tab's active-filter chip:
// tinted fill + solid rim in the dimension color when selected.
// ─────────────────────────────────────────────────────────────────────────────

interface DimPillProps {
  label: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  accent: string;
  active: boolean;
  onPress: () => void;
}

function DimPill({ label, iconName, accent, active, onPress }: DimPillProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.pill,
        active && { backgroundColor: accent + '22', borderColor: accent },
        pressed && { opacity: 0.8 },
      ]}
    >
      {iconName && (
        <Ionicons name={iconName} size={13} color={active ? accent : tokens.text.mid} />
      )}
      <Text style={[styles.pillText, active && { color: accent }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[2],
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.surface,
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...tokens.type.h3,
    color: tokens.text.hi,
  },
  subtitle: {
    ...tokens.type.caption,
    color: tokens.semantic.coinLight,
    marginTop: 1,
  },
  pillScroll: {
    flexGrow: 0,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[2],
    paddingBottom: tokens.space[1],
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.border.strong,
    backgroundColor: tokens.bg.glass,
  },
  pillText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    letterSpacing: 0.2,
    color: tokens.text.mid,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: tokens.space[8],
    paddingHorizontal: tokens.space[6],
  },
  emptyText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: tokens.text.dim,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: tokens.space[2],
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: tokens.radius.pill,
    backgroundColor: 'rgba(123, 92, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(123, 92, 255, 0.42)',
  },
  retryText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: tokens.brand.violet2,
  },
});
