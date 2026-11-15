/* The app that pulls you in (Screen Time): the saved choices, the night from the morning set, loosen slowly and tighten at once,
   what is held when, the quiet after a slip, the words, and which note goes for which threshold. */
import { describe, expect, it } from 'vitest';
import { addEvent } from '../src/mutate';
import { defaultSettings } from '../src/legacy/core.js';
import {
  normPull,
  PULL_DEFAULTS,
  pullBridge,
  pullDownEvent,
  pullDrift,
  pullLine,
  pullNoteFor,
  pullCounts,
  pullDownsFill,
  pullNudges,
  PULL_COUNT_GAP,
  pullPauseWords,
  pullPlanLine,
  pullQuietUntil,
  pullShield,
  pullChange,
  pullEarly,
  pullGuard,
  pullInNight,
  pullLiftUntil,
  pullNightHeld,
  pullNightOf,
  pullNightStart,
  pullNextStart,
  pullSettle,
  pullShown,
  PULL_NIGHT_END,
  pullListNew,
  pullListName,
  pullSetupSay,
  pullMark,
  pullParts,
  pullTrouble,
  pullArmNow,
  pullHoldStart,
  PULL_MAX_APPS,
  PULL_MIN_SCHEDULE,
  PULL_HEARTBEAT,
} from '../src/pull';
import { lowWords, partDone } from '../src/flame-low';
import { nightAtStart, NIGHT_TIMES } from '../src/morning-set';
import type { Clock, Days, Settings } from '../src/types';

const st = { ...defaultSettings('2026-10-01'), rollover: 4 } as Settings;
const at = (s: string) => new Date(s).getTime();
const slip = (days: Days, k: string, time: string) => addEvent(days, k, 'slipped', time, {}, 1).days;
describe('the choices', () => {
  it('reads anything safely', () => {
    expect(normPull(null)).toEqual(PULL_DEFAULTS);
    expect(normPull({ on: true, long: 7, opened: 4, lift: 9, asked: 'x', early: { k: 'x', at: '21:00' } })).toEqual({ ...PULL_DEFAULTS, on: true });
    expect(PULL_DEFAULTS).toMatchObject({ adult: true, lift: 15, opened: 10, lists: [{ id: 'a', name: 'Apps', wait: 10 }] });
    /* lists: known ids once each, known names and waits */
    expect(
      normPull({
        lists: [
          { id: 'b', name: 'Games', wait: 30 },
          { id: 'b', name: 'Social', wait: 5 },
          { id: 'z', name: 'Games', wait: 5 },
          { id: 'c', name: 'my secret', wait: 7 },
        ],
      }).lists,
    ).toEqual([
      { id: 'b', name: 'Games', wait: 30 },
      { id: 'c', name: 'Social', wait: 10 },
    ]);
    expect(normPull({ lists: [] }).lists).toEqual(PULL_DEFAULTS.lists);
  });
  it('the one pick from before the lists is list one, with its wait; the wait off is No wait', () => {
    expect(normPull({ on: true, feeds: true, wait: 30, open: 3 }).lists).toEqual([{ id: 'a', name: 'Apps', wait: 30 }]);
    expect(normPull({ on: true, feeds: false, wait: 30 }).lists).toEqual([{ id: 'a', name: 'Apps', wait: 0 }]);
    expect(normPull({ on: true, pause: true }).lists[0].wait).toBe(10);
    expect(normPull({ on: true, pause: false }).lists[0].wait).toBe(0);
    expect(normPull({ on: true, pause: false, feeds: true }).lists[0].wait).toBe(10);
  });
  it('keeps a looser choice waiting for the morning, and nothing it does not know', () => {
    const p = normPull({ on: true, later: { p: { lift: 5, wait: 7, adult: false, on: false }, at: 99 } });
    expect(p.later).toEqual({ p: { lift: 5, adult: false }, at: 99 });
    expect(normPull({ later: { p: { wait: 7 }, at: 99 } }).later).toBeUndefined();
    expect(normPull({ later: { p: { lists: [{ id: 'a', wait: 5 }] }, at: 99 } }).later).toEqual({
      p: { lists: [{ id: 'a', name: 'Social', wait: 5 }] },
      at: 99,
    });
  });
  it('a new list takes the next free id and name, up to three', () => {
    const one = normPull({ on: true });
    expect(pullListNew(one)).toEqual({ id: 'b', name: 'Social', wait: 10 });
    const three = normPull({ on: true, lists: [{ id: 'a' }, { id: 'b', name: 'Social' }, { id: 'c', name: 'Games' }] });
    expect(pullListNew(three)).toBeNull();
    expect(pullListName(three.lists)).toBe('Videos');
    /* a list removed at night keeps its id until the morning: a new one never reuses it */
    const gone = pullChange(three, { lists: three.lists.filter((l) => l.id !== 'c') }, at('2026-10-12T23:00')).prefs;
    expect(pullListNew(gone)).toBeNull();
  });
});

