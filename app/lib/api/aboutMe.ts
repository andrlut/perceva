import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Profile, ProfileContext } from '@/lib/db/types';
import { supabase } from '@/lib/supabase';

import { characterKeys } from './character';
import { ABOUT_MAX, PROFESSION_MAX } from './profile';

/**
 * "Sobre você" — the card in /perfil and its editor (/sobre-voce).
 *
 * Seven fields, all optional: two live in `profile` (profession, about —
 * "Trabalho ou estudo" and "Seu momento", migration 20260908000001) and five
 * in `profile_context` (20261118000002). The lists below MIRROR the table's
 * check constraints; a value outside them is refused by the database, and the
 * connector (perceva-mcp, update_about_me) carries the same lists.
 */

export const AI_TONES = ['direct', 'warm'] as const;
export const AI_PUSHES = ['none', 'light', 'firm'] as const;
export const BEST_TIMES = ['morning', 'afternoon', 'evening', 'night'] as const;
export const LIFE_PHASES = [
  'studying',
  'early_career',
  'career_growth',
  'changing_course',
  'between_jobs',
  'small_kids',
  'caregiving',
  'retired',
] as const;
export const LIVING_WITH = ['alone', 'partner', 'kids', 'family', 'roommates'] as const;
export const BLOCKERS = [
  'time',
  'energy',
  'money',
  'phone',
  'environment',
  'forgetting',
  'motivation',
  'perfectionism',
  'other_people',
] as const;

export type AiTone = (typeof AI_TONES)[number];
export type AiPush = (typeof AI_PUSHES)[number];
export type BestTime = (typeof BEST_TIMES)[number];
export type LifePhase = (typeof LIFE_PHASES)[number];
export type LivingWith = (typeof LIVING_WITH)[number];
export type Blocker = (typeof BLOCKERS)[number];

/** Limits mirrored from the migration's checks. */
export const AI_AVOID_MAX = 5;
export const AI_AVOID_LEN = 40;
export const FOCUS_LEN = 140;
export const LIFE_PHASE_MAX = 2;
export const BLOCKERS_MAX = 3;

/** The card's seven rows, in order of value (the proposal of 16/11). */
export const ABOUT_FIELDS = [
  'ai',
  'rhythm',
  'focus',
  'phase',
  'blockers',
  'work',
  'moment',
] as const;
export type AboutField = (typeof ABOUT_FIELDS)[number];

/** A clock value the editor handles; null = not set. */
export interface Clock {
  h: number;
  m: number;
}

/** Everything the editor edits, as plain values. */
export interface AboutDraft {
  profession: string;
  about: string;
  aiTone: AiTone | null;
  aiPush: AiPush | null;
  aiAvoid: string[];
  wake: Clock | null;
  sleep: Clock | null;
  workStart: Clock | null;
  workEnd: Clock | null;
  bestTime: BestTime | null;
  focus: string;
  lifePhase: LifePhase[];
  livingWith: LivingWith[];
  blockers: Blocker[];
}

export const EMPTY_ABOUT: AboutDraft = {
  profession: '',
  about: '',
  aiTone: null,
  aiPush: null,
  aiAvoid: [],
  wake: null,
  sleep: null,
  workStart: null,
  workEnd: null,
  bestTime: null,
  focus: '',
  lifePhase: [],
  livingWith: [],
  blockers: [],
};

/** `HH:MM[:SS]` → Clock; anything else → null. */
export function parseClock(raw: string | null | undefined): Clock | null {
  if (!raw) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(raw);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return { h, m: min };
}

/** Clock → `HH:MM` (what Postgres `time` accepts). */
export function clockToSql(c: Clock | null): string | null {
  if (!c) return null;
  return `${String(c.h).padStart(2, '0')}:${String(c.m).padStart(2, '0')}`;
}

function pick<T extends string>(list: readonly T[], values: readonly string[] | null | undefined): T[] {
  return (values ?? []).filter((v): v is T => (list as readonly string[]).includes(v));
}

/** The draft the editor opens with: what is saved now. */
export function draftFrom(
  profile: Pick<Profile, 'profession' | 'about'> | null | undefined,
  ctx: ProfileContext | null | undefined,
): AboutDraft {
  return {
    profession: profile?.profession ?? '',
    about: profile?.about ?? '',
    aiTone: ctx?.ai_tone ?? null,
    aiPush: ctx?.ai_push ?? null,
    aiAvoid: [...(ctx?.ai_avoid ?? [])],
    wake: parseClock(ctx?.wake_time),
    sleep: parseClock(ctx?.sleep_time),
    workStart: parseClock(ctx?.work_start),
    workEnd: parseClock(ctx?.work_end),
    bestTime: ctx?.best_time ?? null,
    focus: ctx?.focus_90d ?? '',
    lifePhase: pick(LIFE_PHASES, ctx?.life_phase),
    livingWith: pick(LIVING_WITH, ctx?.living_with),
    blockers: pick(BLOCKERS, ctx?.blockers),
  };
}

