/* The phone's own region, for the crisis line (core crisis.ts). It comes from the device settings through expo-localization,
   never from the App Store or an account, so care works with neither. On a build made before expo-localization was added,
   or if it says nothing, the locale tag from Intl is used, and with nothing at all core falls back to 988. */
import { crisisLine, gamblingLine, textLine } from '@daybook/core';
import { useMemo } from 'react';

export function phoneRegion(): string {
  try {
    // required here, so an older build without the native module still opens
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('expo-localization') as typeof import('expo-localization');
    for (const l of L.getLocales()) if (l.regionCode) return l.regionCode;
  } catch {
    // fall through to Intl
  }
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || '';
  } catch {
    return '';
  }
}

/** The crisis line for where this phone is, outside a component. */
export const phoneCrisisLine = () => crisisLine(phoneRegion());

/** The crisis line, the text line and the gambling line for where this phone is. */
export function useCrisis() {
  return useMemo(() => {
    const r = phoneRegion();
    return { line: crisisLine(r), text: textLine(r), gambling: gamblingLine(r) };
  }, []);
}
