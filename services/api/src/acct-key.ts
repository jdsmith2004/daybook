/* The account key (the owner, November 17, 2026: "i don't know a single id tagged to every account actions ... that seems
   like common sense to have that"). One stable key per account, so the Stats report can count accounts, not just phones, and
   follow one account across its phones and reinstalls.

   It is HMAC-SHA256 of the account's id (Cognito's sub) under a secret only this server holds, cut to 32 hex characters. So
   it never changes for an account, it cannot be turned back into the account id or the email, and a phone cannot work out
   another account's key. The secret is made here the first time it is needed (32 random bytes, kept in the records table
   under its own key, written once with a condition so two first calls agree), so it needs no setup by the owner.

   The app asks for it after sign-in (GET /sync?ak=1), keeps it beside the install id (never in the log, never synced) and
   sends it with each events batch; signing out or closing the account forgets it. */
import { createHmac, randomBytes } from 'node:crypto';

import type { Store } from './store';

/** where the secret is kept in the records table: a partition no account id can be */
export const AK_PK = '#meta';
export const AK_SK = 'acct-key-secret';

let cached: string | null = null;

/** the server's secret, made once */
export async function akSecret(store: Pick<Store, 'auxGet' | 'auxPut'>): Promise<string> {
  if (cached) return cached;
  const have = await store.auxGet(AK_PK, AK_SK);
  if (typeof have === 'string' && /^[0-9a-f]{64}$/.test(have)) return (cached = have);
  await store.auxPut(AK_PK, AK_SK, randomBytes(32).toString('hex'), { fresh: true });
  /* read back: if another call made it first, its secret is the one kept */
  const now = await store.auxGet(AK_PK, AK_SK);
  if (typeof now !== 'string' || !/^[0-9a-f]{64}$/.test(now)) throw new Error('the account key secret could not be kept');
  return (cached = now);
}

/** the key for one account id */
export const akOf = (secret: string, sub: string): string =>
  createHmac('sha256', Buffer.from(secret, 'hex'))
    .update('daybook-acct:' + sub)
    .digest('hex')
    .slice(0, 32);

/** for tests: forget the secret held in memory */
export const akForget = () => void (cached = null);