describe('the line in Settings', () => {
  it('says what it does now, plainly', () => {
    expect(pullLine(PULL_DEFAULTS)).toBe('Off · a short wait before the apps that pull you in');
    const off = [{ id: 'a' as const, name: 'Apps', wait: 0 as const }];
    expect(pullLine({ ...PULL_DEFAULTS, on: true })).toBe('A 10-second wait · adult sites wait all day');
    expect(pullLine({ ...PULL_DEFAULTS, on: true, lists: [{ id: 'a', name: 'Apps', wait: 60 }] }, false)).toBe('A one-minute wait');
    expect(
      pullLine({
        ...PULL_DEFAULTS,
        on: true,
        lists: [
          { id: 'a', name: 'Apps', wait: 5 },
          { id: 'b', name: 'Games', wait: 30 },
        ],
      }),
    ).toBe('2 lists wait · adult sites wait all day');
    expect(pullLine({ ...PULL_DEFAULTS, on: true, lists: off, adult: false })).toBe('A note after 2 hours');
    expect(pullLine({ ...PULL_DEFAULTS, on: true, lists: off, adult: false, long: 0, hard: false })).toBe('On · every wait off');
  });
});

/* the phone's clock is America/Chicago in the tests; 2026-10-12 is a Monday */
const morning = (r: string, nt: string, k = '2026-10-12') =>
  ({ [k]: { p: { ms: { at: at(k + 'T07:40'), r, nt, set: at(k + 'T07:40') } } } }) as unknown as Days;

describe('the night', () => {
  const on = normPull({ on: true });
  it('starts at the morning set time and ends at 6 AM', () => {
    const d = morning('For my future', '23:00');
    expect(pullNightStart(d, st, on, at('2026-10-12T12:00'))).toBe('23:00');
    expect(pullInNight(at('2026-10-12T22:59'), '23:00')).toBe(false);
    expect(pullInNight(at('2026-10-12T23:00'), '23:00')).toBe(true);
    expect(pullInNight(at('2026-10-13T05:59'), '23:00')).toBe(true);
    expect(pullInNight(at('2026-10-13T06:00'), '23:00')).toBe(false);
    expect(pullInNight(at('2026-10-13T00:40'), '01:00')).toBe(false);
    expect(pullInNight(at('2026-10-13T01:00'), '01:00')).toBe(true);
    expect(PULL_NIGHT_END).toBe('06:00');
  });
  it('carries the last morning, or the starting time when none was ever set', () => {
    expect(pullNightStart({}, st, on, at('2026-10-12T12:00'))).toBe(nightAtStart(st));
    expect(pullNightStart(morning('x', '21:30', '2026-10-10'), st, on, at('2026-10-12T12:00'))).toBe('21:30');
  });
  it('a night after midnight belongs to the evening it started', () => {
    expect(pullNightOf(at('2026-10-13T01:30'))).toBe('2026-10-12');
    expect(pullNightOf(at('2026-10-13T05:59'))).toBe('2026-10-12');
    expect(pullNightOf(at('2026-10-13T06:00'))).toBe('2026-10-13');
  });
  it('can start earlier tonight, never later, and only that night', () => {
    const d = morning('x', '23:00');
    const now = at('2026-10-12T15:00');
    const e = pullEarly(on, d, st, '21:30', now);
    expect(e.early).toEqual({ k: '2026-10-12', at: '21:30' });
    expect(pullNightStart(d, st, e, now)).toBe('21:30');
    expect(pullNightStart(d, st, e, at('2026-10-13T15:00'))).toBe('23:00');
    expect(pullEarly(e, d, st, '23:30', now).early).toBeUndefined();
  });
  it('an early start holds after midnight when the morning chose a time after midnight', () => {
    const d = morning('x', '00:30');
    const e = pullEarly(on, d, st, '22:00', at('2026-10-12T15:00'));
    expect(pullNightStart(d, st, e, at('2026-10-13T00:10'))).toBe('22:00');
    expect(pullInNight(at('2026-10-13T00:10'), pullNightStart(d, st, e, at('2026-10-13T00:10')))).toBe(true);
  });
  it('between midnight and 6 AM, the schedules already follow this evening (set by a morning before 6)', () => {
    const d = { ...morning('a', '22:00', '2026-10-12'), ...morning('b', '23:30', '2026-10-13') };
    expect(pullNightStart(d, st, on, at('2026-10-13T05:00'))).toBe('22:00');
    expect(pullNextStart(d, st, on, at('2026-10-13T05:00'))).toBe('23:30');
  });
  it('Lift every wait now: until tonight by day, until 6 AM at night', () => {
    expect(pullLiftUntil(at('2026-10-12T15:00'), '22:30')).toBe(at('2026-10-12T22:30'));
    expect(pullLiftUntil(at('2026-10-12T23:00'), '22:30')).toBe(at('2026-10-13T06:00'));
    expect(pullLiftUntil(at('2026-10-13T02:00'), '22:30')).toBe(at('2026-10-13T06:00'));
    expect(pullLiftUntil(at('2026-10-12T15:00'), '00:30')).toBe(at('2026-10-13T00:30'));
  });
});

