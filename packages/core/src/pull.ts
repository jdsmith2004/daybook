/* The app that pulls you in (Screen Time, iPhone only; docs/plan.md, "Screen Time"). The person picks the apps that pull them in
   (Apple's own picker: Daybook never learns which), and Daybook watches use of them through Apple's DeviceActivity, which tells it
   only that a threshold was passed, never the numbers:

   - The short wait (one sec's evidence), in lists (the owner, November 15, 2026: "for Instagram or something, it's like 5 or 10
     seconds ... and then how long they get access after that. Like 5 minutes, 10 minutes, 30 minutes. It's up to them"): up to
     three lists, each its own apps from Apple's list and its own wait (5, 10, 30 or 60 seconds, or none), all day. Apple's shield
     is up; its button brings the person to Daybook's /pause for that list's wait, then they choose how long it opens (5, 10 or 30
     minutes of use), then the wait is back. Only that list opens; no cap on how often.
   - Adult sites, all day (the owner, November 15, 2026: "all day for adult sites"): they wait behind Apple's adult filter, lifted
     only after a long wait (1, 5, 15 or 30 minutes), for the minutes the person then chooses, then it is back: a wait, not a wall.
   - The night (docs/plan.md, "The morning, not the moment", step 2; the owner, November 11, 2026): from the time the morning set
     chose (core morning-set.ts tonightOf) to 6 AM. Two notes at 10 and 20 minutes of use, and the night's words on the waits.
   - Loosen slowly, tighten at once: a looser choice made outside the morning waits for 6 AM (pullChange). Lift every wait now and
     Turn Screen Time off stay instant (and in Settings, as Apple requires), and at night they count as a night the lock did not hold.
   - After long use (1, 2 or 3 hours in a day), one note a day: to today's lesson when it is not done, otherwise to put it down.

   The words follow the stakes rule (CLAUDE.md, November 8, 2026): firm and plain, about the next choice and what it costs, never
   about who the person is. In the hours after a slip (until the next morning) there are no stakes: long use goes quiet, the night
   gets one note pointing to SOS, and the waits, which are the person's own protection, keep running in plain words. Nothing on a
   locked screen names the app, the habit or the person's reason.

   Everything here stays on the phone. Apple's license forbids Screen Time data leaving the device, so no anonymous count comes
   from any of it (pulse.ts), and none of it is in synced Settings: the choices are each phone's own. */
import { lastSlipMs, LOW_OF, partDone, type FireLow } from './flame-low';
import { SLIP_HOURS } from './hero';
import { habitOf } from './habit';
import { addDays, clockOf, evMs, eventsOf, fmtClock, isTime, logicalKey } from './legacy/core.js';
import { MORNING_TO, tonightOf } from './morning-set';
import { lessonDue } from './nudges';
import { riskAt } from './risk';
import type { Clock, DayEvent, DayKey, Days, Settings } from './types';

/** the person's choices, kept on the phone */
export interface PullPrefs {
  /** Screen Time access was given and apps were picked; the rest means nothing until then */
  on: boolean;
  /** hours of use in a day before the long-use note; 0 is off */
  long: 0 | 1 | 2 | 3;
  /** the two notes in the night hours (at 10 and 20 minutes of use) */
  hard: boolean;
  /** the lists, at least one: each its own apps from Apple's list (kept on the phone under its id, never here) and its own wait,
      all day (one sec's evidence: the wait and the way out do the work) */
  lists: PullList[];
  /** the minutes last chosen after a wait: the answer drawn first next time */
  opened: PullOpen;
  /** adult websites wait, all day (Apple's adult filter; only when the habit is porn) */
  adult: boolean;
  /** minutes of the long wait before adult sites open */
  lift: PullLift;
  /** the setup page was seen (picked or skipped), so a redo does not ask again unless it was skipped */
  asked?: 'picked' | 'skipped';
  /** tonight starts earlier than the morning said, for that one night (k is the clock's day it was chosen on, by day) */
  early?: { k: DayKey; at: Clock };
  /** looser choices waiting for the morning (loosen slowly, tighten at once): they apply at `at` ms */
  later?: { p: PullLoose; at: number };
  /** the start last handed to the phone for night k (pullHoldStart): a later start for that same night, outside the morning,
      waits for the morning like any loosening */
  armed?: { k: DayKey; at: Clock };
  /** Screen Time access was taken back in the phone's Settings, so it was turned off here (More says so until it is on again) */
  lost?: boolean;
}
/** the lists' ids: Apple's picks are kept on the phone under these, one ManagedSettingsStore each (targets/_shared) */
export type PullListId = 'a' | 'b' | 'c';
export const PULL_LIST_IDS: PullListId[] = ['a', 'b', 'c'];
/** a list's name: one of a few plain words (never typed: nothing a person writes sits next to Screen Time) */
export const PULL_LIST_NAMES = ['Apps', 'Social', 'Games', 'Videos', 'Shopping', 'News'] as const;
/** seconds of a list's wait; 0 is No wait (the list is open) */
export type PullWait = 0 | 5 | 10 | 30 | 60;
export type PullOpen = 5 | 10 | 30;
export type PullLift = 1 | 5 | 15 | 30;
export interface PullList {
  id: PullListId;
  name: string;
  wait: PullWait;
}
/** the choices that can loosen it, and so wait for the morning */
export type PullLooseKey = 'adult' | 'lift' | 'lists';
export type PullLoose = Partial<Pick<PullPrefs, PullLooseKey>>;
const LOOSE_KEYS: ('adult' | 'lift')[] = ['adult', 'lift'];

/** the plain name of this part in Settings and on its unlock page (the owner, November 9, 2026: "Apps that pull you in" said nothing) */
export const PULL_NAME = 'Screen Time';

