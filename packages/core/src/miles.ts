/* Milestones: badges, the forms of the flame, and what Milestones shows. Ported from the legacy rewardsBody, sheetBadge,
   sheetGrowth and badgeDone. */
import type { Badge } from './legacy/core.js';
import type { Settings } from './types';
import { addDays, dayPoints, gameCompute, runLedger, WIN_WHY, type Quest } from './legacy/core.js';
import { formOfLevel, LADDER_V, LEVELS, STEPS, type Level } from './levels';
import { changeSettings } from './actions';
import type { DayKey, Days, Reviews } from './types';

/** a badge stays earned once it was seen earned, even if an old entry is changed later */
export const badgeDone = (b: Badge, st: Settings | null) => b.done || !!(st && st.seen && st.seen.badges.indexOf(b.id) >= 0);
/** the badges about weekly quests, which were retired: shown only to someone who earned them */
export const RETIRED_BADGES = ['quest-1', 'quest-3'];
export const shownBadges = <B extends Badge>(bs: B[], st: Settings | null) => bs.filter((b) => RETIRED_BADGES.indexOf(b.id) < 0 || badgeDone(b, st));

/* ---------- what is new since last time: levels, badges, quests, a full ring (legacy checkNew, ensureSeen, reseat) ---------- */

export type CelItem =
  | { type: 'level'; level: Level; from: number; evolve: boolean; quiet?: boolean }
  | { type: 'badge'; b: Badge; quiet?: boolean }
  | { type: 'quest'; q: Quest; quiet?: boolean }
  | { type: 'perfect'; n: number; quiet?: boolean }
  | { type: 'saved'; run: number; quiet?: boolean }
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
          : it.type === 'saved'
            ? 'Run saved: ' + it.run + ' day' + (it.run === 1 ? '' : 's')
            : it.title || 'Nice';

/** the days whose run was saved by finishing the Rekindle quest (a new one gets its own moment) */
export const savedRuns = (days: Days, st: Settings, tk: DayKey) => {
  const L = runLedger(days, st, tk);
  return { saved: Object.keys(L.kind).filter((k) => L.kind[k] === 'saved'), cur: L.cur };
};

/* ---------- what an action just earned (legacy winSnap, winNote, winWhy) ---------- */
const dpMap = (days: Days, key: DayKey, st: Settings) => {
  const o: Record<string, number> = {};
  dayPoints(days, key, st).parts.forEach((x) => (o[x.k] = x.pts));
  return o;
};
/** the points gained between two logs, on the days that changed (and the day after each: the morning questions count there) */
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
export function winWhy(by: Record<string, number>, quiet: boolean): string {
  if (quiet) return 'Logged. That took honesty.';
  const ks = Object.keys(by).sort((x, y) => by[y] - by[x]);
  return (
    ks
      .slice(0, 2)
      .map((k) => (WIN_WHY as Record<string, string>)[k] || 'Nice work')
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
