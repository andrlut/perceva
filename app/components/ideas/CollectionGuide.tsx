import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { GuideLabel, GuideStep } from '@/components/guide/GuideStep';
import { FilterPill, IdeaSearchBox, ReviewStrip } from '@/components/ideas/CollectionControls';
import { IdeaCard } from '@/components/ideas/IdeaCard';
import type { ShelfCard } from '@/components/ideas/IdeaShelf';
import type { DimensionId } from '@/lib/db/types';
import { buildGuidePrompt, guideItems } from '@/lib/guide';
import { useT } from '@/lib/i18n';
import type { IdeaLocale } from '@/lib/ideas';
import { tokens } from '@/theme';
import { DIMENSION_META } from '@/theme/dimensions';

/**
 * The guide of "Minhas ideias" — what fills its (i) sheet. THE REFERENCE
 * for every screen's guide (docs/informativo-de-tela.md): the gestures
 * first, on a live element; then one GuideStep per thing on the screen,
 * each with a replica drawn by the screen's own components
 * (CollectionControls); the AI block closes the sheet (InfoSheet).
 *
 * Built on ONE ordered list of the screen's options, COLLECTION_GUIDE_ITEMS.
 * The sheet renders every key — tap and hold in the playground, the rest as
 * steps, each step typed by its key so a new key will not compile without
 * its row — and useCollectionGuidePrompt builds the AI prompt from the same
 * keys (lib/guide). An option is in both, or in neither.
 *
 * "Na carta" is a playground: a REAL card from the person's shelf (their
 * first favorite, else their first idea; a sample when the shelf is empty),
 * the same IdeaCard the screen draws. Tap flips it exactly as on the shelf
 * (reveal-only, no RPC), and holding it opens a replica of the card's menu
 * right here — the real menu is a sheet of its own and would stack on this
 * one. A pulsing hand sits on the card until the first try.
 */

/** i18n root of this guide: `<HELP>.items.<key>.{title,body,ai}`. */
const HELP = 'learning.ideas.help';

/**
 * Every option of "Minhas ideias", in the guide's order. Adding an option
 * = a key here + its item in both locales + its row (GESTURE_ICONS or the
 * `steps` record below, which the compiler holds to this list).
 */
export const COLLECTION_GUIDE_ITEMS = [
  'tap',
  'hold',
  'review',
  'favorites',
  'notes',
  'shelves',
  'search',
] as const;

type ItemKey = (typeof COLLECTION_GUIDE_ITEMS)[number];
type GestureKey = Extract<ItemKey, 'tap' | 'hold'>;
type StepKey = Exclude<ItemKey, GestureKey>;

const isGesture = (k: ItemKey): k is GestureKey => k === 'tap' || k === 'hold';

const GESTURE_ICONS: Record<GestureKey, keyof typeof Ionicons.glyphMap> = {
  tap: 'sync-outline',
  hold: 'finger-print-outline',
};

/** The AI door's prompt for this screen — every item, with its mechanics. */
export function useCollectionGuidePrompt(): string {
  const { t } = useT();
  return useMemo(
    () =>
      buildGuidePrompt(t, {
        screen: t(`${HELP}.screenName`),
        purpose: t(`${HELP}.purpose`),
        examples: t(`${HELP}.examples`),
        items: guideItems(t, HELP, COLLECTION_GUIDE_ITEMS),
      }),
    [t],
  );
}

/** Demo card width: a shelf card scaled down, still legible at 4:5. */
const DEMO_WIDTH = 116;

export interface CollectionGuideProps {
  /** A card from the person's shelf, or null for the sample. */
  demoCard: (ShelfCard & { favorite?: boolean }) | null;
  /** Pending reviews right now (the strip replica shows it; 0 → a sample). */
  pendingCount: number;
  /** The shelf the replica imitates — the demo card's dimension. */
  shelf: { dimensionId: DimensionId; label: string; count: number };
  locale: IdeaLocale;
}

