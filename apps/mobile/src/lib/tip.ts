/* Paying a tip: the one place the screens call. On iPhone a tip is Apple's in-app purchase first; the web tip page (Stripe,
   which takes Apple Pay) is the second way there and the only way on the web. A tip of SUPPORT_MIN dollars or more makes
   the person a supporter (core supporter.ts). The screens never talk to Apple, Stripe or the server themselves.

   Where the record goes, once a tip is confirmed:
   - into Settings.sup, through the normal settings change (so it is backed up and synced like any setting), and
   - into a copy kept on the device apart from the log (KEPT), so a log replaced by an account's, an older backup or a new
     setup can never take a tip away: whenever the settings come back without it, it is put back (sync.tsx).
   - and, when the person is signed in, to the server, which keeps its own record and decides about sync from it.
   Nothing here ever removes a record.

   The web tip: on a phone it opens in an auth session (expo-web-browser), first at the site's tipped.html, which notes that
   the app opened it and goes on to the Stripe page; after paying, Stripe sends the person back to tipped.html with the
   Checkout Session id, and the page hands it to the app (daybook://tipped). On the web, the tip page opens in a new tab (so
   the person stays in Daybook) and comes back to tipped.html, which keeps the id (PENDING) and opens Daybook in that tab,
   where syncTips claims it; the first tab hears of the id through the storage event and claims it too. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  normSup,
  STRIPE_SESSION_RE,
  supActive,
  supBest,
  supPaid,
  TIPPED_APP,
  TIPPED_PAGE,
  tipLink,
  TIP_USD,
  TIP_WORDS,
  type Supporter,
  type TipTierId,
} from '@daybook/core';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import {
  appleTipError,
  appleTipQuiet,
  buyApple,
  finishTip,
  iapAvailable,
  loadPrices,
  ownedTips,
  ownedTipsFailed,
  storePrice,
  usStorefront,
  watchTips,
  type StoreTip,
} from './tip-store';

/** the three tips, as on the tip sheet */
export type TipTier = TipTierId;
export const TIP_TIERS: { id: TipTier; name: string; usd: number }[] = [
  { id: 'kind', name: 'Kind tip', usd: TIP_USD.kind },
  { id: 'generous', name: 'Generous tip', usd: TIP_USD.generous },
  { id: 'amazing', name: 'Amazing tip', usd: TIP_USD.amazing },
];

/** how a tip is paid: Apple's in-app purchase (iPhone only) or the web tip page */
export type TipVia = 'apple' | 'web';

/** the ways this device can pay, best first. On iPhone the web tip page is offered only on the United States storefront
    (Guidelines 3.1.1(a)), and not until the store has said which one it is. (Android is not shipped; the Play Store would
    not allow the web page for this, so ask before shipping it there.) */
export function tipWays(): TipVia[] {
  if (!iapAvailable) return ['web'];
  return usStorefront() ? ['apple', 'web'] : ['apple'];
}

/** asks the store for its prices again (the tip sheet, as it opens); resolves once it has answered or failed */
export const refreshPrices = (): Promise<void> => (iapAvailable ? loadPrices().catch(() => undefined) : Promise.resolve());

/** the price to show for a tier, as the store formats it (falls back to "$5.00") */
export function tipPrice(tier: TipTier): string {
  const t = TIP_TIERS.find((x) => x.id === tier)!;
  return storePrice(tier) || `$${t.usd.toFixed(2)}`;
}

/* ---------- what the app gives this module (sync.tsx registers it) ---------- */

export interface TipHost {
  /** the signed-in account id, or null */
  account: () => string | null;
  /** a call to the sync API as the signed-in person; null when signed out or unreachable */
  api: (method: 'GET' | 'POST', query: string, body?: unknown) => Promise<{ status: number; body: Record<string, unknown> } | null>;
  /** the open door for a signed-out device's web tip (POST /sync/claim); null when unreachable or not offered */
  open: (body: unknown) => Promise<{ status: number; body: Record<string, unknown> } | null>;
  /** puts the record on the settings, through the normal change path (only when it is better than theirs) */
  save: (sup: Supporter) => void;
  /** the server now says this account is a supporter: sync may go on */
  resume: () => void;
  /** a line at the bottom of the screen */
  say: (msg: string) => void;
}
let host: TipHost | null = null;
export function setTipHost(h: TipHost | null) {
  host = h;
}

/* ---------- the copy kept on the device ---------- */

