/* Mithras people come to Daybook (docs/plan.md, "Mithras people come to Daybook"; the owner, November 13, 2026: "it would remember
   there streak all there journal entries etc... also we'd start them from campfire").

   Mithras was the owner's earlier app. Everything a person kept there is in rows under their own user id in Mithras's Supabase.
   The import runs on the phone and nowhere else: the person signs in to Mithras inside Daybook (Sign in with Apple, or the Mithras
   email and password), Daybook reads only that person's rows with that person's own sign-in (every read filters on their user id),
   builds Daybook records from them here, and signs the Mithras session out. No Daybook server sees any of it, and no Daybook
   account is needed. Plain fetch to Supabase's auth and REST endpoints: no library.

   What comes over:
   - journals: one entry each (mithrasEntry). The id is made from the Mithras row id, so importing again replaces an entry the
     person has not changed since, and never makes a second copy. Deleted rows are skipped.
   - streaks.streak_days: a win day is a night told free (Play.mw, read by truth.ts and away.ts), which earns nothing; a setback
     (Mithras keeps it as the same date with the year minus 100) is a slip on that day, with no time, noted "From Mithras". The
     first Mithras day becomes the start and Day 1 when it is earlier, and longest_streak becomes the floor of the longest run.
   - user_profiles: the habit and how often, for setup's first answers.
   Goals, the deeper reflections and the AI chats are not brought; the summary says so.

   The welcome (mithrasApply): an import with real history (MITHRAS_REAL) is a Campfire at once, step 1, by points that come with it
   (Settings.mith.pts, added once to the total, legacy totalPoints), so everything earned after it shows on top of it. The level,
   the badges and the quests it reaches are marked seen in the same change, so the import brings one moment ("Your fire came with
   you"), not a flood. Nothing is ever lowered. Checked by test/mithras.test.ts. */
import { cleanTags, gameCompute, isKey, logicalKey } from './legacy/core.js';
import { changeSettings, nextU } from './actions';
import type { RecordId } from './data';
import { FORM_PTS, LADDER_V, levelOf, type Level } from './levels';
import { feelAt, FEELINGS } from './feelings';
import { normHabit, type Habit } from './habit';
import { isJnId, isWord, JN_TEXT_MAX, type JEntry, type Journal } from './journal-entries';
import { MITHRAS_FEEL } from './mithras-feelings';
import { changeDay } from './mutate';
import type { Day, DayKey, Days, Play, Snapshot } from './types';

/* ---------- the rows, as Mithras keeps them ---------- */

export interface MJournal {
  id: string;
  created_at: string;
  updated_at?: string | null;
  title?: string | null;
  content?: string | null;
  /** the mood-meter emotions: ids, or objects with an id */
  emotions?: unknown;
  reflection_data?: unknown;
  is_deleted?: boolean | null;
}
export interface MStreak {
  streak_days?: unknown;
  longest_streak?: unknown;
  current_streak?: unknown;
}
export interface MProfile {
  usage_pattern?: unknown;
  addiction_type?: unknown;
}
export interface MithrasRows {
  journals: MJournal[];
  streak: MStreak | null;
  profile: MProfile | null;
}

/* ---------- signing in and reading ---------- */

export type MithrasErr = 'bad' | 'apple' | 'net' | 'other';
export class MithrasError extends Error {
  constructor(public code: MithrasErr) {
    super(code);
  }
}
/** what the import sheet says for each */
export const MITHRAS_WORDS: Record<MithrasErr, string> = {
  bad: 'That email and password did not open a Mithras account. Check them and try again.',
  apple: 'Mithras did not take this Apple sign-in. Try your Mithras email and password instead.',
  net: 'Mithras could not be reached. Check the connection and try again.',
  other: 'Something went wrong reading Mithras. Nothing changed here. Try again in a moment.',
};

/** a signed-in Mithras session: kept only while the import reads, then signed out and forgotten */
export interface MSession {
  token: string;
  user: string;
}

type Fetch = (
  url: string,
  init: { method: string; headers: Record<string, string>; body?: string },
) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

