/* Sign in with Apple on the server: the account is made the first time, found after, joined to the email account only when
   that email is confirmed, and joined from Settings; the trigger lets in only the Apple ID joined to the account; closing an
   Apple account revokes Apple's token first. Apple's check is stood in for: a "token" here is the JSON of who it is. */
import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  CreateAuthChallengeTriggerEvent,
  DefineAuthChallengeTriggerEvent,
  VerifyAuthChallengeResponseTriggerEvent,
} from 'aws-lambda';
import { beforeEach, describe, expect, it } from 'vitest';

import { BadAppleToken, type AppleId, type CheckApple } from '../src/apple-id';
import { createChallenge, defineChallenge, makeTrigger } from '../src/apple-auth';
import { APPLE_SAY, type AppleUsers } from '../src/apple-sign-in';
import { MemoryStore } from '../src/store';
import { makeHandler, OPEN_APPLE } from '../src/sync';

const NONCE = 'a-nonce-the-app-made-1234';
const tok = (a: Partial<AppleId>) => JSON.stringify({ sub: '001.apple', email: 'sam@example.com', emailVerified: true, relay: false, ...a });
const check: CheckApple = async (t, n) => {
  if (n !== NONCE || typeof t !== 'string') throw new BadAppleToken('Apple could not confirm that sign-in. Try again.');
  try {
    return JSON.parse(t) as AppleId;
  } catch {
    throw new BadAppleToken('Apple could not confirm that sign-in. Try again.');
  }
};

interface U {
  username: string;
  email: string;
  emailVerified: boolean;
  pu: string;
  password: string;
}
class FakeCognito implements AppleUsers {
  list: U[] = [];
  signIns: { username: string; answer: string }[] = [];
  n = 0;
  async byApple(sub: string) {
    const u = this.list.find((x) => x.pu === 'apple.' + sub);
    return u ? { username: u.username, emailVerified: u.emailVerified, apple: sub } : null;
  }
  async byEmail(email: string) {
    const u = this.list.find((x) => x.email === email);
    return u ? { username: u.username, emailVerified: u.emailVerified, apple: u.pu.startsWith('apple.') ? u.pu.slice(6) : null } : null;
  }
  async create(email: string, sub: string, password: string) {
    if (this.list.some((x) => x.email === email)) return null;
    const username = 'uuid-' + ++this.n;
    this.list.push({ username, email, emailVerified: true, pu: 'apple.' + sub, password });
    return username;
  }
  async link(username: string, sub: string) {
    this.list.find((x) => x.username === username)!.pu = 'apple.' + sub;
  }
  async signIn(username: string, answer: string) {
    this.signIns.push({ username, answer });
    return { access: 'acc-' + username, id: 'id-' + username, refresh: 'ref-' + username, expiresIn: 3600 };
  }
}

let cog: FakeCognito;
let revoked: { code: unknown; client: string }[];
let handler: ReturnType<typeof makeHandler>;
let deleted: string[];

function ev(method: string, o: { route?: string; user?: string; query?: Record<string, string>; body?: unknown } = {}) {
  return {
    routeKey: o.route ?? `${method} /sync`,
    requestContext: { http: { method }, authorizer: o.user ? { jwt: { claims: { sub: o.user, username: o.user }, scopes: [] } } : undefined },
    queryStringParameters: o.query,
    body: o.body === undefined ? undefined : JSON.stringify(o.body),
    isBase64Encoded: false,
  } as unknown as APIGatewayProxyEventV2WithJWTAuthorizer;
}
const call = async (e: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  const r = await handler(e);
  return { status: r.statusCode ?? 0, body: JSON.parse(r.body as string) };
};
const appleIn = (a: Partial<AppleId> = {}) => call(ev('POST', { route: OPEN_APPLE, body: { token: tok(a), nonce: NONCE } }));

beforeEach(() => {
  cog = new FakeCognito();
  revoked = [];
  deleted = [];
  handler = makeHandler(
    new MemoryStore(),
    () => 1,
    async (u) => void deleted.push(u),
    {},
    {
      users: cog,
      check,
      revoke: async (code, client) => (revoked.push({ code, client }), 'revoked'),
      clientIds: { ios: 'com.jdsmith2004.daybook', web: 'com.jdsmith2004.daybook.web' },
      appleOf: async (u) => (u === 'joined' ? '001.apple' : null),
    },
  );
});

