/* Friends (beta): a person adds a friend inside Daybook and chooses what that friend sees (the owner, November 15, 2026: "it
   should just get a log, like tell them your goals. And they're not going to be centered around the addiction. They'll be around
   like using the app, or like using SOS"). docs/plan.md, "Friends (beta)", has the research and the owner's answers.

   Then (the owner, November 15, 2026: "having them write out a bunch of goals is too much ... just have automated goals ... just
   tell them, like, hey, this will tell them how often you do a lesson, how often you check up and use the app, and just a daily
   report you can choose when it lets them know ... it should be a very clean process"): nothing to write but a first name. What a
   friend sees is automatic and said up front, each item can still be turned off, and the person picks when the daily report reaches
   the friend.

   What a friend can ever see is fixed here, and nothing else is in the shape: the name, this week's effort and today's, item by item,
   and the hour of the daily report. A slip, a count that resets, the journal, notes and the times of anything are not in the shape at
   all, so no setting can leak them. The server (services/api friends.ts) cleans every card with normCard and sends a friend only the
   items that are on. */
import { addDays, eventsOf, gameCompute } from './legacy/core.js';
import type { DayKey, Days, Reviews, Settings } from './types';

/** what a person can share with friends, in the order the page shows them. Each is effort over the last 7 days, or the flame. */
export const SHARE_KEYS = ['lessons', 'checkins', 'days', 'rode', 'level'] as const;
export type ShareKey = (typeof SHARE_KEYS)[number];
/** the items that are counts */
export const COUNT_KEYS = ['lessons', 'checkins', 'days', 'rode'] as const;
type CountKey = (typeof COUNT_KEYS)[number];
/** what is shared without a choice to make: the lessons, the check-ins, the days in Daybook and the flame. Urges ridden out stays off
    until turned on (the owner's SOS answer, November 15: an optional weekly count, never a live alert). */
export const SHARE_DEFAULT: Partial<Record<ShareKey, boolean>> = { lessons: true, checkins: true, days: true, level: true };
/** when the daily report reaches a friend, by default ('HH:MM' on the friend's clock) */
export const REPORT_DEFAULT = '21:00';
/** the hours a person can pick for it */
export const REPORT_TIMES = ['08:00', '12:00', '18:00', '21:00'] as const;

/** the words for each item: the switch on the person's own page, and how a friend reads it */
export const SHARE_WORDS: Record<ShareKey, { label: string; hint: string; friend: (n: number) => string }> = {
  lessons: {
    label: 'Lessons done',
    hint: 'How many lessons you finished this week',
    friend: (n) => (n === 1 ? '1 lesson' : n + ' lessons'),
  },
  checkins: { label: 'Check-ins', hint: 'Days you checked in', friend: (n) => (n === 1 ? '1 check-in' : n + ' check-ins') },
  days: { label: 'Days in Daybook', hint: 'Days you opened Daybook', friend: (n) => (n === 1 ? '1 day in Daybook' : n + ' days in Daybook') },
  /* SOS reaches a friend only as this weekly count, said as strength, never as a live alert (the owner's answer, November 15) */
  rode: {
    label: 'Urges ridden out',
    hint: 'A weekly count of urges you rode out. Never a live alert.',
    friend: (n) => (n === 1 ? 'Rode out 1 urge' : 'Rode out ' + n + ' urges'),
  },
  level: { label: 'Your flame', hint: 'Its level and name', friend: (n) => 'Level ' + n },
};

/** what a friend's weekly numbers are, today's (dk: which day, dl: lessons that day, dc: 1 when checked in), and the flame */
export type ShareVals = Partial<Record<CountKey, number>> & { level?: number; lname?: string; dk?: DayKey; dl?: number; dc?: number };

/** the card a person keeps for friends: their name, what is on, the week's numbers (only for what is on), and when the daily report
    reaches friends ('HH:MM', or null for none) */
