// Tipos dos dados de mentira da aba Recompensas. Os dados moram em
// rewards.fixtures.json porque o lint (scripts/tour.mjs, em node) também os lê:
// ele confere que todo `card:<id>` do roteiro existe na loja.
import type { RewardCategory } from '../ui';
import type { Lang } from './i18n';
import RAW from './rewards.fixtures.json';

export type Bi = { pt: string; en: string };
export type RewardFx = {
  id: string;
  title: Bi;
  description?: Bi;
  cost: number;
  /** nome do Ionicons (o ícone que a pessoa escolheu no app) */
  icon: string;
  category: RewardCategory;
  /** compra única: o resgate não tem quantidade */
  oneShot?: boolean;
};
export type RewardsFixture = {
  balance: number;
  /** recompensa mirada (cartão "Sua meta"); null mostra o convite "Mirar uma recompensa" */
  goal: string | null;
  /** ordem da loja = a ordem de Gerenciar */
  rewards: RewardFx[];
  /** abas com cadeado na barra (trancas progressivas) */
  lockedTabs?: string[];
};

export const REWARDS_FIXTURES: Record<string, RewardsFixture> = Object.fromEntries(
  Object.entries(RAW as Record<string, unknown>).filter(([k]) => !k.startsWith('_')),
) as Record<string, RewardsFixture>;

export const rewardsFixture = (name: string): RewardsFixture => {
  const fx = REWARDS_FIXTURES[name];
  if (!fx) throw new Error(`fixture de Recompensas inexistente: ${name} (tem: ${Object.keys(REWARDS_FIXTURES).join(', ')})`);
  return fx;
};

export const rewardTitle = (r: RewardFx, lang: Lang) => r.title[lang];
export const rewardDesc = (r: RewardFx, lang: Lang) => r.description?.[lang] ?? '';
