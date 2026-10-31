/* "Your day" on Today: the lesson, the evening check-in and the wind-down, and switching parts of one day on or off. Ported
   from the legacy pathHtml, stopStatus, windLine, doSaveCheckin and the Today actions (night-so, night-sleep, wind, rt-day,
   save-checkin). The morning stop ("Last night") was retired on October 23, 2026 (docs/plan.md, "Lessons first"): Good
   night counts as the phone going away, and as screens off on time when it comes before the screens-off time (phoneAway),
   and sleep is one optional question in the evening check-in, kept where the morning kept it (checkin.h). Since October
   24, 2026 the check-in is three quick numbers (mood, urges, stress) and then Goodnight, which saves it and puts the phone
   away in one tap (sayGoodnight). Checked by test/day.test.ts, test/your-day.test.ts and test/checkin.test.ts. */
import {
  addDays,
  blankP,
  diffDays,
  fmtClock,
  fmtDate,
  fmtLeft,
  HX_NEXT,
  isTime,
  LESSONS,
  minToClock,
  reachedOn,
  rhythm,
  ROUTINE_KEYS,
  streaks,
  sumDay,
  type RhythmStop,
} from './legacy/core.js';
import { lessonOpen } from './accounts';
import { lessonNo, lessonStop, lessonWalk, lmin, reviewPick } from './lessons';
import { todayMeasure } from './graduate';
import { changeDay, withDay } from './mutate';
import type { Checkin, DayKey, Days, Play, Settings } from './types';

/** the short status on the right of a stop */
export function stopStatus(s: RhythmStop, windMin: number): string {
  if (s.state === 'done') return s.k === 'evening' ? 'Saved' : 'Done';
  const open = s.state === 'now';
  const late = s.state === 'due';
  if (s.k === 'lesson') return open ? 'Open now' : late ? 'Still open' : 'From ' + minToClock(s.start);
  if (s.k === 'evening') return open ? 'Open now' : late ? 'Still open' : 'Around 6 PM';
  return open ? 'Open now' : late ? 'Still open' : 'From ' + minToClock(windMin);
}

/** the one line at the top of the wind-down */
export function windLine(st: Settings, leftToOff: number, p: Play | null | undefined): string {
  const off = fmtClock(st.screensOff);
  const left = leftToOff;
  if (left > 0 && left <= 600) return `Screens off at ${off} · in ${fmtLeft(left)}`;
  if (left <= 0 && left > -300) return `Your screens-off time (${off}) has passed.${p && p.po ? '' : ' Phone away?'}`;
  return `Your screens-off time is ${off}. Change it in Settings.`;
}
/** the few words at the top of the wind-down: when screens go off, and past that time, that it is not too late */
export function windWhen(st: Settings, leftToOff: number): string {
  const off = fmtClock(st.screensOff);
  if (leftToOff > 0 && leftToOff <= 600) return `Screens off at ${off} · in ${fmtLeft(leftToOff)}`;
  if (leftToOff <= 0 && leftToOff > -300) return `Past ${off}. Goodnight still counts.`;
  return `Screens off at ${off}`;
}

/* ---------- the evening check-in ---------- */
/* Three quick numbers since October 24, 2026: mood (md), urges (u) and stress (s), then Goodnight (sayGoodnight). Sleep,
   reached out and the one line wait under "More". Motivation (m), connection (c) and energy (e) were asked before: a day
   that holds them keeps them through an edit, and still shows them (rateKeys). */
export type RateKey = 'md' | 'u' | 'm' | 'c' | 'e' | 's';
export interface Rating {
  k: RateKey;
  /** the short name, on tiles, bars and charts */
  name: string;
  /** the question, at the top of its step */
  q: string;
  lo: string;
  hi: string;
}
/** every rating, in the order they show: the three asked now first, stress last, as before */
export const RATINGS: Rating[] = [
  { k: 'md', name: 'Mood', q: 'How did today feel?', lo: 'heavy', hi: 'good' },
  { k: 'u', name: 'Urges', q: 'How strong were the urges today?', lo: 'none', hi: 'strong' },
  { k: 'm', name: 'Motivation', q: 'How much motivation did you have today?', lo: 'none', hi: 'lots' },
  { k: 'c', name: 'Connection', q: 'How close did you feel to people today?', lo: 'distant', hi: 'close' },
  { k: 'e', name: 'Energy', q: 'How much energy did you have?', lo: 'drained', hi: 'full' },
  { k: 's', name: 'Stress', q: 'How much stress did you feel?', lo: 'calm', hi: 'high' },
];
/** the three the check-in asks, in its order */
export const ASKED: RateKey[] = ['md', 'u', 's'];
const OLD: RateKey[] = ['m', 'c', 'e'];
const ORDER: RateKey[] = RATINGS.map((r) => r.k);
export const ratingOf = (k: RateKey) => RATINGS.find((r) => r.k === k)!;
const rated = (c: Partial<Record<RateKey, number | null>> | null | undefined, k: RateKey) => !!c && typeof c[k] === 'number';
/** the ratings to show for one check-in: the three asked now, with any older ones it holds. A day saved before October 24,
    2026 (older ones and no mood or urges) shows its own four, as it always did. */
