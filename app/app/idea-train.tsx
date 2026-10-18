import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBottomSafeClearance } from '@/components/BottomNavBar';
import { ClaudeButton } from '@/components/ClaudeButton';
import { IdeaCard } from '@/components/ideas/IdeaCard';
import { ScreenBackground } from '@/components/ScreenBackground';
import { reviewKey, useTrainIdea } from '@/lib/api/learning';
import { useT } from '@/lib/i18n';
import {
  TRAIN_MAX_RETURNS,
  TRAIN_MIN_FAVORITES,
  TRAIN_SESSION_SIZE,
  useIdeaTraining,
} from '@/lib/ideaTraining';
import {
  IDEA_IMAGE_ASPECT,
  toCardDataFromPublic,
  type IdeaCardData,
  type IdeaLocale,
} from '@/lib/ideas';
import { PREMIUM_LEARN_ENABLED, useIsPremium } from '@/lib/premium';
import { tokens } from '@/theme';

/**
 * "Treino do dia" — spaced recall over the reader's favorite ideas.
 *
 * One card at a time, front up (image + title). The reader tries to recall
 * the answer in their head, flips, compares with the back (the claim) and
 * says whether they remembered. That attempt BEFORE the flip is the whole
 * point: flipping with no try is rereading, which feels like learning and
 * isn't. A tap in the first second does not flip; it asks for the try.
 *
 * Training is open WHENEVER the reader wants: the deck is every favorite,
 * the due ones first, then what comes due soonest (lib/ideaTraining). A card
 * that is not due yet is extra practice — the server ignores an early hit
 * and brings a miss back tomorrow, so practising early never breaks the
 * schedule. Below TRAIN_MIN_FAVORITES the screen asks for more favorites
 * instead, pointing at the review pile, at Explorar or — free tier with
 * nothing left open — at the full catalog.
 *
 * The first answer of each card goes to `train_idea`, which owns the
 * schedule (hit → 3 / 7 / 21 days, then firm every 60; miss → tomorrow). A
 * missed card also comes back at the end of THIS session, up to
 * TRAIN_MAX_RETURNS times, so the session ends on a recall instead of a
 * miss — those replays stay local, the server already has the day's answer.
 *
 * The deck is frozen when the training starts (an answer moves the idea,
 * and the session must not reshuffle under the reader's thumb). Each
 * session is its own component keyed by its offset, and each card its own
 * component keyed by its turn, so dealing and per-card state start fresh by
 * construction. Nothing here pays XP or coins.
 */

const MAX_CARD_W = 340;
/** A tap before this does not flip: it asks the reader to try first. */
const ARM_MS = 900;
/** Height the header, progress, hint and answer row take around the card. */
const CHROME_H = 330;

interface DeckCard {
  key: string;
  card: IdeaCardData;
  kicker: string;
  /** Due today; otherwise the card is extra practice. */
  due: boolean;
}

interface Turn {
  deck: DeckCard;
  /** 0 = first sighting this session; n = the n-th replay after a miss. */
  sighting: number;
}

type UnlockPath = '/idea-review' | '/reels' | '/premium?source=learn';

