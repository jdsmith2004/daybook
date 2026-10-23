/* Sync between devices, the app side. Off until the person signs in. Then the log stays on the device first, and a sync
   round (pull what the account saved since last time, merge it, push what changed here) runs when the app opens or comes
   back, a few seconds after a change, and every few minutes while it is open. Nothing is lost offline: changes wait in the
   dirty list until a round gets through.

   The first time a device signs in, the account and the device may both hold a log. A new device (no days yet) simply takes
   the account's log. An account with nothing in it takes the device's. When both have a log, the person chooses: combine
   them (the newer copy of each day and of the settings wins) or use the account's log on this device.

   Sync needs support (core supporter.ts): an account that is not a supporter, and was not made before tips opened sync,
   is turned down when it sends changes (402). Then the status is 'need': nothing is lost, the changes wait here (still
   marked to send), lessons stay open, and sync starts again by itself once a tip is confirmed (tip.ts calls resume). This
   provider also gives tip.ts what it needs (setTipHost): the signed-in account, the API, and the settings change path. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  accountHasLog,
  hasLog,
  joinRecords,
  pendingRecords,
  pullAll,
  pushAll,
  snapshotOf,
  syncFailure,
  CLOCK_OK,
  type SyncRecord,
  type SyncTransport,
} from '@daybook/core';
import { changeSettings, keepSup, supActive, type Supporter } from '@daybook/core';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { router } from 'expo-router';

import { accessToken, forgetSession, loadSession, SignInExpired, signOut, type Session } from './auth';
import { SYNC_URL, syncOffered } from './config';
import { useStore } from './store';
import { keptSup, loadKept, setTipHost, syncTips, watchAppleTips } from './tip';

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
  | { k: 'on'; note?: string } // note: what the last round could not save, said plainly
  | { k: 'need' } // signed in, but sync opens with a tip (supporter.ts); the log stays here
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
  /** a fresh access token for the signed-in person, for calls about their own account (confirming their email) */
  token: () => Promise<string>;
  /** the answer to the first-sign-in question */
  choose: (how: 'combine' | 'account') => Promise<void>;
  /** sign out; with `remove`, the log leaves this device too. What is waiting is sent first; with `remove`, when some of it
      could not be sent, nothing happens unless `anyway`, and the number waiting comes back so the person can decide. */
  signOutNow: (remove: boolean, anyway?: boolean) => Promise<{ waiting: number }>;
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

/** "One change was", "3 changes were" */
const changes = (n: number) => (n === 1 ? 'One change was' : n + ' changes were');

/** how long a call to the sync API may take before it counts as no connection */
const TIMEOUT = 20_000;
/** a call to the sync API and its answer, given up after TIMEOUT (a stalled connection must not hold a round, or the
    "Syncing…" line, for good). Throws a plain Error when it runs out, which reads as "could not reach your account". */
async function callWithin(url: string, init: RequestInit): Promise<{ status: number; ok: boolean; body: Record<string, unknown> }> {
  const ctl = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<never>((_, no) => {
    timer = setTimeout(() => {
      ctl.abort();
      no(new Error('timeout'));
    }, TIMEOUT);
  });
  try {
    const r = await Promise.race([fetch(url, { ...init, signal: ctl.signal }), late]);
    const body = (await Promise.race([r.json().catch(() => ({})), late])) as Record<string, unknown>;
    return { status: r.status, ok: r.ok, body: body && typeof body === 'object' ? body : {} };
  } finally {
    clearTimeout(timer);
  }
}

class HttpError extends Error {
  constructor(
    public status: number,
    msg: string,
    /** the sync function answered with its own words (the daily allowance, a size limit); false for the gateway's own
        answers, like its request ceiling */
    public ours = false,
  ) {
    super(msg);
  }
}

