/* The sync API.

   GET    /sync?since=<ms>&cursor=<c>   what was saved on the server after `since` (the `now` of the last pull), oldest first,
                                       up to PAGE records at a time; keep asking with `cursor` until it comes back null.
                                       Pulls overlap by a minute, so a save that lands while a pull runs is never missed;
                                       a record that comes twice is simply not newer the second time.
   POST   /sync   { records: [...] }     save these records; each is kept only if it is newer than the one already there
   DELETE /sync                          erase this person's log: every record becomes a deletion, so their other devices
                                       remove it too on their next pull. A copy is kept for a week (never pulled).
   GET    /sync?erased=1                 { n, at }: how many records that copy holds, and when the erase was
   POST   /sync?restore=1                brings the copy back as new changes; days logged again since are left alone
   DELETE /sync?all=1                    close the account: remove everything for good, then delete the sign-in itself

   Supporters (supporter.ts; core supporter.ts holds the rules):
   GET    /sync?sup=1                    { sup, pat }: this person's supporter record and Daybook Pattern record, or nulls
   POST   /sync?claim=stripe { session } a web payment: the Checkout Session id the Payment Link sent back; gives { sup, pat }
   POST   /sync?claim=apple  { jws }     an Apple purchase: the signed transaction from StoreKit; gives { sup, pat }
   POST   /sync/claim        { session } the one open door (no sign-in), for a web payment on a signed-out device: it is
                                       checked and marked as used, and { sup, pat } comes back for that device to keep

   Sign in with Apple (apple-sign-in.ts):
   POST   /sync/apple { token, nonce }   the second open door: Apple's identity token for Cognito tokens { tokens }
   POST   /sync?apple=link { token, nonce } join Apple to the signed-in account; gives { apple }
   DELETE /sync?all=1 { apple: { code, client } } closing an Apple account: Apple's fresh code is traded and revoked first;
                  with no code, an account joined to Apple answers 409 { code: 'NeedApple' } and nothing is deleted, so the app
                  asks Apple; { apple: { skip: true } } is a device that cannot ask Apple (Android), and closes it anyway

   Saving records (POST /sync) needs a supporter or Daybook Pattern, or an account from before tips (grandfathered); otherwise it answers
   402 { need: 'support' } and saves nothing. Everything else stays open to every signed-in person, so nobody is ever cut
   off from their own log: reading it (a new phone, a lapsed supporter getting their log back), bringing back an erased
   log, erasing it, and closing the account.

   Who is asking comes only from the signed token that API Gateway checked (its `sub`). Every record is checked and cleaned
   with the same rules the apps use (@daybook/core), so nothing malformed is ever stored. Sizes are capped, and each person
   has a daily write allowance, so a broken client (or a stolen token) cannot run up a bill. */
import { keepEarned, mergeDay, normRecord, SUP_SYNC_WORDS, tombDay, WHY_FUTURE, WHY_LARGE, type Day, type Settings } from '@daybook/core';
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

import type { CheckApple, RevokeApple } from './apple-id';
import { AppleError, appleLink, appleSignIn, type AppleUsers } from './apple-sign-in';
import { BadCursor, type Store, type StoredRecord } from './store';
import { claimApple, claimStripe, heldBy, maySync, PayError, type Held, type Pay } from './supporter';

export const PAGE = 500;
export const MAX_PUSH = 200;
/** the largest request body, in bytes */
export const MAX_BODY = 1_000_000;
/** the largest record, in bytes of JSON: settings hold the lesson notes and writing, so they get more room than a day */
export const MAX_SETTINGS = 256_000;
export const MAX_RECORD = 64_000;
/** what one person may write in a day, in bytes. A year of honest logging is a few megabytes in all. */
export const DAILY_BYTES = 20_000_000;
/** a change time this far ahead of the server clock is a broken clock, and would win every future change, so it is refused */
export const MAX_SKEW = 24 * 3600_000;
export const OVERLAP = 60_000;
/** the largest body a tip claim may have (an Apple signed transaction is a few kilobytes) */
export const MAX_CLAIM = 32_000;
/** the open door's route, which API Gateway passes with no sign-in */
export const OPEN_CLAIM = 'POST /sync/claim';
/** Sign in with Apple's open door */
export const OPEN_APPLE = 'POST /sync/apple';

