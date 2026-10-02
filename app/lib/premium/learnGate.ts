import { useCallback } from 'react';

import { PREMIUM_LEARN_ENABLED } from './constants';
import { useIsPremium } from './useIsPremium';

/**
 * Gate mensal do Recanto (decisão Artur/André, 2026-10-02):
 *
 *   Free    → abre materiais publicados NO MÊS CALENDÁRIO CORRENTE
 *             (espelha a seção "Novidades do mês" que o usuário já vê).
 *   Premium → acervo completo.
 *
 * Enforcement v1 é no cliente (o conteúdo é público no bucket); RLS por
 * `released_at` fica mapeado pra uma fase futura. `PREMIUM_LEARN_ENABLED`
 * é o kill-switch: desligado, nada tranca — via OTA se preciso.
 *
 * "Mês corrente" usa o relógio do aparelho de propósito: vira o mês local,
 * destrava o acervo novo local — mesma régua do rótulo "Novidades do mês".
 */
export function isMaterialLockedFor(
  releasedAt: string | null | undefined,
  isPremium: boolean,
): boolean {
  if (!PREMIUM_LEARN_ENABLED || isPremium || !releasedAt) return false;
  const released = new Date(releasedAt);
  if (Number.isNaN(released.getTime())) return false;
  const now = new Date();
  return (
    released.getFullYear() !== now.getFullYear() ||
    released.getMonth() !== now.getMonth()
  );
}

/** Hook: devolve o predicado de tranca já amarrado ao tier do usuário.
 *  Estável entre renders (useCallback) — listas memoizadas dependem disso. */
export function useMaterialLock(): (releasedAt?: string | null) => boolean {
  const isPremium = useIsPremium();
  return useCallback(
    (releasedAt?: string | null) => isMaterialLockedFor(releasedAt, isPremium),
    [isPremium],
  );
}
