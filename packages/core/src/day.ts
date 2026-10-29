/* "Your day" on Today: the lesson, the evening check-in and the wind-down, and switching parts of one day on or off. Ported
   from the legacy pathHtml, stopStatus, windLine, doSaveCheckin and the Today actions (night-so, night-sleep, wind, rt-day,
   save-checkin). The morning stop ("Last night") was retired on October 23, 2026 (docs/plan.md, "Lessons first"): Good
   night counts as the phone going away, and as screens off on time when it comes before the screens-off time (phoneAway),
   and sleep is one optional question in the evening check-in, kept where the morning kept it (checkin.h). Checked by
   test/day.test.ts. */
import {
  addDays,
  blankP,
  diffDays,
  fmtClock,
  fmtDate,
  fmtLeft,
  HX_NEXT,
  isTime,
  LESSONS,
  minToClock,
  reachedOn,
  rhythm,
  RK_DAYS,
  ROUTINE_KEYS,
  streaks,
  sumDay,
  type RhythmStop,
} from './legacy/core.js';
import { hardDay, LEARN_LOCK, lessonOpen } from './accounts';
import { firstUndone, lessonNo, lessonsDone, lessonStop, lmin, reviewPick } from './lessons';
import { todayMeasure } from './graduate';
import { changeDay, withDay } from './mutate';
import type { Checkin, DayKey, Days, Play, Settings } from './types';

/** the short status on the right of a stop */
export function stopStatus(s: RhythmStop, windMin: number): string {
  if (s.state === 'done') return s.k === 'evening' ? 'Saved' : 'Done';
  const open = s.state === 'now';
  const late = s.state === 'due';
  if (s.k === 'lesson') return open ? 'Open now' : late ? 'Still open' : 'From ' + minToClock(s.start);
  if (s.k === 'evening') return open ? 'Open now' : late ? 'Still open' : 'Around 6 PM';
  return open ? 'Open now' : late ? 'Still open' : 'From ' + minToClock(windMin);
}

/** the one line at the top of the wind-down */
export function windLine(st: Settings, leftToOff: number, p: Play | null | undefined): string {
  const off = fmtClock(st.screensOff);
  const left = leftToOff;
  if (left > 0 && left <= 600) return `Screens off at ${off} · in ${fmtLeft(left)}`;
  if (left <= 0 && left > -300) return `Your screens-off time (${off}) has passed.${p && p.po ? '' : ' Phone away?'}`;
  return `Your screens-off time is ${off}. Change it in Settings.`;
}

