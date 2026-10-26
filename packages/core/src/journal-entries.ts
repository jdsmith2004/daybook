/* The journal: what the person writes, one entry at a time. Pulling down on Today opens it, and every entry starts by
   naming the feeling in the field of feelings (feelings.ts), then a page to write on, with one open question to start
   from. The feeling comes first because naming it precisely is what helps: putting a feeling into words calms it
   (Lieberman et al. 2007), and people who name hard feelings precisely drink less when they feel them (Kashdan et al.
   2010) and lapse less after treatment (Anand et al. 2017). The writing is short on purpose: two minutes of it on two
   days was enough to help in Burton and King (2008), and an entry with only a feeling still counts.

   Each entry is its own record (journal/<id>, data.ts), so two devices writing on the same day never overwrite each
   other's words, and a long entry never pushes a day past the size a record may have. The entry belongs to the log day
   it was started on (d). */
import { addDays, fmtDate, isKey } from './legacy/core.js';
import { nextU } from './actions';
import { makeId } from './mutate';
import { feelPos } from './slip';
import type { DayKey, Days } from './types';

export interface JEntry {
  id: string;
  /** the log day it was started on */
  d: DayKey;
  /** when it was started, in ms */
  at: number;
  /** the feeling named first (a word from FEELINGS) */
  w: string;
  /** what was written; empty when only the feeling was named */
  t: string;
  /** the question that was showing when it was written, kept so reading it back makes sense */
  q?: string;
  u: number;
}
/** every entry, by id */
export type Journal = Record<string, JEntry>;

/** the most one entry holds: far more than anyone writes at once, and well inside the size a record may have */
export const JN_TEXT_MAX = 20000;
const Q_MAX = 160;

/** an entry id, as makeId writes them */
export const isJnId = (id: string) => /^[0-9a-z]{4,24}$/.test(id);
/** a feeling word, the way a slip's feeling is checked (normEvent) */
const isWord = (w: unknown): w is string => typeof w === 'string' && /^[A-Za-z][A-Za-z ]{0,23}$/.test(w);

/** an entry, cleaned up, or null when it is not one (no feeling, no day, no start time) */
export function normJEntry(v: unknown, id: string): JEntry | null {
  if (!v || typeof v !== 'object' || !isJnId(id)) return null;
  const o = v as Record<string, unknown>;
  if (!isWord(o.w) || typeof o.d !== 'string' || !isKey(o.d) || typeof o.at !== 'number' || !Number.isFinite(o.at)) return null;
  const out: JEntry = {
    id,
    d: o.d,
    at: o.at,
    w: o.w,
    t: typeof o.t === 'string' ? o.t.replace(/\u0000/g, '').slice(0, JN_TEXT_MAX) : '',
    u: typeof o.u === 'number' && Number.isFinite(o.u) ? o.u : 0,
  };
  if (typeof o.q === 'string' && o.q.trim()) out.q = o.q.trim().slice(0, Q_MAX);
  return out;
}

/** starts an entry: the feeling is named, and that alone is kept, before a word is written */
export function jnStart(jn: Journal, d: DayKey, w: string, now = Date.now()): { jn: Journal; id: string } {
  const id = makeId(now);
  return { jn: { ...jn, [id]: { id, d, at: now, w, t: '', u: nextU(null, now) } }, id };
}

/** writes into an entry: its words, the question it answers, or a feeling named again */
export function jnEdit(jn: Journal, id: string, patch: { t?: string; q?: string | null; w?: string }, now = Date.now()): Journal {
  const cur = jn[id];
  if (!cur) return jn;
  const next: JEntry = { ...cur, u: nextU(cur, now) };
  if (patch.t != null) next.t = patch.t.replace(/\u0000/g, '').slice(0, JN_TEXT_MAX);
  if (patch.w != null && isWord(patch.w)) next.w = patch.w;
  if (patch.q === null) delete next.q;
  else if (patch.q != null && patch.q.trim()) next.q = patch.q.trim().slice(0, Q_MAX);
  return { ...jn, [id]: next };
}

/** takes an entry out (sync then removes it everywhere) */
export function jnRemove(jn: Journal, id: string): Journal {
  if (!jn[id]) return jn;
  const next = { ...jn };
  delete next[id];
  return next;
}

/** every entry, newest first */
export const jnList = (jn: Journal | undefined): JEntry[] => Object.values(jn || {}).sort((a, b) => b.at - a.at || (a.id < b.id ? 1 : -1));

