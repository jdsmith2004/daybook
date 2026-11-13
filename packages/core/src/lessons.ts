/* Lessons: the one order they are offered in (a section at a time), which are done, the path walked in that order (one
   lesson opens at a time: lessonWalk, lessonGate, the welcome back for a lesson read early), the cards of a Quick or Full
   read, and the checkpoints. The practice step at the end of each lesson is in practice.ts. The legacy helpers
   read the global Store; here the log and the settings are passed in. The lesson content itself (LESSONS, LUNITS, SRC,
   LCHECKS) was copied from the legacy app into legacy/core.js. Checked by test/lessons.test.ts and test/families.test.ts. */
import { addDays, diffDays, fmtDate, LESSON_IDS, LESSONS, LUNITS, eventsOf, topTrigger, busiestWindow, LCHECK_N, SLIP_STEPS } from './legacy/core.js';
import { PATH_STEPS, stepAt } from './steps';
import { habitOf, type Habit } from './habit';
import { habitOpen, habitOwn, PORN_ONLY } from './lesson-habit';
import { changeDay, withDay } from './mutate';
import { changeSettings } from './actions';
import { morningOf } from './morning-set';
import { blankP } from './legacy/core.js';
import type { DayKey, Days, Play, Settings } from './types';
import type { MineKind } from './lesson-turns';

/* ---------- the shapes ---------- */
export type Block = ['p', string] | ['q', string] | ['l', string[]] | ['plan'] | ['rbox'] | ['mylog'] | ['words'] | ['mine', MineKind];
export type Art =
  | ['icon', { ic?: string }]
  | ['chain', { n?: string[]; i?: string[] }]
  | ['wave', { al?: string }]
  | ['big', { n: string; s?: string }]
  | ['snow', { a?: string; b?: string; al?: string }]
  | ['loop', { n?: string[]; c?: string }]
  | ['shield', Record<string, never>]
  /** the pictures behind a turn (lesson-turns.ts): steps that fill up feeling ready, wanting outgrowing liking, one slip in a row of days */
  | ['ready', Record<string, never>]
  | ['want', Record<string, never>]
  | ['dots', Record<string, never>]
  /** a path that dips one day and climbs on, memory against the log, blocks filling the picture screen, two rooms, a rule
      against a fact, closeness in turns, the road home, and a side gate passed by */
  | ['path' | 'memory' | 'screen' | 'rooms' | 'rule' | 'turns' | 'home' | 'gate', Record<string, never>]
  /** one of the moving research pictures from Talk it through (talk.ts) or Rekindle (rekindle-learn.ts), by its key */
  | ['research', { k: string }];
export interface Guess {
  min: number;
  max: number;
  step?: number;
  unit: string;
  ans: number;
  lo: number;
  hi: number;
  ticks?: number[];
  big?: string;
  cap?: string;
  rv?: { h?: string; b?: string };
}
export interface Card {
  /** flip: a turn (lesson-turns.ts), h on the front and see on the back */
  k: 'text' | 'choose' | 'guess' | 'try' | 'flip';
  q?: 1;
  e?: string;
  el?: string;
  art?: Art;
  h: string;
  b?: Block[];
  so?: string;
  fact?: { s: string; i?: number[] };
  ask?: string;
  a?: number;
  c?: [string, string][];
  sv?: boolean;
  p?: string;
  g?: Guess;
  go?: Go[];
  /** on a flip card: what is on the back */
  see?: string;
  /** an earlier lesson this card builds on, by id */
  back?: string;
}
export interface Go {
  t: string;
  a: 'scene' | 'tab' | 'help' | 'growth' | 'week' | 'talk';
  v?: string;
  sub?: string;
  open?: string;
  ic?: string;
  text?: string;
  o?: Record<string, unknown>;
}
export interface Lesson {
  id: string;
  u: number;
  v?: number;
  title: string;
  tag: string;
  ic: string;
  mins?: number;
  ask?: string;
  key: string;
  np: string;
  cards: Card[];
  /** the old review question, no longer asked (the owner, November 1, 2026). Kept only until the question rewrite, which reuses its best scenarios (docs/plan.md). */
  rc?: { q: string; c: string[]; a: number; r: string; cr?: string[] };
  scope?: string;
  /** [name: topic, url, who?, topic?] */
  src: [string, string, string?, string?][];
  chk?: string;
  f?: boolean;
  care?: boolean;
}
export interface Unit {
  name: string;
  sub: string;
  tone: string;
  cls: string;
  faith?: boolean;
}

/* ---------- which, and in what order ---------- */
export const lessonById = (id: string | null | undefined) => LESSONS.find((l) => l.id === id) || null;
export const lessonIndex = (L: Lesson) => LESSONS.indexOf(L);
/** the lesson as it sits in LESSONS: a God lesson read in another voice (lesson-beats.ts lessonVoiced) is its own object, and
    the path finds a lesson by the one in LESSONS */
const own = (L: Lesson): Lesson => lessonById(L.id) || L;

/** lessons finished, by id (from each day's p.ls) */
export function lessonsDone(days: Days): Set<string> {
  const set = new Set<string>();
  Object.keys(days).forEach((k) => {
    const p = days[k] && days[k].p;
    if (p && p.ls) p.ls.forEach((id) => LESSON_IDS.indexOf(id) >= 0 && set.add(id));
  });
  return set;
}

/* ---------- families: one hard idea, taught four ways ---------- */
/** each hard idea is taught by a few lessons from different directions (the science, a scene, a practice, your own log). The
    newer two are each a section of the path; the first two come back across sections */
export interface LessonFamily {
  id: string;
  name: string;
  ids: string[];
}
export const LESSON_FAMILIES: LessonFamily[] = [
  { id: 'urges', name: 'Urges pass', ids: ['l2', 'l14', 'l27'] },
  { id: 'slip', name: 'A slip is not who you are', ids: ['l3', 'l5', 'l6', 'l32'] },
  { id: 'hard', name: 'Why it is hard to stop', ids: ['l33', 'l34', 'l35', 'l36'] },
  { id: 'become', name: 'Becoming someone new', ids: ['l37', 'l38', 'l39', 'l40'] },
];
/** the family a lesson belongs to, and where it sits in it */
export function lessonFamily(L: Lesson): { f: LessonFamily; n: number; of: number } | null {
  const f = LESSON_FAMILIES.find((x) => x.ids.indexOf(L.id) >= 0);
  return f ? { f, n: f.ids.indexOf(L.id) + 1, of: f.ids.length } : null;
}

/** the one order the lessons are offered in, the same for everyone: the twelve steps (steps.ts, the owner, November 2,
    2026), a step at a time, each with its own color and land, so the numbers never jump. A lesson on no step (OFF_PATH)
    stays in Learn and opens from there. */
let PATH: Lesson[] | null = null;
export function lessonPath(): Lesson[] {
  if (!PATH) PATH = PATH_STEPS.flatMap((s) => s.ids.map((id) => lessonById(id)).filter((L): L is Lesson => !!L));
  return PATH;
}
/** the step a lesson is on (an index in PATH_STEPS), or -1 off the path */
export const lessonStep = (L: Lesson) => stepAt(L.id);
/** the name and color a lesson shows: its step's, or for a lesson off the path, its own section's */
export const lessonUnit = (L: Lesson): { name: string; tone: string } => {
  const k = stepAt(L.id);
  return k >= 0 ? PATH_STEPS[k] : LUNITS[L.u];
};
/** the orders the path had before, oldest first. A lesson finished in one of them was on the path when it was read, so it
    stays finished where it now sits, with no welcome back (lessonsEarly). Before October 30, 2026 (the first 45 lessons):
    a section at a time, in this order of LUNITS. From October 30 to November 2, 2026: How it works, Why it is hard to stop
    and Becoming someone new first, then the rest. Inside a section, lessons kept their order in LESSONS. */
