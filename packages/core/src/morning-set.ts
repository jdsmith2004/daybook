/* The morning set (docs/plan.md, "The morning, not the moment", step 1; the owner, November 11, 2026). The self who wants to quit is
   up in the morning, and the choice at night is made by someone who, right then, does not want to stop. So the morning self gets one
   minute, the first time Daybook opens in the morning, to set up the night:

   - "How was last night?" Free of it, or It happened. This is the honest log, moved to the one time of day it is easy to give.
     "It happened" is saved as a slip on the night before (the log day before today), with no time and marked as told the next morning
     (DayEvent.mn), unless a slip that night is already logged. It is an honest log like any other, so it feeds the count, points,
     runLedger and the hero the usual way: no rule changes for it.
   - "And this morning?" Low, Okay or Good, optional. Nothing is said about it then; later the Sunday review shows how mornings after
     free nights felt against the others (wakeAfter). It also answers the day's "How are you feeling today?" when that is still open.
   - "Who are you doing tonight for?" One of the person's own reasons, and when the night's wait starts (yesterday's time unless they
     change it). Set tonight.

   The record lives on today's Play (ms), so it goes wherever the day goes (sync included). Doing it marks the day's morning (p.m),
   which the legacy rules already count as the morning win (winsOf, 5 points), so the fire's partDone counts it with no change there.
   Skipping costs nothing that day.

   Other parts read it through the functions at the bottom: tonightOf (Screen Time's hours and the wait screen's reason), nightTold and
   morningsSet (the effort record), lastNightSlip (Rekindle's quiet way in). Checked by test/morning-set.test.ts. */
import { addDays, diffDays, fmtDate, isTime, sumDay } from './legacy/core.js';
import { awayGapAt, dayUntold } from './away';
import { truthOn } from './truth';
import { changeSettings } from './actions';
import { addEvent, changeDay, removeEvent, withDay } from './mutate';
import { MORNING_REASON_MAX, MORNING_REASONS_MAX, normMorning } from './morning-norm';
import { ownOf } from './saved-answers';
import { settleByMorning, unsettleByMorning } from './talk-log';
import type { Clock, Day, DayEvent, DayKey, Days, MorningSet, Play, Settings } from './types';

export { MORNING_REASON_MAX, MORNING_REASONS_MAX } from './morning-norm';

/** the morning, by the phone's clock: from 4 AM, until 2 PM */
export const MORNING_FROM = 4;
export const MORNING_TO = 14;
/** when the night's wait starts when nothing was ever chosen */
export const NIGHT_AT_DEFAULT: Clock = '22:30';
/** the times the morning can pick, every half hour from 8 PM to 1 AM */
export const NIGHT_TIMES: Clock[] = ['20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30', '00:00', '00:30', '01:00'];
/** how far back the last morning's reason and time carry when a morning was not set */
export const CARRY_DAYS = 7;

/** "And this morning?" */
export const MORNING_FEEL: { n: 1 | 2 | 3; w: string }[] = [
  { n: 1, w: 'Low' },
  { n: 2, w: 'Okay' },
  { n: 3, w: 'Good' },
];

const blankPlay = (): Play => ({ w: [], wd: false, r: false, c: 0, m: false, tl: [], po: null, ls: [], lv: [], ov: {} });

/** the morning set on a day, or null */
export function morningOf(d: Day | null | undefined): MorningSet | null {
  return normMorning(d && d.p && d.p.ms) || null;
}

/** whether this morning was set (Set tonight was pressed) */
export const isSet = (d: Day | null | undefined): boolean => !!morningOf(d)?.set;

/** whether a time on a log day is in its night: from 6 PM, or past midnight before the new day starts (the rollover hour) */
function inNight(t: string | null | undefined, roll: number): boolean {
  if (!t || !isTime(t)) return true;
  const m = +t.slice(0, 2) * 60 + +t.slice(3, 5);
  return m >= 18 * 60 || m < roll * 60;
}

/** the slips logged in the night of a log day (from 6 PM, or with no time), latest last */
export function nightSlips(days: Days, st: Settings, k: DayKey): DayEvent[] {
  return (days[k]?.events || []).filter((e) => e.outcome === 'slipped' && (e.mn || inNight(e.time, st.rollover)));
}

/** whether the morning set opens now: once a day, after the day setup was finished, in the morning, until it is set or closed.
    The app adds the rest: only when setup is done, and never over SOS or a full-screen moment. */
