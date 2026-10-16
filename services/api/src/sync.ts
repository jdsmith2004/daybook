/* The sync API.

   GET    /sync?since=<ms>&cursor=<c>   what was saved on the server after `since` (the `now` of the last pull), oldest first,
                                       up to PAGE records at a time; keep asking with `cursor` until it comes back null.
                                       Pulls overlap by a minute, so a save that lands while a pull runs is never missed;
                                       a record that comes twice is simply not newer the second time.
   POST   /sync   { records: [...] }     save these records; each is kept only if it is newer than the one already there
   DELETE /sync                          erase everything this person has on the server

   Who is asking comes only from the signed token that API Gateway checked (its `sub`). Every record is checked and cleaned
   with the same rules the apps use (@daybook/core), so nothing malformed is ever stored. */
import { normRecord } from '@daybook/core';
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

import type { Store } from './store';

export const PAGE = 500;
export const MAX_PUSH = 200;
/** a record's JSON can be at most this long (DynamoDB allows 400 KB an item) */
export const MAX_RECORD = 350_000;
/** a change time this far ahead of the server clock is a broken clock, and would win every future change, so it is refused */
export const MAX_SKEW = 24 * 3600_000;
export const OVERLAP = 60_000;

type Res = APIGatewayProxyStructuredResultV2;
const json = (statusCode: number, body: unknown): Res => ({
  statusCode,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  body: JSON.stringify(body),
});

export function makeHandler(store: Store, clock: () => number = Date.now) {
  return async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer): Promise<Res> {
    const user = event.requestContext?.authorizer?.jwt?.claims?.sub;
    if (typeof user !== 'string' || !user) return json(401, { error: 'Sign in first.' });
    const method = event.requestContext.http.method;

    if (method === 'GET') {
      const q = event.queryStringParameters || {};
      const since = q.since == null ? 0 : Number(q.since);
      if (!Number.isFinite(since) || since < 0) return json(400, { error: 'since must be a time in ms.' });
      const now = clock();
      let page;
      try {
        page = await store.changedSince(user, Math.max(0, since - OVERLAP), PAGE, q.cursor || null);
      } catch (e) {
        if (q.cursor) return json(400, { error: 'That cursor is not valid.' });
        throw e;
      }
      const records = page.items.map((r) => ({ id: r.id, u: r.u, data: r.d == null ? null : JSON.parse(r.d) }));
      return json(200, { records, cursor: page.cursor, now });
    }

    if (method === 'POST') {
      let body: unknown;
      try {
        body = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : event.body || '');
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
      const ok = [];
      for (const raw of list) {
        const r = normRecord(raw);
        const id = (raw as { id?: unknown })?.id;
        if (!r) bad.push({ id, why: 'not a valid record' });
        else if (r.u > now + MAX_SKEW) bad.push({ id, why: 'its time is in the future' });
        else {
          const d = r.data == null ? null : JSON.stringify(r.data);
          if (d && d.length > MAX_RECORD) bad.push({ id, why: 'too large' });
          else ok.push({ id: r.id, u: r.u, s: now, d });
        }
      }
      /* a few at a time, so one big push does not flood the table */
      for (let i = 0; i < ok.length; i += 10) {
        const part = ok.slice(i, i + 10);
        const res = await Promise.all(part.map((r) => store.putIfNewer(user, r)));
        res.forEach((done, j) => (done ? saved : stale).push(part[j].id));
      }
      return json(200, { saved, stale, bad, now });
    }

    if (method === 'DELETE') {
      const n = await store.eraseAll(user);
      return json(200, { erased: n });
    }

    return json(405, { error: 'Use GET, POST or DELETE.' });
  };
}
