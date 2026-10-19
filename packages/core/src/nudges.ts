/* Notifications that fit the person (docs/plan.md, "Notifications that fit the person"). Everything here runs on the phone:
   the phone plans its own notifications from the log and the reminder choices, and keeps its own count of which ones help.
   Nothing is sent from a server, and the count is never synced.

   The rules:
   - Every notification is about something the person turned on, and is skipped when that thing is already done today.
   - At most three a day, an hour apart; the heads-up before the hard hours wins over a routine reminder. Daybook never
     picks a time at night on its own (only the times the person set, and the heads-up before night-time hard hours).
   - After a slip, never more notifications, only kinder words: the morning after, and while the Rekindle quest is open.
   - The habit takes over: when the person checks in on their own most days, the check-in reminder comes later, as a backup.
   - A kind that is ignored three times in a row steps down (every day, every other day, paused); one that helps steps back up.
     A pause is said on Today, with a choice.
   - The plan covers today and tomorrow, then four come-back notes (2, 4, 7 and 14 days on), and is made again each time the
     app opens. So when the app goes quiet, the reminders stop on their own, the notes say Daybook is still here, and then
     nothing comes until the person opens it.
   The words can show on a locked screen, so none of them says what Daybook is for. Checked by test/nudges.test.ts. */
import { addDays, diffDays, fmtClock, morningInfo } from './legacy/core.js';
import { rkActive, rkCard, rkOpen } from './rekindle';
import { riskAt, riskWindow } from './risk';
import { isSunday, sunDue } from './sunday';
import type { Clock, DayKey, Days, Reviews, Settings } from './types';

/** the reminder choices, kept on each phone (each phone decides) */
export interface NudgePrefs {
  morning: boolean;
  morningAt: Clock;
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
  morning: false,
  morningAt: '08:00',
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
/** most notifications in one day, and the least time between two */
export const NUDGE_MAX = 3;
export const NUDGE_GAP = 60;
/** the come-back notes, in days after the last time the app was open */
export const NUDGE_BACK = [2, 4, 7, 14];
/** misses in a row before a kind steps down */
export const NUDGE_MISSES = 3;
/** a notification helped when the app was opened this soon after it (or it was tapped, or its thing was done that day) */
export const NUDGE_OPEN_MIN = 120;
/** a notification that has not helped by then is a miss */
export const NUDGE_JUDGE_MIN = 180;

export type NudgeKind = 'checkin' | 'morning' | 'wind' | 'sunday' | 'risk' | 'back';
/** the kinds that learn (the come-back notes are fixed) */
export type NudgeLearned = Exclude<NudgeKind, 'back'>;
export const NUDGE_LEARNED: NudgeLearned[] = ['checkin', 'morning', 'wind', 'sunday', 'risk'];
/** each kind's switch in NudgePrefs */
export const NUDGE_PREF: Record<NudgeLearned, 'checkin' | 'morning' | 'wind' | 'review' | 'risk'> = {
  checkin: 'checkin',
  morning: 'morning',
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
  body: string;
  /** the screen a tap opens */
  url: string;
  /** arrives without a sound (on iPhone, a passive notification) */
  quiet?: true;
  /** the Sunday review, folded into the check-in reminder */
  also?: 'sunday';
}

/** what the phone remembers about its notifications (never synced) */
export interface NudgeLog {
  /** what is scheduled now */
  plan: Pick<Nudge, 'id' | 'k' | 'd' | 'at' | 'also'>[];
  /** delivered, and not judged yet */
  wait: Pick<Nudge, 'id' | 'k' | 'd' | 'at' | 'also'>[];
  /** each kind's step: 0 every day, 1 every other day, 2 paused */
  lv: Partial<Record<NudgeLearned, number>>;
  /** misses in a row */
  miss: Partial<Record<NudgeLearned, number>>;
  /** the notifications tapped, by id */
  taps: string[];
  /** the times the app was opened, in the last few days */
  opens: number[];
  /** the day the backup check-in was said on Today */
  bk?: DayKey | null;
  /** the day the offer to move the check-in reminder was answered */
  tm?: DayKey | null;
}
export const nudgeLogNew = (): NudgeLog => ({ plan: [], wait: [], lv: {}, miss: {}, taps: [], opens: [] });
/** a stored log, made safe to read */
export function normNudgeLog(x: unknown): NudgeLog {
  const o = (x && typeof x === 'object' ? x : {}) as Partial<NudgeLog>;
  const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  const rec = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, number>) : {});
  return {
    plan: arr(o.plan),
    wait: arr(o.wait),
    lv: rec(o.lv),
    miss: rec(o.miss),
    taps: arr<string>(o.taps).filter((t) => typeof t === 'string'),
    opens: arr<number>(o.opens).filter((t) => typeof t === 'number'),
    bk: typeof o.bk === 'string' ? o.bk : null,
    tm: typeof o.tm === 'string' ? o.tm : null,
  };
}

