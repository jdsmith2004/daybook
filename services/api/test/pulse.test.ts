/* The pulse API: only checked counts become totals, nothing about who sent them is kept, feedback is kept plainly, the
   daily ceilings hold, and only the owner can read. */
import { describe, expect, it } from 'vitest';

import { DAILY_BATCHES, makePulseHandler, MemoryPulseStore, PULSE_BODY } from '../src/pulse';

const NOW = Date.parse('2026-10-22T15:00:00Z');
const OWNER = 'owner-sub';
const post = (path: string, body: unknown, ip = '203.0.113.9') =>
  ({
    rawPath: path,
    body: typeof body === 'string' ? body : JSON.stringify(body),
    isBase64Encoded: false,
    headers: { 'x-forwarded-for': ip },
    requestContext: { http: { method: 'POST', path, sourceIp: ip } },
  }) as never;
const get = (sub: string | null, q: Record<string, string> = {}) =>
  ({
    rawPath: '/pulse',
    queryStringParameters: q,
    requestContext: { http: { method: 'GET', path: '/pulse' }, authorizer: sub ? { jwt: { claims: { sub } } } : undefined },
  }) as never;
const make = () => {
  const store = new MemoryPulseStore();
  return { store, h: makePulseHandler(store, OWNER, () => NOW) };
};
const batch = { p: 'ios', v: '1.0.0', days: [{ d: '2026-10-21', c: { sos: 2, act_1: 1, back_1: 1 } }] };

describe('counts', () => {
  it('adds a batch to the totals of its day and platform, and nothing else', async () => {
    const { store, h } = make();
    expect((await h(post('/pulse', batch))).statusCode).toBe(200);
    expect((await h(post('/pulse', { ...batch, days: [{ d: '2026-10-21', c: { sos: 1 } }] }, '198.51.100.1'))).statusCode).toBe(200);
    expect(store.rows.get('2026-10-21#ios')).toEqual({ sos: 3, act_1: 1, back_1: 1, batches: 2 });
    expect(store.rows.get('2026-10-21#v#1.0.0')).toEqual({ batches: 2 });
    /* no address, no id, no time of day anywhere in what is kept */
    const kept = JSON.stringify([...store.rows.entries()]);
    expect(kept).not.toMatch(/203\.0|198\.51|uid|someone/);
  });
  it('drops names that are not on the list and refuses an empty batch', async () => {
    const { store, h } = make();
    await h(post('/pulse', { ...batch, uid: 'someone', days: [{ d: '2026-10-21', c: { sos: 1, my_secret: 4 } }] }));
    expect(store.rows.get('2026-10-21#ios')).toEqual({ sos: 1, batches: 1 });
    expect((await h(post('/pulse', { p: 'ios', v: '1', days: [{ d: '2026-10-21', c: { nope: 1 } }] }))).statusCode).toBe(400);
    expect((await h(post('/pulse', 'not json'))).statusCode).toBe(400);
    expect((await h(post('/pulse', 'x'.repeat(PULSE_BODY + 1)))).statusCode).toBe(413);
  });
  it('stops at the daily ceiling', async () => {
    const { store, h } = make();
    store.caps.set('batch#2026-10-22', DAILY_BATCHES);
    expect((await h(post('/pulse', batch))).statusCode).toBe(429);
    expect(store.rows.size).toBe(0);
  });
});

describe('feedback', () => {
  it('keeps the words, a reply address only if given, and when', async () => {
    const { store, h } = make();
    expect((await h(post('/pulse/feedback', { t: ' The sunrise check helped. ', p: 'ios', v: '1.0.0' }))).statusCode).toBe(200);
    expect(store.kept).toHaveLength(1);
    expect(store.kept[0]).toMatchObject({ at: NOW, t: 'The sunrise check helped.', r: null, p: 'ios' });
    expect(JSON.stringify(store.kept)).not.toMatch(/203\.0/);
    expect((await h(post('/pulse/feedback', { t: '' }))).statusCode).toBe(400);
  });
});

describe('reading', () => {
  it('only the owner can read; anyone else gets their own id back, to set up', async () => {
    const { h } = make();
    await h(post('/pulse', batch));
    expect((await h(get(null))).statusCode).toBe(401);
    const other = await h(get('someone-else'));
    expect(other.statusCode).toBe(403);
    expect(JSON.parse(other.body as string).you).toBe('someone-else');
    const mine = await h(get(OWNER, { from: '2026-10-01' }));
    expect(mine.statusCode).toBe(200);
    expect(JSON.parse(mine.body as string).totals).toContainEqual({ k: '2026-10-21#ios', n: { sos: 2, act_1: 1, back_1: 1, batches: 1 } });
  });
  it('with no owner set, no one can read', async () => {
    const h = makePulseHandler(new MemoryPulseStore(), '', () => NOW);
    expect((await h(get('anyone'))).statusCode).toBe(403);
  });
});
