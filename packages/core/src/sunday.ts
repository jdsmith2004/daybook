/* The Sunday review: once a week, on Sunday, one screen to look back on the week (Monday to Sunday) and ahead to the next:
   what worked, what to change, and one small goal. Daybook fills in the suggestions from the log, each with what it saw
   ("6 urges ridden out"), so most of it is a few taps, and the person's own words are always welcome.

   The goal is small and close (no big goals early): a few nights or days, never a count of slips. When the log can show
   it (phone away, winding down, sleep, check-ins, reaching out, a lesson), Daybook counts it through the week, so Today
   can say "2 of 5 so far". Progress is never all or nothing: 4 of 5 is four nights that happened.

   A review is kept as a review record under "s" and its Sunday ("s2026-10-18"), so it syncs like the older weekly reviews
   ("w3", by the person's own weeks), which stay readable in the Journal. Its answers are also written into the record's
   text fields, so older copies of the app can read them too. */
import { addDays, didIds, didText, eventsOf, fmtClock, sumDay, trigText } from './legacy/core.js';
import { talksOf } from './talk';
import { urTool } from './sos';
import { plural } from './view';
import type { Day, DayKey, Days, Review, Reviews, Settings } from './types';

/* ---------- the record ---------- */
export type SunGoalKind = 'phone' | 'wind' | 'sleep' | 'checkin' | 'reach' | 'lesson';
export interface SunGoal {
  /** the words, as the person sees them */
  t: string;
  /** a goal the log can count, and how many nights or days */
  k?: SunGoalKind;
  n?: number;
}
export interface SunReview {
  /** what worked, what to change: short lines, Daybook's or the person's own */
  w: string[];
  c: string[];
  /** one goal for the week ahead */
  g: SunGoal | null;
  /** how last week's goal went, when the log could not count it */
  last?: SunLast;
  /** the extras, each only when the person chose it: an if-then plan for the hardest moment (when, then), the hard days
      of the week ahead (0 is Sunday), and a note to their future self, shown midweek */
  it?: { w: string; t: string };
  hd?: number[];
  nt?: string;
}
export type SunLast = 'most' | 'some' | 'not';
export const SUN_LAST: [SunLast, string, string][] = [
  ['most', 'Most days', 'That is the goal, kept.'],
  ['some', 'Some days', 'Some days count. That is progress.'],
  ['not', 'Not this time', 'Honest is what helps. A new week, a new try.'],
];
export const SUN_LEN = 60;
export const SUN_NOTE_LEN = 160;
export const SUN_MAX = 6;

const clean = (v: unknown, max = SUN_LEN) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
function lines(a: unknown): string[] {
  if (!Array.isArray(a)) return [];
  const out: string[] = [];
  for (const x of a) {
    const t = clean(x);
    if (t && !out.some((o) => o.toLowerCase() === t.toLowerCase())) out.push(t);
  }
  return out.slice(0, SUN_MAX);
}
/** a Sunday review, cleaned (used by normReview), or null when there is none */
export function normSun(x: unknown): SunReview | null {
  if (!x || typeof x !== 'object') return null;
  const v = x as Record<string, unknown>;
  const g = v.g && typeof v.g === 'object' ? (v.g as Record<string, unknown>) : null;
  const t = g ? clean(g.t, 80) : '';
  const k = g && typeof g.k === 'string' && g.k in SUN_GOALS ? (g.k as SunGoalKind) : undefined;
  const n = g && Number.isInteger(g.n) && (g.n as number) >= 1 && (g.n as number) <= 7 ? (g.n as number) : undefined;
  const out: SunReview = { w: lines(v.w), c: lines(v.c), g: t ? { t, ...(k && n ? { k, n } : {}) } : null };
  if (v.last === 'most' || v.last === 'some' || v.last === 'not') out.last = v.last;
  const it = v.it && typeof v.it === 'object' ? (v.it as Record<string, unknown>) : null;
  if (it && clean(it.w, 80) && clean(it.t, 80)) out.it = { w: clean(it.w, 80), t: clean(it.t, 80) };
  if (Array.isArray(v.hd)) {
    const hd = v.hd.filter((d, i, a): d is number => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6 && a.indexOf(d) === i).slice(0, 2);
    if (hd.length) out.hd = hd;
  }
  const nt = clean(v.nt, SUN_NOTE_LEN);
  if (nt) out.nt = nt;
  return out;
}

