/* Your pattern (Journal): what the log says, as a few plain answers, each with one clear graph behind it.
   - Are slips getting further apart? The clean days before each slip, and the stretch going now. And, week by week, how
     many hard moments were ridden out: that shows the climb even while slips still happen.
   - When does it happen? A 24-hour clock and the days of the week, with the hard hours that Today uses (risk.ts), so
     the two never disagree.
   - What sets it off? Each trigger, how often it comes, and how often it ends in a slip.
   - What is different on hard days? Check-in answers on slip days against days with no slip, only where the
     difference is big enough to mean something.
   Everything is worked out on the device, from the person's own log. */
import { addDays, diffDays, eventsOf, optText, sumDay } from './legacy/core.js';
import { logStart } from './log-start';
import { riskWindow, type RiskWindow } from './risk';
import { talksOf, TALK_NEEDS, type TalkNeed } from './talk';
import { plural } from './view';
import type { DayKey, Days, Settings } from './types';

export type PatRange = '30' | '90' | 'all';
const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dateOf = (k: DayKey) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};
/** the days in a range, oldest first */
export function patKeys(range: PatRange, days: Days, st: Settings, tk: DayKey): DayKey[] {
  const first = logStart(days, st);
  const lo = range === 'all' ? first : addDays(tk, range === '30' ? -29 : -89);
  const out: DayKey[] = [];
  for (let k = lo < first ? first : lo; k <= tk; k = addDays(k, 1)) out.push(k);
  return out;
}

/* ---------- further apart ---------- */
export interface PatGaps {
  /** clean days before each slip day, oldest first (the last 10) */
  runs: number[];
  /** clean days since the last slip day (or since the start), still going. Today counts while it has no slip, the way the
      run does (Current run in Days and My numbers), so the two never disagree on one page. */
  now: number;
  /** slip days in all */
  slips: number;
  trend: 'apart' | 'closer' | 'steady' | null;
  /** the average stretch early on and lately, when there is a trend */
  early: number | null;
  late: number | null;
}
/** the stretches between slip days, over the whole log (a trend needs the long view) */
export function patGaps(days: Days, st: Settings, tk: DayKey): PatGaps {
  const runs: number[] = [];
  let run = 0;
  for (let k = logStart(days, st); k <= tk; k = addDays(k, 1)) {
    if (sumDay(days[k]).slipped > 0) {
      runs.push(run);
      run = 0;
    } else run++;
  }
  const avg = (l: number[]) => Math.round((l.reduce((a, b) => a + b, 0) / l.length) * 10) / 10;
  let trend: PatGaps['trend'] = null;
  let early: number | null = null;
  let late: number | null = null;
  /* the first stretch (before any slip) is left out of the trend: it is not a gap between slips */
  const gaps = runs.slice(1);
  if (gaps.length >= 3) {
    const half = Math.floor(gaps.length / 2);
    early = avg(gaps.slice(0, half));
    late = avg(gaps.slice(gaps.length - half));
    /* the latest gap has to agree, so one long stretch in the middle does not make a trend */
    const last = gaps[gaps.length - 1];
    trend = late >= early * 1.25 + 0.5 && last > early ? 'apart' : late <= early * 0.8 - 0.5 && last < early ? 'closer' : 'steady';
  }
  return { runs: runs.slice(-10), now: run, slips: runs.length, trend, early, late };
}

