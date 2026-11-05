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
type DoorMap = Partial<Record<UnlockFeature, string>>;

interface UnlockState {
  characterId: string | null;
  status: 'unknown' | 'ready';
  unlocked: UnlockMap;
  /** ISO timestamp of when the door animation was seen, per feature. */
  doorsSeen: DoorMap;
  hydrate: (characterId: string, accountCreatedAt: string | null) => Promise<void>;
  unlock: (feature: UnlockFeature, by: UnlockBy) => Promise<void>;
  markDoorSeen: (feature: UnlockFeature) => Promise<void>;
  /** Ajustes → "Rever as portas": forget the doors, keep the unlocks. */
  resetDoors: () => Promise<void>;
}

const KEY_PREFIX = 'rpgtasks.unlock.v1.';
const storageKey = (id: string) => `${KEY_PREFIX}${id}`;

interface Persisted {
  unlocked: UnlockMap;
  doorsSeen: DoorMap;
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
    set({ characterId, status: 'ready', unlocked: data.unlocked, doorsSeen: data.doorsSeen });
  },

  unlock: async (feature, by) => {
    if (get().unlocked[feature]) return;
    const unlocked: UnlockMap = {
      ...get().unlocked,
      [feature]: { at: new Date().toISOString(), by },
    };
    set({ unlocked });
    track('tab_unlocked', { tab: feature, by });
    await persist(get().characterId, { unlocked, doorsSeen: get().doorsSeen });
  },

  markDoorSeen: async (feature) => {
    const doorsSeen: DoorMap = { ...get().doorsSeen, [feature]: new Date().toISOString() };
    set({ doorsSeen });
    await persist(get().characterId, { unlocked: get().unlocked, doorsSeen });
  },

  resetDoors: async () => {
    set({ doorsSeen: {} });
    await persist(get().characterId, { unlocked: get().unlocked, doorsSeen: {} });
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
export function useDoorPending(feature: UnlockFeature): boolean {
  return useUnlockStore((s) => {
    if (!UNLOCK_GATES_ENABLED || s.status !== 'ready') return false;
    const entry = s.unlocked[feature];
    if (!entry || entry.by === 'grandfather') return false;
    return !s.doorsSeen[feature];
  });
}
