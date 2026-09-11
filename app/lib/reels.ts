import type { LearningFeedCard, LearningFeedMedia } from '@/lib/api/learning';
import type { DimensionId, LearningIdeaPublic, LearningMediaLocale } from '@/lib/db/types';
import { ideaImageUriFromPath, pickLocalized } from '@/lib/ideas';
import { learningMediaUrl, pickMedia } from '@/lib/learningMedia';
import { xpForMaterial } from '@/lib/learningXp';
import { DIMENSION_META } from '@/theme/dimensions';

/**
 * Deck builder for the "Explorar" viewer — pure functions only, no hooks.
 *
 * A "deck" is an ordered list of ReelGroups, of two kinds:
 *
 * - `legacy` — a material's baked 1080×1920 story art. With teaser assets
 *   (kind='reel'), every card in `page_paths` becomes its OWN group — an
 *   independent publication, shuffled into the feed ("mostrar eles
 *   randômicos"). Materials that only have the legacy single infographic
 *   fall back to one group with that composite, so mixed catalogs work
 *   during rollout.
 * - `idea` — one native card per published idea (`learning_idea_public`
 *   row): the idea illustration + hook title, drawn by the app, no baked
 *   asset. Absorbing happens ONLY on the idea screen; here the card is a
 *   hook ("Abrir ideia"), never a "Concluir".
 *
 * Both kinds mix in one deck: unread/uncollected first (shuffled), then the
 * replay tail. The canvas guard applies to legacy assets only.
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

interface ReelGroupBase {
  /** Unique per group — with teasers a material yields several groups. */
  key: string;
  materialId: string;
  slug: string;
  /** Headline of the group: the material title (legacy) or the idea's
   *  hook title (idea). */
  title: string;
  dimensionId: DimensionId;
  accent: string;
  releasedAt: number;
}

/** A material's baked story art (today's shape, unchanged). */
export interface LegacyReelGroup extends ReelGroupBase {
  kind: 'legacy';
  summary: string;
  /** Non-null when the asset is in the other language — badge text ("PT"). */
  langBadge: string | null;
  /** Mirrors the detail screen's award math (app/lib/learningXp.ts). */
  xpPreview: number;
  cards: ReelCard[];
}

/** One published idea, drawn natively (image + headline). */
export interface IdeaReelGroup extends ReelGroupBase {
  kind: 'idea';
  /** Localized title of the parent material (empty when the feed doesn't
   *  carry the material — the page then hides that line). */
  materialTitle: string;
  ideaId: string;
  ordinal: number;
  /** Published ideas of the same material (rows of the view). */
  ideaCount: number;
  claim: string;
  /** Public URL of the 4:5 illustration, or null → dimension placeholder. */
  imageUri: string | null;
  hasVideo: boolean;
  /** Build-time snapshot of the user's collection — orders the deck (replay
   *  tail) and is the fallback while the live query loads. The viewer's
   *  chip reads the live `useCollectedIdeas()` map through `isGroupRead`. */
  collected: boolean;
}

export type ReelGroup = LegacyReelGroup | IdeaReelGroup;

export function isIdeaGroup(g: ReelGroup): g is IdeaReelGroup {
  return g.kind === 'idea';
}

/** The image the group leads with — entry-card thumbs and prefetch. */
export function groupPreviewUri(g: ReelGroup): string | null {
  return g.kind === 'idea' ? g.imageUri : (g.cards[0]?.uri ?? null);
}

/**
 * "Consumed" state of a group: a legacy group is read when its material has
 * a `learning_view` row; an idea group when the idea is in the collection.
 * `collected` undefined (live query still loading) → the build snapshot.
 */
export function isGroupRead(
  g: ReelGroup,
  readSet: Set<string>,
  collected?: Map<string, Set<string>>,
): boolean {
  if (g.kind === 'idea') {
    if (!collected) return g.collected;
    return collected.get(g.materialId)?.has(g.ideaId) ?? false;
  }
  return readSet.has(g.materialId);
}