export function morningDue(days: Days, st: Settings | null, tk: DayKey, now: number): boolean {
  if (!st || !st.start || tk <= st.start) return false;
  const h = new Date(now).getHours();
  /* before the new day starts (the rollover hour), it is still last night's log day */
  if (h < Math.max(MORNING_FROM, st.rollover) || h >= MORNING_TO) return false;
  const ms = morningOf(days[tk]);
  return !ms || (!ms.set && !ms.x);
}

/** the answer to start "How was last night?" on: what was already said this morning, or It happened when a slip that night is
    already logged; otherwise nothing, so the person picks */
export function lastNightStart(days: Days, st: Settings, tk: DayKey): 'free' | 'slip' | null {
  const ms = morningOf(days[tk]);
  if (ms?.n) return ms.n;
  return nightSlips(days, st, addDays(tk, -1)).length ? 'slip' : null;
}

function withMorning(days: Days, tk: DayKey, now: number, fn: (ms: MorningSet, p: Play) => void): Days {
  const day = changeDay(
    days[tk],
    tk,
    (d) => {
      const p = d.p || blankPlay();
      const ms: MorningSet = { ...(normMorning(p.ms) || { at: now }) };
      fn(ms, p);
      ms.at = now;
      p.ms = ms;
      d.p = p;
    },
    now,
  );
  return withDay(days, tk, day);
}

/** "How was last night?" answered (or changed). It happened adds a slip to the night before, with no time, unless one that night is
    already logged; changing back to Free of it takes away only the slip this morning added. Answering marks the day's morning, and
    answers last night's talk-throughs (settleByMorning). */
export function answerNight(days: Days, st: Settings, tk: DayKey, n: 'free' | 'slip', now = Date.now()): Days {
  const y = addDays(tk, -1);
  const prev = morningOf(days[tk]);
  let ev = prev?.ev;
  let next = days;
  if (n === 'free' && ev) {
    next = removeEvent(next, y, ev, now);
    ev = undefined;
  }
  /* a slip from before the log began is not added: the night before Day 1 of tracking is not in the log */
  if (n === 'slip' && !ev && !nightSlips(next, st, y).length && y >= st.start) {
    const r = addEvent(next, y, 'slipped', null, { mn: true }, now);
    next = r.days;
    ev = r.id;
  }
  /* the answer is also the answer to last night's plans (talk-log.ts): Free of it settles them as held, so Today never asks
     "Did your plan hold?" about a night already told; It happened opens them again, and its slip settles them */
  next = n === 'free' ? settleByMorning(next, tk, now) : unsettleByMorning(next, tk, now);
  return withMorning(next, tk, now, (ms, p) => {
    ms.n = n;
    if (ev) ms.ev = ev;
    else delete ms.ev;
    p.m = true;
  });
}

/** the catch-up row ("And Tuesday night?", C1): the night before last, when it was not told and is not part of a longer stretch that
    Welcome back asks about (truth.ts, away.ts). Its log day, or null. */
export function nightBeforeDue(days: Days, st: Settings, tk: DayKey): DayKey | null {
  const k = addDays(tk, -2);
  if (!truthOn(st, k) || k < st.start) return null;
  if (morningOf(days[tk])?.n2) return k;
  if (!dayUntold(days, st, k, tk) || awayGapAt(days, st, k, tk)) return null;
  return k;
}
/** the words of the catch-up row: "And Tuesday night?" */
export const nightBeforeAsk = (k: DayKey): string => 'And ' + fmtDate(k, { weekday: 'long' }) + ' night?';

/** the catch-up row answered (or changed): kept on today's morning as n2. It happened adds a slip with no time to that night,
    unless one is already logged, the same as last night's answer; Free of it takes away only the slip this row added. */
export function answerNightBefore(days: Days, st: Settings, tk: DayKey, n: 'free' | 'slip', now = Date.now()): Days {
  const k = addDays(tk, -2);
  const prev = morningOf(days[tk]);
  let ev = prev?.ev2;
  let next = days;
  if (n === 'free' && ev) {
    next = removeEvent(next, k, ev, now);
    ev = undefined;
  }
  if (n === 'slip' && !ev && !nightSlips(next, st, k).length && k >= st.start) {
    const r = addEvent(next, k, 'slipped', null, { mn: true }, now);
    next = r.days;
    ev = r.id;
  }
  return withMorning(next, tk, now, (ms) => {
    ms.n2 = n;
    if (ev) ms.ev2 = ev;
    else delete ms.ev2;
  });
}

/** any night told later, from its day's page on Days (C1: catching up is one tap): last night is this morning's answer, the night
    before last the catch-up row, and an older night is kept as the catch-up answer on the day two after it (MorningSet.n2), which
    earns no morning points, since no morning was set. It happened adds a slip with no time to that night, unless one is logged. */
