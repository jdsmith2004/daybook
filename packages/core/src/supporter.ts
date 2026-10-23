/* Supporters. A tip of at least SUPPORT_MIN dollars makes a person a supporter (the owner, October 23, 2026), which opens
   the extras: sync and the safe copy, the deeper stats and pattern pages, and the extra flame looks. Care is never
   locked: SOS and its tools, Already happened, Planning a slip?, Rekindle, logging, the plan and Today stay free.

   The record is built so monthly support can come later without a change of shape: a tip has no end (until: null), and
   a monthly plan would set `until` to the end of the paid month. People who already had an account before tips opened
   sync keep it (src 'grandfather'): earned things stay earned.

   On the device the record lives in Settings.sup. For sync, the server keeps its own record and decides; the device
   copy only shows and hides the extras. */
import type { Settings } from './types';

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
}

/** the extras a supporter gets */
export type Extra = 'sync' | 'stats' | 'looks';

/** whether a record is a supporter now */
export const supActive = (sup: Supporter | null | undefined, now = Date.now()): boolean => !!sup && (sup.until == null || sup.until > now);

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
