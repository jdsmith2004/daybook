/* What Daybook learns, once a day: where things stand (core events.ts, "day"). Rendered in the root layout, inside the store
   and sync providers. Only numbers, yes or no, and the fixed settings: never a word, the log itself or Health's nights. */
import { addDays, evLang, evRound, fireLow, freeCounts, gameCompute, habitOf, heroNumber, isSupporter, rkComebackCount, type Days } from '@daybook/core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { eventsOffered, track } from '@/lib/events';
import { useNights } from '@/lib/health';
import { remindersAllowed, remindersOffered } from '@/lib/reminders';
import { useStore } from '@/lib/store';
import { useAccount, useSync } from '@/lib/sync';

const KEY = 'events:day';
let sent: string | null = null;

/** days with no slip in the 28 up to today, counted from the first day in the log */
function noSlip28(days: Days, tk: string): number {
  const keys = Object.keys(days).sort();
  if (!keys.length) return 0;
  let n = 0;
  for (let i = 0; i < 28; i++) {
    const k = addDays(tk, -i);
    if (k < keys[0]) break;
    if (!(days[k]?.events || []).some((e) => e.outcome === 'slipped')) n++;
  }
  return n;
}

export function DayEvents() {
  const { ready, snap, tk } = useStore();
  const account = useAccount();
  const sync = useSync();
  const health = useNights();
  useEffect(() => {
    if (!eventsOffered || !ready || !snap.settings || !health.ready) return;
    let live = true;
    (async () => {
      if (sent == null) sent = await AsyncStorage.getItem(KEY).catch(() => null);
      if (!live || sent === tk) return;
      sent = tk;
      AsyncStorage.setItem(KEY, tk).catch(() => undefined);
      const st = snap.settings!;
      const now = Date.now();
      if (!live) return;
      const g = gameCompute(snap.days, st, snap.reviews, tk);
      const hero = heroNumber(snap.days, st, tk, now);
      const count = hero ? parseFloat(hero.n.replace(/[^0-9.]/g, '')) : undefined;
      const os = parseInt(String(Platform.Version), 10);
      track('day', {
        mode: st.cleanMode,
        count: Number.isFinite(count) ? evRound(count!) : undefined,
        ns28: noSlip28(snap.days, tk),
        /* the measure Daybook steers by (core north.ts): urges ridden out against slips, over the last 30 days */
        ...freeCounts(snap.days, tk),
        lvl: g.level.n,
        pts: evRound(g.pts),
        badges: g.badges.filter((b) => b.done).length,
        ix: g.level.stage,
        low: fireLow(snap.days, st, tk, now).step,
        acct: account,
        sync: sync.status.k === 'on',
        sup: isSupporter(st, now),
        health: !!health.on,
        faith: st.learn?.faithSet ? st.learn.faith : 'unset',
        habit: habitOf(st),
        rem: remindersOffered ? await remindersAllowed().catch(() => false) : undefined,
        lang: evLang(evLangOf()),
        os: Number.isFinite(os) ? os : undefined,
      });
    })();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, tk, !!snap.settings, health.ready]);
  return null;
}

/* ---------- the flame's moments ---------- */
const SEEN = 'events:seen';
interface Seen {
  lvl: number;
  form: number;
  badges: string[];
  low: number;
  sync: boolean;
  /** comebacks from a slip (core rkComebackCount); missing in what older builds saved */
  cb?: number;
}
let seen: Seen | null | undefined;

/** each time the log changes: a new level, a new form of the flame, a badge earned, the flame burning lower or lit again, a
    comeback from a slip, and sync turned on. Compared with what was seen last, kept on the phone, so each is said once, when it happens (the first
    look only remembers, so nothing old is said as new). */
export function FlameEvents() {
  const { ready, snap, tk } = useStore();
  const sync = useSync();
  useEffect(() => {
    if (!eventsOffered || !ready || !snap.settings) return;
    let live = true;
    const t = setTimeout(async () => {
      if (seen === undefined) {
        const raw = await AsyncStorage.getItem(SEEN).catch(() => null);
        try {
          seen = raw ? (JSON.parse(raw) as Seen) : null;
        } catch {
          seen = null;
        }
      }
      if (!live) return;
      const st = snap.settings!;
      const g = gameCompute(snap.days, st, snap.reviews, tk);
      const now: Seen = {
        lvl: g.level.n,
        form: g.level.stage,
        badges: g.badges.filter((b) => b.done).map((b) => b.id),
        low: fireLow(snap.days, st, tk, Date.now()).step,
        sync: sync.status.k === 'on',
        cb: rkComebackCount(snap.days, st, tk),
      };
      const was = seen;
      if (was) {
        if (now.lvl > was.lvl) track('level_up', { lvl: now.lvl });
        if (now.form > was.form) track('form', { ix: now.form });
        g.badges.forEach((b, i) => b.done && !was.badges.includes(b.id) && track('badge', { ix: i }));
        if (now.low > was.low) track('flame_low', { low: now.low });
        if (now.low === 0 && was.low > 0) track('flame_lit');
        if (now.sync && !was.sync) track('sync_on');
        /* a phone that saved before comebacks were watched only remembers the count this first time */
        if (was.cb != null && now.cb! > was.cb) track('comeback');
      }
      seen = now;
      AsyncStorage.setItem(SEEN, JSON.stringify(now)).catch(() => undefined);
    }, 1500);
    return () => {
      live = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, snap.days, snap.settings, tk, sync.status.k]);
  return null;
}

function evLangOf(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || '';
  } catch {
    return '';
  }
}
