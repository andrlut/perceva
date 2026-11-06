// Peças de UI das réplicas de tela, portadas 1:1 dos componentes do app
// (react-native-svg → SVG da web, LinearGradient → linear-gradient do CSS).
// Tudo em dp: a réplica é desenhada em dp e o Tour escala o conjunto.
import React, { useId } from 'react';
import { tokens } from '../../../../app/theme/tokens';
import ionGlyphs from '../molde/ionicons-full.json';

export { tokens };

const GLYPHS = ionGlyphs as Record<string, number>;

/** Mesmas cores de app/theme/rewards.ts (REWARD_CATEGORY_META) — lá importa o tema do RN. */
export type RewardCategory = 'indulgence' | 'good' | 'experience';
export const CATEGORY_META: Record<RewardCategory, { icon: string; color: string; bg: string }> = {
  indulgence: { icon: 'flash', color: tokens.semantic.coin, bg: 'rgba(255, 200, 61, 0.16)' },
  good: { icon: 'bag-handle', color: tokens.brand.violet2, bg: 'rgba(155, 130, 255, 0.16)' },
  experience: { icon: 'sparkles', color: tokens.dimension.bonds, bg: 'rgba(77, 208, 255, 0.16)' },
};
export const CATEGORY_ORDER: RewardCategory[] = ['indulgence', 'good', 'experience'];

/** Ícone do Ionicons (a fonte do app), centrado numa caixa size×size. */
export const Ion: React.FC<{ name: string; size: number; color: string; style?: React.CSSProperties }> = ({
  name,
  size,
  color,
  style,
}) => {
  const cp = GLYPHS[name];
  if (cp == null) throw new Error(`ícone do Ionicons inexistente: ${name}`);
  return (
    <span
      style={{
        fontFamily: 'Ionicons',
        fontSize: size,
        lineHeight: `${size}px`,
        width: size,
        height: size,
        color,
        display: 'inline-block',
        textAlign: 'center',
        flexShrink: 0,
        ...style,
      }}
    >
      {String.fromCodePoint(cp)}
    </span>
  );
};

/** expo-linear-gradient vertical (start y0 → end y1) em CSS. */
export const vGrad = (colors: readonly string[], locations?: readonly number[]) =>
  `linear-gradient(180deg, ${colors.map((c, i) => (locations ? `${c} ${locations[i] * 100}%` : c)).join(', ')})`;
export const hGrad = (colors: readonly string[], locations?: readonly number[]) =>
  `linear-gradient(90deg, ${colors.map((c, i) => (locations ? `${c} ${locations[i] * 100}%` : c)).join(', ')})`;

const useSvgId = (p: string) => `${p}${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

// ---------------------------------------------------------------- CoinIcon (app/components/CoinIcon.tsx)

const RUNE_PATHS = [
  'M -10 -14 L 0 14 L 10 -14',
  'M -10 -14 L -10 14 M -10 0 L 10 0 M 10 -14 L 10 14',
  'M -10 -14 L 0 0 L -10 14 M 0 0 L 10 0',
  'M -10 0 A 10 10 0 1 0 10 0',
  'M 0 -14 L 0 14 M -10 -6 L 10 -6',
] as const;
const COIN = {
  bodyA: '#FFF1C7',
  bodyB: '#FFC97A',
  bodyC: '#B2761A',
  rim: '#7B5CFF',
  rimDeep: '#3F2B8F',
  glyph: '#FFE3A6',
  glyphDeep: '#8A5C0F',
  sheen: 'rgba(255,255,255,0.55)',
} as const;
const IRIS_D = 'M 180 720 Q 380 600 512 512 Q 644 424 844 304';

export const Coin: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => {
  const id = useSvgId('coin');
  const marks = Array.from({ length: 12 }, (_, i) => {
    const deg = -90 + (i / 12) * 360;
    const a = (deg * Math.PI) / 180;
    return { x: 110 + Math.cos(a) * 86, y: 110 + Math.sin(a) * 86, deg };
  });
  const s = 108 / 1024;
  const t = 110 - 512 * s;
  return (
    <svg width={size} height={size} viewBox="0 0 220 220" style={{ display: 'block', flexShrink: 0, ...style }}>
      <defs>
        <radialGradient id={`${id}b`} cx="0.32" cy="0.28" r="0.85">
          <stop offset="0" stopColor={COIN.bodyA} />
          <stop offset="0.55" stopColor={COIN.bodyB} />
          <stop offset="1" stopColor={COIN.bodyC} />
        </radialGradient>
        <linearGradient id={`${id}s`} x1="0.1" y1="0.1" x2="0.9" y2="0.9">
          <stop offset="0" stopColor={COIN.sheen} stopOpacity={0.9} />
          <stop offset="0.45" stopColor={COIN.sheen} stopOpacity={0} />
        </linearGradient>
        <radialGradient id={`${id}h`} cx="0.5" cy="0.95" r="0.6">
          <stop offset="0" stopColor="#000" stopOpacity={0.45} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}v`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.6" stopColor={COIN.rim} stopOpacity={0} />
          <stop offset="1" stopColor={COIN.rim} stopOpacity={0.25} />
        </radialGradient>
        <radialGradient id={`${id}p`} cx="0.4" cy="0.4" r="0.7">
          <stop offset="0" stopColor={COIN.glyph} />
          <stop offset="1" stopColor={COIN.glyphDeep} />
        </radialGradient>
      </defs>
      <circle cx="110" cy="110" r="103" fill={COIN.rimDeep} opacity={0.4} />
      <circle cx="110" cy="110" r="96" fill={`url(#${id}b)`} />
      <circle cx="110" cy="110" r="96" fill={`url(#${id}h)`} />
      <circle cx="110" cy="110" r="96" fill={`url(#${id}v)`} />
      <circle cx="110" cy="110" r="96" fill="none" stroke={COIN.rimDeep} strokeWidth="1.2" opacity={0.6} />
      <circle cx="110" cy="110" r="92" fill="none" stroke={COIN.glyphDeep} strokeWidth="0.7" opacity={0.5} />
      {size >= 16 ? (
        <g>
          <circle cx="110" cy="110" r="76" fill="none" stroke={COIN.glyphDeep} strokeWidth="0.7" opacity={0.6} />
          {marks.map((m, i) => {
            const d = RUNE_PATHS[i % RUNE_PATHS.length];
            return (
              <g key={i} transform={`translate(${m.x}, ${m.y}) rotate(${m.deg + 90}) scale(0.45)`}>
                <path d={d} fill="none" stroke={COIN.glyphDeep} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
                <path d={d} fill="none" stroke={COIN.glyph} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity={0.95} />
              </g>
            );
          })}
        </g>
      ) : null}
      <g transform={`translate(${t}, ${t}) scale(${s})`}>
        <g stroke={COIN.rim} fill="none" strokeWidth="14">
          <circle cx="512" cy="512" r="320" opacity={0.45} />
          <circle cx="512" cy="512" r="260" opacity={0.55} />
          <circle cx="512" cy="512" r="200" opacity={0.7} />
          <circle cx="512" cy="512" r="140" opacity={0.85} />
          <circle cx="512" cy="512" r="80" opacity={1} />
        </g>
        <path d={IRIS_D} fill="none" stroke={COIN.glyph} strokeWidth="22" strokeLinecap="round" />
        <circle cx="180" cy="720" r="18" fill={COIN.glyph} />
        <circle cx="844" cy="304" r="22" fill={COIN.glyph} />
        <circle cx="512" cy="512" r="38" fill={`url(#${id}p)`} />
      </g>
      <circle cx="110" cy="110" r="96" fill={`url(#${id}s)`} />
    </svg>
  );
};

