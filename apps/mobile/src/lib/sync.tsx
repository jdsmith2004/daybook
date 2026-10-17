/* Sync between devices, the app side. Off until the person signs in. Then the log stays on the device first, and a sync
   round (pull what the account saved since last time, merge it, push what changed here) runs when the app opens or comes
   back, a few seconds after a change, and every few minutes while it is open. Nothing is lost offline: changes wait in the
   dirty list until a round gets through.

   The first time a device signs in, the account and the device may both hold a log. A new device (no days yet) simply takes
   the account's log. An account with nothing in it takes the device's. When both have a log, the person chooses: combine
   them (the newer copy of each day and of the settings wins) or use the account's log on this device. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { accountHasLog, hasLog, pendingRecords, pullAll, pushAll, snapshotOf, type SyncRecord, type SyncTransport } from '@daybook/core';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { router } from 'expo-router';

import { accessToken, forgetSession, loadSession, SignInExpired, signOut, type Session } from './auth';
import { SYNC_URL, syncOffered } from './config';
import { useStore } from './store';

const KEY = 'daybook.sync';
const EVERY = 5 * 60_000;
const AFTER_CHANGE = 3000;

interface Kept {
  /** the account this device is joined to */
  sub: string;
  /** the server time the last pull started */
  since: number;
  /** when the last round got through (this device's clock) */
  at: number;
}
export type SyncStatus =
  | { k: 'off' } // this build has no sync
  | { k: 'out' } // signed out
  | { k: 'busy'; what: string }
  | { k: 'ask'; recs: SyncRecord[]; now: number } // first sign-in: both have a log
  | { k: 'on' }
  | { k: 'expired' }
  | { k: 'error'; msg: string };

interface SyncValue {
  status: SyncStatus;
  email: string;
  /** when the last round got through */
  at: number | null;
  /** changes here not sent yet */
  waiting: number;
  /** opens the account sheet (create an account or sign in), optionally with why and a lesson to open after */
  signInNow: (o?: { why?: string; then?: string }) => void;
  /** after the account sheet signed in: carry on syncing with this session */
  startWith: (s: Session) => Promise<void>;
  syncNow: () => Promise<void>;
  /** the answer to the first-sign-in question */
  choose: (how: 'combine' | 'account') => Promise<void>;
  /** sign out; with `remove`, the log leaves this device too */
  signOutNow: (remove: boolean) => Promise<void>;
  /** erase the log in the account (every device clears it on its next sync). False when the account could not be reached. */
  eraseAccount: () => Promise<boolean>;
  /** delete the account and everything in it, for good. Gives back what to tell the person. */
  deleteAccount: () => Promise<{ ok: boolean; msg: string }>;
  /** what the account kept from the last "Delete everything", for a week: how many records, and when; null when unknown */
  erased: { n: number; at: number } | null;
  /** looks again at what the account kept */
  checkErased: () => Promise<void>;
  /** brings the deleted log back */
  restoreErased: () => Promise<boolean>;
  /** the kept sign-in has been looked at (so a new person's setup can tell whether someone is signed in) */
  loaded: boolean;
}

const Ctx = createContext<SyncValue | null>(null);

class HttpError extends Error {
  constructor(
    public status: number,
    msg: string,
  ) {
    super(msg);
  }
}

