/* The Apple sign-in trigger: Cognito's three custom sign-in hooks (define, create and verify an auth challenge), in one
   Lambda. A custom sign-in has one step: the answer is Apple's identity token and its nonce, and it is right only when
   Apple's signature checks out (apple-id.ts) and the token's person is the one joined to this account (its
   preferred_username, which only the sync function sets). An account with no Apple ID never gets this far. It reads and
   stores nothing; it only fetches Apple's public keys. APPLE_AUDIENCES comes from Terraform (infra/app auth.tf). */
import type { CreateAuthChallengeTriggerEvent, DefineAuthChallengeTriggerEvent, VerifyAuthChallengeResponseTriggerEvent } from 'aws-lambda';

import { appleSubOf } from '@daybook/core';

import { appleChecker, appleKeys, type CheckApple } from './apple-id';

type Ev = DefineAuthChallengeTriggerEvent | CreateAuthChallengeTriggerEvent | VerifyAuthChallengeResponseTriggerEvent;

export function defineChallenge(e: DefineAuthChallengeTriggerEvent): DefineAuthChallengeTriggerEvent {
  const s = e.request.session || [];
  const last = s[s.length - 1];
  const fail = () => {
    e.response.issueTokens = false;
    e.response.failAuthentication = true;
  };
  if (e.request.userNotFound || !appleSubOf(e.request.userAttributes || {})) fail();
  else if (s.length === 0) {
    e.response.issueTokens = false;
    e.response.failAuthentication = false;
    e.response.challengeName = 'CUSTOM_CHALLENGE';
  } else if (s.length === 1 && last.challengeName === 'CUSTOM_CHALLENGE' && last.challengeResult) {
    e.response.issueTokens = true;
    e.response.failAuthentication = false;
  } else fail();
  return e;
}

export function createChallenge(e: CreateAuthChallengeTriggerEvent): CreateAuthChallengeTriggerEvent {
  e.response.publicChallengeParameters = { kind: 'apple' };
  e.response.privateChallengeParameters = { kind: 'apple' };
  e.response.challengeMetadata = 'APPLE';
  return e;
}

export async function verifyChallenge(e: VerifyAuthChallengeResponseTriggerEvent, checkApple: CheckApple): Promise<VerifyAuthChallengeResponseTriggerEvent> {
  e.response.answerCorrect = false;
  const want = appleSubOf(e.request.userAttributes || {});
  let a: { t?: unknown; n?: unknown } = {};
  try {
    a = JSON.parse(String(e.request.challengeAnswer || ''));
  } catch {
    return e;
  }
  if (!want || !a || typeof a !== 'object') return e;
  try {
    const who = await checkApple(a.t, a.n);
    e.response.answerCorrect = who.sub === want;
  } catch {
    e.response.answerCorrect = false;
  }
  return e;
}

export function makeTrigger(checkApple: CheckApple) {
  return async (e: Ev) => {
    switch (e.triggerSource) {
      case 'DefineAuthChallenge_Authentication':
        return defineChallenge(e as DefineAuthChallengeTriggerEvent);
      case 'CreateAuthChallenge_Authentication':
        return createChallenge(e as CreateAuthChallengeTriggerEvent);
      case 'VerifyAuthChallengeResponse_Authentication':
        return verifyChallenge(e as VerifyAuthChallengeResponseTriggerEvent, checkApple);
      default:
        return e;
    }
  };
}

const audiences = (process.env.APPLE_AUDIENCES || '')
  .split(',')
  .map((x) => x.trim())
  .filter(Boolean);
export const handler = makeTrigger(appleChecker({ audiences, keys: appleKeys() }));
