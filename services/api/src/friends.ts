/* Friends (beta): the server side (core friends.ts holds the rules; docs/plan.md "Friends (beta)" the why). All of it rides the
   signed-in /sync routes as ?friends=..., so it needs no new route, role or table.

   GET  /sync?friends=1                    { me, invite, friends }: my card, my code, and each friend as they share with me
   GET  /sync?friends=look&code=K7QM2P     { name }: whose code this is, before accepting it
   POST /sync?friends=card   { card }      saves my card (core normCard cleans it; numbers only for what is on)
   POST /sync?friends=invite { fresh? }    { code, exp }: my code; fresh makes a new one and ends the old one
   POST /sync?friends=accept { code }      becomes friends with the code's owner
   POST /sync?friends=cheer  { fid, k }    a spark (k 'spark') to a friend, one a day; it waits for their next lesson
   POST /sync?friends=used   { fid }       the spark from that friend went into my lesson: they are told
   POST /sync?friends=hear   { fid, hear }  how I hear about that friend: 'live' (capped), 'daily' (the report) or 'off'
   POST /sync?friends=push   { token, tz }  this phone's Expo push token (null: none) and its offset from UTC in minutes
   POST /sync?friends=remove { fid }       ends a friendship, on both sides, quietly
   POST /sync?friends=block  { fid, why? } ends it and keeps that person from using my code again; with why, a report for the owner
   POST /sync?friends=leave                leaves Friends: my card, code and every friendship go

   Where things are kept (the records table; every sort key starts with #, so nothing here is ever pulled or erased with the log):
   - <me>  #card            my card: my name for friends, what is on, the week's and today's numbers, the daily report's hour
   - <me>  #fr/<them>       one side of a friendship: { fid, at }. A friendship is both sides; a card is read only when both are there
   - <me>  #cheer/<them>    the last spark they sent me: { k, at, used? } (used: when it went into my lesson)
   - <lo>  #tg/<hi>         our together streak (core Together), once per friendship, kept with whichever account id sorts first
   - <me>  #push            my phone's push token and clock offset, while I hear about a friend as it happens
   - <me>  #pushday         how many friend notes reached me today, and from whom, so they never pile up (core LIVE_CAP)
   - <me>  #block/<them>    they can never use my code, and I can never use theirs
   - <them> #blockedby/<me> the same block, kept with them so closing either account finds it; never shown to anyone
   - <me>  #myinv           my code, so it can be ended
   - #invites  <code>       whose code it is: { sub }, with a 7-day time-to-live
   - #reports  <at>/<me>    a report for the owner: who about whom, why, and the words they had shared then

   Who is asking comes only from the signed token. A friend is named to the app by fid, a random id the friendship carries, never by
   their account id. Closing an account (friendsGone) removes every one of these, on both sides. */
import { randomBytes, randomInt } from 'node:crypto';

import {
  CHEER_GAP,
  LIVE_CAP,
  LIVE_PER_FRIEND,
  SPARK,
  SPARK_KEEP,
  TOGETHER_NONE,
  isHear,
  liveWords,
  localDay,
  quietNow,
  togetherStep,
  togetherWeek,
  type FriendNote,
  type Hear,
  type Together,
  CODE_ABC,
  CODE_LEN,
  FRIENDS_MAX,
  INVITE_DAYS,
  cardForFriend,
  isCheer,
  isReportWhy,
  normCard,
  normCode,
  type CheerKind,
  type FriendCard,
} from '@daybook/core';

import { isPushToken, pushSend } from './push';
import type { Store } from './store';

export const CARD = '#card';
export const FR = '#fr/';
export const CHEER = '#cheer/';
export const BLOCK = '#block/';
/** the other side of a block, kept with the person blocked, so closing their account can find it (they are never shown it) */
export const BLOCKED_BY = '#blockedby/';
export const MYINV = '#myinv';
export const TG = '#tg/';
export const PUSH = '#push';
export const PUSHDAY = '#pushday';
export const INVITES = '#invites';
export const REPORTS = '#reports';
/** how many codes one person may look up or try in a day: enough for real use, too few to guess one */
export const LOOKS_A_DAY = 30;

/** an answer the app shows as it is */
export class FriendError extends Error {
  constructor(
    public status: number,
    msg: string,
  ) {
    super(msg);
  }
}
const NO_CODE = 'That code does not work. It may have run out: ask for a new one.';

