/* The device side of sync (@daybook/core sync.ts) against the real sync handler, with an in-memory table: two devices of
   one person, and a second person who must never see the first one's log. */
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import * as core from '@daybook/core';
import type { Dirty, Snapshot, SyncRecord, SyncTransport } from '@daybook/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { MemoryStore } from '../src/store';
import { makeHandler } from '../src/sync';
import { supporters, TIP } from './helpers';

let serverNow = 2_000_000_000_000;
let store: MemoryStore;
let handler: ReturnType<typeof makeHandler>;

function transport(user: string): SyncTransport & { calls: number } {
  const call = async (method: string, query?: Record<string, string>, body?: unknown) => {
    t.calls++;
    const r = await handler({
      requestContext: { http: { method }, authorizer: { jwt: { claims: { sub: user }, scopes: [] } } },
      queryStringParameters: query,
      body: body === undefined ? undefined : JSON.stringify(body),
      isBase64Encoded: false,
    } as unknown as APIGatewayProxyEventV2WithJWTAuthorizer);
    const out = JSON.parse(r.body as string);
    if (r.statusCode !== 200) throw new Error(out.error);
    return out;
  };
  const t = {
    calls: 0,
    pull: (since: number, cursor: string | null) => call('GET', { since: String(since), ...(cursor ? { cursor } : {}) }),
    push: (records: SyncRecord[]) => call('POST', undefined, { records }),
  };
  return t;
}

/** a device: its log, its dirty list, and where its last pull ended. sync() is what the app's sync controller does. */
class Device {
  snap: Snapshot = { settings: null, days: {}, reviews: {} };
  dirty: Dirty = {};
  since = 0;
  constructor(public t: SyncTransport) {}
  /** a change made on the device, the way the app's store records it */
  change(fn: (s: Snapshot) => Snapshot, at: number) {
    const before = this.snap;
    const next = fn(before);
    const ids: core.RecordId[] = [];
    if (next.settings !== before.settings) ids.push('settings');
    for (const k of new Set([...Object.keys(before.days), ...Object.keys(next.days)])) if (before.days[k] !== next.days[k]) ids.push(`days/${k}`);
    const [ja, jb] = [before.journal || {}, next.journal || {}];
    for (const k of new Set([...Object.keys(ja), ...Object.keys(jb)])) if (ja[k] !== jb[k]) ids.push(`journal/${k}`);
    this.snap = next;
    for (const id of ids) {
      const r = core.recordOf(next, id);
      this.dirty[id] = (r && 'u' in r && r.u) || at;
    }
  }
  async sync() {
    const p = await core.pullAll(this.t, this.since);
    const m = core.mergeRemote(this.snap, this.dirty, p.records);
    this.snap = m.snap;
    this.dirty = m.dirty;
    this.since = p.now;
    const res = await core.pushAll(this.t, core.pendingRecords(this.snap, this.dirty));
    this.dirty = core.clearAcked(this.dirty, res.acked);
    return res;
  }
}

const st = (u: number, goal = 'Quit') => ({ ...core.normSettings({ start: '2026-10-01', day1: '2026-10-08', rollover: 4, screensOff: '23:00', u }), goal, u });
const addRode = (s: Snapshot, k: string, at: number): Snapshot => ({ ...s, days: core.addEvent(s.days, k, 'rode', '22:00', {}, at).days });

beforeEach(() => {
  serverNow = 2_000_000_000_000;
  store = supporters(new MemoryStore());
  handler = makeHandler(store, () => serverNow);
});

