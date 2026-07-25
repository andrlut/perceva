/**
 * Native Google Sign-In → Supabase session.
 *
 * Flow: Play Services mints a Google ID token (audience = our WEB OAuth
 * client), and `supabase.auth.signInWithIdToken` exchanges it for a session
 * in a single POST — no redirect, no deep link, no flowType change. The
 * session lands in AsyncStorage via `persistSession` and AuthGate routes on
 * the resulting SIGNED_IN event, so nothing beyond calling this function is
 * needed on success.
 *
 * Deliberately NOT done here (see docs/google-signin-setup.md):
 * - No `nonce` param to signInWithIdToken: this library never exposes one,
 *   and Android Play-Services ID tokens carry no nonce claim, so GoTrue
 *   accepts them as-is. Passing anything would break verification.
 * - No deep-link handling: the inbound auth handlers were removed as
 *   session-fixation vectors (lib/auth/deep-link.ts) and this flow needs none.
 */
import { Platform } from 'react-native';

import type { AuthError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

/**
 * True only on Android with a real Web client ID configured. The login
 * screen renders the Google button only when this is true, which means the
 * feature self-disables (rather than crashing or minting null ID tokens)
 * on web builds and on builds where EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is
 * still empty — flipping the env var on and running `eas update` is enough
 * to light it up, since the native module ships in the build regardless.
 */
export const isGoogleSignInAvailable =
  Platform.OS === 'android' && WEB_CLIENT_ID.length > 0;

type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin');

// Lazy-required and configured once at module load, but ONLY when available:
// the package is a native module, so importing it in a web bundle crashes,
// and configure('') would silently produce null idTokens on every signIn.
let googleSignin: GoogleSigninModule | null = null;
if (isGoogleSignInAvailable) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  googleSignin = require('@react-native-google-signin/google-signin') as GoogleSigninModule;
  googleSignin.GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
}

export type GoogleSignInResult =
  /** Session created — AuthGate takes over, caller does nothing. */
  | { type: 'success' }
  /** User dismissed the account picker (or defensive SIGN_IN_CANCELLED). */
  | { type: 'cancelled' }
  /** A sign-in is already in flight (double-tap) — ignore silently. */
  | { type: 'in_progress' }
  /** Device has no (or outdated) Google Play Services. */
  | { type: 'play_services_unavailable' }
  /** Null idToken (wrong/missing web client ID) or unknown native error. */
  | { type: 'failed' }
  /** GoTrue rejected the token — localize via localizeAuthError. */
  | { type: 'supabase_error'; error: AuthError };

/** Run the full native Google Sign-In → Supabase exchange. */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  if (!googleSignin) return { type: 'failed' };
  const { GoogleSignin, isErrorWithCode, statusCodes } = googleSignin;

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // v13+ shape: user cancel RESOLVES as { type: 'cancelled' } — it does
    // not throw. Treating the try/catch as the only cancel path (v12-era
    // sample code) would misread a cancel as success.
    const response = await GoogleSignin.signIn();
    if (response.type === 'cancelled') return { type: 'cancelled' };

    const idToken = response.data.idToken;
    if (!idToken) {
      // Classic symptom of a missing/wrong WEB client ID in configure().
      return { type: 'failed' };
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error) return { type: 'supabase_error', error };
    return { type: 'success' };
  } catch (err) {
    if (isErrorWithCode(err)) {
      switch (err.code) {
        case statusCodes.IN_PROGRESS:
          return { type: 'in_progress' };
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          return { type: 'play_services_unavailable' };
        // Defensive: v13+ resolves cancels (handled above), but keep the
        // legacy code mapped in case a platform edge still throws it.
        case statusCodes.SIGN_IN_CANCELLED:
          return { type: 'cancelled' };
      }
    }
    return { type: 'failed' };
  }
}
