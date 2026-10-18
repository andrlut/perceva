import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  TRAIN_SESSION_SIZE,
  useIdeaTraining,
} from '@/lib/ideaTraining';
import { toCardDataFromPublic, type IdeaCardData, type IdeaLocale } from '@/lib/ideas';
import { formatCompactDate } from '@/lib/time';
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
 * The first answer of each card goes to `train_idea`, which owns the
 * schedule (hit → 3 / 7 / 21 days, then firm every 60; miss → tomorrow). A
 * missed card also comes back at the end of THIS session, up to
 * TRAIN_MAX_RETURNS times, so the session ends on a recall instead of a
 * miss — those replays stay local, the server already has the day's answer.
 *
 * The deck is frozen when the screen opens: each answer refetches the
 * reviews and drops the idea from "due", and the session must not reshuffle
 * under the reader's thumb. Five per session; "Mais 5" deals the next five
 * of the same frozen order. Nothing here pays XP or coins.
 */

const MAX_CARD_W = 340;
/** A tap before this does not flip: it asks the reader to try first. */
const ARM_MS = 900;

interface DeckCard {
  key: string;
  card: IdeaCardData;
  kicker: string;
}

interface Turn {
  key: string;
  /** 0 = first sighting this session; n = the n-th replay after a miss. */
  sighting: number;
}

function dateFromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default function IdeaTrainScreen() {
  const router = useRouter();
  const { t, locale } = useT();
  const bottomClearance = useBottomSafeClearance();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const ideaLocale: IdeaLocale = locale === 'pt' ? 'pt' : 'en';
  const { due, favorites, firm, nextDue, titles, loading, failed, retry } =
    useIdeaTraining(ideaLocale);
  const { mutate: trainIdea } = useTrainIdea();

  // Frozen once, when the first due list lands.
  const deckRef = useRef<DeckCard[] | null>(null);
  if (deckRef.current === null && !loading && !failed) {
    deckRef.current = due.map((a) => ({
      key: reviewKey(a.row.material_id, a.row.idea_id),
      card: toCardDataFromPublic(a.row),
      kicker: titles.get(a.row.material_id) ?? '',
    }));
  }
  const deck = deckRef.current;
  const byKey = useMemo(() => new Map((deck ?? []).map((d) => [d.key, d])), [deck]);

  const [offset, setOffset] = useState(0);
  const sessionKeys = useMemo(
    () => (deck ?? []).slice(offset, offset + TRAIN_SESSION_SIZE).map((d) => d.key),
    [deck, offset],
  );
  const [queue, setQueue] = useState<Turn[]>([]);
  /** key → was the FIRST answer this session "Lembrei". */
  const [firstAnswers, setFirstAnswers] = useState<Map<string, boolean>>(new Map());
  const [returns, setReturns] = useState<Map<string, number>>(new Map());

  // (Re)deal whenever a session starts: on open and on "Mais 5". Done during
  // render (not in an effect) so no frame ever sees a dealt session with an
  // empty queue — that frame would flash the "Treino feito" screen.
  const sessionId = `${offset}:${sessionKeys.join(',')}`;
  const [dealtId, setDealtId] = useState('');
  if (dealtId !== sessionId) {
    setDealtId(sessionId);
    setQueue(sessionKeys.map((key) => ({ key, sighting: 0 })));
    setFirstAnswers(new Map());
    setReturns(new Map());
  }

  const turn = queue[0] ?? null;
  const current = turn ? byKey.get(turn.key) ?? null : null;
  const turnId = turn ? `${turn.key}:${turn.sighting}` : 'none';

  const [flipped, setFlipped] = useState(false);
  const [armed, setArmed] = useState(false);
  const [nudged, setNudged] = useState(false);
  useEffect(() => {
    setFlipped(false);
    setArmed(false);
    setNudged(false);
    const id = setTimeout(() => setArmed(true), ARM_MS);
    return () => clearTimeout(id);
  }, [turnId]);

  const answer = useCallback(
    (remembered: boolean) => {
      if (!turn || !current) return;
      Haptics.impactAsync(
        remembered ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Soft,
      ).catch(() => {});
      if (!firstAnswers.has(turn.key)) {
        trainIdea({ slug: current.card.slug, ideaId: current.card.id, remembered });
        setFirstAnswers((prev) => new Map(prev).set(turn.key, remembered));
      }
      const used = returns.get(turn.key) ?? 0;
      const replay = !remembered && used < TRAIN_MAX_RETURNS;
      if (replay) setReturns((prev) => new Map(prev).set(turn.key, used + 1));
      setQueue((prev) => {
        const rest = prev.slice(1);
        return replay ? [...rest, { key: turn.key, sighting: turn.sighting + 1 }] : rest;
      });
    },
    [turn, current, firstAnswers, returns, trainIdea],
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

  const total = sessionKeys.length;
  const pendingKeys = new Set(queue.map((q) => q.key));
  const doneCount = sessionKeys.filter((k) => !pendingKeys.has(k)).length;
  const finished = deck !== null && total > 0 && dealtId === sessionId && queue.length === 0;
  const remainingAfter = deck ? Math.max(0, deck.length - (offset + total)) : 0;
  const firstTry = [...firstAnswers.values()].filter(Boolean).length;

  // The card fits the width AND the height left by the header, the hint and
  // the answer row, so the buttons never fall under the fold on short phones.
  const cardW = Math.max(
    200,
    Math.min(MAX_CARD_W, screenW - 2 * tokens.space[6], (screenH - 330) / 1.25),
  );

  const caughtUp = deck !== null && deck.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenBackground>
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
              {t('learning.ideas.train.title')}
            </Text>
            {total > 0 && !finished ? (
              <Text style={styles.subtitle}>
                {t('learning.ideas.train.counter', {
                  n: Math.min(doneCount + 1, total),
                  total,
                })}
              </Text>
            ) : null}
          </View>
          {/* The AI door: the same training, out loud, in the reader's own
              Claude through the connector. Renders nothing unless the
              shortcut is on (Ajustes › Conector). */}
          <ClaudeButton
            buttonKey="train"
            variant="bare"
            prompt={t('learning.ideas.train.claudePrompt')}
            a11yLabel={t('learning.ideas.train.askClaude')}
          />
        </View>

        {total > 0 && (
          <View style={styles.progress}>
            {sessionKeys.map((k) => (
              <View
                key={k}
                style={[
                  styles.segment,
                  !pendingKeys.has(k)
                    ? styles.segmentDone
                    : turn?.key === k
                    ? styles.segmentNow
                    : null,
                ]}
              />
            ))}
          </View>
        )}

        {failed && deck === null ? (
          <View style={styles.center}>
            <Ionicons name="cloud-offline-outline" size={36} color={tokens.text.dim} />
            <Text style={styles.empty}>{t('learning.reels.loadError')}</Text>
            <Pressable
              onPress={retry}
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryText}>{t('learning.reels.retry')}</Text>
            </Pressable>
          </View>
        ) : loading || deck === null ? (
          <View style={styles.center}>
            <ActivityIndicator color={tokens.brand.violet2} />
          </View>
        ) : caughtUp ? (
          <View style={styles.center}>
            {favorites === 0 ? (
              <>
                <Ionicons name="star-outline" size={36} color={tokens.text.dim} />
                <Text style={styles.empty}>{t('learning.ideas.train.emptyNone')}</Text>
              </>
            ) : (
              <>
                <View style={styles.ring}>
                  <Ionicons name="checkmark" size={30} color={tokens.semantic.coin} />
                </View>
                <Text style={styles.bigTitle}>{t('learning.ideas.train.caughtUpTitle')}</Text>
                {nextDue ? (
                  <Text style={styles.empty}>
                    {t('learning.ideas.train.caughtUpNext', {
                      date: formatCompactDate(dateFromKey(nextDue)),
                    })}
                  </Text>
                ) : null}
                <Text style={styles.empty}>
                  {t('learning.ideas.train.caughtUpFirm', { firm, total: favorites })}
                </Text>
              </>
            )}
          </View>
        ) : finished ? (
          <View style={[styles.center, { paddingBottom: bottomClearance }]}>
            <View style={styles.ring}>
              <Ionicons name="checkmark" size={30} color={tokens.semantic.coin} />
            </View>
            <Text style={styles.bigTitle}>{t('learning.ideas.train.doneTitle')}</Text>
            <View style={styles.tally}>
              <TallyRow label={t('learning.ideas.train.doneFirstTry')} value={`${firstTry} / ${total}`} />
              <TallyRow label={t('learning.ideas.train.doneTomorrow')} value={String(total - firstTry)} />
              <TallyRow label={t('learning.ideas.train.doneFirm')} value={String(firm)} />
            </View>
            {remainingAfter > 0 ? (
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setOffset((o) => o + TRAIN_SESSION_SIZE);
                }}
                style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
                accessibilityRole="button"
              >
                <Text style={styles.primaryText}>
                  {t('learning.ideas.train.more', { count: Math.min(remainingAfter, TRAIN_SESSION_SIZE) })}
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                remainingAfter > 0 ? styles.secondaryBtn : styles.primaryBtn,
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="button"
            >
              <Text style={remainingAfter > 0 ? styles.secondaryText : styles.primaryText}>
                {t('learning.ideas.train.back')}
              </Text>
            </Pressable>
          </View>
        ) : current ? (
          <View style={[styles.body, { paddingBottom: bottomClearance + tokens.space[3] }]}>
            <View style={styles.cardWrap}>
              {/* Before the arm delay the card is disabled and this wrapper
                  catches the tap instead: no flip, just the ask to try. */}
              <Pressable
                disabled={armed}
                onPress={() => {
                  setNudged(true);
                  setArmed(true);
                }}
                accessible={false}
              >
                <IdeaCard
                  key={turnId}
                  data={current.card}
                  width={cardW}
                  locale={ideaLocale}
                  collected
                  quiet
                  kicker={current.kicker}
                  disabled={!armed}
                  onFirstFlip={() => setFlipped(true)}
                  onOpen={() => openIdea(current.card)}
                  openAffordance="corner"
                />
              </Pressable>
            </View>

            <Text style={[styles.hint, nudged && !flipped && styles.hintNudge]}>
              {flipped
                ? t('learning.ideas.train.check')
                : nudged
                ? t('learning.ideas.train.tryFirst')
                : t('learning.ideas.train.think')}
            </Text>

            <View style={[styles.answerRow, !flipped && styles.answerRowHidden]}>
              <Pressable
                disabled={!flipped}
                onPress={() => answer(false)}
                style={({ pressed }) => [styles.answerBtn, pressed && { opacity: 0.8 }]}
                accessibilityRole="button"
              >
                <Text style={styles.answerText}>{t('learning.ideas.train.forgot')}</Text>
              </Pressable>
              <Pressable
                disabled={!flipped}
                onPress={() => answer(true)}
                style={({ pressed }) => [
                  styles.answerBtn,
                  styles.answerBtnPrimary,
                  pressed && { opacity: 0.85 },
                ]}
                accessibilityRole="button"
              >
                <Text style={[styles.answerText, styles.answerTextPrimary]}>
                  {t('learning.ideas.train.remembered')}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScreenBackground>
    </SafeAreaView>
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
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: tokens.bg.surface2,
  },
  segmentDone: { backgroundColor: tokens.semantic.coin },
  segmentNow: { backgroundColor: tokens.semantic.coinLight },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space[4],
    paddingHorizontal: tokens.space[6],
  },
  cardWrap: { alignItems: 'center' },
  hint: {
    ...tokens.type.body,
    color: tokens.text.mid,
    textAlign: 'center',
    minHeight: 40,
  },
  hintNudge: { color: tokens.semantic.coinLight },
  answerRow: {
    flexDirection: 'row',
    gap: tokens.space[3],
    alignSelf: 'stretch',
  },
  // Kept in the layout (not unmounted) so the card does not jump when the
  // buttons appear after the flip.
  answerRowHidden: { opacity: 0 },
  answerBtn: {
    flex: 1,
    minHeight: 50,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.strong,
  },
  answerBtnPrimary: {
    backgroundColor: tokens.brand.violet,
    borderColor: tokens.brand.violet,
  },
  answerText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    color: tokens.text.hi,
  },
  answerTextPrimary: { color: '#FFFFFF' },
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
  empty: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    color: tokens.text.mid,
    textAlign: 'center',
  },
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
  primaryBtn: {
    alignSelf: 'stretch',
    minHeight: 50,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.semantic.coin,
  },
  primaryText: { fontFamily: 'Manrope_700Bold', fontSize: 15, color: '#3D2A00' },
  secondaryBtn: {
    alignSelf: 'stretch',
    minHeight: 50,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.surface,
    borderWidth: 1,
    borderColor: tokens.border.strong,
  },
  secondaryText: { fontFamily: 'Manrope_700Bold', fontSize: 15, color: tokens.text.hi },
});
