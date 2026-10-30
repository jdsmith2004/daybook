/* Supporters. A tip of at least SUPPORT_MIN dollars makes a person a supporter (the owner, October 23, 2026), which opens
   the extras: sync and the safe copy, the deeper stats and pattern pages, and the extra flame looks. Care is never
   locked: SOS and its tools, Already happened, Planning a slip?, Rekindle, logging, the plan and Today stay free.

   The record is built so monthly support can come later without a change of shape: a tip has no end (until: null), and
   a monthly plan would set `until` to the end of the paid month. People who already had an account before tips opened
   sync keep it (src 'grandfather'): earned things stay earned.

   On the device the record lives in Settings.sup. For sync, the server keeps its own record and decides; the device
   copy only shows and hides the extras.

   Daybook Pattern (the owner, October 30, 2026) is the one paid product beyond the tips, monthly or lifetime, with its own
   record (Settings.pat), since one person can hold a tip and the product at once. It opens the deeper pattern and the month
   read, and sync while it is active. From the day it goes on sale (PATTERN_FROM) a new tip opens sync and the safe copy; a
   tip from before that day keeps everything it opened, for good. Until PATTERN_FROM is set, nothing changes for anyone. */
import type { Settings } from './types';

/** where a tip goes (the old single tip page). Empty: nothing about tips shows. */
export const SUPPORT_URL: string = 'https://buy.stripe.com/fZudRb2Rn3QafC3gWCeUU00';
/** the public pages next to the web app (apps/mobile/public): help, the privacy policy and the terms, which the App
    Store links to as well */
export const SITE_URL = 'https://d3c9g6kent5bsr.cloudfront.net';

/** the smallest tip, in US dollars, that makes a supporter */
export const SUPPORT_MIN = 5;

/** where a supporter record came from */
export type SupSrc = 'apple' | 'stripe' | 'grandfather';

export interface Supporter {
  /** when it started, ms */
  since: number;
  /** a one-time tip, or (later) monthly support */
  kind: 'tip' | 'monthly';
  /** when it ends, ms. null: never (a tip, or a grandfathered account) */
  until: number | null;
  src: SupSrc;
  /** the tip's amount in cents, when known */
  cents?: number;
  /** what proves it, kept on the device so it can be linked to an account later: the Stripe Checkout Session id, or Apple's
      original transaction id. Never a card detail. */
  ref?: string;
}

/** the extras a supporter gets */
export type Extra = 'sync' | 'stats' | 'looks';

const SRCS: SupSrc[] = ['apple', 'stripe', 'grandfather'];

/** a record that came from somewhere else (storage, another device, the server), cleaned; null when it is not one */
export function normSup(x: unknown): Supporter | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  const since = Number(o.since);
  if (!Number.isFinite(since) || since < 0) return null;
  if (o.kind !== 'tip' && o.kind !== 'monthly') return null;
  if (!SRCS.includes(o.src as SupSrc)) return null;
  const until = o.until == null ? null : Number(o.until);
  if (until != null && !Number.isFinite(until)) return null;
  /* a tip never ends; only monthly support has an end */
  if (o.kind === 'monthly' && until == null) return null;
  const out: Supporter = { since, kind: o.kind, until: o.kind === 'tip' ? null : until, src: o.src as SupSrc };
  const cents = Number(o.cents);
  if (o.cents != null && Number.isInteger(cents) && cents >= 0 && cents < 100_000_000) out.cents = cents;
  if (typeof o.ref === 'string' && /^[A-Za-z0-9_.-]{1,200}$/.test(o.ref)) out.ref = o.ref;
  return out;
}

/** whether a record is a supporter now */
export const supActive = (sup: Supporter | null | undefined, now = Date.now()): boolean => {
  const s = normSup(sup);
  return !!s && (s.until == null || s.until > now);
};

/** whether a record is a paid tip that is active now (not a grandfathered account) */
export const supPaid = (sup: Supporter | null | undefined, now = Date.now()): boolean => {
  const s = normSup(sup);
  return !!s && s.src !== 'grandfather' && supActive(s, now);
};

/* ---------- Daybook Pattern ---------- */

/** The moment Daybook Pattern went on sale, ms: set in the same change that turns it on (docs/launch.md), and never moved
    after that, because a tip from before it keeps the whole pattern. null: not on sale, and tips open what they always did. */
export const PATTERN_FROM: number | null = null;
/** the web page for the lifetime form (a Stripe Payment Link, docs/launch.md). Monthly is Apple's only. */
export const PATTERN_LINK: string = '';

