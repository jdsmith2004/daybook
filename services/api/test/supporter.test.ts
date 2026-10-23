/* Supporters on the server (src/supporter.ts) through the sync handler: the sync gate, the grandfather rule, web tips
   (Stripe Checkout Sessions), Apple tips, the open door for a signed-out device, and closing an account. Stripe and Apple
   are stand-ins here (test/apple.test.ts checks the real Apple verifier); the rules around them are the real ones. */
import { GRANDFATHER_BEFORE, type Supporter } from '@daybook/core';
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { beforeEach, describe, expect, it } from 'vitest';

import { BadProof, type AppleTip } from '../src/apple';
import { MemoryStore } from '../src/store';
import { NotSetUp, type StripeSession } from '../src/stripe';
import { supKeep, type Pay } from '../src/supporter';
import { makeHandler, OPEN_CLAIM } from '../src/sync';

const A = 'aaaaaaaa-1111-4111-8111-111111111111';
const B = 'bbbbbbbb-2222-4222-8222-222222222222';
let now = GRANDFATHER_BEFORE + 86400_000;
let store: MemoryStore;
let sessions: Record<string, StripeSession>;
let stripeCalls: number;
let apple: Record<string, AppleTip>;
let created: Record<string, number>;
let pay: Pay;
let handler: ReturnType<typeof makeHandler>;

function ev(method: string, o: { user?: string | null; body?: unknown; query?: Record<string, string>; route?: string } = {}) {
  const user = o.user === undefined ? A : o.user;
  return {
    routeKey: o.route ?? `${method} /sync`,
    requestContext: { http: { method }, authorizer: user == null ? undefined : { jwt: { claims: { sub: user, username: user }, scopes: [] } } },
    queryStringParameters: o.query,
    body: o.body === undefined ? undefined : JSON.stringify(o.body),
    isBase64Encoded: false,
  } as unknown as APIGatewayProxyEventV2WithJWTAuthorizer;
}
const call = async (e: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  const r = await handler(e);
  return { status: r.statusCode ?? 0, body: JSON.parse(r.body as string) };
};
const day = (k: string, u: number) => ({
  id: `days/${k}`,
  u,
  data: { d: k, events: [{ id: 'e' + u, time: '22:00', outcome: 'rode' }], checkin: null, p: null, u },
});
const push = (user: string | null = A) => call(ev('POST', { user, body: { records: [day('2026-10-14', 500)] } }));
const sup = (user = A) => call(ev('GET', { user, query: { sup: '1' } }));
const claimStripe = (session: string, user: string | null = A) => call(ev('POST', { user, query: { claim: 'stripe' }, body: { session } }));
const claimOpen = (session: string) => call(ev('POST', { user: null, route: OPEN_CLAIM, body: { session } }));
const claimApple = (jws: string, user = A) => call(ev('POST', { user, query: { claim: 'apple' }, body: { jws } }));

const cs = (id: string, over: Partial<StripeSession> = {}): StripeSession => ({
  id,
  mode: 'payment',
  status: 'complete',
  payment_status: 'paid',
  amount_total: 500,
  currency: 'usd',
  client_reference_id: null,
  created: 1_800_000_000,
  ...over,
});
const ID1 = 'cs_test_a1b2c3d4e5f6g7h8';
const ID2 = 'cs_test_z9y8x7w6v5u4t3s2';

beforeEach(() => {
  now = GRANDFATHER_BEFORE + 86400_000;
  store = new MemoryStore();
  sessions = {};
  stripeCalls = 0;
  apple = {};
  created = {};
  pay = {
    stripe: async (id) => {
      stripeCalls++;
      return sessions[id] ?? null;
    },
    apple: async (jws) => {
      const t = apple[jws];
      if (!t) throw new BadProof('Apple could not confirm that purchase.');
      return t;
    },
    createdAt: async (u) => created[u] ?? null,
  };
  handler = makeHandler(store, () => now, undefined, pay);
});

describe('the sync gate', () => {
  it('a new account with no tip cannot save, and nothing is stored', async () => {
    const r = await push();
    expect(r.status).toBe(402);
    expect(r.body.need).toBe('support');
    expect(await store.hasData(A)).toBe(false);
    expect((await sup()).body.sup).toBeNull();
  });

  it('but it can still read, erase, and close its account', async () => {
    expect((await call(ev('GET', { query: { since: '0' } }))).status).toBe(200);
    expect((await call(ev('DELETE'))).status).toBe(200);
    expect((await call(ev('GET', { query: { erased: '1' } }))).status).toBe(200);
    expect((await call(ev('DELETE', { query: { all: '1' } }))).status).toBe(200);
  });

  it('a supporter saves as before', async () => {
    sessions[ID1] = cs(ID1);
    expect((await claimStripe(ID1)).status).toBe(200);
    expect((await push()).status).toBe(200);
  });

  it('monthly support that has ended stops new saves, and keeps what was saved', async () => {
    await store.putSup(A, { since: 1, kind: 'monthly', until: now + 1000, src: 'stripe' });
    expect((await push()).status).toBe(200);
    now += 2000;
    expect((await push()).status).toBe(402);
    const g = await call(ev('GET', { query: { since: '0' } }));
    expect(g.body.records.length).toBe(1);
    /* the data it holds does not make it grandfathered: it has a record, so the rule never runs */
    expect((await sup()).body.sup.src).toBe('stripe');
  });
});