const PAST_ORDERS: { units: number[]; n: number }[] = [
  { units: [0, 8, 1, 2, 7, 3, 4, 9, 5, 6], n: 45 },
  { units: [0, 8, 9, 3, 7, 1, 2, 4, 6, 5], n: 49 },
];
let PATHS_BEFORE: Lesson[][] | null = null;
/** the past paths (PAST_ORDERS), each in full */
export function lessonPathsBefore(): Lesson[][] {
  if (!PATHS_BEFORE) PATHS_BEFORE = PAST_ORDERS.map((o) => o.units.flatMap((u) => LESSONS.slice(0, o.n).filter((L: Lesson) => L.u === u)));
  return PATHS_BEFORE;
}
/** the setup's "Does faith play a part?" answered No: the faith lessons leave this person's path (the owner, October 30,
    2026). Yes, Somewhat and a skipped answer change nothing: for them the faith lessons stay first-class on the path. */
export const faithOut = (st: Settings | null | undefined) => !!(st && st.onb && st.onb.a && st.onb.a.faith === 'no');
/** Yes or Somewhat to "Does faith play a part?": each step ends in its God lesson (steps.ts god; the owner, November 2, 2026).
    A skipped answer, or one given before the question, does not: God comes in by the person's own choice, in Settings too. */
export const godOn = (st: Settings | null | undefined) => {
  const f = st && st.onb && st.onb.a && st.onb.a.faith;
  return f === 'big' || f === 'some';
};
/** a God lesson (g1 to g12) */
export const isGod = (L: Lesson) => /^g\d+$/.test(L.id);
/** the lessons written for porn only (the owner, November 8, 2026): their live words name porn or sex, or rest on a porn study.
    For someone quitting another habit they leave the path, Learn and every link, the way the faith lessons leave it for a No
    (faithOut), unless lesson-habit.ts HABIT_OPEN opens one for that habit, in its words. A lesson of one habit only
    (HABIT_ONLY) is off every other path, porn's too. One finished before the habit changed stays finished and counted
    (lessonCount), with its points. A new lesson is for porn only until it is checked and left off this list. */
export { PORN_ONLY };
/** this lesson is for this habit */
const habitFits = (id: string, h: Habit) => (!PORN_ONLY.has(id) || habitOpen(id, h)) && habitOwn(id, h);
/** this lesson is not for this person's habit */
export const habitOff = (L: Lesson | null | undefined, st: Settings | null | undefined) => !!L && !habitFits(L.id, habitOf(st));
/** a lesson to link to, or null when it is not for this person's habit: every link to a lesson goes through this */
export const lessonFor = (id: string | null | undefined, st: Settings | null | undefined) => {
  const L = lessonById(id);
  return L && !habitOff(L, st) ? L : null;
};
/** off this person's path by choice: faith said No, or the lesson was written for another habit */
const offFor = (st: Settings | null | undefined) => {
  const out = faithOut(st);
  const h = habitOf(st);
  return (L: Lesson) => (out && !!L.f) || !habitFits(L.id, h);
};
let NO_FAITH: { from: Lesson[]; list: Lesson[] } | null = null;
let WITH_GOD: { from: Lesson[]; list: Lesson[] } | null = null;
/** this person's path: lessonPath, in its order, without the faith lessons when they answered No, and with each step's God
    lesson last in it when they answered Yes or Somewhat. A lesson off the path keeps its id, opens in full from Learn
    (lessonGate), and stays finished and counted (lessonCount). */
export function lessonPathFor(st: Settings | null | undefined): Lesson[] {
  const base = lessonPathBase(st);
  const v = frontKind(st);
  if (v === 'none') return base;
  let m = PERSONAL.get(base);
  if (!m) PERSONAL.set(base, (m = new Map()));
  const key = v + '|' + LESSONS.length;
  let list = m.get(key);
  if (!list) m.set(key, (list = personalPath(base, st, v)));
  return list;
}
/** the path from faith and habit alone, before the two setup answers put a front track first (lessonPathFor). It is also an order
    the path had before, so a lesson finished in it is never read as early (lessonsEarly). */
export function lessonPathBase(st: Settings | null | undefined): Lesson[] {
  const list = lessonPathFaith(st);
  const h = habitOf(st);
  if (h === 'porn') return list;
  let c = FOR_HABIT.get(h);
  if (!c || c.from !== list) FOR_HABIT.set(h, (c = { from: list, list: habitPath(list, h) }));
  return c.list;
}

/* ---------- the front track (WP11, "Lessons that meet the night", the owner's review of November 12, 2026) ----------
   Two setup answers pick the first lessons: how often it happens (freq) and when it pulls hardest (when). Someone who said about
   once a day or more and late at night, in bed, gets a night track first: the lessons written for his night (the morning self and
   the night self, the cue, where the phone sleeps, a plan made in the day, late and low), then "You do not need to feel ready" and
   "Why one slip snowballs". The rest of the path follows in its own order, without them. "When values and habits clash" speaks to a
   rare slip, so for anyone who said most days it moves after the first week (after "What getting free feels like"). Everyone else
   keeps the path as it was. Faith and habit still decide what is on it: a lesson not for this person is never put in the track. */
export type FrontKind = 'none' | 'most' | 'night';
/** how many lessons the front track holds: the first week, one a day, and the lessons open without an account (LEARN_FREE) */
export const FRONT_N = 7;
/** the night track, in the order it is read when all are there. l54 and l55 are new (lessons-night.ts): until they are, l20 and
    l10 take their places. */
export const NIGHT_TRACK = ['l54', 'l34', 'l55', 'l20', 'l10', 'l9', 'l4'];
const NIGHT_FIRST = ['l54', 'l34', 'l55', 'l9', 'l4'];
const NIGHT_SPARE = ['l20', 'l10'];
/** after the night lessons, the two that hold hope for someone slipping most nights */
const NIGHT_HOPE = ['l1', 'l3'];
/** the lesson for a rare slip, moved after the first week for someone who said most days */
export const RARE_SLIP_LESSON = 'l22';
const answers = (st: Settings | null | undefined) => (st && st.onb && st.onb.a) || {};
/** about once a day or more (setup.ts obMostDays) */
export const saidMostDays = (st: Settings | null | undefined) => {
  const f = answers(st).freq;
  return f === 'f3' || f === 'f4';
};
/** "Late at night, in bed" was one of the hardest moments picked */
export const saidLateNight = (st: Settings | null | undefined) => {
  const w = answers(st).when;
  return Array.isArray(w) && w.indexOf('late') >= 0;
};
export const frontKind = (st: Settings | null | undefined): FrontKind => (!saidMostDays(st) ? 'none' : saidLateNight(st) ? 'night' : 'most');
const PERSONAL = new Map<Lesson[], Map<string, Lesson[]>>();
/** the land (a step, an index in PATH_STEPS) each lesson of a personal path stands in on the map: the front track in the first
    land, a moved lesson in the land it was moved into, the rest in their own step */
