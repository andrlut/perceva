import { useMemo, useState } from 'react';

import {
  computeWindow,
  useDedicacaoWindow,
  type WindowSpec,
} from '@/lib/api/dedicacao';
import { useT } from '@/lib/i18n';
import { useLoadedSettings } from '@/lib/settings';

import { formatWindowLabel, windowChipLabels } from './windowLabel';

const DEFAULT_SPEC: WindowSpec = { granularity: 'month', offset: 0 };

/**
 * The full window-scrubbing kit for a Dedicação surface: spec state, the
 * windowed-XP query, the human label between the scrub arrows, and the
 * localized chip labels — everything a PeriodSelector-driven panel needs
 * beyond its own tone props. Keeps the default granularity and weekStart
 * threading in one place instead of per panel.
 */
export function useWindowScrub(initial: WindowSpec = DEFAULT_SPEC) {
  const { t, locale } = useT();
  const settings = useLoadedSettings();
  const [spec, setSpec] = useState<WindowSpec>(initial);
  const query = useDedicacaoWindow(spec, settings.weekStart);

  const label = useMemo(() => {
    const comp = computeWindow(spec, settings.weekStart);
    return formatWindowLabel(spec, comp.start, comp.end, locale);
  }, [spec, settings.weekStart, locale]);

  // `t` is memoized per language, so this recomputes only on locale flips.
  const chipLabels = useMemo(() => windowChipLabels(t), [t]);

  return { spec, setSpec, query, label, chipLabels };
}