export function rateKeys(c: Partial<Record<RateKey, number | null>> | null | undefined): RateKey[] {
  const old = OLD.filter((k) => rated(c, k));
  if (old.length && !rated(c, 'md') && !rated(c, 'u')) return ['m', 'c', 'e', 's'];
  return ORDER.filter((k) => ASKED.indexOf(k) >= 0 || old.indexOf(k) >= 0);
}
/** the ratings to show across a log (the week's averages, the charts): each one the log holds, in order; stress always. A log
    with no ratings yet shows the three asked now. */
export function logRateKeys(days: Days): RateKey[] {
  const has = new Set<RateKey>();
  for (const k of Object.keys(days)) {
    const c = days[k]?.checkin;
    if (c) for (const r of ORDER) if (rated(c, r)) has.add(r);
  }
  if (!ORDER.some((r) => r !== 's' && has.has(r))) return ASKED.slice();
  return ORDER.filter((r) => r === 's' || has.has(r));
}
/** the mood of one check-in, for the rules that ask how a day felt: mood, or motivation on a day saved before mood was asked */
export const moodOf = (c: Partial<Checkin> | null | undefined): number | null =>
  c && typeof c.md === 'number' ? c.md : c && typeof c.m === 'number' ? c.m : null;

export interface CheckinForm {
  /** mood and urges (a draft or a test from before they were asked has none) */
  md?: number | null;
  u?: number | null;
  /* asked before October 24, 2026: kept as they were, so editing an older day loses nothing */
  m: number | null;
  c: number | null;
  e: number | null;
  s: number | null;
  /** hours slept the night before, optional (a draft from before sleep was asked has none: the saved hours stay) */
  h?: number | null;
  ro: 'Y' | 'N' | null;
  n: string;
}
/** the form, from what is saved (reached out is already Yes when today's log says so) */
export function checkinFormOf(days: Days, key: DayKey): CheckinForm {
  const d = days[key];
  const saved = d && d.checkin;
  const ro = reachedOn(d) ? 'Y' : null;
  return saved
    ? { md: saved.md ?? null, u: saved.u ?? null, m: saved.m, c: saved.c, e: saved.e, s: saved.s, h: saved.h, ro: saved.ro || ro, n: saved.n || '' }
    : { md: null, u: null, m: null, c: null, e: null, s: null, h: null, ro, n: '' };
}
/** something in the form is answered, so there is a check-in to save */
export function checkinAnswered(f: CheckinForm): boolean {
  return [f.md, f.u, f.m, f.c, f.e, f.s, f.h, f.ro].some((v) => v != null) || !!(f.n || '').trim();
}
/** hours of sleep as the check-in keeps them: half hours from 0 to 14 */
export const sleepHours = (h: number) => Math.min(14, Math.max(0, Math.round(h * 2) / 2));
const blankCheckin = (): Checkin => ({ m: null, c: null, e: null, s: null, h: null, so: null, ro: null, n: '', done: false, at: 0 });
/** saving keeps screens-off (from Good night), and sleep unless the form answers it. Mood and urges are kept only when
    answered (normCheckin), so a day saved without them reads as before. */
export function saveCheckin(days: Days, key: DayKey, f: CheckinForm, now = Date.now()): Days {
  const day = changeDay(
    days[key],
    key,
    (d) => {
      const o = d.checkin || ({} as Partial<Checkin>);
      const h = f.h === undefined ? (o.h == null ? null : o.h) : f.h == null ? null : sleepHours(f.h);
      const c: Checkin = { m: f.m, c: f.c, e: f.e, s: f.s, h, so: o.so || null, ro: f.ro, n: (f.n || '').trim(), done: true, at: now };
      if (f.md != null) c.md = f.md;
      if (f.u != null) c.u = f.u;
      d.checkin = c;
    },
    now,
  );
  return withDay(days, key, day);
}
/** Goodnight, at the end of tonight's check-in: one tap saves the check-in (when anything in it is answered) and puts the
    phone away at `at` (phoneAway: screens off on time too, when it comes before the screens-off time). Both stops of the
    evening are then done. */
