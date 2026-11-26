import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { track } from '@/lib/analytics';
import type {
  JoinPartnerCampaignResult,
  PartnerCampaign,
  PartnerCampaignSource,
  PartnerCampaignStatus,
  PartnerCouponTier,
} from '@/lib/db/types';
import { supabase } from '@/lib/supabase';

import { characterKeys } from './character';
import { dateKeyFromLocal } from './history';
import { invalidateTaskSurfaces } from './tasks';

/**
 * Partner campaigns (Paker Health, migrations 20261104000009 →
 * 20261116000003_partner_coupons_open): the partner's coupons, open to
 * everyone in Recompensas › Parcerias (one claim per tier, the Premium tier
 * for subscribers), plus the campaign's practices offered as a suggestion.
 *
 * Codes never leave `partner_campaign_secret` except through the status RPC,
 * after the claim. The 4-day streak the server still counts
 * (`streak_days`, `unlocked`, `secure_partner_unlock`) is dormant since
 * 2026-11-25: the app no longer shows it and nothing depends on it.
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

/** A campaign row plus its practices' catalog titles (the catalog is
 *  pt-only, like Sugeridas): `practice` is the main one (through the
 *  `template_id` FK), `tracks` every track the streak counts on, main
 *  included (migration 20261115000002). Read them through
 *  `campaignTracks`, which falls back to the main practice. */
export interface PartnerCampaignWithPractice extends PartnerCampaign {
  practice: CampaignPractice | null;
  tracks: PartnerCampaignTrack[] | null;
}

export interface CampaignPractice {
  title: string;
  icon: string | null;
}

export interface PartnerCampaignTrack {
  template_id: string;
  sort_order: number;
  practice: CampaignPractice | null;
}

/** The practices the person can pick from, in screen order: the tracks,
 *  or the main practice alone for a campaign without rows (older data). */
export function campaignTracks(
  c: Pick<PartnerCampaignWithPractice, 'template_id' | 'practice' | 'tracks'>,
): PartnerCampaignTrack[] {
  const tracks = (c.tracks ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
  if (tracks.length > 0) return tracks;
  return [{ template_id: c.template_id, sort_order: 0, practice: c.practice }];
}

// Explicit list instead of `*`: the row type above is the contract, and the
// embed rides along in the same round-trip.
const CAMPAIGN_SELECT = `id, partner_name, partner_url, title_pt, title_en,
  pitch_pt, pitch_en, reward_pt, reward_en, perceva_reward_pt,
  perceva_reward_en, reward_free_pct, reward_premium_pct, material_slug, template_id,
  streak_goal, max_skips, starts_at, ends_at, is_active, created_at,
  practice:task_template ( title, icon ),
  tracks:partner_campaign_track ( template_id, sort_order, practice:task_template ( title, icon ) )`;

/**
 * The campaign the Home card advertises: the newest one RLS lets through,
 * or null. RLS returns campaigns inside their active window, plus — after
 * it ends or is paused — the one the caller already claimed (migration
 * 20261105000001): the codes are filled in later, and the app is the only
 * place they arrive.
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
 * Null = ended, inactive or unknown: RLS hides all three the same way —
 * except a campaign the caller already claimed, which stays readable.
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
 * Adopt one of the campaign's practices (a track; any of them counts the
 * day) — `start_task_from_template` with the bare template id and NO
 * overrides. Deliberately not the periodicity sheet of
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
    mutationFn: async ({
      templateId,
    }: {
      campaign: Pick<PartnerCampaign, 'id'>;
      templateId: string;
    }): Promise<string> => {
      const { data, error } = await supabase.rpc('start_task_from_template', {
        p_template_id: templateId,
        p_task_type_override: null,
        p_recurrence_override: null,
        p_target_count_override: null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (taskId, { campaign, templateId }) => {
      patchStatus(queryClient, campaign.id, {
        adopted: true,
        task_id: taskId,
        track_template_id: templateId,
      });
      track('campaign_practice_adopted', { campaign: campaign.id, track: templateId });
      invalidateTaskSurfaces(queryClient);
      queryClient.invalidateQueries({ queryKey: characterKeys.me() });
    },
  });
}

/**
 * Claim the coupon in the chosen tier (migration partner_coupons_open): open
 * to anyone, joining the campaign on the way if needed; the Premium tier is
 * refused to a non-subscriber (`premium_required`). One claim per tier, and
 * permanent. Returns the status object (now with that tier claimed and its
 * code once released).
 */
export function useClaimPartnerCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      campaignId: string;
      tier: PartnerCouponTier;
    }): Promise<PartnerCampaignStatus> => {
      const { data, error } = await supabase.rpc('claim_partner_coupon', {
        p_campaign_id: params.campaignId,
        p_today: dateKeyFromLocal(new Date()),
        p_tier: params.tier,
      });
      if (error) throw error;
      return data as PartnerCampaignStatus;
    },
    onSuccess: (data, params) => {
      patchStatus(queryClient, params.campaignId, data);
      track('campaign_coupon_claimed', { campaign: params.campaignId, tier: params.tier });
    },
    onSettled: (_data, _err, params) => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.status(params.campaignId) });
    },
  });
}
