/* What Daybook learns, on this phone (core events.ts): the install id and the events waiting to go, kept in AsyncStorage
   under their own key (not "daybook:", so they are never part of the log, never synced and never in a backup), and sent
   every few hours and as the app leaves.

   track('lesson_done', { lesson: 'l14', secs: 300 }) anywhere in the app adds an event; anything not on core's list is
   dropped. It does nothing while the person has turned it off in More (lib/pulse.ts tells this file, with setEventsOff),
   and nothing at all in a build with no EVENTS_URL. Turning it off, or Delete everything, drops what waits and the id. */
import { evAdd, evBatch, evNew, evNorm, evSent, logicalKey, type EvName, type EvState } from '@daybook/core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { EVENTS_URL, PULSE_URL } from '@/lib/config';

const KEY = 'events:v1';
export const eventsOffered = !!EVENTS_URL;
const today = () => logicalKey(Date.now(), 4);
const hour = () => new Date().getHours();
const platform = (): 'ios' | 'android' | 'web' => (Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web');
const version = () => String(Constants.expoConfig?.version || '0');
const hex = () => {
  const b = Crypto.getRandomBytes(16);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
};
/** sent at most this often while the app is open (and always as it leaves) */
const EVERY = 3 * 3600_000;

let state: EvState | null = null;
/* null until lib/pulse.ts has read the switch: events wait in memory, nothing is saved or sent (with no pulse, there is no
   switch to wait for) */
let off: boolean | null = PULSE_URL ? null : false;
let pending: ((s: EvState) => EvState)[] = [];
let loading: Promise<void> | null = null;
/* a load that started before forgetEvents is let go */
let gen = 0;
let lastSend = 0;

function load(): Promise<void> {
  const g = gen;
  if (!loading)
    loading = AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (g !== gen) return;
        let parsed: unknown = null;
        try {
          parsed = raw ? JSON.parse(raw) : null;
        } catch {
          parsed = null;
        }
        state = evNorm(parsed, today(), hex());
      })
      .catch(() => {
        if (g === gen) state = evNew(today(), hex());
      })
      .then(() => {
        if (g !== gen || !state) return;
        const q = pending;
        pending = [];
        if (q.length) apply((s) => q.reduce((x, f) => f(x), s));
        else save();
      });
  return loading;
}

const save = () => {
  if (state) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => undefined);
};

function apply(f: (s: EvState) => EvState) {
  if (!eventsOffered || off === true) return;
  if (off === null) {
    pending.push(f);
    return;
  }
  if (!state) {
    pending.push(f);
    load();
    return;
  }
  const next = f(state);
  if (next === state) return;
  state = next;
  save();
}

/** add an event now (core EV_NAMES only, props checked against EV_PROPS) */
export const track = (n: EvName, p?: Record<string, unknown>) => {
  const d = today();
  const h = hour();
  apply((s) => evAdd(s, n, d, h, p));
};

/** the person turned it off (or on again) in More: off drops what waits and the install id, so a later "on" starts a new one */
export function setEventsOff(v: boolean) {
  const was = off;
  off = v;
  if (v) forgetEvents();
  else if (was === null && pending.length) load();
}

/** Delete everything, or off: nothing waits, and the next event gets a new install id */
export function forgetEvents() {
  gen++;
  state = null;
  pending = [];
  loading = null;
  AsyncStorage.removeItem(KEY).catch(() => undefined);
}

let sending = false;
/** send what waits, one batch at a time; a failure keeps it for the next try */
export async function sendEvents() {
  if (!eventsOffered || off !== false || sending) return;
  await load();
  sending = true;
  try {
    for (let i = 0; i < 5 && state; i++) {
      const out = evBatch(state, platform(), version());
      if (!out) break;
      const r = await fetch(EVENTS_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(out.b) });
      /* only the events API answers with ok: a page that is not it (it is off) is not a send */
      const j = (await r.json().catch(() => null)) as { ok?: boolean } | null;
      if (!(r.ok && j && j.ok === true)) break;
      apply((s) => evSent(s, out.upTo));
      lastSend = Date.now();
    }
  } catch {
    /* offline: try again next time */
  } finally {
    sending = false;
  }
}

/** in the root layout: the app opened (cold the first time), and left with how long it was open; what waits goes out as the
    app leaves, and while it is open at most every few hours */
export function useKeepEvents(ready: boolean) {
  useEffect(() => {
    if (!eventsOffered || !ready) return;
    let since = Date.now();
    track('open', { cold: true });
    if (Date.now() - lastSend > EVERY) sendEvents();
    const sub = AppState.addEventListener('change', (a) => {
      if (a === 'active') {
        since = Date.now();
        track('open', { cold: false });
        if (Date.now() - lastSend > EVERY) sendEvents();
      } else if (a === 'background') {
        track('leave', { secs: Math.round((Date.now() - since) / 1000) });
        sendEvents();
      }
    });
    return () => sub.remove();
  }, [ready]);
}
