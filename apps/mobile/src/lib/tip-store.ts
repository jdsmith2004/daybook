/* Apple's in-app purchase, the phone side (expo-iap, on StoreKit 2). tip.ts is the one place that calls it; the web build
   uses tip-store.web.ts, which has none. The three tips are non-consumable products (core APPLE_TIPS), so StoreKit keeps
   them in the person's purchase history: a new phone or a reinstall finds them again, and nothing is ever bought twice.

   Only iPhone takes Apple's purchase. Android is not shipped; there tipWays offers the web tip page alone, and this module
   is never called. */
import { ACCOUNT_RE, appleTier, APPLE_TIPS, TIP_TIER_IDS, type TipTierId } from '@daybook/core';
import { requireOptionalNativeModule } from 'expo';
import * as IAP from 'expo-iap';
import { Platform } from 'react-native';

/** whether this build can buy from Apple: an iPhone build with the expo-iap module in it (not Expo Go) */
export const iapAvailable = Platform.OS === 'ios' && !!requireOptionalNativeModule('ExpoIap');

/** a tip StoreKit holds for this Apple Account */
export interface StoreTip {
  tier: TipTierId;
  /** the signed transaction (a JWS) the server checks */
  jws: string;
  /** Apple's id for the purchase, the same on every restore */
  otid: string;
  /** when it was bought, ms */
  since: number;
  purchase: IAP.Purchase;
}

let conn: Promise<boolean> | null = null;
/** the store connection, made once (and again after a failure) */
function connect(): Promise<boolean> {
  if (!iapAvailable) return Promise.resolve(false);
  if (!conn)
    conn = IAP.initConnection().catch(() => {
      conn = null;
      return false;
    });
  return conn;
}

/** the prices as the App Store formats them for this person ("$4.99"), once known */
const prices: Partial<Record<TipTierId, string>> = {};
export const storePrice = (tier: TipTierId): string | undefined => prices[tier];

/** asks the App Store for the three products and their prices */
/* the App Store country of this Apple Account (alpha-3, "USA"), or null until the store says */
let storefront: string | null = null;
/** whether this Apple Account is on the United States storefront, the only one where a link out to pay on the web is
    allowed (Guidelines 3.1.1(a)); false until the store has said */
export const usStorefront = (): boolean => storefront === 'USA';

export async function loadPrices(): Promise<void> {
  if (!(await connect())) return;
  if (!storefront) storefront = await IAP.getStorefront().catch(() => null);
  try {
    const list = (await IAP.fetchProducts({ skus: TIP_TIER_IDS.map((t) => APPLE_TIPS[t]), type: 'in-app' })) as IAP.Product[] | null;
    for (const p of list || []) {
      const t = appleTier(p.id);
      if (t && p.displayPrice) prices[t] = p.displayPrice;
    }
  } catch {
    /* the prices stay as the app's own until the store answers */
  }
}

function toTip(p: IAP.Purchase): StoreTip | null {
  const tier = appleTier(p.productId);
  if (!tier || p.purchaseState !== 'purchased' || !p.purchaseToken) return null;
  const ios = p as IAP.PurchaseIOS;
  if (ios.revocationDateIOS) return null;
  return {
    tier,
    jws: p.purchaseToken,
    otid: String(ios.originalTransactionIdentifierIOS || ios.transactionId || p.id),
    since: Number(ios.originalTransactionDateIOS || p.transactionDate) || Date.now(),
    purchase: p,
  };
}

/** tells StoreKit the tip was received, so it stops offering it again at each launch. A non-consumable stays in the
    purchase history either way, so this can never lose a tip. */
export async function finishTip(t: StoreTip): Promise<void> {
  try {
    await IAP.finishTransaction({ purchase: t.purchase, isConsumable: false });
  } catch {
    /* already finished, or the store is busy: StoreKit offers it again next launch */
  }
}

/* why the last purchase failed, in words for the person: '' when it went through, was cancelled or is waiting */
let storeError = '';
export const appleTipError = (): string => storeError;
/* a cancel, or a payment waiting for a parent (Ask to Buy), is not a failure */
const QUIET_CODES: string[] = [IAP.ErrorCode.UserCancelled, IAP.ErrorCode.DeferredPayment, IAP.ErrorCode.Pending];
const failed = (code?: string) => {
  if (!code || !QUIET_CODES.includes(code)) storeError = 'Apple could not take the tip, and nothing was charged. Try again in a moment.';
};

/** Buys a tip. Resolves to the tip once Apple has taken the payment; null when it was cancelled, failed (appleTipError says
    so), or is waiting (Ask to Buy: it arrives later through watchTips). `account`: the signed-in account id, put on the
    purchase so the server can tell whose it is. */
export async function buyApple(tier: TipTierId, account: string | null): Promise<StoreTip | null> {
  storeError = '';
  if (!(await connect())) return null;
  const sku = APPLE_TIPS[tier];
  return new Promise((resolve) => {
    let done = false;
    const subs: { remove: () => void }[] = [];
    const finish = (v: StoreTip | null) => {
      if (done) return;
      done = true;
      subs.forEach((s) => s.remove());
      resolve(v);
    };
    /* a tip already bought comes back as the same transaction, so this one listener takes repeats too */
    subs.push(
      IAP.purchaseUpdatedListener(
        (p) => {
          if (p.productId !== sku) return;
          if (p.purchaseState === 'pending') return finish(null);
          finish(toTip(p));
        },
        { dedupeTransactionIOS: false },
      ),
    );
    subs.push(
      IAP.purchaseErrorListener((e) => {
        if (e.productId && e.productId !== sku) return;
        failed(e.code);
        finish(null);
      }),
    );
    IAP.requestPurchase({
      request: { apple: { sku, ...(account && ACCOUNT_RE.test(account) ? { appAccountToken: account.toLowerCase() } : {}) } },
      type: 'in-app',
    }).catch((e: { code?: string }) => {
      failed(e?.code);
      finish(null);
    });
  });
}

/** the tips this Apple Account holds. With `ask`, StoreKit first syncs with the App Store, which can ask the person to
    sign in to their Apple Account: only when they asked to restore. */
export async function ownedTips(ask = false): Promise<StoreTip[]> {
  if (!(await connect())) return [];
  if (ask) await IAP.restorePurchases().catch(() => undefined);
  try {
    const list = await IAP.getAvailablePurchases({ onlyIncludeActiveItemsIOS: true });
    return list.map(toTip).filter((t): t is StoreTip => !!t);
  } catch {
    return [];
  }
}

/** tips that arrive outside a purchase on this screen (Ask to Buy approved later, a purchase interrupted by the app
    closing, a purchase finished on another device). Gives back a function that stops listening. */
export function watchTips(on: (t: StoreTip) => void): () => void {
  if (!iapAvailable) return () => undefined;
  let sub: { remove: () => void } | null = null;
  let live = true;
  connect().then((ok) => {
    if (!ok || !live) return;
    sub = IAP.purchaseUpdatedListener((p) => {
      const t = toTip(p);
      if (t) on(t);
    });
  });
  return () => {
    live = false;
    sub?.remove();
  };
}
