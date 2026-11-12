/* The north star (docs/plan.md, "Becoming free", step 4; the owner, November 11, 2026: "Yes, all four"): one question, once a
   month, "How much do you see yourself as someone free of this?", 0 to 10 on a slider, with the person's own proof beside it
   (miles.ts), so the answer is drawn from what they did, not from the mood of the minute.

   - It is first asked on the setup page before the account ask: the starting point. Then with the monthly five questions
     (recheck.ts), by the same clock (FREE_EVERY days since the last answer) and the same calm rule (no slip in TIP_CALM days),
     and never within FREE_QUIET hours of a slip or an SOS. Closed unanswered, it waits FREE_WAIT days. With no answer yet (setup
     came in the hours after a slip, or it was skipped), it is asked as soon as those rules allow.
   - It is for every habit: the five questions are for porn only, this one is not.
   - The answers are the person's own record, kept in the settings (st.free) and synced like the rest. The person sees their line
     on Weeks (components/weeks-pane.tsx).
   - What Daybook learns (events.ts): the number, and the urges ridden out and slips in the last 30 days, as counts. Never words.
   Checked by test/north.test.ts. */
import { addDays, diffDays, eventsOf, isKey } from './legacy/core.js';
import { changeSettings } from './actions';
import { identityLines, recordLines, type IdLine } from './miles';
import { BPS_EVERY, BPS_WAIT } from './recheck';
import { tipCalm } from './support';
import type { DayKey, Days, Reviews, Settings } from './types';

export const FREE_Q = 'How much do you see yourself as someone free of this?';
export const FREE_LO = 'Not yet';
export const FREE_HI = 'Fully';
/** days between two answers: the five questions' month */
export const FREE_EVERY = BPS_EVERY;
/** days a closed, unanswered question waits */
export const FREE_WAIT = BPS_WAIT;
/** hours after a slip or an SOS when it is never asked */
export const FREE_QUIET = 72;
/** answers kept at most (eight years of months) */
export const FREE_KEEP = 96;

export interface FreeAns {
  d: DayKey;
  s: number;
}
/** the moment just now: the time, and when an SOS was last open on this device (core urLastAt) */
export interface FreeNear {
  now: number;
  sos: number | null;
}

const okAns = (x: unknown): x is FreeAns => {
  const a = x as FreeAns | null;
  return !!a && isKey(a.d) && Number.isInteger(a.s) && a.s >= 0 && a.s <= 10;
};
/** every answer, oldest first, one a day */
export function freeList(st: Settings | null | undefined): FreeAns[] {
  const raw = (st && Array.isArray(st.free) ? st.free : []).filter(okAns);
  const by = new Map<DayKey, number>();
  raw.forEach((a) => by.set(a.d, a.s));
  return [...by.entries()].map(([d, s]) => ({ d, s })).sort((x, y) => x.d.localeCompare(y.d));
}

/** a slip in the last TIP_CALM days, or an SOS in the last FREE_QUIET hours: not now */
export function freeQuiet(days: Days, tk: DayKey, near: FreeNear | null): boolean {
  if (!tipCalm(days, tk)) return true;
  if (!near || near.sos == null) return false;
  return near.sos > near.now - FREE_QUIET * 3600_000 && near.sos <= near.now + 60_000;
}

/** whether the last setup page asks it: no answer yet, and not in the hours after a slip or an SOS */
export const freeAtSetup = (days: Days, st: Settings | null, tk: DayKey, near: FreeNear | null): boolean => !freeList(st).length && !freeQuiet(days, tk, near);

/** whether it is due now (with the five questions, or alone when they are not) */
export function freeDue(days: Days, st: Settings, tk: DayKey, near: FreeNear | null): boolean {
  const list = freeList(st);
  if (list.length && diffDays(tk, list[list.length - 1].d) < FREE_EVERY) return false;
  if (isKey(st.freeNo) && diffDays(tk, st.freeNo as DayKey) < FREE_WAIT) return false;
  return !freeQuiet(days, tk, near);
}

/** the settings with an answer kept (one a day, the latest), and the wait after a closed one let go */
export function freeKeep(st: Settings, tk: DayKey, s: number, now = Date.now()): Settings {
  const v = Math.max(0, Math.min(10, Math.round(s)));
  return changeSettings(
    st,
    (x) => {
      x.free = [...freeList(x).filter((a) => a.d !== tk), { d: tk, s: v }].slice(-FREE_KEEP);
      delete x.freeNo;
    },
    now,
  );
}

/** closed or skipped unanswered: it asks again in FREE_WAIT days */
export const freeLater = (st: Settings, tk: DayKey, now = Date.now()): Settings => changeSettings(st, (x) => void (x.freeNo = tk), now);

/** what the answer says, next to the last one. A higher number is the win; a lower one is never a fault. */
export function freeResult(s: number, last: number | null): { h: string; p: string } {
  if (last == null) return { h: s + ' of 10', p: 'Your starting point. Once a month you answer again, next to what you did, and see your line on Weeks.' };
  if (s > last) return { h: 'Up from ' + last + ' to ' + s, p: 'You see it in yourself more than a month ago. That came from what you did.' };
  if (s === last) return { h: 'Still ' + s + ' of 10', p: 'Holding steady. What you did this month is yours, and the next answer has a month to move.' };
  return {
    h: s + ' of 10 this month',
    p: 'Some months feel heavier. Everything on your record is still there, and the next month starts with the next choice.',
  };
}

/* the proof shown beside the question: the strongest evidence first */
const PROOF_ORDER = ['wave', 'sun', 'sunrise', 'shield', 'phone', 'flame', 'book', 'pencil', 'leaf'];
/** up to `max` lines of the person's own proof (miles.ts), strongest first; none for someone with no record yet */
export function freeProof(days: Days, st: Settings, reviews: Reviews, tk: DayKey, max = 2, downs = 0): IdLine[] {
  const all = [...identityLines(days, st, reviews, tk, downs), ...recordLines(days, st, tk)];
  const rank = (l: IdLine) => {
    const i = PROOF_ORDER.indexOf(l.ic);
    return i < 0 ? PROOF_ORDER.length : i;
  };
  return all.sort((a, b) => rank(a) - rank(b)).slice(0, max);
}

/** urges ridden out and slips in the 30 days up to today: the counts Daybook steers by, beside the answer */
export function freeCounts(days: Days, tk: DayKey): { rode30: number; slips30: number } {
  const from = addDays(tk, -29);
  let rode30 = 0;
  let slips30 = 0;
  for (const e of eventsOf(days, from)) {
    if (e.key > tk) continue;
    if (e.outcome === 'rode') rode30++;
    else if (e.outcome === 'slipped') slips30++;
  }
  return { rode30, slips30 };
}
