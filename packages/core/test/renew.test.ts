/* Renewing the sign-in against a fake Cognito that rotates refresh tokens and turns down a retired one as reuse, the way the
   real pool does (infra/app auth.tf). The owner's phone stopped syncing for days on exactly this (November 15, 2026): one
   keychain save failed, the next renewal took the retired token back from the keychain, and every renewal after it was reuse. */
import { describe, expect, it } from 'vitest';
import { CognitoError, RefreshGone, renewer, signInGone, type Tokens } from '../src/index';

/** Cognito with rotation: each token works once (no grace period here, so a reuse is caught at once) */
function pool(first: string) {
  const live = new Set([first]);
  let n = 0;
  const calls: string[] = [];
  return {
    calls,
    refresh: async (t: string): Promise<Tokens> => {
      calls.push(t);
      if (!live.has(t)) throw new CognitoError('RefreshTokenReuseException', 'Refresh token reuse detected');
      live.delete(t);
      const next = 'r' + ++n;
      live.add(next);
      return { access: 'a' + n, id: 'i' + n, refresh: next, expiresIn: 3600 };
    },
  };
}

/** a keychain whose next `fail` saves fail (the phone locking) */
function keychain(first: string) {
  const k = { v: first as string | null, fail: 0 };
  return {
    k,
    kept: async () => k.v,
    save: async (t: string) => {
      if (k.fail > 0) {
        k.fail--;
        throw new Error('the keychain cannot be written while the phone is locked');
      }
      k.v = t;
    },
  };
}

describe('renewing the sign-in on a phone', () => {
  it('keeps working after a keychain save fails (the owner’s phone, November 15, 2026)', async () => {
    const cog = pool('r0');
    const kc = keychain('r0');
    const r = renewer({ refresh: cog.refresh, ...kc, shared: false });
    let mine = 'r0';
    kc.k.fail = 1;
    mine = (await r.renew(mine)).refresh; // r1, not saved
    expect(kc.k.v).toBe('r0');
    /* the old code took 'r0' back from the keychain here and was turned down as reuse from then on */
    for (let i = 0; i < 5; i++) mine = (await r.renew(mine)).refresh;
    expect(mine).toBe('r6');
    expect(kc.k.v).toBe('r6');
    expect(cog.calls).toEqual(['r0', 'r1', 'r2', 'r3', 'r4', 'r5']);
  });

  it('the old rule, taking the stored token over the one in memory on a phone, is what broke it', async () => {
    const cog = pool('r0');
    const kc = keychain('r0');
    const r = renewer({ refresh: cog.refresh, ...kc, shared: true });
    kc.k.fail = 1;
    const mine = (await r.renew('r0')).refresh;
    await expect(r.renew(mine)).rejects.toBeInstanceOf(RefreshGone);
  });

  it('saves a token that could not be saved when the app comes back', async () => {
    const cog = pool('r0');
    const kc = keychain('r0');
    const r = renewer({ refresh: cog.refresh, ...kc, shared: false });
    kc.k.fail = 1;
    await r.renew('r0');
    expect(kc.k.v).toBe('r0');
    await r.saveLater();
    expect(kc.k.v).toBe('r1');
  });

  it('a retired token is an ended sign-in: sign in again, never "a problem inside Daybook"', async () => {
    const cog = pool('r0');
    await cog.refresh('r0');
    const kc = keychain('r0');
    const r = renewer({ refresh: cog.refresh, ...kc, shared: false });
    await expect(r.renew('r0')).rejects.toBeInstanceOf(RefreshGone);
  });

  it('no connection is not an ended sign-in', async () => {
    const r = renewer({
      refresh: async () => {
        throw new CognitoError('Network', 'no connection');
      },
      kept: async () => 'r0',
      save: async () => undefined,
      shared: false,
    });
    await expect(r.renew('r0')).rejects.toMatchObject({ code: 'Network' });
  });

  it('knows which answers end a sign-in', () => {
    for (const c of ['NotAuthorizedException', 'RefreshTokenReuseException', 'UserNotFoundException']) expect(signInGone(new CognitoError(c, ''))).toBe(true);
    for (const c of ['Network', 'TooManyRequestsException', 'InternalErrorException']) expect(signInGone(new CognitoError(c, ''))).toBe(false);
    expect(signInGone(new Error('x'))).toBe(false);
  });
});

describe('renewing the sign-in in a browser, where tabs share the storage', () => {
  it('takes the token another tab renewed to', async () => {
    const cog = pool('r0');
    const kc = keychain('r0');
    const a = renewer({ refresh: cog.refresh, ...kc, shared: true });
    const b = renewer({ refresh: cog.refresh, ...kc, shared: true });
    expect((await a.renew('r0')).refresh).toBe('r1');
    /* tab b still holds r0 */
    expect((await b.renew('r0')).refresh).toBe('r2');
    expect(kc.k.v).toBe('r2');
    expect(cog.calls).toEqual(['r0', 'r1']);
  });
});