// ---------------------------------------------------------------- PercevaGlyph bare, paleta gilded

const GILDED = { mark: '#FFDC8F', markDeep: '#8A5C0F', accent: '#FFE3A6' } as const;

/** O Topo Iris gravado no canto dos cartões da Vault (PercevaGlyph bare palette="gilded"). */
export const TopoGlyph: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => {
  const id = useSvgId('topo');
  return (
    <svg width={size} height={size} viewBox="0 0 1024 1024" style={{ display: 'block', ...style }}>
      <defs>
        <radialGradient id={id} cx="0.4" cy="0.4" r="0.7">
          <stop offset="0" stopColor={GILDED.mark} />
          <stop offset="1" stopColor={GILDED.markDeep} />
        </radialGradient>
      </defs>
      <g stroke={GILDED.accent} fill="none" strokeWidth="14">
        <circle cx="512" cy="512" r="320" opacity={0.45} />
        <circle cx="512" cy="512" r="260" opacity={0.55} />
        <circle cx="512" cy="512" r="200" opacity={0.7} />
        <circle cx="512" cy="512" r="140" opacity={0.85} />
        <circle cx="512" cy="512" r="80" opacity={1} />
      </g>
      <path d={IRIS_D} fill="none" stroke={GILDED.mark} strokeWidth="22" strokeLinecap="round" />
      <circle cx="180" cy="720" r="18" fill={GILDED.mark} />
      <circle cx="844" cy="304" r="22" fill={GILDED.mark} />
      <circle cx="512" cy="512" r="38" fill={`url(#${id})`} />
    </svg>
  );
};

// ---------------------------------------------------------------- layout helpers

export type Rect = { x: number; y: number; w: number; h: number; r?: number };

/** Caixa absoluta em dp. */
export const at = (r: Rect, style?: React.CSSProperties): React.CSSProperties => ({
  position: 'absolute',
  left: r.x,
  top: r.y,
  width: r.w,
  height: r.h,
  boxSizing: 'border-box',
  ...style,
});

export const inflate = (r: Rect, d: number): Rect => ({ x: r.x - d, y: r.y - d, w: r.w + 2 * d, h: r.h + 2 * d, r: (r.r ?? 0) + d });

/** Texto em uma linha, com a altura de linha decidida pelo layout. */
export const textStyle = (size: number, weight: number, lineHeight: number, color: string, extra?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: 'Manrope',
  fontWeight: weight,
  fontSize: size,
  lineHeight: `${lineHeight}px`,
  color,
  whiteSpace: 'nowrap',
  ...extra,
});

/** numberOfLines={n} do RN: corta com reticências. */
export const clampLines = (n: number): React.CSSProperties =>
  n === 1
    ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
    : { whiteSpace: 'normal', display: '-webkit-box', WebkitLineClamp: n, WebkitBoxOrient: 'vertical', overflow: 'hidden' };