export function tellNight(days: Days, st: Settings, k: DayKey, n: 'free' | 'slip', tk: DayKey, now = Date.now()): Days {
  if (k >= tk || k < st.start) return days;
  if (k === addDays(tk, -1)) return answerNight(days, st, tk, n, now);
  const on = addDays(k, 2);
  return answerNightBefore(days, st, on, n, now);
}

/** "And this morning?" answered: kept on the morning, and also as the day's "How are you feeling today?" when that is not answered
    yet, so the day does not ask twice (Low is Low, Okay is Okay, Good is Good on its five steps). A second tap on the same answer clears it. */
export function setMorningFeel(days: Days, tk: DayKey, f: 1 | 2 | 3 | null, now = Date.now()): Days {
  return withMorning(days, tk, now, (ms, p) => {
    if (f == null) delete ms.f;
    else ms.f = f;
    if (f != null && !p.df) p.df = [f === 1 ? 2 : f === 2 ? 3 : 4, now];
  });
}

/** the reasons to pick from for tonight, all of them (November 15, 2026: "It only gave me 3 options"): the ones picked last time
    first, then the person's reasons from setup or My plan, "My faith" when faith is on, who they are becoming, and every reason
    they ever wrote with Write my own (core saved-answers.ts); the starting ones only when they have none of their own. */
export function morningReasons(days: Days, st: Settings, tk: DayKey): string[] {
  const out: string[] = [];
  const add = (t: string | null | undefined) => {
    const s = (t || '').replace(/\s+/g, ' ').trim();
    if (s && !out.some((x) => x.toLowerCase() === s.toLowerCase())) out.push(s);
  };
  const today = morningOf(days[tk])?.rs;
  const last = today || lastSet(days, tk, CARRY_DAYS)?.ms.rs || [];
  /* faith on (D10 (a)): "My faith" is one of the person's own reasons; with it off, nothing about faith */
  const a = st.onb?.a as { faith?: string } | undefined;
  const faith = a && (a.faith === 'big' || a.faith === 'some') ? ['My faith'] : [];
  const rs = st.reasons || [];
  const own = [...rs.slice(0, 1), ...faith, ...rs.slice(1), st.becoming || '', ...ownOf(st, 'reason')].filter((x) => x.trim());
  const ownLow = own.map((x) => x.trim().toLowerCase());
  last.forEach((x) => (ownLow.includes(x.toLowerCase()) || today ? add(x) : undefined));
  own.forEach(add);
  if (!out.length) MORNING_STARTERS.forEach(add);
  return out;
}

/** the reasons offered when a person has none of their own yet */
export const MORNING_STARTERS = ['Becoming someone I am proud of', 'Being fully present with the people I love', 'Clear mornings and steady energy'];

/** the reasons the morning page starts on: what was already picked this morning (on Today before the morning), or nothing, so
    tonight is chosen fresh (the owner, November 15, 2026: "it has to be something that I specifically choose that day") */
export function morningPicksStart(days: Days, tk: DayKey): string[] {
  return morningOf(days[tk])?.rs || [];
}

/** the first reason offered (kept for older callers) */
export function morningReasonStart(days: Days, st: Settings, tk: DayKey): string {
  return morningReasons(days, st, tk)[0] || '';
}

/** when tonight's wait starts unless the person changes it: the last time chosen, then screens-off, then 10:30 PM */
export function nightAtStart(st: Settings): Clock {
  if (isTime(st.nightAt)) return st.nightAt as Clock;
  if (isTime(st.screensOff)) return st.screensOff;
  return NIGHT_AT_DEFAULT;
}

/** Set tonight: the reason and the time are kept on today, the time becomes tomorrow's starting time, and the day's morning is marked */
export function setTonight(
  days: Days,
  st: Settings,
  tk: DayKey,
  o: { r?: string; rs?: readonly string[]; nt: Clock },
  now = Date.now(),
): { days: Days; st: Settings } {
  const nt = isTime(o.nt) ? o.nt : nightAtStart(st);
  const rs = cleanReasons(o.rs || (o.r ? [o.r] : []));
  const next = withMorning(days, tk, now, (ms, p) => {
    if (rs.length) {
      ms.rs = rs;
      ms.r = rs[0];
    }
    ms.nt = nt;
    ms.set = now;
    delete ms.x;
    p.m = true;
  });
  const st2 = st.nightAt === nt ? st : changeSettings(st, (s) => void (s.nightAt = nt), now);
  return { days: next, st: st2 };
}

