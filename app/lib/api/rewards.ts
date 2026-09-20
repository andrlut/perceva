import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import type { Reward, RewardCategory, RewardTemplate } from '@/lib/db/types';
import { getCurrentLocale, useT } from '@/lib/i18n';
import { pickWithLocale, pickWithLocaleNullable } from '@/lib/i18n/catalog';
import type { LanguageCode } from '@/lib/settings';
import { supabase } from '@/lib/supabase';

import { dateKeyFromLocal, daysBetweenKeys } from './history';

import { characterKeys, type CharacterWithProfile } from './character';

export const rewardKeys = {
  all: ['rewards'] as const,
  active: () => [...rewardKeys.all, 'active'] as const,
  archived: () => [...rewardKeys.all, 'archived'] as const,
  detail: (id: string) => [...rewardKeys.all, 'detail', id] as const,
  templates: () => [...rewardKeys.all, 'templates'] as const,
  bank: () => [...rewardKeys.all, 'bank'] as const,
  used: () => [...rewardKeys.all, 'used'] as const,
  tracked: () => [...rewardKeys.all, 'tracked'] as const,
  gaps: () => [...rewardKeys.all, 'gaps'] as const,
  ownedOneShots: () => [...rewardKeys.all, 'ownedOneShots'] as const,
};

export interface RedemptionEntry {
  id: string;
  reward_id: string;
  redeemed_at: string;
  used_at: string | null;
  cost_paid: number;
  reward_title: string;
  reward_icon: string;
  reward_category: RewardCategory | null;
}

interface RedemptionRewardRef {
  title: string;
  icon: string;
  category: RewardCategory | null;
  reward_template?:
    | { title: string; title_pt: string | null }
    | { title: string; title_pt: string | null }[]
    | null;
}

interface RedemptionRow {
  id: string;
  reward_id: string;
  redeemed_at: string;
  used_at: string | null;
  cost_paid: number;
  reward: RedemptionRewardRef | RedemptionRewardRef[] | null;
}

/** Mesmo join do catálogo que a vitrine usa — o banco e o histórico mostram
 *  os mesmos nomes, e teriam ficado no idioma da adoção sem isto. */
const REDEMPTION_SELECT =
  'id,reward_id,redeemed_at,used_at,cost_paid,' +
  'reward:reward_id(title,icon,category,reward_template:template_id(title,title_pt))';

function mapRedemption(r: RedemptionRow, locale: LanguageCode): RedemptionEntry {
  const reward = Array.isArray(r.reward) ? r.reward[0] : r.reward;
  const joined = reward?.reward_template;
  const tpl = Array.isArray(joined) ? joined[0] : joined;
  return {
    id: r.id,
    reward_id: r.reward_id,
    redeemed_at: r.redeemed_at,
    used_at: r.used_at,
    cost_paid: r.cost_paid,
    reward_title: tpl
      ? pickWithLocale(locale, tpl.title, tpl.title_pt)
      : reward?.title ?? '(removed reward)',
    reward_icon: reward?.icon ?? 'gift',
    reward_category: reward?.category ?? null,
  };
}

/** Igual ao useLocalizeRewards, pro par banco/histórico. */
function useLocalizeRedemptions() {
  const { locale } = useT();
  return useCallback(
    (rows: RedemptionRow[]): RedemptionEntry[] => rows.map((r) => mapRedemption(r, locale)),
    [locale],
  );
}