type Fr = { fid: string; at: number; hear?: Hear };
type Cheer = { k?: string; at?: number; used?: number };
const addDays = (dk: string, n: number) => new Date(Date.parse(dk + 'T12:00:00Z') + n * 86400_000).toISOString().slice(0, 10);
const asFr = (v: unknown): Fr | null => (v && typeof v === 'object' && typeof (v as Fr).fid === 'string' ? (v as Fr) : null);
const card = async (store: Store, user: string) => normCard(await store.auxGet(user, CARD));
const utcDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** my friendships, both sides there: their account id, the fid and when */
async function friendsOf(store: Store, user: string): Promise<{ sub: string; fid: string; at: number; hear: Hear; theirs: Fr }[]> {
  const mine = await store.auxList(user, FR);
  const out: { sub: string; fid: string; at: number; hear: Hear; theirs: Fr }[] = [];
  for (const m of mine) {
    const f = asFr(m.v);
    const sub = m.sk.slice(FR.length);
    if (!f || !sub) continue;
    /* only when they hold their side too: a friendship one side ended is no friendship */
    const theirs = asFr(await store.auxGet(sub, FR + user));
    if (theirs && theirs.fid === f.fid) out.push({ sub, fid: f.fid, at: f.at, hear: isHear(f.hear) ? f.hear : 'live', theirs });
  }
  return out;
}

async function byFid(store: Store, user: string, fid: unknown): Promise<string> {
  if (typeof fid !== 'string' || !fid) throw new FriendError(400, 'Send { fid }.');
  for (const m of await store.auxList(user, FR)) if (asFr(m.v)?.fid === fid) return m.sk.slice(FR.length);
  throw new FriendError(404, 'That friend is not here any more.');
}

/* ---------- the together streak ---------- */

const pair = (a: string, b: string) => (a < b ? { pk: a, sk: TG + b } : { pk: b, sk: TG + a });
const asTogether = (v: unknown): Together => {
  const o = (v || {}) as Partial<Together>;
  return {
    n: typeof o.n === 'number' ? o.n : 0,
    last: typeof o.last === 'string' ? o.last : null,
    best: typeof o.best === 'number' ? o.best : 0,
  };
};
/** the streak, brought up to date from both cards' days in Daybook (and kept when it moved) */
async function together(store: Store, a: string, b: string, ca: FriendCard | null, cb: FriendCard | null): Promise<Together> {
  const k = pair(a, b);
  const old = asTogether(await store.auxGet(k.pk, k.sk));
  const next = togetherStep(old, ca?.od, cb?.od);
  if (next.n !== old.n || next.last !== old.last || next.best !== old.best) await store.auxPut(k.pk, k.sk, next);
  return next;
}

/** everything the Friends page shows */
export async function friendsView(store: Store, user: string, now: number) {
  const me = await card(store, user);
  const inv = (await store.auxGet(user, MYINV)) as { code?: string; exp?: number } | null;
  const invite = inv?.code && inv.exp && inv.exp > now && (await store.auxGet(INVITES, inv.code)) ? { code: inv.code, exp: inv.exp } : null;
  const friends = [];
  for (const f of await friendsOf(store, user)) {
    const c = await card(store, f.sub);
    const cheer = (await store.auxGet(user, CHEER + f.sub)) as Cheer | null;
    const sent = (await store.auxGet(f.sub, CHEER + user)) as Cheer | null;
    const tg = await together(store, user, f.sub, me, c);
    /* the days of the last week both were in (only days, never which of them was in alone) */
    const week = togetherWeek(me?.od, c?.od).filter((d) => !me?.vals.dk || d > addDays(me.vals.dk, -7));
    friends.push({
      fid: f.fid,
      since: f.at,
      hear: f.hear,
      ...(c ? cardForFriend(c, now) : { name: 'Friend', vals: {}, rt: null }),
      together: tg,
      week,
      ...(cheer && isCheer(cheer.k) && typeof cheer.at === 'number' && (cheer.used || now - cheer.at < SPARK_KEEP)
        ? { cheer: { k: cheer.k, at: cheer.at, ...(cheer.used ? { used: cheer.used } : {}) } }
        : {}),
      ...(sent && typeof sent.at === 'number' ? { sent: sent.at, ...(sent.used ? { sentUsed: sent.used } : {}) } : {}),
    });
  }
  return { me: me ? { name: me.name, on: me.on, rt: me.rt, hn: me.hn || 'live' } : null, invite, friends };
}

