import type { TierName } from '@/lib/db/types';

/**
 * Visual identity per tier for the SkillMedallionOrbital and the surfaces
 * that paint it (lore card, next-tier card, tier path nodes).
 *
 * Source of truth for the orbital design language:
 *   - c1: light primary (planets, glyph highlights, arc accent)
 *   - c2: dark secondary (core gradient end, secondary planet)
 *   - cBorder: orbit ring color
 *   - glow: aura background (semi-transparent halo)
 *   - auraOn: 0..1 strength multiplier — Beginner is 0 (empty husk)
 *
 * Master intentionally pairs roxo + dourado: breaks the "platinum after
 * gold" expectation and signals a categorical leap rather than another
 * step on the metal ladder.
 */
export interface TierVisualMeta {
  c1: string;
  c2: string;
  cBorder: string;
  glow: string;
  auraOn: number;
}

export const TIER_VISUAL_META: Record<TierName, TierVisualMeta> = {
  beginner: {
    c1: '#B8BDE0',
    c2: '#5C638F',
    cBorder: '#8E94C4',
    glow: 'rgba(155,160,200,0.3)',
    auraOn: 0,
  },
  bronze: {
    c1: '#F2B27A',
    c2: '#A85B26',
    cBorder: '#8C4B22',
    glow: 'rgba(230,149,89,0.55)',
    auraOn: 0.5,
  },
  silver: {
    c1: '#F4F6FF',
    c2: '#7B85B8',
    cBorder: '#7B85B8',
    glow: 'rgba(232,236,255,0.5)',
    auraOn: 0.6,
  },
  gold: {
    c1: '#FFEFB0',
    c2: '#E0A52B',
    cBorder: '#C8881C',
    glow: 'rgba(255,200,61,0.65)',
    auraOn: 0.75,
  },
  master: {
    c1: '#C2A1FF',
    c2: '#FFC83D',
    cBorder: '#C2A1FF',
    glow: 'rgba(155,130,255,0.7)',
    auraOn: 0.9,
  },
};

export const TIER_ORDER: TierName[] = [
  'beginner',
  'bronze',
  'silver',
  'gold',
  'master',
];

/** Mix the hex toward white by ~+40 per channel — used for highlights
 *  (planets, arc accent, glyph top-light). */
export function lighten(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const m = (n: number) => Math.min(255, n + 40);
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}

/** Apply alpha to a #RRGGBB hex. Useful for borderColor: alpha(c1, 0.35). */
export function alpha(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}