/* ---------- the week ---------- */
const dateOf = (k: DayKey) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const isSunday = (k: DayKey) => dateOf(k).getDay() === 0;
/** the Sunday that ends k's week (Monday to Sunday) */
export const sunOf = (k: DayKey): DayKey => {
  const d = dateOf(k).getDay();
  return d === 0 ? k : addDays(k, 7 - d);
};
export const sunKey = (sun: DayKey) => 's' + sun;
export const isSunKey = (k: string) => /^s\d{4}-\d{2}-\d{2}$/.test(k);
/** "Oct 12 to 18", "Sep 28 to Oct 4" */
export function sunRange(sun: DayKey): string {
  const a = dateOf(addDays(sun, -6));
  const b = dateOf(sun);
  const m = (d: Date) => d.toLocaleDateString('en-US', { month: 'short' });
  return m(a) + ' ' + a.getDate() + ' to ' + (m(a) === m(b) ? '' : m(b) + ' ') + b.getDate();
}

/* ---------- small goals the log can count ---------- */
const ci = (d: Day | undefined) => (d && d.checkin) || null;
export const SUN_GOALS: Record<SunGoalKind, { unit: 'nights' | 'days'; n: number; t: (st: Settings) => string; did: (d: Day | undefined) => boolean }> = {
  phone: {
    unit: 'nights',
    n: 5,
    t: (st) => (st.screensOff ? 'Phone away by ' + fmtClock(st.screensOff) : 'Phone out of the bedroom at night'),
    did: (d) => !!(d && d.p && d.p.po) || ci(d)?.so === 'Y',
  },
  wind: { unit: 'nights', n: 4, t: () => 'Wind down before bed', did: (d) => !!(d && d.p && d.p.wd) },
  sleep: { unit: 'nights', n: 4, t: () => 'Seven hours of sleep', did: (d) => (ci(d)?.h ?? 0) >= 7 },
  checkin: { unit: 'days', n: 5, t: () => 'Check in', did: (d) => !!ci(d)?.done },
  reach: { unit: 'days', n: 2, t: () => 'Reach out to someone', did: (d) => !!(d && d.p && d.p.r) || ci(d)?.ro === 'Y' },
  lesson: { unit: 'days', n: 3, t: () => 'Read a lesson', did: (d) => !!(d && d.p && d.p.ls.length + d.p.lv.length) },
};
/** a countable goal, as one line: "Phone away by 11:00 PM, 5 nights" */
export const sunGoalOf = (k: SunGoalKind, st: Settings, n = SUN_GOALS[k].n): SunGoal => ({ t: SUN_GOALS[k].t(st) + ', ' + n + ' ' + SUN_GOALS[k].unit, k, n });
/** how many of the goal's nights or days happened from Monday to Sunday of the week that ends on sun (up to today) */
export function sunGoalCount(days: Days, g: SunGoal, sun: DayKey, tk: DayKey): number | null {
  if (!g.k) return null;
  let n = 0;
  for (let k = addDays(sun, -6); k <= sun && k <= tk; k = addDays(k, 1)) if (SUN_GOALS[g.k].did(days[k])) n++;
  return n;
}

