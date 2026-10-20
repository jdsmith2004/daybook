/* Hard hours: Daybook learns when a slip is most likely, from the person's own log, and steps in before it. The calm
   hours before a hard hour are when a plan works best (calm-you guesses the pull low; see Talk it through, talk.ts),
   so Today puts "Talk it through" at the top from two hours before, and a phone can give a heads-up.

   What it learns from, over the last 60 days: slips (they count three times), urges logged or ridden out in SOS, and
   talk-throughs (planning shows up before slipping does). It looks for the two-hour window that holds the most, on
   weekdays and weekends separately when there is enough to go on, and otherwise on all days. A window counts once it
   holds a score of 6 (two slips, or six urges) and at least a quarter of everything.

   Getting through a hard hour with no slip is recorded on that day (p.hw, the hour it started) as a calm move. It is
   never taken away, so "hard hours held" only ever goes up. */
import { addDays, blankP, eventsOf } from './legacy/core.js';
import { changeDay, withDay } from './mutate';
import { talksOf } from './talk';
import type { DayKey, Days, Settings } from './types';

const HOUR = 3600000;
export const RISK_DAYS = 60;
const SLIP_W = 3;
const MIN_SCORE = 6;

export type RiskScope = 'weekdays' | 'weekends' | 'all';
export interface RiskWindow {
  /** the hour it starts (0 to 23); it lasts two hours */
  start: number;
  /** "9 to 11 PM" */
  label: string;
  scope: RiskScope;
  /** slips in the window, and slips with a time in the scope */
  slips: number;
  total: number;
  /** the evidence, in one line */
  line: string;
}

const dateOf = (k: DayKey) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const isWeekend = (k: DayKey) => {
  const w = dateOf(k).getDay();
  return w === 0 || w === 6;
};
/** the time a clock reading on log day k really is: before the rollover hour it is the next morning */
export function riskAt(k: DayKey, hour: number, roll: number, min = 0): number {
  const d = dateOf(k);
  d.setHours(hour + (hour < roll ? 24 : 0), min, 0, 0);
  return d.getTime();
}
const fmtH = (h: number) => (h % 12 || 12) + (h < 12 ? ' AM' : ' PM');
/** "9 to 11 PM", "11 PM to 1 AM" */
export function riskLabel(start: number): string {
  const end = (start + 2) % 24;
  return start < 12 === end < 12 && end !== 0 ? (start % 12 || 12) + ' to ' + fmtH(end) : fmtH(start) + ' to ' + fmtH(end);
}

interface Signal {
  h: number;
  w: number;
  slip: boolean;
  weekend: boolean;
}
/** everything with a time in the last 60 days that says something about when it gets hard */
function signals(days: Days, tk: DayKey): Signal[] {
  const from = addDays(tk, -(RISK_DAYS - 1));
  const out: Signal[] = [];
  for (const e of eventsOf(days, from)) {
    if (e.key > tk || !e.time || !/^\d\d:\d\d$/.test(e.time)) continue;
    const slip = e.outcome === 'slipped';
    out.push({ h: +e.time.slice(0, 2), w: slip ? SLIP_W : 1, slip, weekend: isWeekend(e.key) });
  }
  for (const { k, talk } of talksOf(days)) {
    if (k < from || k > tk) continue;
    const d = new Date(talk.t);
    out.push({ h: d.getHours(), w: 1, slip: false, weekend: isWeekend(k) });
  }
  return out;
}

function busiest(sig: Signal[], roll: number) {
  const score = Array(24).fill(0);
  sig.forEach((s) => (score[s.h] += s.w));
  let best = -1;
  let start = 0;
  for (let i = 0; i < 24; i++) {
    const h = (roll + i) % 24;
    const v = score[h] + score[(h + 1) % 24];
    /* on a tie, the window that starts where things happen */
    if (v > best || (v === best && score[h] > score[start])) {
      best = v;
      start = h;
    }
  }
  const total = score.reduce((a, b) => a + b, 0);
  return { start, best, total };
}

/** the hard hours for log day k (weekday or weekend), or null while there is not enough to go on */
export function riskWindow(days: Days, st: Settings, k: DayKey): RiskWindow | null {
  const roll = st.rollover;
  const all = signals(days, k);
  const wk = isWeekend(k);
  const tryScope = (scope: RiskScope, sig: Signal[]): RiskWindow | null => {
    const b = busiest(sig, roll);
    if (b.best < MIN_SCORE || b.best < b.total * 0.25) return null;
    const inWin = (s: Signal) => s.h === b.start || s.h === (b.start + 1) % 24;
    const slips = sig.filter((s) => s.slip && inWin(s)).length;
    const total = sig.filter((s) => s.slip).length;
    const label = riskLabel(b.start);
    const where = scope === 'weekdays' ? ' on a weekday' : scope === 'weekends' ? ' on a weekend' : '';
    const between = 'between ' + label.replace(' to ', ' and ');
    const line =
      slips >= 2
        ? (slips === total ? 'Your last ' + total + ' slips all' : slips + ' of your last ' + total + ' slips') + ' started ' + between + where + '.'
        : 'Your urges come most often ' + between + where + '.';
    return { start: b.start, label, scope, slips, total, line };
  };
  return (
    tryScope(
      wk ? 'weekends' : 'weekdays',
      all.filter((s) => s.weekend === wk),
    ) || tryScope('all', all)
  );
}

