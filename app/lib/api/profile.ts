import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ProfileIdentity } from '@/lib/db/types';
import { supabase } from '@/lib/supabase';

import { characterKeys } from './character';

/**
 * Update the user's display_name. Re-fetches character/me on success so
 * any header / hero card greeting picks up the new name immediately.
 */
export function useUpdateDisplayName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (displayName: string) => {
      const trimmed = displayName.trim();
      if (trimmed.length < 1) throw new Error('Username cannot be empty');
      if (trimmed.length > 40) throw new Error('Username is too long (max 40 chars)');

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const userId = userData.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profile')
        .update({ display_name: trimmed })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: characterKeys.me() });
    },
  });
}

/** Limites espelhados dos checks da migration 20260908000001. */
export const PROFESSION_MAX = 80;
export const ABOUT_MAX = 600;

/**
 * Grava profissão e a nota de contexto.
 *
 * Colunas próprias, então update direto — não precisa do read-modify-write
 * que o jsonb exige. Vazio vira NULL em vez de string vazia, para "não
 * preenchi" e "apaguei" serem a mesma coisa no banco.
 */
export function useUpdateAbout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (v: { profession: string; about: string }) => {
      const profession = v.profession.trim().slice(0, PROFESSION_MAX);
      const about = v.about.trim().slice(0, ABOUT_MAX);

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const userId = userData.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profile')
        .update({
          profession: profession || null,
          about: about || null,
        })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: characterKeys.me() });
    },
  });
}

/**
 * Escreve em `profile.identity` sem apagar o que não foi passado.
 *
 * Read-modify-write sobre o cache, igual ao `useSetModule`: o objeto é
 * compartilhado por título, paleta e órbita, e um update cru substituiria
 * o jsonb inteiro — trocar a paleta apagaria o título. Preservar chaves
 * desconhecidas também é compatibilidade pra frente: uma versão OTA mais
 * nova pode gravar campos que esta ainda não conhece.
 */
export function useSetIdentity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<ProfileIdentity>) => {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const userId = userData.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const { data: row, error: readErr } = await supabase
        .from('profile')
        .select('identity')
        .eq('id', userId)
        .single();
      if (readErr) throw readErr;

      const current = (row?.identity ?? {}) as ProfileIdentity;
      const next: ProfileIdentity = { ...current, ...patch };

      // `best` é marca máxima: SÓ SOBE. O spread acima é raso, então um
      // patch vindo de cache velho (outro aparelho, ou esta tela aberta
      // antes de um refetch) substituiria o objeto inteiro e ABAIXARIA a
      // marca — tirando uma paleta que já tinha sido conquistada. O max
      // roda aqui, contra a linha lida do servidor agora há pouco, e não
      // no chamador.
      if (patch.best || current.best) {
        next.best = {
          xp30: Math.max(current.best?.xp30 ?? 0, patch.best?.xp30 ?? 0),
          read30: Math.max(current.best?.read30 ?? 0, patch.best?.read30 ?? 0),
        };
      }

      const { error } = await supabase
        .from('profile')
        .update({ identity: next })
        .eq('id', userId);
      if (error) throw error;
      return next;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: characterKeys.me() });
    },
  });
}
