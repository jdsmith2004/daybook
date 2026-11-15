/* The Sunday review's one goal for next week (rebuilt from its purpose, the owner, November 15, 2026: "clear feedback on what
   happened the previous week. And then clear feedback on what goals I should have for the next week", and "if I press late
   nights, what does that mean I'm gonna do?").

   Daybook offers two or three goals, each from the person's own week, and each says three things plainly:
   - why: what the week showed, in plain numbers ("3 of your 4 slips came after 9 PM.");
   - the plan: what the person will do, as an if-then plan ("When it gets to 10:30 PM, the phone goes in another room."),
     kept as the week's plan, so Today and SOS show it (sunPlanNow);
   - what happens: where it shows ("On Today, under your count: 0 of 5 nights"), what counts it ("Each Good night counts"),
     and the reminder it turns on, if any.
   One goal only, on purpose: a single plan is kept far more often than several (Dalton and Spiller 2012; Verhoeven and
   others 2013), and a goal checked through the week, with the result shown, works better than one set and left (Harkin and
   others 2016). The goal stays small and close: a few nights or days, never a count of slips. */
import { fmtClock } from './legacy/core.js';
import { SUN_GOALS, sunGoalOf, type SunGoal, type SunGoalKind, type SunLast, type SunWeek } from './sunday';
import type { Settings } from './types';

/** the reminder a goal can turn on, by its switch in the reminder settings (nudges.ts NudgePrefs) */
export type SunRemind = 'wind' | 'checkin' | 'lesson';

/** what counts a goal, and the reminder that helps it */
export const SUN_HOW: Record<SunGoalKind, { count: string; remind: SunRemind | null }> = {
  phone: { count: 'Tap Good night when the phone goes down. Each night counts.', remind: 'wind' },
  wind: { count: 'Tick your wind-down on Today, or tap Good night. Each night counts.', remind: 'wind' },
  sleep: { count: 'Your check-in asks how long you slept. Each night of seven hours counts.', remind: 'wind' },
  checkin: { count: 'Each evening check-in counts. It takes about a minute.', remind: 'checkin' },
  reach: { count: 'Your check-in asks whether you reached out. Each day counts.', remind: null },
  lesson: { count: 'Each day with a lesson counts.', remind: 'lesson' },
};

/** "22:30" less m minutes, on the clock */
const before = (t: string, m: number) => {
  const v = (((+t.slice(0, 2) * 60 + +t.slice(3, 5) - m) % 1440) + 1440) % 1440;
  return String(Math.floor(v / 60)).padStart(2, '0') + ':' + String(v % 60).padStart(2, '0');
};
const isClock = (t: unknown): t is string => typeof t === 'string' && /^\d{2}:\d{2}$/.test(t);
/** the screens-off time, or 10:30 PM when there is none */
const off = (st: Settings) => (isClock(st.screensOff) ? st.screensOff : '22:30');

/** the reminder's words: "A reminder at 9:30 PM each night", or null when the goal has none */
export function sunRemindLine(k: SunGoalKind, st: Settings, checkinAt = '18:00'): string | null {
  const r = SUN_HOW[k].remind;
  if (r === 'wind') return 'A reminder at ' + fmtClock(before(off(st), 60)) + ', an hour before ' + fmtClock(off(st));
  if (r === 'checkin') return 'A reminder at ' + fmtClock(isClock(checkinAt) ? checkinAt : '18:00') + ' each day';
  if (r === 'lesson') return 'A reminder for the day’s lesson';
  return null;
}

/** the plan for a goal, as an if-then plan (when, then), in the person's words */
export function sunPlanFor(k: SunGoalKind, st: Settings, checkinAt = '18:00'): { w: string; t: string } {
  const o = fmtClock(off(st));
  switch (k) {
    case 'phone':
      return { w: 'it gets to ' + o, t: 'put my phone in another room' };
    case 'wind':
      return { w: 'it gets to ' + fmtClock(before(off(st), 60)), t: 'start winding down, screens dimmed' };
    case 'sleep':
      return { w: 'it gets to ' + o, t: 'go to bed and leave my phone outside' };
    case 'checkin':
      return { w: 'it gets to ' + fmtClock(isClock(checkinAt) ? checkinAt : '18:00'), t: 'check in on Daybook' };
    case 'reach':
      return { w: 'I feel low or alone', t: 'text someone before I open anything else' };
    case 'lesson':
      return { w: 'I first open Daybook each day', t: 'read the day’s lesson' };
  }
}

export interface SunOption {
  id: string;
  g: SunGoal;
  /** what the week showed, in one plain sentence */
  why: string;
  /** what the person will do */
  plan: { w: string; t: string };
}