/** "10 seconds", "1 minute", "No wait" */
export const pullWaitLabel = (w: number) => (w === 0 ? 'No wait' : w === 60 ? '1 minute' : w + ' seconds');
/** "10 sec", for a list's row */
export const pullWaitShort = (w: number) => (w === 0 ? 'No wait' : w === 60 ? '1 min' : w + ' sec');
/** the lists that wait (a list with No wait is open) */
export const pullWaiting = (p: PullPrefs) => p.lists.filter((l) => l.wait > 0);

/** the line under Screen Time in Settings: what it does now, in a few words */
export function pullLine(p: PullPrefs, porn = true): string {
  if (!p.on) return 'Off · a short wait before the apps that pull you in';
  const parts: string[] = [];
  const w = pullWaiting(p);
  if (w.length === 1) parts.push('a ' + (w[0].wait === 60 ? 'one-minute' : w[0].wait + '-second') + ' wait');
  else if (w.length > 1) parts.push(w.length + ' lists wait');
  if (p.adult && porn) parts.push('adult sites wait all day');
  if (!parts.length && p.long) parts.push('a note after ' + (p.long === 1 ? '1 hour' : p.long + ' hours'));
  if (!parts.length && p.hard) parts.push('notes at night');
  if (!parts.length) return 'On · every wait off';
  const s = parts.join(' · ');
  return s[0].toUpperCase() + s.slice(1);
}

export const PULL_DEFAULTS: PullPrefs = {
  on: false,
  long: 2,
  hard: true,
  lists: [{ id: 'a', name: 'Apps', wait: 10 }],
  opened: 10,
  adult: true,
  lift: 15,
};
export const PULL_LONG = [0, 1, 2, 3] as const;
/** a list's wait, in the order Settings shows them: No wait last */
export const PULL_WAIT: readonly PullWait[] = [5, 10, 30, 60, 0];
/** minutes it opens for, chosen after each wait */
export const PULL_OPEN: readonly PullOpen[] = [5, 10, 30];
export const PULL_LIFT: readonly PullLift[] = [1, 5, 15, 30];
/** minutes of use inside the night for the first note, the second, and the mark that the notes were ignored (pullDrift) */
export const PULL_HARD_AT = [10, 20, 30] as const;
/** the shortest schedule Apple allows, in minutes: the few minutes open are watched inside one this long */
export const PULL_MIN_SCHEDULE = 15;
/** the hour the quiet after a slip ends, the first one at least PULL_QUIET_MIN hours after it */
export const PULL_QUIET_HOUR = 8;
export const PULL_QUIET_MIN = 3;
/** the night ends at 6 AM: the morning self's time. The adult filter lifts then, and looser choices made in the night start then. */
export const PULL_NIGHT_END: Clock = '06:00';
const END_H = 6;

const pick = <T>(list: readonly T[], x: unknown, d: T): T => (list.includes(x as T) ? (x as T) : d);
const isKey = (k: unknown): k is DayKey => typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k);
/** saved choices, read safely: anything unknown falls back to the default. The old pause in the hard hours (`pause`) became the
    all-day wait, so a saved pause on reads as the wait on, and a saved pause off as the wait off (nothing new is sprung on
    someone who chose notes only). */
export function normPull(x: unknown): PullPrefs {
  const o = (x && typeof x === 'object' ? x : {}) as Partial<PullPrefs> & { pause?: unknown; feeds?: unknown; wait?: unknown };
  /* before the lists (November 15, 2026): one pick, its wait, and the wait on or off. That pick is list one, with the same wait, so
     nobody's setup changes; the wait off is a list with No wait (nothing new sprung on someone who chose notes only). */
  const feeds = typeof o.feeds === 'boolean' ? o.feeds : typeof o.pause === 'boolean' ? o.pause : true;
  const out: PullPrefs = {
    on: o.on === true,
    long: pick(PULL_LONG, o.long, PULL_DEFAULTS.long),
    hard: o.hard !== false,
    lists: normLists(o.lists) ?? [{ id: 'a', name: 'Apps', wait: feeds ? pick(PULL_WAIT, o.wait, 10) : 0 }],
    opened: pick(PULL_OPEN, o.opened, PULL_DEFAULTS.opened),
    adult: o.adult !== false,
    lift: pick(PULL_LIFT, o.lift, PULL_DEFAULTS.lift),
  };
  if (o.asked === 'picked' || o.asked === 'skipped') out.asked = o.asked;
  if (o.early && isKey(o.early.k) && isTime(o.early.at)) out.early = { k: o.early.k, at: o.early.at as Clock };
  if (o.armed && isKey(o.armed.k) && isTime(o.armed.at)) out.armed = { k: o.armed.k, at: o.armed.at as Clock };
  if (o.lost === true) out.lost = true;
  const l = o.later;
  if (l && typeof l === 'object' && typeof l.at === 'number' && l.p && typeof l.p === 'object') {
    const p: PullLoose = {};
    const src = l.p as Record<string, unknown>;
    if (typeof src.adult === 'boolean') p.adult = src.adult;
    if (PULL_LIFT.includes(src.lift as 5)) p.lift = src.lift as PullLift;
    const ls = normLists(src.lists);
    if (ls) p.lists = ls;
    if (Object.keys(p).length) out.later = { p, at: l.at };
  }
  return out;
}

