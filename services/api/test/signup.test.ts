/* The sign-up trigger confirms the account but never marks the email as checked. */
import type { PreSignUpTriggerEvent } from 'aws-lambda';
import { expect, it } from 'vitest';

import { confirmSignUp } from '../src/signup';

const ev = (triggerSource: string) =>
  ({ triggerSource, request: { userAttributes: { email: 'sam@example.com' } }, response: {} }) as unknown as PreSignUpTriggerEvent;

it('confirms a sign-up from the app, and leaves the email unverified', () => {
  const r = confirmSignUp(ev('PreSignUp_SignUp')).response;
  expect(r.autoConfirmUser).toBe(true);
  expect(r.autoVerifyEmail).toBe(false);
});

it('leaves accounts the owner makes by hand to Cognito', () => {
  expect(confirmSignUp(ev('PreSignUp_AdminCreateUser')).response.autoConfirmUser).toBeUndefined();
});
