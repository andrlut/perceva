import { useEffect } from 'react';
import { create } from 'zustand';

import { supabase } from '../supabase';

interface RecoveryStore {
  /**
   * True when the user landed in the app via a password-recovery email
   * link. AuthGate routes them to /reset-password until they pick a
   * new password (or sign out). Set by the PASSWORD_RECOVERY auth event.
   */
  isRecovering: boolean;
  setRecovering: (v: boolean) => void;
}

export const useRecoveryStore = create<RecoveryStore>((set) => ({
  isRecovering: false,
  setRecovering: (v) => set({ isRecovering: v }),
}));

/**
 * Registers a one-time listener for Supabase's PASSWORD_RECOVERY event.
 * Mount once at the app root.
 */
export function useRegisterRecoveryListener() {
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        useRecoveryStore.getState().setRecovering(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);
}