/** Bought-but-not-yet-used. The "bank". Newest first. */
export function useBankedRewards() {
  return useQuery({
    queryKey: rewardKeys.bank(),
    queryFn: async (): Promise<RedemptionRow[]> => {
      const { data, error } = await supabase
        .from('reward_redemption')
        .select(REDEMPTION_SELECT)
        .is('used_at', null)
        .order('redeemed_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as RedemptionRow[];
    },
    select: useLocalizeRedemptions(),
  });
}

/** Already-used redemptions. The "history". Newest first, capped. */
export function useUsedRewards(limit: number = 50) {
  return useQuery({
    queryKey: rewardKeys.used(),
    queryFn: async (): Promise<RedemptionRow[]> => {
      const { data, error } = await supabase
        .from('reward_redemption')
        .select(REDEMPTION_SELECT)
        .not('used_at', 'is', null)
        .order('used_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as RedemptionRow[];
    },
    select: useLocalizeRedemptions(),
  });
}

export interface RewardFormInput {
  title: string;
  description: string | null;
  cost: number;
  icon: string;
  category: RewardCategory;
  isOneShot: boolean;
}

/** Colunas do catálogo que o join traz junto quando há template_id. */
// SEM espaços de propósito: o parser do PostgREST aceita espaço num embed
// simples, mas rejeita (PGRST100, "unexpected ) expecting ,") assim que
// existe um embed ANINHADO — e o REDEMPTION_SELECT abaixo tem um. As duas
// ficam no mesmo estilo pra ninguém "arrumar" a formatação de volta.
const REWARD_SELECT =
  '*,reward_template:template_id(title,title_pt,description,description_pt)';

interface CatalogText {
  title: string;
  title_pt: string | null;
  description: string | null;
  description_pt: string | null;
}

type RewardRow = Reward & {
  // PostgREST devolve objeto pra to-one, mas já devolveu array em versões
  // anteriores; o mapRedemption logo acima trata o mesmo caso.
  reward_template?: CatalogText | CatalogText[] | null;
};

/**
 * Texto de uma recompensa adotada vem do CATÁLOGO, no idioma do app.
 *
 * Sem isso, o título fica congelado no idioma do dia em que foi adotada — era
 * por isso que a Vault misturava 'Nice dinner out' com 'Pedir Comida' no mesmo
 * app em pt-BR. O vínculo governa só título e descrição: custo, ícone,
 * categoria e is_one_shot continuam sendo escolha do usuário, na linha dele.
 *
 * Recompensa própria (template_id null) ou renomeada (o vínculo é cortado no
 * update) cai no texto guardado, que é o comportamento de sempre.
 */
function localizeReward(row: RewardRow, locale: LanguageCode): Reward {
  const { reward_template: joined, ...reward } = row;
  const tpl = Array.isArray(joined) ? joined[0] : joined;
  if (!tpl) return reward as Reward;
  return {
    ...(reward as Reward),
    title: pickWithLocale(locale, tpl.title, tpl.title_pt),
    description: pickWithLocaleNullable(locale, tpl.description, tpl.description_pt),
  };
}

/** `select` do TanStack preso ao locale — troca de idioma re-renderiza sem
 *  refetch, e a identidade fica estável por idioma (senão todo memo que
 *  depende de `data` recalcularia a cada render). */
function useLocalizeRewards() {
  const { locale } = useT();
  return useCallback(
    (rows: RewardRow[]): Reward[] => rows.map((r) => localizeReward(r, locale)),
    [locale],
  );
}

async function fetchActiveRewards(): Promise<RewardRow[]> {
  const { data, error } = await supabase
    .from('reward')
    .select(REWARD_SELECT)
    .eq('is_archived', false)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as RewardRow[];
}

export function useRewards() {
  return useQuery({
    queryKey: rewardKeys.active(),
    queryFn: fetchActiveRewards,
    select: useLocalizeRewards(),
  });
}

/**
 * Ids das recompensas de compra única que JÁ foram compradas — o que a
 * vitrine da Vault esconde.
 *
 * Derivado de `reward_redemption`, nunca guardado: vender de volta apaga a
 * linha e a recompensa reaparece sozinha; usar mantém a linha e ela continua
 * escondida (a geladeira está na sua casa). Ver 20260920000002.
 *
 * Deliberadamente NÃO filtrado dentro de `useRewards`: aquele hook também
 * alimenta a tela de gerenciar (onde a recompensa comprada precisa continuar
 * editável) e a contagem do limite free (`useEntityLimit`), que tem que bater
 * com o trigger do servidor, o qual conta linhas de `reward` sem olhar resgate.
 */
export function useOwnedOneShotIds() {
  const rewards = useRewards();
  // Sem useMemo de propósito: a queryKey compara por VALOR, então recriar o
  // array a cada render não refaz a busca — só a lista de ids mudando refaz.
  const oneShotIds = (rewards.data ?? []).filter((r) => r.is_one_shot).map((r) => r.id);

  return useQuery({
    enabled: rewards.data != null,
    queryKey: [...rewardKeys.ownedOneShots(), oneShotIds.join(',')],
    queryFn: async (): Promise<Set<string>> => {
      if (oneShotIds.length === 0) return new Set<string>();
      const { data, error } = await supabase
        .from('reward_redemption')
        .select('reward_id')
        .in('reward_id', oneShotIds);
      if (error) throw error;
      return new Set((data ?? []).map((row) => (row as { reward_id: string }).reward_id));
    },
  });
}

export interface RewardGap {
  rewardId: string;
  title: string;
  category: RewardCategory;
  icon: string | null;
  /** Dias desde o último resgate. null = nunca resgatada. */
  daysSinceLast: number | null;
  /** Maior intervalo entre dois resgates consecutivos. null com < 2 resgates. */
  previousBestGapDays: number | null;
  redemptionsTotal: number;
  /** O intervalo atual já passou do maior anterior. */
  isPastPreviousBest: boolean;
}

/**
 * Há quantos DIAS cada recompensa não é resgatada.
 *
 * Esta métrica existia só no MCP (`get_rewards`) e em nenhuma tela do app.
 * Ela importa porque este produto também é usado ao contrário: o dono paga
 * moedas quando faz algo que quer parar. Para esse uso, "quanto gastei" não
 * responde nada — "há quantos dias" responde tudo.
 *
 * DUAS DIVERGÊNCIAS DELIBERADAS do MCP, ambas correções:
 *
 *   1. Ordem. O MCP usa `ascending: true` com limite, então descarta os
 *      resgates MAIS RECENTES quando o histórico passa do limite — que são
 *      exatamente os que determinam o intervalo atual. Aqui a busca é DESC
 *      (mantém os mais recentes) e o array é REVERTIDO por recompensa antes
 *      da matemática, senão os intervalos saem negativos.
 *   2. O guard de 2 resgates. Com um único resgate não existe "intervalo
 *      anterior": o MCP compara contra 0 e marca recorde sempre.
 *
 * Fuso: `dateKeyFromLocal`, do dispositivo — não a constante do servidor.
 */
export function useRewardGaps() {
  const rewards = useRewards();
  return useQuery({
    enabled: rewards.data != null,
    queryKey: rewardKeys.gaps(),
    queryFn: async (): Promise<RewardGap[]> => {
      const { data, error } = await supabase
        .from('reward_redemption')
        .select('reward_id, redeemed_at')
        .order('redeemed_at', { ascending: false })
        .limit(2000);
      if (error) throw error;

      const byReward = new Map<string, string[]>();
      for (const row of (data ?? []) as {
        reward_id: string;
        redeemed_at: string;
      }[]) {
        const slot = byReward.get(row.reward_id) ?? [];
        slot.push(row.redeemed_at);
        byReward.set(row.reward_id, slot);
      }

      const today = dateKeyFromLocal(new Date());

      return (rewards.data ?? []).map((reward): RewardGap => {
        // DESC vindo do banco -> ascendente para a matemática de intervalo.
        const stamps = (byReward.get(reward.id) ?? [])
          .slice()
          .reverse()
          .map((iso) => dateKeyFromLocal(new Date(iso)));

        const total = stamps.length;
        if (total === 0) {
          return {
            rewardId: reward.id,
            title: reward.title,
            category: reward.category,
            icon: reward.icon,
            daysSinceLast: null,
            previousBestGapDays: null,
            redemptionsTotal: 0,
            isPastPreviousBest: false,
          };
        }

        let best: number | null = null;
        for (let i = 1; i < stamps.length; i++) {
          const gap = daysBetweenKeys(stamps[i - 1]!, stamps[i]!);
          if (best === null || gap > best) best = gap;
        }

        const daysSinceLast = daysBetweenKeys(stamps[total - 1]!, today);
        return {
          rewardId: reward.id,
          title: reward.title,
          category: reward.category,
          icon: reward.icon,
          daysSinceLast,
          previousBestGapDays: total >= 2 ? best : null,
          redemptionsTotal: total,
          isPastPreviousBest:
            total >= 2 && best !== null && daysSinceLast > best,
        };
      });
    },
  });
}

/**
 * Archived rewards — the bin behind the Manage screen. Newest archive
 * first so a just-arquivada reward sits at the top for an obvious undo.
 */
export function useArchivedRewards() {
  const localize = useLocalizeRewards();
  return useQuery({
    queryKey: rewardKeys.archived(),
    queryFn: async (): Promise<RewardRow[]> => {
      const { data, error } = await supabase
        .from('reward')
        .select(REWARD_SELECT)
        .eq('is_archived', true)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as RewardRow[];
    },
    select: localize,
  });
}

export function useReward(id: string | null | undefined) {
  const { locale } = useT();
  return useQuery({
    queryKey: id ? rewardKeys.detail(id) : ['rewards', 'detail', 'none'],
    enabled: !!id,
    queryFn: async (): Promise<RewardRow | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('reward')
        .select(REWARD_SELECT)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as unknown as RewardRow;
    },
    select: useCallback(
      (row: RewardRow | null) => (row ? localizeReward(row, locale) : null),
      [locale],
    ),
  });
}

export function useCreateReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RewardFormInput): Promise<string> => {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const userId = userData.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('reward')
        .insert({
          character_id: userId,
          title: input.title,
          description: input.description,
          cost: input.cost,
          icon: input.icon,
          category: input.category,
          is_one_shot: input.isOneShot,
        })
        .select('id')
        .single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rewardKeys.active() });
      queryClient.invalidateQueries({ queryKey: rewardKeys.gaps() });
    },
  });
}