export function SyncProvider({ children, onErased }: { children: ReactNode; onErased: () => Promise<void> }) {
  const store = useStore();
  const { ready, dirty, current, mergeFromAccount, ackPushed, markAllDirty, replaceFromAccount, erase } = store;
  const [status, setStatus] = useState<SyncStatus>(syncOffered ? { k: 'out' } : { k: 'off' });
  const [session, setSession] = useState<Session | null>(null);
  const [kept, setKept] = useState<Kept | null>(null);
  const sessionRef = useRef(session);
  const keptRef = useRef(kept);
  sessionRef.current = session;
  keptRef.current = kept;
  const running = useRef(false);
  const [loaded, setLoaded] = useState(!syncOffered);
  const [erased, setErased] = useState<{ n: number; at: number } | null>(null);
  const again = useRef(false);
  const paused = useRef(false);

  const saveKept = useCallback(async (k: Kept | null) => {
    keptRef.current = k;
    setKept(k);
    if (k) await AsyncStorage.setItem(KEY, JSON.stringify(k));
    else await AsyncStorage.removeItem(KEY);
  }, []);

  /* the transport: the sync API, with the access token, renewed once if the API turns it down */
  const transport = useCallback((s: Session): SyncTransport => {
    const call = async (method: string, query: string, body?: unknown) => {
      for (let tries = 0; ; tries++) {
        const token = await accessToken(s, tries > 0);
        const r = await fetch(SYNC_URL + query, {
          method,
          headers: { authorization: 'Bearer ' + token, ...(body ? { 'content-type': 'application/json' } : {}) },
          body: body ? JSON.stringify(body) : undefined,
        });
        if (r.status === 401 && tries === 0) continue;
        if (r.status === 401) throw new SignInExpired('Sign in again to keep syncing.');
        const out = await r.json().catch(() => ({}));
        if (!r.ok) throw new HttpError(r.status, (out && out.error) || 'Sync did not work this time.');
        return out;
      }
    };
    return {
      pull: (since, cursor) => call('GET', `?since=${since}` + (cursor ? `&cursor=${encodeURIComponent(cursor)}` : '')),
      push: (records) => call('POST', '', { records }),
    };
  }, []);

  const fail = useCallback((e: unknown) => {
    if (e instanceof SignInExpired) setStatus({ k: 'expired' });
    else if (e instanceof HttpError) {
      /* too much today, or too large: stop trying until the app is opened again */
      if (e.status === 429 || e.status === 413) paused.current = true;
      setStatus({ k: 'error', msg: e.message });
    } else setStatus({ k: 'error', msg: 'Could not reach your account. Your changes are kept here and will sync later.' });
  }, []);

  /** one round: pull, merge, push */
  const round = useCallback(async () => {
    const s = sessionRef.current;
    const k = keptRef.current;
    if (!s || !k || paused.current) return;
    if (running.current) {
      again.current = true;
      return;
    }
    running.current = true;
    try {
      do {
        again.current = false;
        setStatus({ k: 'busy', what: 'Syncing…' });
        const t = transport(s);
        const p = await pullAll(t, k.since);
        await mergeFromAccount(p.records);
        const pend = pendingRecords(current().snap, current().dirty);
        if (pend.length) {
          const r = await pushAll(t, pend);
          await ackPushed(r.acked);
        }
        await saveKept({ ...keptRef.current!, since: p.now, at: Date.now() });
        setStatus({ k: 'on' });
      } while (again.current);
    } catch (e) {
      fail(e);
    } finally {
      running.current = false;
    }
  }, [transport, mergeFromAccount, current, ackPushed, saveKept, fail]);

  /* at start: the kept sign-in, if any */
  useEffect(() => {
    if (!syncOffered || !ready) return;
    let live = true;
    (async () => {
      const [s, raw] = await Promise.all([loadSession(), AsyncStorage.getItem(KEY)]);
      if (!live) return;
      let k: Kept | null = null;
      try {
        k = raw ? (JSON.parse(raw) as Kept) : null;
      } catch {
        k = null;
      }
      if (s && k && k.sub === s.sub) {
        setSession(s);
        keptRef.current = k;
        setKept(k);
        sessionRef.current = s;
        setStatus({ k: 'on' });
        round();
      } else if (s) {
        /* signed in but never joined (the app closed during the first sign-in): start that again */
        setSession(s);
        sessionRef.current = s;
        setStatus({ k: 'out' });
      } else if (k) {
        /* joined before, but the sign-in is gone: in a browser it lasts only while the tab is open. The log is still here. */
        keptRef.current = k;
        setKept(k);
        setStatus({ k: 'expired' });
      }
      setLoaded(true);
    })();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  /* when the app comes back, and every few minutes while it is open */
  useEffect(() => {
    if (!kept) return;
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') {
        paused.current = false;
        round();
      }
    });
    const id = setInterval(() => AppState.currentState === 'active' && round(), EVERY);
    return () => {
      sub.remove();
      clearInterval(id);
    };
  }, [kept, round]);

  /* a few seconds after a change */
  const waiting = Object.keys(dirty).length;
  useEffect(() => {
    if (!kept || !waiting) return;
    const id = setTimeout(round, AFTER_CHANGE);
    return () => clearTimeout(id);
  }, [kept, waiting, dirty, round]);

  /** joins this device to the account, the first time */
  const join = useCallback(
    async (s: Session) => {
      setStatus({ k: 'busy', what: 'Looking at your account…' });
      const t = transport(s);
      const p = await pullAll(t, 0);
      const here = current().snap;
      const there = p.records.some((r) => r.data != null);
      if (there && hasLog(here) && accountHasLog(p.records)) {
        setStatus({ k: 'ask', recs: p.records, now: p.now });
        return;
      }
      const theirs = snapshotOf(p.records);
      /* a new device takes the account's log, as long as the account has settings to take */
      if (there && !hasLog(here) && theirs.settings) await replaceFromAccount(theirs);
      else {
        await mergeFromAccount(p.records);
        await markAllDirty();
      }
      await saveKept({ sub: s.sub, since: p.now, at: Date.now() });
      setStatus({ k: 'on' });
      await round();
    },
    [transport, current, replaceFromAccount, mergeFromAccount, markAllDirty, saveKept, round],
  );

  const signInNow = useCallback((o?: { why?: string; then?: string }) => {
    router.push({ pathname: '/account', params: { why: o?.why || '', then: o?.then || '' } });
  }, []);

  const startWith = useCallback(
    async (s: Session) => {
      try {
        const k = keptRef.current;
        sessionRef.current = s;
        setSession(s);
        /* signed in again to the same account: carry on where it left off */
        if (k && k.sub === s.sub) {
          paused.current = false;
          setStatus({ k: 'on' });
          await round();
          return;
        }
        /* a different account than before: this device joins it fresh */
        if (k) await saveKept(null);
        await join(s);
      } catch (e) {
        fail(e);
      }
    },
    [round, join, saveKept, fail],
  );

  const choose = useCallback(
    async (how: 'combine' | 'account') => {
      const s = sessionRef.current;
      if (!s || status.k !== 'ask') return;
      const { recs, now } = status;
      try {
        setStatus({ k: 'busy', what: 'Joining your account…' });
        if (how === 'account') await replaceFromAccount(snapshotOf(recs));
        else {
          await markAllDirty();
          await mergeFromAccount(recs);
        }
        await saveKept({ sub: s.sub, since: now, at: Date.now() });
        setStatus({ k: 'on' });
        await round();
      } catch (e) {
        fail(e);
      }
    },
    [status, replaceFromAccount, markAllDirty, mergeFromAccount, saveKept, round, fail],
  );

  const signOutNow = useCallback(
    async (remove: boolean) => {
      const s = sessionRef.current;
      /* send what is waiting first, so nothing made here is lost to the other devices */
      if (!remove && keptRef.current) await round();
      await saveKept(null);
      sessionRef.current = null;
      setSession(null);
      setStatus({ k: 'out' });
      if (remove) {
        await erase();
        await onErased();
      }
      await signOut(s);
    },
    [round, saveKept, erase, onErased],
  );

  /** a call to the sync API outside a sync round, with the token renewed once if it was turned down */
  const callApi = useCallback(async (method: string, query: string): Promise<{ status: number; body: Record<string, unknown> } | null> => {
    const s = sessionRef.current;
    if (!s) return null;
    for (let tries = 0; tries < 2; tries++) {
      try {
        const token = await accessToken(s, tries > 0);
        const r = await fetch(SYNC_URL + query, { method, headers: { authorization: 'Bearer ' + token } });
        if (r.status === 401 && tries === 0) continue;
        return { status: r.status, body: await r.json().catch(() => ({})) };
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  const checkErased = useCallback(async () => {
    const r = await callApi('GET', '?erased=1');
    if (r && r.status === 200) {
      const n = Number(r.body.n) || 0;
      setErased(n ? { n, at: Number(r.body.at) || Date.now() } : null);
    }
  }, [callApi]);

  const eraseAccount = useCallback(async () => {
    const r = await callApi('DELETE', '');
    const ok = !!r && r.status === 200;
    if (ok && keptRef.current) await saveKept({ ...keptRef.current, at: Date.now() });
    if (ok) await checkErased();
    return ok;
  }, [callApi, saveKept, checkErased]);

  const restoreErased = useCallback(async () => {
    const r = await callApi('POST', '?restore=1');
    if (!r || r.status !== 200) return false;
    setErased(null);
    await round();
    return true;
  }, [callApi, round]);

  const deleteAccount = useCallback(async () => {
    const r = await callApi('DELETE', '?all=1');
    if (!r) return { ok: false, msg: 'Could not reach your account. Nothing was deleted.' };
    /* the log is gone, the sign-in is not yet: asking again finishes it */
    if (r.status !== 200) return { ok: false, msg: String(r.body.error || 'Could not reach your account. Nothing was deleted.') };
    await saveKept(null);
    await forgetSession();
    sessionRef.current = null;
    setSession(null);
    setErased(null);
    setStatus({ k: 'out' });
    return { ok: true, msg: 'Your account was deleted.' };
  }, [callApi, saveKept]);

  const value = useMemo<SyncValue>(
    () => ({
      status,
      email: session?.email || '',
      at: kept?.at || null,
      waiting,
      signInNow,
      startWith,
      syncNow: async () => {
        paused.current = false;
        await round();
      },
      choose,
      signOutNow,
      eraseAccount,
      deleteAccount,
      erased,
      checkErased,
      restoreErased,
      loaded,
    }),
    [status, session, kept, waiting, signInNow, startWith, round, choose, signOutNow, eraseAccount, deleteAccount, erased, checkErased, restoreErased, loaded],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSync(): SyncValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSync needs a SyncProvider');
  return v;
}

/** "Synced just now", "Synced 5 minutes ago", ... */
export function syncedAgo(at: number | null, now = Date.now()): string {
  if (!at) return 'Not synced yet';
  const m = Math.floor((now - at) / 60_000);
  if (m < 1) return 'Synced just now';
  if (m < 60) return 'Synced ' + m + ' minute' + (m === 1 ? '' : 's') + ' ago';
  const h = Math.floor(m / 60);
  if (h < 24) return 'Synced ' + h + ' hour' + (h === 1 ? '' : 's') + ' ago';
  const d = Math.floor(h / 24);
  return 'Synced ' + d + ' day' + (d === 1 ? '' : 's') + ' ago';
}

/** whether the person has an account here: signed in, or this copy of Daybook has no accounts at all (then nothing waits
    behind one). Care never checks this; it only opens lessons and the account card (see accounts.ts). */
export function useAccount(): boolean {
  const { status, loaded } = useSync();
  /* until the kept sign-in is read, nothing is locked, so a signed-in person never sees a lock flash by */
  return !loaded || status.k !== 'out';
}
