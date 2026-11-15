/* Renewing the sign-in, with refresh token rotation (infra/app auth.tf): every renewal gives a new refresh token and Cognito
   retires the old one, 60 seconds later. A retired token sent again is "reuse" and never works again.

   Sync stopped on the owner's phone for days (the owner, November 15, 2026: "no matter what I do, it isn't syncing"). Cognito's
   own record showed why: one renewal that worked, then every renewal after it sent the retired token and was turned down as
   reuse. The new token had been kept in memory, but saving it to the keychain failed (a renewal while the phone was locking),
   and that failure was let go quietly. The next renewal then read the keychain, found a token different from the one in
   memory, and took it, as if another browser tab had renewed meanwhile; it was the retired one. And reuse was not taken as a
   sign-in that has ended, so the app said "a problem inside Daybook" for good and never asked the person to sign in again.

   So: a token kept in storage is taken over the one in memory only where other copies of the app share that storage (browser
   tabs), never on a phone, where the copy in memory is always the newest. A token that could not be saved is saved again at
   the next chance. And a refresh token Cognito will not take any more (reuse, revoked, run out, account gone) is an ended
   sign-in: the person is asked to sign in again, and their log stays on the device. Checked by test/renew.test.ts. */
import { CognitoError, type Tokens } from './cognito';

/** Cognito's answers that mean this refresh token will never work again */
export const GONE_CODES = ['NotAuthorizedException', 'RefreshTokenReuseException', 'UserNotFoundException'];

/** whether a failed renewal means the sign-in has ended (the person signs in again; nothing else can bring it back) */
export const signInGone = (e: unknown) => e instanceof CognitoError && GONE_CODES.includes(e.code);

/** the refresh token cannot be used any more: sign in again */
export class RefreshGone extends Error {}

export interface RenewDeps {
  /** Cognito's GetTokensFromRefreshToken */
  refresh: (token: string) => Promise<Tokens>;
  /** the refresh token in storage now, or null (none, or it cannot be read just now) */
  kept: () => Promise<string | null>;
  /** keeps this refresh token in storage; may fail (a locked phone) */
  save: (token: string) => Promise<void>;
  /** storage shared with other copies of the app that renew too (browser tabs): a different token there is newer */
  shared: boolean;
}

/** One renewal at a time, from one place. Give it the refresh token in hand; it gives back the new tokens and the refresh
    token to hold from now on. Throws RefreshGone when the sign-in has ended; other errors (no connection) pass through. */
export function renewer(d: RenewDeps) {
  /* a newer refresh token that is not in storage yet */
  let unsaved: string | null = null;
  const keep = async (token: string) => {
    try {
      await d.save(token);
      if (unsaved === token) unsaved = null;
    } catch {
      unsaved = token;
    }
  };
  return {
    /** saves a token that could not be saved before (call when the app comes back to the front) */
    async saveLater(): Promise<void> {
      if (unsaved) await keep(unsaved);
    },
    /** a new sign-in replaces whatever was waiting to be saved */
    reset() {
      unsaved = null;
    },
    async renew(mine: string): Promise<{ tokens: Tokens; refresh: string }> {
      let token = mine;
      if (d.shared) {
        const k = await d.kept().catch(() => null);
        if (k && k !== token) token = k;
      }
      let tokens: Tokens;
      try {
        tokens = await d.refresh(token);
      } catch (e) {
        if (!signInGone(e)) throw e;
        /* another tab may have renewed while this call was out: once more with the token it kept */
        const k = d.shared ? await d.kept().catch(() => null) : null;
        if (!k || k === token) throw new RefreshGone('Sign in again to keep syncing.');
        try {
          tokens = await d.refresh(k);
          token = k;
        } catch (e2) {
          if (signInGone(e2)) throw new RefreshGone('Sign in again to keep syncing.');
          throw e2;
        }
      }
      const next = tokens.refresh || token;
      if (next !== mine || unsaved) await keep(next);
      return { tokens, refresh: next };
    },
  };
}
