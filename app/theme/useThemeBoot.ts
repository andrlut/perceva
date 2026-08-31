import { useEffect, useState } from 'react';

import { useSettingsStore } from '@/lib/settings';

import { __setActiveTheme, resolveThemePref } from './activeTheme';
import { __applyThemeTokens } from './index';

/**
 * Root-layout gate: resolves the persisted Ajustes theme preference and
 * applies it (live ACTIVE_THEME binding + in-place tokens rewrite)
 * BEFORE the router's Stack renders. The layout must keep returning
 * null until this reports true — that is what guarantees every lazily
 * loaded route module creates its StyleSheets against the final
 * palette. Runs exactly once per JS boot; later changes go through a
 * reload (reloadForTheme).
 */
export function useThemeBoot(): boolean {
  const status = useSettingsStore((s) => s.status);
  const load = useSettingsStore((s) => s.load);
  const pref = useSettingsStore((s) => s.settings.theme);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (status !== 'ready' || applied) return;
    const resolved = resolveThemePref(pref);
    __setActiveTheme(resolved);
    __applyThemeTokens(resolved);
    setApplied(true);
  }, [status, pref, applied]);

  return applied;
}
