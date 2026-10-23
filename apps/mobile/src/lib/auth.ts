/* Signing in, natively: the account sheet (app/account.tsx) collects the email, the password and the emailed code, and this
   file talks to Cognito directly (packages/core/src/cognito.ts), with no browser page. A sign-in gives a refresh token, kept in
   the keychain or keystore (secret.ts), and a short-lived access token, kept only in memory and renewed when it runs out.
   The sync API takes the access token; who the person is comes only from that signed token. */
import { appleSubOf, cognitoClient, CognitoError, regionOfAuthDomain, type Tokens } from '@daybook/core';

import { AUTH_DOMAIN, CLIENT_ID } from './config';
import { clearSecret, readSecret, writeSecret } from './secret';

export const cognito = cognitoClient(regionOfAuthDomain(AUTH_DOMAIN) || 'us-east-2', CLIENT_ID);

export interface Session {
  refresh: string;
  sub: string;
  email: string;
  /** Apple's id for the person, when the account signs in with Apple too (closing it then asks Apple once more) */
  apple?: string;
}
/** the sign-in ran out or was taken back: the person needs to sign in again (their log is still here) */
export class SignInExpired extends Error {}

let access: { token: string; exp: number } | null = null;

/** the claims inside a token (Cognito made it, and the API checks it again; this only reads it) */
function claims(jwt: string): Record<string, unknown> {
  try {
    const part = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = part + '='.repeat((4 - (part.length % 4)) % 4);
    const text = decodeURIComponent(
      Array.from(atob(pad))
        .map((ch) => '%' + ch.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export async function loadSession(): Promise<Session | null> {
  const raw = await readSecret();
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as Session;
    return s && typeof s.refresh === 'string' && typeof s.sub === 'string' ? s : null;
  } catch {
    return null;
  }
}

/** keeps a new sign-in: the session in safe storage, the access token in memory */
export async function keepTokens(t: Tokens): Promise<Session> {
  const c = claims(t.id);
  const session: Session = { refresh: t.refresh || '', sub: String(c.sub || ''), email: String(c.email || '') };
  const a = appleSubOf(c);
  if (a) session.apple = a;
  if (!session.sub || !session.refresh) throw new CognitoError('Error', 'Signing in did not finish. Try again.');
  await writeSecret(JSON.stringify(session));
  access = { token: t.access, exp: Math.floor(Date.now() / 1000) + t.expiresIn };
  return session;
}

let renewing: Promise<string> | null = null;

/** a fresh access token for the API. `force` renews it even if it looks fresh (after the API said it was not).
    Each renewal brings a new refresh token (rotation); it replaces the old one in `s` and in storage. */
export async function accessToken(s: Session, force = false): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (!force && access && access.exp - 60 > now) return access.token;
  /* one renewal at a time: a second one with the same refresh token would waste a rotation */
  if (renewing) return renewing;
  renewing = (async () => {
    /* another tab of this browser may have renewed it already: use the newest one kept */
    const kept = await loadSession();
    if (kept && kept.sub === s.sub && kept.refresh !== s.refresh) s.refresh = kept.refresh;
    try {
      const tok = await cognito.refresh(s.refresh);
      access = { token: tok.access, exp: now + tok.expiresIn };
      if (tok.refresh && tok.refresh !== s.refresh) {
        s.refresh = tok.refresh;
        await writeSecret(JSON.stringify(s)).catch(() => undefined);
      }
      return access.token;
    } catch (e) {
      /* the refresh token was revoked, ran out (a year after signing in), or the account is gone */
      if (e instanceof CognitoError && e.code === 'NotAuthorizedException') throw new SignInExpired('Sign in again to keep syncing.');
      throw e;
    }
  })().finally(() => {
    renewing = null;
  });
  return renewing;
}

/** keeps that Apple was joined to the signed-in account (Settings, "Add Sign in with Apple") */
export async function keepApple(s: Session, apple: string): Promise<void> {
  s.apple = apple;
  await writeSecret(JSON.stringify(s));
}

/** signs this device out: takes back the refresh token and forgets it */
export async function signOut(s: Session | null): Promise<void> {
  access = null;
  await clearSecret();
  if (s) await cognito.revoke(s.refresh).catch(() => undefined);
}

/** forgets the sign-in on this device without asking Cognito (after the account itself was deleted) */
export async function forgetSession(): Promise<void> {
  access = null;
  await clearSecret();
}

/** after "Stay signed in on this browser" changes: the kept sign-in moves to the matching storage */
export async function keepPerTrust(): Promise<void> {
  const s = await loadSession();
  if (s) await writeSecret(JSON.stringify(s));
}
