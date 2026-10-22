/* What the phone says about notifications, for the ask on Today and Settings (core notify.ts): whether this is a phone that
   can notify, whether Daybook may, and whether the phone's own prompt can still show. Read again each time the app comes
   back to the front (the person may have changed it in the phone's settings) and after Daybook asks. In screenshot mode,
   ?notify=allow or ?notify=off fakes a phone for one picture; the web is never a phone otherwise. */
import type { NotifyEnv } from '@daybook/core';
import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { onPermission, remindersOffered, remindersState } from '@/lib/reminders';

function shotsFake(): NotifyEnv | null {
  if (process.env.EXPO_PUBLIC_SHOTS !== '1' || Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const q = new URLSearchParams(window.location.search).get('notify');
  return q === 'allow' || q === 'off' ? { offered: true, granted: false, canAskAgain: q === 'allow' } : null;
}

/** the phone's answer, or null until it is known */
export function useNotifyEnv(): NotifyEnv | null {
  const [env, setEnv] = useState<NotifyEnv | null>(() => shotsFake() || (remindersOffered ? null : { offered: false, granted: false, canAskAgain: false }));
  useEffect(() => {
    if (!remindersOffered) return;
    let live = true;
    const read = () =>
      remindersState()
        .then((s) => live && setEnv({ offered: true, ...s }))
        .catch(() => undefined);
    read();
    const a = AppState.addEventListener('change', (x) => x === 'active' && read());
    const off = onPermission(read);
    return () => {
      live = false;
      a.remove();
      off();
    };
  }, []);
  return env;
}