/* ---------- what the week shows ---------- */
export interface SunWeek {
  sun: DayKey;
  /** days of the week that count (from the start of the log, up to today) */
  days: number;
  noSlip: number;
  rode: number;
  slipped: number;
  checkins: number;
  /** slips after 9 PM (or before the day rolls over), and on Saturday or Sunday */
  lateSlips: number;
  lateUrges: number;
  weekendSlips: number;
  screensLate: number;
  sleep: number[];
  talks: number;
  held: number;
  phone: number;
  reach: number;
  lessons: number;
  sleep7: number;
  trig: Record<string, { rode: number; slipped: number }>;
  did: Record<string, number>;
  tools: Record<string, { n: number; w: number }>;
}
export function sunWeek(days: Days, st: Settings, sun: DayKey, tk: DayKey): SunWeek {
  const first = Object.keys(days).sort()[0];
  const from = first && first < st.start ? first : st.start;
  const w: SunWeek = {
    sun,
    days: 0,
    noSlip: 0,
    rode: 0,
    slipped: 0,
    checkins: 0,
    lateSlips: 0,
    lateUrges: 0,
    weekendSlips: 0,
    screensLate: 0,
    sleep: [],
    talks: 0,
    held: 0,
    phone: 0,
    reach: 0,
    lessons: 0,
    sleep7: 0,
    trig: {},
    did: {},
    tools: {},
  };
  const mon = addDays(sun, -6);
  for (let k = mon; k <= sun && k <= tk; k = addDays(k, 1)) {
    if (k < from) continue;
    const d = days[k];
    const s = sumDay(d);
    w.days++;
    if (!s.slipped) w.noSlip++;
    if (ci(d)?.done) w.checkins++;
    if (ci(d)?.so === 'N') w.screensLate++;
    const h = ci(d)?.h;
    if (typeof h === 'number') w.sleep.push(h);
    if (d && d.p && d.p.hw != null) w.held++;
    if (SUN_GOALS.phone.did(d)) w.phone++;
    if (SUN_GOALS.reach.did(d)) w.reach++;
    if (SUN_GOALS.lesson.did(d)) w.lessons++;
    if (SUN_GOALS.sleep.did(d)) w.sleep7++;
    const wd = dateOf(k).getDay();
    for (const e of d ? d.events : []) {
      const slip = e.outcome === 'slipped';
      if (slip) w.slipped++;
      else w.rode++;
      const hr = e.time ? +e.time.slice(0, 2) : null;
      const late = hr != null && (hr >= 21 || hr < st.rollover);
      if (slip && late) w.lateSlips++;
      if (!slip && late) w.lateUrges++;
      if (slip && (wd === 0 || wd === 6)) w.weekendSlips++;
      if (e.trigger && e.trigger !== 'other' && e.trigger !== 'none') {
        const t = (w.trig[e.trigger] = w.trig[e.trigger] || { rode: 0, slipped: 0 });
        if (slip) t.slipped++;
        else t.rode++;
      }
      if (!slip) for (const id of didIds(e.did)) if (id !== 'none' && id !== 'else') w.did[id] = (w.did[id] || 0) + 1;
      for (const r of e.tr || []) {
        if (!urTool(r[0])) continue;
        const t = (w.tools[r[0]] = w.tools[r[0]] || { n: 0, w: 0 });
        t.n++;
        if (r[1] === 'p') t.w++;
      }
    }
  }
  for (const { k } of talksOf(days)) if (k >= mon && k <= sun && k <= tk) w.talks++;
  return w;
}

