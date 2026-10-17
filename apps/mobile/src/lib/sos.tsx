/* SOS, while it is open, and what this device remembers between SOS uses. The open SOS lives here (not in a route's state) because
   a tool started from SOS hands back to it. The memory (lines seen lately, suggestions passed over, the last SOS) and the
   10-minute pause timer stay on this device only: they are never synced and never part of the log, like the legacy app's
   "daybook.ur.v1" and "daybook.timer". */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { newUrge, type UrMem, type UrState } from '@daybook/core';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

const MEM = 'daybook.ur.v1';
const TIMER = 'daybook.timer';

export interface PauseTimer {
  start: number;
  dur: number;
  credited: boolean;
  early?: boolean;
  gain?: number;
}

interface SosValue {
  ur: UrState | null;
  begin: (pts: number) => UrState;
  set: (ur: UrState) => void;
  end: () => void;
  /** a tool started from SOS goes on to Go to bed after it (a "then bed" pair) */
  combo: string | null;
  setCombo: (c: string | null) => void;
  mem: UrMem;
  setMem: (m: UrMem | ((m: UrMem) => UrMem)) => void;
  timer: PauseTimer | null;
  setTimer: (t: PauseTimer | null) => void;
  /** forget this device's SOS memory and timer (when the device is erased) */
  forget: () => Promise<void>;
}

const Ctx = createContext<SosValue | null>(null);

export function SosProvider({ children }: { children: ReactNode }) {
  const [ur, setUr] = useState<UrState | null>(null);
  const [combo, setCombo] = useState<string | null>(null);
  const [mem, setMemState] = useState<UrMem>({});
  const [timer, setTimerState] = useState<PauseTimer | null>(null);
  const memRef = useRef(mem);

  useEffect(() => {
    AsyncStorage.multiGet([MEM, TIMER])
      .then(([m, t]) => {
        try {
          const mv = m[1] ? JSON.parse(m[1]) : {};
          if (mv && typeof mv === 'object') {
            memRef.current = mv;
            setMemState(mv);
          }
          const tv = t[1] ? JSON.parse(t[1]) : null;
          /* an old timer (half a day past its end) is let go */
          if (tv && typeof tv.start === 'number' && typeof tv.dur === 'number' && Date.now() <= tv.start + tv.dur + 12 * 3600_000) setTimerState(tv);
        } catch {
          /* nothing kept is fine */
        }
      })
      .catch(() => undefined);
  }, []);

  const setMem = useCallback((m: UrMem | ((m: UrMem) => UrMem)) => {
    const next = typeof m === 'function' ? m(memRef.current) : m;
    memRef.current = next;
    setMemState(next);
    AsyncStorage.setItem(MEM, JSON.stringify(next)).catch(() => undefined);
  }, []);
  const setTimer = useCallback((t: PauseTimer | null) => {
    setTimerState(t);
    (t ? AsyncStorage.setItem(TIMER, JSON.stringify(t)) : AsyncStorage.removeItem(TIMER)).catch(() => undefined);
  }, []);
  const begin = useCallback((pts: number) => {
    const u = newUrge(Date.now(), pts);
    setUr(u);
    setCombo(null);
    return u;
  }, []);
  const end = useCallback(() => {
    setUr(null);
    setCombo(null);
  }, []);

  const forget = useCallback(async () => {
    setUr(null);
    setCombo(null);
    memRef.current = {};
    setMemState({});
    setTimerState(null);
    await AsyncStorage.multiRemove([MEM, TIMER]).catch(() => undefined);
  }, []);

  const value = useMemo<SosValue>(
    () => ({ ur, begin, set: setUr, end, combo, setCombo, mem, setMem, timer, setTimer, forget }),
    [ur, begin, end, combo, mem, setMem, timer, setTimer, forget],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSos(): SosValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSos needs a SosProvider');
  return v;
}