export function CollectionGuide({ demoCard, pendingCount, shelf, locale }: CollectionGuideProps) {
  const { t } = useT();
  const [tried, setTried] = useState(false);
  const [menuShown, setMenuShown] = useState(false);

  const sampleTitle = t(`${HELP}.sampleTitle`);
  const sampleClaim = t(`${HELP}.sampleClaim`);
  const card = useMemo<ShelfCard & { favorite?: boolean }>(
    () =>
      demoCard ?? {
        id: 'guide-sample',
        materialId: 'guide-sample',
        slug: 'guide-sample',
        dimensionId: shelf.dimensionId,
        ordinal: 1,
        title: { pt: sampleTitle, en: sampleTitle },
        claim: { pt: sampleClaim, en: sampleClaim },
        imagePath: null,
        sourceLabel: null,
        note: null,
        favorite: false,
      },
    [demoCard, shelf.dimensionId, sampleTitle, sampleClaim],
  );

  // One row per step key; the Record type makes a missing row a compile error.
  const steps: Record<
    StepKey,
    { icon: keyof typeof Ionicons.glyphMap; iconColor?: string; replica: React.ReactNode }
  > = {
    review: {
      icon: 'layers-outline',
      replica: (
        <>
          <ReviewStrip count={pendingCount > 0 ? pendingCount : 3} />
          <SwipeHint />
        </>
      ),
    },
    favorites: {
      icon: 'star',
      iconColor: tokens.semantic.coin,
      replica: (
        <View style={styles.pills}>
          <FilterPill label={t('learning.ideas.review.onlyFavorites')} iconName="star" active />
          <FilterPill label={t('learning.ideas.review.showAll')} active={false} />
        </View>
      ),
    },
    notes: {
      icon: 'create-outline',
      replica: <NoteHint dimensionId={shelf.dimensionId} />,
    },
    shelves: {
      icon: 'albums-outline',
      replica: <ShelfHint {...shelf} />,
    },
    search: {
      icon: 'search',
      replica: <IdeaSearchBox value="" />,
    },
  };

  const gestureKeys = COLLECTION_GUIDE_ITEMS.filter(isGesture);
  const stepKeys = COLLECTION_GUIDE_ITEMS.filter((k): k is StepKey => !isGesture(k));

  return (
    <>
      <GuideLabel>{t(`${HELP}.cardLabel`)}</GuideLabel>
      <View style={styles.demo}>
        <View>
          <IdeaCard
            data={card}
            width={DEMO_WIDTH}
            locale={locale}
            collected
            quiet
            hasNote={(card.note ?? '').trim().length > 0}
            onFirstFlip={() => setTried(true)}
            onLongPress={() => {
              setTried(true);
              setMenuShown(true);
            }}
          />
          {!tried && <TapHint />}
        </View>
        <View style={styles.gestures}>
          <Text style={styles.tryIt}>{t(`${HELP}.tryIt`)}</Text>
          {gestureKeys.map((k) => (
            <Gesture
              key={k}
              icon={GESTURE_ICONS[k]}
              title={t(`${HELP}.items.${k}.title`)}
              body={t(`${HELP}.items.${k}.body`)}
            />
          ))}
        </View>
      </View>

      {menuShown && <MenuReplica favorite={card.favorite === true} hasNote={!!card.note} />}

      <GuideLabel>{t(`${HELP}.screenLabel`)}</GuideLabel>

      {stepKeys.map((k) => (
        <GuideStep
          key={k}
          icon={steps[k].icon}
          iconColor={steps[k].iconColor}
          title={t(`${HELP}.items.${k}.title`)}
          body={t(`${HELP}.items.${k}.body`)}
        >
          {steps[k].replica}
        </GuideStep>
      ))}
    </>
  );
}

/** One gesture beside the demo card: icon, verb, what it does. */
function Gesture({
  icon,
  title,
  body,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.gesture}>
      <Ionicons name={icon} size={16} color={tokens.brand.violet2} style={styles.gestureIcon} />
      <View style={styles.gestureCol}>
        <Text style={styles.gestureTitle}>{title}</Text>
        <Text style={styles.gestureBody}>{body}</Text>
      </View>
    </View>
  );
}

/** The hand that pulses on the demo card until the first try. Still under
 *  reduced motion. Never takes a touch — the card underneath does. */
