import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect } from 'react';

import { track } from '@/lib/analytics';
import type {
  JoinPartnerCampaignResult,
  PartnerCampaign,
  PartnerCampaignSource,
  PartnerCampaignStatus,
} from '@/lib/db/types';
import { supabase } from '@/lib/supabase';

import { characterKeys } from './character';
import { dateKeyFromLocal } from './history';
import { invalidateTaskSurfaces } from './tasks';

/**
 * Partner campaigns (Programa Paker Health, migration 20261104000009): a
 * sponsored "event" — join, adopt the campaign's catalog practice, keep a
 * streak, unlock a coupon.
 *
 * The client only DISPLAYS progress. The streak is counted by the server
 * (`partner_campaign_status`, the same walk `claim_partner_coupon` re-runs
 * before writing the claim), over completions it stamped itself — so no
 * client-side count here can unlock anything. The coupon code never leaves
 * `partner_campaign_secret` except through those two RPCs, once claimed.
 *
 * Never gated on modules or Premium: the campaign is for every account.
 */

export const partnerKeys = {
  all: ['partners'] as const,
  active: () => [...partnerKeys.all, 'active'] as const,
  campaign: (id: string) => [...partnerKeys.all, 'campaign', id] as const,
  /** Every campaign's progress. Task mutations (complete / undo / skip /
   *  adopt / archive…) bust this prefix from lib/api/tasks.ts, spelled out
   *  there so the import stays one-way (partners → tasks). */
  statuses: () => [...partnerKeys.all, 'status'] as const,
  status: (campaignId: string) => [...partnerKeys.statuses(), campaignId] as const,
  /** Keyed by the local day too: the first render after midnight asks the
   *  server again instead of showing yesterday's "done today". */
  statusOn: (campaignId: string, today: string) =>
    [...partnerKeys.status(campaignId), today] as const,
};

/** A campaign row plus its practice's catalog title (embedded through the
 *  `template_id` FK — the catalog is pt-only, like Sugeridas). */
export interface PartnerCampaignWithPractice extends PartnerCampaign {
  practice: { title: string; icon: string | null } | null;
}

// Explicit list instead of `*`: the row type above is the contract, and the
// embed rides along in the same round-trip.
const CAMPAIGN_SELECT = `id, partner_name, partner_url, title_pt, title_en,
  pitch_pt, pitch_en, reward_pt, reward_en, material_slug, template_id,
  streak_goal, max_skips, starts_at, ends_at, is_active, created_at,
  practice:task_template ( title, icon )`;

/**
 * The campaign the Home card advertises: the newest one RLS lets through
 * (it only returns campaigns inside their active window), or null.
 */
export function useActivePartnerCampaign(opts: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: partnerKeys.active(),
    enabled: opts.enabled ?? true,
    // Campaigns change by migration/Studio, a few times a year.
    staleTime: 1000 * 60 * 60,
    queryFn: async (): Promise<PartnerCampaignWithPractice | null> => {
      const { data, error } = await supabase
        .from('partner_campaign')
        .select(CAMPAIGN_SELECT)
        .order('starts_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as PartnerCampaignWithPractice | null;
    },
  });
}

/**
 * One campaign by id — the `/campaign/[id]` screen (deep links included).
 * Null = ended, inactive or unknown: RLS hides all three the same way.
 * Opening from the Home card paints instantly from the active-campaign
 * cache while this confirms it.
 */
export function usePartnerCampaign(id: string | null | undefined) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: id ? partnerKeys.campaign(id) : [...partnerKeys.all, 'campaign', 'none'],
    enabled: !!id,
    staleTime: 1000 * 60 * 60,
    placeholderData: () => {
      const active = queryClient.getQueryData<PartnerCampaignWithPractice | null>(
        partnerKeys.active(),
      );
      return active && active.id === id ? active : undefined;
    },
    queryFn: async (): Promise<PartnerCampaignWithPractice | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('partner_campaign')
        .select(CAMPAIGN_SELECT)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as PartnerCampaignWithPractice | null;
    },
  });
}

/**
 * The caller's progress in a campaign, as the server counts it. Works for
 * non-members too (`member: false`), so a practice adopted from Sugeridas
 * before joining already shows its streak.
 *
 * `p_today` is the device's local day; the server accepts only its own UTC
 * day ±1, so a wrong device clock fails loudly instead of shifting the run.
 */
export function usePartnerCampaignStatus(
  campaignId: string | null | undefined,
  opts: { enabled?: boolean } = {},
) {
  const today = dateKeyFromLocal(new Date());
  return useQuery({
    queryKey: campaignId
      ? partnerKeys.statusOn(campaignId, today)
      : [...partnerKeys.statuses(), 'none'],
    enabled: !!campaignId && (opts.enabled ?? true),
    queryFn: async (): Promise<PartnerCampaignStatus | null> => {
      if (!campaignId) return null;
      const { data, error } = await supabase.rpc('partner_campaign_status', {
        p_campaign_id: campaignId,
        p_today: today,
      });
      if (error) throw error;
      return data as PartnerCampaignStatus;
    },
  });
}