export async function saveCard(store: Store, user: string, raw: unknown, now: number): Promise<FriendCard> {
  const c = normCard(raw);
  if (!c) throw new FriendError(400, 'Those words cannot be shared. Try others.');
  const kept = { ...c, at: Math.min(c.at || now, now) };
  if (!(await store.useAllowance(user, utcDay(now), JSON.stringify(kept).length, 20_000_000)))
    throw new FriendError(429, 'That is more than a day allows. It will work again tomorrow.');
  const old = await card(store, user);
  await store.auxPut(user, CARD, kept);
  /* what they did since the last card, today: a lesson, or the check-in. Friends who hear as it happens are told (within the caps). */
  const dk = kept.vals.dk;
  const was = old && old.vals.dk === dk ? old.vals : {};
  const did: FriendNote | null = dk && (kept.vals.dl || 0) > (was.dl || 0) ? 'lesson' : dk && kept.vals.dc && !was.dc ? 'checkin' : null;
  if (did) {
    for (const f of await friendsOf(store, user)) {
      if ((f.theirs.hear || 'live') !== 'live') continue;
      await together(store, user, f.sub, kept, await card(store, f.sub));
      await notify(store, f.sub, user, kept.name, did, now);
    }
  }
  return kept;
}

/* ---------- live notes ---------- */

type PushRow = { token?: string; tz?: number };
type PushDay = { d?: string; n?: number; from?: Record<string, number> };

/** one note to a friend's phone, when they have one and it fits the caps: none in their quiet hours, at most LIVE_CAP a day in all,
    and at most one about what each friend did. A spark and its receipt are rare (one a day), so they skip the per-friend count. */
async function notify(store: Store, to: string, from: string, name: string, kind: FriendNote, now: number): Promise<boolean> {
  const p = (await store.auxGet(to, PUSH)) as PushRow | null;
  if (!p?.token || !isPushToken(p.token)) return false;
  const tz = typeof p.tz === 'number' ? p.tz : 0;
  if (quietNow(now, tz)) return false;
  const d = localDay(now, tz);
  const pd = (await store.auxGet(to, PUSHDAY)) as PushDay | null;
  const today = pd?.d === d ? { n: pd.n || 0, from: pd.from || {} } : { n: 0, from: {} as Record<string, number> };
  if (today.n >= LIVE_CAP) return false;
  const activity = kind === 'lesson' || kind === 'checkin';
  if (activity && (today.from[from] || 0) >= LIVE_PER_FRIEND) return false;
  /* the reader's own day: has their lesson been done? Then the note offers a spark; if not, it says theirs is waiting */
  const rc = await card(store, to);
  const readerDone = !!(rc && rc.vals.dk === d && (rc.vals.dl || 0) > 0);
  const w = liveWords(kind, name, readerDone);
  const [r] = await pushSend([{ to: p.token, title: w.title, body: w.body, data: { url: kind === 'spark' ? '/friends?spark=1' : '/friends', friend: '1' } }]);
  if (r === 'gone') {
    await store.auxDel([{ pk: to, sk: PUSH }]);
    return false;
  }
  if (r !== 'ok') return false;
  await store.auxPut(
    to,
    PUSHDAY,
    { d, n: today.n + 1, from: activity ? { ...today.from, [from]: (today.from[from] || 0) + 1 } : today.from },
    { ttl: Math.floor(now / 1000) + 3 * 86400 },
  );
  return true;
}

/** this phone's push token (or none) and its clock's offset from UTC */
export async function savePush(store: Store, user: string, token: unknown, tz: unknown, now: number): Promise<void> {
  if (token == null) {
    await store.auxDel([{ pk: user, sk: PUSH }]);
    return;
  }
  if (!isPushToken(token)) throw new FriendError(400, 'That is not a push token.');
  const off = typeof tz === 'number' && Number.isInteger(tz) && Math.abs(tz) <= 14 * 60 ? tz : 0;
  await store.auxPut(user, PUSH, { token, tz: off, at: now });
}

/** how I hear about one friend */
export async function setHear(store: Store, user: string, fid: unknown, hear: unknown): Promise<{ hear: Hear }> {
  if (!isHear(hear)) throw new FriendError(400, 'Pick live, daily or off.');
  const them = await byFid(store, user, fid);
  const mine = asFr(await store.auxGet(user, FR + them));
  if (!mine) throw new FriendError(404, 'That friend is not here any more.');
  await store.auxPut(user, FR + them, { ...mine, hear });
  return { hear };
}

