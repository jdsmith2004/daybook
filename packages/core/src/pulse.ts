/* Opt-in counts (the owner, October 22, 2026): how Daybook learns whether it helps, without ever knowing who anyone is.

   - Off until the person says yes. While they have not answered, counts are kept on this device only; "No" deletes
     them, and with "No" nothing is counted at all.
   - Once a day, the counts of the days already over are sent: a short list of fixed names and small numbers
     ("sos: 2", "back_1: 1", "act_7_13: 1"). Never a word the person wrote, a time, a trigger, an id or the log.
   - The server adds them to totals per day and keeps nothing else (services/api/src/pulse.ts), so one person's counts
     cannot be told apart from anyone else's.

   What the counts answer:
   - Do people stay: one "active" count for each day the app was opened, in a band of days since it was first opened.
   - Where setup loses people: the furthest setup page reached, and setup finished (kept from the first page and sent
     once the person says yes, so someone who closed setup and came back later still counts).
   - Which features are used: SOS, each tool, Talk it through, lessons, the check-in, the sunrise check, the morning
     questions, the Rekindle steps.
   - Do people come back after a slip: the next time the app is opened on a later day, how soon, as a band.

   PULSE_KEYS is the whole list; anything else is dropped on the device and refused by the server (pulseClean). The
   privacy page lists the same names. Pure: the app keeps the state on the device (never synced, never in a backup). */
import { addDays, TOOLS } from './legacy/core.js';
import { OB_PAGES } from './setup';
import type { DayKey, Days } from './types';

/* ---------- the list ---------- */
/** days since Daybook was first opened on this device, in bands */
export const PULSE_ACTIVE = ['act_0', 'act_1', 'act_2_6', 'act_7_13', 'act_14_29', 'act_30'] as const;
/** how soon the app was opened again after a slip */
export const PULSE_BACK = ['back_1', 'back_2_3', 'back_4_7', 'back_8'] as const;
/** what was used, by name */
export const PULSE_USE = [
  'sos',
  'talk_done',
  'lesson_done',
  'checkin',
  'sunrise',
  'morning',
  'rk_small',
  'rk_phone',
  'urge_logged',
  'slip_logged',
  'feedback',
] as const;
const toolKeys = () => (TOOLS as { id: string }[]).map((t) => 'tool_' + t.id);
const setupKeys = () => OB_PAGES.map((p) => 'setup_' + p.id).concat('setup_done');
let all: Set<string> | null = null;
/** every name a count may have */
export function pulseKeys(): Set<string> {
  if (!all) all = new Set<string>([...PULSE_ACTIVE, ...PULSE_BACK, ...PULSE_USE, ...toolKeys(), ...setupKeys()]);
  return all;
}
/** what a count means, for the privacy page and "See exactly what is sent" */
export function pulseMeaning(k: string): string {
  if (k.startsWith('act_')) {
    const b = k.slice(4).split('_');
    return (
      'Opened Daybook, ' +
      (b.length === 1 ? (b[0] === '30' ? '30 or more days' : b[0] + (b[0] === '1' ? ' day' : ' days')) : b[0] + ' to ' + b[1] + ' days') +
      ' after first opening it'
    );
  }
  if (k.startsWith('back_')) {
    const b = k.slice(5).split('_');
    return 'Came back ' + (b.length > 1 ? b[0] + ' to ' + b[1] + ' days' : b[0] === '8' ? '8 or more days' : 'the next day') + ' after a slip';
  }
  if (k.startsWith('tool_')) return 'Used the ' + k.slice(5) + ' tool';
  if (k === 'setup_done') return 'Finished setup';
  if (k.startsWith('setup_')) return 'Reached the setup page "' + k.slice(6) + '"';
  const w: Record<string, string> = {
    sos: 'Opened SOS',
    talk_done: 'Finished Talk it through',
    lesson_done: 'Finished a lesson',
    checkin: 'Saved a check-in',
    sunrise: 'Finished the sunrise check',
    morning: 'Answered the morning questions',
    rk_small: 'Did a Rekindle small thing',
    rk_phone: 'Put the phone away for a Rekindle night',
    urge_logged: 'Logged an urge',
    slip_logged: 'Logged a slip',
    feedback: 'Sent feedback',
  };
  return w[k] || k;
}