describe('POST /sync/apple', () => {
  it('makes the account the first time, with a password nobody knows, and signs it in', async () => {
    const r = await appleIn();
    expect(r.status).toBe(200);
    expect(r.body.tokens).toEqual({ access: 'acc-uuid-1', id: 'id-uuid-1', refresh: 'ref-uuid-1', expiresIn: 3600 });
    expect(cog.list).toHaveLength(1);
    expect(cog.list[0]).toMatchObject({ email: 'sam@example.com', pu: 'apple.001.apple', emailVerified: true });
    expect(cog.list[0].password.length).toBeGreaterThan(40);
    /* the trigger gets Apple's token and nonce to check again */
    expect(JSON.parse(cog.signIns[0].answer)).toEqual({ t: tok({}), n: NONCE });
  });

  it('finds the same account every time after, even with a new email from Apple', async () => {
    await appleIn();
    await appleIn({ email: 'changed@example.com' });
    expect(cog.list).toHaveLength(1);
    expect(cog.signIns.map((s) => s.username)).toEqual(['uuid-1', 'uuid-1']);
  });

  it('joins Apple to the email account with the same, confirmed, email: the same place either way', async () => {
    cog.list.push({ username: 'old-sub', email: 'sam@example.com', emailVerified: true, pu: '', password: 'theirs' });
    const r = await appleIn();
    expect(r.status).toBe(200);
    expect(cog.list).toHaveLength(1);
    expect(cog.list[0].pu).toBe('apple.001.apple');
    expect(cog.list[0].password).toBe('theirs');
    expect(r.body.tokens.access).toBe('acc-old-sub');
  });

  it('never joins an account whose email was never confirmed (anyone could have made it with that address)', async () => {
    cog.list.push({ username: 'squatter', email: 'sam@example.com', emailVerified: false, pu: '', password: 'x' });
    const r = await appleIn();
    expect(r.status).toBe(409);
    expect(r.body).toEqual({ error: APPLE_SAY.notConfirmed, code: 'NotConfirmed' });
    expect(cog.list[0].pu).toBe('');
    expect(cog.signIns).toHaveLength(0);
  });

  it('never joins when Apple does not vouch for the email', async () => {
    cog.list.push({ username: 'old', email: 'sam@example.com', emailVerified: true, pu: '', password: 'x' });
    expect((await appleIn({ emailVerified: false })).status).toBe(409);
  });

  it('does not take over an account joined to another Apple ID', async () => {
    cog.list.push({ username: 'old', email: 'sam@example.com', emailVerified: true, pu: 'apple.someone-else', password: 'x' });
    const r = await appleIn();
    expect(r.status).toBe(409);
    expect(r.body.code).toBe('OtherApple');
  });

  it('refuses a token Apple did not sign, and says why', async () => {
    const r = await call(ev('POST', { route: OPEN_APPLE, body: { token: tok({}), nonce: 'wrong-nonce-wrong-nonce' } }));
    expect(r.status).toBe(401);
    expect(r.body.code).toBe('BadAppleToken');
    expect(cog.list).toHaveLength(0);
  });

  it('never reads a sign-in sent to the open door', async () => {
    const e = ev('POST', { route: OPEN_APPLE, user: 'mallory', body: { token: tok({}), nonce: NONCE } });
    expect((await call(e)).body.tokens.access).toBe('acc-uuid-1');
  });

  it('asks for an email the first time', async () => {
    const r = await appleIn({ email: null });
    expect(r.status).toBe(400);
    expect(r.body.code).toBe('NoEmail');
  });

  it('says "not set up yet" until Terraform gives it the Apple settings', async () => {
    handler = makeHandler(new MemoryStore());
    const r = await appleIn();
    expect(r.status).toBe(503);
    expect(r.body.code).toBe('AppleOff');
  });
});

describe('POST /sync?apple=link (Settings, "Add Sign in with Apple")', () => {
  const link = (user: string, a: Partial<AppleId> = {}) => call(ev('POST', { user, query: { apple: 'link' }, body: { token: tok(a), nonce: NONCE } }));

  it('joins Apple to the signed-in account, whatever its email (Hide My Email too)', async () => {
    cog.list.push({ username: 'me', email: 'me@example.com', emailVerified: false, pu: '', password: 'x' });
    const r = await link('me', { email: 'zz@privaterelay.appleid.com', relay: true });
    expect(r).toEqual({ status: 200, body: { apple: '001.apple' } });
    expect(cog.list[0].pu).toBe('apple.001.apple');
    /* and now Apple opens that account */
    expect((await appleIn({ email: 'zz@privaterelay.appleid.com' })).body.tokens.access).toBe('acc-me');
  });

  it('will not take an Apple ID that already opens another account', async () => {
    await appleIn();
    cog.list.push({ username: 'me', email: 'me@example.com', emailVerified: true, pu: '', password: 'x' });
    const r = await link('me');
    expect(r.status).toBe(409);
    expect(r.body.code).toBe('AppleTaken');
  });

  it('needs a sign-in', async () => {
    expect((await call(ev('POST', { query: { apple: 'link' }, body: {} }))).status).toBe(401);
  });
});