/** what Sign in with Apple needs, injected so the tests need no Apple or Cognito; left out, it answers "not set up yet" */
export interface AppleDeps {
  users?: AppleUsers;
  check?: CheckApple;
  revoke?: RevokeApple;
  /** the client id Apple gave a code to: the bundle id on iPhone, the Services ID on the web */
  clientIds?: { ios: string; web: string };
  /** the Apple ID an account signs in with, or null (an email account); read when an account is closed without Apple's code */
  appleOf?: (username: string) => Promise<string | null>;
  /** a line for the function's log (never a token) */
  log?: (msg: string) => void;
}

type Res = APIGatewayProxyStructuredResultV2;
const json = (statusCode: number, body: unknown): Res => ({
  statusCode,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  body: JSON.stringify(body),
});
const utcDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/* Two devices saving one record (the sync fuzz test, November 11, 2026). A device pulls, merges, then pushes; another
   device's push can land in between. Keeping only the newer change time would then drop what the other device had just
   saved: an entry logged on that day, a badge, a lesson, points. And answering "the account has a newer copy" told the
   device its change was safe when it was not. So a day or the settings coming in is joined with the copy the account
   holds, whichever is newer, the way the devices join them (mergeDay: every entry kept, a deleted entry stays deleted;
   keepEarned: what was earned stays). When the join holds more than either copy, it is kept with a change time past both,
   so every device takes it on its next pull. */

/** the copy to keep when `r` comes in and the account holds `cur` for the same id: the two joined, or null when `cur`
    already holds all of `r` (the answer is then "stale", which a device takes as "the account has it"). A deleted day is
    joined by the marks it carries; a deletion without marks, and any other kind of record, is simply the newer change. */
export function joinStored(r: StoredRecord, cur: StoredRecord): StoredRecord | null {
  const newerWins = () => (r.u > cur.u ? r : null);
  const isDay = r.id.startsWith('days/');
  if (r.id !== 'settings' && !isDay) return newerWins();
  const read = (x: StoredRecord): Settings | Day | null => {
    if (x.d != null) return (normRecord({ id: x.id, u: x.u, data: JSON.parse(x.d) })?.data as Settings | Day | undefined) ?? null;
    return isDay && x.g?.length ? tombDay(x.id.slice(5), x.g, x.u) : null;
  };
  const a = read(r);
  const b = read(cur);
  if (!a || !b) return newerWins();
  const theirsNewer = cur.u >= r.u;
  const newer = theirsNewer ? b : a;
  /* what a copy holds, whatever order its keys and marks are in */
  const canon = (x: unknown) =>
    JSON.stringify(x, (_k, v) =>
      v && typeof v === 'object' && !Array.isArray(v)
        ? Object.fromEntries(
            Object.keys(v)
              .sort()
              .map((k) => [k, (v as Record<string, unknown>)[k]]),
          )
        : v,
    );
  const body = (x: Settings | Day) =>
    isDay
      ? canon({ e: (x as Day).events, c: (x as Day).checkin ?? null, p: (x as Day).p ?? null, g: [...((x as Day).gone || [])].sort() })
      : canon({ ...x, u: 0 });
  let joined: Settings | Day | null;
  if (r.id === 'settings') joined = theirsNewer ? keepEarned(b as Settings, a as Settings) : keepEarned(a as Settings, b as Settings);
  else {
    /* mergeDay takes the newer copy first, and a copy of the same age from the account first, so a copy sent twice is
       the same as the one kept */
    joined = theirsNewer ? mergeDay(b as Day, { ...(a as Day), u: Math.min(r.u, cur.u) }) : mergeDay(a as Day, b as Day);
    if (joined) joined = { ...joined, u: 0 };
  }
  const u = Math.max(r.u, cur.u) + 1;
  /* the kept copy holds all of the incoming one. When the two still differ at the same change time (two devices joined
     the same copy and each stamped its join one past it), the device that sent the smaller one would keep it, thinking it
     has the account's; the kept copy is saved again one step newer, so that device takes it on its next pull. */
  const kept = (): StoredRecord | null =>
    r.u === cur.u && body(a) !== body(b) ? { ...cur, u, s: r.s, d: cur.d == null ? null : JSON.stringify({ ...JSON.parse(cur.d), u }) } : null;
  if (!joined) {
    /* a day with nothing left in it: kept as a deletion with every mark */
    const g = [...new Set([...((b as Day).gone || []), ...((a as Day).gone || [])])].slice(-100);
    if (body(newer) === body(tombDay('', g, 0))) return theirsNewer ? kept() : r;
    return { id: r.id, u, s: r.s, d: null, g };
  }
  /* the join holds nothing the newer copy does not (and the newer copy is a real one, not a deletion) */
  if (body(joined) === body(newer) && (theirsNewer ? cur.d != null : r.d != null)) return theirsNewer ? kept() : r;
  return { id: r.id, u, s: r.s, d: JSON.stringify({ ...joined, u }) };
}

