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

   Who is asking comes only from the signed token that API Gateway checked (its `sub`). Every record is checked and cleaned
   with the same rules the apps use (@daybook/core), so nothing malformed is ever stored. Sizes are capped, and each person
   has a daily write allowance, so a broken client (or a stolen token) cannot run up a bill. */
import { normRecord } from '@daybook/core';
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

import { BadCursor, type Store } from './store';

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

type Res = APIGatewayProxyStructuredResultV2;
const json = (statusCode: number, body: unknown): Res => ({
  statusCode,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  body: JSON.stringify(body),
});
const utcDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** deletes the person's sign-in (Cognito AdminDeleteUser, by user name). Injected, so the tests need no AWS. */
export type DeleteUser = (username: string) => Promise<void>;

export function makeHandler(store: Store, clock: () => number = Date.now, deleteUser: DeleteUser = async () => undefined) {
  return async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<Res> {
    const user = event.requestContext?.authorizer?.jwt?.claims?.sub;
    if (typeof user !== 'string' || !user) return json(401, { error: 'Sign in first.' });
    const method = event.requestContext.http.method;
    const q = event.queryStringParameters || {};

    if (method === 'GET' && q.erased === '1') return json(200, await store.erased(user, clock()));

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
        const records = page.items.map((r) => ({ id: r.id, u: r.u, data: r.d == null ? null : JSON.parse(r.d) }));
        return json(200, { records, cursor: page.cursor, now });
      } catch (e) {
        if (e instanceof BadCursor) return json(400, { error: 'That cursor is not valid.' });
        throw e;
      }
    }

    if (method === 'POST') {
      const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : event.body || '';
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
      const ok: { id: string; u: number; s: number; d: string | null }[] = [];
      let bytes = 0;
      for (const item of list) {
        const r = normRecord(item);
        const id = (item as { id?: unknown })?.id;
        if (!r) {
          bad.push({ id, why: 'not a valid record' });
          continue;
        }
        if (r.u > now + MAX_SKEW) {
          bad.push({ id, why: 'its time is in the future' });
          continue;
        }
        const d = r.data == null ? null : JSON.stringify(r.data);
        const size = d ? Buffer.byteLength(d) : 0;
        if (size > (r.id === 'settings' ? MAX_SETTINGS : MAX_RECORD)) {
          bad.push({ id, why: 'too large' });
          continue;
        }
        bytes += size + r.id.length;
        ok.push({ id: r.id, u: r.u, s: now, d });
      }
      if (ok.length && !(await store.useAllowance(user, utcDay(now), bytes, DAILY_BYTES)))
        return json(429, { error: 'That is more than a day of syncing allows. It will work again tomorrow.' });
      /* a few at a time, so one big push does not flood the table; a record that fails is reported, and the rest still save */
      for (let i = 0; i < ok.length; i += 10) {
        const part = ok.slice(i, i + 10);
        const res = await Promise.allSettled(part.map((r) => store.putIfNewer(user, r)));
        res.forEach((x, j) => {
          if (x.status === 'rejected') bad.push({ id: part[j].id, why: 'could not save, try again' });
          else (x.value ? saved : stale).push(part[j].id);
        });
      }
      return json(200, { saved, stale, bad, now });
    }

    if (method === 'DELETE') {
      const all = q.all === '1';
      const n = await store.erase(user, clock(), all);
      if (all) {
        /* the log first (it can be done again), then the sign-in; if that fails, the app asks again and only it is left */
        try {
          /* the access token names the user (username); in a pool that signs in with email it is the same as sub */
          const name = event.requestContext.authorizer?.jwt?.claims?.username;
          await deleteUser(typeof name === 'string' && name ? name : user);
        } catch {
          return json(502, { error: 'Your log was removed, but the account could not be closed. Try again.', erased: n });
        }
      }
      return json(200, { erased: n });
    }

    return json(405, { error: 'Use GET, POST or DELETE.' });
  };
}
