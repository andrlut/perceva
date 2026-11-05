import { useEffect } from 'react';

import { pickSubScores, useCharacter } from '@/lib/api/character';
import { useCompletionStats } from '@/lib/api/history';
import { useReadMaterialIds } from '@/lib/api/learning';
import { useLastWellbeingSession } from '@/lib/api/psych';
import { useSession } from '@/lib/auth';
import { GUIDED_MODULES } from '@/lib/tour/constants';
import { useTourStore } from '@/lib/tour/store';

import { UNLOCK_GATES_ENABLED, UNLOCK_TRIGGERS } from './constants';
import { useUnlockStore } from './store';

/**
 * Mounted once (tabs layout): hydrates the unlock store for the signed-in
 * user and turns usage into unlocks.
 *
 *   rewards      ← N practices done (UNLOCK_TRIGGERS.rewardsAfterCompletions)
 *   me           ← the 1-min self-assessment (any "self" sub score > 0,
 *                  same signal as the Percebida panel) OR the avaliacao_v2
 *                  questionnaire completed
 *   me_practiced ← N distinct days with a practice done
 *   me_desired   ← me + me_practiced
 *   learning     ← ever read a material (older habit) — otherwise manual
 *
 * Taking the opt-in guided tour opens the three tabs at once: the tour
 * walks through all of them, and a locked tab mid-tour would be a dead end.
 *
 * Signals come from queries the completion/assessment mutations already
 * invalidate, so an unlock lands on the next render after the action.
 */
export function useUnlockProgress(): void {
  const { user } = useSession();
  const hydrate = useUnlockStore((s) => s.hydrate);
  const unlock = useUnlockStore((s) => s.unlock);
  const status = useUnlockStore((s) => s.status);
  const unlocked = useUnlockStore((s) => s.unlocked);

  const stats = useCompletionStats();
  const assessment = useLastWellbeingSession();
  const character = useCharacter();
  const reads = useReadMaterialIds();
  const tourActive = useTourStore((s) =>
    GUIDED_MODULES.some((m) => {
      const st = s.modules[m]?.status;
      return st === 'pending' || st === 'in_progress';
    }),
  );

  useEffect(() => {
    if (user?.id) void hydrate(user.id, user.created_at ?? null);
  }, [user?.id, user?.created_at, hydrate]);

  const total = stats.data?.total ?? 0;
  const days = stats.data?.days ?? 0;
  const selfScores = character.data ? pickSubScores(character.data.subScores, 'self') : null;
  const selfAssessed = selfScores ? [...selfScores.values()].some((v) => v > 0) : false;
  const assessed = assessment.data != null || selfAssessed;
  const hasRead = (reads.data?.size ?? 0) > 0;

  useEffect(() => {
    if (!UNLOCK_GATES_ENABLED || status !== 'ready') return;
    if (!unlocked.rewards && total >= UNLOCK_TRIGGERS.rewardsAfterCompletions) {
      void unlock('rewards', 'progress');
    }
    if (!unlocked.me && assessed) void unlock('me', 'progress');
    if (!unlocked.me_practiced && days >= UNLOCK_TRIGGERS.practicedAfterDays) {
      void unlock('me_practiced', 'progress');
    }
    if (!unlocked.me_desired && unlocked.me && unlocked.me_practiced) {
      void unlock('me_desired', 'progress');
    }
    if (!unlocked.learning && hasRead) void unlock('learning', 'progress');
    if (tourActive) {
      for (const f of ['rewards', 'learning', 'me'] as const) {
        if (!unlocked[f]) void unlock(f, 'manual');
      }
    }
  }, [status, unlocked, total, days, assessed, hasRead, tourActive, unlock]);
}