/* ---------- ridden out, week by week ---------- */
export interface PatWeek {
  from: DayKey;
  rode: number;
  slipped: number;
}
/** seven-day weeks ending today, oldest first */
export function patWeeks(days: Days, keys: DayKey[], max = 13): PatWeek[] {
  const out: PatWeek[] = [];
  for (let end = keys.length - 1; end >= 0 && out.length < max; end -= 7) {
    const w: PatWeek = { from: keys[Math.max(0, end - 6)], rode: 0, slipped: 0 };
    for (let i = Math.max(0, end - 6); i <= end; i++) {
      const s = sumDay(days[keys[i]]);
      w.rode += s.rode;
      w.slipped += s.slipped;
    }
    out.unshift(w);
  }
  return out;
}
/** the share ridden out at the start of the range and lately (the first and last four weeks with entries) */
export function patRideOut(weeks: PatWeek[]): { then: number; now: number } | null {
  const has = weeks.filter((w) => w.rode + w.slipped > 0);
  if (has.length < 4) return null;
  const n = Math.min(4, Math.floor(has.length / 2));
  const rate = (l: PatWeek[]) => {
    const r = l.reduce((a, w) => a + w.rode, 0);
    const t = l.reduce((a, w) => a + w.rode + w.slipped, 0);
    return t >= 3 ? r / t : null;
  };
  const then = rate(has.slice(0, n));
  const now = rate(has.slice(-n));
  return then == null || now == null ? null : { then, now };
}
/** "8 in 10" */
export const inTen = (f: number) => Math.round(f * 10) + ' in 10';

/* ---------- when ---------- */
export interface PatHour {
  h: number;
  rode: number;
  slipped: number;
}
export interface PatWhen {
  /** hours 0 to 23 */
  hours: PatHour[];
  /** Sunday to Saturday (by the log day) */
  week: { d: number; name: string; rode: number; slipped: number }[];
  timed: number;
  /** the hard hours Today uses, on weekdays and on weekends (one of them when they are the same) */
  hard: { weekdays: RiskWindow | null; weekends: RiskWindow | null; same: boolean };
  /** the hardest day of the week, when one stands out */
  day: { d: number; name: string; n: number; of: number; slips: boolean } | null;
}
export function patWhen(days: Days, st: Settings, keys: DayKey[], tk: DayKey): PatWhen {
  const hours: PatHour[] = Array.from({ length: 24 }, (_, h) => ({ h, rode: 0, slipped: 0 }));
  const week = WEEKDAY.map((name, d) => ({ d, name, rode: 0, slipped: 0 }));
  let timed = 0;
  for (const e of eventsOf(days, keys[0])) {
    if (e.key > tk) continue;
    const slip = e.outcome === 'slipped';
    const w = week[dateOf(e.key).getDay()];
    if (slip) w.slipped++;
    else w.rode++;
    if (e.time && /^\d\d:\d\d$/.test(e.time)) {
      timed++;
      const b = hours[+e.time.slice(0, 2)];
      if (slip) b.slipped++;
      else b.rode++;
    }
  }
  /* the latest weekday and weekend day, so each gets the window Today would show for it */
  let wk: DayKey | null = null;
  let we: DayKey | null = null;
  for (let k = tk, i = 0; i < 7; i++, k = addDays(k, -1)) {
    const d = dateOf(k).getDay();
    if (d === 0 || d === 6) we = we || k;
    else wk = wk || k;
  }
  const a = wk ? riskWindow(days, st, wk) : null;
  const b = we ? riskWindow(days, st, we) : null;
  const same = !!a && !!b && a.start === b.start;
  /* a day stands out with at least 3 slips (or 6 entries) and half again its share */
  const pick = (f: (x: (typeof week)[number]) => number, min: number, slips: boolean) => {
    const tot = week.reduce((s, x) => s + f(x), 0);
    const top = week.slice().sort((x, y) => f(y) - f(x))[0];
    return f(top) >= min && f(top) >= (tot / 7) * 1.5 ? { d: top.d, name: top.name, n: f(top), of: tot, slips } : null;
  };
  const day = pick((x) => x.slipped, 3, true) || pick((x) => x.rode + x.slipped, 6, false);
  return { hours, week, timed, hard: { weekdays: a, weekends: same ? null : b, same }, day };
}

