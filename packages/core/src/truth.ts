/* The true record (docs/review-plan.md C1 and WP1; the owner's decision D1, November 12, 2026): a night nobody told Daybook about is
   not a free night.

   From settings.truthFrom (a day key, written once on the first open after the update, the way keepCounts wrote countFrom, synced,
   never moved), each day's night has one of three states:
   - 'slip': a slip is logged for that log day, by any way in (an entry, the morning's It happened, Welcome back's number).
   - 'free': the person said so. The next morning's "How was last night?" (MorningSet.n on the day after), the catch-up row for the
     night before last (MorningSet.n2, two days after), an evening check-in on that day, or Welcome back's answer for a gap.
   - 'untold': nothing was said. It is drawn hollow and counts as nothing: never a free night, never a slip. A run waits on it.
   Before truthFrom every rule is exactly as it was (a day with no slip logged counts), so nothing earned before it moves and the
   golden fixtures, which have no truthFrom, do not change.

   The rule itself lives in away.ts, which already decides which days Daybook knows about (dayKnown): from truthFrom on, a day is
   known only when it was told. So the run, the longest run, the no-slip days, graduation, Today's week and the badges that read
   them all follow without a rule of their own. This file only reads what was said on the days themselves, and imports nothing from
   legacy/core.js, because legacy/core.js imports away.ts, which imports this. Checked by test/truth.test.ts. */
import type { DayKey, Days, Settings } from './types';

export type NightState = 'free' | 'slip' | 'untold';

const isKey = (k: unknown): k is DayKey => typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k);
const next = (k: DayKey, n: number): DayKey => {
  const [y, m, d] = k.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.getUTCFullYear() + '-' + String(t.getUTCMonth() + 1).padStart(2, '0') + '-' + String(t.getUTCDate()).padStart(2, '0');
};

/** the day the true record starts for this person, or null (the old rule everywhere) */
export const truthFromOf = (st: Settings | null | undefined): DayKey | null => {
  const v = st && (st as { truthFrom?: unknown }).truthFrom;
  return isKey(v) ? v : null;
};

/** whether day k is under the true record */
export const truthOn = (st: Settings | null | undefined, k: DayKey): boolean => {
  const t = truthFromOf(st);
  return !!t && k >= t;
};

/** what the days themselves say about the night of log day k: a slip logged, a night told free, or nothing. Welcome back's answers
    are not read here (away.ts adds them, since they cover a gap and not a day). */
export function toldOn(days: Days, k: DayKey): 'free' | 'slip' | null {
  const d = days[k];
  if (d?.events?.some((e) => e.outcome === 'slipped')) return 'slip';
  /* a win logged in Mithras that day (mithras.ts) told it */
  if (d?.p?.mw) return 'free';
  const n1 = days[next(k, 1)]?.p?.ms?.n;
  if (n1) return n1;
  const n2 = days[next(k, 2)]?.p?.ms?.n2;
  if (n2) return n2;
  /* an evening check-in tells its day (the app before November 12 asked in the evening, not the morning) */
  if (d?.checkin?.done) return 'free';
  return null;
}
