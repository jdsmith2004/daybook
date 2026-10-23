/* Apple's identity token is checked against Apple's keys, for Daybook, in time, with the app's nonce; and closing an account
   trades Apple's code and revokes it. A test key stands in for Apple's. */
import { createHash, generateKeyPairSync, sign, verify } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { appleClientSecret, appleKeys, appleRevoker, BadAppleToken, checkAppleToken, type AppleKeys } from '../src/apple-id';

const NOW = 1_800_000_000_000;
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'RS256' };
const keys: AppleKeys = async () => [jwk];
const NONCE = 'a-nonce-the-app-made-1234';
const hashed = createHash('sha256').update(NONCE).digest('hex');

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
export function appleToken(claims: Record<string, unknown> = {}, head: Record<string, unknown> = {}, key = privateKey) {
  const input =
    b64({ alg: 'RS256', kid: 'k1', ...head }) +
    '.' +
    b64({
      iss: 'https://appleid.apple.com',
      aud: 'com.jdsmith2004.daybook',
      exp: NOW / 1000 + 600,
      iat: NOW / 1000,
      sub: '001234.abc',
      email: 'Sam@Example.com',
      email_verified: 'true',
      nonce: hashed,
      ...claims,
    });
  return input + '.' + sign('RSA-SHA256', Buffer.from(input), key).toString('base64url');
}
const opts = { audiences: ['com.jdsmith2004.daybook', 'com.jdsmith2004.daybook.web'], keys, now: NOW };

describe('checking an Apple identity token', () => {
  it('takes a good one, and says who it is', async () => {
    expect(await checkAppleToken(appleToken(), NONCE, opts)).toEqual({ sub: '001234.abc', email: 'sam@example.com', emailVerified: true, relay: false });
  });

  it('takes the nonce as it was given to Apple too, and a Hide My Email address', async () => {
    const a = await checkAppleToken(appleToken({ nonce: NONCE, email: 'x@privaterelay.appleid.com', is_private_email: true }), NONCE, opts);
    expect(a.relay).toBe(true);
  });

  it('takes the web Services ID as the audience', async () => {
    await expect(checkAppleToken(appleToken({ aud: 'com.jdsmith2004.daybook.web' }), NONCE, opts)).resolves.toBeTruthy();
  });

  const refused: [string, () => [unknown, unknown]][] = [
    ['another app', () => [appleToken({ aud: 'com.someone.else' }), NONCE]],
    ['another issuer', () => [appleToken({ iss: 'https://evil.example' }), NONCE]],
    ['run out', () => [appleToken({ exp: NOW / 1000 - 120 }), NONCE]],
    ['a different nonce', () => [appleToken(), 'another-nonce-that-is-long']],
    ['no nonce', () => [appleToken(), undefined]],
    ['signed by someone else', () => [appleToken({}, {}, generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey), NONCE]],
    ['an unknown key', () => [appleToken({}, { kid: 'nope' }), NONCE]],
    ['no signature algorithm we take', () => [appleToken({}, { alg: 'none' }), NONCE]],
    ['not a token', () => ['hello', NONCE]],
    ['not a string', () => [{ a: 1 }, NONCE]],
  ];
  for (const [what, make] of refused)
    it('refuses one from ' + what, async () => {
      const [t, n] = make();
      await expect(checkAppleToken(t, n, opts)).rejects.toBeInstanceOf(BadAppleToken);
    });

  it('fetches the keys again for a key it has not seen, and keeps them an hour', async () => {
    let calls = 0;
    let list: object[] = [];
    const k = appleKeys(
      async () => (calls++, { ok: true, text: async () => JSON.stringify({ keys: list }) }),
      () => NOW,
    );
    await k();
    list = [jwk];
    await expect(checkAppleToken(appleToken(), NONCE, { ...opts, keys: k })).resolves.toBeTruthy();
    expect(calls).toBe(2);
    await checkAppleToken(appleToken(), NONCE, { ...opts, keys: k });
    expect(calls).toBe(2);
  });
});

describe('taking back Apple tokens when an account is closed', () => {
  const ec = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const p8 = ec.privateKey.export({ format: 'pem', type: 'pkcs8' }).toString();

  it('signs a client secret Apple can check', () => {
    const s = appleClientSecret(p8, 'TEAM123456', 'KEY1234567', 'com.jdsmith2004.daybook', NOW);
    const [h, b, sig] = s.split('.');
    expect(JSON.parse(Buffer.from(h, 'base64url').toString())).toEqual({ alg: 'ES256', kid: 'KEY1234567' });
    expect(JSON.parse(Buffer.from(b, 'base64url').toString())).toMatchObject({
      iss: 'TEAM123456',
      sub: 'com.jdsmith2004.daybook',
      aud: 'https://appleid.apple.com',
    });
    const ok = verify('sha256', Buffer.from(h + '.' + b), { key: ec.publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(sig, 'base64url'));
    expect(ok).toBe(true);
  });

  it('trades the code, then revokes the refresh token', async () => {
    const seen: { url: string; body: string }[] = [];
    const revoke = appleRevoker({ teamId: 'TEAM123456', keyId: 'KEY1234567', p8: async () => p8 }, async (url, init) => {
      seen.push({ url, body: init?.body || '' });
      return { ok: true, text: async () => JSON.stringify({ refresh_token: 'r-tok', access_token: 'a-tok' }) };
    });
    expect(await revoke('the-code', 'com.jdsmith2004.daybook')).toBe('revoked');
    expect(seen.map((x) => x.url)).toEqual(['https://appleid.apple.com/auth/token', 'https://appleid.apple.com/auth/revoke']);
    const last = new URLSearchParams(seen[1].body);
    expect(last.get('token')).toBe('r-tok');
    expect(last.get('token_type_hint')).toBe('refresh_token');
    expect(last.get('client_id')).toBe('com.jdsmith2004.daybook');
  });

  it('says so when the key is not in Parameter Store yet, or the code is no good', async () => {
    const net = async () => ({ ok: false, status: 400, text: async () => '{}' });
    expect(await appleRevoker({ teamId: 'T', keyId: 'K', p8: async () => null }, net)('c', 'x')).toBe('no-key');
    expect(await appleRevoker({ teamId: 'T', keyId: 'K', p8: async () => p8 }, net)('c', 'x')).toBe('bad-code');
    expect(await appleRevoker({ teamId: 'T', keyId: 'K', p8: async () => p8 }, net)(42, 'x')).toBe('bad-code');
  });
});
