/* Bedtime, from the ground up (October 25, 2026; the owner's picks, and the research in docs/plan.md, "Bedtime from the
   ground up"). One stop at night instead of two (the check-in and the wind-down), and one screen instead of five: how today
   went in three one-tap rows (mood, urges, stress, every one skippable), the plan for a loud night in one line, and one
   Goodnight button. Goodnight logs the day, puts the phone away, and when it comes before the screens-off time it is the
   wind-down too (p.wd): there is no list to tick. Sleep is never asked at night: the next morning Daybook works it out from
   phone down to the first open (checkin.h, marked as a guess with hg), and the morning line on Today says it, with a
   one-tap fix. Nothing earned before changes: a day's points still come from what the day holds.
   Checked by test/bedtime.test.ts. */
import { addDays, blankP, fmtClock, HX_NEXT, isTime } from './legacy/core.js';
import { checkinAnswered, offOnTime, saveCheckin, phoneAway, sleepHours, type CheckinForm } from './day';
import { dayFeelOf } from './day-feel';
import { changeDay, withDay } from './mutate';
import type { DayKey, Days, Settings } from './types';

/** Goodnight: the day logged (when anything in the form is answered), the phone away at `at` (with screens off on time
    when it is before the screens-off time), and, on time, the wind-down done. Late, the phone still goes away and counts. */
export function goodnight(days: Days, st: Settings, tk: DayKey, f: CheckinForm | null, at: string, now = Date.now()): Days {
  const saved = f && checkinAnswered(f) ? saveCheckin(days, tk, f, now) : days;
  const away = phoneAway(saved, tk, at, now, st);
  if (!offOnTime(st, at)) return away;
  return withDay(
    away,
    tk,
    changeDay(
      away[tk],
      tk,
      (d) => {
        const p = d.p || blankP();
        p.wd = true;
        d.p = p;
      },
      now,
    ),
  );
}

/** the points Goodnight on time can bring (the check-in and the wind-down), for the Bedtime tile */
export const BED_PTS = HX_NEXT.evening.pts + HX_NEXT.night.pts;

/** today's feeling (How are you feeling today?, 1 to 5) as a starting mood on the 0 to 10 row: Rough 2, Low 4, Okay 5, Good 7,
    Great 9. null when it was not answered. The person moves it if it is wrong; it is saved only with the rest. */
export function moodStart(days: Days, tk: DayKey): number | null {
  const f = dayFeelOf(days[tk]);
  return f ? [2, 4, 5, 7, 9][f.n - 1] : null;
}

/* ---------- sleep, worked out ---------- */
const dateOf = (k: DayKey) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};
/** when the phone went down on log day k (ms): a time before the day rolls over is the next calendar day */
export function awayMs(k: DayKey, po: string, roll = 4): number | null {
  if (!isTime(po)) return null;
  const h = +po.slice(0, 2);
  const d = dateOf(h < roll ? addDays(k, 1) : k);
  d.setHours(h, +po.slice(3, 5), 0, 0);
  return d.getTime();
}
/** the fewest and most hours a guess may be: outside them, the first open was not the morning after */
export const SLEEP_GUESS = { lo: 3, hi: 14 };
/** last night's sleep, worked out: from last night's phone down (Goodnight) to now, the first open of today, in half hours.
    null when last night has no Goodnight, or the hours make no sense for a night. */
export function sleepGuess(days: Days, st: Pick<Settings, 'rollover'>, tk: DayKey, now: number): number | null {
  const po = days[addDays(tk, -1)]?.p?.po;
  const at = po ? awayMs(addDays(tk, -1), po, st.rollover ?? 4) : null;
  if (at == null) return null;
  const h = (now - at) / 36e5;
  if (h < SLEEP_GUESS.lo || h > SLEEP_GUESS.hi) return null;
  return sleepHours(h);
}
/** on the first open of today: last night's sleep, worked out, kept as today's hours (checkin.h, "sleep the night before")
    with hg, when today has no hours yet */
export function guessSleep(days: Days, st: Pick<Settings, 'rollover'>, tk: DayKey, now = Date.now()): Days {
  if (days[tk]?.checkin?.h != null) return days;
  const h = sleepGuess(days, st, tk, now);
  if (h == null) return days;
  return withDay(
    days,
    tk,
    changeDay(
      days[tk],
      tk,
      (d) => {
        const c = d.checkin || { m: null, c: null, e: null, s: null, h: null, so: null, ro: null, n: '', done: false, at: 0 };
        c.h = h;
        c.hg = true;
        d.checkin = c;
      },
      now,
    ),
  );
}
/** the person's own hours for last night (the morning line's fix): no longer a guess */
export function setSleep(days: Days, tk: DayKey, h: number, now = Date.now()): Days {
  return withDay(
    days,
    tk,
    changeDay(
      days[tk],
      tk,
      (d) => {
        const c = d.checkin || { m: null, c: null, e: null, s: null, h: null, so: null, ro: null, n: '', done: false, at: 0 };
        c.h = sleepHours(h);
        delete c.hg;
        d.checkin = c;
      },
      now,
    ),
  );
}

/* ---------- the morning line ---------- */
export interface LastNight {
  /** last night's log day */
  k: DayKey;
  /** phone down, HH:MM */
  at: string;
  /** "Phone down at 11:04 PM." */
  line: string;
  /** today's hours (last night's sleep), and whether Daybook worked them out */
  h: number | null;
  guessed: boolean;
  /** "About 7.5 hours of sleep." (empty without hours) */
  sleep: string;
  /** nights with the phone away in the last seven, last night included */
  nights: number;
  /** "Phone down 5 of the last 7 nights." (empty under two: one night is said by the line itself) */
  run: string;
}
/** hours as the morning line says them */
export const hoursText = (h: number) => (h % 1 ? h.toFixed(1) : String(h));
/** the line on Today the morning after a Goodnight: when the phone went down, the sleep worked out, and the nights it went
    down this week. In the morning only (until noon), and null when last night had no Goodnight. */
export function lastNight(days: Days, st: Pick<Settings, 'rollover'>, tk: DayKey, now: number): LastNight | null {
  const hr = new Date(now).getHours();
  if (hr >= 12 || hr < (st.rollover ?? 4)) return null;
  const k = addDays(tk, -1);
  const at = days[k]?.p?.po;
  if (!at) return null;
  const c = days[tk]?.checkin;
  const h = c && typeof c.h === 'number' ? c.h : null;
  const guessed = h != null && !!c?.hg;
  let nights = 0;
  for (let i = 1; i <= 7; i++) if (days[addDays(tk, -i)]?.p?.po) nights++;
  return {
    k,
    at,
    line: 'Phone down at ' + fmtClock(at) + '.',
    h,
    guessed,
    sleep: h == null ? '' : (guessed ? 'About ' : '') + hoursText(h) + (h === 1 ? ' hour' : ' hours') + ' of sleep.',
    nights,
    run: nights >= 2 ? 'Phone down ' + nights + ' of the last 7 nights.' : '',
  };
}
