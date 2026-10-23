/* The app's side of Sign in with Apple: it reads the Apple ID from a sign-in, sends Apple's token to the sync API, and turns
   every answer into tokens or a sentence to show. */
import { describe, expect, it } from 'vitest';

import { appleClient, appleSubOf, CognitoError } from '../src';

describe('appleSubOf', () => {
  it('reads the Apple ID an account signs in with, and nothing else', () => {
    expect(appleSubOf({ preferred_username: 'apple.001234.abc' })).toBe('001234.abc');
    expect(appleSubOf({ preferred_username: 'sam' })).toBeNull();
    expect(appleSubOf({ preferred_username: 'apple.' })).toBeNull();
    expect(appleSubOf({})).toBeNull();
  });
});

describe('appleClient', () => {
  const answer = (status: number, body: unknown) => {
    const seen: { url: string; init: { headers: Record<string, string>; body: string } }[] = [];
    const f = async (url: string, init: { method: string; headers: Record<string, string>; body: string }) => {
      seen.push({ url, init });
      return { ok: status < 400, status, text: async () => JSON.stringify(body) };
    };
    return { c: appleClient('https://day.example/sync', f), seen };
  };

  it('signs in through the open door, and gives Cognito tokens', async () => {
    const { c, seen } = answer(200, { tokens: { access: 'a', id: 'i', refresh: 'r', expiresIn: 3600 } });
    expect(await c.signIn({ token: 'tok', nonce: 'n' })).toEqual({ access: 'a', id: 'i', refresh: 'r', expiresIn: 3600 });
    expect(seen[0].url).toBe('https://day.example/sync/apple');
    expect(JSON.parse(seen[0].init.body)).toEqual({ token: 'tok', nonce: 'n' });
    expect(seen[0].init.headers.authorization).toBeUndefined();
  });

  it('shows the server’s own sentence when it says no', async () => {
    const { c } = answer(409, { error: 'There is already a Daybook account with this email.', code: 'NotConfirmed' });
    const e = await c.signIn({ token: 't', nonce: 'n' }).catch((x) => x);
    expect(e).toBeInstanceOf(CognitoError);
    expect(e.code).toBe('NotConfirmed');
    expect(e.message).toBe('There is already a Daybook account with this email.');
  });

  it('says so when the internet is not there', async () => {
    const c = appleClient('https://day.example/sync', async () => {
      throw new Error('offline');
    });
    await expect(c.signIn({ token: 't', nonce: 'n' })).rejects.toMatchObject({ code: 'Network' });
  });

  it('links with the signed-in token', async () => {
    const { c, seen } = answer(200, { apple: '001.x' });
    expect(await c.link('acc', { token: 't', nonce: 'n' })).toBe('001.x');
    expect(seen[0].url).toBe('https://day.example/sync?apple=link');
    expect(seen[0].init.headers.authorization).toBe('Bearer acc');
  });
});
