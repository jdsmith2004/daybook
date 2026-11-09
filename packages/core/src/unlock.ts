/* Unlocked (the owner, November 9, 2026: "we don't waterboard them with features"). Setup stays short: a part that is not
   needed on the first night opens later, one at a time, as the person uses the app. Each comes as one card on Today, "Unlocked",
   that opens its own page with the flame big, and then lives where it always lives (the journal on Today's pull-down and in
   Change, the apps that pull you in under More).

   The rules, so it never crowds the day:
   - in order, one at a time, and each only once (kept on this device, like the first pattern);
   - each waits for its day: the journal from day UNLOCK_JOURNAL_DAY with two lessons done, the apps that pull you in from
     day UNLOCK_PULL_DAY (the first week, when the hard hours are starting to be known);
   - UNLOCK_GAP days at least between two, so a new part is never the third thing in a week;
   - low on Today, like the five questions: it waits behind the day's next stop as "After this", and is the card once the
     day's stops are done, so it never pushes the lesson off the flame;
   - never on the day of a slip or the day after, and never in the hours after an SOS (the caller passes `quiet`);
   - a part already in use (a journal entry written, the journal on the day, apps already picked) is never offered.
   Once shown as the card it stays the card for that day until opened, and is gone the next day. Checked by test/unlock.test.ts. */
import { addDays, diffDays, sumDay } from './legacy/core.js';
import { lessonsDone } from './lessons';
import type { DayKey, Days, Settings } from './types';

export type UnlockId = 'journal' | 'pull';
export const UNLOCK_ORDER: UnlockId[] = ['journal', 'pull'];
export const UNLOCK_JOURNAL_DAY = 3;
export const UNLOCK_PULL_DAY = 7;
export const UNLOCK_GAP = 3;

/** what this device remembers: the day each was first the card, and whether its page was opened */
export type UnlockMem = Partial<Record<UnlockId, { d: DayKey; o?: 1 }>>;

/** what only the device knows */
export interface UnlockEnv {
  /** the journal holds an entry already, or it is on the day */
  journalUsed?: boolean;
  /** this iPhone build can watch the apps (Screen Time) and none are picked yet */
  pull?: boolean;
  /** an SOS or a slip in the last hours, or the day the person came back (lib/quiet-asks.ts) */
  quiet?: boolean;
}

export function normUnlockMem(v: unknown): UnlockMem {
  const out: UnlockMem = {};
  if (!v || typeof v !== 'object') return out;
  for (const id of UNLOCK_ORDER) {
    const x = (v as Record<string, unknown>)[id] as { d?: unknown; o?: unknown } | undefined;
    if (x && typeof x.d === 'string') out[id] = x.o ? { d: x.d, o: 1 } : { d: x.d };
  }
  return out;
}

/** the day number of `tk` in the person's own count: the first day is 1 */
const dayN = (st: Settings, tk: DayKey) => diffDays(tk, st.start) + 1;

function ready(id: UnlockId, days: Days, st: Settings, tk: DayKey, env: UnlockEnv): boolean {
  if (id === 'journal') return !env.journalUsed && dayN(st, tk) >= UNLOCK_JOURNAL_DAY && lessonsDone(days).size >= 2;
  return !!env.pull && dayN(st, tk) >= UNLOCK_PULL_DAY;
}

/** the part that is unlocked now, or null */
export function unlockNow(days: Days, st: Settings, tk: DayKey, mem: UnlockMem, env: UnlockEnv): UnlockId | null {
  if (!st || !st.start || tk < st.start) return null;
  /* today's card stays until its page is opened (still only while it is still for this phone) */
  for (const id of UNLOCK_ORDER) {
    const m = mem[id];
    if (m && m.d === tk && !m.o && ready(id, days, st, tk, env)) return id;
  }
  if (env.quiet) return null;
  if (sumDay(days[tk]).slipped || sumDay(days[addDays(tk, -1)]).slipped) return null;
  const last = UNLOCK_ORDER.map((id) => mem[id]?.d)
    .filter((d): d is DayKey => !!d)
    .sort()
    .pop();
  if (last && diffDays(tk, last) < UNLOCK_GAP) return null;
  return UNLOCK_ORDER.find((id) => !mem[id] && ready(id, days, st, tk, env)) || null;
}

export interface UnlockWords {
  /** Today's card: the small words over it, and its title */
  eb: string;
  h: string;
  /** the page: the title, the line under it, what the flame says, and the main button */
  title: string;
  line: string;
  say: string;
  btn: string;
}

export const UNLOCK_WORDS: Record<UnlockId, UnlockWords> = {
  journal: {
    eb: 'Unlocked',
    h: 'Your journal',
    title: 'You unlocked your journal',
    line: 'A page only for you. Nothing in it is ever shared.',
    say: 'Name how the day felt, in one word or a few lines. Naming it takes some of its weight. Pull down on Today any time to write.',
    btn: 'Write the first one',
  },
  pull: {
    eb: 'Unlocked',
    h: 'The app that pulls you in',
    title: 'Which app pulls you in?',
    line: 'Nothing about your apps ever leaves this phone.',
    say: 'When it has you too long, I will say so. In your hard hours, I will say it louder.',
    btn: 'Choose the apps',
  },
};
