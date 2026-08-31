import type { Tokens } from './tokens';

/**
 * Light palette — "tranquilidade, leveza, pureza".
 *
 * Mirrors tokens.ts key-for-key (the Widen<Tokens> annotation enforces
 * every key and tuple length at compile time; values widen to plain
 * string/number so the two palettes can differ). Mapping rules, from
 * the Tema Claro coletânea:
 *
 *   - Grounds go porcelain-lavender (#F4F4FB) with pure-white cards;
 *     text becomes night-blue ink (#1C2040 → #C3C7E2 ramp).
 *   - Violet stays the mechanic color, nudged to #6A4BF4 (action) /
 *     #5A3EDB (text) for AA on white. Gold deepens to #F2B21B (fill) /
 *     #A66F0E (text); pale-gold accents (coinLight) become deep gold —
 *     pale gold is illegible on white.
 *   - Neon glows become soft shadows; tinted washes drop to 5–20%.
 *   - Dimension hues deepen one step so chips/rims hold contrast.
 */

type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : { readonly [K in keyof T]: Widen<T[K]> };

export const lightTokens: Widen<Tokens> = {
  bg: {
    deep: '#F4F4FB',
    base: '#F9F9FE',
    surface: '#FFFFFF',
    surface2: '#EFEEF9',
    surface3: '#E5E4F4',
    glass: 'rgba(255, 255, 255, 0.72)',
    glassStrong: 'rgba(255, 255, 255, 0.88)',
  },
  text: {
    hi: '#1C2040',
    base: '#3A3F6B',
    mid: '#6B70A0',
    dim: '#9AA0C8',
    faint: '#C3C7E2',
  },
  border: {
    base: 'rgba(28, 32, 64, 0.10)',
    strong: 'rgba(28, 32, 64, 0.16)',
    divider: 'rgba(28, 32, 64, 0.07)',
  },
  brand: {
    violet: '#6A4BF4',
    violet2: '#5A3EDB',
    violetDeep: '#4B2FCC',
    violetGlow: 'rgba(106, 75, 244, 0.22)',
  },
  semantic: {
    xp: '#1E9E63',
    xp2: '#3DD68C',
    xpGlow: 'rgba(30, 158, 99, 0.18)',
    coin: '#F2B21B',
    coin2: '#F8CE5B',
    coinDeep: '#A66F0E',
    coinGlow: 'rgba(242, 178, 27, 0.30)',
    coinLight: '#A66F0E',
    coinRim: 'rgba(166, 111, 14, 0.45)',
    danger: '#D93A5C',
    warn: '#DA7A18',
  },
  dimension: {
    health: '#E85566',
    body: '#E5732A',
    mind: '#7C4DEF',
    wealth: '#C9920A',
    bonds: '#1592C9',
    craft: '#159C8E',
  },
  dimensionBg: {
    health: '#FDECEE',
    body: '#FCEFE5',
    mind: '#F1EBFE',
    wealth: '#FAF2DC',
    bonds: '#E6F4FB',
    craft: '#E4F5F3',
  },
  tier: {
    beginner: '#7A80B0',
    bronze1: '#C97B3F',
    bronze2: '#8C4B22',
    silver1: '#8F97C4',
    silver2: '#5E679A',
    gold1: '#D9A013',
    gold2: '#A66F0E',
    master1: '#8B5CF0',
    master2: '#1592C9',
    master3: '#C9920A',
  },
  radius: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    xxl: 32,
    pill: 999,
  },
  space: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 32,
    8: 40,
    9: 48,
    10: 64,
  },
  layout: {
    bottomNavClearance: 84,
  },
  font: {
    family: 'Manrope_500Medium',
    familyBold: 'Manrope_700Bold',
    familyHeavy: 'Manrope_800ExtraBold',
  },
  type: {
    display: { fontFamily: 'Manrope_800ExtraBold', fontSize: 36, lineHeight: 38 },
    h1: { fontFamily: 'Manrope_800ExtraBold', fontSize: 28, lineHeight: 31 },
    h2: { fontFamily: 'Manrope_700Bold', fontSize: 22, lineHeight: 26 },
    h3: { fontFamily: 'Manrope_700Bold', fontSize: 17, lineHeight: 21 },
    body: { fontFamily: 'Manrope_500Medium', fontSize: 14, lineHeight: 20 },
    bodyLg: { fontFamily: 'Manrope_500Medium', fontSize: 16, lineHeight: 23 },
    caption: { fontFamily: 'Manrope_600SemiBold', fontSize: 12, lineHeight: 16 },
    eyebrow: { fontFamily: 'Manrope_700Bold', fontSize: 11, lineHeight: 13 },
    numXl: { fontFamily: 'Manrope_800ExtraBold', fontSize: 56, lineHeight: 56 },
    numLg: { fontFamily: 'Manrope_800ExtraBold', fontSize: 32, lineHeight: 32 },
    numMd: { fontFamily: 'Manrope_700Bold', fontSize: 20, lineHeight: 20 },
  },
  motion: {
    durFast: 140,
    dur: 240,
    durSlow: 480,
    springSnappy: { damping: 18, stiffness: 220, mass: 1 },
    springBouncy: { damping: 12, stiffness: 180, mass: 1 },
    springSlow: { damping: 22, stiffness: 120, mass: 1 },
  },
  shadow: {
    violetGlow: {
      shadowColor: '#6A4BF4',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.22,
      shadowRadius: 14,
      elevation: 10,
      boxShadow: '0px 8px 18px rgba(106, 75, 244, 0.22)',
    },
    violetGlowSoft: {
      shadowColor: '#6A4BF4',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.14,
      shadowRadius: 8,
      elevation: 5,
      boxShadow: '0px 4px 12px rgba(106, 75, 244, 0.14)',
    },
    coinGlow: {
      shadowColor: '#F2B21B',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.28,
      shadowRadius: 12,
      elevation: 8,
      boxShadow: '0px 6px 16px rgba(242, 178, 27, 0.28)',
    },
    coinGlowSoft: {
      shadowColor: '#F2B21B',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.18,
      shadowRadius: 6,
      elevation: 4,
      boxShadow: '0px 3px 10px rgba(242, 178, 27, 0.18)',
    },
    xpGlow: {
      shadowColor: '#1E9E63',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.20,
      shadowRadius: 10,
      elevation: 6,
      boxShadow: '0px 4px 14px rgba(30, 158, 99, 0.20)',
    },
    deep: {
      shadowColor: '#1C2040',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.14,
      shadowRadius: 20,
      elevation: 12,
      boxShadow: '0px 10px 28px rgba(28, 32, 64, 0.14)',
    },
  },
  gradient: {
    screenAmbient: ['#FFFFFF', '#F9F9FE', '#F4F4FB'],
    screenAmbientLocations: [0, 0.5, 1],
    heroCard: ['rgba(106, 75, 244, 0.10)', 'rgba(255, 255, 255, 0.65)'],
    heroCardLocations: [0, 1],
    coinPill: ['#F8CE5B', '#F2B21B', '#C98E12'],
    coinPillLocations: [0, 0.5, 1],
    completeBtn: ['#7B5CFF', '#6A4BF4'],
    completeBtnLocations: [0, 1],
    coinBtn: ['#F8CE5B', '#F2B21B', '#C98E12'],
    coinBtnLocations: [0, 0.5, 1],
    questBoard: ['rgba(106, 75, 244, 0.10)', 'rgba(21, 146, 201, 0.06)'],
    questBoardLocations: [0, 1],
    todayHero: ['rgba(255, 255, 255, 0.92)', 'rgba(244, 244, 251, 0.96)'],
    todayHeroLocations: [0, 1],
    taskCard: ['rgba(255, 255, 255, 0.95)', 'rgba(249, 249, 254, 0.98)'],
    taskCardLocations: [0, 1],
    activityBar: ['rgba(255, 255, 255, 0.75)', 'rgba(244, 244, 251, 0.85)'],
    activityBarLocations: [0, 1],
    summaryChipViolet: ['rgba(106, 75, 244, 0.16)', 'rgba(106, 75, 244, 0.08)'],
    summaryChipGreen: ['rgba(30, 158, 99, 0.18)', 'rgba(30, 158, 99, 0.08)'],
    questChipGold: ['rgba(242, 178, 27, 0.20)', 'rgba(242, 178, 27, 0.08)'],
    questChipViolet: ['rgba(106, 75, 244, 0.14)', 'rgba(106, 75, 244, 0.05)'],
    questChipOrange: ['rgba(229, 115, 42, 0.22)', 'rgba(195, 56, 24, 0.08)'],
    celebrationCard: ['rgba(251, 243, 220, 0.97)', 'rgba(255, 255, 255, 0.99)'],
    confirmCardWarm: ['rgba(251, 243, 220, 0.97)', 'rgba(255, 255, 255, 0.99)'],
    confirmCardCool: ['rgba(238, 234, 254, 0.97)', 'rgba(255, 255, 255, 0.99)'],
    bankCard: ['rgba(251, 243, 220, 0.9)', 'rgba(255, 255, 255, 0.96)'],
    rewardBarFill: ['#C98E12', '#F2B21B', '#F8CE5B'],
    rewardBarFillLocations: [0, 0.5, 1],
    taskCheckBtn: ['#8B6FF7', '#6A4BF4', '#4B2FCC'],
    taskCheckBtnLocations: [0, 0.6, 1],
  },
};
