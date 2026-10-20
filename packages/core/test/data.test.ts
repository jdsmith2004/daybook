import { describe, expect, it } from 'vitest';
import * as core from '../src/index';

const snap = (): core.Snapshot => ({
  settings: core.normSettings({ start: '2026-09-20', u: 100 }),
  days: { '2026-10-01': core.normDay({ events: [{ id: 'a', time: '22:00', outcome: 'rode' }], u: 100 }, '2026-10-01') },
  reviews: {},
});

describe('backups', () => {
  it('reads a backup the legacy app saved, and drops what is not valid', () => {
    const text = JSON.stringify({
      app: 'daybook',
      v: 1,
      exportedAt: '2026-10-15T00:00:00Z',
      settings: { start: '2026-09-01', cleanMode: 'step' },
      days: {
        '2026-09-05': { events: [{ id: 'x', time: '23:10', outcome: 'slipped', wt: 10 }] },
        '2026-09-06': { events: [] },
        'not-a-day': { events: [{ id: 'y', outcome: 'rode' }] },
      },
      reviews: { w0: { a: { hard: 'h' } }, bad: { a: {} } },
    });
    const b = core.readBackup(text);
    expect(b.settings?.cleanMode).toBe('step');
    expect(Object.keys(b.days)).toEqual(['2026-09-05']);
    expect(b.days['2026-09-05'].events[0].wt).toBe(10);
    expect(Object.keys(b.reviews)).toEqual(['w0']);
  });

  it('refuses a file that is not a Daybook backup', () => {
    expect(() => core.readBackup('{"app":"other","days":{}}')).toThrow('not a Daybook backup');
    expect(() => core.readBackup('not json')).toThrow();
  });

  it('round-trips through a backup file', () => {
    const s = snap();
    const b = core.readBackup(JSON.stringify(core.makeBackup(s)));
    expect(b.days).toEqual(s.days);
  });

  it('restoring keeps the answers added on both sides', () => {
    const here = snap();
    here.settings!.opts = { trig: [{ id: 'u_mine', t: 'Mine' }], did: [] };
    const b = core.readBackup(
      JSON.stringify({ app: 'daybook', settings: { start: '2026-09-01', opts: { trig: [{ id: 'u_theirs', t: 'Theirs' }], did: [] } }, days: {}, reviews: {} }),
    );
    const r = core.restoreBackup(here, b, 500).snap;
    expect(r.settings!.start).toBe('2026-09-01');
    expect(r.settings!.u).toBe(500);
    expect(r.settings!.opts.trig.map((x) => x.id).sort()).toEqual(['u_mine', 'u_theirs']);
  });
});

describe('sync records', () => {
  it('a newer record wins, an older one is ignored', () => {
    const s = snap();
    const newer = { id: 'days/2026-10-01', u: 200, data: { events: [], checkin: { done: true }, u: 200 } };
    const older = { id: 'settings', u: 50, data: { start: '2026-01-01' } };
    const r = core.applyRecords(s, [newer, older] as core.SyncRecord[]);
    expect(r.changed).toEqual(['days/2026-10-01']);
    expect(r.snap.days['2026-10-01'].checkin?.done).toBe(true);
    expect(r.snap.settings!.start).toBe('2026-09-20');
  });

  it('a deletion removes the record only when it is newer', () => {
    const s = snap();
    expect(core.applyRecords(s, [{ id: 'days/2026-10-01', u: 99, data: null }]).snap.days['2026-10-01']).toBeTruthy();
    expect(core.applyRecords(s, [{ id: 'days/2026-10-01', u: 101, data: null }]).snap.days['2026-10-01']).toBeUndefined();
    expect(core.applyRecords(s, [{ id: 'days/2026-10-02', u: 101, data: null }]).changed).toEqual([]);
  });

  it('ignores records with bad ids or times', () => {
    const bad = [
      { id: 'days/yesterday', u: 1, data: {} },
      { id: 'secrets', u: 1, data: {} },
      { id: 'reviews/x1', u: 1, data: {} },
      { id: 'settings', u: Number.NaN, data: {} },
    ];
    expect(core.applyRecords(snap(), bad as core.SyncRecord[]).changed).toEqual([]);
  });

  it('turns a snapshot into records and back', () => {
    const s = snap();
    const recs = core.toRecords(s);
    expect(recs.map((r) => r.id)).toEqual(['settings', 'days/2026-10-01']);
    const empty: core.Snapshot = { settings: null, days: {}, reviews: {} };
    const back = core.applyRecords(empty, recs).snap;
    expect(back.days).toEqual(s.days);
    expect(back.settings).toEqual(s.settings);
  });
});

it('a request the sync API turns down: the gateway ceiling retries once, the allowance and size pause', () => {
  expect(core.syncFailure(429, false, false)).toBe('retry');
  expect(core.syncFailure(429, false, true)).toBe('error');
  expect(core.syncFailure(429, true, false)).toBe('pause');
  expect(core.syncFailure(413, true, false)).toBe('pause');
  expect(core.syncFailure(500, false, false)).toBe('error');
});

it('the dirty list keeps another tab’s marks, and never one this copy already sent', () => {
  /* this copy had days/a at 5 and sent it; the other tab marked days/b; days/c was changed in both, the other tab later */
  const stored = { 'days/a': 5, 'days/b': 7, 'days/c': 9 };
  const mine = { 'days/c': 8, settings: 3 };
  const seen = { 'days/a': 5, 'days/c': 8, settings: 3 };
  expect(core.mergeDirty(stored, mine, seen)).toEqual({ 'days/b': 7, 'days/c': 9, settings: 3 });
  /* the other tab changed days/a again after this copy sent it: kept */
  expect(core.mergeDirty({ 'days/a': 6 }, {}, { 'days/a': 5 })).toEqual({ 'days/a': 6 });
});