describe('closing an Apple account', () => {
  it('revokes Apple first with the code the app sent, for the client Apple gave it to', async () => {
    const r = await call(ev('DELETE', { user: 'me', query: { all: '1' }, body: { apple: { code: 'c1', client: 'ios' } } }));
    expect(r.status).toBe(200);
    expect(revoked).toEqual([{ code: 'c1', client: 'com.jdsmith2004.daybook' }]);
    expect(deleted).toEqual(['me']);
    await call(ev('DELETE', { user: 'me', query: { all: '1' }, body: { apple: { code: 'c2', client: 'web' } } }));
    expect(revoked[1].client).toBe('com.jdsmith2004.daybook.web');
  });

  it('closes an email account as before, with nothing sent to Apple', async () => {
    await call(ev('DELETE', { user: 'me', query: { all: '1' } }));
    expect(revoked).toEqual([]);
    expect(deleted).toEqual(['me']);
  });

  it('sends an account joined to Apple back for a code when none came, and deletes nothing', async () => {
    const r = await call(ev('DELETE', { user: 'joined', query: { all: '1' } }));
    expect(r.status).toBe(409);
    expect(r.body.code).toBe('NeedApple');
    expect(deleted).toEqual([]);
    /* with the code, it revokes and closes */
    await call(ev('DELETE', { user: 'joined', query: { all: '1' }, body: { apple: { code: 'c3', client: 'ios' } } }));
    expect(revoked).toEqual([{ code: 'c3', client: 'com.jdsmith2004.daybook' }]);
    expect(deleted).toEqual(['joined']);
  });

  it('closes it anyway from a device that cannot ask Apple', async () => {
    const r = await call(ev('DELETE', { user: 'joined', query: { all: '1' }, body: { apple: { skip: true } } }));
    expect(r.status).toBe(200);
    expect(revoked).toEqual([]);
    expect(deleted).toEqual(['joined']);
  });

  it('never revokes on a plain erase', async () => {
    await call(ev('DELETE', { user: 'me', body: { apple: { code: 'c1', client: 'ios' } } }));
    expect(revoked).toEqual([]);
  });
});

describe('the trigger', () => {
  const attrs = { sub: 'uuid-1', preferred_username: 'apple.001.apple' };
  const define = (session: { challengeName: string; challengeResult: boolean }[], userAttributes: Record<string, string> = attrs) =>
    defineChallenge({
      triggerSource: 'DefineAuthChallenge_Authentication',
      request: { session, userAttributes },
      response: {},
    } as unknown as DefineAuthChallengeTriggerEvent).response;
  const verify = (answer: string, userAttributes: Record<string, string> = attrs) =>
    makeTrigger(check)({
      triggerSource: 'VerifyAuthChallengeResponse_Authentication',
      request: { challengeAnswer: answer, userAttributes },
      response: {},
    } as unknown as VerifyAuthChallengeResponseTriggerEvent) as Promise<VerifyAuthChallengeResponseTriggerEvent>;

  it('asks one question, then gives tokens only for a right answer', () => {
    expect(define([])).toMatchObject({ challengeName: 'CUSTOM_CHALLENGE', issueTokens: false, failAuthentication: false });
    expect(define([{ challengeName: 'CUSTOM_CHALLENGE', challengeResult: true }])).toMatchObject({ issueTokens: true, failAuthentication: false });
    expect(define([{ challengeName: 'CUSTOM_CHALLENGE', challengeResult: false }])).toMatchObject({ issueTokens: false, failAuthentication: true });
  });

  it('turns away an account with no Apple ID (an email account cannot be signed in this way)', () => {
    expect(define([], { sub: 'x' })).toMatchObject({ issueTokens: false, failAuthentication: true });
  });

  it('says the answer is right only for the Apple ID joined to the account', async () => {
    expect((await verify(JSON.stringify({ t: tok({}), n: NONCE }))).response.answerCorrect).toBe(true);
    expect((await verify(JSON.stringify({ t: tok({ sub: 'someone-else' }), n: NONCE }))).response.answerCorrect).toBe(false);
    expect((await verify(JSON.stringify({ t: tok({}), n: 'bad-nonce-bad-nonce-bad' }))).response.answerCorrect).toBe(false);
    expect(await verify('not json')).toMatchObject({ response: { answerCorrect: false } });
    expect((await verify(JSON.stringify({ t: tok({}), n: NONCE }), { sub: 'x' })).response.answerCorrect).toBe(false);
  });

  it('shows nothing secret in the question', () => {
    const r = createChallenge({
      triggerSource: 'CreateAuthChallenge_Authentication',
      request: {},
      response: {},
    } as unknown as CreateAuthChallengeTriggerEvent).response;
    expect(r.publicChallengeParameters).toEqual({ kind: 'apple' });
  });
});