/* ---------- the evening check-in ---------- */
export interface CheckinForm {
  m: number | null;
  c: number | null;
  e: number | null;
  s: number | null;
  /** hours slept the night before, optional (a draft from before sleep was asked has none: the saved hours stay) */
  h?: number | null;
  ro: 'Y' | 'N' | null;
  n: string;
}
/** the form, from what is saved (reached out is already Yes when today's log says so) */
export function checkinFormOf(days: Days, key: DayKey): CheckinForm {
  const d = days[key];
  const saved = d && d.checkin;
  const ro = reachedOn(d) ? 'Y' : null;
  return saved
    ? { m: saved.m, c: saved.c, e: saved.e, s: saved.s, h: saved.h, ro: saved.ro || ro, n: saved.n || '' }
    : { m: null, c: null, e: null, s: null, h: null, ro, n: '' };
}
/** hours of sleep as the check-in keeps them: half hours from 0 to 14 */
export const sleepHours = (h: number) => Math.min(14, Math.max(0, Math.round(h * 2) / 2));
const blankCheckin = (): Checkin => ({ m: null, c: null, e: null, s: null, h: null, so: null, ro: null, n: '', done: false, at: 0 });
/** saving keeps screens-off (from Good night), and sleep unless the form answers it */
export function saveCheckin(days: Days, key: DayKey, f: CheckinForm, now = Date.now()): Days {
  const day = changeDay(
    days[key],
    key,
    (d) => {
      const o = d.checkin || ({} as Partial<Checkin>);
      const h = f.h === undefined ? (o.h == null ? null : o.h) : f.h == null ? null : sleepHours(f.h);
      d.checkin = { m: f.m, c: f.c, e: f.e, s: f.s, h, so: o.so || null, ro: f.ro, n: (f.n || '').trim(), done: true, at: now };
    },
    now,
  );
  return withDay(days, key, day);
}
/** the word after saving the check-in */
export function checkinSaveText(days: Days, st: Settings, key: DayKey, tk: DayKey): string {
  const sk = streaks(days, st, tk);
  const s = sumDay(days[key]);
  const runs = !!st.day1 && key === tk && st.cleanMode !== 'step';
  if (s.slipped)
    return (
      'Saved. A slip is data, not a reset.' +
      (runs && sk.open && sk.open.k === tk
        ? ' Your run waits for you. The Rekindle quest saves it, any time until ' + fmtDate(addDays(tk, RK_DAYS), { weekday: 'long' }) + ' night.'
        : '')
    );
  /* what holds, not a run that can drop to zero: the same measure Today shows */
  const m = runs && key >= (st.day1 as string) ? todayMeasure(days, st, tk) : null;
  return m && m.n > 0 ? `Saved. ${m.n} ${m.of}.` : 'Saved.';
}
/** the summary line under a saved check-in */
export function checkinLine(days: Days, key: DayKey, c: Checkin): string {
  const d = days[key];
  return [
    c.h != null ? `Sleep ${c.h.toFixed(1)} h` : '',
    c.so ? `Screens off ${c.so === 'Y' ? 'on time' : 'late'}` : '',
    c.ro || reachedOn(d) ? `Reached out: ${c.ro === 'Y' || reachedOn(d) ? 'yes' : 'no'}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

/* ---------- a night, changed on its day's page ---------- */
/** screens off on time that night (Yes or No; the same answer again clears it) */
export function setScreensOff(days: Days, prev: DayKey, v: 'Y' | 'N', now = Date.now()): Days {
  const day = changeDay(
    days[prev],
    prev,
    (d) => {
      const c = d.checkin || (d.checkin = blankCheckin());
      c.so = c.so === v ? null : v;
    },
    now,
  );
  return withDay(days, prev, day);
}
/** hours slept, in half hours from 0 to 14, starting from 7 */
export function stepSleep(days: Days, tk: DayKey, dd: number, now = Date.now()): Days {
  const day = changeDay(
    days[tk],
    tk,
    (d) => {
      const c = d.checkin || (d.checkin = blankCheckin());
      c.h = Math.min(14, Math.max(0, Math.round(((c.h == null ? 7 : c.h) + dd) * 2) / 2));
    },
    now,
  );
  return withDay(days, tk, day);
}
/* ---------- lessons first ---------- */
/** the day's stops (legacy rhythm), with today's lesson always the open one until it is done (docs/plan.md, "Lessons
    first", C1): the lesson is Next up all day, and a check-in or wind-down that has started meanwhile still says "Open
    now". The legacy rhythm itself stays as it was (the golden tests read it). */
export function dayRhythm(days: Days, st: Settings, tk: DayKey, nowMs: number): ReturnType<typeof rhythm> {
  const r = rhythm(days, st, tk, nowMs);
  const ls = r.stops.find((x) => x.k === 'lesson');
  if (!ls || ls.done || r.cur === 'lesson') return r;
  const stops = r.stops.map((x) =>
    x.k === 'lesson'
      ? { ...x, state: x.started ? ('now' as const) : ('next' as const) }
      : x.k === r.cur && x.state === 'next'
        ? { ...x, state: 'later' as const }
        : x,
  );
  return { ...r, stops, cur: 'lesson' };
}

/* ---------- the stops of Your day, as tiles ---------- */
/* Each stop has the color of its full-screen moment (sky). The open one (cur) shows as a tile with a few words and its
   button; the others are one line each, a done one saying what was done. Every stop opens with one tap, at any time. */
export type StopGo = 'lesson' | 'checkin' | 'wind';
export interface StopTile {
  k: string;
  state: RhythmStop['state'];
  done: boolean;
  /** the open one, shown as a tile */
  cur: boolean;
  sky: 'sun' | 'sky' | 'violet' | 'night';
  ic: string;
  title: string;
  /** the one line of a row: what is waiting, or what was done */
  line: string;
  /** the status on the right of a row ("Around 6 PM"); empty when done */
  right: string;
  /* the tile */
  eyebrow: string;
  head: string;
  body: string;
  chips: string[];
  btn: string;
  go: StopGo;
  /** the lesson to open */
  id?: string;
}
const NAME: Record<string, string> = { lesson: 'Lesson', evening: 'Evening', night: 'Night' };
const low = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
export function stopTiles(days: Days, st: Settings, tk: DayKey, nowMs: number): { tiles: StopTile[]; cur: string | null; done: number } {
  const r = dayRhythm(days, st, tk, nowMs);
  const p = days[tk]?.p;
  const ls = lessonStop(days, st, tk);
  const tiles = r.stops.map((s): StopTile => {
    const status = stopStatus(s, r.windMin);
    const eyebrow =
      s.state === 'now'
        ? NAME[s.k] + ' · open now'
        : s.state === 'due'
          ? NAME[s.k] + ' · still open'
          : s.state === 'done'
            ? NAME[s.k] + ' · done'
            : 'Up next · ' + low(status);
    const base = { k: s.k, state: s.state, done: !!s.done, cur: s.k === r.cur, right: s.done ? '' : status, eyebrow };
    const pts = (k: string) => '+' + HX_NEXT[k].pts + ' points';
    if (s.k === 'lesson') {
      const L = ls.L;
      const tile = { ...base, sky: 'sky' as const, ic: 'book', title: 'Lesson', go: 'lesson' as const, id: L.id };
      if (ls.kind === 'read')
        return { ...tile, line: 'Read: ' + L.title, head: L.title, body: L.key, chips: [lmin(L)], btn: 'Open it again', eyebrow: 'Lesson · done' };
      if (ls.kind === 'next')
        return {
          ...tile,
          line: L.title + ' · ' + lmin(L),
          eyebrow: 'Lesson ' + ls.n + ' of ' + ls.total + (s.state === 'now' ? ' · open now' : s.state === 'due' ? ' · still open' : ' · ' + low(status)),
          head: L.title,
          body: L.tag,
          chips: [lmin(L), pts('lesson')],
          btn: 'Start',
        };
      return {
        ...tile,
        line: 'Read again: ' + L.title,
        eyebrow: 'Read again' + (s.state === 'next' || s.state === 'later' ? ' · ' + low(status) : ''),
        head: L.title,
        body: 'You have finished every lesson. A quick re-read keeps one fresh.',
        chips: [lmin(L), '+5 points'],
        btn: 'Read it again',
      };
    }
    if (s.k === 'evening') {
      const c = days[tk]?.checkin;
      const said = c && c.done ? [c.m != null ? 'Motivation ' + c.m : '', c.s != null ? 'Stress ' + c.s : ''].filter(Boolean).join(' · ') : '';
      return {
        ...base,
        sky: 'violet',
        ic: 'pencil',
        title: 'Check-in',
        line: s.done ? said || 'Saved' : 'Four numbers about today',
        head: 'How was today?',
        body: 'Four honest numbers and one line. Then the day is logged.',
        chips: [HX_NEXT.evening.s || '', pts('evening')],
        btn: 'Check in',
        go: 'checkin',
      };
    }
    return {
      ...base,
      sky: 'night',
      ic: 'moon',
      title: 'Wind-down',
      line: s.done ? (p && p.po ? 'Phone away at ' + fmtClock(p.po) : 'Wound down') : 'Screens off at ' + fmtClock(st.screensOff),
      head: 'Time to wind down',
      body: windLine(st, r.leftToOff, p),
      chips: [HX_NEXT.night.s || '', pts('night')],
      btn: 'Start the wind-down',
      go: 'wind',
    };
  });
  return { tiles, cur: r.cur, done: tiles.filter((t) => t.done).length };
}

/* ---------- the wind-down ---------- */
export function windToggle(days: Days, st: Settings, tk: DayKey, i: number, now = Date.now()): Days {
  const n = st.wind.length;
  return withDay(
    days,
    tk,
    changeDay(
      days[tk],
      tk,
      (d) => {
        const p = d.p || blankP();
        const k = p.w.indexOf(i);
        if (k >= 0) p.w.splice(k, 1);
        else p.w.push(i);
        p.w = p.w.filter((x) => x < n);
        p.wd = p.w.length >= n;
        d.p = p;
      },
      now,
    ),
  );
}
/** how long before the screens-off time Good night still counts as screens off on time: a nap in the afternoon does not */
export const OFF_EARLY_MIN = 6 * 60;
/** Good night at `at` (HH:MM) comes before the screens-off time, and within OFF_EARLY_MIN of it. Read on the log day's
    clock, so with screens off at 12:30 AM, 11:50 PM is on time and 1 AM is not. */
export function offOnTime(st: Pick<Settings, 'screensOff' | 'rollover'>, at: string): boolean {
  const roll = (st.rollover ?? 4) * 60;
  const rel = (t: string) => (((+t.slice(0, 2) * 60 + +t.slice(3, 5) - roll) % 1440) + 1440) % 1440;
  if (!isTime(at) || !isTime(st.screensOff)) return false;
  const left = rel(st.screensOff) - rel(at);
  return left >= 0 && left <= OFF_EARLY_MIN;
}
/** Good night: the phone goes away at `at` (p.po). With the settings, it is also screens off on time that night when it
    comes before the screens-off time (offOnTime), so the "Screens off on time" points, quest and Sunday goal count it.
    Nothing asks the next morning whether it stayed away, and a late Good night never writes "late". */
export function phoneAway(days: Days, tk: DayKey, at: string, now = Date.now(), st?: Settings | null): Days {
  return withDay(
    days,
    tk,
    changeDay(
      days[tk],
      tk,
      (d) => {
        const p = d.p || blankP();
        p.po = at;
        d.p = p;
        if (st && offOnTime(st, at)) (d.checkin || (d.checkin = blankCheckin())).so = 'Y';
      },
      now,
    ),
  );
}

/* ---------- one day's routine ---------- */
/** switch a part of today on or off. A choice that matches the usual routine is not kept. */
export function routineDay(days: Days, st: Settings, tk: DayKey, k: string, want: boolean, now = Date.now()): Days {
  if (ROUTINE_KEYS.indexOf(k) < 0) return days;
  const usual = !!st.routine[k];
  return withDay(
    days,
    tk,
    changeDay(
      days[tk],
      tk,
      (d) => {
        const p = d.p || blankP();
        const ov = { ...p.ov };
        if (want === usual) delete ov[k];
        else ov[k] = want;
        p.ov = ov;
        d.p = p;
      },
      now,
    ),
  );
}
/** how many parts of today differ from the usual routine */
export function routineChanged(st: Settings, p: Play | null | undefined): number {
  const ov = (p && p.ov) || {};
  return ROUTINE_KEYS.filter((k) => typeof ov[k] === 'boolean' && ov[k] !== !!st.routine[k]).length;
}

/* ---------- Next up, on the flame card ---------- */
export interface NextUp {
  n: number;
  done: number;
  k?: string;
  ic?: string;
  t?: string;
  s?: string;
  pts?: number;
  /** 'lesson' opens that lesson; 'next-go' opens that stop in Your day */
  act?: 'lesson' | 'next-go';
  v?: string;
  when?: string;
  pips?: ('on' | 'now' | '')[];
}
/** the part of the day that is open now, or the next one to open (legacy nextUp), today's lesson first until it is done
    (dayRhythm). Without an account (`account` false),
    a lesson that waits behind one is still offered, with "Sign up to unlock all the lessons for free" under it (the owner,
    October 23, 2026); on a slip day or the day after, Next up gives a re-read of a finished lesson instead. */
export function nextUp(days: Days, st: Settings, tk: DayKey, nowMs: number, account = true): NextUp {
  const r = dayRhythm(days, st, tk, nowMs);
  const n = r.stops.length;
  const done = r.stops.filter((s) => s.done).length;
  const s = r.stops.find((x) => x.k === r.cur);
  if (!s) return { n, done };
  const m = HX_NEXT[s.k];
  const o: NextUp = {
    k: s.k,
    n,
    done,
    ic: m.ic,
    t: m.t,
    s: m.s,
    pts: m.pts,
    act: 'next-go',
    v: s.k,
    when: s.state === 'next' ? stopStatus(s, r.windMin) : '',
    pips: r.stops.map((x) => (x.done ? 'on' : x.k === s.k ? 'now' : '')),
  };
  if (s.k === 'lesson') {
    const doneIds = lessonsDone(days);
    const nl = firstUndone(doneIds);
    if (nl && lessonOpen(nl, doneIds, account)) {
      o.t = 'Lesson ' + lessonNo(nl) + ': ' + nl.title;
      o.s = lmin(nl);
      o.act = 'lesson';
      o.v = nl.id;
    } else if (nl && !hardDay(days, tk)) {
      /* waits behind an account: the lesson page sends the person to sign up, then opens it */
      o.t = 'Lesson ' + lessonNo(nl) + ': ' + nl.title;
      o.s = LEARN_LOCK.next;
      o.act = 'lesson';
      o.v = nl.id;
    } else {
      const read = LESSONS.filter((L) => lessonOpen(L, doneIds, account));
      const R = account ? reviewPick(tk) : read[Math.abs(diffDays(tk, '2026-01-01')) % read.length];
      o.t = 'Read again: ' + R.title;
      o.s = 'A quick re-read';
      o.pts = 5;
      o.act = 'lesson';
      o.v = R.id;
    }
  }
  return o;
}
