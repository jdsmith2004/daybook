import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { beforeEach, describe, expect, it } from 'vitest';

import { MemoryStore } from '../src/store';
import { DAILY_BYTES, makeHandler, MAX_PUSH, MAX_RECORD, MAX_SKEW, OVERLAP } from '../src/sync';

let now = 1_000_000_000;
let store: MemoryStore;
let handler: ReturnType<typeof makeHandler>;

function ev(method: string, opts: { user?: string | null; body?: unknown; query?: Record<string, string>; raw?: string } = {}) {
  const user = opts.user === undefined ? 'alice' : opts.user;
  return {
    requestContext: {
      http: { method },
      authorizer: user == null ? undefined : { jwt: { claims: { sub: user }, scopes: [] } },
    },
    queryStringParameters: opts.query,
    body: opts.raw ?? (opts.body === undefined ? undefined : JSON.stringify(opts.body)),
    isBase64Encoded: false,
  } as unknown as APIGatewayProxyEventV2WithJWTAuthorizer;
}
const call = async (e: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  const r = await handler(e);
  return { status: r.statusCode ?? 0, body: JSON.parse(r.body as string) };
};
const day = (k: string, u: number, extra: Record<string, unknown> = {}) => ({
  id: `days/${k}`,
  u,
  data: { d: k, events: [{ id: 'e' + u, time: '22:00', outcome: 'rode' }], checkin: null, p: null, u, ...extra },
});

beforeEach(() => {
  now = 1_000_000_000;
  store = new MemoryStore();
  handler = makeHandler(store, () => now);
});