export default function IdeaTrainScreen() {
  const router = useRouter();
  const { t, locale } = useT();
  const ideaLocale: IdeaLocale = locale === 'pt' ? 'pt' : 'en';
  const {
    deck: liveDeck,
    favorites,
    firm,
    pending,
    toAbsorb,
    titles,
    loading,
    failed,
    retry,
  } = useIdeaTraining(ideaLocale);
  const isPremium = useIsPremium();

  // Frozen once the deck lands with enough favorites to train. Below that
  // the screen follows the live count, so coming back from the review pile
  // shows the progress (and opens the training once it reaches the bar).
  const deckRef = useRef<DeckCard[] | null>(null);
  if (deckRef.current === null && !loading && !failed && favorites >= TRAIN_MIN_FAVORITES) {
    deckRef.current = liveDeck.map(({ absorbed: a, due }) => ({
      key: reviewKey(a.row.material_id, a.row.idea_id),
      card: toCardDataFromPublic(a.row),
      kicker: titles.get(a.row.material_id) ?? '',
      due,
    }));
  }
  const deck = deckRef.current;
  const [offset, setOffset] = useState(0);

  const back = useCallback(() => router.back(), [router]);
  const go = useCallback(
    (path: UnlockPath) => {
      Haptics.selectionAsync().catch(() => {});
      router.push(path);
    },
    [router],
  );

  if (deck !== null && deck.length > 0) {
    const cards = deck.slice(offset, offset + TRAIN_SESSION_SIZE);
    return (
      <Shell>
        <TrainSession
          key={offset}
          cards={cards}
          remainingAfter={Math.max(0, deck.length - (offset + cards.length))}
          firm={firm}
          locale={ideaLocale}
          onMore={() => setOffset((o) => o + TRAIN_SESSION_SIZE)}
          onBack={back}
        />
      </Shell>
    );
  }

  let body: React.ReactNode;
  if (failed) {
    body = (
      <>
        <Ionicons name="cloud-offline-outline" size={36} color={tokens.text.dim} />
        <Text style={styles.muted}>{t('learning.reels.loadError')}</Text>
        <Pressable
          onPress={retry}
          style={({ pressed }) => [styles.btn, styles.btnWide, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.btnText}>{t('learning.reels.retry')}</Text>
        </Pressable>
      </>
    );
  } else if (loading) {
    body = <ActivityIndicator color={tokens.brand.violet2} />;
  } else {
    // Not enough favorites yet: show the way to more. The review pile first
    // (absorbed, waiting for a decision), then Explorar (open ideas not yet
    // absorbed). With neither, a free reader has used up the 30-day window:
    // the full catalog is the Premium; for anyone else, new ideas arrive
    // every week.
    const missing = Math.max(0, TRAIN_MIN_FAVORITES - favorites);
    const nothingLeft = pending.length === 0 && toAbsorb === 0;
    const showPremium = nothingLeft && !isPremium && PREMIUM_LEARN_ENABLED;
    body = (
      <>
        <View style={styles.ring}>
          <Ionicons name="star" size={28} color={tokens.semantic.coin} />
        </View>
        <Text style={styles.bigTitle}>{t('learning.ideas.train.unlockTitle')}</Text>
        <Text style={styles.muted}>
          {t('learning.ideas.train.unlockBody', { min: TRAIN_MIN_FAVORITES })}
        </Text>
        <View style={styles.unlockBar}>
          {Array.from({ length: TRAIN_MIN_FAVORITES }, (_, i) => (
            <View key={i} style={[styles.segment, i < favorites && styles.segmentDone]} />
          ))}
        </View>
        <Text style={styles.unlockCount}>
          {t('learning.ideas.train.unlockCount', { count: favorites, min: TRAIN_MIN_FAVORITES })}
        </Text>
        {pending.length > 0 ? (
          <UnlockButton
            label={t('learning.ideas.train.unlockReview', { count: pending.length })}
            primary
            onPress={() => go('/idea-review')}
          />
        ) : null}
        {toAbsorb > 0 ? (
          <UnlockButton
            label={t('learning.ideas.train.unlockExplore')}
            primary={pending.length === 0}
            onPress={() => go('/reels')}
          />
        ) : null}
        {showPremium ? (
          <>
            <Text style={styles.muted}>
              {t('learning.ideas.train.unlockFreeEnd', { count: missing })}
            </Text>
            <UnlockButton
              label={t('learning.ideas.train.unlockPremium')}
              primary
              onPress={() => go('/premium?source=learn')}
            />
          </>
        ) : nothingLeft ? (
          <Text style={styles.muted}>{t('learning.ideas.train.unlockWait')}</Text>
        ) : null}
      </>
    );
  }

  return (
    <Shell>
      <TopBar onBack={back} />
      <View style={styles.center}>{body}</View>
    </Shell>
  );
}

function UnlockButton({
  label,
  primary,
  onPress,
}: {
  label: string;
  primary?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        styles.btnWide,
        primary && styles.btnGold,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
    >
      <Text style={[styles.btnText, primary && styles.btnTextGold]}>{label}</Text>
    </Pressable>
  );
}

// ─── Session: five cards, the replay queue, the tally ────────────────────────

function TrainSession({
  cards,
  remainingAfter,
  firm,
  locale,
  onMore,
  onBack,
}: {
  cards: DeckCard[];
  remainingAfter: number;
  firm: number;
  locale: IdeaLocale;
  onMore: () => void;
  onBack: () => void;
}) {
  const { t } = useT();
  const router = useRouter();
  const bottomClearance = useBottomSafeClearance();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const { mutateAsync: trainIdea } = useTrainIdea();

  const [queue, setQueue] = useState<Turn[]>(() => cards.map((deck) => ({ deck, sighting: 0 })));
  const [firstSeen, setFirstSeen] = useState(0);
  const [firstTry, setFirstTry] = useState(0);
  /** Answers the server took but did not count (already trained today). */
  const [alreadyToday, setAlreadyToday] = useState(0);
  const [unsaved, setUnsaved] = useState(0);

  const turn = queue[0] ?? null;
  const total = cards.length;
  const pending = new Set(queue.map((q) => q.deck.key));

  const answer = useCallback(
    (remembered: boolean) => {
      if (!turn) return;
      Haptics.impactAsync(
        remembered ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Soft,
      ).catch(() => {});
      if (turn.sighting === 0) {
        setFirstSeen((n) => n + 1);
        if (remembered) setFirstTry((n) => n + 1);
        // mutateAsync, not mutate: mutate's per-call callbacks only fire for
        // the latest call, and answers can overlap on a slow connection.
        trainIdea({
          slug: turn.deck.card.slug,
          ideaId: turn.deck.card.id,
          materialId: turn.deck.card.materialId,
          remembered,
        })
          .then((r) => {
            if (r.reason === 'already_trained_today') setAlreadyToday((n) => n + 1);
          })
          .catch(() => setUnsaved((n) => n + 1));
      }
      const replay = !remembered && turn.sighting < TRAIN_MAX_RETURNS;
      setQueue((prev) => {
        const rest = prev.slice(1);
        return replay ? [...rest, { deck: turn.deck, sighting: turn.sighting + 1 }] : rest;
      });
    },
    [turn, trainIdea],
  );

  const openIdea = useCallback(
    (card: IdeaCardData) => {
      Haptics.selectionAsync().catch(() => {});
      router.push({
        pathname: '/idea/[slug]',
        params: { slug: card.slug, idea: String(card.ordinal) },
      });
    },
    [router],
  );

  // The card fits the width AND the height left by the chrome, so the
  // answer row never falls under the fold on short phones.
  const cardW = Math.max(
    200,
    Math.min(MAX_CARD_W, screenW - 2 * tokens.space[6], (screenH - CHROME_H) * IDEA_IMAGE_ASPECT),
  );

  const subtitle = !turn
    ? undefined
    : turn.sighting > 0
    ? t('learning.ideas.train.again')
    : t(turn.deck.due ? 'learning.ideas.train.counter' : 'learning.ideas.train.counterExtra', {
        n: Math.min(firstSeen + 1, total),
        total,
      });

  return (
    <>
      <TopBar onBack={onBack} subtitle={subtitle} />
      <View style={styles.progress}>
        {cards.map((c) => (
          <View
            key={c.key}
            style={[
              styles.segment,
              !pending.has(c.key)
                ? styles.segmentDone
                : turn?.deck.key === c.key
                ? styles.segmentNow
                : null,
            ]}
          />
        ))}
      </View>

      {turn ? (
        <TrainTurn
          key={`${turn.deck.key}:${turn.sighting}`}
          deck={turn.deck}
          cardW={cardW}
          locale={locale}
          bottomPad={bottomClearance + tokens.space[3]}
          onAnswer={answer}
          onOpen={openIdea}
        />
      ) : (
        <View style={[styles.center, { paddingBottom: bottomClearance }]}>
          <DoneMark />
          <Text style={styles.bigTitle}>{t('learning.ideas.train.doneTitle')}</Text>
          <View style={styles.tally}>
            <TallyRow label={t('learning.ideas.train.doneFirstTry')} value={`${firstTry} / ${total}`} />
            <TallyRow label={t('learning.ideas.train.doneTomorrow')} value={String(total - firstTry)} />
            <TallyRow label={t('learning.ideas.train.doneFirm')} value={String(firm)} />
          </View>
          {alreadyToday > 0 ? (
            <Text style={styles.muted}>
              {t('learning.ideas.train.alreadyToday', { count: alreadyToday })}
            </Text>
          ) : null}
          {unsaved > 0 ? (
            <Text style={[styles.muted, styles.warn]}>
              {t('learning.ideas.train.unsaved', { count: unsaved })}
            </Text>
          ) : null}
          {remainingAfter > 0 ? (
            <Pressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onMore();
              }}
              style={({ pressed }) => [styles.btn, styles.btnWide, styles.btnGold, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={[styles.btnText, styles.btnTextGold]}>
                {t('learning.ideas.train.more', {
                  count: Math.min(remainingAfter, TRAIN_SESSION_SIZE),
                })}
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.btn,
              styles.btnWide,
              remainingAfter === 0 && styles.btnGold,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            <Text style={[styles.btnText, remainingAfter === 0 && styles.btnTextGold]}>
              {t('learning.ideas.train.back')}
            </Text>
          </Pressable>
        </View>
      )}
    </>
  );
}

// ─── Turn: one card, the try-first delay, the two answers ────────────────────

function TrainTurn({
  deck,
  cardW,
  locale,
  bottomPad,
  onAnswer,
  onOpen,
}: {
  deck: DeckCard;
  cardW: number;
  locale: IdeaLocale;
  bottomPad: number;
  onAnswer: (remembered: boolean) => void;
  onOpen: (card: IdeaCardData) => void;
}) {
  const { t } = useT();
  const [flipped, setFlipped] = useState(false);
  const [armed, setArmed] = useState(false);
  const [nudged, setNudged] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setArmed(true), ARM_MS);
    return () => clearTimeout(id);
  }, []);

  const onFirstFlip = useCallback(() => setFlipped(true), []);
  const open = useCallback(() => onOpen(deck.card), [onOpen, deck.card]);

  return (
    <View style={[styles.body, { paddingBottom: bottomPad }]}>
      {/* Before the arm delay the card is disabled (a disabled Pressable
          never claims the touch) and this wrapper catches the tap instead:
          no flip, just the ask to try first. */}
      <Pressable
        disabled={armed}
        onPress={() => {
          setNudged(true);
          setArmed(true);
        }}
        accessible={false}
      >
        <IdeaCard
          data={deck.card}
          width={cardW}
          locale={locale}
          collected
          quiet
          kicker={deck.kicker}
          disabled={!armed}
          onFirstFlip={onFirstFlip}
          onOpen={open}
          openAffordance="corner"
        />
      </Pressable>

      <Text style={[styles.hint, nudged && !flipped && styles.hintNudge]}>
        {flipped
          ? t('learning.ideas.train.check')
          : nudged
          ? t('learning.ideas.train.tryFirst')
          : t('learning.ideas.train.think')}
      </Text>

      {/* Kept in the layout (not unmounted) so the card does not jump when
          the answers appear after the flip. */}
      <View style={[styles.answerRow, !flipped && styles.hidden]}>
        <Pressable
          disabled={!flipped}
          onPress={() => onAnswer(false)}
          style={({ pressed }) => [styles.btn, styles.btnFlex, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.btnText}>{t('learning.ideas.train.forgot')}</Text>
        </Pressable>
        <Pressable
          disabled={!flipped}
          onPress={() => onAnswer(true)}
          style={({ pressed }) => [styles.btn, styles.btnFlex, styles.btnViolet, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={[styles.btnText, styles.btnTextLight]}>
            {t('learning.ideas.train.remembered')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenBackground>{children}</ScreenBackground>
    </SafeAreaView>
  );
}

function TopBar({ onBack, subtitle }: { onBack: () => void; subtitle?: string }) {
  const { t } = useT();
  return (
    <View style={styles.topBar}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
      >
        <Ionicons name="chevron-back" size={22} color={tokens.text.hi} />
      </Pressable>
      <View style={styles.titleCol}>
        <Text style={styles.title} numberOfLines={1}>
          {t('learning.ideas.train.title')}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {/* The AI door: the same training, out loud, in the reader's own
          Claude through the connector. Renders nothing unless the shortcut
          is on (Ajustes › Conector). */}
      <ClaudeButton
        buttonKey="train"
        variant="bare"
        prompt={t('learning.ideas.train.claudePrompt')}
        a11yLabel={t('learning.ideas.train.askClaude')}
      />
    </View>
  );
}

function DoneMark() {
  return (
    <View style={styles.ring}>
      <Ionicons name="checkmark" size={30} color={tokens.semantic.coin} />
    </View>
  );
}

function TallyRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tallyRow}>
      <Text style={styles.tallyLabel}>{label}</Text>
      <Text style={styles.tallyValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  pressed: { opacity: 0.8 },
  hidden: { opacity: 0 },
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
  titleCol: { flex: 1, minWidth: 0 },
  title: { ...tokens.type.h3, color: tokens.text.hi },
  subtitle: { ...tokens.type.caption, color: tokens.text.mid, marginTop: 1 },
  progress: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: tokens.space[4],
    paddingBottom: tokens.space[2],
  },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: tokens.bg.surface2 },
  segmentDone: { backgroundColor: tokens.semantic.coin },
  segmentNow: { backgroundColor: tokens.semantic.coinLight },
  unlockBar: { flexDirection: 'row', gap: 4, alignSelf: 'stretch', marginTop: tokens.space[2] },
  unlockCount: { ...tokens.type.caption, color: tokens.text.mid, marginBottom: tokens.space[2] },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space[4],
    paddingHorizontal: tokens.space[6],
  },
  hint: { ...tokens.type.body, color: tokens.text.mid, textAlign: 'center', minHeight: 40 },
  hintNudge: { color: tokens.semantic.coinLight },
  answerRow: { flexDirection: 'row', gap: tokens.space[3], alignSelf: 'stretch' },
  btn: {
    minHeight: 50,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.space[4],
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.strong,
  },
  btnFlex: { flex: 1 },
  btnWide: { alignSelf: 'stretch' },
  btnViolet: { backgroundColor: tokens.brand.violet, borderColor: tokens.brand.violet },
  btnGold: { backgroundColor: tokens.semantic.coin, borderColor: tokens.semantic.coin },
  btnText: { fontFamily: 'Manrope_700Bold', fontSize: 15, color: tokens.text.hi },
  btnTextLight: { color: '#FFFFFF' },
  btnTextGold: { color: '#3D2A00' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: tokens.space[6],
  },
  ring: {
    width: 72,
    height: 72,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 200, 61, 0.14)',
    borderWidth: 1.5,
    borderColor: tokens.semantic.coinRim,
    marginBottom: 4,
  },
  bigTitle: { ...tokens.type.h2, color: tokens.text.hi, textAlign: 'center' },
  muted: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: tokens.text.mid,
    textAlign: 'center',
  },
  warn: { color: tokens.semantic.warn },
  tally: { alignSelf: 'stretch', gap: 8, marginVertical: tokens.space[3] },
  tallyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[3],
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  tallyLabel: { ...tokens.type.body, color: tokens.text.base },
  tallyValue: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    color: tokens.text.hi,
    fontVariant: ['tabular-nums'],
  },
});
