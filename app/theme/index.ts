import { ACTIVE_THEME } from './activeTheme';
import { tokens as darkTokens } from './tokens';
import { lightTokens } from './tokens.light';

/**
 * The palette every screen consumes. Selected once at module load (see
 * activeTheme.ts for why this is a boot-time choice for now) — both
 * palettes share the exact key shape, enforced by tokens.light.ts's
 * Widen<Tokens> annotation, so consumers never notice which is active.
 */
export const tokens: typeof lightTokens =
  ACTIVE_THEME === 'light' ? lightTokens : darkTokens;

export { ACTIVE_THEME } from './activeTheme';
export type { Tokens, DimensionId } from './tokens';
