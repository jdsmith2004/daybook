/* What Daybook learns, once a day: where things stand (core events.ts, "day"). Rendered in the root layout, inside the store
   and sync providers. Only numbers, yes or no, and the fixed settings: never a word, the log itself or Health's nights. */
import { addDays, evLang, fireLow, gameCompute, heroNumber, isSupporter, type Days } from '@daybook/core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { eventsOffered, track } from '@/lib/events';
import { useNights } from '@/lib/health';
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
      const g = gameCompute(snap.days, st, snap.reviews, tk);
      const hero = heroNumber(snap.days, st, tk, now);
      const count = hero ? parseFloat(hero.n.replace(/[^0-9.]/g, '')) : undefined;
      const os = parseInt(String(Platform.Version), 10);
      track('day', {
        mode: st.cleanMode,
        count: Number.isFinite(count) ? count : undefined,
        ns28: noSlip28(snap.days, tk),
        lvl: g.level.n,
        pts: g.pts,
        badges: g.badges.length,
        ix: g.level.stage,
        low: fireLow(snap.days, st, tk, now).step,
        acct: account,
        sync: sync.status.k === 'on',
        sup: isSupporter(st, now),
        health: !!health.on,
        faith: st.learn?.faithSet ? st.learn.faith : 'unset',
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

function evLangOf(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || '';
  } catch {
    return '';
  }
}
