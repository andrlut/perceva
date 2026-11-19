import type { PlanId } from '@/lib/premium';

/**
 * Store codes the paywall accepts in its "Tenho um código" field.
 *
 * The two stores treat codes differently, so one code means two things:
 *
 *   iOS     → an App Store Offer Code. Apple applies it itself, through its
 *             own redemption sheet (`presentCodeRedemptionSheet`); the app
 *             never sees the code. The field on iOS just opens the sheet.
 *   Android → Google Play promo codes can only grant a FREE TRIAL on the
 *             backwards-compatible base plan — never a discounted price
 *             (Play Console docs, "Promo codes"). A discount like 30% off
 *             the first year is a developer-determined OFFER on the base
 *             plan, which only the app can apply. So here the app checks
 *             the code against this table and buys the plan through that
 *             offer's `SubscriptionOption` (`purchasePremiumWithOffer`).
 *
 * The offer must be "developer determined" in Play Console and carry the
 * tag `rc-ignore-offer`, or RevenueCat applies it to EVERY purchase of the
 * plan with no code (2026-11-18 incident). A code here is NOT a secret:
 * the table ships in the JS bundle. It's a marketing handle, as the Apple
 * one is.
 */
export interface StoreCode {
  /** The plan the code applies to; the picker snaps to it. */
  plan: PlanId;
  /** The Google Play offer id on that plan's base plan (`basePlanId:offerId`). */
  googleOfferId: string;
}

export const STORE_CODES: Readonly<Record<string, StoreCode>> = {
  /** Paker Health partnership: 30% off the first year of the annual plan
   *  (2026-11-15). Apple: offer code PAKERANUAL. Play: offer paker-anual-30. */
  PAKERANUAL: { plan: 'annual', googleOfferId: 'paker-anual-30' },
};

/** Uppercase, no spaces: codes are case-insensitive on both stores. */
export function normalizeStoreCode(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase();
}

export function lookupStoreCode(raw: string): { code: string; entry: StoreCode } | null {
  const code = normalizeStoreCode(raw);
  const entry = STORE_CODES[code];
  return entry ? { code, entry } : null;
}
