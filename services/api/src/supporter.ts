/* Supporters, the server side (core supporter.ts holds the record and its rules).

   The server keeps its own record for each person (#sup, next to their records, under their own account id) and decides
   from it whether the account may sync. The copy in the person's settings only shows and hides the extras on a device;
   it is never trusted here.

   Grandfathered: an account that synced before tips opened sync keeps it with no tip. The first time the server looks at
   an account with no record, it gives it src 'grandfather' (and keeps that for good) when either
     - the account already holds synced data and has never held Daybook Pattern. Since the sync gate went live, an account
       with neither record can never write, so data can only be there from before; this needs no clock and no list, and it
       holds whenever the deploy lands; or
     - Cognito says the account was made before core GRANDFATHER_BEFORE (for someone who signed up but had not synced yet).
       This needs cognito-idp:AdminGetUser on the function's role (infra/bootstrap); until the owner applies that, the
       first rule alone decides.
   Nothing is ever deleted because someone is not a supporter: their records stay and they can still read them. */
import {
  ACCOUNT_RE,
  GRANDFATHER_BEFORE,
  patActive,
  patBest,
  STRIPE_SESSION_RE,
  supActive,
  tipBetter,
  tipEnough,
  type PatRec,
  type Supporter,
} from '@daybook/core';

import { BadProof, type VerifyApple } from './apple';
import type { Store } from './store';
import { NotSetUp, type FetchSession } from './stripe';

/** what checking a payment needs, injected so the tests need no Apple, Stripe or Cognito */
export interface Pay {
  stripe?: FetchSession;
  apple?: VerifyApple;
  /** when the Cognito user was made (ms), or null when it cannot be told */
  createdAt?: (username: string) => Promise<number | null>;
}

/** a payment that cannot open support, with words safe to show and the status to answer with */
export class PayError extends Error {
  constructor(
    public status: number,
    msg: string,
  ) {
    super(msg);
  }
}

/** the person's record, giving an account from before tips its grandfathered one the first time it is looked at */
export async function resolveSup(store: Store, user: string, username: string, pay: Pay, now: number): Promise<Supporter | null> {
  const cur = await store.getSup(user);
  if (cur) return cur.sup;
  /* an account on Daybook Pattern wrote its data with that open, so the data says nothing about being from before tips */
  let old = !(await store.getPat(user)) && (await store.hasData(user));
  if (!old && pay.createdAt && username) {
    const at = await pay.createdAt(username).catch(() => null);
    old = at != null && at < GRANDFATHER_BEFORE;
  }
  if (!old) return null;
  const g: Supporter = { since: now, kind: 'tip', until: null, src: 'grandfather' };
  await store.putSup(user, g);
  return g;
}

/** whether the account may sync now: a tip, an account from before tips, or Daybook Pattern while it is active */
export async function maySync(store: Store, user: string, username: string, pay: Pay, now: number): Promise<boolean> {
  if (supActive(await resolveSup(store, user, username, pay, now), now)) return true;
  return patActive((await store.getPat(user))?.pat, now);
}

/** what a claim, or a look at the account, gives back: the supporter record and the Daybook Pattern record */
export interface Held {
  sup: Supporter | null;
  pat: PatRec | null;
}
/** both of the person's records */
export async function heldBy(store: Store, user: string, username: string, pay: Pay, now: number): Promise<Held> {
  return { sup: await resolveSup(store, user, username, pay, now), pat: (await store.getPat(user))?.pat ?? null };
}
/** saves a Daybook Pattern record, keeping the better of it and what was there */
async function givePat(store: Store, user: string, username: string, pat: PatRec, ref: string, pay: Pay, now: number): Promise<Held> {
  const keep = patBest((await store.getPat(user))?.pat, pat)!;
  await store.putPat(user, keep, ref);
  return { sup: await resolveSup(store, user, username, pay, now), pat: keep };
}

/** the record to keep when a new one comes: one with no end beats one with an end (the later end between two); between
    two with no end, a paid tip replaces a grandfathered record (it carries the amount), and between two paid tips core
    tipBetter decides, so what a person holds never shrinks */
export function supKeep(cur: Supporter | null, next: Supporter): Supporter {
  if (!cur) return next;
  if (cur.until == null && next.until == null) {
    if (cur.src === 'grandfather') return next.src !== 'grandfather' ? next : cur;
    return next.src !== 'grandfather' ? tipBetter(cur, next) : cur;
  }
  if (cur.until == null) return cur;
  if (next.until == null) return next;
  return next.until > cur.until ? next : cur;
}

/** links a checked payment (`key` in the claims) to an account, once. '' is a signed-out device: the payment is marked as
    checked but linked to no account yet, and the first account that brings it takes it. A payment linked to an account
    that has since been closed is free again. */