function toGroups(card: LearningFeedCard, locale: LearningMediaLocale): LegacyReelGroup[] {
  // Materials that carry ideas leave the legacy deck: their baked reel cards
  // would let "Concluir" here mark the material read and skip the whole
  // absorb flow. They enter the deck as native per-idea cards instead
  // (`ideaGroups`).
  if ((card.idea_count ?? 0) > 0) return [];
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
    kind: 'legacy' as const,
    materialId: card.id,
    slug: card.slug,
    title: locale === 'pt' ? card.title_pt : card.title_en,
    summary: locale === 'pt' ? card.summary_pt : card.summary_en,
    dimensionId: card.dimension_id,
    accent: DIMENSION_META[card.dimension_id].color,
    langBadge: pick.isFallback ? pick.media.locale.toUpperCase() : null,
    xpPreview: xpForMaterial(card.idea_count ?? 0, card.subs.length),
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

/**
 * One group per `learning_idea_public` row. Title/claim in the app locale
 * with the other language as fallback (`pickLocalized`); `ideaCount` counts
 * the rows of the same material, so a re-cut that dropped an idea never
 * shows "3 de 4". `materialTitles` (material_id → localized title) comes
 * from the feed cards — the view carries no material title.
 */
export function ideaGroups(
  rows: LearningIdeaPublic[],
  locale: LearningMediaLocale,
  collected: Map<string, Set<string>>,
  materialTitles: ReadonlyMap<string, string> = new Map(),
): IdeaReelGroup[] {
  const countByMaterial = new Map<string, number>();
  for (const r of rows) {
    countByMaterial.set(r.material_id, (countByMaterial.get(r.material_id) ?? 0) + 1);
  }
  return rows.map((r) => ({
    kind: 'idea' as const,
    // Prefixed so it can never collide with a legacy `${materialId}:${i}` key.
    key: `idea:${r.material_id}:${r.idea_id}`,
    materialId: r.material_id,
    slug: r.slug,
    title: pickLocalized({ pt: r.title_pt ?? '', en: r.title_en ?? '' }, locale),
    materialTitle: materialTitles.get(r.material_id) ?? '',
    dimensionId: r.dimension_id,
    accent: DIMENSION_META[r.dimension_id].color,
    releasedAt: new Date(r.released_at).getTime(),
    ideaId: r.idea_id,
    ordinal: r.ordinal,
    ideaCount: countByMaterial.get(r.material_id) ?? 1,
    claim: pickLocalized({ pt: r.claim_pt ?? '', en: r.claim_en ?? '' }, locale),
    imageUri: ideaImageUriFromPath(r.image_path),
    hasVideo: !!(r.video_pt_path || r.video_en_path),
    collected: collected.get(r.material_id)?.has(r.idea_id) ?? false,
  }));
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
 *  avoidable — pure shuffle clusters more than people expect. Keys by
 *  materialId, so the ideas of one material spread out the same way a
 *  material's teaser cards do. */
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
 * Builds the session deck: unread materials' cards and uncollected ideas
 * first (shuffled — the Explorar feed is a discovery surface), already-read
 * materials and collected ideas as a replay tail (least-recently-seen first,
 * from the local reels-progress store, keyed by slug).
 *
 * `ideaRows` / `collected` are optional so callers that only have the feed
 * still get the legacy deck.
 */
export function buildReelDeck(
  cards: LearningFeedCard[],
  locale: LearningMediaLocale,
  readSet: Set<string>,
  seenAt: Record<string, number> = {},
  ideaRows: LearningIdeaPublic[] = [],
  collected: Map<string, Set<string>> = new Map(),
): ReelGroup[] {
  const groups: ReelGroup[] = [];
  for (const c of cards) groups.push(...toGroups(c, locale));

  const materialTitles = new Map<string, string>();
  for (const c of cards) {
    materialTitles.set(c.id, locale === 'pt' ? c.title_pt : c.title_en);
  }
  groups.push(...ideaGroups(ideaRows, locale, collected, materialTitles));

  const unread = groups.filter((g) => !isGroupRead(g, readSet, collected));
  const read = groups
    .filter((g) => isGroupRead(g, readSet, collected))
    .sort((a, b) => {
      const seenDelta = (seenAt[a.slug] ?? 0) - (seenAt[b.slug] ?? 0);
      if (seenDelta !== 0) return seenDelta;
      return b.releasedAt - a.releasedAt;
    });

  return [...spreadByMaterial(shuffled(unread)), ...spreadByMaterial(read)];
}