export type PatKind = 'monthly' | 'lifetime';
export const PAT_USD: Record<PatKind, number> = { monthly: 2.99, lifetime: 24.99 };
/** Apple's products: the monthly form is an auto-renewable subscription, the lifetime form a non-consumable */
export const APPLE_PATTERN: Record<PatKind, string> = { monthly: 'daybook.pattern.monthly', lifetime: 'daybook.pattern.lifetime' };
/** which form a product is, or null when it is not one of these */
export function applePatKind(productId: unknown): PatKind | null {
  return productId === APPLE_PATTERN.monthly ? 'monthly' : productId === APPLE_PATTERN.lifetime ? 'lifetime' : null;
}
/** a web payment of this much or more is the lifetime form */
export const PAT_LIFETIME_CENTS = Math.round(PAT_USD.lifetime * 100);
/** days a monthly record stays open past its end, so a renewal that is late or still being retried never flashes a lock */
export const PAT_GRACE = 3;
const GRACE_MS = PAT_GRACE * 86400_000;

export interface PatRec {
  /** when it started, ms */
  since: number;
  kind: PatKind;
  /** when the paid month ends, ms. null: lifetime */
  until: number | null;
  src: 'apple' | 'stripe';
  /** what it cost, in cents, when known */
  cents?: number;
  /** what proves it, as on a tip's record: Apple's original transaction id, or the Stripe Checkout Session id */
  ref?: string;
}

/** a record that came from somewhere else, cleaned; null when it is not one */
export function normPat(x: unknown): PatRec | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  const since = Number(o.since);
  if (!Number.isFinite(since) || since < 0) return null;
  if (o.kind !== 'monthly' && o.kind !== 'lifetime') return null;
  if (o.src !== 'apple' && o.src !== 'stripe') return null;
  const until = o.until == null ? null : Number(o.until);
  if (o.kind === 'monthly' && (until == null || !Number.isFinite(until))) return null;
  const out: PatRec = { since, kind: o.kind, until: o.kind === 'lifetime' ? null : until, src: o.src };
  const cents = Number(o.cents);
  if (o.cents != null && Number.isInteger(cents) && cents >= 0 && cents < 100_000_000) out.cents = cents;
  if (typeof o.ref === 'string' && /^[A-Za-z0-9_.-]{1,200}$/.test(o.ref)) out.ref = o.ref;
  return out;
}

/** whether a record is active now: lifetime always, monthly until its end and PAT_GRACE days after */
export const patActive = (pat: PatRec | null | undefined, now = Date.now()): boolean => {
  const p = normPat(pat);
  return !!p && (p.until == null || p.until + GRACE_MS > now);
};

/** the better of two records: lifetime over monthly, else the later end, keeping the earlier start */
export function patBest(a: PatRec | null | undefined, b: PatRec | null | undefined): PatRec | null {
  if (!a) return b ?? null;
  if (!b) return a;
  if (a.until == null) return a;
  if (b.until == null) return b;
  const later = b.until > a.until ? b : a;
  return b.since < a.since && later === a ? { ...a, since: b.since } : a.since < b.since && later === b ? { ...b, since: a.since } : later;
}

/** the settings with the better of their own record and `pat`, the same object when that is what they had, as keepSup does */
export function keepPat<T extends Settings | null>(st: T, pat: PatRec | null | undefined): T {
  if (!st) return st;
  const mine = normPat(st.pat);
  const best = patBest(mine, normPat(pat));
  if (!best || JSON.stringify(best) === JSON.stringify(mine)) return st;
  return { ...st, pat: best };
}

/** whether the whole pattern is open: Daybook Pattern while it is active, or a tip from before it went on sale, for good. On
    sale or not, a grandfathered account has only sync. */
export const patOpen = (st: Settings | null | undefined, now = Date.now(), from: number | null = PATTERN_FROM): boolean => {
  if (patActive(st?.pat, now)) return true;
  if (!supPaid(st?.sup, now)) return false;
  return from == null || normSup(st?.sup)!.since < from;
};

/** whether a month's read can be opened: while the pattern is open, every month; after a monthly plan has ended, the months
    that finished while it was active, which stay readable for good. monthEnd: the moment that month was over, ms. */
export const patMonthOpen = (st: Settings | null | undefined, monthEnd: number, now = Date.now(), from: number | null = PATTERN_FROM): boolean => {
  if (patOpen(st, now, from)) return true;
  const p = normPat(st?.pat);
  return !!p && p.until != null && monthEnd <= p.until;
};

/** whether the person on this device is a supporter now: a tip or Daybook Pattern, not a grandfathered account (which keeps
    sync only, and is still asked, and thanked, like anyone who has not tipped) */
export const isSupporter = (st: Settings | null | undefined, now = Date.now()): boolean => supPaid(st?.sup, now) || patActive(st?.pat, now);

/** whether an extra is open. Sync and the looks open with support, and sync also for an account from before tips. The
    deeper pattern opens with patOpen, which is the same as support until Daybook Pattern is on sale. */
