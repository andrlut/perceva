import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IdeaListRow } from '@/components/ideas/IdeaListRow';
import { IdeaRail } from '@/components/ideas/IdeaRail';
import { LearningBody } from '@/components/LearningBody';
import { AudioPane } from '@/components/learning/AudioPane';
import { FeedbackSheet } from '@/components/learning/FeedbackSheet';
import { MaterialCover } from '@/components/MaterialCover';
import { ScreenBackground } from '@/components/ScreenBackground';
import {
  type LearningMaterialDetail,
  useCollectedIdeas,
  useMyMaterialFeedback,
  useRateMaterial,
  useReadMaterialIds,
} from '@/lib/api/learning';
import type { LearningMaterialType } from '@/lib/db/types';
import { useT, type TranslateOptions } from '@/lib/i18n';
import { useMetaLookup } from '@/lib/i18n/meta';
import type { IdeaLocale } from '@/lib/ideas';
import { ideaProgress, localizedIdea, nextIdea, sortedIdeas } from '@/lib/ideas';
import { learningMediaUrl, pickMedia } from '@/lib/learningMedia';
import { xpForMaterial } from '@/lib/learningXp';
import { ACTIVE_THEME, tokens } from '@/theme';
import { SUB_META } from '@/theme/dimensions';
import { alpha } from '@/theme/skillTiers';

/**
 * Detail screen for a material that carries `ideas` (Recanto em ideias).
 * Materials WITHOUT ideas keep `MaterialMediaScreen` byte-for-byte; the
 * route in `app/material/[slug].tsx` dispatches between the two.
 *
 * Top to bottom: hero → title/summary → "Ideias · 1 de 3 absorvidas" →
 * the card rail (reveal-only flips) → one row per idea → the deep-dive
 * audio row (mounts `AudioPane` once, keeps it alive) → "Ler o texto
 * completo" (collapsed) → dimension/subs, source, feedback. A sticky CTA
 * opens the next idea to absorb.
 *
 * Hero (Deepstash-style, 2026-09-08): when the material has a real cover
 * (`hero_image_url`), this screen shows it as a full-bleed PORTRAIT hero —
 * the covers are 2:3 (768×1152) and the shared 220px landscape banner in
 * `MaterialCover variant="hero"` cropped most of the art away top and
 * bottom. The hero is window-wide, `width / HERO_ASPECT` tall (capped at
 * `HERO_MAX_VH` of the window so short phones keep the title above the
 * fold), and melts into the page through a bottom fade to `tokens.bg.deep`
 * over its last `HERO_FADE` share. No rounded corners on purpose.
 *
 * The maintainer is undecided on this one ("tô em dúvida"), so the change
 * is deliberately cheap to walk back: the old banner path is still here
 * behind the `hero_image_url == null` check (generated covers render
 * exactly as before), and the shape is a single tunable `HERO_ASPECT`.
 * `MaterialMediaScreen` / `MaterialCover` are untouched.
 *
 * Nothing here writes: absorbing happens on the idea screen (the card at
 * the end), and finishing the material is the server's job inside
 * `collect_idea`. So no `useMarkMaterialRead`, no reading-progress store,
 * no "Concluir" button — progress is derived from `useCollectedIdeas()`.
 */

/**
 * Hero width:height. 4/5 shows (almost) the whole 2:3 cover with a thin
 * crop top and bottom; 2/3 would show it entirely, 1 would be square.
 * Tune this one number — everything else derives from it.
 */
const HERO_ASPECT = 4 / 5;
/** Hard cap on the hero height as a share of the window height. */
const HERO_MAX_VH = 0.58;
/** Share of the hero (from the bottom) covered by the fade into the page. */
const HERO_FADE = 0.35;

type Translator = (key: string, options?: TranslateOptions) => string;

function typeLabel(type: LearningMaterialType, t: Translator): string {
  return t(`learning.type.${type}`);
}

interface Props {
  detail: LearningMaterialDetail;
}

