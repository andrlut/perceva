import { ACTIVE_THEME, type ThemeName } from './activeTheme';
import { tokens as darkTokens } from './tokens';
import { lightTokens } from './tokens.light';

/**
 * The palette every screen consumes — a MUTABLE object rewritten in
 * place by the theme boot gate (see activeTheme.ts for the lifecycle).
 * StyleSheets capture primitive values at create time, so the rewrite
 * must land before route modules load; values read at render time
 * (gradient tuples passed to LinearGradient, inline styles) always see
 * the current palette.
 *
 * Both palettes share the exact key shape (tokens.light.ts's
 * Widen<Tokens> annotation enforces it), so the rewrite can never leave
 * a stale key behind.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
function copyInto(target: any, source: any): void {
  for (const k of Object.keys(source)) {
    const sv = source[k];
    if (Array.isArray(sv)) {
      target[k] = [...sv];
    } else if (sv && typeof sv === 'object') {
      if (!target[k] || typeof target[k] !== 'object') target[k] = {};
      copyInto(target[k], sv);
    } else {
      target[k] = sv;
    }
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const mutableTokens = {} as Record<string, unknown>;
copyInto(mutableTokens, ACTIVE_THEME === 'light' ? lightTokens : darkTokens);

export const tokens: typeof lightTokens =
  mutableTokens as unknown as typeof lightTokens;

/** Theme-boot internal — rewrites the shared tokens object in place. */
export function __applyThemeTokens(name: ThemeName): void {
  copyInto(mutableTokens, name === 'light' ? lightTokens : darkTokens);
}

export { ACTIVE_THEME } from './activeTheme';
export type { ThemeName, ThemePref } from './activeTheme';
export type { Tokens, DimensionId } from './tokens';