export interface FriendCard {
  name: string;
  on: Partial<Record<ShareKey, boolean>>;
  vals: ShareVals;
  rt: string | null;
  /** when the numbers were worked out (ms) */
  at: number;
  /** the days in Daybook of the last two weeks (only while days in Daybook is shared), for the together streak. Never sent to a
      friend: the server reads it only to find the days both showed up. */
  od?: DayKey[];
  /** how this person hears about a friend who joins by their code: as it happens (the default) or once a day */
  hn?: Hear;
}

export const NAME_MAX = 24;
/** how many friends one person may have: a small circle, never an audience */
export const FRIENDS_MAX = 12;
/** how long an invite code works */
export const INVITE_DAYS = 7;
/** numbers older than this are not shown to a friend: a quiet week shows only the name and the flame, never "nothing this week" */
export const VALS_FRESH = 8 * 86400_000;

/* ---------- words people write for friends ---------- */

/* the only words that ever leave the phone for another person. Links, emails and phone numbers are refused (a friend is never
   sent somewhere, and nobody is asked to make contact elsewhere), and so is a short list of crude words, kept in rot13 so they do
   not sit in the code as words (Apple Guideline 1.2 asks for a filter beside Report and Block). */
const CRUDE = 'shpx,fuvg,phag,ovgpu,qvpx,pbpx,chffl,juber,fyhg,snt,avtt,ergneq,nffubyr,cbea,frkl,ahqr,anxrq';
let crude: string[] | null = null;
function crudeWords(): string[] {
  if (crude) return crude;
  /* rot13 */
  const raw = CRUDE.replace(/[a-z]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - 97 + 13) % 26) + 97));
  return (crude = raw.split(','));
}

/** why words cannot be shared, or null when they can */
export function wordsTrouble(t: string): string | null {
  const s = t.toLowerCase();
  if (/https?:|www\.|\.(com|net|org|io|me|co|app|ly|gg)\b|@/.test(s)) return 'Links and emails cannot be shared here.';
  if ((s.match(/\d/g) || []).length >= 7) return 'Phone numbers cannot be shared here.';
  /* whole words (and their plain endings), so a name like Dickson or a word like peacock is never caught */
  const words = s.split(/[^a-z]+/).filter(Boolean);
  const bad = crudeWords();
  if (words.some((w) => bad.some((b) => w === b || w === b + 's' || w === b + 'ing' || w === b + 'er' || w === b + 'ed' || w === b + 'y')))
    return 'Pick other words. Friends see this.';
  return null;
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
/** how many days of "days in Daybook" a card keeps for the together streak */
export const OPEN_DAYS = 14;

const clean = (t: unknown, max: number): string =>
  typeof t === 'string'
    ? t
        .replace(/[\u0000-\u001f\u007f​-‏‪-‮⁦-⁩]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, max)
    : '';

const count = (v: unknown, max: number): number | undefined => (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max ? v : undefined);

/** a card as it may be kept: cleaned, words checked, and numbers only for the items that are on. Null when it is not a card
    (or its name or goals cannot be shared). */
export function normCard(x: unknown): FriendCard | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  const name = clean(o.name, NAME_MAX);
  if (!name || wordsTrouble(name)) return null;
  const on: FriendCard['on'] = {};
  const rawOn = o.on && typeof o.on === 'object' ? (o.on as Record<string, unknown>) : {};
  for (const k of SHARE_KEYS) if (rawOn[k] === true) on[k] = true;
  const rv = o.vals && typeof o.vals === 'object' ? (o.vals as Record<string, unknown>) : {};
  const vals: ShareVals = {};
  for (const k of COUNT_KEYS) {
    const n = count(rv[k], 1000);
    if (on[k] && n != null) vals[k] = n;
  }
  /* today: the day it is, its lessons when lessons are on, and the check-in when check-ins are on */
  if (typeof rv.dk === 'string' && DAY_RE.test(rv.dk)) {
    const dl = count(rv.dl, 100);
    const dc = count(rv.dc, 1);
    if ((on.lessons && dl != null) || (on.checkins && dc != null)) vals.dk = rv.dk;
    if (on.lessons && dl != null) vals.dl = dl;
    if (on.checkins && dc != null) vals.dc = dc;
  }
  if (on.level) {
    const n = count(rv.level, 1000);
    if (n != null) {
      vals.level = n;
      const ln = clean(rv.lname, 40);
      if (ln && !wordsTrouble(ln)) vals.lname = ln;
    }
  }
  const rt = typeof o.rt === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(o.rt) ? o.rt : null;
  const at = typeof o.at === 'number' && Number.isFinite(o.at) && o.at > 0 ? Math.floor(o.at) : 0;
  const od =
    on.days && Array.isArray(o.od) ? [...new Set(o.od.filter((d): d is string => typeof d === 'string' && DAY_RE.test(d)))].sort().slice(-OPEN_DAYS) : [];
  const hn = o.hn === 'live' || o.hn === 'daily' || o.hn === 'off' ? (o.hn as Hear) : undefined;
  return { name, on, vals, rt, at, ...(od.length ? { od } : {}), ...(hn ? { hn } : {}) };
}

