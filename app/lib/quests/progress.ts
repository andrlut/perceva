import type { QuestWithProgress } from '@/lib/db/types';

/**
 * Single source of truth for "how full is this quest".
 *
 * This lived inline in several quest surfaces (QuestCard, QuestChipsStrip,
 * quest-detail) and each copy drifted, so the same quest rendered a
 * different number on every surface — the board said `40 / 100 ⭐`, the Home
 * chip said `0/1`, and the detail screen said `0 / 0`.
 *
 * Precedence matters: `accumulate_sub_stars` is checked BEFORE `challenge`,
 * because the 12 seeded sub-star templates carry `quest_type='challenge'`
 * with a null `challenge_target_value`. Reading `quest_type` first yields a
 * target of 0 and pins those quests at 0% forever.
 */
export function questProgressRatio(data: QuestWithProgress): number {
  // TODOS os requisitos sub_stars, não o primeiro: desde 20260904000002 uma
  // missão personalizada pode exigir estrelas em vários subs ao mesmo tempo
  // ("30★ em nutrição E 20★ em força neste mês"), e ler só um deles fixaria
  // a barra no progresso de um sub qualquer. Com um único requisito o
  // resultado é idêntico ao anterior, então nenhuma quest existente muda.
  const subStarsReqs = data.requirements.filter(
    (r) => r.requirement.kind === 'accumulate_sub_stars',
  );

  if (subStarsReqs.length > 0) {
    return aggregateProgress(subStarsReqs);
  }

  if (data.quest.quest_type === 'challenge') {
    const target = Number(data.quest.challenge_target_value ?? 0);
    return target > 0 ? Math.min(1, data.currentChallengeValue / target) : 0;
  }

  return aggregateProgress(data.requirements);
}

function aggregateProgress(reqs: QuestWithProgress['requirements']): number {
  if (reqs.length === 0) return 0;
  let sum = 0;
  for (const r of reqs) {
    const target =
      r.requirement.kind === 'reach_skill_value'
        ? Number(r.requirement.min_value ?? 0)
        : Number(r.requirement.target_count ?? 0);
    if (target <= 0) continue;
    sum += Math.min(1, r.currentCount / target);
  }
  return sum / reqs.length;
}
