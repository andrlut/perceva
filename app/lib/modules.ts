import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import {
  characterKeys,
  useCharacter,
  type CharacterWithProfile,
} from '@/lib/api/character';
import { supabase } from '@/lib/supabase';

/**
 * Per-user opt-in modules — the foundation of the "simple by default,
 * powerful by choice" direction. `profile.modules` (jsonb) stores only the
 * keys the user explicitly flipped; everything else falls back to
 * MODULE_DEFAULTS, so shipping a new module never rewrites stored rows.
 *
 * Module ≠ premium. A module flag decides what EXISTS in the user's app;
 * `subscription_tier` decides how deep it goes. The two never mix — a module
 * that is OFF must never route to /premium, and a premium teaser must never
 * mention modules.
 *
 * Derived from the shared `character/me` query (useIsPremium precedent):
 * zero extra fetch, survives reinstall, syncs across devices.
 */
export type ModuleKey = 'semana';

export const MODULE_DEFAULTS: Record<ModuleKey, boolean> = {
  // "Minha Semana" — ON by default for the current tester base. The
  // simple/complete preset UX (a future project) will own new-user defaults.
  semana: true,
};

export function useModules(): Record<ModuleKey, boolean> {
  const { data } = useCharacter();
  const stored = (data?.profile.modules ?? {}) as Partial<
    Record<ModuleKey, boolean>
  >;
  return { ...MODULE_DEFAULTS, ...stored };
}

export function useModuleEnabled(key: ModuleKey): boolean {
  return useModules()[key];
}

/**
 * Route gate for module-owned screens — call at the top of every screen a
 * module owns. Bounces home once the profile has loaded and the module is
 * off (covers deep links). Returns fail-closed: `false` until the profile
 * loads, so screens can feed it straight into their query `enabled` and
 * never fetch for a module the user turned off.
 */
export function useRequireModule(key: ModuleKey): boolean {
  const router = useRouter();
  const { data } = useCharacter();
  const enabled = useModuleEnabled(key);
  const ready = data != null;
  useEffect(() => {
    if (ready && !enabled) router.replace('/');
  }, [ready, enabled, router]);
  return ready && enabled;
}

/**
 * Flip one module flag. Read-modify-write over the cached profile so unknown
 * keys written by newer app versions are preserved (forward-compat across
 * OTA updates); last-write-wins between devices is acceptable single-user.
 */
export function useSetModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { key: ModuleKey; value: boolean }) => {
      const cached = qc.getQueryData<CharacterWithProfile>(characterKeys.me());
      if (!cached) throw new Error('Profile not loaded yet');
      const next = { ...cached.profile.modules, [params.key]: params.value };
      const { error } = await supabase
        .from('profile')
        .update({ modules: next })
        .eq('id', cached.profile.id);
      if (error) throw error;
    },
    onMutate: async (params) => {
      await qc.cancelQueries({ queryKey: characterKeys.me() });
      const prev = qc.getQueryData<CharacterWithProfile>(characterKeys.me());
      if (prev) {
        qc.setQueryData<CharacterWithProfile>(characterKeys.me(), {
          ...prev,
          profile: {
            ...prev.profile,
            modules: { ...prev.profile.modules, [params.key]: params.value },
          },
        });
      }
      return { prev };
    },
    onError: (_err, _params, ctx) => {
      if (ctx?.prev) qc.setQueryData(characterKeys.me(), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: characterKeys.me() });
    },
  });
}