/** what a friend is sent: the name, the numbers for what is on while they are fresh, the flame, and the daily report's hour */
export function cardForFriend(c: FriendCard, now: number): { name: string; vals: ShareVals; rt: string | null } {
  const vals: ShareVals = {};
  const fresh = now - c.at <= VALS_FRESH;
  if (fresh) {
    for (const k of COUNT_KEYS) if (c.on[k] && c.vals[k] != null) vals[k] = c.vals[k];
    if (c.vals.dk) {
      vals.dk = c.vals.dk;
      if (c.on.lessons && c.vals.dl != null) vals.dl = c.vals.dl;
      if (c.on.checkins && c.vals.dc != null) vals.dc = c.vals.dc;
    }
  }
  if (c.on.level && c.vals.level != null) {
    vals.level = c.vals.level;
    if (c.vals.lname) vals.lname = c.vals.lname;
  }
  return { name: c.name, vals, rt: c.rt };
}

/** the days in Daybook of the last two weeks, up to today: what the together streak is made of */
export function openDays(days: Days, tk: DayKey): DayKey[] {
  const out: DayKey[] = [];
  for (let k = addDays(tk, -(OPEN_DAYS - 1)); k <= tk; k = addDays(k, 1)) {
    const d = days[k];
    if (d && (d.p?.o || d.checkin || (d.p?.ls || []).length || d.events.length)) out.push(k);
  }
  return out;
}

/** this week's numbers from the log (the 7 days up to today) and today's. Only effort; a slip is never read here. */
export function weekShare(days: Days, st: Settings, reviews: Reviews, tk: DayKey): ShareVals {
  const from = addDays(tk, -6);
  let lessons = 0;
  let checkins = 0;
  let open = 0;
  for (let k = from; k <= tk; k = addDays(k, 1)) {
    const d = days[k];
    if (!d) continue;
    const p = d.p;
    lessons += (p?.ls || []).length;
    if (d.checkin?.done) checkins++;
    /* a day in Daybook: it was opened, or something was done in it */
    if (p?.o || d.checkin || (p?.ls || []).length || d.events.length) open++;
  }
  let rode = 0;
  for (const e of eventsOf(days, from)) if (e.key <= tk && e.outcome === 'rode') rode++;
  const g = gameCompute(days, st, reviews, tk);
  const today = days[tk];
  return {
    lessons,
    checkins,
    days: open,
    rode,
    level: g.level.n,
    lname: g.level.name,
    dk: tk,
    dl: (today?.p?.ls || []).length,
    dc: today?.checkin?.done ? 1 : 0,
  };
}

/** today's line for a friend, when the numbers are from today (tk, the friend's own day): "Did a lesson · Checked in" */
export function friendToday(vals: ShareVals, tk: DayKey): string {
  if (vals.dk !== tk) return '';
  const out: string[] = [];
  if (vals.dl) out.push(vals.dl === 1 ? 'Did a lesson' : 'Did ' + vals.dl + ' lessons');
  if (vals.dc) out.push('Checked in');
  return out.join(' · ');
}

/** "9 PM", "12 PM", "8 AM" */
export function reportAt(rt: string): string {
  const [h, m] = rt.split(':').map(Number);
  const hh = h % 12 || 12;
  return hh + (m ? ':' + String(m).padStart(2, '0') : '') + (h < 12 ? ' AM' : ' PM');
}

