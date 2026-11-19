import { Platform } from 'react-native';

import type PurchasesModule from 'react-native-purchases';
import type {
  PurchasesOffering,
  PurchasesPackage,
  SubscriptionOption,
} from 'react-native-purchases';

/**
 * RevenueCat core — thin, guarded wrapper around react-native-purchases.
 *
 * The native module only exists in binaries built after v1.3.0; Expo Go and
 * older store binaries don't have it, and a static `import` crashes at
 * module-eval time there (the SDK wires a NativeEventEmitter on import).
 * Hence the guarded require: on any environment without the module,
 * `Purchases` is null and every entry point degrades to "purchases
 * unavailable" — which the paywall renders as the P1 "Em breve" state.
 *
 * Identity contract: `logIn(auth.uid)` after Supabase login, so RevenueCat's
 * app_user_id IS the Supabase user UUID — the revenuecat-webhook edge
 * function relies on that to write profile.subscription_tier.
 */

let Purchases: typeof PurchasesModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Purchases = (require('react-native-purchases') as { default: typeof PurchasesModule }).default ?? null;
} catch {
  Purchases = null;
}

/** Public SDK keys — safe to ship in the client (same class as the Supabase
 *  publishable key). Injected per build profile via eas.json env. */
const API_KEY = Platform.select({
  android: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY,
  ios: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY,
});

let configured = false;

/**
 * True when this binary can sell: native module present AND this platform
 * has an API key. Both platforms sell since 2026-09/10 (goog_ + appl_).
 */
export function purchasesAvailable(): boolean {
  return Purchases !== null && !!API_KEY;
}

/** Configure once per process. Safe to call repeatedly. */
export function ensureConfigured(): boolean {
  if (!purchasesAvailable()) return false;
  if (!configured) {
    Purchases!.configure({ apiKey: API_KEY! });
    configured = true;
  }
  return true;
}

/** Bind the RC identity to the Supabase user (call on login/session load). */
export async function logInPurchases(uid: string): Promise<void> {
  if (!ensureConfigured()) return;
  try {
    await Purchases!.logIn(uid);
  } catch (e) {
    console.warn('[purchases] logIn failed:', e);
  }
}

/** Detach identity on sign-out (falls back to a fresh anonymous RC user). */
export async function logOutPurchases(): Promise<void> {
  if (!configured) return;
  try {
    await Purchases!.logOut();
  } catch {
    // Already anonymous — fine.
  }
}

/** The current offering ("default" in the RC dashboard), or null. */
export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!ensureConfigured()) return null;
  const offerings = await Purchases!.getOfferings();
  return offerings.current ?? null;
}

export type PurchaseOutcome = 'premium' | 'cancelled' | 'pending';

/**
 * Buy a package. Resolves 'premium' when the entitlement is active on the
 * returned customer info, 'cancelled' when the user backed out of the store
 * sheet, 'pending' for deferred states (e.g. awaiting payment approval).
 * Store/network errors throw — caller surfaces them.
 */
export async function purchasePremium(
  pkg: PurchasesPackage,
): Promise<PurchaseOutcome> {
  if (!ensureConfigured()) return 'cancelled';
  try {
    const { customerInfo } = await Purchases!.purchasePackage(pkg);
    return customerInfo.entitlements.active['premium'] ? 'premium' : 'pending';
  } catch (e) {
    if ((e as { userCancelled?: boolean }).userCancelled) return 'cancelled';
    throw e;
  }
}

/** Restore prior purchases; true when the premium entitlement came back. */
export async function restorePremium(): Promise<boolean> {
  if (!ensureConfigured()) return false;
  const customerInfo = await Purchases!.restorePurchases();
  return !!customerInfo.entitlements.active['premium'];
}

/* ───────────────── Store codes (see lib/purchases/storeCodes.ts) ───────────────── */

/** Google only: the offer `offerId` on this package's base plan, if the
 *  store returned it for this person (Google filters by eligibility). */
function offerOption(pkg: PurchasesPackage, offerId: string): SubscriptionOption | null {
  const options = pkg.product.subscriptionOptions ?? [];
  return options.find((o) => !o.isBasePlan && o.id.endsWith(`:${offerId}`)) ?? null;
}

/** The offer's first-phase price, formatted by the store ("R$ 69,93"), or
 *  null when the offer isn't available to this person on this device. */
export function offerPriceForPackage(pkg: PurchasesPackage, offerId: string): string | null {
  const phase = offerOption(pkg, offerId)?.pricingPhases[0];
  return phase ? phase.price.formatted : null;
}

/**
 * Google only: buy the package THROUGH a developer-determined offer — the
 * only way a Play discount reaches the person, since Play promo codes can't
 * carry a price (storeCodes.ts). 'offer_unavailable' when the store didn't
 * hand us that offer (not eligible, or the offer is off).
 */
export async function purchasePremiumWithOffer(
  pkg: PurchasesPackage,
  offerId: string,
): Promise<PurchaseOutcome | 'offer_unavailable'> {
  if (!ensureConfigured()) return 'cancelled';
  const option = offerOption(pkg, offerId);
  if (!option) return 'offer_unavailable';
  try {
    const { customerInfo } = await Purchases!.purchaseSubscriptionOption(option);
    return customerInfo.entitlements.active['premium'] ? 'premium' : 'pending';
  } catch (e) {
    if ((e as { userCancelled?: boolean }).userCancelled) return 'cancelled';
    throw e;
  }
}

/** iOS only: Apple's own offer-code sheet. Resolves when the sheet closes;
 *  whether a code was redeemed only shows up through the entitlement. */
export async function presentOfferCodeSheet(): Promise<boolean> {
  if (Platform.OS !== 'ios' || !ensureConfigured()) return false;
  await Purchases!.presentCodeRedemptionSheet();
  return true;
}