const LANDS = new WeakMap<Lesson[], Map<string, number>>();
/** the front track of a personal path (its first FRONT_N lessons, or none) */
const FRONTS = new WeakMap<Lesson[], Set<string>>();
/** the front track for this person: the first lessons of their path, picked by their answers. Empty when they get the path as it was. */
export const frontTrack = (st: Settings | null | undefined): Lesson[] => {
  const path = lessonPathFor(st);
  const f = FRONTS.get(path);
  return f ? path.filter((L) => f.has(L.id)) : [];
};
function personalPath(base: Lesson[], st: Settings | null | undefined, v: FrontKind): Lesson[] {
  const off = offFor(st);
  const fit = (id: string) => {
    const L = lessonById(id);
    return L && !off(L) ? L : null;
  };
  const front: Lesson[] = [];
  if (v === 'night') {
    const night = NIGHT_FIRST.map(fit).filter((L): L is Lesson => !!L);
    NIGHT_SPARE.forEach((id) => {
      const L = fit(id);
      if (L && night.length < FRONT_N - NIGHT_HOPE.length) night.push(L);
    });
    night.sort((a, b) => NIGHT_TRACK.indexOf(a.id) - NIGHT_TRACK.indexOf(b.id));
    front.push(...night, ...NIGHT_HOPE.map(fit).filter((L): L is Lesson => !!L));
    /* a path with fewer night lessons (another habit) is filled from the start of its own order */
    for (const L of base) {
      if (front.length >= FRONT_N) break;
      if (!isGod(L) && L.id !== RARE_SLIP_LESSON && front.indexOf(L) < 0) front.push(L);
    }
  }
  const lands = new Map<string, number>();
  front.forEach((L) => lands.set(L.id, 0));
  const rest = base.filter((L) => front.indexOf(L) < 0);
  const rare = rest.find((L) => L.id === RARE_SLIP_LESSON);
  if (rare) {
    rest.splice(rest.indexOf(rare), 1);
    /* after the first week: after the last lesson of the second step that is not its God lesson, or after the first week's lessons */
    let at = -1;
    rest.forEach((L, i) => {
      if (stepAt(L.id) === 1 && !isGod(L)) at = i;
    });
    if (at < 0) at = Math.max(0, FRONT_N - front.length - 1);
    rest.splice(at + 1, 0, rare);
    lands.set(rare.id, at >= 0 && rest[at] ? landIn(rest[at], lands) : 0);
  }
  const list = [...front, ...rest];
  LANDS.set(list, lands);
  if (front.length) FRONTS.set(list, new Set(front.map((L) => L.id)));
  return list;
}
const landIn = (L: Lesson, lands: Map<string, number>) => (lands.has(L.id) ? lands.get(L.id)! : stepAt(L.id));
const FOR_HABIT = new Map<Habit, { from: Lesson[]; list: Lesson[] }>();
/** a path for another habit: the lessons for it, each step's own lessons for this habit (steps.ts habit) after the rest of
    the step, and its God lesson still last */
function habitPath(list: Lesson[], h: Habit): Lesson[] {
  const fits = list.filter((L) => habitFits(L.id, h));
  return PATH_STEPS.flatMap((s, k) => {
    const mine = fits.filter((L) => stepAt(L.id) === k);
    const own = ((s.habit && s.habit[h]) || []).map((id) => lessonById(id)).filter((L): L is Lesson => !!L);
    return [...mine.filter((L) => !isGod(L)), ...own, ...mine.filter(isGod)];
  });
}
function lessonPathFaith(st: Settings | null | undefined): Lesson[] {
  const path = lessonPath();
  if (godOn(st)) {
    if (!WITH_GOD || WITH_GOD.from !== path)
      WITH_GOD = {
        from: path,
        list: PATH_STEPS.flatMap((s) => [...s.ids, s.god].map((id) => lessonById(id)).filter((L): L is Lesson => !!L)),
      };
    return WITH_GOD.list;
  }
  if (!faithOut(st)) return path;
  if (!NO_FAITH || NO_FAITH.from !== path) NO_FAITH = { from: path, list: path.filter((L) => !L.f) };
  return NO_FAITH.list;
}
/** a path in its steps: u is the step (an index in PATH_STEPS) */
export const sectionsOf = (path: Lesson[]) => {
  const out: { u: number; lessons: Lesson[] }[] = [];
  const lands = LANDS.get(path);
  path.forEach((L) => {
    const u = lands ? landIn(L, lands) : lessonStep(L);
    const last = out[out.length - 1];
    if (last && last.u === u) last.lessons.push(L);
    else out.push({ u, lessons: [L] });
  });
  return out;
};
/** the path in its steps, with their lessons in order */
export const lessonSections = (st?: Settings | null) => sectionsOf(lessonPathFor(st));
/** the number a person sees for a lesson: its place on the path (so Up next after lesson 2 is lesson 3). lessonIndex
    stays the lesson's fixed place in LESSONS, for checkpoints and stored records. */
export const lessonNo = (L: Lesson, st?: Settings | null) => lessonPathFor(st).indexOf(own(L)) + 1;
/** the first lesson on the path not finished. Up next is lessonWalk().next, which also stops at a lesson read early. */
export const firstUndone = (done: Set<string>, st?: Settings | null) => lessonPathFor(st).find((l) => !done.has(l.id)) || null;

/* ---------- the path, walked in order (the owner, October 24, 2026) ----------
   Lessons open one at a time, in the order of the path: Up next, and every lesson behind it (reading one again is always
   allowed). A lesson further on opens as its key idea only (lessonGate), and nothing finished ever shows past Up next.
   Before this, any lesson could be opened from a help page, a check-in or a review. A lesson finished that way stays
   finished, with its points; the path walks up to it like any other lesson, and there it opens as a short welcome back
   (passed with lessonReach, which earns nothing and counts nothing twice). */

/** lessons finished before the path reached them: at the moment each was first finished, some lesson before it on the
    path was not finished yet, in the order of today and in every order the path had before (lessonPathsBefore). Read from
    the record, in the order lessons were finished (by day, then within the day). */
export function lessonsEarly(days: Days, st?: Settings | null): Set<string> {
  const off = offFor(st);
  const path = lessonPathFor(st);
  /* the path from faith and habit alone is an order this person had before the front track (lessonPathFor) */
  const base = lessonPathBase(st);
  const befores = [...lessonPathsBefore().map((p) => p.filter((L) => !off(L))), ...(base !== path ? [base] : [])];
  const fin = new Set<string>();
  const early = new Set<string>();
  /** every lesson before it on this path was finished. A God lesson is not waited for here: it came later, or is passed by
      (godPassed), so finishing past one is never early. */
  const reached = (p: Lesson[], L: Lesson) => {
    const i = p.indexOf(L);
    return i >= 0 && p.slice(0, i).every((x) => fin.has(x.id) || isGod(x));
  };
  const hookRead = (L: Lesson, k: DayKey) => {
    if (!HOOK_IDS.has(L.id) || ((days[k] && days[k].p && days[k].p.ls) || [])[0] !== L.id) return false;
    const h = hookPick(days, st, k, fin, path, true);
    return !!h && h.L === L;
  };
  lessonsInOrder(days).forEach(({ L, k }) => {
    /* a lesson off this person's path is never waited for, so it is never early; nor is one a moment brought (lessonToday) as the
       first lesson of its day: it counts as done, and the path walks past it later with no welcome back */
    if (path.indexOf(L) >= 0 && !reached(path, L) && !befores.some((b) => reached(b, L)) && !hookRead(L, k)) early.add(L.id);
    fin.add(L.id);
  });
  return early;
}
/* ---------- a step's deed (steps.ts) ---------- */
/** the last lesson of each step on this person's path, by step index */
const stepEnds = (st: Settings | null | undefined) =>
  sectionsOf(lessonPathFor(st)).map((x) => ({ k: x.u, first: x.lessons[0], last: x.lessons[x.lessons.length - 1] }));
/** the step whose deed comes at the end of this lesson (its last lesson on this person's path), or -1 */
export function deedAfter(L: Lesson, st: Settings | null | undefined): number {
  const e = stepEnds(st).find((x) => x.last === own(L));
  return e ? e.k : -1;
}
/** what a step's deed asks, in this person's words: no God for someone who said No to faith */
export const deedWords = (k: number, st: Settings | null | undefined) => (faithOut(st) && PATH_STEPS[k].deedNoFaith) || PATH_STEPS[k].deed;
export const deedDone = (st: Settings | null | undefined, k: number) => !!(st && st.learn && st.learn.did && st.learn.did[PATH_STEPS[k].id]);
/** "I did it" (kept for good, with its day, which gives the deed's points) or "Not yet". Once done, a deed stays done. */
export function deedSet(st: Settings, k: number, a: 'did' | 'later', tk: DayKey, now = Date.now()): Settings {
  const id = PATH_STEPS[k].id;
  if (deedDone(st, k) || (a === 'later' && st.learn.later && st.learn.later[id])) return st;
  return changeSettings(
    st,
    (s) => {
      (s.learn[a] || (s.learn[a] = {}))[id] = tk;
    },
    now,
  );
}
/** the step to ask about once more as this lesson opens: it is the first lesson of a step not yet finished, the step before
    it on this person's path was walked to its end, and that step's deed was not done and not asked about yet. Never on the
    day of a slip or the day after. -1 when there is nothing to ask. */