describe('grandfathered accounts', () => {
  it('an account that already holds synced data keeps sync, for good', async () => {
    await store.putIfNewer(A, { id: 'settings', u: 1, s: 1, d: '{}' });
    expect((await push()).status).toBe(200);
    const s = (await sup()).body.sup as Supporter;
    expect(s.src).toBe('grandfather');
    expect(s.until).toBeNull();
    /* kept, so it holds even if the data goes */
    await call(ev('DELETE'));
    expect((await sup()).body.sup.src).toBe('grandfather');
  });

  it('a deleted log (records turned into deletions) counts as synced data too', async () => {
    await store.putIfNewer(A, { id: 'days/2026-10-01', u: 1, s: 1, d: null });
    expect((await push()).status).toBe(200);
  });

  it('an account made before the cutoff keeps sync even if it never synced; one made after does not', async () => {
    created[A] = GRANDFATHER_BEFORE - 1;
    created[B] = GRANDFATHER_BEFORE + 1;
    expect((await push(A)).status).toBe(200);
    expect((await push(B)).status).toBe(402);
  });

  it('when Cognito cannot be asked, the data rule alone decides', async () => {
    pay.createdAt = async () => {
      throw new Error('AccessDenied');
    };
    expect((await push()).status).toBe(402);
  });

  it('a tip later replaces the grandfathered record (it carries the amount), and nothing is lost', async () => {
    await store.putIfNewer(A, { id: 'settings', u: 1, s: 1, d: '{}' });
    expect((await sup()).body.sup.src).toBe('grandfather');
    sessions[ID1] = cs(ID1, { amount_total: 1000 });
    const r = await claimStripe(ID1);
    expect(r.body.sup.src).toBe('stripe');
    expect(r.body.sup.cents).toBe(1000);
    expect((await push()).status).toBe(200);
  });
});

describe('web tips (Stripe)', () => {
  it('a paid session of $5 or more makes a supporter, once per session', async () => {
    sessions[ID1] = cs(ID1);
    const r = await claimStripe(ID1);
    expect(r.status).toBe(200);
    expect(r.body.sup).toMatchObject({ kind: 'tip', until: null, src: 'stripe', cents: 500, ref: ID1 });
    expect(r.body.sup.since).toBe(1_800_000_000_000);
    /* the same account bringing it again is fine */
    expect((await claimStripe(ID1)).status).toBe(200);
    /* another account cannot use it */
    const b = await claimStripe(ID1, B);
    expect(b.status).toBe(409);
    expect((await sup(B)).body.sup).toBeNull();
  });

  it('refuses unpaid, too small, other currencies, other modes, unknown and malformed sessions', async () => {
    sessions[ID1] = cs(ID1, { payment_status: 'unpaid' });
    expect((await claimStripe(ID1)).status).toBe(409);
    sessions[ID1] = cs(ID1, { amount_total: 499 });
    expect((await claimStripe(ID1)).body.error).toMatch(/\$5 or more/);
    sessions[ID1] = cs(ID1, { currency: 'eur', amount_total: 2000 });
    expect((await claimStripe(ID1)).status).toBe(409);
    sessions[ID1] = cs(ID1, { mode: 'subscription' });
    expect((await claimStripe(ID1)).status).toBe(409);
    expect((await claimStripe(ID2)).status).toBe(404);
    stripeCalls = 0;
    expect((await claimStripe('cs_test_../../v1/charges')).status).toBe(400);
    expect((await claimStripe('pi_123')).status).toBe(400);
    expect(stripeCalls).toBe(0);
    expect((await sup()).body.sup).toBeNull();
  });

  it('a session paid from a signed-in account goes to that account, whoever brings it', async () => {
    sessions[ID1] = cs(ID1, { client_reference_id: B });
    expect((await claimStripe(ID1, A)).status).toBe(403);
    expect((await sup(A)).body.sup).toBeNull();
    /* a signed-out device brings it: the tip goes to B, and the device gets a record to keep */
    const o = await claimOpen(ID1);
    expect(o.status).toBe(200);
    expect(o.body.sup.src).toBe('stripe');
    expect((await sup(B)).body.sup.src).toBe('stripe');
    expect((await push(B)).status).toBe(200);
  });

  it('a tip from a signed-out device is linked to the first account that brings it, and only that one', async () => {
    sessions[ID1] = cs(ID1);
    const o = await claimOpen(ID1);
    expect(o.status).toBe(200);
    expect(o.body.sup.ref).toBe(ID1);
    expect(store.claims.get('stripe/' + ID1)?.sub).toBe('');
    /* the same signed-out device can ask again (an answer lost on the way) */
    expect((await claimOpen(ID1)).status).toBe(200);
    expect((await claimStripe(ID1, A)).status).toBe(200);
    expect((await claimStripe(ID1, B)).status).toBe(409);
    /* once linked, a signed-out device is told to sign in */
    expect((await claimOpen(ID1)).status).toBe(409);
  });

  it('the open door never reads a sign-in sent to it', async () => {
    sessions[ID1] = cs(ID1);
    const e = ev('POST', { user: A, route: OPEN_CLAIM, body: { session: ID1 } });
    expect((await call(e)).status).toBe(200);
    expect((await sup(A)).body.sup).toBeNull();
    /* and it does nothing but claim */
    expect((await call(ev('POST', { user: null, route: OPEN_CLAIM, body: { records: [day('2026-10-14', 1)] } }))).status).toBe(400);
  });

  it('says plainly when web tips are not set up yet, or Stripe cannot be reached', async () => {
    pay.stripe = async () => {
      throw new NotSetUp('no key');
    };
    expect((await claimStripe(ID1)).status).toBe(503);
    pay.stripe = async () => {
      throw new Error('ECONNRESET');
    };
    expect((await claimStripe(ID1)).status).toBe(502);
    delete pay.stripe;
    expect((await claimStripe(ID1)).status).toBe(503);
  });

  it('needs a sign-in on the signed-in door', async () => {
    expect((await claimStripe(ID1, null)).status).toBe(401);
  });
});

