/* The Sunday review's two jobs (the owner, November 15, 2026): help the person understand the week they had, and get ready for
   the next one with a goal that changes them, "not on not watching porn but on changing your mindset and doing things that will
   make you not want to watch porn more", like "read a lesson every single day". So:

   - sunSays: what the week says, in three plain lines at most, each one pointing at what would help next week. Numbers only
     where they explain something.
   - sunOptions: three goals to choose from, each a thing that grows the person, not a count of slips: a lesson every day, the
     phone out of the bedroom, sleep, real connection, moving the body, faith (only for someone who said it matters), and reading
     who they are becoming. The first three fit the week; the rest are a tap away (sunMore). Each says why, from the week, and
     comes with its plan, as an if-then plan ("When it gets to 10:30 PM, I will put my phone in another room."), kept as the
     week's plan (sunPlanNow).
   - SUN_HOW and sunRemindLine: what counts a goal and the reminder it turns on, so every choice says what it will do.
   One goal only, on purpose: a single plan is kept far more often than several (Dalton and Spiller 2012), and a goal checked
   through the week, with the result shown, works better than one set and left (Harkin and others 2016). */
import { fmtClock } from './legacy/core.js';
import { SUN_GOALS, sunGoalOf, type SunGoal, type SunGoalKind, type SunLast, type SunWeek } from './sunday';
import { faithOn } from './two-moments';
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

/** the reminder's words: "A reminder at 9:30 PM, an hour before 10:30 PM", or null when the goal has none */
export function sunRemindLine(k: SunGoalKind, st: Settings, checkinAt = '18:00'): string | null {
  const r = SUN_HOW[k].remind;
  if (r === 'wind') return 'A reminder at ' + fmtClock(before(off(st), 60)) + ', an hour before ' + fmtClock(off(st));
  if (r === 'checkin') return 'A reminder at ' + fmtClock(isClock(checkinAt) ? checkinAt : '18:00') + ' each day';
  if (r === 'lesson') return 'A reminder for the day’s lesson';
  return null;
}

/** a countable goal by its name: seven days of lessons is "A lesson every day" */
export function sunGoalNamed(k: SunGoalKind, st: Settings, n?: number): SunGoal {
  const g = sunGoalOf(k, st, n);
  return k === 'lesson' && g.n === 7 ? { ...g, t: 'A lesson every day' } : g;
}

/* the goals the log cannot count: kept in the person's words, on Today all week, and asked about next Sunday */
export type SunGrow = 'move' | 'faith' | 'become';
const GROW: Record<SunGrow, string> = {
  move: 'Move my body most days',
  faith: 'Pray or read scripture each morning',
  become: 'Read who I am becoming each morning',
};

/** the plan for a goal, as an if-then plan (when, then), in the person's words */
export function sunPlanFor(k: SunGoalKind | SunGrow, st: Settings, checkinAt = '18:00'): { w: string; t: string } {
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
      return { w: 'I feel low or alone', t: 'text or call someone before I open anything else' };
    case 'lesson':
      return { w: 'I first open Daybook each day', t: 'read the day’s lesson' };
    case 'move':
      return { w: 'I feel restless or stressed', t: 'go for a walk or a run first' };
    case 'faith':
      return { w: 'I wake up', t: 'pray or read before I pick up my phone' };
    case 'become':
      return { w: 'I first open Daybook each morning', t: 'read who I am becoming, out loud' };
  }
}

export interface SunOption {
  id: SunGoalKind | SunGrow;
  g: SunGoal;
  /** what the week showed, and why this goal changes things, in one or two plain sentences */
  why: string;
  /** what the person will do */
  plan: { w: string; t: string };
}

