// Tipos dos dados de mentira da aba Aprender (Recanto). Os dados moram em
// learning.fixtures.json porque o lint (scripts/tour.mjs, em node) também os lê.
import type { Lang } from './i18n';
import RAW from './learning.fixtures.json';

export type Bi = { pt: string; en: string };
export type DimId = 'health' | 'body' | 'mind' | 'wealth' | 'bonds' | 'craft';
export type MaterialFx = {
  slug: string;
  title: Bi;
  summary: Bi;
  dim: DimId;
  /** a primeira sub-área (card.subs[0]): ícone + rótulo na linha de baixo da capa */
  sub: string;
  category: 'research' | 'book' | 'foundation';
  /** ideias publicadas do material e quantas a pessoa já absorveu */
  ideas: number;
  collected: number;
  /** capa em public/img/<cover>.webp */
  cover: string;
  read?: boolean;
  hasVideo?: boolean;
};
export type LearningFixture = {
  /** o acervo inteiro (chips Pendentes/Concluídos/Todos, "N novos" do Explorar) */
  catalog: { total: number; read: number; exploreNew: number };
  favorites: number;
  trainDue: number;
  /** ideias absorvidas sem revisão: o número violeta na lâmpada */
  pendingReviews: number;
  /** slug do Continue lendo (null = sem o cartão) */
  continue: string | null;
  exploreThumbs: { img: string; dim: DimId }[];
  /** os slugs da fileira Novidades do mês, na ordem */
  novidades: string[];
  materials: MaterialFx[];
  lockedTabs?: string[];
};

export const LEARNING_FIXTURES: Record<string, LearningFixture> = Object.fromEntries(
  Object.entries(RAW as Record<string, unknown>).filter(([k]) => !k.startsWith('_')),
) as Record<string, LearningFixture>;

export const learningFixture = (name: string): LearningFixture => {
  const fx = LEARNING_FIXTURES[name];
  if (!fx) throw new Error(`fixture do Recanto inexistente: ${name} (tem: ${Object.keys(LEARNING_FIXTURES).join(', ')})`);
  return fx;
};

export const materialBySlug = (fx: LearningFixture, slug: string) => {
  const m = fx.materials.find((x) => x.slug === slug);
  if (!m) throw new Error(`material "${slug}" não está na fixture`);
  return m;
};

export const matTitle = (m: MaterialFx, lang: Lang) => m.title[lang];