function TapHint() {
  const reduce = useReducedMotion();
  const scale = useSharedValue(1);
  useEffect(() => {
    if (reduce) return;
    scale.value = withRepeat(
      withSequence(withTiming(1.18, { duration: 650 }), withTiming(1, { duration: 650 })),
      -1,
    );
    return () => cancelAnimation(scale);
  }, [reduce, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View pointerEvents="none" style={[styles.tapHint, style]}>
      <Ionicons name="hand-left" size={14} color={tokens.text.hi} />
    </Animated.View>
  );
}

/** The card's menu, as the hold opens it on the screen (IdeaActionSheet):
 *  same order, same icons, inert. */
function MenuReplica({ favorite, hasNote }: { favorite: boolean; hasNote: boolean }) {
  const { t } = useT();
  const rows: { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }[] = [
    {
      icon: 'create-outline',
      color: tokens.brand.violet2,
      label: hasNote ? t('learning.ideas.menu.editNote') : t('learning.ideas.menu.addNote'),
    },
    { icon: 'book-outline', color: tokens.brand.violet2, label: t('learning.ideas.menu.open') },
    {
      icon: favorite ? 'star' : 'star-outline',
      color: tokens.semantic.coin,
      label: favorite ? t('learning.ideas.menu.unfavorite') : t('learning.ideas.menu.favorite'),
    },
  ];
  return (
    <View style={styles.menu}>
      <Text style={styles.menuLabel}>{t('learning.ideas.help.menuLabel')}</Text>
      {rows.map((r) => (
        <View key={r.icon} style={styles.menuRow}>
          <View style={styles.menuIcon}>
            <Ionicons name={r.icon} size={15} color={r.color} />
          </View>
          <Text style={styles.menuText} numberOfLines={1}>
            {r.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** The review's two verdicts, as the stamps the drag shows on the card. */
function SwipeHint() {
  const { t } = useT();
  return (
    <View style={styles.swipe}>
      <View style={[styles.stamp, styles.stampRelease]}>
        <Ionicons name="arrow-back" size={12} color={tokens.text.mid} />
        <Ionicons name="leaf-outline" size={12} color={tokens.text.mid} />
        <Text style={[styles.stampText, { color: tokens.text.mid }]}>
          {t('learning.ideas.review.release')}
        </Text>
      </View>
      <View style={[styles.stamp, styles.stampKeep]}>
        <Ionicons name="star" size={12} color={tokens.brand.violet2} />
        <Text style={[styles.stampText, { color: tokens.brand.violet2 }]}>
          {t('learning.ideas.review.keep')}
        </Text>
        <Ionicons name="arrow-forward" size={12} color={tokens.brand.violet2} />
      </View>
    </View>
  );
}

/** A shelf card's corner with the note mark — the same 20px dark-glass
 *  pencil IdeaCard draws. */
function NoteHint({ dimensionId }: { dimensionId: DimensionId }) {
  const color = DIMENSION_META[dimensionId].color;
  return (
    <View style={[styles.thumb, { backgroundColor: color + '2E', borderColor: color + '66' }]}>
      <View style={styles.noteMark}>
        <Ionicons name="create" size={11} color="rgba(255, 255, 255, 0.92)" />
      </View>
    </View>
  );
}

/** A shelf: its header as IdeaShelf draws it, over a row of card stubs the
 *  edge cuts off — the same "it scrolls" cue the real row gives. */
function ShelfHint({
  dimensionId,
  label,
  count,
}: {
  dimensionId: DimensionId;
  label: string;
  count: number;
}) {
  const dim = DIMENSION_META[dimensionId];
  return (
    <View style={styles.shelf}>
      <View style={styles.shelfHeader}>
        <Ionicons
          name={dim.iconName as keyof typeof Ionicons.glyphMap}
          size={14}
          color={dim.color}
        />
        <Text style={styles.shelfLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.shelfCount}>{count}</Text>
      </View>
      <View style={styles.shelfRow}>
        {Array.from({ length: 7 }, (_, i) => (
          <View
            key={i}
            style={[styles.thumb, { backgroundColor: dim.color + '2E', borderColor: dim.color + '59' }]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // The playground: a tinted box so it reads as "try here", not as text.
  demo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[3],
    padding: tokens.space[3],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(155, 130, 255, 0.35)',
    backgroundColor: 'rgba(123, 92, 255, 0.07)',
  },
  gestures: { flex: 1, minWidth: 0, gap: 10 },
  tryIt: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    letterSpacing: 0.3,
    color: tokens.brand.violet2,
  },
  gesture: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  gestureIcon: { marginTop: 1 },
  gestureCol: { flex: 1, minWidth: 0, gap: 1 },
  gestureTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 13,
    color: tokens.text.hi,
  },
  gestureBody: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 17,
    color: tokens.text.base,
  },
  tapHint: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.brand.violet,
    borderWidth: 2,
    borderColor: tokens.bg.surface,
  },

  menu: {
    gap: 6,
    padding: tokens.space[3],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.border.base,
    backgroundColor: tokens.bg.surface2,
  },
  menuLabel: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: tokens.text.mid,
    marginBottom: 2,
  },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(123, 92, 255, 0.12)',
  },
  menuText: {
    flex: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.text.hi,
  },

  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  swipe: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  stamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: tokens.radius.sm,
    borderWidth: 1.5,
  },
  stampRelease: {
    transform: [{ rotateZ: '-5deg' }],
    backgroundColor: tokens.bg.surface2,
    borderColor: tokens.text.mid,
  },
  stampKeep: {
    transform: [{ rotateZ: '5deg' }],
    backgroundColor: 'rgba(123, 92, 255, 0.22)',
    borderColor: tokens.brand.violet2,
  },
  stampText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
  },

  thumb: {
    width: 44,
    height: 55,
    borderRadius: 8,
    borderWidth: 1,
  },
  noteMark: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    width: 20,
    height: 20,
    borderRadius: tokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(6, 8, 30, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },

  shelf: { gap: 6 },
  shelfHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shelfLabel: {
    flexShrink: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.text.hi,
  },
  shelfCount: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    color: tokens.text.dim,
  },
  shelfRow: { flexDirection: 'row', gap: 8, overflow: 'hidden' },
});
