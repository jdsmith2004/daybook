/* Apple's in-app purchase, the phone side (expo-iap, on StoreKit 2). tip.ts is the one place that calls it; the web build
   uses tip-store.web.ts, which has none. The three tips are non-consumable products (core APPLE_TIPS), so StoreKit keeps
   them in the person's purchase history: a new phone or a reinstall finds them again, and nothing is ever bought twice.

   The monthly plan of Daybook Pattern is one more product (core APPLE_MONTHLY), an auto-renewable subscription, which StoreKit
   hands over again with a later end each time it renews. Lifetime is the larger tips.

   Only iPhone takes Apple's purchase. Android is not shipped; there tipWays offers the web tip page alone, and this module
   is never called. */
import { ACCOUNT_RE, APPLE_MONTHLY, appleTier, APPLE_TIPS, PAT_WORDS, TIP_TIER_IDS, TIP_WORDS, type TipTierId } from '@daybook/core';
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

/** the monthly plan StoreKit holds for this Apple Account */
export interface StorePat {
  jws: string;
  otid: string;
  since: number;
  /** when the paid month ends, ms */
  until: number;
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
let monthlyPrice: string | undefined;
export const storeMonthlyPrice = (): string | undefined => monthlyPrice;

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
    const subs = (await IAP.fetchProducts({ skus: [APPLE_MONTHLY], type: 'subs' }).catch(() => null)) as IAP.Product[] | null;
    for (const p of [...(list || []), ...(subs || [])]) {
      const t = appleTier(p.id);
      if (t && p.displayPrice) prices[t] = p.displayPrice;
      if (p.id === APPLE_MONTHLY && p.displayPrice) monthlyPrice = p.displayPrice;
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

function toPat(p: IAP.Purchase): StorePat | null {
  if (p.productId !== APPLE_MONTHLY || p.purchaseState !== 'purchased' || !p.purchaseToken) return null;
  const ios = p as IAP.PurchaseIOS;
  if (ios.revocationDateIOS) return null;
  const until = Number(ios.expirationDateIOS);
  if (!until) return null;
  return {
    jws: p.purchaseToken,
    otid: String(ios.originalTransactionIdentifierIOS || ios.transactionId || p.id),
    since: Number(ios.originalTransactionDateIOS || p.transactionDate) || Date.now(),
    until,
    purchase: p,
  };
}

/** tells StoreKit a purchase was received, so it stops offering it again at each launch. A non-consumable stays in the
    purchase history, and a subscription stays until it ends, so this can never lose one. */
export async function finishTip(t: { purchase: IAP.Purchase }): Promise<void> {
  try {
    await IAP.finishTransaction({ purchase: t.purchase, isConsumable: false });
  } catch {
    /* already finished, or the store is busy: StoreKit offers it again next launch */
  }
}

/* why the last purchase failed, in words for the person: '' when it went through, was cancelled or is waiting */
let storeError = '';
export const appleTipError = (): string => storeError;
/* a purchase that ended without a tip and without a failure: the person cancelled, or it waits for a parent (Ask to Buy) */
let storeQuiet: 'cancelled' | 'waiting' | null = null;
export const appleTipQuiet = () => storeQuiet;
/* the last look for tips this Apple Account holds could not reach the App Store (so "none" would not be true) */
let ownedFailed = false;
export const ownedTipsFailed = () => ownedFailed;
/* a cancel, or a payment waiting for a parent (Ask to Buy), is not a failure */
const QUIET_CODES: string[] = [IAP.ErrorCode.UserCancelled, IAP.ErrorCode.DeferredPayment, IAP.ErrorCode.Pending];
/* the store does not have the tips for this build: they are not approved yet, or the Paid Apps Agreement is not active */
const OFF_CODES: string[] = [IAP.ErrorCode.SkuNotFound, IAP.ErrorCode.ItemUnavailable];
const failed = (code?: string, pattern = false) => {
  if (code && QUIET_CODES.includes(code)) {
    storeQuiet = code === IAP.ErrorCode.UserCancelled ? 'cancelled' : 'waiting';
    return;
  }
  const w = TIP_WORDS.sheet;
  const pw = PAT_WORDS.sheet;
  if (code && OFF_CODES.includes(code)) storeError = pattern ? pw.appleOff : usStorefront() ? w.appleOffWeb : w.appleOff;
  else if (code === IAP.ErrorCode.IapNotAvailable) storeError = w.appleBlocked;
  else storeError = pattern ? pw.appleFailed : w.appleFailed;
};

/** Buys a tip. Resolves to the tip once Apple has taken the payment; null when it was cancelled, failed (appleTipError says
    so), or is waiting (Ask to Buy: it arrives later through watchTips). `account`: the signed-in account id, put on the
    purchase so the server can tell whose it is. `pattern`: said in the words of Daybook Pattern. */
export const buyApple = (tier: TipTierId, account: string | null, pattern = false): Promise<StoreTip | null> =>
  buySku(APPLE_TIPS[tier], 'in-app', toTip, account, pattern);
/** Buys the monthly plan, the same way. */
export const buyAppleMonthly = (account: string | null): Promise<StorePat | null> => buySku(APPLE_MONTHLY, 'subs', toPat, account, true);

async function buySku<T>(
  sku: string,
  type: 'in-app' | 'subs',
  read: (p: IAP.Purchase) => T | null,
  account: string | null,
  pattern: boolean,
): Promise<T | null> {
  storeError = '';
  storeQuiet = null;
  if (!(await connect())) {
    failed(undefined, pattern);
    return null;
  }
  return new Promise((resolve) => {
    let done = false;
    const subs: { remove: () => void }[] = [];
    const finish = (v: T | null) => {
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
          if (p.purchaseState === 'pending') {
            storeQuiet = 'waiting';
            return finish(null);
          }
          finish(read(p));
        },
        { dedupeTransactionIOS: false },
      ),
    );
    subs.push(
      IAP.purchaseErrorListener((e) => {
        if (e.productId && e.productId !== sku) return;
        failed(e.code, pattern);
        finish(null);
      }),
    );
    const apple = { sku, ...(account && ACCOUNT_RE.test(account) ? { appAccountToken: account.toLowerCase() } : {}) };
    IAP.requestPurchase(type === 'subs' ? { request: { apple }, type } : { request: { apple }, type }).catch((e: { code?: string }) => {
      failed(e?.code, pattern);
      finish(null);
    });
  });
}

