/* Rekindle: what happens after a slip, as data. Each piece is a pure function of the log, so the phone, the web and the tests
   all agree. A slip never asks anything about the count and nothing rescues it (the owner, October 30, 2026): the mode decides
   the number (hero.ts), and what is here is the care, the words of what stays, and the comeback, which only goes up. */
import {
  addDays,
  BACK_DAYS,
  evMs,
  fmtClock,
  fmtDate,
  gameCompute,
  isKey,
  rkFullDays,
  rkOf,
  rkThirdOf,
  runLedger,
  sumDay,
  type RekindleState,
} from './legacy/core.js';
import { changeSettings } from './actions';
import { noSlipDays, todayMeasure } from './graduate';
import { changeDay, withDay } from './mutate';
import { plural } from './view';
import type { DayEvent, DayKey, Days, Reviews, Settings } from './types';

/* ---------- small helpers ---------- */
/** the full Rekindle for the first slip in any 7 days (and only for the first slip that day); the short one for any other slip */
export function rkStepFor(days: Days, date: DayKey): 'rk0' | 'rkl' {
  return rkFullDays(days)[date] && sumDay(days[date]).slipped === 1 ? 'rk0' : 'rkl';
}
/** minutes waited before a slip, rounded down to the steps that are asked about */
export const rkWaitOf = (m: number): 0 | 5 | 10 | 20 => (m >= 20 ? 20 : m >= 10 ? 10 : m >= 5 ? 5 : 0);

/* ---------- "Did you wait first?", the slip's first screen ---------- */
/** the top of the slider: 30 means 30 minutes or more */
export const RK_WAIT_MAX = 30;
/** what a slip entry keeps for the minutes waited first: wm, the slider's whole minutes (0 to RK_WAIT_MAX), and wt, the
    step the older rules count (the "Waited first" points, the Sunday story), so both stay in step */
export function rkWaitFields(m: number): { wm: number; wt: 0 | 5 | 10 | 20 } {
  const wm = Math.max(0, Math.min(RK_WAIT_MAX, Math.round(Number(m) || 0)));
  return { wm, wt: rkWaitOf(wm) };
}
/** from this many days, the words about a slip lead with the days: what was built is never "down to embers" */
const LONG_RUN = 7;
/** the words of the hold-to-rekindle screen: before the hold, and after it. `run` is what the count stood at before the slip
    (rkRunBefore): a long one is never "down to embers", since what it built holds its heat. */
export function rkHoldWords(lit: boolean, sp: boolean, run = 0): { h: string; p: string } {
  if (lit) return { h: 'This is a slip, and you can recover from it.', p: 'Your fire is burning again. A slip can burn it low. It cannot put it out.' };
  return {
    h: sp ? 'You stopped partway. Your fire is still lit.' : 'Your fire did not go out.',
    p:
      run >= LONG_RUN
        ? 'Your ' + run + ' days built a fire that holds its heat. Press and hold to breathe it back up.'
        : 'It is down to embers, and embers hold the heat. Press and hold to breathe it back up.',
  };
}
/** the safe person's name, or their first name when it is long */
export function safeName(st: Settings | null): string {
  const n = String((st && st.safePerson) || '').trim();
  return n.length <= 24 ? n : n.split(/\s+/)[0];
}
/** Day 1: a text to the safe person, so the start is not a secret. Someone who does not hide is who the person is
    becoming. Daybook sends nothing: the person's own messages app opens with the words, or they copy them. */
export function startTellText(st: Settings | null): string {
  const nm = safeName(st);
  return (
    (nm ? 'Hey ' + nm + ', ' : 'Hey, ') + 'today I am starting to quit something that has had a hold on me. No need to say much. It helps to know you know.'
  );
}
/** whether Today offers it: Day 1 is today, a safe person is named, and it was not answered before */
export const tellStartDue = (st: Settings, tk: DayKey): boolean => st.day1 === tk && !!safeName(st) && !isKey(st.toldStart);
/** the card answered, either way: it does not come back */
export const tellStartDone = (st: Settings, tk: DayKey, now = Date.now()) => changeSettings(st, (s) => void (s.toldStart = tk), now);

export function lowerFirst(s: string): string {
  s = String(s || '')
    .trim()
    .replace(/[.!]+$/, '');
  return s ? (/^I\b/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1)) + '.' : '';
}
/** "Slipped at 11:40 PM" */
export function entryLabel(ev: Pick<DayEvent, 'outcome' | 'time' | 'sp'>): string {
  const w = ev.sp && ev.outcome === 'slipped' ? 'Stopped partway' : ev.outcome === 'slipped' ? 'Slipped' : 'Rode it out';
  return w + (ev.time ? ' at ' + fmtClock(ev.time) : '');
}

