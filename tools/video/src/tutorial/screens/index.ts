// Registro das réplicas de tela. Uma tela nova entra aqui e em targets.json.
import { REWARDS_SCREEN } from './RewardsScreen';
import type { AnyScreen } from './types';

export const SCREENS: Record<string, AnyScreen> = {
  rewards: REWARDS_SCREEN,
};

export const screenModule = (id: string): AnyScreen => {
  const m = SCREENS[id];
  if (!m) throw new Error(`réplica de tela inexistente: ${id} (tem: ${Object.keys(SCREENS).join(', ')})`);
  return m;
};
