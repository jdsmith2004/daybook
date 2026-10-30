/* Notifications that fit the person (docs/plan.md, "Notifications that fit the person"). Everything here runs on the phone:
   the phone plans its own notifications from the log and the reminder choices, and keeps its own count of which ones help.
   Nothing is sent from a server, and the count is never synced.

   The rules:
   - Every notification is about something the person turned on, and is skipped when that thing is already done today.
   - At most three a day, an hour apart; the heads-up before the hard hours wins over a routine reminder. Daybook never
     picks a time at night on its own (only the times the person set, and the heads-up before night-time hard hours).
   - After a slip, never more notifications, only kinder words: the morning after.
   - The habit takes over: when the person checks in on their own most days, the check-in reminder comes later, as a backup.
   - A kind that is ignored three times in a row steps down (every day, every other day, paused); one that helps steps back up.
     A pause is said on Today, with a choice.
   - The plan covers today and tomorrow, then three come-back notes (2, 7 and 30 days on) for anyone whose phone
     allows notifications, and is made again each time the app opens. So when the app goes quiet, the reminders stop on
     their own, the notes say Daybook is still here (each with something in it, never only "we miss you"), and then
     nothing comes until the person opens it. They come at the hour the app is usually open (the second pass).
   - After a heavy few days (low mood or high stress in the check-ins), the routine notes offer and do not ask.
   - Words that learn: each routine kind has five to eleven wordings, each with a title, and the phone keeps how often each
     one helped. The pick is a small version of Duolingo's bandit: the one that helps most wins among those not sent in the
     last week (so no two days in a row read the same), a wording never sent gets its turn, and some fit only a moment (the
     days in the run, a level, the next form close, morning or evening). The notes carry no picture: on iPhone a picture
     shows beside the app icon, and the two looked like the same icon twice (the owner, October 25, 2026).
   The words can show on a locked screen, so none of them says what Daybook is for. Checked by test/nudges.test.ts.
   The morning reminder ("Last night's questions") went with the morning questions on October 23, 2026: saved choices
   that still hold it are read and ignored, and a morning note already planned is dropped (normNudgeLog).
   The lesson reminder took its place (docs/plan.md, "Lessons first", C2), after Duolingo's: the one routine reminder on
   by default, once a day at about the time the last lesson was finished, a day later (else the hour the app is usually
   open, never at night), skipped once today's lesson is done or when no new lesson is open, and sharing one note with the
   check-in reminder when that comes within the same hour. Not copied: the guilt. The words stay warm.
   The plan at its hour (October 29, 2026): a plan made after a slip ("When it is late and I am in bed with my phone, I
   will ...") comes back once, quietly, at the start of the moment it is for, the next time it comes round (talkPlanAhead).
   It is a heads-up, under the same switch as the one before hard hours, and takes that heads-up's place on its day, so a
   day still has at most two notes, or three with one heads-up. The words say only the move (the person's own words are
   not put on a locked screen), never what the plan is about. */
import { moodOf } from './day';
import { lessonOpen } from './accounts';
import { addDays, diffDays, fmtClock, gameCompute, LESSON_WIN_FROM, routineOn, streaks } from './legacy/core.js';
import { formWord } from './levels';
import { lessonDoneOn, lessonWalk } from './lessons';
import { rkActive } from './rekindle';
import { riskAt, riskWindow } from './risk';
import { isSunday, sunDue } from './sunday';
import { TALK_MOVES, type TalkMove } from './talk';
import { talkPlanAhead } from './talk-log';
import type { Clock, DayKey, Days, Reviews, Settings } from './types';

/** the reminder choices, kept on each phone (each phone decides) */
export interface NudgePrefs {
  /** today's lesson, once a day at about the time of the last one (lessonAt); on unless turned off */
  lesson: boolean;
  /** the retired morning reminder: still read from saved choices, never used */
  morning?: boolean;
  morningAt?: Clock;
  checkin: boolean;
  checkinAt: Clock;
  /** the wind-down reminder follows the screens-off time: an hour before it */
  wind: boolean;
  /** a heads-up 90 minutes before the hard hours the log points to (risk.ts) */
  risk: boolean;
  /** Sunday afternoons: time for the Sunday review (sunday.ts) */
  review: boolean;
  /** the come-back notes when the app goes quiet; on unless turned off */
  back?: boolean;
  /** keep the check-in reminder at its set time, even once the person checks in on their own */
  ciKeep?: boolean;
}
export const NUDGE_DEFAULTS: NudgePrefs = {
  lesson: true,
  checkin: false,
  checkinAt: '18:00',
  wind: false,
  risk: true,
  review: false,
  back: true,
  ciKeep: false,
};
/** when the Sunday review reminder comes */
export const NUDGE_SUNDAY_AT: Clock = '17:00';
/** most notifications in one day (one more when the heads-up before hard hours is among them), and the least time between
    two. Most apps people keep send one a day; several a day wear off and get switched off (docs/plan.md, "Notes with a
    voice"). */
export const NUDGE_MAX = 2;
export const NUDGE_GAP = 60;
/** the lesson and the check-in this close together are one note */
export const NUDGE_FOLD = 120;
/** the come-back notes, in days after the last time the app was open */
export const NUDGE_BACK = [2, 7, 30];
/** how long the open times are kept, to learn the hour the app is usually open */
export const NUDGE_OPENS_DAYS = 28;
/** misses in a row before a kind steps down */
export const NUDGE_MISSES = 3;
/** a notification helped when the app was opened this soon after it (or it was tapped, or its thing was done that day) */
export const NUDGE_OPEN_MIN = 120;
/** a notification that has not helped by then is a miss */
export const NUDGE_JUDGE_MIN = 180;