/* ---------- what the count stood at ---------- */
/** what the count stood at before a slip on day k, in days: the run in strict, the days that hold in gentle. 0 in step down,
    or when nothing is being counted. */
export function rkRunBefore(days: Days, st: Settings, _tk: DayKey, k: DayKey): number {
  if (!st.day1 || k <= st.day1 || st.cleanMode === 'step') return 0;
  if (st.cleanMode === 'gentle') return todayMeasure(days, st, k)?.n ?? 0;
  return runLedger(days, st, addDays(k, -1)).cur;
}

/** what is kept, counted as who the person is (miles.ts): the urges ridden out, the days free of it (every no-slip day since Day 1,
    in any mode) and the comebacks, the first two there are. Never a level or points: in the hours after a slip a score is a
    game voice (Becoming free, step 2). */
function rkKept(days: Days, st: Settings, reviews: Reviews, tk: DayKey): { rode: number; free: number; back: number } {
  const S = gameCompute(days, st, reviews, tk).S;
  return {
    rode: typeof S.rode === 'number' ? S.rode : 0,
    free: noSlipDays(days, st, tk),
    back: rkComebackCount(days, st, tk),
  };
}
/** once the hold is done, the one line under the heading: what is kept, as who the person is ("4 urges ridden out, 13 days free
    of it. All still yours."). One line, because right after a slip a full page is too much to read (the owner, October 25, 2026). */
export function rkLitLine(days: Days, st: Settings, reviews: Reviews, tk: DayKey, _date: DayKey): string {
  const k = rkKept(days, st, reviews, tk);
  const kept = [
    k.rode ? plural(k.rode, 'urge') + ' ridden out' : '',
    k.free ? plural(k.free, 'day') + ' free of it' : '',
    k.back ? plural(k.back, 'comeback') : '',
  ].filter(Boolean);
  if (!kept.length) return 'You told the truth about it. That is yours too.';
  return kept.slice(0, 2).join(', ') + '. All still yours.';
}

/** how long after a slip no point number shows (a toast, Goodnight): the night and the morning after an evening slip */
export const PTS_QUIET_HOURS = 12;
/** whether a point number stays out of sight now: within PTS_QUIET_HOURS of the latest slip. The points are still earned, and
    the level page and the Sunday review show them (Becoming free, step 2). */
export function ptsQuiet(days: Days, st: Settings | null, now: number): boolean {
  if (!st) return false;
  let last = -Infinity;
  for (const k of Object.keys(days))
    for (const e of days[k]?.events || [])
      if (e.outcome === 'slipped') {
        /* a slip with no time (told the next morning, "It happened") counts from when it was logged: its day's last change */
        const t = e.time ? evMs(k, e.time, st.rollover) : Math.max(evMs(k, null, st.rollover), days[k].u || 0);
        last = Math.max(last, Math.min(t, now));
      }
  return now - last < PTS_QUIET_HOURS * 3600_000;
}

/** the slip on day k (id) can still be opened in Rekindle: it is there, and Rekindle has not asked about it yet (no "How do you
    feel now?" answer). The morning's "It happened" shows one quiet link to it while this is true (the morning set, route
    /log?date=k&evId=id&outcome=slipped&from=entry); it is never pushed. */
export function rkOpenFor(days: Days, k: DayKey, id: string): boolean {
  const e = (days[k]?.events || []).find((x) => x.id === id);
  return !!e && e.outcome === 'slipped' && !e.fa;
}

/* ---------- the comeback, noticed (roadmap move 3, docs/plan.md) ----------
   No task list: three flames that light themselves from what the person really does after any slip, in any mode. The
   first is the honest log itself; the second, the sunrise check, which is coming back: Today marks it the first time
   Daybook is opened on a later day (sunriseDue, srDone; it asks nothing); the third, the next urge ridden out or a full
   day with no slip (core.js rkThirdOf). They rescue nothing: they say the person came back, and the comeback count only
   goes up. */
