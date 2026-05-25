import type { RewardCategory } from '@/lib/db/types';

import { tokens } from './tokens';

/**
 * Visual identity per reward category. Display strings (label) are NOT
 * in this struct — they live in `rewards.categories.*` in the i18n
 * catalog. Consumers do `t('rewards.categories.' + reward.category)` to
 * render the localized name. This keeps the meta constant pure
 * presentation (icon + color tokens) and avoids drift between locales.
 */
interface CategoryMeta {
  icon: string;
  color: string;
  bg: string;
}

export const REWARD_CATEGORY_META: Record<RewardCategory, CategoryMeta> = {
  indulgence: {
    icon: 'flash',
    color: tokens.semantic.coin,
    bg: 'rgba(255, 200, 61, 0.16)',
  },
  good: {
    icon: 'bag-handle',
    color: tokens.brand.violet2,
    bg: 'rgba(155, 130, 255, 0.16)',
  },
  experience: {
    icon: 'sparkles',
    color: tokens.dimension.bonds,
    bg: 'rgba(77, 208, 255, 0.16)',
  },
};

export const REWARD_CATEGORY_ORDER: RewardCategory[] = [
  'indulgence',
  'good',
  'experience',
];
