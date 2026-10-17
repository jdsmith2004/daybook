/* "Your day" on Today: last night (asked the next morning), the lesson, the evening check-in and the wind-down, and switching
   parts of one day on or off. Ported from the legacy pathHtml, stopStatus, windLine, doSaveCheckin and the Today actions
   (night-so, night-sleep, morning-done, wind, rt-day, save-checkin). Checked by test/day.test.ts. */
import { blankP, fmtClock, fmtLeft, HX_NEXT, weekOf, minToClock, morningInfo, reachedOn, rhythm, ROUTINE_KEYS, streaks, sumDay, type RhythmStop } from './legacy/core.js';
import { faithOf, firstUndone, lessonNo, lessonsDone, lmin, reviewPick } from './lessons';
import { todayMeasure } from './graduate';
import { changeDay, withDay } from './mutate';
import type { Checkin, DayKey, Days, Play, Reviews, Settings } from './types';

/** the short status on the right of a stop */
export function stopStatus(s: RhythmStop, windMin: number): string {
  if (s.state === 'done') return s.k === 'evening' ? 'Saved' : 'Done';
  const open = s.state === 'now';
  const late = s.state === 'due';
  if (s.k === 'morning') return open ? 'Answer now' : late ? 'Still open' : 'Tomorrow morning';
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

/** the note under "Your day" */
export function pathNote(days: Days, st: Settings, tk: DayKey, _stops?: RhythmStop[]): string {
  const mi = morningInfo(days, st, tk);
  const day = days[tk];
  const mOn = routineIsOn(st, day && day.p, 'morning');
  /* said once, on the first day; after that the Last night stop explains itself */
  return !mi.applies && mOn ? 'Sleep and screens-off are asked the next morning, because that is when you know. Tomorrow a stop called Last night shows up here.' : '';
}
const routineIsOn = (st: Settings, p: Play | null | undefined, k: string) => {
  const o = p && p.ov && p.ov[k];
  if (typeof o === 'boolean') return o;
  return !!(st && st.routine && st.routine[k]);
};

/* ---------- the evening check-in ---------- */
export interface CheckinForm {
  m: number | null;
  c: number | null;
  e: number | null;
  s: number | null;
  ro: 'Y' | 'N' | null;
  n: string;
}
/** the form, from what is saved (reached out is already Yes when today's log says so) */
export function checkinFormOf(days: Days, key: DayKey): CheckinForm {
  const d = days[key];
  const saved = d && d.checkin;
  const ro = reachedOn(d) ? 'Y' : null;
  return saved ? { m: saved.m, c: saved.c, e: saved.e, s: saved.s, ro: saved.ro || ro, n: saved.n || '' } : { m: null, c: null, e: null, s: null, ro, n: '' };
}
const blankCheckin = (): Checkin => ({ m: null, c: null, e: null, s: null, h: null, so: null, ro: null, n: '', done: false, at: 0 });
/** saving keeps sleep and screens-off, which are answered the next morning */
export function saveCheckin(days: Days, key: DayKey, f: CheckinForm, now = Date.now()): Days {
  const day = changeDay(
    days[key],
    key,
    (d) => {
      const o = d.checkin || ({} as Partial<Checkin>);
      d.checkin = { m: f.m, c: f.c, e: f.e, s: f.s, h: o.h == null ? null : o.h, so: o.so || null, ro: f.ro, n: (f.n || '').trim(), done: true, at: now };
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
  if (s.slipped) return 'Saved. A slip is data, not a reset.' + (runs && sk.open && sk.open.k === tk ? ' Your run is on the line. Finish the Rekindle quest to keep it.' : '');
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

/* ---------- last night, asked the next morning ---------- */
/** screens off on time last night (Yes or No; the same answer again clears it) */
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
/** a sleep chip: set last night's hours outright (the same chip again clears it) */
export function setSleep(days: Days, tk: DayKey, h: number, now = Date.now()): Days {
  const day = changeDay(
    days[tk],
    tk,
    (d) => {
      const c = d.checkin || (d.checkin = blankCheckin());
      c.h = c.h === h ? null : Math.min(14, Math.max(0, Math.round(h * 2) / 2));
    },
    now,
  );
  return withDay(days, tk, day);
}
/** the sleep chips on Last night: most people land in one of these */
export const SLEEP_CHIPS = [5, 6, 7, 8, 9];
/** the morning questions answered (at least one must be) */
export function morningDone(days: Days, tk: DayKey, now = Date.now()): Days {
  return withDay(
    days,
    tk,
    changeDay(
      days[tk],
      tk,
      (d) => {
        const p = d.p || blankP();
        p.m = true;
        d.p = p;
      },
      now,
    ),
  );
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
export function phoneAway(days: Days, tk: DayKey, at: string, now = Date.now()): Days {
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
/** the part of the day that is open now, or the next one to open (legacy nextUp) */
export function nextUp(days: Days, st: Settings, tk: DayKey, nowMs: number): NextUp {
  const r = rhythm(days, st, tk, nowMs);
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
    const nl = firstUndone(lessonsDone(days), faithOf(st));
    if (nl) {
      o.t = 'Lesson ' + lessonNo(nl, faithOf(st)) + ': ' + nl.title;
      o.s = lmin(nl);
      o.act = 'lesson';
      o.v = nl.id;
    } else {
      const R = reviewPick(tk);
      o.t = 'Read again: ' + R.title;
      o.s = 'A quick re-read';
      o.pts = 5;
      o.act = 'lesson';
      o.v = R.id;
    }
  }
  return o;
}

/** "Week N is done": the last full week, while its review has no answers yet (legacy weekNudge) */
export function weekNudge(st: Settings, reviews: Reviews, tk: DayKey): number | null {
  const cw = weekOf(tk, st);
  const last = cw - 1;
  if (last < 0) return null;
  const r = reviews['w' + last];
  if (r && Object.keys(r.a).some((k) => r.a[k as keyof typeof r.a] && r.a[k as keyof typeof r.a].trim())) return null;
  return last;
}
