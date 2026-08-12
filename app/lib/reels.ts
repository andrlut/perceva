import type { LearningFeedCard, LearningFeedMedia } from '@/lib/api/learning';
import type { DimensionId, LearningMediaLocale } from '@/lib/db/types';
import { learningMediaUrl, pickMedia } from '@/lib/learningMedia';
import { DIMENSION_META } from '@/theme/dimensions';

/**
 * Deck builder for the "Explorar" viewer — pure functions only, no hooks.
 *
 * A "deck" is an ordered list of ReelGroups. With teaser assets
 * (kind='reel'), every card in `page_paths` becomes its OWN group — an
 * independent publication, shuffled into the feed ("mostrar eles
 * randômicos"). Materials that only have the legacy single infographic
 * fall back to one group with that composite, so mixed catalogs work
 * during rollout.
 */

/** How many cards a session shows before the "continue?" card. */
export const REEL_SET_SIZE = 5;

/** Story-card canvas the content pipeline renders at. Anything else is a
 *  legacy/off-template asset (NotebookLM exports) and is left out of the
 *  deck — it would visually break the surface. */
const CANVAS_W = 1080;
const CANVAS_H = 1920;

export interface ReelCard {
  /** `${materialId}:${pageIndex}` — stable list/recycling key. */
  key: string;
  uri: string;
  width: number;
  height: number;
  alt: string | null;
  pageIndex: number;
  pageCount: number;
}

export interface ReelGroup {
  /** Unique per group — with teasers a material yields several groups. */
  key: string;
  materialId: string;
  slug: string;
  title: string;
  summary: string;
  dimensionId: DimensionId;
  accent: string;
  /** Non-null when the asset is in the other language — badge text ("PT"). */
  langBadge: string | null;
  /** Mirrors the detail screen's award math (5 base + 5 per sub). */
  xpPreview: number;
  releasedAt: number;
  cards: ReelCard[];
}

function toGroups(card: LearningFeedCard, locale: LearningMediaLocale): ReelGroup[] {
  // Off-template guard BEFORE the locale pick: an off-spec preferred-locale
  // asset must fall back to an on-spec other-locale one (with the badge),
  // not hide the material entirely.
  const onCanvas = card.media.filter(
    (m) => m.meta?.width === CANVAS_W && m.meta?.height === CANVAS_H,
  );
  // Teaser cards win over the legacy composite when both exist.
  const reelPick = pickMedia<LearningFeedMedia>(onCanvas, ['reel'], locale);
  const pick = reelPick ?? pickMedia<LearningFeedMedia>(onCanvas, ['infographic'], locale);
  if (!pick) return [];

  const meta = pick.media.meta;
  if (!meta || meta.width == null || meta.height == null) return []; // filter guarantees
  const { width: cardW, height: cardH, alt } = meta;

  const paths = pick.media.page_paths?.length ? pick.media.page_paths : [pick.media.path];

  const base = {
    materialId: card.id,
    slug: card.slug,
    title: locale === 'pt' ? card.title_pt : card.title_en,
    summary: locale === 'pt' ? card.summary_pt : card.summary_en,
    dimensionId: card.dimension_id,
    accent: DIMENSION_META[card.dimension_id].color,
    langBadge: pick.isFallback ? pick.media.locale.toUpperCase() : null,
    xpPreview: 5 + 5 * card.subs.length,
    releasedAt: new Date(card.released_at).getTime(),
  };
  const toCard = (p: string, i: number, pageCount: number): ReelCard => ({
    key: `${card.id}:${i}`,
    uri: learningMediaUrl(p),
    width: cardW,
    height: cardH,
    alt: alt ?? null,
    pageIndex: i,
    pageCount,
  });

  if (reelPick) {
    // Independent publications: one single-card group per teaser.
    return paths.map((p, i) => ({
      ...base,
      key: `${card.id}:${i}`,
      cards: [toCard(p, i, 1)],
    }));
  }
  // Legacy composite: one group carrying all pages.
  return [{ ...base, key: card.id, cards: paths.map((p, i) => toCard(p, i, paths.length)) }];
}

function shuffled<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Greedy pass so two cards of the same material never sit adjacent when
 *  avoidable — pure shuffle clusters more than people expect. */
function spreadByMaterial(groups: ReelGroup[]): ReelGroup[] {
  const out: ReelGroup[] = [];
  const pool = groups.slice();
  while (pool.length > 0) {
    const prev = out[out.length - 1];
    let idx = pool.findIndex((g) => g.materialId !== prev?.materialId);
    if (idx < 0) idx = 0;
    out.push(pool.splice(idx, 1)[0]!);
  }
  return out;
}

/**
 * Builds the session deck: unread materials' cards first (shuffled — the
 * Explorar feed is a discovery surface), already-read ones as a replay
 * tail (least-recently-seen first, from the local reels-progress store).
 */
export function buildReelDeck(
  cards: LearningFeedCard[],
  locale: LearningMediaLocale,
  readSet: Set<string>,
  seenAt: Record<string, number> = {},
): ReelGroup[] {
  const groups: ReelGroup[] = [];
  for (const c of cards) groups.push(...toGroups(c, locale));

  const unread = groups.filter((g) => !readSet.has(g.materialId));
  const read = groups
    .filter((g) => readSet.has(g.materialId))
    .sort((a, b) => {
      const seenDelta = (seenAt[a.slug] ?? 0) - (seenAt[b.slug] ?? 0);
      if (seenDelta !== 0) return seenDelta;
      return b.releasedAt - a.releasedAt;
    });

  return [...spreadByMaterial(shuffled(unread)), ...spreadByMaterial(read)];
}
