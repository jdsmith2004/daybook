/* Future you (plan #30, the owner, November 11, 2026): on a good day the person leaves one short note, in their own voice or
   written, for the self who will face the next urge. In an urge, SOS offers the note as the page right after the first breath:
   one tap to hear it, never played by itself. Up to five are kept; SOS offers the newest first, then they take turns, so it
   stays fresh. The notes and the voice files stay on this phone: never synced, never in a backup, never sent anywhere.

   Why this shape (the research note in docs/plan.md, "Future you notes"): notes made calm and used hot answer the hot-cold
   empathy gap (Sayette and Loewenstein 2008: a person who is not craving underrates the craving); spoken to "you", they borrow
   the calm of distanced self-talk (Kross 2014); "what will the urge say, and what is your answer?" is an if-then plan
   (Gollwitzer and Sheeran 2006); and picturing a good, specific future helps where a grim one does not (episodic future
   thinking, g about 0.5). The invitation comes right after a win, while the calm and the memory are fresh, and never in the
   hours after a slip. The evidence for each piece is real; no trial has tested this exact feature, so it is measured, not
   claimed. */
import { tipQuiet } from './support';
import type { Days, Settings } from './types';

/** one note from the person to the next hard moment */
export interface FutureNote {
  id: string;
  /** when it was kept (ms) */
  at: number;
  /** a recording (its file is named by the id, on the phone) or written words */
  k: 'voice' | 'text';
  /** the written words (text notes only) */
  t?: string;
  /** the question it answered (FUTURE_QS), if any */
  q?: number;
}

/** what this phone keeps for Future you. Never synced. */
export interface FutureMem {
  /** newest first */
  notes: FutureNote[];
  /** when the invitation was last shown (ms) */
  asked?: number;
  /** when SOS last offered each note (ms), by id */
  shown?: Record<string, number>;
  /** how many notes have ever been kept here: turns the question */
  kept?: number;
}

/** the most notes kept: a sixth pushes out the oldest */
export const FUTURE_MAX = 5;
/** the longest written note */
export const FUTURE_TEXT_MAX = 400;
/** the longest recording, in seconds (a short note is easier to hear in a hard minute) */
export const FUTURE_VOICE_MAX = 45;

/** the questions the invitation asks, one at a time, in turn. Each is spoken to "you", and the example shows the tone. */
export const FUTURE_QS: { q: string; ex: string }[] = [
  { q: 'What does today feel like, free of it?', ex: 'Like: You did it today. It passed, and you felt clear after. You can do it again.' },
  { q: 'What will the urge say, and what is your answer?', ex: 'Like: It will say just once. You know it is never once. Get up and walk.' },
  { q: 'Who are you becoming?', ex: 'Like: You are someone who keeps going. This is who you are now.' },
];

/** the question for the next note */
export function futureQ(mem: FutureMem): number {
  return Math.abs((mem.kept ?? 0) | 0) % FUTURE_QS.length;
}

const isNote = (x: unknown): x is FutureNote => {
  const n = x as FutureNote;
  return (
    !!n &&
    typeof n === 'object' &&
    typeof n.id === 'string' &&
    /^[a-z0-9-]{1,40}$/.test(n.id) &&
    Number.isFinite(n.at) &&
    (n.k === 'voice' || (n.k === 'text' && typeof n.t === 'string' && !!n.t.trim()))
  );
};

/** what was read from the phone, made safe: a bad entry is dropped, never the rest */
export function futureClean(raw: unknown): FutureMem {
  const r = raw && typeof raw === 'object' ? (raw as Partial<FutureMem>) : {};
  const seen = new Set<string>();
  const notes = (Array.isArray(r.notes) ? r.notes : [])
    .filter(isNote)
    .filter((n) => !seen.has(n.id) && !!seen.add(n.id))
    .map((n) => ({ ...n, t: n.k === 'text' ? String(n.t).slice(0, FUTURE_TEXT_MAX) : undefined }))
    .sort((a, b) => b.at - a.at)
    .slice(0, FUTURE_MAX);
  const shown: Record<string, number> = {};
  if (r.shown && typeof r.shown === 'object')
    for (const n of notes) {
      const v = (r.shown as Record<string, unknown>)[n.id];
      if (typeof v === 'number' && Number.isFinite(v)) shown[n.id] = v;
    }
  const out: FutureMem = { notes, shown };
  if (typeof r.asked === 'number' && Number.isFinite(r.asked)) out.asked = r.asked;
  out.kept = Math.max(notes.length, typeof r.kept === 'number' && Number.isFinite(r.kept) ? Math.floor(r.kept) : 0);
  return out;
}