describe('loosen slowly, tighten at once', () => {
  const on = normPull({ on: true });
  const night = at('2026-10-12T23:10');
  const L = (wait: 0 | 5 | 10 | 30 | 60, id: 'a' | 'b' | 'c' = 'a', name = 'Apps') => ({ id, name, wait });
  it('a stricter choice works now, any time', () => {
    const r = pullChange({ ...on, lift: 5 }, { lift: 30, lists: [L(60)] }, night);
    expect(r.held).toBeNull();
    expect(r.prefs).toMatchObject({ lift: 30, lists: [L(60)] });
    expect(r.prefs.later).toBeUndefined();
  });
  it('a looser one at night waits for 6 AM, and says when', () => {
    const r = pullChange(on, { adult: false, lift: 5, lists: [L(5)] }, night);
    expect(r.held).toBe(at('2026-10-13T06:00'));
    expect(r.prefs).toMatchObject({ adult: true, lift: 15, lists: [L(10)] });
    expect(r.prefs.later).toEqual({ p: { adult: false, lift: 5, lists: [L(5)] }, at: at('2026-10-13T06:00') });
    expect(pullShown(r.prefs)).toMatchObject({ adult: false, lift: 5, lists: [L(5)] });
    expect(pullSettle(r.prefs, at('2026-10-13T05:59'))).toBe(r.prefs);
    expect(pullSettle(r.prefs, at('2026-10-13T06:00'))).toMatchObject({ adult: false, lift: 5, lists: [L(5)] });
    expect(pullSettle(r.prefs, at('2026-10-13T06:00')).later).toBeUndefined();
  });
  it('in the afternoon it waits too: tonight keeps what the morning set', () => {
    expect(pullChange(on, { lists: [L(0)] }, at('2026-10-12T15:00')).held).toBe(at('2026-10-13T06:00'));
  });
  it('in the morning it works now', () => {
    const r = pullChange(on, { lists: [L(0)] }, at('2026-10-12T08:00'));
    expect(r.held).toBeNull();
    expect(r.prefs.lists).toEqual([L(0)]);
  });
  it('lists one by one: a new list, a longer wait and a new name work now; a removed list or a shorter wait waits', () => {
    const two = pullChange(on, { lists: [L(10), L(30, 'b', 'Games')] }, night);
    expect(two.held).toBeNull();
    expect(two.prefs.lists).toEqual([L(10), L(30, 'b', 'Games')]);
    /* list a renamed and shorter, list b gone: a keeps its 10 seconds under the new name, b keeps waiting, until 6 AM */
    const r = pullChange(two.prefs, { lists: [L(5, 'a', 'Social')] }, night);
    expect(r.held).toBe(at('2026-10-13T06:00'));
    expect(r.prefs.lists).toEqual([L(10, 'a', 'Social'), L(30, 'b', 'Games')]);
    expect(pullShown(r.prefs).lists).toEqual([L(5, 'a', 'Social')]);
    expect(pullSettle(r.prefs, at('2026-10-13T06:00')).lists).toEqual([L(5, 'a', 'Social')]);
    /* a list with No wait goes at once: nothing of it was waiting */
    const open = pullChange({ ...on, lists: [L(10), L(0, 'b')] }, { lists: [L(10)] }, night);
    expect(open.held).toBeNull();
    expect(open.prefs.lists).toEqual([L(10)]);
    /* asking for what holds now takes a waiting list change back */
    expect(pullChange(r.prefs, { lists: [L(10, 'a', 'Social'), L(30, 'b', 'Games')] }, night).prefs.later).toBeUndefined();
  });
  it('choosing what holds now takes a waiting one back', () => {
    const r = pullChange(on, { lift: 5 }, night);
    const back = pullChange(r.prefs, { lift: 15 }, night);
    expect(back.prefs.later).toBeUndefined();
    expect(back.held).toBeNull();
  });
  it('a stricter choice replaces a waiting looser one', () => {
    const r = pullChange(on, { lift: 5 }, night);
    const p = pullChange(r.prefs, { lift: 30 }, night).prefs;
    expect(p.lift).toBe(30);
    expect(p.later).toBeUndefined();
  });
  it('turning off, the notes, and everything before Screen Time is on work now', () => {
    const r = pullChange(on, { on: false, hard: false, long: 0 }, night);
    expect(r.prefs).toMatchObject({ on: false, hard: false, long: 0 });
    expect(pullChange(PULL_DEFAULTS, { adult: false }, night).prefs.adult).toBe(false);
  });
});

