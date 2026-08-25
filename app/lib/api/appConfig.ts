import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

/**
 * app_config — tiny public-read key/value store for release facts the JS
 * bundle cannot know about itself. An OTA update can never reach a binary
 * with an OLDER runtime, so "there's a newer build on the Play Store" has
 * to come from outside the bundle: this table is that outside.
 *
 * The `android_release` row is updated as part of the release ritual
 * whenever a new build goes live on the store (see the migration comment).
 */

export interface AndroidRelease {
  version: string;
  package: string;
}

export const appConfigKeys = {
  all: ['appConfig'] as const,
  androidRelease: () => ['appConfig', 'android_release'] as const,
};

async function fetchAndroidRelease(): Promise<AndroidRelease | null> {
  const { data, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'android_release')
    .maybeSingle();
  if (error) throw error;
  const value = (data?.value ?? null) as Partial<AndroidRelease> | null;
  if (!value?.version) return null;
  return { version: value.version, package: value.package ?? 'perceva.app' };
}

export function useAndroidRelease() {
  return useQuery({
    queryKey: appConfigKeys.androidRelease(),
    queryFn: fetchAndroidRelease,
    // A release happens every few weeks — no need to refetch aggressively.
    staleTime: 1000 * 60 * 60,
  });
}

/**
 * True when `latest` is a strictly newer dotted version than `current`.
 * Segment-wise numeric compare ("1.10.0" > "1.9.0"); a missing/unparsable
 * side compares as not-newer — fail closed, never nag on bad data.
 */
export function isVersionNewer(latest: string, current: string | null): boolean {
  if (!current) return false;
  const parse = (v: string) => v.trim().split('.').map((s) => parseInt(s, 10));
  const a = parse(latest);
  const b = parse(current);
  if (a.some(Number.isNaN) || b.some(Number.isNaN)) return false;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x !== y) return x > y;
  }
  return false;
}
