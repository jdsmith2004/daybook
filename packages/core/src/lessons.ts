/* Lessons: the order they are offered in, which are done, the cards of a Quick or Full read, the recall question, the practice
   step, and the checkpoints. The legacy helpers read the global Store; here the log and the settings are passed in. The lesson
   content itself (LESSONS, LUNITS, SRC, LCHECKS) is extracted verbatim from the legacy app. Checked by test/lessons.test.ts. */
import { diffDays, fmtDate, LESSON_IDS, LESSONS, eventsOf, topTrigger, busiestWindow, FAITH_MODES, LCHECK_N, SLIP_STEPS } from './legacy/core.js';
import { changeDay, withDay } from './mutate';
import { changeSettings } from './actions';
import { blankP } from './legacy/core.js';
import type { DayKey, Days, Settings } from './types';

/* ---------- the shapes ---------- */
export type Block = ['p', string] | ['q', string] | ['l', string[]] | ['plan'] | ['rbox'] | ['mylog'] | ['words'];
export type Art =
  | ['icon', { ic?: string }]
  | ['chain', { n?: string[]; i?: string[] }]
  | ['wave', { al?: string }]
  | ['big', { n: string; s?: string }]
  | ['snow', { a?: string; b?: string; al?: string }]
  | ['loop', { n?: string[]; c?: string }]
  | ['shield', Record<string, never>];
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
  a: 'sheet' | 'scene' | 'tab' | 'copy' | 'help' | 'growth' | 'week' | 'addmove' | 'addwind' | 'reasons';
  v?: string;
  sub?: string;
  open?: string;
  ic?: string;
  text?: string;
  o?: Record<string, unknown>;
}
export interface Practice {
  h?: string;
  p?: string;
  b?: Block[];
  mins?: number;
  go?: Go[];
  ok?: string;
  note?: boolean;
  btn?: string;
  ic?: string;
  shield?: boolean;
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
  act?: Practice;
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

export type FaithMode = 'mix' | 'first' | 'after';
export const faithOf = (st: Settings | null): FaithMode => {
  const m = st && st.learn && st.learn.faith;
  return (FAITH_MODES as string[]).indexOf(m as string) >= 0 ? (m as FaithMode) : 'after';
};
/** the order lessons are offered in: number order, with the faith lessons last, first, or after every two others */
export function lessonPath(mode: FaithMode): Lesson[] {
  const base = LESSONS.filter((L) => !L.f);
  const faith = LESSONS.filter((L) => L.f);
  if (!faith.length) return LESSONS.slice();
  if (mode === 'first') return faith.concat(base);
  if (mode === 'after') return base.concat(faith);
  const out: Lesson[] = [];
  let j = 0;
  base.forEach((L, i) => {
    out.push(L);
    if ((i + 1) % 2 === 0 && j < faith.length) out.push(faith[j++]);
  });
  while (j < faith.length) out.push(faith[j++]);
  return out;
}
export const firstUndone = (done: Set<string>, mode: FaithMode) => lessonPath(mode).find((l) => !done.has(l.id)) || null;
/** the next unfinished lesson after this one, wrapping around */
export function nextAfter(L: Lesson, done: Set<string>, mode: FaithMode): Lesson | null {
  const path = lessonPath(mode);
  const i = path.indexOf(L);
  const rest = path.slice(i + 1).concat(path.slice(0, Math.max(0, i)));
  return rest.find((x) => x !== L && !done.has(x.id)) || null;
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
export function lessonPractice(L: Lesson): Practice | null {
  if (L.act) return L.act;
  const t = L.cards.find((c) => c.k === 'try');
  return t ? { h: t.h, b: t.b, go: t.go || [] } : null;
}
/** the lesson before this one, when it was finished and has a recall question, and this one is new */
export function lessonRecallOf(L: Lesson, done: Set<string>): Lesson | null {
  const i = lessonIndex(L);
  const P = i > 0 ? LESSONS[i - 1] : null;
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
  return v === a ? 'Right on it.' : close ? `Close: you were within ${d} ${u}.` : v < a ? `You were ${d} ${u} under, and that is fine.` : `You were ${d} ${u} over, and that is fine.`;
}
export const lxPct = (g: Guess, x: number) => Math.max(0, Math.min(100, ((x - g.min) / (g.max - g.min)) * 100));

/* ---------- checkpoints: a longer piece of writing after every second lesson ---------- */
export function lessonPairOf(L: Lesson) {
  const i = lessonIndex(L);
  return i % 2 === 1 ? { n: (i + 1) / 2, a: LESSONS[i - 1], b: L } : null;
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
/** the "Your plan right now" peek on the practice step */
export function lxPeek(kind: string, st: Settings | null): { title: string; rows: string[]; more: number } | null {
  let title = '';
  let s: string[] = [];
  if (kind === 'slip') {
    s = slipSteps(st)
      .map((x) => String(x).trim())
      .filter(Boolean);
    title = 'Your plan right now';
  } else if (kind === 'urge') {
    s = planRows(st).map((r) => 'If ' + r.when.trim());
    title = 'Your urge plan right now';
  } else if (kind === 'reasons') {
    s = (st && st.reasons) || [];
    title = 'Your reasons right now';
  }
  if (!s.length) return null;
  return { title, rows: s.slice(0, 2), more: Math.max(0, s.length - 2) };
}
/** which editor a practice action opens over the lesson */
export const lxSheetOf = (g: Go): 'reasons' | 'slip' | 'urge' | null =>
  g.a === 'sheet' ? (g.v as 'reasons' | 'slip' | 'urge') : g.a === 'help' && g.v === 'plan' && (g.sub === 'slip' || g.sub === 'urge') ? g.sub : g.a === 'reasons' ? 'reasons' : null;

/** the note on the Behind this sheet */
export function srcNote(L: Lesson): string {
  return (
    'Checked ' +
    (L.chk || 'October 12, 2026') +
    '. ' +
    (L.f
      ? 'These summarize studies and well-known recovery programs, kept to what each source says. They are not religious teaching, and Daybook does not speak for any church or group.'
      : L.u >= 6
        ? 'These summarize published studies and program materials, kept to what each source says.'
        : 'These are summaries of studies, kept to what each one found.') +
    ' Daybook is a self-tracking tool, not medical care.'
  );
}

/* ---------- saving ---------- */
/** a lesson finished: counted once by id on today's record (p.ls); one read again counts as today's lesson (p.lv) */
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

/* the day's lesson stop on Today */
export function lessonStop(days: Days, st: Settings, tk: DayKey) {
  const done = lessonsDone(days);
  const p = days[tk]?.p;
  const nl = firstUndone(done, faithOf(st));
  const readIds = [...((p && p.ls) || []), ...((p && p.lv) || [])];
  const readL =
    readIds
      .map(lessonById)
      .filter((x): x is Lesson => !!x)
      .pop() || null;
  if (readL) return { kind: 'read' as const, L: readL, next: nl && nl.id !== readL.id ? nl : null };
  if (nl) return { kind: 'next' as const, L: nl, n: lessonIndex(nl) + 1, total: LESSONS.length };
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
export const LF_ORDER: [FaithMode, string][] = [
  ['mix', 'Mixed in'],
  ['first', 'First'],
  ['after', 'Last'],
];
/** a date in a lesson list: the year only when it is not this year */
export const lfDate = (k: DayKey, tk: DayKey) => fmtDate(k, k.slice(0, 4) === tk.slice(0, 4) ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' });
export const lfClip = (s: string, n: number) => {
  const t = String(s || '')
    .replace(/\s+/g, ' ')
    .trim();
  return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t;
};
/** one lesson in a list (legacy lessonRow): its status, the line under it, and for a finished one in Done or Notes, what was kept */
export function lessonRow(L: Lesson, done: Set<string>, nextId: string | null, st: Settings, stats: ReturnType<typeof lessonStats>, tk: DayKey, full: boolean) {
  const d = done.has(L.id);
  const n = lessonIndex(L) + 1;
  const notes = (st.learn && st.learn.notes) || {};
  const note = notes[L.id] ? String(notes[L.id]).trim() : '';
  const fin = stats.first[L.id];
  const again = stats.again[L.id] || 0;
  const lastK = stats.last[L.id];
  const prac = !!(st.learn && st.learn.prac && st.learn.prac[L.id]);
  const status: { kind: 'done' | 'next' | 'len'; text: string } = d ? { kind: 'done', text: 'Done' } : L.id === nextId ? { kind: 'next', text: 'Up next' } : { kind: 'len', text: lmin(L) };
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
    return { list: lessonPath(faithOf(st)).filter((L) => !done.has(L.id)), title: 'To do', sub: 'in your daily order', empty: 'You have finished every lesson. Open Done to read any of them again.' };
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
/** the daily order setting (Learn > Daily order) */
export const setFaithOrder = (st: Settings, v: FaithMode, now = Date.now()) =>
  changeSettings(
    st,
    (s) => {
      s.learn.faith = v;
      s.learn.faithSet = true;
    },
    now,
  );