/** Editar o TEXTO de uma recompensa adotada corta o vínculo com o catálogo —
 *  mesma convenção que `task` já usa (o dropTemplateLink em lib/api/tasks.ts).
 *  Renomeou, virou recompensa própria, e o catálogo para de falar por ela.
 *  Custo, ícone, categoria e compra única NÃO cortam: nunca vieram de lá. */
export interface RewardUpdateInput extends RewardFormInput {
  dropTemplateLink?: boolean;
}

export function useUpdateReward(rewardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RewardUpdateInput) => {
      const patch: Record<string, unknown> = {
        title: input.title,
        description: input.description,
        cost: input.cost,
        icon: input.icon,
        category: input.category,
        is_one_shot: input.isOneShot,
      };
      if (input.dropTemplateLink) {
        patch.template_id = null;
      }
      const { error } = await supabase
        .from('reward')
        .update(patch)
        .eq('id', rewardId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rewardKeys.active() });
      queryClient.invalidateQueries({ queryKey: rewardKeys.gaps() });
      queryClient.invalidateQueries({ queryKey: rewardKeys.detail(rewardId) });
    },
  });
}

export function useArchiveReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rewardId: string) => {
      const { error } = await supabase
        .from('reward')
        .update({ is_archived: true, updated_at: new Date().toISOString() })
        .eq('id', rewardId);
      if (error) throw error;
    },
    onSuccess: (_data, rewardId) => {
      queryClient.invalidateQueries({ queryKey: rewardKeys.active() });
      queryClient.invalidateQueries({ queryKey: rewardKeys.gaps() });
      queryClient.invalidateQueries({ queryKey: rewardKeys.archived() });
      queryClient.invalidateQueries({ queryKey: rewardKeys.detail(rewardId) });
      // Tracked row may have pointed at this reward; clearing UX is the
      // caller's job but we re-fetch so the tracked card disappears.
      queryClient.invalidateQueries({ queryKey: rewardKeys.tracked() });
    },
  });
}