/* ---------- the suggestions, each with what the log saw ---------- */
export interface SunPick {
  id: string;
  t: string;
  /** what the log saw, in a few words ("6 urges ridden out"), or nothing */
  ev: string;
}
const r1 = (v: number) => String(Math.round(v * 10) / 10);
/** what worked: the good things this week's log shows, strongest first */
export function sunWorked(w: SunWeek, st: Settings): SunPick[] {
  const out: SunPick[] = [];
  if (w.rode) out.push({ id: 'ride', t: 'Riding out urges', ev: plural(w.rode, 'urge') + ' ridden out' });
  Object.keys(w.tools)
    .filter((id) => w.tools[id].w > 0)
    .sort((a, b) => w.tools[b].w - w.tools[a].w)
    .slice(0, 2)
    .forEach((id) => out.push({ id: 'tool:' + id, t: urTool(id)!.name, ev: 'helped ' + w.tools[id].w + ' of ' + w.tools[id].n + ' times' }));
  Object.keys(w.did)
    .sort((a, b) => w.did[b] - w.did[a])
    .slice(0, 2)
    .forEach((id) => {
      const t = didText(id, st.opts);
      if (t && !out.some((o) => o.t.toLowerCase() === t.toLowerCase())) out.push({ id: 'did:' + id, t, ev: plural(w.did[id], 'time') });
    });
  if (w.held) out.push({ id: 'hard', t: 'Getting through my hard hours', ev: plural(w.held, 'day') });
  if (w.phone >= 2) out.push({ id: 'phone', t: 'Phone away at night', ev: plural(w.phone, 'night') });
  if (w.talks) out.push({ id: 'talk', t: 'Talking it through first', ev: plural(w.talks, 'time') });
  if (w.reach) out.push({ id: 'reach', t: 'Reaching out', ev: plural(w.reach, 'day') });
  if (w.checkins >= 4) out.push({ id: 'checkin', t: 'Checking in', ev: w.checkins + ' of ' + w.days + ' days' });
  if (w.lessons >= 2) out.push({ id: 'lesson', t: 'Reading lessons', ev: plural(w.lessons, 'day') });
  if (w.sleep7 >= 4) out.push({ id: 'sleep', t: 'Sleeping well', ev: w.sleep7 + ' nights of 7 hours or more' });
  if (w.slipped) out.push({ id: 'honest', t: 'Logging honestly, slips too', ev: '' });
  if (!out.length) out.push({ id: 'here', t: 'Showing up here', ev: '' });
  /* five at most, so the screen stays short; honesty about slips always makes the list */
  const honest = out.find((o) => o.id === 'honest');
  const top = out.filter((o) => o.id !== 'honest').slice(0, honest ? 4 : 5);
  return honest ? top.concat(honest) : top;
}
/** what to change: where the week was hardest, most telling first */
export function sunChange(w: SunWeek, st: Settings): SunPick[] {
  const out: SunPick[] = [];
  if (w.lateSlips >= 2 || (w.lateSlips >= 1 && w.lateSlips === w.slipped) || w.lateUrges >= 3)
    out.push({
      id: 'late',
      t: 'Late nights',
      ev: w.lateSlips ? w.lateSlips + ' of ' + plural(w.slipped, 'slip') + ' after 9 PM' : w.lateUrges + ' urges after 9 PM',
    });
  const trig = Object.keys(w.trig)
    .filter((k) => w.trig[k].slipped >= 1 || w.trig[k].rode >= 3)
    .sort((a, b) => w.trig[b].slipped - w.trig[a].slipped || w.trig[b].rode - w.trig[a].rode)[0];
  if (trig) {
    const t = w.trig[trig];
    const words = trigText(trig, st.opts);
    if (words) out.push({ id: 'trig:' + trig, t: words, ev: t.slipped ? plural(t.slipped, 'slip') : plural(t.rode, 'urge') });
  }
  if (w.screensLate >= 2) out.push({ id: 'screens', t: 'Screens on late', ev: plural(w.screensLate, 'night') });
  const sl = w.sleep.length >= 3 ? w.sleep.reduce((a, b) => a + b, 0) / w.sleep.length : null;
  if (sl != null && sl < 6.5) out.push({ id: 'sleep', t: 'Sleep', ev: 'about ' + r1(sl) + ' hours a night' });
  if (w.weekendSlips >= 2 && w.weekendSlips * 2 >= w.slipped)
    out.push({ id: 'weekend', t: 'Weekends', ev: w.weekendSlips + ' of ' + plural(w.slipped, 'slip') });
  if (w.days >= 5 && w.checkins <= 3) out.push({ id: 'checkin', t: 'Checking in more', ev: w.checkins + ' of ' + w.days + ' days' });
  for (const [id, t] of [
    ['evening', 'Evenings'],
    ['phone-bed', 'My phone at night'],
    ['stress', 'Stress'],
  ])
    if (out.length < 3 && !out.some((o) => o.t === t)) out.push({ id, t, ev: '' });
  return out.slice(0, 5);
}
/** goals that fit what is changing: the log can count most of them. At most three, then the person's own. */
const FOR_CHANGE: Record<string, (SunGoalKind | string)[]> = {
  late: ['phone', 'wind'],
  screens: ['phone'],
  sleep: ['sleep', 'phone'],
  checkin: ['checkin'],
  weekend: ['A plan for Saturday night'],
  evening: ['wind'],
  'phone-bed': ['phone'],
  stress: ['A short walk after work'],
  'trig:stress': ['A short walk after work'],
  'trig:lonely': ['reach'],
  'trig:bored': ['Plan my empty hour'],
  'trig:late': ['phone'],
  'trig:tired': ['sleep'],
  'trig:scroll': ['phone'],
};
export function sunGoals(change: string[], st: Settings): SunGoal[] {
  const out: SunGoal[] = [];
  const add = (x: SunGoalKind | string) => {
    const g = x in SUN_GOALS ? sunGoalOf(x as SunGoalKind, st) : { t: x };
    if (!out.some((o) => (o.k && o.k === g.k) || o.t === g.t)) out.push(g);
  };
  change.forEach((id) => (FOR_CHANGE[id] || []).forEach(add));
  (['phone', 'checkin', 'lesson'] as SunGoalKind[]).forEach(add);
  return out.slice(0, 3);
}

