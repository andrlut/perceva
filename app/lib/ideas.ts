import type {
  DimensionId,
  LearningIdea,
  LearningIdeaPublic,
  LearningIdeaVideo,
  LearningLocalized,
} from '@/lib/db/types';
import { learningMediaUrl } from '@/lib/learningMedia';

/**
 * Pure helpers for the "Recanto em ideias" — the 1..5 ideas a material can
 * carry (`learning_material.ideas`), their localized fields, media and the
 * user's collection progress. No hooks, no React: everything here is
 * unit-testable and shared by the material screen, the idea screen, the
 * rail, the collection grid and the Learn feed cards.
 *
 * Shared contract (other implementers import exactly these names):
 *   - `IdeaLocale`, `localizedIdea`, `pickLocalized`
 *   - `pickIdeaVideo`, `ideaVideoUri`, `ideaVideoPosterUri`
 *   - `ideaImageUri`, `ideaImageUriFromPath`
 *   - `ideaProgress`, `nextIdea`, `sortedIdeas`
 *   - `IdeaCardData`, `toCardData`, `toCardDataFromPublic`
 *   - `IDEA_IMAGE_ASPECT`, `IDEA_CARD_RAIL_WIDTH`, `ideaCardHeight`
 *   - `formatDuration`
 */

/** App locale as the idea JSON spells it (`useT().locale` is the same union). */
export type IdeaLocale = 'pt' | 'en';

const OTHER_LOCALE: Record<IdeaLocale, IdeaLocale> = { pt: 'en', en: 'pt' };

function isBlank(s: string | null | undefined): boolean {
  return !s || s.trim().length === 0;
}

/**
 * Picks `field[locale]`, falling back to the other language when the wanted
 * one is empty. Returns `''` when both are empty.
 */
export function pickLocalized(
  field: LearningLocalized | null | undefined,
  locale: IdeaLocale,
): string {
  if (!field) return '';
  const wanted = field[locale];
  if (!isBlank(wanted)) return wanted;
  const other = field[OTHER_LOCALE[locale]];
  return isBlank(other) ? '' : other;
}

function pickWithFlag(
  field: LearningLocalized | null | undefined,
  locale: IdeaLocale,
): { text: string; isFallback: boolean } {
  if (!field) return { text: '', isFallback: false };
  const wanted = field[locale];
  if (!isBlank(wanted)) return { text: wanted, isFallback: false };
  const other = field[OTHER_LOCALE[locale]];
  return isBlank(other)
    ? { text: '', isFallback: false }
    : { text: other, isFallback: true };
}

export interface LocalizedIdea {
  title: string;
  claim: string;
  body: string;
  /** True when at least one of the three fields came from the other language. */
  isFallback: boolean;
}

/**
 * Title / claim / body in the app locale, each falling back to the other
 * language when the wanted one is empty.
 */
export function localizedIdea(idea: LearningIdea, locale: IdeaLocale): LocalizedIdea {
  const title = pickWithFlag(idea.title, locale);
  const claim = pickWithFlag(idea.claim, locale);
  const body = pickWithFlag(idea.body, locale);
  return {
    title: title.text,
    claim: claim.text,
    body: body.text,
    isFallback: title.isFallback || claim.isFallback || body.isFallback,
  };
}

// ── Media ────────────────────────────────────────────────────────────────────

export interface PickedIdeaVideo {
  video: LearningIdeaVideo;
  /** Language of the picked video (may differ from the app locale). */
  locale: IdeaLocale;
  /** True when the video is in the OTHER language — the UI shows a small
   *  "PT"/"EN" badge in that case (same pattern as `pickMedia`). */
  isFallback: boolean;
}

/**
 * Prefers the video in the app locale, else the other language (flagged as
 * fallback), else `null` — in which case the screen shows the idea image.
 */
export function pickIdeaVideo(
  idea: Pick<LearningIdea, 'video'>,
  locale: IdeaLocale,
): PickedIdeaVideo | null {
  const wanted = idea.video?.[locale] ?? null;
  if (wanted && !isBlank(wanted.path)) {
    return { video: wanted, locale, isFallback: false };
  }
  const otherLocale = OTHER_LOCALE[locale];
  const other = idea.video?.[otherLocale] ?? null;
  if (other && !isBlank(other.path)) {
    return { video: other, locale: otherLocale, isFallback: true };
  }
  return null;
}

/** Public URL of a per-idea video (bucket-relative path → learning-media). */
export function ideaVideoUri(video: LearningIdeaVideo): string {
  return learningMediaUrl(video.path);
}

/** Public URL of the video poster, or `null` when the JSON has none. */
export function ideaVideoPosterUri(video: LearningIdeaVideo): string | null {
  return isBlank(video.poster) ? null : learningMediaUrl(video.poster as string);
}

/** Public URL of the idea illustration, or `null` when the idea has none. */
export function ideaImageUri(idea: Pick<LearningIdea, 'image'>): string | null {
  return ideaImageUriFromPath(idea.image?.path ?? null);
}