/**
 * Move an archived reward back to the active set. Bumps updated_at so
 * the Archived list re-sorts on the next fetch.
 */
export function useRestoreReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rewardId: string) => {
      const { error } = await supabase
        .from('reward')
        .update({ is_archived: false, updated_at: new Date().toISOString() })
        .eq('id', rewardId);
      if (error) throw error;
    },
    onSuccess: (_data, rewardId) => {
      queryClient.invalidateQueries({ queryKey: rewardKeys.active() });
      queryClient.invalidateQueries({ queryKey: rewardKeys.gaps() });
      queryClient.invalidateQueries({ queryKey: rewardKeys.archived() });
      queryClient.invalidateQueries({ queryKey: rewardKeys.detail(rewardId) });
    },
  });
}

/**
 * Hard delete via RPC. Server-side gates block adopted-from-template
 * rewards and any reward with redemption history (caller should surface
 * the error message — it's safe to display verbatim, it's English-only
 * for now since the gates are intentional dead-ends, not edge cases).
 */
export function useDeleteReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rewardId: string) => {
      const { error } = await supabase.rpc('delete_reward', {
        p_reward_id: rewardId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rewardKeys.active() });
      queryClient.invalidateQueries({ queryKey: rewardKeys.gaps() });
      queryClient.invalidateQueries({ queryKey: rewardKeys.archived() });
    },
  });
}