export function deedAskBack(L: Lesson, days: Days, st: Settings, tk: DayKey): number {
  const ends = stepEnds(st);
  const i = ends.findIndex((x) => x.first === own(L));
  if (i < 1) return -1;
  const prev = ends[i - 1];
  const done = lessonsDone(days);
  if (done.has(L.id) || !done.has(prev.last.id) || deedDone(st, prev.k)) return -1;
  if (st.learn.asked && st.learn.asked[PATH_STEPS[prev.k].id]) return -1;
  const hard = eventsOf(days).some((e) => e.outcome === 'slipped' && (e.key === tk || e.key === addDays(tk, -1)));
  return hard ? -1 : prev.k;
}
/** the answer to the one ask back: either way, it is never asked again */
export function deedAnswer(st: Settings, k: number, did: boolean, tk: DayKey, now = Date.now()): Settings {
  const s1 = did ? deedSet(st, k, 'did', tk, now) : st;
  return changeSettings(
    s1,
    (s) => {
      (s.learn.asked || (s.learn.asked = {}))[PATH_STEPS[k].id] = 1;
    },
    now,
  );
}

/** the welcome backs already passed ("Keep going"), by lesson id (settings.learn.back) */
export const lessonsReached = (st: Settings | null | undefined): Set<string> => new Set(Object.keys((st && st.learn && st.learn.back) || {}));
export interface LessonWalk {
  /** finished, by id (lessonsDone) */
  done: Set<string>;
  /** finished before the path reached them (lessonsEarly) */
  early: Set<string>;
  /** early ones whose welcome back was passed */
  reached: Set<string>;
  /** every lesson behind Up next on the path, and any further on that was finished in the order before it changed: all
      are finished, and they open in full */
  walked: Set<string>;
  /** Up next: the first lesson on the path not finished, or finished early and not reached yet. null at the end. */
  next: Lesson | null;
  /** Up next was read early: it opens as a welcome back */
  back: boolean;
  /** this person's path (lessonPathFor) */
  path: Lesson[];
  /** God lessons not finished in a part of the path already walked past (they came after the person was further on, or
      faith was turned on later): they never hold the path back, open in full, and count once finished */
  passed: Set<string>;
  /** the day's lesson (lessonToday), when the walk was made for a day (lessonWalk with tk): a moment's lesson (hook), or Up next.
      It opens in full. null without a day, or at the end. */
  today: Lesson | null;
  /** the moment that brought today's lesson, or null when it is the path's own */
  hook: LessonHook | null;
}
const stopsAt = (L: Lesson, done: Set<string>, early: Set<string>, reached: Set<string>) => !done.has(L.id) || (early.has(L.id) && !reached.has(L.id));
/** the God lessons a person has walked past: unfinished, with a lesson after them on the path already finished */
function godPassed(path: Lesson[], done: Set<string>): Set<string> {
  const out = new Set<string>();
  let later = false;
  for (let i = path.length - 1; i >= 0; i--) {
    const L = path[i];
    if (isGod(L) && !done.has(L.id) && later) out.add(L.id);
    if (done.has(L.id)) later = true;
  }
  return out;
}
/** where the person is on the path. With a day (tk), the walk also holds that day's lesson (today, hook: lessonToday), which opens
    in full; account: signed in, or no accounts in this copy (a moment's lesson that waits behind one is not offered). */
export function lessonWalk(days: Days, st: Settings | null | undefined, tk?: DayKey, account = true): LessonWalk {
  const w = walkCore(days, st);
  if (!tk) return w;
  const h = hookFor(days, st, tk, w, account);
  return h ? { ...w, today: h.L, hook: h.hook } : { ...w, today: w.next, hook: null };
}
function walkCore(days: Days, st: Settings | null | undefined): LessonWalk {
  const done = lessonsDone(days);
  const early = lessonsEarly(days, st);
  const reached = lessonsReached(st);
  const path = lessonPathFor(st);
  const passed = godPassed(path, done);
  const at = path.findIndex((L) => !passed.has(L.id) && stopsAt(L, done, early, reached));
  const next = at < 0 ? null : path[at];
  const walked = new Set(path.filter((L, i) => !passed.has(L.id) && (at < 0 || i < at || (i > at && !stopsAt(L, done, early, reached)))).map((L) => L.id));
  return { done, early, reached, walked, next, back: !!next && done.has(next.id), path, passed, today: null, hook: null };
}
/** a walk from finished lessons only, with nothing read early: for a map or a test that has no record */
export function walkOf(done: Set<string>, st?: Settings | null): LessonWalk {
  const path = lessonPathFor(st);
  const passed = godPassed(path, done);
  const next = path.find((L) => !passed.has(L.id) && !done.has(L.id)) || null;
  const walked = new Set((next ? path.slice(0, path.indexOf(next)) : path).filter((L) => !passed.has(L.id)).map((L) => L.id));
  return { done, early: new Set(), reached: new Set(), walked, next, back: false, path, passed, today: null, hook: null };
}
/** "N of M done": the path, plus any lesson finished off it, which stays counted (a faith lesson read from Learn) */
export function lessonCount(w: LessonWalk): { done: number; of: number } {
  const off = [...w.done].filter((id) => !w.path.some((L) => L.id === id)).length;
  return { done: w.walked.size + off, of: w.path.length + off };
}
/** how a lesson opens: in full when it is Up next or behind it ('open'); as a welcome back when Up next was read early
    ('back'); else as its key idea, until the path reaches it ('key'). The account rule (accounts.ts lessonOpen) sits on
    top of 'open'. */
export type LessonGate = 'open' | 'back' | 'key';
export function lessonGate(L0: Lesson, w: LessonWalk): LessonGate {
  const L = own(L0);
  /* off this person's path: nothing to wait for, it opens from Learn when they choose it */
  if (w.path.indexOf(L) < 0) return 'open';
  if (w.walked.has(L.id) || w.passed.has(L.id)) return 'open';
  if (w.next === L) return w.back ? 'back' : 'open';
  /* the day's lesson a moment brought (lessonToday) opens in full where it stands */
  if (w.today === L) return 'open';
  return 'key';
}
/** what comes after this lesson: Up next, counting this one as reached. The same Up next as Today and the map. */
export function nextAfter(L0: Lesson, w: LessonWalk): Lesson | null {
  const L = own(L0);
  if (w.next !== L) return w.next;
  const path = w.path;
  return path.slice(path.indexOf(L) + 1).find((x) => !w.passed.has(x.id) && stopsAt(x, w.done, w.early, w.reached)) || null;
}
/** "Keep going" on a welcome back: the path moves past a lesson read early. A plain marker in the settings: no points,
    no lesson day, nothing counted twice. */
export const lessonReach = (st: Settings, id: string, now = Date.now()): Settings =>
  st.learn && st.learn.back && st.learn.back[id]
    ? st
    : changeSettings(
        st,
        (s) => {
          (s.learn.back || (s.learn.back = {}))[id] = 1;
        },
        now,
      );
/** what a lesson shows before it opens (the key idea card) and on its welcome back: the question it answers, when it
    has one, and the one thing to keep (L.key, the same line its Done card shows). The tag stands in, should a key be
    missing. */