export function SyncProvider({ children, onErased }: { children: ReactNode; onErased: () => Promise<void> }) {
  const store = useStore();
  const { ready, dirty, current, replace, mergeFromAccount, ackPushed, markAllDirty, restamp, replaceFromAccount, erase, apply, say, snap } = store;
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
  /* the account cannot sync yet (it needs a tip): rounds wait until tip.ts says the server agrees */
  const need = useRef(false);
  /* tip proofs on this device were sent once since the account was turned down */
  const linked = useRef(false);

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
        const r = await callWithin(SYNC_URL + query, {
          method,
          headers: { authorization: 'Bearer ' + token, ...(body ? { 'content-type': 'application/json' } : {}) },
          body: body ? JSON.stringify(body) : undefined,
        });
        if (r.status === 401 && tries === 0) continue;
        if (r.status === 401) throw new SignInExpired('Sign in again to keep syncing.');
        if (!r.ok)
          throw new HttpError(r.status, typeof r.body.error === 'string' ? r.body.error : 'Sync did not work this time.', typeof r.body.error === 'string');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return r.body as any;
      }
    };
    return {
      pull: (since, cursor) => call('GET', `?since=${since}` + (cursor ? `&cursor=${encodeURIComponent(cursor)}` : '')),
      push: (records) => call('POST', '', { records }),
    };
  }, []);

  /* the gateway's request ceiling was hit (many people syncing at once): one quiet retry, a few seconds on */
  const retried = useRef(false);
  const roundRef = useRef<() => Promise<void>>(async () => undefined);
  const resumeRef = useRef<() => void>(() => undefined);
  const fail = useCallback((e: unknown) => {
    if (e instanceof SignInExpired) setStatus({ k: 'expired' });
    else if (e instanceof HttpError && syncFailure(e.status, e.ours, retried.current) === 'need') {
      /* sync opens with a tip: the changes stay here, marked to send */
      need.current = true;
      setStatus({ k: 'need' });
      /* a tip this device knows of (an Apple purchase, a web tip from before signing in) is sent once, and opens it */
      if (!linked.current) {
        linked.current = true;
        syncTips()
          .then((r) => {
            if (supActive(r.server)) resumeRef.current();
          })
          .catch(() => undefined);
      }
    } else if (e instanceof HttpError) {
      const what = syncFailure(e.status, e.ours, retried.current);
      /* a retry is a sync round, which needs a device that has joined its account */
      if (what === 'retry' && keptRef.current) {
        retried.current = true;
        setStatus({ k: 'busy', what: 'Your account is busy. Trying again in a moment…' });
        setTimeout(() => roundRef.current(), 3000 + Math.random() * 5000);
        return;
      }
      /* too much today, or too large: stop trying until the app is opened again */
      if (what === 'pause') paused.current = true;
      setStatus({
        k: 'error',
        msg: e.status === 429 && !e.ours ? 'Your account is busy right now. Your changes are kept here and will sync later.' : e.message,
      });
    } else setStatus({ k: 'error', msg: 'Could not reach your account. Your changes are kept here and will sync later.' });
  }, []);

  /** one round: pull, merge, push */
  const round = useCallback(async () => {
    const s = sessionRef.current;
    const k = keptRef.current;
    if (!s || !k || paused.current || need.current) return;
    if (running.current) {
      again.current = true;
      return;
    }
    running.current = true;
    let restamped = false;
    try {
      do {
        again.current = false;
        setStatus({ k: 'busy', what: 'Syncing…' });
        const t = transport(s);
        const p = await pullAll(t, k.since);
        await mergeFromAccount(p.records);
        const pend = pendingRecords(current().snap, current().dirty);
        let note = '';
        if (pend.length) {
          const r = await pushAll(t, pend);
          await ackPushed(r.acked);
          /* changes stamped while this phone's clock was ahead: once the clock is right, they take the account's time and
             go again; while it is still ahead, they wait, and the person is told why */
          if (r.clock.length && !restamped && Math.abs(Date.now() - r.now) < CLOCK_OK) {
            await restamp(r.clock, r.now);
            restamped = true;
            again.current = true;
          } else if (r.clock.length)
            note = changes(r.clock.length) + ' not saved to your account yet, because this phone’s clock is ahead. Check its date and time.';
          else if (r.refused.length)
            note = changes(r.refused.length) + ' too large to save to your account. This device keeps ' + (r.refused.length === 1 ? 'it.' : 'them.');
        }
        await saveKept({ ...keptRef.current!, since: p.now, at: Date.now() });
        retried.current = false;
        setStatus(note ? { k: 'on', note } : { k: 'on' });
      } while (again.current);
    } catch (e) {
      fail(e);
    } finally {
      running.current = false;
    }
  }, [transport, mergeFromAccount, current, ackPushed, restamp, saveKept, fail]);
  roundRef.current = round;
  /* the server now says this account is a supporter */
  resumeRef.current = () => {
    if (!need.current) return;
    need.current = false;
    linked.current = false;
    if (keptRef.current) {
      setStatus({ k: 'on' });
      roundRef.current();
    } else if (sessionRef.current) join(sessionRef.current).catch(fail);
  };

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
        /* signed in but never joined (the app closed, or the account could not be reached, during the first sign-in): join
           now. Until it gets through, the person is still signed in: nothing locks, and Settings says what went wrong. */
        setSession(s);
        sessionRef.current = s;
        join(s).catch(fail);
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

  /** this device's log and the account's, together: the newer copy of each day, and the settings of the log with more
      days (core joinRecords), so a fresh setup on one device never replaces what the other earned */
  const combine = useCallback(
    async (recs: SyncRecord[]) => {
      const j = joinRecords(current().snap, recs);
      if (j.mine) await replace({ ...current().snap, settings: j.mine }, ['settings']);
      await markAllDirty();
      await mergeFromAccount(j.recs);
    },
    [current, replace, markAllDirty, mergeFromAccount],
  );

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
      else await combine(p.records);
      await saveKept({ sub: s.sub, since: p.now, at: Date.now() });
      setStatus({ k: 'on' });
      await round();
    },
    [transport, current, replaceFromAccount, combine, saveKept, round],
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
        need.current = false;
        linked.current = false;
        /* the tips this device knows of, brought to the account (and the account's record, brought here) */
        syncTips().catch(() => undefined);
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
        else await combine(recs);
        await saveKept({ sub: s.sub, since: now, at: Date.now() });
        setStatus({ k: 'on' });
        await round();
      } catch (e) {
        fail(e);
      }
    },
    [status, replaceFromAccount, combine, saveKept, round, fail],
  );

  const signOutNow = useCallback(
    async (remove: boolean, anyway = false) => {
      const s = sessionRef.current;
      /* send what is waiting first, so nothing made here is lost to the other devices */
      if (keptRef.current) {
        paused.current = false;
        await round();
      }
      const waiting = Object.keys(current().dirty).length;
      if (remove && waiting && !anyway) return { waiting };
      await saveKept(null);
      sessionRef.current = null;
      setSession(null);
      need.current = false;
      setStatus({ k: 'out' });
      if (remove) {
        await erase();
        await onErased();
      }
      await signOut(s);
      return { waiting: 0 };
    },
    [round, current, saveKept, erase, onErased],
  );

  /** a call to the sync API outside a sync round, with the token renewed once if it was turned down */
  const callApi = useCallback(async (method: string, query: string, body?: unknown): Promise<{ status: number; body: Record<string, unknown> } | null> => {
    const s = sessionRef.current;
    if (!s) return null;
    for (let tries = 0; tries < 2; tries++) {
      try {
        const token = await accessToken(s, tries > 0);
        const r = await callWithin(SYNC_URL + query, {
          method,
          headers: { authorization: 'Bearer ' + token, ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
          body: body === undefined ? undefined : JSON.stringify(body),
        });
        if (r.status === 401 && tries === 0) continue;
        return { status: r.status, body: r.body };
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

  /* tips (tip.ts): the signed-in account, the API, and the settings change path. A record is put on the settings only
     when it is better than theirs, so this never loops and never takes a record away. */
  const saveSup = useCallback(
    (sup: Supporter) => {
      const st = current().snap.settings;
      if (!st) return;
      const next = keepSup(st, sup);
      if (next !== st) apply({ st: changeSettings(st, (x) => void (x.sup = next.sup)) });
    },
    [current, apply],
  );
  useEffect(() => {
    setTipHost({
      account: () => sessionRef.current?.sub || null,
      api: (method, query, body) => callApi(method, query, body),
      open: async (body) => {
        if (!SYNC_URL) return null;
        try {
          const r = await callWithin(SYNC_URL + '/claim', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
          return { status: r.status, body: r.body };
        } catch {
          return null;
        }
      },
      save: saveSup,
      resume: () => resumeRef.current(),
      say,
    });
    return () => setTipHost(null);
  }, [callApi, saveSup, say]);
  /* Apple tips that arrive on their own, and at start every tip this device knows of (a web tip just paid, a restore) */
  useEffect(() => watchAppleTips(), []);
  useEffect(() => {
    if (!ready || !loaded) return;
    syncTips().catch(() => undefined);
  }, [ready, loaded]);
  /* settings that came back without the tip (a new setup, an account's log, an older backup) get it back */
  useEffect(() => {
    if (!ready || !snap.settings) return;
    let live = true;
    loadKept().then(() => {
      const k = keptSup();
      if (live && k) saveSup(k);
    });
    return () => {
      live = false;
    };
  }, [ready, snap.settings, saveSup]);

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
      token: async () => {
        const s = sessionRef.current;
        if (!s) throw new SignInExpired();
        return accessToken(s);
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
