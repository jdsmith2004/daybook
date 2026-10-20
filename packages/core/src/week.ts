/* The first week, looked back on, once. A week after the start, Today offers a short look back: what the person did with
   their first seven days, the sentence they chose about who they are becoming, and the next small step. It closes the
   first week as something finished, not a count to keep. No big goals: graduation is not mentioned (CLAUDE.md, "No big
   goals pushed early"). Checked by test/week.test.ts. */
import { changeSettings } from './actions';
import { addDays, diffDays, fmtDate, isKey, LESSON_IDS } from './legacy/core.js';
import { loggedDay } from './log-start';
import type { DayKey, Days, Settings } from './types';

export interface FirstWeek {
  h: string;
  line: string;
  facts: { n: number; one: string; many: string }[];
  be: string;
  next: string;
}

/** Today offers it from the day after the first seven, for a week, until it is opened */
export const firstWeekDue = (st: Settings, tk: DayKey): boolean => !isKey(st.wk1) && diffDays(tk, st.start) >= 7 && diffDays(tk, st.start) < 14;
/** opened: it does not come back */
export const firstWeekSeen = (st: Settings, tk: DayKey, now = Date.now()) => changeSettings(st, (s) => void (s.wk1 = tk), now);

export function firstWeek(days: Days, st: Settings, tk: DayKey): FirstWeek {
  const keys = Array.from({ length: 7 }, (_, i) => addDays(st.start, i));
  let logged = 0;
  let rode = 0;
  let slips = 0;
  let checkins = 0;
  const lessons = new Set<string>();
  for (const k of keys) {
    const d = days[k];
    if (!d) continue;
    if (loggedDay(d)) logged++;
    for (const e of d.events) e.outcome === 'rode' ? rode++ : slips++;
    if (d.checkin && d.checkin.done) checkins++;
    (d.p?.ls || []).forEach((id) => LESSON_IDS.indexOf(id) >= 0 && lessons.add(id));
  }
  const facts = [
    { n: logged, one: 'day logged', many: 'days logged' },
    { n: rode, one: 'urge ridden out', many: 'urges ridden out' },
    { n: slips, one: 'slip logged honestly', many: 'slips logged honestly' },
    { n: checkins, one: 'check-in', many: 'check-ins' },
    { n: lessons.size, one: 'lesson finished', many: 'lessons finished' },
  ].filter((f) => f.n > 0);
  const d1 = isKey(st.day1) ? (st.day1 as DayKey) : null;
  const next =
    d1 && d1 > tk
      ? 'Day 1 is ' + fmtDate(d1, { weekday: 'long', month: 'short', day: 'numeric' }) + '. Until then, keep logging: every entry teaches you something.'
      : d1
        ? 'Next: one day at a time. Log every urge, whatever happens, and tap SOS when one starts.'
        : 'Next: keep logging. Start a Day 1 whenever you are ready.';
  return {
    h: logged ? 'Your first week, done.' : 'A week in, and you are still here.',
    line: logged
      ? 'Seven days ago you started. Here is what you did with them.'
      : 'Nothing was logged this week, and that is okay. Coming back is what counts, and you came back.',
    facts,
    be: String(st.becoming || '').trim(),
    next,
  };
}
