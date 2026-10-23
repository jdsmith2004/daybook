/* Lessons: the one order they are offered in (a section at a time), which are done, the cards of a Quick or Full read, the
   recall question, and the checkpoints. The practice step at the end of each lesson is in practice.ts. The legacy helpers
   read the global Store; here the log and the settings are passed in. The lesson content itself (LESSONS, LUNITS, SRC,
   LCHECKS) was copied from the legacy app into legacy/core.js. Checked by test/lessons.test.ts and test/families.test.ts. */
import { addDays, diffDays, fmtDate, LESSON_IDS, LESSONS, eventsOf, topTrigger, busiestWindow, LCHECK_N, SLIP_STEPS } from './legacy/core.js';
import { changeDay, withDay } from './mutate';
import { changeSettings } from './actions';
import { blankP } from './legacy/core.js';
import type { DayKey, Days, Play, Settings } from './types';

/* ---------- the shapes ---------- */
export type Block = ['p', string] | ['q', string] | ['l', string[]] | ['plan'] | ['rbox'] | ['mylog'] | ['words'];
export type Art =
  | ['icon', { ic?: string }]
  | ['chain', { n?: string[]; i?: string[] }]
  | ['wave', { al?: string }]
  | ['big', { n: string; s?: string }]
  | ['snow', { a?: string; b?: string; al?: string }]
  | ['loop', { n?: string[]; c?: string }]
  | ['shield', Record<string, never>]
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
  k: 'text' | 'choose' | 'guess' | 'try';
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
    newer two are each a section of the path; the first two come back across sections, and each lesson's recall question
    brings the one before it back */
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

/** the one order the lessons are offered in, the same for everyone: a section at a time (each has its own color), so the
    numbers never jump. Why it is hard to stop comes right after How it works; faith is its own section, after Making a
    plan, since its first lesson adds a prayer to the urge plan. Inside a section, lessons keep their order in LESSONS. */
export const UNIT_ORDER = [0, 8, 1, 2, 7, 3, 4, 9, 5, 6];
let PATH: Lesson[] | null = null;
export function lessonPath(): Lesson[] {
  if (!PATH || PATH.length !== LESSONS.length) {
    const at = (L: Lesson) => {
      const k = UNIT_ORDER.indexOf(L.u);
      return k < 0 ? UNIT_ORDER.length : k;
    };
    PATH = LESSONS.map((L, i) => ({ L, i }))
      .sort((a, b) => at(a.L) - at(b.L) || a.i - b.i)
      .map((x) => x.L);
  }
  return PATH;
}
/** the path in its sections: each unit, with its lessons in order */
export function lessonSections(): { u: number; lessons: Lesson[] }[] {
  const out: { u: number; lessons: Lesson[] }[] = [];
  lessonPath().forEach((L) => {
    const last = out[out.length - 1];
    if (last && last.u === L.u) last.lessons.push(L);
    else out.push({ u: L.u, lessons: [L] });
  });
  return out;
}
/** the number a person sees for a lesson: its place on the path (so Up next after lesson 2 is lesson 3). lessonIndex
    stays the lesson's fixed place in LESSONS, for checkpoints and stored records. */
export const lessonNo = (L: Lesson) => lessonPath().indexOf(L) + 1;
export const firstUndone = (done: Set<string>) => lessonPath().find((l) => !done.has(l.id)) || null;
/** what comes after this lesson: the first unfinished lesson on the path, counting this one as finished. It is the same
    Up next as Today and the map, also after a lesson done out of order (from a check-in, a help page or a review). */