/** the record with another change time, inside it too */
const stampedAt = (r: StoredRecord, u: number): StoredRecord => ({ ...r, u, d: r.d == null ? null : JSON.stringify({ ...JSON.parse(r.d), u }) });

/** saves one record, joined with the copy already kept (joinStored). True when saved, false when the account already
    holds all of it. Throws when other saves kept landing first.
    b: the change time of the kept copy the device made this one from (core SyncRecord.b), or null when it did not say (an
    older app, or a record new on that device). When the account still holds that very copy, nothing was saved meanwhile
    and the device's change stands as sent: an Undo that takes back what a mistaken log earned, or a cleared check-in, is
    not joined back in. */
export async function saveJoined(store: Store, user: string, r: StoredRecord, b: number | null = null): Promise<boolean> {
  if (r.id !== 'settings' && !r.id.startsWith('days/')) return store.putIfNewer(user, r);
  for (let i = 0; i < 4; i++) {
    const cur = await store.getRecord(user, r.id);
    /* made on top of the kept copy, it is the newer change whatever the clocks say (a phone whose clock is behind can stamp
       a day logged again after it was emptied below the copy it came from); it gets a change time past the kept one */
    const onTop = !!cur && b != null && cur.u === b;
    const w = !cur ? r : onTop ? (r.u > cur.u ? r : stampedAt(r, cur.u + 1)) : joinStored(r, cur);
    if (!w) return false;
    if (await store.putIfStill(user, w, cur ? cur.u : null)) return true;
  }
  throw new Error('the record kept changing');
}

/** deletes the person's sign-in (Cognito AdminDeleteUser, by user name). Injected, so the tests need no AWS. */
export type DeleteUser = (username: string) => Promise<void>;

const bodyOf = (event: APIGatewayProxyEventV2WithJWTAuthorizer) =>
  event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : event.body || '';
function claimBody(event: APIGatewayProxyEventV2WithJWTAuthorizer): Record<string, unknown> | null {
  const raw = bodyOf(event);
  if (Buffer.byteLength(raw) > MAX_CLAIM) return null;
  try {
    const o = JSON.parse(raw);
    return o && typeof o === 'object' ? o : null;
  } catch {
    return null;
  }
}
async function paid(f: () => Promise<Held>): Promise<Res> {
  try {
    return json(200, await f());
  } catch (e) {
    if (e instanceof PayError) return json(e.status, { error: e.message });
    throw e;
  }
}

async function signedIn(f: () => Promise<Record<string, unknown>>): Promise<Res> {
  try {
    return json(200, await f());
  } catch (e) {
    if (e instanceof AppleError) return json(e.status, { error: e.message, code: e.code });
    throw e;
  }
}