/** a list of reasons, cleaned: one line each, no repeats, at most MORNING_REASONS_MAX */
function cleanReasons(list: readonly string[]): string[] {
  const out: string[] = [];
  list.forEach((x) => {
    const t = String(x || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MORNING_REASON_MAX);
    if (t && !out.some((y) => y.toLowerCase() === t.toLowerCase()) && out.length < MORNING_REASONS_MAX) out.push(t);
  });
  return out;
}

/** closed without Set tonight: skipped for today, so it does not open again today. Costs nothing. */
export function skipMorning(days: Days, tk: DayKey, now = Date.now()): Days {
  if (isSet(days[tk])) return days;
  return withMorning(days, tk, now, (ms) => void (ms.x = now));
}

/* ---------- for the other parts ---------- */

/** the latest morning that was set, from tk back `back` days (tk included) */
function lastSet(days: Days, tk: DayKey, back: number): { k: DayKey; ms: MorningSet } | null {
  for (let i = 0; i <= back; i++) {
    const k = addDays(tk, -i);
    const ms = morningOf(days[k]);
    if (ms?.set) return { k, ms };
  }
  return null;
}

export interface Tonight {
  /** when the night's wait starts, 'HH:MM' (the log day's night: a time before the rollover hour is past midnight) */
  at: Clock;
  /** the first reason, in the person's own words, or null when none was ever picked */
  r: string | null;
  /** every reason picked for tonight (r is the first), or [] */
  rs: string[];
  /** when the reason was chosen (ms), for "You, at 7:40 AM" */
  rAt: number | null;
  /** the log day the reason and time were set on: tk when this morning was set, an earlier day when they carry over */
  from: DayKey | null;
  /** this morning was set */
  today: boolean;
}

/** tonight, as the morning set it (Screen Time's hours and the wait screen read this): today's choices, or the last morning's within
    CARRY_DAYS, or the starting time with no reason. tk is the log day, so at 1 AM it is still the same night. */
export function tonightOf(days: Days, st: Settings, tk: DayKey): Tonight {
  const s = lastSet(days, tk, CARRY_DAYS);
  const t: Tonight = s
    ? { at: s.ms.nt || nightAtStart(st), r: s.ms.r || null, rs: s.ms.rs || [], rAt: s.ms.set || null, from: s.k, today: s.k === tk }
    : { at: nightAtStart(st), r: null, rs: [], rAt: null, from: null, today: false };
  /* reasons chosen on Today before the morning was set (setTonightReasons) are tonight's */
  const own = morningOf(days[tk]);
  return own?.rs && !own.set ? { ...t, r: own.rs[0], rs: own.rs, rAt: own.at, from: tk } : t;
}

/** tonight's reason, chosen on Today ("Tonight I stay free for", components/today-below.tsx): kept on today without setting the morning, so the
    morning page still opens as it would, already on this reason */
export function pickTonightReason(days: Days, tk: DayKey, r: string, now = Date.now()): Days {
  return setTonightReasons(days, tk, [r], now);
}

/** tonight's reasons, chosen on Today ("Tonight I stay free for", several at once): kept on today without setting the morning, so the
    morning page still opens as it would. An empty list keeps nothing (tonight shows the last morning's again). */
export function setTonightReasons(days: Days, tk: DayKey, list: readonly string[], now = Date.now()): Days {
  const rs = cleanReasons(list);
  return withMorning(days, tk, now, (ms) => {
    if (rs.length) {
      ms.rs = rs;
      ms.r = rs[0];
    } else {
      delete ms.rs;
      delete ms.r;
    }
  });
}

/** one reason picked or put down for tonight on Today: starts from tonight's reasons as they show */
export function toggleTonightReason(days: Days, st: Settings, tk: DayKey, r: string, now = Date.now()): Days {
  const cur = tonightOf(days, st, tk).rs;
  const low = r.trim().toLowerCase();
  const next = cur.some((x) => x.toLowerCase() === low) ? cur.filter((x) => x.toLowerCase() !== low) : [...cur, r];
  return setTonightReasons(days, tk, next, now);
}

/** how a night went, as the morning after said: the night of log day k is answered on day k + 1 (or by the catch-up row on day
    k + 2). null when not answered. */
export function nightTold(days: Days, k: DayKey): 'free' | 'slip' | null {
  return morningOf(days[addDays(k, 1)])?.n || morningOf(days[addDays(k, 2)])?.n2 || null;
}

/** the mornings that were set between two log days (both included) */
export function morningsSet(days: Days, from: DayKey, to: DayKey): number {
  let n = 0;
  for (let k = from; k <= to; k = addDays(k, 1)) if (isSet(days[k])) n++;
  return n;
}

