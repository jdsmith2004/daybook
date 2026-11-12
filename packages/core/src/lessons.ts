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
  const list = lessonPathFaith(st);
  const h = habitOf(st);
  if (h === 'porn') return list;
  let c = FOR_HABIT.get(h);
  if (!c || c.from !== list) FOR_HABIT.set(h, (c = { from: list, list: habitPath(list, h) }));
  return c.list;
}
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
  path.forEach((L) => {
    const u = lessonStep(L);
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
  const befores = lessonPathsBefore().map((p) => p.filter((L) => !off(L)));
  const path = lessonPathFor(st);
  const fin = new Set<string>();
  const early = new Set<string>();
  /** every lesson before it on this path was finished. A God lesson is not waited for here: it came later, or is passed by
      (godPassed), so finishing past one is never early. */
  const reached = (p: Lesson[], L: Lesson) => {
    const i = p.indexOf(L);
    return i >= 0 && p.slice(0, i).every((x) => fin.has(x.id) || isGod(x));
  };
  lessonsInOrder(days).forEach(({ L }) => {
    /* a lesson off this person's path is never waited for, so it is never early */
    if (path.indexOf(L) >= 0 && !reached(path, L) && !befores.some((b) => reached(b, L))) early.add(L.id);
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
/** where the person is on the path */
export function lessonWalk(days: Days, st: Settings | null | undefined): LessonWalk {
  const done = lessonsDone(days);
  const early = lessonsEarly(days, st);
  const reached = lessonsReached(st);
  const path = lessonPathFor(st);
  const passed = godPassed(path, done);
  const at = path.findIndex((L) => !passed.has(L.id) && stopsAt(L, done, early, reached));
  const next = at < 0 ? null : path[at];
  const walked = new Set(path.filter((L, i) => !passed.has(L.id) && (at < 0 || i < at || (i > at && !stopsAt(L, done, early, reached)))).map((L) => L.id));
  return { done, early, reached, walked, next, back: !!next && done.has(next.id), path, passed };
}
/** a walk from finished lessons only, with nothing read early: for a map or a test that has no record */
export function walkOf(done: Set<string>, st?: Settings | null): LessonWalk {
  const path = lessonPathFor(st);
  const passed = godPassed(path, done);
  const next = path.find((L) => !passed.has(L.id) && !done.has(L.id)) || null;
  const walked = new Set((next ? path.slice(0, path.indexOf(next)) : path).filter((L) => !passed.has(L.id)).map((L) => L.id));
  return { done, early: new Set(), reached: new Set(), walked, next, back: false, path, passed };
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

/* the day's lesson stop on Today */
export function lessonStop(days: Days, st: Settings, tk: DayKey) {
  const p = days[tk]?.p;
  const nl = lessonWalk(days, st).next;
  const readIds = [...((p && p.ls) || []), ...((p && p.lv) || [])];
  const readL =
    readIds
      .map(lessonById)
      .filter((x): x is Lesson => !!x)
      .pop() || null;
  if (readL) return { kind: 'read' as const, L: readL, next: nl && nl.id !== readL.id ? nl : null };
  if (nl) return { kind: 'next' as const, L: nl, n: lessonNo(nl, st), total: lessonPathFor(st).length };
  const R = reviewPick(tk, st);
  return { kind: 'review' as const, L: R, note: (st.learn && st.learn.notes && st.learn.notes[R.id]) || '' };
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