export function lessonKeyIdea(L: Lesson): { ask: string; key: string } {
  const key = (L.key || '').trim() || L.tag;
  return { ask: (L.ask || '').trim(), key };
}
/** when each lesson was first finished, last opened, how many days it was read again, and which was touched most recently */
export function lessonStats(days: Days) {
  const first: Record<string, DayKey> = {};
  const last: Record<string, DayKey> = {};
  const again: Record<string, number> = {};
  const seq: Record<string, number> = {};
  let n = 0;
  Object.keys(days)
    .sort()
    .forEach((k) => {
      const p = days[k] && days[k].p;
      if (!p) return;
      (p.ls || []).forEach((id) => {
        if (!first[id]) first[id] = k;
        last[id] = k;
        seq[id] = ++n;
      });
      (p.lv || []).forEach((id) => {
        again[id] = (again[id] || 0) + 1;
        last[id] = k;
        seq[id] = ++n;
      });
    });
  return { first, last, again, seq };
}
/** the lessons in the order they were first finished (by day, then in order within the day), each with its day */
export function lessonsInOrder(days: Days): { L: Lesson; k: DayKey }[] {
  const out: { L: Lesson; k: DayKey }[] = [];
  const seen = new Set<string>();
  Object.keys(days)
    .sort()
    .forEach((k) => {
      const p = days[k] && days[k].p;
      ((p && p.ls) || []).forEach((id) => {
        const L = lessonById(id);
        if (!L || seen.has(id)) return;
        seen.add(id);
        out.push({ L, k });
      });
    });
  return out;
}
/** Learn as one timeline: what is finished, in the order it was finished; the lesson up next; and what is still to come,
    a section at a time, each with how many of its lessons are done */
export function lessonTimeline(days: Days, st: Settings | null = null) {
  const w = lessonWalk(days, st);
  const next = w.next;
  const coming = sectionsOf(w.path)
    .map((x) => ({
      u: x.u,
      n: x.lessons.length,
      done: x.lessons.filter((L) => w.walked.has(L.id)).length,
      left: x.lessons.filter((L) => !w.walked.has(L.id) && L !== next),
    }))
    .filter((x) => x.left.length);
  return { past: lessonsInOrder(days), next, coming };
}
/** once every lesson is finished, the day's lesson is a quick re-read, one a day in turn */
export const reviewPick = (tk: DayKey, st?: Settings | null) => {
  const off = offFor(st);
  const list = LESSONS.filter((L: Lesson) => !off(L) && !(isGod(L) && !godOn(st)));
  return list[Math.abs(diffDays(tk, '2026-01-01')) % list.length];
};

/* ---------- one lesson ---------- */
export const lessonHasQuick = (L: Lesson) => !!(L.cards && L.cards.some((c) => c.q === 1));
/** the length shown in lists */
export const lmin = (L: Lesson) => (lessonHasQuick(L) ? '1–5 min' : (L.mins || 3) + ' min');
export const lessonCore = (L: Lesson) => L.cards.filter((c) => c.k !== 'try');
export const lessonCards = (L: Lesson, len: 'q' | 'f' | null) => {
  const all = lessonCore(L);
  return len === 'q' && lessonHasQuick(L) ? all.filter((c) => c.q === 1) : all;
};
export type SeqItem = { t: 'card'; c: Card; ci: number } | { t: 'done' };
export function lessonSeq(L: Lesson, len: 'q' | 'f' | null): SeqItem[] {
  const out: SeqItem[] = [];
  lessonCards(L, len).forEach((c) => out.push({ t: 'card', c, ci: L.cards.indexOf(c) }));
  out.push({ t: 'done' });
  return out;
}
export const lxGraded = (c: Card) => Number.isInteger(c.a);
/** the words after a guess is locked in */
export function guessFeedback(g: Guess, v: number): string {
  const a = g.ans;
  const d = Math.abs(v - a);
  const u = g.unit;
  const close = d <= Math.max(g.step || 1, Math.round((g.max - g.min) * 0.04));
  return v === a
    ? 'Right on it.'
    : close
      ? `Close: you were within ${d} ${u}.`
      : v < a
        ? `You were ${d} ${u} under, and that is fine.`
        : `You were ${d} ${u} over, and that is fine.`;
}
export const lxPct = (g: Guess, x: number) => Math.max(0, Math.min(100, ((x - g.min) / (g.max - g.min)) * 100));

/* ---------- checkpoints: a longer piece of writing after every second lesson ----------
   Checkpoint n (LCHECKS[n - 1], its writing saved as settings.learn.wr['c' + n]) was written for two lessons: LESSONS
   2n - 2 and 2n - 1, always two lessons of one section, next to each other on the path. That pairing never changes, so
   writing stays with the lessons it is about. What follows the path is when a checkpoint comes (after the later of its two
   lessons is reached) and the number the person sees (lcheckNo: its place in the path's order of checkpoints). */
/** checkpoint n's two lessons, earlier and later on the path */
export function lcheckPair(n: number): { n: number; a: Lesson; b: Lesson } | null {
  const x = LESSONS[2 * n - 2];
  const y = LESSONS[2 * n - 1];
  if (!Number.isInteger(n) || n < 1 || n > LCHECK_N || !x || !y) return null;
  const path = lessonPath();
  /* b is the later of the two on the path, where Write it out comes; a lesson off the path (OFF_PATH) is always a */
  const ix = path.indexOf(x);
  const iy = path.indexOf(y);
  return iy >= 0 && (ix < 0 || ix < iy) ? { n, a: x, b: y } : { n, a: y, b: x };
}
/** checkpoint n is on for someone: neither of its two lessons is off their path by choice */
const lcheckOn = (n: number, off: (L: Lesson) => boolean) => {
  const p = lcheckPair(n);
  return !!p && !off(p.a) && !off(p.b);
};
let CHECKS: number[] | null = null;
/** the checkpoints (by n) in the order the path reaches them */
export function lcheckOrder(): number[] {
  if (!CHECKS) {
    const path = lessonPath();
    CHECKS = Array.from({ length: LCHECK_N }, (_, i) => i + 1)
      .filter((n) => lcheckPair(n))
      .sort((p, q) => path.indexOf(lcheckPair(p)!.b) - path.indexOf(lcheckPair(q)!.b) || p - q);
  }
  return CHECKS;
}
/** the number a person sees for checkpoint n: its place on the path */
export const lcheckNo = (n: number, st?: Settings | null) => {
  if (!faithOut(st) && habitOf(st) === 'porn') return lcheckOrder().indexOf(n) + 1;
  /* with lessons off the path, their checkpoints are not counted, so the numbers do not skip */
  const off = offFor(st);
  const on = lcheckOrder().filter((x) => lcheckOn(x, off));
  return on.indexOf(n) >= 0 ? on.indexOf(n) + 1 : lcheckOrder().indexOf(n) + 1;
};
/** the checkpoint that comes right after this lesson, when this is the later of its two */
export function lessonPairOf(L: Lesson) {
  for (let n = 1; n <= LCHECK_N; n++) {
    const p = lcheckPair(n);
    if (p && p.b === L) return p;
  }
  return null;
}
export const lcheckWritten = (st: Settings, n: number) => !!(st.learn && st.learn.wr && st.learn.wr['c' + n]);
/** the first checkpoint on the path whose two lessons are both reached and that is not written yet (0: none). Since the twelve
    steps (November 2, 2026), its two lessons can sit in different steps, and one can be off the path: that one counts once it
    is finished. */