describe('Apple tips', () => {
  const tip = (over: Partial<AppleTip> = {}): AppleTip => ({ tier: 'kind', otid: '1000', since: 123, cents: 500, token: null, env: 'Production', ...over });

  it('a checked purchase makes a supporter, and opens sync', async () => {
    apple.j1 = tip();
    const r = await claimApple('j1');
    expect(r.status).toBe(200);
    expect(r.body.sup).toMatchObject({ src: 'apple', cents: 500, since: 123, ref: '1000', until: null });
    expect((await push()).status).toBe(200);
  });

  it('refuses what Apple did not sign, and a purchase made for another account', async () => {
    expect((await claimApple('nope')).status).toBe(400);
    apple.j2 = tip({ token: B });
    expect((await claimApple('j2', A)).status).toBe(403);
    expect((await claimApple('j2', B)).status).toBe(200);
  });

  it('one purchase opens one account; a restore on the same account is fine', async () => {
    apple.j1 = tip();
    apple.j1b = tip({ since: 456 }); /* the same purchase, restored on a new phone */
    expect((await claimApple('j1')).status).toBe(200);
    expect((await claimApple('j1b')).status).toBe(200);
    expect((await claimApple('j1', B)).status).toBe(409);
  });

  it('closing the account lets its tips go, so they can open a new account', async () => {
    apple.j1 = tip();
    sessions[ID1] = cs(ID1);
    await claimApple('j1');
    await claimStripe(ID1);
    await push();
    expect(store.claims.size).toBe(2);
    const d = await call(ev('DELETE', { query: { all: '1' } }));
    expect(d.status).toBe(200);
    expect(store.claims.size).toBe(0);
    expect(await store.getSup(A)).toBeNull();
    expect((await claimApple('j1', B)).status).toBe(200);
    expect((await claimStripe(ID1, B)).status).toBe(200);
  });

  it('a purchase linked to an account that is gone is free again, even if its claim was left behind', async () => {
    apple.j1 = tip();
    await claimApple('j1');
    /* the account closed, but the claim was not removed (a failure part way) */
    store.sups.delete(A);
    expect((await claimApple('j1', B)).status).toBe(200);
  });
});

describe('which record is kept', () => {
  const g: Supporter = { since: 1, kind: 'tip', until: null, src: 'grandfather' };
  const t: Supporter = { since: 2, kind: 'tip', until: null, src: 'apple', cents: 500 };
  const m: Supporter = { since: 3, kind: 'monthly', until: 100, src: 'stripe' };
  it('no end beats an end; a paid tip replaces a grandfathered record; else the first stays', () => {
    expect(supKeep(null, m)).toBe(m);
    expect(supKeep(m, t)).toBe(t);
    expect(supKeep(t, m)).toBe(t);
    expect(supKeep(g, m)).toBe(g);
    expect(supKeep(g, t)).toBe(t);
    expect(supKeep(t, g)).toBe(t);
    expect(supKeep(t, { ...t, cents: 2000 })).toBe(t);
    expect(supKeep(m, { ...m, until: 200 }).until).toBe(200);
  });
});