describe('two devices of one person', () => {
  it('a change on one shows up on the other, and nothing is sent twice', async () => {
    const a = new Device(transport('alice'));
    const b = new Device(transport('alice'));
    a.change((s) => ({ ...s, settings: st(serverNow - 5000) }), serverNow - 5000);
    a.change((s) => addRode(s, '2026-10-10', serverNow - 4000), serverNow - 4000);
    const r = await a.sync();
    expect(r.saved).toBe(2);
    expect(a.dirty).toEqual({});
    serverNow += 1000;
    await b.sync();
    expect(b.snap.days['2026-10-10'].events.length).toBe(1);
    expect(b.snap.settings?.goal).toBe('Quit');
    expect(b.dirty).toEqual({});
    serverNow += 1000;
    const again = await a.sync();
    expect(again.saved).toBe(0);
  });

  it('the day’s feeling (How are you feeling today?) goes to the other device with the day', async () => {
    const a = new Device(transport('alice'));
    const b = new Device(transport('alice'));
    a.change((s) => ({ ...s, settings: st(serverNow - 5000) }), serverNow - 5000);
    a.change(
      (s) => ({ ...s, days: core.withDay(s.days, '2026-10-10', core.dayFeelSet(s.days['2026-10-10'], '2026-10-10', 4, serverNow - 4000)) }),
      serverNow - 4000,
    );
    await a.sync();
    serverNow += 1000;
    await b.sync();
    expect(core.dayFeelOf(b.snap.days['2026-10-10'])).toEqual({ n: 4, w: 'Good', at: serverNow - 5000 });
    expect(core.dayFeelDue(b.snap.days, b.snap.settings, '2026-10-10')).toBe(false);
  });

  it('the later change wins, on each record', async () => {
    const a = new Device(transport('alice'));
    const b = new Device(transport('alice'));
    a.change((s) => ({ ...s, settings: st(100, 'old') }), 100);
    await a.sync();
    await b.sync();
    /* both change the settings while apart; b changed it later */
    a.change((s) => ({ ...s, settings: st(200, 'from a') }), 200);
    b.change((s) => ({ ...s, settings: st(300, 'from b') }), 300);
    /* and each logs a different day */
    a.change((s) => addRode(s, '2026-10-11', 210), 210);
    b.change((s) => addRode(s, '2026-10-12', 310), 310);
    serverNow += 1000;
    await a.sync();
    serverNow += 1000;
    await b.sync();
    serverNow += 1000;
    await a.sync();
    for (const d of [a, b]) {
      expect(d.snap.settings?.goal).toBe('from b');
      expect(Object.keys(d.snap.days).sort()).toEqual(['2026-10-11', '2026-10-12']);
      expect(d.dirty).toEqual({});
    }
  });

  it('keep the run or start fresh: the answer on a slip goes across, and the later change wins', async () => {
    const k = '2026-10-15';
    const a = new Device(transport('alice'));
    const b = new Device(transport('alice'));
    a.change((s) => ({ ...s, days: core.addEvent(s.days, k, 'slipped', '22:00', { id: 's1', keep: true }, 100).days }), 100);
    await a.sync();
    serverNow += 1000;
    await b.sync();
    expect(b.snap.days[k].events[0].keep).toBe(true);
    b.change((s) => ({ ...s, days: core.patchEvent(s.days, k, 's1', { keep: false }, 300) }), 300);
    serverNow += 1000;
    await b.sync();
    serverNow += 1000;
    await a.sync();
    for (const d of [a, b]) expect(d.snap.days[k].events[0].keep).toBe(false);
  });

  it('the minutes waited before a slip go across with it', async () => {
    const k = '2026-10-16';
    const a = new Device(transport('alice'));
    const b = new Device(transport('alice'));
    a.change((s) => ({ ...s, days: core.addEvent(s.days, k, 'slipped', '22:00', { id: 's2', ...core.rkWaitFields(12) }, 100).days }), 100);
    await a.sync();
    serverNow += 1000;
    await b.sync();
    expect(b.snap.days[k].events[0].wm).toBe(12);
    expect(b.snap.days[k].events[0].wt).toBe(10);
  });

  it('the feelings named after a slip, and the plan made from them, go across with it', async () => {
    const k = '2026-10-17';
    const a = new Device(transport('alice'));
    const b = new Device(transport('alice'));
    const plan = { ...core.newTalk(150), p: 'change' as const, pr: 1 as const, n: 'close' as const, m: ['text'] as core.TalkMove[], mo: 'late', fw: 'Lonely' };
    a.change(
      (s) => ({ ...s, days: core.saveTalk(core.addEvent(s.days, k, 'slipped', '22:00', { id: 's3', fb: 'Lonely', fa: 'flat' }, 100).days, k, plan, 150) }),
      150,
    );
    await a.sync();
    serverNow += 1000;
    await b.sync();
    expect(b.snap.days[k].events[0]).toMatchObject({ fb: 'Lonely', fa: 'flat' });
    expect(core.talksOf(b.snap.days)[0].talk.fw).toBe('Lonely');
  });

  it('an older app version that changes a day never takes away what only a newer version can see', async () => {
    const k = '2026-10-18';
    const a = new Device(transport('alice'));
    const old = new Device(transport('alice'));
    const c = new Device(transport('alice'));
    const plan = {
      ...core.newTalk(150),
      p: 'change' as const,
      pr: 1 as const,
      n: 'close' as const,
      m: ['text'] as core.TalkMove[],
      mo: 'late',
      ft: 'lonely' as const,
    };
    a.change((s) => ({ ...s, settings: st(90) }), 90);
    a.change(
      (s) => ({ ...s, days: core.saveTalk(core.addEvent(s.days, k, 'slipped', '23:00', { id: 's9', trigger: 'lonely', fa: 'flat' }, 100).days, k, plan, 150) }),
      150,
    );
    await a.sync();
    serverNow += 1000;
    await old.sync();
    /* the older version reads the day through its own normDay, which has never heard of fa, pr or ft */
    const seen = old.snap.days[k];
    old.snap = {
      ...old.snap,
      days: {
        ...old.snap.days,
        [k]: {
          ...seen,
          events: seen.events.map(({ fa: _fa, fb: _fb, ...e }) => e),
          p: seen.p && { ...seen.p, tt: seen.p.tt?.map(({ pr: _pr, ft: _ft, fw: _fw, ...t }) => t) },
        },
      },
    };
    /* and then logs an urge ridden out on that day, which sends the whole day as it sees it */
    old.change((s) => addRode(s, k, serverNow + 10), serverNow + 10);
    serverNow += 1000;
    await old.sync();
    serverNow += 1000;
    await a.sync();
    const day = a.snap.days[k];
    expect(day.events.map((e) => e.outcome).sort()).toEqual(['rode', 'slipped']);
    expect(day.events.find((e) => e.id === 's9')).toMatchObject({ fa: 'flat', trigger: 'lonely' });
    expect(core.talksOf(a.snap.days)[0].talk).toMatchObject({ pr: 1, ft: 'lonely' });
    /* the mended day went back to the account, so a third device gets all of it */
    expect(a.dirty).toEqual({});
    serverNow += 1000;
    await c.sync();
    expect(c.snap.days[k].events.find((e) => e.id === 's9')?.fa).toBe('flat');
    expect(core.talksOf(c.snap.days)[0].talk.ft).toBe('lonely');
    expect(c.snap.days[k].events.length).toBe(2);
  });

  it('a deleted day stays deleted, and an older copy does not bring it back', async () => {
    const a = new Device(transport('alice'));
    const b = new Device(transport('alice'));
    a.change((s) => ({ ...s, settings: st(100) }), 100);
    a.change((s) => addRode(s, '2026-10-10', 110), 110);
    await a.sync();
    await b.sync();
    const id = b.snap.days['2026-10-10'].events[0].id;
    /* b deletes the only entry, so the day is gone */
    b.change((s) => ({ ...s, days: core.removeEvent(s.days, '2026-10-10', id, 500) }), 500);
    expect(b.snap.days['2026-10-10']).toBeUndefined();
    expect(b.dirty['days/2026-10-10']).toBe(500);
    serverNow += 1000;
    /* before b sends it, it pulls the account's older copy: the deletion here is newer, so the day stays gone */
    await b.sync();
    expect(b.snap.days['2026-10-10']).toBeUndefined();
    serverNow += 1000;
    await a.sync();
    expect(a.snap.days['2026-10-10']).toBeUndefined();
  });

  it('two devices log on the same day while apart: every entry is kept on both', async () => {
    const a = new Device(transport('alice'));
    const b = new Device(transport('alice'));
    a.change((s) => ({ ...s, settings: st(100) }), 100);
    a.change((s) => addRode(s, '2026-10-10', 110), 110);
    await a.sync();
    await b.sync();
    /* apart: a logs an urge ridden out, b logs a slip, on the same day */
    a.change((s) => addRode(s, '2026-10-10', 200), 200);
    b.change((s) => ({ ...s, days: core.addEvent(s.days, '2026-10-10', 'slipped', '23:00', {}, 300).days }), 300);
    serverNow += 1000;
    await a.sync();
    serverNow += 1000;
    await b.sync();
    serverNow += 1000;
    await a.sync();
    for (const d of [a, b]) {
      expect(d.snap.days['2026-10-10'].events.map((e) => e.outcome).sort()).toEqual(['rode', 'rode', 'slipped']);
      expect(d.dirty).toEqual({});
    }
    /* and the newer of the two sends it the other way round too */
    a.change((s) => addRode(s, '2026-10-10', serverNow + 100), serverNow + 100);
    b.change((s) => addRode(s, '2026-10-10', serverNow + 50), serverNow + 50);
    serverNow += 1000;
    await b.sync();
    serverNow += 1000;
    await a.sync();
    serverNow += 1000;
    await b.sync();
    expect(a.snap.days['2026-10-10'].events.length).toBe(5);
    expect(b.snap.days['2026-10-10']).toEqual(a.snap.days['2026-10-10']);
  });

  it('an entry deleted on one device stays deleted when the other logged that day too', async () => {
    const a = new Device(transport('alice'));
    const b = new Device(transport('alice'));
    a.change((s) => ({ ...s, settings: st(100) }), 100);
    a.change((s) => addRode(s, '2026-10-10', 110), 110);
    a.change((s) => addRode(s, '2026-10-10', 120), 120);
    await a.sync();
    await b.sync();
    const gone = a.snap.days['2026-10-10'].events[0].id;
    a.change((s) => ({ ...s, days: core.removeEvent(s.days, '2026-10-10', gone, 200) }), 200);
    /* b, still holding the deleted entry, logs another one later the same day */
    b.change((s) => addRode(s, '2026-10-10', 300), 300);
    serverNow += 1000;
    await a.sync();
    serverNow += 1000;
    await b.sync();
    serverNow += 1000;
    await a.sync();
    for (const d of [a, b]) {
      const ids = d.snap.days['2026-10-10'].events.map((e) => e.id);
      expect(ids).not.toContain(gone);
      expect(ids.length).toBe(2);
    }
  });

  it('an entry put back with Undo is no longer marked deleted', () => {
    const days = core.addEvent({}, '2026-10-10', 'rode', '22:00', {}, 100).days;
    const ev = days['2026-10-10'].events[0];
    const two = core.addEvent(days, '2026-10-10', 'rode', '23:00', {}, 110).days;
    const removed = core.removeEvent(two, '2026-10-10', ev.id, 120);
    expect(removed['2026-10-10'].gone).toEqual([core.goneMark(ev.id)]);
    /* the mark says nothing about the entry: not its id, and not when it was made */
    expect(removed['2026-10-10'].gone![0]).not.toContain(ev.id.slice(0, 6));
    const back = core.addEvent(removed, '2026-10-10', ev.outcome, ev.time, { ...ev }, 130).days;
    expect(back['2026-10-10'].gone).toBeUndefined();
    expect(core.normDay(JSON.parse(JSON.stringify(removed['2026-10-10'])), '2026-10-10').gone).toEqual([core.goneMark(ev.id)]);
  });

  it('what each device earned while apart is kept on both (badges, level, lesson marks)', async () => {
    const a = new Device(transport('alice'));
    const b = new Device(transport('alice'));
    a.change((s) => ({ ...s, settings: st(100) }), 100);
    await a.sync();
    await b.sync();
    const earn = (s: Snapshot, u: number, badge: string, lesson: string): Snapshot => {
      const x = JSON.parse(JSON.stringify(s.settings)) as core.Settings;
      x.seen = {
        badges: [...(x.seen?.badges || []), badge],
        quests: x.seen?.quests || [],
        level: Math.max(x.seen?.level || 1, badge === 'b2' ? 3 : 2),
        full: null,
        lad: core.LADDER_V,
      };
      x.learn.prac = { ...x.learn.prac, [lesson]: true } as typeof x.learn.prac;
      x.u = u;
      return { ...s, settings: x };
    };
    a.change((s) => earn(s, 200, 'b1', 'l1'), 200);
    b.change((s) => earn(s, 300, 'b2', 'l2'), 300);
    serverNow += 1000;
    await a.sync();
    serverNow += 1000;
    await b.sync();
    serverNow += 1000;
    await a.sync();
    for (const d of [a, b]) {
      expect(d.snap.settings?.seen?.badges.sort()).toEqual(['b1', 'b2']);
      expect(d.snap.settings?.seen?.level).toBe(3);
      expect(Object.keys(d.snap.settings?.learn.prac || {}).sort()).toEqual(['l1', 'l2']);
      expect(d.dirty).toEqual({});
    }
  });

  it('erasing from one device clears the others, settings too', async () => {
    const a = new Device(transport('alice'));
    const b = new Device(transport('alice'));
    a.change((s) => ({ ...s, settings: st(100) }), 100);
    a.change((s) => addRode(s, '2026-10-10', 110), 110);
    await a.sync();
    await b.sync();
    serverNow += 1000;
    await handler({
      requestContext: { http: { method: 'DELETE' }, authorizer: { jwt: { claims: { sub: 'alice' }, scopes: [] } } },
    } as unknown as APIGatewayProxyEventV2WithJWTAuthorizer);
    serverNow += 1000;
    await b.sync();
    expect(b.snap.settings).toBeNull();
    expect(b.snap.days).toEqual({});
  });

  it('a change made while a push is out stays dirty', async () => {
    const a = new Device(transport('alice'));
    a.change((s) => ({ ...s, settings: st(100, 'one') }), 100);
    const p = await core.pullAll(a.t, a.since);
    const m = core.mergeRemote(a.snap, a.dirty, p.records);
    a.snap = m.snap;
    a.dirty = m.dirty;
    const res = await core.pushAll(a.t, core.pendingRecords(a.snap, a.dirty));
    /* the person changed it again before the answer came back */
    a.change((s) => ({ ...s, settings: st(200, 'two') }), 200);
    a.dirty = core.clearAcked(a.dirty, res.acked);
    expect(a.dirty.settings).toBe(200);
  });

  it('a long log goes up and comes down in pages', async () => {
    const a = new Device(transport('alice'));
    const b = new Device(transport('alice'));
    a.change((s) => ({ ...s, settings: st(100) }), 100);
    let k = '2024-01-01';
    for (let i = 0; i < 700; i++) {
      const key = k;
      a.change((s) => addRode(s, key, 1000 + i), 1000 + i);
      k = core.addDays(k, 1);
    }
    const r = await a.sync();
    expect(r.saved).toBe(701);
    serverNow += 1000;
    const tb = b.t as ReturnType<typeof transport>;
    await b.sync();
    expect(Object.keys(b.snap.days).length).toBe(700);
    expect(tb.calls).toBeGreaterThanOrEqual(2);
  });

  it('a record the account will never take is let go and reported', async () => {
    const a = new Device(transport('alice'));
    a.change((s) => ({ ...s, settings: st(100) }), 100);
    a.change((s) => addRode(s, '2026-10-10', 110), 110);
    /* a day too large for the account: 200 entries with long notes */
    const ev = { ...a.snap.days['2026-10-10'].events[0], note: 'x'.repeat(500) };
    a.snap.days['2026-10-10'] = { ...a.snap.days['2026-10-10'], events: Array.from({ length: 200 }, (_, i) => ({ ...ev, id: 'e' + i })) };
    const r = await a.sync();
    expect(r.refused.map((x) => x.id)).toEqual(['days/2026-10-10']);
    expect(r.clock).toEqual([]);
    expect(a.dirty).toEqual({});
  });

  it('a change stamped while the clock was ahead waits, then goes with the account’s time once the clock is right', async () => {
    const a = new Device(transport('alice'));
    a.change((s) => ({ ...s, settings: st(100) }), 100);
    a.change((s) => addRode(s, '2026-10-10', 110), 110);
    /* a broken clock: a change time two days ahead of the server */
    const ahead = serverNow + 2 * 86400_000;
    a.dirty['days/2026-10-10'] = ahead;
    a.snap.days['2026-10-10'] = { ...a.snap.days['2026-10-10'], u: ahead };
    const r = await a.sync();
    expect(r.clock).toEqual(['days/2026-10-10']);
    expect(r.refused).toEqual([]);
    expect(a.dirty['days/2026-10-10']).toBe(ahead);
    /* the clock is right again: the record takes the account's time and is saved */
    const m = core.restampRecords(a.snap, a.dirty, r.clock, r.now);
    a.snap = m.snap;
    a.dirty = m.dirty;
    expect(a.snap.days['2026-10-10'].u).toBe(r.now);
    const again = await a.sync();
    expect(again.saved).toBe(1);
    expect(a.dirty).toEqual({});
  });
});