export function lcheckDue(days: Days, st: Settings, w: LessonWalk = lessonWalk(days, st)): number {
  const reached = (L: Lesson) => w.walked.has(L.id) || (w.path.indexOf(L) < 0 && w.done.has(L.id));
  /* a checkpoint about a lesson written for porn never comes for another habit, even when both were finished before */
  const forHabit = (L: Lesson) => habitOff(L, st);
  for (const n of lcheckOrder()) {
    const p = lcheckPair(n)!;
    if (!lcheckOn(n, forHabit)) continue;
    if (reached(p.a) && reached(p.b) && !lcheckWritten(st, n)) return n;
  }
  return 0;
}
/** the two lessons a checkpoint is about, in words: "lessons 3 and 12", or a lesson off the path by its name */
export function lcheckAbout(p: { a: Lesson; b: Lesson }, st?: Settings | null): string {
  const a = lessonNo(p.a, st);
  const b = lessonNo(p.b, st);
  if (a && b) return 'lessons ' + a + ' and ' + b;
  return (b ? 'lesson ' + b : '“' + p.b.title + '”') + ' and ' + (a ? 'lesson ' + a : '“' + p.a.title + '”');
}
export const lwriteOf = (st: Settings, n: number): string[] => {
  const w = st.learn && st.learn.wr && st.learn.wr['c' + n];
  return w && Array.isArray(w.a) ? w.a : ['', '', ''];
};
export function lwriteSave(st: Settings, n: number, i: number, val: string, now = Date.now()): Settings {
  return changeSettings(
    st,
    (s) => {
      const l = s.learn;
      const w = l.wr || (l.wr = {});
      const cur = w['c' + n] && Array.isArray(w['c' + n].a) ? w['c' + n].a.slice() : ['', '', ''];
      cur[i] = String(val).slice(0, 1500);
      w['c' + n] = { a: cur, u: now };
    },
    now,
  );
}

/* ---------- the words inside a lesson ---------- */
/** lesson text: {loop} becomes the person's own loop, and **x** is bold. Gives back pieces to draw. */
export function lfmt(s: string, st: Settings | null): { t: string; b: boolean }[] {
  const loop = (st && st.loop && st.loop.trim()) || 'Fail → shame → hide → give up.';
  const text = String(s).replace(/\{loop\}/g, loop);
  const out: { t: string; b: boolean }[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let at = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > at) out.push({ t: text.slice(at, m.index), b: false });
    out.push({ t: m[1], b: true });
    at = m.index + m[0].length;
  }
  if (at < text.length) out.push({ t: text.slice(at), b: false });
  return out;
}
/** the person's own loop as 3 to 6 short steps, or null */
export function lxLoopNodes(st: Settings | null): string[] | null {
  const raw = ((st && st.loop) || '').trim();
  const parts = raw
    .split(/\s*(?:→|->|⇒|>)\s*/)
    .map((x) => x.replace(/[.!\s]+$/, '').trim())
    .filter(Boolean);
  return parts.length >= 3 && parts.length <= 6 && parts.every((x) => x.length <= 18) ? parts : null;
}
/** the urge plan rows that are filled in */
export const planRows = (st: Settings | null) => ((st && st.plan) || []).filter((r) => r.when && r.when.trim() && r.when.indexOf('______') < 0);
/** the slip plan: the person's own steps, or the default */
export const slipSteps = (st: Settings | null): string[] => (st && Array.isArray(st.slipPlan) ? st.slipPlan : (SLIP_STEPS as string[]));
/** what the person's own log shows, for the "mylog" block */
export function lessonLog(days: Days, st: Settings) {
  const evs = eventsOf(days);
  const rode = evs.filter((e) => e.outcome === 'rode').length;
  if (evs.length < 3) return { few: true as const, n: evs.length };
  const tt = topTrigger(evs, st.opts) as { t: string; n: number } | null;
  const bw = busiestWindow(evs, st.rollover);
  return { few: false as const, n: evs.length, rode, tt, bw };
}
/** a true line from the person's own log, for a turn's "Your own log" card (lesson-turns.ts). Counted on the phone, never sent anywhere.
    With nothing logged yet, it says what to watch for instead. */
export function lessonMine(k: MineKind, days: Days, st: Settings, tk: DayKey): string {
  const evs = eventsOf(days);
  const rode = evs.filter((e) => e.outcome === 'rode').length;
  const slips = evs.filter((e) => e.outcome === 'slipped').length;
  const n = (x: number, one: string, many: string) => x + ' ' + (x === 1 ? one : many);
  if (k === 'acted') {
    const ls = lessonsDone(days).size;
    const did = [ls ? n(ls, 'lesson read', 'lessons read') : '', evs.length ? n(evs.length, 'honest entry', 'honest entries') : ''].filter(Boolean);
    return did.length
      ? 'So far: ' + did.join(' and ') + '. You did ' + (ls + evs.length === 1 ? 'that' : 'those') + ' before you felt ready.'
      : 'You opened this lesson. That is a step, and you took it before you felt ready.';
  }
  if (k === 'hour') {
    const bw = evs.length >= 3 ? (busiestWindow(evs, st.rollover) as { label: string; n: number; total: number } | null) : null;
    return bw
      ? 'Your busiest hours are ' + bw.label + ': ' + bw.n + ' of your ' + bw.total + ' timed entries.'
      : 'Log the time of the next few urges. Within a week or two, your hours start to show.';
  }
  if (k === 'trigger') {
    const tt = evs.length >= 3 ? (topTrigger(evs, st.opts) as { t: string; n: number } | null) : null;
    return tt
      ? 'The reason you pick most is ' + tt.t.toLowerCase() + ', ' + n(tt.n, 'time', 'times') + '.'
      : 'Pick a reason on the next few entries. Within a week or two, your most common one shows.';
  }
  if (k === 'clean30') {
    const slipDays = new Set(evs.filter((e) => e.outcome === 'slipped').map((e) => e.key));
    const from = addDays(tk, -29);
    /* counted from the day they started, when that is less than 30 days ago */
    const began = [st.start, Object.keys(days).sort()[0]].filter(Boolean).sort()[0] as DayKey | undefined;
    const start = began && began > from ? began : from;
    const span = Math.max(1, diffDays(tk, start) + 1);
    let clean = 0;
    for (let i = 0; i < span; i++) if (!slipDays.has(addDays(start, i))) clean++;
    return span < 7
      ? 'You are ' + n(span, 'day', 'days') + ' in. In a few weeks, this counts the days that held.'
      : clean + ' of your last ' + span + ' days had no slip in them. Those days stay yours.';
  }
  if (k === 'rode')
    return rode
      ? 'You have ridden out ' + n(rode, 'urge', 'urges') + ' here. ' + (rode === 1 ? 'It ended.' : 'Every one of them ended.')
      : 'Next urge, log it when it starts, then notice when it ends. Every wave does.';
  return slips
    ? 'You have logged ' + n(slips, 'slip', 'slips') + ', and you came back after ' + (slips === 1 ? 'it' : 'every one') + '. You are here, reading this.'
    : 'No slips logged. If one comes, the thought to watch for is “I already blew it.”';
}
/** the note on the Behind this sheet */
export function srcNote(L: Lesson): string {
  return (
    'Checked ' +
    (L.chk || 'October 12, 2026') +
    '. ' +
    (isGod(L)
      ? 'Each source is kept to what it says, and scripture is named by its book, chapter and verse.'
      : L.f
        ? 'These summarize studies and well-known recovery programs, kept to what each source says. They are not religious teaching, and Daybook does not speak for any church or group.'
        : L.u === 6
          ? 'These summarize published studies and program materials, kept to what each source says.'
          : 'These are summaries of studies, kept to what each one found.') +
    ' Daybook is a self-tracking tool, not medical care.'
  );
}

/* ---------- saving ---------- */
/** a lesson finished: counted once by id on today's record (p.ls); one read again counts as today's lesson (p.lv). The time
    is kept too (p.lt), so the lesson reminder can come about then, a day later (nudges.ts). */