/* ---------- on the device ---------- */
export type PulseCounts = Record<string, number>;
export interface PulseState {
  /** null: not answered yet (counted here, never sent); true: sending; false: off, nothing counted */
  on: boolean | null;
  /** when the person was asked (the Today card shows once) */
  asked: DayKey | null;
  /** the day Daybook was first opened on this device */
  first: DayKey;
  /** the counts of each day not sent yet */
  days: Record<DayKey, PulseCounts>;
  /** setup: the furthest page reached (its index in OB_PAGES), whether it was finished, and how far was sent */
  setup: { max: number; done: boolean; sent: number; sentDone: boolean };
  /** the slip day whose comeback was counted last */
  back: DayKey | null;
  /** the last batch sent, so the person can see exactly what went */
  last: PulseBatch | null;
}
export interface PulseBatch {
  /** platform and app version, so a bug in one build shows */
  p: 'ios' | 'android' | 'web';
  v: string;
  days: { d: DayKey; c: PulseCounts }[];
}

/** a count of one day is never more than this (a stuck button cannot make a number mean anything) */
export const PULSE_MAX = 50;
/** at most this many days go in one batch (a phone away for a month sends the latest ones) */
export const PULSE_DAYS = 14;
/** counts not sent within this many days (no network, or the server off) are let go */
export const PULSE_KEEP = 30;

export const pulseNew = (today: DayKey): PulseState => ({
  on: null,
  asked: null,
  first: today,
  days: {},
  setup: { max: -1, done: false, sent: -1, sentDone: false },
  back: null,
  last: null,
});

/** a state read back from the device, made safe (anything odd becomes a fresh state) */
export function pulseNorm(x: unknown, today: DayKey): PulseState {
  const s = x as Partial<PulseState> | null;
  if (!s || typeof s !== 'object' || typeof s.first !== 'string') return pulseNew(today);
  const keys = pulseKeys();
  const days: Record<DayKey, PulseCounts> = {};
  for (const [d, c] of Object.entries(s.days || {})) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d < addDays(today, -PULSE_KEEP) || !c || typeof c !== 'object') continue;
    const out: PulseCounts = {};
    for (const [k, n] of Object.entries(c)) if (keys.has(k) && Number.isFinite(n) && n > 0) out[k] = Math.min(PULSE_MAX, Math.floor(n));
    if (Object.keys(out).length) days[d] = out;
  }
  const st = s.setup || ({} as PulseState['setup']);
  return {
    on: s.on === true ? true : s.on === false ? false : null,
    asked: typeof s.asked === 'string' ? s.asked : null,
    first: s.first,
    days: s.on === false ? {} : days,
    setup: {
      max: Number.isInteger(st.max) ? st.max : -1,
      done: st.done === true,
      sent: Number.isInteger(st.sent) ? st.sent : -1,
      sentDone: st.sentDone === true,
    },
    back: typeof s.back === 'string' ? s.back : null,
    last: s.last && Array.isArray(s.last.days) ? s.last : null,
  };
}

/** add to a count on a day. Nothing is counted while it is off, and a name that is not on the list is dropped. */
export function pulseAdd(s: PulseState, k: string, today: DayKey, n = 1): PulseState {
  if (s.on === false || !pulseKeys().has(k)) return s;
  const day = { ...(s.days[today] || {}) };
  day[k] = Math.min(PULSE_MAX, (day[k] || 0) + n);
  return { ...s, days: { ...s.days, [today]: day } };
}

/** the band of days since first opened */
export function pulseBand(first: DayKey, d: DayKey): (typeof PULSE_ACTIVE)[number] {
  const n = daysBetween(first, d);
  return n <= 0 ? 'act_0' : n === 1 ? 'act_1' : n <= 6 ? 'act_2_6' : n <= 13 ? 'act_7_13' : n <= 29 ? 'act_14_29' : 'act_30';
}
function daysBetween(a: DayKey, b: DayKey): number {
  const t = (k: DayKey) => Date.UTC(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10));
  return Math.round((t(b) - t(a)) / 86400000);
}

/** the app was opened today: the day's active count (once), and the comeback after the latest slip before today, once */
export function pulseOpened(s: PulseState, log: Days, today: DayKey): PulseState {
  if (s.on === false) return s;
  let out = s;
  const band = pulseBand(s.first, today);
  if (!(s.days[today] && s.days[today][band])) out = pulseAdd(out, band, today);
  let slip: DayKey | null = null;
  for (const k of Object.keys(log))
    if (k < today && k >= s.first && (log[k]?.events || []).some((e) => e.outcome === 'slipped') && (!slip || k > slip)) slip = k;
  if (slip && (!out.back || slip > out.back)) {
    /* the first day the app was open after the slip: today, unless an earlier day after it already counted as active */
    let came = today;
    for (let k = addDays(slip, 1); k < today; k = addDays(k, 1))
      if (PULSE_ACTIVE.some((a) => out.days[k]?.[a])) {
        came = k;
        break;
      }
    const n = daysBetween(slip, came);
    out = pulseAdd({ ...out, back: slip }, n <= 1 ? 'back_1' : n <= 3 ? 'back_2_3' : n <= 7 ? 'back_4_7' : 'back_8', came);
  }
  return out;
}

