/* Paying a tip: the one place the screens call. On iPhone a tip is Apple's in-app purchase first; the web tip page (Stripe,
   which takes Apple Pay) is the second way there and the only way on the web. A tip of SUPPORT_MIN dollars or more makes
   the person a supporter (core supporter.ts). The screens never talk to Apple, Stripe or the server themselves.

   Where the record goes, once a tip is confirmed:
   - into Settings.sup, through the normal settings change (so it is backed up and synced like any setting), and
   - into a copy kept on the device apart from the log (KEPT), so a log replaced by an account's, an older backup or a new
     setup can never take a tip away: whenever the settings come back without it, it is put back (sync.tsx).
   - and, when the person is signed in, to the server, which keeps its own record and decides about sync from it.
   Nothing here ever removes a record. Daybook Pattern takes the same path with its own record (Settings.pat, PatRec): a
   monthly plan that ends simply stops being active by its date, and the record stays.

   The web tip: on a phone it opens in an auth session (expo-web-browser), first at the site's tipped.html, which notes that
   the app opened it and goes on to the Stripe page; after paying, Stripe sends the person back to tipped.html with the
   Checkout Session id, and the page hands it to the app (daybook://tipped). On the web, the tip page opens in a new tab (so
   the person stays in Daybook) and comes back to tipped.html, which keeps the id (PENDING) and opens Daybook in that tab,
   where syncTips claims it; the first tab hears of the id through the storage event and claims it too. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  normPat,
  normSup,
  PAT_MONTHLY_USD,
  PAT_WORDS,
  patActive,
  patBest,
  STRIPE_SESSION_RE,
  supActive,
  supBest,
  TIPPED_APP,
  TIPPED_PAGE,
  tipLink,
  TIP_USD,
  TIP_WORDS,
  type PatRec,
  type Supporter,
  type TipTierId,
} from '@daybook/core';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import {
  appleTipError,
  appleTipQuiet,
  buyApple,
  buyAppleMonthly,
  finishTip,
  iapAvailable,
  loadPrices,
  manageApple,
  ownedTips,
  ownedTipsFailed,
  storeMonthlyPrice,
  storePrice,
  usStorefront,
  watchTips,
  type StorePat,
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

/** the price to show for the monthly plan, as the store formats it (falls back to "$3.00") */
export const monthlyPrice = (): string => storeMonthlyPrice() || `$${PAT_MONTHLY_USD.toFixed(2)}`;
/** Apple's own page to change or cancel the monthly plan */
export const manageMonthly = (): Promise<void> => manageApple().catch(() => undefined);

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
  /** the same for the Daybook Pattern record */
  savePat: (pat: PatRec) => void;
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
const KEPT_PAT = 'daybook.pat';
/** the web tip's Checkout Session id, between Stripe sending the person back and Daybook claiming it (tipped.js) */
const PENDING = 'daybook.tipped';
/** the Daybook tab's answer to the tip tab: it heard the id (public/tipped.js reads the same name) */
const HEARD = 'daybook.tipped.heard';
let kept: Supporter | null = null;
let keptP: PatRec | null = null;
let keptRead: Promise<void> | null = null;
const listeners = new Set<(s: Supporter) => void>();

/** reads the kept record, once */
export function loadKept(): Promise<void> {
  if (!keptRead)
    keptRead = AsyncStorage.multiGet([KEPT, KEPT_PAT])
      .then(([[, raw], [, rawP]]) => {
        kept = raw ? normSup(JSON.parse(raw)) : null;
        keptP = rawP ? normPat(JSON.parse(rawP)) : null;
      })
      .catch(() => undefined);
  return keptRead;
}
/** the record kept on this device (after loadKept), or null */
export const keptSup = (): Supporter | null => kept;
/** the Daybook Pattern record kept on this device (after loadKept), or null */
export const keptPat = (): PatRec | null => keptP;

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

/** the same for a Daybook Pattern record */
async function keepP(rec: unknown): Promise<PatRec | null> {
  await loadKept();
  const r = normPat(rec);
  if (!r) return keptP;
  const best = patBest(keptP, r);
  const changed = JSON.stringify(best) !== JSON.stringify(keptP);
  keptP = best;
  if (changed) await AsyncStorage.setItem(KEPT_PAT, JSON.stringify(best)).catch(() => undefined);
  if (best) host?.savePat(best);
  return best;
}

/* ---------- the server ---------- */

/** what a claim or a look at the account gives back */
interface Held {
  sup: Supporter | null;
  pat: PatRec | null;
}