/** what a friend's card says, line by line, in the order of SHARE_KEYS (the level apart: the page shows it with the flame) */
export function friendLines(vals: ShareVals): string[] {
  const out: string[] = [];
  for (const k of COUNT_KEYS) {
    const n = vals[k];
    if (n != null && n > 0) out.push(SHARE_WORDS[k].friend(n));
  }
  return out;
}

/* ---------- encouragement: ready-made, never typed ---------- */

export const FRIEND_CHEERS = [
  /* the spark is the one the app sends now; the other three are kept so an encouragement sent before still reads */
  { k: 'spark', send: 'Send a spark', got: 'sent you a spark' },
  { k: 'warm', send: 'Warm their flame', got: 'warmed your flame' },
  { k: 'proud', send: 'Proud of you', got: 'is proud of you' },
  { k: 'with', send: 'With you today', got: 'is with you today' },
] as const;
export type CheerKind = (typeof FRIEND_CHEERS)[number]['k'];
export const isCheer = (k: unknown): k is CheerKind => FRIEND_CHEERS.some((c) => c.k === k);
/** one encouragement a day to each friend */
export const CHEER_GAP = 20 * 3600_000;

/* ---------- invite codes ---------- */

/** no 0/O, 1/I/L, so a code read aloud or typed from a message is not mistaken */
export const CODE_ABC = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LEN = 6;

/** a code as typed or pasted (spaces, a dash, lower case, a whole link) as the server keeps it, or null */
export function normCode(x: unknown): string | null {
  if (typeof x !== 'string') return null;
  const m = x.match(/[?&]code=([A-Za-z0-9-]+)/);
  const s = (m ? m[1] : x).toUpperCase().replace(/[\s-]/g, '');
  if (s.length !== CODE_LEN) return null;
  for (const ch of s) if (!CODE_ABC.includes(ch)) return null;
  return s;
}

/** "K7QM2P" as "K7Q-M2P" */
export const showCode = (c: string) => c.slice(0, 3) + '-' + c.slice(3);

/** the link a person sends: it opens the Friends page with the code filled in */
export const inviteLink = (site: string, code: string) => site.replace(/\/+$/, '') + '/friends?code=' + code;

/** the message with the code alone, for "Share my code" */
export const codeText = (name: string, code: string) => `${name} would like you as a friend on Daybook. Open Friends in Daybook and enter ${showCode(code)}.`;

/** the message a person sends with the link. It never names the habit: whoever sees the phone of the friend sees only this. */
export const inviteText = (name: string, link: string, code: string) =>
  `${name} would like you as a friend on Daybook, to cheer each other on. Open ${link} or enter the code ${showCode(code)}.`;

/** what the reasons for a report are */
export const REPORT_WHY = [
  { k: 'words', label: 'Something they wrote' },
  { k: 'unknown', label: 'I do not know this person' },
  { k: 'other', label: 'Something else' },
] as const;
export type ReportWhy = (typeof REPORT_WHY)[number]['k'];
export const isReportWhy = (k: unknown): k is ReportWhy => REPORT_WHY.some((r) => r.k === k);

/* ---------- the together streak (the owner, November 15, 2026: "a together streak and it's just days they both log in i like that") ---------- */

/** two friends' streak: how many days in a row both were in Daybook, the last such day, and the longest. Kept once per friendship by
    the server, so it lives on when a phone is lost. The longest never drops (earned things stay earned). */
export interface Together {
  n: number;
  last: DayKey | null;
  best: number;
}
export const TOGETHER_NONE: Together = { n: 0, last: null, best: 0 };

/** the streak after both cards' days in Daybook are read: each day both were in, after the last one counted, adds to it (the next
    day in a row) or starts it again at 1 (a gap). Days already counted are never counted twice. */
export function togetherStep(rec: Together, a: DayKey[] = [], b: DayKey[] = []): Together {
  const bs = new Set(b);
  const both = [...new Set(a)].filter((d) => bs.has(d)).sort();
  let { n, last, best } = rec;
  for (const d of both) {
    if (last && d <= last) continue;
    n = last && addDays(last, 1) === d ? n + 1 : 1;
    last = d;
    best = Math.max(best, n);
  }
  return { n, last, best };
}

