import type { EntityLimit, LimitedEntity } from './limits';
import { useLimitModalStore } from './limitModalStore';

/**
 * Gate an action behind an entity's free limit. Returns a guard that
 * either runs the action or opens the global limit modal when the user
 * is at the cap.
 *
 * Takes the `EntityLimit` as an argument (instead of resolving it from
 * the entity) because callers already hold it for UI like
 * LimitCounterBadge — passing it in keeps a single subscription per
 * screen and keeps this hook free of per-entity query wiring.
 */
export function useLimitGuard(
  limit: EntityLimit,
  entity: LimitedEntity,
): (action: () => void) => void {
  const openLimit = useLimitModalStore((s) => s.open);
  return (action) => {
    if (limit.atLimit) {
      openLimit(entity);
      return;
    }
    action();
  };
}