/** lists read safely: known ids once each, known names, known waits; null when there are none */
function normLists(x: unknown): PullList[] | null {
  if (!Array.isArray(x)) return null;
  const out: PullList[] = [];
  for (const l of x) {
    if (!l || typeof l !== 'object') continue;
    const o = l as Record<string, unknown>;
    const id = o.id as PullListId;
    if (!PULL_LIST_IDS.includes(id) || out.some((y) => y.id === id)) continue;
    const name = PULL_LIST_NAMES.includes(o.name as 'Apps') ? (o.name as string) : pullListName(out);
    out.push({ id, name, wait: pick(PULL_WAIT, o.wait, 10) });
  }
  return out.length ? out : null;
}
/** a new list's name: the first of Social, Games, Videos... not yet taken */
export function pullListName(lists: PullList[]): string {
  return PULL_LIST_NAMES.slice(1).find((n) => !lists.some((l) => l.name === n)) ?? 'Apps';
}
/** a new list (Add a list), or null when there are already three. Its id is one no list now or waiting for the morning has, so a
    removed list's apps (still held until the morning) are never mixed into it. */
export function pullListNew(p: PullPrefs): PullList | null {
  const taken = [...p.lists, ...(p.later?.p.lists ?? [])];
  const id = PULL_LIST_IDS.find((i) => !taken.some((l) => l.id === i));
  const shown = pullShown(p).lists;
  return id && shown.length < PULL_LIST_IDS.length ? { id, name: pullListName(shown), wait: 10 } : null;
}

/* ---------- the night: from the morning's time to 6 AM ---------- */

/** minutes into the night, so 8 PM < 11:30 PM < 1 AM */
const nightMin = (t: Clock) => {
  const [h, m] = t.split(':').map(Number);
  return (h < 12 ? h + 24 : h) * 60 + m;
};
/** the earlier of two night times */
export const pullEarlier = (a: Clock, b: Clock): Clock => (nightMin(b) < nightMin(a) ? b : a);
/** whether b starts the night later than a (a looser time) */
export const pullLater = (a: Clock, b: Clock) => nightMin(b) > nightMin(a);

/** the night a moment belongs to: the day it started (11 PM and 2 AM are the same night; it ends at 6 AM) */
export const pullNightOf = (now: number): DayKey => logicalKey(now, END_H);

/** when the night starts: the morning set's time (core tonightOf: that day's, or the last morning's), or earlier when More was
    used to start it earlier that night. A later start is only ever the morning's. Between midnight and 6 AM it is the night still
    running (pullNightOf), so an early start before midnight holds through to the morning. */
export function pullNightStart(days: Days, st: Settings, prefs: PullPrefs, now: number): Clock {
  return startOf(days, st, prefs, pullNightOf(now));
}
/** when the next night starts, for Apple's schedules: this evening's, even between midnight and 6 AM (the morning set at 5 AM
    sets tonight) */
export function pullNextStart(days: Days, st: Settings, prefs: PullPrefs, now: number): Clock {
  return startOf(days, st, prefs, logicalKey(now, 0));
}
function startOf(days: Days, st: Settings, prefs: PullPrefs, k: DayKey): Clock {
  const at = tonightOf(days, st, k).at;
  return prefs.early && prefs.early.k === k ? pullEarlier(at, prefs.early.at) : at;
}

const minOfDay = (now: number) => {
  const d = new Date(now);
  return d.getHours() * 60 + d.getMinutes();
};
const clockMin = (t: Clock) => +t.slice(0, 2) * 60 + +t.slice(3, 5);
/** whether `now` is inside the night that starts at `from` (by the phone's clock; it ends at PULL_NIGHT_END) */
export function pullInNight(now: number, from: Clock): boolean {
  const m = minOfDay(now);
  const f = clockMin(from);
  const e = clockMin(PULL_NIGHT_END);
  return f > e ? m >= f || m < e : m >= f && m < e;
}
/** the next moment at clock `t` after `now`, in ms */
function nextAt(now: number, t: Clock): number {
  const d = new Date(now);
  d.setHours(+t.slice(0, 2), +t.slice(3, 5), 0, 0);
  if (d.getTime() <= now) d.setDate(d.getDate() + 1);
  return d.getTime();
}
/** "Lift every wait now": until the night starts when it is day (so tonight still comes), until 6 AM when it is night */
export const pullLiftUntil = (now: number, from: Clock): number => (pullInNight(now, from) ? nextAt(now, PULL_NIGHT_END) : nextAt(now, from));
/** the morning is 6 AM to 2 PM: the self who is sure. A looser choice made then works at once. */
export const pullMorningNow = (now: number): boolean => {
  const h = new Date(now).getHours();
  return h >= END_H && h < MORNING_TO;
};
/** when a looser choice made now starts: null for now (the morning), otherwise the next 6 AM */
export const pullLooseAt = (now: number): number | null => (pullMorningNow(now) ? null : nextAt(now, PULL_NIGHT_END));

/* ---------- loosen slowly, tighten at once (the owner, November 11, 2026) ---------- */

/** whether going from a to b loosens it */
function looser(k: 'adult' | 'lift', a: PullPrefs['adult' | 'lift'], b: PullPrefs['adult' | 'lift']): boolean {
  if (k === 'adult') return a === true && b === false;
  return (b as number) < (a as number);
}
/** a list's wait going from a to b lets its apps through sooner: shorter, or none */
const waitLooser = (a: PullWait, b: PullWait | undefined) => a > 0 && (b == null || b === 0 || b < a);
/** a change from More. A stricter one works now. A looser one works now in the morning, and otherwise waits for 6 AM in `later`
    (choosing the value that holds now takes it back). The rest (Screen Time on or off, the notes, the long-use note, the apps'
    setup) works now: turning off is always instant, as Apple requires, and a nag must be easy to stop. `held` is when the change
    starts, when it waits. */
