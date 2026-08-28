import { useRewards } from '@/lib/api/rewards';
import { useQuests } from '@/lib/api/quests';
import { useSkillStates } from '@/lib/api/skills';
import { useActiveTasks } from '@/lib/api/tasks';

import { computeEntityLimit, type EntityLimit } from './limits';
import { useIsPremium } from './useIsPremium';

/**
 * Per-entity free-limit hooks. Each reuses the list query the owning screen
 * already loads (TanStack dedupes), so the create button and the list share
 * one fetch. Premium users always come back `unlimited`.
 */

export function useTaskLimit(): EntityLimit {
  const isPremium = useIsPremium();
  const { data } = useActiveTasks();
  return computeEntityLimit('task', data?.length ?? 0, isPremium);
}

export function useRewardLimit(): EntityLimit {
  const isPremium = useIsPremium();
  const { data } = useRewards();
  return computeEntityLimit('reward', data?.length ?? 0, isPremium);
}

export function useSkillLimit(enabled = true): EntityLimit {
  const isPremium = useIsPremium();
  // Same contract as useQuestLimit: module-gated screens pass their gate.
  const { data } = useSkillStates({ enabled });
  // useSkillStates returns catalog (character_id null) + user-owned rows; the
  // limit is on custom (user-owned) skills only.
  const count = (data ?? []).filter((s) => s.skill.character_id != null).length;
  return computeEntityLimit('skill', count, isPremium);
}

export function useQuestLimit(enabled = true): EntityLimit {
  const isPremium = useIsPremium();
  // Module-gated screens pass their gate here so a bounced deep link never
  // fires the quest fetch just to count toward a limit badge.
  const { data } = useQuests({ enabled });
  const count = (data ?? []).filter((q) => q.quest.status === 'active').length;
  return computeEntityLimit('quest', count, isPremium);
}
