/* Friends (beta): a friend reads only what the sharer turned on, only while both sides hold the friendship, and never another
   account; removing, blocking and closing an account leave nothing behind (src/friends.ts). */
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { beforeEach, describe, expect, it } from 'vitest';

import { BLOCK, BLOCKED_BY, CARD, CHEER, FR, INVITES, LOOKS_A_DAY, MYINV, REPORTS } from '../src/friends';
import { MemoryStore } from '../src/store';
import { makeHandler } from '../src/sync';

let now: number;
let store: MemoryStore;
let handler: ReturnType<typeof makeHandler>;

function ev(user: string, method: string, friends: string, body?: unknown, extra: Record<string, string> = {}) {
  return {
    requestContext: { http: { method }, authorizer: { jwt: { claims: { sub: user }, scopes: [] } } },
    queryStringParameters: { friends, ...extra },
    body: body === undefined ? undefined : JSON.stringify(body),
    isBase64Encoded: false,
  } as unknown as APIGatewayProxyEventV2WithJWTAuthorizer;
}
async function call(user: string, method: string, friends: string, body?: unknown, extra?: Record<string, string>) {
  const r = await handler(ev(user, method, friends, body, extra));
  return { status: r.statusCode ?? 0, body: JSON.parse(r.body as string) };
}
const view = async (user: string) => (await call(user, 'GET', '1')).body;
const ALL_ON = { lessons: true, checkins: true, days: true, rode: true, level: true };
const VALS = { lessons: 4, checkins: 3, days: 5, rode: 2, level: 6, lname: 'Steady', dk: '2026-11-15', dl: 1, dc: 1 };

async function setCard(user: string, name: string, on: Record<string, boolean> = {}, extra: Record<string, unknown> = {}) {
  return call(user, 'POST', 'card', { card: { name, on, vals: VALS, rt: '21:00', at: now, ...extra } });
}
async function befriend(a: string, b: string) {
  const inv = await call(a, 'POST', 'invite', {});
  expect(inv.status).toBe(200);
  const acc = await call(b, 'POST', 'accept', { code: inv.body.code });
  expect(acc.status).toBe(200);
  return { code: inv.body.code as string, fid: acc.body.fid as string };
}

beforeEach(() => {
  now = Date.now();
  store = new MemoryStore();
  store.auxNow = () => now;
  handler = makeHandler(store, () => now);
});

