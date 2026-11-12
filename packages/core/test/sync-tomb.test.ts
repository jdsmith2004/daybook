/* Sync on a weak signal and a day emptied on one device (November 11, 2026): the pieces in sync.ts the app uses. The whole
   story, two devices against the real handler, is services/api/test/sync-fuzz.test.ts. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Snapshot } from '../src/index';

const empty = (): Snapshot => ({ settings: null, days: {}, reviews: {}, journal: {} });
const withEntry = (s: Snapshot, k: string, id: string, at: number): Snapshot => ({ ...s, days: core.addEvent(s.days, k, 'rode', '22:00', { id }, at).days });

describe('a day emptied here', () => {
  it('keeps the marks of what it held until its deletion is sent, and sends them with it', () => {
    let s = withEntry(withEntry(empty(), '2026-10-10', 'a1', 100), '2026-10-10', 'a2', 110);
    s = core.withTombs(s, { ...s, days: core.removeEvent(s.days, '2026-10-10', 'a1', 120) });
    expect(s.tomb).toBeUndefined();
    const before = s;
    s = core.withTombs(before, { ...s, days: core.removeEvent(s.days, '2026-10-10', 'a2', 130) });
    expect(s.days['2026-10-10']).toBeUndefined();
    expect(s.tomb?.['2026-10-10'].sort()).toEqual([core.goneMark('a1'), core.goneMark('a2')].sort());
    const [r] = core.pendingRecords(s, { 'days/2026-10-10': 130 });
    expect(r).toEqual({ id: 'days/2026-10-10', u: 130, data: null, gone: s.tomb!['2026-10-10'] });
    /* once the account has it, the marks are let go */
    expect(core.keepTombs(s.tomb, {})).toEqual({});
    expect(core.keepTombs(s.tomb, { 'days/2026-10-10': 130 })).toBe(s.tomb);
  });

  it('logged on again, the day keeps its deleted entries marked, and an entry put back is not', () => {
    let s = withEntry(withEntry(empty(), '2026-10-10', 'a1', 100), '2026-10-10', 'a2', 101);
    s = core.withTombs(s, { ...s, days: core.removeEvent(s.days, '2026-10-10', 'a1', 120) });
    s = core.withTombs(s, { ...s, days: core.removeEvent(s.days, '2026-10-10', 'a2', 121) });
    s = core.withTombs(s, withEntry(s, '2026-10-10', 'a2', 130));
    expect(s.tomb).toEqual({});
    expect(s.days['2026-10-10'].gone).toEqual([core.goneMark('a1')]);
  });

  it('a deletion with marks keeps what the other device logged that day, and drops what was deleted', () => {
    const here = withEntry(withEntry(empty(), '2026-10-10', 'old', 100), '2026-10-10', 'new', 200);
    const m = core.mergeRemote(here, { 'days/2026-10-10': 200 }, [{ id: 'days/2026-10-10', u: 300, data: null, gone: [core.goneMark('old')] }]);
    expect(m.snap.days['2026-10-10'].events.map((e) => e.id)).toEqual(['new']);
    expect(m.dirty['days/2026-10-10']).toBeGreaterThan(300);
  });

  it('a deletion without marks (everything erased, or an older app) still wins when it is newer', () => {
    const here = withEntry(empty(), '2026-10-10', 'new', 200);
    const m = core.mergeRemote(here, { 'days/2026-10-10': 200 }, [{ id: 'days/2026-10-10', u: 300, data: null }]);
    expect(m.snap.days['2026-10-10']).toBeUndefined();
  });

  it('marks read back from storage are cleaned', () => {
    expect(core.cleanTombs({ '2026-10-10': ['gabc', 7, 'not a mark'], nope: ['gabc'] })).toEqual({ '2026-10-10': ['gabc'] });
    expect(core.cleanTombs(null)).toBeUndefined();
    expect(core.normRecord({ id: 'days/2026-10-10', u: 5, data: null, gone: ['gabc', 1] })).toEqual({
      id: 'days/2026-10-10',
      u: 5,
      data: null,
      gone: ['gabc'],
    });
    expect(core.normRecord({ id: 'settings', u: 5, data: null, gone: ['gabc'] })).toEqual({ id: 'settings', u: 5, data: null });
  });
});

describe('sync on a weak signal', () => {
  it('gives a request time for the bytes it carries', () => {
    expect(core.requestTimeout(0)).toBe(20_000);
    expect(core.requestTimeout(core.PUSH_BYTES)).toBe(20_000 + 24_000);
    expect(core.requestTimeout(core.MAX_SETTINGS_BYTES)).toBeGreaterThan(80_000);
  });

  it('marks each batch as sent the moment the account has it', async () => {
    let s = empty();
    for (let i = 0; i < 300; i++)
      s = { ...s, days: core.addEvent(s.days, core.addDays('2025-01-01', i), 'rode', '22:00', { id: 'e' + i, note: 'n'.repeat(400) }, 100).days };
    const recs = core.pendingRecords(s, core.allDirty(s));
    expect(core.batches(recs).length).toBeGreaterThan(1);
    const heard: number[] = [];
    let n = 0;
    const t: core.SyncTransport = {
      pull: async () => ({ records: [], cursor: null, now: 1 }),
      push: async (part) => {
        if (++n === 2) throw new Error('the connection dropped');
        return { saved: part.map((r) => r.id), stale: [], bad: [], now: 1 };
      },
    };
    await expect(core.pushAll(t, recs, (a) => void heard.push(Object.keys(a).length))).rejects.toThrow('dropped');
    expect(heard).toEqual([core.batches(recs)[0].length]);
  });

  it('tells the sync API’s own answer from another page in its place', () => {
    expect(core.isPullPage({ records: [], cursor: null, now: 5 })).toBe(true);
    expect(core.isPullPage({})).toBe(false);
    expect(core.isPullPage({ records: [], cursor: null })).toBe(false);
    expect(core.isPushAnswer({ saved: [], stale: [], bad: [], now: 5 })).toBe(true);
    expect(core.isPushAnswer({ message: 'Not Found' })).toBe(false);
  });
});