export type NudgeKind = 'lesson' | 'checkin' | 'wind' | 'sunday' | 'risk' | 'back' | 'plan';
/** the kinds that learn (the come-back notes and the plan at its hour are fixed) */
export type NudgeLearned = Exclude<NudgeKind, 'back' | 'plan'>;
export const NUDGE_LEARNED: NudgeLearned[] = ['lesson', 'checkin', 'wind', 'sunday', 'risk'];
/** each kind's switch in NudgePrefs */
export const NUDGE_PREF: Record<NudgeLearned, 'lesson' | 'checkin' | 'wind' | 'review' | 'risk'> = {
  lesson: 'lesson',
  checkin: 'checkin',
  wind: 'wind',
  sunday: 'review',
  risk: 'risk',
};

export interface Nudge {
  /** kind and day: one of each kind a day */
  id: string;
  k: NudgeKind;
  /** the log day it is for */
  d: DayKey;
  at: number;
  title: string;
  body: string;
  /** the screen a tap opens */
  url: string;
  /** arrives without a sound (on iPhone, a passive notification) */
  quiet?: true;
  /** the Sunday review, folded into the check-in reminder; or the check-in, folded into the lesson reminder */
  also?: 'sunday' | 'checkin';
  /** the wording it carries (NUDGE_WORDS.pick), when it was picked; the mood and kinder words are not learned */
  w?: string;
}

/** what the phone remembers about its notifications (never synced) */
export interface NudgeLog {
  /** what is scheduled now */
  plan: Pick<Nudge, 'id' | 'k' | 'd' | 'at' | 'also' | 'w'>[];
  /** delivered, and not judged yet */
  wait: Pick<Nudge, 'id' | 'k' | 'd' | 'at' | 'also' | 'w'>[];
  /** each kind's step: 0 every day, 1 every other day, 2 paused */
  lv: Partial<Record<NudgeLearned, number>>;
  /** misses in a row */
  miss: Partial<Record<NudgeLearned, number>>;
  /** the notifications tapped, by id */
  taps: string[];
  /** the times the app was opened, in the last 28 days */
  opens: number[];
  /** the day the backup check-in was said on Today */
  bk?: DayKey | null;
  /** the day the offer to move the check-in reminder was answered */
  tm?: DayKey | null;
  /** each wording: times judged (n), times it helped (h), the last day it was sent */
  w: Record<string, NudgeWordRec>;
}
export interface NudgeWordRec {
  n: number;
  h: number;
  last: DayKey | null;
}
const KINDS: NudgeKind[] = ['lesson', 'checkin', 'wind', 'sunday', 'risk', 'back', 'plan'];
export const nudgeLogNew = (): NudgeLog => ({ plan: [], wait: [], lv: {}, miss: {}, taps: [], opens: [], w: {} });
/** a stored log, made safe to read */
export function normNudgeLog(x: unknown): NudgeLog {
  const o = (x && typeof x === 'object' ? x : {}) as Partial<NudgeLog>;
  const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  const rec = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, number>) : {});
  /* only the kinds there are now: a note planned for the retired morning reminder is let go */
  const known = (n: unknown) => !!n && typeof n === 'object' && KINDS.includes((n as { k: NudgeKind }).k);
  return {
    plan: arr<NudgeLog['plan'][number]>(o.plan).filter(known),
    wait: arr<NudgeLog['wait'][number]>(o.wait).filter(known),
    lv: rec(o.lv),
    miss: rec(o.miss),
    taps: arr<string>(o.taps).filter((t) => typeof t === 'string'),
    opens: arr<number>(o.opens).filter((t) => typeof t === 'number'),
    bk: typeof o.bk === 'string' ? o.bk : null,
    tm: typeof o.tm === 'string' ? o.tm : null,
    w: normWords(o.w),
  };
}
function normWords(v: unknown): Record<string, NudgeWordRec> {
  const out: Record<string, NudgeWordRec> = {};
  if (!v || typeof v !== 'object') return out;
  for (const [id, r] of Object.entries(v as Record<string, Partial<NudgeWordRec>>)) {
    if (!r || typeof r !== 'object' || typeof r.n !== 'number' || typeof r.h !== 'number') continue;
    out[id] = { n: Math.max(0, r.n), h: Math.max(0, Math.min(r.n, r.h)), last: typeof r.last === 'string' ? r.last : null };
  }
  return out;
}

/** a wording: a title and a body. {off} is the screens-off time, {run} the days in the current run, {lvl} the level,
    {pts} and {form} the points to the next form and its name. when: the wording only fits then (Duolingo's templates
    "sleep" the same way): run, three days or more in the run; level, level 3 or more; form, the next form 60 points or
    fewer away; am, a note before noon; pm, a note from 6 PM. */
export interface NudgeWord {
  t: string;
  b: string;
  when?: 'run' | 'level' | 'form' | 'am' | 'pm';
}
/** the words, in one place. The flame speaks, warm and a little playful, after Duolingo's (the owner, October 25, 2026),
    and never with guilt. Plain on purpose: a notification can show on a locked screen, so none of them says what Daybook
    is for. Titles stay short (about 30 characters) and bodies under about 90, so a locked screen shows them whole. */