const n = (v: number, one: string, many = one + 's') => v + ' ' + (v === 1 ? one : many);
const trig = (w: SunWeek, id: string) => w.trig[id] || { rode: 0, slipped: 0 };
const avgSleep = (w: SunWeek) => (w.sleep.length >= 3 ? Math.round((w.sleep.reduce((a, b) => a + b, 0) / w.sleep.length) * 10) / 10 : null);
const lateHard = (w: SunWeek) => w.lateSlips >= 2 || (w.lateSlips >= 1 && w.lateSlips === w.slipped) || w.lateUrges >= 3;
/** "2 slips and 3 urges came", "Your slip came", "3 urges came" */
const lateWho = (w: SunWeek) => {
  const parts = [w.lateSlips ? n(w.lateSlips, 'slip') : '', w.lateUrges ? n(w.lateUrges, 'urge') : ''].filter(Boolean);
  return parts.join(' and ') + ' came after 9 PM.';
};

/** why each goal, from this week, said as what it changes in the person */
function whyOf(id: SunOption['id'], w: SunWeek): string {
  const sl = avgSleep(w);
  const lonely = trig(w, 'lonely');
  const stress = trig(w, 'stress').rode + trig(w, 'stress').slipped + trig(w, 'bored').rode + trig(w, 'bored').slipped;
  switch (id) {
    case 'lesson':
      return 'Lessons change how you see the habit, not only how you fight it. Last week: ' + n(w.lessons, 'day') + ' with one.';
    case 'phone':
      return lateHard(w)
        ? lateWho(w) + ' A phone in another room is a choice made while you are strong.'
        : 'Late at night, alone with a screen, is when the habit talks loudest. Take that moment away.';
    case 'sleep':
      return sl != null && sl < 7
        ? 'About ' + sl + ' hours a night. A tired brain wants a quick escape; a rested one can choose.'
        : 'A rested brain can choose. A tired one grabs.';
    case 'reach':
      return lonely.rode + lonely.slipped
        ? 'Feeling lonely came up ' + n(lonely.rode + lonely.slipped, 'time') + '. The habit is a fake fix for feeling alone; a real voice is the real one.'
        : 'The habit grows in hiding. A real conversation a few times a week starves it.';
    case 'move':
      return stress
        ? 'Stress or boredom came up ' + n(stress, 'time') + '. Moving burns off what the urge feeds on.'
        : 'Moving your body lifts your mood the honest way, so the habit has less to offer.';
    case 'faith':
      return 'Start the day with what matters most to you, before the phone gets a say.';
    case 'become':
      return 'You are not only quitting something. You are becoming someone. Hear it each morning.';
    case 'wind':
      return 'A calm hour before bed makes the late hours quieter.';
    case 'checkin':
      return 'An honest minute each evening, and next Sunday shows you the true week.';
  }
}

const COUNT: SunGoalKind[] = ['lesson', 'phone', 'sleep', 'reach', 'wind', 'checkin'];
/** a goal by its id: the countable ones counted by the log, the rest in their words */
function goalOf(id: SunOption['id'], st: Settings, w: SunWeek, last?: { g: SunGoal; met: boolean } | null): SunGoal {
  if (!(COUNT as string[]).includes(id)) return { t: GROW[id as SunGrow] };
  const k = id as SunGoalKind;
  if (k === 'lesson') return sunGoalNamed('lesson', st, 7);
  /* never below what the week already did: one more than that, or one more than last week's goal when it was kept */
  const did: Partial<Record<SunGoalKind, number>> = { checkin: w.checkins, phone: w.phone, reach: w.reach, sleep: w.sleep7 };
  const up = Math.max(SUN_GOALS[k].n, (did[k] ?? 0) + 1, last && last.met && last.g.k === k && last.g.n ? last.g.n + 1 : 0);
  return sunGoalNamed(k, st, Math.min(7, up));
}

/** every goal there is for this person, the ones that fit the week first */
function ranked(w: SunWeek, st: Settings): SunOption['id'][] {
  const out: SunOption['id'][] = [];
  const add = (id: SunOption['id']) => {
    if (out.indexOf(id) < 0) out.push(id);
  };
  if (w.lessons < 7) add('lesson');
  /* the week's hardest pattern, answered by what grows the person */
  const sl = avgSleep(w);
  const lonely = trig(w, 'lonely');
  const stress = trig(w, 'stress').slipped + trig(w, 'bored').slipped;
  if (lonely.slipped || lonely.rode >= 2) add('reach');
  if (lateHard(w) || w.screensLate >= 2 || trig(w, 'scroll').slipped) add('phone');
  if ((sl != null && sl < 6.5) || trig(w, 'tired').slipped) add('sleep');
  if (stress) add('move');
  if (faithOn(st)) add('faith');
  if (String(st.becoming || '').trim()) add('become');
  for (const id of ['phone', 'reach', 'move', 'sleep', 'lesson', 'wind', 'checkin'] as SunOption['id'][]) add(id);
  return out;
}