export function pullChange(prefs: PullPrefs, change: Partial<PullPrefs>, now: number): { prefs: PullPrefs; held: number | null } {
  const p0 = pullSettle(prefs, now);
  const out: PullPrefs = { ...p0, ...change };
  const o = out as unknown as Record<string, unknown>;
  const later: Record<string, unknown> = { ...(p0.later?.p ?? {}) };
  let held: number | null = null;
  /* the lists, one by one: what `change.lists` asks for is the whole list as it should end up. A list removed or given a shorter
     wait keeps its old wait until the morning (the whole asked-for list then waits in `later`); a new list, a longer wait, a new
     name work now. */
  if (change.lists) {
    const want = change.lists;
    const at = p0.on ? pullLooseAt(now) : null;
    const nowL: PullList[] = [];
    let loose = false;
    for (const x of p0.lists) {
      const y = want.find((z) => z.id === x.id);
      if (at != null && waitLooser(x.wait, y?.wait)) {
        loose = true;
        nowL.push(y ? { ...y, wait: x.wait } : x);
      } else if (y) nowL.push(y);
    }
    for (const y of want) if (!p0.lists.some((x) => x.id === y.id)) nowL.push(y);
    out.lists = nowL;
    delete later.lists;
    if (loose) {
      later.lists = want;
      held = at;
    }
  }
  for (const k of LOOSE_KEYS) {
    if (!(k in change)) continue;
    const v = change[k] as PullPrefs[typeof k];
    o[k] = p0[k];
    delete later[k];
    if (v === p0[k]) continue;
    const at = p0.on ? pullLooseAt(now) : null;
    if (at != null && looser(k, p0[k], v)) {
      later[k] = v;
      held = at;
    } else o[k] = v;
  }
  if (Object.keys(later).length) out.later = { p: later as PullLoose, at: held ?? p0.later?.at ?? pullLooseAt(now) ?? now };
  else delete out.later;
  return { prefs: out, held };
}
/** the choices as they stand at `now`: looser ones whose morning has come are applied */
export function pullSettle(prefs: PullPrefs, now: number): PullPrefs {
  if (!prefs.later || now < prefs.later.at) return prefs;
  const out: PullPrefs = { ...prefs, ...prefs.later.p };
  delete out.later;
  return out;
}
/** what More shows as chosen: the waiting looser choices too (with when they start under them) */
export const pullShown = (prefs: PullPrefs): PullPrefs => (prefs.later ? { ...prefs, ...prefs.later.p } : prefs);

/** Start it earlier tonight, from More (by day: once the night runs, it already holds). Stricter, so it works now; the morning's
    time or a later one takes the early start away. */
export function pullEarly(prefs: PullPrefs, days: Days, st: Settings, at: Clock, now: number): PullPrefs {
  const k = logicalKey(now, 0);
  const out = { ...prefs };
  delete out.early;
  return pullLater(at, tonightOf(days, st, k).at) ? { ...out, early: { k, at } } : out;
}

/** Good night (WP5): the night starts now, for tonight only. Stricter, so it works at once; a time already earlier keeps. After
    midnight it is the night still running (pullNightOf), so Good night at 12:30 AM with a 1 AM start starts it at 12:30. */
export function pullArmNow(prefs: PullPrefs, days: Days, st: Settings, now: number): PullPrefs {
  const k = pullNightOf(now);
  const at = clockOf(now) as Clock;
  const from = startOf(days, st, prefs, k);
  return pullLater(at, from) ? { ...prefs, early: { k, at } } : prefs;
}

/** loosen slowly, for the start time itself: once a night's start has been handed to the phone, a later start for that same
    night (the sleep time moved, an early start taken back) waits for the morning, unless it is the morning now. The start that
    holds is kept as that night's early start. Returns the choices with `armed` set to the start the phone gets. */
export function pullHoldStart(prefs: PullPrefs, days: Days, st: Settings, now: number): PullPrefs {
  const k = pullNightOf(now);
  let p = prefs;
  let from = startOf(days, st, p, k);
  const a = p.armed;
  if (a && a.k === k && pullLater(a.at, from) && !pullMorningNow(now)) {
    p = { ...p, early: { k, at: a.at } };
    from = a.at;
  }
  if (a && a.k === k && a.at === from && p === prefs) return prefs;
  return { ...p, armed: { k, at: from } };
}

/** what is held right now (mirrored in the extensions' Pull.guardNow and the module's): each list's apps behind its wait, and adult
    sites behind the filter, all day. Each hold is ms until it ends (0 for none): `lift` Lift every wait now, `open` each list's
    minutes opened after its wait, `web` the minutes adult sites opened after the long wait. */
export interface PullHolds {
  lift: number;
  open: Partial<Record<PullListId, number>>;
  web: number;
}
/** minutes Apple's callbacks at the night's start and end are read ahead by: one that comes a few seconds early still finds the
    night it was set for (the start sets the filter, the end lifts it), so no night is left open by a second */
export const PULL_GRACE = 2;
/** `boundary`: this is one of the night's own callbacks (a start, an end, the heartbeat), read PULL_GRACE minutes ahead */
export function pullGuard(
  p: PullPrefs,
  o: { adult: boolean; from: Clock; holds: PullHolds; now: number; boundary?: boolean },
): { apps: Partial<Record<PullListId, boolean>>; web: boolean } {
  const { holds: h, now } = o;
  /* Lift every wait ends at a night's start or end, where Apple's callback can come a few seconds early: a minute's grace */
  const free = now >= h.lift - 60_000;
  const apps: Partial<Record<PullListId, boolean>> = {};
  for (const l of p.lists) apps[l.id] = p.on && l.wait > 0 && free && now >= (h.open[l.id] ?? 0);
  return { apps, web: p.on && p.adult && o.adult && free && now >= h.web };
}

/* ---------- Apple's schedules for the night (core decides them; the module sets exactly these) ----------
   Arm by the clock, not by which callback fired: every callback asks "what should be held right now?" (pullGuard), so these are
   only the moments Apple wakes the monitor to ask. No interval crosses midnight; each is at least PULL_MIN_SCHEDULE long. */
