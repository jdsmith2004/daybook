/* Sign in with Apple, the checks. The phone (Apple's own sheet) or the web (Apple's JS button) hands the app an identity token:
   a JWT Apple signed, about ten minutes long. This checks it against Apple's published keys (RS256), that it is from Apple,
   for Daybook (the app's bundle id, or the web's Services ID), not run out, and that it carries the nonce the app made for
   this one sign-in. Nothing here is secret.

   Closing an account must take back what Apple gave Daybook (Apple's rule). The app asks Apple once more and sends the fresh
   authorization code with the delete; revokeApple trades it for a token and revokes it. That needs the Sign in with Apple
   key (.p8), which the owner puts in Parameter Store by hand (/daybook/apple-key); it never passes through the code, Terraform
   or git. Nothing from Apple is ever stored. Checked by test/apple-id.test.ts. */
import { createHash, createPublicKey, randomBytes, sign, verify, type JsonWebKey } from 'node:crypto';

import { APPLE_PREFIX } from '@daybook/core';

export const APPLE_ISS = 'https://appleid.apple.com';
const KEYS_URL = APPLE_ISS + '/auth/keys';
/** how long Apple's keys are kept before they are fetched again (a token with a new key id fetches them at once) */
const KEYS_FOR = 3600_000;
/** a little room for a phone clock that is a bit off */
const SKEW = 60;

/** who Apple says signed in */
export interface AppleId {
  /** Apple's id for this person in this team's apps: the same every time */
  sub: string;
  email: string | null;
  /** Apple says the email is theirs (Apple always confirms it) */
  emailVerified: boolean;
  /** a Hide My Email relay address */
  relay: boolean;
}

/** a token that does not prove a sign-in; the words are safe to show */
export class BadAppleToken extends Error {}

type Jwk = JsonWebKey & { kid?: string };
export type AppleKeys = (fresh?: boolean) => Promise<Jwk[]>;
type Fetch = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<{ ok: boolean; status?: number; text(): Promise<string> }>;

/** Apple's public keys, kept for an hour */
export function appleKeys(fetchFn: Fetch = fetch as unknown as Fetch, clock: () => number = Date.now): AppleKeys {
  let keys: Jwk[] = [];
  let at = 0;
  return async (fresh = false) => {
    if (!fresh && keys.length && clock() - at < KEYS_FOR) return keys;
    const r = await fetchFn(KEYS_URL);
    if (!r.ok) throw new Error('Apple keys: ' + r.status);
    const j = JSON.parse(await r.text());
    keys = Array.isArray(j?.keys) ? j.keys : [];
    at = clock();
    return keys;
  };
}

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
const part = (s: string): Record<string, any> => {
  try {
    const o = JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));
    return o && typeof o === 'object' ? o : {};
  } catch {
    return {};
  }
};
const truthy = (v: unknown) => v === true || v === 'true';

export interface CheckOpts {
  /** the client ids a token may be for: the bundle id, and the Services ID once the web has one */
  audiences: string[];
  keys: AppleKeys;
  now?: number;
}

/** the identity token and the nonce the app made for it (Apple is given its SHA-256; either form is taken) */
export type CheckApple = (token: unknown, nonce: unknown) => Promise<AppleId>;

export function appleChecker(o: CheckOpts): CheckApple {
  return (token, nonce) => checkAppleToken(token, nonce, o);
}