describe('two people', () => {
  it('never see each other’s log', async () => {
    const a = new Device(transport('alice'));
    const e = new Device(transport('eve'));
    a.change((s) => ({ ...s, settings: st(100, 'alice goal') }), 100);
    a.change((s) => addRode(s, '2026-10-10', 110), 110);
    a.change((s) => ({ ...s, journal: core.jnStart(s.journal || {}, '2026-10-10', 'Hopeful', 120).jn }), 120);
    await a.sync();
    serverNow += 1000;
    await e.sync();
    expect(e.snap).toEqual({ settings: null, days: {}, reviews: {}, journal: {} });
  });
});

describe('the journal', () => {
  it('two devices writing on the same day keep both entries, an edit wins by its time, and a deletion reaches the other', async () => {
    const a = new Device(transport('alice'));
    const b = new Device(transport('alice'));
    let ia = '';
    let ib = '';
    a.change((s) => {
      const r = core.jnStart(s.journal || {}, '2026-10-10', 'Calm', 200);
      ia = r.id;
      return { ...s, journal: core.jnEdit(r.jn, r.id, { t: 'A quiet morning.' }, 201) };
    }, 201);
    b.change((s) => {
      const r = core.jnStart(s.journal || {}, '2026-10-10', 'Proud', 210);
      ib = r.id;
      return { ...s, journal: r.jn };
    }, 210);
    await a.sync();
    serverNow += 1000;
    await b.sync();
    serverNow += 1000;
    await a.sync();
    expect(Object.keys(a.snap.journal!).sort()).toEqual([ia, ib].sort());
    expect(b.snap.journal![ia].t).toBe('A quiet morning.');
    b.change((s) => ({ ...s, journal: core.jnEdit(s.journal!, ia, { t: 'A quiet morning, and a long walk.' }, serverNow) }), serverNow);
    a.change((s) => ({ ...s, journal: core.jnRemove(s.journal!, ib) }), serverNow + 1);
    await b.sync();
    serverNow += 1000;
    await a.sync();
    serverNow += 1000;
    await b.sync();
    expect(a.snap.journal![ia].t).toBe('A quiet morning, and a long walk.');
    expect(Object.keys(b.snap.journal!)).toEqual([ia]);
  });
});