export const NUDGE_WORDS = {
  checkin: { t: 'Quick check-in ✅', b: 'Under a minute. How did today go?' },
  sunday: { t: 'Your week in review 📅', b: 'A few minutes to look back on your week.' },
  both: { t: 'Check-in and your week 📅', b: 'Check in, and a few minutes to look back on your week.' },
  /** the lesson reminder with the check-in folded in (both due within the hour) */
  lessonCi: { t: 'Lesson and check-in ✨', b: 'Your lesson and your check-in are ready. A few minutes for both.' },
  wind: (off: string) => ({ t: 'Wind-down time 🌙', b: 'Screens off at ' + off + '. Tap for your calm hour.' }),
  risk: { t: 'Heads-up 🧭', b: 'Your hard hours start soon. Two quiet minutes now make them easier.' },
  /** the first reminder the morning after a slip */
  after: { t: 'A new day ☀️', b: 'A new day. Everything you built is still here.' },
  /** the wordings for each routine kind; the first of each is the one above */
  pick: {
    lesson: [
      { t: 'Your lesson is ready 📖', b: 'Today’s lesson takes a few minutes. Tap to start.' },
      { t: 'Psst, it is your flame 🔥', b: 'Today’s lesson is ready. A few minutes, and I grow a little.' },
      { t: 'Got a few minutes? ⏳', b: 'Your next lesson is short. Tap to read it.' },
      { t: 'One small lesson 📖', b: 'One bite-size lesson, a few minutes. Tap to start.' },
      { t: 'Knock knock 🚪', b: 'It is today’s lesson. A few minutes, then the day is yours.' },
      { t: 'New lesson today ✨', b: 'Something new to learn, in a few minutes. Tap to start.' },
      { t: 'Day {run} ☀️', b: '{run} days of showing up. Today’s lesson takes a few minutes.', when: 'run' },
      { t: '{pts} points until {form} 🌱', b: 'Today’s lesson gets you there faster. A few minutes.', when: 'form' },
      { t: 'Level {lvl}, and growing 🔥', b: 'Keep going with today’s lesson. A few minutes.', when: 'level' },
      { t: 'Good morning ☀️', b: 'Start the day with today’s lesson. A few minutes.', when: 'am' },
      { t: 'Evening lesson 🌙', b: 'Today’s lesson is ready before the day winds down. A few minutes.', when: 'pm' },
    ],
    checkin: [
      { t: 'Quick check-in ✅', b: 'Under a minute. How did today go?' },
      { t: 'How was today? 🤔', b: 'Check in with a few taps. Under a minute.' },
      { t: 'Tap, tap, done 👆', b: 'Your check-in takes under a minute, and your flame gets the points.' },
      { t: 'Your flame is waiting 🔥', b: 'Time to check in. A few taps, under a minute.' },
      { t: 'Your day in a few taps ✍️', b: 'Check in: what went well, what was hard. Under a minute.' },
      { t: 'Good day or hard day 🙂', b: 'Both are worth a check-in. Under a minute.' },
      { t: 'Day {run} check-in 📘', b: 'Save how today went. Under a minute.', when: 'run' },
      { t: 'Your evening check-in 🌙', b: 'A few taps, under a minute. Then you are done for the day.', when: 'pm' },
    ],
    wind: [
      { t: 'Wind-down time 🌙', b: 'Screens off at {off}. Tap for your calm hour.' },
      { t: 'One hour to {off} 🛏️', b: 'Time to slow down. Tap to start your wind-down.' },
      { t: 'Cozy mode 🕯️', b: 'Dim the lights and start your wind-down. Screens off at {off}.' },
      { t: 'I am getting sleepy 😴', b: 'Screens off at {off}. Your wind-down is ready.' },
      { t: 'Phone, meet charger 🔌', b: 'Screens off at {off}. Leave it across the room tonight.' },
      { t: 'Good night, almost 🌛', b: 'An hour until {off}. Tap to start your wind-down.' },
    ],
    sunday: [
      { t: 'Your week in review 📅', b: 'A few minutes to look back on your week.' },
      { t: 'Sunday look back ☕', b: 'What went well this week? A few minutes, then one goal for next week.' },
      { t: 'That is a wrap 🎬', b: 'Look back on your week in a few minutes, then pick one goal.' },
      { t: 'High five for the week ✋', b: 'See what you did this week, in a few minutes.' },
      { t: 'Sunday, slow and easy 🌤️', b: 'Your weekly look back is ready. A few minutes.' },
    ],
    risk: [
      { t: 'Heads-up 🧭', b: 'Your hard hours start soon. Two quiet minutes now make them easier.' },
      { t: 'Plan ahead 🗺️', b: 'A harder part of the day is coming. Make a plan in two minutes.' },
      { t: 'Quick prep 🛡️', b: 'The next few hours are often hard. Your plan is one tap away.' },
      { t: 'I have your back 🔥', b: 'Tough hours ahead. Two minutes now, and you walk in ready.' },
      { t: 'Breathe, plan, go 🧘', b: 'Two minutes now make the next few hours easier. Tap to start.' },
    ],
  } as Record<NudgeLearned, NudgeWord[]>,
  /** a plan made after a slip, at the start of its moment: the title by the moment, and the move (planMove), or this when
      the plan is in the person's own words */
  plan: {
    late: 'Your plan for tonight 🌙',
    evening: 'Your plan for this evening 🌆',
    day: 'Your plan for today ☀️',
    own: 'The plan you made is ready. Tap to see it.',
  },
  /** after a few heavy days: the check-in offers, it does not ask */
  heavy: { t: 'No pressure tonight 🤍', b: 'A short check-in is enough tonight. Nothing to get right.' },
  /** the come-back notes (days 2, 7 and 30), each with something in it; the last says it is the last */
  back: [
    { t: 'Still here, still warm 👋', b: 'Daybook is here when you are ready. Your next lesson takes a few minutes.' },
    { t: 'Everything is kept 📦', b: 'Nothing is lost. A minute today is enough, and Daybook starts where you are.' },
    { t: 'Quiet from here 🌙', b: 'Daybook stays quiet until you open it. Everything you built is kept.' },
  ],
  /** the same, when the person left on a hard day (a slip, or a heavy week): no lesson, the hard day in mind */
  tender: [
    { t: 'Still here 🤍', b: 'A hard day does not undo the rest. Your plan is one tap away.' },
    { t: 'Nothing is lost 🤍', b: 'Everything you built is kept. One quiet minute is a fine way back.' },
    { t: 'Quiet from here 🌙', b: 'Daybook stays quiet until you open it. Everything you built is kept.' },
  ],
  /** the cards on Today */
  name: {
    lesson: 'The lesson reminder',
    checkin: 'The check-in reminder',
    wind: 'The wind-down reminder',
    sunday: 'The Sunday reminder',
    risk: 'The heads-up before hard hours',
  } as Record<NudgeLearned, string>,
};