export const extraOpen = (st: Settings | null | undefined, extra: Extra, now = Date.now(), from: number | null = PATTERN_FROM): boolean =>
  extra === 'stats' ? patOpen(st, now, from) : isSupporter(st, now) || (extra === 'sync' && supActive(st?.sup, now));

/** whether a payment of this many cents is enough to make a supporter */
export const tipEnough = (cents: number): boolean => Number.isFinite(cents) && cents >= SUPPORT_MIN * 100;

/** the better of two records: one with no end wins (a tip over a grandfathered account), else the later end. Between two
    paid tips the earlier one wins, because the first tip's date decides what it keeps (patOpen). Used to merge the server's
    and the device's. */
export function supBest(a: Supporter | null | undefined, b: Supporter | null | undefined): Supporter | null {
  if (!a) return b ?? null;
  if (!b) return a;
  if (a.until == null && b.until == null) {
    if (a.src === 'grandfather') return b.src !== 'grandfather' ? b : a;
    return b.src !== 'grandfather' && b.since < a.since ? b : a;
  }
  if (a.until == null) return a;
  if (b.until == null) return b;
  return b.until > a.until ? b : a;
}

/** the settings with the better of their own record and `sup`, unchanged (the same object) when that is what they had.
    Every path that replaces settings (sync, a backup, a device joining an account) keeps the record this way, so a tip
    is never lost to an older copy of the settings: earned things stay earned. */
export function keepSup<T extends Settings | null>(st: T, sup: Supporter | null | undefined): T {
  if (!st) return st;
  const mine = normSup(st.sup);
  const other = normSup(sup);
  const best = supBest(mine, other);
  if (!best || best === mine) return st;
  return { ...st, sup: best };
}

/* ---------- paying a tip ---------- */

/** the three tips (Kind $5, Generous $10, Amazing $20, the owner's choice) */
export type TipTierId = 'kind' | 'generous' | 'amazing';
export const TIP_TIER_IDS: TipTierId[] = ['kind', 'generous', 'amazing'];
export const TIP_USD: Record<TipTierId, number> = { kind: 5, generous: 10, amazing: 20 };

/** Apple's in-app purchase products, one per tip: non-consumable, so a tip shows up again on a new phone (StoreKit keeps
    them in the person's purchase history) and can be restored. A second tip of the same size would be a new product later
    (a consumable "tip again", or monthly support as a subscription). */
export const APPLE_TIPS: Record<TipTierId, string> = {
  kind: 'daybook.tip.kind',
  generous: 'daybook.tip.generous',
  amazing: 'daybook.tip.amazing',
};
/** the tip a product is, or null when it is not one of ours */
export function appleTier(productId: unknown): TipTierId | null {
  return TIP_TIER_IDS.find((t) => APPLE_TIPS[t] === productId) ?? null;
}

/** The web tip pages: Stripe Payment Links, one per tip, made by the owner (docs/plan.md, "Payments"). Empty until they are
    made; the old tip page (SUPPORT_URL) stands in for the Kind tip until then. Each link sends the person back to TIPPED_URL
    with the Checkout Session id once they have paid. */
export const TIP_LINKS: Record<TipTierId, string> = {
  kind: 'https://buy.stripe.com/9B6bJ39fL0DY2PhgWCeUU01',
  generous: 'https://buy.stripe.com/5kQaEZdw13QaexZbCieUU02',
  amazing: 'https://buy.stripe.com/aFa4gBgIdcmGdtV9uaeUU03',
};
/** the page a Payment Link sends the person back to after paying; Stripe fills in {CHECKOUT_SESSION_ID} */
export const TIPPED_PAGE = SITE_URL + '/tipped.html';
export const TIPPED_REDIRECT = TIPPED_PAGE + '?session_id={CHECKOUT_SESSION_ID}';
/** the address the tipped page sends the app back to, on a phone (the app's scheme, app.json) */
export const TIPPED_APP = 'daybook://tipped';

/** the web tip page for a tip, or '' when there is none. `account`: the signed-in account id, so Stripe hands it back with
    the payment and the tip is linked to that account even if this device never hears back. */
export function tipLink(tier: TipTierId, account?: string | null, links: Record<TipTierId, string> = TIP_LINKS): string {
  return withAccount(links[tier] || (tier === 'kind' ? SUPPORT_URL : ''), account);
}
/** the web page for the lifetime form of Daybook Pattern, or '' when there is none; `account` as in tipLink */
export const patLink = (account?: string | null, link: string = PATTERN_LINK): string => withAccount(link, account);
function withAccount(base: string, account?: string | null): string {
  if (!base) return '';
  if (!account || !ACCOUNT_RE.test(account)) return base;
  return base + (base.includes('?') ? '&' : '?') + 'client_reference_id=' + encodeURIComponent(account);
}
/** a Cognito account id (a UUID), the only thing ever sent as client_reference_id */
export const ACCOUNT_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** a Stripe Checkout Session id */
export const STRIPE_SESSION_RE = /^cs_(live|test)_[A-Za-z0-9]{10,200}$/;