async function bind(store: Store, key: string, user: string, row: { at: number; src: 'apple' | 'stripe'; cents?: number; env?: string }) {
  for (let tries = 0; tries < 3; tries++) {
    const c = await store.getClaim(key);
    if (!c) {
      if (await store.putClaim(key, { ...row, sub: user }, null)) return;
      continue;
    }
    if (c.sub === user) return;
    if (!user) throw new PayError(409, 'This tip is already linked to a Daybook account. Sign in to that account to use it.');
    if (!c.sub || !((await store.getSup(c.sub)) || (await store.getPat(c.sub)))) {
      if (await store.putClaim(key, { ...row, sub: user }, c)) return;
      continue;
    }
    throw new PayError(409, 'This tip already opened support on another Daybook account.');
  }
  throw new PayError(503, 'Could not save that just now. Try again in a moment.');
}

/** saves a new record for an account, keeping the better of it and what was there; gives back what is kept */
async function give(store: Store, user: string, username: string, sup: Supporter, ref: string, pay: Pay, now: number): Promise<Supporter> {
  const cur = await resolveSup(store, user, username, pay, now);
  const keep = supKeep(cur, sup);
  await store.putSup(user, keep, ref);
  return keep;
}

/** A web tip: the Checkout Session the Payment Link sent the person back with. `user` is the signed-in account, or '' for
    a signed-out device (the open door, POST /sync/claim). A session that was paid with an account id on it
    (client_reference_id, put there by the app when the person was signed in) goes to that account, whoever brings it. Its amount
    says what it opens (core patOpen). */
export async function claimStripe(store: Store, pay: Pay, user: string, username: string, id: unknown, now: number): Promise<Held> {
  if (typeof id !== 'string' || !STRIPE_SESSION_RE.test(id)) throw new PayError(400, 'That is not a tip.');
  if (!pay.stripe) throw new PayError(503, 'Web tips are not set up yet.');
  let s;
  try {
    s = await pay.stripe(id);
  } catch (e) {
    if (e instanceof NotSetUp) throw new PayError(503, 'Web tips are not set up yet.');
    throw new PayError(502, 'Could not reach Stripe. Try again in a moment.');
  }
  if (!s) throw new PayError(404, 'That tip was not found.');
  if (s.mode !== 'payment' || s.payment_status !== 'paid') throw new PayError(409, 'That payment has not gone through yet.');
  const cents = s.amount_total ?? 0;
  if (s.currency !== 'usd' || !tipEnough(cents)) throw new PayError(409, 'Thank you for your tip. A tip of $5 or more is what opens the extras.');
  const named = s.client_reference_id && ACCOUNT_RE.test(s.client_reference_id) ? s.client_reference_id.toLowerCase() : '';
  if (named && user && named !== user.toLowerCase()) throw new PayError(403, 'This tip was made from another Daybook account. Sign in to that one.');
  const to = named || user;
  const since = (s.created || now / 1000) * 1000;
  const key = 'stripe/' + id;
  await bind(store, key, to, { at: now, src: 'stripe', cents });
  const sup: Supporter = { since, kind: 'tip', until: null, src: 'stripe', cents, ref: id };
  if (!to) return { sup, pat: null };
  const kept = await give(store, to, to === user ? username : '', sup, key, pay, now);
  /* a signed-out device keeps the record of the tip it brought, with its proof, so it can be linked when it signs in */
  return { sup: user ? kept : sup, pat: user ? ((await store.getPat(to))?.pat ?? null) : null };
}

/** An Apple purchase, a tip or the monthly plan: the signed transaction StoreKit gave the phone. Signed in only. A monthly
    plan is brought again after it renews, and its record moves on to the new end. */
export async function claimApple(store: Store, pay: Pay, user: string, username: string, jws: unknown, now: number): Promise<Held> {
  if (!pay.apple) throw new PayError(503, 'Apple tips are not set up yet.');
  let t;
  try {
    t = await pay.apple(String(jws ?? ''));
  } catch (e) {
    if (e instanceof BadProof) throw new PayError(400, e.message);
    throw new PayError(502, 'Could not check that purchase. Try again in a moment.');
  }
  if (t.token && t.token !== user.toLowerCase()) throw new PayError(403, 'This purchase was made from another Daybook account. Sign in to that one.');
  const key = 'apple/' + t.otid;
  await bind(store, key, user, { at: now, src: 'apple', cents: t.cents, env: t.env });
  if ('pat' in t)
    return givePat(store, user, username, { since: t.since || now, kind: 'monthly', until: t.until, src: 'apple', cents: t.cents, ref: t.otid }, key, pay, now);
  const sup: Supporter = { since: t.since || now, kind: 'tip', until: null, src: 'apple', cents: t.cents, ref: t.otid };
  return { sup: await give(store, user, username, sup, key, pay, now), pat: (await store.getPat(user))?.pat ?? null };
}
