/* The made-up log the screenshot studio shows (dev only): someone about two months in. They started on August 11, set a quit
   date a week later, rode out an urge every few days, slipped once in September (lonely, late at night) and kept going, checked in every evening and
   did a lesson now and then. Every value is fixed, so every shot is the same each time. Nothing here is anyone's real data. */
import { defaultSettings, keepHard, logicalKey, normDay, normSettings, riskToKeep, type Days } from '@daybook/core';

import { DEMO } from './config';

const key = (d: Date) => d.toISOString().slice(0, 10);
const day = (s: string, n: number) => {
  const d = new Date(s + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return key(d);
};

/** the device's storage as the app would find it (key to JSON text), for the demo person, seen at the moment at (ms).
    theme: the app's theme choice */
export function demoStorage(at: number, theme: 'light' | 'dark' | 'auto' = 'light'): Record<string, string> {
  const start = '2026-08-11';
  const st = {
    ...defaultSettings(start),
    day1: '2026-08-18',
    becoming: 'I am someone who keeps my word to myself.',
    reasons: ['Being fully present with the people I love', 'Clear mornings and steady energy'],
    menu: ['A brisk two-minute walk', 'Cold water on my face', 'Text a friend', 'Ten pushups'],
    u: 1792194562327,
  };
  const o: Record<string, unknown> = { 'daybook:settings': st };
  const lessons = ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8', 'l9', 'l10', 'l11', 'l12', 'l13', 'l14'];
  /* a lesson looked at again on four days this week, so the ring of lesson days on Today is part lit */
  const RECENT = ['2026-10-12', '2026-10-13', '2026-10-15', '2026-10-16'];
  let id = 0;
  const ev = (time: string, outcome: 'rode' | 'slipped', trigger: string) => ({
    id: 'e' + ++id,
    time,
    outcome,
    trigger,
    paused: outcome === 'rode',
    did: outcome === 'rode' ? ['Went for a walk'] : null,
    recovered: false,
    note: '',
  });
  for (let i = 0; ; i++) {
    const d = day(start, i);
    if (d >= DEMO.day) break;
    const events = [];
    if (i % 3 === 0) events.push(ev('21:30', 'rode', i % 2 ? 'Stressed' : 'Bored'));
    /* the one slip, with the feeling named before it and after it (the studio opens its comeback pages on it) */
    if (d === '2026-09-12') events.push({ ...ev('23:50', 'slipped', 'Lonely'), id: 'slip', fb: 'Lonely', fa: 'flat' });
    o['daybook:days/' + d] = {
      d,
      events,
      checkin: { m: 6 + (i % 4), c: 6, e: 6 + (i % 3), s: 4 - (i % 3), h: 7, so: 'Y', ro: 'N', n: '', done: true, at: 0 },
      p: {
        w: [],
        wd: i % 2 === 0,
        r: false,
        c: i % 3,
        m: false,
        tl: [],
        po: null,
        ls: i % 4 === 0 && lessons.length ? [lessons.shift()] : [],
        lv: RECENT.includes(d) ? ['l2'] : [],
        ov: {},
      },
      u: 1,
    };
  }
  /* the hard hours already passed are kept, as the app would have kept them the evening they passed, so no note pops up */
  const sn = normSettings(st);
  let days: Days = {};
  for (const k in o) if (k.startsWith('daybook:days/')) days[k.slice(13)] = normDay(o[k], k.slice(13));
  const tk = logicalKey(at, sn.rollover);
  for (let x = riskToKeep(days, sn, tk, at), n = 0; x && n < 4; x = riskToKeep(days, sn, tk, at), n++) days = keepHard(days, x.k, x.r.win.start, at);
  const out: Record<string, string> = { 'daybook:settings': JSON.stringify(st) };
  for (const k in days) out['daybook:days/' + k] = JSON.stringify(days[k]);
  if (theme !== 'auto') out['daybook.theme'] = theme;
  /* the app was already opened today, so "How are you feeling today?" does not cover the shot (lib/day-open.ts) */
  out['daybook.dayOpen'] = tk;
  return out;
}
