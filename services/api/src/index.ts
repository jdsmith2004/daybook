/* The Lambda entry point. TABLE, USER_POOL_ID and STRIPE_KEY_PARAM come from Terraform (infra/app); so do CLIENT_ID and the
   APPLE_* settings for Sign in with Apple, which stays off ("not set up yet") until they are there. */
import {
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  AdminInitiateAuthCommand,
  AdminRespondToAuthChallengeCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
  UserNotFoundException,
  UsernameExistsException,
  type AttributeType,
} from '@aws-sdk/client-cognito-identity-provider';
import { appleSubOf } from '@daybook/core';

import { appleVerifier } from './apple';
import { appleChecker, appleKeys, appleRevoker, appleTag } from './apple-id';
import type { AppleUsers, FoundUser } from './apple-sign-in';
import { ssmSecret } from './secrets';
import { DynamoStore } from './store';
import { stripeFetcher } from './stripe';
import { makeHandler } from './sync';

const table = process.env.TABLE;
const pool = process.env.USER_POOL_ID;
if (!table || !pool) throw new Error('TABLE and USER_POOL_ID must be set');
/* the name of the SSM parameter that holds the Stripe restricted key (never the key itself) */
const stripeParam = process.env.STRIPE_KEY_PARAM || '/daybook/stripe-key';

const cognito = new CognitoIdentityProviderClient({});
/* the user name comes from the token API Gateway checked, never from the request body */
async function deleteUser(username: string) {
  try {
    await cognito.send(new AdminDeleteUserCommand({ UserPoolId: pool, Username: username }));
  } catch (e) {
    if (!(e instanceof UserNotFoundException)) throw e;
  }
}
/* when the account was made, for the grandfather rule (supporter.ts). Needs cognito-idp:AdminGetUser on the function's role;
   without it (before the owner applies infra/bootstrap) this is null and only the data rule decides. */
async function createdAt(username: string): Promise<number | null> {
  try {
    const u = await cognito.send(new AdminGetUserCommand({ UserPoolId: pool, Username: username }));
    return u.UserCreateDate ? u.UserCreateDate.getTime() : null;
  } catch {
    return null;
  }
}

/* ---------- Sign in with Apple (apple-sign-in.ts says what each step is for) ---------- */
const clientId = process.env.CLIENT_ID || '';
const appleIos = process.env.APPLE_BUNDLE_ID || '';
const appleWeb = process.env.APPLE_SERVICES_ID || '';
const audiences = [appleIos, appleWeb].filter(Boolean);

const attrs = (a: AttributeType[] | undefined) => Object.fromEntries((a || []).map((x) => [x.Name || '', x.Value || '']));
async function findOne(filter: string): Promise<FoundUser | null> {
  const r = await cognito.send(new ListUsersCommand({ UserPoolId: pool, Filter: filter, Limit: 2 }));
  const u = r.Users?.[0];
  if (!u?.Username) return null;
  const a = attrs(u.Attributes);
  return { username: u.Username, emailVerified: a.email_verified === 'true', apple: appleSubOf(a) };
}
/* a value in a ListUsers filter is in double quotes; one with a quote or a backslash in it is never looked up */
const quoted = (v: string) => (/["\\]/.test(v) ? null : '"' + v + '"');
const users: AppleUsers = {
  async byApple(sub) {
    const q = quoted(appleTag(sub));
    return q ? findOne('preferred_username = ' + q) : null;
  },
  async byEmail(email) {
    const q = quoted(email);
    return q ? findOne('email = ' + q) : null;
  },
  async create(email, sub, password) {
    let username: string | undefined;
    try {
      const r = await cognito.send(
        new AdminCreateUserCommand({
          UserPoolId: pool,
          Username: email,
          MessageAction: 'SUPPRESS',
          UserAttributes: [
            { Name: 'email', Value: email },
            { Name: 'email_verified', Value: 'true' },
            { Name: 'preferred_username', Value: appleTag(sub) },
          ],
        }),
      );
      username = r.User?.Username;
    } catch (e) {
      if (e instanceof UsernameExistsException) return null;
      throw e;
    }
    if (!username) return null;
    await cognito.send(new AdminSetUserPasswordCommand({ UserPoolId: pool, Username: username, Password: password, Permanent: true }));
    return username;
  },
  async link(username, sub) {
    await cognito.send(
      new AdminUpdateUserAttributesCommand({ UserPoolId: pool, Username: username, UserAttributes: [{ Name: 'preferred_username', Value: appleTag(sub) }] }),
    );
  },
  async signIn(username, answer) {
    const a = await cognito.send(
      new AdminInitiateAuthCommand({ UserPoolId: pool, ClientId: clientId, AuthFlow: 'CUSTOM_AUTH', AuthParameters: { USERNAME: username } }),
    );
    if (a.ChallengeName !== 'CUSTOM_CHALLENGE' || !a.Session) throw new Error('no Apple challenge');
    const r = await cognito.send(
      new AdminRespondToAuthChallengeCommand({
        UserPoolId: pool,
        ClientId: clientId,
        ChallengeName: 'CUSTOM_CHALLENGE',
        Session: a.Session,
        ChallengeResponses: { USERNAME: a.ChallengeParameters?.USERNAME || username, ANSWER: answer },
      }),
    );
    const t = r.AuthenticationResult;
    if (!t?.AccessToken || !t.IdToken || !t.RefreshToken) throw new Error('Apple sign-in did not finish');
    return { access: t.AccessToken, id: t.IdToken, refresh: t.RefreshToken, expiresIn: t.ExpiresIn || 3600 };
  },
};
const appleOn = !!(clientId && audiences.length);

export const handler = makeHandler(
  new DynamoStore(table),
  Date.now,
  deleteUser,
  {
    stripe: stripeFetcher(ssmSecret(stripeParam)),
    apple: appleVerifier(),
    createdAt,
  },
  appleOn
    ? {
        users,
        check: appleChecker({ audiences, keys: appleKeys() }),
        /* the Sign in with Apple key (.p8) the owner puts in Parameter Store by hand; the ids beside it are not secret */
        revoke: appleRevoker({
          teamId: process.env.APPLE_TEAM_ID || '',
          keyId: process.env.APPLE_KEY_ID || '',
          p8: ssmSecret(process.env.APPLE_KEY_PARAM || '/daybook/apple-key'),
        }),
        clientIds: { ios: appleIos, web: appleWeb },
        log: (m) => console.log(m),
      }
    : {},
);