/** Which of the seven fields have something in them. */
export function filledFields(d: AboutDraft): Set<AboutField> {
  const s = new Set<AboutField>();
  if (d.aiTone || d.aiPush || d.aiAvoid.length > 0) s.add('ai');
  if (d.wake || d.sleep || d.workStart || d.workEnd || d.bestTime) s.add('rhythm');
  if (d.focus.trim()) s.add('focus');
  if (d.lifePhase.length > 0 || d.livingWith.length > 0) s.add('phase');
  if (d.blockers.length > 0) s.add('blockers');
  if (d.profession.trim()) s.add('work');
  if (d.about.trim()) s.add('moment');
  return s;
}

/** Normalizes the free-text "topics to avoid": trimmed, no empties, no
 *  case-insensitive repeats, within the limits — same rule as the trigger. */
export function cleanAvoid(items: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const v = raw.trim().slice(0, AI_AVOID_LEN);
    const key = v.toLowerCase();
    if (!v || seen.has(key)) continue;
    seen.add(key);
    out.push(v);
    if (out.length >= AI_AVOID_MAX) break;
  }
  return out;
}

/** The one rule the editor checks before saving: work hours are a pair. */
export function draftProblem(d: AboutDraft): 'workPair' | null {
  return (d.workStart == null) !== (d.workEnd == null) ? 'workPair' : null;
}

/** Columns of `profile_context` the client writes (grants are per column). */
function contextRow(d: AboutDraft) {
  const focus = d.focus.trim().slice(0, FOCUS_LEN);
  return {
    ai_tone: d.aiTone,
    ai_push: d.aiPush,
    ai_avoid: cleanAvoid(d.aiAvoid),
    wake_time: clockToSql(d.wake),
    sleep_time: clockToSql(d.sleep),
    work_start: clockToSql(d.workStart),
    work_end: clockToSql(d.workEnd),
    best_time: d.bestTime,
    focus_90d: focus || null,
    life_phase: d.lifePhase.slice(0, LIFE_PHASE_MAX),
    living_with: d.livingWith.includes('alone') ? ['alone'] : [...d.livingWith],
    blockers: d.blockers.slice(0, BLOCKERS_MAX),
  };
}

export const aboutKeys = {
  context: () => ['profile-context', 'me'] as const,
};

/** The user's `profile_context` row, or null when nothing was ever saved. */
export function useProfileContext() {
  return useQuery({
    queryKey: aboutKeys.context(),
    queryFn: async (): Promise<ProfileContext | null> => {
      // RLS returns only this user's row.
      const { data, error } = await supabase.from('profile_context').select('*').maybeSingle();
      if (error) throw error;
      return (data as ProfileContext | null) ?? null;
    },
  });
}

/**
 * Saves the whole draft: profession/about in `profile` (only when changed),
 * the rest as ONE upsert of `profile_context`. Empty text becomes NULL, so
 * "never filled" and "erased" are the same thing in the database.
 */
export function useSaveAbout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (v: { draft: AboutDraft; before: AboutDraft }) => {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const userId = userData.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const profession = v.draft.profession.trim().slice(0, PROFESSION_MAX);
      const about = v.draft.about.trim().slice(0, ABOUT_MAX);
      if (profession !== v.before.profession.trim() || about !== v.before.about.trim()) {
        const { error } = await supabase
          .from('profile')
          .update({ profession: profession || null, about: about || null })
          .eq('id', userId);
        if (error) throw error;
      }

      const next = contextRow(v.draft);
      if (JSON.stringify(next) !== JSON.stringify(contextRow(v.before))) {
        const { error } = await supabase
          .from('profile_context')
          .upsert({ character_id: userId, ...next }, { onConflict: 'character_id' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aboutKeys.context() });
      queryClient.invalidateQueries({ queryKey: characterKeys.me() });
    },
  });
}

/** "Apagar tudo" (LGPD art. 18): the row goes, and so do profession/about. */
export function useClearAbout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const userId = userData.user?.id;
      if (!userId) throw new Error('Not authenticated');
      const { error: delErr } = await supabase
        .from('profile_context')
        .delete()
        .eq('character_id', userId);
      if (delErr) throw delErr;
      const { error } = await supabase
        .from('profile')
        .update({ profession: null, about: null })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aboutKeys.context() });
      queryClient.invalidateQueries({ queryKey: characterKeys.me() });
    },
  });
}