export interface PullPart {
  /** the schedule's name: the night's evening part, its after-midnight part, the heartbeat after the start, the morning check */
  n: 'pull.night.a' | 'pull.night.b' | 'pull.night.h' | 'pull.morning';
  /** start and end, minutes into the day */
  a: number;
  b: number;
  /** whether it watches the minutes of use (the night's two notes and the ignored mark) */
  ev: boolean;
}
/** minutes after the night's start that the heartbeat asks again, in case the start's own callback did not come */
export const PULL_HEARTBEAT = 5;
export function pullParts(next: Clock): PullPart[] {
  const f = clockMin(next);
  const e = clockMin(PULL_NIGHT_END);
  const last = 23 * 60 + 59;
  const min = PULL_MIN_SCHEDULE;
  const out: PullPart[] = [];
  if (f > e) {
    if (last - f >= min) out.push({ n: 'pull.night.a', a: f, b: last, ev: true });
    out.push({ n: 'pull.night.b', a: 0, b: e, ev: true });
  } else if (e - f >= min) out.push({ n: 'pull.night.b', a: f, b: e, ev: true });
  const h = f + PULL_HEARTBEAT;
  if (h + min <= (f > e ? last : e)) out.push({ n: 'pull.night.h', a: h, b: h + min, ev: false });
  /* after 6 AM: the filter is lifted even if the end's callback did not come, and the night just gone is confirmed as held */
  out.push({ n: 'pull.morning', a: e + PULL_HEARTBEAT, b: e + PULL_HEARTBEAT + min, ev: false });
  return out;
}

/* ---------- when it is not working: said in plain words, never "On" over nothing ---------- */

/** what the phone says about Screen Time (the module's health and status) */
export interface PullHealth {
  /** Apple's answer: approved, denied (taken back in Settings), or not determined (after a restore to a new phone) */
  status: 'approved' | 'denied' | 'notDetermined';
  /** schedules Apple would not start */
  failed: string[];
  /** the picked apps could not be read back (after an iOS update) */
  decodeFail: boolean;
  /** how many single apps are picked (Apple holds at most PULL_MAX_APPS) */
  apps: number;
}
/** Apple's shield holds at most this many single apps; more and none of them waits */
export const PULL_MAX_APPS = 50;
export type PullFix = 'ask' | 'retry' | 'pick';
/** what is wrong, in one line, and the one tap that fixes it; null when it works (or is off) */
export function pullTrouble(prefs: PullPrefs, h: PullHealth | null): { line: string; fix: PullFix; btn: string } | null {
  if (!prefs.on || !h) return null;
  if (h.status !== 'approved') return { line: 'Screen Time is not working: it needs your yes again on this phone.', fix: 'ask', btn: 'Give it' };
  if (h.apps > PULL_MAX_APPS)
    return { line: 'Screen Time is not working: Apple holds at most ' + PULL_MAX_APPS + ' apps. Pick fewer.', fix: 'pick', btn: 'Pick' };
  if (h.decodeFail) return { line: 'Screen Time is not working: the apps need picking again.', fix: 'pick', btn: 'Pick' };
  if (h.failed.length) return { line: 'Screen Time is not working: Apple did not start tonight’s wait.', fix: 'retry', btn: 'Try again' };
  return null;
}

/* ---------- nights the lock held (for the effort record) ----------
   The App Group keeps, on this phone only, { [night]: 1 | 2 | 3 } by pullNightOf: 1 when the night's waits were on at its
   start, 2 when the person went through (opened adult sites after the long wait, opened a feed after the short wait, lifted every
   wait, or turned Screen Time off, in that night, or access was taken back in Settings), 3 when the morning came with the waits
   still on and access still given (the morning's check, or the app's first open after 6 AM) and nothing gone through. Only 3
   is a night the lock held: a night switched off in Settings never reaches the morning's check. It comes from Screen Time, so it
   is never synced, backed up or sent. */
export type PullNights = Record<DayKey, number>;
export function pullNightHeld(rec: PullNights | null | undefined, k: DayKey): 'held' | 'through' | 'started' | null {
  const v = rec?.[k];
  return v === 3 ? 'held' : v === 2 ? 'through' : v === 1 ? 'started' : null;
}
/** the night's mark after `v` (the same rule as the extensions' Pull.markNight): went through wins over everything, held only
    follows a night that started, and started only marks a night with nothing yet */
export function pullMark(old: number | undefined, v: 1 | 2 | 3): number | undefined {
  if (v === 2) return 2;
  if (v === 3) return old === 1 ? 3 : old;
  return old ?? 1;
}

/** when the quiet after a slip ends (ms), or null when there is none: from a slip on today's or yesterday's log, until the first
    8 AM at least three hours after it. A slip logged with no time counts from the end of its log day. */
export function pullQuietUntil(days: Days, st: Settings, now: number): number | null {
  const today = logicalKey(now, st.rollover);
  let end: number | null = null;
  for (const k of [addDays(today, -1), today]) {
    for (const e of eventsOf(days, k)) {
      if (e.outcome !== 'slipped') continue;
      const at = isTime(e.time) ? riskAt(k, +e.time.slice(0, 2), st.rollover, +e.time.slice(3, 5)) : riskAt(addDays(k, 1), st.rollover, st.rollover) - 1;
      const d = new Date(at + PULL_QUIET_MIN * 3600_000);
      if (d.getHours() >= PULL_QUIET_HOUR) d.setDate(d.getDate() + 1);
      d.setHours(PULL_QUIET_HOUR, 0, 0, 0);
      const t = d.getTime();
      if (t > now && (end == null || t > end)) end = t;
    }
  }
  return end;
}

