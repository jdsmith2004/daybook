/* Coming back after a gap (away.ts): turning the quiet-day rule on, and keeping the answer to "How did they go?".
   Pure functions the app calls; the rule itself is in away.ts. Checked by test/away.test.ts. */
import { changeSettings } from './actions';
import { awayFromOf, withAway, type AwayAnswer } from './away';
import { blankP, isKey } from './legacy/core.js';
import { addEvent, changeDay, withDay } from './mutate';
import type { DayKey, Days, Settings } from './types';

/** the quiet-day rule starts today, once: from now on the app marks each day it is opened (p.o). Null when already on. */
export function awayStart(st: Settings, tk: DayKey, now = Date.now()): Settings | null {
  if (awayFromOf(st)) return null;
  return changeSettings(st, (s) => void (s.awayFrom = tk), now);
}

/** the answer to "How did they go?" for a gap. 'some' logs a slip (with no time) on each day picked; with no day picked it
    is kept as 'skip', because then Daybook still does not know which days. */
export function answerAway(
  days: Days,
  st: Settings,
  gap: { from: DayKey; to: DayKey },
  a: AwayAnswer,
  slipDays: DayKey[] = [],
  now = Date.now(),
): { days: Days; st: Settings } {
  const picked = a === 'some' ? [...new Set(slipDays)].filter((k) => isKey(k) && k >= gap.from && k <= gap.to).sort() : [];
  const kept: AwayAnswer = a === 'some' && !picked.length ? 'skip' : a;
  let next = days;
  for (const k of picked) next = addEvent(next, k, 'slipped', null, {}, now).days;
  return { days: next, st: changeSettings(st, (s) => void (s.away = withAway(s, gap, kept)), now) };
}

/** today marked as a day the app was opened (p.o), or the same log when it already is */
export function markOpen(days: Days, tk: DayKey, now = Date.now()): Days {
  if (days[tk]?.p?.o) return days;
  return withDay(
    days,
    tk,
    changeDay(
      days[tk],
      tk,
      (d) => {
        const p = d.p || blankP();
        p.o = true;
        d.p = p;
      },
      now,
    ),
  );
}