/** setup reached page i of OB_PAGES (kept even before the person answers, so setup is measured from the first page) */
export function pulseSetup(s: PulseState, i: number, done = false): PulseState {
  if (s.on === false) return s;
  const max = Math.max(s.setup.max, Math.min(i, OB_PAGES.length - 1));
  if (max === s.setup.max && (s.setup.done || !done)) return s;
  return { ...s, setup: { ...s.setup, max, done: s.setup.done || done } };
}

/** the person's answer. No deletes everything counted; yes starts sending from the days already over. */
export function pulseAnswer(s: PulseState, on: boolean, today: DayKey): PulseState {
  return on ? { ...s, on: true, asked: s.asked || today } : { ...pulseNew(s.first), on: false, asked: s.asked || today, first: s.first };
}

/** what to send now: the days that are over, and the setup pages reached since the last batch. Null when there is nothing,
    or while it is not on. */
export function pulseBatch(s: PulseState, today: DayKey, p: PulseBatch['p'], v: string): PulseBatch | null {
  if (s.on !== true) return null;
  const ds = Object.keys(s.days)
    .filter((d) => d < today)
    .sort()
    .slice(-PULSE_DAYS);
  const days = ds.map((d) => ({ d, c: { ...s.days[d] } }));
  /* setup: each page reached once (so the totals are a funnel: how many people reached each page), on the newest day
     that is over, so it is counted once */
  if (ds.length) {
    const c = days[days.length - 1].c;
    for (let i = s.setup.sent + 1; i <= s.setup.max; i++) c['setup_' + OB_PAGES[i].id] = 1;
    if (s.setup.done && !s.setup.sentDone) c.setup_done = 1;
  }
  return days.length ? { p, v, days } : null;
}

/** the batch went: those days are let go, setup is marked sent, and the batch is kept to show */
export function pulseSent(s: PulseState, b: PulseBatch): PulseState {
  const days = { ...s.days };
  for (const x of b.days) delete days[x.d];
  /* days older than any batch can carry are let go too */
  const sent = b.days.map((x) => x.d).sort();
  if (sent.length) for (const d of Object.keys(days)) if (d < sent[0]) delete days[d];
  const sentSetup = b.days.some((x) => Object.keys(x.c).some((k) => k.startsWith('setup_') && k !== 'setup_done'));
  const sentDone = b.days.some((x) => x.c.setup_done);
  return {
    ...s,
    days,
    setup: { ...s.setup, sent: sentSetup ? s.setup.max : s.setup.sent, sentDone: s.setup.sentDone || sentDone },
    last: b,
  };
}

/* ---------- on both ends ---------- */
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const VER = /^[0-9A-Za-z.+-]{1,24}$/;
/** a batch as the server accepts it: known names only, whole numbers 1 to PULSE_MAX, at most PULSE_DAYS days, each day
    within the last 45 days and not after tomorrow. Anything else in it is dropped; null when nothing is left. */
export function pulseClean(x: unknown, today: DayKey): PulseBatch | null {
  const b = x as Partial<PulseBatch> | null;
  if (!b || typeof b !== 'object' || !Array.isArray(b.days)) return null;
  const p = b.p === 'ios' || b.p === 'android' || b.p === 'web' ? b.p : null;
  if (!p) return null;
  const v = typeof b.v === 'string' && VER.test(b.v) ? b.v : '0';
  const keys = pulseKeys();
  const lo = addDays(today, -45);
  const hi = addDays(today, 1);
  const seen = new Set<string>();
  const days: PulseBatch['days'] = [];
  for (const row of b.days.slice(0, PULSE_DAYS)) {
    const d = row && typeof row.d === 'string' && DAY.test(row.d) ? row.d : null;
    if (!d || d < lo || d > hi || seen.has(d) || !row.c || typeof row.c !== 'object') continue;
    const c: PulseCounts = {};
    for (const [k, n] of Object.entries(row.c).slice(0, 120))
      if (keys.has(k) && typeof n === 'number' && Number.isInteger(n) && n >= 1) c[k] = Math.min(PULSE_MAX, n);
    if (!Object.keys(c).length) continue;
    seen.add(d);
    days.push({ d, c });
  }
  return days.length ? { p, v, days } : null;
}