/** the person's own plan line for this moment, from their urge plan: scrolling first, then late at night */
export function pullPlanLine(st: Settings): string | null {
  const rows = st.plan || [];
  const row = rows.find((r) => /scrolling/i.test(r.when) && r.then.trim()) || rows.find((r) => /late at night/i.test(r.when) && r.then.trim());
  if (!row) return null;
  const t = row.then.trim();
  /* quoted, since the plan is in the person's own voice ("my phone") and the flame is the one saying it */
  return 'Your plan: “' + t + (/[.!?]$/.test(t) ? '' : '.') + '”';
}

/* ---------- the words, in the flame's voice ---------- */

export type PullNoteKind = 'long' | 'longDone' | 'hard1' | 'hard2' | 'quiet' | 'open' | 'openLong';
export interface PullNote {
  t: string;
  b: string;
  url: string;
  /** the words once the person has put it down at least once: {n} and {next} are filled on the phone with the live count
      (pullDownsFill), since the shield's Close adds to it while Daybook is shut */
  bDowns?: string;
}
/** every note the extension may post, with where a tap goes; the lesson's link is today's lesson (or Today). Nothing on a locked
    screen names the app, the habit or the person's reason. */
export function pullNudges(o: { lessonUrl: string; long: number }): Record<PullNoteKind, PullNote> {
  const hrs = o.long === 1 ? 'An hour' : (o.long === 2 ? 'Two' : 'Three') + ' hours';
  return {
    long: {
      t: '🔥 ' + hrs + ' in',
      b: hrs + ' there today, and no lesson yet. You are dimming your fire. Three minutes with me puts it back.',
      url: o.lessonUrl,
    },
    longDone: {
      t: '🔥 ' + hrs + ' in',
      b: hrs + ' there today. Every minute more is a minute your fire does not get. Put it down.',
      bDowns: hrs + ' there today. Every minute more is a minute your fire does not get. You have put it down {n}. Make it {next}.',
      url: '/',
    },
    /* the next choice and what it costs, never who the person is: the count says what they have already done, and asks for one more */
    hard1: {
      t: '🔥 Tonight',
      b: 'You are on it again. You are dimming your fire. The next choice is yours: stand up and walk to another room, now.',
      bDowns: 'You have put it down {n}. You are dimming your fire now. Make it {next}: stand up and walk to another room.',
      url: '/pause',
    },
    hard2: { t: '🔥 Still here', b: 'This is the choice that counts tonight. Put the phone in another room. If it pulls, open me.', url: '/pause' },
    quiet: { t: '🔥 Tonight', b: 'You do not have to fight it alone tonight. SOS is one tap away.', url: '/sos' },
    /* posted when the shield's button is pressed before iOS 26.5, since a shield cannot open Daybook itself (the shield adds which
       list asked: ?l=a) */
    open: { t: '🔥 Here', b: 'Tap, and I will be right there.', url: '/pause' },
    /* the same, from Daybook's shield over an adult site: the long wait */
    openLong: { t: '🔥 Here', b: 'Tap, and the wait starts.', url: '/pause?w=long' },
  };
}

/** what the morning set gave tonight (core tonightOf), for the shield and the wait page */
export interface PullTonight {
  /** the person's reason, in their own words, or null */
  r: string | null;
  /** when it was chosen, ms */
  rAt: number | null;
  /** it was chosen this morning (not carried from an earlier one) */
  today: boolean;
}
const quote = (r: string) => '“' + r.trim() + '”';

/** Apple's shield: a still picture with a title, a line and two buttons (it cannot count down; the wait is Daybook's /pause) */
export interface PullShield {
  title: string;
  sub: string;
  /** the line once the person has put it down at least once, {n} and {next} filled by the shield with the live count */
  subDowns: string;
  primary: string;
  secondary: string;
}
/** by day, the short wait in plain words; at night, what the person set up that morning, in their own words (show it, do not say
    it). In the quiet after a slip, no stakes: only the reason and that the flame is there. */
export function pullShield(o: {
  night: boolean;
  wait: number;
  plan: string | null;
  tonight: PullTonight | null;
  quiet: boolean;
  /** over an adult site: the long wait's minutes */
  long?: number;
}): PullShield {
  const primary = o.long ? 'Wait ' + (o.long === 1 ? '1 minute' : o.long + ' minutes') : 'Wait ' + pullWaitLabel(o.wait);
  const downs = 'You have put it down {n}. Close it, and that makes {next}.';
  if (!o.night && o.long)
    return {
      title: 'A long wait first',
      sub: 'You asked for a long wait before these. Close it, or take the wait.',
      subDowns: downs,
      primary,
      secondary: 'Close',
    };
  /* by day, never the plan: it is the night's ("back to bed without my phone" at noon reads wrong) */
  if (!o.night)
    return {
      title: 'A short wait first',
      sub: 'You asked me for a moment before this one. Close it, or take the wait.',
      subDowns: downs,
      primary,
      secondary: 'Close',
    };
  const r = o.tonight?.r ? quote(o.tonight.r) + ' ' : '';
  return {
    title: o.tonight?.today ? 'You set this up this morning' : 'Tonight is set',
    sub: r + (o.quiet ? 'Put it down, and I will stay right here.' : 'Close it, and go to bed. Your fire is worth more than this.'),
    subDowns: r + downs,
    primary,
    secondary: 'Close',
  };
}

