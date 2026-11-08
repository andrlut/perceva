// Tipos dos dados de mentira da aba Práticas. Os dados moram em
// practices.fixtures.json porque o lint (scripts/tour.mjs, em node) também os
// lê: ele confere que todo `card:<id>` do roteiro existe na lista.
import { tokens } from '../ui';
import type { Lang } from './i18n';
import RAW from './practices.fixtures.json';

export type Bi = { pt: string; en: string };
export type DimensionId = keyof typeof tokens.dimension;
export type SubId =
  | 'sleep'
  | 'nutrition'
  | 'strength'
  | 'dexterity'
  | 'learn'
  | 'contemplate'
  | 'money'
  | 'career'
  | 'circle'
  | 'romance'
  | 'play'
  | 'build';

/** app/theme/dimensions.ts › SUB_META (o ícone da sub-área e a dimensão dela) */
export const SUB_META: Record<SubId, { iconName: string; dimensionId: DimensionId }> = {
  sleep: { iconName: 'moon', dimensionId: 'health' },
  nutrition: { iconName: 'restaurant', dimensionId: 'health' },
  strength: { iconName: 'barbell', dimensionId: 'body' },
  dexterity: { iconName: 'flash', dimensionId: 'body' },
  learn: { iconName: 'book', dimensionId: 'mind' },
  contemplate: { iconName: 'leaf', dimensionId: 'mind' },
  money: { iconName: 'wallet', dimensionId: 'wealth' },
  career: { iconName: 'briefcase', dimensionId: 'wealth' },
  circle: { iconName: 'people', dimensionId: 'bonds' },
  romance: { iconName: 'heart', dimensionId: 'bonds' },
  play: { iconName: 'game-controller', dimensionId: 'craft' },
  build: { iconName: 'construct', dimensionId: 'craft' },
};
/** app/theme/dimensions.ts › DIMENSION_META.iconName (o ícone da dimensão: a linha de Feitas hoje) */
export const DIM_ICON: Record<DimensionId, string> = {
  health: 'heart',
  body: 'fitness',
  mind: 'sparkles',
  wealth: 'cash',
  bonds: 'people',
  craft: 'color-palette',
};
export const dimColor = (d: DimensionId) => tokens.dimension[d];
export const dimBg = (d: DimensionId) => tokens.dimensionBg[d];

export type PracticeFx = {
  id: string;
  title: Bi;
  /** sub-áreas com as estrelas de cada uma (task_sub); a 1ª é a primária */
  subs: { sub: SubId; stars: number }[];
};
export type PracticesFixture = {
  /** o dia mostrado (AAAA-MM-DD), hoje */
  date: string;
  xp: number;
  coins: number;
  lockedTabs?: string[];
  /** as práticas abertas hoje, na ordem de Gerenciar */
  practices: PracticeFx[];
  /** o cartão do Recanto (só aparece com Aprender trancado); sem imagem, o ícone da lâmpada */
  recanto?: { title: Bi; dimension: DimensionId };
};

export const PRACTICES_FIXTURES: Record<string, PracticesFixture> = Object.fromEntries(
  Object.entries(RAW as Record<string, unknown>).filter(([k]) => !k.startsWith('_')),
) as Record<string, PracticesFixture>;

export const practicesFixture = (name: string): PracticesFixture => {
  const fx = PRACTICES_FIXTURES[name];
  if (!fx) throw new Error(`fixture de Práticas inexistente: ${name} (tem: ${Object.keys(PRACTICES_FIXTURES).join(', ')})`);
  return fx;
};

/** a dimensão primária (a da 1ª sub-área): a borda e o ícone do cartão */
export const primaryDim = (p: PracticeFx): DimensionId => SUB_META[p.subs[0].sub].dimensionId;
/** rewardForTaskSubs (app/lib/xp.ts): 10 por estrela, moedas = XP × 1 (ajuste Igual) */
export const practiceReward = (p: PracticeFx) => {
  const xp = p.subs.reduce((s, x) => s + x.stars * 10, 0);
  return { xp, coins: xp };
};

/** formatHeroDate (app/lib/time.ts): "Segunda," + "9 de nov" · "Monday," + "Nov 9" */
export const heroDate = (iso: string, lang: Lang) => {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const tag = lang === 'pt' ? 'pt-BR' : 'en-US';
  const raw = date.toLocaleDateString(tag, { weekday: 'long' }).replace(/-feira$/i, '');
  const weekday = `${raw.charAt(0).toUpperCase()}${raw.slice(1)},`;
  const monthDay = date.toLocaleDateString(tag, { month: 'short', day: 'numeric' }).replace(/\.$/, '');
  return { weekday, monthDay };
};