describe('what is held right now', () => {
  const on = normPull({ on: true });
  type H = { lift: number; open: Partial<Record<'a' | 'b' | 'c', number>>; web: number };
  const none: H = { lift: 0, open: {}, web: 0 };
  const g = (now: number, o: Partial<H> = {}, p = on, adult = true) => pullGuard(p, { adult, from: '22:30', holds: { ...none, ...o }, now });
  const two = {
    ...on,
    lists: [
      { id: 'a' as const, name: 'Apps', wait: 10 as const },
      { id: 'b' as const, name: 'Games', wait: 30 as const },
    ],
  };
  it('the apps and adult sites wait all day', () => {
    expect(g(at('2026-10-12T12:00'))).toEqual({ apps: { a: true }, web: true });
    expect(g(at('2026-10-12T23:00'))).toEqual({ apps: { a: true }, web: true });
  });
  it('the minutes opened after each wait open only that list, and Lift every wait now', () => {
    const t = at('2026-10-12T23:00');
    expect(g(t, { open: { a: t + 60_000 } }, two)).toEqual({ apps: { a: false, b: true }, web: true });
    expect(g(t, { web: t + 60_000 })).toEqual({ apps: { a: true }, web: false });
    expect(g(t, { lift: t + 600_000 }, two)).toEqual({ apps: { a: false, b: false }, web: false });
    expect(g(t + 600_000, { lift: t + 600_000 })).toEqual({ apps: { a: true }, web: true });
    /* a callback a few seconds early still ends it */
    expect(g(t + 590_000, { lift: t + 600_000 }).apps.a).toBe(true);
  });
  it('nothing for a habit other than porn, a list with No wait, or with the choices off', () => {
    const t = at('2026-10-12T23:00');
    expect(g(t, {}, on, false).web).toBe(false);
    expect(g(t, {}, { ...on, lists: [{ id: 'a', name: 'Apps', wait: 0 }], adult: false })).toEqual({ apps: { a: false }, web: false });
    expect(g(t, {}, PULL_DEFAULTS)).toEqual({ apps: { a: false }, web: false });
  });
  it('reads a night as held only once the morning came with the waits still on', () => {
    const rec = { '2026-10-11': 1, '2026-10-12': 3, '2026-10-13': 2 };
    expect(pullNightHeld(rec, '2026-10-11')).toBe('started');
    expect(pullNightHeld(rec, '2026-10-12')).toBe('held');
    expect(pullNightHeld(rec, '2026-10-13')).toBe('through');
    expect(pullNightHeld(null, '2026-10-12')).toBeNull();
  });
  it('a night gone through stays gone through; held only follows a night that started', () => {
    expect(pullMark(undefined, 1)).toBe(1);
    expect(pullMark(1, 3)).toBe(3);
    expect(pullMark(undefined, 3)).toBeUndefined();
    expect(pullMark(2, 3)).toBe(2);
    expect(pullMark(2, 1)).toBe(2);
    expect(pullMark(3, 2)).toBe(2);
    expect(pullMark(3, 1)).toBe(3);
  });
});

describe('Apple’s schedules for the night', () => {
  const m = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5);
  it('a night before midnight: its evening part, after midnight, a heartbeat after the start, and the morning check', () => {
    expect(pullParts('22:30')).toEqual([
      { n: 'pull.night.a', a: m('22:30'), b: m('23:59'), ev: true },
      { n: 'pull.night.b', a: 0, b: m('06:00'), ev: true },
      { n: 'pull.night.h', a: m('22:35'), b: m('22:50'), ev: false },
      { n: 'pull.morning', a: m('06:05'), b: m('06:20'), ev: false },
    ]);
  });
  it('a night that starts after midnight is one part', () => {
    expect(pullParts('01:00').map((x) => [x.n, x.a, x.b])).toEqual([
      ['pull.night.b', 60, 360],
      ['pull.night.h', 65, 80],
      ['pull.morning', 365, 380],
    ]);
  });
  it('every time the morning can choose is covered from its start minute, inside one day, at least 15 minutes each', () => {
    for (const t of NIGHT_TIMES) {
      const parts = pullParts(t);
      for (const x of parts) {
        expect(x.b - x.a).toBeGreaterThanOrEqual(PULL_MIN_SCHEDULE);
        expect(x.b).toBeLessThanOrEqual(23 * 60 + 59);
      }
      /* something starts at the night's own start minute, with a heartbeat a few minutes later */
      expect(parts.some((x) => x.a === m(t) && x.n !== 'pull.night.h')).toBe(true);
      expect(parts.some((x) => x.n === 'pull.night.h' && x.a === m(t) + PULL_HEARTBEAT)).toBe(true);
    }
  });
  it('a start too late for an evening part leaves the night to midnight and to the app (Good night arms it at once)', () => {
    expect(pullParts('23:50').map((x) => x.n)).toEqual(['pull.night.b', 'pull.morning']);
  });
  it('rides in the bridge', () => {
    expect(pullBridge({}, st, normPull({ on: true }), at('2026-10-12T21:00')).parts).toEqual(pullParts(st.screensOff as Clock));
  });
});

