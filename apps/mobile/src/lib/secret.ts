/* The sign-in that lets this device sync, kept in the iPhone keychain or the Android keystore. It stays on this device only
   (it is not copied to a new phone or into a backup), and it can be read only while the phone is unlocked. */
import * as SecureStore from 'expo-secure-store';

const KEY = 'daybook.auth';

/* a phone keeps the sign-in in its keychain or keystore; there is nothing to choose */
export const trustOffered = false;
export const getTrust = () => true;
export function setTrust(_on: boolean) {}
const opts = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

export async function readSecret(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEY, opts);
  } catch {
    return null;
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
