/* Sign in with Apple, the app's side. Apple's sheet (iPhone) or Apple's JS button (web) gives the app an identity token; the
   app sends it to the sync API (POST /sync/apple), which checks it with Apple's keys and answers with ordinary Cognito
   tokens, so everything after (renewal, sync, sign-out) is the same as an email sign-in. The server makes the account the
   first time, or joins Apple to the email account that already has Apple's email, when that email is confirmed.
   "Add Sign in with Apple" in Settings joins Apple to the account that is signed in (POST /sync?apple=link).
   Errors come back as a CognitoError, like every other sign-in error, with words to show. Checked by
   test/apple-sign-in.test.ts. */
import { CognitoError, cognitoWords, type Tokens } from './cognito';

/** an account that signs in with Apple carries this, then Apple's id for the person, as its preferred_username */
export const APPLE_PREFIX = 'apple.';

/** Apple's id for the person, from an id token's claims, or null for an account with no Apple sign-in */
export function appleSubOf(claims: Record<string, unknown>): string | null {
  const p = claims.preferred_username;
  return typeof p === 'string' && p.startsWith(APPLE_PREFIX) && p.length > APPLE_PREFIX.length ? p.slice(APPLE_PREFIX.length) : null;
}

/** what the app got from Apple for one sign-in */
export interface AppleProof {
  /** the identity token */
  token: string;
  /** the nonce the app made (Apple got its SHA-256) */
  nonce: string;
}

/** the words for the server's answers that have no sentence of their own */
export const APPLE_WORDS = {
  cancel: 'Sign in with Apple was stopped. Nothing changed.',
  off: 'Sign in with Apple is not ready yet. Use your email for now.',
  unavailable: 'Sign in with Apple is not available on this device.',
  deleteNeedsApple: 'Closing an account that signs in with Apple asks Apple once more, so Apple forgets Daybook too.',
};

type Fetch = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

export function appleClient(syncUrl: string, fetchFn: Fetch = fetch as unknown as Fetch) {
  async function post(url: string, body: unknown, token?: string): Promise<Record<string, any>> {
    let res;
    let text = '';
    try {
      res = await fetchFn(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) },
        body: JSON.stringify(body),
      });
      text = await res.text();
    } catch {
      throw new CognitoError('Network', cognitoWords('Network'));
    }
    let j: Record<string, any> | null = null;
    try {
      j = text ? JSON.parse(text) : {};
    } catch {
      j = null;
    }
    /* a server without Sign in with Apple yet: the web app's page comes back (the CDN answers unknown paths with it), or
       API Gateway's own "Not Found" */
    if (!j || typeof j !== 'object' || j.code === 'AppleOff' || (!res.ok && j.message === 'Not Found')) throw new CognitoError('AppleOff', APPLE_WORDS.off);
    if (!res.ok) throw new CognitoError(String(j.code || 'Apple' + res.status), typeof j.error === 'string' ? j.error : cognitoWords('Error'));
    return j;
  }
  return {
    /** signs in (making the account the first time, or joining the email account); gives Cognito tokens */
    async signIn(p: AppleProof): Promise<Tokens> {
      const j = await post(syncUrl + '/apple', { token: p.token, nonce: p.nonce });
      const t = j.tokens || {};
      if (!t.access || !t.id || !t.refresh) throw new CognitoError('Error', 'Signing in did not finish. Try again.');
      return { access: String(t.access), id: String(t.id), refresh: String(t.refresh), expiresIn: Number(t.expiresIn) || 3600 };
    },
    /** joins Apple to the signed-in account; gives Apple's id for the person */
    async link(accessToken: string, p: AppleProof): Promise<string> {
      const j = await post(syncUrl + '?apple=link', { token: p.token, nonce: p.nonce }, accessToken);
      return String(j.apple || '');
    },
  };
}
export type AppleClient = ReturnType<typeof appleClient>;