describe('sync', () => {
  it('needs a signed-in person', async () => {
    expect((await call(ev('GET', { user: null }))).status).toBe(401);
  });

  it('saves records and gives them back, cleaned up', async () => {
    const p = await call(ev('POST', { body: { records: [day('2026-10-14', 500), { id: 'settings', u: 600, data: { start: '2026-10-01', cleanMode: 'weird' } }] } }));
    expect(p.status).toBe(200);
    expect(p.body.saved).toEqual(['days/2026-10-14', 'settings']);
    const g = await call(ev('GET', { query: { since: '0' } }));
    expect(g.body.records.map((r: { id: string }) => r.id).sort()).toEqual(['days/2026-10-14', 'settings']);
    const st = g.body.records.find((r: { id: string }) => r.id === 'settings');
    expect(st.data.cleanMode).toBe('strict');
    expect(st.data.u).toBe(600);
    expect(g.body.now).toBe(now);
  });

  it('keeps the newer change when two devices change the same day', async () => {
    await call(ev('POST', { body: { records: [day('2026-10-14', 700)] } }));
    const older = await call(ev('POST', { body: { records: [day('2026-10-14', 650)] } }));
    expect(older.body.stale).toEqual(['days/2026-10-14']);
    const same = await call(ev('POST', { body: { records: [day('2026-10-14', 700)] } }));
    expect(same.body.stale).toEqual(['days/2026-10-14']);
    const newer = await call(ev('POST', { body: { records: [day('2026-10-14', 800)] } }));
    expect(newer.body.saved).toEqual(['days/2026-10-14']);
  });

  it('never lets one person see another person’s records', async () => {
    await call(ev('POST', { user: 'alice', body: { records: [day('2026-10-14', 500)] } }));
    const bob = await call(ev('GET', { user: 'bob', query: { since: '0' } }));
    expect(bob.body.records).toEqual([]);
  });

  it('finds changes by when the server saved them, so a device with a slow clock is not missed', async () => {
    const first = await call(ev('GET', { query: { since: '0' } }));
    now += 10 * 60_000;
    /* this device's clock is an hour behind: its change time is before the last pull, but it was saved after */
    await call(ev('POST', { body: { records: [day('2026-10-14', first.body.now - 3600_000)] } }));
    const next = await call(ev('GET', { query: { since: String(first.body.now) } }));
    expect(next.body.records.map((r: { id: string }) => r.id)).toEqual(['days/2026-10-14']);
  });

  it('overlaps pulls by a minute, so a save that lands during a pull is not missed', async () => {
    await call(ev('POST', { body: { records: [day('2026-10-14', 500)] } }));
    const g = await call(ev('GET', { query: { since: String(now + OVERLAP - 1) } }));
    expect(g.body.records).toHaveLength(1);
    const later = await call(ev('GET', { query: { since: String(now + OVERLAP) } }));
    expect(later.body.records).toHaveLength(0);
  });

  it('pages through a long history', async () => {
    const recs = Array.from({ length: 150 }, (_, i) => day(`2026-0${1 + Math.floor(i / 28)}-${String(1 + (i % 28)).padStart(2, '0')}`, 100 + i));
    for (let i = 0; i < 6; i++) {
      await call(ev('POST', { body: { records: recs.slice(i * 25, i * 25 + 25) } }));
      now += 1;
    }
    let cursor: string | null = null;
    const seen = new Set<string>();
    let pages = 0;
    do {
      const q: Record<string, string> = { since: '0' };
      if (cursor) q.cursor = cursor;
      const g = await call(ev('GET', { query: q }));
      g.body.records.forEach((r: { id: string }) => seen.add(r.id));
      cursor = g.body.cursor;
      pages++;
    } while (cursor && pages < 10);
    expect(seen.size).toBe(150);
  });

  it('refuses records that are not valid, from the future, or too many', async () => {
    const p = await call(
      ev('POST', {
        body: {
          records: [
            { id: 'days/not-a-day', u: 5, data: {} },
            { id: 'passwords', u: 5, data: {} },
            { id: 'days/2026-10-14', u: 'soon', data: {} },
            day('2026-10-13', now + MAX_SKEW + 1),
            day('2026-10-12', 900),
          ],
        },
      }),
    );
    expect(p.body.saved).toEqual(['days/2026-10-12']);
    expect(p.body.bad.map((b: { why: string }) => b.why)).toEqual([
      'not a valid record',
      'not a valid record',
      'not a valid record',
      'its time is in the future',
    ]);
    const many = await call(ev('POST', { body: { records: Array.from({ length: MAX_PUSH + 1 }, (_, i) => day('2026-10-12', i + 1)) } }));
    expect(many.status).toBe(413);
    expect((await call(ev('POST', { raw: '{nope' }))).status).toBe(400);
    expect((await call(ev('POST', { body: { nope: 1 } }))).status).toBe(400);
    expect((await call(ev('GET', { query: { since: '-4' } }))).status).toBe(400);
  });

  it('keeps a deletion, so other devices remove the record too', async () => {
    await call(ev('POST', { body: { records: [day('2026-10-14', 500)] } }));
    await call(ev('POST', { body: { records: [{ id: 'days/2026-10-14', u: 600, data: null }] } }));
    const g = await call(ev('GET', { query: { since: '0' } }));
    expect(g.body.records).toEqual([{ id: 'days/2026-10-14', u: 600, data: null }]);
  });

  it('erases one person’s log as deletions, so their other devices remove it too, and leaves others alone', async () => {
    await call(ev('POST', { user: 'alice', body: { records: [day('2026-10-14', 500), day('2026-10-13', 500)] } }));
    await call(ev('POST', { user: 'bob', body: { records: [day('2026-10-14', 500)] } }));
    now += 1000;
    const d = await call(ev('DELETE', { user: 'alice' }));
    expect(d.body.erased).toBe(2);
    const g = await call(ev('GET', { user: 'alice', query: { since: '0' } }));
    expect(g.body.records.map((r: { data: unknown }) => r.data)).toEqual([null, null]);
    /* an older copy pushed from another device does not bring it back */
    const again = await call(ev('POST', { user: 'alice', body: { records: [day('2026-10-14', 500)] } }));
    expect(again.body.stale).toEqual(['days/2026-10-14']);
    expect((await call(ev('GET', { user: 'bob', query: { since: '0' } }))).body.records[0].data).not.toBeNull();
    /* closing the account removes everything for good */
    await call(ev('DELETE', { user: 'alice', query: { all: '1' } }));
    expect((await call(ev('GET', { user: 'alice', query: { since: '0' } }))).body.records).toEqual([]);
  });

  it('caps record size in bytes, not characters', async () => {
    const big = day('2026-10-14', 500, { events: [{ id: 'e', time: '22:00', outcome: 'rode', note: 'é'.repeat(400) }] });
    const p = await call(ev('POST', { body: { records: [big] } }));
    expect(p.body.saved).toEqual(['days/2026-10-14']); // notes are cut to 500 characters by the shared rules
    const settings = { id: 'settings', u: 600, data: { start: '2026-10-01', huge: 'é'.repeat(MAX_RECORD * 3) } };
    const s = await call(ev('POST', { body: { records: [settings] } }));
    expect(s.body.bad.map((b: { why: string }) => b.why)).toEqual(['too large']);
  });

  it('refuses a body over the size limit', async () => {
    const r = await call(ev('POST', { raw: JSON.stringify({ records: [], pad: 'x'.repeat(1_100_000) }) }));
    expect(r.status).toBe(413);
  });

  it('stops a runaway client at the daily allowance', async () => {
    const one = day('2026-10-14', 500, { events: Array.from({ length: 60 }, (_, i) => ({ id: 'e' + i, time: '22:00', outcome: 'rode', note: 'x'.repeat(490) })) });
    let status = 200;
    let n = 0;
    while (status === 200 && n < 2000) {
      const batch = Array.from({ length: 30 }, (_, i) => ({ ...one, id: `days/2026-0${1 + (i % 9)}-1${i % 10}`, u: 1000 + n * 100 + i }));
      status = (await call(ev('POST', { body: { records: batch } }))).status;
      n++;
    }
    expect(status).toBe(429);
    const used = [...store.usage.values()][0];
    expect(used).toBeLessThanOrEqual(DAILY_BYTES);
    expect(used).toBeGreaterThan(DAILY_BYTES * 0.9);
    now += 86_400_000;
    expect((await call(ev('POST', { body: { records: [day('2026-10-14', now)] } }))).status).toBe(200);
  });

  it('a cursor cannot reach into another person’s log', async () => {
    const forged = Buffer.from(JSON.stringify({ u: 'bob', i: 0 })).toString('base64url');
    expect((await call(ev('GET', { user: 'alice', query: { since: '0', cursor: forged } }))).status).toBe(400);
    expect((await call(ev('GET', { query: { since: '0', cursor: '%%%' } }))).status).toBe(400);
  });

  it('reports a record that fails to save, and saves the rest', async () => {
    const failing = new MemoryStore();
    const put = failing.putIfNewer.bind(failing);
    failing.putIfNewer = async (u, r) => {
      if (r.id === 'days/2026-10-13') throw new Error('boom');
      return put(u, r);
    };
    handler = makeHandler(failing, () => now);
    const p = await call(ev('POST', { body: { records: [day('2026-10-13', 500), day('2026-10-14', 500)] } }));
    expect(p.status).toBe(200);
    expect(p.body.saved).toEqual(['days/2026-10-14']);
    expect(p.body.bad).toEqual([{ id: 'days/2026-10-13', why: 'could not save, try again' }]);
  });

  it('answers other methods with 405', async () => {
    expect((await call(ev('PUT'))).status).toBe(405);
  });
});