export function recordLesson(days: Days, tk: DayKey, L: Lesson, now = Date.now()): { days: Days; again: boolean } {
  const done = lessonsDone(days);
  if (done.has(L.id)) {
    const dp = days[tk]?.p;
    if (dp && ((dp.ls && dp.ls.indexOf(L.id) >= 0) || (dp.lv && dp.lv.indexOf(L.id) >= 0))) return { days, again: true };
    const day = changeDay(
      days[tk],
      tk,
      (d) => {
        const p = d.p || blankP();
        if (!p.lv) p.lv = [];
        if (p.lv.indexOf(L.id) < 0) p.lv.push(L.id);
        p.lt = now;
        d.p = p;
      },
      now,
    );
    return { days: withDay(days, tk, day), again: true };
  }
  const day = changeDay(
    days[tk],
    tk,
    (d) => {
      const p = d.p || blankP();
      if (!p.ls) p.ls = [];
      if (p.ls.indexOf(L.id) < 0) p.ls.push(L.id);
      p.lt = now;
      d.p = p;
    },
    now,
  );
  return { days: withDay(days, tk, day), again: false };
}
/** practiced is a plain marker: it earns no points */
export const lessonPracticed = (st: Settings, id: string, now = Date.now()): Settings =>
  st.learn && st.learn.prac && st.learn.prac[id]
    ? st
    : changeSettings(
        st,
        (s) => {
          (s.learn.prac || (s.learn.prac = {}))[id] = 1;
        },
        now,
      );
export const setLearn = (st: Settings, fn: (l: Settings['learn']) => void, now = Date.now()): Settings => changeSettings(st, (s) => fn(s.learn), now);

/** a lesson was finished or read again on this day (the day's lesson stop is done) */
export const lessonDoneOn = (p: Play | null | undefined) => !!p && ((p.ls && p.ls.length > 0) || (p.lv && p.lv.length > 0));

/* ---------- the week's lesson days: the ring of seven (from Learn) ---------- */
export interface LessonWeek {
  /** Monday to Sunday: a lesson done that day, and which one is today */
  days: { k: DayKey; on: boolean; today: boolean }[];
  /** days of this week with a lesson done, 0 to 7 */
  n: number;
}
/** this week's lesson days (Monday to Sunday, like the Sunday review). It only fills: a day with a lesson stays lit for the
    week, a slip never touches it, and a day without one is just not lit yet. A new week starts a new ring. */
export function lessonWeek(days: Days, tk: DayKey): LessonWeek {
  const [y, m, d] = tk.split('-').map(Number);
  const mon = addDays(tk, -((new Date(y, m - 1, d).getDay() + 6) % 7));
  const out = Array.from({ length: 7 }, (_, i) => {
    const k = addDays(mon, i);
    return { k, on: k <= tk && lessonDoneOn(days[k]?.p), today: k === tk };
  });
  return { days: out, n: out.filter((x) => x.on).length };
}

/* the day's lesson stop on Today: one answer for Today, the reminder, the hard hours card and the player (lessonToday).
   read: a lesson was finished or read again today. next: the day's lesson; locked when it waits behind a free account, so the stop
   says so instead of quietly becoming a re-read (never on the day of a slip or the day after: then it is a re-read, wait). review:
   a re-read, at the end of the path (wait false) or while the next lesson waits (wait true). account: signed in, or no accounts. */
export type LessonStop =
  | { kind: 'read'; L: Lesson; next: Lesson | null }
  | { kind: 'next'; L: Lesson; n: number; total: number; hook: LessonHook | null; locked: boolean }
  | { kind: 'review'; L: Lesson; note: string; wait: boolean };
export function lessonStop(days: Days, st: Settings, tk: DayKey, account = true): LessonStop {
  const p = days[tk]?.p;
  const w = lessonWalk(days, st, tk, account);
  const nl = w.today;
  const readIds = [...((p && p.ls) || []), ...((p && p.lv) || [])];
  const readL =
    readIds
      .map(lessonById)
      .filter((x): x is Lesson => !!x)
      .pop() || null;
  if (readL) return { kind: 'read' as const, L: readL, next: w.next && w.next.id !== readL.id ? w.next : null };
  const note = (L: Lesson) => (st.learn && st.learn.notes && st.learn.notes[L.id]) || '';
  if (nl) {
    const total = lessonPathFor(st).length;
    if (w.hook || lessonOpen(nl, w.done, account, st)) return { kind: 'next' as const, L: nl, n: lessonNo(nl, st), total, hook: w.hook, locked: false };
    if (!slipNear(days, tk)) return { kind: 'next' as const, L: nl, n: lessonNo(nl, st), total, hook: null, locked: true };
    const R = lessonReread(w, tk, st, account);
    return { kind: 'review' as const, L: R, note: note(R), wait: true };
  }
  const R = reviewPick(tk, st);
  return { kind: 'review' as const, L: R, note: note(R), wait: false };
}

/* ---------- the free lessons (D8, the owner, November 12, 2026) ----------
   Without an account, the first LEARN_FREE lessons of this person's own path are open (their front track, when they have one), the
   same number on every path: God lessons no longer come free on top. A lesson already finished stays open. Care doors (at=care in
   the app) and the lesson the morning after a slip brings (lessonToday) are never behind it. accounts.ts asks for the account. */
export const LEARN_FREE = 7;
/** the lessons open without an account on this person's path */
export const freeLessons = (st?: Settings | null): Lesson[] => lessonPathFor(st).slice(0, LEARN_FREE);
/** whether a lesson can be read. `account` is true when signed in, or when this copy of Daybook has no accounts at all. */
export function lessonOpen(L: Lesson, done: Set<string>, account: boolean, st?: Settings | null): boolean {
  return account || done.has(L.id) || freeLessons(st).some((x) => x.id === L.id);
}
/** how many lessons of a list are waiting behind an account */
export const lessonsLocked = (all: Lesson[], done: Set<string>, account: boolean, st?: Settings | null) =>
  all.filter((L) => !lessonOpen(L, done, account, st)).length;
/** a slip on this day or the day before: the hours after a slip, when nothing asks for an account */
export const slipNear = (days: Days, tk: DayKey) => eventsOf(days).some((e) => e.outcome === 'slipped' && (e.key === tk || e.key === addDays(tk, -1)));
/** a re-read: with an account any lesson in turn (reviewPick), without one a finished lesson behind Up next */
export function lessonReread(w: LessonWalk, tk: DayKey, st: Settings | null | undefined, account: boolean): Lesson {
  const read = LESSONS.filter((L: Lesson) => w.walked.has(L.id));
  return account || !read.length ? reviewPick(tk, st) : read[Math.abs(diffDays(tk, '2026-01-01')) % read.length];
}
/** what the player's Next button opens after this lesson: the lesson after it (nextAfter), with locked when it waits behind a free
    account (the app then shows the sign-up). null when there is none, or when it is locked on the day of a slip or the day after:
    then the player ends in Done, never on a sign-up page. */
export function nextLessonOk(
  L: Lesson,
  w: LessonWalk,
  days: Days,
  st: Settings | null | undefined,
  tk: DayKey,
  account: boolean,
): { L: Lesson; locked: boolean } | null {
  const nx = nextAfter(L, w);
  if (!nx) return null;
  const locked = !lessonOpen(nx, w.done, account, st);
  return locked && slipNear(days, tk) ? null : { L: nx, locked };
}

/* ---------- three moments change the day's lesson (WP11), no more ----------
   slip: the morning after a slip (told with "It happened", or logged for yesterday), the first not read of the lessons for after a
   hard night that Rekindle offers (RK_LESSONS). It is care, so it is never behind an account.
   free: a free night told this morning, the identity lesson "Say I do not" (l38), once.
   rode: an urge ridden out today or yesterday, "Your log is your evidence" (l40): each urge ridden out is proof of who you are
   becoming. free and rode only when the lesson is open (a free account past the first seven). None before the first lesson is
   finished: the path's first lesson is the way in.
   Otherwise the day's lesson is Up next on the path. A lesson read this way counts as done, and the path walks past it later
   (lessonsEarly). Not once a lesson was finished today: the stop then says read. */