/** the spark from that friend went into my lesson: kept as used, and they are told (once) */
export async function sparkUsedBy(store: Store, user: string, fid: unknown, now: number): Promise<{ ok: true }> {
  const them = await byFid(store, user, fid);
  const ch = (await store.auxGet(user, CHEER + them)) as Cheer | null;
  if (!ch?.at || ch.used || ch.k !== SPARK || now - ch.at > SPARK_KEEP) return { ok: true };
  await store.auxPut(user, CHEER + them, { ...ch, used: now });
  const me = await card(store, user);
  const f = (await friendsOf(store, user)).find((x) => x.sub === them);
  if (me && f && (f.theirs.hear || 'live') === 'live') await notify(store, them, user, me.name, 'back', now);
  return { ok: true };
}

function newCode(): string {
  let s = '';
  for (let i = 0; i < CODE_LEN; i++) s += CODE_ABC[randomInt(CODE_ABC.length)];
  return s;
}

export async function makeInvite(store: Store, user: string, fresh: boolean, now: number): Promise<{ code: string; exp: number }> {
  if (!(await card(store, user))) throw new FriendError(400, 'Add the name your friends will see first.');
  const old = (await store.auxGet(user, MYINV)) as { code?: string; exp?: number } | null;
  if (!fresh && old?.code && old.exp && old.exp > now + 3600_000 && (await store.auxGet(INVITES, old.code))) return { code: old.code, exp: old.exp };
  if (old?.code) await store.auxDel([{ pk: INVITES, sk: old.code }]);
  const exp = now + INVITE_DAYS * 86400_000;
  for (let i = 0; i < 8; i++) {
    const code = newCode();
    if (await store.auxPut(INVITES, code, { sub: user }, { ttl: Math.floor(exp / 1000), fresh: true })) {
      await store.auxPut(user, MYINV, { code, exp }, { ttl: Math.floor(exp / 1000) });
      return { code, exp };
    }
  }
  throw new Error('no free code');
}

/** whose code this is; counts against the day's lookups */
async function codeOwner(store: Store, user: string, raw: unknown, now: number): Promise<string> {
  /* its own small allowance, beside the day's writes (a partition of its own that removes itself two days later) */
  if (!(await store.useAllowance(user + '#look', utcDay(now), 1, LOOKS_A_DAY)))
    throw new FriendError(429, 'That is a lot of codes for one day. Try again tomorrow.');
  const code = normCode(raw);
  const row = code ? ((await store.auxGet(INVITES, code)) as { sub?: string } | null) : null;
  if (!row?.sub) throw new FriendError(404, NO_CODE);
  return row.sub;
}

const blocked = async (store: Store, a: string, b: string) => !!(await store.auxGet(a, BLOCK + b)) || !!(await store.auxGet(b, BLOCK + a));

export async function lookCode(store: Store, user: string, raw: unknown, now: number): Promise<{ name: string; self?: true; already?: true }> {
  const owner = await codeOwner(store, user, raw, now);
  if (owner === user) return { name: (await card(store, user))?.name || 'You', self: true };
  /* a block is never told: the code simply does not work */
  if (await blocked(store, user, owner)) throw new FriendError(404, NO_CODE);
  const c = await card(store, owner);
  if (!c) throw new FriendError(404, NO_CODE);
  const already = !!(await store.auxGet(user, FR + owner));
  return { name: c.name, ...(already ? { already: true as const } : {}) };
}

export async function acceptCode(store: Store, user: string, raw: unknown, now: number, hear?: unknown): Promise<{ fid: string; name: string }> {
  if (!(await card(store, user))) throw new FriendError(400, 'Add the name your friends will see first.');
  const owner = await codeOwner(store, user, raw, now);
  if (owner === user) throw new FriendError(400, 'That is your own code. Send it to a friend.');
  if (await blocked(store, user, owner)) throw new FriendError(404, NO_CODE);
  const theirs = await card(store, owner);
  if (!theirs) throw new FriendError(404, NO_CODE);
  const mine = asFr(await store.auxGet(user, FR + owner));
  if (mine) return { fid: mine.fid, name: theirs.name };
  if ((await store.auxList(user, FR)).length >= FRIENDS_MAX)
    throw new FriendError(409, `You have ${FRIENDS_MAX} friends here, the most Daybook keeps. Remove one first.`);
  if ((await store.auxList(owner, FR)).length >= FRIENDS_MAX) throw new FriendError(409, 'Their circle is full right now.');
  const fid = randomBytes(9).toString('base64url');
  /* how each hears about the other: the code's owner chose when they made it (their card), the one accepting chose on the way in */
  await store.auxPut(owner, FR + user, { fid, at: now, hear: theirs.hn || 'live' });
  await store.auxPut(user, FR + owner, { fid, at: now, hear: isHear(hear) ? hear : 'live' });
  return { fid, name: theirs.name };
}