export type RiskPhase = 'far' | 'soon' | 'during' | 'after';
export interface RiskDay {
  win: RiskWindow;
  /** when the hard hours start and end (ms) */
  a: number;
  b: number;
  phase: RiskPhase;
  /** after it: no slip inside it */
  held: boolean;
  /** a talk-through in the six hours before it, or during it */
  talked: number | null;
  /** already recorded as held */
  kept: boolean;
}
/** log day k against its hard hours, at now */
export function riskDay(days: Days, st: Settings, k: DayKey, now: number): RiskDay | null {
  const win = riskWindow(days, st, k);
  if (!win) return null;
  const a = riskAt(k, win.start, st.rollover);
  const b = a + 2 * HOUR;
  const phase: RiskPhase = now < a - 2 * HOUR ? 'far' : now < a ? 'soon' : now < b ? 'during' : 'after';
  const slipIn = (days[k]?.events || []).some((e) => {
    if (e.outcome !== 'slipped' || !e.time) return false;
    const t = riskAt(k, +e.time.slice(0, 2), st.rollover, +e.time.slice(3, 5));
    return t >= a && t < b;
  });
  const talk = talksOf(days)
    .map((x) => x.talk.t)
    .filter((t) => t >= a - 6 * HOUR && t < b)
    .pop();
  return { win, a, b, phase, held: phase === 'after' && !slipIn, talked: talk ?? null, kept: days[k]?.p?.hw != null };
}

/** hard hours held on today or yesterday that are not recorded yet (the latest first) */
export function riskToKeep(days: Days, st: Settings, tk: DayKey, now: number): { k: DayKey; r: RiskDay } | null {
  for (const k of [tk, addDays(tk, -1)]) {
    const r = riskDay(days, st, k, now);
    if (r && r.held && !r.kept) return { k, r };
  }
  return null;
}
/** record a hard hour held on day k: a calm move, kept for good */
export function keepHard(days: Days, k: DayKey, start: number, now = Date.now()): Days {
  if (days[k]?.p?.hw != null) return days;
  const day = changeDay(
    days[k],
    k,
    (d) => {
      const p = d.p || blankP();
      p.hw = start;
      p.c = Math.min(50, p.c + 1);
      d.p = p;
    },
    now,
  );
  return withDay(days, k, day);
}
/** how many hard hours have been held, ever */
export function hardHeld(days: Days): number {
  return Object.keys(days).filter((k) => days[k]?.p?.hw != null).length;
}

/** the phone heads-ups for the next week: 90 minutes before each day's hard hours, when that day has them */
export function riskAlerts(days: Days, st: Settings, tk: DayKey, now: number, n = 7): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const k = addDays(tk, i);
    const win = riskWindow(days, st, k);
    if (!win) continue;
    const t = riskAt(k, win.start, st.rollover) - 1.5 * HOUR;
    if (t > now) out.push(t);
  }
  return out;
}

/** The first pattern, early: once three entries have a time, and before the hard hours above are known, one line on
    Today when most of them fall in the same two hours ("2 of your 3 urges came between 10 PM and midnight"). Words only:
    no heads-ups until riskWindow finds the hard hours. Quiet on the day of a slip and the day after. It is the first sign
    that Daybook is learning the person's own pattern, in the first week, when that matters most. */
export function firstPattern(days: Days, st: Settings, tk: DayKey): string | null {
  if (riskWindow(days, st, tk)) return null;
  if ([tk, addDays(tk, -1)].some((k) => (days[k]?.events || []).some((e) => e.outcome === 'slipped'))) return null;
  const hrs = eventsOf(days, addDays(tk, -(RISK_DAYS - 1)))
    .filter((e) => e.key <= tk && !!e.time && /^\d\d:\d\d$/.test(e.time))
    .map((e) => +e.time!.slice(0, 2));
  if (hrs.length < 3) return null;
  const score = Array(24).fill(0);
  hrs.forEach((h) => score[h]++);
  let best = 0;
  let start = 0;
  for (let i = 0; i < 24; i++) {
    const h = (st.rollover + i) % 24;
    const v = score[h] + score[(h + 1) % 24];
    if (v > best) {
      best = v;
      start = h;
    }
  }
  if (best < 2 || best * 2 < hrs.length) return null;
  const who = best === hrs.length ? 'All ' + best + ' of your urges' : best + ' of your ' + hrs.length + ' urges';
  const span = riskLabel(start)
    .replace(' to ', ' and ')
    .replace(/\b12 AM\b/, 'midnight')
    .replace(/\b12 PM\b/, 'noon');
  return who + ' came between ' + span + '. Your pattern is starting to show, and knowing when is half of being ready.';
}