/** the streak as it stands today (tk, the reader's day): alive while the last day both were in is today or yesterday. A gap is
    never said: the page shows the longest and a fresh start, never what was lost. */
export function togetherNow(rec: Together | null | undefined, tk: DayKey): { n: number; today: boolean; best: number } {
  if (!rec?.last) return { n: 0, today: false, best: rec?.best || 0 };
  const alive = rec.last >= addDays(tk, -1);
  return { n: alive ? rec.n : 0, today: rec.last >= tk, best: rec.best };
}

/** the days of this week (Monday to today, on the reader's day) both were in Daybook, from the two lists */
export function togetherWeek(a: DayKey[] = [], b: DayKey[] = []): DayKey[] {
  const bs = new Set(b);
  return [...new Set(a)].filter((d) => bs.has(d)).sort();
}

/* ---------- the spark (the owner, November 15, 2026: "Warming their flame does nothing"; their answer: "It visits and comes back") ---------- */

/* A spark is the one thing a person sends a friend. It flies from their flame to the friend's, waits beside the friend's flame on
   Today, and goes into the friend's next lesson; that lesson ends with "Sam's spark was in this one", and the sender is told it was
   used. One a day to each friend, and only one waiting from each. */
export const SPARK = 'spark';
/** what the friend reads when it lands */
export const sparkGot = (name: string) => `${name} sent you a spark`;
/** what the friend reads at the end of the lesson it went into */
export const sparkUsed = (name: string) => `${name}’s spark was in this one`;
/** what the sender reads once it was used */
export const sparkBack = (name: string) => `Your spark was in ${name}’s lesson`;
/** a waiting spark stays a week; after that it is let go without a word */
export const SPARK_KEEP = 7 * 86400_000;

/* ---------- live notes: a friend's note as it happens, never too many (the owner, November 15, 2026: "we can't overwhelm them with
   notifications ... there friend using it could replace other notificaions and be part of how they get pulled to use the app") ---------- */

/** how a person hears about one friend: as it happens (capped), once a day at the hour the friend picked, or not at all */
export const HEAR = ['live', 'daily', 'off'] as const;
export type Hear = (typeof HEAR)[number];
export const isHear = (k: unknown): k is Hear => HEAR.includes(k as Hear);
/** at most this many friend notes reach a person in a day, from every friend together, sparks included */
export const LIVE_CAP = 2;
/** and from one friend, at most one about what they did */
export const LIVE_PER_FRIEND = 1;
/** no friend note before 8 AM or from 10 PM, on the person's own clock */
export const QUIET_FROM = 22;
export const QUIET_TO = 8;

/** the hour on a person's clock, from their offset from UTC in minutes */
export const localHour = (now: number, tz: number) => new Date(now + tz * 60_000).getUTCHours();
/** the day on a person's clock */
export const localDay = (now: number, tz: number): DayKey => new Date(now + tz * 60_000).toISOString().slice(0, 10);
export const quietNow = (now: number, tz: number) => {
  const h = localHour(now, tz);
  return h >= QUIET_FROM || h < QUIET_TO;
};

/** what reached a person today: a note about what a friend did, a spark, or a spark's receipt */
export type FriendNote = 'lesson' | 'checkin' | 'spark' | 'back';
/** the words of a live note. The title is the friend's first name; nothing says what Daybook is for, because a note can show on a
    locked screen. When the reader has not done today's lesson yet, the note says theirs is waiting: the friend is the pull. */
export function liveWords(kind: FriendNote, name: string, readerDone: boolean): { title: string; body: string } {
  if (kind === 'spark') return { title: name, body: 'Sent you a spark. It goes into your next lesson.' };
  if (kind === 'back') return { title: name, body: 'Your spark was in ' + name + '’s lesson today.' };
  const did = kind === 'lesson' ? 'Just did today’s lesson.' : 'Just checked in.';
  return { title: name, body: did + (readerDone ? ' Send a spark?' : ' Yours is waiting.') };
}
