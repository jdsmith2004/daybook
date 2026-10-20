/* The sign-up Lambda: Cognito's pre-sign-up trigger. It confirms a new account at once, so signing up in the app needs no
   emailed code (and sends no email, so Cognito's daily email cap does not limit sign-ups). The email is left unverified on
   purpose: a mistyped address that belongs to someone else can then never be used to reset the password and open the log.
   Once the person confirms their email from Settings, password reset works. It reads and stores nothing. */
import type { PreSignUpTriggerEvent } from 'aws-lambda';

export function confirmSignUp(event: PreSignUpTriggerEvent): PreSignUpTriggerEvent {
  /* only accounts made by the person in the app; one the owner makes with the AWS CLI keeps Cognito's own rules */
  if (event.triggerSource === 'PreSignUp_SignUp') {
    event.response.autoConfirmUser = true;
    event.response.autoVerifyEmail = false;
  }
  return event;
}

export const handler = async (event: PreSignUpTriggerEvent) => confirmSignUp(event);
