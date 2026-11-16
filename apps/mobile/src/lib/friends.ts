/* Friends (beta): the app's side of services/api friends.ts. The Friends page and its sheets read one shared copy of what the
   server keeps (useFriends), and this phone sends its card's numbers for the week now and then (FriendsKeeper in _layout), only
   while the person has a card. What this phone remembers on its own (never synced): that it is in Friends, when the numbers were
   last sent, the last encouragement seen, and that the person pre-joined the community. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { weekShare, type FriendCard, type ShareKey, type ShareVals } from '@daybook/core';
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

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
type Local = { in?: boolean; sentAt?: number; sentVals?: string; seen?: number; community?: number };
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

/** pre-joins the community: one anonymous count (the event community_join) and a mark on this phone. No name, email or account. */
export function joinCommunity() {
  if (local.community) return;
  track('community_join');
  keepLocal({ community: Date.now() });
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

/** sends the week's numbers when they changed, at most every few hours, while the person is in Friends and the app is open */
export function FriendsKeeper() {
  const sync = useSync();
  const { snap, tk } = useStore();
  const lo = useFriendsLocal();
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
