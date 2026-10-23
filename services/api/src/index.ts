/* The Lambda entry point. TABLE, USER_POOL_ID and STRIPE_KEY_PARAM come from Terraform (infra/app). */
import { AdminDeleteUserCommand, AdminGetUserCommand, CognitoIdentityProviderClient, UserNotFoundException } from '@aws-sdk/client-cognito-identity-provider';

import { appleVerifier } from './apple';
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

export const handler = makeHandler(new DynamoStore(table), Date.now, deleteUser, {
  stripe: stripeFetcher(ssmSecret(stripeParam)),
  apple: appleVerifier(),
  createdAt,
});