/** keep a new note, newest first. A sixth pushes out the oldest: `drop` names the notes that left (their voice files go too). */
export function futureKeep(mem: FutureMem, note: FutureNote): { mem: FutureMem; drop: string[] } {
  const all = [note, ...mem.notes.filter((n) => n.id !== note.id)];
  const notes = all.slice(0, FUTURE_MAX);
  const drop = all.slice(FUTURE_MAX).map((n) => n.id);
  const shown = { ...(mem.shown || {}) };
  for (const id of drop) delete shown[id];
  return { mem: { ...mem, notes, shown, kept: ((mem.kept ?? 0) | 0) + 1 }, drop };
}

/** take one note away (the person removed it) */
export function futureDrop(mem: FutureMem, id: string): FutureMem {
  const shown = { ...(mem.shown || {}) };
  delete shown[id];
  return { ...mem, notes: mem.notes.filter((n) => n.id !== id), shown };
}

/** the note SOS offers: the newest, until SOS has offered it once; after that, the one offered longest ago (never offered
    counts as longest ago), the newer first when two are even */
export function futurePick(mem: FutureMem): FutureNote | null {
  const ns = mem.notes;
  if (!ns.length) return null;
  const sh = mem.shown || {};
  if (sh[ns[0].id] == null) return ns[0];
  let best = ns[0];
  for (const n of ns) if ((sh[n.id] ?? -1) < (sh[best.id] ?? -1)) best = n;
  return best;
}

/** SOS offered this note now */
export function futureSeen(mem: FutureMem, id: string, now: number): FutureMem {
  return { ...mem, shown: { ...(mem.shown || {}), [id]: now } };
}

const DAY = 86_400_000;
/** with no note yet, the invitation comes back after this many days */
export const FUTURE_ASK_EMPTY = 2;
/** with a note, it waits this long after the newest one... */
export const FUTURE_ASK_FRESH = 7;
/** ...and this long after it was last shown */
export const FUTURE_ASK_GAP = 3;

/** whether a good moment (an urge ridden out, a level, a new form) shows the invitation now. Never in the hours after a slip
    (support.ts tipQuiet), never in a practice ride, and not every time: every couple of days while there is no note, then
    about once a week. An SOS just ridden out is the good moment itself, so it does not hold this back. */
export function futureAsk(days: Days, st: Settings | null, mem: FutureMem, now: number): boolean {
  if (!st) return false;
  if (tipQuiet(days, st, { now, sos: null })) return false;
  const since = (t: number | undefined) => (t == null ? Infinity : (now - t) / DAY);
  if (!mem.notes.length) return since(mem.asked) >= FUTURE_ASK_EMPTY;
  return since(mem.notes[0].at) >= FUTURE_ASK_FRESH && since(mem.asked) >= FUTURE_ASK_GAP;
}

/** the invitation was shown now */
export function futureAsked(mem: FutureMem, now: number): FutureMem {
  return { ...mem, asked: now };
}

/** how long ago a note was left, in plain words: "today", "yesterday", "4 days ago", "2 weeks ago", "3 months ago" */
export function futureAge(at: number, now: number): string {
  const d0 = new Date(at);
  const d1 = new Date(now);
  const day = (d: Date) => Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / DAY + 0.5);
  const d = Math.max(0, day(d1) - day(d0));
  if (d === 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 14) return d + ' days ago';
  if (d < 60) return Math.floor(d / 7) + ' weeks ago';
  const m = Math.floor(d / 30);
  return m < 24 ? m + ' months ago' : Math.floor(d / 365) + ' years ago';
}

/** the small line over a note in SOS: who it is from and when */
export function futureCap(n: FutureNote, now: number): string {
  return 'From you, ' + futureAge(n.at, now);
}

/** a new note's id: the time and a few random letters (the app passes the random part in; this file is pure) */
export function futureId(now: number, rnd: string): string {
  return 'n' + now.toString(36) + '-' + rnd.replace(/[^a-z0-9]/g, '').slice(0, 6);
}