export type LessonHook = 'slip' | 'free' | 'rode';
/** the lessons Rekindle offers after the fire, in order: what therapy is like first (the owner, November 12, 2026: "i think
    that's a good lesson and should be a first recommendation"), then kindness after a slip, why one slip snowballs, guilt and
    shame before God (only on a path with faith), and mindfulness for the next urge (rekindle.ts rkLesson) */
export const RK_LESSONS = ['l24', 'l6', 'l3', 'l31', 'l27'];
export const HOOK_FREE_LESSON = 'l38';
export const HOOK_RODE_LESSON = 'l40';
const HOOK_IDS = new Set([...RK_LESSONS, HOOK_FREE_LESSON, HOOK_RODE_LESSON]);
/** the lessons for after a slip that fit this person (habit, and faith said No drops the faith one), in order */
export const rkFits = (st: Settings | null | undefined): string[] =>
  RK_LESSONS.filter((id) => {
    const L = lessonFor(id, st);
    return !!L && !(L.f && faithOut(st));
  });
function hookFor(days: Days, st: Settings | null | undefined, tk: DayKey, w: LessonWalk, account: boolean): { L: Lesson; hook: LessonHook } | null {
  const p = days[tk]?.p;
  /* not once a lesson was finished today */
  if (p && p.ls && p.ls.length) return null;
  return hookPick(days, st, tk, w.done, w.path, account);
}
/** the moment's lesson for day tk, from the lessons finished before it (done): also read back by lessonsEarly, so a lesson read as
    a day's moment is never early. Not before the path's first lesson is finished: it is the way in. */
function hookPick(
  days: Days,
  st: Settings | null | undefined,
  tk: DayKey,
  done: Set<string>,
  path: Lesson[],
  account: boolean,
): { L: Lesson; hook: LessonHook } | null {
  if (!path.length || !done.has(path[0].id)) return null;
  const w = { done };
  const y = addDays(tk, -1);
  const evs = eventsOf(days);
  if (evs.some((e) => e.outcome === 'slipped' && e.key === y)) {
    const id = rkFits(st).find((x) => !w.done.has(x));
    const L = id ? lessonById(id) : null;
    return L ? { L, hook: 'slip' } : null;
  }
  const fit = (id: string) => {
    const L = lessonFor(id, st);
    return L && !(L.f && faithOut(st)) && !w.done.has(id) && lessonOpen(L, w.done, account, st) ? L : null;
  };
  if (morningOf(days[tk])?.n === 'free') {
    const L = fit(HOOK_FREE_LESSON);
    if (L) return { L, hook: 'free' };
  }
  if (evs.some((e) => e.outcome === 'rode' && (e.key === tk || e.key === y))) {
    const L = fit(HOOK_RODE_LESSON);
    if (L) return { L, hook: 'rode' };
  }
  return null;
}
/** the day's lesson: a moment's lesson (hook), or Up next on the path; null at the end of the path. open: it can be read now
    (a moment's lesson always can; Up next without an account only among the first LEARN_FREE). */
export function lessonToday(
  days: Days,
  st: Settings | null | undefined,
  tk: DayKey,
  account = true,
): { L: Lesson; hook: LessonHook | null; open: boolean } | null {
  const w = lessonWalk(days, st, tk, account);
  if (!w.today) return null;
  return { L: w.today, hook: w.hook, open: !!w.hook || lessonOpen(w.today, w.done, account, st) };
}

/* ---------- Learn > Lessons ---------- */
export const LF_FILTERS: ['all' | 'todo' | 'done' | 'notes', string][] = [
  ['all', 'All'],
  ['todo', 'To do'],
  ['done', 'Done'],
  ['notes', 'Notes'],
];
/** a date in a lesson list: the year only when it is not this year */
export const lfDate = (k: DayKey, tk: DayKey) =>
  fmtDate(k, k.slice(0, 4) === tk.slice(0, 4) ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' });
export const lfClip = (s: string, n: number) => {
  const t = String(s || '')
    .replace(/\s+/g, ' ')
    .trim();
  return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t;
};
/** one lesson in a list (legacy lessonRow): its status, the line under it, and for a finished one in Done or Notes, what was kept */
export function lessonRow(L: Lesson, done: Set<string>, nextId: string | null, st: Settings, stats: ReturnType<typeof lessonStats>, tk: DayKey, full: boolean) {
  const d = done.has(L.id);
  const n = lessonNo(L, st);
  const notes = (st.learn && st.learn.notes) || {};
  const note = notes[L.id] ? String(notes[L.id]).trim() : '';
  const fin = stats.first[L.id];
  const again = stats.again[L.id] || 0;
  const lastK = stats.last[L.id];
  const prac = !!(st.learn && st.learn.prac && st.learn.prac[L.id]);
  const status: { kind: 'done' | 'next' | 'len'; text: string } = d
    ? { kind: 'done', text: 'Done' }
    : L.id === nextId
      ? { kind: 'next', text: 'Up next' }
      : { kind: 'len', text: lmin(L) };
  const when = d
    ? 'Finished' +
      (fin ? ' ' + lfDate(fin, tk) : '') +
      (again ? ', read again ' + (again === 1 ? 'once' : 'on ' + again + ' days') + (lastK && lastK !== fin ? ' (last ' + lfDate(lastK, tk) + ')' : '') : '') +
      (prac ? ' · practiced' : '')
    : '';
  const isFull = !!(full && d);
  const sub = isFull ? when : L.tag + (note ? ' · note saved' : '') + (prac ? ' · practiced' : '');
  const label =
    `Lesson ${n}: ${L.title}. ${L.f ? 'Faith lesson. ' : ''}${d ? 'Done' + (fin ? ', finished ' + lfDate(fin, tk) : '') + '. ' : ''}` +
    `${lessonHasQuick(L) ? 'Quick, 1 to 2 minutes, or Full, 3 to 5 minutes.' : L.mins + ' minutes.'}${note ? ' Note saved.' : ''}`;
  return { n, d, status, sub, faith: !!L.f, label, more: isFull ? { key: L.key, np: L.np, note: note ? lfClip(note, 220) : '' } : null };
}
/** the lessons a filter shows, and how it is worded when empty */
export function lessonFilter(days: Days, st: Settings, f: 'todo' | 'done' | 'notes') {
  const done = lessonsDone(days);
  const stats = lessonStats(days);
  const notes = (st.learn && st.learn.notes) || {};
  const hasNote = (L: Lesson) => !!(notes[L.id] && String(notes[L.id]).trim());
  const recent = (a: Lesson, b: Lesson) => (stats.seq[b.id] || 0) - (stats.seq[a.id] || 0);
  if (f === 'todo')
    return {
      list: lessonPathFor(st).filter((L) => !done.has(L.id)),
      title: 'To do',
      sub: 'in your daily order',
      empty: 'You have finished every lesson. Open Done to read any of them again.',
    };
  if (f === 'done')
    return {
      list: LESSONS.filter((L) => done.has(L.id)).sort(recent),
      title: 'Done',
      sub: 'most recent first',
      empty: 'No finished lessons yet. When you finish one, it shows up here with the date and your note, so it is easy to find again.',
    };
  return {
    list: LESSONS.filter(hasNote).sort(recent),
    title: 'My notes',
    sub: 'most recent first',
    empty: 'No notes yet. At the end of every lesson there is a spot for one optional line. Only you see it, and it shows up here.',
  };
}
/** the lesson read most recently, for "Read last again" */
export function lastRead(days: Days) {
  const stats = lessonStats(days);
  const id = Object.keys(stats.seq)
    .filter((x) => lessonById(x))
    .sort((a, b) => stats.seq[b] - stats.seq[a])[0];
  return id ? lessonById(id) : null;
}