/** mornings set in a row, ending today (today counts once set; a today not set yet does not break it) */
export function morningRun(days: Days, tk: DayKey): number {
  let n = 0;
  let k = isSet(days[tk]) ? tk : addDays(tk, -1);
  while (isSet(days[k])) {
    n++;
    k = addDays(k, -1);
  }
  return n;
}

/** nights answered Free of it between two log days (both included; each night is answered the morning after) */
export function freeNights(days: Days, from: DayKey, to: DayKey): { free: number; told: number } {
  let free = 0;
  let told = 0;
  for (let k = from; k <= to; k = addDays(k, 1)) {
    const n = nightTold(days, k);
    if (n) told++;
    if (n === 'free') free++;
  }
  return { free, told };
}

/** the slip this morning added for last night, when it did (Rekindle's quiet way in from "It happened") */
export function lastNightSlip(days: Days, tk: DayKey): { k: DayKey; id: string } | null {
  const ms = morningOf(days[tk]);
  if (ms?.n !== 'slip') return null;
  const y = addDays(tk, -1);
  const id = ms.ev || (days[y]?.events || []).filter((e) => e.outcome === 'slipped').slice(-1)[0]?.id;
  return id ? { k: y, id } : null;
}

/** how mornings felt after free nights and after the others, over the `weeks` up to tk (the Sunday review shows it after four weeks):
    good counts the Good answers, n every answer */
export function wakeAfter(days: Days, tk: DayKey, weeks = 4): { free: { good: number; n: number }; other: { good: number; n: number } } {
  const out = { free: { good: 0, n: 0 }, other: { good: 0, n: 0 } };
  for (let i = 0; i < weeks * 7; i++) {
    const k = addDays(tk, -i);
    const ms = morningOf(days[k]);
    if (!ms?.n || !ms.f) continue;
    const b = ms.n === 'free' ? out.free : out.other;
    b.n++;
    if (ms.f === 3) b.good++;
  }
  return out;
}

/** the days from the first morning set to tk, for "since you started setting up your mornings" */
export function firstMorning(days: Days, tk: DayKey): DayKey | null {
  let first: DayKey | null = null;
  for (const k of Object.keys(days)) if (k <= tk && isSet(days[k]) && (!first || k < first)) first = k;
  return first;
}
export const daysSinceFirstMorning = (days: Days, tk: DayKey): number | null => {
  const f = firstMorning(days, tk);
  return f ? diffDays(tk, f) + 1 : null;
};

/** a slip on day k that the morning added, for the day's page: "Told the next morning" */
export const toldNextMorning = (e: DayEvent): boolean => e.mn === true;

/** whether the day has a slip at all (for callers that only need that) */
export const slippedOn = (days: Days, k: DayKey): boolean => sumDay(days[k]).slipped > 0;

/* ---------- the words on the two pages ---------- */

/** the words of the morning set. Plain and sure; nothing said about points or stakes, and It happened gets no ceremony. */
export const MORNING_WORDS = {
  title: 'Good morning',
  night: 'How was last night?',
  free: 'Free of it',
  slip: 'It happened',
  feel: 'And this morning?',
  next: 'Next',
  /** the eyebrow of the second page after It happened: logged, and the day is still open */
  logged: 'Logged. Today is open.',
  setup: 'Set up tonight',
  why: 'What is tonight for?',
  whyMany: 'Pick as many as are true.',
  when: 'When does tonight start?',
  whenDone: 'Next',
  set: 'Set tonight',
  /** the quiet link to Rekindle after It happened */
  look: 'Look back on it',
  /** said once it is set, as the lesson opens */
  done: 'Tonight is set.',
} as const;

/** under "When does tonight start?": the time it starts on, which is last night's */
export const morningWhenSet = (t: string): string => 'Last night it was ' + t + '. Keep it, or change it.';

/** the eyebrow on the first page: "Good morning · Wednesday" */
export const morningHello = (now: number): string => MORNING_WORDS.title + ' · ' + new Date(now).toLocaleDateString('en-US', { weekday: 'long' });

/** the line over tonight's time: what happens then. Before November 15, 2026, Screen Time's adult sites waited from then; they wait
    all day now (core pull.ts), so the app passes `waits` false and it is the time the phone goes down, the person's own plan. */
export function tonightLine(o: { waits: boolean; habit: 'porn' | 'alcohol' | 'gambling' | 'other' }): string {
  return o.waits && o.habit === 'porn' ? 'Adult sites wait from' : 'Phone down at';
}