describe('when it is not working', () => {
  const on = normPull({ on: true });
  const ok = { status: 'approved' as const, failed: [], decodeFail: false, apps: 3 };
  it('says nothing when it works or is off', () => {
    expect(pullTrouble(on, ok)).toBeNull();
    expect(pullTrouble(normPull(null), { ...ok, status: 'notDetermined' })).toBeNull();
    expect(pullTrouble(on, null)).toBeNull();
  });
  it('names each failure and the one tap that fixes it, in plain words', () => {
    expect(pullTrouble(on, { ...ok, status: 'notDetermined' })?.fix).toBe('ask');
    expect(pullTrouble(on, { ...ok, apps: PULL_MAX_APPS + 1 })?.fix).toBe('pick');
    expect(pullTrouble(on, { ...ok, decodeFail: true })?.fix).toBe('pick');
    expect(pullTrouble(on, { ...ok, failed: ['pull.night.a'] })?.fix).toBe('retry');
    for (const h of [{ status: 'denied' as const }, { apps: 60 }, { decodeFail: true }, { failed: ['x'] }]) {
      const t = pullTrouble(on, { ...ok, ...h });
      expect(t?.line).toMatch(/^Screen Time is not working: /);
      expect(t?.line).not.toMatch(/n't|'s /);
    }
    expect(pullTrouble(on, { ...ok, apps: PULL_MAX_APPS })).toBeNull();
  });
});

describe('Good night, and loosen slowly for the start itself', () => {
  const on = normPull({ on: true });
  const s2 = { ...st, screensOff: '22:30' } as Settings;
  it('Good night starts the night now, for tonight only', () => {
    const p = pullArmNow(on, {}, s2, at('2026-10-12T21:40'));
    expect(p.early).toEqual({ k: '2026-10-12', at: '21:40' });
    expect(pullNightStart({}, s2, p, at('2026-10-12T21:41'))).toBe('21:40');
    expect(pullNightStart({}, s2, p, at('2026-10-13T21:41'))).toBe('22:30');
  });
  it('after midnight, before a late start, it is the night still running', () => {
    const late = { ...s2, screensOff: '01:00' } as Settings;
    const p = pullArmNow(on, {}, late, at('2026-10-13T00:30'));
    expect(p.early).toEqual({ k: '2026-10-12', at: '00:30' });
    expect(pullInNight(at('2026-10-13T00:31'), pullNightStart({}, late, p, at('2026-10-13T00:31')))).toBe(true);
  });
  it('a start already earlier is kept', () => {
    expect(pullArmNow(on, {}, s2, at('2026-10-12T23:00'))).toBe(on);
  });
  it('a later sleep time in the evening waits for the morning; in the morning it works at once', () => {
    const t = at('2026-10-12T21:00');
    const p1 = pullHoldStart(on, {}, s2, t);
    expect(p1.armed).toEqual({ k: '2026-10-12', at: '22:30' });
    expect(pullHoldStart(p1, {}, s2, t + 60_000)).toBe(p1);
    const later = { ...s2, screensOff: '23:30' } as Settings;
    const p2 = pullHoldStart(p1, {}, later, t + 60_000);
    expect(pullNightStart({}, later, p2, t + 60_000)).toBe('22:30');
    expect(pullNightStart({}, later, p2, at('2026-10-13T01:00'))).toBe('22:30');
    /* the next night is the new time; changed in the morning, it works for tonight */
    expect(pullNightStart({}, later, pullHoldStart(p2, {}, later, at('2026-10-13T08:00')), at('2026-10-13T08:00'))).toBe('23:30');
  });
  it('an earlier start works at once, and is then the one held', () => {
    const p1 = pullHoldStart(on, {}, s2, at('2026-10-12T21:00'));
    const early = { ...s2, screensOff: '22:00' } as Settings;
    const p2 = pullHoldStart(p1, {}, early, at('2026-10-12T21:01'));
    expect(p2.armed?.at).toBe('22:00');
    expect(pullNightStart({}, early, p2, at('2026-10-12T21:01'))).toBe('22:00');
  });
  it('is kept through a save', () => {
    const p = pullHoldStart(on, {}, s2, at('2026-10-12T21:00'));
    expect(normPull(JSON.parse(JSON.stringify({ ...p, lost: true })))).toMatchObject({ armed: p.armed, lost: true });
  });
});