const KEPT = 'daybook.sup';
/** the web tip's Checkout Session id, between Stripe sending the person back and Daybook claiming it (tipped.js) */
const PENDING = 'daybook.tipped';
/** the Daybook tab's answer to the tip tab: it heard the id (public/tipped.js reads the same name) */
const HEARD = 'daybook.tipped.heard';
let kept: Supporter | null = null;
let keptRead: Promise<void> | null = null;
const listeners = new Set<(s: Supporter) => void>();

/** reads the kept record, once */
export function loadKept(): Promise<void> {
  if (!keptRead)
    keptRead = AsyncStorage.getItem(KEPT)
      .then((raw) => {
        kept = raw ? normSup(JSON.parse(raw)) : null;
      })
      .catch(() => undefined);
  return keptRead;
}
/** the record kept on this device (after loadKept), or null */
export const keptSup = (): Supporter | null => kept;

/** a new record from a tip arrived: called with it (for a thank-you on screen) */
export function onTipped(fn: (s: Supporter) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** keeps a record on the device and on the settings, if it is better than what is kept; gives back what is kept now */
async function keep(rec: unknown): Promise<Supporter | null> {
  await loadKept();
  const r = normSup(rec);
  if (!r) return kept;
  const best = supBest(kept, r);
  const changed = JSON.stringify(best) !== JSON.stringify(kept);
  kept = best;
  if (changed) await AsyncStorage.setItem(KEPT, JSON.stringify(best)).catch(() => undefined);
  if (best) host?.save(best);
  if (changed && best) listeners.forEach((fn) => fn(best));
  return best;
}

/* ---------- the server ---------- */

let lastError = '';
/** what the server said when a tip could not be confirmed, in its words ('' when nothing went wrong, or it was cancelled) */
export const tipError = (): string => lastError;
/* the last web tip could not be confirmed for a reason that can pass (no connection, or the server or Stripe was down or
   not set up yet): it was paid, so it is kept and tried again rather than dropped */
let retryLater = false;
const KEPT_WORDS = TIP_WORDS.sheet.unconfirmed;

/** sends a web tip's Checkout Session id to the server; the record it gives back, or null */
async function claimStripe(id: string): Promise<Supporter | null> {
  if (!STRIPE_SESSION_RE.test(id) || !host) return null;
  const signedIn = !!host.account();
  const r = signedIn ? await host.api('POST', '?claim=stripe', { session: id }) : await host.open({ session: id });
  /* the proof of a paid tip is let go only when the server says it is not a tip at all (400) or Stripe has no such
     payment (404). Anything else can pass: no connection, the server down, a payment still going through (409), or a
     tip that belongs to an account not signed in here yet (403, 409). */
  retryLater = !r || (r.status !== 200 && r.status !== 400 && r.status !== 404);
  if (!r || r.status >= 500) {
    lastError = KEPT_WORDS;
    return null;
  }
  if (r.status !== 200) {
    lastError =
      (typeof r.body.error === 'string' ? r.body.error : 'Your tip could not be confirmed.') +
      (retryLater ? ' Your tip is kept on this phone, and Daybook tries again.' : '');
    return null;
  }
  lastError = '';
  const sup = normSup(r.body.sup);
  if (sup && signedIn && supActive(sup)) host.resume();
  return sup ? { ...sup, ref: sup.ref || id } : null;
}

/** sends an Apple tip to the server, when signed in; the record it gives back, or null */
async function claimApple(t: StoreTip): Promise<Supporter | null> {
  if (!host?.account()) return null;
  const r = await host.api('POST', '?claim=apple', { jws: t.jws });
  if (!r || r.status !== 200) {
    if (r) lastError = typeof r.body.error === 'string' ? r.body.error : '';
    return null;
  }
  const sup = normSup(r.body.sup);
  if (sup && supActive(sup)) host.resume();
  return sup;
}

const appleRecord = (t: StoreTip): Supporter => ({ since: t.since, kind: 'tip', until: null, src: 'apple', cents: TIP_USD[t.tier] * 100, ref: t.otid });

/** an Apple tip that arrived: kept here first (so it is never lost), finished with StoreKit, then sent to the server */
async function tookApple(t: StoreTip): Promise<Supporter | null> {
  const mine = await keep(appleRecord(t));
  await finishTip(t);
  const theirs = await claimApple(t).catch(() => null);
  return theirs ? keep(theirs) : mine;
}

/* ---------- paying ---------- */

/** the web tip page in an auth session on a phone; the Checkout Session id it came back with, or null */
async function webOnPhone(link: string): Promise<string | null> {
  const start = TIPPED_PAGE + '?go=' + encodeURIComponent(link);
  /* a private session: no "wants to use ... to sign in" question, and nothing is left in Safari */
  const res = await WebBrowser.openAuthSessionAsync(start, TIPPED_APP, { preferEphemeralSession: true });
  if (res.type !== 'success') return null;
  const m = /[?&]session_id=([^&#]+)/.exec(res.url);
  return m ? decodeURIComponent(m[1]) : null;
}

/** the Apple tips being bought on screen right now */
const buying = new Set<TipTier>();

/** how the last tip on screen ended, when it did not simply go through, in words for the person: nothing charged, waiting
    for approval, already owned, or paid and kept until it is confirmed. Every one says what is safe. */
let lastWords = '';
export const tipWords = (): string => lastWords;

/** the Daybook tab that opened the web tip page: resolves to the record when the tip comes back (the other tab keeps its id in
    the browser's storage), or to null when the person returns here without one. A tip that finishes after that is still
    claimed: the storage listener stays, and syncTips thanks the person on screen. */
let webWatch = false;
function waitForWebTip(): Promise<Supporter | null> {
  const onStore = (e: StorageEvent) => {
    if (!(e.key === PENDING && e.newValue)) return;
    try {
      /* tells the tip tab (public/tipped.js) that this tab has the id, so it can close instead of opening a second Daybook */
      window.localStorage.setItem(HEARD, e.newValue);
    } catch {
      /* the tip tab opens Daybook itself */
    }
    syncTips().catch(() => undefined);
  };
  if (!webWatch) {
    webWatch = true;
    window.addEventListener('storage', onStore);
  }
  return new Promise((done) => {
    let over = false;
    const away = Date.now();
    const finish = (sup: Supporter | null) => {
      if (over) return;
      over = true;
      window.removeEventListener('storage', heard);
      document.removeEventListener('visibilitychange', back);
      window.removeEventListener('focus', back);
      done(sup);
    };
    const heard = (e: StorageEvent) => {
      if (e.key === PENDING && e.newValue)
        syncTips()
          .then((r) => finish(r.sup))
          .catch(() => finish(null));
    };
    /* back on this tab without a tip (the other tab was closed, or is still open): the button is free again, quietly */
    const back = () => {
      if (document.visibilityState === 'visible' && Date.now() - away > 1500) setTimeout(() => finish(null), 1200);
    };
    window.addEventListener('storage', heard);
    document.addEventListener('visibilitychange', back);
    window.addEventListener('focus', back);
  });
}

/** pays a tip. Resolves to the new supporter record once the payment is confirmed, or null when it was cancelled or failed
    (tipError says why, when there is something to say). */
export async function buyTip(tier: TipTier, via: TipVia): Promise<Supporter | null> {
  lastError = '';
  lastWords = '';
  const w = TIP_WORDS.sheet;
  const account = host?.account() || null;
  if (via === 'apple') {
    if (!iapAvailable) return null;
    buying.add(tier);
    try {
      const before = kept?.ref;
      const t = await buyApple(tier, account);
      if (!t) {
        lastError = appleTipError();
        const q = appleTipQuiet();
        lastWords = lastError || (q === 'waiting' ? w.waiting : w.cancelled);
        return null;
      }
      /* a tip this Apple Account already has comes back as the same purchase, and Apple charges nothing for it */
      if (before && before === t.otid) {
        lastWords = w.already;
        await finishTip(t);
        return null;
      }
      return await tookApple(t);
    } finally {
      buying.delete(tier);
    }
  }
  const link = tipLink(tier, account);
  if (!link) return null;
  if (Platform.OS === 'web') {
    /* the tip page opens in a new tab, so the person never leaves Daybook; the tab comes back to tipped.html, which keeps the
       id and opens Daybook there, and this tab hears of the id (the browser's storage event) and claims it too (syncTips). A
       browser that blocks the new tab gets the old way: the tip page in this tab. */
    const tab = window.open(link, '_blank');
    if (!tab) {
      window.location.assign(link);
      return new Promise((done) => setTimeout(() => done(null), 15_000));
    }
    try {
      /* the tip page gets no handle back to Daybook */
      tab.opener = null;
    } catch {
      /* already closed off */
    }
    return waitForWebTip();
  }
  const id = await webOnPhone(link);
  if (!id) {
    lastWords = w.webClosed;
    return null;
  }
  const sup = await claimStripe(id);
  if (!sup) {
    /* paid, but not confirmed yet: kept, and tried again at the next start */
    if (retryLater) await AsyncStorage.setItem(PENDING, id).catch(() => undefined);
    lastWords = lastError || KEPT_WORDS;
    return null;
  }
  return keep(sup);
}

/** looks for tips paid before (a new phone, a reinstall, a tip on the web) and resolves to the record, or null */
export async function restoreTips(): Promise<Supporter | null> {
  lastError = '';
  return (await syncTips(true)).sup;
}

/** pending web tip id: on the web, tipped.js keeps it in the browser's storage; on a phone, an unconfirmed one is kept */
let pendingMem: string | null = null;
async function pendingId(): Promise<string | null> {
  if (pendingMem) return pendingMem;
  if (Platform.OS === 'web') {
    try {
      const v = window.localStorage.getItem(PENDING);
      if (v) return v;
    } catch {
      /* storage is off */
    }
  }
  return AsyncStorage.getItem(PENDING).catch(() => null);
}
async function clearPending() {
  pendingMem = null;
  if (Platform.OS === 'web')
    try {
      window.localStorage.removeItem(PENDING);
    } catch {
      /* storage is off */
    }
  await AsyncStorage.removeItem(PENDING).catch(() => undefined);
}

let syncing: Promise<{ sup: Supporter | null; server: Supporter | null }> | null = null;
/** Brings every tip together: a web tip waiting to be claimed, the Apple tips this Apple Account holds, and the server's
    record. When the server has no record yet but this device has proof of a tip (an Apple purchase, or a web tip claimed
    while signed out), the proof is sent, so the account opens. `ask`: the person asked to restore (StoreKit may ask them
    to sign in to their Apple Account). Gives back the record kept here and the server's. Run at start and after sign-in. */
export function syncTips(ask = false): Promise<{ sup: Supporter | null; server: Supporter | null }> {
  if (syncing && !ask) return syncing;
  const run = (async () => {
    await loadKept();
    if (iapAvailable) loadPrices().catch(() => undefined);
    /* a web tip that came back here */
    const id = await pendingId();
    if (id) {
      const sup = await claimStripe(id);
      if (sup || !retryLater) await clearPending();
      if (sup) {
        await keep(sup);
        host?.say('Thank you for supporting Daybook.');
      }
    }
    /* what the server keeps for this account */
    let server: Supporter | null = null;
    if (host?.account()) {
      const r = await host.api('GET', '?sup=1');
      if (r && r.status === 200) server = normSup(r.body.sup);
      if (server) await keep(server);
    }
    /* Apple tips on this Apple Account: kept here, and sent when the server does not have one yet */
    const owned = iapAvailable ? await ownedTips(ask) : [];
    for (const t of owned) {
      await keep(appleRecord(t));
      if (host?.account() && !supPaid(server)) server = (await claimApple(t).catch(() => null)) || server;
    }
    /* a web tip claimed while signed out, linked now */
    if (host?.account() && !supPaid(server) && kept?.src === 'stripe' && kept.ref) server = (await claimStripe(kept.ref)) || server;
    if (server) await keep(server);
    if (ask && !kept) lastError = lastError || (iapAvailable && ownedTipsFailed() ? TIP_WORDS.sheet.storeDown : 'No tip was found.');
    return { sup: kept, server };
  })();
  syncing = run;
  const done = () => {
    if (syncing === run) syncing = null;
  };
  run.then(done, done);
  return run;
}

/** starts listening for Apple tips that arrive on their own (Ask to Buy approved later, an interrupted purchase) */
export function watchAppleTips(): () => void {
  return watchTips((t) => {
    /* a tip being bought on screen right now is taken by buyTip */
    if (!buying.has(t.tier))
      loadKept()
        .then(async () => {
          /* a tip that is new here (Ask to Buy approved, a purchase finished after the app closed) is thanked once; one
             StoreKit hands over again at launch is not */
          const was = kept?.ref;
          const sup = await tookApple(t);
          if (sup && was !== t.otid && sup.ref === t.otid) host?.say(TIP_WORDS.sheet.approved);
        })
        .catch(() => undefined);
  });
}

/** a web tip's id handed to the app by an address (app/tipped.tsx): kept, then claimed. Before sync has started (the app
    was opened by this address), the start of sync claims it (sync.tsx); after, it is claimed here, once any run going on
    has finished, so it is never missed. */
export async function tippedWith(id: string): Promise<void> {
  if (!STRIPE_SESSION_RE.test(id)) return;
  pendingMem = id;
  await AsyncStorage.setItem(PENDING, id).catch(() => undefined);
  if (!host) return;
  if (syncing) await syncing.catch(() => undefined);
  await syncTips();
  /* not confirmed: said, with what is safe (the thank-you for a confirmed one is said by syncTips) */
  if (lastError) host?.say(lastError);
}