/** what this Apple Account holds: its tips, and Daybook Pattern while it is active. With `ask`, StoreKit first syncs with the
    App Store, which can ask the person to sign in to their Apple Account: only when they asked to restore. */
export async function ownedTips(ask = false): Promise<{ tips: StoreTip[]; pats: StorePat[] }> {
  ownedFailed = false;
  if (!(await connect())) {
    ownedFailed = true;
    return { tips: [], pats: [] };
  }
  if (ask) await IAP.restorePurchases().catch(() => undefined);
  try {
    const list = await IAP.getAvailablePurchases({ onlyIncludeActiveItemsIOS: true });
    return { tips: list.map(toTip).filter((t): t is StoreTip => !!t), pats: list.map(toPat).filter((t): t is StorePat => !!t) };
  } catch {
    ownedFailed = true;
    return { tips: [], pats: [] };
  }
}

/** Apple's own page to change or cancel a subscription */
export const manageApple = (): Promise<void> => IAP.deepLinkToSubscriptions({}).then(() => undefined);

/** purchases that arrive outside a purchase on this screen (Ask to Buy approved later, a purchase interrupted by the app
    closing, a purchase finished on another device, a monthly renewal). Gives back a function that stops listening. */
export function watchTips(on: (t: StoreTip) => void, onPat: (t: StorePat) => void): () => void {
  if (!iapAvailable) return () => undefined;
  let sub: { remove: () => void } | null = null;
  let live = true;
  connect().then((ok) => {
    if (!ok || !live) return;
    sub = IAP.purchaseUpdatedListener((p) => {
      const t = toTip(p);
      if (t) on(t);
      const k = toPat(p);
      if (k) onPat(k);
    });
  });
  return () => {
    live = false;
    sub?.remove();
  };
}
