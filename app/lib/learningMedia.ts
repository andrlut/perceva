import type {
  LearningMaterialMedia,
  LearningMediaKind,
  LearningMediaLocale,
} from '@/lib/db/types';

/**
 * Helpers for learning media attachments (podcast audio, infographics, decks).
 *
 * Media rows store BUCKET-RELATIVE paths. The public URL is assembled here —
 * and only here — so a future storage move (e.g. Supabase → R2) is a
 * one-line change plus an OTA, never a data migration.
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const MEDIA_BASE_URL = `${SUPABASE_URL}/storage/v1/object/public/learning-media/`;

export function learningMediaUrl(path: string): string {
  return MEDIA_BASE_URL + path;
}

export interface PickedMedia {
  media: LearningMaterialMedia;
  /** True when the row is in the OTHER language than the app locale —
   *  the UI shows a small language badge in that case. */
  isFallback: boolean;
}

/**
 * Picks the best row of a kind for the app locale, falling back to the other
 * language when the preferred one doesn't exist. `infographic` and `deck`
 * are interchangeable for the "view" mode — pass both and the preferred
 * locale wins across kinds.
 */
export function pickMedia(
  media: LearningMaterialMedia[] | undefined,
  kinds: LearningMediaKind[],
  locale: LearningMediaLocale,
): PickedMedia | null {
  if (!media || media.length === 0) return null;
  const ofKind = media.filter((m) => kinds.includes(m.kind));
  if (ofKind.length === 0) return null;
  const preferred = ofKind.find((m) => m.locale === locale);
  if (preferred) return { media: preferred, isFallback: false };
  return { media: ofKind[0], isFallback: true };
}

/** "28:35" (or "1:02:10" past the hour). */
export function formatAudioTime(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
