import type { WindowSpec } from '@/lib/api/dedicacao';
import { translate, type TranslateOptions } from '@/lib/i18n';
import type { LanguageCode } from '@/lib/settings';
import { bcp47 } from '@/lib/time';

/**
 * Window-label shaping shared by every surface that scrubs a Dedicação
 * window (DedicacaoPanel, and the history front). User-facing
 * strings live in the locale catalogs (`dedicacaoWindow.*`); this module
 * only owns the Intl date shaping.
 */

type TranslateFn = (key: string, options?: TranslateOptions) => string;

/** Localized chip labels for the PeriodSelector. */
export function windowChipLabels(t: TranslateFn): {
  week: string;
  month: string;
  quarter: string;
  all: string;
} {
  return {
    week: t('dedicacaoWindow.week'),
    month: t('dedicacaoWindow.month'),
    quarter: t('dedicacaoWindow.quarter'),
    all: t('dedicacaoWindow.all'),
  };
}

// Intl.DateTimeFormat construction is the expensive part (especially under
// the Hermes intl polyfill); keep the at-most-8 formatters (2 locales × 4
// shapes) alive for the app's lifetime.
const FMT_SHAPES = {
  day: { day: 'numeric' },
  monthShort: { month: 'short' },
  monthLongYear: { month: 'long', year: 'numeric' },
  year: { year: 'numeric' },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>;

const fmtCache = new Map<string, Intl.DateTimeFormat>();

function fmt(tag: string, shape: keyof typeof FMT_SHAPES): Intl.DateTimeFormat {
  const key = `${tag}|${shape}`;
  let f = fmtCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(tag, FMT_SHAPES[shape]);
    fmtCache.set(key, f);
  }
  return f;
}

/**
 * Human label for a computed window (e.g. "12 – 18 mai", "maio de 2026",
 * "mai – ago 2026", "últimos 12 meses"), rendered between the selector's
 * scrub arrows.
 */
export function formatWindowLabel(
  spec: WindowSpec,
  start: Date,
  end: Date,
  language: LanguageCode,
): string {
  const tag = bcp47(language);
  if (spec.granularity === 'all') {
    return translate('dedicacaoWindow.last12Months');
  }
  if (spec.granularity === 'week') {
    const day = fmt(tag, 'day');
    const month = fmt(tag, 'monthShort');
    return `${day.format(start)} – ${day.format(end)} ${month
      .format(end)
      .replace('.', '')}`;
  }
  if (spec.granularity === 'month') {
    return fmt(tag, 'monthLongYear').format(start);
  }
  // quarter
  const month = fmt(tag, 'monthShort');
  const year = fmt(tag, 'year');
  return `${month.format(start).replace('.', '')} – ${month
    .format(end)
    .replace('.', '')} ${year.format(end)}`;
}
