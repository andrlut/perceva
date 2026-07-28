import { useMemo } from 'react';

import { useLastPsychSession, useSessionScores } from '@/lib/api/psych';
import { useT } from '@/lib/i18n';
import {
  DISC_FACTOR_ORDER,
  blendFromScores,
  factorFromFacetId,
  getBlendContent,
  type DiscBlendCode,
  type DiscFactor,
  type DiscLocale,
} from '@/lib/psych/disc-content';

type BlendContent = ReturnType<typeof getBlendContent>;

export type DiscBlendState =
  | { status: 'loading' }
  | { status: 'none' }
  | {
      status: 'ready';
      code: DiscBlendCode;
      content: BlendContent;
      factors: Record<DiscFactor, number>;
    };

/**
 * The user's DISC blend, derived from their latest completed DISC session —
 * one source of truth for the hero eyebrow, the DiscCard summary, and the
 * result screen, so the three can never disagree.
 *
 * The blend is a pure function of the four psych_score factor means, never
 * persisted: a retake invalidates psychKeys (useSubmitPsychSession), so every
 * consumer refreshes for free. Returns 'loading' until both queries settle
 * (the loading gate is load-bearing — without it a DISC-holder sees the
 * "none" fallback flash on every cold mount).
 */
export function useDiscBlend(): DiscBlendState {
  const { locale } = useT();
  const discLocale: DiscLocale = locale === 'en' ? 'en' : 'pt';
  const lastSession = useLastPsychSession('disc');
  const scoresQ = useSessionScores(lastSession.data?.id);

  return useMemo<DiscBlendState>(() => {
    if (lastSession.isLoading) return { status: 'loading' };
    if (!lastSession.data) return { status: 'none' };
    if (scoresQ.isLoading) return { status: 'loading' };

    const map = new Map<DiscFactor, number>();
    for (const s of scoresQ.data ?? []) {
      const f = factorFromFacetId(s.facet_id);
      if (f) map.set(f, Number(s.score_decimal));
    }
    // A complete DISC session always scores all four factors; bail to 'none'
    // rather than fabricate a code from a partial set.
    if (!DISC_FACTOR_ORDER.every((f) => map.has(f))) return { status: 'none' };

    const factors = {
      d: map.get('d')!,
      i: map.get('i')!,
      s: map.get('s')!,
      c: map.get('c')!,
    };
    const code = blendFromScores(factors);
    return {
      status: 'ready',
      code,
      content: getBlendContent(code, discLocale),
      factors,
    };
  }, [
    lastSession.isLoading,
    lastSession.data,
    scoresQ.isLoading,
    scoresQ.data,
    discLocale,
  ]);
}