/* for each thing the week showed, the goal that answers it and the words for why */
const n = (v: number, one: string, many = one + 's') => v + ' ' + (v === 1 ? one : many);
type Seen = { id: string; k: SunGoalKind; why: string };
function seen(w: SunWeek): Seen[] {
  const out: Seen[] = [];
  const trig = (id: string) => w.trig[id] || { rode: 0, slipped: 0 };
  if (w.lateSlips >= 2 || (w.lateSlips >= 1 && w.lateSlips === w.slipped))
    out.push({
      id: 'late',
      k: 'phone',
      why:
        (w.lateSlips === w.slipped
          ? w.slipped === 1
            ? 'Your slip'
            : 'All ' + w.slipped + ' of your slips'
          : w.lateSlips + ' of your ' + w.slipped + ' slips') + ' came after 9 PM.',
    });
  else if (w.lateUrges >= 3) out.push({ id: 'late', k: 'phone', why: n(w.lateUrges, 'urge') + ' came after 9 PM. Late nights are your hard hours.' });
  if (w.screensLate >= 2) out.push({ id: 'screens', k: 'phone', why: 'Your screens were on late ' + n(w.screensLate, 'night') + '.' });
  const sl = w.sleep.length >= 3 ? w.sleep.reduce((a, b) => a + b, 0) / w.sleep.length : null;
  if (sl != null && sl < 6.5)
    out.push({ id: 'sleep', k: 'sleep', why: 'You slept about ' + Math.round(sl * 10) / 10 + ' hours a night. Tired nights are harder ones.' });
  const lonely = trig('lonely');
  if (lonely.slipped || lonely.rode >= 2)
    out.push({
      id: 'lonely',
      k: 'reach',
      why: 'Feeling lonely came up ' + n(lonely.rode + lonely.slipped, 'time') + '. Reaching out is the answer to that one.',
    });
  const tired = trig('tired');
  if (tired.slipped || tired.rode >= 2) out.push({ id: 'tired', k: 'sleep', why: 'Being tired set it off ' + n(tired.rode + tired.slipped, 'time') + '.' });
  const scroll = trig('scroll');
  if (scroll.slipped || scroll.rode >= 2) out.push({ id: 'scroll', k: 'phone', why: 'Scrolling set it off ' + n(scroll.rode + scroll.slipped, 'time') + '.' });
  if (w.days >= 5 && w.checkins <= 3)
    out.push({ id: 'checkin', k: 'checkin', why: 'You checked in on ' + w.checkins + ' of ' + w.days + ' days. A truer log shows you more next Sunday.' });
  if (w.lessons <= 3) out.push({ id: 'lesson', k: 'lesson', why: 'You read lessons on ' + n(w.lessons, 'day') + '. Each one turns a belief over.' });
  out.push({
    id: 'phone',
    k: 'phone',
    why: w.phone ? 'Your phone went down for the night ' + n(w.phone, 'time') + '. Less to fight in bed.' : 'The phone in bed is where most late urges start.',
  });
  out.push({ id: 'checkin', k: 'checkin', why: 'Each check-in is one more true day for next Sunday to show you.' });
  out.push({ id: 'lesson', k: 'lesson', why: 'You read lessons on ' + n(w.lessons, 'day') + '. Keep the work going.' });
  return out;
}

/** the goals to choose from: last week's again when it was not kept, then what the week showed, three at most, each a different
    goal. Counts start from the goal's usual size (SUN_GOALS), or one more than last week when it was kept. */
export function sunOptions(
  w: SunWeek,
  st: Settings,
  last?: { g: SunGoal; done: number | null; met: boolean; how?: SunLast } | null,
  checkinAt?: string,
): SunOption[] {
  const out: SunOption[] = [];
  const has = (k: SunGoalKind) => out.some((o) => o.g.k === k);
  if (last && last.g.k && !last.met && last.done != null && last.g.n) {
    const k = last.g.k;
    out.push({
      id: 'again',
      g: sunGoalOf(k, st, last.g.n),
      why: 'Last week: ' + last.done + ' of ' + last.g.n + ' ' + SUN_GOALS[k].unit + '. One more week makes it yours.',
      plan: sunPlanFor(k, st, checkinAt),
    });
  }
  for (const s of seen(w)) {
    if (out.length >= 3) break;
    if (has(s.k)) continue;
    /* never below what the week already did: one more than that, or one more than last week's goal when it was kept */
    const did: Partial<Record<SunGoalKind, number>> = { lesson: w.lessons, checkin: w.checkins, phone: w.phone, reach: w.reach, sleep: w.sleep7 };
    const base = Math.max(SUN_GOALS[s.k].n, (did[s.k] ?? 0) + 1, last && last.met && last.g.k === s.k && last.g.n ? last.g.n + 1 : 0);
    const up = Math.min(7, base);
    out.push({ id: s.id, g: sunGoalOf(s.k, st, up), why: s.why, plan: sunPlanFor(s.k, st, checkinAt) });
  }
  return out;
}

/** a goal in the person's own words: it waits on Today, and next Sunday asks how it went */
export const sunOwnGoal = (t: string): SunGoal => ({ t: t.replace(/\s+/g, ' ').trim().slice(0, 80) });
