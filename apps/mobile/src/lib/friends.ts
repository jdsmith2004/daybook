/* Friends (beta): the app's side of services/api friends.ts. The Friends page and its sheets read one shared copy of what the
   server keeps (useFriends), and this phone sends its card's numbers for the week now and then (FriendsKeeper in _layout), only
   while the person has a card. What this phone remembers on its own (never synced): that it is in Friends, when the numbers were
   last sent, the last encouragement seen, and that the person pre-joined the community. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { normCode, weekShare, type FriendCard, type ShareKey, type ShareVals } from '@daybook/core';
import { router, useSegments } from 'expo-router';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';

import { track } from './events';
import { useStore } from './store';
import { useSync } from './sync';

export interface FriendView {
  fid: string;
  since: number;
  name: string;
  goals: string[];
  vals: ShareVals;
  cheer?: { k: string; at: number };
  sent?: number;
}
export interface FriendsData {
  me: { name: string; goals: string[]; on: FriendCard['on'] } | null;
  invite: { code: string; exp: number } | null;
  friends: FriendView[];
}

type State = { data: FriendsData | null; loading: boolean; error: string | null };
let state: State = { data: null, loading: false, error: null };
const subs = new Set<() => void>();
const set = (p: Partial<State>) => {
  state = { ...state, ...p };
  subs.forEach((f) => f());
};
const sub = (f: () => void) => {
  subs.add(f);
  return () => void subs.delete(f);
};

/* ---------- what this phone keeps ---------- */
const KEY = 'daybook.friends';
type Local = { in?: boolean; sentAt?: number; sentVals?: string; seen?: number; community?: number; pending?: string; next?: 'add' | 'code' };
let local: Local = {};
const localSubs = new Set<() => void>();
AsyncStorage.getItem(KEY)
  .then((v) => {
    if (v) local = { ...JSON.parse(v), ...local };
    localSubs.forEach((f) => f());
  })
  .catch(() => undefined);
function keepLocal(p: Partial<Local>) {
  local = { ...local, ...p };
  localSubs.forEach((f) => f());
  AsyncStorage.setItem(KEY, JSON.stringify(local)).catch(() => undefined);
}
export const useFriendsLocal = () =>
  useSyncExternalStore(
    (f) => {
      localSubs.add(f);
      return () => void localSubs.delete(f);
    },
    () => local,
  );

/* A friend's link opened by someone new to Daybook: setup comes first and the link's page is left behind, so the code is kept here
   and the Friends page opens with it once setup is done (FriendsKeeper) */
function noteLink(url: string | null) {
  if (!url || !/\/friends\b/.test(url)) return;
  keepCode(url);
}
/** keeps a code (or a link holding one) to accept once the person can */
export function keepCode(raw: string) {
  const code = normCode(raw);
  if (code && code !== local.pending) keepLocal({ pending: code });
}
if (Platform.OS === 'web' && typeof window !== 'undefined') noteLink(window.location.href);
else Linking.getInitialURL().then(noteLink, () => undefined);

/** pre-joins the community: one anonymous count (the event community_join) and a mark on this phone. No name, email or account. */
export function joinCommunity() {
  if (local.community) return;
  track('community_join');
  keepLocal({ community: Date.now() });
}

/** what the person set out to do before the account sheet (add a friend, or enter a code), to carry on with after it */
export const keepNext = (next: 'add' | 'code' | undefined) => keepLocal({ next });
/** the kept code and next step, taken once */
export function takeNext(): { code?: string; next?: 'add' | 'code' } {
  const out = { code: local.pending, next: local.next };
  if (out.code || out.next) keepLocal({ pending: undefined, next: undefined });
  return out;
}

/** the encouragements seen up to now */
export const markSeen = (at: number) => keepLocal({ seen: Math.max(local.seen || 0, at) });

/** what the server answers, said for a person: its own words when it wrote them for people, a calm line otherwise */
export function friendWords(r: { status: number; body: Record<string, unknown> } | null): string {
  if (!r) return 'Daybook could not reach your account. Try again in a moment.';
  if (r.status === 401) return 'Sign in again to see your friends.';
  if (typeof r.body.error === 'string' && r.status < 500) return r.body.error;
  return 'That did not work this time. Try again in a moment.';
}

