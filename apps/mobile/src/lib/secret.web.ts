/* The sign-in that lets this browser sync. Like "Stay signed in" elsewhere: on a browser the person trusts (the default), it
   is kept in this site's storage and lasts until the sign-in runs out (a year) or they sign out; on a shared computer they
   untick it, and it lasts only while this tab is open (session storage). Either way, each renewal replaces the refresh token
   and Cognito retires the old one, so a copied token stops working soon after. The log itself stays in the browser. */
const KEY = 'daybook.auth';
const TRUST = 'daybook.trust';

export const trustOffered = true;
/** whether this browser keeps the sign-in after the tab closes */
export function getTrust(): boolean {
  try {
    return window.localStorage.getItem(TRUST) !== '0';
  } catch {
    return false;
  }
}
export function setTrust(on: boolean) {
  try {
    window.localStorage.setItem(TRUST, on ? '1' : '0');
  } catch {
    /* storage is off: the sign-in lasts for the tab */
  }
}

export async function readSecret(): Promise<string | null> {
  try {
    return window.sessionStorage.getItem(KEY) ?? window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
export async function writeSecret(v: string): Promise<void> {
  const keep = getTrust();
  (keep ? window.localStorage : window.sessionStorage).setItem(KEY, v);
  try {
    (keep ? window.sessionStorage : window.localStorage).removeItem(KEY);
  } catch {
    /* nothing kept there */
  }
}
export async function clearSecret(): Promise<void> {
  for (const st of [window.sessionStorage, window.localStorage]) {
    try {
      st.removeItem(KEY);
    } catch {
      /* nothing kept */
    }
  }
}