describe('what a friend can read', () => {
  it('nothing is shared until the sharer turns it on, and only what is on', async () => {
    await setCard('alice', 'Alice');
    await setCard('bob', 'Bob');
    await befriend('alice', 'bob');
    let f = (await view('bob')).friends;
    expect(f).toHaveLength(1);
    expect(f[0].name).toBe('Alice');
    expect(f[0].vals).toEqual({});
    await setCard('alice', 'Alice', { lessons: true, rode: true });
    f = (await view('bob')).friends;
    expect(f[0].vals).toEqual({ lessons: 4, rode: 2, dk: '2026-11-15', dl: 1 });
    expect(f[0].rt).toBe('21:00');
    /* the numbers for what is off are never even kept */
    expect(Object.keys((await store.auxGet('alice', CARD)) as object)).not.toContain('slips');
    expect(((await store.auxGet('alice', CARD)) as { vals: object }).vals).toEqual({ lessons: 4, rode: 2, dk: '2026-11-15', dl: 1 });
  });

  it('a card can never carry a slip, a count or anything outside the shape', async () => {
    await setCard('alice', 'Alice', ALL_ON, { vals: { ...VALS, slips: 3, count: 40, journal: 'x' }, slips: 2, journal: 'secret', notes: ['n'] });
    await setCard('bob', 'Bob');
    await befriend('alice', 'bob');
    const f = (await view('bob')).friends[0];
    const text = JSON.stringify(f);
    for (const w of ['slips', 'count', 'journal', 'secret', 'notes']) expect(text).not.toContain(w);
    expect(Object.keys(f.vals).sort()).toEqual(['checkins', 'days', 'dc', 'dk', 'dl', 'lessons', 'level', 'lname', 'rode']);
  });

  it('a stranger, or someone on one side only, reads nothing', async () => {
    await setCard('alice', 'Alice', ALL_ON);
    await setCard('bob', 'Bob', ALL_ON);
    await setCard('eve', 'Eve', ALL_ON);
    await befriend('alice', 'bob');
    expect((await view('eve')).friends).toEqual([]);
    /* eve writes a side of a friendship with alice into her own partition: alice holds no side, so nothing comes back */
    await store.auxPut('eve', FR + 'alice', { fid: 'x', at: now });
    expect((await view('eve')).friends).toEqual([]);
    /* a friend can only be named by a fid of one's own friendships */
    const { fid } = (await view('bob')).friends[0];
    expect((await call('eve', 'POST', 'cheer', { fid, k: 'warm' })).status).toBe(404);
    expect((await call('eve', 'POST', 'remove', { fid })).status).toBe(404);
    expect((await view('bob')).friends).toHaveLength(1);
  });

  it('the app never sees an account id', async () => {
    await setCard('alice', 'Alice', ALL_ON);
    await setCard('bob', 'Bob');
    await befriend('alice', 'bob');
    expect(JSON.stringify(await view('bob'))).not.toContain('alice');
    expect(JSON.stringify(await view('alice'))).not.toContain('bob"');
  });

  it('numbers older than a week are not shown; the name and flame stay', async () => {
    await setCard('alice', 'Alice', ALL_ON);
    await setCard('bob', 'Bob');
    await befriend('alice', 'bob');
    now += 9 * 86400_000;
    const f = (await view('bob')).friends[0];
    expect(f.vals).toEqual({ level: 6, lname: 'Steady' });
    expect(f.name).toBe('Alice');
  });

  it('words with a link, a phone number or crude words are refused', async () => {
    expect((await setCard('alice', 'see www.x.com')).status).toBe(400);
    expect((await setCard('alice', 'call 555 123 4567')).status).toBe(400);
    expect((await setCard('alice', 'Dickson')).status).toBe(200);
  });
});

describe('codes', () => {
  it('needs a name first, works for several friends, and a fresh one ends the old', async () => {
    expect((await call('alice', 'POST', 'invite', {})).status).toBe(400);
    await setCard('alice', 'Alice');
    await setCard('bob', 'Bob');
    await setCard('eve', 'Eve');
    const { code } = await befriend('alice', 'bob');
    expect((await call('eve', 'GET', 'look', undefined, { code: code.slice(0, 3) + '-' + code.slice(3).toLowerCase() })).body).toEqual({ name: 'Alice' });
    expect((await call('eve', 'POST', 'accept', { code })).status).toBe(200);
    expect((await view('alice')).friends).toHaveLength(2);
    const fresh = await call('alice', 'POST', 'invite', { fresh: true });
    expect(fresh.body.code).not.toBe(code);
    await setCard('carl', 'Carl');
    expect((await call('carl', 'POST', 'accept', { code })).status).toBe(404);
  });

  it('runs out after a week', async () => {
    await setCard('alice', 'Alice');
    await setCard('bob', 'Bob');
    const inv = await call('alice', 'POST', 'invite', {});
    now += 8 * 86400_000;
    expect((await call('bob', 'POST', 'accept', { code: inv.body.code })).status).toBe(404);
    expect((await view('alice')).invite).toBeNull();
  });

  it('your own code does not make you your own friend', async () => {
    await setCard('alice', 'Alice');
    const inv = await call('alice', 'POST', 'invite', {});
    expect((await call('alice', 'POST', 'accept', { code: inv.body.code })).status).toBe(400);
  });

  it('a day allows only a few lookups, so a code cannot be guessed', async () => {
    await setCard('eve', 'Eve');
    for (let i = 0; i < LOOKS_A_DAY; i++) await call('eve', 'GET', 'look', undefined, { code: 'AAAAAA' });
    expect((await call('eve', 'GET', 'look', undefined, { code: 'AAAAAA' })).status).toBe(429);
  });
});

