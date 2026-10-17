/* The Cognito client against a fake Cognito: the requests it sends, what it gives back, and the words for each error. */
import { expect, it } from 'vitest';
import * as core from '../src/index';

type Call = { op: string; body: Record<string, any> };
function fake(answers: Record<string, { ok?: boolean; body: Record<string, unknown> }>) {
  const calls: Call[] = [];
  const f = async (url: string, init: { headers: Record<string, string>; body: string }) => {
    expect(url).toBe('https://cognito-idp.us-east-2.amazonaws.com/');
    expect(init.headers['Content-Type']).toBe('application/x-amz-json-1.1');
    const op = init.headers['X-Amz-Target'].replace('AWSCognitoIdentityProviderService.', '');
    calls.push({ op, body: JSON.parse(init.body) });
    const a = answers[op] || { body: {} };
    return { ok: a.ok !== false, text: async () => JSON.stringify(a.body) };
  };
  return { calls, c: core.cognitoClient('us-east-2', 'client123', f) };
}
const tokens = { AccessToken: 'a', IdToken: 'i', RefreshToken: 'r', ExpiresIn: 3600 };

it('signs up with the email as the user name, trimmed and in lower case, and confirms with the digits only', async () => {
  const { calls, c } = fake({ SignUp: { body: { UserConfirmed: false } } });
  expect(await c.signUp('  Me@Example.com ', 'a long password')).toEqual({ confirmed: false });
  await c.confirm('me@example.com', '123 456');
  expect(calls[0]).toEqual({
    op: 'SignUp',
    body: { ClientId: 'client123', Username: 'me@example.com', Password: 'a long password', UserAttributes: [{ Name: 'email', Value: 'me@example.com' }] },
  });
  expect(calls[1].body).toEqual({ ClientId: 'client123', Username: 'me@example.com', ConfirmationCode: '123456' });
});

it('signs in with the password flow and gives back the tokens', async () => {
  const { calls, c } = fake({ InitiateAuth: { body: { AuthenticationResult: tokens } } });
  expect(await c.signIn('me@example.com', 'pw')).toEqual({ k: 'ok', tokens: { access: 'a', id: 'i', refresh: 'r', expiresIn: 3600 } });
  expect(calls[0].body).toEqual({ ClientId: 'client123', AuthFlow: 'USER_PASSWORD_AUTH', AuthParameters: { USERNAME: 'me@example.com', PASSWORD: 'pw' } });
});

it('an account made with a temporary password asks for a new one, then signs in', async () => {
  const { calls, c } = fake({
    InitiateAuth: { body: { ChallengeName: 'NEW_PASSWORD_REQUIRED', Session: 'sess' } },
    RespondToAuthChallenge: { body: { AuthenticationResult: tokens } },
  });
  expect(await c.signIn('me@example.com', 'temp')).toEqual({ k: 'newPassword', session: 'sess' });
  expect((await c.newPassword('me@example.com', 'sess', 'my own password')).access).toBe('a');
  expect(calls[1].body.ChallengeResponses).toEqual({ USERNAME: 'me@example.com', NEW_PASSWORD: 'my own password' });
});

it('an email that is not confirmed yet goes to the code step instead of an error', async () => {
  const { c } = fake({ InitiateAuth: { ok: false, body: { __type: 'UserNotConfirmedException', message: 'x' } } });
  expect(await c.signIn('me@example.com', 'pw')).toEqual({ k: 'confirm' });
});

it('renews with GetTokensFromRefreshToken, keeping the old refresh token when no new one comes', async () => {
  const { calls, c } = fake({ GetTokensFromRefreshToken: { body: { AuthenticationResult: { AccessToken: 'a2', IdToken: 'i2', ExpiresIn: 3600 } } } });
  expect((await c.refresh('r1')).refresh).toBe('r1');
  expect(calls[0].body).toEqual({ ClientId: 'client123', RefreshToken: 'r1' });
  const f2 = fake({ GetTokensFromRefreshToken: { body: { AuthenticationResult: { ...tokens, RefreshToken: 'r2' } } } });
  expect((await f2.c.refresh('r1')).refresh).toBe('r2');
});

it('errors come back with a kind sentence, and a dropped connection says so', async () => {
  const { c } = fake({ SignUp: { ok: false, body: { __type: 'com.amazonaws#UsernameExistsException' } } });
  await expect(c.signUp('me@example.com', 'a long password')).rejects.toMatchObject({
    code: 'UsernameExistsException',
    message: core.cognitoWords('UsernameExistsException'),
  });
  const down = core.cognitoClient('us-east-2', 'x', async () => {
    throw new Error('offline');
  });
  await expect(down.forgot('me@example.com')).rejects.toMatchObject({ code: 'Network' });
});

it('the words have no contractions and never blame', () => {
  const codes = [
    'UsernameExistsException',
    'InvalidPasswordException',
    'CodeMismatchException',
    'ExpiredCodeException',
    'NotAuthorizedException',
    'UserNotConfirmedException',
    'LimitExceededException',
    'InvalidParameterException',
    'Network',
    'x',
  ];
  codes.forEach((k) => expect(core.cognitoWords(k)).not.toMatch(/\b\w+n[’']t\b|wrong password|invalid|failed/i));
});

it('small helpers', () => {
  expect(core.regionOfAuthDomain('https://daybook-7fe2f7ee.auth.us-east-2.amazoncognito.com')).toBe('us-east-2');
  expect(core.passwordOk('x'.repeat(11))).toBe(false);
  expect(core.passwordOk('x'.repeat(12))).toBe(true);
  expect(core.emailOk(' me@example.com ')).toBe(true);
  expect(core.emailOk('me@example')).toBe(false);
});
