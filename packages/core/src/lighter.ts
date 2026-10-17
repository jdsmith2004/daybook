/* A lighter Daybook: after a long stretch with no slip and a quiet couple of weeks, Daybook offers to step back. It is the
   person's choice, and it can be undone any time. The lighter Today keeps SOS, the plan, the points and the log, and lets the
   daily stops, the days card and the nudges go quiet. A slip later on goes to Rekindle like any other slip: nothing is taken
   away, and the full Today is one tap away for anyone who wants more support for a while. It is never a failed test.

   Two settings hold it, both optional so older records need no change: lean (the day the lighter Today began) and leanNo
   (the last "Not now", so the offer waits a while before it comes back). Checked by test/lighter.test.ts. */
import { changeSettings, type Change } from './actions';
import { addDays, diffDays, eventsOf, isKey } from './legacy/core.js';
import type { DayKey, Days, Settings } from './types';

/** days in a row with no slip before the offer comes (the owner can change this number) */
export const LEAN_DAYS = 90;
/** the recent stretch that has to be quiet, and how many urges it can hold and still count as quiet */
export const LEAN_QUIET_DAYS = 14;
export const LEAN_QUIET_URGES = 3;
/** after "Not now", how long the offer waits */
export const LEAN_ASK_AGAIN = 30;
/** after a slip in the lighter Today, how long the gentle "full Today" line stays */
export const LEAN_SLIP_DAYS = 7;

export const leanOf = (st: Settings | null): DayKey | null => (st && isKey(st.lean) ? (st.lean as DayKey) : null);

export interface LeanInfo {
  /** full days in a row with no slip, counted up to yesterday */
  clean: number;
  /** urges logged in the recent stretch */
  urges: number;
  /** long enough with no slip, and quiet lately */
  ready: boolean;
  /** the day the lighter Today began, or null */
  on: DayKey | null;
  /** show the offer on Today */
  offer: boolean;
  /** a slip since the lighter Today began, in the last few days */
  slipSince: DayKey | null;
}

export function leanInfo(days: Days, st: Settings, tk: DayKey): LeanInfo {
  const evs = eventsOf(days).filter((e) => e.key <= tk);
  const slips = evs.filter((e) => e.outcome === 'slipped').map((e) => e.key);
  const last = slips.length ? slips.reduce((a, b) => (b > a ? b : a)) : null;
  const from = last ? addDays(last, 1) : isKey(st.day1) ? st.day1 : null;
  const clean = from && from <= tk ? diffDays(tk, from) : 0;
  const since = addDays(tk, -LEAN_QUIET_DAYS);
  const urges = evs.filter((e) => e.outcome === 'rode' && e.key > since).length;
  const ready = clean >= LEAN_DAYS && urges <= LEAN_QUIET_URGES;
  const on = leanOf(st);
  const no = isKey(st.leanNo) ? (st.leanNo as DayKey) : null;
  const offer = !on && ready && !(no && diffDays(tk, no) < LEAN_ASK_AGAIN);
  const slipSince = on && last && last >= on && diffDays(tk, last) <= LEAN_SLIP_DAYS ? last : null;
  return { clean, urges, ready, on, offer, slipSince };
}

/** start the lighter Today */
export const leanStart = (st: Settings, tk: DayKey, now = Date.now()): Change => ({
  st: changeSettings(st, (s) => void ((s.lean = tk), (s.leanNo = null)), now),
  toast: 'Lighter Today is on. Everything you need is still here.',
});

/** back to the full Today. The offer waits a while before it shows on Today again; the sheet can still turn it back on. */
export const leanStop = (st: Settings, tk: DayKey, now = Date.now()): Change => ({
  st: changeSettings(st, (s) => void ((s.lean = null), (s.leanNo = tk)), now),
  toast: 'The full Today is back.',
});

/** "Not now": the offer waits LEAN_ASK_AGAIN days */
export const leanLater = (st: Settings, tk: DayKey, now = Date.now()): Change => ({
  st: changeSettings(st, (s) => void (s.leanNo = tk), now),
  toast: 'Okay. Everything stays as it is.',
});