export function makeHandler(
  store: Store,
  clock: () => number = Date.now,
  deleteUser: DeleteUser = async () => undefined,
  pay: Pay = {},
  apple: AppleDeps = {},
) {
  const appleOff = () => json(503, { error: 'Sign in with Apple is not set up yet.', code: 'AppleOff' });
  return async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<Res> {
    /* Sign in with Apple: Apple's token is the only proof; a sign-in sent along is never read */
    if (event.routeKey === OPEN_APPLE) {
      if (!apple.users || !apple.check) return appleOff();
      const b = claimBody(event);
      if (!b) return json(400, { error: 'Send { token, nonce }.' });
      const { users, check } = apple;
      return signedIn(async () => ({ tokens: await appleSignIn(users, check, b) }));
    }
    /* the open door: a web tip from a signed-out device. It never reads a sign-in, even if one is sent. */
    if (event.routeKey === OPEN_CLAIM) {
      const b = claimBody(event);
      if (!b) return json(400, { error: 'Send { session }.' });
      return paid(() => claimStripe(store, pay, '', '', b.session, clock()));
    }
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    const user = claims?.sub;
    if (typeof user !== 'string' || !user) return json(401, { error: 'Sign in first.' });
    /* the access token names the user (username); in a pool that signs in with email it is the same as sub */
    const username = typeof claims?.username === 'string' && claims.username ? claims.username : user;
    const method = event.requestContext.http.method;
    const q = event.queryStringParameters || {};

    if (method === 'POST' && q.apple === 'link') {
      if (!apple.users || !apple.check) return appleOff();
      const b = claimBody(event);
      if (!b) return json(400, { error: 'Send { token, nonce }.' });
      const { users, check } = apple;
      return signedIn(async () => ({ apple: await appleLink(users, check, username, b) }));
    }

    if (method === 'GET' && q.erased === '1') return json(200, await store.erased(user, clock()));

    if (method === 'GET' && q.sup === '1') return json(200, await heldBy(store, user, username, pay, clock()));

    if (method === 'POST' && (q.claim === 'stripe' || q.claim === 'apple')) {
      const b = claimBody(event);
      if (!b) return json(400, { error: q.claim === 'stripe' ? 'Send { session }.' : 'Send { jws }.' });
      if (q.claim === 'stripe') return paid(() => claimStripe(store, pay, user, username, b.session, clock()));
      return paid(() => claimApple(store, pay, user, username, b.jws, clock()));
    }

    if (method === 'POST' && q.restore === '1') {
      const left = await store.erased(user, clock());
      if (!left.n) return json(200, { restored: 0 });
      /* bringing a log back counts against the day's writes like any other save */
      if (!(await store.useAllowance(user, utcDay(clock()), left.n * 2000, DAILY_BYTES)))
        return json(429, { error: 'That is more than a day of syncing allows. It will work again tomorrow.' });
      return json(200, { restored: await store.restore(user, clock()) });
    }

    if (method === 'GET') {
      const since = q.since == null ? 0 : Number(q.since);
      if (!Number.isFinite(since) || since < 0) return json(400, { error: 'since must be a time in ms.' });
      const now = clock();
      try {
        const page = await store.changedSince(user, Math.max(0, since - OVERLAP), PAGE, q.cursor || null);
        const records = page.items.map((r) => ({
          id: r.id,
          u: r.u,
          data: r.d == null ? null : JSON.parse(r.d),
          ...(r.d == null && r.g?.length ? { gone: r.g } : {}),
        }));
        return json(200, { records, cursor: page.cursor, now });
      } catch (e) {
        if (e instanceof BadCursor) return json(400, { error: 'That cursor is not valid.' });
        throw e;
      }
    }

    if (method === 'POST') {
      /* sync needs support (or an account from before tips); nothing is saved, and nothing already saved is touched */
      if (!(await maySync(store, user, username, pay, clock()))) return json(402, { error: SUP_SYNC_WORDS.need, need: 'support' });
      const raw = bodyOf(event);
      if (Buffer.byteLength(raw) > MAX_BODY) return json(413, { error: `Send at most ${MAX_BODY} bytes at a time.` });
      let body: unknown;
      try {
        body = JSON.parse(raw);
      } catch {
        return json(400, { error: 'The body must be JSON.' });
      }
      const list = (body as { records?: unknown })?.records;
      if (!Array.isArray(list)) return json(400, { error: 'Send { records: [...] }.' });
      if (list.length > MAX_PUSH) return json(413, { error: `Send at most ${MAX_PUSH} records at a time.` });
      const now = clock();
      const saved: string[] = [];
      const stale: string[] = [];
      const bad: { id: unknown; why: string }[] = [];
      const ok: StoredRecord[] = [];
      const bases = new Map<string, number>();
      let bytes = 0;
      for (const item of list) {
        const r = normRecord(item);
        const id = (item as { id?: unknown })?.id;
        if (!r) {
          bad.push({ id, why: 'not a valid record' });
          continue;
        }
        if (r.u > now + MAX_SKEW) {
          bad.push({ id, why: WHY_FUTURE });
          continue;
        }
        const d = r.data == null ? null : JSON.stringify(r.data);
        const size = d ? Buffer.byteLength(d) : 0;
        if (size > (r.id === 'settings' ? MAX_SETTINGS : MAX_RECORD)) {
          bad.push({ id, why: WHY_LARGE });
          continue;
        }
        bytes += size + r.id.length;
        ok.push(r.gone ? { id: r.id, u: r.u, s: now, d, g: r.gone } : { id: r.id, u: r.u, s: now, d });
        if (r.b != null) bases.set(r.id, r.b);
      }
      if (ok.length && !(await store.useAllowance(user, utcDay(now), bytes, DAILY_BYTES)))
        return json(429, { error: 'That is more than a day of syncing allows. It will work again tomorrow.' });
      /* a few at a time, so one big push does not flood the table; a record that fails is reported, and the rest still save */
      for (let i = 0; i < ok.length; i += 10) {
        const part = ok.slice(i, i + 10);
        const res = await Promise.allSettled(part.map((r) => saveJoined(store, user, r, bases.get(r.id) ?? null)));
        res.forEach((x, j) => {
          if (x.status === 'rejected') bad.push({ id: part[j].id, why: 'could not save, try again' });
          else (x.value ? saved : stale).push(part[j].id);
        });
      }
      return json(200, { saved, stale, bad, now });
    }

    if (method === 'DELETE') {
      const all = q.all === '1';
      /* closing an account that signs in with Apple: Apple is told to forget Daybook first (Apple's rule). The account is
         closed either way once the app has tried; a code that does not work only leaves a line in the log. An account
         joined to Apple that comes with no code (signed in here with the password) is sent back for one, so Apple is
         asked whichever way the person signed in on this device. */
      if (all) {
        const raw = claimBody(event)?.apple;
        const a = raw && typeof raw === 'object' ? (raw as { code?: unknown; client?: unknown; skip?: unknown }) : null;
        if (a?.skip === true) apple.log?.('apple revoke on close: skipped (this device cannot ask Apple)');
        else if (a && apple.revoke && apple.clientIds) {
          const id = a.client === 'web' ? apple.clientIds.web : apple.clientIds.ios;
          const r = id ? await apple.revoke(a.code, id) : 'no-key';
          apple.log?.('apple revoke on close: ' + r);
        } else if (!a && apple.appleOf && (await apple.appleOf(username).catch(() => null)))
          return json(409, { code: 'NeedApple', error: 'This account signs in with Apple too, so Apple is asked once more. Nothing was deleted.' });
      }
      /* closing the account: the tips linked to it are let go first, so nothing is left that points to it */
      if (all) await store.dropClaims(user);
      const n = await store.erase(user, clock(), all);
      if (all) {
        /* the log first (it can be done again), then the sign-in; if that fails, the app asks again and only it is left */
        try {
          await deleteUser(username);
        } catch {
          return json(502, { error: 'Your log was removed, but the account could not be closed. Try again.', erased: n });
        }
      }
      return json(200, { erased: n });
    }

    return json(405, { error: 'Use GET, POST or DELETE.' });
  };
}