describe('the first sign-in on a device', () => {
  it('tells a real log from a new one', () => {
    const fresh: Snapshot = { settings: st(1), days: {}, reviews: {} };
    expect(core.hasLog(fresh)).toBe(false);
    const recs: SyncRecord[] = [{ id: 'days/2026-10-10', u: 5, data: null }];
    expect(core.accountHasLog(recs)).toBe(false);
  });
  /* what the app's combine does (lib/sync.tsx): this device's settings first when they win, every record marked to send,
     then the account's records merged, then a round */
  async function join(d: Device, recs: SyncRecord[]) {
    const j = core.joinRecords(d.snap, recs);
    if (j.mine) d.snap = { ...d.snap, settings: j.mine };
    d.dirty = core.allDirty(d.snap, d.dirty);
    const m = core.mergeRemote(d.snap, d.dirty, j.recs);
    d.snap = m.snap;
    d.dirty = m.dirty;
    await d.sync();
  }
  /* sixty days on the phone: Day 1, graduation, a practiced lesson, the person's own reasons */
  function phoneWithLog(d: Device) {
    d.change(
      (s) => ({ ...s, settings: { ...st(100, 'phone'), gradAt: '2026-09-01', reasons: ['My kids'], learn: { ...st(100).learn, prac: { l1: 1 } } } }),
      100,
    );
    let k = '2026-08-01';
    for (let i = 0; i < 60; i++) {
      const key = k;
      d.change((s) => addRode(s, key, 200 + i), 200 + i);
      k = core.addDays(k, 1);
    }
  }

  it('a fresh setup on another device never replaces the settings of a real log', async () => {
    /* the web: a new setup, an account made at its end, nothing logged */
    const web = new Device(transport('alice'));
    web.change((s) => ({ ...s, settings: { ...st(9000, 'web'), start: '2026-10-19', day1: '2026-10-20' } }), 9000);
    await web.sync();
    /* the phone, with its log, signs in afterwards: its settings are older, but they win */
    const phone = new Device(transport('alice'));
    phoneWithLog(phone);
    serverNow += 1000;
    const p = await core.pullAll(phone.t, 0);
    expect(core.accountHasLog(p.records)).toBe(false);
    await join(phone, p.records);
    expect(phone.snap.settings?.goal).toBe('phone');
    expect(phone.snap.settings?.start).toBe('2026-10-01');
    expect(phone.snap.settings?.day1).toBe('2026-10-08');
    expect(phone.snap.settings?.gradAt).toBe('2026-09-01');
    expect(phone.snap.settings?.reasons).toEqual(['My kids']);
    expect(phone.snap.settings?.learn.prac).toEqual({ l1: 1 });
    expect(phone.dirty).toEqual({});
    /* and the web takes them on its next round */
    serverNow += 1000;
    await web.sync();
    expect(web.snap.settings?.goal).toBe('phone');
    expect(web.snap.settings?.start).toBe('2026-10-01');
  });

  it('a new phone that logged one urge never replaces the account’s settings when combining', async () => {
    const old = new Device(transport('alice'));
    phoneWithLog(old);
    await old.sync();
    const fresh = new Device(transport('alice'));
    fresh.change((s) => ({ ...s, settings: { ...st(9000, 'new phone'), start: '2026-10-19', day1: '2026-10-20' } }), 9000);
    fresh.change((s) => addRode(s, '2026-10-19', 9001), 9001);
    serverNow += 1000;
    const p = await core.pullAll(fresh.t, 0);
    expect(core.hasLog(fresh.snap) && core.accountHasLog(p.records)).toBe(true);
    await join(fresh, p.records);
    expect(fresh.snap.settings?.goal).toBe('phone');
    expect(fresh.snap.settings?.gradAt).toBe('2026-09-01');
    expect(Object.keys(fresh.snap.days).length).toBe(61);
    serverNow += 1000;
    await old.sync();
    expect(old.snap.settings?.goal).toBe('phone');
    expect(Object.keys(old.snap.days).length).toBe(61);
  });

  it('what the losing settings earned is kept', () => {
    const own = { ...st(100, 'mine'), gradAt: null, seen: { badges: ['a'], quests: [], level: 3, full: null, lad: 4 } };
    const theirs = { ...st(200, 'theirs'), gradAt: '2026-09-01', seen: { badges: ['b'], quests: [], level: 9, full: null, lad: 4 } };
    const here: Snapshot = { settings: own, days: { '2026-10-10': core.addEvent({}, '2026-10-10', 'rode', '22:00', {}, 50).days['2026-10-10'] }, reviews: {} };
    const j = core.joinRecords(here, [{ id: 'settings', u: 200, data: theirs }]);
    expect(j.recs).toEqual([]);
    expect(j.mine?.goal).toBe('mine');
    expect(j.mine?.gradAt).toBe('2026-09-01');
    expect(j.mine?.seen?.badges.sort()).toEqual(['a', 'b']);
    expect(j.mine?.seen?.level).toBe(9);
    expect(j.mine?.u).toBe(201);
  });

  it('can take the account’s log as it is', async () => {
    const a = new Device(transport('alice'));
    a.change((s) => ({ ...s, settings: st(100, 'account') }), 100);
    a.change((s) => addRode(s, '2026-10-10', 110), 110);
    await a.sync();
    const p = await core.pullAll(transport('alice'), 0);
    const snap = core.snapshotOf(p.records);
    expect(snap.settings?.goal).toBe('account');
    expect(Object.keys(snap.days)).toEqual(['2026-10-10']);
  });
});

