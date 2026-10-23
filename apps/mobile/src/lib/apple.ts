/* Sign in with Apple on this device (core apple-sign-in.ts has the rest). On iPhone, Apple's own sheet
   (expo-apple-authentication: one Face ID tap, no browser page). On the web, Apple's JS button, which opens Apple's own
   popup, once the web has a Services ID (EXPO_PUBLIC_APPLE_SERVICES_ID). Android has none. Either way the app makes a
   one-time nonce, gives Apple its SHA-256, and sends the nonce with Apple's identity token to the sync API. */
import { appleClient, APPLE_WORDS, CognitoError, type AppleProof } from '@daybook/core';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

import { APPLE_ON, APPLE_SERVICES_ID, SYNC_URL } from './config';

export const apple = appleClient(SYNC_URL);

/** what Apple gave for one sign-in, with the code that can revoke it and the client it was given to */
export interface AppleAnswer extends AppleProof {
  code: string;
  client: 'ios' | 'web';
}

/** whether this device can offer Sign in with Apple */
export async function appleOffered(): Promise<boolean> {
  if (!SYNC_URL) return false;
  if (Platform.OS === 'ios') return APPLE_ON && (await AppleAuthentication.isAvailableAsync().catch(() => false));
  return Platform.OS === 'web' && !!APPLE_SERVICES_ID;
}

const cancelled = () => new CognitoError('AppleCancel', APPLE_WORDS.cancel);

async function nonces(): Promise<{ raw: string; hashed: string }> {
  const raw = Array.from(Crypto.getRandomBytes(24), (b) => b.toString(16).padStart(2, '0')).join('');
  return { raw, hashed: await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw) };
}

/** asks Apple; a person who closes the sheet gets a CognitoError with the code AppleCancel */
export async function askApple(): Promise<AppleAnswer> {
  const n = await nonces();
  if (Platform.OS === 'ios') {
    let r;
    try {
      r = await AppleAuthentication.signInAsync({ requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL], nonce: n.hashed });
    } catch (e) {
      if ((e as { code?: string })?.code === 'ERR_REQUEST_CANCELED') throw cancelled();
      throw new CognitoError('AppleFailed', 'Apple could not sign you in just now. Try again.');
    }
    if (!r.identityToken) throw new CognitoError('AppleFailed', 'Apple could not sign you in just now. Try again.');
    return { token: r.identityToken, nonce: n.raw, code: r.authorizationCode || '', client: 'ios' };
  }
  if (Platform.OS === 'web' && APPLE_SERVICES_ID) return askAppleOnWeb(n);
  throw new CognitoError('AppleUnavailable', APPLE_WORDS.unavailable);
}

/* ---------- the web: Apple's JS, loaded only when the person taps the button ---------- */
const APPLE_JS = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
type AppleJs = {
  auth: {
    init(o: Record<string, unknown>): void;
    signIn(): Promise<{ authorization?: { id_token?: string; code?: string } }>;
  };
};
let loading: Promise<AppleJs> | null = null;
function appleJs(): Promise<AppleJs> {
  const w = globalThis as unknown as { AppleID?: AppleJs; document?: Document };
  if (w.AppleID) return Promise.resolve(w.AppleID);
  if (!loading)
    loading = new Promise((yes, no) => {
      const el = w.document!.createElement('script');
      el.src = APPLE_JS;
      el.async = true;
      el.onload = () => (w.AppleID ? yes(w.AppleID) : no(new Error('no AppleID')));
      el.onerror = () => {
        loading = null;
        no(new Error('Apple JS'));
      };
      w.document!.head.appendChild(el);
    });
  return loading;
}

async function askAppleOnWeb(n: { raw: string; hashed: string }): Promise<AppleAnswer> {
  let js: AppleJs;
  try {
    js = await appleJs();
  } catch {
    throw new CognitoError('Network', 'Could not reach Apple. Check your connection and try again.');
  }
  const origin = (globalThis as unknown as { location?: Location }).location?.origin || '';
  js.auth.init({ clientId: APPLE_SERVICES_ID, scope: 'email', redirectURI: origin + '/auth', nonce: n.hashed, usePopup: true });
  let r;
  try {
    r = await js.auth.signIn();
  } catch (e) {
    const why = (e as { error?: string })?.error;
    if (why === 'popup_closed_by_user' || why === 'user_cancelled_authorize') throw cancelled();
    throw new CognitoError('AppleFailed', 'Apple could not sign you in just now. Try again.');
  }
  const token = r?.authorization?.id_token;
  if (!token) throw new CognitoError('AppleFailed', 'Apple could not sign you in just now. Try again.');
  return { token, nonce: n.raw, code: r.authorization?.code || '', client: 'web' };
}

/** on iPhone: whether the person has since stopped using their Apple ID with Daybook (iPhone Settings, Sign in with Apple) */
export async function appleRevoked(appleSub: string): Promise<boolean> {
  if (Platform.OS !== 'ios' || !APPLE_ON) return false;
  try {
    return (await AppleAuthentication.getCredentialStateAsync(appleSub)) === AppleAuthentication.AppleAuthenticationCredentialState.REVOKED;
  } catch {
    return false;
  }
}