/** Accounts made before this moment keep sync with no tip (src 'grandfather'): the end of the day tips opened sync,
    October 23, 2026, in Chicago. Accounts that hold synced data when the server first checks them keep it too, whenever
    they were made (services/api supporter.ts). */
export const GRANDFATHER_BEFORE = Date.parse('2026-10-24T05:00:00Z');

/** what the sync screens say when the account cannot sync yet */
export const SUP_SYNC_WORDS = {
  need: 'Sync and the safe copy open when you support Daybook with a tip of $' + SUPPORT_MIN + ' or more. Until then, your log stays safe on this device.',
  short: 'Signed in · sync opens with a tip',
  check: 'I already tipped',
  checking: 'Looking for your tip…',
  none: 'No tip was found for this account yet. If you tipped on the web, open the page Stripe sent you back to, or write to us.',
  /* where no tip can be paid (Android, until Google Play's billing is in): nothing about tips, and nothing to pay elsewhere */
  needNoTip: 'Sync and the safe copy are not open for this account yet. Your log stays safe on this device.',
  shortNoTip: 'Signed in · sync is not open yet',
  /* a monthly Daybook Pattern that has ended: plainly, so nobody thinks the safe copy is still current */
  lapsed:
    'Your Daybook Pattern has ended, so sync has stopped saving new changes. Everything already saved is still yours to read. New changes stay safe on this device.',
};

/** whether the extra flame looks exist yet. Only the twelve forms of the flame exist now, and they are earned, never
    bought, so nothing about looks is offered or locked until there are looks to choose. */
export const LOOKS_READY = false;

/** what a tip opens, as the tip sheet lists it. Only what exists is listed: a tip never promises something not built. */
export interface Perk {
  id: Extra;
  icon: string;
  name: string;
  sub: string;
}
const PERK_SYNC: Perk = {
  id: 'sync',
  icon: 'shield',
  name: 'Sync and a safe copy',
  sub: 'Your log the same on your phone and the web, kept safe if a phone is lost.',
};
const PERK_STATS: Perk = { id: 'stats', icon: 'chart', name: 'Your whole pattern', sub: 'When it happens, what sets it off, and what helps you most.' };
const PERK_LOOKS: Perk = { id: 'looks', icon: 'sparkle', name: 'New flame looks', sub: 'New colors for your flame.' };
/** what a tip opens, as the sheet lists it. withPattern: the deeper pattern is on the list, as it is before Daybook Pattern
    goes on sale, and for a person who has it open. */
export function supPerks(withPattern = PATTERN_FROM == null): Perk[] {
  return [PERK_SYNC, ...(withPattern ? [PERK_STATS] : []), ...(LOOKS_READY ? [PERK_LOOKS] : [])];
}
/** what Daybook Pattern opens, as its sheet lists it */
export interface PatPerk {
  icon: string;
  name: string;
  sub: string;
}
export const PAT_PERKS: PatPerk[] = [
  PERK_STATS,
  { icon: 'sunrise', name: 'What changed this month', sub: 'A short read each month, from your own log, of what is getting better.' },
  PERK_SYNC,
];

/** whether an extra shows as locked on this device. canTip: a tip can be paid here (on Android, until Google Play's rules
    are checked, nothing is locked, because nothing can be paid). Sync shows its lock only while signed out: a signed-in
    account may be grandfathered, and the server decides that, not the device. */
export function extraLocked(
  st: Settings | null | undefined,
  extra: Extra,
  o: { canTip: boolean; signedIn?: boolean; now?: number; from?: number | null },
): boolean {
  if (!o.canTip || !st) return false;
  if (extra === 'looks' && !LOOKS_READY) return false;
  if (extra === 'sync' && o.signedIn) return false;
  return !extraOpen(st, extra, o.now, o.from === undefined ? PATTERN_FROM : o.from);
}

/** the parts of Journal, Pattern. The pattern in one look, whether slips are getting further apart, and My numbers stay
    free; the rest (when, what sets it off, hard days, what helps) is the deeper part a tip opens. */
export type PatPart = 'look' | 'apart' | 'when' | 'what' | 'days' | 'helps' | 'numbers';
export const PAT_FREE: PatPart[] = ['look', 'apart', 'numbers'];
export const patPartOpen = (part: PatPart, locked: boolean): boolean => !locked || PAT_FREE.includes(part);