export function IdeasMaterialScreen({ detail: m }: Props) {
  const router = useRouter();
  const { t, locale: appLocale } = useT();
  const locale: IdeaLocale = appLocale === 'pt' ? 'pt' : 'en';
  const meta = useMetaLookup();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const heroHeight = Math.round(
    Math.min(windowWidth / HERO_ASPECT, windowHeight * HERO_MAX_VH),
  );

  const reads = useReadMaterialIds();
  const collectedQuery = useCollectedIdeas();
  const myFeedback = useMyMaterialFeedback(m.slug);
  const rateMaterial = useRateMaterial();

  const [feedbackSheetOpen, setFeedbackSheetOpen] = useState(false);
  const [sheetRating, setSheetRating] = useState<-1 | 1 | null>(null);
  // Player mounts on the first tap of the deep-dive row and stays mounted
  // (hidden) afterwards so collapsing the row never interrupts playback.
  const [audioMounted, setAudioMounted] = useState(false);
  const [audioVisible, setAudioVisible] = useState(false);
  const [textOpen, setTextOpen] = useState(false);

  // ── Ideas + progress ─────────────────────────────────────────────────────
  const ideas = useMemo(() => sortedIdeas(m.ideas ?? []), [m.ideas]);
  const collectedSet = collectedQuery.data?.get(m.id);
  const total = m.idea_count ?? ideas.length;
  const progress = useMemo(
    () => ideaProgress(total, collectedSet, ideas),
    [total, collectedSet, ideas],
  );
  const next = useMemo(() => nextIdea(ideas, collectedSet), [ideas, collectedSet]);
  const isRead = reads.data?.has(m.id) ?? false;
  const xpPreview = xpForMaterial(total, m.subs.length);

  // ── Content per locale (with cross-language fallback for the body) ──────
  const preferredBody = locale === 'pt' ? m.body_pt : m.body_en;
  const otherBody = locale === 'pt' ? m.body_en : m.body_pt;
  const body = preferredBody ?? otherBody;
  const bodyIsFallback = !preferredBody && !!otherBody;
  const otherLangBadge = locale === 'pt' ? 'EN' : 'PT';

  const title = locale === 'pt' ? m.title_pt : m.title_en;
  const summary = locale === 'pt' ? m.summary_pt : m.summary_en;
  const sourceLabel = locale === 'pt' ? m.source_label_pt : m.source_label_en;
  const dim = meta.dim(m.dimension_id);

  // ── Deep dive (long-form audio) ──────────────────────────────────────────
  const audioPick = useMemo(() => pickMedia(m.media, ['audio'], locale), [m.media, locale]);
  const audioMinutes = audioPick?.media.duration_seconds
    ? Math.max(1, Math.round(audioPick.media.duration_seconds / 60))
    : null;
  const deepDiveLabel =
    audioMinutes != null
      ? `${t('learning.ideas.deepDive')} · ${t('learning.media.listenMin', { count: audioMinutes })}`
      : t('learning.ideas.deepDive');

  const toggleAudio = () => {
    Haptics.selectionAsync().catch(() => {});
    if (!audioMounted) {
      setAudioMounted(true);
      setAudioVisible(true);
      return;
    }
    setAudioVisible((v) => !v);
  };

  const toggleText = () => {
    Haptics.selectionAsync().catch(() => {});
    setTextOpen((v) => !v);
  };

  // ── Navigation into the idea screen ──────────────────────────────────────
  const openIdea = useCallback(
    (ordinal: number) => {
      Haptics.selectionAsync().catch(() => {});
      router.push({
        pathname: '/idea/[slug]',
        params: { slug: m.slug, idea: String(ordinal) },
      });
    },
    [router, m.slug],
  );

  // CTA: start (nothing absorbed) → continue (in progress) → review (done).
  // Review opens idea 1; start/continue open the lowest uncollected ordinal.
  const ctaDone = progress.done || next == null;
  const ctaTarget = progress.done || next == null ? (ideas[0]?.ordinal ?? 1) : next.ordinal;
  const ctaLabel =
    progress.done || next == null
      ? t('learning.ideas.reviewCta')
      : t(progress.collected === 0 ? 'learning.ideas.startCta' : 'learning.ideas.continueCta', {
          title: localizedIdea(next, locale).title,
        });

  // ── Feedback ─────────────────────────────────────────────────────────────
  const handleRate = (rating: -1 | 1) => {
    Haptics.selectionAsync().catch(() => {});
    if (myFeedback.data?.rating === rating) {
      rateMaterial.mutate({ slug: m.slug, rating });
      return;
    }
    rateMaterial.mutate({ slug: m.slug, rating });
    setSheetRating(rating);
    setFeedbackSheetOpen(true);
  };

  const handleSheetSave = (tags: string[], comment: string | null) => {
    if (!sheetRating) return;
    rateMaterial.mutate({ slug: m.slug, rating: sheetRating, tags, comment });
    setFeedbackSheetOpen(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenBackground>
        <Stack.Screen options={{ headerShown: false }} />

        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Hero — full-bleed portrait cover when there is real art;
             the legacy generated banner otherwise (see JSDoc). The back
             button and type pill overlay both the same way. */}
          <View style={styles.heroWrap}>
            {m.hero_image_url ? (
              <View style={[styles.heroImage, { width: windowWidth, height: heroHeight }]}>
                {/* expo-image (not RN's Image) for the same reason as
                   MaterialCover: decodes at view size, not 768×1152. */}
                <Image
                  source={m.hero_image_url}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  recyclingKey={m.hero_image_url}
                  transition={150}
                  priority="high"
                />
                {/* Bottom fade: page color at alpha 0 → page color, so the
                   art dissolves into the screen instead of ending on an
                   edge. Same hex at both stops — a literal 'transparent'
                   would interpolate through black on iOS. */}
                <LinearGradient
                  colors={[alpha(tokens.bg.deep, 0), tokens.bg.deep]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.heroFade}
                  pointerEvents="none"
                />
              </View>
            ) : (
              <MaterialCover
                dimensionId={m.dimension_id}
                subId={m.subs[0] ?? null}
                imageUrl={m.hero_image_url}
                variant="hero"
              />
            )}
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
              hitSlop={10}
            >
              <Ionicons name="chevron-back" size={22} color={tokens.text.hi} />
            </Pressable>
            <View style={styles.heroTypePill}>
              <Text style={styles.heroTypeText}>{typeLabel(m.type, t)}</Text>
            </View>
          </View>

          {/* Title + summary */}
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.summary}>{summary}</Text>
          </View>

          {/* Meta — how many ideas, in the dimension color */}
          <View style={styles.metaRow}>
            <View style={[styles.metaPill, { backgroundColor: dim.bg }]}>
              <Ionicons name="bulb-outline" size={12} color={dim.color} />
              <Text style={[styles.metaPillText, { color: dim.color }]}>
                {t('learning.ideas.countShort', { count: progress.total })}
              </Text>
            </View>
          </View>

          {/* ── Ideias · 1 de 3 absorvidas ─────────────────────────────── */}
          <View style={styles.progressBlock}>
            <View style={styles.progressRow}>
              <Text style={styles.progressTitle}>{t('learning.ideas.sectionTitle')}</Text>
              <Text style={styles.progressDot}>·</Text>
              {progress.done ? (
                <View style={styles.progressDone}>
                  <Ionicons name="checkmark-circle" size={15} color={tokens.semantic.coin} />
                  <Text style={styles.progressDoneText}>{t('learning.ideas.allAbsorbed')}</Text>
                </View>
              ) : (
                <Text style={styles.progressText}>
                  {t('learning.ideas.progress', {
                    collected: progress.collected,
                    total: progress.total,
                  })}
                </Text>
              )}
            </View>
            {!isRead && !progress.done && (
              <Text style={styles.rewardHint}>
                {progress.total === 1
                  ? t('learning.ideas.rewardHintOne', { xp: xpPreview })
                  : t('learning.ideas.rewardHint', { total: progress.total, xp: xpPreview })}
              </Text>
            )}
          </View>

          {/* Card rail — flips reveal the claim, never collect nor open
             (the rows below are what open an idea) */}
          <IdeaRail ideas={ideas} material={m} collected={collectedSet} locale={locale} />

          {/* One row per idea */}
          <View style={styles.listCard}>
            {ideas.map((idea, idx) => (
              <IdeaListRow
                key={idea.id}
                idea={idea}
                dimensionId={m.dimension_id}
                locale={locale}
                collected={collectedSet?.has(idea.id) ?? false}
                last={idx === ideas.length - 1}
                onPress={() => openIdea(idea.ordinal)}
                testID={`idea-row-${idea.ordinal}`}
              />
            ))}
          </View>

          {/* Deep dive — the long Notebook audio, if the material has one */}
          {audioPick && (
            <View style={styles.sectionGap}>
              <Pressable
                onPress={toggleAudio}
                accessibilityRole="button"
                accessibilityState={{ expanded: audioVisible }}
                style={({ pressed }) => [styles.rowCard, pressed && { opacity: 0.8 }]}
              >
                <View style={styles.rowIconWrap}>
                  <Ionicons name="headset-outline" size={18} color={tokens.brand.violet2} />
                </View>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {deepDiveLabel}
                </Text>
                {audioPick.isFallback && (
                  <View style={styles.langBadge}>
                    <Text style={styles.langBadgeText}>
                      {audioPick.media.locale.toUpperCase()}
                    </Text>
                  </View>
                )}
                <Ionicons
                  name={audioVisible ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={tokens.text.dim}
                />
              </Pressable>
              {audioMounted && (
                <View style={audioVisible ? styles.paneWrap : styles.hiddenPane}>
                  <AudioPane
                    uri={learningMediaUrl(audioPick.media.path)}
                    fallbackDurationSeconds={audioPick.media.duration_seconds}
                    episodeTitle={audioPick.media.meta?.title ?? null}
                    langBadge={
                      audioPick.isFallback ? audioPick.media.locale.toUpperCase() : null
                    }
                  />
                </View>
              )}
            </View>
          )}

          {/* Full text — the article is still part of the material */}
          {body && (
            <View style={styles.sectionGap}>
              <Pressable
                onPress={toggleText}
                accessibilityRole="button"
                accessibilityState={{ expanded: textOpen }}
                style={({ pressed }) => [styles.rowCard, pressed && { opacity: 0.8 }]}
              >
                <View style={styles.rowIconWrap}>
                  <Ionicons name="book-outline" size={18} color={tokens.brand.violet2} />
                </View>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {textOpen ? t('learning.ideas.fullTextHide') : t('learning.ideas.fullText')}
                </Text>
                {bodyIsFallback && (
                  <View style={styles.langBadge}>
                    <Text style={styles.langBadgeText}>{otherLangBadge}</Text>
                  </View>
                )}
                {!textOpen && (
                  <Text style={styles.rowMeta}>
                    {t('learning.readMin', { count: m.reading_minutes })}
                  </Text>
                )}
                <Ionicons
                  name={textOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={tokens.text.dim}
                />
              </Pressable>
              {textOpen && (
                <View style={styles.bodyWrap}>
                  <LearningBody body={body} />
                </View>
              )}
            </View>
          )}

          {/* Catalog meta — dimension + subs, low priority, near the source */}
          <View style={styles.footerMeta}>
            <View style={[styles.metaPill, { backgroundColor: dim.bg }]}>
              <Ionicons
                name={dim.iconName as keyof typeof Ionicons.glyphMap}
                size={12}
                color={dim.color}
              />
              <Text style={[styles.metaPillText, { color: dim.color }]}>{dim.label}</Text>
            </View>
            {m.subs.map((subId) => {
              const sub = meta.sub(subId);
              return (
                <View key={subId} style={styles.metaPill}>
                  <Ionicons
                    name={SUB_META[subId].iconName as keyof typeof Ionicons.glyphMap}
                    size={12}
                    color={tokens.text.mid}
                  />
                  <Text style={styles.metaPillText}>{sub.label}</Text>
                </View>
              );
            })}
          </View>

          {/* Source */}
          {(sourceLabel || m.source_url) && (
            <View style={styles.source}>
              <Text style={styles.sourceLine}>
                <Text style={styles.sourceKey}>{t('learning.detail.source')}: </Text>
                <Text style={styles.sourceVal}>{sourceLabel ?? m.source_url}</Text>
              </Text>
            </View>
          )}

          {/* Feedback */}
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackPrompt}>{t('learning.detail.feedbackPrompt')}</Text>
            <View style={styles.feedbackRow}>
              <Pressable
                onPress={() => handleRate(1)}
                style={({ pressed }) => [
                  styles.feedbackBtn,
                  myFeedback.data?.rating === 1 && styles.feedbackBtnActiveUp,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons
                  name={myFeedback.data?.rating === 1 ? 'thumbs-up' : 'thumbs-up-outline'}
                  size={18}
                  color={myFeedback.data?.rating === 1 ? tokens.semantic.xp : tokens.text.mid}
                />
                <Text
                  style={[
                    styles.feedbackBtnText,
                    myFeedback.data?.rating === 1 && { color: tokens.semantic.xp },
                  ]}
                >
                  {t('learning.detail.feedbackUp')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleRate(-1)}
                style={({ pressed }) => [
                  styles.feedbackBtn,
                  myFeedback.data?.rating === -1 && styles.feedbackBtnActiveDown,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons
                  name={myFeedback.data?.rating === -1 ? 'thumbs-down' : 'thumbs-down-outline'}
                  size={18}
                  color={
                    myFeedback.data?.rating === -1 ? tokens.semantic.danger : tokens.text.mid
                  }
                />
                <Text
                  style={[
                    styles.feedbackBtnText,
                    myFeedback.data?.rating === -1 && { color: tokens.semantic.danger },
                  ]}
                >
                  {t('learning.detail.feedbackDown')}
                </Text>
              </Pressable>
            </View>
            {myFeedback.data && (myFeedback.data.tags.length > 0 || myFeedback.data.comment) && (
              <Pressable
                onPress={() => {
                  setSheetRating(myFeedback.data!.rating);
                  setFeedbackSheetOpen(true);
                }}
                style={({ pressed }) => [styles.feedbackEditRow, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name="create-outline" size={13} color={tokens.text.mid} />
                <Text style={styles.feedbackEditText}>{t('learning.feedback.editExisting')}</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>

        {/* Sticky CTA — opens the next idea to absorb (or idea 1 to review) */}
        <View style={[styles.footer, { paddingBottom: tokens.space[3] }]}>
          <Pressable
            onPress={() => openIdea(ctaTarget)}
            accessibilityRole="button"
            accessibilityLabel={ctaLabel}
            style={({ pressed }) => [
              styles.cta,
              ctaDone && styles.ctaReview,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Ionicons
              name={ctaDone ? 'albums-outline' : 'play'}
              size={16}
              color={ctaDone ? tokens.semantic.coin : tokens.text.hi}
            />
            <Text
              style={[styles.ctaText, ctaDone && styles.ctaTextReview]}
              numberOfLines={1}
            >
              {ctaLabel}
            </Text>
          </Pressable>
        </View>

        <FeedbackSheet
          open={feedbackSheetOpen}
          rating={sheetRating}
          initialTags={myFeedback.data?.tags ?? []}
          initialComment={myFeedback.data?.comment ?? null}
          onClose={() => setFeedbackSheetOpen(false)}
          onSave={handleSheetSave}
        />
      </ScreenBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: tokens.bg.deep },
  scroll: {
    paddingBottom: 120, // clearance for sticky CTA
  },

  // Hero
  heroWrap: {
    position: 'relative',
  },
  // Portrait cover frame — size comes inline from the window. Page color
  // behind it so the loading frame is invisible, not a grey box.
  heroImage: {
    overflow: 'hidden',
    backgroundColor: tokens.bg.deep,
  },
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: `${Math.round(HERO_FADE * 100)}%`,
  },
  backBtn: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  heroTypePill: {
    position: 'absolute',
    top: 18,
    right: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  heroTypeText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#FFFFFF',
  },

  // Title block
  titleBlock: {
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[5],
    paddingBottom: tokens.space[3],
    gap: 8,
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 30,
    lineHeight: 36,
    color: tokens.text.hi,
  },
  summary: {
    fontFamily: 'Manrope_500Medium',
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 22,
    color: tokens.text.mid,
  },

  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: tokens.space[4],
    marginBottom: tokens.space[4],
  },
  footerMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: tokens.space[4],
    marginTop: tokens.space[5],
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: tokens.bg.glassStrong,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  metaPillText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: tokens.text.mid,
  },

  // Progress line + reward hint
  progressBlock: {
    paddingHorizontal: tokens.space[4],
    marginBottom: tokens.space[2],
    gap: 4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  progressTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 15,
    color: tokens.text.hi,
  },
  progressDot: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    color: tokens.text.dim,
  },
  progressText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    color: tokens.text.mid,
  },
  progressDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressDoneText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: tokens.semantic.coin,
  },
  rewardHint: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: tokens.text.dim,
  },

  // Idea list
  listCard: {
    marginTop: tokens.space[3],
    marginHorizontal: tokens.space[4],
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.bg.glass,
    borderWidth: 1,
    borderColor: tokens.border.base,
    overflow: 'hidden',
  },

  // Deep dive / full text rows
  sectionGap: {
    marginTop: tokens.space[3],
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: tokens.space[4],
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.bg.glass,
    borderWidth: 1,
    borderColor: tokens.border.strong,
  },
  rowIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(123, 92, 255, 0.16)',
  },
  rowTitle: {
    flex: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    color: tokens.text.hi,
  },
  rowMeta: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: tokens.text.dim,
  },
  langBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  langBadgeText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 8,
    letterSpacing: 0.5,
    color: tokens.text.hi,
  },
  paneWrap: {
    marginTop: tokens.space[2],
  },
  hiddenPane: {
    display: 'none',
  },
  bodyWrap: {
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[3],
  },

  source: {
    marginTop: tokens.space[5],
    marginHorizontal: tokens.space[4],
    padding: tokens.space[3],
    backgroundColor: tokens.bg.glass,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  sourceLine: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: tokens.text.mid,
  },
  sourceKey: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: tokens.text.base,
  },
  sourceVal: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    color: tokens.text.mid,
  },

  feedbackBox: {
    marginTop: tokens.space[5],
    marginHorizontal: tokens.space[4],
    padding: tokens.space[4],
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.bg.glass,
    borderWidth: 1,
    borderColor: tokens.border.strong,
    gap: 12,
  },
  feedbackPrompt: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: tokens.text.dim,
    textAlign: 'center',
  },
  feedbackRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  feedbackBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: tokens.bg.glassStrong,
    borderWidth: 1,
    borderColor: tokens.border.base,
  },
  feedbackBtnActiveUp: {
    backgroundColor: 'rgba(61, 214, 140, 0.12)',
    borderColor: tokens.semantic.xp,
  },
  feedbackBtnActiveDown: {
    backgroundColor: 'rgba(255, 92, 122, 0.10)',
    borderColor: tokens.semantic.danger,
  },
  feedbackBtnText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: tokens.text.base,
  },
  feedbackEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    paddingTop: 8,
  },
  feedbackEditText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: tokens.text.mid,
    letterSpacing: 0.3,
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: tokens.space[4],
    paddingTop: tokens.space[3],
    paddingBottom: tokens.space[5],
    // Frosted band behind the sticky CTA — deep navy on dark, porcelain
    // on light (same recipe as MaterialMediaScreen).
    backgroundColor:
      ACTIVE_THEME === 'light'
        ? 'rgba(249, 249, 254, 0.94)'
        : 'rgba(10, 14, 38, 0.92)',
    borderTopWidth: 1,
    borderTopColor: tokens.border.base,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: tokens.brand.violet,
  },
  ctaReview: {
    backgroundColor: 'rgba(255, 200, 61, 0.10)',
    borderWidth: 1,
    borderColor: tokens.semantic.coin,
  },
  ctaText: {
    flexShrink: 1,
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: tokens.text.hi,
  },
  ctaTextReview: {
    color: tokens.semantic.coin,
  },
});