/* ---------- clocks ---------- */
const minOf = (t: Clock) => {
  const [h, m] = String(t).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
const clockOf = (min: number): Clock => {
  const x = ((Math.round(min) % 1440) + 1440) % 1440;
  return String(Math.floor(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0');
};
/** minutes after the day's rollover, so a log day reads in order (rollover 4: 4 AM is 0, 1 AM is 21 hours) */
const relOf = (min: number, roll: number) => (((min - roll * 60) % 1440) + 1440) % 1440;
/** the time a clock reading on log day k really is */
const atOf = (k: DayKey, t: Clock, roll: number) => {
  const m = minOf(t);
  return riskAt(k, Math.floor(m / 60), roll, m % 60);
};
const clockAt = (ms: number) => {
  const d = new Date(ms);
  return d.getHours() * 60 + d.getMinutes();
};

/* ---------- the check-in: on its own, and when ---------- */
/** check-ins done before the reminder on 5 of the last 7 days: the reminder becomes a backup */
export function ciOnOwn(days: Days, st: Settings, prefs: NudgePrefs, tk: DayKey): boolean {
  if (!prefs.checkin || prefs.ciKeep) return false;
  let n = 0;
  for (let i = 1; i <= 7; i++) {
    const k = addDays(tk, -i);
    const c = days[k]?.checkin;
    if (c && c.done && c.at && c.at < atOf(k, prefs.checkinAt, st.rollover)) n++;
  }
  return n >= 5;
}
/** the backup time: 90 minutes after the set time, but before screens-off (and never before the set time) */
export function ciBackupAt(st: Settings, prefs: NudgePrefs): Clock {
  const roll = st.rollover;
  const ci = relOf(minOf(prefs.checkinAt), roll);
  const off = relOf(minOf(st.screensOff), roll);
  const b = Math.max(ci, Math.min(ci + 90, off - 30));
  return clockOf(b + roll * 60);
}
/** the usual check-in time over the last two weeks (at least five check-ins), rounded to 15 minutes */
export function ciUsual(days: Days, st: Settings, tk: DayKey): Clock | null {
  const roll = st.rollover;
  const xs: number[] = [];
  for (let i = 1; i <= 14; i++) {
    const c = days[addDays(tk, -i)]?.checkin;
    if (c && c.done && c.at) xs.push(relOf(clockAt(c.at), roll));
  }
  if (xs.length < 5) return null;
  xs.sort((a, b) => a - b);
  const mid = xs[Math.floor(xs.length / 2)];
  return clockOf(Math.round(mid / 15) * 15 + roll * 60);
}

/* ---------- the rhythm and the mood ---------- */
/** the hours a come-back note may come (9 AM up to 9 PM) */
const DAY_HOURS: [number, number] = [9, 21];
/** the hour the app is usually open: the hour with most opens in the last 28 days, recent days weighing more (half as much
    two weeks back), kept to the daytime; else the hour the app is open now, if that is daytime; else 6 PM */
export function usualHour(log: Pick<NudgeLog, 'opens'>, now: number): number {
  const w = new Array(24).fill(0);
  for (const t of log.opens) {
    const age = (now - t) / 86400000;
    if (age < 0 || age > NUDGE_OPENS_DAYS) continue;
    w[new Date(t).getHours()] += Math.pow(0.5, age / 14);
  }
  let best = -1;
  for (let h = DAY_HOURS[0]; h < DAY_HOURS[1]; h++) if (w[h] > 0 && (best < 0 || w[h] > w[best])) best = h;
  if (best >= 0) return best;
  const h = new Date(now).getHours();
  return h >= DAY_HOURS[0] && h < DAY_HOURS[1] ? h : 18;
}
/* ---------- the lesson: whether one waits, and when ---------- */
/** the earliest and latest a lesson reminder comes on its own: 7 AM up to 10 PM */
export const LESSON_HOURS: [number, number] = [7, 22];
/** the clock time the last lesson before day k was finished (from p.lt, in the last 28 days), when that was in the daytime
    (LESSON_HOURS); else null */
export function lessonLast(days: Days, k: DayKey): Clock | null {
  for (let i = 1; i <= NUDGE_OPENS_DAYS; i++) {
    const t = days[addDays(k, -i)]?.p?.lt;
    if (typeof t !== 'number') continue;
    const m = clockAt(t);
    return m >= LESSON_HOURS[0] * 60 && m < LESSON_HOURS[1] * 60 ? clockOf(m) : null;
  }
  return null;
}
/** when the lesson reminder for day k comes: at the time the last lesson was finished, a day later (from: 'last'); else at
    the hour the app is usually open (from: 'usual', usualHour, always in the daytime) */
export function lessonAt(days: Days, log: Pick<NudgeLog, 'opens'>, k: DayKey, now: number): { at: Clock; from: 'last' | 'usual' } {
  const last = lessonLast(days, k);
  return last ? { at: last, from: 'last' } : { at: clockOf(usualHour(log, now) * 60), from: 'usual' };
}
/** the lesson the reminder for day k opens: the next new one, while today's is not done and it is open (without an account,
    the lessons after the first LEARN_FREE wait behind one); else null, and no reminder (a re-read is never pushed) */
export function lessonDue(days: Days, st: Settings, k: DayKey, account = true): string | null {
  if (k < LESSON_WIN_FROM || !routineOn(st, days[k]?.p, 'lesson') || lessonDoneOn(days[k]?.p)) return null;
  const w = lessonWalk(days, st);
  const nl = w.next;
  return nl && lessonOpen(nl, w.done, account) ? nl.id : null;
}

/** how the last three check-ins (in the last week) felt: heavy when mood (motivation, on a day saved before mood was asked)
    is 3 or lower or stress 7 or higher, on average */
export function weekFeel(days: Days, tk: DayKey): 'heavy' | 'steady' {
  const cs = [];
  for (let i = 0; i < 7 && cs.length < 3; i++) {
    const c = days[addDays(tk, -i)]?.checkin;
    if (c && c.done) cs.push(c);
  }
  const mean = (xs: (number | null)[]) => {
    const v = xs.filter((x): x is number => typeof x === 'number');
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  };
  const m = mean(cs.map((c) => moodOf(c)));
  const s = mean(cs.map((c) => c.s));
  return (m != null && m <= 3) || (s != null && s >= 7) ? 'heavy' : 'steady';
}
/* ---------- words that learn ---------- */
/** a steady number in [0, 1) from a string: the jitter that lets a new wording be tried, the same every run for a day */
function hash01(x: string): number {
  let h = 2166136261;
  for (let i = 0; i < x.length; i++) h = Math.imul(h ^ x.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}
/** what some wordings say and when they fit (NudgeWord.when): the days in the run, the level, and the next form */
export interface NudgeCtx {
  run: number;
  lvl: number;
  /** points to the next form, and its name ("a Campfire"), or null when it is not close or there is none */
  form: { pts: number; name: string } | null;
}
const CTX0: NudgeCtx = { run: 0, lvl: 1, form: null };
/** a wording fits: its moment, at this hour of the note */
const fits = (w: NudgeWord, ctx: NudgeCtx, hour: number) =>
  !w.when ||
  (w.when === 'run' && ctx.run >= 3) ||
  (w.when === 'level' && ctx.lvl >= 3) ||
  (w.when === 'form' && !!ctx.form) ||
  (w.when === 'am' && hour < 12) ||
  (w.when === 'pm' && hour >= 18);
/** days before a wording comes again (fewer when a kind has fewer that fit) */
export const NUDGE_FRESH_DAYS = 7;
/** the last day each wording was sent or is planned (log.w, and the plan and the notes waiting to be judged), before day k */
function lastSent(log: Pick<NudgeLog, 'w'> & Partial<Pick<NudgeLog, 'plan' | 'wait'>>, k: DayKey, also: { w?: string; d: DayKey }[]): Record<string, DayKey> {
  const out: Record<string, DayKey> = {};
  for (const [id, r] of Object.entries(log.w)) if (r.last && r.last < k) out[id] = r.last;
  for (const n of [...(log.plan || []), ...(log.wait || []), ...also]) if (n.w && n.d < k && (!out[n.w] || n.d > out[n.w])) out[n.w] = n.d;
  return out;
}
/** the wording for a kind on day tk. Among those that fit (ctx, the note's hour) and were not sent in the last week (when
    every one was, the one sent longest ago), the highest score wins: (helped + 1) / (judged + 2), plus up to 0.02 from the
    day and the id, so a new one gets tried. also: what this plan already picked for earlier days. Returns the wording's
    id (kind.index). */
export function pickWords(
  kind: NudgeLearned,
  log: Pick<NudgeLog, 'w'> & Partial<Pick<NudgeLog, 'plan' | 'wait'>>,
  tk: DayKey,
  ctx: NudgeCtx = CTX0,
  hour = 12,
  also: { w?: string; d: DayKey }[] = [],
): string {
  const last = lastSent(log, tk, also);
  const ids = NUDGE_WORDS.pick[kind].map((w, i) => ({ w, id: kind + '.' + i })).filter((x) => fits(x.w, ctx, hour));
  const gap = (id: string) => (last[id] ? diffDays(tk, last[id]) : Infinity);
  const win = Math.min(NUDGE_FRESH_DAYS, ids.length - 1);
  let pool = ids.filter((x) => gap(x.id) > win);
  if (!pool.length) {
    const far = Math.max(...ids.map((x) => gap(x.id)));
    pool = ids.filter((x) => gap(x.id) === far);
  }
  let best = '',
    top = -Infinity;
  for (const { id } of pool) {
    const r = log.w[id];
    const sc = ((r?.h || 0) + 1) / ((r?.n || 0) + 2) + 0.02 * hash01(tk + '|' + id);
    if (sc > top) {
      top = sc;
      best = id;
    }
  }
  return best;
}
const fill = (x: string, st: Pick<Settings, 'screensOff'>, ctx: NudgeCtx) =>
  x
    .replace(/\{off\}/g, fmtClock(st.screensOff))
    .replace(/\{run\}/g, String(ctx.run))
    .replace(/\{lvl\}/g, String(ctx.lvl))
    .replace(/\{pts\}/g, String(ctx.form?.pts ?? ''))
    .replace(/\{form\}/g, ctx.form?.name ?? '');
/** a wording's title and body */
export function wordsOf(id: string, st: Pick<Settings, 'screensOff'>, ctx: NudgeCtx = CTX0): { t: string; b: string } {
  const [k, i] = id.split('.');
  const w = (NUDGE_WORDS.pick[k as NudgeLearned] || [])[Number(i)];
  return w ? { t: fill(w.t, st, ctx), b: fill(w.b, st, ctx) } : { t: 'Daybook', b: '' };
}
/** the context for the plan: the run today and the level (tomorrow's run is one more) */
export function nudgeCtx(days: Days, st: Settings, reviews: Reviews, tk: DayKey): NudgeCtx {
  const lv = gameCompute(days, st, reviews, tk).level;
  return {
    run: streaks(days, st, tk).cur,
    lvl: lv.n,
    form: lv.evolves && lv.nextName && lv.toNext <= 60 ? { pts: lv.toNext, name: formWord(lv.nextName) } : null,
  };
}

const slipOn = (days: Days, k: DayKey) => (days[k]?.events || []).some((e) => e.outcome === 'slipped');

/* ---------- the plan ---------- */
const PRI: Record<NudgeKind, number> = { plan: 0, risk: 0, lesson: 1, checkin: 2, sunday: 3, wind: 4, back: 5 };

/** the hours the plan at its hour may come (9 AM up to 9 PM, the start of late at night): a plan for the daytime made at
    night waits on Today instead */
const PLAN_HOURS: [number, number] = [9, 21];
/** the move a plan made after a slip names on a note: "The plan you made: put the device out of reach." Only a move from
    the list (TALK_MOVES), which never says what the plan is about; null for a plan in the person's own words. */
export function planMove(m: string[]): string | null {
  const w = TALK_MOVES[m[0] as TalkMove]?.[1];
  return w ? 'The plan you made: ' + w + '.' : null;
}
/** the note for a plan made after a slip, at the start of its moment, when that falls on log day k (between its rollover
    and the next), in the hours a note may come; else null */
export function planNudge(days: Days, st: Settings, prefs: NudgePrefs, k: DayKey, now: number): Nudge | null {
  if (!prefs.risk) return null;
  const a = talkPlanAhead(days, now);
  if (!a) return null;
  if (a.start < riskAt(k, st.rollover, st.rollover) || a.start >= riskAt(addDays(k, 1), st.rollover, st.rollover)) return null;
  const d = new Date(a.start);
  const h = d.getHours() + d.getMinutes() / 60;
  if (h < PLAN_HOURS[0] || h > PLAN_HOURS[1]) return null;
  const W = NUDGE_WORDS.plan;
  return {
    id: 'plan-' + k,
    k: 'plan',
    d: k,
    at: a.start,
    title: a.mo === 'late' ? W.late : a.mo === 'evening' ? W.evening : W.day,
    body: planMove(a.talk.m) || W.own,
    url: '/',
    quiet: true,
  };
}
/** every other day (or Sunday) at step 1 */
const onStep = (lv: number, k: DayKey, st: Settings, weekly = false) => lv <= 0 || (lv === 1 && Math.floor(diffDays(k, st.start) / (weekly ? 7 : 1)) % 2 === 0);

/** whether this kind's thing is already done on day k */
function doneOn(days: Days, st: Settings, reviews: Reviews, kind: NudgeKind, k: DayKey): boolean {
  const day = days[k];
  if (kind === 'lesson') return lessonDoneOn(day?.p);
  if (kind === 'checkin') return !!day?.checkin?.done;
  if (kind === 'wind') return !!(day?.p && (day.p.wd || day.p.po));
  if (kind === 'sunday') return !sunDue(reviews, st, k);
  return false;
}

/** the routine notifications for one log day, before the caps */
function dayList(
  days: Days,
  st: Settings,
  reviews: Reviews,
  prefs: NudgePrefs,
  log: NudgeLog,
  k: DayKey,
  backup: boolean,
  heavy: boolean,
  now: number,
  account: boolean,
  ctx: NudgeCtx,
  also: { w?: string; d: DayKey }[],
): Nudge[] {
  const roll = st.rollover;
  const lv = (x: NudgeLearned) => log.lv[x] || 0;
  const out: Nudge[] = [];
  /* each kind's words are picked from its own, by what has helped and what was sent lately (pickWords) */
  const add = (kind: NudgeLearned, at: number, url = '/', quiet = false) => {
    if (doneOn(days, st, reviews, kind, k)) return;
    const w = pickWords(kind, log, k, ctx, new Date(at).getHours(), also);
    const x = wordsOf(w, st, ctx);
    out.push({ id: kind + '-' + k, k: kind, d: k, at, title: x.t, body: x.b, url, w, ...(quiet ? { quiet: true as const } : {}) });
  };
  const lid = prefs.lesson && onStep(lv('lesson'), k, st) ? lessonDue(days, st, k, account) : null;
  if (lid) add('lesson', atOf(k, lessonAt(days, log, k, now).at, roll), '/lesson/' + lid);
  if (prefs.checkin && onStep(lv('checkin'), k, st)) add('checkin', atOf(k, backup ? ciBackupAt(st, prefs) : prefs.checkinAt, roll), '/checkin');
  if (prefs.wind && st.screensOff && onStep(lv('wind'), k, st)) add('wind', atOf(k, clockOf(minOf(st.screensOff) - 60), roll), '/wind');
  if (prefs.review && isSunday(k) && onStep(lv('sunday'), k, st, true) && sunDue(reviews, st, k))
    add('sunday', atOf(k, NUDGE_SUNDAY_AT, roll), '/review', true);
  if (prefs.risk && onStep(lv('risk'), k, st)) {
    const win = riskWindow(days, st, k);
    if (win) add('risk', riskAt(k, win.start, roll) - 90 * 60000, '/talk?prep=1');
  }
  /* the plan made after a slip, at its hour: it is that day's heads-up, in place of the one before hard hours */
  const pn = planNudge(days, st, prefs, k, now);
  if (pn) {
    const r = out.findIndex((n) => n.k === 'risk');
    if (r >= 0) out.splice(r, 1);
    out.push(pn);
  }
  /* on a Sunday, the check-in reminder carries the review too */
  const ci = out.find((n) => n.k === 'checkin');
  const su = out.findIndex((n) => n.k === 'sunday');
  if (ci && su >= 0) {
    out.splice(su, 1);
    ci.title = NUDGE_WORDS.both.t;
    ci.body = NUDGE_WORDS.both.b;
    ci.also = 'sunday';
    delete ci.w;
  }
  /* the lesson and the check-in within two hours: one note, at the check-in's time (the one the person set), that
     opens the lesson. Not when the check-in already carries the Sunday review: three in one is too much. */
  const le = out.find((n) => n.k === 'lesson');
  const ci2 = out.findIndex((n) => n.k === 'checkin' && !n.also);
  if (le && ci2 >= 0 && Math.abs(out[ci2].at - le.at) < NUDGE_FOLD * 60000) {
    le.at = out[ci2].at;
    out.splice(ci2, 1);
    le.title = NUDGE_WORDS.lessonCi.t;
    le.body = NUDGE_WORDS.lessonCi.b;
    le.also = 'checkin';
    delete le.w;
  }
  /* after a few heavy days, the routine notes offer and do not ask: the check-in says a short one is enough, the wind-down
     comes without a sound. The heads-up before hard hours stays as it is, because it is care. */
  if (heavy)
    for (const n of out) {
      if (n.k === 'checkin') {
        n.title = NUDGE_WORDS.heavy.t;
        n.body = NUDGE_WORDS.heavy.b;
        delete n.w;
      } else if (n.k === 'wind' || n.k === 'lesson') n.quiet = true;
    }
  /* after a slip: the first routine reminder of the day says it kindly (over the mood words) */
  const kind = kindWords(days, st, k);
  const first = out.filter((n) => n.k !== 'risk' && n.k !== 'plan').sort((a, b) => a.at - b.at)[0];
  if (kind && first) {
    first.title = kind.t;
    first.body = kind.b;
    first.url = '/';
    delete first.w;
    delete first.also;
    delete first.quiet;
  }
  return out;
}

/** the kinder words for day k: the morning after a slip */
function kindWords(days: Days, st: Settings, k: DayKey): { t: string; b: string } | null {
  const r = rkActive(days, st, k);
  if (!r || r.phase !== 'sun') return null;
  return k === addDays(r.k, 1) ? NUDGE_WORDS.after : null;
}

/** at most NUDGE_MAX a day (one more with the heads-up before hard hours, or the plan at its hour in its place), NUDGE_GAP
    minutes apart, the most useful kept */
function capped(list: Nudge[]): Nudge[] {
  const keep: Nudge[] = [];
  const max = NUDGE_MAX + (list.some((n) => n.k === 'risk' || n.k === 'plan') ? 1 : 0);
  for (const n of list.slice().sort((a, b) => PRI[a.k] - PRI[b.k] || a.at - b.at)) {
    if (keep.length >= max) break;
    if (keep.some((x) => Math.abs(x.at - n.at) < NUDGE_GAP * 60000)) continue;
    keep.push(n);
  }
  return keep;
}

/** whether any notification is turned on at all */
export const nudgesOn = (p: NudgePrefs) => p.lesson || p.checkin || p.wind || p.review || p.risk;

/** the notifications to schedule now: today and tomorrow, then the come-back notes. now is the time the app is open.
    allowed: whether the phone lets Daybook notify (the come-back notes are for anyone it does, unless turned off).
    account: whether the person has one (without it, the lessons after the first LEARN_FREE wait, and are not reminded of). */
export function nudgePlan(
  days: Days,
  st: Settings | null,
  reviews: Reviews,
  prefs: NudgePrefs,
  log: NudgeLog,
  tk: DayKey,
  now: number,
  allowed: boolean,
  account = true,
): Nudge[] {
  if (!st) return [];
  const out: Nudge[] = [];
  if (nudgesOn(prefs)) {
    const backup = ciOnOwn(days, st, prefs, tk);
    const heavy = weekFeel(days, tk) === 'heavy';
    const ctx = nudgeCtx(days, st, reviews, tk);
    /* tomorrow's words: one more day in the run, and not today's wording again */
    for (const [i, k] of [tk, addDays(tk, 1)].entries()) {
      const c = i && ctx.run ? { ...ctx, run: ctx.run + 1 } : ctx;
      out.push(...capped(dayList(days, st, reviews, prefs, log, k, backup, heavy, now, account, c, out).filter((n) => n.at > now)));
    }
  }
  if (allowed && prefs.back !== false) {
    /* at the hour the app is usually open; tender words when the person left on a hard day */
    const t = clockOf(usualHour(log, now) * 60);
    const tender = slipOn(days, tk) || slipOn(days, addDays(tk, -1)) || weekFeel(days, tk) === 'heavy';
    NUDGE_BACK.forEach((n, i) => {
      const d = addDays(tk, n);
      const x = (tender ? NUDGE_WORDS.tender : NUDGE_WORDS.back)[i];
      out.push({ id: 'back-' + n, k: 'back', d, at: atOf(d, t, st.rollover), title: x.t, body: x.b, url: '/' });
    });
  }
  return out.sort((a, b) => a.at - b.at);
}

/* ---------- learning from what happened ---------- */
function helped(days: Days, st: Settings, reviews: Reviews, log: NudgeLog, n: NudgeLog['wait'][number]): boolean {
  if (log.taps.includes(n.id)) return true;
  if (log.opens.some((t) => t >= n.at && t <= n.at + NUDGE_OPEN_MIN * 60000)) return true;
  if (n.k === 'risk') {
    const day = days[n.d];
    return !!(day && (day.p?.hw != null || day.events.some((e) => e.outcome === 'rode')));
  }
  return (n.k !== 'back' && doneOn(days, st, reviews, n.k, n.d)) || (!!n.also && doneOn(days, st, reviews, n.also, n.d));
}

/** the log after the app opens (record the open in opens first): what was delivered is judged, and each kind steps up or
    down. allowed: whether the phone lets Daybook notify (when it does not, nothing was delivered, so nothing is judged). */
export function nudgeLearn(log: NudgeLog, days: Days, st: Settings | null, reviews: Reviews, now: number, allowed: boolean): NudgeLog {
  const x: NudgeLog = { ...log, lv: { ...log.lv }, miss: { ...log.miss }, w: { ...log.w } };
  /* a judged wording: shown once more, helped or not, and the last day it was sent */
  const word = (n: NudgeLog['wait'][number], h: boolean) => {
    if (!n.w) return;
    const r = x.w[n.w] || { n: 0, h: 0, last: null };
    x.w[n.w] = { n: r.n + 1, h: r.h + (h ? 1 : 0), last: !r.last || n.d > r.last ? n.d : r.last };
  };
  const due = log.plan.filter((n) => n.at <= now);
  const wait = allowed && st ? [...log.wait, ...due].filter((n) => n.k !== 'back' && n.k !== 'plan') : [];
  x.wait = [];
  for (const n of wait.sort((a, b) => a.at - b.at)) {
    const k = n.k as NudgeLearned;
    if (helped(days, st!, reviews, log, n)) {
      x.lv[k] = Math.max(0, (x.lv[k] || 0) - 1);
      x.miss[k] = 0;
      word(n, true);
    } else if (now >= n.at + NUDGE_JUDGE_MIN * 60000) {
      word(n, false);
      const m = (x.miss[k] || 0) + 1;
      if (m >= NUDGE_MISSES && (x.lv[k] || 0) < 2) {
        x.lv[k] = (x.lv[k] || 0) + 1;
        x.miss[k] = 0;
      } else x.miss[k] = m;
    } else x.wait.push(n);
  }
  x.plan = log.plan.filter((n) => n.at > now);
  x.taps = log.taps.filter((id) => x.plan.some((n) => n.id === id) || x.wait.some((n) => n.id === id));
  x.opens = log.opens.filter((t) => t > now - NUDGE_OPENS_DAYS * 86400000).slice(-200);
  return x;
}
/** the new plan, remembered in the log. What was due by now stays in it until nudgeLearn judges it. */
export function nudgeKeep(log: NudgeLog, plan: Nudge[], now: number): NudgeLog {
  const ids = new Set(plan.map((n) => n.id));
  const due = log.plan.filter((n) => n.at <= now && !ids.has(n.id));
  return {
    ...log,
    plan: [...due, ...plan.filter((n) => n.at > now).map(({ id, k, d, at, also, w }) => ({ id, k, d, at, ...(also ? { also } : {}), ...(w ? { w } : {}) }))],
  };
}
/** the plan's identity, to tell when the phone's schedule needs making again */
export const nudgeKey = (plan: Pick<Nudge, 'id' | 'at' | 'title' | 'body'>[]) => plan.map((n) => n.id + '@' + n.at + ':' + n.title + ':' + n.body).join('|');
/** a paused (or stepped down) kind, back to every day */
export const nudgeResume = (log: NudgeLog, k: NudgeLearned): NudgeLog => ({ ...log, lv: { ...log.lv, [k]: 0 }, miss: { ...log.miss, [k]: 0 } });

/* ---------- the card on Today ---------- */
export type NudgeCard =
  | { k: 'paused'; kind: NudgeLearned; h: string; p: string; yes: string; no: string }
  | { k: 'backup'; at: Clock; h: string; p: string; yes: string; no: string }
  | { k: 'time'; at: Clock; h: string; p: string; yes: string; no: string };

/** one thing about the reminders to say on Today, or nothing. Not in the two days after a slip. */
export function nudgeCard(days: Days, st: Settings, prefs: NudgePrefs, log: NudgeLog, tk: DayKey): NudgeCard | null {
  for (let i = 0; i < 2; i++) if (days[addDays(tk, -i)]?.events.some((e) => e.outcome === 'slipped')) return null;
  const paused = NUDGE_LEARNED.find((k) => prefs[NUDGE_PREF[k]] && (log.lv[k] || 0) >= 2);
  if (paused)
    return {
      k: 'paused',
      kind: paused,
      h: 'A reminder is paused',
      p: NUDGE_WORDS.name[paused] + ' has not been helping lately, so Daybook paused it. Everything else stays the same.',
      yes: 'Turn it back on',
      no: 'Leave it off',
    };
  const set = fmtClock(prefs.checkinAt);
  if (ciOnOwn(days, st, prefs, tk)) {
    if (log.bk) return null;
    const at = ciBackupAt(st, prefs);
    return {
      k: 'backup',
      at,
      h: 'You check in on your own now',
      p: 'So the check-in reminder moves to ' + fmtClock(at) + ', and comes only on days you have not checked in yet.',
      yes: 'Sounds good',
      no: 'Keep it at ' + set,
    };
  }
  const u = prefs.checkin ? ciUsual(days, st, tk) : null;
  if (u && relOf(minOf(u), st.rollover) > relOf(minOf(prefs.checkinAt), st.rollover) + 60 && (!log.tm || diffDays(tk, log.tm) >= 30))
    return {
      k: 'time',
      at: u,
      h: 'Move the check-in reminder?',
      p: 'You usually check in around ' + fmtClock(u) + ', and the reminder comes at ' + set + '.',
      yes: 'Move it to ' + fmtClock(u),
      no: 'Keep ' + set,
    };
  return null;
}