/* ---------- what sets it off ---------- */
export interface PatTrigger {
  k: string;
  t: string;
  rode: number;
  slipped: number;
}
export function patTriggers(days: Days, st: Settings, keys: DayKey[], tk: DayKey): { list: PatTrigger[]; none: number } {
  const by: Record<string, PatTrigger> = {};
  let none = 0;
  for (const e of eventsOf(days, keys[0])) {
    if (e.key > tk) continue;
    const t = e.trigger && e.trigger !== 'other' ? optText('trig', e.trigger, st.opts) : '';
    if (!t) {
      none++;
      continue;
    }
    const r = (by[e.trigger!] = by[e.trigger!] || { k: e.trigger!, t, rode: 0, slipped: 0 });
    if (e.outcome === 'slipped') r.slipped++;
    else r.rode++;
  }
  const list = Object.values(by).sort((a, b) => b.rode + b.slipped - (a.rode + a.slipped) || b.slipped - a.slipped);
  return { list, none };
}
/** the trigger's words inside a sentence: "Bored or idle" reads as "bored or idle" */
const low = (t: string) => (/^[A-Z][a-z]/.test(t) && !/^I\b/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t);
/** what the triggers say, in plain words (at most two lines) */
export function patTriggerLines(list: PatTrigger[]): string[] {
  const out: string[] = [];
  const tot = (x: PatTrigger) => x.rode + x.slipped;
  const top = list[0];
  if (top && tot(top) >= 3)
    out.push(
      '“' +
        top.t +
        '” comes up most: ' +
        plural(tot(top), 'time') +
        (top.rode ? ', and you rode it out ' + (top.rode === tot(top) ? 'every time' : plural(top.rode, 'time')) : '') +
        '.',
    );
  const risky = list.filter((x) => tot(x) >= 3 && x.slipped > 0).sort((a, b) => b.slipped / tot(b) - a.slipped / tot(a) || b.slipped - a.slipped)[0];
  if (risky && risky.slipped >= 2 && risky.slipped / tot(risky) >= 0.3)
    out.push('When it is ' + low(risky.t) + ', it ends in a slip ' + risky.slipped + ' times out of ' + tot(risky) + '. That is the one to plan for.');
  return out;
}

/** what the pull was after, from talk-throughs in the range */
export function patNeeds(days: Days, keys: DayKey[]): { n: TalkNeed; name: string; count: number }[] {
  const c: Partial<Record<TalkNeed, number>> = {};
  for (const { k, talk } of talksOf(days)) if (k >= keys[0] && talk.n) c[talk.n] = (c[talk.n] || 0) + 1;
  return TALK_NEEDS.filter((x) => c[x[0]])
    .map((x) => ({ n: x[0], name: x[1], count: c[x[0]]! }))
    .sort((a, b) => b.count - a.count);
}

/* ---------- what is different on hard days ---------- */
export interface PatDiff {
  k: 'md' | 'u' | 'm' | 'c' | 'e' | 's' | 'h' | 'so' | 'ro';
  label: string;
  unit: 'ten' | 'h' | 'pct';
  clean: number;
  slip: number;
  line: string;
}
const DIFFS: [PatDiff['k'], string, PatDiff['unit'], number][] = [
  ['h', 'Sleep the night before', 'h', 0.75],
  ['u', 'Urges', 'ten', 1],
  ['s', 'Stress', 'ten', 1],
  ['md', 'Mood', 'ten', 1],
  ['m', 'Motivation', 'ten', 1],
  ['e', 'Energy', 'ten', 1],
  ['c', 'Connection', 'ten', 1],
  ['so', 'Screens off on time', 'pct', 0.2],
  ['ro', 'Reached out to someone', 'pct', 0.2],
];
const r1 = (v: number) => String(Math.round(v * 10) / 10);
/** check-in answers on slip days against days with no slip: only the differences big enough to mean something, with at
    least three days on each side */
