import { useMemo, useState } from 'react';

import {
  computeWindow,
  useDedicacaoWindow,
  type WindowSpec,
} from '@/lib/api/dedicacao';
import { useT } from '@/lib/i18n';
import { useLoadedSettings } from '@/lib/settings';

import { formatWindowLabel, windowChipLabels } from './windowLabel';

/**
 * Opens on the rolling 30 days: the window the profile's Emblema reads, so
 * both screens talk about the same month — and the one the saturation ruler
 * (lib/saturation.ts) is defined on.
 */
const DEFAULT_SPEC: WindowSpec = { granularity: 'days30', offset: 0 };

/**
 * The full window-scrubbing kit for a Dedicação surface: spec state, the
 * windowed-XP query, the human label between the scrub arrows, the
 * localized chip labels, and the window bounds and buckets (the saturation
 * ruler is prorated on them; the day strips draw one cell per bucket) —
 * everything a PeriodSelector-driven panel needs beyond
 * its own tone props. Keeps the default granularity and weekStart threading
 * in one place instead of per panel.
 */
export function useWindowScrub(initial: WindowSpec = DEFAULT_SPEC) {
  const { t, locale } = useT();
  const settings = useLoadedSettings();
  const [spec, setSpec] = useState<WindowSpec>(initial);
  const query = useDedicacaoWindow(spec, settings.weekStart);

  // One computation feeds the label AND the bounds.
  const range = useMemo(
    () => computeWindow(spec, settings.weekStart),
    [spec, settings.weekStart],
  );
  const label = useMemo(
    () => formatWindowLabel(spec, range.start, range.end, locale),
    [spec, range, locale],
  );

  // `t` is memoized per language, so this recomputes only on locale flips.
  const chipLabels = useMemo(() => windowChipLabels(t), [t]);

  return {
    spec,
    setSpec,
    query,
    label,
    chipLabels,
    start: range.start,
    end: range.end,
    bucketStarts: range.bucketStarts,
    bucketSize: range.bucketSize,
  };
}
