/* Coming back after a gap (away.ts): turning the quiet-day rule on, marking a day the app was opened, and keeping the
   answer to "How many slips did you have while you were away?". Pure functions the app calls; the rule itself is in
   away.ts. Checked by test/away.test.ts. */
import { changeSettings } from './actions';
import { awayFromOf, withAway } from './away';
import { blankP, isKey } from './legacy/core.js';
import { addEvent, changeDay, withDay } from './mutate';
import type { DayKey, Days, Settings } from './types';

/** the quiet-day rule starts today, once: from now on the app marks each day it is opened (p.o). Null when already on. */
export function awayStart(st: Settings, tk: DayKey, now = Date.now()): Settings | null {
  if (awayFromOf(st)) return null;
  return changeSettings(st, (s) => void (s.awayFrom = tk), now);
}

/** the answer: n slips while away (0 or more). No entries are made: the days and times are not known. */
export function answerAwaySlips(st: Settings, gap: { from: DayKey; to: DayKey }, n: number, now = Date.now()): Settings {
  return changeSettings(st, (s) => void (s.away = withAway(s, gap, n)), now);
}

/** the first version's answers (see answerAway) */
export type AwayAnswer = 'clean' | 'some' | 'skip';

/** The first version's three answers, kept only until Welcome back asks with the slider (docs/plan.md, "Quiet days,
    simplified", step 2): 'clean' is no slips; 'some' logs a slip on each day picked and counts the rest as no slips, or
    with none picked leaves the gap unanswered; 'skip' leaves it unanswered. */
export function answerAway(
  days: Days,
  st: Settings,
  gap: { from: DayKey; to: DayKey },
  a: AwayAnswer,
  slipDays: DayKey[] = [],
  now = Date.now(),
): { days: Days; st: Settings } {
  const picked = a === 'some' ? [...new Set(slipDays)].filter((k) => isKey(k) && k >= gap.from && k <= gap.to).sort() : [];
  if (a === 'skip' || (a === 'some' && !picked.length)) return { days, st };
  let next = days;
  for (const k of picked) next = addEvent(next, k, 'slipped', null, {}, now).days;
  return { days: next, st: answerAwaySlips(st, gap, 0, now) };
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
