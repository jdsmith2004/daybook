/* The sync fuzz test (the 80 ideas, #16, November 11, 2026): nothing a person earned is ever lost to sync.

   Two devices of one person make random changes (an entry logged, an entry deleted, a badge, a lesson, a level, points)
   while apart, and sync in random orders against the real sync handler, with an in-memory table. A round can be split, so
   the other device's push lands between this one's pull and push (two phones syncing at the same minute), and a push can be
   cut off halfway, with the answer lost after the account saved it (a phone on a weak signal). Each seed is one made-up
   history; a failure names its seed, so it can be run again on its own.

   After every step, and once both devices have settled:
   - every entry logged on either device, and not deleted on purpose, is on both;
   - every badge, lesson mark, level and point either device ever held is on both;
   - a device never holds less of what it earned than it held a step before;
   - both devices end with the same log, and nothing left waiting to send. */
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import * as core from '@daybook/core';
import type { Dirty, Snapshot, SyncRecord, SyncTransport } from '@daybook/core';
import { describe, expect, it } from 'vitest';

import { MemoryStore } from '../src/store';
import { makeHandler } from '../src/sync';
import { supporters } from './helpers';

/** a small seeded random source (mulberry32), so a failing history can be replayed */
function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (n: number) => Math.floor(next() * n),
    pick: <T>(xs: readonly T[]): T => xs[Math.floor(next() * xs.length)],
    chance: (p: number) => next() < p,
  };
}

interface World {
  serverNow: number;
  handler: ReturnType<typeof makeHandler>;
}

/** the real handler, as the app reaches it. `cut` drops a push: 'before' never reaches the account, 'after' is saved there
    but the answer never comes back. Each push is one batch (the app's own batches decide the size). */
function transport(w: World, user: string) {
  const t = {
    cut: null as null | 'before' | 'after',
    async call(method: string, query?: Record<string, string>, body?: unknown) {
      const r = await w.handler({
        requestContext: { http: { method }, authorizer: { jwt: { claims: { sub: user }, scopes: [] } } },
        queryStringParameters: query,
        body: body === undefined ? undefined : JSON.stringify(body),
        isBase64Encoded: false,
      } as unknown as APIGatewayProxyEventV2WithJWTAuthorizer);
      const out = JSON.parse(r.body as string);
      if (r.statusCode !== 200) throw new Error(out.error);
      return out;
    },
    pull(since: number, cursor: string | null) {
      return t.call('GET', { since: String(since), ...(cursor ? { cursor } : {}) });
    },
    async push(records: SyncRecord[]) {
      if (t.cut === 'before') throw new Error('no connection');
      const a = await t.call('POST', undefined, { records });
      if (t.cut === 'after') throw new Error('the answer was lost');
      return a;
    },
  };
  return t as SyncTransport & typeof t;
}

/** what a device holds that counts as earned */
function earnedOf(s: Snapshot) {
  const seen = s.settings?.seen;
  return {
    badges: new Set(seen?.badges || []),
    lessons: new Set(Object.keys(s.settings?.learn.prac || {})),
    level: seen?.level || 1,
    pts: seen?.pts || 0,
  };
}
const entryIds = (s: Snapshot) => new Set(Object.values(s.days).flatMap((d) => d.events.map((e) => e.id)));