let lastError = '';
/** what the server said when a tip could not be confirmed, in its words ('' when nothing went wrong, or it was cancelled) */
export const tipError = (): string => lastError;
/* the last web tip could not be confirmed for a reason that can pass (no connection, or the server or Stripe was down or
   not set up yet): it was paid, so it is kept and tried again rather than dropped */
let retryLater = false;
const KEPT_WORDS = TIP_WORDS.sheet.unconfirmed;

/** sends a web payment's Checkout Session id to the server; the records it gives back, or null */
async function claimStripe(id: string): Promise<Held | null> {
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
  const pat = normPat(r.body.pat);
  if (signedIn && (supActive(sup) || patActive(pat))) host.resume();
  if (!sup && !pat) return null;
  return { sup: sup ? { ...sup, ref: sup.ref || id } : null, pat: pat ? { ...pat, ref: pat.ref || id } : null };
}

/** sends an Apple purchase to the server, when signed in; the records it gives back, or null */
async function claimApple(t: { jws: string }): Promise<Held | null> {
  if (!host?.account()) return null;
  const r = await host.api('POST', '?claim=apple', { jws: t.jws });
  if (!r || r.status !== 200) {
    if (r) lastError = typeof r.body.error === 'string' ? r.body.error : '';
    return null;
  }
  const sup = normSup(r.body.sup);
  const pat = normPat(r.body.pat);
  if (supActive(sup) || patActive(pat)) host.resume();
  return { sup, pat };
}

const appleRecord = (t: StoreTip): Supporter => ({ since: t.since, kind: 'tip', until: null, src: 'apple', cents: TIP_USD[t.tier] * 100, ref: t.otid });

/** an Apple tip that arrived: kept here first (so it is never lost), finished with StoreKit, then sent to the server */
async function tookApple(t: StoreTip): Promise<Supporter | null> {
  const mine = await keep(appleRecord(t));
  await finishTip(t);
  const theirs = await claimApple(t).catch(() => null);
  return theirs?.sup ? keep(theirs.sup) : mine;
}

const applePat = (t: StorePat): PatRec => ({
  since: t.since,
  kind: 'monthly',
  until: t.until,
  src: 'apple',
  cents: PAT_MONTHLY_USD * 100,
  ref: t.otid,
});