describe('a week to undo an erase, and closing the account', () => {
  it('keeps a copy for a week, never pulled, and brings it back on request', async () => {
    await call(ev('POST', { body: { records: [day('2026-10-14', 500), day('2026-10-13', 500)] } }));
    now += 1000;
    await call(ev('DELETE'));
    const e = await call(ev('GET', { query: { erased: '1' } }));
    expect(e.body.n).toBe(2);
    /* the copy is the server's own: a pull shows only the deletions */
    const g = await call(ev('GET', { query: { since: '0' } }));
    expect(g.body.records.every((r: { data: unknown }) => r.data === null)).toBe(true);
    /* another person cannot see or restore it */
    expect((await call(ev('GET', { user: 'bob', query: { erased: '1' } }))).body.n).toBe(0);
    expect((await call(ev('POST', { user: 'bob', query: { restore: '1' } }))).body.restored).toBe(0);
    /* a day logged again since the erase is left as it is */
    now += 1000;
    await call(ev('POST', { body: { records: [day('2026-10-14', now)] } }));
    now += 1000;
    const r = await call(ev('POST', { query: { restore: '1' } }));
    expect(r.body.restored).toBe(1);
    const after = await call(ev('GET', { query: { since: '0' } }));
    const byId = Object.fromEntries(after.body.records.map((x: { id: string; u: number; data: unknown }) => [x.id, x]));
    expect(byId['days/2026-10-13'].data).not.toBeNull();
    expect(byId['days/2026-10-14'].u).toBe(now - 1000);
    /* the copy is used up */
    expect((await call(ev('GET', { query: { erased: '1' } }))).body.n).toBe(0);
  });

  it('closes the account: the log and its copy go for good, then the sign-in', async () => {
    const gone: string[] = [];
    handler = makeHandler(store, () => now, async (u) => void gone.push(u));
    await call(ev('POST', { body: { records: [day('2026-10-14', 500)] } }));
    await call(ev('DELETE'));
    const d = await call(ev('DELETE', { query: { all: '1' } }));
    expect(d.status).toBe(200);
    expect(gone).toEqual(['alice']);
    expect((await call(ev('GET', { query: { erased: '1' } }))).body.n).toBe(0);
    expect((await call(ev('GET', { query: { since: '0' } }))).body.records).toEqual([]);
  });

  it('says so when the log went but the sign-in could not be deleted', async () => {
    handler = makeHandler(store, () => now, async () => {
      throw new Error('cognito down');
    });
    await call(ev('POST', { body: { records: [day('2026-10-14', 500)] } }));
    const d = await call(ev('DELETE', { query: { all: '1' } }));
    expect(d.status).toBe(502);
    expect(d.body.error).toMatch(/log was removed/);
  });
});