/** the words on Daybook's own wait screen */
export interface PullPauseWords {
  title: string;
  /** one plain line under it: at night, the person's own reason, quoted with when they chose it */
  line: string;
  /** the flame's bubble over the ring */
  say: string;
  /** under the ring while it runs */
  hold: string;
  /** the main button: away from the app */
  down: string;
  /** over the three answers (5, 10 or 30 minutes) once the wait is over */
  open: string;
  /** the stake, said before the choice (never after, never in the quiet after a slip): only in the night, where Open counts as a
      night gone through */
  stake: string | null;
  /** after "Put it down" */
  thanks: string;
  /** under the ring once the wait is over, in the night only: sleep care for the person lying awake (C3) */
  awake: string | null;
}
/** sleep care's one line for the person lying awake (the plan, C3: the wait page at night gains it) */
export const PULL_AWAKE = 'Awake after 20 minutes? Get up, leave the phone, come back sleepy.';
/** "7:40 AM" */
const timeOf = (ms: number) => fmtClock(clockOf(ms));
/** `mode`: 'day' the short wait by day, 'night' the short wait in the night hours, 'long' the long wait before adult sites (all
    day; `night` says whether it is the night now) */
export function pullPauseWords(o: {
  mode: 'day' | 'night' | 'long';
  quiet: boolean;
  plan: string | null;
  tonight?: PullTonight | null;
  downs?: number;
  /** the long wait: whether it is the night now */
  night?: boolean;
}): PullPauseWords {
  const n = o.downs ?? 0;
  const long = o.mode === 'long';
  if (o.mode === 'day' || (long && !o.night))
    return {
      title: long ? 'A long wait first' : 'A short wait first',
      line: long ? 'You asked for a long wait before these.' : 'You asked me for a moment before this one.',
      say: 'You can put it down right now.',
      hold: long ? 'It keeps counting if you leave.' : 'Breathe while it runs.',
      down: 'Put it down',
      open: long ? 'Open them for' : 'Open it for',
      stake: null,
      thanks: n >= 2 ? 'You put it down. That makes ' + n + '.' : 'You put it down. That is what someone free does.',
      awake: null,
    };
  const t = o.tonight;
  const said = t?.r ? (t.rAt ? 'You, at ' + timeOf(t.rAt) + ': ' : 'You: ') + quote(t.r) : null;
  return {
    title: t?.today ? 'You set this up this morning.' : t?.r ? 'You set this up for tonight.' : 'Tonight is set.',
    line: said ?? (o.quiet ? 'Tonight is not a night to be alone with your phone.' : 'Put the phone down. This is the choice that keeps your fire burning.'),
    say: o.plan ?? (o.quiet ? 'Put it down, and I will stay right here.' : 'Stand up and walk to another room. I will be right here.'),
    hold: long ? 'It keeps counting if you leave.' : 'Breathe while it runs.',
    down: 'Put it down and go to bed',
    open: long ? 'Open them for' : 'Open it for',
    stake: o.quiet ? null : (long ? 'Open them' : 'Open it') + ', and tonight goes in the week as a night you went through.',
    thanks: o.quiet
      ? 'That was the strong choice. It is in your log as a win.'
      : n >= 2
        ? 'That makes ' + n + '. One more win in your log.'
        : 'One more win in your log. That is what someone free does.',
    awake: PULL_AWAKE,
  };
}

/** what the flame says on setup's Screen Time page (setup.ts, the night page): what waits, and that it lifts whenever they want */
export function pullSetupSay(o: { porn: boolean; at?: Clock; lift?: number }): string {
  return (
    (o.porn ? 'It usually starts with scrolling. Each feed will wait ten seconds before it opens' : 'Each app you pick will wait ten seconds before it opens') +
    (o.porn ? ', and adult sites wait ' + (o.lift ?? PULL_DEFAULTS.lift) + ' minutes, all day.' : '.') +
    ' You can lift it whenever you want.'
  );
}

/* ---------- Put it down: evidence, not just a way out ---------- */

/** minutes after an urge ridden out (from anywhere) before Put it down logs another, so the notes cannot be tapped for points */
export const PULL_DOWN_GAP = 60;

/** "Put it down" on the wait screen is an urge ridden out: after scrolling, by leaving the room. It goes in the log like any
    other, so it earns its points, feeds the flame and counts as the person's part for the day (flame-low partDone). Null when
    an urge was already ridden out in the last PULL_DOWN_GAP minutes (that one already counts). Nothing here is a Screen Time
    number: it is the person's own answer on Daybook's own screen. */
export function pullDownEvent(days: Days, st: Settings, now: number): { key: DayKey; time: string; fields: Partial<DayEvent> } | null {
  const key = logicalKey(now, st.rollover);
  for (const k of [key, addDays(key, -1)]) {
    for (const e of days[k]?.events ?? []) {
      if (e.outcome !== 'rode' || !e.time) continue;
      const at = evMs(k, e.time, st.rollover);
      if (at <= now && now - at < PULL_DOWN_GAP * 60000) return null;
    }
  }
  return { key, time: clockOf(now), fields: { trigger: 'scroll', did: ['left'] } };
}

/* ---------- the count: every time the person puts it down ----------
   Each Close on the shield, and each Put it down on the wait screen (reached from the shield or a note), is one more time the person
   put it down. The count is kept in the App Group on this phone (Pull.countDown in targets/_shared/PullShared.swift, and the
   module's countDown), never synced and never sent, because it comes from Screen Time. It only goes up. */

/** minutes after one put-down before another counts, so closing the shield again and again does not run the count up */
export const PULL_COUNT_GAP = 10;

/** "once", "6 times" */
export const pullTimes = (n: number) => (n === 1 ? 'once' : n + ' times');
/** fills a line's {n} and {next} with the count (the same rule as the extensions' Pull.fill) */
export const pullDownsFill = (s: string, n: number) => s.replace('{n}', pullTimes(n)).replace('{next}', String(n + 1));

/** whether a put-down at `now` counts, after the last counted one at `last` ms */
export const pullCounts = (last: number, now: number) => !(last > 0 && now >= last && now - last < PULL_COUNT_GAP * 60000);

