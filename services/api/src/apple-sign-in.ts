/* Sign in with Apple, the server's side (apple-id.ts checks Apple's token; core apple-sign-in.ts is the app's side).

   POST /sync/apple { token, nonce }, an open door (no sign-in; a low request ceiling in infra/app api.tf):
     1. Apple's token is checked.
     2. The account for this Apple ID is the one whose preferred_username is apple.<Apple's id>. Only this server sets that:
        the app client may write nothing but the email (infra/app auth.tf), so nobody can point their account at someone
        else's Apple ID.
     3. None yet, and an account already has Apple's email:
          - its email is confirmed (and Apple confirmed it too): Apple is joined to it, so Apple and the password open the
            same account: the same log, the same tips, and the grandfather rule as before;
          - not confirmed: no join. Accounts are made without checking the email, so anyone could have made one with
            someone else's address; joining would put that person's log in a stranger's account. The person signs in with
            the password and confirms the email in Settings (or uses "Add Sign in with Apple" there), then Apple works.
     4. No account at all: one is made with Apple's email (marked confirmed, since Apple confirmed it) and a password
        nobody knows.
     5. The account is signed in with Cognito's custom sign-in; the trigger (apple-auth.ts) checks Apple's token again and
        that it is this account's Apple ID. So this server cannot make a sign-in for anyone without their fresh Apple token.
   POST /sync?apple=link { token, nonce }, signed in: joins Apple to the signed-in account (Settings, "Add Sign in with
   Apple"). This covers Hide My Email, whose address never matches.

   An account made with Apple is made after tips opened, so it is never grandfathered; one joined to an older email account
   is that account, and keeps what it had. Checked by test/apple-sign-in.test.ts. */
import { BadAppleToken, throwawayPassword, type AppleId, type CheckApple } from './apple-id';

export interface CognitoTokens {
  access: string;
  id: string;
  refresh: string;
  expiresIn: number;
}

export interface FoundUser {
  username: string;
  /** the account's own email is confirmed */
  emailVerified: boolean;
  /** Apple's id already joined to it, if any */
  apple: string | null;
}

/** the Cognito calls this needs, injected so the tests need no AWS */
export interface AppleUsers {
  byApple(sub: string): Promise<FoundUser | null>;
  byEmail(email: string): Promise<FoundUser | null>;
  /** makes a confirmed account with this email and Apple's id; null when the email is taken (a race) */
  create(email: string, sub: string, password: string): Promise<string | null>;
  /** joins Apple's id to the account */
  link(username: string, sub: string): Promise<void>;
  /** custom sign-in, answering with Apple's token */
  signIn(username: string, answer: string): Promise<CognitoTokens>;
}

/** a sign-in that cannot go on; the words are safe to show */
export class AppleError extends Error {
  constructor(
    public status: number,
    public code: string,
    msg: string,
  ) {
    super(msg);
  }
}

export const APPLE_SAY = {
  notConfirmed:
    'There is already a Daybook account with this email. Sign in with your password, confirm your email in Settings, and then Sign in with Apple opens the same account.',
  otherApple: 'That account is already joined to a different Apple ID.',
  appleTaken: 'This Apple ID already signs in to another Daybook account. Sign in with Apple to use that one.',
  noEmail: 'Apple did not share an email for this sign-in. Try again.',
  busy: 'Could not finish signing in just now. Try again in a moment.',
};

async function check(checkApple: CheckApple, body: Record<string, unknown>): Promise<AppleId> {
  try {
    return await checkApple(body.token, body.nonce);
  } catch (e) {
    if (e instanceof BadAppleToken) throw new AppleError(401, 'BadAppleToken', e.message);
    throw new AppleError(502, 'AppleDown', 'Could not reach Apple. Try again in a moment.');
  }
}
const answerOf = (body: Record<string, unknown>) => JSON.stringify({ t: body.token, n: body.nonce });

/** the account this Apple ID signs in to, making or joining it the first time */
async function accountFor(users: AppleUsers, a: AppleId): Promise<string> {
  for (let tries = 0; tries < 2; tries++) {
    const mine = await users.byApple(a.sub);
    if (mine) return mine.username;
    if (!a.email) throw new AppleError(400, 'NoEmail', APPLE_SAY.noEmail);
    const same = await users.byEmail(a.email);
    if (same) {
      if (same.apple && same.apple !== a.sub) throw new AppleError(409, 'OtherApple', APPLE_SAY.otherApple);
      if (!same.emailVerified || !a.emailVerified) throw new AppleError(409, 'NotConfirmed', APPLE_SAY.notConfirmed);
      await users.link(same.username, a.sub);
      return same.username;
    }
    const made = await users.create(a.email, a.sub, throwawayPassword());
    if (made) return made;
    /* made by a second tap at the same moment: look again */
  }
  throw new AppleError(503, 'Busy', APPLE_SAY.busy);
}

export async function appleSignIn(users: AppleUsers, checkApple: CheckApple, body: Record<string, unknown>): Promise<CognitoTokens> {
  const a = await check(checkApple, body);
  const username = await accountFor(users, a);
  try {
    return await users.signIn(username, answerOf(body));
  } catch {
    throw new AppleError(503, 'Busy', APPLE_SAY.busy);
  }
}

/** joins Apple to the signed-in account (`username` from the checked token); gives Apple's id */
export async function appleLink(users: AppleUsers, checkApple: CheckApple, username: string, body: Record<string, unknown>): Promise<string> {
  const a = await check(checkApple, body);
  const mine = await users.byApple(a.sub);
  if (mine && mine.username !== username) throw new AppleError(409, 'AppleTaken', APPLE_SAY.appleTaken);
  if (!mine) await users.link(username, a.sub);
  return a.sub;
}
