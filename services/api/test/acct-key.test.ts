import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { beforeEach, describe, expect, it } from 'vitest';

import { akForget, akOf, AK_PK, AK_SK } from '../src/acct-key';
import { MemoryStore } from '../src/store';
import { makeHandler } from '../src/sync';

const ev = (user: string | null) =>
  ({
    requestContext: { http: { method: 'GET' }, authorizer: user == null ? undefined : { jwt: { claims: { sub: user }, scopes: [] } } },
    queryStringParameters: { ak: '1' },
    isBase64Encoded: false,
  }) as unknown as APIGatewayProxyEventV2WithJWTAuthorizer;

let store: MemoryStore;
beforeEach(() => {
  akForget();
  store = new MemoryStore();
});
const key = async (h: ReturnType<typeof makeHandler>, user: string | null) => {
  const r = await h(ev(user));
  return { status: r.statusCode, body: JSON.parse(r.body as string) as { ak?: string } };
};

describe('the account key', () => {
  it('is 32 hex, the same for every sign-in of one account, different for another, and never the id', async () => {
    const h = makeHandler(store);
    const a1 = await key(h, 'alice-sub');
    const a2 = await key(h, 'alice-sub');
    const b = await key(h, 'bob-sub');
    expect(a1.status).toBe(200);
    expect(a1.body.ak).toMatch(/^[0-9a-f]{32}$/);
    expect(a2.body.ak).toBe(a1.body.ak);
    expect(b.body.ak).not.toBe(a1.body.ak);
    expect(a1.body.ak).not.toContain('alice');
  });
  it('keeps one secret: a cold start reads the same one back', async () => {
    const first = (await key(makeHandler(store), 'alice-sub')).body.ak;
    akForget();
    expect((await key(makeHandler(store), 'alice-sub')).body.ak).toBe(first);
    const secret = (await store.auxGet(AK_PK, AK_SK)) as string;
    expect(akOf(secret, 'alice-sub')).toBe(first);
  });
  it('needs a sign-in', async () => {
    expect((await key(makeHandler(store), null)).status).toBe(401);
  });
});