/* ---------- when it is due, and the goal of the week ---------- */
export const sunDone = (reviews: Reviews, sun: DayKey) => !!reviews[sunKey(sun)]?.sun;
/** the review Today asks for: on Sunday, that week's; on Monday, last week's while it is still open */
export function sunDue(reviews: Reviews, st: Settings, tk: DayKey): { sun: DayKey; late: boolean } | null {
  if (tk < addDays(st.start, 2)) return null;
  if (isSunday(tk)) return sunDone(reviews, tk) ? null : { sun: tk, late: false };
  const y = addDays(tk, -1);
  if (isSunday(y) && !sunDone(reviews, y) && y >= addDays(st.start, 2)) return { sun: y, late: true };
  return null;
}
/** the goal for the week tk is in: set in the review of the Sunday before */
export function sunGoalNow(days: Days, reviews: Reviews, tk: DayKey): { g: SunGoal; sun: DayKey; done: number | null } | null {
  const sun = sunOf(tk);
  const r = reviews[sunKey(addDays(sun, -7))]?.sun;
  if (!r || !r.g) return null;
  return { g: r.g, sun, done: sunGoalCount(days, r.g, sun, tk) };
}
/** this week's plan from last Sunday's review: the goal, the if-then plan, the hard days and the note, for Today and SOS.
    nt shows from Wednesday on; hard is true on one of the hard days. */
export function sunPlanNow(reviews: Reviews, tk: DayKey): { sun: DayKey; it: SunReview['it'] | null; hard: boolean; nt: string | null } | null {
  const sun = sunOf(tk);
  const r = reviews[sunKey(addDays(sun, -7))]?.sun;
  if (!r || (!r.it && !r.hd && !r.nt)) return null;
  const wd = dateOf(tk).getDay();
  return { sun, it: r.it || null, hard: !!r.hd && r.hd.indexOf(wd) >= 0, nt: r.nt && (wd === 0 || wd >= 3) ? r.nt : null };
}
/** last week's goal, looked back on in this week's review: what it was, and how it went */
export function sunLastGoal(days: Days, reviews: Reviews, sun: DayKey, tk: DayKey) {
  const r = reviews[sunKey(addDays(sun, -7))]?.sun;
  if (!r || !r.g) return null;
  const done = sunGoalCount(days, r.g, sun, tk);
  return { g: r.g, done, met: done != null && r.g.n != null && done >= r.g.n };
}
/** "4 of 5 nights", and a kind word on it */
export function sunGoalLine(g: SunGoal, done: number | null, over: boolean): string {
  if (done == null || !g.k || !g.n) return '';
  const unit = SUN_GOALS[g.k].unit;
  const of = done + ' of ' + g.n + ' ' + unit;
  if (done >= g.n) return of + '. Goal kept.';
  if (!over) return done ? of + ' so far.' : (unit === 'nights' ? 'Tonight' : 'Today') + ' can be the first of ' + g.n + '.';
  return done ? of + '. Every one of them counts.' : 'Not this week. A new week, a new try.';
}

/** this week's review, saved: the answers kept in their own words and as text */
export function saveSun(reviews: Reviews, sun: DayKey, s: SunReview, now = Date.now()): Reviews {
  const id = sunKey(sun);
  const prev = reviews[id];
  const sun0 = normSun(s) || { w: [], c: [], g: null };
  const r: Review = {
    k: id,
    a: { hard: '', helped: sun0.w.join('. '), change: sun0.c.concat(sun0.g ? ['My goal: ' + sun0.g.t] : []).join('. '), proud: '' },
    u: Math.max(now, (prev?.u || 0) + 1),
    sun: sun0,
  };
  return { ...reviews, [id]: r };
}
/** every Sunday review, newest first */
export function sunList(reviews: Reviews): { sun: DayKey; r: SunReview }[] {
  return Object.keys(reviews)
    .filter((k) => isSunKey(k) && reviews[k].sun)
    .sort()
    .reverse()
    .map((k) => ({ sun: k.slice(1), r: reviews[k].sun! }));
}
/** the events of a week, for anything that wants them */
export const sunEvents = (days: Days, sun: DayKey) => eventsOf(days, addDays(sun, -6)).filter((e) => e.key <= sun);
