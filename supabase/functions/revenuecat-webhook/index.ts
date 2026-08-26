// ============================================================================
// revenuecat-webhook — RevenueCat → profile.subscription_tier bridge.
//
// RevenueCat POSTs subscription lifecycle events here (configured in its
// dashboard under Project → Integrations → Webhooks). This function is the
// ONLY writer of subscription_tier for paid subscriptions; the app keeps
// reading profile.subscription_tier exactly as before (P1 architecture
// unchanged — RevenueCat just becomes who maintains the flag).
//
// Event → action:
//   INITIAL_PURCHASE / RENEWAL / UNCANCELLATION / PRODUCT_CHANGE /
//   NON_RENEWING_PURCHASE / SUBSCRIPTION_EXTENDED
//       → tier = 'premium', premium_source = 'revenuecat'
//   EXPIRATION
//       → tier = 'free', ONLY where premium_source = 'revenuecat'
//         (CANCELLATION is deliberately a no-op: it means auto-renew was
//          turned off — access legally continues until EXPIRATION fires.)
//   TRANSFER
//       → revoke every transferred_from id (revenuecat-owned rows only),
//         grant every transferred_to id.
//   anything else → acknowledged and ignored (200, so RC stops retrying).
//
// Identity: the app calls Purchases.logIn(auth.uid) after login, so
// app_user_id is the Supabase user UUID. Anonymous RC ids
// ($RCAnonymousID:...) can still appear (purchase before login); those are
// acknowledged and skipped — RC re-sends entitlements under the real id on
// the logIn alias event.
//
// Security notes:
//   - Deploy with --no-verify-jwt (RevenueCat cannot send a Supabase JWT).
//     Auth is a shared secret instead: the dashboard's "Authorization header
//     value" must exactly match the RC_WEBHOOK_SECRET function secret.
//   - The trigger lock_subscription_tier only blocks 'authenticated'/'anon'
//     roles; this function's service_role writes pass through by design.
//   - Never revoke premium_source='manual' rows — those are Studio grants.
// ============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RC_WEBHOOK_SECRET = Deno.env.get('RC_WEBHOOK_SECRET')!;

const GRANT_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'PRODUCT_CHANGE',
  'NON_RENEWING_PURCHASE',
  'SUBSCRIPTION_EXTENDED',
]);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** First Supabase-UUID-shaped id among the ids RC knows for this user. */
function resolveUid(event: Record<string, unknown>): string | null {
  const candidates = [
    event.app_user_id,
    event.original_app_user_id,
    ...(Array.isArray(event.aliases) ? event.aliases : []),
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && UUID_RE.test(c)) return c;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  // ── Shared-secret auth (exact match with the dashboard-configured value) ──
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!RC_WEBHOOK_SECRET || authHeader !== RC_WEBHOOK_SECRET) {
    return json({ error: 'unauthorized' }, 401);
  }

  let event: Record<string, unknown>;
  try {
    const body = await req.json();
    event = body?.event ?? {};
  } catch {
    return json({ error: 'bad_json' }, 400);
  }

  const type = String(event.type ?? '');
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Guard on the entitlement when the event carries one — a future non-premium
  // entitlement must not flip the premium flag.
  const entitlements = Array.isArray(event.entitlement_ids)
    ? (event.entitlement_ids as string[])
    : null;
  if (entitlements && !entitlements.includes('premium')) {
    return json({ ok: true, ignored: 'other_entitlement' }, 200);
  }

  const grant = async (uid: string) => {
    const { error } = await admin
      .from('profile')
      .update({ subscription_tier: 'premium', premium_source: 'revenuecat' })
      .eq('id', uid);
    if (error) throw new Error(`grant ${uid}: ${error.message}`);
  };

  const revoke = async (uid: string) => {
    const { error } = await admin
      .from('profile')
      .update({ subscription_tier: 'free' })
      .eq('id', uid)
      .eq('premium_source', 'revenuecat');
    if (error) throw new Error(`revoke ${uid}: ${error.message}`);
  };

  try {
    if (type === 'TRANSFER') {
      // Entitlement moved between accounts (e.g. same store account, new
      // Perceva login). RC sends both sides as arrays of app_user_ids.
      const from = (Array.isArray(event.transferred_from) ? event.transferred_from : [])
        .filter((id): id is string => typeof id === 'string' && UUID_RE.test(id));
      const to = (Array.isArray(event.transferred_to) ? event.transferred_to : [])
        .filter((id): id is string => typeof id === 'string' && UUID_RE.test(id));
      for (const uid of from) await revoke(uid);
      for (const uid of to) await grant(uid);
      return json({ ok: true, transferred: { from, to } }, 200);
    }

    const uid = resolveUid(event);
    if (!uid) {
      // Anonymous purchase — nothing to write yet; RC re-notifies after logIn.
      console.log(`no uuid app_user_id for event ${type}; acknowledged`);
      return json({ ok: true, ignored: 'anonymous_user' }, 200);
    }

    if (GRANT_EVENTS.has(type)) {
      await grant(uid);
      return json({ ok: true, action: 'granted', uid }, 200);
    }

    if (type === 'EXPIRATION') {
      await revoke(uid);
      return json({ ok: true, action: 'revoked', uid }, 200);
    }

    // CANCELLATION, BILLING_ISSUE, TEST, etc. — acknowledged, no state change.
    return json({ ok: true, ignored: type }, 200);
  } catch (err) {
    // Non-200 → RevenueCat retries with backoff, which is what we want for
    // transient DB errors.
    console.error('webhook error:', err);
    return json({ error: 'internal_error' }, 500);
  }
});
