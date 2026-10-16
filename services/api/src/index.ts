/* The Lambda entry point. TABLE and USER_POOL_ID come from Terraform (infra/app). */
import { AdminDeleteUserCommand, CognitoIdentityProviderClient, UserNotFoundException } from '@aws-sdk/client-cognito-identity-provider';

import { DynamoStore } from './store';
import { makeHandler } from './sync';

const table = process.env.TABLE;
const pool = process.env.USER_POOL_ID;
if (!table || !pool) throw new Error('TABLE and USER_POOL_ID must be set');

const cognito = new CognitoIdentityProviderClient({});
/* the user name comes from the token API Gateway checked, never from the request body */
async function deleteUser(username: string) {
  try {
    await cognito.send(new AdminDeleteUserCommand({ UserPoolId: pool, Username: username }));
  } catch (e) {
    if (!(e instanceof UserNotFoundException)) throw e;
  }
}

export const handler = makeHandler(new DynamoStore(table), Date.now, deleteUser);