/** Same as `ideaImageUri` but from a bare path (view rows / `IdeaCardData`). */
export function ideaImageUriFromPath(path: string | null | undefined): string | null {
  return isBlank(path) ? null : learningMediaUrl(path as string);
}

// ── Progress ─────────────────────────────────────────────────────────────────

export interface IdeaProgress {
  /** Collected ideas, clamped to `total`. */
  collected: number;
  total: number;
  /** `total > 0 && collected >= total` — the material is complete. */
  done: boolean;
}

/**
 * "2 de 4 absorvidas". `collected` is the user's set of collected idea ids for
 * the material (`useCollectedIdeas().get(materialId)`). When `ideas` is given
 * only ids still present in it are counted (a re-cut can drop an idea);
 * the count is always clamped to `total` = `idea_count`.
 */
export function ideaProgress(
  ideaCount: number,
  collected: Set<string> | undefined,
  ideas?: LearningIdea[] | null,
): IdeaProgress {
  const total = Math.max(0, Math.floor(Number.isFinite(ideaCount) ? ideaCount : 0));
  let count = 0;
  if (collected && collected.size > 0) {
    if (ideas != null) {
      for (const idea of ideas) {
        if (collected.has(idea.id)) count += 1;
      }
    } else {
      count = collected.size;
    }
  }
  const clamped = Math.min(count, total);
  return { collected: clamped, total, done: total > 0 && clamped >= total };
}

/** Ideas sorted by `ordinal` (stable; does not mutate the input). */
export function sortedIdeas(ideas: LearningIdea[]): LearningIdea[] {
  return [...ideas].sort((a, b) => a.ordinal - b.ordinal);
}

/**
 * The idea to continue with: lowest `ordinal` not yet collected, or `null`
 * when every idea is collected (or the list is empty).
 */
export function nextIdea(
  ideas: LearningIdea[],
  collected: Set<string> | undefined,
): LearningIdea | null {
  let best: LearningIdea | null = null;
  for (const idea of ideas) {
    if (collected?.has(idea.id)) continue;
    if (best === null || idea.ordinal < best.ordinal) best = idea;
  }
  return best;
}

// ── Card data ────────────────────────────────────────────────────────────────

/**
 * The minimal shape `IdeaCard` renders — built either from a full material
 * (`toCardData`) or from a `learning_idea_public` view row
 * (`toCardDataFromPublic`), so the rail, the idea screen, Explorar and the
 * collection all feed the same component.
 */
export interface IdeaCardData {
  /** Immutable idea id (keys `learning_idea_collect`). */
  id: string;
  materialId: string;
  slug: string;
  dimensionId: DimensionId;
  ordinal: number;
  title: LearningLocalized;
  claim: LearningLocalized;
  /** Bucket-relative image path; resolve with `ideaImageUriFromPath`. */
  imagePath: string | null;
  /** First source label — the back of the card shows it when present. */
  sourceLabel: LearningLocalized | null;
}

export function toCardData(
  idea: LearningIdea,
  material: { id: string; slug: string; dimension_id: DimensionId },
): IdeaCardData {
  return {
    id: idea.id,
    materialId: material.id,
    slug: material.slug,
    dimensionId: material.dimension_id,
    ordinal: idea.ordinal,
    title: idea.title,
    claim: idea.claim,
    imagePath: isBlank(idea.image?.path) ? null : (idea.image as { path: string }).path,
    sourceLabel: idea.sources?.[0]?.label ?? null,
  };
}

/** The view carries no sources, so `sourceLabel` is always `null` here. */
export function toCardDataFromPublic(row: LearningIdeaPublic): IdeaCardData {
  return {
    id: row.idea_id,
    materialId: row.material_id,
    slug: row.slug,
    dimensionId: row.dimension_id,
    ordinal: row.ordinal,
    title: { pt: row.title_pt ?? '', en: row.title_en ?? '' },
    claim: { pt: row.claim_pt ?? '', en: row.claim_en ?? '' },
    imagePath: isBlank(row.image_path) ? null : row.image_path,
    sourceLabel: null,
  };
}

// ── Geometry ─────────────────────────────────────────────────────────────────

/** Portrait card: width / height (960×1200 illustrations). */
export const IDEA_IMAGE_ASPECT = 4 / 5;

/** Card width on the horizontal rail of the material screen. */
export const IDEA_CARD_RAIL_WIDTH = 132;

/** Height of a card of the given width (4:5, rounded to whole pixels). */
export function ideaCardHeight(width: number): number {
  return Math.round(width / IDEA_IMAGE_ASPECT);
}

// ── Formatting ───────────────────────────────────────────────────────────────

/** `64` → "1:04"; past the hour → "1:02:10". */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(Number.isFinite(seconds) ? seconds : 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const ss = String(sec).padStart(2, '0');
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${ss}`;
  return `${m}:${ss}`;
}