/** a device: its log, its dirty list, where its last pull ended, and its own clock (a little off from the account's) */
class Device {
  snap: Snapshot = { settings: null, days: {}, reviews: {}, journal: {} };
  dirty: Dirty = {};
  /** what each waiting change was made from (core baseAfter), as the app's store keeps it */
  base: Dirty = {};
  since = 0;
  n = 0;
  /** what the round in progress pulled and merged (a round split in two: its push comes later) */
  half = false;
  constructor(
    public name: string,
    public w: World,
    public t: ReturnType<typeof transport>,
    public skew: number,
  ) {}
  clock() {
    return this.w.serverNow + this.skew;
  }
  /** a change, the way the app's store records it: the changed records are marked with their change time */
  change(fn: (s: Snapshot) => Snapshot) {
    const before = this.snap;
    /* a day emptied here keeps the marks of what it held until its deletion is sent (as the app's store does) */
    const next = core.withTombs(before, fn(before));
    const ids: core.RecordId[] = [];
    if (next.settings !== before.settings) ids.push('settings');
    for (const k of new Set([...Object.keys(before.days), ...Object.keys(next.days)])) if (before.days[k] !== next.days[k]) ids.push(`days/${k}`);
    this.snap = next;
    this.base = core.baseAfter(before, ids, this.dirty, this.base);
    for (const id of ids) {
      const r = core.recordOf(next, id);
      this.dirty[id] = (r && 'u' in r && r.u) || this.clock();
    }
  }
  /** the first half of a round: pull and merge */
  async pull() {
    const p = await core.pullAll(this.t, this.since);
    const m = core.mergeRemote(this.snap, this.dirty, p.records, this.base);
    this.snap = m.snap;
    this.dirty = m.dirty;
    this.base = m.base;
    this.since = p.now;
    this.half = true;
  }
  /** the second half: push what is waiting, each batch marked as sent the moment the account has it (as the app does) */
  async push() {
    this.half = false;
    try {
      const res = await core.pushAll(this.t, core.pendingRecords(this.snap, this.dirty, this.base), (acked) => this.ack(acked));
      this.ack(res.acked);
    } catch {
      /* the round stopped: what is not acked stays marked, and goes on a later round */
    }
  }
  async round() {
    await this.pull();
    await this.push();
  }
  /** what the account has is no longer waiting, and the marks of a deleted day it has are let go (as the app's store does) */
  ack(acked: Record<string, number>) {
    this.dirty = core.clearAcked(this.dirty, acked);
    this.base = core.keepBase(this.base, this.dirty);
    const tomb = core.keepTombs(this.snap.tomb, this.dirty);
    if (tomb !== this.snap.tomb) this.snap = { ...this.snap, tomb };
  }
}

const SETTINGS = (u: number) =>
  ({ ...core.normSettings({ start: '2026-10-01', day1: '2026-10-08', rollover: 4, screensOff: '23:00', u }), u }) as core.Settings;
const DAYS = ['2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13'];
const BADGES = ['b1', 'b2', 'b3', 'b4', 'b5', 'b6'];
const LESSONS = ['l1', 'l2', 'l3', 'l4', 'l5', 'l6'];

