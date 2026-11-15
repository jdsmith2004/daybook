/* Saved answers: the options a person writes with "Write my own", kept for good and offered again everywhere that kind of answer is
   asked (the owner, November 15, 2026: "If I write an option, it should persist. Across the entire app." and "If I write one, that
   will never get deleted ... We just remember those."). So a written answer is never lost when another chip is tapped: it is saved
   the moment Add is pressed, it shows as a chip beside the built-in ones from then on, on this page and every other page that asks
   the same kind of thing.

   They live on the settings (Settings.own), one list per kind, so they sync and go into the safe copy with the rest. Two copies
   of the settings are joined, never one chosen (keepEarned in data.ts calls joinOwn), so a word written on one phone is not lost
   to a change made on another. Nothing removes one: the only limit is OWN_KEEP per kind, far past what a person writes, and only
   then does the oldest make room.

   The kinds (OWN_KINDS) are what is being asked, not where: a reason written on the morning page is offered on My plan's reasons,
   in setup and in the Sunday review. "What set it off" and "What did you do" keep their own older lists (Settings.opts, mutate.ts
   addOption), because entries point at them by id; SavedChips in the app reads both the same way. Checked by
   test/saved-answers.test.ts. */
import { changeSettings } from './actions';
import type { Settings } from './types';

/** what a written answer answers. Add a kind here when a new question gets "Write my own". */
export const OWN_KINDS = [
  /** why: the reasons to be free (My plan, the morning's "What is tonight for?") */
  'reason',
  /** the "then" half of an if-then plan: what I will do instead (My plan, the Sunday review's plan) */
  'then',
  /** the "when" half: the moment the urge tends to come (My plan, the Sunday review's plan) */
  'when',
  /** a small goal for the week (the Sunday review) */
  'goal',
  /** what worked this week (the Sunday review) */
  'worked',
  /** what to change next week (the Sunday review) */
  'change',
  /** what makes the hours hard (Talk it through) */
  'need',
  /** a move to make when it comes, or one thing to do until it passes (Talk it through, Walk it through's "Then I will") */
  'move',
  /** what is holding it down (Walk it through) */
  'hold',
  /** what the urge is telling me (Walk it through) */
  'line',
  /** the thought, named (the ride's Name the thought) */
  'thought',
  /** who I am becoming (Who I am becoming) */
  'become',
] as const;
export type OwnKind = (typeof OWN_KINDS)[number];

/** the longest written answer, in characters */
export const OWN_MAX = 120;
/** how many are kept per kind: far past what a person writes; only past it does the oldest make room */
export const OWN_KEEP = 60;

const isKind = (k: unknown): k is OwnKind => typeof k === 'string' && (OWN_KINDS as readonly string[]).includes(k);
/** one written answer, cleaned: one line, single spaces, at most OWN_MAX */
export const cleanOwn = (t: unknown): string =>
  String(t ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, OWN_MAX)
    .trim();
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** the person's written answers of one kind, oldest first */
export function ownOf(st: Settings | null | undefined, kind: OwnKind): string[] {
  return (st && st.own && st.own[kind]) || [];
}

/** keeps a written answer. The same words (in any case) are kept once; a built-in answer with the same words is not kept again,
    since it is already offered. Gives back the settings unchanged when there is nothing new. */
export function keepOwn(st: Settings, kind: OwnKind, text: string, builtIn: readonly string[] = [], now = Date.now()): Settings {
  const t = cleanOwn(text);
  if (!t || !isKind(kind)) return st;
  if (builtIn.some((b) => same(b, t)) || ownOf(st, kind).some((x) => same(x, t))) return st;
  return changeSettings(
    st,
    (s) => {
      const own = { ...(s.own || {}) };
      const list = [...(own[kind] || []), t];
      own[kind] = list.slice(-OWN_KEEP);
      s.own = own;
    },
    now,
  );
}

/** keeps several at once (an old answer moved into the list, a whole page's picks) */
export function keepOwnAll(st: Settings, kind: OwnKind, texts: readonly string[], builtIn: readonly string[] = [], now = Date.now()): Settings {
  return texts.reduce((s, t) => keepOwn(s, kind, t, builtIn, now), st);
}

/** the choices to show: the built-in ones, then the person's own of that kind that are not already among them, then any picked
    words that are neither (an answer from before saved answers, so it never disappears from its page) */
export function ownChoices(st: Settings | null | undefined, kind: OwnKind, builtIn: readonly string[], picked: readonly string[] = []): string[] {
  const out: string[] = [];
  const add = (x: string) => {
    const t = cleanOwn(x);
    if (t && !out.some((y) => same(y, t))) out.push(t);
  };
  builtIn.forEach(add);
  ownOf(st, kind).forEach(add);
  picked.forEach(add);
  return out;
}

/** whether a choice is one the person wrote (for the pencil mark beside it) */
export const isOwn = (st: Settings | null | undefined, kind: OwnKind, t: string): boolean => ownOf(st, kind).some((x) => same(x, t));

/** the saved answers, cleaned (normSettings): only known kinds, only strings, each list without repeats and at most OWN_KEEP.
    Left out when there are none, so older records need no change. */
export function normOwn(x: unknown): Settings['own'] {
  if (!x || typeof x !== 'object') return undefined;
  const out: NonNullable<Settings['own']> = {};
  for (const [k, v] of Object.entries(x as Record<string, unknown>)) {
    if (!isKind(k) || !Array.isArray(v)) continue;
    const list: string[] = [];
    v.forEach((t) => {
      if (typeof t !== 'string') return;
      const c = cleanOwn(t);
      if (c && !list.some((y) => same(y, c))) list.push(c);
    });
    if (list.length) out[k] = list.slice(-OWN_KEEP);
  }
  return Object.keys(out).length ? out : undefined;
}

/** two copies joined (sync and the safe copy, data.ts keepEarned): every answer either side wrote, the winner's order first */
export function joinOwn(win: Settings['own'], lose: Settings['own']): Settings['own'] {
  if (!lose) return win;
  const out: NonNullable<Settings['own']> = { ...(win || {}) };
  for (const k of OWN_KINDS) {
    const b = lose[k];
    if (!b || !b.length) continue;
    const a = [...(out[k] || [])];
    b.forEach((t) => {
      if (!a.some((y) => same(y, t))) a.push(t);
    });
    out[k] = a.slice(-OWN_KEEP);
  }
  return Object.keys(out).length ? out : undefined;
}
