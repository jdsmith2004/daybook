/* The lock. With it on, Daybook asks for Face ID, Touch ID or the phone's passcode when it opens, and again when it comes back
   after more than a minute away (a quick trip to Messages to text a safe person does not lock it). While the app is in the
   background, a plain cover hides the log in the app switcher. Off unless the person turns it on in Settings. */
import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, StyleSheet, View } from 'react-native';

import { Flame } from '@/components/flame';
import { Button, T } from '@/components/ui';
import { useLockPref } from '@/lib/prefs';
import { useTheme } from '@/lib/theme';

const GRACE = 60_000;

export const lockOffered = true;

/** asks once, to turn the lock on or off: it only changes if the person can unlock */
export async function confirmUnlock(prompt: string): Promise<{ ok: boolean; why?: string }> {
  try {
    const r = await LocalAuthentication.authenticateAsync({ promptMessage: prompt, cancelLabel: 'Cancel' });
    if (r.success) return { ok: true };
    if (r.error === 'not_enrolled' || r.error === 'passcode_not_set' || r.error === 'not_available')
      return { ok: false, why: 'Set a passcode, Face ID or Touch ID on this phone first.' };
    return { ok: false };
  } catch {
    return { ok: false, why: 'This phone cannot lock Daybook.' };
  }
}

export function LockGate({ children }: { children: ReactNode }) {
  const c = useTheme();
  const on = useLockPref();
  const [locked, setLocked] = useState(true);
  const [cover, setCover] = useState(false);
  const away = useRef<number | null>(null);
  const asking = useRef(false);

  const unlock = useCallback(async () => {
    if (asking.current) return;
    asking.current = true;
    try {
      const r = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock Daybook', cancelLabel: 'Cancel' });
      if (r.success) setLocked(false);
    } finally {
      /* the Face ID sheet itself makes the app inactive for a moment; let that settle before watching again */
      setTimeout(() => (asking.current = false), 600);
    }
  }, []);

  /* when the setting becomes known: locked if on, open if off */
  useEffect(() => {
    if (on === false) setLocked(false);
    if (on === true && locked) unlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);

  useEffect(() => {
    if (!on) return;
    const s = AppState.addEventListener('change', (st) => {
      if (asking.current) return;
      if (st === 'active') {
        setCover(false);
        if (away.current != null && Date.now() - away.current > GRACE) {
          setLocked(true);
          unlock();
        }
        away.current = null;
      } else {
        setCover(true);
        if (away.current == null) away.current = Date.now();
      }
    });
    return () => s.remove();
  }, [on, unlock]);

  if (on === null) return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  const hide = on && (locked || cover);
  return (
    <View style={{ flex: 1 }}>
      {/* the app stays where it was underneath (a lock in the middle of SOS must not lose the place), hidden from the screen
          reader and covered for the eye */}
      <View style={{ flex: 1 }} importantForAccessibility={hide ? 'no-hide-descendants' : 'auto'} accessibilityElementsHidden={hide}>
        {children}
      </View>
      {hide ? (
        <View style={[StyleSheet.absoluteFill, s.cover, { backgroundColor: c.bg }]} accessibilityViewIsModal>
          <Flame level={1} size={110} />
          {locked ? (
            <>
              <T v="title" accessibilityRole="header">
                Daybook is locked
              </T>
              <View style={{ alignSelf: 'stretch' }}>
                <Button label="Unlock" onPress={unlock} />
              </View>
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  cover: { alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
});