export function useFriends() {
  const sync = useSync();
  const { snap, tk } = useStore();
  const s = useSyncExternalStore(sub, () => state);
  const signedIn = sync.status.k !== 'out' && sync.status.k !== 'off' && sync.loaded;

  const load = useCallback(async () => {
    if (!signedIn) return;
    set({ loading: true });
    const r = await sync.api('GET', '?friends=1');
    if (r?.status === 200) {
      const data = r.body as unknown as FriendsData;
      set({ data, loading: false, error: null });
      if (!!data.me !== !!local.in) keepLocal({ in: !!data.me });
    } else set({ loading: false, error: friendWords(r) });
  }, [signedIn, sync]);

  /** saves the card: the words, what is on, and this week's numbers */
  const saveCard = useCallback(
    async (c: { name: string; goals: string[]; on: Partial<Record<ShareKey, boolean>> }): Promise<string | null> => {
      if (!snap.settings) return 'Finish setup first.';
      const vals = weekShare(snap.days, snap.settings, snap.reviews, tk);
      const r = await sync.api('POST', '?friends=card', { card: { ...c, vals, at: Date.now() } });
      if (r?.status !== 200) return friendWords(r);
      set({ data: r.body as unknown as FriendsData, error: null });
      keepLocal({ in: true, sentAt: Date.now(), sentVals: JSON.stringify(vals) });
      return null;
    },
    [snap, tk, sync],
  );

  const call = useCallback(
    async (what: string, body: Record<string, unknown> = {}): Promise<{ ok: boolean; msg: string; body: Record<string, unknown> }> => {
      const r = await sync.api('POST', '?friends=' + what, body);
      const ok = r?.status === 200;
      if (ok && what !== 'invite') load().catch(() => undefined);
      return { ok, msg: ok ? '' : friendWords(r), body: r?.body || {} };
    },
    [sync, load],
  );

  const look = useCallback(
    async (code: string) => {
      const r = await sync.api('GET', '?friends=look&code=' + encodeURIComponent(code));
      return r?.status === 200
        ? { ok: true as const, name: String(r.body.name || ''), self: !!r.body.self, already: !!r.body.already }
        : { ok: false as const, msg: friendWords(r) };
    },
    [sync],
  );

  return { ...s, signedIn, load, saveCard, call, look };
}

/** for a sheet opened on its own (a link, a reload): the friends data, loaded if it is not here yet. ready: it is known (or there is no
    account to know it from, which the sheet sends back to the Friends page) */
export function useFriendsReady() {
  const fr = useFriends();
  const { loaded } = useSync();
  useEffect(() => {
    if (fr.signedIn && !fr.data && !fr.loading) fr.load().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fr.signedIn]);
  const ready = (fr.signedIn && !!fr.data) || (loaded && !fr.signedIn) || (!!fr.error && !fr.loading);
  return { ...fr, ready };
}

/** sends the week's numbers when they changed, at most every few hours, while the person is in Friends and the app is open */
export function FriendsKeeper() {
  const sync = useSync();
  const { snap, tk } = useStore();
  const lo = useFriendsLocal();
  const top = useSegments()[0] as string | undefined;
  /* a code kept from a link: once setup is done and the person is on the tabs, open Friends with it */
  useEffect(() => {
    if (!lo.pending || !snap.settings || top !== '(tabs)') return;
    const code = lo.pending;
    keepLocal({ pending: undefined });
    router.push({ pathname: '/friends', params: { code } });
  }, [lo.pending, snap.settings, top]);
  const on = !!lo.in && sync.status.k !== 'out' && sync.status.k !== 'off' && sync.loaded;
  useEffect(() => {
    if (!on || !snap.settings) return;
    const st = snap.settings;
    const push = async () => {
      if (AppState.currentState !== 'active') return;
      const vals = weekShare(snap.days, st, snap.reviews, tk);
      const text = JSON.stringify(vals);
      const since = Date.now() - (local.sentAt || 0);
      if ((text === local.sentVals && since < 24 * 3600_000) || since < 3 * 3600_000) return;
      const cur = state.data?.me ?? ((await sync.api('GET', '?friends=1'))?.body?.me as FriendsData['me'] | undefined);
      if (!cur) {
        keepLocal({ in: false });
        return;
      }
      const r = await sync.api('POST', '?friends=card', { card: { ...cur, vals, at: Date.now() } });
      if (r?.status === 200) {
        set({ data: r.body as unknown as FriendsData });
        keepLocal({ sentAt: Date.now(), sentVals: text });
      }
    };
    const t = setTimeout(() => push().catch(() => undefined), 4000);
    const a = AppState.addEventListener('change', (x) => x === 'active' && push().catch(() => undefined));
    return () => {
      clearTimeout(t);
      a.remove();
    };
  }, [on, snap.days, snap.settings, snap.reviews, tk, sync]);
  return null;
}
