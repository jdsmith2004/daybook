/* Checking an Apple tip. The phone sends the signed transaction StoreKit gave it (a JWS). Apple's own library
   (@apple/app-store-server-library, SignedDataVerifier) checks that the certificate chain in it leads to Apple's root
   (apple-root.ts), that the signature is good, and that it is for this app; then this checks that it is one of the three
   tips (core APPLE_TIPS), a non-consumable, and not refunded.

   Production and Sandbox are both taken: App Review and TestFlight buy in the Sandbox, and only people the owner invites
   can. Xcode and local testing are never taken, because their transactions are not signed by Apple. Revocation is not
   looked up online (enableOnlineChecks false): the dates are checked at the time Apple signed the transaction, so a tip
   bought years ago still checks, and a check never fails because Apple's revocation server was slow. */
import { Environment, SignedDataVerifier } from '@apple/app-store-server-library';
import { appleTier, TIP_USD, type TipTierId } from '@daybook/core';

import { APPLE_ROOT_G3 } from './apple-root';

/** the app (app.json ios.bundleIdentifier, and its App Store Connect id, eas.json ascAppId) */
export const BUNDLE_ID = 'com.jdsmith2004.daybook';
export const APP_APPLE_ID = 6824362830;

/** a tip Apple signed, checked */
export interface AppleTip {
  tier: TipTierId;
  /** the same for every restore of this purchase */
  otid: string;
  /** when it was bought, ms */
  since: number;
  cents: number;
  /** the account id the app put on the purchase, if it did (a signed-in purchase) */
  token: string | null;
  env: 'Production' | 'Sandbox';
}

/** a transaction that is not a good tip; the words are safe to show */
export class BadProof extends Error {}

export type VerifyApple = (jws: string) => Promise<AppleTip>;

function envOf(jws: string): string | null {
  try {
    const p = JSON.parse(Buffer.from(jws.split('.')[1] || '', 'base64url').toString('utf8'));
    return typeof p?.environment === 'string' ? p.environment : null;
  } catch {
    return null;
  }
}

export function appleVerifier(roots: Buffer[] = [APPLE_ROOT_G3], bundleId = BUNDLE_ID, appAppleId = APP_APPLE_ID): VerifyApple {
  const verifiers = {
    Production: new SignedDataVerifier(roots, false, Environment.PRODUCTION, bundleId, appAppleId),
    Sandbox: new SignedDataVerifier(roots, false, Environment.SANDBOX, bundleId),
  };
  return async (jws) => {
    if (typeof jws !== 'string' || jws.length > 20_000 || jws.split('.').length !== 3) throw new BadProof('That is not an Apple purchase.');
    const env = envOf(jws);
    if (env !== 'Production' && env !== 'Sandbox') throw new BadProof('That purchase is not from the App Store.');
    let t;
    try {
      t = await verifiers[env].verifyAndDecodeTransaction(jws);
    } catch {
      throw new BadProof('Apple could not confirm that purchase.');
    }
    const tier = appleTier(t.productId);
    if (!tier) throw new BadProof('That purchase is not a Daybook tip.');
    if (t.type !== 'Non-Consumable') throw new BadProof('That purchase is not a Daybook tip.');
    if (t.revocationDate != null) throw new BadProof('That tip was refunded.');
    if (!t.originalTransactionId) throw new BadProof('Apple could not confirm that purchase.');
    const since = Number(t.originalPurchaseDate ?? t.purchaseDate) || 0;
    /* the price Apple charged, in thousandths, when it was in dollars; else the tip's own size */
    const cents = t.currency === 'USD' && Number.isFinite(t.price) ? Math.round(Number(t.price) / 10) : TIP_USD[tier] * 100;
    return { tier, otid: String(t.originalTransactionId), since, cents, token: t.appAccountToken ? String(t.appAccountToken).toLowerCase() : null, env };
  };
}