/** the three goals the week points to, and last week's again first when it was not kept */
export function sunOptions(
  w: SunWeek,
  st: Settings,
  last?: { g: SunGoal; done: number | null; met: boolean; how?: SunLast } | null,
  checkinAt?: string,
): SunOption[] {
  const out: SunOption[] = [];
  if (last && last.g.k && !last.met && last.done != null && last.g.n) {
    const k = last.g.k;
    out.push({
      id: k,
      g: sunGoalNamed(k, st, last.g.n),
      why: 'Last week: ' + last.done + ' of ' + last.g.n + ' ' + SUN_GOALS[k].unit + '. Another week makes it part of who you are.',
      plan: sunPlanFor(k, st, checkinAt),
    });
  }
  for (const id of ranked(w, st)) {
    if (out.length >= 3) break;
    if (out.some((o) => o.id === id)) continue;
    out.push({ id, g: goalOf(id, st, w, last), why: whyOf(id, w), plan: sunPlanFor(id, st, checkinAt) });
  }
  return out;
}

/** the other goals, a tap away under the three */
export function sunMore(w: SunWeek, st: Settings, shown: SunOption[], checkinAt?: string): SunOption[] {
  return ranked(w, st)
    .filter((id) => !shown.some((o) => o.id === id))
    .map((id) => ({ id, g: goalOf(id, st, w), why: whyOf(id, w), plan: sunPlanFor(id, st, checkinAt) }));
}

/** a goal in the person's own words: it waits on Today, and next Sunday asks how it went */
export const sunOwnGoal = (t: string): SunGoal => ({ t: t.replace(/\s+/g, ' ').trim().slice(0, 80) });

/* ---------- what the week says ---------- */
export interface SunSay {
  /** an icon from the app's set */
  ic: string;
  t: string;
}
/** what the week says, in three plain lines at most, the good news and the hard truth both, each about the next choice */
export function sunSays(w: SunWeek, hard: string | null): SunSay[] {
  const out: SunSay[] = [];
  const told = w.days - w.untold;
  if (!w.slipped && told >= 3) out.push({ ic: 'flame', t: n(w.noSlip, 'day') + ' free. This is what it looks like to become someone who does not need it.' });
  else if (w.slipped)
    out.push({ ic: 'leaf', t: n(w.noSlip, 'day') + ' free, ' + n(w.slipped, 'slip') + ', told honestly. The slips show you where to aim next week.' });
  if (w.rode)
    out.push({ ic: 'wave', t: n(w.rode, 'urge') + ' ridden out. Each one teaches your brain that the urge passes, and that you are stronger than it.' });
  if (hard) out.push({ ic: 'timer', t: 'Your hard hours were ' + hard + '. That is where one plan does the most.' });
  else if (lateHard(w)) out.push({ ic: 'moon', t: 'Late nights were the hardest. Tired and alone with a screen is when the habit talks loudest.' });
  const lonely = trig(w, 'lonely');
  if (out.length < 3 && lonely.rode + lonely.slipped >= 2)
    out.push({
      ic: 'chat',
      t: 'Loneliness came up ' + n(lonely.rode + lonely.slipped, 'time') + '. The habit fakes the fix for that; people are the real one.',
    });
  if (out.length < 3)
    out.push({
      ic: 'book',
      t:
        w.lessons >= 5
          ? 'Lessons on ' + w.lessons + ' days. You are changing how you think, not only what you do.'
          : 'Lessons on ' + n(w.lessons, 'day') + '. They are where the old beliefs get turned over.',
    });
  if (out.length < 3 && w.untold >= 2) out.push({ ic: 'check', t: n(w.untold, 'night') + ' not told. Next week, a true log shows you more.' });
  return out.slice(0, 3);
}
