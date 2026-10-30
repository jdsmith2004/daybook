/* Milestones: badges, the forms of the flame, and what Milestones shows. Ported from the legacy rewardsBody, sheetBadge,
   sheetGrowth and badgeDone. */
import type { Badge } from './legacy/core.js';
import type { Settings } from './types';
import { addDays, computeMetrics, dayPoints, eventsOf, gameCompute, isKey, obHours, obRnd, runLedger, WIN_WHY, type Quest } from './legacy/core.js';
import { awaySlipDay, dayKnown } from './away';
import { rkComebackCount } from './rekindle';
import { hardHeld } from './risk';
import { formOfLevel, LADDER_V, LEVELS, STEPS, type Level } from './levels';
import { changeSettings } from './actions';
import type { DayKey, Days, Reviews } from './types';

/** a badge stays earned once it was seen earned, even if an old entry is changed later */
export const badgeDone = (b: Badge, st: Settings | null) => b.done || !!(st && st.seen && st.seen.badges.indexOf(b.id) >= 0);
/** the badges about things that were retired (weekly quests, the morning questions on October 23, 2026, and saving a run on
    October 30, 2026): shown only to
    someone who earned them */
export const RETIRED_BADGES = ['quest-1', 'quest-3', 'morning-5', 'run-saved'];
export const shownBadges = <B extends Badge>(bs: B[], st: Settings | null) => bs.filter((b) => RETIRED_BADGES.indexOf(b.id) < 0 || badgeDone(b, st));

/* ---------- what is new since last time: levels, badges, quests, a full ring (legacy checkNew, ensureSeen, reseat) ---------- */

export type CelItem =
  | { type: 'level'; level: Level; from: number; evolve: boolean; quiet?: boolean }
  | { type: 'badge'; b: Badge; quiet?: boolean }
  | { type: 'quest'; q: Quest; quiet?: boolean }
  | { type: 'perfect'; n: number; quiet?: boolean }
  | { type: 'more'; title: string; sub: string; quiet?: boolean };

/** the first look, or an older ladder: what is already earned is taken note of without any fanfare */
export function seenBaseline(days: Days, st: Settings, reviews: Reviews, tk: DayKey): Settings | null {
  if (st.seen) {
    if ((st.seen.lad || 0) < LADDER_V) {
      const lv = gameCompute(days, st, reviews, tk).level.n;
      return changeSettings(st, (s) => {
        if (!s.seen) return;
        s.seen.level = Math.max(s.seen.level, lv);
        s.seen.lad = LADDER_V;
      });
    }
    return null;
  }
  const g = gameCompute(days, st, reviews, tk);
  return changeSettings(st, (s) => {
    s.seen = {
      badges: g.badges.filter((b) => b.done).map((b) => b.id),
      quests: g.quests.filter((q) => q.done).map((q) => q.id),
      level: g.level.n,
      full: g.tally.t > 0 && g.tally.n === g.tally.t ? tk : null,
      lad: LADDER_V,
    };
  });
}

/** after an action: anything newly earned, and the settings with it marked as seen */
export function checkNew(days: Days, st: Settings, reviews: Reviews, tk: DayKey, quiet: boolean): { st: Settings | null; items: CelItem[] } {
  const base = seenBaseline(days, st, reviews, tk);
  if (base) return { st: base, items: [] };
  const g = gameCompute(days, st, reviews, tk);
  const sn = st.seen!;
  const fromLvl = sn.level;
  const newB = g.badges.filter((b) => b.done && sn.badges.indexOf(b.id) < 0);
  const newQ = g.quests.filter((q) => q.done && sn.quests.indexOf(q.id) < 0);
  /* a level reached on a day with a slip is earned and shows at once, but its celebration waits for the next day: right
     after a slip is not the moment for a full-screen party. The level is not marked seen, so the next day's first change
     celebrates it. */
  const slipDay = (days[tk]?.events || []).some((e) => e.outcome === 'slipped');
  const lvlUp = g.level.n > sn.level && !slipDay;
  /* the full ring is retired (October 2026): Your day and Next up already say when today is done */
  const perfect = false;
  if (!(newB.length || newQ.length || lvlUp || perfect)) return { st: null, items: [] };
  const next = changeSettings(st, (s) => {
    const seen = s.seen || { badges: [], quests: [], level: 1, full: null, lad: LADDER_V };
    newB.forEach((b) => seen.badges.indexOf(b.id) < 0 && seen.badges.push(b.id));
    const wk = 'w' + g.week + ':';
    seen.quests = seen.quests.filter((id) => id.indexOf(wk) === 0);
    newQ.forEach((q) => seen.quests.indexOf(q.id) < 0 && seen.quests.push(q.id));
    if (lvlUp) seen.level = Math.max(seen.level, g.level.n);
    if (perfect) seen.full = tk;
    s.seen = seen;
  });
  let items: CelItem[] = [];
  if (lvlUp) items.push({ type: 'level', level: g.level, from: fromLvl, evolve: formOfLevel(g.level.n) > formOfLevel(fromLvl) });
  newB.forEach((b) => items.push({ type: 'badge', b }));
  newQ.forEach((q) => items.push({ type: 'quest', q }));
  if (perfect) items.push({ type: 'perfect', n: g.tally.t });
  if (quiet) items = items.map((it) => ({ ...it, quiet: true }));
  const MAXC = 4;
  if (items.length > MAXC) {
    const rest = items.length - (MAXC - 1);
    items = items.slice(0, MAXC - 1);
    items.push({ type: 'more', title: 'And ' + rest + ' more', sub: 'Open Milestones to see everything you have earned.' });
  }
  return { st: next, items };
}
export const celTitle = (it: CelItem) =>
  it.type === 'level'
    ? 'Level ' + it.level.n + ': ' + it.level.name
    : it.type === 'badge'
      ? 'New badge: ' + it.b.name
      : it.type === 'quest'
        ? 'Quest done: ' + it.q.name
        : it.type === 'perfect'
          ? 'All ' + it.n + ' wins today'
          : it.title || 'Nice';