/** one made-up history. Gives back what went wrong, or an empty list. */
async function history(seed: number, steps: number): Promise<string[]> {
  const r = rng(seed);
  const store = supporters(new MemoryStore());
  const w: World = { serverNow: 2_000_000_000_000, handler: null as unknown as World['handler'] };
  w.handler = makeHandler(store, () => w.serverNow);
  const devs = [new Device('a', w, transport(w, 'alice'), r.int(4000) - 2000), new Device('b', w, transport(w, 'alice'), r.int(4000) - 2000)];
  const [a, b] = devs;
  const problems: string[] = [];
  const log: string[] = [];

  /* both start from one synced log, the way a second device joins */
  a.change((s) => ({ ...s, settings: SETTINGS(a.clock()) }));
  await a.round();
  w.serverNow += 1000;
  await b.round();

  /* everything ever logged and earned, on any device, and every entry deleted on purpose */
  const logged = new Set<string>();
  const deleted = new Set<string>();
  const everBadges = new Set<string>();
  const everLessons = new Set<string>();
  let everLevel = 1;
  let everPts = 0;
  const held = new Map(devs.map((d) => [d.name, earnedOf(d.snap)]));

  const earn = (d: Device) =>
    d.change((s) => {
      if (!s.settings) return s;
      const x = JSON.parse(JSON.stringify(s.settings)) as core.Settings;
      const seen = x.seen || { badges: [], quests: [], level: 1, full: null, lad: core.LADDER_V };
      const what = r.int(4);
      if (what === 0) seen.badges = [...new Set([...seen.badges, r.pick(BADGES)])];
      else if (what === 1) x.learn.prac = { ...x.learn.prac, [r.pick(LESSONS)]: true } as typeof x.learn.prac;
      else if (what === 2) seen.level = seen.level + 1;
      else seen.pts = (seen.pts || 0) + 1 + r.int(20);
      x.seen = seen;
      x.u = Math.max(d.clock(), (s.settings.u || 0) + 1);
      return { ...s, settings: x };
    });

  for (let step = 0; step < steps; step++) {
    const d = r.pick(devs);
    const op = r.int(100);
    if (op < 28) {
      const k = r.pick(DAYS);
      const id = `${d.name}${++d.n}s${seed}`;
      d.change((s) => ({
        ...s,
        days: core.addEvent(s.days, k, r.chance(0.8) ? 'rode' : 'slipped', '22:00', { id }, Math.max(d.clock(), (s.days[k]?.u || 0) + 1)).days,
      }));
      logged.add(id);
      log.push(`${d.name} logs ${id} on ${k}`);
    } else if (op < 36) {
      const all = Object.values(d.snap.days).flatMap((day) => day.events.map((e) => [day.d, e.id] as const));
      if (all.length) {
        const [k, id] = r.pick(all);
        d.change((s) => ({ ...s, days: core.removeEvent(s.days, k, id, Math.max(d.clock(), (s.days[k]?.u || 0) + 1)) }));
        deleted.add(id);
        log.push(`${d.name} deletes ${id} on ${k}`);
      }
    } else if (op < 52) {
      earn(d);
      log.push(`${d.name} earns`);
    } else if (op < 72) {
      /* a whole round, or the second half of one already pulled */
      if (d.half) await d.push();
      else await d.round();
      log.push(`${d.name} syncs`);
    } else if (op < 84) {
      if (d.half) await d.push();
      else await d.pull();
      log.push(`${d.name} ${d.half ? 'pulls' : 'pushes'}`);
    } else if (op < 92) {
      d.t.cut = r.chance(0.5) ? 'before' : 'after';
      await d.round();
      d.t.cut = null;
      log.push(`${d.name} syncs, cut off`);
    } else {
      w.serverNow += 1 + r.int(90_000);
      log.push('time passes');
    }
    w.serverNow += 1 + r.int(400);

    for (const x of [a, b]) {
      const e = earnedOf(x.snap);
      e.badges.forEach((v) => everBadges.add(v));
      e.lessons.forEach((v) => everLessons.add(v));
      everLevel = Math.max(everLevel, e.level);
      everPts = Math.max(everPts, e.pts);
      /* a device never holds less of what it earned than it did a step before */
      const was = held.get(x.name)!;
      const fewer = [...was.badges].filter((v) => !e.badges.has(v)).concat([...was.lessons].filter((v) => !e.lessons.has(v)));
      if (fewer.length || e.level < was.level || e.pts < was.pts)
        problems.push(`step ${step}: ${x.name} lost what it earned (${fewer.join(', ') || ''} level ${was.level}→${e.level}, points ${was.pts}→${e.pts})`);
      held.set(x.name, e);
    }
    if (TRACE)
      console.log(
        step,
        log[log.length - 1],
        devs.map((x) => `${x.name}: pts ${earnedOf(x.snap).pts} u ${x.snap.settings?.u} dirty ${JSON.stringify(x.dirty)}`).join(' | '),
        'server',
        JSON.stringify([...store.rows.get('alice')!.values()].filter((x) => x.id === 'settings').map((x) => [x.u, x.d && JSON.parse(x.d).seen?.pts])),
      );
    if (problems.length) break;
  }

  /* both settle: every half round finished, the connection good, a few rounds each way */
  for (let i = 0; i < 4; i++)
    for (const d of devs) {
      w.serverNow += 70_000;
      if (d.half) await d.push();
      await d.round();
    }

  for (const d of devs) {
    const ids = entryIds(d.snap);
    const lost = [...logged].filter((id) => !deleted.has(id) && !ids.has(id));
    if (lost.length) problems.push(`${d.name} lost entries: ${lost.join(', ')}`);
    /* and a deleted entry stays deleted: joining copies never brings one back */
    const back = [...deleted].filter((id) => ids.has(id));
    if (back.length) problems.push(`${d.name} brought back deleted entries: ${back.join(', ')}`);
    const e = earnedOf(d.snap);
    const nb = [...everBadges].filter((v) => !e.badges.has(v));
    const nl = [...everLessons].filter((v) => !e.lessons.has(v));
    if (nb.length) problems.push(`${d.name} lost badges: ${nb.join(', ')}`);
    if (nl.length) problems.push(`${d.name} lost lessons: ${nl.join(', ')}`);
    if (e.level < everLevel) problems.push(`${d.name} level ${e.level} < ${everLevel}`);
    if (e.pts < everPts) problems.push(`${d.name} points ${e.pts} < ${everPts}`);
    if (Object.keys(d.dirty).length) problems.push(`${d.name} still has waiting: ${Object.keys(d.dirty).join(', ')}`);
  }
  const sameLog = (x: Snapshot) =>
    JSON.stringify(
      Object.keys(x.days)
        .sort()
        .map((k) => [k, x.days[k].events.map((e) => e.id).sort()]),
    );
  if (sameLog(a.snap) !== sameLog(b.snap)) problems.push(`the two logs differ: ${sameLog(a.snap)} / ${sameLog(b.snap)}`);
  if (problems.length) problems.push('history: ' + log.slice(-40).join('; '));
  return problems;
}

