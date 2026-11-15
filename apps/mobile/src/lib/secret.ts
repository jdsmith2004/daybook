/* The sign-in that lets this device sync, kept in the iPhone keychain or the Android keystore. It stays on this device only
   (it is not copied to a new phone or into a backup), and it can be read once the phone has been unlocked after starting. */
import * as SecureStore from 'expo-secure-store';

const KEY = 'daybook.auth';

/* a phone keeps the sign-in in its keychain or keystore; there is nothing to choose */
/* the keychain belongs to this one app: the sign-in in memory is always the newest (core renew.ts) */
export const sharedStorage = false;
export const trustOffered = false;
export const getTrust = () => true;
export function setTrust(_on: boolean) {}
/* readable and saved after the phone's first unlock since it started, locked or not (still this device only, never in a
   backup): a renewal while the phone locks must be able to save the new token, since Cognito retires the old one (core
   renew.ts; the owner's sync stopped on this, November 15, 2026). The keychain finds the item without this setting, and the
   next save moves an item kept with the old setting over to it. */
const opts = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY };

export async function readSecret(): Promise<string | null> {
  /* a read can fail for a moment (the phone just locked, or is waking): once more before the sign-in counts as gone */
  for (let tries = 0; ; tries++) {
    try {
      return await SecureStore.getItemAsync(KEY, opts);
    } catch {
      if (tries >= 1) return null;
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}
export async function writeSecret(v: string): Promise<void> {
  await SecureStore.setItemAsync(KEY, v, opts);
}
export async function clearSecret(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY, opts);
  } catch {
    /* nothing kept */
  }
}