export interface RkLight {
  on: boolean;
  /** what was done, or what lights it */
  t: string;
}
/** the three comeback flames for the slip on day k, as of tk */
export function rkLights(days: Days, st: Settings, tk: DayKey, k: DayKey): { flames: RkLight[]; lit: number; third: { k: DayKey; rode: boolean } | null } {
  const r = rkOf(days, k, st);
  const third = rkThirdOf(days, k, st, tk);
  const wd = (d: DayKey) => fmtDate(d, { weekday: 'long' });
  const flames: RkLight[] = [
    { on: true, t: 'You logged it honestly' },
    r && r.m3 ? { on: true, t: 'You came back to Daybook' } : { on: false, t: 'Coming back to Daybook the next day' },
    third
      ? { on: true, t: third.rode ? 'You rode out the next urge' + (third.k === k ? '' : ', ' + wd(third.k)) : 'A day with no slip, ' + wd(third.k) }
      : { on: false, t: 'The next urge ridden out, or a day with no slip' },
  ];
  return { flames, lit: flames.filter((f) => f.on).length, third };
}
/** every slip the person came back from (the sunrise check, or the third flame), up to tk. It only goes up. */
export function rkComebackCount(days: Days, st: Settings, tk: DayKey): number {
  let n = 0;
  for (const k of Object.keys(days).sort())
    if (k <= tk && sumDay(days[k]).slipped > 0) {
      const r = rkOf(days, k, st);
      if ((r && r.m3) || rkThirdOf(days, k, st, tk)) n++;
    }
  return n;
}
/** "You came back: 3 comebacks." */
export const rkComebackSay = (n: number) => 'You came back: ' + n + (n === 1 ? ' comeback.' : ' comebacks.');

/** the slip whose sunrise check is still to mark: the latest slip before today, the day after it (any slip, any mode), or
    later while a run the old rule covers still waits (runLedger, slips up to countFrom). Coming back is the check: Today
    marks it with srDone the first time it opens on such a day. null once it is marked, or when nothing waits. */
export function sunriseDue(days: Days, st: Settings | null, tk: DayKey): RekindleState | null {
  if (!st) return null;
  for (let i = 1; i <= BACK_DAYS; i++) {
    const k = addDays(tk, -i);
    if (!sumDay(days[k]).slipped) continue;
    const r = rkOf(days, k, st);
    if (!r || r.m3) return null;
    if (i === 1) return r;
    return runLedger(days, st, tk).open?.k === k ? r : null;
  }
  return null;
}

/** the day all three flames lit for the latest slip, said once on that day: the comeback, noticed. null on any other day. */
export function comebackNow(days: Days, st: Settings, tk: DayKey) {
  for (let i = 1; i <= BACK_DAYS + 1; i++) {
    const k = addDays(tk, -i);
    if (!sumDay(days[k]).slipped) continue;
    const r = rkOf(days, k, st);
    const l = rkLights(days, st, tk, k);
    if (!r || !r.m3 || !l.third || !isKey(r.ev.rk && r.ev.rk.at)) return null;
    /* a day with no slip is known the morning after it */
    const thirdDay = l.third.rode ? l.third.k : addDays(l.third.k, 1);
    const litDay = (r.ev.rk!.at as DayKey) > thirdDay ? (r.ev.rk!.at as DayKey) : thirdDay;
    if (litDay !== tk) return null;
    return { k, flames: l.flames, n: rkComebackCount(days, st, tk) };
  }
  return null;
}

/* ---------- on Today ---------- */
/** a Rekindle still near: the day of the slip; the next day; and after that, while a run the old rule covers still waits */
export function rkActive(days: Days, st: Settings | null, tk: DayKey): (RekindleState & { phase: 'day' | 'sun' }) | null {
  if (!st) return null;
  const full = rkFullDays(days);
  const t = full[tk] ? rkOf(days, tk, st) : null;
  if (t) return { phase: 'day', ...t };
  for (let i = 1; i <= BACK_DAYS; i++) {
    const k = addDays(tk, -i);
    const r = full[k] ? rkOf(days, k, st) : null;
    if (!r) continue;
    if (i === 1 || runLedger(days, st, tk).kind[k] === 'open') return { phase: 'sun', ...r };
    return null;
  }
  return null;
}

/* ---------- the sunrise check ----------
   Since October 24, 2026 (the owner: "do not ask ambiguous questions"), the check asks nothing. Coming back is the check:
   Today marks it (srDone) the first time Daybook opens on a day sunriseDue names, which lights the second flame and earns
   its points as before. Plans saved by older checks stay on their slips (rk.pl). */
/** the sunrise check marked on the slip entry evId (the slip day k), on day tk. A plan saved by an older check stays. */
export function srDone(days: Days, k: DayKey, evId: string, tk: DayKey, now = Date.now()): Days {
  const ev = days[k]?.events.find((x) => x.id === evId) || null;
  if (!ev || (ev.rk && isKey(ev.rk.at))) return days;
  const day = changeDay(
    days[k],
    k,
    (d) => {
      const e = d.events.find((x) => x.id === evId);
      if (e) e.rk = { ...(e.rk || {}), at: tk, pl: (e.rk && e.rk.pl) || '' };
    },
    now,
  );
  return withDay(days, k, day);
}
