// ============================================================================
// Supabase API keys for Edge Functions — the NEW keys, never the legacy JWTs.
// ============================================================================
//
// The runtime injects the project's keys twice:
//   - SUPABASE_PUBLISHABLE_KEYS / SUPABASE_SECRET_KEYS: JSON objects keyed by
//     key name ({"default": "sb_publishable_…"} / {"default": "sb_secret_…"}).
//   - SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY: the LEGACY JWT keys.
//
// The legacy pair stops working once "legacy API keys" are disabled in the
// dashboard (roadmap task 8 of the 2026-10-06 audit), so every function reads
// the new keys. The legacy variable is only a fallback for when the JSON one
// is absent (e.g. an older local `supabase functions serve`).

function pick(jsonVar: string, legacyVar: string): string {
  const raw = Deno.env.get(jsonVar);
  if (raw) {
    try {
      const keys = JSON.parse(raw) as Record<string, unknown>;
      const preferred = keys['default'];
      if (typeof preferred === 'string' && preferred) return preferred;
      const first = Object.values(keys).find((v) => typeof v === 'string' && v);
      if (typeof first === 'string') return first;
    } catch {
      // malformed JSON: fall through to the legacy variable
    }
  }
  const legacy = Deno.env.get(legacyVar);
  if (legacy) return legacy;
  throw new Error(`Missing ${jsonVar} (and ${legacyVar})`);
}

/** Client-safe key (RLS applies). Replaces SUPABASE_ANON_KEY. */
export function publishableKey(): string {
  return pick('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY');
}

/** Server-only key (bypasses RLS). Replaces SUPABASE_SERVICE_ROLE_KEY.
 *  Only functions that need admin access should call it. */
export function secretKey(): string {
  return pick('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY');
}
