/* The anonymous counts on this device (core pulse.ts): kept in AsyncStorage under its own key (not "daybook:", so it is
   never part of the log, never synced and never in a backup), and sent once a day: the basic counts unless the person
   turned counts off, the rest only once they said yes (core pulseBatch decides).

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
/** send the days that are over (what core pulseBatch allows). A failure keeps them for the next try. */
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

/* Stats shows on More once this device has opened it as the owner (the first time, by its address: /stats) */
const OWNER = 'pulse:owner';
let statsSeen: boolean | null = null;
const statsSubs = new Set<(v: boolean) => void>();
export function setStatsSeen(v: boolean) {
  if (statsSeen === v) return;
  statsSeen = v;
  (v ? AsyncStorage.setItem(OWNER, '1') : AsyncStorage.removeItem(OWNER)).catch(() => undefined);
  statsSubs.forEach((f) => f(v));
}
export function useStatsSeen(): boolean {
  const [v, setV] = useState(!!statsSeen);
  useEffect(() => {
    if (!pulseOffered) return;
    statsSubs.add(setV);
    if (statsSeen == null)
      AsyncStorage.getItem(OWNER)
        .then((x) => {
          statsSeen = x === '1';
          setV(statsSeen);
        })
        .catch(() => undefined);
    return () => {
      statsSubs.delete(setV);
    };
  }, []);
  return v;
}

/** the owner's Stats: the totals and the feedback (GET /pulse), with the person's sign-in. `you` is the account id
    when it is not the owner's (to set up DAYBOOK_OWNER_SUB). */
export async function fetchStats(token: string, from: string): Promise<{ ok: true; body: StatsBody } | { ok: false; status: number; you?: string }> {
  try {
    const r = await fetch(PULSE_URL + '?from=' + encodeURIComponent(from), { headers: { authorization: 'Bearer ' + token } });
    const j = (await r.json().catch(() => null)) as (StatsBody & { you?: string }) | null;
    if (r.ok && j && Array.isArray(j.totals)) return { ok: true, body: j };
    return { ok: false, status: r.status, you: j && typeof j.you === 'string' ? j.you : undefined };
  } catch {
    return { ok: false, status: 0 };
  }
}
export interface StatsBody {
  from: string;
  to: string;
  totals: { k: string; n: Record<string, number> }[];
  feedback: { at: number; t: string; r: string | null; p: string; v: string }[];
}
