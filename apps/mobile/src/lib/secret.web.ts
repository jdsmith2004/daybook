/* The sign-in that lets this browser sync, kept in this browser's storage for this site, next to the log itself. The page
   only runs its own code (its Content-Security-Policy allows nothing else), and signing out removes it. */
const KEY = 'daybook.auth';

export async function readSecret(): Promise<string | null> {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
export async function writeSecret(v: string): Promise<void> {
  window.localStorage.setItem(KEY, v);
}
export async function clearSecret(): Promise<void> {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* nothing kept */
  }
}