export function sayGoodnight(days: Days, tk: DayKey, f: CheckinForm | null, at: string, now = Date.now(), st?: Settings | null): Days {
  const saved = f && checkinAnswered(f) ? saveCheckin(days, tk, f, now) : days;
  return phoneAway(saved, tk, at, now, st);
}
/** the word after saving the check-in */
export function checkinSaveText(days: Days, st: Settings, key: DayKey, tk: DayKey): string {
  const s = sumDay(days[key]);
  const runs = !!st.day1 && key === tk && st.cleanMode !== 'step';
  if (s.slipped) return 'Saved. A slip is data, not a reset.';
  if (!runs || key < (st.day1 as string)) return 'Saved.';
  /* the same count Today shows */
  if (st.cleanMode === 'gentle') {
    const m = todayMeasure(days, st, tk);
    return m && m.n > 0 ? `Saved. ${m.n} ${m.of}.` : 'Saved.';
  }
  const cur = streaks(days, st, tk).cur;
  return cur > 0 ? `Saved. ${cur} ${cur === 1 ? 'day' : 'days in a row'} with no slip.` : 'Saved.';
}
/** the summary line under a saved check-in */
export function checkinLine(days: Days, key: DayKey, c: Checkin): string {
  const d = days[key];
  return [
    c.h != null ? `Sleep ${c.h.toFixed(1)} h` : '',
    c.so ? `Screens off ${c.so === 'Y' ? 'on time' : 'late'}` : '',
    c.ro || reachedOn(d) ? `Reached out: ${c.ro === 'Y' || reachedOn(d) ? 'yes' : 'no'}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

/* ---------- a night, changed on its day's page ---------- */
/** screens off on time that night (Yes or No; the same answer again clears it) */
export function setScreensOff(days: Days, prev: DayKey, v: 'Y' | 'N', now = Date.now()): Days {
  const day = changeDay(
    days[prev],
    prev,
    (d) => {
      const c = d.checkin || (d.checkin = blankCheckin());
      c.so = c.so === v ? null : v;
    },
    now,
  );
  return withDay(days, prev, day);
}
/** hours slept, in half hours from 0 to 14, starting from 7 */
export function stepSleep(days: Days, tk: DayKey, dd: number, now = Date.now()): Days {
  const day = changeDay(
    days[tk],
    tk,
    (d) => {
      const c = d.checkin || (d.checkin = blankCheckin());
      c.h = Math.min(14, Math.max(0, Math.round(((c.h == null ? 7 : c.h) + dd) * 2) / 2));
    },
    now,
  );
  return withDay(days, tk, day);
}
/* ---------- lessons first ---------- */
/** the day's stops (legacy rhythm), with today's lesson always the open one until it is done (docs/plan.md, "Lessons
    first", C1): the lesson is Next up all day, and a check-in or wind-down that has started meanwhile still says "Open
    now". The legacy rhythm itself stays as it was (the golden tests read it). */
export function dayRhythm(days: Days, st: Settings, tk: DayKey, nowMs: number): ReturnType<typeof rhythm> {
  const r = rhythm(days, st, tk, nowMs);
  const ls = r.stops.find((x) => x.k === 'lesson');
  if (!ls || ls.done || r.cur === 'lesson') return r;
  const stops = r.stops.map((x) =>
    x.k === 'lesson'
      ? { ...x, state: x.started ? ('now' as const) : ('next' as const) }
      : x.k === r.cur && x.state === 'next'
        ? { ...x, state: 'later' as const }
        : x,
  );
  return { ...r, stops, cur: 'lesson' };
}

/* ---------- the stops of Your day, as tiles ---------- */
/* Each stop has the color of its full-screen moment (sky). The open one (cur) shows as a tile with a few words and its
   button; the others are one line each, a done one saying what was done. Every stop opens with one tap, at any time. */
export type StopGo = 'lesson' | 'checkin' | 'wind';
export interface StopTile {
  k: string;
  state: RhythmStop['state'];
  done: boolean;
  /** the open one, shown as a tile */
  cur: boolean;
  sky: 'sun' | 'sky' | 'violet' | 'night';
  ic: string;
  title: string;
  /** the one line of a row: what is waiting, or what was done */
  line: string;
  /** the status on the right of a row ("Around 6 PM"); empty when done */
  right: string;
  /* the tile */
  eyebrow: string;
  head: string;
  body: string;
  chips: string[];
  btn: string;
  go: StopGo;
  /** the lesson to open */
  id?: string;
}
const NAME: Record<string, string> = { lesson: 'Lesson', evening: 'Evening', night: 'Night' };
const low = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
export function stopTiles(days: Days, st: Settings, tk: DayKey, nowMs: number): { tiles: StopTile[]; cur: string | null; done: number } {
  const r = dayRhythm(days, st, tk, nowMs);
  const p = days[tk]?.p;
  const ls = lessonStop(days, st, tk);
  const tiles = r.stops.map((s): StopTile => {
    const status = stopStatus(s, r.windMin);
    const eyebrow =
      s.state === 'now'
        ? NAME[s.k] + ' · open now'
        : s.state === 'due'
          ? NAME[s.k] + ' · still open'
          : s.state === 'done'
            ? NAME[s.k] + ' · done'
            : 'Up next · ' + low(status);
    const base = { k: s.k, state: s.state, done: !!s.done, cur: s.k === r.cur, right: s.done ? '' : status, eyebrow };
    const pts = (k: string) => '+' + HX_NEXT[k].pts + ' points';
    if (s.k === 'lesson') {
      const L = ls.L;
      const tile = { ...base, sky: 'sky' as const, ic: 'book', title: 'Lesson', go: 'lesson' as const, id: L.id };
      if (ls.kind === 'read')
        return { ...tile, line: 'Read: ' + L.title, head: L.title, body: L.key, chips: [lmin(L)], btn: 'Open it again', eyebrow: 'Lesson · done' };
      if (ls.kind === 'next')
        return {
          ...tile,
          line: L.title + ' · ' + lmin(L),
          eyebrow: 'Lesson ' + ls.n + ' of ' + ls.total + (s.state === 'now' ? ' · open now' : s.state === 'due' ? ' · still open' : ' · ' + low(status)),
          head: L.title,
          body: L.tag,
          chips: [lmin(L), pts('lesson')],
          btn: 'Start',
        };
      return {
        ...tile,
        line: 'Read again: ' + L.title,
        eyebrow: 'Read again' + (s.state === 'next' || s.state === 'later' ? ' · ' + low(status) : ''),
        head: L.title,
        body: 'You have finished every lesson. A quick re-read keeps one fresh.',
        chips: [lmin(L), '+5 points'],
        btn: 'Read it again',
      };
    }
    if (s.k === 'evening') {
      const c = days[tk]?.checkin;
      /* the first number it holds (mood, or motivation on an older day), the urges, and stress */
      const first = c && c.done ? rateKeys(c).find((k) => k !== 's' && k !== 'u' && c[k] != null) : undefined;
      const said =
        c && c.done
          ? [first ? ratingOf(first).name + ' ' + c[first] : '', c.u != null ? 'Urges ' + c.u : '', c.s != null ? 'Stress ' + c.s : '']
              .filter(Boolean)
              .join(' · ')
          : '';
      return {
        ...base,
        sky: 'violet',
        ic: 'pencil',
        title: 'Check-in',
        line: s.done ? said || 'Saved' : 'Three quick numbers, then good night',
        head: 'How was today?',
        body: 'Three quick numbers, then good night. The day is logged.',
        chips: [HX_NEXT.evening.s || '', pts('evening')],
        btn: 'Check in',
        go: 'checkin',
      };
    }
    return {
      ...base,
      sky: 'night',
      ic: 'moon',
      title: 'Wind-down',
      line: s.done ? (p && p.po ? 'Phone away at ' + fmtClock(p.po) : 'Wound down') : 'Screens off at ' + fmtClock(st.screensOff),
      head: 'Time to wind down',
      body: windLine(st, r.leftToOff, p),
      chips: [HX_NEXT.night.s || '', pts('night')],
      btn: 'Start the wind-down',
      go: 'wind',
    };
  });
  return { tiles, cur: r.cur, done: tiles.filter((t) => t.done).length };
}

/* ---------- the wind-down ---------- */
export function windToggle(days: Days, st: Settings, tk: DayKey, i: number, now = Date.now()): Days {
  const n = st.wind.length;
  return withDay(
    days,
    tk,
    changeDay(
      days[tk],
      tk,
      (d) => {
        const p = d.p || blankP();
        const k = p.w.indexOf(i);
        if (k >= 0) p.w.splice(k, 1);
        else p.w.push(i);
        p.w = p.w.filter((x) => x < n);
        /* a Goodnight that counted stays counted, however the list is ticked afterwards */
        p.wd = p.w.length >= n || (!!p.po && windCounts(st, p.po));
        d.p = p;
      },
      now,
    ),
  );
}
/** how long before the screens-off time Good night still counts as screens off on time: a nap in the afternoon does not */
export const OFF_EARLY_MIN = 6 * 60;
/** Good night at `at` (HH:MM) comes before the screens-off time, and within OFF_EARLY_MIN of it. Read on the log day's
    clock, so with screens off at 12:30 AM, 11:50 PM is on time and 1 AM is not. */
export function offOnTime(st: Pick<Settings, 'screensOff' | 'rollover'>, at: string): boolean {
  const roll = (st.rollover ?? 4) * 60;
  const rel = (t: string) => (((+t.slice(0, 2) * 60 + +t.slice(3, 5) - roll) % 1440) + 1440) % 1440;
  if (!isTime(at) || !isTime(st.screensOff)) return false;
  const left = rel(st.screensOff) - rel(at);
  return left >= 0 && left <= OFF_EARLY_MIN;
}
/** Good night at `at` counts as the wind-down: any time from OFF_EARLY_MIN before the screens-off time until the new day, on time or late, since
    the phone going down late is when it matters most. A nap in the afternoon does not. */
export function windCounts(st: Pick<Settings, 'screensOff' | 'rollover'>, at: string): boolean {
  const roll = (st.rollover ?? 4) * 60;
  const rel = (t: string) => (((+t.slice(0, 2) * 60 + +t.slice(3, 5) - roll) % 1440) + 1440) % 1440;
  if (!isTime(at) || !isTime(st.screensOff)) return false;
  return rel(st.screensOff) - rel(at) <= OFF_EARLY_MIN;
}
/** too early for Goodnight at `at`: the time it opens, or null once it is open. Read against the person's own screens-off time, so a person who sleeps by day
    has their own evening. */
export function goodnightOpens(st: Pick<Settings, 'screensOff' | 'rollover'>, at: string): string | null {
  if (!isTime(st.screensOff) || windCounts(st, at)) return null;
  return minToClock((+st.screensOff.slice(0, 2) * 60 + +st.screensOff.slice(3, 5) - OFF_EARLY_MIN + 1440) % 1440);
}
/** how many nights the phone has gone down, ever. It only grows: a night without it takes nothing away, and nothing says "in a row". */
export function phoneNights(days: Days): number {
  return Object.values(days).filter((d) => !!d?.p?.po).length;
}
/** the words once the flame is asleep: the phone-away time and the nights so far, then the person's own sentence about who they are becoming. After a
    slip today, the first thing is that they are still here. */
export function bedWords(days: Days, st: Pick<Settings, 'becoming'> | null, tk: DayKey, at: string): { line: string; own: string } {
  const n = phoneNights(days);
  const when = at ? `Down at ${fmtClock(at)}. ` : '';
  /* SOS "Go to bed" after the new day has started: the bed is still the right move, and it is not a night on the count (phoneAway) */
  const line = days[tk]?.p?.po ? when + (n <= 1 ? 'That is your first night.' : `That is ${n} nights.`) : when.trim();
  const own = String(st?.becoming || '').trim();
  if (sumDay(days[tk]).slipped) return { line, own: 'You came back to this tonight. That is the part that lasts.' };
  return { line, own: own || 'Rest well. Tomorrow is a fresh day.' };
}
/** Good night: the phone goes away at `at` (p.po). With the settings, it is also screens off on time that night when it
    comes before the screens-off time (offOnTime), so the "Screens off on time" points, quest and Sunday goal count it, and it
    is the wind-down that night (windCounts), so the wind-down's points, quest, badges and Sunday goal count it too.
    Nothing asks the next morning whether it stayed away, and a late Good night never writes "late". Too early in the day (goodnightOpens) it does nothing:
    no phone away, no points, no night, and the stop stays open. */
export function phoneAway(days: Days, tk: DayKey, at: string, now = Date.now(), st?: Settings | null): Days {
  if (st && goodnightOpens(st, at)) return days;
  return withDay(
    days,
    tk,
    changeDay(
      days[tk],
      tk,
      (d) => {
        const p = d.p || blankP();
        p.po = at;
        if (st && windCounts(st, at)) p.wd = true;
        d.p = p;
        if (st && offOnTime(st, at)) (d.checkin || (d.checkin = blankCheckin())).so = 'Y';
      },
      now,
    ),
  );
}

/* ---------- one day's routine ---------- */
/** switch a part of today on or off. A choice that matches the usual routine is not kept. */
export function routineDay(days: Days, st: Settings, tk: DayKey, k: string, want: boolean, now = Date.now()): Days {
  if (ROUTINE_KEYS.indexOf(k) < 0) return days;
  const usual = !!st.routine[k];
  return withDay(
    days,
    tk,
    changeDay(
      days[tk],
      tk,
      (d) => {
        const p = d.p || blankP();
        const ov = { ...p.ov };
        if (want === usual) delete ov[k];
        else ov[k] = want;
        p.ov = ov;
        d.p = p;
      },
      now,
    ),
  );
}
/** how many parts of today differ from the usual routine */
export function routineChanged(st: Settings, p: Play | null | undefined): number {
  const ov = (p && p.ov) || {};
  return ROUTINE_KEYS.filter((k) => typeof ov[k] === 'boolean' && ov[k] !== !!st.routine[k]).length;
}

/* ---------- Next up, on the flame card ---------- */
export interface NextUp {
  n: number;
  done: number;
  k?: string;
  ic?: string;
  t?: string;
  s?: string;
  pts?: number;
  /** 'lesson' opens that lesson; 'next-go' opens that stop in Your day */
  act?: 'lesson' | 'next-go';
  v?: string;
  when?: string;
  pips?: ('on' | 'now' | '')[];
}
/** the part of the day that is open now, or the next one to open (legacy nextUp), today's lesson first until it is done
    (dayRhythm). Without an account (`account` false),
    a lesson that waits behind one is never offered: Next up gives a re-read of a finished lesson instead, so Today never
    turns into a sign-up page (and never on the morning after a slip). */
export function nextUp(days: Days, st: Settings, tk: DayKey, nowMs: number, account = true): NextUp {
  const r = dayRhythm(days, st, tk, nowMs);
  const n = r.stops.length;
  const done = r.stops.filter((s) => s.done).length;
  const s = r.stops.find((x) => x.k === r.cur);
  if (!s) return { n, done };
  const m = HX_NEXT[s.k];
  const o: NextUp = {
    k: s.k,
    n,
    done,
    ic: m.ic,
    t: m.t,
    s: m.s,
    pts: m.pts,
    act: 'next-go',
    v: s.k,
    when: s.state === 'next' ? stopStatus(s, r.windMin) : '',
    pips: r.stops.map((x) => (x.done ? 'on' : x.k === s.k ? 'now' : '')),
  };
  if (s.k === 'lesson') {
    const w = lessonWalk(days, st);
    const nl = w.next;
    if (nl && lessonOpen(nl, w.done, account)) {
      o.t = 'Lesson ' + lessonNo(nl, st) + ': ' + nl.title;
      o.s = lmin(nl);
      o.act = 'lesson';
      o.v = nl.id;
    } else {
      /* a re-read is one behind Up next on the path (one read early waits for the path to reach it) */
      const read = LESSONS.filter((L) => w.walked.has(L.id));
      const R = account ? reviewPick(tk, st) : read[Math.abs(diffDays(tk, '2026-01-01')) % read.length];
      o.t = 'Read again: ' + R.title;
      o.s = 'A quick re-read';
      o.pts = 5;
      o.act = 'lesson';
      o.v = R.id;
    }
  }
  return o;
}

/* ---------- the open stop, as Today shows it ---------- */
/** the day's open stop (cur) and what opening it does, the same in the moment card and in Your day, where it grows into a
    bigger card in its place (while it is not done). Without an account (`account` false), a lesson that waits behind one is never offered: it
    becomes a re-read (nextUp), so Today never turns into a sign-up page. null when there is no open stop. */
export function openTile(days: Days, st: Settings, tk: DayKey, nowMs: number, account = true): StopTile | null {
  const cur = stopTiles(days, st, tk, nowMs).tiles.find((x) => x.cur);
  if (!cur) return null;
  const o = cur.go === 'lesson' ? nextUp(days, st, tk, nowMs, account) : null;
  const swap = o && o.act === 'lesson' && o.v && o.v !== cur.id ? o : null;
  if (!swap) return cur;
  return {
    ...cur,
    head: (swap.t || '').replace(/^(Lesson \d+|Read again): /, ''),
    body: 'A quick re-read keeps one fresh.',
    btn: 'Read it again',
    id: swap.v,
  };
}