const TRACE = !!process.env.FUZZ_TRACE;
const SEEDS = Number(process.env.FUZZ_SEEDS || 300);
const STEPS = Number(process.env.FUZZ_STEPS || 80);

describe('sync fuzz: random edits on two devices, synced in random orders', () => {
  it(
    `nothing earned is ever lost (${SEEDS} histories of ${STEPS} steps)`,
    async () => {
      const failed: string[] = [];
      for (let seed = Number(process.env.FUZZ_FROM || 1); seed <= SEEDS; seed++) {
        const p = await history(seed, STEPS);
        if (p.length) failed.push(`seed ${seed}:\n  ` + p.join('\n  '));
        if (failed.length >= 3) break;
      }
      expect(failed.join('\n\n')).toBe('');
    },
    Math.max(120_000, SEEDS * STEPS * 4),
  );
});

/* The histories the fuzz test found, each kept as its own check */
describe('what the fuzz test found', () => {
  const setup = async () => {
    const store = supporters(new MemoryStore());
    const w: World = { serverNow: 2_000_000_000_000, handler: null as unknown as World['handler'] };
    w.handler = makeHandler(store, () => w.serverNow);
    const a = new Device('a', w, transport(w, 'alice'), 0);
    const b = new Device('b', w, transport(w, 'alice'), 0);
    a.change((s) => ({ ...s, settings: SETTINGS(a.clock()) }));
    await a.round();
    w.serverNow += 1000;
    await b.round();
    const tick = () => (w.serverNow += 1000);
    return { a, b, w, store, tick };
  };
  const earnPts = (d: Device, n: number) =>
    d.change((s) => {
      const x = JSON.parse(JSON.stringify(s.settings)) as core.Settings;
      x.seen = { ...(x.seen || { badges: [], quests: [], level: 1, full: null, lad: core.LADDER_V }), pts: (x.seen?.pts || 0) + n };
      x.u = Math.max(d.clock(), (s.settings?.u || 0) + 1);
      return { ...s, settings: x };
    });
  const log = (d: Device, k: string, id: string) =>
    d.change((s) => ({ ...s, days: core.addEvent(s.days, k, 'rode', '22:00', { id }, Math.max(d.clock(), (s.days[k]?.u || 0) + 1)).days }));

  it('a push that lands between the other device’s pull and push is joined, never written over', async () => {
    const { a, b, tick } = await setup();
    log(a, '2026-10-10', 'fromA');
    earnPts(a, 9);
    tick();
    log(b, '2026-10-10', 'fromB');
    earnPts(b, 4);
    tick();
    await b.pull(); /* b pulls first: nothing new yet */
    tick();
    await a.round(); /* a's push lands in between */
    tick();
    await b.push(); /* b's newer copies come in after it */
    tick();
    await a.round();
    await b.round();
    for (const d of [a, b]) {
      expect([...entryIds(d.snap)].sort()).toEqual(['fromA', 'fromB']);
      expect(earnedOf(d.snap).pts).toBe(9);
      expect(d.dirty).toEqual({});
    }
  });

  it('an account copy that does not hold the change is never taken as "the account has it"', async () => {
    const { a, b, tick } = await setup();
    earnPts(b, 3);
    tick();
    await a.pull();
    tick();
    earnPts(a, 9); /* a earns after its pull, then b's newer settings land first */
    tick();
    await b.round();
    tick();
    await a.push();
    expect(a.dirty).toEqual({});
    tick();
    await a.round();
    await b.round();
    for (const d of [a, b]) expect(earnedOf(d.snap).pts).toBe(9);
  });

  it('a day emptied on one device keeps the entry another device logged there meanwhile', async () => {
    const { a, b, tick } = await setup();
    log(a, '2026-10-10', 'first');
    await a.round();
    tick();
    await b.round();
    /* apart: a deletes the day's only entry, so the day leaves its log; b logs another entry that day */
    tick();
    a.change((s) => ({ ...s, days: core.removeEvent(s.days, '2026-10-10', 'first', Math.max(a.clock(), (s.days['2026-10-10']?.u || 0) + 1)) }));
    expect(a.snap.days['2026-10-10']).toBeUndefined();
    tick();
    log(b, '2026-10-10', 'later');
    /* the deletion is newer, and reaches the account first */
    a.skew = 5000;
    a.change((s) => s);
    await a.round();
    tick();
    await b.round();
    tick();
    await a.round();
    for (const d of [a, b]) {
      expect(d.snap.days['2026-10-10'].events.map((e) => e.id)).toEqual(['later']);
      expect(d.dirty).toEqual({});
    }
  });

  it('a day emptied and logged on again keeps its deleted entry deleted', async () => {
    const { a, b, tick } = await setup();
    log(a, '2026-10-10', 'old');
    await a.round();
    tick();
    await b.round();
    tick();
    a.change((s) => ({ ...s, days: core.removeEvent(s.days, '2026-10-10', 'old', Math.max(a.clock(), (s.days['2026-10-10']?.u || 0) + 1)) }));
    tick();
    log(a, '2026-10-10', 'new');
    tick();
    log(b, '2026-10-10', 'other'); /* b still holds the deleted entry */
    tick();
    await a.round();
    tick();
    await b.round();
    tick();
    await a.round();
    for (const d of [a, b]) expect(d.snap.days['2026-10-10'].events.map((e) => e.id).sort()).toEqual(['new', 'other']);
  });

  it('an Undo that takes back what a mistaken log earned stays taken back once it syncs', async () => {
    const { a, b, tick } = await setup();
    const badge = (d: Device, on: boolean) =>
      d.change((s) => {
        const x = JSON.parse(JSON.stringify(s.settings)) as core.Settings;
        const seen = x.seen || { badges: [], quests: [], level: 1, full: null, lad: core.LADDER_V };
        seen.badges = on ? [...seen.badges, 'honest'] : seen.badges.filter((v) => v !== 'honest');
        x.seen = seen;
        x.u = Math.max(d.clock(), (s.settings?.u || 0) + 1);
        return { ...s, settings: x };
      });
    badge(a, true);
    await a.round();
    tick();
    /* the Undo, made on top of the copy the account holds */
    badge(a, false);
    await a.round();
    tick();
    await b.round();
    for (const d of [a, b]) expect(earnedOf(d.snap).badges.has('honest')).toBe(false);
  });

  it('a phone whose clock is behind, logging again on a day just emptied, keeps its entry', async () => {
    const { a, b, tick } = await setup();
    log(b, '2026-10-11', 'x');
    await b.round();
    tick();
    await a.round();
    /* a is far behind: its new copy of the day is stamped below the account's */
    a.skew = -600_000;
    a.change((s) => ({ ...s, days: core.removeEvent(s.days, '2026-10-11', 'x', a.clock()) }));
    await a.round();
    tick();
    log(a, '2026-10-11', 'y');
    expect(a.snap.days['2026-10-11'].u).toBeLessThan(a.w.serverNow);
    await a.round();
    tick();
    await b.round();
    for (const d of [a, b]) expect(d.snap.days['2026-10-11'].events.map((e) => e.id)).toEqual(['y']);
  });

  it('everything erased still wins over a change waiting on another device', async () => {
    const { a, b, w, tick } = await setup();
    log(a, '2026-10-10', 'x');
    await a.round();
    tick();
    await b.round();
    log(b, '2026-10-11', 'y');
    tick();
    await w.handler({
      requestContext: { http: { method: 'DELETE' }, authorizer: { jwt: { claims: { sub: 'alice' }, scopes: [] } } },
    } as unknown as APIGatewayProxyEventV2WithJWTAuthorizer);
    tick();
    await a.round();
    expect(a.snap.days).toEqual({});
    expect(a.snap.settings).toBeNull();
  });

  it('a push cut off halfway keeps what got through, and the next round sends only the rest', async () => {
    const { a, b, tick } = await setup();
    /* enough for several requests: 200 days, each with a long note */
    for (let i = 0; i < 200; i++) {
      const k = core.addDays('2026-01-01', i);
      a.change((s) => ({ ...s, days: core.addEvent(s.days, k, 'rode', '22:00', { id: 'e' + i, note: 'n'.repeat(4000) }, a.clock()).days }));
    }
    const sent: number[] = [];
    let calls = 0;
    const push = a.t.push.bind(a.t);
    a.t.push = async (recs) => {
      sent.push(recs.length);
      if (++calls === 2) throw new Error('the connection dropped');
      return push(recs);
    };
    const total = Object.keys(a.dirty).length;
    await a.round();
    const left = Object.keys(a.dirty).length;
    expect(left).toBeGreaterThan(0);
    expect(left).toBeLessThan(total);
    sent.length = 0;
    tick();
    await a.round();
    expect(sent.length).toBeGreaterThan(0);
    expect(sent.reduce((x, y) => x + y, 0)).toBe(left);
    expect(a.dirty).toEqual({});
    tick();
    await b.round();
    expect(Object.keys(b.snap.days).length).toBe(200);
  });
});
