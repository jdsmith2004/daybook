import { describe, expect, it } from 'vitest';
import * as core from '../src/index';

const K = '2026-10-15';

describe('changing the log', () => {
  it('adds an entry with the legacy defaults and a change time that moves forward', () => {
    const a = core.addEvent({}, K, 'rode', '22:10', {}, 1000);
    const d = a.days[K];
    expect(d.events).toEqual([{ id: a.id, time: '22:10', outcome: 'rode', trigger: null, paused: null, did: null, recovered: false, note: '' }]);
    expect(d.u).toBe(1000);
    const b = core.patchEvent(a.days, K, a.id, { recovered: true }, 500); // a clock that went back still moves forward
    expect(b[K].u).toBe(1001);
  });

  it('removes a day when nothing is left in it, so sync removes it everywhere', () => {
    const a = core.addEvent({}, K, 'slipped', '23:00', {}, 1000);
    const b = core.removeEvent(a.days, K, a.id, 2000);
    expect(b[K]).toBeUndefined();
  });

  it('drops a check-in with nothing in it', () => {
    const d = core.changeDay(null, K, (x) => void (x.checkin = core.normCheckin({ so: 'Y' })), 1)!;
    expect(d.checkin?.so).toBe('Y');
    const e = core.changeDay(d, K, (x) => void (x.checkin!.so = null), 2);
    expect(e).toBeNull();
  });

  it('moves an entry to another day', () => {
    const a = core.addEvent({}, K, 'rode', '23:50', {}, 1000);
    const b = core.moveEvent(a.days, K, '2026-10-14', a.id, { time: '01:10' }, 2000);
    expect(b[K]).toBeUndefined();
    expect(b['2026-10-14'].events[0]).toMatchObject({ id: a.id, time: '01:10' });
  });

  it('a new id every time', () => {
    const ids = new Set(Array.from({ length: 500 }, () => core.makeId(1000)));
    expect(ids.size).toBe(500);
  });
});

describe('answers of your own', () => {
  const st = () => core.normSettings({ start: '2026-10-01', u: 1 });

  it('reuses a built-in answer with the same words', () => {
    const r = core.addOption(st(), 'trig', '  bored OR idle ');
    expect(r.id).toBe('bored');
    expect(r.st.opts.trig).toEqual([]);
  });

  it('adds one, reuses it, and brings back a removed one', () => {
    const a = core.addOption(st(), 'trig', 'Work stress', 100);
    expect(a.id).toMatch(/^u_[a-z0-9]{3,16}$/);
    expect(core.addOption(a.st, 'trig', 'work stress').id).toBe(a.id);
    const days = { [K]: core.normDay({ events: [{ id: 'e', outcome: 'slipped', trigger: a.id }] }, K) };
    const hidden = core.removeOption(a.st, days, 'trig', a.id!);
    expect(hidden.opts.trig[0].off).toBe(true);
    const back = core.addOption(hidden, 'trig', 'Work stress');
    expect(back.id).toBe(a.id);
    expect(back.st.opts.trig[0].off).toBeUndefined();
    expect(core.removeOption(a.st, {}, 'trig', a.id!).opts.trig).toEqual([]);
  });

  it('says so when the list is full', () => {
    let s = st();
    for (let i = 0; i < core.OPT_MAX; i++) s = core.addOption(s, 'did', 'Thing ' + i).st;
    expect(core.addOption(s, 'did', 'One more').id).toBeNull();
  });
});