/** Merge `patch` into every cached status of `campaignId` (today's, and a
 *  stale yesterday's if the screen straddled midnight). Bridges the round-trip
 *  between a mutation and the refetch, so a button can't be tapped twice. */
function patchStatus(
  queryClient: QueryClient,
  campaignId: string,
  patch: Partial<PartnerCampaignStatus>,
) {
  queryClient.setQueriesData<PartnerCampaignStatus | null>(
    { queryKey: partnerKeys.status(campaignId) },
    (old) => (old ? { ...old, ...patch } : old),
  );
}

/**
 * Join a campaign. Idempotent on the server (the first `joined_at` wins).
 * Membership is the partner's tracking base, and what claiming requires.
 */
export function useJoinPartnerCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      campaignId: string;
      source: PartnerCampaignSource;
    }): Promise<JoinPartnerCampaignResult> => {
      const { data, error } = await supabase.rpc('join_partner_campaign', {
        p_campaign_id: params.campaignId,
        p_source: params.source,
      });
      if (error) throw error;
      return data as JoinPartnerCampaignResult;
    },
    onSuccess: (data, params) => {
      patchStatus(queryClient, params.campaignId, {
        member: true,
        joined_at: data.joined_at,
      });
      track('campaign_joined', { campaign: params.campaignId, source: params.source });
    },
    onSettled: (_data, _err, params) => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.status(params.campaignId) });
    },
  });
}

/**
 * Adopt the campaign's practice — `start_task_from_template` with the bare
 * template id and NO overrides. Deliberately not the periodicity sheet of
 * Sugeridas: the streak is judged per calendar day, so the practice keeps
 * the template's daily cadence. Same invalidations as
 * useStartTaskFromTemplate (task surfaces + character), which already
 * include every campaign's status.
 *
 * Free-tier: catalog adoptions are unlimited, but a `free_limit_reached`
 * still surfaces through the global limit modal (root MutationCache).
 */
export function useAdoptCampaignPractice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      campaign: Pick<PartnerCampaign, 'id' | 'template_id'>,
    ): Promise<string> => {
      const { data, error } = await supabase.rpc('start_task_from_template', {
        p_template_id: campaign.template_id,
        p_task_type_override: null,
        p_recurrence_override: null,
        p_target_count_override: null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (taskId, campaign) => {
      patchStatus(queryClient, campaign.id, { adopted: true, task_id: taskId });
      track('campaign_practice_adopted', { campaign: campaign.id });
      invalidateTaskSurfaces(queryClient);
      queryClient.invalidateQueries({ queryKey: characterKeys.me() });
    },
  });
}

/**
 * Claim the coupon. The server recomputes the streak with the same walk as
 * the status read and refuses below the goal (`streak_not_reached`) or
 * without membership (`not_a_member`). The claim is permanent: undoing a
 * completion afterwards doesn't take the coupon back. Returns the status
 * object (now `claimed`), with the code once the partner released it.
 * `auto` marks the claim useAutoClaimPartnerCoupon fires, in analytics.
 */
export function useClaimPartnerCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      campaignId: string;
      auto?: boolean;
    }): Promise<PartnerCampaignStatus> => {
      const { data, error } = await supabase.rpc('claim_partner_coupon', {
        p_campaign_id: params.campaignId,
        p_today: dateKeyFromLocal(new Date()),
      });
      if (error) throw error;
      return data as PartnerCampaignStatus;
    },
    onSuccess: (data, params) => {
      patchStatus(queryClient, params.campaignId, data);
      track(
        'campaign_coupon_claimed',
        params.auto
          ? { campaign: params.campaignId, auto: true }
          : { campaign: params.campaignId },
      );
    },
    onSettled: (_data, _err, params) => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.status(params.campaignId) });
    },
  });
}

/** Campaigns with an auto-claim already fired this session — one request
 *  per campaign even with the Home card and the screen mounted together. */
const autoClaimFired = new Set<string>();

/**
 * Make an unlock permanent the moment the server reports it. `unlocked` is
 * recomputed on every read (`claimed or streak >= goal`), so an unlock that
 * nobody claims lasts only as long as the streak: reach day 28, miss day 29,
 * and it is gone. For a MEMBER the claim needs nothing more from them, so it
 * is sent on their behalf as soon as `member && unlocked && !claimed` shows
 * up — the "Get my coupon" tap is left with revealing the code. A
 * non-member still has to join first (membership is the partner's tracking
 * base, never implied), which the screen's claim button does in the same
 * tap.
 *
 * A failure clears the mark so a later mount can retry; it can't loop: the
 * claim's onSettled refetches the status, and a refused claim
 * (`streak_not_reached`) comes back no longer unlocked.
 */
export function useAutoClaimPartnerCoupon(status: PartnerCampaignStatus | null | undefined) {
  const { mutate } = useClaimPartnerCoupon();
  const campaignId = status?.campaign_id ?? null;
  const due = status != null && status.member && status.unlocked && !status.claimed;
  useEffect(() => {
    if (!due || !campaignId || autoClaimFired.has(campaignId)) return;
    autoClaimFired.add(campaignId);
    mutate(
      { campaignId, auto: true },
      { onError: () => autoClaimFired.delete(campaignId) },
    );
  }, [due, campaignId, mutate]);
}