/** what the count keeps, called whenever the log or the settings change: the day this person first opened the one-count rule
    (countFrom: slips up to it keep the rule they were made under, runLedger), and the longest run ever shown, so that
    switching how days count never lowers it. Gives back the settings to save, or null when nothing moved. */
export function keepCounts(days: Days, st: Settings, tk: DayKey): Settings | null {
  const longest = runLedger(days, st, tk).longest;
  const stamp = !isKey(st.countFrom);
  /* the floor waits for seen (seenBaseline): a seen made up here would make every earned badge look new */
  const raise = !!st.seen && longest > (st.seen.longest || 0);
  if (!stamp && !raise) return null;
  return changeSettings(st, (s) => {
    if (stamp) s.countFrom = tk;
    if (raise && s.seen) s.seen = { ...s.seen, longest };
  });
}

/* ---------- what an action just earned (legacy winSnap, winNote, winWhy) ---------- */
const dpMap = (days: Days, key: DayKey, st: Settings) => {
  const o: Record<string, number> = {};
  dayPoints(days, key, st).parts.forEach((x) => (o[x.k] = x.pts));
  return o;
};
/** the points gained between two logs, on the days that changed (and the day after each: the morning questions count there) */
/** Points are never taken away (CLAUDE.md). Before a change that lowers them (an entry deleted, a ride changed to a
    slip), the points shown until now are kept as a floor (seen.pts), so the total and the level hold. Gives back the
    settings with that floor, or null when the points did not go down. A take-back (Undo right after a mistaken log) does
    not call this: those points were never really earned. */
export function keepPoints(before: Days, after: Days, st: Settings, reviews: Reviews, tk: DayKey): Settings | null {
  const was = gameCompute(before, st, reviews, tk).pts;
  if (was <= (st.seen?.pts || 0)) return null;
  if (gameCompute(after, st, reviews, tk).pts >= was) return null;
  return changeSettings(st, (s) => {
    s.seen = { ...(s.seen || { badges: [], quests: [], level: 1, full: null, lad: LADDER_V }), pts: was };
  });
}

export function winGain(before: Days, after: Days, st: Settings, keys: DayKey[]) {
  const by: Record<string, number> = {};
  let pts = 0;
  let ev = false;
  for (const key of keys) {
    for (const k of [key, addDays(key, 1)]) {
      const b = dpMap(before, k, st);
      const a = dpMap(after, k, st);
      Object.keys(a).forEach((x) => {
        const d = a[x] - (b[x] || 0);
        if (d > 0) {
          by[x] = (by[x] || 0) + d;
          pts += d;
        }
      });
    }
    if ((after[key]?.events.length || 0) > (before[key]?.events.length || 0)) ev = true;
  }
  return { pts, by, ev };
}
/* the sunrise check is coming back now (rekindle.ts srDone): Today marks it as it opens, so its word says what happened */
const WHY: Record<string, string> = { ...(WIN_WHY as Record<string, string>), sunrise: 'You came back' };
export function winWhy(by: Record<string, number>, quiet: boolean): string {
  if (quiet) return 'Logged. That took honesty.';
  const ks = Object.keys(by).sort((x, y) => by[y] - by[x]);
  return (
    ks
      .slice(0, 2)
      .map((k) => WHY[k] || 'Nice work')
      .join(' · ') || 'Nice work'
  );
}

