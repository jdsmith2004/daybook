/* Talking to Amazon Cognito directly, for native sign-up and sign-in inside the app (no browser page). Plain HTTPS calls to the
   Cognito API with the app's public client id; there is no secret to keep. The password goes only to Cognito, over TLS
   (USER_PASSWORD_AUTH). Tokens are renewed with GetTokensFromRefreshToken, which works with refresh token rotation.
   Every error comes back as a CognitoError with a short, kind sentence to show. Checked by test/cognito.test.ts. */

export interface Tokens {
  access: string;
  id: string;
  /** a renewal may or may not bring a new refresh token (rotation does) */
  refresh: string | null;
  /** seconds */
  expiresIn: number;
}
export type SignInResult = { k: 'ok'; tokens: Tokens } | { k: 'newPassword'; session: string } | { k: 'confirm' };

export class CognitoError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

/** what a person reads for each kind of error */
export function cognitoWords(code: string): string {
  switch (code) {
    case 'UsernameExistsException':
      return 'There is already an account with this email. Sign in instead.';
    case 'InvalidPasswordException':
      return 'Pick a password with at least 12 characters. A short sentence works well.';
    case 'CodeMismatchException':
      return 'That code does not match. Check the email and try again.';
    case 'ExpiredCodeException':
      return 'That code has run out. Send a new one.';
    case 'NotAuthorizedException':
    case 'UserNotFoundException':
      return 'The email or the password is not right.';
    case 'UserNotConfirmedException':
      return 'Your email is not confirmed yet. Enter the code we sent you.';
    case 'LimitExceededException':
    case 'TooManyRequestsException':
    case 'TooManyFailedAttemptsException':
      return 'Too many tries for now. Wait a few minutes, then try again.';
    case 'InvalidParameterException':
      return 'Check the email address and try again.';
    case 'NotVerified':
      return 'This email was never confirmed, so the password cannot be reset. If you are still signed in on another device, confirm your email in Settings there, then try again.';
    case 'CodeDeliveryFailureException':
      return 'The email with your code could not be sent. Check the address and try again.';
    case 'Network':
      return 'Could not reach the internet. Check your connection and try again.';
    default:
      return 'Something went wrong. Try again in a moment.';
  }
}

type Fetch = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{ ok: boolean; text(): Promise<string> }>;