/** rows read at a time, under Supabase's own cap of 1,000 */
export const MITHRAS_PAGE = 500;
/** the most entries read: far more than anyone wrote */
const MAX_ROWS = 20000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function mithrasClient(base: string, anon: string, fetchFn: Fetch = fetch as unknown as Fetch) {
  const root = base.replace(/\/+$/, '');
  async function call(path: string, method: string, body?: unknown, token?: string): Promise<{ status: number; j: unknown }> {
    let res;
    let text = '';
    try {
      res = await fetchFn(root + path, {
        method,
        headers: {
          apikey: anon,
          authorization: 'Bearer ' + (token || anon),
          'content-type': 'application/json',
          accept: 'application/json',
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      text = await res.text();
    } catch {
      throw new MithrasError('net');
    }
    let j: unknown = null;
    try {
      j = text ? JSON.parse(text) : null;
    } catch {
      j = null;
    }
    return { status: res.status, j };
  }
  function session(r: { status: number; j: unknown }, failed: MithrasErr): MSession {
    const o = (r.j || {}) as { access_token?: unknown; user?: { id?: unknown } };
    if (r.status >= 200 && r.status < 300 && typeof o.access_token === 'string' && o.access_token && typeof o.user?.id === 'string' && UUID.test(o.user.id))
      return { token: o.access_token, user: o.user.id };
    if (r.status >= 500) throw new MithrasError('other');
    if (r.status >= 400) throw new MithrasError(failed);
    throw new MithrasError('other');
  }
  async function rows<T>(s: MSession, table: string, query: string): Promise<T[]> {
    /* every read names the person's own id: what the sign-in can see is never relied on alone */
    const r = await call('/rest/v1/' + table + '?user_id=eq.' + encodeURIComponent(s.user) + '&' + query, 'GET', undefined, s.token);
    if (r.status < 200 || r.status >= 300 || !Array.isArray(r.j)) throw new MithrasError('other');
    return (r.j as T[]).filter((x) => !!x && typeof x === 'object' && (x as { user_id?: unknown }).user_id === s.user);
  }
  return {
    async signInEmail(email: string, password: string): Promise<MSession> {
      return session(await call('/auth/v1/token?grant_type=password', 'POST', { email: email.trim(), password }), 'bad');
    },
    /** Apple's identity token for Daybook, and the nonce Daybook made (Apple got its SHA-256) */
    async signInApple(idToken: string, nonce: string): Promise<MSession> {
      return session(await call('/auth/v1/token?grant_type=id_token', 'POST', { provider: 'apple', id_token: idToken, nonce }), 'apple');
    },
    /** the person's own journal (not the deleted rows), streak and setup answers */
    async read(s: MSession): Promise<MithrasRows> {
      const journals: MJournal[] = [];
      for (let off = 0; off < MAX_ROWS; off += MITHRAS_PAGE) {
        const page = await rows<MJournal>(s, 'journals', 'is_deleted=eq.false&select=*&order=created_at.asc,id.asc&limit=' + MITHRAS_PAGE + '&offset=' + off);
        journals.push(...page);
        if (page.length < MITHRAS_PAGE) break;
      }
      const streak = (await rows<MStreak>(s, 'streaks', 'select=user_id,streak_days,longest_streak,current_streak&limit=1'))[0] || null;
      const profile = (await rows<MProfile>(s, 'user_profiles', 'select=user_id,usage_pattern,addiction_type&limit=1'))[0] || null;
      return { journals, streak, profile };
    },
    /** ends the session on Mithras's side; a failure is fine, since the token is dropped either way */
    async signOut(s: MSession): Promise<void> {
      try {
        await call('/auth/v1/logout', 'POST', {}, s.token);
      } catch {
        /* the token is forgotten anyway */
      }
    },
  };
}
export type MithrasClient = ReturnType<typeof mithrasClient>;

/* ---------- Mithras rows to Daybook records ---------- */

/** the feeling an entry with no feeling Daybook knows gets: a quiet one, since writing is turning something over */
export const MITHRAS_FEEL_NONE = 'Thoughtful';
/** the tag on every entry that came from Mithras */
export const MITHRAS_TAG = 'mithras';
/** what counts as real history: this many Mithras days, or this many entries */
export const MITHRAS_REAL = { days: 7, entries: 3 };
/** Campfire's first step (levels.ts): where an import with real history starts */
export const CAMPFIRE_PTS = FORM_PTS[2];

/** an emotion as Mithras kept it (an id, or an object with an id or a name), as its Daybook word, or null */
export function mithrasFeel(e: unknown): string | null {
  const raw = typeof e === 'string' ? e : e && typeof e === 'object' ? ((e as { id?: unknown }).id ?? (e as { name?: unknown }).name) : null;
  if (typeof raw !== 'string') return null;
  const w = MITHRAS_FEEL[raw.trim().toLowerCase()];
  return w && isWord(w) ? w : null;
}

/** a Daybook entry id from a Mithras row id: the same row always gives the same id */
export function mithrasEntryId(rowId: string): string {
  const s = String(rowId || '')
    .toLowerCase()
    .replace(/[^0-9a-z]/g, '');
  /* a uuid's first 8 and last 14: 88 bits, more than enough to tell one person's rows apart */
  if (s.length >= 22) return 'mi' + s.slice(0, 8) + s.slice(-14);
  if (s.length >= 8) return 'mi' + s;
  /* not a uuid: a short code of it */
  let h = 2166136261;
  for (const ch of String(rowId)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return 'mi' + h.toString(36).padStart(7, '0');
}

const clip = (v: unknown, n: number) =>
  typeof v === 'string'
    ? v
        .replace(/\u0000/g, '')
        .trim()
        .slice(0, n)
    : '';

/** one Mithras journal row as a Daybook entry, or null when it is not one (deleted, no date) */
export function mithrasEntry(row: MJournal, roll: number, tk: DayKey, u: number): JEntry | null {
  if (!row || typeof row !== 'object' || row.is_deleted === true || typeof row.id !== 'string') return null;
  const at = Date.parse(row.created_at);
  if (!Number.isFinite(at)) return null;
  const d = logicalKey(at, roll);
  if (!isKey(d) || d > tk) return null;
  const id = mithrasEntryId(row.id);
  if (!isJnId(id)) return null;
  const feels = (Array.isArray(row.emotions) ? row.emotions : []).map(mithrasFeel).filter((w): w is string => !!w);
  const w = feels[0] || MITHRAS_FEEL_NONE;
  const title = clip(row.title, 200);
  const body = clip(row.content, JN_TEXT_MAX);
  const r = (row.reflection_data && typeof row.reflection_data === 'object' ? row.reflection_data : {}) as Record<string, unknown>;
  const lines = [
    ['Where', clip(r.location, 200)],
    ['Doing', clip(r.activity, 200)],
    ['With', clip(r.people, 200)],
  ]
    .filter((x) => x[1])
    .map((x) => x[0] + ': ' + x[1]);
  const head = title && !body.startsWith(title) ? title : '';
  const t = [head, body, lines.join('\n')].filter(Boolean).join('\n\n').slice(0, JN_TEXT_MAX);
  const tags = cleanTags([...feels.slice(1), MITHRAS_TAG]);
  return { id, d, at, w, t, tags, u };
}

/** Mithras's streak days as Daybook days: the wins and the setbacks, each sorted, none after today. A day that is both is a setback. */
export function mithrasDays(streak: MStreak | null, tk: DayKey): { wins: DayKey[]; slips: DayKey[] } {
  const wins = new Set<DayKey>();
  const slips = new Set<DayKey>();
  const list = streak && Array.isArray(streak.streak_days) ? streak.streak_days : [];
  for (const v of list) {
    const s = typeof v === 'string' ? v.slice(0, 10) : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) continue;
    const y = Number(s.slice(0, 4));
    /* a setback is kept as its date with the year minus 100 */
    const k = y < 1990 ? String(y + 100).padStart(4, '0') + s.slice(4) : s;
    if (!isKey(k) || k > tk || k < '2000-01-01') continue;
    (y < 1990 ? slips : wins).add(k);
  }
  slips.forEach((k) => wins.delete(k));
  return { wins: [...wins].sort(), slips: [...slips].sort() };
}

/** Mithras's setup answers as Daybook's: the habit (habit.ts) and how often (setup.ts OB_FREQ4) */
export function mithrasProfile(p: MProfile | null): { habit?: Habit; freq?: string } {
  if (!p) return {};
  const out: { habit?: Habit; freq?: string } = {};
  const a = typeof p.addiction_type === 'string' ? p.addiction_type.toLowerCase() : '';
  const h =
    normHabit(a) ||
    (/porn|nofap|adult/.test(a) ? 'porn' : /alcohol|drink|beer/.test(a) ? 'alcohol' : /gambl|bet/.test(a) ? 'gambling' : a.trim() ? 'other' : null);
  if (h) out.habit = h;
  const f = ({ daily: 'f3', weekly: 'f1', monthly: 'f0', occasional: 'f0' } as Record<string, string>)[String(p.usage_pattern || '')];
  if (f) out.freq = f;
  return out;
}

/** everything an import would bring, worked out before anything changes */
export interface MithrasPlan {
  entries: JEntry[];
  wins: DayKey[];
  slips: DayKey[];
  /** the first Mithras day (a win or a setback), or null */
  first: DayKey | null;
  /** Mithras's longest streak */
  longest: number;
  /** words written, counted again from the text */
  words: number;
  /** the days with an entry */
  daysWritten: number;
  profile: { habit?: Habit; freq?: string };
  /** enough history to start at Campfire */
  real: boolean;
}

export const wordCount = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);

export function mithrasPlan(rows: MithrasRows, roll: number, tk: DayKey, now = Date.now()): MithrasPlan {
  const seen = new Set<string>();
  const entries: JEntry[] = [];
  for (const row of rows.journals || []) {
    const e = mithrasEntry(row, roll, tk, now);
    if (!e || seen.has(e.id)) continue;
    seen.add(e.id);
    entries.push(e);
  }
  const { wins, slips } = mithrasDays(rows.streak, tk);
  const first = [wins[0], slips[0]].filter((x): x is DayKey => !!x).sort()[0] || null;
  const ls = Number(rows.streak && rows.streak.longest_streak);
  const longest = Number.isFinite(ls) ? Math.max(0, Math.min(10000, Math.floor(ls))) : 0;
  const days = wins.length + slips.length;
  return {
    entries,
    wins,
    slips,
    first,
    longest,
    words: entries.reduce((n, e) => n + wordCount(e.t), 0),
    daysWritten: new Set(entries.map((e) => e.d)).size,
    profile: mithrasProfile(rows.profile),
    real: days >= MITHRAS_REAL.days || entries.length >= MITHRAS_REAL.entries,
  };
}

/* ---------- landing it ---------- */

const blankPlay = (): Play => ({ w: [], wd: false, r: false, c: 0, m: false, tl: [], po: null, ls: [], lv: [], ov: {} });
const slipped = (d: Day | undefined) => !!d && (d.events || []).some((e) => e.outcome === 'slipped');
/** the id of the slip a Mithras setback becomes: one per day, so importing again finds it */
export const mithrasSlipId = (k: DayKey) => 'mi' + k.replace(/-/g, '');

export interface MithrasDone {
  snap: Snapshot;
  changed: RecordId[];
  /** entries new here, and entries brought again over an unchanged copy */
  added: number;
  replaced: number;
  slips: number;
  wins: number;
  /** points the import came with (0 on a second import, or with no real history) */
  welcome: number;
  /** the flame's form went up with it */
  campfire: boolean;
  level: Level;
}

/** whether an entry brought again differs from the copy here */
const sameEntry = (a: JEntry, b: JEntry) => a.d === b.d && a.at === b.at && a.w === b.w && a.t === b.t && (a.tags || []).join() === (b.tags || []).join();

/** the import, landed on what is here. What was earned here stays: nothing is lowered, an entry the person changed in Daybook is
    left as it is, and a day with a slip already logged gets no second one. */
export function mithrasApply(snap: Snapshot, plan: MithrasPlan, tk: DayKey, now = Date.now()): MithrasDone {
  const st0 = snap.settings;
  if (!st0) throw new Error('setup first');
  const reviews = snap.reviews || {};
  const before = gameCompute(snap.days, st0, reviews, tk);
  const prev = st0.mith || null;
  const changed: RecordId[] = [];

  /* the days: a setback is a slip with no time, a win a night told free */
  const days: Days = { ...snap.days };
  let slips = 0;
  let wins = 0;
  for (const k of plan.slips) {
    if (slipped(days[k])) continue;
    const d = changeDay(
      days[k],
      k,
      (x) => {
        x.events.push({ id: mithrasSlipId(k), time: null, outcome: 'slipped', trigger: null, paused: null, did: null, recovered: false, note: 'From Mithras' });
        if (x.p && x.p.mw) delete x.p.mw;
      },
      now,
    );
    if (d) {
      days[k] = d;
      changed.push(`days/${k}`);
      slips++;
    }
  }
  for (const k of plan.wins) {
    if (slipped(days[k]) || days[k]?.p?.mw) continue;
    const d = changeDay(days[k], k, (x) => void (x.p = { ...(x.p || blankPlay()), mw: true }), now);
    if (d) {
      days[k] = d;
      changed.push(`days/${k}`);
      wins++;
    }
  }

  /* the journal: new entries come in; one brought before comes again only when the person has not changed it here since */
  const journal: Journal = { ...(snap.journal || {}) };
  let added = 0;
  let replaced = 0;
  for (const e of plan.entries) {
    const here = journal[e.id];
    if (!here) {
      journal[e.id] = { ...e, u: nextU(null, now) };
      changed.push(`journal/${e.id}`);
      added++;
    } else if (prev && here.u <= prev.at && !sameEntry(here, e)) {
      journal[e.id] = { ...e, u: nextU(here, now) };
      changed.push(`journal/${e.id}`);
      replaced++;
    }
  }

  /* the dates move earlier only where the days in between hold nothing but Mithras's: someone whose own Daybook days began
     before the quiet-day rule (awayFrom) or the one-count rule (countFrom) keeps their dates, so no old rule changes under them */
  const own = Object.keys(snap.days)
    .filter((k) => {
      const d = snap.days[k];
      return !!d && ((d.events && d.events.length > 0) || !!d.checkin);
    })
    .sort();
  const ownSlip = own.filter((k) => slipped(snap.days[k]));
  const awayFrom = isKey(st0.awayFrom) ? st0.awayFrom : null;
  const countFrom = isKey(st0.countFrom) ? st0.countFrom : null;
  const back = !!plan.first && (!awayFrom || !own.length || own[0] >= awayFrom) && (!countFrom || !ownSlip.length || ownSlip[0] > countFrom);
  const first = plan.first;

  const draft = changeSettings(
    st0,
    (s) => {
      if (back && first) {
        if (first < s.start) s.start = first;
        if (s.day1 && first < s.day1) s.day1 = first;
        if (s.stepAt && first < s.stepAt) s.stepAt = first;
        if (!awayFrom || first < awayFrom) s.awayFrom = first;
        if (!countFrom || first < countFrom) s.countFrom = first;
      }
      const seen = s.seen || { badges: [], quests: [], level: 1, full: null, lad: LADDER_V };
      if (plan.longest > (seen.longest || 0)) seen.longest = plan.longest;
      s.seen = seen;
      s.mith = { at: now, d: prev ? prev.d : tk, pts: prev ? prev.pts : 0 };
    },
    now,
  );
  /* the welcome: a first import with real history lands on Campfire's first step, with the points it brought on top of what is here */
  const mid = gameCompute(days, draft, reviews, tk).pts;
  const welcome = !prev && plan.real ? Math.max(0, CAMPFIRE_PTS - mid) : 0;
  const withPts = welcome ? changeSettings(draft, (s) => void (s.mith = { ...s.mith!, pts: welcome }), now) : draft;
  /* everything the import reached is seen now: one moment, not a level and a badge each */
  const g = gameCompute(days, withPts, reviews, tk);
  const settings = changeSettings(
    withPts,
    (s) => {
      const seen = s.seen!;
      seen.level = Math.max(seen.level, g.level.n);
      seen.lad = LADDER_V;
      g.badges.forEach((b) => b.done && seen.badges.indexOf(b.id) < 0 && seen.badges.push(b.id));
      const wk = 'w' + g.week + ':';
      seen.quests = seen.quests.filter((id) => id.indexOf(wk) === 0);
      g.quests.forEach((q) => q.done && seen.quests.indexOf(q.id) < 0 && seen.quests.push(q.id));
    },
    now,
  );
  changed.unshift('settings');
  const level = g.level;
  return {
    snap: { ...snap, settings, days, journal },
    changed,
    added,
    replaced,
    slips,
    wins,
    welcome,
    campfire: level.stage > before.level.stage,
    level,
  };
}

/** what the preview says, before anything changes: the entries, the longest run, and the form it starts at */
export function mithrasPreview(snap: Snapshot, plan: MithrasPlan, tk: DayKey): { entries: number; longest: number; days: number; form: string | null } {
  const st = snap.settings;
  const pts = st ? gameCompute(snap.days, st, snap.reviews || {}, tk).pts : 0;
  const lands = plan.real && !(st && st.mith) && pts < CAMPFIRE_PTS ? levelOf(CAMPFIRE_PTS) : null;
  return { entries: plan.entries.length, longest: plan.longest, days: plan.wins.length + plan.slips.length, form: lands ? lands.name : null };
}

/* the feelings list is read here so a word in the table that left FEELINGS is caught by the tests, not shown */
export const mithrasWordsOk = (): boolean => {
  const all = new Set(FEELINGS.flat().map((f) => f.w));
  return Object.values(MITHRAS_FEEL).every((w) => all.has(w)) && !!feelAt(0, 0) && all.has(MITHRAS_FEEL_NONE);
};

/** an empty play record's days, for the tests and the app: a day the import marked a win only */
export const mithrasWinOnly = (d: Day | undefined) => !!d && !!d.p && d.p.mw === true && !(d.events || []).length;