export async function sendCheer(store: Store, user: string, fid: unknown, k: unknown, now: number): Promise<{ at: number }> {
  if (!isCheer(k)) throw new FriendError(400, 'Pick one of the encouragements.');
  const them = await byFid(store, user, fid);
  if (!(await friendsOf(store, user)).some((f) => f.sub === them)) throw new FriendError(404, 'That friend is not here any more.');
  const last = (await store.auxGet(them, CHEER + user)) as Cheer | null;
  if (last?.at && now - last.at < CHEER_GAP) throw new FriendError(429, 'You already sent one today. It is waiting for them.');
  await store.auxPut(them, CHEER + user, { k: k as CheerKind, at: now });
  if (k === SPARK) {
    const f = (await friendsOf(store, user)).find((x) => x.sub === them);
    const me = await card(store, user);
    if (me && f && (f.theirs.hear || 'live') !== 'off') await notify(store, them, user, me.name, 'spark', now);
  }
  return { at: now };
}

/** ends a friendship on both sides, with whatever passed between them. The other person is not told. */
async function unfriend(store: Store, user: string, them: string) {
  await store.auxDel([
    { pk: user, sk: FR + them },
    { pk: them, sk: FR + user },
    { pk: user, sk: CHEER + them },
    { pk: them, sk: CHEER + user },
    pair(user, them),
  ]);
}

export async function removeFriend(store: Store, user: string, fid: unknown): Promise<void> {
  await unfriend(store, user, await byFid(store, user, fid));
}

export async function blockFriend(store: Store, user: string, fid: unknown, why: unknown, now: number): Promise<void> {
  const them = await byFid(store, user, fid);
  if (why != null) {
    if (!isReportWhy(why)) throw new FriendError(400, 'Pick a reason.');
    /* the name they had shared, as it was, so the owner can see what was reported */
    const c = await card(store, them);
    await store.auxPut(REPORTS, now + '/' + user, { from: user, about: them, why, name: c?.name || '', at: now });
  }
  await unfriend(store, user, them);
  await store.auxPut(user, BLOCK + them, { at: now });
  await store.auxPut(them, BLOCKED_BY + user, { at: now });
}

/** leaves Friends, or (with the account) everything Friends kept about this person, on both sides */
export async function friendsGone(store: Store, user: string, account: boolean): Promise<void> {
  for (const m of await store.auxList(user, FR)) await unfriend(store, user, m.sk.slice(FR.length));
  /* encouragements still kept from a friendship one side already ended */
  const keys = (await store.auxList(user, CHEER)).map((m) => ({ pk: user, sk: m.sk }));
  const inv = (await store.auxGet(user, MYINV)) as { code?: string } | null;
  if (inv?.code) keys.push({ pk: INVITES, sk: inv.code });
  keys.push({ pk: user, sk: MYINV }, { pk: user, sk: CARD }, { pk: user, sk: PUSH }, { pk: user, sk: PUSHDAY });
  if (account) {
    for (const b of await store.auxList(user, BLOCK)) keys.push({ pk: user, sk: b.sk }, { pk: b.sk.slice(BLOCK.length), sk: BLOCKED_BY + user });
    for (const b of await store.auxList(user, BLOCKED_BY)) keys.push({ pk: user, sk: b.sk }, { pk: b.sk.slice(BLOCKED_BY.length), sk: BLOCK + user });
    /* reports made by this person or about them */
    for (const r of await store.auxList(REPORTS, '')) {
      const v = r.v as { from?: string; about?: string } | null;
      if (v?.from === user || v?.about === user) keys.push({ pk: REPORTS, sk: r.sk });
    }
  }
  await store.auxDel(keys);
}