export function nextAfter(L: Lesson, done: Set<string>): Lesson | null {
  return lessonPath().find((x) => x !== L && !done.has(x.id)) || null;
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
export function lessonTimeline(days: Days) {
  const done = lessonsDone(days);
  const next = firstUndone(done);
  const coming = lessonSections()
    .map((x) => ({
      u: x.u,
      n: x.lessons.length,
      done: x.lessons.filter((L) => done.has(L.id)).length,
      left: x.lessons.filter((L) => !done.has(L.id) && L !== next),
    }))
    .filter((x) => x.left.length);
  return { past: lessonsInOrder(days), next, coming };
}
/** once every lesson is finished, the day's lesson is a quick re-read, one a day in turn */
export const reviewPick = (tk: DayKey) => LESSONS[Math.abs(diffDays(tk, '2026-01-01')) % LESSONS.length];

/* ---------- one lesson ---------- */
export const lessonHasQuick = (L: Lesson) => !!(L.cards && L.cards.some((c) => c.q === 1));
/** the length shown in lists */
export const lmin = (L: Lesson) => (lessonHasQuick(L) ? '1–5 min' : (L.mins || 3) + ' min');
export const lessonCore = (L: Lesson) => L.cards.filter((c) => c.k !== 'try');
export const lessonCards = (L: Lesson, len: 'q' | 'f' | null) => {
  const all = lessonCore(L);
  return len === 'q' && lessonHasQuick(L) ? all.filter((c) => c.q === 1) : all;
};
/** the lesson before this one in the daily order, when it was finished and has a recall question, and this one is new */
export function lessonRecallOf(L: Lesson, done: Set<string>): Lesson | null {
  const path = lessonPath();
  const i = path.indexOf(L);
  const P = i > 0 ? path[i - 1] : null;
  return P && P.rc && done.has(P.id) && !done.has(L.id) ? P : null;
}
export type SeqItem = { t: 'rc' } | { t: 'card'; c: Card; ci: number } | { t: 'done' };
export function lessonSeq(L: Lesson, rcOf: string | null, len: 'q' | 'f' | null): SeqItem[] {
  const out: SeqItem[] = [];
  if (rcOf) out.push({ t: 'rc' });
  lessonCards(L, len).forEach((c) => out.push({ t: 'card', c, ci: L.cards.indexOf(c) }));
  out.push({ t: 'done' });
  return out;
}
/** each choice's comment on the recall question (older ones share one explanation) */
export const lxRcReply = (r: NonNullable<Lesson['rc']>, j: number) => (r.cr && r.cr[j] ? r.cr[j] : (j === r.a ? 'Right. ' : 'Not quite. ') + r.r);
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

/* ---------- checkpoints: a longer piece of writing after every second lesson ---------- */
export function lessonPairOf(L: Lesson) {
  const i = lessonIndex(L);
  return i % 2 === 1 && (i + 1) / 2 <= LCHECK_N ? { n: (i + 1) / 2, a: LESSONS[i - 1], b: L } : null;
}
export const lcheckWritten = (st: Settings, n: number) => !!(st.learn && st.learn.wr && st.learn.wr['c' + n]);
export function lcheckDue(days: Days, st: Settings): number {
  const done = lessonsDone(days);
  for (let n = 1; n <= LCHECK_N; n++) {
    const a = LESSONS[2 * n - 2];
    const b = LESSONS[2 * n - 1];
    if (a && b && done.has(a.id) && done.has(b.id) && !lcheckWritten(st, n)) return n;
  }
  return 0;
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
/** the note on the Behind this sheet */
export function srcNote(L: Lesson): string {
  return (
    'Checked ' +
    (L.chk || 'October 12, 2026') +
    '. ' +
    (L.f
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

/* ---------- the week's lesson days: the ring of seven on Today ---------- */
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
  const done = lessonsDone(days);
  const p = days[tk]?.p;
  const nl = firstUndone(done);
  const readIds = [...((p && p.ls) || []), ...((p && p.lv) || [])];
  const readL =
    readIds
      .map(lessonById)
      .filter((x): x is Lesson => !!x)
      .pop() || null;
  if (readL) return { kind: 'read' as const, L: readL, next: nl && nl.id !== readL.id ? nl : null };
  if (nl) return { kind: 'next' as const, L: nl, n: lessonNo(nl), total: LESSONS.length };
  const R = reviewPick(tk);
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
  const n = lessonNo(L);
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
      list: lessonPath().filter((L) => !done.has(L.id)),
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