export function patDiffs(days: Days, keys: DayKey[]): { list: PatDiff[]; cleanN: number; slipN: number } {
  const clean: DayKey[] = [];
  const slip: DayKey[] = [];
  for (const k of keys) {
    const s = sumDay(days[k]);
    if (!days[k]?.checkin) continue;
    if (s.slipped) slip.push(k);
    else clean.push(k);
  }
  const val = (k: DayKey, f: PatDiff['k']): number | null => {
    const ci = days[k]?.checkin;
    if (!ci) return null;
    if (f === 'so' || f === 'ro') {
      const v = f === 'ro' && days[k]?.p?.r ? 'Y' : ci[f];
      return v === 'Y' ? 1 : v === 'N' ? 0 : null;
    }
    const v = ci[f];
    return typeof v === 'number' ? v : null;
  };
  const avg = (ks: DayKey[], f: PatDiff['k']) => {
    const v = ks.map((k) => val(k, f)).filter((x): x is number => x != null);
    return v.length >= 3 ? v.reduce((a, b) => a + b, 0) / v.length : null;
  };
  const list: PatDiff[] = [];
  for (const [k, label, unit, min] of DIFFS) {
    const a = avg(clean, k);
    const b = avg(slip, k);
    if (a == null || b == null || Math.abs(a - b) < min) continue;
    const more = b > a;
    const line =
      k === 'h'
        ? 'You slept ' + (more ? 'more' : 'less') + ' before slip days: ' + r1(b) + ' hours, against ' + r1(a) + '.'
        : unit === 'pct'
          ? label + ': ' + Math.round(a * 100) + '% of days with no slip, ' + Math.round(b * 100) + '% of slip days.'
          : label + (k === 'u' ? ' were ' : ' was ') + (more ? 'higher' : 'lower') + ' on slip days: ' + r1(b) + ' out of 10, against ' + r1(a) + '.';
    list.push({ k, label, unit, clean: a, slip: b, line });
  }
  return { list, cleanN: clean.length, slipN: slip.length };
}

/* ---------- in one look ---------- */
export type PatGo = 'apart' | 'when' | 'what' | 'days';
/** up to three plain sentences, each one pointing at the graph behind it */
export function patInsights(g: PatGaps, ride: { then: number; now: number } | null, when: PatWhen, trig: PatTrigger[]): { t: string; go: PatGo }[] {
  const out: { t: string; go: PatGo }[] = [];
  if (g.trend === 'apart')
    out.push({
      t: 'Your slips are getting further apart: about ' + r1(g.late!) + ' clean days between them lately, up from ' + r1(g.early!) + '.',
      go: 'apart',
    });
  else if (ride && ride.now >= ride.then + 0.15)
    out.push({ t: 'You ride out ' + inTen(ride.now) + ' hard moments now, up from ' + inTen(ride.then) + '.', go: 'apart' });
  else if (g.now >= 7 && g.slips) out.push({ t: g.now + ' clean days and counting since your last slip.', go: 'apart' });
  const hw = when.hard.weekdays || when.hard.weekends;
  if (hw) {
    out.push({ t: hw.line, go: 'when' });
  } else if (when.day)
    out.push({
      t: when.day.name + 's are your hardest day: ' + when.day.n + ' of ' + (when.day.slips ? plural(when.day.of, 'slip') : when.day.of + ' entries') + '.',
      go: 'when',
    });
  const tl = patTriggerLines(trig);
  if (tl.length) out.push({ t: tl[tl.length - 1], go: 'what' });
  return out.slice(0, 3);
}
/** the stretch going now, in words */
export function patNowLine(g: PatGaps, tk: DayKey, last: DayKey | null): string {
  if (!g.slips) return 'No slip logged yet. Every day here counts.';
  const ago = last ? diffDays(tk, last) : 0;
  if (ago === 0 || !g.now) return 'Your last slip was today. The next stretch starts now.';
  if (ago === 1) return 'Your last slip was yesterday. Today is day 1 of the next stretch.';
  return 'Now: ' + plural(g.now, 'clean day') + ' since your last slip, and counting.';
}