/* ---------- the twelve forms of the flame (legacy growthPath and sheetGrowth) ---------- */
export const stageState = (i: number, lvl: Level) => (i < lvl.stage ? 'done' : i === lvl.stage ? 'now' : 'later');
export const stagePts = (i: number) => LEVELS[i * STEPS][0];
/** the picture for a form: the grown one if you are past it, today's if you are in it, the first one if it is ahead */
export const stageLevel = (i: number, lvl: Level) => {
  const s = stageState(i, lvl);
  return s === 'done' ? i * STEPS + STEPS : s === 'now' ? lvl.n : i * STEPS + 1;
};

/* ---------- who you are, in numbers ----------
   The counts Daybook already keeps, said as who the person is, never as a score: "You are someone who rides out urges."
   Every one only goes up. A line shows once its count is one or more. */
export interface IdLine {
  ic: string;
  who: string;
  n: string;
}
export function identityLines(days: Days, st: Settings, reviews: Reviews, tk: DayKey): IdLine[] {
  const S0 = gameCompute(days, st, reviews, tk).S;
  const num = (v: unknown) => (typeof v === 'number' ? v : 0);
  const S = { rode: num(S0.rode), slips: num(S0.slips), lessons: num(S0.lessons), checkins: num(S0.checkins) };
  const comebacks = rkComebackCount(days, st, tk);
  const held = hardHeld(days);
  const times = (n: number, one: string, many: string) => n + ' ' + (n === 1 ? one : many);
  const out: (IdLine | null)[] = [
    S.rode ? { ic: 'wave', who: 'You are someone who rides out urges.', n: times(S.rode, 'time', 'times') } : null,
    S.slips ? { ic: 'leaf', who: 'You are someone who tells the truth, even about a slip.', n: times(S.slips, 'slip', 'slips') + ', every one logged' } : null,
    comebacks ? { ic: 'sunrise', who: 'You are someone who comes back after a hard night.', n: times(comebacks, 'comeback', 'comebacks') } : null,
    held ? { ic: 'shield', who: 'You are someone who gets through the hard hours.', n: times(held, 'time', 'times') } : null,
    S.lessons ? { ic: 'book', who: 'You are someone who learns how this works.', n: times(S.lessons, 'lesson', 'lessons') + ' finished' } : null,
    S.checkins ? { ic: 'pencil', who: 'You are someone who looks honestly at the day.', n: times(S.checkins, 'check-in', 'check-ins') } : null,
  ];
  return out.filter((x): x is IdLine => !!x);
}

/** what stays on the record, in every mode, said the same way: the longest run and the days with no slip in all. Shown from two
    days on, so a first day is not a record yet. */
export function recordLines(days: Days, st: Settings, tk: DayKey): IdLine[] {
  const longest = computeMetrics(days, st, tk).longest;
  const noSlip = runLedger(days, st, tk, 'strict', true).clean;
  return [
    longest >= 2 ? { ic: 'flame', who: 'You are someone who can go the distance.', n: 'Longest run: ' + longest + ' days' } : null,
    noSlip >= 2 ? { ic: 'sun', who: 'You are someone who has days free of it.', n: noSlip + ' no-slip days, all on your record' } : null,
  ].filter((x): x is IdLine => !!x);
}

/** the hours given back so far: the days with no slip since Day 1, at the pace the person told the setup (obHours).
    null without a Day 1, without those answers, or before the first hour. It only goes up: a slip takes nothing back. */
export function hoursBack(days: Days, st: Settings, tk: DayKey): number | null {
  const H = st.onb && st.onb.a ? obHours(st.onb.a) : null;
  const d1 = isKey(st.day1) ? (st.day1 as DayKey) : null;
  if (!H || !d1 || d1 >= tk) return null;
  const slips = new Set(
    eventsOf(days)
      .filter((e) => e.outcome === 'slipped')
      .map((e) => e.key),
  );
  let n = 0;
  for (let k = d1; k < tk; k = addDays(k, 1)) if (!slips.has(k) && dayKnown(days, st, k, tk) && !awaySlipDay(days, st, k, tk)) n++;
  const h = (n * H.yr) / 365;
  return h >= 1 ? obRnd(h) : null;
}