describe('a person who is not a supporter yet', () => {
  it('their changes wait on the device, marked to send, and go once a tip is confirmed', async () => {
    const a = new Device(transport('carol'));
    a.change((s) => ({ ...s, settings: st(100, 'mine') }), 100);
    a.change((s) => addRode(s, '2026-10-10', 110), 110);
    await expect(a.sync()).rejects.toThrow(/tip of \$5 or more/);
    /* nothing was lost, and nothing reached the account */
    expect(Object.keys(a.dirty).sort()).toEqual(['days/2026-10-10', 'settings']);
    expect(a.snap.days['2026-10-10'].events.length).toBe(1);
    expect(await store.hasData('carol')).toBe(false);
    /* a tip is confirmed (supporter.test.ts checks how) */
    await store.putSup('carol', TIP);
    serverNow += 1000;
    const r = await a.sync();
    expect(r.saved).toBe(2);
    expect(a.dirty).toEqual({});
    const b = new Device(transport('carol'));
    await b.sync();
    expect(b.snap.settings?.goal).toBe('mine');
  });

  it('support that ended still lets them bring their log to a new phone', async () => {
    const a = new Device(transport('dave'));
    await store.putSup('dave', { since: 1, kind: 'monthly', until: serverNow + 1000, src: 'stripe' });
    a.change((s) => addRode(s, '2026-10-10', 110), 110);
    await a.sync();
    serverNow += 5000;
    const b = new Device(transport('dave'));
    await b.sync().catch(() => undefined);
    expect(b.snap.days['2026-10-10'].events.length).toBe(1);
  });
});