/**
 * Batch reorder the active rewards. Pass the full active list in the
 * order the user wants — sort_order is rewritten 1..N server-side.
 * Optimistic: we update the cached active list immediately so the drag
 * feels weightless, then reconcile on settle.
 */
export function useReorderRewards() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const { error } = await supabase.rpc('reorder_rewards', {
        p_ids: orderedIds,
      });
      if (error) throw error;
    },
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: rewardKeys.active() });
      const prev = queryClient.getQueryData<Reward[]>(rewardKeys.active());
      if (prev) {
        // Rebuild the array in the new order. Any id not found is dropped
        // (shouldn't happen — caller built the list from the same cache).
        const byId = new Map(prev.map((r) => [r.id, r]));
        const next = orderedIds
          .map((id) => byId.get(id))
          .filter((r): r is Reward => !!r);
        queryClient.setQueryData<Reward[]>(rewardKeys.active(), next);
      }
      return { prev };
    },
    onError: (_err, _ids, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(rewardKeys.active(), ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: rewardKeys.active() });
      queryClient.invalidateQueries({ queryKey: rewardKeys.gaps() });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Templates: public catalog users browse to add to their own shop
// ─────────────────────────────────────────────────────────────────────────────

export function useRewardTemplates() {
  return useQuery({
    queryKey: rewardKeys.templates(),
    queryFn: async (): Promise<RewardTemplate[]> => {
      const { data, error } = await supabase
        .from('reward_template')
        .select('*')
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as RewardTemplate[];
    },
  });
}

export function useAddTemplateToShop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (template: RewardTemplate): Promise<string> => {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const userId = userData.user?.id;
      if (!userId) throw new Error('Not authenticated');

      // O texto guardado virou FALLBACK: com template_id setado, quem manda
      // na tela é o catálogo, no idioma do app (ver localizeReward). Este
      // snapshot só reaparece se o usuário renomear — aí o vínculo é cortado
      // e a recompensa passa a ser dele.
      const locale = getCurrentLocale();
      const title = locale === 'pt' && template.title_pt ? template.title_pt : template.title;
      const description =
        locale === 'pt' && template.description_pt
          ? template.description_pt
          : template.description;

      const { data, error } = await supabase
        .from('reward')
        .insert({
          character_id: userId,
          title,
          description,
          cost: template.cost,
          icon: template.icon,
          category: template.category,
          is_one_shot: template.is_one_shot,
          template_id: template.id,
        })
        .select('id')
        .single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rewardKeys.active() });
      queryClient.invalidateQueries({ queryKey: rewardKeys.gaps() });
    },
  });
}

export interface RedeemResult {
  cost_paid: number;
}

/**
 * Calls redeem_reward() RPC. Optimistically deducts coins from the cached
 * character; rolls back on error. Single-unit only — for multi-buy use
 * useRedeemRewardN.
 */
export function useRedeemReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { rewardId: string; cost: number }): Promise<RedeemResult> => {
      const { data, error } = await supabase.rpc('redeem_reward', {
        p_reward_id: params.rewardId,
      });
      if (error) throw error;
      return data as RedeemResult;
    },
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: characterKeys.me() });
      const prevChar = queryClient.getQueryData<CharacterWithProfile>(characterKeys.me());
      if (prevChar) {
        queryClient.setQueryData<CharacterWithProfile>(characterKeys.me(), {
          ...prevChar,
          character: {
            ...prevChar.character,
            // Allow optimistic balance to go negative — mirrors server behaviour
            // since migration 0011 removed the >= 0 clamp on coins.
            coins: prevChar.character.coins - params.cost,
          },
        });
      }
      return { prevChar };
    },
    onError: (_err, _params, ctx) => {
      if (ctx?.prevChar) queryClient.setQueryData(characterKeys.me(), ctx.prevChar);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: characterKeys.me() });
      queryClient.invalidateQueries({ queryKey: rewardKeys.bank() });
      queryClient.invalidateQueries({ queryKey: rewardKeys.gaps() });
      // A vitrine de compra única segue a EXISTÊNCIA da linha de resgate.
      queryClient.invalidateQueries({ queryKey: rewardKeys.ownedOneShots() });
    },
  });
}