/** the same for Daybook Pattern */
async function tookApplePat(t: StorePat): Promise<PatRec | null> {
  const mine = await keepP(applePat(t));
  await finishTip(t);
  const theirs = await claimApple(t).catch(() => null);
  return theirs?.pat ? keepP(theirs.pat) : mine;
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
const buying = new Set<TipTier | 'monthly'>();

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
    const finish = (got: Supporter | null) => {
      if (over) return;
      over = true;
      window.removeEventListener('storage', heard);
      document.removeEventListener('visibilitychange', back);
      window.removeEventListener('focus', back);
      done(got);
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
    (tipError says why, when there is something to say). `pattern`: the sheet is selling Daybook Pattern, so what goes wrong is
    said in its words. */
export async function buyTip(tier: TipTier, via: TipVia, pattern = false): Promise<Supporter | null> {
  lastError = '';
  lastWords = '';
  const w = pattern ? PAT_WORDS.sheet : TIP_WORDS.sheet;
  const account = host?.account() || null;
  if (via === 'apple') {
    if (!iapAvailable) return null;
    buying.add(tier);
    try {
      const before = kept?.ref;
      const t = await buyApple(tier, account, pattern);
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
  return webPay(tipLink(tier, account), w);
}

/** pays on the web page: a new tab on the web, an auth session on a phone. Resolves to the record once the payment is confirmed.
    `w`: the words for a page closed early, and for a payment not confirmed yet. */
async function webPay(link: string, w: { webClosed: string; unconfirmed: string }): Promise<Supporter | null> {
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
  const got = await claimStripe(id);
  if (!got) {
    /* paid, but not confirmed yet: kept, and tried again at the next start */
    if (retryLater) await AsyncStorage.setItem(PENDING, id).catch(() => undefined);
    lastWords = lastError || w.unconfirmed;
    return null;
  }
  if (got.pat) await keepP(got.pat);
  return got.sup ? keep(got.sup) : kept;
}

/** starts the monthly plan, on Apple only. Resolves to the record once the payment is confirmed, or null when it was cancelled
    or failed (tipWords says why). */
export async function buyMonthly(): Promise<PatRec | null> {
  lastError = '';
  lastWords = '';
  const w = PAT_WORDS.sheet;
  if (!iapAvailable) return null;
  buying.add('monthly');
  try {
    const had = keptP;
    const t = await buyAppleMonthly(host?.account() || null);
    if (!t) {
      lastError = appleTipError();
      const q = appleTipQuiet();
      lastWords = lastError || (q === 'waiting' ? w.waiting : w.cancelled);
      return null;
    }
    /* a plan this Apple Account already has comes back as the same purchase, and Apple charges nothing for it. One started again
       keeps its id, and comes back with a later end. */
    if (had && had.ref === t.otid && t.until <= had.until) {
      lastWords = w.already;
      await finishTip(t);
      return null;
    }
    return await tookApplePat(t);
  } finally {
    buying.delete('monthly');
  }
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

/** what syncTips finds: the records kept here, the server's, and whether the server now lets this account sync */
export interface TipSync extends Held {
  server: Supporter | null;
  serverPat: PatRec | null;
  open: boolean;
}
let syncing: Promise<TipSync> | null = null;
/** Brings every purchase together: a web payment waiting to be claimed, what this Apple Account holds, and the server's
    records. When the server has no record yet but this device has proof (an Apple purchase, or a web payment claimed while
    signed out), the proof is sent, so the account opens. `ask`: the person asked to restore (StoreKit may ask them to sign
    in to their Apple Account). Gives back the records kept here and the server's. Run at start and after sign-in. */
export function syncTips(ask = false): Promise<TipSync> {
  if (syncing && !ask) return syncing;
  const run = (async () => {
    await loadKept();
    if (iapAvailable) loadPrices().catch(() => undefined);
    /* a web tip that came back here */
    const id = await pendingId();
    if (id) {
      const got = await claimStripe(id);
      if (got || !retryLater) await clearPending();
      if (got) {
        if (got.sup) await keep(got.sup);
        if (got.pat) await keepP(got.pat);
        host?.say('Thank you for supporting Daybook.');
      }
    }
    /* what the server keeps for this account */
    let server: Supporter | null = null;
    let serverPat: PatRec | null = null;
    const heard = (h: Held | null) => {
      if (h?.sup) server = h.sup;
      if (h?.pat) serverPat = h.pat;
    };
    if (host?.account()) {
      const r = await host.api('GET', '?sup=1');
      if (r && r.status === 200) heard({ sup: normSup(r.body.sup), pat: normPat(r.body.pat) });
      if (server) await keep(server);
      if (serverPat) await keepP(serverPat);
    }
    /* what this Apple Account holds: kept here, and sent when the server does not have it yet (a renewal moves a monthly on) */
    const owned = iapAvailable ? await ownedTips(ask) : { tips: [], pats: [] };
    for (const t of owned.tips) {
      const rec = appleRecord(t);
      await keep(rec);
      /* the server has no tip yet, or a smaller one than this (core tipBetter) */
      if (host?.account() && supBest(server, rec) !== server) heard(await claimApple(t).catch(() => null));
    }
    for (const t of owned.pats) {
      const rec = applePat(t);
      await keepP(rec);
      await finishTip(t);
      if (host?.account() && JSON.stringify(patBest(serverPat, rec)) !== JSON.stringify(serverPat)) heard(await claimApple(t).catch(() => null));
    }
    /* a web payment claimed while signed out, linked now */
    if (host?.account() && kept?.src === 'stripe' && kept.ref && supBest(server, kept) !== server) heard(await claimStripe(kept.ref));
    if (server) await keep(server);
    if (serverPat) await keepP(serverPat);
    if (ask && !kept && !keptP) lastError = lastError || (iapAvailable && ownedTipsFailed() ? TIP_WORDS.sheet.storeDown : 'No tip was found.');
    return { sup: kept, pat: keptP, server, serverPat, open: supActive(server) || patActive(serverPat) };
  })();
  syncing = run;
  const done = () => {
    if (syncing === run) syncing = null;
  };
  run.then(done, done);
  return run;
}

/** starts listening for Apple purchases that arrive on their own (Ask to Buy approved later, an interrupted purchase, a monthly
    renewal) */
export function watchAppleTips(): () => void {
  return watchTips(
    (t) => {
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
    },
    (t) => {
      if (!buying.has('monthly'))
        loadKept()
          .then(async () => {
            /* new here is thanked once; a renewal, or one handed over again at launch, is not */
            const was = keptP?.ref;
            const pat = await tookApplePat(t);
            if (pat && was !== t.otid && pat.ref === t.otid) host?.say(PAT_WORDS.sheet.approved);
          })
          .catch(() => undefined);
    },
  );
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