describe('the quiet after a slip', () => {
  it('runs to the first 8 AM at least three hours later', () => {
    const d = slip({}, '2026-10-12', '23:30');
    expect(pullQuietUntil(d, st, at('2026-10-12T23:40'))).toBe(at('2026-10-13T08:00'));
    expect(pullQuietUntil(d, st, at('2026-10-13T08:01'))).toBeNull();
  });
  it('after a morning slip, holds through the night', () => {
    const d = slip({}, '2026-10-12', '07:00');
    expect(pullQuietUntil(d, st, at('2026-10-12T22:00'))).toBe(at('2026-10-13T08:00'));
  });
  it('is none with no slip', () => {
    expect(pullQuietUntil({}, st, at('2026-10-12T22:00'))).toBeNull();
  });
});

describe('the words', () => {
  const t = { r: 'For my future family', rAt: at('2026-10-12T07:40'), today: true };
  const all = () => {
    const n = pullNudges({ lessonUrl: '/lesson/l4', long: 2 });
    const p = (['day', 'night', 'long'] as const).flatMap((mode) => [true, false].map((quiet) => pullPauseWords({ mode, quiet, plan: null, tonight: t })));
    const s = [true, false].flatMap((night) => [true, false].map((quiet) => pullShield({ night, wait: 10, plan: null, tonight: t, quiet })));
    return [
      ...Object.values(n).flatMap((x) => [x.t, x.b, x.bDowns ?? '']),
      ...p.flatMap((x) => Object.values(x)),
      ...s.flatMap((x) => Object.values(x)),
    ].filter((x): x is string => typeof x === 'string');
  };
  it('has no contractions, and never names the habit or an app', () => {
    for (const w of all()) {
      expect(w).not.toMatch(/\b\w+'(t|s|re|ll|ve|m|d)\b/);
      expect(w).not.toMatch(/porn|instagram|tiktok|addict/i);
    }
  });
  it('never puts the person reason on a locked screen', () => {
    for (const x of Object.values(pullNudges({ lessonUrl: '/', long: 2 }))) expect(x.t + x.b).not.toMatch(/future family/);
  });
  it('carries the stakes, except in the quiet after a slip', () => {
    const n = pullNudges({ lessonUrl: '/', long: 2 });
    expect(n.hard1.b).toMatch(/dimming your fire/);
    expect(n.long.b).toMatch(/dimming your fire/);
    expect(n.quiet.b).not.toMatch(/dimming|choice/);
    expect(pullPauseWords({ mode: 'night', quiet: true, plan: null }).line).not.toMatch(/fire|choice/);
    expect(pullShield({ night: true, wait: 10, plan: null, tonight: t, quiet: true }).sub).not.toMatch(/fire/);
  });
  it('the long wait says the stake before the choice, and never in the quiet after a slip', () => {
    expect(pullPauseWords({ mode: 'long', night: true, quiet: false, plan: null, tonight: t }).stake).toBe(
      'Open them, and tonight goes in the week as a night you went through.',
    );
    expect(pullPauseWords({ mode: 'long', night: true, quiet: true, plan: null, tonight: t }).stake).toBeNull();
    /* Open on the night's short wait counts as gone through too (WP2), so it says so before the choice; never by day */
    expect(pullPauseWords({ mode: 'night', quiet: false, plan: null, tonight: t }).stake).toBe(
      'Open it, and tonight goes in the week as a night you went through.',
    );
    expect(pullPauseWords({ mode: 'night', quiet: true, plan: null, tonight: t }).stake).toBeNull();
    /* sleep care's line for the person lying awake: at night only */
    expect(pullPauseWords({ mode: 'night', quiet: true, plan: null, tonight: t }).awake).toBe(
      'Awake after 20 minutes? Get up, leave the phone, come back sleepy.',
    );
    expect(pullPauseWords({ mode: 'day', quiet: false, plan: null }).awake).toBeNull();
    expect(pullPauseWords({ mode: 'long', night: true, quiet: false, plan: null, tonight: t }).open).toBe('Open them for');
    /* adult sites wait all day: by day the long wait has no night words and no stake */
    expect(pullPauseWords({ mode: 'long', night: false, quiet: false, plan: null, tonight: t })).toMatchObject({
      title: 'A long wait first',
      open: 'Open them for',
      stake: null,
      awake: null,
    });
    expect(pullShield({ night: false, wait: 10, plan: null, tonight: null, quiet: false, long: 15 })).toMatchObject({
      title: 'A long wait first',
      primary: 'Wait 15 minutes',
    });
    expect(pullShield({ night: false, wait: 10, plan: null, tonight: null, quiet: false, long: 1 }).primary).toBe('Wait 1 minute');
  });
  it('shows the morning at night: the reason, quoted with when it was chosen', () => {
    const w = pullPauseWords({ mode: 'night', quiet: false, plan: null, tonight: t });
    expect(w.title).toBe('You set this up this morning.');
    expect(w.line).toBe('You, at 7:40 AM: “For my future family”');
    expect(w.down).toBe('Put it down and go to bed');
    expect(pullPauseWords({ mode: 'night', quiet: false, plan: null, tonight: { ...t, today: false } }).title).toBe('You set this up for tonight.');
    expect(pullPauseWords({ mode: 'night', quiet: false, plan: null, tonight: null }).line).toMatch(/Put the phone down/);
    const sh = pullShield({ night: true, wait: 30, plan: null, tonight: t, quiet: false });
    expect(sh).toMatchObject({ title: 'You set this up this morning', primary: 'Wait 30 seconds', secondary: 'Close' });
    expect(sh.sub).toMatch(/^“For my future family” /);
  });
  it('by day, a short wait in plain words', () => {
    const w = pullPauseWords({ mode: 'day', quiet: false, plan: null });
    expect(w).toMatchObject({ title: 'A short wait first', down: 'Put it down', open: 'Open it for', stake: null });
    expect(pullShield({ night: false, wait: 60, plan: null, tonight: t, quiet: false })).toMatchObject({
      title: 'A short wait first',
      primary: 'Wait 1 minute',
    });
  });
  it('says the put-downs as the next choice, never as who the person is', () => {
    const n = pullNudges({ lessonUrl: '/', long: 2 });
    expect(n.hard1.b).not.toMatch(/gets you/);
    expect(pullDownsFill(n.hard1.bDowns!, 6)).toBe(
      'You have put it down 6 times. You are dimming your fire now. Make it 7: stand up and walk to another room.',
    );
    expect(pullDownsFill(pullShield({ night: false, wait: 10, plan: null, tonight: null, quiet: false }).subDowns, 1)).toBe(
      'You have put it down once. Close it, and that makes 2.',
    );
    expect(pullPauseWords({ mode: 'night', quiet: false, plan: null, downs: 7 }).thanks).toBe('That makes 7. One more win in your log.');
    expect(pullPauseWords({ mode: 'night', quiet: true, plan: null, downs: 7 }).thanks).not.toMatch(/7/);
  });
  it('counts a put-down at most once in ten minutes', () => {
    const t0 = at('2026-10-12T22:00');
    expect(pullCounts(0, t0)).toBe(true);
    expect(pullCounts(t0, t0 + 9 * 60000)).toBe(false);
    expect(pullCounts(t0, t0 + PULL_COUNT_GAP * 60000)).toBe(true);
  });
  it('setup says what waits, and when', () => {
    expect(pullSetupSay({ porn: true, at: '22:30' })).toBe(
      'It usually starts with scrolling. Each feed will wait ten seconds before it opens, and adult sites wait 15 minutes, all day. You can lift it whenever you want.',
    );
    expect(pullSetupSay({ porn: false, at: '22:30' })).not.toMatch(/adult/);
  });
  it('counts the hours it says', () => {
    expect(pullNudges({ lessonUrl: '/', long: 1 }).long.t).toBe('🔥 An hour in');
  });
  it('quotes the person own plan', () => {
    const s = { ...st, plan: [{ when: 'I catch myself scrolling with no plan', then: 'Put the phone down and stand up.' }] } as Settings;
    expect(pullPlanLine(s)).toBe('Your plan: “Put the phone down and stand up.”');
    expect(pullShield({ night: true, wait: 10, plan: pullPlanLine(s), tonight: null, quiet: false }).sub).not.toMatch(/Your plan/);
    expect(pullShield({ night: false, wait: 10, plan: pullPlanLine(s), tonight: null, quiet: false }).sub).not.toMatch(/Your plan/);
    expect(pullPauseWords({ mode: 'night', quiet: false, plan: pullPlanLine(s) }).say).toMatch(/Your plan: “Put the phone down/);
    expect(pullPauseWords({ mode: 'day', quiet: false, plan: pullPlanLine(s) }).say).not.toMatch(/Your plan/);
    expect(pullPlanLine({ ...st, plan: [{ when: 'I am bored or idle', then: 'Walk.' }] } as Settings)).toBeNull();
  });
});

describe('which note goes', () => {
  const b = (o: Partial<ReturnType<typeof normPull>> = {}, days: Days = {}, now = at('2026-10-12T22:00')) =>
    pullBridge(days, st, { ...normPull({ on: true }), ...o }, now);
  const now = at('2026-10-12T23:15');
  it('long use: the lesson unless it was opened and done', () => {
    expect(pullNoteFor(b(), 'long', now, false)).toBe('long');
    expect(pullNoteFor({ ...b(), lessonDone: true }, 'long', now, true)).toBe('longDone');
    expect(pullNoteFor({ ...b(), lessonDone: true }, 'long', now, false)).toBe('long');
    expect(pullNoteFor(b({ long: 0 }), 'long', now, false)).toBeNull();
  });
  it('the night: two notes', () => {
    expect(pullNoteFor(b(), 1, now, true)).toBe('hard1');
    expect(pullNoteFor(b(), 2, now, true)).toBe('hard2');
    expect(pullNoteFor(b(), 3, now, true)).toBeNull();
    expect(pullNoteFor(b({ hard: false }), 1, now, true)).toBeNull();
  });
  it('after a slip: no stakes, one note to SOS, and long use is quiet', () => {
    const d = slip({}, '2026-10-12', '21:30');
    const q = b({}, d);
    expect(pullNoteFor(q, 1, now, true)).toBe('quiet');
    expect(pullNoteFor(q, 2, now, true)).toBeNull();
    expect(pullNoteFor(q, 'long', now, true)).toBeNull();
    expect(q.notes.quiet.url).toBe('/sos');
  });
});

describe('the bridge', () => {
  it('carries the night from the morning, the reason on the night shield, and adult sites only for porn', () => {
    const d = morning('For my future family', '23:00');
    const b = pullBridge(d, st, normPull({ on: true }), at('2026-10-12T21:00'));
    expect(b.night).toEqual({ from: '23:00', to: '06:00', next: '23:00' });
    expect(b.adult).toBe(true);
    expect(b.shieldNight.title).toBe('You set this up this morning');
    expect(b.shieldNight.sub).toMatch(/For my future family/);
    expect(b.shield.sub).not.toMatch(/future family/);
    const drink = { ...st, onb: { a: { habit: 'alcohol' } } } as unknown as Settings;
    expect(pullBridge(d, drink, normPull({ on: true }), at('2026-10-12T21:00')).adult).toBe(false);
  });
  it('after midnight, still the evening that started it', () => {
    const d = morning('For my future family', '23:00');
    expect(pullBridge(d, st, normPull({ on: true }), at('2026-10-13T01:00')).shieldNight.sub).toMatch(/For my future family/);
  });
  it('applies a looser choice whose morning has come, and passes one still waiting', () => {
    const p = pullChange(normPull({ on: true }), { lift: 5 }, at('2026-10-12T23:00')).prefs;
    expect(pullBridge({}, st, p, at('2026-10-12T23:01')).prefs.later?.p).toEqual({ lift: 5 });
    expect(pullBridge({}, st, p, at('2026-10-13T06:01')).prefs.lift).toBe(5);
    expect(pullBridge({}, st, p, at('2026-10-13T06:01')).prefs.later).toBeUndefined();
  });
});

describe('the notes ignored', () => {
  const k = '2026-10-12';
  const night = at('2026-10-12T23:40:00');
  const f0 = { step: 0, low: 0, idle: 0, was: 0, warn: false } as const;
  it('burns one step lower that night and the next day, until the part is done', () => {
    expect(pullDrift(f0, night, {}, st, k, night + 60_000)).toMatchObject({ step: 1, pull: true });
    expect(pullDrift(f0, night, {}, st, '2026-10-13', at('2026-10-13T12:00:00'))).toMatchObject({ step: 1 });
    expect(pullDrift(f0, night, {}, st, '2026-10-14', at('2026-10-14T12:00:00'))).toEqual(f0);
    const done: Days = { '2026-10-13': { p: { ls: ['l1'] } } } as unknown as Days;
    expect(pullDrift(f0, night, done, st, '2026-10-13', at('2026-10-13T12:00:00'))).toEqual(f0);
  });
  it('never in the hours after a slip, and never deeper than it already burns', () => {
    expect(pullDrift(f0, night, slip({}, k, '22:00'), st, k, night + 60_000)).toEqual(f0);
    const lower = { step: 3, low: 1, idle: 4, was: 3, warn: false } as const;
    expect(pullDrift(lower, night, {}, st, k, night + 60_000)).toEqual(lower);
    expect(pullDrift(f0, null, {}, st, k, night)).toEqual(f0);
  });
  it('says why in plain words', () => {
    expect(lowWords(pullDrift(f0, night, {}, st, k, night + 60_000))?.p).toBe('You stayed on it through your hard hours.');
  });
});

describe('Put it down', () => {
  it('logs an urge ridden out on the log day, after scrolling, by leaving the room', () => {
    const now = at('2026-10-14T01:30:00');
    const e = pullDownEvent({}, st, now)!;
    expect(e).toEqual({ key: '2026-10-13', time: '01:30', fields: { trigger: 'scroll', did: ['left'] } });
    const r = addEvent({}, e.key, 'rode', e.time, e.fields);
    expect(partDone(r.days, st, e.key)).toBe(true);
  });
  it('logs nothing again within the hour, or after an urge just ridden out elsewhere', () => {
    const now = at('2026-10-13T22:00:00');
    const e = pullDownEvent({}, st, now)!;
    const days = addEvent({}, e.key, 'rode', e.time, e.fields).days;
    expect(pullDownEvent(days, st, now + 30 * 60000)).toBeNull();
    expect(pullDownEvent(days, st, now + 61 * 60000)).not.toBeNull();
  });
  it('a slip in the hour does not stop it', () => {
    const now = at('2026-10-13T22:00:00');
    const days = addEvent({}, '2026-10-13', 'slipped', '21:40').days;
    expect(pullDownEvent(days, st, now)).not.toBeNull();
  });
});