export interface RedeemBatchResult {
  qty: number;
  unit_cost: number;
  total_paid: number;
  /** Ids of the redemption rows created, in insert order (oldest first).
   *  The buy celebration uses the first for "enjoy now". Older RPC
   *  versions omit this, hence optional. */
  redemption_ids?: string[];
}

/**
 * Multi-buy via the redeem_reward_n() RPC. Atomic — either all qty
 * units land in the bank or nothing does. Optimistic coin debit
 * mirrors the single-buy hook: drops balance by qty * cost up-front,
 * rolls back on error.
 */
export function useRedeemRewardN() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      rewardId: string;
      cost: number;
      qty: number;
    }): Promise<RedeemBatchResult> => {
      const { data, error } = await supabase.rpc('redeem_reward_n', {
        p_reward_id: params.rewardId,
        p_qty: params.qty,
      });
      if (error) throw error;
      return data as RedeemBatchResult;
    },
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: characterKeys.me() });
      const prevChar = queryClient.getQueryData<CharacterWithProfile>(characterKeys.me());
      if (prevChar) {
        queryClient.setQueryData<CharacterWithProfile>(characterKeys.me(), {
          ...prevChar,
          character: {
            ...prevChar.character,
            coins: prevChar.character.coins - params.cost * params.qty,
          },
        });
      }
      return { prevChar };
    },
    onError: (_err, _params, ctx) => {
      if (ctx?.prevChar) queryClient.setQueryData(characterKeys.me(), ctx.prevChar);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: characterKeys.me() });
      queryClient.invalidateQueries({ queryKey: rewardKeys.bank() });
      queryClient.invalidateQueries({ queryKey: rewardKeys.gaps() });
      // A vitrine de compra única segue a EXISTÊNCIA da linha de resgate.
      queryClient.invalidateQueries({ queryKey: rewardKeys.ownedOneShots() });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Tracking: pin one reward to keep close. Used by the wide goal card on Shop.
// Single row per character (PK on character_id), enforced server-side.
// ─────────────────────────────────────────────────────────────────────────────

/** The id of the reward currently being tracked, or null if none. */
export function useTrackedRewardId() {
  return useQuery({
    queryKey: rewardKeys.tracked(),
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase
        .from('reward_tracking')
        .select('reward_id')
        .maybeSingle();
      if (error) throw error;
      return (data?.reward_id as string | undefined) ?? null;
    },
  });
}

/**
 * Set the tracked reward. Pass `null` to clear.
 * Upsert pattern: character_id is the PK, so re-tracking another reward
 * overwrites the previous row in one round-trip.
 */
export function useSetTrackedReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rewardId: string | null) => {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const userId = userData.user?.id;
      if (!userId) throw new Error('Not authenticated');

      if (rewardId === null) {
        const { error } = await supabase
          .from('reward_tracking')
          .delete()
          .eq('character_id', userId);
        if (error) throw error;
        return null;
      }

      const { error } = await supabase
        .from('reward_tracking')
        .upsert(
          { character_id: userId, reward_id: rewardId, tracked_at: new Date().toISOString() },
          { onConflict: 'character_id' },
        );
      if (error) throw error;
      return rewardId;
    },
    onMutate: async (rewardId) => {
      await queryClient.cancelQueries({ queryKey: rewardKeys.tracked() });
      const prev = queryClient.getQueryData<string | null>(rewardKeys.tracked());
      queryClient.setQueryData<string | null>(rewardKeys.tracked(), rewardId);
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx) queryClient.setQueryData(rewardKeys.tracked(), ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: rewardKeys.tracked() });
    },
  });
}

/** Mark a banked redemption as used (consumed). */
export function useUseReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (redemptionId: string) => {
      const { data, error } = await supabase.rpc('use_reward', {
        p_redemption_id: redemptionId,
      });
      if (error) throw error;
      return data as { used_at: string };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: rewardKeys.bank() });
      queryClient.invalidateQueries({ queryKey: rewardKeys.gaps() });
      // A vitrine de compra única segue a EXISTÊNCIA da linha de resgate.
      queryClient.invalidateQueries({ queryKey: rewardKeys.ownedOneShots() });
      queryClient.invalidateQueries({ queryKey: rewardKeys.used() });
    },
  });
}

