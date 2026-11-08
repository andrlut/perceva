import type { Ionicons } from '@expo/vector-icons';

import { isEffectivelyDaily } from '@/lib/recurrence';
import type { Recurrence } from '@/lib/db/types';
import { tokens } from '@/theme';

/** The two groups of Gerenciar práticas. Nothing else: a practice is on
 *  Hoje every day, or it is periodic (weekday schedule, N× a week,
 *  monthly). Lives here, not in the route, so the screen's guide draws
 *  the same headers. */
export type PracticeBucket = 'daily' | 'periodic';

export interface BucketMeta {
  id: PracticeBucket;
  labelKey: string;
  descKey: string;
  iconName: keyof typeof Ionicons.glyphMap;
  /** Accent for icon, eyebrow and count chip. Theme-swapped tokens only. */
  accent: string;
  /** Wash behind the icon tile and the count chip. */
  accentBg: string;
}

export const BUCKETS: BucketMeta[] = [
  {
    id: 'daily',
    labelKey: 'tasksHub.buckets.daily',
    descKey: 'tasksHub.buckets.dailyDesc',
    iconName: 'sunny',
    accent: tokens.brand.violet2,
    accentBg: tokens.dimensionBg.mind,
  },
  {
    id: 'periodic',
    labelKey: 'tasksHub.buckets.periodic',
    descKey: 'tasksHub.buckets.periodicDesc',
    iconName: 'calendar',
    accent: tokens.dimension.bonds,
    accentBg: tokens.dimensionBg.bonds,
  },
];

export const BUCKET_BY_ID: Record<PracticeBucket, BucketMeta> = {
  daily: BUCKETS[0]!,
  periodic: BUCKETS[1]!,
};

/**
 * Which group a practice lives in, decided by its recurrence. Dropping a
 * row into the other group is what changes it: into Diárias → daily on
 * the spot; into Periódicas → the sheet opens on Semanal. Weekly-all-7-
 * days collapses into Daily so the user isn't surprised.
 */
export function bucketFor(rec: Recurrence): PracticeBucket {
  return isEffectivelyDaily(rec) ? 'daily' : 'periodic';
}