/** the longest feedback, in characters */
export const FEEDBACK_LEN = 2000;
/** feedback as the server keeps it: the words, trimmed; a reply address only if it looks like one */
export function feedbackClean(x: unknown): { t: string; r: string | null; p: PulseBatch['p']; v: string } | null {
  const f = x as { t?: unknown; r?: unknown; p?: unknown; v?: unknown } | null;
  if (!f || typeof f !== 'object' || typeof f.t !== 'string') return null;
  const t = f.t.trim().slice(0, FEEDBACK_LEN);
  if (!t) return null;
  const r = typeof f.r === 'string' && /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(f.r.trim()) ? f.r.trim() : null;
  const p = f.p === 'ios' || f.p === 'android' || f.p === 'web' ? f.p : 'web';
  const v = typeof f.v === 'string' && VER.test(f.v) ? f.v : '0';
  return { t, r, p, v };
}

/* ---------- the ask ---------- */
/** the words, in one place */
export const PULSE_WORDS = {
  h: 'Help make Daybook better for the next person?',
  p: 'Daybook can send a few anonymous counts once a day, like "opened SOS 2 times" or "came back the day after a slip". Never your words, never your log, and never who you are. It shows the one person who builds Daybook what really helps.',
  yes: 'Yes, send counts',
  no: 'No thanks',
  see: 'See exactly what is sent',
  foot: 'You can change this any time in More.',
};
/** the hours the ask may show, like the tip ask */
export const PULSE_HOURS: [number, number] = [9, 20];
/** Today asks once the person has answered nothing yet, from their second day, in the daytime, on a calm day (no slip
    today or yesterday, and not soon after an SOS or a slip), and never beside another ask (an account or a tip). */
export function pulseAsk(s: PulseState | null, days: Days, tk: DayKey, hour: number, other: boolean, quiet: boolean): boolean {
  if (!s || s.on !== null || other || quiet) return false;
  if (hour < PULSE_HOURS[0] || hour >= PULSE_HOURS[1]) return false;
  if (daysBetween(s.first, tk) < 1) return false;
  const y = addDays(tk, -1);
  return ![tk, y].some((k) => (days[k]?.events || []).some((e) => e.outcome === 'slipped'));
}

/* ---------- the owner's Stats page ---------- */
export interface PulseSummary {
  from: DayKey;
  to: DayKey;
  /** batches (one a device a day) by platform */
  platforms: [string, number][];
  versions: [string, number][];
  /** opened, by band of days since first opened */
  active: [string, number][];
  /** came back after a slip, by band */
  back: [string, number][];
  slips: number;
  /** people who reached each setup page, in setup's order, then finished */
  setup: [string, number][];
  /** what was used, most first */
  used: [string, number][];
}
/** the totals from GET /pulse (rows "<day>#<platform>" and "<day>#v#<version>"), added up for the Stats page */
export function pulseSummary(rows: { k: string; n: Record<string, number> }[], from: DayKey, to: DayKey): PulseSummary {
  const sum: Record<string, number> = {};
  const plat: Record<string, number> = {};
  const ver: Record<string, number> = {};
  for (const r of rows) {
    const [d, a, b] = r.k.split('#');
    if (!d || d < from || d > to) continue;
    if (a === 'v') {
      ver[b] = (ver[b] || 0) + (r.n.batches || 0);
      continue;
    }
    plat[a] = (plat[a] || 0) + (r.n.batches || 0);
    for (const [k, n] of Object.entries(r.n)) if (k !== 'batches' && typeof n === 'number') sum[k] = (sum[k] || 0) + n;
  }
  const list = (ks: readonly string[]): [string, number][] => ks.map((k) => [k, sum[k] || 0]);
  const desc = (o: Record<string, number>): [string, number][] => Object.entries(o).sort((x, y) => y[1] - x[1]);
  const skip = new Set<string>([...PULSE_ACTIVE, ...PULSE_BACK, 'slip_logged']);
  const used: Record<string, number> = {};
  for (const [k, n] of Object.entries(sum)) if (!skip.has(k) && !k.startsWith('setup_') && n > 0) used[k] = n;
  return {
    from,
    to,
    platforms: desc(plat),
    versions: desc(ver),
    active: list(PULSE_ACTIVE),
    back: list(PULSE_BACK),
    slips: sum.slip_logged || 0,
    setup: list(setupKeys()),
    used: desc(used),
  };
}