export async function checkAppleToken(token: unknown, nonce: unknown, o: CheckOpts): Promise<AppleId> {
  const bad = (why = 'Apple could not confirm that sign-in. Try again.') => new BadAppleToken(why);
  if (typeof token !== 'string' || token.length > 8000) throw bad();
  const bits = token.split('.');
  if (bits.length !== 3) throw bad();
  const head = part(bits[0]);
  const body = part(bits[1]);
  if (head.alg !== 'RS256' || typeof head.kid !== 'string') throw bad();
  let key = (await o.keys()).find((k) => k.kid === head.kid);
  if (!key) key = (await o.keys(true)).find((k) => k.kid === head.kid);
  if (!key) throw bad();
  const ok = verify('RSA-SHA256', Buffer.from(bits[0] + '.' + bits[1]), createPublicKey({ key, format: 'jwk' }), Buffer.from(bits[2], 'base64url'));
  if (!ok) throw bad();
  const now = Math.floor((o.now ?? Date.now()) / 1000);
  if (body.iss !== APPLE_ISS) throw bad();
  if (typeof body.aud !== 'string' || !o.audiences.includes(body.aud)) throw bad();
  if (typeof body.exp !== 'number' || body.exp + SKEW < now) throw bad('That Apple sign-in ran out. Try again.');
  if (typeof body.iat === 'number' && body.iat - SKEW > now) throw bad();
  if (typeof nonce !== 'string' || nonce.length < 16 || nonce.length > 200) throw bad();
  if (body.nonce !== nonce && body.nonce !== sha256(nonce)) throw bad();
  if (typeof body.sub !== 'string' || !body.sub || body.sub.length > 200) throw bad();
  const email = typeof body.email === 'string' && body.email.includes('@') ? body.email.trim().toLowerCase() : null;
  return { sub: body.sub, email, emailVerified: !!email && truthy(body.email_verified), relay: truthy(body.is_private_email) };
}

/** what marks a Cognito account as Apple's (its preferred_username), and reads it back */
export const appleTag = (sub: string) => APPLE_PREFIX + sub;

/* ---------- taking back Apple's tokens when an account is closed ---------- */

export interface AppleKeyInfo {
  teamId: string;
  keyId: string;
  /** the .p8, from Parameter Store; null until the owner puts it there */
  p8: () => Promise<string | null>;
}

/** the client secret Apple asks for: a short JWT signed with the Sign in with Apple key (ES256) */
export function appleClientSecret(p8: string, teamId: string, keyId: string, clientId: string, now = Date.now()): string {
  const iat = Math.floor(now / 1000);
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const input = b64({ alg: 'ES256', kid: keyId }) + '.' + b64({ iss: teamId, iat, exp: iat + 300, aud: APPLE_ISS, sub: clientId });
  const sig = sign('sha256', Buffer.from(input), { key: p8, dsaEncoding: 'ieee-p1363' });
  return input + '.' + sig.toString('base64url');
}

/** 'revoked', or why not (the account is closed either way; this is for the log) */
export type RevokeApple = (code: unknown, clientId: string) => Promise<'revoked' | 'no-key' | 'bad-code' | 'failed'>;

export function appleRevoker(info: AppleKeyInfo, fetchFn: Fetch = fetch as unknown as Fetch, clock: () => number = Date.now): RevokeApple {
  return async (code, clientId) => {
    if (typeof code !== 'string' || !code || code.length > 2000) return 'bad-code';
    const p8 = await info.p8().catch(() => null);
    if (!p8 || !info.teamId || !info.keyId) return 'no-key';
    const form = (o: Record<string, string>) => new URLSearchParams(o).toString();
    const headers = { 'content-type': 'application/x-www-form-urlencoded' };
    try {
      const secret = appleClientSecret(p8, info.teamId, info.keyId, clientId, clock());
      const t = await fetchFn(APPLE_ISS + '/auth/token', {
        method: 'POST',
        headers,
        body: form({ client_id: clientId, client_secret: secret, code, grant_type: 'authorization_code' }),
      });
      if (!t.ok) return 'bad-code';
      const j = JSON.parse(await t.text());
      const token = j.refresh_token || j.access_token;
      if (typeof token !== 'string') return 'bad-code';
      const r = await fetchFn(APPLE_ISS + '/auth/revoke', {
        method: 'POST',
        headers,
        body: form({ client_id: clientId, client_secret: secret, token, token_type_hint: j.refresh_token ? 'refresh_token' : 'access_token' }),
      });
      return r.ok ? 'revoked' : 'failed';
    } catch {
      return 'failed';
    }
  };
}

/** a password nobody knows, for an account that signs in only with Apple (Cognito wants one to mark it confirmed) */
export const throwawayPassword = () => randomBytes(32).toString('base64url') + 'aA1!';