/** the words, in one place. Plain on purpose: a notification can show on a locked screen. */
export const NUDGE_WORDS = {
  morning: 'Last night’s questions. Two taps.',
  checkin: 'Check in. Under a minute.',
  sunday: 'A few minutes to look back on your week.',
  both: 'Check in, and a few minutes to look back on your week.',
  wind: (off: string) => 'Wind down. Screens off at ' + off + '.',
  risk: 'Your hard hours start soon. Two quiet minutes now make them easier.',
  /** the first reminder the morning after a slip */
  after: 'A new day. Everything you built is still here.',
  /** while the Rekindle quest is open */
  quest: 'Your Rekindle quest is still open. One small step today.',
  back: [
    'Daybook is here when you are ready.',
    'Nothing is lost. One tap to pick up where you left off.',
    'A minute today is enough.',
    'Daybook will stay quiet now. Everything is kept for when you come back.',
  ],
  /** the cards on Today */
  name: {
    checkin: 'The check-in reminder',
    morning: 'The morning reminder',
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

/* ---------- the plan ---------- */
const PRI: Record<NudgeKind, number> = { risk: 0, checkin: 1, sunday: 2, wind: 3, morning: 4, back: 5 };
/** every other day (or Sunday) at step 1 */
const onStep = (lv: number, k: DayKey, st: Settings, weekly = false) => lv <= 0 || (lv === 1 && Math.floor(diffDays(k, st.start) / (weekly ? 7 : 1)) % 2 === 0);

/** whether this kind's thing is already done on day k */
function doneOn(days: Days, st: Settings, reviews: Reviews, kind: NudgeKind, k: DayKey): boolean {
  const day = days[k];
  if (kind === 'checkin') return !!day?.checkin?.done;
  if (kind === 'morning') return morningInfo(days, st, k).done;
  if (kind === 'wind') return !!(day?.p && (day.p.wd || day.p.po));
  if (kind === 'sunday') return !sunDue(reviews, st, k);
  return false;
}

/** the routine notifications for one log day, before the caps */
function dayList(days: Days, st: Settings, reviews: Reviews, prefs: NudgePrefs, log: NudgeLog, k: DayKey, backup: boolean): Nudge[] {
  const roll = st.rollover;
  const lv = (x: NudgeLearned) => log.lv[x] || 0;
  const out: Nudge[] = [];
  const add = (kind: NudgeLearned, at: number, body: string, url = '/', quiet = false) => {
    if (doneOn(days, st, reviews, kind, k)) return;
    out.push({ id: kind + '-' + k, k: kind, d: k, at, body, url, ...(quiet ? { quiet: true as const } : {}) });
  };
  if (prefs.morning && onStep(lv('morning'), k, st) && morningInfo(days, st, k).applies)
    add('morning', atOf(k, prefs.morningAt, roll), NUDGE_WORDS.morning, '/', true);
  if (prefs.checkin && onStep(lv('checkin'), k, st)) add('checkin', atOf(k, backup ? ciBackupAt(st, prefs) : prefs.checkinAt, roll), NUDGE_WORDS.checkin);
  if (prefs.wind && st.screensOff && onStep(lv('wind'), k, st))
    add('wind', atOf(k, clockOf(minOf(st.screensOff) - 60), roll), NUDGE_WORDS.wind(fmtClock(st.screensOff)));
  if (prefs.review && isSunday(k) && onStep(lv('sunday'), k, st, true) && sunDue(reviews, st, k))
    add('sunday', atOf(k, NUDGE_SUNDAY_AT, roll), NUDGE_WORDS.sunday, '/review', true);
  if (prefs.risk && onStep(lv('risk'), k, st)) {
    const win = riskWindow(days, st, k);
    if (win) add('risk', riskAt(k, win.start, roll) - 90 * 60000, NUDGE_WORDS.risk);
  }
  /* on a Sunday, the check-in reminder carries the review too */
  const ci = out.find((n) => n.k === 'checkin');
  const su = out.findIndex((n) => n.k === 'sunday');
  if (ci && su >= 0) {
    out.splice(su, 1);
    ci.body = NUDGE_WORDS.both;
    ci.also = 'sunday';
  }
  /* after a slip: the first routine reminder of the day says it kindly */
  const kind = kindWords(days, st, k);
  const first = out.filter((n) => n.k !== 'risk').sort((a, b) => a.at - b.at)[0];
  if (kind && first) {
    first.body = kind;
    first.url = '/';
    delete first.also;
    delete first.quiet;
  }
  return out;
}

/** the kinder words for day k: the morning after a slip, and the days the Rekindle quest is still open */
function kindWords(days: Days, st: Settings, k: DayKey): string | null {
  const r = rkActive(days, st, k);
  if (!r || r.phase !== 'sun') return null;
  if (k === addDays(r.k, 1)) return NUDGE_WORDS.after;
  const c = rkCard(days, st, k, r, 12);
  return (c.kind === 'sun' || c.kind === 'almost') && rkOpen(days, st, k, r.k).op ? NUDGE_WORDS.quest : null;
}

/** at most NUDGE_MAX a day, NUDGE_GAP minutes apart, the most useful kept */
function capped(list: Nudge[]): Nudge[] {
  const keep: Nudge[] = [];
  for (const n of list.slice().sort((a, b) => PRI[a.k] - PRI[b.k] || a.at - b.at)) {
    if (keep.length >= NUDGE_MAX) break;
    if (keep.some((x) => Math.abs(x.at - n.at) < NUDGE_GAP * 60000)) continue;
    keep.push(n);
  }
  return keep;
}

/** whether any notification is turned on at all */
export const nudgesOn = (p: NudgePrefs) => p.morning || p.checkin || p.wind || p.review || p.risk;

/** the notifications to schedule now: today and tomorrow, then the come-back notes. now is the time the app is open. */
export function nudgePlan(days: Days, st: Settings | null, reviews: Reviews, prefs: NudgePrefs, log: NudgeLog, tk: DayKey, now: number): Nudge[] {
  if (!st || !nudgesOn(prefs)) return [];
  const backup = ciOnOwn(days, st, prefs, tk);
  const out: Nudge[] = [];
  for (const k of [tk, addDays(tk, 1)]) out.push(...capped(dayList(days, st, reviews, prefs, log, k, backup).filter((n) => n.at > now)));
  /* the come-back notes, only for someone who asked for a regular reminder (not just the heads-up before hard hours) */
  if (prefs.back !== false && (prefs.checkin || prefs.morning || prefs.wind || prefs.review)) {
    /* at the time of day the app was last open, kept to the daytime */
    const t = clockOf(Math.min(19 * 60, Math.max(10 * 60, clockAt(now))));
    NUDGE_BACK.forEach((n, i) => {
      const d = addDays(tk, n);
      out.push({ id: 'back-' + n, k: 'back', d, at: atOf(d, t, st.rollover), body: NUDGE_WORDS.back[i], url: '/' });
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
  return (n.k !== 'back' && doneOn(days, st, reviews, n.k, n.d)) || (n.also === 'sunday' && doneOn(days, st, reviews, 'sunday', n.d));
}

/** the log after the app opens (record the open in opens first): what was delivered is judged, and each kind steps up or
    down. allowed: whether the phone lets Daybook notify (when it does not, nothing was delivered, so nothing is judged). */
export function nudgeLearn(log: NudgeLog, days: Days, st: Settings | null, reviews: Reviews, now: number, allowed: boolean): NudgeLog {
  const x: NudgeLog = { ...log, lv: { ...log.lv }, miss: { ...log.miss } };
  const due = log.plan.filter((n) => n.at <= now);
  const wait = allowed && st ? [...log.wait, ...due].filter((n) => n.k !== 'back') : [];
  x.wait = [];
  for (const n of wait.sort((a, b) => a.at - b.at)) {
    const k = n.k as NudgeLearned;
    if (helped(days, st!, reviews, log, n)) {
      x.lv[k] = Math.max(0, (x.lv[k] || 0) - 1);
      x.miss[k] = 0;
    } else if (now >= n.at + NUDGE_JUDGE_MIN * 60000) {
      const m = (x.miss[k] || 0) + 1;
      if (m >= NUDGE_MISSES && (x.lv[k] || 0) < 2) {
        x.lv[k] = (x.lv[k] || 0) + 1;
        x.miss[k] = 0;
      } else x.miss[k] = m;
    } else x.wait.push(n);
  }
  x.plan = log.plan.filter((n) => n.at > now);
  x.taps = log.taps.filter((id) => x.plan.some((n) => n.id === id) || x.wait.some((n) => n.id === id));
  x.opens = log.opens.filter((t) => t > now - 3 * 86400000).slice(-40);
  return x;
}
/** the new plan, remembered in the log. What was due by now stays in it until nudgeLearn judges it. */
export function nudgeKeep(log: NudgeLog, plan: Nudge[], now: number): NudgeLog {
  const ids = new Set(plan.map((n) => n.id));
  const due = log.plan.filter((n) => n.at <= now && !ids.has(n.id));
  return { ...log, plan: [...due, ...plan.filter((n) => n.at > now).map(({ id, k, d, at, also }) => ({ id, k, d, at, ...(also ? { also } : {}) }))] };
}
/** the plan's identity, to tell when the phone's schedule needs making again */
export const nudgeKey = (plan: Pick<Nudge, 'id' | 'at' | 'body'>[]) => plan.map((n) => n.id + '@' + n.at + ':' + n.body).join('|');
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
