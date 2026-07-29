import type { LearningFeedCard, LearningFeedMedia } from '@/lib/api/learning';
import type { DimensionId, LearningMediaLocale } from '@/lib/db/types';
import { learningMediaUrl, pickMedia } from '@/lib/learningMedia';
import { DIMENSION_META } from '@/theme/dimensions';

/**
 * Deck builder for the Study Reels viewer — pure functions only, no hooks.
 *
 * A "deck" is an ordered list of ReelGroups (one per material). Each group
 * carries 1..N full-screen cards: today every material has a single
 * infographic, but `page_paths` (sliced story cards, phase 2) flows through
 * unchanged, so the viewer is N-card-tolerant from day one.
 */

/** How many materials a reel session shows before the "continue?" card. */
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

function toGroup(
  card: LearningFeedCard,
  locale: LearningMediaLocale,
): ReelGroup | null {
  // Off-template guard BEFORE the locale pick: an off-spec preferred-locale
  // asset (legacy NotebookLM canvas) must fall back to an on-spec
  // other-locale one — with the langBadge — not hide the material entirely.
  const onCanvas = card.media.filter(
    (m) => m.meta?.width === CANVAS_W && m.meta?.height === CANVAS_H,
  );
  const pick = pickMedia<LearningFeedMedia>(onCanvas, ['infographic'], locale);
  if (!pick) return null;

  const meta = pick.media.meta;
  if (!meta || meta.width == null || meta.height == null) return null; // filter guarantees
  const { width: cardW, height: cardH, alt } = meta;

  const paths = pick.media.page_paths?.length
    ? pick.media.page_paths
    : [pick.media.path];

  const title = locale === 'pt' ? card.title_pt : card.title_en;
  const summary = locale === 'pt' ? card.summary_pt : card.summary_en;

  return {
    materialId: card.id,
    slug: card.slug,
    title,
    summary,
    dimensionId: card.dimension_id,
    accent: DIMENSION_META[card.dimension_id].color,
    langBadge: pick.isFallback ? pick.media.locale.toUpperCase() : null,
    xpPreview: 5 + 5 * card.subs.length,
    releasedAt: new Date(card.released_at).getTime(),
    cards: paths.map((p, i) => ({
      key: `${card.id}:${i}`,
      uri: learningMediaUrl(p),
      width: cardW,
      height: cardH,
      alt: alt ?? null,
      pageIndex: i,
      pageCount: paths.length,
    })),
  };
}

/**
 * Round-robin across dimensions so a run of same-dimension materials (the
 * 12 glossaries) never stacks into a wall of one color. Queues keep their
 * own newest-first order; the dimension whose freshest material is newest
 * leads each cycle, so a brand-new drop still opens the deck.
 */
function interleaveByDimension(groups: ReelGroup[]): ReelGroup[] {
  const queues = new Map<DimensionId, ReelGroup[]>();
  for (const g of groups) {
    const q = queues.get(g.dimensionId) ?? [];
    q.push(g);
    queues.set(g.dimensionId, q);
  }
  const dims = [...queues.keys()].sort(
    (a, b) => (queues.get(b)![0]?.releasedAt ?? 0) - (queues.get(a)![0]?.releasedAt ?? 0),
  );
  const out: ReelGroup[] = [];
  let remaining = groups.length;
  while (remaining > 0) {
    for (const d of dims) {
      const g = queues.get(d)!.shift();
      if (g) {
        out.push(g);
        remaining -= 1;
      }
    }
  }
  return out;
}

/**
 * Builds the session deck: unread materials first (newest first, dimension
 * interleaved), then already-read ones for replay (least-recently-seen in
 * reels first — `seenAt` comes from the local reels-progress store).
 */
export function buildReelDeck(
  cards: LearningFeedCard[],
  locale: LearningMediaLocale,
  readSet: Set<string>,
  seenAt: Record<string, number> = {},
): ReelGroup[] {
  const groups: ReelGroup[] = [];
  for (const c of cards) {
    const g = toGroup(c, locale);
    if (g) groups.push(g);
  }

  const unread = groups
    .filter((g) => !readSet.has(g.materialId))
    .sort((a, b) => b.releasedAt - a.releasedAt);
  const read = groups
    .filter((g) => readSet.has(g.materialId))
    .sort((a, b) => {
      const seenDelta = (seenAt[a.slug] ?? 0) - (seenAt[b.slug] ?? 0);
      if (seenDelta !== 0) return seenDelta;
      return b.releasedAt - a.releasedAt;
    });

  return [...interleaveByDimension(unread), ...read];
}