/* ---------- what the app shares with the extensions ---------- */

/** what the main app writes to the App Group on every open and change, for the extensions to read; they only read and decide */
export interface PullBridge {
  /** the log day it was written for: the extension treats anything older as "not opened today" */
  day: DayKey;
  /** the hour a log day starts (settings.rollover), so the extension can tell which log day it is now */
  rollover: number;
  lessonDone: boolean;
  quietUntil: number | null;
  /** the choices as they stand, with any looser ones waiting for the morning in `later` (the extensions apply them at its time) */
  prefs: PullPrefs;
  /** the night: when the one running or coming starts (the morning's time, or earlier) and ends, by the clock; `next` is this
      evening's start, which Apple's schedules follow */
  night: { from: Clock; to: Clock; next: Clock };
  /** adult sites wait: the person's choice, and only when the habit is porn */
  adult: boolean;
  /** each list's shield button ("Wait 10 seconds"), by list */
  waits: Partial<Record<PullListId, string>>;
  notes: Record<PullNoteKind, PullNote>;
  /** the shield by day */
  shield: PullShield;
  /** the shield in the night, with the morning's reason */
  shieldNight: PullShield;
  /** the shield in the night, in the quiet after a slip */
  shieldQuiet: PullShield;
  /** over an adult site, if Apple shows Daybook's shield there: the long wait by day, and in the night (quiet after a slip in
      shieldWebQuiet) */
  shieldWebDay: PullShield;
  shieldWeb: PullShield;
  shieldWebQuiet: PullShield;
  /** Apple's schedules for the night, exactly as the module sets them (pullParts of night.next) */
  parts: PullPart[];
}
export function pullBridge(days: Days, st: Settings, prefs: PullPrefs, now: number, account = true): PullBridge {
  const day = logicalKey(now, st.rollover);
  const lid = lessonDue(days, st, day, account);
  const p = pullSettle(prefs, now);
  const from = pullNightStart(days, st, p, now);
  const plan = pullPlanLine(st);
  const t = tonightOf(days, st, pullNightOf(now));
  const tonight: PullTonight = { r: t.r, rAt: t.rAt, today: t.today };
  /* the shield words name the first waiting list's wait; each list's own button rides in `waits` */
  const wait = pullWaiting(p)[0]?.wait ?? 10;
  const waits: Partial<Record<PullListId, string>> = {};
  for (const l of p.lists) waits[l.id] = 'Wait ' + pullWaitLabel(l.wait);
  return {
    day,
    rollover: st.rollover,
    lessonDone: !lid,
    quietUntil: pullQuietUntil(days, st, now),
    prefs: p,
    night: { from, to: PULL_NIGHT_END, next: pullNextStart(days, st, p, now) },
    adult: habitOf(st) === 'porn',
    waits,
    notes: pullNudges({ lessonUrl: lid ? '/lesson/' + lid : '/', long: p.long }),
    shield: pullShield({ night: false, wait, plan, tonight: null, quiet: false }),
    shieldNight: pullShield({ night: true, wait, plan, tonight, quiet: false }),
    shieldQuiet: pullShield({ night: true, wait, plan: null, tonight, quiet: true }),
    shieldWebDay: pullShield({ night: false, wait, plan: null, tonight: null, quiet: false, long: p.lift }),
    shieldWeb: pullShield({ night: true, wait, plan, tonight, quiet: false, long: p.lift }),
    shieldWebQuiet: pullShield({ night: true, wait, plan: null, tonight, quiet: true, long: p.lift }),
    parts: pullParts(pullNextStart(days, st, p, now)),
  };
}

/** which note the extension posts for a threshold, or null for none. `kind` is the event: 'long', or the night's 1, 2 or 3
    (the third only marks the notes ignored). `opened` is whether Daybook was opened on the bridge's day. */
export function pullNoteFor(b: PullBridge, kind: 'long' | 1 | 2 | 3, now: number, opened: boolean): PullNoteKind | null {
  const quiet = b.quietUntil != null && now < b.quietUntil;
  if (kind === 'long') {
    if (quiet || b.prefs.long === 0) return null;
    return opened && b.lessonDone ? 'longDone' : 'long';
  }
  if (!b.prefs.hard) return null;
  if (quiet) return kind === 1 ? 'quiet' : null;
  if (kind === 1) return 'hard1';
  if (kind === 2) return 'hard2';
  return null;
}

/* ---------- the stakes: the notes ignored ---------- */

/** the fire burns one step lower when the night's notes were ignored (the owner, November 9, 2026: "yes, the flame burns lower
    for real"). The monitor keeps when Apple saw the full PULL_HARD_AT[2] minutes of use inside the night after both notes
    (`ignoredAt`, on this phone only). On that log day and the next, while nothing of their part is done that day, the fire burns at
    LOW_OF[1]; the first thing done lights it again in front of them (Today's re-light, hero.tsx). Never in the hours after a slip (SLIP_HOURS, as fireLow), and it
    never goes lower than one step on its own: days with nothing done still do that. */
export function pullDrift(f: FireLow, ignoredAt: number | null, days: Days, st: Settings | null, tk: DayKey, now: number): FireLow {
  if (!st || ignoredAt == null || ignoredAt > now || f.step > 0) return f;
  const k = logicalKey(ignoredAt, st.rollover);
  if (k !== tk && k !== addDays(tk, -1)) return f;
  const slip = lastSlipMs(days, st, tk);
  if (slip != null && now - Math.min(slip, now) < SLIP_HOURS * 36e5) return f;
  if (partDone(days, st, tk)) return f;
  return { ...f, step: 1, low: LOW_OF[1], was: 1, warn: false, pull: true };
}