/**
 * Sell a banked redemption back for a full coin refund. The redemption
 * row is deleted; consumed (used_at != null) ones are rejected by the
 * RPC. Optimistically removes the row from the bank cache and bumps
 * coins; rolls back the cache on error.
 */
export function useSellReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      redemptionId: string;
      refund: number;
    }): Promise<{ refund: number }> => {
      const { data, error } = await supabase.rpc('sell_reward', {
        p_redemption_id: params.redemptionId,
      });
      if (error) throw error;
      return data as { refund: number };
    },
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: rewardKeys.bank() });
      await queryClient.cancelQueries({ queryKey: characterKeys.me() });
      const prevBank = queryClient.getQueryData<RedemptionEntry[]>(
        rewardKeys.bank(),
      );
      const prevChar = queryClient.getQueryData<CharacterWithProfile>(
        characterKeys.me(),
      );
      if (prevBank) {
        queryClient.setQueryData<RedemptionEntry[]>(
          rewardKeys.bank(),
          prevBank.filter((b) => b.id !== params.redemptionId),
        );
      }
      if (prevChar) {
        queryClient.setQueryData<CharacterWithProfile>(characterKeys.me(), {
          ...prevChar,
          character: {
            ...prevChar.character,
            coins: prevChar.character.coins + params.refund,
          },
        });
      }
      return { prevBank, prevChar };
    },
    onError: (_err, _params, ctx) => {
      if (ctx?.prevBank) queryClient.setQueryData(rewardKeys.bank(), ctx.prevBank);
      if (ctx?.prevChar) queryClient.setQueryData(characterKeys.me(), ctx.prevChar);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: rewardKeys.bank() });
      queryClient.invalidateQueries({ queryKey: rewardKeys.gaps() });
      // A vitrine de compra única segue a EXISTÊNCIA da linha de resgate.
      queryClient.invalidateQueries({ queryKey: rewardKeys.ownedOneShots() });
      queryClient.invalidateQueries({ queryKey: characterKeys.me() });
    },
  });
}

/**
 * Move a used redemption back into the bank. Server-side flips
 * used_at to null on the same row (preserving cost_paid and the
 * original redeemed_at). Optimistically removes from the used cache
 * and adds back to the bank cache.
 */
export function useUnuseReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (redemptionId: string) => {
      const { data, error } = await supabase.rpc('unuse_reward', {
        p_redemption_id: redemptionId,
      });
      if (error) throw error;
      return data as { id: string };
    },
    onMutate: async (redemptionId) => {
      await queryClient.cancelQueries({ queryKey: rewardKeys.bank() });
      await queryClient.cancelQueries({ queryKey: rewardKeys.used() });
      const prevUsed = queryClient.getQueryData<RedemptionEntry[]>(
        rewardKeys.used(),
      );
      const prevBank = queryClient.getQueryData<RedemptionEntry[]>(
        rewardKeys.bank(),
      );
      const moved = prevUsed?.find((r) => r.id === redemptionId);
      if (prevUsed) {
        queryClient.setQueryData<RedemptionEntry[]>(
          rewardKeys.used(),
          prevUsed.filter((r) => r.id !== redemptionId),
        );
      }
      if (prevBank && moved) {
        // Front-load it so the user sees it pop up at the top of the
        // bank immediately. Server-side ordering (by redeemed_at desc)
        // may shuffle on the next refetch — that's fine.
        queryClient.setQueryData<RedemptionEntry[]>(
          rewardKeys.bank(),
          [{ ...moved, used_at: null }, ...prevBank],
        );
      }
      return { prevUsed, prevBank };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prevUsed) queryClient.setQueryData(rewardKeys.used(), ctx.prevUsed);
      if (ctx?.prevBank) queryClient.setQueryData(rewardKeys.bank(), ctx.prevBank);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: rewardKeys.bank() });
      queryClient.invalidateQueries({ queryKey: rewardKeys.gaps() });
      // A vitrine de compra única segue a EXISTÊNCIA da linha de resgate.
      queryClient.invalidateQueries({ queryKey: rewardKeys.ownedOneShots() });
      queryClient.invalidateQueries({ queryKey: rewardKeys.used() });
    },
  });
}