/** the entries by day, newest day first, each with its heading: Today, Yesterday, or the weekday and date */
export function jnGroups(jn: Journal | undefined, tk: DayKey): { k: DayKey; label: string; items: JEntry[] }[] {
  /* by the day each was started on, which is not always the order of the times (a clock changed between two entries) */
  const byDay = new Map<DayKey, { k: DayKey; label: string; items: JEntry[] }>();
  for (const e of jnList(jn)) {
    const g = byDay.get(e.d);
    if (g) g.items.push(e);
    else byDay.set(e.d, { k: e.d, label: jnDayLabel(e.d, tk), items: [e] });
  }
  return [...byDay.values()].sort((a, b) => (a.k < b.k ? 1 : -1));
}

export function jnDayLabel(k: DayKey, tk: DayKey): string {
  if (k === tk) return 'Today';
  if (k === addDays(tk, -1)) return 'Yesterday';
  const sameYear = k.slice(0, 4) === tk.slice(0, 4);
  return fmtDate(k, sameYear ? { weekday: 'long', month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' });
}

/** how many days have an entry: a count that only grows, never a run that can break */
export const jnDays = (jn: Journal | undefined): number => new Set(Object.values(jn || {}).map((e) => e.d)).size;

/* ---------- every feeling, wherever it was named ----------
   The journal shows each day by its feelings, and not only the ones named here: a feeling named in Name the feeling or in
   the ride (p.fe), and the one named for before a slip (the event's fb), so the whole day is in one place. The ride and
   Name the feeling keep their words in the same list, so one named within an hour of an urge ridden out is counted as
   the ride's. */
export type JFeelFrom = 'journal' | 'urge' | 'slip' | 'named';
export interface JFeel {
  w: string;
  /** when, in ms */
  at: number;
  from: JFeelFrom;
  /** the entry, for a feeling named in the journal */
  id?: string;
}
export interface JDay {
  k: DayKey;
  label: string;
  /** every feeling named that day, in the order they came */
  feels: JFeel[];
  /** the day's journal entries, newest first */
  entries: JEntry[];
}

/** a clock time on a log day, in ms: a time before the day's rollover (4 AM) belongs to the night after it */
function onDay(k: DayKey, clock: string | null, rollover = 4): number {
  const [y, m, d] = k.split('-').map(Number);
  const [h, mi] = clock && /^\d{1,2}:\d{2}$/.test(clock) ? clock.split(':').map(Number) : [12, 0];
  return new Date(y, m - 1, d + (h < rollover ? 1 : 0), h, mi).getTime();
}
const minOfDay = (ms: number) => {
  const t = new Date(ms);
  return t.getHours() * 60 + t.getMinutes();
};

/** the days with any feeling named, newest first, each with its feelings in order and its journal entries */
export function jnTimeline(jn: Journal | undefined, days: Days | undefined, tk: DayKey): JDay[] {
  const by = new Map<DayKey, JDay>();
  const day = (k: DayKey) => {
    let g = by.get(k);
    if (!g) by.set(k, (g = { k, label: jnDayLabel(k, tk), feels: [], entries: [] }));
    return g;
  };
  for (const e of jnList(jn)) {
    const g = day(e.d);
    g.entries.push(e);
    g.feels.push({ w: e.w, at: e.at, from: 'journal', id: e.id });
  }
  for (const [k, d] of Object.entries(days || {})) {
    if (!d || !isKey(k) || k > tk) continue;
    const rode = (d.events || []).filter((ev) => ev.outcome === 'rode' && ev.time).map((ev) => minOfDay(onDay(k, ev.time)));
    for (const [w, at] of (d.p && d.p.fe) || []) {
      if (!isWord(w) || typeof at !== 'number') continue;
      const m = minOfDay(at);
      const urge = rode.some((r) => Math.min(Math.abs(r - m), 1440 - Math.abs(r - m)) <= 60);
      day(k).feels.push({ w, at, from: urge ? 'urge' : 'named' });
    }
    for (const ev of d.events || []) {
      if (ev.outcome === 'slipped' && ev.fb && isWord(ev.fb)) day(k).feels.push({ w: ev.fb, at: onDay(k, ev.time), from: 'slip' });
    }
  }
  const out = [...by.values()].sort((a, b) => (a.k < b.k ? 1 : -1));
  for (const g of out) g.feels.sort((a, b) => a.at - b.at);
  return out;
}

/** one log in a day: an entry with words, under the feeling it was written with, or a few feelings named on their own */
export interface JLog {
  key: string;
  /** its feelings, in the order they came */
  feels: JFeel[];
  /** the entry, when something was written */
  entry?: JEntry;
  /** the entry a tap opens: this one, or the newest feeling-only entry among its feelings */
  open?: string;
}
/** the longest quiet stretch inside one log of feelings: three hours */
const JN_LOG_GAP = 3 * 3600_000;
/** a day's logs, newest first (the owner, October 26, 2026: each entry is its own log, and a day of many feelings starts
    another log rather than hiding them). Each entry with words is a log of its own; the feelings named on their own
    between them run together, up to `max` to a log (so a title never runs past three words) and within three hours of
    each other. */
export function jnLogs(g: Pick<JDay, 'feels' | 'entries'>, max = 3): JLog[] {
  const byId = new Map(g.entries.map((e) => [e.id, e]));
  const out: JLog[] = [];
  let run: JFeel[] = [];
  const flush = () => {
    if (!run.length) return;
    const ids = run.filter((f) => f.id).map((f) => f.id!);
    out.push({ key: run[0].from + run[0].at, feels: run, open: ids[ids.length - 1] });
    run = [];
  };
  for (const f of g.feels) {
    const e = f.id ? byId.get(f.id) : undefined;
    if (e && e.t.trim()) {
      flush();
      out.push({ key: e.id, feels: [f], entry: e, open: e.id });
    } else {
      /* a long quiet stretch starts a new log too, so a morning and an evening are not run together */
      if (run.length && f.at - run[run.length - 1].at > JN_LOG_GAP) flush();
      run.push(f);
      if (run.length >= max) flush();
    }
  }
  flush();
  return out.reverse();
}

/** where the entry's feeling sits in the field, for its color and shape; null for a word the field no longer has */
export const jnPos = (e: Pick<JEntry, 'w'>) => feelPos(e.w);

/* ---------- the question at the top of the page ----------
   One open question to start from, never aimed at the feeling just named (the owner, October 26, 2026: a question that
   lands on the feeling reads as pointed to someone who feels it). They lean toward what helps when people write: what
   went right, what helped, what is ahead, and the person they are becoming (King 2001: writing about a best possible
   self helps as much as writing about what hurts, with less distress). The morning, day and evening each have their
   own, and a tap shows the next one. */
export const JN_PROMPTS: Record<'morning' | 'day' | 'evening', string[]> = {
  morning: [
    'What would make today a good day?',
    'What are you looking forward to today?',
    'How did you sleep, and how is the morning so far?',
    'What is one thing you want to do for yourself today?',
    'Who do you want to be today?',
    'What is on your mind this morning?',
  ],
  day: [
    'What is on your mind right now?',
    'What has today been like so far?',
    'What is one thing that went right today?',
    'What is taking up the most space in your head?',
    'What are you working toward right now?',
    'What made you smile recently?',
    'Where are you, and what is around you?',
  ],
  evening: [
    'What happened today that you want to remember?',
    'What went well today, even something small?',
    'What helped you today?',
    'Who made today a little better?',
    'What would you like tomorrow to look like?',
    'What are you grateful for tonight?',
    'What is something you are proud of lately?',
  ],
};
/** questions that fit any time: who the person is becoming, and a word to their future self */
const JN_ANY = [
  'Who are you becoming, in your own words?',
  'Write a few lines to yourself a year from now.',
  'What has changed for you since you started?',
  'What do you want more of in your life?',
  'What is something you learned about yourself lately?',
];

export const jnPart = (hour: number): 'morning' | 'day' | 'evening' => (hour >= 4 && hour < 11 ? 'morning' : hour >= 11 && hour < 18 ? 'day' : 'evening');

/** the questions for this hour, in the order a tap goes through them */
export const jnPrompts = (hour: number): string[] => [...JN_PROMPTS[jnPart(hour)], ...JN_ANY];

/** the question an entry starts with: one for this time of day, picked by the entry's id so it stays the same while the
    entry is open; `n` taps on, the next ones, then the ones for any time */
export function jnPrompt(id: string, hour: number, n = 0): string {
  const all = jnPrompts(hour);
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return all[((h % JN_PROMPTS[jnPart(hour)].length) + n) % all.length];
}
