import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { track } from '@/lib/analytics';

import {
  GATES_SINCE,
  UNLOCK_FEATURES,
  UNLOCK_GATES_ENABLED,
  type UnlockFeature,
} from './constants';

/**
 * Trancas progressivas (doc "Onboarding simples — proposta", Fase 2).
 *
 * No dia 1 só Práticas está aberta. Recompensas, Aprender e Eu ficam
 * visíveis no menu, trancadas, e destravam por uso (`progress`, ver
 * useUnlockProgress) ou por vontade (`manual`, o "Abrir agora" da tela
 * trancada). Toda primeira abertura passa pela porta animada
 * (`doorsSeen`), venha ela por progressão ou por atalho.
 *
 * Quem criou a conta antes das trancas existirem (GATES_SINCE) recebe tudo
 * aberto (`grandfather`): ninguém que já usa o app perde acesso a nada.
 *
 * Estado por usuário em AsyncStorage (mesmo desenho do tour store). Perder
 * o aparelho = ver as portas de novo, que é barato e até útil.
 */
export type UnlockBy = 'progress' | 'manual' | 'grandfather';

export interface UnlockEntry {
  at: string;
  by: UnlockBy;
}

type UnlockMap = Partial<Record<UnlockFeature, UnlockEntry>>;
/**
 * The doors: one per screen. Práticas never locks (it is the open tab of day 1),
 * so its door is not an unlock — it plays once, right after the first-run tour
 * (André, 08/11: "o das práticas começa de cara já depois do tutorial").
 */
export type DoorKey = UnlockFeature | 'practices';
/** What `doorsSeen` records: the doors, plus the app overview video (played to
 *  the end in the intro or in the player — it gates nothing, it only feeds the
 *  "Visto" of Ajustes › Tutorial e vídeos). */
export type SeenKey = DoorKey | 'overview';
type DoorMap = Partial<Record<SeenKey, string>>;

interface UnlockState {
  characterId: string | null;
  status: 'unknown' | 'ready';
  unlocked: UnlockMap;
  /** ISO timestamp of when the door animation was seen, per feature. */
  doorsSeen: DoorMap;
  /** Set by the old Ajustes › "Rever as portas" (removed 2026-11-08 — the
   *  videos are rewatched in Ajustes › Tutorial now): still read, so whoever
   *  pressed it sees the doors it re-armed, grandfathered accounts included. */
  replayDoors: boolean;
  hydrate: (characterId: string, accountCreatedAt: string | null) => Promise<void>;
  unlock: (feature: UnlockFeature, by: UnlockBy) => Promise<void>;
  markDoorSeen: (feature: SeenKey) => Promise<void>;
}

const KEY_PREFIX = 'rpgtasks.unlock.v1.';
const storageKey = (id: string) => `${KEY_PREFIX}${id}`;

interface Persisted {
  unlocked: UnlockMap;
  doorsSeen: DoorMap;
  replayDoors?: boolean;
}

async function persist(characterId: string | null, data: Persisted): Promise<void> {
  if (!characterId) return;
  try {
    await AsyncStorage.setItem(storageKey(characterId), JSON.stringify(data));
  } catch {
    // best effort — the next unlock re-persists everything
  }
}

function grandfatherAll(at: string): UnlockMap {
  const all: UnlockMap = {};
  for (const f of UNLOCK_FEATURES) all[f] = { at, by: 'grandfather' };
  return all;
}

export const useUnlockStore = create<UnlockState>((set, get) => ({
  characterId: null,
  status: 'unknown',
  unlocked: {},
  doorsSeen: {},
  replayDoors: false,

  hydrate: async (characterId, accountCreatedAt) => {
    if (get().status === 'ready' && get().characterId === characterId) return;
    let data: Persisted = { unlocked: {}, doorsSeen: {} };
    try {
      const raw = await AsyncStorage.getItem(storageKey(characterId));
      if (raw) data = JSON.parse(raw) as Persisted;
    } catch {
      // start clean
    }
    // Accounts older than the gates: everything open, forever. Decided once,
    // persisted, so a later change to GATES_SINCE never re-locks anyone.
    const isOld =
      accountCreatedAt != null && Date.parse(accountCreatedAt) < Date.parse(GATES_SINCE);
    if (isOld && Object.keys(data.unlocked).length === 0) {
      data = { ...data, unlocked: grandfatherAll(new Date().toISOString()) };
      await persist(characterId, data);
    }
    set({
      characterId,
      status: 'ready',
      unlocked: data.unlocked,
      doorsSeen: data.doorsSeen,
      replayDoors: data.replayDoors === true,
    });
  },

  unlock: async (feature, by) => {
    if (get().unlocked[feature]) return;
    const unlocked: UnlockMap = {
      ...get().unlocked,
      [feature]: { at: new Date().toISOString(), by },
    };
    set({ unlocked });
    track('tab_unlocked', { tab: feature, by });
    await persist(get().characterId, { unlocked, doorsSeen: get().doorsSeen, replayDoors: get().replayDoors });
  },

  markDoorSeen: async (feature) => {
    const doorsSeen: DoorMap = { ...get().doorsSeen, [feature]: new Date().toISOString() };
    set({ doorsSeen });
    await persist(get().characterId, {
      unlocked: get().unlocked,
      doorsSeen,
      replayDoors: get().replayDoors,
    });
  },

}));

/** True while the gates are on and this feature is still locked. Open (not
 *  locked) while hydrating, so a cold boot never flashes a lock over an
 *  unlocked screen. */
export function useIsLocked(feature: UnlockFeature): boolean {
  return useUnlockStore((s) => {
    if (!UNLOCK_GATES_ENABLED || s.status !== 'ready') return false;
    return !s.unlocked[feature];
  });
}

/** True when the feature is open but its door was never shown on this
 *  device — the first opening goes through the animation. */
export function useDoorPending(feature: DoorKey): boolean {
  return useUnlockStore((s) => {
    if (!UNLOCK_GATES_ENABLED || s.status !== 'ready') return false;
    if (feature === 'practices') {
      // never locked: pending for whoever goes through the gates (not the accounts
      // older than them, unless they asked to see the doors again)
      const grandfathered = Object.values(s.unlocked).some((e) => e?.by === 'grandfather');
      if (grandfathered && !s.replayDoors) return false;
      return !s.doorsSeen.practices;
    }
    const entry = s.unlocked[feature];
    if (!entry || (entry.by === 'grandfather' && !s.replayDoors)) return false;
    return !s.doorsSeen[feature];
  });
}