export function cognitoClient(region: string, clientId: string, fetchFn: Fetch = fetch as unknown as Fetch) {
  const url = `https://cognito-idp.${region}.amazonaws.com/`;
  /** calls made with the person's access token (their own account) send it instead of the client id */
  async function call(op: string, body: Record<string, unknown>, withClient = true): Promise<Record<string, any>> {
    let res;
    try {
      res = await fetchFn(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-amz-json-1.1', 'X-Amz-Target': 'AWSCognitoIdentityProviderService.' + op },
        body: JSON.stringify(withClient ? { ClientId: clientId, ...body } : body),
      });
    } catch {
      throw new CognitoError('Network', cognitoWords('Network'));
    }
    const text = await res.text();
    let j: Record<string, any> = {};
    try {
      j = text ? JSON.parse(text) : {};
    } catch {
      j = {};
    }
    if (!res.ok) {
      const code = String(j.__type || j.code || 'Error')
        .split('#')
        .pop()!;
      throw new CognitoError(code, cognitoWords(code));
    }
    return j;
  }
  const tokensOf = (r: Record<string, any>, keep: string | null = null): Tokens => ({
    access: String(r.AccessToken || ''),
    id: String(r.IdToken || ''),
    refresh: r.RefreshToken ? String(r.RefreshToken) : keep,
    expiresIn: Number(r.ExpiresIn) || 3600,
  });
  const email = (e: string) => e.trim().toLowerCase();

  return {
    /** makes the account. Where the sign-up trigger is on (infra/app auth.tf), it is confirmed at once and no code is sent;
        otherwise Cognito emails a 6-digit code to confirm it */
    async signUp(e: string, password: string): Promise<{ confirmed: boolean }> {
      const r = await call('SignUp', { Username: email(e), Password: password, UserAttributes: [{ Name: 'email', Value: email(e) }] });
      return { confirmed: !!r.UserConfirmed };
    },
    async confirm(e: string, code: string): Promise<void> {
      await call('ConfirmSignUp', { Username: email(e), ConfirmationCode: code.replace(/\D/g, '') });
    },
    async resend(e: string): Promise<void> {
      await call('ResendConfirmationCode', { Username: email(e) });
    },
    async signIn(e: string, password: string): Promise<SignInResult> {
      try {
        const r = await call('InitiateAuth', { AuthFlow: 'USER_PASSWORD_AUTH', AuthParameters: { USERNAME: email(e), PASSWORD: password } });
        if (r.AuthenticationResult) return { k: 'ok', tokens: tokensOf(r.AuthenticationResult) };
        if (r.ChallengeName === 'NEW_PASSWORD_REQUIRED' && r.Session) return { k: 'newPassword', session: String(r.Session) };
        throw new CognitoError('Challenge', 'This account needs a step Daybook cannot do yet. Reset the password to continue.');
      } catch (err) {
        if (err instanceof CognitoError && err.code === 'UserNotConfirmedException') return { k: 'confirm' };
        throw err;
      }
    },
    /** an account made for the person (with a temporary password) picks its own on the first sign-in */
    async newPassword(e: string, session: string, password: string): Promise<Tokens> {
      const r = await call('RespondToAuthChallenge', {
        ChallengeName: 'NEW_PASSWORD_REQUIRED',
        Session: session,
        ChallengeResponses: { USERNAME: email(e), NEW_PASSWORD: password },
      });
      if (!r.AuthenticationResult) throw new CognitoError('Error', cognitoWords('Error'));
      return tokensOf(r.AuthenticationResult);
    },
    /** an account whose email was never confirmed has nowhere to send the code: that gets its own plain answer */
    async forgot(e: string): Promise<void> {
      try {
        await call('ForgotPassword', { Username: email(e) });
      } catch (err) {
        if (err instanceof CognitoError && err.code === 'InvalidParameterException') throw new CognitoError('NotVerified', cognitoWords('NotVerified'));
        throw err;
      }
    },
    /** whether the signed-in person's email is confirmed (password reset needs it) */
    async emailVerified(accessToken: string): Promise<boolean> {
      const r = await call('GetUser', { AccessToken: accessToken }, false);
      const a = (r.UserAttributes || []) as { Name: string; Value: string }[];
      return a.some((x) => x.Name === 'email_verified' && x.Value === 'true');
    },
    /** emails a 6-digit code to confirm the signed-in person's email */
    async sendEmailCode(accessToken: string): Promise<void> {
      await call('GetUserAttributeVerificationCode', { AccessToken: accessToken, AttributeName: 'email' }, false);
    },
    async verifyEmail(accessToken: string, code: string): Promise<void> {
      await call('VerifyUserAttribute', { AccessToken: accessToken, AttributeName: 'email', Code: code.replace(/\D/g, '') }, false);
    },
    async reset(e: string, code: string, password: string): Promise<void> {
      await call('ConfirmForgotPassword', { Username: email(e), ConfirmationCode: code.replace(/\D/g, ''), Password: password });
    },
    /** fresh tokens; with rotation, a new refresh token replaces the old one */
    async refresh(refreshToken: string): Promise<Tokens> {
      const r = await call('GetTokensFromRefreshToken', { RefreshToken: refreshToken });
      if (!r.AuthenticationResult) throw new CognitoError('NotAuthorizedException', cognitoWords('NotAuthorizedException'));
      return tokensOf(r.AuthenticationResult, refreshToken);
    },
    async revoke(refreshToken: string): Promise<void> {
      await call('RevokeToken', { Token: refreshToken });
    },
  };
}
export type Cognito = ReturnType<typeof cognitoClient>;

/** the region in a Cognito sign-in domain (https://name.auth.us-east-2.amazoncognito.com) */
export const regionOfAuthDomain = (d: string) => (/\.auth\.([a-z0-9-]+)\.amazoncognito\.com/.exec(d) || [])[1] || '';

/** a password Cognito will take (the pool asks for 12 characters, and nothing else) */
export const PASSWORD_MIN = 12;
export const passwordOk = (p: string) => p.length >= PASSWORD_MIN;
export const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
