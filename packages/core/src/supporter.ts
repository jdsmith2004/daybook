/* Supporters. A tip of at least SUPPORT_MIN dollars makes a person a supporter (the owner, October 23, 2026), which opens
   the extras: sync and the safe copy, the deeper stats and pattern pages, and the extra flame looks. Care is never
   locked: SOS and its tools, Already happened, Planning a slip?, Rekindle, logging, the plan and Today stay free.

   The record is built so monthly support can come later without a change of shape: a tip has no end (until: null), and
   a monthly plan would set `until` to the end of the paid month. People who already had an account before tips opened
   sync keep it (src 'grandfather'): earned things stay earned.

   On the device the record lives in Settings.sup. For sync, the server keeps its own record and decides; the device
   copy only shows and hides the extras. */
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

/** whether the person on this device is a supporter now */
export const isSupporter = (st: Settings | null | undefined, now = Date.now()): boolean => supActive(st?.sup, now);

/** whether an extra is open. Every extra opens with support; none opens any other way. */
export const extraOpen = (st: Settings | null | undefined, _extra: Extra, now = Date.now()): boolean => isSupporter(st, now);

/** whether a payment of this many cents is enough to make a supporter */
export const tipEnough = (cents: number): boolean => Number.isFinite(cents) && cents >= SUPPORT_MIN * 100;

/** the better of two records: one with no end wins, else the later end. Used to merge the server's and the device's. */
export function supBest(a: Supporter | null | undefined, b: Supporter | null | undefined): Supporter | null {
  if (!a) return b ?? null;
  if (!b) return a;
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
  kind: '',
  generous: '',
  amazing: '',
};
/** the page a Payment Link sends the person back to after paying; Stripe fills in {CHECKOUT_SESSION_ID} */
export const TIPPED_PAGE = SITE_URL + '/tipped.html';
export const TIPPED_REDIRECT = TIPPED_PAGE + '?session_id={CHECKOUT_SESSION_ID}';
/** the address the tipped page sends the app back to, on a phone (the app's scheme, app.json) */
export const TIPPED_APP = 'daybook://tipped';

/** the web tip page for a tip, or '' when there is none. `account`: the signed-in account id, so Stripe hands it back with
    the payment and the tip is linked to that account even if this device never hears back. */
export function tipLink(tier: TipTierId, account?: string | null, links: Record<TipTierId, string> = TIP_LINKS): string {
  const base = links[tier] || (tier === 'kind' ? SUPPORT_URL : '');
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
export function supPerks(): Perk[] {
  const all: Perk[] = [
    { id: 'sync', icon: 'shield', name: 'Sync and a safe copy', sub: 'Your log the same on your phone and the web, kept safe if a phone is lost.' },
    { id: 'stats', icon: 'chart', name: 'Your whole pattern', sub: 'When it happens, what sets it off, and what helps you most.' },
    { id: 'looks', icon: 'sparkle', name: 'New flame looks', sub: 'New colors for your flame.' },
  ];
  return all.filter((p) => p.id !== 'looks' || LOOKS_READY);
}

/** whether an extra shows as locked on this device. canTip: a tip can be paid here (on Android, until Google Play's rules
    are checked, nothing is locked, because nothing can be paid). Sync shows its lock only while signed out: a signed-in
    account may be grandfathered, and the server decides that, not the device. */
export function extraLocked(st: Settings | null | undefined, extra: Extra, o: { canTip: boolean; signedIn?: boolean; now?: number }): boolean {
  if (!o.canTip || !st) return false;
  if (extra === 'looks' && !LOOKS_READY) return false;
  if (extra === 'sync' && o.signedIn) return false;
  return !extraOpen(st, extra, o.now);
}

/** the parts of Journal, Pattern. The pattern in one look, whether slips are getting further apart, and My numbers stay
    free; the rest (when, what sets it off, hard days, what helps) is the deeper part a tip opens. */
export type PatPart = 'look' | 'apart' | 'when' | 'what' | 'days' | 'helps' | 'numbers';
export const PAT_FREE: PatPart[] = ['look', 'apart', 'numbers'];
export const patPartOpen = (part: PatPart, locked: boolean): boolean => !locked || PAT_FREE.includes(part);
