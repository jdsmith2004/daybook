/* "Your day" on Today: last night (asked the next morning), the lesson, the evening check-in and the wind-down, and switching
   parts of one day on or off. Ported from the legacy pathHtml, stopStatus, windLine, doSaveCheckin and the Today actions
   (night-so, night-sleep, morning-done, wind, rt-day, save-checkin). Checked by test/day.test.ts. */
import {
  blankP,
  fmtClock,
  fmtDate,
  fmtLeft,
  HX_NEXT,
  minToClock,
  morningInfo,
  reachedOn,
  rhythm,
  ROUTINE_KEYS,
  streaks,
  sumDay,
  type RhythmStop,
} from './legacy/core.js';
import { firstUndone, lessonNo, lessonsDone, lessonStop, lmin, reviewPick } from './lessons';
import { todayMeasure } from './graduate';
import { changeDay, withDay } from './mutate';
import type { Checkin, DayKey, Days, Play, Settings } from './types';

/** the short status on the right of a stop */
export function stopStatus(s: RhythmStop, windMin: number): string {
  if (s.state === 'done') return s.k === 'evening' ? 'Saved' : 'Done';
  const open = s.state === 'now';
  const late = s.state === 'due';
  if (s.k === 'morning') return open ? 'Answer now' : late ? 'Still open' : 'Tomorrow morning';
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

/** the note under "Your day" */
export function pathNote(days: Days, st: Settings, tk: DayKey, _stops?: RhythmStop[]): string {
  const mi = morningInfo(days, st, tk);
  const day = days[tk];
  const mOn = routineIsOn(st, day && day.p, 'morning');
  /* said once, on the first day; after that the Last night stop explains itself */
  return !mi.applies && mOn
    ? 'Sleep and screens-off are asked the next morning, because that is when you know. Tomorrow a stop called Last night shows up here.'
    : '';
}
const routineIsOn = (st: Settings, p: Play | null | undefined, k: string) => {
  const o = p && p.ov && p.ov[k];
  if (typeof o === 'boolean') return o;
  return !!(st && st.routine && st.routine[k]);
};

/* ---------- the evening check-in ---------- */
export interface CheckinForm {
  m: number | null;
  c: number | null;
  e: number | null;
  s: number | null;
  ro: 'Y' | 'N' | null;
  n: string;
}
/** the form, from what is saved (reached out is already Yes when today's log says so) */
export function checkinFormOf(days: Days, key: DayKey): CheckinForm {
  const d = days[key];
  const saved = d && d.checkin;
  const ro = reachedOn(d) ? 'Y' : null;
  return saved ? { m: saved.m, c: saved.c, e: saved.e, s: saved.s, ro: saved.ro || ro, n: saved.n || '' } : { m: null, c: null, e: null, s: null, ro, n: '' };
}
const blankCheckin = (): Checkin => ({ m: null, c: null, e: null, s: null, h: null, so: null, ro: null, n: '', done: false, at: 0 });
/** saving keeps sleep and screens-off, which are answered the next morning */
export function saveCheckin(days: Days, key: DayKey, f: CheckinForm, now = Date.now()): Days {
  const day = changeDay(
    days[key],
    key,
    (d) => {
      const o = d.checkin || ({} as Partial<Checkin>);
      d.checkin = { m: f.m, c: f.c, e: f.e, s: f.s, h: o.h == null ? null : o.h, so: o.so || null, ro: f.ro, n: (f.n || '').trim(), done: true, at: now };
    },
    now,
  );
  return withDay(days, key, day);
}
/** the word after saving the check-in */
export function checkinSaveText(days: Days, st: Settings, key: DayKey, tk: DayKey): string {
  const sk = streaks(days, st, tk);
  const s = sumDay(days[key]);
  const runs = !!st.day1 && key === tk && st.cleanMode !== 'step';
  if (s.slipped)
    return (
      'Saved. A slip is data, not a reset.' +
      (runs && sk.open && sk.open.k === tk ? ' Your run can keep going. Finish the Rekindle quest by tomorrow night.' : '')
    );
  /* what holds, not a run that can drop to zero: the same measure Today shows */
  const m = runs && key >= (st.day1 as string) ? todayMeasure(days, st, tk) : null;
  return m && m.n > 0 ? `Saved. ${m.n} ${m.of}.` : 'Saved.';
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

/* ---------- last night, asked the next morning ---------- */
/** screens off on time last night (Yes or No; the same answer again clears it) */
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
/** the sleep slider: set last night's hours outright, in half hours from 0 to 14 */
export function setSleep(days: Days, tk: DayKey, h: number, now = Date.now()): Days {
  const day = changeDay(
    days[tk],
    tk,
    (d) => {
      const c = d.checkin || (d.checkin = blankCheckin());
      c.h = Math.min(14, Math.max(0, Math.round(h * 2) / 2));
    },
    now,
  );
  return withDay(days, tk, day);
}
/** the morning questions answered (at least one must be) */
export function morningDone(days: Days, tk: DayKey, now = Date.now()): Days {
  return withDay(
    days,
    tk,
    changeDay(
      days[tk],
      tk,
      (d) => {
        const p = d.p || blankP();
        p.m = true;
        d.p = p;
      },
      now,
    ),
  );
}

/* ---------- the morning, as a full-screen moment (app/morning.tsx) ---------- */
/* It asks what the app does not know. When the phone was put away last night, the app knows when screens went off, so it
   asks whether the phone stayed away (the promise made at "Putting my phone away"). When it was not, it asks about
   screens. Either answer is kept as last night's screens-off (checkin.so), as before. */
export interface MorningAsk {
  /** away: the phone was put away last night. screens: it was not. */
  kind: 'away' | 'screens';
  /** "Last night · Saturday" */
  eyebrow: string;
  q: string;
  sub: string;
  yes: { t: string; s: string };
  no: { t: string; s: string };
  /** when the phone went away (HH:MM), or the screens-off time */
  from: string;
}
export function morningAsk(days: Days, st: Settings, tk: DayKey): MorningAsk {
  const mi = morningInfo(days, st, tk);
  const eyebrow = 'Last night · ' + fmtDate(mi.prev, { weekday: 'long' });
  const no = { t: '', s: 'Good to know. Tonight is a new try.' };
  if (mi.po)
    return {
      kind: 'away',
      eyebrow,
      q: 'Did your phone stay away?',
      sub: 'You put it away at ' + fmtClock(mi.po) + '.',
      yes: { t: 'Yes, it stayed away', s: 'All night' },
      no: { ...no, t: 'I picked it back up' },
      from: mi.po,
    };
  return {
    kind: 'screens',
    eyebrow,
    q: 'Did screens go off around ' + fmtClock(st.screensOff) + '?',
    sub: 'And stay off for the night. Honest beats perfect.',
    yes: { t: 'Yes', s: 'Screens off for the night' },
    no: { ...no, t: 'Not this time' },
    from: st.screensOff,
  };
}
const hoursText = (h: number) => (h % 1 ? h.toFixed(1) : String(h));
/** last night in a few words, as answered: ["Phone stayed away", "Slept 9 h"] */
export function morningSaid(days: Days, st: Settings, tk: DayKey): string[] {
  const mi = morningInfo(days, st, tk);
  const out: string[] = [];
  if (mi.so) out.push(mi.po ? (mi.so === 'Y' ? 'Phone stayed away' : 'Picked the phone back up') : mi.so === 'Y' ? 'Screens off on time' : 'Screens on late');
  if (mi.h != null) out.push('Slept ' + hoursText(mi.h) + ' h');
  return out;
}

/* ---------- the stops of Your day, as tiles ---------- */
/* Each stop has the color of its full-screen moment (sky). The open one (cur) shows as a tile with a few words and its
   button; the others are one line each, a done one saying what was done. Every stop opens with one tap, at any time. */
export type StopGo = 'morning' | 'lesson' | 'checkin' | 'wind';
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
const NAME: Record<string, string> = { morning: 'Morning', lesson: 'Lesson', evening: 'Evening', night: 'Night' };
const low = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
export function stopTiles(days: Days, st: Settings, tk: DayKey, nowMs: number): { tiles: StopTile[]; cur: string | null; done: number } {
  const r = rhythm(days, st, tk, nowMs);
  const p = days[tk]?.p;
  const ls = lessonStop(days, st, tk);
  const lessonOpen = r.stops.some((s) => s.k === 'lesson' && !s.done);
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
    if (s.k === 'morning') {
      const said = morningSaid(days, st, tk);
      return {
        ...base,
        sky: 'sun',
        ic: 'sunrise',
        title: 'Last night',
        line: s.done ? said.join(' · ') || 'Answered' : 'Two quick questions',
        head: new Date(nowMs).getHours() < 12 ? 'Good morning' : 'About last night',
        body: 'Two quick questions about last night' + (lessonOpen ? ', then today’s lesson.' : '.'),
        chips: [HX_NEXT.morning.s || '', pts('morning')],
        btn: 'Start',
        go: 'morning',
      };
    }
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
      const said = c && c.done ? [c.m != null ? 'Motivation ' + c.m : '', c.s != null ? 'Stress ' + c.s : ''].filter(Boolean).join(' · ') : '';
      return {
        ...base,
        sky: 'violet',
        ic: 'pencil',
        title: 'Check-in',
        line: s.done ? said || 'Saved' : 'Four numbers about today',
        head: 'How was today?',
        body: 'Four honest numbers and one line. Then the day is logged.',
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
        p.wd = p.w.length >= n;
        d.p = p;
      },
      now,
    ),
  );
}
export function phoneAway(days: Days, tk: DayKey, at: string, now = Date.now()): Days {
  return withDay(
    days,
    tk,
    changeDay(
      days[tk],
      tk,
      (d) => {
        const p = d.p || blankP();
        p.po = at;
        d.p = p;
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
/** the part of the day that is open now, or the next one to open (legacy nextUp) */
export function nextUp(days: Days, st: Settings, tk: DayKey, nowMs: number): NextUp {
  const r = rhythm(days, st, tk, nowMs);
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
    const nl = firstUndone(lessonsDone(days));
    if (nl) {
      o.t = 'Lesson ' + lessonNo(nl) + ': ' + nl.title;
      o.s = lmin(nl);
      o.act = 'lesson';
      o.v = nl.id;
    } else {
      const R = reviewPick(tk);
      o.t = 'Read again: ' + R.title;
      o.s = 'A quick re-read';
      o.pts = 5;
      o.act = 'lesson';
      o.v = R.id;
    }
  }
  return o;
}
