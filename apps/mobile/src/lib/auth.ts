/* Signing in to sync. The app opens Cognito's own sign-in page in the system browser (the authorization code flow with PKCE:
   no client secret, which an app could not keep anyway), and gets back a refresh token, which is kept in the keychain or
   keystore (secret.ts), and a short-lived access token, which is kept only in memory and renewed when it runs out.
   The sync API takes the access token; who the person is comes only from that signed token. */
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { AUTH_DOMAIN, CLIENT_ID } from './config';
import { clearSecret, readSecret, writeSecret } from './secret';

/* on the web, the sign-in page comes back to /auth in a small window; this closes it and hands the answer to the app */
WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: AUTH_DOMAIN + '/oauth2/authorize',
  tokenEndpoint: AUTH_DOMAIN + '/oauth2/token',
  revocationEndpoint: AUTH_DOMAIN + '/oauth2/revoke',
};
/* the addresses the sign-in page may send people back to: exactly the ones Terraform lists (infra/app/auth.tf) */
const web = Platform.OS === 'web';
const origin = () => (web && typeof window !== 'undefined' ? window.location.origin : '');
const redirectUri = () => (web ? origin() + '/auth' : 'daybook://auth');
const logoutUri = () => (web ? origin() + '/' : 'daybook://signed-out');
/* openid and email only: a token says who signed in and cannot change the account (deleting it goes through the sync API) */
const SCOPES = ['openid', 'email'];

export interface Session {
  refresh: string;
  sub: string;
  email: string;
}
/** the sign-in ran out or was taken back: the person needs to sign in again (their log is still here) */
export class SignInExpired extends Error {}

let access: { token: string; exp: number } | null = null;

/** the claims inside a token (the token itself was checked by Cognito, and the API checks it again; this only reads it) */
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

/** opens the sign-in page. Gives back the session, or null when the person closed the page. */
export async function signIn(): Promise<Session | null> {
  const req = new AuthSession.AuthRequest({ clientId: CLIENT_ID, redirectUri: redirectUri(), scopes: SCOPES, usePKCE: true });
  const res = await req.promptAsync(discovery);
  if (res.type !== 'success') {
    if (res.type === 'error') throw new Error(res.params?.error_description || res.error?.message || 'Sign-in did not finish.');
    return null;
  }
  const code = res.params.code;
  if (!code || !req.codeVerifier) throw new Error('Sign-in did not finish.');
  const tok = await AuthSession.exchangeCodeAsync({ clientId: CLIENT_ID, code, redirectUri: redirectUri(), extraParams: { code_verifier: req.codeVerifier } }, discovery);
  if (!tok.refreshToken || !tok.idToken) throw new Error('Sign-in did not finish.');
  const c = claims(tok.idToken);
  const session: Session = { refresh: tok.refreshToken, sub: String(c.sub || ''), email: String(c.email || '') };
  if (!session.sub) throw new Error('Sign-in did not finish.');
  await writeSecret(JSON.stringify(session));
  access = { token: tok.accessToken, exp: (tok.issuedAt || Math.floor(Date.now() / 1000)) + (tok.expiresIn || 3600) };
  return session;
}

/** a fresh access token for the API. `force` renews it even if it looks fresh (after the API said it was not). */
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
      const tok = await AuthSession.refreshAsync({ clientId: CLIENT_ID, refreshToken: s.refresh }, discovery);
      access = { token: tok.accessToken, exp: (tok.issuedAt || now) + (tok.expiresIn || 3600) };
      if (tok.refreshToken && tok.refreshToken !== s.refresh) {
        s.refresh = tok.refreshToken;
        await writeSecret(JSON.stringify(s)).catch(() => undefined);
      }
      return access.token;
    } catch (e) {
      /* the refresh token was revoked, ran out (a year after signing in), or the account is gone */
      if (e instanceof AuthSession.TokenError) throw new SignInExpired('Sign in again to keep syncing.');
      throw e;
    }
  })().finally(() => {
    renewing = null;
  });
  return renewing;
}

/** signs this device out: takes back the refresh token, forgets it, and ends the sign-in page's own session, so the next
    sign-in asks for the password again (a shared computer must not stay signed in) */
export async function signOut(s: Session | null): Promise<void> {
  access = null;
  await clearSecret();
  if (s) await AuthSession.revokeAsync({ clientId: CLIENT_ID, token: s.refresh }, discovery).catch(() => undefined);
  const url = `${AUTH_DOMAIN}/logout?client_id=${encodeURIComponent(CLIENT_ID)}&logout_uri=${encodeURIComponent(logoutUri())}`;
  if (web) window.location.assign(url);
  else await WebBrowser.openAuthSessionAsync(url, logoutUri()).catch(() => undefined);
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
