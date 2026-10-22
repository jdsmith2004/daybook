/* The opt-in counts on this device (core pulse.ts): kept in AsyncStorage under its own key (not "daybook:", so it is
   never part of the log, never synced and never in a backup), and sent once a day while the person has said yes.

   count('sos') anywhere in the app adds to today's count; it does nothing while the counts are off, and nothing at all in
   a build with no PULSE_URL. usePulse() is for the screens that show or change the choice. PulseKeeper (in the root
   layout) counts the day the app was opened and sends what is due. */
import { logicalKey, pulseAdd, pulseAnswer, pulseBatch, pulseNorm, pulseOpened, pulseSent, pulseSetup, type Days, type PulseState } from '@daybook/core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { PULSE_URL } from '@/lib/config';

const KEY = 'pulse:v1';
export const pulseOffered = !!PULSE_URL;
const today = () => logicalKey(Date.now(), 4);
const platform = (): 'ios' | 'android' | 'web' => (Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web');
const version = () => String(Constants.expoConfig?.version || '0');

let state: PulseState | null = null;
/* changes made before the saved state is read are kept here, then applied in order */
let queue: ((s: PulseState) => PulseState)[] = [];
const subs = new Set<(s: PulseState) => void>();
let loading: Promise<void> | null = null;

function load(): Promise<void> {
  if (!loading)
    loading = AsyncStorage.getItem(KEY)
      .then((raw) => {
        let parsed: unknown = null;
        try {
          parsed = raw ? JSON.parse(raw) : null;
        } catch {
          parsed = null;
        }
        state = pulseNorm(parsed, today());
      })
      .catch(() => {
        state = pulseNorm(null, today());
      })
      .then(() => {
        const q = queue;
        queue = [];
        if (q.length) apply((s) => q.reduce((x, f) => f(x), s));
        else subs.forEach((f) => f(state!));
      });
  return loading;
}

function apply(f: (s: PulseState) => PulseState) {
  if (!pulseOffered) return;
  if (!state) {
    queue.push(f);
    load();
    return;
  }
  const next = f(state);
  if (next === state) return;
  state = next;
  AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => undefined);
  subs.forEach((s) => s(next));
}

/** add one to a count today (core PULSE_KEYS names only; anything else is dropped) */
export const count = (k: string) => apply((s) => pulseAdd(s, k, today()));
/** setup reached page i of OB_PAGES, or was finished */
export const countSetup = (i: number, done = false) => apply((s) => pulseSetup(s, i, done));
/** the person's answer: yes sends from the days that are over, no deletes what was kept and counts nothing */
export const answerPulse = (on: boolean) => {
  apply((s) => pulseAnswer(s, on, today()));
  if (on) send();
};

let sending = false;
/** send the days that are over, if the person said yes. A failure keeps them for the next try. */
export async function send() {
  if (!pulseOffered || sending) return;
  await load();
  const b = state ? pulseBatch(state, today(), platform(), version()) : null;
  if (!b) return;
  sending = true;
  try {
    const r = await fetch(PULSE_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) });
    /* only the pulse answers with ok: a page that is not the pulse (it is off) is not a send */
    const j = (await r.json().catch(() => null)) as { ok?: boolean } | null;
    if (r.ok && j && j.ok === true) apply((s) => pulseSent(s, b));
  } catch {
    /* offline: try again next time */
  } finally {
    sending = false;
  }
}

/** send feedback: the words, and a reply address only if the person gave one. True when it arrived. */
export async function sendFeedback(t: string, r: string): Promise<boolean> {
  if (!pulseOffered) return false;
  try {
    const res = await fetch(PULSE_URL + '/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ t, r: r.trim() || undefined, p: platform(), v: version() }),
    });
    const j = (await res.json().catch(() => null)) as { ok?: boolean } | null;
    const ok = res.ok && !!j && j.ok === true;
    if (ok) count('feedback');
    return ok;
  } catch {
    return false;
  }
}

/** the state, for the screens that show the choice (null while it loads, or in a build with no pulse) */
export function usePulse(): PulseState | null {
  const [s, setS] = useState<PulseState | null>(state);
  useEffect(() => {
    if (!pulseOffered) return;
    subs.add(setS);
    load().then(() => setS(state));
    return () => {
      subs.delete(setS);
    };
  }, []);
  return s;
}

/** in the root layout: the day the app was opened (and a comeback after a slip), then what is due goes out; again each
    time the app comes back to the front */
export function useKeepPulse(ready: boolean, days: Days) {
  const log = useRef(days);
  log.current = days;
  useEffect(() => {
    if (!pulseOffered || !ready) return;
    const go = () => {
      apply((s) => pulseOpened(s, log.current, today()));
      send();
    };
    go();
    const sub = AppState.addEventListener('change', (a) => a === 'active' && go());
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
}
