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
  if (typeof rv.dk === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rv.dk)) {
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
  return { name, on, vals, rt, at };
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
