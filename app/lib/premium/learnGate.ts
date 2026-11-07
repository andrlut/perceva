import { useCallback } from 'react';

import { PREMIUM_LEARN_ENABLED } from './constants';
import { useIsPremium } from './useIsPremium';

/**
 * Gate do acervo do Recanto (decisão Artur/André, 2026-10-02):
 *
 *   Free    → abre materiais publicados nos ÚLTIMOS 30 DIAS — janela móvel,
 *             a MESMA régua da seção "Novidades do mês" (NEW_WINDOW_MS no
 *             learning.tsx). Mês-calendário foi descartado: no dia 1º o free
 *             acordava sem nenhum conteúdo aberto.
 *   Premium → acervo completo.
 *
 * Conteúdo de parceiro (`learning_material.sponsor`, 2026-11-04) NUNCA
 * tranca: faz parte de uma campanha aberta a todo mundo, e trancar no free
 * esconderia justamente o que o parceiro patrocina. Quem chama passa
 * `sponsored` via `sponsorOf(row) != null` (lib/learningSponsor) — material
 * do feed e linha da view `learning_idea_public` servem as duas.
 *
 * Enforcement v1 é no cliente (o conteúdo é público no bucket); RLS por
 * `released_at` fica mapeado pra uma fase futura. `PREMIUM_LEARN_ENABLED`
 * é o kill-switch: desligado, nada tranca — via OTA se preciso.
 */
const FREE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export function isMaterialLockedFor(
  releasedAt: string | null | undefined,
  isPremium: boolean,
  sponsored = false,
): boolean {
  if (!PREMIUM_LEARN_ENABLED || isPremium || sponsored || !releasedAt) return false;
  const released = new Date(releasedAt).getTime();
  if (Number.isNaN(released)) return false;
  return Date.now() - released > FREE_WINDOW_MS;
}

/** Hook: devolve o predicado de tranca já amarrado ao tier do usuário.
 *  Estável entre renders (useCallback) — listas memoizadas dependem disso. */
export function useMaterialLock(): (
  releasedAt?: string | null,
  sponsored?: boolean,
) => boolean {
  const isPremium = useIsPremium();
  return useCallback(
    (releasedAt?: string | null, sponsored?: boolean) =>
      isMaterialLockedFor(releasedAt, isPremium, sponsored),
    [isPremium],
  );
}