describe('encouragement', () => {
  it('one a day to each friend, and only ready-made ones', async () => {
    await setCard('alice', 'Alice');
    await setCard('bob', 'Bob');
    const { fid } = await befriend('alice', 'bob');
    expect((await call('bob', 'POST', 'cheer', { fid, k: 'you are great' })).status).toBe(400);
    expect((await call('bob', 'POST', 'cheer', { fid, k: 'warm' })).status).toBe(200);
    expect((await call('bob', 'POST', 'cheer', { fid, k: 'proud' })).status).toBe(429);
    expect((await view('alice')).friends[0].cheer).toEqual({ k: 'warm', at: now });
    expect((await view('bob')).friends[0].sent).toBe(now);
    now += 21 * 3600_000;
    expect((await call('bob', 'POST', 'cheer', { fid, k: 'proud' })).status).toBe(200);
  });
});

describe('ending it', () => {
  it('remove ends both sides quietly, with what passed between them', async () => {
    await setCard('alice', 'Alice', ALL_ON);
    await setCard('bob', 'Bob');
    const { fid } = await befriend('alice', 'bob');
    await call('bob', 'POST', 'cheer', { fid, k: 'warm' });
    expect((await call('alice', 'POST', 'remove', { fid })).status).toBe(200);
    expect((await view('alice')).friends).toEqual([]);
    expect((await view('bob')).friends).toEqual([]);
    expect(await store.auxList('alice', CHEER)).toEqual([]);
  });

  it('block keeps them from using a code again, without telling them; a report keeps what they wrote for the owner', async () => {
    await setCard('alice', 'Alice');
    await setCard('bob', 'Bob');
    const { fid } = await befriend('alice', 'bob');
    expect((await call('alice', 'POST', 'block', { fid, why: 'words' })).status).toBe(200);
    expect((await view('bob')).friends).toEqual([]);
    const inv = await call('alice', 'POST', 'invite', { fresh: true });
    const r = await call('bob', 'POST', 'accept', { code: inv.body.code });
    expect(r.status).toBe(404);
    expect(r.body.error).not.toMatch(/block/i);
    const bobInv = await call('bob', 'POST', 'invite', {});
    expect((await call('alice', 'POST', 'accept', { code: bobInv.body.code })).status).toBe(404);
    const reports = await store.auxList(REPORTS, '');
    expect(reports).toHaveLength(1);
    expect(reports[0].v).toMatchObject({ from: 'alice', about: 'bob', why: 'words', name: 'Bob' });
  });

  it('leaving Friends takes the card, code and friendships', async () => {
    await setCard('alice', 'Alice');
    await setCard('bob', 'Bob');
    await befriend('alice', 'bob');
    await call('alice', 'POST', 'leave', {});
    expect(await view('alice')).toEqual({ me: null, invite: null, friends: [] });
    expect((await view('bob')).friends).toEqual([]);
  });

  it('closing an account leaves nothing of it in Friends, on any side', async () => {
    await setCard('alice', 'Alice', ALL_ON);
    await setCard('bob', 'Bob');
    await setCard('eve', 'Eve');
    const { fid } = await befriend('alice', 'bob');
    const e = await befriend('alice', 'eve');
    await call('bob', 'POST', 'cheer', { fid, k: 'warm' });
    await call('alice', 'POST', 'cheer', { fid: e.fid, k: 'proud' });
    await call('eve', 'POST', 'block', { fid: e.fid, why: 'unknown' });
    const r = await handler({
      requestContext: { http: { method: 'DELETE' }, authorizer: { jwt: { claims: { sub: 'alice' }, scopes: [] } } },
      queryStringParameters: { all: '1' },
      isBase64Encoded: false,
    } as unknown as APIGatewayProxyEventV2WithJWTAuthorizer);
    expect(r.statusCode).toBe(200);
    const left = JSON.stringify([...store.aux.entries()].map(([pk, m]) => [pk, [...m.entries()]]));
    expect(left).not.toContain('alice');
    expect(await store.auxList(INVITES, '')).toEqual([]);
    expect((await view('bob')).friends).toEqual([]);
    for (const p of [FR, CHEER, BLOCK, BLOCKED_BY, MYINV]) expect(await store.auxList('bob', p)).toEqual([]);
  });
});
